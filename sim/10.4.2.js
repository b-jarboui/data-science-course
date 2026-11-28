// 10.4.2 Try it: edit the clinic data and replay the smaller model.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [1, 1, 3, 5];
  const ROWS = ['Reminder · AM', 'Reminder · PM', 'No text · AM', 'No text · PM'];
  const RED = '#fb7185';
  const PAIRS = {
    AB: { small: 'A', big: 'B', smallColor: C.amber, bigColor: C.cyan, df: 1, cutoff: 3.84 },
    BC: { small: 'B', big: 'C', smallColor: C.cyan, bigColor: C.pink, df: 2, cutoff: 5.99 }
  };

  let counts = START.slice(), comparison = 'AB';
  let bins = Array(12).fill(0), trials = 0, reached = 0, last = null;
  let timer = null;
  let observed = measure(counts, comparison);

  const svg = s('svg', {
    viewBox: '0 0 400 333', role: 'img',
    'aria-label': 'Clinic appointment dots and a histogram of fit gains from chance replays'
  });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const replayStatus = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeHost = h('div');

  const selector = h('select', { class: 'sim-btn', 'aria-label': 'Models to compare', onchange: e => {
    comparison = e.currentTarget.value;
    changed();
  } },
  h('option', { value: 'AB' }, 'A and B · add reminders'),
  h('option', { value: 'BC' }, 'B and C · add time of day'));

  const controls = ROWS.map((name, i) => {
    const output = h('output', {}, `${counts[i]} missed`);
    const input = h('input', {
      type: 'range', min: 0, max: 10, step: 1, value: counts[i],
      'aria-label': `${name}, number missed`,
      style: { width: '100%', minHeight: '44px', margin: 0, accentColor: RED },
      oninput: e => {
        counts[i] = Number(e.currentTarget.value);
        changed();
      }
    });
    const element = h('label', { style: {
      display: 'grid', gridTemplateColumns: '1fr auto', gap: '0 .5rem',
      alignItems: 'center', marginTop: '.55rem'
    } }, h('span', {}, name), output, h('span', { style: { gridColumn: '1 / -1' } }, input));
    return { input, output, element };
  });

  const speed = h('input', {
    type: 'range', min: 5, max: 100, step: 5, value: 25,
    'aria-label': 'Replays per second', style: { minHeight: '44px', accentColor: C.cyan },
    oninput: e => { speedLabel.textContent = `${e.currentTarget.value} replays/sec`; }
  });
  const speedLabel = h('output', {}, '25 replays/sec');
  const playButton = btn('Play', toggle, 'go');
  const stepButton = btn('Step', () => {
    stop();
    run(1);
    replayStatus.textContent = `Replay ${trials} complete.`;
  });
  const resetButton = btn('Reset replays', () => {
    resetReplays();
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how big a gain can chance give?'),
    h('p', { class: 'sub' },
      'Change how many appointments were missed. Then replay the clinic using the smaller model’s fitted chances and see how often the fit gain reaches yours.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0 } }, selector),
        svg,
        h('div', { class: 'sim-row' }, stepButton, playButton, resetButton),
        h('label', { class: 'sim-row', style: { gap: '.4rem' } }, 'Speed', speed, speedLabel),
        replayStatus,
        ...controls.map(control => control.element),
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Clinic example', () => {
            counts = START.slice();
            comparison = 'AB';
            selector.value = comparison;
            changed();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost)
      )
    )
  ));

  const challenge = challenges(challengeHost, [
    {
      text: 'Choose A and B, then make the two reminder groups miss equally often.',
      check: st => st.comparison === 'AB' && st.counts[0] + st.counts[1] === st.counts[2] + st.counts[3],
      why: 'When both groups have the same missed share, separate chances give the same fit as one shared chance.'
    },
    {
      text: 'Choose A and B, then change the clinic example so that the fit gain passes 3.84.',
      check: st => st.comparison === 'AB' && st.gain > PAIRS.AB.cutoff &&
        st.counts.some((value, i) => value !== START[i]),
      why: 'A large enough gap between the reminder groups can push the fit gain past the 5-in-100 cutoff.'
    },
    {
      text: 'Choose B and C, then collect at least 200 replays for a gain below 5.99.',
      check: st => st.comparison === 'BC' && st.trials >= 200 && st.gain < PAIRS.BC.cutoff,
      why: 'This gain falls below the cutoff, so the test keeps B with a single chance for each reminder group.'
    }
  ]);
  challengeHost.addEventListener('click', () => updateChallenge());

  function logFit(k, n) {
    if (k === 0 || k === n) return 0;
    return k * Math.log(k / n) + (n - k) * Math.log1p(-k / n);
  }

  function measure(data, pair) {
    const reminder = data[0] + data[1], noReminder = data[2] + data[3];
    const a = logFit(reminder + noReminder, 40);
    const b = logFit(reminder, 20) + logFit(noReminder, 20);
    const c = data.reduce((sum, k) => sum + logFit(k, 10), 0);
    const [small, big] = pair === 'AB' ? [a, b] : [b, c];
    return {
      small: small === 0 ? 0 : -2 * small,
      big: big === 0 ? 0 : -2 * big,
      gain: Math.max(0, 2 * (big - small))
    };
  }

  function chiTail(gain, df) {
    if (gain === 0) return 1;
    if (df === 2) return Math.exp(-gain / 2);
    // Polynomial approximation to erfc(sqrt(gain / 2)).
    const x = Math.sqrt(gain / 2);
    const t = 1 / (1 + 0.3275911 * x);
    const polynomial = (((((1.061405429 * t - 1.453152027) * t) +
      1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return polynomial * Math.exp(-x * x);
  }

  function sampleRow(p) {
    let missed = 0;
    for (let i = 0; i < 10; i++) {
      if (Math.random() < p) missed++;
    }
    return missed;
  }

  function newData() {
    const reminder = rnd(1, 7) / 10;
    const noReminder = rnd(1, 7) / 10;
    counts = [sampleRow(reminder), sampleRow(reminder), sampleRow(noReminder), sampleRow(noReminder)];
    changed();
  }

  function nullRates() {
    const reminder = counts[0] + counts[1], noReminder = counts[2] + counts[3];
    return comparison === 'AB'
      ? Array(4).fill((reminder + noReminder) / 40)
      : [reminder / 20, reminder / 20, noReminder / 20, noReminder / 20];
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function resetReplays() {
    stop();
    bins = Array(12).fill(0);
    trials = 0;
    reached = 0;
    last = null;
    replayStatus.textContent = '';
  }

  function changed() {
    resetReplays();
    observed = measure(counts, comparison);
    controls.forEach(({ input, output }, i) => {
      input.value = counts[i];
      input.setAttribute('aria-valuetext', `${counts[i]} missed out of 10`);
      output.textContent = `${counts[i]} missed`;
    });
    draw();
  }

  function run(n) {
    const rates = nullRates();
    for (let i = 0; i < n; i++) {
      const data = rates.map(sampleRow);
      const scores = measure(data, comparison);
      bins[Math.min(bins.length - 1, Math.floor(scores.gain))]++;
      trials++;
      if (scores.gain + 1e-10 >= observed.gain) reached++;
      last = { data, ...scores };
    }
    draw();
  }

  function toggle() {
    if (timer !== null) {
      stop();
      replayStatus.textContent = `Paused at ${trials} replays.`;
      return;
    }
    playButton.textContent = 'Pause';
    replayStatus.textContent = 'Replaying the clinic.';
    timer = setInterval(() => run(Number(speed.value) / 5), 200);
  }

  function updateChallenge() {
    challenge.update({ comparison, counts, gain: observed.gain, trials });
  }

  const x0 = 42, x1 = 379, bottom = 257, top = 145;
  const plotX = gain => x0 + Math.min(bins.length, gain) * (x1 - x0) / bins.length;
  const text = (str, x, y, fill = C.ink, size = 13, anchor = 'start') =>
    s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor }, str);
  const line = (x1, y1, x2, y2, stroke, attributes = {}) =>
    s('line', { x1, y1, x2, y2, stroke, ...attributes });
  const percent = p => p > 0 && p < 0.001 ? '< 0.1%' : `${(p * 100).toFixed(1)}%`;

  function draw() {
    const pair = PAIRS[comparison];
    const picture = [
      text('Your 40 appointments', 12, 18, C.ink, 15),
      text('● missed', 281, 18, RED, 13),
      text('● kept', 346, 18, C.ink, 13)
    ];
    ROWS.forEach((name, i) => {
      const y = 40 + i * 19;
      picture.push(text(name, 12, y + 4, i < 2 ? C.cyan : C.ink));
      for (let j = 0; j < 10; j++) {
        const cx = 158 + j * 22;
        const color = j < counts[i] ? RED : C.ink;
        picture.push(s('circle', { cx, cy: y, r: 7.6, fill: color, opacity: 0.13 }),
          s('circle', { cx, cy: y, r: 4.6, fill: color }));
      }
    });

    picture.push(text(`${trials.toLocaleString()} replays under Model ${pair.small}`, 12, 130, C.ink, 15));
    const maxCount = Math.max(1, ...bins);
    const barWidth = (x1 - x0) / bins.length;
    bins.forEach((n, i) => {
      if (!n) return;
      const height = (bottom - top) * n / maxCount;
      picture.push(s('rect', {
        x: plotX(i) + 1, y: bottom - height, width: barWidth - 2,
        height, fill: C.cyan, opacity: 0.74, rx: 1.5
      }));
    });
    const cutX = plotX(pair.cutoff), observedX = plotX(observed.gain);
    picture.push(
      line(x0, top, x0, bottom, C.muted),
      line(x0, bottom, x1, bottom, C.muted),
      line(cutX, top, cutX, bottom, C.amber, { 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
      line(observedX, top, observedX, bottom, C.green, { 'stroke-width': 2 }),
      ...[0, 2, 4, 6, 8, 10, 11].map(v =>
        text(v === 11 ? '11+' : String(v), plotX(v), bottom + 17, C.ink, 12, 'middle')),
      text('Fit gain', (x0 + x1) / 2, bottom + 36, C.ink, 14, 'middle'),
      text(`– – Cutoff ${pair.cutoff}`, x0, bottom + 60, C.amber, 13),
      text(`— Your gain ${observed.gain.toFixed(1)}`, x1, bottom + 60, C.green, 13, 'end')
    );
    svg.replaceChildren(...picture);

    const rates = nullRates();
    const rateLine = comparison === 'AB'
      ? `Replay chance: ${percent(rates[0])} for all`
      : `Replay chances: ${percent(rates[0])} / ${percent(rates[2])}`;
    const formula = [
      [`${pair.small} deviance: ${observed.small.toFixed(1)}`, pair.smallColor],
      [`${pair.big} deviance: ${observed.big.toFixed(1)}`, pair.bigColor],
      [`Fit gain: ${observed.gain.toFixed(1)}`, C.green],
      `${pair.df} ${pair.df === 1 ? 'degree' : 'degrees'} of freedom`,
      `Chi-square p-value: ${percent(chiTail(observed.gain, pair.df))}`,
      rateLine
    ];
    if (last) {
      formula.push(
        `Replays reaching your gain: ${reached}/${trials}`,
        `Latest misses: ${last.data.join(' · ')}`,
        `Latest deviances: ${last.small.toFixed(1)} / ${last.big.toFixed(1)}`,
        `Latest gain: ${last.gain.toFixed(1)}`
      );
    }
    fbox(box, formula);

    const reject = observed.gain > pair.cutoff;
    const decision = reject ? `Favor Model ${pair.big}.` : `Keep Model ${pair.small}.`;
    const comparisonText = reject ? 'above' : 'at or below';
    note.textContent = `Your gain is ${comparisonText} the 5-in-100 cutoff. ${decision}`;
    svg.setAttribute('aria-label',
      `Four rows of ten appointments, with ${counts.join(', ')} misses. ` +
      `${trials} replays. Your fit gain is ${observed.gain.toFixed(1)} and the cutoff is ${pair.cutoff}.`);
    updateChallenge();
  }

  changed();
  return stop;
}

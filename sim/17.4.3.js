// 17.4.3 Try it: change readings and keep shares, then step through the memory cell.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TIMES = ['9:00', '9:10', '9:20', '9:30'];
  const START = [21, 22, 21, 23];
  const KEEP = [1, 1, 0.5];
  const COUNT = KEEP.length;
  let temperatures = START.slice();
  let shares = KEEP.slice();
  let iteration = 0;
  let timer = null;

  const network = s('svg', { viewBox: '0 0 360 205', role: 'img' });
  const chart = s('svg', { viewBox: '0 0 360 166', role: 'img' });
  const box = h('div', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const counter = h('p', { class: 'sim-note' });
  const challengeRoot = h('div');
  const stepButton = btn('Step', () => advance(), 'go');
  const playButton = btn('Play', () => {
    if (timer !== null) {
      pause();
      draw();
      return;
    }
    if (iteration === COUNT) iteration = 0;
    schedule();
    draw();
  });

  function slider(min, max, step, value, label, oninput) {
    return h('input', {
      type: 'range', min, max, step, value, 'aria-label': label, oninput,
      style: { width: '100%', minHeight: '32px', accentColor: C.cyan }
    });
  }

  const speed = slider(0.5, 2, 0.25, 1, 'Playback speed', () => {
    speedValue.textContent = `${fmt(Number(speed.value))}×`;
    if (timer !== null) {
      pause();
      schedule();
    }
  });
  const speedValue = h('output', {}, '1×');
  const readingControls = TIMES.map((time, i) => {
    const input = slider(18, 30, 1, temperatures[i], `${time} temperature`, () => {
      temperatures[i] = Number(input.value);
      draw();
    });
    const output = h('output');
    return { input, output, element: h('label', {}, `${time} `, output, input) };
  });
  const keepControls = KEEP.map((value, i) => {
    const input = slider(0, 1, 0.25, value, `${TIMES[i]} keep share`, () => {
      shares[i] = Number(input.value);
      draw();
    });
    const output = h('output');
    return { input, output, element: h('label', {}, `${TIMES[i]} `, output, input) };
  });
  const controlGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(7rem, 1fr))', gap: '0.35rem 0.8rem' };

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: LSTM memory'),
    h('p', { class: 'sub' }, 'Change a Central reading or a keep share. Press Step to see how much old memory stays and how much the reading adds.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        network, counter,
        h('div', { class: 'sim-row' },
          stepButton, playButton,
          btn('Reset', () => {
            pause();
            temperatures = START.slice();
            shares = KEEP.slice();
            iteration = 0;
            speed.value = '1';
            speedValue.textContent = '1×';
            draw();
          }),
          btn('New data', () => {
            pause();
            const next = TIMES.map(() => rnd(18, 30));
            if (next.every((value, i) => value === temperatures[i])) {
              next[0] = next[0] === 30 ? 29 : next[0] + 1;
            }
            temperatures = next;
            iteration = 0;
            draw();
          })),
        h('label', { class: 'sim-note', style: { display: 'block' } }, 'Speed ', speedValue, speed),
        h('fieldset', {}, h('legend', {}, 'Central temperatures'),
          h('div', { style: controlGrid }, readingControls.map(control => control.element))),
        h('fieldset', { style: { marginTop: '0.7rem' } }, h('legend', {}, 'Keep shares'),
          h('div', { style: controlGrid }, keepControls.map(control => control.element)))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, chart,
          h('p', { class: 'sim-note' },
            'For this activity, use 20 plus the cell as the next temperature guess. Loss is the squared gap between the guess and the next reading. It can rise or fall as the readings change.')),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const challenge = challenges(challengeRoot, [
    { text: 'With the starting data, set the 9:20 keep share to 0 and step to 9:20.',
      check: ({ step, starting }) => starting && step?.i === 2 && step.old === 3
        && step.share === 0 && step.cell === 1,
      why: 'The gate clears all 3 units of old memory, then the reading adds 1.' },
    { text: 'Keep the starting temperatures and make the cell hold exactly 2 at 9:20.',
      check: ({ step, starting }) => starting && step?.i === 2 && step.cell === 2,
      why: 'The gate keeps 1 unit of old memory and the reading adds 1 more.' },
    { text: 'At 9:20, can you make the next guess match the 9:30 reading without changing any starting temperatures?',
      check: ({ step, starting }) => starting && step?.i === 2 && step.loss === 0,
      why: 'A cell of 3 gives a guess of 23°C, exactly the next reading.' }
  ]);

  function results() {
    const steps = [];
    let cell = 0;
    for (let i = 0; i < COUNT; i++) {
      const old = cell;
      const share = shares[i];
      const kept = old * share;
      const fresh = temperatures[i] - 20;
      cell = kept + fresh;
      const forecast = 20 + cell;
      const observed = temperatures[i + 1];
      const loss = (forecast - observed) ** 2;
      steps.push({ i, old, share, kept, fresh, cell, forecast, observed, loss });
    }
    return steps;
  }

  function pause() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function advance() {
    if (iteration < COUNT) iteration++;
    if (iteration === COUNT) pause();
    draw();
  }

  function schedule() {
    timer = setTimeout(() => {
      timer = null;
      if (iteration < COUNT - 1) schedule();
      advance();
    }, 1250 / Number(speed.value));
  }

  function svgText(x, y, text, color = C.ink, size = 13) {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'font-family': 'Segoe UI, Arial, sans-serif',
      'text-anchor': 'middle', 'dominant-baseline': 'middle'
    }, text);
  }

  function drawNetwork(step) {
    const parts = [s('rect', { x: 0, y: 0, width: 360, height: 205, rx: 10, fill: C.bg })];
    for (let x = 10; x < 360; x += 20) {
      parts.push(s('line', { x1: x, x2: x, y1: 0, y2: 205, stroke: C.line, opacity: 0.36 }));
    }
    for (let y = 10; y < 205; y += 20) {
      parts.push(s('line', { x1: 0, x2: 360, y1: y, y2: y, stroke: C.line, opacity: 0.36 }));
    }
    TIMES.forEach((time, i) => {
      const x = 45 + i * 90;
      const active = step?.i === i;
      parts.push(s('rect', {
        x: x - 37, y: 9, width: 74, height: 48, rx: 8,
        fill: C.card, stroke: active ? C.amber : C.cyan, 'stroke-width': active ? 2.5 : 1
      }), svgText(x, 22, time, C.cyan, 12), svgText(x, 42, `${temperatures[i]}°C`, C.ink, 17));
    });

    const nodes = [
      [61, 103, 'Old cell', step ? fmt(step.old) : '0', C.violet],
      [61, 169, 'Reading', step ? fmt(step.fresh) : '–', C.violet],
      [179, 103, 'Forget gate', step ? fmt(step.share) : '–', C.cyan],
      [179, 169, 'Fresh amount', step ? fmt(step.fresh) : '–', C.cyan],
      [297, 136, 'New cell', step ? fmt(step.cell) : '–', C.amber]
    ];
    const links = [
      [0, 2, C.cyan, 3], [1, 2, C.pink, 2], [1, 3, C.cyan, 4],
      [2, 4, C.cyan, 3], [3, 4, C.cyan, 3]
    ];
    links.forEach(([a, b, color, width]) => {
      const [x1, y1] = nodes[a];
      const [x2, y2] = nodes[b];
      const length = Math.hypot(x2 - x1, y2 - y1);
      const dx = (x2 - x1) * 21 / length;
      const dy = (y2 - y1) * 21 / length;
      parts.push(s('line', {
        x1: x1 + dx, y1: y1 + dy, x2: x2 - dx, y2: y2 - dy,
        stroke: color, 'stroke-width': width, opacity: step ? 0.8 : 0.42
      }));
    });
    nodes.forEach(([x, y, name, value, color]) => {
      parts.push(svgText(x, y - 28, name, color, 12),
        s('circle', { cx: x, cy: y, r: 20, fill: C.card, stroke: color, 'stroke-width': 2 }),
        svgText(x, y, value, C.ink, value.length > 4 ? 11 : 15));
    });
    network.setAttribute('aria-label', step
      ? `${TIMES[step.i]}. Old cell ${fmt(step.old)}, keep share ${fmt(step.share)}, fresh amount ${fmt(step.fresh)}, new cell ${fmt(step.cell)}.`
      : 'Four Central temperatures in time order. The memory cell starts at zero.');
    network.replaceChildren(...parts);
  }

  function drawChart(history) {
    const x0 = 53, x1 = 331, y0 = 123, y1 = 35;
    const maxLoss = Math.max(1, Math.ceil(Math.max(0, ...history.map(step => step.loss))));
    const stepX = i => x0 + (i + 1) * (x1 - x0) / COUNT;
    const lossY = loss => y0 - loss * (y0 - y1) / maxLoss;
    const parts = [svgText(180, 15, 'Loss by iteration', C.ink, 15)];
    [0, maxLoss / 2, maxLoss].forEach(value => {
      const y = lossY(value);
      parts.push(s('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: C.line }),
        svgText(25, y, fmt(value), C.muted, 12));
    });
    parts.push(s('line', { x1: x0, x2: x0, y1, y2: y0, stroke: C.muted }));
    for (let i = 0; i < COUNT; i++) parts.push(svgText(stepX(i), 143, String(i + 1), C.muted, 13));

    if (history.length > 1) {
      parts.push(s('polyline', {
        points: history.map(step => `${stepX(step.i)},${lossY(step.loss)}`).join(' '),
        fill: 'none', stroke: C.amber, 'stroke-width': 2.5
      }));
    }
    history.forEach(step => parts.push(s('circle', {
      cx: stepX(step.i), cy: lossY(step.loss), r: 4.5, fill: C.amber
    }, s('title', {}, `Iteration ${step.i + 1}, loss ${fmt(step.loss)}`))));
    if (!history.length) parts.push(svgText(189, 76, 'Step to see the first loss', C.muted));
    chart.setAttribute('aria-label', history.length
      ? `Loss by iteration. ${history.map(step => `Iteration ${step.i + 1}: ${fmt(step.loss)}`).join('. ')}.`
      : 'Loss by iteration. No steps yet.');
    chart.replaceChildren(...parts);
  }

  function draw() {
    const history = results().slice(0, iteration);
    const step = history.at(-1);
    drawNetwork(step);
    drawChart(history);
    counter.textContent = `Iteration ${iteration} of ${COUNT}`;
    stepButton.disabled = iteration === COUNT;
    playButton.textContent = timer !== null ? 'Pause' : iteration === COUNT ? 'Replay' : 'Play';
    readingControls.forEach(({ input, output }, i) => {
      input.value = temperatures[i];
      output.textContent = `${temperatures[i]}°C`;
    });
    keepControls.forEach(({ input, output }, i) => {
      input.value = shares[i];
      output.textContent = fmt(shares[i]);
    });

    if (step) {
      const fresh = fmt(Math.abs(step.fresh));
      const sign = step.fresh < 0 ? '−' : '+';
      fbox(box, [
        `${TIMES[step.i]}  ·  Keep share ${fmt(step.share)}`,
        `Kept = ${fmt(step.old)} × ${fmt(step.share)} = ${fmt(step.kept)}`,
        `Fresh = ${temperatures[step.i]} − 20 = ${fmt(step.fresh)}`,
        [`New cell = ${fmt(step.kept)} ${sign} ${fresh} = ${fmt(step.cell)}`, C.amber],
        `Next guess = ${fmt(step.forecast)}°C`,
        `Next reading = ${step.observed}°C`,
        `Loss = (${fmt(step.forecast)} − ${step.observed})² = ${fmt(step.loss)}`
      ]);
    } else {
      fbox(box, [['Starting cell = 0', C.amber], 'New cell = old cell × keep share', '           + fresh amount']);
    }
    challenge.update({ step, starting: temperatures.every((value, i) => value === START[i]) });
  }

  draw();
  return pause;
}

// 20.2.8 Try it: learn from a pair of replies.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [40, 40, 15, 5];
  const names = ['A', 'B', 'C', 'D'];
  const colors = [C.cyan, C.amber, C.pink, C.violet];
  const pairs = [[0, 1], [1, 2]];
  let reference = START.slice();
  let scores, current, history, last, firstPrediction;
  let timer = null;
  let playing = false;

  const svg = s('svg', {
    viewBox: '0 0 360 376', role: 'img',
    'aria-label': 'Reply chances and loss by training step',
  });
  const stepLabel = h('strong', { 'aria-live': 'polite' });
  const box = h('div');
  const challengeBox = h('div');
  const pairInput = h('select', { class: 'sim-btn', onchange: restart },
    h('option', { value: '0' }, 'A over B'),
    h('option', { value: '1' }, 'B over C'));
  const prediction = h('select', { class: 'sim-btn' },
    h('option', { value: '' }, 'Choose a prediction'),
    h('option', { value: 'A' }, 'A gains chance'),
    h('option', { value: 'B' }, 'B gains chance'),
    h('option', { value: 'same' }, 'Neither changes'));
  const rateLabel = h('span');
  const speedLabel = h('span');
  const rateInput = h('input', {
    type: 'range', min: 0, max: 3, step: 0.1, value: 1,
    oninput: () => { rateLabel.textContent = `Learning rate ${fmt(Number(rateInput.value))}`; },
  });
  const speedInput = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: 2,
    oninput: () => {
      speedLabel.textContent = `Speed ${speedInput.value} steps per second`;
      if (playing) schedule();
    },
  });
  const playButton = btn('Play', togglePlay);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: learn from a choice'),
    h('p', { class: 'sub' },
      'The library closes at six. A says “At six.”, B gives the long correct answer, C says “At nine.”, and D repeats “At six!”'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' }, stepLabel),
        h('div', { class: 'sim-row' },
          btn('Step', iterate, 'go'), playButton, btn('Reset', restart), btn('New data', newData)),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Human choice ', pairInput),
          h('label', {}, 'What will happen? ', prediction)),
        h('div', { class: 'sim-row' },
          h('label', {}, rateLabel, h('br'), rateInput),
          h('label', {}, speedLabel, h('br'), speedInput))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeBox)))));

  const tasks = challenges(challengeBox, [
    {
      text: 'With A over B and a learning rate of 1, predict which reply gains chance, then press Play.',
      check: st => st.firstPrediction?.choice === 'A' && st.firstPrediction?.aGained,
      why: 'A gains chance because the first step raises A’s score and lowers B’s.',
    },
    {
      text: 'Reset and reach a loss of 0.20 or less in one step.',
      check: st => st.iteration === 1 && st.loss <= 0.20,
      why: 'A larger learning rate can make the preferred reply gain more in one step.',
    },
    {
      text: 'Find a learning rate that leaves the loss unchanged for two steps.',
      check: st => st.iteration >= 2 && st.loss === st.initialLoss && st.lastRate === 0,
      why: 'At a learning rate of zero, every score change is zero.',
    },
    {
      text: 'Choose B over C and take a step that makes B gain chance and C lose chance.',
      check: st => st.pair === 1 && st.shares[1] > st.reference[1] && st.shares[2] < st.reference[2],
      why: 'That comparison raises the correct long reply’s score and lowers the wrong reply’s score.',
    },
  ]);

  function measure() {
    const [chosen, rejected] = pairs[Number(pairInput.value)];
    // Logits start at ln(reference share). The two softmax normalizers
    // cancel in the difference of log chance ratios.
    const logits = reference.map((share, i) => Math.log(share / 100) + scores[i]);
    const largest = Math.max(...logits);
    const weights = logits.map(z => Math.exp(z - largest));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const margin = scores[chosen] - scores[rejected];
    return {
      chosen, rejected, margin,
      shares: weights.map(weight => 100 * weight / total),
      win: 1 / (1 + Math.exp(-margin)),
      loss: Math.log1p(Math.exp(-margin)),
    };
  }

  function restart() {
    pause();
    scores = [0, 0, 0, 0];
    current = { ...measure(), shares: reference.slice() };
    history = [current.loss];
    last = null;
    firstPrediction = null;
    draw();
  }

  function newData() {
    const a = rnd(18, 48);
    const b = rnd(18, 38);
    const c = rnd(7, 30 - Math.max(0, a + b - 66));
    const next = [a, b, c, 100 - a - b - c];
    if (next.every((share, i) => share === reference[i])) {
      next[0]++;
      next[3]--;
    }
    reference = next;
    restart();
  }

  function iterate() {
    const before = current;
    const oldScores = scores.slice();
    const rate = Number(rateInput.value);
    const change = rate * (1 - before.win);
    scores[before.chosen] += change;
    scores[before.rejected] -= change;
    current = change === 0 ? before : measure();
    history.push(current.loss);
    last = { before, oldScores, rate, change };
    if (history.length === 2 && playing && pairInput.value === '0' && rate === 1) {
      firstPrediction = { choice: prediction.value, aGained: current.shares[0] > before.shares[0] };
    }
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      iterate();
      if (playing) schedule();
    }, 1000 / Number(speedInput.value));
  }

  function pause() {
    playing = false;
    clearTimeout(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function togglePlay() {
    if (playing) {
      pause();
      return;
    }
    playing = true;
    playButton.textContent = 'Pause';
    schedule();
  }

  function text(value, x, y, fill = C.ink, size = 13, anchor = 'start') {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, value);
  }

  function line(x1, y1, x2, y2, stroke = C.line) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': 1 });
  }

  function draw() {
    const iteration = history.length - 1;
    stepLabel.textContent = `Step ${iteration}`;
    const x0 = 42, x1 = 304;
    const shareX = p => x0 + (x1 - x0) * p / 100;
    const svgParts = [
      text('Reply chance', x0, 17, C.ink, 15),
      text('Reference outline / Learning fill', x0, 37, C.muted, 13),
    ];
    for (const p of [0, 50, 100]) {
      const x = shareX(p);
      svgParts.push(line(x, 49, x, 171), text(`${p}%`, x, 188, C.muted, 12, 'middle'));
    }
    current.shares.forEach((share, i) => {
      const y = 61 + 31 * i;
      svgParts.push(
        text(names[i], x0 - 13, y + 5, colors[i], 15, 'end'),
        s('rect', { x: x0, y: y - 9, width: shareX(reference[i]) - x0, height: 18,
          rx: 3, fill: C.line, stroke: C.muted, 'stroke-width': 1.5 }),
        s('rect', { x: x0, y: y - 4, width: shareX(share) - x0, height: 8, rx: 2, fill: colors[i] }),
        text(`${fmt(share)}%`, Math.max(shareX(share), shareX(reference[i])) + 6, y + 5, colors[i]),
      );
    });

    const gx0 = x0, gx1 = 330, gy0 = 327, gy1 = 230;
    const end = Math.max(4, iteration);
    const graphX = i => gx0 + (gx1 - gx0) * i / end;
    const graphY = loss => gy0 - (gy0 - gy1) * loss / 0.75;
    svgParts.push(text('Loss by step', gx0, 214, C.ink, 15));
    for (const tick of [0, 0.25, 0.5, 0.75]) {
      const y = graphY(tick);
      svgParts.push(line(gx0, y, gx1, y), text(fmt(tick), gx0 - 7, y + 4, C.muted, 12, 'end'));
    }
    for (const step of [0, Math.floor(end / 2), end]) {
      svgParts.push(text(String(step), graphX(step), 348, C.muted, 12, 'middle'));
    }
    svgParts.push(
      text('Step', (gx0 + gx1) / 2, 369, C.muted, 12, 'middle'),
      s('polyline', {
        points: history.map((loss, i) => `${graphX(i)},${graphY(loss)}`).join(' '),
        fill: 'none', stroke: C.violet, 'stroke-width': 2.5, 'stroke-linejoin': 'round',
      }),
      s('circle', { cx: graphX(iteration), cy: graphY(current.loss), r: 4, fill: C.violet }),
    );
    svg.replaceChildren(...svgParts);

    const { chosen, rejected, margin, win, loss } = current;
    const chosenName = names[chosen], rejectedName = names[rejected];
    const fixed = names.map((name, i) => `${name} ${reference[i]}%`).join('   ');
    const pct = p => `${fmt(100 * p)}%`;
    const formula = [
      `Human choice  ${chosenName} over ${rejectedName}`,
      `Fixed chances  ${fixed}`,
    ];
    if (last) {
      formula.push(
        `Change = ${fmt(last.rate)} × (1 − ${fmt(last.before.win)})`,
        [`       ≈ ${fmt(last.change)}`, C.amber],
        [`${chosenName} score shift  ${fmt(last.oldScores[chosen])} → ${fmt(scores[chosen])}`, colors[chosen]],
        [`${rejectedName} score shift  ${fmt(last.oldScores[rejected])} → ${fmt(scores[rejected])}`, colors[rejected]],
        `Margin  ${fmt(last.before.margin)} → ${fmt(margin)}`,
        `${chosenName} wins  ${pct(last.before.win)} → ${pct(win)}`,
        [`Loss  ${fmt(last.before.loss)} → ${fmt(loss)}`, C.violet],
      );
    } else {
      formula.push('Score shifts start at 0', 'Margin  0', `${chosenName} wins  50%`, [`Loss  ${fmt(loss)}`, C.violet]);
    }
    fbox(box, formula);
    tasks.update({
      iteration, loss, initialLoss: history[0], lastRate: last?.rate, firstPrediction,
      pair: Number(pairInput.value), shares: current.shares, reference,
    });
  }

  rateLabel.textContent = 'Learning rate 1';
  speedLabel.textContent = 'Speed 2 steps per second';
  restart();

  return pause;
}

// 20.2.1 Try it: take learning steps on one demonstration.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [0.5, 0.3, 0.2];
  const REPLIES = ['E', 'B', 'A'];
  const COLORS = [C.muted, '#a5baff', C.cyan];
  const ANSWERS = [
    'The gym closes at nine.',
    'Thanks for asking! The newsletter says the library will close at six this Friday for cleaning.',
    'At six.',
  ];
  const MAX_STEPS = 250;
  let seed = START.slice();
  let scores, probs, history, last;
  let target = 2;
  let rate = 1;
  let speed = 2;
  let running = false;
  let timer = null;
  let guess = '';
  let firstResult = null;

  const dec = value => value.toFixed(2);
  const pct = value => `${Number((value * 100).toFixed(1))}%`;
  const deltaText = value => value < 0 ? `−${dec(-value)}` : value > 0 ? `+${dec(value)}` : '0.00';
  const scoreText = value => dec(value).replace('-', '−');
  const lossOf = p => -Math.log(p[target]);

  function softmax(values) {
    const max = Math.max(...values);
    const weights = values.map(value => Math.exp(value - max));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map(weight => weight / total);
  }

  function nextStep() {
    const delta = probs.map((p, i) => rate * (Number(i === target) - p));
    const nextScores = scores.map((score, i) => score + delta[i]);
    const nextProbs = softmax(nextScores);
    return {
      target,
      rate,
      oldScores: scores,
      oldProbs: probs,
      oldLoss: lossOf(probs),
      delta,
      nextScores,
      nextProbs,
      nextLoss: lossOf(nextProbs),
    };
  }

  const svg = s('svg', { viewBox: '0 0 400 292', role: 'img' });
  const formula = h('div');
  const feedback = h('p', { class: 'sim-note', role: 'status' });
  const counter = h('span', { class: 'sim-pill' });
  const challengeHost = h('div');
  const legend = h('div', { class: 'sim-note' }, ...REPLIES.map((reply, i) => h('div', {},
    h('strong', { style: { color: COLORS[i] } }, `${reply} · `), ANSWERS[i])));

  const rateValue = h('span');
  const speedValue = h('span');
  const startValue = h('span');
  const rateSlider = h('input', {
    type: 'range', min: 0, max: 2, step: 0.05, value: rate,
    oninput: event => { rate = Number(event.target.value); render(); },
  });
  const speedSlider = h('input', {
    type: 'range', min: 0.5, max: 8, step: 0.5, value: speed,
    oninput: event => {
      speed = Number(event.target.value);
      if (running) schedule();
      render();
    },
  });
  const startSlider = h('input', {
    type: 'range', min: 5, max: 90, step: 1, value: 20,
    oninput: event => {
      const a = Number(event.target.value) / 100;
      const eShare = seed[0] / (seed[0] + seed[1]);
      seed = [(1 - a) * eShare, (1 - a) * (1 - eShare), a];
      reset();
    },
  });
  const answerSelect = h('select', {
    class: 'sim-btn',
    onchange: event => { target = Number(event.target.value); reset(); },
  },
    h('option', { value: 2 }, 'A · At six.'),
    h('option', { value: 0 }, 'E · The gym closes at nine.'),
  );
  const stepButton = btn('Step', () => {
    stop();
    step();
  }, 'go');
  const playButton = btn('Play', () => {
    if (running) {
      stop();
      render();
      return;
    }
    running = true;
    step();
    if (running) schedule();
  });
  const riseButton = btn('Chance rises', () => predict('rise'));
  const sameButton = btn('Chance stays the same', () => predict('same'));

  function slider(title, value, input) {
    return h('label', {
      style: { display: 'grid', gap: '.3rem', flex: '1 1 10rem', minWidth: '0' },
    }, h('span', {}, title, ' ', value), input);
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: learn from one answer'),
    h('p', { class: 'sub' }, 'The library closes at six on Friday for cleaning. A student asks when it closes. Choose an answer to teach, then watch its chance change.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg, legend,
        h('div', { class: 'sim-row' }, stepButton, playButton, counter),
        h('div', { class: 'sim-row' },
          btn('Reset', reset),
          btn('New data', newData),
          btn('Original data', () => { seed = START.slice(); reset(); })),
        h('div', { class: 'sim-row' }, slider('Learning rate', rateValue, rateSlider),
          slider('Steps per second', speedValue, speedSlider)),
        h('div', { class: 'sim-row' }, slider('Starting chance of A', startValue, startSlider)),
        h('div', { class: 'sim-row' }, h('label', { style: { display: 'grid', gap: '.3rem', minWidth: '0' } },
          'Demonstrated answer', answerSelect))),
      h('div', {},
        h('div', { class: 'sim-card' }, formula),
        h('div', { class: 'sim-card' }, challengeHost,
          h('div', { class: 'sim-row' }, riseButton, sameButton), feedback)))));

  const challenge = challenges(challengeHost, [
    {
      text: 'At a learning rate above zero, predict what happens to the demonstrated answer. Then press Step or Play.',
      check: state => state.first?.rate > 0 && state.first.correct,
      why: 'The demonstrated answer gets a higher score while the other scores fall, so its chance rises.',
    },
    {
      text: 'Use Original data and answer A. Get the loss to 0.30 or lower in two steps or fewer.',
      check: state => state.original && state.target === 2 && state.steps > 0 && state.steps <= 2 && state.loss <= 0.30,
      why: 'A larger learning rate makes bigger score changes, so A can reach the target chance in fewer steps.',
    },
    {
      text: 'Find a learning rate that leaves the loss unchanged after a step.',
      check: state => state.last?.rate === 0 && state.last.oldLoss === state.last.nextLoss,
      why: 'At a learning rate of zero, every score change is zero, so the chances and loss stay the same.',
    },
    {
      text: 'Teach reply E and make it more likely than the correct reply A.',
      check: state => state.target === 0 && state.steps > 0 && state.p[0] > state.p[2] && state.p[0] > state.start[0],
      why: 'Training raises the chance of the demonstrated reply even when it gives the wrong answer.',
    },
  ]);

  function stop() {
    running = false;
    clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      step();
      if (running) schedule();
    }, 1000 / speed);
  }

  function reset() {
    stop();
    probs = seed.slice();
    scores = probs.map(Math.log);
    history = [lossOf(probs)];
    last = null;
    firstResult = null;
    guess = '';
    render();
  }

  function newData() {
    const a = rnd(8, 75);
    const e = rnd(6, 94 - a);
    if (e / 100 === seed[0] && a / 100 === seed[2]) {
      seed = [(e + 1) / 100, (99 - a - e) / 100, a / 100];
    } else {
      seed = [e / 100, (100 - a - e) / 100, a / 100];
    }
    reset();
  }

  function step() {
    if (history.length > MAX_STEPS) {
      stop();
      render();
      return;
    }
    const next = nextStep();
    if (guess && firstResult === null) {
      const rises = next.rate > 0;
      firstResult = { rate: next.rate, correct: guess === (rises ? 'rise' : 'same'), rises };
    }
    last = next;
    scores = next.nextScores;
    probs = next.nextProbs;
    history.push(next.nextLoss);
    if (history.length > MAX_STEPS) stop();
    render();
  }

  function predict(value) {
    if (running) stop();
    guess = value;
    firstResult = null;
    render();
  }

  const svgText = (x, y, value, color = C.ink, extra = {}) => s('text', {
    x, y, fill: color, 'font-size': 15, 'font-family': 'Consolas, monospace', ...extra,
  }, value);
  const svgLine = (x1, y1, x2, y2, color = C.line) => s('line', {
    x1, y1, x2, y2, stroke: color, 'stroke-width': 1,
  });

  function draw() {
    const parts = [svgText(16, 21, 'REPLY CHANCES')];
    probs.forEach((p, i) => {
      const y = 34 + 27 * i;
      const width = 255 * p;
      parts.push(
        svgText(20, y + 12, REPLIES[i], COLORS[i], { 'font-weight': 700 }),
        s('rect', { x: 48, y, width: 255, height: 14, rx: 7, fill: C.bg, stroke: C.line }),
        s('rect', { x: 48, y: y - 2, width, height: 18, rx: 8, fill: COLORS[i], 'fill-opacity': 0.17 }),
        s('rect', { x: 48, y, width, height: 14, rx: 7, fill: COLORS[i] }),
        svgText(315, y + 12, pct(p), COLORS[i]),
      );
      if (i === target) parts.push(svgText(7, y + 12, '●', C.amber, { 'font-size': 10 }));
    });

    const steps = history.length - 1;
    const xMax = Math.max(10, Math.ceil(steps / 10) * 10);
    const yMax = Math.max(1, Math.ceil(history[0]));
    const left = 48, right = 372, top = 149, bottom = 247;
    const x = i => left + (right - left) * i / xMax;
    const y = value => bottom - (bottom - top) * value / yMax;
    parts.push(svgText(16, 132, 'LOSS BY STEP', C.amber));
    for (const tick of [0, yMax / 2, yMax]) {
      const ty = y(tick);
      parts.push(svgLine(left, ty, right, ty),
        svgText(left - 7, ty + 4, tick, C.muted, { 'text-anchor': 'end', 'font-size': 13 }));
    }
    parts.push(svgLine(left, top, left, bottom, C.muted));
    for (const tick of [0, xMax / 2, xMax]) {
      parts.push(svgText(x(tick), bottom + 19, tick, C.muted, { 'text-anchor': 'middle', 'font-size': 13 }));
    }
    parts.push(s('polyline', {
      points: history.map((value, i) => `${x(i)},${y(value)}`).join(' '),
      fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-linejoin': 'round',
    }), s('circle', { cx: x(steps), cy: y(history[steps]), r: 4.2, fill: C.amber }));
    svg.replaceChildren(...parts);
    svg.setAttribute('aria-label',
      `Step ${steps}. ${REPLIES.map((reply, i) => `Reply ${reply}: ${pct(probs[i])}`).join(', ')}. Loss ${dec(history[steps])}.`);
  }

  function render() {
    const steps = history.length - 1;
    const record = last ?? nextStep();
    const loss = history[steps];
    const original = seed.every((value, i) => Math.abs(value - START[i]) < 1e-9);
    const trained = REPLIES[record.target];
    const p = record.oldProbs[record.target];
    draw();
    counter.textContent = `Step ${steps} · Loss ${dec(loss)}`;
    counter.style.color = C.amber;
    rateValue.textContent = `(${rate})`;
    speedValue.textContent = `(${speed})`;
    startValue.textContent = `(${pct(seed[2])})`;
    startSlider.value = String(Math.round(seed[2] * 100));
    answerSelect.value = String(target);
    stepButton.disabled = steps >= MAX_STEPS;
    playButton.disabled = steps >= MAX_STEPS;
    playButton.textContent = running ? 'Pause' : 'Play';
    riseButton.setAttribute('aria-pressed', String(guess === 'rise'));
    sameButton.setAttribute('aria-pressed', String(guess === 'same'));
    feedback.textContent = firstResult
      ? (firstResult.rises ? 'The demonstrated answer’s chance rose.' : 'The demonstrated answer’s chance stayed the same.')
      : guess ? 'Prediction saved. Press Step or Play.' : '';

    fbox(formula, [
      [last ? `Step ${steps} · Answer ${trained}` : `Next step · Answer ${trained}`, C.cyan],
      `Loss before = −ln(${dec(p)}) ≈ ${dec(record.oldLoss)}`,
      `${trained} change = ${record.rate} × (1 − its chance)`,
      'Other changes = −rate × their chance',
      ...REPLIES.map((reply, i) => [
        `${reply} score: ${scoreText(record.oldScores[i])} (${deltaText(record.delta[i])}) → ${scoreText(record.nextScores[i])}`,
        COLORS[i],
      ]),
      'Chances after softmax',
      ...REPLIES.map((reply, i) => [
        `${reply}: ${pct(record.oldProbs[i])} → ${pct(record.nextProbs[i])}`, COLORS[i],
      ]),
      [`Loss: ${dec(record.oldLoss)} → ${dec(record.nextLoss)}`, C.amber],
    ]);
    challenge.update({ steps, loss, last, target, original, p: probs, start: seed, first: firstResult });
  }

  reset();
  return stop;
}

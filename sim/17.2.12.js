// Try it: compare a fixed slope with a slope that changes as weight A moves.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const START_WEIGHT = 2;
  const INITIAL_SLOPE = 2;
  const MAX_STEPS = 12;
  const BEST = -0.25;
  const CURVATURE = 11.5;
  const CAP = 4;
  const WIDTH = 360;
  const HEIGHT = 374;
  const orange = '#fb923c';
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const close = (a, b) => Math.abs(a - b) < 1e-8;
  const fmt = n => String(Number(n.toFixed(4)));
  const signed = n => n < 0 ? `(${fmt(n)})` : fmt(n);

  let fixedSlope = INITIAL_SLOPE;
  let history = [];
  let timer = null;
  let predictionCorrect = false;

  const svg = s('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img',
    'aria-label': 'Digit network, four step-size arrows, and loss by step' });
  const formula = h('div');
  const note = h('p', { class: 'sim-note' });
  const challengeHost = h('div');
  const counter = pill('STEP 0 / 12');
  const mode = h('select', { style: { font: 'inherit', minHeight: '44px', maxWidth: '100%' } },
    h('option', { value: 'fixed' }, 'Fixed slope'),
    h('option', { value: 'changing' }, 'Changing slope'));
  const prediction = h('input', { type: 'number', step: 'any', inputmode: 'decimal',
    required: true, 'aria-label': 'Predicted final weight', style: { width: '7rem', minHeight: '44px' } });
  const feedback = h('div', { class: 'sim-note', role: 'status' });

  function range(label, min, max, step, initial, change) {
    const readout = h('span');
    const input = h('input', { type: 'range', min, max, step, value: initial,
      style: { width: '100%', minHeight: '44px', accentColor: C.cyan } });
    const field = h('label', { style: { display: 'grid', flex: '1 1 9rem', minWidth: 0 } },
      h('span', {}, `${label} `, readout), input);
    const read = () => Number(input.value);
    const update = () => { readout.textContent = fmt(read()); };
    input.addEventListener('input', () => { update(); change(); });
    update();
    return { field, read };
  }

  const early = range('Early rate', 0.01, 0.30, 0.01, 0.20, restart);
  const late = range('Late rate', 0.01, 0.30, 0.01, 0.10, restart);
  const drop = range('Drop after step', 1, MAX_STEPS, 1, 2, restart);
  const speed = range('Steps per second', 1, 8, 1, 3, () => {
    if (timer !== null) {
      stop();
      start();
    }
  });
  mode.addEventListener('change', restart);

  const stepButton = btn('Step', () => { stop(); advance(); }, 'go');
  const playButton = btn('Play', () => {
    if (timer === null) start();
    else { stop(); draw(); }
  });
  const resetButton = btn('Reset', restart);
  const newDataButton = btn('New data', () => {
    // Choose a different slope from 0.8, 0.9, …, 2.5.
    const old = Math.round(fixedSlope * 10);
    const pick = rnd(8, 24);
    fixedSlope = (pick >= old ? pick + 1 : pick) / 10;
    mode.value = 'fixed';
    restart();
  });

  const predictionForm = h('form', {
    onsubmit: event => {
      event.preventDefault();
      if (!originalSchedule()) {
        predictionCorrect = false;
        feedback.textContent = 'Use slope 2 and rates 0.2 and 0.1, with the drop after step 2.';
      } else {
        const final = next(next(next(next(initial(), 1), 2), 3), 4).weight;
        predictionCorrect = close(prediction.valueAsNumber, final);
        feedback.textContent = predictionCorrect ? 'The four updates subtract a total of 1.2 from weight 2.'
          : 'Subtract two steps at each rate, then check again.';
      }
      checkChallenges();
    }, hidden: true
  }, h('div', { class: 'sim-row' }, prediction,
    h('button', { type: 'submit', class: 'sim-btn' }, 'Check prediction')), feedback);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: learning-rate schedules'),
    h('p', { class: 'sub' },
      'Change the rates and when the rate drops. Step through the updates and watch the loss curve grow.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, counter, svg,
        h('div', { class: 'sim-row' }, h('label', {}, 'Slope mode ', mode)),
        h('div', { class: 'sim-row' }, early.field, late.field, drop.field),
        h('div', { class: 'sim-row' }, stepButton, playButton, resetButton, newDataButton),
        h('div', { class: 'sim-row' }, speed.field)),
      h('div', {},
        h('div', { class: 'sim-card' }, formula, note),
        h('div', { class: 'sim-card' }, challengeHost, predictionForm)))));

  const chal = challenges(challengeHost, [
    {
      text: 'With a fixed slope, set the late steps to half the size of the early steps.',
      check: state => state.fixed && close(state.late * 2, state.early),
      why: 'With the same slope, halving the rate halves the step size.',
    },
    {
      text: 'With slope 2, rates 0.2 and 0.1, and the drop after step 2, predict the weight after four steps.',
      check: state => state.predictionCorrect,
      why: 'Subtracting 0.4, 0.4, 0.2 and 0.2 from 2 leaves 0.8.',
    },
    {
      text: 'Choose Changing slope, keep the early rate at 0.2 for eight steps, and press Play to make the loss bounce.',
      check: state => !state.fixed && state.bounced,
      why: 'The weight crosses the lowest point and the loss rises as the steps move farther from it.',
    },
  ]);
  challengeHost.addEventListener('click', checkChallenges);

  const isFixed = () => mode.value === 'fixed';
  const rateAt = i => i <= drop.read() ? early.read() : late.read();
  const slopeAt = weight => isFixed() ? fixedSlope
    : clamp(CURVATURE * (weight - BEST), -CAP, CAP);

  function lossAt(weight) {
    // The linear loss is only used over the 12-step demonstration.
    if (isFixed()) return 24 + fixedSlope * (weight - START_WEIGHT);
    const d = Math.abs(weight - BEST);
    const edge = CAP / CURVATURE;
    return d <= edge ? CURVATURE * d * d / 2 : CAP * (d - edge / 2);
  }

  function initial() {
    return { weight: START_WEIGHT, loss: lossAt(START_WEIGHT) };
  }

  function next(previous, step) {
    const slope = slopeAt(previous.weight);
    const rate = rateAt(step);
    const change = rate * slope;
    const weight = previous.weight - change;
    return { weight, loss: lossAt(weight), slope, rate, change };
  }

  function originalSchedule() {
    return isFixed() && close(fixedSlope, INITIAL_SLOPE) && close(early.read(), 0.2)
      && close(late.read(), 0.1) && drop.read() === 2;
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function start() {
    if (history.length > MAX_STEPS) return;
    timer = setInterval(advance, 1000 / speed.read());
    draw();
  }

  function restart() {
    stop();
    predictionCorrect = false;
    feedback.textContent = '';
    history = [initial()];
    draw();
  }

  function advance() {
    const i = history.length;
    if (i <= MAX_STEPS) history.push(next(history[i - 1], i));
    if (history.length > MAX_STEPS) stop();
    draw();
  }

  function checkChallenges() {
    const bounced = history.some((p, i) => i >= 2
      && p.loss > history[i - 1].loss + 1e-8 && p.slope * history[i - 1].slope < 0);
    predictionForm.hidden = chal.index !== 1;
    chal.update({ fixed: isFixed(), early: early.read(), late: late.read(), predictionCorrect, bounced });
  }

  const label = (x, y, words, fill = C.ink, size = 13, anchor = 'middle') =>
    s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace' }, words);
  const line = (x1, y1, x2, y2, stroke, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round' });
  const circle = (x, y, r, fill, stroke) => s('circle', { cx: x, cy: y, r, fill, stroke });
  function arrow(x, y, amount, color) {
    if (Math.abs(amount) < 0.5) return circle(x, y, 2.5, color);
    const tip = x - amount;
    const head = Math.min(6, Math.abs(amount)) * Math.sign(amount);
    return s('g', {}, line(x, y, tip, y, color, 2.5),
      s('path', { d: `M ${tip} ${y} l ${head} -3.5 v 7 z`, fill: color }));
  }

  function drawNetwork(current, i) {
    const xIn = 108, xHidden = 184, xOut = 288;
    const inputY = [59, 110], hiddenY = [59, 110];
    const outputY = digit => 27 + digit * 12.4;
    const weightColor = current.weight < 0 ? C.pink : C.cyan;
    const networks = [
      s('rect', { x: 17, y: 45, width: 51, height: 76, rx: 8, fill: C.bg, stroke: C.cyan }),
      label(42, 60, 'LABEL', C.cyan, 10),
      s('path', { d: 'M 29 75 L 56 71 L 36 102 M 34 87 L 50 85', fill: 'none',
        stroke: C.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      label(xIn, 14, 'Input', C.muted, 12),
      label(xHidden, 14, 'Hidden', C.muted, 12),
      label(xOut, 14, 'Outputs', C.muted, 12)
    ];

    hiddenY.forEach((y, j) => inputY.forEach((v, k) => {
      const a = j === 0 && k === 0;
      networks.push(line(xIn + 9, v, xHidden - 9, y, a ? weightColor : k === j ? C.cyan : C.pink,
        a ? 1 + Math.min(5, Math.abs(current.weight) * 2.1) : 1));
    }));
    for (let digit = 0; digit < 10; digit++) {
      const y = outputY(digit);
      hiddenY.forEach((fromY, j) => networks.push(line(xHidden + 9, fromY, xOut - 6, y,
        digit === 7 && j === 1 ? C.cyan : digit === 1 && j === 1 ? C.pink : C.line,
        digit === 7 && j === 1 ? 2.5 : 1)));
    }

    // The card and scores illustrate the network; the loss below is calculated from weight A.
    const score7 = clamp(7 - Math.round(Math.abs(current.weight - BEST) * 2.2), 0, 7);
    [inputY, hiddenY].forEach((ys, l) => {
      const x = l === 0 ? xIn : xHidden;
      ys.forEach((y, j) => networks.push(circle(x, y, 9, C.bg, l === 0 ? C.violet : C.cyan),
        label(x, y + 4, l === 0 ? 1 - j : j === 0 ? clamp(Math.round(current.weight), -9, 9) : 1, C.ink, 11)));
    });
    for (let digit = 0; digit < 10; digit++) {
      const y = outputY(digit);
      const score = digit === 7 ? score7 : digit === 1 ? 7 - score7 : digit % 2;
      networks.push(circle(xOut, y, 5.45, C.bg, digit === 7 ? C.green : C.amber),
        label(xOut, y + 2.9, score, C.ink, 8),
        label(xOut + 16, y + 3.5, digit, digit === 7 ? C.green : C.amber, 10));
    }
    networks.push(label((xIn + xHidden) / 2, 49, `A ${fmt(current.weight)}`, weightColor, 11));
    if (i > 0) {
      networks.push(arrow(157, 146, 22, orange), arrow(209, 146, -22, C.cyan));
    }
    return networks;
  }

  function draw() {
    const i = history.length - 1;
    const current = history[i];
    const previous = history[i - 1];
    const preview = Array.from({ length: 4 }, (_, j) => rateAt(j + 1));
    const picture = drawNetwork(current, i);

    picture.push(label(17, 172, isFixed() ? 'First four step sizes' : 'First four learning rates',
      C.ink, 13, 'start'));
    preview.forEach((rate, j) => {
      const x = 50 + j * 86;
      const color = j + 1 <= drop.read() ? C.cyan : C.green;
      const size = isFixed() ? rate * fixedSlope : rate;
      const length = isFixed() ? 68 * size / 0.75 : 68 * size / 0.30;
      picture.push(
        s('rect', { x: x - 34, y: 182, width: 68, height: 52, rx: 7, fill: C.bg, stroke: C.line }),
        label(x, 195, j + 1, C.muted, 12),
        arrow(x + length / 2, 208, length * 0.86, color),
        label(x, 226, fmt(size), color, 12)
      );
    });

    const x0 = 43, x1 = 342, top = 260, bottom = 330;
    const liveMax = Math.max(9, ...history.map(p => p.loss));
    const maximum = isFixed() ? 24 : Math.ceil(liveMax / 3) * 3;
    const gx = j => x0 + (x1 - x0) * j / MAX_STEPS;
    const gy = loss => bottom - (bottom - top) * loss / maximum;
    picture.push(label(17, 251, 'Loss', C.ink, 13, 'start'), line(x0, top, x0, bottom, C.muted));
    for (const tick of [0, maximum / 3, 2 * maximum / 3, maximum]) {
      picture.push(line(x0, gy(tick), x1, gy(tick), C.line),
        label(x0 - 7, gy(tick) + 4, fmt(tick), C.muted, 12, 'end'));
    }
    for (const j of [0, 3, 6, 9, 12]) {
      picture.push(label(gx(j), bottom + 17, j, C.muted, 12));
    }
    picture.push(label(x1, bottom + 36, 'Step', C.muted, 12, 'end'));
    if (drop.read() < MAX_STEPS) {
      const x = gx(drop.read());
      picture.push(s('line', { x1: x, y1: top, x2: x, y2: bottom, stroke: C.green,
        'stroke-width': 1, 'stroke-dasharray': '3 4' }));
    }
    history.forEach((p, j) => {
      const color = j <= drop.read() ? C.cyan : C.green;
      if (j > 0) picture.push(line(gx(j - 1), gy(history[j - 1].loss), gx(j), gy(p.loss), color, 2.5));
      picture.push(circle(gx(j), gy(p.loss), j === i ? 4 : 2.5, color));
    });
    svg.replaceChildren(...picture);
    svg.setAttribute('aria-label',
      `Digit network and loss curve. Step ${i}, weight ${fmt(current.weight)}, loss ${fmt(current.loss)}.`);
    counter.textContent = `STEP ${i} / ${MAX_STEPS}`;
    stepButton.disabled = playButton.disabled = i === MAX_STEPS;
    playButton.textContent = timer === null ? 'Play' : 'Pause';

    if (previous) {
      fbox(formula, [
        `Step ${i} · loss ${fmt(previous.loss)} → ${fmt(current.loss)}`,
        `${fmt(current.rate)} × ${signed(current.slope)} = ${fmt(current.change)}`,
        [`Weight A: ${fmt(previous.weight)} − ${signed(current.change)} = ${fmt(current.weight)}`, C.green],
      ]);
    } else {
      fbox(formula, [
        `Weight A = ${fmt(current.weight)} · Loss = ${fmt(current.loss)}`,
        [`Next rate ${fmt(rateAt(1))} × slope ${signed(slopeAt(current.weight))}`
          + ` = ${fmt(rateAt(1) * slopeAt(current.weight))}`, C.cyan],
      ]);
    }
    note.textContent = isFixed() ? `This example holds the slope at ${fmt(fixedSlope)}.`
      : 'The slope changes with weight A and flips sign across the lowest point.';
    checkChallenges();
  }

  restart();
  return stop;
}

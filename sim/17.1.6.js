// 17.1.6 Try it: predict how a weight change moves the sorter’s loss.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#60a5fa';
  const ORANGE = '#fb923c';
  const TILE_ROWS = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const WEIGHT_START = 2;
  let [left, right] = TILE_ROWS[2];
  let weight = WEIGHT_START;
  let prediction = null;
  let trial = null;
  let feedback = '';

  const svg = s('svg', { viewBox: '0 0 360 370', role: 'img', 'aria-label': 'Tile sorter' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const result = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const ch = h('div');
  const showWeight = h('output', { for: 'bp-weight' });
  const slider = h('input', {
    id: 'bp-weight', type: 'range', min: 0, max: 3, step: 0.05, value: WEIGHT_START,
    style: { flex: '1 1 10rem', accentColor: C.amber, minHeight: '44px' },
    oninput: event => changeWeight(Number(event.currentTarget.value)),
  });
  const leftButton = btn('Left corner', () => setTile(1 - left, right));
  const rightButton = btn('Right corner', () => setTile(left, 1 - right));
  const downButton = btn('Loss goes down', () => predict('down'));
  const upButton = btn('Loss goes up', () => predict('up'));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: follow the loss'),
    h('p', { class: 'sub' }, 'Change a corner or move the left weight. Watch the blocks, score and loss update.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          leftButton, rightButton, btn('New data', () => setTile(...TILE_ROWS[rnd(0, 3)]))),
        h('div', { class: 'sim-row' },
          h('label', { for: 'bp-weight' }, 'Left weight'), slider, showWeight),
        h('div', { class: 'sim-row' },
          btn('Set to 1.5', () => changeWeight(1.5)),
          btn('Set to 2.5', () => changeWeight(2.5)),
          btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch, h('div', { class: 'sim-row' }, downButton, upButton), result)))));

  const examples = [
    {
      weight: 1.5, direction: 'down',
      text: 'Reset, predict what happens to loss, then lower the left weight to 1.5.',
      why: 'The score rises to −0.5, closer to the target of 0, so the loss falls from 1 to 0.25.',
    },
    {
      weight: 2.5, direction: 'up',
      text: 'Reset, predict what happens to loss, then raise the left weight to 2.5.',
      why: 'The score falls to −1.5, farther from the target of 0, so the loss rises from 1 to 2.25.',
    },
  ];

  const chal = challenges(ch, [
    ...examples.map((example, index) => ({
      text: example.text,
      check: state => state.trial?.index === index
        && state.trial.direction === example.direction
        && state.trial.prediction === example.direction,
      why: example.why,
    })),
    {
      text: 'Make the left corner orange and the right corner blue, then set the left weight to 2.5.',
      check: state => state.left === 0 && state.right === 1 && state.weight === 2.5 && state.loss === 0,
      why: 'The left input is 0, so changing its weight leaves the left total at −1 and the left signal at 0.',
    },
  ]);

  function calculate() {
    const total = weight * left - right;
    const otherTotal = right - left;
    const leftSignal = Math.max(0, total);
    const rightSignal = Math.max(0, otherTotal);
    const score = 1 - leftSignal - rightSignal;
    const target = left === right ? 1 : 0;
    const error = score - target;
    return { total, otherTotal, leftSignal, rightSignal, score, target, error, loss: error ** 2 };
  }

  const atStart = () => left === 1 && right === 0 && weight === WEIGHT_START;
  const num = value => fmt(value).replace(/^-/, '−');
  const colorName = value => value ? 'blue' : 'orange';

  function clearPrediction() {
    prediction = null;
    trial = null;
    feedback = '';
  }

  function reset() {
    [left, right] = TILE_ROWS[2];
    weight = WEIGHT_START;
    clearPrediction();
    draw();
  }

  function setTile(a, b) {
    left = a;
    right = b;
    clearPrediction();
    draw();
  }

  function predict(direction) {
    if (!atStart() || !examples[chal.index]) return;
    prediction = { index: chal.index, direction, startLoss: calculate().loss };
    trial = null;
    feedback = `Prediction recorded: loss goes ${direction}. Now move the weight.`;
    draw();
  }

  function changeWeight(nextWeight) {
    weight = nextWeight;
    trial = null;
    const index = chal.index;
    const example = examples[index];
    if (prediction && prediction.index === index && weight === example?.weight) {
      const value = calculate().loss;
      const direction = value < prediction.startLoss ? 'down' : 'up';
      trial = { index, prediction: prediction.direction, direction };
      feedback = direction === prediction.direction
        ? `Your prediction matched. The loss went ${direction} to ${num(value)}.`
        : `The loss went ${direction} to ${num(value)}. Reset to make another prediction.`;
      prediction = null;
    } else if (example && weight === example.weight && !prediction) {
      feedback = 'Reset and record a prediction before moving the weight.';
    }
    draw();
  }

  ch.addEventListener('click', event => {
    if (event.target.closest('.sim-ch-nav button')) clearPrediction();
  }, true);
  ch.addEventListener('click', () => draw());

  const text = (x, y, content, fill = C.ink, size = 15) => s('text', {
    x, y, fill, 'font-size': size, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
  }, content);
  const rect = (x, y, width, height, fill, stroke, rx = 7) =>
    s('rect', { x, y, width, height, rx, fill, stroke, 'stroke-width': 1.5 });
  const line = (x1, y1, x2, y2, stroke = C.muted) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': 1.5 });

  function arrow(x0, y0, x1, y1) {
    const angle = Math.atan2(y1 - y0, x1 - x0);
    return s('g', {}, line(x0, y0, x1, y1),
      ...[-0.55, 0.55].map(offset => line(x1, y1,
        x1 - 6 * Math.cos(angle + offset), y1 - 6 * Math.sin(angle + offset))));
  }

  function corner(x, value, name) {
    const shape = value
      ? rect(x - 8, 22, 16, 16, BLUE, BLUE, 1)
      : s('circle', { cx: x, cy: 30, r: 8, fill: ORANGE });
    return s('g', {}, shape, text(x, 58, `${name} ${value}`, C.ink, 14));
  }

  function totalCard(x, name, value, color) {
    const zero = x + 51;
    const blocks = Array.from({ length: Math.ceil(Math.abs(value)) }, (_, i) => {
      const part = Math.min(1, Math.abs(value) - i);
      const start = value < 0 ? zero - (i + part) * 20 : zero + i * 20;
      return rect(start + 1, 132, part * 20, 14, color, C.card, 2);
    });
    return s('g', {},
      rect(x, 94, 146, 69, C.card, color),
      text(x + 73, 118, `${name} ${num(value)}`),
      line(x + 14, 139, x + 132, 139, C.muted),
      ...blocks,
      line(zero, 127, zero, 151, C.ink));
  }

  function card(x, y, width, title, value, color) {
    return s('g', {},
      rect(x, y, width, 47, C.card, color),
      text(x + width / 2, y + 17, title, C.ink, 14),
      text(x + width / 2, y + 36, num(value), color, 17));
  }

  function draw() {
    const data = calculate();
    slider.value = String(weight);
    showWeight.textContent = num(weight);
    leftButton.textContent = `Left: ${colorName(left)}`;
    rightButton.textContent = `Right: ${colorName(right)}`;
    const canPredict = atStart() && Boolean(examples[chal.index]);
    downButton.disabled = !canPredict;
    upButton.disabled = !canPredict;
    downButton.setAttribute('aria-pressed', String(prediction?.direction === 'down'));
    upButton.setAttribute('aria-pressed', String(prediction?.direction === 'up'));
    result.textContent = feedback;

    svg.setAttribute('aria-label', `${colorName(left)} left corner, ${colorName(right)} right corner. `
      + `Left total ${num(data.total)}, right total ${num(data.otherTotal)}. `
      + `Score ${num(data.score)}, target ${num(data.target)}, loss ${num(data.loss)}.`);
    svg.replaceChildren(
      rect(0, 0, 360, 370, C.bg, C.line, 10),
      rect(76, 10, 208, 59, C.card, C.muted),
      corner(128, left, 'Left'),
      corner(232, right, 'Right'),
      arrow(128, 69, 97, 93), arrow(232, 69, 263, 93),
      totalCard(24, 'Left total', data.total, C.cyan),
      totalCard(190, 'Right total', data.otherTotal, C.violet),
      arrow(97, 163, 97, 180), arrow(263, 163, 263, 180),
      card(24, 181, 146, 'Left signal', data.leftSignal, C.cyan),
      card(190, 181, 146, 'Right signal', data.rightSignal, C.violet),
      arrow(97, 228, 145, 245), arrow(263, 228, 215, 245),
      card(125, 246, 110, 'Score', data.score, C.violet),
      arrow(180, 293, 180, 310),
      card(18, 311, 96, 'Target', data.target, C.amber),
      arrow(114, 335, 127, 335),
      card(128, 311, 104, 'Error', data.error, C.pink),
      arrow(232, 335, 245, 335),
      card(246, 311, 96, 'Loss', data.loss, C.green),
    );

    const totalStep = `${num(weight)} × ${left} − ${right} = ${num(data.total)}`;
    const scoreStep = `1 − ${num(data.leftSignal)} − ${num(data.rightSignal)} = ${num(data.score)}`;
    const errorStep = `${num(data.score)} − ${data.target} = ${num(data.error)}`;
    const factor = data.error < 0 ? `(${num(data.error)})` : num(data.error);
    const lossStep = `${factor} × ${factor} = ${num(data.loss)}`;
    const scoreSlope = 2 * data.error;
    const rows = [
      ['Left total', C.cyan], totalStep,
      ['Score', C.violet], scoreStep,
      ['Error', C.pink], errorStep,
      ['Loss', C.green], lossStep,
    ];

    if (left === 0) {
      rows.push(['Loss slope at weight = 0', C.amber]);
      note.textContent = 'The weight multiplies an input of 0, so moving it leaves the left total unchanged.';
    } else if (Math.abs(data.total) < 1e-9) {
      rows.push(['Left total = 0', C.amber]);
      note.textContent = 'The gate is at its bend. A total below 0 sends 0 through, while a total above 0 passes through.';
    } else {
      const gateSlope = data.total > 0 ? 1 : 0;
      const slope = scoreSlope * -1 * gateSlope * left;
      const slopeFactor = scoreSlope < 0 ? `(${num(scoreSlope)})` : num(scoreSlope);
      rows.push(['Loss slope at weight', C.amber],
        `${slopeFactor} × (−1) × ${gateSlope} × ${left} = ${slope > 0 ? '+' : ''}${num(slope)}`);
      note.textContent = gateSlope === 1
        ? 'The left total is positive, so the gate passes a small change through. Both slopes are measured at the current settings.'
        : 'The left total is negative, so a small change still leaves the gate’s output at 0.';
    }

    fbox(box, rows);
    chal.update({ left, right, weight, loss: data.loss, trial });
  }

  draw();
  return () => {};
}

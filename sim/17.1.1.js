// 17.1.1 Try it: change the tile, the weights, or the bias and watch the gate.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const TILES = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const START = { tile: 2, leftWeight: 1, rightWeight: -1, bias: -2 };
  let tileIndex = START.tile;
  let prediction = null;
  const signed = value => String(value).replace('-', '−');
  const factor = value => value < 0 ? `(${signed(value)})` : signed(value);
  const cornerName = value => value ? 'blue' : 'orange';

  const svg = s('svg', { viewBox: '0 0 360 295', role: 'img', 'aria-label': 'Neuron diagram' });
  const box = h('div');
  const ch = h('div');
  const predictionStatus = h('div', { class: 'sim-note', 'aria-live': 'polite' });

  function slider(name, value, oninput) {
    const number = h('span', {}, signed(value));
    const input = h('input', {
      type: 'range', min: -3, max: 3, step: 1, value,
      style: { display: 'block', width: '100%', minHeight: '44px', accentColor: C.cyan },
      oninput
    });
    const control = h('label', { style: { flex: '1 1 8rem', minWidth: 0 } }, `${name} `, number, input);
    return { input, number, control };
  }

  const leftWeight = slider('Left weight', START.leftWeight, changeWeights);
  const rightWeight = slider('Right weight', START.rightWeight, changeWeights);
  const bias = slider('Bias', START.bias, draw);
  const corners = [0, 1].map(side => btn('', () => {
    tileIndex ^= side === 0 ? 2 : 1;
    clearPrediction();
    draw();
  }));
  const guesses = [0, 1].map(value => btn(String(value), () => {
    prediction = value;
    draw();
  }));
  const predictionControls = h('div', { hidden: true },
    h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Predict the activation' }, guesses),
    predictionStatus);

  const example = state => state.tileIndex === START.tile &&
    state.leftWeight === START.leftWeight && state.rightWeight === START.rightWeight;
  const challenge = challenges(ch, [
    {
      text: 'Keep the blue–orange tile and the starting weights. Move the bias to 0.',
      check: state => example(state) && state.bias === 0 && state.activation === 1,
      why: 'Adding 0 leaves the total at 1, and the gate lets 1 through.'
    },
    {
      text: 'At bias 0, predict the output, then move the bias back to −2.',
      check: state => example(state) && state.bias === -2 && prediction === state.activation,
      why: 'Adding −2 takes the total from 1 to −1, and the gate turns −1 into 0.'
    }
  ]);

  ch.addEventListener('click', event => {
    if (event.target.closest('.sim-ch-nav button')) draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: one artificial neuron'),
    h('p', { class: 'sub' }, 'Tap a corner or move a slider to see what the gate sends out. Blue is 1 and orange is 0.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, corners),
        h('div', { class: 'sim-row' }, leftWeight.control, rightWeight.control, bias.control),
        h('div', { class: 'sim-row' },
          btn('New data', () => {
            tileIndex = rnd(0, TILES.length - 1);
            clearPrediction();
            draw();
          }, 'go'),
          btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, ch, predictionControls)))));

  function clearPrediction() {
    prediction = null;
  }

  function changeWeights() {
    clearPrediction();
    draw();
  }

  function reset() {
    tileIndex = START.tile;
    leftWeight.input.value = START.leftWeight;
    rightWeight.input.value = START.rightWeight;
    bias.input.value = START.bias;
    clearPrediction();
    draw();
  }

  const rect = (x, y, width, height, stroke, fill = C.bg) =>
    s('rect', { x, y, width, height, rx: 7, stroke, fill, 'stroke-width': 1.5 });
  const line = (x1, y1, x2, y2, stroke) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': 2 });
  const text = (value, x, y, fill = C.ink, size = 15) =>
    s('text', {
      x, y, fill, 'font-size': size, 'text-anchor': 'middle',
      'font-family': 'Segoe UI, Arial, sans-serif', 'font-weight': 650
    }, value);

  function arrow(x1, y1, x2, y2, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = [0.55, -0.55].map(offset =>
      `${x2 - 8 * Math.cos(angle + offset)},${y2 - 8 * Math.sin(angle + offset)}`
    );
    return s('g', {}, line(x1, y1, x2, y2, color),
      s('polygon', { points: [`${x2},${y2}`, ...head].join(' '), fill: color }));
  }

  function lane(x, side, value, weight, contribution) {
    const color = value ? C.cyan : C.amber;
    const corner = value
      ? s('rect', { x: x - 33, y: 26, width: 18, height: 18, rx: 2, fill: color })
      : s('circle', { cx: x - 24, cy: 35, r: 9, fill: color });
    const weightColor = side === 'Left' ? C.cyan : C.amber;
    return s('g', {},
      text(side, x, 16),
      rect(x - 56, 21, 112, 29, C.line),
      corner,
      text(`Input ${value}`, x + 13, 40, color),
      arrow(x, 50, x, 60, weightColor),
      rect(x - 56, 61, 112, 29, weightColor),
      text(`Weight ${signed(weight)}`, x, 81, weightColor),
      arrow(x, 90, x, 101, weightColor),
      text(`Gives ${signed(contribution)}`, x, 119, weightColor));
  }

  function draw() {
    const [left, right] = TILES[tileIndex];
    const wLeft = Number(leftWeight.input.value);
    const wRight = Number(rightWeight.input.value);
    const shift = Number(bias.input.value);
    const a = left * wLeft, b = right * wRight;
    const total = a + b + shift;
    const activation = Math.max(0, total);
    const state = { tileIndex, leftWeight: wLeft, rightWeight: wRight, bias: shift, activation };

    leftWeight.number.textContent = signed(wLeft);
    rightWeight.number.textContent = signed(wRight);
    bias.number.textContent = signed(shift);
    [left, right].forEach((value, i) => {
      corners[i].textContent = `${i === 0 ? 'Left' : 'Right'} corner · ${cornerName(value)}`;
    });

    // Each unit above or below zero is one signed block.
    const count = Math.abs(total);
    const blockColor = total < 0 ? C.pink : C.cyan;
    const blocks = Array.from({ length: count }, (_, i) =>
      s('rect', { x: 78 + i * 7, y: total < 0 ? 191 : 176, width: 5, height: 11, rx: 1, fill: blockColor }));
    svg.setAttribute('aria-label', `Left contributes ${a}, right contributes ${b}, bias ${shift}, total ${total}, activation ${activation}.`);
    svg.replaceChildren(
      lane(87, 'Left', left, wLeft, a),
      lane(273, 'Right', right, wRight, b),
      arrow(87, 126, 142, 156, C.cyan),
      arrow(273, 126, 218, 156, C.amber),
      rect(60, 157, 240, 53, C.violet),
      line(77, 189, 143, 189, C.muted),
      text('0', 69, 193, C.muted, 11),
      ...blocks,
      text(`Total ${signed(total)}`, 184, 183),
      text(`Bias ${signed(shift)}`, 256, 183, C.violet),
      arrow(180, 210, 180, 221, C.violet),
      rect(91, 222, 178, 29, C.violet),
      text('Gate · below 0 becomes 0', 180, 242, C.violet, 14),
      arrow(180, 251, 180, 266, C.green),
      text(`Activation ${activation}`, 180, 287, C.green, 20)
    );

    fbox(box, [
      `Left   ${left} × ${factor(wLeft)} = ${signed(a)}`,
      `Right  ${right} × ${factor(wRight)} = ${signed(b)}`,
      ['Bias   ' + signed(shift), C.violet],
      `Total  ${signed(a)} + ${factor(b)} + ${factor(shift)} = ${signed(total)}`,
      [`Gate   ${signed(total)} → ${activation}`, C.green]
    ]);

    challenge.update(state);
    predictionControls.hidden = challenge.index !== 1;
    guesses.forEach((button, i) => {
      button.disabled = !example(state) || shift !== 0;
      button.setAttribute('aria-pressed', String(prediction === i));
    });
    if (!example(state) || (shift !== 0 && prediction === null)) {
      predictionStatus.textContent = 'Use the starting tile and weights, then set the bias to 0 to make a prediction.';
    } else if (prediction === null) {
      predictionStatus.textContent = 'Choose what the gate will send out after the bias changes to −2.';
    } else if (shift === -2 && prediction !== activation) {
      predictionStatus.textContent = 'The bias takes the total to −1, so the gate sends out 0. Return the bias to 0 to try again.';
    } else {
      predictionStatus.textContent = `Your prediction was ${prediction}.`;
    }
  }

  draw();
}

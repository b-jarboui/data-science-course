// 17.1.2 Try it: change the tile or send a total into ReLU directly.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const ORANGE = '#fb923c', BLUE = '#60a5fa';
  const TILES = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const START = TILES[2];
  const colorName = value => value ? 'Blue' : 'Orange';
  const number = value => String(value).replace('-', '−');

  let tile = START.slice(), direct = false, gateInput = 2;
  let checkedNegative = false, prediction = null, predictionResult = null;

  const svg = s('svg', { viewBox: '0 0 372 180', role: 'img' });
  const box = h('div'), challengePanel = h('div');
  const feedback = h('p', { class: 'sim-note', role: 'status', 'aria-live': 'polite' });
  const leftButton = btn('', () => flip(0));
  const rightButton = btn('', () => flip(1));
  const checkButton = btn('Check what leaves', () => {
    checkedNegative = !direct && tile[0] - tile[1] === -1;
    feedback.textContent = checkedNegative
      ? 'Orange left and blue right give −1. The gate lifts it to 0.'
      : 'This tile gives a different total. Try changing a corner to make −1.';
    render();
  });
  const slider = h('input', { type: 'range', min: -2, max: 2, step: 1, value: gateInput, oninput: event => {
    gateInput = Number(event.currentTarget.value);
    render();
  } });
  const sliderValue = h('output');
  const mode = btn('Test the gate by itself', () => {
    direct = !direct;
    clearChecks();
    render();
  });
  const tileControls = h('div', { class: 'sim-row' }, leftButton, rightButton, checkButton);
  const gateControls = h('div', {}, h('label', { class: 'sim-row' }, 'Incoming total ', slider, sliderValue));
  const predictionPrompt = h('p', { class: 'sim-note' }, 'What will come out when you turn the right corner blue?');
  const predictZero = btn('Predict 0', () => predict(0));
  const predictOne = btn('Predict 1', () => predict(1));
  const predictionControls = h('div', {},
    predictionPrompt,
    h('div', { class: 'sim-row' }, predictZero, predictOne)
  );

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the bend at zero'),
    h('p', { class: 'sub' }, 'Change either corner and watch what the gate sends. Orange is 0 and blue is 1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, tileControls, gateControls,
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Reset', reset),
          mode
        ),
        predictionControls,
        feedback
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengePanel)
      )
    )
  ));

  const tests = challenges(challengePanel, [
    {
      text: 'Make a total of −1, then press “Check what leaves”.',
      check: state => state.checkedNegative,
      why: 'The subtraction gives 0 − 1 = −1, and ReLU sends 0 because zero is larger.'
    },
    {
      text: 'Start with blue left and orange right, predict what changing the right corner to blue will send, then change it.',
      check: state => state.predictionResult === true,
      why: 'With both corners blue, subtraction gives 1 − 1 = 0, and ReLU leaves zero where it is.'
    }
  ]);

  function clearChecks() {
    checkedNegative = false;
    prediction = null;
    predictionResult = null;
    feedback.textContent = '';
  }
  function flip(index) {
    const testPrediction = index === 1 && tile[0] === 1 && tile[1] === 0 && prediction !== null;
    const guess = prediction;
    tile[index] = 1 - tile[index];
    clearChecks();

    if (testPrediction) {
      const out = Math.max(0, tile[0] - tile[1]);
      predictionResult = guess === out;
      feedback.textContent = predictionResult
        ? `Your prediction was ${guess}. Subtracting the two blue corners gives 0, so the gate sends 0.`
        : `Your prediction was ${guess}. Both corners are 1, so subtraction gives 0 and the gate sends 0. Try again.`;
    }
    render();
  }
  function predict(value) {
    prediction = value;
    predictionResult = null;
    feedback.textContent = `You predict ${value}. Now turn the right corner blue.`;
    render();
  }
  function newData() {
    const current = 2 * tile[0] + tile[1];
    const choices = TILES.filter((_, i) => i !== current);
    tile = choices[rnd(0, choices.length - 1)].slice();
    direct = false;
    clearChecks();
    render();
  }
  function reset() {
    tile = START.slice();
    direct = false;
    gateInput = 2;
    slider.value = String(gateInput);
    clearChecks();
    render();
  }

  function label(value, x, y, fill = C.ink, size = 15) {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, value);
  }
  function panel(x, width, stroke = C.line) {
    return s('rect', { x, y: 56, width, height: 79, rx: 8, fill: C.bg, stroke, 'stroke-width': 1.5 });
  }
  function arrow(start, end) {
    return s('g', { fill: 'none', stroke: C.muted, 'stroke-width': 2 },
      s('line', { x1: start, x2: end, y1: 96, y2: 96 }),
      s('polyline', { points: `${end - 5},91 ${end},96 ${end - 5},101` })
    );
  }
  function corner(value, x) {
    return value
      ? s('rect', { x: x - 9, y: 87, width: 18, height: 18, fill: BLUE })
      : s('circle', { cx: x, cy: 96, r: 9, fill: ORANGE });
  }

  function draw(total, out) {
    const totalX = direct ? 61 : 120;
    const gateX = direct ? 167 : 225;
    const outX = direct ? 259 : 316;
    const ink = total < 0 ? C.pink : total > 0 ? C.green : C.amber;
    const outputInk = out > 0 ? C.green : C.amber;
    const baseline = 96;
    const items = [];

    if (!direct) {
      items.push(label('Tile', 52, 43), panel(12, 80),
        corner(tile[0], 33), corner(tile[1], 71),
        label(tile[0], 33, 124, tile[0] ? BLUE : ORANGE, 13),
        label(tile[1], 71, 124, tile[1] ? BLUE : ORANGE, 13),
        arrow(96, 115));
    }

    items.push(label('Total', totalX + 39, 43), panel(totalX, 78, ink),
      s('line', { x1: totalX + 9, x2: totalX + 69, y1: baseline, y2: baseline, stroke: C.muted }),
      label('0', totalX + 16, baseline - 5, C.muted, 12));

    for (let i = 0; i < Math.abs(total); i++) {
      const y = total > 0 ? baseline - 16 - 14 * i : baseline + 3 + 14 * i;
      items.push(s('rect', { x: totalX + 29, y, width: 20, height: 12, rx: 2, fill: ink }));
    }

    items.push(label(number(total), totalX + 39, 158, ink, 19),
      arrow(totalX + 82, gateX - 5),
      panel(gateX, 62, C.cyan), label('ReLU', gateX + 31, 102, C.cyan),
      arrow(gateX + 66, outX - 5),
      label('Sends', outX + 23, 43), panel(outX, 46, outputInk),
      label(out, outX + 23, 104, outputInk, 23));

    const source = direct ? 'Gate test.' : `${colorName(tile[0])} left, ${colorName(tile[1]).toLowerCase()} right.`;
    svg.setAttribute('aria-label', `${source} Incoming total ${total}. ReLU sends ${out}.`);
    svg.replaceChildren(...items);
  }

  function render() {
    const [left, right] = tile;
    const total = direct ? gateInput : left - right;
    const out = Math.max(0, total);

    leftButton.textContent = `Left: ${colorName(left)}`;
    rightButton.textContent = `Right: ${colorName(right)}`;
    leftButton.setAttribute('aria-label', `Change left corner, currently ${colorName(left)}`);
    rightButton.setAttribute('aria-label', `Change right corner, currently ${colorName(right)}`);
    mode.textContent = direct ? 'Back to the tile' : 'Test the gate by itself';
    tileControls.hidden = direct;
    tileControls.style.display = direct ? 'none' : '';
    gateControls.hidden = !direct;
    sliderValue.textContent = number(gateInput);

    predictionControls.hidden = direct || left !== 1 || right !== 0;
    predictZero.setAttribute('aria-pressed', String(prediction === 0));
    predictOne.setAttribute('aria-pressed', String(prediction === 1));
    draw(total, out);
    fbox(box, [
      direct ? `total = ${number(total)}` : `left − right = ${left} − ${right} = ${number(total)}`,
      [`larger of 0 and ${number(total)} → ${out}`, out > 0 ? C.green : C.amber]
    ]);
    tests.update({ checkedNegative, predictionResult });
  }

  render();
}

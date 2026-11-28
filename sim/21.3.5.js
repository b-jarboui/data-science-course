// 21.3.5 Try it: mix two sound numbers and train one connector weight.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const START = [2, 4];
  const TARGET = 3;
  const LIMIT = 24;
  let data = START.slice();
  let weight = 0;
  let history = [];
  let last = null;
  let prediction = '';
  let running = false;
  let timer = null;

  const text = value => {
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(2);
    }
    return String(Number(value.toFixed(4)));
  };
  const guess = () => weight * data[0] + 0.5 * data[1];
  const loss = value => 0.5 * (TARGET - value) ** 2;
  const iteration = () => history.length - 1;
  const currentLoss = () => history[history.length - 1];

  function slider(name, min, max, step, value, onInput) {
    const output = h('span');
    const input = h('input', {
      type: 'range', min, max, step, value, 'aria-label': name,
      style: { display: 'block', width: '100%', minHeight: '2.75rem', accentColor: C.cyan },
      oninput: () => {
        output.textContent = fmt(Number(input.value));
        onInput(Number(input.value));
      }
    });
    output.textContent = fmt(value);
    return { input, output, node: h('label', {
      style: { flex: '1 1 8rem', minWidth: 0, display: 'block' }
    }, `${name} `, output, input) };
  }
  function updateData(i, value) {
    data[i] = value;
    reset();
  }

  const aControl = slider('Sound number 1', 1, 8, 1, START[0], value => updateData(0, value));
  const bControl = slider('Sound number 2', 1, 8, 1, START[1], value => updateData(1, value));
  const rateControl = slider('Learning rate', 0.1, 2.5, 0.1, 0.5, reset);
  const speedControl = slider('Steps per second', 1, 8, 1, 2, () => {
    if (running) schedule();
  });

  const svg = s('svg', { viewBox: '0 0 400 322', role: 'img' });
  svg.style.touchAction = 'auto';
  const formula = h('div');
  const challengeHost = h('div');
  const status = pill('Step 0', C.amber);
  const stepButton = btn('Step', () => { stop(); advance(); }, 'go');
  const playButton = btn('Play', togglePlay);
  const settleButton = btn('It will settle', () => predict('settle'));
  const growButton = btn('The loss will grow', () => predict('grow'));
  const predictionResult = h('p', { class: 'sim-note', 'aria-live': 'polite' });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: train the connector'),
    h('p', { class: 'sub' },
      'Change the two sound numbers. The connector makes three new numbers. Train its first weight to move the first result toward 3.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' }, aControl.node, bControl.node),
        h('div', { class: 'sim-row' }, rateControl.node, speedControl.node),
        h('div', { class: 'sim-row' },
          stepButton, playButton, btn('Reset', reset), btn('New data', newData), status)),
      h('div', {},
        h('div', { class: 'sim-card' }, formula,
          h('p', { class: 'sim-note' },
            'Loss measures how far the first result is from 3. The other two mixes stay fixed.')),
        h('div', { class: 'sim-card' }, challengeHost,
          h('div', { class: 'sim-row' }, settleButton, growButton), predictionResult)))));

  function outcome() {
    if (iteration() < 3 || history[0] === 0) return '';
    if (currentLoss() < history[0] * 0.5) return 'settle';
    if (currentLoss() > history[0]) return 'grow';
    return '';
  }
  const chal = challenges(challengeHost, [
    {
      text: 'Set the rate to 0.5, predict what will happen, then press Play and watch three steps.',
      check: st => st.rate === 0.5 && st.played && st.prediction === 'settle' && st.outcome === 'settle',
      why: 'At this rate each step halves the error, so the loss drops to a quarter of its previous value.'
    },
    {
      text: 'Reach a loss of 0.01 or less in one step from a start with loss above 0.01.',
      check: st => st.iteration === 1 && st.startLoss > 0.01 && st.loss <= 0.01,
      why: 'A rate of 1 closes the whole gap in one step in this toy, and a rate close to 1 can leave only a small gap.'
    },
    {
      text: 'Find a rate that makes the loss grow for three steps in a row.',
      check: st => st.iteration >= 3 && st.history.slice(-4).every((v, i, a) => i === 0 || v > a[i - 1]),
      why: 'A rate above 2 sends the result past the target by more than the old error, so each step increases loss.'
    }
  ]);

  let played = false;
  function state() {
    return {
      rate: Number(rateControl.input.value), prediction, played,
      outcome: outcome(), iteration: iteration(), startLoss: history[0],
      loss: currentLoss(), history
    };
  }
  challengeHost.addEventListener('click', () => chal.update(state()));

  function stop() {
    running = false;
    clearTimeout(timer);
    timer = null;
    playButton.textContent = 'Play';
  }
  function reset() {
    stop();
    weight = 0;
    history = [loss(guess())];
    last = null;
    played = false;
    prediction = '';
    draw();
  }
  function newData() {
    const starts = [];
    for (let a = 1; a <= 8; a++) {
      for (let b = 1; b <= 8; b++) {
        if (b !== 6 && (a !== data[0] || b !== data[1])) starts.push([a, b]);
      }
    }
    data = starts[rnd(0, starts.length - 1)];
    [aControl, bControl].forEach((control, i) => {
      control.input.value = data[i];
      control.output.textContent = data[i];
    });
    reset();
  }
  function predict(choice) {
    prediction = choice;
    draw();
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!running) return;
      advance();
      if (running) schedule();
    }, 1000 / Number(speedControl.input.value));
  }
  function togglePlay() {
    if (running) {
      stop();
      return;
    }
    if (iteration() >= LIMIT) return;
    played = true;
    running = true;
    playButton.textContent = 'Pause';
    schedule();
  }
  function advance() {
    if (iteration() >= LIMIT) return;
    const oldWeight = weight;
    const before = guess();
    const error = TARGET - before;
    const rate = Number(rateControl.input.value);
    // Changing the weight by error ÷ a would close the entire gap.
    // The rate controls how much of that change to take.
    const change = rate * error / data[0];
    weight += change;
    const after = guess();
    last = { oldWeight, before, error, rate, change, after };
    history.push(loss(after));
    if (iteration() >= LIMIT) stop();
    draw();
  }

  function svgText(x, y, value, color = C.ink, size = 15, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'font-family': 'Consolas, monospace',
      'text-anchor': anchor
    }, value);
  }
  function cells(values, center, y, color, wide = false) {
    const width = wide ? 68 : 44;
    return values.flatMap((value, i) => {
      const x = center + (i - (values.length - 1) / 2) * (width + 5);
      return [
        s('rect', { x: x - width / 2, y, width, height: 34, rx: 6,
          fill: color, 'fill-opacity': 0.13, stroke: color }),
        svgText(x, y + 22, text(value), color, 13)
      ];
    });
  }
  function drawPicture() {
    const a = data[0], b = data[1];
    const out = [guess(), a, b / 4];
    const x0 = 54, x1 = 378, y0 = 277, y1 = 151;
    const top = Math.max(0.01, 2 ** Math.ceil(Math.log2(Math.max(...history, 0.01))));
    const span = Math.min(LIMIT, Math.max(8, Math.ceil(iteration() / 4) * 4));
    const at = (i, value) => [x0 + i * (x1 - x0) / span, y0 - value / top * (y0 - y1)];
    const points = history.map((value, i) => at(i, value));
    const grid = [0, top / 2, top].flatMap(v => {
      const [, y] = at(0, v);
      return [
        s('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: C.line }),
        svgText(x0 - 6, y + 4, text(v), C.ink, 11, 'end')
      ];
    });
    const ticks = [0, span / 2, span].map(i => {
      const [x] = at(i, 0);
      return svgText(x, y0 + 16, i, C.ink, 12);
    });
    svg.setAttribute('aria-label',
      `Sound vector ${a}, ${b}. Word-space vector ${out.map(text).join(', ')}. Step ${iteration()}, loss ${text(currentLoss())}.`);
    svg.replaceChildren(
      svgText(67, 24, 'Sound vector', C.violet),
      svgText(276, 24, 'Word-space vector', C.green),
      ...cells(data, 67, 36, C.violet),
      svgText(140, 58, '→', C.amber, 22),
      ...cells(out, 276, 36, C.green, true),
      svgText(276, 92, 'First number aims for 3', C.green, 13),
      svgText(54, 125, 'Loss = ½ × error²', C.amber, 15, 'start'),
      ...grid, ...ticks,
      s('polyline', { points: points.map(([x, y]) => `${x},${y}`).join(' '),
        stroke: C.amber, 'stroke-width': 2.5, fill: 'none' }),
      ...points.map(([x, y]) => s('circle', { cx: x, cy: y, r: 3, fill: C.amber })),
      svgText((x0 + x1) / 2, 314, 'Training step', C.ink, 13));
  }
  function draw() {
    drawPicture();
    status.textContent = `Step ${iteration()}`;
    stepButton.disabled = playButton.disabled = iteration() >= LIMIT;

    const mix = `${text(weight)} × ${data[0]} + ½ × ${data[1]} = ${text(guess())}`;
    if (last) {
      const { oldWeight, before, error, rate, change, after } = last;
      fbox(formula, [
        `Error: 3 − (${text(before)}) = ${text(error)}`,
        `Change: ${fmt(rate)} × (${text(error)}) ÷ ${data[0]} = ${text(change)}`,
        `Weight: ${text(oldWeight)} → ${text(weight)}`,
        ['New first number', C.green],
        [mix, C.green],
        [`Loss: ${text(loss(before))} → ${text(loss(after))}`, C.amber]
      ]);
    } else {
      fbox(formula, [
        ['First number', C.green], mix,
        `Second: 1 × ${data[0]} = ${data[0]}`,
        `Third: ¼ × ${data[1]} = ${text(data[1] / 4)}`,
        [`Starting loss: ${text(currentLoss())}`, C.amber]
      ]);
    }

    const result = outcome();
    settleButton.setAttribute('aria-pressed', String(prediction === 'settle'));
    growButton.setAttribute('aria-pressed', String(prediction === 'grow'));
    if (!prediction) {
      predictionResult.textContent = '';
    } else if (!result) {
      predictionResult.textContent = iteration() < 3
        ? 'Prediction saved. Run at least three steps to compare.'
        : history[0] === 0 ? 'The first number started at 3. Try New data for a starting error.'
          : 'The loss is close to its starting value. Try more steps or change the rate.';
    } else {
      const observed = result === 'settle' ? 'The loss is moving toward zero.' : 'The loss is growing.';
      predictionResult.textContent = prediction === result
        ? `Your prediction matched. ${observed}` : observed;
    }
    chal.update(state());
  }

  reset();
  return stop;
}

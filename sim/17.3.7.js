// 17.3.7 Try it. Edit the residuals or fit them to a target patch.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const WORKSHOP = [0, 0, 0, 3];
  const RESIDUAL = [0, 0, 1, 0];
  const CELLS = ['Top left', 'Top right', 'Bottom left', 'Bottom right'];
  const zeros = () => CELLS.map(() => 0);
  let incoming = WORKSHOP.slice();
  let target = WORKSHOP.map((value, i) => value + RESIDUAL[i]);
  let correction = RESIDUAL.slice();
  let workshop = true;
  let selected = 0;
  let speed = 2;
  let rate = 0.25;
  let iteration = 0;
  let history = [0];
  let lastStep = null;
  let timer = null;
  let playing = false;
  let trainingReset = false;
  let predictionUsed = '';

  const result = () => incoming.map((value, i) => value + correction[i]);
  const loss = () => result().reduce((sum, value, i) => sum + (target[i] - value) ** 2, 0);
  const display = value => {
    const magnitude = Math.abs(value);
    if (magnitude >= 10000 || magnitude > 0 && magnitude < 0.001) return value.toExponential(2);
    return magnitude < 1 && magnitude > 0 ? String(Number(value.toFixed(4))) : fmt(value);
  };
  const signed = value => value < 0 ? `− ${display(-value)}` : `+ ${display(value)}`;

  const picture = s('svg', { viewBox: '0 0 420 186', role: 'img' });
  const graph = s('svg', { viewBox: '0 0 420 160', role: 'img' });
  const box = h('div');
  const status = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeHost = h('div');
  const playButton = btn('Play', togglePlay, 'go');
  const stepButton = btn('Step', () => {
    stop();
    step();
  });
  const prediction = h('select', { 'aria-label': 'Predict how the loss will change' },
    h('option', { value: '' }, 'Choose a prediction'),
    h('option', { value: 'down' }, 'The loss will fall'),
    h('option', { value: 'up' }, 'The loss will grow'));
  const speedLabel = h('span', {}, `${speed} steps/s`);
  const rateLabel = h('span', {}, String(rate));
  const speedSlider = h('input', {
    type: 'range', min: 1, max: 5, step: 1, value: speed,
    oninput: event => {
      speed = Number(event.target.value);
      speedLabel.textContent = `${speed} steps/s`;
      if (playing) schedule();
    }
  });
  const rateSlider = h('input', {
    type: 'range', min: 0.05, max: 1.25, step: 0.05, value: rate,
    oninput: event => {
      rate = Number(event.target.value);
      rateLabel.textContent = String(rate);
      stop();
      predictionUsed = '';
      draw();
    }
  });
  const cellButtons = CELLS.map((name, i) => btn(name, () => {
    selected = i;
    draw();
  }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try a residual connection'),
    h('p', { class: 'sub' }, 'Each new score adds a correction to the matching incoming score. Choose a square, then change its correction or fit the corrections to the target patch.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' }, picture,
          h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Choose a square' }, ...cellButtons),
          h('div', { class: 'sim-row' },
            btn('−1 correction', () => bump(-1)),
            btn('+1 correction', () => bump(1)),
            btn('Zero corrections', () => begin(zeros())),
            btn('New data', newData),
            btn('Workshop patch', restoreWorkshop))),
        h('div', { class: 'sim-card' }, graph, status,
          h('div', { class: 'sim-row' },
            stepButton, playButton, btn('Reset training', () => begin(zeros(), true))),
          h('label', { class: 'sim-row' }, 'Speed', speedSlider, speedLabel),
          h('label', { class: 'sim-row' }, 'Learning rate', rateSlider, rateLabel),
          h('label', { class: 'sim-row' }, 'Before you press Play', prediction))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const challenge = challenges(challengeHost, [
    {
      text: 'Predict the new patch, then set every correction to zero.',
      check: state => state.correction.every(value => value === 0),
      why: 'Every new score matches the incoming score because adding zero keeps each score the same.'
    },
    {
      text: 'Give the bottom-right square a negative correction.',
      check: state => state.correction[3] < 0,
      why: 'The new bottom-right score is lower because its correction is negative.'
    },
    {
      text: 'Reset training, set the learning rate to 1.25, and predict what happens when you press Play.',
      check: state => state.prediction === 'up' && state.history.length >= 4 &&
        state.history.slice(1, 4).every((value, i) => value > state.history[i]),
      why: 'The loss grows because each step crosses the target and moves farther away.'
    },
    {
      text: 'Choose Workshop patch, reset training, then get the loss to 0.0625 or less in at most two steps.',
      check: state => state.workshop && state.trainingReset && state.iteration > 0 &&
        state.iteration <= 2 && state.loss <= 0.0625,
      why: 'The corrections brought the new patch close to the target in just a few steps.'
    }
  ]);

  function stop() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }

  function begin(values, reset = false) {
    stop();
    correction = values;
    iteration = 0;
    history = [loss()];
    lastStep = null;
    predictionUsed = '';
    trainingReset = reset;
    draw();
  }

  function bump(amount) {
    const values = correction.slice();
    values[selected] = Math.max(-9, Math.min(9, Math.round(values[selected]) + amount));
    begin(values);
  }

  function restoreWorkshop() {
    incoming = WORKSHOP.slice();
    target = WORKSHOP.map((value, i) => value + RESIDUAL[i]);
    workshop = true;
    selected = 0;
    begin(RESIDUAL.slice());
  }

  function newData() {
    incoming = CELLS.map(() => rnd(0, 4));
    const desired = CELLS.map(() => rnd(-2, 2));
    if (desired.every(value => value === 0)) desired[rnd(0, 3)] = 1;
    target = incoming.map((value, i) => value + desired[i]);
    workshop = false;
    selected = 0;
    begin(zeros());
  }

  function finished() {
    const value = history[history.length - 1];
    return value < 1e-8 || iteration >= 30 || iteration >= 3 && value > 100;
  }

  function step() {
    if (finished()) {
      stop();
      draw();
      return;
    }

    const before = correction;
    const output = result();
    const errors = target.map((value, i) => value - output[i]);
    const changes = errors.map(error => 2 * rate * error);
    correction = before.map((value, i) => value + changes[i]);
    lastStep = { before, errors, changes, after: correction };
    iteration++;
    history.push(loss());
    if (finished()) stop();
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      step();
      schedule();
    }, 1000 / speed);
  }

  function togglePlay() {
    if (playing) {
      stop();
    } else if (!finished()) {
      if (iteration === 0) predictionUsed = prediction.value;
      playing = true;
      schedule();
    }
    draw();
  }

  const svgText = (x, y, text, fill = C.ink, size = 16, anchor = 'middle') =>
    s('text', {
      x, y, fill, 'font-size': size, 'font-weight': 650,
      'text-anchor': anchor, 'font-family': 'Consolas, monospace'
    }, text);

  function drawPicture(output) {
    const patches = [
      ['Incoming', incoming, C.violet, 5],
      ['Correction', correction, C.cyan, 114],
      ['New', output, C.green, 223],
      ['Target', target, C.amber, 332]
    ];
    const parts = [
      svgText(102, 92, '+', C.muted, 19),
      svgText(211, 92, '=', C.muted, 19),
      s('line', { x1: 320, x2: 320, y1: 28, y2: 132, stroke: C.line, 'stroke-dasharray': '4 4' })
    ];
    patches.forEach(([name, values, color, x]) => {
      parts.push(svgText(x + 42, 24, name, color, 14));
      values.forEach((value, i) => {
        const xx = x + (i % 2) * 43;
        const yy = 39 + Math.floor(i / 2) * 43;
        const ink = name === 'Correction' && value < 0 ? C.pink : color;
        parts.push(s('rect', {
          x: xx, y: yy, width: 40, height: 40, rx: 5, fill: C.bg,
          stroke: i === selected ? C.ink : color, 'stroke-width': i === selected ? 2 : 1
        }), svgText(xx + 20, yy + 26, display(value), ink, String(display(value)).length > 4 ? 9 : 15));
      });
    });
    parts.push(svgText(5, 166, `Selected square   ${CELLS[selected]}`, C.ink, 15, 'start'));
    picture.replaceChildren(...parts);
    picture.setAttribute('aria-label',
      `Incoming ${incoming.map(display).join(', ')}. Corrections ${correction.map(display).join(', ')}. New patch ${output.map(display).join(', ')}. Target ${target.map(display).join(', ')}. Squares read row by row.`);
  }

  function drawGraph() {
    const left = 66;
    const right = 404;
    const top = 32;
    const bottom = 119;
    const maxLoss = Math.max(1, ...history);
    const maxStep = Math.max(5, iteration);
    const x = i => left + (right - left) * i / maxStep;
    const y = value => bottom - (bottom - top) * value / maxLoss;
    const points = history.map((value, i) => `${x(i)},${y(value)}`);
    const rules = [0, maxLoss / 2, maxLoss].flatMap(value => [
      s('line', { x1: left, x2: right, y1: y(value), y2: y(value), stroke: C.line }),
      svgText(left - 8, y(value) + 4, display(value), C.muted, 12, 'end')
    ]);
    graph.replaceChildren(
      svgText(left, 17, 'LOSS', C.amber, 14, 'start'),
      ...rules,
      s('line', { x1: left, x2: left, y1: top, y2: bottom, stroke: C.muted }),
      s('polyline', { points: points.join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }),
      ...history.map((value, i) => s('circle', { cx: x(i), cy: y(value), r: 2.7, fill: C.amber })),
      svgText(left, 139, '0', C.muted, 12),
      svgText(right, 139, String(maxStep), C.muted, 12),
      svgText((left + right) / 2, 151, 'ITERATION', C.muted, 13)
    );
    graph.setAttribute('aria-label', `Loss by iteration. At iteration ${iteration}, loss is ${display(history[iteration])}.`);
  }

  function draw() {
    const output = result();
    const currentLoss = history[iteration];
    drawPicture(output);
    drawGraph();
    cellButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === selected));
      button.classList.toggle('go', i === selected);
    });
    const lines = [
      CELLS[selected],
      `new = incoming + correction`,
      [`${display(incoming[selected])} ${signed(correction[selected])} = ${display(output[selected])}`, C.green],
      [`iteration ${iteration}   loss ${display(currentLoss)}`, C.amber]
    ];
    if (lastStep) {
      const { before, errors, changes, after } = lastStep;
      const previousOutput = incoming[selected] + before[selected];
      lines.push(
        `error = target − old score`,
        `${display(target[selected])} − (${display(previousOutput)}) = ${display(errors[selected])}`,
        `change = 2 × ${rate} × ${display(errors[selected])}`,
        [`correction  ${display(before[selected])} ${signed(changes[selected])} → ${display(after[selected])}`, C.cyan]
      );
    }
    fbox(box, lines);
    status.textContent = playing ? 'Training is running.'
      : currentLoss < 1e-8 ? 'The new patch matches the target to the precision shown.'
      : finished() ? 'Training stopped. Reset to try another learning rate.'
      : 'Loss adds the squared mistakes across all four squares.';
    stepButton.disabled = finished();
    playButton.disabled = finished();
    playButton.textContent = playing ? 'Pause' : 'Play';
    challenge.update({ correction, history, prediction: predictionUsed, iteration, loss: currentLoss, workshop, trainingReset });
  }

  // Recheck when the learner advances to a challenge whose condition already holds.
  const refreshChallenge = () => challenge.update({
    correction, history, prediction: predictionUsed, iteration, loss: history[iteration], workshop, trainingReset
  });
  challengeHost.addEventListener('click', refreshChallenge);
  draw();
  return () => {
    stop();
    challengeHost.removeEventListener('click', refreshChallenge);
  };
}

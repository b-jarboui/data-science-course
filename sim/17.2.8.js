// 17.2.8 Try it: clip a whole gradient and train the two-card reader.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [6, 8];
  const DEFAULT_CAP = 5;
  const DEFAULT_RATE = 0.5;
  const MAX_STEPS = 60;
  let start = START.slice(), weights = start.slice();
  let cap = DEFAULT_CAP, rate = DEFAULT_RATE, speed = 2;
  let losses = [50], last = null, predictionAtStart = '';
  let timer = null, activePointer = null, capMoved = false, dragChanged = false;

  const magnitude = ([a, b]) => Math.hypot(a, b);
  const loss = ([a, b]) => (a * a + b * b) / 2;
  const guesses = values => values.map((w, i) => w > 5 ? 7 : i);
  const number = x => fmt(Math.abs(x) < 0.005 ? 0 : x);
  const pair = values => `(${values.map(number).join(', ')})`;

  function clip(values) {
    const length = magnitude(values);
    const factor = length > cap ? cap / length : 1;
    return { length, factor, clipped: values.map(w => w * factor) };
  }

  const svg = s('svg', {
    viewBox: '0 0 360 350', role: 'img', 'aria-label': 'Gradient and cap on a square grid'
  });
  const chart = s('svg', { viewBox: '0 0 360 150', role: 'img', 'aria-label': 'Error by step' });
  const formula = h('div'), challengeHost = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const stepButton = btn('Step', () => { pause(); step(); }, 'go');
  const playButton = btn('Play', togglePlay);
  const resetButton = btn('Reset', reset);
  const newButton = btn('New data', newData);

  function slider(name, min, max, stepSize, initial, change) {
    const readout = h('span');
    const input = h('input', {
      type: 'range', min, max, step: stepSize, value: initial, 'aria-label': name,
      style: { width: '100%', minHeight: '36px', display: 'block' }
    });
    input.addEventListener('input', () => change(Number(input.value)));
    const control = h('label', { style: { display: 'block', marginTop: '.5rem' } },
      `${name} `, readout, input);
    return {
      control,
      show(value) { input.value = value; readout.textContent = number(value); }
    };
  }

  const aSlider = slider('Starting slope A', -10, 10, 0.5, START[0], value => setSlope(0, value));
  const bSlider = slider('Starting slope B', -10, 10, 0.5, START[1], value => setSlope(1, value));
  const capSlider = slider('Cap', 0, 15, 0.5, cap, value => {
    capMoved ||= value !== cap;
    cap = value;
    restart();
  });
  const rateSlider = slider('Step size', 0, 3, 0.05, rate, value => {
    rate = value;
    restart();
  });
  const speedSlider = slider('Steps per second', 1, 8, 1, speed, value => {
    speed = value;
    speedSlider.show(speed);
    if (timer !== null) schedule();
  });

  const prediction = h('select', {
    'aria-label': 'Predict the two guesses',
    style: { minHeight: '44px', maxWidth: '100%', font: 'inherit' }
  }, h('option', { value: '' }, 'Choose two guesses'),
  ...['7, 7', '0, 7', '7, 1', '0, 1'].map(value => h('option', { value }, value)));
  prediction.addEventListener('change', draw);
  const challengeUI = challenges(challengeHost, [
    {
      text: 'With the starting arrow (6, 8), move only the cap to make the arrow five units long.',
      check: state => state.original && state.capMoved && state.cap === 5 && state.previewLength === 5,
      why: 'A cap of five halves the ten-unit arrow and gives (3, 4).'
    },
    {
      text: 'Keep the same starting arrow and raise the cap until the arrow keeps its full length.',
      check: state => state.original && state.cap >= 10,
      why: 'The ten-unit arrow stays the same when it fits inside the cap.'
    },
    {
      text: 'Reset, choose your guesses for step two, then press Step twice to check.',
      check: state => state.original && state.cap === 5 && state.rate === 0.5 &&
        state.iteration === 2 && state.prediction === state.guesses,
      why: 'After two steps both weights are below five, so the reader guesses zero and one.'
    },
    {
      text: 'Set a cap that stops the weights from changing, then press Step.',
      check: state => state.cap === 0 && state.rate > 0 && state.iteration > 0 && state.unchanged,
      why: 'A cap of zero makes the clipped arrow zero units long, so both weights stay the same.'
    }
  ]);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: gradient clipping'),
    h('p', { class: 'sub' }, 'Drag the cyan arrow’s tip or use the slope sliders. The amber circle shows the cap, and the green arrow shows the clipped slope.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        aSlider.control, bSlider.control, capSlider.control,
        h('div', { class: 'sim-row' }, stepButton, playButton, resetButton, newButton),
        rateSlider.control, speedSlider.control, status, chart),
      h('div', {},
        h('div', { class: 'sim-card' }, formula),
        h('div', { class: 'sim-card' }, challengeHost,
          h('label', { class: 'sim-row' }, 'Predict the guesses after two steps', prediction))))));

  function originalArrow() {
    return start[0] === START[0] && start[1] === START[1] && !dragChanged;
  }

  function setSlope(index, value) {
    if (start[index] === value) return;
    start[index] = value;
    dragChanged = true;
    restart();
  }

  function restart() {
    pause();
    weights = start.slice();
    losses = [loss(weights)];
    last = null;
    predictionAtStart = '';
    prediction.value = '';
    draw();
  }

  function reset() {
    start = START.slice();
    cap = DEFAULT_CAP;
    rate = DEFAULT_RATE;
    speed = 2;
    capMoved = false;
    dragChanged = false;
    restart();
  }

  function newData() {
    const previous = start.join();
    do {
      start = [rnd(-10, 10), rnd(-10, 10)];
    } while (start.join() === previous || start.join() === START.join() || magnitude(start) < 6);
    dragChanged = true;
    restart();
  }

  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function schedule() {
    if (timer !== null) clearInterval(timer);
    timer = setInterval(step, 1000 / speed);
    playButton.textContent = 'Pause';
  }

  function togglePlay() {
    if (timer !== null) pause();
    else if (last === null || losses.length <= MAX_STEPS) schedule();
  }

  function step() {
    if (losses.length > MAX_STEPS) return;
    if (losses.length === 1) predictionAtStart = prediction.value;
    const old = weights;
    const { clipped } = clip(old);
    const change = clipped.map(w => -rate * w);
    weights = old.map((w, i) => w + change[i]);
    last = { old, oldError: loss(old), change };
    losses.push(loss(weights));
    if (losses.length > MAX_STEPS) pause();
    draw();
  }

  const X = 180, Y = 178, U = 10;
  const gx = x => X + x * U, gy = y => Y - y * U;
  const segment = (x1, y1, x2, y2, color, width = 1, attrs = {}) =>
    s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, ...attrs });
  const label = (x, y, value, color = C.ink, size = 13, anchor = 'middle') =>
    s('text', { x, y, fill: color, 'font-size': size, 'font-family': 'Consolas, monospace', 'text-anchor': anchor }, value);

  function arrow([a, b], color, width) {
    const x = gx(a), y = gy(b);
    const dx = x - X, dy = y - Y, length = Math.hypot(dx, dy);
    if (length < 0.3) return [s('circle', { cx: X, cy: Y, r: 4, fill: color })];
    const ux = dx / length, uy = dy / length;
    const head = Math.min(10, length * 0.5), wing = head * 0.48;
    const bx = x - ux * head, by = y - uy * head;
    return [
      segment(X, Y, x, y, color, width, { 'stroke-linecap': 'round' }),
      s('polygon', {
        points: `${x},${y} ${bx - uy * wing},${by + ux * wing} ${bx + uy * wing},${by - ux * wing}`,
        fill: color
      })
    ];
  }

  function plotArrow(values, clipped) {
    const elements = [
      s('rect', { x: 20, y: 18, width: 320, height: 320, rx: 8, fill: C.bg })
    ];
    for (let i = -15; i <= 15; i++) {
      const ink = i === 0 ? C.muted : C.line;
      elements.push(segment(gx(i), gy(-15), gx(i), gy(15), ink),
        segment(gx(-15), gy(i), gx(15), gy(i), ink));
      if (i !== 0 && i % 5 === 0) {
        elements.push(label(gx(i), 329, i, C.muted, 12),
          label(27, gy(i) + 4, i, C.muted, 12, 'end'));
      }
    }
    elements.push(s('circle', {
      cx: X, cy: Y, r: Math.max(2, cap * U), fill: 'none', stroke: C.amber, 'stroke-width': 2
    }));
    const [a, b] = values;
    elements.push(
      segment(X, Y, gx(a), Y, C.violet, 2, { 'stroke-dasharray': '4 4' }),
      segment(gx(a), Y, gx(a), gy(b), C.pink, 2, { 'stroke-dasharray': '4 4' }),
      ...arrow(values, C.cyan, 7), ...arrow(clipped, C.green, 3),
      s('circle', { cx: gx(a), cy: gy(b), r: 7, fill: 'none', stroke: C.cyan, 'stroke-width': 2 })
    );
    svg.replaceChildren(...elements);
  }

  function plotLoss() {
    const left = 50, right = 341, bottom = 117, top = 23;
    const count = Math.max(8, losses.length - 1);
    const ceiling = Math.max(1, Math.ceil(Math.max(...losses) / 5) * 5);
    const x = i => left + (right - left) * i / count;
    const y = value => bottom - (bottom - top) * value / ceiling;
    const elements = [
      segment(left, top, left, bottom, C.muted),
      segment(left, bottom, right, bottom, C.muted),
      label(left, 16, 'Error', C.muted, 13, 'start'),
      label(left - 6, top + 4, number(ceiling), C.muted, 12, 'end'),
      label(left - 6, bottom + 4, '0', C.muted, 12, 'end'),
      label(left, 137, '0', C.muted, 12),
      label(right, 137, `${count} steps`, C.muted, 12, 'end')
    ];
    if (losses.length > 1) {
      elements.push(s('polyline', {
        points: losses.map((value, i) => `${x(i)},${y(value)}`).join(' '),
        fill: 'none', stroke: C.green, 'stroke-width': 2.5
      }));
    }
    losses.forEach((value, i) => elements.push(s('circle', {
      cx: x(i), cy: y(value), r: losses.length > 25 ? 2 : 3, fill: C.green
    })));
    chart.replaceChildren(...elements);
  }

  function drag(event) {
    if (event.pointerId !== activePointer) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const p = point.matrixTransform(matrix.inverse());
    const round = value => Math.max(-10, Math.min(10, Math.round(value * 2) / 2));
    const next = [round((p.x - X) / U), round((Y - p.y) / U)];
    if (next[0] === start[0] && next[1] === start[1]) return;
    start = next;
    dragChanged = true;
    restart();
  }

  svg.addEventListener('pointerdown', event => {
    if (activePointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    activePointer = event.pointerId;
    svg.setPointerCapture(activePointer);
    // Preserve the starting arrow if a learner grabs the displayed tip after a step.
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const tip = svg.createSVGPoint();
    const [a, b] = last?.old ?? start;
    tip.x = gx(a);
    tip.y = gy(b);
    const p = tip.matrixTransform(matrix);
    if (Math.hypot(p.x - event.clientX, p.y - event.clientY) > 14) drag(event);
  });
  svg.addEventListener('pointermove', drag);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(type, event => {
      if (event.pointerId === activePointer) activePointer = null;
    });
  }

  function draw() {
    const values = last?.old ?? start;
    const { length, factor, clipped } = clip(values);
    const iteration = losses.length - 1;
    const currentGuesses = guesses(weights).join(', ');
    plotArrow(values, clipped);
    plotLoss();
    aSlider.show(start[0]);
    bSlider.show(start[1]);
    capSlider.show(cap);
    rateSlider.show(rate);
    speedSlider.show(speed);
    status.textContent = `Step ${iteration} · Guesses ${currentGuesses} · Error ${number(loss(weights))}`;
    stepButton.disabled = iteration >= MAX_STEPS;
    playButton.disabled = iteration >= MAX_STEPS;
    prediction.disabled = iteration > 0;
    const factorLine = length > cap
      ? `Factor = ${number(cap)} ÷ ${number(length)} = ${number(factor)}`
      : `Cap ${number(cap)} · Factor = 1`;
    fbox(formula, [
      `Slope ${pair(values)} · Length ${number(length)}`,
      [factorLine, C.amber],
      [`Clipped ${pair(clipped)} · Length ${number(magnitude(clipped))}`, C.green],
      ...(last ? [
        `Old weights ${pair(last.old)}`,
        `Old error ${number(last.oldError)}`,
        `Change −${number(rate)} × clipped`,
        [pair(last.change), C.pink],
        `New weights ${pair(weights)}`,
        [`New error ${number(loss(weights))}`, C.green]
      ] : [
        'Cards 0 and 1 each give their correct digit 5 points.',
        'The weights give 7 its points on the two cards.',
        'Error = half the sum of the squared weights.'
      ])
    ]);
    challengeUI.update({
      original: originalArrow(), cap, rate, capMoved, iteration,
      previewLength: magnitude(clip(start).clipped),
      prediction: predictionAtStart, guesses: currentGuesses,
      unchanged: last?.change.every(change => change === 0)
    });
  }

  draw();
  return pause;
}

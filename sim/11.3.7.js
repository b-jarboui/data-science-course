// 11.3.7 Try it. Step through the readings to estimate North's true demand.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = 50;
  const LESSON_READINGS = [48, 53, 49, 51, 49];
  const N = LESSON_READINGS.length;
  const lessonNoise = LESSON_READINGS.map(reading => reading - START);
  let noise = lessonNoise.slice();
  let originalNoise = noise.slice();
  let directions = [1, -1, 1, 1];
  let drift = 0;
  let priorWeight = 0;
  let selected = 0;
  let speed = 1;
  let history = [];
  let timer = null;

  const svg = s('svg', { viewBox: '0 0 390 344', role: 'img', 'aria-labelledby': 'north-demand-plot' });
  const box = h('div');
  const stepCount = h('span', { role: 'status', 'aria-live': 'polite' });
  const challengeMount = h('div');
  const stepButton = btn('Step', advance, 'go');
  const playButton = btn('Play', togglePlay);

  const week = h('select', { class: 'sim-btn', 'aria-label': 'Week to edit' },
    LESSON_READINGS.map((_, i) => h('option', { value: i }, `Week ${i + 1}`)));
  const prediction = h('select', { class: 'sim-btn', 'aria-label': 'Prediction for the next order' },
    h('option', { value: '' }, 'Predict the final estimate'),
    h('option', { value: '-1' }, 'Below 50'),
    h('option', { value: '0' }, 'Exactly 50'),
    h('option', { value: '1' }, 'Above 50'));

  function slider(title, min, max, initial, increment, change, display) {
    const output = h('span', {}, display(initial));
    const input = h('input', {
      type: 'range', min, max, value: initial, step: increment,
      'aria-label': title, style: { width: '100%', margin: '0', minHeight: '44px' },
    });
    const control = h('label', { style: { display: 'block', marginTop: '.55rem' } },
      title, ' ', output, input);
    function sync(value) {
      input.value = String(value);
      output.textContent = display(value);
      input.setAttribute('aria-valuetext', output.textContent);
    }
    input.addEventListener('input', () => {
      const value = Number(input.value);
      sync(value);
      change(value);
    });
    sync(initial);
    return { control, sync };
  }

  const signed = value => value > 0 ? `+${fmt(value)}` : fmt(value);
  const noiseInput = slider('Reading noise', -6, 6, noise[0], 1, value => {
    noise[selected] = value;
    reset();
  }, value => `(${signed(value)} cases)`);
  const driftInput = slider('Maximum weekly demand change', 0, 3, drift, 1, value => {
    drift = value;
    reset();
  }, value => `(${value} cases)`);
  const weightInput = slider('Weight on the starting guess', 0, 10, priorWeight, 1, value => {
    priorWeight = value;
    reset();
  }, value => `(${value})`);
  const speedInput = slider('Speed', 0.5, 3, speed, 0.5, value => {
    speed = value;
    if (timer !== null) {
      clearTimeout(timer);
      queueStep();
    }
  }, value => `(${fmt(value)}×)`);

  week.addEventListener('change', () => {
    selected = Number(week.value);
    draw();
  });
  prediction.addEventListener('change', draw);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it with North’s till readings'),
    h('p', { class: 'sub' },
      'Change a reading or let true demand move. Step through the weeks to see what each new reading does to the estimate.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset steps', reset),
          btn('New data', newData), stepCount),
        speedInput.control,
        h('div', { class: 'sim-row' }, week),
        noiseInput.control, driftInput.control, weightInput.control,
        h('p', { class: 'sim-note' },
          'The estimate starts at 50. A starting weight of 2 counts that guess like two extra readings.')),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' },
          challengeMount,
          h('div', { class: 'sim-row' }, prediction))))));

  const challenge = challenges(challengeMount, [
    {
      text: 'Pick a week where the till counted 3 extra cases.',
      check: state => state.gap === 3,
      why: 'The reading sits three cases above that week’s true demand.',
    },
    {
      text: 'Change a reading so the average is 50 and at least one gap remains.',
      check: state => state.edited && state.total === START * N && noise.some(gap => gap !== 0),
      why: 'The five readings still add to 250, even though some readings differ from true demand.',
    },
    {
      text: 'Predict where the final estimate will land, then step through all five weeks.',
      check: state => state.finished && prediction.value !== '' && Number(prediction.value) === state.direction,
      why: 'The final estimate blends all five readings with any weight on the starting guess.',
    },
  ]);

  function data() {
    const truth = [START];
    for (const direction of directions) truth.push(truth.at(-1) + direction * drift);
    const readings = truth.map((value, i) => value + noise[i]);
    return { truth, readings, total: readings.reduce((a, b) => a + b, 0) };
  }

  function stop() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function reset() {
    stop();
    history = [];
    prediction.value = '';
    draw();
  }

  function newData() {
    const previous = noise;
    noise = previous.map(() => rnd(-6, 6));
    if (noise.every((value, i) => value === previous[i])) {
      noise[0] = noise[0] === 6 ? -6 : noise[0] + 1;
    }
    originalNoise = noise.slice();
    directions = directions.map(() => rnd(-1, 1));
    selected = 0;
    week.value = '0';
    reset();
  }

  function advance() {
    const i = history.length;
    if (i >= N) return;
    const { truth, readings } = data();
    const old = history.at(-1)?.estimate ?? START;
    const reading = readings[i];
    const gap = reading - old;
    const divisor = priorWeight + i + 1;
    const change = gap / divisor;
    const estimate = old + change;
    const error = estimate - truth[i];
    history.push({ old, reading, gap, divisor, change, estimate, error, loss: error ** 2 });
    if (history.length === N) stop();
    draw();
  }

  function queueStep() {
    timer = setTimeout(() => {
      advance();
      if (timer !== null) queueStep();
    }, 1000 / speed);
  }

  function togglePlay() {
    if (timer !== null) stop();
    else if (history.length < N) queueStep();
    draw();
  }

  const svgLine = (x1, y1, x2, y2, stroke, width = 1, dash) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-dasharray': dash });
  const svgText = (x, y, text, fill = C.ink, anchor = 'start', size = 13) =>
    s('text', { x, y, fill, 'text-anchor': anchor, 'font-size': size,
      'font-family': 'Segoe UI, Arial, sans-serif' }, text);
  const polyline = (points, stroke, width) =>
    s('polyline', { points: points.map(point => point.join(',')).join(' '),
      fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const x = i => 51 + i * 59;
  const lossText = value => value > 0 && value < 0.005 ? '<0.01' : fmt(value);

  function drawPlot(truth, readings) {
    const min = Math.min(46, ...truth, ...readings);
    const max = Math.max(54, ...truth, ...readings);
    const tick = max - min <= 12 ? 2 : 5;
    const low = Math.floor(min / tick) * tick;
    const high = Math.ceil(max / tick) * tick;
    const y = value => 173 - (value - low) * 118 / (high - low);
    const nodes = [
      s('title', { id: 'north-demand-plot' }, 'North’s readings, true demand, estimate, and squared miss by week'),
      svgLine(16, 15, 30, 15, C.amber, 3), svgText(36, 19, 'True demand', C.amber),
      s('circle', { cx: 149, cy: 15, r: 4, fill: C.cyan }), svgText(160, 19, 'Till reading', C.cyan),
      s('circle', { cx: 275, cy: 15, r: 6, fill: 'none', stroke: C.violet, 'stroke-width': 2 }),
      svgText(287, 19, 'Estimate', C.violet),
      svgText(13, 41, 'Cases', C.muted),
      s('rect', { x: x(selected) - 18, y: 47, width: 36, height: 135, rx: 5,
        fill: C.cyan, 'fill-opacity': 0.06 }),
    ];

    for (let value = low; value <= high; value += tick) {
      nodes.push(svgLine(37, y(value), 367, y(value), C.line),
        svgText(30, y(value) + 4, String(value), C.muted, 'end'));
    }
    nodes.push(polyline(truth.map((value, i) => [x(i), y(value)]), C.amber, 2.5));
    if (noise[selected] !== 0) {
      nodes.push(svgLine(x(selected), y(truth[selected]), x(selected), y(readings[selected]), C.cyan, 2, '3 3'));
    }
    readings.forEach((value, i) => {
      nodes.push(
        s('circle', { cx: x(i), cy: y(value), r: 10, fill: C.cyan, 'fill-opacity': 0.12 }),
        s('circle', { cx: x(i), cy: y(value), r: 4.5, fill: C.cyan }),
        svgText(x(i), 197, `W${i + 1}`, i === selected ? C.cyan : C.muted, 'middle'),
      );
    });

    const estimatePath = history.map((step, i) => [x(i), y(step.estimate)]);
    if (estimatePath.length > 1) nodes.push(polyline(estimatePath, C.violet, 2));
    for (const [cx, cy] of estimatePath) {
      nodes.push(s('circle', { cx, cy, r: 7, fill: 'none', stroke: C.violet, 'stroke-width': 2 }));
    }
    if (history.length === N) {
      const orderY = y(history.at(-1).estimate);
      nodes.push(svgLine(x(N - 1) + 7, orderY, x(N) - 7, orderY, C.violet, 2, '4 4'),
        s('circle', { cx: x(N), cy: orderY, r: 6, fill: C.bg, stroke: C.violet, 'stroke-width': 2 }),
        svgText(x(N), 197, 'Next', C.violet, 'middle'));
    }

    const lossTick = Math.max(2, Math.ceil(Math.max(0, ...history.map(step => step.loss)) / 4) * 2);
    const lossY = value => 312 - value * 59 / (2 * lossTick);
    nodes.push(svgText(13, 229, 'Squared miss by step', C.violet, 'start', 15));
    for (const value of [0, lossTick, 2 * lossTick]) {
      nodes.push(svgLine(37, lossY(value), x(N - 1) + 14, lossY(value), C.line),
        svgText(30, lossY(value) + 4, String(value), C.muted, 'end', 12));
    }
    const lossPath = history.map((step, i) => [x(i), lossY(step.loss)]);
    if (lossPath.length > 1) nodes.push(polyline(lossPath, C.violet, 2));
    lossPath.forEach(([cx, cy]) => nodes.push(s('circle', { cx, cy, r: 4, fill: C.violet })));
    for (let i = 0; i < N; i++) nodes.push(svgText(x(i), 331, String(i + 1), C.muted, 'middle'));
    svg.replaceChildren(...nodes);
  }

  function draw() {
    const { truth, readings, total } = data();
    const iteration = history.length;
    const finished = iteration === N;
    const current = history.at(-1);
    const gap = noise[selected];

    noiseInput.sync(gap);
    stepCount.textContent = `Step ${iteration} of ${N}`;
    stepButton.disabled = finished;
    playButton.disabled = finished;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    prediction.disabled = iteration > 0;
    drawPlot(truth, readings);

    if (current) {
      const rows = [
        [`Week ${iteration}`, C.cyan],
        `Old estimate = ${fmt(current.old)}`,
        `Reading = ${current.reading}`,
        `Gap from estimate = ${signed(current.gap)}`,
        `Change = ${fmt(current.gap)} ÷ ${current.divisor} = ${signed(current.change)}`,
        [`New estimate = ${fmt(current.estimate)}`, C.violet],
        `Miss from true demand = ${signed(current.error)}`,
        `Squared miss = ${lossText(current.loss)}`,
      ];
      if (finished) rows.push([`Next order estimate = ${fmt(current.estimate)}`, C.green]);
      fbox(box, rows);
    } else {
      fbox(box, [
        [`Week ${selected + 1}`, C.cyan],
        [`True demand = ${truth[selected]}`, C.amber],
        `Reading noise = ${signed(gap)}`,
        [`Reading = ${truth[selected]} + (${signed(gap)}) = ${readings[selected]}`, C.cyan],
        `Average reading = ${total} ÷ ${N} = ${fmt(total / N)}`,
      ]);
    }

    challenge.update({
      gap, total, finished,
      direction: Math.sign(total - START * N),
      edited: noise.some((value, i) => value !== originalNoise[i]),
    });
  }

  draw();
  return stop;
}

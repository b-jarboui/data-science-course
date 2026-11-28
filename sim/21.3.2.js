// 21.3.2 Try it: turn unit arrows, compare captions, and train a toy alignment.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const names = ['Library crop', 'the library', 'the lab building', 'the pond'];
  const colors = [C.cyan, C.amber, C.green, C.violet];
  const START = [[0.8, 0.6], [0.6, 0.8], [1, 0], [-0.6, 0.8]]
    .map(([x, y]) => Math.atan2(y, x));
  const MAX_STEPS = 30;
  const degrees = radians => radians * 180 / Math.PI;
  const radians = angle => angle * Math.PI / 180;
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  const unit = angle => [Math.cos(angle), Math.sin(angle)];
  const rounded = x => Math.round(x * 100) / 100;
  const number = x => fmt(rounded(x)).replace('-', '−');
  const score = (angles, i) => Math.cos(angles[i] - angles[0]);
  const loss = angles => Math.max(0, 3 - score(angles, 1) + score(angles, 2) + score(angles, 3));

  let initial = START.slice(), angles = initial.slice();
  let selected = 1, rate = 25, speed = 2, iteration = 0, timer = null;
  let trace = [loss(angles)], last = null;
  let prediction = '', predictionResult = '';
  let turnedLibrary = false;

  const svg = s('svg', { viewBox: '0 0 400 495', role: 'img',
    'aria-label': 'Unit arrows and loss by training step' });
  const box = h('div');
  const note = h('div', { class: 'sim-note', role: 'status', 'aria-live': 'polite' });
  const stepText = h('div', { class: 'sim-note' });
  const challengeHost = h('div');
  const select = h('select', { 'aria-label': 'Arrow to turn', style: { minHeight: '44px', maxWidth: '100%' },
    onchange: event => { selected = Number(event.target.value); draw(); } },
  names.map((name, i) => h('option', { value: i }, name)));

  const sliderStyle = { width: '100%', minHeight: '44px', display: 'block' };
  const angleValue = h('output'), rateValue = h('output'), speedValue = h('output');
  const angleSlider = h('input', { type: 'range', min: -180, max: 180, step: 0.01,
    'aria-label': 'Arrow angle', style: sliderStyle, oninput: event => {
      const next = angles.slice();
      next[selected] = radians(Number(event.target.value));
      if (selected === 1) turnedLibrary = true;
      restart(next);
    } });
  const rateSlider = h('input', { type: 'range', min: 0, max: 250, step: 5, value: rate,
    style: sliderStyle, oninput: event => { rate = Number(event.target.value); draw(); } });
  const speedSlider = h('input', { type: 'range', min: 1, max: 8, step: 1, value: speed,
    style: sliderStyle, oninput: event => {
      speed = Number(event.target.value);
      if (timer !== null) {
        pause();
        startTimer();
      }
      draw();
    } });
  const captionControls = h('div', { class: 'sim-row' },
    h('label', {}, 'Arrow to turn ', select),
    h('label', { style: { width: '100%' } }, 'Turn arrow ', angleValue, angleSlider));

  const stepButton = btn('Step', () => { pause(); step(); }, 'go');
  const playButton = btn('Play', () => {
    if (timer !== null) pause();
    else startTimer();
    draw();
  });
  const predictDown = btn('Lower', () => choosePrediction('lower'));
  const predictFlat = btn('Same or higher', () => choosePrediction('same or higher'));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: turn the arrows'),
    h('p', { class: 'sub' },
      'Turn an arrow to change its match scores. Then train the caption arrows and watch how the scores and loss change.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, captionControls,
        h('div', { class: 'sim-row' },
          stepButton, playButton,
          btn('Reset', () => restart(initial)),
          btn('New data', () => {
            turnedLibrary = false;
            const cropAngle = rnd(-180, 179);
            restart([cropAngle, cropAngle + rnd(20, 110) * (rnd(0, 1) ? 1 : -1),
              cropAngle + rnd(35, 100), cropAngle - rnd(35, 100)].map(a => wrap(radians(a))));
          }),
          btn('Lesson data', () => { turnedLibrary = false; restart(START); })),
        h('label', { style: { display: 'block', marginTop: '0.8rem' } },
          'Learning rate ', rateValue, rateSlider),
        h('label', { style: { display: 'block' } }, 'Play speed ', speedValue, speedSlider),
        stepText),
      h('div', {},
        h('div', { class: 'sim-card' }, box,
          h('p', { class: 'sim-note' },
            'The crop stays fixed during training. The library caption turns toward it. The other captions turn toward the opposite direction.'),
          h('p', { class: 'sim-note' },
            'Loss adds the three gaps from the target scores. The targets are 1 for the matching caption and −1 for each other caption.'),
          h('div', { class: 'sim-note' }, 'Predict the loss after the next step.'),
          h('div', { class: 'sim-row' }, predictDown, predictFlat),
          note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'Turn “the library” until its score is at least 0.99.',
      check: state => state.turnedLibrary && state.iteration === 0 && state.library >= 0.99,
      why: 'The score is close to 1 because the two arrows point almost the same way.',
    },
    {
      text: 'At a learning rate of 25%, predict a lower loss, then press Step.',
      check: state => state.last?.rate === 25 && state.last?.prediction === 'lower'
        && state.last.after < state.last.before - 1e-8,
      why: 'The matching arrow moved closer and the other arrows moved away, so the loss fell.',
    },
    {
      text: 'From a fresh start, get the loss to 0 in one step.',
      check: state => state.iteration === 1 && state.last?.before > 0.01 && state.loss < 1e-8,
      why: 'A 100% turn reaches each target direction in one step in this toy model.',
    },
    {
      text: 'Start with loss above 0 and find the learning rate that makes no progress in three steps.',
      check: state => state.last?.rate === 0 && state.zeroSteps >= 3 && state.loss > 0.01,
      why: 'At 0% the captions never turn, so the loss stays where it started.',
    },
  ]);
  let zeroSteps = 0;
  challengeHost.addEventListener('click', updateChallenge);

  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function startTimer() {
    if (iteration < MAX_STEPS) timer = setInterval(step, 1000 / speed);
  }

  function restart(next) {
    pause();
    initial = next.slice();
    angles = initial.slice();
    iteration = 0;
    zeroSteps = 0;
    trace = [loss(angles)];
    last = null;
    prediction = '';
    predictionResult = '';
    draw();
  }

  function choosePrediction(choice) {
    prediction = choice;
    predictionResult = '';
    draw();
  }

  function step() {
    if (iteration >= MAX_STEPS) return;
    const old = angles.slice();
    const turns = old.map((a, i) => {
      if (i === 0) return 0;
      const target = old[0] + (i === 1 ? 0 : Math.PI);
      return wrap(target - a) * rate / 100;
    });
    angles = old.map((a, i) => wrap(a + turns[i]));
    const before = trace[trace.length - 1], after = loss(angles);
    last = { old, turns, before, after, rate, prediction };
    if (prediction) {
      const result = after < before - 1e-8 ? 'lower' : 'same or higher';
      predictionResult = result === prediction
        ? `Your prediction matched. The loss was ${result}.`
        : `The loss was ${result}. You predicted ${prediction}.`;
      prediction = '';
    }
    trace.push(after);
    zeroSteps = rate === 0 ? zeroSteps + 1 : 0;
    iteration++;
    if (iteration >= MAX_STEPS) pause();
    draw();
  }

  function updateChallenge() {
    chal.update({ turnedLibrary, iteration, library: score(angles, 1), loss: loss(angles), last, zeroSteps });
  }

  function text(x, y, value, color = C.ink, size = 16, anchor = 'middle') {
    return s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': '"Segoe UI", Arial, sans-serif' }, value);
  }

  function line(x1, y1, x2, y2, stroke, width = 1) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round' });
  }

  function drawPlot() {
    const cx = 200, cy = 123, r = 93;
    const parts = [
      s('circle', { cx, cy, r, fill: C.bg, stroke: C.line, 'stroke-width': 2 }),
      line(cx - 106, cy, cx + 106, cy, C.muted),
      line(cx, cy - 106, cx, cy + 106, C.muted),
    ];
    const order = [1, 2, 3].filter(i => i !== selected).concat(0);
    if (selected !== 0) order.push(selected);
    const overlapCount = new Map();
    order.forEach(i => {
      const [dx, dy] = unit(angles[i]);
      const x = cx + r * dx, y = cy - r * dy, color = colors[i];
      const direction = `${Math.round(dx * 100000)},${Math.round(dy * 100000)}`;
      const overlap = overlapCount.get(direction) || 0;
      overlapCount.set(direction, overlap + 1);
      const length = 12 + Math.max(0, 2 - overlap) * 2, wing = 5 + Math.max(0, 2 - overlap);
      const width = overlap ? 2.4 : i === selected ? 6 : 4.5;
      const shaft = line(cx, cy, x, y, color, width);
      if (overlap) shaft.setAttribute('stroke-dasharray', overlap === 1 ? '9 6' : '2 13');
      parts.push(shaft, s('polygon', {
        points: `${x},${y} ${x - dx * length - dy * wing},${y + dy * length - dx * wing} ${x - dx * length + dy * wing},${y + dy * length + dx * wing}`,
        fill: color,
      }));
    });
    parts.push(s('circle', { cx, cy, r: 4, fill: C.ink }));
    names.forEach((name, i) => {
      const x = 16 + (i % 2) * 196;
      const y = 258 + Math.floor(i / 2) * 31;
      parts.push(line(x, y - 5, x + 16, y - 5, colors[i], i === selected ? 6 : 4),
        text(x + 23, y, i ? `${name}  ${number(score(angles, i))}` : name, colors[i], 15, 'start'));
    });

    const x0 = 39, x1 = 380, y0 = 449, y1 = 343;
    const upperStep = Math.max(5, Math.ceil(iteration / 5) * 5);
    const plotX = i => x0 + i / upperStep * (x1 - x0);
    const plotY = value => y0 - value / 6 * (y0 - y1);
    parts.push(text(x0, 322, 'Loss', C.amber, 17, 'start'));
    for (const value of [0, 3, 6]) {
      const y = plotY(value);
      parts.push(line(x0, y, x1, y, C.line), text(x0 - 9, y + 5, value, C.muted, 14, 'end'));
    }
    parts.push(line(x0, y1, x0, y0, C.muted), line(x0, y0, x1, y0, C.muted));
    const tick = upperStep > 15 ? 10 : 5;
    for (let i = 0; i <= upperStep; i += tick) {
      parts.push(text(plotX(i), y0 + 20, i, C.muted, 14));
    }
    parts.push(text((x0 + x1) / 2, 489, 'Training step', C.muted, 14));
    parts.push(s('polyline', { points: trace.map((value, i) => `${plotX(i)},${plotY(value)}`).join(' '),
      stroke: C.amber, 'stroke-width': 3, fill: 'none', 'stroke-linejoin': 'round' }));
    trace.forEach((value, i) => parts.push(s('circle', {
      cx: plotX(i), cy: plotY(value), r: i === iteration ? 4 : 2.4, fill: C.amber,
    })));
    svg.replaceChildren(...parts);
  }

  function draw() {
    select.value = String(selected);
    const angle = degrees(angles[selected]);
    angleSlider.value = String(angle);
    angleValue.textContent = `${number(angle)}°`;
    rateValue.textContent = `${rate}% of the remaining turn`;
    speedValue.textContent = `${speed} ${speed === 1 ? 'step' : 'steps'} per second`;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    playButton.disabled = iteration >= MAX_STEPS;
    stepButton.disabled = iteration >= MAX_STEPS;
    predictDown.setAttribute('aria-pressed', String(prediction === 'lower'));
    predictFlat.setAttribute('aria-pressed', String(prediction === 'same or higher'));
    predictDown.classList.toggle('go', prediction === 'lower');
    predictFlat.classList.toggle('go', prediction === 'same or higher');
    stepText.textContent = iteration === MAX_STEPS
      ? `Step ${iteration} of ${MAX_STEPS}. Reset or turn an arrow to start again.`
      : `Step ${iteration} of ${MAX_STEPS}`;

    drawPlot();
    const comparison = selected || 1;
    const [cx, cy] = unit(angles[0]), [tx, ty] = unit(angles[comparison]);
    const match = score(angles, comparison);
    const rows = [
      [`Crop with “${names[comparison]}”`, colors[comparison]],
      `Right: ${number(cx)} × (${number(tx)}) ≈ ${number(cx * tx)}`,
      `Up:    ${number(cy)} × (${number(ty)}) ≈ ${number(cy * ty)}`,
      [`Score ≈ ${number(match)}`, colors[comparison]],
    ];
    if (last) {
      rows.push(`Step ${iteration} · ${names[comparison]}`,
        `Angle: ${number(degrees(last.old[comparison]))}° → ${number(degrees(angles[comparison]))}°`,
        `Turn: ${number(degrees(last.turns[comparison]))}° at ${last.rate}%`,
        [`Loss: ${number(last.before)} → ${number(last.after)}`, C.amber]);
    } else {
      rows.push([`Loss: ${number(trace[0])}`, C.amber]);
    }
    fbox(box, rows);
    note.textContent = prediction ? `Prediction set: ${prediction}. Press Step or Play.`
      : predictionResult || 'The displayed numbers are rounded.';
    updateChallenge();
  }

  draw();
  return pause;
}

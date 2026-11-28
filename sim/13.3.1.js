// 13.3.1 Try it: change the class weights and fit one shared prediction.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const PHOTOS = 12, SCALE = 10000;
  const initial = { metal: 3, weight: 3, start: 0, stride: 25 };
  let settings = { ...initial };
  let prediction, direction, stride, seen, history, finished, stepInfo;
  let timer = null, playing = false, forecast = null, playedFromStart = false;
  let reachedInTwo = false, forecastConfirmed = false;
  const number = value => String(Number(value.toFixed(6)));
  const pct = value => `${number(value / 100)}%`;

  function lossAt(value) {
    const p = value / SCALE;
    const plastic = PHOTOS - settings.metal;
    const metalTokens = settings.metal * settings.weight;
    return (plastic * p ** 2 + metalTokens * (1 - p) ** 2) / (plastic + metalTokens);
  }

  const lessonSettings = () => Object.keys(initial).every(key => settings[key] === initial[key]);
  const svg = s('svg', {
    viewBox: '0 0 440 335', role: 'img', style: 'touch-action: auto',
    'aria-label': 'Photographs by class and loss by step',
  });
  const box = h('div');
  const note = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const challengePanel = h('div');

  function slider(label, min, max, value, onInput) {
    const output = h('span');
    const input = h('input', { type: 'range', min, max, value,
      style: { width: '100%', minHeight: '2.75rem', accentColor: C.cyan },
      oninput: event => onInput(Number(event.currentTarget.value)),
    });
    return {
      input, output,
      row: h('label', { style: { display: 'block', marginTop: '.55rem' } },
        h('span', {}, `${label} `, output), input),
    };
  }

  function set(key, value) {
    settings[key] = value;
    reset();
  }

  const metalControl = slider('Metal photos', 1, 11, initial.metal, value => set('metal', value));
  const weightControl = slider('Weight per metal photo', 1, 12, initial.weight, value => set('weight', value));
  const startControl = slider('Starting chance of metal', 0, 100, initial.start, value => set('start', value));
  const strideControl = slider('First change in percentage points', 1, 100, initial.stride, value => set('stride', value));
  const speedControl = slider('Speed', 1, 5, 3, () => {
    drawSpeed();
    if (playing) schedule();
  });
  const count = h('strong', { class: 'sim-note' });
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', toggle);
  const forecast25 = btn('25%', () => chooseForecast(2500));
  const forecast50 = btn('50%', () => chooseForecast(5000));
  const forecastLabel = h('span', { class: 'sim-note' });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: give metal more weight'),
    h('p', { class: 'sub' }, 'The computer gives every photo the same chance of being metal. It tries a change, then keeps it if the loss is smaller. A plastic photo always has weight 1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', reset),
          btn('New data', () => {
            const counts = Array.from({ length: 11 }, (_, i) => i + 1)
              .filter(n => n !== settings.metal);
            set('metal', counts[rnd(0, counts.length - 1)]);
          }), count),
        metalControl.row, weightControl.row, startControl.row, strideControl.row, speedControl.row,
        h('div', { class: 'sim-row' }, btn('Lesson settings', () => {
          settings = { ...initial };
          reset();
        }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('div', { class: 'sim-row' }, h('span', {}, 'Predict where it will settle'), forecast25, forecast50),
          forecastLabel, challengePanel)))));

  const challenge = challenges(challengePanel, [
    {
      text: 'Use Lesson settings, then reach a loss of 0.25 in two steps.',
      check: state => state.reachedInTwo,
      why: 'Two increases of 25 points take the shared chance from 0% to 50%, where the two classes have equal total weight.',
    },
    {
      text: 'Use Lesson settings, predict 25% or 50%, then press Play to check.',
      check: state => state.forecastConfirmed,
      why: 'At 50%, each class has nine tokens, so the best shared chance is halfway between plastic and metal.',
    },
    {
      text: 'With 9 plastic and 3 metal photos, find a metal weight that makes the fitted model call every plastic photo metal.',
      check: state => state.metal === 3 && state.finished && state.prediction > SCALE / 2,
      why: 'The larger metal weight pulls the shared chance above 50%, so the computer guesses metal for every photo.',
    },
  ]);

  function chooseForecast(value) {
    if (history.length !== 1 || playing) return;
    forecast = value;
    draw();
  }

  function reset() {
    stop();
    prediction = settings.start * 100;
    stride = settings.stride * 100;
    direction = 1;
    seen = new Set();
    history = [{ kept: lossAt(prediction), trial: null, accepted: true }];
    stepInfo = null;
    finished = false;
    forecast = null;
    playedFromStart = false;
    draw();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(step, 1800 / Number(speedControl.input.value));
  }

  function toggle() {
    if (playing) {
      stop();
    } else if (!finished) {
      if (history.length === 1 && lessonSettings() && forecast !== null) playedFromStart = true;
      playing = true;
      schedule();
    }
    draw();
  }

  function candidate(dir) {
    return Math.max(0, Math.min(SCALE, prediction + dir * stride));
  }

  function nextTrial() {
    // Remember tried points at the current prediction, including the point we
    // just improved on. Try the other side before making the change smaller.
    while (stride > 0) {
      for (const dir of [direction, -direction]) {
        const value = candidate(dir);
        if (value !== prediction && !seen.has(value)) {
          direction = dir;
          return value;
        }
      }
      stride = Math.floor(stride / 2);
    }
    return null;
  }

  function step() {
    if (finished) return;
    const old = prediction;
    const oldLoss = lossAt(old);
    const trial = nextTrial();
    if (trial === null) {
      finished = true;
      stop();
      draw();
      return;
    }
    const trialLoss = lossAt(trial);
    const accepted = trialLoss < oldLoss - 1e-12;
    if (accepted) {
      prediction = trial;
      seen = new Set([old]);
    } else {
      seen.add(trial);
    }
    const kept = accepted ? trialLoss : oldLoss;
    history.push({ kept, trial: trialLoss, accepted });
    stepInfo = { old, oldLoss, trial, trialLoss, accepted };
    finished = nextTrial() === null;

    if (lessonSettings() && history.length === 3 && kept === 0.25) reachedInTwo = true;
    if (finished) {
      if (playedFromStart && forecast === prediction) forecastConfirmed = true;
      stop();
    } else if (playing) {
      schedule();
    }
    draw();
  }

  function svgText(x, y, value, color = C.ink, size = 16, anchor = 'start') {
    return s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace' }, value);
  }

  function drawPhotos() {
    const plastic = PHOTOS - settings.metal;
    const groups = [
      { y: 28, n: plastic, weight: 1, label: 'Plastic', color: BLUE, metal: false },
      { y: 66, n: settings.metal, weight: settings.weight, label: 'Metal', color: ORANGE, metal: true },
    ];
    return groups.flatMap(({ y, n, weight, label, color, metal }) => [
      svgText(6, y + 5, `${n} ${label}`, color),
      ...Array.from({ length: n }, (_, i) => {
        const x = 115 + 15 * i;
        return metal
          ? s('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 1, fill: color })
          : s('circle', { cx: x, cy: y, r: 5, fill: color });
      }),
      svgText(434, y + 5, `${n * weight} tokens`, color, 16, 'end'),
    ]);
  }

  function drawGraph() {
    const left = 57, right = 424, top = 131, base = 288;
    const last = history.length - 1, extent = Math.max(6, last);
    const peak = Math.max(...history.map(point => Math.max(point.kept, point.trial ?? 0)));
    const maxLoss = Math.min(1, Math.max(0.5, Math.ceil(peak * 4) / 4));
    const x = i => left + (right - left) * i / extent;
    const y = loss => base - (base - top) * loss / maxLoss;
    const levels = Array.from({ length: maxLoss * 4 + 1 }, (_, i) => i / 4);
    const ticks = [0, Math.floor(extent / 2), extent];
    return [
      svgText(6, 107, 'Weighted mean loss', C.ink, 17),
      svgText(429, 107, '● Kept   × Rejected', C.muted, 14, 'end'),
      ...levels.flatMap(value => [
        s('line', { x1: left, x2: right, y1: y(value), y2: y(value), stroke: C.line }),
        svgText(left - 9, y(value) + 5, number(value), C.muted, 14, 'end'),
      ]),
      s('line', { x1: left, x2: left, y1: top, y2: base, stroke: C.muted }),
      ...ticks.map(i => svgText(x(i), base + 21, i, C.muted, 14, 'middle')),
      svgText((left + right) / 2, 331, 'Step', C.ink, 16, 'middle'),
      s('polyline', { points: history.map((point, i) => `${x(i)},${y(point.kept)}`).join(' '),
        fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }),
      ...history.flatMap((point, i) => {
        const px = x(i), keptY = y(point.kept);
        const kept = s('circle', { cx: px, cy: keptY, r: i === last ? 4 : 2.9, fill: C.cyan });
        if (point.accepted) return [kept];
        const trialY = y(point.trial);
        return [
          kept,
          s('line', { x1: px, x2: px, y1: keptY, y2: trialY, stroke: C.pink, 'stroke-dasharray': '3 3' }),
          svgText(px, trialY + (keptY - trialY < 14 ? -7 : 5), '×', C.pink, 16, 'middle'),
        ];
      }),
    ];
  }

  function drawSpeed() {
    speedControl.output.textContent = `${speedControl.input.value} / 5`;
  }

  function draw() {
    metalControl.input.value = settings.metal;
    metalControl.output.textContent = `${settings.metal} of ${PHOTOS}`;
    weightControl.input.value = settings.weight;
    weightControl.output.textContent = settings.weight;
    startControl.input.value = settings.start;
    startControl.output.textContent = `${settings.start}%`;
    strideControl.input.value = settings.stride;
    strideControl.output.textContent = settings.stride;
    drawSpeed();

    const iteration = history.length - 1;
    count.textContent = `Step ${iteration}${finished ? ' · Settled' : ''}`;
    playButton.textContent = playing ? 'Pause' : 'Play';
    stepButton.disabled = finished || playing;
    playButton.disabled = finished;
    forecast25.disabled = forecast50.disabled = playing || iteration > 0;
    forecast25.setAttribute('aria-pressed', String(forecast === 2500));
    forecast50.setAttribute('aria-pressed', String(forecast === 5000));
    forecastLabel.textContent = forecast === null ? 'Choose before the first step.'
      : finished ? `You picked ${pct(forecast)}. It settled at ${pct(prediction)}.`
      : `You picked ${pct(forecast)}.`;

    const plastic = PHOTOS - settings.metal;
    const metalTokens = settings.metal * settings.weight;
    const keptLoss = history[iteration].kept;
    const rows = [[`Plastic tokens: ${plastic} × 1 = ${plastic}`, BLUE],
      [`Metal tokens: ${settings.metal} × ${settings.weight} = ${metalTokens}`, ORANGE]];
    if (stepInfo) {
      const { old, oldLoss, trial, trialLoss, accepted } = stepInfo;
      const delta = trial - old;
      rows.push(`Before: ${pct(old)} · loss ${number(oldLoss)}`,
        `Try ${delta >= 0 ? '+' : '−'}${number(Math.abs(delta) / 100)} points → ${pct(trial)}`,
        [`Trial loss: ${number(trialLoss)} · ${accepted ? 'keep' : 'reject'}`, accepted ? C.green : C.pink]);
    }
    const p = prediction / SCALE;
    const plasticLoss = plastic * p ** 2, metalLoss = metalTokens * (1 - p) ** 2;
    rows.push(`Now: ${pct(prediction)} chance of metal`, 'Weighted mean loss',
      [`(${number(plasticLoss)} + ${number(metalLoss)}) ÷ ${plastic + metalTokens} = ${number(keptLoss)}`, C.amber]);
    fbox(box, rows);

    const callsMetal = prediction > SCALE / 2;
    note.textContent = `At 50% or below the guess is plastic. With the current prediction, it gets `
      + `${callsMetal ? 0 : plastic} of ${plastic} plastic and ${callsMetal ? settings.metal : 0} of ${settings.metal} metal photos right.`;
    svg.setAttribute('aria-label', `Photo weights and loss by step. Step ${iteration}, current loss ${number(keptLoss)}.`);
    svg.replaceChildren(...drawPhotos(), ...drawGraph());
    challenge.update({ reachedInTwo, forecastConfirmed, metal: settings.metal, prediction, finished });
  }

  // The shared challenge widget checks the active challenge on update. Check
  // again after navigation so a result already reached gets credit immediately.
  challengePanel.addEventListener('click', () => {
    challenge.update({ reachedInTwo, forecastConfirmed, metal: settings.metal, prediction, finished });
  });

  reset();
  return stop;
}

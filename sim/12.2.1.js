// 12.2.1 Try it: fit a mileage ruler on training bikes and use it on new bikes.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [1000, 2000, 3000, 3000, 3000, 4000, 4000, 4000];
  const FIRST_NEW = [6000, 600];
  const MAX_NEW = 4;
  const MAX_KM = 8000;
  const STEP = 100;
  const WIDTH = 390;
  const LEFT = 44;
  const RIGHT = 365;
  const RAW_AXIS = 194;
  const SCORE_AXIS = 395;

  let training = START.slice();
  let newBikes = [];
  let selected = { kind: 'training', index: 0 };
  let drag = null;
  const events = new AbortController();
  const on = (element, type, handler) => element.addEventListener(type, handler, { signal: events.signal });
  const kmText = value => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const scoreText = value => value > 0 ? `+${fmt(value)}` : fmt(value).replace('-', '−');
  const fromX = x => Math.max(0, Math.min(MAX_KM,
    Math.round((x - LEFT) / (RIGHT - LEFT) * MAX_KM / STEP) * STEP));
  const rawX = km => LEFT + km / MAX_KM * (RIGHT - LEFT);
  const sameSelection = bike => bike.kind === selected.kind && bike.index === selected.index;
  const bikeName = ({ kind, index }) => kind === 'training' ? `Training bike ${index + 1}` : `New bike N${index + 1}`;

  const svg = s('svg', {
    viewBox: `0 0 ${WIDTH} 431`, role: 'img',
    'aria-label': 'Training and new bikes plotted first in kilometres, then in typical steps.',
  });
  const picker = h('select', { 'aria-label': 'Choose a bike', class: 'sim-btn' });
  const slider = h('input', {
    type: 'range', min: 0, max: MAX_KM, step: STEP, 'aria-label': 'Mileage of the selected bike',
    style: { flex: '1 1 10rem', minHeight: '44px' },
  });
  const mileageLabel = h('output', { class: 'sim-note', style: { margin: 0 } });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const challengeCard = h('div');
  const add = btn('Add a new bike', addBike, 'go');
  const remove = btn('Remove last new bike', removeBike);
  const ui = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: one training ruler'),
    h('p', { class: 'sub' },
      'Drag a bike on the mileage line, or choose it and move the slider. Cyan bikes set the ruler. Violet bikes use it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, picker, slider, mileageLabel),
        h('div', { class: 'sim-row' }, add, remove,
          btn('New data', randomize), btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeCard))));
  root.append(ui);

  const task = challenges(challengeCard, [
    {
      text: 'Reset, then add N1 at 6,000 km to give it a score of +3.',
      check: ({ original, newBikes, score }) => original && newBikes[0] === 6000 && score(6000) === 3,
      why: 'N1 is 3,000 km above the training mean, which is three steps of 1,000 km.',
    },
    {
      text: 'Move the training bikes until their mean is exactly 3,100 km.',
      check: ({ mean }) => mean === 3100,
      why: 'The eight training mileages now add up to 24,800 km, so the mean is 3,100 km.',
    },
    {
      text: 'With the original training bikes, move N1 to 3,000 km and add N2 at 600 km.',
      check: ({ original, newBikes, score }) => original && newBikes[0] === 3000 &&
        newBikes[1] === 600 && score(3000) === 0 && score(600) === -2.4,
      why: 'N1 lands at the training mean, and N2 is 2.4 training steps below it.',
    },
  ]);

  function allBikes() {
    return [
      ...training.map((km, index) => ({ kind: 'training', index, km })),
      ...newBikes.map((km, index) => ({ kind: 'new', index, km })),
    ];
  }

  function fit() {
    const total = training.reduce((sum, km) => sum + km, 0);
    const mean = total / training.length;
    const variance = training.reduce((sum, km) => sum + (km - mean) ** 2, 0) / training.length;
    return { mean, sd: Math.sqrt(variance) };
  }

  function setMileage(km) {
    const values = selected.kind === 'training' ? training : newBikes;
    values[selected.index] = km;
    draw();
  }

  function addBike() {
    if (newBikes.length >= MAX_NEW) return;
    selected = { kind: 'new', index: newBikes.length };
    newBikes.push(FIRST_NEW[selected.index] ?? STEP * rnd(0, MAX_KM / STEP));
    draw(true);
  }

  function removeBike() {
    if (!newBikes.length) return;
    newBikes.pop();
    if (selected.kind === 'new' && selected.index >= newBikes.length) {
      selected = newBikes.length ? { kind: 'new', index: newBikes.length - 1 } : { kind: 'training', index: 0 };
    }
    draw(true);
  }

  function randomize() {
    training = START.map(() => STEP * rnd(0, MAX_KM / STEP));
    if (training.every(km => km === training[0])) training[0] = (training[0] + STEP) % (MAX_KM + STEP);
    newBikes = [];
    selected = { kind: 'training', index: 0 };
    draw(true);
  }

  function reset() {
    training = START.slice();
    newBikes = [];
    selected = { kind: 'training', index: 0 };
    draw(true);
  }

  on(slider, 'input', () => setMileage(Number(slider.value)));
  on(picker, 'change', () => {
    const [kind, index] = picker.value.split(':');
    selected = { kind, index: Number(index) };
    draw();
  });
  // The kit changes the active challenge when its navigation button is clicked.
  on(challengeCard, 'click', () => draw());

  function svgX(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse()).x;
  }

  on(svg, 'pointerdown', event => {
    const marker = event.target.closest('[data-bike]');
    if (drag || !marker || event.button !== 0) return;
    const [kind, index] = marker.getAttribute('data-bike').split(':');
    selected = { kind, index: Number(index) };
    const km = (kind === 'training' ? training : newBikes)[selected.index];
    drag = { id: event.pointerId, offset: svgX(event) - rawX(km) };
    svg.setPointerCapture(event.pointerId);
    draw();
  });
  on(svg, 'pointermove', event => {
    if (drag?.id === event.pointerId) setMileage(fromX(svgX(event) - drag.offset));
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    on(svg, type, event => { if (drag?.id === event.pointerId) drag = null; });
  }

  function label(x, y, value, color = C.ink, anchor = 'middle', size = 14) {
    return s('text', { x, y, fill: color, 'text-anchor': anchor, 'font-size': size,
      'font-family': 'Segoe UI, Arial, sans-serif', 'pointer-events': 'none' }, value);
  }

  function segment(x1, y1, x2, y2, color, dash) {
    return s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': dash });
  }

  function axis(map, y, ticks, format) {
    return [
      segment(LEFT, y, RIGHT, y, C.muted),
      ...ticks.flatMap(value => [
        segment(map(value), y - 3, map(value), y + 5, C.muted),
        label(map(value), y + 22, format(value), C.ink),
      ]),
    ];
  }

  function marker(bike, x, y, draggable) {
    const color = bike.kind === 'training' ? C.cyan : C.violet;
    const active = sameSelection(bike);
    const key = `${bike.kind}:${bike.index}`;
    return s('g', { 'data-bike': draggable ? key : null, style: draggable ? 'cursor: ew-resize' : null },
      draggable ? s('circle', { cx: x, cy: y, r: 12, fill: 'transparent' }) : null,
      active ? s('circle', { cx: x, cy: y, r: 8, fill: C.bg, stroke: C.amber, 'stroke-width': 2 }) : null,
      s('circle', { cx: x, cy: y, r: 4.7, fill: color }),
      s('title', {}, `${bikeName(bike)}: ${kmText(bike.km)} km`));
  }

  function scoreLimit(bikes, score) {
    const maximum = Math.max(2, ...bikes.map(bike => Math.abs(score(bike.km))));
    const factor = 10 ** Math.floor(Math.log10(maximum / 2));
    return 2 * Math.ceil(maximum / (2 * factor)) * factor;
  }

  function draw(rebuildPicker = false) {
    const bikes = allBikes();
    const { mean, sd } = fit();
    const score = km => sd === 0 ? null : (km - mean) / sd;
    const active = bikes.find(sameSelection);
    if (rebuildPicker) {
      picker.replaceChildren(...bikes.map(bike =>
        h('option', { value: `${bike.kind}:${bike.index}` }, bikeName(bike))));
    }
    picker.value = `${selected.kind}:${selected.index}`;
    slider.value = active.km;
    slider.setAttribute('aria-valuetext', `${kmText(active.km)} kilometres`);
    mileageLabel.textContent = `${kmText(active.km)} km`;
    add.disabled = newBikes.length >= MAX_NEW;
    remove.disabled = newBikes.length === 0;

    const laneY = (bike, y) => y - (bike.kind === 'training' ? 140 : 44) + 11 * bike.index;
    const meanX = rawX(mean);
    const picture = [
      label(LEFT, 21, 'Mileage (km)', C.ink, 'start', 17),
      segment(meanX, 39, meanX, RAW_AXIS, C.amber, '5 4'),
      label(Math.max(60, Math.min(WIDTH - 57, meanX)), 37, 'Training mean', C.amber, 'middle', 12),
      ...axis(rawX, RAW_AXIS, [0, 2000, 4000, 6000, 8000], kmText),
    ];
    bikes.forEach(bike => {
      const y = laneY(bike, RAW_AXIS);
      const id = bike.kind === 'training' ? `T${bike.index + 1}` : `N${bike.index + 1}`;
      picture.push(label(27, y + 4, id, bike.kind === 'training' ? C.cyan : C.violet, 'end', 11),
        marker(bike, rawX(bike.km), y, true));
    });

    picture.push(label(LEFT, 244, 'Standard score (typical steps)', C.ink, 'start', 17));
    if (sd === 0) {
      picture.push(label((LEFT + RIGHT) / 2, 320, 'No typical step to count', C.amber));
    } else {
      const limit = scoreLimit(bikes, score);
      const scoreX = value => LEFT + (value + limit) / (2 * limit) * (RIGHT - LEFT);
      picture.push(segment(scoreX(0), 253, scoreX(0), SCORE_AXIS, C.amber, '5 4'),
        ...axis(scoreX, SCORE_AXIS, [-limit, -limit / 2, 0, limit / 2, limit], scoreText));
      bikes.forEach(bike => picture.push(marker(bike, scoreX(score(bike.km)), laneY(bike, SCORE_AXIS), false)));
    }
    svg.replaceChildren(...picture);

    const selectedScore = score(active.km);
    fbox(box, [
      [bikeName(active), active.kind === 'training' ? C.cyan : C.violet],
      ['Training mean: ' + kmText(mean) + ' km', C.amber],
      ['Training step: ' + kmText(sd) + ' km', C.green],
      selectedScore === null ? 'Score needs a step above zero' : [
        `(${kmText(active.km)} − ${kmText(mean)}) ÷ ${kmText(sd)} = ${scoreText(selectedScore)}`,
        C.ink,
      ],
    ]);
    note.textContent = sd === 0
      ? 'Every training bike has the same mileage, so the typical step is zero. Move a training bike to use scores again.'
      : 'The training step is the standard deviation. Changing a new bike changes its score while the training ruler stays fixed.';
    task.update({ mean, newBikes, score, original: training.every((km, index) => km === START[index]) });
  }

  draw(true);
  return () => {
    events.abort();
    ui.remove();
  };
}

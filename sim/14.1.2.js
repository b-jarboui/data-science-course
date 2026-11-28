// 14.1.2 Try it: compare distances, then see what happens when centres move.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const names = ['Blue', 'Orange', 'Purple', 'Green'];
  const colors = ['#60a5fa', '#fb923c', C.violet, C.green];
  const XMAX = 10, YMAX = 7;
  const squared = ([x, y], [a, b]) => (x - a) ** 2 + (y - b) ** 2;
  const same = (a, b) => a.length === b.length && a.every((p, i) => squared(p, b[i]) < 1e-18);
  const distance = value => Number.isInteger(value) ? String(value) : value.toFixed(2);
  const number = value => String(Number(value.toFixed(4)));
  const pair = p => `(${p.map(number).join(', ')})`;
  const clamp = (value, max) => Math.max(0, Math.min(max, value));
  const options = labels => labels.map((label, i) => h('option', { value: i }, label));

  let data = START.slice(), seeds = data.slice(0, 2), centres = seeds.slice();
  let history = [], last = null, firstPrediction = false;
  let playing = false, timer = null, dragging = null, station = 5;

  const svg = s('svg', { viewBox: '0 0 400 290', role: 'img', 'aria-label': 'Bicycle stations and their group centres' });
  const curve = s('svg', { viewBox: '0 0 360 146', role: 'img', 'aria-label': 'Total squared distance by iteration' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const status = h('div', { class: 'sim-note', role: 'status' });
  const challengePanel = h('div');

  const count = h('select', { 'aria-label': 'Number of groups' },
    [2, 3, 4].map(n => h('option', { value: n }, String(n))));
  const target = h('select', { 'aria-label': 'Station or starting centre to edit' });
  const enterX = h('input', { type: 'number', min: 0, max: XMAX, step: 1, style: { width: '4.5rem' } });
  const enterY = h('input', { type: 'number', min: 0, max: YMAX, step: 1, style: { width: '4.5rem' } });
  const speed = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 2 });
  const guess = h('select', { 'aria-label': 'Predicted group for station F' },
    h('option', { value: '' }, 'Choose a group'), ...options(names.slice(0, 2)));
  const stepButton = btn('Step', () => { stop(); step(); }, 'go');
  const playButton = btn('Play', toggle);
  const label = (caption, control) => h('label', {}, `${caption} `, control);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the nearest centre'),
    h('p', { class: 'sub' }, 'Choose a station or starting centre, then drag it on the grid or enter its coordinates. Step assigns every station and then moves each centre to its group average.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, label('Edit', target)),
        h('div', { class: 'sim-row' }, label('Departures', enterX), label('Returns', enterY)),
        h('div', { class: 'sim-row' }, label('Groups (k)', count),
          btn('New data', newData), btn('Bicycle example', restore)),
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', restart)),
        h('div', { class: 'sim-row' }, label('Speed', speed)),
        status, curve),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note,
          h('div', { class: 'sim-row' }, label('Predict F’s first group', guess))),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const checks = challenges(challengePanel, [
    {
      text: 'Predict F’s first group in the bicycle example with centres at A and B, then press Step.',
      check: state => state.firstPrediction,
      why: 'F joins orange because 8.06 is smaller than 9.43.',
    },
    {
      text: 'In the bicycle example with two groups, reach a total squared distance of 20 within three iterations.',
      check: state => state.original && state.k === 2 && state.history.slice(0, 3).some(loss => Math.abs(loss - 20) < 1e-9),
      why: 'The two groups ABC and DEF bring the total squared distance down to 20.',
    },
    {
      text: 'Start the blue centre at D and the orange centre at F, then run until the centres stop moving.',
      check: state => state.original && state.settled && same(state.seeds, [START[3], START[5]]) && state.loss > 20,
      why: 'With centres starting at D and F, the groups settle at 41.6 instead of 20.',
    },
  ]);

  function nearest(distances) {
    return distances.indexOf(Math.min(...distances));
  }

  function step() {
    if (last?.settled) return false;
    const previous = centres;
    const assignment = data.map(p => nearest(previous.map(c => squared(p, c))));
    const members = previous.map((_, i) => data.filter((_, j) => assignment[j] === i));
    // An empty group keeps its centre so it can receive stations in a later round.
    centres = previous.map((c, i) => {
      const points = members[i];
      if (!points.length) return c;
      const sums = points.reduce(([x, y], [a, b]) => [x + a, y + b], [0, 0]);
      return sums.map(sum => sum / points.length);
    });
    const loss = cs => data.reduce((sum, p, i) => sum + squared(p, cs[assignment[i]]), 0);
    last = { previous, assignment, members, before: loss(previous), after: loss(centres), settled: same(previous, centres) };
    if (!history.length) {
      firstPrediction = same(data, START) && same(seeds, START.slice(0, 2))
        && guess.value !== '' && Number(guess.value) === assignment[5];
    }
    history.push(last.after);
    if (last.settled) stop();
    draw();
    return !last.settled;
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    playing = false;
    playButton.textContent = 'Play';
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!root.isConnected) {
        stop();
      } else if (playing && step()) {
        schedule();
      }
    }, 1800 / Number(speed.value));
  }

  function toggle() {
    if (playing) {
      stop();
    } else if (!last?.settled) {
      playing = true;
      playButton.textContent = 'Pause';
      if (step()) schedule();
    }
  }

  function restart() {
    stop();
    centres = seeds.slice();
    history = [];
    last = null;
    firstPrediction = false;
    draw();
  }

  function refreshTargets(pick = station) {
    target.replaceChildren(...options([
      ...letters.map(letter => `Station ${letter}`),
      ...names.slice(0, seeds.length).map(name => `${name} starting centre`),
    ]));
    target.value = String(pick);
  }

  function newData() {
    const pool = [];
    for (let x = 1; x < XMAX; x++) {
      for (let y = 1; y < YMAX; y++) pool.push([x, y]);
    }
    data = letters.map(() => pool.splice(rnd(0, pool.length - 1), 1)[0]);
    seeds = data.slice(0, Number(count.value));
    guess.value = '';
    refreshTargets();
    restart();
  }

  function restore() {
    data = START.slice();
    seeds = data.slice(0, 2);
    count.value = '2';
    station = 5;
    guess.value = '';
    refreshTargets();
    restart();
  }

  function editPoint(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const i = Number(target.value);
    const point = [clamp(Math.round(x), XMAX), clamp(Math.round(y), YMAX)];
    const editingStation = i < data.length;
    const points = editingStation ? data : seeds;
    const index = editingStation ? i : i - data.length;
    if (!squared(points[index], point)) return;
    if (editingStation && data.some((p, j) => j !== index && squared(p, point) === 0)) {
      note.textContent = 'Another station is already at that point.';
      return;
    }
    points[index] = point;
    restart();
  }

  target.addEventListener('change', () => {
    const i = Number(target.value);
    if (i < data.length) station = i;
    draw();
  });
  for (const input of [enterX, enterY]) {
    input.addEventListener('change', () => {
      editPoint(enterX.valueAsNumber, enterY.valueAsNumber);
      syncCoordinates();
    });
  }
  speed.addEventListener('input', () => { if (playing) schedule(); });
  count.addEventListener('change', () => {
    seeds = data.slice(0, Number(count.value));
    refreshTargets();
    restart();
  });

  const LEFT = 43, TOP = 26, BOTTOM = 243, UNIT = (BOTTOM - TOP) / YMAX;
  const sx = x => LEFT + x * UNIT, sy = y => BOTTOM - y * UNIT;
  function pointerPoint(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse());
  }

  svg.addEventListener('pointerdown', event => {
    if (dragging !== null || event.button !== 0) return;
    const point = pointerPoint(event);
    if (!point || point.x < LEFT - 12 || point.x > sx(XMAX) + 12 ||
        point.y < TOP - 12 || point.y > BOTTOM + 12) return;
    dragging = event.pointerId;
    svg.setPointerCapture(dragging);
    editPoint((point.x - LEFT) / UNIT, (BOTTOM - point.y) / UNIT);
  });
  svg.addEventListener('pointermove', event => {
    if (event.pointerId !== dragging) return;
    const point = pointerPoint(event);
    if (point) editPoint((point.x - LEFT) / UNIT, (BOTTOM - point.y) / UNIT);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(event, e => { if (e.pointerId === dragging) dragging = null; });
  }

  const mark = (x, y, content, color = C.ink, size = 15, anchor = 'middle', weight = 400) =>
    s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace', 'font-weight': weight }, content);
  const line = (x1, y1, x2, y2, stroke, width = 1, dash) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-dasharray': dash });
  const circle = (cx, cy, r, color, opacity) =>
    s('circle', { cx, cy, r, fill: color, 'fill-opacity': opacity });

  function drawGrid() {
    const nodes = [];
    const right = sx(XMAX);
    for (let x = 0; x <= XMAX; x++) {
      nodes.push(line(sx(x), TOP, sx(x), BOTTOM, x ? C.line : C.muted),
        mark(sx(x), BOTTOM + 18, x, C.muted, 13));
    }
    for (let y = 0; y <= YMAX; y++) {
      nodes.push(line(LEFT, sy(y), right, sy(y), y ? C.line : C.muted));
      if (y) nodes.push(mark(LEFT - 9, sy(y) + 4, y, C.muted, 13, 'end'));
    }
    nodes.push(mark(LEFT, 16, '↑ Returns', C.ink, 14, 'start'),
      mark((LEFT + right) / 2, 281, 'Departures →', C.ink, 15));

    if (!last) {
      const [x, y] = data[station];
      centres.forEach(([cx, cy], i) => {
        if (squared(data[station], centres[i])) {
          nodes.push(line(sx(x), sy(y), sx(cx), sy(cy), colors[i], 2, i % 2 ? '5 4' : undefined));
        }
      });
    }
    data.forEach(([x, y], i) => {
      const color = last ? colors[last.assignment[i]] : C.ink;
      nodes.push(circle(sx(x), sy(y), i === station ? 12 : 9, color, 0.2),
        circle(sx(x), sy(y), 4.6, color, 1));
    });
    centres.forEach(([x, y], i) => {
      const cx = sx(x), cy = sy(y), r = 8;
      const points = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      nodes.push(s('polygon', { points, fill: 'none', stroke: colors[i], 'stroke-width': 5, 'stroke-opacity': 0.25 }),
        s('polygon', { points, fill: 'none', stroke: colors[i], 'stroke-width': 2 }));
    });
    data.forEach(([x, y], i) => {
      const label = mark(sx(x) + 9, sy(y) - 9, letters[i], C.ink, 16, 'start', 700);
      label.setAttribute('paint-order', 'stroke');
      label.setAttribute('stroke', C.bg);
      label.setAttribute('stroke-width', '3');
      nodes.push(label);
    });
    svg.replaceChildren(...nodes);
  }

  function drawCurve() {
    const left = 43, right = 342, top = 31, bottom = 108;
    const initial = history.length === 1 ? last.before : null;
    const peak = Math.max(1, initial ?? 0, ...history);
    const power = 10 ** Math.floor(Math.log10(peak));
    const maxLoss = history.length ? Math.ceil(peak / power) * power : 100;
    const maxIteration = Math.max(4, history.length);
    const x = i => left + (right - left) * i / maxIteration;
    const y = loss => bottom - (bottom - top) * loss / maxLoss;
    const nodes = [mark(left, 19, 'Total squared distance', C.ink, 14, 'start')];
    for (const value of [0, maxLoss / 2, maxLoss]) {
      nodes.push(line(left, y(value), right, y(value), value ? C.line : C.muted),
        mark(left - 6, y(value) + 4, number(value), C.muted, 12, 'end'));
    }
    const interval = Math.ceil(maxIteration / 5);
    for (let i = 0; i <= maxIteration; i += interval) {
      nodes.push(mark(x(i), bottom + 15, i, C.muted, 12));
    }
    const points = history.map((loss, i) => [x(i + 1), y(loss)]);
    nodes.push(mark((left + right) / 2, 140, 'Iteration', C.ink, 13));
    if (points.length > 1) {
      nodes.push(s('polyline', { points: points.map(p => p.join(',')).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }));
    }
    nodes.push(...points.map(([cx, cy]) => circle(cx, cy, 3.5, C.cyan, 1)));
    curve.replaceChildren(...nodes);
  }

  function syncCoordinates() {
    const i = Number(target.value);
    const [x, y] = i < data.length ? data[i] : seeds[i - data.length];
    enterX.value = x;
    enterY.value = y;
  }

  function draw() {
    syncCoordinates();
    drawGrid();
    drawCurve();
    const summary = `Iteration ${history.length}${last?.settled ? ' · Centres have stopped moving' : ''}`;
    if (status.textContent !== summary) status.textContent = summary;
    stepButton.disabled = playButton.disabled = Boolean(last?.settled);
    guess.disabled = history.length > 0;

    if (last) {
      fbox(box, [
        ['Total squared distance', C.cyan],
        `${number(last.before)} before → ${number(last.after)} after`,
        ...centres.map((p, i) => {
          const members = last.members[i].length;
          const [dx, dy] = p.map((value, axis) => value - last.previous[i][axis]);
          return [`${names[i]} · ${members} ${members === 1 ? 'station' : 'stations'}\n${pair(last.previous[i])} → ${pair(p)}\nMove (${number(dx)}, ${number(dy)})`, colors[i]];
        }),
      ]);
      note.textContent = 'Dots show the latest assignments. Diamonds show the centres after the move. A centre with no stations stays where it is.';
    } else {
      const distances = centres.map(c => Math.sqrt(squared(data[station], c)));
      const group = nearest(distances);
      fbox(box, [
        `Station ${letters[station]} ${pair(data[station])}`,
        ...distances.map((value, i) => [`${names[i]} ${pair(centres[i])}: ${distance(value)}`, colors[i]]),
        [`${names[group]} is closest`, colors[group]],
      ]);
      note.textContent = distances.filter(d => d === distances[group]).length > 1
        ? 'When distances tie, the first of the tied groups in the list gets the station.'
        : 'Compare the straight-line distances from the selected station to the starting centres.';
    }
    checks.update({
      original: same(data, START), k: seeds.length, seeds, history, firstPrediction,
      settled: Boolean(last?.settled), loss: last?.after,
    });
  }

  refreshTargets();
  draw();
  return stop;
}

// 14.1.4 Try it: compare starting centres while keeping two groups.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const original = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const colors = [C.cyan, C.amber];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const name = i => letters[i];
  const coordinates = ([x, y]) => `(${fmt(x)}, ${fmt(y)})`;
  const squared = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  let stations = original.map(p => [...p]), seeds = [0, 1];
  let centres, groups, history, detail, settled;
  let classroom = true, finishes = new Map(), timer = null, drag = null;

  const grid = s('svg', { viewBox: '0 0 380 282', role: 'img', 'aria-label': 'Station positions and group centres' });
  const curve = s('svg', { viewBox: '0 0 380 172', role: 'img' });
  const box = h('div'), saved = h('div', { class: 'sim-note' }), challengeHost = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const speed = h('input', { type: 'range', min: 0.5, max: 3, step: 0.5, value: 1, 'aria-label': 'Playback speed' });
  const speedLabel = h('span', {}, '1×');
  const stepButton = btn('Step', () => { pause(); step(); }, 'go');
  const playButton = btn('Play', toggle);
  const first = seedSelect(0), second = seedSelect(1);
  const stationSelect = h('select', { 'aria-label': 'Station to move' },
    letters.map((label, i) => h('option', { value: i }, label)));
  const edit = (axis, delta) => {
    const i = +stationSelect.value, p = [...stations[i]];
    p[axis] += delta;
    moveStation(i, p);
  };

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: choose the starting centres'),
    h('p', { class: 'sub' }, 'Pick two starting stations. Predict which groups will form, then press Step or Play. Drag a station or use the move buttons to change the data.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, grid,
        h('div', { class: 'sim-row' }, h('label', {}, 'Blue start ', first), h('label', {}, 'Orange start ', second)),
        h('div', { class: 'sim-row' },
          btn('Start at A and B', () => choose([0, 1])), btn('Start at D and F', () => choose([3, 5]))),
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset),
          h('label', {}, 'Speed ', speed, ' ', speedLabel)),
        h('div', { class: 'sim-row' }, h('label', {}, 'Move station ', stationSelect),
          btn('←', () => edit(0, -1)), btn('→', () => edit(0, 1)),
          btn('↓', () => edit(1, -1)), btn('↑', () => edit(1, 1))),
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Lesson data', restoreData)), status),
      h('div', {},
        h('div', { class: 'sim-card' }, box, curve, saved),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    { text: 'With the lesson data, start at A and B. Can you reach an inertia of 20 in three rounds?',
      check: st => st.classroom && st.key === '0,1' && st.round === 3 && Math.abs(st.error - 20) < 1e-8,
      why: 'Yes. B and C move to blue in different rounds, and each group then has three stations.' },
    { text: 'Keep the lesson data. Predict whether D and F will beat 20, then run until the centres stop.',
      check: st => st.classroom && st.key === '3,5' && st.settled && st.error > 20,
      why: 'D and F start with less error, but F ends up alone and the final inertia is 41.6.' },
    { text: 'Press New data, then finish two runs from two different pairs of starting stations.',
      check: st => st.random && st.distinctStarts >= 2,
      why: 'You can compare the final errors because the stations stayed in the same places for both runs.' },
  ]);

  let random = false;
  function seedSelect(group) {
    return h('select', {
      'aria-label': group === 0 ? 'Blue starting station' : 'Orange starting station',
      onchange: event => {
        const next = seeds.slice(), index = +event.target.value, other = 1 - group;
        if (index === next[other]) next[other] = next[group];
        next[group] = index;
        choose(next);
      },
    }, letters.map((label, i) => h('option', { value: i }, label)));
  }

  function nearest(at) {
    return stations.map(p => squared(p, at[0]) <= squared(p, at[1]) ? 0 : 1);
  }

  function inertia(at, membership) {
    return stations.reduce((total, p, i) => total + squared(p, at[membership[i]]), 0);
  }

  function choose(next) {
    seeds = next;
    reset();
  }

  function reset() {
    pause();
    centres = seeds.map(i => [...stations[i]]);
    groups = nearest(centres);
    history = [inertia(centres, groups)];
    detail = null;
    settled = false;
    draw();
  }

  function step() {
    if (settled) return;
    const old = centres;
    const nextGroups = nearest(old);
    const members = [0, 1].map(g => stations.filter((_, i) => nextGroups[i] === g));
    const next = old.map((centre, g) => {
      const points = members[g];
      return points.length
        ? [0, 1].map(axis => points.reduce((sum, p) => sum + p[axis], 0) / points.length)
        : centre;
    });
    const before = inertia(old, nextGroups), after = inertia(next, nextGroups);
    settled = nextGroups.every((g, i) => g === groups[i]) && next.every((p, i) => squared(p, old[i]) === 0);
    detail = { old, before, after };
    centres = next;
    groups = nextGroups;
    history.push(after);
    if (settled) {
      pause();
      finishes.set(seeds.join(), after);
    }
    draw();
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function toggle() {
    if (timer !== null) {
      pause();
    } else if (!settled) {
      playButton.textContent = 'Pause';
      timer = setInterval(step, 1100 / Number(speed.value));
    }
  }

  speed.addEventListener('input', () => {
    speedLabel.textContent = `${speed.value}×`;
    if (timer !== null) {
      pause();
      toggle();
    }
  });

  function replaceData(points, fromLesson, fromRandom) {
    stations = points;
    classroom = fromLesson;
    random = fromRandom;
    finishes.clear();
    seeds = [0, 1];
    reset();
  }

  function newData() {
    const pool = Array.from({ length: 54 }, (_, i) => [1 + i % 9, 1 + Math.floor(i / 9)]);
    replaceData(Array.from({ length: 6 }, () => pool.splice(rnd(0, pool.length - 1), 1)[0]), false, true);
  }

  function restoreData() {
    replaceData(original.map(p => [...p]), true, false);
  }

  function moveStation(i, [x, y]) {
    const p = [Math.max(0, Math.min(10, x)), Math.max(0, Math.min(7, y))];
    if (stations.some(q => squared(p, q) === 0)) return;
    stations[i] = p;
    classroom = stations.every((q, index) => squared(q, original[index]) === 0);
    finishes.clear();
    reset();
  }

  const X = 44, Y = 241, U = 30;
  const plot = ([x, y]) => [X + U * x, Y - U * y];

  function local(event) {
    const p = grid.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    return p.matrixTransform(grid.getScreenCTM().inverse());
  }

  grid.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0) return;
    const p = local(event);
    const i = stations.findIndex(q => {
      const [x, y] = plot(q);
      return Math.hypot(p.x - x, p.y - y) <= 14;
    });
    if (i < 0) return;
    pause();
    drag = { i, pointer: event.pointerId };
    stationSelect.value = i;
    grid.setPointerCapture(event.pointerId);
    drawGrid();
  });

  grid.addEventListener('pointermove', event => {
    if (event.pointerId !== drag?.pointer) return;
    const p = local(event);
    moveStation(drag.i, [Math.round((p.x - X) / U), Math.round((Y - p.y) / U)]);
  });

  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    grid.addEventListener(event, e => { if (e.pointerId === drag?.pointer) drag = null; });
  }
  stationSelect.addEventListener('change', drawGrid);

  const svgLine = (x1, y1, x2, y2, stroke, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
  const svgText = (x, y, value, fill = C.ink, size = 15, anchor = 'middle') =>
    s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, value);

  function drawGrid() {
    const nodes = [];
    for (let x = 0; x <= 10; x++) {
      const px = X + x * U;
      nodes.push(svgLine(px, Y, px, Y - 7 * U, x ? C.line : C.muted));
      if (x % 2 === 0) nodes.push(svgText(px, Y + 17, x, C.muted, 13));
    }
    for (let y = 0; y <= 7; y++) {
      const py = Y - y * U;
      nodes.push(svgLine(X, py, X + 10 * U, py, y ? C.line : C.muted));
      if (y) nodes.push(svgText(X - 10, py + 4, y, C.muted, 13, 'end'));
    }
    nodes.push(svgText(X, 18, 'Returns ↑', C.ink, 15, 'start'),
      svgText(X + 10 * U, 276, 'Departures →', C.ink, 15, 'end'));
    stations.forEach((p, i) => {
      const [x, y] = plot(p), [cx, cy] = plot(centres[groups[i]]);
      nodes.push(s('line', { x1: x, y1: y, x2: cx, y2: cy, stroke: colors[groups[i]], 'stroke-opacity': 0.47,
        'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    });
    stations.forEach((p, i) => {
      const [x, y] = plot(p), color = colors[groups[i]], selected = i === +stationSelect.value;
      nodes.push(s('circle', { cx: x, cy: y, r: 9, fill: color, 'fill-opacity': 0.2 }),
        s('circle', { cx: x, cy: y, r: 4.4, fill: color }),
        svgText(x - 9, y - 10, name(i), C.ink, 15, 'end'));
      if (selected) nodes.push(s('circle', { cx: x, cy: y, r: 13, fill: 'none', stroke: C.ink, 'stroke-dasharray': '2 3' }));
    });
    centres.forEach((p, i) => {
      const [x, y] = plot(p);
      nodes.push(s('polygon', { points: `${x},${y - 10} ${x + 10},${y} ${x},${y + 10} ${x - 10},${y}`,
        fill: 'none', stroke: colors[i], 'stroke-width': 2.4 }));
    });
    grid.replaceChildren(...nodes);
  }

  function drawCurve() {
    const left = 45, right = 355, top = 26, base = 124;
    const tick = Math.max(1, Math.ceil(Math.max(...history) / 4));
    const rounds = Math.max(4, history.length - 1);
    const x = i => left + (right - left) * i / rounds;
    const y = v => base - (base - top) * v / (4 * tick);
    const nodes = [svgText(left, 17, 'Inertia', C.ink, 15, 'start'),
      svgText(right, 166, 'Round', C.muted, 14, 'end'), svgLine(left, top, left, base, C.muted)];
    for (let i = 0; i <= 4; i++) {
      const v = i * tick;
      nodes.push(svgLine(left, y(v), right, y(v), i ? C.line : C.muted),
        svgText(left - 8, y(v) + 4, v, C.muted, 13, 'end'));
    }
    const stride = Math.ceil(rounds / 5);
    for (let i = 0; i <= rounds; i += stride) nodes.push(svgText(x(i), base + 19, i, C.muted, 13));
    nodes.push(s('polyline', { points: history.map((v, i) => `${x(i)},${y(v)}`).join(' '),
      fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }));
    history.forEach((v, i) => nodes.push(s('circle', { cx: x(i), cy: y(v), r: 4, fill: C.cyan })));
    curve.setAttribute('aria-label', `Inertia by round: ${history.map((v, i) => `${i}: ${fmt(v)}`).join(', ')}`);
    curve.replaceChildren(...nodes);
  }

  function draw() {
    first.value = seeds[0];
    second.value = seeds[1];
    stepButton.disabled = settled;
    playButton.disabled = settled;
    const round = history.length - 1, error = history[round];
    const members = [0, 1].map(g => letters.filter((_, i) => groups[i] === g).join(' ') || 'none');
    drawGrid();
    drawCurve();
    status.textContent = `Round ${round} · ${settled ? 'Centres and groups have stopped changing' : `Inertia ${fmt(error)}`}`;
    const rows = [
      `Round ${round} · 2 groups`,
      [`Blue: ${members[0]}`, colors[0]],
      [`Orange: ${members[1]}`, colors[1]],
    ];
    centres.forEach((p, i) => {
      const prefix = i === 0 ? 'Blue centre' : 'Orange centre';
      rows.push([`${prefix} ${detail ? `${coordinates(detail.old[i])} → ` : ''}${coordinates(p)}`, colors[i]]);
    });
    rows.push(detail ? `After assignment: ${fmt(detail.before)}` : 'Inertia = sum of squared distances');
    rows.push([detail ? `After moving: ${fmt(detail.after)}` : `Starting inertia: ${fmt(error)}`, C.green]);
    fbox(box, rows);
    const results = [...finishes].sort((a, b) => a[1] - b[1]);
    if (results.length) {
      const list = results.map(([key, value]) => h('li', {}, `${key.split(',').map(i => name(+i)).join(' + ')}: ${fmt(value)}`));
      saved.replaceChildren(h('strong', {}, 'Finished runs on these stations'), h('ul', {}, list));
    } else {
      saved.replaceChildren();
    }
    chal.update({
      classroom, random, round, error, settled,
      key: seeds.join(),
      distinctStarts: new Set([...finishes.keys()].map(key => key.split(',').sort().join())).size,
    });
  }

  reset();
  return pause;
}

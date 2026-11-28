// 14.1.3 Try it: step through k-means and compare starting centres.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const LESSON = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const LETTERS = 'ABCDEF';
  const COLORS = ['#60a5fa', '#f99b56', C.violet, C.green];
  const COLOR_NAMES = ['Blue', 'Orange', 'Purple', 'Green'];

  let stations = LESSON.map(p => p.slice());
  let seeds = [0, 1], centres, groups, history, detail;
  let selected = 0, settled = false, lessonData = true;
  let timer = null, playing = false, drag = null;
  let predictionCount = '', predictionRun = null;

  const svg = s('svg', {
    viewBox: '0 0 420 444',
    role: 'img',
    'aria-label': 'Bicycle station grid and inertia by iteration',
  });
  const box = h('div');
  const note = h('p', { class: 'sim-note' });
  const status = h('div', { role: 'status', 'aria-live': 'polite' });
  const challengeHost = h('div');
  const seedControls = h('div', { class: 'sim-row' });

  const range = (min, max, value) => h('input', {
    type: 'range', min, max, value, style: { width: '9rem' },
  });
  const xInput = range(0, 10, 1);
  const yInput = range(0, 8, 1);
  const speed = range(1, 5, 3);
  const xValue = h('output');
  const yValue = h('output');
  const select = h('select', {},
    ...Array.from(LETTERS, (name, i) => h('option', { value: i }, name)));
  const kSelect = h('select', {},
    ...[1, 2, 3, 4].map(k => h('option', { value: k }, String(k))));
  const predictSelect = h('select', {}, h('option', { value: '' }, 'Choose'),
    ...[1, 2, 3, 4].map(k => h('option', { value: k }, String(k))));
  const stepButton = btn('Step', () => { stop(); step(); }, 'go');
  const playButton = btn('Play', () => {
    if (playing) {
      stop();
      return;
    }
    if (settled) return;
    playing = true;
    playButton.textContent = 'Pause';
    step();
    schedule();
  });
  const resetButton = btn('Reset', reset);
  const newDataButton = btn('New data', () => {
    const used = new Set();
    stations = LESSON.map(() => {
      let x, y, key;
      do {
        x = rnd(1, 9);
        y = rnd(1, 7);
        key = `${x},${y}`;
      } while (used.has(key));
      used.add(key);
      return [x, y];
    });
    lessonData = false;
    reset();
  });
  const lessonButton = btn('Lesson data', () => {
    stations = LESSON.map(p => p.slice());
    seeds = [0, 1];
    lessonData = true;
    reset();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it with the bicycle stations'),
    h('p', { class: 'sub' }, 'Drag a station or use its sliders. Choose starting centres, then press Step to watch one round.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, status,
        h('div', { class: 'sim-row' }, stepButton, playButton, resetButton,
          h('label', {}, 'Speed ', speed)),
        h('div', { class: 'sim-row' }, newDataButton, lessonButton),
        h('div', { class: 'sim-row' }, h('label', {}, 'Groups (k) ', kSelect)),
        seedControls,
        h('div', { class: 'sim-row' },
          h('label', {}, 'Station ', select),
          h('label', {}, 'Departures ', xInput, ' ', xValue),
          h('label', {}, 'Returns ', yInput, ' ', yValue))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note,
          h('div', { class: 'sim-row' }, h('label', {}, 'Predicted rounds to settle ', predictSelect))),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'With lesson data, predict how many rounds it takes to settle, then press Play.',
      check: st => st.standard && st.settled && st.predictionRun === st.iteration,
      why: 'The fourth round confirms that both the groups and their centres stay the same.',
    },
    {
      text: 'Reset the lesson run and use Step to reach inertia 20 in exactly three rounds.',
      check: st => st.standard && st.iteration === 3 && st.loss === 20 && !st.played,
      why: 'The centres reach (2, 2) and (8, 3) in round three, when inertia first reaches 20.',
    },
    {
      text: 'Keep the lesson stations and find two different starts that settle above inertia 20.',
      check: st => st.lessonData && st.k === 2 && !st.standard && st.settled && st.loss > 20,
      why: 'The centres can stop moving even when another starting choice gives smaller inertia.',
    },
  ]);

  const squared = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const nearest = (p, points) => {
    let j = 0;
    for (let i = 1; i < points.length; i++) {
      if (squared(p, points[i]) < squared(p, points[j])) j = i;
    }
    return j;
  };
  const loss = (assignment, points) =>
    stations.reduce((total, p, i) => total + squared(p, points[assignment[i]]), 0);
  const xy = p => `(${fmt(p[0])}, ${fmt(p[1])})`;
  const delta = n => n > 0 ? `+${fmt(n)}` : fmt(n);
  const standard = () => lessonData && seeds.join() === '0,1';

  let played = false;
  function stop() {
    clearTimeout(timer);
    timer = null;
    playing = false;
    playButton.textContent = 'Play';
  }

  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (playing) {
      timer = setTimeout(() => {
        step();
        schedule();
      }, [2400, 1700, 1200, 750, 400][Number(speed.value) - 1]);
    }
  }

  function reset() {
    stop();
    centres = seeds.map(i => stations[i].slice());
    groups = stations.map(p => nearest(p, centres));
    history = [loss(groups, centres)];
    detail = null;
    settled = false;
    played = false;
    predictionRun = null;
    renderSeeds();
    draw();
  }

  function step() {
    if (settled) return;
    if (playing) {
      if (history.length === 1 && predictionCount) predictionRun = Number(predictionCount);
      played = true;
    }

    const old = centres;
    const assigned = stations.map(p => nearest(p, old));
    const moves = assigned.flatMap((j, i) => j === groups[i] ? [] : [
      `${LETTERS[i]}: ${COLOR_NAMES[groups[i]]} → ${COLOR_NAMES[j]}`,
    ]);
    const counts = old.map(() => 0);
    const sums = old.map(() => [0, 0]);
    stations.forEach(([x, y], i) => {
      const j = assigned[i];
      counts[j]++;
      sums[j][0] += x;
      sums[j][1] += y;
    });
    const afterAssign = loss(assigned, old);
    centres = old.map((p, j) => {
      if (!counts[j]) return p;
      return [sums[j][0] / counts[j], sums[j][1] / counts[j]];
    });
    const before = history.at(-1);
    const after = loss(assigned, centres);
    settled = moves.length === 0 && old.every((p, j) => squared(p, centres[j]) === 0);
    groups = assigned;
    detail = { old, before, afterAssign, after, moves, sums, counts };
    history.push(after);
    if (settled) stop();
    draw();
  }

  function renderSeeds() {
    kSelect.value = String(seeds.length);
    seedControls.replaceChildren(...seeds.map((i, j) => {
      const choices = Array.from(LETTERS, (name, n) => h('option', {
        value: n,
        disabled: n !== i && seeds.includes(n),
      }, name));
      const control = h('select', {
        onchange: event => {
          const value = Number(event.target.value);
          seeds[j] = value;
          reset();
          seedControls.querySelectorAll('select')[j].focus();
        },
      }, choices);
      control.value = String(i);
      return h('label', { style: { color: COLORS[j] } }, `${COLOR_NAMES[j]} starts at `, control);
    }));
  }

  kSelect.addEventListener('change', () => {
    const k = Number(kSelect.value);
    seeds = seeds.slice(0, k);
    while (seeds.length < k) {
      seeds.push(stations.findIndex((_, i) => !seeds.includes(i)));
    }
    reset();
  });

  predictSelect.addEventListener('change', () => { predictionCount = predictSelect.value; });
  speed.addEventListener('input', schedule);
  select.addEventListener('change', () => { selected = Number(select.value); draw(); });

  function setStation(x, y) {
    const old = stations[selected];
    if (x === old[0] && y === old[1]) return;
    stations[selected] = [x, y];
    lessonData = stations.every((p, i) => squared(p, LESSON[i]) === 0);
    reset();
  }

  xInput.addEventListener('input', () => setStation(Number(xInput.value), stations[selected][1]));
  yInput.addEventListener('input', () => setStation(stations[selected][0], Number(yInput.value)));

  const X0 = 49, Y0 = 280, UNIT = 31;
  const X = a => X0 + UNIT * a;
  const Y = a => Y0 - UNIT * a;
  const svgLine = (x1, y1, x2, y2, stroke = C.line, extra = {}) =>
    s('line', { x1, y1, x2, y2, stroke, ...extra });
  const text = (x, y, value, color = C.muted, extra = {}) => s('text', {
    x, y, fill: color, 'font-size': 15, 'font-family': 'Consolas, monospace',
    'text-anchor': 'middle', ...extra,
  }, value);

  function pointerPoint(event) {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener('pointerdown', event => {
    if (drag !== null || event.button !== 0) return;
    const p = pointerPoint(event);
    const distances = stations.map(([x, y]) => Math.hypot(X(x) - p.x, Y(y) - p.y));
    const closest = Math.min(...distances);
    if (closest > 20) return;
    const hits = distances.flatMap((distance, i) => distance === closest ? [i] : []);
    selected = hits[(hits.indexOf(selected) + 1) % hits.length];
    drag = event.pointerId;
    svg.setPointerCapture(drag);
    draw();
  });

  svg.addEventListener('pointermove', event => {
    if (event.pointerId !== drag) return;
    const p = pointerPoint(event);
    const x = Math.max(0, Math.min(10, Math.round((p.x - X0) / UNIT)));
    const y = Math.max(0, Math.min(8, Math.round((Y0 - p.y) / UNIT)));
    setStation(x, y);
  });

  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(name, event => { if (event.pointerId === drag) drag = null; });
  }

  function draw() {
    const shapes = [];
    for (let i = 0; i <= 10; i++) {
      shapes.push(svgLine(X(i), Y(0), X(i), Y(8), i ? C.line : C.muted));
      if (i % 2 === 0) shapes.push(text(X(i), Y(0) + 19, i));
    }
    for (let i = 0; i <= 8; i++) {
      shapes.push(svgLine(X(0), Y(i), X(10), Y(i), i ? C.line : C.muted));
      if (i > 0 && i % 2 === 0) shapes.push(text(X0 - 15, Y(i) + 5, i));
    }
    shapes.push(text((X(0) + X(10)) / 2, 321, 'Departures per hour', C.ink));
    shapes.push(text(13, 153, 'Returns per hour', C.ink, { transform: 'rotate(-90 13 153)' }));

    stations.forEach(([x, y], i) => {
      const [cx, cy] = centres[groups[i]];
      shapes.push(svgLine(X(x), Y(y), X(cx), Y(cy), COLORS[groups[i]],
        { 'stroke-opacity': 0.53, 'stroke-width': 2 }));
    });
    centres.forEach(([x, y], j) => {
      const px = X(x), py = Y(y), r = 11 + 3 * j;
      shapes.push(s('path', {
        d: `M${px} ${py - r} L${px + r} ${py} L${px} ${py + r} L${px - r} ${py} Z`,
        fill: 'none', stroke: COLORS[j], 'stroke-width': 2.5,
      }));
    });

    const labels = new Map();
    stations.forEach(([x, y], i) => {
      const key = `${x},${y}`;
      const entries = labels.get(key) || [];
      entries.push(i);
      labels.set(key, entries);
    });
    for (const indices of labels.values()) {
      const [x, y] = stations[indices[0]];
      const px = X(x), py = Y(y);
      const active = indices.includes(selected);
      const color = COLORS[groups[active ? selected : indices[0]]];
      shapes.push(s('circle', { cx: px, cy: py, r: 11, fill: color, 'fill-opacity': 0.21 }));
      if (active) shapes.push(s('circle', { cx: px, cy: py, r: 16, fill: 'none', stroke: C.ink }));
      shapes.push(s('circle', { cx: px, cy: py, r: 5, fill: color }),
        text(px + 9, py - 8, indices.map(i => LETTERS[i]).join(''), C.ink, { 'text-anchor': 'start' }));
    }

    const iteration = history.length - 1;
    const value = history.at(-1);
    const chartX = i => 49 + 310 * i / Math.max(4, iteration);
    const chartY = n => 408 - 54 * n / Math.max(1, history[0]);
    shapes.push(text(49, 345, 'Inertia', C.ink, { 'text-anchor': 'start' }),
      svgLine(49, 350, 49, 408, C.muted), svgLine(49, 408, 359, 408, C.muted),
      text(49, 428, 0), text(210, 435, 'Iteration'));
    history.forEach((n, i) => {
      const px = chartX(i), py = chartY(n);
      if (i > 0) {
        shapes.push(svgLine(chartX(i - 1), chartY(history[i - 1]), px, py,
          C.amber, { 'stroke-width': 2.5 }));
      }
      shapes.push(s('circle', { cx: px, cy: py, r: 3.7, fill: C.amber }));
    });
    if (iteration) shapes.push(text(chartX(iteration), 428, iteration));
    shapes.push(text(chartX(iteration) + 8, chartY(value) - 8,
      fmt(value), C.amber, { 'text-anchor': 'start' }));
    svg.replaceChildren(...shapes);

    status.replaceChildren(pill(`ITERATION ${iteration}${settled ? ' · SETTLED' : ''}`, settled ? C.green : C.cyan));
    select.value = String(selected);
    const [x, y] = stations[selected];
    xInput.value = xValue.textContent = x;
    yInput.value = yValue.textContent = y;
    stepButton.disabled = settled;
    playButton.disabled = settled;

    if (detail) {
      const rows = [
        [`Inertia: ${fmt(detail.before)} → ${fmt(detail.afterAssign)} → ${fmt(detail.after)}`, C.amber],
        detail.moves.length ? detail.moves.join(', ') : 'All stations kept their groups.',
      ];
      centres.forEach((p, j) => {
        const old = detail.old[j];
        rows.push([`${COLOR_NAMES[j]} ${xy(old)} → ${xy(p)}`, COLORS[j]]);
        if (detail.counts[j]) {
          const [sumX, sumY] = detail.sums[j];
          const count = detail.counts[j];
          rows.push(`  ${sumX} ÷ ${count}, ${sumY} ÷ ${count}`,
            `  Move: ${delta(p[0] - old[0])}, ${delta(p[1] - old[1])}`);
        } else {
          rows.push('  No stations. Centre stays.');
        }
      });
      fbox(box, rows);
      note.textContent = settled
        ? `The groups and centres stayed the same.${predictionRun === null ? '' :
          ` You predicted ${predictionRun} rounds. The run settled in ${iteration}.`}`
        : 'The middle inertia value comes after assigning stations. The last comes after moving the centres.';
    } else {
      fbox(box, [[`Starting inertia = ${fmt(value)}`, C.amber], ...centres.map((p, j) => [
        `${COLOR_NAMES[j]} starts at ${LETTERS[seeds[j]]} ${xy(p)}`, COLORS[j],
      ])]);
      note.textContent = 'Each station starts in the group with the nearest centre. Step assigns stations, then moves each centre to its group’s mean.';
    }

    chal.update({ iteration, loss: value, settled, standard: standard(), k: seeds.length,
      lessonData, predictionRun, played });
  }

  reset();
  return stop;
}

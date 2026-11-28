// 14.1.10 Try it: rerun k-means on smaller collections and count pairs.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const stations = ['A', 'B', 'C', 'D', 'E', 'F'];
  const lesson = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const colors = [C.cyan, C.amber];
  const pairs = stations.flatMap((_, i) => stations.slice(i + 1).map((_, j) => [i, i + j + 1]));
  const pairName = ([a, b]) => `${stations[a]}–${stations[b]}`;
  const d2 = ([x, y], [u, v]) => (x - u) ** 2 + (y - v) ** 2;
  const coord = point => `(${point.map(fmt).join(', ')})`;
  let data = lesson;
  let omitted = -1;
  let starts = [3, 5];
  let pair = pairs.findIndex(([a, b]) => a === 2 && b === 4);
  let run = newRun(omitted);
  let counts = emptyCounts();
  let trials = 0;
  let batchFinished = 0;
  let batchLeft = 0;
  let timer = null;
  let mode = null;
  let showTable = false;

  const svg = s('svg', { viewBox: '0 0 400 420', role: 'img', 'aria-label': 'Station plot and inertia by round' });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const status = h('div', { class: 'sim-note', role: 'status' });
  const challengeHost = h('div');
  const step = btn('Step', () => advance(), 'go');
  const playButton = btn('Play', togglePlay);
  const batch = btn('Run 30 random trials', startBatch);
  const view = btn('Pair table', () => { showTable = !showTable; draw(); });
  const speed = h('input', { type: 'range', min: 1, max: 5, value: 3, oninput: reschedule });
  const omit = h('select', { onchange: () => {
    stop();
    omitted = Number(omit.value);
    run = newRun(omitted);
    showTable = false;
    draw();
  } }, h('option', { value: -1 }, 'Keep all six'),
  ...stations.map((letter, i) => h('option', { value: i }, `Leave out ${letter}`)));
  const startInputs = colors.map((_, i) => h('select', {
    onchange: () => {
      const next = Number(startInputs[i].value);
      if (starts[1 - i] === next) starts[1 - i] = starts[i];
      starts[i] = next;
      reset();
    },
  }, ...stations.map((letter, j) => h('option', { value: j }, letter))));
  const pairInput = h('select', { onchange: () => {
    pair = Number(pairInput.value);
    showTable = true;
    draw();
  } }, ...pairs.map((p, i) => h('option', { value: i }, pairName(p))));
  const control = (label, input) => h('label', {
    style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem', minHeight: '44px' },
  }, label, input);
  for (const input of [omit, ...startInputs, pairInput]) {
    Object.assign(input.style, {
      background: C.bg, color: C.ink, border: '1px solid #536485',
      minHeight: '44px', borderRadius: '.5rem', padding: '0 .4rem', font: 'inherit',
    });
  }
  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: will the groups appear again?'),
    h('p', { class: 'sub' }, 'Leave out one station and run k-means again. The rings show the centres. Compare which stations end up together.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, status,
        h('div', { class: 'sim-row' }, control('Stations', omit), control('Blue start', startInputs[0]),
          control('Orange start', startInputs[1])),
        h('div', { class: 'sim-row' }, step, playButton, control('Speed', speed), btn('Reset', reset)),
        h('div', { class: 'sim-row' }, batch, view, control('Pair', pairInput)),
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Use lesson data', restoreLesson, 'ghost'))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost))));
  root.append(panel);

  const chal = challenges(challengeHost, [
    { text: 'With the lesson data, leave out A and step until the centres settle.',
      check: state => state.lessonRun && state.omitted === 0 && state.settled && state.loss === 28,
      why: 'B, C, D and E share a group, and their squared distances to the blue centre add up to 28.' },
    { text: 'Predict whether E will switch groups when D is missing, then run the lesson data to check.',
      check: state => state.lessonRun && state.omitted === 3 && state.settled && state.eSwitched,
      why: 'E moves to orange in round two because the orange centre is closer at the start of that round.' },
    { text: 'Run 30 random trials and check the together-rate for A and C with the lesson starts.',
      check: state => state.lessonRun && state.batchFinished === 30 && state.pair === 'A–C' &&
        state.showTable && state.present > 0 && state.together === state.present,
      why: 'A and C share a group every time both are present, so their together-rate is 100%.' },
  ]);

  function emptyCounts() {
    return pairs.map(() => ({ together: 0, present: 0 }));
  }

  function newRun(missing) {
    return {
      missing, centres: starts.map(i => data[i]), groups: null,
      history: [], detail: null, settled: false,
    };
  }

  function round(state) {
    const before = state.centres;
    const groups = data.map((p, i) => i === state.missing ? -1 : d2(p, before[0]) <= d2(p, before[1]) ? 0 : 1);
    const after = before.map((centre, k) => {
      const members = data.filter((_, i) => groups[i] === k);
      // Keep an empty group's centre where it was so the run can continue.
      return members.length ? centre.map((_, axis) =>
        members.reduce((sum, p) => sum + p[axis], 0) / members.length) : centre;
    });
    const inertia = centres => data.reduce((sum, p, i) =>
      groups[i] < 0 ? sum : sum + d2(p, centres[groups[i]]), 0);
    const loss = inertia(after);
    state.settled = state.groups !== null && groups.every((k, i) => k === state.groups[i]);
    state.detail = {
      before,
      assignedLoss: inertia(before),
      switched: state.groups ? stations.filter((_, i) => groups[i] !== state.groups[i]) : [],
      empty: after.map((_, k) => !groups.includes(k)),
    };
    state.centres = after;
    state.groups = groups;
    state.history.push({ loss, groups });
  }

  function record(state) {
    if (state.missing < 0) return;
    trials++;
    pairs.forEach(([a, b], i) => {
      const x = state.groups[a];
      const y = state.groups[b];
      if (x < 0 || y < 0) return;
      counts[i].present++;
      if (x === y) counts[i].together++;
    });
  }

  function advance() {
    if (run.settled) return;
    showTable = false;
    round(run);
    if (run.settled) {
      record(run);
      stop();
    }
    draw();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    mode = null;
    batchLeft = 0;
  }

  function schedule() {
    if (!mode) return;
    const delay = mode === 'rounds' ? 1700 - Number(speed.value) * 280 : 120;
    timer = setTimeout(tick, delay);
  }

  function tick() {
    timer = null;
    if (mode === 'rounds') {
      advance();
    } else if (mode === 'batch') {
      const trial = newRun(rnd(0, stations.length - 1));
      while (!trial.settled) round(trial);
      record(trial);
      batchFinished++;
      batchLeft--;
      if (!batchLeft) stop();
      draw();
    }
    schedule();
  }

  function reschedule() {
    if (mode !== 'rounds') return;
    clearTimeout(timer);
    schedule();
  }

  function togglePlay() {
    if (mode === 'rounds') {
      stop();
      draw();
    } else if (!mode && !run.settled) {
      mode = 'rounds';
      advance();
      schedule();
    }
  }

  function startBatch() {
    if (mode === 'batch') {
      stop();
      draw();
      return;
    }
    stop();
    batchLeft = 30;
    batchFinished = 0;
    showTable = true;
    mode = 'batch';
    tick();
  }

  function reset() {
    stop();
    run = newRun(omitted);
    counts = emptyCounts();
    trials = 0;
    batchFinished = 0;
    showTable = false;
    draw();
  }

  function newData() {
    const used = new Set();
    data = stations.map(() => {
      let point;
      do { point = [rnd(1, 9), rnd(1, 6)]; } while (used.has(point.join(',')));
      used.add(point.join(','));
      return point;
    });
    reset();
  }

  function restoreLesson() {
    data = lesson;
    omitted = -1;
    starts = [3, 5];
    reset();
  }

  const text = (x, y, value, fill = C.ink, size = 15, anchor = 'middle') =>
    s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas' }, String(value));
  const line = (x1, y1, x2, y2, stroke = C.line, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
  const dot = (x, y, r, fill) => s('circle', { cx: x, cy: y, r, fill });

  function drawPlot() {
    const xp = x => 43 + 32 * x;
    const yp = y => 246 - 31 * y;
    const marks = [text(43, 22, 'Returns ↑', C.ink, 16, 'start'), text(363, 282, 'Departures →', C.ink, 16, 'end')];
    for (let x = 0; x <= 10; x++) {
      marks.push(line(xp(x), yp(0), xp(x), yp(7), x === 0 ? C.muted : C.line));
      if (x % 2 === 0) marks.push(text(xp(x), 264, x, C.muted, 13));
    }
    for (let y = 0; y <= 7; y++) {
      marks.push(line(xp(0), yp(y), xp(10), yp(y), y === 0 ? C.muted : C.line));
      if (y > 0 && y % 2 === 0) marks.push(text(27, yp(y) + 4, y, C.muted, 13));
    }

    if (run.groups) data.forEach(([x, y], i) => {
      const k = run.groups[i];
      if (k < 0) return;
      const [u, v] = run.centres[k];
      if (x !== u || y !== v) marks.push(line(xp(x), yp(y), xp(u), yp(v), colors[k], 1)
        .cloneNode(false));
    });
    run.centres.forEach(([x, y], i) => marks.push(s('circle', {
      cx: xp(x), cy: yp(y), r: 10, fill: 'none', stroke: colors[i], 'stroke-width': 2.5,
    })));
    data.forEach(([x, y], i) => {
      if (i === omitted) return;
      const fill = colors[run.groups?.[i]] || C.ink;
      marks.push(dot(xp(x), yp(y), 4.6, fill), text(xp(x) + 13, yp(y) - 7, stations[i], fill, 15));
    });

    const maxLoss = Math.max(1, ...run.history.map(r => r.loss));
    const top = 324;
    const base = 390;
    const xRound = i => 49 + i * 301 / Math.max(3, run.history.length);
    const yLoss = loss => base - (base - top) * loss / maxLoss;
    marks.push(text(200, 308, 'Inertia by round', C.ink, 16),
      line(xRound(0), top, xRound(0), base, C.muted),
      line(xRound(0), base, 364, base, C.muted),
      text(39, base + 4, '0', C.muted, 12, 'end'));
    if (run.history.length) marks.push(text(39, top + 4, fmt(maxLoss), C.muted, 12, 'end'));
    run.history.forEach(({ loss }, i) => {
      const x = xRound(i + 1);
      const y = yLoss(loss);
      if (i) marks.push(line(xRound(i), yLoss(run.history[i - 1].loss), x, y, C.amber, 2));
      marks.push(dot(x, y, 4, C.amber), text(x, 408, i + 1, C.muted, 13));
    });
    svg.setAttribute('aria-label', 'Station plot and inertia by round');
    svg.setAttribute('viewBox', '0 0 400 420');
    svg.replaceChildren(...marks);
  }

  function drawTable() {
    const x = i => 72 + i * 53;
    const y = i => 65 + i * 43;
    const marks = [text(200, 22, 'Together-rates', C.ink, 18)];
    stations.forEach((letter, i) => {
      marks.push(text(x(i), 44, letter), text(26, y(i) + 5, letter));
      marks.push(text(x(i), y(i) + 5, '—', C.muted));
    });
    pairs.forEach(([a, b], i) => {
      const { together, present } = counts[i];
      const rate = present ? Math.round(100 * together / present) : null;
      const color = rate === null ? C.muted : rate >= 80 ? C.cyan : C.amber;
      marks.push(s('rect', {
        x: x(b) - 24, y: y(a) - 17, width: 48, height: 34, rx: 5,
        fill: C.bg, stroke: i === pair ? C.ink : C.line, 'stroke-width': i === pair ? 2 : 1,
      }), text(x(b), y(a) + 5, rate === null ? '—' : `${rate}%`, color));
    });
    svg.setAttribute('aria-label', `Together-rates after ${trials} finished trials. Use the Pair menu to read the counts.`);
    svg.setAttribute('viewBox', '0 0 400 312');
    svg.replaceChildren(...marks);
  }

  function draw() {
    const { together, present } = counts[pair];
    const last = run.history.at(-1);
    const selected = pairName(pairs[pair]);
    step.disabled = Boolean(mode) || run.settled;
    playButton.disabled = mode === 'batch' || run.settled;
    playButton.textContent = mode === 'rounds' ? 'Pause' : 'Play';
    batch.textContent = mode === 'batch' ? 'Stop random trials' : 'Run 30 random trials';
    view.textContent = showTable ? 'Station plot' : 'Pair table';
    omit.value = String(omitted);
    pairInput.value = String(pair);
    startInputs.forEach((input, i) => { input.value = String(starts[i]); });
    status.textContent = mode === 'batch'
      ? `Random trials ${batchFinished} of 30 · ${trials} saved in total`
      : `Round ${run.history.length}${run.settled ? ' · settled' : ''} · ${trials} smaller trials saved`;

    if (showTable) {
      drawTable();
      fbox(box, [
        [selected, C.cyan],
        `Same group: ${together}`,
        `Both present: ${present}`,
        present ? [`${together} ÷ ${present} × 100 = ${fmt(100 * together / present)}%`, C.green]
          : 'Run a trial where both are present.',
      ]);
      note.textContent = 'A trial counts for a pair only when it contains both stations.';
    } else {
      drawPlot();
      if (last) {
        const { before, assignedLoss, switched, empty } = run.detail;
        const members = k => stations.filter((_, i) => last.groups[i] === k).join(' ') || 'empty';
        fbox(box, [
          [`Blue: ${members(0)} · ${coord(before[0])} → ${coord(run.centres[0])}`, C.cyan],
          [`Orange: ${members(1)} · ${coord(before[1])} → ${coord(run.centres[1])}`, C.amber],
          `Inertia after joining a centre: ${fmt(assignedLoss)}`,
          [`Inertia after moving centres: ${fmt(last.loss)}`, C.green],
        ]);
        note.textContent = run.settled ? 'The groups and centres stayed the same.'
          : empty.some(Boolean) ? 'A centre with no stations stays where it was.'
          : switched.length ? `${switched.join(', ')} changed groups this round.`
          : 'Each station joins its nearest centre. Each centre moves to the mean of its group.';
      } else {
        fbox(box, [
          [`Blue starts at ${stations[starts[0]]} ${coord(run.centres[0])}`, C.cyan],
          [`Orange starts at ${stations[starts[1]]} ${coord(run.centres[1])}`, C.amber],
          'Press Step for round one.',
        ]);
        note.textContent = 'Starting positions stay available when their stations are left out. Only trials with one station missing count in the table.';
      }
    }
    chal.update({
      lessonRun: data === lesson && starts[0] === 3 && starts[1] === 5,
      omitted, settled: run.settled, loss: last?.loss,
      eSwitched: run.history[0]?.groups[4] === 0 && run.history[1]?.groups[4] === 1,
      batchFinished, pair: selected, showTable, together, present,
    });
  }

  draw();
  return () => stop();
}

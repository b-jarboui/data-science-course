// 21.1.5 Try it: approximate nearest neighbors.
// The learner drags the question on the meaning map, turns the dial (groups opened), and runs the
// 100 test questions one by one (Step, or Play with a speed) to measure recall. "New data" makes a
// fresh archive and fresh test questions; the challenges check themselves.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;

  // the archive: 120 dots (1 dot = 10 passages) on a meaning map 4 wide and 3 high, 12 groups
  const BASE = [[0.25, 0.3], [0.5, 0.2], [0.75, 0.3], [0.3, 0.55], [0.55, 0.5], [0.8, 0.58], [0.22, 0.8], [0.47, 0.76], [0.7, 0.8], [0.5, 0.36]];
  const HAND = {
    4: [[0.6, 0.5], [0.8, 0.45], [0.95, 0.6], [0.7, 0.7], [0.88, 0.78], [0.95, 0.92], [0.65, 0.88], [0.55, 0.75], [0.82, 0.3], [0.85, 0.62]],
    5: [[0.15, 0.2], [0.35, 0.15], [0.6, 0.2], [0.85, 0.15], [0.2, 0.42], [0.5, 0.4], [0.8, 0.4], [0.85, 0.65], [0.65, 0.55], [0.9, 0.88]],
    9: [[0.4, 0.08], [0.2, 0.6], [0.45, 0.7], [0.7, 0.6], [0.85, 0.8], [0.3, 0.88], [0.6, 0.9], [0.15, 0.78], [0.75, 0.72], [0.5, 0.55]]
  };
  const jit = (g, j, t) => { const x = Math.sin(g * 12.9898 + j * 78.233 + t) * 43758.5453; return (x - Math.floor(x) - 0.5) * 0.14; };
  const Q0 = [1.4, 1.85], ORIGIN = [2, 1.5];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmtN = v => v.toLocaleString('en-US');
  const seeded = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const col = g => (g % 4 + Math.floor(g / 4)) % 2 ? C.violet : C.cyan;

  let pts = [], cen = [], tests = [], recallAt = [], minN95 = 12;
  let n = 2, q = Q0.slice(), qStart = true, newData = 0;
  let k = 0, hits = 0, results = [], hist = [], last = null, playing = false, anim = 0, acc = 0, prevT = 0;

  // each centre is the average of its group's dots
  function centres() {
    cen = Array.from({ length: 12 }, (_, g) => { const m = pts.filter(p => p.g === g);
      return m.length ? [m.reduce((a, p) => a + p.at[0], 0) / m.length, m.reduce((a, p) => a + p.at[1], 0) / m.length] : [-9, -9]; });
  }
  // open the nn groups with the closest centres, compare only inside them
  function search(at, nn) {
    const order = cen.map((_, g) => g).sort((a, b) => dist(at, cen[a]) - dist(at, cen[b]));
    const open = new Set(order.slice(0, nn));
    let best = null, near = null, inside = 0;
    for (const p of pts) {
      const d = dist(at, p.at);
      if (!best || d < best.d) best = { p, d };
      if (open.has(p.g)) { inside++; if (!near || d < near.d) near = { p, d }; }
    }
    return { order, open, best: best.p, near: near && near.p, found: open.has(best.p.g),
      rank: order.indexOf(best.p.g) + 1, size: inside * 10, work: 12 + inside * 10 };
  }
  function makeTests(r, shaped) {
    const pick = () => { const p = pts[Math.floor(r() * pts.length)].at;
      return [clamp(p[0] + gauss(r) * 0.22, 0.03, 3.97), clamp(p[1] + gauss(r) * 0.22, 0.03, 2.97)]; };
    if (!shaped) return Array.from({ length: 100 }, pick);
    // the lesson's test set: found with 2 groups 90 times, with 3 groups 97 times, with all 12 every time
    const want = [90, 7, 3], got = [[], [], []], spare = [];
    for (let t = 0; t < 40000 && got.some((g, i) => g.length < want[i]); t++) {
      const at = pick(), rank = search(at, 12).rank, b = rank <= 2 ? 0 : rank === 3 ? 1 : 2;
      if (got[b].length < want[b]) got[b].push(at); else if (spare.length < 100) spare.push(at);
    }
    const out = got.flat().concat(spare).slice(0, 100);
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  function measure() {
    recallAt = [0];
    for (let nn = 1; nn <= 12; nn++) recallAt.push(tests.filter(t => search(t, nn).found).length);
    minN95 = recallAt.findIndex((v, i) => i > 0 && v >= 95);
  }
  function startData() {
    pts = [];
    for (let g = 0; g < 12; g++) (HAND[g] || BASE.map(([a, b], j) => [a + jit(g, j, 0), b + jit(g, j, 7)]))
      .forEach(([a, b]) => pts.push({ g, at: [g % 4 + a, Math.floor(g / 4) + b] }));
    centres(); tests = makeTests(seeded(2115), true); measure();
  }
  function randomData() {
    const seeds = Array.from({ length: 12 }, (_, g) => [g % 4 + 0.5 + (Math.random() - 0.5) * 0.5, Math.floor(g / 4) + 0.5 + (Math.random() - 0.5) * 0.5]);
    pts = [];
    seeds.forEach(([x, y]) => { for (let j = 0; j < 10; j++) pts.push({ g: 0, at: [clamp(x + gauss(Math.random) * 0.25, 0.05, 3.95), clamp(y + gauss(Math.random) * 0.25, 0.05, 2.95)] }); });
    // clustering: each dot joins the group whose seed is closest; the centre is the average of its dots
    pts.forEach(p => { p.g = seeds.reduce((b, sd, g) => dist(p.at, sd) < dist(p.at, seeds[b]) ? g : b, 0); });
    centres(); tests = makeTests(Math.random, false); measure();
  }

  const svg = s('svg', {});
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const tag = text => h('span', { class: 'sim-note', style: { margin: 0 } }, text);
  const dialLab = tag(''), counter = tag('');
  const dial = h('input', { type: 'range', min: 1, max: 12, step: 1, value: n, style: { flex: '1 1 10rem' },
    oninput: e => { n = +e.target.value; resetTest(); draw(); } });
  const speed = h('input', { type: 'range', min: 1, max: 40, step: 1, value: 8, style: { flex: '1 1 8rem' } });
  const playBtn = btn('▶ Play', () => togglePlay(), 'go');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: search only the closest groups'),
    h('p', { class: 'sub' }, 'Each dot is the tip of a passage’s meaning arrow (1 dot = 10 passages). Drag the amber question anywhere, turn the dial, and test 100 questions to measure recall.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, tag('Groups opened'), dial, dialLab),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step: one test question', () => { pause(); stepTest(); }), playBtn,
          btn('Reset test', () => { resetTest(); draw(); }), tag('Speed'), speed, counter),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => { randomData(); newData++; qStart = false; resetTest(); draw(); }),
          btn('Start again', () => { startData(); n = 2; dial.value = 2; q = Q0.slice(); qStart = true; resetTest(); draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'The amber question misses its truly closest passage (pink). Turn the dial to open just enough groups to find it.',
      check: st => st.qStart && st.found,
      why: 'Yes! The third group sits just across the border; opening it costs 100 more comparisons and finds the true best.' },
    { text: 'With 2 groups open, run all 100 test questions (Step or Play). What recall do you get?',
      check: st => st.n === 2 && st.tested === 100,
      why: 'Recall = found ÷ 100. A few true best passages sit just across a border, in a group you did not open.' },
    { text: 'Find the fewest groups that still reach a recall of at least 95%, and run the 100 test questions with it.',
      check: st => st.tested === 100 && st.n === st.minN95,
      why: 'That is the dial setting: much less work than the full search, and you measured the misses before turning it down.' },
    { text: 'Press “New data” and run the 100 test questions again. Is the recall the same?',
      check: st => st.newData >= 1 && st.tested === 100,
      why: 'Not always: every archive is different, so recall must be measured on test questions each time.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: stack the map, bars, test grid and curve
  const VW = NARROW ? 400 : 700, VH = NARROW ? 610 : 450, F = NARROW ? 1.2 : 1;
  const MX = NARROW ? 10 : 20, MY = NARROW ? 10 : 20, SC = NARROW ? 95 : 110;
  const BX0 = NARROW ? 75 : 80, BX1 = NARROW ? 320 : 400, BY = NARROW ? [320, 350] : [378, 410];
  const GX = NARROW ? 10 : 495, GY = NARROW ? 385 : 20, GC = NARROW ? 18 : 19;
  const CH = NARROW ? [245, 390, 395, 565] : [530, 685, 265, 410];
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X = ([u, v]) => [MX + u * SC, MY + (3 - v) * SC];
  const txt = (x, y, str, fill, anchor = 'middle', size = 13) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas' }, str);

  function resetTest() { pause(); k = 0; hits = 0; results = []; hist = []; last = null; }
  function stepTest(redraw = true) {
    if (k >= 100) return;
    const r = search(tests[k], n);
    results.push(r.found); hits += r.found ? 1 : 0; k++;
    hist.push(hits / k * 100);
    q = tests[k - 1].slice(); qStart = false; last = { i: k, r };
    if (redraw) draw();
  }
  function pause() { playing = false; cancelAnimationFrame(anim); playBtn.textContent = '▶ Play'; }
  function togglePlay() {
    if (playing) { pause(); return; }
    if (k >= 100) resetTest();
    playing = true; playBtn.textContent = '❚❚ Pause'; acc = 1; prevT = performance.now();
    const tick = now => {
      acc += (now - prevT) / 1000 * +speed.value; prevT = now;
      let moved = false;
      while (acc >= 1 && k < 100) { stepTest(false); acc--; moved = true; }
      if (moved) draw();
      if (k >= 100) { pause(); draw(); return; }
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  }

  // drag the question anywhere on the map
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.x < MX || p.x > MX + 4 * SC || p.y < MY || p.y > MY + 3 * SC) return;
    pause(); dragging = true; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (!dragging) return;
    const p = toSvg(e);
    q = [clamp((p.x - MX) / SC, 0, 4), clamp(3 - (p.y - MY) / SC, 0, 3)];
    qStart = false; last = null; draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const r = search(q, n), k2 = [];
    // map: bright dots are in opened groups, amber squares are the centres
    k2.push(s('rect', { x: MX, y: MY, width: 4 * SC, height: 3 * SC, fill: C.bg, stroke: C.line, rx: 6 }));
    pts.forEach(p => { const [x, y] = X(p.at);
      k2.push(s('circle', { cx: x, cy: y, r: 4.2 * F, fill: col(p.g), 'fill-opacity': r.open.has(p.g) ? 0.95 : 0.2 })); });
    cen.forEach((c, g) => {
      if (c[0] < 0) return;
      const [x, y] = X(c), on = r.open.has(g);
      k2.push(s('rect', { x: x - 5 * F, y: y - 5 * F, width: 10 * F, height: 10 * F, fill: C.amber, 'fill-opacity': on ? 1 : 0.35,
        stroke: on ? C.green : 'none', 'stroke-width': 2.5 }), txt(x + 8 * F, y - 7 * F, g + 1, on ? C.ink : C.muted, 'start', 11));
    });
    const [ox, oy] = X(ORIGIN), [qx, qy] = X(q), [bx, by] = X(r.best.at);
    k2.push(s('circle', { cx: ox, cy: oy, r: 3 * F, fill: C.muted }),
      s('line', { x1: ox, y1: oy, x2: qx, y2: qy, stroke: C.amber, 'stroke-width': 2.5 }));
    if (r.near) { const [nx, ny] = X(r.near.at);
      k2.push(s('line', { x1: qx, y1: qy, x2: nx, y2: ny, stroke: C.green, 'stroke-width': 2.5 }),
        s('circle', { cx: nx, cy: ny, r: 9 * F, fill: 'none', stroke: C.green, 'stroke-width': 2.5 })); }
    if (!r.found) k2.push(s('line', { x1: qx, y1: qy, x2: bx, y2: by, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }),
      s('circle', { cx: bx, cy: by, r: 9 * F, fill: 'none', stroke: C.pink, 'stroke-width': 2.5 }));
    k2.push(s('circle', { cx: qx, cy: qy, r: 7 * F, fill: C.amber, stroke: C.bg, 'stroke-width': 2 }));

    // work: exact search against the opened groups
    const top = Math.max(1212, r.work), bl = v => v / top * (BX1 - BX0);
    [['exact', pts.length * 10, C.muted, BY[0]], ['groups', r.work, C.amber, BY[1]]].forEach(([name, v, c, y]) => k2.push(
      txt(BX0 - 8, y + 5, name, C.muted, 'end'),
      s('rect', { x: BX0, y: y - 8, width: bl(v), height: 16, fill: c, 'fill-opacity': 0.85, rx: 3 }),
      txt(BX0 + bl(v) + 8, y + 5, fmtN(v), c, 'start')));

    // the 100 test questions: green = found, pink = missed
    for (let i = 0; i < 100; i++) {
      const x = GX + (i % 10) * GC, y = GY + Math.floor(i / 10) * GC, done = i < k;
      k2.push(s('rect', { x: x + 1.5, y: y + 1.5, width: GC - 3, height: GC - 3, rx: 2,
        fill: done ? (results[i] ? C.green : C.pink) : C.muted, 'fill-opacity': done ? 0.85 : 0.12, stroke: i === k - 1 ? C.ink : 'none' }));
    }
    k2.push(txt(GX, GY + 10 * GC + 18 * F, `found ${hits} of ${k} tested`, C.muted, 'start'));

    // recall so far, growing with every test question
    const [c0, c1, t0, t1] = CH, cy = v => t1 - v / 100 * (t1 - t0), cx = i => c0 + i / 100 * (c1 - c0);
    k2.push(s('line', { x1: c0, x2: c1, y1: t1, y2: t1, stroke: C.line }), s('line', { x1: c0, x2: c0, y1: t0, y2: t1, stroke: C.line }),
      s('line', { x1: c0, x2: c1, y1: cy(100), y2: cy(100), stroke: C.line, 'stroke-dasharray': '3 4' }),
      txt(c0 - 5, cy(100) + 4, '100%', C.muted, 'end'), txt(c0 - 5, t1 + 4, '0', C.muted, 'end'),
      txt(c0, t0 - 10, 'recall so far', C.muted, 'start'), txt(c1, t1 + 18 * F, 'questions tested', C.muted, 'end'));
    if (hist.length) k2.push(s('polyline', { points: hist.map((v, i) => `${cx(i + 1)},${cy(v)}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }),
      s('circle', { cx: cx(hist.length), cy: cy(hist[hist.length - 1]), r: 4 * F, fill: C.amber }));
    svg.replaceChildren(...k2);

    if (last) {
      const lr = last.r;
      fbox(box, [`test question ${last.i} of 100`, `true best: group ${lr.best.g + 1}`,
        `opened: groups ${lr.order.slice(0, n).map(g => g + 1).join(', ')}`,
        [lr.found ? '→ found ✓' : '→ missed ✗', lr.found ? C.green : C.pink],
        [`recall so far = ${hits} ÷ ${k} = ${fmt(Math.round(hits / k * 1000) / 10)}%`, C.amber]]);
    } else {
      fbox(box, [`groups opened = ${n}`, `work = 12 + ${fmtN(r.size)} = ${fmtN(r.work)}`, `exact search = ${fmtN(pts.length * 10)}`,
        [`true best (group ${r.best.g + 1}) → ${r.found ? 'found ✓' : 'missed ✗'}`, r.found ? C.green : C.pink],
        [k === 100 ? `recall = ${hits} ÷ 100 = ${hits}%` : 'recall: run the 100 test questions', C.amber]]);
    }
    note.textContent = 'Bright dots are in the groups you open; faded dots are never compared. Green line: the best passage the search finds. Pink dashed line: the truly closest passage, when the search misses it.';
    dialLab.textContent = `${n} of 12`;
    counter.textContent = `tested ${k} / 100`;
    chal.update({ n, found: r.found, qStart, tested: k, recall: hits, minN95, newData });
  }
  startData();
  draw();
  return () => cancelAnimationFrame(anim);
}

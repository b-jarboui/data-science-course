// 7.4.5 Try it: Bonferroni's flat line versus Holm's staircase.
// The learner drags sorted p-value bars (or taps one and uses −/+), steps through Holm's method one test at a time
// (Step, Play/Pause, speed, Reset), changes the risk budget, makes random screens, and runs many families
// where every feature is really the same, to watch the chance of any false alarm build up.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [['thickness', 0.4], ['weight', 1.1], ['width', 2], ['colour', 3], ['salt', 40]];
  const POOL = ['thickness', 'weight', 'width', 'colour', 'salt', 'cracks', 'size', 'sugar'];
  let tests = START.map(([name, p]) => ({ name, p })), budget = 5, steps = 0, sel = null;
  let playing = false, timer = 0, edited = false, done = false;
  let fam = { n: 0, raw: 0, bonf: 0, holm: 0 }, famAnim = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const famSvg = s('svg', { viewBox: '0 0 360 150' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 700 } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const famNote = h('div', { class: 'sim-note' });
  const speedIn = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 2, 'aria-label': 'Speed' });
  const budgetIn = h('input', { type: 'range', min: 1, max: 10, step: 0.5, value: 5, 'aria-label': 'Risk budget' });
  const budgetOut = h('b', {}, '5%');
  const playBtn = btn('▶ Play', () => setPlaying(!playing));
  speedIn.addEventListener('input', () => { if (playing) { clearTimeout(timer); timer = setTimeout(tick, delay()); } });
  budgetIn.addEventListener('input', () => { budget = +budgetIn.value; changed(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: climb Holm’s staircase'),
    h('p', { class: 'sub' }, 'Each bar is one feature’s p-value, sorted from smallest to largest. The violet dashed line is the Bonferroni rule (one flat threshold). The amber staircase is Holm’s method: press Step to test one feature at a time. Drag a bar, or tap it and use −0.1 / +0.1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−0.1', () => bump(-0.1)), btn('+0.1', () => bump(0.1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', () => { setPlaying(false); stepOnce(); }, 'go'), playBtn,
          btn('Reset', () => { setPlaying(false); steps = 0; draw(); }), counter),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('label', { class: 'sim-note', style: { margin: 0, display: 'flex', alignItems: 'center', gap: '.4rem' } }, 'Speed', speedIn),
          h('label', { class: 'sim-note', style: { margin: 0, display: 'flex', alignItems: 'center', gap: '.4rem' } }, 'Risk budget', budgetIn, budgetOut)),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => { tests = tests.map((_, i) => ({ name: POOL[i], p: randomP() })); edited = true; sel = null; changed(); }),
          btn('Add a test', () => { if (tests.length < 8) { tests.push({ name: POOL.find(n => !tests.some(t => t.name === n)), p: randomP() }); edited = true; changed(); } }),
          btn('Remove a test', () => { if (tests.length > 2) { const t = tests.pop(); if (sel === t) sel = null; edited = true; changed(); } }),
          btn('Start again', () => { tests = START.map(([name, p]) => ({ name, p })); budget = 5; budgetIn.value = 5; sel = null; edited = false; changed(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('div', { class: 'sim-note', style: { marginTop: 0 } }, 'If every feature is really the same: how often does a family of tests give at least one false alarm?'),
          famSvg,
          h('div', { class: 'sim-row' }, btn('Run 1000 families', runFamilies, 'go')), famNote),
        h('div', { class: 'sim-card' }, ch)))));

  const fmtP = x => fmt(Math.round(x * 100) / 100) + '%';
  const randomP = () => Math.random() < 0.5 ? rnd(1, 30) / 10 : rnd(10, 600) / 10;   // half look real, half look like noise
  const sorted = () => tests.slice().sort((a, b) => a.p - b.p);
  // how far Holm gets: passes before the first fail, and how many steps until it stops
  function holmPlan(t) {
    const n = t.length; let k = 0;
    while (k < n && t[k].p <= budget / (n - k) + 1e-9) k++;
    return { pass: k, total: Math.min(n, k + 1) };
  }
  const bonfCount = t => t.filter(d => d.p <= budget / t.length + 1e-9).length;

  const chal = challenges(ch, [
    { text: 'Press Step, one test at a time, until Holm stops.',
      check: st => st.done,
      why: 'Each pass frees a share of the budget, so the threshold climbs; at the first p-value above its step, Holm stops and skips the rest.' },
    { text: 'Drag the bars (or use −0.1 / +0.1) so that Holm flags exactly 3 features. Then Step through it.',
      check: st => st.done && st.holm === 3,
      why: 'Yes: the third smallest p-value had to sit at or below budget ÷ (tests − 2), one step higher on the staircase.' },
    { text: 'Change the data so that Bonferroni and Holm flag the same number of features (at least 1).',
      check: st => st.edited && st.bonf >= 1 && st.holm === st.bonf,
      why: 'When Holm’s next step still fails, it stops where Bonferroni does. It can tie, but it never flags fewer.' },
    { text: 'Predict first: with no correction, how often does a family of 5 same-shift tests give a false alarm? Then press “Run 1000 families”.',
      check: st => st.trials >= 1000,
      why: 'About 23% with no correction (1 − 0.95⁵), but about 5% or less with Bonferroni or Holm: one risk budget for the whole family.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 40 : 54, X1 = VW - 10, BASE = 340, TOP = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const pmax = () => Math.max(6, budget + 0.5);
  const unit = () => (BASE - TOP) / pmax();
  const slot = () => (X1 - X0) / tests.length;

  function changed() { steps = 0; budgetOut.textContent = fmtP(budget); setPlaying(false); draw(); }
  function bump(d) { if (!sel) sel = sorted()[0]; sel.p = Math.max(0.1, Math.min(60, Math.round((sel.p + d) * 10) / 10)); edited = true; changed(); }
  function stepOnce() { const plan = holmPlan(sorted()); if (steps < plan.total) steps++; draw(); }
  const delay = () => 1600 / +speedIn.value;
  function tick() { if (!playing) return; stepOnce(); if (done) { setPlaying(false); return; } timer = setTimeout(tick, delay()); }
  function setPlaying(on) {
    clearTimeout(timer);
    playing = on;
    playBtn.textContent = on ? '❚❚ Pause' : '▶ Play';
    if (on) { if (done) steps = 0; draw(); timer = setTimeout(tick, delay()); }
  }

  // drag a bar: pointer height sets that feature's p-value
  let dragging = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= tests.length) return;
    sel = sorted()[i]; dragging = sel; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (!dragging) return;
    const p = toSvg(e);
    dragging.p = Math.max(0.1, Math.min(pmax(), Math.round((BASE - p.y) / unit() * 10) / 10));
    edited = true; changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = null; });

  function draw() {
    const t = sorted(), n = t.length, plan = holmPlan(t), pm = pmax(), u = unit(), sl = slot(), bw = Math.min(56, sl * 0.6);
    done = steps >= plan.total;
    const y = p => BASE - Math.min(p, pm) * u;
    const mono = { 'font-family': 'Consolas', 'text-anchor': 'middle' };
    const k = [];
    for (let g = 0; g <= pm; g += 1) {
      k.push(s('line', { x1: X0, x2: X1, y1: y(g), y2: y(g), stroke: C.line }),
        s('text', { x: X0 - 6, y: y(g) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g + '%'));
    }
    t.forEach((d, i) => {
      const cx = X0 + sl * (i + 0.5), reached = i < steps, pass = i < plan.pass;
      const col = reached ? (pass ? C.green : C.pink) : (done ? C.muted : C.cyan);
      if (d === sel) k.push(s('rect', { x: cx - sl / 2 + 3, y: TOP - 10, width: sl - 6, height: BASE - TOP + 10, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      k.push(s('rect', { x: cx - bw / 2, y: y(d.p), width: bw, height: BASE - y(d.p), fill: col, 'fill-opacity': .82, rx: 2 }));
      if (d.p > pm) for (const dy of [0, 9]) k.push(s('line', { x1: cx - bw / 2 - 4, x2: cx + bw / 2 + 4, y1: TOP + 28 + dy, y2: TOP + 20 + dy, stroke: C.bg, 'stroke-width': 4 }));
      k.push(s('text', { x: cx, y: BASE + 20, fill: C.muted, 'font-size': (n > 6 ? 11 : 13) * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial' }, d.name),
        s('text', { x: cx, y: BASE + 42, fill: col, 'font-size': (n > 6 ? 12 : 15) * F, 'font-weight': 700, ...mono }, fmtP(d.p)),
        s('text', { x: cx, y: BASE + 64, fill: col, 'font-size': (n > 6 ? 11 : 13) * F, 'font-weight': 700, ...mono }, reached ? (pass ? 'FLAG' : 'STOP') : done ? 'SKIP' : ''));
    });
    // Holm's staircase: faint ahead, bright for the steps already taken
    for (let i = 0; i < n; i++) {
      const x1 = X0 + sl * i, x2 = x1 + sl, yt = y(budget / (n - i)), on = i < steps;
      const st = { stroke: C.amber, 'stroke-width': on ? 4 : 2, 'stroke-opacity': on ? 1 : 0.25 };
      k.push(s('line', { x1, x2, y1: yt, y2: yt, ...st }));
      if (i > 0) k.push(s('line', { x1, x2: x1, y1: y(budget / (n - i + 1)), y2: yt, ...st }));
    }
    const yb = y(budget / n);
    k.push(s('line', { x1: X0, x2: X1, y1: yb, y2: yb, stroke: C.violet, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }));
    svg.replaceChildren(...k);

    const bonf = bonfCount(t), flagsNow = Math.min(steps, plan.pass);
    const head = `Bonferroni: ${fmtP(budget)} ÷ ${n} = ${fmtP(budget / n)} each → ${bonf} flag${bonf === 1 ? '' : 's'}`;
    if (steps === 0) {
      fbox(box, [head, ['Holm: press Step to test the smallest p-value', C.amber]]);
    } else {
      const i = steps - 1, d = t[i], th = budget / (n - i), pass = i < plan.pass;
      fbox(box, [head,
        `step ${steps}: ${n - i} test${n - i === 1 ? '' : 's'} wait`,
        `threshold = ${fmtP(budget)} ÷ ${n - i} = ${fmtP(th)}`,
        [`${d.name}: ${fmtP(d.p)} ${pass ? '≤' : '>'} ${fmtP(th)} → ${pass ? 'flag' : 'stop'}`, pass ? C.green : C.pink],
        [`Holm ${done ? 'flags' : 'so far'}: ${flagsNow}`, C.amber]]);
    }
    note.textContent = done
      ? (plan.pass === n ? 'Every test passed its step, so Holm flags them all.' : `Holm stopped at ${t[plan.pass].name}: it has not passed, so the budget must still cover it and the threshold cannot rise. The rest are not checked.`)
      : 'Holm tests the smallest p-value first. Each pass frees that test’s share, so the next threshold is the budget divided by the tests still waiting.';
    counter.textContent = `Step ${steps} of ${plan.total}${done ? ' · stopped' : ''}`;
    selLabel.textContent = sel ? `Selected: ${sel.name} (${fmtP(sel.p)})` : 'Tap a bar to select it';
    drawFam();
    chal.update({ done, holm: plan.pass, bonf, edited, trials: fam.n });
  }

  // many families where every feature is really the same: p-values are pure chance
  function runFamilies() {
    cancelAnimationFrame(famAnim);
    fam = { n: 0, raw: 0, bonf: 0, holm: 0 };
    const n = tests.length, B = budget / 100;
    const batch = () => {
      for (let r = 0; r < 25; r++) {
        const ps = Array.from({ length: n }, () => Math.random()).sort((a, b) => a - b);
        let k = 0; while (k < n && ps[k] <= B / (n - k)) k++;
        fam.n++;
        if (ps[0] <= B) fam.raw++;
        if (ps.some(p => p <= B / n)) fam.bonf++;
        if (k > 0) fam.holm++;
      }
      draw();
      if (fam.n < 1000) famAnim = requestAnimationFrame(batch);
    };
    famAnim = requestAnimationFrame(batch);
  }
  function drawFam() {
    const W = 360, L0 = 112, R0 = W - 50, MAX = 50, x = v => L0 + Math.min(v, MAX) / MAX * (R0 - L0);
    const rows = [['no correction', fam.raw, C.pink], ['Bonferroni', fam.bonf, C.violet], ['Holm', fam.holm, C.amber]];
    const k = [];
    rows.forEach(([label, c, col], i) => {
      const yy = 22 + i * 36, rate = fam.n ? c / fam.n * 100 : 0;
      k.push(s('text', { x: L0 - 8, y: yy + 14, fill: C.ink, 'font-size': 13, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, label),
        s('rect', { x: L0, y: yy, width: x(rate) - L0, height: 20, fill: col, 'fill-opacity': .82, rx: 2 }),
        s('text', { x: x(rate) + 6, y: yy + 15, fill: col, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, fam.n ? fmtP(rate) : ''));
    });
    const xb = x(budget);
    k.push(s('line', { x1: xb, x2: xb, y1: 12, y2: 128, stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
      s('text', { x: xb, y: 144, fill: C.green, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'budget ' + fmtP(budget)));
    famSvg.replaceChildren(...k);
    famNote.textContent = fam.n
      ? `${fam.n} families of ${tests.length} tests: a false alarm happened in ${fmtP(fam.raw / fam.n * 100)} with no correction, ${fmtP(fam.bonf / fam.n * 100)} with Bonferroni, ${fmtP(fam.holm / fam.n * 100)} with Holm.`
      : 'Press the button: each family is a fresh set of tests where nothing is really different.';
  }

  draw();
  return () => { clearTimeout(timer); cancelAnimationFrame(famAnim); };
}

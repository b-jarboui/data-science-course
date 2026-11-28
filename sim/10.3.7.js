// 10.3.7 Try it: a generalized additive model learns a gentle age curve, step by step.
// The learner drags the old-patient dots, sets the penalty for bends and the learning rate, then steps or plays
// the learning and watches error + penalty fall; violet new patients show whether the curve predicts well.
// Two patient sliders show the additive score: 1.1 + age change + weeks-ahead change, then the sigmoid.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const RED = '#f87171';
  const AGES = Array.from({ length: 13 }, (_, i) => 20 + 5 * i), N = AGES.length;
  // chapters/10.3.md: age 20 → −0.6, 40 → 0, 60 → +0.6, 80 → +0.2; weeks 1 → +0.5, 2 → +0.2, 4 → −0.3, 8 → −0.5
  const fa = a => { const t = (a - 20) / 20; return -0.6 + 0.6 * t - t * (t - 1) * (t - 2) / 6; };
  const fw = w => { const u = Math.log2(w); return 0.5 - 0.3 * u - 0.1 * u * (u - 1) + u * (u - 1) * (u - 2) / 12; };
  const sig = z => 1 / (1 + Math.exp(-z));
  const NOISE = [0.3, -0.25, 0.2, -0.35, 0.25, -0.15, 0.3, -0.3, 0.2, -0.25, 0.25, -0.2, 0.15];
  const NOISE2 = [-0.2, 0.25, -0.3, 0.15, -0.25, 0.3, -0.2, 0.25, -0.3, 0.2, -0.15, 0.25, -0.25];
  const r2 = x => Math.round(x * 100) / 100;
  const clip = v => Math.max(-1.15, Math.min(1.15, v));
  const num = v => String(Math.round(v * 1000) / 1000);
  const CLINIC = AGES.map((a, i) => r2(clip(fa(a) + NOISE[i]))), CLINIC_NEW = AGES.map((a, i) => r2(clip(fa(a) + NOISE2[i])));
  let y = CLINIC.slice(), yNew = CLINIC_NEW.slice(), random = false;
  let lam = 0.3, lr = 0.5, speed = 8, age = 60, weeks = 1;
  let f = y.slice(), iter = 0, hist = [], info = null, rose = false, settled = false, playing = false, anim = 0, last = 0, dragging = -1;

  // error = 10 × sum of (curve − dot)²; bends = 10 × sum of (second differences)²; penalty = penalty weight × bends
  const bends = g => { const d = []; for (let i = 1; i < N - 1; i++) d.push(g[i - 1] - 2 * g[i] + g[i + 1]); return d; };
  const errOf = (g, t) => 10 * g.reduce((a, v, i) => a + (v - t[i]) ** 2, 0);
  const bendOf = g => 10 * bends(g).reduce((a, d) => a + d * d, 0);
  const total = g => errOf(g, y) + lam * bendOf(g);
  const interp = a => { const u = (a - 20) / 5, i = Math.min(N - 2, Math.floor(u)), t = u - i; return f[i] * (1 - t) + f[i + 1] * t; };

  const svg = s('svg', { viewBox: '0 0 700 500' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('▶ Play', () => playing ? pause() : run());
  const slider = (label, min, max, step, value, show, set) => {
    const out = h('b', { style: { minWidth: '3.2em' } }, show(value));
    const input = h('input', { type: 'range', min, max, step, value, style: { flex: '1 1 8rem' },
      oninput: e => { const v = +e.target.value; out.textContent = show(v); set(v); } });
    return h('label', { class: 'sim-note', style: { display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', margin: '.5rem 0 0' } }, label, input, out);
  };
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: keep the curve gentle'),
    h('p', { class: 'sub' }, 'Teal dots: what the old patients of each age group say about the score change. Drag a dot up or down. The computer starts with a curve through every dot, then smooths it step by step, looking for the smallest total of error plus penalty. Violet rings are new patients it never saw.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', step, 'go'), playBtn, btn('Reset', reset),
          btn('New data (random)', newData),
          btn('Clinic data', () => { y = CLINIC.slice(); yNew = CLINIC_NEW.slice(); random = false; reset(); })),
        slider('Penalty for bends', 0, 2, 0.05, lam, num, v => { lam = v; reset(); }),
        slider('Learning rate', 0.1, 3, 0.1, lr, num, v => { lr = v; draw(); }),
        slider('Speed (steps per second)', 1, 30, 1, speed, num, v => { speed = v; }),
        slider('Patient age', 20, 80, 1, age, num, v => { age = v; draw(); }),
        slider('Patient: weeks booked ahead', 1, 8, 1, weeks, num, v => { weeks = v; draw(); })),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Set the penalty for bends to 0, then press Step. Does the curve change?',
      check: st => st.lam === 0 && st.iter >= 1,
      why: 'No: with no cost for bends, the curve through every dot has error 0, so nothing makes it smoother.' },
    { text: 'With the clinic data and a penalty above 0, press Play until it settles. Did the total fall?',
      check: st => !st.random && st.lam > 0 && st.settled && st.fell,
      why: 'Yes: smoothing adds a little error but removes a lot of penalty, so the total goes down.' },
    { text: 'Find a penalty where the new patients’ error is clearly smaller than for the curve through every dot.',
      check: st => st.lam > 0 && st.settled && st.eNew < st.eNew0 - 1,
      why: 'A gentle curve ignores the random ups and downs of the old dots, so it predicts new patients better.' },
    { text: 'Break it on purpose: find a learning rate where the total goes UP.',
      check: st => st.rose,
      why: 'Steps that are too big jump past the best curve, so the total grows instead of falling.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.3 : 1, VH = 500;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 46 : 60, X1 = VW - 16, TOP = 40, BOT = 280;
  const X = a => X0 + (a - 20) / 60 * (X1 - X0), Y = v => (TOP + BOT) / 2 - v * (BOT - TOP) / 2.5;
  const LT = 370, LB = 470, LL = X0, LR = VW - 16;
  const tx = (x, yy, str, fill, size, anchor = 'middle', weight = 400) =>
    s('text', { x, y: yy, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas, monospace', 'font-weight': weight }, str);

  function step() {
    const before = total(f), d = bends(f), grad = f.map((v, i) => 20 * (v - y[i]));
    d.forEach((dj, j) => { grad[j] += 20 * lam * dj; grad[j + 1] -= 40 * lam * dj; grad[j + 2] += 20 * lam * dj; });
    const scale = lr / (20 * (1 + 16 * lam));
    let biggest = 0;
    f = f.map((v, i) => { const nv = Math.max(-5, Math.min(5, v - scale * grad[i])); biggest = Math.max(biggest, Math.abs(nv - v)); return nv; });
    iter++;
    const after = total(f);
    if (after > before + 1e-9) rose = true;
    settled = biggest < 2e-4;
    info = { before }; hist.push(after);
    draw();
  }
  function reset() { pause(); f = y.slice(); iter = 0; hist = [total(f)]; info = null; rose = false; settled = false; draw(); }
  function run() { if (playing) return; playing = true; playBtn.textContent = '❚❚ Pause'; last = 0; anim = requestAnimationFrame(loop); }
  function pause() { playing = false; cancelAnimationFrame(anim); playBtn.textContent = '▶ Play'; }
  function loop(now) {
    if (!playing) return;
    if (now - last >= 1000 / speed) { last = now; step(); if (settled || iter >= 600) { pause(); return; } }
    anim = requestAnimationFrame(loop);
  }
  function newData() {
    const amp = rnd(4, 8) / 10, cyc = rnd(8, 18) / 10, ph = Math.random() * Math.PI * 2;
    const tr = AGES.map(a => amp * Math.sin(cyc * Math.PI * (a - 20) / 60 + ph));
    y = tr.map(v => r2(clip(v + (Math.random() - 0.5) * 0.7)));
    yNew = tr.map(v => r2(clip(v + (Math.random() - 0.5) * 0.7)));
    random = true; reset();
  }

  // drag an old-patient dot: its height sets that age group's score change
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BOT + 10 || p.y < TOP - 20) return;
    const i = Math.round((p.x - X0) / ((X1 - X0) / (N - 1)));
    if (i < 0 || i >= N) return;
    dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    y[dragging] = r2(clip(((TOP + BOT) / 2 - p.y) / ((BOT - TOP) / 2.5)));
    random = false; reset();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; draw(); });

  function draw() {
    const k = [];
    const err = errOf(f, y), bend = bendOf(f), pen = lam * bend, tot = err + pen, eNew = errOf(f, yNew), eNew0 = errOf(y, yNew);
    // curve panel
    for (const v of [-1, -0.5, 0, 0.5, 1])
      k.push(s('line', { x1: X0, x2: X1, y1: Y(v), y2: Y(v), stroke: v === 0 ? C.muted : C.line, 'stroke-dasharray': v === 0 ? '6 5' : null }),
        tx(X0 - 6, Y(v) + 4, v > 0 ? '+' + v : v < 0 ? '−' + (-v) : '0', C.muted, 12, 'end'));
    for (let a = 20; a <= 80; a += 10) k.push(tx(X(a), BOT + 20, String(a), C.muted, 12));
    k.push(tx((X0 + X1) / 2, BOT + 40, 'age (years)', C.muted, 13),
      tx(X0, TOP - 16, 'score change', C.muted, 12, 'start'),
      tx(X1, TOP - 16, 'teal old · violet new', C.muted, 12, 'end'));
    k.push(s('line', { x1: X(age), x2: X(age), y1: TOP, y2: BOT, stroke: C.muted, 'stroke-dasharray': '3 5' }));
    AGES.forEach((a, i) => k.push(s('circle', { cx: X(a), cy: Y(clip(yNew[i])), r: 6, fill: 'none', stroke: C.violet, 'stroke-width': 2 })));
    k.push(s('polyline', { points: AGES.map((a, i) => `${X(a)},${Y(Math.max(-1.3, Math.min(1.3, f[i])))}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3 }));
    AGES.forEach((a, i) => k.push(s('circle', { cx: X(a), cy: Y(y[i]), r: 8, fill: C.cyan, stroke: dragging === i ? C.ink : 'none', 'stroke-width': 2, style: 'cursor: ns-resize' })));
    const ac = interp(age);
    k.push(s('circle', { cx: X(age), cy: Y(Math.max(-1.3, Math.min(1.3, ac))), r: 6, fill: C.green }));
    // total-versus-step panel
    const capped = hist.map(g => Math.min(g, 999));
    const xmax = Math.max(20, hist.length - 1), ymax = Math.max(1, ...capped);
    const GXp = i => LL + i / xmax * (LR - LL), GYp = g => LB - Math.min(g, ymax) / ymax * (LB - LT - 10);
    k.push(tx(LR, LT - 22, `step ${iter}   total ${fmt(r2(tot))}`, C.ink, 13, 'end', 700),
      tx(LL, LT - 6, 'total after each step', C.amber, 13, 'start', 700),
      s('line', { x1: LL, x2: LR, y1: LB, y2: LB, stroke: C.muted }), s('line', { x1: LL, x2: LL, y1: LT, y2: LB, stroke: C.muted }),
      tx(LL - 6, LT + 10, fmt(r2(ymax)), C.muted, 12, 'end'), tx(LL - 6, LB + 4, '0', C.muted, 12, 'end'),
      tx(LL, LB + 20, 'step 0', C.muted, 12, 'start'), tx(LR, LB + 20, `step ${xmax}`, C.muted, 12, 'end'),
      s('polyline', { points: capped.map((g, i) => `${GXp(i)},${GYp(g)}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }));
    if (hist.length <= 60) capped.forEach((g, i) => k.push(s('circle', { cx: GXp(i), cy: GYp(g), r: 3.5, fill: C.amber })));
    svg.replaceChildren(...k);

    // formula box: this step's numbers, then one patient's additive score
    const wc = fw(weeks), sc = 1.1 + ac + wc, sgn = v => (v < 0 ? '− ' : '+ ') + fmt(r2(Math.abs(v)));
    fbox(box, [`step ${iter}`,
      `error   = ${fmt(r2(err))}  (curve vs teal dots)`,
      `penalty = ${fmt(lam)} × bends ${fmt(r2(bend))} = ${fmt(r2(pen))}`,
      [`total   = ${fmt(r2(tot))}${info ? `  (was ${fmt(r2(info.before))})` : ''}`, C.amber],
      [`new patients: error ${fmt(r2(eNew))}  (curve through every dot: ${fmt(r2(eNew0))})`, C.violet],
      `patient: age ${age}, booked ${weeks} week${weeks > 1 ? 's' : ''} ahead`,
      `score = 1.1 ${sgn(ac)} ${sgn(wc)} = ${fmt(r2(sc))}`,
      [`chance of coming = sigmoid(${fmt(r2(sc))}) ≈ ${Math.round(sig(sc) * 100)}%`, C.green]]);
    note.textContent = rose ? 'The total went UP: the steps are too big and jump past the best curve. Try a smaller learning rate, then Reset.'
      : lam === 0 ? 'With no penalty, the curve through every dot already has error 0, so it never smooths.'
      : settled ? `Settled after ${iter} steps: the curve bends only where the dots really need it.`
      : 'Each step moves every point of the curve a little: toward its teal dot (less error) and toward its neighbours (less bending). Total = error + penalty.';
    chal.update({ iter, lam, random, settled, rose, fell: hist.length > 1 && tot < hist[0] - 1e-6, eNew, eNew0 });
  }
  reset();
  return () => pause();
}

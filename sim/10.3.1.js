// 10.3.1 Try it: a straight-line score through a translator, fitted step by step.
// The learner moves the intercept and slope by hand, or lets the computer take steps
// (Step, Play/Pause, speed, learning rate) and watches the error curve fall.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TEAL = '#2dd4bf', RED = '#f87171';
  const START = [{ n: 100, came: 75 }, { n: 100, came: 90 }, { n: 28, came: 27 }];
  let data = START.map(g => ({ ...g })), a = 0, b = 0, lr = 3, speed = 8;
  let iter = 0, hist = [], last = null, jumps = 0, handTuned = false;
  let playing = false, anim = 0, tPrev = 0, acc = 0;

  const sig = z => 1 / (1 + Math.exp(-z));
  const pred = r => sig(a + b * r);
  const share = g => g.came / g.n;
  const total = () => data.reduce((t, g) => t + g.n, 0);
  const loss = () => 100 * data.reduce((t, g, r) => t + g.n * Math.abs(share(g) - pred(r)), 0) / total();
  const maxGap = () => 100 * Math.max(...data.map((g, r) => Math.abs(share(g) - pred(r))));
  const f2 = x => (x < 0 ? '−' : '') + Math.abs(x).toFixed(2);
  const f3 = x => (x < 0 ? '−' : '') + Math.abs(x).toFixed(3);
  const pc = p => Math.round(p * 1000) / 10;
  const clamp = x => Math.max(-8, Math.min(8, x));
  const settled = () => !!last && iter >= 5 && Math.abs(last.dA) < 0.002 && Math.abs(last.dB) < 0.002;

  function slider(label, min, max, step, value, on, show = f2) {
    const val = h('b', { style: { minWidth: '4.5em' } }, show(value));
    const inp = h('input', { type: 'range', min, max, step, value, style: { flex: '1 1 6rem', minWidth: 0 },
      oninput: e => { const v = +e.target.value; val.textContent = show(v); on(v); } });
    return { inp, val, el: h('label', { class: 'sim-note', style: { display: 'flex', alignItems: 'center', gap: '.5rem', margin: 0, flex: '1 1 15rem' } }, label, inp, val) };
  }

  const svg = s('svg', { viewBox: '0 0 700 400' }), lossSvg = s('svg', { viewBox: '0 0 700 150' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('Play', () => toggle());
  const sA = slider('Intercept', -3, 5, 0.05, a, v => { a = v; byHand(); });
  const sB = slider('Slope', -2, 5, 0.05, b, v => { b = v; byHand(); });
  const sSpeed = slider('Speed', 1, 30, 1, speed, v => { speed = v; }, v => `${v} steps/s`);
  const sLr = slider('Learning rate', 0.5, 20, 0.5, lr, v => { lr = v; draw(); }, v => fmt(v));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: score, translator, prediction'),
    h('p', { class: 'sub' }, 'Teal bars: the share of patients who came, for 0, 1 and 2 reminders. Amber curve: the model, score = intercept + slope × reminders, passed through the S-shaped translator. Move the sliders, or let the computer find the numbers step by step.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, sA.el, sB.el),
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); step(); draw(); }, 'go'), playBtn,
          btn('Reset', () => reset()),
          btn('New data (random)', () => newData()),
          btn('Clinic data', () => { data = START.map(g => ({ ...g })); reset(); })),
        h('div', { class: 'sim-row' }, sSpeed.el, sLr.el),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, counter),
        lossSvg),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Move the intercept and slope sliders by hand until every group’s prediction is within 3 points of what the clinic saw.',
      check: st => st.handTuned && st.iter === 0 && st.maxGap < 3,
      why: 'Well done: the straight-line score, passed through the translator, now matches every group.' },
    { text: 'Drag the slope to 3 or more. Does any prediction go past 100%?',
      check: st => st.b >= 3,
      why: 'Never: the score keeps growing, but the translator bends it, so every share stays under 100%.' },
    { text: 'Predict first: will the computer settle by itself? Press Reset, then Play.',
      check: st => st.settled,
      why: 'It settles: a big error gives a big step, a small error a small step, until the steps are tiny.' },
    { text: 'Set the learning rate to 10 or more, press Reset, then Step a few times. Does it move calmly?',
      check: st => st.jumps >= 1,
      why: 'Too big a learning rate makes a step jump past the answer, so the guess swings back the other way.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.3 : 1;
  const X0 = NARROW ? 46 : 60, X1 = VW - 12, BASE = 330, TOP = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} 400`);
  lossSvg.setAttribute('viewBox', `0 0 ${VW} 150`);
  const xr = r => X0 + (r + 0.5) * (X1 - X0) / 4;
  const yp = p => BASE - p * (BASE - TOP) / 1.08;
  const mono = { 'font-family': 'Consolas, monospace' };

  function syncSliders() {
    sA.inp.value = a; sA.val.textContent = f2(a);
    sB.inp.value = b; sB.val.textContent = f2(b);
  }
  function stop() { playing = false; cancelAnimationFrame(anim); playBtn.textContent = 'Play'; }
  function restart() { iter = 0; last = null; jumps = 0; hist = [loss()]; }
  function byHand() { stop(); restart(); handTuned = true; draw(); }
  function reset() { stop(); a = 0; b = 0; restart(); syncSliders(); draw(); }
  function newData() {
    const ta = rnd(-100, 150) / 100, tb = rnd(20, 160) / 100;
    data = [0, 1, 2].map(r => {
      const n = rnd(20, 100); let came = 0;
      for (let i = 0; i < n; i++) if (Math.random() < sig(ta + tb * r)) came++;
      return { n, came: Math.max(1, Math.min(n - 1, came)) };
    });
    reset();
  }

  // one step: each change = learning rate × gap (saw − predicted, averaged over patients)
  function step() {
    const n = total(); let gA = 0, gB = 0;
    data.forEach((g, r) => { const gap = share(g) - pred(r); gA += g.n * gap / n; gB += g.n * r * gap / n; });
    const prev = last;
    last = { a0: a, b0: b, gA, gB, dA: lr * gA, dB: lr * gB };
    if (prev && lr >= 10 && Math.abs(last.dA) > 0.01 && Math.sign(prev.dA) !== Math.sign(last.dA)) jumps++;
    a = clamp(a + last.dA); b = clamp(b + last.dB);
    iter++; hist.push(loss());
    syncSliders();
  }

  function loop(now) {
    if (!playing) return;
    acc += Math.min(0.25, (now - tPrev) / 1000) * speed; tPrev = now;
    while (acc >= 1 && playing) {
      acc -= 1; step();
      if (settled() || iter >= 999) stop();
    }
    draw();
    if (playing) anim = requestAnimationFrame(loop);
  }
  function toggle() {
    if (playing) { stop(); return; }
    playing = true; playBtn.textContent = 'Pause';
    tPrev = performance.now(); acc = 1;
    anim = requestAnimationFrame(loop);
  }

  function drawMain() {
    const k = [], bw = Math.min(70, (X1 - X0) / 4 * 0.5);
    [0, 0.25, 0.5, 0.75, 1].forEach(p => k.push(
      s('line', { x1: X0, x2: X1, y1: yp(p), y2: yp(p), stroke: p === 1 ? C.ink : C.line, 'stroke-opacity': p === 1 ? 0.6 : 1, 'stroke-dasharray': p === 1 ? '6 6' : null }),
      s('text', { x: X0 - 6, y: yp(p) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, `${p * 100}%`)));
    data.forEach((g, r) => {
      const x = xr(r), y = yp(share(g));
      k.push(s('rect', { x: x - bw / 2, y, width: bw, height: BASE - y, fill: TEAL, 'fill-opacity': 0.3, stroke: TEAL, rx: 3 }),
        s('text', { x, y: BASE + 38 * F, fill: TEAL, 'font-size': 12 * F, 'text-anchor': 'middle', ...mono }, `saw ${Math.round(share(g) * 100)}%`));
    });
    const pts = [];
    for (let r = -0.45; r <= 3.45 + 1e-9; r += 0.05) pts.push(`${xr(r)},${yp(pred(r))}`);
    k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3 }));
    for (let r = 0; r < 4; r++) {
      const x = xr(r), yP = yp(pred(r));
      if (r < 3) k.push(s('line', { x1: x, x2: x, y1: yp(share(data[r])), y2: yP, stroke: RED, 'stroke-width': 3 }));
      k.push(s('circle', { cx: x, cy: yP, r: 6, fill: C.amber }),
        s('text', { x: x + bw / 2 + 4, y: yP + (r < 3 && pred(r) < share(data[r]) ? 16 : -6), fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, ...mono }, `${Math.round(pred(r) * 100)}%`),
        s('text', { x, y: BASE + 20 * F, fill: C.ink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', ...mono }, String(r)));
      if (r === 3) k.push(s('text', { x, y: BASE + 38 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', ...mono }, 'no data'));
    }
    svg.replaceChildren(...k);
  }

  function drawLoss() {
    const L0 = X0, R0 = VW - 12, T0 = 26, B0 = 120;
    const n = Math.max(20, hist.length - 1), top = Math.max(5, ...hist);
    const lx = i => L0 + i / n * (R0 - L0), ly = e => B0 - e / top * (B0 - T0);
    const k = [s('line', { x1: L0, x2: R0, y1: B0, y2: B0, stroke: C.line }), s('line', { x1: L0, x2: L0, y1: T0, y2: B0, stroke: C.line }),
      s('text', { x: L0 - 6, y: T0 + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, String(Math.round(top))),
      s('text', { x: L0 - 6, y: B0 + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, '0'),
      s('text', { x: L0, y: 16, fill: C.muted, 'font-size': 12 * F }, 'error (points) after each step'),
      s('text', { x: R0, y: B0 + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, `step ${n}`)];
    if (hist.length > 1) k.push(s('polyline', { points: hist.map((e, i) => `${lx(i)},${ly(e)}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }));
    k.push(s('circle', { cx: lx(hist.length - 1), cy: ly(hist[hist.length - 1]), r: 4, fill: C.amber }));
    lossSvg.replaceChildren(...k);
  }

  function draw() {
    drawMain(); drawLoss();
    const lines = [`score = ${f2(a)} + ${f2(b)} × reminders`];
    data.forEach((g, r) => lines.push(`${r}: score ${f2(a + b * r)} → ${pc(pred(r))}%  saw ${pc(share(g))}%`));
    lines.push([`error = ${loss().toFixed(1)} points`, C.amber]);
    if (last) lines.push(`step ${iter}: change = ${fmt(lr)} × gap`,
      `intercept ${f2(last.a0)} + ${fmt(lr)} × ${f3(last.gA)} = ${f2(a)}`,
      `slope     ${f2(last.b0)} + ${fmt(lr)} × ${f3(last.gB)} = ${f2(b)}`);
    fbox(box, lines);
    note.textContent = jumps ? 'The steps are too big: each one jumps past the answer, so the guess swings back and forth.'
      : settled() ? 'Settled: smaller errors gave smaller steps, until the steps were tiny.'
      : 'Each step: change = learning rate × gap. The intercept uses the average gap; the slope uses each gap times its number of reminders.';
    counter.textContent = `Step ${iter} · error ${loss().toFixed(1)} points`;
    chal.update({ maxGap: maxGap(), handTuned, iter, b, settled: settled(), jumps });
  }

  hist = [loss()];
  syncSliders();
  draw();
  return () => { playing = false; cancelAnimationFrame(anim); };
}

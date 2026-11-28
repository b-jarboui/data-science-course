// 20.3.5 Try it: top-k sampling.
// The learner sets k (slider, or taps a bar to cut just below it), changes the temperature, switches step,
// makes random chances, draws tokens one at a time or many at once, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const STEPS = [
    { name: 'after “The library will open”', toks: [['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]] },
    { name: 'after “The library will open at”', toks: [['nine', 40], ['ten', 30], ['noon', 30]] }];
  const POOL = ['at', 'on', 'soon', 'late', 'today', 'early', 'again', 'now', 'here', 'purple', 'banana', 'quietly'];
  let step = 0, toks = STEPS[0].toks, k = 2, temp = 1, random = false;
  let counts = [], draws = 0, last = -1, playing = false, speed = 20, anim = 0, acc = 0, prev = 0;

  const svg = s('svg', { viewBox: '0 0 700 300' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const lab = () => h('span', { class: 'sim-note', style: { margin: 0 } });
  const kLab = lab(), tLab = lab(), vLab = lab();
  const kIn = h('input', { type: 'range', min: 1, max: 5, step: 1, value: k, 'aria-label': 'k', oninput: e => { k = +e.target.value; changed(); } });
  const tIn = h('input', { type: 'range', min: 0.5, max: 2, step: 0.1, value: 1, 'aria-label': 'temperature', oninput: e => { temp = Math.round(e.target.value * 10) / 10; changed(); } });
  const vIn = h('input', { type: 'range', min: 1, max: 60, step: 1, value: speed, 'aria-label': 'draws per second', oninput: e => { speed = +e.target.value; labels(); } });
  const playBtn = btn('▶ Play draws', () => setPlaying(!playing), 'go');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: top-k sampling'),
    h('p', { class: 'sub' }, 'Each bar is one possible next token and its chance. Move k, or tap a bar to cut just below it: only the top k are kept, their chances are shared out again, and every draw comes from them.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, kLab, kIn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, tLab, tIn),
        h('div', { class: 'sim-row' },
          btn('Step 1: after “open”', () => setStep(0)),
          btn('Step 2: after “open at”', () => setStep(1)),
          btn('New data (random)', newData),
          btn('Start again', reset)),
        h('div', { class: 'sim-row' },
          btn('Draw 1', () => drawMany(1)), btn('Draw 100', () => drawMany(100)), playBtn,
          btn('Clear draws', () => { clearDraws(); draw(); }, 'ghost')),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, vLab, vIn)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10, f1 = x => fmt(r1(x));
  // temperature first (20.3.4): each chance to the power 1 / temperature, then shared to 100%
  function model() {
    const w = toks.map(([, p]) => Math.pow(p, 1 / temp)), t = w.reduce((a, b) => a + b, 0);
    const c = w.map(x => x / t * 100), n = c.length, kk = Math.min(k, n);
    const tot = c.slice(0, kk).reduce((a, b) => a + b, 0);
    return { c, n, kk, tot, sh: c.map((p, i) => i < kk ? p / tot * 100 : 0) };
  }

  const chal = challenges(ch, [
    { text: 'At step 1, set k so that “purple” can never be drawn, but more than one token still can.',
      check: st => st.step === 0 && !st.random && st.k >= 2 && st.k <= 4,
      why: 'Yes: any k from 2 to 4 cuts “purple” off and still keeps some variety.' },
    { text: 'Make the sampler draw the same token every time.',
      check: st => st.k === 1,
      why: 'Right: with k = 1 only the top token is kept. That is greedy decoding.' },
    { text: 'At step 2 (after “open at”), keep “noon” with the smallest k that works.',
      check: st => st.step === 1 && !st.random && st.k === 3,
      why: 'k = 3 keeps noon here. But the same k = 3 at step 1 would also keep “soon”: one fixed k cannot fit every step.' },
    { text: 'Predict first: at step 1, with k = 2 and temperature 1, how often will “at” be drawn? Then draw at least 200 times.',
      check: st => st.step === 0 && !st.random && st.k === 2 && st.temp === 1 && st.draws >= 200,
      why: 'Close to 60%: “at” has 45 of the kept 75. The more you draw, the closer it gets.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, mono = 'Consolas, monospace';
  const X0 = NARROW ? 86 : 100, BL = VW - X0 - (NARROW ? 150 : 190), TOP = 44 * F, RH = 50 * F, BH = 20 * F;

  function clearDraws() { counts = toks.map(() => 0); draws = 0; last = -1; }
  function changed() { clearDraws(); draw(); }
  function drawOne(m) {
    let r = Math.random() * 100, i = 0;
    while (i < m.kk - 1 && r >= m.sh[i]) { r -= m.sh[i]; i++; }
    counts[i]++; draws++; last = i;
  }
  function drawMany(x) { const m = model(); for (let j = 0; j < x; j++) drawOne(m); draw(); }
  function setStep(i) { step = i; toks = STEPS[i].toks; random = false; changed(); }
  function newData() {
    const n = rnd(3, 8), words = POOL.slice().sort(() => Math.random() - 0.5).slice(0, n);
    const sharp = [0.6, 1.2, 2.2][rnd(0, 2)];   // spread out, medium or peaked
    const w = words.map(() => Math.exp(Math.random() * 3 * sharp)), t = w.reduce((a, b) => a + b, 0);
    toks = words.map((x, i) => [x, Math.max(0.1, r1(w[i] / t * 100))]).sort((a, b) => b[1] - a[1]);
    random = true; changed();
  }
  function reset() {
    setPlaying(false);
    step = 0; toks = STEPS[0].toks; k = 2; temp = 1; random = false; tIn.value = 1;
    changed();
  }
  function setPlaying(on) {
    playing = on; playBtn.textContent = on ? '❚❚ Pause' : '▶ Play draws';
    cancelAnimationFrame(anim);
    if (on) { prev = performance.now(); acc = 0; anim = requestAnimationFrame(loop); }
  }
  function loop(now) {
    acc += Math.min(0.25, (now - prev) / 1000) * speed; prev = now;
    const m = Math.floor(acc);
    if (m > 0) { acc -= m; drawMany(m); }
    anim = requestAnimationFrame(loop);
  }

  // tap or drag on a bar: k cuts just below it
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const pick = e => {
    const i = Math.floor((toSvg(e).y - TOP + 10 * F) / RH);
    if (i >= 0 && i < toks.length && i + 1 !== k) { k = i + 1; changed(); }
  };
  svg.addEventListener('pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); pick(e); });
  svg.addEventListener('pointermove', e => { if (dragging) pick(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });

  function labels() {
    kLab.textContent = `k = ${k}`;
    tLab.textContent = `temperature ${temp}`;
    vLab.textContent = `speed: ${speed} draws per second`;
  }

  function draw() {
    if (k > toks.length) k = toks.length;
    const { c, n, kk, tot, sh } = model();
    kIn.max = n; kIn.value = k; labels();
    svg.setAttribute('viewBox', `0 0 ${VW} ${TOP + n * RH + 6}`);
    const el = [s('text', { x: 6, y: 22 * F, fill: C.muted, 'font-size': 14 * F, 'font-family': mono }, random ? 'new data: random chances' : STEPS[step].name)];
    c.forEach((p, i) => {
      const y = TOP + i * RH, kept = i < kk, col = kept ? C.cyan : C.pink;
      if (i === last) el.push(s('rect', { x: 2, y: y - 6 * F, width: VW - 4, height: RH - 8 * F, rx: 8, fill: C.amber, 'fill-opacity': 0.08, stroke: C.amber, 'stroke-opacity': 0.6 }));
      el.push(s('text', { x: X0 - 8, y: y + BH * 0.75, fill: kept ? C.ink : C.pink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono }, toks[i][0]));
      el.push(s('rect', { x: X0, y, width: Math.max(1, p / 100 * BL), height: BH, rx: 3, fill: col, 'fill-opacity': kept ? 0.3 : 0.45 }));
      if (kept) {
        // bright bar = chance after sharing again; white tick = the chance before
        const xp = X0 + p / 100 * BL;
        el.push(s('rect', { x: X0, y, width: sh[i] / 100 * BL, height: BH, rx: 3, fill: C.cyan, 'fill-opacity': 0.85 }),
          s('line', { x1: xp, x2: xp, y1: y - 3, y2: y + BH + 3, stroke: C.ink, 'stroke-width': 2, 'stroke-opacity': 0.8 }));
      }
      el.push(s('text', { x: X0 + Math.max(p, sh[i]) / 100 * BL + 8, y: y + BH * 0.75, fill: col, 'font-size': 14 * F, 'font-family': mono }, `${f1(p)}% → ${f1(sh[i])}%`));
      if (draws) {
        const share = counts[i] / draws;
        el.push(s('rect', { x: X0, y: y + BH + 4 * F, width: share * BL, height: 6 * F, rx: 2, fill: C.amber, 'fill-opacity': 0.9 }),
          s('text', { x: X0 + share * BL + 6, y: y + BH + 10 * F, fill: C.amber, 'font-size': 11 * F, 'font-family': mono }, `${counts[i]} drawn`));
      }
    });
    const cy = TOP + kk * RH - 10 * F;
    el.push(s('line', { x1: 4, x2: VW - 4, y1: cy, y2: cy, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '9 7' }),
      s('text', { x: VW - 6, y: cy - 5, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono }, kk === n ? `k = ${k} (all)` : `k = ${kk}`));
    svg.replaceChildren(...el);

    const names = toks.slice(0, kk).map(t => t[0]);
    const lines = [];
    if (temp !== 1) lines.push([`temperature ${temp}: chances reshaped`, C.violet]);
    lines.push(`k = ${kk}: keep ${names.length <= 4 ? names.join(', ') : names.slice(0, 3).join(', ') + ', …'}`);
    lines.push(`kept total = ${kk > 1 && kk <= 4 ? c.slice(0, kk).map(f1).join(' + ') + ' = ' : ''}${f1(tot)}%`);
    if (kk <= 3) c.slice(0, kk).forEach((p, i) => lines.push([`${names[i]} = ${f1(p)} ÷ ${f1(tot)} = ${f1(sh[i])}%`, C.cyan]));
    else lines.push([`each kept chance ÷ ${f1(tot)}`, C.cyan]);
    lines.push([`kept chances now add up to ${f1(sh.reduce((a, b) => a + b, 0))}%`, C.green]);
    lines.push([draws ? `draws: ${draws}, “${toks[0][0]}” ${f1(counts[0] / draws * 100)}% of them` : 'draws: 0', C.amber]);
    fbox(box, lines);
    note.textContent = kk === 1 ? 'k = 1: only the top token can be drawn. That is greedy decoding.'
      : kk === n ? 'k keeps every token here, so nothing is cut: even the least likely token can be drawn.'
      : `Pink tokens are cut: they can never be drawn at this step. The ${kk} kept chances are each divided by their total (${f1(tot)}%), so they add up to 100% again.`;
    chal.update({ step, random, k: kk, n, temp, draws });
  }
  clearDraws();
  draw();
  return () => { playing = false; cancelAnimationFrame(anim); };
}

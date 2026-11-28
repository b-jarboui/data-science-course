// 10.3.8 Try it: partial pooling, the heart of a mixed-effects model.
// The learner drags a branch average along its line, changes its patient count and the two spreads,
// makes random clinics, and watches each estimate pulled toward the shared average: small branches move more.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const NAMES = ['North', 'South', 'East', 'West'], COL = [C.cyan, C.amber, C.pink, C.violet];
  const START_N = [40, 40, 4, 4], START_M = [20, 30, 40, 10];
  let n = START_N.slice(), m = START_M.slice(), sIn = 10, sAc = 5, sel = 2, randoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  function slider(label, min, max, get, set) {
    const out = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '4rem' } });
    const inp = h('input', { type: 'range', min, max, step: 1, value: get(), style: { flex: '1 1 8rem' },
      oninput: e => { set(+e.target.value); changed(); } });
    return { el: h('label', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', { style: { minWidth: '9rem' } }, label), inp, out),
      sync() { inp.value = get(); out.textContent = `${get()} min`; } };
  }
  const spIn = slider('Spread inside a branch', 2, 20, () => sIn, v => { sIn = v; });
  const spAc = slider('Spread across branches', 2, 20, () => sAc, v => { sAc = v; });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: pull toward the shared average'),
    h('p', { class: 'sub' }, 'Each line is one branch. The hollow circle is the branch’s own average; the filled dot is its estimate. Drag along a line to move a branch average, or tap a branch and change its number of patients.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−10', () => bump(-10)), btn('−1', () => bump(-1)), btn('+1', () => bump(1)), btn('+10', () => bump(10)), selLabel),
        spIn.el, spAc.el,
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => { n = n.map(() => rnd(2, 60)); m = m.map(() => rnd(5, 55)); randoms++; changed(); }, 'go'),
          btn('Start again', () => { n = START_N.slice(); m = START_M.slice(); sIn = 10; sAc = 5; sel = 2; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  function calc() {
    const N = n.reduce((a, b) => a + b, 0), tot = n.reduce((a, b, i) => a + b * m[i], 0), sh = tot / N, K = (sIn * sIn) / (sAc * sAc);
    const w = n.map(c => c / (c + K)), est = m.map((v, i) => w[i] * v + (1 - w[i]) * sh);
    return { N, tot, sh, K, w, est };
  }
  const chal = challenges(ch, [
    { text: 'Tap East and give it 40 patients. How far does it move now?',
      check: st => st.n[2] >= 40, why: 'With 40 patients East’s weight is about 0.9, so its estimate stays near its own average.' },
    { text: 'Keep West at least 10 minutes from the shared average, but make its estimate move less than 2 minutes.',
      check: st => Math.abs(st.m[3] - st.sh) >= 10 && Math.abs(st.est[3] - st.m[3]) < 2,
      why: 'Right: more patients, or a bigger spread across branches, give West a bigger weight, so the pull gets small.' },
    { text: 'Set the two spreads so the shared average counts like exactly 1 patient.',
      check: st => Math.abs(st.K - 1) < 1e-9, why: 'Equal spreads: the shared average is as good a guess as one patient.' },
    { text: 'Press “New data” two times. Does the branch with the fewest patients always get the smallest weight?',
      check: st => st.randoms >= 2,
      why: 'Always. Weight = patients ÷ (patients + what the shared average counts like), so fewer patients means a smaller weight and a bigger pull.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, VH = 410, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 18 : 30, X1 = VW - (NARROW ? 18 : 30), ROWY = [78, 158, 238, 318], AXY = 356;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const n2x = v => X0 + v / 60 * (X1 - X0);

  function changed() { spIn.sync(); spAc.sync(); draw(); }
  function bump(d) { n[sel] = Math.max(1, Math.min(80, n[sel] + d)); changed(); }

  // drag along a line: pointer position sets that branch average
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const rowAt = y => { let best = -1, d = 45; ROWY.forEach((ry, i) => { if (Math.abs(y - ry) < d) { d = Math.abs(y - ry); best = i; } }); return best; };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = rowAt(p.y);
    if (i < 0) return;
    sel = i; dragging = true; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (!dragging) return;
    const p = toSvg(e);
    m[sel] = Math.max(1, Math.min(59, Math.round((p.x - X0) / (X1 - X0) * 60)));
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const { N, tot, sh, K, w, est } = calc();
    const k = [];
    k.push(s('line', { x1: X0, x2: X1, y1: AXY, y2: AXY, stroke: C.muted, 'stroke-width': 2 }));
    for (let g = 0; g <= 60; g += 10) k.push(
      s('line', { x1: n2x(g), x2: n2x(g), y1: AXY - 5, y2: AXY + 5, stroke: C.muted }),
      s('text', { x: n2x(g), y: AXY + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g));
    k.push(s('text', { x: X1, y: AXY + 42, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end' }, 'minutes waiting'));
    const xs = n2x(sh);
    k.push(s('line', { x1: xs, x2: xs, y1: 34, y2: AXY - 8, stroke: C.green, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
      s('text', { x: Math.min(X1, Math.max(X0, xs)), y: 24, fill: C.green, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas',
        'text-anchor': xs < VW / 3 ? 'start' : xs > 2 * VW / 3 ? 'end' : 'middle' }, `shared average ${fmt(r2(sh))}`));
    n.forEach((c, i) => {
      const y = ROWY[i], col = COL[i], xm = n2x(m[i]), xe = n2x(est[i]);
      if (i === sel) k.push(s('rect', { x: X0 - 12, y: y - 44, width: X1 - X0 + 24, height: 72, rx: 10, fill: '#ffffff', 'fill-opacity': 0.05 }));
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': 2 }),
        s('text', { x: X0, y: y - 22, fill: col, 'font-size': 14 * F, 'font-weight': 700 }, `${NAMES[i]} · ${c} patients · weight ${fmt(r2(w[i]))}`),
        s('line', { x1: xs, x2: xe, y1: y, y2: y, stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-opacity': 0.9 }),
        s('circle', { cx: xm, cy: y, r: 9 * F, fill: 'none', stroke: col, 'stroke-width': 2.5 }),
        s('circle', { cx: xe, cy: y, r: 7 * F, fill: col }),
        s('text', { x: xe, y: y + 24, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(est[i]))));
      if (Math.abs(xm - xe) > 40) k.push(s('text', { x: xm, y: y + 24, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, m[i]));
    });
    svg.replaceChildren(...k);
    const i = sel, wi = r2(w[i]);
    fbox(box, [
      `shared = ${fmt(tot)} min ÷ ${N} patients = ${fmt(r2(sh))}`,
      `shared counts like ${fmt(r2(K))} patients`,
      [`   (${sIn}×${sIn} ÷ ${sAc}×${sAc})`, C.muted],
      `${NAMES[i]}: weight = ${n[i]} ÷ (${n[i]} + ${fmt(r2(K))}) = ${fmt(wi)}`,
      `estimate = ${fmt(wi)} × ${m[i]} + ${fmt(r2(1 - w[i]))} × ${fmt(r2(sh))}`,
      [`         = ${fmt(r2(est[i]))} minutes`, COL[i]]]);
    note.textContent = `${NAMES[i]} moves ${fmt(r2(Math.abs(est[i] - m[i])))} minutes toward the shared average. Fewer patients means a smaller weight and a bigger pull.`;
    selLabel.textContent = `Selected: ${NAMES[sel]} (${n[sel]} patients)`;
    chal.update({ n, m, est, sh, K, randoms });
  }
  changed();
  return () => {};
}

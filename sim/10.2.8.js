// 10.2.8 Try it: residual diagnostics.
// The learner drags the rent of any apartment (or taps it and uses -10 / +10), switches between a straight
// and a curved line, makes random data, and watches the residual plot and its pattern update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const AREA = [40, 40, 40, 40, 50, 50, 50, 50, 60, 60, 60, 60];
  const START = [980, 1000, 1000, 1020, 1060, 1100, 1100, 1140, 1320, 1400, 1400, 1480];
  let v = START.slice(), sel = 1, model = 'line', newCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 570' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const lineBtn = btn('Straight line', () => { model = 'line'; draw(); });
  const curveBtn = btn('Curved line', () => { model = 'curve'; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: read the residual plot'),
    h('p', { class: 'sub' }, 'Top: each apartment is a dot, with the line’s guess. Bottom: the residual plot, each gap against its fitted value. Drag a dot up or down, or tap it and use −10 / +10.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−10', () => bump(-10)), btn('+10', () => bump(10)), selLabel),
        h('div', { class: 'sim-row' },
          lineBtn, curveBtn,
          btn('New data (random)', newData),
          btn('Start again', () => { v = START.slice(); sel = 1; model = 'line'; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Curved line”. Does the U shape stay?',
      check: st => st.model === 'curve', why: 'The U is gone: the curved line follows the bend, so every group sits around zero.' },
    { text: 'With the straight line, drag dots until there is no U: every group average within 5 dollars of zero.',
      check: st => st.model === 'line' && st.ga.every(x => Math.abs(x) <= 5),
      why: 'Now the three group averages lie on one straight line, so the straight line fits and the residuals show no pattern.' },
    { text: 'With the straight line, make an upside-down U: the middle group above zero, both end groups below.',
      check: st => st.model === 'line' && st.ga[0] < -5 && st.ga[1] > 5 && st.ga[2] < -5,
      why: 'Right: this data bends down in the middle, and the straight line missed that curve too.' },
    { text: 'Press “New data” three times and watch the last line of the box. Is the average residual ever different from 0?',
      check: st => st.newCount >= 3,
      why: 'Never. Above and below always balance, even when the data bends. So a zero average tells you nothing: always look at the plot.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.3 : 1;
  const X0 = NARROW ? 56 : 74, X1 = VW - 16;
  const A0 = 30, A1 = 236, B0 = 318, B1 = 516;             // top chart and residual plot, top and bottom
  svg.setAttribute('viewBox', `0 0 ${VW} 570`);
  const xs = a => X0 + (a - 35) / 30 * (X1 - X0);
  const off = i => ((i % 4) - 1.5) * 9 * F;                  // slight sideways offset, height fixed
  const sum = a => a.reduce((p, q) => p + q, 0);
  const sign = x => (Math.round(x) > 0 ? '+' : Math.round(x) < 0 ? '−' : '') + Math.abs(Math.round(x));
  const range = () => ({ lo: Math.floor((Math.min(...v) - 80) / 100) * 100, hi: Math.ceil((Math.max(...v) + 80) / 100) * 100 });

  function fit() {
    const my = sum(v) / 12;
    let sxy = 0, sxx = 0;
    v.forEach((y, i) => { sxy += (AREA[i] - 50) * (y - my); sxx += (AREA[i] - 50) ** 2; });
    const b = sxy / sxx, m = [0, 1, 2].map(g => sum(v.slice(4 * g, 4 * g + 4)) / 4);
    // curved line: the smooth curve through the three group averages
    return model === 'line' ? a => my + b * (a - 50)
      : a => { const t = (a - 50) / 10; return m[1] + t * (m[2] - m[0]) / 2 + t * t * (m[0] + m[2] - 2 * m[1]) / 2; };
  }

  function changed() { draw(); }
  function bump(d) { v[sel] = Math.max(300, Math.min(3000, v[sel] + d)); changed(); }
  function newData() {
    const base = rnd(80, 110) * 10, step = rnd(5, 25) * 10, bend = [0, rnd(3, 8) * 10, -rnd(3, 8) * 10][rnd(0, 2)];
    v = AREA.map(a => { const t = (a - 50) / 10; return Math.max(300, Math.round((base + step * (t + 1) + bend * t * t) / 10) * 10 + rnd(-4, 4) * 10); });
    newCount++; changed();
  }

  // drag a dot: pointer height sets the rent (the scale stays still while you drag)
  let dragging = -1, frozen = null, pos = [];
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > A1 + 30) return;
    let best = -1, bd = 1e9;
    pos.forEach(([x, y], i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = i; } });
    if (bd > 40) return;
    sel = best; dragging = best; frozen = range(); svg.setPointerCapture(e.pointerId); draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e), { lo, hi } = frozen;
    const r = lo + (A1 - p.y) / (A1 - A0) * (hi - lo);
    v[dragging] = Math.max(Math.max(300, lo), Math.min(hi, Math.round(r / 10) * 10));
    changed();
  });
  const stop = () => { if (dragging >= 0) { dragging = -1; frozen = null; draw(); } };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);

  function draw() {
    const f = fit(), { lo, hi } = frozen || range();
    const ys = r => A1 - (r - lo) / (hi - lo) * (A1 - A0);
    const fitted = AREA.map(a => f(a)), res = v.map((y, i) => y - fitted[i]);
    const ga = [0, 1, 2].map(g => sum(res.slice(4 * g, 4 * g + 4)) / 4);
    const avg = Math.round(sum(res) / 12 * 100) / 100 + 0;
    const k = [], txt = (x, y, str, col = C.muted, size = 13, anchor = 'middle', bold = false) =>
      s('text', { x, y, fill: col, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas', 'font-weight': bold ? 700 : 400 }, str);

    // top chart: rent against floor area
    const stepR = hi - lo > 800 ? 200 : 100;
    for (let r = lo; r <= hi; r += stepR) {
      k.push(s('line', { x1: X0, x2: X1, y1: ys(r), y2: ys(r), stroke: C.line }), txt(X0 - 8, ys(r) + 4, r, C.muted, 12, 'end'));
    }
    [40, 50, 60].forEach(a => k.push(txt(xs(a), A1 + 18, a)));
    k.push(txt(X1, A1 + 36, 'floor area (m²)', C.muted, 13, 'end'), txt(X0, A0 - 12, 'monthly rent ($)', C.muted, 13, 'start'));
    const path = [];
    for (let a = 36; a <= 64; a += 0.5) path.push(`${path.length ? 'L' : 'M'}${xs(a).toFixed(1)} ${ys(f(a)).toFixed(1)}`);
    k.push(s('path', { d: path.join(' '), fill: 'none', stroke: C.violet, 'stroke-width': 3 }));
    pos = v.map((y, i) => [xs(AREA[i]) + off(i), ys(y)]);
    const pxPerM2 = (X1 - X0) / 30;
    v.forEach((y, i) => {
      const [x, yy] = pos[i], col = res[i] >= 0 ? C.green : C.pink;
      k.push(s('line', { x1: x, x2: x, y1: ys(f(AREA[i] + off(i) / pxPerM2)), y2: yy, stroke: col, 'stroke-width': 2.5 }));
    });
    v.forEach((y, i) => {
      const [x, yy] = pos[i];
      if (i === sel) k.push(s('circle', { cx: x, cy: yy, r: 12 * F, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      k.push(s('circle', { cx: x, cy: yy, r: 9 * F, fill: C.cyan, 'fill-opacity': .2 }), s('circle', { cx: x, cy: yy, r: 5 * F, fill: C.cyan }));
    });

    // residual plot: residual against fitted value
    const R = Math.max(60, Math.ceil(Math.max(...res.map(Math.abs)) * 1.25 / 20) * 20);
    let flo = Math.min(...fitted), fhi = Math.max(...fitted);
    if (fhi - flo < 200) { const c = (flo + fhi) / 2; flo = c - 100; fhi = c + 100; }
    flo -= 60; fhi += 60;
    const xr = q => X0 + (q - flo) / (fhi - flo) * (X1 - X0), yr = e => (B0 + B1) / 2 - e / R * (B1 - B0) / 2;
    k.push(txt(X0, B0 - 14, 'residual ($)', C.muted, 13, 'start'), txt(X1, B1 + 36, 'fitted value ($)', C.muted, 13, 'end'));
    [-R / 2, R / 2].forEach(e => k.push(s('line', { x1: X0, x2: X1, y1: yr(e), y2: yr(e), stroke: C.line }), txt(X0 - 8, yr(e) + 4, sign(e), C.muted, 12, 'end')));
    k.push(s('line', { x1: X0, x2: X1, y1: yr(0), y2: yr(0), stroke: C.violet, 'stroke-width': 3 }), txt(X0 - 8, yr(0) + 4, '0', C.muted, 12, 'end'));
    [0, 1, 2].forEach(g => {
      const x = xr(fitted[4 * g]);
      k.push(txt(x, B1 + 18, Math.round(fitted[4 * g]), C.violet),
        s('line', { x1: x - 26 * F, x2: x + 26 * F, y1: yr(ga[g]), y2: yr(ga[g]), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
        txt(x + 30 * F, yr(ga[g]) + 4, sign(ga[g]), C.amber, 12, 'start', true));
    });
    res.forEach((e, i) => {
      const x = xr(fitted[i]) + off(i), col = e >= 0 ? C.green : C.pink;
      k.push(s('line', { x1: x, x2: x, y1: yr(0), y2: yr(e), stroke: col, 'stroke-width': 2.5 }));
      if (i === sel) k.push(s('circle', { cx: x, cy: yr(e), r: 12 * F, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      k.push(s('circle', { cx: x, cy: yr(e), r: 5 * F, fill: C.cyan }));
    });
    svg.replaceChildren(...k);

    // pattern in words
    const sg = ga.map(x => x > 5 ? 1 : x < -5 ? -1 : 0).join();
    note.textContent = sg === '1,-1,1' ? 'U shape: above, below, above. The data bends, and the straight line missed that curve.'
      : sg === '-1,1,-1' ? 'Upside-down U: below, above, below. The data bends the other way, and the line missed it.'
      : sg === '0,0,0' ? 'No pattern: in every group the residuals sit above and below zero. The line fits.'
      : 'Some groups lean above or below zero. Look for a pattern before you trust the line.';

    const fs = fitted[sel], rs = res[sel];
    fbox(box, [`model: ${model === 'line' ? 'straight line' : 'curved line'}`,
      `selected: ${AREA[sel]} m², rent ${v[sel]}`,
      `fitted value ≈ ${Math.round(fs)}`,
      [`residual = ${v[sel]} − ${Math.round(fs)} ≈ ${sign(rs)}`, rs >= 0 ? C.green : C.pink],
      `group averages: ${ga.map(sign).join(' / ')}`,
      [`average of all 12 residuals = ${fmt(avg)}`, C.amber]]);
    selLabel.textContent = `Selected: ${AREA[sel]} m², rent ${v[sel]}`;
    lineBtn.className = 'sim-btn ' + (model === 'line' ? 'go' : '');
    curveBtn.className = 'sim-btn ' + (model === 'curve' ? 'go' : '');
    chal.update({ model, ga, newCount });
  }
  draw();
  return () => {};
}

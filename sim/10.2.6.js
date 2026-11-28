// 10.2.6 Try it: from a log coefficient to a percent change.
// The learner sets the coefficient (one fixed jump on the log-rent scale) and the starting rents (drag a bar,
// or tap it and use −100 / +100), makes random rents, and can show the no-exp shortcut to see when it fails.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [1000, 1400], B0 = Math.log(1.1);
  let r = START.slice(), b = B0, sel = 0, trap = false, news = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', min: -0.5, max: 0.7, step: 0.005, value: 0.095, 'aria-label': 'coefficient', style: { flex: '1 1 12rem' } });
  const bLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const trapBtn = btn('Show the shortcut (no exp)', () => { trap = !trap; draw(); });
  slider.addEventListener('input', () => { b = +slider.value; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: one coefficient, one percent'),
    h('p', { class: 'sub' }, 'Both apartments get ten more square metres. On the log-rent scale the model adds the coefficient; in dollars that means multiplying the rent by exp(coefficient). Move the coefficient, or drag a bar to change a starting rent.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'coefficient'), slider, bLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−100', () => bump(-100)), btn('+100', () => bump(100)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random rents)', () => { r = r.map(() => rnd(50, 250) * 10); news++; draw(); }, 'go'),
          trapBtn,
          btn('Start again', () => { r = START.slice(); b = B0; slider.value = 0.095; trap = false; sel = 0; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const mult = () => Math.exp(b);
  const pct = () => (mult() - 1) * 100;
  const n3 = x => String(Math.round(x * 1000) / 1000).replace('-', '−');
  const p1 = x => String(Math.round(x * 10) / 10).replace('-', '−');
  const money = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const chal = challenges(ch, [
    { text: 'Set the coefficient so every rent rises by 20%.',
      check: st => Math.abs(st.pct - 20) <= 0.5,
      why: 'Yes! A coefficient of about 0.18 gives exp(0.18) ≈ 1.2: the same +20% for both, but different dollars.' },
    { text: 'Now make every rent fall by about 10%.',
      check: st => st.pct <= -9.5 && st.pct >= -10.5,
      why: 'Right: a multiplier of about 0.9 means a coefficient of about −0.1. A steady fall has a negative coefficient.' },
    { text: 'Show the shortcut, then find a coefficient where it misses the true percent by more than 10 points.',
      check: st => st.trap && st.gap > 10,
      why: 'Exactly: for small coefficients, coefficient × 100 is close, but for larger ones it is wrong. Always take exp first.' },
    { text: 'Press “New data” twice. Does one coefficient still give both apartments the same percent?',
      check: st => st.news >= 2,
      why: 'Always: the percent depends only on the coefficient. Bigger rents gain more dollars, but the same percent.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 54 : 64, X1 = VW - 10, BASE = 370, TOP = 60;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const bw = NARROW ? 46 : 70;
  const xs = i => VW * [0.24, 0.39, 0.63, 0.78][i];
  const maxv = () => Math.max(1000, ...r.map(v => v * Math.max(1, mult(), trap ? 1 + b : 1))) * 1.2;
  const unit = () => (BASE - TOP) / maxv();

  function bump(d) { r[sel] = Math.max(200, Math.min(3000, r[sel] + d)); draw(); }

  // drag a starting rent: pointer height sets it (the scale holds still while dragging)
  let dragging = -1, dragU = 1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    sel = p.x < VW / 2 ? 0 : 1; dragging = sel; dragU = unit();
    svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), room = (BASE - TOP) / dragU / Math.max(1, mult(), trap ? 1 + b : 1) / 1.1;
    r[dragging] = Math.max(200, Math.min(3000, room, Math.round((BASE - p.y) / dragU / 10) * 10));
    r[dragging] = Math.round(r[dragging] / 10) * 10;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; draw(); });

  const text = (x, y, str, fill, size, extra = {}) => s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': 'middle', 'font-family': 'Consolas', ...extra }, str);
  const bar = (x, v0, v1, u, fill, op = 0.82) => s('rect', { x: x - bw / 2, y: BASE - v1 * u, width: bw, height: Math.max(0, (v1 - v0) * u), fill, 'fill-opacity': op, rx: 2 });

  function draw() {
    const u = dragging >= 0 ? dragU : unit(), m = mult(), p = pct(), k = [];
    const topV = (BASE - TOP) / u, step = topV > 2600 ? 500 : 250;
    for (let g = 0; g <= topV; g += step) {
      const y = BASE - g * u;
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        text(X0 - 6, y + 4, money(g), C.muted, 12, { 'text-anchor': 'end' }));
    }
    k.push(text(VW / 2, 28, `each rent × ${n3(m)}  →  ${p >= 0 ? '+' : ''}${p1(p)}%`, p >= 0 ? C.amber : C.pink, 17, { 'font-weight': 700 }));
    r.forEach((v, a) => {
      const after = v * m, x0 = xs(2 * a), x1 = xs(2 * a + 1), diff = after - v;
      if (a === sel) k.push(s('rect', { x: x0 - bw / 2 - 10, y: TOP - 14, width: x1 - x0 + bw + 20, height: BASE - TOP + 14, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      k.push(bar(x0, 0, v, u, C.cyan), bar(x1, 0, Math.min(v, after), u, C.cyan));
      if (diff > 0) k.push(bar(x1, v, after, u, C.amber, 0.9));
      if (diff < 0) k.push(s('rect', { x: x1 - bw / 2, y: BASE - v * u, width: bw, height: -diff * u, fill: C.pink, 'fill-opacity': .12, stroke: C.pink, 'stroke-width': 2 }));
      const hi = Math.max(v, after);
      k.push(text(x0, BASE - v * u - 8, money(v), C.ink, 13),
        text(x1, BASE - hi * u - 8, money(after), C.ink, 13),
        text(x1, BASE - hi * u - 26, (diff >= 0 ? '+' : '−') + money(Math.abs(diff)), diff >= 0 ? C.amber : C.pink, 13, { 'font-weight': 700 }),
        text(x0, BASE + 18, 'now', C.muted, 12), text(x1, BASE + 18, '+10 m²', C.muted, 12),
        text((x0 + x1) / 2, BASE + 44, 'Apartment ' + (a + 1), C.cyan, 14, { 'font-weight': 700, 'font-family': 'Segoe UI, Arial' }));
      if (trap) {
        const ys = BASE - v * (1 + b) * u;
        k.push(s('line', { x1: x1 - bw / 2 - 6, x2: x1 + bw / 2 + 6, y1: ys, y2: ys, stroke: C.pink, 'stroke-width': 3, 'stroke-dasharray': '6 5' }),
          text(x1 + bw / 2 + 6, ys + 4, 'no exp', C.pink, 11, { 'text-anchor': 'start' }));
      }
    });
    svg.replaceChildren(...k);
    const lines = [`coefficient = ${n3(b)}`, `multiplier  = exp(${n3(b)}) = ${n3(m)}`,
      [`percent     = (${n3(m)} − 1) × 100 = ${p1(p)}%`, p >= 0 ? C.amber : C.pink]];
    if (trap) lines.push([`shortcut ✗  = ${n3(b)} × 100 = ${p1(b * 100)}%  (off by ${p1(Math.abs(p - b * 100))})`, C.pink]);
    r.forEach((v, a) => lines.push(`Apt ${a + 1}: ${money(v)} × ${n3(m)} = ${money(v * m)}  (${v * m >= v ? '+' : '−'}${money(Math.abs(v * m - v))})`));
    fbox(box, lines);
    note.textContent = b > 0.0001 ? 'Same percent for both apartments, but the bigger rent gains more dollars. The model only adds the coefficient on the log scale.'
      : b < -0.0001 ? 'A negative coefficient: every rent falls by the same percent.'
      : 'Coefficient 0: the multiplier is 1, so nothing changes.';
    bLabel.textContent = n3(b);
    selLabel.textContent = `Selected: Apartment ${sel + 1} ($${money(r[sel])})`;
    trapBtn.textContent = trap ? 'Hide the shortcut' : 'Show the shortcut (no exp)';
    chal.update({ pct: Math.round(p * 10) / 10, b, gap: Math.abs(p - b * 100), trap, news });
  }
  draw();
  return () => {};
}

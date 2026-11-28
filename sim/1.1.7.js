// 1.1.7 Try it: ratios and percentages. One cup per order; a filled cup is takeaway.
// The learner taps cups, adds or removes orders, makes random mornings, and sees the ratio,
// the fraction, the simpler fraction and the percentage (a square of 100 boxes) update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [true, false, true, false, true, false];   // the café table, orders 1-6
  let v = START.slice(), randoms = 0, tapsAt20 = 0;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: part, whole and percent'),
    h('p', { class: 'sub' }, 'Each cup is one order. Tap a cup to switch it between takeaway (filled) and staying (empty).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Add an order', () => { if (v.length < 30) { v.push(false); changed(); } }),
          btn('Remove an order', () => { if (v.length > 2) { v.pop(); changed(); } }),
          btn('New morning (random)', () => { const n = rnd(4, 30); v = Array.from({ length: n }, () => Math.random() < 0.5); randoms++; changed(); }, 'go'),
          btn('Start again', () => { v = START.slice(); changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const part = () => v.filter(Boolean).length;
  const pct = () => part() / v.length * 100;

  const chal = challenges(ch, [
    { text: 'Make exactly 25% of the orders takeaway.',
      check: st => Math.abs(st.pct - 25) < 1e-9,
      why: 'Yes: one order out of every four. A quarter of a hundred boxes is twenty-five.' },
    { text: 'Make 50% again, but with a different number of orders than six.',
      check: st => Math.abs(st.pct - 50) < 1e-9 && st.n !== 6,
      why: 'Right: a different whole, but still one half. The percentage stays fifty.' },
    { text: 'Make the ratio takeaway to stay exactly 1 to 2.',
      check: st => st.t > 0 && 2 * st.t === st.n - st.t,
      why: 'One takeaway for every two that stay. As a part of the whole, that is one out of three: about 33%.' },
    { text: 'Get to 20 orders, then tap one cup. Does the percent jump less than with six orders?',
      check: st => st.n >= 20 && st.tapsAt20 > 0,
      why: 'Yes: with twenty orders one cup moves the percent by five. With six, one cup moved it by about seventeen.' },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 520 : 420, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const PER = NARROW ? 10 : 15;         // cups per line
  let cupEls = [];

  function changed() { draw(); }
  function toggle(i) { v[i] = !v[i]; if (v.length >= 20) tapsAt20++; draw(); }

  function draw() {
    const n = v.length, t = part(), p = pct(), k = [];
    // cups
    const per = Math.min(PER, Math.max(NARROW ? 6 : 8, n)), RH = n <= per ? 84 : 62;
    const cw = (VW - 20) / per, cs = Math.min(50, cw * 0.62);
    v.forEach((on, i) => {
      const r = Math.floor(i / per), c = i % per;
      const cx = 10 + cw * (c + 0.5), cy = 44 + r * RH;
      const col = on ? C.amber : C.cyan;
      const g = s('g', { style: 'cursor:pointer' });
      g.append(s('rect', { x: cx - cw / 2 + 1, y: cy - RH / 2, width: cw - 2, height: RH, fill: 'transparent' }),
        s('polygon', { points: `${cx - cs / 2},${cy - cs * 0.55} ${cx + cs / 2},${cy - cs * 0.55} ${cx + cs * 0.35},${cy + cs * 0.6} ${cx - cs * 0.35},${cy + cs * 0.6}`,
          fill: on ? C.amber : 'none', 'fill-opacity': .85, stroke: col, 'stroke-width': 2.5 }),
        s('line', { x1: cx - cs * 0.58, x2: cx + cs * 0.58, y1: cy - cs * 0.65, y2: cy - cs * 0.65, stroke: col, 'stroke-width': 4 }));
      g.addEventListener('pointerdown', e => { e.preventDefault(); toggle(i); });
      k.push(g);
    });
    // 100-box square
    const rows = Math.ceil(n / per), top = 44 + rows * RH - RH / 2 + 14;
    const cell = NARROW ? Math.min(22, (VH - top - 100) / 10) : Math.min(26, (VH - top - 8) / 10);
    const gx = NARROW ? (VW - cell * 10) / 2 : 60, gy = top;
    const filled = Math.round(p);
    for (let j = 0; j < 100; j++) {
      const r = Math.floor(j / 10), c = j % 10, on = j < filled;
      k.push(s('rect', { x: gx + c * cell, y: gy + r * cell, width: cell * 0.84, height: cell * 0.84, rx: 1.5,
        fill: on ? C.amber : 'none', 'fill-opacity': .85, stroke: on ? C.amber : C.muted, 'stroke-width': 1 }));
    }
    const tx = NARROW ? 14 : gx + cell * 10 + 24, ty = NARROW ? gy + cell * 10 + 46 : gy + cell * 5;
    k.push(s('text', { x: tx, y: ty - 6 * F, fill: C.amber, 'font-size': 44 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(Math.round(p * 10) / 10) + '%'),
      s('text', { x: tx, y: ty + 24 * F, fill: C.ink, 'font-size': 19 * F, 'font-family': 'Segoe UI' }, `${t} out of ${n} orders`),
      s('text', { x: tx, y: ty + 48 * F, fill: C.muted, 'font-size': 18 * F, 'font-family': 'Segoe UI' }, Number.isInteger(p) ? `= ${p} boxes out of 100` : `≈ ${filled} boxes out of 100`));
    svg.replaceChildren(...k);

    const st = n - t, g1 = gcd(t, st) || 1, g2 = gcd(t, n) || 1;
    fbox(box, [
      `ratio    = takeaway : stay`,
      `         = ${t} : ${st}` + (g1 > 1 && t && st ? `  =  ${t / g1} : ${st / g1}` : ''),
      `fraction = part / whole`,
      `         = ${t} / ${n}` + (g2 > 1 && t ? `  =  ${t / g2} / ${n / g2}` : ''),
      `percent  = ${t} ÷ ${n} × 100`,
      [`         = ${Number.isInteger(p) ? p : '≈ ' + fmt(Math.round(p * 10) / 10)}%`, C.amber]]);
    note.textContent = n < 10
      ? `Only ${n} orders: one tap moves the percent by about ${fmt(Math.round(1000 / n) / 10)}. Always ask: out of how many?`
      : `${n} orders: one tap moves the percent by about ${fmt(Math.round(1000 / n) / 10)}. The bigger the whole, the smaller the jump.`;
    chal.update({ pct: p, n, t, tapsAt20, randoms });
  }
  draw();
  return () => {};
}

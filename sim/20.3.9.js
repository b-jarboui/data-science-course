// 20.3.9 Try it: quantization.
// The learner drags four weights along a number line (or taps one and uses −0.05 / +0.05), picks the bits per
// stored mark, and sees the shared scale, the marks, the rounding errors and the memory used update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [0.9, -0.4, 0.2, -0.7];
  let w = START.slice(), bits = 3, sel = 0, dataId = 0, random = false, viewR = null;
  const seen = new Map();   // random data set -> bit settings tried on it

  const svg = s('svg', { viewBox: '0 0 700 380' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const bitsLabel = h('span', { class: 'sim-note', style: { margin: 0, color: C.amber, fontWeight: 700 } });
  const slider = h('input', { type: 'range', min: 2, max: 8, step: 1, value: bits, 'aria-label': 'Bits per stored mark',
    oninput: e => { bits = +e.target.value; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: round weights to a coarse ruler'),
    h('p', { class: 'sub' }, 'Four weights share one ruler and one scale. Drag a weight along the line, or tap it and use −0.05 / +0.05. Choose how many bits each stored mark gets.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Bits per mark'), slider, bitsLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−0.05', () => bump(-1)), btn('+0.05', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Make weight 1 an outlier (3)', () => { w[0] = 3; sel = 0; draw(); }),
          btn('Start again', () => { w = START.slice(); bits = 3; slider.value = 3; sel = 0; random = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const f = x => Math.abs(x) < 0.005 ? '0' : fmt(Math.round(x * 1000) / 1000).replace('-', '−');
  function quant() {
    const q = 2 ** (bits - 1) - 1, big = Math.max(...w.map(Math.abs)), scale = big / q;
    const codes = w.map(x => scale ? Math.max(-q, Math.min(q, Math.sign(x) * Math.round(Math.abs(x) / scale))) : 0);
    const back = codes.map(c => c * scale);
    const err = w.map((x, i) => Math.abs(x - back[i]));
    return { q, big, scale, codes, back, err, total: err.reduce((a, b) => a + b, 0), store: 4 * bits + 16 };
  }

  const chal = challenges(ch, [
    { text: 'With 3 bits, drag the weights so that the total error is exactly 0.',
      check: st => st.bits === 3 && st.big > 0 && st.total < 1e-9,
      why: 'Every weight now sits exactly on a mark, so rounding moves nothing at all.' },
    { text: 'Press “Start again”. Get the total error below 0.1 with as few bits as possible.',
      check: st => st.start && st.bits === 5,
      why: '5 bits: marks −15 … 15, total error 0.06, for 4 × 5 + 16 = 36 bits. With 4 bits the error is still 0.13.' },
    { text: 'With 3 bits, press “Make weight 1 an outlier (3)”. Watch what happens to the other weights.',
      check: st => st.bits === 3 && st.big >= 2,
      why: 'The scale grows to fit the big weight, so the marks spread out and the small weights round to 0 or ±1: their errors grow.' },
    { text: 'Press “New data” and compare 2 bits with 3 bits. Do it for two data sets: is 3 bits ever worse?',
      check: st => st.compared >= 2,
      why: 'Never: the 3-bit ruler keeps the 2-bit marks (0 and ± the largest weight) and adds more, so no weight ends up farther away.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, VH = 380, F = NARROW ? 1.25 : 1;
  const X0 = 30, X1 = VW - 30, LY = 130;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const range = () => viewR || (Math.max(...w.map(Math.abs)) > 1.2 ? 3.3 : 1.2);
  const xOf = (v, R) => X0 + (v + R) / (2 * R) * (X1 - X0);
  const txt = (x, y, str, size, fill, extra = {}) => s('text', { x, y, fill, 'font-size': size * F, 'font-weight': 700,
    'text-anchor': 'middle', 'font-family': 'Consolas', ...extra }, str);

  function newData() {
    do { w = w.map(() => rnd(-18, 18) / 20); } while (Math.max(...w.map(Math.abs)) === 0);
    dataId++; random = true; sel = 0; draw();
  }
  function bump(d) { w[sel] = Math.max(-3, Math.min(3, Math.round(w[sel] * 20 + d) / 20)); draw(); }

  // drag a weight along the line
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), R = range();
    if (Math.abs(p.y - LY) > 90) return;
    let best = -1, bd = 30 * F;
    w.forEach((v, i) => { const d = Math.abs(xOf(v, R) - p.x); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    sel = best; dragging = best; viewR = R; svg.setPointerCapture(e.pointerId); draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e), R = viewR, v = (p.x - X0) / (X1 - X0) * 2 * R - R;
    w[dragging] = Math.max(-R, Math.min(R, Math.round(v * 20) / 20));
    draw();
  });
  svg.addEventListener('pointerup', () => { dragging = -1; viewR = null; draw(); });

  function draw() {
    const R = range(), Q = quant(), k = [];
    // number line
    k.push(s('line', { x1: X0, x2: X1, y1: LY, y2: LY, stroke: C.muted, 'stroke-width': 3 }));
    for (const v of R > 2 ? [-3, 0, 3] : [-1, 0, 1]) {
      const x = xOf(v, R);
      k.push(s('line', { x1: x, x2: x, y1: LY - 5, y2: LY + 5, stroke: C.muted }), txt(x, LY + 24, f(v), 12, C.muted, { 'font-weight': 400 }));
    }
    // the ruler: marks −q … q, one scale apart
    const gap = Q.scale * (X1 - X0) / (2 * R), labelled = Q.scale > 0 && gap >= 34 * F;
    for (let c = -Q.q; c <= Q.q && Q.scale > 0; c++) {
      const x = xOf(c * Q.scale, R);
      k.push(s('line', { x1: x, x2: x, y1: LY - 11, y2: LY + 11, stroke: C.amber, 'stroke-width': 2.5 }));
      if (labelled || Math.abs(c) === Q.q || c === 0) k.push(txt(x, LY + 48, f(c), 12, C.amber));
      if (labelled) k.push(txt(x, LY + 70, f(c * Q.scale), 11, C.ink, { 'font-weight': 400 }));
    }
    // rounding errors (pink bars), weights (cyan) and rounded values (amber)
    w.forEach((v, i) => {
      if (Q.err[i] > 1e-9) k.push(s('line', { x1: xOf(v, R), x2: xOf(Q.back[i], R), y1: LY - 18, y2: LY - 18, stroke: C.pink, 'stroke-width': 5, 'stroke-linecap': 'round' }));
    });
    k.push(s('circle', { cx: xOf(w[sel], R), cy: LY, r: 16, fill: '#ffffff', 'fill-opacity': .08, stroke: C.ink, 'stroke-opacity': .4 }));
    w.forEach(v => k.push(s('circle', { cx: xOf(v, R), cy: LY, r: 9, fill: Math.abs(v) > 1.2 ? C.pink : C.cyan })));
    Q.back.forEach(b => k.push(s('circle', { cx: xOf(b, R), cy: LY, r: 5, fill: C.amber })));
    const order = w.map((_, i) => i).sort((a, b) => w[a] - w[b]);
    let lastX = -1e9, tier = 0;
    order.forEach(i => {
      const x = xOf(w[i], R);
      tier = x - lastX < 46 * F ? (tier + 1) % 3 : 0; lastX = x;
      k.push(txt(x, LY - 34 - tier * 20 * F, f(w[i]), 13, i === sel ? C.ink : (Math.abs(w[i]) > 1.2 ? C.pink : C.cyan)));
    });
    // memory: 16 slots per weight, only `bits` of them used; 16 bits for the shared scale
    const cp = NARROW ? 13 : 16, mx = X0 + 50 * F, my = 232;
    for (let r = 0; r < 5; r++) {
      const y = my + r * 24;
      k.push(txt(mx - 10, y + 5, r < 4 ? f(w[r]) : 'scale', 12, r < 4 ? C.muted : C.violet, { 'text-anchor': 'end' }));
      for (let j = 0; j < 16; j++) {
        const used = r === 4 || j < bits;
        k.push(s('rect', { x: mx + j * cp, y: y - 7, width: cp - 3, height: 14, rx: 2, fill: used ? (r === 4 ? C.violet : C.amber) : 'none',
          'fill-opacity': .85, stroke: used ? 'none' : C.line }));
      }
      k.push(txt(mx + 16 * cp + 10, y + 5, r < 4 ? `mark ${f(Q.codes[r])}` : '16 bits', 12, r < 4 ? C.amber : C.muted, { 'text-anchor': 'start' }));
    }
    k.push(txt(VW / 2, my + 5 * 24 + 14, `${Q.store} bits stored (was 64)`, 14, C.amber));
    svg.replaceChildren(...k);

    fbox(box, [
      `bits  = ${bits} → marks −${Q.q} … ${Q.q}`,
      `scale = ${f(Q.big)} ÷ ${Q.q} = ${f(Q.scale)}`,
      `marks = ${Q.codes.map(f).join(', ')}`,
      `back  = mark × scale = ${Q.back.map(f).join(', ')}`,
      [`error = ${Q.err.map(f).join(' + ')} = ${f(Q.total)}`, C.pink],
      [`store = 4 × ${bits} + 16 = ${Q.store} bits (was 64)`, C.amber]]);
    note.textContent = Q.big > 1.2
      ? 'One large weight stretches the scale: the marks spread out, so the small weights round to 0 or to a far mark.'
      : 'Each weight is stored as a whole-number mark. Mark × scale gives back an approximate weight (amber); the pink bar is its rounding error.';
    bitsLabel.textContent = `${bits} bits → ${2 * Q.q + 1} marks (${2 ** bits} patterns)`;
    selLabel.textContent = `Selected: weight ${sel + 1} (${f(w[sel])})`;

    if (random) { if (!seen.has(dataId)) seen.set(dataId, new Set()); seen.get(dataId).add(bits); }
    const compared = [...seen.values()].filter(b => b.has(2) && b.has(3)).length;
    chal.update({ bits, total: Q.total, big: Q.big, start: w.join() === START.join(), compared });
  }
  draw();
  return () => { dragging = -1; };
}

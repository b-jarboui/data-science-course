// 21.3.1 Try it: vision tokens.
// The learner changes the picture size and the patch size, taps a patch (or a token) to see its tag and its
// place in the row the model reads, makes random pictures, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const ORANGE = '#fb923c', GROUND = '#1a2346';
  const N = x => x.toLocaleString('en-US');
  const SIZES = [20, 25, 50, 100];
  const WORDS = ['where', 'is', 'the', 'library', '?'];
  // the campus map: building centre and size as fractions of the picture (y up); patches 1..6 as in the lesson
  const CAMPUS = [
    { name: 'pond', color: C.violet, x: 50, y: 160, w: 52, h: 52, round: true },
    { name: 'library', color: C.cyan, x: 150, y: 166, w: 56, h: 38 },
    { name: 'lab building', color: C.green, x: 250, y: 164, w: 60, h: 42 },
    { name: 'cafeteria', color: ORANGE, x: 50, y: 70, w: 56, h: 36 },
    { name: 'main gate', color: C.ink, x: 150, y: 9, w: 36, h: 18 },
    { name: 'sports hall', color: C.pink, x: 250, y: 70, w: 64, h: 42 },
  ].map(b => ({ ...b, x: b.x / 300, y: b.y / 200, w: b.w / 300, h: b.h / 200 }));
  let W = 300, H = 200, p = 100, bld = CAMPUS, campus = true, sel = -1, randoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const wLab = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '9.5rem' } });
  const hLab = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '9.5rem' } });
  const wIn = h('input', { type: 'range', min: 100, max: 600, step: 100, value: W, 'aria-label': 'Picture width', oninput: () => { W = +wIn.value; sel = -1; draw(); } });
  const hIn = h('input', { type: 'range', min: 100, max: 400, step: 100, value: H, 'aria-label': 'Picture height', oninput: () => { H = +hIn.value; sel = -1; draw(); } });
  const sizeRow = h('div', { class: 'sim-row', style: { alignItems: 'center' } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: cut a picture into vision tokens'),
    h('p', { class: 'sub' }, 'Change the picture size and the patch size. Tap a patch, or a token in the row, to see its tag and where it sits in the row the model reads.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('label', { class: 'sim-row', style: { alignItems: 'center' } }, wLab, wIn),
        h('label', { class: 'sim-row', style: { alignItems: 'center' } }, hLab, hIn),
        sizeRow,
        h('div', { class: 'sim-row' },
          btn('New data (random picture)', newData, 'go'),
          btn('Back to the campus map', () => { W = 300; H = 200; p = 100; bld = CAMPUS; campus = true; sel = -1; sync(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'On the campus map (300 × 200, 100 px patches), tap the library patch. What is its tag?',
      check: st => st.campus && st.W === 300 && st.H === 200 && st.p === 100 && st.sel === 1,
      why: 'Row 1, column 2: it is the 2nd token in the row, right after the pond.' },
    { text: 'Make the campus map (300 × 200) give exactly 24 vision tokens.',
      check: st => st.W === 300 && st.H === 200 && st.n === 24,
      why: 'Patches of 50 px: 6 across × 4 down = 24. Half the side gives four times the tokens.' },
    { text: 'With 50-pixel patches, set the picture size so it gives exactly 8 vision tokens.',
      check: st => st.p === 50 && st.n === 8,
      why: 'For example 200 × 100: 4 across × 2 down = 8. Width ÷ patch size, times height ÷ patch size.' },
    { text: 'Press “New data” twice. Is the count always (W ÷ p) × (H ÷ p)?',
      check: st => st.randoms >= 2,
      why: 'Always: the patches tile the picture, so the count is how many fit across times how many fit down.' },
  ]);

  function newData() {
    W = rnd(2, 6) * 100; H = rnd(1, 4) * 100; p = SIZES[rnd(0, SIZES.length - 1)];
    const colors = [C.cyan, C.green, C.violet, C.pink, ORANGE, C.ink];
    bld = Array.from({ length: rnd(4, 7) }, () => {
      const w = rnd(8, 22) / 100, hh = rnd(10, 30) / 100;
      return { color: colors[rnd(0, colors.length - 1)], x: w / 2 + Math.random() * (1 - w), y: hh / 2 + Math.random() * (1 - hh), w, h: hh, round: Math.random() < 0.25 };
    });
    campus = false; sel = -1; randoms++; sync();
  }
  function sync() { wIn.value = W; hIn.value = H; draw(); }

  // which building covers most of patch i (reading order), if any
  function cover(i) {
    const cols = W / p, r = Math.floor(i / cols), c = i % cols;
    const x0 = c * p, x1 = x0 + p, y1 = H - r * p, y0 = y1 - p;
    let best = null, area = 0.04 * p * p;
    for (const b of bld) {
      const bx0 = (b.x - b.w / 2) * W, bx1 = (b.x + b.w / 2) * W, by0 = (b.y - b.h / 2) * H, by1 = (b.y + b.h / 2) * H;
      const a = Math.max(0, Math.min(x1, bx1) - Math.max(x0, bx0)) * Math.max(0, Math.min(y1, by1) - Math.max(y0, by0));
      if (a > area) { area = a; best = b; }
    }
    return best;
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, VH = NARROW ? 470 : 440, F = NARROW ? 1.2 : 1, PH = NARROW ? 220 : 250;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  let G = null;

  // tap a patch on the picture, or a token in the row
  const toSvg = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    if (!G) return;
    const q = toSvg(e), c = Math.floor((q.x - G.x0) / G.ps), r = Math.floor((q.y - G.y0) / G.ps);
    let i = -1;
    if (c >= 0 && c < G.cols && r >= 0 && r < G.rows) i = r * G.cols + c;
    else {
      const tc = Math.floor((q.x - G.tx0) / G.cs), tr = Math.floor((q.y - G.top) / G.cs);
      if (tc >= 0 && tc < G.per && tr >= 0) i = tr * G.per + tc;
    }
    if (i >= 0 && i < G.n) { sel = i; draw(); }
  });

  function draw() {
    const cols = W / p, rows = H / p, n = cols * rows;
    if (sel >= n) sel = -1;
    const k = Math.min((VW - 20) / W, PH / H), pw = W * k, ph = H * k, x0 = (VW - pw) / 2, y0 = 8, ps = p * k;
    const X = x => x0 + x * pw, Y = y => y0 + (1 - y) * ph;   // fractions of the picture -> svg
    const e = [s('rect', { x: x0, y: y0, width: pw, height: ph, fill: '#111a36', stroke: C.muted, rx: 4 })];
    for (const b of bld) {
      const bw = b.w * pw, bh = b.h * ph, cx = X(b.x), cy = Y(b.y), st = { fill: b.color, 'fill-opacity': .6, stroke: b.color, 'stroke-width': 1.5 };
      e.push(b.round ? s('ellipse', { cx, cy, rx: bw / 2, ry: bh / 2, ...st }) : s('rect', { x: cx - bw / 2, y: cy - bh / 2, width: bw, height: bh, rx: 3, ...st }));
    }
    const cutLine = { stroke: C.amber, 'stroke-opacity': .75, 'stroke-dasharray': '5 4' };
    for (let c = 1; c < cols; c++) e.push(s('line', { x1: x0 + c * ps, x2: x0 + c * ps, y1: y0, y2: y0 + ph, ...cutLine }));
    for (let r = 1; r < rows; r++) e.push(s('line', { x1: x0, x2: x0 + pw, y1: y0 + r * ps, y2: y0 + r * ps, ...cutLine }));
    if (ps >= 26) for (let i = 0; i < n; i++)
      e.push(s('text', { x: x0 + (i % cols) * ps + 4, y: y0 + Math.floor(i / cols) * ps + 13 * F, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, i + 1));
    if (sel >= 0) e.push(s('rect', { x: x0 + (sel % cols) * ps, y: y0 + Math.floor(sel / cols) * ps, width: ps, height: ps, fill: 'none', stroke: C.amber, 'stroke-width': 3 }));

    // the row the model reads: vision tokens in reading order, a gap, then the 5 question tokens
    const top = y0 + ph + 36, AW = VW - 20, AH = VH - top - 6, total = n + 6;
    let cs = 36;
    while (cs > 4 && Math.ceil(total / Math.floor(AW / cs)) * cs > AH) cs--;
    const per = Math.floor(AW / cs), tx0 = (VW - Math.min(total, per) * cs) / 2;
    const at = i => [tx0 + (i % per) * cs, top + Math.floor(i / per) * cs];
    e.push(s('text', { x: VW / 2, y: top - 12, fill: C.ink, 'font-size': 14 * F, 'text-anchor': 'middle' }, `${n} vision tokens + 5 question tokens`));
    for (let i = 0; i < n; i++) {
      const [x, y] = at(i), b = cover(i);
      e.push(s('rect', { x: x + 1, y: y + 1, width: cs - 2, height: cs - 2, rx: 2, fill: b ? b.color : GROUND, 'fill-opacity': b ? .75 : 1,
        stroke: i === sel ? C.amber : C.line, 'stroke-width': i === sel ? 3 : 1 }));
    }
    WORDS.forEach((w, j) => {
      const [x, y] = at(n + 1 + j);
      e.push(s('rect', { x: x + 1, y: y + 1, width: cs - 2, height: cs - 2, rx: 2, fill: C.bg, stroke: C.amber }));
      if (cs >= 30) e.push(s('text', { x: x + cs / 2, y: y + cs / 2 + 4, fill: C.amber, 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'Consolas' }, w.slice(0, 3)));
    });
    svg.replaceChildren(...e);
    G = { x0, y0, ps, cols, rows, n, tx0, top, cs, per };

    wLab.textContent = `Width W: ${W} px`;
    hLab.textContent = `Height H: ${H} px`;
    sizeRow.replaceChildren(h('span', { class: 'sim-note', style: { margin: 0 } }, 'Patch size p:'),
      ...SIZES.map(z => btn(`${z} px`, () => { p = z; sel = -1; draw(); }, z === p ? 'go' : '')));
    const r = Math.floor(sel / cols) + 1, c = sel % cols + 1, b = sel >= 0 ? cover(sel) : null;
    fbox(box, [
      'tokens = (W ÷ p) × (H ÷ p)',
      `       = (${W} ÷ ${p}) × (${H} ÷ ${p})`,
      [`       = ${cols} × ${rows} = ${n} vision tokens`, C.amber],
      `1 patch = ${p} × ${p} = ${N(p * p)} pixels`,
      `        × 3 = ${N(3 * p * p)} numbers → 1 vector`,
      [`row = ${n} + 5 = ${n + 5} tokens`, C.cyan],
      sel >= 0 ? [`patch ${sel + 1}: tag (row ${r}, column ${c})${b && campus ? ' · ' + b.name : ''}`, C.green] : ['tap a patch to see its tag', C.muted],
    ]);
    const k100 = 100 / p;
    note.textContent = p < 100
      ? `Patches ${k100} times smaller than 100 px give ${k100 * k100} times as many tokens: finer detail, but more work for the model.`
      : 'Big patches: few tokens, but a small detail gets squeezed into one vector with everything around it.';
    chal.update({ campus, W, H, p, n, sel, randoms });
  }
  draw();
  return () => {};
}

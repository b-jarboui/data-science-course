// 14.4.7 Try it: collaborative filtering.
// The learner taps rating boxes (or uses the star buttons), sees every reader's gaps and mean gap to Ana,
// the closest reader and the predictions for Ana, makes random bookshops, and solves challenges the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const COL = { Ana: C.cyan, Ben: '#60a5fa', Cara: '#fb923c', Dan: C.violet,
    Trail: C.green, River: '#2dd4bf', Clues: C.amber, Castle: C.violet, Island: '#fde047' };
  const READERS = ['Ana', 'Ben', 'Cara', 'Dan'];
  const BOOKS = ['Trail', 'River', 'Clues', 'Castle', 'Island'];
  // Fixed Chapter 14.4 ratings (null = not rated, never zero)
  const START = [
    [4, null, 2, null, null],
    [4, 5, 2, 1, null],
    [2, 1, 4, 5, null],
    [2, 2, 4, 4, null],
  ];
  let R = START.map(r => r.slice()), sel = [1, 1], randoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 370' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: readers with similar tastes'),
    h('p', { class: 'sub' }, 'Tap a box to choose it, tap again to add a star (— means not rated). The sim compares each reader with Ana on the books they both rated, finds the reader with the smallest mean gap, and uses that reader’s ratings as predictions for Ana.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 ★', () => bump(-1)), btn('+1 ★', () => bump(1)), btn('Not rated', () => setSel(null)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Start again', () => { R = START.map(r => r.slice()); sel = [1, 1]; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Change some ratings so that Cara becomes the closest reader to Ana.',
      check: st => st.near === 'Cara' && st.ties === 1,
      why: 'Yes! Cara’s ratings now sit nearest to Ana’s on the shared books, so Cara has the smallest mean gap and gives the predictions.' },
    { text: 'Keep Ben as the closest reader, but make Castle Ana’s first recommendation.',
      check: st => st.near === 'Ben' && st.ties === 1 && st.top === 'Castle',
      why: 'Right: the predictions are copied from the closest reader, so changing Ben’s ratings changes what Ana gets.' },
    { text: 'Give Ana a rating for River, so that Ana and Ben share three rated books.',
      check: st => st.sharedBen === 3,
      why: 'Now the mean gap uses three books. More shared books give more evidence about similar tastes.' },
    { text: 'Press “New data” twice. Does the closest reader always have the smallest mean gap?',
      check: st => st.randoms >= 2,
      why: 'Always: compare only shared books, average the gap sizes, and the smallest mean gap is the closest reader.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.1 : 1;
  const X0 = 6, NW = NARROW ? 62 : 92, GW = NARROW ? 62 : 100, CW = (VW - 2 * X0 - NW - GW) / 5;
  const TOP = 14, HH = 40, RH = NARROW ? 58 : 54, BOT = TOP + HH + 4 * RH, VH = BOT + 104;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const cx = c => X0 + NW + (c + 0.5) * CW, ry = r => TOP + HH + (r + 0.5) * RH, GX = X0 + NW + 5 * CW + GW / 2;
  const r3 = x => Math.round(x * 1000) / 1000;

  function analyse() {
    const ana = R[0];
    const rows = [1, 2, 3].map(r => {
      const shared = BOOKS.map((_, c) => c).filter(c => ana[c] != null && R[r][c] != null);
      const gaps = shared.map(c => Math.abs(ana[c] - R[r][c]));
      const sum = gaps.reduce((a, b) => a + b, 0);
      return { r, shared, gaps, sum, mean: shared.length ? r3(sum / shared.length) : null };
    });
    const ok = rows.filter(x => x.mean != null);
    const best = ok.length ? Math.min(...ok.map(x => x.mean)) : null;
    const tied = ok.filter(x => x.mean === best);
    const near = tied[0] || null;
    const preds = BOOKS.map((_, c) => ana[c] == null && near && R[near.r][c] != null ? R[near.r][c] : null);
    const order = preds.map((p, c) => ({ c, p })).filter(x => x.p != null).sort((a, b) => b.p - a.p || a.c - b.c);
    return { rows, near, tied, preds, order };
  }

  function setSel(v) { R[sel[0]][sel[1]] = v; draw(); }
  function bump(d) {
    const v = R[sel[0]][sel[1]];
    if (v == null) { if (d > 0) setSel(1); return; }
    setSel(Math.max(1, Math.min(5, v + d)));
  }
  function cycle() { const v = R[sel[0]][sel[1]]; setSel(v == null ? 1 : v === 5 ? null : v + 1); }
  function newData() {
    const ana = [null, null, null, null, null];
    const picks = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, rnd(2, 3));
    picks.forEach(c => { ana[c] = rnd(1, 5); });
    R = [ana, ...[1, 2, 3].map(() => BOOKS.map((_, c) =>
      c === 4 ? (Math.random() < 0.3 ? rnd(1, 5) : null) : (Math.random() < 0.15 ? null : rnd(1, 5))))];
    randoms++;
    draw();
  }

  // tap a box: first tap selects it, the next tap adds a star (5 → not rated)
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), c = Math.floor((p.x - X0 - NW) / CW), r = Math.floor((p.y - TOP - HH) / RH);
    if (c < 0 || c > 4 || r < 0 || r > 3) return;
    if (sel[0] === r && sel[1] === c) cycle(); else { sel = [r, c]; draw(); }
  });

  const txt = (x, y, str, fill, size, extra = {}) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace', ...extra }, str);

  function draw() {
    const A = analyse(), k = [];
    // table card
    k.push(s('rect', { x: X0, y: TOP, width: NW + 5 * CW, height: HH + 4 * RH, rx: 10, fill: C.card, stroke: C.line, 'stroke-width': 2 }));
    // Ana's rated columns: the only books used for the comparison
    BOOKS.forEach((b, c) => {
      if (R[0][c] != null) k.push(s('rect', { x: X0 + NW + c * CW + 2, y: TOP + 2, width: CW - 4, height: HH + 4 * RH - 4, rx: 6, fill: C.amber, 'fill-opacity': .07, stroke: C.amber, 'stroke-opacity': .6 }));
      k.push(s('rect', { x: X0 + NW + c * CW + 6, y: TOP + 4, width: CW - 12, height: 3, fill: COL[b] }),
        txt(cx(c), TOP + 27, b, COL[b], NARROW ? 12 : 15, { 'font-weight': 700, 'font-family': '"Segoe UI", Arial, sans-serif' }));
    });
    for (let r = 0; r <= 4; r++) k.push(s('line', { x1: X0, x2: X0 + NW + 5 * CW, y1: TOP + HH + r * RH, y2: TOP + HH + r * RH, stroke: C.line }));
    for (let c = 0; c <= 5; c++) k.push(s('line', { x1: X0 + NW + c * CW, x2: X0 + NW + c * CW, y1: TOP, y2: BOT, stroke: C.line }));
    // closest reader row
    if (A.near) k.push(s('rect', { x: X0 + 3, y: TOP + HH + A.near.r * RH + 3, width: NW + 5 * CW - 6, height: RH - 6, rx: 8, fill: 'none', stroke: C.green, 'stroke-width': 2.5 }));
    // mean gap column
    k.push(s('rect', { x: GX - GW / 2 + 4, y: TOP, width: GW - 8, height: HH + 4 * RH, rx: 10, fill: C.card, stroke: C.amber, 'stroke-opacity': .7 }),
      txt(GX, TOP + 27, 'mean gap', C.amber, NARROW ? 11 : 14, { 'font-weight': 700 }));
    READERS.forEach((name, r) => {
      k.push(txt(X0 + NW / 2, ry(r) + 5, name, COL[name], NARROW ? 13 : 16, { 'font-weight': 700, 'font-family': '"Segoe UI", Arial, sans-serif' }));
      BOOKS.forEach((_, c) => {
        const v = R[r][c], pred = r === 0 ? A.preds[c] : null;
        if (sel[0] === r && sel[1] === c) k.push(s('rect', { x: X0 + NW + c * CW + 4, y: TOP + HH + r * RH + 5, width: CW - 8, height: RH - 10, rx: 6, fill: '#ffffff', 'fill-opacity': .06, stroke: C.ink, 'stroke-width': 1.5 }));
        if (v != null) k.push(txt(cx(c), ry(r) + 6, `${v}★`, C.ink, NARROW ? 15 : 18, { 'font-weight': 700 }));
        else if (pred != null) k.push(txt(cx(c), ry(r) + 2, `${pred}★`, C.green, NARROW ? 14 : 17, { 'font-weight': 700 }),
          txt(cx(c), ry(r) + 18, 'guess', C.green, NARROW ? 9 : 11));
        else k.push(txt(cx(c), ry(r) + 6, '—', C.muted, NARROW ? 15 : 18));
      });
      const row = A.rows.find(x => x.r === r);
      const m = r === 0 ? '' : row.mean == null ? 'none' : fmt(row.mean);
      const col = row && A.near && row.mean === A.near.mean ? C.green : C.amber;
      k.push(txt(GX, ry(r) + 6, m, row && row.mean == null ? C.muted : col, NARROW ? 14 : 18, { 'font-weight': 700 }));
    });
    // result lines under the table
    const L1 = A.near ? `Closest reader: ${READERS[A.near.r]} (mean gap ${fmt(A.near.mean)})` : 'No reader shares a rated book with Ana';
    const L2 = A.order.length ? 'Recommend: ' + A.order.map((x, i) => `${i + 1}. ${BOOKS[x.c]} ${x.p}★`).join('  ') : 'Recommend: nothing to predict';
    const missing = A.near ? BOOKS.filter((_, c) => R[0][c] == null && A.preds[c] == null) : [];
    const L3 = missing.length ? `No prediction: ${missing.join(', ')} (${READERS[A.near.r]} has not rated it)` : '';
    k.push(txt(VW / 2, BOT + 30, L1, A.near ? C.green : C.pink, NARROW ? 13 : 16, { 'font-weight': 700 }),
      txt(VW / 2, BOT + 58, L2, C.ink, NARROW ? 12 : 15),
      txt(VW / 2, BOT + 84, L3, C.pink, NARROW ? 11 : 13));
    svg.replaceChildren(...k);

    // formula box: every reader's gaps, sum and mean gap
    const lines = [['mean gap = sum of gaps ÷ shared books', C.muted]];
    A.rows.forEach(x => {
      const nm = READERS[x.r].padEnd(4);
      if (x.mean == null) lines.push([`${nm}: no shared books`, C.muted]);
      else lines.push([`${nm}: (${x.gaps.join(' + ')}) ÷ ${x.shared.length} = ${fmt(x.mean)}`, A.near && x.r === A.near.r ? C.green : C.ink]);
    });
    if (A.near) lines.push([`closest: ${READERS[A.near.r]}`, C.green]);
    fbox(box, lines);
    note.textContent = A.tied.length > 1
      ? `Tie: ${A.tied.map(x => READERS[x.r]).join(' and ')} have the same mean gap. The sim uses the first one, ${READERS[A.near.r]}.`
      : 'A gap is the size of the difference between two ratings. Only books that both readers rated are compared. Empty boxes are unknown, not zero.';
    const v = R[sel[0]][sel[1]];
    selLabel.textContent = `Selected: ${READERS[sel[0]]} · ${BOOKS[sel[1]]} (${v == null ? 'not rated' : v + '★'})`;
    const ben = A.rows.find(x => x.r === 1);
    chal.update({ near: A.near ? READERS[A.near.r] : null, ties: A.tied.length, top: A.order.length ? BOOKS[A.order[0].c] : null,
      sharedBen: ben.shared.length, randoms });
  }
  draw();
  return () => {};
}

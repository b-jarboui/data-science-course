// 3.1.6 Try it: joining sales to the catalog.
// The learner taps book codes in the sales table, adds or removes catalog rows, switches between a
// left join and an inner join, makes random data, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const BOOKS = { B1: ['Garden Guide', 'gardening'], B2: ['Star Atlas', 'science'], B3: ['Easy Soups', 'cooking'],
    B4: ['Sea Stories', 'fiction'], B5: ['Bird Songs', 'nature'] };
  const CODES = Object.keys(BOOKS);
  const START = [[101, 'B1', 20], [101, 'B2', 20], [102, 'B3', 15], [103, 'B2', 20], [103, 'B3', 30], [104, 'B4', 25]];
  const START_CAT = ['B1', 'B2', 'B3'];
  let sales = START.map(r => r.slice()), cat = new Set(START_CAT), mode = 'left', leftNew = 0;

  const svg = s('svg', {});
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const leftBtn = btn('Left join', () => { mode = 'left'; draw(); });
  const innerBtn = btn('Inner join', () => { mode = 'inner'; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: join the sales to the catalog'),
    h('p', { class: 'sub' }, 'Tap a book code in the sales table to change it. Tap a catalog row to add or remove that book. Then compare the left join and the inner join.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, leftBtn, innerBtn),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Add a sale', () => { if (sales.length < MAXR) { const last = sales[sales.length - 1]; sales.push([(last ? last[0] : 100) + 1, CODES[rnd(0, 4)], rnd(2, 8) * 5]); draw(); } }),
          btn('Remove a sale', () => { if (sales.length > 2) { sales.pop(); draw(); } }),
          btn('Start again', () => { sales = START.map(r => r.slice()); cat = new Set(START_CAT); draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Switch to the inner join. Then make it keep every sale.',
      check: st => st.mode === 'inner' && st.out === st.n,
      why: 'Right: when every book code finds its catalog row, the inner join has nothing to drop.' },
    { text: 'Use the left join and make exactly 2 rows with an empty title.',
      check: st => st.mode === 'left' && st.empty === 2,
      why: 'Yes: two sales point to books the catalog does not have, so the left join keeps them with empty cells (NULL).' },
    { text: 'With the inner join, make the total lose more than half of the money.',
      check: st => st.mode === 'inner' && st.totOut < st.totIn / 2,
      why: 'See how much vanished, with no warning? That is why you compare totals before and after a join.' },
    { text: 'Use the left join and press “New data” 3 times. Does the number of rows ever change?',
      check: st => st.leftNew >= 3,
      why: 'Never: with one catalog row per book, a left join gives exactly one row out for each sale in.' },
  ]);

  // geometry: laptop = sales left, catalog right; phone = catalog on top, title/kind columns lined up
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const RH = 32, MAXR = 8;
  const SW = NARROW ? [50, 44, 62, 128, 96] : [64, 52, 76, 136, 104];
  const SX = 10, SY = NARROW ? 254 : 30;
  const CW = NARROW ? [44, 128, 96] : [52, 124, 84];
  const CX = NARROW ? SX + SW[0] + SW[1] + SW[2] - CW[0] : 470, CY = NARROW ? 26 : 30;
  const VW = NARROW ? 400 : 740, VH = SY + (MAXR + 1) * RH + 10;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const xs = (x0, ws, i) => x0 + ws.slice(0, i).reduce((a, b) => a + b, 0);
  const SANS = 'Segoe UI, Arial, sans-serif', MONO = 'Consolas, monospace';

  function newData() {
    const n = rnd(4, 8);
    let order = 100 + rnd(1, 5);
    sales = Array.from({ length: n }, (_, i) => { if (i > 0 && Math.random() < 0.6) order++; return [order, CODES[rnd(0, 4)], rnd(2, 8) * 5]; });
    cat = new Set(CODES.filter(() => Math.random() < 0.65));
    if (!cat.size) cat.add(CODES[rnd(0, 4)]);
    if (mode === 'left') leftNew++;
    draw();
  }

  function cellEl(x, y, w, txt, color, o = {}) {
    const g = s('g', { style: o.onTap ? 'cursor:pointer' : null });
    g.append(s('rect', { x: x + 1, y: y + 1, width: w - 2, height: RH - 2, rx: 3, fill: color,
      'fill-opacity': o.head ? 0.22 : (o.fill ?? 0.1), stroke: color, 'stroke-opacity': o.dim ? 0.35 : 0.9,
      'stroke-dasharray': o.dash ? '5 4' : null }));
    if (txt !== '') g.append(s('text', { x: x + w / 2, y: y + RH / 2 + 5, fill: color, 'fill-opacity': o.dim ? 0.4 : 1,
      'font-size': o.head ? 13 : (o.small ? 12.5 : 14), 'font-weight': o.head ? 700 : 400, 'text-anchor': 'middle',
      'font-family': o.mono ? MONO : SANS }, String(txt)));
    if (o.onTap) g.addEventListener('click', o.onTap);
    return g;
  }
  const label = (txt, x, y, color) => s('text', { x, y, fill: color, 'font-size': 15, 'font-weight': 700, 'font-family': SANS }, txt);

  function draw() {
    const k = [], n = sales.length, has = r => cat.has(r[1]);
    // catalog: present books in amber (tap to remove), missing books as dashed ghosts (tap to add)
    k.push(label('catalog', CX, CY - 8, C.amber), label('sales', SX, SY - 8, C.cyan));
    ['book', 'title', 'kind'].forEach((t, j) => k.push(cellEl(xs(CX, CW, j), CY, CW[j], t, C.amber, { head: true })));
    CODES.forEach((code, j) => {
      const y = CY + (j + 1) * RH, tap = () => { if (cat.has(code)) cat.delete(code); else cat.add(code); draw(); };
      if (cat.has(code)) {
        k.push(cellEl(xs(CX, CW, 0), y, CW[0], code, C.amber, { mono: true, onTap: tap }),
          cellEl(xs(CX, CW, 1), y, CW[1], BOOKS[code][0], C.amber, { onTap: tap }),
          cellEl(xs(CX, CW, 2), y, CW[2], BOOKS[code][1], C.amber, { onTap: tap }));
      } else {
        k.push(cellEl(xs(CX, CW, 0), y, CW[0], code, C.muted, { mono: true, dash: true, fill: 0.03, onTap: tap }),
          cellEl(xs(CX, CW, 1), y, CW[1] + CW[2], 'not in catalog · tap to add', C.muted, { dash: true, fill: 0.03, small: true, onTap: tap }));
      }
    });
    // sales with the joined columns
    ['order', 'book', 'amount', 'title', 'kind'].forEach((t, i) => k.push(cellEl(xs(SX, SW, i), SY, SW[i], t, i < 3 ? C.cyan : C.amber, { head: true })));
    sales.forEach((r, i) => {
      const y = SY + (i + 1) * RH, m = has(r), drop = !m && mode === 'inner';
      k.push(cellEl(xs(SX, SW, 0), y, SW[0], r[0], C.cyan, { mono: true, dim: drop }),
        cellEl(xs(SX, SW, 1), y, SW[1], r[1], C.cyan, { mono: true, dim: drop, fill: 0.22,
          onTap: () => { r[1] = CODES[(CODES.indexOf(r[1]) + 1) % CODES.length]; draw(); } }),
        cellEl(xs(SX, SW, 2), y, SW[2], '$' + r[2], C.cyan, { mono: true, dim: drop }));
      if (m) {
        k.push(cellEl(xs(SX, SW, 3), y, SW[3], BOOKS[r[1]][0], C.amber),
          cellEl(xs(SX, SW, 4), y, SW[4], BOOKS[r[1]][1], C.amber));
      } else if (mode === 'left') {
        k.push(cellEl(xs(SX, SW, 3), y, SW[3], 'NULL', C.muted, { mono: true, fill: 0.12 }),
          cellEl(xs(SX, SW, 4), y, SW[4], 'NULL', C.muted, { mono: true, fill: 0.12 }));
      } else {
        k.push(s('line', { x1: SX + 4, x2: xs(SX, SW, 3) - 4, y1: y + RH / 2, y2: y + RH / 2, stroke: C.pink, 'stroke-width': 2 }),
          cellEl(xs(SX, SW, 3), y, SW[3] + SW[4], 'dropped: no match', C.pink, { dash: true, fill: 0.04, small: true }));
      }
    });
    svg.replaceChildren(...k);

    // numbers
    const matched = sales.filter(has), unmatched = n - matched.length;
    const out = mode === 'left' ? n : matched.length, empty = mode === 'left' ? unmatched : 0;
    const totIn = sales.reduce((a, r) => a + r[2], 0);
    const totOut = mode === 'left' ? totIn : matched.reduce((a, r) => a + r[2], 0);
    leftBtn.className = 'sim-btn ' + (mode === 'left' ? 'go' : 'ghost');
    innerBtn.className = 'sim-btn ' + (mode === 'inner' ? 'go' : 'ghost');
    fbox(box, [[`sales ${mode === 'left' ? 'LEFT' : 'INNER'} JOIN catalog`, C.cyan],
      `rows in   = ${n}`,
      [`rows out  = ${out}`, out === n ? C.green : C.pink],
      [`empty     = ${empty} row${empty === 1 ? '' : 's'} (NULL)`, C.muted],
      `total in  = $${totIn}`,
      [`total out = $${totOut}`, totOut === totIn ? C.green : C.pink]]);
    if (mode === 'left') {
      note.textContent = `Left join: all ${n} sales stay. ` + (unmatched
        ? `${unmatched} sale${unmatched > 1 ? 's' : ''} found no catalog row, so title and kind are empty (NULL).`
        : 'Every sale found its book in the catalog.');
    } else {
      note.textContent = unmatched
        ? `Inner join: ${unmatched} sale${unmatched > 1 ? 's' : ''} found no catalog row and disappeared, taking $${totIn - totOut} with ${unmatched > 1 ? 'them' : 'it'}. No warning!`
        : 'Inner join: every sale found a match, so nothing was dropped.';
    }
    chal.update({ mode, n, out, empty, totIn, totOut, leftNew });
  }
  draw();
  return () => {};
}

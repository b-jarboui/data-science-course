// 3.1.4 Try it: keys and table grain.
// Tap columns to test candidate keys, edit or add order lines, generate random bookstore tables,
// and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const COLS = [
    { id: 'order', label: 'Order', short: 'Order' },
    { id: 'line', label: 'Line', short: 'Line' },
    { id: 'store', label: 'Store', short: 'Store' },
    { id: 'book', label: 'Book', short: 'Book' },
    { id: 'copies', label: 'Copies', short: 'Qty' },
    { id: 'price', label: 'Price', short: 'Price' },
  ];
  const PRICES = { B1: 10, B2: 20, B3: 15, B4: 25 };
  const BOOKS = ['B1', 'B2', 'B3', 'B4'];
  const START = [
    { order: 101, line: 1, store: 'North', book: 'B1', copies: 2, price: 10 },
    { order: 101, line: 2, store: 'North', book: 'B2', copies: 1, price: 20 },
    { order: 102, line: 1, store: 'South', book: 'B3', copies: 1, price: 15 },
    { order: 103, line: 1, store: 'North', book: 'B2', copies: 1, price: 20 },
    { order: 103, line: 2, store: 'North', book: 'B3', copies: 2, price: 15 },
    { order: 104, line: 1, store: 'South', book: 'B4', copies: 1, price: 25 },
  ];

  let rows = START.map(r => ({ ...r }));
  let keyCols = new Set(['order']);
  let selRow = 0;
  let randomId = 0, countedRandomId = -1, randomPasses = 0;

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('div', { class: 'sim-note', style: { marginTop: '0.5rem' } });

  const keyBtns = {};
  const keyRow = h('div', { class: 'sim-row' },
    h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 650 } }, 'Test key:'),
    ...COLS.map(c => {
      const b = btn(c.label, () => toggleCol(c.id));
      keyBtns[c.id] = b;
      return b;
    }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: test the key and grain'),
    h('p', { class: 'sub' }, 'Tap column headers (or the key buttons) to test which fields pick out exactly one row. Tap any row to inspect what one row means.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, keyRow, selLabel,
        h('div', { class: 'sim-row' },
          btn('Same book twice', addSameBook, 'go'),
          btn('Add order line', addLine),
          btn('Add new order', addOrder),
          btn('Remove row', removeRow),
          btn('New data (random)', makeRandom),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function toggleCol(id) {
    if (keyCols.has(id)) keyCols.delete(id);
    else keyCols.add(id);
    draw();
  }

  function nextLineFor(ord) {
    return Math.max(0, ...rows.filter(r => r.order === ord).map(r => r.line)) + 1;
  }

  function addSameBook() {
    if (rows.length >= 9) return;
    const base = rows[selRow] || rows[0];
    const line = nextLineFor(base.order);
    rows.push({ order: base.order, line, store: base.store, book: base.book, copies: 1, price: base.price });
    selRow = rows.length - 1;
    draw();
  }

  function addLine() {
    if (rows.length >= 9) return;
    const base = rows[selRow] || rows[0];
    const used = new Set(rows.filter(r => r.order === base.order).map(r => r.book));
    const book = BOOKS.find(b => !used.has(b)) || BOOKS[rnd(0, 3)];
    rows.push({ order: base.order, line: nextLineFor(base.order), store: base.store, book, copies: rnd(1, 3), price: PRICES[book] });
    selRow = rows.length - 1;
    draw();
  }

  function addOrder() {
    if (rows.length >= 9) return;
    const ord = Math.max(100, ...rows.map(r => r.order)) + 1;
    const store = rnd(0, 1) ? 'North' : 'South';
    const book = BOOKS[rnd(0, 3)];
    rows.push({ order: ord, line: 1, store, book, copies: rnd(1, 3), price: PRICES[book] });
    selRow = rows.length - 1;
    draw();
  }

  function removeRow() {
    if (rows.length <= 2) return;
    rows.splice(selRow, 1);
    selRow = Math.min(selRow, rows.length - 1);
    draw();
  }

  function makeRandom() {
    const nOrders = rnd(4, 5);
    const fresh = [];
    let multiCount = 0;
    for (let i = 0; i < nOrders; i++) {
      const order = 101 + i;
      const store = rnd(0, 1) ? 'North' : 'South';
      const wantTwo = (i === 0 || (fresh.length < 7 && rnd(0, 1) === 1)) && fresh.length + 2 <= 9;
      const lines = wantTwo ? 2 : 1;
      if (lines > 1) multiCount++;
      for (let ln = 1; ln <= lines; ln++) {
        const book = BOOKS[rnd(0, 3)];
        fresh.push({ order, line: ln, store, book, copies: rnd(1, 3), price: PRICES[book] });
      }
    }
    if (multiCount === 0 && fresh.length < 9) {
      const b = BOOKS[rnd(0, 3)];
      fresh.splice(1, 0, { order: 101, line: 2, store: fresh[0].store, book: b, copies: 1, price: PRICES[b] });
    }
    rows = fresh;
    selRow = 0;
    randomId++;
    draw();
  }

  function reset() {
    rows = START.map(r => ({ ...r }));
    keyCols = new Set(['order']);
    selRow = 0;
    randomId = 0;
    countedRandomId = -1;
    draw();
  }

  const keyList = () => COLS.filter(c => keyCols.has(c.id)).map(c => c.id);
  const keyTuple = (r, cols) => cols.map(id => id === 'price' ? '$' + r[id] : String(r[id])).join(', ');
  const hasDupOrderBook = () => {
    const seen = new Set();
    for (const r of rows) {
      const k = `${r.order}|${r.book}`;
      if (seen.has(k)) return true;
      seen.add(k);
    }
    return false;
  };

  const chal = challenges(ch, [
    { text: 'Test Order and Line together as the key so all 6 rows get different keys.',
      check: st => st.isKey && st.cols.length === 2 && st.cols.includes('order') && st.cols.includes('line'),
      why: 'Yes! Six rows and six different (Order, Line) pairs — no two rows share a key.' },
    { text: 'Switch the key to Order + Book, then press “Same book twice” to break it.',
      check: st => !st.isKey && st.cols.length === 2 && st.cols.includes('order') && st.cols.includes('book') && st.hasDupOB,
      why: 'Aha! Order + Book only worked by luck. Once an order lists the same book on two lines, it repeats.' },
    { text: 'Without removing rows, switch the key back to Order + Line so the check passes again.',
      check: st => st.hasDupOB && st.isKey && st.cols.length === 2 && st.cols.includes('order') && st.cols.includes('line'),
      why: 'Right! Even with the same book twice in one order, the line numbers differ, so Order + Line stays unique.' },
    { text: 'With Order + Line selected, press “New data (random)” twice. Does the key check pass every time?',
      check: st => st.randomPasses >= 2,
      why: 'Always. Every random table has more order lines than orders, and Order + Line picks out every single row.' },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.05 : 1;
  const CW = NARROW ? [52, 42, 56, 46, 42, 48, 118] : [78, 66, 86, 70, 78, 76, 222];
  const X0 = Math.round((VW - CW.reduce((a, b) => a + b, 0)) / 2);
  const HDR_Y = 12, HDR_H = 38, ROW_H = 38;

  function draw() {
    const cols = keyList();
    const counts = new Map();
    const keys = rows.map(r => cols.length ? keyTuple(r, cols) : '');
    if (cols.length) keys.forEach(k => counts.set(k, (counts.get(k) || 0) + 1));
    const distinct = cols.length ? counts.size : 0;
    const isKey = cols.length > 0 && distinct === rows.length;
    const realOrders = new Set(rows.map(r => r.order)).size;

    const isOrderLine = cols.length === 2 && cols.includes('order') && cols.includes('line');
    if (randomId > 0 && randomId !== countedRandomId && isOrderLine && isKey) {
      countedRandomId = randomId;
      randomPasses++;
    }

    COLS.forEach(c => { keyBtns[c.id].className = 'sim-btn' + (keyCols.has(c.id) ? ' go' : ''); });

    const VH = HDR_Y + HDR_H + Math.max(6, rows.length) * ROW_H + 14;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

    const colX = [];
    let x = X0;
    for (let i = 0; i < CW.length; i++) { colX.push(x); x += CW[i]; }
    const tableW = x - X0, tableH = HDR_H + rows.length * ROW_H;

    const els = [];
    els.push(s('rect', { x: X0, y: HDR_Y, width: tableW, height: tableH, rx: 10, fill: C.bg, stroke: isKey ? C.green : (cols.length ? C.pink : C.line), 'stroke-width': 2 }));

    // Highlight active key columns
    COLS.forEach((c, i) => {
      if (!keyCols.has(c.id)) return;
      const col = isKey ? C.green : C.pink;
      els.push(s('rect', { x: colX[i] + 2, y: HDR_Y + 2, width: CW[i] - 4, height: tableH - 4, rx: 6, fill: col, 'fill-opacity': 0.11, stroke: col, 'stroke-opacity': 0.65, 'stroke-width': 1.5 }));
    });

    // Clickable headers
    COLS.forEach((c, i) => {
      const active = keyCols.has(c.id);
      const col = active ? (isKey ? C.green : C.pink) : C.muted;
      const g = s('g', { style: 'cursor:pointer' });
      g.addEventListener('click', () => toggleCol(c.id));
      g.append(
        s('rect', { x: colX[i] + 2, y: HDR_Y + 2, width: CW[i] - 4, height: HDR_H - 4, rx: 6, fill: active ? col : '#152040', 'fill-opacity': active ? 0.22 : 0.9 }),
        s('text', { x: colX[i] + CW[i] / 2, y: HDR_Y + HDR_H / 2 + 5, fill: active ? col : C.ink, 'font-size': (NARROW ? 12 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, (active ? '✓' : '') + (NARROW ? c.short : c.label)));
      els.push(g);
    });

    // Key-value header
    els.push(
      s('rect', { x: colX[6] + 2, y: HDR_Y + 2, width: CW[6] - 4, height: HDR_H - 4, rx: 6, fill: '#152040' }),
      s('text', { x: colX[6] + CW[6] / 2, y: HDR_Y + HDR_H / 2 + 5, fill: C.amber, 'font-size': (NARROW ? 12 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, NARROW ? 'Key check' : 'Candidate key'));

    // Data rows
    rows.forEach((r, idx) => {
      const ry = HDR_Y + HDR_H + idx * ROW_H;
      const dup = cols.length > 0 && counts.get(keys[idx]) > 1;
      const rowColor = r.store === 'North' ? C.cyan : C.pink;
      const g = s('g', { style: 'cursor:pointer' });
      g.addEventListener('click', () => { selRow = idx; draw(); });

      g.append(s('line', { x1: X0, x2: X0 + tableW, y1: ry, y2: ry, stroke: C.line }));
      if (idx === selRow) {
        g.append(s('rect', { x: X0 + 2, y: ry + 2, width: tableW - 4, height: ROW_H - 4, rx: 6, fill: '#ffffff', 'fill-opacity': 0.06, stroke: C.violet, 'stroke-opacity': 0.7, 'stroke-width': 1.5 }));
      }
      if (dup) {
        g.append(s('rect', { x: X0 + 2, y: ry + 2, width: tableW - 4, height: ROW_H - 4, rx: 6, fill: C.pink, 'fill-opacity': 0.13 }));
      }

      const vals = [String(r.order), String(r.line), r.store, r.book, String(r.copies), '$' + r.price];
      vals.forEach((v, ci) => {
        g.append(s('text', { x: colX[ci] + CW[ci] / 2, y: ry + ROW_H / 2 + 5, fill: rowColor, 'font-size': (NARROW ? 13 : 15) * F, 'font-weight': ci < 2 ? 700 : 500, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v));
      });

      const badgeColor = !cols.length ? C.muted : (dup ? C.pink : C.green);
      const rawKey = !cols.length ? 'pick columns' : (cols.length > 1 ? `(${keys[idx]})` : keys[idx]);
      const shortKey = NARROW && rawKey.length > 11 ? rawKey.slice(0, 10) + '…' : (rawKey.length > 18 ? rawKey.slice(0, 17) + '…' : rawKey);
      const tag = !cols.length ? shortKey : (dup ? `${shortKey} ×${counts.get(keys[idx])}` : `${shortKey} ✓`);
      g.append(s('text', { x: colX[6] + CW[6] / 2, y: ry + ROW_H / 2 + 5, fill: badgeColor, 'font-size': (NARROW ? 11.5 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tag));

      els.push(g);
    });

    svg.replaceChildren(...els);

    const colNames = COLS.filter(c => keyCols.has(c.id)).map(c => c.label).join(' + ') || '(none)';
    const checkLine = !cols.length
      ? ['check         = tap a column', C.amber]
      : (isKey ? [`check         = ${rows.length} = ${distinct}  ✓ PASS`, C.green]
        : [`check         = ${distinct} ≠ ${rows.length}  ✗ REPEATS`, C.pink]);
    fbox(box, [
      `key test      = ${colNames}`,
      `rows (lines)  = ${rows.length}`,
      `distinct keys = ${cols.length ? distinct : '—'}`,
      checkLine,
      [`real orders   = ${realOrders} (distinct Order)`, C.cyan],
    ]);

    note.textContent = !cols.length
      ? 'Tap one or more column headers above to test whether they pick out every row uniquely.'
      : (isKey
        ? `Unique key! Every one of the ${rows.length} order lines has its own key. Remember: there are ${realOrders} orders across ${rows.length} rows.`
        : `Duplicate keys found (marked in pink): ${rows.length} rows share only ${distinct} different key values, so this cannot point at one row.`);

    const cur = rows[selRow];
    selLabel.textContent = `Row ${selRow + 1} (grain = 1 order line): Order ${cur.order}, line ${cur.line} — ${cur.store}, ${cur.copies} × ${cur.book} at $${cur.price}.`;

    chal.update({ cols, isKey, rows: rows.length, realOrders, hasDupOB: hasDupOrderBook(), randomPasses });
  }

  draw();
  return () => {};
}

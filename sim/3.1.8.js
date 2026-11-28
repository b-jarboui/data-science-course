// 3.1.8 Try it: grouped aggregation.
// The learner edits the order lines (tap a row; switch its store, change copies or price), picks the column
// to add up and the summary (sum, count, mean, largest), and watches the rows sort into one pile per store.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [
    { id: '101·1', store: 'North', copies: 2, price: 10 },
    { id: '101·2', store: 'North', copies: 1, price: 20 },
    { id: '102·1', store: 'South', copies: 1, price: 15 },
    { id: '103·1', store: 'North', copies: 1, price: 20 },
    { id: '103·2', store: 'North', copies: 2, price: 15 },
    { id: '104·1', store: 'South', copies: 1, price: 25 }];
  const copyRows = a => a.map(r => ({ ...r }));
  let rows = copyRows(START), sel = 0, col = 'amount', agg = 'sum', newChecks = 0, nextOrder = 105;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const label = t => h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 650 } }, t);
  const colBtns = { amount: btn('Amount', () => setCol('amount')), price: btn('Price', () => setCol('price')), copies: btn('Copies', () => setCol('copies')) };
  const aggBtns = { sum: btn('Sum', () => setAgg('sum')), count: btn('Count', () => setAgg('count')), mean: btn('Mean', () => setAgg('mean')), max: btn('Largest', () => setAgg('max')) };
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: one total per shop'),
    h('p', { class: 'sub' }, 'Each row is one order line. Tap a row to pick it, tap its store to switch shops, and change its copies or price. The rows sort themselves into one pile per store, and each pile becomes one number.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Switch store', () => edit(r => { r.store = r.store === 'North' ? 'South' : 'North'; })),
          btn('Copies −1', () => edit(r => { r.copies = Math.max(1, r.copies - 1); })),
          btn('Copies +1', () => edit(r => { r.copies = Math.min(9, r.copies + 1); })),
          btn('Price −5', () => edit(r => { r.price = Math.max(5, r.price - 5); })),
          btn('Price +5', () => edit(r => { r.price = Math.min(50, r.price + 5); })), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, label('Add up:'), ...Object.values(colBtns)),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, label('Summary:'), ...Object.values(aggBtns)),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => { newData(); }, 'go'),
          btn('Add a row', () => { if (rows.length < 8) { rows.push(randomRow(`${nextOrder++}·1`)); sel = rows.length - 1; draw(); } }),
          btn('Remove a row', () => { if (rows.length > 2) { rows.pop(); sel = Math.min(sel, rows.length - 1); draw(); } }),
          btn('Start again', () => { rows = copyRows(START); sel = 0; nextOrder = 105; col = 'amount'; agg = 'sum'; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const amount = r => r.copies * r.price;
  const val = r => col === 'amount' ? amount(r) : r[col];
  const r2 = x => Math.round(x * 100) / 100;
  const tone = st => st === 'North' ? C.cyan : C.pink;
  const AGGN = { sum: 'SUM', count: 'COUNT', mean: 'MEAN', max: 'MAX' };
  function summary(vs) {
    if (!vs.length) return null;
    const t = vs.reduce((a, b) => a + b, 0);
    return agg === 'sum' ? t : agg === 'count' ? vs.length : agg === 'mean' ? t / vs.length : Math.max(...vs);
  }
  const randomRow = id => ({ id, store: Math.random() < 0.5 ? 'North' : 'South', copies: rnd(1, 3), price: 5 * rnd(2, 6) });

  function setCol(c) { col = c; draw(); }
  function setAgg(a) { agg = a; draw(); }
  function edit(fn) { fn(rows[sel]); draw(); }
  function newData() {
    const n = rnd(4, 8);
    rows = Array.from({ length: n }, (_, i) => randomRow(`${101 + i}·1`));
    nextOrder = 101 + n; sel = 0;
    if (col === 'amount' && agg === 'sum') newChecks++;
    draw();
  }

  const chal = challenges(ch, [
    { text: 'Make the North shop’s money (Amount, Sum) exactly 100.',
      check: st => st.col === 'amount' && st.agg === 'sum' && st.N === 100,
      why: 'Yes! Changing one row changes only the total of its own pile.' },
    { text: 'Add up the Price column instead of the Amount. Is North’s number still the money it made?',
      check: st => st.col === 'price' && st.agg === 'sum',
      why: 'No: one price is the money for ONE copy, so adding prices forgets the copies. Money must add the amount.' },
    { text: 'Make both shops sell exactly the same money (Amount, Sum).',
      check: st => st.col === 'amount' && st.agg === 'sum' && st.N != null && st.N === st.S,
      why: 'Right: two equal piles. The total of all rows is now split exactly in half.' },
    { text: 'With Amount and Sum, press “New data” twice. Do the two pile totals always add up to the total of all rows?',
      check: st => st.newChecks >= 2,
      why: 'Always: every row lands in exactly one pile, so no money is lost or counted twice.' },
  ]);

  // geometry: table on the left (laptop) or on top (phone), piles beside or below
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 720 : 440, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const TX = 10, TY = 16, RH = 34, CW = NARROW ? [62, 86, 72, 72, 88] : [62, 92, 78, 78, 92];
  const TW = CW.reduce((a, b) => a + b, 0);
  const cx = CW.map((w, j) => TX + CW.slice(0, j).reduce((a, b) => a + b, 0) + w / 2);
  const PC = NARROW ? [110, 290] : [510, 630], PW = NARROW ? 120 : 96, BASE = NARROW ? 668 : 392, ROOM = NARROW ? 250 : 290;

  // tap a row to pick it; tap its store cell to switch shops
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('click', e => {
    const p = toSvg(e), i = Math.floor((p.y - TY) / RH) - 1;
    if (p.x < TX || p.x > TX + TW || i < 0 || i >= rows.length) return;
    sel = i;
    if (p.x >= cx[1] - CW[1] / 2 && p.x <= cx[1] + CW[1] / 2) rows[i].store = rows[i].store === 'North' ? 'South' : 'North';
    draw();
  });

  function draw() {
    Object.entries(colBtns).forEach(([k, b]) => { b.className = 'sim-btn ' + (k === col ? 'go' : ''); });
    Object.entries(aggBtns).forEach(([k, b]) => { b.className = 'sim-btn ' + (k === agg ? 'go' : ''); });
    const k = [], mono = 'Consolas, monospace', colIdx = { copies: 2, price: 3, amount: 4 }[col];
    const tx = (x, y, str, fill, size = 15, extra = {}) => s('text', { x, y, fill, 'font-size': size * F, 'font-family': mono, 'text-anchor': 'middle', ...extra }, str);

    // the table
    ['ROW', 'STORE', 'COPIES', 'PRICE', 'AMOUNT'].forEach((t, j) => {
      k.push(s('rect', { x: cx[j] - CW[j] / 2, y: TY, width: CW[j], height: RH, fill: C.muted, 'fill-opacity': .15, stroke: C.line }),
        tx(cx[j], TY + RH / 2 + 5, t, j === colIdx ? C.amber : C.muted, 12, { 'font-weight': 700 }));
    });
    rows.forEach((r, i) => {
      const y = TY + RH * (i + 1), c = tone(r.store);
      [r.id, r.store, r.copies, r.price, amount(r)].forEach((v, j) => {
        k.push(s('rect', { x: cx[j] - CW[j] / 2, y, width: CW[j], height: RH, fill: c, 'fill-opacity': j === colIdx ? .22 : .07, stroke: c, 'stroke-opacity': .5 }),
          tx(cx[j], y + RH / 2 + 5, v, j === 1 ? c : j === 4 ? C.amber : C.ink, 15, { 'font-weight': j === 1 ? 700 : 400 }));
      });
      if (i === sel) k.push(s('rect', { x: TX - 3, y: y - 2, width: TW + 6, height: RH + 4, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, rx: 5 }));
    });

    // the piles: one per store, one card per row
    const groups = ['North', 'South'].map(st => rows.filter(r => r.store === st));
    const vals = groups.map(g => g.map(val)), res = vals.map(summary);
    const chh = Math.min(34, ROOM / Math.max(4, ...groups.map(g => g.length)));
    k.push(tx((PC[0] + PC[1]) / 2, NARROW ? 360 : 40, 'GROUP BY STORE', C.muted, 13, { 'font-weight': 700 }));
    ['North', 'South'].forEach((st, g) => {
      const c = tone(st), X = PC[g], list = groups[g];
      list.forEach((r, j) => {
        const y = BASE - (j + 1) * chh, big = agg === 'max' && val(r) === res[g];
        k.push(s('rect', { x: X - PW / 2, y: y + 1, width: PW, height: chh - 2, rx: 4, fill: c, 'fill-opacity': big ? .55 : .22, stroke: c }),
          tx(X, y + chh / 2 + 5, agg === 'count' ? 1 : val(r), C.ink, 14));
      });
      k.push(s('line', { x1: X - PW / 2 - 8, x2: X + PW / 2 + 8, y1: BASE, y2: BASE, stroke: C.muted, 'stroke-width': 2 }),
        tx(X, BASE + 22, st.toUpperCase() + ' PILE', c, 13, { 'font-weight': 700 }));
      const top = BASE - list.length * chh - 12, lab = res[g] == null ? 'NO ROWS' : `${AGGN[agg]} ${fmt(r2(res[g]))}`;
      const pw = Math.max(PW, lab.length * 9.5 * F + 20);
      k.push(s('rect', { x: X - pw / 2, y: top - 26 * F, width: pw, height: 26 * F, rx: 13 * F, fill: C.bg, stroke: C.amber }),
        tx(X, top - 8 * F, lab, C.amber, 14, { 'font-weight': 700 }));
    });
    svg.replaceChildren(...k);

    // the formula box: the SQL and the numbers it uses
    const expr = { amount: 'copies * price', price: 'price', copies: 'copies' }[col];
    const fn = { sum: 'SUM', count: 'COUNT', mean: 'AVG', max: 'MAX' }[agg];
    const line = (st, vs, r) => {
      if (!vs.length) return `${st}: no rows`;
      if (agg === 'sum') return `${st}: ${vs.join(' + ')} = ${fmt(r)}`;
      if (agg === 'count') return `${st}: ${vs.length} rows`;
      if (agg === 'mean') return `${st}: (${vs.join(' + ')}) ÷ ${vs.length} = ${fmt(r2(r))}`;
      return `${st}: largest of ${vs.join(', ')} = ${fmt(r)}`;
    };
    const all = rows.map(val).reduce((a, b) => a + b, 0), filled = groups.filter(g => g.length).length;
    const check = agg === 'sum' ? [[`all rows: ${all} = ${fmt(res[0] ?? 0)} + ${fmt(res[1] ?? 0)} ✓`, C.green]]
      : agg === 'count' ? [[`all rows: ${rows.length} = ${res[0] ?? 0} + ${res[1] ?? 0} ✓`, C.green]] : [];
    fbox(box, [`SELECT store, ${fn}(${agg === 'count' ? '*' : expr})`, 'FROM sales GROUP BY store',
      [line('North', vals[0], res[0]), C.cyan], [line('South', vals[1], res[1]), C.pink], ...check,
      [`${rows.length} rows → ${filled} row${filled === 1 ? '' : 's'}`, C.amber]]);
    note.textContent = col === 'price' && agg === 'sum' ? 'Careful: one price is the money for ONE copy. Adding prices forgets how many copies were sold.'
      : col === 'copies' && agg === 'sum' ? 'Adding copies counts books sold, not money.'
      : agg === 'mean' || agg === 'max' ? 'The piles are the same; only the summary number for each pile changes.'
      : 'Each pile is one group. Every row lands in exactly one pile, so nothing is lost.';
    const r = rows[sel];
    selLabel.textContent = `Row ${r.id}: ${r.store}, ${r.copies} × ${r.price} = ${amount(r)}`;
    chal.update({ col, agg, N: res[0], S: res[1], n: rows.length, newChecks });
  }
  draw();
  return () => {};
}

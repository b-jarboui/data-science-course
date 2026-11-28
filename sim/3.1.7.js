// 3.1.7 Try it: join multiplication.
// The learner changes the catalog (tap a row to change its book code, add or remove rows), makes random data,
// and watches the left join live: matching lines, rows out and the money total. Challenges check themselves.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START_SALES = [
    { order: 101, store: 'North', book: 'B1', amount: 20 },
    { order: 101, store: 'North', book: 'B2', amount: 20 },
    { order: 102, store: 'South', book: 'B3', amount: 15 },
    { order: 103, store: 'North', book: 'B2', amount: 20 },
    { order: 103, store: 'North', book: 'B3', amount: 30 },
    { order: 104, store: 'South', book: 'B4', amount: 25 },
  ];
  const START_CAT = [
    { code: 'B1', title: 'Garden Guide' },
    { code: 'B2', title: 'Star Atlas (paper)' },
    { code: 'B3', title: 'Easy Soups' },
    { code: 'B2', title: 'Star Atlas (hard)' },
  ];
  const CODES = ['B1', 'B2', 'B3', 'B4', 'B5'];
  const PRICE = { B1: 10, B2: 20, B3: 15, B4: 25 };
  const NAMES = { B1: 'Garden Guide', B2: 'Star Atlas', B3: 'Easy Soups', B4: 'Book B4', B5: 'Book B5' };
  const EDITIONS = ['paper', 'hard', 'large print'];
  const copy = a => a.map(o => ({ ...o }));
  let sales = copy(START_SALES), cat = copy(START_CAT), sel = -1, randoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: when a join makes extra rows'),
    h('p', { class: 'sub' }, 'Tap a catalog row to change its book code. Tap a sales row to see its matches. The left join makes one row for every match, and keeps a sale with no match.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Add a catalog row', () => { if (cat.length < 6) { cat.push({ code: 'B5', title: 'new edition' }); draw(); } }),
          btn('Remove last catalog row', () => { if (cat.length > 1) { cat.pop(); draw(); } }),
          btn('New data (random)', newData, 'go'),
          btn('Start again', () => { sales = copy(START_SALES); cat = copy(START_CAT); sel = -1; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Fix the catalog so that the 6 sales rows give exactly 6 rows out.',
      check: st => st.start && st.nOut === st.nIn,
      why: 'Right: when every code is in the catalog only once, each sale matches at most one row, so nothing is copied.' },
    { text: 'With the same 6 sales rows, make exactly 9 rows come out.',
      check: st => st.start && st.nOut === 9,
      why: 'Yes: rows out = the sum of each row’s matches, so 3 extra matches make 3 extra copies.' },
    { text: 'With the same 6 sales rows, make the joined total exactly 190 dollars.',
      check: st => st.start && st.totOut === 190,
      why: 'Right: every extra copy counts that sale’s money again, here 20 + 20 + 20 = 60 dollars too much.' },
    { text: 'Press “New data” two times. Is rows out always the sum of the matches line?',
      check: st => st.randoms >= 2,
      why: 'Always: each sales row gives one output row per match, and one row when it has no match.' },
  ]);

  function newData() {
    const n = rnd(4, 7);
    let order = 100;
    sales = Array.from({ length: n }, (_, i) => {
      if (i === 0 || rnd(0, 1)) order++;
      const book = CODES[rnd(0, 3)];
      return { order, store: rnd(0, 1) ? 'North' : 'South', book, amount: rnd(1, 3) * PRICE[book] };
    });
    const codes = Array.from({ length: rnd(3, 5) }, () => CODES[rnd(0, 4)]);
    const seen = {};
    cat = codes.map(code => {
      const k = seen[code] = (seen[code] || 0) + 1;
      const many = codes.filter(c => c === code).length > 1;
      return { code, title: many ? `${NAMES[code]} (${EDITIONS[Math.min(k - 1, 2)]})` : NAMES[code] };
    });
    sel = -1; randoms++;
    draw();
  }

  function join() {
    const rows = [], counts = [];
    sales.forEach((sl, i) => {
      const m = cat.map((c, j) => c.code === sl.book ? j : -1).filter(j => j >= 0);
      counts.push(m);
      if (!m.length) rows.push({ i, j: -1, extra: false });
      m.forEach((j, k) => rows.push({ i, j, extra: k > 0 }));
    });
    return { rows, counts };
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: catalog above sales, bigger text
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, RH = NARROW ? 34 : 30, FS = 14 * F;
  const txt = (x, y, str, fill, size = FS, anchor = 'middle', weight = 400) =>
    s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-weight': weight, 'font-family': 'Consolas, monospace' }, str);
  const storeCol = st => st === 'North' ? C.cyan : C.pink;
  const sum = a => a.reduce((x, y) => x + y, 0);

  // draw a table; rows: {cells, color, op, stroke, sw, colors, onclick}
  function table(k, x0, top, widths, headers, rows) {
    const xs = []; let x = x0;
    for (const w of widths) { xs.push(x + w / 2); x += w; }
    const W = sum(widths);
    k.push(s('rect', { x: x0, y: top, width: W, height: RH, fill: C.card, stroke: C.muted }));
    headers.forEach((t, c) => k.push(txt(xs[c], top + RH * 0.66, t, C.muted, FS * 0.95, 'middle', 700)));
    rows.forEach((row, r) => {
      const y = top + RH * (r + 1);
      const g = s('g', { style: row.onclick ? 'cursor:pointer' : null });
      g.append(s('rect', { x: x0, y, width: W, height: RH, fill: row.color, 'fill-opacity': row.op ?? 0.13, stroke: row.stroke || row.color, 'stroke-width': row.sw || 1 }));
      row.cells.forEach((t, c) => g.append(txt(xs[c], y + RH * 0.66, t, (row.colors && row.colors[c]) || C.ink, FS, 'middle', 700)));
      if (row.onclick) g.addEventListener('click', row.onclick);
      k.push(g);
    });
    let bx = x0;
    widths.slice(0, -1).forEach(w => { bx += w; k.push(s('line', { x1: bx, x2: bx, y1: top, y2: top + RH * (rows.length + 1), stroke: C.line })); });
    return { W, rowY: r => top + RH * (r + 1.5), bottom: top + RH * (rows.length + 1) };
  }

  function draw() {
    const { rows, counts } = join();
    const nIn = sales.length, nOut = rows.length;
    const totIn = sum(sales.map(x => x.amount)), totOut = sum(rows.map(r => sales[r.i].amount));
    const dupCodes = CODES.filter(c => cat.filter(x => x.code === c).length > 1);
    const selMatch = sel >= 0 ? counts[sel] : [];
    const k = [];

    const catRows = cat.map((c, j) => ({
      cells: [c.code, c.title], color: C.amber,
      stroke: selMatch.includes(j) ? C.ink : dupCodes.includes(c.code) ? C.violet : C.amber,
      sw: selMatch.includes(j) ? 3 : dupCodes.includes(c.code) ? 2 : 1,
      colors: [dupCodes.includes(c.code) ? C.violet : C.ink, C.ink],
      onclick: () => { c.code = CODES[(CODES.indexOf(c.code) + 1) % CODES.length]; draw(); },
    }));
    const salRows = sales.map((sl, i) => {
      const m = counts[i].length;
      return {
        cells: [String(sl.order), sl.book, '$' + sl.amount, m === 0 ? (NARROW ? '0→1' : '0 → 1') : String(m)],
        color: storeCol(sl.store), stroke: sel === i ? C.ink : storeCol(sl.store), sw: sel === i ? 3 : 1,
        colors: [C.ink, C.ink, C.ink, m > 1 ? C.violet : m === 0 ? C.green : C.ink],
        onclick: () => { sel = sel === i ? -1 : i; draw(); },
      };
    });

    let sTab, cTab, x0;
    if (NARROW) {
      x0 = 10;
      k.push(txt(x0, 24, 'catalog (tap a row)', C.amber, FS, 'start', 700));
      cTab = table(k, x0, 34, [80, 300], ['book', 'title'], catRows);
      const sTop = cTab.bottom + 44;
      k.push(txt(x0, sTop - 10, `sales: ${nIn} rows in`, C.cyan, FS, 'start', 700));
      sTab = table(k, x0, sTop, [90, 70, 90, 130], ['order', 'book', 'amount', 'matches'], salRows);
    } else {
      x0 = 20;
      k.push(txt(x0, 26, `sales: ${nIn} rows in`, C.cyan, FS, 'start', 700));
      sTab = table(k, x0, 36, [70, 60, 70, 80], ['order', 'book', 'amount', 'matches'], salRows);
      k.push(txt(420, 26, 'catalog (tap a row)', C.amber, FS, 'start', 700));
      cTab = table(k, 420, 36, [60, 210], ['book', 'title'], catRows);
      // a line for every match, from the sales row to the catalog row
      counts.forEach((m, i) => m.forEach(j => {
        const strong = sel < 0 || sel === i;
        k.push(s('line', { x1: x0 + sTab.W, y1: sTab.rowY(i), x2: 420, y2: cTab.rowY(j),
          stroke: m.length > 1 ? C.violet : C.cyan, 'stroke-width': sel === i ? 3.5 : 2, 'stroke-opacity': strong ? 0.9 : 0.2 }));
      }));
    }

    // the joined table, one chip per output row
    const chipsTop = Math.max(sTab.bottom, cTab.bottom) + 46;
    k.push(txt(x0, chipsTop - 12, `joined: ${nOut} rows out`, nOut > nIn ? C.violet : C.green, FS, 'start', 700));
    const per = NARROW ? 3 : 6, cw = NARROW ? 122 : 104, chh = NARROW ? 32 : 26, gap = 6;
    rows.forEach((r, n) => {
      const cx = x0 + (n % per) * (cw + gap), cy = chipsTop + Math.floor(n / per) * (chh + gap);
      const sl = sales[r.i], col = r.j < 0 ? C.muted : r.extra ? C.violet : storeCol(sl.store);
      k.push(s('rect', { x: cx, y: cy, width: cw, height: chh, rx: 6, fill: col, 'fill-opacity': r.extra ? 0.38 : 0.14,
        stroke: col, 'stroke-width': sel === r.i ? 2.5 : 1, 'stroke-dasharray': r.j < 0 ? '4 3' : null }));
      k.push(txt(cx + cw / 2, cy + chh * 0.68, `${sl.order} ${sl.book} $${sl.amount}`, C.ink, FS * 0.9));
    });
    const legendY = chipsTop + Math.ceil(nOut / per) * (chh + gap) + 16;
    k.push(txt(x0, legendY, 'violet = extra copy   dashed = no match, kept', C.muted, FS * 0.85, 'start'));
    svg.setAttribute('viewBox', `0 0 ${VW} ${legendY + 12}`);
    svg.replaceChildren(...k);

    const list = counts.map(m => Math.max(1, m.length)).join(' + ');
    fbox(box, [
      `rows in   = ${nIn}`,
      list.length <= 26 ? `matches   = ${list}` : 'matches   = one count per row',
      [`rows out  = ${nOut}`, nOut > nIn ? C.violet : C.green],
      `total in  = ${totIn}`,
      [`total out = ${totOut}` + (totOut > totIn ? `  (${totOut - totIn} too many)` : '  ✓'), totOut > totIn ? C.violet : C.green],
      [dupCodes.length ? `key unique? no: ${dupCodes.join(', ')} repeats` : 'key unique? yes ✓', dupCodes.length ? C.violet : C.green]]);
    const copied = counts.filter(m => m.length > 1).length;
    const main = nOut > nIn
      ? `Join multiplication: ${copied} sales row${copied > 1 ? 's were' : ' was'} copied. Every extra match is an extra copy, so its money is counted again.`
      : 'Every sale found at most one match: the same rows and the same money come out.';
    const one = sel >= 0
      ? ` Sales row ${sales[sel].order} ${sales[sel].book}: ${counts[sel].length || 'no'} match${counts[sel].length === 1 ? '' : 'es'}, so ${Math.max(1, counts[sel].length)} row${counts[sel].length > 1 ? 's' : ''} out.`
      : ' A sale with no match still gives one row (left join).';
    note.textContent = main + one;
    const start = JSON.stringify(sales) === JSON.stringify(START_SALES);
    chal.update({ start, nIn, nOut, totIn, totOut, randoms });
  }
  draw();
  return () => {};
}

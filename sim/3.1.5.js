// 3.1.5 Try it: SQL selection (picking rows and columns).
// The learner toggles SELECT columns, sets a WHERE filter (including spelling traps),
// switches between full table and result view, generates random sales tables, and solves challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const COLS = ['order', 'line', 'store', 'book', 'copies', 'price'];
  const PRICES = { B1: 10, B2: 20, B3: 15, B4: 25 };
  const START = [
    { order: 101, line: 1, store: 'North', book: 'B1', copies: 2, price: 10 },
    { order: 101, line: 2, store: 'North', book: 'B2', copies: 1, price: 20 },
    { order: 102, line: 1, store: 'South', book: 'B3', copies: 1, price: 15 },
    { order: 103, line: 1, store: 'North', book: 'B2', copies: 1, price: 20 },
    { order: 103, line: 2, store: 'North', book: 'B3', copies: 2, price: 15 },
    { order: 104, line: 1, store: 'South', book: 'B4', copies: 1, price: 25 },
  ];

  let rows = START.map(r => ({ ...r }));
  let selCols = new Set(COLS);
  let useWhere = false;
  let storeVal = 'North';
  let resultOnly = false;
  let isRandom = false;
  let testedRandomResult = false;

  const svg = s('svg', { viewBox: '0 0 680 390' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const colRow = h('div', { class: 'sim-row' });
  const whereRow = h('div', { class: 'sim-row' });
  const modeBtn = btn('Show result only', () => {
    resultOnly = !resultOnly;
    if (isRandom && resultOnly) testedRandomResult = true;
    draw();
  }, 'go');

  const input = h('input', {
    type: 'text',
    value: storeVal,
    'aria-label': 'Store value in WHERE clause',
    style: {
      background: C.bg, color: C.ink, border: '1px solid #536485', borderRadius: '.65rem',
      padding: '.45rem .7rem', font: '600 1rem Consolas, monospace', minHeight: '44px', width: '8.5rem'
    },
    oninput: e => {
      storeVal = e.target.value;
      useWhere = true;
      draw();
    }
  });

  function setWhere(active, val) {
    useWhere = active;
    if (val != null) { storeVal = val; input.value = val; }
    draw();
  }

  function toggleCol(col) {
    if (selCols.has(col)) selCols.delete(col);
    else selCols.add(col);
    draw();
  }

  function makeRandomSales() {
    const books = ['B1', 'B2', 'B3', 'B4'];
    const stores = ['North', 'South'];
    // 4 orders totaling 6 lines (two 2-line orders, two 1-line orders)
    const lengths = [2, 1, 2, 1].sort(() => Math.random() - 0.5);
    const orderStores = [0, 1, rnd(0, 1), rnd(0, 1)].sort(() => Math.random() - 0.5).map(i => stores[i]);
    const next = [];
    lengths.forEach((cnt, idx) => {
      const ord = 101 + idx;
      const st = orderStores[idx];
      const used = new Set();
      for (let ln = 1; ln <= cnt; ln++) {
        let bk = books[rnd(0, books.length - 1)];
        while (used.has(bk)) bk = books[rnd(0, books.length - 1)];
        used.add(bk);
        next.push({ order: ord, line: ln, store: st, book: bk, copies: rnd(1, 4), price: PRICES[bk] });
      }
    });
    rows = next;
    isRandom = true;
    resultOnly = false;
    draw();
  }

  function resetAll() {
    rows = START.map(r => ({ ...r }));
    selCols = new Set(COLS);
    useWhere = false;
    storeVal = 'North';
    input.value = storeVal;
    resultOnly = false;
    isRandom = false;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: pick rows and columns'),
    h('p', { class: 'sub' }, 'Tap column headers (or the buttons) to choose SELECT columns. Pick or type a store name for WHERE, and notice exact spelling.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-note', style: { marginTop: '.6rem', marginBottom: '.2rem', fontWeight: 650, color: C.amber } }, 'SELECT columns:'),
        colRow,
        h('div', { class: 'sim-note', style: { marginTop: '.7rem', marginBottom: '.2rem', fontWeight: 650, color: C.green } }, 'WHERE store ='),
        whereRow,
        h('div', { class: 'sim-row' },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Type exact text:'),
          input),
        h('div', { class: 'sim-row' },
          modeBtn,
          btn('New sales (random)', makeRandomSales),
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: "Answer the North manager: keep only book and copies, where store is 'North'.",
      check: st => st.colsKey === 'book,copies' && st.useWhere && st.storeVal === 'North',
      why: 'Yes! SELECT picked book and copies, and WHERE kept only the North rows.'
    },
    {
      text: "Check the South shop: keep only book and price, where store is 'South'.",
      check: st => st.colsKey === 'book,price' && st.useWhere && st.storeVal === 'South',
      why: 'Right! The same sales table answers a new question as soon as you change SELECT and WHERE.'
    },
    {
      text: "Trigger the spelling trap: filter by 'north' (small n) or 'North ' (extra space) to get 0 rows.",
      check: st => st.useWhere && st.matched === 0 && (st.storeVal === 'north' || (st.storeVal.trim() === 'North' && st.storeVal !== 'North')),
      why: 'Zero rows and no error! Text in WHERE must match capitalization and spaces in the data exactly.'
    },
    {
      text: 'Press “New sales (random)” and then “Show result only”. Does the full table stay safe when you switch back?',
      check: st => st.testedRandomResult,
      why: 'Always! Selecting works on any fresh table and never deletes a single row from the database.'
    }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 680;
  const F = NARROW ? 0.94 : 1;
  const PAD_X = NARROW ? 8 : 14;
  const WEIGHTS = [1.05, 0.80, 1.25, 0.90, 1.15, 0.95];
  const W_SUM = WEIGHTS.reduce((a, b) => a + b, 0);
  const HDR_Y = 28, RH = NARROW ? 44 : 46, VH = 390;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function renderControls() {
    colRow.replaceChildren(...COLS.map(c =>
      btn(c, () => toggleCol(c), selCols.has(c) ? 'go' : 'ghost')));
    whereRow.replaceChildren(
      btn('All rows', () => setWhere(false), !useWhere ? 'go' : 'ghost'),
      btn("'North'", () => setWhere(true, 'North'), useWhere && storeVal === 'North' ? 'go' : 'ghost'),
      btn("'South'", () => setWhere(true, 'South'), useWhere && storeVal === 'South' ? 'go' : 'ghost'),
      btn("'north' (small n)", () => setWhere(true, 'north'), useWhere && storeVal === 'north' ? 'go' : 'ghost'),
      btn("'North ' (space)", () => setWhere(true, 'North '), useWhere && storeVal === 'North ' ? 'go' : 'ghost')
    );
    modeBtn.textContent = resultOnly ? 'Show full table' : 'Show result only';
  }

  function draw() {
    renderControls();
    const activeCols = COLS.filter(c => selCols.has(c));
    const matchedRows = rows.filter(r => !useWhere || r.store === storeVal);
    const showCols = resultOnly ? activeCols : COLS;
    const showRows = resultOnly ? matchedRows : rows;

    const els = [];
    const tableTitle = resultOnly
      ? `result (${matchedRows.length} rows × ${activeCols.length} cols)`
      : `sales (${rows.length} rows × ${COLS.length} cols — full table safe)`;
    els.push(s('text', {
      x: PAD_X, y: 18, fill: resultOnly ? C.cyan : C.muted,
      'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas'
    }, tableTitle));

    const usableW = VW - PAD_X * 2;
    if (showCols.length === 0) {
      els.push(
        s('rect', { x: PAD_X, y: HDR_Y, width: usableW, height: RH * 3, rx: 10, fill: C.bg, stroke: C.pink, 'stroke-dasharray': '6 5' }),
        s('text', { x: VW / 2, y: HDR_Y + RH * 1.55, fill: C.pink, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'Pick at least one column for SELECT')
      );
    } else {
      const weights = showCols.map(c => WEIGHTS[COLS.indexOf(c)]);
      const wSum = weights.reduce((a, b) => a + b, 0);
      const colWidths = weights.map(w => (w / wSum) * usableW);
      const colX = [];
      let cur = PAD_X;
      for (const w of colWidths) { colX.push(cur); cur += w; }

      // Headers (clickable to toggle column)
      showCols.forEach((col, ci) => {
        const picked = selCols.has(col);
        const g = s('g', { style: 'cursor:pointer' });
        g.addEventListener('click', () => toggleCol(col));
        g.append(
          s('rect', {
            x: colX[ci] + 1, y: HDR_Y, width: colWidths[ci] - 2, height: RH - 2, rx: 5,
            fill: picked ? C.amber : C.bg, 'fill-opacity': picked ? 0.22 : 0.7,
            stroke: picked ? C.amber : C.line, 'stroke-width': picked ? 2 : 1
          }),
          s('text', {
            x: colX[ci] + colWidths[ci] / 2, y: HDR_Y + RH / 2 + 5,
            fill: picked ? C.amber : C.muted, 'font-size': 15 * F, 'font-weight': 700,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, col)
        );
        els.push(g);
      });

      if (showRows.length === 0) {
        const ey = HDR_Y + RH + 6;
        els.push(
          s('rect', { x: PAD_X + 1, y: ey, width: usableW - 2, height: RH * 2.4, rx: 8, fill: C.bg, stroke: C.pink, 'stroke-dasharray': '7 6' }),
          s('text', { x: VW / 2, y: ey + RH * 1.05, fill: C.pink, 'font-size': 17 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '0 rows returned (no error)'),
          s('text', { x: VW / 2, y: ey + RH * 1.65, fill: C.muted, 'font-size': 13.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `Nothing in store matches '${storeVal.replace(/ /g, '␣')}'`)
        );
      } else {
        showRows.forEach((row, ri) => {
          const y = HDR_Y + (ri + 1) * RH;
          const rowPass = !useWhere || row.store === storeVal;
          const baseCol = row.store === 'North' ? C.cyan : C.pink;
          showCols.forEach((col, ci) => {
            const colPass = selCols.has(col);
            const kept = rowPass && colPass;
            const g = s('g', col === 'store' ? { style: 'cursor:pointer' } : {});
            if (col === 'store') g.addEventListener('click', () => setWhere(true, row.store));
            g.append(
              s('rect', {
                x: colX[ci] + 1, y: y + 1, width: colWidths[ci] - 2, height: RH - 3, rx: 4,
                fill: kept ? baseCol : C.bg,
                'fill-opacity': kept ? 0.18 : 0.45,
                stroke: kept ? baseCol : C.line,
                'stroke-opacity': kept ? 0.95 : 0.35,
                'stroke-width': kept ? 1.6 : 1
              }),
              s('text', {
                x: colX[ci] + colWidths[ci] / 2, y: y + RH / 2 + 5,
                fill: kept ? (col === 'store' ? baseCol : C.ink) : C.muted,
                'fill-opacity': kept ? 1 : 0.32,
                'font-size': 15 * F, 'font-weight': kept && col === 'store' ? 700 : 500,
                'text-anchor': 'middle', 'font-family': 'Consolas'
              }, String(row[col]))
            );
            els.push(g);
          });
        });
      }
    }

    // Bottom status bar inside SVG
    const copiesSum = matchedRows.reduce((a, r) => a + r.copies, 0);
    const barY = VH - 14;
    const statusText = activeCols.length === 0
      ? 'Select at least one column'
      : `Kept: ${matchedRows.length} of ${rows.length} rows · ${activeCols.length} of ${COLS.length} columns · ${copiesSum} copies`;
    els.push(s('text', {
      x: VW / 2, y: barY, fill: matchedRows.length === 0 ? C.pink : C.green,
      'font-size': 13.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, statusText));

    svg.replaceChildren(...els);

    // SQL Formula box
    const colList = activeCols.length ? activeCols.join(', ') : '—';
    const sqlLines = [
      [`SELECT ${colList}`, activeCols.length ? C.amber : C.pink],
      ['FROM   sales', C.cyan],
    ];
    if (useWhere) {
      const shown = storeVal.replace(/ /g, '␣');
      sqlLines.push([`WHERE  store = '${shown}'`, matchedRows.length ? C.green : C.pink]);
    } else {
      sqlLines.push(['(no WHERE: all rows kept)', C.muted]);
    }
    sqlLines.push([
      matchedRows.length === 0
        ? '→ 0 rows (no error — check spelling!)'
        : `→ ${matchedRows.length} rows, ${activeCols.length} cols (${copiesSum} copies)`,
      matchedRows.length ? C.green : C.pink
    ]);
    fbox(box, sqlLines);

    note.textContent = matchedRows.length === 0
      ? 'Empty result! Databases match text letter-for-letter, including capital letters and spaces.'
      : resultOnly
        ? 'Showing only the result. Press “Show full table” to confirm nothing in sales was deleted.'
        : 'Bright cells are kept by both SELECT (columns) and WHERE (rows). Tap any header or store cell too.';

    chal.update({
      colsKey: activeCols.join(','),
      useWhere,
      storeVal,
      matched: matchedRows.length,
      testedRandomResult
    });
  }

  draw();
  return () => {};
}

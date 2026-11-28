// 3.1.1 Try it: file schemas and parsing.
// The learner taps column type badges to set a schema, edits or breaks prices,
// tests fresh random CSV files, and sees live text-gluing vs parsed totals.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const COLS = ['order', 'line', 'store', 'book', 'copies', 'price'];
  const TYPES = ['text', 'whole', 'decimal'];
  const TYPE_COLOR = { text: C.violet, whole: C.cyan, decimal: C.amber };
  const CORRECT = { order: 'whole', line: 'whole', store: 'text', book: 'text', copies: 'whole', price: 'decimal' };
  const START = [
    { order: '101', line: '1', store: 'North', book: 'B1', copies: '2', price: '$10.00' },
    { order: '101', line: '2', store: 'North', book: 'B2', copies: '1', price: '$20.00' },
    { order: '102', line: '1', store: 'South', book: 'B3', copies: '1', price: '$15.00' },
    { order: '103', line: '1', store: 'North', book: 'B2', copies: '1', price: '$20.00' },
    { order: '103', line: '2', store: 'North', book: 'B3', copies: '2', price: '$15.00' },
    { order: '104', line: '1', store: 'South', book: 'B4', copies: '1', price: '$25.00' },
  ];
  const cloneRows = arr => arr.map(r => ({ ...r }));

  let rows = cloneRows(START);
  let schema = { order: 'text', line: 'text', store: 'text', book: 'text', copies: 'text', price: 'text' };
  let sel = 0;
  let randomParsed = 0;
  let hasBrokenPrice = false;
  let breakToggle = 0;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 440, F = NARROW ? 1.1 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  function parseCell(raw, type) {
    const str = String(raw).trim();
    if (type === 'text') return { ok: true, val: str, display: `"${str}"`, kind: 'text' };
    if (str === '') return { ok: false, val: null, display: 'EMPTY !', reason: 'empty', kind: 'fail' };
    if (type === 'whole') {
      if (/^-?\d+$/.test(str)) {
        const n = parseInt(str, 10);
        return { ok: true, val: n, display: String(n), kind: 'num' };
      }
      return { ok: false, val: null, display: 'FAIL !', reason: 'not whole', kind: 'fail' };
    }
    if (type === 'decimal') {
      const stripped = str.startsWith('$') ? str.slice(1).trim() : str;
      if (/^-?\d+(\.\d+)?$/.test(stripped)) {
        const n = parseFloat(stripped);
        return { ok: true, val: n, display: fmt(n), kind: 'num' };
      }
      return { ok: false, val: null, display: 'FAIL !', reason: 'not number', kind: 'fail' };
    }
    return { ok: true, val: str, display: str, kind: 'text' };
  }

  function isFullSchema() {
    return COLS.every(c => schema[c] === CORRECT[c]);
  }

  function bumpPrice(delta) {
    const cur = parseCell(rows[sel].price, 'decimal');
    const base = cur.ok ? cur.val : 15;
    const next = Math.max(5, Math.min(95, Math.round(base + delta)));
    rows[sel].price = `$${next}.00`;
    draw();
  }

  function breakPrice() {
    rows[sel].price = breakToggle % 2 === 0 ? 'ten dollars' : '';
    breakToggle++;
    hasBrokenPrice = true;
    draw();
  }

  function fixPrice() {
    const fallback = START[sel] ? START[sel].price : '$15.00';
    rows[sel].price = fallback;
    draw();
  }

  function makeRandomData() {
    const books = ['B1', 'B2', 'B3', 'B4'];
    const baseOrder = rnd(200, 400);
    const out = [];
    let ord = baseOrder, line = 1;
    for (let i = 0; i < 6; i++) {
      if (i > 0 && rnd(0, 1) === 1) { ord++; line = 1; } else if (i > 0) { line++; }
      const store = ord % 2 === 0 ? 'North' : 'South';
      const price = rnd(1, 7) * 5;
      out.push({
        order: String(ord),
        line: String(line),
        store,
        book: books[rnd(0, 3)],
        copies: String(rnd(1, 3)),
        price: `$${price}.00`,
      });
    }
    rows = out;
    if (isFullSchema()) randomParsed++;
    draw();
  }

  function allText() {
    COLS.forEach(c => { schema[c] = 'text'; });
    draw();
  }

  function resetAll() {
    rows = cloneRows(START);
    COLS.forEach(c => { schema[c] = 'text'; });
    sel = 0;
    hasBrokenPrice = false;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: schema and parsing'),
    h('p', { class: 'sub' }, 'Tap any column’s type badge at the top to change its type (text, whole, or decimal). Tap a row to edit or break its price.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$5', () => bumpPrice(-5)),
          btn('+$5', () => bumpPrice(5)),
          btn('Break a price', breakPrice),
          btn('Fix row', fixPrice),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', makeRandomData, 'go'),
          btn('All text (raw file)', allText),
          btn('Start again', resetAll))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Right now every column is text. Tap the price type badge until it says decimal.',
      check: st => st.schema.price === 'decimal' && st.priceFails === 0,
      why: 'Yes! Stripping "$" and parsing as a decimal turns "$10.00" and "$20.00" into 10 and 20, which add to 30 instead of gluing into "1020".'
    },
    {
      text: 'Set the full schema for all six columns (order, line, copies = whole; store, book = text; price = decimal).',
      check: st => st.fullSchema && st.totalFails === 0,
      why: 'Right: store and book stay text because names and codes like B1 are labels, while the amounts become numbers.'
    },
    {
      text: 'Press “Break a price” while price is decimal, and watch the tool flag the row.',
      check: st => st.hasBrokenPrice && st.schema.price === 'decimal' && st.priceFails >= 1,
      why: 'A bad price like "ten dollars" or an empty cell fails to parse. Flagging and counting it keeps a silent zero out of your total.'
    },
    {
      text: 'With the full schema set, press “New data (random)” twice. Does the same schema parse every fresh file?',
      check: st => st.randomParsed >= 2,
      why: 'Every time. You write the schema once, and the tool parses and checks every new file that arrives.'
    },
  ]);

  // Table geometry inside SVG
  const PAD = NARROW ? 6 : 14;
  const RAW_Y = 12, RAW_H = 42;
  const HDR_Y = 68, HDR_H = 58;
  const ROW_Y0 = 136, ROW_H = 46;
  const COL_W = NARROW ? [58, 46, 70, 56, 62, 116] : [96, 74, 114, 94, 104, 190];
  const COL_X = [];
  let accX = PAD;
  for (let c = 0; c < COLS.length; c++) {
    COL_X.push(accX);
    accX += COL_W[c];
  }

  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    // Tapped a schema header badge -> cycle that column's type
    if (p.y >= HDR_Y && p.y <= HDR_Y + HDR_H) {
      for (let c = 0; c < COLS.length; c++) {
        if (p.x >= COL_X[c] && p.x <= COL_X[c] + COL_W[c]) {
          const col = COLS[c];
          schema[col] = TYPES[(TYPES.indexOf(schema[col]) + 1) % TYPES.length];
          draw();
          return;
        }
      }
    }
    // Tapped a data row -> select that row
    if (p.y >= ROW_Y0 && p.y < ROW_Y0 + rows.length * ROW_H) {
      const r = Math.floor((p.y - ROW_Y0) / ROW_H);
      if (r >= 0 && r < rows.length) {
        sel = r;
        draw();
      }
    }
  });

  function draw() {
    const k = [];
    const parsed = rows.map(r => {
      const out = {};
      COLS.forEach(c => { out[c] = parseCell(r[c], schema[c]); });
      return out;
    });

    // Top bar: raw CSV line of the selected row
    const rawCsv = COLS.map(c => rows[sel][c]).join(',');
    k.push(
      s('rect', { x: PAD, y: RAW_Y, width: VW - PAD * 2, height: RAW_H, rx: 10, fill: C.bg, stroke: C.line }),
      s('text', { x: PAD + 12, y: RAW_Y + 15, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, `RAW CSV LINE (ROW ${sel + 1})`),
      s('text', { x: PAD + 12, y: RAW_Y + 34, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, rawCsv)
    );

    // Schema header row (clickable type pills)
    COLS.forEach((col, c) => {
      const x = COL_X[c], w = COL_W[c], t = schema[col], tCol = TYPE_COLOR[t];
      const pad = 3;
      k.push(
        s('rect', { x: x + pad, y: HDR_Y, width: w - pad * 2, height: HDR_H, rx: 9, fill: '#141d3a', stroke: tCol, 'stroke-width': 1.8, style: 'cursor:pointer' }),
        s('text', { x: x + w / 2, y: HDR_Y + 21, fill: C.ink, 'font-size': (NARROW ? 12 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, col),
        s('rect', { x: x + 6, y: HDR_Y + 29, width: w - 12, height: 22, rx: 11, fill: C.bg, stroke: tCol, 'stroke-width': 1.2 }),
        s('text', { x: x + w / 2, y: HDR_Y + 44, fill: tCol, 'font-size': (NARROW ? 10 : 12) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t)
      );
    });

    // 6 glowing data rows
    let totalFails = 0, priceFails = 0;
    rows.forEach((row, r) => {
      const y = ROW_Y0 + r * ROW_H;
      const rowColor = row.store === 'North' ? C.cyan : C.pink;
      if (r === sel) {
        k.push(s('rect', { x: PAD - 2, y: y - 2, width: VW - PAD * 2 + 4, height: ROW_H, rx: 9, fill: '#ffffff', 'fill-opacity': 0.06, stroke: C.amber, 'stroke-width': 1.4 }));
      }
      COLS.forEach((col, c) => {
        const x = COL_X[c], w = COL_W[c], cell = parsed[r][col];
        if (!cell.ok) { totalFails++; if (col === 'price') priceFails++; }
        const isEmpty = String(row[col]).trim() === '';
        const stroke = !cell.ok ? C.pink : cell.kind === 'num' ? C.green : rowColor;
        const fill = isEmpty ? C.muted : !cell.ok ? C.pink : cell.kind === 'num' ? C.green : rowColor;
        const fillOp = isEmpty ? 0.16 : !cell.ok ? 0.22 : cell.kind === 'num' ? 0.14 : 0.08;
        const txtCol = !cell.ok ? C.pink : cell.kind === 'num' ? C.green : C.ink;
        let disp = cell.display;
        if (NARROW && disp.length > 10) disp = disp.slice(0, 9) + '…';
        k.push(
          s('rect', { x: x + 3, y: y + 3, width: w - 6, height: ROW_H - 8, rx: 7, fill, 'fill-opacity': fillOp, stroke, 'stroke-width': !cell.ok ? 2 : 1.2, style: 'cursor:pointer' }),
          s('text', { x: x + w / 2, y: y + ROW_H / 2 + 4, fill: txtCol, 'font-size': (NARROW ? 11.5 : 14) * F, 'font-weight': cell.kind === 'text' ? 500 : 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, disp)
        );
      });
    });

    // Bottom hint line inside SVG
    const hint = totalFails > 0
      ? `Flagged: ${totalFails} value${totalFails > 1 ? 's' : ''} failed to parse (never turned into 0)`
      : isFullSchema()
        ? 'All 6 columns match the schema · North = cyan, South = pink'
        : 'Tap any column badge above to switch between text, whole, and decimal';
    k.push(s('text', { x: VW / 2, y: VH - 10, fill: totalFails > 0 ? C.pink : C.muted, 'font-size': (NARROW ? 11 : 13) * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, hint));
    svg.replaceChildren(...k);

    // Formula box: live demonstration of text gluing vs parsed arithmetic
    const shortStr = str => String(str).trim().replace(/^\$/, '').replace(/\.00$/, '');
    if (schema.price === 'text') {
      const a = shortStr(rows[0].price) || '""', b = shortStr(rows[1].price) || '""';
      fbox(box, [
        ['price type: text (not parsed)', C.pink],
        [`row 1 + row 2: "${a}" + "${b}" = "${a + b}"`, C.pink],
        ['total sales: cannot add text!', C.amber],
        [`parse failures: ${totalFails}`, totalFails > 0 ? C.pink : C.muted],
      ]);
      note.textContent = 'While price is text, adding glues the pieces side by side instead of adding numbers. Tap the price badge to set it to decimal.';
    } else if (schema.price === 'whole') {
      fbox(box, [
        ['price type: whole number', C.amber],
        [`parsed ok: ${rows.length - priceFails}   failed: ${priceFails}`, C.pink],
        ['prices like "$10.00" need decimal!', C.pink],
      ]);
      note.textContent = 'Prices arrive with "$" and a dot ("$10.00"), so a whole-number parser rejects them. Tap price once more to set decimal.';
    } else {
      const p0 = parsed[0].price, p1 = parsed[1].price;
      const pairLine = p0.ok && p1.ok
        ? [`row 1 + row 2: ${fmt(p0.val)} + ${fmt(p1.val)} = ${fmt(p0.val + p1.val)}`, C.green]
        : ['row 1 + row 2: flagged row skipped', C.pink];
      let validRows = 0, revenue = 0, priceSum = 0;
      for (let r = 0; r < rows.length; r++) {
        const pr = parsed[r].price, cp = parsed[r].copies;
        if (pr.ok) {
          validRows++;
          priceSum += pr.val;
          if (cp.ok && cp.kind === 'num') revenue += cp.val * pr.val;
        }
      }
      const copiesNumeric = schema.copies === 'whole' || schema.copies === 'decimal';
      const totalLine = copiesNumeric
        ? [`total sales (valid rows): $${fmt(revenue)}`, priceFails > 0 ? C.amber : C.green]
        : [`sum of prices: $${fmt(priceSum)} (set copies → whole)`, C.cyan];
      fbox(box, [
        ['price type: decimal (parsed!)', C.green],
        pairLine,
        totalLine,
        [`parsed ok: ${validRows}   failed: ${totalFails}`, totalFails > 0 ? C.pink : C.green],
      ]);
      note.textContent = totalFails > 0
        ? 'Bad values are flagged and counted — never quietly turned into zero.'
        : isFullSchema()
          ? 'Schema first, then parse, then calculate. Try “New data (random)” to check that the same schema handles fresh files.'
          : 'Prices now parse cleanly! Try setting order, line, and copies to whole, and see what happens if you set store or book to a number.';
    }

    selLabel.textContent = `Selected: row ${sel + 1} (${rows[sel].store}, ${rows[sel].book}, ${rows[sel].price || 'empty'})`;
    chal.update({
      schema: { ...schema },
      fullSchema: isFullSchema(),
      totalFails,
      priceFails,
      hasBrokenPrice,
      randomParsed,
    });
  }

  draw();
  return () => {};
}

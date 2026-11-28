// 3.1.2 Try it: flattening a nested JSON order into flat table rows.
// The learner edits a live nested order (add/remove items, change copies/price, switch store),
// generates random orders, inspects the row-count trap, and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const BOOKS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
  const ITEM_COLS = [C.amber, C.violet, C.green, C.cyan];
  const makeStart = () => ({
    order: 103,
    store: 'North',
    items: [
      { book: 'B2', copies: 1, price: 20 },
      { book: 'B3', copies: 2, price: 15 }
    ]
  });

  let data = makeStart();
  let sel = 0;
  let showTrap = false;
  let randomCount = 0;
  let storeToggles = 0;
  let lastAction = 'Tap any item in the JSON or table to select it. Order and store copy onto every flat row.';

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700;
  const VH = 472;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const trapBtn = btn('Show row-count trap', () => {
    showTrap = !showTrap;
    trapBtn.textContent = showTrap ? 'Hide row-count trap' : 'Show row-count trap';
    trapBtn.className = 'sim-btn ' + (showTrap ? 'go' : '');
    lastAction = showTrap
      ? `Trap view on: order ${data.order} appears ${data.items.length} times, so counting rows counts items, not orders.`
      : 'Trap view hidden. Keep exploring how each item becomes one flat row.';
    draw();
  });

  function addItem() {
    if (data.items.length >= 4) return;
    const used = new Set(data.items.map(it => it.book));
    const nextBook = BOOKS.find(b => !used.has(b)) || BOOKS[rnd(0, BOOKS.length - 1)];
    data.items.push({ book: nextBook, copies: rnd(1, 3), price: rnd(2, 5) * 5 });
    sel = data.items.length - 1;
    lastAction = `Added ${nextBook} to the list: a new flat row appeared with order ${data.order} and store ${data.store} copied in.`;
    draw();
  }

  function removeItem() {
    if (data.items.length <= 1) return;
    const removed = data.items.splice(sel, 1)[0];
    sel = Math.min(sel, data.items.length - 1);
    lastAction = `Removed ${removed.book}: now ${data.items.length} item${data.items.length > 1 ? 's' : ''} in the JSON and ${data.items.length} flat row${data.items.length > 1 ? 's' : ''}.`;
    draw();
  }

  function bumpCopies(d) {
    const it = data.items[sel];
    it.copies = Math.max(1, Math.min(9, it.copies + d));
    lastAction = `Changed ${it.book} to ${it.copies} cop${it.copies === 1 ? 'y' : 'ies'}. Notice the row amount and order total update together.`;
    draw();
  }

  function bumpPrice(d) {
    const it = data.items[sel];
    it.price = Math.max(5, Math.min(60, it.price + d));
    lastAction = `Changed ${it.book} price to $${it.price}. Nothing is lost when flattened.`;
    draw();
  }

  function toggleStore() {
    data.store = data.store === 'North' ? 'South' : 'North';
    storeToggles++;
    lastAction = `Switched store to ${data.store} once in the JSON — every flat row updated to ${data.store} automatically.`;
    draw();
  }

  function newOrder() {
    const count = rnd(2, 4);
    const pool = BOOKS.slice();
    const items = [];
    for (let i = 0; i < count; i++) {
      const idx = rnd(0, pool.length - 1);
      const book = pool.splice(idx, 1)[0];
      items.push({ book, copies: rnd(1, 3), price: rnd(2, 6) * 5 });
    }
    data = {
      order: rnd(105, 199),
      store: rnd(0, 1) === 0 ? 'North' : 'South',
      items
    };
    sel = 0;
    randomCount++;
    lastAction = `New random order #${data.order} (${data.store}) with ${count} items → ${count} flat rows, still 1 order.`;
    draw();
  }

  function resetAll() {
    data = makeStart();
    sel = 0;
    showTrap = false;
    trapBtn.textContent = 'Show row-count trap';
    trapBtn.className = 'sim-btn';
    lastAction = 'Back to order 103 (North): book B2 (1 × $20) and book B3 (2 × $15), total $50.';
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: flattening a JSON order'),
    h('p', { class: 'sub' }, 'Edit the nested order on top and watch the flat table below update live. Tap any item to select it, or make a new random order.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Copies −1', () => bumpCopies(-1)),
          btn('Copies +1', () => bumpCopies(1)),
          btn('Price −$5', () => bumpPrice(-5)),
          btn('Price +$5', () => bumpPrice(5)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Switch store (North ↔ South)', toggleStore),
          btn('Add an item', addItem, 'go'),
          btn('Remove item', removeItem),
          trapBtn,
          btn('New order (random)', newOrder),
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const calcTotal = () => data.items.reduce((sum, it) => sum + it.copies * it.price, 0);

  const chal = challenges(ch, [
    {
      text: 'Add an item so the order has at least 3 items. Watch the order and store repeat on every flat row.',
      check: st => st.items.length >= 3,
      why: 'Right! Three items in the JSON list become three flat rows, and the shared order and store fields repeat on every row.'
    },
    {
      text: 'Switch the store between North and South. Notice how every flat row updates together.',
      check: st => st.storeToggles >= 1,
      why: 'Yes! Because the store belongs to the whole order, changing it once in the JSON changes it on every flat row.'
    },
    {
      text: 'Adjust copies or prices until the full order total is exactly $80, with at least 2 items.',
      check: st => st.total === 80 && st.items.length >= 2,
      why: 'Exact match! Adding copies × price across the flat rows always gives the full value of the order ($80).'
    },
    {
      text: 'Press “New order (random)” at least twice, then press “Show row-count trap”. How many orders are in the table?',
      check: st => st.randomCount >= 2 && st.showTrap,
      why: 'Still only 1 order! After flattening, rows count items, not orders — no matter how many items are in the bag.'
    }
  ]);

  svg.addEventListener('click', e => {
    const target = e.target.closest('[data-item]');
    if (!target) return;
    sel = Number(target.getAttribute('data-item'));
    const it = data.items[sel];
    lastAction = `Selected item ${sel + 1}: book ${it.book} (${it.copies} × $${it.price} = $${it.copies * it.price}).`;
    draw();
  });

  function draw() {
    const n = data.items.length;
    const storeCol = data.store === 'North' ? C.cyan : C.pink;
    const padX = NARROW ? 8 : 16;
    const cardW = VW - padX * 2;
    const jFont = NARROW ? 12.2 : 14.5;
    const k = [];

    // --- TOP: Nested JSON record card ---
    const jTop = 10, jH = 204;
    k.push(s('rect', { x: padX, y: jTop, width: cardW, height: jH, rx: 12, fill: C.bg, stroke: storeCol, 'stroke-width': 2 }));
    // Pill label top-right inside JSON card
    const pillW = NARROW ? 148 : 186;
    k.push(
      s('rect', { x: padX + cardW - pillW - 10, y: jTop + 8, width: pillW, height: 22, rx: 11, fill: C.card, stroke: storeCol, 'stroke-width': 1.2 }),
      s('text', { x: padX + cardW - pillW / 2 - 10, y: jTop + 23, fill: storeCol, 'font-size': NARROW ? 10.5 : 11.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, 'NESTED JSON · 1 RECORD')
    );

    const lx = padX + (NARROW ? 12 : 18);
    const mono = (x, y, text, fill, weight = 400) =>
      s('text', { x, y, fill, 'font-size': jFont, 'font-weight': weight, 'font-family': 'Consolas, monospace', style: 'pointer-events:none' }, text);

    k.push(mono(lx, jTop + 28, '{', C.amber, 700));
    k.push(mono(lx, jTop + 48, `  "order": ${data.order},  "store": "${data.store}",`, storeCol, 700));
    k.push(mono(lx, jTop + 68, '  "items": [', C.green, 700));

    data.items.forEach((it, i) => {
      const ry = jTop + 74 + i * 24;
      const col = ITEM_COLS[i % ITEM_COLS.length];
      const isSel = i === sel;
      const comma = i < n - 1 ? ',' : '';
      const lineTxt = `    {"book":"${it.book}", "copies":${it.copies}, "price":${it.price}}${comma}`;
      k.push(s('rect', {
        x: padX + 8, y: ry, width: cardW - 16, height: 22, rx: 6,
        fill: isSel ? col : 'transparent', 'fill-opacity': isSel ? 0.16 : 0,
        stroke: isSel ? col : 'none', 'stroke-width': 1.2,
        'data-item': i, style: 'cursor:pointer'
      }));
      k.push(s('circle', { cx: lx + 6, cy: ry + 11, r: 3.5, fill: col, style: 'pointer-events:none' }));
      k.push(mono(lx + 4, ry + 15.5, lineTxt, isSel ? col : C.ink, isSel ? 700 : 400));
    });

    const closeY = jTop + 74 + n * 24 + 14;
    k.push(mono(lx, closeY, '  ]', C.green, 700));
    k.push(mono(lx, closeY + 18, '}', C.amber, 700));

    // --- MIDDLE: Flatten connector bar ---
    const midY = jTop + jH + 22;
    k.push(
      s('line', { x1: VW / 2, y1: jTop + jH + 3, x2: VW / 2, y2: midY + 11, stroke: C.green, 'stroke-width': 2.5 }),
      s('polygon', { points: `${VW / 2 - 6},${midY + 8} ${VW / 2 + 6},${midY + 8} ${VW / 2},${midY + 16}`, fill: C.green }),
      s('rect', { x: VW / 2 - (NARROW ? 154 : 210), y: midY - 12, width: NARROW ? 308 : 420, height: 22, rx: 11, fill: C.card, stroke: C.green, 'stroke-width': 1.2 }),
      s('text', { x: VW / 2, y: midY + 3, fill: C.green, 'font-size': NARROW ? 11 : 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' },
        `FLATTEN → ${n} FLAT ROW${n === 1 ? '' : 'S'} (REPEAT ORDER & STORE)`)
    );

    // --- BOTTOM: Flat table ---
    const tTop = midY + 22;
    const cols = NARROW
      ? [56, 66, 44, 52, 58, 62, 66]
      : [88, 102, 74, 86, 98, 102, 118];
    const hdrs = NARROW
      ? ['Order', 'Store', 'Line', 'Book', 'Copies', 'Price', 'Amt']
      : ['Order', 'Store', 'Line', 'Book', 'Copies', 'Price', 'Amount'];
    const tW = cols.reduce((a, b) => a + b, 0);
    const tX = (VW - tW) / 2;
    const hdrH = 30, rowH = 34;
    const tH = hdrH + n * rowH;

    k.push(s('rect', { x: tX, y: tTop, width: tW, height: tH, rx: 10, fill: C.bg, stroke: C.line, 'stroke-width': 2 }));
    k.push(s('rect', { x: tX, y: tTop, width: tW, height: hdrH, rx: 8, fill: '#182242' }));

    let cxAcc = tX;
    const colCenters = cols.map(w => { const c = cxAcc + w / 2; cxAcc += w; return c; });

    // Column grid lines
    let gx = tX;
    for (let c = 0; c < cols.length - 1; c++) {
      gx += cols[c];
      k.push(s('line', { x1: gx, y1: tTop, x2: gx, y2: tTop + tH, stroke: C.line, 'stroke-width': 1.2 }));
    }
    // Header text
    hdrs.forEach((hTxt, c) => {
      k.push(s('text', {
        x: colCenters[c], y: tTop + 19.5, fill: C.muted,
        'font-size': NARROW ? 11.5 : 13.5, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, hTxt));
    });

    // Data rows
    data.items.forEach((it, i) => {
      const ry = tTop + hdrH + i * rowH;
      const col = ITEM_COLS[i % ITEM_COLS.length];
      const isSel = i === sel;
      k.push(s('line', { x1: tX, y1: ry, x2: tX + tW, y2: ry, stroke: C.line, 'stroke-width': 1.2 }));
      k.push(s('rect', {
        x: tX + 2, y: ry + 2, width: tW - 4, height: rowH - 4, rx: 5,
        fill: isSel ? col : 'transparent', 'fill-opacity': isSel ? 0.14 : 0,
        stroke: isSel ? col : 'none', 'stroke-width': 1.4,
        'data-item': i, style: 'cursor:pointer'
      }));
      const vals = [
        [String(data.order), showTrap ? C.pink : storeCol],
        [data.store, storeCol],
        [String(i + 1), C.green],
        [it.book, col],
        [String(it.copies), col],
        ['$' + it.price, col],
        ['$' + (it.copies * it.price), C.ink]
      ];
      vals.forEach(([txt, fill], c) => {
        k.push(s('text', {
          x: colCenters[c], y: ry + 21.5, fill,
          'font-size': NARROW ? 12.5 : 14.5, 'font-weight': c <= 2 || isSel ? 700 : 500,
          'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
          style: 'pointer-events:none'
        }, txt));
      });
    });

    // Optional trap highlight around repeated Order column
    if (showTrap) {
      k.push(s('rect', {
        x: tX + 3, y: tTop + hdrH + 3, width: cols[0] - 6, height: n * rowH - 6, rx: 6,
        fill: C.pink, 'fill-opacity': 0.12, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '6 4',
        style: 'pointer-events:none'
      }));
    }

    // Footer status banner inside SVG
    const footY = tTop + tH + 22;
    if (showTrap) {
      k.push(
        s('rect', { x: padX, y: footY - 14, width: cardW, height: 28, rx: 14, fill: '#2a1224', stroke: C.pink, 'stroke-width': 1.5 }),
        s('text', { x: VW / 2, y: footY + 4, fill: C.pink, 'font-size': NARROW ? 11.5 : 13.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' },
          `TRAP: ${n} rows ≠ ${n} orders — still 1 order (#${data.order})`)
      );
    } else {
      k.push(s('text', {
        x: VW / 2, y: footY + 3, fill: C.muted,
        'font-size': NARROW ? 11.5 : 13, 'text-anchor': 'middle', 'font-family': '"Segoe UI", Arial, sans-serif'
      }, 'Tap any item in the JSON or table to select it. Line numbers are added in order.'));
    }

    svg.replaceChildren(...k);

    // Formula / check box
    const total = calcTotal();
    const lines = [
      [`order  = #${data.order}  (${data.store})`, storeCol],
      [`shape  = 1 order → ${n} flat row${n === 1 ? '' : 's'}`, C.green],
      ...data.items.map((it, i) => [
        `row ${i + 1}  = ${it.copies} × $${it.price} = $${it.copies * it.price}  (${it.book})`,
        i === sel ? ITEM_COLS[i % ITEM_COLS.length] : C.ink
      ]),
      [`total  = $${total}  (nothing lost ✓)`, C.amber]
    ];
    if (showTrap) {
      lines.push([`rows   = ${n} items  (only 1 order!)`, C.pink]);
    }
    fbox(box, lines);

    const cur = data.items[sel];
    selLabel.textContent = `Selected: row ${sel + 1} · ${cur.book} (${cur.copies} × $${cur.price})`;
    note.textContent = lastAction;

    chal.update({
      order: data.order,
      store: data.store,
      items: data.items,
      total,
      showTrap,
      randomCount,
      storeToggles
    });
  }

  draw();
  return () => {};
}

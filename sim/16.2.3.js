// 16.2.3 Try it: incremental processing — update Monday's total without repeating earlier work.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const START_EARLIER = [
    { id: 'A', shop: 'North', time: 'Mon 9 am', amount: 4 },
    { id: 'C', shop: 'South', time: 'Mon 10 am', amount: 6 },
    { id: 'D', shop: 'South', time: 'Mon noon', amount: 10 },
    { id: 'E', shop: 'South', time: 'Mon 2 pm', amount: 14 },
  ];
  const START_B = { id: 'B', shop: 'North', time: 'Mon 11 am', amount: 8, isCopy: false };

  let earlier = START_EARLIER.map(t => ({ ...t }));
  let extraEarlierCount = 0;   // total earlier tickets = earlier.length + extraEarlierCount
  let extraEarlierSum = 0;
  let savedTotal = 34;
  let trueTotal = 34;
  let countedTickets = earlier.map(t => ({ ...t }));
  let waiting = [{ ...START_B }];
  let bAmount = 8;
  let bCount = 0;
  let nextLetter = 0;          // H, I, J, ...
  let lastMode = 'ready';      // 'ready' | 'inc' | 'full'
  let lastAdded = null;
  let lastPrev = 34;
  let lastReads = 0;
  let dupCounted = false;
  let fresh = false;
  let freshIncDone = false;
  let incRunsAtScale = 0;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div', { role: 'status', 'aria-atomic': 'true' });
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const waitLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const scaleLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const scaleSlider = h('input', {
    type: 'range', min: 4, max: 1000, step: 1, value: 4,
    'aria-label': 'Number of earlier Monday sales already in saved total',
    style: { flex: '1 1 160px', minHeight: '44px', accentColor: C.cyan },
    oninput: () => setEarlierScale(Number(scaleSlider.value))
  });

  function makeLateSale() {
    const letters = 'HIJKLMNOPQRSTUVWXYZ';
    const id = letters[nextLetter % letters.length];
    nextLetter++;
    const shop = nextLetter % 2 === 1 ? 'North' : 'South';
    return { id, shop, time: 'Mon late', amount: rnd(3, 18), isCopy: false };
  }

  function setEarlierScale(count) {
    extraEarlierCount = Math.max(0, count - 4);
    extraEarlierSum = extraEarlierCount * 9;
    // Keep savedTotal consistent with the extra earlier sales
    const baseIncluded = countedTickets.reduce((a, t) => a + t.amount, 0);
    const baseUnique = countedTickets.filter((t, idx) =>
      t.id !== 'B' || countedTickets.findIndex(x => x.id === 'B') === idx
    ).reduce((a, t) => a + t.amount, 0);
    savedTotal = baseIncluded + extraEarlierSum;
    trueTotal = baseUnique + extraEarlierSum;
    // Ensure a ticket is ready to test the incremental update at the new scale
    if (!waiting.length) waiting.push(makeLateSale());
    draw();
  }

  function bumpWaiting(delta) {
    if (!waiting.length) waiting.push(makeLateSale());
    const w = waiting[0];
    w.amount = Math.max(1, Math.min(50, w.amount + delta));
    if (w.id === 'B' && !w.isCopy) bAmount = w.amount;
    draw();
  }

  function updateIncrementally() {
    if (!waiting.length) waiting.push(makeLateSale());
    const ticket = waiting.shift();
    lastPrev = savedTotal;
    savedTotal += ticket.amount;
    countedTickets.push({ ...ticket });
    const alreadyHadB = ticket.id === 'B' && bCount >= 1;
    if (ticket.id === 'B') bCount++;
    if (alreadyHadB) {
      dupCounted = true;
    } else {
      trueTotal += ticket.amount;
    }
    lastMode = 'inc';
    lastAdded = ticket;
    lastReads = 1;
    if (fresh) freshIncDone = true;
    if (earlier.length + extraEarlierCount >= 500) incRunsAtScale++;
    draw();
  }

  function recalculateAll() {
    if (waiting.length) {
      const ticket = waiting.shift();
      countedTickets.push({ ...ticket });
      if (ticket.id === 'B') {
        if (bCount >= 1) dupCounted = true;
        else trueTotal += ticket.amount;
        bCount++;
      } else {
        trueTotal += ticket.amount;
      }
      lastAdded = ticket;
    } else {
      lastAdded = null;
    }
    lastPrev = 0;
    savedTotal = countedTickets.reduce((a, t) => a + t.amount, 0) + extraEarlierSum;
    lastMode = 'full';
    lastReads = countedTickets.length + extraEarlierCount;
    draw();
  }

  function sendDuplicateB() {
    waiting.unshift({ id: 'B', shop: 'North', time: 'Mon 11 am', amount: bAmount, isCopy: true });
    draw();
  }

  function addNewSale() {
    waiting.push(makeLateSale());
    draw();
  }

  function newData() {
    earlier = START_EARLIER.map(t => ({ ...t, amount: rnd(3, 18) }));
    bAmount = rnd(4, 18);
    extraEarlierCount = 0;
    extraEarlierSum = 0;
    scaleSlider.value = 4;
    countedTickets = earlier.map(t => ({ ...t }));
    savedTotal = earlier.reduce((a, t) => a + t.amount, 0);
    trueTotal = savedTotal;
    waiting = [{ ...START_B, amount: bAmount, isCopy: false }];
    bCount = 0;
    lastMode = 'ready';
    lastAdded = null;
    lastPrev = savedTotal;
    lastReads = 0;
    dupCounted = false;
    fresh = true;
    freshIncDone = false;
    incRunsAtScale = 0;
    draw();
  }

  function reset() {
    earlier = START_EARLIER.map(t => ({ ...t }));
    bAmount = 8;
    extraEarlierCount = 0;
    extraEarlierSum = 0;
    scaleSlider.value = 4;
    countedTickets = earlier.map(t => ({ ...t }));
    savedTotal = 34;
    trueTotal = 34;
    waiting = [{ ...START_B }];
    bCount = 0;
    nextLetter = 0;
    lastMode = 'ready';
    lastAdded = null;
    lastPrev = 34;
    lastReads = 0;
    dupCounted = false;
    fresh = false;
    freshIncDone = false;
    incRunsAtScale = 0;
    draw();
  }

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: incremental processing'),
    h('p', { class: 'sub' },
      'Compare keeping the previous total and adding only the newly received ticket against reading every ticket from zero again.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          btn('Update incrementally', updateIncrementally, 'go'),
          btn('Recalculate all from $0', recalculateAll),
          btn('Send Ticket B again', sendDuplicateB)),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$1', () => bumpWaiting(-1)),
          btn('+$1', () => bumpWaiting(1)),
          btn('Add late sale', addNewSale),
          waitLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('label', { style: { fontWeight: '600' } }, 'Earlier sales'),
          scaleSlider,
          scaleLabel),
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch))));
  root.append(panel);

  const getState = () => ({
    lastMode, bCount, dupCounted, fresh, freshIncDone,
    earlierCount: earlier.length + extraEarlierCount,
    incRunsAtScale, savedTotal, trueTotal
  });

  const chal = challenges(ch, [
    {
      text: 'Press “Update incrementally” to add Ticket B ($8) to the saved $34 total.',
      check: st => st.lastMode === 'inc' && st.bCount === 1 && !st.fresh && st.earlierCount === 4,
      why: 'Yes! The computer kept $34 and added only Ticket B ($8) to get $42, without reading A, C, D, or E again.'
    },
    {
      text: 'Press “Send Ticket B again”, then press “Update incrementally”. Watch Monday’s total.',
      check: st => st.dupCounted,
      why: 'Ticket B was counted twice, raising the total $8 too high. The computer must track which tickets it already counted.'
    },
    {
      text: 'Move the “Earlier sales” slider to 500 or more, then press “Update incrementally”.',
      check: st => st.lastMode === 'inc' && st.earlierCount >= 500 && st.incRunsAtScale >= 1,
      why: 'Even with hundreds of earlier sales, incremental processing reads only 1 new ticket instead of starting from zero.'
    },
    {
      text: 'Press “New data”, then press “Update incrementally”. Does the formula still hold?',
      check: st => st.fresh && st.lastMode === 'inc' && st.freshIncDone,
      why: 'Always. For any dollar amounts, new total equals previous total plus the amount from the new sale.'
    }
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 560 : 420;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function slipEl(t, x, y, w, hgt, overrideCol = null, badgeText = '') {
    const col = overrideCol || (t.shop === 'North' ? C.cyan : C.amber);
    const out = [
      s('rect', { x, y, width: w, height: hgt, rx: 8, fill: C.card, stroke: col, 'stroke-width': 2 }),
      s('rect', { x: x + 7, y: y + 8, width: 28, height: hgt - 16, rx: 5, fill: col, 'fill-opacity': 0.18, stroke: col, 'stroke-width': 1.2 }),
      s('text', { x: x + 21, y: y + hgt / 2 + 5, fill: col, 'font-size': 16, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, t.id),
      s('text', { x: x + 44, y: y + hgt / 2 - 4, fill: col, 'font-size': 14, 'font-weight': 700, 'font-family': 'Segoe UI, Arial' }, t.shop),
      s('text', { x: x + 44, y: y + hgt / 2 + 14, fill: badgeText ? C.pink : C.muted, 'font-size': 11.5, 'font-family': 'Consolas' }, badgeText || t.time),
      s('text', { x: x + w - 12, y: y + hgt / 2 + 6, fill: col, 'font-size': 18, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `$${t.amount}`)
    ];
    return out;
  }

  function draw() {
    const k = [];
    const totalEarlier = earlier.length + extraEarlierCount;
    const allReads = countedTickets.length + extraEarlierCount + (waiting.length ? 1 : 0);
    const shownFullReads = lastMode === 'full' ? lastReads : Math.max(allReads, totalEarlier + 1);
    const shownIncReads = 1;
    const isDup = dupCounted && savedTotal !== trueTotal;
    const boxCol = isDup ? C.pink : (lastMode === 'inc' ? C.green : C.cyan);

    if (!NARROW) {
      // Desktop SVG (700 x 420)
      k.push(s('text', { x: 16, y: 24, fill: C.muted, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' },
        `EARLIER TICKETS ALREADY SAVED (${totalEarlier})`));

      const earlierBorderCol = lastMode === 'full' ? C.pink : (lastMode === 'inc' ? C.green : C.line);
      k.push(s('rect', { x: 14, y: 32, width: 350, height: extraEarlierCount > 0 ? 166 : 136, rx: 10, fill: C.bg, stroke: earlierBorderCol, 'stroke-width': 1.5, 'stroke-dasharray': lastMode === 'inc' ? '6 4' : '' }));

      earlier.forEach((t, i) => {
        const cx = 22 + (i % 2) * 170;
        const cy = 40 + Math.floor(i / 2) * 62;
        k.push(...slipEl(t, cx, cy, 164, 54, lastMode === 'full' ? C.pink : null, lastMode === 'full' ? 'RE-READ' : (lastMode === 'inc' ? 'SKIPPED' : '')));
      });

      if (extraEarlierCount > 0) {
        k.push(
          s('rect', { x: 22, y: 166, width: 334, height: 24, rx: 6, fill: C.card, stroke: earlierBorderCol }),
          s('text', { x: 189, y: 182, fill: lastMode === 'full' ? C.pink : C.green, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            `+${extraEarlierCount} more earlier sales ($${extraEarlierSum}) · ${lastMode === 'full' ? 'ALL RE-READ' : 'NOT RE-READ'}`)
        );
      }

      // Waiting ticket area
      k.push(s('text', { x: 16, y: 224, fill: C.cyan, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' },
        waiting.length ? `NEWLY RECEIVED TICKET (${waiting.length} WAITING)` : 'NEWLY RECEIVED TICKET'));

      if (waiting.length) {
        const w0 = waiting[0];
        const col = w0.isCopy ? C.pink : C.cyan;
        k.push(...slipEl(w0, 14, 234, 350, 66, col, w0.isCopy ? 'COPY 2 · SENT AGAIN' : `${w0.time} · NEW`));
      } else {
        k.push(
          s('rect', { x: 14, y: 234, width: 350, height: 66, rx: 8, fill: C.bg, stroke: C.line, 'stroke-dasharray': '6 5' }),
          s('text', { x: 189, y: 272, fill: C.muted, 'font-size': 13.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'No waiting tickets (all counted)')
        );
      }

      // Arrows to Monday Total box
      const incCol = lastMode === 'inc' ? C.green : C.cyan;
      k.push(
        s('line', { x1: 368, y1: 266, x2: 404, y2: 206, stroke: incCol, 'stroke-width': 3 }),
        s('polygon', { points: '408,200 397,205 405,212', fill: incCol })
      );
      if (lastMode === 'full') {
        k.push(
          s('line', { x1: 368, y1: 100, x2: 404, y2: 148, stroke: C.pink, 'stroke-width': 3 }),
          s('polygon', { points: '408,154 405,142 397,149', fill: C.pink })
        );
      }

      // Monday Total Box
      k.push(
        s('rect', { x: 410, y: 42, width: 276, height: 258, rx: 14, fill: C.bg, stroke: boxCol, 'stroke-width': 2.5 }),
        s('text', { x: 548, y: 76, fill: C.muted, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MONDAY TOTAL'),
        s('line', { x1: 432, y1: 90, x2: 664, y2: 90, stroke: C.line }),
        s('text', { x: 548, y: 174, fill: boxCol, 'font-size': 58, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `$${savedTotal}`),
        s('text', { x: 548, y: 214, fill: C.muted, 'font-size': 13.5, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${countedTickets.length + extraEarlierCount} ticket entries in total`),
        s('rect', { x: 428, y: 236, width: 240, height: 38, rx: 19, fill: C.card, stroke: boxCol }),
        s('text', { x: 548, y: 260, fill: boxCol, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          isDup ? `WRONG! TRUE TOTAL $${trueTotal}` : (lastMode === 'inc' ? 'SAVED · INCREMENTAL' : (lastMode === 'full' ? 'RECALCULATED FROM $0' : 'SAVED AT 6:00 AM')))
      );

      // Work comparison bars (bottom)
      const barX = 136, maxBarW = 448;
      const incW = Math.max(10, Math.round((shownIncReads / shownFullReads) * maxBarW));
      k.push(
        s('rect', { x: 14, y: 318, width: 672, height: 92, rx: 10, fill: C.bg, stroke: C.line }),
        s('text', { x: 26, y: 339, fill: C.muted, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' }, 'WORK COMPARISON — TICKETS READ FOR ONE UPDATE'),
        s('text', { x: 26, y: 367, fill: C.green, 'font-size': 13.5, 'font-weight': 700, 'font-family': 'Consolas' }, 'Incremental'),
        s('rect', { x: barX, y: 353, width: incW, height: 18, rx: 4, fill: C.green }),
        s('text', { x: barX + incW + 10, y: 367, fill: C.green, 'font-size': 13.5, 'font-weight': 700, 'font-family': 'Consolas' }, '1 new ticket'),
        s('text', { x: 26, y: 395, fill: C.pink, 'font-size': 13.5, 'font-weight': 700, 'font-family': 'Consolas' }, 'Re-read all'),
        s('rect', { x: barX, y: 381, width: maxBarW, height: 18, rx: 4, fill: C.pink, 'fill-opacity': 0.85 }),
        s('text', { x: barX + maxBarW + 10, y: 395, fill: C.pink, 'font-size': 13.5, 'font-weight': 700, 'font-family': 'Consolas' }, `${shownFullReads} tickets`)
      );
    } else {
      // Narrow / phone SVG (400 x 560)
      k.push(s('text', { x: 12, y: 20, fill: C.muted, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' },
        `EARLIER SAVED TICKETS (${totalEarlier})`));
      const earlierBorderCol = lastMode === 'full' ? C.pink : (lastMode === 'inc' ? C.green : C.line);
      k.push(s('rect', { x: 10, y: 28, width: 380, height: extraEarlierCount > 0 ? 156 : 128, rx: 10, fill: C.bg, stroke: earlierBorderCol }));

      earlier.forEach((t, i) => {
        const cx = 16 + (i % 2) * 186;
        const cy = 35 + Math.floor(i / 2) * 58;
        k.push(...slipEl(t, cx, cy, 182, 52, lastMode === 'full' ? C.pink : null, lastMode === 'full' ? 'RE-READ' : (lastMode === 'inc' ? 'SKIPPED' : '')));
      });

      if (extraEarlierCount > 0) {
        k.push(
          s('rect', { x: 16, y: 154, width: 368, height: 24, rx: 6, fill: C.card, stroke: earlierBorderCol }),
          s('text', { x: 200, y: 170, fill: lastMode === 'full' ? C.pink : C.green, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
            `+${extraEarlierCount} more earlier ($${extraEarlierSum})`)
        );
      }

      k.push(s('text', { x: 12, y: 204, fill: C.cyan, 'font-size': 12.5, 'font-weight': 700, 'font-family': 'Consolas' },
        waiting.length ? `NEWLY RECEIVED (${waiting.length} WAITING)` : 'NEWLY RECEIVED'));

      if (waiting.length) {
        const w0 = waiting[0];
        k.push(...slipEl(w0, 10, 212, 380, 62, w0.isCopy ? C.pink : C.cyan, w0.isCopy ? 'COPY 2 · SENT AGAIN' : `${w0.time} · NEW`));
      } else {
        k.push(
          s('rect', { x: 10, y: 212, width: 380, height: 62, rx: 8, fill: C.bg, stroke: C.line, 'stroke-dasharray': '6 5' }),
          s('text', { x: 200, y: 248, fill: C.muted, 'font-size': 13.5, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'No waiting tickets (all counted)')
        );
      }

      const incCol = lastMode === 'inc' ? C.green : C.cyan;
      k.push(
        s('line', { x1: 200, y1: 278, x2: 200, y2: 300, stroke: incCol, 'stroke-width': 3 }),
        s('polygon', { points: '200,305 193,295 207,295', fill: incCol })
      );

      // Monday Total Box
      k.push(
        s('rect', { x: 10, y: 310, width: 380, height: 132, rx: 12, fill: C.bg, stroke: boxCol, 'stroke-width': 2.5 }),
        s('text', { x: 200, y: 334, fill: C.muted, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MONDAY TOTAL'),
        s('text', { x: 200, y: 388, fill: boxCol, 'font-size': 50, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `$${savedTotal}`),
        s('rect', { x: 64, y: 402, width: 272, height: 30, rx: 15, fill: C.card, stroke: boxCol }),
        s('text', { x: 200, y: 422, fill: boxCol, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          isDup ? `WRONG! TRUE TOTAL $${trueTotal}` : (lastMode === 'inc' ? 'SAVED · INCREMENTAL' : (lastMode === 'full' ? 'RECALCULATED FROM $0' : 'SAVED AT 6:00 AM')))
      );

      // Work comparison
      const barX = 114, maxBarW = 196;
      const incW = Math.max(10, Math.round((shownIncReads / shownFullReads) * maxBarW));
      k.push(
        s('rect', { x: 10, y: 456, width: 380, height: 94, rx: 10, fill: C.bg, stroke: C.line }),
        s('text', { x: 20, y: 477, fill: C.muted, 'font-size': 12, 'font-weight': 700, 'font-family': 'Consolas' }, 'WORK COMPARISON (TICKETS READ)'),
        s('text', { x: 20, y: 505, fill: C.green, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'Incremental'),
        s('rect', { x: barX, y: 492, width: incW, height: 17, rx: 4, fill: C.green }),
        s('text', { x: barX + incW + 8, y: 505, fill: C.green, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, '1 read'),
        s('text', { x: 20, y: 534, fill: C.pink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'Re-read all'),
        s('rect', { x: barX, y: 521, width: maxBarW, height: 17, rx: 4, fill: C.pink, 'fill-opacity': 0.85 }),
        s('text', { x: barX + maxBarW + 8, y: 534, fill: C.pink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, `${shownFullReads}`)
      );
    }

    svg.replaceChildren(...k);

    // Formula box
    if (isDup && lastMode === 'inc') {
      fbox(box, [
        ['WARNING: Ticket B counted twice!', C.pink],
        `new total = $${lastPrev} + $${lastAdded.amount} = $${savedTotal}`,
        [`True Monday total = $${trueTotal}`, C.green],
        'Computer must track counted IDs.'
      ]);
    } else if (lastMode === 'inc' && lastAdded) {
      fbox(box, [
        ['Method: Incremental update', C.green],
        'new total = previous + new sale',
        [`          = $${lastPrev} + $${lastAdded.amount} = $${savedTotal}`, C.amber],
        [`Tickets read: 1  (skipped ${totalEarlier} earlier)`, C.green]
      ]);
    } else if (lastMode === 'full') {
      const sumExpr = totalEarlier <= 4 && countedTickets.length <= 6
        ? countedTickets.map(t => `$${t.amount}`).join(' + ')
        : `all ${lastReads} tickets from $0`;
      fbox(box, [
        ['Method: Recalculate all from $0', C.pink],
        `sum = ${sumExpr}`,
        [`    = $${savedTotal}`, isDup ? C.pink : C.amber],
        [`Tickets read: ${lastReads} (repeated earlier work)`, C.pink]
      ]);
    } else {
      const w0 = waiting[0];
      fbox(box, [
        `Saved Monday total = $${savedTotal} (${totalEarlier} sales)`,
        w0 ? [`Waiting: Ticket ${w0.id} ($${w0.amount})`, w0.isCopy ? C.pink : C.cyan] : 'Waiting: none',
        w0 ? [`Next incremental: $${savedTotal} + $${w0.amount} = $${savedTotal + w0.amount}`, C.amber] : 'Add a sale to update.'
      ]);
    }

    note.textContent = isDup
      ? 'A repeated ticket looks like a new sale unless the computer checks which ticket IDs it has already counted.'
      : 'Incremental processing keeps the saved total and adds only the newly received sale — earlier tickets are never read again.';

    waitLabel.textContent = waiting.length
      ? `Waiting: Ticket ${waiting[0].id} ($${waiting[0].amount}${waiting[0].isCopy ? ', retry' : ''})`
      : 'No ticket waiting';
    scaleLabel.textContent = `${totalEarlier} earlier`;

    chal.update(getState());
  }

  const checkActive = () => chal.update(getState());
  ch.addEventListener('click', checkActive);
  draw();

  return () => {
    ch.removeEventListener('click', checkActive);
    panel.remove();
  };
}

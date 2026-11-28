// 3.1.3 Try it: following every page of an API.
// The learner steps page by page (or runs the loop), changes page size,
// tests stopping early (the common trap), generates random orders, and completes 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const START_ORDERS = [
    { id: 101, store: 'North', amt: 40 },
    { id: 102, store: 'South', amt: 15 },
    { id: 103, store: 'North', amt: 50 },
    { id: 104, store: 'South', amt: 25 },
  ];

  let orders = START_ORDERS.map(o => ({ ...o }));
  let pageSize = 2;
  let fetchedPages = 1;
  let isRandom = false;
  let reported = false;
  let reportedEarly = false;
  let randomRunId = 0;
  const completedRandomRuns = new Set();
  let loopTimer = null;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700;
  const VH = NARROW ? 560 : 430;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });

  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const sizeLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const sizeSlider = h('input', {
    type: 'range', min: 1, max: 4, value: 2,
    'aria-label': 'Orders per page',
    style: { accentColor: C.cyan, cursor: 'pointer' },
    oninput: e => setPageSize(+e.target.value)
  });

  const nextBtn = btn('Ask for next page', () => askNext(), 'go');
  const loopBtn = btn('Run the loop (all pages)', () => runLoop());

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: following every page'),
    h('p', { class: 'sub' }, 'The bookstore API sends a few orders per page. Follow the next-page note until there is none, or test what happens when you stop early.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−', () => setPageSize(pageSize - 1)),
          sizeSlider,
          btn('+', () => setPageSize(pageSize + 1)),
          sizeLabel),
        h('div', { class: 'sim-row' },
          nextBtn,
          loopBtn,
          btn('Stop here & report', () => reportNow()),
          btn('New data (random)', () => makeRandom()),
          btn('Start again', () => resetExample()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const totalPages = () => Math.ceil(orders.length / pageSize);
  const pageOrders = p => orders.slice((p - 1) * pageSize, p * pageSize);
  const collected = () => orders.slice(0, fetchedPages * pageSize);
  const sumAmt = list => list.reduce((a, o) => a + o.amt, 0);
  const isDone = () => fetchedPages >= totalPages();

  function stopLoop() {
    if (loopTimer !== null) {
      clearInterval(loopTimer);
      loopTimer = null;
    }
  }

  function recordCompletion() {
    if (isRandom && isDone()) completedRandomRuns.add(randomRunId);
  }

  function setPageSize(val) {
    const next = Math.max(1, Math.min(4, val));
    if (next === pageSize) return;
    stopLoop();
    pageSize = next;
    sizeSlider.value = String(pageSize);
    fetchedPages = 1;
    reported = false;
    recordCompletion();
    draw();
  }

  function askNext() {
    if (isDone()) return;
    reported = false;
    fetchedPages = Math.min(totalPages(), fetchedPages + 1);
    recordCompletion();
    draw();
  }

  function runLoop() {
    stopLoop();
    reported = false;
    if (isDone()) {
      fetchedPages = 1;
      draw();
    }
    loopTimer = setInterval(() => {
      if (isDone()) {
        stopLoop();
        recordCompletion();
        draw();
        return;
      }
      fetchedPages++;
      if (isDone()) {
        stopLoop();
        recordCompletion();
      }
      draw();
    }, 450);
  }

  function reportNow() {
    stopLoop();
    reported = true;
    if (!isDone()) reportedEarly = true;
    draw();
  }

  function makeRandom() {
    stopLoop();
    const count = rnd(5, 10);
    const startId = rnd(1, 3) * 100 + 1;
    orders = Array.from({ length: count }, (_, i) => ({
      id: startId + i,
      store: Math.random() < 0.55 ? 'North' : 'South',
      amt: rnd(2, 12) * 5,
    }));
    isRandom = true;
    randomRunId++;
    fetchedPages = 1;
    reported = false;
    recordCompletion();
    draw();
  }

  function resetExample() {
    stopLoop();
    orders = START_ORDERS.map(o => ({ ...o }));
    pageSize = 2;
    sizeSlider.value = '2';
    fetchedPages = 1;
    isRandom = false;
    reported = false;
    draw();
  }

  svg.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-next]')) askNext();
  });

  const chal = challenges(ch, [
    {
      text: 'Start with the bookstore example and follow the next-page note until there is none.',
      check: st => !st.isRandom && st.done && st.trueTotal === 130,
      why: 'Yes! Following page 2 brings in orders 103 and 104, giving all 4 orders and $130 in sales.'
    },
    {
      text: 'Press “Start again”, then press “Stop here & report” after page 1. See how much goes missing.',
      check: st => st.reportedEarly,
      why: 'Stopping after page 1 reports $55 instead of $130 — missing $75, with no error message at all.'
    },
    {
      text: 'Set the page size to 1 order per page, then collect every page until you stop.',
      check: st => st.pageSize === 1 && st.done && st.pagesFetched >= 4,
      why: 'Right: smaller pages mean more trips, but following every next-page note still collects every single order.'
    },
    {
      text: 'Press “New data (random)” and collect every page, twice.',
      check: st => st.randomCompleted >= 2,
      why: 'Every time, the loop keeps going until the missing next-page note signals stop — and never misses an order.'
    }
  ]);

  function draw() {
    const tp = totalPages();
    const done = isDone();
    const curOrders = pageOrders(fetchedPages);
    const got = collected();
    const gotSum = sumAmt(got);
    const trueSum = sumAmt(orders);
    const missedSum = trueSum - gotSum;
    const missedCount = orders.length - got.length;
    const earlyReport = reported && !done;
    const k = [];

    // 1. Top page-journey strip
    const sx0 = NARROW ? 12 : 16, sx1 = VW - sx0, sy = 14, sh = 36;
    const stripItems = [];
    for (let p = 1; p <= fetchedPages; p++) {
      stripItems.push({ label: `P${p}`, state: p === fetchedPages ? 'cur' : 'got' });
    }
    if (earlyReport) {
      for (let p = fetchedPages + 1; p <= tp; p++) {
        stripItems.push({ label: `P${p}`, state: 'missed' });
      }
    } else if (!done) {
      stripItems.push({ label: `next: ${fetchedPages + 1}`, state: 'next' });
    } else {
      stripItems.push({ label: 'STOP ✓', state: 'stop' });
    }

    const gap = stripItems.length > 7 ? 8 : 14;
    const itemW = Math.min(NARROW ? 74 : 86, (sx1 - sx0 - gap * (stripItems.length - 1)) / stripItems.length);
    stripItems.forEach((it, i) => {
      const x = sx0 + i * (itemW + gap);
      const isNext = it.state === 'next';
      const stroke = it.state === 'cur' ? C.cyan
        : it.state === 'got' ? '#3d6b85'
        : it.state === 'next' ? C.amber
        : it.state === 'stop' ? C.green : C.pink;
      const fill = it.state === 'cur' ? C.cyan
        : it.state === 'stop' ? C.green
        : it.state === 'next' ? C.amber
        : it.state === 'missed' ? C.pink : C.bg;
      const fop = it.state === 'got' ? 0.85 : it.state === 'missed' ? 0.1 : 0.18;
      const attrs = {
        x, y: sy, width: itemW, height: sh, rx: 10,
        fill, 'fill-opacity': fop, stroke, 'stroke-width': it.state === 'cur' || isNext ? 2 : 1.5,
      };
      if (it.state === 'missed' || isNext) attrs['stroke-dasharray'] = '5 4';
      if (isNext) { attrs['data-next'] = '1'; attrs.style = 'cursor:pointer'; }
      k.push(s('rect', attrs));
      const tAttrs = {
        x: x + itemW / 2, y: sy + 23,
        fill: it.state === 'got' ? C.ink : stroke,
        'font-size': itemW < 50 ? 11 : 13, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      };
      if (isNext) { tAttrs['data-next'] = '1'; tAttrs.style = 'cursor:pointer'; }
      k.push(s('text', tAttrs, it.label));
      if (i < stripItems.length - 1) {
        const ax = x + itemW + gap / 2;
        k.push(s('text', {
          x: ax, y: sy + 22, fill: it.state === 'missed' ? C.pink : C.muted,
          'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, '→'));
      }
    });

    // 2. Current API Answer card
    const px = NARROW ? 12 : 16;
    const py = NARROW ? 64 : 72;
    const pw = NARROW ? VW - 24 : 326;
    const ph = NARROW ? 224 : 276;
    k.push(s('rect', { x: px, y: py, width: pw, height: ph, rx: 14, fill: C.bg, stroke: C.cyan, 'stroke-width': 2 }));
    k.push(s('text', { x: px + 16, y: py + 26, fill: C.cyan, 'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas' }, `PAGE ${fetchedPages}`));
    k.push(s('text', { x: px + pw - 16, y: py + 26, fill: C.muted, 'font-size': 13, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${curOrders.length} ${curOrders.length === 1 ? 'order' : 'orders'}`));

    const rGap = NARROW ? 6 : 8;
    const rH = NARROW ? 31 : 40;
    curOrders.forEach((o, i) => {
      const ry = py + (NARROW ? 40 : 46) + i * (rH + rGap);
      const col = o.store === 'North' ? C.cyan : C.pink;
      k.push(s('rect', { x: px + 14, y: ry, width: pw - 28, height: rH, rx: 8, fill: col, 'fill-opacity': 0.14, stroke: col, 'stroke-width': 1.5 }));
      k.push(s('text', { x: px + 26, y: ry + rH / 2 + 5, fill: C.ink, 'font-size': NARROW ? 13 : 14, 'font-weight': 700, 'font-family': 'Consolas' }, `Order ${o.id} · ${o.store}`));
      k.push(s('text', { x: px + pw - 26, y: ry + rH / 2 + 5, fill: C.amber, 'font-size': NARROW ? 14 : 15, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `$${o.amt}`));
    });

    // Bottom note bar of the page card
    const fy = py + ph - (NARROW ? 42 : 48), fh = NARROW ? 30 : 34;
    if (!done) {
      k.push(s('rect', {
        x: px + 14, y: fy, width: pw - 28, height: fh, rx: 9,
        fill: C.amber, 'fill-opacity': 0.16, stroke: C.amber, 'stroke-width': 1.8,
        'data-next': '1', style: 'cursor:pointer'
      }));
      k.push(s('text', {
        x: px + pw / 2, y: fy + fh / 2 + 5, fill: C.amber,
        'font-size': NARROW ? 13 : 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
        'data-next': '1', style: 'cursor:pointer'
      }, `next page: ${fetchedPages + 1}  →  tap to ask`));
    } else {
      k.push(s('rect', {
        x: px + 14, y: fy, width: pw - 28, height: fh, rx: 9,
        fill: C.green, 'fill-opacity': 0.14, stroke: C.green, 'stroke-width': 1.8
      }));
      k.push(s('text', {
        x: px + pw / 2, y: fy + fh / 2 + 5, fill: C.green,
        'font-size': NARROW ? 13 : 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, 'no next-page note  ·  STOP ✓'));
    }

    // 3. Collected Orders tray
    const cx = NARROW ? 12 : 358;
    const cy = NARROW ? 302 : 72;
    const cw = NARROW ? VW - 24 : 326;
    const chH = NARROW ? 186 : 276;
    const trayCol = earlyReport ? C.pink : done ? C.green : C.line;
    k.push(s('rect', { x: cx, y: cy, width: cw, height: chH, rx: 14, fill: C.bg, stroke: trayCol, 'stroke-width': 2 }));
    k.push(s('text', { x: cx + 16, y: cy + 26, fill: earlyReport ? C.pink : done ? C.green : C.ink, 'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas' }, 'COLLECTED'));
    const countTxt = done || earlyReport ? `${got.length} of ${orders.length} orders` : `${got.length} orders so far`;
    k.push(s('text', { x: cx + cw - 16, y: cy + 26, fill: earlyReport ? C.pink : C.muted, 'font-size': 13, 'text-anchor': 'end', 'font-family': 'Consolas' }, countTxt));

    const showList = earlyReport ? orders : got;
    const cols = 2, pad = 12, cGap = 8;
    const chipW = (cw - pad * 2 - cGap) / cols;
    const chipH = NARROW ? 25 : 36;
    const chipGapY = NARROW ? 5 : 8;
    showList.forEach((o, i) => {
      const colIdx = i % cols, rowIdx = Math.floor(i / cols);
      const ox = cx + pad + colIdx * (chipW + cGap);
      const oy = cy + (NARROW ? 36 : 44) + rowIdx * (chipH + chipGapY);
      const missed = i >= got.length;
      const col = missed ? C.pink : (o.store === 'North' ? C.cyan : C.pink);
      const rectAttrs = {
        x: ox, y: oy, width: chipW, height: chipH, rx: 7,
        fill: col, 'fill-opacity': missed ? 0.06 : 0.14, stroke: col, 'stroke-width': 1.4
      };
      if (missed) rectAttrs['stroke-dasharray'] = '4 3';
      k.push(s('rect', rectAttrs));
      k.push(s('text', {
        x: ox + 10, y: oy + chipH / 2 + 4,
        fill: missed ? C.muted : C.ink, 'font-size': NARROW ? 11.5 : 13, 'font-weight': 700, 'font-family': 'Consolas'
      }, missed ? `${o.id} missed` : `#${o.id} ${o.store[0]}`));
      k.push(s('text', {
        x: ox + chipW - 10, y: oy + chipH / 2 + 4,
        fill: missed ? C.pink : C.amber, 'font-size': NARROW ? 11.5 : 13, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas'
      }, `$${o.amt}`));
    });

    // 4. Bottom sales bar
    const bx = NARROW ? 12 : 16, by = NARROW ? 504 : 368, bw = VW - bx * 2, bh = 38;
    k.push(s('rect', { x: bx, y: by, width: bw, height: bh, rx: 10, fill: C.bg, stroke: C.line, 'stroke-width': 1.5 }));
    const ratio = trueSum > 0 ? gotSum / trueSum : 0;
    const fillCol = earlyReport ? C.pink : done ? C.green : C.cyan;
    k.push(s('rect', { x: bx + 2, y: by + 2, width: Math.max(8, (bw - 4) * ratio), height: bh - 4, rx: 8, fill: fillCol, 'fill-opacity': 0.3 }));
    const barMsg = earlyReport
      ? `Reported $${gotSum} of $${trueSum} — missed $${missedSum} (${missedCount} ${missedCount === 1 ? 'order' : 'orders'}), no error!`
      : done
        ? `Complete: all ${orders.length} orders collected · Total sales = $${gotSum}`
        : `Collected so far: $${gotSum} (${got.length} orders) — more pages remain`;
    k.push(s('text', {
      x: bx + bw / 2, y: by + 24,
      fill: earlyReport ? C.pink : done ? C.green : C.ink,
      'font-size': NARROW ? 11.5 : 13.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, barMsg));

    svg.replaceChildren(...k);

    // Formula box
    const amts = got.map(o => o.amt);
    const sumLine = amts.length <= 6 ? `${amts.join(' + ')} = $${gotSum}` : `${got.length} orders = $${gotSum}`;
    const lines = [
      `page size  = ${pageSize} ${pageSize === 1 ? 'order' : 'orders'} / page`,
      [`pages got  = ${fetchedPages}  (${done ? 'next: none → STOP' : `next: ${fetchedPages + 1}`})`, done ? C.green : C.amber],
      `orders got = ${got.length}${done || earlyReport ? ` of ${orders.length}` : ''}`,
      [`sales sum  = ${sumLine}`, earlyReport ? C.pink : done ? C.green : C.amber],
    ];
    if (earlyReport) lines.push([`missing    = $${missedSum}  (no error!)`, C.pink]);
    fbox(box, lines);

    note.textContent = earlyReport
      ? `Trap! Stopping at page ${fetchedPages} looks fine, with no error message — yet ${missedCount} ${missedCount === 1 ? 'order' : 'orders'} ($${missedSum}) never arrived.`
      : done
        ? 'The last page had no next-page note, so we stopped with every order.'
        : `Page ${fetchedPages} says “next page: ${fetchedPages + 1}”. Follow it so no orders are left behind.`;

    sizeLabel.textContent = `Page size: ${pageSize} ${pageSize === 1 ? 'order' : 'orders'}/page`;
    nextBtn.disabled = done;
    nextBtn.style.opacity = done ? '0.45' : '1';

    chal.update({
      isRandom,
      done,
      pageSize,
      pagesFetched: fetchedPages,
      trueTotal: trueSum,
      reportedEarly,
      randomCompleted: completedRandomRuns.size,
    });
  }

  draw();
  return () => stopLoop();
}

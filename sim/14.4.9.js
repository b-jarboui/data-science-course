// 14.4.9 Try it: Ranking metrics (DCG, Ideal DCG, and NDCG).
// Drag book cards up or down (or tap a card and use Move up / Move down),
// toggle whether Ana wants each book (1 or 0), generate fresh random tests,
// and solve 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const BOOK_BANK = [
    { name: 'Castle', color: C.violet },
    { name: 'River',  color: '#2dd4bf' },
    { name: 'Island', color: '#fde047' },
    { name: 'Trail',  color: C.green },
    { name: 'Clues',  color: C.amber },
  ];

  const makeStart = () => [
    { name: 'Castle', color: C.violet,  rel: 0 },
    { name: 'River',  color: '#2dd4bf', rel: 1 },
    { name: 'Island', color: '#fde047', rel: 1 },
  ];

  let books = makeStart();
  let sel = 0;
  let dragging = -1;
  let dragY = 0;
  let isStartSet = true;
  let isRandom = false;
  let movedRelToBottom = false;
  let randomSolved = 0;

  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: order the recommendations'),
    h('p', { class: 'sub' }, 'Drag any book card up or down to change its position, or tap it and use Move up / Move down. Tap the 1 / 0 badge to change whether Ana wants that book.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Move up ▲', () => moveSel(-1)),
          btn('Move down ▼', () => moveSel(1)),
          btn('Flip 1 / 0', () => toggleRel(sel)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Best order (Ideal)', () => sortOrder(true), 'go'),
          btn('Worst order', () => sortOrder(false)),
          btn('New test (random)', () => newRandom()),
          btn('Add a book', () => addBook()),
          btn('Remove a book', () => removeBook()),
          btn('Start again', () => reset()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const weight = pos1 => 1 / Math.log2(pos1 + 1);
  const calc = () => {
    const w = books.map((_, i) => weight(i + 1));
    const gains = books.map((b, i) => b.rel * w[i]);
    const dcg = gains.reduce((a, b) => a + b, 0);
    const idealRels = books.map(b => b.rel).sort((a, b) => b - a);
    const idcg = idealRels.reduce((sum, r, i) => sum + r * w[i], 0);
    const ndcg = idcg > 0 ? dcg / idcg : 0;
    return { w, gains, dcg, idcg, ndcg };
  };

  const f2 = x => x.toFixed(2);
  const isOriginalRelevance = () => {
    if (books.length !== 3) return false;
    const m = Object.fromEntries(books.map(b => [b.name, b.rel]));
    return m.River === 1 && m.Island === 1 && m.Castle === 0;
  };

  const chal = challenges(ch, [
    {
      text: 'Reorder the three starting books (Castle, River, Island) to make NDCG equal 1.',
      check: st => st.origRel && st.ndcg >= 0.9999,
      why: 'Yes! Placing both relevant books (River and Island) in positions 1 and 2 gives DCG = 1.63 = Ideal DCG, so NDCG = 1.',
    },
    {
      text: 'Using the same three books, find an order with NDCG between 0.80 and 0.99.',
      check: st => st.origRel && st.ndcg >= 0.80 && st.ndcg < 0.99,
      why: 'Right! One relevant book at #1 and one at #3 gives DCG = 1.50 and NDCG ≈ 0.92 — much higher than putting Castle first (0.69).',
    },
    {
      text: 'Press “Add a book” (4 or 5 books) and move a relevant book (1) to the bottom position.',
      check: st => st.n >= 4 && st.movedRelToBottom,
      why: 'Each lower position has a smaller credit (1 ÷ log₂(pos + 1)), so moving a relevant book down reduces DCG and NDCG.',
    },
    {
      text: 'Press “New test (random)” and then reorder the new list until NDCG reaches 1.',
      check: st => st.randomSolved >= 1,
      why: 'For any set of books, putting every relevant book above every non-relevant book reaches Ideal DCG and gives NDCG = 1.',
    },
  ]);

  function swap(i, j) {
    if (i < 0 || j < 0 || i >= books.length || j >= books.length || i === j) return;
    const tmp = books[i];
    books[i] = books[j];
    books[j] = tmp;
    if (books.length >= 4 && books[books.length - 1].rel === 1 && (i === books.length - 1 || j === books.length - 1)) {
      movedRelToBottom = true;
    }
  }

  function moveSel(d) {
    const next = sel + d;
    if (next < 0 || next >= books.length) return;
    swap(sel, next);
    sel = next;
    draw();
  }

  function toggleRel(i) {
    books[i].rel = books[i].rel ? 0 : 1;
    isStartSet = false;
    draw();
  }

  function sortOrder(best) {
    books.sort((a, b) => best ? (b.rel - a.rel) : (a.rel - b.rel));
    if (!best && books.length >= 4 && books[books.length - 1].rel === 1) movedRelToBottom = true;
    sel = Math.min(sel, books.length - 1);
    draw();
  }

  function addBook() {
    if (books.length >= 5) return;
    const used = new Set(books.map(b => b.name));
    const next = BOOK_BANK.find(b => !used.has(b.name));
    if (!next) return;
    books.push({ name: next.name, color: next.color, rel: rnd(0, 1) });
    isStartSet = false;
    draw();
  }

  function removeBook() {
    if (books.length <= 2) return;
    books.pop();
    sel = Math.min(sel, books.length - 1);
    isStartSet = false;
    draw();
  }

  function newRandom() {
    const count = rnd(3, 5);
    const pool = BOOK_BANK.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, count);
    const relCount = rnd(1, count - 1);
    const rels = Array.from({ length: count }, (_, i) => i < relCount ? 1 : 0);
    // Shuffle until not already in ideal order
    let tries = 0;
    do {
      for (let i = rels.length - 1; i > 0; i--) {
        const j = rnd(0, i);
        [rels[i], rels[j]] = [rels[j], rels[i]];
      }
      tries++;
    } while (tries < 20 && rels.every((r, idx) => idx === 0 || rels[idx - 1] >= r));
    if (rels.every((r, idx) => idx === 0 || rels[idx - 1] >= r)) rels.reverse();
    books = chosen.map((b, i) => ({ name: b.name, color: b.color, rel: rels[i] }));
    sel = 0;
    isStartSet = false;
    isRandom = true;
    draw();
  }

  function reset() {
    books = makeStart();
    sel = 0;
    isStartSet = true;
    isRandom = false;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 460, F = NARROW ? 1.12 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const TOP = 42, LIST_BOT = 368;
  const rowStep = () => Math.min(76, (LIST_BOT - TOP) / books.length);
  const cardH = () => Math.min(58, rowStep() - 12);
  const rowY = i => TOP + i * rowStep() + rowStep() / 2;

  const POS_X = NARROW ? 22 : 34;
  const CARD_X = NARROW ? 46 : 74;
  const CARD_W = NARROW ? 186 : 260;
  const BADGE_CX = CARD_X + CARD_W - (NARROW ? 26 : 32);
  const BAR_X = CARD_X + CARD_W + (NARROW ? 16 : 26);
  const BAR_MAX = NARROW ? 86 : 165;
  const PTS_X = VW - (NARROW ? 10 : 18);

  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < TOP - 8 || p.y > TOP + books.length * rowStep() + 8) return;
    const idx = Math.max(0, Math.min(books.length - 1, Math.floor((p.y - TOP) / rowStep())));
    sel = idx;
    // Check if user tapped the 1/0 relevance badge
    if (Math.hypot(p.x - BADGE_CX, p.y - rowY(idx)) <= 22) {
      toggleRel(idx);
      return;
    }
    dragging = idx;
    dragY = p.y;
    svg.setPointerCapture(e.pointerId);
    draw();
  });

  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    dragY = Math.max(TOP + 12, Math.min(TOP + books.length * rowStep() - 12, p.y));
    const target = Math.max(0, Math.min(books.length - 1, Math.floor((dragY - TOP) / rowStep())));
    if (target !== dragging) {
      const step = target > dragging ? 1 : -1;
      while (dragging !== target) {
        swap(dragging, dragging + step);
        dragging += step;
        sel = dragging;
      }
    }
    draw();
  });

  const endDrag = () => { if (dragging >= 0) { dragging = -1; draw(); } };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const { w, gains, dcg, idcg, ndcg } = calc();
    if (isRandom && idcg > 0 && ndcg >= 0.9999) {
      randomSolved++;
      isRandom = false;
    }

    const chH = cardH();
    const k = [];

    // Column headers
    k.push(
      s('text', { x: POS_X, y: 24, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'POS'),
      s('text', { x: CARD_X + CARD_W / 2, y: 24, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'RECOMMENDATION ORDER (DRAG)'),
      s('text', { x: BAR_X, y: 24, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'CREDIT'),
      s('text', { x: PTS_X, y: 24, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'EARNED')
    );

    // Draw rows (non-dragged first, dragged card on top)
    const order = books.map((_, i) => i).sort((a, b) => (a === dragging ? 1 : b === dragging ? -1 : a - b));

    // Fixed position numbers, credit tracks, credit bars, earned points
    books.forEach((b, i) => {
      const cy = rowY(i);
      const bw = BAR_MAX * w[i];
      const barH = 16;
      k.push(
        s('text', { x: POS_X, y: cy + 5, fill: C.muted, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '#' + (i + 1)),
        s('rect', { x: BAR_X, y: cy - barH / 2 - 7, width: BAR_MAX, height: barH, rx: 4, fill: C.bg, stroke: C.line }),
        s('rect', { x: BAR_X, y: cy - barH / 2 - 7, width: bw, height: barH, rx: 4, fill: b.rel ? C.amber : C.muted, 'fill-opacity': b.rel ? 0.85 : 0.35 }),
        s('text', { x: BAR_X, y: cy + 20, fill: C.muted, 'font-size': 11.5 * F, 'font-family': 'Consolas' }, `1÷log₂(${i + 2}) = ${f2(w[i])}`),
        s('text', { x: PTS_X, y: cy + 5, fill: b.rel ? C.green : C.muted, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, b.rel ? '+' + f2(gains[i]) : '0.00')
      );
    });

    // Book cards
    for (const i of order) {
      const b = books[i];
      const cy = i === dragging ? dragY : rowY(i);
      const isSel = i === sel;
      const bcol = b.rel ? C.green : C.muted;
      k.push(
        s('rect', {
          x: CARD_X, y: cy - chH / 2, width: CARD_W, height: chH, rx: 11,
          fill: C.card, stroke: isSel ? C.cyan : b.color, 'stroke-width': isSel ? 3 : 2,
          style: 'cursor: grab'
        }),
        s('rect', { x: CARD_X + 7, y: cy - chH / 2 + 7, width: 8, height: chH - 14, rx: 3, fill: b.color }),
        s('text', { x: CARD_X + 25, y: cy + 6, fill: C.ink, 'font-size': 16 * F, 'font-weight': 700, 'font-family': '"Segoe UI", Arial, sans-serif' }, b.name),
        // Clickable 1 / 0 badge
        s('circle', { cx: BADGE_CX, cy, r: 17, fill: b.rel ? C.green : C.bg, 'fill-opacity': b.rel ? 0.22 : 0.9, stroke: bcol, 'stroke-width': 2, style: 'cursor: pointer' }),
        s('text', { x: BADGE_CX, y: cy + 5.5, fill: bcol, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events: none' }, String(b.rel))
      );
    }

    // Bottom NDCG 0-to-1 scale gauge
    const gx0 = NARROW ? 34 : 56, gx1 = VW - (NARROW ? 34 : 56), gy = 420;
    const gx = v => gx0 + Math.max(0, Math.min(1, v)) * (gx1 - gx0);
    const nCol = ndcg >= 0.9999 && idcg > 0 ? C.green : C.amber;
    k.push(
      s('line', { x1: gx0, x2: gx1, y1: gy, y2: gy, stroke: C.line, 'stroke-width': 8, 'stroke-linecap': 'round' }),
      s('line', { x1: gx0, x2: gx(ndcg), y1: gy, y2: gy, stroke: nCol, 'stroke-width': 8, 'stroke-linecap': 'round' }),
      s('circle', { cx: gx(ndcg), cy: gy, r: 9, fill: nCol, stroke: C.bg, 'stroke-width': 2.5 }),
      s('text', { x: gx0, y: gy + 24, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '0'),
      s('text', { x: gx(0.5), y: gy + 24, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '0.5'),
      s('text', { x: gx1, y: gy + 24, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '1 (Ideal)'),
      s('text', { x: (gx0 + gx1) / 2, y: gy - 16, fill: nCol, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        idcg > 0 ? `NDCG = ${f2(ndcg)}` : 'NDCG = 0 (no relevant books)')
    );

    svg.replaceChildren(...k);

    // Live formula box
    const lines = books.map((b, i) => [
      `#${i + 1} ${b.name.padEnd(6, ' ')}: ${b.rel} × ${f2(w[i])} = ${f2(gains[i])}`,
      b.rel ? C.green : C.muted
    ]);
    lines.push([`DCG   = ${f2(dcg)}`, C.amber]);
    lines.push([`IDCG  = ${f2(idcg)}`, C.green]);
    lines.push(idcg > 0
      ? [`NDCG  = ${f2(dcg)} ÷ ${f2(idcg)} = ${f2(ndcg)}`, nCol]
      : ['NDCG  = 0 (mark at least one book 1)', C.pink]);
    fbox(box, lines);

    note.textContent = idcg === 0
      ? 'No books are marked relevant (1). Tap a 0 badge to mark a book Ana wants to read.'
      : ndcg >= 0.9999
        ? 'Perfect order! Every relevant book is placed as high as possible, so DCG equals Ideal DCG and NDCG = 1.'
        : 'Move relevant books (1) closer to position #1 to earn larger position credits and raise NDCG toward 1.';

    selLabel.textContent = `Selected: #${sel + 1} ${books[sel].name} (${books[sel].rel ? 'relevant = 1' : 'not relevant = 0'})`;

    chal.update({
      origRel: isOriginalRelevance(),
      ndcg,
      n: books.length,
      movedRelToBottom,
      randomSolved,
    });
  }

  draw();
  return () => {};
}

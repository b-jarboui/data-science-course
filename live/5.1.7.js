// 5.1.7 Multinomial counts (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const URG = '#ff7a45', NOR = C.cyan, LOW = C.violet;
  const KIND_C = [URG, NOR, LOW];
  const KIND_K = ['U', 'N', 'L'];
  const KIND_W = ['urgent', 'normal', 'low'];
  const KIND_F = ['1/5', '2/5', '2/5'];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.15;
  const PILL = P ? [0, 1.72, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.55, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.8 : 4.55;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g, { runTime: 0.45 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.35 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.4 })];
  }

  // Card helpers (all parts placed with moveTo before grouping)
  const SLOT_W = P ? 1.18 : 1.24, SLOT_H = P ? 1.40 : 1.46, SLOT_SP = P ? 1.40 : 1.50;
  const CARD_Y = P ? 0.15 : 0.48;
  const slotX = k => CX + (k - 2) * SLOT_SP;

  function makeSlot(k, y = CARD_Y) {
    const x = slotX(k);
    const r = new M.RoundedRectangle({ width: SLOT_W, height: SLOT_H, cornerRadius: 0.14, color: C.muted, strokeWidth: 1.8 });
    r.setFill(C.card, 0.45); r.moveTo([x, y, 0]);
    const num = T(String(k + 1), 16, C.muted, true); num.moveTo([x, y - SLOT_H / 2 - 0.24, 0]);
    return new M.VGroup(r, num);
  }

  function makeCard(k, kind, y = CARD_Y) {
    const x = slotX(k), col = KIND_C[kind];
    const r = new M.RoundedRectangle({ width: SLOT_W - 0.08, height: SLOT_H - 0.08, cornerRadius: 0.13, color: col, strokeWidth: 2.5 });
    r.setFill(col, 0.22); r.moveTo([x, y, 0]);
    const big = T(KIND_K[kind], P ? 32 : 34, col, true, true); big.moveTo([x, y + 0.14, 0]);
    const sub = T(KIND_W[kind], P ? 15 : 16, C.ink, false); sub.moveTo([x, y - 0.36, 0]);
    return new M.VGroup(r, big, sub);
  }

  function makeBarChart(counts, cx, baseY, maxH, colSp, bw) {
    const base = new M.Line({ start: [cx - colSp * 1.55, baseY, 0], end: [cx + colSp * 1.55, baseY, 0], color: C.muted, strokeWidth: 2 });
    const bars = [], nums = [], caps = [];
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * colSp, v = counts[i], col = KIND_C[i];
      const h = Math.max(0.06, (v / 5) * maxH);
      const b = new M.Rectangle({ width: bw, height: h, color: v > 0 ? col : C.muted, strokeWidth: 2 });
      b.setFill(v > 0 ? col : C.muted, v > 0 ? 0.8 : 0.25);
      b.moveTo([x, baseY + h / 2, 0]);
      const n = T(String(v), P ? 22 : 21, v > 0 ? col : C.muted, true, true);
      n.moveTo([x, baseY + h + 0.26, 0]);
      const c = T(KIND_W[i], P ? 15 : 16, col, false, true);
      c.moveTo([x, baseY - 0.30, 0]);
      bars.push(b); nums.push(n); caps.push(c);
    }
    return { base, bars, nums, caps };
  }

  // --- 0: Three kinds of ticket ---------------------------------------------
  const kW = P ? 2.15 : 2.8, kH = P ? 1.45 : 1.65, kSp = P ? 2.42 : 3.35, kY = P ? -0.15 : 0.15;
  const kindCards = [0, 1, 2].map(i => {
    const x = (i - 1) * kSp, col = KIND_C[i];
    const r = new M.RoundedRectangle({ width: kW, height: kH, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    r.setFill(col, 0.18); r.moveTo([x, kY, 0]);
    const badge = new M.Dot({ point: [x, kY + 0.32, 0], radius: 0.16, color: col }); badge.setFill(col, 1);
    const lbl = T(KIND_W[i].toUpperCase(), P ? 20 : 23, col, true, true); lbl.moveTo([x, kY - 0.22, 0]);
    return new M.VGroup(r, badge, lbl);
  });
  await until(S(0));
  await play(new M.LaggedStart(kindCards.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.5 }), ...say('THREE KINDS OF TICKET'));

  // --- 1: One fifth, two fifths, two fifths ---------------------------------
  const fracTags = [0, 1, 2].map(i => {
    const t = T(KIND_F[i], P ? 24 : 26, KIND_C[i], true, true);
    t.moveTo([(i - 1) * kSp, kY - kH / 2 - 0.42, 0]);
    return t;
  });
  const barY = P ? -2.55 : -1.85, cellW = P ? 1.30 : 1.75, cellH = P ? 0.68 : 0.65;
  const cellKinds = [0, 1, 1, 2, 2];
  const barCells = cellKinds.map((kind, i) => {
    const x = (i - 2) * (cellW + 0.08), col = KIND_C[kind];
    const r = new M.RoundedRectangle({ width: cellW, height: cellH, cornerRadius: 0.08, color: col, strokeWidth: 2 });
    r.setFill(col, 0.35); r.moveTo([x, barY, 0]);
    const t = T('1/5', P ? 16 : 18, C.ink, true); t.moveTo([x, barY, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(1));
  await play(
    new M.LaggedStart(fracTags.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.1 }),
    new M.LaggedStart(barCells.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.5 }),
    ...say('URGENT 1/5 · NORMAL 2/5 · LOW 2/5', C.amber)
  );

  // --- 2: Adds up to one whole ----------------------------------------------
  const wholeW = 5 * (cellW + 0.08) + 0.22;
  const wholeBox = new M.RoundedRectangle({ width: wholeW, height: cellH + 0.26, cornerRadius: 0.12, color: C.green, strokeWidth: 2.5 });
  wholeBox.moveTo([0, barY, 0]);
  const wholeEq = T('1/5 + 2/5 + 2/5 = 5/5 = 1 whole', P ? 19 : 22, C.green, true, true);
  wholeEq.moveTo([0, barY - cellH / 2 - 0.55, 0]);
  await until(S(2));
  await play(new M.Create(wholeBox, { runTime: 0.8 }), new M.FadeIn(wholeEq, { runTime: 0.7 }), ...say('CHANCES ADD UP TO 1 WHOLE', C.green));

  // --- 3: Manager asks: 1 urgent, 2 normal, 2 low in 5 tickets --------------
  const qBadges = [
    ['1 urgent', URG], ['2 normal', NOR], ['2 low', LOW]
  ].map(([txt, col], i) => {
    const p = pill(txt, col, P ? 17 : 19);
    p.moveTo([(i - 1) * kSp, barY + 0.15, 0]);
    return p;
  });
  const qSub = T('Next 5 tickets: what is the chance of this exact mix?', P ? 16 : 20, C.amber, false, true);
  qSub.moveTo([0, barY - 0.65, 0]);
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...barCells, wholeBox, wholeEq), { runTime: 0.5 }),
    new M.LaggedStart(qBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.0 }),
    new M.FadeIn(qSub, { runTime: 0.7 }),
    ...say('5 TICKETS: 1 URGENT, 2 NORMAL, 2 LOW?', C.amber)
  );

  // --- 4: Lay out five card slots + colour legend ---------------------------
  const slots = [0, 1, 2, 3, 4].map(k => makeSlot(k));
  const legY = P ? -2.25 : -1.55, legSp = P ? 2.35 : 2.55;
  const legend = [0, 1, 2].map(i => {
    const x = CX + (i - 1) * legSp, col = KIND_C[i];
    const sq = new M.RoundedRectangle({ width: 0.28, height: 0.28, cornerRadius: 0.06, color: col, strokeWidth: 2 });
    const lb = T(`${KIND_W[i]} ${KIND_F[i]}`, P ? 17 : 18, col, true);
    const lw = lb.getWidth() + 0.4;
    sq.setFill(col, 0.85); sq.moveTo([x - lw / 2 + 0.14, legY, 0]);
    lb.moveTo([x - lw / 2 + 0.4 + lb.getWidth() / 2, legY, 0]);
    return new M.VGroup(sq, lb);
  });
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...kindCards, ...fracTags, ...qBadges, qSub), { runTime: 0.5 }),
    ...say('FIVE CARD SLOTS: ORANGE, BLUE, VIOLET')
  );
  await play(
    new M.LaggedStart(slots.map(sl => new M.FadeIn(sl)), { lagRatio: 0.1, runTime: 1.1 }),
    new M.FadeIn(new M.VGroup(...legend), { runTime: 0.8 })
  );

  // --- 5: One order: U N N L L ----------------------------------------------
  const order1 = [0, 1, 1, 2, 2];
  const cards1 = order1.map((kind, k) => makeCard(k, kind));
  await until(S(5));
  await play(
    new M.LaggedStart(cards1.map(c => new M.FadeIn(c)), { lagRatio: 0.16, runTime: 1.6 }),
    ...say('ONE ORDER: U · N · N · L · L')
  );

  // --- 6: Chance is a product (independent tickets) -------------------------
  const fracY = CARD_Y - SLOT_H / 2 - 0.72;
  const timesSigns = [0, 1, 2, 3].map(k => {
    const t = T('×', P ? 18 : 20, C.muted, true, true);
    t.moveTo([(slotX(k) + slotX(k + 1)) / 2, fracY, 0]);
    return t;
  });
  await until(S(6));
  await play(
    new M.FadeIn(new M.VGroup(...timesSigns), { runTime: 0.6 }),
    ...fbox(['tickets do not', 'affect each other:', ['multiply chances', C.cyan]]),
    ...say('INDEPENDENT → MULTIPLY CHANCES')
  );

  // --- 7: One fifth, times two fifths four times ----------------------------
  const slotFracs = order1.map((kind, k) => {
    const t = T(KIND_F[kind], P ? 18 : 20, KIND_C[kind], true, true);
    t.moveTo([slotX(k), fracY, 0]);
    return t;
  });
  await until(S(7));
  await play(
    new M.LaggedStart(slotFracs.map(f => new M.FadeIn(f)), { lagRatio: 0.1, runTime: 0.9 }),
    ...fbox(['one order:', ['1/5 × 2/5 × 2/5', C.ink], ['    × 2/5 × 2/5', C.ink]]),
    ...say('1/5 × 2/5 × 2/5 × 2/5 × 2/5', C.amber)
  );

  // --- 8: On top: 1 × 2 × 2 × 2 × 2 = 16 -----------------------------------
  await until(S(8));
  await play(
    new M.LaggedStart(slotFracs.map(f => new M.Indicate(f, { color: C.amber })), { lagRatio: 0.12, runTime: 1.3 }),
    ...fbox(['on top:', ['1 × 2 × 2 × 2 × 2', C.amber], ['= 16', C.amber]], C.amber),
    ...say('ON TOP: 1 × 2 × 2 × 2 × 2 = 16', C.amber)
  );

  // --- 9: Underneath: 5 × 5 × 5 × 5 × 5 = 3125 -----------------------------
  await until(S(9));
  await play(
    ...fbox(['on top:     16', 'underneath:', ['5 × 5 × 5 × 5 × 5', C.cyan], ['= 3125', C.cyan]], C.cyan),
    ...say('UNDERNEATH: 5⁵ = 3125', C.cyan)
  );

  // --- 10: One order = 16 / 3125 ≈ 0.5% ------------------------------------
  await until(S(10));
  await play(
    ...fbox(['one order (U N N L L):', ['16 / 3125', C.amber], ['= 0.00512', C.muted], ['≈ 0.5%  (½ in 100)', C.green]], C.amber),
    ...say('ONE ORDER: 16 / 3125 ≈ ½ IN 100', C.amber)
  );

  // --- 11: Colours can sit in other slots -----------------------------------
  const altOrder = [1, 2, 0, 2, 1];
  const altCards = altOrder.map((kind, k) => makeCard(k, kind));
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(...cards1, ...slotFracs, ...timesSigns), { runTime: 0.45 }),
    new M.LaggedStart(altCards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 0.9 }),
    ...fbox(['same mix: 1 U, 2 N, 2 L', ['different slots!', C.violet], ['how many orders?', C.amber]], C.violet),
    ...say('HOW MANY ORDERS ARE THERE?', C.violet)
  );

  // --- 12: Choose slot for 1 urgent card: 5 ways ----------------------------
  const uMarks = [0, 1, 2, 3, 4].map(k => {
    const d = new M.Dot({ point: [slotX(k), CARD_Y + SLOT_H / 2 + 0.28, 0], radius: 0.12, color: URG });
    d.setFill(URG, 0.95);
    return d;
  });
  const stepU = makeCard(0, 0);
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...altCards), { runTime: 0.4 }),
    new M.LaggedStart(uMarks.map(d => new M.FadeIn(d)), { lagRatio: 0.1, runTime: 0.8 }),
    new M.FadeIn(stepU, { runTime: 0.6 }),
    ...fbox([['1 urgent:  5 slots', URG], ['→ 5 ways', URG]], URG),
    ...say('STEP 1: 1 URGENT → 5 WAYS', URG)
  );

  // --- 13: Choose 2 of 4 slots left for normal: C(4,2) = 6 ways ------------
  const stepN = [makeCard(1, 1), makeCard(2, 1)];
  const pairCombos = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  // laptop: one row of 6 chips; phone: 2 rows of 3 bigger chips
  const pairY = P ? -3.6 : -2.45;
  const pairSp = P ? 2.1 : 1.3;
  const chipW = P ? 1.6 : 1.16, chipH = P ? 0.72 : 0.6, dotSp = P ? 0.34 : 0.25, dotR = P ? 0.12 : 0.095;
  const sixPairs = pairCombos.map(([a, b], idx) => {
    const px = P ? (idx % 3 - 1) * pairSp : CX + (idx - 2.5) * pairSp;
    const py = P ? pairY - Math.floor(idx / 3) * 0.95 : pairY;
    const box = new M.RoundedRectangle({ width: chipW, height: chipH, cornerRadius: 0.1, color: NOR, strokeWidth: 1.8 });
    box.setFill(C.card, 0.9); box.moveTo([px, py, 0]);
    const dots = [0, 1, 2, 3].map(j => {
      const lit = j === a || j === b;
      const d = new M.Dot({ point: [px + (j - 1.5) * dotSp, py, 0], radius: dotR, color: lit ? NOR : C.muted });
      d.setFill(lit ? NOR : C.muted, lit ? 1 : 0.35);
      return d;
    });
    return new M.VGroup(box, ...dots);
  });
  const sixCap = T('4 choose 2 = 6 pairs', 18, NOR, true, true);
  sixCap.moveTo([CX, pairY + (P ? 0.68 : 0.5), 0]);
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...uMarks), { runTime: 0.35 }),
    new M.FadeIn(new M.VGroup(...stepN), { runTime: 0.6 }),
    new M.FadeIn(sixCap, { runTime: 0.4 }),
    new M.LaggedStart(sixPairs.map(g => new M.FadeIn(g)), { lagRatio: 0.12, runTime: 1.2 }),
    ...fbox(['1 urgent:  5 ways', ['2 normal:  C(4,2) = 6', NOR]], NOR),
    ...say('STEP 2: 2 OF 4 SLOTS → 6 WAYS', NOR)
  );

  // --- 14: Last 2 slots go to low: 1 way ------------------------------------
  const stepL = [makeCard(3, 2), makeCard(4, 2)];
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...sixPairs, sixCap), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(...stepL), { runTime: 0.7 }),
    ...fbox(['1 urgent:  5 ways', '2 normal:  6 ways', ['2 low:     1 way', LOW]], LOW),
    ...say('STEP 3: LAST 2 SLOTS → 1 WAY', LOW)
  );

  // --- 15: 5 × 6 × 1 = 30 orders (all 30 literal permutations!) -------------
  const orders30 = [];
  for (let u = 0; u < 5; u++) {
    const rem = [0, 1, 2, 3, 4].filter(i => i !== u);
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const row = [2, 2, 2, 2, 2];
      row[u] = 0; row[rem[a]] = 1; row[rem[b]] = 1;
      orders30.push(row);
    }
  }
  // the 30 orders get the whole stage: each order = a framed row of 5 coloured cards
  const gCols = P ? 5 : 6, gRows = P ? 6 : 5;
  const gStepX = P ? 1.42 : 1.45, gStepY = P ? 1.0 : 0.82;
  const gCenterY = P ? -1.9 : -0.6;
  const miniW = P ? 0.2 : 0.21, miniH = P ? 0.5 : 0.44, miniGap = P ? 0.245 : 0.26;
  const orderTiles = orders30.map((perm, idx) => {
    const r = Math.floor(idx / gCols), c = idx % gCols;
    const tx = CX + (c - (gCols - 1) / 2) * gStepX;
    const ty = gCenterY + ((gRows - 1) / 2 - r) * gStepY;
    const fr = new M.RoundedRectangle({ width: 5 * miniGap + 0.12, height: miniH + 0.18, cornerRadius: 0.08, color: C.line, strokeWidth: 1.4 });
    fr.setFill(C.card, 0.6); fr.moveTo([tx, ty, 0]);
    const rects = perm.map((kind, j) => {
      const b = new M.RoundedRectangle({ width: miniW, height: miniH, cornerRadius: 0.05, color: KIND_C[kind], strokeWidth: 1 });
      b.setFill(KIND_C[kind], 0.88);
      b.moveTo([tx + (j - 2) * miniGap, ty, 0]);
      return b;
    });
    return new M.VGroup(fr, ...rects);
  });
  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(...legend, ...slots, stepU, ...stepN, ...stepL), { runTime: 0.35 }),
    new M.LaggedStart(orderTiles.map(t => new M.FadeIn(t)), { lagRatio: 0.04, runTime: 1.4 }),
    ...fbox(['5 × 6 × 1', ['= 30 orders', C.amber]], C.amber),
    ...say('5 × 6 × 1 = 30 ORDERS', C.amber)
  );

  // --- 16: Each order has the same chance: add 30 equal pieces --------------
  await until(S(16));
  await play(
    new M.LaggedStart(orderTiles.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.03, runTime: 1.5 }),
    ...fbox(['each order: 16 / 3125', '30 equal pieces', ['add 30 times = × 30', C.cyan]]),
    ...say('30 EQUAL PIECES: EACH = 16 / 3125')
  );

  // --- 17: 30 × 16 / 3125 ≈ 15 in 100 --------------------------------------
  await until(S(17));
  await play(
    new M.LaggedStart(orderTiles.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.03, runTime: 1.4 }),
    ...fbox(['30 × 16 / 3125', '= 480 / 3125', ['= 0.1536', C.amber], ['≈ 15 in 100 (15.4%)', C.green]], C.green),
    ...say('30 × 16 / 3125 ≈ 15 IN 100', C.green)
  );

  // --- 18: About three times in twenty --------------------------------------
  const dCols = P ? 5 : 10, dRows = P ? 4 : 2;
  const dSpX = P ? 1.1 : 0.72, dSpY = P ? 0.95 : 0.85, dCY = P ? -1.4 : -0.35;
  const dots20 = Array.from({ length: 20 }, (_, i) => {
    const r = Math.floor(i / dCols), c = i % dCols;
    const hit = i < 3;
    const x = CX + (c - (dCols - 1) / 2) * dSpX;
    const y = dCY + ((dRows - 1) / 2 - r) * dSpY;
    const d = new M.Dot({ point: [x, y, 0], radius: P ? 0.24 : 0.20, color: hit ? C.amber : C.muted });
    d.setFill(hit ? C.amber : C.muted, hit ? 0.95 : 0.28);
    return d;
  });
  const dCap = T('3 in 20 batches ≈ 15%', P ? 20 : 21, C.amber, true, true);
  dCap.moveTo([CX, dCY - (dRows / 2) * dSpY - 0.45, 0]);
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(...orderTiles), { runTime: 0.45 }),
    new M.LaggedStart(dots20.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.1 }),
    new M.FadeIn(dCap, { runTime: 0.6 }),
    ...fbox(['P(1 U, 2 N, 2 L)', '= 0.1536', ['≈ 3 times in 20', C.amber]], C.amber),
    ...say('ABOUT 3 TIMES IN 20', C.amber)
  );

  // --- 19: Named: multinomial distribution (multi = many) -------------------
  const multiY = P ? -1.1 : -0.15;
  const multiTitle = T('MULTINOMIAL', P ? 36 : 38, C.cyan, true, true);
  multiTitle.moveTo([CX, multiY + 0.85, 0]);
  const multiSub = T('multi = many  (more than 2 kinds)', P ? 18 : 20, C.amber, false, true);
  multiSub.moveTo([CX, multiY + 0.15, 0]);
  const multiPills = [0, 1, 2].map(i => {
    const p = pill(KIND_W[i].toUpperCase(), KIND_C[i], P ? 17 : 18);
    p.moveTo([CX + (i - 1) * (P ? 2.25 : 2.35), multiY - 0.65, 0]);
    return p;
  });
  const multiGroup = new M.VGroup(multiTitle, multiSub, ...multiPills);
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...dots20, dCap), { runTime: 0.45 }),
    new M.FadeIn(multiGroup, { runTime: 0.9 }),
    ...fbox([['MULTINOMIAL', C.cyan], 'multi = many', ['more than 2 kinds', C.amber]]),
    ...say('MULTINOMIAL DISTRIBUTION', C.cyan)
  );

  // --- 20: Binomial grown from two outcomes to many -------------------------
  const bBoxX = P ? 0 : CX - 2.25, mBoxX = P ? 0 : CX + 2.05;
  const bBoxY = P ? -0.35 : -0.30, mBoxY = P ? -2.95 : -0.30;
  const bW = P ? 5.6 : 3.3, bH = P ? 1.55 : 2.2;
  const binRect = new M.RoundedRectangle({ width: bW, height: bH, cornerRadius: 0.16, color: C.muted, strokeWidth: 2 });
  binRect.setFill(C.card, 0.9); binRect.moveTo([bBoxX, bBoxY, 0]);
  const binLbl = T('BINOMIAL (2 kinds)', P ? 18 : 17, C.muted, true, true); binLbl.moveTo([bBoxX, bBoxY + (P ? 0.42 : 0.65), 0]);
  const binD1 = pill('urgent', URG, 15).moveTo([bBoxX - (P ? 1.1 : 0.72), bBoxY - (P ? 0.22 : 0.22), 0]);
  const binD2 = pill('not', NOR, 15).moveTo([bBoxX + (P ? 1.1 : 0.72), bBoxY - (P ? 0.22 : 0.22), 0]);

  const mulRect = new M.RoundedRectangle({ width: bW, height: bH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.5 });
  mulRect.setFill(C.card, 0.92); mulRect.moveTo([mBoxX, mBoxY, 0]);
  const mulLbl = T('MULTINOMIAL (3+)', P ? 18 : 17, C.cyan, true, true); mulLbl.moveTo([mBoxX, mBoxY + (P ? 0.42 : 0.65), 0]);
  const mulDots = [0, 1, 2].map(i => {
    const p = pill(KIND_K[i], KIND_C[i], 15);
    p.moveTo([mBoxX + (i - 1) * (P ? 1.35 : 0.95), mBoxY - (P ? 0.22 : 0.22), 0]);
    return p;
  });
  const growArr = new M.Arrow({
    start: P ? [0, bBoxY - bH / 2 - 0.1, 0] : [bBoxX + bW / 2 + 0.12, bBoxY, 0],
    end: P ? [0, mBoxY + bH / 2 + 0.1, 0] : [mBoxX - bW / 2 - 0.12, mBoxY, 0],
    color: C.amber, strokeWidth: 3
  });
  const growGroup = new M.VGroup(binRect, binLbl, binD1, binD2, growArr, mulRect, mulLbl, ...mulDots);
  await until(S(20));
  await play(
    new M.FadeOut(multiGroup, { runTime: 0.45 }),
    new M.FadeIn(growGroup, { runTime: 0.9 }),
    ...say('BINOMIAL (2) → MULTINOMIAL (MANY)', C.violet)
  );

  // --- 21: Needs n = 5 and one chance for each kind -------------------------
  const nY = P ? -0.4 : 0.35, pY = P ? -2.35 : -1.15;
  const trialLbl = T('n = 5 trials', P ? 22 : 22, C.amber, true, true); trialLbl.moveTo([CX, nY + 0.55, 0]);
  const trialDots = [0, 1, 2, 3, 4].map(k => {
    const r = new M.RoundedRectangle({ width: 0.62, height: 0.62, cornerRadius: 0.1, color: C.amber, strokeWidth: 2 });
    r.setFill(C.amber, 0.22); r.moveTo([CX + (k - 2) * 0.85, nY - 0.15, 0]);
    const n = T(String(k + 1), 17, C.amber, true); n.moveTo([CX + (k - 2) * 0.85, nY - 0.15, 0]);
    return new M.VGroup(r, n);
  });
  const chLbl = T('one chance per kind', P ? 19 : 19, C.cyan, true); chLbl.moveTo([CX, pY + 0.52, 0]);
  const chPills = [0, 1, 2].map(i => {
    const p = pill(`${KIND_W[i]} ${KIND_F[i]}`, KIND_C[i], P ? 15 : 16);
    p.moveTo([CX + (i - 1) * (P ? 2.3 : 2.55), pY - 0.12, 0]);
    return p;
  });
  const needsGroup = new M.VGroup(trialLbl, ...trialDots, chLbl, ...chPills);
  await until(S(21));
  await play(
    new M.FadeOut(growGroup, { runTime: 0.45 }),
    new M.FadeIn(needsGroup, { runTime: 0.85 }),
    ...fbox(['inputs needed:', ['n = 5 trials', C.amber], ['chances: 1/5, 2/5, 2/5', C.cyan]]),
    ...say('NEEDS: n = 5 AND EACH CHANCE', C.amber)
  );

  // --- 22: Short version — factorial means multiplying down to 1 ------------
  const fY = P ? -1.1 : -0.15;
  const factHead = T('5!  ("five factorial")', P ? 26 : 28, C.cyan, true, true);
  factHead.moveTo([CX, fY + 0.95, 0]);
  const factNums = [5, 4, 3, 2, 1].map((v, i) => {
    const x = CX + (i - 2) * (P ? 1.25 : 1.35);
    const r = new M.RoundedRectangle({ width: 0.82, height: 0.82, cornerRadius: 0.12, color: C.amber, strokeWidth: 2 });
    r.setFill(C.amber, 0.2); r.moveTo([x, fY, 0]);
    const t = T(String(v), 26, C.amber, true, true); t.moveTo([x, fY, 0]);
    return new M.VGroup(r, t);
  });
  const factMul = [0, 1, 2, 3].map(i => {
    const t = T('×', 22, C.muted, true, true);
    t.moveTo([CX + (i - 1.5) * (P ? 1.25 : 1.35), fY, 0]);
    return t;
  });
  const factEq = T('= 120', P ? 28 : 30, C.green, true, true);
  factEq.moveTo([CX, fY - 1.0, 0]);
  await until(S(22));
  await play(
    new M.FadeOut(needsGroup, { runTime: 0.45 }),
    new M.FadeIn(factHead, { runTime: 0.5 }),
    new M.LaggedStart(factNums.map(n => new M.FadeIn(n)), { lagRatio: 0.14, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...factMul, factEq), { runTime: 0.8 }),
    ...fbox([['factorial (n!)', C.cyan], 'multiply down to 1', ['5! = 5×4×3×2×1 = 120', C.amber]]),
    ...say('FACTORIAL: MULTIPLY DOWN TO 1', C.cyan)
  );

  // --- 23: Orders = n! divided by factorial of each count -------------------
  const frY = P ? -1.1 : -0.15;
  const fTopGen = T('n!', P ? 36 : 38, C.amber, true, true); fTopGen.moveTo([CX, frY + 0.52, 0]);
  const fBarGen = new M.Line({ start: [CX - 2.3, frY, 0], end: [CX + 2.3, frY, 0], color: C.ink, strokeWidth: 3 });
  const fBotGen = new M.VGroup(
    T('k₁!', P ? 28 : 30, URG, true, true).moveTo([CX - 1.35, frY - 0.52, 0]),
    T('×', P ? 22 : 24, C.muted, true).moveTo([CX - 0.68, frY - 0.52, 0]),
    T('k₂!', P ? 28 : 30, NOR, true, true).moveTo([CX, frY - 0.52, 0]),
    T('×', P ? 22 : 24, C.muted, true).moveTo([CX + 0.68, frY - 0.52, 0]),
    T('k₃!', P ? 28 : 30, LOW, true, true).moveTo([CX + 1.35, frY - 0.52, 0])
  );
  const ordGen = new M.VGroup(fTopGen, fBarGen, fBotGen);
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(factHead, ...factNums, ...factMul, factEq), { runTime: 0.45 }),
    new M.FadeIn(ordGen, { runTime: 0.9 }),
    ...fbox(['number of orders:', ['n! ÷ (k₁! · k₂! · k₃!)', C.amber]]),
    ...say('ORDERS = n! ÷ EACH COUNT FACTORIAL', C.amber)
  );

  // --- 24: 5! = 120, divide by 1! · 2! · 2! = 1 · 2 · 2 → 30 ---------------
  const fTopNum = T('5!  =  120', P ? 30 : 32, C.amber, true, true); fTopNum.moveTo([CX, frY + 0.52, 0]);
  const fBarNum = new M.Line({ start: [CX - 2.6, frY, 0], end: [CX + 2.6, frY, 0], color: C.ink, strokeWidth: 3 });
  const fBotNum = new M.VGroup(
    T('1!', P ? 24 : 26, URG, true, true).moveTo([CX - 1.65, frY - 0.45, 0]),
    T('×', 20, C.muted, true).moveTo([CX - 0.85, frY - 0.45, 0]),
    T('2!', P ? 24 : 26, NOR, true, true).moveTo([CX, frY - 0.45, 0]),
    T('×', 20, C.muted, true).moveTo([CX + 0.85, frY - 0.45, 0]),
    T('2!', P ? 24 : 26, LOW, true, true).moveTo([CX + 1.65, frY - 0.45, 0]),
    T('(1  ×  2  ×  2  =  4)', P ? 18 : 20, C.muted, true).moveTo([CX, frY - 1.05, 0])
  );
  const ordNum = new M.VGroup(fTopNum, fBarNum, fBotNum);
  await until(S(24));
  await play(
    new M.FadeOut(ordGen, { runTime: 0.4 }),
    new M.FadeIn(ordNum, { runTime: 0.9 }),
    ...fbox(['5! = 120', ['1! = 1, 2! = 2, 2! = 2', C.muted], ['120 ÷ (1 × 2 × 2)', C.cyan]]),
    ...say('5! ÷ (1! × 2! × 2!)', C.cyan)
  );
  const res30 = pill('= 120 ÷ 4 = 30 ORDERS', C.amber, P ? 20 : 21);
  res30.moveTo([CX, frY - 1.85, 0]);
  await until(S(24) + 5.8);
  await play(
    new M.FadeIn(res30, { runTime: 0.7 }),
    ...fbox(['5! ÷ (1! · 2! · 2!)', '= 120 ÷ 4', ['= 30 orders', C.amber]], C.amber),
    ...say('120 ÷ 4 = 30 ORDERS', C.amber)
  );

  // --- 25: Multiply by each chance to the power of its count ----------------
  const pwrY = P ? -1.1 : -0.1;
  const ordBlock = new M.RoundedRectangle({ width: P ? 1.55 : 1.7, height: 1.15, cornerRadius: 0.14, color: C.amber, strokeWidth: 2.5 });
  ordBlock.setFill(C.amber, 0.18); ordBlock.moveTo([CX - (P ? 2.55 : 2.75), pwrY, 0]);
  const ordTxt = T('30', P ? 32 : 34, C.amber, true, true); ordTxt.moveTo([CX - (P ? 2.55 : 2.75), pwrY, 0]);
  const mulDot = T('×', 26, C.ink, true, true); mulDot.moveTo([CX - (P ? 1.48 : 1.58), pwrY, 0]);

  const pwrParts = [
    ['(1/5)¹', URG, CX - (P ? 0.45 : 0.45)],
    ['(2/5)²', NOR, CX + (P ? 1.15 : 1.25)],
    ['(2/5)²', LOW, CX + (P ? 2.75 : 2.95)]
  ].map(([txt, col, x]) => {
    const r = new M.RoundedRectangle({ width: P ? 1.42 : 1.50, height: 1.15, cornerRadius: 0.14, color: col, strokeWidth: 2.2 });
    r.setFill(col, 0.18); r.moveTo([x, pwrY, 0]);
    const t = T(txt, P ? 21 : 23, col, true, true); t.moveTo([x, pwrY, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(ordNum, res30), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(ordBlock, ordTxt, mulDot), { runTime: 0.6 }),
    new M.LaggedStart(pwrParts.map(g => new M.FadeIn(g)), { lagRatio: 0.18, runTime: 1.2 }),
    ...fbox(['30 × (1/5)¹(2/5)²(2/5)²', '= 30 × 16 / 3125', ['= 0.1536  (15.4%)', C.green]], C.cyan),
    ...say('× EACH CHANCE TO ITS COUNT', C.cyan)
  );

  // --- 26: Read it: number of orders × chance of one order -----------------
  const h1W = P ? 1.75 : 1.9, h2W = P ? 4.85 : 5.1;
  const h1X = CX - (P ? 2.55 : 2.75), h2X = CX + (P ? 1.15 : 1.25);
  const boxH1 = new M.RoundedRectangle({ width: h1W, height: 1.5, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  boxH1.moveTo([h1X, pwrY, 0]);
  const capH1 = T('NUMBER OF ORDERS', 15, C.amber, true, true); capH1.moveTo([h1X, pwrY - 1.05, 0]);

  const boxH2 = new M.RoundedRectangle({ width: h2W, height: 1.5, cornerRadius: 0.16, color: C.green, strokeWidth: 2.5 });
  boxH2.moveTo([h2X, pwrY, 0]);
  const capH2 = T('CHANCE OF ONE ORDER', 16, C.green, true, true); capH2.moveTo([h2X, pwrY - 1.05, 0]);
  const twoHalves = new M.VGroup(boxH1, capH1, boxH2, capH2);
  await until(S(26));
  await play(
    new M.FadeIn(twoHalves, { runTime: 0.8 }),
    ...say('ORDERS  ×  CHANCE OF ONE ORDER', C.green)
  );

  // --- 27: Average counts: 1 urgent, 2 normal, 2 low ------------------------
  const avgBaseY = P ? -3.45 : -2.05, avgMaxH = P ? 3.4 : 2.6, avgSp = P ? 2.15 : 2.35, avgBW = P ? 1.15 : 1.25;
  const avgChart = makeBarChart([1, 2, 2], CX, avgBaseY, avgMaxH, avgSp, avgBW);
  const avgTitle = T('Average counts in 5 tickets', P ? 19 : 20, C.ink, false, true);
  avgTitle.moveTo([CX, avgBaseY + avgMaxH + 0.55, 0]);
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(ordBlock, ordTxt, mulDot, ...pwrParts, twoHalves), { runTime: 0.45 }),
    new M.Create(avgChart.base, { runTime: 0.5 }),
    new M.FadeIn(avgTitle, { runTime: 0.5 }),
    new M.LaggedStart([0, 1, 2].map(i => new M.FadeIn(new M.VGroup(avgChart.bars[i], avgChart.nums[i], avgChart.caps[i]))), { lagRatio: 0.18, runTime: 1.2 }),
    ...fbox(['average in 5 tickets:', ['urgent: 5 × 1/5 = 1', URG], ['normal: 5 × 2/5 = 2', NOR], ['low:    5 × 2/5 = 2', LOW]]),
    ...say('AVERAGE = 5 × EACH CHANCE', C.amber)
  );

  // --- 28: Urgent vs not urgent → back to binomial --------------------------
  const mergeX = CX + avgSp * 0.5, mergeW = avgSp + avgBW + 0.45, mergeH = (2 / 5) * avgMaxH + 1.05;
  const mergeBox = new M.RoundedRectangle({ width: mergeW, height: mergeH, cornerRadius: 0.16, color: C.green, strokeWidth: 2.5 });
  mergeBox.moveTo([mergeX, avgBaseY + mergeH / 2 - 0.18, 0]);
  const mergeTag = pill('NOT URGENT (4/5)', C.green, P ? 15 : 16);
  mergeTag.moveTo([mergeX, avgBaseY + mergeH + 0.2, 0]);
  await until(S(28));
  await play(
    new M.Create(mergeBox, { runTime: 0.7 }),
    new M.FadeIn(mergeTag, { runTime: 0.6 }),
    ...fbox(['merge normal + low:', ['urgent:     1/5', URG], ['not urgent: 4/5', C.green], ['→ BINOMIAL (5.1.2)', C.cyan]], C.green),
    ...say('URGENT VS NOT URGENT = BINOMIAL', C.green)
  );

  // --- 29: What is it for? Counting several categories at once --------------
  const ufoTitle = T('COUNTING SEVERAL CATEGORIES AT ONCE', P ? 21 : 26, C.amber, true, true);
  ufoTitle.moveTo([0, P ? 0.55 : 0.75, 0]);
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(avgChart.base, avgTitle, ...avgChart.bars, ...avgChart.nums, ...avgChart.caps, mergeBox, mergeTag), { runTime: 0.45 }),
    ...clearBox(),
    new M.FadeIn(ufoTitle, { runTime: 0.6 }),
    ...say('WHAT IS IT FOR?', C.amber)
  );

  // --- 30: Votes for 3 parties, dice faces, car colours ---------------------
  const exW = P ? 6.6 : 3.6, exH = P ? 1.45 : 2.35;
  const exPos = P ? [[0, -0.75, 0], [0, -2.45, 0], [0, -4.15, 0]] : [[-4.1, -0.85, 0], [0, -0.85, 0], [4.1, -0.85, 0]];
  function makeExCard(idx, title, col, buildIcon) {
    const [x, y] = exPos[idx];
    const r = new M.RoundedRectangle({ width: exW, height: exH, cornerRadius: 0.16, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([x, y, 0]);
    const t = T(title, P ? 20 : 21, col, true, true);
    t.moveTo(P ? [x - 1.35, y, 0] : [x, y + 0.68, 0]);
    const ic = buildIcon(P ? x + 1.55 : x, P ? y : y - 0.35);
    return new M.VGroup(r, t, ...ic);
  }
  const exVotes = makeExCard(0, 'VOTES (3 parties)', URG, (ix, iy) => [
    [0.5, URG, -0.55], [0.85, NOR, 0], [0.65, LOW, 0.55]
  ].map(([h, c, dx]) => {
    const b = new M.Rectangle({ width: 0.36, height: h, color: c, strokeWidth: 1.5 });
    b.setFill(c, 0.85); b.moveTo([ix + dx, iy - 0.4 + h / 2, 0]); return b;
  }));
  const exDice = makeExCard(1, 'DICE (6 faces)', NOR, (ix, iy) => [0, 1, 2, 3, 4, 5].map(k => {
    const dx = ((k % 3) - 1) * 0.42, dy = (k < 3 ? 0.22 : -0.22);
    const d = new M.Dot({ point: [ix + dx, iy + dy, 0], radius: 0.11, color: NOR }); d.setFill(NOR, 0.9); return d;
  }));
  const exCars = makeExCard(2, 'CAR COLOURS', LOW, (ix, iy) => [URG, NOR, C.amber, C.green].map((c, k) => {
    const r = new M.RoundedRectangle({ width: 0.44, height: 0.28, cornerRadius: 0.08, color: c, strokeWidth: 1.5 });
    r.setFill(c, 0.85); r.moveTo([ix + (k - 1.5) * 0.54, iy, 0]); return r;
  }));
  const exCards = [exVotes, exDice, exCars];
  await until(S(30));
  await play(
    new M.LaggedStart(exCards.map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.6 }),
    ...say('VOTES · DICE FACES · CAR COLOURS', C.cyan)
  );

  // --- 31: Common trap: the three counts are NOT independent ----------------
  const tCardY = P ? 0.15 : 0.45;
  const tSlots = [0, 1, 2, 3, 4].map(k => makeSlot(k, tCardY));
  const tCards1 = [0, 1, 1, 2, 2].map((kind, k) => makeCard(k, kind, tCardY));
  const tBarY = P ? -3.85 : -2.35, tBarH = P ? 2.0 : 1.45, tBarSp = P ? 2.1 : 2.25, tBW = P ? 1.0 : 1.1;
  let tChart = makeBarChart([1, 2, 2], CX, tBarY, tBarH, tBarSp, tBW);
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(ufoTitle, ...exCards), { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...tSlots, ...tCards1), { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(tChart.base, ...tChart.bars, ...tChart.nums, ...tChart.caps), { runTime: 0.7 }),
    ...fbox([['COMMON TRAP', C.pink], 'the three counts are', ['NOT independent', C.pink]], C.pink),
    ...say('TRAP: COUNTS ARE NOT INDEPENDENT', C.pink)
  );

  // --- 32: They must always add up to five ----------------------------------
  const linkY = tBarY - 0.78;
  const sumLink = pill('URGENT + NORMAL + LOW = 5', C.amber, P ? 16 : 17);
  sumLink.moveTo([CX, linkY, 0]);
  await until(S(32));
  await play(
    new M.FadeIn(sumLink, { runTime: 0.6 }),
    ...fbox(['always locked to n = 5:', ['1 + 2 + 2 = 5', C.amber]], C.amber),
    ...say('THEY MUST ALWAYS ADD UP TO 5', C.amber)
  );

  // --- 33: More urgent → fewer of the other kinds (3, 1, 1) -----------------
  const tCards2 = [0, 0, 1, 0, 2].map((kind, k) => makeCard(k, kind, tCardY));
  const tChart2 = makeBarChart([3, 1, 1], CX, tBarY, tBarH, tBarSp, tBW);
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...tCards1, tChart.base, ...tChart.bars, ...tChart.nums, ...tChart.caps), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(...tCards2, tChart2.base, ...tChart2.bars, ...tChart2.nums, ...tChart2.caps), { runTime: 0.7 }),
    ...fbox(['more urgent → fewer others', ['3 + 1 + 1 = 5', URG]], URG),
    ...say('MORE URGENT → FEWER OTHERS', URG)
  );

  // --- 34: All five urgent → normal and low must both be zero (5, 0, 0) -----
  const tCards3 = [0, 0, 0, 0, 0].map((kind, k) => makeCard(k, kind, tCardY));
  const tChart3 = makeBarChart([5, 0, 0], CX, tBarY, tBarH, tBarSp, tBW);
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(...tCards2, tChart2.base, ...tChart2.bars, ...tChart2.nums, ...tChart2.caps), { runTime: 0.4 }),
    new M.FadeIn(new M.VGroup(...tCards3, tChart3.base, ...tChart3.bars, ...tChart3.nums, ...tChart3.caps), { runTime: 0.7 }),
    ...fbox(['all 5 urgent:', ['5 + 0 + 0 = 5', URG], ['normal = 0, low = 0', C.pink]], C.pink),
    ...say('ALL 5 URGENT → NORMAL & LOW = 0', C.pink)
  );

  // --- 35: Treating them as independent forgets this link -------------------
  await until(S(35));
  await play(
    new M.Indicate(sumLink, { color: C.pink, runTime: 1.2 }),
    ...fbox([['DO NOT FORGET THE LINK', C.pink], 'counts share 5 slots', 'one up → others down'], C.pink),
    ...say('COUNTS ARE LINKED BY TOTAL = 5', C.pink)
  );

  // --- 36: Next chapter: counts → measurements (weights and times) ----------
  const brLX = P ? 0 : -3.45, brRX = P ? 0 : 3.45;
  const brLY = P ? -0.35 : -0.35, brRY = P ? -3.15 : -0.35;
  const cBox = new M.RoundedRectangle({ width: P ? 6.2 : 4.7, height: P ? 1.65 : 2.35, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  cBox.setFill(C.card, 0.92); cBox.moveTo([brLX, brLY, 0]);
  const cHead = T('COUNTS (Ch. 5.1)', P ? 19 : 20, C.cyan, true, true); cHead.moveTo([brLX, brLY + (P ? 0.45 : 0.70), 0]);
  const cDots = [0, 1, 2, 3, 4, 5].map(v => {
    const x = brLX + (v - 2.5) * (P ? 0.85 : 0.68);
    const d = new M.Dot({ point: [x, brLY - 0.12, 0], radius: 0.11, color: C.cyan }); d.setFill(C.cyan, 0.95);
    const l = T(String(v), 16, C.muted, true); l.moveTo([x, brLY - 0.46, 0]);
    return new M.VGroup(d, l);
  });

  const mBox = new M.RoundedRectangle({ width: P ? 6.2 : 4.7, height: P ? 1.65 : 2.35, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 });
  mBox.setFill(C.card, 0.92); mBox.moveTo([brRX, brRY, 0]);
  const mHead = T('MEASUREMENTS (Next)', P ? 19 : 20, C.violet, true, true); mHead.moveTo([brRX, brRY + (P ? 0.45 : 0.70), 0]);
  const mLine = new M.Line({ start: [brRX - (P ? 2.3 : 1.75), brRY - 0.12, 0], end: [brRX + (P ? 2.3 : 1.75), brRY - 0.12, 0], color: C.violet, strokeWidth: 4 });
  const mSub = T('weights · times · any value', P ? 16 : 16, C.ink, false); mSub.moveTo([brRX, brRY - 0.54, 0]);

  const brArr = new M.Arrow({
    start: P ? [0, brLY - 0.92, 0] : [brLX + 2.5, brLY, 0],
    end: P ? [0, brRY + 0.92, 0] : [brRX - 2.5, brRY, 0],
    color: C.amber, strokeWidth: 3
  });
  const bridge = new M.VGroup(cBox, cHead, ...cDots, brArr, mBox, mHead, mLine, mSub);
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...tSlots, ...tCards3, tChart3.base, ...tChart3.bars, ...tChart3.nums, ...tChart3.caps, sumLink), { runTime: 0.45 }),
    ...clearBox(),
    new M.FadeIn(bridge, { runTime: 0.9 }),
    ...say('NEXT CHAPTER: COUNTS → MEASUREMENTS', C.violet)
  );

  // --- 37: One-sentence recap -----------------------------------------------
  const endSlots = [0, 1, 2, 3, 4].map(k => makeSlot(k, tCardY));
  const endCards = [0, 1, 1, 2, 2].map((kind, k) => makeCard(k, kind, tCardY));
  const endSum = pill('1 URGENT + 2 NORMAL + 2 LOW = 5', C.green, P ? 16 : 18);
  endSum.moveTo([CX, tCardY - SLOT_H / 2 - 1.1, 0]);
  const endCap = T('n trials · several kinds · counts add up to n', P ? 19 : 21, C.ink, false, true);
  endCap.moveTo([CX, tCardY - SLOT_H / 2 - 1.85, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(bridge, { runTime: 0.45 }),
    new M.FadeIn(new M.VGroup(...endSlots, ...endCards, endSum, endCap), { runTime: 1.0 }),
    ...fbox([['MULTINOMIAL', C.cyan], 'several kinds in n trials', ['orders × one order', C.amber], ['counts always add to n', C.green]], C.green),
    ...say('SEVERAL KINDS · COUNTS ADD TO n', C.green)
  );
}

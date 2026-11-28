// 1.3.1 Range and interquartile range (live manim-web lesson).
// Beat i = sentence i (0-based, 58 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;

  const D1 = [3, 4, 4, 5, 6, 6, 7];
  const D2 = [3, 4, 4, 5, 6, 6, 21];

  // Layout constants: portrait phone (8 x 14.22, y in [-5.5, 4.3]) and laptop (14.22 x 8, y in [-3.0, 2.3])
  const X0 = P ? -3.3 : -6.35, X1 = P ? 3.3 : 2.05, L0 = X1 - X0, CX = (X0 + X1) / 2;
  const LY = P ? 0.55 : -0.3;
  const PILL = P ? [0, 3.85, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -4.1, 0] : [4.65, -0.35, 0];
  const BOX_MAXW = P ? FW - 1.0 : 4.2;
  const IQR_Y = P ? LY - 1.7 : LY - 1.05;
  const RNG_Y = P ? LY - 3.0 : LY - 1.95;
  const RIB_Y = P ? LY - 1.9 : LY - 1.35;
  const TAG_Y = P ? LY + 2.0 : LY + 1.68;
  // marker lines stop just above the dot stack, below the number label (no line through a label)
  const lineTop = (arr, v) => LY + 0.32 + (arr.filter(x => x === v).length - 1) * 0.44 + 0.2;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const x8 = v => X0 + ((v - 2) / 6) * L0;
  // bad-week axis: 2..8 stretched, then a break mark, then 21 (so the normal dots stay readable)
  const x22 = v => X0 + L0 * (v <= 8 ? ((v - 2) / 6) * 0.68 : 0.8 + 0.19 * (v - 8) / 13);
  const clampX = (x, w) => Math.max(X0 + w / 2, Math.min(X1 - w / 2, x));

  // One formula box at a time (matches 1.2.4 reference)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.43 : 0.4;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Drawing helpers (every returned object is fresh, placed with moveTo, fills set via setFill)
  const makeDot = (p, color = C.cyan, r = 0.125) => {
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return d;
  };
  const makeHalo = (p, color = C.cyan, r = 0.27) => {
    const h = new M.Dot({ point: p, radius: r, color });
    h.setFill(color, 0.18);
    return h;
  };
  const makeRing = (p, color, r = 0.24) => {
    const c = new M.Circle({ radius: r, color, strokeWidth: 3 });
    c.setFill(color, 0);
    c.moveTo(p);
    return c;
  };
  const dotPos = (arr, k, fn) => {
    const v = arr[k], stack = arr.slice(0, k).filter(x => x === v).length;
    return [fn(v), LY + 0.32 + stack * 0.44, 0];
  };
  const makeTicks = (vals, fn, unitX = X1 - 0.15, brk = false) => {
    const items = [];
    for (const v of vals) {
      const x = fn(v);
      items.push(new M.Line({ start: [x, LY - 0.08, 0], end: [x, LY + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const t = T(String(v), P ? 18 : 19, C.muted, true);
      t.moveTo([x, LY - 0.34, 0]);
      items.push(t);
    }
    const unit = T('days', 17, C.muted);
    unit.moveTo([unitX, LY - 0.66, 0]);
    items.push(unit);
    if (brk) {
      const bx = X0 + L0 * 0.74;
      const cover = new M.Rectangle({ width: 0.3, height: 0.3, color: C.bg, strokeWidth: 0 });
      cover.setFill(C.bg, 1); cover.moveTo([bx, LY, 0]); items.push(cover);
      for (const d of [-0.07, 0.07]) items.push(new M.Line({ start: [bx + d - 0.06, LY - 0.14, 0], end: [bx + d + 0.06, LY + 0.14, 0], color: C.muted, strokeWidth: 2 }));
    }
    return new M.VGroup(...items);
  };
  const spanBar = (xa, xb, y, color, text, right = false) => {
    const bar = new M.Line({ start: [xa, y, 0], end: [xb, y, 0], color, strokeWidth: 4 });
    const cL = new M.Line({ start: [xa, y - 0.12, 0], end: [xa, y + 0.12, 0], color, strokeWidth: 3 });
    const cR = new M.Line({ start: [xb, y - 0.12, 0], end: [xb, y + 0.12, 0], color, strokeWidth: 3 });
    const lbl = T(text, P ? 18 : 19, color, true);
    if (right) lbl.moveTo([xb + 0.2 + lbl.getWidth() / 2, y, 0]);
    else lbl.moveTo([clampX((xa + xb) / 2, lbl.getWidth()), y - 0.3, 0]);
    return new M.VGroup(bar, cL, cR, lbl);
  };
  const parcelIcon = (x, y) => {
    const bw = P ? 0.62 : 0.72, bh = P ? 0.5 : 0.56;
    const box = new M.RoundedRectangle({ width: bw, height: bh, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
    box.setFill(C.card, 0.95);
    box.moveTo([x, y, 0]);
    const vTape = new M.Line({ start: [x, y - bh / 2, 0], end: [x, y + bh / 2, 0], color: C.amber, strokeWidth: 2 });
    const hTape = new M.Line({ start: [x - bw / 2, y + 0.04, 0], end: [x + bw / 2, y + 0.04, 0], color: C.amber, strokeWidth: 2 });
    return new M.VGroup(box, vTape, hTape);
  };
  const styleDot = (k, col, dotOp = 1, haloOp = 0.18) => {
    dots[k].setColor(col);
    dots[k].setFill(col, dotOp);
    halos[k].setColor(col);
    halos[k].setFill(col, haloOp);
  };

  // --- 0-2: café parcels & question -------------------------------------------
  const pSp = P ? 0.88 : 1.1;
  const parcels = D1.map((_, k) => parcelIcon(CX + (k - 3) * pSp, LY + 0.35));
  await until(S(0));
  await play(new M.LaggedStart(parcels.map(p => new M.FadeIn(p)), { lagRatio: 0.1, runTime: 1.5 }),
    ...fbox(['a café sends', ['coffee beans by post', C.amber]]), ...say('CAFÉ PARCELS BY POST'));

  const spreadL = new M.Arrow({ start: [CX - 0.5, LY - 0.35, 0], end: [CX - 3 * pSp - 0.2, LY - 0.35, 0], color: C.amber, strokeWidth: 3 });
  const spreadR = new M.Arrow({ start: [CX + 0.5, LY - 0.35, 0], end: [CX + 3 * pSp + 0.2, LY - 0.35, 0], color: C.amber, strokeWidth: 3 });
  await until(S(1));
  await play(new M.Create(spreadL), new M.Create(spreadR),
    ...fbox(['question:', ['how spread out are', C.amber], ['the delivery times?', C.amber]], C.amber),
    ...say('HOW SPREAD OUT ARE THE TIMES?', C.amber));

  const fastTxt = T('← fastest', 18, C.muted); fastTxt.moveTo([CX - 2.6 * pSp, LY + 1.0, 0]);
  const slowTxt = T('slowest →', 18, C.muted); slowTxt.moveTo([CX + 2.6 * pSp, LY + 1.0, 0]);
  await until(S(2));
  await play(new M.FadeIn(fastTxt), new M.FadeIn(slowTxt), ...say('7 PARCELS · FASTEST TO SLOWEST'));

  // --- 3-6: number line & the seven dots --------------------------------------
  const axis = new M.Line({ start: [X0, LY, 0], end: [X1, LY, 0], color: C.muted, strokeWidth: 3 });
  let ticks = makeTicks([2, 3, 4, 5, 6, 7, 8], x8);
  const pos8 = D1.map((_, k) => dotPos(D1, k, x8));
  const halos = pos8.map(p => makeHalo(p, C.cyan, 0.27));
  const dots = pos8.map(p => makeDot(p, C.cyan, 0.125));
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...parcels, spreadL, spreadR, fastTxt, slowTxt)),
    new M.Create(axis),
    new M.FadeIn(ticks),
    new M.LaggedStart(dots.map((d, k) => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.LaggedStart(halos.map(h => new M.FadeIn(h)), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('EACH BLUE DOT = 1 PARCEL (DAYS)')
  );

  // Column labels above the 5 distinct day positions (3, 4, 5, 6, 7)
  const makeColLabels = (arr, fn, sz = P ? 19 : 19) => {
    const uniq = [...new Set(arr)];
    return uniq.map(v => {
      const cnt = arr.filter(x => x === v).length;
      const topY = LY + 0.32 + (cnt - 1) * 0.44 + 0.4;
      const col = v >= 15 ? C.pink : C.cyan;
      const t = T(String(v), sz, col, true);
      t.moveTo([fn(v), topY, 0]);
      return t;
    });
  };
  let colLabs = makeColLabels(D1, x8);

  await until(S(4));
  await play(
    new M.LaggedStart([0, 1, 2, 3].map(k => new M.Flash(dots[k], { color: C.cyan })), { lagRatio: 0.35, runTime: 2.2 }),
    new M.LaggedStart([colLabs[0], colLabs[1], colLabs[2]].map(t => new M.FadeIn(t)), { lagRatio: 0.35, runTime: 1.8 }),
    ...fbox(['times (days):', ['3, 4, 4, 5', C.cyan]]),
    ...say('3, 4, 4, 5 DAYS')
  );

  await until(S(5));
  await play(
    new M.LaggedStart([4, 5, 6].map(k => new M.Flash(dots[k], { color: C.cyan })), { lagRatio: 0.35, runTime: 1.5 }),
    new M.LaggedStart([colLabs[3], colLabs[4]].map(t => new M.FadeIn(t)), { lagRatio: 0.35, runTime: 1.3 }),
    ...fbox(['times (days):', ['3, 4, 4, 5, 6, 6, 7', C.cyan]]),
    ...say('6, 6, 7 DAYS')
  );

  const dbox = new M.RoundedRectangle({ width: x8(7) - x8(3) + 0.9, height: 1.55, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  dbox.moveTo([(x8(3) + x8(7)) / 2, LY + 0.72, 0]);
  await until(S(6));
  await play(
    new M.Create(dbox),
    ...fbox(['normal week (days)', ['3, 4, 4, 5, 6, 6, 7', C.cyan]]),
    ...say('DATA = MEASUREMENTS COLLECTED')
  );

  // --- 7-11: the range --------------------------------------------------------
  const endL = new M.DashedLine({ start: [x8(3), LY - 0.62, 0], end: [x8(3), RNG_Y, 0], color: C.amber });
  const endR = new M.DashedLine({ start: [x8(7), LY - 0.62, 0], end: [x8(7), RNG_Y, 0], color: C.amber });
  await until(S(7));
  await play(new M.FadeOut(dbox), new M.Create(endL), new M.Create(endR), ...say('MEASURE: FASTEST TO SLOWEST', C.amber));

  const ring0 = makeRing(pos8[0], C.amber), ring6 = makeRing(pos8[6], C.amber);
  await until(S(8));
  await play(
    new M.FadeIn(ring0), new M.FadeIn(ring6),
    ...fbox(['fastest = 3 days', 'slowest = 7 days'], C.amber),
    ...say('FASTEST = 3  ·  SLOWEST = 7', C.amber)
  );

  let rngBar = spanBar(x8(3), x8(7), RNG_Y, C.amber, '4 days');
  await until(S(9));
  await play(
    new M.Create(rngBar),
    ...fbox(['fastest = 3 days', 'slowest = 7 days', ['gap = 4 days', C.amber]], C.amber),
    ...say('GAP FROM 3 TO 7 = 4 DAYS', C.amber)
  );

  const rngBarNamed = spanBar(x8(3), x8(7), RNG_Y, C.amber, 'range = 4 days');
  await until(S(10));
  await play(
    new M.FadeOut(rngBar), new M.FadeIn(rngBarNamed),
    ...fbox(['fastest = 3 days', 'slowest = 7 days', ['range = 4 days', C.amber]], C.amber),
    ...say('FULL SPAN = RANGE', C.amber)
  );
  rngBar = rngBarNamed;

  await until(S(11));
  [1, 2, 3, 4, 5].forEach(k => styleDot(k, C.muted, 0.25, 0.04));
  await play(
    new M.Indicate(dots[0], { color: C.amber }),
    new M.Indicate(dots[6], { color: C.amber }),
    ...say('ONLY USES THE TWO ENDS', C.muted)
  );

  // --- 12-18: finding the center & splitting into halves ----------------------
  await until(S(12));
  [1, 2, 3, 4, 5].forEach(k => styleDot(k, C.cyan, 1, 0.18));
  await play(
    new M.FadeOut(new M.VGroup(rngBar, endL, endR, ring0, ring6)),
    ...say('HOW TIGHT IS THE MIDDLE?', C.violet)
  );

  await until(S(13));
  await play(
    new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.14, runTime: 2.0 }),
    ...fbox(['in order (7 parcels)', ['3, 4, 4, 5, 6, 6, 7', C.cyan]]),
    ...say('7 DOTS · FASTEST TO SLOWEST')
  );

  const midLine = new M.DashedLine({ start: [x8(5), LY - 0.1, 0], end: [x8(5), lineTop(D1, 5), 0], color: C.violet });
  const midRing = makeRing(pos8[3], C.violet);
  await until(S(14));
  await play(
    new M.Create(midLine), new M.FadeIn(midRing), new M.Flash(dots[3], { color: C.violet }),
    ...fbox(['in order:', '3, 4, 4, [5], 6, 6, 7', ['center = 5 days', C.violet]], C.violet),
    ...say('MIDDLE DOT = 5 DAYS', C.violet)
  );

  const boxL = new M.RoundedRectangle({ width: x8(4) - x8(3) + 0.72, height: 1.62, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
  boxL.moveTo([(x8(3) + x8(4)) / 2, LY + 0.74, 0]);
  const boxR = new M.RoundedRectangle({ width: x8(7) - x8(6) + 0.72, height: 1.62, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
  boxR.moveTo([(x8(6) + x8(7)) / 2, LY + 0.74, 0]);
  await until(S(15));
  await play(new M.Create(boxL), new M.Create(boxR), ...say('3 FASTER  ·  3 SLOWER'));

  await until(S(16));
  await play(new M.Indicate(midLine, { color: C.violet }), ...say('CENTER DOT: NEITHER SIDE', C.violet));

  await until(S(17));
  styleDot(3, C.muted, 0.4, 0.06);
  await play(
    ...fbox(['lower half: 3, 4, 4', 'upper half: 6, 6, 7', ['(leave out center 5)', C.muted]], C.violet),
    ...say('TWO EQUAL HALVES (3 EACH)', C.violet)
  );

  await until(S(18));
  await play(
    ...fbox(['even count, e.g. 6 parcels:', ['1st 2nd 3rd | 4th 5th 6th', C.cyan], ['no center: cut in the middle', C.muted]], C.muted),
    ...say('EVEN COUNT: SPLIT IN MIDDLE', C.muted)
  );

  // --- 19-24: middle of each half ---------------------------------------------
  await until(S(19));
  await play(
    ...fbox(['lower half: 3, 4, 4', 'upper half: 6, 6, 7'], C.green),
    ...say('MIDDLE OF EACH HALF', C.green)
  );

  await until(S(20));
  [4, 5, 6].forEach(k => styleDot(k, C.muted, 0.3, 0.04));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(dots[k], { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox(['lower half (in order)', ['3, 4, 4', C.green]], C.green),
    ...say('LOWER HALF: 3, 4, 4', C.green)
  );

  const q1Line = new M.DashedLine({ start: [x8(4), LY - 0.1, 0], end: [x8(4), lineTop(D1, 4), 0], color: C.green });
  const q1Ring = makeRing(pos8[1], C.green);
  await until(S(21));
  await play(
    new M.Create(q1Line), new M.FadeIn(q1Ring), new M.Flash(dots[1], { color: C.green }),
    ...fbox(['lower half: 3, [4], 4', ['middle = 4 days', C.green]], C.green),
    ...say('MIDDLE OF LOWER HALF = 4', C.green)
  );

  await until(S(22));
  [0, 1, 2].forEach(k => styleDot(k, C.muted, 0.35, 0.05));
  [4, 5, 6].forEach(k => styleDot(k, C.cyan, 1, 0.18));
  await play(
    new M.LaggedStart([4, 5, 6].map(k => new M.Indicate(dots[k], { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox(['upper half (in order)', ['6, 6, 7', C.green]], C.green),
    ...say('UPPER HALF: 6, 6, 7', C.green)
  );

  const q3Line = new M.DashedLine({ start: [x8(6), LY - 0.1, 0], end: [x8(6), lineTop(D1, 6), 0], color: C.green });
  const q3Ring = makeRing(pos8[4], C.green);
  await until(S(23));
  await play(
    new M.Create(q3Line), new M.FadeIn(q3Ring), new M.Flash(dots[4], { color: C.green }),
    ...fbox(['upper half: 6, [6], 7', ['middle = 6 days', C.green]], C.green),
    ...say('MIDDLE OF UPPER HALF = 6', C.green)
  );

  await until(S(24));
  D1.forEach((_, k) => styleDot(k, C.cyan, 1, 0.18));
  await play(
    new M.FadeOut(new M.VGroup(boxL, boxR)),
    new M.Indicate(q1Line, { color: C.green }),
    new M.Indicate(midLine, { color: C.violet }),
    new M.Indicate(q3Line, { color: C.green }),
    ...fbox(['three markers:', ['4  ·  5  ·  6 days', C.violet]], C.violet),
    ...say('THREE MARKERS: 4, 5, 6', C.violet)
  );

  // --- 25-32: ribbon analogy & naming the quartiles ---------------------------
  const ribW = P ? 5.6 : 6.4, ribH = 0.48;
  const ribRect = new M.Rectangle({ width: ribW, height: ribH, color: C.violet, strokeWidth: 2 });
  ribRect.setFill(C.violet, 0.18);
  ribRect.moveTo([CX, RIB_Y, 0]);
  const cuts = [-1, 0, 1].map(i =>
    new M.Line({ start: [CX + i * (ribW / 4), RIB_Y - ribH / 2 - 0.12, 0], end: [CX + i * (ribW / 4), RIB_Y + ribH / 2 + 0.12, 0], color: C.amber, strokeWidth: 4 })
  );
  const ribbon = new M.VGroup(ribRect, ...cuts);
  await until(S(25));
  await play(new M.Create(ribbon), ...say('3 CUTS → 4 EQUAL QUARTERS', C.violet));

  const qNums = [0, 1, 2, 3].map(i => {
    const t = T(`¼`, P ? 18 : 20, C.ink, true);
    t.moveTo([CX + (i - 1.5) * (ribW / 4), RIB_Y, 0]);
    return t;
  });
  await until(S(26));
  await play(
    new M.LaggedStart(qNums.map(q => new M.FadeIn(q)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.LaggedStart([0, 2, 5, 6].map(k => new M.Indicate(dots[k], { color: C.amber })), { lagRatio: 0.18, runTime: 1.6 }),
    ...say('1 PARCEL IN EACH QUARTER')
  );

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(ribbon, ...qNums)),
    ...fbox(['quartiles (quarter markers)', ['4,  5,  6 days', C.violet]], C.violet),
    ...say('QUARTILES = QUARTER MARKERS', C.violet)
  );

  const midTag = T('middle 5', P ? 16 : 17, C.violet, true);
  midTag.moveTo([x8(5), TAG_Y, 0]);
  await until(S(28));
  await play(new M.FadeIn(midTag), new M.Indicate(midLine, { color: C.violet }), ...say('MIDDLE QUARTILE = 5 DAYS', C.violet));

  await until(S(29));
  await play(new M.FadeOut(midRing), ...say('ONLY SPLITS INTO TWO HALVES', C.muted));

  const q1Tag = T('lower 4', P ? 16 : 17, C.green, true);
  q1Tag.moveTo([x8(4), TAG_Y, 0]);
  await until(S(30));
  await play(
    new M.FadeIn(q1Tag), new M.Indicate(q1Line, { color: C.green }),
    ...fbox([['lower quartile = 4', C.green], 'upper quartile = ?'], C.green),
    ...say('LOWER QUARTILE = 4 DAYS', C.green)
  );

  const q3Tag = T('upper 6', P ? 16 : 17, C.green, true);
  q3Tag.moveTo([x8(6), TAG_Y, 0]);
  await until(S(31));
  await play(
    new M.FadeIn(q3Tag), new M.Indicate(q3Line, { color: C.green }),
    ...fbox([['lower quartile = 4', C.green], ['upper quartile = 6', C.green]], C.green),
    ...say('UPPER QUARTILE = 6 DAYS', C.green)
  );

  const midBand = new M.Rectangle({ width: x8(6) - x8(4), height: 1.35, color: C.green, strokeWidth: 0 });
  midBand.setFill(C.green, 0.14);
  midBand.moveTo([(x8(4) + x8(6)) / 2, LY + 0.68, 0]);
  await until(S(32));
  [0, 6].forEach(k => styleDot(k, C.muted, 0.32, 0.05));
  await play(new M.FadeIn(midBand), ...say('FRAMES THE MIDDLE STRETCH', C.green));

  // --- 33-37: interquartile range ---------------------------------------------
  let iqrBar = spanBar(x8(4), x8(6), IQR_Y, C.green, '2 days');
  await until(S(33));
  await play(
    new M.Create(iqrBar),
    ...fbox(['lower quartile = 4', 'upper quartile = 6', ['gap = 2 days', C.green]], C.green),
    ...say('GAP FROM 4 TO 6 = 2 DAYS', C.green)
  );

  await until(S(34));
  await play(new M.Indicate(iqrBar, { color: C.green }), ...say('RANGE BETWEEN THE QUARTILES', C.green));

  await until(S(35));
  await play(
    ...fbox([['inter = between', C.violet], 'inter-national:', '  between nations'], C.violet),
    ...say('INTER = BETWEEN', C.violet)
  );

  const iqrBarNamed = spanBar(x8(4), x8(6), IQR_Y, C.green, 'interquartile: 2 days');
  await until(S(36));
  await play(
    new M.FadeOut(iqrBar), new M.FadeIn(iqrBarNamed),
    ...fbox([['inter + quartile', C.green], ['= interquartile range', C.green], ['= 2 days', C.amber]], C.green),
    ...say('INTERQUARTILE RANGE', C.green)
  );
  iqrBar = iqrBarNamed;

  const rngNorm = spanBar(x8(3), x8(7), RNG_Y, C.amber, 'range = 4 days');
  await until(S(37));
  [0, 6].forEach(k => styleDot(k, C.cyan, 1, 0.18));
  await play(
    new M.Create(rngNorm),
    ...fbox(['normal week:', ['range = 4 days', C.amber], ['interquartile range = 2', C.green]], C.cyan),
    ...say('NORMAL: RANGE 4 · MIDDLE 2')
  );

  // --- 38-50: bad week (outlier at 21 days) -----------------------------------
  await until(S(38));
  await play(...say('NOW TEST A BAD WEEK', C.pink));

  await until(S(39));
  await play(
    new M.Indicate(dots[6], { color: C.pink }),
    ...fbox(['bad week:', 'last parcel: 7 → 21 days', ['(lost in post!)', C.pink]], C.pink),
    ...say('LAST PARCEL LOST: 21 DAYS', C.pink)
  );

  // Rescale number line 0..22 and slide dot 6 (pink) out to 21
  const pos22 = D2.map((_, k) => dotPos(D2, k, x22));
  const ticks22 = makeTicks([3, 4, 5, 6, 7, 21], x22, X0 + L0 * 0.87, true);
  const colLabs22 = makeColLabels(D2, x22, P ? 17 : 19);
  const dotR22 = 0.125, haloR22 = 0.27;

  await until(S(40));
  const dotMoves = D2.map((_, k) => new M.Transform(dots[k], makeDot(pos22[k], k === 6 ? C.pink : C.cyan, dotR22)));
  const haloMoves = D2.map((_, k) => new M.Transform(halos[k], makeHalo(pos22[k], k === 6 ? C.pink : C.cyan, haloR22)));
  await play(
    new M.FadeOut(new M.VGroup(ticks, ...colLabs, midLine, q1Line, q3Line, q1Ring, q3Ring, midTag, q1Tag, q3Tag, midBand, iqrBar, rngNorm)),
    new M.FadeIn(ticks22),
    ...dotMoves,
    ...haloMoves,
    new M.LaggedStart(colLabs22.map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.0 }),
    ...say('TURNS PINK → SLIDES TO 21', C.pink)
  );
  styleDot(6, C.pink, 1, 0.22);

  const end22L = new M.DashedLine({ start: [x22(3), LY - 0.62, 0], end: [x22(3), RNG_Y, 0], color: C.pink });
  const end22R = new M.DashedLine({ start: [x22(21), LY - 0.62, 0], end: [x22(21), RNG_Y, 0], color: C.pink });
  await until(S(41));
  await play(
    new M.Create(end22L), new M.Create(end22R),
    new M.Indicate(dots[0], { color: C.cyan }),
    new M.Indicate(dots[6], { color: C.pink }),
    ...fbox(['bad week:', 'fastest = 3 days', ['slowest = 21 days', C.pink]], C.pink),
    ...say('FASTEST = 3  ·  SLOWEST = 21', C.pink)
  );

  let rngBad = spanBar(x22(3), x22(21), RNG_Y, C.pink, '18 days');
  await until(S(42));
  await play(
    new M.Create(rngBad),
    ...fbox(['step back 3 from 21:', '21 → 20 → 19 → 18', ['range = 18 days', C.pink]], C.pink),
    ...say('21 → 20 → 19 → 18 DAYS', C.pink)
  );

  const rngBadNamed = spanBar(x22(3), x22(21), RNG_Y, C.pink, 'range = 18 days');
  await until(S(43));
  await play(
    new M.FadeOut(rngBad), new M.FadeIn(rngBadNamed),
    ...fbox(['range:', 'normal week = 4 days', ['bad week    = 18 days!', C.pink]], C.pink),
    ...say('RANGE STRETCHED: 4 → 18', C.pink)
  );
  rngBad = rngBadNamed;

  await until(S(44));
  await play(...say('NOW CHECK THE QUARTILES', C.green));

  const mid22 = new M.DashedLine({ start: [x22(5), LY - 0.1, 0], end: [x22(5), lineTop(D2, 5), 0], color: C.violet });
  await until(S(45));
  await play(
    new M.Create(mid22), new M.Indicate(dots[3], { color: C.violet }),
    ...fbox(['bad week quartiles:', ['center = 5 days (same)', C.violet]], C.violet),
    ...say('CENTER STILL AT 5 DAYS', C.violet)
  );

  const q1Line22 = new M.DashedLine({ start: [x22(4), LY - 0.1, 0], end: [x22(4), lineTop(D2, 4), 0], color: C.green });
  const q1Tag22 = T('lower 4', P ? 16 : 17, C.green, true);
  q1Tag22.moveTo([x22(4), TAG_Y, 0]);
  await until(S(46));
  await play(
    new M.Create(q1Line22), new M.FadeIn(q1Tag22),
    new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(dots[k], { color: C.green })), { lagRatio: 0.16, runTime: 1.3 }),
    ...fbox(['lower half: 3, [4], 4', ['lower quartile = 4 (same)', C.green]], C.green),
    ...say('LOWER QUARTILE STILL 4', C.green)
  );

  await until(S(47));
  await play(
    new M.LaggedStart([4, 5, 6].map(k => new M.Indicate(dots[k], { color: C.pink })), { lagRatio: 0.2, runTime: 1.5 }),
    ...fbox(['upper half (in order):', ['6, 6, 21', C.pink]], C.green),
    ...say('UPPER HALF: 6, 6, 21', C.pink)
  );

  const q3Line22 = new M.DashedLine({ start: [x22(6), LY - 0.1, 0], end: [x22(6), lineTop(D2, 6), 0], color: C.green });
  const q3Tag22 = T('upper 6', P ? 16 : 17, C.green, true);
  q3Tag22.moveTo([x22(6), TAG_Y, 0]);
  await until(S(48));
  await play(
    new M.Create(q3Line22), new M.FadeIn(q3Tag22), new M.Indicate(dots[4], { color: C.green }),
    ...fbox(['upper half: 6, [6], 21', ['upper quartile = 6 (same)', C.green]], C.green),
    ...say('UPPER QUARTILE STILL 6', C.green)
  );

  const midBand22 = new M.Rectangle({ width: x22(6) - x22(4), height: 1.3, color: C.green, strokeWidth: 0 });
  midBand22.setFill(C.green, 0.16);
  midBand22.moveTo([(x22(4) + x22(6)) / 2, LY + 0.65, 0]);
  const iqrBad = spanBar(x22(4), x22(6), IQR_Y, C.green, 'interquartile: 2 days', true);
  await until(S(49));
  await play(
    new M.FadeIn(midBand22), new M.Create(iqrBad),
    ...fbox(['lower quartile = 4', 'upper quartile = 6', ['interquartile = 2 (same)', C.green]], C.green),
    ...say('GAP FROM 4 TO 6 = STILL 2', C.green)
  );

  await until(S(50));
  await play(
    new M.Indicate(iqrBad, { color: C.green }),
    ...fbox(['bad week:', ['range = 18 days (was 4)', C.pink], ['interquartile = 2 (same!)', C.green]], C.green),
    ...say('MIDDLE SPREAD DID NOT MOVE', C.green)
  );

  // --- 51-57: formulas, when to use, trap, recap ------------------------------
  await until(S(51));
  await play(
    ...fbox(['finding either gap:', ['just one subtraction', C.cyan]], C.cyan),
    ...say('EACH GAP = ONE SUBTRACTION')
  );

  await until(S(52));
  await play(
    new M.Indicate(rngBad, { color: C.amber }),
    ...fbox([['range = largest − smallest', C.amber], ['      = 21 − 3 = 18 days', C.pink]], C.amber),
    ...say('RANGE = LARGEST − SMALLEST', C.amber)
  );

  await until(S(53));
  await play(
    new M.Indicate(iqrBad, { color: C.green }),
    ...fbox([
      ['range = largest − smallest', C.amber],
      ['interquartile range', C.green],
      ['  = upper − lower', C.green],
      ['  = 6 − 4 = 2 days', C.green]
    ], C.green),
    ...say('INTERQUARTILE = UPPER − LOWER', C.green)
  );

  await until(S(54));
  await play(
    new M.Indicate(dots[6], { color: C.amber }),
    new M.Indicate(rngBad, { color: C.amber }),
    ...fbox(['use range for:', ['worst-case delay', C.amber], 'e.g. max promised wait'], C.amber),
    ...say('RANGE → WORST-CASE DELAY', C.amber)
  );

  await until(S(55));
  await play(
    new M.Indicate(iqrBad, { color: C.green }),
    ...fbox(['use interquartile range:', ['normal-week consistency', C.green], 'ignores rare long delays'], C.green),
    ...say('MIDDLE SPREAD → CONSISTENCY', C.green)
  );

  await until(S(56));
  await play(
    new M.Indicate(dots[6], { color: C.pink }),
    ...fbox(['watch out:', ['1 rare delay pulls range', C.pink], 'steady service looks unreliable'], C.pink),
    ...say('TRAP: 1 DELAY PULLS RANGE', C.pink)
  );

  await until(S(57));
  await play(
    new M.Indicate(rngBad, { color: C.amber }),
    new M.Indicate(iqrBad, { color: C.green }),
    ...fbox([['range = full end-to-end span', C.amber], ['interquartile = middle spread', C.green]], C.cyan),
    ...say('FULL SPAN vs MIDDLE SPREAD')
  );
}

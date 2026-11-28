// 16.2.8 Versioned data: return to an earlier copy.
// Beat i = sentence i (0-based, 53 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.2;
  const PILL = P ? [0, 1.65, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.45, -0.65, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 18);
  const fadeAll = (arr, rt = 0.55) => arr.map(x => new M.FadeOut(x, { runTime: rt }));

  // Formula / status box (one on screen at a time)
  let boxNow = null;
  function fbox(lines, color = C.cyan, rt = 0.65) {
    const size = P ? 19 : 19, lh = P ? 0.37 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.6, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: rt })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: rt }));
    boxNow = g;
    return a;
  }
  function clearBox(rt = 0.55) {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: rt })];
  }

  // Shared Monday tickets (exact data from chapters/16.2.md)
  const TICKETS = {
    A: { id: 'A', shop: 'North', amt: 4, color: C.cyan },
    B: { id: 'B', shop: 'North', amt: 8, color: C.cyan },
    C: { id: 'C', shop: 'South', amt: 6, color: C.amber },
    D: { id: 'D', shop: 'South', amt: 10, color: C.amber },
    E: { id: 'E', shop: 'South', amt: 14, color: C.amber },
  };

  // Vertical glowing ticket slip (for Act 1, Table, and Phone snapshots)
  function vSlip(tk, pos, w, h) {
    const [x, y] = pos, col = tk.color;
    const glow = new M.RoundedRectangle({ width: w + 0.10, height: h + 0.10, cornerRadius: 0.12, color: col, strokeWidth: 1 });
    glow.setFill(col, 0.15); glow.setStrokeOpacity(0.15); glow.moveTo([x, y, 0]);
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.09, color: col, strokeWidth: 2.2 });
    body.setFill(C.card, 0.96); body.moveTo([x, y, 0]);
    const head = T(`${tk.id} $${tk.amt}`, w < 1.25 ? 16 : 18, col, true, true);
    head.moveTo([x, y + h * 0.18, 0]);
    const shop = T(tk.shop, 15, C.ink, false, false);
    shop.moveTo([x, y - h * 0.22, 0]);
    return new M.VGroup(glow, body, head, shop);
  }

  // Horizontal glowing ticket strip (for Laptop snapshot cards)
  function hSlip(tk, pos, w, h) {
    const [x, y] = pos, col = tk.color;
    const glow = new M.RoundedRectangle({ width: w + 0.08, height: h + 0.07, cornerRadius: 0.09, color: col, strokeWidth: 1 });
    glow.setFill(col, 0.14); glow.setStrokeOpacity(0.12); glow.moveTo([x, y, 0]);
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.07, color: col, strokeWidth: 2 });
    body.setFill(C.card, 0.96); body.moveTo([x, y, 0]);
    const idT = T(`Ticket ${tk.id}`, 15, col, true, true); idT.moveTo([x - w * 0.29, y, 0]);
    const shT = T(tk.shop, 14, C.muted, false, false); shT.moveTo([x + w * 0.06, y, 0]);
    const amT = T(`$${tk.amt}`, 16, C.ink, true, true); amT.moveTo([x + w * 0.37, y, 0]);
    return new M.VGroup(glow, body, idT, shT, amT);
  }

  // Compact photo slip (for Act 2 laptop photos)
  function miniChip(tk, pos, w, h) {
    const [x, y] = pos, col = tk.color;
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.07, color: col, strokeWidth: 1.8 });
    body.setFill(C.card, 0.96); body.moveTo([x, y, 0]);
    const txt = T(`${tk.id} $${tk.amt}`, 13, col, true, true); txt.moveTo([x, y + h * 0.14, 0]);
    const sh = T(tk.shop, 11, C.muted, false, false); sh.moveTo([x, y - h * 0.22, 0]);
    return new M.VGroup(body, txt, sh);
  }

  // Simple card box helper
  function cardBox(pos, w, h, color, title, sub, titleSize = 18) {
    const [x, y] = pos;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2.4 });
    r.setFill(C.card, 0.94); r.moveTo([x, y, 0]);
    const parts = [r];
    if (title) {
      const t = T(title, titleSize, color, false, true);
      t.moveTo([x, sub ? y + h * 0.17 : y, 0]);
      parts.push(t);
    }
    if (sub) {
      const s = T(sub, titleSize - 4, C.muted, false, false);
      s.moveTo([x, y - h * 0.20, 0]);
      parts.push(s);
    }
    return new M.VGroup(...parts);
  }

  // Timeline builder
  const STOPS = [
    { label: 'Tue 6:00', f: 0.07 },
    { label: '7:00', f: 0.29 },
    { label: '8:00', f: 0.51 },
    { label: '8:30', f: 0.72 },
    { label: 'Wed', f: 0.93 },
  ];
  function buildTimeline(y, x0, x1) {
    const xs = STOPS.map(st => x0 + st.f * (x1 - x0));
    const line = new M.Line({ start: [x0, y, 0], end: [x1, y, 0], color: C.muted, strokeWidth: 2.5 });
    const marks = STOPS.map((st, idx) => {
      const tick = new M.Line({ start: [xs[idx], y - 0.09, 0], end: [xs[idx], y + 0.09, 0], color: C.muted, strokeWidth: 2 });
      const lab = T(st.label, P ? 16 : 15, C.muted, true);
      lab.moveTo([xs[idx], y - 0.30, 0]);
      return new M.VGroup(tick, lab);
    });
    const dot = new M.Dot({ point: [xs[0], y, 0], radius: 0.12, color: C.cyan });
    dot.setFill(C.cyan, 1);
    const moveDot = (idx, color = C.cyan) => {
      const t = new M.Dot({ point: [xs[idx], y, 0], radius: 0.12, color });
      t.setFill(color, 1);
      return new M.Transform(dot, t, { runTime: 0.7 });
    };
    return { group: new M.VGroup(line, ...marks), dot, xs, y, moveDot };
  }

  // =========================================================================
  // INTRO (Beats 0-3): Bakery shops, Tuesday forecast, Wednesday repeat
  // =========================================================================
  const northCard = cardBox(P ? [-1.85, 0.35] : [-3.2, 0.45], P ? 3.1 : 2.9, 1.1, C.cyan, 'North Shop', 'cyan tickets', P ? 19 : 20);
  const southCard = cardBox(P ? [1.85, 0.35] : [3.2, 0.45], P ? 3.1 : 2.9, 1.1, C.amber, 'South Shop', 'amber tickets', P ? 19 : 20);
  const compCard = cardBox(P ? [0, -1.45] : [0, -0.95], P ? 4.4 : 3.6, 1.0, C.ink, 'Main Computer', 'Monday sales records', P ? 19 : 20);
  const arrN = new M.Arrow({ start: P ? [-1.3, -0.22, 0] : [-1.7, 0.05, 0], end: P ? [-0.6, -0.90, 0] : [-0.85, -0.42, 0], color: C.cyan, strokeWidth: 2.5 });
  const arrS = new M.Arrow({ start: P ? [1.3, -0.22, 0] : [1.7, 0.05, 0], end: P ? [0.6, -0.90, 0] : [0.85, -0.42, 0], color: C.amber, strokeWidth: 2.5 });
  const introItems = [northCard, southCard, compCard, arrN, arrS];

  await until(S(0));
  await play(
    new M.LaggedStart([new M.FadeIn(northCard), new M.FadeIn(southCard), new M.Create(arrN), new M.Create(arrS), new M.FadeIn(compCard)], { lagRatio: 0.14, runTime: 1.8 }),
    ...say('BAKERY: NORTH & SOUTH SHOPS', C.cyan)
  );

  const tueCard = cardBox(P ? [-1.85, -3.45] : [-2.85, -2.35], P ? 3.2 : 3.6, P ? 1.1 : 0.92, C.green, 'Tue Morning', 'uses Monday sales', P ? 17 : 18);
  const arrTue = new M.Arrow({ start: P ? [-0.8, -1.98, 0] : [-0.95, -1.48, 0], end: P ? [-1.55, -2.85, 0] : [-2.05, -1.85, 0], color: C.green, strokeWidth: 2.5 });
  introItems.push(tueCard, arrTue);
  await until(S(1));
  await play(new M.Create(arrTue, { runTime: 0.6 }), new M.FadeIn(tueCard, { runTime: 0.7 }), ...say('TUESDAY: FORECAST FROM MONDAY SALES', C.green));

  const wedCard = cardBox(P ? [1.85, -3.45] : [2.85, -2.35], P ? 3.2 : 3.6, P ? 1.1 : 0.92, C.violet, 'Wednesday', 'repeat same forecast', P ? 17 : 18);
  const arrWed = new M.Arrow({ start: P ? [0.8, -1.98, 0] : [0.95, -1.48, 0], end: P ? [1.55, -2.85, 0] : [2.05, -1.85, 0], color: C.violet, strokeWidth: 2.5 });
  introItems.push(wedCard, arrWed);
  await until(S(2));
  await play(new M.Create(arrWed, { runTime: 0.6 }), new M.FadeIn(wedCard, { runTime: 0.7 }), ...say('WEDNESDAY: REPEAT WITH SAME RECORDS', C.violet));

  const warnBadge = cardBox(P ? [0, -4.75] : [0, -2.35], P ? 3.6 : 1.75, P ? 0.68 : 0.72, C.pink, 'Changed?', null, P ? 18 : 17);
  introItems.push(warnBadge);
  await until(S(3));
  await play(new M.FadeIn(warnBadge, { runTime: 0.65 }), new M.Indicate(compCard, { color: C.pink, runTime: 0.8 }), ...say('WHAT IF THE RECORDS CHANGED?', C.pink));

  // =========================================================================
  // ACT 1 (Beats 4-19): Tuesday 6:00 -> 7:00 -> 8:00 -> 8:30 -> Wednesday
  // =========================================================================
  const tl1 = buildTimeline(P ? 0.70 : 1.00, P ? -3.3 : -6.1, P ? 3.3 : 1.7);
  const act1Items = [tl1.group, tl1.dot];

  await until(S(4));
  await play(...fadeAll(introItems), new M.FadeIn(tl1.group, { runTime: 0.7 }), new M.FadeIn(tl1.dot, { runTime: 0.7 }), ...say('TUESDAY 6:00 AM', C.cyan));

  const box1Y = P ? -1.45 : -0.75, box1W = P ? 7.0 : 8.0, box1H = P ? 2.45 : 1.98;
  const box1Rect = new M.RoundedRectangle({ width: box1W, height: box1H, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.2 });
  box1Rect.setFill(C.card, 0.75); box1Rect.moveTo([CX, box1Y, 0]);
  let box1Title = T('Monday sales  ·  6:00 AM copy', P ? 16 : 17, C.cyan, true);
  box1Title.moveTo([CX - box1W / 2 + 0.3 + box1Title.getWidth() / 2, box1Y + box1H / 2 - 0.28, 0]);
  const slotPos1 = k => [CX + (k - 2) * (P ? 1.32 : 1.52), box1Y - 0.16, 0];
  const slotW1 = P ? 1.20 : 1.36, slotH1 = P ? 1.10 : 1.04;
  const emptySlots = [0, 1, 2, 3].map(k => {
    const r = new M.RoundedRectangle({ width: slotW1, height: slotH1, cornerRadius: 0.09, color: C.grid, strokeWidth: 1.5 });
    r.setFill(C.bg, 0.45); r.moveTo(slotPos1(k));
    return r;
  });
  act1Items.push(box1Rect, box1Title, ...emptySlots);

  await until(S(5));
  await play(
    new M.Create(box1Rect, { runTime: 0.7 }), new M.FadeIn(box1Title, { runTime: 0.6 }),
    new M.LaggedStart(emptySlots.map(s => new M.FadeIn(s, { runTime: 0.4 })), { lagRatio: 0.1, runTime: 0.8 }),
    ...fbox(['Monday sales (6:00)', ['tickets = 4', C.cyan]]),
    ...say('4 MONDAY TICKETS RECEIVED', C.cyan)
  );

  const slipA = vSlip(TICKETS.A, slotPos1(0), slotW1, slotH1);
  act1Items.push(slipA);
  await until(S(6));
  await play(new M.FadeIn(slipA, { runTime: 0.6 }), new M.Flash(slipA, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['Monday sales (6:00)', ['A (North) = $4', C.cyan]], C.cyan, 0.55));

  const slipC = vSlip(TICKETS.C, slotPos1(1), slotW1, slotH1);
  act1Items.push(slipC);
  await until(S(7));
  await play(new M.FadeIn(slipC, { runTime: 0.6 }), new M.Flash(slipC, { color: C.amber, runTime: 0.6 }),
    ...fbox(['Monday sales (6:00)', 'A (North) = $4', ['C (South) = $6', C.amber]], C.cyan, 0.55));

  const slipD = vSlip(TICKETS.D, slotPos1(2), slotW1, slotH1);
  act1Items.push(slipD);
  await until(S(8));
  await play(new M.FadeIn(slipD, { runTime: 0.6 }), new M.Flash(slipD, { color: C.amber, runTime: 0.6 }),
    ...fbox(['Monday sales (6:00)', 'A $4 · C $6', ['D (South) = $10', C.amber]], C.cyan, 0.55));

  const slipE = vSlip(TICKETS.E, slotPos1(3), slotW1, slotH1);
  act1Items.push(slipE);
  await until(S(9));
  await play(new M.FadeIn(slipE, { runTime: 0.6 }), new M.Flash(slipE, { color: C.amber, runTime: 0.6 }),
    ...fbox(['Monday sales (6:00)', 'A $4 · C $6 · D $10', ['E (South) = $14', C.amber]], C.cyan, 0.55));

  const fourSlips = [slipA, slipC, slipD, slipE];
  await until(S(10));
  await play(
    new M.LaggedStart(fourSlips.map(x => new M.Indicate(x, { color: C.amber, runTime: 0.5 })), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['4 + 6 + 10 + 14', ['4 tickets = $34', C.amber]], C.amber),
    ...say('4 TICKETS · TOTAL = $34', C.amber)
  );

  const fcBadge = cardBox(P ? [0, -3.6] : [CX - 0.85, -2.5], P ? 6.2 : 5.4, 1.0, C.green, 'Tue 7:00 Forecast', 'used 4 tickets · $34', 19);
  act1Items.push(fcBadge);
  await until(S(11));
  await play(tl1.moveDot(1, C.green), new M.FadeIn(fcBadge, { runTime: 0.7 }), ...say('7:00 AM: FORECAST USES 4 TICKETS', C.green));

  const slipB = vSlip(TICKETS.B, slotPos1(4), slotW1, slotH1);
  const lateTag = pill('LATE', C.pink, 13); lateTag.moveTo([slotPos1(4)[0], slotPos1(4)[1] + slotH1 / 2 + 0.14, 0]);
  act1Items.push(slipB, lateTag);
  await until(S(12));
  await play(tl1.moveDot(2, C.pink), new M.FadeIn(slipB, { runTime: 0.65 }), new M.Flash(slipB, { color: C.pink, runTime: 0.65 }), new M.FadeIn(lateTag, { runTime: 0.5 }),
    ...fbox(['Late arrival (8:00)', ['B (North) = $8', C.pink]], C.pink),
    ...say('8:00 AM: LATE TICKET B ($8)', C.pink));

  await until(S(13));
  await play(new M.Indicate(slipB, { color: C.amber, runTime: 0.7 }),
    ...fbox(['34 + 8 = 42', ['5 tickets = $42', C.amber]], C.amber),
    ...say('$34 + $8 = $42', C.amber));

  const box1TitleUpd = T('Monday sales  ·  8:30 AM updated copy', P ? 16 : 17, C.amber, true);
  box1TitleUpd.moveTo([CX - box1W / 2 + 0.3 + box1TitleUpd.getWidth() / 2, box1Y + box1H / 2 - 0.28, 0]);
  const box1Amber = new M.RoundedRectangle({ width: box1W, height: box1H, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.6 });
  box1Amber.moveTo([CX, box1Y, 0]);
  act1Items.push(box1TitleUpd, box1Amber);
  const oldTitleIdx = act1Items.indexOf(box1Title);
  if (oldTitleIdx >= 0) act1Items.splice(oldTitleIdx, 1);

  await until(S(14));
  await play(tl1.moveDot(3, C.amber), new M.FadeOut(box1Title, { runTime: 0.5 }), new M.FadeIn(box1TitleUpd, { runTime: 0.6 }),
    new M.Create(box1Amber, { runTime: 0.6 }), ...say('8:30 AM: UPDATED COPY PUBLISHED', C.amber));

  const fiveSlips = [slipA, slipC, slipD, slipE, slipB];
  await until(S(15));
  await play(
    new M.LaggedStart(fiveSlips.map(x => new M.Indicate(x, { color: C.amber, runTime: 0.45 })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox(['Updated copy (8:30)', ['5 tickets (was 4)', C.amber], 'total = $42'], C.amber),
    ...say('5 TICKETS INSTEAD OF 4', C.amber)
  );

  await until(S(16));
  await play(tl1.moveDot(4, C.violet), new M.Indicate(box1Amber, { color: C.violet, runTime: 0.7 }), ...say('WEDNESDAY: OPEN LATEST COPY', C.violet));

  await until(S(17));
  await play(
    new M.LaggedStart(fiveSlips.map(x => new M.Indicate(x, { color: C.cyan, runTime: 0.4 })), { lagRatio: 0.08, runTime: 0.9 }),
    ...fbox(['Latest copy (Wed)', 'tickets = 5', ['total   = $42', C.amber]], C.violet)
  );

  const misBadge = cardBox(P ? [0, -4.68] : [CX + 2.85, -2.5], P ? 4.4 : 1.75, P ? 0.70 : 0.72, C.pink, P ? '4 tickets ≠ 5 tickets' : '4 ≠ 5', null, P ? 17 : 18);
  act1Items.push(misBadge);
  await until(S(18));
  await play(new M.Indicate(fcBadge, { color: C.green, runTime: 0.7 }), new M.FadeIn(misBadge, { runTime: 0.65 }), ...say('7:00 FORECAST USED ONLY 4 TICKETS', C.pink));

  await until(S(19));
  await play(new M.Indicate(misBadge, { color: C.pink, runTime: 0.65 }),
    ...fbox(['7:00 used: 4 ($34)', 'latest:    5 ($42)', ['recover those 4?', C.pink]], C.pink),
    ...say('HOW CAN WE RECOVER THOSE 4?', C.pink));

  // =========================================================================
  // ACT 2 (Beats 20-27): Photograph analogy & terms
  // =========================================================================
  const act2Items = [];
  const tblY = P ? 0.35 : 0.58, tblW = P ? 6.8 : 7.6, tblH = P ? 1.32 : 1.24;
  const tblRect = new M.RoundedRectangle({ width: tblW, height: tblH, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  tblRect.setFill(C.card, 0.85); tblRect.moveTo([CX, tblY, 0]);
  const tblLab = T('Table', 14, C.muted, true); tblLab.moveTo([CX - tblW / 2 + 0.55, tblY + tblH / 2 - 0.18, 0]);
  const tblSlotX = k => CX + (k - 2) * (P ? 1.26 : 1.40);
  const tSlips = [TICKETS.A, TICKETS.C, TICKETS.D, TICKETS.E].map((tk, k) => vSlip(tk, [tblSlotX(k), tblY - 0.08, 0], P ? 1.12 : 1.22, P ? 0.86 : 0.82));

  // Camera icon
  const camY = P ? -0.68 : -0.34;
  const camBody = new M.RoundedRectangle({ width: 0.64, height: 0.38, cornerRadius: 0.08, color: C.ink, strokeWidth: 2 });
  camBody.setFill(C.card, 0.95); camBody.moveTo([CX, camY, 0]);
  const camLens = new M.Circle({ radius: 0.11, color: C.cyan, strokeWidth: 2 });
  camLens.setFill(C.cyan, 0.35); camLens.moveTo([CX, camY, 0]);
  const camTop = new M.Rectangle({ width: 0.20, height: 0.08, color: C.ink, strokeWidth: 1.5 });
  camTop.setFill(C.ink, 0.9); camTop.moveTo([CX - 0.14, camY + 0.22, 0]);
  const camera = new M.VGroup(camBody, camTop, camLens);
  act2Items.push(tblRect, tblLab, ...tSlips, camera);

  await until(S(20));
  await play(
    ...fadeAll(act1Items), ...clearBox(),
    new M.FadeIn(tblRect, { runTime: 0.65 }), new M.FadeIn(tblLab, { runTime: 0.65 }),
    new M.LaggedStart(tSlips.map(x => new M.FadeIn(x, { runTime: 0.45 })), { lagRatio: 0.1, runTime: 0.8 }),
    new M.FadeIn(camera, { runTime: 0.65 }),
    ...say('PICTURE: TICKETS ON A TABLE', C.violet)
  );

  // Build Photo 1 (Tue 6:00) & Photo 2 (Tue 8:30)
  function buildPhoto(pos, w, h, color, title, tks) {
    const [x, y] = pos;
    const frame = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 2.4 });
    frame.setFill(C.card, 0.94); frame.moveTo([x, y, 0]);
    const hdr = T(title, P ? 15 : 15, color, true, true);
    hdr.moveTo([x, y + h / 2 - 0.24, 0]);
    const ftr = T(`${tks.length} tickets`, 14, C.muted, true);
    ftr.moveTo([x, y - h / 2 + 0.20, 0]);
    let chips;
    if (P) {
      const cw = tks.length === 5 ? 1.14 : 1.24, sp = tks.length === 5 ? 1.26 : 1.46;
      chips = tks.map((tk, k) => vSlip(tk, [x + (k - (tks.length - 1) / 2) * sp, y - 0.02, 0], cw, 0.82));
    } else {
      // Laptop 2-row grid inside 3.75 x 1.98 photo
      const cols = tks.length === 5 ? 3 : 2;
      chips = tks.map((tk, k) => {
        const row = Math.floor(k / cols), col = k % cols;
        const inRow = row === 0 ? cols : tks.length - cols;
        const dx = (col - (inRow - 1) / 2) * (tks.length === 5 ? 1.15 : 1.45);
        const dy = row === 0 ? 0.22 : -0.32;
        return miniChip(tk, [x + dx, y + dy, 0], tks.length === 5 ? 1.04 : 1.22, 0.46);
      });
    }
    return new M.VGroup(frame, hdr, ...chips, ftr);
  }

  const ph1Pos = P ? [0, -2.02] : [-4.25, -1.72], ph2Pos = P ? [0, -4.10] : [-0.15, -1.72];
  const phW = P ? 6.8 : 3.78, phH = P ? 1.66 : 1.96;
  const photo1 = buildPhoto(ph1Pos, phW, phH, C.cyan, 'Photo 1 · Tue 6:00', [TICKETS.A, TICKETS.C, TICKETS.D, TICKETS.E]);
  act2Items.push(photo1);

  await until(S(21));
  await play(new M.Flash(camLens, { color: C.cyan, runTime: 0.55 }), new M.FadeIn(photo1, { runTime: 0.7 }), ...say('PHOTO 1 AT 6:00 AM', C.cyan));

  const tSlipB = vSlip(TICKETS.B, [tblSlotX(4), tblY - 0.08, 0], P ? 1.12 : 1.22, P ? 0.86 : 0.82);
  const photo2 = buildPhoto(ph2Pos, phW, phH, C.amber, 'Photo 2 · Tue 8:30', [TICKETS.A, TICKETS.B, TICKETS.C, TICKETS.D, TICKETS.E]);
  act2Items.push(tSlipB, photo2);

  await until(S(22));
  await play(
    new M.FadeIn(tSlipB, { runTime: 0.55 }), new M.Flash(camLens, { color: C.amber, runTime: 0.55 }),
    new M.FadeIn(photo2, { runTime: 0.7 }), ...say('PHOTO 2 AT 8:30 AM (+ TICKET B)', C.amber)
  );

  const unchangedTag = pill('UNCHANGED', C.green, 14);
  unchangedTag.moveTo([ph1Pos[0] + phW / 2 - 0.95, ph1Pos[1] + phH / 2 + 0.22, 0]);
  act2Items.push(unchangedTag);
  await until(S(23));
  await play(new M.Indicate(photo1, { color: C.green, runTime: 0.7 }), new M.FadeIn(unchangedTag, { runTime: 0.6 }), ...say('EARLIER PHOTO STAYS UNCHANGED', C.green));

  await until(S(24));
  await play(...fbox(['Save each state:', 'keep earlier copies', ['nothing overwritten', C.cyan]], C.cyan), ...say('SAVE RECORDS THE SAME WAY', C.cyan));

  const snapTag = pill('SNAPSHOT', C.cyan, 14);
  snapTag.moveTo([ph1Pos[0] - phW / 2 + 0.95, ph1Pos[1] + phH / 2 + 0.22, 0]);
  act2Items.push(snapTag);
  await until(S(25));
  await play(new M.Indicate(photo1, { color: C.cyan, runTime: 0.65 }), new M.FadeIn(snapTag, { runTime: 0.6 }),
    ...fbox([['snapshot =', C.cyan], 'saved copy at a', 'particular time'], C.cyan),
    ...say('SNAPSHOT = COPY AT ONE TIME', C.cyan));

  await until(S(26));
  await play(new M.Indicate(photo1, { color: C.violet, runTime: 0.6 }), new M.Indicate(photo2, { color: C.violet, runTime: 0.6 }),
    ...fbox([['versions =', C.violet], 'different saved states', 'of the same data'], C.violet),
    ...say('VERSIONS = DIFFERENT SAVED STATES', C.violet));

  const retArrow = P
    ? new M.Arrow({ start: [2.4, -3.25, 0], end: [2.4, -2.87, 0], color: C.green, strokeWidth: 3 })
    : new M.Arrow({ start: [-0.8, -2.86, 0], end: [-3.6, -2.86, 0], color: C.green, strokeWidth: 3 });
  act2Items.push(retArrow);
  await until(S(27));
  await play(new M.Create(retArrow, { runTime: 0.7 }),
    ...fbox([['data versioning =', C.green], 'keep versions so we', 'can return earlier'], C.green),
    ...say('DATA VERSIONING', C.green));

  // =========================================================================
  // ACT 3, 4 & 5 (Beats 28-52): Dawn & Updated, Recovery, Reproducibility, Traps
  // =========================================================================
  const tl2 = buildTimeline(P ? 0.72 : 1.32, P ? -3.3 : -6.1, P ? 3.3 : 1.7);
  const dPos = P ? [0, -1.05] : [-4.32, -1.08];
  const uPos = P ? [0, -3.75] : [-0.08, -1.08];
  const cW = P ? 6.9 : 3.85, cH = P ? 2.25 : 3.25;

  const dawnRect = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.15, color: C.cyan, strokeWidth: 2.4 });
  dawnRect.setFill(C.card, 0.92); dawnRect.moveTo([dPos[0], dPos[1], 0]);

  const dawnWait = T('copying the 4 tickets...', P ? 17 : 16, C.muted, true);
  dawnWait.moveTo([dPos[0], dPos[1], 0]);
  await until(S(28));
  await play(
    ...fadeAll(act2Items),
    new M.FadeIn(tl2.group, { runTime: 0.65 }), new M.FadeIn(tl2.dot, { runTime: 0.65 }),
    new M.Create(dawnRect, { runTime: 0.7 }), new M.FadeIn(dawnWait, { runTime: 0.6 }),
    ...fbox(['Tuesday 6:00 AM', ['saving snapshot 1...', C.cyan]], C.cyan),
    ...say('6:00 AM: SAVE FIRST SNAPSHOT', C.cyan)
  );

  const dawnTitle = T('Dawn  ·  Tue 6:00', P ? 18 : 17, C.cyan, true, true);
  dawnTitle.moveTo([P ? dPos[0] - 1.55 : dPos[0], dPos[1] + cH / 2 - (P ? 0.28 : 0.30), 0]);
  const dawnMon = T('Monday sales', 14, C.muted, false, false);
  dawnMon.moveTo([P ? dPos[0] + 2.15 : dPos[0], dPos[1] + cH / 2 - (P ? 0.28 : 0.60), 0]);

  await until(S(29));
  await play(new M.FadeIn(dawnTitle, { runTime: 0.6 }), new M.FadeIn(dawnMon, { runTime: 0.6 }), ...say('SNAPSHOT NAME: DAWN', C.cyan));

  const dawnTks = [TICKETS.A, TICKETS.C, TICKETS.D, TICKETS.E];
  const dawnSlips = dawnTks.map((tk, k) => P
    ? vSlip(tk, [dPos[0] + (k - 1.5) * 1.48, dPos[1] - 0.02, 0], 1.24, 0.94)
    : hSlip(tk, [dPos[0], dPos[1] + 0.62 - k * 0.40, 0], 3.38, 0.34));

  await until(S(30));
  await play(
    new M.FadeOut(dawnWait, { runTime: 0.3 }), new M.LaggedStart(dawnSlips.map(x => new M.FadeIn(x, { runTime: 0.45 })), { lagRatio: 0.14, runTime: 1.0 }),
    ...fbox([['Dawn (Tue 6:00)', C.cyan], 'A $4 · C $6', 'D $10 · E $14'], C.cyan)
  );

  const dawnFoot = T('4 tickets  ·  Total $34', P ? 16 : 16, C.cyan, true, true);
  dawnFoot.moveTo([dPos[0], dPos[1] - cH / 2 + 0.27, 0]);
  await until(S(31));
  await play(new M.FadeIn(dawnFoot, { runTime: 0.6 }), new M.Flash(dawnFoot, { color: C.cyan, runTime: 0.6 }),
    ...fbox([['Dawn (Tue 6:00)', C.cyan], 'tickets = 4', ['total   = $34', C.cyan]], C.cyan),
    ...say('DAWN: 4 TICKETS · $34', C.cyan));

  const updRect = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.15, color: C.amber, strokeWidth: 2.4 });
  updRect.setFill(C.card, 0.92); updRect.moveTo([uPos[0], uPos[1], 0]);

  await until(S(32));
  await play(tl2.moveDot(3, C.amber), new M.Create(updRect, { runTime: 0.7 }),
    ...fbox(['Tuesday 8:30 AM', ['saving snapshot 2...', C.amber]], C.amber),
    ...say('8:30 AM: SAVE SECOND SNAPSHOT', C.amber));

  const updTitle = T('Updated  ·  Tue 8:30', P ? 18 : 17, C.amber, true, true);
  updTitle.moveTo([P ? uPos[0] - 1.35 : uPos[0], uPos[1] + cH / 2 - (P ? 0.28 : 0.30), 0]);
  const updMon = T('Monday sales', 14, C.muted, false, false);
  updMon.moveTo([P ? uPos[0] + 2.15 : uPos[0], uPos[1] + cH / 2 - (P ? 0.28 : 0.60), 0]);

  await until(S(33));
  await play(new M.FadeIn(updTitle, { runTime: 0.6 }), new M.FadeIn(updMon, { runTime: 0.6 }), ...say('SNAPSHOT NAME: UPDATED', C.amber));

  const updTks = [TICKETS.A, TICKETS.B, TICKETS.C, TICKETS.D, TICKETS.E];
  const updSlips = updTks.map((tk, k) => P
    ? vSlip(tk, [uPos[0] + (k - 2) * 1.30, uPos[1] - 0.02, 0], 1.18, 0.94)
    : hSlip(tk, [uPos[0], uPos[1] + 0.66 - k * 0.37, 0], 3.38, 0.31));

  await until(S(34));
  await play(
    new M.LaggedStart(updSlips.map(x => new M.FadeIn(x, { runTime: 0.42 })), { lagRatio: 0.12, runTime: 1.05 }),
    new M.Flash(updSlips[1], { color: C.pink, runTime: 0.65 }),
    ...fbox([['Updated (Tue 8:30)', C.amber], 'A $4 · B $8 · C $6', 'D $10 · E $14'], C.amber)
  );

  const updFoot = T('5 tickets  ·  Total $42', P ? 16 : 16, C.amber, true, true);
  updFoot.moveTo([uPos[0], uPos[1] - cH / 2 + 0.27, 0]);
  await until(S(35));
  await play(new M.FadeIn(updFoot, { runTime: 0.6 }), new M.Flash(updFoot, { color: C.amber, runTime: 0.6 }),
    ...fbox([['Updated (Tue 8:30)', C.amber], 'tickets = 5', ['total   = $42', C.amber]], C.amber),
    ...say('UPDATED: 5 TICKETS · $42', C.amber));

  await until(S(36));
  await play(
    new M.Indicate(dawnMon, { color: C.violet, runTime: 0.7 }), new M.Indicate(updMon, { color: C.violet, runTime: 0.7 }),
    ...fbox(['Both = Monday sales', ['Dawn:    4 ($34)', C.cyan], ['Updated: 5 ($42)', C.amber]], C.violet),
    ...say('SAME DAY · DIFFERENT TICKET COUNTS', C.violet)
  );

  const dawnUnchanged = pill('UNCHANGED', C.green, 14);
  dawnUnchanged.moveTo([dPos[0], dPos[1] + cH / 2 + 0.02, 0]);
  await until(S(37));
  await play(new M.Indicate(dawnRect, { color: C.green, runTime: 0.65 }), new M.FadeIn(dawnUnchanged, { runTime: 0.55 }),
    ...say('SAVING UPDATED NEVER CHANGES DAWN', C.green));

  // Act 4: Wednesday Recovery (Beats 38-45)
  await until(S(38));
  await play(tl2.moveDot(4, C.violet),
    ...fbox(['Wednesday recovery:', 'Tue 7:00 forecast', ['find exact records', C.violet]], C.violet),
    ...say('WEDNESDAY: RECOVER 7:00 DATA', C.violet));

  await until(S(39));
  await play(
    ...fbox([['Step 1: check name', C.amber], 'Tue 7:00 forecast:', 'snapshot = ???'], C.amber),
    ...say('STEP 1: FIND THE SNAPSHOT NAME', C.amber)
  );

  // Beat 40 is short (1.06s, gap 1.51s) -> keep runTime crisp
  await until(S(40));
  await play(
    new M.Indicate(dawnTitle, { color: C.cyan, runTime: 0.55 }),
    ...fbox([['Step 1: check name', C.cyan], 'Tue 7:00 forecast:', ['snapshot = Dawn', C.cyan]], C.cyan, 0.5),
    ...say('SAVED NAME: DAWN', C.cyan)
  );

  const dawnSelect = new M.RoundedRectangle({ width: cW + 0.16, height: cH + 0.16, cornerRadius: 0.18, color: C.green, strokeWidth: 3.2 });
  dawnSelect.setFill(C.green, 0.06); dawnSelect.moveTo([dPos[0], dPos[1], 0]);

  await until(S(41));
  await play(
    new M.FadeOut(dawnUnchanged, { runTime: 0.45 }),
    new M.Create(dawnSelect, { runTime: 0.65 }),
    ...fbox([['Step 2: open Dawn', C.green], 'skip Updated'], C.green),
    ...say('STEP 2: OPEN DAWN, NOT UPDATED', C.green)
  );

  await until(S(42));
  await play(
    new M.LaggedStart(dawnSlips.map(x => new M.Indicate(x, { color: C.green, runTime: 0.5 })), { lagRatio: 0.14, runTime: 1.1 }),
    ...fbox([['Step 3: recover', C.green], 'A $4 · C $6', 'D $10 · E $14', ['total = $34', C.green]], C.green),
    ...say('STEP 3: RECOVER A, C, D AND E', C.green)
  );

  await until(S(43));
  await play(
    ...fbox([['training sample =', C.violet], 'records used to', 'prepare a forecast'], C.violet),
    ...say('TRAINING SAMPLE', C.violet)
  );

  const sampleTag = pill('TRAINING SAMPLE', C.violet, 14);
  sampleTag.moveTo([dPos[0], dPos[1] + cH / 2 + 0.02, 0]);
  await until(S(44));
  await play(
    new M.LaggedStart(dawnSlips.map(x => new M.Indicate(x, { color: C.violet, runTime: 0.45 })), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(sampleTag, { runTime: 0.6 }),
    ...fbox([['training sample =', C.violet], 'every ticket in Dawn', 'A, C, D, E ($34)'], C.violet)
  );

  await until(S(45));
  await play(
    new M.Indicate(dawnFoot, { color: C.green, runTime: 0.7 }), new M.Flash(dawnFoot, { color: C.green, runTime: 0.65 }),
    ...say('EXACT 4 TICKETS RECOVERED', C.green)
  );

  // Act 5: Purpose, Reproducibility, Common Traps, Recap (Beats 46-52)
  await until(S(46));
  await play(
    ...fbox([['Data versioning:', C.cyan], 'return to exact', 'earlier records'], C.cyan),
    ...say('RETURN TO EXACT EARLIER RECORDS', C.cyan)
  );

  await until(S(47));
  await play(
    ...fbox([['reproducibility =', C.green], 'repeat earlier work', '-> same result'], C.green),
    ...say('REPRODUCIBILITY', C.green)
  );

  await until(S(48));
  await play(
    new M.Indicate(dawnSelect, { color: C.green, runTime: 0.7 }),
    ...fbox([['Tue 7:00: $34', C.cyan], ['Wed copy: $34', C.green], 'original data kept'], C.green),
    ...say('ORIGINAL DATA STAYS AVAILABLE', C.green)
  );

  const cross1 = new M.Line({ start: [dPos[0] - cW * 0.42, dPos[1] - cH * 0.38, 0], end: [dPos[0] + cW * 0.42, dPos[1] + cH * 0.38, 0], color: C.pink, strokeWidth: 4.5 });
  const cross2 = new M.Line({ start: [dPos[0] - cW * 0.42, dPos[1] + cH * 0.38, 0], end: [dPos[0] + cW * 0.42, dPos[1] - cH * 0.38, 0], color: C.pink, strokeWidth: 4.5 });
  const dawnCross = new M.VGroup(cross1, cross2);

  await until(S(49));
  await play(
    new M.Create(dawnCross, { runTime: 0.7 }),
    ...fbox([['TRAP: latest only', C.pink], 'Dawn lost -> only $42', 'cannot recover $34'], C.pink),
    ...say('TRAP: SAVING ONLY LATEST COPY', C.pink)
  );

  await until(S(50));
  await play(
    new M.FadeOut(dawnCross, { runTime: 0.55 }),
    new M.Indicate(dawnMon, { color: C.amber, runTime: 0.75 }), new M.Indicate(updMon, { color: C.amber, runTime: 0.75 }),
    ...fbox([['TRAP: day only', C.amber], 'Dawn    = Monday', 'Updated = Monday', ['which snapshot?', C.pink]], C.amber),
    ...say('“MONDAY” ALONE IS NOT ENOUGH', C.amber)
  );

  await until(S(51));
  await play(
    new M.Indicate(dawnTitle, { color: C.cyan, runTime: 0.7 }), new M.Flash(dawnTitle, { color: C.cyan, runTime: 0.6 }),
    ...fbox(['Record BOTH:', 'day:      Monday', ['snapshot: Dawn', C.cyan]], C.cyan),
    ...say('ALSO RECORD THE SNAPSHOT NAME', C.cyan)
  );

  await until(S(52));
  await play(
    new M.Indicate(dawnSelect, { color: C.green, runTime: 0.8 }),
    ...fbox([['Data versioning:', C.green], '1. Save named copies', '2. Keep earlier copies', '3. Recover exact data'], C.green),
    ...say('DATA VERSIONING = REPRODUCIBILITY', C.green)
  );
}

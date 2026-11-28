// 3.3.9 Provenance and consent (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based, 0..37). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function fitT(text, size, color = C.ink, maxW = 6, mono = false) {
    const t = T(text, size, color, mono);
    if (maxW && t.getWidth() > maxW) t.scaleToFitWidth(maxW);
    return t;
  }

  // one formula / summary box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2, maxh = P ? 1.65 : 3.6;
    const sc = Math.min(1, maxw / wd, maxh / ht);
    if (sc < 1) g.scale(sc);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // helper: build a fresh card VGroup placed by coordinates
  function card(x, y, w, h, lines, color = C.cyan, fill = C.card, op = 0.94) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(fill, op); r.moveTo([x, y, 0]);
    const n = lines.length;
    const step = n > 1 ? Math.min(P ? 0.34 : 0.31, (h - 0.2) / n) : 0;
    const top = y + (n - 1) * step / 2;
    const parts = [r];
    lines.forEach((ln, i) => {
      const [txt, sz, col, mono] = Array.isArray(ln) ? ln : [ln, P ? 18 : 18, C.ink, false];
      const t = fitT(txt, sz, col || C.ink, w - 0.34, !!mono);
      t.moveTo([x, top - i * step, 0]);
      parts.push(t);
    });
    return new M.VGroup(...parts);
  }

  function downArrow(x, yTop, yBot, color = C.muted) {
    const tip = 0.11;
    const shaft = new M.Line({ start: [x, yTop, 0], end: [x, yBot + tip * 0.8, 0], color, strokeWidth: 2.5 });
    const head = new M.Polygon({
      vertices: [[x - 0.08, yBot + tip, 0], [x + 0.08, yBot + tip, 0], [x, yBot, 0]],
      color, strokeWidth: 1
    });
    head.setFill(color, 1);
    return new M.VGroup(shaft, head);
  }

  // --- 0-5: survey table & zooming into cell (#217, commute minutes = 45) ---
  const TW = P ? 7.2 : 8.0;
  const cws = P ? [1.7, 1.7, 3.8] : [2.0, 2.0, 4.0];
  const tx0 = CX - TW / 2;
  const colX = k => tx0 + cws.slice(0, k).reduce((a, b) => a + b, 0) + cws[k] / 2;
  const RH = P ? 0.84 : 0.66;
  const ty0 = P ? 0.9 : 1.05;
  const rowY = r => ty0 - (r + 0.5) * RH;

  const tableRows = [
    ['student', 'campus', 'commute minutes'],
    ['#215', 'City', '20'],
    ['#216', 'Hill', '40'],
    ['#217', 'Hill', '45'],
    ['#218', 'City', '15'],
  ];

  const tGrid = [];
  const tOuter = new M.RoundedRectangle({ width: TW, height: 5 * RH, cornerRadius: 0.12, color: C.line, strokeWidth: 2 });
  tOuter.setFill(C.card, 0.94); tOuter.moveTo([CX, ty0 - 2.5 * RH, 0]);
  const hdrBg = new M.Rectangle({ width: TW, height: RH, color: C.line, strokeWidth: 1 });
  hdrBg.setFill(C.line, 0.55); hdrBg.moveTo([CX, rowY(0), 0]);
  tGrid.push(tOuter, hdrBg);
  for (let r = 1; r < 5; r++) {
    tGrid.push(new M.Line({ start: [tx0, ty0 - r * RH, 0], end: [tx0 + TW, ty0 - r * RH, 0], color: C.line, strokeWidth: 1.5 }));
  }
  let cxAcc = tx0;
  for (let c = 0; c < 2; c++) {
    cxAcc += cws[c];
    tGrid.push(new M.Line({ start: [cxAcc, ty0, 0], end: [cxAcc, ty0 - 5 * RH, 0], color: C.line, strokeWidth: 1.5 }));
  }
  const tableFrame = new M.VGroup(...tGrid);

  const rowGroups = tableRows.map((vals, r) => {
    const items = vals.map((v, c) => {
      const col = r === 0 ? C.muted : (c === 2 ? C.cyan : (c === 1 ? (v === 'City' ? C.cyan : C.amber) : C.ink));
      const sz = r === 0 ? (P ? 16 : 17) : (P ? 19 : 20);
      const t = fitT(v, sz, col, cws[c] - 0.22, r > 0 && c !== 1);
      t.moveTo([colX(c), rowY(r), 0]);
      return t;
    });
    return new M.VGroup(...items);
  });

  await until(S(0));
  await play(
    new M.FadeIn(tableFrame),
    new M.LaggedStart(rowGroups.map(g => new M.FadeIn(g)), { lagRatio: 0.14, runTime: 1.3 }),
    ...say('SURVEY ANSWERS IN A TABLE', C.cyan)
  );

  // 1: rows = students, columns = questions
  const rowHi1 = new M.RoundedRectangle({ width: TW + 0.08, height: RH + 0.04, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2.5 });
  rowHi1.setFill(C.cyan, 0.12); rowHi1.moveTo([CX, rowY(1), 0]);
  const colHi1 = new M.RoundedRectangle({ width: cws[1] + 0.04, height: 5 * RH + 0.08, cornerRadius: 0.08, color: C.amber, strokeWidth: 2.5 });
  colHi1.setFill(C.amber, 0.1); colHi1.moveTo([colX(1), ty0 - 2.5 * RH, 0]);
  const noteRC = fitT('row = 1 student   ·   column = 1 question', P ? 17 : 18, C.muted, TW);
  noteRC.moveTo([CX, ty0 - 5 * RH - 0.42, 0]);

  await until(S(1));
  await play(
    new M.Create(rowHi1), new M.Create(colHi1), new M.FadeIn(noteRC),
    ...fbox(['table = grid', ['row    -> 1 student', C.cyan], ['column -> 1 question', C.amber]], C.cyan),
    ...say('ROWS = STUDENTS · COLS = QUESTIONS', C.cyan)
  );

  // 2: zoom into one cell
  const cellBox = new M.RoundedRectangle({ width: cws[2] - 0.04, height: RH - 0.02, cornerRadius: 0.08, color: C.amber, strokeWidth: 3.5 });
  cellBox.setFill(C.amber, 0.22); cellBox.moveTo([colX(2), rowY(3), 0]);
  const cellDot = new M.Dot({ point: [colX(2), rowY(3), 0], radius: 0.04, color: C.amber });
  cellDot.setFill(C.amber, 0);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(rowHi1, colHi1, noteRC)),
    new M.Create(cellBox), new M.Flash(cellDot, { color: C.amber }),
    ...fbox([['cell = one box', C.amber], 'in the table grid'], C.amber),
    ...say('ONE BOX IN THE GRID = A CELL', C.amber)
  );

  // 3: row is student #217
  const row217 = new M.RoundedRectangle({ width: TW + 0.06, height: RH + 0.04, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2.5 });
  row217.setFill(C.cyan, 0.12); row217.moveTo([CX, rowY(3), 0]);

  await until(S(3));
  await play(
    new M.Create(row217),
    ...fbox([['row: student #217', C.cyan]], C.cyan),
    ...say('ROW: STUDENT #217', C.cyan)
  );

  // 4: column commute minutes, cell says 45
  const colMin = new M.RoundedRectangle({ width: cws[2] + 0.04, height: 5 * RH + 0.08, cornerRadius: 0.08, color: C.violet, strokeWidth: 2.5 });
  colMin.setFill(C.violet, 0.08); colMin.moveTo([colX(2), ty0 - 2.5 * RH, 0]);

  await until(S(4));
  await play(
    new M.Create(colMin), new M.Indicate(cellBox, { color: C.amber }),
    ...fbox(['row:    student #217', ['column: commute minutes', C.violet], ['cell:   45', C.amber]], C.amber),
    ...say('COMMUTE MINUTES: 45', C.amber)
  );

  // 5: looks like a plain number — where did it come from?
  const bigCellY = P ? -1.4 : -0.6;
  const bigCell = card(CX, bigCellY, P ? 4.4 : 4.6, P ? 2.2 : 2.0, [
    ['student #217 · commute minutes', P ? 16 : 16, C.muted, true],
    ['45', P ? 56 : 54, C.amber, true],
    ['minutes', P ? 18 : 18, C.cyan, false],
  ], C.amber);
  const qCirc = new M.Circle({ radius: 0.36, color: C.pink, strokeWidth: 2.5 });
  qCirc.setFill(C.bg, 0.96); qCirc.moveTo([CX + (P ? 2.2 : 2.3), bigCellY + (P ? 1.1 : 1.0), 0]);
  const qTxt = T('?', 30, C.pink, true); qTxt.moveTo([CX + (P ? 2.2 : 2.3), bigCellY + (P ? 1.1 : 1.0), 0]);
  const qMark = new M.VGroup(qCirc, qTxt);

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(tableFrame, ...rowGroups, cellBox, row217, colMin)),
    new M.FadeIn(bigCell), new M.FadeIn(qMark),
    ...fbox([['cell value = 45', C.amber], ['where did it come from?', C.pink]], C.amber),
    ...say('WHERE DID 45 COME FROM?', C.amber)
  );

  // --- 6-13: walking backwards, 4-step provenance chain ---
  const stepW = P ? 7.1 : 7.9;
  const stepH = P ? 0.9 : 0.64;
  const stepY = P ? [0.85, -0.45, -1.75, -3.05] : [1.08, 0.22, -0.64, -1.5];
  const cellY = P ? -4.45 : -2.42;
  const cellH = P ? 0.78 : 0.56;

  const endCell = card(CX, cellY, P ? 4.4 : 4.8, cellH, [
    ['cell (#217, commute minutes) = 45', P ? 17 : 18, C.amber, true],
  ], C.amber);
  const slots = stepY.map((y, i) => {
    const r = new M.RoundedRectangle({ width: stepW, height: stepH, cornerRadius: 0.12, color: C.line, strokeWidth: 1.5 });
    r.setFill(C.card, 0.28); r.moveTo([CX, y, 0]);
    const t = T(`step ${i + 1}`, P ? 16 : 15, C.muted, true); t.moveTo([CX, y, 0]);
    return new M.VGroup(r, t);
  });

  await until(S(6));
  await play(
    new M.FadeOut(qMark),
    new M.FadeOut(bigCell), new M.FadeIn(endCell),
    new M.LaggedStart(slots.slice().reverse().map(sl => new M.FadeIn(sl)), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox(['walking backwards:', '4 steps from person', 'to the table cell'], C.cyan),
    ...say('WALK BACKWARDS: 4 STEPS', C.cyan)
  );

  // 7: step 1 — the question
  const st1 = card(CX, stepY[0], stepW, stepH, [
    ['1. QUESTION ASKED', P ? 15 : 14, C.cyan, true],
    ['"How many minutes did your trip to campus take this morning?"', P ? 16 : 16, C.ink, false],
  ], C.cyan);
  await until(S(7));
  await play(
    new M.FadeOut(slots[0]), new M.FadeIn(st1),
    ...fbox([['1. question asked', C.cyan], '   trip this morning (min)'], C.cyan),
    ...say('STEP 1: THE SURVEY QUESTION', C.cyan)
  );

  // 8: step 2 — student office, week 3
  const ar12 = downArrow(CX, stepY[0] - stepH / 2 - 0.03, stepY[1] + stepH / 2 + 0.03, C.cyan);
  const st2 = card(CX, stepY[1], stepW, stepH, [
    ['2. WHO & WHEN', P ? 15 : 14, C.cyan, true],
    ['Sent by the student office · Week 3 of the term', P ? 16 : 16, C.ink, false],
  ], C.cyan);
  await until(S(8));
  await play(
    new M.FadeOut(slots[1]), new M.FadeIn(ar12), new M.FadeIn(st2),
    ...fbox(['1. question asked', ['2. student office, week 3', C.cyan]], C.cyan),
    ...say('STEP 2: WHO SENT IT & WHEN', C.cyan)
  );

  // 9: step 3 — raw answer typed by #217
  const ar23 = downArrow(CX, stepY[1] - stepH / 2 - 0.03, stepY[2] + stepH / 2 + 0.03, C.amber);
  const st3 = card(CX, stepY[2], stepW, stepH, [
    ['3. RAW ANSWER (STUDENT #217)', P ? 15 : 14, C.amber, true],
    ['Typed: "three quarters of an hour"', P ? 17 : 17, C.amber, true],
  ], C.amber);
  await until(S(9));
  await play(
    new M.FadeOut(slots[2]), new M.FadeIn(ar23), new M.FadeIn(st3),
    ...fbox(['1. question asked', '2. student office, week 3', ['3. "3/4 of an hour"', C.amber]], C.amber),
    ...say('STEP 3: WHAT #217 TYPED', C.amber)
  );

  // 10: step 4 — cleaning turns words into 45
  const ar34 = downArrow(CX, stepY[2] - stepH / 2 - 0.03, stepY[3] + stepH / 2 + 0.03, C.violet);
  const st4 = card(CX, stepY[3], stepW, stepH, [
    ['4. CLEANING (TIDYING MESSY ANSWERS)', P ? 15 : 14, C.violet, true],
    ['"three quarters of an hour"  →  45 minutes', P ? 17 : 17, C.ink, true],
  ], C.violet);
  const ar4c = downArrow(CX, stepY[3] - stepH / 2 - 0.03, cellY + cellH / 2 + 0.03, C.amber);

  await until(S(10));
  await play(
    new M.FadeOut(slots[3]), new M.FadeIn(ar34), new M.FadeIn(st4), new M.FadeIn(ar4c),
    new M.Indicate(endCell, { color: C.amber }),
    ...fbox([['cleaning = tidy answers', C.violet], '"3/4 hour" -> 45 min', ['cell = 45', C.amber]], C.violet),
    ...say('STEP 4: CLEANING (WORDS → 45)', C.violet)
  );

  // 11: chain from person to cell
  await until(S(11));
  await play(
    new M.LaggedStart([st1, st2, st3, st4, endCell].map(m => new M.Indicate(m, { color: C.cyan })), { lagRatio: 0.22, runTime: 2.2 }),
    ...say('A CHAIN FROM PERSON TO CELL', C.cyan)
  );

  // 12: provenance
  const chainTop = stepY[0] + stepH / 2 + 0.1;
  const chainBot = cellY - cellH / 2 - 0.1;
  const provBox = new M.RoundedRectangle({ width: stepW + 0.24, height: chainTop - chainBot, cornerRadius: 0.18, color: C.violet, strokeWidth: 2.5 });
  provBox.moveTo([CX, (chainTop + chainBot) / 2, 0]);

  await until(S(12));
  await play(
    new M.Create(provBox),
    ...fbox([['PROVENANCE', C.violet], 'where a value came from', '+ how it was changed'], C.violet),
    ...say('PROVENANCE = FULL HISTORY', C.violet)
  );

  // 13: painting analogy
  const pX = P ? 0 : CX - 2.15, pY = P ? -0.15 : -0.65;
  const pW = P ? 4.2 : 3.0, pH = P ? 2.4 : 2.5;
  const outerF = new M.RoundedRectangle({ width: pW, height: pH, cornerRadius: 0.12, color: C.amber, strokeWidth: 4 });
  outerF.setFill(C.card, 0.96); outerF.moveTo([pX, pY, 0]);
  const innerF = new M.Rectangle({ width: pW - 0.36, height: pH - 0.36, color: C.line, strokeWidth: 1.5 });
  innerF.setFill('#142042', 1); innerF.moveTo([pX, pY, 0]);
  const mtn1 = new M.Polygon({
    vertices: [[pX - pW * 0.38, pY - pH * 0.36, 0], [pX - pW * 0.08, pY + pH * 0.14, 0], [pX + pW * 0.22, pY - pH * 0.36, 0]],
    color: C.cyan, strokeWidth: 1.5
  });
  mtn1.setFill(C.cyan, 0.45);
  const mtn2 = new M.Polygon({
    vertices: [[pX - pW * 0.02, pY - pH * 0.36, 0], [pX + pW * 0.2, pY + pH * 0.04, 0], [pX + pW * 0.38, pY - pH * 0.36, 0]],
    color: C.violet, strokeWidth: 1.5
  });
  mtn2.setFill(C.violet, 0.45);
  const sun = new M.Circle({ radius: 0.22, color: C.amber, strokeWidth: 1.5 });
  sun.setFill(C.amber, 0.85); sun.moveTo([pX + pW * 0.22, pY + pH * 0.22, 0]);
  const painting = new M.VGroup(outerF, innerF, mtn1, mtn2, sun);

  const tagLabels = ['Where it was made', 'Who owned it', 'When'];
  const artTags = tagLabels.map((txt, i) => {
    const x = P ? 0 : CX + 1.85;
    const y = P ? -2.2 - i * 0.95 : 0.25 - i * 0.9;
    return card(x, y, P ? 6.2 : 3.7, P ? 0.72 : 0.68, [[txt, P ? 19 : 18, C.amber, false]], C.amber);
  });

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(st1, st2, st3, st4, ar12, ar23, ar34, ar4c, endCell, provBox)),
    new M.FadeIn(painting),
    new M.LaggedStart(artTags.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.3 }),
    ...fbox([['painting provenance:', C.amber], '· where it was made', '· who owned it', '· when'], C.amber),
    ...say('LIKE A PAINTING’S HISTORY', C.amber)
  );

  // --- 14-16: why provenance matters (self-report vs stopwatch vs GPS) ---
  const m45 = card(CX, P ? -1.4 : -0.65, P ? 4.8 : 5.0, P ? 2.1 : 1.9, [
    ['commute minutes', P ? 17 : 17, C.muted, true],
    ['45 min', P ? 44 : 44, C.cyan, true],
    ['What does this number really mean?', P ? 17 : 17, C.ink, false],
  ], C.cyan);

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(painting, ...artTags)),
    new M.FadeIn(m45),
    ...fbox(['why provenance matters:', ['tells what the number', C.cyan], ['really means', C.cyan]], C.cyan),
    ...say('WHAT DOES 45 REALLY MEAN?', C.cyan)
  );

  // 15: remembered estimate vs stopwatch
  const sX = P ? 0 : CX - 2.1, sY = P ? -0.15 : -0.65;
  const wX = P ? 0 : CX + 2.1, wY = P ? -3.05 : -0.65;
  const cmpW = P ? 6.8 : 3.8, cmpH = P ? 2.15 : 2.65;

  const surveyCard = card(sX, sY, cmpW, cmpH, [
    ['✓ SURVEY ANSWER', P ? 18 : 17, C.cyan, true],
    ['45 min', P ? 36 : 34, C.amber, true],
    ['1 morning · remembered & typed', P ? 17 : 16, C.ink, false],
  ], C.cyan);

  const swParts = [];
  const swBg = new M.RoundedRectangle({ width: cmpW, height: cmpH, cornerRadius: 0.14, color: C.pink, strokeWidth: 2 });
  swBg.setFill(C.card, 0.94); swBg.moveTo([wX, wY, 0]);
  const swRing = new M.Circle({ radius: 0.42, color: C.muted, strokeWidth: 2.5 });
  swRing.moveTo([wX, wY + 0.35, 0]);
  const swTop = new M.Line({ start: [wX - 0.14, wY + 0.85, 0], end: [wX + 0.14, wY + 0.85, 0], color: C.muted, strokeWidth: 3 });
  const swHand = new M.Line({ start: [wX, wY + 0.35, 0], end: [wX + 0.24, wY + 0.56, 0], color: C.pink, strokeWidth: 2.5 });
  const swX1 = new M.Line({ start: [wX - 0.32, wY + 0.03, 0], end: [wX + 0.32, wY + 0.67, 0], color: C.pink, strokeWidth: 3 });
  const swT1 = fitT('✕ NOT A STOPWATCH', P ? 18 : 17, C.pink, cmpW - 0.34, true);
  swT1.moveTo([wX, wY - 0.36, 0]);
  const swT2 = fitT('not timed to the second', P ? 16 : 15, C.muted, cmpW - 0.34);
  swT2.moveTo([wX, wY - 0.72, 0]);
  swParts.push(swBg, swRing, swTop, swHand, swX1, swT1, swT2);
  const stopwatchCard = new M.VGroup(...swParts);

  await until(S(15));
  await play(
    new M.FadeOut(m45),
    new M.FadeIn(surveyCard), new M.FadeIn(stopwatchCard),
    ...fbox(['45 min here =', ['1 morning, remembered', C.cyan], ['NOT a stopwatch', C.pink]], C.amber),
    ...say('REMEMBERED ≠ STOPWATCH', C.amber)
  );

  // 16: phone GPS column — don't mix without saying so
  const gpsCard = card(wX, wY, cmpW, cmpH, [
    ['PHONE GPS COLUMN', P ? 18 : 17, C.violet, true],
    ['41, 38, 42 min', P ? 26 : 24, C.violet, true],
    ['measured by phone sensor', P ? 16 : 15, C.muted, false],
  ], C.violet);

  const wall = P
    ? new M.DashedLine({ start: [-3.3, -1.6, 0], end: [3.3, -1.6, 0], color: C.pink, strokeWidth: 3 })
    : new M.DashedLine({ start: [CX, -2.15, 0], end: [CX, 0.85, 0], color: C.pink, strokeWidth: 3 });
  const mixTag = card(P ? 0 : CX, P ? -1.6 : -2.35, P ? 4.8 : 5.4, 0.56, [
    ['DON’T MIX WITHOUT SAYING SO', P ? 15 : 15, C.pink, true],
  ], C.pink, C.bg, 0.98);

  await until(S(16));
  await play(
    new M.FadeOut(stopwatchCard),
    new M.FadeIn(gpsCard), new M.Create(wall), new M.FadeIn(mixTag),
    ...fbox(['col A: student survey', ['col B: phone GPS', C.violet], ['keep sources labeled!', C.pink]], C.pink),
    ...say('DON’T MIX UNLABELED SOURCES', C.pink)
  );

  // --- 17-21: the promise & consent ---
  const dCard = card(P ? 0 : CX - 2.1, P ? 0.1 : -0.65, P ? 5.6 : 3.4, P ? 1.5 : 1.7, [
    ['SURVEY DATA', P ? 20 : 19, C.cyan, true],
    ['1,000 students', P ? 17 : 16, C.muted, false],
  ], C.cyan);
  const pCard = card(P ? 0 : CX + 2.1, P ? -2.7 : -0.65, P ? 5.6 : 3.4, P ? 1.5 : 1.7, [
    ['THE PROMISE', P ? 20 : 19, C.green, true],
    ['what it may be used for', P ? 17 : 16, C.ink, false],
  ], C.green);
  const linkDP = P
    ? new M.Line({ start: [0, -0.65, 0], end: [0, -1.95, 0], color: C.green, strokeWidth: 3 })
    : new M.Line({ start: [CX - 0.4, -0.65, 0], end: [CX + 0.4, -0.65, 0], color: C.green, strokeWidth: 3 });

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(surveyCard, gpsCard, wall, mixTag)),
    new M.FadeIn(dCard), new M.Create(linkDP), new M.FadeIn(pCard),
    ...fbox(['part 1: provenance', ['part 2: the promise', C.green]], C.green),
    ...say('DATA BELONGS TO A PROMISE', C.green)
  );

  // 18: short message before answering
  const fW = P ? 7.0 : 7.8, fH = P ? 5.0 : 3.65, fY = P ? -1.6 : -0.65;
  const formBg = new M.RoundedRectangle({ width: fW, height: fH, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  formBg.setFill(C.card, 0.95); formBg.moveTo([CX, fY, 0]);
  const formHdr = fitT('STUDENT COMMUTE SURVEY — BEFORE YOU ANSWER', P ? 16 : 16, C.cyan, fW - 0.5, true);
  formHdr.moveTo([CX, fY + fH / 2 - 0.42, 0]);
  const formDiv = new M.Line({
    start: [CX - fW / 2 + 0.3, fY + fH / 2 - 0.72, 0],
    end: [CX + fW / 2 - 0.3, fY + fH / 2 - 0.72, 0], color: C.line, strokeWidth: 1.5
  });
  const formCard = new M.VGroup(formBg, formHdr, formDiv);

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(dCard, linkDP, pCard)),
    new M.FadeIn(formCard),
    ...say('BEFORE ANSWERING: A MESSAGE', C.cyan)
  );

  // 19: the two rules of the promise
  const rW = fW - 0.7, rH = P ? 1.15 : 0.82;
  const rule1 = card(CX, fY + (P ? 0.85 : 0.42), rW, rH, [
    ['1. PURPOSE', P ? 15 : 14, C.green, true],
    ['Used ONLY to plan bus timetables', P ? 18 : 18, C.ink, false],
  ], C.green);
  const rule2 = card(CX, fY + (P ? -0.55 : -0.56), rW, rH, [
    ['2. SHARING', P ? 15 : 14, C.green, true],
    ['Shown ONLY as group averages', P ? 18 : 18, C.ink, false],
  ], C.green);

  await until(S(19));
  await play(
    new M.LaggedStart([new M.FadeIn(rule1), new M.FadeIn(rule2)], { lagRatio: 0.45, runTime: 1.6 }),
    ...fbox([['THE PROMISE', C.green], '1. bus timetables ONLY', '2. group averages ONLY'], C.green),
    ...say('TWO RULES IN THE PROMISE', C.green)
  );

  // 20: student agrees = consent
  const agreeY = fY - fH / 2 + (P ? 0.65 : 0.48);
  const chkBox = new M.RoundedRectangle({ width: 0.42, height: 0.42, cornerRadius: 0.08, color: C.green, strokeWidth: 2.5 });
  chkBox.setFill(C.green, 0.22); chkBox.moveTo([CX - (P ? 1.85 : 2.1), agreeY, 0]);
  const chkTxt = T('✓', 24, C.green, true); chkTxt.moveTo([CX - (P ? 1.85 : 2.1), agreeY, 0]);
  const agreeTxt = fitT('I agree  —  CONSENT', P ? 20 : 20, C.green, fW - 1.5, true);
  agreeTxt.moveTo([CX + 0.35, agreeY, 0]);
  const agreeDot = new M.Dot({ point: [CX - (P ? 1.85 : 2.1), agreeY, 0], radius: 0.04, color: C.green });
  agreeDot.setFill(C.green, 0);
  const agreeRow = new M.VGroup(chkBox, chkTxt, agreeTxt);

  await until(S(20));
  await play(
    new M.FadeIn(agreeRow), new M.Flash(agreeDot, { color: C.green }),
    ...fbox([['CONSENT', C.green], '= student agrees to', '  how data may be used'], C.green),
    ...say('AGREEMENT = CONSENT', C.green)
  );

  // 21: consent sets the rules
  await until(S(21));
  await play(
    new M.LaggedStart([new M.Indicate(rule1, { color: C.green }), new M.Indicate(rule2, { color: C.green })], { lagRatio: 0.35, runTime: 1.5 }),
    ...say('CONSENT SETS THE RULES', C.green)
  );

  // --- 22-25: test three uses against the promise ---
  const uW = P ? 7.1 : 8.0;
  const banY = P ? 0.92 : 1.02;
  const pBanner = card(CX, banY, uW, P ? 0.76 : 0.62, [
    ['PROMISE: Bus timetables only · Group averages only', P ? 16 : 16, C.green, true],
  ], C.green, '#0e2420', 0.95);

  const uY = P ? [-0.55, -2.15, -3.75] : [0.02, -0.98, -1.98];
  const uH = P ? 1.25 : 0.8;
  const uSlots = uY.map((y, i) => {
    const r = new M.RoundedRectangle({ width: uW, height: uH, cornerRadius: 0.12, color: C.line, strokeWidth: 1.5 });
    r.setFill(C.card, 0.3); r.moveTo([CX, y, 0]);
    const t = T(`use ${i + 1}`, 16, C.muted, true); t.moveTo([CX, y, 0]);
    return new M.VGroup(r, t);
  });

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(formCard, rule1, rule2, agreeRow)),
    new M.FadeIn(pBanner),
    new M.LaggedStart(uSlots.map(sl => new M.FadeIn(sl)), { lagRatio: 0.14, runTime: 0.9 }),
    ...fbox([['promise rules:', C.green], '· bus timetables only', '· group averages only'], C.green),
    ...say('TEST 3 USES AGAINST PROMISE', C.amber)
  );

  // 23: Use 1 — bus office (ALLOWED)
  const use1 = card(CX, uY[0], uW, uH, [
    ['1. Bus office plans timetables (group averages)', P ? 17 : 17, C.ink, false],
    ['✓ ALLOWED — matches the promise', P ? 17 : 16, C.green, true],
  ], C.green);
  await until(S(23));
  await play(
    new M.FadeOut(uSlots[0]), new M.FadeIn(use1),
    ...fbox(['use 1: bus timetables', '  purpose: matches', '  averages: matches', ['  -> ALLOWED', C.green]], C.green),
    ...say('USE 1: ALLOWED ✓', C.green)
  );

  // 24: Use 2 — teacher asks who lives far away (NOT ALLOWED)
  const use2 = card(CX, uY[1], uW, uH, [
    ['2. Teacher asks which students live far away', P ? 17 : 17, C.ink, false],
    ['✕ NOT ALLOWED — shows single students', P ? 17 : 16, C.pink, true],
  ], C.pink);
  await until(S(24));
  await play(
    new M.FadeOut(uSlots[1]), new M.FadeIn(use2),
    ...fbox(['use 2: who lives far?', ['  shows individuals!', C.pink], '  breaks average rule', ['  -> NOT ALLOWED', C.pink]], C.pink),
    ...say('USE 2: NOT ALLOWED ✕', C.pink)
  );

  // 25: Use 3 — parking company buys list (NOT ALLOWED)
  const use3 = card(CX, uY[2], uW, uH, [
    ['3. Parking company asks to buy the list', P ? 17 : 17, C.ink, false],
    ['✕ NOT ALLOWED — new purpose nobody agreed to', P ? 17 : 16, C.pink, true],
  ], C.pink);
  await until(S(25));
  await play(
    new M.FadeOut(uSlots[2]), new M.FadeIn(use3),
    ...fbox(['use 3: sell to parking co.', ['  new purpose!', C.pink], '  nobody agreed', ['  -> NOT ALLOWED', C.pink]], C.pink),
    ...say('USE 3: NOT ALLOWED ✕', C.pink)
  );

  // --- 26-30: the idea in one line (every value carries two labels) ---
  const hubY = P ? 0.5 : 0.72;
  const valHub = card(CX, hubY, P ? 4.2 : 4.4, P ? 1.2 : 1.05, [
    ['student #217 · commute minutes', P ? 14 : 14, C.muted, true],
    ['45 minutes', P ? 28 : 28, C.amber, true],
  ], C.amber);

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(pBanner, use1, use2, use3)),
    new M.FadeIn(valHub),
    ...fbox(['the idea in one line:', ['every value carries', C.cyan], ['two labels', C.amber]], C.cyan),
    ...say('THE IDEA IN ONE LINE', C.cyan)
  );

  // 27: attach two labels
  const t1X = P ? 0 : CX - 2.1, t1Y = P ? -1.4 : -1.15;
  const t2X = P ? 0 : CX + 2.1, t2Y = P ? -3.65 : -1.15;
  const tagW = P ? 6.6 : 3.8, tagH = P ? 1.55 : 1.75;

  const wire1 = P
    ? downArrow(0, hubY - 0.62, t1Y + tagH / 2 + 0.04, C.violet)
    : new M.Line({ start: [CX - 0.8, hubY - 0.54, 0], end: [t1X, t1Y + tagH / 2 + 0.04, 0], color: C.violet, strokeWidth: 2.5 });
  const wire2 = P
    ? downArrow(0, t1Y - tagH / 2 - 0.04, t2Y + tagH / 2 + 0.04, C.green)
    : new M.Line({ start: [CX + 0.8, hubY - 0.54, 0], end: [t2X, t2Y + tagH / 2 + 0.04, 0], color: C.green, strokeWidth: 2.5 });

  const lblProv = card(t1X, t1Y, tagW, tagH, [
    ['LABEL 1 · PROVENANCE', P ? 16 : 15, C.violet, true],
    ['Where it came from', P ? 20 : 19, C.ink, false],
  ], C.violet);
  const lblCons = card(t2X, t2Y, tagW, tagH, [
    ['LABEL 2 · CONSENT', P ? 16 : 15, C.green, true],
    ['What it may be used for', P ? 20 : 19, C.ink, false],
  ], C.green);

  await until(S(27));
  await play(
    new M.FadeIn(wire1), new M.FadeIn(wire2), new M.FadeIn(lblProv), new M.FadeIn(lblCons),
    ...fbox(['every value =', ['  + provenance (source)', C.violet], ['  + consent (rules)', C.green]], C.amber),
    ...say('TWO LABELS ON EVERY VALUE', C.amber)
  );

  // 28: everyday words
  const ev1 = fitT('Know the story', P ? 17 : 17, C.violet, tagW - 0.3, true);
  ev1.moveTo([t1X, t1Y - tagH / 2 - 0.28, 0]);
  const ev2 = fitT('Keep the promise', P ? 17 : 17, C.green, tagW - 0.3, true);
  ev2.moveTo([t2X, t2Y - tagH / 2 - 0.28, 0]);
  if (P) {
    ev1.moveTo([t1X, t1Y - 0.52, 0]);
    ev2.moveTo([t2X, t2Y - 0.52, 0]);
  }

  await until(S(28));
  await play(
    new M.FadeIn(ev1), new M.FadeIn(ev2),
    new M.LaggedStart([new M.Indicate(lblProv, { color: C.violet }), new M.Indicate(lblCons, { color: C.green })], { lagRatio: 0.4, runTime: 1.5 }),
    ...say('KNOW THE STORY · KEEP PROMISE', C.cyan)
  );

  // 29: what they are for
  await until(S(29));
  await play(
    new M.Indicate(valHub, { color: C.amber }),
    ...say('WHAT THEY ARE FOR', C.violet)
  );

  // 30: trust and check a number; keep people's trust
  await until(S(30));
  await play(
    new M.LaggedStart([new M.Indicate(lblProv, { color: C.violet }), new M.Indicate(lblCons, { color: C.green })], { lagRatio: 0.45, runTime: 1.8 }),
    ...fbox([['provenance -> check number', C.violet], ['consent    -> people’s trust', C.green]], C.green),
    ...say('TRUST DATA · KEEP TRUST', C.green)
  );

  // --- 31-34: two common traps & consequence ---
  const pcY = P ? -0.35 : -0.15;
  const scr = new M.RoundedRectangle({ width: 3.4, height: 2.0, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5 });
  scr.setFill(C.card, 0.96); scr.moveTo([CX, pcY, 0]);
  const scrFile = T('survey_data.csv', 19, C.cyan, true); scrFile.moveTo([CX, pcY + 0.25, 0]);
  const scrSub = T('saved on your laptop', 15, C.muted); scrSub.moveTo([CX, pcY - 0.22, 0]);
  const pcBase = new M.RoundedRectangle({ width: 4.1, height: 0.22, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 });
  pcBase.setFill(C.line, 0.9); pcBase.moveTo([CX, pcY - 1.15, 0]);
  const laptopIcon = new M.VGroup(scr, scrFile, scrSub, pcBase);

  const trap1Warn = card(CX, P ? -2.65 : -2.15, P ? 6.6 : 6.8, 0.82, [
    ['✕  NOT FREE TO USE FOR ANYTHING', P ? 18 : 18, C.pink, true],
  ], C.pink);

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(valHub, wire1, wire2, lblProv, lblCons, ev1, ev2)),
    new M.FadeIn(laptopIcon), new M.FadeIn(trap1Warn),
    ...fbox([['TRAP 1', C.pink], 'data on your computer', '≠ free for anything'], C.pink),
    ...say('TRAP 1: ON LAPTOP ≠ FREE', C.pink)
  );

  // 32: having the data ≠ allowed to use it
  const eqY = P ? -2.85 : -2.15;
  const havCard = card(CX - (P ? 1.95 : 2.15), eqY, P ? 3.1 : 3.4, 0.95, [
    ['HAVING DATA', P ? 18 : 18, C.cyan, true],
  ], C.cyan);
  const allCard = card(CX + (P ? 1.95 : 2.15), eqY, P ? 3.1 : 3.4, 0.95, [
    ['ALLOWED TO USE', P ? 18 : 18, C.green, true],
  ], C.green);
  const neq = T('≠', 38, C.pink, true); neq.moveTo([CX, eqY, 0]);

  await until(S(32));
  await play(
    new M.FadeOut(trap1Warn),
    new M.FadeIn(havCard), new M.FadeIn(neq), new M.FadeIn(allCard),
    ...say('HAVING ≠ ALLOWED', C.pink)
  );

  // 33: Trap 2 — losing history while cleaning; write down every change
  const rawC = card(P ? 0 : CX - 2.75, P ? 0.55 : -0.55, P ? 5.6 : 2.35, P ? 1.15 : 1.5, [
    ['RAW ANSWER', P ? 14 : 13, C.amber, true],
    ['"3/4 hour"', P ? 20 : 18, C.ink, true],
  ], C.amber);
  const midC = card(P ? 0 : CX, P ? -1.45 : -0.55, P ? 5.6 : 2.55, P ? 1.2 : 1.5, [
    ['CLEANING STEP', P ? 14 : 13, C.pink, true],
    ['??? LOST', P ? 22 : 20, C.pink, true],
  ], C.pink);
  const clnC = card(P ? 0 : CX + 2.75, P ? -3.45 : -0.55, P ? 5.6 : 2.15, P ? 1.15 : 1.5, [
    ['TABLE CELL', P ? 14 : 13, C.cyan, true],
    ['45 min', P ? 22 : 22, C.cyan, true],
  ], C.cyan);
  const clnFix = card(P ? 0 : CX, P ? -1.45 : -0.55, P ? 5.6 : 2.55, P ? 1.2 : 1.5, [
    ['✓ CLEANING LOG', P ? 14 : 13, C.green, true],
    ['words → 45 min', P ? 19 : 17, C.green, true],
  ], C.green);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(laptopIcon, havCard, neq, allCard)),
    new M.FadeIn(rawC), new M.FadeIn(midC), new M.FadeIn(clnC),
    ...fbox([['TRAP 2', C.amber], 'losing cleaning history', ['write down every change!', C.green]], C.amber),
    ...say('TRAP 2: LOG EVERY CHANGE', C.amber)
  );
  await until(S(33) + 2.5);
  await play(new M.FadeOut(midC), new M.FadeIn(clnFix));

  // 34: misuse -> people stop answering -> surveys get worse
  const dSpace = P ? 1.25 : 1.35;
  const dPos = [];
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    dPos.push([CX + (col - 2) * dSpace, (P ? -0.35 : -0.05) - row * 1.15, 0]);
  }
  const activeDots = dPos.map(p => {
    const d = new M.Dot({ point: p, radius: 0.25, color: C.cyan });
    d.setFill(C.cyan, 0.95);
    return d;
  });
  const reply10 = card(CX, P ? -3.15 : -2.25, P ? 6.4 : 6.6, 0.8, [
    ['10 / 10 students reply  (high trust)', P ? 18 : 18, C.cyan, true],
  ], C.cyan);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(rawC, clnFix, clnC)),
    new M.LaggedStart(activeDots.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 0.8 }),
    new M.FadeIn(reply10),
    ...fbox([['if answers are misused:', C.pink], 'people stop replying', '-> surveys get worse'], C.pink),
    ...say('BROKEN TRUST → WORSE SURVEYS', C.pink)
  );

  const dimDots = dPos.slice(3).map(p => {
    const d = new M.Dot({ point: p, radius: 0.25, color: C.muted });
    d.setFill(C.muted, 0.25);
    return d;
  });
  const reply3 = card(CX, P ? -3.15 : -2.25, P ? 6.4 : 6.6, 0.8, [
    ['3 / 10 reply  —  every survey gets worse', P ? 18 : 18, C.pink, true],
  ], C.pink);

  await until(S(34) + 2.2);
  await play(
    new M.FadeOut(new M.VGroup(...activeDots.slice(3))),
    new M.LaggedStart(dimDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 0.9 }),
    new M.FadeOut(reply10), new M.FadeIn(reply3)
  );

  // --- 35-37: chapter 3.3 wrap-up & final takeaway ---
  const chHdr = card(CX, P ? 0.95 : 1.05, P ? 7.0 : 8.0, P ? 0.78 : 0.64, [
    ['CHAPTER 3.3 · WHERE EVIDENCE COMES FROM', P ? 17 : 18, C.cyan, true],
  ], C.cyan);

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...activeDots.slice(0, 3), ...dimDots, reply3)),
    new M.FadeIn(chHdr),
    ...fbox([['chapter 3.3 recap:', C.cyan], 'where evidence', 'comes from'], C.cyan),
    ...say('END OF CHAPTER 3.3', C.cyan)
  );

  // 36: all 7 links decide how far a number can be trusted
  const links = [
    ['1. Who we ask', C.cyan],
    ['2. Which list', C.cyan],
    ['3. How we pick', C.cyan],
    ['4. Who replies', C.amber],
    ['5. How well', C.amber],
    ['6. Who chose groups', C.violet],
    ['7. History & promise', C.green],
  ];
  const linkCards = links.map(([txt, col], i) => {
    if (P) {
      const w = i === 6 ? 6.9 : 3.32, h = 0.84;
      const x = i === 6 ? 0 : (i % 2 === 0 ? -1.79 : 1.79);
      const y = i === 6 ? -3.3 : -0.15 - Math.floor(i / 2) * 1.05;
      return card(x, y, w, h, [[txt, 17, col, true]], col);
    }
    const row = i < 4 ? 0 : 1;
    const w = row === 0 ? 1.88 : 2.52, h = 0.82;
    const x = row === 0 ? CX + (i - 1.5) * 2.02 : CX + (i - 5) * 2.7;
    const y = row === 0 ? 0.0 : -1.05;
    return card(x, y, w, h, [[txt, 16, col, true]], col);
  });
  const trustBar = card(CX, P ? -4.45 : -2.2, P ? 6.9 : 8.0, P ? 0.74 : 0.64, [
    ['EACH ONE DECIDES HOW FAR A NUMBER CAN BE TRUSTED', P ? 15 : 15, C.amber, true],
  ], C.amber);

  await until(S(36));
  await play(
    new M.LaggedStart([...linkCards.map(c => new M.FadeIn(c)), new M.FadeIn(trustBar)], { lagRatio: 0.72, runTime: 7.4 }),
    ...fbox([['every link matters:', C.amber], 'sample · frame · pick', 'replies · accuracy', 'groups · provenance'], C.amber),
    ...say('ALL 7 LINKS DECIDE TRUST', C.amber)
  );

  // 37: final one-sentence recap
  const finVal = card(CX, P ? 0.35 : 0.55, P ? 4.4 : 4.6, P ? 1.15 : 1.0, [
    ['EVERY NUMBER', P ? 15 : 15, C.muted, true],
    ['45 minutes', P ? 28 : 28, C.amber, true],
  ], C.amber);
  const finH = card(P ? 0 : CX - 2.05, P ? -1.3 : -0.85, P ? 6.4 : 3.7, P ? 1.25 : 1.2, [
    ['HISTORY', P ? 19 : 19, C.violet, true],
    ['Provenance', P ? 17 : 16, C.ink, false],
  ], C.violet);
  const finP = card(P ? 0 : CX + 2.05, P ? -2.85 : -0.85, P ? 6.4 : 3.7, P ? 1.25 : 1.2, [
    ['PROMISE', P ? 19 : 19, C.green, true],
    ['Consent', P ? 17 : 16, C.ink, false],
  ], C.green);
  const finKeep = card(CX, P ? -4.35 : -2.2, P ? 6.4 : 7.8, 0.72, [
    ['GOOD DATA WORK KEEPS BOTH', P ? 19 : 19, C.amber, true],
  ], C.amber);

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(chHdr, ...linkCards, trustBar)),
    new M.FadeIn(finVal), new M.FadeIn(finH), new M.FadeIn(finP), new M.FadeIn(finKeep),
    ...fbox(['every number has:', ['· a history (provenance)', C.violet], ['· a promise (consent)', C.green], ['good work keeps both', C.amber]], C.green),
    ...say('KEEP HISTORY & PROMISE', C.green)
  );
}

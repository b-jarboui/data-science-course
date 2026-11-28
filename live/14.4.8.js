// 14.4.8 Matrix factorization: learning hidden patterns in ratings (live lesson).
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T: T0, pill: pill0, showA, until, play } = L;
  // phone: no text smaller than 15
  const T = (s, size = 30, ...r) => T0(s, P ? Math.max(size, 15) : size, ...r);
  const pill = (s, c, size) => pill0(s, c, P ? Math.max(size || 17, 15) : size);

  // Chapter 14.4 fixed colours (always paired with names)
  const COL = {
    ana: C.cyan, ben: '#60a5fa', cara: '#fb923c', dan: C.violet,
    trail: C.green, river: '#2dd4bf', clues: C.amber, castle: C.violet, island: '#fde047',
  };

  // Layout anchors (laptop 14.22 x 8: y in [-3.0, 2.3]; phone 8 x 14.22: y in [-5.5, 4.3])
  const PILL = P ? [0, 4.02, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, 2.68, 0] : [4.50, 0.70, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.39 : 0.37;
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
    const maxw = P ? FW - 0.8 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Helper: card with rounded frame and title
  function makeCard(x, y, w, h, color, title, sub = '', titleSize = P ? 20 : 21) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2.4 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t = T(title, titleSize, color, false, true);
    t.moveTo([x, sub ? y + h * 0.18 : y, 0]);
    if (!sub) return new M.VGroup(r, t);
    const s = T(sub, P ? 16 : 17, C.ink, true);
    s.moveTo([x, y - h * 0.22, 0]);
    return new M.VGroup(r, t, s);
  }

  // ============================================================================
  // ACT 1 (0-4): Ana's bookshop question & the 4x5 rating matrix
  // ============================================================================
  const BOOKS = [
    { name: 'Trail', col: COL.trail, ana: '4★' },
    { name: 'River', col: COL.river, ana: '?' },
    { name: 'Clues', col: COL.clues, ana: '2★' },
    { name: 'Castle', col: COL.castle, ana: '?' },
    { name: 'Island', col: COL.island, ana: '?' },
  ];

  // 0: Ana + 5 book cards
  const anaPos = P ? [0, 2.25, 0] : [-5.3, -0.35, 0];
  const anaCircle = new M.Circle({ radius: P ? 0.56 : 0.62, color: COL.ana, strokeWidth: 3 });
  anaCircle.setFill(C.card, 0.96); anaCircle.moveTo(anaPos);
  const anaName = T('Ana', P ? 22 : 24, COL.ana, false, true); anaName.moveTo(anaPos);
  const anaAsk = T('“Which book next?”', P ? 18 : 19, C.ink);
  anaAsk.moveTo([anaPos[0], anaPos[1] - (P ? 0.92 : 1.02), 0]);

  const introCards = [], introBadges = [];
  BOOKS.forEach((b, i) => {
    const x = P ? (i < 3 ? (i - 1) * 2.35 : (i - 3.5) * 2.65) : (-2.55 + i * 2.05);
    const y = P ? (i < 3 ? -0.55 : -3.25) : -0.35;
    const w = P ? 2.05 : 1.75, h = P ? 2.0 : 1.75;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color: b.col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const nm = T(b.name, P ? 21 : 22, b.col, false, true); nm.moveTo([x, y + 0.25, 0]);
    introCards.push(new M.VGroup(r, nm));
    const isKnown = b.ana !== '?';
    const bdg = pill(b.ana, isKnown ? b.col : C.muted, P ? 17 : 18);
    bdg.moveTo([x, y - 0.34, 0]);
    introBadges.push(bdg);
  });

  await until(S(0));
  await play(
    new M.FadeIn(anaCircle), new M.FadeIn(anaName), new M.FadeIn(anaAsk),
    new M.LaggedStart(introCards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.1 }),
    ...say('ANA WANTS A NEW BOOK', COL.ana)
  );

  // 1: Show known ratings vs missing ratings
  await until(S(1));
  await play(
    new M.LaggedStart(introBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('LEARN FROM KNOWN RATINGS → PREDICT MISSING', C.amber)
  );

  // 2: Ratings table — headers + Ana's known ratings (Trail = 4, Clues = 2)
  const READERS = [
    { name: 'Ana', col: COL.ana, vals: ['4', '—', '2', '—', '—'] },
    { name: 'Ben', col: COL.ben, vals: ['4', '5', '2', '1', '—'] },
    { name: 'Cara', col: COL.cara, vals: ['2', '1', '4', '5', '—'] },
    { name: 'Dan', col: COL.dan, vals: ['2', '2', '4', '4', '—'] },
  ];
  const tLeft = P ? -3.55 : -4.75, rColW = P ? 1.35 : 1.75, bColW = P ? 1.15 : 1.55;
  const rowH = P ? 0.82 : 0.68, headY = P ? 1.85 : 1.05;
  const colCenter = j => tLeft + rColW + (j + 0.5) * bColW;
  const rowCenter = r => headY - (r + 1) * rowH;

  const tblHead = [];
  const hdrReader = T('Reader', P ? 15 : 18, C.muted, false, true);
  hdrReader.moveTo([tLeft + rColW / 2, headY, 0]); tblHead.push(hdrReader);
  BOOKS.forEach((b, j) => {
    const t = T(b.name, P ? 15 : 18, b.col, false, true);
    t.moveTo([colCenter(j), headY, 0]); tblHead.push(t);
  });
  const tblHLine = new M.Line({ start: [tLeft, headY - rowH * 0.48, 0], end: [tLeft + rColW + 5 * bColW, headY - rowH * 0.48, 0], color: C.grid, strokeWidth: 2 });
  tblHead.push(tblHLine);

  const anaRowName = T('Ana', P ? 18 : 20, COL.ana, false, true);
  anaRowName.moveTo([tLeft + rColW / 2, rowCenter(0), 0]);
  const cellBox = (r, j, col, opacity = 0.22) => {
    const rect = new M.RoundedRectangle({ width: bColW - 0.14, height: rowH - 0.14, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    rect.setFill(col, opacity); rect.moveTo([colCenter(j), rowCenter(r), 0]); return rect;
  };
  const anaTrailBox = cellBox(0, 0, COL.trail, 0.22);
  const anaTrailVal = T('4★', P ? 18 : 20, COL.trail, true, true); anaTrailVal.moveTo([colCenter(0), rowCenter(0), 0]);
  const anaCluesBox = cellBox(0, 2, COL.clues, 0.22);
  const anaCluesVal = T('2★', P ? 18 : 20, COL.clues, true, true); anaCluesVal.moveTo([colCenter(2), rowCenter(0), 0]);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(anaCircle, anaName, anaAsk, ...introCards, ...introBadges)),
    new M.FadeIn(new M.VGroup(...tblHead)),
    new M.FadeIn(anaRowName),
    new M.FadeIn(anaTrailBox), new M.FadeIn(anaTrailVal),
    new M.FadeIn(anaCluesBox), new M.FadeIn(anaCluesVal),
    ...say('ANA: TRAIL = 4★ · CLUES = 2★', COL.ana)
  );

  // 3: Ana's empty boxes for River, Castle, Island
  const anaEmptyBoxes = [], anaEmptyVals = [];
  for (const j of [1, 3, 4]) {
    const b = cellBox(0, j, C.amber, 0.10);
    const v = T('—', P ? 18 : 20, C.muted, true); v.moveTo([colCenter(j), rowCenter(0), 0]);
    anaEmptyBoxes.push(b); anaEmptyVals.push(v);
  }
  await until(S(3));
  await play(
    new M.LaggedStart(anaEmptyBoxes.map(b => new M.Create(b)), { lagRatio: 0.15, runTime: 0.9 }),
    new M.LaggedStart(anaEmptyVals.map(v => new M.FadeIn(v)), { lagRatio: 0.15, runTime: 0.9 }),
    ...say('RIVER, CASTLE, ISLAND ARE EMPTY', C.amber)
  );

  // 4: Complete the 4x5 table and frame it as a MATRIX
  const otherRows = [];
  for (let r = 1; r < 4; r++) {
    const rd = READERS[r];
    const nm = T(rd.name, P ? 17 : 19, rd.col, false, true); nm.moveTo([tLeft + rColW / 2, rowCenter(r), 0]);
    otherRows.push(nm);
    rd.vals.forEach((v, j) => {
      const t = T(v, P ? 17 : 19, v === '—' ? C.muted : C.ink, true);
      t.moveTo([colCenter(j), rowCenter(r), 0]); otherRows.push(t);
    });
  }
  const tblW = rColW + 5 * bColW + 0.35, tblH = 5 * rowH + 0.35;
  const tblMidX = tLeft + (rColW + 5 * bColW) / 2, tblMidY = headY - 2 * rowH;
  const matrixFrame = new M.RoundedRectangle({ width: tblW, height: tblH, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2.5 });
  matrixFrame.moveTo([tblMidX, tblMidY, 0]);
  const matrixTag = T('4 × 5 RATINGS MATRIX', P ? 16 : 18, C.cyan, true, true);
  matrixTag.moveTo([tblMidX, tblMidY - tblH / 2 - 0.32, 0]);

  await until(S(4));
  await play(
    new M.LaggedStart(otherRows.map(o => new M.FadeIn(o)), { lagRatio: 0.03, runTime: 1.0 }),
    new M.Create(matrixFrame), new M.FadeIn(matrixTag),
    ...say('A TABLE OF NUMBERS = A MATRIX', C.cyan)
  );

  // ============================================================================
  // ACT 2 (5-11): One matrix -> Two smaller tables (Latent factors)
  // ============================================================================
  const rTabX = P ? -1.85 : -1.55, bTabX = P ? 1.85 : 3.25;
  const tabTopY = P ? 2.15 : 1.05, tabRowH = P ? 0.66 : 0.56;
  const tabW = P ? 3.35 : 3.55;

  // Mini big-matrix card on left (laptop) or top-left (phone)
  const bigMiniPos = P ? [0, -3.55, 0] : [-5.35, -0.35, 0];
  const bigMini = makeCard(bigMiniPos[0], bigMiniPos[1], P ? 3.8 : 2.35, P ? 1.15 : 2.1, C.muted, 'Ratings', '4 × 5', P ? 19 : 20);
  const approxSign = T('≈', P ? 34 : 38, C.amber, true, true);
  approxSign.moveTo(P ? [0, -2.55, 0] : [-3.75, -0.35, 0]);
  const timesSign = T('×', P ? 30 : 36, C.amber, true, true);
  timesSign.moveTo(P ? [0, 0.55, 0] : [0.85, -0.35, 0]);

  // Reader factors table (4 x 2)
  const rFrameH = 5 * tabRowH + 0.35, rFrameY = tabTopY - 2 * tabRowH;
  const rFrame = new M.RoundedRectangle({ width: tabW, height: rFrameH, cornerRadius: 0.16, color: COL.ana, strokeWidth: 2.2 });
  rFrame.setFill(C.card, 0.94); rFrame.moveTo([rTabX, rFrameY, 0]);
  const rTitle = T('Readers (4×2)', P ? 16 : 18, COL.ana, false, true);
  rTitle.moveTo([rTabX, tabTopY + 0.18, 0]);
  const rCol1X = rTabX + 0.25, rCol2X = rTabX + 1.10;
  const rRows = [], rCells = [];
  READERS.forEach((rd, i) => {
    const y = tabTopY - (i + 0.95) * tabRowH;
    const nm = T(rd.name, P ? 16 : 17, rd.col, false, true); nm.moveTo([rTabX - 0.95, y, 0]);
    const c1 = T('?', P ? 17 : 18, C.cyan, true, true); c1.moveTo([rCol1X, y, 0]);
    const c2 = T('?', P ? 17 : 18, C.cyan, true, true); c2.moveTo([rCol2X, y, 0]);
    rRows.push(nm); rCells.push(c1, c2);
  });

  // Book factors table (5 x 2)
  const bFrameH = 5.6 * tabRowH + 0.35, bFrameY = tabTopY - 2.3 * tabRowH;
  const bFrame = new M.RoundedRectangle({ width: tabW, height: bFrameH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.2 });
  bFrame.setFill(C.card, 0.94); bFrame.moveTo([bTabX, bFrameY, 0]);
  const bTitle = T('Books (5×2)', P ? 16 : 18, C.amber, false, true);
  bTitle.moveTo([bTabX, tabTopY + 0.18, 0]);
  const bCol1X = bTabX + 0.28, bCol2X = bTabX + 1.12;
  const bRows = [], bCells = [];
  BOOKS.forEach((bk, i) => {
    const y = tabTopY - (i + 0.95) * tabRowH;
    const nm = T(bk.name, P ? 15 : 17, bk.col, false, true); nm.moveTo([bTabX - 0.92, y, 0]);
    const c1 = T('?', P ? 17 : 18, C.amber, true, true); c1.moveTo([bCol1X, y, 0]);
    const c2 = T('?', P ? 17 : 18, C.amber, true, true); c2.moveTo([bCol2X, y, 0]);
    bRows.push(nm); bCells.push(c1, c2);
  });

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(...tblHead, anaRowName, anaTrailBox, anaTrailVal, anaCluesBox, anaCluesVal, ...anaEmptyBoxes, ...anaEmptyVals, ...otherRows, matrixFrame, matrixTag)),
    new M.FadeIn(bigMini), new M.FadeIn(approxSign),
    new M.FadeIn(rFrame), new M.FadeIn(rTitle),
    new M.FadeIn(timesSign),
    new M.FadeIn(bFrame), new M.FadeIn(bTitle),
    ...say('ONE BIG TABLE → TWO SMALLER TABLES', C.cyan)
  );

  // 6: Two numbers per reader, two numbers per book
  await until(S(6));
  await play(
    new M.LaggedStart([...rRows, ...rCells, ...bRows, ...bCells].map(o => new M.FadeIn(o)), { lagRatio: 0.03, runTime: 1.2 }),
    ...say('2 NUMBERS PER READER · 2 PER BOOK', C.cyan)
  );

  // 7: No topic names needed (Adventure / Mystery crossed out)
  const topicY = P ? -4.75 : -2.55;
  const advTag = pill('Adventure', C.muted, P ? 15 : 16); advTag.moveTo([P ? -1.4 : -1.8, topicY, 0]);
  const mysTag = pill('Mystery', C.muted, P ? 15 : 16); mysTag.moveTo([P ? 1.4 : 1.8, topicY, 0]);
  const advX = new M.Line({ start: [P ? -2.35 : -2.8, topicY - 0.22, 0], end: [P ? -0.45 : -0.8, topicY + 0.22, 0], color: C.pink, strokeWidth: 3 });
  const mysX = new M.Line({ start: [P ? 0.55 : 0.9, topicY - 0.22, 0], end: [P ? 2.25 : 2.7, topicY + 0.22, 0], color: C.pink, strokeWidth: 3 });

  await until(S(7));
  await play(
    new M.FadeIn(advTag), new M.FadeIn(mysTag),
    new M.Create(advX), new M.Create(mysX),
    ...say('HIDDEN PATTERNS — NO TOPIC NAMES NEEDED', C.violet)
  );

  // 8: Name them "latent factors"
  const rf1Hdr = T('f1', P ? 14 : 15, C.violet, true, true); rf1Hdr.moveTo([rCol1X, tabTopY - 0.28, 0]);
  const rf2Hdr = T('f2', P ? 14 : 15, C.violet, true, true); rf2Hdr.moveTo([rCol2X, tabTopY - 0.28, 0]);
  const bf1Hdr = T('f1', P ? 14 : 15, C.violet, true, true); bf1Hdr.moveTo([bCol1X, tabTopY - 0.28, 0]);
  const bf2Hdr = T('f2', P ? 14 : 15, C.violet, true, true); bf2Hdr.moveTo([bCol2X, tabTopY - 0.28, 0]);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(advTag, mysTag, advX, mysX)),
    new M.FadeIn(rf1Hdr), new M.FadeIn(rf2Hdr), new M.FadeIn(bf1Hdr), new M.FadeIn(bf2Hdr),
    ...say('LATENT FACTORS = HIDDEN NUMBERS', C.violet)
  );

  // 9: Combine reader factors + book factors -> predicted rating
  const anaHL = new M.RoundedRectangle({ width: tabW - 0.22, height: tabRowH * 0.85, cornerRadius: 0.1, color: COL.ana, strokeWidth: 2.5 });
  anaHL.moveTo([rTabX, tabTopY - 0.95 * tabRowH, 0]);
  const trailHL = new M.RoundedRectangle({ width: tabW - 0.22, height: tabRowH * 0.85, cornerRadius: 0.1, color: COL.trail, strokeWidth: 2.5 });
  trailHL.moveTo([bTabX, tabTopY - 0.95 * tabRowH, 0]);
  const predPill = pill('READER (f1, f2) + BOOK (f1, f2) → RATING ★', C.amber, P ? 15 : 17);
  predPill.moveTo([0, P ? -4.85 : -2.55, 0]);

  await until(S(9));
  await play(
    new M.Create(anaHL), new M.Create(trailHL), new M.FadeIn(predPill),
    ...say('COMBINE FACTORS TO PREDICT A RATING', C.amber)
  );

  // 10: Matrix factorization name
  await until(S(10));
  await play(
    new M.Indicate(bigMini, { color: C.green }),
    new M.Indicate(rFrame, { color: C.green }),
    new M.Indicate(bFrame, { color: C.green }),
    ...say('MATRIX FACTORIZATION', C.green)
  );

  // 11: Normally learn both tables
  await until(S(11));
  await play(
    new M.Indicate(rTitle, { color: C.cyan }),
    new M.Indicate(bTitle, { color: C.amber }),
    ...say('NORMALLY: LEARN BOTH TABLES', C.cyan)
  );

  // ============================================================================
  // ACT 3 (12-29): Training workspace — fixed books, first prediction & loss
  // ============================================================================
  // Ana's factor card
  const anaCardX = P ? -1.95 : -4.40, anaCardY = P ? 0.84 : 0.88;
  const anaCardW = P ? 3.55 : 3.80, anaCardH = P ? 1.18 : 1.24;
  const anaCardBg = new M.RoundedRectangle({ width: anaCardW, height: anaCardH, cornerRadius: 0.16, color: COL.ana, strokeWidth: 2.5 });
  anaCardBg.setFill(C.card, 0.96); anaCardBg.moveTo([anaCardX, anaCardY, 0]);
  const anaCardTitle = T('Ana’s factors', P ? 16 : 18, COL.ana, false, true);
  anaCardTitle.moveTo([anaCardX, anaCardY + anaCardH * 0.31, 0]);

  const f1BoxX = anaCardX - 0.78, f2BoxX = anaCardX + 0.78, fBoxY = anaCardY - 0.14;
  const f1Box = new M.RoundedRectangle({ width: 1.28, height: 0.56, cornerRadius: 0.1, color: COL.ana, strokeWidth: 2 });
  f1Box.setFill(C.bg, 0.95); f1Box.moveTo([f1BoxX, fBoxY, 0]);
  const f2Box = new M.RoundedRectangle({ width: 1.28, height: 0.56, cornerRadius: 0.1, color: COL.ana, strokeWidth: 2 });
  f2Box.setFill(C.bg, 0.95); f2Box.moveTo([f2BoxX, fBoxY, 0]);
  const f1Sub = T('f1', 13, C.muted, true); f1Sub.moveTo([f1BoxX, fBoxY - 0.42, 0]);
  const f2Sub = T('f2', 13, C.muted, true); f2Sub.moveTo([f2BoxX, fBoxY - 0.42, 0]);
  let anaF1Txt = T('?', P ? 20 : 22, COL.ana, true, true); anaF1Txt.moveTo([f1BoxX, fBoxY, 0]);
  let anaF2Txt = T('?', P ? 20 : 22, COL.ana, true, true); anaF2Txt.moveTo([f2BoxX, fBoxY, 0]);

  // Fixed book cards (Trail & Clues)
  const bkCardX = P ? 1.95 : -0.15, bkCardW = P ? 3.55 : 3.65, bkCardH = P ? 0.55 : 0.58;
  const trCardY = P ? 1.15 : 1.20, clCardY = P ? 0.51 : 0.50;
  const trCardBg = new M.RoundedRectangle({ width: bkCardW, height: bkCardH, cornerRadius: 0.12, color: COL.trail, strokeWidth: 2 });
  trCardBg.setFill(C.card, 0.95); trCardBg.moveTo([bkCardX, trCardY, 0]);
  const trCardNm = T('Trail (fixed)', P ? 15 : 16, COL.trail, false, true);
  trCardNm.moveTo([bkCardX - 0.85, trCardY, 0]);
  const clCardBg = new M.RoundedRectangle({ width: bkCardW, height: bkCardH, cornerRadius: 0.12, color: COL.clues, strokeWidth: 2 });
  clCardBg.setFill(C.card, 0.95); clCardBg.moveTo([bkCardX, clCardY, 0]);
  const clCardNm = T('Clues (fixed)', P ? 15 : 16, COL.clues, false, true);
  clCardNm.moveTo([bkCardX - 0.82, clCardY, 0]);

  const trF1Txt = T('1', P ? 18 : 20, COL.trail, true, true); trF1Txt.moveTo([bkCardX + 0.65, trCardY, 0]);
  const trF2Txt = T('0', P ? 18 : 20, COL.trail, true, true); trF2Txt.moveTo([bkCardX + 1.32, trCardY, 0]);
  const clF1Txt = T('0', P ? 18 : 20, COL.clues, true, true); clF1Txt.moveTo([bkCardX + 0.65, clCardY, 0]);
  const clF2Txt = T('1', P ? 18 : 20, COL.clues, true, true); clF2Txt.moveTo([bkCardX + 1.32, clCardY, 0]);

  // 12: Keep book factors fixed, learn Ana's factors
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(bigMini, approxSign, timesSign, rFrame, rTitle, ...rRows, ...rCells, bFrame, bTitle, ...bRows, ...bCells, rf1Hdr, rf2Hdr, bf1Hdr, bf2Hdr, anaHL, trailHL, predPill)),
    new M.FadeIn(anaCardBg), new M.FadeIn(anaCardTitle), new M.FadeIn(f1Box), new M.FadeIn(f2Box),
    new M.FadeIn(f1Sub), new M.FadeIn(f2Sub), new M.FadeIn(anaF1Txt), new M.FadeIn(anaF2Txt),
    new M.FadeIn(trCardBg), new M.FadeIn(trCardNm), new M.FadeIn(clCardBg), new M.FadeIn(clCardNm),
    ...say('FIX BOOK FACTORS · LEARN ANA’S', COL.ana)
  );

  // 13: Give Trail (1, 0)
  await until(S(13));
  await play(
    new M.FadeIn(trF1Txt), new M.FadeIn(trF2Txt), new M.Indicate(trCardBg, { color: COL.trail }),
    ...say('TRAIL FACTORS = (1, 0)', COL.trail)
  );

  // 14: Give Clues (0, 1)
  await until(S(14));
  await play(
    new M.FadeIn(clF1Txt), new M.FadeIn(clF2Txt), new M.Indicate(clCardBg, { color: COL.clues }),
    ...say('CLUES FACTORS = (0, 1)', COL.clues)
  );

  // Helper to update Ana's two factor texts cleanly
  function setAnaFactors(v1, v2) {
    const n1 = T(String(v1), P ? 20 : 21, COL.ana, true, true); n1.moveTo([f1BoxX, fBoxY, 0]);
    const n2 = T(String(v2), P ? 20 : 21, COL.ana, true, true); n2.moveTo([f2BoxX, fBoxY, 0]);
    const anims = [new M.FadeOut(anaF1Txt), new M.FadeOut(anaF2Txt), new M.FadeIn(n1), new M.FadeIn(n2)];
    anaF1Txt = n1; anaF2Txt = n2;
    return anims;
  }

  // 15: Start Ana at (2, 0)
  await until(S(15));
  await play(
    ...setAnaFactors(2, 0),
    ...fbox(['First guess:', ['Ana = (2, 0)', COL.ana]], COL.ana),
    ...say('FIRST GUESS: ANA = (2, 0)', COL.ana)
  );

  // 16: Line up Ana's factors beside Trail's
  await until(S(16));
  await play(
    new M.Indicate(anaCardBg, { color: COL.ana }),
    new M.Indicate(trCardBg, { color: COL.trail }),
    ...fbox(['Predict Trail:', ['Ana:   (2, 0)', COL.ana], ['Trail: (1, 0)', COL.trail]], COL.trail),
    ...say('LINE UP ANA AND TRAIL FACTORS', COL.trail)
  );

  // 17: First pair 2 x 1 = 2
  await until(S(17));
  await play(
    new M.Indicate(f1Box, { color: COL.trail }), new M.Indicate(trF1Txt, { color: COL.trail }),
    ...fbox(['Ana:   (2, 0)', 'Trail: (1, 0)', ['1st pair: 2 × 1 = 2', COL.trail]], COL.trail),
    ...say('FIRST PAIR: 2 × 1 = 2', COL.trail)
  );

  // 18: Second pair 0 x 0 = 0
  await until(S(18));
  await play(
    new M.Indicate(f2Box, { color: COL.ana }), new M.Indicate(trF2Txt, { color: COL.ana }),
    ...fbox(['1st pair: 2 × 1 = 2', ['2nd pair: 0 × 0 = 0', COL.ana]], COL.trail),
    ...say('SECOND PAIR: 0 × 0 = 0', COL.ana)
  );

  // Rating Comparison Bars (horizontal, 0 to 5 stars)
  const barX0 = P ? -2.05 : -4.65, barSpan = P ? 5.35 : 6.00;
  const starX = v => barX0 + (v / 5) * barSpan;
  const trBarY = P ? -0.62 : -0.82, clBarY = P ? -1.42 : -1.68, axY = P ? -1.94 : -2.30;
  const barH = P ? 0.34 : 0.38;

  const axisLine = new M.Line({ start: [barX0, axY, 0], end: [barX0 + barSpan, axY, 0], color: C.muted, strokeWidth: 2 });
  const axisTicks = [];
  for (let v = 0; v <= 5; v++) {
    axisTicks.push(new M.Line({ start: [starX(v), axY - 0.07, 0], end: [starX(v), axY + 0.07, 0], color: C.muted, strokeWidth: 2 }));
    const lbl = T(String(v) + '★', P ? 14 : 15, C.muted, true);
    lbl.moveTo([starX(v), axY - 0.28, 0]); axisTicks.push(lbl);
  }
  const axisGrp = new M.VGroup(axisLine, ...axisTicks);

  // Helper to build a horizontal bar from star a to star b
  const makeHBar = (a, b, y, col, op = 0.85) => {
    const w = Math.max(0.07, Math.abs(starX(b) - starX(a)));
    const cx = (starX(a) + starX(b)) / 2;
    const rect = new M.Rectangle({ width: w, height: barH, color: col, strokeWidth: 1.5 });
    rect.setFill(col, op); rect.moveTo([cx, y, 0]); return rect;
  };

  // Trail bar pieces (Real = 4, initial pred = 2)
  const trRowLbl = T('Trail', P ? 17 : 18, COL.trail, false, true); trRowLbl.moveTo([barX0 - 0.85, trBarY, 0]);
  const trTargetLn = new M.DashedLine({ start: [starX(4), trBarY - 0.28, 0], end: [starX(4), trBarY + 0.28, 0], color: COL.trail });
  const trTargetLbl = T('real 4★', P ? 13 : 14, COL.trail, true); trTargetLbl.moveTo([starX(4), trBarY + 0.40, 0]);
  const trPredBar = makeHBar(0, 2, trBarY, COL.ana, 0.85);
  let trPredVal = T('2', P ? 15 : 16, COL.ana, true, true); trPredVal.moveTo([starX(2) - 0.25, trBarY, 0]);

  // 19: Trail prediction = 2 stars
  await until(S(19));
  await play(
    new M.FadeIn(axisGrp), new M.FadeIn(trRowLbl),
    new M.Create(trTargetLn), new M.FadeIn(trTargetLbl),
    new M.FadeIn(trPredBar), new M.FadeIn(trPredVal),
    ...fbox(['Trail prediction:', '2 × 1 + 0 × 0', ['= 2 stars', COL.trail]], COL.trail),
    ...say('TRAIL PREDICTION = 2 STARS', COL.trail)
  );

  // Clues bar pieces (Real = 2, initial pred = 0)
  const clRowLbl = T('Clues', P ? 17 : 18, COL.clues, false, true); clRowLbl.moveTo([barX0 - 0.85, clBarY, 0]);
  const clTargetLn = new M.DashedLine({ start: [starX(2), clBarY - 0.28, 0], end: [starX(2), clBarY + 0.28, 0], color: COL.clues });
  const clTargetLbl = T('real 2★', P ? 13 : 14, COL.clues, true); clTargetLbl.moveTo([starX(2), clBarY + 0.38, 0]);
  const clPredBar = makeHBar(0, 0, clBarY, COL.ana, 0.85);
  let clPredVal = T('0', P ? 15 : 16, COL.ana, true, true); clPredVal.moveTo([starX(0) + 0.22, clBarY, 0]);

  // 20: Clues prediction = 0 stars
  await until(S(20));
  await play(
    new M.FadeIn(clRowLbl), new M.Create(clTargetLn), new M.FadeIn(clTargetLbl),
    new M.FadeIn(clPredBar), new M.FadeIn(clPredVal),
    ...fbox(['Clues prediction:', '2 × 0 + 0 × 1', ['= 0 stars', COL.clues]], COL.clues),
    ...say('CLUES PREDICTION = 0 STARS', COL.clues)
  );

  // 21: Early guesses can fall outside 1-5 stars
  await until(S(21));
  await play(
    new M.Indicate(clPredBar, { color: C.pink }), new M.Indicate(clPredVal, { color: C.pink }),
    ...say('EARLY GUESSES CAN FALL OUTSIDE 1–5★', C.amber)
  );

  // 22: Both predictions are 2 stars below real ratings -> pink error bars
  const trErrBar = makeHBar(2, 4, trBarY, C.pink, 0.35);
  const clErrBar = makeHBar(0, 2, clBarY, C.pink, 0.35);
  let trErrTxt = T('err 2', P ? 14 : 15, C.pink, true, true); trErrTxt.moveTo([starX(3), trBarY, 0]);
  let clErrTxt = T('err 2', P ? 14 : 15, C.pink, true, true); clErrTxt.moveTo([starX(1), clBarY, 0]);
  let errsVisible = true;

  await until(S(22));
  await play(
    new M.FadeIn(trErrBar), new M.FadeIn(trErrTxt),
    new M.FadeIn(clErrBar), new M.FadeIn(clErrTxt),
    ...fbox(['Trail error: 4 − 2 = 2', 'Clues error: 2 − 0 = 2', ['both 2 stars too low', C.pink]], C.pink),
    ...say('BOTH ERRORS = 2 STARS TOO LOW', C.pink)
  );

  // 23: Square each error
  await until(S(23));
  await play(
    new M.Indicate(trErrBar, { color: C.pink }), new M.Indicate(clErrBar, { color: C.pink }),
    ...fbox(['Square each error:', ['error × error', C.pink], 'size without direction'], C.pink),
    ...say('SQUARE EACH ERROR (SIZE ONLY)', C.pink)
  );

  // 24: 2 x 2 = 4 for each book
  await until(S(24));
  await play(
    ...fbox(['Trail: 2 × 2 = 4', 'Clues: 2 × 2 = 4', ['4 for each book', C.pink]], C.pink),
    ...say('SQUARED ERRORS: 4 AND 4', C.pink)
  );

  // 25: Average = 4 = Loss -> Introduce growing Loss Curve
  const lcX0 = P ? -2.55 : 2.75, lcX1 = P ? 3.15 : 6.45;
  const lcY0 = P ? -4.98 : -2.55, lcY1 = P ? -2.98 : -0.78;
  const lcPt = (step, loss) => [lcX0 + (step / 6) * (lcX1 - lcX0), lcY0 + (loss / 4) * (lcY1 - lcY0), 0];

  const lcParts = [
    new M.Line({ start: [lcX0, lcY0, 0], end: [lcX1, lcY0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [lcX0, lcY0, 0], end: [lcX0, lcY1, 0], color: C.muted, strokeWidth: 2 }),
  ];
  const lcTitle = T('Loss vs Step', P ? 16 : 16, C.pink, false, true);
  lcTitle.moveTo([(lcX0 + lcX1) / 2, lcY1 + 0.28, 0]); lcParts.push(lcTitle);
  for (const lv of [0, 1, 2, 4]) {
    const py = lcPt(0, lv)[1];
    const gl = new M.Line({ start: [lcX0, py, 0], end: [lcX1, py, 0], color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.4); lcParts.push(gl);
    const tl = T(String(lv), 13, C.muted, true); tl.moveTo([lcX0 - 0.28, py, 0]); lcParts.push(tl);
  }
  for (let st = 0; st <= 6; st++) {
    const px = lcPt(st, 0)[0];
    const tl = T(String(st), 13, C.muted, true); tl.moveTo([px, lcY0 - 0.24, 0]); lcParts.push(tl);
  }
  const lcAxisGrp = new M.VGroup(...lcParts);

  const lossDots = [], lossSegs = [], lossLbls = [];
  const p0 = lcPt(0, 4);
  const dot0 = new M.Dot({ point: p0, radius: 0.09, color: C.pink });
  const lbl0 = T('4', 14, C.pink, true, true); lbl0.moveTo([p0[0] + 0.26, p0[1] + 0.14, 0]);
  lossDots.push(dot0); lossLbls.push(lbl0);
  let lastPt = p0;

  await until(S(25));
  await play(
    new M.FadeIn(lcAxisGrp), new M.FadeIn(dot0), new M.Flash(dot0, { color: C.pink }), new M.FadeIn(lbl0),
    ...fbox(['Loss = (4 + 4) ÷ 2', ['     = 4', C.pink]], C.pink),
    ...say('LOSS = 4 (HOW WRONG WE ARE)', C.pink)
  );

  // 26: f1 controls Trail, f2 controls Clues
  await until(S(26));
  await play(
    new M.Indicate(f1Box, { color: COL.trail }), new M.Indicate(trRowLbl, { color: COL.trail }),
    new M.Indicate(f2Box, { color: COL.clues }), new M.Indicate(clRowLbl, { color: COL.clues }),
    ...fbox([['f1 → Trail prediction', COL.trail], ['f2 → Clues prediction', COL.clues]], C.cyan),
    ...say('F1 CONTROLS TRAIL · F2 CONTROLS CLUES', C.cyan)
  );

  // 27: Increase both factors towards the correct ratings
  await until(S(27));
  await play(
    new M.Indicate(anaCardBg, { color: C.amber }),
    ...fbox(['Both predictions too low', ['→ increase both factors', C.amber]], C.amber),
    ...say('INCREASE BOTH FACTORS TO CUT ERROR', C.amber)
  );

  // 28: Correct half of each error
  await until(S(28));
  await play(
    ...fbox(['Step rule:', ['correct half of each error', C.amber]], C.amber),
    ...say('CORRECT HALF OF EACH ERROR', C.amber)
  );

  // 29: Learning rate = 0.5
  await until(S(29));
  await play(
    ...fbox([['learning rate = 0.5', C.amber], 'change = 0.5 × error'], C.amber),
    ...say('LEARNING RATE = 0.5', C.amber)
  );

  // ============================================================================
  // ACT 4 (30-43): Step-by-step iterations + faster settling
  // ============================================================================
  function updatePredBars(pTr, pCl, errTxt, runTime = 0.85) {
    const anims = [
      new M.Transform(trPredBar, makeHBar(0, pTr, trBarY, COL.ana, 0.85), { runTime }),
      new M.Transform(clPredBar, makeHBar(0, pCl, clBarY, COL.ana, 0.85), { runTime }),
    ];
    const nTrVal = T(String(pTr), P ? 14 : 15, COL.ana, true, true);
    nTrVal.moveTo([Math.max(barX0 + 0.35, starX(pTr) - 0.36), trBarY, 0]);
    const nClVal = T(String(pCl), P ? 14 : 15, COL.ana, true, true);
    nClVal.moveTo([Math.max(barX0 + 0.35, starX(pCl) - 0.36), clBarY, 0]);
    anims.push(new M.FadeOut(trPredVal, { runTime }), new M.FadeOut(clPredVal, { runTime }),
      new M.FadeIn(nTrVal, { runTime }), new M.FadeIn(nClVal, { runTime }));
    trPredVal = nTrVal; clPredVal = nClVal;

    const eTr = 4 - pTr, eCl = 2 - pCl;
    if (eTr > 0.02) {
      anims.push(
        new M.Transform(trErrBar, makeHBar(pTr, 4, trBarY, C.pink, 0.35), { runTime }),
        new M.Transform(clErrBar, makeHBar(pCl, 2, clBarY, C.pink, 0.35), { runTime })
      );
      if (trErrTxt) anims.push(new M.FadeOut(trErrTxt, { runTime }));
      if (clErrTxt) anims.push(new M.FadeOut(clErrTxt, { runTime }));
      if (errTxt) {
        const nt = T(errTxt, 13, C.pink, true, true); nt.moveTo([starX((pTr + 4) / 2), trBarY - 0.33, 0]);
        const nc = T(errTxt, 13, C.pink, true, true); nc.moveTo([starX((pCl + 2) / 2), clBarY - 0.33, 0]);
        anims.push(new M.FadeIn(nt, { runTime }), new M.FadeIn(nc, { runTime }));
        trErrTxt = nt; clErrTxt = nc;
      } else {
        trErrTxt = null; clErrTxt = null;
      }
    } else if (errsVisible) {
      anims.push(new M.FadeOut(trErrBar, { runTime }), new M.FadeOut(clErrBar, { runTime }));
      if (trErrTxt) anims.push(new M.FadeOut(trErrTxt, { runTime }));
      if (clErrTxt) anims.push(new M.FadeOut(clErrTxt, { runTime }));
      trErrTxt = null; clErrTxt = null; errsVisible = false;
    }
    return anims;
  }

  function addLossStep(step, lossVal, labelStr, col = C.green, runTime = 0.7) {
    const pt = lcPt(step, lossVal);
    const seg = new M.Line({ start: lastPt, end: pt, color: col, strokeWidth: 3 });
    const dot = new M.Dot({ point: pt, radius: 0.08, color: col });
    lossSegs.push(seg); lossDots.push(dot);
    lastPt = pt;
    const anims = [new M.Create(seg, { runTime }), new M.FadeIn(dot, { runTime })];
    if (labelStr) {
      const lb = T(labelStr, 13, col, true, true);
      lb.moveTo([pt[0] + 0.12, pt[1] + 0.25, 0]);
      lossLbls.push(lb); anims.push(new M.FadeIn(lb, { runTime }));
    }
    return anims;
  }

  // --- STEP 1 (30-33) ---
  await until(S(30));
  await play(
    ...fbox(['Step 1 (rate = 0.5)', 'error  = 2', ['change = 0.5 × 2 = +1', C.amber]], C.amber),
    ...say('STEP 1: HALF OF 2 IS +1', C.amber)
  );

  await until(S(31));
  await play(
    ...setAnaFactors(3, 1),
    ...fbox(['Step 1: update Ana', '2 + 1 = 3', '0 + 1 = 1', ['Ana = (3, 1)', COL.ana]], COL.ana),
    ...say('ANA FACTORS: (2, 0) → (3, 1)', COL.ana)
  );

  await until(S(32));
  await play(
    ...updatePredBars(3, 1, 'err 1'),
    ...say('PREDICTIONS: TRAIL 3★ · CLUES 1★', C.green)
  );

  await until(S(33));
  await play(
    ...addLossStep(1, 1, '1', C.green),
    ...fbox(['Step 1: errors = 1, 1', 'Loss = (1 + 1) ÷ 2', ['     = 1', C.green]], C.green),
    ...say('ERRORS = 1 · LOSS FALLS TO 1', C.green)
  );

  // --- STEP 2 (34-37) ---
  await until(S(34));
  await play(
    ...fbox(['Step 2 (rate = 0.5)', 'error  = 1', ['change = 0.5 × 1 = +0.5', C.amber]], C.amber),
    ...say('STEP 2: HALF OF 1 IS +0.5', C.amber)
  );

  await until(S(35));
  await play(
    ...setAnaFactors(3.5, 1.5),
    ...fbox(['Step 2: update Ana', '3 + 0.5 = 3.5', '1 + 0.5 = 1.5', ['Ana = (3.5, 1.5)', COL.ana]], COL.ana),
    ...say('ANA FACTORS: (3.5, 1.5)', COL.ana)
  );

  await until(S(36));
  await play(
    ...updatePredBars(3.5, 1.5, '0.5'),
    ...say('PREDICTIONS: TRAIL 3.5★ · CLUES 1.5★', C.green)
  );

  await until(S(37));
  await play(
    ...addLossStep(2, 0.25, '0.25', C.green),
    ...fbox(['Step 2: errors = 0.5', 'Loss = (0.25 + 0.25) ÷ 2', ['     = 0.25', C.green]], C.green),
    ...say('ERRORS = 0.5 · LOSS = 0.25', C.green)
  );

  // --- STEP 3 (38-41) ---
  await until(S(38));
  await play(
    ...fbox(['Step 3 (rate = 0.5)', 'error  = 0.5', ['change = 0.5 × 0.5 = +0.25', C.amber]], C.amber),
    ...say('STEP 3: HALF OF 0.5 IS +0.25', C.amber)
  );

  await until(S(39));
  await play(
    ...setAnaFactors(3.75, 1.75),
    ...fbox(['Step 3: update Ana', '3.5 + 0.25 = 3.75', '1.5 + 0.25 = 1.75', ['Ana = (3.75, 1.75)', COL.ana]], COL.ana),
    ...say('ANA FACTORS: (3.75, 1.75)', COL.ana)
  );

  await until(S(40));
  await play(
    ...updatePredBars(3.75, 1.75, '0.25'),
    ...say('ERRORS DOWN TO 0.25 STARS', C.green)
  );

  await until(S(41));
  await play(
    ...addLossStep(3, 0.0625, '0.06', C.green),
    ...fbox(['Step 3: errors = 0.25', ['Loss = 0.0625', C.green]], C.green),
    ...say('LOSS FALLS TO 0.0625', C.green)
  );

  // --- FASTER STEPS & SETTLING (42-43) ---
  await until(S(42));
  await play(
    ...setAnaFactors(3.88, 1.88),
    ...updatePredBars(3.88, 1.88, '', 0.55),
    ...addLossStep(4, 0.0156, '', C.green, 0.55),
    ...say('FASTER STEPS → ANA MOVES TO (4, 2)', COL.ana)
  );
  await play(
    ...setAnaFactors(3.94, 1.94),
    ...updatePredBars(3.94, 1.94, '', 0.55),
    ...addLossStep(5, 0.0039, '', C.green, 0.55)
  );
  await play(
    ...setAnaFactors(4, 2),
    ...updatePredBars(4, 2, '', 0.65),
    ...addLossStep(6, 0, '≈ 0', C.green, 0.65),
    ...fbox(['Settled:', ['Ana = (4, 2)', COL.ana], ['Trail = 4★ · Clues = 2★', C.green]], C.green)
  );

  await until(S(43));
  await play(
    new M.LaggedStart(lossDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox(['Loss curve:', '4 → 1 → 0.25 → 0.0625 → 0', ['predictions improved!', C.green]], C.green),
    ...say('LOSS FALLS FROM 4 TOWARDS 0', C.green)
  );

  // ============================================================================
  // ACT 5 (44-51): Predict unread books (River & Castle), dot product & formula
  // ============================================================================
  const trainAll = [
    anaCardBg, anaCardTitle, f1Box, f2Box, f1Sub, f2Sub, anaF1Txt, anaF2Txt,
    trCardBg, trCardNm, trF1Txt, trF2Txt, clCardBg, clCardNm, clF1Txt, clF2Txt,
    axisGrp, trRowLbl, trTargetLn, trTargetLbl, trPredBar, trPredVal,
    clRowLbl, clTargetLn, clTargetLbl, clPredBar, clPredVal,
    lcAxisGrp, ...lossDots, ...lossSegs, ...lossLbls,
  ];
  if (errsVisible) trainAll.push(trErrBar, clErrBar);
  if (trErrTxt) trainAll.push(trErrTxt);
  if (clErrTxt) trainAll.push(clErrTxt);

  // Clean prediction stage (left on laptop, below fbox on phone)
  const prAnaPos = P ? [0, 0.88, 0] : [-4.55, 0.65, 0];
  const prAnaCard = makeCard(prAnaPos[0], prAnaPos[1], P ? 4.4 : 3.5, P ? 1.15 : 1.30, COL.ana, 'Ana (learned)', '( 4 ,  2 )', P ? 19 : 20);

  const rivPos = P ? [0, -1.15, 0] : [-0.45, 0.65, 0];
  const casPos = P ? [0, -3.15, 0] : [-0.45, -1.35, 0];
  const unW = P ? 6.6 : 4.0, unH = P ? 1.55 : 1.50;

  const rivBox = new M.RoundedRectangle({ width: unW, height: unH, cornerRadius: 0.16, color: COL.river, strokeWidth: 2.4 });
  rivBox.setFill(C.card, 0.95); rivBox.moveTo(rivPos);
  const rivNm = T('River', P ? 22 : 22, COL.river, false, true); rivNm.moveTo([rivPos[0] - unW * 0.28, rivPos[1] + 0.34, 0]);
  const rivQ = pill('? ★', C.muted, P ? 17 : 18); rivQ.moveTo([rivPos[0] + unW * 0.28, rivPos[1] + 0.34, 0]);

  const casBox = new M.RoundedRectangle({ width: unW, height: unH, cornerRadius: 0.16, color: COL.castle, strokeWidth: 2.4 });
  casBox.setFill(C.card, 0.95); casBox.moveTo(casPos);
  const casNm = T('Castle', P ? 22 : 22, COL.castle, false, true); casNm.moveTo([casPos[0] - unW * 0.26, casPos[1] + 0.34, 0]);
  const casQ = pill('? ★', C.muted, P ? 17 : 18); casQ.moveTo([casPos[0] + unW * 0.28, casPos[1] + 0.34, 0]);

  // 44: Use learned factors to predict unread books
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(...trainAll)),
    ...clearBox(),
    new M.FadeIn(prAnaCard),
    new M.FadeIn(rivBox), new M.FadeIn(rivNm), new M.FadeIn(rivQ),
    new M.FadeIn(casBox), new M.FadeIn(casNm), new M.FadeIn(casQ),
    ...say('PREDICT UNREAD BOOKS WITH ANA = (4, 2)', COL.ana)
  );

  // 45: River has factors (1, 0.5)
  const rivFac = T('factors: (1, 0.5)', P ? 18 : 18, C.ink, true);
  rivFac.moveTo([rivPos[0], rivPos[1] - 0.34, 0]);
  await until(S(45));
  await play(
    new M.FadeIn(rivFac), new M.Indicate(rivBox, { color: COL.river }),
    ...fbox([['Ana:   (4, 2)', COL.ana], ['River: (1, 0.5)', COL.river]], COL.river),
    ...say('RIVER FACTORS = (1, 0.5)', COL.river)
  );

  // 46: 4 x 1 + 2 x 0.5 = 5 stars for River
  const rivStar = pill('5 ★', COL.river, P ? 18 : 19); rivStar.moveTo([rivPos[0] + unW * 0.28, rivPos[1] + 0.34, 0]);
  await until(S(46));
  await play(
    new M.FadeOut(rivQ), new M.FadeIn(rivStar), new M.Flash(rivStar, { color: COL.river }),
    ...fbox(['River prediction:', '4 × 1   = 4', '2 × 0.5 = 1', ['4 + 1   = 5 stars', COL.river]], COL.river),
    ...say('RIVER PREDICTION = 5 STARS', COL.river)
  );

  // 47: Castle has factors (0.5, 1)
  const casFac = T('factors: (0.5, 1)', P ? 18 : 18, C.ink, true);
  casFac.moveTo([casPos[0], casPos[1] - 0.34, 0]);
  await until(S(47));
  await play(
    new M.FadeIn(casFac), new M.Indicate(casBox, { color: COL.castle }),
    ...fbox([['Ana:    (4, 2)', COL.ana], ['Castle: (0.5, 1)', COL.castle]], COL.castle),
    ...say('CASTLE FACTORS = (0.5, 1)', COL.castle)
  );

  // 48: 4 x 0.5 + 2 x 1 = 4 stars for Castle
  const casStar = pill('4 ★', COL.castle, P ? 18 : 19); casStar.moveTo([casPos[0] + unW * 0.28, casPos[1] + 0.34, 0]);
  await until(S(48));
  await play(
    new M.FadeOut(casQ), new M.FadeIn(casStar), new M.Flash(casStar, { color: COL.castle }),
    ...fbox(['Castle prediction:', '4 × 0.5 = 2', '2 × 1   = 2', ['2 + 2   = 4 stars', COL.castle]], COL.castle),
    ...say('CASTLE PREDICTION = 4 STARS', COL.castle)
  );

  // 49: Dot product
  const dpPos = P ? [0, -4.65, 0] : [-4.55, -1.35, 0];
  const dpCard = makeCard(dpPos[0], dpPos[1], P ? 6.6 : 3.5, P ? 1.0 : 1.50, C.amber, 'Dot product', 'f1×b1 + f2×b2', P ? 19 : 20);
  await until(S(49));
  await play(
    new M.FadeIn(dpCard),
    ...fbox([['Dot product:', C.amber], 'multiply matching factors', 'then add the results'], C.amber),
    ...say('DOT PRODUCT = MULTIPLY PAIRS, THEN ADD', C.amber)
  );

  // 50: Formula
  await until(S(50));
  await play(
    new M.Indicate(dpCard, { color: C.cyan }),
    ...fbox([['predicted rating =', C.ink], ['  dot product(', C.cyan], ['    reader factors,', COL.ana], ['    book factors )', C.amber]], C.cyan),
    ...say('FORMULA: READER · BOOK FACTORS', C.cyan)
  );

  // 51: Recommend River before Castle
  const rk1 = pill('#1 RECOMMEND', C.green, P ? 14 : 15);
  rk1.moveTo([rivPos[0] - unW * 0.14, rivPos[1] + unH / 2 + 0.22, 0]);
  const rk2 = pill('#2', C.muted, P ? 14 : 15);
  rk2.moveTo([casPos[0] - unW * 0.35, casPos[1] + unH / 2 + 0.22, 0]);
  await until(S(51));
  await play(
    new M.FadeIn(rk1), new M.FadeIn(rk2), new M.Indicate(rivBox, { color: C.green }),
    ...fbox(['Recommendation:', ['1st: River  (5★)', COL.river], ['2nd: Castle (4★)', COL.castle]], C.green),
    ...say('RECOMMEND RIVER BEFORE CASTLE', C.green)
  );

  // ============================================================================
  // ACT 6 (52-54): Two traps & one-sentence recap
  // ============================================================================
  // 52: Trap 1 — learning rate too large jumps past the target repeatedly
  const jpX0 = P ? -3.15 : -6.10, jpX1 = P ? 3.15 : 1.70, jpY = P ? -1.45 : -0.70;
  const jx = v => jpX0 + (v / 8) * (jpX1 - jpX0);
  const jpLine = new M.Line({ start: [jpX0, jpY, 0], end: [jpX1, jpY, 0], color: C.muted, strokeWidth: 2.5 });
  const jpTicks = [];
  for (const v of [0, 2, 4, 6, 8]) {
    jpTicks.push(new M.Line({ start: [jx(v), jpY - 0.1, 0], end: [jx(v), jpY + 0.1, 0], color: C.muted, strokeWidth: 2 }));
    const t = T(String(v), 16, v === 4 ? C.green : C.muted, true, v === 4);
    t.moveTo([jx(v), jpY - 0.38, 0]); jpTicks.push(t);
  }
  const jpTarget = new M.DashedLine({ start: [jx(4), jpY - 0.75, 0], end: [jx(4), jpY + 1.15, 0], color: C.green });
  const jpTargetLbl = T('target = 4', 16, C.green, true, true); jpTargetLbl.moveTo([jx(4), jpY + 1.38, 0]);
  const jpTitle = T('Ana’s Factor 1 with learning rate = 2', P ? 17 : 18, C.pink, false, true);
  jpTitle.moveTo([(jpX0 + jpX1) / 2, jpY - 1.05, 0]);
  const jpDot = new M.Dot({ point: [jx(2), jpY, 0], radius: 0.14, color: C.pink });
  const jpDotTo = v => new M.Dot({ point: [jx(v), jpY, 0], radius: 0.14, color: C.pink });

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(prAnaCard, rivBox, rivNm, rivStar, rivFac, casBox, casNm, casStar, casFac, dpCard, rk1, rk2)),
    new M.Create(jpLine), new M.FadeIn(new M.VGroup(...jpTicks, jpTarget, jpTargetLbl, jpTitle)),
    new M.FadeIn(jpDot),
    ...fbox([['Trap 1: rate too large', C.pink], 'rate = 2:', '2 → 6 → 2 → 6', ['never settles (loss = 4)', C.pink]], C.pink),
    ...say('TRAP 1: RATE TOO BIG → JUMPS PAST TARGET', C.pink)
  );
  await play(new M.Transform(jpDot, jpDotTo(6), { pathArc: -1.3, runTime: 0.75 }));
  await play(new M.Transform(jpDot, jpDotTo(2), { pathArc: -1.3, runTime: 0.75 }));
  await play(new M.Transform(jpDot, jpDotTo(6), { pathArc: -1.3, runTime: 0.75 }));

  // 53: Trap 2 — matching known ratings doesn't guarantee missing predictions
  const t2Y1 = P ? -0.35 : 0.35, t2Y2 = P ? -2.35 : -1.35;
  const knownCard = makeCard(P ? 0 : -2.25, t2Y1, P ? 6.6 : 7.4, P ? 1.35 : 1.15, C.green, 'Known ratings matched ✓', 'Trail 4★   ·   Clues 2★', P ? 19 : 20);
  const missCard = makeCard(P ? 0 : -2.25, t2Y2, P ? 6.6 : 7.4, P ? 1.35 : 1.15, C.amber, 'Missing ratings = still a guess ?', 'River 5★?   ·   Castle 4★?', P ? 19 : 20);

  await until(S(53));
  await play(
    new M.FadeOut(new M.VGroup(jpLine, ...jpTicks, jpTarget, jpTargetLbl, jpTitle, jpDot)),
    new M.FadeIn(knownCard), new M.FadeIn(missCard),
    ...fbox([['Trap 2: unseen books', C.amber], 'known loss = 0', 'does not guarantee', 'correct missing ratings'], C.amber),
    ...say('TRAP 2: KNOWN FIT ≠ GUARANTEED PREDICTION', C.amber)
  );

  // 54: Recap
  // phone: the three recap cards are stacked down the whole height
  const rc1 = makeCard(P ? 0 : -4.45, P ? 1.4 : -0.35, P ? 5.8 : 3.35, P ? 1.55 : 1.55, C.cyan, '1. Known ratings', 'Trail 4★ · Clues 2★', P ? 20 : 19);
  const rc2 = makeCard(P ? 0 : -0.15, P ? -1.2 : -0.35, P ? 5.8 : 3.35, P ? 1.55 : 1.55, C.violet, '2. Hidden factors', 'Ana = (4, 2)', P ? 20 : 19);
  const rc3 = makeCard(P ? 0 : 4.15, P ? -3.8 : -0.35, P ? 5.8 : 3.35, P ? 1.55 : 1.55, C.green, '3. Missing ratings', 'River 5★ · Castle 4★', P ? 20 : 19);
  const ar1 = new M.Arrow({
    start: P ? [0, 0.5, 0] : [-2.65, -0.35, 0],
    end: P ? [0, -0.3, 0] : [-1.95, -0.35, 0],
    color: C.amber, strokeWidth: 3,
  });
  const ar2 = new M.Arrow({
    start: P ? [0, -2.1, 0] : [1.65, -0.35, 0],
    end: P ? [0, -2.9, 0] : [2.35, -0.35, 0],
    color: C.amber, strokeWidth: 3,
  });

  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(knownCard, missCard)),
    ...clearBox(),
    new M.LaggedStart([new M.FadeIn(rc1), new M.Create(ar1), new M.FadeIn(rc2), new M.Create(ar2), new M.FadeIn(rc3)], { lagRatio: 0.18, runTime: 1.8 }),
    ...say('LEARN HIDDEN FACTORS → PREDICT MISSING RATINGS', C.green)
  );
}

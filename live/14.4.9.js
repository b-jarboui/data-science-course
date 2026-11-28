// 14.4.9 Ranking metrics: why the order of recommendations matters.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T: T0, pill: pill0, showA, until, play } = L;
  const T = (s, size, ...r) => T0(s, P ? Math.max(size, 15) : size, ...r);
  const pill = (s, c, size) => pill0(s, c, P ? Math.max(size || 17, 15) : size);

  const COL = {
    ana: C.cyan,
    river: '#2dd4bf',
    castle: C.violet,
    island: '#fde047',
  };

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 1.88, 0] : [-1.5, 2.02, 0];
  const BOXP = P ? [0, 3.32, 0] : [4.45, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const ROW_Y = P ? [-0.1, -1.75, -3.4] : [0.78, -0.18, -1.14];
  const HEAD_Y = P ? 0.92 : 1.44;
  const TOT_Y = P ? -4.6 : -1.80;
  const CARD_W = P ? 2.30 : 2.30;
  const CARD_H = P ? 1.2 : 0.78;
  const L1_X = P ? -0.35 : -2.05;
  const L2_X = P ? 2.35 : 0.65;
  const POS_X = P ? -2.82 : -6.20;
  const BAR_X0 = P ? -3.55 : -5.65;
  const BAR_MAX = P ? 1.45 : 1.30;
  const BAR_H = P ? 0.22 : 0.28;
  const CREDITS = [1, 0.63093, 0.5];
  const CRED_TXT = ['1.00', '0.63', '0.50'];

  // Single formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.4 }));
    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.4 })];
  }

  // Reader icon (Ana in cyan)
  function makeAna(pos) {
    const [x, y] = pos;
    const ring = new M.Circle({ radius: 0.52, color: COL.ana, strokeWidth: 2.5 });
    ring.setFill(C.card, 0.94); ring.moveTo([x, y, 0]);
    const head = new M.Circle({ radius: 0.15, color: COL.ana });
    head.setFill(COL.ana, 1); head.moveTo([x, y + 0.16, 0]);
    const body = new M.Arc({ radius: 0.27, startAngle: 0, angle: Math.PI, color: COL.ana });
    body.setFill(COL.ana, 1); body.moveTo([x, y - 0.22, 0]);
    const name = T('Ana', P ? 18 : 19, COL.ana, false, true);
    name.moveTo([x, y - 0.78, 0]);
    return new M.VGroup(ring, head, body, name);
  }

  // Glowing book card with colored spine and optional relevance badge (1 / 0)
  function makeBook(name, color, pos, w = CARD_W, h = CARD_H, rel = null) {
    const [x, y] = pos;
    const bg = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2.4 });
    bg.setFill(C.card, 0.94); bg.moveTo([x, y, 0]);
    const spine = new M.Rectangle({ width: 0.13, height: h - 0.18, color, strokeWidth: 0 });
    spine.setFill(color, 0.92); spine.moveTo([x - w / 2 + 0.16, y, 0]);
    const label = T(name, P ? 20 : 21, C.ink, false, true);
    const lx = rel === null ? x + 0.08 : x - 0.18;
    label.moveTo([lx, y, 0]);
    const parts = [bg, spine, label];
    if (rel !== null) {
      const bcol = rel ? C.green : C.muted;
      const badge = new M.Circle({ radius: 0.22, color: bcol, strokeWidth: 2 });
      badge.setFill(rel ? C.green : C.bg, rel ? 0.22 : 0.9);
      badge.moveTo([x + w / 2 - 0.36, y, 0]);
      const num = T(String(rel), 18, bcol, true, true);
      num.moveTo([x + w / 2 - 0.36, y, 0]);
      parts.push(badge, num);
    }
    return new M.VGroup(...parts);
  }

  // Simple arrow from Line + triangular head Polygon
  function makeArrow(a, b, color = C.cyan, sw = 3) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, hl = 0.20, hw = 0.11;
    const shaftEnd = [b[0] - ux * hl * 0.75, b[1] - uy * hl * 0.75, 0];
    const line = new M.Line({ start: a, end: shaftEnd, color, strokeWidth: sw });
    const tip = [b[0], b[1], 0];
    const left = [b[0] - ux * hl - uy * hw, b[1] - uy * hl + ux * hw, 0];
    const right = [b[0] - ux * hl + uy * hw, b[1] - uy * hl - ux * hw, 0];
    const head = new M.Polygon({ vertices: [tip, left, right], color, strokeWidth: 1 });
    head.setFill(color, 1);
    return new M.VGroup(line, head);
  }

  function makeBox(x, y, w, h, color, sw = 3) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: sw });
    r.setFill(color, 0.08);
    r.moveTo([x, y, 0]);
    return r;
  }

  // === BEATS 0-1: Ana opens the bookshop website, 3 empty suggestion slots ===
  const anaIntroPos = P ? [0, 0.65, 0] : [-4.7, -0.15, 0];
  const anaIntro = makeAna(anaIntroPos);

  const winX = P ? 0 : 0.85, winY = P ? -2.25 : -0.15;
  const winW = P ? 6.2 : 7.6, winH = P ? 3.8 : 3.5;
  const winBox = new M.RoundedRectangle({ width: winW, height: winH, cornerRadius: 0.2, color: C.line, strokeWidth: 2.5 });
  winBox.setFill(C.card, 0.85); winBox.moveTo([winX, winY, 0]);
  const winBar = new M.Line({ start: [winX - winW / 2, winY + winH / 2 - 0.55, 0], end: [winX + winW / 2, winY + winH / 2 - 0.55, 0], color: C.line, strokeWidth: 2 });
  const winTitle = T('BOOKSHOP RECOMMENDATIONS', P ? 16 : 17, C.cyan, true, true);
  winTitle.moveTo([winX, winY + winH / 2 - 0.28, 0]);

  const slotYs = [0, 1, 2].map(i => winY + winH / 2 - 1.05 - i * (P ? 0.96 : 0.88));
  const emptySlots = slotYs.map((sy, i) => {
    const sr = new M.RoundedRectangle({ width: winW - 1.1, height: P ? 0.72 : 0.66, cornerRadius: 0.12, color: C.muted, strokeWidth: 1.8 });
    sr.setFill(C.bg, 0.7); sr.moveTo([winX + 0.15, sy, 0]);
    const sn = T(`#${i + 1}`, 17, C.muted, true, true);
    sn.moveTo([winX - winW / 2 + 0.42, sy, 0]);
    return new M.VGroup(sr, sn);
  });
  const qMarks = slotYs.map(sy => {
    const q = T('?   which book here?', P ? 17 : 18, C.amber, true);
    q.moveTo([winX + 0.15, sy, 0]);
    return q;
  });

  await until(S(0));
  await play(
    new M.FadeIn(anaIntro, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(winBox, winBar, winTitle, ...emptySlots), { runTime: 0.8 }),
    ...say('ANA OPENS THE BOOKSHOP', C.cyan)
  );

  await until(S(1));
  await play(
    new M.LaggedStart(qMarks.map(q => new M.FadeIn(q)), { lagRatio: 0.2, runTime: 0.9 }),
    ...say('3 BOOKS — IN WHICH ORDER?', C.amber)
  );

  // === BEATS 2-8: Three unread books, separate test, relevance marks & 1/0 ===
  const introBookPos = P
    ? [[-0.55, -0.95, 0], [-0.55, -2.15, 0], [-0.55, -3.35, 0]]
    : [[-1.65, -0.15, 0], [1.45, -0.15, 0], [4.55, -0.15, 0]];
  const ibW = P ? 3.2 : 2.55, ibH = P ? 0.88 : 1.05;
  const introBooks = [
    makeBook('River', COL.river, introBookPos[0], ibW, ibH),
    makeBook('Castle', COL.castle, introBookPos[1], ibW, ibH),
    makeBook('Island', COL.island, introBookPos[2], ibW, ibH),
  ];

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(winBox, winBar, winTitle, ...emptySlots, ...qMarks), { runTime: 0.55 }),
    new M.LaggedStart(introBooks.map(b => new M.FadeIn(b)), { lagRatio: 0.18, runTime: 1.0 }),
    ...say('3 UNREAD BOOKS: RIVER, CASTLE, ISLAND', C.cyan)
  );

  // Beat 3: separate test dashed box around books
  const testFrame = P
    ? makeBox(0.15, -2.15, 6.2, 3.9, C.cyan, 2)
    : makeBox(1.45, -0.15, 9.5, 2.35, C.cyan, 2);
  const testTag = T('SEPARATE TEST', 16, C.cyan, true, true);
  testTag.moveTo(P ? [0.15, -4.4, 0] : [1.45, 1.22, 0]);
  await until(S(3));
  await play(new M.Create(testFrame, { runTime: 0.7 }), new M.FadeIn(testTag, { runTime: 0.5 }), ...say('ASK ANA IN A SEPARATE TEST', C.cyan));

  // Beat 4: Ana chooses River and Island, not Castle
  const noMarkPos = P ? [1.75, -2.15, 0] : [1.45, 0.78, 0];
  const noMark = T('✕', 26, C.pink, true, true); noMark.moveTo(noMarkPos);
  await until(S(4));
  await play(
    new M.Indicate(introBooks[0], { color: C.green, runTime: 0.8 }),
    new M.Indicate(introBooks[2], { color: C.green, runTime: 0.8 }),
    new M.FadeIn(noMark, { runTime: 0.6 }),
    ...say('ANA CHOOSES RIVER & ISLAND', C.green)
  );

  // Beat 5: Green checkmarks beside River and Island
  const checkPos = P
    ? [[1.75, -0.95, 0], [1.75, -3.35, 0]]
    : [[-1.65, 0.78, 0], [4.55, 0.78, 0]];
  const checks = checkPos.map(p => {
    const c = new M.Circle({ radius: 0.28, color: C.green, strokeWidth: 2.5 });
    c.setFill(C.green, 0.22); c.moveTo(p);
    const t = T('✓', 24, C.green, true, true); t.moveTo(p);
    return new M.VGroup(c, t);
  });
  await until(S(5));
  await play(
    new M.FadeIn(checks[0], { runTime: 0.55 }),
    new M.FadeIn(checks[1], { runTime: 0.55 }),
    new M.Flash(checks[0], { color: C.green, runTime: 0.6 }),
    new M.Flash(checks[1], { color: C.green, runTime: 0.6 }),
    ...say('GREEN MARK BESIDE RIVER & ISLAND', C.green)
  );

  // Beat 6: Relevant book
  await until(S(6));
  await play(
    new M.Indicate(checks[0], { color: C.green, runTime: 0.7 }),
    new M.Indicate(checks[1], { color: C.green, runTime: 0.7 }),
    ...say('RELEVANT = MATCHES WHAT ANA WANTS', C.green)
  );

  // Beat 7: 1 for relevant, 0 for other
  const numPos = P
    ? [[2.65, -0.95, 0], [2.65, -2.15, 0], [2.65, -3.35, 0]]
    : [[-1.65, -1.25, 0], [1.45, -1.25, 0], [4.55, -1.25, 0]];
  const relVals = [1, 0, 1];
  const relBadges = relVals.map((v, i) => {
    const col = v ? C.green : C.muted;
    const p = pill(String(v), col, 22);
    p.moveTo(numPos[i]);
    return p;
  });
  await until(S(7));
  await play(
    new M.LaggedStart(relBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.18, runTime: 0.9 }),
    ...say('RELEVANT = 1     OTHER = 0', C.amber)
  );

  // Beat 8: Tell us whether each book matches Ana's interests
  await until(S(8));
  await play(
    new M.LaggedStart(relBadges.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('1 OR 0 SHOWS ANA’S INTERESTS', C.cyan)
  );

  // === BEATS 9-18: Two ways to display the books, ranking ===
  const posLabels = [0, 1, 2].map(i => {
    const t = T(`#${i + 1}`, P ? 18 : 20, C.muted, true, true);
    t.moveTo(P ? [BAR_X0 + 0.22, ROW_Y[i] + 0.21, 0] : [POS_X, ROW_Y[i], 0]);
    return t;
  });
  const hPos = T('POS', 15, C.muted, true, true);
  hPos.moveTo([P ? POS_X : POS_X, HEAD_Y, 0]);
  const hL1 = T('LIST 1', 17, C.cyan, true, true);
  hL1.moveTo([L1_X, HEAD_Y, 0]);
  const hL2 = T('LIST 2', 17, C.green, true, true);
  hL2.moveTo([L2_X, HEAD_Y, 0]);

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(anaIntro, testFrame, testTag, noMark, ...introBooks, ...checks, ...relBadges), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(hPos, hL1, hL2, ...posLabels), { runTime: 0.7 }),
    ...say('TWO WAYS TO ORDER THE BOOKS', C.cyan)
  );

  // Beat 10: List 1 = Castle (0), River (1), Island (1)
  const list1Data = [
    ['Castle', COL.castle, 0],
    ['River', COL.river, 1],
    ['Island', COL.island, 1],
  ];
  const list1Cards = list1Data.map(([n, c, r], i) => makeBook(n, c, [L1_X, ROW_Y[i], 0], CARD_W, CARD_H, r));
  await until(S(10));
  await play(
    new M.LaggedStart(list1Cards.map(c => new M.FadeIn(c, { shift: [0, 0.14, 0] })), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('LIST 1: CASTLE, RIVER, ISLAND', C.violet)
  );

  // Beat 11: List 2 = River (1), Island (1), Castle (0)
  const list2Data = [
    ['River', COL.river, 1],
    ['Island', COL.island, 1],
    ['Castle', COL.castle, 0],
  ];
  const list2Cards = list2Data.map(([n, c, r], i) => makeBook(n, c, [L2_X, ROW_Y[i], 0], CARD_W, CARD_H, r));
  await until(S(11));
  await play(
    new M.LaggedStart(list2Cards.map(c => new M.FadeIn(c, { shift: [0, 0.14, 0] })), { lagRatio: 0.2, runTime: 1.0 }),
    ...say('LIST 2: RIVER, ISLAND, CASTLE', C.green)
  );

  // Beat 12: Both lists contain 2 relevant books
  const relCount1 = T('2 relevant', 16, C.green, true); relCount1.moveTo([L1_X, TOT_Y, 0]);
  const relCount2 = T('2 relevant', 16, C.green, true); relCount2.moveTo([L2_X, TOT_Y, 0]);
  await until(S(12));
  await play(
    new M.FadeIn(relCount1, { runTime: 0.5 }),
    new M.FadeIn(relCount2, { runTime: 0.5 }),
    new M.Indicate(list1Cards[1], { color: C.green, runTime: 0.7 }),
    new M.Indicate(list1Cards[2], { color: C.green, runTime: 0.7 }),
    new M.Indicate(list2Cards[0], { color: C.green, runTime: 0.7 }),
    new M.Indicate(list2Cards[1], { color: C.green, runTime: 0.7 }),
    ...say('BOTH HAVE 2 RELEVANT BOOKS', C.cyan)
  );

  // Beat 13: Ana only has time to look at the first book
  const topBandX = (L1_X + L2_X) / 2, topBandW = (L2_X - L1_X) + CARD_W + 0.34;
  const topBand = makeBox(topBandX, ROW_Y[0], topBandW, CARD_H + 0.24, C.amber, 2.5);
  await until(S(13));
  await play(new M.Create(topBand, { runTime: 0.7 }), ...say('ONLY TIME FOR THE FIRST BOOK', C.amber));

  // Beat 14: First list -> Castle (not wanted)
  const hiBad = makeBox(L1_X, ROW_Y[0], CARD_W + 0.16, CARD_H + 0.16, C.pink, 3.2);
  await until(S(14));
  await play(
    new M.FadeIn(hiBad, { runTime: 0.5 }),
    new M.Indicate(list1Cards[0], { color: C.pink, runTime: 0.8 }),
    ...say('LIST 1 #1: CASTLE (NOT WANTED)', C.pink)
  );

  // Beat 15: Second list -> River (wanted!)
  const hiGood = makeBox(L2_X, ROW_Y[0], CARD_W + 0.16, CARD_H + 0.16, C.green, 3.2);
  await until(S(15));
  await play(
    new M.FadeOut(hiBad, { runTime: 0.4 }),
    new M.FadeIn(hiGood, { runTime: 0.5 }),
    new M.Indicate(list2Cards[0], { color: C.green, runTime: 0.8 }),
    new M.Flash(list2Cards[0], { color: C.green, runTime: 0.7 }),
    ...say('LIST 2 #1: RIVER (WANTED!)', C.green)
  );

  // Beat 16: Finding relevant books is not enough
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(topBand, hiGood, relCount1, relCount2), { runTime: 0.5 }),
    ...say('RELEVANT BOOKS ALONE ARE NOT ENOUGH', C.amber)
  );

  // Beat 17: Place relevant books near the top
  const upArrowX = P ? BAR_X0 + 0.22 : POS_X - 0.55;
  const upArrow = makeArrow([upArrowX, ROW_Y[2] - 0.1, 0], [upArrowX, ROW_Y[0] + 0.25, 0], C.green, 3.5);
  await until(S(17));
  await play(new M.FadeIn(upArrow, { runTime: 0.65 }), ...say('PUT RELEVANT BOOKS NEAR THE TOP', C.green));

  // Beat 18: Arranging books in order is called ranking
  await until(S(18));
  await play(
    new M.LaggedStart(posLabels.map(p => new M.Indicate(p, { color: C.cyan })), { lagRatio: 0.15, runTime: 0.8 }),
    ...say('RANKING = ARRANGING IN ORDER', C.cyan)
  );

  // === BEATS 19-26: Position credits & discount ===
  const hCred = T(P ? 'CREDIT' : 'CREDIT', 15, C.amber, true, true);
  hCred.moveTo([P ? POS_X : BAR_X0 + BAR_MAX * 0.65, HEAD_Y, 0]);
  await until(S(19));
  await play(
    new M.FadeOut(upArrow, { runTime: 0.4 }),
    P ? new M.FadeOut(hPos, { runTime: 0.4 }) : new M.Indicate(hPos, { color: C.muted, runTime: 0.5 }),
    new M.FadeIn(hCred, { runTime: 0.5 }),
    ...say('MORE CREDIT NEAR THE TOP', C.amber)
  );

  // Beat 20: Three positions with empty credit tracks
  const barY = i => P ? ROW_Y[i] - 0.14 : ROW_Y[i];
  const barTracks = [0, 1, 2].map(i => {
    const tr = new M.Rectangle({ width: BAR_MAX, height: BAR_H, color: C.line, strokeWidth: 1.5 });
    tr.setFill(C.bg, 0.7);
    tr.moveTo([BAR_X0 + BAR_MAX / 2, barY(i), 0]);
    return tr;
  });
  await until(S(20));
  await play(
    new M.LaggedStart(barTracks.map(tr => new M.FadeIn(tr)), { lagRatio: 0.15, runTime: 0.8 }),
    ...say('3 POSITIONS, DIFFERENT CREDITS', C.amber)
  );

  // Helper to build one credit bar + value text
  const creditBars = [], creditNums = [];
  for (let i = 0; i < 3; i++) {
    const bw = BAR_MAX * CREDITS[i];
    const bar = new M.Rectangle({ width: bw, height: BAR_H, color: C.amber, strokeWidth: 1.5 });
    bar.setFill(C.amber, 0.85);
    bar.moveTo([BAR_X0 + bw / 2, barY(i), 0]);
    const txt = T(CRED_TXT[i], P ? 16 : 17, C.amber, true, true);
    txt.moveTo(P ? [BAR_X0 + BAR_MAX - 0.34, ROW_Y[i] + 0.21, 0] : [BAR_X0 + BAR_MAX + 0.42, ROW_Y[i], 0]);
    creditBars.push(bar);
    creditNums.push(txt);
  }

  // Beat 21: Position 1 = 1 full point
  await until(S(21));
  await play(
    new M.FadeIn(creditBars[0], { runTime: 0.6 }),
    new M.FadeIn(creditNums[0], { runTime: 0.6 }),
    ...say('POSITION 1: 1 FULL POINT', C.amber)
  );

  // Beat 22: Position 2 = about 0.63 points
  await until(S(22));
  await play(
    new M.FadeIn(creditBars[1], { runTime: 0.6 }),
    new M.FadeIn(creditNums[1], { runTime: 0.6 }),
    ...say('POSITION 2: ≈ 0.63 POINTS', C.amber)
  );

  // Beat 23: Position 3 = 0.50 points
  await until(S(23));
  await play(
    new M.FadeIn(creditBars[2], { runTime: 0.55 }),
    new M.FadeIn(creditNums[2], { runTime: 0.55 }),
    ...say('POSITION 3: 0.50 POINTS', C.amber)
  );

  // Beat 24: Lower position = less credit
  await until(S(24));
  await play(
    new M.LaggedStart(creditBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.22, runTime: 1.2 }),
    ...say('LOWER POSITION = LESS CREDIT', C.muted)
  );

  // Beat 25: Discount
  await until(S(25));
  await play(
    new M.Indicate(creditBars[1], { color: C.violet, runTime: 0.7 }),
    new M.Indicate(creditBars[2], { color: C.violet, runTime: 0.7 }),
    ...say('DISCOUNT = LESS CREDIT LOWER DOWN', C.violet)
  );

  // Beat 26: Relevant earns points, other earns 0
  await until(S(26));
  await play(
    ...fbox([
      ['Rule for each position', C.cyan],
      ['relevant (1) -> credit', C.green],
      ['other    (0) -> 0', C.muted],
    ], C.cyan),
    ...say('RELEVANT EARNS CREDIT, OTHER = 0', C.cyan)
  );

  // === BEATS 27-32: Calculate DCG for List 1 ===
  const col1Frame = makeBox(L1_X, ROW_Y[1], CARD_W + 0.22, (ROW_Y[0] - ROW_Y[2]) + CARD_H + 0.24, C.cyan, 2.2);
  await until(S(27));
  await play(
    new M.Create(col1Frame, { runTime: 0.65 }),
    ...fbox([['List 1 score', C.cyan], 'check each position'], C.cyan),
    ...say('SCORE FOR LIST 1', C.cyan)
  );

  // Beat 28: #1 Castle -> 0
  let rowHi = makeBox(L1_X, ROW_Y[0], CARD_W + 0.14, CARD_H + 0.14, C.pink, 3);
  await until(S(28));
  await play(
    new M.FadeIn(rowHi, { runTime: 0.45 }),
    new M.Indicate(creditBars[0], { color: C.muted, runTime: 0.6 }),
    ...fbox([
      ['List 1', C.cyan],
      ['#1 Castle: 0 × 1.00 = 0', C.pink],
    ], C.cyan),
    ...say('#1 CASTLE (0) → 0 POINTS', C.pink)
  );

  // Beat 29: #2 River -> 0.63
  let rowHi2 = makeBox(L1_X, ROW_Y[1], CARD_W + 0.14, CARD_H + 0.14, C.green, 3);
  await until(S(29));
  await play(
    new M.FadeOut(rowHi, { runTime: 0.35 }),
    new M.FadeIn(rowHi2, { runTime: 0.45 }),
    new M.Indicate(creditBars[1], { color: C.green, runTime: 0.7 }),
    ...fbox([
      ['List 1', C.cyan],
      '#1 Castle: 0 × 1.00 = 0',
      ['#2 River : 1 × 0.63 = 0.63', C.green],
    ], C.cyan),
    ...say('#2 RIVER (1) → ≈ 0.63 POINTS', C.green)
  );

  // Beat 30: #3 Island -> 0.50
  let rowHi3 = makeBox(L1_X, ROW_Y[2], CARD_W + 0.14, CARD_H + 0.14, C.green, 3);
  await until(S(30));
  await play(
    new M.FadeOut(rowHi2, { runTime: 0.35 }),
    new M.FadeIn(rowHi3, { runTime: 0.45 }),
    new M.Indicate(creditBars[2], { color: C.green, runTime: 0.7 }),
    ...fbox([
      ['List 1', C.cyan],
      '#1 Castle: 0 × 1.00 = 0',
      '#2 River : 1 × 0.63 = 0.63',
      ['#3 Island: 1 × 0.50 = 0.50', C.green],
    ], C.cyan),
    ...say('#3 ISLAND (1) → 0.50 POINTS', C.green)
  );

  // Beat 31: Add them -> 1.13
  const dcg1Tag = pill('DCG ≈ 1.13', C.amber, P ? 16 : 17);
  dcg1Tag.moveTo([L1_X, TOT_Y, 0]);
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(rowHi3, col1Frame), { runTime: 0.45 }),
    new M.FadeIn(dcg1Tag, { runTime: 0.6 }),
    ...fbox([
      ['List 1 total', C.amber],
      '0 + 0.63 + 0.50',
      ['= 1.13 points', C.amber],
    ], C.amber),
    ...say('LIST 1 TOTAL ≈ 1.13 POINTS', C.amber)
  );

  // Beat 32: Discounted Cumulative Gain (DCG)
  await until(S(32));
  await play(
    new M.Indicate(dcg1Tag, { color: C.amber, runTime: 0.8 }),
    ...fbox([
      ['DCG', C.amber],
      'Discounted Cumulative Gain',
      ['List 1 DCG ≈ 1.13', C.amber],
    ], C.amber),
    ...say('DCG = TOTAL CREDIT AFTER DISCOUNTS', C.amber)
  );

  // === BEATS 33-38: Calculate Ideal DCG for List 2 ===
  const col2Frame = makeBox(L2_X, ROW_Y[1], CARD_W + 0.22, (ROW_Y[0] - ROW_Y[2]) + CARD_H + 0.24, C.green, 2.2);
  await until(S(33));
  await play(
    new M.Create(col2Frame, { runTime: 0.6 }),
    ...fbox([['List 2 score', C.green], 'check each position'], C.green),
    ...say('SCORE FOR LIST 2', C.green)
  );

  // Beat 34: #1 River -> 1.00
  let r2Hi1 = makeBox(L2_X, ROW_Y[0], CARD_W + 0.14, CARD_H + 0.14, C.green, 3);
  await until(S(34));
  await play(
    new M.FadeIn(r2Hi1, { runTime: 0.45 }),
    new M.Indicate(creditBars[0], { color: C.green, runTime: 0.65 }),
    ...fbox([
      ['List 2', C.green],
      ['#1 River : 1 × 1.00 = 1.00', C.green],
    ], C.green),
    ...say('#1 RIVER (1) → 1.00 POINT', C.green)
  );

  // Beat 35: #2 Island -> 0.63
  let r2Hi2 = makeBox(L2_X, ROW_Y[1], CARD_W + 0.14, CARD_H + 0.14, C.green, 3);
  await until(S(35));
  await play(
    new M.FadeOut(r2Hi1, { runTime: 0.35 }),
    new M.FadeIn(r2Hi2, { runTime: 0.45 }),
    new M.Indicate(creditBars[1], { color: C.green, runTime: 0.65 }),
    ...fbox([
      ['List 2', C.green],
      '#1 River : 1 × 1.00 = 1.00',
      ['#2 Island: 1 × 0.63 = 0.63', C.green],
    ], C.green),
    ...say('#2 ISLAND (1) → ≈ 0.63 POINTS', C.green)
  );

  // Beat 36: #3 Castle -> 0
  let r2Hi3 = makeBox(L2_X, ROW_Y[2], CARD_W + 0.14, CARD_H + 0.14, C.pink, 3);
  await until(S(36));
  await play(
    new M.FadeOut(r2Hi2, { runTime: 0.35 }),
    new M.FadeIn(r2Hi3, { runTime: 0.45 }),
    new M.Indicate(creditBars[2], { color: C.muted, runTime: 0.6 }),
    ...fbox([
      ['List 2', C.green],
      '#1 River : 1 × 1.00 = 1.00',
      '#2 Island: 1 × 0.63 = 0.63',
      ['#3 Castle: 0 × 0.50 = 0', C.pink],
    ], C.green),
    ...say('#3 CASTLE (0) → 0 POINTS', C.pink)
  );

  // Beat 37: Total = 1.63, highest possible score
  const idcgTag = pill('IDCG ≈ 1.63', C.green, P ? 16 : 17);
  idcgTag.moveTo([L2_X, TOT_Y, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(r2Hi3, col2Frame), { runTime: 0.45 }),
    new M.FadeIn(idcgTag, { runTime: 0.6 }),
    ...fbox([
      ['List 2 total (best)', C.green],
      '1.00 + 0.63 + 0',
      ['= 1.63 points', C.green],
    ], C.green),
    ...say('HIGHEST POSSIBLE SCORE ≈ 1.63', C.green)
  );

  // Beat 38: Ideal DCG
  await until(S(38));
  await play(
    new M.Indicate(idcgTag, { color: C.green, runTime: 0.8 }),
    ...fbox([
      ['Ideal DCG', C.green],
      'best possible order',
      ['Ideal DCG ≈ 1.63', C.green],
    ], C.green),
    ...say('IDEAL DCG = BEST POSSIBLE SCORE', C.green)
  );

  // === BEATS 39-46: Scale 0 to 1, divide by ideal DCG, NDCG ===
  const SC_Y = P ? -5.6 : -2.56;
  const SC_X0 = P ? -3.0 : -5.4, SC_X1 = P ? 3.0 : 1.5;
  const s2x = v => SC_X0 + v * (SC_X1 - SC_X0);
  const scaleLine = new M.Line({ start: [SC_X0, SC_Y, 0], end: [SC_X1, SC_Y, 0], color: C.muted, strokeWidth: 3 });
  const scaleTicks = [0, 0.5, 1].map(v => new M.VGroup(
    new M.Line({ start: [s2x(v), SC_Y - 0.09, 0], end: [s2x(v), SC_Y + 0.09, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), 16, C.muted, true).moveTo([s2x(v), SC_Y - 0.29, 0])
  ));
  await until(S(39));
  await play(
    new M.Create(scaleLine, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...scaleTicks), { runTime: 0.55 }),
    ...say('COMPARE ON A 0 TO 1 SCALE', C.cyan)
  );

  // Beat 40: Divide by highest possible score
  await until(S(40));
  await play(
    ...fbox([
      ['Scale to 0 ... 1', C.cyan],
      ['score ÷ highest score', C.ink],
    ], C.cyan),
    ...say('DIVIDE BY THE HIGHEST POSSIBLE SCORE', C.cyan)
  );

  // Beat 41: List 1 -> 1.13 / 1.63
  await until(S(41));
  await play(
    new M.Indicate(dcg1Tag, { color: C.amber, runTime: 0.65 }),
    new M.Indicate(idcgTag, { color: C.green, runTime: 0.65 }),
    ...fbox([
      ['List 1', C.amber],
      ['1.13 ÷ 1.63', C.amber],
    ], C.amber),
    ...say('LIST 1: 1.13 ÷ 1.63', C.amber)
  );

  // Beat 42: Result about 0.69
  const dot1P = [s2x(0.693), SC_Y, 0];
  const dot1 = new M.Dot({ point: dot1P, radius: 0.13, color: C.amber });
  const dot1Lab = T('L1: 0.69', 15, C.amber, true, true);
  dot1Lab.moveTo([dot1P[0] - 0.25, SC_Y + 0.30, 0]);
  await until(S(42));
  await play(
    new M.FadeIn(dot1, { runTime: 0.45 }),
    new M.FadeIn(dot1Lab, { runTime: 0.45 }),
    new M.Flash(dot1, { color: C.amber, runTime: 0.55 }),
    ...fbox([
      ['List 1', C.amber],
      '1.13 ÷ 1.63',
      ['≈ 0.69', C.amber],
    ], C.amber),
    ...say('LIST 1 SCORE ≈ 0.69', C.amber)
  );

  // Beat 43: List 2 -> score divided by itself = 1
  const dot2P = [s2x(1), SC_Y, 0];
  const dot2 = new M.Dot({ point: dot2P, radius: 0.13, color: C.green });
  const dot2Lab = T('L2: 1.00', 15, C.green, true, true);
  dot2Lab.moveTo([dot2P[0] - 0.1, SC_Y + 0.30, 0]);
  await until(S(43));
  await play(
    new M.FadeIn(dot2, { runTime: 0.45 }),
    new M.FadeIn(dot2Lab, { runTime: 0.45 }),
    new M.Flash(dot2, { color: C.green, runTime: 0.55 }),
    ...fbox([
      ['List 2', C.green],
      '1.63 ÷ 1.63',
      ['= 1.00', C.green],
    ], C.green),
    ...say('LIST 2 SCORE = 1.00', C.green)
  );

  // Beat 44: Normalized Discounted Cumulative Gain (NDCG)
  await until(S(44));
  await play(
    new M.Indicate(dot1, { color: C.amber, runTime: 0.65 }),
    new M.Indicate(dot2, { color: C.green, runTime: 0.65 }),
    ...fbox([
      ['NDCG', C.cyan],
      'Normalized DCG',
      ['L1 ≈ 0.69   L2 = 1.00', C.amber],
    ], C.cyan),
    ...say('NDCG = NORMALIZED DCG', C.cyan)
  );

  // Beat 45: Normalized means same 0 to 1 scale
  await until(S(45));
  await play(
    new M.Indicate(scaleLine, { color: C.cyan, runTime: 0.85 }),
    ...say('NORMALIZED = SAME 0 TO 1 SCALE', C.cyan)
  );

  // Beat 46: Formula NDCG = DCG / ideal DCG
  await until(S(46));
  await play(
    ...fbox([
      ['NDCG = DCG ÷ Ideal DCG', C.amber],
      ['L1: 1.13 ÷ 1.63 ≈ 0.69', C.muted],
      ['L2: 1.63 ÷ 1.63 = 1.00', C.green],
    ], C.amber),
    ...say('NDCG = DCG ÷ IDEAL DCG', C.amber)
  );

  // === BEATS 47-51: Where the position credits come from (doubling & log2) ===
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(
      hL1, hL2, ...list1Cards, ...list2Cards, dcg1Tag, idcgTag,
      scaleLine, ...scaleTicks, dot1, dot1Lab, dot2, dot2Lab
    ), { runTime: 0.6 }),
    new M.LaggedStart(creditBars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.16, runTime: 0.9 }),
    ...fbox([
      ['Where do credits come from?', C.violet],
      'pos 1 -> 1.00',
      'pos 2 -> 0.63',
      'pos 3 -> 0.50',
    ], C.violet),
    ...say('WHERE DO CREDITS COME FROM?', C.violet)
  );

  // Beat 48: Start at 1 and double until target number
  const dY = P ? -4.75 : 0.25;
  const dXs = P ? [-2.55, -0.35, 0.85, 2.05] : [-2.45, -0.65, 0.25, 1.15];
  const makeNumNode = (txt, x, y, col, rad = 0.34) => {
    const c = new M.Circle({ radius: rad, color: col, strokeWidth: 2.5 });
    c.setFill(C.card, 0.95); c.moveTo([x, y, 0]);
    const t = T(txt, 20, col, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(c, t);
  };
  const n1 = makeNumNode('1', dXs[0], dY, C.cyan);
  const n2 = makeNumNode('2', dXs[1], dY, C.cyan);
  const n3 = makeNumNode('3', dXs[2], dY, C.muted, 0.26);
  const n4 = makeNumNode('4', dXs[3], dY, C.cyan);
  const a12 = makeArrow([dXs[0] + 0.40, dY, 0], [dXs[1] - 0.40, dY, 0], C.amber, 2.8);
  const x2a = T('×2', 17, C.amber, true, true); x2a.moveTo([(dXs[0] + dXs[1]) / 2, dY + 0.36, 0]);
  const a24 = makeArrow([dXs[1] + 0.34, dY + 0.28, 0], [dXs[3] - 0.34, dY + 0.28, 0], C.amber, 2.8);
  const x2b = T('×2', 17, C.amber, true, true); x2b.moveTo([(dXs[1] + dXs[3]) / 2, dY + 0.62, 0]);

  await until(S(48));
  await play(
    new M.LaggedStart([
      new M.FadeIn(n1),
      new M.FadeIn(new M.VGroup(a12, x2a)),
      new M.FadeIn(n2),
      new M.FadeIn(n3),
      new M.FadeIn(new M.VGroup(a24, x2b)),
      new M.FadeIn(n4),
    ], { lagRatio: 0.16, runTime: 1.3 }),
    ...say('START AT 1 AND DOUBLE', C.cyan)
  );

  // Beat 49: Base-two logarithm = number of doublings
  const logLines = [
    T('1 → 2 :  1 doubling   ⇒  log₂(2) = 1', P ? 16 : 17, C.cyan, true).moveTo([P ? 0.1 : -0.65, dY - 0.85, 0]),
    T('1 → 3 : ≈1.58 doublings ⇒ log₂(3) ≈ 1.58', P ? 15 : 16, C.muted, true).moveTo([P ? 0.1 : -0.65, dY - 1.25, 0]),
    T('1 → 4 :  2 doublings  ⇒  log₂(4) = 2', P ? 16 : 17, C.cyan, true).moveTo([P ? 0.1 : -0.65, dY - 1.65, 0]),
  ];
  await until(S(49));
  await play(
    new M.LaggedStart(logLines.map(l => new M.FadeIn(l)), { lagRatio: 0.2, runTime: 1.0 }),
    ...fbox([
      ['Base-2 logarithm', C.cyan],
      'doublings from 1',
      'log₂(2) = 1, log₂(4) = 2',
    ], C.cyan),
    ...say('log₂ = NUMBER OF DOUBLINGS', C.cyan)
  );

  // Beat 50: Credit = 1 / log2(position + 1)
  await until(S(50));
  await play(
    ...fbox([
      ['Position credit', C.amber],
      ['1 ÷ log₂(position + 1)', C.ink],
    ], C.amber),
    ...say('CREDIT = 1 ÷ log₂(POSITION + 1)', C.amber)
  );

  // Beat 51: Credits of 1, 0.63, and 0.50
  await until(S(51));
  await play(
    new M.LaggedStart(creditBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.1 }),
    ...fbox([
      ['#1: 1 ÷ log₂(2) = 1.00', C.amber],
      ['#2: 1 ÷ log₂(3) ≈ 0.63', C.amber],
      ['#3: 1 ÷ log₂(4) = 0.50', C.amber],
    ], C.amber),
    ...say('CREDITS: 1.00, ≈ 0.63, 0.50', C.amber)
  );

  // === BEATS 52-54: What NDCG is for, trap, recap ===
  const mALab = T('LIST 1', 16, C.amber, true, true); mALab.moveTo([L1_X, HEAD_Y, 0]);
  const mBLab = T('LIST 2', 16, C.green, true, true); mBLab.moveTo([L2_X, HEAD_Y, 0]);
  const mACards = list1Data.map(([n, c, r], i) => makeBook(n, c, [L1_X, ROW_Y[i], 0], CARD_W, CARD_H, r));
  const mBCards = list2Data.map(([n, c, r], i) => makeBook(n, c, [L2_X, ROW_Y[i], 0], CARD_W, CARD_H, r));
  const mATag = pill('NDCG ≈ 0.69', C.amber, P ? 15 : 16); mATag.moveTo([L1_X, TOT_Y, 0]);
  const mBTag = pill('NDCG = 1.00', C.green, P ? 15 : 16); mBTag.moveTo([L2_X, TOT_Y, 0]);

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(n1, n2, n3, n4, a12, x2a, a24, x2b, ...logLines), { runTime: 0.55 }),
    new M.FadeIn(new M.VGroup(mALab, mBLab, ...mACards, ...mBCards, mATag, mBTag), { runTime: 0.75 }),
    ...fbox([
      ['Compare methods', C.cyan],
      ['Method A: NDCG ≈ 0.69', C.amber],
      ['Method B: NDCG = 1.00', C.green],
    ], C.cyan),
    ...say('USE NDCG TO COMPARE METHODS', C.cyan)
  );

  // Beat 53: Trap — needs reliable information about what Ana wants
  const warnBadges = [0, 1, 2].map(i => {
    const q = pill('?', C.pink, 15);
    q.moveTo([L2_X + CARD_W / 2 - 0.36, ROW_Y[i], 0]);
    return q;
  });
  await until(S(53));
  await play(
    new M.LaggedStart(warnBadges.map(w => new M.FadeIn(w)), { lagRatio: 0.15, runTime: 0.75 }),
    ...fbox([
      ['Watch out', C.pink],
      'Needs reliable labels',
      'of what Ana wants',
    ], C.pink),
    ...say('NEEDS RELIABLE RELEVANCE LABELS', C.pink)
  );

  // Beat 54: Final recap
  const bestFrame = makeBox(L2_X, ROW_Y[1], CARD_W + 0.24, (ROW_Y[0] - ROW_Y[2]) + CARD_H + 0.26, C.green, 3);
  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(...warnBadges), { runTime: 0.4 }),
    new M.Create(bestFrame, { runTime: 0.65 }),
    new M.Indicate(mBTag, { color: C.green, runTime: 0.8 }),
    ...fbox([
      ['NDCG = DCG ÷ Ideal DCG', C.green],
      'relevant items near top',
      'scale: 0 to 1 (best)',
    ], C.green),
    ...say('NDCG: RELEVANT ITEMS NEAR THE TOP', C.green)
  );
}

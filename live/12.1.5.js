// 12.1.5 Training and test sets (live lesson in site/live/engine.js).
// Beat i = sentence i (0-based, 42 sentences).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter data (chapters/12.1.md): 20 renewals [name, month, hours, cancelled]
  const R = [
    ['Ali', 'Jan', 20, 0], ['Ali', 'Feb', 18, 0], ['Ali', 'Mar', 22, 0], ['Ali', 'Apr', 19, 0], ['Ali', 'May', 21, 0], ['Ali', 'Jun', 20, 0],
    ['Bea', 'Jan', 12, 0], ['Bea', 'Feb', 6, 0], ['Bea', 'Mar', 2, 1],
    ['Chen', 'Jan', 15, 0], ['Chen', 'Feb', 10, 0], ['Chen', 'Mar', 7, 0], ['Chen', 'Apr', 3, 1],
    ['Farah', 'Feb', 1, 1],
    ['Dina', 'Mar', 3, 0], ['Dina', 'Apr', 9, 0], ['Dina', 'May', 14, 0], ['Dina', 'Jun', 16, 0],
    ['Eli', 'May', 11, 0], ['Eli', 'Jun', 6, 1],
  ];
  const TEST = [7, 12, 4, 17, 19];                      // Bea Feb, Chen Apr, Ali May, Dina Jun, Eli Jun
  const TRAIN = R.map((_, i) => i).filter(i => !TEST.includes(i));
  const DINA_MAR = 14;
  const guessCancel = i => R[i][2] < 5;
  const right = i => guessCancel(i) === !!R[i][3];

  // Layout: laptop = cards/box left + note right; phone = pill top + grids/box middle + note in lower third
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.86, 0];
  const BOXP = P ? [0, -5.35, 0] : [4.65, -0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  // full table of 20
  const G20 = P
    ? { cols: 4, w: 1.74, h: 0.96, sx: 1.90, sy: 1.14, cx: 0, cy: -0.35 }
    : { cols: 5, w: 1.52, h: 0.82, sx: 1.68, sy: 1.0, cx: CX, cy: -0.72 };
  // training table of 15
  const G15 = P
    ? { cols: 3, w: 2.24, h: 0.72, sx: 2.40, sy: 0.82, cx: 0, cy: 0.88 }
    : { cols: 5, w: 1.24, h: 0.80, sx: 1.34, sy: 1.0, cx: -3.30, cy: -0.72 };
  const gpos = (g, k, n) => {
    const rows = Math.ceil(n / g.cols), r = Math.floor(k / g.cols), c = k % g.cols;
    return [g.cx + (c - (g.cols - 1) / 2) * g.sx, g.cy + ((rows - 1) / 2 - r) * g.sy, 0];
  };
  // test box (5 cards): laptop = one column; phone = 3 + 2
  const TB = P
    ? { w: 2.24, h: 0.72, y: -2.48, sx: 2.40, sy: 0.86 }
    : { w: 1.40, h: 0.68, x: 1.35, y0: -0.72, sy: 0.78 };
  const tpos = k => P
    ? (k < 3 ? [(k - 1) * TB.sx, TB.y + TB.sy / 2, 0] : [(k - 3.5) * TB.sx, TB.y - TB.sy / 2, 0])
    : [TB.x, TB.y0 + (2 - k) * TB.sy, 0];
  const boxW = P ? 3 * TB.sx + 0.36 : TB.w + 0.36;
  const boxH = P ? 2 * TB.sy + 0.34 : 5 * TB.sy + 0.34;
  const boxC = P ? [0, TB.y, 0] : [TB.x, TB.y0, 0];

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.68, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.34, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0.01]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function fit(t, w) { const tw = t.getWidth(); if (tw > w) t.scale(w / tw); return t; }
  function card(i, p, w, h, colored = true, hasMark = true) {
    const col = colored ? (R[i][3] ? C.pink : C.cyan) : C.muted;
    const fr = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color: col, strokeWidth: 1.8 });
    fr.setFill(colored ? col : C.card, colored ? 0.14 : 0.95); fr.moveTo(p);
    const pad = hasMark ? (P ? 0.56 : 0.44) : 0.24;
    const dx = hasMark ? (P ? 0.17 : 0.14) : 0;
    const dy = Math.min(0.19, h * 0.22);
    const t1 = fit(T(`${R[i][0]} ${R[i][1]}`, P ? 16 : 15, C.ink), w - pad);
    t1.moveTo([p[0] - dx, p[1] + dy, 0.015]);
    const t2 = fit(T(`${R[i][2]} h`, P ? 18 : 15, C.muted, true), w - pad);
    t2.moveTo([p[0] - dx, p[1] - dy, 0.015]);
    return { p, w, h, fr, t1, t2, all: [fr, t1, t2] };
  }
  function glow(c, i) {
    const col = R[i][3] ? C.pink : C.cyan;
    const g = new M.RoundedRectangle({ width: c.w, height: c.h, cornerRadius: 0.1, color: col, strokeWidth: 2.4 });
    g.setFill(col, 0.14); g.moveTo([c.p[0], c.p[1], 0.005]); return g;
  }
  const markX = c => c.p[0] + c.w / 2 - (P ? 0.26 : 0.20);
  function checkLines(c, color = C.green) {
    const x = markX(c), y = c.p[1] - 0.02, s = P ? 0.11 : 0.10;
    return [
      new M.Line({ start: [x - s, y, 0.025], end: [x - s * 0.2, y - s * 0.8, 0.025], color, strokeWidth: 4 }),
      new M.Line({ start: [x - s * 0.2, y - s * 0.8, 0.025], end: [x + s * 1.1, y + s * 1.1, 0.025], color, strokeWidth: 4 }),
    ];
  }
  function crossLines(c, color = C.pink) {
    const x = markX(c), y = c.p[1], s = P ? 0.10 : 0.09;
    return [
      new M.Line({ start: [x - s, y - s, 0.025], end: [x + s, y + s, 0.025], color, strokeWidth: 4 }),
      new M.Line({ start: [x - s, y + s, 0.025], end: [x + s, y - s, 0.025], color, strokeWidth: 4 }),
    ];
  }
  const fadeCard = (items, rt = 0.25) => new M.LaggedStart(items.map(o => new M.FadeIn(o, { runTime: rt })), { lagRatio: 0, runTime: rt });
  const fadeInCards = (cs, rt = 1.2) => new M.LaggedStart(cs.map(c => fadeCard(c.all, 0.25)), { lagRatio: 0.06, runTime: rt });

  function makeTeaser(center, head, big, sub, color) {
    const w = P ? 5.8 : 3.0, h = P ? 2.3 : 2.55;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.2, color, strokeWidth: 2.4 });
    r.setFill(C.card, 0.95); r.moveTo(center);
    const hT = T(head, P ? 18 : 16, C.muted, true, true); hT.moveTo([center[0], center[1] + (P ? 0.72 : 0.82), 0.01]);
    const bT = T(big, P ? 50 : 44, color, true, true); bT.moveTo([center[0], center[1] + 0.04, 0.01]);
    const sT = T(sub, P ? 20 : 18, C.ink); sT.moveTo([center[0], center[1] - (P ? 0.68 : 0.78), 0.01]);
    return new M.VGroup(r, hT, bT, sT);
  }

  // 0-1 opening teaser
  const oldCard = makeTeaser(P ? [0, 1.35, 0] : [CX - 1.72, -0.55, 0], 'OLD CARDS', '18 / 20', '90% right', C.green);
  const unseenCard = makeTeaser(P ? [0, -1.55, 0] : [CX + 1.72, -0.55, 0], 'UNSEEN CARDS', '?', 'how to check?', C.violet);
  await until(S(0));
  await play(new M.FadeIn(oldCard, { runTime: 0.7 }), ...say('HOURS RULE: GOOD ON OLD CARDS', C.amber),
    ...fbox(['hours < 5 → “cancel”', 'otherwise → “stay”', ['old cards: 18 / 20', C.green]], C.amber));
  await until(S(1));
  await play(new M.FadeIn(unseenCard, { runTime: 0.7 }), ...say('WHAT ABOUT CARDS IT HAS NOT SEEN?', C.violet));

  // 2 all 20 cards
  const all = R.map((_, i) => card(i, gpos(G20, i, 20), G20.w, G20.h, true, false));
  await until(S(2));
  await play(new M.FadeOut(oldCard, { runTime: 0.4 }), new M.FadeOut(unseenCard, { runTime: 0.4 }),
    fadeInCards(all, 1.5), ...say('ALL 20 CARDS ON THE TABLE', C.ink),
    ...fbox(['20 renewal cards', ['16 stayed', C.cyan], ['4 cancelled', C.pink]], C.muted));

  // 3 shuffle (new order)
  const PERM = [13, 4, 9, 17, 0, 7, 15, 2, 19, 11, 5, 12, 8, 16, 1, 18, 3, 14, 6, 10];
  const sh = PERM.map((i, k) => card(i, gpos(G20, k, 20), G20.w, G20.h, true, false));
  await until(S(3));
  await play(...all.flatMap(c => c.all).map(o => new M.FadeOut(o, { runTime: 0.45 })), ...say('SHUFFLE THE CARDS', C.violet));
  await play(fadeInCards(sh, 1.0));

  // 4 draw five by chance
  const shBy = i => sh[PERM.indexOf(i)];
  const picks = TEST.map(i => {
    const c = shBy(i);
    const f = new M.RoundedRectangle({ width: c.w + 0.12, height: c.h + 0.12, cornerRadius: 0.13, color: C.amber, strokeWidth: 3 });
    f.moveTo([c.p[0], c.p[1], 0.02]); return f;
  });
  await until(S(4));
  await play(new M.LaggedStart(picks.map(f => new M.Create(f, { runTime: 0.35 })), { lagRatio: 0.3, runTime: 1.3 }), ...say('DRAW 5 BY CHANCE', C.amber));
  const box = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  box.setFill(C.card, 0.6); box.moveTo([boxC[0], boxC[1], -0.01]);
  const tcards = TEST.map((i, k) => card(i, tpos(k), TB.w, TB.h, false, true));
  const train = TRAIN.map((i, k) => card(i, gpos(G15, k, 15), G15.w, G15.h, true, true));
  await play(
    ...sh.flatMap(c => c.all).map(o => new M.FadeOut(o, { runTime: 0.45 })),
    ...picks.map(o => new M.FadeOut(o, { runTime: 0.45 })),
    new M.FadeIn(box, { runTime: 0.5 }),
    fadeInCards(tcards, 0.8),
    fadeInCards(train, 0.9),
  );

  // 5 close the box
  const lid = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  lid.setFill(C.card, 0.97); lid.moveTo([boxC[0], boxC[1], 0.05]);
  const lockT = T('TEST · LOCKED', P ? 19 : 16, C.amber, true, true);
  if (!P) lockT.rotate(Math.PI / 2);
  lockT.moveTo([boxC[0], boxC[1], 0.06]);
  await until(S(5));
  await play(new M.FadeIn(lid, { runTime: 0.6 }), new M.FadeIn(lockT, { runTime: 0.6 }),
    ...say('CLOSE THE BOX: NOT USED FOR LEARNING', C.amber),
    ...fbox(['5 cards locked away', ['not used to make the rule', C.amber]], C.amber));

  // 6-10
  await until(S(6));
  await play(new M.LaggedStart(train.map(c => new M.Indicate(c.fr, { color: C.cyan, runTime: 0.3 })), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('15 CARDS STAY ON THE TABLE', C.cyan), ...fbox([['table: 15 cards', C.cyan], ['box:    5 cards', C.amber]], C.cyan));
  await until(S(7));
  await play(...say('LIKE PRACTICE QUESTIONS BEFORE AN EXAM', C.cyan));
  await until(S(8));
  await play(...say('SET = A GROUP OF CARDS', C.violet), ...fbox([['set', C.violet], '= a group of cards'], C.violet));
  const trainLab = T('TRAINING SET (15)', P ? 17 : 15, C.cyan, true, true);
  trainLab.moveTo(P ? [0, 3.22, 0] : [G15.cx, 1.08, 0]);
  await until(S(9));
  await play(new M.FadeIn(trainLab, { runTime: 0.6 }), ...say('LEARN FROM: THE TRAINING SET', C.cyan),
    ...fbox([['training set', C.cyan], 'the cards you learn from'], C.cyan));
  const testLab = T('TEST SET (5)', P ? 17 : 15, C.amber, true, true);
  testLab.moveTo(P ? [0, -3.84, 0] : [TB.x, -3.12, 0]);
  await until(S(10));
  await play(new M.FadeIn(testLab, { runTime: 0.6 }), new M.Indicate(lockT, { color: C.amber, runTime: 1.0 }),
    ...say('SAVED FOR THE FINAL CHECK: TEST SET', C.amber),
    ...fbox([['test set', C.amber], 'saved for the', 'final check'], C.amber));

  // 11-14 training score
  await until(S(11));
  await play(...say('THE RULE WE PLAN TO TEST: HOURS', C.amber));
  await until(S(12));
  await play(new M.LaggedStart(train.map(c => new M.Indicate(c.t2, { color: C.amber, runTime: 0.3 })), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('HOURS < 5 → CANCEL;  ≥ 5 → STAY', C.amber), ...fbox(['hours < 5  → “cancel”', ['hours ≥ 5  → “stay”', C.cyan]], C.amber));
  const trMarks = TRAIN.map((i, k) => right(i) ? checkLines(train[k]) : crossLines(train[k]));
  await until(S(13));
  await play(new M.LaggedStart(trMarks.flat().map(l => new M.Create(l, { runTime: 0.2 })), { lagRatio: 0.06, runTime: 1.8 }),
    ...say('TRAINING: 14 OF 15 RIGHT', C.green), ...fbox(['training set', ['14 / 15 right', C.green]], C.green));
  const dk = TRAIN.indexOf(DINA_MAR);
  await until(S(14));
  await play(new M.Indicate(train[dk].t1, { color: C.pink, runTime: 1.0 }),
    ...trMarks[dk].map(l => new M.Indicate(l, { color: C.pink, runTime: 1.0 })),
    ...say('DINA MARCH: GUESS CANCEL, BUT SHE STAYED', C.pink),
    ...fbox(['Dina March: 3 h', 'guess: cancel', ['real: stayed', C.pink]], C.pink));

  // 15 open the box
  await until(S(15));
  await play(new M.FadeOut(lid, { runTime: 0.6 }), new M.FadeOut(lockT, { runTime: 0.6 }),
    ...say('KEEP THE RULE FIXED. OPEN THE BOX', C.amber), ...fbox(['rule fixed:', 'hours < 5 → “cancel”'], C.amber));

  // 16-25 the five test cards (mark '?' while checking, then reveal glow + check/cross)
  const tMarkGroups = [];
  const tMarks = [];
  const lines = [
    ['BEA, FEBRUARY: 6 HOURS', 'GUESS STAY, BEA STAYED'],
    ['CHEN, APRIL: 3 HOURS', 'GUESS CANCEL, CHEN CANCELLED'],
    ['ALI, MAY: 21 HOURS', 'GUESS STAY, ALI STAYED'],
    ['DINA, JUNE: 16 HOURS', 'GUESS STAY, DINA STAYED'],
    ['ELI, JUNE: 6 HOURS', 'GUESS STAY, BUT ELI CANCELLED'],
  ];
  for (let k = 0; k < 5; k++) {
    const i = TEST[k], c = tcards[k];
    await until(S(16 + 2 * k));
    const ring = new M.RoundedRectangle({ width: TB.w + 0.14, height: TB.h + 0.14, cornerRadius: 0.13, color: C.amber, strokeWidth: 3.5 });
    ring.moveTo([c.p[0], c.p[1], 0.02]);
    const qMark = T('?', P ? 20 : 18, C.amber, true, true);
    qMark.moveTo([markX(c), c.p[1], 0.025]);
    await play(new M.Create(ring, { runTime: 0.45 }), new M.FadeIn(qMark, { runTime: 0.45 }),
      ...say(lines[k][0], C.amber),
      ...fbox([`${R[i][0]} ${R[i][1]}: ${R[i][2]} h`, [`guess: ${guessCancel(i) ? 'cancel' : 'stay'}`, C.amber], ['real:  ?', C.muted]], C.amber));
    const m = right(i) ? checkLines(c) : crossLines(c);
    tMarkGroups.push(m);
    tMarks.push(...m);
    await until(S(17 + 2 * k));
    await play(new M.FadeOut(ring, { runTime: 0.35 }), new M.FadeOut(qMark, { runTime: 0.35 }),
      new M.FadeIn(glow(c, i), { runTime: 0.45 }), ...m.map(l => new M.Create(l, { runTime: 0.45 })),
      ...say(lines[k][1], right(i) ? C.green : C.pink),
      ...fbox([`${R[i][0]} ${R[i][1]}: ${R[i][2]} h`, `guess: ${guessCancel(i) ? 'cancel' : 'stay'}`,
        [`real:  ${R[i][3] ? 'cancelled' : 'stayed'}`, R[i][3] ? C.pink : C.cyan]], right(i) ? C.green : C.pink));
  }

  // 26-28 score
  const rightTestLines = TEST.flatMap((i, k) => right(i) ? tMarkGroups[k] : []);
  await until(S(26));
  await play(new M.LaggedStart(rightTestLines.map(l => new M.Indicate(l, { color: C.green, runTime: 0.4 })), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('TEST: 4 OF 5 RIGHT', C.green), ...fbox(['test set', ['4 / 5 right', C.green]], C.green));
  await until(S(27));
  await play(...say('4 / 5 = 80 / 100', C.green), ...fbox(['4 / 5', '= 80 / 100'], C.green));
  await until(S(28));
  await play(...say('TEST ACCURACY: 80%', C.green), ...fbox(['hours rule on test', ['accuracy = 80%', C.green]], C.green));

  // 29-32 baseline, then restore hours-rule marks when comparing
  const bMarks = TEST.flatMap((i, k) => R[i][3] ? crossLines(tcards[k], C.pink) : checkLines(tcards[k], C.cyan));
  await until(S(29));
  await play(...tMarks.map(l => new M.FadeOut(l, { runTime: 0.4 })),
    ...say('NOW “ALWAYS STAY” ON THE SAME 5', C.cyan), ...fbox(['baseline:', ['always “stay”', C.cyan]], C.cyan));
  await until(S(30));
  await play(new M.LaggedStart(bMarks.map(l => new M.Create(l, { runTime: 0.25 })), { lagRatio: 0.15, runTime: 1.3 }),
    ...say('RIGHT: BEA, ALI, DINA', C.cyan), ...fbox(['always “stay”', ['right: Bea, Ali, Dina', C.cyan], ['wrong: Chen, Eli', C.pink]], C.cyan));
  await until(S(31));
  await play(...say('3 OF 5 = 60%', C.cyan), ...fbox(['always “stay”', ['3 / 5 = 60%', C.cyan]], C.cyan));
  const tMarks2 = TEST.flatMap((i, k) => right(i) ? checkLines(tcards[k]) : crossLines(tcards[k]));
  await until(S(32));
  await play(...bMarks.map(l => new M.FadeOut(l, { runTime: 0.35 })),
    ...tMarks2.map(l => new M.Create(l, { runTime: 0.5 })),
    ...say('HOURS RULE: 1 MORE RIGHT', C.green),
    ...fbox([['hours rule:    4 / 5', C.green], ['always “stay”: 3 / 5', C.cyan]], C.green));

  // 33-37 training vs test score, generalization
  await until(S(33));
  await play(new M.LaggedStart(trMarks.flat().map(l => new M.Indicate(l, { color: C.cyan, runTime: 0.3 })), { lagRatio: 0.03, runTime: 1.2 }),
    ...say('TRAINING SCORE: MATCHES LEARNING CARDS', C.cyan), ...fbox(['training score', ['14 / 15 (too hopeful)', C.cyan]], C.cyan));
  await until(S(34));
  await play(new M.Indicate(testLab, { color: C.amber, runTime: 1.0 }), ...say('TEST SCORE: A FIRST IDEA FOR NEW CARDS', C.amber),
    ...fbox([['training: 14 / 15', C.cyan], ['test:      4 / 5', C.amber]], C.amber));
  await until(S(35));
  await play(...say('GENERALIZATION = HOW WELL ON NEW CASES', C.violet),
    ...fbox([['generalization', C.violet], 'how well a rule', 'works on new cases'], C.violet));
  await until(S(36));
  await play(new M.Indicate(box, { color: C.amber, runTime: 1.0 }), ...say('5 CARDS = ONLY A ROUGH IDEA', C.muted),
    ...fbox(['test set = 5 cards', ['only a rough idea', C.muted]], C.muted));
  const sameCust = [];
  TRAIN.forEach((i, k) => { if (TEST.some(j => R[j][0] === R[i][0])) sameCust.push(train[k].t1); });
  await until(S(37));
  await play(new M.LaggedStart(sameCust.map(t => new M.Indicate(t, { color: C.violet, runTime: 0.4 })), { lagRatio: 0.06, runTime: 1.6 }),
    new M.LaggedStart(tcards.map(c => new M.Indicate(c.t1, { color: C.violet, runTime: 0.4 })), { lagRatio: 0.1, runTime: 1.2 }),
    ...say('SAME CUSTOMERS ARE ALSO IN TRAINING', C.violet),
    ...fbox(['test names: Bea, Chen,', 'Ali, Dina, Eli', ['all also in training', C.violet]], C.violet));

  // 38-41 trap and summary
  await until(S(38));
  await play(new M.Indicate(tcards[4].t1, { color: C.pink, runTime: 1.0 }), ...say('TRAP: CHANGING THE RULE AFTER ELI', C.pink),
    ...fbox([['watch out:', C.pink], 'changing the rule', 'after seeing Eli'], C.pink));
  const eliRing = new M.RoundedRectangle({ width: TB.w + 0.14, height: TB.h + 0.14, cornerRadius: 0.13, color: C.pink, strokeWidth: 3.5 });
  eliRing.moveTo([tcards[4].p[0], tcards[4].p[1], 0.02]);
  await until(S(39));
  await play(new M.Create(eliRing, { runTime: 0.7 }), ...say('THEN ELI HELPED CHOOSE THE RULE', C.pink),
    ...fbox(['Eli’s card helped choose', ['→ no longer unseen', C.pink]], C.pink));
  await until(S(40));
  await play(new M.FadeOut(eliRing, { runTime: 0.4 }), ...say('NEED FRESH TEST CARDS', C.amber),
    ...fbox(['a fair final check', ['needs fresh test cards', C.amber]], C.amber));
  await until(S(41));
  await play(new M.Indicate(box, { color: C.amber, runTime: 1.0 }), ...say('SET TEST CARDS ASIDE BEFORE LEARNING', C.amber),
    ...fbox(['1. lock test cards away', '2. learn on training', ['3. check the fixed rule', C.amber]], C.amber));
}

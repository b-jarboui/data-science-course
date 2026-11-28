// 3.3.6 Nonresponse bias (live Manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based, 0..42). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 1.78, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.28, 0] : [4.55, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.41 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  const mkDot = (p, r, color, op = 0.92) => {
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, op);
    return d;
  };
  const boxAt = (cx, cy, w, h, color, sw = 2) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: sw });
    r.setFill(color, 0.06);
    r.moveTo([cx, cy, 0]);
    return r;
  };

  // 100-dot layout: laptop = two 10x5 blocks; phone = two 5x10 blocks
  const COLS = P ? 5 : 10, ROWS = P ? 10 : 5;
  const DX0 = P ? 0.56 : 0.36, DX = P ? 0.54 : 0.37, DY = P ? 0.37 : 0.36;
  const GY = P ? -1.05 : -0.10;
  const LCX = P ? -2.02 : CX - 2.15, RCX = P ? 2.02 : CX + 2.15;
  const R_BASE = P ? 0.11 : 0.105, R_DIM = P ? 0.075 : 0.072;
  const R_BRIGHT = P ? 0.12 : 0.115, R_W1 = P ? 0.14 : 0.132, R_W2 = P ? 0.18 : 0.168;

  const rowY = row => GY + (row - (ROWS - 1) / 2) * DY;
  const uniPos = (side, k) => {
    const col = k % COLS, row = Math.floor(k / COLS);
    const x = side === 0
      ? CX - (COLS - 0.5 - col) * DX0
      : CX + (0.5 + col) * DX0;
    return [x, rowY(row), 0];
  };
  const grpPos = (side, k) => {
    const col = k % COLS, row = Math.floor(k / COLS);
    const base = side === 0 ? LCX : RCX;
    return [base + (col - (COLS - 1) / 2) * DX, rowY(row), 0];
  };

  const HEAD_Y = P ? 1.12 : 1.15;
  const SUB_Y = P ? -3.26 : -1.32;
  const NY = P ? -4.55 : -2.42;
  const NX0 = P ? -3.2 : -6.16, NX1 = P ? 3.2 : 1.46;
  const m2x = v => NX0 + ((v - 10) / 40) * (NX1 - NX0);

  // 0: Full university roster
  const rosterW = P ? 6.4 : 7.4, rosterH = P ? 2.8 : 2.1;
  const rosterBox = new M.RoundedRectangle({ width: rosterW, height: rosterH, cornerRadius: 0.22, color: C.green, strokeWidth: 2.5 });
  rosterBox.setFill(C.card, 0.92); rosterBox.moveTo([CX, GY, 0]);
  const rosterT1 = T('FULL UNIVERSITY ROSTER', P ? 24 : 26, C.green, true);
  rosterT1.moveTo([CX, GY + 0.42, 0]);
  const rosterT2 = T('1,000 students enrolled', P ? 20 : 22, C.ink);
  rosterT2.moveTo([CX, GY - 0.25, 0]);
  const rosterGrp = new M.VGroup(rosterBox, rosterT1, rosterT2);
  await until(S(0));
  await play(new M.FadeIn(rosterGrp), ...say('DOING EVERYTHING RIGHT', C.green), ...fbox(['roster = 1,000 students'], C.green));

  // 1: Fair random draw of 100 students
  const shortDots = Array.from({ length: 50 }, (_, k) => mkDot(uniPos(0, k), R_BASE, C.ink, 0.85));
  const longDots = Array.from({ length: 50 }, (_, k) => mkDot(uniPos(1, k), R_BASE, C.ink, 0.85));
  const allDots = [...shortDots, ...longDots];
  await until(S(1));
  await play(
    new M.FadeOut(rosterGrp),
    new M.LaggedStart(allDots.map(d => new M.FadeIn(d)), { lagRatio: 0.015, runTime: 1.8 }),
    ...say('100 CHOSEN AT RANDOM', C.cyan),
    ...fbox(['roster = 1,000 students', ['sample = 100 (random)', C.cyan]])
  );

  // 2: Survey sent by email to all 100
  const envY = HEAD_Y - 0.02;
  const envR = new M.RoundedRectangle({ width: 0.9, height: 0.56, cornerRadius: 0.06, color: C.cyan, strokeWidth: 2 });
  envR.setFill(C.card, 0.95); envR.moveTo([CX - 1.15, envY, 0]);
  const envL1 = new M.Line({ start: [CX - 1.58, envY + 0.25, 0], end: [CX - 1.15, envY - 0.05, 0], color: C.cyan, strokeWidth: 2 });
  const envL2 = new M.Line({ start: [CX - 1.15, envY - 0.05, 0], end: [CX - 0.72, envY + 0.25, 0], color: C.cyan, strokeWidth: 2 });
  const envTxt = T('100 emailed', P ? 20 : 22, C.cyan, true);
  envTxt.moveTo([CX + 0.45, envY, 0]);
  const envGrp = new M.VGroup(envR, envL1, envL2, envTxt);
  const sampleFlash = [0, 11, 24, 37, 49, 55, 68, 79, 88, 99].map(i => new M.Flash(allDots[i], { color: C.cyan }));
  await until(S(2));
  await play(
    new M.FadeIn(envGrp),
    new M.LaggedStart(sampleFlash, { lagRatio: 0.08, runTime: 1.4 }),
    ...say('SURVEY EMAILED TO ALL 100', C.cyan),
    ...fbox(['sample  = 100 students', ['emailed = 100 surveys', C.cyan]])
  );

  // 3: Peek at the 100 students
  const divTop = rowY(ROWS - 1) + 0.35, divBot = rowY(0) - 0.35;
  const divider = new M.DashedLine({ start: [CX, divBot, 0], end: [CX, divTop, 0], color: C.muted });
  await until(S(3));
  await play(
    new M.FadeOut(envGrp),
    new M.Create(divider),
    ...say('PEEKING AT THE 100 STUDENTS', C.amber),
    ...fbox([['peeking at the 100...', C.amber]], C.amber)
  );

  // 4: 50 short-trip students (< 30 min), mean 18
  const sHead = T('SHORT  < 30 min', P ? 19 : 20, C.cyan, true);
  sHead.moveTo([LCX, HEAD_Y, 0]);
  let sSub = T('50 · mean 18 min', P ? 18 : 19, C.cyan, true);
  sSub.moveTo([LCX, SUB_Y, 0]);
  await until(S(4));
  await play(
    new M.LaggedStart(shortDots.map((d, k) => new M.Transform(d, mkDot(grpPos(0, k), R_BASE, C.cyan, 0.92))), { lagRatio: 0.012, runTime: 1.4 }),
    new M.FadeIn(sHead),
    new M.FadeIn(sSub),
    ...say('50 SHORT TRIPS · MEAN 18', C.cyan),
    ...fbox([['short: 50  (mean 18)', C.cyan]])
  );

  // 5: 50 long-trip students (>= 30 min), mean 42
  const lHead = T('LONG  ≥ 30 min', P ? 19 : 20, C.pink, true);
  lHead.moveTo([RCX, HEAD_Y, 0]);
  let lSub = T('50 · mean 42 min', P ? 18 : 19, C.pink, true);
  lSub.moveTo([RCX, SUB_Y, 0]);
  await until(S(5));
  await play(
    new M.LaggedStart(longDots.map((d, k) => new M.Transform(d, mkDot(grpPos(1, k), R_BASE, C.pink, 0.92))), { lagRatio: 0.012, runTime: 1.4 }),
    new M.FadeIn(lHead),
    new M.FadeIn(lSub),
    ...say('50 LONG TRIPS · MEAN 42', C.pink),
    ...fbox([['short: 50  (mean 18)', C.cyan], ['long:  50  (mean 42)', C.pink]])
  );

  // 6: 50 * 18 = 900, 50 * 42 = 2,100
  await until(S(6));
  await play(
    new M.Indicate(sSub, { color: C.cyan }),
    new M.Indicate(lSub, { color: C.pink }),
    ...say('TOTAL MINUTES PER GROUP', C.amber),
    ...fbox([['50 × 18 =   900 min', C.cyan], ['50 × 42 = 2,100 min', C.pink]], C.amber)
  );

  // 7: 3,000 / 100 = 30 minutes (the truth) + number line
  const nline = new M.Line({ start: [NX0, NY, 0], end: [NX1, NY, 0], color: C.muted, strokeWidth: 3 });
  const nticks = new M.VGroup(...[10, 20, 30, 40, 50].map(v => new M.VGroup(
    new M.Line({ start: [m2x(v), NY - 0.08, 0], end: [m2x(v), NY + 0.08, 0], color: C.muted }),
    T(String(v), P ? 19 : 18, C.muted, true).moveTo([m2x(v), NY - (P ? 0.4 : 0.34), 0])
  )));
  const nunit = T('minutes', P ? 17 : 16, C.muted);
  nunit.moveTo([NX1 - (P ? 0.5 : 0.35), NY - (P ? 0.78 : 0.62), 0]);
  const truthLine = new M.DashedLine({ start: [m2x(30), NY - 0.16, 0], end: [m2x(30), NY + 0.46, 0], color: C.amber });
  const truthLab = T('TRUTH 30', P ? 20 : 18, C.amber, true);
  truthLab.moveTo([m2x(30) + (P ? 1.05 : 0.98), NY + 0.42, 0]);
  await until(S(7));
  await play(
    new M.Create(nline),
    new M.FadeIn(nticks),
    new M.FadeIn(nunit),
    new M.Create(truthLine),
    new M.FadeIn(truthLab),
    ...say('TRUE MEAN = 30 MINUTES', C.amber),
    ...fbox(['900 + 2,100 = 3,000', '3,000 ÷ 100 = 30', ['truth = 30 minutes', C.amber]], C.amber)
  );

  // 8: Now the replies arrive (short beat: 1.76s)
  await until(S(8));
  await play(...say('NOW THE REPLIES ARRIVE', C.cyan), ...fbox(['replies arriving...']));

  // 9: Short-trip reply 4/5 = 40 replies (top 10 dim to grey)
  const sSub2 = T('40 of 50 (4/5)', P ? 18 : 19, C.cyan, true);
  sSub2.moveTo([LCX, SUB_Y, 0]);
  await until(S(9));
  await play(
    new M.LaggedStart(shortDots.slice(40).map((d, j) => new M.Transform(d, mkDot(grpPos(0, 40 + j), R_DIM, C.muted, 0.28))), { lagRatio: 0.05, runTime: 1.3 }),
    new M.FadeOut(sSub),
    new M.FadeIn(sSub2),
    ...say('SHORT: 4 OF 5 REPLY = 40', C.cyan),
    ...fbox([['short replies = 40 / 50', C.cyan]])
  );

  // 10: Long-trip reply 2/5 = 20 replies (top 30 dim to grey)
  const lSub2 = T('20 of 50 (2/5)', P ? 18 : 19, C.pink, true);
  lSub2.moveTo([RCX, SUB_Y, 0]);
  await until(S(10));
  await play(
    new M.LaggedStart(longDots.slice(20).map((d, j) => new M.Transform(d, mkDot(grpPos(1, 20 + j), R_DIM, C.muted, 0.28))), { lagRatio: 0.03, runTime: 1.5 }),
    new M.FadeOut(lSub),
    new M.FadeIn(lSub2),
    ...say('LONG: 2 OF 5 REPLY = 20', C.pink),
    ...fbox([['short replies = 40 / 50', C.cyan], ['long  replies = 20 / 50', C.pink]])
  );

  // 11: Why? Busy and tired on crowded bus -> 30 long-trip students silent
  const grpW = (COLS - 1) * DX + 0.48;
  const lSilentCy = (rowY(P ? 4 : 2) + rowY(ROWS - 1)) / 2;
  const lSilentH = (P ? 5 : 2) * DY + 0.42;
  const silentBox = boxAt(RCX, lSilentCy, grpW, lSilentH, C.muted, 2);
  await until(S(11));
  await play(
    new M.Create(silentBox),
    ...say('LONG-TRIP STUDENTS SKIP', C.amber),
    ...fbox([['short: 40 replied', C.cyan], ['long:  30 silent!', C.muted]], C.amber)
  );

  // 12: 60 replies -> response rate 60%
  await until(S(12));
  await play(
    new M.FadeOut(silentBox),
    ...say('RESPONSE RATE = 60%', C.cyan),
    ...fbox(['replies = 40 + 20 = 60', 'chosen  = 100', ['response rate = 60%', C.cyan]])
  );

  // 13: Light up only the dots that replied (2.43s window)
  await until(S(13));
  await play(
    new M.LaggedStart([
      ...shortDots.slice(0, 40).map((d, k) => new M.Transform(d, mkDot(grpPos(0, k), R_BRIGHT, C.cyan, 1.0))),
      ...longDots.slice(0, 20).map((d, k) => new M.Transform(d, mkDot(grpPos(1, k), R_BRIGHT, C.pink, 1.0))),
      ...shortDots.slice(40).map((d, j) => new M.Transform(d, mkDot(grpPos(0, 40 + j), R_DIM, C.muted, 0.18))),
      ...longDots.slice(20).map((d, j) => new M.Transform(d, mkDot(grpPos(1, 20 + j), R_DIM, C.muted, 0.18))),
    ], { lagRatio: 0.008, runTime: 1.3 }),
    ...say('ONLY THE 60 REPLIES', C.amber)
  );

  // 14: Short-trip side bright, long-trip side mostly grey
  const sRepCy = (rowY(0) + rowY(P ? 7 : 3)) / 2, sRepH = (P ? 7 : 3) * DY + 0.42;
  const brightBox = boxAt(LCX, sRepCy, grpW, sRepH, C.cyan, 2.5);
  const greyBox = boxAt(RCX, lSilentCy, grpW, lSilentH, C.muted, 2);
  await until(S(14));
  await play(
    new M.Create(brightBox),
    new M.Create(greyBox),
    ...say('SHORT: BRIGHT · LONG: GREY', C.amber),
    ...fbox([['short: 40 bright', C.cyan], ['long:  30 grey', C.muted]], C.amber)
  );

  // 15: Find the mean of the replies (2.29s window)
  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(brightBox, greyBox)),
    ...say('MEAN OF THE 60 REPLIES', C.amber),
    ...fbox(['mean of 60 replies:'], C.amber)
  );

  // 16: 40 * 18 = 720
  const sCalcBox = boxAt(LCX, sRepCy, grpW, sRepH, C.cyan, 2.5);
  await until(S(16));
  await play(
    new M.Create(sCalcBox),
    ...say('40 × 18 = 720 MINUTES', C.cyan),
    ...fbox([['short: 40 × 18 = 720', C.cyan]])
  );

  // 17: 20 * 42 = 840
  const lRepCy = (rowY(0) + rowY(P ? 3 : 1)) / 2, lRepH = (P ? 3 : 1) * DY + 0.42;
  const lCalcBox = boxAt(RCX, lRepCy, grpW, lRepH, C.pink, 2.5);
  await until(S(17));
  await play(
    new M.FadeOut(sCalcBox),
    new M.Create(lCalcBox),
    ...say('20 × 42 = 840 MINUTES', C.pink),
    ...fbox([['short: 40 × 18 = 720', C.cyan], ['long:  20 × 42 = 840', C.pink]], C.pink)
  );

  // 18: 720 + 840 = 1,560
  await until(S(18));
  await play(
    new M.FadeOut(lCalcBox),
    ...say('TOTAL = 1,560 MINUTES', C.amber),
    ...fbox(['720 + 840', ['= 1,560 minutes', C.amber]], C.amber)
  );

  // 19: 1,560 / 60 = 26 minutes -> survey marker on number line
  const survDot = mkDot([m2x(26), NY, 0], P ? 0.14 : 0.13, C.pink, 1.0);
  const survStem = new M.Line({ start: [m2x(26), NY, 0], end: [m2x(26), NY + 0.42, 0], color: C.pink, strokeWidth: 3 });
  const survLab = T('SURVEY 26', P ? 20 : 18, C.pink, true);
  survLab.moveTo([m2x(26) - (P ? 1.15 : 1.08), NY + 0.42, 0]);
  await until(S(19));
  await play(
    new M.FadeIn(survDot),
    new M.Create(survStem),
    new M.FadeIn(survLab),
    ...say('SURVEY MEAN = 26 MINUTES', C.pink),
    ...fbox(['total   = 1,560 min', 'replies = 60', ['1,560 ÷ 60 = 26 min', C.pink]], C.pink)
  );

  // 20: 26 vs 30 -> 4 minutes too low
  const gapBar = new M.Line({ start: [m2x(26), NY + 0.18, 0], end: [m2x(30), NY + 0.18, 0], color: C.pink, strokeWidth: 5 });
  const gapLab = T('−4 min', P ? 20 : 18, C.pink, true);
  gapLab.moveTo([(m2x(26) + m2x(30)) / 2, NY + (P ? 0.88 : 0.78), 0]);
  await until(S(20));
  await play(
    new M.Create(gapBar),
    new M.FadeIn(gapLab),
    ...say('26 vs 30 · 4 MIN TOO LOW', C.pink),
    ...fbox([['survey = 26 min', C.pink], ['truth  = 30 min', C.amber], ['gap    = −4 min', C.pink]], C.pink)
  );

  // 21: Fair draw, full list, problem came after
  await until(S(21));
  await play(
    new M.Indicate(gapLab, { color: C.amber }),
    ...say('PROBLEM CAME AFTER THE DRAW', C.amber),
    ...fbox([['✓ full roster', C.green], ['✓ fair random draw', C.green], ['✗ unequal replies', C.pink]], C.amber)
  );

  // 22: Nonrespondents differ -> answer leans
  await until(S(22));
  await play(
    new M.Indicate(gapBar, { color: C.pink }),
    new M.Indicate(survDot, { color: C.pink }),
    ...say('SILENT ≠ REPLIED → LEANS', C.pink),
    ...fbox(['silent ≠ replied', ['→ answer leans', C.pink]], C.pink)
  );

  // 23: Name it: nonresponse bias (2.60s window)
  await until(S(23));
  await play(
    ...say('NONRESPONSE BIAS', C.violet),
    ...fbox([['NONRESPONSE BIAS', C.violet], 'result leans away', 'from the truth'], C.violet)
  );

  // 24: Definition of nonresponse
  const sSilentCy = P ? (rowY(8) + rowY(9)) / 2 : rowY(4);
  const sSilentH = (P ? 1 : 0) * DY + 0.42;
  const nrBox1 = boxAt(LCX, sSilentCy, grpW, sSilentH, C.violet, 2);
  const nrBox2 = boxAt(RCX, lSilentCy, grpW, lSilentH, C.violet, 2);
  await until(S(24));
  await play(
    new M.Create(nrBox1),
    new M.Create(nrBox2),
    ...say('NONRESPONSE = CHOSEN, SILENT', C.violet),
    ...fbox([['nonresponse:', C.violet], 'chosen in the draw,', 'did not answer'], C.violet)
  );

  // 25: Repair 1 — follow up (remind or call silent students)
  const remShort = shortDots.slice(40, 45);
  const remLong = longDots.slice(20, 30);
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(nrBox1, nrBox2)),
    new M.LaggedStart([
      ...remShort.map((d, j) => new M.Transform(d, mkDot(grpPos(0, 40 + j), R_BASE, C.green, 0.9))),
      ...remLong.map((d, j) => new M.Transform(d, mkDot(grpPos(1, 20 + j), R_BASE, C.green, 0.9))),
    ], { lagRatio: 0.05, runTime: 1.5 }),
    ...say('FIX 1: FOLLOW UP / REMIND', C.green),
    ...fbox([['Fix 1: follow up', C.green], 'remind or call the', 'silent students'], C.green)
  );

  // 26: Repair 2 — give each reply a weight (reset reminded dots back to silent)
  await until(S(26));
  await play(
    new M.LaggedStart([
      ...remShort.map((d, j) => new M.Transform(d, mkDot(grpPos(0, 40 + j), R_DIM, C.muted, 0.18))),
      ...remLong.map((d, j) => new M.Transform(d, mkDot(grpPos(1, 20 + j), R_DIM, C.muted, 0.18))),
    ], { lagRatio: 0.03, runTime: 1.0 }),
    ...say('FIX 2: WEIGHT EACH REPLY', C.green),
    ...fbox([['Fix 2: give weights', C.green], 'each reply speaks', 'for its group'], C.green)
  );

  // 27: 40 short replies speak for all 50 short students
  const grpH = (ROWS - 1) * DY + 0.50;
  const sAllBox = boxAt(LCX, GY, grpW, grpH, C.cyan, 2.5);
  await until(S(27));
  await play(
    new M.Create(sAllBox),
    ...say('40 REPLIES → 50 STUDENTS', C.cyan),
    ...fbox([['short group:', C.cyan], '40 replies speak', 'for all 50'])
  );

  // 28: Short weight = 50 / 40 = 1.25 (grow short replying dots slightly)
  const sSub3 = T('40 × 1.25 = 50', P ? 18 : 19, C.cyan, true);
  sSub3.moveTo([LCX, SUB_Y, 0]);
  await until(S(28));
  await play(
    new M.LaggedStart(shortDots.slice(0, 40).map((d, k) => new M.Transform(d, mkDot(grpPos(0, k), R_W1, C.cyan, 1.0))), { lagRatio: 0.015, runTime: 1.4 }),
    new M.FadeOut(sSub2),
    new M.FadeIn(sSub3),
    ...say('SHORT WEIGHT = 50 ÷ 40 = 1.25', C.cyan),
    ...fbox([['short weight:', C.cyan], ['50 ÷ 40 = 1.25', C.amber]])
  );

  // 29: 20 long replies speak for all 50 long students
  const lAllBox = boxAt(RCX, GY, grpW, grpH, C.pink, 2.5);
  await until(S(29));
  await play(
    new M.FadeOut(sAllBox),
    new M.Create(lAllBox),
    ...say('20 REPLIES → 50 STUDENTS', C.pink),
    ...fbox([['long group:', C.pink], '20 replies speak', 'for all 50'], C.pink)
  );

  // 30: Long weight = 50 / 20 = 2.5 (grow long replying dots clearly larger)
  const lSub3 = T('20 × 2.5 = 50', P ? 18 : 19, C.pink, true);
  lSub3.moveTo([RCX, SUB_Y, 0]);
  await until(S(30));
  await play(
    new M.LaggedStart(longDots.slice(0, 20).map((d, k) => new M.Transform(d, mkDot(grpPos(1, k), R_W2, C.pink, 1.0))), { lagRatio: 0.03, runTime: 1.4 }),
    new M.FadeOut(lSub2),
    new M.FadeIn(lSub3),
    ...say('LONG WEIGHT = 50 ÷ 20 = 2.5', C.pink),
    ...fbox([['short weight = 1.25', C.cyan], ['long  weight = 2.50', C.pink], ['(50 ÷ 20 = 2.5)', C.amber]], C.pink)
  );

  // 31: Estimate climbs back to 30
  const wLab = T('WEIGHTED 30', P ? 20 : 18, C.green, true);
  wLab.moveTo([m2x(30) - (P ? 1.4 : 1.26), NY + 0.42, 0]);
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(lAllBox, gapBar, gapLab, survStem, survLab)),
    new M.Transform(survDot, mkDot([m2x(30), NY, 0], P ? 0.15 : 0.14, C.green, 1.0)),
    new M.FadeIn(wLab),
    ...say('WEIGHTED ESTIMATE = 30 MIN', C.green),
    ...fbox(['50×18 + 50×42 = 3,000', ['3,000 ÷ 100 = 30 min', C.green]], C.green)
  );

  // 32: Must know which group even silent students belong to
  const needBox1 = boxAt(LCX, sSilentCy, grpW, sSilentH, C.amber, 2.5);
  const needBox2 = boxAt(RCX, lSilentCy, grpW, lSilentH, C.amber, 2.5);
  await until(S(32));
  await play(
    new M.Create(needBox1),
    new M.Create(needBox2),
    ...say('NEED GROUP OF SILENT TOO', C.amber),
    ...fbox([['repair requires:', C.amber], 'know the group of', 'even silent students'], C.amber)
  );

  // 33: Here is the idea in one line (2.56s window)
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(needBox1, needBox2)),
    ...say('THE IDEA IN ONE LINE', C.cyan),
    ...fbox([['the idea in one line', C.cyan]])
  );

  // 34: Reply chance depends on the answer itself
  await until(S(34));
  await play(
    ...say('REPLY CHANCE DEPENDS ON ANSWER', C.violet),
    ...fbox([['nonresponse bias:', C.violet], 'reply chance depends', 'on the answer itself'], C.violet)
  );

  // 35: Everyday words
  await until(S(35));
  await play(
    ...say('SILENT ARE DIFFERENT → LEANS', C.amber),
    ...fbox([['in everyday words:', C.amber], 'silent ≠ replied', '→ result leans'], C.amber)
  );

  // 36: What checking nonresponse is for
  await until(S(36));
  await play(
    new M.Indicate(wLab, { color: C.green }),
    ...say('DO REPLIES SPEAK FOR ALL?', C.green),
    ...fbox([['why check it:', C.green], 'do your replies still', 'speak for everyone?'], C.green)
  );

  // 37: Common trap — big pile of replies looks convincing (100 skewed replies: 75 short + 25 long)
  const BAR_BASE = P ? -3.75 : -2.25;
  const H_BIG = P ? 3.6 : 2.95, BAR_W = P ? 1.55 : 1.65;
  const BX_L = P ? -1.35 : CX - 1.6, BX_R = P ? 2.0 : CX + 2.1;
  const h75 = H_BIG * 0.75, h25 = H_BIG * 0.25;
  const bL1 = new M.Rectangle({ width: BAR_W, height: h75, color: C.cyan, strokeWidth: 2 });
  bL1.setFill(C.cyan, 0.82); bL1.moveTo([BX_L, BAR_BASE + h75 / 2, 0]);
  const bL2 = new M.Rectangle({ width: BAR_W, height: h25, color: C.pink, strokeWidth: 2 });
  bL2.setFill(C.pink, 0.82); bL2.moveTo([BX_L, BAR_BASE + h75 + h25 / 2, 0]);
  const bLTop = T('100 REPLIES', P ? 19 : 20, C.amber, true);
  bLTop.moveTo([BX_L, BAR_BASE + H_BIG + 0.36, 0]);
  const bLMix = T('75 short · 25 long', P ? 19 : 20, C.ink, true);
  bLMix.moveTo([BX_L, BAR_BASE - 0.38, 0]);
  const AX = BX_L - BAR_W / 2 - (P ? 0.55 : 0.7);
  const bFloor = new M.Line({ start: [AX, BAR_BASE, 0], end: [BX_R + 1.2, BAR_BASE, 0], color: C.muted, strokeWidth: 2 });
  const yAxis = new M.Line({ start: [AX, BAR_BASE, 0], end: [AX, BAR_BASE + H_BIG + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const yTicks = [0, 50, 100].map(v => {
    const y = BAR_BASE + H_BIG * v / 100;
    return new M.VGroup(
      new M.Line({ start: [AX - 0.08, y, 0], end: [AX + 0.08, y, 0], color: C.muted }),
      T(String(v), P ? 17 : 18, C.muted, true).moveTo([AX - (P ? 0.36 : 0.4), y, 0])
    );
  });
  const yName = T('replies', P ? 16 : 17, C.muted);
  yName.moveTo([AX - 0.05, BAR_BASE + H_BIG + 0.42, 0]);
  const trapLeft = new M.VGroup(bFloor, yAxis, ...yTicks, yName, bL1, bL2, bLTop, bLMix);

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(...shortDots, ...longDots, divider, sHead, lHead, sSub3, lSub3, nline, nticks, nunit, truthLine, truthLab, survDot, wLab)),
    new M.FadeIn(trapLeft),
    ...say('TRAP: BIG PILE LOOKS SAFE', C.amber),
    ...fbox([['common trap:', C.amber], '100 replies looks', 'big and convincing'], C.amber)
  );

  // 38: What matters most is whether silent people are different
  const bigMean = T('mean = 24 (6 off!)', P ? 21 : 22, C.pink, true);
  bigMean.moveTo([BX_L, BAR_BASE - 0.86, 0]);
  const bigBox = boxAt(BX_L, BAR_BASE + H_BIG / 2, BAR_W + 0.35, H_BIG + 0.32, C.pink, 2.5);
  await until(S(38));
  await play(
    new M.Create(bigBox),
    new M.FadeIn(bigMean),
    ...say('ARE THE SILENT DIFFERENT?', C.pink),
    ...fbox(['75 short + 25 long', ['mean = 24 (6 off!)', C.pink]], C.pink)
  );

  // 39: Fewer replies from right mix (40 replies: 20 short + 20 long -> mean 30) beats big wrong mix
  const H_SM = H_BIG * 0.40, h20 = H_SM * 0.5;
  const bR1 = new M.Rectangle({ width: BAR_W, height: h20, color: C.cyan, strokeWidth: 2 });
  bR1.setFill(C.cyan, 0.82); bR1.moveTo([BX_R, BAR_BASE + h20 / 2, 0]);
  const bR2 = new M.Rectangle({ width: BAR_W, height: h20, color: C.pink, strokeWidth: 2 });
  bR2.setFill(C.pink, 0.82); bR2.moveTo([BX_R, BAR_BASE + h20 + h20 / 2, 0]);
  const bRTop = T('40 REPLIES', P ? 19 : 20, C.green, true);
  bRTop.moveTo([BX_R, BAR_BASE + H_SM + 0.36, 0]);
  const bRMix = T('20 short · 20 long', P ? 19 : 20, C.ink, true);
  bRMix.moveTo([BX_R, BAR_BASE - 0.38, 0]);
  const smMean = T('mean = 30 (truth!)', P ? 21 : 22, C.green, true);
  smMean.moveTo([BX_R, BAR_BASE - 0.86, 0]);
  const rightBox = boxAt(BX_R, BAR_BASE + H_SM / 2, BAR_W + 0.35, H_SM + 0.32, C.green, 2.5);
  const trapRight = new M.VGroup(bR1, bR2, bRTop, bRMix, smMean);
  await until(S(39));
  await play(
    new M.FadeIn(trapRight),
    new M.Create(rightBox),
    ...say('RIGHT MIX BEATS BIG PILE', C.green),
    ...fbox([['100 wrong mix → 24', C.pink], [' 40 right mix → 30', C.green]], C.green)
  );

  // 40: Always ask: who did not reply, and could their answers be different?
  await until(S(40));
  await play(
    new M.Indicate(rightBox, { color: C.amber }),
    ...say('ALWAYS ASK: WHO STAYED SILENT?', C.amber),
    ...fbox([['always ask:', C.amber], '1. who did not reply?', '2. are they different?'], C.amber)
  );

  // 41: Bridge to next lesson (measurement error — are answers accurate?)
  const qDot = mkDot([CX - (P ? 1.5 : 2.1), GY, 0], 0.28, C.cyan, 0.95);
  const qCard = new M.RoundedRectangle({ width: P ? 3.8 : 4.2, height: 1.2, cornerRadius: 0.2, color: C.violet, strokeWidth: 2.5 });
  qCard.setFill(C.card, 0.95); qCard.moveTo([CX + (P ? 0.9 : 0.8), GY, 0]);
  const qTxt = T('reported: ? min', P ? 22 : 24, C.amber, true);
  qTxt.moveTo([CX + (P ? 0.9 : 0.8), GY, 0]);
  const nextGrp = new M.VGroup(qDot, qCard, qTxt);
  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(trapLeft, bigMean, bigBox, trapRight, rightBox)),
    new M.FadeIn(nextGrp),
    ...say('NEXT: ARE ANSWERS RIGHT?', C.violet),
    ...fbox([['next lesson:', C.violet], 'are the reported', 'numbers accurate?'], C.violet)
  );

  // 42: One-sentence recap
  const cardW = P ? 6.0 : 6.4, cardH = P ? 0.92 : 0.84;
  const ys = P ? [0.25, -1.25, -2.75] : [0.68, -0.56, -1.80];
  const makeRow = (y, txt, col) => {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.2, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([CX, y, 0]);
    const t = T(txt, P ? 21 : 22, col, true); t.moveTo([CX, y, 0]);
    return new M.VGroup(r, t);
  };
  const r1 = makeRow(ys[0], '✓  FAIR RANDOM DRAW', C.green);
  const r2 = makeRow(ys[1], '✗  SILENT PEOPLE DIFFER', C.pink);
  const r3 = makeRow(ys[2], '→  RESULT LEANS AWAY', C.amber);
  const p1 = T('+', 24, C.muted, true); p1.moveTo([CX, (ys[0] + ys[1]) / 2, 0]);
  const p2 = T('↓', 24, C.amber, true); p2.moveTo([CX, (ys[1] + ys[2]) / 2, 0]);
  await until(S(42));
  await play(
    new M.FadeOut(nextGrp),
    new M.LaggedStart([new M.FadeIn(r1), new M.FadeIn(p1), new M.FadeIn(r2), new M.FadeIn(p2), new M.FadeIn(r3)], { lagRatio: 0.16, runTime: 1.8 }),
    ...say('FAIR DRAW CAN STILL LEAN', C.amber),
    ...fbox([['fair draw +', C.green], ['different silent', C.pink], ['= leaning result', C.amber]], C.amber)
  );
}

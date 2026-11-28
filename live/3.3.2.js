// 3.3.2 Sampling frames (live manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 1.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.4, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula/info box at a time, at BOXP
  let boxNow = null;
  function setBox(g, wd) {
    const maxw = P ? FW - 1.0 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    g.moveTo(BOXP);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    return setBox(new M.VGroup(r, ...texts), wd);
  }

  // =========================================================================
  // ACT 1 (Sentences 0–12): 1,000 students, permit list, sampling frame, undercoverage
  // =========================================================================
  const COLS = 40, ROWS = 25;
  const GW = P ? 6.8 : 7.4, GH = P ? 4.2 : 3.5;
  const GY = P ? -1.70 : -0.65;
  const gx0 = CX - GW / 2, gy0 = GY - GH / 2;
  const dx = GW / (COLS - 1), dy = GH / (ROWS - 1);
  const dotR = P ? 0.046 : 0.048;
  const gpos = (c, r) => [gx0 + c * dx, gy0 + r * dy, 0];

  const popCols = [];
  for (let c = 0; c < COLS; c++) {
    const col = [];
    for (let r = 0; r < ROWS; r++) {
      const d = new M.Dot({ point: gpos(c, r), radius: dotR, color: C.muted });
      d.setFill(C.muted, 0.7);
      col.push(d);
    }
    popCols.push(new M.VGroup(...col));
  }
  const popPairs = [];
  for (let i = 0; i < COLS; i += 2) popPairs.push([popCols[i], popCols[i + 1]]);

  const popFoot = T('1,000 students', P ? 20 : 19, C.ink, true);
  popFoot.moveTo([CX, gy0 - (P ? 0.45 : 0.36), 0]);

  // 0: Back to our university with one thousand students.
  await until(S(0));
  await play(
    new M.LaggedStart(popPairs.flatMap(pair => pair.map(g => new M.FadeIn(g))), { lagRatio: 0.04, runTime: 1.8 }),
    new M.FadeIn(popFoot),
    ...say('1,000 STUDENTS')
  );

  // 1: We want the mean trip to campus. In real life we would not know it, but we peek: true mean = 30.
  await until(S(1));
  await play(
    ...say('TRUE MEAN = 30 MIN (PEEK)', C.amber),
    ...fbox([
      ['University: 1,000', C.ink],
      ['True mean = 30 min', C.amber],
      ['(hidden in real life)', C.muted]
    ], C.amber)
  );

  // 2: To pick a sample, you need a list of names to pick from.
  await until(S(2));
  await play(
    ...say('NEED A LIST TO PICK FROM', C.cyan),
    ...fbox([
      ['List of names:', C.cyan],
      ['  1. Student ...', C.muted],
      ['  2. Student ...', C.muted],
      ['  3. Student ...', C.muted]
    ], C.cyan)
  );

  // 3: A helper says: I have a list ready. It is the parking-permit list.
  await until(S(3));
  await play(
    ...say('PARKING-PERMIT LIST', C.cyan),
    ...fbox([
      ['Parking-permit list', C.cyan],
      ['  #001  Driver', C.ink],
      ['  #002  Driver', C.ink],
      ['  ...   250 names', C.cyan]
    ], C.cyan)
  );

  // 4: A parking permit is a card that lets a student park a car on campus.
  const cardW = P ? 4.4 : 3.7, cardH = P ? 1.55 : 1.55;
  const cardBg = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  cardBg.setFill(C.card, 0.96); cardBg.moveTo(BOXP);
  const badge = new M.Circle({ radius: 0.34, color: C.cyan, strokeWidth: 2 });
  badge.setFill(C.cyan, 0.22); badge.moveTo([BOXP[0] - cardW / 2 + 0.65, BOXP[1], 0]);
  const badgeP = T('P', 28, C.cyan, true); badgeP.moveTo([BOXP[0] - cardW / 2 + 0.65, BOXP[1], 0]);
  const cardT1 = T('PARKING PERMIT', P ? 19 : 18, C.ink, true);
  cardT1.moveTo([BOXP[0] + 0.35, BOXP[1] + 0.22, 0]);
  const cardT2 = T('Campus car pass', P ? 17 : 16, C.muted);
  cardT2.moveTo([BOXP[0] + 0.35, BOXP[1] - 0.22, 0]);
  const permitCard = new M.VGroup(cardBg, badge, badgeP, cardT1, cardT2);

  await until(S(4));
  await play(...say('PERMIT = CAR PASS ON CAMPUS', C.cyan), ...setBox(permitCard, cardW));

  // 5: Let's light up the students on that list.
  await until(S(5));
  await play(
    ...say('LIGHT UP PERMIT HOLDERS', C.cyan),
    ...fbox([['On permit list:', C.cyan], ['lighting up...', C.muted]], C.cyan)
  );

  // 6: Two hundred and fifty dots light up. Seven hundred and fifty stay grey.
  const litCols = [];
  for (let c = 0; c < 10; c++) {
    const col = [];
    for (let r = 0; r < ROWS; r++) {
      const d = new M.Dot({ point: gpos(c, r), radius: dotR * 1.15, color: C.cyan });
      d.setFill(C.cyan, 0.95);
      col.push(d);
    }
    litCols.push(new M.VGroup(...col));
  }
  const q1X = (gx0 + gx0 + 9 * dx) / 2;
  const q234X = (gx0 + 10 * dx + gx0 + 39 * dx) / 2;
  const footY = gy0 - (P ? 0.45 : 0.36);
  const litFoot = T('250 lit', P ? 19 : 18, C.cyan, true); litFoot.moveTo([q1X, footY, 0]);
  const greyFoot = T('750 grey', P ? 19 : 18, C.muted, true); greyFoot.moveTo([q234X, footY, 0]);

  await until(S(6));
  await play(
    new M.FadeOut(popFoot),
    new M.LaggedStart(litCols.map((g, i) => new M.FadeIn(g)), { lagRatio: 0.08, runTime: 1.5 }),
    new M.LaggedStart(popCols.slice(0, 10).map(g => new M.FadeOut(g)), { lagRatio: 0.08, runTime: 1.5 }),
    new M.FadeIn(litFoot),
    new M.FadeIn(greyFoot),
    ...say('250 LIT · 750 GREY', C.cyan),
    ...fbox([
      ['On permit list:  250', C.cyan],
      ['Stay grey:       750', C.muted],
      ['Total:         1,000', C.ink]
    ], C.cyan)
  );

  // 7: The grey students come by bus, by train, by bike, or on foot.
  const greyBoxW = 29 * dx + 0.24, greyBoxH = GH + 0.22;
  const greyBox = new M.RoundedRectangle({ width: greyBoxW, height: greyBoxH, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 });
  greyBox.setFill(C.muted, 0.06);
  greyBox.moveTo([q234X, GY, 0]);

  await until(S(7));
  await play(
    new M.Create(greyBox),
    ...say('BUS · TRAIN · BIKE · FOOT', C.muted),
    ...fbox([
      ['750 grey students:', C.muted],
      ['  bus · train', C.ink],
      ['  bike · on foot', C.ink]
    ], C.muted)
  );

  // 8: The list you draw your sample from is called the sampling frame.
  const frW = 9 * dx + 0.24, frH = GH + 0.24;
  const frameRect = new M.RoundedRectangle({ width: frW, height: frH, cornerRadius: 0.10, color: C.cyan, strokeWidth: 3.5 });
  frameRect.setFill(C.cyan, 0.07);
  frameRect.moveTo([q1X, GY, 0]);

  await until(S(8));
  await play(
    new M.FadeOut(greyBox),
    new M.Create(frameRect),
    ...say('SAMPLING FRAME', C.cyan),
    ...fbox([
      ['Sampling frame =', C.cyan],
      ['the list you draw', C.ink],
      ['your sample from', C.ink]
    ], C.cyan)
  );

  // 9: Think of it as a picture frame. Only what is inside the frame can appear in the photo.
  const outerFr = new M.RoundedRectangle({ width: frW + 0.16, height: frH + 0.16, cornerRadius: 0.12, color: C.amber, strokeWidth: 2 });
  outerFr.moveTo([q1X, GY, 0]);
  const topTagY = gy0 + GH + (P ? 0.44 : 0.34);
  const inTag = T('IN FRAME', P ? 17 : 16, C.amber, true); inTag.moveTo([q1X, topTagY, 0]);
  const outTag = T('OUTSIDE FRAME', P ? 17 : 16, C.muted, true); outTag.moveTo([q234X, topTagY, 0]);

  await until(S(9));
  await play(
    new M.Create(outerFr),
    new M.FadeIn(inTag),
    new M.FadeIn(outTag),
    ...say('LIKE A PICTURE FRAME', C.amber)
  );

  // 10: Here, the frame holds two hundred and fifty students. The population holds one thousand.
  const popRect = new M.RoundedRectangle({ width: GW + 0.40, height: GH + 0.42, cornerRadius: 0.14, color: C.ink, strokeWidth: 2 });
  popRect.moveTo([CX, GY, 0]);

  await until(S(10));
  await play(
    new M.Create(popRect),
    ...say('FRAME 250 · POPULATION 1,000', C.cyan),
    ...fbox([
      ['Frame:        250', C.cyan],
      ['Population: 1,000', C.ink]
    ], C.cyan)
  );

  // 11: So seven hundred and fifty students can never be chosen. That is three out of every four.
  const qDivs = [10, 20, 30].map(c => {
    const x = gx0 + (c - 0.5) * dx;
    return new M.DashedLine({ start: [x, gy0 - 0.12, 0], end: [x, gy0 + GH + 0.12, 0], color: C.pink });
  });
  const qMarks = [0, 1, 2, 3].map(q => {
    const qx = gx0 + (q * 10 + 4.5) * dx;
    const t = T(q === 0 ? '1/4' : '✗', P ? 19 : 18, q === 0 ? C.cyan : C.pink, true);
    t.moveTo([qx, topTagY, 0]);
    return t;
  });

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(inTag, outTag)),
    ...qDivs.map(l => new M.Create(l)),
    new M.LaggedStart(qMarks.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.0 }),
    ...say('3 OUT OF 4 NEVER CHOSEN', C.pink),
    ...fbox([
      ['Missed: 750 of 1,000', C.pink],
      ['= 3 out of every 4', C.pink],
      ['can never be chosen', C.muted]
    ], C.pink)
  );

  // 12: Leaving people out of the frame is called undercoverage: the list covers too little.
  const missRect = new M.RoundedRectangle({ width: greyBoxW, height: greyBoxH, cornerRadius: 0.10, color: C.pink, strokeWidth: 3 });
  missRect.setFill(C.pink, 0.10);
  missRect.moveTo([q234X, GY, 0]);

  await until(S(12));
  await play(
    new M.Create(missRect),
    ...say('UNDERCOVERAGE', C.pink),
    ...fbox([
      ['Undercoverage:', C.pink],
      ['the frame leaves', C.ink],
      ['people out', C.ink]
    ], C.pink)
  );

  // =========================================================================
  // ACT 2 (Sentences 13–20): Group averages (24 vs 32) and total check = 30
  // =========================================================================
  const LW = P ? 6.4 : 7.3;
  const nx0 = CX - LW / 2;
  const NY = P ? -4.15 : -2.20;
  const m2x = v => nx0 + (v - 15) / 25 * LW;

  const numLine = new M.Line({ start: [nx0, NY, 0], end: [nx0 + LW, NY, 0], color: C.muted, strokeWidth: 3 });
  const nTicks = [15, 20, 25, 30, 35, 40].map(v => new M.VGroup(
    new M.Line({ start: [m2x(v), NY - 0.08, 0], end: [m2x(v), NY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 20 : 18, C.muted, true).moveTo([m2x(v), NY - (P ? 0.38 : 0.34), 0])
  ));
  const minUnit = T('minutes', P ? 18 : 16, C.muted);
  minUnit.moveTo([nx0 + LW - 0.45, NY - 0.68, 0]);

  const topLineY = P ? 0.55 : 1.00;
  const trueLine = new M.DashedLine({ start: [m2x(30), NY, 0], end: [m2x(30), topLineY, 0], color: C.amber });
  const trueTag = T('True mean 30', P ? 18 : 17, C.amber, true);
  trueTag.moveTo([m2x(30), topLineY + (P ? 0.32 : 0.26), 0]);

  // 13: Does it matter? Let's look at the trips of each group.
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(
      ...popCols.slice(10), ...litCols,
      litFoot, greyFoot, frameRect, outerFr, popRect, ...qDivs, ...qMarks, missRect
    )),
    new M.Create(numLine),
    new M.FadeIn(new M.VGroup(...nTicks, minUnit)),
    new M.Create(trueLine),
    new M.FadeIn(trueTag),
    ...say('CHECK EACH GROUP’S TRIPS', C.amber),
    ...fbox([['Whole university:', C.ink], ['True mean = 30 min', C.amber]], C.amber)
  );

  // 14: The students on the permit list take twenty-four minutes, on average.
  const r1Y = P ? -1.45 : -0.35;
  const r2Y = r1Y;   // same stem height: height has no meaning here
  const pin24 = new M.Line({ start: [m2x(24), NY, 0], end: [m2x(24), r1Y, 0], color: C.cyan, strokeWidth: 2.5 });
  const dot24 = new M.Dot({ point: [m2x(24), r1Y, 0], radius: 0.13, color: C.cyan });
  const lab24 = T('Permit (250): 24 min', P ? 19 : 17, C.cyan, true);
  lab24.moveTo([P ? m2x(24) - 0.15 : m2x(24) - 0.55, r1Y + 0.34, 0]);

  await until(S(14));
  await play(
    new M.Create(pin24),
    new M.FadeIn(dot24),
    new M.Flash(dot24, { color: C.cyan }),
    new M.FadeIn(lab24),
    ...say('PERMIT LIST: 24 MIN AVG', C.cyan),
    ...fbox([
      ['On list:  250 students', C.cyan],
      ['Average:   24 minutes', C.cyan]
    ], C.cyan)
  );

  // 15: The students off the list take thirty-two minutes, on average.
  const pin32 = new M.Line({ start: [m2x(32), NY, 0], end: [m2x(32), r2Y, 0], color: C.violet, strokeWidth: 2.5 });
  const dot32 = new M.Dot({ point: [m2x(32), r2Y, 0], radius: 0.13, color: C.violet });
  let lab32;
  if (P) {   // phone: two short lines right of the stem, inside the frame
    const a = T('Off list (750)', 19, C.violet, true), b = T('32 min', 19, C.violet, true);
    a.moveTo([m2x(32) + 0.2 + a.getWidth() / 2, r2Y - 0.4, 0]);
    b.moveTo([m2x(32) + 0.2 + b.getWidth() / 2, r2Y - 0.78, 0]);
    lab32 = new M.VGroup(a, b);
  } else {
    lab32 = T('Off list (750): 32 min', 17, C.violet, true);
    lab32.moveTo([m2x(32) + 0.2 + lab32.getWidth() / 2, r2Y - 0.34, 0]);
  }

  await until(S(15));
  await play(
    new M.Create(pin32),
    new M.FadeIn(dot32),
    new M.Flash(dot32, { color: C.violet }),
    new M.FadeIn(lab32),
    ...say('OFF LIST: 32 MIN AVG', C.violet),
    ...fbox([
      ['On list:  250 → 24 min', C.cyan],
      ['Off list: 750 → 32 min', C.violet]
    ], C.violet)
  );

  // 16: Let's check that these fit the truth.
  await until(S(16));
  await play(
    new M.Indicate(trueTag, { color: C.amber }),
    ...say('CHECK AGAINST TRUE MEAN 30', C.amber),
    ...fbox([['Check the total:', C.amber], ['does it average 30?', C.ink]], C.amber)
  );

  // 17: 250 students × 24 minutes = 6,000 minutes.
  const barY = P ? -0.20 : 0.50;
  const barTotalW = P ? 6.0 : 6.6;
  const barH = P ? 0.56 : 0.48;
  const barX0 = CX - barTotalW / 2;
  const w6k = barTotalW * 0.20;
  const w24k = barTotalW * 0.80;

  const b6k = new M.Rectangle({ width: w6k, height: barH, color: C.cyan, strokeWidth: 2 });
  b6k.setFill(C.cyan, 0.32); b6k.moveTo([barX0 + w6k / 2, barY, 0]);
  const t6k = T('6,000', P ? 18 : 16, C.cyan, true); t6k.moveTo([barX0 + w6k / 2, barY, 0]);
  const barCap = T('Total trip minutes, all students', P ? 17 : 16, C.ink);
  barCap.moveTo([barX0 + barCap.getWidth() / 2, barY + barH / 2 + 0.28, 0]);

  await until(S(17));
  await play(
    new M.FadeIn(b6k),
    new M.FadeIn(t6k),
    new M.FadeIn(barCap),
    ...say('250 × 24 = 6,000 MIN', C.cyan),
    ...fbox([
      ['On list:', C.cyan],
      ['250 × 24 = 6,000 min', C.cyan]
    ], C.cyan)
  );

  // 18: 750 students × 32 minutes = 24,000 minutes.
  const b24k = new M.Rectangle({ width: w24k, height: barH, color: C.violet, strokeWidth: 2 });
  b24k.setFill(C.violet, 0.28); b24k.moveTo([barX0 + w6k + w24k / 2, barY, 0]);
  const t24k = T('24,000 min', P ? 18 : 17, C.violet, true); t24k.moveTo([barX0 + w6k + w24k / 2, barY, 0]);

  await until(S(18));
  await play(
    new M.FadeIn(b24k),
    new M.FadeIn(t24k),
    ...say('750 × 32 = 24,000 MIN', C.violet),
    ...fbox([
      ['On list:  250 × 24 =  6,000', C.cyan],
      ['Off list: 750 × 32 = 24,000', C.violet]
    ], C.violet)
  );

  // 19: Together, 30,000 minutes, shared by 1,000 students. That is 30 minutes each.
  const totOutline = new M.RoundedRectangle({ width: barTotalW + 0.12, height: barH + 0.12, cornerRadius: 0.08, color: C.amber, strokeWidth: 2.5 });
  totOutline.moveTo([CX, barY, 0]);
  const dot30 = new M.Dot({ point: [m2x(30), NY, 0], radius: 0.12, color: C.amber });

  await until(S(19));
  await play(
    new M.Create(totOutline),
    new M.FadeIn(dot30),
    new M.Flash(dot30, { color: C.amber }),
    ...say('30,000 ÷ 1,000 = 30 MIN', C.amber),
    ...fbox([
      ['6,000 + 24,000 = 30,000', C.ink],
      ['30,000 ÷ 1,000 = 30 min', C.amber]
    ], C.amber)
  );

  // 20: So the whole university really does average thirty.
  await until(S(20));
  await play(
    new M.Indicate(trueTag, { color: C.green }),
    ...say('TRUE MEAN = 30 MIN ✓', C.green),
    ...fbox([
      ['Whole university:', C.ink],
      ['1,000 students', C.muted],
      ['True mean = 30 min ✓', C.green]
    ], C.green)
  );

  // =========================================================================
  // ACT 3 (Sentences 21–28): Sampling from permit list, bias, bigger samples
  // =========================================================================
  const miniY = P ? -0.45 : 0.45;
  const miniBox = new M.RoundedRectangle({ width: P ? 3.5 : 3.2, height: 0.62, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5 });
  miniBox.setFill(C.card, 0.95); miniBox.moveTo([m2x(24), miniY, 0]);
  const miniTxt = T('Permit list (250)', P ? 18 : 17, C.cyan, true);
  miniTxt.moveTo([m2x(24), miniY, 0]);
  const miniPermit = new M.VGroup(miniBox, miniTxt);

  // 21: Now picture choosing students fairly, but only from the permit list.
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(pin24, dot24, lab24, pin32, dot32, lab32, b6k, t6k, barCap, b24k, t24k, totOutline, dot30)),
    new M.FadeIn(miniPermit),
    ...say('SAMPLE ONLY FROM PERMIT LIST', C.cyan),
    ...fbox([
      ['Choose fairly, but', C.ink],
      ['only from the', C.ink],
      ['permit list (250)', C.cyan]
    ], C.cyan)
  );

  // 22: Every sample from this list is made of drivers only.
  const rowY = P ? -1.45 : -0.45;
  const drvDots = Array.from({ length: 10 }, (_, k) => {
    const d = new M.Dot({ point: [m2x(24) + (k - 4.5) * 0.30, rowY, 0], radius: 0.09, color: C.cyan });
    d.setFill(C.cyan, 0.95);
    return d;
  });
  const drvLabel = T('10 drivers only', P ? 17 : 16, C.cyan, true);
  drvLabel.moveTo([m2x(24), rowY - 0.32, 0]);

  await until(S(22));
  await play(
    new M.LaggedStart(drvDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.0 }),
    new M.FadeIn(drvLabel),
    ...say('DRIVERS ONLY', C.cyan)
  );

  // 23: So the samples land around twenty-four minutes, not thirty.
  const sVals1 = [22.4, 23.0, 23.4, 23.8, 23.8, 24.0, 24.2, 24.2, 24.6, 25.0, 25.4, 24.0];
  const sStacks1 = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1];
  const dotPos = (v, st) => [m2x(v), NY + 0.28 + st * 0.25, 0];
  const sDots = sVals1.map((v, i) => {
    const d = new M.Dot({ point: dotPos(v, sStacks1[i]), radius: 0.10, color: C.cyan });
    d.setFill(C.cyan, 0.92);
    return d;
  });
  const mark24 = new M.Line({ start: [m2x(24), NY - 0.14, 0], end: [m2x(24), NY + 1.15, 0], color: C.cyan, strokeWidth: 3 });
  const tag24 = T('24', P ? 18 : 17, C.cyan, true);
  tag24.moveTo([m2x(24), NY + 1.35, 0]);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(...drvDots, drvLabel)),
    new M.Create(mark24),
    new M.FadeIn(tag24),
    new M.LaggedStart(sDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('SAMPLES LAND AROUND 24', C.cyan),
    ...fbox([
      ['Sample means:', C.cyan],
      ['land around 24 min', C.cyan],
      ['true mean is 30 min', C.amber]
    ], C.cyan)
  );

  // 24: They miss by about six minutes, again and again.
  const arrowY = P ? -2.25 : -0.60;
  const gapArrow = new M.Arrow({ start: [m2x(30) - 0.06, arrowY, 0], end: [m2x(24) + 0.06, arrowY, 0], color: C.pink, strokeWidth: 3.5 });
  const gapTag = T('−6 min', P ? 20 : 19, C.pink, true);
  gapTag.moveTo([(m2x(24) + m2x(30)) / 2, arrowY + 0.34, 0]);

  await until(S(24));
  await play(
    new M.Create(gapArrow),
    new M.FadeIn(gapTag),
    ...say('MISSES BY ~6 MIN EVERY TIME', C.pink)
  );

  // 25: When a method misses in the same direction again and again, that is called bias.
  await until(S(25));
  await play(
    new M.Indicate(gapArrow, { color: C.pink }),
    new M.Indicate(gapTag, { color: C.pink }),
    ...say('BIAS', C.pink),
    ...fbox([
      ['Bias:', C.pink],
      ['misses in the same', C.ink],
      ['direction again & again', C.ink],
      ['aims at 24, not 30', C.pink]
    ], C.pink)
  );

  // 26: What if we ask more drivers? Fifty, then one hundred, then all two hundred and fifty?
  const moveDots = (vals, stacks) => sDots.map((d, i) => {
    const tgt = new M.Dot({ point: dotPos(vals[i], stacks[i]), radius: 0.10, color: C.cyan });
    tgt.setFill(C.cyan, 0.92);
    return new M.Transform(d, tgt, { runTime: 0.9 });
  });
  const sVals50 = [23.2, 23.5, 23.7, 23.9, 23.9, 24.0, 24.1, 24.1, 24.3, 24.5, 24.8, 24.0];
  const sSt50 = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1];
  const sVals100 = [23.6, 23.8, 23.8, 23.9, 23.9, 24.0, 24.0, 24.1, 24.1, 24.2, 24.4, 24.0];
  const sSt100 = [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 2];
  const sVals250 = Array(12).fill(24.0);
  const sSt250 = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

  await until(S(26));
  await play(
    ...moveDots(sVals50, sSt50),
    ...say('MORE DRIVERS: 50 → 100 → 250', C.cyan),
    ...fbox([
      ['Ask more drivers:', C.cyan],
      ['  n = 50  → ~23.2–24.8', C.ink]
    ], C.cyan)
  );
  await play(
    ...moveDots(sVals100, sSt100),
    ...fbox([
      ['  n = 50  → ~23.2–24.8', C.muted],
      ['  n = 100 → ~23.6–24.4', C.cyan]
    ], C.cyan)
  );
  await play(
    ...moveDots(sVals250, sSt250),
    ...fbox([
      ['  n = 50  → ~23.2–24.8', C.muted],
      ['  n = 100 → ~23.6–24.4', C.muted],
      ['  n = 250 → exact 24.0', C.cyan]
    ], C.cyan)
  );

  // 27: The answer gets steadier, but it settles at twenty-four. Never at thirty.
  const settleDot = new M.Dot({ point: [m2x(24), NY, 0], radius: 0.13, color: C.cyan });
  await until(S(27));
  await play(
    new M.FadeIn(settleDot),
    new M.Flash(settleDot, { color: C.cyan }),
    new M.Indicate(gapArrow, { color: C.pink }),
    ...say('SETTLES AT 24 — NEVER 30', C.pink),
    ...fbox([
      ['Steadier, yes:', C.ink],
      ['settles at 24 min', C.cyan],
      ['still 6 min off 30', C.pink]
    ], C.pink)
  );

  // 28: A bigger sample cannot reach students who are not on the list.
  await until(S(28));
  await play(
    new M.Indicate(miniPermit, { color: C.pink }),
    ...say('BIGGER SAMPLE ≠ FULL FRAME', C.pink),
    ...fbox([
      ['A bigger sample', C.ink],
      ['cannot reach people', C.pink],
      ['missing from the list', C.pink]
    ], C.pink)
  );

  // =========================================================================
  // ACT 4 (Sentences 29–38): Summary, purpose, trap, full roster, recap
  // =========================================================================

  // 29: Here is the idea in one line.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(
      numLine, ...nTicks, minUnit, trueLine, trueTag,
      miniPermit, mark24, tag24, ...sDots, gapArrow, gapTag, settleDot
    )),
    ...clearBox(),
    ...say('THE IDEA IN ONE LINE', C.cyan)
  );

  // 30: Population, then frame, then sample. The frame should cover the whole population.
  const stepSpecs = [
    ['Population', '1,000 students', C.ink],
    ['Frame', 'the list', C.cyan],
    ['Sample', 'who you ask', C.green]
  ];
  const sbW = P ? 4.8 : 2.15, sbH = P ? 1.05 : 1.30;
  const stepPos = P
    ? [[0, 0.35, 0], [0, -1.50, 0], [0, -3.35, 0]]
    : [[CX - 2.65, -0.45, 0], [CX, -0.45, 0], [CX + 2.65, -0.45, 0]];
  const stepBoxes = stepSpecs.map(([h1, h2, col], i) => {
    const p = stepPos[i];
    const r = new M.RoundedRectangle({ width: sbW, height: sbH, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const t1 = T(h1, P ? 24 : 21, col, true); t1.moveTo([p[0], p[1] + 0.19, 0]);
    const t2 = T(h2, P ? 18 : 15, C.muted); t2.moveTo([p[0], p[1] - 0.22, 0]);
    return new M.VGroup(r, t1, t2);
  });
  const stepArrows = [0, 1].map(i => {
    const a = stepPos[i], b = stepPos[i + 1];
    return P
      ? new M.Arrow({ start: [0, a[1] - sbH / 2 - 0.08, 0], end: [0, b[1] + sbH / 2 + 0.08, 0], color: C.muted, strokeWidth: 3 })
      : new M.Arrow({ start: [a[0] + sbW / 2 + 0.06, a[1], 0], end: [b[0] - sbW / 2 - 0.06, b[1], 0], color: C.muted, strokeWidth: 3 });
  });

  await until(S(30));
  await play(
    new M.LaggedStart([
      new M.FadeIn(stepBoxes[0]),
      new M.Create(stepArrows[0]),
      new M.FadeIn(stepBoxes[1]),
      new M.Create(stepArrows[1]),
      new M.FadeIn(stepBoxes[2])
    ], { lagRatio: 0.25, runTime: 2.0 }),
    ...say('POPULATION → FRAME → SAMPLE', C.cyan),
    ...fbox([
      ['Population → Frame → Sample', C.cyan],
      ['Frame should cover the', C.ink],
      ['whole population', C.green]
    ], C.green)
  );

  // 31: In everyday words: before you choose anyone, check who is on your list.
  await until(S(31));
  await play(
    new M.Indicate(stepBoxes[1], { color: C.amber }),
    ...say('CHECK WHO IS ON YOUR LIST', C.amber),
    ...fbox([
      ['Before you pick anyone:', C.amber],
      ['check who is on', C.ink],
      ['your list', C.amber]
    ], C.amber)
  );

  // 32: This is what thinking about the frame is for: it shows who your answer can speak for.
  await until(S(32));
  await play(
    new M.Indicate(stepBoxes[1], { color: C.green }),
    new M.Indicate(stepBoxes[2], { color: C.green }),
    ...say('WHO YOUR ANSWER SPEAKS FOR', C.green),
    ...fbox([
      ['What it is for:', C.green],
      ['shows who your answer', C.ink],
      ['can speak for', C.green]
    ], C.green)
  );

  // 33: A permit-list survey can tell you about drivers. It cannot tell you about the whole university.
  const vcW = P ? 6.4 : 6.4, vcH = P ? 1.30 : 1.15;
  const makeVerdict = (y, col, head, sub) => {
    const r = new M.RoundedRectangle({ width: vcW, height: vcH, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo([CX, y, 0]);
    const t1 = T(head, P ? 23 : 21, col, true); t1.moveTo([CX, y + 0.22, 0]);
    const t2 = T(sub, P ? 18 : 17, C.muted); t2.moveTo([CX, y - 0.24, 0]);
    return new M.VGroup(r, t1, t2);
  };
  const vYes = makeVerdict(P ? -0.45 : 0.25, C.green, '✓  Drivers (250)', 'Permit list can speak for them');
  const vNo = makeVerdict(P ? -2.35 : -1.35, C.pink, '✗  Whole university (1,000)', 'Cannot speak for everyone');

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...stepBoxes, ...stepArrows)),
    new M.FadeIn(vYes),
    new M.FadeIn(vNo),
    ...say('DRIVERS YES · ALL 1,000 NO', C.amber),
    ...fbox([
      ['Permit-list survey:', C.ink],
      ['  ✓ speaks for drivers', C.green],
      ['  ✗ not all 1,000', C.pink]
    ], C.amber)
  );

  // 34: Here is a common trap. A list feels complete just because it is long and official.
  const trW = P ? 5.2 : 4.8, trH = P ? 3.5 : 2.9, trY = P ? -1.60 : -0.55;
  const trBg = new M.RoundedRectangle({ width: trW, height: trH, cornerRadius: 0.16, color: C.muted, strokeWidth: 2.5 });
  trBg.setFill(C.card, 0.95); trBg.moveTo([CX, trY, 0]);
  const trHead = T('OFFICIAL PERMIT LIST', P ? 20 : 19, C.ink, true);
  trHead.moveTo([CX, trY + trH / 2 - 0.42, 0]);
  const trLines = [0, 1, 2, 3, 4].map(k => {
    const ly = trY + trH / 2 - 0.95 - k * (P ? 0.42 : 0.34);
    return new M.Line({ start: [CX - trW / 2 + 0.5, ly, 0], end: [CX + trW / 2 - 0.5, ly, 0], color: C.line, strokeWidth: 3 });
  });
  const trBadge = pill('250 NAMES · FEELS COMPLETE', C.pink, P ? 16 : 15);
  trBadge.moveTo([CX, trY - trH / 2 + 0.45, 0]);
  const trapCard = new M.VGroup(trBg, trHead, ...trLines, trBadge);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(vYes, vNo)),
    new M.FadeIn(trapCard),
    ...say('TRAP: LONG ≠ COMPLETE', C.pink),
    ...fbox([
      ['Common trap:', C.pink],
      ['long & official does', C.ink],
      ['not mean complete', C.pink]
    ], C.pink)
  );

  // 35: Always ask: who is not on this list, and could they be different?
  await until(S(35));
  await play(
    new M.Indicate(trBadge, { color: C.amber }),
    ...say('WHO IS MISSING? DIFFERENT?', C.amber),
    ...fbox([
      ['Always ask:', C.amber],
      ['1. Who is missing?', C.ink],
      ['2. Could they differ?', C.ink]
    ], C.amber)
  );

  // 36: A better frame here is the full enrolment roster, with all one thousand students.
  const rW = P ? 6.4 : 6.8, rH = P ? 3.2 : 2.6, rY = P ? -1.65 : -0.60;
  const qW = (rW - 0.55) / 4, qH = rH - 0.50;
  const qTiles = [0, 1, 2, 3].map(q => {
    const qx = CX - rW / 2 + 0.20 + qW / 2 + q * (qW + 0.05);
    const tile = new M.RoundedRectangle({ width: qW - 0.08, height: qH, cornerRadius: 0.10, color: C.green, strokeWidth: 1.5 });
    tile.setFill(C.green, 0.22); tile.moveTo([qx, rY, 0]);
    const qt = T('250', P ? 20 : 19, C.green, true); qt.moveTo([qx, rY, 0]);
    return new M.VGroup(tile, qt);
  });
  const fullFrame = new M.RoundedRectangle({ width: rW + 0.12, height: rH + 0.12, cornerRadius: 0.16, color: C.green, strokeWidth: 3.5 });
  fullFrame.moveTo([CX, rY, 0]);
  const fullLabel = T('FULL ENROLMENT ROSTER: 1,000', P ? 18 : 17, C.green, true);
  fullLabel.moveTo([CX, rY + rH / 2 + 0.36, 0]);

  await until(S(36));
  await play(
    new M.FadeOut(trapCard),
    new M.Create(fullFrame),
    new M.FadeIn(fullLabel),
    new M.LaggedStart(qTiles.map(g => new M.FadeIn(g)), { lagRatio: 0.14, runTime: 1.1 }),
    ...say('FULL ENROLMENT ROSTER: 1,000', C.green),
    ...fbox([
      ['Better frame:', C.green],
      ['Full enrolment roster', C.ink],
      ['All 1,000 covered (4/4)', C.green]
    ], C.green)
  );

  // 37: In the next lesson, we will learn a fair way to pick students from that roster.
  const fairCoords = [
    [-0.38, 0.28], [-0.30, -0.22], [-0.14, 0.12], [-0.08, -0.30], [0.04, 0.30],
    [0.12, -0.10], [0.22, 0.22], [0.28, -0.26], [0.38, 0.08], [0.40, -0.18]
  ];
  const fairDots = fairCoords.map(([fx, fy]) => {
    const d = new M.Dot({ point: [CX + fx * rW, rY + fy * qH, 0], radius: 0.11, color: C.amber });
    d.setFill(C.amber, 0.98);
    return d;
  });

  await until(S(37));
  await play(
    new M.LaggedStart(fairDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('NEXT: FAIR RANDOM SAMPLING', C.amber),
    ...fbox([
      ['Next lesson:', C.amber],
      ['a fair way to pick', C.ink],
      ['from all 1,000 students', C.green]
    ], C.amber)
  );

  // 38: In one sentence: your sample can only speak for the people your list includes.
  await until(S(38));
  await play(
    new M.Indicate(fullFrame, { color: C.green }),
    ...say('SPEAKS ONLY FOR YOUR LIST', C.green),
    ...fbox([
      ['Remember:', C.green],
      ['Your sample can only', C.ink],
      ['speak for the people', C.ink],
      ['your list includes.', C.green]
    ], C.green)
  );
}

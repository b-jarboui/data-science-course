// 10.2.12 Influential observations: which listing moves the line?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);

  // Exact shared data from chapters/10.2.md (cards A–M)
  const CARDS = [
    { id: 'A', x: 40, y: 980,  n: 'Cedar',   dx: 0 },
    { id: 'B', x: 40, y: 1000, n: 'Cedar',   dx: -1 },
    { id: 'C', x: 40, y: 1000, n: 'Station', dx: 1 },
    { id: 'D', x: 40, y: 1020, n: 'Station', dx: 0 },
    { id: 'E', x: 50, y: 1060, n: 'Cedar',   dx: 0 },
    { id: 'F', x: 50, y: 1100, n: 'Cedar',   dx: -1 },
    { id: 'G', x: 50, y: 1100, n: 'Station', dx: 1 },
    { id: 'H', x: 50, y: 1140, n: 'Station', dx: 0 },
    { id: 'I', x: 60, y: 1320, n: 'Cedar',   dx: 0 },
    { id: 'J', x: 60, y: 1400, n: 'Cedar',   dx: -1 },
    { id: 'K', x: 60, y: 1400, n: 'Cedar',   dx: 1 },
    { id: 'L', x: 60, y: 1480, n: 'Cedar',   dx: 0 },
    { id: 'M', x: 60, y: 1800, n: 'Cedar',   dx: 0 },
  ];

  // Exact OLS straight-line fits (all 13 vs without M)
  const fullHat = a => (34700 + 7100 * ((a - 50) / 10)) / 29;   // 951.72, 1196.55, 1441.38
  const noMHat  = a => (3500 / 3) + 200 * ((a - 50) / 10);       // 966.67, 1166.67, 1366.67

  // Responsive layout: laptop (14.22 x 8, y in [-3.0, 2.3]) vs phone (8 x 14.22, y in [-5.5, 4.3])
  const AX0 = P ? -2.45 : -5.50;
  const AX1 = P ?  3.45 :  1.40;
  const AY0 = P ? -4.55 : -2.30;
  const AY1 = P ?  1.15 :  1.25;
  const CX  = (AX0 + AX1) / 2;
  const PILL = P ? [0, 1.95, 0] : [CX, 1.88, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.45, -0.35, 0];
  const DX   = P ? 0.17 : 0.18;
  const DR   = P ? 0.105 : 0.095;

  const xOf = area => AX0 + ((area - 35) / 30) * (AX1 - AX0);
  const yOf = rent => AY0 + ((rent - 880) / 1000) * (AY1 - AY0);
  const pt  = (area, rent, dx = 0) => [xOf(area) + dx * DX, yOf(rent), 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one at a time, never over the data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.37 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.25;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Helper to build one glowing listing marker (Cedar = cyan circle, Station = amber square)
  function makeCard(c) {
    const p = pt(c.x, c.y, c.dx);
    const col = c.n === 'Cedar' ? C.cyan : C.amber;
    const halo = new M.Dot({ point: p, radius: DR * 2.2, color: col });
    halo.setFill(col, 0.16);
    let mark;
    if (c.n === 'Cedar') {
      mark = new M.Dot({ point: p, radius: DR, color: col });
      mark.setFill(col, 0.95);
    } else {
      mark = new M.Rectangle({ width: DR * 1.85, height: DR * 1.85, color: col, strokeWidth: 1.5 });
      mark.setFill(col, 0.95);
      mark.moveTo(p);
    }
    return { c, p, col, halo, mark, group: new M.VGroup(halo, mark) };
  }

  // 0: Imagine one asking rent looks unusually high on your apartment chart.
  const teaserDots = CARDS.slice(0, 12).map(c => {
    const d = new M.Dot({ point: pt(c.x, c.y, c.dx), radius: DR * 0.95, color: C.muted });
    d.setFill(C.muted, 0.55);
    return d;
  });
  const mPos = pt(60, 1800, 0);
  const teaserHalo = new M.Dot({ point: mPos, radius: DR * 2.8, color: C.pink });
  teaserHalo.setFill(C.pink, 0.22);
  const teaserM = new M.Dot({ point: mPos, radius: DR * 1.2, color: C.pink });
  teaserM.setFill(C.pink, 1);
  const teaserRing = new M.Circle({ radius: DR * 2.1, color: C.pink, strokeWidth: 2.5 });
  teaserRing.setFill(C.pink, 0.08); teaserRing.moveTo(mPos);
  const teaserLbl = T('high rent?', P ? 17 : 18, C.pink, true);
  teaserLbl.moveTo([mPos[0] - 1.15, mPos[1], 0]);
  await until(S(0));
  await play(
    new M.LaggedStart(teaserDots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.FadeIn(teaserHalo), new M.FadeIn(teaserM), new M.Create(teaserRing), new M.FadeIn(teaserLbl),
    new M.Flash(teaserM, { color: C.pink }),
    ...say('ONE UNUSUALLY HIGH RENT', C.pink)
  );

  // 1: How can you tell whether that listing changes the rent rule much?
  const teaserLine1 = new M.DashedLine({ start: [xOf(37), yOf(fullHat(37)), 0], end: [xOf(63), yOf(fullHat(63)), 0], color: C.cyan, strokeWidth: 3 });
  const teaserLine2 = new M.DashedLine({ start: [xOf(37), yOf(noMHat(37)), 0], end: [xOf(63), yOf(noMHat(63)), 0], color: C.amber, strokeWidth: 3 });
  await until(S(1));
  await play(
    new M.Create(teaserLine1, { runTime: 0.9 }),
    new M.Create(teaserLine2, { runTime: 0.9 }),
    ...say('DOES IT MOVE THE RENT RULE?', C.amber)
  );

  // 2: Put floor area along the bottom and monthly rent up the side.
  const xAxis = new M.Line({ start: [AX0, AY0, 0], end: [AX1, AY0, 0], color: C.muted, strokeWidth: 2.5 });
  const yAxis = new M.Line({ start: [AX0, AY0, 0], end: [AX0, AY1, 0], color: C.muted, strokeWidth: 2.5 });
  const gridParts = [];
  for (const r of [1000, 1200, 1400, 1600, 1800]) {
    const yy = yOf(r);
    const gl = new M.Line({ start: [AX0, yy, -0.01], end: [AX1, yy, -0.01], color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.45);
    const tk = new M.Line({ start: [AX0 - 0.08, yy, 0], end: [AX0, yy, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(r.toLocaleString('en-US'), P ? 14 : 15, C.muted, true);
    lb.moveTo([AX0 - 0.54, yy, 0]);
    gridParts.push(gl, tk, lb);
  }
  for (const a of [40, 50, 60]) {
    const xx = xOf(a);
    const tk = new M.Line({ start: [xx, AY0 - 0.08, 0], end: [xx, AY0, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(a), P ? 16 : 16, C.muted, true);
    lb.moveTo([xx, AY0 - 0.27, 0]);
    gridParts.push(tk, lb);
  }
  const xTitle = T('floor area (m²)', P ? 16 : 16, C.ink);
  xTitle.moveTo([CX, AY0 - 0.58, 0]);
  const yTitle = T('rent ($)', P ? 16 : 16, C.ink);
  yTitle.moveTo([AX0 + 0.20, AY1 + 0.24, 0]);
  const axesGroup = new M.VGroup(...gridParts, xTitle, yTitle);

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...teaserDots, teaserHalo, teaserM, teaserRing, teaserLbl, teaserLine1, teaserLine2), { runTime: 0.5 }),
    new M.Create(xAxis, { runTime: 0.9 }),
    new M.Create(yAxis, { runTime: 0.9 }),
    new M.FadeIn(axesGroup, { runTime: 0.9 }),
    ...say('FLOOR AREA  VS  MONTHLY RENT', C.cyan)
  );

  // 3: The chart shows thirteen listings at three sizes.
  const cards = CARDS.map(makeCard);
  const legY = AY1 - 0.18;
  const legDot = new M.Dot({ point: [AX0 + 0.42, legY, 0], radius: 0.08, color: C.cyan });
  legDot.setFill(C.cyan, 0.95);
  const legCedar = T('Cedar', P ? 14 : 15, C.cyan);
  legCedar.moveTo([AX0 + 0.92, legY, 0]);
  const legSq = new M.Rectangle({ width: 0.15, height: 0.15, color: C.amber, strokeWidth: 1.5 });
  legSq.setFill(C.amber, 0.95); legSq.moveTo([AX0 + 1.68, legY, 0]);
  const legSta = T('Station', P ? 14 : 15, C.amber);
  legSta.moveTo([AX0 + 2.28, legY, 0]);
  const legend = new M.VGroup(legDot, legCedar, legSq, legSta);

  await until(S(3));
  await play(
    new M.LaggedStart(cards.map(k => new M.FadeIn(k.group)), { lagRatio: 0.08, runTime: 1.6 }),
    new M.FadeIn(legend, { runTime: 0.9 }),
    ...say('13 LISTINGS AT 40, 50, 60 m²', C.cyan)
  );

  // 4: The card marked M stands high above the other large apartments.
  const mRing = new M.Circle({ radius: DR * 2.15, color: C.pink, strokeWidth: 3 });
  mRing.setFill(C.pink, 0.08); mRing.moveTo(mPos);
  const mTag = T('M', P ? 20 : 21, C.pink, true, true);
  mTag.moveTo([mPos[0] - 0.45, mPos[1], 0]);

  await until(S(4));
  await play(
    new M.Create(mRing, { runTime: 0.8 }),
    new M.FadeIn(mTag, { runTime: 0.6 }),
    new M.Flash(cards[12].mark, { color: C.pink }),
    new M.LaggedStart(cards.slice(8, 12).map(k => new M.Indicate(k.group, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.2 }),
    ...say('CARD M STANDS HIGH ABOVE', C.pink)
  );

  // 5: It asks one thousand eight hundred dollars for sixty square metres.
  const guideX = new M.DashedLine({ start: [mPos[0], AY0, -0.005], end: [mPos[0], mPos[1] - DR * 2.2, -0.005], color: C.pink, strokeWidth: 2 });
  const guideY = new M.DashedLine({ start: [AX0, mPos[1], -0.005], end: [mPos[0] - DR * 2.2, mPos[1], -0.005], color: C.pink, strokeWidth: 2 });
  const mLongTag = T('60 m², $1,800', P ? 16 : 17, C.pink, true);
  mLongTag.moveTo([xOf(51.5), yOf(1800) + 0.26, 0]);

  await until(S(5));
  await play(
    new M.Create(guideX, { runTime: 0.8 }),
    new M.Create(guideY, { runTime: 0.8 }),
    new M.FadeIn(mLongTag, { runTime: 0.7 }),
    ...say('M = $1,800 AT 60 m²', C.pink)
  );

  // 6: Draw a straight line fitted to all thirteen listings.
  const lineFull = new M.Line({ start: [xOf(37), yOf(fullHat(37)), 0], end: [xOf(63), yOf(fullHat(63)), 0], color: C.cyan, strokeWidth: 3.5 });
  const tagFull = T('all 13', P ? 15 : 16, C.cyan, true);
  tagFull.moveTo([xOf(55.2), yOf(1455), 0]);

  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(guideX, guideY, mLongTag), { runTime: 0.5 }),
    new M.Create(lineFull, { runTime: 1.2 }),
    new M.FadeIn(tagFull, { runTime: 0.7 }),
    ...say('FULL LINE: ALL 13 LISTINGS', C.cyan)
  );

  // 7: Temporarily cover card M, like taking one slip of paper off a noticeboard.
  const coverBox = new M.RoundedRectangle({ width: 0.56, height: 0.56, cornerRadius: 0.1, color: C.pink, strokeWidth: 2 });
  coverBox.setFill(C.bg, 0.82); coverBox.moveTo(mPos);
  const coverX1 = new M.Line({ start: [mPos[0] - 0.16, mPos[1] - 0.16, 0.01], end: [mPos[0] + 0.16, mPos[1] + 0.16, 0.01], color: C.pink, strokeWidth: 3 });
  const coverX2 = new M.Line({ start: [mPos[0] - 0.16, mPos[1] + 0.16, 0.01], end: [mPos[0] + 0.16, mPos[1] - 0.16, 0.01], color: C.pink, strokeWidth: 3 });
  const coverM = new M.VGroup(coverBox, coverX1, coverX2);

  await until(S(7));
  cards[12].mark.setFill(C.cyan, 0.25);
  cards[12].halo.setFill(C.cyan, 0.04);
  await play(
    new M.FadeIn(coverM, { runTime: 0.8 }),
    ...say('TEMPORARILY COVER CARD M', C.pink)
  );

  // 8: Fit a second straight line to the twelve remaining cards.
  let lineNoM = new M.DashedLine({ start: [xOf(37), yOf(noMHat(37)), 0], end: [xOf(63), yOf(noMHat(63)), 0], color: C.amber, strokeWidth: 3.5 });
  let tagNoM = T('without M', P ? 15 : 16, C.amber, true);
  tagNoM.moveTo([xOf(55.2), yOf(1155), 0]);

  await until(S(8));
  lineFull.setStrokeOpacity(0.35);
  await play(
    new M.Create(lineNoM, { runTime: 1.2 }),
    new M.FadeIn(tagNoM, { runTime: 0.7 }),
    ...say('SECOND LINE: 12 REMAINING CARDS', C.amber)
  );

  // 9: Display both lines together so you can compare their heights.
  await until(S(9));
  lineFull.setStrokeOpacity(1);
  await play(
    new M.Indicate(lineFull, { color: C.cyan, runTime: 0.9 }),
    new M.Indicate(lineNoM, { color: C.amber, runTime: 0.9 }),
    ...fbox([
      'compare both lines',
      ['cyan:  all 13 cards', C.cyan],
      ['amber: without M', C.amber],
    ], C.cyan),
    ...say('COMPARE BOTH FITTED LINES', C.cyan)
  );

  // 10: At sixty square metres, the full line predicts about one thousand four hundred and forty-one dollars.
  const p60Full = [xOf(60), yOf(fullHat(60)), 0.01];
  const dot60Full = new M.Dot({ point: p60Full, radius: DR * 1.15, color: C.cyan });
  dot60Full.setFill(C.cyan, 1);

  await until(S(10));
  await play(
    new M.FadeIn(dot60Full, { runTime: 0.6 }),
    new M.Flash(dot60Full, { color: C.cyan }),
    ...fbox([
      'at 60 m²:',
      ['full line  ≈ $1,441', C.cyan],
    ], C.cyan),
    ...say('AT 60 m²: FULL LINE ≈ $1,441', C.cyan)
  );

  // 11: Without M, it predicts about one thousand three hundred and sixty-seven dollars.
  const p60NoM = [xOf(60), yOf(noMHat(60)), 0.01];
  const dot60NoM = new M.Dot({ point: p60NoM, radius: DR * 1.15, color: C.amber });
  dot60NoM.setFill(C.amber, 1);

  await until(S(11));
  await play(
    new M.FadeIn(dot60NoM, { runTime: 0.6 }),
    new M.Flash(dot60NoM, { color: C.amber }),
    ...fbox([
      'at 60 m²:',
      ['full line  ≈ $1,441', C.cyan],
      ['without M  ≈ $1,367', C.amber],
    ], C.amber),
    ...say('WITHOUT M ≈ $1,367', C.amber)
  );

  // 12: Using the unrounded predictions, the drop is about seventy-five dollars.
  const gap60 = new M.Line({ start: p60Full, end: p60NoM, color: C.pink, strokeWidth: 5 });
  const lbl60 = T('↓ $75', P ? 16 : 17, C.pink, true, true);
  lbl60.moveTo([xOf(63) + 0.12 + lbl60.getWidth() / 2, yOf((fullHat(60) + noMHat(60)) / 2), 0]);

  await until(S(12));
  await play(
    new M.Create(gap60, { runTime: 0.7 }),
    new M.FadeIn(lbl60, { runTime: 0.7 }),
    ...fbox([
      'at 60 m²:',
      ['full:   1,441.38', C.cyan],
      ['no M:   1,366.67', C.amber],
      ['drop:    −$74.71 (≈ $75)', C.pink],
    ], C.pink),
    ...say('DROP AT 60 m² ≈ $75', C.pink)
  );

  // 13: Look at the two lines at the other sizes too.
  const vGuide50 = new M.DashedLine({ start: [xOf(50), AY0, -0.01], end: [xOf(50), yOf(1280), -0.01], color: C.violet, strokeWidth: 1.5 });
  const vGuide40 = new M.DashedLine({ start: [xOf(40), AY0, -0.01], end: [xOf(40), yOf(1080), -0.01], color: C.violet, strokeWidth: 1.5 });

  await until(S(13));
  await play(
    new M.Create(vGuide50, { runTime: 0.6 }),
    new M.Create(vGuide40, { runTime: 0.6 }),
    ...say('CHECK THE OTHER SIZES TOO', C.violet)
  );

  // 14: At fifty square metres, the line also drops when M is removed.
  const p50Full = [xOf(50), yOf(fullHat(50)), 0.01];
  const p50NoM  = [xOf(50), yOf(noMHat(50)), 0.01];
  const dot50Full = new M.Dot({ point: p50Full, radius: DR * 1.05, color: C.cyan });
  dot50Full.setFill(C.cyan, 1);
  const dot50NoM = new M.Dot({ point: p50NoM, radius: DR * 1.05, color: C.amber });
  dot50NoM.setFill(C.amber, 1);
  const gap50 = new M.Line({ start: p50Full, end: p50NoM, color: C.pink, strokeWidth: 5 });
  const lbl50 = T('↓ $30', 18, C.pink, true, true);
  lbl50.moveTo([xOf(46.8), yOf(1235), 0]);

  await until(S(14));
  await play(
    new M.FadeIn(dot50Full, { runTime: 0.5 }),
    new M.FadeIn(dot50NoM, { runTime: 0.5 }),
    new M.Create(gap50, { runTime: 0.7 }),
    new M.FadeIn(lbl50, { runTime: 0.6 }),
    ...fbox([
      'at 50 m²:',
      ['full:   1,196.55', C.cyan],
      ['no M:   1,166.67', C.amber],
      ['change:  −$29.89 (drops)', C.pink],
    ], C.pink),
    ...say('AT 50 m²: LINE DROPS', C.pink)
  );

  // 15: At forty square metres, the line rises when M is removed.
  const p40Full = [xOf(40), yOf(fullHat(40)), 0.01];
  const p40NoM  = [xOf(40), yOf(noMHat(40)), 0.01];
  const dot40Full = new M.Dot({ point: p40Full, radius: DR * 1.05, color: C.cyan });
  dot40Full.setFill(C.cyan, 1);
  const dot40NoM = new M.Dot({ point: p40NoM, radius: DR * 1.05, color: C.amber });
  dot40NoM.setFill(C.amber, 1);
  const gap40 = new M.Line({ start: p40Full, end: p40NoM, color: C.green, strokeWidth: 5 });
  const lbl40 = T('↑ $15', 18, C.green, true, true);
  lbl40.moveTo([xOf(42.5), yOf(942), 0]);

  await until(S(15));
  await play(
    new M.FadeIn(dot40Full, { runTime: 0.5 }),
    new M.FadeIn(dot40NoM, { runTime: 0.5 }),
    new M.Create(gap40, { runTime: 0.7 }),
    new M.FadeIn(lbl40, { runTime: 0.6 }),
    ...fbox([
      'at 40 m²:',
      ['full:     951.72', C.cyan],
      ['no M:     966.67', C.amber],
      ['change:  +$14.94 (rises)', C.green],
    ], C.green),
    ...say('AT 40 m²: LINE RISES', C.green)
  );

  // 16: One card can move the predictions for many listings.
  await until(S(16));
  await play(
    new M.Indicate(gap40, { color: C.green, runTime: 1.0 }),
    new M.Indicate(gap50, { color: C.pink, runTime: 1.0 }),
    new M.Indicate(gap60, { color: C.pink, runTime: 1.0 }),
    ...fbox([
      'shifts without M:',
      ['40 m²:  +$14.94', C.green],
      ['50 m²:  −$29.89', C.pink],
      ['60 m²:  −$74.71', C.pink],
    ], C.amber),
    ...say('ONE CARD MOVES MANY PREDICTIONS', C.amber)
  );

  // 17: A listing included in our data is called an observation.
  await until(S(17));
  cards[12].mark.setFill(C.cyan, 0.95);
  cards[12].halo.setFill(C.cyan, 0.16);
  await play(
    new M.FadeOut(coverM, { runTime: 0.5 }),
    new M.LaggedStart(cards.map(k => new M.Indicate(k.group, { color: C.cyan })), { lagRatio: 0.07, runTime: 1.5 }),
    ...say('OBSERVATION = ONE LISTING', C.cyan)
  );

  // 18: A listing that changes the fit a lot is an influential observation.
  await until(S(18));
  await play(
    new M.Flash(cards[12].mark, { color: C.pink }),
    new M.Indicate(mRing, { color: C.pink, runTime: 1.0 }),
    new M.Indicate(mTag, { color: C.pink, runTime: 1.0 }),
    ...say('INFLUENTIAL OBSERVATION', C.pink)
  );

  // 19: We want one score that measures the change across the whole chart.
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(
      dot60Full, dot60NoM, gap60, lbl60,
      vGuide50, vGuide40,
      dot50Full, dot50NoM, gap50, lbl50,
      dot40Full, dot40NoM, gap40, lbl40
    ), { runTime: 0.6 }),
    ...fbox([
      'goal: one score',
      ['for total line shift', C.amber],
      ['across all 13 cards', C.muted],
    ], C.amber),
    ...say('ONE SCORE FOR THE WHOLE CHART', C.amber)
  );

  // 20: At each original card, measure the vertical gap between the two lines.
  const gapBars13 = [];
  const groupsSpec = [
    { area: 40, count: 4, col: C.green },
    { area: 50, count: 4, col: C.pink },
    { area: 60, count: 5, col: C.pink },
  ];
  const barStep = P ? 0.11 : 0.12;
  for (const g of groupsSpec) {
    for (let k = 0; k < g.count; k++) {
      const xx = xOf(g.area) + 0.36 + k * 0.08;  // stays inside the drawn lines (they end at 63 m²)
      const aa = 35 + (xx - AX0) / (AX1 - AX0) * 30;
      const y1 = yOf(fullHat(aa)), y2 = yOf(noMHat(aa));
      gapBars13.push(new M.Line({ start: [xx, y1, 0.01], end: [xx, y2, 0.01], color: g.col, strokeWidth: 4 }));
    }
  }

  await until(S(20));
  await play(
    new M.LaggedStart(gapBars13.map(b => new M.Create(b)), { lagRatio: 0.07, runTime: 1.6 }),
    ...say('13 VERTICAL GAPS BETWEEN LINES', C.violet)
  );

  // 21: A gap times itself is its squared gap, so movements in either direction count.
  await until(S(21));
  gapBars13.forEach(b => b.setColor(C.violet));
  await play(
    new M.LaggedStart(gapBars13.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.05, runTime: 1.3 }),
    ...fbox([
      ['squared gap = gap × gap', C.violet],
      '(+14.94)² =   223.28',
      '(−29.89)² =   893.12',
      '(−74.71)² = 5,581.98',
    ], C.violet),
    ...say('SQUARE EACH GAP: + AND − COUNT', C.violet)
  );

  // 22: Add the squared gaps across all thirteen original card positions.
  await until(S(22));
  await play(
    new M.LaggedStart(gapBars13.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.06, runTime: 1.5 }),
    ...fbox([
      '4 ×   223.28 =    893.12',
      '4 ×   893.12 =  3,572.47',
      '5 × 5,581.98 = 27,909.90',
      ['add all 13 positions', C.violet],
    ], C.violet),
    ...say('ADD ALL 13 SQUARED GAPS', C.violet)
  );

  // 23: For M, that total is about thirty-two thousand three hundred and seventy-five dollars squared.
  await until(S(23));
  await play(
    ...fbox([
      'total squared shift (M)',
      ['= 32,375.48 $²', C.amber],
      ['≈ 32,375 dollars²', C.violet],
    ], C.amber),
    ...say('TOTAL SQUARED SHIFT ≈ 32,375 $²', C.amber)
  );

  // 24: Now compare that change with the usual error size in the full fit.
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(...gapBars13, lineNoM, tagNoM), { runTime: 0.6 }),
    ...fbox([
      ['shift total ≈ 32,375 $²', C.violet],
      ['compare with:', C.muted],
      ['usual error in full fit', C.cyan],
    ], C.cyan),
    ...say('COMPARE WITH FULL-FIT ERROR', C.cyan)
  );

  // 25: Measure each signed gap from the full line to the asking rent.
  const resLines = cards.map(k => {
    const yh = fullHat(k.c.x);
    const col = k.c.y >= yh ? C.green : C.pink;
    return new M.Line({ start: [k.p[0], yOf(yh), 0.005], end: [k.p[0], k.p[1], 0.005], color: col, strokeWidth: 3 });
  });

  await until(S(25));
  await play(
    new M.LaggedStart(resLines.map(ln => new M.Create(ln)), { lagRatio: 0.07, runTime: 1.5 }),
    ...say('SIGNED GAP: FULL LINE → RENT', C.green)
  );

  // 26: This signed gap is called a residual.
  await until(S(26));
  await play(
    new M.Indicate(resLines[12], { color: C.green, runTime: 1.0 }),
    new M.Indicate(resLines[4], { color: C.pink, runTime: 1.0 }),
    ...say('RESIDUAL = RENT − FULL LINE', C.green)
  );

  // 27: Square those gaps and add them.
  await until(S(27));
  await play(
    new M.LaggedStart(resLines.map(ln => new M.Indicate(ln, { color: C.amber })), { lagRatio: 0.05, runTime: 1.2 }),
    ...fbox([
      '13 residuals squared',
      ['sum = 198,869 $²', C.cyan],
    ], C.cyan),
    ...say('SQUARE & ADD ALL 13 RESIDUALS', C.cyan)
  );

  // 28: The line uses two fitted numbers: a starting height and a rise per step.
  const pA = [xOf(40), yOf(fullHat(40)), 0.02];
  const pB = [xOf(50), yOf(fullHat(40)), 0.02];
  const pC = [xOf(50), yOf(fullHat(50)), 0.02];
  const startDot = new M.Dot({ point: [xOf(37), yOf(fullHat(37)), 0.02], radius: 0.11, color: C.amber });
  startDot.setFill(C.amber, 1);
  const runLn  = new M.Line({ start: pA, end: pB, color: C.amber, strokeWidth: 3 });
  const riseLn = new M.Line({ start: pB, end: pC, color: C.amber, strokeWidth: 3 });

  await until(S(28));
  await play(
    new M.FadeIn(startDot, { runTime: 0.5 }),
    new M.Create(runLn, { runTime: 0.7 }),
    new M.Create(riseLn, { runTime: 0.7 }),
    ...fbox([
      ['fitted numbers = 2', C.amber],
      ['1. starting height', C.muted],
      ['2. rise per step', C.muted],
    ], C.amber),
    ...say('2 FITTED NUMBERS: HEIGHT & SLOPE', C.amber)
  );

  // 29: Subtract that count of two from the thirteen cards, leaving eleven.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(startDot, runLn, riseLn), { runTime: 0.5 }),
    ...fbox([
      'cards          = 13',
      ['fitted numbers =  2', C.amber],
      ['13 − 2         = 11', C.green],
    ], C.green),
    ...say('13 − 2 = 11', C.green)
  );

  // 30: Divide the total squared residuals by eleven to get the residual mean square.
  await until(S(30));
  await play(
    ...fbox([
      ['residual mean square', C.cyan],
      '= 198,869 ÷ 11',
    ], C.cyan),
    ...say('RESIDUAL MEAN SQUARE = SUM ÷ 11', C.cyan)
  );

  // 31: Here the residual mean square is about eighteen thousand and seventy-nine dollars squared.
  await until(S(31));
  await play(
    ...fbox([
      'residual mean square',
      '= 198,869 ÷ 11',
      ['≈ 18,079 dollars²', C.amber],
    ], C.amber),
    ...say('RESIDUAL MEAN SQUARE ≈ 18,079 $²', C.amber)
  );

  // 32: The full-fit error spread is now measured on the squared scale.
  await until(S(32));
  await play(
    new M.LaggedStart(resLines.map(ln => new M.Indicate(ln, { color: C.cyan })), { lagRatio: 0.05, runTime: 1.2 }),
    ...say('ERROR SPREAD ON SQUARED SCALE', C.cyan)
  );

  // 33: Multiply the residual mean square by two, the count of fitted numbers.
  lineNoM = new M.DashedLine({ start: [xOf(37), yOf(noMHat(37)), 0], end: [xOf(63), yOf(noMHat(63)), 0], color: C.amber, strokeWidth: 3.5 });
  tagNoM = T('without M', P ? 15 : 16, C.amber, true);
  tagNoM.moveTo([xOf(55.2), yOf(1155), 0]);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...resLines), { runTime: 0.6 }),
    new M.FadeIn(lineNoM, { runTime: 0.6 }),
    new M.FadeIn(tagNoM, { runTime: 0.6 }),
    ...fbox([
      ['2 × residual mean sq', C.cyan],
      '= 2 × 18,079',
      ['≈ 36,158 $²', C.amber],
    ], C.amber),
    ...say('MULTIPLY BY 2 FITTED NUMBERS', C.amber)
  );

  // 34: Divide the total of the squared changes by the result.
  await until(S(34));
  await play(
    ...fbox([
      ['32,375 ÷ 36,158', C.violet],
      ['= 0.8954', C.pink],
    ], C.violet),
    ...say('SQUARED SHIFT ÷ (2 × 18,079)', C.violet)
  );

  // 35: The resulting score is called Cook's distance.
  await until(S(35));
  await play(
    ...fbox([
      ["Cook's distance (M)", C.pink],
      '= 32,375 ÷ 36,158',
      ['≈ 0.90', C.amber],
    ], C.amber),
    ...say("COOK'S DISTANCE", C.amber)
  );

  // 36: For M, the score is about zero point nine zero.
  const mScoreTag = T('M: 0.90', P ? 17 : 18, C.pink, true, true);
  mScoreTag.moveTo([mPos[0] - 0.88, mPos[1], 0]);

  await until(S(36));
  await play(
    new M.FadeOut(mTag, { runTime: 0.4 }),
    new M.FadeIn(mScoreTag, { runTime: 0.6 }),
    new M.Flash(cards[12].mark, { color: C.pink }),
    ...fbox([
      "Cook's distance:",
      ['M: 0.90  █████████', C.pink],
    ], C.pink),
    ...say('CARD M: SCORE ≈ 0.90', C.pink)
  );

  // 37: Card I has the next highest score, about zero point one zero.
  const iPos = cards[8].p;
  const iRing = new M.Circle({ radius: DR * 2.1, color: C.cyan, strokeWidth: 3 });
  iRing.setFill(C.cyan, 0.08); iRing.moveTo(iPos);
  const iScoreTag = T('I: 0.10', P ? 16 : 17, C.cyan, true, true);
  iScoreTag.moveTo([iPos[0], yOf(1235), 0]);

  await until(S(37));
  await play(
    new M.Create(iRing, { runTime: 0.6 }),
    new M.FadeIn(iScoreTag, { runTime: 0.6 }),
    new M.Flash(cards[8].mark, { color: C.cyan }),
    ...fbox([
      "Cook's distance:",
      ['M: 0.90  █████████', C.pink],
      ['I: 0.10  █', C.cyan],
      ['others:  ≤ 0.05', C.muted],
    ], C.cyan),
    ...say('NEXT HIGHEST: CARD I ≈ 0.10', C.cyan)
  );

  // 38: Cook's distance equals the total squared prediction change divided by one combined amount.
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(iRing, iScoreTag), { runTime: 0.5 }),
    ...fbox([
      ["Cook's distance =", C.amber],
      [' total squared shift', C.violet],
      [' ────────────────────', C.muted],
      [' combined error scale', C.cyan],
    ], C.cyan),
    ...say('SHIFT ÷ COMBINED ERROR SCALE', C.cyan)
  );

  // 39: That amount equals the full-fit squared error spread times the count of fitted numbers.
  await until(S(39));
  await play(
    ...fbox([
      ["Cook's distance =", C.amber],
      [' total squared shift', C.violet],
      [' ─────────────────────', C.muted],
      [' 2 × residual mean sq', C.cyan],
    ], C.cyan),
    ...say('SCALE = 2 × RESIDUAL MEAN SQUARE', C.cyan)
  );

  // 40: Use Cook's distance to choose which listing to check first.
  await until(S(40));
  await play(
    new M.Indicate(mRing, { color: C.amber, runTime: 1.0 }),
    new M.Indicate(mScoreTag, { color: C.amber, runTime: 1.0 }),
    ...say('CHECK HIGHEST SCORE FIRST', C.amber)
  );

  // 41: A large score tells you to investigate the listing and compare the fits.
  await until(S(41));
  await play(
    new M.Indicate(lineFull, { color: C.cyan, runTime: 1.0 }),
    new M.Indicate(lineNoM, { color: C.amber, runTime: 1.0 }),
    ...fbox([
      ["large Cook's distance:", C.amber],
      '1. inspect the listing',
      ['2. compare both fits', C.cyan],
    ], C.green),
    ...say('INVESTIGATE & COMPARE BOTH FITS', C.green)
  );

  // 42: The listing might be correct, so a large score alone gives no reason to delete it.
  await until(S(42));
  await play(
    new M.Flash(cards[12].mark, { color: C.green }),
    new M.Indicate(mRing, { color: C.green, runTime: 1.0 }),
    ...fbox([
      ['large score alone:', C.pink],
      'listing may be real',
      ['do not auto-delete', C.pink],
    ], C.pink),
    ...say('DO NOT DELETE ON SCORE ALONE', C.pink)
  );

  // 43: Cook's distance measures how much the fitted predictions shift when you leave one listing out.
  const recap40 = new M.Line({ start: p40Full, end: p40NoM, color: C.green, strokeWidth: 5 });
  const recap50 = new M.Line({ start: p50Full, end: p50NoM, color: C.pink, strokeWidth: 5 });
  const recap60 = new M.Line({ start: p60Full, end: p60NoM, color: C.pink, strokeWidth: 5 });

  await until(S(43));
  await play(
    new M.Create(recap40, { runTime: 0.7 }),
    new M.Create(recap50, { runTime: 0.7 }),
    new M.Create(recap60, { runTime: 0.7 }),
    ...fbox([
      ["Cook's distance", C.amber],
      'measures total shift',
      ['when leaving 1 card out', C.cyan],
    ], C.green),
    ...say('LEAVE ONE OUT → MEASURE SHIFT', C.green)
  );
}

// 3.3.8 Observational studies (live manim-web lesson).
// Beat i = sentence i (0-based, 0..38). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 3.3.8 data: exact means 15 min / 3 km (cyclists) and 24 min / 12 km (drivers)
  const CYC_T = [9, 11, 12, 13, 14, 15, 15, 16, 17, 18, 19, 21]; // sum 180, mean 15
  const DRV_T = [16, 18, 20, 21, 22, 23, 24, 26, 27, 29, 30, 32]; // sum 288, mean 24
  const CYC_D = [1.5, 2.0, 2.0, 2.5, 2.5, 3.0, 3.0, 3.5, 3.5, 4.0, 4.0, 4.5]; // sum 36, mean 3
  const DRV_D = [7.5, 8.5, 9.5, 10.0, 10.5, 11.5, 12.0, 13.0, 14.0, 15.0, 15.5, 17.0]; // sum 144, mean 12

  // Layout constants (phone: 8 x 14.22, content y in [-5.5, 4.3]; laptop: 14.22 x 8, content y in [-3.0, 2.3])
  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 3.95, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 2.45, 0] : [4.55, -0.35, 0];
  const Y_MID = P ? -1.8 : -0.45;
  const W = P ? 6.4 : 7.6, X0 = CX - W / 2, X1 = CX + W / 2;
  const AX_Y = P ? -3.4 : -2.0;
  const DRV_Y = AX_Y + (P ? 1.15 : 0.85);
  const CYC_Y = AX_Y + (P ? 2.85 : 2.25);
  const MID_Y = (CYC_Y + DRV_Y) / 2;
  const DOT_R = P ? 0.11 : 0.12;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const t2x = v => X0 + (v / 35) * W;
  const d2x = v => X0 + (v / 20) * W;

  function makeDot(pt, color, r = DOT_R) {
    const d = new M.Dot({ point: pt, radius: r, color });
    d.setFill(color, 0.94);
    return d;
  }

  function arrow(a, b, color = C.ink, sw = 2.5, both = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, sz = 0.18;
    const tip = (p, dir) => [
      new M.Line({ start: p, end: [p[0] - dir * (ux * sz + uy * sz * 0.55), p[1] - dir * (uy * sz - ux * sz * 0.55), 0], color, strokeWidth: sw }),
      new M.Line({ start: p, end: [p[0] - dir * (ux * sz - uy * sz * 0.55), p[1] - dir * (uy * sz + ux * sz * 0.55), 0], color, strokeWidth: sw }),
    ];
    const parts = [new M.Line({ start: a, end: b, color, strokeWidth: sw }), ...tip(b, 1)];
    if (both) parts.push(...tip(a, -1));
    return new M.VGroup(...parts);
  }

  function badge(text, color, size = P ? 17 : 18) {
    const t = T(text, size, color, true);
    const r = new M.RoundedRectangle({ width: t.getWidth() + 0.4, height: 0.46, cornerRadius: 0.22, color, strokeWidth: 2 });
    r.setFill(C.bg, 0.95);
    return new M.VGroup(r, t);
  }

  function card(x, y, w, h, title, lines, color = C.cyan, titleSize = P ? 20 : 21) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const parts = [r];
    const t = T(title, titleSize, color, true);
    if (t.getWidth() > w - 0.35) t.scaleToFitWidth(w - 0.35);
    const hasLines = lines && lines.length > 0;
    const topY = hasLines ? y + h / 2 - 0.36 : y;
    t.moveTo([x, topY, 0]); parts.push(t);
    if (hasLines) {
      const sz = P ? 18 : 19, lh = P ? 0.38 : 0.40;
      const startY = topY - 0.46;
      lines.forEach((l, i) => {
        const [txt, col] = Array.isArray(l) ? l : [l, C.ink];
        const lt = T(txt, sz, col);
        if (lt.getWidth() > w - 0.35) lt.scaleToFitWidth(w - 0.35);
        lt.moveTo([x, startY - i * lh, 0]);
        parts.push(lt);
      });
    }
    return new M.VGroup(...parts);
  }

  // Formula box (one at a time, fixed position)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
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
    const maxw = P ? FW - 0.8 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null; return a;
  }

  // ---- Beat 0: 24 survey students ----
  const dots = [];
  for (let i = 0; i < 24; i++) {
    const col = i % 6, row = Math.floor(i / 6);
    const x = CX + (col - 2.5) * (P ? 0.68 : 0.78);
    const y = Y_MID + (1.5 - row) * (P ? 0.56 : 0.50);
    dots.push(makeDot([x, y, 0], C.muted));
  }
  const surveyLab = T('24 students from the survey', P ? 18 : 19, C.muted);
  surveyLab.moveTo([CX, Y_MID - (P ? 1.55 : 1.4), 0]);
  await until(S(0));
  await play(
    new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.FadeIn(surveyLab),
    ...say('HOW STUDENTS TRAVEL')
  );

  // ---- Beat 1: Sort into Cyclists and Drivers on trip-time axis ----
  const tAxis = new M.Line({ start: [X0, AX_Y, 0], end: [X1, AX_Y, 0], color: C.muted, strokeWidth: 3 });
  const tTicks = [0, 10, 20, 30].map(v => new M.VGroup(
    new M.Line({ start: [t2x(v), AX_Y - 0.08, 0], end: [t2x(v), AX_Y + 0.08, 0], color: C.muted }),
    T(String(v), 18, C.muted, true).moveTo([t2x(v), AX_Y - 0.34, 0])
  ));
  const tUnit = T('minutes', 17, C.muted); tUnit.moveTo([X1 - 0.5, AX_Y - 0.72, 0]);
  const cycLab = T('Cyclists', P ? 19 : 20, C.cyan, true); cycLab.moveTo([X0 + 0.65, CYC_Y + (P ? 0.52 : 0.45), 0]);
  const drvLab = T('Drivers', P ? 19 : 20, C.amber, true); drvLab.moveTo([X0 + 0.60, DRV_Y + (P ? 0.52 : 0.45), 0]);

  const cycTimePt = k => [t2x(CYC_T[k]), CYC_Y + (k % 2 ? 0.14 : -0.14), 0];
  const drvTimePt = k => [t2x(DRV_T[k]), DRV_Y + (k % 2 ? 0.14 : -0.14), 0];

  await until(S(1));
  await play(
    new M.FadeOut(surveyLab),
    new M.Create(tAxis),
    new M.FadeIn(new M.VGroup(...tTicks, tUnit, cycLab, drvLab)),
    new M.LaggedStart(dots.map((d, i) => {
      const target = i < 12 ? makeDot(cycTimePt(i), C.cyan) : makeDot(drvTimePt(i - 12), C.amber);
      return new M.Transform(d, target);
    }), { lagRatio: 0.03, runTime: 2.0 }),
    ...say('CYCLISTS AND DRIVERS')
  );

  // ---- Beat 2: Cyclists mean = 15 min ----
  const cMeanLine = new M.DashedLine({ start: [t2x(15), MID_Y, 0], end: [t2x(15), CYC_Y + 0.5, 0], color: C.cyan });
  const cMeanLab = T('15 min', P ? 18 : 19, C.cyan, true); cMeanLab.moveTo([t2x(15), CYC_Y + 0.74, 0]);
  await until(S(2));
  await play(
    new M.Create(cMeanLine),
    new M.FadeIn(cMeanLab),
    ...fbox([['Cyclists mean', C.cyan], ['  15 minutes', C.ink]]),
    ...say('CYCLISTS: 15 MIN AVERAGE', C.cyan)
  );

  // ---- Beat 3: Drivers mean = 24 min ----
  const dMeanLine = new M.DashedLine({ start: [t2x(24), DRV_Y - 0.35, 0], end: [t2x(24), MID_Y + 0.15, 0], color: C.amber });
  const dMeanLab = T('24 min', P ? 18 : 19, C.amber, true); dMeanLab.moveTo([t2x(24) + 0.62, DRV_Y + 0.46, 0]);
  await until(S(3));
  await play(
    new M.Create(dMeanLine),
    new M.FadeIn(dMeanLab),
    ...fbox([['Cyclists: 15 min', C.cyan], ['Drivers:  24 min', C.amber]], C.amber),
    ...say('DRIVERS: 24 MIN AVERAGE', C.amber)
  );

  // ---- Beat 4: A gap of 9 minutes ----
  const gapArr = arrow([t2x(15) + 0.06, MID_Y, 0], [t2x(24) - 0.06, MID_Y, 0], C.pink, 3, true);
  const gapLab = T('9 min', P ? 18 : 19, C.pink, true); gapLab.moveTo([(t2x(15) + t2x(24)) / 2, MID_Y + 0.28, 0]);
  await until(S(4));
  await play(
    new M.FadeIn(gapArr, { runTime: 0.8 }),
    new M.FadeIn(gapLab, { runTime: 0.8 }),
    ...fbox([['Cyclists: 15 min', C.cyan], ['Drivers:  24 min', C.amber], ['Gap:       9 min', C.pink]], C.pink),
    ...say('GAP = 9 MINUTES', C.pink)
  );

  // ---- Beat 5: Claim "Cycling is faster!" ----
  const claim = badge('"Cycling is faster!"', C.pink, P ? 17 : 18);
  claim.moveTo([CX, AX_Y - (P ? 1.25 : 0.72), 0]);
  if (P) claim.moveTo([CX, AX_Y - 1.25, 0]);
  else claim.moveTo([X0 + 2.0, AX_Y - 0.72, 0]);
  await until(S(5));
  await play(
    new M.FadeIn(claim),
    new M.Indicate(gapLab, { color: C.pink }),
    ...say('CLAIM: "CYCLING IS FASTER!"', C.pink)
  );

  // ---- Beat 6: Is that right? How did these groups come to be? ----
  const qBadge = badge('Is that right?', C.violet, P ? 18 : 19);
  qBadge.moveTo(P ? [CX, AX_Y - 1.25, 0] : [X0 + 1.8, AX_Y - 0.72, 0]);
  await until(S(6));
  await play(
    new M.FadeOut(claim),
    new M.FadeIn(qBadge),
    ...say('HOW DID THESE GROUPS FORM?', C.violet)
  );

  // ---- Beat 7: Each student chose for themselves ----
  const choseC = badge('chose bike', C.cyan, 16); choseC.moveTo([X1 - 1.0, CYC_Y + (P ? 0.52 : 0.45), 0]);
  const choseD = badge('chose car', C.amber, 16); choseD.moveTo([X1 - 0.95, DRV_Y + (P ? 0.52 : 0.45), 0]);
  await until(S(7));
  await play(
    new M.FadeOut(qBadge),
    new M.FadeIn(choseC),
    new M.FadeIn(choseD),
    ...fbox([['Who chose?', C.violet], ['Students chose', C.ink], ['for themselves', C.muted]], C.violet),
    ...say('EACH STUDENT CHOSE', C.violet)
  );

  // ---- Beat 8: May differ in other ways too ----
  const q1 = T('?', 26, C.violet, true); q1.moveTo([X1 - 0.7, CYC_Y + (P ? 0.52 : 0.45), 0]);
  const q2 = T('?', 26, C.violet, true); q2.moveTo([X1 - 0.7, DRV_Y + (P ? 0.52 : 0.45), 0]);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(choseC, choseD)),
    new M.FadeIn(q1),
    new M.FadeIn(q2),
    new M.LaggedStart(dots.map(d => new M.Indicate(d, { color: C.violet })), { lagRatio: 0.04, runTime: 1.5 }),
    ...say('OTHER DIFFERENCES?', C.violet)
  );

  // ---- Beat 9: Add one more fact — distance from campus ----
  const dAxis = new M.Line({ start: [X0, AX_Y, 0], end: [X1, AX_Y, 0], color: C.muted, strokeWidth: 3 });
  const dTicks = [0, 5, 10, 15, 20].map(v => new M.VGroup(
    new M.Line({ start: [d2x(v), AX_Y - 0.08, 0], end: [d2x(v), AX_Y + 0.08, 0], color: C.muted }),
    T(String(v), 18, C.muted, true).moveTo([d2x(v), AX_Y - 0.34, 0])
  ));
  const dUnit = T('km from campus', 17, C.muted); dUnit.moveTo([X1 - 0.95, AX_Y - 0.72, 0]);
  const campPost = new M.Rectangle({ width: 0.14, height: 0.42, color: C.green, strokeWidth: 1.5 });
  campPost.setFill(C.green, 0.85); campPost.moveTo([X0, AX_Y + 0.22, 0]);
  const campLab = T('CAMPUS', 15, C.green, true); campLab.moveTo([X0 + 0.42, AX_Y - 0.72, 0]);

  const cycLabR = T('Cyclists', P ? 19 : 20, C.cyan, true); cycLabR.moveTo([X1 - 0.62, CYC_Y + (P ? 0.52 : 0.45), 0]);
  const drvLabR = T('Drivers', P ? 19 : 20, C.amber, true); drvLabR.moveTo([X1 - 0.58, DRV_Y + (P ? 0.62 : 0.6), 0]);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(tAxis, ...tTicks, tUnit, cMeanLine, cMeanLab, dMeanLine, dMeanLab, gapArr, gapLab, q1, q2)),
    new M.Transform(cycLab, cycLabR),
    new M.Transform(drvLab, drvLabR),
    new M.Create(dAxis),
    new M.FadeIn(new M.VGroup(...dTicks, dUnit, campPost, campLab)),
    ...fbox([['New fact:', C.violet], ['How far from', C.ink], ['campus? (km)', C.ink]], C.violet),
    ...say('DISTANCE FROM CAMPUS', C.violet)
  );

  // ---- Beat 10: Cyclists live 3 km away, on average ----
  const cDistLine = new M.DashedLine({ start: [d2x(3), MID_Y, 0], end: [d2x(3), CYC_Y + 0.5, 0], color: C.cyan });
  const cDistLab = T('3 km', P ? 18 : 19, C.cyan, true); cDistLab.moveTo([d2x(3) + 0.35, CYC_Y + 0.74, 0]);
  await until(S(10));
  await play(
    new M.Create(cDistLine),
    new M.FadeIn(cDistLab),
    ...fbox([['Mean distance', C.violet], ['Cyclists:  3 km', C.cyan]]),
    ...say('CYCLISTS: 3 KM AVERAGE', C.cyan)
  );

  // ---- Beat 11: Drivers live 12 km away, on average ----
  const dDistLine = new M.DashedLine({ start: [d2x(12), DRV_Y - 0.35, 0], end: [d2x(12), MID_Y + 0.15, 0], color: C.amber });
  const dDistLab = T('12 km', P ? 18 : 19, C.amber, true); dDistLab.moveTo([d2x(12) + 0.58, MID_Y, 0]);
  await until(S(11));
  await play(
    new M.Create(dDistLine),
    new M.FadeIn(dDistLab),
    ...fbox([['Mean distance', C.violet], ['Cyclists:  3 km', C.cyan], ['Drivers:  12 km', C.amber]], C.amber),
    ...say('DRIVERS: 12 KM AVERAGE', C.amber)
  );

  // ---- Beat 12: Place dots on the distance line ----
  const ROW4 = [-0.3, -0.1, 0.1, 0.3];
  const D_R = P ? 0.085 : 0.09;
  const cycDistPt = k => [d2x(CYC_D[k]), CYC_Y + ROW4[k % 4], 0];
  const drvDistPt = k => [d2x(DRV_D[k]), DRV_Y + ROW4[k % 4], 0];
  const nearLab = T('near campus', P ? 17 : 17, C.cyan); nearLab.moveTo([d2x(4.5) + (P ? 1.0 : 0.95), CYC_Y, 0]);
  const farLab = T('far out', P ? 17 : 17, C.amber); farLab.moveTo([d2x(14.5), DRV_Y - 0.62, 0]);

  await until(S(12));
  await play(
    new M.LaggedStart(dots.map((d, i) => {
      const target = i < 12 ? makeDot(cycDistPt(i), C.cyan, D_R) : makeDot(drvDistPt(i - 12), C.amber, D_R);
      return new M.Transform(d, target);
    }), { lagRatio: 0.03, runTime: 1.9 }),
    new M.FadeIn(nearLab),
    new M.FadeIn(farLab),
    ...say('NEAR CAMPUS  vs  FAR OUT', C.cyan)
  );

  // ---- Beat 13: Second possible cause: distance ----
  const dGapArr = arrow([d2x(3) + 0.06, MID_Y, 0], [d2x(12) - 0.06, MID_Y, 0], C.pink, 3, true);
  const dGapLab = T('9 km apart', P ? 17 : 18, C.pink, true); dGapLab.moveTo([(d2x(3) + d2x(12)) / 2, MID_Y + 0.28, 0]);
  await until(S(13));
  await play(
    new M.FadeIn(dGapArr),
    new M.FadeIn(dGapLab),
    ...fbox([['9-min gap: 2 causes?', C.pink], ['1. Bike vs car', C.muted], ['2. Distance (3 vs 12)', C.violet]], C.pink),
    ...say('SECOND CAUSE: DISTANCE', C.pink)
  );

  // ---- Beat 14: Short trips because they live close ----
  await until(S(14));
  await play(
    new M.LaggedStart(dots.slice(0, 12).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.07, runTime: 1.7 }),
    ...say('SHORT TRIP = LIVE CLOSE?', C.cyan)
  );

  // ---- Beat 15: Driver from 12 km cycling -> much longer ----
  const drv12Idx = 12 + 6; // DRV_D[6] === 12.0 km
  const drv12Pt = drvDistPt(6);
  const switchRing = new M.Circle({ radius: 0.24, color: C.pink, strokeWidth: 2.5 });
  switchRing.setFill(C.pink, 0.14); switchRing.moveTo(drv12Pt);
  const longRide = new M.DashedLine({ start: [d2x(0), DRV_Y - 0.05, 0], end: [d2x(12), DRV_Y - 0.05, 0], color: C.pink });
  const longTag = badge('12 km by bike → longer!', C.pink, 16);
  longTag.moveTo([d2x(6), AX_Y - (P ? 1.25 : 0.72), 0]);
  if (!P) longTag.moveTo([CX, AX_Y - 0.72, 0]);

  await until(S(15));
  await play(
    new M.Transform(dots[drv12Idx], makeDot(drv12Pt, C.cyan, DOT_R * 1.15)),
    new M.FadeIn(switchRing),
    new M.Create(longRide),
    new M.FadeIn(longTag),
    ...fbox([['Driver at 12 km:', C.amber], ['by car:  ~24 min', C.muted], ['by bike: much longer!', C.pink]], C.pink),
    ...say('12 KM BY BIKE → LONGER', C.pink)
  );

  // ---- Beat 16: Observational study (Eye watching self-chosen groups) ----
  const eyeY = Y_MID + (P ? 1.45 : 1.05);
  const lidTop = new M.Arc({ radius: 0.75, startAngle: Math.PI * 0.2, angle: Math.PI * 0.6, color: C.cyan, strokeWidth: 3 });
  lidTop.moveTo([CX, eyeY + 0.18, 0]);
  const lidBot = new M.Arc({ radius: 0.75, startAngle: Math.PI * 1.2, angle: Math.PI * 0.6, color: C.cyan, strokeWidth: 3 });
  lidBot.moveTo([CX, eyeY - 0.18, 0]);
  const iris = new M.Circle({ radius: 0.24, color: C.cyan, strokeWidth: 2.5 });
  iris.setFill(C.cyan, 0.22); iris.moveTo([CX, eyeY, 0]);
  const pupil = makeDot([CX, eyeY, 0], C.ink, 0.10);
  const eyeGroup = new M.VGroup(lidTop, lidBot, iris, pupil);

  const grpY = Y_MID - (P ? 0.15 : 0.2);
  const miniBike = card(CX - (P ? 1.65 : 1.95), grpY, P ? 2.8 : 3.2, 1.15, 'BIKE GROUP', [['own choice', C.muted]], C.cyan, 18);
  const miniCar = card(CX + (P ? 1.65 : 1.95), grpY, P ? 2.8 : 3.2, 1.15, 'CAR GROUP', [['own choice', C.muted]], C.amber, 18);
  const rayL = new M.DashedLine({ start: [CX - 0.45, eyeY - 0.42, 0], end: [CX - (P ? 1.3 : 1.5), grpY + 0.62, 0], color: C.muted });
  const rayR = new M.DashedLine({ start: [CX + 0.45, eyeY - 0.42, 0], end: [CX + (P ? 1.3 : 1.5), grpY + 0.62, 0], color: C.muted });

  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(...dots, dAxis, ...dTicks, dUnit, campPost, campLab, cycLab, drvLab, cDistLine, cDistLab, dDistLine, dDistLab, nearLab, farLab, dGapArr, dGapLab, switchRing, longRide, longTag)),
    new M.FadeIn(eyeGroup),
    new M.FadeIn(miniBike),
    new M.FadeIn(miniCar),
    new M.Create(rayL),
    new M.Create(rayR),
    ...fbox([['Observational study', C.cyan], ['We only watch.', C.ink], ['We choose nothing.', C.muted]]),
    ...say('OBSERVATIONAL STUDY', C.cyan)
  );

  // ---- Beat 17: Our whole commuting survey is an observational study ----
  const srvTag = badge('Commuting survey', C.cyan, 17);
  srvTag.moveTo([CX, grpY - (P ? 1.05 : 0.95), 0]);
  await until(S(17));
  await play(
    new M.FadeIn(srvTag),
    new M.Indicate(eyeGroup, { color: C.cyan }),
    ...say('SURVEY = OBSERVATIONAL', C.cyan)
  );

  // ---- Beat 18: Observe means to watch ----
  const watchLab = T('OBSERVE = WATCH', P ? 18 : 19, C.cyan, true);
  watchLab.moveTo([CX, eyeY + (P ? 0.72 : 0.62), 0]);
  await until(S(18));
  await play(
    new M.FadeIn(watchLab),
    new M.Flash(pupil, { color: C.cyan }),
    ...say('OBSERVE = WATCH', C.cyan)
  );

  // ---- Beat 19: Useful — tells us what is happening ----
  const goodTag = badge('✓ Shows what is happening', C.green, 16);
  goodTag.moveTo([CX, grpY - (P ? 1.75 : 1.55), 0]);
  await until(S(19));
  await play(
    new M.FadeIn(goodTag),
    ...fbox([['Observational study', C.cyan], ['✓ What is happening', C.green], ['? What causes what', C.muted]], C.green),
    ...say('SHOWS WHAT IS HAPPENING ✓', C.green)
  );

  // ---- Beat 20: Gap does not show what causes what ----
  const badTag = badge('✗ Does NOT show cause', C.pink, 16);
  badTag.moveTo([CX, grpY - (P ? 2.4 : 2.15), 0]);
  await until(S(20));
  await play(
    new M.FadeIn(badTag),
    ...fbox([['Observational study', C.cyan], ['✓ What is happening', C.green], ['✗ Does NOT show cause', C.pink]], C.pink),
    ...say('GAP DOES NOT SHOW CAUSE', C.pink)
  );

  // ---- Beat 21: Umbrellas & Rain causal triangle ----
  const umbW = P ? 2.45 : 2.75, umbH = 0.95;
  const umbX = CX - (P ? 1.75 : 2.15), wetX = CX + (P ? 1.75 : 2.15);
  const botY = Y_MID - (P ? 0.9 : 0.8), topY = Y_MID + (P ? 1.35 : 1.05);

  const umbCard = card(umbX, botY, umbW, umbH, 'UMBRELLAS', [], C.amber, 19);
  const wetCard = card(wetX, botY, umbW, umbH, 'WET PEOPLE', [], C.violet, 19);
  const noLink = new M.DashedLine({ start: [umbX + umbW / 2 + 0.08, botY, 0], end: [wetX - umbW / 2 - 0.08, botY, 0], color: C.pink });
  const noX = T('✗', 28, C.pink, true); noX.moveTo([CX, botY + 0.32, 0]);

  const rainCard = card(CX, topY, P ? 2.5 : 2.7, 0.95, 'RAIN', [], C.cyan, 21);
  const rDrop1 = new M.Line({ start: [CX - 1.65, topY + 0.25, 0], end: [CX - 1.80, topY - 0.15, 0], color: C.cyan, strokeWidth: 2.5 });
  const rDrop2 = new M.Line({ start: [CX + 1.65, topY + 0.25, 0], end: [CX + 1.50, topY - 0.15, 0], color: C.cyan, strokeWidth: 2.5 });
  const arrRainUmb = arrow([CX - 0.55, topY - 0.52, 0], [umbX + 0.2, botY + umbH / 2 + 0.08, 0], C.green, 3);
  const arrRainWet = arrow([CX + 0.55, topY - 0.52, 0], [wetX - 0.2, botY + umbH / 2 + 0.08, 0], C.green, 3);

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(eyeGroup, miniBike, miniCar, rayL, rayR, srvTag, watchLab, goodTag, badTag)),
    new M.FadeIn(umbCard),
    new M.FadeIn(wetCard),
    new M.Create(noLink),
    new M.FadeIn(noX),
    ...fbox([['Umbrellas & wet people', C.amber], ['Linked together,', C.ink], ['but umbrellas ≠ cause', C.pink]], C.amber),
    ...say('UMBRELLAS & WET PEOPLE', C.amber)
  );
  await until(S(21) + 3.6);
  await play(
    new M.FadeIn(rainCard),
    new M.FadeIn(arrRainUmb),
    new M.FadeIn(arrRainWet),
    ...fbox([['Hidden cause: RAIN', C.cyan], ['Rain → umbrellas', C.green], ['Rain → wet people', C.green]], C.green),
    ...say('HIDDEN CAUSE: THE RAIN', C.cyan)
  );

  // ---- Beat 22: How to test a cause? Assign! ----
  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(umbCard, wetCard, noLink, noX, rainCard, arrRainUmb, arrRainWet)),
    ...fbox([['To test a cause:', C.green], ['Assign the groups', C.ink], ['instead of watching', C.muted]], C.green),
    ...say('TO TEST A CAUSE: ASSIGN', C.green)
  );

  // ---- Beat 23: 100 volunteer drivers ----
  const EXP_R = P ? 0.082 : 0.088;
  const G_DX = P ? 0.34 : 0.32, G_DY = P ? 0.33 : 0.30;
  const GRID_Y = Y_MID + (P ? 0.15 : 0.1);
  const gridPos = i => {
    const col = i % 10, row = Math.floor(i / 10);
    return [CX + (col - 4.5) * G_DX, GRID_Y + (4.5 - row) * G_DY, 0];
  };
  const expDots = Array.from({ length: 100 }, (_, i) => makeDot(gridPos(i), C.amber, EXP_R));
  const volLab = T('100 volunteer drivers', P ? 19 : 20, C.amber, true);
  volLab.moveTo([CX, GRID_Y - 5.2 * G_DY - 0.32, 0]);

  await until(S(23));
  await play(
    new M.LaggedStart(expDots.map(d => new M.FadeIn(d)), { lagRatio: 0.015, runTime: 1.6 }),
    new M.FadeIn(volLab),
    ...fbox([['Volunteers: 100', C.amber], ['All start as drivers', C.muted]], C.amber),
    ...say('100 VOLUNTEER DRIVERS', C.amber)
  );

  // Deterministic balanced 50/50 coin-flip assignment (reproducible across seeks)
  const HEADS = Array.from({ length: 100 }, (_, i) => i < 50);
  let seed = 33801;
  for (let i = 99; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    const tmp = HEADS[i]; HEADS[i] = HEADS[j]; HEADS[j] = tmp;
  }

  // ---- Beat 24: Coin flip for each one ----
  const coinPos = P ? [0, 0.72, 0] : [CX + 3.0, GRID_Y, 0];
  const coinOuter = new M.Circle({ radius: P ? 0.34 : 0.42, color: C.amber, strokeWidth: 3 });
  coinOuter.setFill(C.amber, 0.22); coinOuter.moveTo(coinPos);
  const coinTxt = T('COIN', P ? 15 : 17, C.amber, true); coinTxt.moveTo(coinPos);
  const coinGrp = new M.VGroup(coinOuter, coinTxt);

  await until(S(24));
  await play(
    new M.FadeIn(coinGrp),
    new M.Flash(coinOuter, { color: C.amber }),
    new M.LaggedStart(expDots.map((d, i) =>
      new M.Transform(d, makeDot(gridPos(i), HEADS[i] ? C.green : C.cyan, EXP_R))
    ), { lagRatio: 0.015, runTime: 1.6 }),
    ...fbox([['Coin flip:', C.amber], ['Heads → free bus pass', C.green], ['Tails → no bus pass', C.cyan]], C.amber),
    ...say('COIN FLIP FOR EACH ONE', C.amber)
  );

  // ---- Beat 25: 50 get the pass, 50 do not ----
  const B_DX = P ? 0.34 : 0.34, B_DY = P ? 0.29 : 0.27;
  const LX = CX - (P ? 1.85 : 2.15), RX = CX + (P ? 1.85 : 2.15);
  const BLK_Y = Y_MID + (P ? 0.25 : 0.2);
  const blkPos = (cx, idx) => {
    const col = idx % 5, row = Math.floor(idx / 5);
    return [cx + (col - 2) * B_DX, BLK_Y + (4.5 - row) * B_DY, 0];
  };
  let hIdx = 0, tIdx = 0;
  const splitAnims = expDots.map((d, i) => {
    const isH = HEADS[i];
    const pt = isH ? blkPos(LX, hIdx++) : blkPos(RX, tIdx++);
    return new M.Transform(d, makeDot(pt, isH ? C.green : C.cyan, EXP_R));
  });
  const passLab = T('50 · Bus pass', P ? 18 : 19, C.green, true); passLab.moveTo([LX, BLK_Y - 5.2 * B_DY - 0.25, 0]);
  const noPassLab = T('50 · No pass', P ? 18 : 19, C.cyan, true); noPassLab.moveTo([RX, BLK_Y - 5.2 * B_DY - 0.25, 0]);

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(coinGrp, volLab)),
    new M.LaggedStart(splitAnims, { lagRatio: 0.012, runTime: 1.3 }),
    new M.FadeIn(passLab),
    new M.FadeIn(noPassLab),
    ...fbox([['Bus pass: 50', C.green], ['No pass:  50', C.cyan]], C.green),
    ...say('50 BUS PASS  ·  50 NO PASS', C.green)
  );

  // ---- Beat 26: Compare the two groups' trips ----
  const cmpArr = arrow([LX + 1.0, BLK_Y, 0], [RX - 1.0, BLK_Y, 0], C.ink, 2.5, true);
  const cmpLab = T('compare', 16, C.ink, true); cmpLab.moveTo([CX, BLK_Y + 0.30, 0]);
  await until(S(26));
  await play(
    new M.FadeIn(cmpArr, { runTime: 0.8 }),
    new M.FadeIn(cmpLab, { runTime: 0.8 }),
    ...say('COMPARE BOTH GROUPS', C.cyan)
  );

  // ---- Beat 27: This is called an experiment ----
  await until(S(27));
  await play(
    new M.Indicate(cmpLab, { color: C.green }),
    ...fbox([['Experiment', C.green], ['1. Assign by chance', C.ink], ['2. Measure trips', C.ink]], C.green),
    ...say('EXPERIMENT', C.green)
  );

  // ---- Beat 28: Start alike on average ----
  const alikeY = BLK_Y - 5.2 * B_DY - (P ? 0.82 : 0.72);
  const distL = badge('~12 km avg', C.green, 16); distL.moveTo([LX, alikeY, 0]);
  const distR = badge('~12 km avg', C.cyan, 16); distR.moveTo([RX, alikeY, 0]);
  const eqSign = T('=', 28, C.amber, true); eqSign.moveTo([CX, alikeY, 0]);
  await until(S(28));
  await play(
    new M.FadeIn(distL),
    new M.FadeIn(distR),
    new M.FadeIn(eqSign),
    ...fbox([['Groups start alike:', C.green], ['Pass avg:    ~12 km', C.green], ['No-pass avg: ~12 km', C.cyan]], C.green),
    ...say('GROUPS START ALIKE', C.green)
  );

  // ---- Beat 29: Gap can be put down to the bus pass ----
  const causeTag = badge('Gap → caused by bus pass', C.green, 16);
  causeTag.moveTo([CX, alikeY - (P ? 0.72 : 0.62), 0]);
  await until(S(29));
  await play(
    new M.Indicate(eqSign, { color: C.green }),
    new M.FadeIn(causeTag),
    ...fbox([['Started alike', C.muted], ['Only difference:', C.ink], ['  bus pass → CAUSE', C.green]], C.green),
    ...say('GAP → CAUSED BY BUS PASS', C.green)
  );

  // ---- Beat 30: The idea in one line ----
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...expDots, passLab, noPassLab, cmpArr, cmpLab, distL, distR, eqSign, causeTag)),
    ...hideBox(),
    ...say('THE IDEA IN ONE LINE', C.cyan)
  );

  // ---- Beat 31: Observational study vs Experiment ----
  const cW = P ? 6.6 : 3.7, cH = P ? 2.15 : 2.75;
  const obsPos = P ? [0, -0.55, 0] : [CX - 2.0, -0.45, 0];
  const expPos = P ? [0, -3.15, 0] : [CX + 2.0, -0.45, 0];
  const obsCard = card(obsPos[0], obsPos[1], cW, cH, 'OBSERVATIONAL STUDY', [['We watch choices', C.ink]], C.cyan, P ? 19 : 19);
  const expCard = card(expPos[0], expPos[1], cW, cH, 'EXPERIMENT', [['We assign by chance', C.ink]], C.green, P ? 19 : 19);

  await until(S(31));
  await play(
    new M.FadeIn(obsCard),
    new M.FadeIn(expCard),
    ...fbox([['Observe:    watch', C.cyan], ['Experiment: assign', C.green]], C.cyan),
    ...say('WATCH  vs  ASSIGN BY CHANCE', C.cyan)
  );

  // ---- Beat 32: Look for other differences ----
  const obsNote = T('Look for other differences', P ? 17 : 18, C.amber);
  obsNote.moveTo([obsPos[0], obsPos[1] - (P ? 0.20 : 0.25), 0]);
  await until(S(32));
  await play(
    new M.Indicate(obsCard, { color: C.amber }),
    new M.FadeIn(obsNote),
    ...say('LOOK FOR OTHER DIFFERENCES', C.amber)
  );

  // ---- Beat 33: Cause vs only a link ----
  const linkBadge = badge('→ ONLY A LINK', C.amber, 16); linkBadge.moveTo([obsPos[0], obsPos[1] - (P ? 0.72 : 0.90), 0]);
  const causeBadge = badge('→ CAN SHOW A CAUSE', C.green, 16); causeBadge.moveTo([expPos[0], expPos[1] - (P ? 0.65 : 0.90), 0]);
  await until(S(33));
  await play(
    new M.FadeIn(linkBadge),
    new M.FadeIn(causeBadge),
    ...fbox([['Observational → link', C.amber], ['Experiment    → cause', C.green]], C.green),
    ...say('ONLY A LINK  vs  A CAUSE', C.green)
  );

  // ---- Beat 34: Common trap ----
  const trapCard = card(CX, Y_MID + (P ? 0.9 : 0.75), P ? 6.6 : 7.0, P ? 1.8 : 1.65,
    '✗ COMMON TRAP', [['"Cycling makes trips shorter"', C.pink], ['from survey data alone', C.muted]], C.pink, 20);
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(obsCard, expCard, obsNote, linkBadge, causeBadge)),
    new M.FadeIn(trapCard),
    ...fbox([['✗ "Cycling makes trips', C.pink], ['   shorter" (survey)', C.pink]], C.pink),
    ...say('COMMON TRAP', C.pink)
  );

  // ---- Beat 35: Shows what, not why ----
  const truthCard = card(CX, Y_MID - (P ? 1.2 : 1.15), P ? 6.6 : 7.0, P ? 1.8 : 1.65,
    '✓ WHAT THE SURVEY SHOWS', [['"Cyclists have shorter trips"', C.green], ['It does not show WHY', C.amber]], C.green, 19);
  await until(S(35));
  await play(
    new M.FadeIn(truthCard),
    ...fbox([['✓ Cyclists have shorter', C.green], ['  trips (what)', C.green], ['✗ Not why (cause)', C.pink]], C.amber),
    ...say('SHOWS WHAT — NOT WHY', C.amber)
  );

  // ---- Beat 36: Always ask: people or a coin? ----
  const askHead = T('WHO CHOSE THE GROUPS?', P ? 22 : 24, C.amber, true);
  askHead.moveTo([CX, Y_MID + (P ? 1.2 : 1.0), 0]);
  const pplCard = card(CX - (P ? 1.75 : 2.0), Y_MID - 0.35, P ? 3.1 : 3.4, 1.65,
    'THE PEOPLE', [['Observational', C.cyan], ['→ link only', C.muted]], C.amber, 19);
  const cnCard = card(CX + (P ? 1.75 : 2.0), Y_MID - 0.35, P ? 3.1 : 3.4, 1.65,
    'A COIN', [['Experiment', C.green], ['→ shows cause', C.green]], C.green, 19);
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(trapCard, truthCard)),
    new M.FadeIn(askHead),
    new M.FadeIn(pplCard),
    new M.FadeIn(cnCard),
    ...fbox([['Always ask:', C.amber], ['People → watch (link)', C.cyan], ['Coin   → assign (cause)', C.green]], C.amber),
    ...say('WHO CHOSE: PEOPLE OR COIN?', C.amber)
  );

  // ---- Beat 37: Next lesson teaser (3.3.9 provenance & consent) ----
  const cellCard = card(CX, Y_MID + 0.55, P ? 6.2 : 6.4, 1.35,
    'student #217', [['commute_minutes = 45', C.cyan]], C.cyan, 19);
  const backArr = arrow([CX, Y_MID - 0.2, 0], [CX, Y_MID - 0.95, 0], C.violet, 3);
  const nextNote = badge('Where did 45 come from?', C.violet, 18);
  nextNote.moveTo([CX, Y_MID - 1.35, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(askHead, pplCard, cnCard)),
    new M.FadeIn(cellCard),
    new M.FadeIn(backArr),
    new M.FadeIn(nextNote),
    ...fbox([['Next lesson (3.3.9):', C.violet], ['Origin of one value', C.ink], ['& what is allowed', C.muted]], C.violet),
    ...say('NEXT: WHERE DATA COMES FROM', C.violet)
  );

  // ---- Beat 38: Final one-sentence recap ----
  const recap = card(CX, Y_MID, P ? 6.8 : 7.4, P ? 2.65 : 2.55,
    'KEY TAKEAWAY', [
      ['When people choose their own groups,', C.ink],
      ['a gap between groups may come from', C.ink],
      ['hidden differences — not the groups.', C.amber],
    ], C.green, 21);
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(cellCard, backArr, nextNote)),
    new M.FadeIn(recap),
    ...fbox([['Own choice →', C.amber], ['hidden differences', C.pink], ['may explain the gap', C.ink]], C.green),
    ...say('IN ONE SENTENCE', C.green)
  );
}

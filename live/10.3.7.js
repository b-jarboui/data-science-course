// lesson 10.3.7
// Generalized additive models (live version). Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout constants (phone 8 x 14.22, laptop 14.22 x 8)
  const PILL = P ? [0, 3.85, 0] : [-1.8, 2.05, 0];
  const BOXP = P ? [0, 2.55, 0] : [4.65, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Two plot regions: Age (years) and Booking (weeks ahead)
  const AW = P ? 5.6 : 3.8, AH = P ? 2.1 : 2.9;
  const AC = P ? [0, 0.25, 0] : [-4.3, -0.2, 0];
  const BC = P ? [0, -3.35, 0] : [0.0, -0.2, 0];

  const axX = age => AC[0] - AW / 2 + ((age - 15) / 70) * AW;
  const axY = eff => AC[1] + eff * (AH / 1.6);
  const bxX = wk => BC[0] - AW / 2 + ((wk - 0.5) / 8.0) * AW;
  const bxY = eff => BC[1] + eff * (AH / 1.6);

  // Formula box helper
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => (Array.isArray(l) ? l : [l, C.ink]));
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
    const maxw = P ? FW - 1.0 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Smooth curve helper (polyline built from M.Line segments)
  function makeCurve(pts, color, strokeWidth = 3.5) {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth }));
    }
    return new M.VGroup(...segs);
  }

  // Exact age effect: 20 -> -0.6, 40 -> 0, 60 -> +0.6, 80 -> +0.2
  function ageEff(a) {
    const t = (a - 20) / 20; // 0, 1, 2, 3
    if (t <= 1) return -0.6 + 0.6 * t;
    if (t <= 2) return 0.6 * (t - 1) - 0.15 * Math.sin(Math.PI * (t - 1)) * 0;
    // smooth cubic from 60 (+0.6) to 80 (+0.2)
    const u = t - 2;
    return 0.6 - 0.4 * (3 * u * u - 2 * u * u * u);
  }
  function ageSmooth(a, scale = 1) {
    // Smooth curve passing through (20,-0.6), (40,0), (60,+0.6), (80,+0.2)
    const x = (a - 20) / 60;
    const p0 = -0.6, p1 = 0.0, p2 = 0.6, p3 = 0.2;
    // Lagrange interpolation through x = 0, 1/3, 2/3, 1
    const L0 = ((x - 1/3) * (x - 2/3) * (x - 1)) / ((-1/3) * (-2/3) * (-1));
    const L1 = (x * (x - 2/3) * (x - 1)) / ((1/3) * (-1/3) * (-2/3));
    const L2 = (x * (x - 1/3) * (x - 1)) / ((2/3) * (1/3) * (-1/3));
    const L3 = (x * (x - 1/3) * (x - 2/3)) / (1 * (2/3) * (1/3));
    return scale * (p0 * L0 + p1 * L1 + p2 * L2 + p3 * L3);
  }

  // Exact booking effect: 1 -> +0.5, 2 -> +0.2, 4 -> -0.3, 8 -> -0.5
  function wkSmooth(w) {
    const knots = [[1, 0.5], [2, 0.2], [4, -0.3], [8, -0.5]];
    if (w <= 1) return 0.5;
    if (w >= 8) return -0.5;
    for (let i = 0; i < knots.length - 1; i++) {
      const [x0, y0] = knots[i], [x1, y1] = knots[i + 1];
      if (w >= x0 && w <= x1) {
        const u = (w - x0) / (x1 - x0);
        const s = u * u * (3 - 2 * u);
        return y0 + (y1 - y0) * s;
      }
    }
    return 0;
  }

  const agePts = (scale = 1) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const a = 20 + (60 * i) / 30;
      pts.push([axX(a), axY(ageSmooth(a, scale)), 0]);
    }
    return pts;
  };
  const wkPts = () => {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const w = 1 + (7 * i) / 30;
      pts.push([bxX(w), bxY(wkSmooth(w)), 0]);
    }
    return pts;
  };

  // Beat 0: intro question
  const qParts = [pill('AGE', C.cyan, 20), T('+', 26, C.ink, true), pill('WEEKS BOOKED AHEAD', C.amber, 20), T('→', 26, C.ink, true), pill('WILL THEY COME?', C.green, 20)];
  if (P) [1.3, 0.55, -0.2, -0.95, -1.7].forEach((y, i) => qParts[i].moveTo([0, y, 0]));
  else {
    const gap = 0.3, ws = qParts.map(q => q.getWidth());
    let x = -1.8 - (ws.reduce((a, b) => a + b, 0) + gap * 4) / 2;
    qParts.forEach((q, i) => { q.moveTo([x + ws[i] / 2, -0.3, 0]); x += ws[i] + gap; });
  }
  const qGroup = new M.VGroup(...qParts);
  await until(S(0));
  await play(new M.FadeIn(qGroup), ...say('PREDICT ATTENDANCE FROM AGE & BOOKING?', C.cyan));

  // Beat 1: two strips (years and weeks)
  const ageStripY = AC[1] - AH / 2 - 0.15;
  const wkStripY = BC[1] - AH / 2 - 0.15;
  const ageStrip = new M.Line({ start: [AC[0] - AW / 2, ageStripY, 0], end: [AC[0] + AW / 2, ageStripY, 0], color: C.muted, strokeWidth: 3 });
  const wkStrip = new M.Line({ start: [BC[0] - AW / 2, wkStripY, 0], end: [BC[0] + AW / 2, wkStripY, 0], color: C.muted, strokeWidth: 3 });
  const ageLab = T('Age (years)', 17, C.cyan, true); ageLab.moveTo([AC[0], ageStripY - 0.55, 0]);
  const wkLab = T('Booked ahead (weeks)', 17, C.amber, true); wkLab.moveTo([BC[0], wkStripY - 0.55, 0]);

  await until(S(1));
  await play(new M.FadeOut(qGroup), new M.Create(ageStrip), new M.Create(wkStrip), new M.FadeIn(ageLab), new M.FadeIn(wkLab), ...say('TWO STRIPS: YEARS & WEEKS'));

  // Beat 2: age ticks 20, 40, 60, 80
  const ageTicks = [20, 40, 60, 80].map(a => {
    const x = axX(a);
    const tk = new M.Line({ start: [x, ageStripY - 0.08, 0], end: [x, ageStripY + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(a), 16, C.ink, true); lb.moveTo([x, ageStripY - 0.28, 0]);
    return new M.VGroup(tk, lb);
  });
  await until(S(2));
  await play(new M.LaggedStart(ageTicks.map(g => new M.FadeIn(g)), { lagRatio: 0.15, runTime: 1.2 }), ...say('AGES: 20, 40, 60, 80'));

  // Beat 3: weeks ticks 1, 2, 4, 8
  const wkTicks = [1, 2, 4, 8].map(w => {
    const x = bxX(w);
    const tk = new M.Line({ start: [x, wkStripY - 0.08, 0], end: [x, wkStripY + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(w), 16, C.ink, true); lb.moveTo([x, wkStripY - 0.28, 0]);
    return new M.VGroup(tk, lb);
  });
  await until(S(3));
  await play(new M.LaggedStart(wkTicks.map(g => new M.FadeIn(g)), { lagRatio: 0.15, runTime: 1.2 }), ...say('WEEKS AHEAD: 1, 2, 4, 8', C.amber));

  // Beat 4: flexible lines above each strip
  let ageCurve = makeCurve(agePts(1), C.cyan, 3.5);
  const wkCurve = makeCurve(wkPts(), C.amber, 3.5);
  await until(S(4));
  await play(new M.Create(ageCurve), new M.Create(wkCurve), ...say('A FLEXIBLE CURVE ABOVE EACH STRIP'));

  // Beat 5: each line moves score
  await until(S(5));
  await play(new M.Indicate(ageCurve, { color: C.cyan }), new M.Indicate(wkCurve, { color: C.amber }), ...say('EACH CURVE MOVES THE PATIENT SCORE'));

  // Beat 6: flat zero line
  const ageZero = new M.DashedLine({ start: [AC[0] - AW / 2, axY(0), 0], end: [AC[0] + AW / 2, axY(0), 0], color: C.muted });
  const wkZero = new M.DashedLine({ start: [BC[0] - AW / 2, bxY(0), 0], end: [BC[0] + AW / 2, bxY(0), 0], color: C.muted });
  const zLabA = T('0', 15, C.muted, true); zLabA.moveTo([AC[0] - AW / 2 - 0.2, axY(0), 0]);
  const zLabB = T('0', 15, C.muted, true); zLabB.moveTo([BC[0] - AW / 2 - 0.22, bxY(0), 0]);
  const yTicks = [];
  [[AC[0], axY], [BC[0], bxY]].forEach(([cx, fy]) => [0.5, -0.5].forEach(v => {
    const x0 = cx - AW / 2;
    yTicks.push(new M.Line({ start: [x0 - 0.06, fy(v), 0], end: [x0 + 0.06, fy(v), 0], color: C.muted, strokeWidth: 2 }));
    const t = T(v > 0 ? '+0.5' : '−0.5', 15, C.muted, true); t.moveTo([x0 - 0.12 - t.getWidth() / 2, fy(v), 0]); yTicks.push(t);
  }));
  await until(S(6));
  await play(new M.Create(ageZero), new M.Create(wkZero), new M.FadeIn(zLabA), new M.FadeIn(zLabB), ...yTicks.map(o => new M.FadeIn(o)), ...say('ZERO LINE = NO CHANGE TO SCORE', C.muted));

  // Beat 7: above zero raises score
  const upDot = new M.Dot({ point: [axX(60), axY(0.6), 0], radius: 0.11, color: C.green });
  const upTag = T('+ raises', 15, C.green, true); upTag.moveTo([axX(60), axY(0.6) + 0.3, 0]);
  await until(S(7));
  await play(new M.FadeIn(upDot), new M.FadeIn(upTag), ...say('ABOVE ZERO → RAISES SCORE', C.green));

  // Beat 8: below zero lowers score
  const dnDot = new M.Dot({ point: [axX(20), axY(-0.6), 0], radius: 0.11, color: C.pink });
  const dnTag = T('− lowers', 15, C.pink, true); dnTag.moveTo([axX(20) + 0.35, axY(-0.6) - 0.28, 0]);
  await until(S(8));
  await play(new M.FadeIn(dnDot), new M.FadeIn(dnTag), ...say('BELOW ZERO → LOWERS SCORE', C.pink));

  // Beat 9: look at age strip
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(upDot, upTag, dnDot, dnTag)), new M.Indicate(ageCurve, { color: C.cyan }), ...say('AGE CURVE', C.cyan));

  // Beat 10: 20 to 60 rises
  const riseDot1 = new M.Dot({ point: [axX(20), axY(-0.6), 0], radius: 0.09, color: C.cyan });
  const riseDot2 = new M.Dot({ point: [axX(60), axY(0.6), 0], radius: 0.09, color: C.cyan });
  await until(S(10));
  await play(new M.FadeIn(riseDot1), new M.FadeIn(riseDot2), ...say('AGE 20 → 60: CURVE RISES', C.cyan));

  // Beat 11: by 80 bends back down
  const bendDot = new M.Dot({ point: [axX(80), axY(0.2), 0], radius: 0.09, color: C.violet });
  await until(S(11));
  await play(new M.FadeIn(bendDot), ...say('BY AGE 80: BENDS BACK DOWN', C.violet));

  // Beat 12: weeks strip falls quickly then flattens
  const wkDots = [[1, 0.5], [2, 0.2], [4, -0.3], [8, -0.5]].map(([w, e]) => new M.Dot({ point: [bxX(w), bxY(e), 0], radius: 0.08, color: C.amber }));
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(riseDot1, riseDot2, bendDot)), new M.LaggedStart(wkDots.map(d => new M.FadeIn(d)), { lagRatio: 0.15 }), ...say('WEEKS: FALLS QUICKLY, THEN FLATTENS', C.amber));

  // Beat 13: ruler can only draw straight line
  const straight = new M.DashedLine({ start: [axX(20), axY(-0.45), 0], end: [axX(80), axY(0.45), 0], color: C.pink, strokeWidth: 3 });
  await until(S(13));
  await play(new M.FadeOut(new M.VGroup(...wkDots)), new M.Create(straight), ...say('A STRAIGHT LINE CANNOT BEND', C.pink));

  // Beat 14: smooth curve has no sudden jumps or corners
  await until(S(14));
  await play(new M.FadeOut(straight), new M.Indicate(ageCurve, { color: C.green }), ...say('SMOOTH CURVE: NO JUMPS OR CORNERS', C.green));

  // Beat 15: computer learns curve from past visits
  await until(S(15));
  await play(new M.Indicate(wkCurve, { color: C.amber }), ...say('LEARNED FROM PAST VISITS', C.cyan));

  // Beat 16: features
  await until(S(16));
  await play(new M.Indicate(ageLab, { color: C.cyan }), new M.Indicate(wkLab, { color: C.amber }), ...say('FEATURES = AGE & WEEKS AHEAD', C.cyan));

  // Beat 17: small part of a fit using 4 age targets
  const ageTargets = [[20, -0.6], [40, 0], [60, 0.6], [80, 0.2]];
  const tRings = ageTargets.map(([a, e]) => {
    const r = new M.Circle({ radius: 0.12, color: C.amber, strokeWidth: 2.5 });
    r.moveTo([axX(a), axY(e), 0]);
    return r;
  });
  await until(S(17));
  await play(new M.LaggedStart(tRings.map(r => new M.FadeIn(r)), { lagRatio: 0.15 }), ...say('FIT THE 4 AGE TARGETS', C.amber));

  // Beat 18: start with flat age curve at zero
  const flatCurve = makeCurve(agePts(0), C.cyan, 3.5);
  let gapLines = ageTargets.map(([a, e]) => new M.Line({ start: [axX(a), axY(0), 0], end: [axX(a), axY(e), 0], color: C.pink, strokeWidth: 2.5 }));
  await until(S(18));
  await play(new M.Transform(ageCurve, flatCurve), new M.LaggedStart(gapLines.map(l => new M.Create(l)), { lagRatio: 0.1 }), ...say('START FLAT AT ZERO', C.muted));

  // Beat 19: square each gap and add
  await until(S(19));
  await play(...fbox(['loss = sum of gap²', ['(−0.6)² + 0² + 0.6² + 0.2²', C.pink]], C.pink), ...say('SQUARE EACH GAP & ADD', C.pink));

  // Beat 20: loss is 0.76
  await until(S(20));
  await play(...fbox(['loss = sum of gap²', '0.36 + 0 + 0.36 + 0.04', ['loss = 0.76', C.pink]], C.pink), ...say('LOSS = 0.76', C.pink));

  // Beat 21: move halfway toward targets
  const halfCurve = makeCurve(agePts(0.5), C.cyan, 3.5);
  const halfGaps = ageTargets.map(([a, e]) => new M.Line({ start: [axX(a), axY(e * 0.5), 0], end: [axX(a), axY(e), 0], color: C.amber, strokeWidth: 2.5 }));
  await until(S(21));
  await play(new M.Transform(ageCurve, halfCurve), ...gapLines.map((l, i) => new M.Transform(l, halfGaps[i])), ...say('MOVE HALFWAY TO TARGETS', C.amber));

  // Beat 22: at age 60 guess rises to 0.3
  const dot60Half = new M.Dot({ point: [axX(60), axY(0.3), 0], radius: 0.09, color: C.cyan });
  const lab60Half = T('0.3', 15, C.cyan, true); lab60Half.moveTo([axX(60) + 0.3, axY(0.3), 0]);
  await until(S(22));
  await play(new M.FadeIn(dot60Half), new M.FadeIn(lab60Half), ...say('AGE 60: GUESS = 0.3 (TARGET 0.6)', C.cyan));

  // Beat 23: loss falls to 0.19
  await until(S(23));
  await play(...fbox(['halfway to targets', ['loss = 0.19', C.amber]], C.amber), ...say('LOSS FALLS TO 0.19', C.amber));

  // Beat 24: move the rest of the way
  const fullCurve = makeCurve(agePts(1), C.cyan, 3.5);
  await until(S(24));
  await play(new M.FadeOut(new M.VGroup(dot60Half, lab60Half, ...gapLines)), new M.Transform(ageCurve, fullCurve), ...say('AGE 60 REACHES 0.6', C.green));

  // Beat 25: all four targets match, loss = 0
  await until(S(25));
  await play(...fbox(['all 4 targets match', ['loss = 0.00', C.green]], C.green), ...say('LOSS SETTLES AT ZERO', C.green));

  // Beat 26: full fit learns both curves
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...tRings)), new M.Indicate(ageCurve, { color: C.cyan }), new M.Indicate(wkCurve, { color: C.amber }), ...say('FULL FIT LEARNS BOTH CURVES'));

  // Beat 27: start each prediction at 1.1
  await until(S(27));
  await play(...fbox([['start score = 1.1', C.ink]], C.cyan), ...say('START SCORE = 1.1', C.cyan));

  // Beat 28: meet 60yo booked 1 week ahead
  await until(S(28));
  await play(...say('AGE 60, BOOKED 1 WEEK AHEAD', C.amber));

  // Beat 29: find 60 on age strip and look up
  const p1AgeLine = new M.DashedLine({ start: [axX(60), ageStripY, 0], end: [axX(60), axY(0.6), 0], color: C.cyan });
  const p1AgeDot = new M.Dot({ point: [axX(60), axY(0.6), 0], radius: 0.11, color: C.cyan });
  await until(S(29));
  await play(new M.Create(p1AgeLine), new M.FadeIn(p1AgeDot), ...say('LOOK UP AT AGE 60', C.cyan));

  // Beat 30: adds +0.6
  const p1AgeTag = pill('+0.6', C.cyan, 16); p1AgeTag.moveTo([axX(60), axY(0.6) + 0.38, 0]);
  await until(S(30));
  await play(new M.FadeIn(p1AgeTag), ...fbox(['start   = 1.1', ['age 60  = +0.6', C.cyan]], C.cyan));

  // Beat 31: score rises to 1.7
  await until(S(31));
  await play(...fbox(['start   = 1.1', 'age 60  = +0.6', ['score   = 1.7', C.ink]], C.cyan), ...say('1.1 + 0.6 = 1.7', C.cyan));

  // Beat 32: at 1 week adds +0.5
  const p1WkLine = new M.DashedLine({ start: [bxX(1), wkStripY, 0], end: [bxX(1), bxY(0.5), 0], color: C.amber });
  const p1WkDot = new M.Dot({ point: [bxX(1), bxY(0.5), 0], radius: 0.11, color: C.amber });
  const p1WkTag = pill('+0.5', C.amber, 16); p1WkTag.moveTo([bxX(1) + 0.45, bxY(0.5) + 0.32, 0]);
  await until(S(32));
  await play(new M.Create(p1WkLine), new M.FadeIn(p1WkDot), new M.FadeIn(p1WkTag), ...say('1 WEEK AHEAD ADDS +0.5', C.amber));

  // Beat 33: score rises to 2.2
  await until(S(33));
  await play(...fbox(['start   = 1.1', 'age 60  = +0.6', '1 week  = +0.5', ['score   = 2.2', C.amber]], C.amber), ...say('SCORE RISES TO 2.2', C.amber));

  // Beat 34: S-curve turns 2.2 into ~90%
  await until(S(34));
  await play(...fbox(['score   = 2.2', ['S(2.2) ≈ 90% chance', C.green]], C.green), ...say('S-CURVE: 2.2 → ABOUT 90%', C.green));

  // Beat 35: meet 20yo booked 8 weeks ahead
  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(p1AgeLine, p1AgeDot, p1AgeTag, p1WkLine, p1WkDot, p1WkTag)), ...say('AGE 20, BOOKED 8 WEEKS AHEAD', C.pink));

  // Beat 36: start again at 1.1
  await until(S(36));
  await play(...fbox([['start score = 1.1', C.ink]], C.pink));

  // Beat 37: age 20 takes away 0.6
  const p2AgeLine = new M.DashedLine({ start: [axX(20), ageStripY, 0], end: [axX(20), axY(-0.6), 0], color: C.pink });
  const p2AgeDot = new M.Dot({ point: [axX(20), axY(-0.6), 0], radius: 0.11, color: C.pink });
  const p2AgeTag = pill('−0.6', C.pink, 16); p2AgeTag.moveTo([axX(20), axY(-0.6) + 0.48, 0]);
  await until(S(37));
  await play(new M.Create(p2AgeLine), new M.FadeIn(p2AgeDot), new M.FadeIn(p2AgeTag), ...fbox(['start   = 1.1', ['age 20  = −0.6', C.pink]], C.pink));

  // Beat 38: score drops to 0.5
  await until(S(38));
  await play(...fbox(['start   = 1.1', 'age 20  = −0.6', ['score   = 0.5', C.ink]], C.pink), ...say('SCORE DROPS TO 0.5', C.pink));

  // Beat 39: 8 weeks takes away 0.5
  const p2WkLine = new M.DashedLine({ start: [bxX(8), wkStripY, 0], end: [bxX(8), bxY(-0.5), 0], color: C.pink });
  const p2WkDot = new M.Dot({ point: [bxX(8), bxY(-0.5), 0], radius: 0.11, color: C.pink });
  const p2WkTag = pill('−0.5', C.pink, 16); p2WkTag.moveTo([bxX(8) - 0.3, bxY(-0.5) + 0.42, 0]);
  await until(S(39));
  await play(new M.Create(p2WkLine), new M.FadeIn(p2WkDot), new M.FadeIn(p2WkTag), ...say('8 WEEKS TAKES AWAY 0.5', C.pink));

  // Beat 40: score is 0 -> 50%
  await until(S(40));
  await play(...fbox(['start   = 1.1', 'age 20  = −0.6', '8 weeks = −0.5', ['score = 0 → 50%', C.amber]], C.amber), ...say('SCORE 0 → 50% CHANCE', C.amber));

  // Beat 41: generalized additive model
  await until(S(41));
  await play(new M.FadeOut(new M.VGroup(p2AgeLine, p2AgeDot, p2AgeTag, p2WkLine, p2WkDot, p2WkTag)), ...say('GENERALIZED ADDITIVE MODEL', C.cyan));

  // Beat 42: additive means add changes from separate curves
  await until(S(42));
  await play(new M.Indicate(ageCurve, { color: C.cyan }), new M.Indicate(wkCurve, { color: C.amber }), ...say('ADDITIVE = ADD SEPARATE CURVES', C.cyan));

  // Beat 43: generalized means final translation suits outcome
  await until(S(43));
  await play(...say('GENERALIZED = S-CURVE TO CHANCE', C.green));

  // Beat 44: rule in words
  await until(S(44));
  await play(...say('THE RULE IN WORDS', C.ink));

  // Beat 45: score = starting + age + booking
  await until(S(45));
  await play(...fbox([['score = start', C.ink], ['      + age change', C.cyan], ['      + booking change', C.amber]], C.cyan));

  // Beat 46: chance = S-shaped translation of score
  await until(S(46));
  await play(...fbox([['score  = start', C.ink], ['       + age + booking', C.ink], ['chance = S(score)', C.green]], C.green));

  // Beat 47: use when patterns bend and you want to see what each adds
  await until(S(47));
  await play(new M.Indicate(ageCurve, { color: C.cyan }), new M.Indicate(wkCurve, { color: C.amber }), ...say('CURVED PATTERNS + CLEAR EFFECTS', C.cyan));

  // Beat 48: age curve always gives same change at age 20
  const fixDot = new M.Dot({ point: [axX(20), axY(-0.6), 0], radius: 0.12, color: C.cyan });
  await until(S(48));
  await play(new M.FadeIn(fixDot), new M.Flash(fixDot, { color: C.cyan }), ...say('AGE 20 ALWAYS ADDS −0.6', C.cyan));

  // Beat 49: trap - wiggly curve chasing noise
  const wigglyPts = [];
  for (let i = 0; i <= 40; i++) {
    const a = 20 + (60 * i) / 40;
    const wiggle = 0.25 * Math.sin(i * 1.45) * Math.sin((Math.PI * i) / 40);
    wigglyPts.push([axX(a), axY(ageSmooth(a, 1) + wiggle), 0]);
  }
  const wigglyCurve = makeCurve(wigglyPts, C.pink, 3);
  await until(S(49));
  await play(new M.FadeOut(fixDot), new M.Create(wigglyCurve), ...say('TRAP: CHASING EVERY RISE & FALL', C.pink));

  // Beat 50: random noise disappears with new patients
  await until(S(50));
  await play(new M.Indicate(wigglyCurve, { color: C.pink }), ...say('NOISE DISAPPEARS ON NEW PATIENTS', C.pink));

  // Beat 51: smoothness penalty
  await until(S(51));
  await play(...fbox([['smoothness penalty', C.violet], ['adds a cost for sharp bends', C.muted]], C.violet), ...say('SMOOTHNESS PENALTY', C.violet));

  // Beat 52: balances cost against fit
  await until(S(52));
  await play(new M.FadeOut(wigglyCurve), new M.Indicate(ageCurve, { color: C.green }), ...say('BALANCE SMOOTHNESS & FIT', C.green));

  // Beat 53: final summary
  await until(S(53));
  await play(...fbox([['GAM =', C.cyan], ['smooth curves added', C.cyan], ['→ S-curve prediction', C.green]], C.cyan), ...say('SMOOTH CURVES + ADDITIVE SCORE → CHANCE', C.cyan));
}

// 1.3.9 Standard scores (live manim-web lesson).
// Beat i = sentence i (0-based, 0..54). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const D = [3, 4, 4, 5, 6, 6, 7];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time; lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.36 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.30;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Reusable drawing helpers (all parts placed with moveTo; fills via setFill)
  function makeArrow(x1, x2, y, color, sw = 3.2) {
    const dir = x2 >= x1 ? 1 : -1;
    const tip = Math.min(0.16, Math.abs(x2 - x1) * 0.32);
    const shaft = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const top = new M.Line({ start: [x2 - dir * tip, y + tip * 0.65, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const bot = new M.Line({ start: [x2 - dir * tip, y - tip * 0.65, 0], end: [x2, y, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, top, bot);
  }

  function makeParcelBox(x, y, w, h, borderColor = C.amber) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color: borderColor, strokeWidth: 3 });
    box.setFill(borderColor, 0.18); box.moveTo([x, y, 0]);
    const hRib = new M.Line({ start: [x - w / 2, y, 0], end: [x + w / 2, y, 0], color: C.cyan, strokeWidth: 3 });
    const vRib = new M.Line({ start: [x, y - h / 2, 0], end: [x, y + h / 2, 0], color: C.cyan, strokeWidth: 3 });
    return new M.VGroup(box, hRib, vRib);
  }

  function makeStepBlock(x1, x2, y, h, color, label = '', labelSize = 15) {
    const w = Math.max(0.08, Math.abs(x2 - x1));
    const cx = (x1 + x2) / 2;
    const rect = new M.RoundedRectangle({ width: w, height: h, cornerRadius: Math.min(0.08, h * 0.25, w * 0.25), color, strokeWidth: 2 });
    rect.setFill(color, 0.30); rect.moveTo([cx, y, 0]);
    if (!label) return rect;
    const t = T(label, labelSize, C.ink, true);
    if (t.getWidth() > w - 0.10) t.scale((w - 0.10) / t.getWidth());
    t.moveTo([cx, y, 0]);
    return new M.VGroup(rect, t);
  }

  function makeBadge(text, color, x, y, size = 17) {
    const t = T(text, size, color, true);
    const w = t.getWidth() + 0.28, h = 0.36;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.10, color, strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo([x, y, 0]);
    t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }

  function makeGlowDot(x, y, color = C.cyan, r = 0.12, hr = 0.25) {
    const halo = new M.Dot({ point: [x, y, 0], radius: hr, color });
    halo.setFill(color, 0.20);
    const d = new M.Dot({ point: [x, y, 0], radius: r, color });
    d.setFill(color, 1);
    return { g: new M.VGroup(halo, d), d, halo, p: [x, y, 0] };
  }

  // ===========================================================================
  // BEATS 0-1: Latest coffee parcel took 7 days — unusually late or normal?
  // ===========================================================================
  const introY = P ? 0.4 : -0.35;
  const parcelIcon = makeParcelBox(CX, introY + 0.30, 1.55, 1.15, C.amber);
  const parcelLbl = T('7 days', P ? 28 : 26, C.amber, true, true);
  parcelLbl.moveTo([CX, introY - 0.62, 0]);
  const introParcel = new M.VGroup(parcelIcon, parcelLbl);

  await until(S(0));
  await play(new M.FadeIn(introParcel), ...fbox(['latest parcel:', ['7 days to arrive', C.amber]], C.amber), ...say('LATEST COFFEE PARCEL: 7 DAYS', C.amber));

  const optNormal = makeBadge('fairly normal?', C.cyan, CX - (P ? 1.55 : 1.75), introY - 1.35, P ? 17 : 18);
  const optLate = makeBadge('unusually late?', C.pink, CX + (P ? 1.55 : 1.75), introY - 1.35, P ? 17 : 18);

  await until(S(1));
  await play(
    new M.Indicate(parcelIcon, { color: C.amber }),
    new M.FadeIn(optNormal), new M.FadeIn(optLate),
    ...fbox(['question:', ['unusually late,', C.pink], ['or fairly normal?', C.cyan]], C.amber),
    ...say('UNUSUALLY LATE, OR NORMAL?', C.amber)
  );

  // ===========================================================================
  // BEATS 2-6: Normal week on days line (2..8), mean = 5, 7-day gap = +2
  // ===========================================================================
  const LW = P ? 6.6 : 7.0, LX0 = CX - LW / 2, DAY_U = LW / 6;
  const d2x = v => LX0 + (v - 2) * DAY_U;
  const NY = P ? 0.1 : -0.65;

  const nlLine = new M.Line({ start: [LX0, NY, 0], end: [LX0 + LW, NY, 0], color: C.muted, strokeWidth: 3 });
  const nlTicks = [2, 3, 4, 5, 6, 7, 8].map(v => new M.VGroup(
    new M.Line({ start: [d2x(v), NY - 0.08, 0], end: [d2x(v), NY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 18 : 19, C.muted, true).moveTo([d2x(v), NY - 0.30, 0])
  ));
  const nlUnit = T('days', 16, C.muted);
  nlUnit.moveTo([LX0 + LW - 0.15, NY - 0.58, 0]);
  const nlTicksGrp = new M.VGroup(...nlTicks, nlUnit);

  const dots = D.map((v, k) => {
    const up = D.slice(0, k).filter(x => x === v).length;
    return makeGlowDot(d2x(v), NY + 0.34 + up * 0.50, C.cyan, 0.115, 0.24);
  });

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(introParcel, optNormal, optLate), { runTime: 0.6 }),
    new M.Create(nlLine, { runTime: 0.9 }),
    new M.FadeIn(nlTicksGrp, { runTime: 0.9 }),
    new M.LaggedStart(dots.map(o => new M.FadeIn(o.g)), { lagRatio: 0.18, runTime: 2.0 }),
    ...say('NORMAL WEEK: 7 PARCELS ON A DAYS LINE', C.cyan)
  );

  await until(S(3));
  await play(
    new M.LaggedStart(dots.map(o => new M.Indicate(o.g, { color: C.amber })), { lagRatio: 0.42, runTime: 4.0 }),
    ...fbox(['normal week (days):', ['3, 4, 4, 5, 6, 6, 7', C.cyan]], C.cyan),
    ...say('3, 4, 4, 5, 6, 6, AND 7 DAYS', C.cyan)
  );

  const meanLine = new M.DashedLine({ start: [d2x(5), NY - 0.10, 0], end: [d2x(5), NY + 1.85, 0], color: C.amber });
  const meanLab = T('mean = 5', 18, C.amber, true);
  meanLab.moveTo([d2x(5), NY + 2.05, 0]);

  await until(S(4));
  await play(
    new M.Create(meanLine), new M.FadeIn(meanLab),
    ...fbox(['normal week (days):', '3, 4, 4, 5, 6, 6, 7', ['mean = 5 days', C.amber]], C.amber),
    ...say('MEAN = 5 DAYS', C.amber)
  );

  const ring7 = new M.Circle({ radius: 0.29, color: C.amber, strokeWidth: 3 });
  ring7.setFill(C.amber, 0.14); ring7.moveTo(dots[6].p);

  await until(S(5));
  await play(
    new M.Create(ring7), new M.Flash(dots[6].d, { color: C.amber }),
    ...say('FOCUS ON THE 7-DAY PARCEL', C.amber)
  );

  const guide7 = new M.DashedLine({ start: [d2x(7), NY + 0.62, 0], end: [d2x(7), NY + 1.36, 0], color: C.amber });
  const gapArr = makeArrow(d2x(5) + 0.04, d2x(7) - 0.04, NY + 1.36, C.amber, 3.4);
  const gapLab = T('+2 days', 19, C.amber, true);
  gapLab.moveTo([(d2x(5) + d2x(7)) / 2, NY + 1.64, 0]);

  await until(S(6));
  await play(
    new M.Create(guide7), new M.FadeIn(gapArr), new M.FadeIn(gapLab),
    ...fbox(['7-day parcel:', ['7 − 5 = +2 days', C.amber]], C.amber),
    ...say('2 DAYS LONGER THAN THE MEAN', C.amber)
  );

  // ===========================================================================
  // BEATS 7-13: Context matters; measure gap in equal steps = dividing
  // ===========================================================================
  await until(S(7));
  await play(
    new M.Indicate(gapArr, { color: C.amber }), new M.Indicate(gapLab, { color: C.amber }),
    ...fbox(['gap = +2 days', ['a lot, or normal?', C.muted]], C.amber),
    ...say('ON ITS OWN, +2 DAYS IS HARD TO JUDGE', C.amber)
  );

  const SY = NY - 1.25; // step & spread band track cleanly below tick labels
  const bandNarrow = new M.Rectangle({ width: d2x(6) - d2x(4), height: 0.42, color: C.green, strokeWidth: 2 });
  bandNarrow.setFill(C.green, 0.20); bandNarrow.moveTo([d2x(5), SY, 0]);
  const bandNarrowTxt = T('±1 day', 16, C.green, true); bandNarrowTxt.moveTo([d2x(5), SY, 0]);
  const drop7N = new M.DashedLine({ start: [d2x(7), NY - 0.48, 0], end: [d2x(7), SY - 0.22, 0], color: C.pink });
  const labFar = T('far outside!', 16, C.pink, true); labFar.moveTo([d2x(7), SY - 0.48, 0]);

  await until(S(8));
  await play(
    new M.FadeIn(bandNarrow), new M.FadeIn(bandNarrowTxt), new M.Create(drop7N), new M.FadeIn(labFar),
    ...fbox(['typical spread = ±1 d:', ['+2 days is a LOT', C.pink]], C.pink),
    ...say('WITHIN 1 DAY → +2 DAYS IS A LOT', C.pink)
  );

  const bandWide = new M.Rectangle({ width: d2x(8) - d2x(2), height: 0.42, color: C.violet, strokeWidth: 2 });
  bandWide.setFill(C.violet, 0.16); bandWide.moveTo([d2x(5), SY, 0]);
  const bandWideTxt = T('typical: ±3 days', 16, C.violet, true); bandWideTxt.moveTo([d2x(4), SY, 0]);
  const drop7W = new M.DashedLine({ start: [d2x(7), NY - 0.48, 0], end: [d2x(7), SY - 0.22, 0], color: C.green });
  const labIn = T('inside!', 16, C.green, true); labIn.moveTo([d2x(7), SY - 0.48, 0]);

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(bandNarrow, bandNarrowTxt, drop7N, labFar)),
    new M.FadeIn(bandWide), new M.FadeIn(bandWideTxt), new M.Create(drop7W), new M.FadeIn(labIn),
    ...fbox(['typical spread = ±3 d:', ['+2 days is normal', C.green]], C.green),
    ...say('SWING SEVERAL DAYS → NOTHING SPECIAL', C.green)
  );

  const demoStep = makeStepBlock(d2x(5), d2x(6), SY, 0.40, C.violet, '1 step', 15);
  const demoStepLab = T('1 step = typical spread', 16, C.violet);
  demoStepLab.moveTo([d2x(5.5), SY - 0.48, 0]);

  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(bandWide, bandWideTxt, drop7W, labIn)),
    new M.FadeIn(demoStep), new M.FadeIn(demoStepLab), new M.Indicate(gapArr, { color: C.amber }),
    ...fbox(['typical spread', ['= ONE STEP', C.violet], 'measure gap in steps'], C.violet),
    ...say('USE TYPICAL SPREAD AS ONE STEP', C.violet)
  );

  await until(S(11));
  await play(
    new M.Indicate(demoStep, { color: C.cyan }), new M.Indicate(gapArr, { color: C.cyan }),
    ...fbox(['how many steps fit?', ['gap ÷ step size', C.cyan], '= dividing'], C.cyan),
    ...say('COUNTING EQUAL STEPS = DIVIDING', C.cyan)
  );

  const drop5S = new M.DashedLine({ start: [d2x(5), NY - 0.48, 0], end: [d2x(5), SY - 0.24, 0], color: C.muted });
  const drop7S = new M.DashedLine({ start: [d2x(7), NY - 0.48, 0], end: [d2x(7), SY - 0.24, 0], color: C.muted });
  const st1a = makeStepBlock(d2x(5), d2x(6), SY, 0.42, C.green, '1 d', 15);
  const st1b = makeStepBlock(d2x(6), d2x(7), SY, 0.42, C.green, '1 d', 15);
  const st1Lab = T('2 steps fit (2 ÷ 1 = 2)', 16, C.green, true);
  st1Lab.moveTo([d2x(6), SY - 0.48, 0]);

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(demoStep, demoStepLab)),
    new M.Create(drop5S), new M.Create(drop7S),
    new M.LaggedStart([new M.FadeIn(st1a), new M.FadeIn(st1b)], { lagRatio: 0.4, runTime: 1.2 }),
    new M.FadeIn(st1Lab),
    ...fbox(['step = 1 day, gap = 2 d', '2 steps fit', ['2 ÷ 1 = 2', C.green]], C.green),
    ...say('STEP 1 DAY → 2 ÷ 1 = 2 STEPS', C.green)
  );

  const st2 = makeStepBlock(d2x(5), d2x(7), SY, 0.42, C.violet, '2 days', 16);
  const st2Lab = T('1 step fits (2 ÷ 2 = 1)', 16, C.violet, true);
  st2Lab.moveTo([d2x(6), SY - 0.48, 0]);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(st1a, st1b, st1Lab)),
    new M.FadeIn(st2), new M.FadeIn(st2Lab),
    ...fbox(['step = 2 days, gap = 2 d', 'only 1 step fits', ['2 ÷ 2 = 1', C.violet]], C.violet),
    ...say('STEP 2 DAYS → 2 ÷ 2 = 1 STEP', C.violet)
  );

  // ===========================================================================
  // BEATS 14-17: Standard deviation (≈ 1.5 -> 1.41 days) & Standard score / z-score
  // ===========================================================================
  const sdRect = new M.RoundedRectangle({ width: 1.41 * DAY_U, height: 0.42, cornerRadius: 0.08, color: C.amber, strokeWidth: 2.5 });
  sdRect.setFill(C.amber, 0.28); sdRect.moveTo([(d2x(5) + d2x(6.41)) / 2, SY, 0]);
  const sdTxt15 = T('≈ 1.5 d', 16, C.ink, true); sdTxt15.moveTo([(d2x(5) + d2x(6.41)) / 2, SY, 0]);
  const sdCap = T('standard deviation', 16, C.amber); sdCap.moveTo([(d2x(5) + d2x(6.41)) / 2, SY - 0.48, 0]);

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(st2, st2Lab, drop5S, drop7S)),
    new M.FadeIn(sdRect), new M.FadeIn(sdTxt15), new M.FadeIn(sdCap),
    ...fbox(['normal week spread:', ['standard deviation', C.amber], '≈ 1.5 days'], C.amber),
    ...say('STANDARD DEVIATION ≈ 1.5 DAYS', C.amber)
  );

  const sdTxt141 = T('1.41 d', 16, C.ink, true); sdTxt141.moveTo([(d2x(5) + d2x(6.41)) / 2, SY, 0]);

  await until(S(15));
  await play(
    new M.FadeOut(sdTxt15), new M.FadeIn(sdTxt141), new M.Indicate(sdRect, { color: C.amber }),
    ...fbox(['standard deviation', ['= 1.41 days', C.amber]], C.amber),
    ...say('PRECISELY: 1.41 DAYS', C.amber)
  );

  await until(S(16));
  await play(
    new M.Indicate(gapArr, { color: C.cyan }), new M.Indicate(sdRect, { color: C.green }),
    ...fbox(['gap in SD steps =', ['standard score', C.green]], C.green),
    ...say('STANDARD SCORE = GAP IN SD STEPS', C.green)
  );

  await until(S(17));
  await play(
    ...fbox([['standard score', C.green], ['= z-score', C.cyan], '(same thing)'], C.cyan),
    ...say('ALSO CALLED A Z-SCORE', C.cyan)
  );

  // ===========================================================================
  // BEATS 18-28: Worked example for 7-day parcel (steps -> 2 ÷ 1.41 ≈ 1.4)
  // ===========================================================================
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(sdRect, sdTxt141, sdCap)),
    new M.Flash(dots[6].d, { color: C.amber }), new M.Indicate(ring7, { color: C.amber }),
    ...fbox(['7-day parcel:', ['find standard score', C.amber]], C.amber),
    ...say('FIND SCORE FOR 7-DAY PARCEL', C.amber)
  );

  await until(S(19));
  await play(
    new M.Indicate(gapArr, { color: C.amber }), new M.Indicate(gapLab, { color: C.amber }),
    ...fbox(['1. find the gap:', ['7 − 5 = +2 days', C.amber], '(above the mean)'], C.amber),
    ...say('FIRST: 7 − 5 = +2 DAYS', C.amber)
  );

  const startPin = new M.Dot({ point: [d2x(5), SY, 0], radius: 0.09, color: C.amber });
  startPin.setFill(C.amber, 1);
  const startPinLab = T('5', 17, C.amber, true); startPinLab.moveTo([d2x(5), SY - 0.46, 0]);
  const drop7Step = new M.DashedLine({ start: [d2x(7), NY - 0.48, 0], end: [d2x(7), SY + 0.62, 0], color: C.amber });

  await until(S(20));
  await play(
    new M.FadeIn(startPin), new M.FadeIn(startPinLab), new M.Create(drop7Step),
    new M.Indicate(meanLine, { color: C.amber }),
    ...fbox(['step ≈ 1.5 days', ['start from 5', C.cyan]], C.cyan),
    ...say('STEP BY ≈ 1.5 DAYS FROM 5', C.cyan)
  );

  const step1 = new M.VGroup(makeStepBlock(d2x(5), d2x(6.41), SY, 0.42, C.cyan), T('step 1', 16, C.cyan, true).moveTo([(d2x(5) + d2x(6.41)) / 2, SY + 0.38, 0]));
  const tick65 = T('~6.5', 17, C.cyan, true); tick65.moveTo([d2x(6.41), SY - 0.46, 0]);

  await until(S(21));
  await play(
    new M.FadeIn(step1), new M.FadeIn(tick65),
    ...fbox(['1 step from 5:', ['≈ 6.5 days', C.cyan], '(short of 7)'], C.cyan),
    ...say('1 STEP → ≈ 6.5 (SHORT OF 7)', C.cyan)
  );

  const step2 = new M.VGroup(makeStepBlock(d2x(6.41), d2x(7.82), SY, 0.42, C.violet), T('step 2', 16, C.violet, true).moveTo([d2x(7.5), SY + 0.38, 0]));
  const tick80 = T('~8', 17, C.violet, true); tick80.moveTo([d2x(7.82), SY - 0.46, 0]);

  await until(S(22));
  await play(
    new M.FadeIn(step2), new M.FadeIn(tick80),
    ...fbox(['1 step  → ≈ 6.5 d', ['2 steps → ≈ 8 d', C.violet], '(passes 7)'], C.violet),
    ...say('2 STEPS → ≈ 8 (PASSES 7)', C.violet)
  );

  const pin7 = new M.Dot({ point: [d2x(7), SY, 0], radius: 0.10, color: C.amber });
  pin7.setFill(C.amber, 1);

  await until(S(23));
  await play(
    new M.FadeIn(pin7), new M.Flash(pin7, { color: C.amber }),
    ...fbox(['7 days sits', ['between 1 and 2 steps', C.amber], 'above the mean'], C.amber),
    ...say('BETWEEN 1 AND 2 STEPS ABOVE MEAN', C.amber)
  );

  await until(S(24));
  await play(
    new M.Indicate(gapLab, { color: C.cyan }),
    ...fbox(['exact count:', ['2 days ÷ 1.41 days', C.cyan]], C.cyan),
    ...say('EXACT COUNT: 2 ÷ 1.41', C.cyan)
  );

  await until(S(25));
  await play(
    ...fbox(['2 ÷ 1.41', ['≈ 1.4', C.amber]], C.amber),
    ...say('2 ÷ 1.41 ≈ 1.4', C.amber)
  );

  const score7 = makeBadge('+1.4', C.amber, d2x(7), NY + 0.85, 17);

  await until(S(26));
  await play(
    new M.FadeIn(score7), new M.Flash(dots[6].d, { color: C.amber }),
    ...fbox(['7-day parcel:', '2 ÷ 1.41 ≈ 1.4', ['standard score ≈ +1.4', C.amber]], C.amber),
    ...say('7-DAY PARCEL: SCORE ≈ +1.4', C.amber)
  );

  await until(S(27));
  await play(
    new M.Indicate(step1, { color: C.pink }), new M.Indicate(score7, { color: C.pink }),
    ...fbox(['look almost alike:', ['1.41  vs  1.4', C.pink], '(pure coincidence!)'], C.pink),
    ...say('COINCIDENCE: 1.41 VS 1.4', C.pink)
  );

  await until(S(28));
  await play(
    new M.Indicate(step1, { color: C.cyan }), new M.Indicate(score7, { color: C.amber }),
    ...fbox([['1.41 = DAYS (step)', C.cyan], ['1.4  = STEPS (score)', C.amber]], C.amber),
    ...say('1.41 IS DAYS · 1.4 IS STEPS', C.amber)
  );

  // ===========================================================================
  // BEATS 29-34: Check 5-day (score 0) and 3-day (score -1.4); signs
  // ===========================================================================
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(startPin, startPinLab, drop7Step, step1, tick65, step2, tick80, pin7), { runTime: 0.7 }),
    new M.Indicate(dots[3].g, { color: C.green, runTime: 0.8 }),
    new M.Indicate(dots[0].g, { color: C.pink, runTime: 0.8 }),
    ...say('CHECK TWO OTHER PARCELS', C.cyan)
  );

  const ring5 = new M.Circle({ radius: 0.29, color: C.green, strokeWidth: 3 });
  ring5.setFill(C.green, 0.14); ring5.moveTo(dots[3].p);
  const score5 = makeBadge('0', C.green, d2x(5), NY + 0.85, 17);

  await until(S(30));
  await play(
    new M.Create(ring5), new M.FadeIn(score5), new M.Flash(dots[3].d, { color: C.green }),
    ...fbox(['5-day parcel:', '5 − 5 = 0 days', ['score = 0', C.green]], C.green),
    ...say('5-DAY PARCEL: SCORE = 0', C.green)
  );

  const ring3 = new M.Circle({ radius: 0.29, color: C.pink, strokeWidth: 3 });
  ring3.setFill(C.pink, 0.14); ring3.moveTo(dots[0].p);
  const guide3 = new M.DashedLine({ start: [d2x(3), NY + 0.62, 0], end: [d2x(3), NY + 1.36, 0], color: C.pink });
  const gapArrL = makeArrow(d2x(5) - 0.04, d2x(3) + 0.04, NY + 1.36, C.pink, 3.4);
  const gapLabL = T('−2 days', 19, C.pink, true);
  gapLabL.moveTo([(d2x(5) + d2x(3)) / 2, NY + 1.64, 0]);

  await until(S(31));
  await play(
    new M.Create(ring3), new M.Create(guide3), new M.FadeIn(gapArrL), new M.FadeIn(gapLabL),
    ...fbox(['3-day parcel:', ['3 − 5 = −2 days', C.pink]], C.pink),
    ...say('3-DAY PARCEL: 3 − 5 = −2 DAYS', C.pink)
  );

  const score3 = makeBadge('−1.4', C.pink, d2x(3), NY + 0.85, 17);

  await until(S(32));
  await play(
    new M.FadeIn(score3), new M.Flash(dots[0].d, { color: C.pink }),
    ...fbox(['3-day parcel:', '−2 ÷ 1.41', ['score ≈ −1.4', C.pink]], C.pink),
    ...say('−2 ÷ 1.41 ≈ −1.4', C.pink)
  );

  const cuePos = new M.VGroup(
    makeArrow(d2x(5) + 0.12, d2x(7), SY + 0.05, C.amber, 3),
    T('+ above mean', 16, C.amber, true).moveTo([d2x(6), SY - 0.30, 0])
  );

  await until(S(33));
  await play(
    new M.FadeIn(cuePos), new M.Indicate(score7, { color: C.amber }), new M.Indicate(score5, { color: C.green }),
    ...fbox([['+ → above the mean', C.amber], ['0 → right on the mean', C.green]], C.green),
    ...say('+ ABOVE MEAN · 0 ON THE MEAN', C.green)
  );

  const cueNeg = new M.VGroup(
    makeArrow(d2x(5) - 0.12, d2x(3), SY + 0.05, C.pink, 3),
    T('− below mean', 16, C.pink, true).moveTo([d2x(4), SY - 0.30, 0])
  );

  await until(S(34));
  await play(
    new M.FadeIn(cueNeg), new M.Indicate(score3, { color: C.pink }),
    ...fbox([['+ → above the mean', C.amber], ['0 → right on the mean', C.green], ['− → below the mean', C.pink]], C.pink),
    ...say('− SCORE MEANS BELOW THE MEAN', C.pink)
  );

  // ===========================================================================
  // BEATS 35-39: The formula in one short line with a real fraction bar
  // ===========================================================================
  const FY = P ? 0.4 : -0.35;
  const fSize = P ? 18 : 22;
  const fLhs = T('standard score =', fSize, C.ink, false, true);
  const fNum = T('delivery time − mean', fSize, C.amber, false, true);
  const fDen = T('standard deviation', fSize, C.cyan, false, true);
  const wLhs = fLhs.getWidth();
  const wFrac = Math.max(fNum.getWidth(), fDen.getWidth()) + 0.36;
  const gapEq = 0.28;
  const rawTot = wLhs + gapEq + wFrac;
  const maxCardInner = P ? FW - 1.1 : 6.7;
  const fScale = rawTot > maxCardInner ? maxCardInner / rawTot : 1;
  if (fScale < 1) { fLhs.scale(fScale); fNum.scale(fScale); fDen.scale(fScale); }
  const sLhs = wLhs * fScale, sFrac = wFrac * fScale, sGap = gapEq * fScale;
  const sTot = sLhs + sGap + sFrac;
  const fStartX = CX - sTot / 2;
  const FX = fStartX + sLhs + sGap + sFrac / 2;

  fLhs.moveTo([fStartX + sLhs / 2, FY, 0]);
  fNum.moveTo([FX, FY + 0.42, 0]);
  fDen.moveTo([FX, FY - 0.42, 0]);
  const fBar = new M.Line({ start: [FX - sFrac / 2, FY, 0], end: [FX + sFrac / 2, FY, 0], color: C.cyan, strokeWidth: 3.5 });
  const fCard = new M.RoundedRectangle({ width: sTot + 0.65, height: 2.15, cornerRadius: 0.20, color: C.cyan, strokeWidth: 2.2 });
  fCard.setFill(C.card, 0.90); fCard.moveTo([CX, FY, 0]);

  const fGapNote = T('the gap (on top)', 16, C.amber); fGapNote.moveTo([FX, FY + 0.84, 0]);
  const fDivNote = T('bar = divide', 16, C.cyan); fDivNote.moveTo([FX, FY - 0.84, 0]);

  const stage1All = new M.VGroup(
    nlLine, nlTicksGrp, ...dots.map(o => o.g), meanLine, meanLab,
    ring7, guide7, gapArr, gapLab, score7,
    ring5, score5, ring3, guide3, gapArrL, gapLabL, score3, cuePos, cueNeg
  );

  await until(S(35));
  await play(
    new M.FadeOut(stage1All, { runTime: 0.7 }),
    new M.Create(fCard), new M.FadeIn(fLhs),
    ...fbox(['everything you did', ['in one short line', C.cyan]], C.cyan),
    ...say('ONE SHORT LINE ON SCREEN', C.cyan)
  );

  await until(S(36));
  await play(
    new M.FadeIn(fNum), new M.FadeIn(fGapNote),
    ...fbox(['top = the gap:', ['delivery time − mean', C.amber], ['e.g. 7 − 5 = 2', C.muted]], C.amber),
    ...say('TOP: DELIVERY TIME − MEAN', C.amber)
  );

  await until(S(37));
  await play(
    new M.Create(fBar), new M.FadeIn(fDen), new M.FadeIn(fDivNote),
    ...fbox(['bar = divide', ['bottom = SD', C.cyan], ['e.g. 1.41 days', C.muted]], C.cyan),
    ...say('BAR = DIVIDE · BOTTOM = SD', C.cyan)
  );

  await until(S(38));
  await play(
    new M.LaggedStart([
      new M.Indicate(fLhs, { color: C.green }),
      new M.Indicate(fNum, { color: C.amber }),
      new M.Indicate(fBar, { color: C.cyan }),
      new M.Indicate(fDen, { color: C.cyan })
    ], { lagRatio: 0.5, runTime: 3.2 }),
    ...fbox(['standard score =', '(time − mean) ÷ SD', ['(7 − 5) ÷ 1.41 ≈ 1.4', C.green]], C.green),
    ...say('GAP DIVIDED BY STANDARD DEVIATION', C.green)
  );

  const fStep1 = makeBadge('1. subtract → gap', C.amber, CX - (P ? 1.65 : 1.80), FY - 1.50, P ? 16 : 17);
  const fStep2 = makeBadge('2. divide → steps', C.cyan, CX + (P ? 1.65 : 1.80), FY - 1.50, P ? 16 : 17);

  await until(S(39));
  await play(
    new M.FadeIn(fStep1), new M.FadeIn(fStep2),
    new M.Indicate(fNum, { color: C.amber }), new M.Indicate(fBar, { color: C.cyan }),
    ...fbox([['1. subtract → get gap', C.amber], ['2. divide → count steps', C.cyan]], C.cyan),
    ...say('SUBTRACT FIRST, THEN DIVIDE', C.amber)
  );

  // ===========================================================================
  // BEATS 40-43: Back to the café's question — standard-score ruler (-3 to +3)
  // ===========================================================================
  const SW = P ? 6.6 : 7.0, SX0 = CX - SW / 2, STEP_U = SW / 6;
  const z2x = z => SX0 + (z + 3) * STEP_U;
  const ZY = P ? 0.1 : -0.65;

  const zLine = new M.Line({ start: [SX0, ZY, 0], end: [SX0 + SW, ZY, 0], color: C.muted, strokeWidth: 3 });
  const zTicks = [-3, -2, -1, 0, 1, 2, 3].map(z => new M.VGroup(
    new M.Line({ start: [z2x(z), ZY - 0.08, 0], end: [z2x(z), ZY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(z > 0 ? `+${z}` : z < 0 ? `−${-z}` : '0', P ? 17 : 18, C.muted, true).moveTo([z2x(z), ZY - 0.32, 0])
  ));
  const zUnit = T('standard score (steps)', 16, C.muted);
  zUnit.moveTo([CX, ZY - 0.68, 0]);
  const zTicksGrp = new M.VGroup(...zTicks, zUnit);
  const zMeanLine = new M.DashedLine({ start: [z2x(0), ZY - 0.10, 0], end: [z2x(0), ZY + 1.35, 0], color: C.amber });
  const zMeanLab = T('mean (0)', 16, C.amber, true); zMeanLab.moveTo([z2x(0), ZY + 1.56, 0]);

  const zDot7 = makeGlowDot(z2x(1.4), ZY + 0.42, C.amber, 0.13, 0.28);
  const zLab7 = makeBadge('7-day: +1.4', C.amber, z2x(1.4), ZY + 1.02, 16);

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(fCard, fLhs, fNum, fGapNote, fBar, fDen, fDivNote, fStep1, fStep2), { runTime: 0.7 }),
    new M.Create(zLine), new M.FadeIn(zTicksGrp),
    new M.Create(zMeanLine), new M.FadeIn(zMeanLab),
    new M.FadeIn(zDot7.g), new M.FadeIn(zLab7),
    ...fbox(['back to our café:', '7-day parcel = +1.4', ['unusually late?', C.amber]], C.amber),
    ...say('WAS 7 DAYS UNUSUALLY LATE?', C.amber)
  );

  const zBandMid = new M.Rectangle({ width: z2x(2) - z2x(-2), height: 0.90, color: C.green, strokeWidth: 0 });
  zBandMid.setFill(C.green, 0.14); zBandMid.moveTo([z2x(0), ZY + 0.45, 0]);
  const zEdgeL = new M.DashedLine({ start: [z2x(-2), ZY - 0.10, 0], end: [z2x(-2), ZY + 1.00, 0], color: C.green });
  const zEdgeR = new M.DashedLine({ start: [z2x(2), ZY - 0.10, 0], end: [z2x(2), ZY + 1.00, 0], color: C.green });
  const zMidLab = T('most results: within ±2 steps', 16, C.green, true);
  zMidLab.moveTo([CX, ZY - 1.15, 0]);

  await until(S(41));
  await play(
    new M.FadeIn(zBandMid), new M.Create(zEdgeL), new M.Create(zEdgeR), new M.FadeIn(zMidLab),
    ...fbox(['in many groups:', ['within ±2 steps', C.green], '= most results'], C.green),
    ...say('MOST RESULTS LAND WITHIN ±2 STEPS', C.green)
  );

  await until(S(42));
  await play(
    new M.Flash(zDot7.d, { color: C.green }), new M.Indicate(zLab7, { color: C.green }),
    ...fbox(['7-day parcel = +1.4', ['inside ±2 steps', C.green], ['a bit slow, not unusual', C.amber]], C.green),
    ...say('+1.4 STEPS: A BIT SLOW, NOT UNUSUAL', C.green)
  );

  const zBandOutL = new M.Rectangle({ width: z2x(-2) - z2x(-3), height: 0.90, color: C.pink, strokeWidth: 0 });
  zBandOutL.setFill(C.pink, 0.22); zBandOutL.moveTo([z2x(-2.5), ZY + 0.45, 0]);
  const zBandOutR = new M.Rectangle({ width: z2x(3) - z2x(2), height: 0.90, color: C.pink, strokeWidth: 0 });
  zBandOutR.setFill(C.pink, 0.22); zBandOutR.moveTo([z2x(2.5), ZY + 0.45, 0]);
  const zOutLabL = T('stands out', 14, C.pink, true); zOutLabL.moveTo([z2x(-2.5), ZY + 1.12, 0]);
  const zOutLabR = T('stands out', 14, C.pink, true); zOutLabR.moveTo([z2x(2.5), ZY + 1.12, 0]);

  await until(S(43));
  await play(
    new M.FadeIn(zBandOutL), new M.FadeIn(zBandOutR), new M.FadeIn(zOutLabL), new M.FadeIn(zOutLabR),
    ...fbox(['past ±2 or ±3 steps:', ['really stand out!', C.pink]], C.pink),
    ...say('PAST ±2 OR ±3 STEPS STANDS OUT', C.pink)
  );

  // ===========================================================================
  // BEATS 44-49: Compare two different groups on same days scale (0..8 days)
  // ===========================================================================
  const CW = P ? 6.6 : 7.0, CX0 = CX - CW / 2, CU = CW / 8;
  const c2x = v => CX0 + v * CU;
  const YA = P ? 1.25 : 0.15;
  const YB = P ? -1.65 : -2.05;

  function makeDays08(y) {
    const line = new M.Line({ start: [CX0, y, 0], end: [CX0 + CW, y, 0], color: C.muted, strokeWidth: 2.5 });
    const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => new M.VGroup(
      new M.Line({ start: [c2x(v), y - 0.07, 0], end: [c2x(v), y + 0.07, 0], color: C.muted, strokeWidth: 1.8 }),
      T(String(v), P ? 15 : 16, C.muted, true).moveTo([c2x(v), y - 0.28, 0])
    ));
    const unit = T('days', 15, C.muted); unit.moveTo([CX0 + CW - 0.15, y - 0.56, 0]);
    return { line, ticksGrp: new M.VGroup(...ticks, unit) };
  }

  // Top row: Café (mean = 5, SD = 1.41, parcel = 7 -> +2 d -> +1.4 steps)
  const cafeNL = makeDays08(YA);
  const cafeTitle = T('Café: mean 5 d, SD 1.41 d', P ? 16 : 17, C.cyan, false, true);
  cafeTitle.moveTo([CX0 + cafeTitle.getWidth() / 2, YA + 1.15, 0]);
  const cafeMean = new M.DashedLine({ start: [c2x(5), YA - 0.08, 0], end: [c2x(5), YA + 0.85, 0], color: C.amber });
  const cafeDot = makeGlowDot(c2x(7), YA, C.amber, 0.10, 0.21);
  const cafeSt1 = makeStepBlock(c2x(5), c2x(6.41), YA + 0.26, 0.26, C.cyan);
  const cafeSt2 = new M.VGroup(makeStepBlock(c2x(6.41), c2x(7), YA + 0.26, 0.26, C.violet), T('1.4 steps of 1.41 d', 16, C.cyan, true).moveTo([c2x(3), YA - 0.62, 0]));
  const cafeArr = makeArrow(c2x(5) + 0.03, c2x(7) - 0.03, YA + 0.60, C.amber, 3);
  const cafeGapLab = T('+2 days', 16, C.amber, true); cafeGapLab.moveTo([c2x(6), YA + 0.84, 0]);
  const cafeScore = makeBadge('score ≈ +1.4', C.amber, CX0 + CW - 0.95, YA + 1.15, P ? 15 : 16);

  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(
      zLine, zTicksGrp, zMeanLine, zMeanLab, zDot7.g, zLab7,
      zBandMid, zEdgeL, zEdgeR, zMidLab, zBandOutL, zBandOutR, zOutLabL, zOutLabR
    ), { runTime: 0.7 }),
    new M.Create(cafeNL.line), new M.FadeIn(cafeNL.ticksGrp),
    new M.FadeIn(cafeTitle), new M.Create(cafeMean), new M.FadeIn(cafeDot.g),
    new M.FadeIn(cafeSt1), new M.FadeIn(cafeSt2),
    new M.FadeIn(cafeArr), new M.FadeIn(cafeGapLab), new M.FadeIn(cafeScore),
    ...fbox(['compare different groups:', ['Café: score ≈ +1.4', C.amber]], C.cyan),
    ...say('COMPARE DIFFERENT GROUPS FAIRLY', C.cyan)
  );

  // Bottom row: Express courier (mean = 2, SD = 0.5, parcel = 3 -> +1 d -> +2.0 steps)
  const expNL = makeDays08(YB);
  const expTitle = T('Express: mean 2 d, SD 0.5 d', P ? 16 : 17, C.green, false, true);
  expTitle.moveTo([CX0 + expTitle.getWidth() / 2, YB + 1.15, 0]);
  const expMean = new M.DashedLine({ start: [c2x(2), YB - 0.08, 0], end: [c2x(2), YB + 0.85, 0], color: C.amber });
  const expSdCue = new M.VGroup(makeStepBlock(c2x(2), c2x(2.5), YB + 0.26, 0.26, C.green), T('1 step = 0.5 d', 16, C.green, true).moveTo([c2x(4), YB - 0.62, 0]));

  await until(S(45));
  await play(
    new M.Create(expNL.line), new M.FadeIn(expNL.ticksGrp),
    new M.FadeIn(expTitle), new M.Create(expMean), new M.FadeIn(expSdCue),
    ...fbox(['Express courier:', 'mean = 2 days', ['SD = 0.5 days', C.green]], C.green),
    ...say('EXPRESS: MEAN 2 d · SD 0.5 d', C.green)
  );

  const expDot = makeGlowDot(c2x(3), YB, C.pink, 0.10, 0.21);
  const expArr = makeArrow(c2x(2) + 0.03, c2x(3) - 0.03, YB + 0.60, C.pink, 3);
  const expGapLab = T('+1 day', 16, C.pink, true); expGapLab.moveTo([c2x(2.5), YB + 0.84, 0]);

  await until(S(46));
  await play(
    new M.FadeIn(expDot.g), new M.FadeIn(expArr), new M.FadeIn(expGapLab),
    new M.Indicate(cafeArr, { color: C.amber }),
    ...fbox(['Café delay:    +2 days', ['Express delay: +1 day', C.pink], '(smaller in days)'], C.pink),
    ...say('ONLY 1 DAY LATE (< CAFÉ’S 2 DAYS)', C.pink)
  );

  const expSt1 = new M.VGroup(makeStepBlock(c2x(2), c2x(2.5), YB + 0.26, 0.26, C.pink), T('2 steps of 0.5 d', 16, C.pink, true).moveTo([c2x(4), YB - 0.62, 0]));
  const expSt2 = makeStepBlock(c2x(2.5), c2x(3), YB + 0.26, 0.26, C.pink);
  const expScore = makeBadge('score = +2.0', C.pink, CX0 + CW - 0.95, YB + 1.15, P ? 15 : 16);

  await until(S(47));
  await play(
    new M.FadeOut(expSdCue),
    new M.LaggedStart([new M.FadeIn(expSt1), new M.FadeIn(expSt2)], { lagRatio: 0.35, runTime: 1.0 }),
    new M.FadeIn(expScore), new M.Flash(expDot.d, { color: C.pink }),
    ...fbox(['Express: 1 ÷ 0.5', ['= 2 steps fit!', C.pink], ['score = +2.0', C.pink]], C.pink),
    ...say('2 HALF-DAY STEPS → SCORE = +2.0', C.pink)
  );

  await until(S(48));
  await play(
    new M.Indicate(expScore, { color: C.pink }), new M.Indicate(cafeScore, { color: C.amber }),
    ...fbox(['Café:    +1.4 steps', ['Express: +2.0 steps', C.pink], ['2.0 > 1.4 → more unusual', C.pink]], C.pink),
    ...say('2.0 > 1.4: EXPRESS MORE UNUSUAL', C.pink)
  );

  await until(S(49));
  await play(
    new M.Indicate(cafeScore, { color: C.green }), new M.Indicate(expScore, { color: C.green }),
    ...fbox(['what it is for:', 'judge how unusual', ['even across groups', C.green]], C.green),
    ...say('JUDGE UNUSUALNESS ACROSS GROUPS', C.green)
  );

  // ===========================================================================
  // BEATS 50-51: Common trap #1 — Never measured in days, always steps!
  // ===========================================================================
  const TY = P ? 0.35 : -0.45;
  const cardW = P ? 3.15 : 3.35, cardH = 2.15;
  const lxC = CX - (P ? 1.72 : 1.88), rxC = CX + (P ? 1.72 : 1.88);

  const wBox = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.16, color: C.pink, strokeWidth: 2.5 });
  wBox.setFill(C.card, 0.92); wBox.moveTo([lxC, TY, 0]);
  const wBig = T('1.4 days', P ? 24 : 26, C.muted, true, true); wBig.moveTo([lxC, TY + 0.25, 0]);
  const wX1 = new M.Line({ start: [lxC - 1.15, TY + 0.62, 0], end: [lxC + 1.15, TY - 0.12, 0], color: C.pink, strokeWidth: 4.5 });
  const wX2 = new M.Line({ start: [lxC - 1.15, TY - 0.12, 0], end: [lxC + 1.15, TY + 0.62, 0], color: C.pink, strokeWidth: 4.5 });
  const wSub = T('NOT days late', 17, C.pink, false, true); wSub.moveTo([lxC, TY - 0.58, 0]);
  const trapWrong = new M.VGroup(wBox, wBig, wX1, wX2, wSub);

  const rBox = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.16, color: C.green, strokeWidth: 2.5 });
  rBox.setFill(C.card, 0.92); rBox.moveTo([rxC, TY, 0]);
  const rBig = T('1.4 steps', P ? 24 : 26, C.green, true, true); rBig.moveTo([rxC, TY + 0.48, 0]);
  const rMini1 = makeStepBlock(rxC - 1.05, rxC + 0.35, TY - 0.05, 0.34, C.cyan, '1', 14);
  const rMini2 = makeStepBlock(rxC + 0.39, rxC + 0.95, TY - 0.05, 0.34, C.amber, '.4', 13);
  const rSub = T('steps of spread', 17, C.green, false, true); rSub.moveTo([rxC, TY - 0.65, 0]);
  const trapRight = new M.VGroup(rBox, rBig, rMini1, rMini2, rSub);

  const cmpAll = new M.VGroup(
    cafeNL.line, cafeNL.ticksGrp, cafeTitle, cafeMean, cafeDot.g, cafeSt1, cafeSt2, cafeArr, cafeGapLab, cafeScore,
    expNL.line, expNL.ticksGrp, expTitle, expMean, expDot.g, expArr, expGapLab, expSt1, expSt2, expScore
  );

  await until(S(50));
  await play(
    new M.FadeOut(cmpAll, { runTime: 0.7 }),
    new M.FadeIn(trapWrong),
    ...fbox(['common trap:', ['NEVER measured in days!', C.pink]], C.pink),
    ...say('TRAP: NEVER MEASURED IN DAYS', C.pink)
  );

  await until(S(51));
  await play(
    new M.FadeIn(trapRight), new M.Indicate(trapRight, { color: C.green }),
    ...fbox([['1.4 ≠ days late', C.pink], ['1.4 = steps of spread', C.green]], C.green),
    ...say('1.4 MEANS STEPS OF SPREAD', C.green)
  );

  // ===========================================================================
  // BEATS 52-53: Common trap #2 — Extreme 21-day parcel stretches steps (1.41 -> 6.27)
  // ===========================================================================
  const OW = P ? 6.6 : 7.0, OX0 = CX - OW / 2, OU = OW / 22;
  const o2x = v => OX0 + v * OU;
  const OY1 = P ? 1.35 : 0.25;
  const OY2 = P ? -1.65 : -1.95;

  function makeDays022(y) {
    const line = new M.Line({ start: [OX0, y, 0], end: [OX0 + OW, y, 0], color: C.muted, strokeWidth: 2.5 });
    const ticks = [0, 5, 10, 15, 20].map(v => new M.VGroup(
      new M.Line({ start: [o2x(v), y - 0.07, 0], end: [o2x(v), y + 0.07, 0], color: C.muted, strokeWidth: 1.8 }),
      T(String(v), P ? 15 : 16, C.muted, true).moveTo([o2x(v), y - 0.28, 0])
    ));
    return { line, ticksGrp: new M.VGroup(...ticks) };
  }

  // Top: Normal week (3, 4, 4, 5, 6, 6, 7), mean = 5, SD = 1.41
  const outTopNL = makeDays022(OY1);
  const outTopTitle = T('Normal week: mean 5, step = 1.41 d', P ? 16 : 17, C.cyan, false, true);
  outTopTitle.moveTo([CX, OY1 + 1.02, 0]);
  const outTopDots = D.map((v, k) => {
    const up = D.slice(0, k).filter(x => x === v).length;
    return makeGlowDot(o2x(v), OY1 + 0.24 + up * 0.28, C.cyan, 0.08, 0.15).g;
  });
  const outTopMean = new M.DashedLine({ start: [o2x(5), OY1 - 0.08, 0], end: [o2x(5), OY1 + 0.72, 0], color: C.amber });
  const outTopStep = makeStepBlock(o2x(5), o2x(6.41), OY1 - 0.66, 0.26, C.cyan);
  const outTopStepLab = T('1.41 d', 15, C.cyan, true);
  outTopStepLab.moveTo([o2x(6.41) + 0.56, OY1 - 0.66, 0]);

  // Bottom: Late week (3, 4, 4, 5, 6, 6, 21), mean = 7, SD = 6.27
  const DL = [3, 4, 4, 5, 6, 6, 21];
  const outBotNL = makeDays022(OY2);
  const outBotTitle = T('With 21-day parcel: mean 7, step = 6.27 d', P ? 15 : 17, C.pink, false, true);
  outBotTitle.moveTo([CX, OY2 + 0.96, 0]);
  const outBotDotObjs = DL.map((v, k) => {
    const up = DL.slice(0, k).filter(x => x === v).length;
    return makeGlowDot(o2x(v), OY2 + 0.24 + up * 0.28, v === 21 ? C.pink : C.cyan, v === 21 ? 0.11 : 0.08, v === 21 ? 0.23 : 0.15);
  });
  const outBot21Lab = T('21 d', 16, C.pink, true); outBot21Lab.moveTo([o2x(21), OY2 + 0.58, 0]);
  const outBotMean = new M.DashedLine({ start: [o2x(7), OY2 - 0.08, 0], end: [o2x(7), OY2 + 0.72, 0], color: C.amber });
  const outBotStep = makeStepBlock(o2x(7), o2x(13.27), OY2 - 0.66, 0.28, C.pink, '6.27 d', 14);

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(trapWrong, trapRight), { runTime: 0.6 }),
    new M.Create(outTopNL.line), new M.FadeIn(outTopNL.ticksGrp), new M.FadeIn(outTopTitle),
    ...outTopDots.map(g => new M.FadeIn(g)), new M.Create(outTopMean),
    new M.FadeIn(outTopStep), new M.FadeIn(outTopStepLab),
    new M.Create(outBotNL.line), new M.FadeIn(outBotNL.ticksGrp), new M.FadeIn(outBotTitle),
    ...outBotDotObjs.map(o => new M.FadeIn(o.g)), new M.FadeIn(outBot21Lab),
    new M.Create(outBotMean), new M.FadeIn(outBotStep),
    new M.Flash(outBotDotObjs[6].d, { color: C.pink }),
    ...fbox(['extreme 21-day parcel:', 'mean: 5 → 7 days', ['step: 1.41 → 6.27 d', C.pink]], C.pink),
    ...say('ONE EXTREME PARCEL STRETCHES STEPS', C.pink)
  );

  // Beat 53: Another late parcel (11 days) looks like only +0.6 steps inside the stretched 6.27-day step
  const lateDot = makeGlowDot(o2x(11), OY2 + 0.24, C.amber, 0.10, 0.21);
  const lateDrop = new M.DashedLine({ start: [o2x(11), OY2 + 0.10, 0], end: [o2x(11), OY2 - 0.52, 0], color: C.amber });
  const lateLab = T('11 d → +0.6 steps', 15, C.amber, true);
  lateLab.moveTo([o2x(11.5), OY2 + 0.58, 0]);

  await until(S(53));
  await play(
    new M.FadeIn(lateDot.g), new M.Create(lateDrop), new M.FadeIn(lateLab),
    new M.Indicate(outBotStep, { color: C.amber }),
    ...fbox(['with 6.27-day steps:', 'an 11-day parcel is', ['only +0.6 steps!', C.amber], '(looks normal!)'], C.amber),
    ...say('LATE PARCELS LOOK CLOSER TO NORMAL', C.amber)
  );

  // ===========================================================================
  // BEAT 54: One-sentence recap
  // ===========================================================================
  const RW = P ? 6.4 : 6.8, RX0 = CX - RW / 2, RU = RW / 4;
  const r2x = z => RX0 + (z + 2) * RU;
  const RY = P ? 0.1 : -0.65;

  const recLine = new M.Line({ start: [RX0, RY, 0], end: [RX0 + RW, RY, 0], color: C.muted, strokeWidth: 3 });
  const recTicks = [-2, -1, 0, 1, 2].map(z => new M.VGroup(
    new M.Line({ start: [r2x(z), RY - 0.08, 0], end: [r2x(z), RY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(z > 0 ? `+${z}` : z < 0 ? `−${-z}` : '0', 18, C.muted, true).moveTo([r2x(z), RY - 0.34, 0])
  ));
  const recTicksGrp = new M.VGroup(...recTicks);
  const recMean = new M.DashedLine({ start: [r2x(0), RY - 0.10, 0], end: [r2x(0), RY + 1.05, 0], color: C.amber });
  const recMeanLab = T('mean (0)', 18, C.amber, true); recMeanLab.moveTo([r2x(0), RY + 1.28, 0]);

  const recNeg1 = makeStepBlock(r2x(-1), r2x(0), RY + 0.42, 0.42, C.pink, '−1 SD', 15);
  const recNeg2 = makeStepBlock(r2x(-2), r2x(-1), RY + 0.42, 0.42, C.pink, '−2 SD', 15);
  const recPos1 = makeStepBlock(r2x(0), r2x(1), RY + 0.42, 0.42, C.green, '+1 SD', 15);
  const recPos2 = makeStepBlock(r2x(1), r2x(2), RY + 0.42, 0.42, C.green, '+2 SD', 15);
  const recNegLab = T('← below mean (−)', 16, C.pink, true); recNegLab.moveTo([r2x(-1), RY - 0.80, 0]);
  const recPosLab = T('above mean (+) →', 16, C.green, true); recPosLab.moveTo([r2x(1), RY - 0.80, 0]);

  const outAll = new M.VGroup(
    outTopNL.line, outTopNL.ticksGrp, outTopTitle, ...outTopDots, outTopMean, outTopStep, outTopStepLab,
    outBotNL.line, outBotNL.ticksGrp, outBotTitle, ...outBotDotObjs.map(o => o.g), outBot21Lab, outBotMean, outBotStep,
    lateDot.g, lateDrop, lateLab
  );

  await until(S(54));
  await play(
    new M.FadeOut(outAll, { runTime: 0.7 }),
    new M.Create(recLine), new M.FadeIn(recTicksGrp),
    new M.Create(recMean), new M.FadeIn(recMeanLab),
    new M.LaggedStart([
      new M.FadeIn(recNeg1), new M.FadeIn(recNeg2),
      new M.FadeIn(recPos1), new M.FadeIn(recPos2)
    ], { lagRatio: 0.16, runTime: 1.4 }),
    new M.FadeIn(recNegLab), new M.FadeIn(recPosLab),
    ...fbox(['standard score:', 'how many SD steps', ['above (+) or below (−)', C.green], ['the mean', C.amber]], C.amber),
    ...say('SD STEPS ABOVE OR BELOW THE MEAN', C.amber)
  );
}

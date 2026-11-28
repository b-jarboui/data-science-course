// 1.3.8 Sensitivity to extremes: when one parcel changes everything (live manim-web lesson).
// Beat i = sentence i (0-based, 0..58). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const DN = [3, 4, 4, 5, 6, 6, 7];
  const DL = [3, 4, 4, 5, 6, 6, 21];
  const MAD_N = [0, 1, 1, 1, 1, 2, 2];
  const MAD_L = [0, 1, 1, 1, 1, 2, 16];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.2;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time (at most 3 lines), lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Shared number line: 2..8 days on 62% of the width, a break mark, then 8..22 squeezed
  const LW = P ? 6.8 : 8.0;
  const LX0 = CX - LW / 2;
  const AX_A = 0.62, AX_G = 0.05;
  const d2x = v => v <= 8 ? LX0 + ((v - 2) / 6) * AX_A * LW : LX0 + (AX_A + AX_G) * LW + ((v - 8) / 14) * (1 - AX_A - AX_G) * LW;
  const BRK_X = LX0 + (AX_A + AX_G / 2) * LW;
  const YN = P ? 1.45 : 0.20;
  const YL = P ? -1.35 : -2.0;
  const DOT_R = P ? 0.095 : 0.095;
  const HALO_R = P ? 0.17 : 0.175;
  const DOT_Y0 = P ? 0.26 : 0.24;
  const DOT_DY = P ? 0.30 : 0.30;

  function makeNumberLine(y, titleText, titleColor, showUnit = false) {
    const line = new M.Line({ start: [LX0, y, 0], end: [LX0 + LW, y, 0], color: C.muted, strokeWidth: 2.8 });
    const minorTicks = [];
    for (const v of [2, 3, 4, 5, 6, 7, 8, 21, 22]) {
      const major = [3, 4, 5, 6, 7, 21].includes(v);
      const h = major ? 0.09 : 0.045;
      minorTicks.push(new M.Line({ start: [d2x(v), y - h, 0], end: [d2x(v), y + h, 0], color: C.muted, strokeWidth: major ? 2 : 1.2 }));
    }
    const brkCover = new M.Rectangle({ width: 0.26, height: 0.3, color: C.bg, strokeWidth: 0 });
    brkCover.setFill(C.bg, 1); brkCover.moveTo([BRK_X, y, 0]);
    minorTicks.push(brkCover);
    for (const d of [-0.06, 0.06]) minorTicks.push(new M.Line({ start: [BRK_X + d - 0.05, y - 0.13, 0], end: [BRK_X + d + 0.05, y + 0.13, 0], color: C.muted, strokeWidth: 2 }));
    const tickLabels = [3, 4, 5, 6, 7, 21].map(v =>
      T(String(v), 17, C.muted, true).moveTo([d2x(v), y - 0.3, 0])
    );
    const title = T(titleText, P ? 17 : 17, titleColor, false, true);
    title.moveTo([LX0 + LW - 0.62 - title.getWidth() / 2, y - 0.64, 0]);
    const parts = [line, ...minorTicks, ...tickLabels, title];
    let unit = null;
    if (showUnit) {
      unit = T('days', P ? 16 : 16, C.muted);
      unit.moveTo([LX0 + LW - 0.22, y - 0.62, 0]);
      parts.push(unit);
    }
    return { line, minorTicks, tickLabels, title, unit, parts };
  }

  function makeDot(v, stackIdx, yBase, color = C.cyan) {
    const p = [d2x(v), yBase + DOT_Y0 + stackIdx * DOT_DY, 0];
    const halo = new M.Dot({ point: p, radius: HALO_R, color }); halo.setFill(color, 0.22);
    const core = new M.Dot({ point: p, radius: DOT_R, color }); core.setFill(color, 1);
    return { halo, core, p, v };
  }

  function makeArrow(x1, x2, y, color, sw = 2.6) {
    const dir = x2 >= x1 ? 1 : -1;
    const tip = Math.min(0.15, Math.abs(x2 - x1) * 0.35);
    const shaft = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const top = new M.Line({ start: [x2 - dir * tip, y + tip * 0.62, 0], end: [x2, y, 0], color, strokeWidth: sw });
    const bot = new M.Line({ start: [x2 - dir * tip, y - tip * 0.62, 0], end: [x2, y, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, top, bot);
  }

  function makeSpanBracket(x1, x2, y, color, labelText, labelDy = 0.26) {
    const bar = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 3 });
    const capL = new M.Line({ start: [x1, y - 0.12, 0], end: [x1, y + 0.12, 0], color, strokeWidth: 3 });
    const capR = new M.Line({ start: [x2, y - 0.12, 0], end: [x2, y + 0.12, 0], color, strokeWidth: 3 });
    const lab = T(labelText, P ? 17 : 17, color, true, true);
    lab.moveTo([(x1 + x2) / 2, y + labelDy, 0]);
    return { bar, capL, capR, lab, parts: [bar, capL, capR, lab] };
  }

  function makeParcelIcon(x, y, color = C.cyan, ribbon = C.amber) {
    const w = P ? 0.54 : 0.58, h = P ? 0.44 : 0.48;
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.07, color, strokeWidth: 2 });
    box.setFill(color, 0.22); box.moveTo([x, y, 0]);
    const hLine = new M.Line({ start: [x - w / 2, y, 0], end: [x + w / 2, y, 0], color: ribbon, strokeWidth: 2 });
    const vLine = new M.Line({ start: [x, y - h / 2, 0], end: [x, y + h / 2, 0], color: ribbon, strokeWidth: 2 });
    return new M.VGroup(box, hLine, vLine);
  }

  function makeChip(x, y, text, color = C.cyan) {
    const w = P ? 0.76 : 0.84, h = P ? 0.56 : 0.56;
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.11, color, strokeWidth: 2 });
    box.setFill(color, 0.16); box.moveTo([x, y, 0]);
    const lab = T(String(text), P ? 20 : 21, color, true, true);
    lab.moveTo([x, y, 0]);
    return { box, lab, g: new M.VGroup(box, lab), x, y };
  }

  // --- 0-2: Intro — café coffee parcels & two weeks ---
  const introSp = P ? 0.86 : 0.96;
  const introY1 = P ? 1.75 : 0.35;
  const introY2 = P ? -0.35 : -1.35;
  const parcelsN = DN.map((_, k) => makeParcelIcon(CX + (k - 3) * introSp, introY1));
  await until(S(0));
  await play(
    new M.LaggedStart(parcelsN.map(p => new M.FadeIn(p)), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox(['a café mails', ['coffee beans', C.cyan]], C.cyan),
    ...say('CAFÉ COFFEE PARCELS', C.cyan)
  );

  const introLabN = T('Normal week (7 parcels)', P ? 18 : 18, C.cyan, false, true);
  introLabN.moveTo([CX, introY1 + 0.58, 0]);
  const introLabL = T('Late week (7 parcels)', P ? 18 : 18, C.muted, false, true);
  introLabL.moveTo([CX, introY2 + 0.58, 0]);
  const parcelsL = DL.map((_, k) => makeParcelIcon(CX + (k - 3) * introSp, introY2));
  await until(S(1));
  await play(
    new M.FadeIn(introLabN), new M.FadeIn(introLabL),
    new M.LaggedStart(parcelsL.map(p => new M.FadeIn(p)), { lagRatio: 0.09, runTime: 1.3 }),
    ...fbox(['compare 2 weeks', ['7 parcels each', C.cyan]], C.cyan),
    ...say('2 WEEKS · 7 PARCELS EACH', C.cyan)
  );

  const lateParcelX = CX + 3 * introSp + (P ? 0.52 : 0.72);
  const lateParcelPink = makeParcelIcon(lateParcelX, introY2, C.pink, C.pink);
  const lateQ = T('wildly late?', P ? 16 : 16, C.pink, true);
  lateQ.moveTo([lateParcelX, introY2 - 0.52, 0]);
  await until(S(2));
  await play(
    new M.FadeOut(parcelsL[6]), new M.FadeIn(lateParcelPink), new M.FadeIn(lateQ),
    new M.Flash(lateParcelPink, { color: C.pink }),
    ...fbox(['what if one parcel', ['is very late?', C.pink]], C.pink),
    ...say('WHAT IF 1 PARCEL GOES LATE?', C.pink)
  );

  // --- 3-5: Normal week on the days number line ---
  const nlN = makeNumberLine(YN, 'Normal week', C.cyan, true);
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...parcelsN, ...parcelsL.slice(0, 6), lateParcelPink, introLabN, introLabL, lateQ), { runTime: 0.5 }),
    ...fbox(['normal week', ['on a days line', C.cyan]], C.cyan),
    ...say('NORMAL WEEK (IN DAYS)', C.cyan)
  );
  await play(
    new M.Create(nlN.line, { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...nlN.minorTicks, ...nlN.tickLabels, nlN.title, nlN.unit), { runTime: 0.9 })
  );

  const dotsN = DN.map((v, k) => makeDot(v, DN.slice(0, k).filter(x => x === v).length, YN, C.cyan));
  await until(S(4));
  await play(
    new M.LaggedStart(dotsN.slice(0, 4).flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.core)]), { lagRatio: 0.14, runTime: 1.8 }),
    ...fbox(['normal week:', ['3, 4, 4, 5, ...', C.cyan]], C.cyan),
    ...say('3, 4, 4, AND 5 DAYS', C.cyan)
  );

  await until(S(5));
  await play(
    new M.LaggedStart(dotsN.slice(4).flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.core)]), { lagRatio: 0.16, runTime: 1.3 }),
    ...fbox(['normal week:', ['3, 4, 4, 5, 6, 6, 7', C.cyan]], C.cyan),
    ...say('THEN 6, 6, AND 7 DAYS', C.cyan)
  );

  // --- 6-10: Late week & extreme value at 21 ---
  const nlL = makeNumberLine(YL, 'Late week', C.pink, true);
  const dotsL6 = DL.slice(0, 6).map((v, k) => makeDot(v, DL.slice(0, k).filter(x => x === v).length, YL, C.cyan));
  await until(S(6));
  await play(
    new M.Create(nlL.line, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...nlL.minorTicks, ...nlL.tickLabels, nlL.title, nlL.unit), { runTime: 0.8 }),
    new M.LaggedStart(dotsL6.flatMap(o => [new M.FadeIn(o.halo), new M.FadeIn(o.core)]), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox(['normal: 3,4,4,5,6,6,7', ['late:   3,4,4,5,6,6,_', C.muted]], C.cyan),
    ...say('LATE WEEK: FIRST 6 UNCHANGED', C.cyan)
  );

  const dotL7 = makeDot(7, 0, YL, C.cyan);
  await until(S(7));
  await play(
    new M.FadeIn(dotL7.halo), new M.FadeIn(dotL7.core),
    new M.Indicate(dotL7.core, { color: C.pink }),
    ...fbox(['7th parcel lost:', ['7 days → 21 days', C.pink]], C.pink),
    ...say('7TH PARCEL TAKES 21 DAYS', C.pink)
  );

  const dotL21Target = makeDot(21, 0, YL, C.pink);
  const slideTrail = new M.DashedLine({ start: [d2x(7) + 0.14, dotL7.p[1], 0], end: [d2x(21) - 0.18, dotL7.p[1], 0], color: C.pink });
  const lab21 = T('21', P ? 16 : 17, C.pink, true, true);
  lab21.moveTo([d2x(21), dotL21Target.p[1] + 0.36, 0]);
  await until(S(8));
  await play(
    new M.Transform(dotL7.halo, dotL21Target.halo, { runTime: 1.5 }),
    new M.Transform(dotL7.core, dotL21Target.core, { runTime: 1.5 }),
    new M.Create(slideTrail, { runTime: 1.5 }),
    new M.FadeIn(lab21, { runTime: 1.5 }),
    ...fbox(['normal: 3,4,4,5,6,6,7', ['late:   3,4,4,5,6,6,21', C.pink]], C.pink),
    ...say('SLIDES FAR RIGHT TO 21', C.pink)
  );

  const extRing = new M.Circle({ radius: 0.30, color: C.pink, strokeWidth: 2.5 });
  extRing.setFill(C.pink, 0.12); extRing.moveTo(dotL21Target.p);
  const extGapLab = T('far from the rest', P ? 16 : 16, C.pink);
  extGapLab.moveTo([d2x(14), dotL21Target.p[1] + 0.32, 0]);
  await until(S(9));
  await play(
    new M.Create(extRing), new M.FadeIn(extGapLab),
    ...fbox(['far from the rest', ['= extreme value', C.pink]], C.pink),
    ...say('EXTREME VALUE', C.pink)
  );

  const extTag = pill('EXTREME: 21', C.pink, 15);
  extTag.moveTo([d2x(17.5), YL + 0.88, 0]);
  await until(S(10));
  await play(
    new M.FadeIn(extTag), new M.Flash(dotL7.core, { color: C.pink }),
    ...say('21 DAYS = EXTREME VALUE', C.pink)
  );

  // --- 11-18: Center tool 1 — Mean ---
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(slideTrail, extRing, extGapLab, extTag), { runTime: 0.7 }),
    ...fbox(['two center tools:', ['1. mean', C.amber], ['2. median', C.green]], C.amber),
    ...say('CENTER: MEAN VS MEDIAN', C.amber)
  );

  await until(S(12));
  await play(
    new M.LaggedStart(dotsN.map(o => new M.Indicate(o.core, { color: C.amber })), { lagRatio: 0.12, runTime: 1.6 }),
    ...fbox(['mean:', 'add all 7 days', ['share across 7', C.amber]], C.amber),
    ...say('MEAN = TOTAL ÷ 7', C.amber)
  );

  await until(S(13));
  await play(
    new M.LaggedStart(dotsN.map(o => new M.Indicate(o.halo, { color: C.amber })), { lagRatio: 0.1, runTime: 1.4 }),
    ...fbox(['normal week:', '3+4+4+5+6+6+7', ['total = 35 days', C.amber]], C.amber),
    ...say('NORMAL TOTAL = 35 DAYS', C.amber)
  );

  const meanLineN = new M.DashedLine({ start: [d2x(5), YN - 0.10, 0], end: [d2x(5), YN + 0.96, 0], color: C.amber });
  const meanTagN = pill('MEAN = 5', C.amber, 15);
  meanTagN.moveTo([d2x(5.6), YN + 1.24, 0]);
  await until(S(14));
  await play(
    new M.Create(meanLineN), new M.FadeIn(meanTagN),
    ...fbox(['normal mean:', '35 ÷ 7', ['= 5 days', C.amber]], C.amber),
    ...say('NORMAL MEAN = 5 DAYS', C.amber)
  );

  const add14Arr = makeArrow(d2x(7), d2x(21) - 0.14, YL + 0.62, C.pink, 3);
  const add14Lab = T('+14 extra days', P ? 16 : 17, C.pink, true, true);
  add14Lab.moveTo([d2x(14), YL + 0.90, 0]);
  await until(S(15));
  await play(
    new M.FadeIn(add14Arr), new M.FadeIn(add14Lab),
    new M.Flash(dotL7.core, { color: C.pink }),
    ...fbox(['late week change:', '7 → 21', ['+14 extra days', C.pink]], C.pink),
    ...say('7 → 21 ADDS +14 DAYS', C.pink)
  );

  await until(S(16));
  await play(
    new M.Indicate(add14Lab, { color: C.amber }),
    ...fbox(['late total:', '35 + 14', ['= 49 days', C.pink]], C.pink),
    ...say('TOTAL: 35 → 49 DAYS', C.pink)
  );

  await until(S(17));
  await play(
    new M.LaggedStart([...dotsL6.map(o => o.core), dotL7.core].map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.14, runTime: 1.8 }),
    ...fbox(['share +14 across 7:', '14 ÷ 7', ['= +2 days each', C.amber]], C.amber),
    ...say('+14 ÷ 7 = +2 DAYS EACH', C.amber)
  );

  const meanRef5 = new M.DashedLine({ start: [d2x(5), YL - 0.10, 0], end: [d2x(5), YL + 0.94, 0], color: C.muted });
  const meanLineL = new M.DashedLine({ start: [d2x(7), YL - 0.10, 0], end: [d2x(7), YL + 0.96, 0], color: C.pink });
  const meanShiftArr = makeArrow(d2x(5) + 0.04, d2x(7) - 0.04, YL + 0.80, C.pink, 2.8);
  const meanShiftLab = T('+2', P ? 15 : 16, C.pink, true, true);
  meanShiftLab.moveTo([d2x(6), YL + 1.00, 0]);
  const meanTagL = pill('MEAN = 7', C.pink, 15);
  meanTagL.moveTo([d2x(8.8), YL + 1.24, 0]);
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(add14Arr, add14Lab), { runTime: 0.6 }),
    new M.Create(meanRef5), new M.Create(meanLineL),
    new M.FadeIn(meanShiftArr), new M.FadeIn(meanShiftLab), new M.FadeIn(meanTagL),
    ...fbox(['late mean = 49 ÷ 7', ['5 → 7 days (+2)', C.pink]], C.pink),
    ...say('MEAN CLIMBED: 5 → 7 DAYS', C.pink)
  );

  // --- 19-22: Center tool 2 — Median ---
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(meanLineN, meanTagN, meanRef5, meanLineL, meanShiftArr, meanShiftLab, meanTagL), { runTime: 0.7 }),
    ...fbox(['median:', ['middle of 7 sorted', C.green], ['= 4th parcel', C.ink]], C.green),
    ...say('MEDIAN = MIDDLE PARCEL', C.green)
  );

  const medRingN = new M.Circle({ radius: 0.25, color: C.green, strokeWidth: 2.8 });
  medRingN.setFill(C.green, 0.16); medRingN.moveTo(dotsN[3].p);
  const medLineN = new M.DashedLine({ start: [d2x(5), YN - 0.10, 0], end: [d2x(5), YN + 0.96, 0], color: C.green });
  const medTagN = pill('MEDIAN = 5', C.green, 15);
  medTagN.moveTo([d2x(6.2), YN + 1.24, 0]);
  await until(S(20));
  await play(
    new M.Create(medLineN), new M.Create(medRingN), new M.FadeIn(medTagN),
    ...fbox(['normal sorted:', '3, 4, 4, [5], 6, 6, 7', ['median = 5 days', C.green]], C.green),
    ...say('NORMAL MEDIAN = 5 DAYS', C.green)
  );

  const medRingL = new M.Circle({ radius: 0.25, color: C.green, strokeWidth: 2.8 });
  medRingL.setFill(C.green, 0.16); medRingL.moveTo(dotsL6[3].p);
  const medLineL = new M.DashedLine({ start: [d2x(5), YL - 0.10, 0], end: [d2x(5), YL + 0.96, 0], color: C.green });
  await until(S(21));
  await play(
    new M.Flash(dotL7.core, { color: C.pink }),
    new M.Create(medLineL), new M.Create(medRingL),
    ...fbox(['late sorted:', '3, 4, 4, [5], 6, 6, 21', ['4th parcel does not move', C.green]], C.green),
    ...say('4TH PARCEL STAYS AT 5', C.green)
  );

  const medTagL = pill('STILL 5', C.green, 15);
  medTagL.moveTo([d2x(6.0), YL + 1.24, 0]);
  await until(S(22));
  await play(
    new M.FadeIn(medTagL, { runTime: 0.8 }),
    new M.Indicate(medRingL, { color: C.green, runTime: 0.8 }),
    ...say('MEDIAN: STILL 5 DAYS', C.green)
  );

  // --- 23-29: Spread tools — Range vs IQR ---
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(medRingN, medLineN, medTagN, medRingL, medLineL, medTagL), { runTime: 0.7 }),
    ...fbox(['spread tools:', ['1. range (full span)', C.amber], ['2. IQR (middle half)', C.green]], C.cyan),
    ...say('SPREAD: RANGE VS IQR', C.cyan)
  );

  await until(S(24));
  await play(
    new M.Indicate(dotsN[0].core, { color: C.amber }),
    new M.Indicate(dotsN[6].core, { color: C.amber }),
    ...fbox(['range:', ['longest − shortest', C.amber]], C.amber),
    ...say('RANGE = LONGEST − SHORTEST', C.amber)
  );

  const rngN = makeSpanBracket(d2x(3), d2x(7), YN + 0.86, C.amber, 'range = 4', 0.28);
  await until(S(25));
  await play(
    new M.Create(rngN.bar), new M.FadeIn(rngN.capL), new M.FadeIn(rngN.capR), new M.FadeIn(rngN.lab),
    ...fbox(['normal range:', '7 − 3', ['= 4 days', C.amber]], C.amber),
    ...say('NORMAL RANGE = 4 DAYS', C.amber)
  );

  const rngL = makeSpanBracket(d2x(3), d2x(21), YL + 0.80, C.pink, 'range = 18', 0.28);
  await until(S(26));
  await play(
    new M.Create(rngL.bar, { runTime: 1.3 }),
    new M.FadeIn(rngL.capL), new M.FadeIn(rngL.capR), new M.FadeIn(rngL.lab),
    ...fbox(['late range:', '21 − 3 = 18 days', ['jumped: 4 → 18', C.pink]], C.pink),
    ...say('LATE RANGE = 18 DAYS!', C.pink)
  );

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...rngN.parts, ...rngL.parts), { runTime: 0.7 }),
    ...fbox(['IQR:', ['interquartile range', C.green], ['width of middle half', C.muted]], C.green),
    ...say('IQR = WIDTH OF MIDDLE HALF', C.green)
  );

  const iqrW = d2x(6) - d2x(4);
  const iqrH = 0.78;
  const iqrBoxN = new M.Rectangle({ width: iqrW, height: iqrH, color: C.green, strokeWidth: 2.5 });
  iqrBoxN.setFill(C.green, 0.16); iqrBoxN.moveTo([d2x(5), YN + iqrH / 2 + 0.04, 0]);
  const iqrTagN = pill('IQR = 2', C.green, 15);
  iqrTagN.moveTo([d2x(5.4), YN + 1.18, 0]);
  await until(S(28));
  await play(
    new M.Create(iqrBoxN), new M.FadeIn(iqrTagN),
    ...fbox(['middle half: 4 to 6', '6 − 4', ['IQR = 2 days', C.green]], C.green),
    ...say('NORMAL IQR = 2 DAYS', C.green)
  );

  const iqrBoxL = new M.Rectangle({ width: iqrW, height: iqrH, color: C.green, strokeWidth: 2.5 });
  iqrBoxL.setFill(C.green, 0.16); iqrBoxL.moveTo([d2x(5), YL + iqrH / 2 + 0.04, 0]);
  const iqrTagL = pill('STILL 2', C.green, 15);
  iqrTagL.moveTo([d2x(5.4), YL + 1.18, 0]);
  await until(S(29));
  await play(
    new M.Create(iqrBoxL), new M.FadeIn(iqrTagL),
    new M.Flash(dotL7.core, { color: C.pink }),
    ...fbox(['21 sits outside 4..6', 'late IQR = 6 − 4', ['still 2 days', C.green]], C.green),
    ...say('IQR: STILL 2 DAYS', C.green)
  );

  // --- 30-37: Typical distance 1 — Standard deviation ---
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(iqrBoxN, iqrTagN, iqrBoxL, iqrTagL), { runTime: 0.7 }),
    ...fbox(['typical distance:', ['1. standard deviation', C.amber], ['2. MAD', C.green]], C.cyan),
    ...say('TYPICAL DISTANCE FROM CENTER', C.cyan)
  );

  const sdMeanN = new M.DashedLine({ start: [d2x(5), YN - 0.10, 0], end: [d2x(5), YN + 1.02, 0], color: C.amber });
  const sdGapL1 = makeArrow(d2x(5) - 0.03, d2x(4) + 0.08, YN + DOT_Y0, C.pink, 2.2);
  const sdGapL2 = makeArrow(d2x(5) - 0.03, d2x(4) + 0.08, YN + DOT_Y0 + DOT_DY, C.pink, 2.2);
  const sdGapL3 = makeArrow(d2x(5) - 0.03, d2x(3) + 0.04, YN + 0.84, C.pink, 2.4);
  const sdGuide3 = new M.DashedLine({ start: [d2x(3), YN + DOT_Y0 + 0.10, 0], end: [d2x(3), YN + 0.84, 0], color: C.pink });
  const sdGapR1 = makeArrow(d2x(5) + 0.03, d2x(6) - 0.08, YN + DOT_Y0, C.green, 2.2);
  const sdGapR2 = makeArrow(d2x(5) + 0.03, d2x(6) - 0.08, YN + DOT_Y0 + DOT_DY, C.green, 2.2);
  const sdGapR3 = makeArrow(d2x(5) + 0.03, d2x(7) - 0.04, YN + 0.84, C.green, 2.4);
  const sdGuide7 = new M.DashedLine({ start: [d2x(7), YN + DOT_Y0 + 0.10, 0], end: [d2x(7), YN + 0.84, 0], color: C.green });
  const sdGapsN = [sdGapL1, sdGapL2, sdGapL3, sdGuide3, sdGapR1, sdGapR2, sdGapR3, sdGuide7];
  await until(S(31));
  await play(
    new M.Create(sdMeanN),
    new M.LaggedStart(sdGapsN.map(x => new M.FadeIn(x)), { lagRatio: 0.09, runTime: 1.4 }),
    ...fbox(['standard deviation:', ['gaps from mean 5', C.amber], ['−2,−1,−1,0,+1,+1,+2', C.muted]], C.amber),
    ...say('SD: GAPS FROM THE MEAN', C.amber)
  );

  // Small real squares (4, 1, 1, 0, 1, 1, 4) placed in the empty right half of the Normal row
  const sqSidesN = [2, 1, 1, 0, 1, 1, 2];
  const suN = P ? 0.22 : 0.2;
  const sqGapN = 0.1;
  const sqWidthsN = sqSidesN.map(s => (s ? s * suN : 0.24));
  const sqRowW = sqWidthsN.reduce((a, b) => a + b, 0) + 6 * sqGapN;
  const sqCenterX = LX0 + 0.15 + sqRowW / 2;
  const sqTopY = YN - 0.52, sqBotY = YL + DOT_Y0 + DOT_DY + HALO_R + 0.08;
  const sqBase = sqBotY + 0.12;
  const sqCard = new M.RoundedRectangle({ width: sqRowW + 0.3, height: sqTopY - sqBotY, cornerRadius: 0.12, color: C.violet, strokeWidth: 2 });
  sqCard.setFill(C.card, 0.95); sqCard.moveTo([sqCenterX, (sqTopY + sqBotY) / 2, 0]);
  let sqCurX = sqCenterX - sqRowW / 2;
  const sdSqRects = [];
  const sdSqLabels = [];
  for (let k = 0; k < 7; k++) {
    const s = sqSidesN[k];
    const cx = sqCurX + sqWidthsN[k] / 2;
    sqCurX += sqWidthsN[k] + sqGapN;
    if (s > 0) {
      const r = new M.Rectangle({ width: s * suN, height: s * suN, color: C.violet, strokeWidth: 2 });
      r.setFill(C.violet, 0.34);
      r.moveTo([cx, sqBase + (s * suN) / 2, 0]);
      sdSqRects.push(r);
      const lb = T(String(s * s), P ? 15 : 16, C.amber, true);
      lb.moveTo([cx, sqBase + s * suN + 0.2, 0]);
      sdSqLabels.push(lb);
    } else {
      const z = new M.Dot({ point: [cx, sqBase + 0.06, 0], radius: 0.06, color: C.amber });
      z.setFill(C.amber, 1);
      sdSqRects.push(z);
      const lb = T('0', P ? 15 : 16, C.amber, true);
      lb.moveTo([cx, sqBase + 0.3, 0]);
      sdSqLabels.push(lb);
    }
  }
  await until(S(32));
  await play(
    new M.FadeIn(sqCard),
    new M.LaggedStart([...sdSqRects, ...sdSqLabels].map(x => new M.FadeIn(x)), { lagRatio: 0.06, runTime: 1.5 }),
    ...fbox(['square each gap:', ['4, 1, 1, 0, 1, 1, 4', C.violet], ['sum = 12 sq days', C.amber]], C.violet),
    ...say('SQUARE EACH GAP (GAP × GAP)', C.violet)
  );

  await until(S(33));
  await play(
    new M.LaggedStart(sdSqRects.map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['average squares (÷ 6):', '12 ÷ 6 = 2 sq days', ['undo square: √2', C.cyan]], C.cyan),
    ...say('AVERAGE SQUARES, THEN √', C.cyan)
  );

  const sdTagN = pill('SD = 1.41', C.amber, 15);
  sdTagN.moveTo([d2x(5.6), YN + 1.24, 0]);
  await until(S(34));
  await play(
    new M.FadeIn(sdTagN),
    ...fbox(['normal week SD:', ['= 1.41 days', C.amber], ['(about 1.5 days)', C.muted]], C.amber),
    ...say('NORMAL SD = 1.41 DAYS', C.amber)
  );

  const sdMeanL = new M.DashedLine({ start: [d2x(7), YL - 0.10, 0], end: [d2x(7), YL + 0.96, 0], color: C.amber });
  const sdMeanTagL = T('mean = 7', P ? 15 : 16, C.amber, true);
  sdMeanTagL.moveTo([d2x(7), YL + 1.12, 0]);
  const sdArr14 = makeArrow(d2x(7) + 0.04, d2x(21) - 0.14, YL + 0.56, C.pink, 3.2);
  const sdLab14 = T('+14 days', P ? 17 : 18, C.pink, true, true);
  sdLab14.moveTo([d2x(14), YL + 0.84, 0]);
  await until(S(35));
  await play(
    new M.Create(sdMeanL), new M.FadeIn(sdMeanTagL),
    new M.FadeIn(sdArr14), new M.FadeIn(sdLab14),
    new M.Flash(dotL7.core, { color: C.pink }),
    ...fbox(['late mean = 7 days', '21 − 7', ['gap = +14 days', C.pink]], C.pink),
    ...say('PINK PARCEL: +14 ABOVE MEAN', C.pink)
  );

  // True-to-scale square comparison: normal biggest (2x2 = 4) vs late pink (14x14 = 196)
  const sqU = P ? 0.148 : 0.13;
  const cmpY = P ? 1.72 : 0.46;
  const bigSide = 14 * sqU;
  const smallSide = 2 * sqU;
  const smallX = CX - (P ? 1.85 : 2.15);
  const bigX = CX + (P ? 0.85 : 0.65);

  const cmpSmallSq = new M.Rectangle({ width: smallSide, height: smallSide, color: C.cyan, strokeWidth: 2.2 });
  cmpSmallSq.setFill(C.cyan, 0.35); cmpSmallSq.moveTo([smallX, cmpY, 0]);
  const cmpSmallTop = T('normal biggest', P ? 15 : 16, C.muted);
  cmpSmallTop.moveTo([smallX, cmpY + 0.44, 0]);
  const cmpSmallLab = T('2 × 2 = 4', P ? 17 : 17, C.cyan, true, true);
  cmpSmallLab.moveTo([smallX, cmpY - 0.42, 0]);

  const cmpBigSq = new M.Rectangle({ width: bigSide, height: bigSide, color: C.pink, strokeWidth: 3 });
  cmpBigSq.setFill(C.pink, 0.24); cmpBigSq.moveTo([bigX, cmpY, 0]);
  const cmpBigLab1 = T('14 × 14', P ? 20 : 20, C.pink, true, true);
  cmpBigLab1.moveTo([bigX, cmpY + 0.22, 0]);
  const cmpBigLab2 = T('= 196', P ? 24 : 24, C.ink, true, true);
  cmpBigLab2.moveTo([bigX, cmpY - 0.20, 0]);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...nlN.parts, ...dotsN.flatMap(o => [o.halo, o.core]), sdMeanN, ...sdGapsN, sqCard, ...sdSqRects, ...sdSqLabels, sdTagN), { runTime: 0.45 }),
    ...say('14 × 14 = 196 (HUGE SQUARE!)', C.pink)
  );
  await play(
    new M.Create(cmpSmallSq, { runTime: 0.7 }), new M.FadeIn(cmpSmallTop, { runTime: 0.7 }), new M.FadeIn(cmpSmallLab, { runTime: 0.7 }),
    new M.Create(cmpBigSq, { runTime: 1.1 }), new M.FadeIn(cmpBigLab1, { runTime: 1.1 }), new M.FadeIn(cmpBigLab2, { runTime: 1.1 }),
    ...fbox(['14 × 14 = 196', 'sum of squares = 236', ['236 ÷ 6 ≈ 39.3', C.pink]], C.pink)
  );

  const sdTagL = pill('SD = 6.27', C.pink, 15);
  sdTagL.moveTo([d2x(14), YL + 1.32, 0]);
  await until(S(37));
  await play(
    new M.Indicate(cmpBigSq, { color: C.pink }),
    new M.FadeIn(sdTagL),
    ...fbox(['late SD = √39.3', ['= 6.27 days', C.pink], ['(was 1.41 days)', C.muted]], C.pink),
    ...say('SD JUMPED: 1.41 → 6.27 DAYS', C.pink)
  );

  // --- 38-42: Typical distance 2 — MAD ---
  const chipSp = P ? 0.94 : 1.04;
  const madYN = P ? 1.8 : 0.45;
  const madYL = P ? -0.55 : -1.75;
  const madTitleN = T('Normal week: distances from median 5 (sorted)', P ? 16 : 17, C.cyan, false, true);
  madTitleN.moveTo([CX, madYN + 0.68, 0]);
  const madChipsN = MAD_N.map((v, k) => makeChip(CX + (k - 3) * chipSp, madYN, v, C.cyan));
  const madRankLabs = MAD_N.map((_, k) =>
    T(k === 3 ? '4th' : String(k + 1), 15, k === 3 ? C.green : C.muted, true).moveTo([CX + (k - 3) * chipSp, madYN - 0.50, 0])
  );

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(
      ...nlL.parts, ...dotsL6.flatMap(o => [o.halo, o.core]), dotL7.halo, dotL7.core, lab21,
      sdMeanL, sdMeanTagL, sdArr14, sdLab14, cmpSmallSq, cmpSmallTop, cmpSmallLab, cmpBigSq, cmpBigLab1, cmpBigLab2, sdTagL
    ), { runTime: 0.45 }),
    ...say('LINE UP DISTANCES FROM MEDIAN', C.cyan)
  );
  await play(
    new M.FadeIn(madTitleN, { runTime: 0.8 }),
    new M.LaggedStart(madChipsN.map(c => new M.FadeIn(c.g)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...madRankLabs), { runTime: 0.9 }),
    ...fbox(['distances from median 5:', ['0, 1, 1, 1, 1, 2, 2', C.cyan], ['pick the middle one', C.green]], C.cyan)
  );

  await until(S(39));
  await play(
    new M.Indicate(madChipsN[3].g, { color: C.green }),
    ...fbox(['MAD:', ['median absolute', C.green], ['deviation', C.green]], C.green),
    ...say('MEDIAN ABSOLUTE DEVIATION (MAD)', C.green)
  );

  const madMidBoxN = new M.RoundedRectangle({ width: (P ? 0.92 : 1.00), height: 0.72, cornerRadius: 0.14, color: C.green, strokeWidth: 3 });
  madMidBoxN.setFill(C.green, 0.12); madMidBoxN.moveTo([madChipsN[3].x, madYN, 0]);
  const madMidTagN = pill('MAD = 1', C.green, 15);
  madMidTagN.moveTo([madChipsN[3].x, madYN - 0.92, 0]);
  await until(S(40));
  await play(
    new M.Create(madMidBoxN), new M.FadeIn(madMidTagN),
    ...fbox(['normal distances:', '0, 1, 1, [1], 1, 2, 2', ['MAD = 1 day', C.green]], C.green),
    ...say('NORMAL MAD = 1 DAY', C.green)
  );

  const madTitleL = T('Late week: distances from median 5 (sorted)', P ? 16 : 17, C.pink, false, true);
  madTitleL.moveTo([CX, madYL + 0.68, 0]);
  const madChipsL = MAD_L.map((v, k) => makeChip(CX + (k - 3) * chipSp, madYL, v, k === 6 ? C.pink : C.cyan));
  const madJumpLab = T('2 → 16', P ? 16 : 16, C.pink, true, true);
  madJumpLab.moveTo([madChipsL[6].x, madYL - 0.56, 0]);
  await until(S(41));
  await play(
    new M.FadeIn(madTitleL),
    new M.LaggedStart(madChipsL.map(c => new M.FadeIn(c.g)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(madJumpLab), new M.Flash(madChipsL[6].g, { color: C.pink }),
    ...fbox(['late distances:', '0, 1, 1, 1, 1, 2, 16', ['last jumps: 2 → 16', C.pink]], C.pink),
    ...say('ONLY FARTHEST JUMPS: 2 → 16', C.pink)
  );

  const madMidBoxL = new M.RoundedRectangle({ width: (P ? 0.92 : 1.00), height: 0.72, cornerRadius: 0.14, color: C.green, strokeWidth: 3 });
  madMidBoxL.setFill(C.green, 0.12); madMidBoxL.moveTo([madChipsL[3].x, madYL, 0]);
  const madMidTagL = pill('STILL 1', C.green, 15);
  madMidTagL.moveTo([madChipsL[3].x, madYL - 0.88, 0]);
  await until(S(42));
  await play(
    new M.Create(madMidBoxL), new M.FadeIn(madMidTagL),
    new M.Indicate(madMidBoxN, { color: C.green }),
    ...fbox(['late distances:', '0, 1, 1, [1], 1, 2, 16', ['MAD = 1 day (same)', C.green]], C.green),
    ...say('MAD: STILL 1 DAY', C.green)
  );

  // --- 43-51: Summary table — Sensitive vs Resistant ---
  const TBL_W = P ? 7.2 : 7.7;
  const TBL_X0 = CX - TBL_W / 2;
  const TBL_X1 = CX + TBL_W / 2;
  const COL_TOOL = TBL_X0 + (P ? 0.24 : 0.30);
  const COL_NORM = CX + (P ? -0.95 : -0.85);
  const COL_LATE = CX + (P ? 0.65 : 0.80);
  const COL_GRP = CX + (P ? 2.40 : 2.65);
  const TBL_HDR_Y = P ? 2.65 : 1.12;
  const TBL_DIV_Y = P ? 2.32 : 0.85;
  const ROW_STEP = P ? 0.74 : 0.56;
  const ROW_Y = r => (P ? 1.88 : 0.54) - r * ROW_STEP;
  const TBL_TOP = TBL_HDR_Y + 0.32;
  const TBL_BOT = ROW_Y(5) - (P ? 0.44 : 0.36);

  const tblFrame = new M.RoundedRectangle({ width: TBL_W, height: TBL_TOP - TBL_BOT, cornerRadius: 0.18, color: C.grid, strokeWidth: 2 });
  tblFrame.setFill(C.card, 0.92); tblFrame.moveTo([CX, (TBL_TOP + TBL_BOT) / 2, 0]);
  const tblDiv = new M.Line({ start: [TBL_X0 + 0.16, TBL_DIV_Y, 0], end: [TBL_X1 - 0.16, TBL_DIV_Y, 0], color: C.grid, strokeWidth: 2 });

  const hTool = T('Tool', P ? 16 : 17, C.muted, true, true); hTool.moveTo([COL_TOOL + hTool.getWidth() / 2, TBL_HDR_Y, 0]);
  const hNorm = T('Normal', P ? 16 : 17, C.cyan, true, true); hNorm.moveTo([COL_NORM, TBL_HDR_Y, 0]);
  const hLate = T('Late', P ? 16 : 17, C.pink, true, true); hLate.moveTo([COL_LATE, TBL_HDR_Y, 0]);
  const hGrp = T('Group', P ? 16 : 17, C.muted, true, true); hGrp.moveTo([COL_GRP, TBL_HDR_Y, 0]);

  const tableData = [
    { name: 'Mean',    norm: '5',    late: '7',    sens: true  },
    { name: 'Median',  norm: '5',    late: '5',    sens: false },
    { name: 'Range',   norm: '4',    late: '18',   sens: true  },
    { name: 'IQR',     norm: '2',    late: '2',    sens: false },
    { name: 'Std dev', norm: '1.41', late: '6.27', sens: true  },
    { name: 'MAD',     norm: '1',    late: '1',    sens: false }
  ];

  const rowBgs = [];
  const rowTexts = [];
  const rowLateCells = [];
  const sensBadges = [];
  const resBadges = [];
  for (let r = 0; r < tableData.length; r++) {
    const ry = ROW_Y(r);
    const bg = new M.RoundedRectangle({ width: TBL_W - 0.28, height: ROW_STEP - 0.08, cornerRadius: 0.10, color: C.card, strokeWidth: 1.5 });
    bg.setFill(C.bg, 0.35); bg.moveTo([CX, ry, 0]);
    rowBgs.push(bg);

    const tName = T(tableData[r].name, P ? 17 : 18, C.ink, false, true);
    tName.moveTo([COL_TOOL + tName.getWidth() / 2, ry, 0]);
    const tNorm = T(tableData[r].norm, P ? 17 : 18, C.cyan, true);
    tNorm.moveTo([COL_NORM, ry, 0]);
    const tLate = T(tableData[r].late, P ? 17 : 18, C.ink, true, true);
    tLate.moveTo([COL_LATE, ry, 0]);
    rowTexts.push([tName, tNorm, tLate]);
    rowLateCells.push(tLate);

    const badge = pill(tableData[r].sens ? 'SENSITIVE' : 'RESISTANT', tableData[r].sens ? C.pink : C.green, 15);
    badge.moveTo([COL_GRP, ry, 0]);
    if (tableData[r].sens) sensBadges.push(badge);
    else resBadges.push(badge);
  }

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(
      madTitleN, ...madChipsN.map(c => c.g), ...madRankLabs, madMidBoxN, madMidTagN,
      madTitleL, ...madChipsL.map(c => c.g), madJumpLab, madMidBoxL, madMidTagL
    ), { runTime: 0.45 }),
    ...say('NORMAL VS LATE WEEK TABLE', C.cyan)
  );
  await play(
    new M.FadeIn(tblFrame, { runTime: 0.7 }), new M.Create(tblDiv, { runTime: 0.7 }),
    new M.FadeIn(hTool, { runTime: 0.7 }), new M.FadeIn(hNorm, { runTime: 0.7 }),
    new M.FadeIn(hLate, { runTime: 0.7 }),
    ...rowBgs.map(bg => new M.FadeIn(bg, { runTime: 0.7 })),
    new M.LaggedStart(rowTexts.flat().map(t => new M.FadeIn(t)), { lagRatio: 0.04, runTime: 1.3 }),
    ...fbox(['6 tools compared:', 'normal (3..7)', ['vs late (3..21)', C.pink]], C.cyan)
  );

  await until(S(44));
  await play(
    new M.LaggedStart(rowBgs.map(bg => new M.Indicate(bg, { color: C.amber })), { lagRatio: 0.14, runTime: 1.6 }),
    ...say('TWO CLEAR GROUPS APPEAR', C.amber)
  );

  const sensRows = [0, 2, 4];
  const resRows = [1, 3, 5];
  await until(S(45));
  sensRows.forEach(r => {
    rowBgs[r].setFill(C.pink, 0.18); rowBgs[r].setColor(C.pink);
    rowLateCells[r].setColor(C.pink);
  });
  await play(
    new M.LaggedStart(sensRows.map(r => new M.Indicate(rowLateCells[r], { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['mean:   5 → 7', C.pink], ['range:  4 → 18', C.pink], ['SD:  1.41 → 6.27', C.pink]], C.pink),
    ...say('MEAN, RANGE, SD ALL JUMPED', C.pink)
  );

  await until(S(46));
  await play(
    new M.Indicate(rowTexts[0][0], { color: C.pink }),
    new M.Indicate(rowTexts[4][0], { color: C.pink }),
    new M.Indicate(rowTexts[2][0], { color: C.amber }),
    ...fbox(['mean & SD: all 7 values', ['range: min & max', C.pink]], C.pink),
    ...say('EVERY NUMBER OR BOTH ENDS', C.pink)
  );

  await until(S(47));
  await play(
    new M.LaggedStart(sensRows.map(r => new M.Indicate(rowBgs[r], { color: C.pink })), { lagRatio: 0.14, runTime: 0.9 }),
    ...say('ONE EXTREME REACHES ALL 3', C.pink)
  );

  await until(S(48));
  await play(
    new M.FadeIn(hGrp),
    new M.LaggedStart(sensBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.16, runTime: 1.2 }),
    ...fbox(['sensitive tool:', ['shifts a lot from', C.pink], ['one extreme value', C.pink]], C.pink),
    ...say('SENSITIVE TOOLS', C.pink)
  );

  await until(S(49));
  resRows.forEach(r => {
    rowBgs[r].setFill(C.green, 0.18); rowBgs[r].setColor(C.green);
    rowLateCells[r].setColor(C.green);
  });
  await play(
    new M.LaggedStart(resRows.map(r => new M.Indicate(rowLateCells[r], { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['median: 5 → 5', C.green], ['IQR:    2 → 2', C.green], ['MAD:    1 → 1', C.green]], C.green),
    ...say('MEDIAN, IQR, MAD STAYED PUT', C.green)
  );

  await until(S(50));
  await play(
    new M.LaggedStart(resRows.map(r => new M.Indicate(rowTexts[r][0], { color: C.green })), { lagRatio: 0.18, runTime: 1.3 }),
    ...fbox(['depend on middle ranks', ['far-off dot cannot reach', C.green]], C.green),
    ...say('MIDDLE POSITIONS ONLY', C.green)
  );

  await until(S(51));
  await play(
    new M.LaggedStart(resBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.16, runTime: 1.2 }),
    ...fbox(['resistant (robust):', ['changes little or', C.green], ['not at all', C.green]], C.green),
    ...say('RESISTANT (OR ROBUST)', C.green)
  );

  // --- 52-55: When to use each kind ---
  const cardW = P ? 6.8 : 3.55;
  const cardH = P ? 2.25 : 2.95;
  const resPos = P ? [0, 1.7, 0] : [CX - 1.95, -0.45, 0];
  const sensPos = P ? [0, -1.05, 0] : [CX + 1.95, -0.45, 0];

  const cardRes = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
  cardRes.setFill(C.card, 0.94); cardRes.moveTo(resPos);
  const cardResHdr = pill('RESISTANT', C.green, P ? 15 : 15);
  cardResHdr.moveTo([resPos[0], resPos[1] + cardH / 2 - 0.44, 0]);
  const cardResTools = T('Median · IQR · MAD', P ? 17 : 17, C.green, true);
  cardResTools.moveTo([resPos[0], resPos[1] + cardH / 2 - 0.94, 0]);

  const cardSens = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.pink, strokeWidth: 2.5 });
  cardSens.setFill(C.card, 0.94); cardSens.moveTo(sensPos);
  const cardSensHdr = pill('SENSITIVE', C.pink, P ? 15 : 15);
  cardSensHdr.moveTo([sensPos[0], sensPos[1] + cardH / 2 - 0.44, 0]);
  const cardSensTools = T('Mean · Range · SD', P ? 17 : 17, C.pink, true);
  cardSensTools.moveTo([sensPos[0], sensPos[1] + cardH / 2 - 0.94, 0]);

  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(
      tblFrame, tblDiv, hTool, hNorm, hLate, hGrp, ...rowBgs, ...rowTexts.flat(), ...sensBadges, ...resBadges
    ), { runTime: 0.45 }),
    ...say('EACH ANSWERS A DIFFERENT QUESTION', C.cyan)
  );
  await play(
    new M.FadeIn(cardRes, { runTime: 0.9 }), new M.FadeIn(cardResHdr, { runTime: 0.9 }), new M.FadeIn(cardResTools, { runTime: 0.9 }),
    new M.FadeIn(cardSens, { runTime: 0.9 }), new M.FadeIn(cardSensHdr, { runTime: 0.9 }), new M.FadeIn(cardSensTools, { runTime: 0.9 }),
    ...fbox(['neither kind is better', ['match the tool', C.cyan], ['to your question', C.amber]], C.cyan)
  );

  const cardResEx1 = T('• Typical picture', P ? 17 : 17, C.ink, false, true);
  cardResEx1.moveTo([resPos[0], resPos[1] - 0.16, 0]);
  const cardResEx2 = T('Usual parcel time', P ? 16 : 16, C.muted);
  cardResEx2.moveTo([resPos[0], resPos[1] - 0.56, 0]);
  await until(S(53));
  await play(
    new M.Indicate(cardRes, { color: C.green }),
    new M.FadeIn(cardResEx1), new M.FadeIn(cardResEx2),
    ...fbox(['use resistant for:', ['typical picture', C.green], ['(usual parcel time)', C.muted]], C.green),
    ...say('RESISTANT → TYPICAL PICTURE', C.green)
  );

  const cardSensEx1 = T('• Spot breakdowns early', P ? 17 : 16, C.ink, false, true);
  cardSensEx1.moveTo([sensPos[0], sensPos[1] - 0.14, 0]);
  await until(S(54));
  await play(
    new M.Indicate(cardSens, { color: C.pink }),
    new M.FadeIn(cardSensEx1),
    ...fbox(['use sensitive when:', ['every extreme counts', C.pink], ['(spot breakdowns)', C.muted]], C.pink),
    ...say('SENSITIVE → EVERY EXTREME COUNTS', C.pink)
  );

  const cardSensEx2 = T('• Totals & weekly sales', P ? 17 : 16, C.amber, false, true);
  cardSensEx2.moveTo([sensPos[0], sensPos[1] - 0.62, 0]);
  await until(S(55));
  await play(
    new M.Indicate(cardSens, { color: C.amber }),
    new M.FadeIn(cardSensEx2),
    ...fbox(['also fits totals:', ['weekly sales & budget', C.amber], ['big orders matter', C.muted]], C.amber),
    ...say('SENSITIVE → TOTALS & BUDGETS', C.amber)
  );

  // --- 56-58: Common trap & recap ---
  const YT = P ? 0.1 : -0.85;
  const trapNl = makeNumberLine(YT, 'Late week', C.pink, true);
  const trapDots = DL.map((v, k) => makeDot(v, DL.slice(0, k).filter(x => x === v).length, YT, k === 6 ? C.pink : C.cyan));
  const trapMedLine = new M.DashedLine({ start: [d2x(5), YT - 0.10, 0], end: [d2x(5), YT + 0.96, 0], color: C.green });
  const trapMedTag = pill('MEDIAN = 5', C.green, 15);
  trapMedTag.moveTo([d2x(6.2), YT + 1.24, 0]);
  const trapWarnRing = new M.Circle({ radius: 0.30, color: C.amber, strokeWidth: 3 });
  trapWarnRing.setFill(C.pink, 0.16); trapWarnRing.moveTo(trapDots[6].p);

  await until(S(56));
  await play(
    new M.FadeOut(new M.VGroup(
      cardRes, cardResHdr, cardResTools, cardResEx1, cardResEx2,
      cardSens, cardSensHdr, cardSensTools, cardSensEx1, cardSensEx2
    ), { runTime: 0.45 }),
    ...say('TRAP: NEVER IGNORE EXTREMES', C.amber)
  );
  await play(
    new M.Create(trapNl.line, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...trapNl.minorTicks, ...trapNl.tickLabels, trapNl.title, trapNl.unit), { runTime: 0.8 }),
    ...trapDots.flatMap(o => [new M.FadeIn(o.halo, { runTime: 0.8 }), new M.FadeIn(o.core, { runTime: 0.8 })]),
    new M.Create(trapMedLine, { runTime: 0.8 }), new M.FadeIn(trapMedTag, { runTime: 0.8 }),
    new M.Create(trapWarnRing, { runTime: 0.8 }),
    ...fbox(['common trap:', ['calm median ≠', C.amber], ['ignore the extreme!', C.pink]], C.amber)
  );

  const trapCustTag = pill('1 PARCEL TOOK 21 DAYS!', C.pink, 15);
  trapCustTag.moveTo([P ? 1.9 : d2x(16.8), YT + 0.86, 0]);
  await until(S(57));
  await play(
    new M.Indicate(trapMedTag, { color: C.green }),
    new M.FadeIn(trapCustTag),
    new M.Flash(trapDots[6].core, { color: C.pink }),
    ...fbox([['median = 5 days', C.green], ['1 parcel = 21 days!', C.pink]], C.pink),
    ...say('MEDIAN = 5, YET 1 WAITED 21 DAYS', C.pink)
  );

  const recapShield = new M.RoundedRectangle({ width: d2x(6) - d2x(4) + 0.36, height: 0.84, cornerRadius: 0.14, color: C.green, strokeWidth: 2.8 });
  recapShield.setFill(C.green, 0.14); recapShield.moveTo([d2x(5), YT + 0.44, 0]);
  const recapPull = makeArrow(d2x(7) + 0.12, d2x(21) - 0.32, YT + 0.26, C.pink, 3);
  await until(S(58));
  await play(
    new M.Create(recapShield), new M.FadeIn(recapPull),
    new M.Indicate(trapDots[6].core, { color: C.pink }),
    ...fbox([['sensitive: reacts', C.pink], ['resistant: shields', C.green], ['both have a job', C.cyan]], C.cyan),
    ...say('SENSITIVE REACTS · RESISTANT SHIELDS', C.cyan)
  );
}

// 3.3.4 Stratified sampling (live manim-web lesson).
// Beat i = sentence i (0-based, 0..40). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const ORANGE = '#fb923c';

  // Layout constants: laptop 14.22 x 8 (y in [-3.0, 2.3]), phone 8 x 14.22 (y in [-5.5, 4.3])
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 1.95, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, -5.5, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
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
    const maxw = P ? FW - 0.8 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // Helper: small glowing student dot
  const mkDot = (pos, color, opacity = 0.9, radius = P ? 0.085 : 0.078) => {
    const d = new M.Dot({ point: pos, radius, color });
    d.setFill(color, opacity);
    return d;
  };
  const mkHalo = (pos, color, radius = P ? 0.15 : 0.14) => {
    const c = new M.Circle({ radius, color, strokeWidth: 2.2 });
    c.setFill(color, 0.16); c.moveTo(pos);
    return c;
  };
  const mkCard = (pos, w, h, title, sub, color, tSize = P ? 18 : 19, sSize = P ? 22 : 23) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo(pos);
    const t1 = T(title, tSize, C.muted, true); t1.moveTo([pos[0], pos[1] + h * 0.2, 0]);
    const t2 = T(sub, sSize, color, true); t2.moveTo([pos[0], pos[1] - h * 0.18, 0]);
    return new M.VGroup(r, t1, t2);
  };

  // =========================================================================
  // ACT 1 (Sentences 0-13): 1,000 students (100 dots: 60 City + 40 Hill)
  // =========================================================================
  const GX = P ? 0 : -2.25;
  const GY = P ? -0.75 : -0.50;
  const DX = P ? 0.40 : 0.42;
  const DY = P ? 0.27 : 0.26;
  const SPLIT = P ? 0.28 : 0.22;

  const dotPos = (idx, split = false) => {
    const r = Math.floor(idx / 10), c = idx % 10;
    const x = GX + (c - 4.5) * DX;
    const shift = split ? (r < 6 ? SPLIT : -SPLIT) : 0;
    const y = GY + (4.5 - r) * DY + shift;
    return [x, y, 0];
  };

  const popDots = Array.from({ length: 100 }, (_, i) => mkDot(dotPos(i, false), C.muted, 0.78));
  const popNote = T('1,000 students  (1 dot = 10)', P ? 16 : 17, C.muted, true);
  popNote.moveTo([GX, P ? -2.75 : -2.42, 0]);

  // 0: Our university has a detail we have not used yet. It has two campuses.
  await until(S(0));
  await play(
    new M.LaggedStart(popDots.map(d => new M.FadeIn(d)), { lagRatio: 0.015, runTime: 1.6 }),
    new M.FadeIn(popNote),
    ...say('TWO CAMPUSES', C.cyan)
  );

  // 1: City campus, in the centre of town, has six hundred students.
  const gridW = 9 * DX + 0.42;
  const cityTop0 = GY + 4.5 * DY + 0.16, cityBot0 = GY - 0.5 * DY - 0.14;
  const cityBox0 = new M.RoundedRectangle({ width: gridW, height: cityTop0 - cityBot0, cornerRadius: 0.12, color: C.ink, strokeWidth: 1.8 });
  cityBox0.setFill(C.ink, 0.05); cityBox0.moveTo([GX, (cityTop0 + cityBot0) / 2, 0]);
  const cityTag0 = T('City campus · 600', P ? 18 : 19, C.ink, true);
  cityTag0.moveTo(P ? [0, cityTop0 + 0.28, 0] : [GX - gridW / 2 - 1.25, (cityTop0 + cityBot0) / 2, 0]);
  await until(S(1));
  await play(new M.Create(cityBox0), new M.FadeIn(cityTag0), ...say('CITY CAMPUS: 600 STUDENTS', C.ink));

  // 2: Hill campus, far outside town, has four hundred students.
  const hillTop0 = GY - 1.5 * DY + 0.14, hillBot0 = GY - 4.5 * DY - 0.16;
  const hillBox0 = new M.RoundedRectangle({ width: gridW, height: hillTop0 - hillBot0, cornerRadius: 0.12, color: C.ink, strokeWidth: 1.8 });
  hillBox0.setFill(C.ink, 0.05); hillBox0.moveTo([GX, (hillTop0 + hillBot0) / 2, 0]);
  const hillTag0 = T('Hill campus · 400', P ? 18 : 19, C.ink, true);
  hillTag0.moveTo(P ? [0, hillBot0 - 0.28, 0] : [GX - gridW / 2 - 1.25, (hillTop0 + hillBot0) / 2, 0]);
  await until(S(2));
  await play(new M.Create(hillBox0), new M.FadeIn(hillTag0), ...say('HILL CAMPUS: 400 STUDENTS', C.ink));

  // 3: Let's colour the dots. City students are cyan. Hill students are orange.
  const cityTagC = T('City campus · 600', P ? 18 : 19, C.cyan, true);
  cityTagC.moveTo(P ? [0, cityTop0 + 0.28, 0] : [GX - gridW / 2 - 1.25, (cityTop0 + cityBot0) / 2, 0]);
  const hillTagO = T('Hill campus · 400', P ? 18 : 19, ORANGE, true);
  hillTagO.moveTo(P ? [0, hillBot0 - 0.28, 0] : [GX - gridW / 2 - 1.25, (hillTop0 + hillBot0) / 2, 0]);
  const cityBoxC = new M.RoundedRectangle({ width: gridW, height: cityTop0 - cityBot0, cornerRadius: 0.12, color: C.cyan, strokeWidth: 1.8 });
  cityBoxC.setFill(C.cyan, 0.06); cityBoxC.moveTo([GX, (cityTop0 + cityBot0) / 2, 0]);
  const hillBoxO = new M.RoundedRectangle({ width: gridW, height: hillTop0 - hillBot0, cornerRadius: 0.12, color: ORANGE, strokeWidth: 1.8 });
  hillBoxO.setFill(ORANGE, 0.06); hillBoxO.moveTo([GX, (hillTop0 + hillBot0) / 2, 0]);
  await until(S(3));
  await play(
    new M.LaggedStart(popDots.map((d, i) => new M.Transform(d, mkDot(dotPos(i, false), i < 60 ? C.cyan : ORANGE, 0.92))), { lagRatio: 0.01, runTime: 1.4 }),
    new M.FadeOut(new M.VGroup(cityBox0, hillBox0, cityTag0, hillTag0)),
    new M.FadeIn(new M.VGroup(cityBoxC, hillBoxO, cityTagC, hillTagO)),
    ...say('CITY = CYAN  ·  HILL = ORANGE', C.cyan)
  );

  // Mini minutes number line (10 to 50) for beats 4-7
  const MX0 = P ? -3.0 : 1.55, MX1 = P ? 3.0 : 6.25, MY = P ? -4.25 : -0.55;
  const m2x = v => MX0 + (v - 10) / 40 * (MX1 - MX0);
  const miniLine = new M.Line({ start: [MX0, MY, 0], end: [MX1, MY, 0], color: C.muted, strokeWidth: 2.5 });
  const miniTicks = [10, 20, 30, 40, 50].map(v => new M.VGroup(
    new M.Line({ start: [m2x(v), MY - 0.07, 0], end: [m2x(v), MY + 0.07, 0], color: C.muted }),
    T(String(v), P ? 16 : 17, C.muted, true).moveTo([m2x(v), MY - 0.30, 0])
  ));
  const miniUnit = T('minutes', P ? 15 : 16, C.muted); miniUnit.moveTo([MX1 - 0.35, MY - 0.65, 0]);
  const miniTruth = new M.DashedLine({ start: [m2x(30), MY - 0.15, 0], end: [m2x(30), MY + 0.95, 0], color: C.amber });
  const miniTruthLab = T('truth 30', P ? 15 : 16, C.amber, true); miniTruthLab.moveTo([m2x(30), MY + 1.18, 0]);

  const cityTripDot = new M.VGroup(
    mkDot([m2x(20), MY, 0], C.cyan, 1, 0.11),
    T('City ~20', P ? 15 : 16, C.cyan, true).moveTo([m2x(20), MY + 0.36, 0])
  );
  // 4: City students live close. Their trips are short.
  await until(S(4));
  await play(
    new M.Create(miniLine),
    new M.FadeIn(new M.VGroup(...miniTicks, miniUnit, miniTruth, miniTruthLab)),
    new M.FadeIn(cityTripDot),
    ...say('CITY: CLOSE, SHORT TRIPS', C.cyan)
  );

  // 5: Hill students travel far. Their trips are long.
  const hillTripDot = new M.VGroup(
    mkDot([m2x(45), MY, 0], ORANGE, 1, 0.11),
    T('Hill ~45', P ? 15 : 16, ORANGE, true).moveTo([m2x(45), MY + 0.36, 0])
  );
  await until(S(5));
  await play(new M.FadeIn(hillTripDot), ...say('HILL: FAR, LONG TRIPS', ORANGE));

  // 6: A simple random sample of ten could, by bad luck, pick mostly City students.
  const SRS_LOW = [3, 11, 17, 24, 32, 38, 45, 51, 67, 83]; // 8 City + 2 Hill -> (8*20 + 2*45)/10 = 25
  const srsLowSet = new Set(SRS_LOW);
  const lowHalos = SRS_LOW.map(i => mkHalo(dotPos(i, false), i < 60 ? C.cyan : ORANGE));
  await until(S(6));
  await play(
    new M.LaggedStart(popDots.map((d, i) => {
      const hit = srsLowSet.has(i), col = hit ? (i < 60 ? C.cyan : ORANGE) : C.muted;
      return new M.Transform(d, mkDot(dotPos(i, false), col, hit ? 1 : 0.25, hit ? (P ? 0.105 : 0.098) : (P ? 0.07 : 0.065)));
    }), { lagRatio: 0.008, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...lowHalos)),
    ...say('SIMPLE RANDOM SAMPLE OF 10', C.pink)
  );

  // 7: Then the estimate would land too low. Or mostly Hill students, and it would land too high.
  const lowMark = new M.VGroup(
    mkDot([m2x(25), MY, 0], C.pink, 1, 0.13),
    T('25 too low', P ? 16 : 17, C.pink, true).moveTo([m2x(22.5), MY + 0.72, 0])
  );
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(cityTripDot, hillTripDot)),
    new M.FadeIn(lowMark),
    new M.Flash(lowMark.submobjects[0], { color: C.pink }),
    ...say('TOO LOW (MOSTLY CITY)', C.pink)
  );

  const SRS_HIGH = [14, 42, 61, 66, 72, 78, 81, 85, 93, 98]; // 2 City + 8 Hill -> (2*20 + 8*45)/10 = 40
  const srsHighSet = new Set(SRS_HIGH);
  const highHalos = SRS_HIGH.map(i => mkHalo(dotPos(i, false), i < 60 ? C.cyan : ORANGE));
  const highMark = new M.VGroup(
    mkDot([m2x(40), MY, 0], C.pink, 1, 0.13),
    T('40 too high', P ? 16 : 17, C.pink, true).moveTo([m2x(41.5), MY + 0.72, 0])
  );
  await until(S(7) + 2.6);
  await play(
    new M.FadeOut(new M.VGroup(...lowHalos, lowMark)),
    new M.LaggedStart(popDots.map((d, i) => {
      const hit = srsHighSet.has(i), col = hit ? (i < 60 ? C.cyan : ORANGE) : C.muted;
      return new M.Transform(d, mkDot(dotPos(i, false), col, hit ? 1 : 0.25, hit ? (P ? 0.105 : 0.098) : (P ? 0.07 : 0.065)));
    }), { lagRatio: 0.008, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...highHalos, highMark)),
    ...say('TOO HIGH (MOSTLY HILL)', C.pink)
  );

  // 8: We can stop that bad luck before it happens.
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...highHalos, highMark, miniLine, ...miniTicks, miniUnit, miniTruth, miniTruthLab)),
    new M.LaggedStart(popDots.map((d, i) => new M.Transform(d, mkDot(dotPos(i, false), i < 60 ? C.cyan : ORANGE, 0.9))), { lagRatio: 0.006, runTime: 0.9 }),
    ...say('STOP BAD LUCK FIRST', C.green)
  );

  // 9: Split the students into the two campuses first.
  const cityTop1 = GY + 4.5 * DY + SPLIT + 0.16, cityBot1 = GY - 0.5 * DY + SPLIT - 0.14;
  const hillTop1 = GY - 1.5 * DY - SPLIT + 0.14, hillBot1 = GY - 4.5 * DY - SPLIT - 0.16;
  const cityBox1 = new M.RoundedRectangle({ width: gridW, height: cityTop1 - cityBot1, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.2 });
  cityBox1.setFill(C.cyan, 0.07); cityBox1.moveTo([GX, (cityTop1 + cityBot1) / 2, 0]);
  const hillBox1 = new M.RoundedRectangle({ width: gridW, height: hillTop1 - hillBot1, cornerRadius: 0.14, color: ORANGE, strokeWidth: 2.2 });
  hillBox1.setFill(ORANGE, 0.07); hillBox1.moveTo([GX, (hillTop1 + hillBot1) / 2, 0]);
  const cityTag1 = T('City campus · 600', P ? 18 : 19, C.cyan, true);
  cityTag1.moveTo(P ? [0, cityTop1 + 0.26, 0] : [GX - gridW / 2 - 1.25, (cityTop1 + cityBot1) / 2, 0]);
  const hillTag1 = T('Hill campus · 400', P ? 18 : 19, ORANGE, true);
  hillTag1.moveTo(P ? [0, hillBot1 - 0.26, 0] : [GX - gridW / 2 - 1.25, (hillTop1 + hillBot1) / 2, 0]);
  const splitLine = new M.DashedLine({ start: [GX - gridW / 2 - 0.15, (cityBot1 + hillTop1) / 2, 0], end: [GX + gridW / 2 + 0.15, (cityBot1 + hillTop1) / 2, 0], color: C.muted });

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(cityBoxC, hillBoxO, cityTagC, hillTagO, popNote)),
    new M.LaggedStart(popDots.map((d, i) => new M.Transform(d, mkDot(dotPos(i, true), i < 60 ? C.cyan : ORANGE, 0.9))), { lagRatio: 0.008, runTime: 1.2 }),
    new M.Create(cityBox1), new M.Create(hillBox1), new M.Create(splitLine),
    new M.FadeIn(cityTag1), new M.FadeIn(hillTag1),
    ...say('1. SPLIT INTO TWO CAMPUSES', C.cyan)
  );

  // 10: Then draw a random sample inside each campus: ten from City, and ten from Hill.
  const STRAT_CITY = [2, 8, 14, 21, 27, 33, 39, 44, 50, 56];
  const STRAT_HILL = [61, 65, 68, 72, 76, 80, 84, 89, 93, 97];
  const stratSet = new Set([...STRAT_CITY, ...STRAT_HILL]);
  const stratHalos = [...STRAT_CITY, ...STRAT_HILL].map(i => mkHalo(dotPos(i, true), i < 60 ? C.cyan : ORANGE));
  const badgeC = pill('10 SAMPLED', C.cyan, P ? 16 : 17);
  badgeC.moveTo(P ? [2.6, (cityTop1 + cityBot1) / 2, 0] : [GX + gridW / 2 + 1.15, (cityTop1 + cityBot1) / 2, 0]);
  const badgeH = pill('10 SAMPLED', ORANGE, P ? 16 : 17);
  badgeH.moveTo(P ? [2.6, (hillTop1 + hillBot1) / 2, 0] : [GX + gridW / 2 + 1.15, (hillTop1 + hillBot1) / 2, 0]);
  if (P) { badgeC.moveTo([0, -3.45, 0]); badgeH.moveTo([0, -4.15, 0]); }
  const pBadgeC = P ? pill('CITY: 10 SAMPLED', C.cyan, 17).moveTo([0, -3.45, 0]) : badgeC;
  const pBadgeH = P ? pill('HILL: 10 SAMPLED', ORANGE, 17).moveTo([0, -4.15, 0]) : badgeH;

  await until(S(10));
  await play(
    new M.LaggedStart(popDots.map((d, i) => {
      const hit = stratSet.has(i), col = hit ? (i < 60 ? C.cyan : ORANGE) : C.muted;
      return new M.Transform(d, mkDot(dotPos(i, true), col, hit ? 1 : 0.22, hit ? (P ? 0.105 : 0.098) : (P ? 0.068 : 0.064)));
    }), { lagRatio: 0.008, runTime: 1.5 }),
    new M.LaggedStart(stratHalos.map(h => new M.FadeIn(h)), { lagRatio: 0.06, runTime: 1.5 }),
    new M.FadeIn(pBadgeC), new M.FadeIn(pBadgeH),
    ...say('2. SAMPLE 10 INSIDE EACH', C.amber)
  );

  // 11: Each group we split into is called a stratum. The plural is strata, like the layers you see in a cliff.
  const strLab1 = T('STRATUM 1', P ? 16 : 17, C.violet, true);
  strLab1.moveTo(P ? [0, cityTop1 + 0.62, 0] : [GX + gridW / 2 + 1.15, (cityTop1 + cityBot1) / 2 + 0.52, 0]);
  const strLab2 = T('STRATUM 2', P ? 16 : 17, C.violet, true);
  strLab2.moveTo(P ? [0, hillBot1 - 0.62, 0] : [GX + gridW / 2 + 1.15, (hillTop1 + hillBot1) / 2 - 0.52, 0]);
  await until(S(11));
  await play(
    new M.Indicate(cityBox1, { color: C.violet }),
    new M.Indicate(hillBox1, { color: C.violet }),
    new M.FadeIn(strLab1), new M.FadeIn(strLab2),
    ...say('STRATUM (PLURAL: STRATA)', C.violet)
  );

  // 12: Sampling at random inside each stratum is called stratified sampling.
  await until(S(12));
  await play(
    new M.LaggedStart(stratHalos.map(h => new M.Indicate(h, { color: C.green })), { lagRatio: 0.05, runTime: 1.6 }),
    ...say('STRATIFIED SAMPLING', C.green)
  );

  // 13: Now let's hear the results. (short beat: 1.81s)
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(...popDots, ...stratHalos, cityBox1, hillBox1, splitLine, cityTag1, hillTag1, pBadgeC, pBadgeH, strLab1, strLab2)),
    ...say('THE SAMPLE RESULTS', C.amber)
  );

  // =========================================================================
  // ACT 2 (Sentences 14-29): Results, plain middle (32), weighted mean (30)
  // =========================================================================
  const AX0 = P ? -3.1 : -5.65, AX1 = P ? 3.1 : 1.35, AY = P ? -3.6 : -2.85;
  const a2x = v => AX0 + (v - 10) / 40 * (AX1 - AX0);
  const axisLine = new M.Line({ start: [AX0, AY, 0], end: [AX1, AY, 0], color: C.muted, strokeWidth: 3 });
  const axisTicks = [10, 20, 30, 40, 50].map(v => new M.VGroup(
    new M.Line({ start: [a2x(v), AY - 0.08, 0], end: [a2x(v), AY + 0.08, 0], color: C.muted }),
    T(String(v), P ? 18 : 19, C.muted, true).moveTo([a2x(v), AY - 0.34, 0])
  ));
  const axisUnit = T('minutes', P ? 16 : 17, C.muted); axisUnit.moveTo([AX1 - 0.35, AY - 0.72, 0]);

  // 14: The ten City students take twenty-two minutes, on average.
  const cardW = P ? 3.2 : 3.25, cardH = P ? 1.15 : 1.15;
  const cityCard = mkCard(P ? [-1.75, 0.25, 0] : [CX - 1.8, 0.25, 0], cardW, cardH, 'City (10 sampled)', '22 min', C.cyan);
  const cityDot = new M.VGroup(
    mkDot([a2x(22), AY, 0], C.cyan, 1, 0.13),
    T('22', P ? 19 : 20, C.cyan, true).moveTo([a2x(22), AY + 0.38, 0])
  );
  await until(S(14));
  await play(
    new M.Create(axisLine), ...axisTicks.map(t => new M.FadeIn(t)), new M.FadeIn(axisUnit),
    new M.FadeIn(cityCard), new M.FadeIn(cityDot),
    ...fbox([['City (10): 22 min', C.cyan]], C.cyan),
    ...say('CITY SAMPLE MEAN = 22 MIN', C.cyan)
  );

  // 15: The ten Hill students take forty-two minutes, on average.
  const hillCard = mkCard(P ? [1.75, 0.25, 0] : [CX + 1.8, 0.25, 0], cardW, cardH, 'Hill (10 sampled)', '42 min', ORANGE);
  const hillDot = new M.VGroup(
    mkDot([a2x(42), AY, 0], ORANGE, 1, 0.13),
    T('42', P ? 19 : 20, ORANGE, true).moveTo([a2x(42), AY + 0.38, 0])
  );
  await until(S(15));
  await play(
    new M.FadeIn(hillCard), new M.FadeIn(hillDot),
    ...fbox([['City (10): 22 min', C.cyan], ['Hill (10): 42 min', ORANGE]], C.cyan),
    ...say('HILL SAMPLE MEAN = 42 MIN', ORANGE)
  );

  // 16: How do we combine them into one number for the whole university?
  const qMark = pill('WHOLE UNIVERSITY = ?', C.amber, P ? 18 : 19);
  qMark.moveTo([CX, P ? -1.15 : -0.68, 0]);
  await until(S(16));
  await play(
    new M.Indicate(cityDot, { color: C.amber }),
    new M.Indicate(hillDot, { color: C.amber }),
    new M.FadeIn(qMark),
    ...say('COMBINE INTO ONE NUMBER?', C.amber)
  );

  // 17: A first idea: take the middle of the two. Twenty-two plus forty-two is sixty-four. Half of that is thirty-two.
  const midStem = new M.Line({ start: [a2x(32), AY, 0], end: [a2x(32) + 0.36, AY + 0.50, 0], color: C.pink, strokeWidth: 2 });
  const midDot32 = new M.VGroup(
    midStem,
    mkDot([a2x(32), AY, 0], C.pink, 1, 0.13),
    T('32', P ? 19 : 20, C.pink, true).moveTo([a2x(32) + 0.56, AY + 0.56, 0])
  );
  const midArch = new M.Line({ start: [a2x(22), AY + 0.72, 0], end: [a2x(42), AY + 0.72, 0], color: C.muted, strokeWidth: 2 });
  await until(S(17));
  await play(
    new M.FadeOut(qMark),
    new M.Create(midArch), new M.FadeIn(midDot32),
    ...fbox(['plain middle:', '22 + 42 = 64', ['64 ÷ 2 = 32', C.pink]], C.pink),
    ...say('PLAIN MIDDLE = 32 MIN', C.pink)
  );

  // 18: But wait. The campuses are not the same size.
  const unequalTag = pill('600 CITY  ≠  400 HILL', C.amber, P ? 18 : 19);
  unequalTag.moveTo([CX, P ? -1.15 : -0.68, 0]);
  await until(S(18));
  await play(
    new M.FadeIn(unequalTag),
    new M.Indicate(cityCard, { color: C.amber }),
    new M.Indicate(hillCard, { color: C.amber }),
    ...say('CAMPUSES ARE UNEQUAL', C.amber)
  );

  // 19: Out of every ten students, six are at City and four are at Hill.
  // Left-aligned 6 cyan "22" tiles over 4 orange "42" tiles
  const tw = P ? 0.74 : 0.74, th = P ? 0.64 : 0.62, tsp = P ? 0.84 : 0.84;
  const tLeft = P ? -2.85 : -5.05;
  const row1Y = P ? 0.25 : 0.55, row2Y = P ? -0.95 : -0.35;
  const mkTile = (x, y, val, color) => {
    const r = new M.RoundedRectangle({ width: tw, height: th, cornerRadius: 0.10, color, strokeWidth: 2 });
    r.setFill(color, 0.22); r.moveTo([x, y, 0]);
    const txt = T(String(val), P ? 20 : 21, color, true); txt.moveTo([x, y, 0]);
    return new M.VGroup(r, txt);
  };
  const cityTiles = Array.from({ length: 6 }, (_, k) => mkTile(tLeft + k * tsp, row1Y, 22, C.cyan));
  const hillTiles = Array.from({ length: 4 }, (_, k) => mkTile(tLeft + k * tsp, row2Y, 42, ORANGE));
  const weightHdr = T('Out of every 10:  6 City  ·  4 Hill', P ? 17 : 18, C.ink, true);
  weightHdr.moveTo([CX, P ? 1.15 : 1.18, 0]);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(cityCard, hillCard, unequalTag, midArch)),
    new M.FadeIn(weightHdr),
    new M.LaggedStart([...cityTiles, ...hillTiles].map(t => new M.FadeIn(t)), { lagRatio: 0.08, runTime: 1.5 }),
    ...fbox([['City: 6 of 10', C.cyan], ['Hill: 4 of 10', ORANGE]], C.cyan),
    ...say('6 OF 10 CITY · 4 OF 10 HILL', C.cyan)
  );

  // 20: So City should count six times, and Hill four times.
  const wBadgeC = T('× 6', P ? 21 : 22, C.cyan, true);
  wBadgeC.moveTo([tLeft + 6 * tsp + 0.15, row1Y, 0]);
  const wBadgeH = T('× 4', P ? 21 : 22, ORANGE, true);
  wBadgeH.moveTo([tLeft + 4 * tsp + 0.15, row2Y, 0]);
  await until(S(20));
  await play(
    new M.LaggedStart(cityTiles.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.0 }),
    new M.FadeIn(wBadgeC), new M.FadeIn(wBadgeH),
    ...say('CITY × 6   ·   HILL × 4', C.amber)
  );

  // 21: This is the weighted mean you met earlier in the course.
  await until(S(21));
  await play(
    ...fbox([['weighted mean', C.violet], ['City: 6 × 22', C.cyan], ['Hill: 4 × 42', ORANGE]], C.violet),
    ...say('WEIGHTED MEAN', C.violet)
  );

  // 22: Step one: six times twenty-two is one hundred and thirty-two.
  const mulC = T('= 132', P ? 20 : 21, C.cyan, true);
  mulC.moveTo([tLeft + 6 * tsp + (P ? 0.55 : 0.72), row1Y, 0]);
  await until(S(22));
  await play(
    new M.FadeOut(wBadgeC),
    new M.LaggedStart(cityTiles.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(mulC),
    ...fbox(['step 1:', ['6 × 22 = 132', C.cyan]], C.cyan),
    ...say('STEP 1: 6 × 22 = 132', C.cyan)
  );

  // 23: Step two: four times forty-two is one hundred and sixty-eight.
  const mulH = T('= 168', P ? 20 : 21, ORANGE, true);
  mulH.moveTo([tLeft + 4 * tsp + (P ? 0.55 : 0.72), row2Y, 0]);
  await until(S(23));
  await play(
    new M.FadeOut(wBadgeH),
    new M.LaggedStart(hillTiles.map(t => new M.Indicate(t, { color: ORANGE })), { lagRatio: 0.10, runTime: 1.2 }),
    new M.FadeIn(mulH),
    ...fbox(['1) 6 × 22 = 132', ['2) 4 × 42 = 168', ORANGE]], ORANGE),
    ...say('STEP 2: 4 × 42 = 168', ORANGE)
  );

  // 24: Step three: add them. One hundred and thirty-two plus one hundred and sixty-eight is three hundred.
  await until(S(24));
  await play(
    new M.Indicate(mulC, { color: C.amber }),
    new M.Indicate(mulH, { color: C.amber }),
    ...fbox(['1) 6 × 22 = 132', '2) 4 × 42 = 168', ['3) 132 + 168 = 300', C.amber]], C.amber),
    ...say('STEP 3: 132 + 168 = 300', C.amber)
  );

  // 25: Step four: divide by ten, because our weights were out of every ten students. That gives thirty.
  const estDot30 = new M.VGroup(
    mkDot([a2x(30), AY, 0], C.green, 1, 0.15),
    T('30', P ? 21 : 22, C.green, true).moveTo([a2x(30) - 0.5, AY + 0.42, 0])
  );
  await until(S(25));
  await play(
    ...fbox(['1) 6 × 22 = 132', '2) 4 × 42 = 168', '3) 132 + 168 = 300', ['4) 300 ÷ 10 = 30', C.green]], C.green),
    new M.FadeIn(estDot30),
    new M.Flash(estDot30.submobjects[0], { color: C.green }),
    ...say('STEP 4: 300 ÷ 10 = 30', C.green)
  );

  // 26: Our weighted estimate is thirty minutes. The dashed truth line is thirty too.
  const truthLine = new M.DashedLine({ start: [a2x(30), AY - 0.18, 0], end: [a2x(30), AY + 1.05, 0], color: C.amber });
  const truthLab = T('truth = 30', P ? 17 : 18, C.amber, true); truthLab.moveTo([a2x(30), AY + 1.28, 0]);
  await until(S(26));
  await play(
    new M.Create(truthLine), new M.FadeIn(truthLab),
    new M.Indicate(estDot30, { color: C.amber }),
    ...say('ESTIMATE = 30 · TRUTH = 30', C.amber)
  );

  // 27: Here it lands exactly on thirty. Other samples would land close to thirty, not always on it.
  const otherVals = [28.4, 29.2, 29.8, 30.6, 31.2];
  const otherDots = otherVals.map((v, i) => mkDot([a2x(v), AY + 0.18 + (i % 2) * 0.14, 0], C.green, 0.65, 0.085));
  await until(S(27));
  await play(
    new M.LaggedStart(otherDots.map(d => new M.FadeIn(d)), { lagRatio: 0.18, runTime: 1.6 }),
    ...say('OTHER SAMPLES LAND CLOSE', C.green)
  );

  // 28: The plain middle, thirty-two, was too high, because it gave Hill too much say.
  const gapArr = new M.Arrow({ start: [a2x(30), AY + 0.85, 0], end: [a2x(32) + 0.18, AY + 0.85, 0], color: C.pink, strokeWidth: 3 });
  const gapTxt = T('+2 too high', P ? 16 : 17, C.pink, true); gapTxt.moveTo([a2x(32) + 0.85, AY + 0.85, 0]);
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(...otherDots)),
    new M.Indicate(midDot32, { color: C.pink }),
    new M.Create(gapArr), new M.FadeIn(gapTxt),
    ...say('32 GAVE HILL TOO MUCH SAY', C.pink)
  );

  // 29: The number each group is multiplied by is called its weight. Here, six and four.
  const wPillC = pill('CITY WEIGHT = 6', C.cyan, P ? 16 : 17); wPillC.moveTo([P ? -1.75 : -4.25, row2Y - 0.75, 0]);
  const wPillH = pill('HILL WEIGHT = 4', ORANGE, P ? 16 : 17); wPillH.moveTo([P ? 1.75 : -1.45, row2Y - 0.75, 0]);
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(gapArr, gapTxt)),
    new M.FadeIn(wPillC), new M.FadeIn(wPillH),
    ...fbox([['weights:', C.amber], ['City weight = 6', C.cyan], ['Hill weight = 4', ORANGE]], C.amber),
    ...say('WEIGHTS: 6 AND 4', C.amber)
  );

  // =========================================================================
  // ACT 3 (Sentences 30-40): Formula, benefits, trap, next lesson, recap
  // =========================================================================
  // 30: Here is the idea in one line. (short beat: 2.56s)
  await until(S(30));
  await play(new M.FadeOut(new M.VGroup(wPillC, wPillH)), ...say('THE IDEA IN ONE LINE', C.cyan));

  // 31: Estimate equals City weight times City mean, plus Hill weight times Hill mean, all divided by the total weight.
  await until(S(31));
  await play(
    ...fbox([
      ['estimate =', C.ink],
      [' (City wt × City mean', C.cyan],
      ['+ Hill wt × Hill mean)', ORANGE],
      [' ÷ total weight', C.amber]
    ], C.cyan),
    ...say('WEIGHTED ESTIMATE FORMULA', C.cyan)
  );

  // 32: In everyday words: average inside each group, then let each group count as much as its size.
  await until(S(32));
  await play(
    new M.Indicate(mulC, { color: C.cyan }),
    new M.Indicate(mulH, { color: ORANGE }),
    new M.Indicate(estDot30, { color: C.green }),
    ...say('AVERAGE EACH, WEIGHT BY SIZE', C.green)
  );

  // 33: This is what stratified sampling is for: every group is sure to be in the sample.
  const whyC = mkCard(P ? [-1.75, 0.25, 0] : [CX - 1.8, 0.35, 0], cardW, cardH, '✓ City (600)', '10 sampled', C.cyan);
  const whyH = mkCard(P ? [1.75, 0.25, 0] : [CX + 1.8, 0.35, 0], cardW, cardH, '✓ Hill (400)', '10 sampled', ORANGE);
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(weightHdr, ...cityTiles, ...hillTiles, mulC, mulH)),
    new M.FadeIn(whyC), new M.FadeIn(whyH),
    ...fbox([['Why stratify?', C.green], '1. Every group in'], C.green),
    ...say('EVERY GROUP IS INCLUDED', C.green)
  );

  // 34: It gives steadier answers when groups differ a lot, like our two campuses.
  const brkY1 = P ? -1.1 : -0.58, brkY2 = P ? -1.75 : -1.08;
  const srsBar = new M.Line({ start: [a2x(22), brkY1, 0], end: [a2x(38), brkY1, 0], color: C.muted, strokeWidth: 6 });
  const srsLab = T('Simple random: wide', P ? 15 : 16, C.muted, true); srsLab.moveTo([a2x(30), brkY1 + 0.28, 0]);
  const strBar = new M.Line({ start: [a2x(28), brkY2, 0], end: [a2x(32), brkY2, 0], color: C.green, strokeWidth: 8 });
  const strLab = T('Stratified: steady', P ? 15 : 16, C.green, true); strLab.moveTo([a2x(30), brkY2 + 0.28, 0]);
  const spreadGrp = new M.VGroup(srsBar, srsLab, strBar, strLab);
  await until(S(34));
  await play(
    new M.FadeIn(spreadGrp),
    ...fbox([['Why stratify?', C.green], '1. Every group in', ['2. Steadier answers', C.green]], C.green),
    ...say('STEADIER WHEN GROUPS DIFFER', C.green)
  );

  // 35: It also gives a separate answer for each group, which a planner may need anyway.
  const ansC = mkCard(P ? [-1.75, 0.25, 0] : [CX - 1.8, 0.35, 0], cardW, cardH, 'City campus', '22 min', C.cyan);
  const ansH = mkCard(P ? [1.75, 0.25, 0] : [CX + 1.8, 0.35, 0], cardW, cardH, 'Hill campus', '42 min', ORANGE);
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(whyC, whyH)),
    new M.FadeIn(ansC), new M.FadeIn(ansH),
    ...fbox([['Why stratify?', C.green], '1. Every group in', '2. Steadier answers', ['3. One mean per group', C.amber]], C.green),
    ...say('SEPARATE GROUP ANSWERS', C.amber)
  );

  // 36: Here is a common trap. Forgetting the weights. (short beat: 2.96s)
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(ansC, ansH, spreadGrp)),
    new M.Indicate(midDot32, { color: C.pink }),
    ...fbox([['TRAP: no weights', C.pink], ['(22 + 42) ÷ 2 = 32', C.pink], ['truth = 30', C.amber]], C.pink),
    ...say('TRAP: FORGETTING WEIGHTS', C.pink)
  );

  // 37: If you sample the same number from each campus, you must weight by size when you combine.
  const barW = P ? 5.6 : 5.8, bxL = CX - barW / 2;
  const sampY = P ? 0.55 : 0.72, popY = P ? -0.65 : -0.25;
  const sCityR = new M.Rectangle({ width: barW * 0.5, height: 0.44, color: C.cyan, strokeWidth: 1.5 });
  sCityR.setFill(C.cyan, 0.45); sCityR.moveTo([bxL + barW * 0.25, sampY, 0]);
  const sHillR = new M.Rectangle({ width: barW * 0.5, height: 0.44, color: ORANGE, strokeWidth: 1.5 });
  sHillR.setFill(ORANGE, 0.45); sHillR.moveTo([bxL + barW * 0.75, sampY, 0]);
  const sLab = T('Sample: 10 City (50%) · 10 Hill (50%)', P ? 15 : 16, C.ink, true); sLab.moveTo([CX, sampY + 0.40, 0]);

  const pCityR = new M.Rectangle({ width: barW * 0.6, height: 0.44, color: C.cyan, strokeWidth: 1.5 });
  pCityR.setFill(C.cyan, 0.75); pCityR.moveTo([bxL + barW * 0.30, popY, 0]);
  const pHillR = new M.Rectangle({ width: barW * 0.4, height: 0.44, color: ORANGE, strokeWidth: 1.5 });
  pHillR.setFill(ORANGE, 0.75); pHillR.moveTo([bxL + barW * 0.80, popY, 0]);
  const pLab = T('Real sizes: 600 City (60%) · 400 Hill (40%)', P ? 15 : 16, C.amber, true); pLab.moveTo([CX, popY + 0.40, 0]);
  const trapBars = new M.VGroup(sCityR, sHillR, sLab, pCityR, pHillR, pLab);

  await until(S(37));
  await play(
    new M.FadeIn(trapBars),
    ...say('EQUAL SAMPLES NEED WEIGHTS', C.pink)
  );

  // 38: Otherwise the small campus speaks too loudly.
  const loudBox = new M.RoundedRectangle({ width: barW * 0.5 + 0.14, height: 0.58, cornerRadius: 0.10, color: C.pink, strokeWidth: 3 });
  loudBox.moveTo([bxL + barW * 0.75, sampY, 0]);
  const loudTag = T('Hill gets 50% say!', P ? 17 : 18, C.pink, true);
  loudTag.moveTo([CX, P ? -1.45 : -0.82, 0]);
  await until(S(38));
  await play(
    new M.Create(loudBox), new M.FadeIn(loudTag),
    new M.Indicate(midDot32, { color: C.pink }),
    ...say('SMALL CAMPUS TOO LOUD', C.pink)
  );

  // 39: In the next lesson, we will see a cheaper way to sample, and the price it pays.
  const cBoxes = [-1, 0, 1].map(k => {
    const cx = CX + k * (P ? 2.15 : 2.15), cy = P ? -1.0 : -0.35;
    const r = new M.RoundedRectangle({ width: 1.75, height: 1.45, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([cx, cy, 0]);
    const ds = Array.from({ length: 10 }, (_, j) => {
      const gx = cx + ((j % 5) - 2) * 0.28, gy = cy + (j < 5 ? 0.22 : -0.22);
      return mkDot([gx, gy, 0], k === 2 ? ORANGE : C.cyan, 0.9, 0.08);
    });
    const lbl = T(`Group ${k + 2}`, P ? 15 : 16, C.violet, true); lbl.moveTo([cx, cy - 0.96, 0]);
    return new M.VGroup(r, ...ds, lbl);
  });
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(trapBars, loudBox, loudTag, cityDot, hillDot, midDot32, estDot30)),
    new M.FadeOut(axisLine), ...axisTicks.map(t => new M.FadeOut(t)), new M.FadeOut(axisUnit),
    new M.FadeOut(truthLine), new M.FadeOut(truthLab),
    new M.LaggedStart(cBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.3 }),
    ...fbox([['Next lesson:', C.violet], 'a cheaper way', 'to sample...', ['and its price', C.amber]], C.violet),
    ...say('NEXT: A CHEAPER WAY', C.violet)
  );

  // 40: In one sentence: sample inside each group, then combine the group means weighted by group size.
  const stepSpecs = [
    ['1. SPLIT', 'City (600) & Hill (400)', C.cyan],
    ['2. SAMPLE INSIDE', '10 City & 10 Hill', ORANGE],
    ['3. WEIGHT BY SIZE', '(6×22 + 4×42) ÷ 10 = 30', C.green]
  ];
  const stepCards = stepSpecs.map(([h1, h2, col], idx) => {
    const pos = P ? [0, 0.35 - idx * 1.55, 0] : [CX, 0.72 - idx * 1.28, 0];
    return mkCard(pos, P ? 6.2 : 6.2, P ? 1.18 : 1.0, h1, h2, col, P ? 17 : 18, P ? 20 : 21);
  });
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(...cBoxes)),
    new M.LaggedStart(stepCards.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.8 }),
    ...fbox([['Stratified sampling', C.green], '1. Split into groups', '2. Sample inside each', ['3. Weight by size', C.amber]], C.green),
    ...say('SPLIT · SAMPLE · WEIGHT', C.green)
  );
}

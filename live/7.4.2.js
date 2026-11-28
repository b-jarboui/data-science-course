// 7.4.2 Variance checks: is the spread the same in every group? (live lesson, script.v4.md)
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const SH = [
    { name: 'Morning', w: [29, 30, 31], c: C.amber },
    { name: 'Afternoon', w: [28, 30, 32], c: C.green },
    { name: 'Night', w: [26, 30, 34], c: C.violet }];
  const DIST = SH.map(s => s.w.map(w => Math.abs(w - 30)));
  const AVG = ['2/3', '4/3', '8/3'], AVGV = [2 / 3, 4 / 3, 8 / 3];
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 1.75, 0] : [CX, 1.85, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // lanes: one grams line per shift, 24 g to 36 g
  const LY = P ? [0.75, -1.15, -3.05] : [0.9, -0.3, -1.5];
  const X0 = P ? -2.0 : -4.9, X1 = P ? 3.2 : 1.3, NAMEX = P ? -3.0 : -6.0;
  const gx = g => X0 + (g - 24) / 12 * (X1 - X0);
  const LS = P ? 17 : 17, NS = P ? 17 : 18, DR = P ? 0.13 : 0.12;
  // bars: the distances standing up, one group per shift
  const BB = P ? -4.2 : -2.4, UB = P ? 0.95 : 0.55, GX = P ? [-2.55, -0.3, 1.95] : [-5.2, -2.6, 0.0], AX = P ? 3.6 : 1.6;
  const barX = (k, j) => GX[k] + (j - 1) * 0.5, avgY = k => BB + AVGV[k] * UB;
  // chance bar: from 0 (never) to 1 (always)
  const CB0 = P ? -3.3 : -5.8, CB1 = P ? 3.3 : 1.0, CBY = P ? -3.2 : -1.7, CW = CB1 - CB0;

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const ind = rows.map(([s]) => cw * (s.length - s.trimStart().length));
    const wd = Math.max(...texts.map((t, i) => t.getWidth() + ind[i])) + 0.7, ht = rows.length * lh + 0.4;
    const maxw = P ? FW - 1.2 : 4.0, k = Math.min(1, maxw / wd);
    const at = P ? [0, 4.3 - ht * k / 2, 0] : [4.3, -0.3, 0];
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.35, top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + ind[i] + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOff = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  const dotAt = (x, y, c, r = DR) => new M.Dot({ point: [x, y, 0], radius: r, color: c });
  const mark = (x, y, c) => new M.Line({ start: [x, y - 0.1, 0], end: [x, y - 0.3, 0], color: c, strokeWidth: 5 });
  function stick(k, j) {
    const w = SH[k].w[j], sg = Math.sign(w - 30), a = gx(30) + sg * DR, b = gx(w) - sg * DR;
    const r = new M.Rectangle({ width: Math.abs(b - a), height: 0.09, color: SH[k].c, strokeWidth: 1 });
    r.setFill(SH[k].c, 0.9); r.moveTo([(a + b) / 2, LY[k], 0]); return r;
  }
  function bar(k, j) {
    const d = DIST[k][j], r = new M.Rectangle({ width: 0.28, height: d * UB, color: SH[k].c, strokeWidth: 1 });
    r.setFill(SH[k].c, 0.85); r.moveTo([barX(k, j), BB + d * UB / 2, 0]); return r;
  }
  function makeLanes() {
    const lines = LY.map(y => new M.Line({ start: [X0, y, 0], end: [X1, y, 0], color: C.muted, strokeWidth: 3 }));
    const ticks = [], nums = [];
    for (let g = 24; g <= 36; g += 2) {
      LY.forEach(y => ticks.push(new M.Line({ start: [gx(g), y - 0.07, 0], end: [gx(g), y + 0.07, 0], color: C.muted })));
      nums.push(T(String(g), P ? 16 : 16, C.muted, true).moveTo([gx(g), LY[2] - 0.8, 0]));
    }
    const grams = T('grams', LS, C.muted).moveTo([X1 - 0.3, LY[2] - 1.15, 0]);
    const names = SH.map((s, k) => T(s.name, NS, s.c, false, true).moveTo([NAMEX, LY[k], 0]));
    const dots = SH.map((s, k) => s.w.map(w => dotAt(gx(w), LY[k], s.c)));
    const lab = (v, k, w) => T(String(v), LS, SH[k].c, true).moveTo([gx(w), LY[k] + 0.32, 0]);
    const wLabs = SH.map((s, k) => s.w.map(w => lab(w, k, w)));
    const dLabs = SH.map((s, k) => s.w.map((w, j) => lab(DIST[k][j], k, w)));
    const sticks = SH.map((s, k) => [0, 2].map(j => stick(k, j)));   // the middle cookie is 0 away
    const meds = LY.map(y => mark(gx(30), y, C.cyan));
    const medLab = T('median = 30', LS, C.cyan).moveTo([gx(30), LY[2] - 1.15, 0]);
    return { lines, ticks, nums, grams, names, dots, wLabs, dLabs, sticks, meds, medLab };
  }
  const ln = makeLanes();

  // 0-2 the bakery, the target weight, three cookies per shift
  await until(S(0)); await play(new M.LaggedStart(ln.names.map(n => new M.FadeIn(n)), { lagRatio: 0.3, runTime: 1.4 }), ...say('3 SHIFTS: MORNING · AFTERNOON · NIGHT'));
  const big = new M.Circle({ radius: 0.6, color: C.amber, strokeWidth: 3 }); big.setFill(C.amber, 0.18); big.moveTo([gx(30), LY[1], 0]);
  const bigLab = T('30 g', P ? 22 : 24, C.ink, true, true).moveTo([gx(30), LY[1], 0]);
  await until(S(1)); await play(new M.FadeIn(big), new M.FadeIn(bigLab), ...say('EVERY COOKIE SHOULD WEIGH 30 g', C.amber));
  const cookies = SH.map((s, k) => [27, 30, 33].map(g => { const c = new M.Circle({ radius: 0.2, color: s.c, strokeWidth: 2 }); c.setFill(s.c, 0.3); c.moveTo([gx(g), LY[k], 0]); return c; }));
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(big, bigLab)), new M.LaggedStart(cookies.flat().map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('3 COOKIES FROM EACH SHIFT, WEIGHED'));

  // 3-6 each cookie becomes a dot on a grams line
  await until(S(3));
  await play(...ln.lines.map(l => new M.Create(l)), new M.FadeIn(new M.VGroup(...ln.ticks, ...ln.nums, ln.grams)),
    ...cookies.flatMap((row, k) => row.map((c, j) => new M.Transform(c, dotAt(gx(SH[k].w[j]), LY[k] + 0.5, SH[k].c)))), ...say('EACH DOT = ONE COOKIE · LINE IN GRAMS'));
  const dots = cookies;
  for (let k = 0; k < 3; k++) {
    await until(S(4 + k));
    await play(...dots[k].map((d, j) => new M.Transform(d, dotAt(gx(SH[k].w[j]), LY[k], SH[k].c))), new M.FadeIn(new M.VGroup(...ln.wLabs[k])),
      ...say(`${SH[k].name.toUpperCase()}: ${SH[k].w.join(', ')} g`, SH[k].c));
  }

  // 7-8 the same average, different spreads
  const avgMarks = LY.map(y => mark(gx(30), y, C.ink));
  const avgLab = T('average = 30', LS, C.ink).moveTo([gx(30), LY[2] - 1.15, 0]);
  await until(S(7)); await play(new M.FadeIn(new M.VGroup(...avgMarks, avgLab)), ...say('ALL THREE SHIFTS AVERAGE 30 g'),
    ...fbox(['average weight', ['(29 + 30 + 31) ÷ 3 = 30', C.amber], ['(28 + 30 + 32) ÷ 3 = 30', C.green], ['(26 + 30 + 34) ÷ 3 = 30', C.violet]]));
  const ranges = [], rlabs = [];
  SH.forEach((s, k) => {
    const lo = Math.min(...s.w), hi = Math.max(...s.w), y = LY[k] - 0.45;
    ranges.push(new M.Line({ start: [gx(lo), y, 0], end: [gx(hi), y, 0], color: s.c, strokeWidth: 4 }));
    rlabs.push(T(`${hi - lo} g`, LS, s.c, true).moveTo([gx(hi) + 0.42, y, 0]));
  });
  const rbox = ['heaviest − lightest', ['31 − 29 = 2 g', C.amber], ['32 − 28 = 4 g', C.green], ['34 − 26 = 8 g', C.violet]];
  for (let k = 0; k < 3; k++) {
    await until(S(8) + [0, 3.4, 5.4][k]);
    await play(new M.Create(ranges[k]), new M.FadeIn(rlabs[k]), ...fbox(rbox.slice(0, k + 2)), ...say(`${SH[k].name.toUpperCase()}: ${[2, 4, 8][k]} g APART`, SH[k].c));
  }

  // 9-13 spread, variance, the question, the assumption
  await until(S(9)); await play(new M.LaggedStart(ranges.map(r => new M.Indicate(r, { color: C.ink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('SPREAD = HOW WIDELY VALUES SCATTER'));
  await until(S(10)); await play(...say('VARIANCE: ONE MEASURE OF SPREAD', C.violet));
  await until(S(10) + 3.2); await play(...say('SO: VARIANCE CHECKS', C.violet));
  await until(S(11)); await play(...say('REAL DIFFERENCE IN SPREAD, OR CHANCE?', C.amber));
  await until(S(12)); await play(...say('COMPARING AVERAGES NEEDS EQUAL SPREADS', C.amber),
    ...fbox(['usual tool: compare averages', ['needs: equal spreads', C.amber]], C.amber));
  await until(S(13)); await play(...say('A CONDITION LIKE THIS = AN ASSUMPTION', C.green),
    ...fbox(['usual tool: compare averages', ['assumption: equal spreads', C.green]], C.green));

  // 14-16 distance from the middle; the middle is the median
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(...ranges, ...rlabs, ...avgMarks, avgLab)), ...boxOff(), ...say('HOW FAR IS EACH COOKIE FROM THE MIDDLE?'));
  await until(S(15)); await play(new M.LaggedStart(dots.map(r => new M.Indicate(r[1], { color: C.cyan })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('MEDIAN = MIDDLE VALUE ONCE SORTED'), ...fbox(['sorted: the middle one', ['29  (30)  31', C.amber], ['28  (30)  32', C.green], ['26  (30)  34', C.violet]]));
  await until(S(16)); await play(new M.FadeIn(new M.VGroup(...ln.meds, ln.medLab)), ...say('EVERY MEDIAN = 30 g'),
    ...fbox(['median', ['morning   30', C.amber], ['afternoon 30', C.green], ['night     30', C.violet]]));

  // 17-19 one odd cookie moves the average, not the median
  const XOFF = X1 + (P ? 0.45 : 0.5), odd = dots[2][2];
  const gapLine = new M.DashedLine({ start: [X1, LY[2], 0], end: [XOFF - 0.18, LY[2], 0], color: C.muted });
  const lab50 = T('50', LS, C.pink, true).moveTo([XOFF, LY[2] + 0.32, 0]);
  await until(S(17)); await play(new M.Transform(odd, dotAt(XOFF, LY[2], C.pink)), new M.FadeOut(ln.wLabs[2][2]), new M.FadeIn(lab50), new M.Create(gapLine),
    ...say('WHAT IF ONE NIGHT COOKIE WEIGHED 50 g?', C.pink));
  const x35 = gx(106 / 3), avg35 = new M.Line({ start: [x35, LY[2] + 0.1, 0], end: [x35, LY[2] + 0.6, 0], color: C.ink, strokeWidth: 5 });
  const lab35 = T('average ≈ 35', P ? 17 : 15, C.ink); lab35.moveTo([Math.min(x35, X1 + 0.5 - lab35.getWidth() / 2), LY[2] + 0.78, 0]);
  await until(S(18)); await play(new M.FadeIn(avg35), new M.FadeIn(lab35), new M.Indicate(ln.meds[2], { color: C.cyan }),
    ...fbox(['night: 26, 30, 50', ['average = 106 ÷ 3 ≈ 35', C.ink], ['median  = 30', C.cyan]]), ...say('AVERAGE JUMPS · MEDIAN STAYS 30', C.amber));
  await until(S(19)); await play(new M.Indicate(ln.medLab, { color: C.cyan }), ...say('ONE ODD COOKIE CANNOT SHAKE THE MEDIAN'));

  // 20-24 each cookie's distance from 30, as a stick
  await until(S(20)); await play(new M.Transform(odd, dotAt(gx(34), LY[2], C.violet)), new M.FadeOut(new M.VGroup(lab50, gapLine, avg35, lab35)), new M.FadeIn(ln.wLabs[2][2]),
    ...boxOff(), ...say('DISTANCE FROM 30: ABOVE OR BELOW, SAME'));
  const dbox = ['distance from 30', ['morning   1, 0, 1', C.amber], ['afternoon 2, 0, 2', C.green], ['night     4, 0, 4', C.violet]];
  for (let k = 0; k < 3; k++) {
    await until(S(21 + k));
    await play(...ln.sticks[k].map(r => new M.Create(r)), new M.FadeOut(new M.VGroup(...ln.wLabs[k])), new M.FadeIn(new M.VGroup(...ln.dLabs[k])),
      ...fbox(dbox.slice(0, k + 2)), ...say(`${SH[k].name.toUpperCase()}: ${DIST[k].join(', ')}${k ? '' : ' g'}`, SH[k].c));
  }
  await until(S(24)); await play(new M.LaggedStart(ln.sticks[2].map(r => new M.Indicate(r, { color: C.violet })), { lagRatio: 0.3, runTime: 1.2 }), ...say('WIDE SHIFT → BIG DISTANCES', C.violet));
  await until(S(24) + 2.0); await play(new M.LaggedStart(ln.sticks[0].map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.3, runTime: 1.2 }), ...say('TIGHT SHIFT → SMALL DISTANCES', C.amber));

  // 25-28 the sticks stand up as bars; average them per shift
  const base = new M.Line({ start: [GX[0] - 0.9, BB, 0], end: [GX[2] + 0.9, BB, 0], color: C.muted, strokeWidth: 2 });
  const bNames = SH.map((s, k) => T(s.name, NS, s.c, false, true).moveTo([GX[k], BB - 0.38, 0]));
  const bLabs = SH.map((s, k) => DIST[k].map((d, j) => T(String(d), LS, s.c, true).moveTo([barX(k, j), BB + d * UB + 0.25, 0])));
  const bars = ln.sticks;   // the same sticks, standing up
  const zeroBars = SH.map((s, k) => new M.Line({ start: [barX(k, 1) - 0.14, BB + 0.03, 0], end: [barX(k, 1) + 0.14, BB + 0.03, 0], color: s.c, strokeWidth: 6 }));
  await until(S(25));
  await play(new M.FadeOut(new M.VGroup(...ln.lines, ...ln.ticks, ...ln.nums, ln.grams, ...ln.names, ...dots.flat(), ...ln.meds, ln.medLab, ...ln.dLabs.flat())),
    ...SH.flatMap((s, k) => [0, 2].map((j, i) => new M.Transform(bars[k][i], bar(k, j)))),
    new M.FadeIn(new M.VGroup(base, ...zeroBars, ...bNames, ...bLabs.flat())), ...say('NEXT: AVERAGE THE DISTANCES'));
  const avgLines = SH.map((s, k) => new M.DashedLine({ start: [GX[k] - 0.7, avgY(k), 0], end: [GX[k] + 0.7, avgY(k), 0], color: s.c }));
  const avgLabs = SH.map((s, k) => { const t = T(AVG[k], LS, s.c, true, true); t.moveTo([GX[k] + 0.78 + t.getWidth() / 2, avgY(k), 0]); return t; });
  await until(S(26)); await play(new M.LaggedStart(bars[0].map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['morning distances', ['1 + 0 + 1 = 2', C.amber]], C.amber), ...say('MORNING: 1 + 0 + 1 = 2', C.amber));
  await until(S(26) + 2.6); await play(new M.Create(avgLines[0]), new M.FadeIn(avgLabs[0]),
    ...fbox(['morning distances', '1 + 0 + 1 = 2', ['2 ÷ 3 = 2/3 g', C.amber]], C.amber), ...say('AVERAGE DISTANCE: 2/3 g', C.amber));
  const abox = k => ['average distance', ['morning   2/3', C.amber], ['afternoon 4/3', C.green], ['night     8/3', C.violet]].slice(0, k + 2);
  await until(S(27)); await play(new M.Create(avgLines[1]), new M.FadeIn(avgLabs[1]), ...fbox(abox(1)), ...say('AFTERNOON: DOUBLE → 4/3', C.green));
  await until(S(27) + 2.4); await play(new M.Create(avgLines[2]), new M.FadeIn(avgLabs[2]), ...fbox(abox(2)), ...say('NIGHT: DOUBLE AGAIN → 8/3', C.violet));
  await until(S(28)); await play(new M.LaggedStart(avgLines.map(l => new M.Indicate(l, { color: C.ink })), { lagRatio: 0.3, runTime: 1.4 }), ...say('SPREAD QUESTION → AVERAGES QUESTION'));

  // 29-31 one-way ANOVA: the gap between the averages against the wobble inside each shift
  await until(S(29)); await play(...say('TOOL FOR AVERAGES: ONE-WAY ANOVA', C.green));
  const rule = SH.map((s, k) => new M.Line({ start: [AX - 0.18, avgY(k), 0], end: [AX + 0.18, avgY(k), 0], color: s.c, strokeWidth: 4 }));
  const gapBar = new M.Line({ start: [AX, avgY(0), 0], end: [AX, avgY(2), 0], color: C.ink, strokeWidth: 3 });
  const gapLab = T('gap', LS, C.ink).moveTo([AX, avgY(2) + 0.3, 0]);
  await until(S(30)); await play(new M.FadeIn(new M.VGroup(...rule)), new M.Create(gapBar), new M.FadeIn(gapLab), ...say('GAP BETWEEN AVERAGES vs WOBBLE INSIDE', C.amber));
  const wob = DIST[2].map((d, j) => new M.Arrow({ start: [barX(2, j) + 0.2, avgY(2), 0], end: [barX(2, j) + 0.2, BB + d * UB, 0], color: C.violet, buff: 0 }));
  await until(S(31)); await play(...say('WOBBLE = DIFFERENCES INSIDE ONE SHIFT', C.violet));
  await until(S(31) + 3.2); await play(new M.LaggedStart(wob.map(a => new M.Create(a)), { lagRatio: 0.3, runTime: 1.2 }), ...say('NIGHT: 4, 0, 4 WOBBLE AROUND 8/3', C.violet));

  // 32-38 Brown–Forsythe: two scores and F
  await until(S(32)); await play(...say('ANOVA ON DISTANCES = BROWN–FORSYTHE', C.green),
    ...fbox(['Brown–Forsythe test', ['= one-way ANOVA', C.green], ['  on the distances', C.green]], C.green));
  await until(S(33)); await play(...fbox([['gap    → gap score', C.ink], ['wobble → wobble score', C.violet]]), ...say('TWO SCORES: GAP AND WOBBLE'));
  await until(S(34)); await play(...say('SCORES ≠ LENGTHS ON SCREEN', C.muted));
  const scores = [['gap score    ≈ 3.11', C.ink], ['wobble score ≈ 2.33', C.violet]];
  await until(S(35)); await play(new M.Indicate(gapBar, { color: C.amber }), ...fbox(scores.slice(0, 1)), ...say('GAP SCORE ≈ 3.11'));
  await until(S(35) + 2.6); await play(new M.LaggedStart(wob.map(a => new M.Indicate(a, { color: C.violet })), { lagRatio: 0.3, runTime: 1.2 }), ...fbox(scores), ...say('WOBBLE SCORE ≈ 2.33', C.violet));
  await until(S(36)); await play(...fbox([...scores, ['F = gap score ÷ wobble score', C.amber]], C.amber), ...say('F = GAP SCORE ÷ WOBBLE SCORE', C.amber));
  await until(S(37)); await play(...fbox([...scores, 'F = 3.11 ÷ 2.33', ['F ≈ 1.33', C.amber]], C.amber), ...say('F ≈ 1.33', C.amber));
  await until(S(38)); await play(new M.Indicate(gapBar, { color: C.green }), ...say('BIG F = GAP CLEARLY BEATS WOBBLE', C.green));

  // 39-44 from F to a chance: the p-value
  const outline = new M.Rectangle({ width: CW, height: 0.36, color: C.muted, strokeWidth: 2 }); outline.moveTo([(CB0 + CB1) / 2, CBY, 0]);
  const ends = [T('0', LS, C.muted, true).moveTo([CB0, CBY - 0.45, 0]), T('1', LS, C.muted, true).moveTo([CB1, CBY - 0.45, 0])];
  const caption = T('chance: 0 = never, 1 = always', LS - 1, C.muted).moveTo([(CB0 + CB1) / 2, CBY - 0.45, 0]);
  await until(S(39));
  await play(new M.FadeOut(new M.VGroup(...bars.flat(), ...zeroBars, base, ...bNames, ...bLabs.flat(), ...avgLines, ...avgLabs, ...rule, gapBar, gapLab, ...wob)),
    new M.Create(outline), new M.FadeIn(new M.VGroup(...ends, caption)), ...fbox(['F ≈ 1.33', ['→ a chance: the p-value', C.amber]], C.amber), ...say('F → A CHANCE: THE p-VALUE', C.amber));
  const rows = P ? [0.9, 0.4, -0.1] : [0.9, 0.45, 0.0];
  const tries = Array.from({ length: 30 }, (_, i) => dotAt(CX + (i % 10 - 4.5) * 0.6, rows[Math.floor(i / 10)], C.muted, 0.1));
  const triesLab = T('tries where the spreads are truly equal', LS - 1, C.muted).moveTo([CX, rows[0] + 0.42, 0]);
  await until(S(40)); await play(new M.LaggedStart(tries.map(d => new M.FadeIn(d)), { lagRatio: 0.05, runTime: 1.6 }), new M.FadeIn(triesLab), ...say('SUPPOSE THE SPREADS WERE TRULY EQUAL', C.muted));
  const HIT = [1, 4, 8, 11, 13, 17, 20, 24, 26, 29];
  const hitLab = T('F this big or bigger: 10 of 30', LS - 1, C.amber).moveTo([CX, rows[2] - 0.42, 0]);
  await until(S(41)); await play(new M.LaggedStart(HIT.map(i => { const [x, y] = tries[i].getCenter(); return new M.Transform(tries[i], dotAt(x, y, C.amber, 0.12)); }), { lagRatio: 0.12, runTime: 1.6 }),
    new M.FadeIn(hitLab), ...say('HOW OFTEN: AN F THIS BIG OR BIGGER?', C.amber));
  const fillP = new M.Rectangle({ width: CW * 0.332, height: 0.36, color: C.amber, strokeWidth: 1 }); fillP.setFill(C.amber, 0.75); fillP.moveTo([CB0 + CW * 0.166, CBY, 0]);
  const pLab = T('p ≈ 1 in 3', LS, C.amber, true).moveTo([CB0 + CW * 0.332, CBY + 0.45, 0]);
  await until(S(42)); await play(new M.FadeIn(fillP), new M.FadeIn(pLab), ...fbox(['F ≈ 1.33', ['p ≈ 0.33 (1 in 3)', C.amber]], C.amber), ...say('p-VALUE ≈ 1 IN 3', C.amber));
  const lx = CB0 + CW * 0.05;
  const zone = new M.Rectangle({ width: CW * 0.05, height: 0.36, color: C.green, strokeWidth: 1 }); zone.setFill(C.green, 0.85); zone.moveTo([CB0 + CW * 0.025, CBY, 0]);
  const cut = new M.Line({ start: [lx, CBY + 0.3, 0], end: [lx, CBY - 0.7, 0], color: C.pink, strokeWidth: 4 });
  const cutLab = T('line: 1 in 20', LS - 1, C.pink, true); cutLab.moveTo([lx - 0.1 + cutLab.getWidth() / 2, CBY - 0.95, 0]);
  const sigLab = T('significant', LS - 1, C.green).moveTo([CB0 + 0.6, CBY + 0.45, 0]);
  await until(S(43)); await play(new M.FadeIn(zone), new M.Create(cut), new M.FadeIn(cutLab), new M.FadeIn(sigLab),
    ...fbox(['F ≈ 1.33', ['p ≈ 0.33 (1 in 3)', C.amber], ['line: 0.05 (1 in 20)', C.pink]], C.amber), ...say('BELOW 1 IN 20 → "SIGNIFICANT"', C.green));
  await until(S(44)); await play(new M.Indicate(pLab, { color: C.amber }),
    ...fbox(['p ≈ 0.33: far above 0.05', ['no clear difference in spread', C.amber]], C.amber), ...say('FAR ABOVE THE LINE: NO CLEAR DIFFERENCE', C.amber));

  // 45-46 the short formula, back on the cookies
  const ln2 = makeLanes();
  await until(S(45));
  await play(new M.FadeOut(new M.VGroup(outline, fillP, zone, cut, ...ends, caption, cutLab, sigLab, pLab, ...tries, triesLab, hitLab)),
    new M.FadeIn(new M.VGroup(...ln2.lines, ...ln2.ticks, ...ln2.nums, ln2.grams, ...ln2.names, ...ln2.meds, ln2.medLab, ...ln2.sticks.flat(), ...ln2.dots.flat(), ...ln2.dLabs.flat())),
    ...fbox(['distance =', '  | weight − median |', ['| | : counted as positive', C.muted]]), ...say('AS A SHORT FORMULA'));
  await until(S(46)); await play(...fbox(['distance =', '  | weight − median |', ['| | : counted as positive', C.muted], ['F = gap score ÷ wobble score', C.amber]], C.amber),
    ...say('F = GAP SCORE ÷ WOBBLE SCORE', C.amber));

  // 47 what it is for
  await until(S(47)); await play(new M.LaggedStart(ln2.dots[0].map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }), ...say('USE: ARE SOME GROUPS MORE CONSISTENT?', C.green));
  await until(S(47) + 4.0); await play(...say('FOR EXAMPLE: BEFORE AN ANOVA', C.green), ...fbox(['before an ANOVA, check:', ['equal spreads?', C.green]], C.green));

  // 48-50 the trap: too few cookies
  await until(S(48)); await play(new M.LaggedStart(ln2.sticks[2].map(r => new M.Indicate(r, { color: C.pink })), { lagRatio: 0.3, runTime: 1.2 }), ...say('THE TRAP: 4 TIMES AS SCATTERED, YET…', C.pink),
    ...fbox([['morning avg distance 2/3', C.amber], ['night   avg distance 8/3', C.violet], ['night = 4 × morning', C.pink], 'yet p ≈ 0.33'], C.pink));
  await until(S(49)); await play(new M.LaggedStart(ln2.dots.flat().map(d => new M.Indicate(d, { color: C.ink })), { lagRatio: 0.1, runTime: 1.8 }), ...say('ONLY 3 COOKIES PER SHIFT: TOO LITTLE', C.amber));
  const GH = [[27.6, 28.3, 31.7, 32.4], [26.6, 27.3, 32.7, 33.4], [24.6, 25.3, 34.7, 35.4]];
  const ghosts = GH.flatMap((gs, k) => gs.map(g => new M.Circle({ radius: DR, color: C.muted, strokeWidth: 2 }).moveTo([gx(g), LY[k], 0])));
  await until(S(50)); await play(...say('NOT SIGNIFICANT ≠ EQUAL SPREADS', C.pink));
  await until(S(50) + 2.8); await play(new M.LaggedStart(ghosts.map(g => new M.FadeIn(g)), { lagRatio: 0.06, runTime: 1.4 }), ...say('WE MAY JUST NEED MORE COOKIES'));

  // 51 when spreads may differ
  await until(S(51)); await play(new M.FadeOut(new M.VGroup(...ghosts)), ...say('SPREADS MAY DIFFER?', C.green),
    ...fbox(['an ANOVA version that', 'does not need equal spreads'], C.green));
  await until(S(51) + 4.2); await play(...say('→ WELCH’S ANOVA', C.green),
    ...fbox(['an ANOVA version that', 'does not need equal spreads', ['= Welch’s ANOVA', C.green]], C.green));

  // 52-53 recap and next
  await until(S(52)); await play(...say('IN ONE SENTENCE', C.green),
    ...fbox(['Brown–Forsythe:', ['ANOVA on each value’s', C.green], ['distance from', C.green], ['its group median', C.green]], C.green));
  await until(S(53)); await play(...say('NEXT: DO THE DATA FOLLOW A BELL SHAPE?', C.violet));
}

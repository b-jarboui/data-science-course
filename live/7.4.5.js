// 7.4.5 Family-wise error: Bonferroni's flat line and Holm's rising staircase (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/7.4.md (7.4.5).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const NAMES = ['thickness', 'weight', 'width', 'colour', 'salt'];
  const PV = [0.4, 1.1, 2, 3, 40];                 // sorted p-values, in percent
  const VAL = ['0.4%', '1.1%', '2%', '3%', '40%'];
  const HOLM = [1, 1.25, 5 / 3];                   // 5% ÷ 5, 5% ÷ 4, 5% ÷ 3 (Holm stops at width)
  const CX = P ? 0 : -2.8, SP = P ? 1.25 : 1.15, BW = P ? 0.62 : 0.56;
  const BASE = P ? -4.2 : -1.95, U = P ? 0.98 : 0.54, TOPV = 5.7;
  const NAMEY = BASE - (P ? 0.32 : 0.27), VALY = BASE - (P ? 0.67 : 0.55), FLAGY = BASE - (P ? 1.02 : 0.85);
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = [4.3, -1.3, 0];
  const JAR = P ? [0, -6.15, 0] : [4.3, 0.75, 0], JW = P ? 5.6 : 3.6, JH = P ? 0.7 : 1.0;
  const colx = k => CX + (k - 2) * SP, yAt = pct => BASE + Math.min(pct, TOPV) * U;
  const XL = colx(0) - SP / 2 - 0.1, XR = colx(4) + SP / 2 + 0.1;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent; phone: hangs from y = 4.3
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const ind = rows.map(([s]) => cw * (s.length - s.trimStart().length));
    const wd = Math.max(...texts.map((t, i) => t.getWidth() + ind[i])) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    const left = -wd / 2 + 0.35, top = ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + ind[i] + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const k = Math.min(1, (P ? FW - 1.2 : 4.4) / wd);
    if (k < 1) g.scale(k);
    g.moveTo(P ? [0, 4.3 - ht * k / 2, 0] : BOXP);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0 three shifts of cookies
  const SH = [['morning', C.amber], ['afternoon', C.green], ['night', C.violet]];
  const SX = P ? 2.3 : 1.7, shx = j => CX + (j - 1) * SX;
  const cookies = [], shiftNames = [];
  SH.forEach(([s, c], j) => {
    for (let q = 0; q < 4; q++) {
      const p = [shx(j) + (q % 2 - 0.5) * 0.5, BASE + 1.6 + (Math.floor(q / 2) - 0.5) * 0.5, 0];
      const halo = new M.Dot({ point: p, radius: 0.22, color: c }); halo.setFill(c, 0.18);
      cookies.push(new M.VGroup(halo, new M.Dot({ point: p, radius: 0.11, color: c })));
    }
    const t = T(s, P ? 17 : 18, c); t.moveTo([shx(j), NAMEY, 0]); shiftNames.push(t);
  });
  await until(S(0));
  await play(new M.LaggedStart(cookies.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.6 }),
    new M.LaggedStart(shiftNames.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...say('3 SHIFTS: MORNING, AFTERNOON, NIGHT'));

  // 1 five features
  const feats = NAMES.map((s, k) => { const t = T(s, P ? 18 : 16, C.cyan); t.moveTo(P ? [0, 4.1 - k * 0.4, 0] : [4.3, 1.0 - k * 0.4, 0]); return t; });
  await until(S(1)); await play(new M.LaggedStart(feats.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.5 }), ...say('5 COOKIE FEATURES TESTED', C.amber));

  // 2-7 one test: shift averages, a gap, the p-value
  const AH = P ? [3.2, 4.0, 2.5] : [1.5, 1.9, 1.15], BWI = 0.9;
  const floor0 = new M.Line({ start: [shx(0) - 0.9, BASE, 0], end: [shx(2) + 0.9, BASE, 0], color: C.muted, strokeWidth: 2 });
  const avgBars = SH.map(([, c], j) => { const b = new M.Rectangle({ width: BWI, height: AH[j], color: c, strokeWidth: 1 }); b.setFill(c, 0.75); b.moveTo([shx(j), BASE + AH[j] / 2, 0]); return b; });
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(...cookies, ...feats)), new M.Create(floor0),
    new M.LaggedStart(avgBars.map(b => new M.FadeIn(b)), { lagRatio: 0.25, runTime: 1.4 }), ...say('A TEST COMPARES SHIFT AVERAGES'));
  await until(S(3)); await play(...fbox(['average =', ['total ÷ number of cookies', C.cyan]]));
  await until(S(4)); await play(...say('SUPPOSE: SHIFTS REALLY THE SAME', C.violet));
  const topA = BASE + AH[1], topN = BASE + AH[2];
  const gapLine = new M.DashedLine({ start: [shx(1) + BWI / 2, topA, 0], end: [shx(2) + BWI / 2, topA, 0], color: C.pink });
  const gapBar = new M.Line({ start: [shx(2), topN, 0], end: [shx(2), topA, 0], color: C.pink, strokeWidth: 4 });
  const gapT = T('gap', 17, C.pink); gapT.moveTo([shx(2) + BWI / 2 + 0.4, (topA + topN) / 2, 0]);
  await until(S(5)); await play(new M.Create(gapLine), new M.Create(gapBar), new M.FadeIn(gapT), ...say('HOW LIKELY IS A GAP THIS BIG?', C.amber));
  await until(S(6)); await play(...fbox(['p-value = the chance', ['of a gap this big', C.amber], ['p = probability', C.muted]], C.amber), ...say('THAT CHANCE = THE p-VALUE', C.amber));
  await until(S(7)); await play(new M.Indicate(gapBar, { color: C.green }), ...say('SMALL p SUGGESTS A REAL DIFFERENCE', C.green));

  // 8-13 five p-values as sorted bars
  const floor = new M.Line({ start: [XL, BASE, 0], end: [XR, BASE, 0], color: C.muted, strokeWidth: 2 });
  const names = NAMES.map((s, k) => { const t = fit(T(s, P ? 18 : 16, C.ink), SP - 0.06); t.moveTo([colx(k), NAMEY, 0]); return t; });
  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(floor0, ...avgBars, ...shiftNames, gapLine, gapBar, gapT)), ...clearBox(),
    new M.Create(floor), new M.FadeIn(new M.VGroup(...names)), ...say('5 p-VALUES AS BARS: SMALL → LARGE'));
  const bar = (k, color = C.cyan) => {
    const hgt = Math.min(PV[k], TOPV) * U, b = new M.Rectangle({ width: BW, height: hgt, color, strokeWidth: 1 });
    b.setFill(color, 0.82); b.moveTo([colx(k), BASE + hgt / 2, 0]); return b;
  };
  const bars = [], vals = [];
  for (let k = 0; k < 5; k++) {
    await until(S(9 + k));
    bars.push(bar(k));
    const v = T(VAL[k], P ? 19 : 17, C.cyan, true); v.moveTo([colx(k), VALY, 0]); vals.push(v);
    const extra = [];
    if (k === 4) {   // salt is far taller: cut the bar to fit
      const yb = BASE + 4.6 * U;
      for (const dy of [0, 0.14]) extra.push(new M.FadeIn(new M.Line({ start: [colx(4) - BW / 2 - 0.08, yb + dy - 0.06, 0], end: [colx(4) + BW / 2 + 0.08, yb + dy + 0.06, 0], color: C.bg, strokeWidth: 5 })));
      extra.push(...say('SALT 40%: BAR CUT TO FIT', C.muted));
    }
    await play(new M.FadeIn(bars[k]), new M.FadeIn(v), new M.Indicate(names[k], { color: C.cyan }), ...extra);
  }

  // 14-16 one test: the 5% threshold
  const thLine = (pct, color) => new M.DashedLine({ start: [XL, yAt(pct), 0], end: [XR, yAt(pct), 0], color });
  const thLab = (s, pct, color) => { const t = T(s, P ? 17 : 16, color, true); t.moveTo([XL - 0.12 - t.getWidth() / 2, yAt(pct), 0]); return t; };
  const line5 = thLine(5, C.amber), lab5 = thLab('5%', 5, C.amber);
  await until(S(14)); await play(new M.Create(line5), new M.FadeIn(lab5), ...say('ONE TEST: COMPARE p TO 5%', C.amber));
  await until(S(15)); await play(new M.Indicate(line5, { color: C.amber }), ...say('THIS LINE = A THRESHOLD', C.amber));
  await until(S(16)); await play(new M.LaggedStart(bars.slice(0, 4).map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...say('4 p-VALUES BELOW 5%', C.green));

  // 17-23 many tests: the chance of any false alarm
  await until(S(17)); await play(...say('FALSE ALARM: “DIFFERENT”, BUT NOT REALLY', C.pink));
  await until(S(18)); await play(...say('IF ALL 5 FEATURES ARE REALLY THE SAME', C.violet));
  await until(S(19)); await play(...fbox(['each test:', ['95% chance: no false alarm', C.green]], C.green));
  await until(S(20));
  await play(...fbox(['no false alarm in all 5:', ['0.95×0.95×0.95×0.95×0.95', C.green]], C.green),
    new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.25, runTime: 2.2 }));
  await until(S(21)); await play(...fbox(['0.95×0.95×0.95×0.95×0.95', ['≈ 0.77 → 77%', C.green], ['no false alarm in any test', C.muted]], C.green));
  await until(S(22)); await play(...fbox(['at least one false alarm:', ['1 − 0.77 = 0.23 → 23%', C.pink]], C.pink), ...say('≈ 23% RISK OF A FALSE ALARM', C.pink));
  await until(S(23)); await play(...fbox(['one risk budget:', ['5% for the whole group', C.amber]], C.amber), ...say('GOAL: KEEP IT AT 5%', C.amber));

  // 24-25 the family
  const famTop = yAt(TOPV) + 0.18, famBot = VALY - 0.24;
  const fam = new M.RoundedRectangle({ width: XR - XL, height: famTop - famBot, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  fam.moveTo([CX, (famTop + famBot) / 2, 0]);
  await until(S(24)); await play(new M.Create(fam), ...say('FAMILY = ALL TESTS RUN TOGETHER', C.violet));
  await until(S(25)); await play(...fbox(['family-wise error rate', ['= chance of any false', C.violet], ['  alarm in the family', C.violet]], C.violet), ...say('FAMILY-WISE ERROR RATE', C.violet));

  // 26-32 Bonferroni: one flat threshold
  await until(S(26)); await play(new M.FadeOut(fam), ...say('IDEA 1: SHARE THE BUDGET EQUALLY', C.violet));
  await until(S(27));
  await play(new M.Transform(line5, thLine(1, C.violet)), new M.Transform(lab5, thLab('1%', 1, C.violet)),
    ...fbox(['5% ÷ 5 tests', ['= 1% flat threshold', C.violet]], C.violet));
  await until(S(28)); await play(...say('BONFERRONI RULE: ONE FLAT 1%', C.violet));
  await until(S(29)); await play(...say('AT OR BELOW THE LINE → FLAG (REAL)', C.green));
  const flagT = (k, s, color) => { const t = fit(T(s, P ? 17 : 15, color, true, true), SP - 0.12); t.moveTo([colx(k), FLAGY, 0]); return t; };
  const flagB = flagT(0, 'FLAG', C.green);
  await until(S(30)); await play(new M.Transform(bars[0], bar(0, C.green)), new M.FadeIn(flagB), ...fbox(['thickness: 0.4% ≤ 1%', ['→ flag', C.green]], C.green));
  await until(S(31)); await play(new M.Indicate(bars[1], { color: C.pink }), ...fbox(['weight: 1.1% > 1%', ['→ just above: no flag', C.pink]], C.pink));
  await until(S(32)); await play(...say('FLAG MORE WITH THE SAME BUDGET?', C.amber));

  // 33 the budget as a jar, shared by the tests still waiting
  const jx = JAR[0], jy = JAR[1];
  const jarLines = [[[-1, 1], [-1, -1]], [[-1, -1], [1, -1]], [[1, -1], [1, 1]]].map(([a, b]) => new M.Line({
    start: [jx + a[0] * JW / 2, jy + a[1] * JH / 2, 0], end: [jx + b[0] * JW / 2, jy + b[1] * JH / 2, 0], color: C.amber, strokeWidth: 3 }));
  const jarLab = T('risk budget = 5%', P ? 18 : 16, C.amber); jarLab.moveTo(P ? [jx, jy - JH / 2 - 0.3, 0] : [jx, jy + JH / 2 + 0.3, 0]);
  const shareX = (n, i) => jx - JW / 2 + 0.08 + (JW - 0.16) / n * (i + 0.5);
  const share = (n, i) => {
    const b = new M.Rectangle({ width: (JW - 0.16) / n - 0.07, height: JH - 0.16, color: C.amber, strokeWidth: 1 });
    b.setFill(C.amber, 0.35); b.moveTo([shareX(n, i), jy - 0.02, 0]); return b;
  };
  const shareLabs = (n, s) => Array.from({ length: n }, (_, i) => { const t = fit(T(s, 15, C.ink, true), (JW - 0.16) / n - 0.2); t.moveTo([shareX(n, i), jy - 0.02, 0]); return t; });
  let jarB = Array.from({ length: 5 }, (_, i) => share(5, i)), shLabs = [];
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(line5, lab5, flagB)), new M.Transform(bars[0], bar(0)), ...clearBox());
  await play(new M.FadeIn(new M.VGroup(...jarLines, jarLab)), new M.LaggedStart(jarB.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('BUDGET = A JAR SHARED BY WAITING TESTS', C.amber));

  // 34-37 Holm, step 1: thickness
  const step = k => new M.Line({ start: [colx(k) - SP / 2, yAt(HOLM[k]), 0], end: [colx(k) + SP / 2, yAt(HOLM[k]), 0], color: C.amber, strokeWidth: 4 });
  const riser = k => new M.Line({ start: [colx(k) - SP / 2, yAt(HOLM[k - 1]), 0], end: [colx(k) - SP / 2, yAt(HOLM[k]), 0], color: C.amber, strokeWidth: 4 });
  const stairs = [step(0)];
  shLabs = shareLabs(5, '1%');
  await until(S(34));
  await play(new M.FadeIn(new M.VGroup(...shLabs)), new M.Create(stairs[0]), ...fbox(['5 tests wait', ['5% ÷ 5 = 1%', C.amber]], C.amber), ...say('START WITH THICKNESS', C.amber));
  const flags = [flagT(0, 'FLAG', C.green), flagT(1, 'FLAG', C.green), flagT(2, 'STOP', C.pink), flagT(3, 'SKIP', C.muted), flagT(4, 'SKIP', C.muted)];
  await until(S(35)); await play(new M.Transform(bars[0], bar(0, C.green)), new M.FadeIn(flags[0]), ...fbox(['thickness: 0.4% ≤ 1%', ['→ flag thickness', C.green]], C.green));
  await until(S(36)); await play(new M.FadeOut(new M.VGroup(jarB[0], ...shLabs)), ...say('THICKNESS LEAVES THE WAITING TESTS', C.green));
  jarB = jarB.slice(1); shLabs = [];
  await until(S(37)); await play(...say('A SHARE IS FREED ONLY AFTER A PASS', C.violet));

  // 38-42 four tests share the same jar: the staircase rises, weight passes
  shLabs = shareLabs(4, '1.25%');
  await until(S(38)); await play(...jarB.map((b, i) => new M.Transform(b, share(4, i))), ...say('4 TESTS, SAME JAR → BIGGER SHARES', C.amber));
  await play(new M.FadeIn(new M.VGroup(...shLabs)));
  stairs.push(riser(1), step(1));
  await until(S(39)); await play(new M.Create(stairs[1]), new M.Create(stairs[2]), ...say('EACH FLAG: THE THRESHOLD STEPS UP', C.amber));
  await until(S(40)); await play(...say('HOLM’S METHOD (STURE HOLM)', C.amber));
  await until(S(41)); await play(...shLabs.map(t => new M.Indicate(t, { color: C.amber })), new M.Indicate(stairs[2], { color: C.amber }), ...fbox(['4 tests wait', ['5% ÷ 4 = 1.25%', C.amber]], C.amber));
  await until(S(42));
  await play(new M.Transform(bars[1], bar(1, C.green)), new M.FadeIn(flags[1]), new M.FadeOut(new M.VGroup(jarB[0], ...shLabs)),
    ...fbox(['weight: 1.1% ≤ 1.25%', ['→ flag weight', C.green]], C.green));
  jarB = jarB.slice(1); shLabs = [];

  // 43-47 three tests wait: width fails, Holm stops
  await until(S(43));
  await play(...jarB.map((b, i) => new M.Transform(b, share(3, i))));
  shLabs = shareLabs(3, '1.7%');
  stairs.push(riser(2), step(2));
  await play(new M.FadeIn(new M.VGroup(...shLabs)), new M.Create(stairs[3]), new M.Create(stairs[4]), ...fbox(['3 tests wait', ['5% ÷ 3 ≈ 1.7%', C.amber]], C.amber));
  await until(S(44)); await play(new M.Transform(bars[2], bar(2, C.pink)), new M.FadeIn(flags[2]), ...fbox(['width: 2% > 1.7%', ['→ stop here', C.pink]], C.pink), ...say('STOP AT WIDTH', C.pink));
  await until(S(45)); await play(...say('WIDTH MIGHT STILL BE A FALSE ALARM', C.pink));
  await until(S(46));
  await play(new M.LaggedStart(jarB.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }),
    new M.Indicate(stairs[4], { color: C.amber }), ...say('BUDGET STILL COVERS WIDTH: NO RISE', C.amber));
  await until(S(47));
  await play(new M.Transform(bars[3], bar(3, C.muted)), new M.Transform(bars[4], bar(4, C.muted)), new M.FadeIn(flags[3]), new M.FadeIn(flags[4]),
    ...say('COLOUR AND SALT: NOT CHECKED', C.muted));

  // 48-50 same budget, more flags: the formula
  const bon = thLine(1, C.violet), bonLab = thLab('1%', 1, C.violet);
  await until(S(48));
  await play(new M.FadeOut(new M.VGroup(...jarLines, jarLab, ...jarB, ...shLabs)), new M.Create(bon), new M.FadeIn(bonLab),
    ...fbox(['same budget, 5%:', ['Bonferroni → 1 flag', C.violet], ['Holm       → 2 flags', C.green]], C.green), ...say('BONFERRONI 1 FLAG, HOLM 2 FLAGS', C.green));
  await until(S(49)); await play(...fbox(['threshold =', ['risk budget ÷', C.amber], ['tests still waiting', C.amber]], C.amber), ...say('HOLM’S FORMULA', C.amber));
  await until(S(50)); await play(new M.LaggedStart(stairs.map(l => new M.Indicate(l, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...say('HOLM NEVER FLAGS FEWER', C.green));

  // 51-54 when to use it, and the trap
  await until(S(51)); await play(...say('FEW TESTS + COSTLY FALSE ALARM → HOLM', C.cyan));
  const tiny = thLine(0.05, C.pink);
  await until(S(52)); await play(new M.Create(tiny), ...fbox(['100 tests wait:', ['5% ÷ 100 = 0.05%', C.pink]], C.pink), ...say('TRAP: 100 TESTS', C.pink));
  await until(S(53)); await play(new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.15, runTime: 1.6 }), ...say('TINY THRESHOLD: REAL DIFFERENCES MISSED', C.pink));
  await until(S(54)); await play(new M.FadeOut(tiny), ...say('NEXT: A LOOSER RULE, MORE FLAGS', C.violet));

  // 55 recap
  await until(S(55)); await play(new M.LaggedStart(stairs.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('CLIMB HOLM’S STAIRCASE: ONE RISK BUDGET', C.amber));
}

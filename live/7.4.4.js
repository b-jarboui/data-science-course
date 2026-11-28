// 7.4.4 Many tests: false alarms add up (live lesson, script.v4.md)
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const SH = [
    { name: 'Morning', w: [29, 30, 31], c: C.amber },
    { name: 'Afternoon', w: [28, 30, 32], c: C.green },
    { name: 'Night', w: [26, 30, 34], c: C.violet }];
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 1.75, 0] : [CX, 1.85, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const LS = P ? 18 : 18, NS = P ? 20 : 18;

  // the shifts: one cookie per shift, a short grams line with its 3 weights, then 20 days of one test
  const SX = [-1, 0, 1].map(k => CX + k * (P ? 2.4 : 2.6));
  const NAMEY = P ? 0.55 : 0.9, COOKY = P ? -0.85 : 0, GY = P ? -2.8 : -1.15, DAYY = P ? -4.5 : -2.1;
  // the bar: 100 days side by side
  const X0 = P ? -3.6 : -6.4, X1 = P ? 3.6 : 1.6, CW = (X1 - X0) / 100, BH = P ? 1.3 : 0.55;
  const BARY = P ? -2.6 : -0.55, ROW1 = BARY - (P ? 1.0 : 0.5), ROW2 = BARY - (P ? 1.45 : 0.9), TOP = BARY + BH / 2;
  // the 20 tests as lights; the marble bag
  const LR = P ? 0.24 : 0.13;
  const lightAt = i => P ? [-3.24 + (i % 10) * 0.72, i < 10 ? 0.65 : -0.55, 0] : [-6.2 + i * 0.4, 0.6, 0];
  const BAG = P ? [0, -5.5, 0] : [4.3, -0.5, 0];

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

  // the bar of 100 days: cyan = quiet day, pink = false-alarm day (alarm days fill from the right)
  const cell = (i, c) => { const r = new M.Rectangle({ width: CW * 0.78, height: BH, color: c, strokeWidth: 1 }); r.setFill(c, 0.85); r.moveTo([X0 + (i + 0.5) * CW, BARY, 0]); return r; };
  const cells = Array.from({ length: 100 }, (_, i) => cell(i, C.cyan));
  let quiet = 100, qLab = null, aLab = null;
  function setQuiet(q, runTime = 1.2, qs, as) {
    const ch = [];
    for (let i = quiet - 1; i >= q; i--) ch.push(new M.Transform(cells[i], cell(i, C.pink)));
    for (let i = quiet; i < q; i++) ch.push(new M.Transform(cells[i], cell(i, C.cyan)));
    quiet = q;
    const a = ch.length ? [new M.LaggedStart(ch, { lagRatio: 0.2, runTime })] : [];
    if (qLab) a.push(new M.FadeOut(qLab));
    if (aLab) a.push(new M.FadeOut(aLab));
    qLab = T(qs || `${q} quiet`, LS, C.cyan, true).moveTo([X0 + q * CW / 2, ROW1, 0]);
    a.push(new M.FadeIn(qLab));
    aLab = null;
    if (q < 100) { aLab = T(as || `${100 - q} alarm`, LS, C.pink, true); aLab.moveTo([X1 - aLab.getWidth() / 2, ROW1, 0]); a.push(new M.FadeIn(aLab)); }
    return a;
  }
  let wholeLab = T('whole bar = 100 days', LS, C.muted).moveTo([(X0 + X1) / 2, ROW2, 0]);

  // the lights: one per test; off, on (a false alarm) or dim (not run)
  function bulb(i, mode = 'off') {
    const col = { off: C.muted, on: C.pink, dim: C.line }[mode];
    const c = new M.Circle({ radius: LR, color: col, strokeWidth: 2 });
    c.setFill(mode === 'on' ? C.pink : C.card, mode === 'on' ? 0.9 : 0.95); c.moveTo(lightAt(i)); return c;
  }
  const lights = Array.from({ length: 20 }, (_, i) => bulb(i));
  const light = (i, mode) => new M.Transform(lights[i], bulb(i, mode));
  const tag = (i, s) => T(s, LS - 1, C.pink).moveTo([lightAt(i)[0], lightAt(i)[1] + LR + 0.22, 0]);
  const flash = i => new M.Flash(lights[i], { color: C.pink, flashRadius: LR + 0.08 });

  function makeBag(caption) {
    const bag = new M.RoundedRectangle({ width: 3.0, height: P ? 1.9 : 2.1, cornerRadius: 0.3, color: C.muted, strokeWidth: 2 });
    bag.setFill(C.card, 0.6); bag.moveTo(BAG);
    const marbles = Array.from({ length: 20 }, (_, i) => {
      const red = i === 13, c = new M.Circle({ radius: 0.15, color: red ? C.pink : C.ink, strokeWidth: 2 });
      c.setFill(red ? C.pink : C.ink, 0.9);
      c.moveTo([BAG[0] + (i % 5 - 2) * 0.5, BAG[1] + (1.5 - Math.floor(i / 5)) * (P ? 0.38 : 0.42), 0]); return c;
    });
    const lab = T(caption, LS, C.muted).moveTo([BAG[0], BAG[1] - (P ? 1.25 : 1.4), 0]);
    return { bag, marbles, red: marbles[13], lab };
  }

  // 0-2 the bakery, the question, 20 features a day
  const names = SH.map((s, k) => T(s.name, NS, s.c, false, true).moveTo([SX[k], NAMEY, 0]));
  const cookies = SH.map((s, k) => { const c = new M.Circle({ radius: P ? 0.72 : 0.42, color: s.c, strokeWidth: 3 }); c.setFill(s.c, 0.25); c.moveTo([SX[k], COOKY, 0]); return c; });
  await until(S(0)); await play(new M.LaggedStart([0, 1, 2].flatMap(k => [new M.FadeIn(cookies[k]), new M.FadeIn(names[k])]), { lagRatio: 0.25, runTime: 1.6 }),
    ...say('3 SHIFTS: MORNING · AFTERNOON · NIGHT'));
  await until(S(1)); await play(new M.LaggedStart(cookies.map((c, k) => new M.Indicate(c, { color: SH[k].c })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('DO THE SHIFTS BAKE DIFFERENT COOKIES?', C.amber));
  await until(S(2)); await play(...fbox(['20 features, every day', ['weight, width, colour', C.cyan], ['… and 17 more', C.muted]]), ...say('20 FEATURES TESTED EVERY DAY'));

  // 3-4 one test: one feature (weight) across the three shifts
  const gl = SX.map(x => new M.Line({ start: [x - 1.0, GY, 0], end: [x + 1.0, GY, 0], color: C.muted, strokeWidth: 2 }));
  const gx = (k, w) => SX[k] + (w - 30) * 0.25;
  const wd = SH.map((s, k) => s.w.map(w => new M.Dot({ point: [gx(k, w), GY, 0], radius: 0.09, color: s.c })));
  const gLab = T('grams', LS - 1, C.muted).moveTo([SX[2] + 0.75, GY - 0.35, 0]);
  await until(S(3)); await play(...gl.map(l => new M.Create(l)), new M.LaggedStart(wd.flat().map(d => new M.FadeIn(d)), { lagRatio: 0.1, runTime: 1.4 }), new M.FadeIn(gLab),
    ...fbox(['weight (grams)', ['morning   29, 30, 31', C.amber], ['afternoon 28, 30, 32', C.green], ['night     26, 30, 34', C.violet]]), ...say('ONE TEST: WEIGHT, ACROSS 3 SHIFTS'));
  await until(S(4)); await play(new M.LaggedStart(wd.map((row, k) => new M.Indicate(new M.VGroup(...row), { color: SH[k].c })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('TOO DIFFERENT TO BE LUCK ALONE?', C.amber));

  // 5-8 truly the same, luck says "different": a false alarm, 1 day in 20
  const eq = [0, 1].map(k => T('=', 30, C.green, true, true).moveTo([(SX[k] + SX[k + 1]) / 2, COOKY, 0]));
  await until(S(5)); await play(new M.FadeIn(eq[0]), new M.FadeIn(eq[1]), ...fbox(['suppose:', ['all 3 shifts bake', C.green], ['the same cookies', C.green]], C.green),
    ...say('SUPPOSE: NO REAL DIFFERENCE', C.green));
  const OFF = [-1, 0, 1];
  await until(S(6)); await play(...SH.flatMap((s, k) => s.w.map((w, j) => new M.Transform(wd[k][j], new M.Dot({ point: [gx(k, w + OFF[k]), GY, 0], radius: 0.09, color: s.c })))),
    ...say('LUCK: THE SHIFTS LOOK DIFFERENT', C.pink));
  await until(S(6) + 3.0); await play(...fbox(['test on a lucky day:', ['"different!"', C.pink]], C.pink), ...say('THE TEST SAYS: YES, DIFFERENT', C.pink));
  await until(S(7)); await play(new M.LaggedStart(eq.map(e => new M.Indicate(e, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['test says: "different"', ['truly: no difference', C.green], ['= a false alarm', C.pink]], C.pink), ...say('A FALSE ALARM', C.pink));
  const days = Array.from({ length: 20 }, (_, i) => {
    const c = i === 12 ? C.pink : C.cyan, r = new M.Rectangle({ width: P ? 0.3 : 0.26, height: P ? 0.3 : 0.26, color: c, strokeWidth: 1 });
    r.setFill(c, 0.75); r.moveTo([CX + (i - 9.5) * (P ? 0.36 : 0.34), DAYY, 0]); return r;
  });
  const daysLab = T('20 days of one test: 1 false alarm', LS - 1, C.muted).moveTo([CX, DAYY - (P ? 0.5 : 0.42), 0]);
  await until(S(8)); await play(new M.LaggedStart(days.map(d => new M.FadeIn(d)), { lagRatio: 0.1, runTime: 1.6 }), new M.FadeIn(daysLab),
    ...fbox(['each test:', ['5 days in 100', C.pink], ['= 1 day in 20', C.pink]], C.pink), ...say('5 DAYS IN 100 = 1 DAY IN 20', C.pink));
  await play(new M.Flash(days[12], { color: C.pink }));

  // 9-10 the bar of 100 days
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(...names, ...cookies, ...gl, ...wd.flat(), gLab, ...eq, ...days, daysLab)), ...boxOff(),
    new M.LaggedStart(cells.map(c => new M.FadeIn(c)), { lagRatio: 0.03, runTime: 1.6 }), new M.FadeIn(wholeLab), ...say('THE WHOLE BAR = 100 DAYS'));
  await until(S(10)); await play(...setQuiet(95), ...fbox(['one test, 100 days', ['95 quiet days', C.cyan], ['5 false-alarm days', C.pink]]),
    ...say('ONE TEST: 95 QUIET, 5 FALSE ALARMS'));

  // 11-12 twenty tests = twenty lights
  await until(S(11)); await play(new M.LaggedStart(lights.map(l => new M.FadeIn(l)), { lagRatio: 0.1, runTime: 1.8 }), ...say('20 TESTS = 20 LIGHTS'));
  await until(S(11) + 3.0); await play(light(6, 'on'), flash(6), ...say('A FLASH = A FALSE ALARM', C.pink));
  await until(S(12)); await play(light(6, 'off'), ...fbox(['how many days have', ['at least one flash?', C.amber]], C.amber), ...say('HOW MANY DAYS: AT LEAST ONE FLASH?', C.amber));

  // 13-15 the marble bag
  const B1 = makeBag('19 white · 1 red');
  await until(S(13)); await play(...boxOff(), new M.FadeIn(B1.bag), new M.LaggedStart(B1.marbles.map(m => new M.FadeIn(m)), { lagRatio: 0.06, runTime: 1.4 }), new M.FadeIn(B1.lab),
    ...say('A BAG: 19 WHITE, 1 RED MARBLE'));
  await until(S(14)); await play(new M.Indicate(B1.red, { color: C.pink }), new M.Flash(B1.red, { color: C.pink }), ...say('DRAW = TEST · RED = FALSE ALARM', C.pink));
  const draws = Array.from({ length: 20 }, (_, i) => { const [x, y] = lightAt(i); return new M.Dot({ point: [x, y - (P ? 0.42 : 0.35), 0], radius: P ? 0.09 : 0.07, color: i === 12 ? C.pink : C.ink }); });
  await until(S(15)); await play(new M.LaggedStart(draws.map(d => new M.FadeIn(d)), { lagRatio: 0.12, runTime: 2.4 }), ...say('DRAW, PUT IT BACK: 20 TIMES'));
  await play(new M.Flash(draws[12], { color: C.pink }), ...say('RED AT LEAST ONCE: LIKELY', C.pink));

  // 16-18 adding 5% twenty times counts shared days twice
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(B1.bag, ...B1.marbles, B1.lab, ...draws)), ...say('ADD 5% TWENTY TIMES?', C.amber));
  await play(...fbox(['5% + 5% + … + 5%', ['(20 times)', C.muted], ['= 100% ?', C.pink]], C.amber));
  const tW = tag(0, 'weight'), tC = tag(9, 'colour');
  await until(S(17)); await play(light(0, 'on'), light(9, 'on'), new M.FadeIn(tW), new M.FadeIn(tC), flash(0), flash(9),
    ...fbox(['one day:', ['weight flashes', C.pink], ['colour flashes', C.pink]], C.pink), ...say('NO: 2 LIGHTS CAN FLASH THE SAME DAY', C.pink));
  const cx97 = X0 + 97.5 * CW;
  const twoA = new M.Dot({ point: [cx97, TOP + 0.15, 0], radius: 0.08, color: C.pink });
  const twoB = new M.Dot({ point: [cx97, TOP + 0.37, 0], radius: 0.08, color: C.pink });
  await until(S(18)); await play(new M.ReplacementTransform(lights[0].copy(), twoA), new M.ReplacementTransform(lights[9].copy(), twoB), new M.Indicate(cells[97], { color: C.pink }),
    ...fbox(['2 flashes, same day', ['adding counts: 2', C.pink], ['alarm days: just 1', C.cyan]], C.pink), ...say('ONE DAY, BUT ADDING COUNTS IT TWICE', C.pink));

  // 19-20 the opposite question; independent tests
  await until(S(19)); await play(new M.FadeOut(new M.VGroup(twoA, twoB, tW, tC)), light(0, 'off'), light(9, 'off'), new M.Indicate(qLab, { color: C.cyan }),
    ...fbox(['ask the opposite:', ['days when ALL lights', C.cyan], ['stay quiet', C.cyan]]), ...say('THE OPPOSITE: ALL LIGHTS QUIET?'));
  await until(S(20)); await play(...fbox(['independent:', ['one test result does', C.green], ['not change another', C.green]], C.green), ...say('INDEPENDENT TESTS', C.green));

  // 21-28 five tests, one at a time
  await until(S(21)); await play(...setQuiet(100), new M.LaggedStart(lights.slice(5).map((l, i) => light(i + 5, 'dim')), { lagRatio: 0.05, runTime: 1.2 }),
    ...fbox(['start: 100 days', ['only 5 tests', C.amber]]), ...say('100 DAYS, ONLY 5 TESTS'));
  await until(S(22)); await play(...setQuiet(95), new M.Indicate(lights[0], { color: C.amber }), ...fbox(['quiet days', ['100 → 95', C.cyan]]), ...say('TEST 1: ABOUT 95 QUIET'));
  await until(S(23)); await play(new M.Indicate(qLab, { color: C.amber }), ...fbox(['each new test takes', ['1 in 20 of the quiet', C.amber], ['days that are left', C.amber]], C.amber),
    ...say('EACH TEST: 1 IN 20 OF THE REST', C.amber));
  const QS = [95, 90, 86, 81, 77];
  const CHAIN = [null,
    ['quiet days', '100 → 95', ['→ 90', C.cyan]],
    ['quiet days', '100 → 95 → 90', ['→ 86', C.cyan]],
    ['quiet days', '100 → 95 → 90 → 86', ['→ 81', C.cyan]],
    ['quiet days', '100 → 95 → 90 → 86', '→ 81', ['→ 77', C.cyan]]];
  for (let k = 1; k < 5; k++) {
    await until(S(23 + k));
    await play(...setQuiet(QS[k]), new M.Indicate(lights[k], { color: C.amber }), ...fbox(CHAIN[k]), ...say(`TEST ${k + 1}: ABOUT ${QS[k]} QUIET`));
  }
  await until(S(28)); await play(new M.Indicate(aLab, { color: C.pink }), ...fbox(['5 tests: 77 quiet', ['alarm: 100 − 77 = 23', C.pink], ['23%, not 5%', C.pink]], C.pink),
    ...say('23% OF DAYS: AT LEAST 1 ALARM', C.pink));

  // 29-32 keep going to 20 tests
  const MORE = [[5, 60, ['tests  quiet days', ' 5     77', ['10     60', C.cyan]], 'ONE LIGHT AT A TIME: 10 TESTS → 60'],
    [10, 46, ['tests  quiet days', ' 5     77', '10     60', ['15     46', C.cyan]], '15 TESTS → ABOUT 46 QUIET'],
    [15, 36, ['tests  quiet days', '10     60', '15     46', ['20     36', C.cyan]], '20 TESTS → ONLY ABOUT 36 QUIET']];
  for (let k = 0; k < 3; k++) {
    const [from, q, rows, pillText] = MORE[k];
    await until(S(29 + k));
    await play(new M.LaggedStart([0, 1, 2, 3, 4].map(j => light(from + j, 'off')), { lagRatio: 0.3, runTime: 2.0 }), ...setQuiet(q, 2.4), ...fbox(rows), ...say(pillText));
  }
  await until(S(32)); await play(new M.Indicate(aLab, { color: C.pink }), ...fbox(['20 tests: 36 quiet', ['alarm: 100 − 36 = 64', C.pink], ['= 64%', C.pink]], C.pink),
    ...say('64%: AT LEAST ONE FALSE ALARM', C.pink));

  // 33-34 the marbles again; the name
  const B2 = makeBag('at least 1 red in 20 draws: 64%');
  await until(S(33)); await play(...boxOff(), ...say('SAME AS: ≥ 1 RED IN 20 DRAWS', C.pink));
  await play(new M.FadeIn(B2.bag), new M.LaggedStart(B2.marbles.map(m => new M.FadeIn(m)), { lagRatio: 0.04, runTime: 1.0 }), new M.FadeIn(B2.lab));
  await play(new M.Flash(B2.red, { color: C.pink }));
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(B2.bag, ...B2.marbles, B2.lab)), new M.LaggedStart(lights.map(l => new M.Indicate(l, { color: C.violet })), { lagRatio: 0.08, runTime: 1.6 }),
    ...say('MULTIPLICITY = MANY TESTS AT ONCE', C.violet));
  await play(...fbox(['multiplicity', ['= many tests at once', C.violet]], C.violet));

  // 35-41 the formula
  await until(S(35)); await play(...fbox(['formula =', ['our steps in', C.green], ['one short line', C.green]], C.green), ...say('A FORMULA: OUR STEPS IN ONE LINE', C.green));
  const wholeOne = T('whole bar = 1', LS, C.muted).moveTo([(X0 + X1) / 2, ROW2, 0]);
  await until(S(36)); await play(new M.FadeOut(wholeLab), new M.FadeIn(wholeOne), ...fbox(['whole bar = 1', ['95 days → 0.95', C.cyan]]), ...say('THE WHOLE BAR = 1'));
  wholeLab = wholeOne;
  await until(S(37)); await play(new M.LaggedStart(lights.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.08, runTime: 2.0 }),
    ...fbox(['0.95 × 0.95 × … × 0.95', ['20 copies: 1 per test', C.muted]], C.amber), ...say('MULTIPLY 20 COPIES OF 0.95', C.amber));
  await until(S(38)); await play(...fbox(['0.95 × 0.95 × … × 0.95', ['= 0.95²⁰', C.amber]], C.amber), ...say('WRITTEN 0.95²⁰: A SMALL 20 UP HIGH', C.amber));
  await until(S(39)); await play(new M.Indicate(qLab, { color: C.cyan }), ...fbox(['0.95²⁰ ≈ 0.36', ['= 36 quiet days', C.cyan]]), ...say('0.95²⁰ ≈ 0.36 = 36 QUIET DAYS'));
  await until(S(40)); await play(new M.Indicate(aLab, { color: C.pink }), ...fbox(['at least 1 false alarm', ['= 1 − 0.95²⁰', C.pink]], C.pink), ...say('THE WHOLE (1) MINUS THAT PART', C.pink));
  await until(S(41)); await play(...fbox(['1 − 0.95²⁰', '= 1 − 0.36', ['= 0.64 → 64%', C.pink]], C.pink), ...say('1 − 0.36 = 0.64 → 64%', C.pink));

  // 42-43 what it is for
  await until(S(42)); await play(...fbox(['use it when you run', ['many tests, and nothing', C.green], ['may be really different', C.green]], C.green), ...say('USE: MANY TESTS, MAYBE NOTHING REAL', C.green));
  await until(S(43)); await play(light(7, 'on'), flash(7), ...say('ONE ALARM? FIRST COUNT EVERY TEST', C.amber));
  await until(S(43) + 1.6); await play(new M.LaggedStart(lights.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.08, runTime: 1.5 }),
    ...fbox(['tests you ran:', ['20, not 1', C.amber]], C.amber));

  // 44-47 trap: tests that move together
  await until(S(44)); await play(light(7, 'off'), ...fbox(['1 − 0.95²⁰ supposes', ['independent tests', C.pink]], C.pink), ...say('TRAP: ARE THE TESTS INDEPENDENT?', C.pink));
  const tW2 = tag(0, 'weight'), tWd = tag(4, 'width');
  await until(S(45)); await play(new M.FadeIn(tW2), new M.FadeIn(tWd), light(0, 'on'), light(4, 'on'),
    ...fbox(['weight and width:', ['lights often flash', C.amber], ['on the same days', C.amber]], C.amber), ...say('WEIGHT AND WIDTH MOVE TOGETHER', C.amber));
  await play(flash(0), flash(4));
  await until(S(46)); await play(...setQuiet(40, 1.2, 'more than 36 quiet', 'fewer than 64 alarm'),
    ...fbox(['shared days count once', ['→ more quiet days', C.cyan]]), ...say('SHARED DAYS COUNT ONLY ONCE', C.green));
  const x5 = X1 - 5 * CW;
  const mark5 = new M.Line({ start: [x5, TOP + 0.04, 0], end: [x5, TOP + 0.24, 0], color: C.pink, strokeWidth: 3 });
  const lab5 = T('5%', LS - 1, C.pink, true).moveTo([x5, TOP + 0.42, 0]);
  await until(S(47)); await play(new M.FadeOut(new M.VGroup(tW2, tWd)), light(0, 'off'), light(4, 'off'), new M.Create(mark5), new M.FadeIn(lab5),
    ...fbox(['real chance:', ['below 64%', C.amber], ['still well above 5%', C.pink]], C.amber), ...say('SMALLER, BUT STILL WELL ABOVE 5%', C.amber));

  // 48-49 bigger trap: hiding the other tests
  const others = lights.map((_, i) => i).filter(i => i !== 7);
  await until(S(48)); await play(light(7, 'on'), flash(7), ...fbox(['report to the boss:', ['"1 test, 1 alarm"', C.pink]], C.pink), ...say('BIGGER TRAP: SHOW ONLY THE ONE ALARM', C.pink));
  await until(S(48) + 3.0); await play(new M.LaggedStart(others.map(i => light(i, 'dim')), { lagRatio: 0.05, runTime: 1.4 }));
  await until(S(49)); await play(new M.LaggedStart(others.map(i => light(i, 'off')), { lagRatio: 0.05, runTime: 1.4 }),
    ...fbox(['boss thinks: 1 chance', ['truth: 20 chances', C.pink]], C.pink), ...say('LUCK HAD 20 CHANCES, NOT 1', C.pink));

  // 50-51 next, recap
  await until(S(50)); await play(light(7, 'off'), ...say('NEXT: ADJUSTING FOR MANY TESTS', C.violet));
  await until(S(51)); await play(new M.LaggedStart(lights.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.08, runTime: 1.6 }),
    ...fbox(['more tests → more luck', ['20 tests: 1 − 0.95²⁰ ≈ 64%', C.pink], ['count every test you run', C.amber]], C.amber), ...say('RECAP: COUNT EVERY TEST', C.amber));
}

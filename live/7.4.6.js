// 7.4.6 False discovery rate: rising cutoffs for ranked tests (live version of script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  // shared data (chapters/7.4.md): luck scores in percent, in the order the features are introduced
  const NAMES = ['weight', 'width', 'thickness', 'colour', 'salt'];
  const PV = [1.1, 2.0, 0.4, 3.0, 40];
  const RANK = [1, 2, 0, 3, 4];          // sorted place of each feature (0 = shortest bar)
  const ORDER = [2, 0, 1, 3, 4];         // feature at each sorted place
  const CX = P ? 0.25 : -2.6, SP = 1.3, BW = P ? 0.62 : 0.56, U = P ? 0.85 : 0.45, BASE = P ? -3.8 : -1.7;
  const VALY = BASE - (P ? 0.32 : 0.28), NAMEY = BASE - (P ? 0.7 : 0.62), RANKY = BASE - (P ? 1.15 : 1.0);
  const PILL = P ? [0, 2.0, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.4, 0] : [4.4, -0.4, 0];
  const colx = k => CX + (k - 2) * SP, yp = v => BASE + Math.min(v, 5.7) * U;
  const X0 = colx(0) - SP / 2, X1 = colx(4) + SP / 2, AX = X0 - 0.05;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pct = v => (Number.isInteger(v) ? String(v) : v.toFixed(1)) + '%';

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  const bar = (k, v, color = C.cyan) => {
    const hgt = Math.min(v, 5.7) * U, b = new M.Rectangle({ width: BW, height: hgt, color, strokeWidth: 1 });
    b.setFill(color, 0.82); b.moveTo([colx(k), BASE + hgt / 2, 0]); return b;
  };
  const row = (y, f, color, size, mono = true, bold = false) =>
    [0, 1, 2, 3, 4].map(k => { const t = T(f(k), size, color, mono, bold); t.moveTo([colx(k), y, 0]); return t; });
  const paint = (b, c) => { b.setFill(c, 0.85); b.setColor(c); };

  // 0-2 three shifts, five features, which to flag
  const SH = [['morning', C.amber], ['afternoon', C.green], ['night', C.violet]];
  const shifts = SH.map(([s, c], i) => {
    const x = (P ? 0 : CX) + (i - 1) * 2.4, y = P ? 0.2 : 0.3;
    const ck = new M.Circle({ radius: 0.42, color: c, strokeWidth: 3 }); ck.setFill(c, 0.35); ck.moveTo([x, y, 0]);
    const t = T(s, 17, c); t.moveTo([x, y - 0.72, 0]);
    return new M.VGroup(ck, t);
  });
  const FEATY = P ? -1.6 : -1.3;
  const names = row(FEATY, k => NAMES[k], C.ink, P ? 17 : 16, false);
  await until(S(0)); await play(new M.LaggedStart(shifts.map(g => new M.FadeIn(g)), { lagRatio: 0.3, runTime: 1.4 }), ...say('3 SHIFTS: MORNING, AFTERNOON, NIGHT', C.amber));
  await until(S(1)); await play(new M.LaggedStart(names.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.4 }), ...say('5 FEATURES: DO THEY DIFFER BY SHIFT?'));
  await until(S(2)); await play(new M.LaggedStart(names.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.15, runTime: 1.6 }), ...say('FLAG = MARK FOR A CLOSER CHECK', C.amber));

  // 3 one bar per feature
  await until(S(3));
  const floor = new M.Line({ start: [X0, BASE, 0], end: [X1, BASE, 0], color: C.muted, strokeWidth: 2 });
  const bars = PV.map((v, k) => bar(k, v));
  let nameRow = row(NAMEY, k => NAMES[k], C.ink, P ? 17 : 16, false);
  await play(new M.FadeOut(new M.VGroup(...shifts, ...names)), new M.Create(floor), new M.FadeIn(new M.VGroup(...nameRow)),
    new M.LaggedStart(bars.map(b => new M.FadeIn(b, { shift: [0, 0.2, 0] })), { lagRatio: 0.2, runTime: 1.8 }), ...say('ONE BAR PER FEATURE'));

  // 4-7 height = luck score = p-value
  await until(S(4));
  const axis = new M.Line({ start: [AX, BASE, 0], end: [AX, BASE + 6 * U, 0], color: C.muted, strokeWidth: 2 });
  const ticks = [0, 1, 2, 3, 4, 5, 6].map(v => new M.VGroup(
    new M.Line({ start: [AX - 0.07, BASE + v * U, 0], end: [AX + 0.07, BASE + v * U, 0], color: C.muted }),
    T(v + '%', P ? 17 : 15, C.muted, true).moveTo([AX - (P ? 0.38 : 0.34), BASE + v * U, 0])));
  const atitle = T('luck score', P ? 18 : 16, C.muted); atitle.moveTo([AX + 0.5, BASE + 6 * U + 0.3, 0]);
  let valRow = row(VALY, k => pct(PV[k]), C.cyan, P ? 18 : 16);
  await play(new M.Create(axis), new M.FadeIn(new M.VGroup(...ticks, atitle)), new M.FadeIn(new M.VGroup(...valRow)), ...say('HEIGHT = LUCK SCORE IN %, NOT SIZE', C.amber));
  await until(S(5)); await play(...say('SAME SHIFTS: HOW LIKELY THIS GAP BY LUCK?'));
  await until(S(6)); await play(new M.Indicate(bars[2], { color: C.green }), new M.Indicate(valRow[2], { color: C.green }), ...say('SHORT BAR = STRONGER EVIDENCE', C.green));
  await until(S(7)); await play(...say('LUCK SCORE = p-VALUE', C.violet));

  // 8 sort from shortest to tallest
  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(...nameRow, ...valRow)),
    ...PV.map((v, f) => new M.Transform(bars[f], bar(RANK[f], v), { pathArc: -0.8, runTime: 1.4 })));
  const B = ORDER.map(f => bars[f]);
  nameRow = row(NAMEY, k => NAMES[ORDER[k]], C.ink, P ? 17 : 16, false);
  valRow = row(VALY, k => pct(PV[ORDER[k]]), C.cyan, P ? 18 : 16);
  const line4 = new M.DashedLine({ start: [X0, BASE + 4 * U, 0], end: [X1, BASE + 4 * U, 0], color: C.green });
  await play(new M.FadeIn(new M.VGroup(...nameRow, ...valRow)), new M.Create(line4), ...say('SORTED: 4 BARS UNDER 4%', C.green));

  // 9 salt is cut off
  await until(S(9));
  const cy = BASE + 5.3 * U;
  const cutMark = new M.Line({ start: [colx(4) - BW / 2 - 0.06, cy - 0.08, 0], end: [colx(4) + BW / 2 + 0.06, cy + 0.08, 0], color: C.bg, strokeWidth: 10 });
  await play(new M.FadeOut(line4), new M.FadeIn(cutMark), new M.Indicate(valRow[4], { color: C.pink }), ...say('SALT = 40%: TOP OF THE BAR CUT OFF', C.pink));

  // 10 ranks
  await until(S(10));
  const rankRow = row(RANKY, k => String(k + 1), C.violet, 18, true, true);
  const rankWord = T('rank', P ? 16 : 15, C.violet); rankWord.moveTo([AX - 0.34, RANKY, 0]);
  await play(new M.FadeIn(rankWord), new M.LaggedStart(rankRow.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.4 }), ...say('RANK = PLACE, FROM 1 TO 5', C.violet));

  // 11-13 false alarms and the new goal
  await until(S(11)); await play(...say('FALSE ALARM: FLAGGED, BUT SHIFTS THE SAME', C.pink));
  await until(S(12)); await play(...say('STRICT RULES: FEW FALSE ALARMS, MORE MISSES', C.muted));
  await until(S(13)); await play(...say('NEW GOAL: SMALL SHARE OF FALSE ALARMS', C.green));

  // 14-18 a hundred cookies marked broken, five are fine
  const GC = P ? 20 : 10, GS = P ? 0.34 : 0.36, GR = 100 / GC;
  const cookies = Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / GC), c = i % GC;
    const d = new M.Dot({ point: [BOXP[0] + (c - (GC - 1) / 2) * GS, (P ? -6.15 : BOXP[1]) + ((GR - 1) / 2 - r) * GS, 0], radius: 0.12, color: C.pink });
    d.setFill(C.pink, 0.85); return d;
  });
  const FINE = [7, 23, 41, 66, 88];
  await until(S(14));
  await play(new M.LaggedStart(cookies.map(d => new M.FadeIn(d)), { lagRatio: 0.02, runTime: 1.6 }), ...say('100 MARKED BROKEN, BUT 5 ARE FINE', C.pink));
  FINE.forEach(i => paint(cookies[i], C.green));
  await play(new M.LaggedStart(FINE.map(i => new M.Flash(cookies[i], { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }));
  await until(S(15)); await play(new M.LaggedStart(FINE.map(i => new M.Indicate(cookies[i], { color: C.green })), { lagRatio: 0.15, runTime: 1.2 }), ...say('5 IN 100 = 5% FALSE ALARMS', C.amber));
  await until(S(16)); await play(...say('TARGET = 5%', C.amber));
  await until(S(17)); await play(...say('ON AVERAGE: ≤ 5 IN EVERY 100 FLAGS', C.amber));
  await until(S(18)); await play(...say('FLAG = DISCOVERY → FALSE DISCOVERY RATE', C.violet));

  // 19-20 each rank gets a cutoff
  await until(S(19)); await play(new M.FadeOut(new M.VGroup(...cookies)), ...say('PASS = BAR AT OR BELOW ITS CUTOFF', C.green));
  await until(S(20)); await play(new M.LaggedStart(rankRow.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }), ...say('HOW TALL SHOULD EACH CUTOFF BE?', C.amber));

  // 21-30 count luck passes in a hundred checks
  const steps = [0, 1, 2, 3, 4].map(k => new M.DashedLine({ start: [colx(k) - SP / 2, BASE + (k + 1) * U, 0], end: [colx(k) + SP / 2, BASE + (k + 1) * U, 0], color: C.amber }));
  const stepLab = [0, 1, 2, 3, 4].map(k => { const t = T((k + 1) + '%', P ? 17 : 15, C.amber, true, true); t.moveTo([colx(k) - BW / 2 - 0.2, BASE + (k + 1) * U + 0.18, 0]); return t; });
  const line1 = new M.DashedLine({ start: [X0, BASE + U, 0], end: [X1, BASE + U, 0], color: C.amber });
  await until(S(21)); await play(...fbox(['100 repeated checks', ['count the luck passes', C.amber]]), ...say('COUNT LUCK PASSES IN 100 CHECKS'));
  await until(S(22)); await play(new M.Create(line1), ...fbox(['no real difference', 'cutoff 1%', ['≈ 1 luck pass in 100', C.amber]]), ...say('NO REAL DIFFERENCE: ~1 PASS IN 100', C.muted));
  await until(S(23)); await play(new M.LaggedStart(B.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }), ...fbox(['5 bars × 1 luck pass', ['≤ 5 luck passes', C.amber]]), ...say('5 BARS → AT MOST 5 LUCK PASSES'));
  await until(S(24)); await play(...fbox(['1 flag per check', ['100 checks → 100 flags', C.amber]]), ...say('1 FLAG PER CHECK'));
  await until(S(25)); await play(...fbox(['≤ 5 luck in 100 flags', ['= 5%  ✓ on target', C.green]]), ...say('5 IN 100 = 5%: ON TARGET', C.green));
  await until(S(26)); await play(new M.FadeOut(line1), new M.Create(steps[0]), new M.FadeIn(stepLab[0]), ...say('RANK 1 CUTOFF = 1%', C.amber));
  await until(S(27)); await play(new M.Create(steps[1]), new M.FadeIn(stepLab[1]), ...fbox(['2 flags per check', ['cutoff 2%', C.amber]]), ...say('2 FLAGS → 2% CUTOFF', C.amber));
  await until(S(28)); await play(new M.LaggedStart(B.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }), ...fbox(['each bar: ≈ 2 luck passes', ['5 bars → at most 10', C.amber]]), ...say('5 BARS → AT MOST 10 LUCK PASSES'));
  await until(S(29)); await play(...fbox(['≤ 10 luck in 200 flags', ['= 5%  ✓ again', C.green]]), ...say('10 IN 200 = 5%', C.green));
  await until(S(30)); await play(new M.Create(steps[2]), new M.FadeIn(stepLab[2]), ...fbox(['3 flags, cutoff 3%', '≤ 15 luck in 300 flags', ['= 5%  ✓ still', C.green]]), ...say('15 IN 300 = 5%', C.green));

  // 31-34 the staircase
  await until(S(31));
  await play(...boxOut(), new M.Create(steps[3]), new M.FadeIn(stepLab[3]), new M.Create(steps[4]), new M.FadeIn(stepLab[4]), ...say('EACH RANK ADDS 1%: 1, 2, 3, 4, 5', C.amber));
  await play(new M.LaggedStart(stepLab.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }));
  const risers = [0, 1, 2, 3].map(k => new M.DashedLine({ start: [colx(k) + SP / 2, BASE + (k + 1) * U, 0], end: [colx(k) + SP / 2, BASE + (k + 2) * U, 0], color: C.amber }));
  await until(S(32)); await play(new M.LaggedStart(risers.map(r => new M.Create(r)), { lagRatio: 0.3, runTime: 1.4 }), ...say('A RISING STAIRCASE', C.amber));
  await until(S(33)); await play(...say('BENJAMINI–HOCHBERG METHOD', C.violet));
  await until(S(34)); await play(...say('NAMES: NO NEED TO REMEMBER', C.muted));

  // 35-38 compare each bar with its own cutoff
  await until(S(35)); paint(B[0], C.green);
  await play(new M.Flash(B[0], { color: C.green }), ...say('RANK 1 THICKNESS: 0.4% ≤ 1%  ✓', C.green));
  await until(S(36)); paint(B[1], C.green);
  await play(new M.Flash(B[1], { color: C.green }), ...say('RANK 2 WEIGHT: 1.1% ≤ 2%  ✓', C.green));
  await until(S(37)); paint(B[2], C.green); paint(B[3], C.green);
  await play(new M.Flash(B[2], { color: C.green }), new M.Flash(B[3], { color: C.green }), ...say('WIDTH 2% ≤ 3%, COLOUR 3% ≤ 4%  ✓', C.green));
  await until(S(38)); paint(B[4], C.pink);
  await play(new M.Indicate(B[4], { color: C.pink }), ...say('RANK 5 SALT: 40% > 5%  ✗', C.pink));

  // 39-42 highest passing rank decides
  await until(S(39)); await play(new M.Indicate(rankRow[3], { color: C.green }), new M.Flash(rankRow[3], { color: C.green }), ...say('HIGHEST PASSING RANK = 4', C.green));
  await until(S(40));
  const fTop = BASE + 4.6 * U, fBot = NAMEY - 0.22;
  const flagBox = new M.RoundedRectangle({ width: colx(3) - colx(0) + SP - 0.16, height: fTop - fBot, cornerRadius: 0.14, color: C.green, strokeWidth: 2 });
  flagBox.moveTo([(colx(0) + colx(3)) / 2, (fTop + fBot) / 2, 0]);
  await play(new M.Create(flagBox), ...say('FLAG 4: THICKNESS, WEIGHT, WIDTH, COLOUR', C.green));
  await until(S(41)); paint(B[2], C.pink);
  await play(new M.Indicate(B[2], { color: C.pink }), ...say('PRETEND: WIDTH FAILS, COLOUR PASSES', C.pink));
  await until(S(42)); paint(B[2], C.green);
  await play(new M.Indicate(rankRow[3], { color: C.green }), new M.Indicate(B[2], { color: C.green }), ...say('A HIGHER RANK PASSES → FLAG WIDTH TOO', C.green));

  // 43-44 the short formula
  await until(S(43)); await play(...fbox(['cutoff = (rank ÷ tests)', '         × target rate']), ...say('THE SHORT FORMULA'));
  await until(S(44)); await play(new M.Indicate(stepLab[3], { color: C.amber }), new M.Indicate(steps[3], { color: C.amber }),
    ...fbox(['cutoff = (4 ÷ 5) × 5%', ['       = 4%', C.amber]]), ...say('RANK 4 CUTOFF = 4%', C.amber));

  // 45-46 compared with last lesson
  await until(S(45)); await play(new M.Indicate(B[0], { color: C.muted }), ...fbox(['strict rules: 1 or 2 flags']), ...say('LAST LESSON’S STRICT RULES: 1 OR 2', C.muted));
  await until(S(46)); await play(new M.Indicate(flagBox, { color: C.green }), ...fbox(['strict rules: 1 or 2 flags', ['staircase:    4 flags', C.green]], C.green), ...say('STAIRCASE: 4 FLAGS', C.green));

  // 47-50 when to use it, and the trap
  await until(S(47)); await play(...say('USE IT: FIRST CHECK OF MANY TESTS', C.cyan));
  await until(S(48)); await play(...say('ONE FALSE ALARM COSTLY → STRICT RULES', C.pink));
  await until(S(49)); await play(...say('5% = AVERAGE OVER MANY CHECKS', C.amber));
  await until(S(50)); await play(new M.LaggedStart(B.slice(0, 4).map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.2, runTime: 1.6 }), ...say('1 OF OUR 4 FLAGS COULD BE FALSE', C.pink));

  // 51-52 next and recap
  await until(S(51)); await play(...say('NEXT: TEST DAILY, STOP AT FIRST SUCCESS', C.muted));
  await until(S(52)); await play(new M.LaggedStart(stepLab.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.6 }), ...say('RISING CUTOFFS → SMALL FALSE-ALARM SHARE', C.green));
}

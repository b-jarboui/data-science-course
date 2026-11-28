// 7.4.1 Design determines the test (live version of the lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const NAMES = ['MORNING', 'AFTERNOON', 'NIGHT'], COL = [C.amber, C.green, C.violet];
  const W = [[29, 30, 31], [28, 30, 32], [26, 30, 34]];
  const x0 = P ? -2.3 : -4.7, L0 = P ? 5.9 : 6.5, CX = x0 + L0 / 2, MX = P ? 0 : CX;
  const LANES = P ? [2.5, 0.95, -0.6] : [1.05, -0.05, -1.15], AXY = P ? -1.75 : -1.95;
  const HOTY = P ? 2.3 : 0.8, COOLY = P ? 0.6 : -0.9;
  const PILL = P ? [0, 3.75, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.6, -0.3, 0];
  const DOT = P ? 0.12 : 0.11, HALO = P ? 0.24 : 0.22, VS = P ? 17 : 15, LS = P ? 15 : 17;
  let lo = 25, hi = 35;
  const g2x = g => x0 + (g - lo) / (hi - lo) * L0;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const num = (s, p, color, size = VS) => { const t = T(s, size, color, true); t.moveTo(p); return t; };
  const rowLabel = (s, y, color) => { const t = fit(T(s, LS, color, false, true), P ? 1.4 : 1.8); t.moveTo([x0 - (P ? 0.2 : 0.3) - t.getWidth() / 2, y, 0]); return t; };
  const dot = (p, color, r = DOT) => new M.Dot({ point: p, radius: r, color });
  const halo = (p, color) => { const h = new M.Dot({ point: p, radius: HALO, color }); h.setFill(color, 0.2); return h; };
  const cookie = (p, r) => { const c = new M.Circle({ radius: r, color: C.amber, strokeWidth: 2 }); c.setFill(C.amber, 0.28); c.moveTo(p); return c; };

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan, where = BOXP) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(where);
    const left = where[0] - wd / 2 + 0.35, top = where[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // a grams line from a to b, a tick every `step`, a number every `every`
  function axis(a, b, step, every) {
    lo = a; hi = b;
    const parts = [new M.Line({ start: [x0, AXY, 0], end: [x0 + L0, AXY, 0], color: C.muted, strokeWidth: 3 })];
    for (let g = a; g <= b; g += step) {
      const big = (g - a) % every === 0, t = big ? 0.08 : 0.05;
      parts.push(new M.Line({ start: [g2x(g), AXY - t, 0], end: [g2x(g), AXY + t, 0], color: C.muted }));
      if (big) parts.push(num(String(g), [g2x(g), AXY - 0.34, 0], C.muted, P ? 17 : 17));
    }
    const unit = T('grams', P ? 16 : 16, C.muted); unit.moveTo([x0 + L0 - 0.4, AXY - 0.68, 0]);
    return [...parts, unit];
  }

  // 0-3 three shifts, a 30-gram target, the question, three cookies each
  const labs = NAMES.map((s, k) => rowLabel(s, LANES[k], C.ink));
  await until(S(0)); await play(new M.LaggedStart(labs.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...say('3 SHIFTS'));
  const big = cookie([CX, LANES[1], 0], 0.5), bigTag = num('30 g', [CX + 1.05, LANES[1], 0], C.amber, 26);
  await until(S(1)); await play(new M.FadeIn(big), new M.FadeIn(bigTag), ...say('TARGET: 30 GRAMS EACH', C.amber));
  await until(S(2)); await play(new M.LaggedStart(labs.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }), ...say('HEAVIER OR LIGHTER BY SHIFT?', C.amber));
  const dots = NAMES.map((_, k) => [27, 30, 33].map(g => cookie([g2x(g), LANES[k], 0], 0.2)));
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(big, bigTag)), new M.LaggedStart(dots.flat().map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.6 }), ...say('3 COOKIES PER SHIFT · WEIGHED ONCE'));

  // 4-7 cookies become dots on a grams line, one shift at a time
  const ax = axis(25, 35, 1, 5);
  await until(S(4)); await play(new M.FadeIn(new M.VGroup(...ax)), ...dots.flatMap((row, k) => row.map((c, j) => new M.Transform(c, dot([g2x(W[k][j]), LANES[k], 0], C.cyan)))), ...say('1 GLOWING DOT = 1 COOKIE'));
  const halos = [[], [], []], vals = [[], [], []];
  for (let k = 0; k < 3; k++) {
    await until(S(5 + k));
    const moves = W[k].map((w, j) => {
      const p = [g2x(w), LANES[k], 0];
      halos[k].push(halo(p, COL[k]));
      vals[k].push(num(String(w), [p[0], p[1] - 0.32, 0], COL[k]));
      return new M.Transform(dots[k][j], dot(p, COL[k]));
    });
    const lab = rowLabel(NAMES[k], LANES[k], COL[k]);
    await play(...moves, new M.ReplacementTransform(labs[k], lab), new M.FadeIn(new M.VGroup(...halos[k], ...vals[k])), ...say(`${NAMES[k]}: ${W[k].join(', ')} g`, COL[k]));
    labs[k] = lab;
  }

  // 8-11 the mean: add, split, mark it
  await until(S(8)); await play(new M.LaggedStart(dots[0].map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.3, runTime: 1.5 }),
    ...fbox(['morning', '29 + 30 + 31', ['= 90 g', C.amber]], C.amber), ...say('ADD: 90 GRAMS', C.amber));
  await until(S(9)); await play(...fbox(['total = 90 g', ['90 ÷ 3 = 30 g each', C.amber]], C.amber), ...say('SPLIT 3 WAYS: 30 EACH', C.amber));
  const marks = LANES.map((y, k) => new M.Line({ start: [g2x(30), y + 0.26, 0], end: [g2x(30), y + 0.42, 0], color: COL[k], strokeWidth: 3 }));
  await until(S(10)); await play(new M.Create(marks[0]), ...say('FAIR SHARE = MEAN = AVERAGE', C.green));
  await until(S(11)); await play(new M.Create(marks[1]), new M.Create(marks[2]),
    ...fbox(['morning   90 ÷ 3 = 30', ['afternoon 90 ÷ 3 = 30', C.green], ['night     90 ÷ 3 = 30', C.violet]], C.green), ...say('ALL THREE MEANS = 30', C.green));

  // 12-15 spread, and what a test weighs
  const bars = LANES.map((y, k) => new M.Line({ start: [g2x(W[k][0]), y - 0.53, 0], end: [g2x(W[k][2]), y - 0.53, 0], color: COL[k], strokeWidth: 4 }));
  const spr = LANES.map((y, k) => num(`${W[k][2] - W[k][0]} g`, [g2x(W[k][2]) + 0.42, y - 0.53, 0], COL[k]));
  await until(S(12)); await play(new M.LaggedStart(bars.map(b => new M.Create(b)), { lagRatio: 0.3, runTime: 1.5 }), new M.FadeIn(new M.VGroup(...spr)), ...say('SPREAD = HOW FAR APART', C.pink));
  await until(S(13)); await play(new M.LaggedStart([new M.Indicate(bars[0], { color: C.amber }), new M.Indicate(bars[2], { color: C.violet })], { lagRatio: 0.6, runTime: 2.0 }), ...say('MORNING TIGHT · NIGHT WIDE', C.pink));
  await until(S(14)); await play(new M.LaggedStart(marks.map((m, k) => new M.Indicate(m, { color: COL[k] })), { lagRatio: 0.3, runTime: 1.4 }), ...say('AVERAGES MATCH: 30 · 30 · 30', C.green));
  await until(S(14) + 2.4); await play(...say('REAL DATA: THEY DIFFER A LITTLE', C.muted));
  await until(S(15)); await play(...fbox(['a test asks:', 'is the gap between averages', ['bigger than plain luck?', C.amber]], C.amber), ...say('TEST: REAL GAP OR LUCK?', C.amber));

  // 16-17 a key for a lock
  const lk = P ? [-1.4, -3.7] : [3.5, -0.4], ky = P ? [1.5, -3.5] : [5.7, -0.2];
  const body = new M.RoundedRectangle({ width: 1.1, height: 0.9, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
  body.setFill(C.card, 0.95); body.moveTo([lk[0], lk[1], 0]);
  const shackle = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color: C.cyan, strokeWidth: 3 }); shackle.moveTo([lk[0], lk[1] + 0.63, 0]);
  const hole = dot([lk[0], lk[1] + 0.08, 0], C.cyan, 0.09);
  const slit = new M.Line({ start: [lk[0], lk[1] + 0.05, 0], end: [lk[0], lk[1] - 0.2, 0], color: C.cyan, strokeWidth: 3 });
  const lockG = new M.VGroup(body, shackle, hole, slit);
  const bow = new M.Circle({ radius: 0.25, color: C.amber, strokeWidth: 3 }); bow.moveTo([ky[0] - 0.75, ky[1], 0]);
  const keyG = new M.VGroup(bow,
    new M.Line({ start: [ky[0] - 0.5, ky[1], 0], end: [ky[0] + 0.75, ky[1], 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [ky[0] + 0.45, ky[1], 0], end: [ky[0] + 0.45, ky[1] - 0.22, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [ky[0] + 0.7, ky[1], 0], end: [ky[0] + 0.7, ky[1] - 0.22, 0], color: C.amber, strokeWidth: 3 }),
    num('test', [ky[0], ky[1] - 0.6, 0], C.amber, 16));
  await until(S(16)); await play(...boxOut(), new M.LaggedStart([new M.FadeIn(lockG), new M.FadeIn(keyG)], { lagRatio: 0.5, runTime: 1.4 }), ...say('CHOOSE A TEST = CHOOSE A KEY', C.amber));
  const lockT = T('question + design', 16, C.cyan); lockT.moveTo([lk[0], lk[1] - 0.75, 0]);
  await until(S(17)); await play(new M.FadeIn(lockT), new M.Indicate(lockG, { color: C.cyan }), ...say('LOCK = QUESTION + DESIGN', C.cyan));

  // 18-25 read the design: three questions
  await until(S(18)); await play(new M.FadeOut(new M.VGroup(lockG, keyG, lockT)),
    ...fbox(['read the design:', '1  kind of answer?', '2  how many groups?', '3  paired?'], C.violet), ...say('3 SHORT QUESTIONS', C.violet));
  await until(S(19)); await play(new M.LaggedStart(dots.flat().map(d => new M.Indicate(d)), { lagRatio: 0.1, runTime: 1.6 }),
    ...fbox([['1  answer: a number (g)', C.amber], ['2  groups: ?', C.muted], ['3  paired: ?', C.muted]], C.violet), ...say('ANSWER = A NUMBER: WEIGHT', C.amber));
  await until(S(20)); await play(new M.LaggedStart(labs.map((t, k) => new M.Indicate(t, { color: COL[k] })), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['1  answer: a number (g)', ['2  groups: 3 shifts', C.amber], ['3  paired: ?', C.muted]], C.violet), ...say('GROUPS: 3 SHIFTS', C.amber));
  await until(S(21)); await play(...fbox(['1  answer: a number (g)', '2  groups: 3 shifts', ['3  paired: ?', C.amber]], C.violet), ...say('PAIRED?', C.amber));
  await until(S(22)); await play(...fbox(['paired = 2 linked readings', 'like the same cookie', ['weighed twice', C.violet]], C.violet), ...say('PAIRED = LINKED READINGS', C.violet));
  await until(S(23)); await play(new M.LaggedStart(dots.flat().map((d, i) => new M.Flash(d, { color: COL[Math.floor(i / 3)] })), { lagRatio: 0.12, runTime: 1.8 }),
    ...fbox(['1  answer: a number (g)', '2  groups: 3 shifts', ['3  paired: no', C.green], ['   → independent', C.green]], C.green), ...say('WEIGHED ONCE → INDEPENDENT', C.green));
  await until(S(24)); await play(...fbox([['a number', C.amber], ['3 groups', C.amber], ['independent', C.amber]], C.amber), ...say('NUMBER · 3 GROUPS · INDEPENDENT', C.amber));
  await until(S(25)); await play(...fbox(['number · 3 groups', 'independent', ['→ one-way ANOVA', C.amber], ['analysis of variance', C.muted]], C.amber), ...say('KEY: ONE-WAY ANOVA ("A NOVA")', C.amber));

  // 26-28 what ANOVA compares
  await until(S(26)); await play(new M.LaggedStart([...marks, ...bars].map((m, i) => new M.Indicate(m, { color: COL[i % 3] })), { lagRatio: 0.3, runTime: 2.6 }), ...say('AVERAGES vs SPREAD INSIDE', C.green));
  await until(S(27)); await play(new M.LaggedStart(labs.map((t, k) => new M.Indicate(t, { color: COL[k] })), { lagRatio: 0.3, runTime: 1.4 }), ...say('ONE-WAY: ONE SPLIT, BY SHIFT', C.cyan));
  await until(S(28)); await play(...say('ANOVA EXPECTS SIMILAR SPREADS', C.violet));
  await until(S(28) + 2.6); await play(new M.Indicate(bars[2], { color: C.violet }), ...say('NIGHT IS WIDER → NEXT LESSON', C.violet));

  // 29-33 change 1: two shifts
  await until(S(29)); await play(...fbox(['1  answer: a number', '2  groups: 3 shifts', '3  paired: no']), ...say('NOW CHANGE THE DESIGN', C.pink));
  await until(S(30)); await play(new M.FadeOut(new M.VGroup(labs[1], ...dots[1], ...halos[1], ...vals[1], marks[1], bars[1], spr[1])),
    ...fbox(['1  answer: a number', ['2  groups: 2 shifts', C.amber], '3  paired: no']), ...say('CHANGE 1: TWO SHIFTS', C.pink));
  await until(S(31)); await play(new M.LaggedStart([new M.Indicate(marks[0], { color: C.amber }), new M.Indicate(marks[2], { color: C.violet })], { lagRatio: 0.5, runTime: 1.4 }),
    ...fbox(['number · 2 groups', 'independent', ['→ t-test', C.amber], ['compares 2 averages', C.muted]], C.amber), ...say('KEY: t-TEST', C.amber));
  await until(S(32)); await play(...say('"t" = THE NAME OF ITS SCORE', C.muted));
  await until(S(33)); await play(new M.LaggedStart([new M.Indicate(bars[0], { color: C.amber }), new M.Indicate(bars[2], { color: C.violet })], { lagRatio: 0.5, runTime: 1.4 }),
    ...fbox(['number · 2 groups', 'independent', ['→ Welch’s t-test', C.amber], ['no need for similar spreads', C.muted]], C.amber), ...say('WELCH’S VERSION', C.amber));

  // 34-38 change 2: the same morning cookies, hot then cool
  const xs = [-1.6, 0, 1.6].map(d => CX + d), LET = ['A', 'B', 'C'];
  const hotLab = rowLabel('HOT', HOTY, C.amber), coolLab = rowLabel('COOL', COOLY, C.cyan);
  const hotH = xs.map(x => halo([x, HOTY, 0], C.amber)), hotL = xs.map((x, j) => num(`${LET[j]}: ${W[0][j]} g`, [x, HOTY + 0.4, 0], C.amber));
  const coolH = xs.map(x => halo([x, COOLY, 0], C.cyan)), coolD = xs.map(x => dot([x, COOLY, 0], C.cyan));
  const coolL = xs.map((x, j) => num(`${LET[j]}: ? g`, [x, COOLY - 0.4, 0], C.cyan));
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(labs[2], ...dots[2], ...halos[0], ...halos[2], ...vals[0], ...vals[2], marks[0], marks[2], bars[0], bars[2], spr[0], spr[2], ...ax)),
    ...dots[0].map((d, j) => new M.Transform(d, dot([xs[j], HOTY, 0], C.amber))), new M.ReplacementTransform(labs[0], hotLab), ...say('CHANGE 2: HOT, THEN COOL', C.pink));
  await play(new M.FadeIn(new M.VGroup(...hotH, ...hotL)), new M.FadeIn(coolLab),
    new M.LaggedStart(xs.map((_, j) => new M.FadeIn(new M.VGroup(coolH[j], coolD[j], coolL[j]))), { lagRatio: 0.4, runTime: 1.4 }));
  await until(S(35)); await play(new M.LaggedStart([new M.Indicate(hotLab, { color: C.amber }), new M.Indicate(coolLab, { color: C.cyan })], { lagRatio: 0.5, runTime: 1.4 }),
    ...fbox(['1  answer: a number', ['2  groups: hot, cool', C.amber], ['3  paired: ?', C.muted]]), ...say('2 CONDITIONS: HOT · COOL', C.amber));
  const pairs = xs.map(x => new M.Line({ start: [x, HOTY - 0.3, 0], end: [x, COOLY + 0.3, 0], color: C.muted, strokeWidth: 2 }));
  await until(S(36)); await play(new M.LaggedStart(pairs.map(l => new M.Create(l)), { lagRatio: 0.4, runTime: 1.4 }),
    ...fbox(['1  answer: a number', '2  groups: hot, cool', ['3  paired: yes', C.green]], C.green), ...say('SAME COOKIE IN BOTH → PAIRED', C.green));
  await until(S(37)); await play(...fbox(['number · 2 conditions', 'paired', ['→ paired t-test', C.amber]], C.amber), ...say('KEY: PAIRED t-TEST', C.amber));
  await until(S(38)); await play(new M.LaggedStart(pairs.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.4, runTime: 1.8 }),
    ...fbox(['for each cookie A, B, C:', ['change = hot − cool', C.amber]], C.amber), ...say('EACH COOKIE’S OWN CHANGE', C.amber));

  // 39-43 change 3: cracked, yes or no
  const CY0 = P ? 1.4 : 0.1;
  const whole = cookie([MX - 1.4, CY0, 0], 0.55), cracked = cookie([MX + 1.4, CY0, 0], 0.55);
  const zig = [[-0.3, 0.3], [-0.05, 0.08], [-0.18, -0.08], [0.12, -0.32]].map(([dx, dy]) => [MX + 1.4 + dx, CY0 + dy, 0]);
  const crack = zig.slice(1).map((p, i) => new M.Line({ start: zig[i], end: p, color: C.pink, strokeWidth: 3 }));
  const wholeT = num('whole: no', [MX - 1.4, CY0 - 0.85, 0], C.cyan, 17), crackT = num('cracked: yes', [MX + 1.4, CY0 - 0.85, 0], C.pink, 17);
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(hotLab, coolLab, ...dots[0], ...hotH, ...hotL, ...coolH, ...coolD, ...coolL, ...pairs)), ...boxOut(),
    new M.LaggedStart([new M.FadeIn(new M.VGroup(whole, wholeT)), new M.FadeIn(new M.VGroup(cracked, ...crack, crackT))], { lagRatio: 0.5, runTime: 1.4 }), ...say('CHANGE 3: CRACKED? YES / NO', C.pink));
  const GX = [-1, 0, 1].map(d => MX + d * 2.6), GY = P ? 0.9 : -0.2, sp = P ? 0.19 : 0.16;
  const grids = GX.map((x, k) => new M.VGroup(...Array.from({ length: 100 }, (_, i) => dot([x + (i % 10 - 4.5) * sp, GY + (Math.floor(i / 10) - 4.5) * sp, 0], COL[k], sp * 0.3))));
  const gName = GX.map((x, k) => fit(T(NAMES[k], LS, COL[k], false, true), 2.3).moveTo([x, GY + 5 * sp + 0.35, 0]));
  const gNum = GX.map((x, k) => num('100', [x, GY - 5 * sp - 0.35, 0], COL[k], 18));
  await until(S(40)); await play(new M.FadeOut(new M.VGroup(whole, wholeT, cracked, ...crack, crackT)),
    new M.LaggedStart(grids.map((g, k) => new M.FadeIn(new M.VGroup(g, gName[k], gNum[k]))), { lagRatio: 0.4, runTime: 2.0 }), ...say('100 COOKIES PER SHIFT', C.cyan));
  const TX = P ? [-2.55, -0.45, 1.25, 2.95] : [-4.6, -2.5, -0.8, 0.9], TY = P ? [2.6, 1.8, 1.0, 0.2] : [1.05, 0.3, -0.45, -1.2];
  const head = ['cracked', 'whole', 'total'].map((s, i) => num(s, [TX[i + 1], TY[0], 0], [C.pink, C.cyan, C.muted][i], 17));
  const rule = new M.Line({ start: [TX[0] - 0.9, TY[0] - 0.38, 0], end: [TX[3] + 0.55, TY[0] - 0.38, 0], color: C.muted, strokeWidth: 1.5 });
  const rowN = NAMES.map((s, k) => fit(T(s, LS, COL[k], false, true), 1.6).moveTo([TX[0], TY[k + 1], 0]));
  const crackC = NAMES.map((_, k) => num('?', [TX[1], TY[k + 1], 0], C.pink, 19));
  const otherC = NAMES.flatMap((_, k) => [num('?', [TX[2], TY[k + 1], 0], C.cyan, 19), num('100', [TX[3], TY[k + 1], 0], C.muted, 19)]);
  await until(S(41)); await play(new M.FadeOut(new M.VGroup(...grids, ...gName, ...gNum)),
    new M.FadeIn(new M.VGroup(...head, rule, ...rowN, ...crackC, ...otherC)),
    ...fbox(['1  answer: a category', '   (a label: cracked / whole)', '2  groups: 3 shifts', '3  paired: no']), ...say('A LABEL → COUNT PER SHIFT', C.cyan));
  await until(S(42)); await play(...fbox(['category · 3 groups', 'independent', ['→ chi-square test', C.amber]], C.amber), ...say('KEY: CHI-SQUARE ("KAI SQUARE")', C.amber));
  await until(S(43)); await play(new M.LaggedStart([head[0], ...crackC].map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('DOES CRACKING DEPEND ON SHIFT?', C.pink));

  // 44-48 the map
  const Q = ['a category?', 'a number · 3+ separate groups?', 'a number · 2 separate groups?', 'a number · same cookie twice?'];
  const K = ['CHI-SQUARE', 'ONE-WAY ANOVA', 'WELCH’S t-TEST', 'PAIRED t-TEST'], KC = [C.pink, C.green, C.amber, C.violet];
  const MY = P ? [2.9, 1.2, -0.5, -2.2] : [1.05, 0.15, -0.75, -1.65];
  const qs = Q.map((s, i) => { const t = fit(T(s, P ? 18 : 20, C.ink), P ? 7.2 : 5.8); t.moveTo(P ? [0, MY[i], 0] : [0.2 - t.getWidth() / 2, MY[i], 0]); return t; });
  const arrows = MY.map(y => new M.Arrow({ start: P ? [0, y - 0.25, 0] : [0.45, y, 0], end: P ? [0, y - 0.7, 0] : [1.55, y, 0], color: C.muted, strokeWidth: 3 }));
  const keys = K.map((s, i) => { const k = fit(pill(s, KC[i], P ? 17 : 18), P ? 7 : 4.6); k.moveTo(P ? [0, MY[i] - 0.98, 0] : [1.75 + k.getWidth() / 2, MY[i], 0]); return k; });
  await until(S(44)); await play(new M.FadeOut(new M.VGroup(...head, rule, ...rowN, ...crackC, ...otherC)), ...boxOut(),
    new M.LaggedStart(qs.map(q => new M.FadeIn(q)), { lagRatio: 0.3, runTime: 1.6 }), ...say('A SMALL MAP · TODAY’S CASES ONLY', C.violet));
  for (let i = 0; i < 4; i++) {
    await until(S(45 + i));
    await play(new M.Indicate(qs[i], { color: KC[i] }), new M.Create(arrows[i]), new M.FadeIn(keys[i]));
  }

  // 49-54 the trap: pairs treated as strangers
  const ax2 = axis(15, 45, 5, 5);
  const tHot = rowLabel('HOT', HOTY, C.amber), tCool = rowLabel('COOL', COOLY, C.cyan);
  await until(S(49)); await play(new M.FadeOut(new M.VGroup(...qs, ...arrows, ...keys)), new M.FadeIn(new M.VGroup(...ax2, tHot, tCool)), ...say('TRAP: PAIRS TREATED AS STRANGERS', C.pink));
  const tp = [[40, 39, C.violet], [20, 19, C.green]].map(([a, b, c]) => {
    const ph = [g2x(a), HOTY, 0], pc = [g2x(b), COOLY, 0];
    const v = [pc[0] - ph[0], pc[1] - ph[1]], n = Math.hypot(v[0], v[1]), u = [v[0] / n * 0.3, v[1] / n * 0.3];
    return { ph, pc, hh: halo(ph, c), hd: dot(ph, c), ch: halo(pc, c), cd: dot(pc, c),
      ht: num(String(a), [ph[0], HOTY + 0.36, 0], C.ink), ct: num(String(b), [pc[0], COOLY - 0.36, 0], C.ink),
      link: new M.Line({ start: [ph[0] + u[0], ph[1] + u[1], 0], end: [pc[0] - u[0], pc[1] - u[1], 0], color: c, strokeWidth: 2.5 }) };
  });
  const showPair = p => new M.LaggedStart([new M.FadeIn(p.hh), new M.FadeIn(p.hd), new M.FadeIn(p.ht), new M.Create(p.link), new M.FadeIn(p.ch), new M.FadeIn(p.cd), new M.FadeIn(p.ct)], { lagRatio: 0.3, runTime: 2.2 });
  await until(S(50)); await play(showPair(tp[0]), ...fbox(['big cookie', ['hot 40 g → cool 39 g', C.violet]], C.violet), ...say('BIG COOKIE: 40 → 39 g', C.violet));
  await until(S(51)); await play(showPair(tp[1]), ...fbox([['big:   40 → 39 g', C.violet], ['small: 20 → 19 g', C.green]], C.green), ...say('SMALL COOKIE: 20 → 19 g', C.green));
  await until(S(52)); await play(new M.LaggedStart(tp.map(p => new M.Indicate(p.link, { color: C.green })), { lagRatio: 0.5, runTime: 1.6 }),
    ...fbox(['big:   40 − 39 = 1 g', 'small: 20 − 19 = 1 g', ['both lose 1 g', C.green]], C.green), ...say('EACH vs ITSELF: −1 g · CLEAR', C.green));
  await until(S(53)); await play(new M.FadeOut(new M.VGroup(...tp.map(p => p.link))),
    ...tp.flatMap(p => [new M.Transform(p.hd, dot(p.ph, C.amber)), new M.Transform(p.hh, halo(p.ph, C.amber)), new M.Transform(p.cd, dot(p.pc, C.cyan)), new M.Transform(p.ch, halo(p.pc, C.cyan))]),
    ...fbox([['hot:  40, 20', C.amber], ['cool: 39, 19', C.cyan]], C.pink), ...say('AS STRANGERS: NO LINKS', C.pink));
  const tb = [[20, 40, HOTY + 0.62, C.amber], [19, 39, COOLY - 0.62, C.cyan]];
  const tBars = tb.map(([a, b, y, c]) => new M.Line({ start: [g2x(a), y, 0], end: [g2x(b), y, 0], color: c, strokeWidth: 4 }));
  const tSpr = tb.map(([, b, y, c]) => num('20 g', [g2x(b) + 0.5, y, 0], c));
  await until(S(54)); await play(new M.LaggedStart(tBars.map(b => new M.Create(b)), { lagRatio: 0.4, runTime: 1.4 }), new M.FadeIn(new M.VGroup(...tSpr)),
    ...fbox(['spread: 20 g in each group', ['the loss: only 1 g', C.pink]], C.pink), ...say('WIDE SPREAD HIDES THE 1 g LOSS', C.pink));

  // 55 recap
  await until(S(55)); await play(new M.FadeOut(new M.VGroup(...ax2, tHot, tCool, ...tBars, ...tSpr, ...tp.flatMap(p => [p.hh, p.hd, p.ht, p.ch, p.cd, p.ct]))),
    ...fbox(['your question', '+ kind of answer', '+ number of groups', '+ paired or not', ['= the test', C.amber]], C.amber, P ? [0, 0.6, 0] : [CX, -0.3, 0]),
    ...say('DESIGN DETERMINES THE TEST', C.amber));
}

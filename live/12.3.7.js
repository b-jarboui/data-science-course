// 12.3.7 Random search: try different settings (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/12.3.md.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const AGE = [1, 2, 3, 4, 5, 6], PRICE = [1000, 600, 800, 700, 300, 500];
  const GRID = [[1, 0.2, '2.2'], [1, 0.8, '2.2'], [9, 0.2, '3.4'], [9, 0.8, '3.4']];
  const RAND = [[0.5, 0.7, '2.4'], [2, 0.1, '1.6'], [4, 0.9, '2.1'], [8, 0.4, '3.1']];
  const BEST = [2.4, 1.6, 1.6, 1.6];
  const CX = P ? 0 : -3.1;
  const PILL = P ? [0, 1.88, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.2, 0] : [3.6, 0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
    const maxw = P ? FW - 1.2 : 4.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0 the shop
  const BIKE = P ? [0, -0.7] : [CX, -0.4];
  const bp = (x, y) => [BIKE[0] + x, BIKE[1] + y, 0];
  const wheel = x => { const c = new M.Circle({ radius: 0.45, color: C.cyan, strokeWidth: 3 }); c.moveTo(bp(x, 0)); return c; };
  const tube = (a, b) => new M.Line({ start: bp(...a), end: bp(...b), color: C.ink, strokeWidth: 3 });
  const bike = [wheel(-0.8), wheel(0.8), tube([-0.8, 0], [-0.1, 0]), tube([-0.1, 0], [-0.35, 0.75]), tube([-0.8, 0], [-0.35, 0.75]),
    tube([-0.35, 0.75], [0.55, 0.75]), tube([-0.1, 0], [0.55, 0.75]), tube([0.55, 0.75], [0.8, 0]), tube([0.55, 0.75], [0.62, 0.95]),
    tube([0.48, 0.95], [0.78, 0.95]), tube([-0.52, 0.85], [-0.18, 0.85])];
  await until(S(0)); await play(new M.LaggedStart(bike.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }), ...say('BETTER GUESSES OF BIKE PRICES'));

  // 1 the six bikes
  const TCOL = (P ? [-2.0, 0, 2.0] : [-1.6, 0, 1.6]).map(x => CX + x);
  const TY0 = P ? 1.0 : 1.15, TDY = P ? 0.6 : 0.5, ty = r => TY0 - (r + 1) * TDY;
  const cell = (s, c, r, color = C.cyan) => { const t = T(s, P ? 19 : 20, color, true); t.moveTo([TCOL[c], ty(r), 0]); return t; };
  const heads = ['bike', 'age', 'price'].map((s, c) => { const t = T(s, P ? 17 : 18, c === 2 ? C.amber : C.muted, false, true); t.moveTo([TCOL[c], TY0, 0]); return t; });
  const rule = new M.Line({ start: [TCOL[0] - 0.6, TY0 - 0.27, 0], end: [TCOL[2] + 0.7, TY0 - 0.27, 0], color: C.line, strokeWidth: 2 });
  const tcells = AGE.map((v, r) => [cell(String(r + 1), 0, r, C.muted), cell(v + ' yr', 1, r), cell('$' + PRICE[r], 2, r, C.amber)]).flat();
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(...bike)), new M.Create(rule), new M.FadeIn(new M.VGroup(...heads)),
    new M.LaggedStart(tcells.map(t => new M.FadeIn(t)), { lagRatio: 0.05, runTime: 2.0 }), ...say('SIX BIKES: AGE AND PRICE'));

  // 2-6 two settings and their ranges
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(...heads, rule, ...tcells)),
    ...fbox(['2 settings', ['chosen BEFORE learning', C.amber]], C.amber), ...say('TWO SETTINGS WE PICK FIRST', C.amber));
  const SLX = P ? [-2.6, 2.6] : [CX - 2.4, CX + 2.4], SLY = P ? [-0.6, -2.2] : [0.3, -1.1];
  function slider(r, name, lo, hi, col, at) {
    const tr = new M.Line({ start: [SLX[0], SLY[r], 0], end: [SLX[1], SLY[r], 0], color: col, strokeWidth: 5 });
    const k = new M.Circle({ radius: 0.16, color: col, strokeWidth: 2 }); k.setFill(col, 0.9); k.moveTo([SLX[0] + at * (SLX[1] - SLX[0]), SLY[r], 0]);
    const n = T(name, P ? 18 : 19, col, true); n.moveTo([(SLX[0] + SLX[1]) / 2, SLY[r] + 0.42, 0]);
    const a = T(lo, 17, C.muted, true); a.moveTo([SLX[0], SLY[r] - 0.34, 0]);
    const b = T(hi, 17, C.muted, true); b.moveTo([SLX[1], SLY[r] - 0.34, 0]);
    return new M.VGroup(tr, k, n, a, b);
  }
  const sl1 = slider(0, 'penalty weight', '0', '10', C.amber, 0.3), sl2 = slider(1, 'smoothing', '0', '1', C.violet, 0.6);
  await until(S(3)); await play(new M.FadeIn(sl1), ...fbox(['setting 1: penalty weight', ['stops very large weights', C.amber]], C.amber), ...say('1: PENALTY WEIGHT', C.amber));
  await until(S(4)); await play(new M.FadeIn(sl2), ...fbox(['setting 2: smoothing', ['how much the curve bends', C.violet]], C.violet), ...say('2: SMOOTHING', C.violet));
  await until(S(5)); await play(...fbox(['penalty weight:', ['any number from 0 to 10', C.amber]], C.amber));
  await until(S(6)); await play(...fbox(['penalty weight: 0 to 10', ['smoothing: 0 to 1', C.violet]], C.violet));

  // 7-10 the map of choices
  const MX0 = P ? -2.8 : -5.6, MW = P ? 6.0 : 5.0, MY0 = P ? -2.6 : -2.2, MH = P ? 3.5 : 3.2;
  const mx = l => MX0 + l / 10 * MW, my = g => MY0 + g * MH, mp = (l, g) => [mx(l), my(g), 0];
  const frame = [
    new M.Line({ start: mp(0, 0), end: mp(10, 0), color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: mp(0, 0), end: mp(0, 1), color: C.muted, strokeWidth: 3 }),
    new M.Line({ start: mp(0, 1), end: mp(10, 1), color: C.line, strokeWidth: 1 }),
    new M.Line({ start: mp(10, 0), end: mp(10, 1), color: C.line, strokeWidth: 1 }),
  ];
  const gridLines = [2, 4, 6, 8].map(v => new M.Line({ start: mp(v, 0), end: mp(v, 1), color: C.line, strokeWidth: 1 }))
    .concat([0.25, 0.5, 0.75].map(v => new M.Line({ start: mp(0, v), end: mp(10, v), color: C.line, strokeWidth: 1 })));
  await until(S(7)); await play(...unbox(), new M.FadeOut(new M.VGroup(sl1, sl2)), new M.LaggedStart([...frame, ...gridLines].map(l => new M.Create(l)), { lagRatio: 0.08, runTime: 1.6 }), ...say('A MAP OF ALL CHOICES'));
  const xt = [0, 5, 10].map(v => { const t = T(String(v), 17, C.amber, true); t.moveTo([mx(v), MY0 - 0.28, 0]); return t; });
  const xTitle = T('penalty weight →', P ? 16 : 17, C.amber); xTitle.moveTo([mx(5), MY0 - 0.62, 0]);
  await until(S(8)); await play(new M.FadeIn(new M.VGroup(...xt, xTitle)), new M.Indicate(xTitle, { color: C.amber }), ...say('PENALTY: GROWS LEFT → RIGHT', C.amber));
  const yt = [0, 0.5, 1].map(v => { const t = T(String(v), 17, C.violet, true); t.moveTo([MX0 - 0.32, my(v), 0]); return t; });
  const yTitle = T('↑ smoothing', P ? 16 : 17, C.violet); yTitle.moveTo([MX0 + 0.75, my(1) + 0.3, 0]);
  await until(S(9)); await play(new M.FadeIn(new M.VGroup(...yt, yTitle)), ...say('SMOOTHING: GROWS BOTTOM → TOP', C.violet));
  const one = new M.Dot({ point: mp(5, 0.5), radius: 0.12, color: C.ink });
  const oneLab = T('(5, 0.5)', 16, C.ink, true); oneLab.moveTo([mx(5), my(0.5) + 0.32, 0]);
  await until(S(10)); await play(new M.FadeIn(one), new M.FadeIn(oneLab), new M.Flash(one, { color: C.ink }), ...fbox(['1 point = 1 pair', ['(penalty, smoothing)', C.muted]]), ...say('ONE POINT = ONE PAIR OF SETTINGS'));

  // 11-16 too many pairs, budget, trials, the score
  const many = [];
  for (let i = 0; i <= 10; i++) for (let j = 0; j <= 5; j++) {
    if (i === 5 && j === 2) continue;
    many.push(new M.Dot({ point: mp(i * 0.95 + 0.25, j * 0.18 + 0.05), radius: 0.05, color: C.muted }));
  }
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(one, oneLab)), new M.LaggedStart(many.map(d => new M.FadeIn(d)), { lagRatio: 0.02, runTime: 1.6 }),
    ...say('TOO MANY PAIRS TO TEST THEM ALL', C.pink));
  await until(S(12)); await play(new M.FadeOut(new M.VGroup(...many)), ...fbox(['time to test', ['only 4 pairs', C.amber]], C.amber), ...say('TIME FOR ONLY 4 TESTS', C.amber));
  await until(S(13)); await play(...fbox(['1 test of a pair', ['= 1 trial', C.amber]], C.amber), ...say('ONE TEST = ONE TRIAL', C.amber));
  await until(S(14)); await play(...fbox(['trials you can afford', ['= trial budget = 4', C.amber]], C.amber), ...say('TRIAL BUDGET = 4', C.amber));
  await until(S(15)); await play(...fbox(['score each pair with', 'cross-validation:', ['each fold takes a turn', C.cyan], ['as the test group', C.cyan]]), ...say('SCORE = CROSS-VALIDATION'));
  await until(S(16)); await play(...fbox(['score = mean squared error', ['smaller = better guesses', C.green]], C.green), ...say('SMALLER SCORE = BETTER', C.green));

  // 17-21 grid search: a regular pattern
  await until(S(17)); await play(...unbox(), ...say('FIRST: A REGULAR PATTERN', C.amber));
  const vLines = [1, 9].map(v => new M.DashedLine({ start: mp(v, 0), end: mp(v, 1), color: C.amber }));
  const hLines = [0.2, 0.8].map(v => new M.DashedLine({ start: mp(0, v), end: mp(10, v), color: C.violet }));
  await until(S(18)); await play(new M.Create(vLines[0]), new M.Create(vLines[1]), ...fbox([['penalty: 1 and 9', C.amber]], C.amber));
  await until(S(19)); await play(new M.Create(hLines[0]), new M.Create(hLines[1]), ...fbox([['penalty: 1 and 9', C.amber], ['smoothing: 0.2 and 0.8', C.violet]], C.violet));
  const gDots = GRID.map(([l, g]) => new M.Dot({ point: mp(l, g), radius: 0.13, color: C.amber }));
  await until(S(20)); await play(new M.LaggedStart(gDots.map(d => new M.FadeIn(d)), { lagRatio: 0.25, runTime: 1.4 }), ...say('4 CROSSINGS = 4 PAIRS', C.amber));
  await until(S(21)); await play(new M.LaggedStart(gDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }),
    ...unbox(), ...say('REGULAR PATTERN = GRID SEARCH', C.amber));

  // 22-27 grid trials, one by one
  await until(S(22)); await play(...fbox(['example scores', ['to compare the 2 methods', C.muted]]));
  const gLabs = GRID.map(([l, g, s]) => { const t = T(s, 17, C.amber, true, true); t.moveTo([mx(l) + 0.32, my(g) + 0.26, 0]); return t; });
  for (let k = 0; k < 4; k++) {
    await until(S(23 + k));
    const [l, g, s] = GRID[k];
    await play(new M.Flash(gDots[k], { color: C.amber }), new M.FadeIn(gLabs[k]),
      ...fbox([`trial ${k + 1}: (${l}, ${g})`, [`score = ${s}`, C.amber]], C.amber), ...say(`GRID TRIAL ${k + 1} OF 4`, C.amber));
  }
  await until(S(27)); await play(new M.Indicate(gLabs[0], { color: C.green }), new M.Indicate(gLabs[1], { color: C.green }),
    ...fbox(['scores: 2.2, 2.2, 3.4, 3.4', ['best = 2.2', C.green]], C.green), ...say('GRID BEST = 2.2', C.green));

  // 28-31 what the grid wasted
  await until(S(28)); await play(new M.Indicate(gLabs[0], { color: C.violet }), new M.Indicate(gLabs[1], { color: C.violet }),
    ...fbox(['smoothing 0.2 → 0.8', ['2.2 → 2.2: no change', C.violet]], C.violet), ...say('SMOOTHING: NO DIFFERENCE', C.violet));
  await until(S(29)); await play(new M.Indicate(gLabs[0], { color: C.amber }), new M.Indicate(gLabs[2], { color: C.amber }),
    ...fbox(['penalty 1 → 9', ['2.2 → 3.4: big change', C.amber]], C.amber), ...say('PENALTY: A BIG DIFFERENCE', C.amber));
  await until(S(30)); await play(new M.Indicate(vLines[0], { color: C.pink }), new M.Indicate(vLines[1], { color: C.pink }),
    ...fbox(['4 trials', ['only 2 penalty weights: 1, 9', C.pink]], C.pink), ...say('4 TRIALS, ONLY 2 PENALTY WEIGHTS', C.pink));
  await until(S(31)); await play(...unbox(), ...say('USE THE 4 TRIALS BETTER?', C.green));

  // 32-34 random search
  const dimG = GRID.map(([l, g]) => new M.Dot({ point: mp(l, g), radius: 0.07, color: C.muted }));
  const q = T('?', P ? 40 : 44, C.cyan, false, true); q.moveTo(mp(5, 0.5));
  await until(S(32)); await play(new M.FadeOut(new M.VGroup(...gDots, ...gLabs, ...vLines, ...hLines)), new M.FadeIn(new M.VGroup(...dimG)), new M.FadeIn(q),
    ...say('PICK POINTS BY CHANCE, NOT A PATTERN'));
  await until(S(33)); await play(new M.Indicate(q, { color: C.cyan }), ...say('PICK BY CHANCE = RANDOM SEARCH', C.cyan));
  await until(S(34)); await play(new M.FadeOut(q), ...fbox(['start again', ['same budget: 4 trials', C.cyan]]), ...say('SAME BUDGET: 4 TRIALS'));

  // the small graph: best score after each trial
  const GX = P ? -2.6 : 1.7, GY = P ? -5.3 : -2.75, GW = P ? 5.4 : 3.8, GH = P ? 1.15 : 1.2;
  const gx = k => GX + (k + 0.5) / 4 * GW, gy = v => GY + (v - 1.0) / 1.6 * GH;
  const gAxis = [new M.Line({ start: [GX, GY, 0], end: [GX + GW, GY, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [GX, GY, 0], end: [GX, GY + GH + 0.15, 0], color: C.muted, strokeWidth: 2 })];
  const gNums = [0, 1, 2, 3].map(k => { const t = T(String(k + 1), 15, C.muted, true); t.moveTo([gx(k), GY - 0.22, 0]); return t; });
  const gTitle = T('best score after each trial', 15, C.green); gTitle.moveTo([GX + GW / 2, GY + GH + 0.4, 0]);
  const bDots = [], bLabs = [], bSegs = [];
  function bestPoint(k) {
    const d = new M.Dot({ point: [gx(k), gy(BEST[k]), 0], radius: 0.08, color: C.green });
    const t = T(BEST[k].toFixed(1), 15, C.green, true); t.moveTo([gx(k), gy(BEST[k]) + 0.25, 0]);
    bDots.push(d); bLabs.push(t);
    const a = [new M.FadeIn(d), new M.FadeIn(t)];
    if (k) { const s = new M.Line({ start: [gx(k - 1), gy(BEST[k - 1]), 0], end: [gx(k), gy(BEST[k]), 0], color: C.green, strokeWidth: 2 }); bSegs.push(s); a.push(new M.Create(s)); }
    if (k === 0) a.push(...gAxis.map(l => new M.Create(l)), new M.FadeIn(new M.VGroup(...gNums, gTitle)));
    return a;
  }

  // 35-42 random trials, one by one
  const rDots = RAND.map(([l, g]) => new M.Dot({ point: mp(l, g), radius: 0.13, color: C.cyan }));
  const rLabs = RAND.map(([l, g, s]) => { const t = T(s, 17, C.cyan, true, true); t.moveTo(l < 1 ? [mx(l) + 0.1, my(g) - 0.32, 0] : l === 2 ? [mx(l) + 0.42, my(g) + 0.1, 0] : [mx(l), my(g) + 0.3, 0]); return t; });
  const lastBest = k => k ? BEST[k - 1].toFixed(1) : '-';
  for (let k = 0; k < 4; k++) {
    const [l, g, s] = RAND[k];
    await until(S(35 + 2 * k));
    await play(new M.FadeIn(rDots[k]), new M.Flash(rDots[k], { color: C.cyan }),
      ...fbox([`random trial ${k + 1}: (${l}, ${g})`, ['score = ?', C.muted], [`best so far = ${lastBest(k)}`, C.green]]), ...say(`RANDOM TRIAL ${k + 1} OF 4`));
    await until(S(36 + 2 * k));
    const better = k === 0 || BEST[k] < BEST[k - 1];
    const extra = better && k ? [new M.Indicate(rLabs[k], { color: C.green })] : [];
    await play(new M.FadeIn(rLabs[k]), ...bestPoint(k), ...extra,
      ...fbox([`random trial ${k + 1}: (${l}, ${g})`, [`score = ${s}`, C.cyan], [`best so far = ${BEST[k].toFixed(1)}`, C.green]], better ? C.green : C.cyan),
      ...say(better ? (k ? 'NEW BEST SCORE!' : 'FIRST BEST SCORE') : 'BEST STAYS AT 1.6', better ? C.green : C.muted));
  }

  // 43-44 the small graph
  await until(S(43)); await play(new M.Indicate(gTitle, { color: C.green }), ...unbox(), ...say('BEST SCORE AFTER EACH TRIAL', C.green));
  await until(S(44)); await play(new M.LaggedStart(bLabs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.3, runTime: 2.0 }),
    ...fbox(['best: 2.4 → 1.6 → 1.6 → 1.6', ['falls, then stays', C.green]], C.green));

  // 45-46 the two methods side by side
  const gDots2 = GRID.map(([l, g]) => new M.Dot({ point: mp(l, g), radius: 0.11, color: C.amber }));
  const gLabs2 = GRID.map(([l, g, s]) => { const t = T(s, 17, C.amber, true, true); t.moveTo([mx(l) + 0.32, my(g) + 0.26, 0]); return t; });
  await until(S(45)); await play(new M.FadeOut(new M.VGroup(...dimG)), new M.FadeIn(new M.VGroup(...gDots2, ...gLabs2)),
    ...fbox([['grid: 4 trials', C.amber], ['random: 4 trials', C.cyan]]), ...say('BOTH METHODS: EXACTLY 4 TRIALS'));
  const tickUp = (v, col, h) => new M.Line({ start: [mx(v), MY0, 0], end: [mx(v), MY0 + h, 0], color: col, strokeWidth: 5 });
  const gTicks = [1, 9].map(v => tickUp(v, C.amber, 0.35)), rTicks = RAND.map(([l]) => tickUp(l, C.cyan, 0.55));
  await until(S(46)); await play(new M.LaggedStart([...gTicks, ...rTicks].map(t => new M.Create(t)), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox([['grid: 2 penalty weights (1, 9)', C.amber], ['random: 4 (0.5, 2, 4, 8)', C.cyan]]), ...say('RANDOM: 4 DIFFERENT PENALTY WEIGHTS'));

  // 47-49 the decision rule
  await until(S(47)); await play(...say('THE RULE IN ONE LINE', C.green));
  await until(S(48)); await play(...fbox(['best score =', ['smallest cross-validation', C.green], ['score among all tested pairs', C.green]], C.green));
  await until(S(49)); await play(new M.Indicate(rLabs[1], { color: C.green }), new M.Flash(rDots[1], { color: C.green }),
    ...fbox([['grid best = 2.2', C.amber], ['random best = 1.6', C.cyan], ['1.6 < 2.2 → random wins', C.green]], C.green), ...say('RANDOM FINDS (2, 0.1): SCORE 1.6', C.green));

  // 50-53 when it helps, the trap, next
  await until(S(50)); await play(new M.LaggedStart(rTicks.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }),
    ...say('BEST WHEN SOME SETTINGS MATTER MORE', C.amber));
  await until(S(51)); await play(...say('BEFORE WE START: WHICH ONE? UNKNOWN', C.muted));
  await until(S(52)); await play(...fbox(['few trials', ['→ chance can miss', C.pink], ['   good settings', C.pink]], C.pink), ...say('TRAP: FEW TRIALS CAN MISS GOOD SPOTS', C.pink));
  await until(S(53)); await play(...unbox(), ...say('NEXT: PAST TRIALS PICK THE NEXT PAIR', C.violet));

  // 54 recap
  await until(S(54)); await play(...fbox(['random search:', ['try pairs picked by chance', C.cyan], ['keep the best within', C.green], ['your trial budget', C.green]], C.green), ...say('RECAP: RANDOM SEARCH', C.green));
}

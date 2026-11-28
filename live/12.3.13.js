// 12.3.13 Elastic net: half lasso, half ridge (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/12.3.md.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const AGE = [1, 2, 3, 4, 5, 6], MILE = [2, 4, 6, 8, 10, 12], STICK = [2, 4, 3, 1, 0, 5], PRICE = [1000, 600, 800, 700, 300, 500];
  const CX = P ? 0 : -3.2;
  const PILL = P ? [0, 1.88, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.2, 0] : [3.95, 0.7, 0];
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
    const maxw = P ? FW - 1.2 : 4.4;
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
  await until(S(0)); await play(new M.LaggedStart(bike.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }), ...say('PREDICT A USED BIKE\'S PRICE'));

  // 1-3 the table
  const TCOL = (P ? [-3.1, -1.75, -0.2, 1.4, 2.95] : [-2.7, -1.5, -0.1, 1.3, 2.7]).map(x => CX + x);
  const TY0 = P ? 1.0 : 1.15, TDY = P ? 0.6 : 0.5, ty = r => TY0 - (r + 1) * TDY;
  const cell = (s, c, r, color = C.cyan) => { const t = T(s, P ? 19 : 20, color, true); t.moveTo([TCOL[c], ty(r), 0]); return t; };
  const heads = ['bike', 'age', 'mileage', 'stickers', 'price'].map((s, c) => { const t = T(s, P ? 17 : 18, c === 4 ? C.amber : C.muted, false, true); t.moveTo([TCOL[c], TY0, 0]); return t; });
  const rule = new M.Line({ start: [TCOL[0] - 0.5, TY0 - 0.27, 0], end: [TCOL[4] + 0.6, TY0 - 0.27, 0], color: C.line, strokeWidth: 2 });
  const num = AGE.map((_, r) => cell(String(r + 1), 0, r, C.muted));
  const ages = AGE.map((v, r) => cell(String(v), 1, r)), miles = MILE.map((v, r) => cell(String(v), 2, r, C.violet)), sticks = STICK.map((v, r) => cell(String(v), 3, r, C.pink));
  const prices = PRICE.map((v, r) => cell('$' + v, 4, r, C.amber));
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(...bike)), new M.Create(rule), new M.FadeIn(heads[0]),
    new M.LaggedStart(num.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.0 }), ...say('SIX BIKES FROM OUR SHOP'));
  await until(S(2)); await play(new M.LaggedStart([heads[1], ...ages, heads[2], ...miles, heads[3], ...sticks, heads[4], ...prices].map(t => new M.FadeIn(t)), { lagRatio: 0.04, runTime: 2.6 }),
    ...say('AGE, MILEAGE, STICKERS, PRICE'));
  await until(S(3)); await play(new M.Indicate(heads[2], { color: C.violet }), ...fbox(['mileage = how far it travelled', ['in thousands of km', C.violet]], C.violet));

  // 4-8 age and mileage go together
  await until(S(4)); await play(new M.Indicate(heads[1], { color: C.cyan }), new M.Indicate(heads[2], { color: C.violet }), ...unbox(), ...say('AGE AND MILEAGE: LOOK TOGETHER', C.violet));
  await until(S(5)); await play(new M.Indicate(ages[0], { color: C.amber }), new M.Indicate(miles[0], { color: C.amber }), ...fbox(['1 year → 2,000 km'], C.amber));
  await until(S(6)); await play(new M.Indicate(ages[1], { color: C.amber }), new M.Indicate(miles[1], { color: C.amber }), ...fbox(['1 year → 2,000 km', '2 years → 4,000 km'], C.amber));
  await until(S(7)); await play(new M.LaggedStart([2, 3, 4, 5].map(r => new M.Indicate(miles[r], { color: C.amber })), { lagRatio: 0.25, runTime: 1.6 }),
    ...fbox(['1 year → 2,000 km', '2 years → 4,000 km', ['… 6 years → 12,000 km', C.amber]], C.amber));
  await until(S(8)); await play(...fbox(['mileage = 2 × age', ['same story: how worn', C.amber]], C.amber), ...say('BOTH TELL US ABOUT WEAR', C.amber));

  // 9-12 features, common scale, coefficients
  await until(S(9)); await play(...fbox(['feature = a piece of information', ['the model uses to predict', C.cyan]]), ...say('FEATURE'));
  await until(S(10)); await play(new M.LaggedStart(heads.slice(1, 4).map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }), ...say('3 FEATURES: AGE, MILEAGE, STICKERS', C.amber));
  await until(S(11)); await play(...fbox(['years, km, stickers', ['→ one common scale', C.cyan], ['so we compare fairly', C.muted]]), ...say('ONE COMMON SCALE'));
  await until(S(12)); await play(...fbox(['coefficient = how much', 'a feature moves', ['the predicted price', C.amber]], C.amber), ...say('COEFFICIENT', C.amber));

  // bar panels: model A and model B
  const NX = P ? -3.05 : -5.7, ZX = P ? -0.75 : -2.75, U = P ? 0.85 : 0.95, BH = P ? 0.42 : 0.3;
  const VX = ZX + 0.45, COLX = [ZX + (P ? 1.25 : 1.45), ZX + (P ? 2.2 : 2.45), ZX + (P ? 3.2 : 3.5)];
  const RY = P ? [[0.7, -0.1, -0.9], [-2.9, -3.7, -4.5]] : [[0.75, 0.33, -0.09], [-1.35, -1.77, -2.19]];
  const TOTY = m => RY[m][2] - (P ? 0.75 : 0.45);   // the penalty-total row under each model
  const FN = ['age', 'mileage', 'stickers'], FCOL = [C.cyan, C.violet, C.pink];
  const panel = m => {
    const names = FN.map((s, r) => { const t = T(s, P ? 20 : 18, FCOL[r], false, true); t.moveTo([NX, RY[m][r], 0]); return t; });
    const zero = new M.DashedLine({ start: [ZX, RY[m][0] + 0.3, 0], end: [ZX, RY[m][2] - 0.3, 0], color: C.muted });
    return { names, zero };
  };
  const bar = (m, r, v) => { const w = Math.abs(v) * U; const b = new M.Rectangle({ width: w, height: BH, color: FCOL[r], strokeWidth: 1 }); b.setFill(FCOL[r], 0.82); b.moveTo([ZX + Math.sign(v) * w / 2, RY[m][r], 0]); return b; };
  const val = (m, r, s) => { const t = T(s, P ? 21 : 18, FCOL[r], true, true); t.moveTo([VX, RY[m][r], 0]); return t; };

  // 13-14 one panel: zero in the centre
  const p0 = panel(0);
  const minus = T('← minus', 15, C.muted); minus.moveTo([ZX - 0.7, RY[0][0] + 0.48, 0]);
  const plus = T('plus →', 15, C.muted); plus.moveTo([ZX + 0.65, RY[0][0] + 0.48, 0]);
  await until(S(13)); await play(new M.FadeOut(new M.VGroup(...heads, rule, ...num, ...ages, ...miles, ...sticks, ...prices)), ...unbox(),
    new M.FadeIn(new M.VGroup(...p0.names, minus, plus)), new M.Create(p0.zero), ...say('EACH COEFFICIENT = A BAR, 0 IN THE CENTRE'));
  const demo = [bar(0, 0, -1), bar(0, 1, -1), bar(0, 2, 0.3)];
  await until(S(14)); await play(new M.LaggedStart(demo.map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 1.0 }), new M.Indicate(p0.names[2], { color: C.pink }),
    ...fbox(['stickers: little useful', ['information about price', C.pink]], C.pink), ...say('STICKERS: A WEAK FEATURE', C.pink));
  await until(S(15)); await play(new M.FadeOut(demo[2]), new M.Indicate(demo[0], { color: C.green }), new M.Indicate(demo[1], { color: C.green }),
    ...fbox(['remove weak features', ['keep useful ones', C.green]], C.green), ...say('DROP THE WEAK, KEEP THE USEFUL', C.green));

  // 16-18 two workers, one job
  const WY = P ? -1.0 : -0.6, WX = P ? [-1.6, 1.6] : [CX - 1.6, CX + 1.6];
  const worker = x => {
    const h = new M.Circle({ radius: 0.18, color: C.ink }); h.setFill(C.ink, 1); h.moveTo([x, WY + 0.45, 0]);
    const b = new M.Arc({ radius: 0.32, startAngle: 0, angle: Math.PI, color: C.ink }); b.setFill(C.ink, 1); b.moveTo([x, WY, 0]);
    return [h, b];
  };
  const wk = [worker(WX[0]), worker(WX[1])];
  const jobAt = (w, j) => [WX[w] - 0.45 + j * 0.3, WY - 0.6, 0];
  const job = (p) => { const b = new M.Square({ sideLength: 0.24, color: C.amber, strokeWidth: 1 }); b.setFill(C.amber, 0.85); b.moveTo(p); return b; };
  const jobs = [0, 1, 2, 3].map(j => job(jobAt(0, j)));
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(...p0.names, p0.zero, minus, plus, demo[0], demo[1])), ...unbox(), new M.FadeIn(new M.VGroup(...wk.flat())),
    ...say('TWO WORKERS CAN DO THE SAME JOB', C.amber));
  await until(S(17)); await play(new M.LaggedStart(jobs.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.0 }), ...say('ALL WORK TO ONE…', C.amber));
  await play(new M.Transform(jobs[2], job(jobAt(1, 0))), new M.Transform(jobs[3], job(jobAt(1, 1))), ...say('…OR SHARE IT BETWEEN BOTH', C.green));
  await until(S(18)); await play(...fbox(['the 2 workers:', ['age and mileage', C.amber]], C.amber), ...say('SAME CHOICE: AGE AND MILEAGE', C.amber));

  // 19-24 two sets of coefficients
  const pA = panel(0), pB = panel(1);
  const tA = T('model A', P ? 19 : 17, C.ink, false, true), tB = T('model B', P ? 19 : 17, C.ink, false, true);
  tA.moveTo([NX, RY[0][0] + (P ? 0.6 : 0.45), 0]); tB.moveTo([NX, RY[1][0] + (P ? 0.6 : 0.45), 0]);
  await until(S(19)); await play(new M.FadeOut(new M.VGroup(...wk.flat(), ...jobs)), ...unbox(),
    new M.FadeIn(new M.VGroup(tA, tB, ...pA.names, ...pB.names)), new M.Create(pA.zero), new M.Create(pB.zero), ...say('COMPARE TWO SETS OF COEFFICIENTS'));
  const barA = bar(0, 0, -2), barB = [bar(1, 0, -1), bar(1, 1, -1)];
  const vA = ['−2', '0', '0'].map((s, r) => val(0, r, s)), vB = ['−1', '−1', '0'].map((s, r) => val(1, r, s));
  await until(S(20)); await play(new M.FadeIn(barA), new M.LaggedStart(vA.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...fbox(['A: age −2, mileage 0,', '   stickers 0']));
  await until(S(21)); await play(new M.LaggedStart(barB.map(b => new M.FadeIn(b)), { lagRatio: 0.4, runTime: 1.0 }),
    new M.LaggedStart(vB.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...fbox(['B: age −1, mileage −1,', '   stickers 0']));
  await until(S(22)); await play(new M.Indicate(barA, { color: C.amber }), new M.Indicate(barB[0], { color: C.amber }), new M.Indicate(barB[1], { color: C.amber }),
    ...fbox(['age + mileage', ['A: −2 + 0 = −2', C.amber], ['B: −1 + (−1) = −2', C.amber]], C.amber), ...say('SAME WEAR TOTAL: −2', C.amber));
  await until(S(23)); await play(...fbox(['age, mileage: same pattern', ['→ identical predictions', C.green]], C.green), ...say('A AND B GUESS THE SAME PRICES', C.green));
  await until(S(24)); await play(new M.Indicate(vA[2], { color: C.pink }), new M.Indicate(vB[2], { color: C.pink }), ...fbox(['stickers = 0', ['→ ignored by both', C.pink]], C.pink));
  await until(S(25)); await play(...unbox(), ...say('HOW DO WE CHOOSE: A OR B?', C.amber));

  // 26-31 lasso
  const colHead = (k, s, color) => { const t = T(s, P ? 16 : 15, color, false, true); t.moveTo([COLX[k], RY[0][0] + (P ? 0.6 : 0.45), 0]); return t; };
  const tag = (m, k, s, color) => { const t = T(s, P ? 21 : 22, color, true, true); t.moveTo([COLX[k], TOTY(m), 0]); return t; };
  const totLab = [0, 1].map(m => { const t = T('penalty total →', P ? 17 : 15, C.muted); t.moveTo([ZX + 0.1, TOTY(m), 0]); return t; });
  const hL = colHead(0, 'lasso', C.amber), hR = colHead(1, 'ridge', C.pink), hE = colHead(2, 'elastic', C.green);
  await until(S(26)); await play(...fbox(['lasso: an extra cost', ['from each coefficient size', C.amber]], C.amber), ...say('REMEMBER LASSO', C.amber));
  await until(S(27)); await play(...say('EXTRA COST = PENALTY', C.amber));
  await until(S(28)); await play(new M.FadeIn(hL), new M.FadeIn(new M.VGroup(...totLab)), ...fbox(['lasso: distance from 0', ['ignore the sign: −2 → 2', C.amber]], C.amber));
  const lA = tag(0, 0, '2', C.amber), lB = tag(1, 0, '2', C.amber);
  await until(S(29)); await play(new M.FadeIn(lA), new M.Indicate(barA, { color: C.amber }), ...fbox(['A lasso:', ['2 + 0 + 0 = 2', C.amber]], C.amber));
  await until(S(30)); await play(new M.FadeIn(lB), ...fbox(['B lasso:', ['1 + 1 + 0 = 2', C.amber]], C.amber));
  await until(S(31)); await play(new M.Indicate(lA, { color: C.amber }), new M.Indicate(lB, { color: C.amber }), ...say('LASSO: SAME PENALTY → A TIE', C.amber));

  // 32-38 ridge
  await until(S(32)); await play(new M.FadeIn(hR), ...fbox(['ridge: each coefficient', ['× itself, then add', C.pink]], C.pink), ...say('NOW REMEMBER RIDGE', C.pink));
  await until(S(33)); await play(new M.Indicate(vA[0], { color: C.pink }), ...fbox(['A: (−2) × (−2) = 4'], C.pink));
  const rA = tag(0, 1, '4', C.pink), rB = tag(1, 1, '2', C.pink);
  await until(S(34)); await play(new M.FadeIn(rA), ...fbox(['A: (−2) × (−2) = 4', ['4 + 0 + 0 = 4', C.pink]], C.pink));
  await until(S(35)); await play(new M.Indicate(vB[0], { color: C.pink }), ...fbox(['B age: (−1) × (−1) = 1'], C.pink));
  await until(S(36)); await play(new M.Indicate(vB[1], { color: C.pink }), ...fbox(['B age: (−1) × (−1) = 1', 'B mileage: 1', 'B stickers: 0'], C.pink));
  await until(S(37)); await play(new M.FadeIn(rB), ...fbox(['B ridge:', ['1 + 1 + 0 = 2', C.pink]], C.pink));
  await until(S(38)); await play(new M.Indicate(rB, { color: C.green }), new M.Indicate(barB[0], { color: C.green }), new M.Indicate(barB[1], { color: C.green }),
    ...say('RIDGE: SHARING COSTS LESS (2 < 4)', C.pink));

  // 39-47 elastic net
  await until(S(39)); await play(...unbox(), ...say('COMBINE BOTH PENALTIES?', C.green));
  await until(S(40)); await play(new M.FadeIn(hE), ...say('THE COMBINATION: ELASTIC NET', C.green));
  await until(S(41)); await play(...fbox(['elastic net =', ['½ lasso + ½ ridge', C.green]], C.green));
  const eA = tag(0, 2, '3', C.green), eB = tag(1, 2, '2', C.green);
  await until(S(42)); await play(new M.Indicate(lA, { color: C.green }), ...fbox(['A: ½ × 2 = 1'], C.green));
  await until(S(43)); await play(new M.Indicate(rA, { color: C.green }), ...fbox(['A: ½ × 2 = 1', '   ½ × 4 = 2'], C.green));
  await until(S(44)); await play(new M.FadeIn(eA), ...fbox(['A: ½ × 2 = 1', '   ½ × 4 = 2', ['   1 + 2 = 3', C.green]], C.green));
  await until(S(45)); await play(new M.Indicate(lB, { color: C.green }), new M.Indicate(rB, { color: C.green }), ...fbox(['B: ½ × 2 = 1', '   ½ × 2 = 1'], C.green));
  await until(S(46)); await play(new M.FadeIn(eB), ...fbox(['B: ½ × 2 = 1', '   ½ × 2 = 1', ['   1 + 1 = 2', C.green]], C.green));
  await until(S(47)); await play(new M.Indicate(eB, { color: C.green }), new M.Flash(eB, { color: C.green }),
    ...fbox(['same errors', ['B: 2 < A: 3 → B wins', C.green]], C.green), ...say('SHARED WEAR WINS', C.green));

  // 48-51 the formula
  await until(S(48)); await play(...say('A SHORT FORMULA', C.cyan));
  await until(S(49)); await play(...fbox(['combined penalty =', 'penalty weight ×', ['(½ × lasso + ½ × ridge)', C.green]], C.green));
  await until(S(50)); await play(...fbox(['penalty weight = 1', ['lasso part: ½', C.amber], ['ridge part: ½', C.pink]], C.green));
  await until(S(51)); await play(...fbox(['learning keeps low:', 'training MSE', ['+ combined penalty', C.green]], C.green), ...say('MINIMISE: ERROR + PENALTY'));

  // 52-54 use, trap, recap
  await until(S(52)); await play(new M.Indicate(pB.names[0], { color: C.green }), new M.Indicate(pB.names[1], { color: C.green }), new M.Indicate(pB.names[2], { color: C.pink }),
    ...say('RELATED FEATURES + WEAK ONES → ELASTIC NET', C.green));
  await until(S(53)); await play(...fbox(['penalty too large', ['→ useful information lost', C.pink], ['set it by cross-validation', C.green]], C.pink), ...say('TRAP: TOO MUCH PENALTY', C.pink));
  await until(S(54)); await play(...fbox(['elastic net = lasso + ridge', ['drops weak features', C.pink], ['keeps related ones together', C.green]], C.green), ...say('RECAP: ELASTIC NET', C.green));
}

// 12.3.12 Lasso regression: the same price for every bit of weight (live lesson, script.v7.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers: chapters/12.3.md.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const AGE = [1, 2, 3, 4, 5, 6], MILE = [2, 4, 6, 8, 10, 12], STICK = [2, 4, 3, 1, 0, 5], PRICE = [1000, 600, 800, 700, 300, 500];
  // the same six bikes on one common scale: (value − mean) ÷ step (2 years, 4,000 km, 2 stickers); mileage = 2 × age gives the same list as age
  const ZAGE = ['−1.25', '−0.75', '−0.25', '+0.25', '+0.75', '+1.25'], ZSTICK = ['−0.25', '+0.75', '+0.25', '−0.75', '−1.25', '+1.25'];
  const CX = P ? 0 : -3.2;
  const PILL = P ? [0, 1.88, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.2, 0] : [4.1, -1.85, 0];
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

  // the table of six bikes
  const TCOL = (P ? [-3.1, -1.75, -0.2, 1.4, 2.95] : [-2.7, -1.5, -0.1, 1.3, 2.7]).map(x => CX + x);
  const TY0 = P ? 1.0 : 1.15, TDY = P ? 0.6 : 0.5, ty = r => TY0 - (r + 1) * TDY;
  const cell = (s, c, r, color = C.cyan) => { const t = T(s, P ? 19 : 20, color, true); t.moveTo([TCOL[c], ty(r), 0]); return t; };

  // weight bars: one block = 0.1 of weight; minus grows left of the zero line, plus grows right
  const ROWY = P ? [0.75, -0.15, -1.05] : [0.7, -0.2, -1.1];
  const NX = P ? -3.0 : -5.5, ZX = P ? 0.4 : -1.6, BU = P ? 0.14 : 0.16, VX = P ? 2.6 : -0.35, BH = P ? 0.5 : 0.46;
  const FCOL = [C.cyan, C.violet, C.pink], W0 = [-1.2, -0.8, 0.3];
  const block = (r, j, sg = -1, color = FCOL[r]) => { const b = new M.Rectangle({ width: BU * 0.8, height: BH, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo([ZX + sg * (j + 0.5) * BU, ROWY[r], 0]); return b; };
  const bars = [[], [], []], vl = [null, null, null];
  const vlab = (r, s) => { const t = T(s, 19, FCOL[r], true, true); t.moveTo([VX, ROWY[r], 0]); return t; };
  function setLab(r, s) {
    const a = []; if (vl[r]) a.push(new M.FadeOut(vl[r]));
    vl[r] = s == null ? null : vlab(r, s); if (vl[r]) a.push(new M.FadeIn(vl[r]));
    return a;
  }
  function grow(r) {
    const sg = Math.sign(W0[r]);
    bars[r] = Array.from({ length: Math.round(Math.abs(W0[r]) * 10) }, (_, j) => block(r, j, sg));
    return new M.LaggedStart(bars[r].map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 });
  }
  const drop = (r, n) => bars[r].splice(bars[r].length - n, n);

  // the fee knob
  const KY = P ? -2.15 : -2.2, KX0 = P ? -1.9 : -4.3, KW = P ? 5.2 : 3.9, kx = v => KX0 + v / 2 * KW;
  const knobDot = v => new M.Dot({ point: [kx(v), KY, 0], radius: 0.13, color: C.amber });

  // the small curve: total size (amber, with numbers) and training error (pink) after each step
  const GX = P ? -2.8 : 2.0, GY = P ? -5.05 : -0.3, GW = P ? 5.6 : 4.2, GH = P ? 1.45 : 1.6;
  // knob 0, ½, 1: total size 2.3, 1.7, 1.3 and training error 1.9, 2.1, 2.3 (chapters/12.3.md)
  const SIZE = [2.3, 1.7, 1.3], ERR = [1.9, 2.1, 2.3];
  const gx = k => GX + [0.2, 0.5, 0.8][k] * GW, gs = v => GY + (v - 1.0) / 1.5 * GH, ge = k => gs(ERR[k]);
  const sDots = [], eDots = [], sLabs = [], segs = [];
  function point(k) {
    const sd = new M.Dot({ point: [gx(k), gs(SIZE[k]), 0], radius: 0.08, color: C.amber });
    const ed = new M.Dot({ point: [gx(k), ge(k), 0], radius: 0.07, color: C.pink });
    const lab = T(SIZE[k].toFixed(1), P ? 17 : 16, C.amber, true); lab.moveTo([gx(k) - 0.36, gs(SIZE[k]), 0]);
    const elab = T(ERR[k].toFixed(1), P ? 17 : 16, C.pink, true); elab.moveTo([gx(k) + 0.36, ge(k), 0]);
    sDots.push(sd); eDots.push(ed); sLabs.push(lab, elab);
    const a = [new M.FadeIn(sd), new M.FadeIn(ed), new M.FadeIn(lab), new M.FadeIn(elab)];
    if (k) {
      const l1 = new M.Line({ start: [gx(k - 1), gs(SIZE[k - 1]), 0], end: [gx(k), gs(SIZE[k]), 0], color: C.amber, strokeWidth: 2 });
      const l2 = new M.Line({ start: [gx(k - 1), ge(k - 1), 0], end: [gx(k), ge(k), 0], color: C.pink, strokeWidth: 2 });
      segs.push(l1, l2); a.push(new M.Create(l1), new M.Create(l2));
    }
    return a;
  }

  // 0 the shop
  const BIKE = P ? [0, -0.7] : [CX, -0.4];
  const bp = (x, y) => [BIKE[0] + x, BIKE[1] + y, 0];
  const wheel = x => { const c = new M.Circle({ radius: 0.45, color: C.cyan, strokeWidth: 3 }); c.moveTo(bp(x, 0)); return c; };
  const tube = (a, b) => new M.Line({ start: bp(...a), end: bp(...b), color: C.ink, strokeWidth: 3 });
  const bike = [wheel(-0.8), wheel(0.8), tube([-0.8, 0], [-0.1, 0]), tube([-0.1, 0], [-0.35, 0.75]), tube([-0.8, 0], [-0.35, 0.75]),
    tube([-0.35, 0.75], [0.55, 0.75]), tube([-0.1, 0], [0.55, 0.75]), tube([0.55, 0.75], [0.8, 0]), tube([0.55, 0.75], [0.62, 0.95]),
    tube([0.48, 0.95], [0.78, 0.95]), tube([-0.52, 0.85], [-0.18, 0.85])];
  await until(S(0)); await play(new M.LaggedStart(bike.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }), ...say('YOUR USED-BIKE SHOP'));

  // 1-2 the rule and its three inputs
  const heads = ['bike', 'age', 'mileage', 'stickers', 'price'].map((s, c) => { const t = T(s, P ? 17 : 18, c === 4 ? C.amber : C.muted, false, true); t.moveTo([TCOL[c], TY0, 0]); return t; });
  const rule = new M.Line({ start: [TCOL[0] - 0.5, TY0 - 0.27, 0], end: [TCOL[4] + 0.6, TY0 - 0.27, 0], color: C.line, strokeWidth: 2 });
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(...bike)), new M.Create(rule),
    new M.LaggedStart(heads.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.4 }), ...say('AGE, MILEAGE, STICKERS → PRICE'));
  await until(S(2)); await play(new M.Indicate(heads[2], { color: C.cyan }), ...say('MILEAGE = THOUSANDS OF KM RIDDEN'));

  // 3-4 six sold bikes, then their prices
  const num = AGE.map((_, r) => cell(String(r + 1), 0, r, C.muted));
  const ages = AGE.map((v, r) => cell(String(v), 1, r)), miles = MILE.map((v, r) => cell(String(v), 2, r)), sticks = STICK.map((v, r) => cell(String(v), 3, r));
  const prices = PRICE.map((v, r) => cell('$' + v, 4, r, C.amber));
  await until(S(3)); await play(new M.LaggedStart(AGE.map((_, r) => [num[r], ages[r], miles[r], sticks[r]]).flat().map(t => new M.FadeIn(t)), { lagRatio: 0.06, runTime: 2.2 }),
    ...say('SIX BIKES YOU ALREADY SOLD'));
  await until(S(4)); await play(new M.LaggedStart(prices.map(t => new M.FadeIn(t)), { lagRatio: 0.6, runTime: Math.max(3, E(4) - S(4) - 0.5) }), ...say('WHAT EACH ONE SOLD FOR', C.amber));

  // 5-7 twins, noise, features
  await until(S(5)); await play(new M.LaggedStart([...ages, ...miles].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.1, runTime: 2.0 }),
    ...fbox(['mileage = 2 × age', ['2 = 2×1  4 = 2×2 … 12 = 2×6', C.muted], ['same story: how worn', C.amber]], C.amber), ...say('MILEAGE = 2 × AGE', C.amber));
  await until(S(6)); await play(new M.LaggedStart(sticks.map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.15, runTime: 1.6 }),
    ...unbox(), ...say('STICKERS: NO LINK TO PRICE = NOISE', C.pink));
  await until(S(7)); await play(new M.LaggedStart(heads.slice(1, 4).map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('3 FEATURES: WHICH REALLY MATTER?', C.amber));

  // 8 weights
  await until(S(8)); await play(...fbox(['each feature gets a weight:', 'how much it moves the price', ['+ raises it', C.green], ['− lowers it', C.pink]]), ...say('EACH FEATURE GETS A WEIGHT'));

  // 9-11 one common scale: age and mileage become the same list
  const zAges = ZAGE.map((s, r) => cell(s, 1, r)), zMiles = ZAGE.map((s, r) => cell(s, 2, r)), zSticks = ZSTICK.map((s, r) => cell(s, 3, r, C.pink));
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(...ages, ...miles, ...sticks)),
    new M.LaggedStart([...zAges, ...zMiles, ...zSticks].map(t => new M.FadeIn(t)), { lagRatio: 0.05, runTime: 1.8 }),
    ...fbox(['$, €, £  → one currency', ['years, km, stickers → one scale', C.cyan]]), ...say('ONE COMMON SCALE'));
  await until(S(10)); await play(new M.LaggedStart([...zAges, ...zMiles].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.08, runTime: 1.8 }),
    ...say('AGE AND MILEAGE: SAME NUMBERS', C.amber));
  await until(S(11)); await play(...fbox(['all on age', 'all on mileage', 'or half on each', ['→ same guesses', C.green]], C.violet), ...say('SPLIT THE WEAR ANY WAY', C.violet));

  // 12-14 the starting weights as bars of blocks
  const names = ['age', 'mileage', 'stickers'].map((s, r) => { const t = T(s, P ? 19 : 20, FCOL[r], false, true); t.moveTo([NX, ROWY[r], 0]); return t; });
  const zero = new M.DashedLine({ start: [ZX, ROWY[0] + 0.38, 0], end: [ZX, ROWY[2] - 0.38, 0], color: C.muted });
  const lowers = T('← minus lowers', 15, C.muted); lowers.moveTo([ZX - 1.15, ROWY[0] + 0.55, 0]);
  const raises = T('plus raises →', 15, C.muted); raises.moveTo([ZX + 1.05, ROWY[0] + 0.55, 0]);
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(...heads, rule, ...num, ...zAges, ...zMiles, ...zSticks, ...prices)), ...unbox(),
    new M.LaggedStart(names.map(t => new M.FadeIn(t)), { lagRatio: 0.2 }), new M.Create(zero), new M.FadeIn(lowers), new M.FadeIn(raises),
    ...say('THE STARTING RULE'));
  await play(grow(0), ...setLab(0, '−1.2'), ...fbox(['1 block = 0.1 of weight', ['age: −1.2 = 12 blocks', C.cyan]]));
  await until(S(13)); await play(grow(1), ...setLab(1, '−0.8'), ...fbox(['1 block = 0.1 of weight', ['mileage: −0.8 = 8 blocks', C.violet]], C.violet));
  await until(S(13) + 2.6); await play(grow(2), ...setLab(2, '+0.3'), ...fbox(['1 block = 0.1 of weight', ['stickers: +0.3 = 3 blocks', C.pink]], C.pink));
  await until(S(14)); await play(new M.LaggedStart(bars.flat().map(b => new M.Indicate(b)), { lagRatio: 0.05, runTime: 1.6 }), ...unbox(), ...say('THREE BARS = THREE WEIGHTS'));
  await until(S(14) + 2.8); await play(new M.LaggedStart(bars[2].map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('STICKER BAR: STILL LISTENS TO NOISE', C.pink));

  // 15-16 ridge, last lesson
  await until(S(15)); await play(...fbox(['ridge fee on each weight:', ['weight × weight', C.violet]], C.violet), ...say('LAST LESSON: RIDGE', C.violet));
  await until(S(16)); await play(new M.LaggedStart(bars[2].map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['stickers: 0.3 × 0.3 = 0.09', ['almost free → ridge kept it', C.green]], C.violet));

  // 17-20 the new idea: lasso
  await until(S(17)); await play(new M.LaggedStart(bars.flat().map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.05, runTime: 2.0 }),
    ...fbox(['every block (0.1 of weight)', ['pays the same fee', C.amber]], C.amber), ...say('SAME PRICE FOR EVERY BIT OF WEIGHT', C.amber));
  await until(S(18)); await play(new M.LaggedStart(bars[2].map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['product barely sells', ['→ not worth its rent', C.amber], ['→ loses its shelf', C.pink]], C.amber), ...say('THINK OF SHELF RENT', C.amber));
  await until(S(19)); await play(...unbox(), ...say('THIS METHOD: LASSO', C.green));
  await until(S(20)); await play(new M.LaggedStart(vl.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['size = weight without its sign', '1.2 + 0.8 + 0.3', ['fee on that total', C.amber]], C.amber));

  // 21-23 the fee knob, training error, the small curve
  const kline = new M.Line({ start: [kx(0), KY, 0], end: [kx(2), KY, 0], color: C.muted, strokeWidth: 3 });
  const kticks = [[0, '0'], [0.5, '½'], [1, '1']].flatMap(([v, s]) => {
    const t = T(s, 17, C.muted, true); t.moveTo([kx(v), KY - 0.36, 0]);
    return [new M.Line({ start: [kx(v), KY - 0.09, 0], end: [kx(v), KY + 0.09, 0], color: C.muted, strokeWidth: 2 }), t];
  });
  let ktitle = T('fee knob', 17, C.amber, false, true); ktitle.moveTo([KX0 - 1.0, KY, 0]);
  let handle = knobDot(0);
  await until(S(21)); await play(new M.Create(kline), new M.LaggedStart(kticks.map(t => new M.FadeIn(t)), { lagRatio: 0.15 }),
    new M.FadeIn(ktitle), new M.FadeIn(handle), ...unbox(), ...say('A FEE KNOB SETS THE FEE', C.amber));
  await until(S(21) + 2.8); await play(...fbox(['keep as low as it can:', ['training error + fee', C.amber]], C.amber));
  await until(S(22)); await play(...fbox(['training error =', 'how far the guesses miss', ['the 6 real prices', C.amber]], C.pink), ...say('TRAINING ERROR', C.pink));
  const gxAxis = new M.Line({ start: [GX, GY, 0], end: [GX + GW, GY, 0], color: C.muted, strokeWidth: 2 });
  const gyAxis = new M.Line({ start: [GX, GY, 0], end: [GX, GY + GH + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const gLabs = ['knob 0', '½', '1'].map((s, k) => { const t = T(s, P ? 17 : 15, C.muted, true); t.moveTo([gx(k), GY - 0.25, 0]); return t; });
  const legS = T('total size', P ? 17 : 16, C.amber); legS.moveTo([GX + GW - 0.65, GY + GH + 0.05, 0]);
  const legE = T('training error', P ? 17 : 16, C.pink); legE.moveTo([GX + GW - 0.85, GY + GH + 0.45, 0]);
  await until(S(23)); await play(new M.Create(gxAxis), new M.Create(gyAxis), new M.LaggedStart([...gLabs, legS, legE].map(t => new M.FadeIn(t)), { lagRatio: 0.15 }),
    ...unbox(), ...say('TURN THE KNOB IN 3 STEPS', C.amber));

  // 24-25 step one: knob at 0
  await until(S(24)); await play(new M.Indicate(handle, { color: C.amber }), ...fbox(['knob = 0', ['fee = 0', C.amber]], C.amber), ...say('STEP 1: KNOB AT 0 → NO FEE', C.amber));
  await until(S(25)); await play(new M.LaggedStart(bars.flat().map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.05, runTime: 2.0 }),
    ...point(0), ...fbox(['total size', '= 1.2 + 0.8 + 0.3', ['= 2.3', C.amber]], C.amber));

  // 26-28 step two: knob at ½, the sticker weight drops to exactly 0
  await until(S(26)); await play(new M.Transform(handle, knobDot(0.5)), ...fbox(['knob = ½', ['fee = ½ × total size', C.amber]], C.amber), ...say('STEP 2: KNOB AT ½', C.amber));
  await until(S(27)); await play(new M.LaggedStart(bars[2].map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['keep the sticker weight?', 'fee: ½ × 0.3 = 0.15', ['more than the error it saves', C.pink]], C.pink));
  await until(S(28)); {
    const gone = drop(2, 3);
    await play(new M.FadeOut(new M.VGroup(...gone)), ...setLab(2, '0'), new M.Flash(vl[2], { color: C.pink }), ...say('STICKER WEIGHT = EXACTLY 0', C.pink));
  }

  // 29-30 the wear pair shrinks together
  await until(S(29)); await play(new M.LaggedStart([...bars[0], ...bars[1]].map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.05, runTime: 1.8 }),
    ...fbox(['wear = age + mileage', '1.2 + 0.8 = 2', ['only the total counts', C.amber]], C.amber), ...say('AGE AND MILEAGE SHARE ONE JOB', C.violet));
  await until(S(30)); {
    const gone = drop(1, 3);
    await play(new M.FadeOut(new M.VGroup(...gone)), ...setLab(1, '−0.5'),
      ...fbox(['wear: 2 → about 1.7', '1.2 + 0.5 = 1.7', ['any split costs the same', C.muted]], C.amber));
  }
  await until(S(30) + 2.8); await play(...point(1));

  // 31-33 step three: knob at 1, lasso keeps only age
  await until(S(31)); await play(new M.Transform(handle, knobDot(1)), ...fbox(['knob = 1', ['wear: 1.7 → about 1.3', C.amber]], C.amber), ...say('STEP 3: KNOB AT 1', C.amber));
  await until(S(31) + 2.6); {
    const gone = drop(1, 4);
    await play(new M.FadeOut(new M.VGroup(...gone)), ...setLab(1, '−0.1'), ...point(2));
  }
  await until(S(32)); await play(...fbox(['split 1.2 + 0.1 → size 1.3', 'all on one 1.3 + 0 → size 1.3', ['same fee: no reason for both', C.amber]], C.amber));
  await until(S(33)); {
    const moving = bars[1].splice(0);
    const n0 = bars[0].length;
    const moves = moving.map((b, i) => new M.Transform(b, block(0, n0 + i, -1), { pathArc: -0.9 }));
    bars[0].push(...moving);
    await play(new M.LaggedStart(moves, { lagRatio: 0.4, runTime: 1.4 }), ...setLab(0, '−1.3'), ...setLab(1, '0'), ...unbox(), ...say('AGE = −1.3, MILEAGE = EXACTLY 0', C.cyan));
  }

  // 34-36 a tie; the curve; sparse
  await until(S(34)); await play(new M.Indicate(names[1], { color: C.violet }), new M.Indicate(names[0], { color: C.violet }), ...say('A PERFECT TIE: MILEAGE COULD HAVE WON', C.violet));
  await until(S(35)); await play(new M.LaggedStart([...sDots, ...sLabs].map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.15, runTime: 1.8 }),
    new M.LaggedStart(eDots.map(d => new M.Indicate(d, { color: C.pink })), { lagRatio: 0.3, runTime: 1.8 }), ...say('SIZE 2.3 → 1.3 · ERROR 1.9 → 2.3', C.amber));
  await until(S(36)); await play(new M.Indicate(vl[1], { color: C.green }), new M.Indicate(vl[2], { color: C.green }), ...say('0 = LEFT OUT · MANY ZEROS = SPARSE', C.green));

  // 37-38 the short version
  await until(S(37)); {
    const old = ktitle;
    ktitle = T('λ', 26, C.amber, false, true); ktitle.moveTo([KX0 - 1.0, KY, 0]);
    await play(new M.FadeOut(old), new M.FadeIn(ktitle), ...say('THE FEE KNOB IS CALLED λ (LAMBDA)', C.amber));
  }
  await until(S(38)); await play(...fbox(['lasso score', '= training error', ['+ λ × (sum of weight sizes)', C.amber]], C.amber));

  // 39-40 when to use it, how to set λ
  await until(S(39)); await play(...say('MANY FEATURES, FEW MATTER → LASSO', C.green));
  const cvx = k => GX + (k + 0.5) / 6 * GW, cvy = GY + GH * 0.45;
  const cvDots = AGE.map((_, k) => new M.Dot({ point: [cvx(k), cvy, 0], radius: 0.12, color: C.cyan }));
  const cvNums = AGE.map((_, k) => { const t = T(String(k + 1), 15, C.muted, true); t.moveTo([cvx(k), cvy - 0.35, 0]); return t; });
  const hid = T('hidden', 15, C.pink); hid.moveTo([(cvx(0) + cvx(1)) / 2, cvy + 0.42, 0]);
  const learn = T('learn on these', 15, C.cyan); learn.moveTo([(cvx(2) + cvx(5)) / 2, cvy + 0.42, 0]);
  await until(S(40)); await play(new M.FadeOut(new M.VGroup(gxAxis, gyAxis, ...gLabs, legS, legE, ...sDots, ...eDots, ...sLabs, ...segs)),
    new M.LaggedStart([...cvDots, ...cvNums].map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.2 }),
    ...fbox(['hide some bikes, learn on the rest', ['keep the λ that misses', C.green], ['the hidden bikes least', C.green]], C.green), ...say('SET λ WITH CROSS-VALIDATION', C.green));
  await until(S(40) + 2.6);
  cvDots.slice(0, 2).forEach(d => { d.setColor(C.pink); d.setFill(C.pink, 0.3); });
  await play(new M.FadeIn(hid), new M.FadeIn(learn), new M.Indicate(cvDots[0], { color: C.pink }), new M.Indicate(cvDots[1], { color: C.pink }));

  // 41-42 the trap
  await until(S(41)); await play(new M.Indicate(names[0], { color: C.pink }), new M.Indicate(names[1], { color: C.pink }), ...say('TRAP: LOOK-ALIKES → ONE KEPT BY CHANCE', C.pink));
  await until(S(42)); await play(new M.Indicate(vl[1], { color: C.pink }), ...say('A ZERO WEIGHT ≠ A USELESS FEATURE', C.pink));

  // 43 knob too far: every weight 0, every bike gets the average
  await until(S(43)); await play(new M.Transform(handle, knobDot(2)), new M.FadeOut(new M.VGroup(...bars[0], ...cvDots, ...cvNums, hid, learn)), ...setLab(0, '0'),
    ...fbox(['every weight = 0', ['every guess = the average', C.amber], ['$3900 ÷ 6 = $650', C.amber]], C.amber), ...say('KNOB TOO FAR: EVERY WEIGHT = 0', C.pink));
  bars[0] = [];

  // 44-45 next, recap
  await until(S(44)); await play(...say('NEXT: MIX LASSO AND RIDGE', C.violet));
  bars[0] = Array.from({ length: 13 }, (_, j) => block(0, j, -1));
  await until(S(45)); await play(new M.Transform(handle, knobDot(1)), new M.LaggedStart(bars[0].map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 1.0 }), ...setLab(0, '−1.3'),
    ...fbox(['same price for every bit of weight', ['weak features → exactly 0', C.pink], ['→ a sparse rule', C.green]], C.green), ...say('RECAP: LASSO', C.green));
}

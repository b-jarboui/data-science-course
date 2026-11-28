// 12.3.11 Ridge regression: share the blame, shrink the weights (live lesson, script.v7.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.5, 0] : [4.3, -0.9, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const FC = [C.cyan, C.violet, C.amber];                      // age, mileage, stickers
  const sgn = w => (w > 0 ? '+' : w < 0 ? '−' : '') + Math.abs(w);
  const at = (o, x, y) => { o.moveTo([x, y, 0]); return o; };
  const fadeAll = objs => new M.FadeOut(new M.VGroup(...objs));
  const frame = (x0, x1, y0, y1, color) => { const b = new M.Rectangle({ width: x1 - x0, height: y1 - y0, color, strokeWidth: 2 }); b.moveTo([(x0 + x1) / 2, (y0 + y1) / 2, 0]); return b; };

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
  const boxOff = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0-2 three facts feed the price rule
  const CW = P ? 2.2 : 2.4, CSP = P ? 2.55 : 3.0, CY = P ? 0.9 : 0.75, RY = -1.0, OY = -2.4;
  const card = (s, color, x, y, w = CW) => {
    const r = new M.RoundedRectangle({ width: w, height: 0.75, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([x, y, 0]);
    return new M.VGroup(r, at(T(s, 20, color, false, true), x, y));
  };
  const feats = ['age', 'mileage', 'stickers'].map((s, k) => card(s, FC[k], CX + (k - 1) * CSP, CY));
  const rule = card('price rule', C.green, CX, RY, 3.0);
  const ins = [0, 1, 2].map(k => new M.Arrow({ start: [CX + (k - 1) * CSP, CY - 0.42, 0], end: [CX + (k - 1) * 0.6, RY + 0.42, 0], color: C.muted, strokeWidth: 2 }));
  const out = new M.Arrow({ start: [CX, RY - 0.42, 0], end: [CX, OY + 0.3, 0], color: C.muted, strokeWidth: 2 });
  const outT = at(T('guessed price', 18, C.ink), CX, OY);
  await until(S(0));
  await play(new M.LaggedStart(feats.map(f => new M.FadeIn(f)), { lagRatio: 0.2, runTime: 1.4 }), new M.FadeIn(rule),
    new M.LaggedStart(ins.map(a => new M.Create(a)), { lagRatio: 0.2, runTime: 1.4 }), new M.FadeIn(out), new M.FadeIn(outT), ...say('3 FACTS → ONE PRICE RULE'));
  await until(S(1)); await play(new M.Indicate(feats[1], { color: C.violet }), ...say('MILEAGE = HOW FAR IT WAS RIDDEN', C.violet));
  await until(S(2)); await play(new M.LaggedStart(feats.map(f => new M.Indicate(f, { color: C.green })), { lagRatio: 0.2, runTime: 1.2 }), ...say('EACH FACT = A FEATURE', C.green));

  // 3-7 the six training bikes
  const BIKES = [[1, 1, 2, 2, 10], [2, 2, 4, 4, 6], [3, 3, 6, 3, 8], [4, 4, 8, 1, 7], [5, 5, 10, 0, 3], [6, 6, 12, 5, 5]];
  const TCOL = [C.muted, C.cyan, C.violet, C.amber, C.ink];
  const TSP = P ? 1.55 : 1.45, H0 = P ? 1.4 : 1.25, RP = P ? 0.6 : 0.46, R0 = H0 - 0.82;
  const tx = c => CX + (c - 2) * TSP, ty = r => R0 - r * RP;
  const head = ['bike', 'age', 'mileage', 'stickers', 'price'].map((s, c) => at(T(s, P ? 17 : 18, TCOL[c], false, true), tx(c), H0));
  const units = ['#', 'years', '1,000 km', 'count', '$100s'].map((s, c) => at(T(s, 14, C.muted), tx(c), H0 - 0.32));
  const hline = new M.Line({ start: [tx(0) - TSP / 2, H0 - 0.55, 0], end: [tx(4) + TSP / 2, H0 - 0.55, 0], color: C.line, strokeWidth: 2 });
  const cells = BIKES.map((row, r) => row.map((v, c) => at(T(String(v), P ? 19 : 20, TCOL[c], true), tx(c), ty(r))));
  await until(S(3));
  await play(fadeAll([...feats, rule, ...ins, out, outT]), new M.FadeIn(new M.VGroup(...head, ...units, hline)),
    new M.LaggedStart(cells.flat().map(t => new M.FadeIn(t)), { lagRatio: 0.03, runTime: 1.8 }), ...say('6 TRAINING BIKES · PRICES IN $100s'));
  const stickBox = frame(tx(3) - 0.6, tx(3) + 0.6, ty(5) - RP / 2, H0 + 0.25, C.amber);
  await until(S(4)); await play(new M.Create(stickBox), ...say('STICKERS: NO REAL EFFECT ON PRICE', C.amber));
  const row1 = frame(tx(1) - 0.6, tx(2) + 0.6, ty(0) - RP / 2, ty(0) + RP / 2, C.cyan);
  const row6 = frame(tx(1) - 0.6, tx(2) + 0.6, ty(5) - RP / 2, ty(5) + RP / 2, C.cyan);
  await until(S(5)); await play(new M.FadeOut(stickBox), new M.Create(row1), ...say('BIKE 1: 1 YEAR, 2,000 KM'));
  await until(S(6)); await play(new M.Create(row6), ...say('BIKE 6: 6 YEARS, 12,000 KM'));
  await until(S(6) + 3.0);
  await play(new M.LaggedStart(cells.map(r => new M.Indicate(r[2], { color: C.violet })), { lagRatio: 0.15, runTime: 1.6 }), ...say('MILEAGE = 2 × AGE, ALWAYS', C.violet));
  await until(S(7)); await play(fadeAll([row1, row6]), ...say('LOSES VALUE: AGE, OR RIDING?', C.amber));

  // 8-9 each feature gets a weight
  const PCX = P ? 0 : -1.6, PSP = P ? 2.2 : 1.6, WZ = P ? 0 : -0.2, WU = P ? 0.75 : 0.55, BWW = P ? 0.6 : 0.5, NY = P ? -2.95 : -2.55;
  const px = k => PCX + (k - 1) * PSP;
  const zline = () => new M.Line({ start: [px(0) - PSP / 2, WZ, 0], end: [px(2) + PSP / 2, WZ, 0], color: C.muted, strokeWidth: 2 });
  const names = (b = false) => ['age', 'mileage', 'stickers'].map((s, k) => at(T((b ? `β${k + 1} ` : '') + s, 17, FC[k], false, true), px(k), NY));
  let bars = [null, null, null], labs = [null, null, null];
  const wbar = (k, w) => { const b = new M.Rectangle({ width: BWW, height: Math.max(Math.abs(w) * WU, 0.03), color: FC[k], strokeWidth: 2 }); b.setFill(FC[k], 0.8); b.moveTo([px(k), WZ + w * WU / 2, 0]); return b; };
  const wlab = (k, w) => at(T(sgn(w), 18, FC[k], true), px(k), WZ + w * WU + (w < 0 ? -0.28 : 0.28));
  function setW(k, w) {
    const b = wbar(k, w), t = wlab(k, w), a = [new M.FadeIn(t)];
    if (bars[k]) a.push(new M.Transform(bars[k], b), new M.FadeOut(labs[k])); else { bars[k] = b; a.push(new M.FadeIn(b)); }
    labs[k] = t; return a;
  }
  const setWs = ws => ws.flatMap((w, k) => w == null ? [] : setW(k, w));
  const z1 = zline(), nm1 = names();
  const qs = [0, 1, 2].map(k => at(T('?', 24, FC[k], true), px(k), WZ + 0.4));
  await until(S(8));
  await play(fadeAll([...head, ...units, hline, ...cells.flat()]), new M.FadeIn(z1), new M.FadeIn(new M.VGroup(...nm1)),
    new M.LaggedStart(qs.map(q => new M.FadeIn(q)), { lagRatio: 0.2, runTime: 1.2 }), ...say('EACH FEATURE GETS A WEIGHT', C.green));
  const AX = P ? [-1.8, 1.8] : [2.6, 5.2], AY = P ? [-4.75, -3.55] : [-0.8, 0.5], ALY = P ? -5.15 : -1.25;
  const up = new M.Arrow({ start: [AX[0], AY[0], 0], end: [AX[0], AY[1], 0], color: C.green, strokeWidth: 4 });
  const down = new M.Arrow({ start: [AX[1], AY[1], 0], end: [AX[1], AY[0], 0], color: C.pink, strokeWidth: 4 });
  const upT = at(T('+ weight: price up', P ? 15 : 17, C.green), AX[0], ALY);
  const downT = at(T('− weight: price down', P ? 15 : 17, C.pink), AX[1], ALY);
  await until(S(9)); await play(new M.Create(up), new M.FadeIn(upT), ...say('+ PUSHES THE GUESS UP', C.green));
  await until(S(9) + 2.2); await play(new M.Create(down), new M.FadeIn(downT), ...say('− PULLS THE GUESS DOWN', C.pink));

  // 10-13 age bars and mileage bars, then one shared unit
  const BSP = P ? 1.25 : 1.3, BB = P ? -4.3 : -2.4, BU = P ? 0.38 : 0.28, BBW = P ? 0.36 : 0.34;
  const bx = i => CX + (i - 2.5) * BSP;
  const vbar = (x, v, color) => { const b = new M.Rectangle({ width: BBW, height: v * BU, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo([x, BB + v * BU / 2, 0]); return b; };
  const ageB = BIKES.map((r, i) => vbar(bx(i) - 0.2, r[1], C.cyan)), kmB = BIKES.map((r, i) => vbar(bx(i) + 0.2, r[2], C.violet));
  const bnum = BIKES.map((r, i) => at(T(String(i + 1), 16, C.muted, true), bx(i), BB - 0.28));
  const floorB = new M.Line({ start: [bx(0) - BSP / 2, BB, 0], end: [bx(5) + BSP / 2, BB, 0], color: C.muted, strokeWidth: 2 });
  const LGX = P ? [-1.9, 1.9] : [-4.6, -4.6], LGY = P ? [-5.0, -5.0] : [0.5, 0.05];
  const legend = (a, b) => [at(T(a, P ? 15 : 17, C.cyan), LGX[0], LGY[0]), at(T(b, P ? 15 : 17, C.violet), LGX[1], LGY[1])];
  let leg = legend('age: years', 'mileage: 1,000 km');
  await until(S(10));
  await play(fadeAll([z1, ...nm1, ...qs, up, down, upT, downT]), new M.Create(floorB), new M.FadeIn(new M.VGroup(...bnum)),
    new M.LaggedStart(BIKES.flatMap((_, i) => [new M.FadeIn(ageB[i]), new M.FadeIn(kmB[i])]), { lagRatio: 0.1, runTime: 2.0 }),
    new M.FadeIn(new M.VGroup(...leg)), ...say('YEARS vs THOUSANDS OF KM', C.violet));
  await until(S(11)); await play(new M.LaggedStart(kmB.map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.12, runTime: 1.6 }), ...say('THE COST MUST BE FAIR TO EVERY FEATURE', C.amber));
  const leg2 = legend('age: shared unit', 'mileage: shared unit');
  await until(S(12));
  await play(...kmB.map((b, i) => new M.Transform(b, vbar(bx(i) + 0.2, BIKES[i][1], C.violet), { runTime: 1.6 })),
    new M.FadeOut(new M.VGroup(...leg)), new M.FadeIn(new M.VGroup(...leg2)), ...say('RESCALE: ONE SHARED UNIT, SAME SPREAD', C.green));
  leg = leg2;
  await until(S(13)); await play(new M.LaggedStart(BIKES.flatMap((_, i) => [new M.Indicate(ageB[i]), new M.Indicate(kmB[i])]), { lagRatio: 0.1, runTime: 2.2 }), ...say('EVERY BIKE: AGE BAR = MILEAGE BAR', C.green));

  // 14-15 training error: how far the guesses miss
  const MB = P ? -4.4 : -2.4, MU = P ? 0.45 : 0.3, MSP = 1.2;
  const mx = i => CX + (i - 2.5) * MSP, my = v => MB + v * MU;
  const axis = new M.Line({ start: [mx(0) - 0.7, MB, 0], end: [mx(5) + 0.7, MB, 0], color: C.muted, strokeWidth: 2 });
  const mnum = BIKES.map((r, i) => at(T(String(i + 1), 16, C.muted, true), mx(i), MB - 0.28));
  const priceD = BIKES.map(r => new M.Dot({ point: [mx(r[0] - 1), my(r[4]), 0], radius: 0.11, color: C.cyan }));
  const guessL = BIKES.map(r => new M.Line({ start: [mx(r[0] - 1) - 0.25, my(10 - r[1]), 0], end: [mx(r[0] - 1) + 0.25, my(10 - r[1]), 0], color: C.amber, strokeWidth: 4 }));
  const missL = BIKES.map(r => new M.Line({ start: [mx(r[0] - 1) + 0.32, my(r[4]), 0], end: [mx(r[0] - 1) + 0.32, my(10 - r[1]), 0], color: C.pink, strokeWidth: 3 }));
  const MLX = P ? [-2.6, 0, 2.4] : [4.3, 4.3, 4.3], MLY = P ? [-5.1, -5.1, -5.1] : [0.4, -0.1, -0.6];
  const mleg = [['● known price', C.cyan], ['— guess', C.amber], ['| miss', C.pink]].map(([s, c], j) => at(T(s, P ? 15 : 17, c), MLX[j], MLY[j]));
  await until(S(14));
  await play(fadeAll([floorB, ...bnum, ...ageB, ...kmB, ...leg]), new M.Create(axis), new M.FadeIn(new M.VGroup(...mnum)),
    new M.LaggedStart(priceD.map(d => new M.FadeIn(d)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.LaggedStart(guessL.map(g => new M.FadeIn(g)), { lagRatio: 0.15, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...mleg)), ...say('TRAINING ERROR = HOW FAR GUESSES MISS', C.pink));
  await play(new M.LaggedStart(missL.map(m => new M.Create(m)), { lagRatio: 0.15, runTime: 1.2 }));
  await until(S(15)); await play(new M.LaggedStart(missL.map(m => new M.Indicate(m, { color: C.pink })), { lagRatio: 0.12, runTime: 1.6 }), ...say('USUAL FIT: MISSES AS SMALL AS POSSIBLE'));

  // 16-24 one bike with two bars of height 1: many splits give the same guess
  const EX = P ? 0 : -6.0, EB = P ? -4.9 : -1.0, EU = P ? 0.7 : 0.8;
  const exBars = [0, 1].map(k => { const b = new M.Rectangle({ width: 0.36, height: EU, color: FC[k], strokeWidth: 1 }); b.setFill(FC[k], 0.82); b.moveTo([EX + (k - 0.5) * 0.5, EB + EU / 2, 0]); return b; });
  const exLab = [0, 1].map(k => at(T('1', 18, FC[k], true), EX + (k - 0.5) * 0.5, EB + EU + 0.25));
  const exT = at(T('a bike', 16, C.muted), EX, EB - 0.3);
  const exFrame = frame(EX - 0.75, EX + 0.75, EB - 0.55, EB + EU + 0.5, C.line);
  const exA = [exFrame, ...exBars, ...exLab, exT];
  const z2 = zline(), nm2 = names();
  await until(S(16));
  const qs2 = [0, 1].map(k => at(T('?', 24, FC[k], true), px(k), WZ + 0.4));
  await play(fadeAll([axis, ...mnum, ...priceD, ...guessL, ...missL, ...mleg]), new M.FadeIn(new M.VGroup(...exA)),
    new M.FadeIn(z2), new M.FadeIn(new M.VGroup(...nm2, ...qs2)), ...say('A BIKE: BOTH BARS = 1', C.green));
  await until(S(17)); await play(new M.FadeOut(new M.VGroup(...qs2)), ...setWs([-3, 1]), ...fbox(['guess change', '−3×1 + 1×1', ['= −2', C.amber]]));
  await until(S(18)); await play(...setWs([-1, -1]), ...fbox(['−1×1 + (−1)×1', ['= −2', C.amber], ['same guess', C.green]], C.green), ...say('SAME GUESS', C.green));
  await until(S(19)); await play(...setWs([-2, 0]), ...fbox(['−2 + 0 = −2']), ...say('AGE ↔ MILEAGE: GUESS STAYS −2', C.amber));
  await play(...setWs([0, -2]), ...fbox(['0 + (−2) = −2']));
  await play(...setWs([-1, -1]), ...fbox(['−1 + (−1) = −2']));
  await until(S(20)); await play(...fbox(['−3 and +1 → −2', '−2 and  0 → −2', '−1 and −1 → −2'], C.amber), ...say('MANY SPLITS FIT: NO SINGLE ANSWER', C.amber));
  await until(S(21)); await play(...setWs([-3, 1]), ...boxOff(), ...say('USUAL FIT MIGHT LAND: −3 AND +1', C.amber));
  await until(S(22)); await play(new M.Indicate(bars[1], { color: C.pink }), ...say('+1: MORE RIDING = PRICIER? NONSENSE', C.pink));
  await until(S(23)); await play(...setW(2, 0.3), ...say('STICKERS GET +0.3', C.amber));
  await until(S(24)); await play(new M.Indicate(bars[2], { color: C.muted }), ...say('JUST CHANCE: ONLY 6 BIKES', C.muted));

  // 25-27 two friends carry one heavy box
  const FX = P ? 2.0 : 1.5, FY = P ? -1.9 : -1.7, SB = P ? -0.8 : -0.6, SU = P ? 0.4 : 0.35;
  const fx = [CX - FX, CX + FX];
  const friend = x => {
    const hd = new M.Circle({ radius: 0.2, color: C.ink }); hd.setFill(C.ink, 1); hd.moveTo([x, FY + 0.5, 0]);
    const body = new M.Arc({ radius: 0.36, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, FY, 0]);
    return new M.VGroup(hd, body);
  };
  const friends = fx.map(friend);
  const boxR = new M.Rectangle({ width: P ? 2.4 : 1.6, height: 0.8, color: C.amber, strokeWidth: 2 }); boxR.setFill(C.amber, 0.25); boxR.moveTo([CX, FY + 0.25, 0]);
  const boxT = at(T('heavy box', 16, C.amber), CX, FY + 0.25);
  const sbar = (j, v, color) => { const hh = Math.max(v * SU, 0.03), b = new M.Rectangle({ width: 0.4, height: hh, color, strokeWidth: 1 }); b.setFill(color, 0.85); b.moveTo([fx[j], SB + hh / 2, 0]); return b; };
  const stext = (j, v, color) => at(T(`strain ${v}`, 15, color, true), fx[j], SB + v * SU + 0.25);
  const ltext = (j, v) => at(T(`load ${v}`, 15, C.muted, true), fx[j], FY - 0.5);
  await until(S(25));
  await play(fadeAll([...exA, z2, ...nm2, ...bars, ...labs]), new M.FadeIn(new M.VGroup(...friends, boxR, boxT)), ...say('SHARE THE BLAME, LIKE CARRYING A BOX', C.green));
  const sB = [sbar(0, 4, C.pink), sbar(1, 0, C.pink)], sT = [stext(0, 4, C.pink), stext(1, 0, C.muted)], lT = [ltext(0, 2), ltext(1, 0)];
  await until(S(26)); await play(new M.FadeIn(sB[0]), new M.FadeIn(sB[1]), new M.FadeIn(new M.VGroup(...sT, ...lT)), ...say('ONE FRIEND LIFTS ALL: HUGE STRAIN', C.pink));
  const sT2 = [stext(0, 1, C.green), stext(1, 1, C.green)], lT2 = [ltext(0, 1), ltext(1, 1)];
  await until(S(26) + 2.8);
  await play(new M.Transform(sB[0], sbar(0, 1, C.green)), new M.Transform(sB[1], sbar(1, 1, C.green)),
    new M.FadeOut(new M.VGroup(...sT, ...lT)), new M.FadeIn(new M.VGroup(...sT2, ...lT2)), ...say('SPLIT IT: EACH STRAIN IS SMALL', C.green));
  await until(S(27)); await play(...fbox(['load 2 → strain 4', 'load 1 → strain 1'], C.amber), ...say('STRAIN GROWS FASTER THAN THE LOAD', C.amber));
  await until(S(27) + 3.0); await play(...fbox(['load 2 → strain 4', 'load 1 → strain 1', ['cost = size × size', C.amber]], C.amber), ...say('SIZE × ITSELF = SQUARING', C.amber));

  // 28-32 squares: lopsided costs 10, sharing costs 2
  const CS = P ? 0.5 : 0.45, QB = P ? -2.0 : -1.4, QX = P ? [-1.6, 1.8] : [CX - 1.5, CX + 1.5];
  const cell = (x, y, color = C.pink) => { const b = new M.Rectangle({ width: CS * 0.9, height: CS * 0.9, color, strokeWidth: 1 }); b.setFill(color, 0.8); b.moveTo([x, y, 0]); return b; };
  const big = Array.from({ length: 9 }, (_, k) => cell(QX[0] + (k % 3 - 1) * CS, QB + (Math.floor(k / 3) + 0.5) * CS));
  const small = cell(QX[1], QB + CS / 2);
  const qlab = [at(T('3 × 3 = 9', 18, C.pink, true), QX[0], QB - 0.32), at(T('1 × 1 = 1', 18, C.pink, true), QX[1], QB - 0.32)];
  await until(S(28));
  await play(fadeAll([...friends, boxR, boxT, ...sB, ...sT2, ...lT2]), new M.LaggedStart([...big, small].map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...qlab)), ...fbox(['size 3: 3 × 3 = 9', 'size 1: 1 × 1 = 1', ['the sign does not count', C.muted]], C.amber),
    ...say('ONLY THE SIZE COUNTS, NOT THE SIGN', C.amber));
  const tags = [at(T('age −3', 18, C.cyan, false, true), QX[0], QB + 3 * CS + 0.3), at(T('mileage +1', 18, C.violet, false, true), QX[1], QB + CS + 0.3)];
  await until(S(29)); await play(new M.FadeIn(new M.VGroup(...tags)), ...fbox(['−3 and +1', ['9 + 1 = 10', C.pink]], C.pink), ...say('LOPSIDED: COST 10', C.pink));
  const tags2 = [at(T('age −1', 18, C.cyan, false, true), QX[0], QB + CS + 0.3), at(T('mileage −1', 18, C.violet, false, true), QX[1], QB + CS + 0.3)];
  const qlab2 = [at(T('1 × 1 = 1', 18, C.green, true), QX[0], QB - 0.32), at(T('1 × 1 = 1', 18, C.green, true), QX[1], QB - 0.32)];
  await until(S(30));
  await play(new M.FadeOut(new M.VGroup(...big.slice(1))), new M.Transform(big[0], cell(QX[0], QB + CS / 2, C.green)), new M.Transform(small, cell(QX[1], QB + CS / 2, C.green)),
    new M.FadeOut(new M.VGroup(...tags, ...qlab)), new M.FadeIn(new M.VGroup(...tags2, ...qlab2)),
    ...fbox(['−1 and −1', ['1 + 1 = 2', C.green]], C.green), ...say('SHARING IS CHEAPEST: 1 + 1 = 2', C.green));
  await until(S(31)); await play(new M.LaggedStart([big[0], small].map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.3, runTime: 1.2 }), ...say('THIS EXTRA COST = THE PENALTY', C.violet));
  await until(S(32)); await play(...fbox(['fit with a', 'squared-weight penalty', ['= ridge regression', C.green]], C.green), ...say('RIDGE REGRESSION', C.green));

  // 33-34 the knob: lambda
  const KX = P ? [-2.8, 2.8] : [2.7, 5.9], KY = P ? -3.75 : 1.45;
  const KPOS = { 0: 0, 0.1: 0.22, 1: 0.55, 4: 1 };   // knob positions for λ = 0, 0.1, 1, 4
  const kx = v => KX[0] + KPOS[v] * (KX[1] - KX[0]);
  const track = new M.Line({ start: [KX[0], KY, 0], end: [KX[1], KY, 0], color: C.muted, strokeWidth: 3 });
  const kticks = [0, 0.1, 1, 4].map(v => at(T(String(v), 16, C.muted, true), kx(v), KY - 0.33));
  const knob = v => { const d = new M.Circle({ radius: 0.15, color: C.amber }); d.setFill(C.amber, 1); d.moveTo([kx(v), KY, 0]); return d; };
  const kdot = knob(0);
  let kcap = at(T('how much the penalty counts', 15, C.muted), (KX[0] + KX[1]) / 2, KY + 0.4);
  await until(S(33));
  await play(fadeAll([big[0], small, ...tags2, ...qlab2]), new M.Create(track), new M.FadeIn(new M.VGroup(...kticks)), new M.FadeIn(kdot), new M.FadeIn(kcap),
    ...say('A KNOB: HOW MUCH THE PENALTY COUNTS', C.amber));
  const kcap2 = at(T('lambda  λ', 20, C.amber, false, true), (KX[0] + KX[1]) / 2, KY + 0.4);
  await until(S(34)); await play(new M.FadeOut(kcap), new M.FadeIn(kcap2), new M.Indicate(kdot), ...say('THE KNOB = LAMBDA (λ)', C.amber));
  kcap = kcap2;

  // 35-42 turn the knob: 0, 1, 4
  bars = [null, null, null]; labs = [null, null, null];
  const z3 = zline(), nm3 = names();
  await until(S(35));
  await play(new M.FadeIn(z3), new M.FadeIn(new M.VGroup(...nm3)), ...setWs([-3, 1, 0.3]), new M.Indicate(kdot),
    ...fbox(['cost = 9 + 1 + 0.09', '     ≈ 10', ['λ = 0: charged 0 × 10 = 0', C.muted]], C.amber), ...say('λ = 0: THE PENALTY DOESN’T COUNT', C.muted));
  await until(S(36)); await play(new M.Transform(kdot, knob(0.1)), ...setWs([-0.94, -0.94, 0.3]), ...fbox(['λ = 0.1', 'age −0.94, mileage −0.94', 'stickers +0.3']), ...say('λ = 0.1: AGE −0.9, MILEAGE −0.9'));
  await until(S(37));
  await play(new M.LaggedStart([bars[0], bars[1]].map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox(['−0.94 + (−0.94) ≈ −1.9', ['almost −2, shared evenly', C.green]], C.green), ...say('BOTH SAY: OLDER = CHEAPER', C.green));
  const MX0 = P ? -2.8 : 2.7, MW = P ? 5.6 : 3.2, MY = P ? -4.95 : 0.45;
  const mtrack = new M.Rectangle({ width: MW, height: 0.22, color: C.line, strokeWidth: 1 }); mtrack.moveTo([MX0 + MW / 2, MY, 0]);
  const mfill = f => { const b = new M.Rectangle({ width: MW * f, height: 0.22, color: C.pink, strokeWidth: 1 }); b.setFill(C.pink, 0.8); b.moveTo([MX0 + MW * f / 2, MY, 0]); return b; };
  const mlab = at(T('training error', 15, C.pink), MX0 + MW / 2, MY + 0.35);
  const meter = mfill(0.48);   // training error ÷ 4: 1.91 at λ = 0, 1.93 at λ = 0.1, 2.43 at λ = 1
  await until(S(38));
  await play(new M.FadeIn(new M.VGroup(mtrack, mlab)), new M.FadeIn(meter), ...fbox(['cost = 0.88 + 0.88 + 0.09', ['     ≈ 1.9, about 2', C.green]], C.green),
    ...say('COST ≈ 2, TRAINING ERROR BARELY MOVES', C.green));
  await until(S(38) + 2.6); await play(new M.Transform(meter, mfill(0.49)));
  await until(S(39)); await play(new M.Transform(kdot, knob(1)), ...setWs([-0.6, -0.6, 0.1]), ...fbox(['λ = 1', 'age −0.6, mileage −0.6', 'stickers +0.1']), ...say('λ = 1: ALL WEIGHTS SHRINK'));
  await until(S(40)); await play(...fbox(['−0.6 + (−0.6) = −1.2', 'cost = 0.36 + 0.36 + 0.01', ['     = 0.73, below 1', C.amber]], C.amber), ...say('SMALLER THAN −2, COST BELOW 1', C.amber));
  await until(S(41)); await play(new M.Transform(meter, mfill(0.61)), ...say('TRAINING ERROR RISES', C.pink));
  await until(S(42)); await play(new M.Indicate(kdot), ...say('TRADE A LITTLE FIT FOR STEADIER WEIGHTS', C.green));

  // 43-47 back to the question, then the short version
  await until(S(43)); await play(new M.LaggedStart([bars[0], bars[1]].map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.3, runTime: 1.2 }), ...say('DATA ALONE CAN’T SPLIT AGE FROM RIDING', C.amber));
  await until(S(44)); await play(...fbox(['sharing is cheapest', ['−0.6 and −0.6', C.green]], C.green), ...say('RIDGE SPLITS EVENLY, BY CHOICE', C.green));
  const nm4 = names(true);
  await until(S(45)); await play(new M.FadeOut(new M.VGroup(...nm3)), new M.FadeIn(new M.VGroup(...nm4)), ...say('β = BETA, A GREEK LETTER', C.violet));
  await until(S(46)); await play(...say('RIDGE: WEIGHTS WITH THE SMALLEST SCORE', C.amber));
  await until(S(47)); await play(...fbox(['score = training error', '  + λ × (β1² + β2² + β3²)', ['ridge: smallest score', C.amber]], C.amber));

  // 48-52 what it is for, and how to pick lambda
  await until(S(48)); await play(new M.LaggedStart([bars[0], bars[1]].map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }), ...say('FOR: LINKED FEATURES, OR MANY FEATURES', C.green));
  await until(S(49)); await play(...[-0.65, -0.55, 0.12].map((x, k) => new M.Transform(bars[k], wbar(k, x), { runTime: 0.7 })), ...say('SWAP A FEW BIKES: WEIGHTS BARELY MOVE'));
  await play(...[-0.56, -0.63, 0.09].map((x, k) => new M.Transform(bars[k], wbar(k, x), { runTime: 0.7 })));
  await play(...[-0.6, -0.6, 0.1].map((x, k) => new M.Transform(bars[k], wbar(k, x), { runTime: 0.7 })));
  await until(S(50)); await play(...say('STEADY → BETTER GUESSES ON NEW BIKES', C.green));
  const VX = i => CX + (i - 2.5) * (P ? 1.15 : 1.0), VY = P ? -1.0 : -0.3;
  const vb = BIKES.map((_, i) => { const c = i < 4 ? C.cyan : C.amber, r = new M.RoundedRectangle({ width: 0.75, height: 0.75, cornerRadius: 0.12, color: c, strokeWidth: 2 }); r.setFill(c, 0.2); r.moveTo([VX(i), VY, 0]); return r; });
  const vn = BIKES.map((_, i) => at(T(String(i + 1), 20, i < 4 ? C.cyan : C.amber, true), VX(i), VY));
  const vt = [at(T('fit on these', 16, C.cyan), (VX(0) + VX(3)) / 2, VY - 0.7), at(T('held back', 16, C.amber), (VX(4) + VX(5)) / 2, VY - 0.7)];
  await until(S(51));
  await play(fadeAll([z3, ...nm4, ...bars, ...labs, track, ...kticks, kdot, kcap, mtrack, mlab, meter]),
    new M.LaggedStart(BIKES.map((_, i) => new M.FadeIn(vb[i])), { lagRatio: 0.12, runTime: 1.4 }), new M.FadeIn(new M.VGroup(...vn, ...vt)),
    ...fbox(['try λ = 0, 0.1, 1, 4', 'check the held-back bikes', ['keep the best λ', C.green]], C.green), ...say('PICK λ: TEST ON HELD-BACK BIKES', C.amber));
  await until(S(52)); await play(new M.LaggedStart(vb.slice(4).map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.3, runTime: 1.2 }), ...say('THIS IS CROSS-VALIDATION', C.green));

  // 53-56 the trap: stickers shrink but never reach zero; too much lambda squashes everything
  const GW = [[-3, 1, 0.3], [-0.94, -0.94, 0.3], [-0.6, -0.6, 0.1], [-0.27, -0.27, 0.05]];
  const GN = ['λ = 0', 'λ = 0.1', 'λ = 1', 'λ = 4'];
  const GSP = P ? 1.95 : 2.1, TZ = P ? 0 : -0.1, TU = P ? 0.7 : 0.5, GBW = P ? 0.3 : 0.36, GOF = P ? 0.42 : 0.5;
  const gx = g => (P ? 0 : -1.8) + (g - 1.5) * GSP;
  const keyY = TZ - 3 * TU - (P ? 1.05 : 0.95);
  const gkey = ['age', 'mileage', 'stickers'].flatMap((s, k) => {
    const x = (P ? 0 : -1.8) + (k - 1) * (P ? 2.1 : 2.0);
    const sw = new M.Rectangle({ width: 0.3, height: 0.22, color: FC[k], strokeWidth: 1 }); sw.setFill(FC[k], 0.82); sw.moveTo([x - 0.55, keyY, 0]);
    return [sw, at(T(s, 16, FC[k], false, true), x + 0.15, keyY)];
  });
  const gbar = (g, k) => { const w = GW[g][k], hh = Math.max(Math.abs(w) * TU, 0.03), b = new M.Rectangle({ width: GBW, height: hh, color: FC[k], strokeWidth: 1 }); b.setFill(FC[k], 0.82); b.moveTo([gx(g) + (k - 1) * GOF, TZ + w * TU / 2, 0]); return b; };
  const gbars = GW.map((_, g) => [0, 1, 2].map(k => gbar(g, k)));
  const glab = GN.map((s, g) => at(T(s, 16, C.muted, true), gx(g), TZ - 3 * TU - 0.45));
  const gst = [0, 1, 2].map(g => at(T(String(GW[g][2]), 16, C.amber, true), gx(g) + GOF, TZ + GW[g][2] * TU + 0.25));
  const tline = new M.Line({ start: [gx(0) - 0.8, TZ, 0], end: [gx(3) + 0.8, TZ, 0], color: C.muted, strokeWidth: 2 });
  await until(S(53));
  await play(fadeAll([...vb, ...vn, ...vt]), new M.Create(tline), new M.LaggedStart(gbars.slice(0, 3).flat().map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 1.6 }),
    new M.FadeIn(new M.VGroup(...glab.slice(0, 3), ...gst, ...gkey)), ...fbox(['sticker weight', ['0.3 → 0.3 → 0.1', C.amber]], C.amber), ...say('THE TRAP', C.pink));
  await play(new M.LaggedStart([0, 1, 2].map(g => new M.Indicate(gbars[g][2], { color: C.amber })), { lagRatio: 0.4, runTime: 1.8 }));
  await until(S(54)); await play(new M.Indicate(gbars[2][2], { color: C.amber }), ...say('SHRINKS, BUT NEVER ALL THE WAY TO 0', C.amber));
  await until(S(55)); await play(new M.LaggedStart(gbars[3].map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.0 }), new M.FadeIn(glab[3]), ...say('TOO MUCH λ: USEFUL WEIGHTS SQUASHED', C.pink));
  await until(S(55) + 3.4); await play(...say('GUESSES MISS MORE, EVEN ON NEW BIKES', C.pink));
  await until(S(56)); await play(...fbox(['to drop a feature:', ['lasso (next lesson)', C.violet]], C.violet), ...say('DROP A FEATURE COMPLETELY: LASSO', C.violet));

  // 57-58 try it, recap
  await until(S(57)); await play(...boxOff(), ...say('TRY IT: SLIDE λ, WATCH IT CHANGE'));
  await until(S(58)); await play(...fbox(['cost = squared weights', 'linked features share', ['all weights shrink', C.green]], C.green), ...say('RECAP: RIDGE', C.green));
}

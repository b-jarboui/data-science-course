// 10.3.4 Poisson regression. Beat i = sentence i. Log 2: visits per year, 30 patients, 10 per group.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const TEAL = '#40D9C2', RED = '#F87181';
  const CX = P ? 0 : -2.55;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.25, -0.15, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ---------- helpers ----------
  const tx = (s, size, color, pos, mono = false, maxW = 0) => { const t = T(s, size, color, mono); if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth()); t.moveTo(pos); return t; };
  const ln = (a, b, color = C.muted, w = 2) => new M.Line({ start: a, end: b, color, strokeWidth: w });
  const dl = (a, b, color = C.muted) => new M.DashedLine({ start: a, end: b, color });
  const dot = (p, color = TEAL, r = 0.09) => { const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1); return d; };
  const bar = (w, h, p, color, op = 0.8) => { const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 }); r.setFill(color, op); r.moveTo(p); return r; };
  const tag = (s, color, p, size = 15) => { const t = pill(s, color, size); t.moveTo(p); return t; };
  const arrow = (a, b, color = C.amber, w = 3) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, h = Math.min(0.16, l * 0.35), q = h * 0.6;
    return new M.VGroup(ln(a, b, color, w), ln(b, [b[0] - h * ux - q * uy, b[1] - h * uy + q * ux, 0], color, w), ln(b, [b[0] - h * ux + q * uy, b[1] - h * uy - q * ux, 0], color, w));
  };
  const fin = (...o) => o.filter(Boolean).map(x => new M.FadeIn(x));
  const fout = (...o) => o.filter(Boolean).map(x => new M.FadeOut(x));
  let pic = [], mk = [];
  const picture = (...o) => { const n = o.filter(Boolean); const a = [...fout(...pic, ...mk), ...fin(...n)]; pic = n; mk = []; return a; };
  const add = (...o) => { const n = o.filter(Boolean); pic.push(...n); return fin(...n); };
  const addLag = (arr, rt = 1.2, lr = 0.12) => { pic.push(...arr); return [new M.LaggedStart(arr.map(x => new M.FadeIn(x)), { lagRatio: lr, runTime: rt })]; };
  const marks = (...o) => { const n = o.filter(Boolean); const a = [...fout(...mk), ...fin(...n)]; mk = n; return a; };
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [new M.FadeOut(boxNow)] : [];
    if (!lines) { boxNow = null; return a; }
    const size = P ? 21 : 20, lh = P ? 0.39 : 0.43;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.64, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const sc = Math.min(1, (P ? FW - 1.1 : 4.35) / wd, (P ? 1.75 : 3.6) / ht);
    if (sc < 1) g.scale(sc);
    g.moveTo(BOXP);
    a.push(new M.FadeIn(g)); boxNow = g; return a;
  }
  function patient(p, color = TEAL, s = 1) {
    const head = new M.Circle({ radius: 0.13 * s, color }); head.setFill(color, 1); head.moveTo([p[0], p[1] + 0.2 * s, 0]);
    const body = new M.Arc({ radius: 0.23 * s, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 0.85); body.moveTo([p[0], p[1] - 0.05 * s, 0]);
    return new M.VGroup(head, body);
  }

  // ---------- data (Log 2) ----------
  const G = [[0, 0, 0, 0, 1, 1, 1, 2, 2, 3], [0, 0, 0, 1, 1, 2, 3, 3, 4, 6], [1, 2, 2, 3, 3, 4, 5, 6, 6, 8]];
  const NAMES = ['0 conditions', '1 condition', '2 conditions'];
  const TOT = G.map(g => g.reduce((a, b) => a + b, 0)), MEAN = TOT.map(t => t / 10);

  // ---------- picture A: three rows of dots ----------
  const AX0 = CX - (P ? 3.2 : 3.4), AX1 = CX + (P ? 3.3 : 3.5);
  const vx = v => AX0 + v / 8 * (AX1 - AX0);
  const ROWY = P ? [0.3, -1.5, -3.3] : [0.6, -0.75, -2.1];
  const PITCH = P ? 0.22 : 0.2;
  const rowLine = g => ln([AX0 - 0.15, ROWY[g], 0], [AX1 + 0.15, ROWY[g], 0], C.muted, 1.6);
  const rowLabel = g => tx(NAMES[g], 16, C.violet, [AX1 - 0.85, ROWY[g] + 0.78, 0]);
  const rowDots = g => { const used = {}; return G[g].map(v => { const j = used[v] || 0; used[v] = j + 1; return dot([vx(v), ROWY[g] + 0.13 + j * PITCH, 0], TEAL, 0.085); }); };
  const nums = new M.VGroup(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => tx(String(v), 15, C.muted, [vx(v), ROWY[2] - 0.28, 0], true)));
  const cap = tx('visits in one year', 15, C.muted, [CX, ROWY[2] - (P ? 0.7 : 0.62), 0]);
  const meanMark = g => new M.VGroup(
    ln([vx(MEAN[g]), ROWY[g] - 0.12, 0], [vx(MEAN[g]), ROWY[g] + 0.62, 0], C.amber, 3),
    tag('avg ' + MEAN[g], C.amber, [vx(MEAN[g]), ROWY[g] + 0.86, 0], 14));

  // 0 question
  await until(S(0)); await play(...say('HOW MANY VISITS TO EXPECT?', C.amber));
  // 1 thirty patients
  const sp = P ? 0.66 : 0.62;
  const icons = G.map((_, g) => Array.from({ length: 10 }, (_, k) => patient([CX + (k - 4.5) * sp, ROWY[g] + 0.15, 0], TEAL, 0.85)));
  await until(S(1)); await play(...addLag(icons.flat(), 1.6, 0.04), ...say('30 PATIENTS · 1 FULL YEAR', TEAL));
  // 2 long-term condition
  const iconLabels = [0, 1, 2].map(rowLabel);
  await until(S(2)); await play(...add(...iconLabels), ...say('LONG-TERM CONDITION = LASTS', C.violet));
  // 3 row for ten patients with no conditions
  const lines = [0, 1, 2].map(rowLine), labels = [0, 1, 2].map(rowLabel), dots = [0, 1, 2].map(rowDots);
  await until(S(3)); await play(...picture(lines[0], labels[0], nums, cap), ...say('ROW 1: NO LONG-TERM CONDITION', C.violet));
  // 4 dots at visit counts
  await until(S(4)); await play(...addLag(dots[0], 1.6, 0.12), ...say('ONE DOT = ONE PATIENT', TEAL));
  // 5 total 10
  await until(S(5)); await play(...fbox(['0 conditions', '0+0+0+0+1+1+1+2+2+3', ['total = 10 visits', C.amber]], C.amber), ...say('TOGETHER: 10 VISITS', C.amber));
  // 6 share: average 1
  const means = [0, 1, 2].map(meanMark);
  await until(S(6)); await play(...add(means[0]), ...fbox(['total = 10 visits', 'patients = 10', ['10 ÷ 10 = 1 visit', C.amber]], C.amber), ...say('AVERAGE: 1 VISIT EACH', C.amber));
  // 7 one condition: 20 visits
  await until(S(7)); await play(...add(lines[1], labels[1]), ...addLag(dots[1], 1.6, 0.1), ...fbox(['1 condition', '0+0+0+1+1+2+3+3+4+6', ['total = 20 visits', C.amber]], C.amber), ...say('1 CONDITION: 20 VISITS', TEAL));
  // 8 average 2
  await until(S(8)); await play(...add(means[1]), ...fbox(['20 ÷ 10 = 2', ['average = 2 visits', C.amber]], C.amber), ...say('AVERAGE: 2 VISITS', C.amber));
  // 9 two conditions: 40 visits
  await until(S(9)); await play(...add(lines[2], labels[2]), ...addLag(dots[2], 1.6, 0.1), ...fbox(['2 conditions', '1+2+2+3+3+4+5+6+6+8', ['total = 40 visits', C.amber]], C.amber), ...say('2 CONDITIONS: 40 VISITS', TEAL));
  // 10 average 4
  await until(S(10)); await play(...add(means[2]), ...fbox(['40 ÷ 10 = 4', ['average = 4 visits', C.amber]], C.amber), ...say('AVERAGE: 4 VISITS', C.amber));
  // 11 three averages
  await until(S(11)); await play(new M.LaggedStart(means.map(m => new M.Indicate(m.submobjects[1].submobjects[1], { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['averages', ['1   2   4', C.amber]], C.amber), ...say('THE AVERAGES: 1, 2, 4', C.amber));
  // 12 gaps grow, but each doubles
  await until(S(12)); await play(...fbox(['1 → 2 : gap 1', '2 → 4 : gap 2', ['each one × 2', C.green]], C.green), ...say('EACH AVERAGE IS DOUBLE THE LAST', C.green));

  // ---------- picture B: score line ----------
  const GX0 = CX - (P ? 3.0 : 3.2), GX1 = CX + (P ? 3.1 : 3.4);
  const GY0 = P ? -3.9 : -2.35, GY1 = P ? 1.0 : 1.2;
  const cxp = c => GX0 + 0.9 + c * (GX1 - GX0 - 1.6) / 2;
  const sy = s => GY0 + s / 1.6 * (GY1 - GY0);
  const scoreAxes = new M.VGroup(
    ln([GX0, GY0, 0], [GX1, GY0, 0], C.muted, 2), ln([GX0, GY0, 0], [GX0, GY1, 0], C.muted, 2),
    ...[0, 1, 2].map(c => tx(String(c), 16, C.muted, [cxp(c), GY0 - 0.27, 0], true)),
    tx('number of conditions', 15, C.muted, [CX, GY0 - 0.62, 0]),
    ...[0, 0.5, 1, 1.5].map(s => tx(String(s), 14, C.muted, [GX0 - 0.3, sy(s), 0], true)),
    tx('score', 16, C.violet, [GX0 + 0.45, GY1 + 0.15, 0]));
  await until(S(13)); await play(...fbox(null), ...picture(scoreAxes), ...say('A NEW NUMBER: THE SCORE', C.violet));
  // 14 straight line from 0, same step
  const SC = [0, 0.69, 1.39];
  const scoreDots = SC.map((s, c) => dot([cxp(c), sy(s), 0], C.violet, 0.11));
  const scoreLine = ln([cxp(0), sy(0), 0], [cxp(2), sy(1.39), 0], C.violet, 3);
  const steps = [0, 1].map(c => new M.VGroup(
    dl([cxp(c), sy(SC[c]), 0], [cxp(c + 1), sy(SC[c]), 0], C.muted),
    ln([cxp(c + 1), sy(SC[c]), 0], [cxp(c + 1), sy(SC[c + 1]), 0], C.amber, 3),
    tx('+0.69', 15, C.amber, [cxp(c + 1) + 0.42, (sy(SC[c]) + sy(SC[c + 1])) / 2, 0], true)));
  await until(S(14)); await play(new M.Create(scoreLine), ...add(...scoreDots, ...steps), ...say('START AT 0 · SAME STEP EACH TIME', C.violet));
  pic.push(scoreLine);

  // ---------- picture C: the growth curve ----------
  const HX0 = CX - (P ? 3.2 : 3.4), HX1 = CX + (P ? 3.3 : 3.5);
  const hx = s => HX0 + (s + 1.6) / 3.2 * (HX1 - HX0);
  const hy = v => GY0 + v / 4.6 * (GY1 - GY0);
  const curve = new M.VGroup(...Array.from({ length: 40 }, (_, i) => {
    const s0 = -1.6 + i * 3.1 / 40, s1 = s0 + 3.1 / 40;
    return ln([hx(s0), hy(Math.exp(s0)), 0], [hx(s1), hy(Math.exp(s1)), 0], C.cyan, 3.5);
  }));
  const curveAxes = new M.VGroup(
    ln([HX0, GY0, 0], [HX1, GY0, 0], C.muted, 2), ln([hx(0), GY0, 0], [hx(0), GY1, 0], C.muted, 1.6),
    ...[-1, 0, 1].map(s => tx(String(s), 14, C.muted, [hx(s), GY0 - 0.26, 0], true)),
    tx('score', 15, C.violet, [HX1 - 0.45, GY0 - 0.3, 0]),
    ...[1, 2, 3, 4].map(v => tx(String(v), 14, C.muted, [hx(0) - 0.22, hy(v), 0], true)),
    tx('expected count', 15, C.cyan, [hx(0) - 1.25, GY1 + 0.12, 0]));
  const PTS = [[0, 1], [0.69, 2], [1.39, 4]];
  const ptDots = PTS.map(([s, v]) => dot([hx(s), hy(v), 0], C.amber, 0.11));
  const ptDrops = PTS.map(([s, v]) => dl([hx(s), GY0, 0], [hx(s), hy(v), 0], C.amber));
  await until(S(15)); await play(...picture(curveAxes), new M.Create(curve), ...say('GROWTH CURVE: SCORE → COUNT', C.cyan));
  pic.push(curve);
  // 16 expected count
  const ptLabels = PTS.map(([s, v], i) => { const t = T(`${['0', '0.69', '1.39'][i]} → ${v}`, 15, C.amber, true); if (i === 2) t.moveTo([hx(s) - 0.85, hy(v) + 0.05, 0]); else if (i === 0 && !P) t.moveTo([hx(s) - 0.9, hy(v) + 0.32, 0]); else t.moveTo([hx(s) + 0.2 + t.getWidth() / 2, hy(v) - 0.28, 0]); return t; });
  await until(S(16)); await play(...add(...ptDrops, ...ptDots, ...ptLabels), ...fbox(['expected count =', 'predicted average', 'visits per patient'], C.cyan), ...say('EXPECTED COUNT = PREDICTED AVERAGE', C.cyan));
  // 17 equal steps multiply
  const stepArrows = [0, 1].map(i => arrow([hx(PTS[i][0]) + 0.05, GY0 + 0.25, 0], [hx(PTS[i + 1][0]) - 0.05, GY0 + 0.25, 0], C.violet, 2.5));
  const stepTxt = [0, 1].map(i => tx('+0.69', 13, C.violet, [(hx(PTS[i][0]) + hx(PTS[i + 1][0])) / 2, GY0 + 0.5, 0], true));
  await until(S(17)); await play(...marks(...stepArrows, ...stepTxt), ...fbox(['score + 0.69', ['count × 2', C.amber], '1 → 2 → 4'], C.amber), ...say('EQUAL STEPS RIGHT = × SAME AMOUNT', C.amber));
  // 18 exponential
  const expTag = tag('EXPONENTIAL', C.cyan, [hx(-0.6), hy(3.2), 0], 16);
  await until(S(18)); await play(...add(expTag), new M.Indicate(curve, { color: C.cyan }), ...say('THIS CURVE: THE EXPONENTIAL', C.cyan));
  // 19 above zero even for negative score
  const leftArrow = arrow([hx(-0.9), hy(1.2), 0], [hx(-1.45), hy(0.45), 0], C.green, 2.5);
  const aboveTag = tag('ALWAYS ABOVE 0', C.green, [hx(-1.0), hy(1.55), 0], 14);
  await until(S(19)); await play(...marks(leftArrow, aboveTag), ...fbox(['score below 0', ['count still above 0', C.green], 'never negative'], C.green), ...say('NEVER BELOW ZERO', C.green));
  // 20 Poisson regression
  await until(S(20)); await play(...marks(), ...fbox([['POISSON REGRESSION', C.amber], '1. this growth curve', '2. Poisson rule', '   for counts'], C.amber), ...say('= POISSON REGRESSION', C.amber));
  // 21 the Poisson rule: chance of each whole count (mean 2)
  const pp = [Math.exp(-2)]; for (let n = 1; n <= 7; n++) pp.push(pp[n - 1] * 2 / n);
  const BX0 = CX - (P ? 2.9 : 3.0), BW = (P ? 5.8 : 6.0) / 8;
  const by = p => GY0 + p / 0.3 * (GY1 - 0.6 - GY0);
  const pBars = pp.map((p, n) => bar(BW * 0.7, Math.max(0.01, by(p) - GY0), [BX0 + (n + 0.5) * BW, (GY0 + by(p)) / 2, 0], C.cyan, 0.8));
  const pAxes = new M.VGroup(ln([BX0, GY0, 0], [BX0 + 8 * BW, GY0, 0], C.muted, 2),
    ...pp.map((_, n) => tx(String(n), 15, C.muted, [BX0 + (n + 0.5) * BW, GY0 - 0.26, 0], true)),
    tx('visits (whole numbers)', 15, C.muted, [CX, GY0 - 0.62, 0]),
    tx('how likely, when the mean is 2', 16, C.cyan, [CX, GY1 - 0.15, 0], false, P ? 6.5 : 6.5));
  await until(S(21)); await play(...picture(pAxes), ...addLag(pBars, 1.2, 0.1), ...say('POISSON RULE: CHANCE OF EACH COUNT', C.cyan));

  // ---------- picture D: fitting the multiplier ----------
  const DX = P ? [-2.2, 0, 2.2] : [CX - 2.1, CX, CX + 2.1];
  const DB = P ? -5.6 : -2.4, DU = P ? 0.95 : 0.76, DW = P ? 0.8 : 0.9;
  const obsBars = MEAN.map((m, g) => bar(DW, m * DU, [DX[g], DB + m * DU / 2, 0], TEAL, 0.55));
  const obsNums = MEAN.map((m, g) => tx(String(m), 17, C.ink, [DX[g], DB + 0.25, 0], true));
  const dAxes = new M.VGroup(ln([DX[0] - 1.0, DB, 0], [DX[2] + 1.3, DB, 0], C.muted, 2),
    ...[0, 1, 2].map(g => tx(`${g} cond.`, 15, C.muted, [DX[g], DB - 0.27, 0])),
    tx('teal = seen average   amber = prediction', 16, C.ink, [CX, DB + 4.6 * DU, 0], false, P ? 7.2 : 7.0));
  const predObj = (g, v, s) => {
    const t = T(s, 16, C.amber, true);
    t.moveTo([DX[g] + DW / 2 + 0.22 + t.getWidth() / 2, DB + v * DU + 0.2, 0]);
    return new M.VGroup(ln([DX[g] - DW / 2 - 0.12, DB + v * DU, 0], [DX[g] + DW / 2 + 0.12, DB + v * DU, 0], C.amber, 5), t);
  };
  let preds = [];
  const setPreds = vals => { const nw = vals.map((v, g) => v == null ? null : predObj(g, v[0], v[1])); const a = [...fout(...preds), ...fin(...nw)]; preds = nw.filter(Boolean); return a; };
  // loss plot (in the box area)
  const LX0 = P ? -2.9 : 2.75, LX1 = P ? 2.9 : 6.25, LY0 = P ? -0.25 : -1.3, LY1 = P ? 1.4 : 1.15;
  const lxm = m => LX0 + 0.5 + (m - 1) / 1.0 * (LX1 - LX0 - 1.0);
  const lyv = v => LY0 + v / 30 * (LY1 - LY0);
  const lossAxes = new M.VGroup(ln([LX0, LY0, 0], [LX1, LY0, 0], C.muted, 2), ln([LX0, LY0, 0], [LX0, LY1, 0], C.muted, 2),
    ...[1, 1.5, 2].map(m => tx(String(m), 15, C.muted, [lxm(m), LY0 - 0.24, 0], true)),
    tx('multiplier', 15, C.muted, [(LX0 + LX1) / 2, LY0 - 0.52, 0]),
    tx('loss', 16, RED, [LX0 + 0.35, LY1 + 0.17, 0]));
  const LOSS = [[1, 29, '29'], [1.5, 6, '6'], [2, 0, '0']];
  const lossDot = i => new M.VGroup(dot([lxm(LOSS[i][0]), lyv(LOSS[i][1]), 0], RED, 0.09),
    tx(LOSS[i][2], 18, RED, [lxm(LOSS[i][0]) + 0.32, lyv(LOSS[i][1]) + 0.2, 0], true));
  const lossSeg = i => ln([lxm(LOSS[i][0]), lyv(LOSS[i][1]), 0], [lxm(LOSS[i + 1][0]), lyv(LOSS[i + 1][1]), 0], RED, 2.5);

  await until(S(22)); await play(...fbox(null), ...picture(dAxes, ...obsBars, ...obsNums), ...setPreds([[1, '1'], null, null]), ...say('START: 1 VISIT FOR 0 CONDITIONS', C.amber));
  await until(S(23)); await play(...setPreds([[1, '1'], [1, '1×1'], null]), ...say('TRY MULTIPLIER 1', C.amber));
  await until(S(24)); await play(...setPreds([[1, '1'], [1, '1'], [1, '1']]), new M.Indicate(obsNums[2], { color: RED }), ...say('1 EACH: FAR TOO LOW FOR 4', RED));
  await until(S(25)); await play(...add(lossAxes), ...say('LOSS = COST OF A POOR FIT', RED));
  const lossDots = [0, 1, 2].map(lossDot);
  await until(S(26)); await play(...add(lossDots[0]), ...say('LOSS: ABOUT 29 ABOVE THE BEST', RED));
  await until(S(27)); await play(...setPreds([[1, '1'], [1.5, '1.5'], [1, '1']]), ...say('MULTIPLIER 1 + 0.5 = 1.5', C.amber));
  await until(S(28)); await play(...setPreds([[1, '1'], [1.5, '1.5'], [2.25, '1.5×1.5']]), ...say('2 CONDITIONS: USE IT TWICE', C.amber));
  await until(S(29)); await play(...setPreds([[1, '1'], [1.5, '1.5'], [2.25, '2.25']]), ...say('1.5 × 1.5 = 2.25 · STILL BELOW 4', C.amber));
  const seg0 = lossSeg(0), seg1 = lossSeg(1);
  await until(S(30)); await play(...add(seg0, lossDots[1]), ...say('LOSS DROPS TO ABOUT 6', RED));
  await until(S(31)); await play(...setPreds([[1, '1'], [2, '2'], [2.25, '2.25']]), ...say('MULTIPLIER 1.5 + 0.5 = 2', C.amber));
  await until(S(32)); await play(...setPreds([[1, '1'], [2, '2'], [4, '2×2 = 4']]), ...say('PREDICTIONS 2 AND 4 · MATCH!', C.green));
  const minTag = tag('LOWEST', C.green, [lxm(2) - 0.1, lyv(0) + 1.15, 0], 15);
  await until(S(33)); await play(...add(seg1, lossDots[2], minTag), ...say('LOSS AT ITS MINIMUM', C.green));

  // ---------- formula ----------
  await until(S(34)); await play(...fout(lossAxes, ...lossDots, seg0, seg1, minTag), ...say('THE FORMULA', C.cyan));
  pic = pic.filter(o => ![lossAxes, ...lossDots, seg0, seg1, minTag].includes(o));
  await until(S(35)); await play(...fbox([['expected count', C.ink], ['  = e ^ score', C.cyan]], C.cyan), ...say('COUNT = e TO THE POWER SCORE', C.cyan));
  await until(S(36)); await play(...fbox([['expected count', C.ink], ['  = e ^ score', C.cyan], ['e ≈ 2.7 (fixed)', C.amber]], C.cyan), ...say('e IS A FIXED NUMBER ≈ 2.7', C.amber));
  await until(S(37)); await play(...fbox([['calculator:', C.ink], ['[ e^x ] button', C.amber], 'e^0.69 ≈ 2'], C.amber), ...say('CALCULATOR BUTTON: e^x', C.amber));
  await until(S(38)); await play(...fbox(['score = start', '  + step × conditions', ['= 0 + 0.69 × cond.', C.violet]], C.violet), ...say('SCORE = START + STEP × CONDITIONS', C.violet));
  await until(S(39)); await play(...fbox(['step ≈ 0.69', ['e^0.69 ≈ 2', C.amber], 'multiplier ≈ 2', 'per condition'], C.amber), ...say('STEP 0.69 → MULTIPLIER 2', C.amber));
  // 40-41 when to use
  await until(S(40)); await play(...fbox(['use it to predict', ['the mean of a count', C.green], 'e.g. visits per patient'], C.green), ...say('PREDICT THE MEAN OF A COUNT', C.green));
  await until(S(41)); await play(new M.LaggedStart(preds.map(p => new M.Indicate(p.submobjects[1], { color: C.green })), { lagRatio: 0.3, runTime: 1.5 }),
    ...fbox(['one more condition', ['= mean × 2', C.green], '1 → 2 → 4'], C.green), ...say('ONE MORE CONDITION = × 2', C.green));
  // 42-45 trap
  await until(S(42)); await play(...fbox([['TRAP', RED], 'Poisson does not', 'suit every count'], RED), ...say('TRAP: POISSON DOES NOT FIT ALL', RED));
  await until(S(43)); await play(...fbox(['Poisson rule:', ['variance = mean', RED]], RED), ...say('POISSON: VARIANCE = MEAN', RED));
  await until(S(44)); await play(...fbox(['variance =', 'average of squared', 'distances from', 'the average'], C.violet), ...say('VARIANCE = SPREAD (SQUARED)', C.violet));
  await until(S(45)); await play(new M.Indicate(obsBars[1], { color: C.amber }), ...fbox(['1 condition: mean 2', ['Poisson expects', C.amber], ['variance 2', C.amber], 'check the real counts'], C.amber), ...say('CHECK THE CLINIC’S COUNTS', C.amber));
  // 46 summary
  await until(S(46)); await play(...fbox(['straight score', '→ growth curve', ['→ expected count', C.cyan]], C.cyan), ...say('POISSON REGRESSION IN ONE LINE', C.cyan));
}

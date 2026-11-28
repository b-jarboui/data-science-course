// 18.2.9 Diffusion noising: adding noise step by step. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const say = (s, c = C.cyan) => showA(s, c, P ? [0, 4.15, 0] : undefined);
  const LS = P ? 17 : 15;

  // pot (left on laptop, top on phone)
  const PX = P ? 0 : -4.7, PB = P ? 1.75 : -0.9, UX = P ? 0.26 : 0.25, UY = P ? 0.36 : 0.38;
  function pot(r, color) {
    const m = [1, 3, r], x = PX, y0 = PB;
    const v = [[x + m[0] * UX, y0], [x + m[1] * UX, y0 + 2 * UY], [x + m[2] * UX, y0 + 4 * UY], [x - m[2] * UX, y0 + 4 * UY], [x - m[1] * UX, y0 + 2 * UY], [x - m[0] * UX, y0]];
    const p = new M.Polygon({ vertices: v.map(([a, c]) => [a, c, 0]), color, strokeWidth: 3 }); p.setFill(color, 0.14); return p;
  }
  const rimPt = r => [PX + r * UX, PB + 4 * UY, 0];
  const LABP = P ? [2.85, PB + 0.8, 0] : [PX, PB + 4 * UY + 0.35, 0];
  const potLab = (r, c) => { const t = T(`1, 3, ${r}`, 17, c, true); t.moveTo(LABP); return t; };

  // formula box
  let BOXP = P ? [0, -4.6, 0] : [-4.6, -2.05, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.38 : 0.42;
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
    const maxw = P ? FW - 1.2 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // chart: steps (x) vs rim (y)
  const xs = t => P ? -2.6 + t * 1.75 : -0.6 + t * 1.9;
  const Y0 = P ? -3.0 : -0.5, KY = P ? 0.38 : 0.36;
  const ry = r => Y0 + (Math.max(0, Math.min(8, r)) - 4) * KY;
  const AX = P ? -3.15 : -1.2;
  const axisY = new M.Line({ start: [AX, ry(0), 0], end: [AX, ry(8), 0], color: C.muted, strokeWidth: 2 });
  const axisX = new M.Line({ start: [AX, ry(0), 0], end: [xs(3) + 0.9, ry(0), 0], color: C.muted, strokeWidth: 2 });
  const yt = [0, 2, 4, 6, 8].map(r => T(String(r), LS, C.muted, true).moveTo([AX - 0.28, ry(r), 0]));
  const yname = T('rim', LS, C.amber); yname.moveTo([AX + 0.3, ry(8) + 0.25, 0]);
  const xt = [0, 1, 2, 3].map(t => T('step ' + t, LS, C.muted).moveTo([xs(t), ry(0) - 0.32, 0]));
  const chart = new M.VGroup(axisY, axisX, ...yt, yname, ...xt);

  // 0-4 the clean bowl
  const potA = pot(4, C.cyan); let lab = potLab(4, C.cyan);
  await until(S(0)); await play(new M.Create(potA), ...fbox(['goal: new shapes', ['from random numbers', C.amber]], C.amber), ...say('SHAPES FROM RANDOM NUMBERS?', C.amber));
  await until(S(1)); await play(...fbox(['first: disturb a shape,', ['step by step', C.pink]], C.pink), ...say('FIRST: DISTURB A SHAPE, STEP BY STEP', C.pink));
  await until(S(2)); await play(new M.Indicate(potA, { color: C.cyan }), new M.FadeIn(lab), ...dropBox(), ...say('BOWL B1: 1, 3, 4'));
  const fixed = [[PX + 1 * UX, PB, 0], [PX + 3 * UX, PB + 2 * UY, 0]].map(p => { const d = new M.Dot({ point: p, radius: 0.08, color: C.muted }); return d; });
  await until(S(3)); await play(...fixed.map(d => new M.FadeIn(d)), ...say('BOTTOM AND MIDDLE STAY FIXED', C.muted));
  const rd = new M.Dot({ point: rimPt(4), radius: 0.1, color: C.ink }); rd.setFill(C.ink, 1);
  await until(S(4)); await play(new M.FadeIn(rd), new M.Flash(rd, { color: C.ink }), ...say('ONLY THE RIM CAN CHANGE'));

  // 5-9 pushes = noise
  const out = new M.Arrow({ start: rimPt(4), end: [rimPt(4)[0] + 0.7, rimPt(4)[1], 0], color: C.pink, strokeWidth: 4, buff: 0 });
  const inn = new M.Arrow({ start: rimPt(4), end: [rimPt(4)[0] - 0.7, rimPt(4)[1], 0], color: C.pink, strokeWidth: 4, buff: 0 });
  await until(S(5)); await play(new M.Create(out), new M.Create(inn), ...fbox([['random change: in or out', C.pink]], C.pink), ...say('A SMALL RANDOM CHANGE: IN OR OUT', C.pink));
  await until(S(6)); await play(new M.FadeOut(inn), new M.Indicate(out, { color: C.pink }), ...fbox([['positive → outward', C.pink]], C.pink), ...say('POSITIVE CHANGE → OUTWARD', C.pink));
  await until(S(7)); await play(new M.FadeOut(out), new M.FadeIn(inn), ...fbox([['negative → inward', C.pink]], C.pink), ...say('NEGATIVE CHANGE → INWARD', C.pink));
  await until(S(8)); await play(new M.FadeOut(inn), ...fbox([['random change = noise', C.pink]], C.pink), ...say('REMEMBER: RANDOM CHANGE = NOISE', C.pink));
  await until(S(9)); await play(...dropBox());
  await play(...say('FRESH NOISE AGAIN AND AGAIN?', C.amber));

  // 10-14 the Gaussian noise curve
  const BX = P ? 0 : 2.4, KX = P ? 1.05 : 0.85, BB = P ? -4.2 : -1.9, BH = P ? 2.6 : 2.4;
  const bell = [];
  for (let i = 0; i <= 40; i++) { const u = -3.2 + 6.4 * i / 40; bell.push([BX + u * KX, BB + BH * Math.exp(-u * u / 2), 0]); }
  const bellP = new M.Polygon({ vertices: [[BX - 3.2 * KX, BB, 0], ...bell, [BX + 3.2 * KX, BB, 0]], color: C.pink, strokeWidth: 3 }); bellP.setFill(C.pink, 0.15);
  const bAx = new M.Line({ start: [BX - 3.4 * KX, BB, 0], end: [BX + 3.4 * KX, BB, 0], color: C.muted, strokeWidth: 2 });
  const bT = [-2, -1, 0, 1, 2].map(u => T(u < 0 ? '−' + Math.abs(u) : (u > 0 ? '+' + u : '0'), LS, C.pink, true).moveTo([BX + u * KX, BB - 0.3, 0]));
  const bName = T('noise', LS, C.pink); bName.moveTo([BX + 3.0 * KX, BB + 0.3, 0]);
  await until(S(10)); await play(new M.Create(bAx), new M.FadeIn(bellP), new M.FadeIn(new M.VGroup(...bT, bName)), ...say('A BELL OF POSSIBLE NOISE NUMBERS', C.pink));
  const meanL = new M.DashedLine({ start: [BX, BB, 0], end: [BX, BB + BH + 0.15, 0], color: C.ink });
  const meanT = T('mean 0', LS, C.ink); meanT.moveTo([BX + 0.55, BB + BH + 0.2, 0]);
  await until(S(11)); await play(new M.Create(meanL), new M.FadeIn(meanT), ...say('MEAN 0: NO PREFERRED DIRECTION'));
  const sdY = BB + BH * Math.exp(-0.5);
  const sdL = new M.Line({ start: [BX - KX, sdY, 0], end: [BX + KX, sdY, 0], color: C.amber, strokeWidth: 4 });
  const sdT = T('sd 1', LS, C.amber, true); sdT.moveTo([BX + KX + 0.45, sdY, 0]);
  await until(S(12)); await play(new M.Create(sdL), new M.FadeIn(sdT), ...say('STANDARD DEVIATION 1 = THE SPREAD', C.amber));
  await until(S(13)); await play(new M.Indicate(bellP, { color: C.pink }), ...say('REMEMBER: THE STANDARD NORMAL DISTRIBUTION', C.pink));
  const draws = [-0.6, 1.1, 0.2, -1.4, 0.7].map(u => { const d = new M.Dot({ point: [BX + u * KX, BB + 0.12, 0], radius: 0.09, color: C.pink }); d.setFill(C.pink, 1); return d; });
  await until(S(14)); await play(new M.LaggedStart(draws.map(d => new M.FadeIn(d)), { lagRatio: 0.3, runTime: 1.4 }), ...say('EVERY NOISE NUMBER COMES FROM IT', C.pink));

  // 15-27 three slow steps
  await until(S(15)); await play(new M.FadeOut(new M.VGroup(bellP, bAx, ...bT, bName, meanL, meanT, sdL, sdT, ...draws)), new M.Indicate(potA, { color: C.cyan }), ...fbox([['clean rim = 4', C.cyan]], C.cyan), ...say('BACK TO THE BOWL: RIM 4'));
  const p0 = new M.Dot({ point: [xs(0), ry(4), 0], radius: 0.1, color: C.cyan }); p0.setFill(C.cyan, 1);
  await until(S(16)); const dB = dropBox(); BOXP = P ? [0, 0.35, 0] : BOXP; await play(...dB, new M.FadeIn(chart), new M.FadeIn(p0), ...say('CLEAN SHAPE: NO NOISE YET', C.cyan));
  const PATH = [4, 5, 3, 2], NZ = [1, -2, -1];
  const segs = [], pts = [p0];
  async function step(t) {
    const r0 = PATH[t - 1], r1 = PATH[t], e = NZ[t - 1];
    const es = e > 0 ? '+' + e : '−' + Math.abs(e);
    const ar = new M.Arrow({ start: rimPt(r0), end: rimPt(r1), color: C.pink, strokeWidth: 4, buff: 0 });
    const sg = new M.Line({ start: [xs(t - 1), ry(r0), 0], end: [xs(t), ry(r1), 0], color: C.amber, strokeWidth: 4 });
    const d = new M.Dot({ point: [xs(t), ry(r1), 0], radius: 0.1, color: C.amber }); d.setFill(C.amber, 1);
    const tt = T(String(r1), LS, C.amber, true, true); tt.moveTo([xs(t) + 0.25, ry(r1) + 0.22, 0]);
    segs.push(sg); pts.push(d, tt);
    const nl = potLab(r1, C.amber);
    await play(new M.Create(ar), new M.Transform(potA, pot(r1, C.amber)), new M.Transform(rd, new M.Dot({ point: rimPt(r1), radius: 0.1, color: C.ink })),
      new M.FadeOut(lab), new M.FadeIn(nl), new M.Create(sg), new M.FadeIn(d), new M.FadeIn(tt));
    lab = nl;
    await play(new M.FadeOut(ar, { runTime: 0.5 }));
  }
  await until(S(17)); await play(...fbox(['step 1', ['  noise +1', C.pink]], C.pink), ...say('STEP 1: NOISE +1', C.pink));
  await until(S(18)); await play(...fbox(['step 1', ['  noise +1', C.pink], ['  4 + 1 = 5', C.amber]], C.amber));
  await until(S(19)); await play(...say('RIM MOVES OUT BY 1', C.amber)); await step(1);
  await until(S(20)); await play(...fbox(['step 2', ['  fresh noise −2', C.pink]], C.pink), ...say('STEP 2: FRESH NOISE −2', C.pink));
  await until(S(21)); await play(...fbox(['step 2', ['  fresh noise −2', C.pink], ['  5 + (−2) = 3', C.amber]], C.amber));
  await until(S(22)); await play(...say('RIM MOVES IN BY 2', C.amber)); await step(2);
  await until(S(23)); await play(...fbox(['step 3', ['  fresh noise −1', C.pink]], C.pink), ...say('STEP 3: FRESH NOISE −1', C.pink));
  await until(S(24)); await play(...fbox(['step 3', ['  fresh noise −1', C.pink], ['  3 + (−1) = 2', C.amber]], C.amber)); await step(3);
  await until(S(25)); await play(new M.Indicate(potA, { color: C.amber }), ...say('THE BOWL NOW LOOKS LIKE A VASE', C.amber));
  await until(S(26)); await play(...say('ROUNDED EXAMPLE NUMBERS', C.muted));
  await until(S(27)); await play(...fbox(['4 → 5 → 3 → 2'], C.amber), ...say('REPEATED FRESH NOISE = DIFFUSION NOISING', C.pink));

  // 28-30 many paths
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const gauss = () => { const u = Math.max(1e-6, rnd()), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const many = [];
  for (let k = 0; k < 16; k++) { const p = [4]; for (let t = 1; t <= 3; t++) p.push(p[t - 1] + gauss()); many.push(p); }
  const pathLines = (p, c, w, op) => [1, 2, 3].map(t => { const l = new M.Line({ start: [xs(t - 1), ry(p[t - 1]), 0], end: [xs(t), ry(p[t]), 0], color: c, strokeWidth: w }); l.setStrokeOpacity(op); return l; });
  const ends = p => [1, 2, 3].map(t => { const d = new M.Dot({ point: [xs(t), ry(p[t]), 0], radius: 0.055, color: C.amber }); d.setFill(C.amber, 0.8); return d; });
  const pl = many.map(p => pathLines(p, C.amber, 2, 0.45)), pe = many.map(ends);
  await until(S(28));
  await play(new M.FadeOut(new M.VGroup(...segs, ...pts.slice(1))), new M.Transform(potA, pot(4, C.cyan)), new M.Transform(rd, new M.Dot({ point: rimPt(4), radius: 0.1, color: C.ink })),
    new M.FadeOut(lab), ...dropBox(), ...say('RESET · NEW NOISE NUMBERS', C.cyan));
  lab = potLab(4, C.cyan);
  await play(new M.FadeIn(lab), new M.LaggedStart(pl[0].map(l => new M.Create(l)), { lagRatio: 0.8, runTime: 1.4 }), new M.FadeIn(new M.VGroup(...pe[0])));
  await until(S(29)); await play(new M.LaggedStart(pl[1].map(l => new M.Create(l)), { lagRatio: 0.8, runTime: 1.4 }), new M.FadeIn(new M.VGroup(...pe[1])), ...say('EACH RUN TAKES A DIFFERENT PATH', C.amber));
  await until(S(30)); await play(new M.LaggedStart(pl.slice(2).map((ls, k) => new M.FadeIn(new M.VGroup(...ls, ...pe[k + 2]))), { lagRatio: 0.25, runTime: 3 }), ...say('MANY RUNS: COLLECT THE RIMS', C.amber));

  // 31-36 the distribution widens
  const sd = [0, 1, Math.SQRT2, Math.sqrt(3)], A = P ? 0.55 : 0.75;
  const side = t => {
    const s = sd[t], v = [];
    const lo = Math.max(0.1, 4 - 3 * s), hi = Math.min(7.9, 4 + 3 * s);
    for (let i = 0; i <= 30; i++) { const r = lo + (hi - lo) * i / 30; v.push([xs(t) + A / s * Math.exp(-((r - 4) ** 2) / (2 * s * s)), ry(r), 0]); }
    const p = new M.Polygon({ vertices: [[xs(t), ry(lo), 0], ...v, [xs(t), ry(hi), 0]], color: C.pink, strokeWidth: 2 }); p.setFill(C.pink, 0.22); return p;
  };
  const sides = [null, side(1), side(2), side(3)];
  await until(S(31)); await play(new M.Flash(p0, { color: C.cyan }), ...fbox(['step 0: every rim = 4'], C.cyan), ...say('BEFORE NOISE: ALL EXACTLY 4'));
  await until(S(32)); await play(new M.FadeIn(sides[1]), ...fbox(['step 1:', ['  spread around 4', C.pink]], C.pink), ...say('STEP 1: SPREAD AROUND 4', C.pink));
  await until(S(33)); await play(new M.FadeIn(sides[2]), ...fbox(['step 2:', ['  wider', C.pink]], C.pink), ...say('STEP 2: WIDER', C.pink));
  await until(S(34)); await play(new M.FadeIn(sides[3]), ...fbox(['step 3:', ['  even wider', C.pink]], C.pink), ...say('STEP 3: EVEN WIDER', C.pink));
  const mean4 = new M.DashedLine({ start: [xs(0), ry(4), 0], end: [xs(3) + 0.8, ry(4), 0], color: C.ink });
  await until(S(35)); await play(new M.Create(mean4), ...fbox(['mean stays 4', ['noise mean = 0', C.pink]]), ...say('THE MEAN STAYS 4'));
  await until(S(36)); await play(...say('HARDER TO PREDICT AS NOISE PILES UP', C.amber));

  // 37-45 variance
  await until(S(37)); await play(...say('MEASURE THE SPREAD: VARIANCE', C.green));
  await until(S(38)); await play(...fbox(['variance =', '  average squared distance', '  from the mean'], C.green));
  await until(S(39)); await play(new M.Indicate(p0, { color: C.cyan }), ...fbox(['step 0', ['  variance 0', C.green]], C.green), ...say('ALL RIMS = 4 → VARIANCE 0'));
  await until(S(40)); await play(...say('INDEPENDENT: EARLIER NOISE DOES NOT MATTER', C.violet));
  await until(S(41)); await play(...fbox(['each noise', ['  variance 1', C.pink]], C.pink));
  await until(S(42)); await play(...say('INDEPENDENT NOISE: VARIANCES ADD', C.green));
  const vlab = [1, 2, 3].map(t => { const tx = T('var ' + t, LS, C.green, true, true); tx.moveTo([xs(t), ry(8) + 0.32, 0]); return tx; });
  for (let t = 1; t <= 3; t++) {
    await until(S(42 + t));
    await play(new M.Indicate(sides[t], { color: C.green }), new M.FadeIn(vlab[t - 1]), ...fbox([`step ${t}`, [`  variance ${t - 1} + 1 = ${t}`, C.green]], C.green));
  }

  // 46-48 formula
  await until(S(46)); await play(...say('A SHORT FORMULA'));
  await until(S(47)); await play(...fbox(['new rim =', '  previous rim', ['  + fresh noise', C.pink]], C.amber));
  await until(S(48)); await play(...fbox(['variance =', ['  number of noise steps', C.green], '  1, 2, 3'], C.green));

  // 49-54 limits
  await until(S(49)); await play(...fbox(['real systems:', '  noise on many measurements', ['  also shrink the shape a little', C.muted], ['  → the end is pure noise', C.pink]], C.muted), ...say('REAL SYSTEMS: NOISE ON MANY MEASUREMENTS', C.muted));
  await until(S(50)); await play(...say('NOISY EXAMPLES TRAIN A DENOISING NETWORK', C.green));
  // one path step that moves back towards 4
  let pick = null;
  for (const p of many) for (let t = 1; t <= 3 && !pick; t++) if (Math.abs(p[t] - 4) < Math.abs(p[t - 1] - 4) - 0.3) pick = [p, t];
  const hl = pick ? new M.Line({ start: [xs(pick[1] - 1), ry(pick[0][pick[1] - 1]), 0], end: [xs(pick[1]), ry(pick[0][pick[1]]), 0], color: C.ink, strokeWidth: 6 }) : new M.Line({ start: [xs(1), ry(5), 0], end: [xs(2), ry(3), 0], color: C.ink, strokeWidth: 6 });
  await until(S(51)); await play(new M.Create(hl), ...say('ONE STEP CAN MOVE BACK TOWARDS 4', C.ink));
  await until(S(52)); await play(new M.LaggedStart([1, 2, 3].map(t => new M.Indicate(sides[t], { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('BUT THE DISTRIBUTION STILL GETS WIDER', C.pink));
  await until(S(53)); await play(new M.FadeOut(hl), ...say('NEXT: A NETWORK MAKES NEW SHAPES', C.green));
  await until(S(54)); await play(...fbox(['fresh noise, step by step', ['original harder to recover', C.pink]], C.pink), ...say('DIFFUSION NOISING', C.pink));
}

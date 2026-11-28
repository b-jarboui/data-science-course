// 18.2.10 Diffusion sampling: learning to remove noise. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c, P ? [0, 4.15, 0] : undefined);
  const LS = P ? 17 : 15;

  // pots row: B1, V1 and later the generated pot
  const PXS = P ? [-2.5, -0.6, 2.0] : [-6.2, -4.95, -3.4];
  const PB = P ? 2.2 : 0.0, UX = P ? 0.2 : 0.16, UY = P ? 0.32 : 0.3;
  function pot(m, x, color) {
    const [b, mi, r] = m, y0 = PB;
    const v = [[x + b * UX, y0], [x + mi * UX, y0 + 2 * UY], [x + r * UX, y0 + 4 * UY], [x - r * UX, y0 + 4 * UY], [x - mi * UX, y0 + 2 * UY], [x - b * UX, y0]];
    const p = new M.Polygon({ vertices: v.map(([a, c]) => [a, c, 0]), color, strokeWidth: 3 }); p.setFill(color, 0.14); return p;
  }
  const lab2 = (a, b, x, c) => {
    const t1 = T(a, P ? 17 : 15, c, true, true); t1.moveTo([x, PB - 0.3, 0]);
    const t2 = T(b, P ? 16 : 14, C.muted, true); t2.moveTo([x, PB - 0.62, 0]);
    return [t1, t2];
  };

  // formula box
  const BOXP = P ? [0, -5.6, 0] : [-4.6, -1.95, 0];
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
    const maxw = P ? FW - 1.2 : 3.7;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0-4 the two originals
  const pB = pot([1, 3, 4], PXS[0], C.cyan), pV = pot([1, 3, 2], PXS[1], C.cyan);
  const lB = lab2('B1', '1, 3, 4', PXS[0], C.cyan), lV = lab2('V1', '1, 3, 2', PXS[1], C.cyan);
  await until(S(0)); await play(new M.Create(pB), new M.Create(pV), ...fbox(['goal: a new shape,', ['not a copy of an original', C.amber]], C.amber), ...say('A NEW SHAPE, NOT COPIED FROM AN ORIGINAL', C.amber));
  await until(S(1)); await play(new M.FadeIn(new M.VGroup(...lB, ...lV)), ...dropBox(), ...say('B1 RIM 4 · V1 RIM 2'));
  await until(S(2)); await play(...say('BOTH: BOTTOM 1, MIDDLE 3'));
  await until(S(3)); await play(...say('LAST LESSON: NOISE IN 3 STEPS', C.pink));
  await until(S(4)); await play(...say('CAN A NETWORK GO BACK: NOISY → CLEAN?', C.green));

  // 5-11 the model distribution and its noising
  const BC = P ? [0, -3.3] : [2.0, -2.2], KB = P ? 0.68 : 0.6, HB = P ? 2.0 : 1.7;
  const bx = r => BC[0] + (r - 3) * KB;
  const bAx = new M.Line({ start: [bx(-2), BC[1], 0], end: [bx(8), BC[1], 0], color: C.muted, strokeWidth: 2 });
  const bTk = [-1, 1, 3, 5, 7].map(r => T(r < 0 ? '−1' : String(r), LS, C.muted, true).moveTo([bx(r), BC[1] - 0.3, 0]));
  const bName = T('rim', LS, C.amber); bName.moveTo([bx(8) - 0.1, BC[1] + 0.32, 0]);
  function bell(v) {
    const s = Math.sqrt(v), pts = [];
    for (let i = 0; i <= 40; i++) { const r = -2 + 10 * i / 40; pts.push([bx(r), BC[1] + HB / s * Math.exp(-((r - 3) ** 2) / (2 * v)), 0]); }
    const p = new M.Polygon({ vertices: [[bx(-2), BC[1], 0], ...pts, [bx(8), BC[1], 0]], color: v === 1 ? C.cyan : C.pink, strokeWidth: 3 });
    p.setFill(v === 1 ? C.cyan : C.pink, 0.15); return p;
  }
  const b1 = bell(1);
  const dots = [4, 2].map(r => { const d = new M.Dot({ point: [bx(r), BC[1], 0], radius: 0.11, color: C.cyan }); d.setFill(C.cyan, 1); return d; });
  await until(S(5)); await play(new M.Create(bAx), new M.FadeIn(new M.VGroup(...bTk, bName)), new M.FadeIn(new M.VGroup(...dots)), ...say('DESCRIBE THE 2 RIMS WITH A BELL'));
  await play(new M.FadeIn(b1));
  const mL = new M.DashedLine({ start: [bx(3), BC[1], 0], end: [bx(3), BC[1] + HB + 0.2, 0], color: C.ink });
  await until(S(6)); await play(new M.Create(mL), ...fbox(['mean      3', 'variance  1']), ...say('MEAN 3 · VARIANCE 1'));
  await until(S(7)); await play(...say('A SIMPLE MODEL OF OUR RIMS'));
  const vT = v => { const t = T('variance ' + v, 16, v === 1 ? C.cyan : C.pink, true, true); t.moveTo([bx(3) + (P ? 1.6 : 1.9), BC[1] + HB * 0.75, 0]); return t; };
  let vNow = vT(1);
  await until(S(8)); await play(new M.FadeIn(vNow), ...say('ADD NOISE: 3 STEPS', C.pink));
  { const n = vT(2); await play(new M.Transform(b1, bell(2)), new M.FadeOut(vNow), new M.FadeIn(n)); vNow = n; }
  await until(S(9)); await play(...fbox(['variance', ['  1 → 2 → 3 → 4', C.pink]], C.pink));
  for (const v of [3, 4]) { const n = vT(v); await play(new M.Transform(b1, bell(v), { runTime: 1 }), new M.FadeOut(vNow, { runTime: 1 }), new M.FadeIn(n, { runTime: 1 })); vNow = n; }
  await until(S(10)); await play(...fbox(['save each pair', ['  (before, after) a step', C.amber]], C.amber), ...say('SAVE RIMS BEFORE AND AFTER EACH STEP', C.amber));
  await until(S(11)); await play(...say('PAIRS = TRAINING EXAMPLES', C.green));

  // 12-15 the denoising network
  const NC = P ? [0.3, -0.1, 0] : [1.0, 0.1, 0];
  const N = net(P ? { layers: [2, 3, 1], center: NC, width: 3.0, height: 1.6, r: 0.32, names: ['noisy rim', 'step'], outName: 'mean' }
                  : { layers: [2, 3, 1], center: NC, width: 2.6, height: 1.5, r: 0.28, names: ['noisy rim', 'step'], outName: 'mean' });
  const W0 = [[0.8, -0.4, 0.6], [0.3, 0.7, -0.5]], W1 = [[0.7], [-0.5], [0.9]];
  let fl = null;
  function pulse(l, col, back = false) {
    const cps = [];
    N.edges[l].forEach((row, i) => row.forEach((ln, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const f = back ? new M.Line({ start: [b[0] - 0.28, b[1], 0], end: [a[0] + 0.28, a[1], 0], color: col, strokeWidth: 5 }) : ln.copy();
      f.setColor(col); f.setStrokeWidth(5); f.setStrokeOpacity(1); cps.push(f);
    }));
    const a = [new M.LaggedStart(cps.map(f => new M.Create(f)), { lagRatio: 0.1, runTime: 0.8 })];
    if (fl) a.push(new M.FadeOut(fl)); fl = new M.VGroup(...cps); return a;
  }
  const dropPulse = () => { const a = fl ? [new M.FadeOut(fl)] : []; fl = null; return a; };
  await until(S(12)); await play(new M.FadeOut(new M.VGroup(b1, bAx, ...bTk, bName, mL, vNow, ...dots)), ...dropBox(), new M.FadeIn(N.group), ...say('A SMALL NEURAL NETWORK'));
  await play(...W0.map((r, i) => r.map((w, j) => N.weight(0, i, j, w))).flat(2), ...W1.map((r, i) => r.map((w, j) => N.weight(1, i, j, w))).flat(2));
  await until(S(13)); await play(...N.value(0, 0, 'x', C.violet), ...N.value(0, 1, 't', C.violet), ...pulse(0, C.cyan), ...say('IN: NOISY RIM + STEP NUMBER', C.violet));
  await until(S(14)); await play(...pulse(1, C.cyan), ...N.value(2, 0, '?', C.amber), ...say('OUT: MEAN OF THE PREVIOUS RIM', C.amber));
  await until(S(15)); await play(...say('A DENOISING NETWORK', C.green));

  // 16-32 training reverse step 1
  const WL = P ? [0.3, -1.4, 0] : [1.0, -1.25, 0];
  let wNow = null;
  const wlab = s => { const t = T(s, 17, C.amber, true, true); t.moveTo(WL); const a = [new M.FadeIn(t)]; if (wNow) a.push(new M.FadeOut(wNow)); wNow = t; return a; };
  await until(S(16)); await play(...N.value(0, 1, '1', C.violet), ...say('TRAIN: REVERSE STEP 1', C.green));
  await until(S(17)); await play(...fbox(['prediction =', ['  3 + a × (noisy − 3)', C.amber]], C.amber), ...say('START AT 3, MOVE TOWARDS THE NOISY RIM'));
  await until(S(18)); await play(...wlab('weight a'), ...say('WEIGHT a = HOW MUCH MOVEMENT WE KEEP', C.amber));
  await until(S(19)); await play(...fbox(['loss = average of', ['  (prediction − previous)²', C.pink]], C.pink));
  await until(S(20)); await play(...wlab('a = 0'), ...N.value(2, 0, '3', C.amber), ...fbox(['a = 0', ['every prediction = 3', C.amber]], C.amber));

  // loss chart
  const LC = P ? { x0: -2.4, x1: 2.8, y0: -4.3, y1: -2.3 } : { x0: 4.0, x1: 6.6, y0: -2.4, y1: 0.4 };
  const lx = i => LC.x0 + i * (LC.x1 - LC.x0) / 5, ly = v => LC.y0 + (v - 0.4) / 0.6 * (LC.y1 - LC.y0);
  const lAxY = new M.Line({ start: [LC.x0, LC.y0, 0], end: [LC.x0, LC.y1 + 0.1, 0], color: C.muted, strokeWidth: 2 });
  const lAxX = new M.Line({ start: [LC.x0, LC.y0, 0], end: [LC.x1 + 0.1, LC.y0, 0], color: C.muted, strokeWidth: 2 });
  const lTit = T('loss', LS, C.pink); lTit.moveTo([LC.x0 + 0.3, LC.y1 + 0.3, 0]);
  const lT1 = T('1', LS, C.muted, true); lT1.moveTo([LC.x0 - 0.25, ly(1), 0]);
  const lT5 = T('0.5', LS, C.muted, true); lT5.moveTo([LC.x0 - 0.38, ly(0.5), 0]);
  const LOSS = [1, 0.625, 0.53125, 0.5078125, 0.501953125, 0.50048828125];
  const lp = LOSS.map((v, i) => { const d = new M.Dot({ point: [lx(i), ly(v), 0], radius: 0.08, color: C.pink }); d.setFill(C.pink, 1); return d; });
  const ls = LOSS.slice(1).map((v, i) => new M.Line({ start: [lx(i), ly(LOSS[i]), 0], end: [lx(i + 1), ly(v), 0], color: C.pink, strokeWidth: 3 }));
  await until(S(21)); await play(new M.FadeIn(new M.VGroup(lAxY, lAxX, lTit, lT1, lT5)), new M.FadeIn(lp[0]), ...fbox(['a = 0', ['loss = 1', C.pink]], C.pink), ...say('START LOSS = 1', C.pink));
  await until(S(22)); await play(...fbox(['learning rate', ['  0.125', C.green]], C.green));

  const STEPS = [
    { s: 23, slope: '−2', ch: '+0.25', a: '0.25', loss: '0.625 ≈ 0.63', calc: '−0.125 × (−2)' },
    { s: 26, slope: '−1', ch: '+0.125', a: '0.375', loss: '0.53125 ≈ 0.53', calc: '−0.125 × (−1)' },
    { s: 29, slope: '−0.5', ch: '+0.0625', a: '0.4375', loss: '0.5078 ≈ 0.51', calc: '−0.125 × (−0.5)' },
  ];
  for (let k = 0; k < 3; k++) {
    const st = STEPS[k];
    await until(S(st.s)); await play(...fbox([`training step ${k + 1}`, [`  gradient ${st.slope}`, C.pink]], C.pink), ...say(`STEP ${k + 1}: GRADIENT ${st.slope}`, C.pink));
    await until(S(st.s + 1)); await play(...pulse(1, C.amber, true), ...fbox([`change = ${st.calc}`, [`       = ${st.ch}`, C.amber]], C.amber), ...say('THE GRADIENT GOES BACKWARDS', C.amber));
    await play(...pulse(0, C.amber, true), ...wlab('a = ' + st.a));
    await until(S(st.s + 2)); await play(new M.Create(ls[k]), new M.FadeIn(lp[k + 1]), ...fbox([`a = ${st.a}`, [`loss = ${st.loss}`, C.pink]], C.pink), ...say(`LOSS FALLS TO ABOUT ${st.loss.split('≈ ')[1]}`, C.pink));
  }
  const lim = new M.DashedLine({ start: [LC.x0, ly(0.5), 0], end: [LC.x1 + 0.1, ly(0.5), 0], color: C.green });
  await until(S(32)); await play(...dropPulse(), new M.Create(lim), new M.Create(ls[3]), new M.FadeIn(lp[4]), ...wlab('a → 0.5'), ...fbox(['a     → 0.5', ['loss  → 0.5', C.green]], C.green), ...say('KEEP LEARNING: BOTH APPROACH 0.5', C.green));
  await play(new M.Create(ls[4]), new M.FadeIn(lp[5]));

  // 33-36 one weight per reverse step
  await until(S(33)); await play(...say('ONE WEIGHT FOR EACH REVERSE STEP', C.violet));
  await until(S(34)); await play(...N.value(0, 1, '3', C.violet), ...wlab('a = 3/4'), ...fbox([['reverse step 3   a = 3/4', C.amber]], C.amber));
  await until(S(35)); await play(...N.value(0, 1, '2', C.violet), ...wlab('a = 2/3'), ...fbox(['reverse step 3   a = 3/4', ['reverse step 2   a = 2/3', C.amber]], C.amber));
  await until(S(36)); await play(...N.value(0, 1, '1', C.violet), ...wlab('a = 1/2'), ...fbox(['reverse step 3   a = 3/4', 'reverse step 2   a = 2/3', ['reverse step 1   a = 1/2', C.amber]], C.amber));

  // 37-49 generation: three reverse steps on three rows
  const RX = P ? (r => -2.45 + (r - 2.9) * 1.3) : (r => -1.3 + (r - 2.9) * 1.6);
  const ROWS = P ? [0.3, -1.25, -2.8] : [0.7, -0.5, -1.7];
  const AXY = P ? -3.7 : -2.4;
  const rowL = [3, 2, 1].map((s, i) => new M.Line({ start: [RX(2.7), ROWS[i], 0], end: [RX(7.6), ROWS[i], 0], color: C.grid, strokeWidth: 2 }));
  const rowT = [3, 2, 1].map((s, i) => { const t = T('step ' + s, LS, C.muted); t.moveTo([RX(2.7) - 0.25 - t.getWidth() / 2, ROWS[i], 0]); return t; });
  const gAx = new M.Line({ start: [RX(2.7), AXY, 0], end: [RX(7.6), AXY, 0], color: C.muted, strokeWidth: 2 });
  const gTk = [3, 4, 5, 6, 7].map(r => new M.VGroup(new M.Line({ start: [RX(r), AXY - 0.07, 0], end: [RX(r), AXY + 0.07, 0], color: C.muted }), T(String(r), LS, C.muted, true).moveTo([RX(r), AXY - 0.3, 0])));
  const gName = T('rim', LS, C.amber); gName.moveTo([RX(7.6) - 0.1, AXY + 0.3, 0]);
  const mean3 = new M.DashedLine({ start: [RX(3), ROWS[0] + 0.35, 0], end: [RX(3), AXY, 0], color: C.muted });
  await until(S(37));
  await play(...dropPulse(), new M.FadeOut(new M.VGroup(N.group, wNow, lAxY, lAxX, lTit, lT1, lT5, lim, ...lp, ...ls)), ...N.value(0, 0, ''), ...N.value(0, 1, ''), ...N.value(2, 0, ''), ...dropBox(),
    ...say('GENERATE: START FROM RANDOM NOISE', C.pink));
  wNow = null;
  await play(new M.FadeIn(new M.VGroup(...rowL, ...rowT, gAx, ...gTk, gName, mean3)));
  const lbl = (s, x, y, c) => { const t = T(s, P ? 17 : 15, c, true, true); t.moveTo([x, y, 0]); return t; };
  const wDot = (r, y) => { const d = new M.Dot({ point: [RX(r), y, 0], radius: 0.1, color: C.ink }); d.setFill(C.ink, 1); return d; };
  const aDot = (r, y) => { const d = new M.Dot({ point: [RX(r), y, 0], radius: 0.1, color: C.amber }); d.setFill(C.bg, 1); return d; };
  let gp = pot([1, 3, 7], PXS[2], C.amber), gl = lab2('new', '1, 3, 7', PXS[2], C.amber);
  const d7 = wDot(7, ROWS[0]), t7 = lbl('7', RX(7) + 0.25, ROWS[0] + 0.42, C.ink);
  await until(S(38)); await play(new M.FadeIn(d7), new M.Flash(d7, { color: C.ink }), new M.FadeIn(t7), new M.FadeIn(gp), new M.FadeIn(new M.VGroup(...gl)), ...fbox(['start: rim = 7', ['not an original shape', C.muted]], C.pink), ...say('OUR RANDOM START: 7', C.pink));
  const R = [
    { row: 0, from: 7, mean: 6, to: 4.5, f: '3/4', dist: '4', keep: '3', noise: '−1.5' },
    { row: 1, from: 4.5, mean: 4, to: 3.5, f: '2/3', dist: '1.5', keep: '1', noise: '−0.5' },
    { row: 2, from: 3.5, mean: 3.25, to: 3.75, f: '1/2', dist: '0.5', keep: '0.25', noise: '+0.5' },
  ];
  const keepObjs = [d7, t7];
  async function predict(st) {
    const y = ROWS[st.row];
    const md = aDot(st.mean, y), mt = lbl(String(st.mean), RX(st.mean) - 0.2, y - 0.4, C.amber);
    const ar = new M.Arrow({ start: [RX(st.from), y + 0.15, 0], end: [RX(st.mean), y + 0.15, 0], color: C.amber, strokeWidth: 3, buff: 0 });
    keepObjs.push(md, mt, ar);
    return [new M.FadeIn(md), new M.FadeIn(mt), new M.Create(ar)];
  }
  async function addNoise(st) {
    const y = ROWS[st.row];
    const nd = wDot(st.to, y), nt = lbl(String(st.to), RX(st.to) + 0.25, y + 0.42, C.ink);
    const ar = new M.Arrow({ start: [RX(st.mean), y - 0.15, 0], end: [RX(st.to), y - 0.15, 0], color: C.pink, strokeWidth: 3, buff: 0 });
    keepObjs.push(nd, nt, ar);
    const ngp = pot([1, 3, st.to], PXS[2], C.amber), ngl = lab2('new', `1, 3, ${st.to}`, PXS[2], C.amber);
    const anim = [new M.Create(ar), new M.FadeIn(nd), new M.Flash(nd, { color: C.pink }), new M.FadeIn(nt), new M.Transform(gp, ngp), new M.FadeOut(new M.VGroup(...gl)), new M.FadeIn(new M.VGroup(...ngl))];
    gl = ngl;
    if (st.row < 2) { const nx = wDot(st.to, ROWS[st.row + 1]); keepObjs.push(nx); anim.push(new M.TransformFromCopy(nd, nx)); }
    return anim;
  }
  // reverse step 3
  const br = new M.Line({ start: [RX(3), ROWS[0] - 0.32, 0], end: [RX(7), ROWS[0] - 0.32, 0], color: C.violet, strokeWidth: 4 });
  await until(S(39)); await play(new M.Create(br), ...fbox(['reverse step 3', ['  7 − 3 = 4 units above', C.violet]], C.violet), ...say('7 IS 4 UNITS ABOVE THE MEAN 3', C.violet));
  await until(S(40)); await play(new M.FadeOut(br), ...(await predict(R[0])), ...fbox(['3/4 × 4 = 3', ['3 + 3 = 6', C.amber]], C.amber), ...say('PREDICTED MEAN = 6', C.amber));
  await until(S(41)); await play(...say('MANY PAST RIMS POSSIBLE → ADD FRESH NOISE', C.pink));
  await until(S(42)); await play(...(await addNoise(R[0])), ...fbox(['reverse noise −1.5', ['6 − 1.5 = 4.5', C.amber]], C.pink));
  // reverse step 2
  await until(S(43)); await play(...fbox(['reverse step 2', ['  4.5 − 3 = 1.5 above', C.violet]], C.violet), ...say('1.5 UNITS ABOVE THE MEAN', C.violet));
  await until(S(44)); await play(...(await predict(R[1])), ...fbox(['2/3 × 1.5 = 1', ['3 + 1 = 4', C.amber]], C.amber), ...say('PREDICTED MEAN = 4', C.amber));
  await until(S(45)); await play(...(await addNoise(R[1])), ...fbox(['reverse noise −0.5', ['4 − 0.5 = 3.5', C.amber]], C.pink));
  // reverse step 1
  await until(S(46)); await play(...(await predict(R[2])), ...fbox(['1/2 × 0.5 = 0.25', ['3 + 0.25 = 3.25', C.amber]], C.amber), ...say('REVERSE STEP 1: MEAN 3.25', C.amber));
  await until(S(47)); await play(...(await addNoise(R[2])), ...fbox(['reverse noise +0.5', ['3.25 + 0.5 = 3.75', C.amber]], C.pink));
  await until(S(48)); await play(new M.Indicate(gp, { color: C.amber }), ...fbox([['new shape: 1, 3, 3.75', C.amber]], C.amber), ...say('A NEW POT: 1, 3, 3.75', C.amber));
  await until(S(49)); await play(new M.Indicate(pB, { color: C.cyan }), new M.Indicate(pV, { color: C.cyan }), ...say('NOT IN THE ORIGINAL COLLECTION', C.green));

  // 50-54 formula and limits
  await until(S(50)); await play(...fbox(['new rim =', '  predicted mean', ['  + fresh reverse noise', C.pink]], C.amber));
  await until(S(51)); await play(...fbox(['reverse noise: a bell', '  centred at 0', ['  in our example: variance', C.pink], ['  = 3/4, 2/3, 1/2', C.pink]], C.pink));
  await until(S(52)); await play(...say('REPEAT LEARNED REVERSE STEPS → NEW EXAMPLES', C.green));
  await until(S(53)); await play(...say('NO MEMORY OF THE ORIGINAL NOISE', C.pink), ...fbox(['a possible clean shape,', ['not a copy of an original', C.muted]], C.pink));
  await until(S(54)); await play(new M.Indicate(gp, { color: C.amber }), ...fbox(['random noise', '  + learned predictions', ['  + fresh random choices', C.pink]], C.green), ...say('DIFFUSION SAMPLING', C.green));
}

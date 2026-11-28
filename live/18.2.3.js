// 18.2.3 Variational autoencoders: rebuild a bowl through a hidden bell curve.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const PILL = P ? [0, 4.15, 0] : [0, 1.85, 0];
  let BOXP = P ? [0, -5.85, 0] : [3.6, -2.1, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const LS = P ? 17 : 15;
  const fade = o => new M.FadeIn(o, { runTime: 0.4 });
  const out = o => new M.FadeOut(o, { runTime: 0.4 });
  const mark = (o, c = C.amber) => new M.Indicate(o, { color: c, runTime: 0.6 });
  const txt = (s, size, color, x, y, mono = false) => T(s, size, color, mono).moveTo([x, y, 0]);
  const cascade = (a, rt = 0.9) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });
  const flow = (N, l, col = C.amber) => new M.LaggedStart(N.edges[l].flat().map(e => new M.Indicate(e, { color: col, runTime: 0.5 })), { lagRatio: 0.15, runTime: 0.9 });
  const swap = (o, n) => [out(o), fade(n)];

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 20 : 19, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.39, height = rows.length * lh + 0.26;
    const [x, y] = BOXP;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 1.2 : 4.6;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  function potLines(m, bx, by, u, color, width = 3) {
    const R = m.map((v, k) => [bx + v * u, by + 2 * k * u, 0]);
    const Lp = m.map((v, k) => [bx - v * u, by + 2 * k * u, 0]);
    const ln = (a, b) => new M.Line({ start: a, end: b, color, strokeWidth: width });
    return [ln(Lp[0], R[0]), ln(R[0], R[1]), ln(R[1], R[2]), ln(Lp[2], R[2]), ln(Lp[0], Lp[1]), ln(Lp[1], Lp[2])];
  }
  const morph = (lines, m, bx, by, u, color = C.amber) => potLines(m, bx, by, u, color).map((l, i) => new M.Transform(lines[i], l, { runTime: 0.8 }));

  // ---- layout
  const PU = P ? 0.2 : 0.15;
  const OP = P ? [-2.75, 0.4] : [-6.1, -0.6];          // original bowl B2
  const RP = P ? [2.5, -4.45] : [5.3, -0.6];          // rebuilt bowl
  const ENC = net({ layers: [3, 2], center: P ? [0.7, 1.0, 0] : [-3.9, 0.1, 0], width: P ? 1.9 : 1.6, height: P ? 1.6 : 1.5, r: P ? 0.3 : 0.25 });
  const DEC = net({ layers: [1, 1, 3], center: P ? [-0.85, -3.75, 0] : [2.4, 0.1, 0], width: P ? 2.3 : 2.4, height: P ? 1.8 : 1.8, r: P ? 0.4 : 0.4 });
  const encLab = P ? txt('ENCODER', 17, C.violet, 2.95, 1.0, true) : txt('ENCODER', 16, C.violet, -3.9, 1.35, true);
  const decLab = P ? txt('DECODER', 17, C.amber, -3.2, -3.75, true) : txt('DECODER', 16, C.amber, 3.6, 1.62, true);

  // hidden area: bell curves over a z axis
  const BY = P ? -1.95 : -0.6, BH = P ? 1.25 : 1.2;
  const zx = z => P ? -0.6 + z * 0.8 : -1.3 + z * 0.55;
  const ZMIN = P ? -2.6 : -2.6, ZMAX = P ? 4.2 : 3.6;
  const axis = new M.Line({ start: [zx(ZMIN), BY, 0], end: [zx(ZMAX), BY, 0], color: C.muted, strokeWidth: 2 });
  const axTicks = [0, 1, 2].flatMap(v => [new M.Line({ start: [zx(v), BY - 0.07, 0], end: [zx(v), BY + 0.07, 0], color: C.muted, strokeWidth: 2 }),
    txt(String(v), LS, C.muted, zx(v), BY - 0.28, true)]);
  function bell(m, color, width = 3) {
    const n = 36, a = Math.max(ZMIN, m - 2.6), b = Math.min(ZMAX, m + 2.6), pts = [];
    for (let i = 0; i <= n; i++) { const z = a + (b - a) * i / n; pts.push([zx(z), BY + BH * Math.exp(-(z - m) * (z - m) / 2), 0]); }
    return new M.VGroup(...pts.slice(1).map((p, i) => new M.Line({ start: pts[i], end: p, color, strokeWidth: width })));
  }
  const meanMark = m => new M.VGroup(new M.DashedLine({ start: [zx(m), BY, 0], end: [zx(m), BY + BH + 0.08, 0], color: C.violet }),
    txt(`m = ${m}`, LS, C.violet, zx(m), BY + BH + 0.3, true));

  // loss chart
  const CH = P ? { x0: -3.0, x1: 2.2, y0: -6.5, y1: -5.3 } : { x0: -6.4, x1: -2.2, y0: -2.9, y1: -1.5 };
  const sx = k => CH.x0 + k * (CH.x1 - CH.x0) / 6, sy = v => CH.y0 + v * (CH.y1 - CH.y0) / 2.5;
  const chartAxes = new M.VGroup(
    new M.Line({ start: [CH.x0, CH.y0, 0], end: [CH.x1 + 0.1, CH.y0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [CH.x0, CH.y0, 0], end: [CH.x0, CH.y1 + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    txt('loss', LS, C.muted, CH.x0 - 0.45, CH.y1 + 0.15, false), txt('2.5', LS, C.muted, CH.x0 - 0.4, sy(2.5) - 0.3, true),
    txt('training step', LS, C.muted, (CH.x0 + CH.x1) / 2, CH.y0 - 0.3));
  const SER = {
    R: { c: C.cyan, v: [2.5, 1.625, 1.28125, 1.1328125, 1.064453, 1.032227, 1.016113], pts: [] },
    K: { c: C.violet, v: [0, 0.125, 0.28125, 0.3828125, 0.439453, 0.469238, 0.484497], pts: [] },
    T: { c: C.amber, v: [2.5, 1.75, 1.5625, 1.515625, 1.503906, 1.501465, 1.500610], pts: [] },
  };
  function addPt(key, k) {
    const s = SER[key], p = [sx(k), sy(s.v[k]), 0];
    const parts = [new M.Dot({ point: p, radius: 0.06, color: s.c })];
    if (k > 0) parts.push(new M.Line({ start: [sx(k - 1), sy(s.v[k - 1]), 0], end: p, color: s.c, strokeWidth: 2.5 }));
    s.pts.push(...parts);
    return parts.map(o => new M.Create(o, { runTime: 0.5 }));
  }

  // ---- 0-2 the question
  const orig = potLines([2, 3, 5], OP[0], OP[1], PU, C.cyan);
  const DATA4 = [[1, 3, 4], [2, 3, 5], [1, 3, 2], [2, 4, 1]];
  const fp = k => P ? [(k % 2 ? 1.8 : -1.8), (k < 2 ? 0.6 : -3.2)] : [(k - 1.5) * 3.0, -1.6];
  const four = DATA4.map((m, k) => potLines(m, fp(k)[0], fp(k)[1], P ? 0.36 : 0.3, C.cyan));
  const fourN = ['B1', 'B2', 'V1', 'V2'].map((n, k) => txt(n, LS, C.muted, fp(k)[0], fp(k)[1] - 0.35));
  await until(S(0));
  await play(cascade(four.map(ls => new M.LaggedStart(ls.map(l => new M.Create(l)), { lagRatio: 0.1 })), 1.6), ...fourN.map(fade),
    ...say('STUDY THE SHAPES, MAKE NEW ONES'));

  await until(S(1));
  await play(out(new M.VGroup(...four.flat(), ...fourN)), ...orig.map(l => new M.Create(l)), ...fbox([['bowl B2:  2,  3,  5', C.cyan]]), ...say('BOWL B2:  2,  3,  5'));

  await until(S(2));
  await play(...say('LATENT VARIABLE → REBUILD THE BOWL?', C.violet));

  // ---- 3-11 encoder and the hidden bell
  await until(S(3));
  await play(cascade([...ENC.nodes.flat(), ...DEC.nodes.flat()].map(fade), 0.9),
    cascade([...ENC.edges.flat(2), ...DEC.edges.flat(2)].map(e => new M.Create(e, { runTime: 0.3 })), 0.9), ...say('TWO SMALL NETWORKS'));

  await until(S(4));
  await play(...ENC.value(0, 0, '2', C.cyan), ...ENC.value(0, 1, '3', C.cyan), ...ENC.value(0, 2, '5', C.cyan), ...say('NETWORK 1 GETS  2, 3, 5'));

  await until(S(5));
  await play(flow(ENC, 0, C.violet), ...ENC.value(1, 0, 'm', C.violet), ...ENC.value(1, 1, 's', C.violet),
    ...say('OUT: A RANGE OF LATENT VALUES', C.violet));

  await until(S(6));
  await play(fade(encLab), ...say('NETWORK 1 = THE ENCODER', C.violet));

  let encBell = bell(0, C.violet);
  await until(S(7));
  await play(new M.Create(axis), ...axTicks.map(fade), new M.Create(encBell), ...say('A BELL SHAPE: MOST NEAR THE CENTRE', C.violet));

  let mMark = meanMark(0);
  await until(S(8));
  await play(fade(mMark), ...say('MEAN m = WHERE THE CENTRE IS', C.violet));

  const sdY = BY + BH * Math.exp(-0.5);
  const sdBar = new M.VGroup(new M.Line({ start: [zx(0), sdY, 0], end: [zx(1), sdY, 0], color: C.green, strokeWidth: 3 }),
    txt('s = 1', LS, C.green, zx(0.5) + 0.05, sdY + 0.22, true));
  await until(S(9));
  await play(fade(sdBar), ...say('STANDARD DEVIATION s = HOW SPREAD OUT', C.green));

  const refBell = bell(0, C.muted, 5);
  await until(S(10));
  await play(new M.Create(refBell), ...fbox([['reference (grey):', C.muted], 'mean 0, s = 1']), ...say('REFERENCE BELL: MEAN 0, s = 1', C.muted));

  await until(S(11));
  await play(mark(refBell, C.ink), ...say("KEEP THE ENCODER'S BELL CLOSE TO IT", C.violet));

  // ---- 12-16 sample, decoder
  const zDot = new M.Dot({ point: [zx(0.5), BY, 0], radius: 0.11, color: C.violet });
  await until(S(12));
  await play(out(sdBar), fade(zDot), new M.Flash(zDot, { color: C.violet }), ...fbox([['sample: z = 0.5', C.violet]], C.violet),
    ...say('SAMPLE A LATENT VALUE AT RANDOM', C.violet));

  const inPos = DEC.pos(0, 0);
  await until(S(13));
  await play(new M.Transform(zDot, new M.Dot({ point: inPos, radius: 0.11, color: C.violet }), { runTime: 0.8 }), ...say('NETWORK 2: LATENT VALUE → 3 MEASUREMENTS'));
  await play(out(zDot), ...DEC.value(0, 0, '0.5', C.violet), flow(DEC, 0, C.violet), ...DEC.value(1, 0, '0.5', C.violet));

  await until(S(14));
  await play(fade(decLab), ...say('NETWORK 2 = THE DECODER', C.amber));

  await until(S(15));
  await play(...DEC.weight(1, 0, 0, 0), ...DEC.weight(1, 0, 1, 0), flow(DEC, 1), ...DEC.value(2, 0, '2', C.amber), ...DEC.value(2, 1, '3', C.amber),
    ...say('BOTTOM 2, MIDDLE 3: KEPT', C.amber));

  const rebuilt = potLines([2, 3, 3.5], RP[0], RP[1], PU, C.amber);
  await until(S(16));
  await play(...DEC.weight(1, 0, 2, 1), ...DEC.value(2, 2, '3.5', C.amber), ...rebuilt.map(l => new M.Create(l)),
    ...fbox([['rim = 3 + z', C.amber], '    = 3 + 0.5 = 3.5']), ...say('RIM = 3 + LATENT VALUE', C.amber));

  // ---- 17-26 the two losses at the start
  await until(S(17));
  await play(mark(mMark, C.violet), ...DEC.value(0, 0, '0', C.violet), ...DEC.value(1, 0, '0', C.violet),
    ...fbox([['start: m = 0, s = 1', C.violet], ['decoder input = mean 0', C.violet]], C.violet), ...say('START: MEAN 0, SPREAD 1', C.violet));

  await until(S(18));
  await play(...morph(rebuilt, [2, 3, 3], RP[0], RP[1], PU), ...DEC.value(2, 2, '3', C.amber), ...fbox([['mean rim = 3 + 0 = 3', C.amber], ['single results vary', C.muted]], C.amber),
    ...say('MEAN REBUILT RIM = 3  (RESULTS VARY)', C.amber));

  const ghost = potLines([2, 3, 5], RP[0], RP[1], PU, C.cyan, 1.5);
  const errSeg = new M.Line({ start: [RP[0] + 3 * PU, RP[1] + 4 * PU, 0], end: [RP[0] + 5 * PU, RP[1] + 4 * PU, 0], color: C.pink, strokeWidth: 6 });
  await until(S(19));
  await play(...ghost.map(fade), new M.Create(errSeg), ...fbox([['error = 5 − rebuilt rim', C.pink], '  e.g. 5 − 3 = 2']), ...say('ERROR = ORIGINAL RIM − REBUILT RIM', C.pink));

  await until(S(20));
  await play(...fbox([['error = 5 − rebuilt rim', C.pink], 'squared: 2 × 2 = 4']), ...say('SQUARE IT: ERROR × ERROR', C.pink));

  await until(S(21));
  await play(...fbox([['reconstruction loss R', C.cyan], '= ½ × average squared error']), ...say('RECONSTRUCTION LOSS: HOW POORLY WE REBUILD'));

  await until(S(22));
  await play(mark(encBell, C.violet), ...say('AVERAGE OVER ALL SAMPLED VALUES', C.violet));

  await until(S(23));
  if (P) BOXP = [0, 2.95, 0];
  await play(new M.Create(chartAxes), ...addPt('R', 0), ...fbox([['R = ((2 − m)² + 1) ÷ 2', C.cyan], '  = (4 + 1) ÷ 2 = 2.5']), ...say('START: R = 2.5'));

  await until(S(24));
  await play(mark(encBell, C.violet), mark(refBell, C.ink), ...say('KL DIVERGENCE: ENCODER BELL vs REFERENCE', C.violet));

  await until(S(25));
  await play(...addPt('K', 0), ...fbox([['KL penalty K = m² ÷ 2', C.violet], ['(same spread: ½ × centre gap²)', C.muted], '  = 0 ÷ 2 = 0']), ...say('KL PENALTY = 0 (SAME BELLS)', C.violet));

  await until(S(26));
  await play(...addPt('T', 0), ...fbox([['total = R + K', C.amber], '      = 2.5 + 0 = 2.5']), ...say('TOTAL LOSS = 2.5', C.amber));

  await until(S(27));
  await play(mark(encLab, C.violet), mark(decLab), ...say('VARIATIONAL AUTOENCODER  =  VAE', C.green));

  // ---- 28-44 training the mean
  await until(S(28));
  await play(out(new M.VGroup(...ghost, errSeg)), mark(ENC.nodes[1][0], C.violet), ...say('TRAIN: CHANGE ONLY THE MEAN m', C.violet));

  await until(S(29));
  await play(cascade(DEC.nodes.flat().map(n => mark(n, C.muted)), 0.8), mark(ENC.nodes[1][1], C.muted), ...say('DECODER AND s STAY FIXED', C.muted));

  await until(S(30));
  await play(...fbox([['gradient:', C.amber], 'how fast the total changes', 'when m is nudged up']), ...say('GRADIENT', C.amber));

  await until(S(31));
  await play(...fbox([['learning rate = 0.25', C.green], 'sets the step size']), ...say('LEARNING RATE 0.25', C.green));

  // learning signal: gold, right to left, through the decoder back into the encoder's mean
  const backPulse = () => new M.LaggedStart([...DEC.edges[1][0].slice().reverse(), DEC.edges[0][0][0], ...ENC.edges[0].map(e => e[0]).reverse(), ENC.nodes[1][0]]
    .map(o => new M.Indicate(o, { color: C.amber, runTime: 0.45 })), { lagRatio: 0.3, runTime: 1.2 });

  let encBellNow = encBell;
  function setMean(m, rim) {
    const nb = bell(m, C.violet), nm = meanMark(m);
    const a = [...swap(encBellNow, nb), ...swap(mMark, nm), ...morph(rebuilt, [2, 3, rim], RP[0], RP[1], PU),
      ...DEC.value(0, 0, String(m), C.violet), ...DEC.value(1, 0, String(m), C.violet), ...DEC.value(2, 2, String(rim), C.amber)];
    encBellNow = nb; mMark = nm; return a;
  }
  const step = (n, old, slope, ch) => [[`step ${n}: m = ${old}`, C.violet], [`gradient = ${slope}`, C.amber], [`change = 0.25 × ${slope.replace('−', '')} = +${ch}`, C.green]];

  await until(S(32));
  await play(...fbox(step(1, '0', '−2', '0.5').slice(0, 2), C.amber), ...say('STEP 1: GRADIENT = −2', C.amber));

  await until(S(33));
  await play(backPulse(), ...fbox(step(1, '0', '−2', '0.5'), C.amber), ...say('AGAINST THE GRADIENT: m UP BY 0.5', C.green));

  await until(S(34));
  await play(...setMean(0.5, 3.5), ...fbox([['m = 0.5', C.violet], ['mean rim = 3.5', C.amber]], C.violet), ...say('m = 0.5  →  MEAN RIM 3.5', C.violet));

  await until(S(35));
  await play(...addPt('R', 1), ...addPt('K', 1), ...fbox([['R = 1.625', C.cyan], ['K = 0.125', C.violet]]), ...say('REBUILD LOSS DOWN, KL PENALTY UP'));

  await until(S(36));
  await play(...addPt('T', 1), ...fbox([['R = 1.625', C.cyan], ['K = 0.125', C.violet], ['total = 1.75', C.amber]]), ...say('TOTAL = 1.75', C.amber));

  await until(S(37));
  await play(backPulse(), ...fbox(step(2, '0.5', '−1', '0.25'), C.amber), ...say('STEP 2: GRADIENT −1  →  m UP 0.25', C.amber));

  await until(S(38));
  await play(...setMean(0.75, 3.75), ...fbox([['m = 0.75', C.violet], ['mean rim = 3.75', C.amber]], C.violet), ...say('m = 0.75  →  MEAN RIM 3.75', C.violet));

  await until(S(39));
  await play(...addPt('R', 2), ...addPt('K', 2), ...fbox([['R = 1.28125', C.cyan], ['K = 0.28125', C.violet]]), ...say('R ≈ 1.28   ·   K ≈ 0.28'));

  await until(S(40));
  await play(...addPt('T', 2), ...fbox([['R = 1.28125', C.cyan], ['K = 0.28125', C.violet], ['total = 1.5625', C.amber]]), ...say('TOTAL ≈ 1.56', C.amber));

  await until(S(41));
  await play(backPulse(), ...fbox(step(3, '0.75', '−0.5', '0.125'), C.amber), ...say('STEP 3: GRADIENT −0.5  →  m UP 0.125', C.amber));

  await until(S(42));
  await play(...setMean(0.875, 3.875), ...fbox([['m = 0.875', C.violet], ['mean rim = 3.875', C.amber]], C.violet), ...say('m = 0.875  →  MEAN RIM 3.875', C.violet));

  await until(S(43));
  await play(...addPt('R', 3), ...addPt('K', 3), ...fbox([['R = 1.1328125', C.cyan], ['K = 0.3828125', C.violet]]), ...say('R ≈ 1.13   ·   K ≈ 0.38'));

  await until(S(44));
  await play(...addPt('T', 3), ...fbox([['R = 1.1328125', C.cyan], ['K = 0.3828125', C.violet], ['total = 1.515625', C.amber]]), ...say('TOTAL ≈ 1.52', C.amber));

  // ---- 45-46 keep going
  await until(S(45));
  await play(cascade([4, 5, 6].flatMap(k => [...addPt('R', k), ...addPt('K', k), ...addPt('T', k)]), 2.2), backPulse(),
    ...fbox([['m → 1', C.violet], ['total → 1.5', C.amber]], C.amber), ...say('KEEP LEARNING: m → 1, TOTAL → 1.5', C.amber));
  await play(...setMean(1, 4));

  const legend = [['total', 'T', 1.5], ['rebuild', 'R', 1.0], ['KL', 'K', 0.5]].map(([s, k, v]) => txt(s, LS, SER[k].c, sx(6) + 0.5, sy(v)));
  await until(S(46));
  await play(...legend.map(fade), ...fbox([['R → 1', C.cyan], ['K → 0.5', C.violet], ['total → 1.5', C.amber]]), ...say('REBUILD LOSS → 1,  KL PENALTY → 0.5'));

  // ---- 47-50 the formula and the trade-off
  await until(S(47));
  await play(...say('TWO GOALS IN ONE FORMULA'));

  await until(S(48));
  await play(...fbox([['total loss =', C.amber], ['  reconstruction loss', C.cyan], ['  + KL penalty', C.violet]], C.amber), ...say('TOTAL = RECONSTRUCTION + KL PENALTY', C.amber));

  const far = bell(2, C.pink, 2);
  const farLab = txt('m = 2', LS, C.pink, zx(2) + (P ? 1.15 : 0.5), BY + BH * (P ? 0.7 : 1.12), true);
  await until(S(49));
  await play(new M.Create(far), fade(farLab), ...fbox([['no KL penalty:', C.pink], 'best m = 2'], C.pink), ...say('WITHOUT THE KL PENALTY: m = 2', C.pink));

  await until(S(50));
  await play(...morph(rebuilt, [2, 3, 5], RP[0], RP[1], PU, C.pink), mark(refBell, C.ink),
    ...DEC.value(0, 0, '2', C.pink), ...DEC.value(1, 0, '2', C.pink), ...DEC.value(2, 2, '5', C.pink),
    ...fbox([['mean rim = 5 = original', C.cyan], ['but far from reference', C.pink]], C.pink), ...say('PERFECT REBUILD, BELL FAR FROM REFERENCE', C.pink));

  // ---- 51-54 generate without an original
  await until(S(51));
  await play(out(new M.VGroup(far, farLab, ...orig)), ...morph(rebuilt, [2, 3, 4], RP[0], RP[1], PU), mark(refBell, C.green),
    ...DEC.value(0, 0, '1', C.violet), ...DEC.value(1, 0, '1', C.violet), ...DEC.value(2, 2, '4', C.amber),
    ...fbox([]), ...say('CLOSE TO REFERENCE → NO ORIGINAL NEEDED', C.green));

  const g = new M.Dot({ point: [zx(0.5), BY, 0], radius: 0.11, color: C.violet });
  await until(S(52));
  await play(fade(g), new M.Flash(g, { color: C.violet }), ...say('PICK 0.5 FROM THE REFERENCE', C.violet));
  await play(new M.Transform(g, new M.Dot({ point: inPos, radius: 0.11, color: C.violet }), { runTime: 0.8 }));
  await play(out(g), ...DEC.value(0, 0, '0.5', C.violet), flow(DEC, 0, C.violet), ...DEC.value(1, 0, '0.5', C.violet));

  await until(S(53));
  await play(flow(DEC, 1), ...DEC.value(2, 2, '3.5', C.amber), ...morph(rebuilt, [2, 3, 3.5], RP[0], RP[1], PU),
    ...fbox([['new shape:', C.amber], ['2,  3,  3.5', C.amber]], C.amber), ...say('NEW SHAPE:  2,  3,  3.5', C.amber));

  await until(S(54));
  await play(...say('VAE: REBUILDS, AND ORGANISES LATENT VALUES', C.green));
}

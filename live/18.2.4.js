// 18.2.4 Reparameterization: separate noise e, then z = m + s × e.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const PILL = P ? [0, 4.15, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.85, 0] : [4.6, -1.5, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const LS = P ? 17 : 15;
  const fade = o => new M.FadeIn(o, { runTime: 0.4 });
  const out = o => new M.FadeOut(o, { runTime: 0.4 });
  const mark = (o, c = C.amber) => new M.Indicate(o, { color: c, runTime: 0.6 });
  const txt = (s, size, color, x, y, mono = false) => T(s, size, color, mono).moveTo([x, y, 0]);
  const cascade = (a, rt = 0.9) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });
  const flow = (N, l, col = C.amber) => new M.LaggedStart(N.edges[l].flat().map(e => new M.Indicate(e, { color: col, runTime: 0.5 })), { lagRatio: 0.15, runTime: 0.9 });
  const swap = (o, n) => [out(o), fade(n)];
  const fmt = v => v < 0 ? '−' + Math.abs(v) : String(v);

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
    const maxW = P ? FW - 1.2 : 3.8;
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

  // ---- pipeline: bowl → encoder → z (with noise e) → decoder → rebuilt bowl
  const PY = P ? 2.3 : 0.55, PU = P ? 0.2 : 0.14, R0 = P ? 0.32 : 0.3;
  const OP = P ? [-2.85, -0.4] : [-6.35, PY - 0.3];
  const RP = P ? [2.0, -0.4] : [2.75, PY - 0.3];
  const ENC = net({ layers: [3, 2], center: P ? [-2.85, PY, 0] : [-4.25, PY, 0], width: P ? 1.4 : 1.6, height: 1.5, r: R0 });
  const DEC = net({ layers: [1, 1, 3], center: P ? [1.5, PY, 0] : [0.3, PY, 0], width: P ? 2.2 : 2.0, height: 1.5, r: R0 });
  const ZP = P ? [-0.9, PY, 0] : [-2.2, PY, 0], EP = P ? [-0.9, PY - 1.3, 0] : [-2.2, PY - 1.05, 0];
  const zNode = new M.Circle({ radius: R0 + 0.03, color: C.violet, strokeWidth: 3 }); zNode.setFill(C.card, 0.95); zNode.moveTo(ZP);
  const eNode = new M.Circle({ radius: R0, color: C.pink, strokeWidth: 3 }); eNode.setFill(C.card, 0.95); eNode.moveTo(EP);
  const seg = (a, b, color, w = 2.5) => new M.Line({ start: [a[0], a[1], -0.01], end: [b[0], b[1], -0.01], color, strokeWidth: w });
  const mOut = ENC.pos(1, 0), sOut = ENC.pos(1, 1), dIn = DEC.pos(0, 0);
  const eM = seg([mOut[0] + R0, mOut[1]], [ZP[0] - R0, ZP[1]], C.cyan), eS = seg([sOut[0] + R0, sOut[1]], [ZP[0] - R0, ZP[1] - 0.05], C.cyan);
  const eE = seg([EP[0], EP[1] + R0], [ZP[0], ZP[1] - R0], C.pink), eZ = seg([ZP[0] + R0, ZP[1]], [dIn[0] - R0, dIn[1]], C.violet);
  const labY = PY - 1.2;
  const encLab = txt('encoder', LS, C.violet, ENC.pos(0, 0)[0] + (P ? 0.7 : 0.8), labY);
  const decLab = txt('decoder', LS, C.amber, DEC.pos(1, 0)[0], labY);
  let zVal = null, eVal = null;
  const setZ = s => { const t = txt(s, 17, C.violet, ZP[0], ZP[1], true); const a = zVal ? swap(zVal, t) : [fade(t)]; zVal = t; return a; };
  const setE = s => { const t = txt(s, 17, C.pink, EP[0], EP[1], true); const a = eVal ? swap(eVal, t) : [fade(t)]; eVal = t; return a; };

  // ---- two number lines: noise e (pink) and hidden number z (violet)
  const VMIN = -2.2, VMAX = 2.8;
  const K = P ? 1.44 : 1.4, X0 = P ? -0.43 : -3.42;
  const vx = v => X0 + K * v;
  const NY = P ? -2.0 : -1.7, ZY = P ? -4.3 : -3.2, BH = P ? 0.95 : 0.7;
  function numLine(y, color, name) {
    const parts = [new M.Line({ start: [vx(VMIN), y, 0], end: [vx(VMAX), y, 0], color, strokeWidth: 2 })];
    for (const v of [-2, -1, 0, 1, 2]) parts.push(new M.Line({ start: [vx(v), y - 0.07, 0], end: [vx(v), y + 0.07, 0], color: C.muted, strokeWidth: 2 }),
      txt(fmt(v), LS, C.muted, vx(v), y - 0.3, true));
    parts.push(txt(name, 18, color, vx(VMIN) - (P ? -0.15 : 0.35), y + (P ? 0.3 : 0), true));
    return parts;
  }
  function bell(y, m, s, h, color) {
    const n = 36, a = Math.max(VMIN, m - 3 * s), b = Math.min(VMAX, m + 3 * s), pts = [];
    for (let i = 0; i <= n; i++) { const v = a + (b - a) * i / n; pts.push([vx(v), y + h * Math.exp(-(v - m) * (v - m) / (2 * s * s)), 0]); }
    return new M.VGroup(...pts.slice(1).map((p, i) => new M.Line({ start: pts[i], end: p, color, strokeWidth: 2.5 })));
  }
  const zH = s => BH * 0.5 / s;
  const meanMark = (m, s) => new M.VGroup(new M.DashedLine({ start: [vx(m), ZY, 0], end: [vx(m), ZY + zH(s) + 0.08, 0], color: C.violet }),
    txt(`m = ${m}`, LS, C.violet, vx(m), ZY + zH(s) + 0.3, true));
  const sdBar = (y, m, s, h, color, label) => {
    const yy = y + h * Math.exp(-0.5);
    return new M.VGroup(new M.Line({ start: [vx(m), yy, 0], end: [vx(m + s), yy, 0], color: C.green, strokeWidth: 3 }),
      txt(label, LS, C.green, vx(m + s) + (P ? 0.55 : 0.5), yy, true));
  };
  const dot = (v, y, color) => new M.Dot({ point: [vx(v), y, 0], radius: 0.1, color });

  // ---- 0-10 the VAE again
  await until(S(0));
  await play(cascade([...ENC.nodes.flat(), zNode, ...DEC.nodes.flat()].map(fade), 0.9),
    cascade([...ENC.edges.flat(2), eM, eS, eZ, ...DEC.edges.flat(2)].map(e => new M.Create(e, { runTime: 0.3 })), 0.9),
    fade(encLab), fade(decLab), ...fbox([['a VAE:', C.ink], ['encoder → z → decoder', C.violet]]), ...say('TRAINING THE VAE TO REBUILD A BOWL'));

  const orig = potLines([2, 3, 5], OP[0], OP[1], PU, C.cyan);
  await until(S(1));
  await play(...orig.map(l => new M.Create(l)), ...fbox([['bowl B2:  2,  3,  5', C.cyan]]), ...say('BOWL B2:  2,  3,  5'));

  await until(S(2));
  await play(...ENC.value(0, 0, '2', C.cyan), ...ENC.value(0, 1, '3', C.cyan), ...ENC.value(0, 2, '5', C.cyan), flow(ENC, 0, C.violet),
    ...say('INTO THE ENCODER', C.violet));

  const zLine = numLine(ZY, C.violet, 'z');
  let zBell = bell(ZY, 1, 0.5, zH(0.5), C.violet);
  await until(S(3));
  await play(...zLine.map(fade), new M.Create(zBell), ...say('A DISTRIBUTION OF LATENT VALUES', C.violet));

  let mMark = meanMark(1, 0.5);
  await until(S(4));
  await play(...ENC.value(1, 0, 'm', C.violet), fade(mMark), ...fbox([['mean m = 1', C.violet]], C.violet), ...say('MEAN = 1', C.violet));

  let zSd = sdBar(ZY, 1, 0.5, zH(0.5), C.green, 's = 0.5');
  await until(S(5));
  await play(...ENC.value(1, 1, 's', C.green), fade(zSd), ...fbox([['mean m = 1', C.violet], ['spread s = 0.5', C.green]], C.violet), ...say('STANDARD DEVIATION = 0.5', C.green));

  await until(S(6));
  await play(mark(mMark, C.violet), mark(zSd, C.green), ...say('MEAN: CENTRE   ·   SD: SPREAD'));

  await until(S(7));
  await play(mark(zBell, C.violet), ...setZ('z'), new M.Indicate(eZ, { color: C.violet, runTime: 0.6 }), ...say('SAMPLE ONE → SEND IT TO THE DECODER', C.violet));

  await until(S(8));
  await play(flow(DEC, 0, C.violet), ...DEC.weight(1, 0, 0, 0), ...DEC.weight(1, 0, 1, 0), ...DEC.weight(1, 0, 2, 1),
    ...DEC.value(2, 0, '2', C.amber), ...DEC.value(2, 1, '3', C.amber), ...fbox([['rim = 3 + z', C.amber]], C.amber), ...say('DECODER: RIM = 3 + LATENT VALUE', C.amber));

  await until(S(9));
  await play(...fbox([['loss uses', C.ink], ['original rim − rebuilt rim', C.pink]], C.pink), ...say('ORIGINAL vs REBUILT RIM → LOSS', C.pink));

  await until(S(10));
  await play(mark(ENC.nodes[1][0], C.violet), mark(ENC.nodes[1][1], C.green), ...say('LOSS SHOULD IMPROVE m AND s'));

  await until(S(11));
  await play(...say('RANDOM PICK, OR m AND s: WHICH CAUSED IT?', C.pink));

  // ---- 12-14 two movements of a group of dots
  const demoY = ZY + 0.0;
  const demo = [0.5, 1, 1.5].map(v => dot(v, demoY, C.ink));
  await until(S(12));
  await play(out(new M.VGroup(zBell, mMark, zSd)), ...demo.map(fade), ...say('MOVE THE DOTS TOGETHER'));
  await play(...demo.map((d, i) => new M.Transform(d, dot([0.5, 1, 1.5][i] + 0.5, demoY, C.ink), { runTime: 0.9 })));
  await play(...demo.map((d, i) => new M.Transform(d, dot([0.5, 1, 1.5][i], demoY, C.ink), { runTime: 0.9 })));

  await until(S(13));
  await play(...demo.map((d, i) => new M.Transform(d, dot([0, 1, 2][i], demoY, C.ink), { runTime: 1.0 })), ...say('SPREAD THEM, SAME CENTRE'));
  await play(...demo.map((d, i) => new M.Transform(d, dot([0.5, 1, 1.5][i], demoY, C.ink), { runTime: 0.9 })));

  await until(S(14));
  await play(out(new M.VGroup(...demo)), ...setBell(1, 0.5), ...say('SAME 2 MOVES MAKE LATENT VALUES', C.violet));

  // ---- 15-19 separate noise
  const nLine = numLine(NY, C.pink, 'e');
  const nBell = bell(NY, 0, 1, BH, C.pink);
  await until(S(15));
  await play(...nLine.map(fade), new M.Create(nBell), ...say('A SEPARATE BELL: MEAN 0', C.pink));

  const nSd = sdBar(NY, 0, 1, BH, C.green, 'sd 1');
  await until(S(16));
  await play(fade(nSd), ...say('STANDARD DEVIATION 1', C.green));

  await until(S(17));
  await play(...fbox([['mean 0, sd 1:', C.pink], 'standard normal'], C.pink), ...say('STANDARD NORMAL DISTRIBUTION', C.pink));

  await until(S(18));
  await play(fade(eNode), new M.Create(eE), ...setE('e'), ...say('A RANDOM DRAW FROM IT = NOISE e', C.pink));

  await until(S(19));
  await play(mark(eNode, C.pink), ...say('NOISE DOES NOT USE THE ENCODER', C.pink));

  // ---- 20-31 three noise numbers become hidden numbers
  await until(S(20));
  await play(out(nSd), ...say('TURN NOISE INTO A LATENT VALUE', C.violet));

  const E3 = [-1, 0, 1];
  const nDots = E3.map(v => dot(v, NY, C.pink));
  await until(S(21));
  await play(fade(nDots[0]), new M.Flash(nDots[0], { color: C.pink }), ...setE('−1'), ...fbox([['e = −1', C.pink]], C.pink), ...say('NOISE e = −1', C.pink));

  const w = dot(-1, ZY, C.violet);
  await until(S(22));
  await play(new M.TransformFromCopy(nDots[0], w, { runTime: 0.8 }), ...fbox([['e = −1', C.pink], 's × e = 0.5 × (−1)']), ...say('MULTIPLY BY s = 0.5', C.green));

  await until(S(23));
  await play(new M.Transform(w, dot(-0.5, ZY, C.violet), { runTime: 0.9 }), ...fbox([['e = −1', C.pink], 's × e = −0.5']), ...say('−0.5: HALF AS FAR FROM THE CENTRE', C.green));

  await until(S(24));
  await play(new M.Transform(w, dot(0.5, ZY, C.violet), { runTime: 1.0 }), ...fbox([['e = −1', C.pink], 's × e = −0.5', ['+ m:  −0.5 + 1 = 0.5', C.violet]]), ...say('ADD m = 1: MOVE RIGHT', C.violet));

  await until(S(25));
  await play(mark(w, C.violet), ...setZ('0.5'), ...fbox([['z = 1 + 0.5 × (−1)', C.violet], '  = 0.5'], C.violet), ...say('LATENT VALUE z = 0.5', C.violet));

  const rebuilt = potLines([2, 3, 3.5], RP[0], RP[1], PU, C.amber);
  await until(S(26));
  await play(flow(DEC, 0, C.violet), ...DEC.value(0, 0, '0.5', C.violet), ...DEC.value(1, 0, '0.5', C.violet), ...DEC.value(2, 2, '3.5', C.amber), ...rebuilt.map(l => new M.Create(l)),
    ...fbox([['rim = 3 + 0.5 = 3.5', C.amber]], C.amber), ...say('RIM = 3.5', C.amber));

  const w2 = dot(1, ZY, C.violet), w3 = dot(1.5, ZY, C.violet);
  await until(S(27));
  await play(fade(nDots[1]), ...setE('0'), new M.TransformFromCopy(nDots[1], w2, { runTime: 0.8 }), ...setZ('1'),
    ...fbox([['e = 0', C.pink], ['z = 1 + 0.5 × 0 = 1', C.violet]], C.violet), ...say('NOISE 0  →  z = 1', C.violet));

  await until(S(28));
  await play(...DEC.value(0, 0, '1', C.violet), ...DEC.value(1, 0, '1', C.violet), ...DEC.value(2, 2, '4', C.amber), ...morph(rebuilt, [2, 3, 4], RP[0], RP[1], PU),
    ...fbox([['rim = 3 + 1 = 4', C.amber]], C.amber), ...say('RIM = 4', C.amber));

  await until(S(29));
  await play(fade(nDots[2]), ...setE('1'), new M.TransformFromCopy(nDots[2], w3, { runTime: 0.8 }), ...setZ('1.5'),
    ...fbox([['e = 1', C.pink], ['z = 1 + 0.5 × 1 = 1.5', C.violet]], C.violet), ...say('NOISE 1  →  z = 1.5', C.violet));

  await until(S(30));
  await play(...DEC.value(0, 0, '1.5', C.violet), ...DEC.value(1, 0, '1.5', C.violet), ...DEC.value(2, 2, '4.5', C.amber), ...morph(rebuilt, [2, 3, 4.5], RP[0], RP[1], PU),
    ...fbox([['rim = 3 + 1.5 = 4.5', C.amber]], C.amber), ...say('RIM = 4.5', C.amber));

  const zD = [w, w2, w3];
  await until(S(31));
  await play(cascade(zD.map(d => mark(d, C.violet)), 0.9), ...fbox([['e: −1,  0,  1', C.pink], ['z: 0.5, 1, 1.5', C.violet]], C.violet), ...say('z = 0.5,  1,  1.5', C.violet));

  await until(S(32));
  await play(...say('REPARAMETERIZATION: z FROM SEPARATE NOISE', C.violet));

  // ---- 33-39 same noise, new mean, new spread
  const moveZ = (m, s) => zD.map((d, i) => new M.Transform(d, dot(m + s * E3[i], ZY, C.violet), { runTime: 1.0 }));
  function setBell(m, s) {
    const nb = bell(ZY, m, s, zH(s), C.violet), nm = meanMark(m, s), ns = sdBar(ZY, m, s, zH(s), C.green, `s = ${s}`);
    const a = [...swap(zBell, nb), ...swap(mMark, nm), ...swap(zSd, ns)];
    zBell = nb; mMark = nm; zSd = ns; return a;
  }
  await until(S(33));
  await play(cascade(nDots.map(d => mark(d, C.pink)), 0.8), ...say('SAME 3 NOISE NUMBERS, NEW MEAN', C.pink));

  await until(S(34));
  await play(...fbox([['m: 1 → 1.25', C.violet], ['s = 0.5', C.green]], C.violet), ...say('MEAN 1  →  1.25', C.violet));

  await until(S(35));
  await play(...moveZ(1.25, 0.5), ...setBell(1.25, 0.5), ...setZ('1.75'), ...DEC.value(0, 0, '1.75', C.violet), ...DEC.value(1, 0, '1.75', C.violet), ...DEC.value(2, 2, '4.75', C.amber),
    ...morph(rebuilt, [2, 3, 4.75], RP[0], RP[1], PU), ...say('ALL 3 MOVE RIGHT BY 0.25', C.violet));

  await until(S(36));
  await play(...fbox([['z: 0.75, 1.25, 1.75', C.violet]], C.violet), ...say('0.75,  1.25,  1.75', C.violet));

  await until(S(37));
  await play(...moveZ(1, 0.5), ...setBell(1, 0.5), ...setZ('1.5'), ...DEC.value(0, 0, '1.5', C.violet), ...DEC.value(1, 0, '1.5', C.violet), ...DEC.value(2, 2, '4.5', C.amber),
    ...morph(rebuilt, [2, 3, 4.5], RP[0], RP[1], PU), ...fbox([['m = 1', C.violet], ['s: 0.5 → 1', C.green]], C.green), ...say('MEAN BACK TO 1, THEN s: 0.5 → 1', C.green));
  await play(...moveZ(1, 1), ...setBell(1, 1), ...setZ('2'), ...DEC.value(0, 0, '2', C.violet), ...DEC.value(1, 0, '2', C.violet), ...DEC.value(2, 2, '5', C.amber),
    ...morph(rebuilt, [2, 3, 5], RP[0], RP[1], PU));

  await until(S(38));
  await play(cascade(zD.map(d => mark(d, C.violet)), 0.8), ...fbox([['z: 0,  1,  2', C.violet]], C.violet), ...say('z = 0,  1,  2', C.violet));

  await until(S(39));
  await play(mark(mMark, C.violet), ...say('FURTHER APART, CENTRE STILL 1', C.green));

  // ---- 40-45 the formula and its slopes
  await until(S(40));
  await play(...say('ONE FORMULA FOR BOTH MOVES'));

  await until(S(41));
  await play(...fbox([['z: latent value', C.violet], ['m: mean   s: spread', C.green], ['e: noise', C.pink]]), ...say('z,  m,  s,  e'));

  await until(S(42));
  await play(...fbox([['z = m + s × e', C.violet]], C.violet), ...say('z  =  m  +  s × e', C.violet));

  await until(S(43));
  await play(...say('LOCAL GRADIENT: HOW MUCH z MOVES', C.amber));

  await until(S(44));
  await play(new M.Indicate(eM, { color: C.amber, runTime: 0.7 }), ...fbox([['z = m + s × e', C.violet], ['local gradient for m = 1', C.amber]], C.violet), ...say('NOISE FIXED: LOCAL GRADIENT FOR m = 1', C.amber));

  await until(S(45));
  await play(new M.Indicate(eS, { color: C.amber, runTime: 0.7 }), ...fbox([['z = m + s × e', C.violet], ['local gradient for m = 1', C.amber], ['local gradient for s = e', C.amber]], C.violet),
    ...say('LOCAL GRADIENT FOR s = THE NOISE e', C.amber));

  await until(S(46));
  await play(mark(ENC.nodes[1][0], C.amber), mark(ENC.nodes[1][1], C.amber), ...say('LOCAL GRADIENTS: ENCODER → z', C.amber));

  // ---- 47-49 the learning signal travels back (gold, right to left)
  const back = [...DEC.edges[1][0].slice().reverse(), DEC.edges[0][0][0], eZ, zNode, eM, eS, ...ENC.edges[0].flat().reverse()];
  await until(S(47));
  await play(new M.LaggedStart(back.map(o => new M.Indicate(o, { color: C.amber, runTime: 0.5 })), { lagRatio: 0.2, runTime: 2.4 }),
    ...say('GRADIENT: LOSS → DECODER → ENCODER', C.amber));

  await until(S(48));
  await play(mark(zNode), new M.Indicate(eM, { color: C.amber, runTime: 0.7 }), new M.Indicate(eS, { color: C.amber, runTime: 0.7 }),
    ...say('IT PASSES THROUGH z = m + s × e', C.amber));

  await until(S(49));
  await play(mark(ENC.nodes[1][0], C.violet), mark(ENC.nodes[1][1], C.green), ...say('ENCODER LEARNS CENTRE AND SPREAD', C.green));

  // ---- 50-52 noise stays random
  await until(S(50));
  await play(mark(eNode, C.pink), ...say('THE NOISE IS STILL RANDOM', C.pink));

  const fresh = [-1.4, -0.3, 0.6, 1.7].map(v => dot(v, NY, C.pink));
  await until(S(51));
  await play(out(new M.VGroup(...nDots)), cascade(fresh.map(d => fade(d)), 1.2), ...say('TRAINING: FRESH NOISE EVERY TIME', C.pink));

  await until(S(52));
  await play(...fbox([['z = m + s × e', C.violet], ['e: random noise', C.pink], ['m, s: learned', C.green]], C.violet),
    ...say('NOISE SEPARATE → THE NETWORK CAN LEARN', C.green));
}

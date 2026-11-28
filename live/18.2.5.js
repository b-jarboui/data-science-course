// 18.2.5 Adversarial training: a generator and a discriminator learn in turns.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const PILL = P ? [0, 4.15, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.8, 0] : [4.6, 0.7, 0];
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
    const maxW = P ? FW - 1.2 : 3.6;
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
  const B1 = [1, 3, 4], V1 = [1, 3, 2];

  // ---- 0-4 the collection and a generator that makes only vases
  const gu = P ? 0.3 : 0.2, gx = k => (k - 1.5) * 2.0 - (P ? 0 : 1.4);
  const realY = P ? 0.4 : 0.1, genY = P ? -2.0 : -2.0;
  const rp = k => P ? [(k % 2 ? 1.8 : -1.8), (k < 2 ? 2.2 : 0.35)] : [gx(k), realY];
  const gp = k => P ? [(k % 2 ? 1.8 : -1.8), (k < 2 ? -2.0 : -3.85)] : [gx(k), genY];
  const real = [[1, 3, 4], [2, 3, 5], [1, 3, 2], [2, 4, 1]].map((m, k) => potLines(m, rp(k)[0], rp(k)[1], gu, C.cyan));
  const realLab = txt('original collection', P ? 18 : 16, C.cyan, 0, P ? -0.25 : realY - 0.3);
  const genRow = [0, 1, 2, 3].map(k => potLines(V1, gp(k)[0], gp(k)[1], gu, C.amber));
  const genLab = txt('generator: only vases', P ? 18 : 16, C.amber, 0, P ? -4.3 : genY - 0.3);

  await until(S(0));
  await play(cascade(real.map(p => new M.LaggedStart(p.map(l => new M.Create(l)), { lagRatio: 0.1 })), 1.4), ...(P ? fbox([['goal: new shapes', C.ink], ['like these ones', C.cyan]]) : []), ...say('GENERATE SHAPES LIKE THE COLLECTION'));

  await until(S(1));
  await play(fade(realLab), ...say('4 ORIGINALS: 2 BOWLS, 2 VASES'));

  await until(S(2));
  await play(...fbox([['bowls: 50%', C.cyan], ['vases: 50%', C.cyan]]), ...say('EACH KIND: 50%'));

  await until(S(3));
  await play(cascade(genRow.map(p => new M.LaggedStart(p.map(l => new M.Create(l)), { lagRatio: 0.1 })), 1.2), fade(genLab), ...say('NEW GENERATOR: ONLY VASES', C.pink));

  await until(S(4));
  await play(...say('HOW CAN IT LEARN A BETTER MIX?', C.violet));

  // ---- 5-8 two students
  const person = (x, color) => {
    const y = P ? 0.9 : -0.6, k = P ? 1.8 : 1.3;
    const head = new M.Circle({ radius: 0.2 * k, color }); head.setFill(color, 1); head.moveTo([x, y + 0.5 * k, 0]);
    const body = new M.Arc({ radius: 0.36 * k, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y + 0.02 * k, 0]);
    return new M.VGroup(head, body);
  };
  const SX = P ? 1.9 : 2.6;
  const maker = person(-SX, C.amber), checker = person(SX, C.green);
  const makerLab = txt('makes designs', P ? 18 : 16, C.amber, -SX, P ? 0.3 : -1.2), checkerLab = txt('checks: original?', P ? 18 : 16, C.green, SX, P ? 0.3 : -1.2);
  const design = P ? potLines(B1, 0, -3.6, 0.42, C.amber) : potLines(B1, 0, -2.6, 0.3, C.amber);
  await until(S(5));
  await play(out(new M.VGroup(...real.flat(), realLab, ...genRow.flat(), genLab)), ...fbox(P ? [['student 1: makes', C.amber], ['student 2: checks', C.green]] : [], C.violet), fade(maker), fade(checker), ...say('2 STUDENTS, 2 DIFFERENT JOBS'));

  await until(S(6));
  await play(fade(makerLab), ...design.map(l => new M.Create(l)), ...say('ONE MAKES POTTERY DESIGNS', C.amber));

  await until(S(7));
  await play(fade(checkerLab), mark(checker, C.green), ...say('ONE CHECKS: FROM THE COLLECTION?', C.green));

  await until(S(8));
  await play(mark(maker), ...say('ONE IMPROVES → THE OTHER LEARNS MORE', C.violet));
  await play(mark(checker, C.green));

  // ---- 9-20 two networks
  const NY = P ? 2.0 : 0.3, R0 = P ? 0.5 : 0.47;
  const G = net({ layers: [1, 2], center: P ? [-2.35, NY, 0] : [-4.6, NY, 0], width: P ? 1.5 : 1.5, height: P ? 1.7 : 1.7, r: R0 });
  const D = net({ layers: [2, 1], center: P ? [2.05, NY, 0] : [-0.6, NY, 0], width: P ? 1.5 : 1.5, height: P ? 1.7 : 1.7, r: R0 });
  const links = [0, 1].map(i => { const a = G.pos(1, i), b = D.pos(0, i);
    const l = new M.Line({ start: [a[0] + R0, a[1], -0.01], end: [b[0] - R0, b[1], -0.01], color: C.muted, strokeWidth: 2 }); l.setStrokeOpacity(0.6); return l; });
  const midX = (G.pos(1, 0)[0] + D.pos(0, 0)[0]) / 2, iu = P ? 0.1 : 0.08;
  const icons = [potLines(B1, midX, G.pos(1, 0)[1] + 0.1, iu, C.amber, 2), potLines(V1, midX, G.pos(1, 1)[1] + 0.1, iu, C.amber, 2)];
  const gName = txt('GENERATOR', P ? 17 : 15, C.amber, G.pos(0, 0)[0] + 0.75, NY - 1.55, true);
  const dName = txt('DISCRIMINATOR', P ? 17 : 15, C.green, D.pos(0, 0)[0] + 0.75, NY - 1.55, true);

  await until(S(9));
  await play(out(new M.VGroup(maker, checker, makerLab, checkerLab, ...design)),
    cascade([...G.nodes.flat(), ...D.nodes.flat()].map(fade), 0.9),
    cascade([...G.edges.flat(2), ...links, ...D.edges.flat(2)].map(e => new M.Create(e, { runTime: 0.3 })), 0.9), ...fbox([['2 networks,', C.ink], ['2 different jobs', C.violet]], C.violet), ...say('2 SMALL NEURAL NETWORKS'));

  await until(S(10));
  await play(...G.value(0, 0, 'r', C.violet), flow(G, 0, C.violet), ...icons.flat().map(fade), ...fbox([['in: a random number r', C.violet], ['out: a pottery shape', C.amber]], C.amber), ...say('RANDOM NUMBER IN → A SHAPE IS CHOSEN', C.amber));

  await until(S(11));
  await play(fade(gName), ...say('NETWORK 1 = THE GENERATOR', C.amber));

  await until(S(12));
  await play(new M.Indicate(links[0], { color: C.amber }), new M.Indicate(links[1], { color: C.amber }), flow(D, 0, C.green),
    ...D.value(1, 0, '?', C.green), ...say('SHAPE IN → A NUMBER FROM 0 TO 1', C.green));

  await until(S(13));
  await play(...D.value(1, 0, '1', C.cyan), ...fbox([['1:', C.cyan], 'from the collection']), ...say('1 = FROM THE COLLECTION'));

  await until(S(14));
  await play(...D.value(1, 0, '0', C.amber), ...fbox([['0:', C.amber], 'made by the generator'], C.amber), ...say('0 = MADE BY THE GENERATOR', C.amber));

  await until(S(15));
  await play(fade(dName), ...fbox([['its number =', C.green], ['the discriminator score', C.green]], C.green), ...say('NETWORK 2 = THE DISCRIMINATOR', C.green));

  await until(S(16));
  await play(cascade([...G.nodes.flat(), ...D.nodes.flat()].map(n => mark(n, C.ink)), 1.2), ...say('NUMBERS INSIDE THE NEURONS'));

  await until(S(17));
  await play(...fbox([['generator: q', C.amber], ['  = probability of a bowl', C.amber], ['discriminator: weight a', C.green]], C.violet), ...say('BOTH HAVE NUMBERS THEY CAN CHANGE', C.violet));

  // proportion bars: real 50/50, generated q / 1 - q
  const BW = P ? 6.0 : 4.6, BX0 = P ? -2.6 : -6.0, BHt = P ? 0.48 : 0.4;
  const RY = P ? -1.05 : -1.9, GY = P ? -1.75 : -2.55;
  function bar(q, y, color, opB, opV) {
    const parts = [];
    if (q > 0) { const r = new M.Rectangle({ width: BW * q, height: BHt, color, strokeWidth: 1 }); r.setFill(color, opB); r.moveTo([BX0 + BW * q / 2, y, 0]); parts.push(r);
      if (BW * q > 1.75) parts.push(txt(`bowls ${+(q * 100).toFixed(2)}%`, LS, C.ink, BX0 + BW * q / 2, y, true)); }
    if (q < 1) { const r = new M.Rectangle({ width: BW * (1 - q), height: BHt, color, strokeWidth: 1 }); r.setFill(color, opV); r.moveTo([BX0 + BW * q + BW * (1 - q) / 2, y, 0]); parts.push(r);
      if (BW * (1 - q) > 1.75) parts.push(txt(`vases ${+((1 - q) * 100).toFixed(2)}%`, LS, C.ink, BX0 + BW * q + BW * (1 - q) / 2, y, true)); }
    return new M.VGroup(...parts);
  }
  const realBar = bar(0.5, RY, C.cyan, 0.45, 0.2);
  const barNames = [txt('real', LS, C.cyan, BX0 - 0.45, RY), txt('gen.', LS, C.amber, BX0 - 0.45, GY)];
  let genBar = bar(0, GY, C.amber, 0.45, 0.2);
  const setQ = (q) => { const nb = bar(q, GY, C.amber, 0.45, 0.2); const a = swap(genBar, nb); genBar = nb;
    return [...a, ...G.value(1, 0, String(q), C.amber), ...G.value(1, 1, String(1 - q), C.amber)]; };

  await until(S(18));
  await play(...G.value(1, 0, '0', C.amber), ...G.value(1, 1, '1', C.amber), fade(realBar), fade(genBar), ...barNames.map(fade),
    ...fbox([['q = 0', C.amber], 'no bowls at all'], C.amber), ...say('GENERATOR STARTS: BOWL PROBABILITY 0', C.amber));

  // scores next to the discriminator
  const SCP = P ? [0, NY - 2.05] : [1.35, NY];
  let scores = null;
  function setScores(a) {
    const b = 0.5 + a, v = 0.5 - a;
    const g = P ? new M.VGroup(txt(`bowl ${b}  ·  vase ${v}  ·  a = ${a}`, 17, C.green, SCP[0], SCP[1], true))
      : new M.VGroup(txt(`bowl: ${b}`, 16, C.green, SCP[0] + 0.25, SCP[1] + 0.3, true), txt(`vase: ${v}`, 16, C.green, SCP[0] + 0.25, SCP[1] - 0.1, true),
        txt(`a = ${a}`, 15, C.muted, SCP[0] + 0.25, SCP[1] - 0.5, true));
    const an = scores ? swap(scores, g) : [fade(g)]; scores = g; return an;
  }
  await until(S(19));
  await play(...D.value(1, 0, '0.5', C.green), ...setScores(0), ...fbox([['a = 0', C.green], ['bowl score = 0.5 + a', C.green], ['vase score = 0.5 − a', C.green]], C.green),
    ...say('DISCRIMINATOR STARTS: 0.5 FOR BOTH', C.green));

  await until(S(20));
  await play(mark(scores, C.green), ...say('IT CANNOT TELL YET', C.green));

  // ---- 21-25 the two losses
  await until(S(21));
  await play(...fbox([['real shape  → target 1', C.cyan], ['generated   → target 0', C.amber]], C.green), ...say('COMPARE EACH DISCRIMINATOR SCORE WITH ITS TARGET', C.green));

  await until(S(22));
  await play(...fbox([['discriminator loss =', C.green], ['average (score − target)²', C.ink], ['real, generated: equal', C.muted]], C.green), ...say('SQUARE, THEN AVERAGE', C.green));

  await until(S(23));
  await play(mark(gName), ...say('GENERATOR: WANTS DISCRIMINATOR SCORES NEAR 1', C.amber));

  await until(S(24));
  await play(...fbox([['generator loss =', C.amber], ['average (score − 1)²', C.ink]], C.amber), ...say('GENERATOR LOSS', C.amber));

  await until(S(25));
  await play(mark(gName), mark(dName, C.green), ...say('COMPETING GOALS = ADVERSARIAL TRAINING', C.violet));

  // loss chart
  const CH = P ? { x0: -2.9, x1: 3.2, y0: -4.65, y1: -2.85 } : { x0: 1.1, x1: 6.2, y0: -3.1, y1: -1.5 };
  const sx = k => CH.x0 + k * (CH.x1 - CH.x0) / 6, sy = v => CH.y0 + v * (CH.y1 - CH.y0) / 0.6;
  const chart = new M.VGroup(
    new M.Line({ start: [CH.x0, CH.y0, 0], end: [CH.x1 + 0.1, CH.y0, 0], color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: [CH.x0, CH.y0, 0], end: [CH.x0, CH.y1 + 0.1, 0], color: C.muted, strokeWidth: 2 }),
    new M.DashedLine({ start: [CH.x0, sy(0.25), 0], end: [CH.x1, sy(0.25), 0], color: C.muted }),
    txt('0.25', LS, C.muted, CH.x0 - 0.42, sy(0.25), true), txt('0.5', LS, C.muted, CH.x0 - 0.35, sy(0.5), true),
    txt('training step', LS, C.muted, (CH.x0 + CH.x1) / 2, CH.y0 - 0.28),
    txt('generator loss', LS, C.amber, CH.x0 + 1.2, CH.y1 + 0.25), txt('discriminator loss', LS, C.green, CH.x0 + 4.1, CH.y1 + 0.25));
  const SER = { G: { c: C.amber, v: [0.5625, 0.4375, 0.296875, 0.26171875, 0.25293, 0.25073, 0.25018] },
                D: { c: C.green, v: [0.25, 0.1875, 0.234375, 0.24609375, 0.24902, 0.24976, 0.24994] } };
  const addPt = (key, k) => { const s = SER[key], p = [sx(k), sy(s.v[k]), 0];
    const parts = [new M.Dot({ point: p, radius: 0.06, color: s.c })];
    if (k > 0) parts.push(new M.Line({ start: [sx(k - 1), sy(s.v[k - 1]), 0], end: p, color: s.c, strokeWidth: 2.5 }));
    return parts.map(o => new M.Create(o, { runTime: 0.5 })); };

  // ---- 26-35 step 1
  await until(S(26));
  await play(new M.Create(chart), ...addPt('D', 0), mark(dName, C.green), ...say('TRAIN THE DISCRIMINATOR FIRST', C.green));

  await until(S(27));
  await play(...fbox([['learning rate = 0.5', C.violet], 'for both networks'], C.violet), ...say('LEARNING RATE 0.5', C.violet));

  await until(S(28));
  await play(...D.weight(0, 0, 0, 0.25), ...D.weight(0, 1, 0, -0.25), ...setScores(0.25), ...fbox([['step 1', C.green], ['a: 0 → 0.25', C.green]], C.green),
    ...say('STEP 1: WEIGHT a GOES FROM 0 TO 0.25', C.green));

  await until(S(29));
  await play(mark(scores.submobjects[0], C.green), ...D.value(1, 0, '0.75', C.green), ...fbox([['bowl score', C.green], ['0.5 + 0.25 = 0.75', C.green]], C.green), ...say('BOWL SCORE = 0.75', C.green));

  await until(S(30));
  await play(...D.value(1, 0, '0.25', C.green), ...fbox([['vase score', C.green], ['0.5 − 0.25 = 0.25', C.green]], C.green), ...say('VASE SCORE = 0.25', C.green));

  await until(S(31));
  await play(...addPt('D', 1), ...fbox([['discriminator loss', C.green], ['0.25 → 0.1875', C.green]], C.green), ...say('DISCRIMINATOR LOSS: 0.25 → ABOUT 0.19', C.green));

  await until(S(32));
  await play(...addPt('G', 0), ...fbox([['only vases, score 0.25', C.amber], ['(0.25 − 1)² = 0.5625', C.amber]], C.amber), ...say('GENERATOR LOSS ≈ 0.56', C.amber));

  const back = () => new M.LaggedStart([D.nodes[1][0], ...D.edges[0].map(e => e[0]).reverse(), ...links.slice().reverse(), ...G.nodes[1].slice().reverse(), ...G.edges[0][0].slice().reverse()]
    .map(o => new M.Indicate(o, { color: C.amber, runTime: 0.5 })), { lagRatio: 0.25, runTime: 1.8 });
  await until(S(33));
  await play(back(), ...say('GRADIENT: DISCRIMINATOR → GENERATOR', C.amber));

  await until(S(34));
  await play(...setQ(0.25), ...fbox([['q: 0 → 0.25', C.amber], ['+25 points of bowls', C.amber]], C.amber), ...say('BOWLS +25 PERCENTAGE POINTS', C.amber));

  await until(S(35));
  await play(...addPt('G', 1), ...fbox([['bowls: 25%', C.amber], ['generator loss ≈ 0.4375', C.amber]], C.amber), ...say('25% BOWLS  ·  LOSS ≈ 0.44', C.amber));

  // ---- 36-42 step 2
  await until(S(36));
  await play(new M.Indicate(links[0], { color: C.green }), ...say('STEP 2: THE DISCRIMINATOR SEES SOME BOWLS', C.green));

  await until(S(37));
  await play(...D.weight(0, 0, 0, 0.125), ...D.weight(0, 1, 0, -0.125), ...setScores(0.125), ...D.value(1, 0, '0.625', C.green), ...fbox([['step 2', C.green], ['a: 0.25 → 0.125', C.green]], C.green), ...say('WEIGHT a DOWN TO 0.125', C.green));

  await until(S(38));
  await play(mark(scores, C.green), ...fbox([['bowl: 0.625', C.green], ['vase: 0.375', C.green]], C.green), ...say('BOWL 0.625  ·  VASE 0.375', C.green));

  await until(S(39));
  await play(...addPt('D', 2), ...fbox([['discriminator loss', C.green], ['0.25 → 0.234375', C.green]], C.green), ...say('0.25 → ABOUT 0.23', C.green));

  await until(S(40));
  await play(back(), ...say('BOWLS +12.5 PERCENTAGE POINTS', C.amber));
  await play(...setQ(0.375));

  await until(S(41));
  await play(...fbox([['q = 0.375', C.amber], ['37.5% bowls', C.amber]], C.amber), ...say('37.5% BOWLS', C.amber));

  await until(S(42));
  await play(...addPt('G', 2), ...fbox([['generator loss', C.amber], ['0.328125 → 0.296875', C.amber]], C.amber), ...say('LOSS ≈ 0.33 → 0.30', C.amber));

  // ---- 43-46 step 3
  await until(S(43));
  await play(...D.weight(0, 0, 0, 0.0625), ...D.weight(0, 1, 0, -0.0625), ...setScores(0.0625), ...D.value(1, 0, '0.5625', C.green), ...addPt('D', 3),
    ...fbox([['step 3', C.green], ['a: 0.125 → 0.0625', C.green]], C.green), ...say('STEP 3: WEIGHT a DOWN TO 0.0625', C.green));

  await until(S(44));
  await play(mark(scores, C.green), ...fbox([['bowl: 0.5625', C.green], ['vase: 0.4375', C.green]], C.green), ...say('BOWL 0.5625  ·  VASE 0.4375', C.green));

  await until(S(45));
  await play(back(), ...say('BOWLS +6.25 PERCENTAGE POINTS', C.amber));
  await play(...setQ(0.4375));

  await until(S(46));
  await play(...addPt('G', 3), ...fbox([['bowls: 43.75%', C.amber], ['loss ≈ 0.26171875', C.amber]], C.amber), ...say('43.75% BOWLS  ·  LOSS ≈ 0.26', C.amber));

  // ---- 47-49 keep going
  await until(S(47));
  await play(cascade([4, 5, 6].flatMap(k => [...addPt('G', k), ...addPt('D', k)]), 2.0),
    ...fbox([['gap to 50% bowls:', C.ink], ['50 → 25 → 12.5 → 6.25', C.amber]], C.amber), ...say('APPROACHING 50% BOWLS, 50% VASES', C.amber));
  await play(...setQ(0.5));

  await until(S(48));
  await play(...D.weight(0, 0, 0, 0), ...D.weight(0, 1, 0, 0), ...setScores(0), ...D.value(1, 0, '0.5', C.green),
    ...fbox([['both scores → 0.5', C.green], ['both losses → 0.25', C.ink]], C.green), ...say('BOTH SCORES → 0.5: CANNOT TELL', C.green));

  await until(S(49));
  await play(...fbox([['generator loss =', C.amber], ['average of', C.ink], ['(1 − discriminator score)²', C.amber]], C.amber), ...say('GENERATOR LOSS: AVERAGE OF (1 − DISCRIMINATOR SCORE)²', C.amber));

  // ---- 50-54 wrap-up
  await until(S(50));
  await play(mark(G.nodes[1][0]), mark(G.nodes[1][1]), ...say('LEARNS BY CHANGING THE PROBABILITIES DIRECTLY', C.amber));

  await until(S(51));
  await play(mark(gName), mark(dName, C.green), ...fbox([['generator + discriminator', C.ink], ['= GAN', C.violet]], C.violet), ...say('GENERATIVE ADVERSARIAL NETWORK = GAN', C.violet));

  await until(S(52));
  await play(...say('GENERATED EXAMPLES THAT RESEMBLE THE COLLECTION', C.green));

  const wig = [0.45, 0.3, 0.5, 0.22, 0.48, 0.28, 0.42];
  const wiggle = new M.VGroup(...wig.slice(1).map((v, k) => new M.Line({ start: [sx(k), sy(wig[k]), 0], end: [sx(k + 1), sy(v), 0], color: C.pink, strokeWidth: 2 })));
  await until(S(53));
  await play(new M.Create(wiggle), ...fbox([['real GANs:', C.pink], ['losses may rise and fall', C.pink]], C.pink), ...say('REAL GANs MAY NOT SETTLE', C.pink));

  await until(S(54));
  await play(out(wiggle), ...fbox([['discriminator: spot fakes', C.green], ['generator: more convincing', C.amber]], C.violet),
    ...say('ONE SPOTS FAKES, ONE MAKES THEM CONVINCING', C.green));
}

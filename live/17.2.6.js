// 17.2.6 Weight initialization. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const CX = P ? 0.4 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [-2.6, 1.85, 0];
  const BOXP = P ? [0, -5.25, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const fade = (o, runTime = 0.4) => new M.FadeIn(o, { runTime });
  const out = o => new M.FadeOut(o, { runTime: 0.35 });
  const text = (s, x, y, c = C.ink, size = 19) => { const t = T(s, size, c, true); t.moveTo(pt(x, y)); return t; };

  let boxNow = null;
  function box(lines, color = C.cyan) {
    const lh = P ? 0.41 : 0.39;
    const labels = lines.map((row, i) => { const [v, ink] = Array.isArray(row) ? row : [row, C.ink]; return text(v, 0, ((lines.length - 1) / 2 - i) * lh, ink, P ? 22 : 21); });
    const w = Math.max(...labels.map(l => l.getWidth())) + 0.5, h = lines.length * lh + 0.24;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pt(0, 0));
    const g = new M.VGroup(r, ...labels);
    const maxW = P ? FW - 1.2 : 4.6; if (w > maxW) g.scale(maxW / w);
    g.moveTo(BOXP);
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow)); boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; };

  function card(digit, x, y, scale, color) {
    const pix = digit === 0 ? ['0110', '1001', '1001', '1001', '0110'] : ['0010', '0110', '0010', '0010', '0111'];
    const b = new M.RoundedRectangle({ width: 1.8, height: 2.1, cornerRadius: 0.16, color, strokeWidth: 2 });
    b.setFill(C.card, 0.96); b.moveTo(pt(0, 0));
    const parts = [b];
    pix.forEach((row, r) => [...row].forEach((c, k) => {
      const q = new M.Rectangle({ width: 0.27, height: 0.27, color: c === '1' ? C.ink : C.grid, strokeWidth: 1 });
      q.setFill(c === '1' ? C.ink : C.grid, c === '1' ? 0.92 : 0.35); q.moveTo(pt((k - 1.5) * 0.3, (2 - r) * 0.3 - 0.12)); parts.push(q);
    }));
    parts.push(text('CARD ' + digit, 0, 0.78, color, 15));
    const g = new M.VGroup(...parts); g.scale(scale); g.moveTo(pt(x, y)); return g;
  }

  // network with one path through the middle neurons
  const N = net({ layers: [3, 3, 3], center: pt(CX, P ? 0.95 : -0.3), width: P ? 5.4 : 6, height: P ? 3.2 : 2.8, r: P ? 0.3 : 0.3 });

  // signal pulses: dots travel along every link of layer l (leaves no marks behind)
  async function flow(l, color, ...anims) {
    const R = N.nodes[0][0].getWidth() / 2, ds = [], ts = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: [a[0] + R, a[1], 0], radius: 0.07, color }); d.setFill(color, 1);
      const t = new M.Dot({ point: [b[0] - R, b[1], 0], radius: 0.07, color }); t.setFill(color, 1);
      ds.push(d); ts.push(t);
    }));
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })), ...anims);
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.8 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }
  const X = [0, 1, 2].map(l => N.pos(l, 1)[0]), Y = N.pos(0, 1)[1];
  const pathEdges = [N.edges[0][1][1], N.edges[1][1][1]];
  const pathHi = pathEdges.map(e => { const c = e.copy(); c.setStroke(C.violet, 6, 0.95); return c; });
  const midX = k => (X[k] + X[k + 1]) / 2;

  // readings: card 0 above (cyan), card 1 below (amber)
  const tops = [], bots = [];
  function reading(l, top, bot) {
    const a = [];
    if (top !== null) { if (tops[l]) a.push(out(tops[l])); tops[l] = text(top, X[l], Y + 0.56, C.cyan, P ? 21 : 19); a.push(fade(tops[l])); }
    if (bot !== null) { if (bots[l]) a.push(out(bots[l])); bots[l] = text(bot, X[l], Y - 0.56, C.amber, P ? 21 : 19); a.push(fade(bots[l])); }
    return a;
  }
  const clearReadings = (from = 0) => { const a = []; for (let l = from; l < 3; l++) { if (tops[l]) a.push(out(tops[l])); if (bots[l]) a.push(out(bots[l])); tops[l] = bots[l] = null; } return a; };

  // weight pills on the two path links
  let wPills = [];
  function wLabels(s, color = C.violet) {
    const a = wPills.map(out);
    wPills = [0, 1].map(k => { const p = pill(s, color, P ? 17 : 16); p.moveTo(pt(midX(k), Y + 0.02)); return p; });
    return [...a, ...wPills.map(p => fade(p))];
  }

  // number line 0..16 under the network
  const NL_Y = P ? -2.45 : -3.0, NX0 = P ? -3.3 : -5.6, NLEN = P ? 6.6 : 6.0;
  const nx = v => NX0 + Math.min(v, 16) / 16 * NLEN;
  const nline = new M.Line({ start: pt(NX0, NL_Y), end: pt(NX0 + NLEN, NL_Y), color: C.muted, strokeWidth: 3 });
  const ticks = [0, 4, 8, 12, 16].map(v => new M.VGroup(
    new M.Line({ start: pt(nx(v), NL_Y - 0.07), end: pt(nx(v), NL_Y + 0.07), color: C.muted }),
    text(String(v), nx(v), NL_Y - (P ? 0.32 : 0.27), C.muted, 16)));
  const GAPP = P ? pt(0, -3.3) : pt(1.45, NL_Y);
  let cyanDot = null, amberG = null, gapG = null;
  function dotAt(v, color) { const d = new M.Dot({ point: pt(nx(v), NL_Y + 0.2), radius: 0.11, color }); d.setFill(color, 1); return d; }
  function amberAt(v, gapText) {
    const a = [];
    if (amberG) a.push(out(amberG));
    amberG = new M.VGroup(dotAt(v, C.amber), text(String(v), nx(v), NL_Y + 0.46, C.amber, P ? 18 : 16)); a.push(fade(amberG));
    if (gapG) a.push(out(gapG));
    const bar = new M.Line({ start: pt(nx(0), NL_Y + 0.2), end: pt(nx(v), NL_Y + 0.2), color: C.green, strokeWidth: 5 });
    bar.setStrokeOpacity(0.7);
    const g = text(gapText, GAPP[0], GAPP[1], C.green, P ? 20 : 18);
    gapG = new M.VGroup(bar, g); a.push(fade(gapG));
    return a;
  }

  // 0-1 untrained network, two cards
  const c0 = card(0, P ? -1.4 : 3.2, P ? -3.6 : -0.4, P ? 1.15 : 1, C.cyan), c1 = card(1, P ? 1.4 : 5.6, P ? -3.6 : -0.4, P ? 1.15 : 1, C.amber);
  await until(S(0)); await play(fade(N.group), ...say('A NEW NETWORK: NOT TRAINED YET', C.muted), ...box(['new neural network', ['never trained', C.muted]], C.muted));
  await until(S(1)); await play(...clearBox(), fade(c0), fade(c1), ...say('TWO CARDS: 0 AND 1'));

  // 2-5 the network, layers, starting weights
  const s0 = card(0, X[0] - (P ? 0.95 : 1.0), Y + 0.56, 0.3, C.cyan), s1 = card(1, X[0] - (P ? 0.95 : 1.0), Y - 0.56, 0.3, C.amber);
  await until(S(2)); await play(out(c0), out(c1), fade(s0), fade(s1), ...say('NEURONS IN LAYERS'), ...box(['circle = neuron', ['line = connection', C.amber]]));
  const [k0, k1] = [s0, s1];
  const frames = [0, 1, 2].map(l => { const f = new M.RoundedRectangle({ width: 0.85, height: (P ? 3.2 : 2.8) + 0.85, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 }); f.setFill(C.card, 0); f.moveTo(pt(X[l], Y)); return f; });
  const lnames = [0, 1, 2].map(l => text('layer ' + (l + 1), X[l], Y + (P ? 2.25 : -2.2), C.cyan, 15));
  await until(S(3)); await play(new M.LaggedStart(frames.map(f => new M.Create(f)), { lagRatio: 0.2, runTime: 1 }), ...lnames.map(t => fade(t)), ...say('ONE COLUMN = ONE LAYER'));
  await until(S(4)); await play(out(new M.VGroup(...frames)), new M.LaggedStart(N.edges.flat(2).map(e => new M.Indicate(e, { color: C.amber })), { lagRatio: 0.05, runTime: 1.6 }), ...say('EVERY CONNECTION NEEDS A STARTING WEIGHT', C.amber), ...box(['each connection:', ['a starting weight', C.amber]], C.amber));
  await until(S(5)); await play(...say('DOES THE SIZE MATTER?', C.violet));

  // 6-9 one path, two readings
  await until(S(6)); await play(new M.LaggedStart(pathHi.map(e => new M.Create(e)), { lagRatio: 0.5, runTime: 1 }), out(new M.VGroup(...lnames)), ...say('FOLLOW ONE PATH', C.violet));
  await until(S(7)); await flow(0, C.violet, ...say('WATCH THE NUMBERS TRAVEL', C.violet));
  await until(S(8)); await play(...reading(0, '0', null), new M.Indicate(k0, { color: C.cyan }), ...say('CARD 0 → ACTIVATION 0'), ...box([['card 0: activation 0', C.cyan]]));
  await until(S(9)); await play(...reading(0, null, '4'), new M.Indicate(k1, { color: C.amber }), ...say('CARD 1 → ACTIVATION 4', C.amber), ...box([['card 0: activation 0', C.cyan], ['card 1: activation 4', C.amber]], C.amber));

  // 10-12 number line, gap 4
  cyanDot = dotAt(0, C.cyan);
  await until(S(10)); await play(new M.Create(nline), fade(new M.VGroup(...ticks)), fade(cyanDot), ...say('ACTIVATIONS ON A NUMBER LINE'));
  await until(S(11)); await play(...amberAt(4, 'gap 4'), ...say('GAP = 4', C.green));
  await until(S(12)); await play(new M.Indicate(gapG, { color: C.green }), ...say('THE GAP TELLS 0 AND 1 APART', C.green));

  // 13-14 copies that shrink
  const cx = P ? [-2.0, 0.4, 2.2] : [2.4, 4.3, 5.8], cy = P ? -4.7 : -0.3;
  const copies = [1, 0.55, 0.25].map((s, i) => card(0, cx[i], cy, s * (P ? 0.85 : 0.75), C.cyan));
  await until(S(13)); await play(...clearBox(), fade(copies[0]), ...say('COPY A PICTURE, SMALLER EACH TIME', C.muted));
  await play(new M.LaggedStart(copies.slice(1).map(c => fade(c)), { lagRatio: 0.6, runTime: 1.4 }));
  await until(S(14)); await play(new M.Indicate(copies[2], { color: C.pink }), ...say('DETAILS BECOME TOO SMALL TO SEE', C.pink));

  // 15-17 the name
  await until(S(15)); await flow(0, C.amber, out(new M.VGroup(...copies)), ...say('NUMBERS CAN SHRINK IN A NETWORK TOO', C.amber));
  await until(S(16)); await play(new M.Indicate(gapG, { color: C.green }), ...say('KEEP USEFUL GAPS', C.green));
  await until(S(17)); await play(...say('WEIGHT INITIALIZATION'), ...box(['Weight initialization', ['= choosing weights', C.cyan], ['  before training', C.cyan]]));
  await until(S(18)); await play(...say('TWO TESTS', C.amber), ...box([['Test 1: weights 0.5', C.violet], ['Test 2: weights 2', C.pink]], C.amber));

  // 19-28 test 1: weights 0.5
  await until(S(19)); await play(out(new M.VGroup(...pathHi)), ...N.weight(0, 1, 1, 0.5), ...N.weight(1, 1, 1, 0.5), ...wLabels('×0.5'), ...say('TEST 1: BOTH WEIGHTS 0.5', C.violet));
  await until(S(20)); await play(...box(['new activation', ['= activation × weight', C.violet]], C.violet), ...say('ONLY MULTIPLY BY THE WEIGHT'));
  await until(S(21)); await flow(0, C.cyan, ...reading(1, '0', null), ...box([['0 × 0.5 = 0', C.cyan]], C.violet));
  await until(S(22)); await play(...reading(1, null, '2'), ...box([['0 × 0.5 = 0', C.cyan], ['4 × 0.5 = 2', C.amber]], C.violet));
  await until(S(23)); await play(...amberAt(2, 'gap 2'), ...say('GAP: 4 → 2', C.green));
  await until(S(24)); await flow(1, C.amber, ...say('ON TO THE NEXT LAYER'));
  await until(S(25)); await play(...reading(2, '0', null), ...box([['0 × 0.5 = 0', C.cyan]], C.violet));
  await until(S(26)); await play(...reading(2, null, '1'), ...amberAt(1, 'gap 1'), ...box([['0 × 0.5 = 0', C.cyan], ['2 × 0.5 = 1', C.amber]], C.violet));
  await until(S(27)); await play(...box(['gaps', ['4 → 2 → 1', C.green]], C.green), ...say('THREE GAPS: 4, 2, 1', C.green));
  await until(S(28)); await play(new M.Indicate(wPills[0], { color: C.violet }), new M.Indicate(wPills[1], { color: C.violet }), ...say('EACH LAYER HALVES THE GAP', C.violet));
  await until(S(29)); await play(...amberAt(0.5, 'gap 0.5'), ...box(['more layers', ['4 → 2 → 1 → 0.5', C.green]], C.green), ...say('MORE LAYERS, SAME SMALL WEIGHTS', C.violet));
  await until(S(30)); await play(...amberAt(0.25, 'gap 0.25'), ...box(['more layers', ['4 → 2 → 1 → 0.5 → 0.25', C.green]], C.green), ...say('SMALLER AND SMALLER', C.pink));

  // 31-40 test 2: weights 2
  await until(S(31)); await play(...clearReadings(1), ...amberAt(4, 'gap 4'), ...clearBox(), ...say('BACK TO ACTIVATIONS 0 AND 4'), ...box([['activations 0 and 4', C.amber]], C.amber));
  await until(S(32)); await play(...N.weight(0, 1, 1, 2), ...N.weight(1, 1, 1, 2), ...wLabels('×2', C.pink), ...say('TEST 2: BOTH WEIGHTS 2', C.pink));
  await until(S(33)); await flow(0, C.cyan, ...reading(1, '0', null), ...box([['0 × 2 = 0', C.cyan]], C.pink));
  await until(S(34)); await play(...reading(1, null, '8'), ...box([['0 × 2 = 0', C.cyan], ['4 × 2 = 8', C.amber]], C.pink));
  await until(S(35)); await play(...amberAt(8, 'gap 8'), ...say('GAP: 4 → 8', C.green));
  await until(S(36)); await flow(1, C.cyan, ...reading(2, '0', null), ...box([['0 × 2 = 0', C.cyan]], C.pink));
  await until(S(37)); await play(...reading(2, null, '16'), ...amberAt(16, 'gap 16'), ...box([['0 × 2 = 0', C.cyan], ['8 × 2 = 16', C.amber]], C.pink));
  await until(S(38)); await play(...box(['gaps', ['4 → 8 → 16', C.green]], C.green), ...say('THREE GAPS: 4, 8, 16', C.green));
  await until(S(39)); await play(new M.Indicate(wPills[0], { color: C.pink }), new M.Indicate(wPills[1], { color: C.pink }), ...say('EACH LAYER DOUBLES THE GAP', C.pink));
  await until(S(40)); await play(...box(['more layers', ['16 → 32 → 64 → ...', C.pink]], C.pink), ...say('NUMBERS GROW VERY LARGE', C.pink));

  // 41-46 formula and meaning
  await until(S(41)); await play(...say('ONE SHORT FORMULA'));
  await until(S(42)); await play(...box(['new activation =', ['incoming activation', C.amber], ['× weight', C.amber]]));
  await until(S(43)); await play(new M.Indicate(wPills[0], { color: C.amber }), new M.Indicate(wPills[1], { color: C.amber }), ...say('THE WEIGHT CONTROLS THE GAP', C.amber));
  await until(S(44)); await play(...box([['weights too small', C.violet], 'gaps almost disappear'], C.violet), ...say('TOO SMALL: DIFFERENCES FADE', C.violet));
  await until(S(45)); await play(...box([['weights too large', C.pink], 'numbers hard to manage'], C.pink), ...say('TOO LARGE: NUMBERS EXPLODE', C.pink));
  await until(S(46)); await flow(0, C.green, ...box([['good starting weights', C.green], 'no shrinking', 'no exploding'], C.green), ...say('GOOD INITIALIZATION', C.green));

  // 47-52 real networks
  await until(S(47)); await play(...N.weight(0, 1, 1, 1), ...N.weight(1, 1, 1, 1), ...wLabels('×1', C.cyan), ...clearReadings(1), ...say('EVERY WEIGHT = 1?', C.amber),
    ...box(['weights = 1?'], C.amber), out(amberG), out(gapG));
  amberG = null; gapG = null;
  await until(S(48)); await flow(0, C.cyan, ...reading(1, '0', '4'), ...amberAt(4, 'gap 4'));
  await play(...reading(2, '0', '4'), ...box(['weight 1:', ['gap 4 → 4 → 4', C.green]], C.green), ...say('WEIGHT 1 KEEPS THE GAP AT 4', C.green));
  // all weights equal -> every hidden neuron computes the same thing
  const same = [0, 1, 2].map(i => text('4', N.pos(1, i)[0], N.pos(1, i)[1], C.amber, P ? 21 : 19));
  const ins = [['0', 0], ['4', 1], ['0', 2]].map(([s, i]) => text(s, N.pos(0, i)[0], N.pos(0, i)[1], C.ink, P ? 21 : 19));
  const eq = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { eq.push(...N.weight(0, i, j, 1)); eq.push(...N.weight(1, i, j, 1)); }
  await until(S(49)); await play(...wPills.map(out), ...clearReadings(0), out(new M.VGroup(nline, ...ticks, cyanDot, amberG, gapG)), ...eq,
    ...ins.map(t => fade(t)), ...say('ALL WEIGHTS EQUAL', C.amber));
  wPills = []; amberG = null; gapG = null;
  await flow(0, C.amber, ...same.map(t => fade(t)), ...box(['all weights equal →', ['every hidden neuron', C.amber], ['computes the same', C.amber]], C.amber));
  const rnd = [[0.4, -0.3, 0.6], [-0.5, 0.2, 0.35], [0.25, 0.55, -0.4]], rnd2 = [[-0.3, 0.5, 0.2], [0.45, -0.25, 0.6], [0.3, 0.4, -0.5]];
  const wAll = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { wAll.push(...N.weight(0, i, j, rnd[i][j])); wAll.push(...N.weight(1, i, j, rnd2[i][j])); }
  await until(S(50)); await play(...box(['same change for each', ['→ never different', C.pink]], C.pink), ...say('THEY NEVER BECOME DIFFERENT', C.pink));
  await play(...same.map(out), ...ins.map(out), ...wAll, ...box(['different random weights', ['in a chosen range', C.green]], C.green), ...say('RANDOM START, CAREFUL RANGE', C.green));
  const into = [0, 1, 2].map(i => { const c = N.edges[0][i][1].copy(); c.setStroke(C.amber, 5, 0.95); return c; });
  await until(S(51)); await play(new M.LaggedStart(into.map(e => new M.Create(e)), { lagRatio: 0.25, runTime: 1 }), new M.Indicate(N.nodes[1][1], { color: C.amber }),
    ...box(['range depends on how many', ['connections each neuron gets', C.amber]], C.amber), ...say('RANGE DEPENDS ON THE CONNECTIONS', C.amber));
  await until(S(52)); await play(out(new M.VGroup(...into)));
  await flow(1, C.green, ...box([['Weight initialization', C.green], 'good starting weights', 'let information travel'], C.green), ...say('REMEMBER: GOOD STARTING WEIGHTS', C.green));
}

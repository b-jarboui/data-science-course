// lesson 17.1.5
// Computation graphs (script v6). Beat i = sentence i (0-based).
// Data sheet: blue–orange, left weight 2: left-only total 2 → 2; right-only total −1 → 0; output 1 − 2 − 0 = −1; target 0; error −1; loss 1. Weight 3: loss 4.
export default async function (L) {
  const { M, P, FW, FH, C, S, E, T, pill, showA, until, play } = L;

  // ---------- shared helpers (chapter 17.1) ----------
  const BLUE = '#38A5FF', ORANGE = '#FF9B42';
  const pt = (x, y) => [x, y, 0];
  const fmt = v => String(v).replace(/-/g, '−');
  const sg = v => (v > 0 ? '+' : '') + fmt(v);
  const PILL = P ? pt(0, 4.15) : pt(0, 1.85);
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);
  function txt(s, size, color, pos, mono = false, bold = false) { const t = T(String(s), size, color, mono, bold); t.moveTo(pos); return t; }
  function rr(w, h, pos, color = C.muted, op = 0.95) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, op); r.moveTo(pos); return r;
  }
  function ln(a, b, color = C.muted, w = 2) { return new M.Line({ start: a, end: b, color, strokeWidth: w }); }
  function arrow(a, b, color = C.cyan, w = 3) {
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    return new M.VGroup(ln(a, b, color, w), ln(b, pt(b[0] - 0.17 * ux + 0.1 * uy, b[1] - 0.17 * uy - 0.1 * ux), color, w),
      ln(b, pt(b[0] - 0.17 * ux - 0.1 * uy, b[1] - 0.17 * uy + 0.1 * ux), color, w));
  }
  function chip(s, color, pos, size = 20) { const p = pill(s, color, size); p.moveTo(pos); return p; }
  const PX = P ? 0 : 3.45, PTOP = P ? -2.05 : 1.3, PW = P ? 7.4 : 7.0;
  const NC = P ? pt(0, 1.25) : pt(-3.6, -0.9);
  const NW = P ? 5.6 : 4.4, NH = P ? 3.2 : 2.6, R = 0.4;
  function makeNet(layers, center = NC, width = NW, height = NH) {
    const N = L.net({ layers, center, width, height, r: R }); N.vals = {}; N.chips = {}; return N;
  }
  function val(N, l, i, s, col = C.ink) {
    const t = txt(fmt(s), 24, col, N.pos(l, i), true, true), k = l + ':' + i, a = [new M.FadeIn(t)];
    if (N.vals[k]) a.push(new M.FadeOut(N.vals[k])); N.vals[k] = t; return a;
  }
  function setW(N, l, i, j, w, t = 0.35, side = 1) {
    const a = N.pos(l, i), b = N.pos(l + 1, j);
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn; if (ny < 0) { nx = -nx; ny = -ny; }
    const c = chip(sg(w), w < 0 ? C.pink : C.cyan, pt(a[0] + (b[0] - a[0]) * t + nx * 0.45 * side, a[1] + (b[1] - a[1]) * t + ny * 0.45 * side), 20);
    const k = `${l}:${i}:${j}`, an = [...N.weight(l, i, j, w), new M.FadeIn(c)];
    if (N.chips[k]) an.push(new M.FadeOut(N.chips[k])); N.chips[k] = c; return an;
  }
  const flash = (m, col = C.amber) => new M.Flash(m, { color: col, flashRadius: R + 0.12 });
  const edgeFlash = (e, col = C.amber) => new M.ShowPassingFlash(e, { color: col, strokeWidth: 6, timeWidth: 0.5 });
  const AH = P ? 4.8 : 4.4, CY = PTOP - AH / 2;

  // ---------- the network (left / top) ----------
  const N = makeNet([2, 2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), h0 = N.pos(1, 0), h1 = N.pos(1, 1), o = N.pos(2, 0);
  const names = [txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3)), txt('right', 20, ORANGE, pt(inR[0], inR[1] - R - 0.3)),
    txt('left-only', 20, C.cyan, pt(h0[0], h0[1] + R + 0.3)), txt('right-only', 20, C.cyan, pt(h1[0], h1[1] - R - 0.3)), txt('output', 20, C.amber, pt(o[0], o[1] + R + 0.3))];
  const biasO = chip('bias +1', C.violet, pt(o[0], o[1] - R - 0.4), 20);

  // ---------- the computation graph (right / bottom) ----------
  const SX = P ? 1.15 : 1, SY = P ? 1.1 : 1;
  const g = (x, y) => pt(PX + x * SX, CY + y * SY);
  const frameBox = rr(PW, AH, pt(PX, CY), C.cyan);
  const nodes = {};
  const GS = 18, AV = PW - 0.4, XL = PX - AV / 2;
  const wOf = s => T(s, GS, C.ink, true).getWidth() + 0.3;
  function rowX(longs) {
    const ws = longs.map(wOf), gap = (AV - ws.reduce((a, b) => a + b, 0)) / (ws.length - 1), xs = [];
    let x = XL; ws.forEach(w => { xs.push(x + w / 2); x += w + gap; }); return { xs, ws };
  }
  const Y1 = 1.3, Y2 = 0.3, Y3 = -0.7, Y4 = -1.7;
  const r1 = rowX(['left 1', '1 × 2 = 2', '2 + 0 = 2', 'ReLU → 2']);
  const r4 = rowX(['(−1) × (−1) = 1', '−1 − 0 = −1', 'display −1']);
  const wo = wOf('1 − 2 − 0 = −1');
  const SPEC = {
    inL: [r1.xs[0], Y1, r1.ws[0]], n1: [r1.xs[1], Y1, r1.ws[1]], n2: [r1.xs[2], Y1, r1.ws[2]], n3: [r1.xs[3], Y1, r1.ws[3]],
    inR: [r1.xs[0], Y2, wOf('right 0')], m1: [r1.xs[1], Y2, wOf('0 − 1 = −1')], m2: [r1.xs[2], Y2, wOf('ReLU → 0')],
    t: [r1.xs[1], Y3, wOf('target 0')], o: [Math.min(r1.xs[3], XL + AV - wo / 2), Y3, wo],
    l: [r4.xs[0], Y4, r4.ws[0]], e: [r4.xs[1], Y4, r4.ws[1]], d: [r4.xs[2], Y4, r4.ws[2]] };
  function gnode(key, s, color = C.cyan) {
    const [x, y, w] = SPEC[key], p = pt(x, CY + y * SY), t = T(s, GS, color, true);
    const r = rr(w, 0.48, p, color); t.moveTo(p);
    const grp = new M.VGroup(r, t); grp.hw = w / 2; grp.p = p; nodes[key] = grp; return grp;
  }
  function relabel(key, s, color = C.cyan) { const old = nodes[key]; const n = gnode(key, s, color); return [new M.FadeOut(old), new M.FadeIn(n)]; }
  function link(a, b, color = C.muted) {
    const A = nodes[a], B = nodes[b], dx = B.p[0] - A.p[0], dy = B.p[1] - A.p[1];
    const ca = Math.min(A.hw / Math.abs(dx || 1e-6), 0.25 / Math.abs(dy || 1e-6)) + 0.04, cb = Math.min(B.hw / Math.abs(dx || 1e-6), 0.25 / Math.abs(dy || 1e-6)) + 0.06;
    return arrow(pt(A.p[0] + dx * ca, A.p[1] + dy * ca), pt(B.p[0] - dx * cb, B.p[1] - dy * cb), color, 2.5);
  }
  let cap = null;
  const setCap = (s, col = C.cyan) => { const t = txt(s, 20, col, pt(PX, CY + AH / 2 - 0.33), true); const a = [new M.FadeIn(t)]; if (cap) a.push(new M.FadeOut(cap)); cap = t; return a; };

  // ---------- 0–4 ----------
  await until(S(0));
  await play(new M.FadeIn(N.group), ...names.map(n => new M.FadeIn(n)), new M.FadeIn(biasO), ...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE),
    ...setW(N, 0, 0, 0, 1, 0.35, 1), ...setW(N, 0, 1, 0, -1, 0.35, -1), ...setW(N, 0, 0, 1, -1, 0.35, 1), ...setW(N, 0, 1, 1, 1, 0.35, -1),
    ...setW(N, 1, 0, 0, -1, 0.3, 1), ...setW(N, 1, 1, 0, -1, 0.3, -1), ...say('BLUE LEFT • ORANGE RIGHT'));
  await until(S(1));
  await play(edgeFlash(N.edges[0][0][0]), new M.Indicate(N.chips['0:0:0'], { color: C.amber }), ...say('THIS CONNECTION: LEFT → LEFT-ONLY', C.amber));
  await until(S(2));
  await play(...say('CHANGE ONLY THIS WEIGHT', C.amber));
  await until(S(3));
  await play(new M.FadeIn(frameBox), ...setCap('WHERE DOES THE CHANGE GO?', C.amber), ...say('WHERE DOES IT GO? HOW FAR OFF?', C.amber));
  const inA = gnode('inL', 'left 1', BLUE), inB = gnode('inR', 'right 0', ORANGE);
  await until(S(4));
  await play(new M.FadeIn(inA), new M.FadeIn(inB), ...setCap('START: THE INPUTS'), ...say('START WITH THE INPUTS 1 AND 0'));

  // ---------- 5–15: the left-only path ----------
  await until(S(5));
  await play(...setW(N, 0, 0, 0, 2, 0.35, 1), ...setCap('LEFT WEIGHT = 2', C.amber), ...say('SET THE LEFT WEIGHT TO 2', C.amber));
  await until(S(6));
  await play(...setCap('A WEIGHT MULTIPLIES ITS INPUT', C.amber), ...say('REMEMBER: A WEIGHT MULTIPLIES', C.amber));
  const n1 = gnode('n1', '1 × 2 = 2', C.amber);
  await until(S(7));
  const a1 = link('inL', 'n1');
  await play(new M.FadeIn(n1), new M.Create(a1), ...say('1 × 2 = 2', C.amber));
  await until(S(8));
  await play(new M.Indicate(n1, { color: C.amber }), ...setCap('WRITE IT DOWN: 2'), ...say('WRITE 2 DOWN, ARROW TO THE NEXT STEP'));
  await until(S(9));
  await play(...setCap('RIGHT: 0 × (−1) = 0', C.pink), ...say('RIGHT ADDS 0 × (−1) = 0', C.pink));
  const n2 = gnode('n2', 'add', C.cyan);
  await until(S(10));
  const a3 = link('n1', 'n2'), a4 = link('inR', 'n2');
  await play(new M.FadeIn(n2), new M.Create(a3), new M.Create(a4), ...setCap('A NEW STEP: ADD THE PARTS'), ...say('A STEP THAT ADDS THE TWO PARTS'));
  await until(S(11));
  await play(...relabel('n2', '2 + 0 = 2'), ...val(N, 1, 0, 2, C.cyan), ...say('2 + 0 = 2'));
  const n3 = gnode('n3', 'ReLU', C.green);
  await until(S(12));
  const a5 = link('n2', 'n3');
  await play(new M.FadeIn(n3), new M.Create(a5), ...say('AN ARROW TO THE ReLU STEP', C.green));
  await until(S(13));
  await play(...setCap('ReLU: NEGATIVE → 0, POSITIVE → KEPT', C.green), ...say('ReLU: NEGATIVE → 0, POSITIVE KEPT', C.green));
  await until(S(14));
  await play(...relabel('n3', 'ReLU → 2', C.green), ...val(N, 1, 0, 2, C.green), flash(N.nodes[1][0], C.green), ...say('ReLU SENDS 2 ON', C.green));

  // ---------- 15–21: the right-only path and the output ----------
  const m1 = gnode('m1', '0 − 1 = ?', C.cyan);
  await until(S(15));
  const b1 = link('inR', 'm1'), b2 = link('inL', 'm1');
  await play(new M.FadeIn(m1), new M.Create(b1), new M.Create(b2), ...setCap('A SECOND PATH: RIGHT-ONLY'), flash(N.nodes[1][1], C.cyan), ...say('A SECOND PATH: RIGHT-ONLY'));
  await until(S(16));
  await play(...say('RIGHT − LEFT'));
  await until(S(17));
  await play(...relabel('m1', '0 − 1 = −1', C.pink), ...val(N, 1, 1, -1, C.pink), ...say('0 − 1 = −1', C.pink));
  const m2 = gnode('m2', 'ReLU → 0', C.green);
  await until(S(18));
  const b3 = link('m1', 'm2');
  await play(new M.FadeIn(m2), new M.Create(b3), ...val(N, 1, 1, 0, C.green), ...say('ReLU: −1 → 0', C.green));
  const on = gnode('o', 'output', C.amber);
  await until(S(19));
  const c1 = link('n3', 'o'), c2 = link('m2', 'o');
  await play(new M.FadeIn(on), new M.Create(c1), new M.Create(c2), ...N.flow(1), ...say('BOTH MEET AT THE OUTPUT NEURON', C.amber));
  await until(S(20));
  await play(...relabel('o', '1 − 2 = −1', C.amber), ...say('BIAS 1, TAKE AWAY 2 → −1', C.amber));
  await until(S(21));
  await play(...relabel('o', '1 − 2 − 0 = −1', C.amber), ...val(N, 2, 0, -1, C.amber), flash(N.nodes[2][0]), ...say('TAKE AWAY 0: OUTPUT −1', C.amber));

  // ---------- 22–32: target, error, loss ----------
  await until(S(22));
  await play(...setCap('DIFFERENT COLORS: WE WANT 0', C.green), ...say('WE WANT 0: THE CORNERS DIFFER', C.green));
  const tn = gnode('t', 'target 0', C.green);
  await until(S(23));
  await play(new M.FadeIn(tn), ...say('THE WANTED ANSWER = THE TARGET', C.green));
  const en = gnode('e', 'subtract', C.pink);
  await until(S(24));
  const d1 = link('o', 'e'), d2 = link('t', 'e');
  await play(new M.FadeIn(en), new M.Create(d1), new M.Create(d2), ...say('OUTPUT AND TARGET → A SUBTRACTION', C.pink));
  await until(S(25));
  await play(...relabel('e', '−1 − 0 = −1', C.pink), ...say('−1 − 0 = −1', C.pink));
  await until(S(26));
  await play(...setCap('OUTPUT − TARGET = THE ERROR', C.pink), ...say('THIS IS THE ERROR', C.pink));
  await until(S(27));
  await play(...setCap('NEGATIVE: OUTPUT BELOW THE TARGET', C.pink), ...say('NEGATIVE = BELOW THE TARGET', C.pink));
  await until(S(28));
  await play(...setCap('SIZE 1: WE MISSED BY 1', C.pink), ...say('SIZE 1 = MISSED BY 1', C.pink));
  const lnode = gnode('l', 'square', C.violet);
  await until(S(29));
  const d3 = link('e', 'l');
  await play(new M.FadeIn(lnode), new M.Create(d3), ...setCap('SQUARE THE ERROR', C.violet), ...say('MULTIPLY THE ERROR BY ITSELF', C.violet));
  await until(S(30));
  await play(...relabel('l', '(−1) × (−1) = 1', C.violet), ...say('(−1) × (−1) = 1', C.violet));
  await until(S(31));
  await play(...relabel('l', 'loss 1', C.violet), ...setCap('LOSS: HOW WRONG THE OUTPUT IS', C.violet), ...say('THIS IS THE LOSS', C.violet));
  await until(S(32));
  await play(...setCap('OUTPUT = TARGET → ERROR 0, LOSS 0', C.green), ...say('HIT THE TARGET: LOSS 0', C.green));

  // ---------- 33–35: the formulas ----------
  await until(S(33));
  await play(...setCap('THE TWO STEPS TOGETHER'), ...say('THE TWO STEPS TOGETHER'));
  await until(S(34));
  await play(...setCap('error = output − target', C.pink), new M.Indicate(nodes.e, { color: C.pink }), ...say('ERROR = OUTPUT − TARGET', C.pink));
  await until(S(35));
  await play(...setCap('loss = error × error', C.violet), new M.Indicate(nodes.l, { color: C.violet }), ...say('LOSS = ERROR × ERROR', C.violet));

  // ---------- 36–41: the name, nodes, two readers ----------
  await until(S(36));
  await play(...setCap('COMPUTATION GRAPH'), ...['n1', 'n2', 'n3', 'm1', 'm2', 'o', 'e', 'l'].map(k => new M.Indicate(nodes[k], { color: C.cyan })),
    ...say('THIS DRAWING = A COMPUTATION GRAPH'));
  await until(S(37));
  await play(...setCap('EACH STEP = A NODE THAT SAVES ITS RESULT'), new M.Indicate(nodes.o, { color: C.amber }), ...say('EACH STEP IS A NODE'));
  const disp = gnode('d', 'display −1', C.muted);
  await until(S(38));
  const d4 = link('o', 'd', C.amber);
  await play(new M.FadeIn(disp), new M.Create(d4), ...say('A SECOND ARROW: TO THE DISPLAY', C.amber));
  await until(S(39));
  await play(new M.Indicate(d1, { color: C.pink }), ...say('THE FIRST ARROW STILL GOES TO THE ERROR', C.pink));
  await until(S(40));
  await play(new M.Indicate(d1, { color: C.amber }), new M.Indicate(d4, { color: C.amber }), ...setCap('TWO ARROWS READ ONE SAVED −1', C.amber), ...say('BOTH READ THE SAME SAVED RESULT', C.amber));
  await until(S(41));
  await play(...setCap('WHAT THE WEIGHT CHANGES ON ITS WAY', C.amber), ...say('FOLLOW THE WEIGHT TO THE LOSS', C.amber));
  for (const k of ['n1', 'n2', 'n3', 'o', 'e', 'l']) await play(new M.Indicate(nodes[k], { color: C.amber, runTime: 0.45 }));

  // ---------- 42–46: trap, try it, recap ----------
  await until(S(42));
  await play(...setCap('TRAP: THE OUTPUT IS NOT A PROBABILITY', C.amber), ...say('TRAP: NOT A PROBABILITY', C.amber));
  await until(S(43));
  await play(...setCap('PROBABILITY: 0 TO 1 • OUTPUT: −1', C.pink), new M.Indicate(nodes.o, { color: C.pink }), ...say('A PROBABILITY IS 0 TO 1 • OURS IS −1', C.pink));
  await until(S(44));
  await play(...setW(N, 0, 0, 0, 3, 0.35, 1), ...relabel('n1', '1 × 3 = ?', C.amber), ...relabel('l', 'loss ?', C.violet), ...val(N, 2, 0, '?', C.amber),
    ...setCap('TRY IT: WEIGHT 3 → LOSS?', C.green), ...say('TRY IT: WEIGHT 3, PREDICT THE LOSS', C.green));
  await until(S(45));
  await play(...setCap('LOWER THE WEIGHT UNTIL LOSS = 0', C.green), ...say('LOWER IT UNTIL THE LOSS IS 0', C.green));
  await until(S(46));
  await play(...setW(N, 0, 0, 0, 2, 0.35, 1), ...relabel('n1', '1 × 2 = 2', C.amber), ...relabel('l', 'loss 1', C.violet), ...val(N, 2, 0, -1, C.amber),
    ...setCap('INPUTS → SMALL STEPS → LOSS'), ...say('EVERY STEP FROM INPUTS TO LOSS'));
  for (const k of ['inL', 'n1', 'n2', 'n3', 'o', 'e', 'l']) await play(new M.Indicate(nodes[k], { color: C.cyan, runTime: 0.4 }));
  await until(E(46));
}

// lesson 17.1.7
// Automatic differentiation (script v6). Beat i = sentence i (0-based).
// Data sheet: blue–blue, shared weight 2 on left→left-only and right→right-only. Totals 1, 1; activations 1, 1; output −1; target 1;
// error −2; loss 4; gradient at output −4; each path (−4)(−1)(1)(1) = +4; shared gradient +8. Nudge: output −0.9 → loss 3.61.
export default async function (L) {
  const { M, P, FW, FH, C, S, E, T, pill, showA, until, play } = L;

  // ---------- shared helpers (chapter 17.1) ----------
  const BLUE = '#38A5FF', ORANGE = '#FF9B42', GR = '#ff8a3d';
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
  function chip(s, color, pos, size = 20) { const p = pill(s, color, size); p.moveTo(pos); return p; }
  function corner(v, pos, s = 1) {
    let o;
    if (v) { o = new M.Rectangle({ width: 0.5 * s, height: 0.5 * s, color: BLUE, strokeWidth: 2 }); o.setFill(BLUE, 0.95); }
    else { o = new M.Circle({ radius: 0.27 * s, color: ORANGE, strokeWidth: 2 }); o.setFill(ORANGE, 0.95); }
    o.moveTo(pos); return o;
  }
  function tile(l, r, pos, s = 1) {
    return new M.VGroup(rr(1.9 * s, 1.0 * s, pos, C.muted, 0.9), corner(l, pt(pos[0] - 0.45 * s, pos[1]), s), corner(r, pt(pos[0] + 0.45 * s, pos[1]), s));
  }
  const PX = P ? 0 : 3.75, PTOP = P ? -2.05 : 1.3, PW = P ? 7.4 : 6.3;
  const RS = P ? 25 : 23, LH = P ? 0.62 : 0.5;
  let panelNow = null;
  function swap(next) { const a = []; if (panelNow) a.push(new M.FadeOut(panelNow)); if (next) a.push(new M.FadeIn(next)); panelNow = next; return a; }
  function box(rows, color = C.cyan) {
    rows = rows.map(r => Array.isArray(r) ? r : [r, C.ink]);
    const ts = rows.map(([s, c]) => T(s, RS, c, true));
    const k = Math.min(1, (PW - 0.7) / Math.max(...ts.map(t => t.getWidth())));
    const h = rows.length * LH + 0.5;
    const bg = rr(PW, h, pt(PX, PTOP - h / 2), color);
    const left = PX - PW / 2 + 0.35;
    ts.forEach((t, i) => { if (k < 1) t.scale(k); t.moveTo(pt(left + t.getWidth() / 2, PTOP - 0.25 - LH / 2 - i * LH)); });
    return new M.VGroup(bg, ...ts);
  }
  const panel = (rows, color) => swap(box(rows, color));
  const NC = P ? pt(0, 1.25) : pt(-3.5, -0.9);
  const NW = P ? 5.6 : 4.8, NH = P ? 3.2 : 2.6, R = 0.4;
  function makeNet(layers, center = NC, width = NW, height = NH) {
    const N = L.net({ layers, center, width, height, r: R }); N.vals = {}; N.chips = {}; return N;
  }
  function val(N, l, i, s, col = C.ink) {
    const t = txt(fmt(s), 24, col, N.pos(l, i), true, true), k = l + ':' + i, a = [new M.FadeIn(t)];
    if (N.vals[k]) a.push(new M.FadeOut(N.vals[k])); N.vals[k] = t; return a;
  }
  function edgePt(N, l, i, j, t, side, d = 0.45) {
    const a = N.pos(l, i), b = N.pos(l + 1, j);
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn; if (ny < 0) { nx = -nx; ny = -ny; }
    return pt(a[0] + (b[0] - a[0]) * t + nx * d * side, a[1] + (b[1] - a[1]) * t + ny * d * side);
  }
  function setW(N, l, i, j, w, t = 0.35, side = 1, label = null, color = null) {
    const c = chip(label || sg(w), color || (w < 0 ? C.pink : C.cyan), edgePt(N, l, i, j, t, side), label ? 18 : 20);
    const k = `${l}:${i}:${j}`, an = [...N.weight(l, i, j, w), new M.FadeIn(c)];
    if (N.chips[k]) an.push(new M.FadeOut(N.chips[k])); N.chips[k] = c; return an;
  }
  const flash = (m, col = C.amber) => new M.Flash(m, { color: col, flashRadius: R + 0.12 });
  const edgeFlash = (e, col = C.amber) => new M.ShowPassingFlash(e, { color: col, strokeWidth: 6, timeWidth: 0.5 });
  const AH = P ? 4.8 : 4.4, CY = PTOP - AH / 2;
  // gradient pulses: orange dots travel right to left along the paths (several at once)
  async function back(...pairs) {
    const ds = pairs.map(([a]) => new M.Dot({ point: a, radius: 0.12, color: GR }));
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })));
    await play(...ds.map((d, k) => new M.Transform(d, new M.Dot({ point: pairs[k][1], radius: 0.12, color: GR }), { runTime: 0.8 })));
    await play(...ds.map(d => new M.FadeOut(d, { runTime: 0.15 })));
  }

  // ---------- network ----------
  const N = makeNet([2, 2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), h0 = N.pos(1, 0), h1 = N.pos(1, 1), o = N.pos(2, 0);
  const names = [txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3)), txt('right', 20, BLUE, pt(inR[0], inR[1] - R - 0.3)),
    txt('left-only', 20, C.cyan, pt(h0[0], h0[1] + R + 0.3)), txt('right-only', 20, C.cyan, pt(h1[0], h1[1] - R - 0.3)), txt('output', 20, C.amber, pt(o[0], o[1] + R + 0.3))];
  const biasO = chip('bias +1', C.violet, pt(o[0], o[1] - R - 0.4), 20);

  // ---------- 0–7: one shared weight ----------
  await until(S(0));
  await play(new M.FadeIn(N.group), ...names.map(n => new M.FadeIn(n)), new M.FadeIn(biasO),
    ...setW(N, 0, 0, 1, -1, 0.35, 1), ...setW(N, 0, 1, 0, -1, 0.35, -1), ...setW(N, 1, 0, 0, -1, 0.3, 1), ...setW(N, 1, 1, 0, -1, 0.3, -1),
    ...panel([['ONE WEIGHT, TWO PLACES', C.amber]], C.amber), ...say('ONE WEIGHT USED IN TWO PLACES', C.amber));
  await until(S(1));
  await play(...panel([['ONE WEIGHT, TWO PLACES', C.amber], 'the shared weight changes', 'both paths: how does', 'the loss move?'], C.amber), ...say('HOW DOES THE LOSS MOVE?', C.amber));
  await until(S(2));
  await play(...swap(new M.VGroup(rr(PW, AH, pt(PX, CY), C.cyan), txt('TWO BLUE CORNERS', 21, C.cyan, pt(PX, CY + AH / 2 - 0.35), true), tile(1, 1, pt(PX, CY - 0.1), 1.5))),
    ...say('A TILE WITH TWO BLUE CORNERS', BLUE));
  await until(S(3));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 1, BLUE), ...say('BOTH INPUTS = 1', BLUE));
  await until(S(4));
  await play(...setW(N, 0, 0, 0, 2, 0.42, 1, 'shared 2', C.amber), ...setW(N, 0, 1, 1, 2, 0.42, -1, 'shared 2', C.amber),
    ...panel([['SHARED WEIGHT', C.amber], ['= 2', C.amber]], C.amber), ...say('SHARED WEIGHT = 2', C.amber));
  await until(S(5));
  await play(edgeFlash(N.edges[0][0][0]), ...panel([['SHARED WEIGHT = 2', C.amber], 'left → left-only'], C.amber), ...say('LEFT → LEFT-ONLY', C.amber));
  await until(S(6));
  await play(edgeFlash(N.edges[0][1][1]), ...panel([['SHARED WEIGHT = 2', C.amber], 'left → left-only', 'right → right-only'], C.amber), ...say('AND RIGHT → RIGHT-ONLY', C.amber));
  await until(S(7));
  await play(new M.Indicate(N.chips['0:0:0'], { color: C.amber }), new M.Indicate(N.chips['0:1:1'], { color: C.amber }), ...say('ONE NUMBER, TWO CONNECTIONS', C.amber));

  // ---------- 8–15: forward pass ----------
  const fw = [['FORWARD PASS', C.cyan]];
  const addF = (s, c = C.ink) => { fw.push([s, c]); return panel(fw); };
  await until(S(8));
  await play(...N.flow(0), ...val(N, 1, 0, 1, C.cyan), ...addF('left-only:  2 × 1 − 1 = 1', C.cyan), ...say('2 × 1 − 1 = 1'));
  await until(S(9));
  await play(...val(N, 1, 1, 1, C.cyan), ...addF('right-only: 2 × 1 − 1 = 1', C.cyan), ...say('THE SAME: 1'));
  await until(S(10));
  await play(...val(N, 1, 0, 1, C.green), ...val(N, 1, 1, 1, C.green), flash(N.nodes[1][0], C.green), flash(N.nodes[1][1], C.green), ...addF('ReLU: 1 → 1, 1 → 1', C.green), ...say('ReLU PASSES BOTH', C.green));
  await until(S(11));
  await play(...N.flow(1), ...addF('output: bias 1 − 1 − 1', C.amber), ...say('BIAS 1, TAKE AWAY BOTH', C.amber));
  await until(S(12));
  await play(...val(N, 2, 0, -1, C.amber), ...addF('output = −1', C.amber), ...say('OUTPUT = −1', C.amber));
  await until(S(13));
  await play(...panel([['COMPARE', C.green], ['output = −1', C.amber], ['target = 1 (match)', C.green]], C.green), ...say('TARGET = 1: THE CORNERS MATCH', C.green));
  await until(S(14));
  await play(...panel([['COMPARE', C.green], ['output = −1', C.amber], ['target = 1 (match)', C.green], ['error = −1 − 1 = −2', C.pink]], C.green), ...say('ERROR = −2', C.pink));
  const lossChip = chip('loss 4', C.violet, pt(o[0], o[1] - R - 1.0), 20);
  await until(S(15));
  await play(new M.FadeIn(lossChip), ...panel([['COMPARE', C.green], ['output = −1', C.amber], ['target = 1 (match)', C.green], ['error = −1 − 1 = −2', C.pink], ['loss = (−2) × (−2) = 4', C.violet]], C.green),
    ...say('LOSS = 4', C.violet));

  // ---------- 16–21: gradient at the output ----------
  await until(S(16));
  await play(...panel([['GRADIENT AT THE OUTPUT', GR], 'remember: 2 × error'], GR), ...say('REMEMBER: 2 × ERROR', GR));
  const gOut = chip('−4', GR, pt(o[0] + R + 0.45, o[1]), 20);
  await until(S(17));
  await play(new M.FadeIn(gOut), ...panel([['GRADIENT AT THE OUTPUT', GR], 'remember: 2 × error', ['2 × (−2) = −4', GR]], GR), ...say('2 × (−2) = −4', GR));
  await until(S(18));
  await play(...panel([['CHECK WITH A NUDGE', C.amber], 'output: −1 → −0.9'], C.amber), ...say('CHECK: OUTPUT UP BY 0.1', C.amber));
  await until(S(19));
  await play(...panel([['CHECK WITH A NUDGE', C.amber], 'output: −1 → −0.9', ['error: −2 → −1.9', C.pink], ['loss:  4 → 3.61', C.violet]], C.amber), ...say('ERROR −1.9 • LOSS 3.61', C.violet));
  await until(S(20));
  await play(...panel([['CHECK WITH A NUDGE', C.amber], 'output: −1 → −0.9', ['error: −2 → −1.9', C.pink], ['loss:  4 → 3.61', C.violet], ['down about 0.4 = 4 × 0.1', C.green]], C.amber), ...say('DOWN 0.4: FOUR TIMES THE NUDGE', C.green));
  await until(S(21));
  await play(new M.Indicate(gOut, { color: GR }), ...panel([['GRADIENT AT THE OUTPUT', GR], ['−4', GR]], GR), ...say('GRADIENT AT THE OUTPUT = −4', GR));

  // ---------- 22–28: the first path ----------
  await until(S(22));
  await play(new M.FadeOut(N.chips['0:0:1']), new M.FadeOut(N.chips['0:1:0']));
  await back([o, h0]);
  await play(...panel([['FIRST PATH', GR], 'output ← left-only ← left'], GR), ...say('WALK BACK ALONG THE FIRST PATH', GR));
  await until(S(23));
  await play(...panel([['FIRST PATH', GR], 'change only the first', "connection's weight;", 'keep the second at 2'], GR), new M.Indicate(N.chips['0:0:0'], { color: GR }), ...say('CHANGE ONLY THE FIRST; SECOND STAYS 2', GR));
  const g1 = chip('×(−1)', GR, edgePt(N, 1, 0, 0, 0.5, -1), 19);
  await until(S(24));
  await play(new M.FadeIn(g1), ...panel([['FIRST PATH', GR], ['output step: local gradient −1', GR]], GR), ...say('OUTPUT STEP: LOCAL GRADIENT −1', GR));
  await until(S(25));
  await play(flash(N.nodes[1][0], GR), ...panel([['FIRST PATH', GR], ['output step: local gradient −1', GR], ['ReLU: local gradient 1', GR]], GR), ...say('ReLU: LOCAL GRADIENT 1', GR));
  await until(S(26));
  await back([h0, inL]);
  await play(...panel([['FIRST PATH', GR], ['output step: local gradient −1', GR], ['ReLU: local gradient 1', GR], ['weight step: local gradient 1', GR]], GR), ...say('WEIGHT STEP: 1 (LEFT INPUT = 1)', GR));
  await until(S(27));
  await play(...panel([['FIRST PATH', GR], ['−4 × (−1) × 1 × 1', GR]], GR), ...say('−4 × (−1) × 1 × 1', GR));
  const p1 = chip('+4', GR, edgePt(N, 0, 0, 0, 0.65, -1), 20);
  await until(S(28));
  await play(new M.FadeIn(p1), ...panel([['FIRST PATH', GR], ['−4 × (−1) × 1 × 1 = +4', GR]], GR), ...say('FIRST PATH: +4', GR));

  // ---------- 29–33: the second path and the sum ----------
  await until(S(29));
  await play(new M.FadeOut(g1), ...panel([['SECOND PATH', GR], 'change only the second', "connection's weight;", 'keep the first at 2'], GR), new M.Indicate(N.chips['0:1:1'], { color: GR }), ...say('NOW ONLY THE SECOND; FIRST STAYS 2', GR));
  const p2 = chip('+4', GR, edgePt(N, 0, 1, 1, 0.65, 1), 20);
  await until(S(30));
  await back([o, h1]);
  await back([h1, inR]);
  await play(new M.FadeIn(p2), ...panel([['SECOND PATH', GR], 'the same steps:', ['−4 × (−1) × 1 × 1 = +4', GR]], GR), ...say('SECOND PATH: +4', GR));
  await until(S(31));
  await play(...N.flow(0), ...panel([['SHARED WEIGHT MOVES', C.amber], 'both paths change together'], C.amber), ...say('BOTH PATHS CHANGE TOGETHER', C.amber));
  await until(S(32));
  await play(...panel([['GRADIENT OF THE SHARED WEIGHT', GR], 'first part + second part'], GR), ...say('ADD THE TWO PARTS', GR));
  const total = chip('gradient +8', GR, P ? pt(o[0], o[1] - R - 1.6) : pt(inL[0] + 1.1, inL[1] + R + 0.95), 20);
  await until(S(33));
  await play(new M.FadeIn(total), ...panel([['GRADIENT OF THE SHARED WEIGHT', GR], 'first part + second part', ['4 + 4 = 8', GR]], GR), ...say('4 + 4 = 8', GR));

  // ---------- 34–41: the program does it ----------
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(p1, p2, total)), ...panel([['A PROGRAM DOES THIS', C.cyan]]), ...say('A PROGRAM CAN DO ALL OF THIS'));
  await until(S(35));
  await play(...panel([['A PROGRAM DOES THIS', C.cyan], '1. record every step', '   of the forward pass']), ...say('IT RECORDS THE FORWARD PASS'));
  await play(...N.flow(0));
  await play(...N.flow(1));
  await until(S(36));
  await play(new M.Indicate(gOut, { color: GR }), ...panel([['A PROGRAM DOES THIS', C.cyan], '1. record the forward pass', ['2. gradient at output once: −4', GR]]), ...say('GRADIENT AT THE OUTPUT ONCE: −4', GR));
  await until(S(37));
  await play(...panel([['A PROGRAM DOES THIS', C.cyan], '1. record the forward pass', ['2. gradient at output once: −4', GR], ['3. walk back, multiply', GR]]), ...say('WALK BACK, MULTIPLY LOCAL GRADIENTS', GR));
  await back([o, h0], [o, h1]);
  await back([h0, inL], [h1, inR]);
  const p1b = chip('+4', GR, edgePt(N, 0, 0, 0, 0.65, -1), 20), p2b = chip('+4', GR, edgePt(N, 0, 1, 1, 0.65, 1), 20);
  const totalB = chip('gradient +8', GR, total.getCenter(), 20);
  await until(S(38));
  await play(new M.FadeIn(p1b), new M.FadeIn(p2b), new M.FadeIn(totalB),
    ...panel([['A PROGRAM DOES THIS', C.cyan], '1. record the forward pass', ['2. gradient at output once: −4', GR], ['3. walk back, multiply', GR], ['4. add at the shared weight: 8', GR]]),
    ...say('ADD THE PARTS AT THE SHARED WEIGHT', GR));
  await until(S(39));
  await play(...panel([['AUTOMATIC DIFFERENTIATION', C.cyan], 'record, walk back, multiply,', 'add the parts']), ...say('AUTOMATIC DIFFERENTIATION'));
  await until(S(40));
  await play(...panel([['THE GRADIENT (A LIST)', GR], 'one number for each weight', ['shared weight: +8', GR], '... and so on for every weight'], GR), ...say('ALL WEIGHTS TOGETHER: THE GRADIENT', GR));
  await until(S(41));
  await play(...panel([['WHEN IT HELPS', C.cyan], 'many neurons share', 'the same weight']), ...say('USEFUL WHEN WEIGHTS ARE SHARED'));

  // ---------- 42–46: trap, try it, recap ----------
  await until(S(42));
  await play(new M.FadeOut(p2b), ...panel([['COMMON TRAP', C.amber], 'stop after the first path:', ['you count 4', C.pink], ['and miss the other 4', C.pink]], C.amber), ...say('TRAP: ONE PATH = ONLY 4', C.amber));
  await until(S(43));
  await play(new M.FadeOut(new M.VGroup(p1b, totalB)), ...panel([['TRY IT', C.green], 'start tile: blue, blue', 'predict the gradient:', 'add the two parts'], C.green), ...say('TRY IT: ADD THE TWO PARTS', C.green));
  await until(S(44));
  await play(...setW(N, 0, 0, 0, 3, 0.42, 1, 'shared 3', C.amber), ...setW(N, 0, 1, 1, 3, 0.42, -1, 'shared 3', C.amber), ...val(N, 2, 0, '?', C.amber),
    ...panel([['TRY IT', C.green], 'shared weight → 3', 'will the loss rise or fall?'], C.green), ...say('SHARED WEIGHT 3: RISE OR FALL?', C.green));
  await until(S(45));
  await play(...panel([['TRY IT', C.green], 'shared weight → 3', 'compare with the', ['starting loss of 4', C.violet]], C.green), new M.Indicate(lossChip, { color: C.violet }), ...say('COMPARE WITH LOSS 4', C.violet));
  await until(S(46));
  await play(...setW(N, 0, 0, 0, 2, 0.42, 1, 'shared 2', C.amber), ...setW(N, 0, 1, 1, 2, 0.42, -1, 'shared 2', C.amber), ...val(N, 2, 0, -1, C.amber),
    ...panel([['AUTOMATIC DIFFERENTIATION', C.cyan], 'follow every path', 'to the shared weight', ['add the parts: 4 + 4 = 8', GR]]), ...say('EVERY PATH, ADD THE PARTS', GR));
  await back([o, h0], [o, h1]);
  await back([h0, inL], [h1, inR]);
  await until(E(46));
}

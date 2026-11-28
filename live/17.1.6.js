// lesson 17.1.6
// Backpropagation (script v6). Beat i = sentence i (0-based).
// Data sheet: blue–orange, left weight 2: output −1, target 0, error −1, loss 1. Nudge output to −0.9: loss 0.81.
// Gradient at the output 2 × error = −2. Local gradients −1, 1, 1. Running: −2 → +2 → +2 → +2. Loss near w=2 is (1 − w)².
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
  function ln(a, b, color = C.muted, w = 2) { return new M.Line({ start: a, end: b, color, strokeWidth: w }); }
  function chip(s, color, pos, size = 20) { const p = pill(s, color, size); p.moveTo(pos); return p; }
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
  const NC = P ? pt(0, 1.25) : pt(-3.6, -0.9);
  const NW = P ? 5.6 : 4.4, NH = P ? 3.2 : 2.6, R = 0.4;
  function makeNet(layers, center = NC, width = NW, height = NH) {
    const N = L.net({ layers, center, width, height, r: R }); N.vals = {}; N.chips = {}; return N;
  }
  function val(N, l, i, s, col = C.ink) {
    const t = txt(fmt(s), String(s).length > 2 ? 19 : 24, col, N.pos(l, i), true, true), k = l + ':' + i, a = [new M.FadeIn(t)];
    if (N.vals[k]) a.push(new M.FadeOut(N.vals[k])); N.vals[k] = t; return a;
  }
  function edgePt(N, l, i, j, t, side, d = 0.45) {
    const a = N.pos(l, i), b = N.pos(l + 1, j);
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn; if (ny < 0) { nx = -nx; ny = -ny; }
    return pt(a[0] + (b[0] - a[0]) * t + nx * d * side, a[1] + (b[1] - a[1]) * t + ny * d * side);
  }
  function setW(N, l, i, j, w, t = 0.35, side = 1) {
    const c = chip(sg(w), w < 0 ? C.pink : C.cyan, edgePt(N, l, i, j, t, side), 20);
    const k = `${l}:${i}:${j}`, an = [...N.weight(l, i, j, w), new M.FadeIn(c)];
    if (N.chips[k]) an.push(new M.FadeOut(N.chips[k])); N.chips[k] = c; return an;
  }
  const flash = (m, col = C.amber) => new M.Flash(m, { color: col, flashRadius: R + 0.12 });
  const AH = P ? 4.8 : 4.4, CY = PTOP - AH / 2;
  // a gradient pulse: an orange dot travels right to left along a line
  async function back(a, b) {
    const d = new M.Dot({ point: a, radius: 0.12, color: GR });
    await play(new M.FadeIn(d, { runTime: 0.15 }));
    await play(new M.Transform(d, new M.Dot({ point: b, radius: 0.12, color: GR }), { runTime: 0.8 }));
    await play(new M.FadeOut(d, { runTime: 0.15 }));
  }

  // ---------- network ----------
  const N = makeNet([2, 2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), h0 = N.pos(1, 0), h1 = N.pos(1, 1), o = N.pos(2, 0);
  const names = [txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3)), txt('right', 20, ORANGE, pt(inR[0], inR[1] - R - 0.3)),
    txt('left-only', 20, C.cyan, pt(h0[0], h0[1] + R + 0.3)), txt('right-only', 20, C.cyan, pt(h1[0], h1[1] - R - 0.3)), txt('output', 20, C.amber, pt(o[0], o[1] + R + 0.3))];
  const biasO = chip('bias +1', C.violet, pt(o[0], o[1] - R - 0.4), 20);

  // ---------- 0–12: forward pass ----------
  await until(S(0));
  await play(new M.FadeIn(N.group), ...names.map(n => new M.FadeIn(n)), new M.FadeIn(biasO), ...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE),
    ...setW(N, 0, 0, 0, 2, 0.35, 1), ...setW(N, 0, 1, 0, -1, 0.35, -1), ...setW(N, 0, 0, 1, -1, 0.35, 1), ...setW(N, 0, 1, 1, 1, 0.35, -1),
    ...setW(N, 1, 0, 0, -1, 0.3, 1), ...setW(N, 1, 1, 0, -1, 0.3, -1), ...say('BLUE LEFT • ORANGE RIGHT'));
  await until(S(1));
  await play(new M.Indicate(N.chips['0:0:0'], { color: C.amber }), ...panel([['THE WEIGHT WE WATCH', C.amber], 'left → left-only', ['weight = 2', C.cyan]], C.amber), ...say('THIS WEIGHT IS 2', C.amber));
  await until(S(2));
  await play(...panel([['THE QUESTION', C.amber], 'nudge this weight up a little:', 'does the loss get bigger', 'or smaller?'], C.amber), ...say('NUDGE IT UP: LOSS BIGGER OR SMALLER?', C.amber));
  const fw = [['FORWARD PASS', C.cyan]];
  const addF = (s, c = C.ink) => { fw.push([s, c]); return panel(fw); };
  await until(S(3));
  await play(...panel(fw), ...N.flow(0), ...say('FIRST, ONE FORWARD PASS'));
  await until(S(4));
  await play(...addF('left: 1 × 2 = 2', C.cyan), ...say('1 × 2 = 2'));
  await until(S(5));
  await play(...val(N, 1, 0, 2, C.cyan), ...addF('left-only total: 2 + 0 = 2', C.cyan), ...say('LEFT-ONLY TOTAL = 2'));
  await until(S(6));
  await play(...val(N, 1, 0, 2, C.green), flash(N.nodes[1][0], C.green), ...addF('ReLU: 2 → 2', C.green), ...say('POSITIVE: ReLU SENDS 2', C.green));
  await until(S(7));
  await play(...val(N, 1, 1, 0, C.green), ...addF('right-only: −1 → 0', C.green), ...say('RIGHT-ONLY SENDS 0', C.green));
  await until(S(8));
  await play(...N.flow(1), ...val(N, 2, 0, -1, C.amber), ...addF('output: 1 − 2 − 0 = −1', C.amber), ...say('OUTPUT = −1', C.amber));
  await until(S(9));
  await play(...panel([['COMPARE', C.green], ['output = −1', C.amber], ['target = 0', C.green]], C.green), ...say('TARGET = 0', C.green));
  await until(S(10));
  await play(...panel([['COMPARE', C.green], ['output = −1', C.amber], ['target = 0', C.green], ['error = −1 − 0 = −1', C.pink]], C.green), ...say('ERROR = −1', C.pink));
  const lossChip = chip('loss 1', C.violet, pt(o[0], o[1] - R - 1.0), 20);
  await until(S(11));
  await play(new M.FadeIn(lossChip), ...panel([['COMPARE', C.green], ['output = −1', C.amber], ['target = 0', C.green], ['error = −1 − 0 = −1', C.pink], ['loss = (−1) × (−1) = 1', C.violet]], C.green),
    ...say('LOSS = 1', C.violet));

  // ---------- 12–16: nudge the output ----------
  await until(S(12));
  await play(...panel([['NUDGE THE OUTPUT UP BY 0.1', C.amber], 'output: −1 → −0.9'], C.amber), ...val(N, 2, 0, '−0.9', C.amber), ...say('NUDGE THE OUTPUT: +0.1', C.amber));
  await until(S(13));
  await play(...panel([['NUDGE THE OUTPUT UP BY 0.1', C.amber], 'output: −1 → −0.9', ['error: −1 → −0.9', C.pink]], C.amber), ...say('ERROR: −1 → −0.9', C.pink));
  await until(S(14));
  await play(...panel([['NUDGE THE OUTPUT UP BY 0.1', C.amber], 'output: −1 → −0.9', ['error: −1 → −0.9', C.pink], ['loss:  1 → 0.81', C.violet]], C.amber), ...say('LOSS: 1 → 0.81', C.violet));
  await until(S(15));
  await play(...panel([['NUDGE THE OUTPUT UP BY 0.1', C.amber], 'output: −1 → −0.9', ['error: −1 → −0.9', C.pink], ['loss:  1 → 0.81', C.violet], ['loss falls by about 0.2', C.green]], C.amber), ...say('THE LOSS FALLS ABOUT 0.2', C.green));
  await until(S(16));
  await play(...panel([['NUDGE THE OUTPUT UP BY 0.1', C.amber], ['output up 0.1', C.amber], ['loss down 0.2', C.green], 'twice the nudge,', 'the opposite way'], C.amber), ...say('TWICE THE NUDGE, OPPOSITE WAY', C.amber));

  // ---------- 17–24: the loss curve and the gradient ----------
  const UX = (PW - 1.6) / 3.3, UY = (AH - 1.6) / 4.2, OX = PX + 0.95 * UX, OY = CY - AH / 2 + 0.8;
  const gp = (x, y) => pt(OX + x * UX, OY + y * UY);
  const ax = [rr(PW, AH, pt(PX, CY), C.violet), ln(gp(-2.2, 0), gp(1.2, 0), C.muted, 2), ln(gp(0, -0.1), gp(0, 4.1), C.muted, 2)];
  for (const v of [-2, -1, 1]) ax.push(txt(fmt(v), 18, C.muted, pt(OX + v * UX, OY - 0.3), true));
  for (const v of [1, 2, 3, 4]) ax.push(txt(String(v), 18, C.muted, pt(OX + 0.28, OY + v * UY), true));
  ax.push(txt('output →', 18, C.ink, pt(OX + 0.6 * UX, OY - 0.62)), txt('loss', 18, C.violet, pt(OX - 0.55, OY + 4.05 * UY)));
  const curvePts = []; for (let k = 0; k <= 40; k++) { const x = -2 + 3 * k / 40; curvePts.push(gp(x, x * x)); }
  const curve = new M.VGroup(...curvePts.slice(1).map((p, k) => ln(curvePts[k], p, C.violet, 4)));
  const here = new M.Dot({ point: gp(-1, 1), radius: 0.13, color: C.amber });
  let cap = null;
  const setCap = (s, col = C.ink) => { const t = txt(s, 20, col, pt(PX, CY + AH / 2 - 0.33), true); const a = [new M.FadeIn(t)]; if (cap) a.push(new M.FadeOut(cap)); cap = t; return a; };
  await until(S(17));
  await play(...swap(new M.VGroup(...ax)), ...val(N, 2, 0, -1, C.amber), ...setCap('LOSS FOR MANY OUTPUTS', C.violet), ...say('LOSS FOR MANY OUTPUTS: A BOWL', C.violet));
  await play(new M.Create(curve, { runTime: 1.2 }));
  const tang = ln(gp(-1.55, 2.1), gp(-0.5, 0), GR, 4);
  await until(S(18));
  await play(new M.FadeIn(here), new M.Create(tang), ...setCap('AT OUTPUT −1: SLOPES DOWN', C.amber), ...say('AT −1 THE CURVE SLOPES DOWN', C.amber));
  await until(S(19));
  await play(new M.Indicate(tang, { color: GR }), ...setCap('STEEPNESS = THE GRADIENT', GR), ...say('HOW STEEP = THE GRADIENT', GR));
  await until(S(20));
  await play(...setCap('LOSS CHANGE PER STEP UP', GR), ...say('LOSS CHANGE FOR EACH STEP UP', GR));
  const nudged = new M.Dot({ point: gp(-0.9, 0.81), radius: 0.11, color: C.green });
  await until(S(21));
  await play(new M.FadeIn(nudged), ...setCap('ABOUT 2 DOWN PER STEP: GRADIENT −2', GR), ...say('GRADIENT = −2', GR));
  await until(S(22));
  await play(...setCap('NEGATIVE: NUMBER UP → LOSS DOWN', GR), ...say('NEGATIVE: LOSS GOES DOWN', GR));
  await until(S(23));
  await play(...setCap('GRADIENT AT OUTPUT = 2 × ERROR', GR), ...say('GRADIENT AT THE OUTPUT = 2 × ERROR', GR));
  const gOut = chip('−2', GR, pt(o[0] + R + 0.45, o[1]), 20);
  await until(S(24));
  await play(new M.FadeIn(gOut), ...setCap('2 × (−1) = −2', GR), ...say('2 × (−1) = −2, THE SAME', GR));

  // ---------- 25–34: walk backward, local gradients ----------
  await until(S(25));
  await play(new M.FadeOut(new M.VGroup(curve, here, tang, nudged, cap, N.chips['0:0:1'], N.chips['0:1:0'])), ...panel([['WALK BACKWARD', GR], ['gradient at the output: −2', GR]], GR), ...say('NOW WALK BACKWARD FROM THE OUTPUT', GR));
  cap = null;
  await until(S(26));
  await play(...panel([['WALK BACKWARD', GR], ['gradient at the output: −2', GR], 'at each step ask:', 'small increase here → ?'], GR), ...say('SMALL INCREASE HERE → WHAT HAPPENS NEXT?', GR));
  await until(S(27));
  await back(o, h0);
  await play(...panel([['STEP: LEFT-ONLY → OUTPUT', GR], 'weight −1:', 'activation up a little', '→ output down the same'], GR), ...say('ACTIVATION UP → OUTPUT DOWN', GR));
  const gE1 = chip('×(−1)', GR, edgePt(N, 1, 0, 0, 0.5, -1), 19);
  await until(S(28));
  await play(new M.FadeIn(gE1), ...panel([['LOCAL GRADIENT', GR], 'the gradient across one step', ['output step: −1', GR]], GR), ...say('LOCAL GRADIENT = −1', GR));
  await until(S(29));
  await play(flash(N.nodes[1][0], GR), ...panel([['STEP: ReLU', GR], 'total = 2, above 0', 'a small change keeps it above 0'], GR), ...say('ReLU: TOTAL 2 STAYS ABOVE 0', GR));
  await until(S(30));
  await play(...panel([['STEP: ReLU', GR], 'the change passes unchanged', ['ReLU local gradient: 1', GR]], GR), ...say('ReLU LOCAL GRADIENT = 1', GR));
  await until(S(31));
  await play(...panel([['STEP: ADD 0 FROM THE RIGHT', GR], 'adding 0 does not change', 'the size of a change'], GR), ...say('ADDING 0 CHANGES NOTHING', GR));
  await until(S(32));
  await back(h0, inL);
  await play(...panel([['STEP: THE WEIGHT', GR], 'total = weight × left input', 'left input = 1'], GR), ...say('WEIGHT × LEFT INPUT 1', GR));
  await until(S(33));
  await play(...panel([['STEP: THE WEIGHT', GR], 'weight up a little', '→ total up the same'], GR), ...say('WEIGHT UP → TOTAL UP THE SAME', GR));
  const gE0 = chip('×1', GR, edgePt(N, 0, 0, 0, 0.62, -1), 19);
  await until(S(34));
  await play(new M.FadeIn(gE0), ...panel([['STEP: THE WEIGHT', GR], ['local gradient: 1', GR]], GR), ...say('LOCAL GRADIENT = 1', GR));

  // ---------- 35–40: multiply along the path ----------
  const mul = [['MULTIPLY ALONG THE PATH', GR], ['at the output:          −2', GR]];
  await until(S(35));
  await play(...panel(mul, GR), ...say('THE WHOLE BACKWARD WALK', GR));
  await until(S(36));
  await play(...panel([...mul, 'times each local gradient'], GR), ...say('MULTIPLY THE LOCAL GRADIENTS', GR));
  await until(S(37));
  mul.push(['output step: −2 × (−1) = +2', C.ink]);
  await play(...panel(mul, GR), ...say('−2 × (−1) = +2', GR));
  await until(S(38));
  mul.push(['ReLU step:   +2 × 1 = +2', C.ink]);
  await play(...panel(mul, GR), ...say('× 1 FOR ReLU: +2', GR));
  const gW = P ? chip('gradient +2', GR, pt(o[0], o[1] + R + 1.0), 19) : chip('gradient +2', GR, pt(inL[0] + (h0[0] - inL[0]) * 0.5, inL[1] + R + 0.95), 20);
  await until(S(39));
  mul.push(['weight step: +2 × 1 = +2', C.ink], ['gradient of the weight: +2', GR]);
  await play(...panel(mul, GR), new M.FadeIn(gW), ...say('× 1 FOR THE INPUT: +2', GR));

  // ---------- 40–47: name, meaning, trap, try it, recap ----------
  await until(S(40));
  await play(...panel([['BACKPROPAGATION', GR], 'walk back from the loss,', 'multiply the local gradients'], GR), ...say('THIS IS BACKPROPAGATION', GR));
  await back(o, h0);
  await back(h0, inL);
  await until(S(41));
  await play(...panel([['BACKWARD PASS', GR], 'one walk from the loss', 'back to the weights'], GR), ...say('ONE WALK BACK = A BACKWARD PASS', GR));
  await until(S(42));
  await play(...panel([['WHAT +2 TELLS YOU', GR], 'weight up a little', '→ loss gets bigger'], GR), new M.Indicate(gW, { color: GR }), ...say('POSITIVE: WEIGHT UP → LOSS UP', GR));
  await until(S(43));
  await play(...panel([['ONLY NEAR THE START', C.amber], 'it describes the loss', 'near weight 2'], C.amber), ...say('VALID NEAR WEIGHT 2', C.amber));
  await until(S(44));
  await play(...panel([['COMMON SLIP', C.amber], 'do not use it to predict', 'the exact loss after', 'a large change'], C.amber), ...say('NOT FOR LARGE CHANGES', C.amber));
  await until(S(45));
  await play(...setW(N, 0, 0, 0, 1.5, 0.35, 1), ...panel([['TRY IT', C.green], 'weight 2 → 1.5', 'loss goes up or down?'], C.green), ...say('TRY IT: WEIGHT → 1.5', C.green));
  await until(S(46));
  await play(...setW(N, 0, 0, 0, 2.5, 0.35, 1), ...panel([['TRY IT', C.green], 'weight 2 → 2.5', 'loss goes up or down?'], C.green), ...say('THEN: WEIGHT → 2.5', C.green));
  await until(S(47));
  await play(...setW(N, 0, 0, 0, 2, 0.35, 1), ...panel([['BACKPROPAGATION', GR], ['at the output: −2', GR], ['× (−1) × 1 × 1', GR], ['gradient of the weight: +2', GR]], GR),
    ...say('MULTIPLY LOCAL GRADIENTS ALONG THE PATH', GR));
  await back(o, h0);
  await back(h0, inL);
  await until(E(47));
}

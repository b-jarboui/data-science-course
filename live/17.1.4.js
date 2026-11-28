// lesson 17.1.4
// Forward propagation (script v6). Beat i = sentence i (0-based).
// Data sheet: blue–orange: totals 1 and −1, ReLU 1 and 0, output 1 − 1 − 0 = 0. Blue–blue: activations 0 and 0, output 1.
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
  const PX = P ? 0 : 3.75, PTOP = P ? -2.2 : 1.3, PW = P ? 7.4 : 6.3;
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
    const t = txt(fmt(s), 24, col, N.pos(l, i), true, true), k = l + ':' + i, a = [new M.FadeIn(t)];
    if (N.vals[k]) a.push(new M.FadeOut(N.vals[k])); N.vals[k] = t; return a;
  }
  function clr(N, l, i) { const k = l + ':' + i, t = N.vals[k]; delete N.vals[k]; return t ? [new M.FadeOut(t)] : []; }
  function setW(N, l, i, j, w, t = 0.3, side = 1) {
    const a = N.pos(l, i), b = N.pos(l + 1, j);
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn; if (ny < 0) { nx = -nx; ny = -ny; }
    const c = chip(sg(w), w < 0 ? C.pink : C.cyan, pt(a[0] + (b[0] - a[0]) * t + nx * 0.45 * side, a[1] + (b[1] - a[1]) * t + ny * 0.45 * side), 20);
    const k = `${l}:${i}:${j}`, an = [...N.weight(l, i, j, w), new M.FadeIn(c)];
    if (N.chips[k]) an.push(new M.FadeOut(N.chips[k])); N.chips[k] = c; return an;
  }
  const flash = (m, col = C.amber) => new M.Flash(m, { color: col, flashRadius: R + 0.12 });
  const edgeFlash = (e, col = C.amber) => new M.ShowPassingFlash(e, { color: col, strokeWidth: 6, timeWidth: 0.5 });
  const AH = P ? 4.8 : 4.4, CY = PTOP - AH / 2;
  const col = v => v < 0 ? C.pink : v > 0 ? C.cyan : C.ink;

  // ---------- network parts ----------
  const N = makeNet([2, 2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), h0 = N.pos(1, 0), h1 = N.pos(1, 1), o = N.pos(2, 0);
  const nmIn = [txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3)), txt('right', 20, ORANGE, pt(inR[0], inR[1] - R - 0.3))];
  const nmH = [txt('left-only', 20, C.cyan, pt(h0[0], h0[1] + R + 0.3)), txt('right-only', 20, C.cyan, pt(h1[0], h1[1] - R - 0.3))];
  const nmO = txt('output', 20, C.amber, pt(o[0], o[1] + R + 0.3));
  const biasO = chip('bias +1', C.violet, pt(o[0], o[1] - R - 0.4), 20);
  const LY = inR[1] - R - 0.95;
  const layerChips = [chip('input layer', C.violet, pt(inL[0], LY), 19), chip('hidden layer', C.cyan, pt(h0[0], LY), 19), chip('output layer', C.amber, pt(o[0], LY), 19)];
  const hBox = new M.RoundedRectangle({ width: 1.3, height: NH + 1.2, cornerRadius: 0.3, color: C.cyan, strokeWidth: 2 });
  hBox.setFill(C.card, 0); hBox.moveTo(pt(h0[0], NC[1]));

  // ---------- 0–4: the tile and the input layer ----------
  await until(S(0));
  await play(...swap(new M.VGroup(rr(PW, AH, pt(PX, CY), C.amber), txt('A NEW TILE ARRIVES', 21, C.amber, pt(PX, CY + AH / 2 - 0.35), true), tile(1, 0, pt(PX, CY - 0.1), 1.5))),
    ...say('BLUE LEFT • ORANGE RIGHT', C.amber));
  await until(S(1));
  await play(...say('ONE TILE → ONE OUTPUT NUMBER?', C.amber));
  await until(S(2));
  await play(new M.FadeIn(N.nodes[0][0]), new M.FadeIn(N.nodes[0][1]), ...nmIn.map(n => new M.FadeIn(n)), ...say('LEFT ON TOP • RIGHT BELOW'));
  await until(S(3));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE), ...panel([['INPUTS', C.violet], ['left = 1 (blue)', BLUE], ['right = 0 (orange)', ORANGE]], C.violet),
    ...say('LEFT INPUT 1 • RIGHT INPUT 0'));
  await until(S(4));
  await play(new M.FadeIn(N.nodes[1][0]), new M.FadeIn(N.nodes[1][1]), ...nmH.map(n => new M.FadeIn(n)),
    ...N.edges[0].flat().map(e => new M.Create(e)), ...say('TWO HIDDEN NEURONS IN THE NEXT COLUMN'));

  // ---------- 5–13: the hidden layer ----------
  await until(S(5));
  await play(new M.Create(hBox), ...panel([['LAYER', C.cyan], 'a column of neurons', 'that work at the same stage']), ...say('A COLUMN OF NEURONS = A LAYER'));
  await until(S(6));
  await play(new M.FadeOut(hBox), ...setW(N, 0, 0, 0, 1, 0.35, 1), ...setW(N, 0, 1, 0, -1, 0.35, -1), flash(N.nodes[1][0], C.cyan),
    ...panel([['LEFT-ONLY NEURON', C.cyan], 'weights +1 and −1', ['total = left − right', C.cyan]]), ...say('LEFT-ONLY: LEFT − RIGHT'));
  await until(S(7));
  await play(...setW(N, 0, 0, 1, -1, 0.35, 1), ...setW(N, 0, 1, 1, 1, 0.35, -1), flash(N.nodes[1][1], C.cyan),
    ...panel([['RIGHT-ONLY NEURON', C.cyan], 'weights −1 and +1', ['total = right − left', C.cyan]]), ...say('RIGHT-ONLY: RIGHT − LEFT'));
  await until(S(8));
  await play(...N.flow(0), ...say('BOTH READ THE SAME TWO INPUTS'));
  await until(S(9));
  await play(...val(N, 1, 0, 1, C.cyan), ...panel([['HIDDEN TOTALS', C.cyan], ['left-only:  1 − 0 = 1', C.cyan]]), ...say('LEFT-ONLY: 1 − 0 = 1'));
  await until(S(10));
  await play(...val(N, 1, 1, -1, C.pink), ...panel([['HIDDEN TOTALS', C.cyan], ['left-only:  1 − 0 = 1', C.cyan], ['right-only: 0 − 1 = −1', C.pink]]), ...say('RIGHT-ONLY: 0 − 1 = −1', C.pink));
  await until(S(11));
  await play(...panel([['HIDDEN TOTALS', C.cyan], ['left-only:  1 − 0 = 1', C.cyan], ['right-only: 0 − 1 = −1', C.pink], ['ReLU: negative total → 0', C.green]], C.green),
    ...say('EACH HIDDEN NEURON USES ReLU', C.green));
  await until(S(12));
  await play(...val(N, 1, 0, 1, C.green), flash(N.nodes[1][0], C.green), ...say('LEFT-ONLY SENDS 1', C.green));
  await until(S(13));
  await play(...val(N, 1, 1, 0, C.green), flash(N.nodes[1][1], C.green),
    ...panel([['HIDDEN ACTIVATIONS', C.green], ['left-only:  1 → 1', C.green], ['right-only: −1 → 0', C.green]], C.green), ...say('RIGHT-ONLY SENDS 0', C.green));

  // ---------- 14–23: the output layer ----------
  await until(S(14));
  await play(new M.FadeIn(N.nodes[2][0]), new M.FadeIn(nmO), ...N.edges[1].flat().map(e => new M.Create(e)), ...say('ONE LAST NEURON', C.amber));
  await until(S(15));
  await play(...panel([["THE NETWORK'S ANSWER", C.amber], ['1 = match', C.green], ['0 = different colors', C.pink]], C.amber), ...say('1 = MATCH • 0 = DIFFERENT', C.amber));
  await until(S(16));
  await play(...layerChips.map(c => new M.FadeIn(c)), ...say('INPUT • HIDDEN • OUTPUT LAYERS'));
  await until(S(17));
  await play(new M.FadeIn(biasO), ...panel([['OUTPUT NEURON', C.amber], ['bias +1, for any tile', C.violet]], C.amber), ...say('OUTPUT NEURON: BIAS +1', C.violet));
  await until(S(18));
  await play(...setW(N, 1, 0, 0, -1, 0.3, 1), ...setW(N, 1, 1, 0, -1, 0.3, -1),
    ...panel([['OUTPUT NEURON', C.amber], ['bias +1, for any tile', C.violet], ['both weights −1', C.pink]], C.amber), ...say('BOTH WEIGHTS −1', C.pink));
  await until(S(19));
  await play(edgeFlash(N.edges[1][0][0]), ...panel([['OUTPUT NEURON', C.amber], ['start: bias 1', C.violet], ['left-only: 1 × (−1) = −1', C.pink]], C.amber), ...say('1 × (−1): TAKE AWAY 1', C.pink));
  await until(S(20));
  await play(edgeFlash(N.edges[1][1][0]), ...panel([['OUTPUT NEURON', C.amber], ['start: bias 1', C.violet], ['left-only: 1 × (−1) = −1', C.pink], ['right-only: 0 × (−1) = 0', C.ink]], C.amber),
    ...say('0 × (−1): TAKE AWAY NOTHING'));
  await until(S(21));
  await play(...val(N, 2, 0, 0, C.amber), flash(N.nodes[2][0]),
    ...panel([['OUTPUT NEURON', C.amber], ['start: bias 1', C.violet], ['left-only: 1 × (−1) = −1', C.pink], ['right-only: 0 × (−1) = 0', C.ink], ['1 − 1 − 0 = 0', C.amber]], C.amber),
    ...say('1 − 1 = 0', C.amber));
  await until(S(22));
  await play(new M.Indicate(nmO, { color: C.amber }), ...panel([['OUTPUT', C.amber], 'the number that leaves', 'the output layer', ['output = 0', C.amber]], C.amber), ...say('THE NUMBER THAT LEAVES = THE OUTPUT', C.amber));
  await until(S(23));
  await play(...panel([['OUTPUT', C.amber], 'no ReLU in the output neuron:', 'its total goes straight out'], C.amber), ...say('NO ReLU HERE', C.amber));

  // ---------- 24–28: the calculation and the name ----------
  await until(S(24));
  await play(...panel([['OUTPUT NEURON IN ONE LINE', C.amber]], C.amber), ...say('ONE LINE FOR THE OUTPUT NEURON', C.amber));
  await until(S(25));
  await play(...panel([['OUTPUT NEURON IN ONE LINE', C.amber], 'output = 1', ['− left-only activation', C.pink], ['− right-only activation', C.pink]], C.amber), ...say('OUTPUT = 1 − LEFT-ONLY − RIGHT-ONLY', C.amber));
  await until(S(26));
  await play(...panel([['OUTPUT NEURON IN ONE LINE', C.amber], 'output = 1', ['− left-only activation', C.pink], ['− right-only activation', C.pink], ['= 1 − 1 − 0 = 0', C.amber]], C.amber), ...say('1 − 1 − 0 = 0', C.amber));
  await until(S(27));
  await play(flash(N.nodes[0][0], C.violet), flash(N.nodes[0][1], C.violet), ...say('THE CORNER NUMBERS = THE INPUTS', C.violet));
  await until(S(28));
  await play(...panel([['FORWARD PROPAGATION', C.cyan], 'inputs → hidden layer → output', 'one layer after another']), ...say('FORWARD PROPAGATION'));
  await play(...N.flow(0));
  await play(...N.flow(1));

  // ---------- 29–34: blue–blue ----------
  await until(S(29));
  await play(...clr(N, 1, 0), ...clr(N, 1, 1), ...clr(N, 2, 0),
    ...swap(new M.VGroup(rr(PW, AH, pt(PX, CY), C.cyan), txt('ONCE MORE: BLUE, BLUE', 21, C.cyan, pt(PX, CY + AH / 2 - 0.35), true), tile(1, 1, pt(PX, CY - 0.1), 1.5))),
    ...say('ONCE MORE: TWO BLUE CORNERS'));
  await until(S(30));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 1, BLUE), ...say('BOTH INPUTS = 1', BLUE));
  await until(S(31));
  await play(...N.flow(0), ...val(N, 1, 0, 0, C.green), ...panel([['FORWARD PASS: BLUE, BLUE', C.cyan], ['left-only:  1 − 1 = 0 → 0', C.green]]), ...say('LEFT-ONLY: 1 − 1 = 0'));
  await until(S(32));
  await play(...val(N, 1, 1, 0, C.green), ...panel([['FORWARD PASS: BLUE, BLUE', C.cyan], ['left-only:  1 − 1 = 0 → 0', C.green], ['right-only: 1 − 1 = 0 → 0', C.green]]), ...say('RIGHT-ONLY: 1 − 1 = 0'));
  await until(S(33));
  await play(...N.flow(1), ...val(N, 2, 0, 1, C.green),
    ...panel([['FORWARD PASS: BLUE, BLUE', C.cyan], ['left-only:  1 − 1 = 0 → 0', C.green], ['right-only: 1 − 1 = 0 → 0', C.green], ['output = 1 − 0 − 0 = 1', C.amber]]), ...say('OUTPUT = 1: A MATCH', C.green));
  await until(S(34));
  await play(...panel([['FORWARD PASS', C.cyan], 'one trip of the numbers', 'from the inputs to the output']), ...say('ONE TRIP = A FORWARD PASS'));
  await play(...N.flow(0));
  await play(...N.flow(1));

  // ---------- 35–41: use, trap, try it, recap ----------
  await until(S(35));
  await play(...panel([['WHEN TO USE IT', C.cyan], "to get the network's output", 'for one tile']), ...say('USE IT TO GET AN OUTPUT'));
  await until(S(36));
  await play(...panel([['TAKE CARE', C.amber], 'pass on the activations,', 'the numbers AFTER ReLU'], C.amber), ...say('PASS ON THE NUMBERS AFTER ReLU', C.amber));
  await until(S(37));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE), ...val(N, 1, 0, 1, C.green), ...val(N, 1, 1, -1, C.pink), ...clr(N, 2, 0),
    ...panel([['TAKE CARE', C.amber], ['right-only total = −1', C.pink], ['it sends 0, not −1', C.green]], C.amber), ...say('TOTAL −1 → SENDS 0', C.amber));
  await play(...val(N, 1, 1, 0, C.green), flash(N.nodes[1][1], C.green));
  await until(S(38));
  await play(...clr(N, 1, 0), ...clr(N, 1, 1), ...panel([['TRY IT', C.green], 'blue left, orange right'], C.green), ...say('TRY IT: BLUE LEFT, ORANGE RIGHT', C.green));
  await until(S(39));
  await play(...val(N, 1, 1, '?', C.amber), ...panel([['TRY IT', C.green], 'blue left, orange right', 'right-only activation = ?'], C.green), ...say('FIND THE RIGHT-ONLY ACTIVATION', C.green));
  await until(S(40));
  await play(...val(N, 0, 1, 1, BLUE), ...clr(N, 1, 1), ...val(N, 2, 0, '?', C.amber),
    ...panel([['PREDICT FIRST', C.amber], 'turn the orange corner blue', 'output = ?'], C.amber), ...say('PREDICT THE OUTPUT FIRST', C.amber));
  await until(S(41));
  await play(...val(N, 0, 1, 0, ORANGE), ...val(N, 1, 0, 1, C.green), ...val(N, 1, 1, 0, C.green), ...val(N, 2, 0, 0, C.amber),
    ...panel([['FORWARD PROPAGATION', C.cyan], ['input layer: 1, 0', C.violet], ['hidden layer: 1, 0', C.cyan], ['output layer: 0', C.amber]]),
    ...say('INPUTS → LAYERS → OUTPUT'));
  await play(...N.flow(0));
  await play(...N.flow(1));
  await until(E(41));
}

// lesson 17.1.1
// Artificial neurons (script v6). Beat i = sentence i (0-based).
// Data sheet: blue–orange tile, inputs 1 and 0, weights +1 and −1, bias −2, total −1, activation 0.
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
  function corner(v, pos, s = 1) {
    let o;
    if (v) { o = new M.Rectangle({ width: 0.5 * s, height: 0.5 * s, color: BLUE, strokeWidth: 2 }); o.setFill(BLUE, 0.95); }
    else { o = new M.Circle({ radius: 0.27 * s, color: ORANGE, strokeWidth: 2 }); o.setFill(ORANGE, 0.95); }
    o.moveTo(pos); return o;
  }
  function tile(l, r, pos, s = 1) {
    return new M.VGroup(rr(1.9 * s, 1.0 * s, pos, C.muted, 0.9), corner(l, pt(pos[0] - 0.45 * s, pos[1]), s), corner(r, pt(pos[0] + 0.45 * s, pos[1]), s));
  }
  // panel (one at a time): laptop right, phone below the network
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
  // network helpers
  const NC = P ? pt(-0.5, 1.25) : pt(-3.6, -0.9);
  const NW = P ? 4.6 : 4.4, NH = P ? 3.2 : 2.6, R = 0.4;
  function makeNet(layers, center = NC, width = NW, height = NH) {
    const N = L.net({ layers, center, width, height, r: R }); N.vals = {}; return N;
  }
  function val(N, l, i, s, col = C.ink) {
    const t = txt(fmt(s), 24, col, N.pos(l, i), true, true), k = l + ':' + i, a = [new M.FadeIn(t)];
    if (N.vals[k]) a.push(new M.FadeOut(N.vals[k])); N.vals[k] = t; return a;
  }
  function wlab(N, l, i, j, w, t = 0.3, side = 1) {
    const a = N.pos(l, i), b = N.pos(l + 1, j);
    return chip(sg(w), w < 0 ? C.pink : C.cyan, pt(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 0.34 * side), 20);
  }
  const edgeFlash = (e, col = C.amber) => new M.ShowPassingFlash(e, { color: col, strokeWidth: 6, timeWidth: 0.5 });
  const flash = (m, col = C.amber) => new M.Flash(m, { color: col, flashRadius: R + 0.12 });

  // ---------- 0–5: the tile and its two numbers ----------
  const TP = P ? pt(0, 1.6) : pt(-3.4, -0.6);
  const bigTile = tile(1, 0, TP, 1.7);
  const lName = txt('left', 21, BLUE, pt(TP[0] - 0.77, TP[1] + 1.25));
  const rName = txt('right', 21, ORANGE, pt(TP[0] + 0.77, TP[1] + 1.25));
  await until(S(0));
  await play(new M.FadeIn(bigTile), ...say('DO THE TWO CORNERS MATCH?'));

  await until(S(1));
  await play(...panel([['A TINY PART', C.amber], 'two corners go in', 'one useful number comes out'], C.amber),
    ...say('TWO CORNERS → ONE NUMBER', C.amber));

  await until(S(2));
  await play(new M.FadeIn(lName), new M.FadeIn(rName), ...say('BLUE LEFT • ORANGE RIGHT'));

  const one = txt('1', 30, BLUE, pt(TP[0] - 0.77, TP[1] - 1.3), true, true);
  const zero = txt('0', 30, ORANGE, pt(TP[0] + 0.77, TP[1] - 1.3), true, true);
  await until(S(3));
  await play(new M.FadeIn(one), ...say('BLUE = 1', BLUE));
  await until(S(4));
  await play(new M.FadeIn(zero), ...say('ORANGE = 0', ORANGE));
  await until(S(5));
  await play(...panel([['THIS TILE GIVES', C.cyan], ['left corner: blue → 1', BLUE], ['right corner: orange → 0', ORANGE]]),
    ...say('TWO NUMBERS: 1 AND 0'));

  // ---------- 6–9: inputs, the new circle, connections ----------
  const N = makeNet([2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), out = N.pos(1, 0);
  const nmL = txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3));
  const nmR = txt('right', 20, ORANGE, pt(inR[0], inR[1] - R - 0.3));
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(bigTile, lName, rName, one, zero)),
    new M.FadeIn(N.nodes[0][0]), new M.FadeIn(N.nodes[0][1]), new M.FadeIn(nmL), new M.FadeIn(nmR),
    ...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE), ...say('EACH NUMBER IN A CIRCLE'));

  await until(S(7));
  await play(flash(N.nodes[0][0], C.green), flash(N.nodes[0][1], C.green),
    ...panel([['INPUTS', C.green], 'the starting numbers', ['left input = 1', BLUE], ['right input = 0', ORANGE]], C.green),
    ...say('INPUTS = THE STARTING NUMBERS', C.green));

  const outArrow = arrow(pt(out[0] + R + 0.05, out[1]), pt(out[0] + R + 0.85, out[1]), C.green, 3);
  const nmOut = txt('new circle', 20, C.amber, pt(out[0], out[1] + R + 0.3));
  await until(S(8));
  await play(new M.FadeIn(N.nodes[1][0]), new M.FadeIn(nmOut), new M.FadeIn(outArrow),
    new M.Create(N.edges[0][0][0]), new M.Create(N.edges[0][1][0]), ...say('ONE MORE CIRCLE • A LINE FROM EACH INPUT'));

  await until(S(9));
  await play(edgeFlash(N.edges[0][0][0], C.cyan), edgeFlash(N.edges[0][1][0], C.cyan),
    ...panel([['CONNECTION', C.cyan], 'a line between two circles'], C.cyan), ...say('EACH LINE = A CONNECTION'));

  // ---------- 10–15: weights ----------
  await until(S(10));
  await play(...panel([['WEIGHT', C.amber], 'a number on a connection', 'it multiplies the input', 'that travels along the line'], C.amber),
    ...say('EACH CONNECTION CARRIES A WEIGHT', C.amber));

  const wL = wlab(N, 0, 0, 0, 1, 0.42, 1), wR = wlab(N, 0, 1, 0, -1, 0.42, -1);
  await until(S(11));
  await play(...N.weight(0, 0, 0, 1), new M.FadeIn(wL), ...say('LEFT WEIGHT = +1', C.cyan));
  await until(S(12));
  await play(...N.weight(0, 1, 0, -1), new M.FadeIn(wR), ...say('RIGHT WEIGHT = −1', C.pink));
  await until(S(13));
  await play(...panel([['A NEGATIVE WEIGHT', C.pink], 'if its input were 1:', ['1 × (−1) = −1', C.pink], 'it takes 1 away from the total'], C.pink),
    ...say('A NEGATIVE WEIGHT TAKES AWAY', C.pink));
  await until(S(14));
  await play(edgeFlash(N.edges[0][0][0]), ...panel([['WHAT EACH CONNECTION ADDS', C.amber], ['left:  1 × (+1) = 1', C.cyan]], C.amber),
    ...say('LEFT ADDS 1', C.cyan));
  await until(S(15));
  await play(edgeFlash(N.edges[0][1][0]), ...panel([['WHAT EACH CONNECTION ADDS', C.amber], ['left:  1 × (+1) = 1', C.cyan], ['right: 0 × (−1) = 0', C.pink]], C.amber),
    ...say('RIGHT ADDS 0', C.pink));

  // ---------- 16–22: sum and bias ----------
  await until(S(16));
  await play(...N.flow(0), flash(N.nodes[1][0]), ...say('BOTH MEET INSIDE THE NEW CIRCLE', C.amber));
  await until(S(17));
  await play(...val(N, 1, 0, 1, C.amber), ...panel([['WHAT EACH CONNECTION ADDS', C.amber], ['left:  1 × (+1) = 1', C.cyan], ['right: 0 × (−1) = 0', C.pink], ['sum = 1 + 0 = 1', C.amber]], C.amber),
    ...say('SUM = 1', C.amber));

  // number line panel for the bias
  const NLc = pt(PX, PTOP - 1.5), u = P ? 1.4 : 1.25;
  const nx = v => NLc[0] + v * u, ny = NLc[1] - 0.35;
  const nlParts = [rr(PW, 3.0, NLc, C.violet), txt('ADD A FIXED NUMBER', 21, C.violet, pt(NLc[0], NLc[1] + 1.1), true),
    ln(pt(nx(-2) - 0.3, ny), pt(nx(2) + 0.3, ny), C.muted, 3)];
  for (const v of [-2, -1, 0, 1, 2]) nlParts.push(ln(pt(nx(v), ny - 0.1), pt(nx(v), ny + 0.1), C.muted, 2), txt(fmt(v), 20, v === 0 ? C.ink : C.muted, pt(nx(v), ny - 0.42), true));
  const nlPanel = new M.VGroup(...nlParts);
  const dot = new M.Dot({ point: pt(nx(1), ny), radius: 0.14, color: C.amber });
  await until(S(18));
  await play(...swap(nlPanel), new M.FadeIn(dot), ...say('ADD ONE FIXED NUMBER', C.violet));
  await until(S(19));
  await play(...say('THE SAME NUMBER FOR EVERY TILE', C.violet));
  const biasChip = chip('bias −2', C.violet, pt(out[0], out[1] - R - 0.4), 20);
  await until(S(20));
  await play(new M.FadeIn(biasChip), ...say('THIS FIXED NUMBER = BIAS', C.violet));
  const shiftArr = arrow(pt(nx(1), ny + 0.5), pt(nx(-1), ny + 0.5), C.violet, 3);
  await until(S(21));
  await play(new M.Create(shiftArr), new M.Transform(dot, new M.Dot({ point: pt(nx(-1), ny), radius: 0.14, color: C.violet }), { runTime: 1.2 }),
    ...say('BIAS = −2: TWO STEPS DOWN', C.violet));
  await until(S(22));
  await play(new M.FadeOut(new M.VGroup(dot, shiftArr)), ...val(N, 1, 0, -1, C.violet),
    ...panel([['TOTAL', C.violet], 'sum + bias', ['1 + (−2) = −1', C.violet]], C.violet), ...say('START AT 1 → END AT −1', C.violet));

  // ---------- 23–29: activation function, activation, neuron ----------
  await until(S(23));
  await play(...panel([['ONE RULE BEFORE SENDING', C.green], 'total → rule → number sent out'], C.green), ...say('ONE RULE BEFORE IT SENDS', C.green));
  await until(S(24));
  await play(...panel([['THE RULE', C.green], ['total below 0 → 0', C.pink]], C.green), ...say('BELOW ZERO → ZERO', C.green));
  await until(S(25));
  await play(...panel([['THE RULE', C.green], ['total below 0 → 0', C.pink], ['total 0 or more → unchanged', C.cyan]], C.green), ...say('ZERO OR MORE → UNCHANGED', C.green));
  const outVal = txt('0', 26, C.green, pt(out[0] + R + 1.15, out[1]), true, true);
  await until(S(26));
  await play(...val(N, 1, 0, 0, C.green), new M.FadeIn(outVal), flash(N.nodes[1][0], C.green),
    ...panel([['THE RULE', C.green], ['total below 0 → 0', C.pink], ['total 0 or more → unchanged', C.muted], ['our total −1 → 0', C.green]], C.green),
    ...say('OUR −1 BECOMES 0', C.green));
  await until(S(27));
  await play(...panel([['ACTIVATION FUNCTION', C.green], 'the rule a neuron applies', 'to its total before sending', ['here: below 0 → 0', C.green]], C.green),
    ...say('THIS RULE = ACTIVATION FUNCTION', C.green));
  await until(S(28));
  await play(new M.Indicate(outVal, { color: C.green }), ...panel([['ACTIVATION', C.green], 'the number the circle sends out', ['here: activation = 0', C.green]], C.green),
    ...say('THE NUMBER SENT OUT = ACTIVATION', C.green));
  const nmNeuron = txt('neuron', 20, C.amber, nmOut.getCenter());
  await until(S(29));
  await play(new M.FadeOut(nmOut), new M.FadeIn(nmNeuron), flash(N.nodes[1][0], C.cyan),
    ...panel([['ARTIFICIAL NEURON', C.cyan], ['1. weight each input', C.amber], ['2. add them up', C.amber], ['3. add the bias', C.violet], ['4. apply the activation function', C.green], ['→ one activation', C.green]]),
    ...say('THE WHOLE CIRCLE = A NEURON'));

  // ---------- 30–33: the calculation ----------
  await until(S(30));
  await play(...panel([['THE CALCULATION', C.cyan], 'weights → sum → bias → rule']), ...say('A SHORT CALCULATION'));
  await until(S(31));
  await play(...panel([['total =', C.ink], ['left input × left weight', C.amber], ['+ right input × right weight', C.amber], ['+ bias', C.violet]], C.amber),
    ...say('INPUT × WEIGHT, ADDED, PLUS BIAS', C.amber));
  await until(S(32));
  await play(...panel([['total =', C.ink], ['1 × 1', C.cyan], ['+ 0 × (−1)', C.pink], ['+ (−2)', C.violet]], C.amber), ...say('OUR TILE, OUR WEIGHTS, OUR BIAS'));
  await until(S(33));
  await play(...panel([['total = 1 + 0 − 2 = −1', C.violet], ['activation = 0', C.green]], C.green), flash(N.nodes[1][0], C.green),
    ...say('TOTAL −1 → ACTIVATION 0', C.green));

  // ---------- 34: many neurons = a neural network ----------
  const BC = P ? pt(0, -4.4) : pt(PX, -1.25);
  const big = L.net({ layers: [2, 3, 3, 1], center: BC, width: P ? 5.6 : 5.0, height: 2.6, r: 0.28 });
  const bigName = txt('NEURAL NETWORK', 22, C.cyan, pt(BC[0], BC[1] + 1.9), true, true);
  const bigFrame = rr(PW, 4.5, pt(BC[0], BC[1] + 0.2), C.cyan, 0.95);
  await until(S(34));
  await play(...swap(null), new M.FadeIn(bigFrame), new M.FadeIn(big.group), new M.FadeIn(bigName), ...say('MANY NEURONS IN COLUMNS = A NEURAL NETWORK'));
  await play(...big.flow(0));
  await play(...big.flow(1));
  await play(...big.flow(2));

  // ---------- 35–40: use, trap, try it, recap ----------
  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(bigFrame, big.group, bigName)),
    ...panel([['WHAT A NEURON IS FOR', C.cyan], 'several inputs → one number'], C.cyan), ...N.flow(0), ...say('SEVERAL INPUTS → ONE NUMBER'));
  const slipChip = chip('bias forgotten', C.amber, biasChip.getCenter(), 20);
  await until(S(36));
  await play(new M.FadeOut(biasChip), new M.FadeIn(slipChip),
    ...panel([['COMMON SLIP', C.amber], 'sum = 1 + 0 = 1', ['bias −2 forgotten', C.pink], 'the rule gets 1'], C.amber),
    ...say('DO NOT FORGET THE BIAS', C.amber));
  const outVal1 = txt('1', 26, C.amber, outVal.getCenter(), true, true);
  await until(S(37));
  await play(...val(N, 1, 0, 1, C.amber), new M.FadeOut(outVal), new M.FadeIn(outVal1), flash(N.nodes[1][0], C.amber),
    ...say('SLIP: 1 INSTEAD OF 0', C.amber));
  const bias0 = chip('bias 0', C.violet, biasChip.getCenter(), 20);
  await until(S(38));
  await play(new M.FadeOut(slipChip), new M.FadeIn(bias0),
    ...panel([['TRY IT', C.green], 'same tile: inputs 1 and 0', ['new bias: 0', C.violet], 'move it and watch the activation'], C.green),
    ...say('TRY IT: MOVE THE BIAS TO 0', C.green));
  const q = txt('?', 26, C.amber, outVal.getCenter(), true, true);
  const biasBack = chip('bias −2', C.violet, biasChip.getCenter(), 20);
  await until(S(39));
  await play(new M.FadeOut(bias0), new M.FadeIn(biasBack), ...val(N, 1, 0, '?', C.amber), new M.FadeOut(outVal1), new M.FadeIn(q),
    ...panel([['PREDICT FIRST', C.amber], ['bias back to −2', C.violet], 'activation = ?'], C.amber), ...say('PREDICT BEFORE YOU MOVE IT BACK', C.amber));
  const outVal0 = txt('0', 26, C.green, outVal.getCenter(), true, true);
  await until(S(40));
  await play(...val(N, 1, 0, 0, C.green), new M.FadeOut(q), new M.FadeIn(outVal0),
    ...panel([['ARTIFICIAL NEURON', C.cyan], ['1 × 1 + 0 × (−1) = 1', C.amber], ['1 + (−2) = −1', C.violet], ['activation: −1 → 0', C.green]]),
    ...say('WEIGHTS • BIAS • ACTIVATION FUNCTION', C.green));
  await until(E(40));
}

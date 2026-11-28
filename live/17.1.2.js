// lesson 17.1.2
// Nonlinear activations (script v6). Beat i = sentence i (0-based).
// Data sheet: left-only neuron (weights +1, −1, bias 0). Totals −1, 0, 1 for orange–blue, orange–orange, blue–orange; ReLU gives 0, 0, 1.
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
  const flash = (m, col = C.amber) => new M.Flash(m, { color: col, flashRadius: R + 0.12 });

  // the panel area as a drawing space
  const AH = P ? 4.8 : 4.4, CY = PTOP - AH / 2;
  const frame = (title, color = C.cyan) => [rr(PW, AH, pt(PX, CY), color), txt(title, 21, color, pt(PX, CY + AH / 2 - 0.35), true)];

  // ---------- network: the left-only neuron ----------
  const N = makeNet([2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), out = N.pos(1, 0);
  const nmL = txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3));
  const nmR = txt('right', 20, ORANGE, pt(inR[0], inR[1] - R - 0.3));
  const nmOut = txt('left-only neuron', 20, C.amber, pt(out[0] - 0.3, out[1] + R + 0.3));
  const outArrow = arrow(pt(out[0] + R + 0.05, out[1]), pt(out[0] + R + 0.85, out[1]), C.green, 3);
  const wL = wlab(N, 0, 0, 0, 1, 0.42, 1), wR = wlab(N, 0, 1, 0, -1, 0.42, -1);
  const biasChip = chip('bias 0', C.violet, pt(out[0], out[1] - R - 0.4), 20);
  let outVal = null;
  const setOut = (v, col = C.green) => { const t = txt(fmt(v), 26, col, pt(out[0] + R + 1.15, out[1]), true, true); const a = [new M.FadeIn(t)]; if (outVal) a.push(new M.FadeOut(outVal)); outVal = t; return a; };

  await until(S(0));
  await play(new M.FadeIn(N.group), new M.FadeIn(nmL), new M.FadeIn(nmR), new M.FadeIn(nmOut), new M.FadeIn(outArrow),
    ...swap(new M.VGroup(...frame('THE TILE WE WANT', C.amber), tile(1, 0, pt(PX, CY - 0.1), 1.4))),
    ...say('REACT TO: BLUE LEFT, ORANGE RIGHT', C.amber));
  await until(S(1));
  await play(...say('ZERO FOR EVERY OTHER TILE?', C.amber));

  // ---------- 2–10: three tiles and their totals ----------
  const tx = [-2.05, 0, 2.05].map(d => PX + d * (P ? 1.15 : 1));
  const tiles = [[0, 1], [0, 0], [1, 0]].map(([a, b], k) => tile(a, b, pt(tx[k], CY + 0.6), 0.8));
  const nums = [[0, 1], [0, 0], [1, 0]].map(([a, b], k) => txt(`${a}, ${b}`, 22, C.ink, pt(tx[k], CY - 0.3), true));
  const tots = [-1, 0, 1].map((v, k) => txt(`total ${fmt(v)}`, 21, v < 0 ? C.pink : v > 0 ? C.cyan : C.ink, pt(tx[k], CY - 1.05), true));
  const tileFrame = frame('THREE TILES');
  await until(S(2));
  await play(...swap(new M.VGroup(...tileFrame)), ...say('READ LEFT CORNER, THEN RIGHT'));
  await until(S(3));
  await play(new M.FadeIn(tiles[0]), ...say('ORANGE THEN BLUE'));
  await until(S(4));
  await play(new M.FadeIn(tiles[1]), ...say('TWO ORANGE CORNERS', ORANGE));
  await until(S(5));
  await play(new M.FadeIn(tiles[2]), ...say('BLUE THEN ORANGE', BLUE));
  await until(S(6));
  await play(...nums.map(n => new M.FadeIn(n)), ...say('BLUE = 1 • ORANGE = 0'));
  await until(S(7));
  await play(...N.weight(0, 0, 0, 1), ...N.weight(0, 1, 0, -1), new M.FadeIn(wL), new M.FadeIn(wR), new M.FadeIn(biasChip),
    ...say('WEIGHTS +1 AND −1 • BIAS 0', C.violet));
  const runTile = async (k, a, b, v) => {
    await play(...val(N, 0, 0, a, a ? BLUE : ORANGE), ...val(N, 0, 1, b, b ? BLUE : ORANGE), new M.Indicate(tiles[k], { color: C.amber }),
      ...say(`${a} − ${b} = ${fmt(v)}`, v < 0 ? C.pink : C.cyan));
    await play(...N.flow(0), ...val(N, 1, 0, v, v < 0 ? C.pink : C.cyan), new M.FadeIn(tots[k]));
  };
  await until(S(8)); await runTile(0, 0, 1, -1);
  await until(S(9)); await runTile(1, 0, 0, 0);
  await until(S(10)); await runTile(2, 1, 0, 1);

  // ---------- 11–15: the floor at zero ----------
  const floorY = CY - 0.35, U = 0.85;
  const colIcons = [[0, 1], [0, 0], [1, 0]].map(([a, b], k) => tile(a, b, pt(tx[k], CY + 1.3), 0.6));
  const zeroLine = ln(pt(PX - PW / 2 + 0.4, floorY), pt(PX + PW / 2 - 0.4, floorY), C.muted, 1.5);
  const zeroTag = txt('0', 18, C.muted, pt(PX - PW / 2 + 0.22, floorY), true);
  const dots = [-1, 0, 1].map((v, k) => new M.Dot({ point: pt(tx[k], floorY + v * U), radius: 0.14, color: v < 0 ? C.pink : v > 0 ? C.cyan : C.ink }));
  const dlab = [-1, 0, 1].map((v, k) => txt(fmt(v), 22, v < 0 ? C.pink : v > 0 ? C.cyan : C.ink, pt(tx[k] + 0.45, floorY + v * U + (v === 0 ? 0.3 : 0)), true, true));
  await until(S(11));
  await play(new M.FadeOut(new M.VGroup(...tiles, ...nums, ...tots)), ...swap(new M.VGroup(rr(PW, AH, pt(PX, CY), C.cyan), ...colIcons, zeroLine, zeroTag)),
    ...dots.map(d => new M.FadeIn(d)), ...dlab.map(d => new M.FadeIn(d)), ...say('TOTALS: −1, 0, 1'));
  const floor = ln(pt(PX - PW / 2 + 0.4, floorY), pt(PX + PW / 2 - 0.4, floorY), C.green, 5);
  await until(S(12));
  await play(new M.Create(floor), ...say('A FLOOR AT ZERO', C.green));
  await until(S(13));
  await play(new M.Transform(dots[0], new M.Dot({ point: pt(tx[0], floorY), radius: 0.14, color: C.green }), { runTime: 1 }),
    new M.Transform(dlab[0], txt('0', 22, C.green, pt(tx[0] + 0.45, floorY + 0.3), true, true), { runTime: 1 }),
    ...say('−1 IS LIFTED TO 0', C.green));
  await until(S(14));
  await play(new M.Indicate(dots[1], { color: C.green }), ...say('0 STAYS 0'));
  await until(S(15));
  await play(new M.Indicate(dots[2], { color: C.cyan }), ...say('1 STAYS 1', C.cyan));

  // ---------- 16–18: name ----------
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...dots, ...dlab, floor)),
    ...panel([['ACTIVATION FUNCTION', C.green], 'the rule: total → activation', ['−1 → 0', C.green], ['0 → 0', C.green], ['1 → 1', C.green]], C.green),
    ...setOut(1), ...say('REMEMBER: ACTIVATION FUNCTION', C.green));
  await until(S(17));
  await play(...panel([['ReLU', C.green], 'rectified linear unit', 'negative total → 0', 'positive total → kept'], C.green), ...say('THIS ONE IS CALLED ReLU', C.green));
  await until(S(18));
  await play(...say('SAY IT: REE-LOO', C.green));

  // ---------- 19–30: the ReLU graph ----------
  const UX = P ? 1.45 : 1.2, UY = 0.95, OX = PX, OY = CY - 1.25;
  const gp = (x, y) => pt(OX + x * UX, OY + y * UY);
  const axes = [ln(gp(-2.3, 0), gp(2.3, 0), C.muted, 2), ln(gp(0, -0.15), gp(0, 2.3), C.muted, 2)];
  for (const v of [-2, -1, 1, 2]) axes.push(txt(fmt(v), 18, C.muted, pt(OX + v * UX, OY - 0.32), true));
  for (const v of [1, 2]) axes.push(txt(String(v), 18, C.muted, pt(OX - 0.3, OY + v * UY), true));
  axes.push(txt('0', 18, C.muted, pt(OX - 0.3, OY - 0.3), true));
  const xName = txt('total →', 19, C.ink, pt(OX + 1.6 * UX, OY - 0.75));
  const yName = txt('activation ↑', 19, C.ink, pt(OX - 1.25, OY + 2.2 * UY));
  const gBox = rr(PW, AH, pt(PX, CY), C.cyan);
  let cap = null;
  const setCap = (s, col = C.ink) => { const t = txt(s, 21, col, pt(PX, CY + AH / 2 - 0.35), true); const a = [new M.FadeIn(t)]; if (cap) a.push(new M.FadeOut(cap)); cap = t; return a; };
  await until(S(19));
  await play(...swap(new M.VGroup(gBox, ...axes)), new M.FadeIn(xName), ...setCap('THE ReLU PICTURE', C.cyan), ...say('TOTAL ALONG THE BOTTOM'));
  await until(S(20));
  await play(new M.FadeIn(yName), ...say('ACTIVATION UP THE SIDE'));
  const d1 = new M.Dot({ point: gp(-1, 0), radius: 0.13, color: C.pink });
  const d2 = new M.Dot({ point: gp(0, 0), radius: 0.13, color: C.ink });
  const d3 = new M.Dot({ point: gp(1, 1), radius: 0.13, color: C.cyan });
  await until(S(21)); await play(new M.FadeIn(d1), ...setCap('total −1 → activation 0', C.pink), ...say('−1 → 0', C.pink));
  await until(S(22)); await play(new M.FadeIn(d2), ...setCap('total 0 → activation 0'), ...say('0 → 0'));
  await until(S(23)); await play(new M.FadeIn(d3), ...setCap('total 1 → activation 1', C.cyan), ...say('1 → 1', C.cyan));
  const stepA = arrow(gp(-1, 0.35), gp(0, 0.35), C.amber, 3);
  await until(S(24)); await play(new M.Create(stepA), ...setCap('total: up by 1', C.amber), ...say('TOTAL +1', C.amber));
  await until(S(25)); await play(...setCap('activation: stays 0', C.pink), ...say('ACTIVATION +0', C.pink));
  const stepB = ln(gp(0, -0.0), gp(1, 0), C.amber, 3), stepC = arrow(gp(1, 0), gp(1, 0.95), C.green, 3);
  await until(S(26)); await play(new M.FadeOut(stepA), new M.Create(stepB), ...setCap('total: up by 1 again', C.amber), ...say('TOTAL +1 AGAIN', C.amber));
  await until(S(27)); await play(new M.Create(stepC), ...setCap('activation: up by 1', C.green), ...say('ACTIVATION +1', C.green));
  const flat = ln(gp(-2.2, 0), gp(0, 0), C.green, 5), rise = ln(gp(0, 0), gp(2.2, 2.2), C.green, 5);
  await until(S(28)); await play(new M.FadeOut(new M.VGroup(stepB, stepC)), new M.Create(flat), ...setCap('below 0: flat at 0', C.green), ...say('BELOW ZERO: FLAT', C.green));
  await until(S(29)); await play(new M.Create(rise), ...setCap('above 0: up 1 for each 1 across', C.green), ...say('ABOVE ZERO: RISES', C.green));
  const bend = new M.Circle({ radius: 0.3, color: C.amber, strokeWidth: 3 }); bend.moveTo(gp(0, 0));
  await until(S(30)); await play(new M.Create(bend), ...setCap('a bend at 0', C.amber), ...say('A BEND AT ZERO', C.amber));

  // ---------- 31–32: linear vs nonlinear ----------
  const straight = new M.DashedLine({ start: gp(-2.2, -0.15), end: gp(2.2, 2.0), color: C.violet, strokeWidth: 3 });
  await until(S(31)); await play(new M.Create(straight), ...setCap('one straight line = linear', C.violet), ...say('ONE STRAIGHT LINE = LINEAR', C.violet));
  await until(S(32)); await play(new M.FadeOut(straight), new M.Indicate(bend, { color: C.amber }), ...setCap('a bend = nonlinear', C.amber), ...say('A BEND = NONLINEAR', C.amber));

  // ---------- 33–36: the calculation ----------
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(d1, d2, d3, flat, rise, bend, xName, yName, cap)), ...panel([['ReLU AS A CALCULATION', C.green]], C.green), ...say('ReLU AS A CALCULATION', C.green));
  cap = null;
  await until(S(34));
  await play(...panel([['ReLU AS A CALCULATION', C.green], 'activation =', ['larger of 0 and the total', C.green]], C.green), ...say('LARGER OF 0 AND THE TOTAL', C.green));
  await until(S(35));
  await play(...panel([['ReLU AS A CALCULATION', C.green], 'activation =', ['larger of 0 and the total', C.green], ['larger of 0 and −1 → 0', C.pink]], C.green), ...say('TOTAL −1 → 0', C.pink));
  await until(S(36));
  await play(...panel([['ReLU AS A CALCULATION', C.green], 'activation =', ['larger of 0 and the total', C.green], ['larger of 0 and −1 → 0', C.pink], ['larger of 0 and 1  → 1', C.cyan]], C.green), ...say('TOTAL 1 → 1', C.cyan));

  // ---------- 37–39: why the bend matters ----------
  await until(S(37));
  await play(...panel([['WHY DOES THE BEND MATTER?', C.amber]], C.amber), ...say('WHY THE BEND MATTERS', C.amber));
  // no bend: line after line is still a line
  const axes2 = [ln(gp(-2.3, 0), gp(2.3, 0), C.muted, 2), ln(gp(0, -0.15), gp(0, 2.3), C.muted, 2)];
  const s1 = ln(gp(-2.2, 0.2), gp(2.2, 1.3), C.violet, 4), s2 = ln(gp(-2.2, 0.6), gp(2.2, 2.0), C.violet, 4);
  const pts = [[-1.5, 1.5], [0, 0.3], [1.5, 1.5]].map(([x, y]) => new M.Dot({ point: gp(x, y), radius: 0.15, color: C.amber }));
  let cap2 = txt('no bend + no bend = still straight', 20, C.violet, pt(PX, CY + AH / 2 - 0.35), true);
  await until(S(38));
  await play(...swap(new M.VGroup(rr(PW, AH, pt(PX, CY), C.violet), ...axes2)), new M.FadeIn(cap2), new M.Create(s1), ...say('NO BEND, JOINED: STILL STRAIGHT', C.violet));
  await play(new M.Transform(s1, ln(gp(-2.2, 0.6), gp(2.2, 2.0), C.violet, 4), { runTime: 1 }));
  const vee = new M.VGroup(ln(gp(-2, 2), gp(0, 0.3), C.green, 5), ln(gp(0, 0.3), gp(2, 2), C.green, 5));
  const cap3 = txt('a bend can fit this pattern', 20, C.green, pt(PX, CY + AH / 2 - 0.35), true);
  await until(S(39));
  await play(...pts.map(p => new M.FadeIn(p)), new M.FadeOut(cap2), new M.FadeIn(cap3), ...say('NO STRAIGHT LINE HITS ALL THREE', C.amber));
  await play(new M.FadeOut(s1), new M.Create(vee), ...say('THE BEND LETS A NETWORK LEARN IT', C.green));

  // ---------- 40–45: trap, try it, recap ----------
  await until(S(40));
  await play(new M.FadeOut(new M.VGroup(...pts, vee, cap3)),
    ...panel([['COMMON TRAP', C.amber], 'ReLU is NOT an on/off switch', 'it does not always send 1'], C.amber), ...say('TRAP: ReLU IS NOT A SWITCH', C.amber));
  await until(S(41));
  await play(...panel([['COMMON TRAP', C.amber], 'ReLU is NOT an on/off switch', ['total 2 → activation 2', C.green], ['not 1', C.pink]], C.amber),
    ...val(N, 1, 0, 2, C.cyan), ...setOut(2), ...say('TOTAL 2 → 2, NOT 1', C.green));
  await until(S(42));
  await play(...val(N, 0, 0, '?', C.amber), ...val(N, 0, 1, '?', C.amber), ...val(N, 1, 0, -1, C.pink), ...setOut(0),
    ...panel([['TRY IT', C.green], 'pick corner colors that give', ['total −1', C.pink], 'then check the activation'], C.green), ...say('TRY IT: MAKE A TOTAL OF −1', C.green));
  await until(S(43));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE), ...val(N, 1, 0, 1, C.cyan), ...setOut(1),
    ...panel([['TRY IT', C.green], 'start: blue left, orange right', 'inputs 1 and 0'], C.green), ...say('START: BLUE LEFT, ORANGE RIGHT', C.green));
  await until(S(44));
  await play(...val(N, 0, 1, 1, BLUE), ...val(N, 1, 0, '?', C.amber), ...setOut('?', C.amber),
    ...panel([['PREDICT FIRST', C.amber], 'right corner → blue', 'activation = ?'], C.amber), ...say('PREDICT: RIGHT CORNER BLUE', C.amber));
  await until(S(45));
  await play(...val(N, 0, 1, 0, ORANGE), ...val(N, 1, 0, 1, C.cyan), ...setOut(1),
    ...panel([['ReLU', C.green], ['negative total → 0', C.pink], ['positive total → kept', C.cyan], ['a bend at 0 = nonlinear', C.amber]], C.green),
    ...say('ReLU: A BEND AT ZERO', C.green));
  await until(E(45));
}

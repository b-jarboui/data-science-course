// lesson 17.1.3
// Hidden representations (script v6). Beat i = sentence i (0-based).
// Data sheet: hidden activations (0,0), (0,1), (1,0), (0,0); sums 0, 1, 1, 0; outputs 1, 0, 0, 1. Without ReLU every output is 1.
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
  const AH = P ? 4.8 : 4.4, CY = PTOP - AH / 2;

  // ---------- 0–15: the four tiles on a square ----------
  const N1 = makeNet([2, 1]);
  const n1Names = [txt('left', 20, BLUE, pt(N1.pos(0, 0)[0], N1.pos(0, 0)[1] + R + 0.3)), txt('right', 20, ORANGE, pt(N1.pos(0, 1)[0], N1.pos(0, 1)[1] - R - 0.3)),
    txt('one neuron', 20, C.amber, pt(N1.pos(1, 0)[0], N1.pos(1, 0)[1] + R + 0.3))];
  const DX = P ? 1.15 : 0.95, DY = 0.85, G = pt(PX + (P ? 0.55 : 0.6), CY - 0.15);
  const cell = (l, r) => pt(G[0] + (l ? DX : -DX), G[1] + (r ? DY : -DY));
  const sqTitle = txt('THE FOUR TILES', 21, C.cyan, pt(PX, CY + AH / 2 - 0.35), true);
  const sqFrame = rr(PW, AH, pt(PX, CY), C.cyan);
  const T4 = {}; for (const l of [0, 1]) for (const r of [0, 1]) T4[`${l}${r}`] = tile(l, r, cell(l, r), 0.66);
  const colL = [txt('left orange', 18, ORANGE, pt(G[0] - DX, G[1] - DY - 0.62)), txt('left blue', 18, BLUE, pt(G[0] + DX, G[1] - DY - 0.62))];
  const rowL = [txt('right blue', 18, BLUE, pt(G[0] - DX - 1.55, G[1] + DY)), txt('right orange', 18, ORANGE, pt(G[0] - DX - 1.55, G[1] - DY))];
  await until(S(0));
  await play(new M.FadeIn(N1.group), ...n1Names.map(n => new M.FadeIn(n)), ...val(N1, 1, 0, '?', C.amber), ...swap(new M.VGroup(sqFrame, sqTitle)),
    ...say('FIND EVERY MATCHING TILE'));
  const cells = [];
  for (const l of [0, 1]) for (const r of [0, 1]) {
    const c = new M.RoundedRectangle({ width: 1.55, height: 0.95, cornerRadius: 0.12, color: C.muted, strokeWidth: 1.5 });
    c.setFill(C.card, 0); c.moveTo(cell(l, r)); cells.push(c);
  }
  await until(S(1));
  await play(...cells.map(c => new M.Create(c)), ...say('FOUR TILES IN A SQUARE'));
  await until(S(2));
  await play(new M.FadeIn(T4['00']), new M.FadeIn(T4['01']), new M.FadeIn(colL[0]), ...say('LEFT ORANGE → LEFT COLUMN', ORANGE));
  await until(S(3));
  await play(new M.FadeIn(T4['10']), new M.FadeIn(T4['11']), new M.FadeIn(colL[1]), ...say('LEFT BLUE → RIGHT COLUMN', BLUE));
  await until(S(4));
  await play(new M.FadeIn(rowL[1]), new M.Indicate(T4['00']), new M.Indicate(T4['10']), ...say('RIGHT ORANGE → BOTTOM ROW', ORANGE));
  await until(S(5));
  await play(new M.FadeIn(rowL[0]), new M.Indicate(T4['01']), new M.Indicate(T4['11']), ...say('RIGHT BLUE → TOP ROW', BLUE));
  const matchStr = ln(cell(0, 0), cell(1, 1), C.green, 5), mixStr = ln(cell(0, 1), cell(1, 0), C.pink, 5);
  await until(S(6));
  await play(new M.Indicate(T4['00'], { color: C.green }), new M.Indicate(T4['11'], { color: C.green }), ...say('MATCHES: ON ONE DIAGONAL', C.green));
  await until(S(7));
  await play(new M.Indicate(T4['01'], { color: C.pink }), new M.Indicate(T4['10'], { color: C.pink }), ...say('MIXED: ON THE OTHER DIAGONAL', C.pink));
  const cut = ln(pt(G[0], G[1] + 1.6), pt(G[0], G[1] - 1.6), C.amber, 4);
  await until(S(8));
  await play(new M.Create(cut), ...say('ONE STRAIGHT CUT?', C.amber));
  await play(new M.Transform(cut, ln(pt(G[0] - 1.9, G[1] + 0.6), pt(G[0] + 1.9, G[1] - 0.6), C.amber, 4), { runTime: 1.2 }));
  await until(S(9));
  await play(new M.FadeOut(cut), new M.Create(mixStr), ...say('A STRING BETWEEN THE MIXED TILES', C.pink));
  await until(S(10));
  await play(new M.Create(matchStr), ...say('A STRING BETWEEN THE MATCHES', C.green));
  await until(S(11));
  await play(new M.Indicate(mixStr, { color: C.pink }), ...say('MIXED SIDE: THE WHOLE PINK STRING', C.pink));
  await until(S(12));
  await play(new M.Indicate(matchStr, { color: C.green }), ...say('MATCH SIDE: THE WHOLE GREEN STRING', C.green));
  const cross = new M.Circle({ radius: 0.28, color: C.amber, strokeWidth: 4 }); cross.moveTo(G);
  await until(S(13));
  await play(new M.Create(cross), ...say('THEY CROSS: NO STRAIGHT CUT WORKS', C.amber));
  const sqTitle2 = txt('MIXED = EXACTLY ONE BLUE', 21, C.pink, pt(PX, CY + AH / 2 - 0.35), true);
  await until(S(14));
  await play(new M.FadeOut(sqTitle), new M.FadeIn(sqTitle2), ...say('MIXED = EXACTLY ONE BLUE CORNER', C.pink));
  const sqTitle3 = txt('EXCLUSIVE OR = XOR', 21, C.pink, pt(PX, CY + AH / 2 - 0.35), true);
  await until(S(15));
  await play(new M.FadeOut(sqTitle2), new M.FadeIn(sqTitle3), ...say('THIS RULE IS XOR', C.pink));

  // ---------- 16–21: two hidden neurons ----------
  const N = makeNet([2, 2, 1]);
  const inL = N.pos(0, 0), inR = N.pos(0, 1), h0 = N.pos(1, 0), h1 = N.pos(1, 1), o = N.pos(2, 0);
  const names = [txt('left', 20, BLUE, pt(inL[0], inL[1] + R + 0.3)), txt('right', 20, ORANGE, pt(inR[0], inR[1] - R - 0.3)),
    txt('output', 20, C.amber, pt(o[0], o[1] + R + 0.3))];
  const hName0 = txt('left-only', 20, C.cyan, pt(h0[0], h0[1] + R + 0.3)), hName1 = txt('right-only', 20, C.cyan, pt(h1[0], h1[1] - R - 0.3));
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(N1.group, ...n1Names, ...Object.values(N1.vals))),
    new M.FadeOut(new M.VGroup(...cells, ...Object.values(T4), ...colL, ...rowL, matchStr, mixStr, cross, sqTitle3)),
    new M.FadeIn(N.group), ...names.map(n => new M.FadeIn(n)),
    ...panel([['ONE NEURON = ONE STRAIGHT CUT', C.amber], 'so we add two neurons', 'between the inputs and the answer'], C.amber),
    ...say('ADD TWO NEURONS IN BETWEEN', C.amber));
  await until(S(17));
  await play(new M.FadeIn(hName0), new M.FadeIn(hName1), flash(N.nodes[1][0], C.cyan), flash(N.nodes[1][1], C.cyan), ...say('LEFT-ONLY AND RIGHT-ONLY'));
  await until(S(18));
  await play(...panel([['REMEMBER', C.cyan], ['blue = 1', BLUE], ['orange = 0', ORANGE]]), ...say('BLUE = 1 • ORANGE = 0'));
  await until(S(19));
  await play(...setW(N, 0, 0, 0, 1, 0.35, 1), ...setW(N, 0, 1, 0, -1, 0.35, -1),
    ...panel([['LEFT-ONLY NEURON', C.cyan], 'weights +1 (left), −1 (right)', ['total = left − right', C.cyan]]), ...say('LEFT-ONLY: LEFT − RIGHT'));
  await until(S(20));
  await play(...setW(N, 0, 0, 1, -1, 0.35, 1), ...setW(N, 0, 1, 1, 1, 0.35, -1),
    ...panel([['RIGHT-ONLY NEURON', C.cyan], 'weights −1 (left), +1 (right)', ['total = right − left', C.cyan]]), ...say('RIGHT-ONLY: RIGHT − LEFT'));
  await until(S(21));
  await play(...panel([['BOTH HIDDEN NEURONS', C.violet], ['bias 0', C.violet], ['activation function: ReLU', C.green], 'negative total → 0'], C.violet),
    ...say('BIAS 0 • ReLU', C.violet));

  // ---------- 22–31: the four tiles through the hidden neurons ----------
  const rows = [['TILE          LEFT-ONLY  RIGHT-ONLY', C.muted]];
  const tableRows = () => panel(rows, C.cyan);
  const tryTile = async (a, b, name) => {
    await play(...val(N, 0, 0, a, a ? BLUE : ORANGE), ...val(N, 0, 1, b, b ? BLUE : ORANGE), ...clr(N, 1, 0), ...clr(N, 1, 1),
      ...say(`TRY ${name.toUpperCase()}`, C.amber));
  };
  const hidden = async (i, total, color) => {
    await play(...N.flow(0), ...val(N, 1, i, total, total < 0 ? C.pink : total > 0 ? C.cyan : C.ink));
    if (total < 0) await play(...val(N, 1, i, 0, C.green), flash(N.nodes[1][i], C.green));
  };
  await until(S(22)); await tryTile(0, 0, 'orange, orange');
  await until(S(23)); await hidden(0, 0); await hidden(1, 0);
  rows.push(['orange,orange    0          0', C.green]);
  await play(...tableRows(), ...say('BOTH SEND 0', C.green));
  await until(S(24)); await tryTile(0, 1, 'orange, blue');
  await until(S(25)); await play(...say('LEFT-ONLY: 0 − 1 = −1 → 0', C.pink)); await hidden(0, -1);
  await until(S(26)); await play(...say('RIGHT-ONLY: 1 − 0 = 1 → 1', C.cyan)); await hidden(1, 1);
  rows.push(['orange,blue      0          1', C.pink]); await play(...tableRows());
  await until(S(27)); await tryTile(1, 0, 'blue, orange');
  await until(S(28)); await play(...say('LEFT-ONLY: 1 − 0 = 1 → 1', C.cyan)); await hidden(0, 1);
  await until(S(29)); await play(...say('RIGHT-ONLY: 0 − 1 = −1 → 0', C.pink)); await hidden(1, -1);
  rows.push(['blue,orange      1          0', C.pink]); await play(...tableRows());
  await until(S(30)); await tryTile(1, 1, 'blue, blue');
  await until(S(31)); await hidden(0, 0); await hidden(1, 0);
  rows.push(['blue,blue        0          0', C.green]);
  await play(...tableRows(), ...say('BOTH SEND 0', C.green));

  // ---------- 32–37: hidden layer, hidden representation, one cut ----------
  const hLayer = chip('hidden layer', C.cyan, pt(h1[0], h1[1] - R - 0.95), 20);
  await until(S(32));
  await play(new M.FadeIn(hLayer), flash(N.nodes[1][0], C.cyan), flash(N.nodes[1][1], C.cyan), ...say('BETWEEN = A HIDDEN LAYER'));
  await until(S(33));
  await play(...panel([['HIDDEN REPRESENTATION', C.cyan], 'tile → (left-only, right-only)', ['orange,orange → (0, 0)', C.green], ['orange,blue   → (0, 1)', C.pink],
    ['blue,orange   → (1, 0)', C.pink], ['blue,blue     → (0, 0)', C.green]]), ...say('A NEW WAY TO DESCRIBE THE TILE'));
  await until(S(34));
  await play(...panel([['ADD THE TWO ACTIVATIONS', C.amber], ['orange,orange: 0 + 0 = 0', C.green], ['orange,blue:   0 + 1 = 1', C.pink],
    ['blue,orange:   1 + 0 = 1', C.pink], ['blue,blue:     0 + 0 = 0', C.green]], C.amber), ...say('ADD THE TWO ACTIVATIONS', C.amber));
  await until(S(35));
  await play(...say('MIXED → 1 • MATCH → 0', C.amber));
  // a new line: matches at 0, mixed at 1
  const LU = P ? 3.4 : 3.0, ly = CY - 0.6, lx = v => PX - LU / 2 + v * LU;
  const lineParts = [rr(PW, AH, pt(PX, CY), C.amber), txt('SUM OF THE TWO ACTIVATIONS', 21, C.amber, pt(PX, CY + AH / 2 - 0.35), true),
    ln(pt(lx(0) - 0.6, ly), pt(lx(1) + 0.6, ly), C.muted, 3), txt('0', 22, C.ink, pt(lx(0), ly - 0.4), true, true), txt('1', 22, C.ink, pt(lx(1), ly - 0.4), true, true),
    tile(0, 0, pt(lx(0), ly + 0.55), 0.6), tile(1, 1, pt(lx(0), ly + 1.25), 0.6), tile(0, 1, pt(lx(1), ly + 0.55), 0.6), tile(1, 0, pt(lx(1), ly + 1.25), 0.6),
    txt('matches', 19, C.green, pt(lx(0), ly - 0.95)), txt('mixed', 19, C.pink, pt(lx(1), ly - 0.95))];
  await until(S(36));
  await play(...swap(new M.VGroup(...lineParts)), ...say('PLACE EACH TILE BY ITS SUM', C.amber));
  const cut2 = ln(pt(PX, ly + 1.7), pt(PX, ly - 0.7), C.green, 5);
  await until(S(37));
  await play(new M.Create(cut2), ...say('NOW ONE CUT WORKS', C.green));

  // ---------- 38–43: the output neuron ----------
  const biasO = chip('bias +1', C.violet, pt(o[0], o[1] - R - 0.4), 20);
  await until(S(38));
  await play(new M.FadeOut(cut2), ...setW(N, 1, 0, 0, -1, 0.3, 1), ...setW(N, 1, 1, 0, -1, 0.3, -1), new M.FadeIn(biasO),
    ...panel([['OUTPUT NEURON', C.amber], ['bias +1', C.violet], ['weights −1 and −1', C.pink], 'no ReLU'], C.amber),
    ...say('ONE MORE NEURON MAKES THE ANSWER', C.amber));
  await until(S(39));
  await play(...say('ITS STEP IN WORDS', C.amber));
  await until(S(40));
  await play(...panel([['OUTPUT NEURON', C.amber], 'output = 1', ['− left-only activation', C.pink], ['− right-only activation', C.pink]], C.amber),
    ...say('OUTPUT = 1 − LEFT-ONLY − RIGHT-ONLY', C.amber));
  await until(S(41));
  await play(...val(N, 0, 0, 0, ORANGE), ...val(N, 0, 1, 1, BLUE), ...val(N, 1, 0, 0, C.green), ...val(N, 1, 1, 1, C.cyan),
    ...panel([['MIXED TILE: orange, blue', C.pink], 'activations 0 and 1', ['output = 1 − 0 − 1 = 0', C.pink]], C.pink), ...say('MIXED → OUTPUT 0', C.pink));
  await play(...N.flow(1), ...val(N, 2, 0, 0, C.pink));
  await until(S(42));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 1, BLUE), ...val(N, 1, 0, 0, C.green), ...val(N, 1, 1, 0, C.green),
    ...panel([['MATCH: blue, blue', C.green], 'activations 0 and 0', ['output = 1 − 0 − 0 = 1', C.green]], C.green), ...say('MATCH → OUTPUT 1', C.green));
  await play(...N.flow(1), ...val(N, 2, 0, 1, C.green));
  await until(S(43));
  await play(...panel([['WHY HIDDEN NEURONS HELP', C.cyan], 'hard to see in the inputs', 'easy to see in the new numbers']), ...say('HARD IN THE INPUTS, EASY INSIDE'));

  // ---------- 44–46: without ReLU ----------
  await until(S(44));
  await play(...panel([['WITHOUT ReLU', C.amber], 'the totals go out unchanged'], C.amber), ...say('WHAT IF THERE WERE NO ReLU?', C.amber));
  await until(S(45));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 0, ORANGE), ...val(N, 1, 0, 1, C.cyan), ...val(N, 1, 1, -1, C.pink), ...clr(N, 2, 0),
    ...panel([['WITHOUT ReLU: blue, orange', C.amber], ['left-only total  1', C.cyan], ['right-only total −1', C.pink]], C.amber), ...say('TOTALS 1 AND −1', C.amber));
  await until(S(46));
  await play(...N.flow(1), ...val(N, 2, 0, 1, C.amber),
    ...panel([['WITHOUT ReLU', C.amber], 'output = 1 − 1 − (−1) = 1', 'the totals cancel:', ['every tile → output 1', C.pink]], C.amber), ...say('THEY CANCEL: EVERY TILE GIVES 1', C.pink));

  // ---------- 47–49: try it, recap ----------
  await until(S(47));
  await play(...val(N, 0, 0, '?', C.amber), ...val(N, 0, 1, '?', C.amber), ...val(N, 1, 0, 0, C.green), ...val(N, 1, 1, 1, C.cyan), ...clr(N, 2, 0),
    ...panel([['TRY IT', C.green], 'find the mixed tile where', 'only the right-only neuron sends 1'], C.green), ...say('TRY IT: ONLY RIGHT-ONLY SENDS 1', C.green));
  await until(S(48));
  await play(...val(N, 0, 0, 1, BLUE), ...val(N, 0, 1, 1, BLUE), ...val(N, 1, 0, 0, C.green), ...val(N, 1, 1, 0, C.green),
    ...panel([['TRY IT', C.green], 'make a match: blue, blue', 'both hidden neurons send 0'], C.green), ...say('BOTH BLUE: BOTH HIDDEN NEURONS 0', C.green));
  await until(S(49));
  await play(...val(N, 2, 0, 1, C.green), ...N.flow(0),
    ...panel([['HIDDEN LAYER', C.cyan], 'inputs → hidden representation', ['mixed: one activation is 1', C.pink], ['match: both are 0', C.green], 'output = 1 − sum'], C.cyan),
    ...say('A HIDDEN LAYER MAKES MATCHES EASY TO FIND'));
  await until(E(49));
}

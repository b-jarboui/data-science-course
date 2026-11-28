// 19.2.3 Attention weights (softmax, then mixing the values). Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TOK = ['the', 'red', 'cup', 'fell'], TC = ['#94a3b8', '#fb7185', C.amber, C.violet];
  const QC = C.cyan, KC = C.amber, VC = C.violet;
  const SC = [0, 0, 1, 0], EXP = ['1', '1', '2.72', '1'], SH = ['17.5%', '17.5%', '47.5%', '17.5%'], SHN = [17.5, 17.5, 47.5, 17.5];
  const VAL = [[0, 0], [0, 2], [2, 0], [0, 0]];

  // ---- formula box
  const BOXP = P ? [0, 3.65, 0] : [4.4, 0.55, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP) {
    const size = 20, lh = 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.35;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.3, top = at[1] + ht / 2 - 0.175 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.4, maxh = P ? 1.3 : 1.75;
    const k = Math.min(1, maxw / wd, maxh / ht); if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // ---- layout: tokens with rows of numbers below
  const tokY = P ? 1.7 : 1.05;
  const tx = k => P ? (k - 1.5) * 1.8 : -5.0 + k * 1.9;
  const rowY = P ? [1.1, 0.5, -0.1] : [0.45, -0.15, -0.75];
  const labX = P ? -3.65 : -6.35;
  const chips = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([tx(k), tokY, 0]));
  const rowLab = (s, r, col) => T(s, P ? 13 : 15, col).moveTo([labX, rowY[r], 0]);
  const cell = (k, v, r, col, sz = P ? 18 : 19) => T(String(v), sz, col, true, true).moveTo([tx(k), rowY[r], 0]);

  // ---- 0-9 tokens and their scores
  await until(S(0)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.6 }), ...say('“the red cup fell”'));
  await until(S(1)); await play(new M.Indicate(chips[3], { color: C.violet }), ...say('PREDICT THE TOKEN AFTER “fell”', C.violet));
  await until(S(2)); await play(...say('HOW MUCH TO TAKE FROM EACH TOKEN?', C.amber));
  await until(S(3)); await play(...say('LAST LESSON: QUERY of fell vs 4 KEYS', QC));
  const slab = rowLab('score', 0, C.amber);
  await until(S(4)); await play(new M.FadeIn(slab), ...say('THE 4 SCORES', C.amber));
  const scores = SC.map((v, k) => cell(k, v, 0, v ? C.amber : C.ink));
  for (let k = 0; k < 4; k++) {
    await until(S(5 + k)); await play(new M.FadeIn(scores[k]), new M.Indicate(chips[k], { color: TC[k] }), ...say(`${TOK[k]}: SCORE ${SC[k]}`, TC[k]));
  }
  await until(S(9)); await play(new M.Indicate(scores[2], { color: C.amber }), ...say('cup IS HIGHEST · OTHERS MAY HELP TOO', C.amber));

  // ---- 10-15 one hundred blocks to share
  const hc = P ? 0.2 : 0.18, bc = P ? 0.22 : 0.18;
  const HP = P ? [0, -4.2, 0] : [4.4, -1.75, 0];
  const heapAt = (s, half = 0) => [HP[0] + (s % 10 - 4.5) * hc + half * hc / 4, HP[1] + (4.5 - Math.floor(s / 10)) * hc, 0];
  const blk = (p, w, h, col) => { const b = new M.Rectangle({ width: w, height: h, color: col, strokeWidth: 1 }); b.setFill(col, 0.8); b.moveTo(p); return b; };
  const full = Array.from({ length: 98 }, (_, s) => blk(heapAt(s), hc * 0.85, hc * 0.85, C.cyan));
  const halves = [[98, -1], [98, 1], [99, -1], [99, 1]].map(([s, h]) => blk(heapAt(s, h), hc * 0.4, hc * 0.85, C.cyan));
  const heap = [...full, ...halves];
  const hlab = T('100 blocks', P ? 16 : 16, C.cyan).moveTo([HP[0], HP[1] + 5 * hc + 0.28, 0]);
  await until(S(10)); await play(new M.LaggedStart(heap.map(b => new M.FadeIn(b)), { lagRatio: 0.01, runTime: 1.8 }), new M.FadeIn(hlab), ...say('100 SMALL BLOCKS TO SHARE'));
  await until(S(11)); await play(...fbox(['1 block = 1% of attention']), ...say('1 BLOCK = 1 PERCENT'));
  await until(S(12)); await play(new M.Indicate(chips[2], { color: C.amber }), ...say('cup: MORE BLOCKS (HIGHER SCORE)', C.amber));
  await until(S(13)); await play(...[0, 1, 3].map(k => new M.Indicate(chips[k], { color: TC[k] })), ...say('THE OTHERS: SOME BLOCKS TOO'));
  await until(S(14)); await play(new M.Indicate(hlab, { color: C.green }), ...say('EXACTLY 100 BLOCKS IN TOTAL', C.green));
  await until(S(15)); await play(...fbox([['share of attention', C.ink], ['= ATTENTION WEIGHT', C.green]], C.green), ...say('SHARE = ATTENTION WEIGHT', C.green));

  // ---- 16-24 step 1: the exponential
  await until(S(16)); await play(...say('2 STEPS: SCORES → ATTENTION WEIGHTS', C.violet));
  await until(S(17)); await play(...say('STEP 1: MAKE EVERY SCORE POSITIVE', C.amber));
  await until(S(18)); await play(...fbox([['e ≈ 2.72', C.amber], ['a special number', C.muted]], C.amber), ...say('THE SPECIAL NUMBER e', C.amber));
  await until(S(19)); await play(...fbox([['e ≈ 2.72', C.amber], ['e to the power of the score', C.muted]], C.amber));
  await until(S(20)); await play(...fbox([['e⁰ = 1', C.ink]], C.amber), ...say('SCORE 0 → e⁰ = 1'));
  await until(S(21)); await play(...fbox(['e⁰ = 1', ['e¹ ≈ 2.72', C.amber]], C.amber), ...say('SCORE 1 → e¹ ≈ 2.72', C.amber));
  await until(S(22)); await play(...fbox(P ? ['score 0 → 1   score 1 → 2.72', ['score 2 → 7.39  score −1 → 0.37', C.green]] : ['score 0  → 1', 'score 1  → 2.72', ['score 2  → 7.39', C.green], ['score −1 → 0.37', C.green]], C.green), ...say('BIGGER SCORE → BIGGER · NEGATIVE → STILL POSITIVE', C.green));
  await until(S(23)); await play(...say('THE EXPONENTIAL FUNCTION', C.amber));
  const elab = rowLab('e^score', 1, C.green);
  const exps = EXP.map((v, k) => cell(k, v, 1, k === 2 ? C.amber : C.green));
  const ear = [0, 1, 2, 3].map(k => new M.Line({ start: [tx(k), rowY[0] - 0.18, 0], end: [tx(k), rowY[1] + 0.2, 0], color: C.green, strokeWidth: 2 }));
  await until(S(24)); await play(new M.FadeIn(elab), new M.LaggedStart([0, 1, 2, 3].map(k => new M.FadeIn(new M.VGroup(ear[k], exps[k]))), { lagRatio: 0.3, runTime: 1.6 }), ...say('1, 1, 2.72, 1', C.green));

  // ---- 25-33 step 2: add, divide, share the blocks
  await until(S(25)); await play(...say('STEP 2: ADD THE 4 NUMBERS', C.amber));
  await until(S(26)); await play(...fbox(['1 + 1 + 2.72 + 1', ['total ≈ 5.72', C.amber]], C.amber), ...say('TOTAL ≈ 5.72', C.amber));
  await until(S(27)); await play(...say('DIVIDE EACH NUMBER BY THE TOTAL', C.green));
  const shlab = rowLab('share', 2, C.cyan);
  const shares = SH.map((v, k) => cell(k, v, 2, k === 2 ? C.amber : C.cyan, P ? 16 : 18));
  const btop = rowY[2] - (P ? 0.5 : 0.42);
  const stackAt = (k, j, half = 0) => [tx(k) + (j % 5 - 2) * bc + half * bc / 4, btop - Math.floor(j / 5) * bc, 0];
  const plan = [[0, 17, 0], [17, 17, 1], [34, 47, 2], [81, 17, 3]];
  const deal = k => {
    const [from, n, h] = plan[k], col = TC[k];
    const a = full.slice(from, from + n).map((b, j) => new M.Transform(b, blk(stackAt(k, j), bc * 0.85, bc * 0.85, col)));
    a.push(new M.Transform(halves[h], blk(stackAt(k, n, -1), bc * 0.4, bc * 0.85, col)));
    return new M.LaggedStart(a, { lagRatio: 0.03, runTime: 1.6 });
  };
  const dline = k => `${EXP[k]} ÷ 5.72 ≈ ${SH[k]}`;
  for (let k = 0; k < 4; k++) {
    await until(S(28 + k));
    await play(...(k ? [] : [new M.FadeIn(shlab)]), new M.FadeIn(shares[k]), deal(k), ...fbox([[dline(k), k === 2 ? C.amber : C.ink]], k === 2 ? C.amber : C.cyan),
      ...say(`${TOK[k]}: ABOUT ${SH[k]}`, TC[k]));
  }
  await until(S(32)); await play(new M.FadeOut(hlab), ...fbox(['17.5 + 17.5 + 47.5 + 17.5', ['= 100%', C.green]], C.green), ...say('TOGETHER: 100 PERCENT', C.green));
  await until(S(33)); await play(...fbox(['scores → e^score → ÷ total', ['= SOFTMAX', C.green]], C.green), ...say('SOFTMAX: SCORES → SHARES', C.green));

  // ---- 34-48 mixing the value vectors with a network
  const nr = P ? 0.26 : 0.18;
  const N = net({ layers: [11, 2], center: P ? [0.3, -1.75, 0] : [-1.5, -0.75, 0], width: P ? 4.4 : 5.0, height: P ? 6.6 : 4.2, r: nr });
  const VI = [[0, 1], [3, 4], [6, 7], [9, 10]];
  VI.forEach((p, k) => p.forEach(i => { N.nodes[0][i].setColor(VC); N.nodes[0][i].setFill(C.card, 0.95); }));
  N.nodes[1].forEach(c => { c.setColor(C.green); c.setFill(C.card, 0.95); });
  const gy = k => (N.pos(0, VI[k][0])[1] + N.pos(0, VI[k][1])[1]) / 2, inX = N.pos(0, 0)[0], outX = N.pos(1, 0)[0];
  // spread the two output circles and make them bigger, then re-aim their lines
  const OR = P ? 0.42 : 0.36, OY = P ? [-1.1, -2.4] : [-0.2, -1.3];
  const opos = m => [outX, OY[m], 0];
  N.nodes[1].forEach((c, m) => { c.scale(OR / nr); c.moveTo(opos(m)); });
  for (let i = 0; i < 11; i++) for (let m = 0; m < 2; m++) { const a = N.pos(0, i), ln = N.edges[0][i][m]; ln.setStart([a[0] + nr, a[1], -0.01]); ln.setEnd([outX - OR, OY[m], -0.01]); }
  const outVals = [null, null];
  const setOutV = (m, s) => { const t = T(s, P ? 16 : 15, C.green, true).moveTo(opos(m)); const a = [new M.FadeIn(t)]; if (outVals[m]) a.push(new M.FadeOut(outVals[m])); outVals[m] = t; return a; };
  const chipsB = TOK.map((s, k) => pill(s, TC[k], P ? 16 : 17).moveTo(P ? [-3.3, gy(k) + 0.25, 0] : [-6.1, gy(k), 0]));
  const shB = SH.map((s, k) => T(s, P ? 15 : 15, k === 2 ? C.amber : C.cyan, true).moveTo(P ? [-3.3, gy(k) - 0.27, 0] : [-4.95, gy(k), 0]));
  const vlab = pill('VALUES', VC, P ? 15 : 15).moveTo([inX, N.pos(0, 0)[1] + nr + 0.35, 0]);
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(...chips, slab, elab, shlab, ...scores, ...exps, ...ear, ...shares, ...heap)), new M.FadeOut(boxNow),
    ...chipsB.map(c => new M.FadeIn(c)), ...shB.map(c => new M.FadeIn(c)), ...say('WHAT DO THE WEIGHTS DO?', C.violet));
  boxNow = null;
  await play(...fbox(['attention weights:', ['17.5% · 17.5% · 47.5% · 17.5%', C.cyan]]));
  await until(S(35)); await play(new M.LaggedStart(VI.flat().map(i => new M.FadeIn(N.nodes[0][i])), { lagRatio: 0.08, runTime: 1.4 }), new M.FadeIn(vlab), new M.FadeOut(boxNow), ...say('EACH TOKEN: A VALUE OF 2 CIRCLES', VC));
  boxNow = null;
  for (let k = 0; k < 4; k++) {
    await until(S(36 + k));
    await play(...VI[k].flatMap((i, m) => N.value(0, i, String(VAL[k][m]), VAL[k][m] ? VC : C.muted)), new M.Indicate(chipsB[k], { color: TC[k] }), ...say(`${TOK[k]} CARRIES (${VAL[k].join(', ')})`, TC[k]));
  }
  const olab = pill('new fell', C.violet, P ? 15 : 16);
  olab.moveTo(P ? [outX, OY[0] + OR + 0.35, 0] : [outX + OR + 0.2 + olab.getWidth() / 2, (OY[0] + OY[1]) / 2, 0]);
  await until(S(40)); await play(...N.nodes[1].map(c => new M.FadeIn(c)), new M.FadeIn(olab), ...say('2 NEW CIRCLES FOR “fell”', C.violet));
  const links = VI.flatMap((p, k) => p.map((i, m) => [k, i, m]));
  links.forEach(([k, i, m]) => N.edges[0][i][m].setStrokeOpacity(0.55));
  await until(S(41));
  await play(new M.LaggedStart(links.map(([k, i, m]) => new M.Create(N.edges[0][i][m])), { lagRatio: 0.08, runTime: 1.2 }), ...say('THICKER LINE = BIGGER ATTENTION WEIGHT'));
  await play(...links.flatMap(([k, i, m]) => N.weight(0, i, m, SHN[k] / 50)));
  const mid = (i, m, dy) => { const a = N.pos(0, i), b = opos(m), f = P ? 0.3 : 0.17; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + dy, 0]; };
  await until(S(42)); await play(...VI[2].map(i => new M.Indicate(N.nodes[0][i], { color: C.amber })), ...fbox(['cup sends 47.5% of each number']), ...say('cup SENDS 47.5% OF EACH NUMBER', C.amber));
  const cupT = [pill('0.95', C.amber, P ? 16 : 15).moveTo(mid(6, 0, 0)), pill('0', C.amber, P ? 16 : 15).moveTo(mid(7, 1, 0))];
  await until(S(43)); await play(...cupT.map(t => new M.FadeIn(t)), ...fbox(['0.475 × 2 ≈ 0.95', '0.475 × 0 = 0']), ...say('cup SENDS ≈ 0.95 AND 0', C.amber));
  await until(S(44)); await play(...VI[1].map(i => new M.Indicate(N.nodes[0][i], { color: '#fb7185' })), ...fbox(['red sends 17.5% of each number']), ...say('red SENDS 17.5% OF EACH NUMBER', '#fb7185'));
  const redT = [pill('0', '#fb7185', P ? 16 : 15).moveTo(mid(3, 0, 0)), pill('0.35', '#fb7185', P ? 16 : 15).moveTo(mid(4, 1, 0))];
  await until(S(45)); await play(...redT.map(t => new M.FadeIn(t)), ...fbox(['0.175 × 0 = 0', '0.175 × 2 ≈ 0.35']), ...say('red SENDS 0 AND ≈ 0.35', '#fb7185'));
  await until(S(46)); await play(...[0, 3].flatMap(k => VI[k].map(i => new M.Indicate(N.nodes[0][i], { color: C.muted }))), ...fbox(['the, fell: values are 0', '→ they send 0']), ...say('the AND fell SEND ZEROS', C.muted));
  const pulse = new M.LaggedStart(links.map(([k, i, m]) => {
    const a = N.pos(0, i), b = opos(m), col = TC[k];
    const d = new M.Dot({ point: [a[0] + nr, a[1], 0], radius: P ? 0.08 : 0.06, color: col }); d.setFill(col, 1);
    const t = new M.Dot({ point: [b[0] - OR, b[1], 0], radius: P ? 0.08 : 0.06, color: col }); t.setFill(col, 0);
    return new M.Transform(d, t, { runTime: 0.9 });
  }), { lagRatio: 0.07, runTime: 2 });
  await until(S(47)); await play(pulse, ...fbox(['circle 1: 0 + 0 + 0.95 + 0', 'circle 2: 0 + 0.35 + 0 + 0']), ...say('ADD WHAT EACH CIRCLE RECEIVES', C.green));
  await until(S(48)); await play(...setOutV(0, '0.95'), ...setOutV(1, '0.35'),...fbox([['new fell ≈ (0.95, 0.35)', C.green]], C.green), ...say('NEW “fell” ≈ (0.95, 0.35)', C.green));

  // ---- 49-54 formulas and summary
  await until(S(49)); await play(...fbox(['1. softmax formula', '2. mixing formula']), ...say('TWO SHORT FORMULAS'));
  await until(S(50)); await play(...fbox(['attention weight =', ['e^score ÷ (sum of all e^score)', C.amber]], C.amber), ...say('SOFTMAX FORMULA', C.amber));
  await until(S(51)); await play(...fbox(['output number =', ['sum of (value × attention weight)', C.green]], C.green), ...say('MIXING FORMULA', C.green));
  await until(S(52)); await play(...links.map(([k, i, m]) => new M.Indicate(N.edges[0][i][m], { color: TC[k] })), ...say('WEIGHTS CONTROL HOW MUCH COMES FROM EACH TOKEN'));
  await until(S(53)); await play(...[0, 1, 3].map(k => new M.Indicate(shB[k], { color: C.pink })), ...fbox(['score 0 → 17.5%', ['not 0%', C.pink]], C.pink), ...say('SCORE 0 ≠ ZERO ATTENTION', C.pink));
  await until(S(54)); await play(...fbox([['softmax: scores → shares', C.amber], ['shares → mix the values', C.green]], C.green), ...say('SOFTMAX TURNS SCORES INTO SHARES', C.green));
}

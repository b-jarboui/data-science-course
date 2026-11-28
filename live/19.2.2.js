// 19.2.2 Scaled dot-product scores. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TOK = ['the', 'red', 'cup', 'fell'], TC = ['#94a3b8', '#fb7185', C.amber, C.violet];
  const QC = C.cyan, KC = C.amber, VC = C.violet;
  const KEYS = [[0, 0, 0, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]], QF = [2, 0, 0, 0];

  // ---- formula box
  const BOXP = P ? [0, 3.65, 0] : [-4.85, -2.35, 0];
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
    const maxw = P ? FW - 0.8 : (at === BOXP ? 3.5 : 7), maxh = at === BOXP ? 1.3 : 2;
    const k = Math.min(1, maxw / wd, maxh / ht); if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const num = (v, p, col = C.ink, sz = P ? 17 : 15) => T(String(v), sz, col, true).moveTo(p);

  // ---- layout: tokens with key columns
  const tokY = P ? 1.7 : 1.05, sp = P ? 1.8 : 2.3;
  const tx = k => P ? (k - 1.5) * sp : -1.0 + k * sp;
  const vr = P ? 0.24 : 0.2, vstep = P ? 0.62 : 0.5, vtop = P ? 0.95 : 0.35;
  const vp = (x, i) => [x, vtop - i * vstep, 0];
  const circ = (p, col) => { const c = new M.Circle({ radius: vr, color: col, strokeWidth: 2.5 }); c.setFill(C.card, 0.95); c.moveTo(p); return c; };
  const chips = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([tx(k), tokY, 0]));
  const scoreY = vtop - 3 * vstep - (P ? 0.75 : 0.65), scaledY = scoreY - (P ? 0.7 : 0.6);

  // ---- 0-5 the question
  await until(S(0)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.6 }), ...say('“the red cup fell”'));
  await until(S(1)); await play(new M.Indicate(chips[3], { color: C.violet }), ...say('PREDICT THE TOKEN AFTER “fell”', C.violet));
  await until(S(2)); await play(new M.LaggedStart(chips.map((c, k) => new M.Indicate(c, { color: TC[k] })), { lagRatio: 0.25, runTime: 2 }), ...say('WHICH TOKEN HELPS MOST?', C.amber));
  await until(S(3)); await play(...say('EACH TOKEN HAS 3 GROUPS OF NUMBERS'));
  await until(S(4)); await play(...fbox([['query → finds information', QC], ['key   → helps a match', KC], ['value → carries information', VC]], C.cyan, P ? [0, 0.3, 0] : [2.45, -0.4, 0]), ...say('QUERY · KEY · VALUE'));
  await until(S(5)); await play(...say('TODAY: COMPARE ONE QUERY WITH THE KEYS', C.amber));

  // ---- 6-11 keys below the tokens
  await until(S(6)); await play(new M.FadeOut(boxNow), new M.LaggedStart(chips.map(c => new M.Indicate(c, { color: C.ink })), { lagRatio: 0.2, runTime: 1.4 }), ...say('THE 4 TOKENS'));
  boxNow = null;
  const kc = TOK.map((_, k) => [0, 1, 2, 3].map(i => circ(vp(tx(k), i), KC)));
  const klab = T('keys', 16, KC).moveTo([-2.7, vtop - 1.5 * vstep, 0]);
  await until(S(7)); await play(new M.LaggedStart(kc.flat().map(c => new M.FadeIn(c)), { lagRatio: 0.04, runTime: 1.6 }), ...(P ? [] : [new M.FadeIn(klab)]),...say('KEY = 4 CIRCLES BELOW EACH TOKEN', KC));
  const kn = [];
  for (let k = 0; k < 4; k++) {
    await until(S(8 + k));
    const ns = KEYS[k].map((v, i) => num(v, vp(tx(k), i), v ? KC : C.muted));
    kn.push(ns);
    await play(new M.LaggedStart(ns.map(n => new M.FadeIn(n)), { lagRatio: 0.2, runTime: 1 }), new M.Indicate(chips[k], { color: TC[k] }),
      ...say(`KEY of ${TOK[k]} = (${KEYS[k].join(', ')})`, KC));
  }

  // ---- 12-13 the query network of fell
  const nr = P ? 0.24 : 0.2;
  const NC = P ? [-0.4, -4.4, 0] : [-4.6, -0.45, 0];
  const N = net({ layers: [4, 4], center: NC, width: P ? 3.0 : 2.2, height: P ? 1.6 : 1.5, r: nr });
  N.nodes[0].forEach(c => { c.setColor(C.ink); c.setFill(C.card, 0.95); });
  N.nodes[1].forEach(c => { c.setColor(QC); c.setFill(C.card, 0.95); });
  const QW = [[], [[0, 2]], [[1, 2]], [[0, 2]]];
  [0, 1, 2, 3].forEach(i => [0, 1, 2, 3].forEach(j => {
    const f = QW[i].find(x => x[0] === j), ln = N.edges[0][i][j];
    if (f) { ln.setColor(QC); ln.setStrokeWidth(4); ln.setStrokeOpacity(0.9); } else { ln.setStrokeOpacity(0.14); ln.setStrokeWidth(1.2); }
  }));
  const inX = N.pos(0, 0)[0], outX = N.pos(1, 0)[0];
  const fchip = pill('fell', TC[3], P ? 17 : 18).moveTo([inX, N.pos(0, 0)[1] + nr + 0.38, 0]);
  const qtag = pill('QUERY', QC, P ? 14 : 15).moveTo([outX, N.pos(1, 0)[1] + nr + 0.38, 0]);
  await until(S(12));
  await play(new M.FadeIn(N.group), new M.FadeIn(fchip), new M.FadeIn(qtag), ...[0, 1, 2, 3].flatMap(i => N.value(0, i, i === 3 ? '1' : '0', i === 3 ? C.violet : C.muted)),
    ...say('“fell” → ITS QUERY NETWORK', C.violet));
  const pulses = [0, 1, 2, 3].flatMap(i => [0, 1, 2, 3].map(j => {
    const a = N.pos(0, i), b = N.pos(1, j), col = QW[i].find(x => x[0] === j) ? C.amber : C.muted;
    const d = new M.Dot({ point: [a[0] + nr, a[1], 0], radius: 0.06, color: col }); d.setFill(col, 1);
    const t = new M.Dot({ point: [b[0] - nr, b[1], 0], radius: 0.06, color: col }); t.setFill(col, 0);
    return new M.Transform(d, t, { runTime: 0.8 });
  }));
  await until(S(13)); await play(new M.LaggedStart(pulses, { lagRatio: 0.04, runTime: 1.6 }), ...QF.flatMap((v, j) => N.value(1, j, String(v), v ? QC : C.muted)), ...say('QUERY of fell = (2, 0, 0, 0)', QC));

  // ---- query column beside a key column, multiply, add
  const qx = k => tx(k) - (P ? 0.75 : 0.85);
  let qcol = null, links = [], prods = [];
  function placeQ(k) {
    const cs = [0, 1, 2, 3].map(i => circ(vp(qx(k), i), QC));
    const ns = QF.map((v, i) => num(v, vp(qx(k), i), v ? QC : C.muted));
    const old = qcol ? [...qcol, ...links, ...prods] : [];
    qcol = [...cs, ...ns]; links = []; prods = [];
    return [...(old.length ? [new M.FadeOut(new M.VGroup(...old))] : []), ...qcol.map(o => new M.FadeIn(o))];
  }
  const mkLinks = k => { links = [0, 1, 2, 3].map(i => new M.Line({ start: [qx(k) + vr, vp(0, i)[1], 0], end: [tx(k) - vr, vp(0, i)[1], 0], color: C.green, strokeWidth: 3 })); return links.map(l => new M.Create(l)); };
  const prodAt = (k, i) => { const v = QF[i] * KEYS[k][i]; const t = num(v, [tx(k) + vr + (P ? 0.2 : 0.22), vp(0, i)[1], 0], v ? C.amber : C.muted, P ? 15 : 14); prods.push(t); return new M.FadeIn(t); };
  const scores = [], scored = [];
  const scoreAt = k => { const v = QF.reduce((s, q, i) => s + q * KEYS[k][i], 0); const t = T(String(v), P ? 20 : 20, v ? C.amber : C.ink, true, true).moveTo([tx(k), scoreY, 0]); scores[k] = t; return new M.FadeIn(t); };
  const LABX = P ? 3.55 : -2.7;
  const slab = T('score', P ? 14 : 15, C.amber).moveTo([LABX, scoreY, 0]);

  await until(S(14)); await play(...placeQ(2), new M.Indicate(chips[2], { color: C.amber }), ...say('QUERY of fell BESIDE KEY of cup', QC));
  await until(S(15)); await play(...[0, 1, 2, 3].map(i => new M.Indicate(kc[2][i], { color: C.amber })), ...say('4 POSITIONS: ONE PER CIRCLE', C.ink));
  await until(S(16)); await play(...say('DO MATCHING POSITIONS WORK TOGETHER?', C.green));
  await until(S(17)); await play(...fbox(['query × key, position by position']), ...say('MULTIPLY EACH MATCHING PAIR', C.amber));
  await until(S(18)); await play(new M.LaggedStart(mkLinks(2), { lagRatio: 0.25, runTime: 1.4 }), ...say('ONE LINE PER POSITION', C.green));
  for (let i = 0; i < 4; i++) {
    await until(S(19 + i));
    const v = QF[i] * KEYS[2][i];
    await play(prodAt(2, i), new M.Indicate(links[i], { color: C.amber }), ...fbox([`position ${i + 1}:`, [`${QF[i]} × ${KEYS[2][i]} = ${v}`, v ? C.amber : C.ink]]));
  }
  await until(S(23)); await play(new M.LaggedStart(prods.map(p => new M.Indicate(p, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }), ...say('4 RESULTS: 2, 0, 0, 0', C.amber));
  await until(S(24)); await play(...say('ADD THE 4 RESULTS', C.amber));
  await until(S(25)); await play(new M.FadeIn(slab), scoreAt(2), ...fbox(['2 + 0 + 0 + 0', ['= 2', C.amber]]), ...say('SCORE of cup = 2', C.amber));
  await until(S(26)); await play(...fbox(['multiply matching numbers,', 'then add', ['= DOT PRODUCT', C.green]], C.green), ...say('DOT PRODUCT', C.green));
  await until(S(27)); await play(new M.Indicate(scores[2], { color: C.amber }), ...say('SCORE = HOW WELL QUERY AND KEY MATCH', C.green));

  // ---- 28-34 the other keys
  await until(S(28)); await play(...placeQ(1), ...say('NOW: QUERY of fell WITH KEY of red', QC));
  await play(...mkLinks(1));
  await until(S(29)); await play(prodAt(1, 0), ...fbox(['position 1:', '2 × 0 = 0']));
  await until(S(30)); await play(prodAt(1, 1), ...fbox(['position 2:', '0 × 1 = 0']));
  await until(S(31)); await play(prodAt(1, 2), prodAt(1, 3), ...fbox(['positions 3 and 4:', '0 × 0 = 0']));
  await until(S(32)); await play(scoreAt(1), ...fbox(['0 + 0 + 0 + 0', '= 0']), ...say('SCORE of red = 0'));
  await until(S(33)); await play(...placeQ(0), ...say('KEY of the → SCORE 0', C.muted));
  await play(...mkLinks(0), ...[0, 1, 2, 3].map(i => prodAt(0, i)), scoreAt(0));
  await until(S(34)); await play(...placeQ(3), ...say('KEY of fell → SCORE 0', C.violet));
  await play(...mkLinks(3), ...[0, 1, 2, 3].map(i => prodAt(3, i)), scoreAt(3));

  // ---- 35-37 the four scores
  await until(S(35)); await play(new M.FadeOut(new M.VGroup(...qcol, ...links, ...prods)), new M.LaggedStart(scores.map(s => new M.Indicate(s, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...fbox([['scores: 0, 0, 2, 0', C.amber]], C.amber), ...say('SCORES IN TOKEN ORDER: 0, 0, 2, 0', C.amber));
  qcol = null; links = []; prods = [];
  const hi = new M.RoundedRectangle({ width: P ? 1.3 : 1.5, height: (tokY - scoreY) + 0.8, cornerRadius: 0.16, color: C.amber, strokeWidth: 2 });
  hi.moveTo([tx(2), (tokY + scoreY) / 2, 0]);
  await until(S(36)); await play(new M.Create(hi), ...say('cup HAS THE HIGHEST SCORE', C.amber));
  await until(S(37)); await play(new M.FadeOut(hi), ...say('ONE MORE STEP FIRST', C.violet));

  // ---- 38-48 scaling
  await until(S(38)); await play(...fbox(['our query and key: 4 numbers', ['real models: many more', C.muted]]), ...say('REAL MODELS: MANY MORE NUMBERS'));
  await until(S(39)); await play(...say('ADDING MANY RESULTS → VERY LARGE SCORES', C.pink));
  await until(S(40)); await play(...say('FIX: DIVIDE EVERY SCORE BY A NUMBER', C.green));
  await until(S(41)); await play(...say('THE NUMBER DEPENDS ON THE LENGTH', C.green));
  await until(S(42)); await play(...[0, 1, 2, 3].map(i => new M.Indicate(kc[3][i], { color: KC })), ...fbox(['each holds 4 numbers']), ...say('EACH HOLDS 4 NUMBERS'));
  await until(S(43)); await play(...fbox(['each holds 4 numbers', ['? × ? = 4', C.amber]]), ...say('WHICH NUMBER TIMES ITSELF GIVES 4?', C.amber));
  await until(S(44)); await play(...fbox(['each holds 4 numbers', ['2 × 2 = 4', C.amber]]), ...say('2 × 2 = 4', C.amber));
  await until(S(45)); await play(...fbox(['each holds 4 numbers', ['square root of 4 = 2', C.green]], C.green), ...say('√4 = 2: THE SQUARE ROOT', C.green));
  const dlab = T('÷ 2', P ? 14 : 15, C.green).moveTo([LABX, scaledY, 0]);
  const arrows = [0, 1, 2, 3].map(k => new M.Line({ start: [tx(k), scoreY - 0.18, 0], end: [tx(k), scaledY + 0.2, 0], color: C.green, strokeWidth: 2 }));
  await until(S(46)); await play(new M.FadeIn(dlab), new M.LaggedStart(arrows.map(a => new M.Create(a)), { lagRatio: 0.2, runTime: 1 }), ...say('DIVIDE EACH SCORE BY 2', C.green));
  const SCL = [0, 0, 1, 0];
  SCL.forEach((v, k) => { scored[k] = T(String(v), 20, v ? C.green : C.ink, true, true).moveTo([tx(k), scaledY, 0]); });
  await until(S(47)); await play(new M.LaggedStart(scored.map(s => new M.FadeIn(s)), { lagRatio: 0.2, runTime: 1.2 }), ...fbox([['scores ÷ 2 = 0, 0, 1, 0', C.green]], C.green), ...say('0, 0, 1, 0', C.green));
  await until(S(48)); await play(...scored.map(s => new M.Indicate(s, { color: C.green })), ...say('SCALED DOT-PRODUCT SCORES', C.green));

  // ---- 49-54 formula and summary
  await until(S(49)); await play(...say('THE WHOLE CALCULATION'));
  await until(S(50)); await play(...fbox(['scaled score =', ['(query · key) ÷ √(numbers each)', C.amber]], C.amber), ...say('DOT PRODUCT ÷ √(NUMBERS EACH)', C.amber));
  await until(S(51)); await play(new M.LaggedStart(chips.map((c, k) => new M.Indicate(c, { color: TC[k] })), { lagRatio: 0.2, runTime: 1.6 }), ...say('SCORES → HOW MUCH TO TAKE FROM EACH TOKEN'));
  await until(S(52)); await play(...[0, 1, 3].map(k => new M.Indicate(scored[k], { color: C.pink })), ...say('SCORE 0 ≠ NO INFORMATION', C.pink));
  await until(S(53)); await play(...say('NEXT: SCORES → SHARES OF ATTENTION', C.violet));
  await until(S(54)); await play(...fbox([['1. multiply matching numbers', C.ink], ['2. add the results', C.ink], ['3. divide by √(numbers each)', C.green]], C.green), ...say('MULTIPLY · ADD · DIVIDE', C.green));
}

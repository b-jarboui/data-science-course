// 19.2.6 Multi-head attention: two heads, two mixtures. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TOK = ['the', 'red', 'cup', 'fell'], TC = ['#94a3b8', '#fb7185', C.amber, C.violet];
  const QC = C.cyan, KC = C.amber, VC = C.violet, H1C = C.cyan, H2C = C.green;
  const HD = [
    { W: [17.5, 17.5, 47.5, 17.5], V: [[0, 0], [0, 2], [2, 0], [0, 0]], out: ['0.951', '0.350'] },
    { W: [17.5, 47.5, 17.5, 17.5], V: [[0, -1], [0, 1], [2, -1], [0, -1]], out: ['0.350', '-0.049'] },
  ];

  // ---- formula box
  let BOXP = P ? [0, 3.65, 0] : [5.3, 0.3, 0], MAXW = P ? FW - 0.8 : 3.5;
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = 20, lh = 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.35;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.175 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxh = P ? 1.3 : 1.75;
    const k = Math.min(1, MAXW / wd, maxh / ht); if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- 0-5 tokens and their original vectors
  const tokY = P ? 1.7 : 1.05, tx = k => (k - 1.5) * (P ? 1.8 : 2.5);
  const chips = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([tx(k), tokY, 0]));
  await until(S(0)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.6 }), ...say('“the red cup fell”'));
  await until(S(1)); await play(new M.Indicate(chips[3], { color: C.violet }), ...say('PREDICT THE TOKEN AFTER “fell”', C.violet));
  await until(S(2)); await play(new M.Indicate(chips[2], { color: C.amber }), ...say('WHAT FELL? THE cup', C.amber));
  await until(S(3)); await play(new M.Indicate(chips[1], { color: TC[1] }), ...say('ITS COLOUR? red', TC[1]));
  await until(S(4)); await play(...say('BOTH KINDS OF INFORMATION AT ONCE?', C.green));
  const vr = P ? 0.24 : 0.2, vstep = P ? 0.62 : 0.5, vtop = P ? 0.95 : 0.35;
  const vecs = TOK.map((_, k) => [0, 1, 2, 3].flatMap(i => {
    const p = [tx(k), vtop - i * vstep, 0];
    const c = new M.Circle({ radius: vr, color: TC[k], strokeWidth: 2.5 }); c.setFill(C.card, 0.95); c.moveTo(p);
    return [c, T(i === k ? '1' : '0', P ? 16 : 15, i === k ? TC[k] : C.muted, true).moveTo(p)];
  }));
  await until(S(5)); await play(new M.LaggedStart(vecs.flat().map(o => new M.FadeIn(o)), { lagRatio: 0.02, runTime: 1.6 }), ...say('ORIGINAL VECTORS'));

  // ---- the two heads: same tokens, own weights
  const hp = P
    ? [{ c: [0.2, 0.35], w: 3.6, h: 3.7, r: 0.17 }, { c: [0.2, -3.6], w: 3.6, h: 3.7, r: 0.17 }]
    : [{ c: [-3.4, -0.75], w: 2.4, h: 4.0, r: 0.17 }, { c: [1.6, -0.75], w: 2.4, h: 4.0, r: 0.17 }];
  const VI = [[0, 1], [3, 4], [6, 7], [9, 10]];
  const heads = hp.map((g, h) => {
    const N = net({ layers: [11, 2], center: [g.c[0], g.c[1], 0], width: g.w, height: g.h, r: g.r });
    const col = h ? H2C : H1C, nr = g.r, inX = N.pos(0, 0)[0], outX = N.pos(1, 0)[0];
    VI.forEach((p, k) => p.forEach(i => { N.nodes[0][i].setColor(TC[k]); N.nodes[0][i].setFill(C.card, 0.95); }));
    const OR = P ? 0.4 : 0.36, OY = P ? [g.c[1] + 0.45, g.c[1] - 0.5] : [-0.2, -1.3], opos = m => [outX, OY[m], 0];
    N.nodes[1].forEach((c, m) => { c.setColor(col); c.setFill(C.card, 0.95); c.scale(OR / nr); c.moveTo(opos(m)); });
    for (let i = 0; i < 11; i++) for (let m = 0; m < 2; m++) { const a = N.pos(0, i), ln = N.edges[0][i][m]; ln.setStart([a[0] + nr, a[1], -0.01]); ln.setEnd([outX - OR, OY[m], -0.01]); }
    const links = VI.flatMap((p, k) => p.map((i, m) => [k, i, m]));
    const gy = k => (N.pos(0, VI[k][0])[1] + N.pos(0, VI[k][1])[1]) / 2;
    const tag = pill(h ? 'HEAD 2' : 'HEAD 1', col, P ? 14 : 16);
    tag.moveTo(P ? [outX, g.c[1] + 1.25, 0] : [(inX + outX) / 2, g.c[1] + g.h / 2 + 0.05, 0]);
    const chipsH = TOK.map((s, k) => pill(s, TC[k], P ? 15 : 16).moveTo(P ? [-3.3, gy(k), 0] : [-6.4, gy(k), 0]));
    const H = { N, col, nr, inX, outX, OR, OY, opos, links, gy, tag, chipsH, vals: {}, sh: [null, null, null, null], out: [null, null] };
    H.setVal = (k, m, s, c) => { const i = VI[k][m], t = T(String(s), P ? 15 : 13, c, true).moveTo(N.pos(0, i)); const a = [new M.FadeIn(t)]; if (H.vals[i]) a.push(new M.FadeOut(H.vals[i])); H.vals[i] = t; return a; };
    H.setShares = (ws, hiK) => ws.flatMap((w, k) => { const t = T(w + '%', P ? 16 : 13, k === hiK ? C.amber : col, true).moveTo([inX - nr - (P ? 0.5 : 0.45), gy(k), 0]); const a = [new M.FadeIn(t)]; if (H.sh[k]) a.push(new M.FadeOut(H.sh[k])); H.sh[k] = t; return a; });
    H.setOut = vals => vals.flatMap((s, m) => { if (!s) return []; const t = T(s, P ? 15 : 13, col, true).moveTo(opos(m)); const a = [new M.FadeIn(t)]; if (H.out[m]) a.push(new M.FadeOut(H.out[m])); H.out[m] = t; return a; });
    H.reweight = ws => links.flatMap(([k, i, m]) => N.weight(0, i, m, ws[k] / 50));
    H.pulse = (ks = [0, 1, 2, 3]) => new M.LaggedStart(links.filter(([k]) => ks.includes(k)).map(([k, i, m]) => {
      const a = N.pos(0, i), b = opos(m), c = TC[k];
      const d = new M.Dot({ point: [a[0] + nr, a[1], 0], radius: 0.06, color: c }); d.setFill(c, 1);
      const e = new M.Dot({ point: [b[0] - OR, b[1], 0], radius: 0.06, color: c }); e.setFill(c, 0);
      return new M.Transform(d, e, { runTime: 0.9 });
    }), { lagRatio: 0.07, runTime: 1.8 });
    H.nodesIn = () => VI.flat().map(i => N.nodes[0][i]);
    H.edges = () => links.map(([k, i, m]) => N.edges[0][i][m]);
    return H;
  });
  const [H1, H2] = heads;
  const headIn = (H, withChips) => [new M.LaggedStart([...H.nodesIn(), ...H.N.nodes[1]].map(c => new M.FadeIn(c)), { lagRatio: 0.04, runTime: 1.2 }),
    ...(withChips ? H.chipsH.map(c => new M.FadeIn(c)) : [])];

  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(...chips, ...vecs.flat())), ...headIn(H1, true), ...say('OUR FAMILIAR ATTENTION NETWORK'));
  await play(...VI.flatMap((p, k) => p.flatMap((i, m) => H1.setVal(k, m, HD[0].V[k][m], HD[0].V[k][m] ? VC : C.muted))), new M.LaggedStart(H1.edges().map(e => new M.Create(e)), { lagRatio: 0.05, runTime: 1 }));
  await until(S(7)); await play(...fbox([['queries · keys → weights', C.amber], ['weights → mix the values', C.green]]), ...say('QUERIES, KEYS, VALUES → ATTENTION WEIGHTS'));

  // ---- 8-10 two readers
  const pc = P ? [[-1.8, -3.6], [1.8, -3.6]] : [[1.2, -1.2], [4.6, -1.2]];
  const person = ([x, y], col) => {
    const head = new M.Circle({ radius: 0.2, color: col }); head.setFill(col, 1); head.moveTo([x, y + 0.5, 0]);
    const body = new M.Arc({ radius: 0.38, startAngle: 0, angle: Math.PI, color: col }); body.setFill(col, 1); body.moveTo([x, y + 0.05, 0]);
    return [head, body];
  };
  const people = [person(pc[0], H1C), person(pc[1], H2C)];
  const thinks = [pill('the object: cup', C.amber, P ? 14 : 16), pill('its colour: red', TC[1], P ? 14 : 16)].map((t, n) => t.moveTo([pc[n][0], pc[n][1] + 1.1, 0]));
  await until(S(8)); await play(...dropBox(), ...people.flat().map(o => new M.FadeIn(o)), ...say('TWO PEOPLE READ THE SAME SENTENCE', C.green));
  await until(S(9)); await play(new M.LaggedStart(thinks.map(t => new M.FadeIn(t, { shift: [0, 0.2, 0] })), { lagRatio: 0.5, runTime: 1.6 }), ...say('ONE NOTICES THE OBJECT · ONE THE COLOUR', C.amber));
  await until(S(10)); await play(...say('SAME WORDS, DIFFERENT INFORMATION', C.green));

  // ---- 11-17 two heads side by side
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...people.flat(), ...thinks)), ...headIn(H2, P), ...say('TWO SEPARATE ATTENTION NETWORKS', C.green));
  await play(new M.LaggedStart(H2.edges().map(e => new M.Create(e)), { lagRatio: 0.05, runTime: 1 }));
  await until(S(12)); await play(...H1.nodesIn().map(c => new M.Indicate(c, { color: C.ink })), ...H2.nodesIn().map(c => new M.Indicate(c, { color: C.ink })), ...say('BOTH GET THE SAME TOKEN VECTORS'));
  await until(S(13)); await play(...fbox([['each network:', C.ink], ['own Q, K, V weights', C.amber]], C.amber), ...say('BUT EACH HAS ITS OWN WEIGHTS', C.amber));
  await until(S(14)); await play(new M.FadeIn(H1.tag), new M.FadeIn(H2.tag), ...say('EACH NETWORK = AN ATTENTION HEAD', C.green));
  await until(S(15)); await play(...say('SEVERAL HEADS = MULTI-HEAD ATTENTION', C.green));
  await until(S(16)); await play(new M.Indicate(H1.tag, { color: H1C }), new M.Indicate(H2.tag, { color: H2C }), ...say('HEAD 1 AND HEAD 2, SIDE BY SIDE'));
  await until(S(17)); await play(new M.Indicate(H1.chipsH[3], { color: C.violet }), ...(P ? [new M.Indicate(H2.chipsH[3], { color: C.violet })] : []), ...say('FOLLOW “fell” THROUGH BOTH HEADS', C.violet));

  // ---- 18-25 head 1
  await until(S(18)); await play(new M.Indicate(H1.tag, { color: H1C }), ...say('HEAD 1: THE WEIGHTS FROM BEFORE', H1C));
  await until(S(19)); await play(...fbox([['head 1', H1C], ['query of fell = (2,0,0,0)', QC]], H1C), ...say('QUERY (2, 0, 0, 0)', QC));
  await until(S(20)); await play(...fbox([['head 1', H1C], ['query of fell = (2,0,0,0)', QC], ['scaled scores = (0,0,1,0)', C.amber]], H1C), ...say('SCORES (0, 0, 1, 0)', C.amber));
  await until(S(21)); await play(...H1.setShares(HD[0].W, 2).filter((_, n) => n < 6), ...say('cup GETS ≈ 47.5%', C.amber));
  await until(S(22)); await play(...H1.sh.filter((_, k) => k !== 2).map(t => new M.Indicate(t, { color: H1C })), ...say('EACH OTHER TOKEN ≈ 17.5%'));
  await until(S(23)); await play(...H1.reweight(HD[0].W), ...say('THICK LINE FROM cup', C.amber));
  await until(S(24)); await play(H1.pulse(), ...say('MIX THE 4 VALUES → 2 NUMBERS', C.green));
  await until(S(25)); await play(...H1.setOut(HD[0].out), ...fbox([['head 1 output', H1C], ['≈ (0.951, 0.350)', H1C]], H1C), ...say('HEAD 1 ≈ (0.951, 0.350)', H1C));

  // ---- 26-44 head 2
  await until(S(26)); await play(new M.Indicate(H2.tag, { color: H2C }), ...say('NOW THE SAME TOKEN THROUGH HEAD 2', H2C));
  await until(S(27)); await play(...fbox([['head 2', H2C], ['query of fell = (0,2,0,0)', QC]], H2C), ...say('DIFFERENT WEIGHTS → QUERY (0, 2, 0, 0)', QC));
  await until(S(28)); await play(...(P ? [new M.Indicate(H2.chipsH[1], { color: TC[1] })] : [new M.Indicate(H1.chipsH[1], { color: TC[1] })]), ...say('ONLY THE KEY OF red IS NOT ZERO', KC));
  await until(S(29)); await play(...fbox([['head 2', H2C], ['query of fell = (0,2,0,0)', QC], ['key of red = (0,1,0,0)', KC]], H2C), ...say('KEY of red = (0, 1, 0, 0)', KC));
  await until(S(30)); await play(...fbox([['head 2', H2C], ['query of fell = (0,2,0,0)', QC], ['scaled scores = (0,1,0,0)', C.amber]], H2C), ...say('SCORES (0, 1, 0, 0)', C.amber));
  await until(S(31)); await play(...H2.setShares(HD[1].W, 1), ...say('red GETS ≈ 47.5%', TC[1]));
  await until(S(32)); await play(...H2.sh.filter((_, k) => k !== 1).map(t => new M.Indicate(t, { color: H2C })), ...say('EACH OTHER TOKEN ≈ 17.5%'));
  await until(S(33)); await play(...H2.reweight(HD[1].W), ...say('HEAD 2: THICKEST LINE FROM red', TC[1]));
  await until(S(34)); await play(...say('HEAD 2 ALSO HAS DIFFERENT VALUES', VC));
  for (let k = 0; k < 4; k++) {
    await until(S(35 + k));
    const v = HD[1].V[k];
    await play(...v.flatMap((x, m) => H2.setVal(k, m, x, x > 0 ? VC : x < 0 ? C.pink : C.muted)), ...say(`${TOK[k]} CARRIES (${v.join(', ')})`, TC[k]));
  }
  await until(S(39)); await play(...H2.links.filter(([k, i, m]) => m === 0).map(([k, i]) => new M.Indicate(H2.N.nodes[0][i], { color: k === 2 ? C.amber : C.muted })), ...say('FIRST NUMBER: ONLY cup HAS ONE', C.amber));
  await until(S(40)); await play(H2.pulse([2]), ...H2.setOut([HD[1].out[0], '']), ...fbox([['first number', H2C], ['17.5% of 2 ≈ 0.350', C.amber]], H2C), ...say('0.175 × 2 ≈ 0.350', C.amber));
  await until(S(41)); await play(...fbox([['second number', H2C], ['red: 47.5% of 1 ≈ +0.475', C.green]], H2C), ...say('red ADDS ≈ +0.475', C.green));
  await until(S(42)); await play(...fbox([['second number', H2C], ['red:  ≈ +0.475', C.green], ['the, cup, fell: ≈ -0.175 each', C.pink]], H2C), ...say('3 TOKENS × (≈ -0.175)', C.pink));
  await until(S(43)); await play(H2.pulse([0, 1, 3]), ...H2.setOut(HD[1].out), ...fbox([['second number', H2C], ['0.475 - 0.175 - 0.175 - 0.175', C.ink], ['≈ -0.049', C.green]], H2C), ...say('≈ -0.049 (BEFORE ROUNDING)', C.green));
  await until(S(44)); await play(...H2.out.map(t => new M.Indicate(t, { color: H2C })), ...fbox([['head 2 output', H2C], ['≈ (0.350, -0.049)', H2C]], H2C), ...say('HEAD 2 ≈ (0.350, -0.049)', H2C));

  // ---- 45-50 join the two outputs, output projection
  const pr = P ? 0.48 : 0.4;
  const PN = net({ layers: [4, 4], center: P ? [0, -1.6, 0] : [-1.0, -0.6, 0], width: P ? 4.4 : 4.6, height: P ? 4.4 : 3.1, r: pr });
  const JC = [H1C, H1C, H2C, H2C], JV = [...HD[0].out, ...HD[1].out];
  PN.nodes[0].forEach((c, i) => { c.setColor(JC[i]); c.setFill(C.card, 0.95); });
  PN.nodes[1].forEach(c => { c.setColor(C.amber); c.setFill(C.card, 0.95); });
  const jNums = JV.map((s, i) => T(s, P ? 16 : 14, JC[i], true).moveTo(PN.pos(0, i)));
  const jTags = [0, 1].map(h => { const y = (PN.pos(0, 2 * h)[1] + PN.pos(0, 2 * h + 1)[1]) / 2; const t = pill(h ? 'head 2' : 'head 1', h ? H2C : H1C, P ? 15 : 14); return t.moveTo([PN.pos(0, 0)[0] - pr - 0.15 - t.getWidth() / 2, y, 0]); });
  if (!P) { BOXP = [4.6, -0.6, 0]; MAXW = 4.0; }
  await until(S(45));
  await play(new M.FadeOut(new M.VGroup(...[H1, H2].flatMap(H => [...H.N.nodes.flat(), ...H.edges(), ...(H === H1 || P ? H.chipsH : []), H.tag, ...Object.values(H.vals), ...H.sh.filter(Boolean), ...H.out.filter(Boolean)]))), ...dropBox(),
    ...say('PUT THE 2 + 2 OUTPUT CIRCLES TOGETHER', C.violet));
  await play(new M.LaggedStart([...PN.nodes[0], ...jNums, ...jTags].map(o => new M.FadeIn(o)), { lagRatio: 0.08, runTime: 1.4 }));
  await until(S(46)); await play(...PN.nodes[0].map((c, i) => new M.Indicate(c, { color: JC[i] })), ...fbox([['(0.951, 0.350, 0.350, -0.049)', C.ink]]), ...say('ONE GROUP OF 4 NUMBERS', C.green));
  await until(S(47)); await play(...fbox([['joining vectors', C.ink], ['= CONCATENATION', C.green]], C.green), ...say('CONCATENATION', C.green));
  await until(S(48)); await play(...PN.nodes[1].map(c => new M.FadeIn(c)), new M.LaggedStart(PN.edges[0].flat().map(e => new M.Create(e)), { lagRatio: 0.03, runTime: 1.2 }), ...say('A FINAL NETWORK CAN MIX THEM AGAIN', C.amber));
  const restyle = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if (i === j) restyle.push(...PN.weight(0, i, j, 1));
    else { const ln = PN.edges[0][i][j], t = ln.copy(); t.setStrokeOpacity(0.1); t.setStrokeWidth(1); restyle.push(new M.Transform(ln, t)); }
  }
  const pOut = JV.map((s, i) => T(s, P ? 16 : 14, C.amber, true).moveTo(PN.pos(1, i)));
  const ptag = pill('OUTPUT PROJECTION', C.amber, P ? 15 : 14).moveTo([(PN.pos(0, 0)[0] + PN.pos(1, 0)[0]) / 2, PN.pos(0, 3)[1] - pr - 0.38, 0]);
  await until(S(49)); await play(...restyle, new M.FadeIn(ptag), ...fbox([['our example:', C.amber], ['weight 1 straight across', C.amber], ['→ numbers stay the same', C.ink]], C.amber), ...say('OUTPUT PROJECTION: HERE NOTHING CHANGES', C.amber));
  const ppulse = [0, 1, 2, 3].map(i => {
    const a = PN.pos(0, i), b = PN.pos(1, i);
    const d = new M.Dot({ point: [a[0] + pr, a[1], 0], radius: 0.07, color: C.amber }); d.setFill(C.amber, 1);
    const e = new M.Dot({ point: [b[0] - pr, b[1], 0], radius: 0.07, color: C.amber }); e.setFill(C.amber, 0);
    return new M.Transform(d, e, { runTime: 0.9 });
  });
  await play(new M.LaggedStart(ppulse, { lagRatio: 0.15, runTime: 1.4 }), ...pOut.map(t => new M.FadeIn(t)));
  await until(S(50)); await play(...fbox(['multi-head output =', ['output projection(', C.amber], ['  head 1 ⧺ head 2 )', C.green]], C.green), ...say('PROJECT THE JOINED HEAD OUTPUTS', C.green));

  // ---- 51-54 meaning and caution
  await until(S(51)); await play(...jTags.map((t, h) => new M.Indicate(t, { color: h ? H2C : H1C })), ...say('SEVERAL MIXTURES FROM THE SAME TOKENS', C.green));
  await until(S(52)); await play(...say('REAL HEADS LEARN THEIR WEIGHTS IN TRAINING', C.muted));
  await until(S(53)); await play(...fbox(['a head ≠ always one clear job', ['(not just “colour”)', C.pink]], C.pink), ...say('DO NOT ASSUME ONE JOB PER HEAD', C.pink));
  await until(S(54)); await play(...fbox([['each head: its own mixture', C.ink], ['model: joins the mixtures', C.green]], C.green), ...say('EACH HEAD MIXES · THE MODEL COMBINES', C.green));
}

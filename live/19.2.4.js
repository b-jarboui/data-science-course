// 19.2.4 Self-attention: every token collects its own mixture. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TOK = ['the', 'red', 'cup', 'fell'], TC = ['#94a3b8', '#fb7185', C.amber, C.violet];
  const QC = C.cyan, KC = C.amber, VC = C.violet;
  const Q = [[0, 0, 0, 0], [2, 0, 0, 0], [0, 2, 0, 0], [2, 0, 0, 0]];
  const K = [[0, 0, 0, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]];
  const VAL = [[0, 0], [0, 2], [2, 0], [0, 0]];
  const SCR = ['0, 0, 0, 0', '0, 0, 1, 0', '0, 1, 0, 0', '0, 0, 1, 0'];
  const W = [[25, 25, 25, 25], [17.5, 17.5, 47.5, 17.5], [17.5, 47.5, 17.5, 17.5], [17.5, 17.5, 47.5, 17.5]];
  const OUT = [['0.5', '0.5'], ['0.95', '0.35'], ['0.35', '0.95'], ['0.95', '0.35']];

  // ---- formula box
  let BOXP = P ? [0, 3.65, 0] : [4.4, 0.55, 0];
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
    const maxw = P ? FW - 0.8 : 4.4, maxh = P ? 1.3 : 1.75;
    const k = Math.min(1, maxw / wd, maxh / ht); if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- phase 1: tokens, input circles, three small networks
  const tokY = P ? 1.7 : 1.05, tx = k => (k - 1.5) * (P ? 1.9 : 3.1);
  const chips = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([tx(k), tokY, 0]));
  await until(S(0)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.6 }), ...say('“the red cup fell”'));
  await until(S(1)); await play(new M.Indicate(chips[1], { color: TC[1] }), new M.Indicate(chips[2], { color: TC[2] }), ...say('red ↔ cup?   cup ↔ fell?', C.amber));
  await until(S(2)); await play(...say('UNDERSTANDING NEEDS CONNECTIONS BETWEEN TOKENS', C.amber));
  await until(S(3)); await play(new M.LaggedStart(chips.map((c, k) => new M.Indicate(c, { color: TC[k] })), { lagRatio: 0.2, runTime: 1.4 }), ...say('OUR 4 TOKENS'));
  const mr = P ? 0.21 : 0.2, my = P ? 0.0 : -0.35;
  const minis = TOK.map((_, k) => {
    const N = net({ layers: [4, 3], center: [tx(k), my, 0], width: P ? 1.3 : 1.5, height: P ? 2.1 : 1.7, r: mr });
    N.nodes[0].forEach(c => { c.setColor(TC[k]); c.setFill(C.card, 0.95); });
    [QC, KC, VC].forEach((col, j) => { N.nodes[1][j].setColor(col); N.nodes[1][j].setFill(C.card, 0.95); });
    N.edges[0].flat().forEach(e => { e.setStrokeOpacity(0.3); e.setStrokeWidth(1.2); });
    return N;
  });
  const inNums = minis.map((N, k) => [0, 1, 2, 3].map(i => T(i === k ? '1' : '0', P ? 15 : 16, i === k ? TC[k] : C.muted, true).moveTo(N.pos(0, i))));
  await until(S(4)); await play(new M.LaggedStart(minis.flatMap((N, k) => [...N.nodes[0], ...inNums[k]].map(o => new M.FadeIn(o))), { lagRatio: 0.02, runTime: 1.6 }), ...say('ORIGINAL VECTOR: 4 INPUT CIRCLES'));
  const qkvL = minis.map(N => ['Q', 'K', 'V'].map((s, j) => T(s, P ? 15 : 16, [QC, KC, VC][j], true, true).moveTo(N.pos(1, j))));
  const vy = P ? [-1.55, -2.05, -2.55] : [-1.6, -2.0, -2.4];
  const fmt = v => '(' + v.join(',') + ')';
  const vecT = TOK.map((_, k) => [['Q ' + fmt(Q[k]), QC], ['K ' + fmt(K[k]), KC], ['V ' + fmt(VAL[k]), VC]].map(([s, c], j) => T(s, P ? 15 : 14, c, true).moveTo([tx(k), vy[j], 0])));
  await until(S(5)); await play(new M.LaggedStart(minis.flatMap((N, k) => [...N.edges[0].flat().map(e => new M.Create(e)), ...N.nodes[1].map(c => new M.FadeIn(c)), ...qkvL[k].map(t => new M.FadeIn(t))]), { lagRatio: 0.01, runTime: 1.8 }),
    ...say('3 SMALL NETWORKS: QUERY, KEY, VALUE'));
  await until(S(6)); await play(new M.LaggedStart(vecT.map(v => new M.FadeIn(v[0])), { lagRatio: 0.2, runTime: 1.2 }), ...say('QUERY: FINDS INFORMATION FROM OTHERS', QC));
  await until(S(7)); await play(new M.LaggedStart(vecT.map(v => new M.FadeIn(v[1])), { lagRatio: 0.2, runTime: 1.2 }), ...say('KEY: HOW MUCH ATTENTION ITS TOKEN GETS', KC));
  await until(S(8)); await play(new M.LaggedStart(vecT.map(v => new M.FadeIn(v[2])), { lagRatio: 0.2, runTime: 1.2 }), ...say('VALUE: INFORMATION IT CAN SHARE', VC));

  // ---- 9-15 four students share information
  const sy = P ? -0.2 : -0.5;
  const student = k => {
    const x = tx(k), head = new M.Circle({ radius: 0.16, color: TC[k] }); head.setFill(TC[k], 1); head.moveTo([x, sy + 0.4, 0]);
    const body = new M.Arc({ radius: 0.3, startAngle: 0, angle: Math.PI, color: TC[k] }); body.setFill(TC[k], 1); body.moveTo([x, sy + 0.04, 0]);
    return [head, body];
  };
  const studs = TOK.map((_, k) => student(k));
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(...minis.flatMap((N, k) => [...N.nodes.flat(), ...N.edges.flat(2), ...inNums[k], ...qkvL[k], ...vecT[k]]))),
    new M.LaggedStart(studs.flat().map(o => new M.FadeIn(o)), { lagRatio: 0.1, runTime: 1.2 }), ...say('4 STUDENTS, SAME SUBJECT', C.green));
  const pairs = [[0, 1], [1, 2], [2, 3], [0, 2], [1, 3], [0, 3]];
  // shallow arc through two points: chord c, sag h (down = true bends below)
  const sag = (x0, x1, y, h, col, down = true) => {
    const c = Math.abs(x1 - x0), R = (c * c / 4 + h * h) / (2 * h), th = 2 * Math.asin(Math.min(1, c / (2 * R)));
    const ar = new M.Arc({ radius: R, startAngle: (down ? 1.5 : 0.5) * Math.PI - th / 2, angle: th, color: col, strokeWidth: 2.5 });
    ar.moveTo([(x0 + x1) / 2, y + (down ? -h / 2 : h / 2), 0]); return ar;
  };
  const arcs = pairs.map(([a, b]) => { const ar = sag(tx(a), tx(b), sy - 0.32, 0.25 + 0.3 * (b - a) * (P ? 0.9 : 0.6), C.green); ar.setStrokeOpacity(0.75); return ar; });
  await until(S(10)); await play(new M.LaggedStart(arcs.map(a => new M.Create(a)), { lagRatio: 0.15, runTime: 1.6 }), ...say('EACH ASKS A DIFFERENT QUESTION', C.green));
  const ring = new M.Circle({ radius: 0.55, color: C.amber, strokeWidth: 3 }); ring.moveTo([tx(1), sy + 0.25, 0]);
  await until(S(11)); await play(new M.Create(ring), ...say('THEY CAN ALSO USE WHAT THEY KNOW', C.amber));
  await until(S(12)); await play(new M.FadeOut(ring), new M.LaggedStart(chips.map((c, k) => new M.Indicate(c, { color: TC[k] })), { lagRatio: 0.2, runTime: 1.4 }), ...say('OUR 4 TOKENS DO THE SAME'));
  await until(S(13)); await play(new M.LaggedStart(arcs.map(a => new M.Indicate(a, { color: QC })), { lagRatio: 0.1, runTime: 1.6 }), ...say('EACH OWN QUERY → WHOLE SEQUENCE', QC));
  const brace = new M.Line({ start: [tx(0) - 0.5, tokY + 0.42, 0], end: [tx(3) + 0.5, tokY + 0.42, 0], color: C.muted, strokeWidth: 2 });
  await until(S(14)); await play(new M.Create(brace), ...say('SEQUENCE = AN ORDERED GROUP', C.muted));
  await until(S(15)); await play(new M.FadeOut(brace), ...say('SHARING INSIDE ONE SEQUENCE = SELF-ATTENTION', C.green));

  // ---- 16-42 one token at a time, with the mixing network
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...chips, ...studs.flat(), ...arcs)), ...say('ONE TOKEN AT A TIME', C.violet));
  const nr = P ? 0.26 : 0.18;
  const N = net({ layers: [11, 2], center: P ? [0.3, -1.75, 0] : [-1.5, -0.75, 0], width: P ? 4.4 : 5.0, height: P ? 6.6 : 4.2, r: nr });
  const VI = [[0, 1], [3, 4], [6, 7], [9, 10]];
  VI.flat().forEach(i => { N.nodes[0][i].setColor(VC); N.nodes[0][i].setFill(C.card, 0.95); });
  const inX = N.pos(0, 0)[0], outX = N.pos(1, 0)[0];
  const OR = P ? 0.42 : 0.36, OY = P ? [-1.1, -2.4] : [-0.2, -1.3], opos = m => [outX, OY[m], 0];
  N.nodes[1].forEach((c, m) => { c.setColor(C.green); c.setFill(C.card, 0.95); c.scale(OR / nr); c.moveTo(opos(m)); });
  for (let i = 0; i < 11; i++) for (let m = 0; m < 2; m++) { const a = N.pos(0, i), ln = N.edges[0][i][m]; ln.setStart([a[0] + nr, a[1], -0.01]); ln.setEnd([outX - OR, OY[m], -0.01]); }
  const links = VI.flatMap((p, k) => p.map((i, m) => [k, i, m]));
  const gy = k => (N.pos(0, VI[k][0])[1] + N.pos(0, VI[k][1])[1]) / 2;
  const chipsB = TOK.map((s, k) => pill(s, TC[k], P ? 16 : 17).moveTo(P ? [-3.3, gy(k) + 0.25, 0] : [-6.1, gy(k), 0]));
  const vNums = VI.flatMap((p, k) => p.map((i, m) => T(String(VAL[k][m]), P ? 17 : 15, VAL[k][m] ? VC : C.muted, true).moveTo(N.pos(0, i))));
  const vlab = pill('VALUES', VC, P ? 14 : 15).moveTo([inX, N.pos(0, 0)[1] + nr + 0.35, 0]);
  await play(new M.LaggedStart([...VI.flat().map(i => new M.FadeIn(N.nodes[0][i])), ...vNums.map(t => new M.FadeIn(t))], { lagRatio: 0.03, runTime: 1 }),
    ...chipsB.map(c => new M.FadeIn(c)), new M.FadeIn(vlab), ...N.nodes[1].map(c => new M.FadeIn(c)));
  // shares beside each token, output values, receiver label
  let shT = [null, null, null, null], outV = [null, null], olab = null;
  const shareAnims = (t, hiK) => TOK.flatMap((_, k) => {
    const s = T(W[t][k] + '%', P ? 18 : 15, k === hiK ? C.amber : C.cyan, true).moveTo(P ? [-3.3, gy(k) - 0.27, 0] : [-4.95, gy(k), 0]);
    const a = [new M.FadeIn(s)]; if (shT[k]) a.push(new M.FadeOut(shT[k])); shT[k] = s; return a;
  });
  const setOut = vals => vals.flatMap((s, m) => { const t = T(s, P ? 16 : 15, C.green, true).moveTo(opos(m)); const a = [new M.FadeIn(t)]; if (outV[m]) a.push(new M.FadeOut(outV[m])); outV[m] = t; return a; });
  const clearOut = () => { const a = outV.filter(Boolean).map(t => new M.FadeOut(t)); outV = [null, null]; return a; };
  const receiver = t => {
    const p = pill('new ' + TOK[t], TC[t], P ? 15 : 16);
    p.moveTo(P ? [outX, OY[0] + OR + 0.35, 0] : [outX + OR + 0.2 + p.getWidth() / 2, (OY[0] + OY[1]) / 2, 0]);
    const a = [new M.FadeIn(p)]; if (olab) a.push(new M.FadeOut(olab)); olab = p; return a;
  };
  const reweight = t => links.flatMap(([k, i, m]) => N.weight(0, i, m, W[t][k] / 50));
  const pulse = t => new M.LaggedStart(links.map(([k, i, m]) => {
    const a = N.pos(0, i), b = opos(m), col = TC[k];
    const d = new M.Dot({ point: [a[0] + nr, a[1], 0], radius: P ? 0.08 : 0.06, color: col }); d.setFill(col, 1);
    const e = new M.Dot({ point: [b[0] - OR, b[1], 0], radius: P ? 0.08 : 0.06, color: col }); e.setFill(col, 0);
    return new M.Transform(d, e, { runTime: 0.9 });
  }), { lagRatio: 0.07, runTime: 1.8 });
  const qLine = t => [`query of ${TOK[t]} = ${fmt(Q[t])}`, QC];

  // the
  await until(S(17)); await play(...receiver(0), new M.Indicate(chipsB[0], { color: TC[0] }), ...say('FIRST TOKEN: “the”', TC[0]));
  await until(S(18)); await play(...fbox([qLine(0)]), ...say('ITS QUERY: FOUR ZEROS', QC));
  await until(S(19)); await play(...fbox([qLine(0), ['scores = (0, 0, 0, 0)', C.amber]]), ...say('4 KEYS → 4 SCORES OF 0', C.amber));
  await until(S(20)); await play(...say('EQUAL SCORES → EQUAL WEIGHTS', C.green));
  await until(S(21)); await play(...shareAnims(0, -1), ...fbox([qLine(0), ['scores = (0, 0, 0, 0)', C.amber], ['weights = 25% each', C.green]]), ...say('25% EACH', C.green));
  await until(S(22)); await play(new M.LaggedStart(links.map(([k, i, m]) => new M.Create(N.edges[0][i][m])), { lagRatio: 0.06, runTime: 1 }), ...say('4 EQUALLY THICK LINES'));
  await play(...reweight(0));
  await until(S(23)); await play(...[2, 1].flatMap(k => VI[k].map(i => new M.Indicate(N.nodes[0][i], { color: TC[k] }))), ...say('cup (2, 0)   red (0, 2)', C.amber));
  await until(S(24)); await play(...[0, 3].flatMap(k => VI[k].map(i => new M.Indicate(N.nodes[0][i], { color: C.muted }))), ...say('the, fell: ONLY ZEROS', C.muted));
  await until(S(25)); await play(...fbox(['25% of 2 = 0.5']), ...say('25% OF 2 = 0.5'));
  await until(S(26)); await play(pulse(0), ...setOut(OUT[0]), ...fbox([['new the = (0.5, 0.5)', C.green]], C.green), ...say('OUTPUT of the = (0.5, 0.5)', C.green));

  // red, cup, fell
  const STEP = [[1, 27], [2, 33], [3, 39]];
  for (const [t, s0] of STEP) {
    const hiK = W[t].indexOf(47.5);
    await until(S(s0)); await play(...receiver(t), ...clearOut(), new M.Indicate(chipsB[t], { color: TC[t] }), ...fbox([qLine(t)]), ...say(`NOW “${TOK[t]}”: QUERY ${fmt(Q[t])}`, TC[t]));
    await until(S(s0 + 1)); await play(...fbox([qLine(t), [`scaled scores = (${SCR[t]})`, C.amber]]), ...say(`SCORES (${SCR[t]})`, C.amber));
    if (t === 3) {
      await until(S(41)); await play(...fbox([qLine(3), [`scaled scores = (${SCR[3]})`, C.amber], ['same as red', C.green]]), ...say('THE SAME SCORES AS FOR red', C.green));
      await until(S(42)); await play(...shareAnims(3, hiK), ...reweight(3), ...say('SAME MIXTURE: ≈ (0.95, 0.35)', C.green));
      await play(pulse(3), ...setOut(OUT[3]), ...fbox([['new fell ≈ (0.95, 0.35)', C.green]], C.green));
      break;
    }
    await until(S(s0 + 2)); await play(...shareAnims(t, hiK), new M.Indicate(chipsB[hiK], { color: TC[hiK] }), ...say(`${TOK[hiK]} GETS ≈ 47.5%`, TC[hiK]));
    await until(S(s0 + 3)); await play(...TOK.map((_, k) => k).filter(k => k !== hiK).map(k => new M.Indicate(shT[k], { color: C.cyan })), ...say('EACH OTHER TOKEN: ≈ 17.5%'));
    await until(S(s0 + 4)); await play(...reweight(t), ...say(`THE LINE FROM ${TOK[hiK]} GETS THICKER`, TC[hiK]));
    await until(S(s0 + 5)); await play(pulse(t), ...setOut(OUT[t]), ...fbox([[`new ${TOK[t]} ≈ (${OUT[t].join(', ')})`, C.green]], C.green), ...say(`OUTPUT of ${TOK[t]} ≈ (${OUT[t].join(', ')})`, C.green));
  }

  // ---- 43-54 all four outputs together
  BOXP = P ? [0, 3.65, 0] : [0, -1.95, 0];
  // phone: one row per token (chip, then its two output circles), using the whole height
  const or = P ? 0.5 : 0.34, oy = P ? 0.6 : 0.0, rowY = k => 1.3 - k * 1.5;
  const chipsC = TOK.map((s, k) => pill(s, TC[k], P ? 20 : 20).moveTo(P ? [-1.9, rowY(k), 0] : [tx(k), tokY, 0]));
  const oc = TOK.map((_, k) => [0, 1].map(m => { const c = new M.Circle({ radius: or, color: C.green, strokeWidth: 2.5 }); c.setFill(C.card, 0.95); c.moveTo(P ? [0.1 + m * 1.2, rowY(k), 0] : [tx(k) + (m - 0.5) * (2 * or + 0.1), oy, 0]); return c; }));
  const on = TOK.map((_, k) => [0, 1].map(m => T(OUT[k][m], P ? 19 : 16, C.green, true).moveTo(oc[k][m].getCenter())));
  await until(S(43));
  await play(new M.FadeOut(new M.VGroup(...N.nodes.flat(), ...links.map(([k, i, m]) => N.edges[0][i][m]), ...vNums, ...chipsB, vlab, ...shT, ...outV, olab)), ...dropBox(),
    ...chipsC.map(c => new M.FadeIn(c)), ...say('ALL 4 OUTPUT VECTORS', C.green));
  await play(new M.LaggedStart(TOK.flatMap((_, k) => [...oc[k], ...on[k]].map(o => new M.FadeIn(o))), { lagRatio: 0.1, runTime: 1.6 }));
  await until(S(44)); await play(...oc.flat().map(c => new M.Indicate(c, { color: C.green })), ...say('EACH: INFORMATION FROM THE SAME SEQUENCE', C.green));
  await until(S(45)); await play(...oc[1].map(c => new M.Indicate(c, { color: TC[1] })), ...oc[2].map(c => new M.Indicate(c, { color: TC[2] })), ...say('DIFFERENT QUERIES → DIFFERENT MIXTURES', C.amber));
  await until(S(46)); await play(...fbox(['real model: all 4 at the same time']), ...say('ALL AT THE SAME TIME', C.violet));
  await until(S(47)); await play(...fbox(['every calculation reads', ['the ORIGINAL keys and values', C.amber], ['not other new outputs', C.muted]], C.amber), ...say('ALWAYS THE ORIGINAL KEYS AND VALUES', C.amber));
  await until(S(48)); await play(...say('ONE SHORT FORMULA'));
  await until(S(49)); await play(...fbox(['output number =', ['sum of (value × attention weight)', C.green]], C.green), ...say('SUM OF VALUE × WEIGHT', C.green));
  await until(S(50)); await play(new M.LaggedStart(chipsC.map((c, k) => new M.Indicate(c, { color: TC[k] })), { lagRatio: 0.2, runTime: 1.4 }), ...say('EACH TOKEN USES ITS NEIGHBOURS', C.green));
  let leak;
  if (P) { // vertical arc on the right, from the cup row up to the red row
    const c = rowY(1) - rowY(2), h = 0.5, R = (c * c / 4 + h * h) / (2 * h), th = 2 * Math.asin(Math.min(1, c / (2 * R)));
    leak = new M.Arc({ radius: R, startAngle: -th / 2, angle: th, color: C.pink, strokeWidth: 2.5 });
    leak.moveTo([1.3 + or + 0.15 + h / 2, (rowY(1) + rowY(2)) / 2, 0]);
  } else leak = sag(tx(1), tx(2), oy - or - 0.12, 0.45, C.pink);
  await until(S(51)); await play(new M.Create(leak), ...say('red RECEIVES FROM cup · cup COMES LATER', C.pink));
  await until(S(52)); await play(new M.Indicate(chipsC[2], { color: C.pink }), ...say('A PROBLEM FOR PREDICTING THE NEXT TOKEN', C.pink));
  await until(S(53)); await play(...say('NEXT: BLOCK LATER TOKENS', C.violet));
  await until(S(54)); await play(new M.FadeOut(leak), ...fbox([['self-attention:', C.ink], ['every token collects its own mixture', C.green], ['from the same sequence', C.green]], C.green), ...say('SELF-ATTENTION', C.green));
}

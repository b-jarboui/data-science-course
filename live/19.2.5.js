// 19.2.5 Causal masking: no peeking at later tokens. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TOK = ['the', 'red', 'cup', 'fell'], TC = ['#94a3b8', '#fb7185', C.amber, C.violet];
  const QC = C.cyan, KC = C.amber, VC = C.violet;
  const VAL = [[0, 0], [0, 2], [2, 0], [0, 0]];

  // ---- formula box
  let BOXP = P ? [0, 3.65, 0] : [4.4, 0.55, 0], MAXH = P ? 1.3 : 1.75;
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
    const maxw = P ? FW - 0.8 : 4.4;
    const k = Math.min(1, maxw / wd, MAXH / ht); if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- 0-8 practising next-token prediction
  const tokY = P ? 1.7 : 1.05, tx = k => (k - 1.5) * (P ? 1.9 : 3.1);
  const chips = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([tx(k), tokY, 0]));
  const guessY = P ? 0.6 : 0.1;
  const guesses = [1, 2, 3].map(n => pill('→ ' + TOK[n] + '?', TC[n], P ? 15 : 17).moveTo([tx(n - 1), guessY, 0]));
  await until(S(0)); await play(new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.6 }), ...say('“the red cup fell”'));
  await until(S(1)); await play(...say('TRAINING: PREDICT THE NEXT TOKEN AT EACH PLACE', C.violet));
  for (let n = 0; n < 3; n++) {
    await until(S(2 + n));
    await play(new M.FadeIn(guesses[n], { shift: [0, -0.2, 0] }), new M.Indicate(chips[n], { color: TC[n] }), ...say(`AFTER “${TOK[n]}” → PREDICT “${TOK[n + 1]}”`, TC[n + 1]));
  }
  await until(S(5)); await play(new M.Indicate(chips[2], { color: C.pink }), ...say('WHAT IF IT CAN SEE THE ANSWER?', C.pink));
  BOXP = P ? [0, -2.2, 0] : [0, -1.6, 0];
  await until(S(6)); await play(...fbox(['question: what comes after red?', ['answer: cup   ← visible!', C.pink]], C.pink), ...say('THE ANSWER IS VISIBLE', C.pink));
  await until(S(7)); await play(...say('COPY THE ANSWER ≠ LEARN', C.pink));
  await until(S(8)); await play(...say('OUR MODEL HAS THE SAME PROBLEM', C.amber));

  // ---- 9-23 attention of red, then the cover
  BOXP = P ? [0, 3.65, 0] : [4.4, 0.55, 0];
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
  const olab = pill('new red', TC[1], P ? 15 : 16);
  olab.moveTo(P ? [outX, OY[0] + OR + 0.35, 0] : [outX + OR + 0.2 + olab.getWidth() / 2, (OY[0] + OY[1]) / 2, 0]);
  let shT = [null, null, null, null], outV = [null, null];
  const shareAnims = (ws, col, ks = [0, 1, 2, 3]) => ks.flatMap(k => {
    const w = ws[k], s = T(w + '%', P ? 18 : 15, col(k), true).moveTo(P ? [-3.3, gy(k) - 0.27, 0] : [-4.95, gy(k), 0]);
    const a = [new M.FadeIn(s)]; if (shT[k]) a.push(new M.FadeOut(shT[k])); shT[k] = s; return a;
  });
  const setOut = vals => vals.flatMap((s, m) => { const t = T(s, P ? 16 : 15, C.green, true).moveTo(opos(m)); const a = [new M.FadeIn(t)]; if (outV[m]) a.push(new M.FadeOut(outV[m])); outV[m] = t; return a; });
  const pulse = (ks, runTime = 1.8) => new M.LaggedStart(links.filter(([k]) => ks.includes(k)).map(([k, i, m]) => {
    const a = N.pos(0, i), b = opos(m), col = TC[k];
    const d = new M.Dot({ point: [a[0] + nr, a[1], 0], radius: P ? 0.08 : 0.06, color: col }); d.setFill(col, 1);
    const e = new M.Dot({ point: [b[0] - OR, b[1], 0], radius: P ? 0.08 : 0.06, color: col }); e.setFill(col, 0);
    return new M.Transform(d, e, { runTime: 0.9 });
  }), { lagRatio: 0.1, runTime });

  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(...chips, ...guesses)), ...dropBox(),
    new M.LaggedStart([...VI.flat().map(i => new M.FadeIn(N.nodes[0][i])), ...vNums.map(t => new M.FadeIn(t)), ...N.nodes[1].map(c => new M.FadeIn(c))], { lagRatio: 0.03, runTime: 1.2 }),
    ...chipsB.map(c => new M.FadeIn(c)), new M.FadeIn(vlab), ...say('THE 4 TOKENS AND THEIR ATTENTION NETWORK'));
  await until(S(10)); await play(new M.FadeIn(olab), new M.Indicate(chipsB[1], { color: TC[1] }), ...say('FOCUS ON “red”: TOKEN 2', TC[1]));
  await until(S(11)); await play(...fbox([['query of red = (2,0,0,0)', QC]]), ...say('QUERY (2, 0, 0, 0)', QC));
  await until(S(12)); await play(...say('COMPARE WITH THE 4 KEYS', KC));
  await until(S(13)); await play(...fbox([['query of red = (2,0,0,0)', QC], ['scores = (0, 0, 1, 0)', C.amber]]), ...say('SCORES (0, 0, 1, 0)', C.amber));
  await until(S(14)); await play(...shareAnims([17.5, 17.5, 47.5, 17.5], k => k === 2 ? C.amber : C.cyan), ...say('SOFTMAX → 4 SHARES'));
  await until(S(15)); await play(new M.Indicate(shT[2], { color: C.amber }), ...say('cup GETS ≈ 47.5%', C.amber));
  await until(S(16)); await play(new M.LaggedStart(links.map(([k, i, m]) => new M.Create(N.edges[0][i][m])), { lagRatio: 0.06, runTime: 0.8 }), ...say('THICK LINE: cup → red', C.amber));
  await play(...links.flatMap(([k, i, m]) => N.weight(0, i, m, [17.5, 17.5, 47.5, 17.5][k] / 50)));
  await play(pulse([2], 1.2), ...setOut(['0.95', '0.35']));
  await until(S(17)); await play(new M.Indicate(chipsB[2], { color: C.pink }), ...fbox(['red must help predict', ['cup  ← it is the answer!', C.pink]], C.pink), ...say('cup IS THE ANSWER FOR red', C.pink));
  // covers over the later tokens
  const cover = k => {
    const x0 = P ? -3.95 : -6.75, x1 = inX + nr + 0.12, h = P ? 1.45 : 0.78;
    const r = new M.RoundedRectangle({ width: x1 - x0, height: h, cornerRadius: 0.12, color: C.pink, strokeWidth: 2 });
    r.setFill(C.bg, 0.72); r.moveTo([(x0 + x1) / 2, gy(k), 0]); return r;
  };
  const covers = [cover(2), cover(3)];
  // covered token: its lines turn thin and faint at once (they vanish fully at sentence 35)
  const dimLines = kk => links.filter(([k]) => k === kk).map(([k, i, m]) => {
    const a = N.pos(0, i), ln = new M.Line({ start: [a[0] + nr, a[1], -0.01], end: [outX - OR, OY[m], -0.01], color: C.muted, strokeWidth: 1.2 });
    ln.setStrokeOpacity(0.25); return new M.Transform(N.edges[0][i][m], ln);
  });
  await until(S(18)); await play(new M.FadeIn(covers[0]), ...dimLines(2), ...say('STOP cup → red', C.pink));
  await until(S(19)); await play(new M.FadeIn(covers[1]), ...dimLines(3), ...say('STOP fell → red', C.pink));
  await until(S(20)); await play(...covers.map(c => new M.Indicate(c, { color: C.pink })), ...say('COVER EVERY TOKEN AFTER red', C.pink));
  await until(S(21)); await play(...[0, 1].map(k => new M.Indicate(chipsB[k], { color: TC[k] })), ...say('red SEES: the + ITSELF', C.green));
  await until(S(22)); await play(...say('CAUSAL MASKING', C.green));
  await until(S(23)); await play(...fbox(['causal:', ['later tokens cannot change', C.green], ['earlier tokens', C.green]], C.green), ...say('LATER CANNOT INFLUENCE EARLIER', C.green));

  // ---- 24-39 calculate again with the mask
  await until(S(24)); await play(...say('CALCULATE red AGAIN', TC[1]));
  await until(S(25)); await play(...fbox([['scores = (0, 0, 1, 0)', C.amber]]), ...say('ORIGINAL SCORES: 0, 0, 1, 0', C.amber));
  await until(S(26)); await play(...fbox([['scores = (0, 0, 1, 0)', C.amber], ['masked = (0, 0, ✕, ✕)', C.pink]], C.pink), ...say('BEFORE SOFTMAX: BLOCK THE LAST TWO', C.pink));
  await until(S(27)); await play(...say('2 SCORES LEFT: BOTH 0'));
  await until(S(28)); await play(...fbox([['masked = (0, 0, ✕, ✕)', C.pink], ['e^0 = 1,  e^0 = 1', C.green]], C.green), ...say('e^0 = 1', C.green));
  await until(S(29)); await play(...say('BLOCKED SCORES ADD NOTHING', C.pink));
  await until(S(30)); await play(...fbox([['masked = (0, 0, ✕, ✕)', C.pink], ['numbers = (1, 1, 0, 0)', C.green]], C.green), ...say('1, 1, 0, 0', C.green));
  await until(S(31)); await play(...fbox(['numbers = (1, 1, 0, 0)', ['total = 1 + 1 = 2', C.amber]], C.amber), ...say('TOTAL = 2', C.amber));
  await until(S(32)); await play(...fbox(['numbers = (1, 1, 0, 0)', 'total = 2', ['each ÷ 2', C.green]], C.green), ...say('DIVIDE EACH BY 2', C.green));
  const blockedLinks = links.filter(([k]) => k >= 2);
  await until(S(33)); await play(...shareAnims([50, 50, 0, 0], () => C.green, [0, 1]), ...say('the: 50%    red: 50%', C.green));
  await until(S(34)); await play(...shareAnims([50, 50, 0, 0], () => C.pink, [2, 3]), ...say('cup: 0%    fell: 0%', C.pink));
  await until(S(35)); await play(...blockedLinks.map(([k, i, m]) => new M.FadeOut(N.edges[0][i][m])), ...links.filter(([k]) => k < 2).flatMap(([k, i, m]) => N.weight(0, i, m, 1)),
    ...say('THE LINES FROM cup AND fell DISAPPEAR', C.pink));
  await until(S(36)); await play(...VI[0].map(i => new M.Indicate(N.nodes[0][i], { color: TC[0] })), ...say('the CARRIES (0, 0)', TC[0]));
  await until(S(37)); await play(...VI[1].map(i => new M.Indicate(N.nodes[0][i], { color: TC[1] })), ...say('red CARRIES (0, 2)', TC[1]));
  await until(S(38)); await play(pulse([0, 1], 1.4), ...setOut(['0', '1']), ...fbox(['half of (0, 0) + half of (0, 2)', ['= (0, 1)', C.green]], C.green), ...say('new red = (0, 1)', C.green));
  await until(S(39)); await play(...say('NO PEEKING AT THE ANSWER', C.green));

  // ---- 40-46 every position: the staircase
  await until(S(40));
  await play(new M.FadeOut(new M.VGroup(...N.nodes.flat(), ...links.filter(([k]) => k < 2).map(([k, i, m]) => N.edges[0][i][m]), ...vNums, ...chipsB, vlab, ...shT, ...outV, olab, ...covers)), ...dropBox(),
    ...say('THE SAME RULE FOR EVERY POSITION', C.violet));
  const sr = P ? 0.22 : 0.15;
  const mc = P ? [[-1.9, 0.75], [1.9, 0.75], [-1.9, -2.05], [1.9, -2.05]] : [[-5.3, -0.35], [-2.0, -0.35], [1.3, -0.35], [4.6, -0.35]];
  const minis = TOK.map((_, t) => {
    const Nm = net({ layers: [4, 1], center: [mc[t][0], mc[t][1], 0], width: P ? 2.0 : 1.9, height: P ? 1.8 : 1.6, r: sr });
    Nm.nodes[0].forEach((c, k) => { c.setColor(TC[k]); c.setFill(TC[k], 0.35); });
    Nm.nodes[1][0].setColor(TC[t]); Nm.nodes[1][0].setFill(TC[t], 0.9);
    return Nm;
  });
  const mTags = minis.map((Nm, t) => { const p = Nm.pos(1, 0), g = pill(TOK[t], TC[t], P ? 16 : 15); return g.moveTo([p[0], p[1] + sr + 0.38, 0]); });
  const kTags = minis.map(Nm => TOK.map((s, k) => { const p = Nm.pos(0, k); return T(s, P ? 15 : 13, TC[k]).moveTo([p[0] - sr - (P ? 0.38 : 0.32), p[1], 0]); }));
  for (let t = 0; t < 4; t++) {
    await until(S(41 + t));
    const Nm = minis[t];
    await play(...Nm.nodes.flat().map(c => new M.FadeIn(c)), new M.FadeIn(mTags[t]), ...kTags[t].map(o => new M.FadeIn(o)),
      ...Array.from({ length: t + 1 }, (_, k) => new M.Create(Nm.edges[0][k][0])),
      ...say(t === 3 ? '“fell” SEES ALL 4 TOKENS' : `“${TOK[t]}” SEES THE FIRST ${t + 1} TOKEN${t ? 'S' : ''}`, TC[t]));
  }
  // the mask grid: rows = receiving token, columns = token it reads
  const gc = P ? 0.42 : 0.34, GP = P ? [0.3, -4.55, 0] : [-4.0, -2.4, 0];
  const gcell = (r, c) => [GP[0] + (c - 1.5) * gc, GP[1] + (1.5 - r) * gc, 0];
  const grid = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const ok = c <= r, sq = new M.Square({ sideLength: gc * 0.9, color: ok ? C.green : C.pink, strokeWidth: 1.5 });
    sq.setFill(ok ? C.green : C.bg, ok ? 0.55 : 0.4); sq.moveTo(gcell(r, c)); grid.push(sq);
  }
  const rowTags = TOK.map((s, r) => T(s, P ? 15 : 14, TC[r]).moveTo([GP[0] - 2 * gc - (P ? 0.4 : 0.35), gcell(r, 0)[1], 0]));
  await until(S(45)); await play(...minis.map(Nm => new M.Indicate(Nm.edges[0][0][0], { color: C.green })), new M.LaggedStart(grid.map(g => new M.FadeIn(g)), { lagRatio: 0.04, runTime: 1.4 }), ...rowTags.map(t => new M.FadeIn(t)),
    ...say('1, 2, 3, 4 LINES: A STAIRCASE', C.green));
  if (!P) { BOXP = [1.6, -2.4, 0]; MAXH = 1.25; }
  await until(S(46)); await play(...rowTags.map((t, r) => new M.Indicate(t, { color: TC[r] })), ...say('ALLOWED + BLOCKED = A CAUSAL MASK', C.green));

  // ---- 47-54 negative infinity, formula, the trap
  if (P) BOXP = [0, 3.65, 0];
  await until(S(47)); await play(...fbox(['blocked score → -∞', ['(negative infinity)', C.muted]], C.pink), ...say('BLOCKED SCORE = NEGATIVE INFINITY', C.pink));
  await until(S(48)); await play(...say('BELOW EVERY POSSIBLE SCORE', C.pink));
  await until(S(49)); await play(...fbox(['blocked score → -∞', ['e^(-∞) = 0  →  0% attention', C.green]], C.green), ...say('ITS EXPONENTIAL = 0', C.green));
  await until(S(50)); await play(...fbox(['attention weight =', ['e^(masked score) ÷ total', C.amber]], C.amber), ...say('THE MASKED SOFTMAX', C.amber));
  await until(S(51)); await play(new M.LaggedStart(minis.map((Nm, t) => new M.Indicate(Nm.nodes[1][0], { color: TC[t] })), { lagRatio: 0.25, runTime: 1.6 }), ...say('MANY PREDICTIONS, NO ANSWERS SHOWN', C.green));
  await until(S(52)); await play(...fbox(['blocked score = 0 ?', ['e^0 = 1  → still a share!', C.pink]], C.pink), ...say('CAREFUL: AN ORDINARY 0 DOES NOT BLOCK', C.pink));
  await until(S(53)); await play(...fbox(['red with zeros: (0, 0, 0, 0)', ['→ 25% each: cup still seen!', C.pink]], C.pink), ...say('0 → A POSITIVE SHARE', C.pink));
  await until(S(54)); await play(...fbox([['block BEFORE softmax', C.green], ['use only available tokens', C.green]], C.green), ...say('CAUSAL MASK: ONLY EARLIER TOKENS', C.green));
}

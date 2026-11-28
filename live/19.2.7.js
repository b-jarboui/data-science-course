// 19.2.7 Position information: same tokens, different order. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TC = { the: C.muted, red: '#ff7f6e', cup: C.amber, fell: C.violet };
  const UV = { the: [1, 0, 0, 0], red: [0, 1, 0, 0], cup: [0, 0, 1, 0], fell: [0, 0, 0, 1] };
  const A = ['the', 'red', 'cup', 'fell'], B = ['the', 'cup', 'red', 'fell'];
  const POS = [[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 2, 0], [0, 0, 3, 0]];
  const addv = (a, b) => a.map((x, i) => x + b[i]);

  // ---- bookkeeping: everything on screen in this part, removed together
  let cur = [];
  const keep = (...o) => { cur.push(...o.flat()); return o.flat(); };
  const swapCur = (a, b) => { const i = cur.indexOf(a); if (i >= 0) cur[i] = b; else cur.push(b); };
  const wipe = () => { const g = cur; cur = []; return g.length ? [new M.FadeOut(new M.VGroup(...g))] : []; };
  const fin = objs => objs.map(o => new M.FadeIn(o));
  const ind = (arr, color) => arr.map(o => new M.Indicate(o, { color }));
  const lag = (objs, rt = 1.2) => new M.LaggedStart(objs.map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: rt });

  // ---- formula box
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = P ? [0, -4.2, 0] : [0, -2.35, 0]) {
    const size = P ? 19 : 19, lh = P ? 0.42 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.3;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const top = at[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => t.moveTo([at[0], top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = FW - 1.0; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOff = () => { const b = boxNow; boxNow = null; return b ? [new M.FadeOut(b)] : []; };

  // ---- a vector = a row of small numbered circles
  function vec(vals, c, color = C.ink, o = {}) {
    const r = o.r ?? (P ? 0.185 : 0.19), g = o.g ?? (P ? 0.41 : 0.46), sz = o.sz ?? (P ? 15 : 14), n = vals.length;
    const at = j => [c[0] + (j - (n - 1) / 2) * g, c[1], 0];
    const circ = vals.map((_, j) => { const k = new M.Circle({ radius: r, color, strokeWidth: 2 }); k.setFill(C.card, 0.95); k.moveTo(at(j)); return k; });
    const txt = vals.map((v, j) => T(String(v), sz, C.ink, true).moveTo(at(j)));
    return { circ, txt, parts: () => [...circ, ...txt],
      set(j, v, col = C.ink) { const t = T(String(v), sz, col, true).moveTo(at(j)); const old = txt[j]; txt[j] = t; swapCur(old, t); return [new M.FadeOut(old), new M.FadeIn(t)]; } };
  }
  const PITCH = P ? 1.8 : 2.3, tx = k => (k - 1.5) * PITCH;
  const tokPill = (w, x, y) => pill(w, TC[w], P ? 16 : 18).moveTo([x, y, 0]);

  // ---- 0-3 two sentences
  const yA = P ? 1.6 : 1.15, yB = P ? -0.5 : -0.55, dv = P ? 0.55 : 0.58;
  const pA = A.map((w, k) => tokPill(w, tx(k), yA));
  const pB = A.map((w, k) => tokPill(w, tx(k), yB));
  await until(S(0)); await play(lag(keep(pA)), ...say('READ: the red cup fell'));
  await until(S(1));
  await play(lag(keep(pB), 0.8), ...say('NEW ORDER: the cup red fell', C.amber));
  const nRed = tokPill('red', tx(2), yB), nCup = tokPill('cup', tx(1), yB);
  await play(new M.FadeOut(pB[1], { shift: [0, -0.4, 0] }), new M.FadeOut(pB[2], { shift: [0, -0.4, 0] }), new M.FadeIn(nRed, { shift: [0, 0.4, 0] }), new M.FadeIn(nCup, { shift: [0, 0.4, 0] }));
  swapCur(pB[1], nRed); swapCur(pB[2], nCup);
  const ordB = [pB[0], nCup, nRed, pB[3]];
  await until(S(2)); await play(new M.LaggedStart([...pA, ...ordB].map(p => new M.Indicate(p, { color: C.ink })), { lagRatio: 0.08, runTime: 1.6 }), ...say('SAME 4 TOKENS', C.green));
  await until(S(3)); await play(...say('HOW DOES THE MODEL SEE THE ORDER?', C.violet));

  // ---- 4-9 vectors under each token
  await until(S(4)); await play(...ind(pA, C.cyan),...say('ONE ABOVE THE OTHER'));
  const vA = A.map((w, k) => vec(UV[w], [tx(k), yA - dv, 0], TC[w]));
  const vB = B.map((w, k) => vec(UV[w], [tx(k), yB - dv, 0], TC[w]));
  await until(S(5)); await play(lag(keep([...vA, ...vB].flatMap(v => v.parts())), 1.8), ...say('EACH TOKEN: 4 NUMBERS'));
  await until(S(6)); await play(...ind([...vA[1].circ, ...vB[2].circ], TC.red),...say('red = 0, 1, 0, 0', TC.red));
  await until(S(7)); await play(...ind([...vA[2].circ, ...vB[1].circ], TC.cup),...say('cup = 0, 0, 1, 0', TC.cup));
  const link = (k1, k2, col) => new M.DashedLine({ start: [tx(k1), yA - dv - 0.3, 0], end: [tx(k2), yB + 0.3, 0], color: col, strokeWidth: 3 });
  const links = keep([link(1, 2, TC.red), link(2, 1, TC.cup)]);
  await until(S(8)); await play(...links.map(l => new M.Create(l)), ...say('RED AND CUP SWAP PLACES', C.amber));
  await until(S(9)); await play(...ind([...vB[1].txt, ...vB[2].txt], C.green),...say('NEW PLACE, SAME NUMBERS', C.green));

  // ---- 10-16 attention for fell in both orders: same output
  const NW = P ? 2.6 : 2.8, NH = P ? 2.0 : 2.4;
  const cA = P ? [0.3, 1.05, 0] : [-3.3, -0.2, 0], cB = P ? [0.3, -2.1, 0] : [3.5, -0.2, 0];
  const nets = [];
  let vals = {};
  const nv = (N, key, l, i, s, col = C.ink) => { const t = T(String(s), P ? 15 : 16, col, true).moveTo(N.pos(l, i)); const a = [new M.FadeIn(t)]; if (vals[key]) { a.push(new M.FadeOut(vals[key])); swapCur(vals[key], t); } else cur.push(t); vals[key] = t; return a; };
  function attNet(order, c, cap) {
    const N = net({ layers: [4, 1], center: c, width: NW, height: NH, r: P ? 0.24 : 0.26, names: order, outName: 'fell' });
    order.forEach((w, i) => { N.nodes[0][i].setColor(TC[w]); N.nodes[0][i].setFill(C.card, 0.95); });
    const t = T(cap, P ? 14 : 16, C.muted).moveTo([c[0], c[1] - NH / 2 - 0.45, 0]);
    keep(N.group, t); return N;
  }
  const weightsOf = sc => { const e = sc.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map(x => x / s); };
  const styleAtt = (N, w) => N.nodes[0].map((_, i) => N.weight(0, i, 0, Math.min(1, w[i] * 2))).flat();
  await until(S(10));
  await play(...wipe(), ...say('HEAD 1, NO MASK: FOLLOW fell'));
  const NA = attNet(A, cA, 'the red cup fell'), NB = attNet(B, cB, 'the cup red fell');
  nets.push(NA, NB);
  await play(new M.FadeIn(NA.group), new M.FadeIn(NB.group), ...fin(cur.slice(-4).filter(o => o !== NA.group && o !== NB.group)));
  const sA = [0, 0, 1, 0], sB = [0, 1, 0, 0];
  await until(S(11)); await play(...sA.flatMap((s, i) => nv(NA, 'a' + i, 0, i, s, s ? C.amber : C.ink)), ...styleAtt(NA, weightsOf(sA)), ...say('SCALED SCORES 0, 0, 1, 0'));
  await until(S(12)); await play(...sB.flatMap((s, i) => nv(NB, 'b' + i, 0, i, s, s ? C.amber : C.ink)), ...styleAtt(NB, weightsOf(sB)), ...say('SCALED SCORES 0, 1, 0, 0'));
  await until(S(13)); await play(new M.Indicate(NA.edges[0][2][0], { color: C.amber }), new M.Indicate(NB.edges[0][1][0], { color: C.amber }), ...say('cup GETS ABOUT 47.5%', C.amber));
  await until(S(14)); await play(new M.Flash(NA.nodes[1][0], { color: C.amber }), new M.Flash(NB.nodes[1][0], { color: C.amber }), ...say('SAME OUTPUT FOR fell', C.amber));
  await until(S(15)); await play(...fbox([['output for fell ≈ (0.951, 0.350)', C.amber], ['in both orders', C.muted]], C.amber, P ? [0, -4.6, 0] : [0, -2.95, 0]));
  await until(S(16)); await play(...say('SAME MIX, EVEN WITH A NEW ORDER', C.violet));

  // ---- 17-21 people in numbered seats
  const NAMES = ['Ana', 'Ben', 'Cleo', 'Dev'];
  const seatY = P ? -0.6 : -1.0;
  const seats = [0, 1, 2, 3].map(k => { const r = new M.RoundedRectangle({ width: P ? 1.3 : 1.6, height: 0.5, cornerRadius: 0.1, color: C.green, strokeWidth: 2 }); r.setFill(C.green, 0.12); r.moveTo([tx(k), seatY, 0]); return r; });
  const seatN = [0, 1, 2, 3].map(k => T('seat ' + (k + 1), P ? 15 : 17, C.green, true).moveTo([tx(k), seatY - 0.5, 0]));
  const person = (k, name) => {
    const x = tx(k), y = seatY + 0.55;
    const head = new M.Circle({ radius: 0.16, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, y + 0.42, 0]);
    const body = new M.Arc({ radius: 0.3, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, y + 0.05, 0]);
    const lab = T(name, P ? 15 : 17, C.cyan).moveTo([x, y + 0.85, 0]);
    return new M.VGroup(head, body, lab);
  };
  const people = NAMES.map((n, k) => person(k, n));
  await until(S(17)); await play(...wipe(), ...boxOff(), ...fin(keep(seats, seatN, people)), ...say('4 PEOPLE, 4 NUMBERED SEATS'));
  await until(S(18)); await play(new M.LaggedStart(seatN.map(s => new M.Indicate(s, { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }), ...say('A NAME AND A SEAT NUMBER', C.green));
  await until(S(19));
  const nBen = person(2, 'Ben'), nCleo = person(1, 'Cleo');
  swapCur(people[1], nBen); swapCur(people[2], nCleo);
  await play(new M.FadeOut(people[1], { shift: [0, 0.5, 0] }), new M.FadeOut(people[2], { shift: [0, 0.5, 0] }), new M.FadeIn(nBen, { shift: [0, -0.5, 0] }), new M.FadeIn(nCleo, { shift: [0, -0.5, 0] }), ...say('SAME NAME, NEW SEAT NUMBER', C.amber));
  await until(S(20)); await play(...say('TOKENS CAN HAVE SEATS TOO'));
  await until(S(21)); await play(...say('POSITION INFORMATION', C.green));

  // ---- 22-34 position vectors added to token vectors (first sentence)
  const R = P ? { lab: 2.05, pos: 1.55, tok: 0.85, vec: 0.3, sum: -0.6 } : { lab: 1.35, pos: 0.9, tok: 0.3, vec: -0.25, sum: -1.1 };
  function table(order) {
    const T0 = {};
    T0.lab = order.map((_, k) => T('position ' + (k + 1), P ? 13 : 15, C.green, true).moveTo([tx(k), R.lab, 0]));
    T0.pos = POS.map((v, k) => vec(v, [tx(k), R.pos, 0], C.green));
    T0.tok = order.map((w, k) => tokPill(w, tx(k), R.tok));
    T0.vec = order.map((w, k) => vec(UV[w], [tx(k), R.vec, 0], TC[w]));
    T0.sum = order.map((w, k) => vec(addv(UV[w], POS[k]), [tx(k), R.sum, 0], C.cyan));
    T0.eq = order.map((_, k) => T('=', P ? 16 : 20, C.cyan, true).moveTo([tx(k), (R.vec + R.sum) / 2, 0]));
    T0.plus = order.map((_, k) => T('+', P ? 16 : 20, C.green, true).moveTo([tx(k), (R.pos + R.tok) / 2 - (P ? 0.02 : 0), 0]));
    return T0;
  }
  const TA = table(A);
  const sideLabs = () => P ? [] : [['position vector', R.pos, C.green], ['token vector', R.vec, C.muted], ['new vector', R.sum, C.cyan]].map(([s, y, c]) => T(s, 14, c).moveTo([-5.75, y, 0]));
  await until(S(22)); await play(...wipe(), ...fin(keep(TA.lab, TA.tok, sideLabs())), ...say('EACH POSITION GETS 4 NUMBERS', C.green));
  for (let k = 0; k < 4; k++) {
    await until(S(23 + k));
    await play(lag(keep(TA.pos[k].parts()), 0.8), new M.Indicate(TA.lab[k], { color: C.green }), ...say(`POSITION ${k + 1}: ${POS[k].join(', ')}`, C.green));
  }
  await until(S(27)); await play(...say('POSITION VECTORS', C.green));
  await until(S(28)); await play(new M.LaggedStart(TA.pos.flatMap(v => ind(v.circ, C.green)), { lagRatio: 0.05, runTime: 1.6 }),...say('ABOVE THE TOKEN IN THAT SEAT', C.green));
  await until(S(29)); await play(lag(keep(TA.vec.flatMap(v => v.parts()), TA.plus), 1.4), ...fbox(['token vector + position vector', ['one matching number at a time', C.muted]]), ...say('ADD THEM, NUMBER BY NUMBER'));
  await until(S(30)); await play(new M.Indicate(TA.tok[1], { color: TC.red }), new M.Indicate(TA.lab[1], { color: C.green }), ...say('red SITS IN POSITION 2', TC.red));
  const showSum = k => [...fin(keep(TA.eq[k], TA.sum[k].parts()))];
  await until(S(31)); await play(...showSum(1), ...fbox(['(0, 1, 0, 0) + (0, 0, 1, 0)', ['= (0, 1, 1, 0)', C.cyan], ['place 3 now mixes cup + position', C.amber]]));
  await until(S(32)); await play(...showSum(2), ...fbox(['cup: (0, 0, 1, 0) + (0, 0, 2, 0)', ['= (0, 0, 3, 0)', C.cyan]]));
  await until(S(33)); await play(...showSum(3), ...fbox(['fell: (0, 0, 0, 1) + (0, 0, 3, 0)', ['= (0, 0, 3, 1)', C.cyan]]));
  await until(S(34)); await play(...showSum(0), ...fbox(['the: (1, 0, 0, 0) + (0, 0, 0, 0)', ['= (1, 0, 0, 0)  no change', C.cyan]]), ...say('ZEROS CHANGE NOTHING', C.muted));

  // ---- 35-40 new query for fell, new key for red, new scores
  const QW = [[0, 0, 0, 0], [2, 0, 0, 0], [0, 2, 0, 0], [2, 0, 0, 0]];   // input i -> query output j (Head 1)
  const nc = P ? [0, 0.55, 0] : [-3.0, -0.35, 0];
  const QN = net({ layers: [4, 4], center: nc, width: P ? 3.4 : 3.2, height: P ? 2.4 : 2.6, r: P ? 0.26 : 0.27 });
  QN.edges[0].forEach((row, i) => row.forEach((ln, j) => { if (QW[i][j]) { ln.setColor(C.cyan); ln.setStrokeWidth(5); ln.setStrokeOpacity(0.95); } else { ln.setColor(C.line); ln.setStrokeWidth(1); } }));
  const capY = nc[1] + (P ? 1.2 : 1.3) + 0.4;
  const capIn = T('new input for fell', P ? 14 : 15, C.violet).moveTo([QN.pos(0, 0)[0], capY, 0]);
  const capOut = T('query', P ? 14 : 15, C.cyan).moveTo([QN.pos(1, 0)[0], capY, 0]);
  vals = {};
  const qbox = P ? [0, -2.7, 0] : [3.5, -0.35, 0];
  await until(S(35)); await play(...wipe(), ...boxOff(), ...fin(keep(QN.group, capIn, capOut)), ...say('SAME QUERY AND KEY NETWORKS'));
  await play(...[0, 0, 3, 1].flatMap((v, i) => nv(QN, 'i' + i, 0, i, v, C.violet)));
  await until(S(36)); await play(...QN.flow(0, C.cyan), ...[2, 6, 0, 0].flatMap((v, j) => nv(QN, 'o' + j, 1, j, v, C.cyan)), ...say('QUERY FOR fell = 2, 6, 0, 0', C.cyan));
  await until(S(37)); await play(...fbox([['query  (2, 6, 0, 0)', C.cyan], ['key red (1, 1, 0, 0)', C.amber]], C.cyan, qbox), ...say('KEY FOR red = 1, 1, 0, 0', C.amber));
  await until(S(38)); await play(...fbox([['query  (2, 6, 0, 0)', C.cyan], ['key red (1, 1, 0, 0)', C.amber], '2×1 + 6×1 = 8'], C.cyan, qbox));
  await until(S(39)); await play(...fbox([['query  (2, 6, 0, 0)', C.cyan], ['key red (1, 1, 0, 0)', C.amber], '2×1 + 6×1 = 8', ['8 ÷ 2 = 4', C.amber]], C.cyan, qbox));
  await until(S(40)); await play(...fbox([['scaled scores for fell', C.muted], ['the  red  cup  fell', C.ink], [' 0    4    3    3', C.amber]], C.amber, qbox), ...say('SCORES 0, 4, 3, 3', C.amber));

  // ---- 41-48 swap red and cup, positions stay
  const TB = table(B);
  await until(S(41)); await play(...wipe(), ...boxOff(), ...fin(keep(TB.lab, TB.tok, sideLabs(), TB.pos.flatMap(v => v.parts()), TB.vec.flatMap(v => v.parts()), TB.plus, [0, 3].flatMap(k => [TB.eq[k], ...TB.sum[k].parts()]))), ...say('SWAP red AND cup, SEATS STAY', C.amber));
  await until(S(42)); await play(...fin(keep(TB.eq[1], TB.sum[1].parts())), new M.Indicate(TB.tok[1], { color: TC.cup }), ...fbox(['cup in position 2', ['(0, 0, 1, 0) + (0, 0, 1, 0) = (0, 0, 2, 0)', C.cyan]]));
  await until(S(43)); await play(...fin(keep(TB.eq[2], TB.sum[2].parts())), new M.Indicate(TB.tok[2], { color: TC.red }), ...fbox(['red in position 3', ['(0, 1, 0, 0) + (0, 0, 2, 0) = (0, 1, 2, 0)', C.cyan]]));
  await until(S(44)); await play(...fbox([['query for fell: same (2, 6, 0, 0)', C.cyan], ['keys for red and cup: new', C.amber]]), ...say('SAME QUERY, NEW KEYS'));
  await until(S(45)); await play(...fbox([['query   (2, 6, 0, 0)', C.cyan], ['key red (2, 1, 0, 0)', C.amber]]), ...ind(TB.sum[2].circ, TC.red));
  await until(S(46)); await play(...fbox([['query   (2, 6, 0, 0)', C.cyan], ['key red (2, 1, 0, 0)', C.amber], '2×2 + 6×1 = 4 + 6 = 10']));
  await until(S(47)); await play(...fbox([['query   (2, 6, 0, 0)', C.cyan], ['key red (2, 1, 0, 0)', C.amber], '2×2 + 6×1 = 10', ['10 ÷ 2 = 5', C.amber]]));
  await until(S(48)); await play(...fbox([['scaled scores for fell', C.muted], ['the  cup  red  fell', C.ink], [' 0    2    5    3', C.amber]], C.amber), ...say('SCORES 0, 2, 5, 3', C.amber));

  // ---- 49 different attention mixes
  vals = {};
  await until(S(49)); await play(...wipe(), ...boxOff(), ...say('NEW ORDER → NEW ATTENTION MIX', C.violet));
  const NA2 = attNet(A, cA, 'the red cup fell: 0, 4, 3, 3'), NB2 = attNet(B, cB, 'the cup red fell: 0, 2, 5, 3');
  [[NA2, [0, 4, 3, 3]], [NB2, [0, 2, 5, 3]]].forEach(([N, sc]) => { const w = weightsOf(sc); N.edges[0].forEach((row, i) => { const a = Math.min(1, w[i] * 1.6); row[0].setColor(C.cyan); row[0].setStrokeWidth(1 + 7 * a); row[0].setStrokeOpacity(0.25 + 0.7 * a); }); });
  await play(...fin(cur));

  // ---- 50-54 the formula and the idea
  const mid = P ? [0, -0.3, 0] : [0, -0.4, 0];
  await until(S(50)); await play(...wipe(), ...say('ONE SHORT FORMULA'));
  // worked example under the formula: red in position 2
  const exY = P ? [-1.7, -2.9, -4.1] : [-2.3, -2.3, -2.3], exX = P ? [0.7, 0.7, 0.7] : [-3.6, 0, 3.6];
  const exV = [[UV.red, TC.red, 'red'], [POS[1], C.green, 'position 2'], [addv(UV.red, POS[1]), C.cyan, 'new input']].map(([v, col], i) => vec(v, [exX[i], exY[i], 0], col));
  const exL = ['red', 'position 2', 'new input'].map((s, i) => T(s, P ? 15 : 16, [TC.red, C.green, C.cyan][i], true).moveTo(P ? [-2.1, exY[i], 0] : [exX[i], exY[i] + 0.55, 0]));
  const exS = ['+', '='].map((s, i) => T(s, P ? 18 : 22, C.ink, true).moveTo(P ? [0.7, (exY[i] + exY[i + 1]) / 2, 0] : [(exX[i] + exX[i + 1]) / 2, exY[0], 0]));
  await until(S(51)); await play(...fbox([['new input vector', C.cyan], ['= token vector + position vector', C.ink]], C.cyan, mid));
  await play(...fin(keep(exL, exV.flatMap(v => v.parts()), exS)));
  await until(S(52)); await play(...say('SAME TOKENS, NEW ORDER → DIFFERENT RESULT', C.green));
  await until(S(53)); await play(...say('REAL MODELS: OTHER METHODS. OURS: TEACHING NUMBERS', C.muted));
  await until(S(54)); await play(new M.Indicate(boxNow, { color: C.green }), ...say('POSITION = WHERE THE TOKEN SITS', C.green));
}

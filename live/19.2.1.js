// 19.2.1 Queries, keys, and values. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TOK = ['the', 'red', 'cup', 'fell'], TC = ['#94a3b8', '#fb7185', C.amber, C.violet];
  const QC = C.cyan, KC = C.amber, VC = C.violet;
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };

  // ---- formula box
  const BOXP = P ? [0, 3.65, 0] : [4.4, -0.6, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.42 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.35;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.3, top = BOXP[1] + ht / 2 - 0.175 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.3, maxh = P ? 1.3 : 3.6;
    const k = Math.min(1, maxw / wd, maxh / ht); if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const num = (v, p, col = C.ink, sz = P ? 17 : 15) => T(String(v), sz, col, true).moveTo(p);

  // ---- 0-5 the sentence and the next word
  const tokY = P ? 1.7 : 1.0, isp = P ? 1.5 : 2.4;
  const ix = k => (k - 2) * isp;
  const chips = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([ix(k), tokY, 0]));
  const q = pill('?', C.muted, P ? 18 : 20).moveTo([ix(4), tokY, 0]);
  await until(S(0)); await play(new M.FadeIn(chips[0]), ...say('A SMALL LANGUAGE MODEL'));
  await until(S(1)); await play(new M.LaggedStart(chips.slice(1).map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 1.4 }), ...say('4 WORDS'));
  await until(S(2)); await play(new M.FadeIn(q), new M.Indicate(q, { color: C.amber }), ...say('WHAT COMES NEXT?', C.amber));
  const arcR = isp / 2;
  const arc = new M.Arc({ radius: arcR, startAngle: Math.PI, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  arc.moveTo([(ix(2) + ix(3)) / 2, tokY - 0.35 - arcR / 2, 0]);
  await until(S(3)); await play(new M.Create(arc), ...say('CONNECT INFORMATION FROM DIFFERENT WORDS', C.amber));
  const down = pill('down?', C.green, P ? 18 : 20).moveTo([ix(4), tokY, 0]);
  await until(S(4)); await play(new M.FadeOut(q), new M.FadeIn(down), ...say('“cup” + “fell” → “down”?', C.green));
  await until(S(5)); await play(new M.LaggedStart(chips.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.25, runTime: 2 }), ...say('HOW TO FIND USEFUL INFORMATION?', C.violet));

  // ---- 6-14 each token becomes four numbers
  const sp = P ? 1.8 : 2.5, tx = k => (k - 1.5) * sp;
  await until(S(6));
  const chips2 = TOK.map((s, k) => pill(s, TC[k], P ? 18 : 20).moveTo([tx(k), tokY, 0]));
  await play(new M.FadeOut(new M.VGroup(arc, down, ...chips)), ...chips2.map(c => new M.FadeIn(c)), ...say('HOW THE MODEL SEES EACH WORD'));
  chips.splice(0, 4, ...chips2);
  await until(S(7)); await play(...say('TOKEN = A SMALL PIECE OF TEXT'));
  await until(S(8)); await play(new M.LaggedStart(chips.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...say('HERE: 1 WORD = 1 TOKEN'));
  const vr = P ? 0.24 : 0.2, vstep = P ? 0.62 : 0.5, vtop = P ? 0.95 : 0.3;
  const vp = (k, i) => [tx(k), vtop - i * vstep, 0];
  const vcirc = TOK.map((_, k) => [0, 1, 2, 3].map(i => { const c = new M.Circle({ radius: vr, color: TC[k], strokeWidth: 2.5 }); c.setFill(C.card, 0.95); c.moveTo(vp(k, i)); return c; }));
  await until(S(9)); await play(new M.LaggedStart(vcirc.flat().map(c => new M.FadeIn(c)), { lagRatio: 0.05, runTime: 1.6 }), ...say('4 CIRCLES PER TOKEN'));
  const vnum = [];
  for (let k = 0; k < 4; k++) {
    await until(S(10 + k));
    const ns = [0, 1, 2, 3].map(i => num(i === k ? 1 : 0, vp(k, i), i === k ? TC[k] : C.ink));
    vnum.push(ns);
    await play(new M.LaggedStart(ns.map(n => new M.FadeIn(n)), { lagRatio: 0.2, runTime: 1 }), new M.Indicate(chips[k], { color: TC[k] }),
      ...say(`${TOK[k]} = (${[0, 1, 2, 3].map(i => i === k ? 1 : 0).join(', ')})`, TC[k]));
  }
  const vbox = new M.RoundedRectangle({ width: 2 * vr + 0.3, height: 3 * vstep + 2 * vr + 0.3, cornerRadius: 0.15, color: C.green, strokeWidth: 2 });
  vbox.moveTo([tx(3), vtop - 1.5 * vstep, 0]);
  await until(S(14)); await play(new M.Create(vbox), ...say('VECTOR = AN ORDERED GROUP OF NUMBERS', C.green));

  // ---- 15-23 three cards for every token
  await until(S(15));
  await play(new M.FadeOut(new M.VGroup(vbox, ...chips.slice(0, 3), ...vcirc.slice(0, 3).flat(), ...vnum.slice(0, 3).flat())), ...say('EACH TOKEN GETS 3 CARDS', C.amber));
  const cw = P ? 5.2 : 2.8, ch = P ? 1.3 : 2.3;
  const cp = i => P ? [-0.55, 0.55 - i * 1.5, 0] : [-4.55 + i * 3.05, -0.35, 0];
  const DESC = ['what I am looking for', 'do I have useful info?', 'the info I can share'];
  const cards = [], ctitle = [], cdesc = [], cnums = [];
  [0, 1, 2].forEach(i => {
    const p = cp(i);
    const r = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.16, color: C.muted, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(p);
    const t = T('CARD ' + (i + 1), P ? 15 : 16, C.muted, true, true).moveTo([p[0], p[1] + (P ? 0.38 : 0.7), 0]);
    const d = fit(T(DESC[i], P ? 16 : 15, C.ink), cw - 0.4).moveTo([p[0], p[1] + (P ? 0 : 0.1), 0]);
    const n = T('[ ?  ?  ?  ? ]', P ? 16 : 16, C.muted, true).moveTo([p[0], p[1] - (P ? 0.38 : 0.6), 0]);
    cards.push(r); ctitle.push(t); cdesc.push(d); cnums.push(n);
  });
  for (let i = 0; i < 3; i++) {
    await until(S(16 + i));
    await play(new M.FadeIn(cards[i]), new M.FadeIn(ctitle[i]), new M.FadeIn(cdesc[i]), ...say(['CARD 1: WHAT AM I LOOKING FOR?', 'CARD 2: DO I HAVE USEFUL INFORMATION?', 'CARD 3: WHAT I CAN SHARE'][i], C.ink));
  }
  await until(S(19)); await play(new M.LaggedStart(cnums.map(n => new M.FadeIn(n)), { lagRatio: 0.3, runTime: 1.2 }), ...say('NUMBERS, NOT WORDS', C.muted));
  await until(S(20)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.3, runTime: 1.6 }), ...say('FIND + MIX USEFUL INFORMATION = ATTENTION', C.green));
  const NAMES = [['QUERY', QC], ['KEY', KC], ['VALUE', VC]];
  for (let i = 0; i < 3; i++) {
    await until(S(21 + i));
    const p = cp(i), np = pill(NAMES[i][0], NAMES[i][1], P ? 15 : 17).moveTo(ctitle[i].getCenter());
    cards[i].setColor(NAMES[i][1]);
    await play(new M.FadeOut(ctitle[i]), new M.FadeIn(np), new M.Indicate(cards[i], { color: NAMES[i][1] }), ...say(`CARD ${i + 1} = ${NAMES[i][0]}`, NAMES[i][1]));
    ctitle[i] = np;
  }

  // ---- 24-40 the network that makes query, key and value
  const NC = P ? [-0.7, -1.6, 0] : [-2.6, -0.75, 0];
  const N = net({ layers: [4, 12], center: NC, width: P ? 5.0 : 4.4, height: P ? 7.0 : 4.2, r: P ? 0.27 : 0.17 });
  const QI = [0, 1, 2, 3], KI = [5, 6, 7, 8], VI = [10, 11], OUT = [...QI, ...KI, ...VI];
  const ring = (c, col) => { c.setColor(col); c.setFill(C.card, 0.95); };
  QI.forEach(j => ring(N.nodes[1][j], QC)); KI.forEach(j => ring(N.nodes[1][j], KC)); VI.forEach(j => ring(N.nodes[1][j], VC));
  N.nodes[0].forEach(c => ring(c, C.ink));
  const WT = [[], [[0, 2], [6, 1], [11, 2]], [[1, 2], [5, 1], [10, 2]], [[0, 2]]];
  const nr = P ? 0.27 : 0.17, outX = N.pos(1, 0)[0], inX = N.pos(0, 0)[0];
  const gY = js => (N.pos(1, js[0])[1] + N.pos(1, js[js.length - 1])[1]) / 2;
  const glabs = NAMES.map(([s, c], g) => { const pl = pill(s, c, P ? 14 : 16); return pl.moveTo([outX + nr + 0.12 + pl.getWidth() / 2, gY([QI, KI, VI][g]), 0]); });
  let tchip = pill('fell', TC[3], P ? 18 : 20).moveTo([inX, N.pos(0, 0)[1] + nr + 0.45, 0]);
  await until(S(24));
  await play(new M.FadeOut(new M.VGroup(...cards, ...ctitle, ...cdesc, ...cnums, chips[3], ...vcirc[3], ...vnum[3])),
    new M.FadeIn(tchip), new M.LaggedStart(N.nodes[0].map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1 }), ...say('FOLLOW “fell” THROUGH A NETWORK', C.violet));
  const setIn = k => [0, 1, 2, 3].flatMap(i => N.value(0, i, i === k ? '1' : '0', i === k ? TC[k] : C.ink));
  await until(S(25)); await play(...setIn(3), ...say('fell = (0, 0, 0, 1)', C.violet));
  await until(S(26)); await play(new M.LaggedStart(OUT.map(j => new M.FadeIn(N.nodes[1][j])), { lagRatio: 0.06, runTime: 1.4 }), ...glabs.map(g => new M.FadeIn(g)), ...say('3 SEPARATE GROUPS'));
  await until(S(27)); await play(...glabs.map((g, i) => new M.Indicate(g, { color: NAMES[i][1] })), ...say('QUERY 4 · KEY 4 · VALUE 2'));
  const used = [0, 1, 2, 3].flatMap(i => OUT.map(j => N.edges[0][i][j]));
  await until(S(28)); await play(new M.LaggedStart(used.map(e => new M.Create(e)), { lagRatio: 0.02, runTime: 1.8 }), ...say('LINES CONNECT THE CIRCLES'));
  const wOf = (i, j) => { const f = WT[i].find(x => x[0] === j); return f ? f[1] : 0; };
  const restyle = [];
  [0, 1, 2, 3].forEach(i => OUT.forEach(j => {
    const w = wOf(i, j);
    if (w) restyle.push(...N.weight(0, i, j, w / 2));
    else { const ln = N.edges[0][i][j], t = ln.copy(); t.setColor(C.muted); t.setStrokeWidth(1.2); t.setStrokeOpacity(0.14); restyle.push(new M.Transform(ln, t)); }
  }));
  await until(S(29)); await play(...restyle, ...say('EACH LINE HAS A WEIGHT', C.cyan));
  await until(S(30)); await play(...fbox(['incoming × weight']), ...say('WEIGHT = WHAT TO MULTIPLY BY'));
  await until(S(31)); await play(new M.Indicate(N.nodes[0][3], { color: C.violet }), ...say('4TH CIRCLE = 1', C.violet));
  const e30 = N.edges[0][3][0], a30 = N.pos(0, 3), b30 = N.pos(1, 0);
  // weight tag on a dark pill placed on the line itself (the pill hides the line under it, so the text stays clean)
  const wlab = pill('×2', C.cyan, P ? 17 : 16).moveTo([a30[0] + 0.62 * (b30[0] - a30[0]), a30[1] + 0.62 * (b30[1] - a30[1]), 0]);
  // signal pulses: a glowing dot runs along each line from left to right and fades on arrival
  const EP = new Map(); [0, 1, 2, 3].forEach(i => OUT.forEach(j => EP.set(N.edges[0][i][j], [N.pos(0, i), N.pos(1, j)])));
  const flowE = (list, col = C.amber) => new M.LaggedStart(list.map(ln => {
    const [a, b] = EP.get(ln), d = new M.Dot({ point: [a[0] + nr, a[1], 0], radius: P ? 0.08 : 0.06, color: col }); d.setFill(col, 1);
    const t = new M.Dot({ point: [b[0] - nr, b[1], 0], radius: P ? 0.08 : 0.06, color: col }); t.setFill(col, 0);
    return new M.Transform(d, t, { runTime: 0.8 }); }), { lagRatio: 0.06, runTime: 1.4 });
  await until(S(32)); await play(new M.FadeIn(wlab), new M.Indicate(e30, { color: C.amber }), ...say('WEIGHT = 2', C.cyan));
  await until(S(33)); await play(flowE([e30]), ...N.value(1, 0, '2', QC), ...fbox(['incoming × weight', ['1 × 2 = 2', C.amber]]), ...say('1 × 2 = 2', C.amber));
  await until(S(34)); await play(flowE(OUT.filter(j => j).map(j => N.edges[0][3][j]), C.muted), ...say('ALL OTHER LINES FROM IT: WEIGHT 0', C.muted));
  await until(S(35)); await play(flowE([0, 1, 2].flatMap(i => OUT.map(j => N.edges[0][i][j])), C.muted), ...fbox(['incoming × weight', ['0 × any weight = 0', C.muted]]), ...say('ZEROS ADD NOTHING', C.muted));
  const setOut = (js, vals, col) => js.flatMap((j, i) => N.value(1, j, String(vals[i]), vals[i] ? col : C.muted));
  await until(S(36)); await play(...setOut(QI, [2, 0, 0, 0], QC), new M.Indicate(glabs[0], { color: QC }), ...say('QUERY of fell = (2, 0, 0, 0)', QC));
  await until(S(37)); await play(...setOut(KI, [0, 0, 0, 0], KC), new M.Indicate(glabs[1], { color: KC }), ...say('KEY of fell = (0, 0, 0, 0)', KC));
  await until(S(38)); await play(...setOut(VI, [0, 0], VC), new M.Indicate(glabs[2], { color: VC }), ...say('VALUE of fell = (0, 0)', VC));
  await until(S(39)); await play(flowE(used.filter((_, n) => wOf(Math.floor(n / OUT.length), OUT[n % OUT.length])), C.cyan), ...fbox(['vector → weights → new vector']), ...say('PROJECTION', C.green));
  await until(S(40)); await play(...glabs.map((g, i) => new M.Indicate(g, { color: NAMES[i][1] })), ...say('3 PROJECTIONS = 3 DIFFERENT JOBS', C.green));

  // ---- 41-47 the same network for cup
  const chipCup = pill('cup', TC[2], P ? 18 : 20).moveTo(tchip.getCenter());
  await until(S(41));
  await play(new M.FadeOut(tchip), new M.FadeIn(chipCup), new M.FadeOut(wlab), ...setIn(2), ...say('NOW THE SAME NETWORK FOR “cup”', C.amber));
  tchip = chipCup;
  await play(flowE(N.edges[0][2].filter((_, j) => OUT.includes(j)), C.amber));
  await until(S(42)); await play(...setOut(QI, [0, 2, 0, 0], QC), ...say('QUERY of cup = (0, 2, 0, 0)', QC));
  await until(S(43)); await play(...setOut(KI, [1, 0, 0, 0], KC), ...say('KEY of cup = (1, 0, 0, 0)', KC));
  await until(S(44)); await play(...setOut(VI, [2, 0], VC), ...say('VALUE of cup = (2, 0)', VC));
  await until(S(45)); await play(...fbox([['query of fell  2  0  0  0', QC], ['key of cup     1  0  0  0', KC]]), ...say('SIDE BY SIDE'));
  await until(S(46)); await play(...fbox([['query of fell  2  0  0  0', QC], ['key of cup     1  0  0  0', KC], ['               ↑ both positive', C.green]]), ...say('BOTH POSITIVE IN PLACE 1', C.green));
  await until(S(47)); await play(...say('THIS HELPS: HOW MUCH TO TAKE FROM “cup”?', C.amber));

  // ---- 48-53 formula and summary
  await until(S(48)); await play(...say('ONE SHORT FORMULA'));
  await until(S(49)); await play(...fbox(['output =', ['sum of (incoming × weight)', C.amber]]), ...say('ADD ALL: NUMBER × ITS WEIGHT', C.amber));
  await until(S(50)); await play(...used.filter((_, n) => wOf(Math.floor(n / OUT.length), OUT[n % OUT.length])).map(e => new M.Indicate(e, { color: C.cyan })), ...say('REAL MODELS LEARN WEIGHTS · HERE: FIXED', C.muted));
  await until(S(51)); await play(...say('NOT A WRITTEN QUESTION, NOT A WRITTEN ANSWER', C.pink));
  await until(S(52)); await play(...say('JUST GROUPS OF NUMBERS', C.ink));
  await until(S(53)); await play(...fbox([['query: looks for a match', QC], ['key:   helps find a match', KC], ['value: carries information', VC]]),
    new M.LaggedStart(glabs.map((g, i) => new M.Indicate(g, { color: NAMES[i][1] })), { lagRatio: 0.4, runTime: 2.4 }), ...say('QUERY · KEY · VALUE', C.green));
}

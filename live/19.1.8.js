// 19.1.8 Distributional learning: how words learn their positions.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const OR = '#fb923c';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [4.6, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const fade = o => new M.FadeIn(o), out = o => new M.FadeOut(o);
  const lab = (s, size, color, x, y, mono = true) => T(s, size, color, mono).moveTo([x, y, 0]);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 20 : 19, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = P ? 0.44 : 0.4, height = rows.length * lh + 0.26;
    const [x, y] = BOXP;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 1.0 : 4;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // 0-8 the game: real neighbour or random word?
  const CW = P ? 7.4 : 6.4, Y1 = P ? 0.6 : 1.0, Y2 = P ? -1.3 : 0.0, Y3 = P ? -3.3 : -1.1;
  // 0-1 a reminder of the last lesson's word map (small picture)
  const om = P ? [0.3, -2.6] : [CX + 0.5, -1.4], ou = P ? 0.95 : 0.55;
  const omp = (x, y) => [om[0] + x * ou, om[1] + y * ou, 0];
  const oldMap = new M.VGroup(
    new M.Line({ start: omp(-3.5, 0), end: omp(2.6, 0), color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: omp(0, -1.6), end: omp(0, 3.5), color: C.muted, strokeWidth: 2 }),
    ...[['plot', 1, 3, C.cyan], ['ending', 2, 3, C.cyan], ['great', 2, -1, C.green], ['slow', -2, -1, C.pink], ['boring', -3, -1, OR]].flatMap(([w, x, y, c]) => {
      const h = new M.Dot({ point: omp(x, y), radius: 0.2, color: c }); h.setFill(c, 0.2);
      return [h, new M.Dot({ point: omp(x, y), radius: 0.08, color: c }), lab(w, P ? 17 : 15, c, omp(x, y)[0], omp(x, y)[1] + (y > 0 ? 0.32 : -0.32), false)]; }));
  await until(S(0)); await play(fade(oldMap), ...say('LAST LESSON: EACH WORD = 2 NUMBERS ON A MAP', C.muted));
  await until(S(1)); await play(...say('HOW DOES A COMPUTER LEARN THEM?', C.amber));
  const cr = new M.RoundedRectangle({ width: CW, height: P ? 0.9 : 0.62, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  cr.setFill(C.card, 0.95); cr.moveTo([CX, Y1, 0]);
  const ct = T('R2  A slow book. The plot is slow.', P ? 19 : 18, C.ink); ct.moveTo([CX - CW / 2 + 0.3 + ct.getWidth() / 2, Y1, 0]);
  const DX = P ? 2.3 : 1.7;
  const phr = [['a', C.muted], ['slow', C.pink], ['book', C.cyan]].map(([w, c], j) => pill(w, c, P ? 24 : 18).moveTo([CX + (j - 1) * DX, Y2, 0]));
  await until(S(2)); await play(out(oldMap), fade(new M.VGroup(cr, ct)), new M.LaggedStart(phr.map(fade), { lagRatio: 0.2, runTime: 1 }), ...say('R2:  a slow book', C.pink));
  const nb = lab('real neighbour ✓', P ? 18 : 16, C.green, phr[2].getCenter()[0] - (P ? 0.6 : 0), Y2 - (P ? 0.6 : 0.45), false);
  await until(S(3)); await play(new M.Indicate(phr[2], { color: C.cyan }), fade(nb), ...say('book SITS RIGHT BESIDE slow', C.cyan));
  const lv = pill('loved', C.violet, P ? 24 : 18).moveTo([CX + DX, Y3, 0]);
  const lvT = lab('random word', P ? 18 : 16, C.muted, CX - 0.3, Y3, false);
  await until(S(4)); await play(fade(lv), fade(lvT), ...say('RANDOM WORD: loved', C.violet));
  const lvX = lab('not beside slow ✗', P ? 18 : 16, C.pink, CX + DX - (P ? 0.9 : 0), Y3 - (P ? 0.6 : 0.45), false);
  await until(S(5)); await play(fade(lvX), ...say('loved IS NOT BESIDE slow', C.pink));
  await until(S(6)); await play(...say('WHICH ONE IS THE REAL NEIGHBOUR?', C.amber));
  await until(S(7)); await play(...say('PREDICT  →  CHECK  →  FIX', C.green));
  await until(S(8)); await play(...say('DISTRIBUTIONAL LEARNING', C.violet));

  // 9-12 a fresh, smaller map just for this game
  const u = P ? 1.45 : 1.1, mo = P ? [-0.6, -2.0] : [0.1, -0.4];
  const m = (x, y) => [mo[0] + x * u, mo[1] + y * u, 0];
  const tk = P ? 16 : 14;
  const axes = new M.VGroup(
    new M.Line({ start: m(-0.5, 0), end: m(1.6, 0), color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: m(0, -1.45), end: m(0, 1.3), color: C.muted, strokeWidth: 2 }),
    lab('1', tk, C.muted, m(1, 0)[0], m(1, 0)[1] - 0.22), lab('1', tk, C.muted, m(0, 1)[0] - 0.2, m(0, 1)[1]),
    lab('−1', tk, C.muted, m(0, -1)[0] - 0.28, m(0, -1)[1]));
  function point(w, x, y, c, dx = 0, dy = 0.3) {
    const p = m(x, y);
    const halo = new M.Dot({ point: p, radius: 0.2, color: c }); halo.setFill(c, 0.2);
    return new M.VGroup(halo, new M.Dot({ point: p, radius: 0.08, color: c }), lab(w, P ? 17 : 15, c, p[0] + dx, p[1] + dy, false));
  }
  const pBook = point('book (1, 0)', 1, 0, C.cyan, 0, 0.32), pLoved = point('loved (0, 1)', 0, 1, C.violet, P ? 0.95 : 0.75, 0);
  await until(S(9)); await play(out(new M.VGroup(cr, ct, ...phr, nb, lv, lvT, lvX)), new M.Create(axes), fade(pBook), ...say('A FRESH, SMALL MAP:  book = (1, 0)', C.cyan));
  await until(S(10)); await play(fade(pLoved), ...say('loved = (0, 1)', C.violet));
  await until(S(11)); await play(new M.Indicate(pBook, { color: C.amber }), new M.Indicate(pLoved, { color: C.amber }), ...say('book AND loved STAY FIXED', C.amber));
  let slowNow = point('slow', 0, 0, C.pink, 0, -0.3);
  const slowAt = (x, y) => { const g = point('slow', x, y, C.pink, 0, -0.3); const a = [new M.Transform(slowNow, g)]; return a; };
  await until(S(12)); await play(fade(slowNow), ...say('slow STARTS AT (0, 0)', C.pink));

  // 13-19 the network: inputs = a word's coordinates, weights = slow's coordinates
  const N = net({ layers: [2, 1], center: P ? [0.2, 1.1, 0] : [-3.6, -0.5, 0], width: P ? 3.6 : 2.6, height: P ? 1.2 : 1.6, r: 0.42,
    names: ['1st', '2nd'], outName: 'output' });
  const ePos = i => { const a = N.pos(0, i), b = N.pos(1, 0); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (i ? -0.28 : 0.28), 0]; };
  let wT = [null, null];
  const setW = (w1, w2) => {
    const a = [...N.weight(0, 0, 0, w1 || 0.05), ...N.weight(0, 1, 0, w2 || 0.05)];
    [w1, w2].forEach((w, i) => { const t = lab(String(w), P ? 18 : 16, C.pink, ...ePos(i).slice(0, 2)); if (wT[i]) a.push(out(wT[i])); a.push(fade(t)); wT[i] = t; });
    return a;
  };
  await until(S(13)); await play(fade(new M.VGroup(N.nodes[0][0], N.nodes[0][1], N.labels[0], N.labels[1])), ...N.value(0, 0, '1'), ...N.value(0, 1, '0'), ...say('INPUT: book = (1, 0)', C.cyan));
  await until(S(14)); await play(new M.Create(N.edges[0][0][0]), new M.Create(N.edges[0][1][0]), fade(N.nodes[1][0]), fade(N.labels[2]), ...say('LINES → ONE CIRCLE THAT COLLECTS'));
  await until(S(15)); await play(...setW(0, 0), ...say('WEIGHTS = slow\'s NUMBERS (0, 0)', C.pink));
  await until(S(16)); await play(...N.flow(0), ...say('MULTIPLY, THEN ADD', C.amber));
  await until(S(17)); await play(...N.value(1, 0, '0', C.amber), ...say('THE TOTAL = THE OUTPUT', C.amber));
  await until(S(18)); await play(...fbox([['book:  0×1 + 0×0 = 0', C.cyan]], C.amber));
  await until(S(19)); await play(...N.value(0, 0, '0'), ...N.value(0, 1, '1'), ...fbox([['book:  0×1 + 0×0 = 0', C.cyan], ['loved: 0×0 + 0×1 = 0', C.violet]], C.amber), ...say('INPUT: loved = (0, 1)', C.violet));
  await play(...N.flow(0));

  // 20-24 sigmoid
  const sig = s => 1 / (1 + Math.exp(-s));
  const [gx, gy] = BOXP, gw = P ? 6.0 : 3.4, gh = P ? 1.8 : 1.9;
  const gp = (s, p) => [gx + s / 8 * gw, gy - gh / 2 + p * gh, 0];
  const curve = new M.VGroup(...Array.from({ length: 32 }, (_, k) => { const a = -4 + k * 0.25, b = a + 0.25; return new M.Line({ start: gp(a, sig(a)), end: gp(b, sig(b)), color: C.green, strokeWidth: 4 }); }));
  const gAx = new M.VGroup(
    new M.Line({ start: gp(-4, 0), end: gp(4, 0), color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: gp(0, 0), end: gp(0, 1.05), color: C.muted, strokeWidth: 2 }),
    new M.DashedLine({ start: gp(-4, 1), end: gp(4, 1), color: C.muted }),
    lab('1', P ? 16 : 14, C.muted, gp(-4, 1)[0] - 0.18, gp(-4, 1)[1]), lab('0', P ? 16 : 14, C.muted, gp(-4, 0)[0] - 0.18, gp(-4, 0)[1]),
    lab('output', P ? 16 : 14, C.muted, gp(4, 0)[0] - 0.45, gp(4, 0)[1] - 0.24));
  const half = new M.VGroup(new M.Dot({ point: gp(0, 0.5), radius: 0.08, color: C.amber }), lab('0.5', P ? 17 : 15, C.amber, gp(0, 0.5)[0] + 0.36, gp(0, 0.5)[1] - 0.05));
  await until(S(20)); await play(...fbox([]), new M.Create(gAx), ...say('OUTPUT → PROBABILITY (0 TO 1)', C.green));
  await until(S(21)); await play(new M.Create(curve), fade(half), ...say('OUTPUT 0 → PROBABILITY 0.5', C.amber));
  await until(S(22)); await play(new M.Indicate(curve, { color: C.green }), ...say('HIGHER OUTPUT → HIGHER PROBABILITY', C.green));
  await until(S(23)); await play(...say('THIS CURVE = THE SIGMOID', C.green));
  await until(S(24)); await play(out(new M.VGroup(gAx, curve, half)), ...fbox(['real neighbour?', ['book:  0.5', C.cyan], ['loved: 0.5', C.violet]], C.green), ...say('BOTH GET 0.5', C.amber));

  // 25-35 training step 1: targets, loss, update
  await until(S(25)); await play(...fbox(['        prob.  target', ['book    0.5    1', C.cyan], ['loved   0.5', C.violet]], C.green), ...say('book IS REAL: TARGET 1', C.cyan));
  await until(S(26)); await play(...fbox(['        prob.  target', ['book    0.5    1', C.cyan], ['loved   0.5    0', C.violet]], C.green), ...say('loved: TARGET 0', C.violet));
  await until(S(27)); await play(...say('LOSS GROWS WHEN RIGHT ANSWERS GET LOW PROBABILITIES', C.pink));
  await until(S(28)); await play(...fbox(['        prob.  target', ['book    0.5    1', C.cyan], ['loved   0.5    0', C.violet], ['loss ≈ 1.39', C.pink]], C.pink), ...say('START LOSS ≈ 1.39', C.pink));
  await until(S(29)); await play(...say('DIFFERENCE = TARGET − PROBABILITY', C.amber));
  await until(S(30)); await play(...fbox([['book:  1 − 0.5 = +0.5', C.cyan]], C.amber));
  await until(S(31)); await play(...fbox([['book:  1 − 0.5 = +0.5', C.cyan], ['loved: 0 − 0.5 = −0.5', C.violet]], C.amber));
  await until(S(32)); await play(...say('DIFFERENCE × THE WORD\'S COORDINATES', C.amber));
  await until(S(33)); await play(...fbox([['+0.5 × book (1, 0)', C.cyan], ['= (+0.5, 0)', C.cyan]], C.amber), ...say('book: +0.5 TO 1ST NUMBER', C.cyan));
  await until(S(34)); await play(...fbox([['+0.5 × book (1, 0)', C.cyan], ['−0.5 × loved (0, 1)', C.violet], ['= (0.5, −0.5)', C.amber]], C.amber), ...say('loved: −0.5 FROM 2ND NUMBER', C.violet));
  await until(S(35)); await play(...slowAt(0.5, -0.5), ...setW(0.5, -0.5), ...say('slow MOVES TO (0.5, −0.5)', C.pink));

  // 36-41 training step 2
  await until(S(36)); await play(...N.value(0, 0, '1'), ...N.value(0, 1, '0'), ...N.value(1, 0, '0.5', C.amber),
    ...fbox(['step 2: outputs', ['book   0.5', C.cyan], ['loved −0.5', C.violet]], C.violet), ...say('TRAINING STEP 2', C.violet));
  await until(S(37)); await play(...fbox(['step 2: probabilities', ['book  ≈ 0.62', C.cyan]], C.violet), ...say('book ≈ 0.62', C.cyan));
  await until(S(38)); await play(...fbox(['step 2: probabilities', ['book  ≈ 0.62', C.cyan], ['loved ≈ 0.38', C.violet]], C.violet), ...say('loved ≈ 0.38', C.violet));
  await until(S(39)); await play(...fbox(['step 2: probabilities', ['book  ≈ 0.62', C.cyan], ['loved ≈ 0.38', C.violet], ['loss ≈ 0.95', C.green]], C.violet), ...say('LOSS FALLS: 1.39 → 0.95', C.green));
  await until(S(40)); await play(...fbox(['weight updates', ['book:  1 − 0.62 = +0.38', C.cyan], ['loved: 0 − 0.38 = −0.38', C.violet]], C.amber), ...say('UPDATES ≈ 0.38', C.amber));
  await until(S(41)); await play(...slowAt(0.88, -0.88), ...setW(0.88, -0.88), ...say('slow → (0.88, −0.88)', C.pink));

  // 42-46 training step 3
  await until(S(42)); await play(...N.value(1, 0, '0.88', C.amber), ...fbox(['step 3: outputs', ['book   0.88', C.cyan], ['loved −0.88', C.violet]], C.violet), ...say('TRAINING STEP 3', C.violet));
  await until(S(43)); await play(...fbox(['step 3: probabilities', ['book  ≈ 0.71', C.cyan], ['loved ≈ 0.29', C.violet]], C.violet), ...say('book 0.71,  loved 0.29', C.cyan));
  await until(S(44)); await play(...fbox(['step 3: probabilities', ['book  ≈ 0.71', C.cyan], ['loved ≈ 0.29', C.violet], ['loss ≈ 0.70', C.green]], C.violet), ...say('LOSS FALLS: 0.95 → 0.70', C.green));
  await until(S(45)); await play(...fbox(['weight updates', ['book:  +0.29', C.cyan], ['loved: −0.29', C.violet]], C.amber), ...say('SMALLER UPDATES ≈ 0.29', C.amber));
  await until(S(46)); await play(...slowAt(1.17, -1.17), ...setW(1.17, -1.17), ...say('slow → (1.17, −1.17)', C.pink));

  // 47-48 faster: loss bars
  const losses = [1.39, 0.95, 0.70, 0.54, 0.44];
  const bw = P ? 0.8 : 0.5, bgap = P ? 1.15 : 0.66, base = gy - gh / 2;
  const bars = losses.map((v, k) => {
    const h = v / 1.39 * gh, x = gx + (k - 2) * bgap;
    const r = new M.Rectangle({ width: bw, height: h, color: C.pink, strokeWidth: 1 }); r.setFill(C.pink, 0.75); r.moveTo([x, base + h / 2, 0]);
    return new M.VGroup(r, lab(v.toFixed(2), P ? 16 : 14, C.ink, x, base + h + 0.2), lab(String(k + 1), P ? 16 : 14, C.muted, x, base - 0.22));
  });
  const stepLab = lab('training step', P ? 16 : 14, C.muted, gx, base - 0.55, false);
  await until(S(47)); await play(...fbox([]), new M.LaggedStart(bars.slice(0, 3).map(fade), { lagRatio: 0.3, runTime: 1.2 }), fade(stepLab), ...say('LOSS AT EACH TRAINING STEP', C.pink));
  await play(fade(bars[3]), ...N.value(1, 0, '1.17', C.amber), ...say('0.54 ...', C.pink));
  await play(fade(bars[4]), ...say('... THEN 0.44', C.pink));
  await until(S(48)); await play(new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.2, runTime: 1.5 }), ...say('MORE SURE → SMALLER UPDATES', C.green));

  // 49-51 the rule
  await until(S(49)); await play(out(new M.VGroup(...bars, stepLab)), ...say('THE UPDATE RULE', C.amber));
  await until(S(50)); await play(...fbox([['weight change =', C.amber], '(target − probability)', '× input number', '× learning rate'], C.amber));
  await until(S(51)); await play(...fbox([['weight change =', C.amber], '(target − probability)', '× input number', ['× learning rate (1)', C.green]], C.amber), ...say('LEARNING RATE = SIZE OF EACH STEP = 1', C.green));

  // 52-54
  await until(S(52)); await play(...fbox([['word2vec:', C.cyan], 'this game, with', 'many word pairs'], C.cyan), ...say('MANY WORD PAIRS → word2vec → EMBEDDINGS', C.cyan), new M.Indicate(slowNow, { color: C.pink }));
  await until(S(53)); await play(...say('ONE NEIGHBOUR + ONE RANDOM WORD: NOT ALL OF slow', C.muted));
  await until(S(54)); await play(...say('PREDICT NEIGHBOURS, FIX, REPEAT', C.violet), ...N.flow(0));
}

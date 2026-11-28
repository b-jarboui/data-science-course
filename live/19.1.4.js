// 19.1.4 N-gram language models: guess the next word from pairs. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const charW = sz => (T('00000000000000000000', sz, C.ink, true).getWidth() - T('0000000000', sz, C.ink, true).getWidth()) / 10;
  const COL = { great: C.green, slow: C.pink, boring: C.amber, plot: C.cyan, ending: C.cyan, book: C.violet, idea: C.cyan };
  const col = w => COL[w] || C.ink;

  // ---- formula box
  const BOXP = P ? [0, -4.9, 0] : [4.0, -0.4, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP) {
    const size = P ? 20 : 20, lh = P ? 0.46 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.35, top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 5.6; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- typing box
  const TB = P ? [0, -1.4, 0] : [0, 0.7, 0], TBW = P ? 7.0 : 6.4;
  let tbox, tlab;
  const mkTB = () => {   // fresh objects each time the typing box comes back
    tbox = new M.RoundedRectangle({ width: TBW, height: P ? 1.1 : 0.85, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    tbox.setFill(C.card, 0.95); tbox.moveTo(TB);
    tlab = T('your review', P ? 17 : 15, C.muted).moveTo([TB[0] - TBW / 2 + 0.85, TB[1] + (P ? 0.8 : 0.62), 0]);
    if (P) {   // phone: the review page of the library website fills the screen
      const pg = new M.RoundedRectangle({ width: 7.5, height: 8.6, cornerRadius: 0.2, color: C.line, strokeWidth: 2 });
      pg.setFill(C.card, 0.5); pg.moveTo([0, -2.35, -0.02]);
      const bar = new M.Line({ start: [-3.75, 1.25, 0], end: [3.75, 1.25, 0], color: C.line, strokeWidth: 2 });
      const site = T('library website', 17, C.muted, false, true).moveTo([-2.0, 1.6, 0]);
      const head = T('Write a book review', 24, C.ink, false, true).moveTo([0, 0.35, 0]);
      tlab = new M.VGroup(pg, bar, site, head, tlab);
    }
  };
  mkTB();
  let typed = null;
  const typedT = s => { const t = T(s + ' |', P ? 30 : 26, C.ink, true); t.moveTo([TB[0] - TBW / 2 + 0.3 + t.getWidth() / 2, TB[1], 0]); return t; };
  const sugAt = P ? [0, -3.2, 0] : [-2.0, -0.45, 0];
  let sug = null;
  const sugP = (s, c = C.green) => pill('suggest: ' + s, c, P ? 24 : 21).moveTo(sugAt);
  const setTyped = s => { const t = typedT(s); const a = [new M.FadeIn(t)]; if (typed) a.push(new M.FadeOut(typed)); typed = t; return a; };

  await until(S(0)); typed = typedT('');
  await play(new M.FadeIn(tbox), new M.FadeIn(tlab), new M.FadeIn(typed), ...say('WRITING A BOOK REVIEW'));
  await until(S(1)); sug = sugP('great');
  await play(...setTyped('a'), new M.FadeIn(sug, { shift: [0, 0.2, 0] }), ...say('YOU TYPE "a" → IT OFFERS "great"', C.green));
  await until(S(2)); await play(new M.Indicate(sug, { color: C.green }), ...say('HOW DOES IT KNOW THE NEXT WORD?', C.violet));

  // ---- review rows: tokens in their order
  const REV = ['A great book, a great plot.', 'A slow book. The plot is slow.', 'I loved the ending. A great book.',
    'A boring book. Slow, slow, slow.', 'A great plot but a slow ending.', 'I loved this book. A great plot, a great idea.'];
  const TOK = REV.map(s => s.toLowerCase().replace(/[.,!]/g, '').split(' '));
  const maxC = Math.max(...TOK.map(t => t.join(' ').length));
  const AW = P ? 6.7 : 11.6, X0 = P ? -3.25 : -5.6;
  const rsz = Math.min(P ? 18 : 22, 24 * AW / (maxC * charW(24))), rcw = charW(rsz);
  const rowY = k => P ? 1.6 - k * 1.15 : 1.2 - k * 0.55;
  const mkRows = () => TOK.map((t, k) => { let c = 0; return t.map(w => { const x = X0 + 0.45 + (c + w.length / 2) * rcw; c += w.length + 1; return { w, x, y: rowY(k), len: w.length, t: T(w, rsz, C.ink, true).moveTo([x, rowY(k), 0]) }; }); });
  const mkTags = () => TOK.map((_, k) => T('R' + (k + 1), 15, C.muted, true, true).moveTo([X0 - 0.15, rowY(k), 0]));
  let rows = mkRows(), rtags = mkTags();
  let allT = rows.flat();
  const under = (o, c) => new M.Line({ start: [o.x - o.len * rcw / 2, o.y - rcw * 1.25, 0], end: [o.x + o.len * rcw / 2, o.y - rcw * 1.25, 0], color: c, strokeWidth: 3 });
  const pairs = w => rows.flatMap(r => r.slice(0, -1).map((o, i) => [o, r[i + 1]]).filter(([o]) => o.w === w));

  await until(S(3)); await play(new M.FadeOut(new M.VGroup(tbox, tlab, typed, sug)), ...rtags.map(t => new M.FadeIn(t)), ...say('OUR 6 REVIEWS'));
  typed = null; sug = null;
  await until(S(4)); await play(new M.LaggedStart(allT.map(o => new M.FadeIn(o.t)), { lagRatio: 0.03, runTime: 2 }), ...say('TOKENS, IN THEIR ORIGINAL ORDER'));
  const pa = pairs('a');
  const ua = pa.map(([o]) => under(o, C.ink));
  await until(S(5)); await play(new M.LaggedStart(ua.map(u => new M.Create(u)), { lagRatio: 0.15, runTime: 1.8 }), ...say('EVERY "a"'));
  await until(S(6)); await play(new M.LaggedStart(pa.map(([o]) => new M.Indicate(o.t, { color: C.amber })), { lagRatio: 0.1, runTime: 1.2 }), ...say('9 PLACES', C.amber));
  await until(S(7)); await play(...say('THE WORD RIGHT AFTER EACH "a"'));
  const un = {};
  for (const [i, w, n] of [[8, 'great', 6], [9, 'slow', 2], [10, 'boring', 1]]) {
    await until(S(i));
    un[w] = pa.filter(([, b]) => b.w === w).map(([, b]) => under(b, col(w)));
    await play(new M.LaggedStart(un[w].map(u => new M.Create(u)), { lagRatio: 0.15, runTime: 1.2 }), ...say(`${n} × "a ${w}"`, col(w)));
  }

  // ---- 11-23 nine cards
  const gc = P ? [0, -1.4] : [-3.3, -0.4], gsx = P ? 2.45 : 2.2, gsy = P ? 1.1 : 0.8;
  const cardAt = i => [gc[0] + ((i % 3) - 1) * gsx, gc[1] + (1 - Math.floor(i / 3)) * gsy, 0];
  const mkCard = (a, b, p, c) => { const r = new M.RoundedRectangle({ width: P ? 2.2 : 2.0, height: P ? 0.8 : 0.62, cornerRadius: 0.12, color: c, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(p);
    const t = fit(T(a + ' ' + b, P ? 22 : 19, c, true, true), P ? 1.95 : 1.75).moveTo(p); return new M.VGroup(r, t); };
  const AN = ['great', 'great', 'great', 'great', 'great', 'great', 'slow', 'slow', 'boring'];
  const cards9 = AN.map((w, i) => mkCard('a', w, cardAt(i), col(w)));
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...allT.map(o => o.t), ...rtags, ...ua, ...un.great, ...un.slow, ...un.boring)), ...say('9 CARDS: ONE PER PAIR'));
  await until(S(12)); await play(new M.LaggedStart(cards9.slice(0, 6).map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.0 }), ...say('6 × a great', C.green));
  await until(S(13)); await play(new M.LaggedStart(cards9.slice(6, 8).map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 0.9 }), ...say('2 × a slow', C.pink));
  await until(S(14)); await play(new M.FadeIn(cards9[8]), ...say('1 × a boring', C.amber));
  const rnd = [4, 7, 1, 8, 2, 6, 0, 5, 3];
  await until(S(15)); await play(new M.LaggedStart(rnd.map(i => new M.Indicate(cards9[i], { color: C.ink })), { lagRatio: 0.3, runTime: 3 }), ...say('PICK ONE CARD AT RANDOM', C.violet));
  await until(S(16)); await play(...say('EVERY CARD: SAME CHANCE', C.violet));
  await until(S(17)); await play(new M.LaggedStart(cards9.slice(0, 6).map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.1, runTime: 1.4 }), ...fbox([['a → great   6/9', C.green]], C.green), ...say('6 CHANCES OUT OF 9', C.green));
  await until(S(18)); await play(...fbox([['a → great   6/9 = 2/3', C.green]], C.green), ...say('6/9 = 2/3', C.green));
  await until(S(19)); await play(...cards9.slice(6, 8).map(c => new M.Indicate(c, { color: C.pink })), ...fbox([['a → great   6/9 = 2/3', C.green], ['a → slow    2/9', C.pink]], C.green), ...say('2 OUT OF 9', C.pink));
  await until(S(20)); await play(new M.Indicate(cards9[8], { color: C.amber }), ...fbox([['a → great   6/9 = 2/3', C.green], ['a → slow    2/9', C.pink], ['a → boring  1/9', C.amber]], C.green), ...say('1 OUT OF 9', C.amber));
  await until(S(21)); await play(...say('HOW LIKELY = PROBABILITY', C.amber));
  await until(S(22)); await play(new M.Indicate(boxNow, { color: C.green }), ...say('MOST LIKELY NEXT WORD: great', C.green));
  await until(S(23)); await play(...say('PATTERNS IN TEXT → PREDICT WORDS = LANGUAGE MODEL', C.green));
  await until(S(24)); await play(...fbox([['n-gram =', C.ink], ['n neighbouring tokens', C.cyan]]), ...say('N-GRAM'));
  await until(S(25)); await play(...fbox([['n-gram =', C.ink], ['n neighbouring tokens', C.cyan], ['n = how many tokens', C.muted]]), ...say('n = HOW MANY TOKENS'));
  await until(S(26)); await play(...fbox([['n = 2: bigram', C.cyan], ['"a great"  "a slow"', C.ink]]), ...say('2 TOKENS = BIGRAM'));
  await until(S(27)); await play(new M.LaggedStart(cards9.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.6 }), ...say('BIGRAM LANGUAGE MODEL', C.green));
  await until(S(28)); await play(...fbox([['R1: … great plot.', C.ink], ['R2: a slow …', C.ink], ['"plot a" is NOT a pair', C.pink]], C.pink), ...say('PAIRS ONLY INSIDE ONE REVIEW', C.pink));

  // ---- 29-31 accept the suggestion
  await until(S(29)); typed = typedT('a'); mkTB();
  await play(new M.FadeOut(new M.VGroup(...cards9)), ...clearBox(), new M.FadeIn(tbox), new M.FadeIn(tlab), new M.FadeIn(typed), ...say('YOU ACCEPT "great"', C.green));
  await until(S(30)); await play(...setTyped('a great'), ...say('TEXT: "a great"'));
  await until(S(31)); await play(...say('WHAT NEXT?', C.violet));

  // ---- 32-40 what follows great
  rows = mkRows(); rtags = mkTags(); allT = rows.flat();   // fresh objects: the first set was removed at beat 11
  const pg = pairs('great');
  const ug = pg.map(([o]) => under(o, C.green));
  await until(S(32)); await play(new M.FadeOut(new M.VGroup(tbox, tlab, typed)), ...rtags.map(t => new M.FadeIn(t)), ...allT.map(o => new M.FadeIn(o.t)), ...say('EVERY "great"', C.green));
  typed = null;
  await play(new M.LaggedStart(ug.map(u => new M.Create(u)), { lagRatio: 0.15, runTime: 1.2 }));
  await until(S(33)); await play(new M.LaggedStart(pg.map(([o]) => new M.Indicate(o.t, { color: C.green })), { lagRatio: 0.1, runTime: 1.2 }), ...say('great: 6 TIMES', C.green));
  const ug2 = {};
  for (const [i, w, n] of [[34, 'plot', 3], [35, 'book', 2], [36, 'idea', 1]]) {
    await until(S(i));
    ug2[w] = pg.filter(([, b]) => b.w === w).map(([, b]) => under(b, col(w)));
    await play(new M.LaggedStart(ug2[w].map(u => new M.Create(u)), { lagRatio: 0.2, runTime: 1.0 }), ...say(`${n} × "great ${w}"`, col(w)));
  }
  // six great-cards
  const GN = ['plot', 'plot', 'plot', 'book', 'book', 'idea'];
  const gAt = i => P ? [((i % 3) - 1) * 2.45, -0.8 - Math.floor(i / 3) * 1.1, 0] : [-3.3 + ((i % 3) - 1) * 2.2, 0.2 - Math.floor(i / 3) * 0.8, 0];
  const cards6 = GN.map((w, i) => mkCard('great', w, gAt(i), col(w)));
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(...allT.map(o => o.t), ...rtags, ...ug, ...ug2.plot, ...ug2.book, ...ug2.idea)), new M.LaggedStart(cards6.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1 }), ...fbox([['great → plot  3/6', C.cyan]], C.green), ...say('plot AFTER great: 3 OUT OF 6', C.cyan));
  await until(S(38)); await play(...fbox([['great → plot  3/6 = 1/2', C.cyan]], C.green), ...say('= ONE HALF', C.cyan));
  await until(S(39)); await play(...cards6.slice(3, 5).map(c => new M.Indicate(c, { color: C.violet })), ...fbox([['great → plot  3/6 = 1/2', C.cyan], ['great → book  2/6 = 1/3', C.violet]], C.green), ...say('book: 2/6 = 1/3', C.violet));
  await until(S(40)); await play(new M.Indicate(cards6[5], { color: C.cyan }), ...fbox([['great → plot  3/6 = 1/2', C.cyan], ['great → book  2/6 = 1/3', C.violet], ['great → idea  1/6', C.cyan]], C.green), ...say('idea: 1/6'));

  // ---- 41-47 nine paths
  await until(S(41)); await play(new M.FadeOut(new M.VGroup(...cards6)), ...clearBox(), ...say('PROBABILITY OF "great plot" AFTER "a"?', C.violet));
  const A = P ? [0, 1.5, 0] : [-5.6, -0.4, 0];
  const end = i => P ? [(i - 4) * 0.82, -1.0, 0] : [-2.6, 1.2 - i * 0.4, 0];
  const end2 = i => P ? [(i - 1) * 0.82 - 2.46, -3.5, 0] : [0.3, 0.8 - (i - 1) * 0.4, 0];
  const aNode = pill('a', C.ink, P ? 26 : 22).moveTo(A);
  const from = e => { const dx = e[0] - A[0], dy = e[1] - A[1], d = Math.hypot(dx, dy), k = 0.42 / d; return [A[0] + dx * k, A[1] + dy * k, 0]; };
  const paths = AN.map((w, i) => new M.Line({ start: from(end(i)), end: end(i), color: col(w), strokeWidth: 3 }));
  const tips = AN.map((w, i) => new M.Dot({ point: end(i), radius: 0.08, color: col(w) }));
  await until(S(42)); await play(new M.FadeIn(aNode), new M.LaggedStart(paths.map(p => new M.Create(p)), { lagRatio: 0.1, runTime: 1.8 }), ...tips.map(t => new M.FadeIn(t)), ...say('9 PATHS FROM "a"'));
  const gLab = T('great', P ? 20 : 18, C.green, true, true).moveTo(P ? [0.1, -1.45, 0] : [-1.95, -0.4, 0]);
  await until(S(43)); await play(...[0, 1, 2, 3, 4, 5].map(i => new M.Indicate(paths[i], { color: C.green })), new M.FadeIn(gLab), ...say('6 PATHS → great', C.green));
  const ext = [0, 1, 2].map(i => new M.Line({ start: end(i), end: end2(i), color: C.cyan, strokeWidth: 3 }));
  const pLab = T('plot', P ? 20 : 18, C.cyan, true, true).moveTo(P ? [end2(1)[0], -3.95, 0] : [0.9, 0.4, 0]);
  await until(S(44)); await play(new M.LaggedStart(ext.map(e => new M.Create(e)), { lagRatio: 0.2, runTime: 1.2 }), new M.FadeIn(pLab), ...say('HALF OF THEM → plot', C.cyan));
  const FP = P ? [0, -5.5, 0] : [3.9, -0.4, 0];
  await until(S(45)); await play(...fbox([['3 of 9 paths', C.cyan], ['reach "great plot"', C.ink]], C.cyan, FP), ...say('3 OUT OF 9 PATHS', C.cyan));
  await until(S(46)); await play(...fbox([['3 of 9 paths', C.cyan], ['2/3 × 1/2', C.amber]], C.cyan, FP), ...say('MULTIPLY: 2/3 × 1/2', C.amber));
  await until(S(47)); await play(...fbox([['3 of 9 paths', C.cyan], ['2/3 × 1/2 = 1/3', C.amber]], C.amber, FP), ...ext.map(e => new M.Indicate(e, { color: C.amber })), ...say('= ONE THIRD', C.amber));

  // ---- 48-54 the rule and its limit
  await until(S(48)); await play(...say('THE RULE AS A FORMULA'));
  await until(S(49)); await play(...fbox([['P(next | word) =', C.ink], ['count(word, next)', C.amber], ['÷ count(pairs from word)', C.amber]], C.cyan, FP));
  await until(S(50)); await play(...say('SUGGEST WORDS · WRITE NEW TEXT', C.green));
  await until(S(51)); typed = typedT('a great'); mkTB();
  await play(new M.FadeOut(new M.VGroup(aNode, ...paths, ...tips, ...ext, gLab, pLab)), ...clearBox(), new M.FadeIn(tbox), new M.FadeIn(tlab), new M.FadeIn(typed), ...say('WANTED: "ending" AFTER "great"', C.cyan));
  sug = sugP('ending ?', C.pink);
  await until(S(52)); await play(new M.FadeIn(sug), ...fbox([['great ending: 0 of 6', C.pink]], C.pink, FP), ...say('"great ending" NEVER APPEARS', C.pink));
  await until(S(53)); await play(new M.Indicate(sug, { color: C.pink }), ...fbox([['great ending: 0/6 = 0', C.pink]], C.pink, FP), ...say('PROBABILITY 0, BUT IT MAKES SENSE', C.pink));
  await until(S(54)); await play(...fbox([['earlier text → counts', C.ink], ['→ likely next word', C.green]], C.green, FP), ...say('N-GRAM MODEL: PAST PATTERNS → NEXT WORD', C.green));
}

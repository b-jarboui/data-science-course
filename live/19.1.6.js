// 19.1.6 Topic models: finding what a review is about.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const OR = '#fb923c';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.9, 0] : [4.3, -0.3, 0];
  const BAR_Y = P ? 1.5 : 1.05, TOK_Y = P ? 0.35 : 0.15;
  const BY = P ? -2.6 : -1.45, BH = P ? 2.6 : 1.5, BWD = P ? 3.6 : 3.0;
  const XS = CX - (P ? 1.9 : 1.9), XP = CX + (P ? 1.9 : 1.9);
  const NAME_Y = BY + BH / 2 + 0.25, WORD_Y = BY - BH / 2 - (P ? 0.3 : 0.25), NUM_Y = WORD_Y - (P ? 0.4 : 0.35);
  const R1 = BY + (P ? 0.6 : 0.35), R2 = BY - (P ? 0.4 : 0.35);
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const fade = o => new M.FadeIn(o), out = o => new M.FadeOut(o);
  const lab = (s, size, color, x, y, mono = true) => T(s, size, color, mono).moveTo([x, y, 0]);
  const tk = (w, c) => pill(w, c, P ? 20 : 18);
  const moveTok = (t, w, c, p) => new M.Transform(t, tk(w, c).moveTo(p));

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

  // review cards
  const CW = P ? 7.4 : 6.4;
  function card(text, y, color = C.muted) {
    const r = new M.RoundedRectangle({ width: CW, height: P ? 0.9 : 0.62, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([CX, y, 0]);
    const t = T(text, P ? 19 : 18, C.ink);
    if (t.getWidth() > CW - 1.8) t.scale((CW - 1.8) / t.getWidth());
    t.moveTo([CX - CW / 2 + 0.3 + t.getWidth() / 2, y, 0]);
    return new M.VGroup(r, t);
  }
  const tagAt = (s, c, y) => pill(s, c, P ? 15 : 14).moveTo([CX + CW / 2 - 0.75, y, 0]);
  const Y1 = P ? 0.6 : 1.0, Y2 = P ? -1.7 : 0.1, Y3 = P ? -4.0 : -0.8;

  // mixture bar
  const BARW = P ? 6.6 : 6.0;
  let barNow = null;
  function setBar(s, a, b) {
    const x0 = CX - BARW / 2, w1 = BARW * s, w2 = BARW - w1;
    const r1 = new M.Rectangle({ width: w1, height: P ? 0.56 : 0.44, color: C.cyan, strokeWidth: 2 }); r1.setFill(C.cyan, 0.3); r1.moveTo([x0 + w1 / 2, BAR_Y, 0]);
    const r2 = new M.Rectangle({ width: w2, height: P ? 0.56 : 0.44, color: OR, strokeWidth: 2 }); r2.setFill(OR, 0.3); r2.moveTo([x0 + w1 + w2 / 2, BAR_Y, 0]);
    const t1 = lab(a, P ? 17 : 16, C.ink, x0 + w1 / 2, BAR_Y), t2 = lab(b, P ? 17 : 16, C.ink, x0 + w1 + w2 / 2, BAR_Y);
    const g = new M.VGroup(r1, r2, t1, t2);
    const arr = [fade(g)]; if (barNow) arr.push(out(barNow)); barNow = g; return arr;
  }

  // baskets
  function basket(x, color) {
    const l = x - BWD / 2, r = x + BWD / 2, t = BY + BH / 2, b = BY - BH / 2;
    return new M.VGroup(
      new M.Line({ start: [l, t, 0], end: [l, b, 0], color, strokeWidth: 3 }),
      new M.Line({ start: [l, b, 0], end: [r, b, 0], color, strokeWidth: 3 }),
      new M.Line({ start: [r, b, 0], end: [r, t, 0], color, strokeWidth: 3 }));
  }
  let cS = null, cP = null;
  const fitW = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const setS = s => { const a = cS ? [out(cS)] : []; cS = s ? fitW(lab(s, P ? 16 : 15, C.cyan, XS, WORD_Y), BWD + 0.2) : null; if (cS) a.push(fade(cS)); return a; };
  const setP = s => { const a = cP ? [out(cP)] : []; cP = s ? fitW(lab(s, P ? 16 : 15, OR, XP, WORD_Y), BWD + 0.2) : null; if (cP) a.push(fade(cP)); return a; };

  // 0-2 reviews about the story, the pace, or both
  const c1 = card('R1  A great book, a great plot.', Y1), c4 = card('R4  A boring book. Slow, slow, slow.', Y2);
  await until(S(0)); await play(new M.LaggedStart([fade(c1), fade(c4)], { lagRatio: 0.3, runTime: 1.2 }), ...say('GROUP REVIEWS BY SUBJECT'));
  const t1 = tagAt('STORY', C.cyan, Y1), t4 = tagAt('PACE', OR, Y2);
  await until(S(1)); await play(fade(t1), fade(t4), ...say('STORY  OR  PACE?', C.amber));
  let c5 = card('R5  A great plot but a slow ending.', Y3, C.violet);
  const t5 = tagAt('BOTH?', C.violet, Y3);
  await until(S(2)); await play(fade(c5), fade(t5), ...say('WHAT IF IT TALKS ABOUT BOTH?', C.violet));

  // 3-6 review five and its four tokens
  // phone: review 5 and its tokens first sit lower (the screen is empty there); they move up when the baskets come
  const R5Y = P ? -0.8 : BAR_Y, TOKY0 = P ? -3.1 : TOK_Y;
  await until(S(3)); await play(out(new M.VGroup(c1, c4, t1, t4, t5)), new M.Transform(c5, card('R5  A great plot but a slow ending.', R5Y, C.violet)), ...say('REVIEW 5'));
  await until(S(4)); await play(new M.Indicate(c5, { color: C.violet }));
  const WC = { a: C.muted, but: C.muted, great: C.green, plot: C.cyan, ending: C.cyan, slow: C.pink };
  const words = ['a', 'great', 'plot', 'but', 'a', 'slow', 'ending'];
  const toks = words.map(w => tk(w, WC[w]));
  function rowPos(objs, y) {
    const ws = objs.map(o => o.getWidth()), gap = 0.15, tot = ws.reduce((s, w) => s + w, 0) + gap * (ws.length - 1);
    let x = CX - tot / 2; return ws.map(w => { const p = [x + w / 2, y, 0]; x += w + gap; return p; });
  }
  rowPos(toks, TOKY0).forEach((p, i) => toks[i].moveTo(p));
  await until(S(5)); await play(new M.LaggedStart(toks.map(fade), { lagRatio: 0.12, runTime: 1.2 }), ...say('SET ASIDE THE SMALL WORDS: a, a, but', C.muted));
  await play(...[0, 3, 4].map(i => new M.FadeOut(toks[i], { shift: [0, -0.3, 0] })));
  let [great, plot, slow, ending] = [1, 2, 5, 6].map(i => toks[i]);
  const keep = ['great', 'plot', 'slow', 'ending'];
  const kp0 = rowPos(keep.map(w => tk(w, WC[w])), TOKY0), kp = rowPos(keep.map(w => tk(w, WC[w])), TOK_Y);
  await until(S(6)); await play(moveTok(great, 'great', C.green, kp0[0]), moveTok(plot, 'plot', C.cyan, kp0[1]),
    moveTok(slow, 'slow', C.pink, kp0[2]), moveTok(ending, 'ending', C.cyan, kp0[3]), ...say('4 TOKENS: great, plot, slow, ending', C.green));

  // 7-11 two baskets
  const bS = basket(XS, C.cyan), bP = basket(XP, OR);
  const nS = lab('STORY', P ? 20 : 18, C.cyan, XS, NAME_Y), nQ = lab('?', P ? 20 : 18, OR, XP, NAME_Y);
  const up = P ? [new M.Transform(c5, card('R5  A great plot but a slow ending.', BAR_Y, C.violet)),
    moveTok(great, 'great', C.green, kp[0]), moveTok(plot, 'plot', C.cyan, kp[1]), moveTok(slow, 'slow', C.pink, kp[2]), moveTok(ending, 'ending', C.cyan, kp[3])] : [];
  await until(S(7)); await play(...up, new M.Create(bS), new M.Create(bP), fade(nS), fade(nQ), ...say('TWO BASKETS', C.amber));
  const nP = lab('PACE', P ? 20 : 18, OR, XP, NAME_Y);
  await until(S(8)); await play(out(nQ), fade(nP), ...say('BASKET 2 = PACE', OR));
  await until(S(9)); await play(moveTok(plot, 'plot', C.cyan, [XS - 0.75, R1, 0]), moveTok(ending, 'ending', C.cyan, [XS + 0.75, R1, 0]), ...say('plot, ending → STORY'));
  await until(S(10)); await play(moveTok(slow, 'slow', C.pink, [XP, R1, 0]), ...say('slow → PACE', OR));
  await until(S(11)); await play(moveTok(great, 'great', C.green, [CX, TOK_Y, 0]), ...say('great → STORY OR PACE?', C.green));
  await play(new M.Indicate(great, { color: C.green }));

  // 12-14 topic, mixture, topic model
  await until(S(12)); await play(...say('TOPIC = A SUBJECT READERS TALK ABOUT', C.amber));
  await until(S(13)); await play(out(c5), ...setBar(0.5, 'story ?', 'pace ?'), ...say('A REVIEW = A MIX OF TOPICS', C.violet));
  await until(S(14)); await play(...say('TOPIC MODEL = TEXT AS A MIX OF TOPICS', C.green));

  // 15-22 each topic: word cards and probabilities
  await until(S(15)); await play(out(new M.VGroup(plot, ending, slow, great, barNow)), ...say('EACH TOPIC: WORDS + PROBABILITIES', C.amber));
  barNow = null;
  const gapC = P ? 1.1 : 0.92, ch = P ? 0.26 : 0.17, cst = P ? 0.32 : 0.21;
  function cols(x, spec) {
    return spec.map(([w, n, c], j) => Array.from({ length: n }, (_, k) => {
      const r = new M.Rectangle({ width: P ? 0.86 : 0.72, height: ch, color: c, strokeWidth: 1 }); r.setFill(c, 0.8);
      r.moveTo([x + (j - 1) * gapC, BY - BH / 2 + 0.15 + ch / 2 + k * cst, 0]); return r;
    }));
  }
  const SS = [['plot', 4, C.cyan], ['ending', 4, C.cyan], ['great', 2, C.green]];
  const PS = [['slow', 6, C.pink], ['boring', 2, OR], ['great', 2, C.green]];
  const sCards = cols(XS, SS), pCards = cols(XP, PS);
  const wl = (x, spec) => spec.map(([w, , c], j) => fitW(lab(w, P ? 16 : 14, c, x + (j - 1) * gapC, WORD_Y), gapC - 0.05));
  const nl = (x, vals) => vals.map((v, j) => lab(v, P ? 18 : 15, C.ink, x + (j - 1) * gapC, NUM_Y));
  await until(S(16)); await play(new M.LaggedStart(sCards.flat().map(fade), { lagRatio: 0.1, runTime: 1.6 }), ...say('STORY BASKET: 10 WORD CARDS'));
  const sW = wl(XS, SS); let sN = nl(XS, ['4', '4', '2']);
  await until(S(17)); await play(fade(new M.VGroup(...sW)), fade(new M.VGroup(...sN)), ...say('plot 4,  ending 4,  great 2'));
  let sN2 = nl(XS, ['0.4', '0.4', '0.2']);
  await until(S(18)); await play(out(new M.VGroup(...sN)), fade(new M.VGroup(...sN2)),
    ...fbox(['story topic', ['plot   4 ÷ 10 = 0.4', C.cyan], ['ending 4 ÷ 10 = 0.4', C.cyan], ['great  2 ÷ 10 = 0.2', C.green]]), ...say('PROBABILITY = COUNT ÷ 10'));
  await until(S(19)); await play(new M.LaggedStart(pCards.flat().map(fade), { lagRatio: 0.1, runTime: 1.6 }), ...say('PACE BASKET: 10 WORD CARDS', OR));
  const pW = wl(XP, PS), pN = nl(XP, ['6', '2', '2']);
  await until(S(20)); await play(fade(new M.VGroup(...pW)), fade(new M.VGroup(...pN)), ...say('slow 6,  boring 2,  great 2', OR));
  const pN2 = nl(XP, ['0.6', '0.2', '0.2']);
  await until(S(21)); await play(out(new M.VGroup(...pN)), fade(new M.VGroup(...pN2)),
    ...fbox(['pace topic', ['slow   6 ÷ 10 = 0.6', C.pink], ['boring 2 ÷ 10 = 0.2', OR], ['great  2 ÷ 10 = 0.2', C.green]], OR));
  await until(S(22)); await play(...fbox(['story topic: slow = 0', 'pace topic:  plot = 0'], C.muted), ...say('WORD NOT IN ITS LIST → PROBABILITY 0', C.muted));

  // 23-34 round 1
  plot = tk('plot', C.cyan); ending = tk('ending', C.cyan); slow = tk('slow', C.pink); great = tk('great', C.green);
  const t4s = [great, plot, slow, ending];
  rowPos(t4s, TOK_Y).forEach((p, i) => t4s[i].moveTo(p));
  await until(S(23)); await play(out(new M.VGroup(...sCards.flat(), ...pCards.flat(), ...sW, ...pW, ...sN2, ...pN2)), fade(new M.VGroup(...t4s)),
    ...fbox([]), ...say('FIND THE BEST MIX FOR OUR 4 TOKENS', C.amber));
  await until(S(24)); await play(...setBar(0.5, 'story 0.5', 'pace 0.5'), ...say('START: HALF STORY, HALF PACE', C.violet));
  await until(S(25)); await play(...say('SHARE THE 4 TOKENS BETWEEN THE BASKETS'));
  await until(S(26)); await play(moveTok(plot, 'plot', C.cyan, [XS - 0.75, R1, 0]), moveTok(ending, 'ending', C.cyan, [XS + 0.75, R1, 0]), ...say('plot, ending → ALL TO STORY'));
  await until(S(27)); await play(moveTok(slow, 'slow', C.pink, [XP, R1, 0]), ...say('slow → ALL TO PACE', OR));
  await until(S(28)); await play(new M.Indicate(great, { color: C.green }),
    ...fbox([['great: story 0.2, pace 0.2', C.green], 'mix:   story 0.5, pace 0.5', ['→ equal shares', C.amber]], C.green), ...say('great: SAME PROBABILITY IN BOTH', C.green));
  let gP = tk('great 0.5', C.green).moveTo([XP, R2, 0]);
  await until(S(29)); await play(moveTok(great, 'great 0.5', C.green, [XS, R2, 0]), fade(gP), ...say('SPLIT great: HALF AND HALF', C.green));
  await until(S(30)); await play(...setS('1 + 1 + 0.5 = 2.5'), ...say('STORY: 2.5 TOKENS'));
  await until(S(31)); await play(...setP('1 + 0.5 = 1.5'), ...say('PACE: 1.5 TOKENS', OR));
  await until(S(32)); await play(...fbox(['story share', '= story count ÷ 4', '= 2.5 ÷ 4']), ...say('DIVIDE BY 4 TOKENS'));
  await until(S(33)); await play(...fbox(['story share', '= story count ÷ 4', '= 2.5 ÷ 4', ['= 0.625', C.amber]]));
  await until(S(34)); await play(...setBar(0.625, 'story 0.625', 'pace 0.375'), ...say('NEW MIX: 62.5% STORY', C.amber));

  // 35-38 loss
  await until(S(35)); await play(...say('LOSS = HOW BADLY THE MIX PREDICTS THE WORDS', C.pink), ...fbox(['loss: smaller = better'], C.pink));
  await until(S(36)); await play(...fbox(['mix 0.5: word probabilities', 'plot 0.2   ending 0.2', 'great 0.2  slow 0.3'], C.pink), ...say('HIGHER PROBABILITIES → SMALLER LOSS', C.green));
  await until(S(37)); await play(...fbox(['mix     loss', ['0.5     6.03', C.pink]], C.pink), ...say('START: LOSS ≈ 6.03', C.pink));
  await until(S(38)); await play(...fbox(['mix     loss', '0.5     6.03', ['0.625   5.87', C.green]], C.green), ...say('LOSS FALLS TO ≈ 5.87', C.green));

  // 39-43 round 2
  await until(S(39)); await play(...setS(''), ...setP(''), ...say('STEP 2: SAME WORK, NEW MIX', C.violet));
  await until(S(40)); await play(moveTok(great, 'great 0.625', C.green, [XS, R2, 0]), moveTok(gP, 'great 0.375', C.green, [XP, R2, 0]), ...say('great: 0.625 TO STORY', C.green));
  await until(S(41)); await play(...setS('1 + 1 + 0.625 = 2.625'), ...setP('1 + 0.375 = 1.375'), ...say('STORY: 2.625 TOKENS'));
  await until(S(42)); await play(...fbox(['story share', '= 2.625 ÷ 4', ['= 0.65625', C.amber]]), ...setBar(0.65625, 'story 0.656', 'pace 0.344'), ...say('NEW STORY SHARE: 0.65625', C.amber));
  await until(S(43)); await play(...fbox(['mix     loss', '0.5     6.03', '0.625   5.87', ['0.656   5.86', C.green]], C.green), ...say('LOSS ≈ 5.86', C.green));

  // 44-46 round 3
  await until(S(44)); await play(...setS(''), ...setP(''), moveTok(great, 'great 0.65625', C.green, [XS, R2, 0]), moveTok(gP, 'great 0.34375', C.green, [XP, R2, 0]), ...say('STEP 3', C.violet));
  await until(S(45)); await play(...setS('1 + 1 + 0.65625 = 2.65625'), ...setP('1 + 0.34375 = 1.34375'), ...say('STORY: 2.65625 TOKENS'));
  await until(S(46)); await play(...fbox(['story share', '= 2.65625 ÷ 4', ['≈ 0.664', C.amber]]), ...setBar(0.6640625, 'story 0.664', 'pace 0.336'), ...say('STORY SHARE ≈ 0.664', C.amber));

  // 47-48 faster rounds, settles at 2/3
  await until(S(47)); await play(...setS(''), ...setP(''), ...say('MORE STEPS: SMALLER AND SMALLER CHANGES', C.violet),
    ...fbox(['step   story  loss', '1      0.625  5.87', '2      0.656  5.86', ['3      0.664  5.86', C.amber]], C.violet));
  await play(...setBar(0.666, 'story 0.666', 'pace 0.334'), moveTok(great, 'great 0.664', C.green, [XS, R2, 0]), moveTok(gP, 'great 0.336', C.green, [XP, R2, 0]),
    ...fbox(['step   story  loss', '2      0.656  5.86', '3      0.664  5.86', ['4      0.666  5.86', C.amber]], C.violet));
  await play(...setBar(0.6665, 'story 0.6665', 'pace 0.3335'),
    ...fbox(['step   story  loss', '3      0.664  5.86', '4      0.666  5.86', ['5      0.6665 5.86', C.amber]], C.violet));
  await until(S(48)); await play(...setBar(2 / 3, 'story 2/3', 'pace 1/3'), moveTok(great, 'great 2/3', C.green, [XS, R2, 0]), moveTok(gP, 'great 1/3', C.green, [XP, R2, 0]), ...say('SETTLES: 2/3 STORY, 1/3 PACE', C.green));

  // 49 the rule
  await until(S(49)); await play(...fbox([['new topic share =', C.amber], '  topic token count', '  ÷ total tokens'], C.amber), ...say('THE RULE IN ONE LINE', C.amber));

  // 50-54 what it is for, and its limits
  await until(S(50)); await play(...say('FULL MODEL ALSO LEARNS THE WORD LISTS', C.cyan), new M.Indicate(nS, { color: C.amber }), new M.Indicate(nP, { color: C.amber }));
  await until(S(51)); await play(...say('FIND COMMON SUBJECTS IN MANY TEXTS', C.green));
  await until(S(52)); await play(...say('A TOPIC = A PATTERN OF WORDS, NOT UNDERSTANDING', C.amber));
  await until(S(53)); await play(...say('A PERSON READS THE WORDS AND NAMES THE TOPIC', C.violet), new M.Indicate(nS, { color: C.violet }));
  await until(S(54)); await play(...say('TEXT = A MIX OF TOPICS, NOT JUST ONE', C.green), new M.Indicate(barNow, { color: C.green }));
}

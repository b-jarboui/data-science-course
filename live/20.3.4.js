// 20.3.4 Temperature: divide every score by one number before softmax (live version, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const TOK = ['at', 'on', 'soon', 'late', 'purple'];
  const ST = {
    one: { t: 1, lab: 'T = 1', z: ['2.4', '2', '1.3', '0.4', '0'], p: [45, 30, 15, 6, 4], c: C.ink },
    low: { t: 0.5, lab: 'T = 0.5', z: ['4.8', '4', '2.6', '0.8', '0'], p: [63, 28, 7, 1, 0.5], c: C.cyan },
    high: { t: 2, lab: 'T = 2', z: ['1.2', '1', '0.65', '0.2', '0'], p: [33, 27, 19, 12, 10], c: C.amber },
    zero: { t: 0.1, lab: 'T = 0.1', z: ['24', '20', '13', '4', '0'], p: [98, 2, 0, 0, 0], c: C.cyan },
  };
  const CARDX = P ? -3.15 : -6.1, CW = P ? 1.3 : 1.4, CH = P ? 0.7 : 0.55;
  const SX = P ? -1.85 : -4.7, BX = P ? -1.25 : -4.0, BL = P ? 4.2 : 5.0, BH = P ? 0.5 : 0.4;
  const rowY = k => (P ? 0.5 - k * 1.15 : 0.75 - k * 0.75);
  const HDRY = P ? 1.2 : 1.35;
  const PILL = [0, 1.85, 0];
  const BOXP = P ? [0, 3.4, 0] : [4.3, -1.0, 0];
  const DIAL = P ? [2.9, -5.0, 0] : [4.3, 0.75, 0], DR = P ? 0.42 : 0.55;
  const PRE = P ? [-3.8, -5.0] : [-6.8, -2.8];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const pct = p => (p === 0 ? '≈0%' : `${p}%`);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function clearBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // token cards, raw scores, chance bars
  const cards = TOK.map((s, k) => {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([CARDX, rowY(k), 0]);
    const t = fit(T(s, 20, C.ink, false, true), CW - 0.25); t.moveTo([CARDX, rowY(k), 0]);
    return new M.VGroup(r, t);
  });
  const scoreLab = (k, s, c) => { const t = T(s, P ? 19 : 20, c, true); t.moveTo([SX, rowY(k), 0]); return t; };
  const bar = (k, p) => {
    const w = Math.max(0.02, BL * p / 100);
    const b = new M.Rectangle({ width: w, height: BH, color: C.cyan, strokeWidth: 1 });
    b.setFill(C.cyan, 0.82); b.moveTo([BX + w / 2, rowY(k), 0]); return b;
  };
  const pctLab = (k, p, c) => {
    const t = T(pct(p), P ? 18 : 19, c, true, true), w = Math.max(0.02, BL * p / 100);
    t.moveTo([BX + w + 0.15 + t.getWidth() / 2, rowY(k), 0]); return t;
  };
  const scores = TOK.map((_, k) => scoreLab(k, '?', C.muted));
  const bars = [], pcts = [null, null, null, null, null];
  function swapScore(k, s, c, rt = 0.6) {
    const old = scores[k]; scores[k] = scoreLab(k, s, c);
    return [new M.FadeOut(old, { runTime: rt }), new M.FadeIn(scores[k], { runTime: rt })];
  }
  function swapBar(k, p, c, rt = 0.6) {
    const a = [new M.Transform(bars[k], bar(k, p), { runTime: rt })];
    if (pcts[k]) a.push(new M.FadeOut(pcts[k], { runTime: rt }));
    pcts[k] = pctLab(k, p, c); a.push(new M.FadeIn(pcts[k], { runTime: rt }));
    return a;
  }
  const hdr = (s, x, left = false) => { const t = T(s, P ? 18 : 18, C.muted); t.moveTo([left ? x + t.getWidth() / 2 : x, HDRY, 0]); return t; };

  // the temperature dial: left half cool (low), right half hot (high)
  const ang = t => Math.PI * (1 - Math.min(t, 2.5) / 2.5);
  const needleAt = t => new M.Line({ start: DIAL, end: [DIAL[0] + 0.85 * DR * Math.cos(ang(t)), DIAL[1] + 0.85 * DR * Math.sin(ang(t)), 0], color: C.ink, strokeWidth: 4 });
  const arcCool = new M.Arc({ radius: DR, startAngle: Math.PI / 2, angle: Math.PI / 2, color: C.cyan, strokeWidth: 5 });
  arcCool.moveTo([DIAL[0] - DR / 2, DIAL[1] + DR / 2, 0]);
  const arcHot = new M.Arc({ radius: DR, startAngle: 0, angle: Math.PI / 2, color: C.amber, strokeWidth: 5 });
  arcHot.moveTo([DIAL[0] + DR / 2, DIAL[1] + DR / 2, 0]);
  const pivot = new M.Dot({ point: DIAL, radius: 0.05, color: C.ink });
  const needle = needleAt(1);
  const dialLab = (s, c) => { const t = T(s, 19, c, true, true); t.moveTo([DIAL[0], DIAL[1] - 0.3, 0]); return t; };
  let tLab = dialLab('÷ ?', C.muted);
  function swapDial(t, s, c, rt = 0.8) {
    const old = tLab; tLab = dialLab(s, c);
    return [new M.Transform(needle, needleAt(t), { runTime: rt }), new M.FadeOut(old, { runTime: rt }), new M.FadeIn(tLab, { runTime: rt })];
  }
  // before a new softmax: hide the old percents of the lower rows so no row shows a stale value
  // new logits, softmax not applied yet: grey bars, no percents (no stale numbers on screen)
  const blank = () => [0, 1, 2, 3, 4].flatMap(k => { bars[k].setColor(C.muted); bars[k].setFill(C.muted, 0.35); const a = pcts[k] ? [new M.FadeOut(pcts[k], { runTime: 0.4 })] : []; pcts[k] = null; return a; });
  function setAll(key, rt = 1.0) {
    const st = ST[key];
    return [...swapDial(st.t, st.lab, st.c, rt), ...TOK.flatMap((_, k) => [...swapScore(k, st.z[k], st.c, rt), ...swapBar(k, st.p[k], st.c, rt)])];
  }

  // the prefix under the table
  const preBase = T('The library will open', P ? 20 : 20, C.muted); preBase.moveTo([PRE[0] + preBase.getWidth() / 2, PRE[1], 0]);
  const word = (s, c) => { const t = T(s, P ? 20 : 20, c, false, true); t.moveTo([PRE[0] + preBase.getWidth() + 0.12 + t.getWidth() / 2, PRE[1], 0]); return t; };
  const preQ = word('?', C.amber);

  // 0-2 same answer every time; drawing by chance gives variety
  const row0 = [['greedy  →  …open at nine.', C.cyan], ['beam    →  …open on Monday.', C.violet]].map(([s, c], i) => {
    const t = fit(T(s, 24, c, true), FW - 1); t.moveTo([0, (P ? -1.4 : 0.5) - i * (P ? 1.4 : 0.9), 0]); return t; });
  await until(S(0)); await play(new M.LaggedStart(row0.map(t => new M.FadeIn(t)), { lagRatio: 0.4, runTime: 1.4 }), ...say('ALWAYS THE SAME ANSWER'));
  await until(S(1)); await play(...say('A LITTLE VARIETY SOUNDS MORE NATURAL', C.amber));
  const draws = ['draw 1  →  …open at ten.', 'draw 2  →  …open at nine.', 'draw 3  →  …open on Monday.'].map((s, i) => {
    const t = fit(T(s, 24, C.green, true), FW - 1); t.moveTo([0, (P ? -1.0 : 0.6) - i * (P ? 1.3 : 0.75), 0]); return t; });
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(...row0)), new M.LaggedStart(draws.map(t => new M.FadeIn(t)), { lagRatio: 0.4, runTime: 1.6 }), ...say('DRAW AT RANDOM → VARIETY', C.green));
  await until(S(2) + 2.1); await play(...say('CAN WE CONTROL HOW MUCH?', C.amber));

  // 3 the first step after "The library will open"
  const hTok = hdr('token', CARDX);
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(...draws)), new M.FadeIn(preBase), new M.FadeIn(preQ), new M.FadeIn(hTok),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.4 }), ...say('STEP 1: WHICH TOKEN NEXT?'));

  // 4-6 raw scores (logits)
  let hScore = hdr('raw number', SX);
  await until(S(4)); await play(new M.FadeIn(hScore), new M.LaggedStart(scores.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.2 }), ...say('FIRST: A RAW NUMBER PER TOKEN', C.violet));
  const hLogit = hdr('logit', SX);
  await until(S(5)); await play(new M.FadeOut(hScore), new M.FadeIn(hLogit), ...say('THIS NUMBER = A LOGIT', C.green));
  hScore = hLogit;
  await until(S(5) + 2.0); await play(...say('HIGHER = THE MODEL LIKES IT MORE', C.green));
  await until(S(6));
  for (let k = 0; k < 5; k++) {
    await until(S(6) + 0.2 + k * 1.35);
    await play(...swapScore(k, ST.one.z[k], C.ink), new M.Indicate(cards[k], { color: C.cyan, runTime: 0.6 }));
  }

  // 7-9 softmax turns scores into chances
  const hChance = hdr('softmax → probability', BX + 0.1, true);
  await until(S(7)); await play(new M.FadeIn(hChance), ...fbox(['softmax: logits →', 'probabilities', ['they add up to 100%', C.amber]]), ...say('SOFTMAX: A FIXED RECIPE', C.green));
  await until(S(8)); await play(new M.Indicate(scores[0], { color: C.amber }), ...say('BIGGER LOGIT → BIGGER PROBABILITY', C.amber));
  await until(S(8) + 2.9); await play(...say('BIGGER GAPS → MORE UNEQUAL', C.amber));
  await until(S(9));
  TOK.forEach((_, k) => { bars[k] = bar(k, 0); });
  await play(new M.LaggedStart(bars.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 0.8 }), ...say('SOFTMAX GIVES THE PROBABILITIES', C.green));
  for (let k = 0; k < 5; k++) {
    await until(S(9) + 2.8 + k * 0.8);
    await play(...swapBar(k, ST.one.p[k], C.ink), ...(k === 4 ? fbox(['45 + 30 + 15 + 6 + 4', ['= 100%', C.amber]]) : []));
  }

  // 10-11 a dial: divide every score by one number, the temperature
  await until(S(10));
  await play(new M.FadeIn(arcCool), new M.FadeIn(arcHot), new M.FadeIn(pivot), new M.FadeIn(needle), new M.FadeIn(tLab),
    ...fbox(['every logit ÷ ?']), ...say('A DIAL: DIVIDE EVERY LOGIT', C.violet));
  await until(S(11)); await play(...swapDial(1, 'T', C.ink), ...fbox(['every logit ÷ T', ['T = temperature', C.amber]]), ...say('THAT NUMBER = THE TEMPERATURE', C.amber));

  // 12-13 temperature one
  await until(S(12)); await play(...swapDial(1, 'T = 1', C.ink), ...say('T = 1', C.ink));
  await until(S(13)); await play(...fbox(['logit ÷ 1 = logit', 'probabilities:', ['45 30 15 6 4 (%)', C.ink]]), ...say('DIVIDING BY 1 CHANGES NOTHING', C.muted));
  await until(S(13) + 2.6); await play(new M.LaggedStart(pcts.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.2, runTime: 2.4 }));

  // 14-21 turn the dial down to one half
  await until(S(14)); await play(...swapDial(0.5, 'T = 0.5', C.cyan), ...say('TURN DOWN: T = 0.5', C.cyan));
  await until(S(15)); await play(...fbox(['how many halves fit in 2?', ['½ ½ ½ ½  →  4', C.cyan]]));
  await until(S(15) + 3.3); await play(...fbox(['how many halves fit in 2?', '½ ½ ½ ½  →  4', ['÷ ½  =  × 2', C.cyan]]), ...say('DIVIDE BY ½ = DOUBLE', C.cyan));
  await until(S(16)); await play(...fbox(['logit ÷ 0.5', ['= logit × 2', C.cyan]], C.cyan), ...blank(), ...say('THE LOGITS DOUBLE', C.cyan));
  for (let k = 0; k < 5; k++) {
    await until(S(16) + 1.6 + k * 0.85);
    await play(...swapScore(k, ST.low.z[k], C.cyan, 0.5));
  }
  await until(S(17)); await play(new M.Indicate(scores[0], { color: C.amber }), new M.Indicate(scores[1], { color: C.amber }), ...fbox(['gap at − on', 'was 2.4 − 2 = 0.4'], C.cyan));
  await until(S(17) + 3.7); await play(...fbox(['gap at − on', 'was 2.4 − 2 = 0.4', ['now 4.8 − 4 = 0.8', C.cyan]], C.cyan));
  await until(S(18)); await play(new M.LaggedStart(scores.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.2 }), ...say('EVERY GAP × 2', C.cyan));
  await until(S(19)); await play(...say('SOFTMAX AT T = 0.5', C.cyan));
  await until(S(19) + 1.3); await play(...swapBar(0, ST.low.p[0], C.cyan));
  await until(S(19) + 3.3); await play(...swapBar(1, ST.low.p[1], C.cyan));
  await until(S(20)); await play(...swapBar(2, ST.low.p[2], C.cyan));
  await until(S(20) + 1.4); await play(...swapBar(3, ST.low.p[3], C.cyan));
  await until(S(20) + 2.8); await play(...swapBar(4, ST.low.p[4], C.cyan));
  await until(S(21)); await play(new M.Indicate(bars[0], { color: C.cyan }), ...say('SHARPER: THE TOP BAR GREW', C.cyan));
  await until(S(21) + 1.6); await play(new M.LaggedStart([2, 3, 4].map(k => new M.Indicate(pcts[k], { color: C.pink })), { lagRatio: 0.25, runTime: 1.4 }));

  // 22-27 turn the dial up to two
  await until(S(22)); await play(...swapDial(2, 'T = 2', C.amber), ...say('TURN UP: T = 2', C.amber));
  await until(S(23)); await play(...fbox(['logit ÷ 2', ['= half the logit', C.amber]], C.amber), ...blank(), ...say('THE LOGITS HALVE', C.amber));
  for (let k = 0; k < 5; k++) {
    await until(S(23) + 2.8 + k * 1.05);
    await play(...swapScore(k, ST.high.z[k], C.amber, 0.5));
  }
  await until(S(24)); await play(...fbox(['gap at − on', 'was 2.4 − 2 = 0.4', ['now 1.2 − 1 = 0.2', C.amber]], C.amber), ...say('EVERY GAP ÷ 2', C.amber));
  await until(S(25)); await play(...say('SOFTMAX AT T = 2', C.amber));
  await until(S(25) + 1.3); await play(...swapBar(0, ST.high.p[0], C.amber));
  await until(S(25) + 3.5); await play(...swapBar(1, ST.high.p[1], C.amber));
  await until(S(26)); await play(...swapBar(2, ST.high.p[2], C.amber));
  await until(S(26) + 1.3); await play(...swapBar(3, ST.high.p[3], C.amber));
  await until(S(26) + 2.6); await play(...swapBar(4, ST.high.p[4], C.amber));
  await until(S(27)); await play(new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }), ...say('FLATTER: THE BARS MORE EVEN', C.amber));

  // 28 the rule in words
  await until(S(28)); await play(...fbox(['new logit =', 'old logit ÷ T', ['then apply softmax', C.amber]], C.amber), ...say('THE RULE IN WORDS', C.green));

  // 29-31 low sharpens, near zero is greedy, high flattens
  await until(S(29)); await play(...setAll('low'), ...say('LOW T → SHARPER', C.cyan));
  await until(S(29) + 2.4); await play(new M.Indicate(cards[0], { color: C.cyan }), new M.Indicate(bars[0], { color: C.cyan }));
  await until(S(30)); await play(...setAll('zero'), ...say('T NEAR 0 → TOP TOKEN 98%', C.cyan));
  await until(S(30) + 4.2); await play(...fbox(['T near 0  →  like greedy', ['almost always “at”', C.cyan]], C.cyan), ...say('JUST LIKE GREEDY DECODING', C.cyan));
  await until(S(31)); await play(...setAll('high'), ...clearBox(), ...say('HIGH T → FLATTER', C.amber));
  await until(S(31) + 2.5); await play(new M.Indicate(cards[3], { color: C.amber }), new M.Indicate(cards[4], { color: C.amber }), new M.Indicate(pcts[3], { color: C.amber }), new M.Indicate(pcts[4], { color: C.amber }));

  // 32 the name: hotter things move more randomly
  const SQ = 1.5, PH = P ? [[-1.1, 3.3], [1.1, 3.3]] : [[3.4, -0.9], [5.2, -0.9]];
  const sq = PH.map(([x, y], i) => { const r = new M.Rectangle({ width: SQ, height: SQ, color: i ? C.amber : C.cyan, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo([x, y, 0]); return r; });
  const sqLab = PH.map(([x, y], i) => { const t = T(i ? 'hot' : 'cold', 16, i ? C.amber : C.cyan); t.moveTo([x, y - SQ / 2 - 0.25, 0]); return t; });
  const spot = (i, [u, v]) => [PH[i][0] + u * SQ * 0.4, PH[i][1] + v * SQ * 0.4, 0];
  const coldDots = [];
  for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) coldDots.push(new M.Dot({ point: spot(0, [a * 0.8, b * 0.8]), radius: 0.07, color: C.cyan }));
  const HA = [[-0.7, 0.5], [0.2, 0.8], [0.75, 0.1], [-0.3, -0.2], [0.5, -0.7], [-0.8, -0.6], [0.1, 0.3], [-0.5, 0.9], [0.85, 0.75]];
  const HB = [[0.6, -0.4], [-0.8, 0.2], [-0.1, -0.85], [0.8, 0.6], [-0.6, 0.85], [0.3, 0.1], [-0.35, -0.5], [0.9, -0.8], [-0.9, -0.15]];
  const hotDots = HA.map(q => new M.Dot({ point: spot(1, q), radius: 0.07, color: C.amber }));
  await until(S(32));
  await play(...clearBox(), new M.LaggedStart([...sq, ...sqLab, ...coldDots, ...hotDots].map(o => new M.FadeIn(o)), { lagRatio: 0.03, runTime: 1.2 }), ...say('FROM PHYSICS: HOTTER = MORE RANDOM', C.amber));
  await until(S(32) + 1.9); await play(...hotDots.map((d, i) => new M.Transform(d, new M.Dot({ point: spot(1, HB[i]), radius: 0.07, color: C.amber }), { runTime: 1.2 })));

  // 33-36 what it is for
  await until(S(33)); await play(new M.FadeOut(new M.VGroup(...sq, ...sqLab, ...coldDots, ...hotDots)), ...say('WHAT IS TEMPERATURE FOR?', C.amber));
  await until(S(34)); await play(new M.Indicate(needle, { color: C.amber }), ...say('IT SETS HOW BOLD THE DRAWS ARE', C.violet));
  await until(S(35)); await play(...setAll('low'), ...fbox(['low T  →  facts', ['“open at nine.”', C.cyan]], C.cyan), ...say('LOW T: FACTS, LIKE OPENING HOURS', C.cyan));
  await until(S(36)); await play(...setAll('high'), ...fbox(['high T  →  creative', ['a poem for the library', C.amber]], C.amber), ...say('HIGH T: CREATIVE TASKS', C.amber));

  // 37-39 the order never changes; nothing new is learned
  await until(S(37)); await play(...say('THE ORDER NEVER CHANGES', C.green));
  await until(S(37) + 2.0); await play(new M.Indicate(cards[0], { color: C.green }));
  await until(S(37) + 4.0); await play(new M.Indicate(cards[4], { color: C.green }));
  await until(S(38)); await play(new M.LaggedStart(pcts.map(t => new M.Indicate(t, { color: C.violet })), { lagRatio: 0.15, runTime: 1.6 }), ...say('ONLY HOW FAR APART THEY ARE', C.violet));
  await until(S(39)); await play(...fbox(['the model’s own logits', ['2.4  2  1.3  0.4  0', C.ink], ['never change', C.muted]], C.muted), ...say('NOTHING NEW IS LEARNED', C.muted));

  // 40-44 the trap: high temperature lifts nonsense
  await until(S(40)); await play(...clearBox(), ...say('NOW THE TRAP', C.pink));
  await until(S(41)); await play(new M.Indicate(cards[4], { color: C.pink }), new M.Indicate(pcts[4], { color: C.pink }), ...say('HIGH T ALSO LIFTS NONSENSE', C.pink));
  await until(S(42)); await play(new M.Flash(pcts[4], { color: C.pink }), ...fbox(['purple', 'T = 1:   4%', ['T = 2:  10%', C.pink]], C.pink));
  const purpleWord = word('purple', C.pink);
  await until(S(43)); await play(new M.FadeOut(preQ), new M.FadeIn(purpleWord), ...fbox(['10% ≈ 1 answer in 10', ['“…will open purple”', C.pink]], C.pink), ...say('1 IN 10 ANSWERS: “OPEN PURPLE”', C.pink));
  const strike = new M.Line({ start: [CARDX - CW / 2 - 0.08, rowY(4), 0], end: [CARDX + CW / 2 + 0.08, rowY(4), 0], color: C.pink, strokeWidth: 4 });
  await until(S(44)); await play(new M.Create(strike), ...say('NEXT LESSONS: CUT SUCH TOKENS OUT', C.pink));

  // 45 recap
  const preQ2 = word('?', C.amber);
  await until(S(45));
  await play(new M.FadeOut(strike), new M.FadeOut(purpleWord), new M.FadeIn(preQ2),
    ...fbox(['new logit = logit ÷ T', ['low T  → sharper', C.cyan], ['high T → flatter', C.amber]]), ...say('RECAP', C.green));
  await until(S(45) + 4.4); await play(...setAll('low'));
  await until(S(45) + 6.4); await play(...setAll('high'));
}

// 19.1.5 Smoothing: a small chance for unseen words (add-one). Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const charW = sz => (T('00000000000000000000', sz, C.ink, true).getWidth() - T('0000000000', sz, C.ink, true).getWidth()) / 10;
  const COL = { plot: C.cyan, book: C.violet, idea: C.green, great: C.green, ending: C.pink };
  const col = w => COL[w] || C.ink;
  const XB = C.amber; // extra blocks

  // ---- formula box
  const BOXP = P ? [0, -5.6, 0] : [0, -2.35, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP) {
    const size = P ? 20 : 20, lh = P ? 0.44 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.35, top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = FW - 0.8; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- 0-4 typing box
  const TB = P ? [0, -1.4, 0] : [0, 0.7, 0], TBW = P ? 7.0 : 6.4;
  const tbox = new M.RoundedRectangle({ width: TBW, height: P ? 1.1 : 0.85, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  tbox.setFill(C.card, 0.95); tbox.moveTo(TB);
  let tlab = T('your review', P ? 17 : 15, C.muted).moveTo([TB[0] - TBW / 2 + 0.85, TB[1] + (P ? 0.8 : 0.62), 0]);
  if (P) {   // phone: the review page of the library website fills the screen
    const pg = new M.RoundedRectangle({ width: 7.5, height: 8.6, cornerRadius: 0.2, color: C.line, strokeWidth: 2 });
    pg.setFill(C.card, 0.5); pg.moveTo([0, -2.35, -0.02]);
    const bar = new M.Line({ start: [-3.75, 1.25, 0], end: [3.75, 1.25, 0], color: C.line, strokeWidth: 2 });
    const site = T('library website', 17, C.muted, false, true).moveTo([-2.0, 1.6, 0]);
    const head = T('Write a book review', 24, C.ink, false, true).moveTo([0, 0.35, 0]);
    tlab = new M.VGroup(pg, bar, site, head, tlab);
  }
  const typedT = s => { const t = T(s + ' |', P ? 30 : 26, C.ink, true); t.moveTo([TB[0] - TBW / 2 + 0.3 + t.getWidth() / 2, TB[1], 0]); return t; };
  let typed = typedT('');
  const SY = P ? -3.0 : -0.5;
  const sugs = ['plot', 'book', 'idea'].map((w, i) => pill(w, col(w), P ? 24 : 20).moveTo([(i - 1) * (P ? 2.2 : 2.0), SY, 0]));
  const sugLab = T('suggestions', P ? 17 : 15, C.muted).moveTo([0, SY - (P ? 0.6 : 0.5), 0]);
  const noEnd = pill('ending ✗', C.pink, P ? 24 : 20).moveTo([0, SY - (P ? 1.6 : 1.2), 0]);

  await until(S(0)); await play(new M.FadeIn(tbox), new M.FadeIn(tlab), new M.FadeIn(typed), ...say('WRITING A BOOK REVIEW'));
  await until(S(1)); await play(...say('YOU WANT: "great ending"', C.pink));
  await until(S(2)); { const t = typedT('great'); await play(new M.FadeOut(typed), new M.FadeIn(t), new M.LaggedStart(sugs.map(s => new M.FadeIn(s)), { lagRatio: 0.3, runTime: 1.2 }), new M.FadeIn(sugLab), ...say('TYPE "great", WAIT FOR A SUGGESTION')); typed = t; }
  await until(S(3)); await play(new M.FadeIn(noEnd), ...say('"ending" IS NEVER SUGGESTED', C.pink));
  await until(S(4)); await play(new M.Indicate(noEnd, { color: C.pink }), ...say('WHY? "great ending" MAKES SENSE', C.violet));

  // ---- 5-9 the six reviews, words after great
  const REV = ['A great book, a great plot.', 'A slow book. The plot is slow.', 'I loved the ending. A great book.',
    'A boring book. Slow, slow, slow.', 'A great plot but a slow ending.', 'I loved this book. A great plot, a great idea.'];
  const TOK = REV.map(s => s.toLowerCase().replace(/[.,!]/g, '').split(' '));
  const maxC = Math.max(...TOK.map(t => t.join(' ').length));
  const AW = P ? 6.7 : 11.6, X0 = P ? -3.25 : -5.6;
  const rsz = Math.min(P ? 18 : 22, 24 * AW / (maxC * charW(24))), rcw = charW(rsz);
  const rowY = k => P ? 1.6 - k * 1.15 : 1.2 - k * 0.55;
  const rows = TOK.map((t, k) => { let c = 0; return t.map(w => { const x = X0 + 0.45 + (c + w.length / 2) * rcw; c += w.length + 1; return { w, x, y: rowY(k), len: w.length, t: T(w, rsz, C.ink, true).moveTo([x, rowY(k), 0]) }; }); });
  const rtags = TOK.map((_, k) => T('R' + (k + 1), 15, C.muted, true, true).moveTo([X0 - 0.15, rowY(k), 0]));
  const allT = rows.flat();
  const under = (o, c) => new M.Line({ start: [o.x - o.len * rcw / 2, o.y - rcw * 1.25, 0], end: [o.x + o.len * rcw / 2, o.y - rcw * 1.25, 0], color: c, strokeWidth: 3 });
  const after = rows.flatMap(r => r.slice(0, -1).map((o, i) => [o, r[i + 1]]).filter(([o]) => o.w === 'great')).map(([, b]) => b);
  await until(S(5)); await play(new M.FadeOut(new M.VGroup(tbox, tlab, typed, ...sugs, sugLab, noEnd)), ...rtags.map(t => new M.FadeIn(t)), ...allT.map(o => new M.FadeIn(o.t)), ...say('OUR 6 REVIEWS'));
  const ul = after.map(b => under(b, col(b.w)));
  await until(S(6)); await play(new M.LaggedStart(ul.map(u => new M.Create(u)), { lagRatio: 0.15, runTime: 1.6 }), ...say('THE WORD RIGHT AFTER "great"', C.green));
  for (const [i, w, n] of [[7, 'plot', 3], [8, 'book', 2], [9, 'idea', 1]]) {
    await until(S(i));
    await play(...after.filter(b => b.w === w).map(b => new M.Indicate(b.t, { color: col(w) })), ...say(`${w}: ${n === 1 ? 'ONCE' : n === 2 ? 'TWICE' : '3 TIMES'}`, col(w)));
  }

  // ---- 10-20 fourteen boxes with blocks
  const VOC = ['a', 'book', 'boring', 'but', 'ending', 'great', 'i', 'idea', 'is', 'loved', 'plot', 'slow', 'the', 'this'];
  const SEEN = VOC.map(w => after.filter(b => b.w === w).length); // plot 3, book 2, idea 1
  const colX = j => P ? ((j % 7) - 3) * 1.1 : (j - 6.5) * 0.95;
  const BASES = P ? [-0.6, -4.2] : [-1.0];
  const base = j => BASES[P ? Math.floor(j / 7) : 0];
  const PIT = P ? 0.42 : 0.3, BKW = P ? 0.8 : 0.72, BXW = P ? 0.95 : 0.86, BXH = 4 * PIT + 0.12;
  const slot = (j, k) => [colX(j), base(j) + (k + 0.5) * PIT + 0.03, 0];
  const blk = (j, k, c) => { const b = new M.Rectangle({ width: BKW, height: PIT * 0.8, color: c, strokeWidth: 1 }); b.setFill(c, 0.85); b.moveTo(slot(j, k)); return b; };
  const boxes = VOC.map((w, j) => { const r = new M.Rectangle({ width: BXW, height: BXH, color: C.muted, strokeWidth: 2 }); r.setFill(C.card, 0.6); r.moveTo([colX(j), base(j) + BXH / 2, 0]); return r; });
  const wlab = VOC.map((w, j) => { const t = T(w, P ? 17 : 15, col(w), false, true); if (t.getWidth() > BXW + 0.05) t.scale((BXW + 0.05) / t.getWidth()); return t.moveTo([colX(j), base(j) - (P ? 0.3 : 0.25), 0]); });
  await until(S(10)); await play(new M.FadeOut(new M.VGroup(...allT.map(o => o.t), ...rtags, ...ul)), new M.LaggedStart(VOC.flatMap((_, j) => [new M.FadeIn(boxes[j]), new M.FadeIn(wlab[j])]), { lagRatio: 0.03, runTime: 1.8 }), ...say('14 BOXES: THE VOCABULARY'));
  await until(S(11)); await play(...say('1 BLOCK EACH TIME A WORD FOLLOWS "great"', C.green));
  const blocks = VOC.map(() => []);
  for (const [i, w] of [[12, 'plot'], [13, 'book'], [14, 'idea']]) {
    await until(S(i));
    const j = VOC.indexOf(w);
    for (let k = 0; k < SEEN[j]; k++) blocks[j].push(blk(j, k, col(w)));
    await play(new M.LaggedStart(blocks[j].map(b => new M.FadeIn(b, { shift: [0, -0.4, 0] })), { lagRatio: 0.3, runTime: 0.9 }), ...say(`${SEEN[j]} × ${w}`, col(w)));
  }
  const empty = VOC.map((_, j) => j).filter(j => !SEEN[j]);
  await until(S(15)); await play(new M.LaggedStart(empty.map(j => new M.Indicate(boxes[j], { color: C.muted })), { lagRatio: 0.08, runTime: 2 }), ...say('6 BLOCKS · 11 EMPTY BOXES', C.muted));
  await until(S(16)); await play(...say('PROBABILITY = SHARE OF THE 6 BLOCKS'));
  const jP = VOC.indexOf('plot'), jE = VOC.indexOf('ending'), jB = VOC.indexOf('book'), jI = VOC.indexOf('idea');
  await until(S(17)); await play(...blocks[jP].map(b => new M.Indicate(b, { color: C.cyan })), ...fbox([['plot:   3/6 = 1/2', C.cyan]]), ...say('plot: 3 OUT OF 6 = ONE HALF'));
  await until(S(18)); await play(new M.Indicate(boxes[jE], { color: C.pink }), ...fbox([['plot:   3/6 = 1/2', C.cyan], ['ending: 0/6 = 0', C.pink]], C.pink), ...say('ending: NO BLOCKS → 0', C.pink));
  await until(S(19)); await play(...say('NEVER SEEN → TREATED AS IMPOSSIBLE', C.pink));
  await until(S(20)); await play(...say('NOT SEEN ≠ CANNOT HAPPEN', C.violet));

  // ---- 21-26 the idea of extra blocks
  // legend: the seen blocks keep their word colours (plot, book, idea); extra blocks are amber
  const LG = P ? [-3.0, -6.75, 0] : [-6.3, 1.0, 0], lw = 0.3, lh = 0.24;
  const lgBlk = (x, c) => { const b = new M.Rectangle({ width: lw, height: lh, color: c, strokeWidth: 1 }); b.setFill(c, 0.85); b.moveTo([x, LG[1], 0]); return b; };
  const lgSeen = new M.VGroup(lgBlk(LG[0], C.cyan), lgBlk(LG[0] + 0.36, C.violet), lgBlk(LG[0] + 0.72, C.green));
  const lgT1 = T('seen', 16, C.ink).moveTo([LG[0] + 1.35, LG[1], 0]);
  const lgX = lgBlk(LG[0] + 2.35, XB), lgT2 = T('extra', 16, XB).moveTo([LG[0] + 3.0, LG[1], 0]);
  await until(S(21)); await play(...clearBox(), ...say('EVERY WORD GETS 1 EXTRA BLOCK', XB));
  await until(S(22)); await play(new M.FadeIn(lgSeen), new M.FadeIn(lgT1), new M.FadeIn(lgX), new M.FadeIn(lgT2), ...say('EXTRA BLOCKS: A NEW COLOUR', XB));
  await until(S(23)); await play(new M.Indicate(lgX, { color: XB }), ...say('NOT WORDS WE REALLY SAW', XB));
  await until(S(24)); await play(...say('A SMALL PROBABILITY FOR EVERY WORD', XB));
  await until(S(25)); await play(...say('THIS IS SMOOTHING', C.green));
  await until(S(26)); await play(...say('+1 EVERYWHERE = ADD-ONE (LAPLACE) SMOOTHING', C.green));

  // ---- 27-34 add the blocks
  await until(S(27)); await play(...say('NEW PROBABILITIES, STEP BY STEP'));
  const xb = VOC.map((_, j) => blk(j, SEEN[j], XB));
  for (const [i, j, w] of [[28, jP, 'plot'], [29, jB, 'book'], [30, jI, 'idea']]) {
    await until(S(i));
    await play(new M.FadeIn(xb[j], { shift: [0, -0.4, 0] }), ...fbox([[`${w}: ${SEEN[j]} + 1 = ${SEEN[j] + 1}`, col(w)]], XB));
  }
  await until(S(31)); await play(new M.LaggedStart(empty.map(j => new M.FadeIn(xb[j], { shift: [0, -0.4, 0] })), { lagRatio: 0.12, runTime: 2.4 }), ...fbox([['11 empty boxes: 0 + 1 = 1', XB], ['ending too', C.pink]], XB));
  await until(S(32)); await play(...fbox([['6 blocks', C.cyan], ['+ 14 new blocks', XB]], XB));
  await until(S(33)); await play(...fbox([['6 + 14 = 20 blocks', C.ink]], XB), ...say('6 + 14 = 20', XB));
  await until(S(34)); await play(...say('SHARE 20 BLOCKS AMONG 14 WORDS'));

  // ---- 35-42 new probabilities
  const plab = (j, s, c) => T(s, P ? 17 : 14, c, true, true).moveTo([colX(j), base(j) + BXH + 0.2, 0]);
  const pl = [];
  for (const [i, j, s, f] of [[35, jP, '0.2', 'plot:   4/20 = 0.2'], [36, jB, '0.15', 'book:   3/20 = 0.15'], [37, jI, '0.1', 'idea:   2/20 = 0.1'], [38, jE, '0.05', 'ending: 1/20 = 0.05']]) {
    await until(S(i));
    pl[j] = plab(j, s, col(VOC[j]));
    await play(new M.FadeIn(pl[j]), new M.Indicate(boxes[j], { color: col(VOC[j]) }), ...fbox([[f, col(VOC[j])]], col(VOC[j])));
  }
  const others = empty.filter(j => j !== jE);
  await until(S(39)); others.forEach(j => { pl[j] = plab(j, '0.05', C.muted); });
  await play(new M.LaggedStart(others.map(j => new M.FadeIn(pl[j])), { lagRatio: 0.12, runTime: 2 }), ...fbox([['10 other unseen words: 0.05 each', C.ink]], XB));
  await until(S(40)); await play(...[jP, jB, jI].map(j => new M.Indicate(boxes[j], { color: C.cyan })), ...fbox([['seen:   4 + 3 + 2 = 9 of 20', C.cyan]], C.cyan));
  await until(S(41)); await play(new M.LaggedStart(empty.map(j => new M.Indicate(xb[j], { color: XB })), { lagRatio: 0.08, runTime: 2 }), ...fbox([['seen:   4 + 3 + 2 = 9 of 20', C.cyan], ['unseen: 11 × 1 = 11 of 20', XB]], C.cyan));
  await until(S(42)); await play(...fbox([['9 + 11 = 20 → 20/20 = 1', C.green], ['0.2 + 0.15 + 0.1 + 11 × 0.05 = 1', C.ink]], C.green), ...say('ALL PROBABILITIES STILL ADD UP TO 1', C.green));

  // ---- 43-48 the formula
  await until(S(43)); await play(...say('TWO STEPS, ONE FORMULA'));
  await until(S(44)); await play(...fbox([['new P = new count ÷ new total', C.ink]]));
  await until(S(45)); await play(...fbox([['new P = new count ÷ new total', C.ink], ['new count = count + 1', XB]]));
  await until(S(46)); await play(...fbox([['new count = count + 1', XB], ['new total = total + 14 words', XB]]), ...say('14 = WORDS IN THE VOCABULARY', XB));
  await until(S(47)); await play(new M.Indicate(boxes[jE], { color: C.pink }), new M.Indicate(pl[jE], { color: C.pink }), ...fbox([['P(ending after great)', C.ink], ['= (0 + 1) ÷ (6 + 14) = 0.05', C.pink]], C.pink), ...say('NOW IT CAN SUGGEST "great ending"', C.green));
  await until(S(48)); await play(...say('USEFUL WHEN DATA IS SMALL', C.green));

  // ---- 49-54 the price
  await until(S(49)); await play(new M.Indicate(boxes[jP], { color: C.cyan }), new M.Indicate(pl[jP], { color: C.cyan }), ...fbox([['plot now: 4/20 = 0.2', C.cyan]], C.cyan), ...say('LOOK AGAIN AT plot'));
  await until(S(50)); await play(...fbox([['before: plot 3/6  = 0.5', C.cyan]], C.cyan));
  await until(S(51)); await play(...fbox([['before: plot 3/6  = 0.5', C.cyan], ['after:  plot 4/20 = 0.2', XB]], C.cyan), ...say('0.5 → 0.2', XB));
  await until(S(52)); await play(...fbox([['seen words:   0.45', C.cyan], ['unseen words: 0.55', XB]], XB), ...say('SEEN WORDS GIVE SOME PROBABILITY AWAY', XB));
  await until(S(53)); await play(new M.LaggedStart(empty.map(j => new M.Indicate(pl[j], { color: C.pink })), { lagRatio: 0.08, runTime: 2 }), ...say('MANY UNSEEN WORDS → TOO MUCH PROBABILITY', C.pink));
  await until(S(54)); await play(...fbox([['unseen ≠ impossible:', C.ink], ['small probability, not 0', C.green]], C.green), ...say('SMOOTHING: UNSEEN ≠ IMPOSSIBLE', C.green));
}

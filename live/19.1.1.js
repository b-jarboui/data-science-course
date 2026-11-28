// 19.1.1 Tokenization: turning text into small pieces. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const charW = sz => (T('00000000000000000000', sz, C.ink, true).getWidth() - T('0000000000', sz, C.ink, true).getWidth()) / 10;

  // ---- formula box
  const BOXP = P ? [0, -1.9, 0] : [0, -3.0, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([BOXP[0], top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = FW - 1.0; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // ---- 0-2 library and six review cards
  const REV = ['A great book, a great plot.', 'A slow book. The plot is slow.', 'I loved the ending. A great book.',
    'A boring book. Slow, slow, slow.', 'A great plot but a slow ending.', 'I loved this book. A great plot, a great idea.'];
  const cw0 = P ? 7.4 : 6.5, ch0 = P ? 1.0 : 0.9;
  const cardPos = k => P ? [0, 3.4 - k * 1.3, 0] : [(k % 2 ? 3.45 : -3.45), 0.85 - Math.floor(k / 2) * 1.15, 0];
  const cards = REV.map((s, k) => {
    const p = cardPos(k);
    const r = new M.RoundedRectangle({ width: cw0, height: ch0, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const tag = T('R' + (k + 1), P ? 14 : 16, C.muted, true, true); tag.moveTo([p[0] - cw0 / 2 + 0.35, p[1], 0]);
    const tx = fit(T(s, P ? 18 : 18, C.ink), cw0 - 1.0); tx.moveTo([p[0] + 0.25, p[1], 0]);
    return new M.VGroup(r, tag, tx);
  });
  // a simple book icon
  const bk = P ? [0, 1.0, 0] : [0, -0.4, 0];
  const pageL = new M.Rectangle({ width: 1.3, height: 1.7, color: C.cyan, strokeWidth: 2 }); pageL.setFill(C.card, 0.95); pageL.moveTo([bk[0] - 0.65, bk[1], 0]);
  const pageR = new M.Rectangle({ width: 1.3, height: 1.7, color: C.cyan, strokeWidth: 2 }); pageR.setFill(C.card, 0.95); pageR.moveTo([bk[0] + 0.65, bk[1], 0]);
  const bl = [0, 1, 2, 3].flatMap(i => [-0.65, 0.65].map(dx => new M.Line({ start: [bk[0] + dx - 0.4, bk[1] + 0.45 - i * 0.3, 0], end: [bk[0] + dx + 0.4, bk[1] + 0.45 - i * 0.3, 0], color: C.muted, strokeWidth: 2 })));
  const book = new M.VGroup(pageL, pageR, ...bl);

  await until(S(0)); await play(new M.FadeIn(book), ...say('A LIBRARY WEBSITE: BOOK REVIEWS'));
  await until(S(1)); await play(new M.FadeOut(book), new M.FadeIn(cards[0]), ...say('REVIEW = A MESSAGE ABOUT A BOOK'));
  await until(S(2)); await play(new M.LaggedStart(cards.slice(1).map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.6 }), ...say('6 SHORT REVIEWS'));
  await until(S(3)); await play(new M.LaggedStart([0, 2, 4, 5].map(k => new M.Indicate(cards[k], { color: C.amber })), { lagRatio: 0.25, runTime: 2.2 }), ...say('FIND EVERY REVIEW WITH "great"', C.amber));
  await until(S(4)); await play(...say('HOW CAN A COMPUTER FIND ONE WORD?', C.violet));

  // ---- the review as a strip of paper, one text per word (mono, so positions are exact)
  const W = [['I', ''], ['loved', ''], ['this', ''], ['book', '.'], ['A', ''], ['great', ''], ['plot', ','], ['a', ''], ['great', ''], ['idea', '.']];
  const rowOf = k => P ? (k < 4 ? 0 : k < 7 ? 1 : 2) : 0;
  const rowY = P ? [0.8, -1.8, -4.4] : [0.5];
  const rowLen = rowY.map((_, r) => W.filter((_, k) => rowOf(k) === r).reduce((s, [b, p]) => s + b.length + p.length + 1, -1));
  const maxLen = Math.max(...rowLen), cw24 = charW(24);
  const sz = Math.min(P ? 44 : 30, 24 * (P ? 6.6 : 12.4) / (maxLen * cw24)), cw = charW(sz);
  const pos = [], spaces = [];
  { const at = rowY.map(() => 0);
    W.forEach(([b, p], k) => {
      const r = rowOf(k), x0 = -rowLen[r] * cw / 2, st = at[r];
      pos.push({ x: x0 + (st + b.length / 2) * cw, px: x0 + (st + b.length + 0.5) * cw, y: rowY[r], w: b.length * cw });
      at[r] += b.length + p.length + 1;
      if (W[k + 1] && rowOf(k + 1) === r) spaces.push({ x: x0 + (at[r] - 0.5) * cw, y: rowY[r], after: k });
    }); }
  const stripH = cw * 2.7;
  const strips = rowY.map((y, r) => { const s = new M.RoundedRectangle({ width: rowLen[r] * cw + 0.6, height: stripH, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 }); s.setFill('#1a2346', 1); s.moveTo([0, y, 0]); return s; });
  const words = W.map(([b], k) => T(b, sz, C.ink, true).moveTo([pos[k].x, pos[k].y, 0]));
  const puncts = W.map(([, p], k) => p ? T(p, sz, C.ink, true).moveTo([pos[k].px, pos[k].y, 0]) : null);
  const allP = puncts.filter(Boolean);

  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(...cards)), ...strips.map(s => new M.FadeIn(s)), ...words.map(w => new M.FadeIn(w)), ...allP.map(p => new M.FadeIn(p)), ...say('REVIEW 6'));
  await until(S(6)); await play(new M.LaggedStart([0, 1, 2, 3].map(k => new M.Indicate(words[k], { color: C.cyan })), { lagRatio: 0.3, runTime: 0.9 }));
  await until(S(7)); await play(new M.LaggedStart([4, 5, 6, 7, 8, 9].map(k => new M.Indicate(words[k], { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }));
  const unders = W.map((_, k) => new M.Line({ start: [pos[k].x - pos[k].w / 2, pos[k].y - stripH * 0.32, 0], end: [pos[k].x + pos[k].w / 2, pos[k].y - stripH * 0.32, 0], color: C.green, strokeWidth: 3 }));
  await until(S(8)); await play(new M.LaggedStart(unders.map(u => new M.Create(u)), { lagRatio: 0.15, runTime: 2 }), ...say('WE SEE WHERE EACH WORD STARTS AND ENDS', C.green));
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(...unders)), ...strips.map(s => new M.Indicate(s, { color: C.ink })), ...say('A LONG STRIP OF PAPER', C.muted));
  const marks = spaces.map(s => { const d = new M.Dot({ point: [s.x, s.y - stripH * 0.3, 0], radius: 0.06, color: C.amber }); return d; });
  await until(S(10)); await play(new M.LaggedStart(marks.map(m => new M.FadeIn(m)), { lagRatio: 0.15, runTime: 1.6 }), ...say('BETWEEN WORDS: SPACES', C.amber));
  await until(S(11)); await play(new M.LaggedStart([0, 1, 2].map(k => new M.Indicate(words[k], { color: C.amber })), { lagRatio: 0.3, runTime: 1.2 }), ...say('THE FIRST 3 WORDS', C.amber));
  const cutLine = s => new M.DashedLine({ start: [s.x, s.y + stripH * 0.75, 0], end: [s.x, s.y - stripH * 0.75, 0], color: C.pink, strokeWidth: 3 });
  const cuts3 = spaces.slice(0, 3).map(cutLine);
  await until(S(12)); await play(new M.LaggedStart(cuts3.map(c => new M.Create(c)), { lagRatio: 0.4, runTime: 1.5 }), ...say('CUT AT THE SPACES', C.pink));
  const pieceY = P ? -6.0 : -1.3;
  const pieces = ['I', 'loved', 'this'].map((s, i) => pill(s, C.cyan, P ? 30 : 26).moveTo([(i - 1) * (P ? 2.2 : 2.4), pieceY, 0]));
  await until(S(13)); await play(new M.LaggedStart(pieces.map(p => new M.FadeIn(p, { shift: [0, -0.3, 0] })), { lagRatio: 0.3, runTime: 1.4 }), ...say('3 SEPARATE PIECES'));
  await until(S(14)); await play(new M.LaggedStart(pieces.map(p => new M.Indicate(p, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.2 }), ...say('EACH PIECE = A TOKEN'));
  await until(S(15)); await play(...say('TEXT → TOKENS = TOKENIZATION', C.green));
  await until(S(16)); await play(...say('HERE: 1 TOKEN = 1 WORD'));
  await until(S(17)); await play(new M.FadeOut(new M.VGroup(...pieces, ...cuts3)), ...say('FIRST WE NEED A RULE', C.violet));

  // ---- 18-23 capitals and punctuation
  const ring = (x, y, c) => new M.Circle({ radius: cw * 0.95, color: c, strokeWidth: 3 }).moveTo([x, y, 0]);
  const rA = [4, 7].map(k => ring(pos[k].x, pos[k].y, C.amber));
  await until(S(18)); await play(...rA.map(r => new M.Create(r)), ...say('TWO LETTERS A', C.amber));
  const labY = k => P ? rowY[rowOf(k)] - stripH * 0.95 : rowY[0] + stripH * 0.95;
  const labs = [['large', 4], ['small', 7]].map(([s, k]) => T(s, P ? 16 : 17, C.amber).moveTo([pos[k].x, labY(k), 0]));
  await until(S(19)); await play(...labs.map(l => new M.FadeIn(l)), ...say('A = LARGE   a = SMALL', C.amber));
  await until(S(20)); await play(...say('A AND a: THE SAME WORD', C.green));
  const rP = [3, 6, 9].map(k => ring(pos[k].px, pos[k].y, C.pink));
  await until(S(21)); await play(new M.FadeOut(new M.VGroup(...rA, ...labs)), ...rP.map(r => new M.Create(r)), ...say('DOTS AND A COMMA', C.pink));
  await until(S(22)); await play(...say('PUNCTUATION MARKS:  .  ,  !', C.pink));
  await until(S(23)); await play(...say('WE WANT WORDS WITHOUT MARKS', C.pink));

  // ---- 24-32 three steps
  await until(S(24)); await play(new M.FadeOut(new M.VGroup(...rP)), ...say('BACK TO THE REVIEW: 3 STEPS', C.violet));
  await until(S(25)); await play(new M.Indicate(words[0], { color: C.cyan }), new M.Indicate(words[4], { color: C.cyan }), ...say('STEP 1: LARGE → SMALL LETTERS'));
  for (const [i, k, s] of [[26, 0, 'i'], [27, 4, 'a']]) {
    await until(S(i));
    const nw = T(s, sz, C.cyan, true).moveTo([pos[k].x, pos[k].y, 0]);
    await play(new M.FadeOut(words[k], { shift: [0, 0.2, 0] }), new M.FadeIn(nw, { shift: [0, 0.2, 0] }), ...say(i === 26 ? 'I → i' : 'A → a'));
    words[k] = nw;
  }
  await until(S(28)); await play(...say('STEP 2: REMOVE  .  ,  !', C.pink));
  for (const [i, k, s] of [[29, 3, 'DOT AFTER book'], [30, 6, 'COMMA AFTER plot'], [31, 9, 'DOT AFTER idea']]) {
    await until(S(i)); await play(new M.FadeOut(puncts[k], { shift: [0, -0.3, 0] }), new M.Flash(puncts[k], { color: C.pink }), ...say('REMOVE THE ' + s, C.pink));
  }
  const cuts = spaces.map(cutLine);
  await until(S(32)); await play(new M.FadeOut(new M.VGroup(...marks)), new M.LaggedStart(cuts.map(c => new M.Create(c)), { lagRatio: 0.15, runTime: 2 }), ...say('STEP 3: CUT AT EVERY SPACE', C.amber));

  // ---- 33-43 tokens into boxes, in order
  const perRow = P ? 5 : 10, SPX = P ? 1.5 : 1.3, BW = P ? 1.36 : 1.18, BH = P ? 0.72 : 0.6;
  const boxY = P ? [-5.45, -6.5] : [-1.35];
  const bp = k => [((k % perRow) - (perRow - 1) / 2) * SPX, boxY[Math.floor(k / perRow)], 0];
  const boxes = W.map((_, k) => { const r = new M.RoundedRectangle({ width: BW, height: BH, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo(bp(k)); return r; });
  const bsz = Math.min(sz, 24 * (BW - 0.25) / (5 * cw24));
  await until(S(33)); await play(new M.LaggedStart(boxes.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.6 }), ...say('ONE BOX PER TOKEN, IN ORDER'));
  const toks = [];
  for (let k = 0; k < 10; k++) {
    await until(S(34 + k));
    const s = W[k][0].toLowerCase();
    const t = T(s, bsz, C.cyan, true).moveTo(bp(k));
    await play(new M.FadeOut(words[k], { shift: [0, -0.3, 0] }), new M.FadeIn(t, { shift: [0, -0.3, 0] }), new M.Indicate(boxes[k], { color: C.cyan, runTime: 0.45 }));
    toks.push(t);
  }
  const CNT = P ? [0, 0.7, 0] : [0, -2.1, 0];
  const counter = T('10 tokens', P ? 26 : 20, C.amber, true, true).moveTo(CNT);
  await until(S(44)); await play(new M.FadeOut(new M.VGroup(...strips, ...cuts)), new M.FadeIn(counter), ...say('10 TOKENS', C.amber));
  await until(S(45));
  [4, 7, 5, 8].forEach(k => { boxes[k].setColor(C.amber); boxes[k].setFill(C.card, 0.95); });
  await play(...[4, 7, 5, 8].map(k => new M.Indicate(boxes[k], { color: C.amber })), ...say('a ×2    great ×2', C.amber));
  await until(S(46));
  [7, 8].forEach(k => { boxes[k].setStrokeOpacity(0.35); toks[k].setOpacity ? toks[k].setOpacity(0.4) : null; });
  const counter2 = fit(T('10 tokens  ·  8 different words', P ? 22 : 20, C.amber, true, true), FW - 0.8).moveTo(CNT);
  await play(new M.FadeOut(counter), new M.FadeIn(counter2), ...say('8 DIFFERENT WORDS', C.green));
  [7, 8].forEach(k => { boxes[k].setStrokeOpacity(1); toks[k].setOpacity ? toks[k].setOpacity(1) : null; });

  const RULE = P ? [['small letters →', C.ink], ['remove . , ! → split at spaces', C.ink]] : [['small letters → remove . , ! → split at spaces', C.ink]];
  // ---- 47-50 the rule
  await until(S(47)); await play(...say('THE RULE IN ONE LINE'));
  await until(S(48)); await play(...fbox(RULE));
  await until(S(49)); await play(...fbox([...RULE, ...(P ? [['R1 6 · R2 7 · R3 7', C.muted], ['R4 6 · R5 7 · R6 10', C.muted]] : [['R1 6 · R2 7 · R3 7 · R4 6 · R5 7 · R6 10', C.muted]])]), ...say('SAME RULE FOR ALL 6 REVIEWS: 43 TOKENS', C.green));
  await until(S(50)); await play(new M.Flash(boxes[5], { color: C.amber }), new M.Flash(boxes[8], { color: C.amber }), new M.Indicate(toks[5], { color: C.amber }), new M.Indicate(toks[8], { color: C.amber }), ...say('FIND "great": TOKENS 6 AND 9', C.amber));

  // ---- 51-54 what is lost, and the idea
  const gx = (bp(3)[0] + bp(4)[0]) / 2;
  const gap1 = new M.DashedLine({ start: [gx, bp(3)[1] + BH * 0.75, 0], end: [gx, bp(3)[1] - BH * 0.75, 0], color: C.pink, strokeWidth: 3 });
  const ex = bp(9)[0] + BW / 2 + 0.06;
  const gap2 = new M.DashedLine({ start: [ex, bp(9)[1] + BH * 0.75, 0], end: [ex, bp(9)[1] - BH * 0.75, 0], color: C.pink, strokeWidth: 3 });
  await until(S(51)); await play(new M.Create(gap1), new M.Create(gap2), ...say('WHERE WERE THE DOTS?', C.pink));
  await until(S(52)); await play(new M.Indicate(gap1, { color: C.pink }), ...say('SENTENCE ENDS ARE LOST', C.pink));
  await until(S(53)); await play(new M.FadeOut(new M.VGroup(gap1, gap2)), ...say('DIFFERENT TASKS → DIFFERENT RULES', C.violet));
  await until(S(54)); await play(new M.LaggedStart(boxes.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.1, runTime: 2 }), ...say('TOKENS: SEARCH, COUNT, USE', C.green));
}

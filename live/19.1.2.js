// 19.1.2 Bag of words. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const STORY = ['plot', 'ending'], PACE = ['boring'];
  const colorOf = w => w === 'slow' ? C.pink : STORY.includes(w) ? C.cyan : PACE.includes(w) ? C.amber : w === 'great' ? C.green : C.ink;

  // ---- formula box
  const BOXP = P ? [0, 1.7, 0] : [0, -2.35, 0];
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP) {
    const size = P ? 19 : 21, lh = P ? 0.42 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([at[0], top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = FW - 0.8; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- review cards
  const REV = ['A great book, a great plot.', 'A slow book. The plot is slow.', 'I loved the ending. A great book.',
    'A boring book. Slow, slow, slow.', 'A great plot but a slow ending.', 'I loved this book. A great plot, a great idea.'];
  const TOK = REV.map(s => s.toLowerCase().replace(/[.,!]/g, '').split(' '));
  const cw0 = P ? 7.4 : 6.5, ch0 = P ? 1.0 : 0.9;
  const card = (s, tag, p, w = cw0, h = ch0, c = C.cyan) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: c, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const tg = T(tag, P ? 15 : 16, C.muted, true, true); tg.moveTo([p[0] - w / 2 + 0.38, p[1], 0]);
    const tx = fit(T(s, P ? 18 : 18, C.ink), w - 1.05); tx.moveTo([p[0] + 0.25, p[1], 0]);
    return new M.VGroup(r, tg, tx);
  };
  const cardPos = k => P ? [0, 1.5 - k * 1.5, 0] : [(k % 2 ? 3.45 : -3.45), 0.85 - Math.floor(k / 2) * 1.15, 0];
  const cards = REV.map((s, k) => card(s, 'R' + (k + 1), cardPos(k)));

  await until(S(0)); await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.6 }), ...say('FIND THE "slow" BOOKS', C.pink));
  await until(S(1)); await play(new M.LaggedStart([1, 3, 4].map(k => new M.Indicate(cards[k], { color: C.pink })), { lagRatio: 0.3, runTime: 2.2 }), ...say('slow: SOMETIMES MORE THAN ONCE', C.pink));
  await until(S(2)); await play(...say('REVIEW → NUMBERS: HOW OFTEN EACH WORD?', C.violet));

  // ---- 3-15 the bag
  const topCard = P ? [0, 1.5, 0] : [0, 0.95, 0];
  await until(S(3));
  await play(new M.FadeOut(new M.VGroup(...cards.filter((_, k) => k !== 3))), new M.Transform(cards[3], card(REV[3], 'R4', topCard)), ...say('REVIEW 4'));
  await until(S(4)); await play(new M.Indicate(cards[3], { color: C.amber }));
  const R4 = TOK[3]; // a boring book slow slow slow
  const tsz = P ? 26 : 20;
  const rowPos = j => P ? [((j % 2) - 0.5) * 3.2, -0.6 - Math.floor(j / 2) * 1.5, 0] : [(j - 2.5) * 1.9, -0.15, 0];
  const pieces = R4.map((w, j) => pill(w, colorOf(w), tsz).moveTo(rowPos(j)));
  await until(S(5)); await play(new M.LaggedStart(pieces.map(p => new M.FadeIn(p, { shift: [0, -0.2, 0] })), { lagRatio: 0.2, runTime: 1.8 }), ...say('6 TOKENS'));
  await until(S(6)); await play(new M.LaggedStart(pieces.map(p => new M.Indicate(p, { color: C.ink })), { lagRatio: 0.15, runTime: 1.5 }), ...say('EACH TOKEN = A SMALL PIECE OF PAPER', C.muted));
  const BAG = P ? [0, -5.5, 0] : [0, -1.85, 0], bs = P ? 1.3 : 1;
  const bag = new M.RoundedRectangle({ width: 3.0 * bs, height: 1.7 * bs, cornerRadius: 0.5, color: C.violet, strokeWidth: 3 });
  bag.setFill(C.card, 0.95); bag.moveTo(BAG);
  const tie = new M.Line({ start: [BAG[0] - 0.45, BAG[1] + 0.95 * bs, 0], end: [BAG[0] + 0.45, BAG[1] + 0.95 * bs, 0], color: C.violet, strokeWidth: 4 });
  const bagLab = T('BAG', P ? 18 : 16, C.violet, true, true).moveTo([BAG[0] + (P ? 2.9 : 1.85), BAG[1] + 0.6, 0]);
  const inBag = [[-0.8, 0.35], [0.5, 0.4], [-0.3, -0.05], [0.8, -0.1], [-0.7, -0.45], [0.4, -0.5]].map(([x, y]) => [x * bs, y * bs]);
  await until(S(7));
  await play(new M.FadeIn(bag), new M.FadeIn(tie), new M.FadeIn(bagLab), ...say('INTO THE BAG, THEN SHAKE', C.violet));
  await play(new M.LaggedStart(pieces.map((p, j) => new M.Transform(p, pill(R4[j], colorOf(R4[j]), P ? 16 : 14).moveTo([BAG[0] + inBag[j][0], BAG[1] + inBag[j][1], 0]), { pathArc: -0.6 })), { lagRatio: 0.15, runTime: 1.4 }));
  await play(new M.Indicate(bag, { color: C.violet, runTime: 0.6 }));
  // matching words together
  const grp = P ? { a: [-1.2, 0.0], boring: [-1.2, -1.6], book: [-1.2, -3.2], slow: [-1.2, -4.8] } : { a: [-4.8, -0.2], boring: [-2.2, -0.2], book: [0.4, -0.2], slow: [3.4, -0.2] };
  const seen = {};
  const outPos = w => { const n = seen[w] = (seen[w] || 0) + 1; const g = grp[w]; return w === 'slow' ? [g[0] + (n - 2) * (P ? 1.45 : 1.15), g[1], 0] : [g[0], g[1], 0]; };
  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(bag, tie, bagLab)), new M.LaggedStart(pieces.map((p, j) => new M.Transform(p, pill(R4[j], colorOf(R4[j]), tsz).moveTo(outPos(R4[j])))), { lagRatio: 0.12, runTime: 1.6 }), ...say('MATCHING WORDS TOGETHER'));
  const cnt = {};
  const xLab = (w, n) => T('×' + n, P ? 26 : 20, colorOf(w), true, true).moveTo(P ? [2.4, grp[w][1], 0] : w === 'slow' ? [grp.slow[0], grp.slow[1] - (P ? 0.6 : 0.65), 0] : [grp[w][0], grp[w][1] - (P ? 0.6 : 0.65), 0]);
  for (const [i, w, idx] of [[9, 'a', [0]], [10, 'boring', [1]], [11, 'book', [2]], [12, 'slow', [3, 4, 5]]]) {
    await until(S(i)); cnt[w] = xLab(w, idx.length);
    await play(...idx.map(j => new M.Indicate(pieces[j], { color: colorOf(w) })), new M.FadeIn(cnt[w]), ...say(`${idx.length} × ${w}`, colorOf(w) === C.ink ? C.cyan : colorOf(w)));
  }
  await until(S(13)); await play(...say('ALL 6 WORDS KEPT · ORDER LOST', C.amber));
  await until(S(14)); await play(...say('BAG OF WORDS', C.green));
  await until(S(15)); await play(new M.LaggedStart(Object.values(cnt).map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...say('KEEP HOW OFTEN · NOT WHERE', C.green));
  await until(S(16)); await play(new M.FadeOut(new M.VGroup(cards[3], ...pieces, ...Object.values(cnt))), ...say('THE WHOLE REVIEW AS NUMBERS?', C.violet));

  // ---- 17-25 vocabulary from all six reviews
  const VOC = ['a', 'book', 'boring', 'but', 'ending', 'great', 'i', 'idea', 'is', 'loved', 'plot', 'slow', 'the', 'this'];
  const colX = j => P ? ((j % 7) - 3) * 1.1 : (j - 6.5) * 0.98;
  const colRow = j => P ? Math.floor(j / 7) : 0;
  const WORDY = P ? [0.3, -3.4] : [1.1];
  const BOXY = P ? [-0.9, -4.6] : [0.15];
  const BW = P ? 1.0 : 0.88, BH = P ? 1.5 : 1.2;
  const all = TOK.flat(); // 43 tokens
  const gcols = P ? 6 : 11;
  const gPos = i => P ? [((i % gcols) - 2.5) * 1.2, 1.6 - Math.floor(i / gcols) * 0.75, 0] : [((i % gcols) - 5) * 1.2, 1.0 - Math.floor(i / gcols) * 0.55, 0];
  const small = (w, sz = 15) => fit(T(w, sz, colorOf(w)), (P ? 1.0 : 0.9));
  const toks = all.map((w, i) => small(w).moveTo(gPos(i)));
  await until(S(17)); await play(new M.LaggedStart(toks.map(t => new M.FadeIn(t)), { lagRatio: 0.03, runTime: 2 }), ...say('ALL 43 TOKENS FROM 6 REVIEWS'));
  const pileBase = P ? [-1.6, -6.2] : [-2.7], pitch = P ? 0.24 : 0.26;
  const pileN = {};
  const pilePos = w => { const j = VOC.indexOf(w), n = pileN[w] = (pileN[w] || 0) + 1; return [colX(j), pileBase[colRow(j)] + (n - 1) * pitch, 0]; };
  const firstOf = {}; all.forEach((w, i) => { if (firstOf[w] == null) firstOf[w] = i; });
  const order = all.map((w, i) => i);
  await until(S(18)); await play(new M.LaggedStart(order.map(i => new M.Transform(toks[i], small(all[i]).moveTo(pilePos(all[i])))), { lagRatio: 0.03, runTime: 2.4 }), ...say('MATCHING WORDS TOGETHER'));
  const dups = toks.filter((_, i) => firstOf[all[i]] !== i);
  await until(S(19)); await play(new M.FadeOut(new M.VGroup(...dups)), ...say('ONE COPY OF EACH WORD'));
  const vocT = VOC.map(w => toks[firstOf[w]]);
  const vT = (w, j) => fit(T(w, P ? 17 : 16, colorOf(w), false, true), BW).moveTo([colX(j), WORDY[colRow(j)], 0]);
  await until(S(20)); await play(new M.LaggedStart(vocT.map((t, j) => new M.Transform(t, vT(VOC[j], j))), { lagRatio: 0.06, runTime: 2 }), ...say('A → Z, LIKE A DICTIONARY'));
  for (const [i, from, to] of [[21, 0, 5], [22, 5, 10], [23, 10, 14]]) {
    await until(S(i)); await play(new M.LaggedStart(vocT.slice(from, to).map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.25, runTime: Math.max(1, E(i) - S(i)) }));
  }
  await until(S(24)); await play(...say('14 DIFFERENT WORDS', C.amber));
  await until(S(25)); await play(...say('THIS LIST = THE VOCABULARY', C.green));

  // ---- 26-37 fill boxes with review 4
  const bxs = VOC.map((_, j) => { const r = new M.RoundedRectangle({ width: BW, height: BH, cornerRadius: 0.1, color: C.muted, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo([colX(j), BOXY[colRow(j)], 0]); return r; });
  await until(S(26)); await play(new M.LaggedStart(bxs.map(b => new M.FadeIn(b)), { lagRatio: 0.06, runTime: 1.6 }), ...say('ONE EMPTY BOX PER WORD'));
  const TROW = P ? -6.45 : -1.25;
  const rTok = R4.map((w, j) => pill(w, colorOf(w), P ? 16 : 16).moveTo([(j - 2.5) * (P ? 1.28 : 1.5), TROW, 0]));
  const r4tag = T('R4', 16, C.muted, true, true).moveTo([(P ? -3.2 : -5.1), TROW + (P ? 0.6 : 0), 0]);
  await until(S(27)); await play(new M.FadeIn(r4tag), new M.LaggedStart(rTok.map(p => new M.FadeIn(p)), { lagRatio: 0.15, runTime: 1.2 }), ...say('REVIEW 4 IS BACK'));
  const inBox = (w, k) => { const j = VOC.indexOf(w); return [colX(j), BOXY[colRow(j)] + 0.4 - k * 0.4, 0]; };
  const boxPill = (w, k) => {
    const c = colorOf(w), r = new M.RoundedRectangle({ width: BW - 0.1, height: 0.32, cornerRadius: 0.16, color: c, strokeWidth: 2 });
    r.setFill(C.bg, 0.92);
    const t = fit(T(w, 15, c, false, true), BW - 0.2);
    const g = new M.VGroup(r, t); const p = inBox(w, k); r.moveTo(p); t.moveTo(p); return g;
  };
  const steps = [[28, 0, 'a', 0], [29, 1, 'boring', 0], [30, 2, 'book', 0], [31, 3, 'slow', 0], [32, 4, 'slow', 1], [33, 5, 'slow', 2]];
  for (const [i, j, w, k] of steps) {
    await until(S(i));
    await play(new M.Transform(rTok[j], boxPill(w, k), { pathArc: -0.5, runTime: 0.9 }), new M.Indicate(bxs[VOC.indexOf(w)], { color: colorOf(w) === C.ink ? C.cyan : colorOf(w), runTime: 0.9 }));
  }
  const cLab = (n, j) => T(String(n), P ? 18 : 18, n ? C.amber : C.muted, true, true).moveTo([colX(j), BOXY[colRow(j)] - BH / 2 - 0.25, 0]);
  const COUNTS = VOC.map(w => R4.filter(x => x === w).length); // 1 1 1 0 0 0 0 0 0 0 0 3 0 0
  const cl = COUNTS.map((n, j) => cLab(n, j));
  await until(S(34)); await play(new M.FadeOut(r4tag), ...say('COUNT THE TOKENS IN EACH BOX', C.amber));
  await until(S(35)); await play(...[0, 1, 2].map(j => new M.FadeIn(cl[j])), ...say('a, book, boring: 1 EACH', C.amber));
  await until(S(36)); await play(new M.FadeIn(cl[11]), new M.Indicate(bxs[11], { color: C.pink }), ...say('slow: 3', C.pink));
  const zeros = COUNTS.map((n, j) => j).filter(j => !COUNTS[j]);
  await until(S(37)); await play(new M.LaggedStart(zeros.map(j => new M.FadeIn(cl[j])), { lagRatio: 0.1, runTime: 1.6 }), ...say('EMPTY BOX = 0: WORD NOT IN THIS REVIEW', C.muted));

  // ---- 38-43 counts become a vector
  const inNum = (n, j) => T(String(n), P ? 26 : 28, n ? C.amber : C.muted, true, true).moveTo([colX(j), BOXY[colRow(j)], 0]);
  await until(S(38)); await play(new M.FadeOut(new M.VGroup(...rTok)), new M.LaggedStart(cl.map((c, j) => new M.Transform(c, inNum(COUNTS[j], j))), { lagRatio: 0.05, runTime: 1.6 }), ...say('TOKENS → COUNTS', C.amber));
  const vecStr = '[' + COUNTS.join(', ') + ']';
  await until(S(39)); await play(...fbox([[vecStr, C.amber]], C.amber), ...say('14 NUMBERS: ONE PER WORD'));
  await until(S(40)); await play(new M.LaggedStart(cl.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.3, runTime: Math.max(4, E(40) - S(40) - 0.5) }));
  await until(S(41)); await play(...fbox([[vecStr, C.amber], ['1 + 1 + 1 + 3 = 6 tokens', C.ink]], C.amber), ...say('COUNTS ADD UP TO 6', C.amber));
  await until(S(42)); await play(...say('NUMBERS IN A FIXED ORDER = A VECTOR', C.green));
  await until(S(43)); await play(...fbox([['R4 = ' + vecStr, C.amber], ['bag of words vector', C.green]], C.green), ...say('REVIEW 4 AS NUMBERS ONLY', C.green));

  // ---- 44-47 the rule
  await until(S(44)); await play(...say('THE RULE IN ONE LINE'));
  await until(S(45)); await play(...fbox([['count(word) =', C.ink], ['times the word is in the review', C.amber]]));
  const R2 = VOC.map(w => TOK[1].filter(x => x === w).length); // 1 1 0 0 0 0 0 0 1 0 1 2 1 0
  await until(S(46)); await play(...fbox([['R4 = [' + COUNTS.join(' ') + ']', C.amber], ['R2 = [' + R2.join(' ') + ']', C.cyan]]), ...say('EVERY WORD · EVERY REVIEW'));
  await until(S(47)); await play(new M.Indicate(bxs[11], { color: C.pink }), new M.Indicate(vocT[11], { color: C.pink }), ...say('COMPARE: slow 3 IN R4, 2 IN R2', C.pink));

  // ---- 48-54 the trap: word order is lost
  const R5 = TOK[4], R5b = 'a slow plot but a great ending'.split(' ');
  const C5 = VOC.map(w => R5.filter(x => x === w).length); // 2 0 0 1 1 1 0 0 0 0 1 1 0 0
  const C5b = VOC.map(w => R5b.filter(x => x === w).length);
  const tp = P ? [[0, -5.9, 0], [0, -6.65, 0]] : [[-3.5, -1.25, 0], [3.5, -1.25, 0]];
  const tw = P ? 7.4 : 6.6, th = P ? 0.62 : 0.68;
  const c5 = card('A great plot but a slow ending.', 'R5', tp[0], tw, th);
  const c5b = card('A slow plot but a great ending.', 'NEW', tp[1], tw, th, C.violet);
  const nums5 = C5.map((n, j) => inNum(n, j));
  await until(S(48)); await play(...clearBox(), new M.FadeIn(c5), ...cl.map((c, j) => new M.Transform(c, nums5[j])), ...say('REVIEW 5'));
  await until(S(49)); await play(new M.FadeIn(c5b), ...say('ANOTHER READER', C.violet));
  await until(S(50)); await play(new M.Indicate(c5, { color: C.cyan }), new M.Indicate(c5b, { color: C.violet }), ...say('DIFFERENT PLOT, DIFFERENT ENDING', C.violet));
  await until(S(51)); await play(new M.LaggedStart(VOC.map((_, j) => j).filter(j => C5[j]).map(j => new M.Indicate(cl[j], { color: C.amber })), { lagRatio: 0.2, runTime: 2 }), ...say('SAME WORDS, SAME COUNTS', C.amber));
  const VP = P ? [0, 1.7, 0] : [0, -2.35, 0];
  await until(S(52)); await play(...fbox([['R5  = [' + C5.join(' ') + ']', C.cyan], ['NEW = [' + C5b.join(' ') + ']', C.violet]], C.pink, VP), ...say('IDENTICAL VECTORS, DIFFERENT MEANING', C.pink));
  await until(S(53)); await play(...say('LIMIT: NO WORD ORDER', C.pink));
  await until(S(54)); await play(new M.LaggedStart(cl.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.08, runTime: 2 }), ...say('BAG OF WORDS = COUNT WORDS, DROP ORDER', C.green));
}

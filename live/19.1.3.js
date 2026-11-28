// 19.1.3 TF-IDF: rare words get more weight. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };

  // ---- formula box
  const BOXP = P ? [0, -5.0, 0] : [3.6, 0.3, 0];
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
    const maxw = P ? FW - 0.8 : 6.4; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---- reviews
  const REV = ['A great book, a great plot.', 'A slow book. The plot is slow.', 'I loved the ending. A great book.',
    'A boring book. Slow, slow, slow.', 'A great plot but a slow ending.', 'I loved this book. A great plot, a great idea.'];
  const TOK = REV.map(s => s.toLowerCase().replace(/[.,!]/g, '').split(' '));
  const card = (s, tag, p, w, h, c = C.cyan, size = P ? 15 : 16) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color: c, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const tg = T(tag, P ? 13 : 15, C.muted, true, true); tg.moveTo([p[0] - w / 2 + 0.35, p[1], 0]);
    const tx = fit(T(s, size, C.ink), w - 1.0); tx.moveTo([p[0] + 0.25, p[1], 0]);
    return new M.VGroup(r, tg, tx);
  };
  const CW = P ? 7.6 : 6.6, CH = P ? 0.6 : 0.5;
  const cpos = k => P ? [0, -3.0 - k * 0.7, 0] : [3.6, 1.05 - k * 0.6, 0];
  const cards = REV.map((s, k) => card(s, 'R' + (k + 1), cpos(k), CW, CH, C.cyan, P ? 16 : 16));
  // review card with one text per word (mono), so single words can be coloured in place
  const charW = sz => (T('00000000000000000000', sz, C.ink, true).getWidth() - T('0000000000', sz, C.ink, true).getWidth()) / 10;
  const wordCard = (s, tag, p, w, h) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const tg = T(tag, P ? 15 : 15, C.muted, true, true); tg.moveTo([p[0] - w / 2 + 0.35, p[1], 0]);
    const sz = Math.min(P ? 17 : 16, 15 * (w - 1.0) / (s.length * charW(15))), cw = charW(sz);
    const x0 = p[0] + 0.25 - s.length * cw / 2;
    const parts = [], words = []; let at = 0;
    s.split(' ').forEach(raw => {
      const core = raw.replace(/[.,!]/g, ''), pu = raw.slice(core.length);
      const t = T(core, sz, C.ink, true).moveTo([x0 + (at + core.length / 2) * cw, p[1], 0]);
      parts.push(t); words.push({ t, key: core.toLowerCase(), core, x: x0 + (at + core.length / 2) * cw, y: p[1], sz });
      if (pu) parts.push(T(pu, sz, C.ink, true).moveTo([x0 + (at + core.length + pu.length / 2) * cw, p[1], 0]));
      at += raw.length + 1;
    });
    const g = new M.VGroup(r, tg, ...parts); g.words = words; return g;
  };

  await until(S(0)); await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.6 }), ...say('FIND THE "boring" BOOKS', C.amber));
  await until(S(1)); await play(...say('WHICH WORDS MATTER MORE?', C.violet));
  const R4P = P ? [0, -4.3, 0] : [3.6, 0.3, 0];
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(...cards.filter((_, k) => k !== 3))), new M.Transform(cards[3], card(REV[3], 'R4', R4P, P ? 7.4 : 6.0, P ? 1.0 : 0.8, C.cyan, P ? 22 : 19)), ...say('REVIEW 4'));
  await until(S(3)); await play(new M.Indicate(cards[3], { color: C.amber }));

  // ---- 4-11 count bars
  const WORDS = ['a', 'book', 'boring', 'slow'];
  const COL = { a: C.muted, book: C.violet, boring: C.amber, slow: C.pink };
  const TF = WORDS.map(w => TOK[3].filter(x => x === w).length); // 1 1 1 3
  const DF = WORDS.map(w => TOK.filter(t => t.includes(w)).length); // 6 5 1 3
  const IDF = ['0', '0.26', '2.58', '1'], IDFN = [0, 0.26, 2.58, 1];
  const bx = j => P ? (j - 1.5) * 1.6 : -5.6 + j * 1.3;
  const BASE = P ? -1.3 : -1.7, U = P ? 1.0 : 0.75, BWD = P ? 1.1 : 0.85;
  const bar = (j, v) => { const h = Math.max(0.03, v * U); const r = new M.Rectangle({ width: BWD, height: h, color: COL[WORDS[j]], strokeWidth: 2 }); r.setFill(COL[WORDS[j]], 0.75); r.moveTo([bx(j), BASE + h / 2, 0]); return r; };
  const vlab = (j, s, v) => T(s, P ? 19 : 18, COL[WORDS[j]], true, true).moveTo([bx(j), BASE + Math.max(0.03, v * U) + 0.25, 0]);
  const floor = new M.Line({ start: [bx(0) - 0.75, BASE, 0], end: [bx(3) + 0.75, BASE, 0], color: C.muted, strokeWidth: 2 });
  const wl = WORDS.map((w, j) => T(w, P ? 19 : 18, COL[w], false, true).moveTo([bx(j), BASE - 0.3, 0]));
  await until(S(4)); await play(new M.Create(floor), ...wl.map(t => new M.FadeIn(t)), ...say('A BAR FOR EACH WORD'));
  const bars = [], vals = [];
  for (let j = 0; j < 4; j++) {
    await until(S(5 + j));
    bars[j] = bar(j, TF[j]); vals[j] = vlab(j, String(TF[j]), TF[j]);
    await play(new M.FadeIn(bars[j], { shift: [0, 0.3, 0] }), new M.FadeIn(vals[j]), ...say(`${WORDS[j]}: ${TF[j] === 1 ? 'ONCE' : '3 TIMES'}`, COL[WORDS[j]] === C.muted ? C.cyan : COL[WORDS[j]]));
  }
  await until(S(9)); await play(...[0, 1, 2].map(j => new M.Indicate(bars[j], { color: C.ink })), ...say('THREE BARS OF HEIGHT 1'));
  await until(S(10)); await play(...say('a = book = boring = 1'));
  await until(S(11)); await play(...say('EQUALLY USEFUL?', C.violet));

  // ---- 12-18 document frequency
  const cards2 = REV.map((s, k) => wordCard(s, 'R' + (k + 1), cpos(k), CW, CH));
  await until(S(12)); await play(new M.FadeOut(cards[3]), new M.LaggedStart(cards2.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.4 }), ...say('ALL 6 REVIEWS SIDE BY SIDE'));
  const dfl = WORDS.map((w, j) => T(`in ${DF[j]}`, P ? 16 : 15, C.ink, true).moveTo([bx(j), BASE - (P ? 0.7 : 0.62), 0]));
  const marks = [];
  // colour the word itself inside every review that contains it (coloured copy on top of the word)
  const hit = (w, col, rt = 1.6) => {
    const os = cards2.flatMap(c => c.words.filter(o => o.key === w));
    const ms = os.map(o => T(o.core, o.sz, col, true, true).moveTo([o.x, o.y, 0]));
    marks.push(...ms);
    return [new M.FadeOut(new M.VGroup(...os.map(o => o.t)), { runTime: 0.4 }), new M.LaggedStart(ms.map(m => new M.FadeIn(m, { scale: 1.6 })), { lagRatio: 0.12, runTime: rt })];
  };
  await until(S(13)); await play(...hit('a', C.cyan, 1.8), ...say('HIGHLIGHT a', C.cyan));
  await until(S(14)); await play(new M.FadeIn(dfl[0]), ...say('a: IN 6 OF 6 REVIEWS', C.cyan));
  await until(S(15)); await play(...hit('book', C.violet), new M.FadeIn(dfl[1]), ...say('book: IN 5 OF 6', C.violet));
  await until(S(16)); await play(...hit('slow', C.pink, 1.2), new M.FadeIn(dfl[3]), ...say('slow: IN 3 OF 6', C.pink));
  await until(S(17)); await play(...hit('boring', C.amber, 1.0), new M.FadeIn(dfl[2]), ...say('boring: IN ONLY 1', C.amber));
  await until(S(18)); await play(new M.Indicate(cards2[3], { color: C.amber }), new M.Indicate(bars[2], { color: C.amber }), ...say('boring POINTS TO REVIEW 4', C.amber));

  // ---- 19-28 weight from document frequency
  await until(S(19)); await play(...say('A NUMBER FOR "HOW MUCH ATTENTION"'));
  await until(S(20)); await play(...say('THIS NUMBER = THE IDF SCORE', C.green));
  await until(S(21)); await play(...say('FEWER REVIEWS → LARGER IDF SCORE', C.green));
  await until(S(22)); await play(new M.FadeOut(new M.VGroup(...cards2, ...marks)), ...say('HOW TO FIND THE IDF SCORE', C.violet));
  await until(S(23)); await play(new M.LaggedStart(dfl.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.2, runTime: 1.4 }), ...say('COUNT THE REVIEWS WITH THE WORD', C.amber));
  await until(S(24)); await play(...fbox([['document frequency = df', C.amber], ['1 review = 1 document', C.ink]], C.amber), ...say('DOCUMENT FREQUENCY = df', C.amber));
  await until(S(25)); await play(...fbox(['6 reviews ÷ df', ['a:      6 ÷ 6', C.muted]]));
  await until(S(26)); await play(...fbox(['6 reviews ÷ df', ['a:      6 ÷ 6 = 1', C.muted]]));
  await until(S(27)); await play(...fbox(['6 reviews ÷ df', ['a:      6 ÷ 6 = 1', C.muted], ['slow:   6 ÷ 3 = 2', C.pink]]));
  await until(S(28)); await play(...fbox(['6 reviews ÷ df', ['a:      6 ÷ 6 = 1', C.muted], ['slow:   6 ÷ 3 = 2', C.pink], ['boring: 6 ÷ 1 = 6', C.amber]]));
  await until(S(29)); await play(...say('MANY REVIEWS → VERY LARGE NUMBERS', C.violet));

  // ---- 30-35 counting doublings on a number line
  const NY = P ? -5.0 : -2.1, NX0 = P ? -3.4 : 0.7, NW = P ? 6.8 : 6.0;
  const nx = v => NX0 + (v - 1) / 7 * NW;
  const nline = new M.Line({ start: [nx(1) - 0.2, NY, 0], end: [nx(8) + 0.2, NY, 0], color: C.muted, strokeWidth: 3 });
  const nt = [1, 2, 4, 6, 8].map(v => T(String(v), P ? 20 : 17, v === 6 ? C.amber : C.ink, true).moveTo([nx(v), NY - 0.32, 0]));
  const ndots = [1, 2, 4, 8].map(v => new M.Dot({ point: [nx(v), NY, 0], radius: 0.08, color: C.cyan }));
  const hop = (a, b) => { const r = (nx(b) - nx(a)) / 2; const h = new M.Arc({ radius: r, startAngle: 0, angle: Math.PI, color: C.cyan, strokeWidth: 3 }); h.moveTo([(nx(a) + nx(b)) / 2, NY + r / 2, 0]); return h; };
  const hl = (v, s, up) => T(s, P ? 17 : 15, C.cyan, true).moveTo([v, NY + up + 0.25, 0]);
  await until(S(30)); await play(...clearBox(), new M.Create(nline), ...nt.filter((_, i) => i !== 3).map(t => new M.FadeIn(t)), ...say('COUNT HOW MANY TIMES WE DOUBLE', C.cyan));
  const z = T('0 doublings', P ? 17 : 15, C.cyan, true).moveTo([nx(1), NY + 0.4, 0]);
  await until(S(31)); await play(new M.FadeIn(ndots[0]), new M.FadeIn(z), ...say('1: NO DOUBLINGS'));
  const h1 = hop(1, 2), h2 = hop(2, 4), h3 = hop(4, 8);
  const l1 = hl((nx(1) + nx(2)) / 2, '×2', (nx(2) - nx(1)) / 2), l2 = hl((nx(2) + nx(4)) / 2, '×2', (nx(4) - nx(2)) / 2), l3 = hl((nx(4) + nx(8)) / 2, '×2', (nx(8) - nx(4)) / 2);
  await until(S(32)); await play(new M.FadeOut(z), new M.Create(h1), new M.FadeIn(l1), new M.FadeIn(ndots[1]), ...say('2: ONE DOUBLING'));
  await until(S(33)); await play(new M.Create(h2), new M.FadeIn(l2), new M.FadeIn(ndots[2]), ...say('4: TWO DOUBLINGS'));
  await play(new M.Create(h3), new M.FadeIn(l3), new M.FadeIn(ndots[3]), ...say('8: THREE DOUBLINGS'));
  const six = new M.Dot({ point: [nx(6), NY, 0], radius: 0.13, color: C.amber });
  await until(S(34)); await play(new M.FadeIn(six), new M.FadeIn(nt[3]), new M.Flash(six, { color: C.amber }), ...say('6: BETWEEN 2 AND 3 DOUBLINGS', C.amber));
  const FB2 = P ? [0, -6.3, 0] : [3.6, 1.0, 0];
  await until(S(35)); await play(...fbox([['log₂ = number of doublings', C.ink], ['log₂ 6 ≈ 2.58', C.amber]], C.amber, FB2), ...say('REMEMBER: BASE-2 LOGARITHM, log₂', C.amber));

  // ---- 36-40 the IDF scores
  const wlab = WORDS.map((w, j) => T(`IDF ${IDF[j]}`, P ? 16 : 15, C.green, true, true).moveTo([bx(j), BASE - (P ? 1.1 : 0.95), 0]));
  const idfOrder = [[36, 0], [37, 1], [38, 3], [39, 2]];
  const wtext = ['IDF SCORE FOR a: 0', 'IDF SCORE FOR book: ABOUT 0.26', 'IDF SCORE FOR slow: 1', 'IDF SCORE FOR boring: ABOUT 2.58'];
  for (const [i, j] of idfOrder) {
    await until(S(i));
    const extra = i === 36 ? [new M.FadeOut(new M.VGroup(nline, ...nt, ...ndots, six, h1, h2, h3, l1, l2, l3)), ...fbox([['IDF = log₂(6 ÷ df)', C.green]], C.green)] : [];
    await play(new M.FadeIn(wlab[j]), new M.Indicate(wl[j], { color: C.green }), ...extra, ...say(wtext[i - 36], C.green));
  }
  await until(S(40)); await play(...fbox([['IDF = log₂(6 ÷ df)', C.green], ['a 0 · book 0.26', C.ink], ['slow 1 · boring 2.58', C.ink]], C.green), ...say('IDF = INVERSE DOCUMENT FREQUENCY', C.green));

  // ---- 41-48 multiply
  await until(S(41)); await play(new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.ink })), { lagRatio: 0.15, runTime: 1.4 }), ...say('BACK TO THE COUNTS IN REVIEW 4'));
  await until(S(42)); await play(new M.LaggedStart(vals.map(v => new M.Indicate(v, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.4 }), ...say('COUNT IN ONE REVIEW = TERM FREQUENCY (TF)'));
  await until(S(43)); await play(...fbox([['TF × IDF', C.amber]], C.amber), ...say('MULTIPLY: COUNT × IDF SCORE', C.amber));
  const lines = [];
  const mult = [[44, 0, 'a:      1 × 0    = 0'], [45, 1, 'book:   1 × 0.26 = 0.26'], [46, 2, 'boring: 1 × 2.58 = 2.58'], [47, 3, 'slow:   3 × 1    = 3']];
  const NEW = ['0', '0.26', '2.58', '3'];
  for (const [i, j, s] of mult) {
    await until(S(i));
    lines.push([s, COL[WORDS[j]] === C.muted ? C.ink : COL[WORDS[j]]]);
    const v = TF[j] * IDFN[j];
    await play(new M.Transform(bars[j], bar(j, v)), new M.FadeOut(vals[j]), new M.FadeIn(vals[j] = vlab(j, NEW[j], v)), ...fbox(lines, C.amber));
  }
  await until(S(48)); await play(new M.Indicate(bars[3], { color: C.pink }), new M.Indicate(bars[2], { color: C.amber }), ...say('slow AND boring NOW STAND TALLEST', C.amber));
  await until(S(49)); await play(...say('THIS IS TF-IDF', C.green));
  await until(S(50)); await play(...fbox([['TF-IDF = TF × IDF', C.green], ['count × IDF score', C.ink]], C.green), ...say('TERM FREQUENCY × INVERSE DOCUMENT FREQUENCY', C.green));
  await until(S(51)); await play(...say('SEARCH TOOLS USE THESE NUMBERS'));

  // ---- 52-54 the trap
  const typo = pill('boirng', C.pink, P ? 26 : 22).moveTo(P ? [0, -3.4, 0] : [3.6, -1.4, 0]);
  await until(S(52)); await play(new M.FadeIn(typo), ...say('A SPELLING MISTAKE IN ONLY 1 REVIEW', C.pink));
  await until(S(53)); await play(...fbox([['boirng: df = 1', C.pink], ['IDF = log₂(6 ÷ 1) ≈ 2.58', C.pink]], C.pink), new M.Indicate(typo, { color: C.pink }), ...say('RARE IS NOT ALWAYS USEFUL', C.pink));
  await until(S(54)); await play(new M.FadeOut(typo), ...fbox([['TF-IDF = TF × IDF', C.green], ['often in one review,', C.ink], ['rare across reviews', C.ink]], C.green), new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.15, runTime: 1.6 }), ...say('OFTEN HERE + RARE ELSEWHERE = HIGH', C.green));
}

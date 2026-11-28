// 21.1.8 Reranking: a careful reader puts the few candidates in the best order.
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Data: chapters/21.1.md (21.1.4, 21.1.7, 21.1.8).
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const TOPIC = { 1: 'Opening hours', 2: 'Borrowing', 3: 'Renewals', 4: 'Late fees', 5: 'Rooms and printing', 6: 'Holidays' };
  const FUS = [[2, 1.33, '1'], [4, 1, '2'], [3, 0.5, '3'], [1, 0.5, '3']];   // fusion top 4 (pages 3 and 1 tied)
  const READ = { 2: 0.2, 4: 0.9, 3: 0.4, 1: 0.1 };                              // cross-encoder scores
  const NEW = [4, 3, 2, 1];
  const pc = n => n === 4 ? C.amber : n === 5 ? C.cyan : C.ink;

  const CX = P ? 0 : -3.1;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -0.3, 0];
  const RANKX = P ? -3.75 : -6.75, CARDX = P ? -2.3 : -5.2, CW = P ? 2.2 : 2.4, CH = 0.6;
  const BARX = P ? -1.0 : -3.75, BARL = P ? 3.0 : 3.4, BH = 0.34;
  const rowY = r => (P ? 0.3 : 0.45) - r * (P ? 1.1 : 0.75);
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const out = (...objs) => new M.FadeOut(new M.VGroup(...objs));

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
  const boxOut = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // a page card ("4 · Late fees"), a small numbered card, a score bar with its number
  function card(n, x, y, w = CW, label = `${n} · ${TOPIC[n]}`, color = pc(n)) {
    const r = new M.RoundedRectangle({ width: w, height: CH, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(color, 0.14); r.moveTo([x, y, 0]);
    const t = fit(T(label, P ? 16 : 17, color, false, true), w - 0.25); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  function mini(n, x, y, w = 0.42, color = pc(n)) {
    const r = new M.RoundedRectangle({ width: w, height: w * 1.3, cornerRadius: 0.07, color, strokeWidth: 2 });
    r.setFill(color, 0.16); r.moveTo([x, y, 0]);
    const t = T(String(n), w < 0.45 ? 14 : 17, color, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  function bar(score, label, y, color, scale = 1) {
    const w = Math.max(0.04, score * scale * BARL);
    const b = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo([BARX + w / 2, y, 0]);
    const t = T(label, 18, color, true); t.moveTo([BARX + w + 0.4, y, 0]);
    return [b, t];
  }

  // 0-1 the question that fooled fusion
  const qs = P ? ['“What happens if I bring a novel', 'back after the deadline?”'] : ['“What happens if I bring a novel back after the deadline?”'];
  const question = qs.map((s, i) => fit(T(s, P ? 20 : 22, C.violet), P ? FW - 0.8 : 7.0).moveTo([CX, (P ? 1.55 : 1.2) - i * 0.42, 0]));
  await until(S(0)); await play(new M.LaggedStart(question.map(q => new M.FadeIn(q)), { lagRatio: 0.3, runTime: 1.2 }), ...say('THE QUESTION THAT FOOLED FUSION', C.pink));
  await until(S(1)); await play(...question.map(q => new M.Indicate(q, { color: C.violet })));

  // 2-3 the fusion top 4
  let ranks = FUS.map(([, , r], i) => T(r, 20, C.muted, true, true).moveTo([RANKX, rowY(i), 0]));
  const cards = {}, bars = {};
  FUS.forEach(([n, f], i) => { cards[n] = card(n, CARDX, rowY(i)); bars[n] = bar(f, String(f), rowY(i), C.muted, 1 / 1.4); });
  await until(S(2));
  await play(new M.LaggedStart(FUS.flatMap(([n], i) => [ranks[i], cards[n], ...bars[n]].map(x => new M.FadeIn(x))), { lagRatio: 0.3, runTime: Math.max(3, E(2) - S(2) - 1) }),
    ...say('AFTER FUSION: THE TOP 4', C.muted));
  await until(S(3)); await play(new M.Indicate(cards[4], { color: C.amber }), ...say('RIGHT PAGE, BUT ONLY 2ND', C.amber));

  // 4-7 both searches: page and question each computed alone, met only as one score
  await until(S(4)); await play(out(...ranks, ...FUS.flatMap(([n]) => [cards[n], ...bars[n]])), ...say('BOTH SEARCHES: THE SAME WAY', C.muted));
  const LX = P ? 2.2 : -1.0, LW = P ? 2.9 : 2.6, PY = P ? 0.3 : 0.35, QY = P ? -3.0 : -2.15, MY = (PY + QY) / 2;
  const AX0 = CARDX + CW / 2 + 0.15, AX1 = LX - LW / 2 - 0.12;
  const pCard = card(4, CARDX, PY);
  const pArrow = new M.Arrow({ start: [AX0, PY, 0], end: [AX1, PY, 0], color: C.muted });
  const pLab = [fit(T('arrow (0.8, 0.6)', 18, C.amber, true), LW).moveTo([LX, PY + 0.24, 0]),
    fit(T('words: late 3, fee 2', 18, C.ink, true), LW).moveTo([LX, PY - 0.24, 0])];
  await until(S(5)); await play(new M.FadeIn(pCard), new M.Create(pArrow), new M.FadeIn(pLab[0]), new M.FadeIn(pLab[1]), ...say('EACH PAGE: ALONE, BEFORE ANY QUESTION', C.amber));
  const qCard = card(0, CARDX, QY, CW, 'the question', C.violet);
  const qArrow = new M.Arrow({ start: [AX0, QY, 0], end: [AX1, QY, 0], color: C.muted });
  const qLab = [fit(T('arrow (0.6, 0.8)', 18, C.violet, true), LW).moveTo([LX, QY + 0.24, 0]),
    fit(T('words: bring, novel, ...', 18, C.ink, true), LW).moveTo([LX, QY - 0.24, 0])];
  await until(S(6)); await play(new M.FadeIn(qCard), new M.Create(qArrow), new M.FadeIn(qLab[0]), new M.FadeIn(qLab[1]), ...say('THE QUESTION: ALONE TOO', C.violet));
  const pLine = new M.Line({ start: [LX, PY - 0.48, 0], end: [LX, MY + 0.3, 0], color: C.green, strokeWidth: 2 });
  const qLine = new M.Line({ start: [LX, QY + 0.48, 0], end: [LX, MY - 0.3, 0], color: C.green, strokeWidth: 2 });
  const score = T('one score: 0.96', 18, C.green, true, true).moveTo([LX, MY, 0]);
  await until(S(6) + 2.6); await play(new M.Create(pLine), new M.Create(qLine), new M.FadeIn(score), ...say('MET ONLY AT THE END: ONE SCORE', C.green));
  const X = [new M.Line({ start: [CARDX - 0.3, MY - 0.3, 0], end: [CARDX + 0.3, MY + 0.3, 0], color: C.pink, strokeWidth: 5 }),
    new M.Line({ start: [CARDX - 0.3, MY + 0.3, 0], end: [CARDX + 0.3, MY - 0.3, 0], color: C.pink, strokeWidth: 5 })];
  await until(S(7)); await play(new M.Create(X[0]), new M.Create(X[1]), ...say('NEVER READ SIDE BY SIDE', C.pink));

  // 8 a librarian picks four pages off the shelf
  const SHY = P ? -1.0 : -0.6, SHS = P ? 1.05 : 0.85;
  const shelf = [1, 2, 3, 4, 5, 6].map(n => mini(n, CX + (n - 3.5) * SHS, SHY, 0.55));
  const shelfLine = new M.Line({ start: [CX - 3 * SHS - 0.2, SHY - 0.42, 0], end: [CX + 3 * SHS + 0.2, SHY - 0.42, 0], color: C.muted, strokeWidth: 3 });
  await until(S(8));
  await play(out(pCard, pArrow, ...pLab, qCard, qArrow, ...qLab, pLine, qLine, score, ...X), new M.Create(shelfLine),
    new M.LaggedStart(shelf.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }), ...say('A LIBRARIAN PICKS 4 PAGES', C.cyan));
  await until(S(8) + 2.6);
  await play(new M.LaggedStart([2, 4, 3, 1].map(n => new M.Indicate(shelf[n - 1], { color: C.violet })), { lagRatio: 0.4, runTime: 2.2 }), ...say('READS EACH ONE WITH THE QUESTION', C.violet));

  // 9 back to the four candidates
  ranks = FUS.map(([, , r], i) => T(r, 20, C.muted, true, true).moveTo([RANKX, rowY(i), 0]));
  FUS.forEach(([n], i) => { cards[n] = card(n, CARDX, rowY(i)); });
  await until(S(9));
  await play(out(...shelf, shelfLine), new M.LaggedStart(FUS.flatMap(([n], i) => [new M.FadeIn(ranks[i]), new M.FadeIn(cards[n])]), { lagRatio: 0.25, runTime: 1.0 }), ...say("LET'S DO THAT", C.green));

  // 10-12 the model: question + page as one text, one number from 0 to 1
  await until(S(10)); await play(new M.Indicate(cards[2], { color: C.violet }), ...fbox(['one text:', ['the question', C.violet], ['+ page 2', C.ink]], C.violet), ...say('QUESTION + PAGE 2 TOGETHER', C.violet));
  await until(S(11)); await play(...fbox(['the model reads both', ['→ one number:', C.green], ['how well it answers', C.green]], C.green), ...say('TRAINED FOR ONE JOB', C.green));
  const AXY = rowY(3) - CH / 2 - 0.3;
  const axis = new M.Line({ start: [BARX, AXY, 0], end: [BARX + BARL, AXY, 0], color: C.muted, strokeWidth: 2 });
  const axT = [0, 1].map(v => new M.Line({ start: [BARX + v * BARL, AXY - 0.07, 0], end: [BARX + v * BARL, AXY + 0.07, 0], color: C.muted }));
  const axL = [['0 useless', 0], ['1 perfect', 1]].map(([s, v]) => T(s, 16, C.muted, true).moveTo([BARX + v * BARL, AXY - 0.32, 0]));
  await until(S(12)); await play(new M.Create(axis), new M.FadeIn(new M.VGroup(...axT, ...axL)), ...say('0 = USELESS · 1 = PERFECT', C.muted));

  // 13-16 one pair at a time: the new score
  const WHY = { 2: ['page 2 · borrowing', 'a card, not lateness'], 4: ['page 4 · late fees', 'late return costs a fee'],
    3: ['page 3 · renewals', 'mentions the due date'], 1: ['page 1 · opening hours', null] };
  for (let i = 0; i < 4; i++) {
    const n = FUS[i][0], col = n === 4 ? C.amber : C.cyan, [a, b] = WHY[n];
    await until(S(13 + i));
    bars[n] = bar(READ[n], String(READ[n]), rowY(i), col);
    await play(new M.Create(bars[n][0]), new M.FadeIn(bars[n][1]), new M.Indicate(cards[n], { color: C.violet }),
      ...fbox([a, ...(b ? [b] : []), [`score = ${READ[n]}`, col]], col));
  }

  // 17-18 sort by the new numbers
  await until(S(17));
  const moves = [], nr = NEW.map((n, i) => T(String(i + 1), 20, C.ink, true, true).moveTo([RANKX, rowY(i), 0]));
  FUS.forEach(([n], a) => {
    const b = NEW.indexOf(n); if (a === b) return;
    const d = { shift: [0, (rowY(b) - rowY(a)) / 2, 0], runTime: 1.4 }, col = n === 4 ? C.amber : C.cyan;
    const c2 = card(n, CARDX, rowY(b)), b2 = bar(READ[n], String(READ[n]), rowY(b), col);
    moves.push(new M.FadeOut(cards[n], d), ...bars[n].map(x => new M.FadeOut(x, d)), new M.FadeIn(c2, d), ...b2.map(x => new M.FadeIn(x, d)));
    cards[n] = c2; bars[n] = b2;
  });
  await play(...moves, out(...ranks), ...nr.map(r => new M.FadeIn(r)),
    ...fbox(['0.9 > 0.4 > 0.2 > 0.1', ['page 4, 3, 2, 1', C.amber]], C.amber), ...say('SORT BY THE NEW NUMBERS', C.amber));
  ranks = nr;
  await until(S(18)); await play(new M.Indicate(cards[4], { color: C.amber }), new M.Indicate(ranks[0], { color: C.amber }), ...say('PAGE 4 IS NOW FIRST', C.amber));

  // 19-21 the names: reranking, candidate, cross-encoder
  await until(S(19)); await play(new M.LaggedStart(ranks.map(r => new M.Indicate(r, { color: C.green })), { lagRatio: 0.3, runTime: 1.6 }), ...say('RERANKING = A SHORT LIST, NEW ORDER', C.green));
  const ring = new M.RoundedRectangle({ width: CW + 0.22, height: rowY(0) - rowY(3) + CH + 0.22, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  ring.moveTo([CARDX, (rowY(0) + rowY(3)) / 2, 0]);
  await until(S(20)); await play(new M.Create(ring), ...say('CANDIDATE = A PAGE KEPT FOR A CLOSER LOOK', C.cyan));
  await until(S(21)); await play(new M.FadeOut(ring), ...fbox(['cross-encoder =', 'reads question + page', ['together → one score', C.green]], C.green), ...say('CROSS-ENCODER', C.green));

  // 22-23 cross: every question word looks at every page word
  const QW = ['bring', 'novel', 'back', 'after', 'deadline'], PW = ['late', 'book', 'costs', 'cents', 'fee'];
  const wx = i => CX + (i - 2) * (P ? 1.5 : 1.35), WT = P ? 0.3 : 0.35, WB = P ? -3.0 : -2.1;
  const qw = QW.map((w, i) => T(w, 18, C.violet, true, true).moveTo([wx(i), WT, 0]));
  const pw = PW.map((w, i) => T(w, 18, C.amber, true, true).moveTo([wx(i), WB, 0]));
  const tags = [T('question', 15, C.muted).moveTo([CX, WT + 0.42, 0]), T('page 4', 15, C.muted).moveTo([CX, WB - 0.42, 0])];
  const links = [];
  QW.forEach((_, i) => PW.forEach((_, j) => links.push(new M.Line({ start: [wx(i), WT - 0.22, 0], end: [wx(j), WB + 0.22, 0], color: C.muted, strokeWidth: 1.5 }))));
  await until(S(22));
  await play(out(...ranks, ...NEW.flatMap(n => [cards[n], ...bars[n]]), axis, ...axT, ...axL),
    new M.LaggedStart([...qw, ...pw, ...tags].map(w => new M.FadeIn(w)), { lagRatio: 0.1, runTime: 1.2 }), ...say('CROSS: EVERY WORD LOOKS AT EVERY WORD', C.violet));
  await play(new M.LaggedStart(links.map(l => new M.Create(l)), { lagRatio: 0.08, runTime: 2.4 }));
  const strong = [[2, 0], [3, 0], [4, 0], [4, 4]].map(([i, j]) => links[i * 5 + j]);
  await until(S(23));
  strong.forEach(l => l.setColor(C.amber));
  await play(new M.LaggedStart(strong.map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.3, runTime: 1.6 }), ...say('ATTENTION (UNIT 19), ACROSS BOTH', C.amber));

  // 24-26 why not on every page: each pair read fresh, nothing in advance
  const PXS = P ? 1.2 : 0.95, QBY = P ? 0.1 : 0.3, PBY = P ? -0.85 : -0.6;
  const qb = [], pb = [];
  for (let n = 1; n <= 6; n++) { const x = CX + (n - 3.5) * PXS; qb.push(mini('Q', x, QBY, 0.5, C.violet)); pb.push(mini(n, x, PBY, 0.5)); }
  await until(S(24)); await play(out(...qw, ...pw, ...tags, ...links), ...boxOut(), new M.LaggedStart(pb.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }), ...say('WHY NOT ON EVERY PAGE?', C.violet));
  await until(S(25));
  await play(new M.LaggedStart(qb.map(q => new M.FadeIn(q)), { lagRatio: 0.2, runTime: 1.6 }), ...say('SLOW: EACH PAIR READ FRESH', C.pink));
  await until(S(25) + 2.6);
  await play(new M.LaggedStart(pb.map(p => new M.Indicate(p, { color: C.violet })), { lagRatio: 0.3, runTime: 2.0 }), ...fbox(['new question?', ['read every pair again', C.pink]], C.pink));
  await until(S(26));
  await play(new M.LaggedStart(qb.map(q => new M.Indicate(q, { color: C.violet })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['computed in advance:', ['nothing; the question', C.pink], ['is part of what it reads', C.pink]], C.pink), ...say('NOTHING IN ADVANCE', C.pink));

  // 27-28 1,200 slow reads, or only 4
  const GX = P ? 0.6 : 0.5, GY = P ? 0.32 : 0.24, GT = P ? 0.4 : 0.45;
  const grid = [];
  for (let r = 0; r < 12; r++) for (let c = 0; c < 10; c++) {
    const b = new M.Rectangle({ width: GX * 0.8, height: GY * 0.75, color: C.pink, strokeWidth: 1 }); b.setFill(C.pink, 0.55);
    b.moveTo([CX + (c - 4.5) * GX, GT - r * GY, 0]); grid.push(b);
  }
  await until(S(27));
  await play(out(...qb, ...pb), new M.LaggedStart(grid.map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 2.2 }),
    ...fbox(['1 square = 10 passages', ['1,200 slow reads', C.pink], 'per question'], C.pink), ...say('ARCHIVE: 1,200 PASSAGES', C.muted));
  const four = NEW.map((n, i) => mini(n, CX + (i - 1.5) * (P ? 1.2 : 1.0), P ? -1.2 : -0.8, 0.55));
  await until(S(28));
  await play(out(...grid), new M.LaggedStart(four.map(b => new M.FadeIn(b)), { lagRatio: 0.25, runTime: 1.2 }),
    ...fbox(['with reranking:', ['4 slow reads', C.green], 'per question'], C.green), ...say('ONLY 4', C.green));

  // 29-33 the two stages
  const S1Y = P ? 0.5 : 0.45, S2Y = P ? -2.2 : -1.75;
  function stage(y, a, b, color) {
    const r = new M.RoundedRectangle({ width: 2.0, height: 0.9, cornerRadius: 0.14, color, strokeWidth: 2 }); r.setFill(color, 0.1); r.moveTo([CX, y, 0]);
    return [r, T(a, 17, color, true, true).moveTo([CX, y + 0.18, 0]), fit(T(b, 16, C.ink), 1.8).moveTo([CX, y - 0.2, 0])];
  }
  const st1 = stage(S1Y, 'STAGE 1', 'fast search', C.cyan), st2 = stage(S2Y, 'STAGE 2', 'careful reader', C.green);
  await until(S(29));
  await play(out(...four, ...question), ...boxOut(), ...[...st1, ...st2].map(x => new M.FadeIn(x)), ...say('TWO STAGES', C.cyan));

  const arch = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const b = new M.Rectangle({ width: 0.15, height: 0.15, color: C.muted, strokeWidth: 1 }); b.setFill(C.muted, 0.6);
    b.moveTo([CX - 2.7 + (c - 2.5) * 0.2, S1Y + 0.2 - r * 0.2, 0]); arch.push(b);
  }
  const archL = T('1,200', 18, C.ink, true).moveTo([CX - 2.7, S1Y - 0.52, 0]);
  const arrow = (x0, x1, y) => new M.Arrow({ start: [CX + x0, y, 0], end: [CX + x1, y, 0], color: C.muted });
  const a1 = [arrow(-1.8, -1.05, S1Y), arrow(1.05, 1.7, S1Y)], a2 = [arrow(-1.8, -1.05, S2Y), arrow(1.05, 1.7, S2Y)];
  const row4 = (order, x, y) => order.map((n, i) => mini(n, CX + x + (i - 1.5) * 0.44, y, 0.36));
  const s1o = row4(FUS.map(f => f[0]), 2.6, S1Y), s2i = row4(FUS.map(f => f[0]), -2.7, S2Y), s2o = row4(NEW, 2.6, S2Y);
  await until(S(30));
  await play(new M.LaggedStart([...arch, archL].map(x => new M.FadeIn(x)), { lagRatio: 0.05, runTime: 0.9 }), ...a1.map(a => new M.Create(a)),
    new M.LaggedStart(s1o.map(x => new M.FadeIn(x)), { lagRatio: 0.3, runTime: 1.4 }), ...say('STAGE 1: FAST, MANY → FEW', C.cyan));
  const link = new M.DashedLine({ start: [CX + 2.6, S1Y - 0.42, 0], end: [CX - 2.7, S2Y + 0.42, 0], color: C.muted });
  await until(S(31));
  await play(new M.LaggedStart([new M.Create(link), ...s2i.map(x => new M.FadeIn(x)), ...a2.map(a => new M.Create(a)), ...s2o.map(x => new M.FadeIn(x))], { lagRatio: 0.4, runTime: 3.0 }),
    ...say('STAGE 2: SLOW, CAREFUL, BEST ORDER', C.green));
  await until(S(32));
  await play(new M.LaggedStart(s2o.map(x => new M.Indicate(x, { color: C.green })), { lagRatio: 0.3, runTime: 1.8 }),
    ...fbox(['final order =', 'candidates sorted by', ['cross-encoder score', C.green]], C.green));
  await until(S(33)); await play(new M.Indicate(s2o[0], { color: C.amber }), ...say('BEST PAGE FIRST → ANSWER BUILT ON IT', C.amber));

  // 34-36 the trap: reranking only reorders what stage 1 found
  await until(S(34));
  await play(...boxOut(), new M.LaggedStart(s1o.map(x => new M.Indicate(x, { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }), ...say('TRAP: IT ONLY REORDERS WHAT STAGE 1 FOUND', C.pink));
  const gone = [s1o[1], s2i[1], s2o[0]];
  const holes = gone.map(g => { const r = new M.Rectangle({ width: 0.36, height: 0.47, color: C.pink, strokeWidth: 2 }); r.moveTo(g.getCenter()); return r; });
  await until(S(35)); await play(...gone.map(g => new M.FadeOut(g)), ...holes.map(r => new M.Create(r)), ...say('RIGHT PAGE MISSING: NO WAY BACK', C.pink));
  const back = holes.map(r => { const c = r.getCenter(); return mini(4, c[0], c[1], 0.36); });
  s2o[0] = back[2];
  await until(S(36));
  await play(out(...holes), ...back.map(b => new M.FadeIn(b)), new M.Indicate(st1[0], { color: C.green }),
    ...fbox(['stage 1 must keep', ['enough candidates', C.green], ['with good recall', C.green]], C.green), ...say('KEEP ENOUGH · GOOD RECALL', C.green));

  // 37 in one sentence
  await until(S(37));
  await play(new M.LaggedStart(s2o.map(x => new M.Indicate(x, { color: C.green })), { lagRatio: 0.3, runTime: 1.8 }), ...say('RERANK: QUESTION + EACH CANDIDATE, BEST FIRST', C.green));
}

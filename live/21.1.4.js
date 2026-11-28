// 21.1.4 Dense retrieval: arrows of meaning (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, T, pill, showA, S, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 1.3, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.0, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const Q = C.green; // the question's colour

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent. On a phone the box hangs from y = 4.3.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const c = [BOXP[0], P ? 4.3 - ht / 2 : BOXP[1], 0];
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(c);
    const left = c[0] - wd / 2 + 0.35, top = c[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function noBox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // the six guide pages as cards in a column
  const TOPICS = ['Opening hours', 'Borrowing', 'Renewals', 'Late fees', 'Rooms, printing', 'Holidays'];
  const pcol = k => k === 3 ? C.amber : k === 4 ? C.cyan : C.ink;
  const CW = P ? 3.3 : 2.7, CH = P ? 0.78 : 0.56, CARDX = P ? -2.25 : -5.3;
  const rowY = k => P ? 0.45 - k * 1.1 : 1.1 - k * 0.72;
  function cards() {
    return TOPICS.map((name, k) => {
      const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.12, color: pcol(k), strokeWidth: 2 });
      r.setFill(C.card, 0.92); r.moveTo([CARDX, rowY(k), 0]);
      const t = T(`${k + 1}  ${name}`, P ? 20 : 17, pcol(k), false, true);
      if (t.getWidth() > CW - 0.25) t.scale((CW - 0.25) / t.getWidth());
      t.moveTo([CARDX, rowY(k), 0]);
      return new M.VGroup(r, t);
    });
  }
  const lab = (s, p, color, size = P ? 18 : 17) => { const t = T(s, size, color, true); t.moveTo(p); return t; };
  const add = (p, d) => [p[0] + d[0], p[1] + d[1], 0];

  // 0 the question: a visitor with a speech bubble (so the opening picture is not empty)
  const VS = P ? 1.7 : 1, VC = P ? [0.2, -2.9, 0] : [CX, -0.5, 0];
  const vHead = new M.Circle({ radius: 0.42 * VS, color: Q, strokeWidth: 2 }); vHead.setFill(Q, 0.9); vHead.moveTo(add(VC, [-1.3 * VS, 0.35 * VS]));
  const vBody = new M.Arc({ radius: 0.75 * VS, startAngle: 0, angle: Math.PI, color: Q }); vBody.setFill(Q, 0.85); vBody.moveTo(add(VC, [-1.3 * VS, -0.75 * VS]));
  const bub = new M.RoundedRectangle({ width: 1.7 * VS, height: 1.25 * VS, cornerRadius: 0.25, color: Q, strokeWidth: 2.5 });
  bub.setFill(C.card, 0.95); bub.moveTo(add(VC, [0.75 * VS, 0.95 * VS]));
  const bubTail = new M.Line({ start: add(VC, [0.05 * VS, 0.45 * VS]), end: add(VC, [-0.75 * VS, 0.25 * VS]), color: Q, strokeWidth: 2.5 });
  const bubQ = T('?', P ? 48 : 40, Q, false, true); bubQ.moveTo(add(VC, [0.75 * VS, 0.95 * VS]));
  const visitor = [vHead, vBody, bubTail, bub, bubQ];
  await until(S(0));
  await play(...fbox(['a visitor asks:', ['What happens if I bring', Q], ['a novel back after the', Q], ['deadline?', Q]], Q), ...visitor.map(o => new M.FadeIn(o)), ...say('A VISITOR ASKS', Q));

  // 1 the right page
  let pages = cards();
  await until(S(1));
  await play(...visitor.map(o => new M.FadeOut(o)), new M.LaggedStart(pages.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }), ...say('RIGHT PAGE: 4 · LATE FEES', C.amber));
  await play(new M.Indicate(pages[3], { color: C.amber }));

  // 2 no shared word
  await until(S(2));
  await play(...fbox([['page 4 never says:', C.amber], ['  novel     ✗', C.pink], ['  deadline  ✗', C.pink], ['  bring     ✗', C.pink]], C.amber), ...say('NO SHARED KEY WORD', C.pink));

  // 3-4 last lesson's word matching (BM25)
  const BM = [0.43, 2.62, 1.07, 0.61, 0.68, 0.74];
  const BX0 = CARDX + CW / 2 + 0.2, BSC = P ? 1.0 : 1.4, BH = P ? 0.42 : 0.3;
  const bars = BM.map((v, k) => { const b = new M.Rectangle({ width: v * BSC, height: BH, color: pcol(k), strokeWidth: 1 }); b.setFill(pcol(k), 0.75); b.moveTo([BX0 + v * BSC / 2, rowY(k), 0]); return b; });
  const bmLab = BM.map((v, k) => lab(v.toFixed(2), [BX0 + v * BSC + (P ? 0.45 : 0.38), rowY(k), 0], pcol(k), P ? 18 : 16));
  await until(S(3));
  await play(new M.LaggedStart(BM.map((_, k) => new M.FadeIn(new M.VGroup(bars[k], bmLab[k]))), { lagRatio: 0.15, runTime: 2.0 }),
    ...fbox(['page 2 says:', ['"Bring your card"', C.ink], ['shares the rare word', C.muted], ['"bring" → 2.62', C.amber]]), ...say('LAST LESSON: WORD MATCHING', C.muted));
  await play(new M.Indicate(pages[1], { color: C.ink }));
  const rank = pill('5TH OF 6', C.pink, P ? 17 : 15);
  rank.moveTo([BX0 + BM[3] * BSC + (P ? 0.45 + 0.45 : 0.38 + 0.35) + rank.getWidth() / 2, rowY(3), 0]);
  await until(S(4)); await play(new M.FadeIn(rank), new M.Indicate(pages[3], { color: C.pink }), ...say('PAGE 4 COMES ONLY 5TH', C.pink));
  await until(S(5)); await play(...say('MATCH MEANING, NOT WORDS', C.green));

  // 6-8 the embedding model
  const MX = P ? -0.45 : -2.6, MY = P ? -2.3 : -0.6, MW = P ? 1.7 : 2.0, MH = P ? 3.6 : 2.8;
  const RA = MY + (P ? 1.15 : 0.9), RB = MY - (P ? 1.15 : 0.9), INX = P ? -2.95 : -5.6, LX0 = P ? 1.0 : -0.4;
  const CEL = P ? 0.36 : 0.34, CP = P ? 0.42 : 0.4;
  const model = new M.RoundedRectangle({ width: MW, height: MH, cornerRadius: 0.2, color: C.violet, strokeWidth: 2 });
  model.setFill(C.card, 0.95); model.moveTo([MX, MY, 0]);
  const m1 = T('embedding', P ? 18 : 16, C.violet, false, true); m1.moveTo([MX, MY + 0.2, 0]);
  const m2 = T('model', P ? 18 : 16, C.violet, false, true); m2.moveTo([MX, MY - 0.2, 0]);
  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(...pages, ...bars, ...bmLab, rank)), ...noBox(), new M.FadeIn(new M.VGroup(model, m1, m2)), ...say('UNIT 19: AN EMBEDDING', C.violet));

  function input(s, y, color) {
    const r = new M.RoundedRectangle({ width: 1.75, height: 0.55, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([INX, y, 0]);
    const t = T(s, P ? 17 : 16, color, false, true); if (t.getWidth() > 1.6) t.scale(1.6 / t.getWidth()); t.moveTo([INX, y, 0]);
    return new M.VGroup(r, t);
  }
  const arrowsTo = y => [
    new M.Arrow({ start: [INX + 0.95, y, 0], end: [MX - MW / 2 - 0.08, y, 0], color: C.muted, strokeWidth: 2, buff: 0 }),
    new M.Arrow({ start: [MX + MW / 2 + 0.08, y, 0], end: [LX0 - 0.08, y, 0], color: C.muted, strokeWidth: 2, buff: 0 })];
  function listRow(vals, y, color) {
    const cs = vals.map((o, j) => { const r = new M.Rectangle({ width: CEL, height: CEL, color, strokeWidth: 1 }); r.setFill(color, o); r.moveTo([LX0 + CEL / 2 + j * CP, y, 0]); return r; });
    return [...cs, lab('…', [LX0 + 6 * CP + 0.15, y, 0], C.muted, 18)];
  }
  const inA = input('page 4', RA, C.amber), arA = arrowsTo(RA), rowA = listRow([0.9, 0.3, 0.7, 0.5, 0.2, 0.8], RA, C.amber);
  const inB = input('question', RB, Q), arB = arrowsTo(RB), rowB = listRow([0.85, 0.35, 0.65, 0.55, 0.25, 0.75], RB, Q);
  await until(S(7));
  await play(new M.FadeIn(inA), new M.Create(arA[0]), new M.Create(arA[1]), new M.LaggedStart(rowA.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.4 }), ...say('TEXT → LIST OF NUMBERS', C.violet));
  await until(S(7) + 3.0); await play(...say('SIMILAR MEANING → SIMILAR LISTS', C.violet));
  await until(S(8));
  await play(new M.FadeIn(inB), new M.Create(arB[0]), new M.Create(arB[1]), new M.LaggedStart(rowB.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.4 }), ...say('SAME MODEL → LISTS CAN BE COMPARED', C.violet));

  // 9-14 a list of two numbers drawn as an arrow
  const O = P ? [-2.6, -4.9, 0] : [-4.3, -2.45, 0], U = P ? 4.7 : 3.3;
  const at = (a, u) => [O[0] + a * U, O[1] + u * U, 0];
  const xAxis = new M.Line({ start: O, end: [O[0] + U + 0.25, O[1], 0], color: C.muted, strokeWidth: 2 });
  const yAxis = new M.Line({ start: O, end: [O[0], O[1] + U + 0.25, 0], color: C.muted, strokeWidth: 2 });
  await until(S(9));
  await play(new M.FadeOut(new M.VGroup(model, m1, m2, inA, inB, ...arA, ...arB, ...rowA, ...rowB)), new M.Create(xAxis), new M.Create(yAxis), ...say('DRAW A LIST AS AN ARROW'));
  await until(S(10)); await play(...fbox(['real embeddings:', '  hundreds of numbers', '  (for example 384)', ['here: only 2 numbers', C.amber]]), ...say('TOY PICTURE: 2 NUMBERS', C.amber));
  const xl = T('across = borrowing', P ? 18 : 16, C.muted); xl.moveTo([O[0] + U / 2, O[1] - 0.33, 0]);
  await until(S(11)); await play(new M.FadeIn(xl), new M.Indicate(xAxis, { color: C.amber }), ...say('1ST NUMBER: ACROSS = BORROWING', C.amber));
  const yl = T('up = time, lateness', P ? 18 : 16, C.muted); yl.moveTo([O[0] - 0.1 + yl.getWidth() / 2, O[1] + U + 0.5, 0]);
  await until(S(12)); await play(new M.FadeIn(yl), new M.Indicate(yAxis, { color: C.amber }), ...say('2ND NUMBER: UP = TIME, LATENESS', C.amber));
  await until(S(13)); await play(...say('TOY PICTURE: REAL DIRECTIONS HAVE NO NAMES', C.muted));
  const arc = new M.Arc({ radius: U, startAngle: 0, angle: Math.PI / 2, color: C.muted, strokeWidth: 2 });
  arc.moveTo([O[0] + U / 2, O[1] + U / 2, 0]);
  await until(S(14)); await play(new M.Create(arc), ...fbox(['every arrow:', ['length = 1', C.amber], 'only the direction', 'matters']), ...say('SAME LENGTH: 1', C.amber));

  // 15-20 four arrows
  const vec = (a, u, color) => new M.Arrow({ start: O, end: at(a, u), color, strokeWidth: 4, buff: 0 });
  const a2 = vec(1, 0, C.ink), l2 = lab('page 2', add(at(1, 0), [0.75, 0.22]), C.ink);
  const a1 = vec(0, 1, C.ink), l1 = lab('page 1', add(at(0, 1), [0.7, 0.05]), C.ink);
  const a4 = vec(0.8, 0.6, C.amber), l4 = lab('page 4', add(at(0.8, 0.6), [0.75, 0.05]), C.amber);
  const aq = vec(0.6, 0.8, Q), lq = lab('question', add(at(0.6, 0.8), [-0.1, 0.38]), Q);
  const V = ['arrows (across, up)', 'page 2   = (1, 0)', 'page 1   = (0, 1)', ['page 4   = (0.8, 0.6)', C.amber], ['question = (0.6, 0.8)', Q]];
  await until(S(15)); await play(new M.Create(a2), new M.FadeIn(l2), ...fbox(V.slice(0, 2)), ...say('PAGE 2: BORROWING → ACROSS'));
  await until(S(16)); await play(new M.Create(a1), new M.FadeIn(l1), ...fbox(V.slice(0, 3)), ...say('PAGE 1: TIME → UP'));
  await until(S(17)); await play(new M.Create(a4), new M.FadeIn(l4), ...fbox(V.slice(0, 4)), ...say('PAGE 4: BOTH', C.amber));
  await until(S(18)); await play(new M.Create(aq), new M.FadeIn(lq), ...fbox(V), ...say('THE QUESTION GETS AN ARROW', Q));
  await until(S(19)); await play(new M.Indicate(aq, { color: Q }), new M.Indicate(a4, { color: C.amber }), ...say('QUESTION ≈ PAGE 4 DIRECTION', Q));
  await until(S(20)); await play(...say('CLOSER DIRECTION = CLOSER MEANING', C.green));

  // 21-28 multiply and add
  const score = (s, l) => lab(s, add(l.getCenter(), [0, -0.4]), C.amber, P ? 18 : 16);
  const sc4 = score('0.96', l4), sc1 = score('0.8', l1), sc2 = score('0.6', l2);
  await until(S(21)); await play(...fbox(['score = across × across', '      + up × up']), ...say('MULTIPLY, MULTIPLY, ADD', C.amber));
  await until(S(22)); await play(new M.Indicate(a4, { color: C.amber }), ...fbox(['question & page 4', ['0.6 × 0.8 = 0.48', C.amber]], C.amber));
  await until(S(23)); await play(...fbox(['question & page 4', '0.6 × 0.8 = 0.48', ['0.8 × 0.6 = 0.48', C.amber]], C.amber));
  await until(S(24)); await play(new M.FadeIn(sc4), ...fbox(['question & page 4', '0.6 × 0.8 = 0.48', '0.8 × 0.6 = 0.48', ['sum = 0.96', C.amber]], C.amber));
  await until(S(25)); await play(new M.Indicate(a1, { color: C.cyan }), ...fbox(['question & page 1', ['0 × 0.6 = 0', C.cyan]]));
  await until(S(26)); await play(new M.FadeIn(sc1), ...fbox(['question & page 1', '0 × 0.6 = 0', '1 × 0.8 = 0.8', ['sum = 0.8', C.amber]]));
  await until(S(27)); await play(new M.Indicate(a2, { color: C.cyan }), new M.FadeIn(sc2), ...fbox(['question & page 2', '1 × 0.6 = 0.6', '0 × 0.8 = 0', ['sum = 0.6', C.amber]]));
  const RANK = ['dense ranking', ['1. page 4   0.96', C.amber], '2. page 1   0.8', '3. page 2   0.6'];
  await until(S(28)); await play(new M.Flash(sc4, { color: C.amber }), ...fbox(RANK, C.amber), ...say('BIGGEST SCORE WINS', C.amber));

  // 29-32 the names
  await until(S(29)); await play(...fbox(['cosine similarity', ['= multiply and add', C.amber]]), ...say('THIS SCORE = COSINE SIMILARITY'));
  await until(S(30)); await play(new M.Indicate(arc, { color: C.amber }), ...say('WORKS BECAUSE EVERY LENGTH = 1', C.amber));
  const sq = P ? 0.4 : 0.3;
  const corner = [new M.Line({ start: add(O, [sq, 0]), end: add(O, [sq, sq]), color: C.violet, strokeWidth: 2 }),
    new M.Line({ start: add(O, [sq, sq]), end: add(O, [0, sq]), color: C.violet, strokeWidth: 2 })];
  await until(S(31)); await play(new M.Create(corner[0]), new M.Create(corner[1]),
    ...fbox(['same way: 1', '  question & question', '  0.36 + 0.64 = 1', ['right angle: 0', C.violet], ['  page 1 & page 2: 0', C.violet]]), ...say('1 = SAME WAY    0 = RIGHT ANGLE', C.violet));
  await until(S(32)); await play(...fbox(['dense retrieval:', 'rank the pages by how', 'similar their arrow is', "to the question's arrow"]), ...say('DENSE RETRIEVAL'));

  // 33 dense: almost no zeros
  const RX = j => CX + (j - 4.5) * (P ? 0.68 : 0.45), CS = P ? 0.6 : 0.4;
  const Y1 = P ? -1.3 : 0.1, Y2 = P ? -4.3 : -1.6;
  const dense = [0.8, 0.35, 0.6, 0.9, 0.25, 0.7, 0.5, 0.85, 0.4, 0.65].map((o, j) => { const r = new M.Rectangle({ width: CS, height: CS, color: C.cyan, strokeWidth: 1 }); r.setFill(C.cyan, o); r.moveTo([RX(j), Y1, 0]); return r; });
  const sparse = [0, 0, 1, 0, 0, 0, 0, 2, 0, 0].flatMap((d, j) => { const r = new M.Rectangle({ width: CS, height: CS, color: C.muted, strokeWidth: 1 }); r.moveTo([RX(j), Y2, 0]);
    return [r, lab(String(d), [RX(j), Y2, 0], d ? C.cyan : C.muted, P ? 19 : 16)]; });
  const dl = T('embedding: almost no zeros', P ? 19 : 16, C.cyan); dl.moveTo([RX(0) - CS / 2 + dl.getWidth() / 2, Y1 + (P ? 0.65 : 0.5), 0]);
  const wl = T('word counts (unit 19): mostly 0', P ? 19 : 16, C.muted); wl.moveTo([RX(0) - CS / 2 + wl.getWidth() / 2, Y2 + (P ? 0.65 : 0.5), 0]);
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(xAxis, yAxis, xl, yl, arc, a1, a2, a4, aq, l1, l2, l4, lq, sc1, sc2, sc4, ...corner)),
    new M.FadeIn(new M.VGroup(...dense, dl)), new M.FadeIn(new M.VGroup(...sparse, wl)),
    ...fbox(['embedding:', ['  almost no zeros → dense', C.cyan], 'word counts:', ['  mostly zeros', C.muted]]), ...say('DENSE = ALMOST NO ZEROS'));

  // 34-35 page arrows in advance
  pages = cards();
  const tags = pages.map((_, k) => { const t = T('arrow saved ✓', P ? 18 : 16, C.violet); t.moveTo([CARDX + CW / 2 + 0.2 + t.getWidth() / 2, rowY(k), 0]); return t; });
  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(...dense, dl, ...sparse, wl)),
    new M.LaggedStart(pages.map((c, k) => new M.FadeIn(new M.VGroup(c, tags[k]))), { lagRatio: 0.12, runTime: 1.6 }),
    ...fbox(['in advance:', '  6 page arrows, once', ['each new question:', Q], ['  1 new arrow', Q]], C.violet), ...say('PAGE ARROWS: COMPUTED ONCE', C.violet));
  await until(S(35)); await play(...fbox(['similarity =', '  sum over directions of', '  query number × page number', ['  0.6×0.8 + 0.8×0.6 = 0.96', C.amber]]), ...say('THE FORMULA IN WORDS'));

  // 36-37 what it is for
  await until(S(36)); await play(new M.FadeOut(new M.VGroup(...tags)), new M.Indicate(pages[3], { color: C.amber }), new M.Flash(pages[3], { color: C.amber }), ...say('RIGHT PAGE, DIFFERENT WORDS', C.green));
  await until(S(37)); await play(...fbox([['novel    ≈ book', Q], ['deadline ≈ late', Q], ['→ arrows land close', C.muted]], Q), ...say('DIFFERENT WORDS, SAME MEANING', Q));

  // 38-41 the trap: codes and names
  await until(S(38)); await play(...say('TRAP: BLURRY ON CODES AND NAMES', C.pink));
  const MO = P ? [-0.2, -4.6, 0] : [-3.0, -2.3, 0], ML = P ? 3.2 : 3.0;
  const tip = d => add(MO, [ML * Math.cos(d * Math.PI / 180), ML * Math.sin(d * Math.PI / 180)]);
  const r12 = new M.Arrow({ start: MO, end: tip(30), color: C.pink, strokeWidth: 4, buff: 0 });
  const r14 = new M.Arrow({ start: MO, end: tip(36), color: C.cyan, strokeWidth: 4, buff: 0 });
  const t12 = lab('R12', add(tip(30), [0.45, -0.1]), C.pink), t14 = lab('R14', add(tip(36), [-0.25, 0.3]), C.cyan);
  await until(S(39));
  await play(new M.Create(r12), new M.Create(r14), new M.FadeIn(new M.VGroup(t12, t14)), new M.Indicate(pages[4], { color: C.cyan }),
    ...fbox(['visitor asks: room R12', ['to the embedding:', C.pink], ['  R12 ≈ R14', C.pink]], C.pink));
  await until(S(40)); await play(new M.Flash(pages[4], { color: C.green }), ...fbox(['word matching:', ['"R12" is on page 5 only', C.green], ['→ caught at once', C.green]], C.green), ...say('WORD MATCHING CATCHES THE CODE', C.green));
  await until(S(41)); await play(new M.FadeOut(new M.VGroup(r12, r14, t12, t14)), ...fbox(['word matching', '+ meaning arrows', ['→ later in this chapter', C.muted]], C.violet), ...say('LATER: COMBINE BOTH SEARCHES', C.violet));

  // 42 in one sentence
  await until(S(42)); await play(new M.Indicate(pages[3], { color: C.amber }), ...fbox(RANK, C.amber), ...say('TEXTS → ARROWS → CLOSEST DIRECTION WINS'));
}

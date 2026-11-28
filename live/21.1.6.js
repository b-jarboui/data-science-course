// 21.1.6 Chunking: a cut can split a rule from its exception (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, C, S, T, pill, showA, until, play } = L;
  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 2.25, 0] : [-1.0, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.55, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
    const maxw = P ? 8 - 1.2 : 4.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // outline box drawn from coordinates
  function frame(l, t, r, b, color) {
    const f = new M.RoundedRectangle({ width: r - l, height: t - b, cornerRadius: 0.14, color, strokeWidth: 2 });
    f.moveTo([(l + r) / 2, (t + b) / 2, 0]); return f;
  }

  // the six guide pages as glowing cards
  const PAGES = [['Opening hours', C.ink], ['Borrowing', C.ink], ['Renewals', C.ink], ['Late fees', C.amber], ['Rooms and printing', C.cyan], ['Holidays', C.ink]];
  const CW = P ? 2.15 : 1.25, CH = P ? 1.25 : 1.5;
  const cardAt = i => P ? [((i % 3) - 1) * 2.45, i < 3 ? 0.9 : -0.6, 0] : [CX + (i - 2.5) * 1.45, 0.2, 0];
  function makeCards() {
    return PAGES.map(([topic, col], i) => {
      const [x, y] = cardAt(i);
      const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.14, color: col, strokeWidth: 2 }); r.setFill(col, 0.08); r.moveTo([x, y, 0]);
      const n = T(String(i + 1), P ? 30 : 32, col, true, true); n.moveTo([x, y + (P ? 0.18 : 0.25), 0]);
      const two = !P && topic === 'Rooms and printing';
      const ts = (two ? ['Rooms and', 'printing'] : [topic]).map((s, j) => { const t = T(s, 14, col); if (t.getWidth() > CW - 0.2) t.scale((CW - 0.2) / t.getWidth()); t.moveTo([x, y - (P ? 0.32 : (two ? 0.3 + j * 0.26 : 0.4)), 0]); return t; });
      return new M.VGroup(r, n, ...ts);
    });
  }

  // page 4: three sentences, one block per word
  const SENT = [['A late book costs twenty cents a day.', 8], ['This late fee stops at five euros per book.', 9], ['Children’s books have no late fee.', 6]];
  const RX = P ? -3.2 : -6.3, BP = P ? 0.38 : 0.42, TMAX = P ? 6.6 : 7.6, TS = P ? 19 : 21;
  const rowY = k => P ? 1.2 - 1.45 * k : 0.9 - 1.05 * k, blkY = k => rowY(k) - (P ? 0.42 : 0.38);
  const CARD = { l: RX - 0.6, r: P ? 3.75 : 1.75, t: rowY(0) + 0.4, b: blkY(2) - 0.4 };
  const chL = RX - 0.48, chR = CARD.r - 0.12;
  function sentText(s, color, k) {
    const t = T(s, TS, color); if (t.getWidth() > TMAX) t.scale(TMAX / t.getWidth());
    t.moveTo([RX + t.getWidth() / 2, rowY(k), 0]); return t;
  }
  function wblock(k, j, color = C.cyan) {
    const b = new M.Rectangle({ width: BP * 0.78, height: 0.22, color, strokeWidth: 1 }); b.setFill(color, 0.85);
    b.moveTo([RX + (j + 0.5) * BP, blkY(k), 0]); return b;
  }
  function buildPage() {
    const card = frame(CARD.l, CARD.t, CARD.r, CARD.b, C.amber);
    const label = T('page 4 · late fees', 17, C.amber); label.moveTo([(CARD.l + CARD.r) / 2, CARD.b - 0.3, 0]);
    const nums = SENT.map((_, k) => { const t = T(String(k + 1), 17, C.violet, true, true); t.moveTo([RX - 0.28, rowY(k), 0]); return t; });
    const texts = SENT.map(([s], k) => sentText(s, C.ink, k));
    const blocks = SENT.map(([, n], k) => Array.from({ length: n }, (_, j) => wblock(k, j)));
    const counts = SENT.map(([, n], k) => { const t = T(`${n} words`, 16, C.muted); t.moveTo([RX + n * BP + 0.2 + t.getWidth() / 2, blkY(k), 0]); return t; });
    return { card, label, nums, texts, blocks, counts };
  }
  const pageParts = pg => [pg.card, pg.label, ...pg.nums, ...pg.texts, ...pg.blocks.flat(), ...pg.counts];
  const paintRow = (pg, k, color, op = 0.85) => pg.blocks[k].forEach(b => { b.setFill(color, op); b.setColor(color); });
  function chunkPill(s, color, k) { const p = pill(s, color, 15); p.moveTo([chR - 0.25 - p.getWidth() / 2, blkY(k), 0]); return p; }

  // 0 each page was one piece
  let cards = makeCards();
  await until(S(0)); await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.6 }), ...say('1 PAGE = 1 PIECE TO SEARCH'));

  // 1-4 a long handbook, cut into chunks
  const HB = P ? { w: 4.0, h: 0.95, y: -1.0 } : { w: 3.0, h: 0.72, y: -0.75 }, GAP = 0.2;
  const pieceY = (k, gap) => HB.y + (2 - k) * (HB.h + gap);
  function piece(k, gap) {
    const y = pieceY(k, gap);
    const r = new M.Rectangle({ width: HB.w, height: HB.h, color: C.ink, strokeWidth: 1.5 }); r.setFill(C.ink, 0.06); r.moveTo([CX, y, 0]);
    const lines = [0, 1, 2].map(j => new M.Line({ start: [CX - HB.w / 2 + 0.25, y + (1 - j) * HB.h * 0.26, 0],
      end: [CX + HB.w / 2 - 0.25 - (j === 2 ? HB.w * 0.3 : 0), y + (1 - j) * HB.h * 0.26, 0], color: C.muted, strokeWidth: 2 }));
    return new M.VGroup(r, ...lines);
  }
  const pieces = [0, 1, 2, 3, 4].map(k => piece(k, 0));
  const hbLabel = T('one long handbook', 17, C.muted); hbLabel.moveTo([CX, pieceY(4, 0) - HB.h / 2 - 0.3, 0]);
  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...cards)), new M.LaggedStart(pieces.map(p => new M.FadeIn(p)), { lagRatio: 0.1, runTime: 1.2 }),
    new M.FadeIn(hbLabel), ...say('TOO BIG TO SEARCH OR READ AT ONCE', C.pink));
  await until(S(2));
  await play(new M.FadeOut(hbLabel), new M.LaggedStart(pieces.map((p, k) => new M.Transform(p, piece(k, GAP))), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('CUT INTO SMALLER PIECES', C.amber));
  const chunkLabs = pieces.map((_, k) => { const t = T(`chunk ${k + 1}`, 15, C.cyan); t.moveTo([CX - HB.w / 2 - 0.15 - t.getWidth() / 2, pieceY(k, GAP), 0]); return t; });
  await until(S(3)); await play(new M.LaggedStart(chunkLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.15, runTime: 1.2 }), ...say('CHUNKING · EACH PIECE = A CHUNK'));
  const HTS = [[3, 1, 2], [1, 3, 2], [2, 2, 3], [3, 2, 1], [1, 2, 3]], ANG = [20, 75, 130, 45, 100];
  const extras = [];
  pieces.forEach((_, k) => {
    const y = pieceY(k, GAP), x0 = CX + HB.w / 2 + 0.25;
    HTS[k].forEach((v, j) => { const b = new M.Rectangle({ width: 0.09, height: v * 0.1, color: C.amber, strokeWidth: 1 }); b.setFill(C.amber, 0.85); b.moveTo([x0 + j * 0.14, y - 0.22 + v * 0.05, 0]); extras.push(b); });
    const a = ANG[k] * Math.PI / 180, s0 = [x0 + 0.75, y - 0.18, 0];
    extras.push(new M.Arrow({ start: s0, end: [s0[0] + 0.42 * Math.cos(a), s0[1] + 0.42 * Math.sin(a), 0], color: C.green, buff: 0, tipLength: 0.12, strokeWidth: 3 }));
  });
  await until(S(4)); await play(new M.LaggedStart(extras.map(e => new M.FadeIn(e)), { lagRatio: 0.06, runTime: 1.6 }), ...say('OWN WORD COUNTS + OWN MEANING ARROW', C.green));
  await until(S(4) + 3.4); await play(new M.LaggedStart(pieces.map(p => new M.Indicate(p, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.4 }), ...say('SEARCH FINDS CHUNKS, NOT BOOKS'));

  // 5-9 page 4, sentence by sentence
  const pg = buildPage();
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(...pieces, ...chunkLabs, ...extras)), new M.Create(pg.card), new M.FadeIn(pg.label), ...say('CHUNKER = SMALL PROGRAM THAT CUTS', C.amber));
  await until(S(6)); await play(new M.LaggedStart(pg.nums.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.0 }), ...say('PAGE 4: THREE SENTENCES', C.amber));
  for (let k = 0; k < 3; k++) {
    await until(S(7 + k));
    await play(new M.FadeIn(pg.texts[k]), new M.LaggedStart(pg.blocks[k].map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 }), new M.FadeIn(pg.counts[k]));
  }

  // 10-14 the chunker at work
  await until(S(10)); await play(...say('AT MOST 20 WORDS · CUT AT SENTENCE ENDS', C.amber), ...fbox(['max 20 words per chunk', ['cut only at a sentence end', C.amber]], C.amber));
  await until(S(11)); paintRow(pg, 0, C.green);
  await play(...say('TAKE SENTENCE 1', C.green), ...fbox(['words in this chunk', ['8', C.green]], C.green));
  await until(S(12)); paintRow(pg, 1, C.green);
  await play(...say('ADD SENTENCE 2', C.green), ...fbox(['words in this chunk', '8 + 9 = 17', ['17 ≤ 20  fits', C.green]], C.green));
  await until(S(13)); paintRow(pg, 2, C.pink);
  await play(...say('TRY SENTENCE 3', C.pink), ...fbox(['words in this chunk', '17 + 6 = 23', ['23 > 20  too many', C.pink]], C.pink));
  const cutY = (blkY(1) - 0.24 + rowY(2) + 0.26) / 2;
  const cut = new M.DashedLine({ start: [CARD.l, cutY, 0], end: [CARD.r, cutY, 0], color: C.pink });
  await until(S(14)); await play(new M.Create(cut), ...say('CUT: SENTENCE 3 STARTS A NEW CHUNK', C.pink));
  paintRow(pg, 2, C.violet);
  await play(...fbox(['new chunk', ['6', C.violet]], C.violet));

  // 15-17 chunk A = the rule, chunk B = the exception
  const boxA = frame(chL, rowY(0) + 0.26, chR, blkY(1) - 0.24, C.cyan), labA = chunkPill('CHUNK A', C.cyan, 1);
  let boxB = frame(chL, rowY(2) + 0.26, chR, blkY(2) - 0.24, C.violet);
  const labB = chunkPill('CHUNK B', C.violet, 2);
  await until(S(15)); paintRow(pg, 0, C.cyan); paintRow(pg, 1, C.cyan);
  await play(new M.Create(boxA), new M.FadeIn(labA), ...say('CHUNK A = THE RULE'),
    ...fbox(['chunk A = sentences 1 + 2', '8 + 9 = 17 words', ['20 cents a day, max 5 euros', C.cyan]]));
  await until(S(16)); await play(new M.Create(boxB), new M.FadeIn(labB), ...say('CHUNK B = THE EXCEPTION', C.violet),
    ...fbox(['chunk B = sentence 3', '6 words', ['children: no late fee', C.violet]], C.violet));
  await until(S(17)); await play(new M.Indicate(pg.texts[2], { color: C.violet }), ...say('EXCEPTION = WHERE THE RULE DOES NOT APPLY', C.violet));

  // 18-22 the question goes wrong
  await until(S(18)); await play(...say(P ? '“CHILD’S BOOK 3 DAYS LATE: WHAT DO I PAY?”' : '“MY CHILD’S PICTURE BOOK IS 3 DAYS LATE. WHAT DO I PAY?”', C.amber), ...unbox());
  await until(S(19)); await play(new M.Indicate(boxA, { color: C.cyan }),
    ...fbox(['best match for the question', ['1st  chunk A: late, book, day', C.cyan], ['2nd  chunk B', C.muted]]));
  await until(S(20)); paintRow(pg, 2, C.muted, 0.3);
  await play(new M.Transform(pg.texts[2], sentText(SENT[2][0], C.muted, 2)), new M.Transform(boxB, frame(chL, rowY(2) + 0.26, chR, blkY(2) - 0.24, C.muted)),
    ...say('THE ASSISTANT READS CHUNK A ONLY'));
  await until(S(21)); await play(new M.Indicate(pg.texts[0], { color: C.amber }), ...fbox(['3 days × 20 cents', ['= 60 cents', C.amber]], C.amber));
  await until(S(22)); await play(...say('IT ANSWERS: “60 CENTS”', C.amber));

  // 23-25 the right answer was across the cut
  await until(S(23)); paintRow(pg, 2, C.violet);
  await play(new M.Transform(pg.texts[2], sentText(SENT[2][0], C.ink, 2)), new M.Transform(boxB, frame(chL, rowY(2) + 0.26, chR, blkY(2) - 0.24, C.violet)),
    ...say('RIGHT ANSWER: NOTHING', C.green), ...fbox(['children’s book, 3 days late', ['late fee = 0', C.green]], C.green));
  await until(S(24)); await play(new M.Indicate(cut, { color: C.pink }), ...say('THE EXCEPTION WAS ACROSS THE CUT', C.pink));
  await until(S(25)); await play(new M.Indicate(boxA, { color: C.cyan }), ...say('SEARCH WORKED · THE CUT LOST THE MEANING', C.pink));

  // 26 a recipe card torn before "but not for children"
  const RW = P ? 6.4 : 5.4, RT = P ? 1.4 : 1.1, RS = -0.8, RH = 0.75, RXL = CX - RW / 2 + 0.35;
  function recipeTop() {
    const r = new M.Rectangle({ width: RW, height: RT - RS, color: C.ink, strokeWidth: 2 }); r.setFill(C.ink, 0.05); r.moveTo([CX, (RT + RS) / 2, 0]);
    const ts = [['RECIPE: PANCAKES', C.amber, true], ['2 eggs, 1 cup of milk, flour', C.ink, false], ['add a spoon of honey on top', C.ink, false]].map(([s, c, b], j) => {
      const t = T(s, 20, c, false, b); t.moveTo([RXL + t.getWidth() / 2, RT - 0.4 - j * 0.55, 0]); return t; });
    return new M.VGroup(r, ...ts);
  }
  function recipeBottom(dx, dy) {
    const y = RS - RH / 2 + dy;
    const r = new M.Rectangle({ width: RW, height: RH, color: C.ink, strokeWidth: 2 }); r.setFill(C.ink, 0.05); r.moveTo([CX + dx, y, 0]);
    const t = T('but not for children', 20, C.pink, false, true); t.moveTo([RXL + dx + t.getWidth() / 2, y, 0]);
    return new M.VGroup(r, t);
  }
  const rTop = recipeTop(), rBot = recipeBottom(0, 0), zig = [];
  for (let x = CX - RW / 2, j = 0; x < CX + RW / 2 - 0.01; x += 0.3, j++)
    zig.push(new M.Line({ start: [x, RS + (j % 2 ? 0.07 : -0.07), 0], end: [Math.min(x + 0.3, CX + RW / 2), RS + (j % 2 ? -0.07 : 0.07), 0], color: C.pink, strokeWidth: 3 }));
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(...pageParts(pg), boxA, boxB, labA, labB, cut)), ...unbox(), new M.FadeIn(rTop), new M.FadeIn(rBot),
    ...say('TORN RIGHT BEFORE “BUT NOT FOR CHILDREN”', C.pink));
  await play(new M.Create(new M.VGroup(...zig), { runTime: 0.8 }));
  await play(new M.Transform(rBot, recipeBottom(0.5, -0.9), { runTime: 1.0 }));

  // 27-30 the fix: cut where the topic changes
  await until(S(27)); await play(new M.FadeOut(new M.VGroup(rTop, rBot, ...zig)), ...say('HOW DO WE FIX IT?', C.amber));
  cards = makeCards();
  const dl = (a, b) => new M.DashedLine({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color: C.green });
  const tcuts = [];
  if (P) { for (const y of [0.9, -0.6]) for (const x of [-1.225, 1.225]) tcuts.push(dl([x, y + 0.7], [x, y - 0.7])); tcuts.push(dl([-3.6, 0.15], [3.6, 0.15])); }
  else for (let i = 0; i < 5; i++) { const x = CX + (i - 2) * 1.45; tcuts.push(dl([x, 1.05], [x, -0.65])); }
  await until(S(28)); await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.2 }), ...say('CUT WHERE THE TOPIC CHANGES', C.green));
  await play(new M.LaggedStart(tcuts.map(c => new M.Create(c)), { lagRatio: 0.2, runTime: 1.2 }));
  const pg2 = buildPage();
  const whole = frame(chL, rowY(0) + 0.26, chR, blkY(2) - 0.24, C.green), wLab = chunkPill('ONE CHUNK', C.green, 2);
  await until(S(29)); await play(new M.FadeOut(new M.VGroup(...cards, ...tcuts)), ...say('KEEP PAGE 4 WHOLE: ONE TOPIC', C.green));
  await play(...pageParts(pg2).map(x => new M.FadeIn(x)), new M.Create(whole), new M.FadeIn(wLab),
    ...fbox(['8 + 9 + 6 = 23 words', ['one topic → one chunk', C.green]], C.green));
  await until(S(30)); await play(new M.LaggedStart([new M.Indicate(pg2.texts[0], { color: C.amber }), new M.Indicate(pg2.texts[2], { color: C.violet })], { lagRatio: 0.5, runTime: 1.6 }),
    ...say('RULE + EXCEPTION TRAVEL TOGETHER', C.green));

  // 31-32 overlap
  const oA = frame(chL, rowY(0) + 0.26, chR, blkY(1) - 0.24, C.cyan), oB = frame(chL + 0.1, rowY(1) + 0.34, chR - 0.1, blkY(2) - 0.24, C.violet);
  const oLabA = chunkPill('CHUNK A', C.cyan, 0), oLabB = chunkPill('CHUNK B', C.violet, 2);
  await until(S(31)); paintRow(pg2, 1, C.violet);
  await play(new M.FadeOut(new M.VGroup(whole, wLab)), new M.Create(oA), new M.Create(oB), new M.FadeIn(oLabA), new M.FadeIn(oLabB),
    ...fbox(['A: 8 + 9 = 17 words', 'B: 9 + 6 = 15 words', ['shared: sentence 2', C.violet]], C.violet), ...say('OVERLAP: SHARE THE BORDER SENTENCE', C.violet));
  await until(S(32)); await play(new M.Indicate(pg2.texts[0], { color: C.pink }),
    ...fbox(['chunk A still has the rule', ['but not the exception', C.pink]], C.pink), ...say('LOWER RISK, NOT ZERO RISK', C.amber));

  // 33 a good chunk
  const whole2 = frame(chL, rowY(0) + 0.26, chR, blkY(2) - 0.24, C.green), wLab2 = chunkPill('ONE CHUNK', C.green, 2);
  await until(S(33)); paintRow(pg2, 1, C.cyan);
  await play(new M.FadeOut(new M.VGroup(oA, oB, oLabA, oLabB)), new M.Create(whole2), new M.FadeIn(wLab2),
    ...fbox([['one whole idea', C.green], ['small enough to find', C.cyan], ['big enough to stand alone', C.amber]], C.green), ...say('A GOOD CHUNK', C.green));

  // 34 what chunking is for
  const cards3 = makeCards();
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(...pageParts(pg2), whole2, wLab2)), ...unbox(), ...say('LONG TEXT → SEARCHABLE PIECES'));
  await play(new M.LaggedStart(cards3.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 1.4 }));

  // 35-37 the trap: huge chunks
  const HG = P ? { l: -3.75, r: 3.75, t: 1.7, b: -1.4 } : { l: CX - 4.4, r: CX + 4.4, t: 1.1, b: -0.7 };
  const huge = frame(HG.l, HG.t, HG.r, HG.b, C.pink), hugeLab = pill('HUGE CHUNK', C.pink, 15);
  hugeLab.moveTo([P ? 0 : CX, HG.b - 0.4, 0]);
  await until(S(35)); await play(new M.Create(huge), new M.FadeIn(hugeLab), ...say('TRAP: HUGE CHUNKS “TO BE SAFE”', C.pink));
  const AO = P ? [0, -4.7, 0] : [CX, -2.65, 0], AR = P ? 1.3 : 0.85;
  const arrows = [10, 40, 70, 100, 130, 160].map((d, i) => { const a = d * Math.PI / 180;
    return new M.Arrow({ start: AO, end: [AO[0] + AR * Math.cos(a), AO[1] + AR * Math.sin(a), 0], color: PAGES[i][1], buff: 0, tipLength: 0.15, strokeWidth: 3 }); });
  const avgA = 85 * Math.PI / 180, avgL = 0.644 * AR;
  const avg = new M.Arrow({ start: AO, end: [AO[0] + avgL * Math.cos(avgA), AO[1] + avgL * Math.sin(avgA), 0], color: C.pink, buff: 0, tipLength: 0.18, strokeWidth: 7 });
  const blurLab = T('huge chunk: one blurry arrow', 15, C.pink); blurLab.moveTo([AO[0], AO[1] - 0.3, 0]);
  await until(S(36)); await play(new M.LaggedStart(arrows.map(a => new M.Create(a)), { lagRatio: 0.15, runTime: 1.4 }), ...say('IT MIXES MANY TOPICS', C.pink));
  await until(S(36) + 2.6); await play(new M.Create(avg), new M.FadeIn(blurLab), ...say('BLURRY ARROW → POOR MATCH', C.pink));
  const WB = P ? { l: -3.6, r: 3.6, ys: [-3.3, -4.6] } : { l: -4.6, r: 1.6, ys: [-1.85, -2.6] };
  const wins = [], fills = [], wlabs = [];
  [['page 4', C.cyan, 0.12], ['huge chunk', C.pink, 0.8]].forEach(([name, col, frac], k) => {
    const y = WB.ys[k], w = WB.r - WB.l;
    const r = new M.Rectangle({ width: w, height: 0.38, color: C.muted, strokeWidth: 2 }); r.moveTo([(WB.l + WB.r) / 2, y, 0]); wins.push(r);
    const f = new M.Rectangle({ width: w * frac, height: 0.3, color: col, strokeWidth: 1 }); f.setFill(col, 0.8); f.moveTo([WB.l + w * frac / 2 + 0.04, y, 0]); fills.push(f);
    const t = T(name, 16, col); t.moveTo(P ? [WB.l + t.getWidth() / 2, y + 0.42, 0] : [WB.l - 0.15 - t.getWidth() / 2, y, 0]); wlabs.push(t);
  });
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(...arrows, avg, blurLab)), ...say('CONTEXT WINDOW = SPACE IT CAN READ AT ONCE', C.amber));
  await play(...wins.map(w => new M.Create(w)), ...wlabs.map(t => new M.FadeIn(t)), new M.LaggedStart(fills.map(f => new M.FadeIn(f)), { lagRatio: 0.6, runTime: 1.4 }));

  // 38 a balance
  const BY = P ? -1.6 : -0.5, BM = P ? 0 : CX, BL = BM - (P ? 3.0 : 3.3), BR = BM + (P ? 3.0 : 3.3);
  const bal = new M.Line({ start: [BL, BY, 0], end: [BR, BY, 0], color: C.muted, strokeWidth: 3 });
  const ends = [BL, BR].map(x => new M.Dot({ point: [x, BY, 0], radius: 0.09, color: C.pink }));
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const small = T('too small', 18, C.pink, false, true); small.moveTo([BL + small.getWidth() / 2 - 0.2, BY - 0.4, 0]);
  const big = T('too big', 18, C.pink, false, true); big.moveTo([BR - big.getWidth() / 2 + 0.2, BY - 0.4, 0]);
  const smallW = fit(T('rule cut from its exception', 17, C.ink), 3.1); smallW.moveTo([BL + smallW.getWidth() / 2 - 0.2, BY - 0.8, 0]);
  const bigW = fit(T('blurry, fills the window', 17, C.ink), 3.1); bigW.moveTo([BR - bigW.getWidth() / 2 + 0.2, BY - 0.8, 0]);
  const mid = new M.Dot({ point: [BM, BY, 0], radius: 0.14, color: C.green });
  const midLab = T('one whole topic', 18, C.green, false, true); midLab.moveTo([BM, BY + 0.45, 0]);
  await until(S(38)); await play(new M.FadeOut(new M.VGroup(...cards3, huge, hugeLab, ...wins, ...fills, ...wlabs)), ...say('CHUNK SIZE IS A BALANCE', C.amber));
  await play(new M.Create(bal), ...ends.map(d => new M.FadeIn(d)), new M.FadeIn(small), new M.FadeIn(big), new M.FadeIn(smallW), new M.FadeIn(bigW),
    new M.FadeIn(mid), new M.FadeIn(midLab), ...fbox(['small → precise', 'large → rule + exception together', ['aim: one whole topic', C.green]], C.green));

  // 39 in one sentence
  await until(S(39)); await play(new M.Flash(mid, { color: C.green }), ...say('CUT INTO PIECES · KEEP RULE + EXCEPTION', C.green),
    ...fbox(['chunking: cut long text', 'into searchable pieces', ['bad cut: rule | exception', C.pink]]));
}

// 21.2.8 Model-based judging: a model marks the answers, and we check it card by card against the librarians.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const LIB = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1];   // librarians (the reference): 7 right, 3 wrong
  const JUD = [1, 1, 1, 1, 0, 1, 1, 1, 0, 0];   // judge: also 7 right, but differs on cards 1 and 10
  const TOPIC = [C.cyan, C.cyan, C.cyan, C.cyan, C.cyan, C.pink, C.pink, C.pink, C.amber, C.amber];   // hours, loans, rooms
  const BLUE = '#60a5fa';
  let PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const mark = (ok, size = P ? 30 : 24) => T(ok ? '✓' : '✗', size, ok ? C.green : C.pink, false, true);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent; anchored by its top edge
  const BOXX = P ? 0 : 3.9, BOXTOP = P ? 4.3 : 2.2;
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const ind = rows.map(([s]) => cw * (s.length - s.trimStart().length));
    const wd = Math.max(...texts.map((t, i) => t.getWidth() + ind[i])) + 0.7, ht = rows.length * lh + 0.4;
    const k = Math.min(1, (P ? FW - 1.2 : 4.0) / wd), cy = BOXTOP - ht * k / 2;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([BOXX, cy, 0]);
    const left = BOXX - wd / 2 + 0.35, top = cy + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + ind[i] + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    if (k < 1) g.scale(k);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function unbox() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // a labelled program box
  function tag(s, color, pos, w, h = 0.7, size = 22) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t = T(s, size, color, false, true); t.moveTo(pos);
    return new M.VGroup(r, t);
  }
  // a block of many small cards: the "thousands", the "hundred", the "whole"
  function tinyGrid(cx, cy, cols, rows, px, py, w, h, color, op = 0.35) {
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const q = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1 });
      q.setFill(color, op); q.moveTo([cx + (c - (cols - 1) / 2) * px, cy - (r - (rows - 1) / 2) * py, 0]); out.push(q);
    }
    return out;
  }
  const recolor = (q, color, op = 0.85) => { const r = new M.Rectangle({ width: q.getWidth(), height: q.getHeight(), color, strokeWidth: 1 }); r.setFill(color, op); r.moveTo(q.getCenter()); return r; };

  // 0-6 the assistant, ten held-out cards, the librarians' marks
  const CW = P ? 1.15 : 0.95, CH = P ? 1.2 : 1.1;
  const cardAt = k => P ? [(k % 5 - 2) * 1.4, k < 5 ? 1.0 : -1.0, 0] : [(k - 4.5) * 1.15, 0.3, 0];
  const asst = tag('ASSISTANT A', BLUE, P ? [0, -3.0, 0] : [-4.3, -2.15, 0], 2.8);
  const asstBig = tag('ASSISTANT A', BLUE, P ? [0, 0.6, 0] : [0, 0.2, 0], 4.2, 1.1, 30);
  const asstSub = T('answers questions about the library', P ? 17 : 18, C.muted); asstSub.moveTo(P ? [0, -0.3, 0] : [0, -0.7, 0]);
  await until(S(0)); await play(new M.FadeIn(asstBig), new M.FadeIn(asstSub), ...say('OUR LIBRARY ASSISTANT', BLUE));

  const cards = TOPIC.map((col, k) => {
    const [x, y] = cardAt(k);
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color: col, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const strip = new M.Rectangle({ width: CW - 0.2, height: 0.1, color: col, strokeWidth: 1 }); strip.setFill(col, 0.85); strip.moveTo([x, y + CH / 2 - 0.16, 0]);
    const n = T(String(k + 1), P ? 26 : 24, C.ink, true, true); n.moveTo([x, y + 0.08, 0]);
    return new M.VGroup(r, strip, n);
  });
  await until(S(1)); await play(new M.FadeOut(asstSub), new M.ReplacementTransform(asstBig, asst), new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('10 HELD-OUT QUESTION CARDS'));

  const answers = cards.map((_, k) => {
    const [x, y] = cardAt(k);
    const b = new M.Rectangle({ width: CW * 0.6, height: 0.08, color: C.green, strokeWidth: 1 }); b.setFill(C.green, 0.8); b.moveTo([x, y - CH / 2 + 0.2, 0]);
    return b;
  });
  await until(S(2)); await play(new M.LaggedStart(answers.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.2 }), ...say('EACH CARD: AN ANSWER 2 LIBRARIANS AGREED', C.green));

  const marksA = LIB.map((ok, k) => { const [x, y] = cardAt(k); const m = mark(ok, 30); m.moveTo([x, y - CH / 2 - 0.3, 0]); return m; });
  await until(S(3)); await play(new M.LaggedStart(marksA.map(m => new M.FadeIn(m)), { lagRatio: 0.12, runTime: 1.8 }), ...say('LIBRARIANS MARKED A: ✓ RIGHT  ✗ WRONG', C.ink));
  await until(S(4)); await play(new M.LaggedStart(marksA.filter((_, k) => LIB[k]).map(m => new M.Indicate(m, { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }), ...say('A: 7 RIGHT, 3 WRONG', C.green));

  const many = P ? tinyGrid(0, -4.6, 16, 5, 0.4, 0.22, 0.3, 0.15, C.muted) : tinyGrid(1.8, -2.15, 20, 4, 0.24, 0.2, 0.18, 0.14, C.muted);
  await until(S(5)); await play(new M.LaggedStart(many.map(q => new M.FadeIn(q)), { lagRatio: 0.02, runTime: 2.0 }), ...say('THOUSANDS OF QUESTIONS EVERY WEEK', C.amber));
  await until(S(6)); await play(...say('COULD A COMPUTER DO THE MARKING?', C.amber));

  // 7-13 a separate language model becomes the judge
  const JP = P ? [0, -1.6, 0] : [1.0, -0.5, 0];
  const judgeR = new M.RoundedRectangle({ width: P ? 3.6 : 3.0, height: 1.0, cornerRadius: 0.18, color: C.violet, strokeWidth: 2 });
  judgeR.setFill(C.card, 0.95); judgeR.moveTo(JP);
  const judgeT = T('LANGUAGE MODEL', 22, C.violet, false, true); judgeT.moveTo(JP);
  await until(S(7)); await play(new M.FadeOut(new M.VGroup(...cards, ...answers, ...marksA, ...many, asst)), new M.FadeIn(judgeR), new M.FadeIn(judgeT), ...say('LANGUAGE MODEL: LEARNED TO WRITE TEXT', C.violet));

  const asst2 = tag('ASSISTANT A', BLUE, P ? [0, 1.0, 0] : [-3.6, -0.5, 0], 2.8);
  const divider = P ? new M.DashedLine({ start: [-3, -0.3, 0], end: [3, -0.3, 0], color: C.muted })
    : new M.DashedLine({ start: [-1.3, 0.9, 0], end: [-1.3, -1.9, 0], color: C.muted });
  await until(S(8)); await play(new M.FadeIn(asst2), new M.Create(divider), ...say('SEPARATE: A NEVER MARKS ITS OWN WORK', C.violet));

  const inY = P ? [1.3, 0.55, -0.2] : [0.6, -0.5, -1.6];
  const inputs = [['QUESTION', C.cyan], ['A’S ANSWER', BLUE], ['LIBRARY GUIDE', C.amber]]
    .map(([s, c], i) => tag(s, c, P ? [0, inY[i], 0] : [-3.6, inY[i], 0], P ? 4.4 : 3.1, 0.55, 18));
  const arrows = P ? [new M.Arrow({ start: [0, -0.55, 0], end: [0, -1.05, 0], color: C.muted })]
    : inY.map(y => new M.Arrow({ start: [-1.95, y, 0], end: [-0.6, JP[1], 0], color: C.muted }));
  await until(S(9)); await play(new M.FadeOut(new M.VGroup(asst2, divider)),
    new M.LaggedStart([...inputs.map(g => new M.FadeIn(g)), ...arrows.map(a => new M.Create(a))], { lagRatio: 0.3, runTime: 2.4 }), ...say('IN: QUESTION, A’S ANSWER, GUIDE'));

  const outArrow = P ? new M.Arrow({ start: [0, -2.15, 0], end: [0, -2.85, 0], color: C.muted }) : new M.Arrow({ start: [2.6, -0.5, 0], end: [3.6, -0.5, 0], color: C.muted });
  const outText = T('✓ or ✗ ?', 30, C.amber, false, true); outText.moveTo(P ? [0, -3.35, 0] : [4.65, -0.5, 0]);
  await until(S(10)); await play(new M.Create(outArrow), new M.FadeIn(outText), ...say('ONE QUESTION: RIGHT OR WRONG?', C.amber));

  await until(S(11)); await play(new M.Transform(judgeT, T('JUDGE', 26, C.violet, false, true).moveTo(JP)), ...say('A MODEL THAT MARKS = A JUDGE', C.violet));
  await until(S(12)); await play(new M.Indicate(judgeR, { color: C.violet }), ...say('LIKE A HELPER MARKING EXAM PAPERS', C.violet));
  await until(S(13)); await play(...say('CAN WE TRUST THE JUDGE?', C.amber));

  // 14-17 two columns, one row per card
  const TX = P ? 0 : -3.2;
  const XC = P ? [-3.1, -1.4, 0.6, 2.4] : [TX - 2.3, TX - 0.8, TX + 0.9, TX + 2.3];   // card, librarians, judge, match
  const HY = P ? 1.6 : 1.25, RH = P ? 0.62 : 0.36, R0 = P ? 1.05 : 0.85;
  const rowY = i => R0 - i * RH;
  const TL = XC[0] - 0.5, TR = XC[3] + 0.6;
  const hs = P ? 18 : 15;
  const head = (s, x, c) => { const t = T(s, hs, c, false, true); t.moveTo([x, HY, 0]); return t; };
  const hLib = head('LIBRARIANS', XC[1], C.amber), hJud = head('JUDGE', XC[2], C.violet);
  const hCard = head('CARD', XC[0], C.muted), hMatch = head('MATCH?', XC[3], C.muted);
  const libMarks = LIB.map((ok, i) => { const m = mark(ok); m.moveTo([XC[1], rowY(i), 0]); return m; });
  PILL = P ? [0, 2.25, 0] : [TX, 1.85, 0];
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(judgeR, judgeT, ...inputs, ...arrows, outArrow, outText)), new M.FadeIn(hLib), new M.LaggedStart(libMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.1, runTime: 1.4 }), ...say('REFERENCE = THE MARKS WE TRUST MOST', C.amber));

  const yb = rowY(9) - RH / 2;
  const rules = [new M.Line({ start: [TL, HY - (P ? 0.27 : 0.22), 0], end: [TR, HY - (P ? 0.27 : 0.22), 0], color: C.muted, strokeWidth: 2 }),
    ...[0, 1, 2].map(j => { const x = (XC[j] + XC[j + 1]) / 2; return new M.Line({ start: [x, HY + 0.2, 0], end: [x, yb, 0], color: C.line, strokeWidth: 2 }); })];
  const nums = LIB.map((_, i) => { const t = T(String(i + 1), P ? 22 : 18, C.ink, true); t.moveTo([XC[0], rowY(i), 0]); return t; });
  await until(S(15)); await play(new M.LaggedStart(rules.map(l => new M.Create(l)), { lagRatio: 0.2, runTime: 1.2 }), new M.FadeIn(new M.VGroup(hCard, hJud, hMatch)),
    new M.LaggedStart(nums.map(n => new M.FadeIn(n)), { lagRatio: 0.1, runTime: 1.6 }), ...say('TWO COLUMNS · ONE ROW PER CARD'));

  const judMarks = JUD.map((ok, i) => { const m = mark(ok); m.moveTo([XC[2], rowY(i), 0]); return m; });
  await until(S(16)); await play(new M.LaggedStart(libMarks.map(m => new M.Indicate(m, { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }), ...say('LEFT: LIBRARIANS', C.amber));
  await until(S(16) + 2.2); await play(new M.LaggedStart(judMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.1, runTime: 1.6 }), ...say('RIGHT: THE JUDGE', C.violet));

  const hlRect = (a, b, color = C.amber) => {
    const r = new M.Rectangle({ width: TR - TL, height: (b - a + 1) * RH, color, strokeWidth: 2.5 });
    r.moveTo([(TL + TR) / 2, (rowY(a) + rowY(b)) / 2, 0]); return r;
  };
  const hl = hlRect(0, 0);
  await until(S(17)); await play(new M.Create(hl), ...say('WALK DOWN THE ROWS, ONE CARD AT A TIME', C.amber));

  // 18-23 card one disagrees: the judge used today's guide
  const match = LIB.map((v, i) => {
    const same = v === JUD[i], t = T(same ? '=' : '≠', P ? 26 : 24, same ? C.green : C.pink, true, true);
    t.moveTo([XC[3], rowY(i), 0]); return t;
  });
  await until(S(18)); await play(new M.Indicate(libMarks[0], { color: C.pink }), ...say('CARD 1: LIBRARIANS SAY ✗', C.ink));
  await until(S(18) + 1.6); await play(new M.Indicate(judMarks[0], { color: C.green }), ...say('CARD 1: JUDGE SAYS ✓', C.violet));
  await until(S(18) + 3.0); await play(new M.FadeIn(match[0]), new M.Flash(match[0], { color: C.pink }), ...say('CARD 1: THEY DISAGREE', C.pink));

  await until(S(19)); await play(...fbox(['card 1 asked: 15 February', ['Sunday opening then: noon', C.amber]], C.amber), ...say('WHY?', C.amber));
  await until(S(20)); await play(...fbox(['asked 15 Feb: opens at noon', 'A answered:   10 a.m.', ['today’s guide: 10 a.m.', C.cyan]], C.amber));
  await until(S(21)); await play(...fbox(['A answered:    10 a.m.', ['today’s guide: 10 a.m.', C.cyan], ['judge: match → ✓ right', C.violet]], C.violet),
    new M.Indicate(judMarks[0], { color: C.violet }), ...say('JUDGE CHECKED TODAY’S GUIDE', C.violet));
  await until(S(22)); await play(...fbox(['rule on 15 Feb: noon', 'rule today:     10 a.m.', ['judge used today’s rule', C.pink]], C.pink), ...say('WRONG DAY’S RULES', C.pink));
  await until(S(23)); await play(...say('SAME MISTAKE AS IN “ANSWER CORRECTNESS”', C.muted));

  // 24-29 the other rows
  const agreeRows = (a, b, text) => play(new M.Transform(hl, hlRect(a, b)), ...unbox(),
    new M.LaggedStart(match.slice(a, b + 1).map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...say(text, C.green));
  await until(S(24)); await agreeRows(1, 3, 'CARDS 2, 3, 4: BOTH ✓ → AGREE');
  await until(S(25)); await agreeRows(4, 4, 'CARD 5: BOTH ✗ → AGREE');
  await until(S(26)); await agreeRows(5, 7, 'CARDS 6, 7, 8: BOTH ✓ → AGREE');
  await until(S(27)); await agreeRows(8, 8, 'CARD 9: BOTH ✗ → AGREE');
  await until(S(28)); await play(new M.Transform(hl, hlRect(9, 9, C.pink)), new M.Indicate(libMarks[9], { color: C.green }), ...say('CARD 10: LIBRARIANS SAY ✓', C.ink));
  await until(S(28) + 1.8); await play(new M.Indicate(judMarks[9], { color: C.pink }), ...say('CARD 10: JUDGE SAYS ✗', C.violet));
  await until(S(28) + 3.0); await play(new M.FadeIn(match[9]), new M.Flash(match[9], { color: C.pink }), ...say('CARD 10: THEY DISAGREE AGAIN', C.pink));
  await until(S(29)); await play(...say('A JUDGE MAKES MISTAKES TOO', C.muted));

  // 30-33 count, then percent on a hundred squares
  const eq = match.filter((_, i) => LIB[i] === JUD[i]);
  await until(S(30)); await play(new M.FadeOut(hl), new M.LaggedStart(eq.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.15, runTime: 2.0 }),
    ...fbox(['rows that match: 8', 'all rows:        10'], C.green), ...say('AGREE ON 8 OF 10 CARDS', C.green));

  const hundred = P ? tinyGrid(0, -5.9, 10, 10, 0.13, 0.13, 0.11, 0.11, C.muted) : tinyGrid(3.9, -1.5, 10, 10, 0.14, 0.14, 0.12, 0.12, C.muted);
  const hLabel = T('100 squares', 15, C.muted); hLabel.moveTo(P ? [2.2, -5.9, 0] : [3.9, -2.55, 0]);
  await until(S(31)); await play(new M.LaggedStart(hundred.map(q => new M.FadeIn(q)), { lagRatio: 0.02, runTime: 1.6 }), new M.FadeIn(hLabel), ...say('PERCENT = OUT OF EVERY HUNDRED'));
  await until(S(32)); await play(new M.LaggedStart(hundred.filter((_, i) => i % 10 < 8).map(q => new M.Transform(q, recolor(q, C.green))), { lagRatio: 0.02, runTime: 2.0 }),
    new M.Transform(hLabel, T('80 of 100', 15, C.green, false, true).moveTo(hLabel.getCenter())),
    ...fbox(['8 out of 10', '= 80 out of 100', ['= 80 percent', C.green]], C.green), ...say('8 OF 10 = 80 OF 100 = 80%', C.green));
  await until(S(33)); await play(...fbox(['8 of 10 = 80 percent', ['= agreement rate', C.green]], C.green), ...say('THIS SHARE = THE AGREEMENT RATE', C.green));

  // 34-37 the formula
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(...hundred, hLabel)), ...say('FORMULA = A SHORT RULE', C.cyan));
  await until(S(35)); await play(...fbox(['agreement rate =', ['  cards where marks match', C.green], '  ÷ number of cards']));
  await until(S(36)); await play(new M.LaggedStart(eq.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.12, runTime: 1.6 }), ...say('COUNT THE MATCHING ROWS…', C.green));
  await until(S(36) + 2.2); await play(new M.LaggedStart(nums.map(n => new M.Indicate(n, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.6 }), ...say('…THEN ÷ ALL THE ROWS', C.cyan));
  await until(S(37)); await play(...fbox(['agreement rate', '  = 8 ÷ 10', ['  = 80 percent', C.green]], C.green), ...say('8 ÷ 10 = 80%', C.green));

  // 38-43 what it is for: check on a sample, then let the judge mark
  const whole = P ? tinyGrid(0, -5.9, 16, 5, 0.4, 0.22, 0.3, 0.15, C.violet) : tinyGrid(3.9, -1.4, 14, 6, 0.32, 0.24, 0.24, 0.17, C.violet);
  await until(S(38)); await play(...unbox(), new M.LaggedStart(whole.map(q => new M.FadeIn(q)), { lagRatio: 0.01, runTime: 1.6 }), ...say('A JUDGE MARKS THOUSANDS, FAST', C.violet));
  await until(S(39)); await play(new M.LaggedStart(libMarks.map(m => new M.Indicate(m, { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }), ...say('FIRST: CHECK ON CARDS PEOPLE MARKED', C.amber));
  const step = Math.floor(whole.length / 10), sample = Array.from({ length: 10 }, (_, j) => whole[j * step + (j % 3)]);
  await until(S(40)); await play(new M.LaggedStart(sample.map(q => new M.Transform(q, recolor(q, C.amber))), { lagRatio: 0.15, runTime: 1.4 }), ...say('SAMPLE = SMALL GROUP FROM THE WHOLE', C.amber));
  await until(S(40) + 2.0); await play(new M.LaggedStart(nums.map(n => new M.Indicate(n, { color: C.amber })), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox(['whole: thousands of answers', ['sample: our 10 cards', C.amber]], C.amber));
  await until(S(41)); await play(...fbox(['agreement rate = 80%', ['judge’s mark = people’s mark', C.green], ['on 8 of every 10 cards', C.green]], C.green), ...say('HOW OFTEN THE JUDGE MATCHES PEOPLE', C.green));
  await until(S(42)); await play(...fbox(['match:    8 of 10', ['no match: 2 of 10', C.pink], ['cost of a wrong mark?', C.amber]], C.amber), ...say('80% GOOD ENOUGH? DEPENDS ON THE COST', C.amber));
  await until(S(43)); await play(...unbox(), new M.LaggedStart(whole.filter(q => !sample.includes(q)).map(q => new M.Transform(q, recolor(q, C.violet))), { lagRatio: 0.01, runTime: 1.8 }),
    ...say('JUDGE MARKS · LIBRARIANS SPOT-CHECK', C.violet));

  // 44-46 the trap: the totals
  const TY = P ? rowY(9) - 0.65 : rowY(9) - 0.45, LY = TY + (P ? 0.32 : 0.22);
  const totLine = new M.Line({ start: [TL, LY, 0], end: [TR, LY, 0], color: C.muted, strokeWidth: 2 });
  const totLabel = T('TOTAL', P ? 16 : 15, C.muted, false, true); totLabel.moveTo([XC[0], TY, 0]);
  await until(S(44)); await play(new M.FadeOut(new M.VGroup(...whole)), new M.Create(totLine), new M.FadeIn(totLabel), ...say('THE TRAP: LOOK AT THE TOTALS', C.pink));

  const totLib = T('7 ✓', 20, C.green, true, true); totLib.moveTo([XC[1], TY, 0]);
  const totJud = T('7 ✓', 20, C.green, true, true); totJud.moveTo([XC[2], TY, 0]);
  await until(S(45)); await play(new M.LaggedStart(libMarks.filter((_, i) => LIB[i]).map(m => new M.Indicate(m, { color: C.green })), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(totLib), ...say('LIBRARIANS: 7 RIGHT', C.amber));
  await until(S(45) + 2.0); await play(new M.LaggedStart(judMarks.filter((_, i) => JUD[i]).map(m => new M.Indicate(m, { color: C.green })), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(totJud), ...say('JUDGE: ALSO 7 RIGHT', C.violet));
  const totEq = T('=', 24, C.amber, true, true); totEq.moveTo([XC[3], TY, 0]);
  await until(S(46)); await play(new M.FadeIn(totEq), new M.Indicate(totLib, { color: C.amber }), new M.Indicate(totJud, { color: C.amber }), ...say('7 AND 7: LOOKS LIKE PERFECT AGREEMENT', C.amber));

  // 47-50 +1 and -1 cancel inside the judge's total
  const hl2 = hlRect(0, 0, C.pink);
  const plus1 = T('+1', 24, C.pink, true, true); plus1.moveTo([TR + 0.4, rowY(0), 0]);
  const minus1 = T('−1', 24, C.pink, true, true); minus1.moveTo([TR + 0.4, rowY(9), 0]);
  await until(S(47)); await play(new M.Create(hl2), new M.Indicate(judMarks[0], { color: C.pink }), new M.FadeIn(plus1), ...say('CARD 1: WRONG MARKED ✓ → JUDGE +1', C.pink));
  await until(S(48)); await play(new M.Transform(hl2, hlRect(9, 9, C.pink)), new M.Indicate(judMarks[9], { color: C.pink }), new M.FadeIn(minus1), ...say('CARD 10: RIGHT MARKED ✗ → JUDGE −1', C.pink));
  await until(S(49)); await play(...fbox(['librarians’ total: 7', ['judge: 7 + 1 − 1 = 7', C.amber]], C.amber), new M.Indicate(totJud, { color: C.amber }), ...say('+1 AND −1 CANCEL OUT', C.amber));
  await until(S(50)); await play(new M.FadeOut(hl2), new M.Indicate(match[0], { color: C.pink }), new M.Indicate(match[9], { color: C.pink }), ...say('2 DISAGREEMENTS HIDDEN IN THE TOTAL', C.pink));

  // 51-53 card by card, more cards, recap
  await until(S(51)); await play(new M.FadeOut(new M.VGroup(plus1, minus1)), ...unbox(),
    new M.LaggedStart(match.map(t => new M.Indicate(t)), { lagRatio: 0.12, runTime: 2.0 }), ...say('COMPARE CARD BY CARD, NOT TOTALS', C.green));
  await until(S(52)); await play(new M.LaggedStart(nums.map(n => new M.Indicate(n, { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }),
    ...fbox(['10 cards: a small sample', ['check more cards first', C.amber]], C.amber), ...say('10 CARDS IS VERY FEW: CHECK MORE', C.amber));
  await until(S(53)); await play(...fbox(['agreement rate = 8 ÷ 10 = 80%', ['measured card by card', C.green]], C.green), ...say('A JUDGE IS USEFUL ONLY AFTER CHECKING', C.green));
}

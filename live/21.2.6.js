// 21.2.6 Abstention evaluation: answer or say "not sure" (live lesson, script.v5.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  // the ten held-out cards of chapter 21.2: [card, confidence %, right?]
  const D = [['Q1', 65, false], ['Q2', 95, true], ['Q3', 90, true], ['Q4', 90, true], ['Q5', 50, false],
    ['Q6', 85, true], ['Q7', 80, true], ['Q8', 70, true], ['Q9', 40, false], ['Q10', 60, true]];
  const CX = P ? -0.9 : -3.6, CW = P ? 3.3 : 2.6, CH = P ? 0.52 : 0.36, TOP = P ? 1.3 : 1.25, PITCH = P ? 0.6 : 0.42;
  const GX = P ? 1.75 : 1.6, GY = P ? 1.2 : 1.0, GP = P ? 0.62 : 0.5;
  const LX = P ? 2.2 : -1.1, TX = P ? -3.3 : -5.6, CS = P ? 20 : 16;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.42, 0] : [3.9, 0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const gpos = i => [(i < 5 ? -1 : 1) * GX, GY - (i % 5) * GP, 0];
  const cpos = r => [CX, TOP - r * PITCH, 0];
  const ly = n => TOP - (n - 0.5) * PITCH;

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
    const maxw = P ? FW - 1.2 : 5.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0-4 a question to the library's chat assistant
  function person(x, y) {
    const head = new M.Circle({ radius: 0.14, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, y + 0.36, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, y + 0.02, 0]);
    const lab = T('you', 15, C.muted); lab.moveTo([x, y - 0.32, 0]);
    return new M.VGroup(head, body, lab);
  }
  function robot(x, y) {
    const face = new M.RoundedRectangle({ width: 0.76, height: 0.58, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
    face.setFill(C.card, 0.95); face.moveTo([x, y, 0]);
    const eyes = [-0.16, 0.16].map(dx => new M.Dot({ point: [x + dx, y + 0.05, 0], radius: 0.06, color: C.cyan }));
    const ant = new M.Line({ start: [x, y + 0.29, 0], end: [x, y + 0.47, 0], color: C.cyan, strokeWidth: 2 });
    const tip = new M.Dot({ point: [x, y + 0.5, 0], radius: 0.05, color: C.cyan });
    const lab = T('assistant', 15, C.muted); lab.moveTo([x, y - 0.55, 0]);
    return new M.VGroup(face, ...eyes, ant, tip, lab);
  }
  function bubble(lines, color, pos, maxw) {
    const size = P ? 19 : 20, lh = 0.4;
    const texts = lines.map(s => T(s, size, C.ink));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.4, ht = lines.length * lh + 0.3;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.2, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    texts.forEach((t, i) => t.moveTo([pos[0], pos[1] + ht / 2 - 0.15 - lh / 2 - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    if (wd > maxw) g.scale(maxw / wd);
    return g;
  }
  const ME = P ? [-3.2, 0.9] : [-5.8, 0.6], BOT = P ? [3.2, -1.2] : [5.8, -1.1];
  const QB = P ? [0.45, 0.9, 0] : [-2.6, 0.6, 0], AB = P ? [-0.45, -1.2, 0] : [2.6, -1.1, 0], BMAX = P ? 5.8 : 5.5;
  const me = person(...ME), bot = robot(...BOT);
  const qb = bubble(['What time does the library', 'open on Sunday?'], C.muted, QB, BMAX);
  const ab = bubble(['It opens at ten.'], C.pink, AB, BMAX);
  const cross = T('✗  wrong', 18, C.pink, false, true); cross.moveTo([AB[0], AB[1] - 0.75, 0]);
  await until(S(0));
  await play(new M.LaggedStart([new M.FadeIn(me), new M.FadeIn(qb), new M.FadeIn(bot), new M.FadeIn(ab), new M.FadeIn(cross)], { lagRatio: 0.5, runTime: 3.2 }),
    ...say('A WRONG ANSWER', C.pink));
  const ns = bubble(['I’m not sure,', 'please ask the front desk.'], C.green, AB, BMAX);
  await until(S(1)); await play(new M.FadeOut(new M.VGroup(ab, cross)), new M.FadeIn(ns), ...say('OR: “I’M NOT SURE”?', C.green));
  const defLines = P ? ['language model:', 'a computer program that writes answers in sentences']
    : ['language model: a computer program that writes answers in sentences'];
  const defs = defLines.map((s, i) => {
    const t = T(s, 18, C.violet);
    if (t.getWidth() > FW - 0.8) t.scale((FW - 0.8) / t.getWidth());
    t.moveTo([0, (P ? -2.75 : -2.6) - i * 0.45, 0]); return t;
  });
  const def = new M.VGroup(...defs);
  await until(S(2)); await play(new M.FadeIn(def), new M.Indicate(bot, { color: C.violet }), ...say('ASSISTANT = LANGUAGE MODEL', C.violet));
  await until(S(3)); await play(new M.Indicate(ns, { color: C.green }), ...say('SAYING “NOT SURE” = ABSTAINING', C.green));
  await until(S(4)); await play(...say('WHEN TO ABSTAIN?  HOW TO MEASURE IT?', C.amber));

  // 5-10 the ten held-out cards
  const off = [[0, 0], [-CW / 2 + (P ? 0.42 : 0.36), 0], [P ? 0.1 : 0.05, 0], [CW / 2 - 0.3, 0]];
  const at = (c, k) => [c[0] + off[k][0], c[1] + off[k][1], 0];
  const cards = D.map(([q, conf, right], i) => {
    const c = gpos(i);
    const rect = new M.Rectangle({ width: CW, height: CH, color: C.cyan, strokeWidth: 2 }); rect.setFill(C.card, 0.95); rect.moveTo(c);
    const qlab = T(q, CS, C.ink, true, true); qlab.moveTo(at(c, 1));
    const cl = T(conf + '%', CS, C.amber, true); cl.moveTo(at(c, 2));
    const mark = T(right ? '✓' : '✗', CS + 2, right ? C.green : C.pink, false, true); mark.moveTo(at(c, 3));
    return { q, conf, right, col: right ? C.green : C.pink, rect, qlab, cl, mark, parts: [rect, qlab, cl, mark] };
  });
  const sorted = cards.slice().sort((a, b) => b.conf - a.conf);
  const tint = r => { const c = sorted[r]; c.rect.setColor(c.col); c.rect.setFill(c.col, 0.16); };
  const dim = n => sorted.forEach((c, r) => { if (r < n) tint(r); else { c.rect.setColor(C.muted); c.rect.setFill(C.bg, 0.9); } });

  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(me, qb, bot, ns, def)),
    new M.LaggedStart(cards.map(c => new M.LaggedStart([new M.FadeIn(c.rect), new M.FadeIn(c.qlab)], { lagRatio: 0 })), { lagRatio: 0.12, runTime: 1.8 }),
    ...say('10 HELD-OUT QUESTION CARDS'));
  const hold = new M.Rectangle({ width: 2 * GX + CW + 0.3, height: 4 * GP + CH + 0.3, color: C.violet, strokeWidth: 2 });
  hold.moveTo([0, GY - 2 * GP, 0]);
  await until(S(6)); await play(new M.Create(hold), ...say('SET ASIDE: NEVER USED WHILE BUILDING', C.violet));
  await until(S(7));
  await play(new M.FadeOut(hold), new M.LaggedStart(cards.map(c => new M.FadeIn(c.mark)), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('7 RIGHT ✓    3 WRONG ✗', C.green));
  await until(S(8));
  await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c.cl)), { lagRatio: 0.15, runTime: 1.8 }), ...say('CONFIDENCE = HOW SURE IT IS', C.amber));

  // 9-10 the confidence scale
  const SY = P ? -2.6 : -1.9, SL = P ? 3.3 : 4.0, sx = v => -SL + v / 100 * 2 * SL;
  const scale = new M.Line({ start: [sx(0), SY, 0], end: [sx(100), SY, 0], color: C.muted, strokeWidth: 3 });
  const sticks = [0, 50, 100].map(v => new M.VGroup(
    new M.Line({ start: [sx(v), SY - 0.08, 0], end: [sx(v), SY + 0.08, 0], color: C.muted }),
    T(v + '%', 17, C.muted, true).moveTo([sx(v), SY - 0.35, 0])));
  await until(S(9)); await play(new M.Create(scale), new M.FadeIn(new M.VGroup(...sticks)), ...say('0% TO 100%   PERCENT = OUT OF 100', C.amber));
  const guess = T('closer to guessing', 16, C.muted); guess.moveTo([sx(0) + guess.getWidth() / 2, SY + 0.4, 0]);
  const sure = T('sure', 16, C.green, false, true); sure.moveTo([sx(100) - sure.getWidth() / 2, SY + 0.4, 0]);
  await until(S(10)); await play(new M.FadeIn(guess), new M.FadeIn(sure), ...say('HIGH = SURE    LOW = CLOSER TO GUESSING', C.green));

  // 11 stack the cards: most sure on top
  await until(S(11));
  await play(new M.FadeOut(new M.VGroup(scale, ...sticks, guess, sure)), ...say('MOST SURE ON TOP, LEAST SURE AT THE BOTTOM', C.amber));
  await play(new M.LaggedStart(sorted.map((c, r) => {
    const from = c.rect.getCenter(), to = cpos(r), dx = to[0] - from[0], dy = to[1] - from[1];
    return new M.LaggedStart(c.parts.map(p => { const q = p.getCenter(); return new M.Transform(p, p.copy().moveTo([q[0] + dx, q[1] + dy, 0])); }), { lagRatio: 0 });
  }), { lagRatio: 0.15, runTime: 2.6 }));
  sorted.forEach(c => { c.rect.setColor(C.cyan); c.rect.setFill(C.card, 0.95); });

  // 12-18 read the column, top to bottom
  const read = (rs, text, color, extra = []) => {
    rs.forEach(tint);
    return [new M.LaggedStart(rs.map(r => new M.Indicate(sorted[r].mark, { color: sorted[r].col })), { lagRatio: 0.6, runTime: rs.length > 1 ? 1.5 : 0.9 }),
      ...extra, ...say(text, color)];
  };
  await until(S(12)); await play(...read([0, 1], '95% ✓    90% ✓', C.green));
  await until(S(13)); await play(...read([2, 3], '90% ✓    85% ✓', C.green));
  await until(S(14)); await play(...read([4, 5], '80% ✓    70% ✓', C.green));
  await until(S(15)); await play(...read([6], '65% ✗  =  CARD Q1', C.pink, [new M.Indicate(sorted[6].qlab, { color: C.pink })]));
  await until(S(16)); await play(...read([7], '60% ✓', C.green));
  await until(S(17)); await play(...read([8], '50% ✗  =  CARD Q5', C.pink, [new M.Indicate(sorted[8].qlab, { color: C.pink })]));
  await until(S(18)); await play(...read([9], '40% ✗  =  CARD Q9, AT THE BOTTOM', C.pink, [new M.Indicate(sorted[9].qlab, { color: C.pink })]));
  await until(S(19));
  await play(new M.LaggedStart([6, 8, 9].map(r => new M.Indicate(sorted[r].rect, { color: C.pink })), { lagRatio: 0.4, runTime: 2.0 }),
    ...say('WRONG ANSWERS: MOSTLY NEAR THE BOTTOM', C.pink));

  // 20-21 the line across the column = threshold
  const mkLine = y => new M.DashedLine({ start: [CX - CW / 2 - 0.2, y, 0], end: [CX + CW / 2 + 0.2, y, 0], color: C.amber });
  const mkAns = y => { const t = T('ANSWERS ↑', CS, C.green, true, true); t.moveTo([LX, y + 0.24, 0]); return t; };
  const mkAbs = y => { const t = T('ABSTAINS ↓', CS, C.muted, true, true); t.moveTo([LX, y - 0.24, 0]); return t; };
  const mkTag = (s, y) => { const t = T(s, CS, C.amber, true, true); t.moveTo([TX, y, 0]); return t; };
  let line = mkLine(ly(5)), ans = mkAns(ly(5)), abs = mkAbs(ly(5)), tag = null;
  function moveLine(n, label) {
    const y = ly(n), old = [ans, abs, tag].filter(Boolean);
    dim(n);
    ans = n > 0 ? mkAns(y) : null; abs = n < 10 ? mkAbs(y) : null; tag = label ? mkTag(label, y) : null;
    return [new M.Transform(line, mkLine(y)), ...old.map(o => new M.FadeOut(o)), ...[ans, abs, tag].filter(Boolean).map(o => new M.FadeIn(o))];
  }
  await until(S(20)); dim(5);
  await play(new M.Create(line), new M.FadeIn(ans), new M.FadeIn(abs), ...say('ABOVE: ANSWER    BELOW: ABSTAIN', C.amber));
  await until(S(21)); await play(new M.Indicate(line, { color: C.amber }), ...say('CUT-OFF LINE = THRESHOLD', C.amber));

  // 22-25 two questions for each threshold
  await until(S(22)); await play(...say('TWO QUESTIONS FOR EACH THRESHOLD', C.violet));
  await until(S(23));
  await play(new M.LaggedStart(sorted.slice(0, 5).map(c => new M.Indicate(c.rect, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }),
    ...fbox(['1. how many answered?', ['   share = COVERAGE', C.cyan]]), ...say('COVERAGE = SHARE ANSWERED', C.cyan));
  await until(S(24)); await play(...fbox(['2. of the answers given,', '   how many wrong?', ['   share = ERROR RATE', C.pink]], C.pink), ...say('ERROR RATE = SHARE OF ANSWERS WRONG', C.pink));
  await until(S(25));
  await play(new M.Indicate(abs, { color: C.green }), ...fbox(['error rate counts only', 'the answers given', ['“not sure” = no mistake', C.green]], C.green),
    ...say('“NOT SURE” IS NOT A MISTAKE', C.green));

  // 26-29 line at the bottom: answer everything
  const TBX = P ? 0 : 3.9, TY = P ? -5.0 : -1.55, TP = P ? 0.48 : 0.4, TS = P ? 20 : 18;
  const tcw = T('0000000000', TS, C.ink, true).getWidth() / 10;
  const trow = (s, k, color) => { const t = T(s, TS, color, true); t.moveTo([TBX - tcw * 15 + t.getWidth() / 2, TY - k * TP, 0]); return t; };
  const hdr = trow('line      coverage  error rate', 0, C.muted);
  const rows = [trow('bottom    100%      30%', 1, C.ink), trow('55%       80%       12.5%', 2, C.ink), trow('75%       50%       0%', 3, C.ink)];
  await until(S(26)); await play(...moveLine(10, 'bottom'), ...clearBox(), ...say('LINE AT THE BOTTOM: ANSWER ALL', C.amber));
  await until(S(27));
  await play(new M.LaggedStart(sorted.map(c => new M.Indicate(c.rect, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.8 }),
    ...fbox(['coverage = 10 ÷ 10', ['         = 100%', C.cyan]]), ...say('10 ANSWERED OUT OF 10', C.cyan));
  await until(S(28));
  await play(new M.LaggedStart([6, 8, 9].map(r => new M.Indicate(sorted[r].mark, { color: C.pink })), { lagRatio: 0.4, runTime: 1.6 }),
    ...fbox(['coverage   = 10 ÷ 10 = 100%', ['error rate = 3 ÷ 10', C.pink], ['           = 30 ÷ 100', C.pink]], C.pink));
  await until(S(29));
  await play(new M.FadeIn(hdr), new M.FadeIn(rows[0]), ...fbox(['coverage   = 10 ÷ 10 = 100%', ['error rate = 3 ÷ 10 = 30%', C.pink]], C.pink), ...say('ERROR RATE = 30%', C.pink));

  // 30-35 line at 55%
  await until(S(30)); await play(...moveLine(8, '55%'), ...clearBox(), ...say('LINE UP TO 55%', C.amber));
  await until(S(31));
  await play(new M.LaggedStart([8, 9].map(r => new M.Indicate(sorted[r].qlab, { color: C.violet })), { lagRatio: 0.5, runTime: 1.4 }),
    ...say('ABSTAINS ON CARDS Q5 AND Q9', C.muted));
  await until(S(32));
  await play(new M.LaggedStart(sorted.slice(0, 8).map(c => new M.Indicate(c.rect, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.8 }),
    ...fbox(['coverage = 8 ÷ 10 = 80%']), ...say('8 ANSWERED OUT OF 10', C.cyan));
  await until(S(33));
  await play(new M.Indicate(sorted[6].mark, { color: C.pink }), ...fbox(['coverage   = 8 ÷ 10 = 80%', ['error rate = 1 ÷ 8', C.pink]], C.pink),
    ...say('ONLY Q1 WRONG: 1 OUT OF 8', C.pink));
  const BX = P ? 2.9 : 0.4, BT = P ? 1.3 : 1.0, BH = 0.4;
  const segs = Array.from({ length: 8 }, (_, k) => {
    const y = BT - (k + 0.5) * BH;
    const r = new M.Rectangle({ width: 0.9, height: BH * 0.92, color: C.violet, strokeWidth: 1.5 }); r.setFill(C.violet, 0.22); r.moveTo([BX, y, 0]);
    const t = T('12.5', P ? 17 : 15, C.ink, true); t.moveTo([BX, y, 0]);
    return new M.VGroup(r, t);
  });
  const barHead = T('100 ÷ 8', 17, C.violet, true); barHead.moveTo([BX, BT + 0.25, 0]);
  await until(S(34));
  await play(new M.FadeIn(barHead), new M.LaggedStart(segs.map(g => new M.FadeIn(g)), { lagRatio: 0.3, runTime: 2.4 }),
    ...say('100 SHARED INTO 8 PARTS: 12.5 EACH', C.violet));
  await until(S(35));
  await play(new M.FadeIn(rows[1]), ...fbox(['coverage   = 8 ÷ 10 = 80%', ['error rate = 1 ÷ 8 = 12.5%', C.pink]], C.pink), ...say('ERROR RATE = 12.5%', C.pink));

  // 36-39 line at 75%
  await until(S(36)); await play(...moveLine(5, '75%'), new M.FadeOut(new M.VGroup(barHead, ...segs)), ...clearBox(), ...say('LINE UP TO 75%', C.amber));
  await until(S(37));
  await play(new M.LaggedStart(sorted.slice(0, 5).map(c => new M.Indicate(c.cl, { color: C.green })), { lagRatio: 0.3, runTime: 2.0 }),
    ...say('5 ABOVE: 95 · 90 · 90 · 85 · 80', C.green));
  await until(S(38));
  await play(new M.LaggedStart(sorted.slice(0, 5).map(c => new M.Indicate(c.rect, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['coverage = 5 ÷ 10 = 50%']), ...say('5 ANSWERED OUT OF 10', C.cyan));
  await until(S(39));
  await play(new M.LaggedStart(sorted.slice(0, 5).map(c => new M.Indicate(c.mark, { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }),
    new M.FadeIn(rows[2]), ...fbox(['coverage   = 5 ÷ 10 = 50%', ['error rate = 0 ÷ 5 = 0%', C.green]], C.green), ...say('ALL 5 RIGHT: ERROR RATE 0%', C.green));

  // 40-44 side by side: the tradeoff
  await until(S(40)); await play(...moveLine(10, 'bottom'), ...clearBox(), new M.Indicate(rows[0], { color: C.amber }), ...say('SIDE BY SIDE', C.amber));
  await until(S(41)); await play(...moveLine(8, '55%'), new M.Indicate(rows[1], { color: C.amber }));
  await until(S(42)); await play(...moveLine(5, '75%'), new M.Indicate(rows[2], { color: C.amber }));
  await until(S(43));
  await play(new M.LaggedStart(rows.map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.5, runTime: 2.0 }),
    ...say('LINE ↑   COVERAGE ↓   ERROR RATE ↓', C.amber));
  await until(S(44)); await play(...say('GIVE AND TAKE = TRADEOFF', C.violet));

  // 45-47 the two measures
  await until(S(45)); await play(...say('THE SHORT VERSION', C.cyan));
  await until(S(46)); await play(...fbox(['coverage = answered ÷ questions']));
  await until(S(47)); await play(...fbox(['coverage = answered ÷ questions', ['error rate = wrong ÷ answered', C.pink]]));

  // 48-49 what it is for
  await until(S(48)); await play(new M.Indicate(rows[2], { color: C.amber }), ...say('PRICE OF SAFETY: FEWER MISTAKES, FEWER HELPED', C.amber));
  await until(S(49)); await play(new M.Indicate(line, { color: C.pink }), ...say('MISTAKES COSTLY → HIGH LINE', C.pink));
  await until((S(49) + E(49)) / 2); await play(...moveLine(8, '55%'), ...say('DESK BUSY → LOWER LINE', C.cyan));

  // 50-52 the trap: never answer
  await until(S(50));
  await play(...moveLine(0, 'top'), ...fbox(['answered      = 0', ['wrong answers = 0', C.green]], C.pink), ...say('TRAP: NEVER ANSWER, NEVER WRONG', C.pink));
  await until(S(51)); await play(...fbox(['answered      = 0', 'wrong answers = 0', ['coverage = 0 ÷ 10 = 0%', C.pink]], C.pink), ...say('COVERAGE 0%: HELPS NOBODY', C.pink));
  await until(S(52));
  await play(new M.LaggedStart(rows.map(r => new M.Indicate(r, { color: C.green })), { lagRatio: 0.4, runTime: 1.6 }),
    ...fbox([['coverage', C.cyan], ['+ error rate', C.pink], 'always together'], C.green), ...say('ALWAYS REPORT BOTH TOGETHER', C.green));

  // 53 recap
  await until(S(53));
  await play(...moveLine(5, '75%'), ...fbox(['higher threshold:', ['coverage ↓', C.cyan], ['fewer errors', C.pink]], C.amber),
    ...say('HIGHER LINE: LESS COVERAGE, FEWER ERRORS', C.amber));
}

// 21.2.11 Multilingual evaluation: the same ten cards in English and Spanish, compared card by card.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  // chapters/21.2.md: A is right on 7 of 10 in English, 5 of 10 in Spanish.
  // Card by card: both right 5, English only 2, Spanish only 0, both wrong 3 (Q1, Q5, Q9).
  const EN = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1];
  const ES = [0, 1, 0, 1, 0, 1, 1, 0, 0, 1];
  const boxOf = k => EN[k] && ES[k] ? 0 : EN[k] ? 1 : ES[k] ? 2 : 3;
  const BC = [C.green, C.amber, C.cyan, C.pink], BNAME = ['BOTH RIGHT', 'EN ONLY', 'ES ONLY', 'BOTH WRONG'];
  const BSAY = ['BOX 1: RIGHT IN BOTH', 'BOX 2: ENGLISH ONLY', 'BOX 3: SPANISH ONLY', 'BOX 4: WRONG IN BOTH'];
  const CX = P ? 0.3 : -2.2, SP = P ? 1.25 : 0.74, CW = P ? 1.05 : 0.58, CH = P ? 0.9 : 0.72;
  const YEN = P ? 1.1 : 0.95, YES = P ? 0.1 : 0.05;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.35, 0.5, 0];
  // phone: two blocks of 5 (Q1-5 above, Q6-10 below), each with its EN row and ES row
  const colx = k => P ? CX + (k % 5 - 2) * SP : CX + (k - 4.5) * SP, LABX = colx(0) - SP / 2 - 0.35;
  const ry = (k, y) => P && k >= 5 ? y - 2.45 : y, MK = P ? 1.4 : 1;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = 0.42;
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
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // a question card, its check or cross, a row tag, and the outline that pairs card k in both languages
  function card(k, y, color, name = 'Q' + (k + 1)) {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.09, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([colx(k), ry(k, y), 0]);
    const t = T(name, P ? 17 : 14, C.ink, true, true); t.moveTo([colx(k), ry(k, y) + CH * 0.22, 0]);
    return new M.VGroup(r, t);
  }
  function mark(ok, k, y) {
    const x = colx(k), m = ry(k, y) - CH * 0.17, c = ok ? C.green : C.pink;
    const seg = (a, b) => new M.Line({ start: [x + a[0] * MK, m + a[1] * MK, 0], end: [x + b[0] * MK, m + b[1] * MK, 0], color: c, strokeWidth: 4 });
    return ok ? new M.VGroup(seg([-0.12, 0.01], [-0.04, -0.08]), seg([-0.04, -0.08], [0.13, 0.11]))
      : new M.VGroup(seg([-0.1, -0.1], [0.1, 0.1]), seg([-0.1, 0.1], [0.1, -0.1]));
  }
  const tag = (s, c, y) => { const t = T(s, 18, c, true, true); t.moveTo([LABX, y, 0]); if (!P) return t; const t2 = T(s, 18, c, true, true); t2.moveTo([LABX, ry(9, y), 0]); return new M.VGroup(t, t2); };
  function outline(k, color = C.cyan) {
    const r = new M.RoundedRectangle({ width: CW + 0.14, height: YEN - YES + CH + 0.14, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.moveTo([colx(k), ry(k, (YEN + YES) / 2), 0]); return r;
  }

  // 0-3 one assistant, two languages
  const AP = P ? [0, 1.0, 0] : [-4.4, -0.3, 0];
  const ring = new M.Circle({ radius: 0.55, color: C.cyan, strokeWidth: 3 }); ring.setFill(C.cyan, 0.15); ring.moveTo(AP);
  const aLab = T('A', 34, C.cyan, false, true); aLab.moveTo(AP);
  const bot = new M.VGroup(ring, aLab);
  function person(p, color, name) {
    const head = new M.Circle({ radius: 0.14, color }); head.setFill(color, 1); head.moveTo([p[0], p[1] + 0.36, 0]);
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([p[0], p[1] + 0.02, 0]);
    const t = T(name, 18, color, true, true); t.moveTo([p[0], p[1] - 0.4, 0]);
    const dx = p[0] - AP[0], dy = p[1] + 0.2 - AP[1], n = Math.hypot(dx, dy);
    const link = new M.Line({ start: [AP[0] + dx / n * 0.7, AP[1] + dy / n * 0.7, 0], end: [p[0] - dx / n * 0.55, p[1] + 0.2 - dy / n * 0.55, 0], color: C.muted, strokeWidth: 2 });
    return [new M.VGroup(head, body, t), link];
  }
  const [enP, enL] = person(P ? [-1.7, -1.0] : [0.4, 0.7], C.violet, 'EN');
  const [esP, esL] = person(P ? [1.7, -1.0] : [0.4, -1.3], C.amber, 'ES');
  await until(S(0)); await play(new M.FadeIn(bot), new M.Create(enL), new M.FadeIn(enP), ...say('NOT ONLY ENGLISH SPEAKERS'));
  await until(S(1)); await play(new M.Create(esL), new M.FadeIn(esP), ...say('MANY WRITE IN SPANISH', C.amber));
  const LMY = P ? -2.6 : -1.65, WY = P ? -3.4 : -2.4;
  const lm = T('“The library opens at …”', P ? 18 : 20, C.muted); lm.moveTo([AP[0], LMY, 0]);
  const words = ['noon', 'ten', 'nine'].map((w, i) => { const t = T(w, 20, i ? C.muted : C.green, true, true); t.moveTo([AP[0] + (i - 1) * 1.1, WY, 0]); return t; });
  await until(S(2)); await play(new M.FadeIn(lm), new M.LaggedStart(words.map(w => new M.FadeIn(w)), { lagRatio: 0.3, runTime: 1.2 }), ...say('LANGUAGE MODEL: PREDICTS NEXT WORDS'));
  await until(S(3)); await play(new M.Indicate(bot, { color: C.amber }), new M.Indicate(esP, { color: C.amber }), ...say('AS GOOD IN SPANISH?', C.amber));

  // 4-7 the ten held-out cards, graded in English
  const enCards = EN.map((_, k) => card(k, YEN, C.violet));
  const enTag = tag('EN', C.violet, YEN);
  await until(S(4));
  await play(new M.FadeOut(new M.VGroup(bot, enP, esP, enL, esL, lm, ...words)), new M.FadeIn(enTag),
    new M.LaggedStart(enCards.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('10 TEST CARDS · KEPT ASIDE'));
  await until(S(5)); await play(new M.Indicate(enCards[0], { color: C.cyan }), ...fbox(['card = question', '     + agreed answer']), ...say('QUESTION + AGREED ANSWER'));
  await until(S(6)); await play(...fbox(['A’s answer = agreed?', ['yes → right', C.green], ['no  → wrong', C.pink]]), ...say('GRADE: RIGHT OR WRONG'));
  const enMarks = EN.map((ok, k) => mark(ok, k, YEN));
  await until(S(7)); await play(new M.LaggedStart(enMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.15, runTime: 1.6 }),
    ...fbox([['English: 7 of 10 right', C.violet]], C.violet), ...say('ENGLISH: 7 OF 10 RIGHT', C.violet));

  // 8-10 the same ten questions in Spanish: matched pairs
  const esTag = tag('ES', C.amber, YES);
  let esCards = ES.map((_, k) => card(k, YES, C.amber));
  await until(S(8)); await play(new M.FadeIn(esTag), new M.LaggedStart(esCards.map(c => new M.FadeIn(c, { shift: [0, -0.15, 0] })), { lagRatio: 0.12, runTime: 1.6 }),
    ...unbox(), ...say('SAME 10 QUESTIONS IN SPANISH', C.amber));
  let outs = EN.map((_, k) => outline(k));
  await until(S(9)); await play(new M.Create(outs[0]), ...fbox(['card 1 EN ↔ card 1 ES', 'same question', 'same agreed answer']), ...say('SAME QUESTION, SAME ANSWER'));
  await until(S(10)); await play(new M.LaggedStart(outs.slice(1).map(o => new M.Create(o)), { lagRatio: 0.15, runTime: 1.5 }), ...say('MATCHED QUESTIONS', C.green));

  // 11-15 why not ten new Spanish questions?
  const fresh = ES.map((_, k) => card(k, YES, C.muted, 'N' + (k + 1)));
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...esCards, ...outs)), new M.LaggedStart(fresh.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.2 }),
    ...unbox(), ...say('WHY NOT 10 NEW QUESTIONS?', C.muted));
  await until(S(12)); await play(new M.LaggedStart(fresh.map(c => new M.Indicate(c, { color: C.pink })), { lagRatio: 0.1, runTime: 1.6 }), ...say('NEW SET: HARDER? EASIER?', C.muted));
  await until(S(13)); await play(...fbox([['gap from the language?', C.amber], ['or from the questions?', C.muted]], C.pink), ...say('WHERE DID THE GAP COME FROM?', C.pink));
  esCards = ES.map((_, k) => card(k, YES, C.amber));
  outs = EN.map((_, k) => outline(k));
  await until(S(14)); await play(new M.FadeOut(new M.VGroup(...fresh)), new M.LaggedStart(esCards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.0 }),
    new M.LaggedStart(outs.map(o => new M.Create(o)), { lagRatio: 0.08, runTime: 1.2 }), ...unbox(), ...say('SAME QUESTIONS · ONLY LANGUAGE CHANGES', C.green));
  await until(S(15)); await play(...fbox(['same exam, two languages', ['gap ≠ easier questions', C.green]], C.green), ...say('ONE EXAM IN TWO LANGUAGES', C.green));

  // 16-22 grade in Spanish, then the difference in percentage points
  await until(S(16)); await play(new M.LaggedStart(esCards.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }), ...unbox(), ...say('GRADE A IN SPANISH', C.amber));
  const esMarks = ES.map((ok, k) => mark(ok, k, YES));
  await until(S(17)); await play(new M.LaggedStart(esMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.15, runTime: 1.6 }),
    ...fbox([['Spanish: 5 of 10 right', C.amber]], C.amber), ...say('SPANISH: 5 OF 10 RIGHT', C.amber));
  const scores = [['English 7/10 = 70%', C.violet], ['Spanish 5/10 = 50%', C.amber]];
  await until(S(18)); await play(...fbox(scores), ...say('70% vs 50%'));
  await until(S(19)); await play(...fbox([...scores, ['70% − 50% = ?', C.muted]]), ...say('% − % = PERCENTAGE POINTS'));
  await until(S(20)); await play(...fbox([...scores, ['70 − 50 = 20 points', C.amber]], C.amber), ...say('20 PERCENTAGE POINTS', C.amber));
  await until(S(21)); await play(...say('POINTS = PLAIN DIFFERENCE'));
  await until(S(22)); await play(new M.Indicate(enTag, { color: C.green }), new M.Indicate(esTag, { color: C.green }), ...say('MULTILINGUAL EVALUATION', C.green));

  // 23-29 card by card: sort the ten pairs into four boxes
  await until(S(23)); await play(new M.LaggedStart(outs.map(o => new M.Indicate(o, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.8 }), ...unbox(), ...say('COMPARE CARD BY CARD'));
  const BWD = P ? 3.5 : 1.75, BHT = P ? 1.75 : 1.9;
  const geo = b => {
    const x = P ? (b % 2 ? 1.85 : -1.85) : -5.125 + b * 1.9, y = P ? (b < 2 ? -4.1 : -6.0) : -1.75, top = y + BHT / 2;
    return { x, y, l1: top - 0.2, l2: top - 0.48, cnt: top - 0.95, tl: y - BHT / 2 + 0.3 };
  };
  const boxR = [], boxT = [];
  for (let b = 0; b < 4; b++) {
    const g = geo(b), r = new M.RoundedRectangle({ width: BWD, height: BHT, cornerRadius: 0.14, color: BC[b], strokeWidth: 2 });
    r.moveTo([g.x, g.y, 0]); boxR.push(r);
    const t1 = T('BOX ' + (b + 1), P ? 15 : 13, C.muted, true); t1.moveTo([g.x, g.l1, 0]);
    const t2 = T(BNAME[b], P ? 17 : 14, BC[b], true, true); t2.moveTo([g.x, g.l2, 0]);
    boxT.push(t1, t2);
  }
  await until(S(24)); await play(new M.LaggedStart(boxR.map(r => new M.Create(r)), { lagRatio: 0.2, runTime: 1.2 }), new M.FadeIn(new M.VGroup(...boxT)), ...say('10 PAIRS → 4 BOXES'));
  const TP = P ? 0.5 : 0.33, TS = P ? 0.42 : 0.28;
  function tile(k, b, j, n) {
    const g = geo(b), x = g.x + (j - (n - 1) / 2) * TP;
    const r = new M.Rectangle({ width: TS, height: TS, color: BC[b], strokeWidth: 1 }); r.setFill(BC[b], 0.25); r.moveTo([x, g.tl, 0]);
    const t = T(String(k + 1), P ? 15 : 12, C.ink, true, true); t.moveTo([x, g.tl, 0]);
    return new M.VGroup(r, t);
  }
  const tiles = [], counts = [];
  for (let b = 0; b < 4; b++) {
    await until(S(25 + b));
    const ks = EN.map((_, k) => k).filter(k => boxOf(k) === b), g = geo(b);
    ks.forEach(k => outs[k].setColor(BC[b]));
    tiles[b] = ks.map((k, j) => tile(k, b, j, ks.length));
    counts[b] = T(String(ks.length), P ? 30 : 28, BC[b], true, true); counts[b].moveTo([g.x, g.cnt, 0]);
    const extra = b === 3 ? ks.map(k => new M.Indicate(enMarks[k], { color: C.pink }))
      : b === 2 ? [new M.Flash(boxR[2], { color: C.cyan, flashRadius: 0.5 })] : [];
    const deal = tiles[b].length ? [new M.LaggedStart(tiles[b].map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1.2 })] : [];
    await play(...ks.map(k => new M.Indicate(outs[k], { color: BC[b] })), new M.FadeIn(counts[b]), ...deal, ...extra, ...say(`${BSAY[b]} · ${ks.length}`, BC[b]));
  }
  await until(S(29)); await play(new M.LaggedStart(counts.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.25, runTime: 1.4 }),
    ...fbox(['5 + 2 + 0 + 3', ['= 10 cards', C.green]], C.green), ...say('EVERY CARD COUNTED ONCE', C.green));

  // 30-38 where the gap comes from
  await until(S(30)); await play(...unbox(), ...say('WHERE DOES THE GAP COME FROM?', C.amber));
  await until(S(31)); await play(new M.Indicate(boxR[0], { color: C.green }), new M.Indicate(boxR[3], { color: C.pink }), ...say('BOX 1, BOX 4: SAME IN BOTH', C.muted));
  await until(S(32));
  boxR[0].setColor(C.muted); boxR[3].setColor(C.muted);
  EN.forEach((_, k) => { if (boxOf(k) === 0 || boxOf(k) === 3) outs[k].setColor(C.muted); });
  await play(...say('THEY DON’T PUSH THE GAP', C.muted));
  await until(S(33)); await play(new M.Indicate(boxR[1], { color: C.amber }), new M.Indicate(boxR[2], { color: C.cyan }), ...say('ONLY CHANGED CARDS MAKE THE GAP', C.amber));
  await until(S(34)); await play(...tiles[1].map(t => new M.Flash(t, { color: C.amber })), new M.Indicate(counts[2], { color: C.cyan }),
    ...fbox([['English only: 2', C.amber], ['Spanish only: 0', C.cyan]], C.amber), ...say('2 ONE WAY · 0 THE OTHER', C.amber));
  await until(S(35)); await play(...fbox(['2 − 0 = 2 cards', ['out of 10 cards', C.muted]], C.amber), ...say('2 − 0 = 2 CARDS', C.amber));
  await until(S(36)); await play(...fbox(['2 − 0 = 2 cards', '2 ÷ 10 = 20%', ['= the 20-point gap', C.amber]], C.amber), ...say('SAME 20-POINT GAP', C.amber));
  await until(S(37)); await play(...fbox(['gap = EN only − ES only', ['    = 2 − 0 = 2 cards', C.amber]]), ...say('GAP = EN ONLY − ES ONLY'));
  await until(S(38)); await play(...fbox(['gap = (EN only − ES only)', '      ÷ number of cards', ['    = 2 ÷ 10 = 20 points', C.amber]]), ...say('÷ NUMBER OF CARDS'));

  // 39-41 what to fix, how sure, what it is for
  const onlyEN = EN.map((_, k) => k).filter(k => boxOf(k) === 1);
  await until(S(39)); await play(...onlyEN.map(k => new M.Indicate(outs[k], { color: C.amber })), ...onlyEN.map(k => new M.Flash(esMarks[k], { color: C.pink })),
    ...say('FIX THESE TWO FIRST', C.amber));
  await until(S(40)); await play(...say('SMALL TEST: ADD MORE MATCHED CARDS', C.muted));
  await until(S(41)); await play(...unbox(), ...say('SAME QUALITY FOR EVERY LANGUAGE?', C.green));

  // 42-47 the trap: one combined score
  const BX0 = P ? -2.4 : -5.6, BLEN = P ? 5.0 : 6.0, BARY = P ? [-4.1, -5.0, -5.9] : [-1.1, -1.8, -2.5];
  function bar(i, pct, color, name) {
    const w = BLEN * pct / 100, r = new M.Rectangle({ width: w, height: 0.4, color, strokeWidth: 1 });
    r.setFill(color, 0.8); r.moveTo([BX0 + w / 2, BARY[i], 0]);
    const n = T(name, 16, color, true, true); n.moveTo([LABX, BARY[i], 0]);
    const v = T(pct + '%', 18, color, true, true); v.moveTo([BX0 + w + 0.45, BARY[i], 0]);
    return { r, n, v };
  }
  const barEN = bar(0, 70, C.violet, 'EN'), barES = bar(1, 50, C.amber, 'ES'), barAll = bar(2, 60, C.cyan, 'EN+ES');
  await until(S(42));
  await play(new M.FadeOut(new M.VGroup(...boxR, ...boxT, ...counts, ...tiles.flat())), ...say('TRAP: ONE COMBINED SCORE', C.pink));
  await play(...[barEN, barES].flatMap(b => [new M.FadeIn(b.r), new M.FadeIn(b.n), new M.FadeIn(b.v)]));
  await until(S(43)); await play(new M.Indicate(barEN.r, { color: C.cyan }), new M.Indicate(barES.r, { color: C.cyan }),
    ...fbox(['7 + 5 = 12 right', ['out of 10 + 10 = 20', C.muted]]), ...say('TOGETHER: 12 OF 20'));
  await until(S(44)); await play(new M.FadeIn(barAll.r), new M.FadeIn(barAll.n), new M.FadeIn(barAll.v),
    ...fbox(['7 + 5 = 12 right', ['12 ÷ 20 = 60%', C.cyan]]), ...say('60%: SOUNDS ACCEPTABLE', C.muted));
  await until(S(45)); await play(new M.Indicate(barES.r, { color: C.pink }), new M.Indicate(barES.v, { color: C.pink }), ...say('SPANISH: ONLY 50%', C.pink));
  await until(S(46)); await play(new M.Indicate(barAll.r, { color: C.pink }), ...say('ONE SCORE HIDES A GROUP', C.pink));
  await until(S(47)); await play(new M.FadeOut(new M.VGroup(barAll.r, barAll.n, barAll.v)), new M.Indicate(barEN.r, { color: C.green }), new M.Indicate(barES.r, { color: C.green }),
    ...say('EACH LANGUAGE, SIDE BY SIDE', C.green));

  // 48 recap
  await until(S(48)); await play(...fbox(['1 same questions', '2 card by card', '3 each language apart'], C.green), ...say('RECAP', C.green));
}

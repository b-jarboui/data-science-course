// 21.2.1 Task-specific evaluation sets: test with the questions people really ask (live lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers from chapters/21.2.md.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const BLUE = '#60a5fa';
  const TOP = [['HOURS', C.cyan, 100], ['LOANS', C.pink, 60], ['ROOMS', C.amber, 40]];
  const PCT = [50, 30, 20];
  const TEST = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2];                 // topic of Q1..Q10
  const RIGHT = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1];               // assistant A today: Q1, Q5, Q9 wrong
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -0.3, 0];
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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const noBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // drawing helpers: every part is placed from coordinates
  const at = (m, x, y) => { m.moveTo([x, y, 0]); return m; };
  const tx = (s, size, color, x, y, mono = false, bold = false) => at(T(s, size, color, mono, bold), x, y);
  const lft = (t, x, y) => at(t, x + t.getWidth() / 2, y);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const ln = (a, b, color = C.muted, sw = 2) => new M.Line({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color, strokeWidth: sw });
  function box(w, h, x, y, color, op = 0, r = 0, fill = color) {
    const b = r ? new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: 2 })
      : new M.Rectangle({ width: w, height: h, color, strokeWidth: 2 });
    if (op) b.setFill(fill, op);
    return at(b, x, y);
  }
  function person(x, y, color, k = 1) {
    const head = new M.Circle({ radius: 0.14 * k, color }); head.setFill(color, 1); head.moveTo([x, y + 0.36 * k, 0]);
    const body = new M.Arc({ radius: 0.26 * k, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y + 0.02 * k, 0]);
    return new M.VGroup(head, body);
  }
  function robot(x, y, color) {
    return new M.VGroup(box(0.72, 0.56, x, y, color, 0.22, 0.14),
      new M.Dot({ point: [x - 0.15, y + 0.04, 0], radius: 0.06, color }), new M.Dot({ point: [x + 0.15, y + 0.04, 0], radius: 0.06, color }),
      ln([x - 0.14, y - 0.14], [x + 0.14, y - 0.14], color), ln([x, y + 0.28], [x, y + 0.46], color),
      new M.Dot({ point: [x, y + 0.5, 0], radius: 0.05, color }));
  }
  function doc(x, y, w, h, color, title) {
    const parts = [box(w, h, x, y, color, 0.12, 0.06), fit(tx(title, 14, color, x, y + h / 2 - 0.22), w - 0.15)];
    const gap = Math.min(0.25, (h - 0.75) / 2);
    for (let i = 0; i < 3; i++) { const yy = y + h / 2 - 0.5 - i * gap; parts.push(ln([x - w / 2 + 0.15, yy], [x + w / 2 - (i === 2 ? 0.45 : 0.15), yy], C.muted)); }
    return new M.VGroup(...parts);
  }

  // 0-1 the library and its website helper
  const LIB = P ? [0, 0.65] : [-5.3, -0.5];
  const [wx, wy, ww, wh] = P ? [0, -2.75, 6.6, 4.3] : [-1.2, -0.6, 4.4, 3.4];
  const library = new M.VGroup(box(1.7, 1.0, LIB[0], LIB[1], C.ink, 0.08),
    ln([LIB[0] - 1.0, LIB[1] + 0.5], [LIB[0], LIB[1] + 1.0], C.ink), ln([LIB[0], LIB[1] + 1.0], [LIB[0] + 1.0, LIB[1] + 0.5], C.ink),
    ln([LIB[0] - 1.0, LIB[1] + 0.5], [LIB[0] + 1.0, LIB[1] + 0.5], C.ink),
    ...[-0.5, 0, 0.5].map(d => ln([LIB[0] + d, LIB[1] - 0.4], [LIB[0] + d, LIB[1] + 0.35], C.muted)),
    tx('town library', 18, C.muted, LIB[0], LIB[1] - 0.75));
  const win = new M.VGroup(box(ww, wh, wx, wy, C.muted, 0.9, 0.12, C.card),
    ln([wx - ww / 2, wy + wh / 2 - 0.38], [wx + ww / 2, wy + wh / 2 - 0.38], C.muted),
    ...[0, 1, 2].map(k => new M.Dot({ point: [wx - ww / 2 + 0.22 + k * 0.2, wy + wh / 2 - 0.19, 0], radius: 0.05, color: C.muted })),
    tx('library website', 18, C.muted, wx + 0.3, wy + wh / 2 - 0.19));
  const RB = [wx - ww / 2 + 0.6, wy + wh / 2 - 0.95];
  const bot = robot(RB[0], RB[1], BLUE), botLab = tx('assistant', 18, BLUE, RB[0], RB[1] - 0.5);
  await until(S(0)); await play(new M.FadeIn(library), new M.FadeIn(win), ...say('A TOWN LIBRARY', C.ink));
  await play(new M.FadeIn(bot), new M.FadeIn(botLab), ...say('NEW HELPER: A LIBRARY ASSISTANT', BLUE));

  const QB = P ? [0.75, -1.45, 4.4, 0.55] : [-0.55, 0.3, 2.6, 0.5];
  const AB = P ? [0.15, -2.85, 5.7, 0.9] : [-1.1, -1.05, 3.7, 0.8];
  const qb = box(QB[2], QB[3], QB[0], QB[1], C.ink, 0.1, 0.2), ab = box(AB[2], AB[3], AB[0], AB[1], BLUE, 0.14, 0.2);
  const qbar = ln([QB[0] - QB[2] / 2 + 0.25, QB[1]], [QB[0] + QB[2] / 2 - 0.5, QB[1]], C.muted, 4);
  const abars = [0.15, -0.15].map((d, k) => ln([AB[0] - AB[2] / 2 + 0.25, AB[1] + d], [AB[0] + AB[2] / 2 - (k ? 1.2 : 0.3), AB[1] + d], C.muted, 4));
  await until(S(1)); await play(new M.FadeIn(qb), new M.FadeIn(qbar), ...say('A PROGRAM THAT ANSWERS IN SENTENCES', BLUE));
  await play(new M.FadeIn(ab), new M.LaggedStart(abars.map(b => new M.Create(b)), { lagRatio: 0.4, runTime: 1.2 }));

  // 2-3 inside: a language model that has read huge amounts of text, writing word by word
  const LMP = P ? [-1.8, 0.6] : [-5.3, 0.35];
  const lm = new M.VGroup(box(1.9, 0.7, LMP[0], LMP[1], C.violet, 0.15, 0.12), tx('language model', 16, C.violet, LMP[0], LMP[1]));
  const pages = Array.from({ length: 6 }, (_, k) => box(0.26, 0.34, LMP[0] - 0.75 + k * 0.3, LMP[1] + 0.68, C.muted, 0.25, 0, C.ink));
  const link = new M.DashedLine({ start: P ? [LMP[0] - 0.4, LMP[1] - 0.35, 0] : [LMP[0] + 0.95, LMP[1], 0], end: P ? [RB[0], RB[1] + 0.55, 0] : [RB[0] - 0.4, RB[1], 0], color: C.violet });
  await until(S(2)); await play(new M.FadeOut(library), new M.FadeIn(lm), new M.Create(link), ...say('INSIDE: A LANGUAGE MODEL', C.violet));
  await play(new M.LaggedStart(pages.map(p => new M.FadeIn(p, { shift: [0, -0.15, 0] })), { lagRatio: 0.3, runTime: 1.6 }));

  const words = [];
  let wxc = AB[0] - AB[2] / 2 + 0.25;
  for (const w of ['Hi!', 'How', 'can', 'I', 'help', 'you?']) { const t = lft(T(w, 18, C.ink), wxc, AB[1]); words.push(t); wxc += t.getWidth() + 0.12; }
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(...abars)), ...say('IT WRITES REPLIES WORD BY WORD', C.violet));
  await play(new M.LaggedStart(words.map(w => new M.FadeIn(w)), { lagRatio: 0.6, runTime: 2.2 }));

  // 4-6 one document, one question, one friendly answer: but is it good?
  const GP = P ? [1.8, 0.6] : [-5.3, -1.6];
  const guide = doc(GP[0], GP[1], P ? 1.4 : 1.3, 1.2, C.green, 'guide');
  const toWin = new M.Arrow({ start: P ? [GP[0], GP[1] - 0.65, 0] : [GP[0] + 0.7, GP[1], 0], end: P ? [GP[0], -0.62, 0] : [wx - ww / 2 - 0.05, GP[1], 0], color: C.green });
  await until(S(4)); await play(new M.FadeIn(guide), new M.Create(toWin), ...say('ONE GUIDE: OPENING HOURS + LENDING', C.green));

  const qtext = fit(tx('How long can I keep a book?', 17, C.ink, QB[0], QB[1]), QB[2] - 0.3);
  const atext = fit(tx('Happy to help! Here is how long you can keep it.', 17, C.ink, AB[0], AB[1]), AB[2] - 0.3);
  await until(S(5)); await play(new M.FadeOut(qbar), new M.FadeIn(qtext), new M.FadeOut(new M.VGroup(...words)), ...say('“HOW LONG CAN I KEEP A BOOK?”', C.ink));
  await play(new M.FadeIn(atext));

  const qm = tx('?', 54, C.amber, P ? 0 : 0.35, P ? -4.05 : -1.9, false, true);
  await until(S(6)); await play(new M.FadeIn(qm), new M.Indicate(ab, { color: C.amber }), ...say('ARE ITS ANSWERS GOOD?', C.amber));

  // 7-8 a few questions of our own are not a fair test
  const OWN = P ? [[-2.5, 0.65], [0, 0.65], [2.5, 0.65]] : [[-5.3, 0.6], [-5.3, -0.4], [-5.3, -1.4]];
  const own = OWN.map(([x, y]) => new M.VGroup(box(P ? 2.1 : 1.8, 0.7, x, y, C.muted, 0.15, 0.1), fit(tx('our own: easy?', 17, C.ink, x, y), (P ? 2.1 : 1.8) - 0.2)));
  await until(S(7)); await play(new M.FadeOut(new M.VGroup(lm, ...pages, link, guide, toWin)),
    new M.LaggedStart(own.map(o => new M.FadeIn(o)), { lagRatio: 0.3, runTime: 1.4 }), ...say('A FEW OF OUR OWN? MAYBE EASY ONES', C.muted));
  await until(S(8)); await play(new M.FadeOut(new M.VGroup(win, bot, botLab, qb, qtext, ab, atext, qm, ...own)), ...say('FAIR TEST = QUESTIONS PEOPLE REALLY ASK', C.green));

  // 9 the log: 200 real questions from last month
  const DS = P ? 0.2 : 0.22, BASE = P ? -1.4 : -2.0, PX = P ? [-2.5, 0, 2.5] : [CX - 2.6, CX, CX + 2.6];
  const pileP = (t, j) => [PX[t] + (j % 10 - 4.5) * DS, BASE + (Math.floor(j / 10) + 0.5) * DS, 0];
  const LG = P ? { x: 0, y: -4.2, cols: 20, sx: 0.33, sy: 0.24 } : { x: 4.5, y: -0.6, cols: 10, sx: 0.4, sy: 0.22 };
  const rowsL = 200 / LG.cols;
  const logP = i => { const k = (i * 37 + 11) % 200; return [LG.x + (k % LG.cols - (LG.cols - 1) / 2) * LG.sx, LG.y + ((rowsL - 1) / 2 - Math.floor(k / LG.cols)) * LG.sy, 0]; };
  const qd = Array.from({ length: 200 }, (_, i) => new M.Dot({ point: logP(i), radius: 0.07, color: C.ink }));
  const logLab = tx('200 real questions · last month', 17, C.ink, LG.x, LG.y + rowsL / 2 * LG.sy + 0.35);
  await until(S(9)); await play(new M.LaggedStart(qd.map(d => new M.FadeIn(d)), { lagRatio: 0.01, runTime: 2.4 }), new M.FadeIn(logLab), ...say('200 REAL QUESTIONS', C.ink));

  // 10-14 three piles by topic
  const rowsOf = t => TOP[t][2] / 10, first = [0, 100, 160];
  const floors = PX.map((x, t) => ln([x - 5.3 * DS, BASE], [x + 5.3 * DS, BASE], TOP[t][1]));
  const names = TOP.map(([n, c], t) => tx(n, 17, c, PX[t], BASE - 0.3, true, true));
  const counts = TOP.map(([, c, n], t) => tx(String(n), 18, c, PX[t], BASE + rowsOf(t) * DS + 0.28, true, true));
  const pcts = TOP.map(([, c], t) => tx(PCT[t] + '%', 18, c, PX[t], BASE - 0.65, true, true));
  const sortArrow = P ? null : new M.Arrow({ start: [LG.x - LG.cols / 2 * LG.sx - 0.1, LG.y, 0], end: [PX[2] + 1.35, LG.y, 0], color: C.violet, strokeWidth: 3, buff: 0 });
  await until(S(10)); await play(new M.FadeOut(logLab), ...(sortArrow ? [new M.Create(sortArrow)] : []), new M.FadeIn(new M.VGroup(...floors, ...names)), ...say('SORT INTO 3 PILES BY TOPIC', C.violet));
  const PSAY = ['HOURS: 100 QUESTIONS', 'LOANS (BOOKS, DVDS, LAPTOPS): 60', 'ROOMS (STUDY ROOMS): 40'];
  for (let t = 0; t < 3; t++) {
    await until(S(11 + t));
    const mine = qd.slice(first[t], first[t] + TOP[t][2]);
    await play(new M.LaggedStart(mine.map((d, j) => new M.Transform(d, new M.Dot({ point: pileP(t, j), radius: 0.07, color: TOP[t][1] }))), { lagRatio: 0.03, runTime: 2.2 }), ...say(PSAY[t], TOP[t][1]));
    await play(new M.FadeIn(counts[t]));
  }
  await until(S(14)); await play(...(sortArrow ? [new M.FadeOut(sortArrow)] : []), ...fbox(['100 + 60 + 40', ['= 200 questions', C.amber]], C.amber), ...say('3 PILES TOGETHER = 200', C.amber));

  // 15-20 each pile against the whole: proportions
  const BARY = P ? 1.35 : 1.05, BX0 = PX[0] - (P ? 1.05 : 1.1), BX1 = PX[2] + (P ? 1.05 : 1.1), BWD = BX1 - BX0;
  const whole = box(BWD, 0.32, (BX0 + BX1) / 2, BARY, C.muted);
  const wholeLab = lft(T('the whole: 200 questions', 15, C.muted), BX0, BARY + 0.35);
  let cum = 0;
  const segs = PCT.map((p, t) => { const w = BWD * p / 100, r = box(w, 0.32, BX0 + BWD * cum / 100 + w / 2, BARY, TOP[t][1], 0.85); cum += p; return r; });
  await until(S(15)); await play(new M.Create(whole), new M.FadeIn(wholeLab), ...fbox(['part ÷ whole', ['= share of all 200', C.violet]], C.violet), ...say('EACH PILE vs THE WHOLE', C.violet));
  await until(S(16)); await play(new M.FadeIn(segs[0]), new M.Indicate(counts[0], { color: C.cyan }), ...fbox(['hours: 100 out of 200', ['= one half', C.cyan]], C.cyan), ...say('HOURS = HALF OF ALL QUESTIONS', C.cyan));
  await until(S(17)); await play(new M.FadeIn(pcts[0]), ...fbox(['half = 50 out of 100', ['= 50 percent = 50%', C.cyan]], C.cyan), ...say('PERCENT = OUT OF EVERY HUNDRED', C.cyan));
  await until(S(18)); await play(new M.FadeIn(segs[1]), new M.FadeIn(pcts[1]), ...fbox(['loans: 60 out of 200', 'halve: 30 out of 100', ['= 30%', C.pink]], C.pink), ...say('LOANS = 30%', C.pink));
  await until(S(19)); await play(new M.FadeIn(segs[2]), new M.FadeIn(pcts[2]), ...fbox(['rooms: 40 out of 200', 'halve: 20 out of 100', ['= 20%', C.amber]], C.amber), ...say('ROOMS = 20%', C.amber));
  await until(S(20)); await play(new M.LaggedStart(segs.map((r, t) => new M.Indicate(r, { color: TOP[t][1] })), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['proportion', ['= part ÷ whole', C.green]], C.green), ...say('PROPORTION = PART OF THE WHOLE', C.green));

  // 21-27 a 10-question test: a thin slice of the cake
  const CW = P ? 0.88 : 0.66, CH = P ? 0.8 : 0.74;
  const cardP = k => P ? [(k % 5 - 2) * 1.1, -2.85 - Math.floor(k / 5) * 0.98] : [4.5 + (k % 5 - 2) * 0.82, 1.7 - Math.floor(k / 5) * 0.92];
  const slots = Array.from({ length: 10 }, (_, k) => box(CW, CH, ...cardP(k), C.muted, 0.06, 0.08));
  await until(S(21)); await play(new M.FadeOut(new M.VGroup(whole, wholeLab, ...segs)), ...noBox(),
    new M.LaggedStart(slots.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.4 }), ...say('A SMALL TEST: 10 QUESTIONS', C.green));

  const CK = P ? { x: -0.9, w: 3.8, y0: -5.4, h: 0.95, sx: 2.5, sw: 0.4 } : { x: 3.4, w: 2.4, y0: -2.75, h: 1.9, sx: 5.9, sw: 0.45 };
  const layers = (x, w) => { let c = 0; return PCT.map((p, t) => { const hh = CK.h * p / 100, r = box(w, hh, x, CK.y0 + CK.h * c / 100 + hh / 2, TOP[t][1], 0.75); c += p; return r; }); };
  const cake = layers(CK.x, CK.w), slice = layers(CK.sx, CK.sw);
  await until(S(22)); await play(new M.LaggedStart(cake.map(c => new M.FadeIn(c)), { lagRatio: 0.3, runTime: 1.4 }), ...say('A THIN SLICE KEEPS EVERY LAYER', C.violet));
  await play(new M.FadeIn(new M.VGroup(...slice), { shift: [0.5, 0, 0] }));
  await until(S(23)); await play(new M.LaggedStart(slots.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.1, runTime: 1.6 }), ...say('OUR 10 QUESTIONS = A SLICE: SAME MIX', C.violet));

  const CSAY = [['hours: half of 10', '= 5 questions'], ['loans: 30/100 = 3/10', '= 3 questions'], ['rooms: 20/100 = 2/10', '= 2 questions']];
  for (let t = 0; t < 3; t++) {
    await until(S(24 + t));
    const mine = slots.filter((_, k) => TEST[k] === t);
    mine.forEach(c => { c.setColor(TOP[t][1]); c.setFill(TOP[t][1], 0.22); });
    const out = t ? [] : [new M.FadeOut(new M.VGroup(...cake, ...slice))];
    await play(...out, new M.LaggedStart(mine.map(c => new M.Indicate(c, { color: TOP[t][1] })), { lagRatio: 0.2, runTime: 1.4 }),
      ...fbox([CSAY[t][0], [CSAY[t][1], TOP[t][1]]], TOP[t][1]), ...say(`${TOP[t][0]}: ${[5, 3, 2][t]} QUESTIONS`, TOP[t][1]));
  }
  await until(S(27)); await play(new M.LaggedStart(slots.map((c, k) => new M.Indicate(c, { color: TOP[TEST[k]][1] })), { lagRatio: 0.1, runTime: 1.6 }),
    ...fbox(['5 + 3 + 2', ['= 10 questions', C.green]], C.green), ...say('5 + 3 + 2 = 10', C.green));

  // 28-29 drawn at random inside each pile, one card per question
  const picks = [[7, 23, 48, 61, 92], [4, 21, 33], [7, 28]].flatMap((js, t) => js.map(j => [qd[first[t] + j], pileP(t, j)]));
  await until(S(28)); await play(new M.LaggedStart(picks.map(([d, p]) => new M.Transform(d, new M.Dot({ point: p, radius: 0.11, color: C.ink }))), { lagRatio: 0.3, runTime: 2.4 }),
    ...say('DRAWN AT RANDOM, LIKE NAMES FROM A HAT', C.ink));
  await play(new M.LaggedStart(picks.map(([d]) => new M.Flash(d, { color: C.ink })), { lagRatio: 0.15, runTime: 1.6 }));
  const qlab = slots.map((_, k) => tx('Q' + (k + 1), 15, C.ink, ...cardP(k), true, true));
  await until(S(29)); await play(new M.LaggedStart(qlab.map(q => new M.FadeIn(q)), { lagRatio: 0.15, runTime: 1.6 }), ...say('EACH QUESTION ON ITS OWN CARD', C.violet));

  // 30-34 one question card, four things (Q1)
  const BC = P ? { x: 0, y: -1.65, w: 7.5, h: 6.5 } : { x: 0, y: -0.75, w: 9.2, h: 4.1 };
  const RY = P ? [0.5, -0.95, -2.4, -3.85] : [0.35, -0.45, -1.25, -2.1];
  const TY = BC.y + BC.h / 2 - 0.35;
  const NX = BC.x - BC.w / 2 + (P ? 0.4 : 0.45), LX = NX + 0.35, CL = P ? NX - 0.05 : -1.4, CMAX = P ? 6.7 : 5.7;
  const CY = i => P ? RY[i] - 0.55 : RY[i];
  const bigCard = box(BC.w, BC.h, BC.x, BC.y, C.cyan, 0.9, 0.2, C.card);
  const tag = pill('HOURS', C.cyan, 15); tag.moveTo([BC.x - BC.w / 2 + 0.3 + tag.getWidth() / 2, TY, 0]);
  const qid = tx('Q1', 18, C.cyan, BC.x + BC.w / 2 - 0.5, TY, true, true);
  const nums = RY.map((y, i) => new M.VGroup(at(new M.Circle({ radius: 0.17, color: C.violet }), NX, y), tx(String(i + 1), 15, C.violet, NX, y, true, true)));
  const labs = ['question', 'date asked', 'passage of the guide', 'right answer'].map((s, i) => lft(T(s, P ? 18 : 17, C.ink), LX, RY[i]));
  const c1 = lft(fit(T('“What time does the library open on Sunday?”', 18, C.ink), CMAX), CL, CY(0));
  const dt = lft(T('asked 15 February', 17, C.amber, true), CL + 0.15, CY(1));
  const stamp = box(dt.getWidth() + 0.3, 0.42, CL + (dt.getWidth() + 0.3) / 2, CY(1), C.amber, 0.1, 0.06);
  const SW = P ? 6.4 : 5.4, sx = f => CL + 0.15 + f * (SW - 0.3);
  const strip = box(SW, 0.5, CL + SW / 2, CY(2), C.violet, 0.12, 0.06);
  const sbars = [[0, 0.48, 0.11], [0.53, 1, 0.11], [0, 0.62, -0.11]].map(([a, b, dy]) => ln([sx(a), CY(2) + dy], [sx(b), CY(2) + dy], C.violet, 3));
  const ans = lft(T('noon', 20, C.green, true, true), CL, CY(3));
  const ax = CL + ans.getWidth() + 0.6;
  const libs = [0, 1].map(k => person(ax + k * 0.55, CY(3) - 0.2, C.green, 0.8));
  const agreed = lft(T('agreed by 2 librarians', 18, C.green), ax + 0.95, CY(3));
  await until(S(30));
  await play(new M.FadeOut(new M.VGroup(...qd, ...floors, ...names, ...counts, ...pcts, ...slots, ...qlab)), ...noBox(), ...say('A CARD HOLDS 4 THINGS', C.violet));
  await play(new M.FadeIn(new M.VGroup(bigCard, tag, qid)), new M.FadeIn(new M.VGroup(nums[0], labs[0], c1)));
  await until(S(31)); await play(new M.FadeIn(new M.VGroup(nums[1], labs[1], stamp, dt)), ...say('DATE: RULES CAN CHANGE OVER TIME', C.amber));
  await until(S(32)); await play(new M.FadeIn(new M.VGroup(nums[2], labs[2], strip, ...sbars)), ...say('THE PASSAGE THAT ANSWERS IT', C.violet));
  const lab3 = lft(T('source passage', P ? 18 : 17, C.violet), LX, RY[2]);
  await until(S(33)); await play(new M.FadeOut(labs[2]), new M.FadeIn(lab3),
    new M.LaggedStart(sbars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.3, runTime: 1.6 }), ...say('SOURCE PASSAGE: A FEW SENTENCES', C.violet));
  await until(S(34)); await play(new M.FadeIn(new M.VGroup(nums[3], labs[3], ans, ...libs, agreed)), ...say('RIGHT ANSWER: 2 LIBRARIANS AGREE', C.green));

  // 35-41 the rule: the builders never see the 10 cards (held out)
  const HW = P ? 0.66 : 0.58, HH = P ? 0.85 : 0.8;
  const hP = k => P ? [(k % 5 - 2) * 0.8, k < 5 ? 1.0 : 0.0] : [-0.3 + (k % 5 - 2) * 0.7, k < 5 ? 0.1 : -0.9];
  const tcard = TEST.map((t, k) => box(HW, HH, ...hP(k), TOP[t][1], 0.18, 0.08));
  const tlab = TEST.map((_, k) => { const [x, y] = hP(k); return tx('Q' + (k + 1), 14, C.ink, x, y + 0.18, true, true); });
  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(bigCard, tag, qid, ...nums, labs[0], labs[1], labs[3], lab3, c1, stamp, dt, strip, ...sbars, ans, ...libs, agreed)), ...say('ONE RULE PROTECTS THE TEST', C.amber));
  await play(new M.LaggedStart(tcard.map((c, k) => new M.FadeIn(new M.VGroup(c, tlab[k]))), { lagRatio: 0.12, runTime: 1.4 }));

  const builders = (P ? [[-0.4, -2.5], [0.4, -2.5]] : [[-5.7, -0.15], [-4.9, -0.15]]).map(([x, y]) => person(x, y, C.violet));
  const bLab = tx('builders', 16, C.violet, P ? 0 : -5.3, P ? -2.95 : -0.65);
  const wall = P ? box(7.0, 0.14, 0, -1.4, C.muted, 0.6) : box(0.14, 3.0, -2.9, -0.6, C.muted, 0.6);
  await until(S(36)); await play(new M.FadeIn(new M.VGroup(...builders, bLab)), new M.FadeIn(wall), ...say('BUILDERS NEVER SEE THESE 10 CARDS', C.pink));
  const items = [['instructions', P ? [-1.6, -4.1] : [-5.95, -1.8]], ['examples', P ? [1.6, -4.1] : [-4.55, -1.8]]].map(([s, [x, y]]) => doc(x, y, P ? 1.9 : 1.25, 0.95, C.violet, s));
  await until(S(37)); await play(new M.LaggedStart(items.map(d => new M.FadeIn(d)), { lagRatio: 0.4, runTime: 1.4 }), ...say('NOT IN ITS INSTRUCTIONS, NOT IN EXAMPLES', C.pink));
  const peek = new M.DashedLine({ start: P ? [1.4, -2.4, 0] : [-4.4, 0.1, 0], end: P ? [1.4, -1.55, 0] : [-3.05, 0.1, 0], color: C.pink });
  const cross = tx('✗', 34, C.pink, P ? 1.85 : -3.7, P ? -1.95 : 0.5, false, true);
  await until(S(38)); await play(new M.Create(peek), new M.FadeIn(cross), ...say('LIKE SEEING THE EXAM IN ADVANCE', C.pink));
  const held = pill('HELD OUT', C.green, 16); held.moveTo(P ? [0, -0.8, 0] : [-0.3, 0.85, 0]);
  await until(S(39)); await play(new M.FadeIn(held), ...say('KEPT ASIDE = HELD OUT', C.green));
  await until(S(40)); await play(...fbox(['held-out questions', '+ the mix of real use', ['= task-specific evaluation set', C.green]], C.green), ...say('TASK-SPECIFIC EVALUATION SET', C.green));
  await until(S(41)); await play(...fbox(['evaluation = checking', '  how good something is', ['task-specific = made for this job', C.green]], C.green), ...say('EVALUATE = CHECK HOW GOOD', C.green));

  // 42-44 the rule in one line
  await until(S(42)); await play(new M.FadeOut(new M.VGroup(...builders, bLab, wall, ...items, peek, cross)), ...noBox(), ...say('THE RULE IN ONE LINE', C.amber));
  await until(S(43)); await play(...fbox(['questions on a topic', ['= test size × proportion', C.amber]], C.amber));
  await until(S(44)); await play(new M.LaggedStart([5, 6, 7].map(k => new M.Indicate(tcard[k], { color: C.pink })), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['loans = 10 × 30%', ['      = 3 questions', C.pink]], C.pink), ...say('SAME 3 AS THE CAKE SLICE', C.pink));

  // 45-49 run the test on assistant A
  const AP = P ? [0, -1.85] : [-4.8, -0.2];
  const botA = robot(AP[0], AP[1], BLUE), botALab = tx('assistant A', 16, BLUE, AP[0], AP[1] - 0.55);
  await until(S(45)); await play(new M.FadeIn(new M.VGroup(botA, botALab)), ...noBox(), ...say('RUN THE TEST ON ASSISTANT A', BLUE));
  const marks = TEST.map((_, k) => { const [x, y] = hP(k); return tx(RIGHT[k] ? '✓' : '✗', 22, RIGHT[k] ? C.green : C.pink, x, y - 0.17, false, true); });
  await until(S(46)); await play(new M.LaggedStart(marks.map(m => new M.FadeIn(m)), { lagRatio: 0.3, runTime: 3.0 }),
    ...fbox(['right: 7 of 10', ['7 ÷ 10 = 70%', BLUE]], BLUE), ...say('7 OF 10 RIGHT: 70%', BLUE));
  const MX = P ? -3.0 : -1.95, MY = P ? [-2.95, -3.45, -3.95] : [-1.75, -2.2, -2.65];
  const misses = ['Q1  Sunday opening hours', 'Q5  late-night study hall (exams)', 'Q9  booking room R12'].map((s, i) => lft(fit(T(s, 16, C.pink, true), P ? 6.0 : 3.9), MX, MY[i]));
  await until(S(47)); await play(new M.LaggedStart([0, 4, 8].map(k => new M.Indicate(tcard[k], { color: C.pink })), { lagRatio: 0.3, runTime: 1.6 }),
    new M.LaggedStart(misses.map(m => new M.FadeIn(m)), { lagRatio: 0.5, runTime: 2.4 }), ...say('MISSED: Q1 · Q5 · Q9', C.pink));
  await until(S(48)); await play(new M.Indicate(botA, { color: C.green }), ...say('A FAIR PICTURE OF REAL USE', C.green));
  await until(S(49)); await play(new M.LaggedStart(tcard.map((c, k) => new M.Indicate(c, { color: TOP[TEST[k]][1] })), { lagRatio: 0.12, runTime: 2.2 }), ...say('ROUGH, BUT EVERY TOPIC IS IN IT', C.ink));

  // 50-52 the trap: ten hours questions say nothing about rooms
  const trP = k => P ? [(k % 5 - 2) * 0.8, k < 5 ? -2.15 : -3.15] : [-4.6 + (k % 5 - 2) * 0.7, k < 5 ? 0.1 : -0.9];
  const trap = Array.from({ length: 10 }, (_, k) => box(HW, HH, ...trP(k), C.cyan, 0.18, 0.08));
  const trapLab = trap.map((_, k) => { const [x, y] = trP(k); return tx('H' + (k + 1), 14, C.ink, x, y + 0.18, true, true); });
  const trapTitle = tx('trap set: 10 hours questions', 16, C.cyan, P ? 0 : -4.6, P ? -1.4 : 0.85);
  const zero = tx('rooms: 0 cards', 17, C.pink, P ? 0 : -4.6, P ? -4.1 : -1.75, true, true);
  await until(S(50)); await play(new M.FadeOut(new M.VGroup(botA, botALab, ...misses)), ...noBox(), ...say('TRAP: 10 EASY HOURS QUESTIONS', C.pink));
  await play(new M.FadeIn(trapTitle), new M.LaggedStart(trap.map((c, k) => new M.FadeIn(new M.VGroup(c, trapLab[k]))), { lagRatio: 0.1, runTime: 1.5 }));
  await until(S(51)); await play(new M.Indicate(tcard[8], { color: C.pink }), new M.Flash(tcard[8], { color: C.pink }), ...say('ROOM R12 WOULD NEVER BE ASKED', C.pink));
  await until(S(52)); await play(new M.FadeIn(zero), new M.LaggedStart([8, 9].map(k => new M.Indicate(tcard[k], { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }),
    ...say('NOTHING ABOUT ROOMS: WHERE A FAILED', C.pink));

  // 53 in one sentence
  await until(S(53)); await play(new M.FadeOut(new M.VGroup(...trap, ...trapLab, trapTitle, zero)),
    ...fbox(['held out', 'same mix: 5 + 3 + 2', ['= a fair test', C.green]], C.green), ...say('HELD OUT + SAME MIX AS REAL USE', C.green));
}

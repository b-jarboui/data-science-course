// 21.2.4 Groundedness: how much of an answer stands on its cited passage (live lesson, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PILL = P ? [0, 3.9, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -3.75, 0] : [0, -2.15, 0];
  const G = P ? -3.6 : -2.0; // centre of the bottom zone (formula box or one small picture)
  const PC = P ? [0, 2.15] : [-3.45, 0.05], AC = P ? [0, -0.75] : [3.45, 0.05]; // passage card, answer card
  const CW = P ? 7.4 : 6.2, CH = 2.6, RH = 0.62, TS = P ? 18 : 19;
  const TOPIC = [C.cyan, C.cyan, C.cyan, C.cyan, C.cyan, C.pink, C.pink, C.pink, C.amber, C.amber];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const at = (t, x, y) => { t.moveTo([x + t.getWidth() / 2, y, 0]); return t; };
  const out = (...xs) => new M.FadeOut(new M.VGroup(...xs));

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
    const maxw = P ? FW - 1.2 : 7.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  function boxOff() { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; }

  // small pictures
  const person = (x, y, color = C.ink) => {
    const head = new M.Circle({ radius: 0.11, color }); head.setFill(color, 1); head.moveTo([x, y + 0.28, 0]);
    const body = new M.Arc({ radius: 0.2, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([x, y, 0]);
    return new M.VGroup(head, body);
  };
  const tick = (x, y, color = C.green) => new M.VGroup(
    new M.Line({ start: [x - 0.16, y + 0.01, 0], end: [x - 0.05, y - 0.12, 0], color, strokeWidth: 5 }),
    new M.Line({ start: [x - 0.05, y - 0.12, 0], end: [x + 0.17, y + 0.16, 0], color, strokeWidth: 5 }));
  const cross = (x, y, color = C.pink) => new M.VGroup(
    new M.Line({ start: [x - 0.13, y - 0.13, 0], end: [x + 0.13, y + 0.13, 0], color, strokeWidth: 5 }),
    new M.Line({ start: [x - 0.13, y + 0.13, 0], end: [x + 0.13, y - 0.13, 0], color, strokeWidth: 5 }));
  const badge = (x, y, n, color) => {
    const c = new M.Circle({ radius: 0.17, color, strokeWidth: 2 }); c.setFill(C.bg, 0.9); c.moveTo([x, y, 0]);
    const t = T(String(n), 14, color, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(c, t);
  };

  // 0 a borrowed laptop
  const YOU = P ? [-2.4, 2.7] : [-5.6, 0.2], BUB = P ? [1.2, 2.7] : [-2.4, 0.9];
  const you = person(YOU[0] - 0.5, YOU[1]);
  const youLab = T('you', 15, C.muted); youLab.moveTo([YOU[0] - 0.5, YOU[1] - 0.42, 0]);
  const screen = new M.Rectangle({ width: 0.7, height: 0.45, color: C.cyan, strokeWidth: 2 }); screen.setFill(C.cyan, 0.15); screen.moveTo([YOU[0] + 0.35, YOU[1] + 0.22, 0]);
  const kb = new M.Rectangle({ width: 0.9, height: 0.07, color: C.cyan, strokeWidth: 1 }); kb.setFill(C.cyan, 0.9); kb.moveTo([YOU[0] + 0.35, YOU[1] - 0.06, 0]);
  const lapLab = T('laptop', 15, C.cyan); lapLab.moveTo([YOU[0] + 0.35, YOU[1] - 0.42, 0]);
  await until(S(0)); await play(new M.FadeIn(you), new M.FadeIn(youLab), new M.Create(screen), new M.FadeIn(kb), new M.FadeIn(lapLab), ...say('A BORROWED LAPTOP: KEEP IT LONGER?'));

  // 1 the question
  const qText = T('Can I renew a laptop loan?', 17, C.ink);
  const qBox = new M.RoundedRectangle({ width: qText.getWidth() + 0.4, height: 0.6, cornerRadius: 0.2, color: C.amber, strokeWidth: 2 });
  qBox.setFill(C.card, 0.9); qBox.moveTo([BUB[0], BUB[1], 0]); qText.moveTo([BUB[0], BUB[1], 0]);
  await until(S(1)); await play(new M.FadeIn(qBox), new M.FadeIn(qText), ...say('YOU ASK THE CHAT ASSISTANT', C.amber));

  // 2 the assistant
  const BOT = P ? [-2.0, 0.4] : [1.0, 0.2], GUIDE = P ? [1.8, 0.4] : [4.6, 0.2];
  const face = new M.RoundedRectangle({ width: 0.9, height: 0.62, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 }); face.setFill(C.violet, 0.15); face.moveTo([BOT[0], BOT[1], 0]);
  const eyes = [-0.18, 0.18].map(dx => new M.Dot({ point: [BOT[0] + dx, BOT[1] + 0.05, 0], radius: 0.07, color: C.violet }));
  const ant = new M.Line({ start: [BOT[0], BOT[1] + 0.31, 0], end: [BOT[0], BOT[1] + 0.5, 0], color: C.violet, strokeWidth: 2 });
  const antTip = new M.Dot({ point: [BOT[0], BOT[1] + 0.53, 0], radius: 0.05, color: C.violet });
  const botLab = T('assistant', 15, C.violet); botLab.moveTo([BOT[0], BOT[1] - 0.6, 0]);
  const bot = [face, ...eyes, ant, antTip, botLab];
  await until(S(2)); await play(new M.FadeIn(new M.VGroup(...bot)), ...say('LANGUAGE MODEL = WRITES ANSWERS', C.violet));

  // 3 the guide booklet: four passages of two lines
  const gy = k => GUIDE[1] + 0.75 - k * 0.5;
  const book = new M.Rectangle({ width: 2.2, height: 2.6, color: C.ink, strokeWidth: 2 }); book.setFill(C.card, 0.9); book.moveTo([GUIDE[0], GUIDE[1], 0]);
  const bookT = T('GUIDE', 15, C.ink, true); bookT.moveTo([GUIDE[0], GUIDE[1] + 1.08, 0]);
  const strips = [];
  for (let k = 0; k < 4; k++) for (const [dy, w] of [[0.09, 1.6], [-0.09, 1.1]])
    strips.push(new M.Line({ start: [GUIDE[0] - 0.8, gy(k) + dy, 0], end: [GUIDE[0] - 0.8 + w, gy(k) + dy, 0], color: C.muted, strokeWidth: 3 }));
  const bookLab = T('hours + lending rules', 17, C.ink); bookLab.moveTo([GUIDE[0], GUIDE[1] - 1.55, 0]);
  await until(S(3)); await play(new M.FadeIn(new M.VGroup(book, bookT, ...strips, bookLab)), ...say('THE GUIDE: HOURS + LENDING RULES'));

  // 4 one passage
  const pBox = (k, color) => { const b = new M.Rectangle({ width: 1.95, height: 0.4, color, strokeWidth: 2 }); b.moveTo([GUIDE[0], gy(k), 0]); return b; };
  const onePass = pBox(1, C.cyan);
  const passLab = T('passage', 14, C.cyan); passLab.moveTo([GUIDE[0] - 1.6, gy(1), 0]);
  await until(S(4)); await play(new M.Create(onePass), new M.FadeIn(passLab), ...say('PASSAGE = A FEW SENTENCES'));

  // 5 the search step picks a few passages
  const picks = [0, 1, 2].map(k => pBox(k, C.amber));
  const sArrow = new M.Arrow({ start: [GUIDE[0] - 1.2, BOT[1], 0], end: [BOT[0] + 0.6, BOT[1], 0], color: C.amber });
  const sLab = T('search', 15, C.amber); sLab.moveTo([(GUIDE[0] - 1.2 + BOT[0] + 0.6) / 2, BOT[1] + 0.25, 0]);
  await until(S(5)); await play(new M.FadeOut(onePass), new M.FadeOut(passLab), ...picks.map(b => new M.Create(b)), new M.Create(sArrow), new M.FadeIn(sLab), ...say('SEARCH PICKS A FEW PASSAGES', C.amber));

  // 6 the answer cites its passage
  const ANS = P ? [-1.2, -1.6] : [1.0, -1.7];
  const aT = T('answer', 16, C.ink), cT = T('[source]', 16, C.amber, true);
  const aw = aT.getWidth() + cT.getWidth() + 0.55;
  const aBox = new M.RoundedRectangle({ width: aw, height: 0.6, cornerRadius: 0.2, color: C.violet, strokeWidth: 2 });
  aBox.setFill(C.card, 0.9); aBox.moveTo([ANS[0], ANS[1], 0]);
  at(aT, ANS[0] - aw / 2 + 0.2, ANS[1]); at(cT, ANS[0] + aw / 2 - 0.2 - cT.getWidth(), ANS[1]);
  const cite = new M.Arrow({ start: [ANS[0] + aw / 2, ANS[1] + 0.1, 0], end: [GUIDE[0] - 1.0, gy(1), 0], color: C.amber });
  await until(S(6)); await play(new M.FadeOut(new M.VGroup(sArrow, sLab, picks[0], picks[2])), new M.FadeIn(new M.VGroup(aBox, aT, cT)), new M.Create(cite), ...say('CITING = POINTING TO YOUR SOURCE', C.green));

  // 7 our question
  await until(S(7)); await play(new M.LaggedStart([new M.Indicate(cT, { color: C.amber }), new M.Indicate(picks[1], { color: C.amber })], { lagRatio: 0.5, runTime: 1.6 }), ...say('DOES IT ALL COME FROM THE SOURCE?', C.violet));

  // 8-9 card seven of ten held-out cards
  const cardAt = k => P ? [(k % 5 - 2) * 1.45, 1.6 - Math.floor(k / 5) * 1.05] : [(k - 4.5) * 1.25, 0.3];
  const qcards = TOPIC.map((col, k) => {
    const [x, y] = cardAt(k);
    const r = new M.RoundedRectangle({ width: P ? 1.15 : 1.0, height: P ? 0.75 : 0.7, cornerRadius: 0.12, color: col, strokeWidth: 2 });
    r.setFill(col, k === 6 ? 0.25 : 0.08); r.moveTo([x, y, 0]);
    const t = T('Q' + (k + 1), 17, col, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  });
  const q7 = fit(T('Q7: Can I renew a laptop loan?', 18, C.pink), FW - 0.8); q7.moveTo([0, P ? -0.7 : -0.65, 0]);
  const legend = [['hours', C.cyan, -1.5], ['loans', C.pink, 0], ['rooms', C.amber, 1.5]].map(([s, c, x]) => { const t = T(s, 19, c, true); t.moveTo([x * 1.15, P ? -1.45 : -1.35, 0]); return t; });
  await until(S(8));
  await play(out(you, youLab, screen, kb, lapLab, qBox, qText, ...bot, book, bookT, ...strips, bookLab, picks[1], aBox, aT, cT, cite),
    new M.LaggedStart(qcards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.4 }), ...say('CARD 7 OF THE 10 HELD-OUT CARDS', C.pink));
  await play(new M.Indicate(qcards[6], { color: C.pink }), new M.FadeIn(q7), new M.FadeIn(new M.VGroup(...legend)));
  const fx = P ? 3.7 : 6.35, fyT = P ? 2.1 : 0.8, fyB = P ? 0.05 : -0.2;
  const fence = [[[-fx, fyT], [fx, fyT]], [[fx, fyT], [fx, fyB]], [[fx, fyB], [-fx, fyB]], [[-fx, fyB], [-fx, fyT]]]
    .map(([a, b]) => new M.DashedLine({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color: C.violet }));
  const fenceLab = fit(T('set aside: never used while building', 19, C.violet), FW - 0.8); fenceLab.moveTo([0, P ? -2.2 : -2.1, 0]);
  await until(S(9)); await play(...fence.map(l => new M.Create(l)), new M.FadeIn(fenceLab), ...say('HELD OUT: NEVER USED TO BUILD IT', C.violet));

  // 10-13 the cited passage, one sentence at a time
  const frame = (c, title, color) => {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([c[0], c[1], 0]);
    const t = at(T(title, 16, C.muted, true), c[0] - CW / 2 + 0.35, c[1] + 0.92);
    return [r, t];
  };
  const rowY = (c, i) => c[1] + 0.3 - i * RH;
  const rowBox = (c, i, color) => { const b = new M.Rectangle({ width: CW - 0.2, height: 0.5, color, strokeWidth: 2 }); b.moveTo([c[0], rowY(c, i), 0]); return b; };
  const [pRect, pTitle] = frame(PC, 'CITED PASSAGE (card 7)', C.cyan);
  await until(S(10)); await play(out(...qcards, q7, ...legend, ...fence, fenceLab), new M.FadeIn(pRect), new M.FadeIn(pTitle), ...say('THE CITED PASSAGE, LINE BY LINE'));
  const PS = ['Laptops are lent for 4 hours.', 'Laptop loans cannot be renewed.', 'Return laptops to the front desk.'];
  const PL = PC[0] - CW / 2 + 0.35;
  const prow = PS.map((s, i) => at(fit(T(s, TS, C.ink), CW - 1.2), PL, rowY(PC, i)));
  for (let i = 0; i < 3; i++) { await until(S(11 + i)); await play(new M.FadeIn(prow[i], { shift: [0.15, 0, 0] })); }

  // 14-17 the answer, one sentence at a time
  const [aRect, aTitle] = frame(AC, 'ASSISTANT’S ANSWER', C.violet);
  const AS = ['No, laptop loans cannot be renewed.', 'You can keep a laptop for 4 hours.', 'Late laptops cost 2 euros per hour.'];
  const AL = AC[0] - CW / 2 + 0.7;
  const arow = AS.map((s, i) => at(fit(T(s, TS, C.ink), CW - 1.5), AL, rowY(AC, i)));
  const holders = [0, 1, 2].map(i => { const l = new M.Line({ start: [AL, rowY(AC, i), 0], end: [AL + (CW - 1.5) * (i === 2 ? 0.6 : 0.85), rowY(AC, i), 0], color: C.muted, strokeWidth: 4 }); return l; });
  const hNums = [0, 1, 2].map(i => { const t = T(String(i + 1), 17, C.violet, true, true); t.moveTo([AC[0] - CW / 2 + 0.35, rowY(AC, i), 0]); return t; });
  await until(S(14)); await play(new M.FadeIn(aRect), new M.FadeIn(aTitle), new M.LaggedStart([...holders, ...hNums].map(h => new M.FadeIn(h)), { lagRatio: 0.15, runTime: 1.2 }), ...say('THE ANSWER: 3 SENTENCES', C.violet));
  for (let i = 0; i < 3; i++) { await until(S(15 + i)); await play(new M.FadeOut(holders[i]), new M.FadeIn(arow[i], { shift: [0.15, 0, 0] }), ...(i === 2 ? [new M.FadeOut(new M.VGroup(...hNums))] : [])); }

  // 18-23 cut into claims
  const cuts = [0, 1].map(i => new M.DashedLine({ start: [AC[0] - CW / 2 + 0.15, rowY(AC, i) - RH / 2, 0], end: [AC[0] + CW / 2 - 0.15, rowY(AC, i) - RH / 2, 0], color: C.amber }));
  await until(S(18)); await play(...cuts.map(c => new M.Create(c)), ...say('CUT INTO SINGLE FACTS', C.amber));
  await until(S(19)); await play(...say('CLAIM = ONE FACT, TRUE OR FALSE', C.amber));
  const abadges = [0, 1, 2].map(i => badge(AC[0] - CW / 2 + 0.35, rowY(AC, i), i + 1, C.amber));
  await until(S(20)); await play(new M.LaggedStart(abadges.map(b => new M.FadeIn(b)), { lagRatio: 0.3, runTime: 1.2 }), ...say('HERE: 3 SENTENCES → 3 CLAIMS', C.amber));
  const c1 = at(fit(T('Laptop loans cannot be renewed.', TS, C.ink), CW - 1.5), AL, rowY(AC, 0));
  await until(S(21)); await play(new M.FadeOut(arow[0]), new M.FadeIn(c1), ...say('CLAIM 1: LOANS CANNOT BE RENEWED', C.amber));
  arow[0] = c1;
  await play(new M.Indicate(c1, { color: C.amber }));
  await until(S(22)); await play(new M.Indicate(arow[1], { color: C.amber }), ...say('CLAIM 2: LENT FOR 4 HOURS', C.amber));
  await until(S(23)); await play(new M.Indicate(arow[2], { color: C.amber }), ...say('CLAIM 3: LATE FEE, 2 EUROS/HOUR', C.amber));

  // 24 a librarian checks each claim
  const librarian = person(AC[0] + CW / 2 - 0.5, AC[1] + 0.85, C.green);
  await until(S(24)); await play(new M.FadeIn(librarian), ...say('A LIBRARIAN CHECKS EACH CLAIM', C.green));

  // 25-27 claim one: found
  const mx = AC[0] + CW / 2 - 0.4, px = PC[0] + CW / 2 - 0.35;
  const marks = [tick(mx, rowY(AC, 0)), tick(mx, rowY(AC, 1)), cross(mx, rowY(AC, 2))];
  const pbadges = [badge(px, rowY(PC, 1), 1, C.green), badge(px, rowY(PC, 0), 2, C.green)];
  const links = [];
  const link = (pi, ai) => {
    if (P) return [];
    const l = new M.Line({ start: [PC[0] + CW / 2, rowY(PC, pi), 0], end: [AC[0] - CW / 2, rowY(AC, ai), 0], color: C.green, strokeWidth: 2 });
    links.push(l); return [new M.Create(l)];
  };
  let hb = [rowBox(PC, 1, C.green), rowBox(AC, 0, C.green)];
  await until(S(25)); await play(...hb.map(b => new M.Create(b)), ...link(1, 0), ...say('CLAIM 1: FOUND IN THE PASSAGE', C.green));
  await play(new M.Create(marks[0]), new M.FadeIn(pbadges[0]), new M.Flash(marks[0], { color: C.green }));
  await until(S(26)); await play(out(...hb), ...say('SUPPORTED = THE PASSAGE SAYS IT', C.green));
  await until(S(27)); await play(...say('SAME MEANING, NOT SAME WORDS', C.violet));

  // 28-29 claim two: different words, same meaning
  hb = [rowBox(AC, 1, C.amber), rowBox(PC, 0, C.amber)];
  await until(S(28)); await play(...hb.map(b => new M.Create(b)), ...say('CLAIM 2: “KEEP” VS “LENT”', C.amber));
  await play(new M.LaggedStart([new M.Indicate(arow[1], { color: C.amber }), new M.Indicate(prow[0], { color: C.amber })], { lagRatio: 0.6, runTime: 2.2 }));
  await until(S(29)); await play(out(...hb), ...link(0, 1), new M.Create(marks[1]), new M.FadeIn(pbadges[1]), new M.Flash(marks[1], { color: C.green }), ...say('DIFFERENT WORDS, SAME MEANING ✓', C.green));

  // 30-33 claim three: not in the passage
  const aHb = rowBox(AC, 2, C.amber), scan = rowBox(PC, 0, C.amber);
  await until(S(30)); await play(new M.Create(aHb), new M.Create(scan), ...say('CLAIM 3: LATE FEES?', C.amber));
  for (const i of [1, 2]) await play(new M.Transform(scan, rowBox(PC, i, C.amber), { runTime: 0.8 }));
  await play(new M.FadeOut(scan), ...say('NOTHING ABOUT LATE FEES', C.pink));
  await until(S(31)); await play(new M.FadeOut(aHb), new M.Create(marks[2]), new M.Flash(marks[2], { color: C.pink }), ...say('NOT SUPPORTED ✗', C.pink));
  await until(S(32)); await play(...say('MAYBE TRUE IN REAL LIFE, NOT HERE', C.muted));
  await until(S(33)); await play(new M.Indicate(pTitle, { color: C.pink }), ...say('OPEN THE CITATION: NOT THERE', C.pink));

  // 34-35 count, then name the share
  await until(S(34)); await play(new M.LaggedStart(marks.map(m => new M.Indicate(m)), { lagRatio: 0.4, runTime: 1.6 }),
    ...fbox(['supported claims = 2', 'claims           = 3']), ...say('3 CLAIMS, 2 SUPPORTED'));
  await until(S(35)); await play(...fbox(['groundedness =', ['share of supported claims', C.amber]], C.amber), ...say('GROUNDEDNESS', C.amber));

  // 36 solid ground: two claims stand on the passage, one floats
  const slab = new M.Rectangle({ width: 3.4, height: 0.26, color: C.green, strokeWidth: 2 }); slab.setFill(C.green, 0.35); slab.moveTo([-0.6, G - 0.55, 0]);
  const slabLab = at(T('passage = ground', 15, C.green), 1.3, G - 0.55);
  const blocks = [[-1.9, G - 0.17, 1, C.cyan], [-1.2, G - 0.17, 2, C.cyan], [0.3, G + 0.45, 3, C.pink]].map(([x, y, n, col]) => {
    const b = new M.RoundedRectangle({ width: 0.5, height: 0.5, cornerRadius: 0.06, color: col, strokeWidth: 2 }); b.setFill(col, 0.25); b.moveTo([x, y, 0]);
    const t = T(String(n), 16, col, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(b, t);
  });
  const gap = new M.DashedLine({ start: [0.3, G + 0.2, 0], end: [0.3, G - 0.42, 0], color: C.pink });
  const floatLab = at(T('floating: not in the passage', 14, C.pink), 0.7, G + 0.45);
  await until(S(36)); await play(...boxOff(), new M.FadeIn(slab), new M.FadeIn(slabLab),
    new M.LaggedStart(blocks.map(b => new M.FadeIn(b)), { lagRatio: 0.4, runTime: 1.4 }), new M.Create(gap), new M.FadeIn(floatLab), ...say('GROUNDED = STANDS ON THE PASSAGE', C.green));

  // 37-39 two out of three, as a percent
  await until(S(37)); await play(out(slab, slabLab, ...blocks, gap, floatLab), ...fbox(['2 ÷ 3 = 0.666…', ['about 0.67', C.amber]]), ...say('TWO OUT OF THREE', C.amber));
  await until(S(38)); await play(...fbox(['2 ÷ 3 ≈ 0.67', ['out of 100: about 67', C.amber]]), ...say('OUT OF 100 → ABOUT 67', C.amber));
  await until(S(39)); await play(...fbox(['about 67 out of 100', ['= 67%  (percent)', C.amber]]), ...say('PERCENT = OUT OF 100', C.green));

  // 40-42 the formula
  await until(S(40)); await play(...say('THE SHORT VERSION, IN ONE LINE'));
  await until(S(41)); await play(...fbox([['groundedness = supported ÷ claims', C.ink]]));
  await until(S(42)); await play(...fbox(['groundedness = supported ÷ claims', ['             = 2 ÷ 3', C.muted], ['             ≈ 67%', C.amber]]));

  // 43-45 what it is for
  await until(S(43)); await play(new M.LaggedStart(marks.map(m => new M.Indicate(m)), { lagRatio: 0.4, runTime: 1.6 }), ...say('STICKS TO ITS PASSAGE, OR ADDS?', C.violet));
  const addBox = rowBox(AC, 2, C.pink);
  await until(S(44)); await play(new M.Create(addBox), new M.Flash(marks[2], { color: C.pink }), ...say('IT POINTS TO THE ADDED SENTENCE', C.pink));
  const miniAt = k => P ? [(k % 5 - 2) * 1.45, G + 0.1 - Math.floor(k / 5) * 1.3] : [(k - 4.5) * 1.2, G - 0.35];
  const minis = TOPIC.map((col, k) => {
    const [x, y] = miniAt(k);
    const r = new M.RoundedRectangle({ width: P ? 1.15 : 0.95, height: 0.55, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    r.setFill(col, k === 6 ? 0.25 : 0.08); r.moveTo([x, y, 0]);
    const t = T('Q' + (k + 1), 15, col, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  });
  const vals = TOPIC.map((_, k) => { const [x, y] = miniAt(k); const t = T(k === 6 ? '67%' : '?', 16, k === 6 ? C.amber : C.muted, true); t.moveTo([x, y + 0.55, 0]); return t; });
  await until(S(45)); await play(new M.FadeOut(addBox), ...boxOff(), new M.FadeIn(new M.VGroup(...minis, ...vals)), ...say('REPEAT ON EVERY CARD'));
  await play(new M.LaggedStart(minis.map(m => new M.Indicate(m)), { lagRatio: 0.15, runTime: 2.0 }));

  // 46-50 the trap: grounded is not correct
  await until(S(46)); await play(out(...minis, ...vals), ...say('TRAP: GROUNDED ≠ CORRECT', C.pink));
  await until(S(47)); await play(new M.Indicate(arow[2], { color: C.amber }), new M.Flash(marks[2], { color: C.pink }), ...say('MAYBE TRUE, YET NOT IN ITS SOURCE', C.amber));
  const wChecks = [-0.5, 0, 0.5].map(x => tick(x, G + 0.4));
  const w1 = fit(T('all claims supported: 100% grounded', 16, C.green), FW - 0.8); w1.moveTo([0, G, 0]);
  const w2 = T('and still a wrong answer', 16, C.pink); w2.moveTo([0, G - 0.35, 0]);
  await until(S(48)); await play(new M.FadeIn(new M.VGroup(...wChecks, w1)), ...say('FULLY SUPPORTED, STILL WRONG', C.pink));
  await play(new M.FadeIn(w2));
  const stamp = pill('OLD PASSAGE: THE RULE HAS CHANGED', C.amber, 15); stamp.moveTo([0, G - 0.75, 0]);
  await until(S(49)); await play(new M.FadeIn(stamp), ...say('THE PASSAGE IS OUT OF DATE', C.amber));
  await until(S(50)); await play(out(...wChecks, w1, w2, stamp),
    new M.LaggedStart([...links, ...pbadges, ...marks].map(x => new M.Indicate(x, { color: C.violet })), { lagRatio: 0.25, runTime: 2.0 }), ...say('IT CHECKS THE LINK, NOT THE TRUTH', C.violet));
  await until(S(51)); await play(...say('RIGHT OR WRONG? NEXT LESSON', C.muted));

  // 52 recap
  await until(S(52)); await play(...fbox(['groundedness = supported ÷ claims', ['             = 2 ÷ 3 ≈ 67%', C.amber]], C.green), ...say('SHARE OF CLAIMS ITS PASSAGE SUPPORTS', C.green));
}

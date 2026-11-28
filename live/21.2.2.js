// 21.2.2 Benchmark contamination: are the test questions new to the assistant? (live lesson, script.v5.md)
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.2, -0.2, 0];   // beside the cards
  const BOXL = P ? [0, -2.95, 0] : [0, -2.1, 0];   // under the word rows
  const BOXC = P ? [0, 0.4, 0] : [0, -0.3, 0];     // alone in the middle
  const BW = P ? FW - 1.2 : 7;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const gone = (...xs) => new M.FadeOut(new M.VGroup(...xs.flat()));

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan, at = BOXP, maxw = P ? FW - 1.2 : 4.0) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const left = at[0] - wd / 2 + 0.35, top = at[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // a question card: number, question mark, agreed-answer bar
  const CW = 0.8, CH = 0.95;
  function card(n, p, color = C.cyan) {
    const r = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.1, color, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo(p);
    const num = T(String(n), 14, color, true, true); num.moveTo([p[0], p[1] + 0.27, 0]);
    const q = T('?', P ? 20 : 22, C.ink, false, true); q.moveTo([p[0], p[1] - 0.03, 0]);
    const ans = new M.Rectangle({ width: CW * 0.55, height: 0.07, color: C.green, strokeWidth: 1 }); ans.setFill(C.green, 0.9); ans.moveTo([p[0], p[1] - 0.3, 0]);
    return new M.VGroup(r, num, q, ans);
  }
  const mark = (p, ok) => T(ok ? '✓' : '✗', 22, ok ? C.green : C.pink, false, true).moveTo([p[0], p[1] - CH / 2 - 0.22, 0]);
  function agent(label, p, color, w = 1.7) {
    const r = new M.RoundedRectangle({ width: w, height: 0.62, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(p);
    const t = T(label, 15, color, true, true); t.moveTo(p);
    return new M.VGroup(r, t);
  }
  function flag(x, y, color) {
    const pole = new M.Line({ start: [x, y - 0.2, 0], end: [x, y + 0.22, 0], color, strokeWidth: 2.5 });
    const cloth = new M.Polygon({ vertices: [[x, y + 0.22, 0], [x + 0.32, y + 0.11, 0], [x, y, 0]], color, strokeWidth: 1.5 });
    cloth.setFill(color, 0.25);
    return [pole, cloth];
  }

  // 0-5 the assistant, ten held-out cards, the first draft and its score
  const SPX = P ? 1.3 : 1.0, GCX = P ? 0 : -3.0, ROWY = P ? [1.1, -0.45] : [0.75, -0.75];
  const cpos = k => [GCX + (k % 5 - 2) * SPX, ROWY[Math.floor(k / 5)], 0];
  const AP = P ? [0, -4.6, 0] : [GCX, -2.45, 0];
  const helper = agent('ASSISTANT', AP, C.cyan);
  const guide = agent('GUIDE', [AP[0] - 2.6, AP[1], 0], C.muted, 1.2);
  const toHelper = new M.Arrow({ start: [AP[0] - 2.0, AP[1], 0], end: [AP[0] - 0.9, AP[1], 0], color: C.muted, strokeWidth: 2.5 });
  await until(S(0)); await play(new M.FadeIn(guide), new M.FadeIn(helper), new M.Create(toHelper), ...say('LIBRARY ASSISTANT: ANSWERS FROM THE GUIDE'));
  const held = Array.from({ length: 10 }, (_, k) => card(k + 1, cpos(k), C.green));
  await until(S(1)); await play(new M.LaggedStart(held.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('10 CARDS: QUESTION + AGREED ANSWER', C.green));
  const hx = 2 * SPX + CW / 2 + 0.18, hy0 = ROWY[0] + CH / 2 + 0.15, hy1 = ROWY[1] - CH / 2 - 0.15;
  const fence = [[[-hx, hy0], [hx, hy0]], [[hx, hy0], [hx, hy1]], [[hx, hy1], [-hx, hy1]], [[-hx, hy1], [-hx, hy0]]]
    .map(([a, b]) => new M.DashedLine({ start: [GCX + a[0], a[1], 0], end: [GCX + b[0], b[1], 0], color: C.green }));
  await until(S(2)); await play(...fence.map(f => new M.Create(f)), ...say('HELD OUT: BUILDERS NEVER SEE THEM', C.green));
  const RIGHT = [1, 1, 1, 1, 0, 1, 1, 1, 0, 1];
  const draft = Array.from({ length: 10 }, (_, k) => card(k + 1, cpos(k)));
  await until(S(3)); await play(gone(fence, held), new M.LaggedStart(draft.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.6 }), ...say('BEFORE: A FIRST DRAFT OF 10 CARDS'));
  const marks = RIGHT.map((ok, k) => mark(cpos(k), ok === 1));
  await until(S(4)); await play(new M.LaggedStart(marks.map(m => new M.FadeIn(m)), { lagRatio: 0.12, runTime: 1.6 }),
    ...fbox(['right = 8 of 10', ['      = 80%', C.green]], C.green), ...say('DRAFT SCORE: 8 OF 10 = 80%', C.green));
  await until(S(5)); await play(...say('BUT WAS THE TEST FAIR?', C.amber));

  // 6-11 the forty training examples
  const EG = P ? [0, -2.6] : [3.4, 0.0], EPX = P ? 0.55 : 0.5, EPY = P ? 0.36 : 0.38;
  const examples = Array.from({ length: 40 }, (_, j) => {
    const b = new M.Rectangle({ width: EPX - 0.12, height: EPY - 0.1, color: C.violet, strokeWidth: 1 });
    b.setFill(C.violet, 0.7); b.moveTo([EG[0] + (j % 8 - 3.5) * EPX, EG[1] + (2 - Math.floor(j / 8)) * EPY, 0]); return b;
  });
  const exLabel = T('40 EXAMPLES', 16, C.violet, true, true); exLabel.moveTo([EG[0], EG[1] + 2 * EPY + 0.42, 0]);
  await until(S(6)); await play(...dropBox(), new M.FadeIn(exLabel), new M.LaggedStart(examples.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.8 }),
    ...say('40 EXAMPLE QUESTIONS, EACH WITH A GOOD ANSWER', C.violet));
  const trainArrow = P
    ? new M.Arrow({ start: [0, EG[1] - 2 * EPY - 0.25, 0], end: [0, AP[1] + 0.4, 0], color: C.violet, strokeWidth: 2.5 })
    : new M.Arrow({ start: [EG[0] - 1.3, EG[1] - 2 * EPY - 0.2, 0], end: [AP[0] + 0.95, AP[1] + 0.15, 0], color: C.violet, strokeWidth: 2.5 });
  await until(S(7)); await play(new M.Create(trainArrow), ...say('TRAINING EXAMPLES: IT LEARNED FROM THESE', C.violet));
  await until(S(8)); await play(new M.LaggedStart(draft.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.1, runTime: 1.6 }), ...say('SOME DRAFT CARDS AMONG THE 40?', C.amber));
  await until(S(9)); await play(new M.Indicate(helper, { color: C.pink }), ...say('IT MIGHT JUST REMEMBER THE ANSWER', C.pink));
  await until(S(10)); await play(new M.LaggedStart(draft.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.15, runTime: 2.4 }), ...say('COMPARE EACH DRAFT CARD WITH ALL 40'));
  await until(S(11));
  const hit1 = card(2, cpos(1), C.amber);
  examples[12].setColor(C.amber); examples[12].setFill(C.amber, 0.95);
  await play(new M.FadeOut(draft[1]), new M.FadeIn(hit1), new M.Flash(examples[12], { color: C.amber }), ...say('MATCH 1: EASY TO SPOT', C.amber));
  draft[1] = hit1;

  // 12-15 match 1, word by word: an exact copy
  const WS = P ? 20 : 22, SW = P ? 1.85 : 1.5, PR = P ? 4 : 8, RH = 0.62, DY = P ? 1.2 : 0.8, EY = P ? -0.5 : -0.55;
  const wpos = (i, n, y) => { const r = Math.floor(i / PR), cnt = Math.min(PR, n - r * PR); return [(i % PR - (cnt - 1) / 2) * SW, y - r * RH, 0]; };
  const words = (s, y, color) => s.split(' ').map((w, i, a) => {
    const t = T(w, WS, color); if (t.getWidth() > SW - 0.2) t.scale((SW - 0.2) / t.getWidth()); t.moveTo(wpos(i, a.length, y)); return t; });
  const wbox = (i, n, y, color, sw = 2) => { const b = new M.Rectangle({ width: SW - 0.12, height: 0.44, color, strokeWidth: sw }); b.moveTo(wpos(i, n, y)); return b; };
  const head = (s, y, color) => { const t = T(s, 15, color, true, true); t.moveTo([0, y + 0.45, 0]); return t; };
  const FRI = 'When does the library close on Friday?';
  const BOOK_D = 'How many books can I borrow at once?', BOOK_E = 'How many books may I borrow at once?';
  let dLab = head('DRAFT CARD 2', DY, C.cyan), dW = words(FRI, DY, C.ink);
  await until(S(12)); await play(gone(helper, guide, toHelper, trainArrow, draft, marks, examples, exLabel), new M.FadeIn(new M.VGroup(dLab, ...dW)), ...say('DRAFT CARD 2 SAYS'));
  let eLab = head('TRAINING EXAMPLE', EY, C.violet), eW = words(FRI, EY, C.ink);
  await until(S(13)); await play(new M.FadeIn(new M.VGroup(eLab, ...eW)), ...say('ONE EXAMPLE SAYS EXACTLY THE SAME', C.violet));
  let dB = dW.map((_, i) => wbox(i, 7, DY, C.green)), eB = eW.map((_, i) => wbox(i, 7, EY, C.green));
  await until(S(14)); await play(new M.LaggedStart(dB.flatMap((b, i) => [new M.Create(b), new M.Create(eB[i])]), { lagRatio: 0.1, runTime: 1.8 }),
    ...fbox(['words in the question = 7', ['matching words        = 7', C.green]], C.green, BOXL, BW), ...say('7 WORDS, ALL 7 MATCH', C.green));
  await until(S(15)); await play(...fbox(['7 of 7 words match', ['→ EXACT COPY', C.pink]], C.pink, BOXL, BW), ...say('EXACT COPY', C.pink));

  // 16-22 match 2: one word changed
  await until(S(16)); await play(gone(dLab, eLab, dW, eW, dB, eB), ...dropBox(), ...say('MATCH 2: HARDER TO SPOT', C.amber));
  dLab = head('DRAFT CARD 6', DY, C.cyan); dW = words(BOOK_D, DY, C.ink);
  await until(S(17)); await play(new M.FadeIn(new M.VGroup(dLab, ...dW)), ...say('DRAFT CARD 6 SAYS'));
  eLab = head('TRAINING EXAMPLE', EY, C.violet); eW = words(BOOK_E, EY, C.ink);
  await until(S(18)); await play(new M.FadeIn(new M.VGroup(eLab, ...eW)), ...say('ONE TRAINING EXAMPLE SAYS', C.violet));
  dB = dW.map((_, i) => wbox(i, 8, DY, C.muted)); eB = eW.map((_, i) => wbox(i, 8, EY, C.muted));
  await until(S(19)); await play(new M.LaggedStart(dB.flatMap((b, i) => [new M.Create(b), new M.Create(eB[i])]), { lagRatio: 0.1, runTime: 1.8 }),
    ...fbox(['boxes = 8'], C.cyan, BOXL, BW), ...say('ONE WORD PER BOX: 8 BOXES'));
  const lit = [];
  for (let i = 0; i < 8; i++) { const c = i === 3 ? C.pink : C.green; lit.push(new M.Transform(dB[i], wbox(i, 8, DY, c, 3)), new M.Transform(eB[i], wbox(i, 8, EY, c, 3))); }
  await until(S(20)); await play(new M.LaggedStart(lit, { lagRatio: 0.12, runTime: 2.4 }),
    ...fbox(['matching boxes  = 7', ['different boxes = 1', C.pink]], C.green, BOXL, BW), ...say('7 MATCH · ONLY "CAN" → "MAY"', C.green));
  await until(S(21)); await play(...fbox(['matching words = 7', 'words          = 8', ['7 ÷ 8 = 87.5%', C.amber]], C.amber, BOXL, BW), ...say('7 OF 8 = 87.5%', C.amber));
  await until(S(22)); await play(...fbox(['7 of 8 words match', ['→ NEAR COPY', C.pink]], C.pink, BOXL, BW), ...say('NEAR COPY: REALLY THE SAME QUESTION', C.pink));

  // 23-29 the rule: flag if more than three quarters of the words match
  await until(S(23)); await play(...dropBox(), ...say('NEED A RULE THAT CATCHES NEAR COPIES', C.amber));
  const FX = P ? 1.3 : 1.15, FY = DY + 0.43;
  const [pole, cloth] = flag(FX, FY, C.muted);
  await until(S(24)); await play(new M.FadeIn(pole), new M.FadeIn(cloth), ...say('FLAG = MARK AS SUSPECT', C.pink));
  await until(S(25)); await play(...fbox(['flag a question if its', 'matching words are', ['more than 3/4 of its words', C.amber]], C.amber, BOXL, BW),
    ...say('RULE: MORE THAN 3/4 MATCH → FLAG', C.amber));
  const grp = (p, color, sw = 2.5) => { const a = wpos(2 * p, 8, DY), b = wpos(2 * p + 1, 8, DY);
    const g = new M.Rectangle({ width: 2 * SW - 0.02, height: 0.58, color, strokeWidth: sw }); g.moveTo([(a[0] + b[0]) / 2, a[1], 0]); return g; };
  const groups = [0, 1, 2, 3].map(p => grp(p, C.amber));
  await until(S(26)); await play(new M.LaggedStart(groups.map(g => new M.Create(g)), { lagRatio: 0.3, runTime: 1.6 }),
    ...fbox(['3/4 of 8 = ?', ['8 boxes → 4 groups of 2', C.amber]], C.amber, BOXL, BW), ...say('8 BOXES → 4 EQUAL GROUPS OF 2', C.amber));
  await until(S(27)); await play(new M.LaggedStart([0, 1, 2].map(p => new M.Transform(groups[p], grp(p, C.green, 4))), { lagRatio: 0.3, runTime: 1.4 }),
    ...fbox(['3 groups × 2 boxes = 6', ['3/4 of 8 = 6', C.amber]], C.amber, BOXL, BW), ...say('3/4 OF 8 = 6', C.amber));
  await until(S(28));
  pole.setColor(C.pink); cloth.setColor(C.pink); cloth.setFill(C.pink, 1);
  await play(new M.Flash(cloth, { color: C.pink }), ...fbox(['matching words = 7', ['7 > 6  →  FLAGGED', C.pink]], C.pink, BOXL, BW), ...say('7 IS MORE THAN 6: FLAGGED', C.pink));
  const dLab2 = head('DRAFT CARD 2', DY, C.cyan), dW2 = words(FRI, DY, C.ink), dB2 = dW2.map((_, i) => wbox(i, 7, DY, C.green, 3));
  const flag2 = flag(FX, FY, C.pink); flag2[1].setFill(C.pink, 1);
  await until(S(29)); await play(gone(dLab, eLab, dW, eW, dB, eB, groups, pole, cloth), new M.FadeIn(new M.VGroup(dLab2, ...dW2, ...dB2, ...flag2)),
    ...fbox(['7 of 7 words match', '3/4 of 7 = 5.25', ['7 > 5.25  →  FLAGGED', C.pink]], C.pink, BOXL, BW), ...say('EXACT COPY: ALSO FLAGGED', C.pink));

  // 30-35 the draft score in two groups
  const FL = [2, 6], CL = [1, 3, 4, 5, 7, 8, 10, 9];
  const fpos = P ? [[-0.65, 1.2, 0], [0.65, 1.2, 0]] : [[-5.9, 0.0, 0], [-4.9, 0.0, 0]];
  const KX = P ? [-1.95, -0.65, 0.65, 1.95] : [-2.6, -1.6, -0.6, 0.4], KY = P ? [-0.55, -2.1] : [0.75, -0.75];
  const kpos = c => [KX[c % 4], KY[Math.floor(c / 4)], 0];
  const fCards = FL.map((n, i) => card(n, fpos[i], C.pink)), fMarks = FL.map((n, i) => mark(fpos[i], true));
  const cCards = CL.map((n, c) => card(n, kpos(c))), cMarks = CL.map((n, c) => mark(kpos(c), RIGHT[n - 1] === 1));
  const fLab = T('FLAGGED', 16, C.pink, true, true); fLab.moveTo(P ? [-2.45, 1.2, 0] : [-5.4, -1.25, 0]);
  const cLab = T('CLEAN', 16, C.cyan, true, true); cLab.moveTo(P ? [0, -3.35, 0] : [-1.1, -1.9, 0]);
  await until(S(30)); await play(gone(dLab2, dW2, dB2, flag2), ...dropBox(),
    new M.LaggedStart([...fCards, ...cCards].map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...fMarks, ...cMarks, fLab, cLab)), ...say('THE DRAFT SCORES, IN TWO GROUPS'));
  await until(S(31)); await play(new M.LaggedStart([...fCards, ...fMarks].map(x => new M.Indicate(x, { color: C.pink })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['flagged: 2 of 2 right'], C.pink), ...say('FLAGGED: 2 OF 2 RIGHT', C.pink));
  await until(S(32)); await play(new M.LaggedStart(cMarks.map(m => new M.Indicate(m, { color: C.green })), { lagRatio: 0.15, runTime: 1.8 }),
    ...fbox(['flagged: 2 of 2 right', ['clean:   6 of 8 right', C.green]], C.green), ...say('CLEAN: 6 OF 8 RIGHT', C.green));
  const ox0 = KX[0] - CW / 2 - 0.12, ox1 = KX[2] + CW / 2 + 0.12, oy0 = KY[0] + CH / 2 + 0.1, oy1 = KY[1] - CH / 2 - 0.45;
  const three = new M.Rectangle({ width: ox1 - ox0, height: oy0 - oy1, color: C.green, strokeWidth: 2.5 }); three.moveTo([(ox0 + ox1) / 2, (oy0 + oy1) / 2, 0]);
  await until(S(33)); await play(new M.Create(three), ...fbox(['clean: 6 of 8 right', '6 ÷ 8 = 3/4', ['      = 75%', C.green]], C.green), ...say('6 OF 8 = 3/4 = 75%', C.green));
  await until(S(34)); await play(new M.LaggedStart(fCards.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }), ...say('COPIED = EASY WINS: SEEN BEFORE', C.amber));
  await until(S(35)); await play(...fbox(['with copies: 8 of 10 = 80%', ['clean only:  6 of 8  = 75%', C.green]], C.green), ...say('75%: MORE HONEST THAN 80%', C.green));

  // 36 a benchmark: one fixed set of cards, used to compare assistants
  const bpos = k => P ? [(k % 5 - 2) * 1.3, [1.1, -0.35][Math.floor(k / 5)], 0] : [(k - 4.5) * 0.95, 0.55, 0];
  const bench = Array.from({ length: 10 }, (_, k) => card(k + 1, bpos(k)));
  const AY = P ? -2.3 : -1.75, AX = P ? 1.9 : 2.4, ay0 = P ? -0.95 : -0.05;
  const asA = agent('ASSISTANT A', [-AX, AY, 0], C.cyan, 2.0), asB = agent('ASSISTANT B', [AX, AY, 0], C.amber, 2.0);
  const toA = new M.Arrow({ start: [-0.3, ay0, 0], end: [-AX + 0.3, AY + 0.4, 0], color: C.muted, strokeWidth: 2.5 });
  const toB = new M.Arrow({ start: [0.3, ay0, 0], end: [AX - 0.3, AY + 0.4, 0], color: C.muted, strokeWidth: 2.5 });
  await until(S(36)); await play(gone(fCards, fMarks, cCards, cMarks, fLab, cLab, three), ...dropBox(),
    new M.LaggedStart(bench.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.4 }), new M.FadeIn(asA), new M.FadeIn(asB), new M.Create(toA), new M.Create(toB),
    ...say('BENCHMARK = FIXED TEST SET TO COMPARE ASSISTANTS'));

  // 37-39 a drop of dye colours the whole glass
  const GP = P ? [0, 0.3] : [-3.2, -0.4];
  const gv = pts => pts.map(([x, y]) => [GP[0] + x, GP[1] + y, 0]);
  const glass = [[[-0.9, 1.1], [-0.7, -1.1]], [[-0.7, -1.1], [0.7, -1.1]], [[0.7, -1.1], [0.9, 1.1]]]
    .map(([a, b]) => new M.Line({ start: gv([a])[0], end: gv([b])[0], color: C.ink, strokeWidth: 3 }));
  const waterAt = (color, op) => { const w = new M.Polygon({ vertices: gv([[-0.82, 0.6], [-0.66, -1.04], [0.66, -1.04], [0.82, 0.6]]), color, strokeWidth: 1 }); w.setFill(color, op); return w; };
  const water = waterAt(C.cyan, 0.22);
  const drop = new M.Dot({ point: [GP[0], GP[1] + 1.5, 0], radius: 0.11, color: C.pink });
  await until(S(37)); await play(gone(bench, asA, asB, toA, toB), ...glass.map(g => new M.FadeIn(g)), new M.FadeIn(water), new M.FadeIn(drop), ...say('A DROP OF DYE IN CLEAN WATER', C.pink));
  await play(new M.Transform(drop, new M.Dot({ point: [GP[0], GP[1] + 0.6, 0], radius: 0.06, color: C.pink })));
  await play(new M.Transform(water, waterAt(C.pink, 0.55)), new M.FadeOut(drop), ...say('A LITTLE COLOURS IT ALL', C.pink));
  const SB = P ? { x0: -2.7, y: -2.3, px: 0.6 } : { x0: 0.6, y: -0.4, px: 0.5 };
  const sx = k => SB.x0 + k * SB.px;
  const blocks = Array.from({ length: 10 }, (_, k) => { const c = k === 1 || k === 5 ? C.pink : C.cyan;
    const b = new M.Rectangle({ width: SB.px - 0.12, height: 0.5, color: c, strokeWidth: 1 }); b.setFill(c, 0.82); b.moveTo([sx(k), SB.y, 0]); return b; });
  const sLab = T('10 TEST QUESTIONS', 15, C.muted, true); sLab.moveTo([(sx(0) + sx(9)) / 2, SB.y + 0.55, 0]);
  const whole = new M.Rectangle({ width: 10 * SB.px + 0.15, height: 0.78, color: C.pink, strokeWidth: 2.5 }); whole.moveTo([(sx(0) + sx(9)) / 2, SB.y, 0]);
  const wLab = T('SCORE: 80%', 18, C.pink, true, true); wLab.moveTo([(sx(0) + sx(9)) / 2, SB.y - 0.75, 0]);
  await until(S(38)); await play(new M.FadeIn(sLab), new M.LaggedStart(blocks.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }), ...say('A FEW COPIES COLOUR THE WHOLE SCORE', C.pink));
  await play(new M.Create(whole), new M.FadeIn(wLab), ...say('THE BENCHMARK IS CONTAMINATED', C.pink));
  await until(S(39)); await play(new M.Indicate(water, { color: C.pink }), ...say('BENCHMARK CONTAMINATION', C.pink));

  // 40-43 the check in one line
  await until(S(40)); await play(gone(glass, water, blocks, sLab, whole, wLab), ...say('THE CHECK IN ONE LINE'));
  const nDL = head('DRAFT CARD 6', DY, C.cyan), nEL = head('TRAINING EXAMPLE', EY, C.violet);
  const nD = words(BOOK_D, DY, C.ink), nE = words(BOOK_E, EY, C.ink);
  const nDB = nD.map((_, i) => wbox(i, 8, DY, i === 3 ? C.pink : C.green, 3)), nEB = nE.map((_, i) => wbox(i, 8, EY, i === 3 ? C.pink : C.green, 3));
  const worked = [nDL, nEL, ...nD, ...nE, ...nDB, ...nEB];
  await until(S(41)); await play(new M.FadeIn(new M.VGroup(...worked)), ...fbox(['overlap = matching words', '        ÷ words in the question'], C.cyan, BOXL, BW));
  await until(S(42)); await play(...fbox(['overlap = matching words', '        ÷ words in the question', ['flag if overlap > 3/4', C.amber]], C.amber, BOXL, BW), ...say('MORE THAN 3/4 → FLAG', C.amber));
  await until(S(43)); await play(...fbox(['near copy: 7 ÷ 8 = 87.5%', '87.5% > 75% (3/4)', ['→ FLAGGED', C.pink]], C.pink, BOXL, BW), ...say('NEAR COPY: 87.5% → FLAGGED', C.pink));

  // 44-46 the two flagged cards are replaced
  const fixed = Array.from({ length: 10 }, (_, k) => card(k + 1, bpos(k), k === 1 || k === 5 ? C.pink : C.cyan));
  await until(S(44)); await play(gone(worked), ...dropBox(), new M.LaggedStart(fixed.map(c => new M.FadeIn(c)), { lagRatio: 0.06, runTime: 1.2 }), ...say('REPLACE THE 2 FLAGGED CARDS', C.green));
  const fresh = [1, 5].map(k => card(k + 1, bpos(k), C.green));
  await play(new M.FadeOut(fixed[1]), new M.FadeOut(fixed[5]), new M.FadeIn(fresh[0]), new M.FadeIn(fresh[1]));
  fixed[1] = fresh[0]; fixed[5] = fresh[1];
  const caps = [['Saturday', 1], ['DVDs', 5]].map(([s, k]) => T(s, 16, C.green, false, true).moveTo([bpos(k)[0], bpos(k)[1] - CH / 2 - 0.25, 0]));
  await until(S(45)); await play(...caps.map(c => new M.FadeIn(c)), new M.LaggedStart(fresh.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.3, runTime: 1.2 }),
    ...say('CARD 2: SATURDAY · CARD 6: DVDs', C.green));
  await until(S(46)); await play(new M.LaggedStart(fixed.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.1, runTime: 1.8 }), ...say('SCORE = NEW QUESTIONS, NOT MEMORY', C.green));

  // 47-50 the trap: exact copies only
  const R1 = P ? 1.0 : 0.8, R2 = P ? -0.6 : -0.5;
  const sentence = (s, y) => { const t = T(s, P ? 20 : 24, C.ink); if (t.getWidth() > FW - 0.8) t.scale((FW - 0.8) / t.getWidth()); t.moveTo([0, y, 0]); return t; };
  const q1 = sentence(FRI, R1), q2 = sentence(BOOK_D, R2);
  await until(S(47)); await play(gone(fixed, caps), new M.FadeIn(q1), new M.FadeIn(q2),
    ...fbox(['exact-only check:', 'flag only a 100% match'], C.amber, BOXL, BW), ...say('TRAP: CHECKING ONLY EXACT COPIES', C.amber));
  const t1 = pill('CAUGHT: 7 OF 7 MATCH', C.green, P ? 18 : 19); if (t1.getWidth() > FW - 0.6) t1.scale((FW - 0.6) / t1.getWidth()); t1.moveTo([0, R1 - 0.55, 0]);
  await until(S(48)); await play(new M.FadeIn(t1));
  const t2 = pill('MISSED: 7 OF 8, ONE WORD CHANGED', C.pink, P ? 18 : 19); if (t2.getWidth() > FW - 0.6) t2.scale((FW - 0.6) / t2.getWidth()); t2.moveTo([0, R2 - 0.55, 0]);
  await until(S(49)); await play(new M.FadeIn(t2), new M.Flash(t2, { color: C.pink }));
  await until(S(50)); await play(...fbox(['check exact AND near copies', ['overlap > 3/4  →  flag', C.amber]], C.green, BOXL, BW),
    ...say('BEFORE TRUSTING A SCORE: CHECK FOR COPIES', C.green));
}

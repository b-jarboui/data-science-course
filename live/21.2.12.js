// 21.2.12 Deployment decisions: a sealed rule, a paired comparison on 100 held-out cards, and an interval against zero.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  // chapters/21.2.md: 100 held-out cards (50 hours, 30 loans, 20 rooms). A is right on 80, B on 86.
  // Card by card: both right 76, only B 10, only A 4, both wrong 10. Difference (10 − 4) ÷ 100 = 6 points,
  // paired standard error about 3.7, 95% interval about −1 to +13. Rule written first: switch only if the whole interval is above 0.
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const N = 100, COUNTS = [76, 10, 4, 10];
  // a fixed shuffle so the four kinds of card are spread over the grid
  const kind = [];
  COUNTS.forEach((n, b) => { for (let i = 0; i < n; i++) kind.push(b); });
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [kind[i], kind[j]] = [kind[j], kind[i]]; }
  const aRight = k => kind[k] === 0 || kind[k] === 2, bRight = k => kind[k] === 0 || kind[k] === 1;

  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  let BOXP = P ? [0, 3.4, 0] : [4.35, 0.5, 0];
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

  function bot(p, color, name) {
    const ring = new M.Circle({ radius: 0.5, color, strokeWidth: 3 }); ring.setFill(color, 0.15); ring.moveTo(p);
    const t = T(name, 32, color, false, true); t.moveTo(p);
    return new M.VGroup(ring, t);
  }
  function person(p, color) {
    const head = new M.Circle({ radius: 0.12, color }); head.setFill(color, 1); head.moveTo([p[0], p[1] + 0.3, 0]);
    const body = new M.Arc({ radius: 0.22, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo([p[0], p[1], 0]);
    return new M.VGroup(head, body);
  }

  // 0-1 two assistants, each a language model
  const AP = P ? [-1.7, 0.5, 0] : [-5.0, -0.1, 0], BP = P ? [1.7, 0.5, 0] : [0.4, -0.1, 0];
  const botA = bot(AP, BLUE, 'A'), botB = bot(BP, ORANGE, 'B');
  const tagA = T('IN USE', 16, BLUE, true, true); tagA.moveTo([AP[0], AP[1] - 0.8, 0]);
  const tagB = T('NEWER', 16, ORANGE, true, true); tagB.moveTo([BP[0], BP[1] - 0.8, 0]);
  await until(S(0)); await play(new M.FadeIn(botA), new M.FadeIn(tagA), new M.FadeIn(botB), new M.FadeIn(tagB), ...say('A: IN USE · B: NEWER', ORANGE));
  const LMY = P ? -1.2 : -1.55, WY = P ? -1.95 : -2.3;
  const lm = T('“The library opens at …”', P ? 18 : 20, C.muted); lm.moveTo([CX, LMY, 0]);
  const words = ['noon', 'ten', 'nine'].map((w, i) => { const t = T(w, 20, i ? C.muted : C.green, true, true); t.moveTo([CX + (i - 1) * 1.1, WY, 0]); return t; });
  await until(S(1)); await play(new M.FadeIn(lm), new M.LaggedStart(words.map(w => new M.FadeIn(w)), { lagRatio: 0.3, runTime: 1.2 }), ...say('LANGUAGE MODEL: PREDICTS NEXT WORDS'));

  // 2-3 the earlier blind comparison: B preferred in 6 of 9
  const VOTES = ['B', 'B', 'A', 'B', 'B', 'A', 'B', 'B', 'A'], VY = P ? -1.6 : -1.95, VP = 0.55;
  const votes = VOTES.map((v, i) => {
    const c = v === 'B' ? ORANGE : BLUE, x = CX + (i - 4) * VP;
    const r = new M.RoundedRectangle({ width: 0.42, height: 0.42, cornerRadius: 0.06, color: c, strokeWidth: 2 }); r.setFill(c, 0.25); r.moveTo([x, VY, 0]);
    const t = T(v, 16, C.ink, true, true); t.moveTo([x, VY, 0]);
    return new M.VGroup(r, t);
  });
  const vNote = T('blind: whose answer was unknown', 15, C.muted); vNote.moveTo([CX, VY - 0.55, 0]);
  await until(S(2)); await play(new M.FadeOut(new M.VGroup(lm, ...words)), new M.LaggedStart(votes.map(v => new M.FadeIn(v)), { lagRatio: 0.15, runTime: 1.4 }), new M.FadeIn(vNote),
    ...fbox([['B preferred: 6 of 9', ORANGE], ['A preferred: 3 of 9', BLUE]]), ...say('READERS PREFERRED B: 6 OF 9', ORANGE));
  await until(S(3)); await play(new M.LaggedStart(votes.map(v => new M.Indicate(v, { color: C.pink })), { lagRatio: 0.12, runTime: 1.4 }),
    ...fbox([['preferred ≠ correct', C.pink], ['9 comparisons: small', C.muted]], C.pink), ...say('PREFERRED ≠ CORRECT · 9 IS SMALL', C.pink));

  // 4-6 the decision, deploying, and the sealed rule
  const arrow = new M.Arrow({ start: [AP[0] + 0.65, AP[1], 0], end: [BP[0] - 0.65, BP[1], 0], color: C.amber, strokeWidth: 3 });
  const q = T('?', 30, C.amber, false, true); q.moveTo([(AP[0] + BP[0]) / 2, AP[1] + 0.45, 0]);
  await until(S(4)); await play(new M.FadeOut(new M.VGroup(...votes, vNote)), new M.Create(arrow), new M.FadeIn(q), ...unbox(), ...say('SWITCH EVERYONE FROM A TO B?', C.amber));
  const people = Array.from({ length: 7 }, (_, i) => person([CX + (i - 3) * (P ? 0.6 : 0.7), VY, 0], ORANGE));
  await until(S(5)); await play(new M.LaggedStart(people.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.2 }), new M.Indicate(botB, { color: ORANGE }),
    ...say('ON FOR EVERYONE = DEPLOYING', ORANGE));
  const EP = P ? [0, -6.25, 0] : [4.35, -2.3, 0], EW = 1.1, EH = 0.7;
  const eTop = EP[1] + EH / 2, eL = EP[0] - EW / 2, eR = EP[0] + EW / 2, tip = [EP[0], EP[1] - 0.05, 0];
  const env = new M.Rectangle({ width: EW, height: EH, color: C.violet, strokeWidth: 2 }); env.setFill(C.card, 0.95); env.moveTo(EP);
  const flapL = new M.Line({ start: [eL, eTop, 0], end: tip, color: C.violet, strokeWidth: 2 });
  const flapR = new M.Line({ start: [eR, eTop, 0], end: tip, color: C.violet, strokeWidth: 2 });
  const seal = new M.Dot({ point: tip, radius: 0.09, color: C.pink });
  const eLab = T('RULE', 12, C.violet, true, true); eLab.moveTo([EP[0], EP[1] - 0.24, 0]);
  await until(S(6)); await play(new M.FadeIn(env), new M.Create(flapL), new M.Create(flapR), new M.FadeIn(seal), new M.FadeIn(eLab),
    ...say('RULE WRITTEN FIRST · SEALED', C.violet));

  // 7-9 one hundred held-out cards in the real mix
  const GP = P ? 0.3 : 0.28, GS = P ? 0.24 : 0.22, GY = P ? -0.4 : -0.75;
  const cell = (k, cx, cy, pitch = GP) => [cx + (k % 10 - 4.5) * pitch, cy - (Math.floor(k / 10) - 4.5) * pitch, 0];
  const sq = (p, color, op = 0.3, size = GS) => { const r = new M.Rectangle({ width: size, height: size, color, strokeWidth: 1 }); r.setFill(color, op); r.moveTo(p); return r; };
  const cards = Array.from({ length: N }, (_, k) => sq(cell(k, CX, GY), C.ink, 0.2));
  await until(S(7));
  await play(new M.FadeOut(new M.VGroup(botA, botB, tagA, tagB, arrow, q, ...people)), new M.LaggedStart(cards.slice(0, 10).map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('10 CARDS: TOO FEW FOR A BIG DECISION', C.muted));
  await play(new M.LaggedStart(cards.slice(10).map(c => new M.FadeIn(c)), { lagRatio: 0.02, runTime: 1.6 }), ...say('TEST SET GROWS TO 100 QUESTIONS'));
  await until(S(8)); await play(...fbox(['held out =', ['never used while', C.green], ['building A or B', C.green]], C.green), ...say('HELD OUT: NOBODY USED THEM', C.green));
  const topic = k => k < 50 ? C.cyan : k < 80 ? C.pink : C.amber;
  await until(S(9)); await play(new M.LaggedStart(cards.map((c, k) => new M.Transform(c, sq(cell(k, CX, GY), topic(k), 0.6))), { lagRatio: 0.01, runTime: 1.5 }),
    ...fbox([['hours 50', C.cyan], ['loans 30', C.pink], ['rooms 20', C.amber]]), ...say('SAME MIX AS REAL QUESTIONS'));

  // 10-11 both assistants answer all one hundred, graded right or wrong
  const GDX = P ? 1.8 : 2.0, AX = CX - GDX, BX = CX + GDX, LY = GY + (P ? 1.85 : 1.75), CY = GY - (P ? 1.85 : 1.75);
  const bSq = cards.map((_, k) => sq(cell(k, BX, GY), ORANGE, 0.25));
  const gA = T('A', 26, BLUE, false, true); gA.moveTo([AX, LY, 0]);
  const gB = T('B', 26, ORANGE, false, true); gB.moveTo([BX, LY, 0]);
  await until(S(10)); await play(new M.LaggedStart(cards.map((c, k) => new M.Transform(c, sq(cell(k, AX, GY), BLUE, 0.25))), { lagRatio: 0.01, runTime: 1.4 }),
    new M.LaggedStart(bSq.map(b => new M.FadeIn(b)), { lagRatio: 0.01, runTime: 1.4 }), new M.FadeIn(gA), new M.FadeIn(gB),
    ...unbox(), ...say('A AND B ANSWER ALL 100 · RIGHT OR WRONG'));
  const cA = T('80 right · 80%', 18, BLUE, true, true); cA.moveTo([AX, CY, 0]);
  const cB = T('86 right · 86%', 18, ORANGE, true, true); cB.moveTo([BX, CY, 0]);
  await until(S(11)); await play(new M.LaggedStart(cards.map((c, k) => new M.Transform(c, sq(cell(k, AX, GY), aRight(k) ? C.green : C.pink, 0.75))), { lagRatio: 0.01, runTime: 1.8 }),
    new M.LaggedStart(bSq.map((c, k) => new M.Transform(c, sq(cell(k, BX, GY), bRight(k) ? C.green : C.pink, 0.75))), { lagRatio: 0.01, runTime: 1.8 }),
    new M.FadeIn(cA), new M.FadeIn(cB), ...fbox([['A: 80 of 100 = 80%', BLUE], ['B: 86 of 100 = 86%', ORANGE]]), ...say('A 80% · B 86%'));

  // 12-17 the same cards: sort the hundred pairs into four boxes
  const MP = P ? [0, 0.3] : [4.35, -0.45], MPI = P ? 0.22 : 0.25, MS = P ? 0.17 : 0.2;
  const BC = [C.green, ORANGE, BLUE, C.pink], BNAME = ['BOTH RIGHT', 'ONLY B', 'ONLY A', 'BOTH WRONG'];
  const BW = P ? 3.7 : 2.15, BH = P ? 1.65 : 2.3, TP = P ? 0.17 : 0.19, TS = P ? 0.13 : 0.15, TC = P ? 19 : 10;
  const bxy = b => P ? [b % 2 ? 1.9 : -1.9, b < 2 ? -1.9 : -3.7] : [-5.6 + b * 2.2, -0.85];
  const tpos = (b, j, n) => { const [x, y] = bxy(b), cols = Math.min(n, TC); return [x + (j % TC - (cols - 1) / 2) * TP, y + BH / 2 - 0.5 - Math.floor(j / TC) * TP, 0]; };
  const poolLab = T('cards still to sort', 15, C.muted, true); poolLab.moveTo([MP[0], MP[1] + (P ? 1.4 : 1.55), 0]);
  const boxR = [], boxN = [], boxC = [];
  for (let b = 0; b < 4; b++) {
    const [x, y] = bxy(b), top = y + BH / 2;
    const r = new M.RoundedRectangle({ width: BW, height: BH, cornerRadius: 0.14, color: BC[b], strokeWidth: 2 }); r.moveTo([x, y, 0]); boxR.push(r);
    const t = T(BNAME[b], 13, BC[b], true, true); t.moveTo([x - BW / 2 + 0.15 + t.getWidth() / 2, top - 0.22, 0]); boxN.push(t);
    const c = T(String(COUNTS[b]), 20, BC[b], true, true); c.moveTo([x + BW / 2 - 0.15 - c.getWidth() / 2, top - 0.22, 0]); boxC.push(c);
  }
  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(gA, gB, cA, cB)), ...unbox(),
    new M.LaggedStart([...cards.map((c, k) => new M.Transform(c, sq(cell(k, MP[0], MP[1], MPI), C.ink, 0.35, MS))),
      ...bSq.map((c, k) => new M.Transform(c, sq(cell(k, MP[0], MP[1], MPI), C.ink, 0.35, MS)))], { lagRatio: 0.005, runTime: 1.8 }),
    ...say('SAME QUESTIONS → ONE PAIR PER CARD'));
  await play(new M.FadeOut(new M.VGroup(...bSq), { runTime: 0.3 }), new M.LaggedStart(boxR.map(r => new M.Create(r)), { lagRatio: 0.2, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...boxN)), new M.FadeIn(poolLab), ...say('SORT THE 100 CARDS INTO 4 BOXES'));
  for (let b = 0; b < 4; b++) {
    await until(S(13 + b));
    const ks = kind.map((_, k) => k).filter(k => kind[k] === b);
    await play(new M.LaggedStart(ks.map((k, j) => new M.Transform(cards[k], sq(tpos(b, j, ks.length), BC[b], 0.85, TS))), { lagRatio: b ? 0.15 : 0.02, runTime: b ? 1.0 : 1.5 }),
      new M.FadeIn(boxC[b]), ...say(`${BNAME[b]}: ${COUNTS[b]} CARDS`, BC[b]));
  }
  await until(S(17)); await play(new M.FadeOut(poolLab), new M.LaggedStart(boxC.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.25, runTime: 1.4 }),
    ...fbox(['76 + 10 + 4 + 10', ['= 100 cards', C.green]], C.green), ...say('EVERY CARD COUNTED ONCE', C.green));

  // 18-25 a tug of war: only the cards where they differ pull
  const RY = P ? -1.2 : -0.7, RH = P ? 2.5 : 3.5, STEP = P ? 0.2 : 0.25, TPI = P ? 0.23 : 0.28, TSZ = P ? 0.2 : 0.22;
  const rope = new M.Line({ start: [CX - RH, RY, 0], end: [CX + RH, RY, 0], color: C.muted, strokeWidth: 4 });
  const tA = bot([CX - RH - 0.5, RY, 0], BLUE, 'A'), tB = bot([CX + RH + 0.5, RY, 0], ORANGE, 'B');
  const mid = new M.DashedLine({ start: [CX, RY - 0.8, 0], end: [CX, RY + 1.1, 0], color: C.muted });
  const knot = new M.Line({ start: [CX, RY - 0.25, 0], end: [CX, RY + 0.25, 0], color: C.ink, strokeWidth: 6 });
  await until(S(18));
  await play(new M.FadeOut(new M.VGroup(...boxR, ...boxN, ...boxC, ...cards), { runTime: 0.6 }), ...unbox());
  await play(new M.Create(rope), new M.FadeIn(tA), new M.FadeIn(tB), new M.Create(mid), new M.FadeIn(knot), ...say('A TUG OF WAR: A ←   → B', C.amber));
  const npT = T('76 + 10 cards · no pull', 16, C.muted, true);
  const npR = new M.RoundedRectangle({ width: npT.getWidth() + 0.3, height: 0.5, cornerRadius: 0.12, color: C.muted, strokeWidth: 2 });
  npR.setFill(C.card, 0.95); npR.moveTo([CX, RY - 1.5, 0]); npT.moveTo([CX, RY - 1.5, 0]);
  await until(S(19)); await play(new M.FadeIn(npR), new M.FadeIn(npT),
    ...fbox([['both right: 76', C.green], ['both wrong: 10', C.pink], ['→ no pull either way', C.muted]], C.muted), ...say('SAME RESULT → NO PULL', C.muted));
  const bT = Array.from({ length: 10 }, (_, j) => sq([CX + 0.2 + j * TPI, RY + 0.4, 0], ORANGE, 0.85, TSZ));
  const aT = Array.from({ length: 4 }, (_, j) => sq([CX - 0.2 - j * TPI, RY + 0.4, 0], BLUE, 0.85, TSZ));
  const lab10 = T('10', 18, ORANGE, true, true); lab10.moveTo([CX + 0.2 + 4.5 * TPI, RY + 0.85, 0]);
  const lab4 = T('4', 18, BLUE, true, true); lab4.moveTo([CX - 0.2 - 1.5 * TPI, RY + 0.85, 0]);
  await until(S(20)); await play(new M.LaggedStart([...bT, ...aT].map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.6 }), new M.FadeIn(lab10), new M.FadeIn(lab4),
    ...fbox([['only B: 10 → pull to B', ORANGE], ['only A:  4 → pull to A', BLUE]], C.amber), ...say('ONLY DIFFERENT CARDS PULL: 10 vs 4', C.amber));
  const lab6 = T('6', 18, ORANGE, true, true); lab6.moveTo([CX + 0.2 + 6.5 * TPI, RY + 0.85, 0]);
  await until(S(21)); await play(new M.FadeOut(new M.VGroup(...aT, ...bT.slice(0, 4), lab10, lab4)), new M.FadeIn(lab6),
    new M.Transform(knot, new M.Line({ start: [CX + 6 * STEP, RY - 0.25, 0], end: [CX + 6 * STEP, RY + 0.25, 0], color: ORANGE, strokeWidth: 6 })),
    ...fbox(['10 − 4 = 6 cards', ['out of 100 cards', C.muted]], ORANGE), ...say('B WINS BY 6 OF 100', ORANGE));
  await until(S(22)); await play(...fbox(['6 ÷ 100 = 6%', ['= 86% − 80%', C.muted], ['= 6 percentage points', C.amber]], C.amber), ...say('6 PERCENTAGE POINTS', C.amber));
  await until(S(23)); await play(new M.Indicate(tA, { color: C.green }), new M.Indicate(tB, { color: C.green }),
    ...fbox(['same cards for A and B', ['= paired comparison', C.green]], C.green), ...say('PAIRED COMPARISON', C.green));
  await until(S(24)); await play(...fbox(['diff = (only B − only A)', '       ÷ number of cards', ['     = (10 − 4) ÷ 100 = 6%', C.amber]]),
    ...say('DIFFERENCE = (ONLY B − ONLY A) ÷ CARDS'));
  await until(S(25)); await play(new M.Indicate(knot, { color: C.amber }), ...say('B: +6 POINTS · ENOUGH TO SWITCH?', C.amber));

  // 26-28 our hundred is only a sample of all questions
  const FC = P ? 10 : 16, FR = P ? 14 : 8, FPI = 0.45, FY = P ? -1.6 : -0.6;
  const fpos = (c, r) => [CX + (c - (FC - 1) / 2) * FPI, FY + ((FR - 1) / 2 - r) * FPI, 0];
  const PATCH = P ? [[1, 2], [6, 5], [2, 8], [6, 11]] : [[1, 1], [6, 4], [11, 1], [12, 5]];
  const inPatch = (c, r) => PATCH.some(([pc, pr]) => c >= pc && c < pc + 3 && r >= pr && r < pr + 2);
  const field = [];
  for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) if (!inPatch(c, r)) field.push(new M.Dot({ point: fpos(c, r), radius: 0.05, color: C.muted }));
  function patch([pc, pr], color, s) {
    const a = fpos(pc, pr), b = fpos(pc + 2, pr + 1), p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0];
    const r = new M.RoundedRectangle({ width: 3 * FPI - 0.08, height: 2 * FPI - 0.08, cornerRadius: 0.1, color, strokeWidth: 2 }); r.setFill(color, 0.2); r.moveTo(p);
    const t = T(s, 15, color, true, true); t.moveTo(p);
    return new M.VGroup(r, t);
  }
  const ours = patch(PATCH[0], ORANGE, 'our 100');
  const others = [['lead +10', 1], ['lead +2', 2], ['no lead', 3]].map(([s, i]) => patch(PATCH[i], C.violet, s));
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(rope, tA, tB, mid, knot, npR, npT, ...bT.slice(4), lab6), { runTime: 0.6 }), ...unbox());
  await play(new M.LaggedStart(field.map(d => new M.FadeIn(d)), { lagRatio: 0.01, runTime: 1.4 }), new M.FadeIn(ours), ...say('OUR 100 = A SAMPLE OF ALL QUESTIONS'));
  await until(S(27)); await play(new M.LaggedStart(others.map(o => new M.FadeIn(o)), { lagRatio: 0.4, runTime: 1.8 }), ...say('ANOTHER 100: BIGGER, SMALLER, OR NO LEAD', C.violet));
  await until(S(28)); await play(...fbox(['true difference =', 'B’s score − A’s score', ['over ALL questions', C.muted]], C.green), ...say('WANTED: THE TRUE DIFFERENCE', C.green));

  // 29-33 a range of believable values, and the wobble behind its width
  if (P) BOXP = [0, -4.25, 0];
  const NLY = P ? -1.9 : -2.2, NX0 = P ? -3.6 : -6.6, NLEN = P ? 7.2 : 8.6;
  const nx = v => NX0 + (v + 5) / 25 * NLEN;
  const sg = v => v < 0 ? '−' + (-v) : String(v);
  const axis = new M.Line({ start: [nx(-5), NLY, 0], end: [nx(20), NLY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [-5, 0, 5, 10, 15, 20].map(v => new M.VGroup(
    new M.Line({ start: [nx(v), NLY - 0.07, 0], end: [nx(v), NLY + 0.07, 0], color: C.muted }),
    T(sg(v), P ? 19 : 17, C.muted, true).moveTo([nx(v), NLY - 0.35, 0])));
  const unit = T('points: B − A', P ? 17 : 15, C.muted); unit.moveTo([nx(20) - 0.8, NLY - 0.72, 0]);
  const dot6 = new M.Dot({ point: [nx(6), NLY, 0], radius: 0.11, color: ORANGE });
  const lab6b = T('6', 17, ORANGE, true, true); lab6b.moveTo([nx(6), NLY + 0.3, 0]);
  const qr = T('?', 24, C.muted, true, true); qr.moveTo([nx(6), NLY + 0.75, 0]);
  const qL = new M.Arrow({ start: [nx(6) - 0.25, NLY + 0.75, 0], end: [nx(6) - 1.5, NLY + 0.75, 0], color: C.muted, strokeWidth: 2 });
  const qR = new M.Arrow({ start: [nx(6) + 0.25, NLY + 0.75, 0], end: [nx(6) + 1.5, NLY + 0.75, 0], color: C.muted, strokeWidth: 2 });
  await until(S(29));
  await play(new M.FadeOut(new M.VGroup(...field, ours, ...others), { runTime: 0.6 }), ...unbox());
  await play(new M.Create(axis), new M.FadeIn(new M.VGroup(...ticks, unit)), new M.FadeIn(dot6), new M.FadeIn(lab6b),
    new M.FadeIn(qr), new M.Create(qL), new M.Create(qR),
    ...fbox([['true difference: unknown', C.muted], 'give a range of', 'believable values'], C.amber), ...say('CAN’T MEASURE IT · GIVE A RANGE', C.amber));
  await until(S(30)); await play(...unbox(), ...say('RANGE OF BELIEVABLE VALUES = INTERVAL', C.green));
  const ghosts = [10, 2, 0].map(v => { const g = new M.Circle({ radius: 0.11, color: C.violet, strokeWidth: 2 }); g.moveTo([nx(v), NLY, 0]); return g; });
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(qr, qL, qR)), new M.LaggedStart(ghosts.map(g => new M.FadeIn(g)), { lagRatio: 0.3, runTime: 1.2 }),
    ...fbox([['other 100s: 10, 2, 0', C.violet], ['our 100: 6', ORANGE]], C.violet), ...say('WIDTH ← HOW MUCH IT WOBBLES', C.violet));
  const seY = NLY + 0.75;
  const seLine = new M.Line({ start: [nx(6), seY, 0], end: [nx(9.7), seY, 0], color: C.amber, strokeWidth: 3 });
  const seEnds = [6, 9.7].map(v => new M.Line({ start: [nx(v), seY - 0.12, 0], end: [nx(v), seY + 0.12, 0], color: C.amber, strokeWidth: 3 }));
  const seLab = T('3.7', 16, C.amber, true, true); seLab.moveTo([nx(7.85), seY + 0.3, 0]);
  await until(S(32)); await play(new M.Create(seLine), new M.FadeIn(seEnds[0]), new M.FadeIn(seEnds[1]), new M.FadeIn(seLab),
    ...fbox(['typical wobble', ['= standard error', C.amber], ['≈ 3.7 points', C.amber]], C.amber), ...say('STANDARD ERROR ≈ 3.7 POINTS', C.amber));
  await until(S(33)); await play(...fbox(['easy card → both right', 'hard card → both wrong', ['→ wobble stays smaller', C.green]], C.green), ...say('PAIRING KEEPS THE WOBBLE SMALL', C.green));

  // 34-36 two wobbles each side, and why two: 19 ranges in 20
  const steps = [[6, 9.7], [9.7, 13.4], [6, 2.3], [2.3, -1.4]].map(([a, b]) => new M.VGroup(
    new M.Line({ start: [nx(a), seY, 0], end: [nx(b), seY, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [nx(b), seY - 0.12, 0], end: [nx(b), seY + 0.12, 0], color: C.amber, strokeWidth: 3 })));
  await until(S(34)); await play(new M.FadeOut(new M.VGroup(...ghosts, seLine, ...seEnds, seLab)),
    new M.LaggedStart(steps.map(st => new M.Create(st)), { lagRatio: 0.6, runTime: 2.4 }),
    ...fbox(['6 − 2 × 3.7', '6 + 2 × 3.7'], C.amber), ...say('2 WOBBLES EACH SIDE OF 6', C.amber));
  const TRUE = 5, RP = P ? 0.16 : 0.13, R0 = NLY + 0.5;
  const CENT = [6, 3, 8, 1, 9, 5, 4, 10, 2, 7, 6, 11, 0, 5, 3, 8, 14, 4, 6, 2];
  const ranges = CENT.map((c, i) => {
    const ok = c - 7.4 <= TRUE && TRUE <= c + 7.4, y = R0 + i * RP;
    return new M.Line({ start: [nx(Math.max(-5, c - 7.4)), y, 0], end: [nx(Math.min(20, c + 7.4)), y, 0], color: ok ? C.green : C.pink, strokeWidth: 3 });
  });
  const topY = R0 + 19 * RP;
  const trueLine = new M.DashedLine({ start: [nx(TRUE), R0 - 0.15, 0], end: [nx(TRUE), topY + 0.15, 0], color: C.ink });
  const trueLab = T('true value (pretend)', 14, C.ink); trueLab.moveTo([nx(TRUE), P ? NLY - 0.8 : topY + 0.4, 0]);
  await until(S(35)); await play(new M.FadeOut(new M.VGroup(...steps)), new M.Create(trueLine), new M.FadeIn(trueLab),
    new M.LaggedStart(ranges.map(r => new M.Create(r)), { lagRatio: 0.15, runTime: 3.0 }),
    ...fbox(['repeat the test 20 times', ['19 ranges catch it', C.green], ['1 misses', C.pink]], C.green), ...say('REPEAT: ABOUT 19 IN 20 CATCH IT', C.green));
  await until(S(36)); await play(new M.Indicate(ranges[16], { color: C.pink }), ...fbox(['19 in 20 = 95%', ['→ 95% interval', C.green]], C.green), ...say('95% INTERVAL', C.green));

  // 37-42 six plus or minus seven: the bar and the bold mark at zero
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(...ranges, trueLine, trueLab)),
    ...fbox(['interval = 6 ± 2 × 3.7', ['         ≈ 6 ± 7', C.amber]], C.amber), ...say('6 ± 2 × 3.7 ≈ 6 ± 7', C.amber));
  const ends = [-1, 13].map(v => new M.Line({ start: [nx(v), NLY - 0.15, 0], end: [nx(v), NLY + 0.15, 0], color: C.amber, strokeWidth: 4 }));
  const endLabs = [['−1', -1], ['+13', 13]].map(([s, v]) => { const t = T(s, 17, C.amber, true, true); t.moveTo([nx(v), NLY + 1.15, 0]); return t; });
  await until(S(38)); await play(new M.FadeIn(ends[0]), new M.FadeIn(ends[1]), new M.FadeIn(endLabs[0]), new M.FadeIn(endLabs[1]),
    ...fbox(['6 − 7 ≈ −1', '6 + 7 = 13'], C.amber), ...say('ENDS: ABOUT −1 AND +13', C.amber));
  await until(S(39)); await play(...fbox([['interval ≈ −1 to +13', ORANGE], ['points', C.muted]], ORANGE), ...say('INTERVAL: ABOUT −1 TO +13 POINTS', ORANGE));
  const BARY = NLY + 0.7, BARH = 0.34;
  const barPart = (a, b, color) => { const r = new M.Rectangle({ width: nx(b) - nx(a), height: BARH, color, strokeWidth: 1 }); r.setFill(color, 0.8); r.moveTo([(nx(a) + nx(b)) / 2, BARY, 0]); return r; };
  const barL = barPart(-1, 0, ORANGE), barR = barPart(0, 13, ORANGE);
  const zero = new M.Line({ start: [nx(0), NLY - 0.18, 0], end: [nx(0), NLY + 0.45, 0], color: C.ink, strokeWidth: 7 });
  await until(S(40)); await play(new M.LaggedStart([new M.FadeIn(barL), new M.FadeIn(barR)], { lagRatio: 0.3, runTime: 1.0 }), new M.Create(zero),
    ...unbox(), ...say('THE INTERVAL AS A BAR · BOLD MARK AT 0'));
  await until(S(41)); await play(new M.Transform(barL, barPart(-1, 0, C.pink)), new M.Indicate(barR, { color: C.amber }), ...say('MOST ABOVE 0 · LEFT END POKES BELOW', C.pink));
  await until(S(42)); await play(new M.Flash(zero, { color: C.pink, flashRadius: 0.4 }),
    ...fbox([['0 is inside the interval', C.pink], ['“no real gain” is', C.muted], ['still believable', C.muted]], C.pink), ...say('ZERO IS STILL BELIEVABLE', C.pink));

  // 43-48 open the envelope: the rule decides
  const openTip = [EP[0], eTop + 0.35, 0];
  await until(S(43)); await play(new M.Transform(flapL, new M.Line({ start: [eL, eTop, 0], end: openTip, color: C.violet, strokeWidth: 2 })),
    new M.Transform(flapR, new M.Line({ start: [eR, eTop, 0], end: openTip, color: C.violet, strokeWidth: 2 })), new M.FadeOut(seal),
    ...fbox(['RULE: switch only if', 'the WHOLE interval', ['lies above 0', C.green]], C.violet), ...say('OPEN THE ENVELOPE', C.violet));
  await until(S(44)); await play(new M.Transform(zero, new M.Line({ start: [nx(0), NLY - 0.18, 0], end: [nx(0), NLY + 0.45, 0], color: C.green, strokeWidth: 7 })),
    ...fbox(['line fixed in advance', ['= prespecified threshold', C.green], ['here: 0', C.green]], C.green), ...say('PRESPECIFIED THRESHOLD · PRE = BEFORE', C.green));
  await until(S(45)); await play(new M.Indicate(barL, { color: C.pink }),
    ...fbox(['whole interval above 0?', ['no: −1 is below 0', C.pink], ['→ don’t switch yet', C.cyan]], C.pink), ...say('CROSSES 0 → DON’T SWITCH YET', C.pink));
  await until(S(46)); await play(new M.Indicate(barR, { color: C.amber }),
    ...fbox(['not “B is worse”', ['evidence: not strong', C.muted], ['enough yet', C.muted]]), ...say('NOT ENOUGH EVIDENCE YET', C.muted));
  const narrow = barPart(2.3, 9.7, C.green); narrow.moveTo([(nx(2.3) + nx(9.7)) / 2, NLY + 1.65, 0]);
  const nLab = T('more cards', 15, C.green, true); nLab.moveTo([nx(9.7) + 0.85, NLY + 1.65, 0]);
  await until(S(47)); await play(new M.FadeIn(narrow), new M.FadeIn(nLab),
    ...fbox(['more held-out cards', ['→ smaller wobble', C.green], ['→ narrower interval', C.green]], C.green), ...say('GATHER MORE HELD-OUT CARDS', C.green));
  await until(S(48)); await play(new M.FadeOut(new M.VGroup(narrow, nLab)),
    ...fbox(['whole interval above 0?', ['yes → switch to B', C.green], ['no  → keep A, test more', C.cyan]], C.green), ...say('A CLEAR YES OR NO, DECIDED FAIRLY', C.green));

  // 49-51 the trap: bending the rule after the results
  await until(S(49)); await play(new M.Indicate(env, { color: C.pink }), ...unbox(), ...say('TRAP: MOVING THE RULE AFTER THE RESULTS', C.pink));
  const m2 = new M.DashedLine({ start: [nx(-2), NLY - 0.18, 0], end: [nx(-2), NLY + 1.3, 0], color: C.pink });
  const m2Lab = T('−2 ?', 16, C.pink, true, true); m2Lab.moveTo([nx(-2), NLY + 1.55, 0]);
  await until(S(50)); await play(new M.Create(m2), new M.FadeIn(m2Lab), ...say('“SWITCH IF ABOVE −2”?', C.pink));
  await until(S(51)); await play(new M.Indicate(barL, { color: C.amber }),
    ...fbox(['−1 is above −2 → B passes', ['rule bent to fit the result', C.pink], ['→ protects nothing', C.pink]], C.pink), ...say('A BENT RULE NO LONGER PROTECTS', C.pink));

  // 52-54 recap and the end of the chapter
  await until(S(52)); await play(new M.FadeOut(new M.VGroup(m2, m2Lab)),
    ...fbox(['1 same cards for A and B', '2 interval for the difference', '3 follow the sealed rule'], C.green), ...say('RECAP', C.green));
  await until(S(53)); await play(...fbox(['fair test · retrieval', 'evidence · correctness', 'attacks · privacy · languages'], C.green), ...say('CHAPTER 21.2 DONE', C.green));
  await until(S(54)); await play(new M.Indicate(env, { color: C.green }), new M.Flash(zero, { color: C.green, flashRadius: 0.4 }), ...say('DECIDE CALMLY AND FAIRLY · WELL DONE', C.green));
}

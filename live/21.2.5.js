// 21.2.5 Answer correctness: grade each answer against the rule in force on the day it was asked.
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Shared data: chapters/21.2.md.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.4, 0] : [4.6, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fit = (t, w) => { if (t.getWidth() > w) t.scale(w / t.getWidth()); return t; };
  const at = (t, x, y) => { t.moveTo([x, y, 0]); return t; };
  const lft = (t, x, y) => at(t, x + t.getWidth() / 2, y);
  const rgt = (t, x, y) => at(t, x - t.getWidth() / 2, y);
  const frame = (w, h, p, color, r = 0.14) => { const b = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: 2 }); b.setFill(C.card, 0.95); b.moveTo(p); return b; };
  function person(x, y) {
    const head = new M.Circle({ radius: 0.085, color: C.green }); head.setFill(C.green, 1); head.moveTo([x, y + 0.22, 0]);
    const body = new M.Arc({ radius: 0.16, startAngle: 0, angle: Math.PI, color: C.green }); body.setFill(C.green, 1); body.moveTo([x, y + 0.01, 0]);
    return new M.VGroup(head, body);
  }

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan, where = BOXP) {
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(where);
    const left = where[0] - wd / 2 + 0.35, top = where[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => { const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length); t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]); });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // 0-4 a February question to the library's assistant
  const CAL = P ? [-2.6, 0.9] : [-5.2, 0.5];
  const cal = new M.VGroup(frame(1.5, 1.6, [CAL[0], CAL[1], 0], C.amber),
    at(fit(T('FEBRUARY', P ? 15 : 13, C.amber, true, true), 1.3), CAL[0], CAL[1] + 0.5),
    at(T('15', 34, C.ink, false, true), CAL[0], CAL[1] + 0.02),
    at(fit(T('Sunday visit', P ? 15 : 13, C.muted), 1.3), CAL[0], CAL[1] - 0.5));
  const QB = P ? [0.95, 0.9] : [-1.5, 0.6], QW = P ? 4.4 : 4.0;
  const qbub = new M.VGroup(frame(QW, 0.95, [QB[0], QB[1], 0], C.amber, 0.3),
    at(fit(T('What time does the library', 17, C.ink), QW - 0.4), QB[0], QB[1] + 0.2),
    at(fit(T('open on Sunday?', 17, C.ink), QW - 0.4), QB[0], QB[1] - 0.2));
  const AS = P ? [0, -1.3] : [3.9, 0.6];
  const asst = new M.VGroup(frame(2.4, 1.1, [AS[0], AS[1], 0], C.cyan),
    at(T('ASSISTANT', 17, C.cyan, true, true), AS[0], AS[1] + 0.2),
    at(T('language model', P ? 15 : 14, C.muted), AS[0], AS[1] - 0.22));
  const GD = P ? [0, -3.8] : [3.9, -1.8];
  const guide = new M.VGroup(frame(2.4, 1.4, [GD[0], GD[1], 0], C.violet),
    at(T('GUIDE', 17, C.violet, true, true), GD[0], GD[1] + 0.35),
    at(T('opening hours', P ? 15 : 14, C.ink), GD[0], GD[1]),
    at(T('lending rules', P ? 15 : 14, C.ink), GD[0], GD[1] - 0.33));
  const arr1 = P ? new M.Arrow({ start: [0, 0.35, 0], end: [0, -0.7, 0], color: C.muted })
    : new M.Arrow({ start: [QB[0] + QW / 2 + 0.1, QB[1], 0], end: [AS[0] - 1.3, AS[1], 0], color: C.muted });
  const arr2 = new M.Arrow({ start: [GD[0], GD[1] + 0.75, 0], end: [AS[0], AS[1] - 0.6, 0], color: C.violet });

  await until(S(0)); await play(new M.FadeIn(cal), ...say('MID-FEBRUARY: A SUNDAY VISIT', C.amber));
  await until(S(1)); await play(new M.FadeIn(qbub), ...say('WHAT TIME DOES IT OPEN ON SUNDAY?', C.amber));
  await until(S(2)); await play(new M.FadeIn(asst), new M.Create(arr1), ...say('LANGUAGE MODEL: A PROGRAM THAT WRITES ANSWERS'));
  await until(S(3)); await play(new M.FadeIn(guide), new M.Create(arr2), ...say('IT ANSWERS FROM THE GUIDE', C.violet));
  await until(S(4)); await play(new M.Indicate(asst, { color: C.amber }), ...say('IS ITS ANSWER RIGHT?', C.amber));

  // 5-6 ten held-out question cards
  const CW = P ? 1.25 : 1.2, CH = 1.3, GS = P ? 1.5 : 1.45, GCX = P ? 0 : -2.3;
  const GYS = P ? [0.95, -1.05] : [0.85, -1.25];
  const gx = k => GCX + (k % 5 - 2) * GS, gy = k => GYS[Math.floor(k / 5)];
  const TOPIC = k => k < 5 ? ['HOURS', C.cyan] : k < 8 ? ['LOANS', C.pink] : ['ROOMS', C.amber];
  const RIGHT = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1];
  function smallCard(k) {
    const x = gx(k), y = gy(k), [tp, col] = TOPIC(k);
    const r = frame(CW, CH, [x, y, 0], col, 0.12);
    const q = at(T('Q' + (k + 1), 17, C.ink, true, true), x, y + 0.38);
    const tg = at(fit(T(tp, P ? 15 : 13, col, true, true), CW - 0.2), x, y + 0.1);
    const strip = new M.Rectangle({ width: CW * 0.7, height: 0.07, color: C.muted, strokeWidth: 1 }); strip.setFill(C.muted, 0.6); strip.moveTo([x, y - 0.12, 0]);
    const stamp = new M.Rectangle({ width: CW * 0.74, height: 0.24, color: k ? C.muted : C.amber, strokeWidth: 1 }); stamp.moveTo([x, y - 0.4, 0]);
    const date = k ? null : at(fit(T('15 Feb', P ? 15 : 13, C.amber, true, true), CW * 0.66), x, y - 0.4);
    return { g: new M.VGroup(r, q, tg, strip, stamp, ...(date ? [date] : [])), date };
  }
  let cards = Array.from({ length: 10 }, (_, k) => smallCard(k));
  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(cal, qbub, asst, guide, arr1, arr2)),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c.g)), { lagRatio: 0.1, runTime: 1.6 }), ...say('10 HELD-OUT QUESTION CARDS'));
  const fx0 = gx(0) - CW / 2 - 0.12, fx1 = gx(4) + CW / 2 + 0.12, fy0 = GYS[1] - CH / 2 - 0.12, fy1 = GYS[0] + CH / 2 + 0.06;
  const fence = [[[fx0, fy0], [fx1, fy0]], [[fx1, fy0], [fx1, fy1]], [[fx1, fy1], [fx0, fy1]], [[fx0, fy1], [fx0, fy0]]]
    .map(([a, b]) => new M.DashedLine({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color: C.muted }));
  await until(S(6)); await play(new M.LaggedStart(fence.map(f => new M.Create(f)), { lagRatio: 0.2, runTime: 1.2 }), ...say('SET ASIDE: NEVER USED TO BUILD IT', C.muted));

  // 7-11 card one, up close
  const BC = P ? [0, 0.55] : [-4.0, -0.15], BW = P ? 7.0 : 5.4, BH = 2.75;
  const top = BC[1] + BH / 2, left = BC[0] - BW / 2 + 0.3, right = BC[0] + BW / 2 - 0.3;
  const header = lft(T('CARD 1', 19, C.cyan, true, true), left, top - 0.32);
  const qLab = lft(T('QUESTION', 15, C.muted, true), left, top - 0.72);
  const dLab = lft(T('DATE', 15, C.muted, true), left, top - 1.78);
  const aLab = lft(T('AGREED ANSWER', 15, C.muted, true), left, top - 2.28);
  const vx = left + aLab.getWidth() + 0.3;
  const big = new M.VGroup(frame(BW, BH, [BC[0], BC[1], 0], C.cyan), header,
    rgt(T('HOURS', 16, C.cyan, true, true), right, top - 0.32), qLab, dLab, aLab);
  const qa = lft(fit(T('What time does the library', 17, C.ink), BW - 0.6), left, top - 1.02);
  const qb = lft(fit(T('open on Sunday?', 17, C.ink), BW - 0.6), left, top - 1.32);
  const dateV = lft(T('15 Feb', 18, C.amber, true, true), vx, top - 1.78);
  const agreeV = lft(T('noon', 18, C.green, true, true), vx, top - 2.28);
  const libs = [person(right - 1.5, top - 2.4), person(right - 1.1, top - 2.4)];
  await until(S(7)); await play(new M.FadeOut(new M.VGroup(...cards.map(c => c.g), ...fence)), new M.FadeIn(big), ...say('QUESTION · DATE · AGREED ANSWER'));
  await until(S(8)); await play(new M.LaggedStart(libs.map(p => new M.FadeIn(p)), { lagRatio: 0.3, runTime: 1.0 }), ...say('2 LIBRARIANS AGREED: NOT ONE GUESS', C.green));
  await until(S(9)); await play(new M.Indicate(header, { color: C.cyan }));
  await until(S(10)); await play(new M.FadeIn(qa), new M.FadeIn(qb), ...say('Q: WHEN DOES IT OPEN ON SUNDAY?'));
  await until(S(11)); await play(new M.FadeIn(dateV), new M.Flash(dateV, { color: C.amber }), ...say('ASKED ON 15 FEB', C.amber));

  // 12-14 the rule changed on 1 March: a timeline
  const TL0 = P ? -3.5 : -0.8, TL1 = P ? 3.5 : 6.6, TY = P ? -2.2 : 0.55;
  const TLB = TL0 + 0.4 * (TL1 - TL0), x15 = TL0 + 14.5 / 28 * (TLB - TL0);
  const ruleA = at(fit(T('until 28 Feb: noon', 16, C.green, true, true), TLB - TL0 - 0.1), (TL0 + TLB) / 2, TY + 0.45);
  const ruleB = at(fit(T('from 1 Mar: 10 AM', 16, C.violet, true, true), TL1 - TLB - 0.2), (TLB + TL1) / 2, TY + 0.45);
  await until(S(12)); await play(new M.FadeIn(ruleA), ...say('UNTIL 28 FEB: SUNDAY OPENS AT NOON', C.green));
  await until(S(13)); await play(new M.FadeIn(ruleB), ...say('FROM 1 MAR: SUNDAY OPENS AT 10 AM', C.violet));
  const tline = new M.Line({ start: [TL0, TY, 0], end: [TL1, TY, 0], color: C.muted, strokeWidth: 3 });
  const tick = new M.Line({ start: [TLB, TY - 0.15, 0], end: [TLB, TY + 0.15, 0], color: C.ink, strokeWidth: 3 });
  const monthA = lft(T('Feb', 16, C.muted, true), TL0 + 0.1, TY - 0.35);
  const monthB = at(T('Mar → today', 16, C.muted, true), (TLB + TL1) / 2, TY - 0.35);
  await until(S(14)); await play(new M.Create(tline), new M.Create(tick), new M.FadeIn(monthA), new M.FadeIn(monthB), ...say('TIMELINE: FEB ← | → MAR', C.muted));

  // 15-21 the card's day, today's answer, two hours outside
  const dot15 = new M.Dot({ point: [x15, TY, 0], radius: 0.1, color: C.amber });
  const lab15 = at(T('asked 15 Feb', 16, C.amber, true, true), x15, TY - 0.75);
  await until(S(15)); await play(new M.FadeIn(dot15), new M.FadeIn(lab15), new M.Flash(dot15, { color: C.amber }), new M.Indicate(dateV, { color: C.amber }), ...say('15 FEB FALLS ON THE LEFT', C.amber));
  await until(S(16)); await play(new M.FadeIn(agreeV), new M.Indicate(ruleA, { color: C.green }), ...say('TRUE ANSWER THEN: NOON', C.green));
  const dotT = new M.Dot({ point: [TL1 - 0.05, TY, 0], radius: 0.1, color: C.violet });
  const labT = rgt(T('today', 16, C.violet, true, true), TL1, TY - 0.75);
  await until(S(17)); await play(new M.FadeIn(dotT), new M.FadeIn(labT), new M.Indicate(ruleB, { color: C.violet }), ...say('TODAY: THE GUIDE SAYS 10 AM', C.violet));
  const AB = P ? [0, -3.7] : [(TLB + TL1) / 2, TY - 1.75], PB = P ? [0, -5.0] : [(TLB + TL1) / 2, TY - 3.05];
  const aT = fit(T('Assistant: “It opens at 10 AM.”', 16, C.ink), P ? 6.0 : 4.0);
  const ans = new M.VGroup(frame(aT.getWidth() + 0.5, 0.55, [AB[0], AB[1], 0], C.cyan, 0.2), at(aT, AB[0], AB[1]));
  await until(S(18)); await play(new M.FadeIn(ans), ...say('ASSISTANT TODAY: “10 AM”'));
  await until(S(19)); await play(new M.LaggedStart([new M.Indicate(ruleB, { color: C.violet }), new M.Indicate(ruleA, { color: C.green }), new M.Indicate(lab15, { color: C.amber })], { lagRatio: 0.5, runTime: 2.0 }),
    ...say('RULE TODAY: 10 AM · ASKED IN FEB: NOON', C.amber));
  const hour = x => { const b = new M.Rectangle({ width: 0.86, height: 0.3, color: C.amber, strokeWidth: 1 }); b.setFill(C.amber, 0.82); b.moveTo([x, PB[1], 0]); return b; };
  const wait = [rgt(T('10:00', 15, C.ink, true), PB[0] - 1.0, PB[1]), hour(PB[0] - 0.46), hour(PB[0] + 0.46), lft(T('12:00', 15, C.ink, true), PB[0] + 1.0, PB[1])];
  await until(S(20)); await play(new M.LaggedStart(wait.map(w => new M.FadeIn(w)), { lagRatio: 0.3, runTime: 1.4 }), ...say('ARRIVES AT 10, WAITS 2 HOURS', C.pink));
  const cross0 = at(T('✗', 40, C.pink, false, true), right - 0.35, top - 2.05);
  await until(S(21)); await play(new M.FadeIn(cross0), new M.Flash(cross0, { color: C.pink }), ...say('CARD 1: WRONG', C.pink));

  // 22-24 grounded, and still wrong
  const pT = fit(T('Today’s guide: “Sunday: opens 10 AM.”', 15, C.violet), P ? 6.0 : 4.2);
  const pass = new M.VGroup(frame(pT.getWidth() + 0.5, 0.5, [PB[0], PB[1], 0], C.violet, 0.12), at(pT, PB[0], PB[1]));
  const arr3 = new M.Arrow({ start: [PB[0], PB[1] + 0.27, 0], end: [AB[0], AB[1] - 0.29, 0], color: C.violet });
  await until(S(22)); await play(new M.FadeOut(new M.VGroup(...wait)), new M.FadeIn(pass), new M.Create(arr3), ...say('BACKED BY TODAY’S GUIDE', C.violet));
  const grounded = lft(T('GROUNDED ✓', 16, C.green, true, true), AB[0] + 0.3, (AB[1] + PB[1]) / 2);
  await until(S(23)); await play(new M.FadeIn(grounded), ...say('GROUNDED: EVERY CLAIM IS IN THE PASSAGE', C.green));
  await until(S(24)); await play(new M.Indicate(pass, { color: C.pink }), new M.Indicate(lab15, { color: C.pink }), ...say('GROUNDED, YET WRONG: WRONG PASSAGE FOR THAT DATE', C.pink));

  // 25-27 policy, policy in force, answer correctness
  await until(S(25)); await play(new M.FadeOut(new M.VGroup(ans, pass, arr3, grounded)),
    new M.LaggedStart([new M.Indicate(ruleA, { color: C.violet }), new M.Indicate(ruleB, { color: C.violet })], { lagRatio: 0.5, runTime: 1.4 }), ...say('POLICY = A LIBRARY RULE', C.violet));
  const inForce = new M.Line({ start: [TL0, TY, 0], end: [TLB, TY, 0], color: C.green, strokeWidth: 7 });
  await until(S(26)); await play(new M.Create(inForce), ...say('POLICY IN FORCE ON 15 FEB: NOON', C.green));
  const BOX27 = P ? BOXP : [4.2, -1.85, 0];
  await until(S(27)); await play(...fbox(['answer correctness:', 'check each answer against', ['the policy in force on its date', C.amber]], C.amber, BOX27), ...say('ANSWER CORRECTNESS', C.amber));

  // 28-30 grade all ten cards
  cards = Array.from({ length: 10 }, (_, k) => smallCard(k));
  await until(S(28));
  await play(new M.FadeOut(new M.VGroup(big, qa, qb, dateV, agreeV, ...libs, cross0, ruleA, ruleB, tline, tick, monthA, monthB, dot15, lab15, dotT, labT, inForce)), ...unbox(),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c.g)), { lagRatio: 0.1, runTime: 1.6 }), ...say('GRADE ALL 10 CARDS, ONE AT A TIME'));
  const CMX = P ? -2.6 : 2.2, CMY = P ? [-2.7, -3.15, -3.6] : [0.7, 0.2, -0.3], CMW = P ? 5.2 : 4.6;
  const strip = rows => rows.map(([s, c], i) => lft(fit(T(s, 17, c, true), CMW), CMX, CMY[i]));
  const cmp = strip([['card 1', C.muted], ['agreed answer: noon', C.green], ['assistant:     10 AM', C.cyan]]);
  await until(S(29)); await play(new M.LaggedStart(cmp.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...say('COMPARE: ANSWER vs AGREED ANSWER'));
  const ex = strip([['agreed answer: noon', C.green], ['answer:        12 midday', C.ink], ['same thing ✓', C.green]]);
  await until(S(30)); await play(new M.FadeOut(new M.VGroup(...cmp)), new M.LaggedStart(ex.map(t => new M.FadeIn(t)), { lagRatio: 0.3, runTime: 1.2 }), ...say('SAME MEANING, NOT SAME WORDS', C.green));

  // 31-36 a check or a cross under each card
  const markY = k => gy(k) - CH / 2 - 0.27;
  const mark = (k, ok, color) => at(T(ok ? '✓' : '✗', 28, color, false, true), gx(k), markY(k));
  const marks = RIGHT.map((ok, k) => mark(k, ok, ok ? C.green : C.pink));
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(...ex)), new M.FadeIn(marks[0]), new M.Flash(marks[0], { color: C.pink }), ...say('CARD 1: WRONG', C.pink));
  await until(S(32)); await play(new M.LaggedStart([1, 2, 3].map(k => new M.FadeIn(marks[k])), { lagRatio: 0.4, runTime: 1.2 }), ...say('CARDS 2, 3, 4: RIGHT', C.green));
  await until(S(33)); await play(new M.FadeIn(marks[4]), new M.Flash(marks[4], { color: C.pink }), ...say('CARD 5: WRONG', C.pink));
  await until(S(34)); await play(new M.LaggedStart([5, 6, 7].map(k => new M.FadeIn(marks[k])), { lagRatio: 0.4, runTime: 1.2 }), ...say('CARDS 6, 7, 8: RIGHT', C.green));
  await until(S(35)); await play(new M.FadeIn(marks[8]), new M.Flash(marks[8], { color: C.pink }), ...say('CARD 9: WRONG', C.pink));
  await until(S(36)); await play(new M.FadeIn(marks[9]), ...say('CARD 10: RIGHT', C.green));

  // 37-39 count the checks, then 70 out of 100
  const rights = [1, 2, 3, 5, 6, 7, 9];
  const counts = rights.map((k, n) => at(T(String(n + 1), 16, C.green, true, true), gx(k) + 0.32, markY(k)));
  const total = at(T('7 CHECKS', 22, C.green, true, true), GCX, P ? -2.6 : -2.75);
  await until(S(37)); await play(new M.LaggedStart([...counts.map(c => new M.FadeIn(c)), new M.FadeIn(total)], { lagRatio: 0.35, runTime: 2.0 }), ...say('CHECKS: 7', C.green));
  const HC = P ? [-1.3, -4.0] : [4.6, -0.2], cs = P ? 0.15 : 0.2;
  const cols = RIGHT.map((ok, k) => new M.VGroup(...Array.from({ length: 10 }, (_, j) => {
    const q = new M.Rectangle({ width: cs * 0.84, height: cs * 0.84, color: ok ? C.green : C.pink, strokeWidth: 1 });
    q.setFill(ok ? C.green : C.pink, ok ? 0.82 : 0.12); q.moveTo([HC[0] + (k - 4.5) * cs, HC[1] + (j - 4.5) * cs, 0]); return q;
  })));
  const of100 = at(T('70 of 100', 20, C.green, true, true), P ? 1.7 : HC[0], P ? -3.6 : -1.6);
  await until(S(38)); await play(new M.LaggedStart([...cols.map(c => new M.FadeIn(c)), new M.FadeIn(of100)], { lagRatio: 0.2, runTime: 2.0 }), ...say('7 OUT OF 10 = 70 OUT OF 100', C.green));
  const pct = at(T('= 70%', 30, C.amber, true, true), P ? 1.7 : HC[0], P ? -4.4 : -2.3);
  await until(S(39)); await play(new M.FadeIn(pct), ...say('PERCENT = OUT OF 100', C.amber));

  // 40-42 the formula
  await until(S(40)); await play(new M.FadeOut(new M.VGroup(...cols, of100, pct)), ...say('THE SHORT VERSION'));
  await until(S(41)); await play(...fbox(['answer correctness', ['= right answers ÷ questions', C.amber]]));
  await until(S(42)); await play(...fbox(['answer correctness', '= right answers ÷ questions', ['= 7 ÷ 10 = 70%', C.amber]]));

  // 43-44 what it is for
  await until(S(43)); await play(...say('HOW OFTEN PEOPLE GET THE ANSWER TRUE FOR THEM', C.green));
  await until(S(44)); await play(new M.Indicate(cards[0].date, { color: C.amber }), new M.Flash(cards[0].date, { color: C.amber }), ...say('RULES CHANGE → EVERY CARD KEEPS ITS DATE', C.amber));

  // 45-48 the trap: grade everything against today's guide
  await until(S(45)); await play(...say('TRAP: GRADE ALL AGAINST TODAY’S GUIDE?', C.pink));
  const fake = mark(0, true, C.amber);
  await until(S(46)); await play(new M.ReplacementTransform(marks[0], fake), ...say('CARD 1 “10 AM” WOULD COUNT AS RIGHT', C.pink));
  await until(S(47)); await play(...fbox([['on its date:   7 ÷ 10 = 70%', C.green], ['against today: 8 ÷ 10 = 80%', C.pink]], C.pink), ...say('80% INSTEAD OF 70%', C.pink));
  await until(S(48)); await play(new M.Indicate(fake, { color: C.pink }), new M.Flash(fake, { color: C.pink }), ...say('LOOKS BETTER, HIDES THE CHANGED-RULE MISTAKE', C.pink));

  // 49 recap
  const cross1 = mark(0, false, C.pink);
  await until(S(49)); await play(new M.ReplacementTransform(fake, cross1),
    ...fbox(['answer correctness', '= right answers ÷ questions', ['graded by the rule on each date', C.amber]], C.amber), ...say('RECAP: THE RULE IN FORCE ON THAT DAY', C.amber));
}

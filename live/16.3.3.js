// 16.3.3 Shadow deployment. Beat i is sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.65, 0] : [4.3, -0.3, 0];
  const LX = P ? -3.2 : -5.7;
  const enter = o => new M.FadeIn(o, { runTime: 0.4 });
  const leave = o => new M.FadeOut(o, { runTime: 0.3 });
  const emph = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.6 });

  function label(text, x, y, maxW, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true);
    if (maxW && t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo([x, y, 0]); return t;
  }
  function leftLabel(text, x, y, color = C.ink, size = 20, mono = false) {
    const t = T(text, size, color, mono, true); t.moveTo([x + t.getWidth() / 2, y, 0]); return t;
  }
  function rect(x, y, w, h, color, fill, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.13, color, strokeWidth: sw });
    if (fill) r.setFill(fill, 0.95); r.moveTo([x, y, 0]); return r;
  }
  let pillNow = null;
  function say(text, color = C.cyan) {
    const p = pill(text, color, P ? 18 : 19);
    const maxW = P ? FW - 0.8 : 7.25;
    if (p.getWidth() > maxW) p.scale(maxW / p.getWidth());
    p.moveTo(PILL);
    const a = pillNow ? [leave(pillNow)] : []; pillNow = p; a.push(enter(p)); return a;
  }
  let boxNow = null;
  function setBox(g) { const a = [enter(g)]; if (boxNow) a.push(leave(boxNow)); boxNow = g; return a; }
  function clearBox() { const a = boxNow ? [leave(boxNow)] : []; boxNow = null; return a; }
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.7, ht = rows.length * lh + 0.4;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.35, top = BOXP[1] + ht / 2 - 0.2 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    return setBox(g);
  }
  function card(name, route, x, y, w = 3.2) {
    const rc = route === 'North' ? C.cyan : C.pink;
    const box = rect(x, y, w, 0.72, C.line, C.card);
    const icon = rect(x - w / 2 + 0.38, y, 0.36, 0.32, rc, C.card, 1.5);
    const tape = new M.Line({ start: [x - w / 2 + 0.38, y + 0.15, 0], end: [x - w / 2 + 0.38, y + 0.02, 0], color: rc, strokeWidth: 2 });
    const nm = leftLabel(name, x - w / 2 + 0.75, y, C.ink, 21);
    const tagT = T(route, 16, rc, true, true);
    const tag = new M.VGroup(rect(x + w / 2 - 0.62, y, 0.98, 0.38, rc, C.bg, 1.5), tagT);
    tagT.moveTo([x + w / 2 - 0.62, y, 0]);
    return new M.VGroup(box, icon, tape, nm, tag);
  }
  const arrow = (a, b, color = C.muted) => new M.Arrow({ start: [a[0], a[1], 0], end: [b[0], b[1], 0], color, strokeWidth: 2.5 });
  const scoreTag = (s, x, y, color = C.amber) => new M.VGroup(rect(x, y, 0.9, 0.46, color, C.bg, 1.5), label(`${s}%`, x, y, 0.8, color, 19, true));
  function flag(x, y) {
    const pole = new M.Line({ start: [x - 0.12, y - 0.22, 0], end: [x - 0.12, y + 0.22, 0], color: C.amber, strokeWidth: 2.5 });
    const f = new M.Polygon({ vertices: [[x - 0.12, y + 0.22, 0], [x + 0.2, y + 0.1, 0], [x - 0.12, y - 0.02, 0]], color: C.amber, strokeWidth: 1.5 });
    f.setFill(C.amber, 0.9);
    return new M.VGroup(pole, f);
  }
  function modelBox(name, x, y, color, w, h = 0.8, fs = 19) {
    return new M.VGroup(rect(x, y, w, h, color, C.card), label(name, x, y, w - 0.2, color, fs, true));
  }

  // 0-2 current model and a new one
  const MA = P ? [0, 0.6] : [CX, 0.4], MB = P ? [0, -1.4] : [CX, -1.5];
  const cur0 = modelBox('CURRENT MODEL', MA[0], MA[1], C.cyan, P ? 5.6 : 5.0, 1.3, 26);
  await until(S(0)); await play(enter(cur0), ...say('A MODEL ESTIMATES LATE DELIVERY'));
  const new0 = modelBox('NEW MODEL', MB[0], MB[1], C.violet, P ? 5.6 : 5.0, 1.3, 26);
  await until(S(1)); await play(enter(new0), ...say('A NEW MODEL: MAYBE BETTER?', C.violet));
  await until(S(2)); await play(...say('TEST IT WITHOUT CHANGING REAL DECISIONS?', C.amber));

  // 3-13 Nell and Sage, scores and the 50% line
  const CW = P ? 3.4 : 3.2, CXc = P ? -1.3 : CX - 1.6;
  const Y1 = P ? 1.3 : 0.9, Y2 = P ? 0.4 : 0.05;
  const nell = card('Nell', 'North', CXc, Y1, CW), sage = card('Sage', 'South', CXc, Y2, CW);
  const TX = CXc + CW / 2 + 0.6;
  await until(S(3)); await play(leave(cur0), leave(new0), ...say('TWO PARCELS READY TO LEAVE'));
  await until(S(4)); await play(enter(nell), ...say('NELL · NORTH ROUTE', C.cyan));
  await until(S(5)); await play(enter(sage), ...say('SAGE · SOUTH ROUTE', C.pink));
  const sN = scoreTag(40, TX, Y1), sS = scoreTag(60, TX, Y2);
  await until(S(6)); await play(enter(sN), ...say('CURRENT MODEL: NELL 40%', C.amber));
  await until(S(7)); await play(enter(sS), ...say('CURRENT MODEL: SAGE 60%', C.amber));
  await until(S(8)); await play(...fbox(['Score', ['chance of late delivery', C.muted]], C.amber));
  await until(S(9)); await play(...fbox(['Review rule', ['score ≥ 50%', C.amber]], C.amber), ...say('REVIEW AT 50% OR HIGHER', C.amber));
  await until(S(10)); await play(...fbox(['Review', ['a worker checks if', C.muted], ['the delivery plan', C.muted], ['needs a change', C.muted]], C.amber));
  const SY = P ? -0.9 : -1.4, SL = P ? 6.2 : 6.2, sx0 = LX + 0.2, s2x = v => sx0 + v / 100 * SL;
  const scale = new M.VGroup(new M.Line({ start: [sx0, SY, 0], end: [sx0 + SL, SY, 0], color: C.muted, strokeWidth: 2 }),
    ...[0, 100].map(v => label(`${v}%`, s2x(v), SY - 0.4, null, C.muted, 18, true)));
  const cut = new M.VGroup(new M.DashedLine({ start: [s2x(50), SY - 0.45, 0], end: [s2x(50), SY + 0.5, 0], color: C.amber }),
    label('50%', s2x(50), SY - 0.72, null, C.amber, 18, true));
  await until(S(11)); await play(enter(scale), new M.Create(cut), ...say('A LINE AT 50%', C.amber));
  const dN = new M.VGroup(new M.Dot({ point: [s2x(40), SY, 0], radius: 0.12, color: C.cyan }), label('Nell', s2x(40), SY + 0.42, null, C.cyan, 19, true));
  const dS = new M.VGroup(new M.Dot({ point: [s2x(60), SY, 0], radius: 0.12, color: C.pink }), label('Sage', s2x(60), SY + 0.42, null, C.pink, 19, true));
  await until(S(12)); await play(enter(dN), ...say('NELL: BELOW THE LINE → NO REVIEW', C.cyan));
  await until(S(13)); await play(enter(dS), ...say('SAGE: ABOVE THE LINE → REVIEW', C.pink));

  // 14-23 shadow deployment: both models get the same information
  const CW2 = P ? 2.7 : 2.6, CX2 = LX + CW2 / 2;
  const B1 = P ? 1.3 : 0.75, B2 = P ? 0.1 : -0.85;
  const nell2 = card('Nell', 'North', CX2, B1, CW2), sage2 = card('Sage', 'South', CX2, B2, CW2);
  const MX = P ? 2.15 : CX + 1.85, MW = P ? 2.3 : 2.4;
  const cur = modelBox('CURRENT', MX, B1, C.cyan, MW), cand = modelBox('NEW', MX, B2, C.violet, MW);
  await until(S(14));
  await play(...[nell, sage, sN, sS, scale, cut, dN, dS].map(leave), ...clearBox(), enter(nell2), enter(sage2), enter(cur), enter(cand),
    ...say('NEW MODEL BESIDE THE CURRENT ONE', C.violet));
  const ax0 = CX2 + CW2 / 2 + 0.05, ax1 = MX - MW / 2 - 0.05;
  const aN1 = arrow([ax0, B1 + 0.1], [ax1, B1 + 0.1], C.cyan), aN2 = arrow([ax0, B1 - 0.1], [ax1, B2 + 0.15], C.cyan);
  const aS1 = arrow([ax0, B2 + 0.1], [ax1, B1 - 0.15], C.pink), aS2 = arrow([ax0, B2 - 0.1], [ax1, B2 - 0.1], C.pink);
  await until(S(15)); await play(...say('SAME INFORMATION TO BOTH MODELS'));
  await until(S(16)); await play(new M.Create(aN1), new M.Create(aN2), ...say('BOTH GET NELL’S INFORMATION', C.cyan));
  await until(S(17)); await play(new M.Create(aS1), new M.Create(aS2), ...say('BOTH GET SAGE’S INFORMATION', C.pink));
  const guides = label('✓ guides decisions', MX, B1 - 0.62, MW + 0.2, C.green, 17, true);
  const saved = label('scores only saved', MX, B2 - 0.62, MW + 0.2, C.muted, 17, true);
  await until(S(18)); await play(enter(guides), emph(cur, C.green), ...say('ONLY THE CURRENT MODEL DECIDES', C.green));
  await until(S(19)); await play(enter(saved), ...say('NEW SCORES ARE SAVED TO COMPARE', C.violet));
  await until(S(20)); await play(...fbox(['Like a second worker', ['writes suggestions down', C.muted], ['changes no delivery plan', C.muted]], C.violet));
  await until(S(21)); await play(...say('SHADOW DEPLOYMENT', C.violet), ...fbox(['Shadow deployment', ['test a new model', C.muted], ['beside the current one', C.muted]], C.violet));
  await until(S(22)); await play(...fbox(['Deployment', ['making a model', C.muted], ['available for use', C.muted]], C.cyan));
  const candName = modelBox('CANDIDATE', MX, B2, C.violet, MW);
  await until(S(23)); await play(leave(cand), enter(candName), ...fbox(['Candidate', ['a possible replacement', C.muted]], C.violet), ...say('THE NEW MODEL = THE CANDIDATE', C.violet));

  // 24-43 compare the two models in a table
  const cN = P ? -2.15 : CX - 2.5, cC = P ? 0.0 : CX + 0.05, cK = P ? 2.3 : CX + 2.35;
  const HY = P ? 1.35 : 0.95, R1 = P ? 0.55 : 0.2, R2 = P ? -0.25 : -0.55, KY = P ? -1.15 : -1.45;
  const head = new M.VGroup(label('Parcel', cN, HY, null, C.muted, 17, true), label('Current', cC, HY, null, C.cyan, 18, true), label('Candidate', cK, HY, null, C.violet, 18, true));
  const nameN = card('Nell', 'North', cN, R1, P ? 2.6 : 2.8), nameS = card('Sage', 'South', cN, R2, P ? 2.6 : 2.8);
  const old2 = [nell2, sage2, cur, candName, aN1, aN2, aS1, aS2, guides, saved];
  const holes = [[cC, R1], [cK, R1], [cC, R2], [cK, R2]].map(([x, y]) => new M.VGroup(rect(x - 0.3, y, 0.9, 0.46, C.line, C.bg, 1.2), label('?', x - 0.3, y, null, C.muted, 19, true)));
  await until(S(24)); await play(...old2.map(leave), ...clearBox(), enter(head), enter(nameN), enter(nameS), ...holes.map(enter), ...say('COMPARE THE SCORES'));
  const nC = scoreTag(40, cC - 0.3, R1, C.cyan), nK = scoreTag(60, cK - 0.3, R1, C.violet);
  const sC = scoreTag(60, cC - 0.3, R2, C.cyan), sK = scoreTag(60, cK - 0.3, R2, C.violet);
  await until(S(25)); await play(leave(holes[0]), enter(nC), ...say('NELL · CURRENT: 40%', C.cyan));
  await until(S(26)); await play(leave(holes[1]), enter(nK), ...say('NELL · CANDIDATE: 60%', C.violet));
  await until(S(27)); await play(emph(nC, C.cyan), ...say('CURRENT: NO REVIEW FOR NELL', C.cyan));
  await until(S(28)); await play(emph(nK, C.violet), ...say('CANDIDATE WOULD REVIEW NELL', C.violet));
  const colBox = new M.RoundedRectangle({ width: P ? 1.9 : 2.0, height: (HY - R2) + 0.85, cornerRadius: 0.14, color: C.green, strokeWidth: 2.5 });
  colBox.moveTo([cC, (HY + R2) / 2, 0]);
  await until(S(29)); await play(new M.Create(colBox), ...say('REAL DECISION STILL FOLLOWS CURRENT', C.green));
  await until(S(30)); await play(...say('NOW LOOK AT SAGE', C.pink));
  await until(S(31)); await play(leave(holes[2]), enter(sC), ...say('SAGE · CURRENT: 60%', C.cyan));
  await until(S(32)); await play(leave(holes[3]), enter(sK), ...say('SAGE · CANDIDATE: 60%', C.violet));
  await until(S(33)); await play(emph(sC, C.amber), emph(sK, C.amber), ...say('BOTH WOULD REVIEW SAGE', C.amber));
  const fNK = flag(cK + 0.45, R1), fSC = flag(cC + 0.45, R2), fSK = flag(cK + 0.45, R2);
  await until(S(34)); await play(new M.LaggedStart([fSC, fNK, fSK].map(enter), { lagRatio: 0.3, runTime: 1.0 }), ...say('A TAG FOR EVERY REVIEW', C.amber));
  await until(S(35)); await play(...fbox(['Flag', ['a tag: send for review', C.muted]], C.amber), ...say('THIS TAG = A FLAG', C.amber));
  await until(S(36)); await play(leave(colBox), emph(fSC), ...say('COUNT THE CURRENT FLAGS', C.cyan));
  const kC = label('1 flag', cC, KY, null, C.cyan, 21, true), kK = label('2 flags', cK, KY, null, C.violet, 21, true);
  const kLine = new M.Line({ start: [LX + 0.1, (R2 + KY) / 2, 0], end: [cK + 1.1, (R2 + KY) / 2, 0], color: C.line, strokeWidth: 2 });
  await until(S(37)); await play(enter(kLine), enter(kC), ...say('ONLY SAGE → 1 FLAG', C.cyan));
  await until(S(38)); await play(emph(fNK), emph(fSK), ...say('COUNT THE CANDIDATE FLAGS', C.violet));
  await until(S(39)); await play(enter(kK), ...say('NELL AND SAGE → 2 FLAGS', C.violet));
  await until(S(40)); await play(...fbox(['2 − 1 = 1 extra flag'], C.amber), ...say('1 EXTRA FLAG', C.amber));
  await until(S(41)); await play(...say('WRITE IT AS A FORMULA'));
  await until(S(42)); await play(...fbox(['difference in flags', ' = candidate flags', '   − current flags', [' = 2 − 1 = 1', C.amber]], C.amber));
  await until(S(43)); await play(emph(nK, C.violet), ...say('1 MORE PARCEL SENT FOR REVIEW', C.violet));

  // 44-49 what it shows, and its limits
  await until(S(44)); await play(...fbox(['Shadow deployment shows', ['how decisions might change', C.muted], ['before we use the model', C.muted]], C.green), ...say('SEE CHANGES BEFORE USING IT', C.green));
  await until(S(45)); await play(...say('TESTED ON REAL, CURRENT PARCELS', C.green));
  await until(S(46)); await play(...say('MORE FLAGS ≠ BETTER PREDICTIONS', C.pink), ...fbox([['More flags', C.pink], ['do not prove', C.muted], ['better predictions', C.muted]], C.pink));
  await until(S(47)); await play(...fbox(['Compare predictions', ['with actual delivery', C.muted], ['results', C.muted]], C.amber), ...say('CHECK AGAINST REAL RESULTS', C.amber));
  await until(S(48)); await play(...fbox(['A route change', ['may change the', C.muted], ['delivery result', C.muted]], C.pink), ...say('A NEW ROUTE CAN CHANGE THE RESULT', C.pink));
  await until(S(49)); await play(...clearBox(), emph(kC, C.green), ...say('TEST BESIDE IT, NO CONTROL OF REAL DECISIONS', C.green));
}

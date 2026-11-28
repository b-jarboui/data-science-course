// 10.2.4 Polynomial regression: a rent rule that bends (cards I, J, K).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);
  const pill = (s, c, size = 20) => L.pill(s, c, P ? Math.max(size, 16) : Math.max(size, 14));

  // --- layout (phone 8 x 14.22, laptop 14.22 x 8) ----------------------------
  const PILL = P ? [0, 0.75, 0] : [0, 1.94, 0];
  const BOXP = P ? [0, 2.95, 0] : [4.45, -0.35, 0];
  const BOX_MAXW = P ? FW - 0.9 : 4.3;
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  const AX0 = P ? -2.7 : -5.7, AW = P ? 5.9 : 6.0;
  const Y0 = P ? -4.6 : -2.25, HT = P ? 4.3 : 3.35;
  const ax = age => AX0 + age / 30 * AW;
  const ry = r => Y0 + (r - 1250) / 250 * HT;
  const pt = (age, r) => [ax(age), ry(r), 0];
  const f = age => { const a = age / 10; return 1320 + 120 * a - 40 * a * a; };

  // --- helpers ---------------------------------------------------------------
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.36 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > BOX_MAXW) g.scale(BOX_MAXW / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function glowDot(p, color = C.cyan) {
    const halo = new M.Dot({ point: p, radius: 0.24, color }); halo.setFill(color, 0.2);
    const d = new M.Dot({ point: p, radius: 0.1, color });
    return new M.VGroup(halo, d);
  }

  function curve(a0, a1, color, sw = 4) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const age = a0 + (a1 - a0) * i / 60; pts.push(pt(age, f(age))); }
    // a curve is a chain of short coloured lines (no fill, true colour)
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: sw }));
    return new M.VGroup(...segs);
  }

  // --- 0-1 apartments in older buildings -------------------------------------
  const bld = [[0, 'new', 1.9], [10, '10 years', 1.6], [20, '20 years', 1.3]].map(([_, lab, h], k) => {
    const x = (k - 1) * (P ? 2.4 : 3.0), yb = P ? -3.6 : -1.9;
    const r = new M.Rectangle({ width: 1.3, height: h * 1.4, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([x, yb + h * 0.7, 0]);
    const wins = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const w = new M.Rectangle({ width: 0.26, height: 0.26, color: C.amber, strokeWidth: 1 });
      w.setFill(C.amber, 0.55); w.moveTo([x - 0.3 + i * 0.6, yb + 0.5 + j * 0.62, 0]); wins.push(w);
    }
    const t = T(lab, 18, C.ink, true); t.moveTo([x, yb - 0.35, 0]);
    return new M.VGroup(r, ...wins, t);
  });
  await until(S(0));
  await play(new M.LaggedStart(bld.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.3 }), ...say('APARTMENTS IN OLDER BUILDINGS', C.cyan));

  await until(S(1));
  await play(...say('AGE → RENT? THE PATTERN BENDS', C.amber));

  // --- 2-7 chart and the three Cedar dots ------------------------------------
  const xAxis = new M.Line({ start: [AX0, Y0, 0], end: [ax(30) + 0.25, Y0, 0], color: C.muted, strokeWidth: 3 });
  const xTicks = [0, 10, 20, 30].map(v => new M.VGroup(
    new M.Line({ start: [ax(v), Y0 - 0.07, 0], end: [ax(v), Y0 + 0.07, 0], color: C.muted }),
    T(String(v), 17, C.muted, true).moveTo([ax(v), Y0 - 0.32, 0])));
  const xTitle = T('building age (years)', 16, C.muted); xTitle.moveTo([ax(15), Y0 - 0.66, 0]);
  const cedTag = pill('CEDAR · 60 m²', C.cyan, 14); cedTag.moveTo([ax(25), Y0 + 0.4, 0]);
  await until(S(2));
  await play(new M.FadeOut(new M.VGroup(...bld)), new M.Create(xAxis), new M.FadeIn(new M.VGroup(...xTicks, xTitle)),
    ...say('3 CEDAR LISTINGS · AGE ALONG THE BOTTOM', C.cyan));

  await until(S(3));
  await play(new M.FadeIn(cedTag), ...say('ALL THREE: 60 m²', C.cyan));

  const yAxis = new M.Line({ start: [AX0, Y0, 0], end: [AX0, ry(1500) + 0.15, 0], color: C.muted, strokeWidth: 3 });
  const yTicks = [1300, 1400, 1500].map(v => new M.VGroup(
    new M.Line({ start: [AX0 - 0.07, ry(v), 0], end: [AX0 + 0.07, ry(v), 0], color: C.muted }),
    T('$' + (v / 1000).toFixed(3).replace('.', ','), 15, C.muted, true).moveTo([AX0 - 0.55, ry(v), 0])));
  const yTitle = T('rent per month', 15, C.muted); yTitle.moveTo([AX0 + 0.1 + 0.8, ry(1500) + 0.35, 0]);
  await until(S(4));
  await play(new M.Create(yAxis), new M.FadeIn(new M.VGroup(...yTicks, yTitle)), ...say('MONTHLY RENT UP THE SIDE', C.cyan));

  const data = [[0, 1320, 'I'], [10, 1400, 'J'], [20, 1400, 'K']];
  const dots = [], dlabs = [];
  for (let k = 0; k < 3; k++) {
    const [age, r, card] = data[k];
    await until(S(5 + k));
    const g = glowDot(pt(age, r));
    const lb = T('$' + (r / 1000).toFixed(3).replace('.', ','), 16, C.cyan, true, true);
    // the age-0 label sits right of its dot, clear of the rent axis labels
    lb.moveTo(age === 0 ? [ax(age) + 0.30 + lb.getWidth() / 2, ry(r) - 0.36, 0] : [ax(age), ry(r) + 0.38, 0]);
    dots.push(g); dlabs.push(lb);
    const txt = ['NEW BUILDING: $1,320', '10 YEARS OLD: $1,400', '20 YEARS OLD: $1,400'][k];
    await play(new M.FadeIn(g), new M.FadeIn(lb), new M.Flash(g.submobjects[1], { color: C.cyan }), ...say(txt + ' (CARD ' + card + ')', C.cyan));
  }

  // --- 8-10 the steps: +80 then +0; a straight line cannot do that ----------
  const st1h = new M.DashedLine({ start: pt(0, 1320), end: pt(10, 1320), color: C.amber });
  const st1v = new M.Line({ start: pt(10, 1320), end: pt(10, 1400), color: C.amber, strokeWidth: 3 });
  const st1t = T('+$80', 17, C.amber, true, true); st1t.moveTo([ax(10) + 0.42, ry(1360), 0]);
  await until(S(8));
  await play(new M.Create(st1h), new M.Create(st1v), new M.FadeIn(st1t), ...say('FIRST STEP: +$80', C.amber));

  const st2t = T('+$0', 17, C.amber, true, true); st2t.moveTo([ax(15), ry(1400) - 0.3, 0]);
  await until(S(9));
  await play(new M.FadeIn(st2t), new M.Indicate(dots[2], { color: C.amber }), ...say('SECOND STEP: +$0', C.amber));

  const sLine = new M.DashedLine({ start: pt(0, 1320), end: pt(20, 1480), color: C.pink });
  const sMark = new M.Circle({ radius: 0.11, color: C.pink, strokeWidth: 2.5 }); sMark.moveTo(pt(20, 1480));
  const sLab = T('line: $1,480', 15, C.pink, true); sLab.moveTo([ax(20), ry(1480) + 0.33, 0]);
  await until(S(10));
  await play(new M.Create(sLine), new M.FadeIn(sMark), new M.FadeIn(sLab), ...say('STRAIGHT LINE: SAME RISE EVERY STEP', C.pink));

  // --- 11-12 a thrown ball ---------------------------------------------------
  const bpts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40; bpts.push([BOXP[0] - 1.5 + 3 * u, BOXP[1] - 0.8 + 1.6 * 4 * u * (1 - u) * 0.9, 0]); }
  const ballPath = new M.VGroup(...bpts.slice(1).map((p, i) => new M.Line({ start: bpts[i], end: p, color: C.violet, strokeWidth: 3 })));
  const ball = new M.Circle({ radius: 0.16, color: C.violet }); ball.setFill(C.violet, 0.9); ball.moveTo(bpts[20]);
  const ballT = T('rises · slows · turns', 15, C.violet); ballT.moveTo([BOXP[0], BOXP[1] - 1.1, 0]);
  await until(S(11));
  await play(new M.Create(ballPath), new M.FadeIn(ball), new M.FadeIn(ballT), ...say('A THROWN BALL: UP, SLOW, DOWN', C.violet));

  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(ballPath, ball, ballT, sLine, sMark, sLab, st1h, st1v, st1t, st2t)),
    ...say('WE WANT A RULE THAT CAN BEND', C.green));

  // --- 13-21 decades and the squared feature ---------------------------------
  await until(S(13));
  await play(...fbox(['1 decade = 10 years', ['decades = age ÷ 10', C.violet]], C.violet), ...say('COUNT AGE IN DECADES', C.violet));

  const decs = [0, 1, 2].map(a => { const t = T('a=' + a, 15, C.violet, true, true); t.moveTo([ax(a * 10), Y0 + 0.25, 0]); return t; });
  await until(S(14));
  await play(new M.FadeOut(cedTag), new M.LaggedStart(decs.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 1.0 }),
    ...fbox(['age   a', ' 0    0', '10    1', '20    2'], C.violet), ...say('AGES → 0, 1, 2 DECADES', C.violet));

  const tab = (q0, q1, q2, hi) => [
    ['age   a   a × a', C.ink],
    [' 0    0   ' + q0, hi === 0 ? C.amber : C.ink],
    ['10    1   ' + q1, hi === 1 ? C.amber : C.ink],
    ['20    2   ' + q2, hi === 2 ? C.amber : C.ink]];
  await until(S(15));
  await play(...fbox(tab('?', '?', '?'), C.amber), ...say('NEW COLUMN: a × a', C.amber));
  await until(S(16));
  await play(new M.Indicate(decs[0], { color: C.amber }), ...fbox(tab('0', '?', '?', 0), C.amber), ...say('0 × 0 = 0', C.amber));
  await until(S(17));
  await play(new M.Indicate(decs[1], { color: C.amber }), ...fbox(tab('0', '1', '?', 1), C.amber), ...say('1 × 1 = 1', C.amber));
  await until(S(18));
  await play(new M.Indicate(decs[2], { color: C.amber }), ...fbox(tab('0', '1', '4', 2), C.amber), ...say('2 × 2 = 4', C.amber));
  await until(S(19));
  await play(...fbox([['age   a   a²', C.ink], ' 0    0   0', '10    1   1', '20    2   4', ['a × a = a SQUARED (a²)', C.green]], C.green), ...say('A NUMBER × ITSELF = ITS SQUARE', C.green));
  await until(S(20));
  await play(...say('FEATURE = A COLUMN THE RULE USES', C.violet));
  await until(S(21));
  await play(new M.Indicate(boxNow, { color: C.violet }), ...say('NEW FEATURE: AGE SQUARED (a²)', C.violet));

  // --- 22-30 build the rule and check the three dots -------------------------
  await until(S(22));
  await play(...fbox([['up part:    + 120 × a', C.green]], C.green), ...say('UP PART: + $120 × a', C.green));
  await until(S(23));
  await play(...fbox([['up part:    + 120 × a', C.green], ['down part:  −  40 × a²', C.pink]], C.pink), ...say('DOWN PART: − $40 × a²', C.pink));
  const rule = (extra = []) => [['start       1,320', C.ink], ['up        + 120 × a', C.green], ['down      −  40 × a²', C.pink], ...extra];
  await until(S(24));
  await play(...fbox(rule(), C.cyan), ...say('START AT $1,320', C.cyan));

  await until(S(25));
  await play(new M.Indicate(dots[0], { color: C.amber }),
    ...fbox(rule([['age 0: a = 0, a² = 0', C.amber], ['1,320 + 0 − 0 = 1,320 ✓', C.amber]]), C.amber), ...say('AGE 0: BOTH PARTS ARE 0', C.amber));
  await until(S(26));
  await play(new M.Indicate(dots[1], { color: C.amber }),
    ...fbox(rule([['age 10: a = 1, a² = 1', C.amber], ['up: 120 × 1 = +120', C.green]]), C.amber), ...say('AGE 10: UP PART +$120', C.green));
  await until(S(27));
  await play(new M.Indicate(dots[1], { color: C.green }),
    ...fbox(rule([['down: 40 × 1 = −40', C.pink], ['1,320 + 120 − 40 = 1,400 ✓', C.amber]]), C.amber), ...say('− $40 → $1,400', C.pink));
  await until(S(28));
  await play(new M.Indicate(dots[2], { color: C.amber }),
    ...fbox(rule([['age 20: a = 2, a² = 4', C.amber], ['up: 120 × 2 = +240', C.green]]), C.amber), ...say('AGE 20: UP PART +$240', C.green));
  await until(S(29));
  await play(...fbox(rule([['up: 120 × 2 = +240', C.green], ['down: 40 × 4 = −160', C.pink]]), C.pink), ...say('DOWN: 40 × 4 = −$160', C.pink));
  await until(S(30));
  await play(new M.Indicate(dots[2], { color: C.green }),
    ...fbox(rule([['1,320 + 240 − 160', C.ink], ['= 1,400 ✓', C.amber]]), C.amber), ...say('AGAIN $1,400', C.amber));

  // --- 31-34 the curve and its top -------------------------------------------
  const cv = curve(0, 20, C.green, 4);
  await until(S(31));
  await play(new M.Create(cv, { runTime: 1.6 }), ...say('THE CURVE PASSES THROUGH ALL 3 DOTS', C.green));

  const mid = new M.DashedLine({ start: [ax(15), Y0, 0], end: [ax(15), ry(1410) + 0.15, 0], color: C.violet });
  await until(S(32));
  await play(new M.Create(mid), ...say('SAME SHAPE ON BOTH SIDES OF THE TOP', C.violet));

  const halfT = T('halfway: 15', 15, C.violet, true, true); halfT.moveTo([ax(15), Y0 + 0.25, 0]);
  await until(S(33));
  await play(new M.FadeOut(new M.VGroup(...decs)), new M.FadeIn(halfT), new M.Indicate(dots[1], { color: C.violet }), new M.Indicate(dots[2], { color: C.violet }),
    ...say('10 AND 20 MATCH → TOP AT 15', C.violet));

  const top = glowDot(pt(15, 1410), C.amber);
  const topL = T('$1,410', 16, C.amber, true, true); topL.moveTo([ax(15), ry(1410) + 0.62, 0]);
  await until(S(34));
  await play(new M.FadeIn(top), new M.FadeIn(topL),
    ...fbox(rule([['age 15: a = 1.5, a² = 2.25', C.amber], ['1,320 + 180 − 90 = 1,410', C.amber]]), C.amber), ...say('HIGHEST: $1,410 AT AGE 15', C.amber));

  // --- 35-37 the names --------------------------------------------------------
  await until(S(35));
  await play(...fbox(['REGRESSION:', ['a rule fitted to the listings', C.cyan], ['→ predicts rent', C.cyan]], C.cyan), ...say('REGRESSION = FITTED RULE THAT PREDICTS', C.cyan));
  await until(S(36));
  await play(...fbox(['POWERS of a:', ['a × a = a²', C.violet], ['a × a × a = a³', C.violet]], C.violet), ...say('POWERS: a², a³, ...', C.violet));
  await until(S(37));
  await play(new M.Indicate(cv, { color: C.green }), ...fbox(['age + its powers', ['= POLYNOMIAL REGRESSION', C.green]], C.green), ...say('POLYNOMIAL REGRESSION', C.green));

  // --- 38-41 the rule in one short form ---------------------------------------
  await until(S(38));
  await play(...say('THE RULE IN ONE SHORT FORM', C.cyan));
  await until(S(39));
  await play(...fbox([['rent = 1,320', C.ink], ['     + 120 × a', C.green], ['(a = age in decades)', C.muted]], C.cyan), ...say('1,320 + 120 × a', C.green));
  await until(S(40));
  await play(...fbox([['rent = 1,320', C.ink], ['     + 120 × a', C.green], ['     −  40 × a²', C.pink], ['(a = age in decades)', C.muted]], C.cyan), ...say('− 40 × a²', C.pink));
  await until(S(41));
  await play(new M.Indicate(cv, { color: C.green }), ...say('LINE MISSES A BEND → USE THIS', C.green));

  // --- 42-45 beyond the data ---------------------------------------------------
  const ext = curve(20, 30, C.pink, 3);
  const pr = new M.Circle({ radius: 0.12, color: C.pink, strokeWidth: 2.5 }); pr.moveTo(pt(30, 1320));
  const prL = T('$1,320?', 16, C.pink, true, true); prL.moveTo([ax(30) - 0.22 - prL.getWidth() / 2, ry(1320) - 0.30, 0]);
  await until(S(42));
  await play(new M.Create(ext), new M.FadeIn(pr), new M.FadeIn(prL),
    ...fbox(['age 30: a = 3, a² = 9', ['up:   120 × 3 = +360', C.green], ['down:  40 × 9 = −360', C.pink], ['1,320 + 360 − 360 = 1,320', C.amber]], C.pink),
    ...say('AGE 30: PARTS CANCEL → $1,320', C.pink));

  const seenH = ry(1500) - Y0 - 0.1;
  const seen = new M.Rectangle({ width: ax(20) - ax(0) + 0.5, height: seenH, color: C.green, strokeWidth: 2 });
  seen.moveTo([(ax(0) + ax(20)) / 2, Y0 + 0.05 + seenH / 2, 0]);
  const seenT = T('seen: ages 0–20', 15, C.green, true); seenT.moveTo([(ax(0) + ax(20)) / 2, ry(1500) + 0.02, 0]);
  await until(S(43));
  await play(new M.FadeOut(new M.VGroup(halfT, mid)), new M.Create(seen), new M.FadeIn(seenT), ...say('THE RULE ONLY SAW AGES 0–20', C.green));

  await until(S(44));
  await play(new M.Indicate(pr, { color: C.pink }), new M.Indicate(prL, { color: C.pink }), ...say('BEYOND 20: THE PREDICTION CAN MISS', C.pink));

  await until(S(45));
  await play(new M.FadeOut(new M.VGroup(seen, seenT)), new M.Indicate(cv, { color: C.green }),
    ...fbox([['rent = 1,320', C.ink], ['     + 120 × a', C.green], ['     −  40 × a²', C.pink]], C.green), ...say('a² LETS THE RENT RULE BEND', C.green));
}

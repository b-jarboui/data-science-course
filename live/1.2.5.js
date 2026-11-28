// 1.2.5 The middle of an ordered line (live manim-web lesson).
// Beat i = sentence i (0-based, 58 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;

  const D7 = [10, 12, 15, 18, 25, 30, 30];
  const D8 = [10, 12, 15, 18, 25, 30, 30, 90];
  const EV_ARR = [3, 5, 2, 14, 3, 4, 6, 3];
  const EV_SORT = [2, 3, 3, 3, 4, 5, 6, 14];
  const EV_TO_SORT = [1, 5, 0, 7, 2, 4, 6, 3];

  const CX = P ? 0 : -2.3;
  const PILL = P ? [0, 2.0, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.55, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one at a time, auto-fits width
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.1 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Geometry helpers for 7- and 8-column charts
  const SP7 = P ? 0.96 : 1.02, SP8 = P ? 0.88 : 0.96;
  const BW7 = P ? 0.64 : 0.68, BW8 = P ? 0.60 : 0.64;
  const col7 = k => CX + (k - 3) * SP7;
  const col8 = k => CX + (k - 3.5) * SP8;
  const BASE = P ? -4.5 : -2.25;
  const U30 = P ? 4.4 / 30 : 3.0 / 30;
  const U90 = P ? 5.1 / 90 : 3.25 / 90;

  const makeBar = (x, val, u, bw, color = C.cyan) => {
    const h = Math.max(0.08, val * u);
    const r = new M.Rectangle({ width: bw, height: h, color, strokeWidth: 1.5 });
    r.setFill(color, 0.82);
    r.moveTo([x, BASE + h / 2, 0]);
    return r;
  };
  const makeX = (x, y, rad, color = C.pink) => new M.VGroup(
    new M.Line({ start: [x - rad, y - rad, 0], end: [x + rad, y + rad, 0], color, strokeWidth: 3 }),
    new M.Line({ start: [x - rad, y + rad, 0], end: [x + rad, y - rad, 0], color, strokeWidth: 3 })
  );

  // ==================== ACT 1 (0–10): 7 trips, Mean = 20, then +90 pulls Mean to 28.75 ====================

  // 0: What would you tell a friend who asks how long the trip usually takes?
  const icons = [];
  for (let k = 0; k < 7; k++) {
    const x = col7(k), y = P ? -3.2 : -0.45, ks = P ? 1.45 : 1;
    const head = new M.Circle({ radius: 0.14 * ks, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, y + 0.36 * ks, 0]);
    const body = new M.Arc({ radius: 0.26 * ks, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, y + 0.02 * ks, 0]);
    icons.push(new M.VGroup(head, body));
  }
  await until(S(0));
  await play(new M.LaggedStart(icons.map(ic => new M.FadeIn(ic)), { lagRatio: 0.1, runTime: 1.2 }), ...say('HOW LONG DOES THE TRIP TAKE?', C.amber));

  // 1: Seven trips to class run from ten minutes to thirty.
  const floor1 = new M.Line({ start: [col8(0) - SP8 / 2, BASE, 0], end: [col8(7) + SP8 / 2, BASE, 0], color: C.muted, strokeWidth: 2 });
  const bars1 = D7.map((v, k) => makeBar(col7(k), v, U30, BW7, C.cyan));
  const labs7 = D7.map((v, k) => { const t = T(String(v), P ? 17 : 19, C.cyan, true); t.moveTo([col7(k), BASE - 0.32, 0]); return t; });
  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(...icons)),
    new M.Create(floor1),
    new M.LaggedStart(bars1.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...labs7)),
    ...say('7 TRIPS: 10 TO 30 MINUTES', C.cyan)
  );

  // 2: They total one hundred and forty minutes.
  await until(S(2));
  await play(...fbox(['7 trips to class', ['sum = 140 min', C.amber]], C.amber), ...say('TOTAL = 140 MINUTES', C.amber));

  // 3: Seven twenties make one hundred and forty, so an equal share is twenty.
  const y20a = BASE + 20 * U30;
  const mean20Line = new M.DashedLine({ start: [col8(0) - SP8 / 2, y20a, 0], end: [col8(7) + SP8 / 2, y20a, 0], color: C.amber });
  const mean20Tag = T('20', P ? 18 : 20, C.amber, true);
  mean20Tag.moveTo([col7(0) - 0.1, y20a + 0.34, 0]);
  await until(S(3));
  await play(
    new M.Create(mean20Line), new M.FadeIn(mean20Tag),
    ...fbox(['sum    = 140', '7 × 20 = 140', ['equal share = 20', C.amber]], C.amber),
    ...say('7 × 20 = 140 → 20 EACH', C.amber)
  );

  // 4: That equal share is the mean.
  await until(S(4));
  await play(
    new M.Indicate(mean20Tag, { color: C.amber }),
    ...fbox(['sum   = 140', 'count = 7', ['mean  = 20 min', C.amber]], C.amber),
    ...say('MEAN = 20 MINUTES', C.amber)
  );

  // 5: Now an eighth student joins with a ninety-minute trip.
  const bar90 = makeBar(col8(7), 90, U90, BW8, C.pink);
  const labs8 = D8.map((v, k) => {
    const t = T(String(v), P ? 16 : 18, k === 7 ? C.pink : C.cyan, true);
    t.moveTo([col8(k), BASE - 0.32, 0]);
    return t;
  });
  const y20b = BASE + 20 * U90;
  const mean20Ref = new M.DashedLine({ start: [col8(0) - SP8 / 2, y20b, 0], end: [col8(7) + SP8 / 2, y20b, 0], color: C.muted });
  const ref20Tag = T('old 20', P ? 15 : 17, C.muted, true);
  ref20Tag.moveTo([col8(1), y20b + 0.28, 0]);
  const top90Dot = new M.Dot({ point: [col8(7), BASE + 90 * U90, 0], radius: 0.06, color: C.pink });
  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(...labs7, mean20Line, mean20Tag)),
    ...bars1.map((b, k) => new M.Transform(b, makeBar(col8(k), D7[k], U90, BW8, C.cyan), { runTime: 1.1 })),
    new M.FadeIn(bar90, { runTime: 1.1 }),
    new M.Flash(top90Dot, { color: C.pink }),
    new M.FadeIn(new M.VGroup(...labs8)),
    new M.Create(mean20Ref), new M.FadeIn(ref20Tag),
    ...fbox(['7 trips + 1 new', ['new trip = 90 min', C.pink]], C.pink),
    ...say('+ 8TH STUDENT: 90 MINUTES', C.pink)
  );
  bars1.push(bar90);

  // 6: That totals two hundred and thirty minutes.
  await until(S(6));
  await play(...fbox(['140 + 90 = 230', ['sum = 230 min', C.amber]], C.amber), ...say('NEW TOTAL = 230 MINUTES', C.amber));

  // 7: Eight thirties would be two hundred and forty — ten too high.
  const y30 = BASE + 30 * U90;
  const line30 = new M.DashedLine({ start: [col8(0) - SP8 / 2, y30, 0], end: [col8(7) + SP8 / 2, y30, 0], color: C.muted });
  const tag30 = T('30?', P ? 17 : 19, C.muted, true);
  tag30.moveTo([col8(3.5), y30 + 0.30, 0]);
  await until(S(7));
  await play(
    new M.Create(line30), new M.FadeIn(tag30),
    ...fbox(['8 × 30 = 240', ['10 too high (need 230)', C.muted]], C.muted),
    ...say('8 × 30 = 240 (10 TOO HIGH)', C.muted)
  );

  // 8: Trim just over a minute from each: the mean jumps to almost twenty-nine.
  const y2875 = BASE + 28.75 * U90;
  const mean2875Line = new M.DashedLine({ start: [col8(0) - SP8 / 2, y2875, 0], end: [col8(7) + SP8 / 2, y2875, 0], color: C.amber });
  const mean2875Tag = T('MEAN 28.75', P ? 17 : 19, C.amber, true);
  mean2875Tag.moveTo([col8(3.2), y2875 + 0.36, 0]);
  const jumpArr = new M.Arrow({ start: [col8(0), y20b, 0], end: [col8(0), y2875 + 0.05, 0], color: C.pink, strokeWidth: 3 });
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(line30, tag30)),
    new M.Create(mean2875Line), new M.FadeIn(mean2875Tag), new M.Create(jumpArr),
    ...fbox(['230 ÷ 8 = 28.75', ['mean ≈ 29 min', C.pink]], C.pink),
    ...say('MEAN JUMPS: 20 → 28.75', C.pink)
  );

  // 9: Yet nothing changed for the first seven students.
  const box7W = col8(6) - col8(0) + BW8 + 0.36;
  const box7H = 30 * U90 + 0.72;
  const box7 = new M.RoundedRectangle({ width: box7W, height: box7H, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  box7.moveTo([(col8(0) + col8(6)) / 2, BASE + box7H / 2 - 0.12, 0]);
  await until(S(9));
  await play(
    new M.Create(box7),
    new M.LaggedStart(bars1.slice(0, 7).map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.2 }),
    ...say('FIRST 7 TRIPS NEVER CHANGED', C.cyan)
  );

  // 10: Can we find a typical trip one huge number cannot pull away?
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(box7, jumpArr, mean20Ref, ref20Tag)),
    ...hideBox(),
    new M.Indicate(bar90, { color: C.pink }),
    ...say('A TYPICAL TRIP 90 CAN’T PULL?', C.violet)
  );

  // ==================== ACT 2 (11–18): 7 ordered trips, cross off pairs → Median = 18 ====================

  const ROW_Y = P ? -2.4 : 0.72;
  const CW7 = P ? 0.78 : 0.84, CH = P ? 0.76 : 0.82;
  const CW8 = P ? 0.74 : 0.80;

  const makeCard = (x, y, w, val, color = C.cyan) => {
    const r = new M.RoundedRectangle({ width: w, height: CH, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t = T(String(val), P ? 20 : 24, color, true);
    t.moveTo([x, y, 0]);
    return { r, t };
  };

  // 11: Line up those seven trips from shortest to longest.
  const c7 = D7.map((v, k) => makeCard(col7(k), ROW_Y, CW7, v, C.cyan));
  const ordArr7 = new M.Arrow({ start: [col7(0) - 0.3, ROW_Y - 0.85, 0], end: [col7(6) + 0.3, ROW_Y - 0.85, 0], color: C.muted, strokeWidth: 2 });
  const ordLab7 = T('shortest  →  longest', P ? 17 : 19, C.muted);
  ordLab7.moveTo([CX, ROW_Y - 1.18, 0]);
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(floor1, ...bars1, ...labs8, mean2875Line, mean2875Tag)),
    new M.LaggedStart(c7.map(c => new M.FadeIn(c.r)), { lagRatio: 0.08, runTime: 1.1 }),
    new M.LaggedStart(c7.map(c => new M.FadeIn(c.t)), { lagRatio: 0.08, runTime: 1.1 }),
    new M.Create(ordArr7), new M.FadeIn(ordLab7),
    ...say('ORDER: SHORTEST TO LONGEST', C.cyan)
  );

  // 12: Cross off pairs from both ends until one or two stay.
  const inL7 = new M.Arrow({ start: [col7(0) - 0.1, ROW_Y - 1.75, 0], end: [col7(2), ROW_Y - 1.75, 0], color: C.amber, strokeWidth: 2.5 });
  const inR7 = new M.Arrow({ start: [col7(6) + 0.1, ROW_Y - 1.75, 0], end: [col7(4), ROW_Y - 1.75, 0], color: C.amber, strokeWidth: 2.5 });
  await until(S(12));
  await play(new M.Create(inL7), new M.Create(inR7), ...say('CROSS OFF PAIRS FROM BOTH ENDS', C.amber));

  // 13: Seven is odd, so one stays.
  await until(S(13));
  await play(...fbox(['7 trips (odd)', ['→ 1 middle stays', C.green]], C.green), ...say('7 IS ODD → 1 STAYS', C.green));

  // 14–16: Cross off pairs (10,30), (12,30), (15,25)
  const x7 = [];
  const crossPair7 = (i, j, label) => {
    const xi = makeX(col7(i), ROW_Y, 0.28, C.pink);
    const xj = makeX(col7(j), ROW_Y, 0.28, C.pink);
    x7.push(xi, xj);
    c7[i].r.setColor(C.muted); c7[i].r.setFill(C.bg, 0.35);
    c7[j].r.setColor(C.muted); c7[j].r.setFill(C.bg, 0.35);
    return [new M.Create(xi, { runTime: 0.65 }), new M.Create(xj, { runTime: 0.65 }), ...say(label, C.muted)];
  };

  await until(S(14));
  await play(new M.FadeOut(new M.VGroup(inL7, inR7)), ...crossPair7(0, 6, 'PAIR 1: 10 AND 30'));

  await until(S(15));
  await play(...crossPair7(1, 5, 'PAIR 2: 12 AND 30'));

  await until(S(16));
  await play(...crossPair7(2, 4, 'PAIR 3: 15 AND 25'));

  // 17: Eighteen stays in the middle: three shorter, three longer.
  c7[3].r.setColor(C.green); c7[3].r.setFill(C.green, 0.22);
  const t18Green = T('18', P ? 20 : 24, C.green, true); t18Green.moveTo([col7(3), ROW_Y, 0]);
  const sideL7 = T('← 3 shorter', P ? 17 : 19, C.cyan); sideL7.moveTo([col7(1), ROW_Y - 1.85, 0]);
  const sideR7 = T('3 longer →', P ? 17 : 19, C.cyan); sideR7.moveTo([col7(5), ROW_Y - 1.85, 0]);
  const midDot7 = new M.Dot({ point: [col7(3), ROW_Y, 0], radius: 0.05, color: C.green });
  await until(S(17));
  await play(
    new M.FadeOut(c7[3].t), new M.FadeIn(t18Green),
    new M.Flash(midDot7, { color: C.green }),
    new M.FadeIn(sideL7), new M.FadeIn(sideR7),
    ...say('18 IN MIDDLE: 3 BELOW, 3 ABOVE', C.green)
  );
  c7[3].t = t18Green;

  // 18: That middle number is the median — median just means middle.
  await until(S(18));
  await play(
    new M.Indicate(c7[3].r, { color: C.green }),
    ...fbox(['7 ordered trips', '3 shorter | 18 | 3 longer', ['median = 18 min', C.green]], C.green),
    ...say('MEDIAN = MIDDLE = 18', C.green)
  );

  // ==================== ACT 3 (19–33): 8 trips (+90), even count → 18 & 25 → 21.5 → 90→200 ====================

  // 19: Now bring back the eighth student, at ninety minutes.
  const c8 = D8.map((v, k) => makeCard(col8(k), ROW_Y, CW8, v, k === 7 ? C.pink : C.cyan));
  const flash90 = new M.Dot({ point: [col8(7), ROW_Y, 0], radius: 0.05, color: C.pink });
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...c7.map(c => c.r), ...c7.map(c => c.t), ordArr7, ordLab7, ...x7, sideL7, sideR7)),
    new M.LaggedStart(c8.map(c => new M.FadeIn(c.r)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.LaggedStart(c8.map(c => new M.FadeIn(c.t)), { lagRatio: 0.06, runTime: 1.0 }),
    new M.Flash(flash90, { color: C.pink }),
    ...fbox(['8 ordered trips', ['+ 90 at the right end', C.pink]], C.pink),
    ...say('ADD 8TH STUDENT: 90 MINUTES', C.pink)
  );

  // 20: Eight is even, so stop when two stay.
  await until(S(20));
  await play(...fbox(['8 trips (even)', ['→ 2 middle stay', C.green]], C.green), ...say('8 IS EVEN → STOP AT 2', C.green));

  // 21–23: Cross off (10,90), (12,30), (15,30)
  const x8 = [];
  const crossPair8 = (i, j, label) => {
    const xi = makeX(col8(i), ROW_Y, 0.26, C.pink);
    const xj = makeX(col8(j), ROW_Y, 0.26, C.pink);
    x8.push(xi, xj);
    c8[i].r.setColor(C.muted); c8[i].r.setFill(C.bg, 0.35);
    c8[j].r.setColor(C.muted); c8[j].r.setFill(C.bg, 0.35);
    return [new M.Create(xi, { runTime: 0.6 }), new M.Create(xj, { runTime: 0.6 }), ...say(label, C.muted)];
  };

  await until(S(21));
  await play(...crossPair8(0, 7, 'PAIR 1: 10 AND 90'));

  await until(S(22));
  await play(...crossPair8(1, 6, 'PAIR 2: 12 AND 30'));

  await until(S(23));
  await play(...crossPair8(2, 5, 'PAIR 3: 15 AND 30'));

  // 24: Two remain: eighteen and twenty-five.
  c8[3].r.setColor(C.green); c8[3].r.setFill(C.green, 0.22);
  c8[4].r.setColor(C.green); c8[4].r.setFill(C.green, 0.22);
  const t18g = T('18', P ? 20 : 24, C.green, true); t18g.moveTo([col8(3), ROW_Y, 0]);
  const t25g = T('25', P ? 20 : 24, C.green, true); t25g.moveTo([col8(4), ROW_Y, 0]);
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(c8[3].t, c8[4].t)),
    new M.FadeIn(t18g), new M.FadeIn(t25g),
    ...fbox(['middle pair:', ['18 and 25', C.green]], C.green),
    ...say('TWO REMAIN: 18 AND 25', C.green)
  );
  c8[3].t = t18g; c8[4].t = t25g;

  // 25: Move minutes from twenty-five onto eighteen until both match.
  const LX = P ? -3.05 : -5.65;
  const BU = P ? 0.22 : 0.27;
  const BH = P ? 0.48 : 0.44;
  const Y18 = P ? -4.1 : -0.82;
  const Y25 = P ? -5.2 : -1.78;
  const spanRect = (s0, s1, y, color = C.cyan) => {
    const gap = BU * 0.14;
    const w = Math.max(0.04, (s1 - s0) * BU - gap);
    const r = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1 });
    r.setFill(color, 0.84);
    r.moveTo([LX + ((s0 + s1) / 2) * BU, y, 0]);
    return r;
  };
  const b18 = Array.from({ length: 18 }, (_, j) => spanRect(j, j + 1, Y18, C.cyan));
  const b25Base = Array.from({ length: 18 }, (_, j) => spanRect(j, j + 1, Y25, C.cyan));
  const b25Stay = [
    spanRect(18, 19, Y25, C.cyan), spanRect(19, 20, Y25, C.cyan),
    spanRect(20, 21, Y25, C.cyan), spanRect(21, 21.5, Y25, C.cyan)
  ];
  const b25Move = [
    spanRect(21.5, 22, Y25, C.cyan), spanRect(22, 23, Y25, C.cyan),
    spanRect(23, 24, Y25, C.cyan), spanRect(24, 25, Y25, C.cyan)
  ];
  let lab18 = T('18', P ? 18 : 20, C.cyan, true); lab18.moveTo([LX + 18 * BU + 0.36, Y18, 0]);
  let lab25 = T('25', P ? 18 : 20, C.cyan, true); lab25.moveTo([LX + 25 * BU + 0.36, Y25, 0]);
  await until(S(25));
  await play(
    new M.LaggedStart(b18.map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 0.9 }),
    new M.LaggedStart([...b25Base, ...b25Stay, ...b25Move].map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.0 }),
    new M.FadeIn(lab18), new M.FadeIn(lab25),
    ...say('MATCH 18 AND 25', C.amber)
  );

  // 26: Every minute one loses, the other gains, so they meet halfway.
  const x215 = LX + 21.5 * BU;
  const halfLine = new M.DashedLine({ start: [x215, Y25 - 0.55, 0], end: [x215, Y18 + 0.55, 0], color: C.green });
  const halfLab = T('halfway', P ? 16 : 18, C.green); halfLab.moveTo([x215, Y18 + 0.78, 0]);
  await until(S(26));
  await play(new M.Create(halfLine), new M.FadeIn(halfLab), ...say('ONE LOSES = OTHER GAINS', C.amber));

  // 27: Their gap is seven, so move half — three and a half.
  b25Stay.forEach(b => { b.setColor(C.amber); b.setFill(C.amber, 0.45); });
  b25Move.forEach(b => { b.setColor(C.amber); b.setFill(C.amber, 0.92); });
  const gapLine = new M.Line({ start: [LX + 18 * BU, Y25 - 0.48, 0], end: [LX + 25 * BU, Y25 - 0.48, 0], color: C.amber, strokeWidth: 2.5 });
  const gapLab = T('gap = 7  (3.5 + 3.5)', P ? 16 : 18, C.amber, true); gapLab.moveTo([x215, Y25 - 0.80, 0]);
  await until(S(27));
  await play(
    new M.Create(gapLine), new M.FadeIn(gapLab),
    ...fbox(['gap  = 25 − 18 = 7', ['half = 3.5', C.amber]], C.amber),
    ...say('GAP = 7 → MOVE HALF (3.5)', C.amber)
  );

  // 28: Add that to eighteen: both meet at twenty-one and a half.
  const moveTargets = [
    spanRect(21, 21.5, Y18, C.green), spanRect(20, 21, Y18, C.green),
    spanRect(19, 20, Y18, C.green), spanRect(18, 19, Y18, C.green)
  ];
  b25Stay.forEach(b => { b.setColor(C.cyan); b.setFill(C.cyan, 0.84); });
  const lab18End = T('21.5', P ? 18 : 20, C.green, true); lab18End.moveTo([x215 + 0.55, Y18, 0]);
  const lab25End = T('21.5', P ? 18 : 20, C.green, true); lab25End.moveTo([x215 + 0.55, Y25, 0]);
  const halfLab2 = T('21.5', P ? 17 : 19, C.green, true); halfLab2.moveTo([x215, Y18 + 0.78, 0]);
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(gapLine, gapLab, lab18, lab25, halfLab)),
    new M.LaggedStart(b25Move.map((b, idx) => new M.Transform(b, moveTargets[idx], { pathArc: 0.75 })), { lagRatio: 0.14, runTime: 1.5 }),
    new M.FadeIn(lab18End), new M.FadeIn(lab25End), new M.FadeIn(halfLab2),
    ...fbox(['18 + 3.5 = 21.5', '25 − 3.5 = 21.5', ['median = 21.5 min', C.green]], C.green),
    ...say('BOTH MEET AT 21.5', C.green)
  );

  // 29: Eighteen plus twenty-five is forty-three, and half gives the same answer.
  await until(S(29));
  await play(
    ...fbox(['(18 + 25) ÷ 2', '= 43 ÷ 2', ['= 21.5 minutes', C.green]], C.green),
    ...say('(18 + 25) ÷ 2 = 21.5', C.green)
  );

  // 30: Why did it rise from eighteen to twenty-one and a half?
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...b18, ...b25Base, ...b25Stay, ...b25Move, lab18End, lab25End, halfLine, halfLab2)),
    ...fbox(['7 trips → median 18', '8 trips → median 21.5', ['why did it rise?', C.amber]], C.amber),
    ...say('WHY DID IT RISE: 18 → 21.5?', C.amber)
  );

  // 31: Only because adding someone shifted the middle, not because ninety is huge.
  const midX8 = (col8(3) + col8(4)) / 2;
  const midPtr = new M.Arrow({ start: [midX8, ROW_Y - 1.35, 0], end: [midX8, ROW_Y - 0.50, 0], color: C.green, strokeWidth: 3 });
  const midPtrLab = T('new middle', P ? 17 : 19, C.green); midPtrLab.moveTo([midX8, ROW_Y - 1.62, 0]);
  await until(S(31));
  await play(
    new M.Create(midPtr), new M.FadeIn(midPtrLab),
    new M.Indicate(c8[3].r, { color: C.green }), new M.Indicate(c8[4].r, { color: C.green }),
    ...fbox(['count: 7 → 8', 'middle: 18 → (18, 25)', ['not because 90 is huge', C.cyan]], C.cyan),
    ...say('NEW PERSON SHIFTED THE MIDDLE', C.green)
  );

  // 32: Stretch ninety to two hundred, with nobody new.
  c8[7].r.setColor(C.pink); c8[7].r.setFill(C.pink, 0.22);
  const t200 = T('200', P ? 18 : 21, C.pink, true); t200.moveTo([col8(7), ROW_Y, 0]);
  const flash200 = new M.Dot({ point: [col8(7), ROW_Y, 0], radius: 0.05, color: C.pink });
  await until(S(32));
  await play(
    new M.FadeOut(c8[7].t), new M.FadeIn(t200),
    new M.Flash(flash200, { color: C.pink }),
    ...fbox(['90 → 200 minutes', 'still 8 trips', ['end grows, middle stays', C.pink]], C.pink),
    ...say('STRETCH 90 → 200 (STILL 8)', C.pink)
  );
  c8[7].t = t200;

  // 33: Eighteen and twenty-five still sit in the middle, so the median never moves.
  await until(S(33));
  await play(
    new M.Indicate(c8[3].r, { color: C.green }), new M.Indicate(c8[4].r, { color: C.green }),
    ...fbox(['middle pair: 18 & 25', ['median = 21.5 (unchanged)', C.green]], C.green),
    ...say('MEDIAN NEVER MOVES: 21.5', C.green)
  );

  // ==================== ACT 4 (34–57): Café evening shift, order first, median 3.5 vs mean 5, trap ====================

  const EV_BASE = P ? -4.3 : -2.2;
  const U14 = P ? 4.8 / 14 : 3.05 / 14;
  const U60 = P ? 5.0 / 60 : 3.20 / 60;
  const makeEvBar = (x, val, u, color = C.pink) => {
    const h = Math.max(0.08, val * u);
    const r = new M.Rectangle({ width: BW8, height: h, color, strokeWidth: 1.5 });
    r.setFill(color, 0.82);
    r.moveTo([x, EV_BASE + h / 2, 0]);
    return r;
  };

  // 34: Now picture our café's evening shift: eight waits as customers arrived.
  const evFloor = new M.Line({ start: [col8(0) - SP8 / 2, EV_BASE, 0], end: [col8(7) + SP8 / 2, EV_BASE, 0], color: C.muted, strokeWidth: 2 });
  const evBars = EV_ARR.map((v, k) => makeEvBar(col8(k), v, U14, C.pink));
  const evArrLabs = EV_ARR.map((v, k) => { const t = T(String(v), P ? 17 : 19, C.pink, true); t.moveTo([col8(k), EV_BASE - 0.30, 0]); return t; });
  const evArrIdx = EV_ARR.map((_, k) => { const t = T('#' + (k + 1), 15, C.muted, true); t.moveTo([col8(k), EV_BASE - 0.64, 0]); return t; });
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(...c8.map(c => c.r), ...c8.map(c => c.t), ...x8, midPtr, midPtrLab)),
    new M.Create(evFloor),
    new M.LaggedStart(evBars.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(...evArrLabs, ...evArrIdx)),
    ...fbox(['café evening shift', ['8 waits (arrival order)', C.pink]], C.pink),
    ...say('CAFÉ EVENING: ARRIVAL ORDER', C.pink)
  );

  // 35: Most took a few minutes, except fourteen when the machine jammed.
  const jamTag = T('JAM! 14', P ? 17 : 19, C.amber, true);
  jamTag.moveTo([col8(3), EV_BASE + 14 * U14 + 0.34, 0]);
  const jamDot = new M.Dot({ point: [col8(3), EV_BASE + 14 * U14, 0], radius: 0.05, color: C.amber });
  await until(S(35));
  await play(
    new M.FadeIn(jamTag), new M.Flash(jamDot, { color: C.amber }),
    new M.Indicate(evBars[3], { color: C.amber }),
    ...say('MACHINE JAMMED: 14 MINUTES', C.amber)
  );

  // 36: Order the waits from shortest to longest first.
  const evSortedBars = new Array(8);
  EV_TO_SORT.forEach((dest, src) => { evSortedBars[dest] = evBars[src]; });
  const evSortLabs = EV_SORT.map((v, k) => { const t = T(String(v), P ? 17 : 19, C.pink, true); t.moveTo([col8(k), EV_BASE - 0.30, 0]); return t; });
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(jamTag, ...evArrLabs, ...evArrIdx)),
    ...evBars.map((b, src) => new M.Transform(b, makeEvBar(col8(EV_TO_SORT[src]), EV_ARR[src], U14, C.pink), { pathArc: 0.35, runTime: 1.3 })),
    new M.FadeIn(new M.VGroup(...evSortLabs)),
    ...fbox(['ordered waits:', ['2, 3, 3, 3, 4, 5, 6, 14', C.cyan]], C.cyan),
    ...say('FIRST: ORDER SMALL TO LARGE', C.cyan)
  );

  // 37: Skip this, and you pick whoever arrived midway, not the middle wait.
  await until(S(37));
  await play(
    ...fbox(['skip ordering?', 'arrival #4 & #5: 14 & 3', ['→ wrong middle!', C.pink]], C.pink),
    ...say('SKIP ORDERING → WRONG MIDDLE', C.pink)
  );

  // 38: Cross off pairs from both ends until two stay.
  await until(S(38));
  await play(
    ...fbox(['8 sorted waits', ['cross off pairs → 2 stay', C.green]], C.green),
    ...say('CROSS OFF PAIRS FROM BOTH ENDS', C.amber)
  );

  // 39–41: Cross off (2,14), (3,6), (3,5)
  const evX = [];
  const crossEv = (i, j, label) => {
    const xi = makeX(col8(i), EV_BASE - 0.30, 0.22, C.amber);
    const xj = makeX(col8(j), EV_BASE - 0.30, 0.22, C.amber);
    evX.push(xi, xj);
    evSortedBars[i].setFill(C.pink, 0.22); evSortedBars[i].setColor(C.muted);
    evSortedBars[j].setFill(C.pink, 0.22); evSortedBars[j].setColor(C.muted);
    return [new M.Create(xi, { runTime: 0.55 }), new M.Create(xj, { runTime: 0.55 }), ...say(label, C.muted)];
  };

  await until(S(39));
  await play(...crossEv(0, 7, 'PAIR 1: 2 AND 14'));

  await until(S(40));
  await play(...crossEv(1, 6, 'PAIR 2: 3 AND 6'));

  await until(S(41));
  await play(...crossEv(2, 5, 'PAIR 3: 3 AND 5'));

  // 42: The last three, and four, remain.
  evSortedBars[3].setColor(C.green); evSortedBars[3].setFill(C.green, 0.9);
  evSortedBars[4].setColor(C.green); evSortedBars[4].setFill(C.green, 0.9);
  await until(S(42));
  await play(
    new M.Indicate(evSortedBars[3], { color: C.green }), new M.Indicate(evSortedBars[4], { color: C.green }),
    ...say('TWO REMAIN: 3 AND 4', C.green)
  );

  // 43: Halfway is three and a half minutes.
  const yMed35 = EV_BASE + 3.5 * U14;
  const evMedLine = new M.DashedLine({ start: [col8(0) - SP8 / 2, yMed35, 0], end: [col8(7) + SP8 / 2, yMed35, 0], color: C.green });
  const medTagY = P ? -1.45 : -0.25;
  const evMedTag = T('MEDIAN 3.5', P ? 17 : 19, C.green, true); evMedTag.moveTo([col8(1.3), medTagY, 0]);
  const evMedArr = new M.Arrow({ start: [col8(1.3), medTagY - 0.28, 0], end: [col8(1.3), yMed35 + 0.06, 0], color: C.green, strokeWidth: 2.5 });
  await until(S(43));
  await play(
    new M.Create(evMedLine), new M.Create(evMedArr), new M.FadeIn(evMedTag),
    ...fbox(['middle pair: 3 and 4', ['median = 3.5 min', C.green]], C.green),
    ...say('MEDIAN = 3.5 MINUTES', C.green)
  );

  // 44: All eight waits total forty minutes.
  [0, 1, 2, 5, 6, 7].forEach(k => { evSortedBars[k].setColor(C.pink); evSortedBars[k].setFill(C.pink, 0.82); });
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(...evX)),
    ...fbox(['2+3+3+3+4+5+6+14', ['sum = 40 min', C.amber]], C.amber),
    ...say('ALL 8 WAITS TOTAL 40', C.amber)
  );

  // 45: Eight fives make forty, so the mean is five.
  const yMean5 = EV_BASE + 5 * U14;
  const evMeanLine = new M.DashedLine({ start: [col8(0) - SP8 / 2, yMean5, 0], end: [col8(7) + SP8 / 2, yMean5, 0], color: C.amber });
  const meanTagY = P ? -0.55 : 0.45;
  const evMeanTag = T('MEAN 5', P ? 17 : 19, C.amber, true); evMeanTag.moveTo([col8(4.2), meanTagY, 0]);
  const evMeanArr = new M.Arrow({ start: [col8(4.2), meanTagY - 0.28, 0], end: [col8(4.2), yMean5 + 0.06, 0], color: C.amber, strokeWidth: 2.5 });
  await until(S(45));
  await play(
    new M.Create(evMeanLine), new M.Create(evMeanArr), new M.FadeIn(evMeanTag),
    ...fbox(['sum   = 40 min', '8 × 5 = 40', ['mean  = 5 min', C.amber]], C.amber),
    ...say('MEAN = 5 MINUTES', C.amber)
  );

  // 46: That jam pulled the mean to five, while the median stayed at three and a half.
  await until(S(46));
  await play(
    new M.Indicate(evSortedBars[7], { color: C.amber }),
    new M.Indicate(evMeanTag, { color: C.amber }),
    new M.Indicate(evMedTag, { color: C.green }),
    ...fbox([['mean   = 5 min   (pulled)', C.amber], ['median = 3.5 min (steady)', C.green]], C.green),
    ...say('MEAN 5 (PULLED) · MEDIAN 3.5', C.amber)
  );

  // 47: First order the numbers, then take the middle — or halfway between two.
  await until(S(47));
  await play(
    ...fbox(['1. Order small → large', '2. Take the middle', ['   (or halfway between 2)', C.green]], C.cyan),
    ...say('ORDER FIRST, TAKE THE MIDDLE', C.cyan)
  );

  // 48: Use it for waits, house prices, or pay, where huge numbers pull the mean up.
  await until(S(48));
  await play(
    ...fbox(['Use the median for:', ['• waits', C.pink], ['• house prices  • pay', C.cyan]], C.cyan),
    ...say('WAITS · HOUSE PRICES · PAY', C.cyan)
  );

  // 49: One trap: that steadiness can hide trouble at the ends.
  const trapH = 14 * U14 + 0.45;
  const trapBox = new M.RoundedRectangle({ width: BW8 + 0.36, height: trapH, cornerRadius: 0.14, color: C.pink, strokeWidth: 2.5 });
  trapBox.moveTo([col8(7), EV_BASE + trapH / 2 - 0.12, 0]);
  await until(S(49));
  await play(
    new M.FadeOut(new M.VGroup(evMeanLine, evMeanArr, evMeanTag)),
    new M.Create(trapBox),
    ...fbox(['One trap:', ['steadiness can hide', C.pink], ['trouble at the ends', C.pink]], C.pink),
    ...say('TRAP: HIDES TROUBLE AT ENDS', C.pink)
  );

  // 50: Imagine only the fourteen-minute wait grows to an hour.
  const EV_60 = [2, 3, 3, 3, 4, 5, 6, 60];
  const evLabs60 = EV_60.map((v, k) => {
    const col = (k === 3 || k === 4) ? C.green : C.pink;
    const t = T(String(v), P ? 16 : 18, col, true);
    t.moveTo([col8(k), EV_BASE - 0.30, 0]);
    return t;
  });
  const hrTag = T('60 min (1 hr)', P ? 17 : 19, C.pink, true);
  hrTag.moveTo([col8(5.1), EV_BASE + 60 * U60 - 0.15, 0]);
  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(trapBox, evMedLine, evMedArr, evMedTag, ...evSortLabs)),
    ...evSortedBars.map((b, k) => new M.Transform(b, makeEvBar(col8(k), EV_60[k], U60, (k === 3 || k === 4) ? C.green : C.pink), { runTime: 1.2 })),
    new M.FadeIn(new M.VGroup(...evLabs60)),
    new M.FadeIn(hrTag),
    ...say('14 MINUTES → 60 MINUTES (1 HR)', C.pink)
  );

  // 51: Which two waits are still in the middle?
  const qMark = T('?', P ? 36 : 38, C.amber, true);
  qMark.moveTo([(col8(3) + col8(4)) / 2, EV_BASE + 1.25, 0]);
  await until(S(51));
  await play(new M.FadeIn(qMark), ...say('WHICH TWO ARE IN THE MIDDLE?', C.amber));

  // 52: Still three and four — the median stays at three and a half.
  const yMed60 = EV_BASE + 3.5 * U60;
  const evMedLine60 = new M.DashedLine({ start: [col8(0) - SP8 / 2, yMed60, 0], end: [col8(7) + SP8 / 2, yMed60, 0], color: C.green });
  const med60TagY = EV_BASE + (P ? 1.85 : 1.45);
  const evMedTag60 = T('MEDIAN 3.5', P ? 17 : 19, C.green, true); evMedTag60.moveTo([(col8(3) + col8(4)) / 2, med60TagY, 0]);
  const evMedArr60 = new M.Arrow({ start: [(col8(3) + col8(4)) / 2, med60TagY - 0.28, 0], end: [(col8(3) + col8(4)) / 2, yMed60 + 0.08, 0], color: C.green, strokeWidth: 2.5 });
  await until(S(52));
  await play(
    new M.FadeOut(qMark),
    new M.Create(evMedLine60), new M.Create(evMedArr60), new M.FadeIn(evMedTag60),
    new M.Indicate(evLabs60[3], { color: C.green }), new M.Indicate(evLabs60[4], { color: C.green }),
    ...fbox(['middle pair: still 3 & 4', ['median = 3.5 min', C.green]], C.green),
    ...say('STILL 3 & 4 → MEDIAN = 3.5', C.green)
  );

  // 53: It hides that hour-long wait.
  await until(S(53));
  await play(new M.Indicate(evSortedBars[7], { color: C.pink, runTime: 0.8 }), ...say('IT HIDES THE 60-MINUTE WAIT', C.pink));

  // 54: Match the tool to your question.
  await until(S(54));
  await play(...fbox(['Match the tool', ['to your question', C.cyan]], C.cyan), ...say('MATCH TOOL TO YOUR QUESTION', C.cyan));

  // 55: For the worst delay, check the longest wait.
  await until(S(55));
  await play(
    new M.Indicate(evSortedBars[7], { color: C.pink }),
    new M.Indicate(hrTag, { color: C.pink }),
    ...fbox(['worst delay?', ['→ check the longest wait', C.pink]], C.pink),
    ...say('WORST DELAY → LONGEST WAIT', C.pink)
  );

  // 56: For total waiting time, add all eight waits.
  await until(S(56));
  await play(
    new M.LaggedStart(evSortedBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['total waiting time?', ['→ add all 8 waits', C.amber]], C.amber),
    ...say('TOTAL WAIT → ADD ALL 8', C.amber)
  );

  // 57: To recap: the median is the center of an ordered line, steady even against one huge number.
  await until(S(57));
  await play(
    new M.Indicate(evMedTag60, { color: C.green }),
    new M.Indicate(evLabs60[3], { color: C.green }),
    new M.Indicate(evLabs60[4], { color: C.green }),
    ...fbox(['MEDIAN', ['• center of ordered line', C.green], ['• steady vs huge numbers', C.cyan]], C.green),
    ...say('MEDIAN = CENTER OF ORDERED LINE', C.green)
  );
}

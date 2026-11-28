// 3.3.7 Measurement error (live Manim-web lesson, script.v4.md).
// Beat i = sentence i (0-based, 0..44). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const TRUE = [23, 28, 34, 37, 28];
  const RAND = [25, 26, 35, 36, 28];
  const RERR = [2, -2, 1, -1, 0];
  const SYST = [20, 25, 30, 35, 25];
  const SERR = [-3, -3, -4, -2, -3];

  // Layout constants: phone (8 x 14.22, y in [-5.5, 4.3]) vs laptop (14.22 x 8, y in [-3.0, 2.3])
  const CX = P ? 0.25 : -2.35;
  const SP = P ? 1.24 : 1.38;
  const DX = P ? 0.22 : 0.24;
  const AX_L = P ? -3.00 : -5.90;
  const AX_R = P ? 3.70 : 1.35;
  const Y_BOT = P ? -3.65 : -2.05;
  const Y_TOP = P ? 1.19 : 1.25;
  const PILL = P ? [0, 1.92, 0] : [CX, 1.90, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.65, -0.35, 0];
  const LAB_Y = P ? -4.05 : -2.34;
  const ERR_Y = P ? -4.60 : -2.76;

  const colx = k => CX + (k - 2) * SP;
  const valY = v => Y_BOT + (v - 18) / 22 * (Y_TOP - Y_BOT);
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan, rt) {
    const size = P ? 20 : 20, lh = P ? 0.40 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.325, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.15;
    if (wd > maxw) g.scale(maxw / wd);
    const opt = rt ? { runTime: rt } : undefined;
    const a = [new M.FadeIn(g, opt)];
    if (boxNow) a.push(new M.FadeOut(boxNow, opt));
    boxNow = g;
    return a;
  }

  // Crisp vertical arrow built from 3 Lines (works cleanly even for ±1 min)
  function vArrow(x, y0, y1, color) {
    const dy = y1 - y0, dist = Math.abs(dy), dir = dy >= 0 ? 1 : -1;
    const tipY = dist > 0.22 ? y1 - dir * 0.07 : y1;
    const hh = Math.min(0.11, dist * 0.52), hw = Math.min(0.085, hh * 0.82);
    const shaft = new M.Line({ start: [x, y0, 0], end: [x, tipY, 0], color, strokeWidth: 3.5 });
    const lWing = new M.Line({ start: [x - hw, tipY - dir * hh, 0], end: [x, tipY, 0], color, strokeWidth: 3.5 });
    const rWing = new M.Line({ start: [x + hw, tipY - dir * hh, 0], end: [x, tipY, 0], color, strokeWidth: 3.5 });
    return new M.VGroup(shaft, lWing, rWing);
  }

  function miniTag(text, color) {
    const t = T(text, P ? 15 : 15, color, true);
    const r = new M.RoundedRectangle({ width: t.getWidth() + 0.32, height: 0.36, cornerRadius: 0.18, color, strokeWidth: 1.8 });
    r.setFill(C.bg, 0.94);
    return new M.VGroup(r, t);
  }

  // 0-1: Five well-chosen students who all answered — yet answers could be off
  const icons = [], checks = [], qmarks = [];
  const introY = P ? -0.9 : -0.45;
  for (let k = 0; k < 5; k++) {
    const x = (k - 2) * (P ? 1.25 : 1.55);
    const head = new M.Circle({ radius: 0.16, color: C.ink }); head.setFill(C.ink, 1); head.moveTo([x, introY + 0.42, 0]);
    const body = new M.Arc({ radius: 0.30, startAngle: 0, angle: Math.PI, color: C.ink }); body.setFill(C.ink, 1); body.moveTo([x, introY + 0.02, 0]);
    icons.push(new M.VGroup(head, body));
    const ck = T('✓', P ? 28 : 30, C.green, true); ck.moveTo([x, introY + 0.92, 0]);
    checks.push(ck);
    const qm = T('?', P ? 28 : 30, C.amber, true); qm.moveTo([x, introY + 0.92, 0]);
    qmarks.push(qm);
  }

  await until(S(0));
  await play(
    new M.LaggedStart(icons.map(i => new M.FadeIn(i)), { lagRatio: 0.12, runTime: 1.3 }),
    new M.LaggedStart(checks.map(c => new M.FadeIn(c)), { lagRatio: 0.12, runTime: 1.3 }),
    ...say('GOOD SAMPLE · ALL ANSWERED', C.green)
  );

  await until(S(1));
  await play(
    new M.FadeOut(new M.VGroup(...checks)),
    new M.LaggedStart(qmarks.map(q => new M.FadeIn(q)), { lagRatio: 0.1, runTime: 1.1 }),
    ...say('WHAT IF THE ANSWERS ARE OFF?', C.amber)
  );

  // 2-7: Build 5-student chart and show true phone-measured trips
  const yAxis = new M.Line({ start: [AX_L, Y_BOT, 0], end: [AX_L, Y_TOP, 0], color: C.muted, strokeWidth: 2.5 });
  const xAxis = new M.Line({ start: [AX_L, Y_BOT, 0], end: [AX_R, Y_BOT, 0], color: C.muted, strokeWidth: 2.5 });
  const gridVals = [20, 25, 30, 35, 40];
  const gridLines = gridVals.map(v => new M.DashedLine({ start: [AX_L, valY(v), 0], end: [AX_R, valY(v), 0], color: C.line }));
  const yLabels = gridVals.map(v => {
    const t = T(String(v), P ? 18 : 17, C.muted, true);
    t.moveTo([AX_L - (P ? 0.4 : 0.36), valY(v), 0]);
    return t;
  });
  const minUnit = T('min', P ? 16 : 15, C.muted);
  minUnit.moveTo([AX_L - 0.36, Y_TOP + 0.30, 0]);
  const sLabels = TRUE.map((_, k) => {
    const t = T(`#${k + 1}`, P ? 18 : 17, C.muted, true);
    t.moveTo([colx(k), LAB_Y, 0]);
    return t;
  });

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...icons, ...qmarks), { runTime: 0.85 }),
    new M.Create(yAxis, { runTime: 0.85 }),
    new M.Create(xAxis, { runTime: 0.85 }),
    ...gridLines.map(g => new M.FadeIn(g, { runTime: 0.85 })),
    ...yLabels.map(t => new M.FadeIn(t, { runTime: 0.85 })),
    new M.FadeIn(minUnit, { runTime: 0.85 }),
    ...sLabels.map(t => new M.FadeIn(t, { runTime: 0.85 })),
    ...say('5 STUDENTS', C.cyan)
  );

  await until(S(3));
  await play(
    new M.LaggedStart(yLabels.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.1, runTime: 1.2 }),
    ...fbox(['true trips (phone)', ['measured to the minute', C.cyan]], C.cyan),
    ...say('PHONE GPS = TRUE TRIPS', C.cyan)
  );

  // Build true bars, dots, and labels for the 5 students
  const trueBars = [], trueDots = [], trueNums = [];
  for (let k = 0; k < 5; k++) {
    const v = TRUE[k], tx = colx(k) - DX, yt = valY(v), bh = yt - Y_BOT;
    const bar = new M.Rectangle({ width: P ? 0.22 : 0.26, height: bh, color: C.cyan, strokeWidth: 1.5 });
    bar.setFill(C.cyan, 0.25);
    bar.moveTo([tx, Y_BOT + bh / 2, 0]);
    const halo = new M.Dot({ point: [tx, yt, 0], radius: 0.16, color: C.cyan }); halo.setFill(C.cyan, 0.2);
    const dot = new M.Dot({ point: [tx, yt, 0], radius: 0.085, color: C.cyan });
    const num = T(String(v), P ? 19 : 18, C.cyan, true);
    num.moveTo([tx - (P ? 0.3 : 0.32), yt + 0.12, 0]);
    trueBars.push(bar);
    trueDots.push(new M.VGroup(halo, dot));
    trueNums.push(num);
  }
  const showTrue = (k, rt = 0.65) => [
    new M.FadeIn(trueBars[k], { runTime: rt }),
    new M.FadeIn(trueDots[k], { runTime: rt }),
    new M.FadeIn(trueNums[k], { runTime: rt })
  ];

  await until(S(4));
  await play(
    new M.LaggedStart([
      new M.LaggedStart(showTrue(0, 0.6), { lagRatio: 0 }),
      new M.LaggedStart(showTrue(1, 0.6), { lagRatio: 0 })
    ], { lagRatio: 0.45, runTime: 1.1 }),
    ...fbox(['true trips', ['23, 28', C.cyan]], C.cyan, 0.8)
  );

  await until(S(5));
  await play(
    new M.LaggedStart([
      new M.LaggedStart(showTrue(2, 0.6), { lagRatio: 0 }),
      new M.LaggedStart(showTrue(3, 0.6), { lagRatio: 0 })
    ], { lagRatio: 0.45, runTime: 1.1 }),
    ...fbox(['true trips', ['23, 28, 34, 37', C.cyan]], C.cyan, 0.8)
  );

  // S(6) has a short 1.05s window before S(7): keep runTime <= 0.6s
  await until(S(6));
  await play(
    ...showTrue(4, 0.55),
    ...fbox(['true trips', ['23, 28, 34, 37, 28', C.cyan]], C.cyan, 0.55)
  );

  // S(7): True total 150, true mean 30
  const trueMeanLine = new M.DashedLine({ start: [AX_L, valY(30), 0], end: [AX_R, valY(30), 0], color: C.cyan });
  const trueMeanTag = miniTag('TRUE 30', C.cyan);
  trueMeanTag.moveTo([AX_L + (P ? 0.95 : 1.05), valY(30) + 0.30, 0]);
  await until(S(7));
  await play(
    new M.Create(trueMeanLine),
    new M.FadeIn(trueMeanTag),
    ...fbox(['true trips: 23,28,34,37,28', 'sum  = 150 min', ['true mean = 150 ÷ 5 = 30', C.cyan]], C.cyan),
    ...say('TRUE MEAN = 30 MINUTES', C.cyan)
  );

  // 8-9: Ask from memory
  await until(S(8));
  await play(
    new M.LaggedStart(sLabels.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.12, runTime: 1.3 }),
    ...say('“HOW LONG WAS YOUR TRIP?”', C.amber)
  );

  await until(S(9));
  await play(
    ...fbox(['true mean = 30 min', ['asking from memory...', C.amber]], C.amber),
    ...say('MEMORY ≠ A STOPWATCH', C.amber)
  );

  // 10-12: Story 1 — random guesses high or low
  const refTicks = TRUE.map((v, k) => new M.Line({
    start: [colx(k) - DX + 0.08, valY(v), 0],
    end: [colx(k) + DX, valY(v), 0],
    color: C.muted,
    strokeWidth: 1.5
  }));
  await until(S(10));
  await play(
    new M.LaggedStart(refTicks.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 1.1 }),
    ...say('STORY 1: GUESS HIGH OR LOW', C.amber)
  );

  const r1Dots = [], r1Nums = [];
  for (let k = 0; k < 5; k++) {
    const rec = RAND[k], err = RERR[k], rx = colx(k) + DX, yr = valY(rec);
    const dot = new M.Dot({ point: [rx, yr, 0], radius: 0.085, color: C.amber });
    const num = T(String(rec), P ? 19 : 18, C.amber, true);
    num.moveTo([rx + (P ? 0.3 : 0.32), yr, 0]);
    r1Dots.push(dot);
    r1Nums.push(num);
  }
  const showR1 = (k, rt = 0.6) => [new M.FadeIn(r1Dots[k], { runTime: rt }), new M.FadeIn(r1Nums[k], { runTime: rt })];

  await until(S(11));
  await play(
    new M.LaggedStart([
      new M.LaggedStart(showR1(0, 0.55), { lagRatio: 0 }),
      new M.LaggedStart(showR1(1, 0.55), { lagRatio: 0 })
    ], { lagRatio: 0.45, runTime: 1.1 }),
    ...fbox(['story 1: answers', ['25, 26', C.amber]], C.amber, 0.8)
  );

  await until(S(12));
  await play(
    new M.LaggedStart([
      new M.LaggedStart(showR1(2, 0.55), { lagRatio: 0 }),
      new M.LaggedStart(showR1(3, 0.55), { lagRatio: 0 }),
      new M.LaggedStart(showR1(4, 0.55), { lagRatio: 0 })
    ], { lagRatio: 0.35, runTime: 1.4 }),
    ...fbox(['story 1: answers', ['25, 26, 35, 36, 28', C.amber]], C.amber, 0.8)
  );

  // 13-17: Error arrows, error badges, cancelling to 0, mean stays 30
  const r1Arrows = RERR.map((err, k) => {
    const rx = colx(k) + DX;
    if (err === 0) {
      const ring = new M.Circle({ radius: 0.15, color: C.green, strokeWidth: 2.5 });
      ring.moveTo([rx, valY(TRUE[k]), 0]);
      return ring;
    }
    return vArrow(rx, valY(TRUE[k]), valY(RAND[k]), err > 0 ? C.green : C.pink);
  });
  const r1Errs = RERR.map((err, k) => {
    const txt = err > 0 ? `+${err}` : err < 0 ? `−${Math.abs(err)}` : '0';
    const col = err > 0 ? C.green : err < 0 ? C.pink : C.muted;
    const t = T(txt, P ? 21 : 18, col, true);
    t.moveTo([colx(k), ERR_Y, 0]);
    return t;
  });

  await until(S(13));
  await play(
    new M.LaggedStart(r1Arrows.map(a => new M.FadeIn(a)), { lagRatio: 0.16, runTime: 1.8 }),
    ...say('ARROW = TRUE → ANSWER', C.violet)
  );

  await until(S(14));
  await play(
    new M.LaggedStart([new M.FadeIn(r1Errs[0]), new M.FadeIn(r1Errs[1])], { lagRatio: 0.45, runTime: 1.4 }),
    new M.LaggedStart([new M.Indicate(r1Arrows[0], { color: C.green }), new M.Indicate(r1Arrows[1], { color: C.pink })], { lagRatio: 0.45, runTime: 1.4 }),
    ...fbox(['errors so far', ['+2,  −2', C.amber]], C.violet)
  );

  await until(S(15));
  await play(
    new M.LaggedStart([new M.FadeIn(r1Errs[2]), new M.FadeIn(r1Errs[3]), new M.FadeIn(r1Errs[4])], { lagRatio: 0.38, runTime: 1.8 }),
    new M.LaggedStart([
      new M.Indicate(r1Arrows[2], { color: C.green }),
      new M.Indicate(r1Arrows[3], { color: C.pink }),
      new M.Indicate(r1Arrows[4], { color: C.green })
    ], { lagRatio: 0.38, runTime: 1.8 }),
    ...fbox(['errors', ['+2, −2, +1, −1, 0', C.amber]], C.violet)
  );

  await until(S(16));
  await play(
    new M.LaggedStart(r1Errs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.2, runTime: 2.4 }),
    ...fbox(['+2 − 2 + 1 − 1 + 0', ['total error = 0', C.green]], C.green),
    ...say('UP AND DOWN CANCEL OUT', C.green)
  );

  const s1MeanTag = miniTag('ANSWERS 30', C.green);
  s1MeanTag.moveTo([AX_R - (P ? 1.10 : 1.15), valY(30) + 0.30, 0]);
  await until(S(17));
  await play(
    new M.FadeIn(s1MeanTag),
    ...fbox(['answers sum = 150', ['mean = 150 ÷ 5 = 30', C.green]], C.green),
    ...say('MEAN OF ANSWERS = 30', C.green)
  );

  // 18-21: Names — measurement error, random error / noise
  await until(S(18));
  await play(
    new M.Indicate(r1Arrows[0], { color: C.violet }),
    ...fbox([['measurement error', C.violet], 'gap: true → recorded'], C.violet),
    ...say('MEASUREMENT ERROR', C.violet)
  );

  await until(S(19));
  await play(
    new M.LaggedStart(r1Arrows.slice(0, 4).map(a => new M.Indicate(a, { color: C.amber })), { lagRatio: 0.18, runTime: 1.6 }),
    ...fbox([['random error (noise)', C.green], 'up and down by chance'], C.green),
    ...say('RANDOM ERRORS = NOISE', C.green)
  );

  await until(S(20));
  await play(
    new M.LaggedStart(r1Errs.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.14, runTime: 1.7 }),
    ...say('UPS AND DOWNS NEARLY CANCEL', C.green)
  );

  await until(S(21));
  await play(
    new M.LaggedStart(r1Dots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.12, runTime: 1.5 }),
    new M.Indicate(s1MeanTag, { color: C.green }),
    ...say('EACH ANSWER OFF · MEAN = 30', C.amber)
  );

  // 22-30: Story 2 — systematic rounding down to the 0 or 5 just below
  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(...r1Dots, ...r1Nums, ...r1Arrows, ...r1Errs, s1MeanTag)),
    new M.LaggedStart(gridLines.slice(0, 4).map(l => new M.Indicate(l, { color: C.amber })), { lagRatio: 0.12, runTime: 1.6 }),
    ...fbox(['story 2: round down', ['to the 0 or 5 just below', C.pink]], C.pink),
    ...say('STORY 2: ROUND DOWN TO 0 OR 5', C.pink)
  );

  const r2Dots = [], r2Nums = [], r2Arrows = [], r2Errs = [];
  for (let k = 0; k < 5; k++) {
    const rec = SYST[k], err = SERR[k], rx = colx(k) + DX, yr = valY(rec);
    const dot = new M.Dot({ point: [rx, yr, 0], radius: 0.085, color: C.pink });
    const num = T(String(rec), P ? 19 : 18, C.pink, true);
    num.moveTo([rx + (P ? 0.3 : 0.32), yr + (rec === 30 ? -0.22 : 0), 0]);
    const arr = vArrow(rx, valY(TRUE[k]), yr, C.pink);
    const et = T(`−${Math.abs(err)}`, P ? 21 : 18, C.pink, true);
    et.moveTo([colx(k), ERR_Y, 0]);
    r2Dots.push(dot);
    r2Nums.push(num);
    r2Arrows.push(arr);
    r2Errs.push(et);
  }
  const showR2 = (k, rt = 0.65) => [
    new M.FadeIn(r2Arrows[k], { runTime: rt }),
    new M.FadeIn(r2Dots[k], { runTime: rt }),
    new M.FadeIn(r2Nums[k], { runTime: rt })
  ];

  await until(S(23));
  await play(
    new M.LaggedStart([
      new M.LaggedStart(showR2(0, 0.65), { lagRatio: 0 }),
      new M.LaggedStart(showR2(1, 0.65), { lagRatio: 0 })
    ], { lagRatio: 0.5, runTime: 1.6 }),
    ...fbox(['story 2: rounded down', ['23 → 20,  28 → 25', C.pink]], C.pink)
  );

  await until(S(24));
  await play(
    new M.LaggedStart([
      new M.LaggedStart(showR2(2, 0.65), { lagRatio: 0 }),
      new M.LaggedStart(showR2(3, 0.65), { lagRatio: 0 }),
      new M.LaggedStart(showR2(4, 0.65), { lagRatio: 0 })
    ], { lagRatio: 0.42, runTime: 2.2 }),
    ...fbox(['story 2: answers', ['20, 25, 30, 35, 25', C.pink]], C.pink)
  );

  await until(S(25));
  await play(
    new M.LaggedStart(r2Arrows.map(a => new M.Indicate(a, { color: C.pink })), { lagRatio: 0.14, runTime: 1.5 }),
    ...say('EVERY ARROW POINTS DOWN', C.pink)
  );

  await until(S(26));
  await play(
    new M.LaggedStart(r2Errs.map(t => new M.FadeIn(t)), { lagRatio: 0.22, runTime: 2.2 }),
    ...fbox(['−3 − 3 − 4 − 2 − 3', ['total error = −15', C.pink]], C.pink)
  );

  const s2MeanLine = new M.Line({ start: [AX_L, valY(27), 0], end: [AX_R, valY(27), 0], color: C.pink, strokeWidth: 3 });
  const s2MeanTag = miniTag(P ? '27' : 'MEAN 27', C.pink);
  s2MeanTag.moveTo(P ? [AX_L - 0.42, valY(27), 0] : [AX_R + 0.64, valY(27), 0]);
  await until(S(27));
  await play(
    new M.Create(s2MeanLine),
    new M.FadeIn(s2MeanTag),
    ...fbox(['answers sum = 135', ['mean = 135 ÷ 5 = 27', C.pink]], C.pink),
    ...say('MEAN OF ANSWERS = 27', C.pink)
  );

  const gapX = AX_R - 0.44;
  const s2GapArrow = vArrow(gapX, valY(30), valY(27), C.pink);
  const s2GapLabel = T('−3', P ? 20 : 18, C.pink, true);
  s2GapLabel.moveTo([AX_R - 0.14, (valY(30) + valY(27)) / 2, 0]);
  await until(S(28));
  await play(
    new M.FadeIn(s2GapArrow),
    new M.FadeIn(s2GapLabel),
    ...say('3 MINUTES BELOW THE TRUTH', C.pink)
  );

  await until(S(29));
  await play(
    new M.LaggedStart(r2Arrows.map(a => new M.Indicate(a, { color: C.pink })), { lagRatio: 0.12, runTime: 1.5 }),
    new M.Indicate(s2GapLabel, { color: C.pink }),
    ...fbox([['systematic error', C.pink], 'pushes one way every time'], C.pink),
    ...say('SYSTEMATIC ERRORS', C.pink)
  );

  await until(S(30));
  await play(
    ...fbox([['systematic error = bias', C.pink], 'inside the answers'], C.pink),
    ...say('BIAS INSIDE THE ANSWERS', C.pink)
  );

  // 31-34: Scale up both stories: n = 5 -> 100 -> 1,000
  const SW = AX_R - AX_L;
  const sX = frac => AX_L + frac * SW;
  const sY = v => Y_BOT + (v - 24) / 10 * (Y_TOP - Y_BOT);

  const scYAxis = new M.Line({ start: [AX_L, Y_BOT, 0], end: [AX_L, Y_TOP, 0], color: C.muted, strokeWidth: 2.5 });
  const scXAxis = new M.Line({ start: [AX_L, Y_BOT, 0], end: [AX_R, Y_BOT, 0], color: C.muted, strokeWidth: 2.5 });
  const scTicks = [24, 27, 30, 33];
  const scGrids = scTicks.map(v => new M.DashedLine({ start: [AX_L, sY(v), 0], end: [AX_R, sY(v), 0], color: v === 30 ? C.cyan : C.line }));
  const scYLabs = scTicks.map(v => {
    const t = T(String(v), P ? 18 : 17, v === 30 ? C.cyan : C.muted, true);
    t.moveTo([AX_L - (P ? 0.4 : 0.36), sY(v), 0]);
    return t;
  });
  const scUnit = T('mean', P ? 16 : 15, C.muted);
  scUnit.moveTo([AX_L - 0.36, Y_TOP + 0.30, 0]);
  const scTrueTag = miniTag('TRUE 30', C.cyan);
  scTrueTag.moveTo([AX_L + (P ? 0.95 : 1.05), sY(30) + 0.36, 0]);

  const xStops = [[0.08, '5'], [0.38, '100'], [0.70, '1,000']];
  const scXTicks = xStops.map(([f, lab]) => new M.VGroup(
    new M.Line({ start: [sX(f), Y_BOT - 0.08, 0], end: [sX(f), Y_BOT + 0.08, 0], color: C.muted }),
    T(lab, P ? 18 : 17, C.muted, true).moveTo([sX(f), LAB_Y, 0])
  ));
  const scXTitle = T('students', P ? 17 : 16, C.muted);
  scXTitle.moveTo([CX, ERR_Y, 0]);

  const startDotG = new M.Dot({ point: [sX(0.08), sY(30), 0], radius: 0.095, color: C.green });
  const startDotP = new M.Dot({ point: [sX(0.08), sY(27), 0], radius: 0.095, color: C.pink });

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(
      yAxis, xAxis, ...gridLines, ...yLabels, minUnit, ...sLabels,
      ...trueBars, ...trueDots, ...trueNums, trueMeanLine, trueMeanTag, ...refTicks,
      ...r2Dots, ...r2Nums, ...r2Arrows, ...r2Errs, s2MeanLine, s2MeanTag, s2GapArrow, s2GapLabel
    )),
    new M.Create(scYAxis),
    new M.Create(scXAxis),
    ...scGrids.map(g => new M.FadeIn(g)),
    ...scYLabs.map(t => new M.FadeIn(t)),
    new M.FadeIn(scUnit),
    new M.FadeIn(scTrueTag),
    ...scXTicks.map(t => new M.FadeIn(t)),
    new M.FadeIn(scXTitle),
    new M.FadeIn(startDotG),
    new M.FadeIn(startDotP),
    ...fbox(['add more students', 'n = 5  →  100  →  1,000'], C.cyan),
    ...say('MORE STUDENTS: 5 → 100 → 1,000', C.cyan)
  );

  // Story 1 path (green): stays near 30
  const gPts = [[0.08, 30.0], [0.23, 29.4], [0.38, 30.3], [0.54, 29.85], [0.70, 30.05]];
  const gSegs = [];
  for (let i = 0; i < gPts.length - 1; i++) {
    gSegs.push(new M.Line({
      start: [sX(gPts[i][0]), sY(gPts[i][1]), 0],
      end: [sX(gPts[i + 1][0]), sY(gPts[i + 1][1]), 0],
      color: C.green, strokeWidth: 3.5
    }));
  }
  const gDot100 = new M.Dot({ point: [sX(0.38), sY(30.3), 0], radius: 0.09, color: C.green });
  const gDot1k = new M.Dot({ point: [sX(0.70), sY(30.05), 0], radius: 0.11, color: C.green });
  const gLab = T('random noise ≈ 30', P ? 19 : 17, C.green, true);
  gLab.moveTo([sX(0.54), sY(30) + (P ? 0.58 : 0.46), 0]);

  await until(S(32));
  await play(
    new M.LaggedStart([...gSegs.map(l => new M.Create(l)), new M.FadeIn(gDot100), new M.FadeIn(gDot1k), new M.FadeIn(gLab)], { lagRatio: 0.2, runTime: 2.0 }),
    ...fbox([['story 1: random noise', C.green], 'n = 100   → mean ≈ 30', 'n = 1,000 → mean ≈ 30'], C.green),
    ...say('RANDOM NOISE STAYS NEAR 30', C.green)
  );

  // Story 2 path (pink): stays stuck near 27
  const pPts = [[0.08, 27.0], [0.23, 27.35], [0.38, 26.85], [0.54, 27.15], [0.70, 27.0]];
  const pSegs = [];
  for (let i = 0; i < pPts.length - 1; i++) {
    pSegs.push(new M.Line({
      start: [sX(pPts[i][0]), sY(pPts[i][1]), 0],
      end: [sX(pPts[i + 1][0]), sY(pPts[i + 1][1]), 0],
      color: C.pink, strokeWidth: 3.5
    }));
  }
  const pDot100 = new M.Dot({ point: [sX(0.38), sY(26.85), 0], radius: 0.09, color: C.pink });
  const pDot1k = new M.Dot({ point: [sX(0.70), sY(27.0), 0], radius: 0.11, color: C.pink });
  const pLab = T('round down ≈ 27', P ? 19 : 17, C.pink, true);
  pLab.moveTo([sX(0.46), sY(27) - (P ? 0.56 : 0.44), 0]);
  const scGapArr = vArrow(sX(0.70), sY(30), sY(27), C.pink);
  const scGapTxt = T('−3', P ? 20 : 18, C.pink, true);
  scGapTxt.moveTo([sX(0.70) + 0.34, (sY(30) + sY(27)) / 2, 0]);

  await until(S(33));
  await play(
    new M.LaggedStart([...pSegs.map(l => new M.Create(l)), new M.FadeIn(pDot100), new M.FadeIn(pDot1k), new M.FadeIn(pLab), new M.FadeIn(scGapArr), new M.FadeIn(scGapTxt)], { lagRatio: 0.16, runTime: 2.2 }),
    ...fbox([['story 2: round down', C.pink], 'n = 100   → mean ≈ 27', 'n = 1,000 → mean ≈ 27'], C.pink),
    ...say('SYSTEMATIC STAYS NEAR 27', C.pink)
  );

  await until(S(34));
  await play(
    new M.Indicate(gDot1k, { color: C.green }),
    new M.Indicate(scGapTxt, { color: C.pink }),
    ...fbox(['more people:', ['✓ fixes random noise', C.green], ['✗ never fixes a push', C.pink]], C.amber),
    ...say('FIXES NOISE, NOT A PUSH', C.amber)
  );

  // 35-37: The one-line formula
  await until(S(35));
  await play(...say('THE IDEA IN ONE LINE', C.cyan));

  await until(S(36));
  await play(
    ...fbox([['recorded = true + error', C.amber]], C.cyan),
    ...say('RECORDED = TRUE + ERROR', C.amber)
  );

  await until(S(37));
  await play(
    new M.LaggedStart([new M.Indicate(gLab, { color: C.green }), new M.Indicate(pLab, { color: C.pink })], { lagRatio: 0.4, runTime: 1.6 }),
    ...fbox([['recorded = true + error', C.amber], ['both ways → cancels', C.green], ['one way   → stays', C.pink]], C.amber),
    ...say('WHICH WAY DO MISTAKES POINT?', C.amber)
  );

  // 38-40: What it is for & how to fight systematic error
  await until(S(38));
  await play(
    ...fbox([['will more data help?', C.cyan], ['noise      → yes', C.green], ['systematic → no', C.pink]], C.cyan),
    ...say('WILL MORE DATA HELP?', C.cyan)
  );

  await until(S(39));
  await play(
    ...fbox([['fight systematic error:', C.green], 'measure better'], C.green),
    ...say('FIX BIAS: MEASURE BETTER', C.green)
  );

  await until(S(40));
  await play(
    new M.Indicate(scTrueTag, { color: C.cyan }),
    new M.Indicate(scGrids[2], { color: C.cyan }),
    ...fbox([['measure better:', C.cyan], ['✓ exact time on phone', C.green], ['✗ guess from memory', C.pink]], C.cyan),
    ...say('PHONE GPS > MEMORY GUESS', C.cyan)
  );

  // 41-42: Common trap — a million rounded-down answers
  await until(S(41));
  await play(
    ...fbox([['common trap:', C.pink], 'huge survey ≠ accurate'], C.pink),
    ...say('TRAP: BIG SURVEY ≠ ACCURATE', C.pink)
  );

  const seg1M = new M.DashedLine({ start: [sX(0.70), sY(27.0), 0], end: [sX(0.93), sY(27.0), 0], color: C.pink });
  const tick1M = new M.VGroup(
    new M.Line({ start: [sX(0.93), Y_BOT - 0.08, 0], end: [sX(0.93), Y_BOT + 0.08, 0], color: C.pink }),
    T('1M', P ? 18 : 17, C.pink, true).moveTo([sX(0.93), LAB_Y, 0])
  );
  const halo1M = new M.Dot({ point: [sX(0.93), sY(27.0), 0], radius: 0.24, color: C.pink }); halo1M.setFill(C.pink, 0.22);
  const dot1M = new M.Dot({ point: [sX(0.93), sY(27.0), 0], radius: 0.12, color: C.pink });
  const lab1M = T('27', P ? 20 : 18, C.pink, true);
  lab1M.moveTo([sX(0.93), sY(27.0) - 0.36, 0]);

  await until(S(42));
  await play(
    new M.Create(seg1M),
    new M.FadeIn(tick1M),
    new M.FadeIn(halo1M),
    new M.FadeIn(dot1M),
    new M.FadeIn(lab1M),
    new M.Flash(dot1M, { color: C.pink }),
    ...fbox([['n = 1,000,000', C.pink], 'still stuck near 27!'], C.pink),
    ...say('1,000,000 ANSWERS → STILL 27', C.pink)
  );

  // 43-44: Bridge to next lesson & one-sentence recap
  await until(S(43));
  await play(
    ...fbox([['next lesson:', C.violet], 'what numbers can prove', 'and what they cannot'], C.violet),
    ...say('NEXT: WHAT CAN NUMBERS PROVE?', C.violet)
  );

  await until(S(44));
  await play(
    new M.Indicate(gDot1k, { color: C.green }),
    new M.Indicate(dot1M, { color: C.pink }),
    ...fbox([['random errors:', C.green], '  cancel with more people', ['systematic errors:', C.pink], '  push one way and stay'], C.amber),
    ...say('RANDOM CANCELS · BIAS STAYS', C.amber)
  );
}

// 10.1.2 Slope and intercept (live manim-web lesson).
// Beat i = sentence i (0-based, 41 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 10.1 dataset: 12 apartments (Buildings X, Y, Z) and 4 mean rents
  const APTS = [
    { a: 40, r: 860, c: C.cyan, dx: 0 },
    { a: 40, r: 770, c: C.amber, dx: -3.6 },
    { a: 40, r: 770, c: C.pink, dx: 3.6 },
    { a: 60, r: 1040, c: C.cyan, dx: -3.6 },
    { a: 60, r: 1020, c: C.amber, dx: 3.6 },
    { a: 60, r: 940, c: C.pink, dx: 0 },
    { a: 80, r: 1250, c: C.cyan, dx: 0 },
    { a: 80, r: 1210, c: C.amber, dx: 3.6 },
    { a: 80, r: 1140, c: C.pink, dx: 0 },
    { a: 100, r: 1470, c: C.cyan, dx: 0 },
    { a: 100, r: 1380, c: C.amber, dx: -3.6 },
    { a: 100, r: 1350, c: C.pink, dx: 3.6 }
  ];
  const MEANS = [
    { a: 40, r: 800 },
    { a: 60, r: 1000 },
    { a: 80, r: 1200 },
    { a: 100, r: 1400 }
  ];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const X0 = P ? -2.45 : -5.45, X1 = P ? 3.55 : 1.75;
  const Y0 = P ? -4.25 : -2.35, Y1 = P ? 0.85 : 1.30;
  const AMAX = 108, RMAX = 1600;
  const a2x = a => X0 + (a / AMAX) * (X1 - X0);
  const r2y = r => Y0 + (r / RMAX) * (Y1 - Y0);
  const pt = (a, r) => [a2x(a), r2y(r), 0];

  const PILL = P ? [0, 1.85, 0] : [-1.85, 1.98, 0];
  const BOXP = P ? [0, 3.40, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one at a time, auto-fits width, <= 3 lines so it stays inside safe bounds
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.40;
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
    const maxw = P ? FW - 0.9 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Geometric 5-point star centered exactly at p
  function makeStar(p, outer = P ? 0.17 : 0.16, color = C.ink) {
    const inner = outer * 0.42;
    const pts = Array.from({ length: 10 }, (_, k) => {
      const r = k % 2 === 0 ? outer : inner;
      const a = Math.PI / 2 + k * Math.PI / 5;
      return [p[0] + r * Math.cos(a), p[1] + r * Math.sin(a), 0];
    });
    const halo = new M.Dot({ point: p, radius: outer * 1.45, color });
    halo.setFill(color, 0.16);
    const core = new M.Dot({ point: p, radius: inner * 1.05, color });
    core.setFill(color, 0.95);
    const rays = [];
    for (let k = 0; k < 10; k++) {
      rays.push(new M.Line({ start: pts[k], end: pts[(k + 1) % 10], color, strokeWidth: 2.2 }));
    }
    for (let k = 0; k < 10; k += 2) {
      rays.push(new M.Line({ start: p, end: pts[k], color, strokeWidth: 2.0 }));
    }
    return new M.VGroup(halo, core, ...rays);
  }

  function makeStep(a1, r1, a2, r2, runCol = C.cyan, riseCol = C.amber) {
    const run = new M.Arrow({ start: pt(a1, r1), end: pt(a2, r1), color: runCol, strokeWidth: 2.6 });
    const rise = new M.Arrow({ start: pt(a2, r1), end: pt(a2, r2), color: riseCol, strokeWidth: 2.6 });
    return { run, rise };
  }

  function makeWalker(p, color = C.amber) {
    const d = new M.Dot({ point: p, radius: P ? 0.11 : 0.10, color });
    d.setFill(color, 1);
    return d;
  }

  // Build static scatter-plot frame (axes, grid, ticks, legend)
  const gridLines = [];
  for (const a of [20, 40, 60, 80, 100]) {
    const gl = new M.Line({ start: pt(a, 0), end: pt(a, RMAX), color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.38);
    gridLines.push(gl);
  }
  for (const r of [400, 800, 1200, 1600]) {
    const gl = new M.Line({ start: pt(0, r), end: pt(AMAX, r), color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.38);
    gridLines.push(gl);
  }
  const xAxis = new M.Line({ start: pt(0, 0), end: pt(AMAX, 0), color: C.muted, strokeWidth: 2.5 });
  const yAxis = new M.Line({ start: pt(0, 0), end: pt(0, RMAX), color: C.muted, strokeWidth: 2.5 });

  const xTicks = [0, 20, 40, 60, 80, 100].map(a => new M.VGroup(
    new M.Line({ start: [a2x(a), Y0 - 0.07, 0], end: [a2x(a), Y0 + 0.07, 0], color: C.muted, strokeWidth: 2 }),
    T(String(a), P ? 17 : 16, C.muted, true).moveTo([a2x(a), Y0 - (P ? 0.30 : 0.26), 0])
  ));
  const yTicks = [0, 400, 800, 1200, 1600].map(r => new M.VGroup(
    new M.Line({ start: [X0 - 0.07, r2y(r), 0], end: [X0 + 0.07, r2y(r), 0], color: C.muted, strokeWidth: 2 }),
    T(String(r), P ? 16 : 15, C.muted, true).moveTo([X0 - (P ? 0.56 : 0.52), r2y(r), 0])
  ));
  const xTitle = T('area (m²)', P ? 16 : 17, C.muted);
  xTitle.moveTo([(X0 + X1) / 2, Y0 - (P ? 0.66 : 0.56), 0]);
  const yTitle = T('rent ($)', P ? 16 : 17, C.muted);
  yTitle.moveTo([X0 - 0.08, Y1 + (P ? 0.28 : 0.24), 0]);

  // Compact legend placed cleanly outside the plot
  const legY = P ? -5.28 : 1.92, legCX = P ? 0 : 4.45;
  const legParts = [];
  [C.cyan, C.amber, C.pink].forEach((col, k) => {
    const d = new M.Dot({ point: [legCX - 1.75 + k * 0.17, legY, 0], radius: 0.07, color: col });
    d.setFill(col, 0.9);
    legParts.push(d);
  });
  const legA = T('1 dot = 1 apartment', P ? 16 : 15, C.muted);
  legA.moveTo([legCX - 1.30 + legA.getWidth() / 2, legY, 0]);
  legParts.push(legA);
  const legSx = legCX - 1.10 + legA.getWidth() + 0.25;
  legParts.push(makeStar([legSx, legY, 0], 0.10, C.ink));
  const legM = T('mean', P ? 16 : 15, C.ink);
  legM.moveTo([legSx + 0.20 + legM.getWidth() / 2, legY, 0]);
  legParts.push(legM);
  const legend = new M.VGroup(...legParts);
  const axesGroup = new M.VGroup(...gridLines, xAxis, yAxis, ...xTicks, ...yTicks, xTitle, yTitle, legend);

  // 12 apartment dots (kept individually so opacity can dim/brighten cleanly)
  const aptDots = APTS.map(d => {
    const dot = new M.Dot({ point: pt(d.a + d.dx, d.r), radius: P ? 0.072 : 0.068, color: d.c });
    dot.setFill(d.c, 0.85);
    return { dot, c: d.c };
  });
  const setAptsOpacity = op => {
    aptDots.forEach(({ dot, c }) => {
      dot.setFill(c, op);
      dot.setStrokeOpacity(op);
    });
  };

  // 4 mean stars
  const stars = MEANS.map(m => makeStar(pt(m.a, m.r)));

  // ==================== ACT 1 (0–3): 12 apartments, 4 stars, straight line ====================

  // 0: Here are our twelve apartments again, with the four stars for the mean rents.
  await until(S(0));
  await play(
    new M.FadeIn(axesGroup, { runTime: 0.8 }),
    new M.LaggedStart(aptDots.map(a => new M.FadeIn(a.dot)), { lagRatio: 0.05, runTime: 1.2 }),
    new M.LaggedStart(stars.map(st => new M.FadeIn(st)), { lagRatio: 0.16, runTime: 1.4 }),
    ...say('12 APARTMENTS · 4 MEAN STARS', C.cyan)
  );

  // 1: The stars sit on a straight line.
  const lineData = new M.Line({ start: pt(40, 800), end: pt(100, 1400), color: C.ink, strokeWidth: 3.2 });
  await until(S(1));
  await play(
    new M.Create(lineData, { runTime: 1.0 }),
    new M.LaggedStart(stars.map(st => new M.Indicate(st, { color: C.ink })), { lagRatio: 0.12, runTime: 1.1 }),
    ...say('THE STARS SIT ON A STRAIGHT LINE', C.ink)
  );

  // 2: Can we describe that whole line with only two numbers?
  setAptsOpacity(0.35);
  await until(S(2));
  await play(
    ...fbox(['Describe the whole line:', ['Number 1 =  ?', C.amber], ['Number 2 =  ?', C.green]], C.violet),
    ...say('ONLY TWO NUMBERS FOR THE LINE?', C.violet)
  );

  // 3: Let's walk along it.
  const walker = makeWalker(pt(40, 800), C.amber);
  await until(S(3));
  await play(
    new M.FadeIn(walker, { runTime: 0.6 }),
    new M.Flash(stars[0].submobjects[1], { color: C.amber, runTime: 0.7 }),
    ...say('WALK ALONG THE LINE', C.amber)
  );

  // ==================== ACT 2 (4–13): Walking forward — Slope = $10 per m² ====================

  // 4: From forty to sixty square metres, the mean rent goes from eight hundred to one thousand dollars.
  const tag40 = T('(40, $800)', P ? 16 : 15, C.ink, true); tag40.moveTo(pt(24, 860));
  const tag60 = T('(60, $1000)', P ? 16 : 15, C.ink, true); tag60.moveTo(pt(42, 1140));
  await until(S(4));
  await play(
    new M.Transform(walker, makeWalker(pt(60, 1000), C.amber), { runTime: 1.2 }),
    new M.FadeIn(tag40), new M.FadeIn(tag60),
    new M.Flash(stars[1].submobjects[1], { color: C.amber, runTime: 0.9 }),
    ...fbox(['40 m² → 60 m²', ['mean rent: $800 → $1,000', C.amber]], C.amber),
    ...say('40 → 60 m² : $800 → $1,000', C.amber)
  );

  // 5: That is two hundred dollars more for twenty more square metres.
  const step1 = makeStep(40, 800, 60, 1000);
  const s1RunLab = T('+20 m²', P ? 16 : 15, C.cyan, true); s1RunLab.moveTo(pt(50, 675));
  const s1RiseLab = T('+$200', P ? 16 : 15, C.amber, true); s1RiseLab.moveTo(pt(72, 900));
  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(tag40, tag60)),
    new M.Create(step1.run, { runTime: 0.8 }),
    new M.Create(step1.rise, { runTime: 0.8 }),
    new M.FadeIn(s1RunLab), new M.FadeIn(s1RiseLab),
    ...fbox(['area change:  +20 m²', ['rent change:  +$200', C.amber]], C.amber),
    ...say('+$200 FOR +20 m²', C.amber)
  );

  // 6: Share the two hundred dollars over the twenty square metres.
  await until(S(6));
  await play(
    new M.Indicate(step1.rise, { color: C.amber }),
    new M.Indicate(step1.run, { color: C.cyan }),
    ...fbox(['Share $200 over 20 m²', ['$200 ÷ 20 m²', C.amber]], C.amber),
    ...say('SHARE $200 OVER 20 m²', C.amber)
  );

  // 7: Each square metre gets ten dollars.
  await until(S(7));
  await play(
    ...fbox(['$200 ÷ 20 m²', ['= $10 per m²', C.green]], C.green),
    ...say('EACH m² GETS $10', C.green)
  );

  // 8: Check the next step. From sixty to eighty, one thousand becomes one thousand two hundred.
  const step2 = makeStep(60, 1000, 80, 1200);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(s1RunLab, s1RiseLab)),
    new M.Transform(walker, makeWalker(pt(80, 1200), C.amber), { runTime: 1.1 }),
    new M.Create(step2.run, { runTime: 0.9 }),
    new M.Create(step2.rise, { runTime: 0.9 }),
    new M.Flash(stars[2].submobjects[1], { color: C.amber, runTime: 0.9 }),
    ...fbox(['Next step: 60 → 80 m²', ['mean rent: $1,000 → $1,200', C.amber]], C.amber),
    ...say('60 → 80 m² : $1,000 → $1,200', C.amber)
  );

  // 9: Again, two hundred dollars over twenty square metres: ten dollars per square metre.
  const s2RunLab = T('+20 m²', P ? 16 : 15, C.cyan, true); s2RunLab.moveTo(pt(70, 875));
  const s2RiseLab = T('+$200', P ? 16 : 15, C.amber, true); s2RiseLab.moveTo(pt(92, 1100));
  await until(S(9));
  await play(
    new M.FadeIn(s2RunLab), new M.FadeIn(s2RiseLab),
    ...fbox(['$200 ÷ 20 m²', ['= $10 per m²  (same!)', C.green]], C.green),
    ...say('AGAIN: $200 ÷ 20 = $10 / m²', C.green)
  );

  // 10: On a straight line, every step gives the same rise.
  const step3 = makeStep(80, 1200, 100, 1400);
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(s2RunLab, s2RiseLab)),
    new M.Create(step3.run, { runTime: 0.8 }),
    new M.Create(step3.rise, { runTime: 0.8 }),
    new M.Indicate(step1.rise, { color: C.amber }),
    new M.Indicate(step2.rise, { color: C.amber }),
    ...fbox(['Every +20 m² step:', ['same rise = +$200', C.amber]], C.amber),
    ...say('EVERY STEP GIVES THE SAME RISE', C.amber)
  );

  // 11: The rise in rent for one extra square metre is called the slope.
  await until(S(11));
  await play(
    new M.Indicate(step1.rise, { color: C.amber }),
    new M.Indicate(step2.rise, { color: C.amber }),
    new M.Indicate(step3.rise, { color: C.amber }),
    ...fbox([['SLOPE', C.amber], 'rise in rent for', '1 extra square metre'], C.amber),
    ...say('SLOPE = RISE PER 1 EXTRA m²', C.amber)
  );

  // 12: Our slope is ten dollars per square metre.
  await until(S(12));
  await play(
    ...fbox([['slope = $10 per m²', C.amber], '$200 ÷ 20 m² = $10'], C.amber),
    ...say('SLOPE = $10 PER m²', C.amber)
  );

  // 13: Said another way: every extra ten square metres adds one hundred dollars to the mean rent.
  const step10 = makeStep(60, 1000, 70, 1100, C.cyan, C.green);
  const s10RunLab = T('+10 m²', P ? 16 : 15, C.cyan, true); s10RunLab.moveTo(pt(65, 875));
  const s10RiseLab = T('+$100', P ? 16 : 15, C.green, true); s10RiseLab.moveTo(pt(83, 1050));
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(step1.run, step1.rise, step2.run, step2.rise, step3.run, step3.rise)),
    new M.Create(step10.run, { runTime: 0.8 }),
    new M.Create(step10.rise, { runTime: 0.8 }),
    new M.FadeIn(s10RunLab), new M.FadeIn(s10RiseLab),
    ...fbox([['slope = $10 per m²', C.amber], ['+10 m² → +$100 rent', C.green]], C.green),
    ...say('+10 m² ADDS +$100', C.green)
  );

  // ==================== ACT 3 (14–24): Walking backwards — Intercept = $400 ====================

  // 14: Now let's walk backwards, toward an area of zero.
  const backDir = new M.Arrow({ start: pt(38, 180), end: pt(3, 180), color: C.violet, strokeWidth: 2.5 });
  const backDirLab = T('toward 0 m²', P ? 16 : 15, C.violet); backDirLab.moveTo(pt(21, 290));
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(step10.run, step10.rise, s10RunLab, s10RiseLab)),
    new M.Transform(walker, makeWalker(pt(40, 800), C.violet), { runTime: 0.9 }),
    new M.Create(backDir, { runTime: 0.8 }), new M.FadeIn(backDirLab),
    ...fbox(['Walk backwards', ['toward area = 0 m²', C.violet]], C.violet),
    ...say('WALK BACKWARDS TOWARD 0 m²', C.violet)
  );

  // 15: Start at forty square metres and eight hundred dollars.
  let stepTag = T('40 m²: $800', P ? 16 : 15, C.ink, true); stepTag.moveTo(pt(22, 920));
  await until(S(15));
  await play(
    new M.FadeIn(stepTag),
    new M.Flash(stars[0].submobjects[1], { color: C.violet, runTime: 0.8 }),
    ...fbox(['Start:', ['40 m² → $800', C.ink]], C.violet),
    ...say('START: 40 m² · $800', C.ink)
  );

  // 16: Each step of ten square metres back takes away one hundred dollars.
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(backDir, backDirLab)),
    ...fbox(['40 m² → $800', ['−10 m² → −$100', C.violet]], C.violet),
    ...say('−10 m² TAKES AWAY −$100', C.violet)
  );

  // Helper for each backward step (40->30, 30->20, 20->10, 10->0)
  const extSegs = [], backStairs = [], backDots = [];
  function buildBackStep(aFrom, rFrom, aTo, rTo) {
    const seg = new M.DashedLine({ start: pt(aFrom, rFrom), end: pt(aTo, rTo), color: C.ink });
    const hLine = new M.Line({ start: pt(aFrom, rFrom), end: pt(aTo, rFrom), color: C.violet, strokeWidth: 2 });
    const vLine = new M.Line({ start: pt(aTo, rFrom), end: pt(aTo, rTo), color: C.violet, strokeWidth: 2 });
    const dot = new M.Dot({ point: pt(aTo, rTo), radius: 0.075, color: C.violet });
    dot.setFill(C.violet, 0.95);
    extSegs.push(seg);
    backStairs.push(hLine, vLine);
    if (aTo > 0) backDots.push(dot);
    return { seg, hLine, vLine, dot };
  }

  // 17: Thirty square metres: seven hundred.
  const b30 = buildBackStep(40, 800, 30, 700);
  const tag30 = T('30: $700', P ? 16 : 15, C.violet, true); tag30.moveTo(pt(16, 820));
  await until(S(17));
  await play(
    new M.FadeOut(stepTag, { runTime: 0.5 }),
    new M.Create(b30.seg, { runTime: 0.65 }),
    new M.Create(b30.hLine, { runTime: 0.65 }), new M.Create(b30.vLine, { runTime: 0.65 }),
    new M.FadeIn(b30.dot, { runTime: 0.5 }), new M.FadeIn(tag30, { runTime: 0.5 }),
    new M.Transform(walker, makeWalker(pt(30, 700), C.violet), { runTime: 0.65 }),
    ...fbox(['40 m² → $800', ['30 m² → $700', C.violet]], C.violet),
    ...say('30 m² → $700', C.violet)
  );
  stepTag = tag30;

  // 18: Twenty: six hundred.
  const b20 = buildBackStep(30, 700, 20, 600);
  const tag20 = T('20: $600', P ? 16 : 15, C.violet, true); tag20.moveTo(pt(9, 645));
  await until(S(18));
  await play(
    new M.FadeOut(stepTag, { runTime: 0.45 }),
    new M.Create(b20.seg, { runTime: 0.6 }),
    new M.Create(b20.hLine, { runTime: 0.6 }), new M.Create(b20.vLine, { runTime: 0.6 }),
    new M.FadeIn(b20.dot, { runTime: 0.45 }), new M.FadeIn(tag20, { runTime: 0.45 }),
    new M.Transform(walker, makeWalker(pt(20, 600), C.violet), { runTime: 0.6 }),
    ...fbox(['40 m² → $800', '30 m² → $700', ['20 m² → $600', C.violet]], C.violet),
    ...say('20 m² → $600', C.violet)
  );
  stepTag = tag20;

  // 19: Ten: five hundred.
  const b10 = buildBackStep(20, 600, 10, 500);
  const tag10 = T('10: $500', P ? 16 : 15, C.violet, true); tag10.moveTo(pt(24, 415));
  await until(S(19));
  await play(
    new M.FadeOut(stepTag, { runTime: 0.45 }),
    new M.Create(b10.seg, { runTime: 0.6 }),
    new M.Create(b10.hLine, { runTime: 0.6 }), new M.Create(b10.vLine, { runTime: 0.6 }),
    new M.FadeIn(b10.dot, { runTime: 0.45 }), new M.FadeIn(tag10, { runTime: 0.45 }),
    new M.Transform(walker, makeWalker(pt(10, 500), C.violet), { runTime: 0.6 }),
    ...fbox(['30 m² → $700', '20 m² → $600', ['10 m² → $500', C.violet]], C.violet),
    ...say('10 m² → $500', C.violet)
  );
  stepTag = tag10;

  // 20: Zero: four hundred.
  const b0 = buildBackStep(10, 500, 0, 400);
  const intHalo = new M.Dot({ point: pt(0, 400), radius: 0.24, color: C.green });
  intHalo.setFill(C.green, 0.22);
  const intDot = new M.Dot({ point: pt(0, 400), radius: 0.12, color: C.green });
  intDot.setFill(C.green, 1);
  const tag0 = T('0: $400', P ? 17 : 16, C.green, true); tag0.moveTo(pt(15, 300));
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(stepTag, walker), { runTime: 0.45 }),
    new M.Create(b0.seg, { runTime: 0.6 }),
    new M.Create(b0.hLine, { runTime: 0.6 }), new M.Create(b0.vLine, { runTime: 0.6 }),
    new M.FadeIn(intHalo, { runTime: 0.5 }), new M.FadeIn(intDot, { runTime: 0.5 }),
    new M.Flash(intDot, { color: C.green, runTime: 0.65 }),
    new M.FadeIn(tag0, { runTime: 0.5 }),
    ...fbox(['20 m² → $600', '10 m² → $500', [' 0 m² → $400', C.green]], C.green),
    ...say('0 m² → $400', C.green)
  );

  // 21: The rent axis is the upright scale on the left, where the area is zero.
  const yAxisGlow = new M.Line({ start: pt(0, 0), end: pt(0, RMAX), color: C.green, strokeWidth: 4.5 });
  const area0Tag = T('area = 0', P ? 16 : 15, C.green, true); area0Tag.moveTo(pt(16, 115));
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(...backStairs, ...backDots, tag0)),
    new M.Create(yAxisGlow, { runTime: 1.0 }),
    new M.FadeIn(area0Tag),
    ...fbox(['Rent axis (left):', ['upright scale where', C.green], ['area = 0 m²', C.green]], C.green),
    ...say('RENT AXIS = WHERE AREA IS 0', C.green)
  );

  // 22: The place where the line meets the rent axis is called the intercept.
  const intArr = new M.Arrow({ start: pt(22, 230), end: pt(2.5, 382), color: C.green, strokeWidth: 2.5 });
  let intTag = T('intercept', P ? 17 : 16, C.green, true); intTag.moveTo(pt(29, 155));
  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(yAxisGlow, area0Tag)),
    new M.Create(intArr, { runTime: 0.8 }), new M.FadeIn(intTag),
    new M.Flash(intDot, { color: C.green, runTime: 0.9 }),
    ...fbox([['INTERCEPT', C.green], 'where the line meets', 'the rent axis (area = 0)'], C.green),
    ...say('INTERCEPT = WHERE LINE MEETS AXIS', C.green)
  );

  // 23: Our intercept is four hundred dollars.
  const intTag400 = T('intercept = $400', P ? 17 : 16, C.green, true); intTag400.moveTo(pt(33, 155));
  await until(S(23));
  await play(
    new M.FadeOut(intTag), new M.FadeIn(intTag400),
    new M.Indicate(intDot, { color: C.green }),
    ...fbox([['intercept = $400', C.green], '(at area = 0 m²)'], C.green),
    ...say('INTERCEPT = $400', C.green)
  );
  intTag = intTag400;

  // 24: The slope and the intercept are the two numbers of the line. They are called its coefficients.
  const coefStep = makeStep(60, 1000, 80, 1200);
  const coefLab = T('slope = $10/m²', P ? 16 : 15, C.amber, true); coefLab.moveTo(pt(80, 880));
  await until(S(24));
  await play(
    new M.Create(coefStep.run, { runTime: 0.8 }),
    new M.Create(coefStep.rise, { runTime: 0.8 }),
    new M.FadeIn(coefLab),
    new M.Indicate(intDot, { color: C.green }),
    ...fbox([['COEFFICIENTS (2 numbers)', C.cyan], ['slope     = $10 / m²', C.amber], ['intercept = $400', C.green]], C.cyan),
    ...say('SLOPE & INTERCEPT = COEFFICIENTS', C.cyan)
  );

  // ==================== ACT 4 (25–30): The formula & checking at 80 m² ====================

  // 25: Now the short version, called a formula.
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(coefStep.run, coefStep.rise, coefLab)),
    ...fbox(['The short version:', ['a formula', C.cyan]], C.cyan),
    ...say('SHORT VERSION = A FORMULA', C.cyan)
  );

  // 26: Mean rent equals four hundred, plus ten times the area.
  await until(S(26));
  await play(
    ...fbox([['mean rent = 400 + 10 × area', C.ink], ['intercept = $400', C.green], ['slope     = $10 per m²', C.amber]], C.cyan),
    ...say('RENT = 400 + 10 × AREA', C.cyan)
  );

  // 27: In words: start at four hundred dollars, then add ten dollars for every square metre.
  const sweep = makeWalker(pt(0, 400), C.amber);
  await until(S(27));
  await play(
    new M.Flash(intDot, { color: C.green, runTime: 0.8 }),
    new M.Transform(sweep, makeWalker(pt(100, 1400), C.amber), { runTime: 1.8 }),
    ...fbox(['In words:', ['start at $400', C.green], ['+ $10 for every m²', C.amber]], C.amber),
    ...say('START AT $400, ADD $10 PER m²', C.amber)
  );

  // 28: Let's check it at eighty square metres.
  const chkGuide = new M.DashedLine({ start: pt(80, 0), end: pt(80, 1200), color: C.cyan });
  const chk80Tag = T('80 m²', P ? 16 : 15, C.cyan, true); chk80Tag.moveTo(pt(89, 115));
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(sweep, intArr, intTag)),
    new M.Create(chkGuide, { runTime: 0.8 }), new M.FadeIn(chk80Tag),
    ...fbox(['Check at area = 80 m²:', ['400 + 10 × 80', C.cyan]], C.cyan),
    ...say('CHECK AT 80 m²', C.cyan)
  );

  // 29: Ten times eighty is eight hundred.
  const chkBaseH = new M.DashedLine({ start: pt(0, 400), end: pt(80, 400), color: C.green });
  const chkRise = new M.Arrow({ start: pt(80, 400), end: pt(80, 1200), color: C.amber, strokeWidth: 3 });
  const chkRiseLab = T('+$800', P ? 17 : 16, C.amber, true); chkRiseLab.moveTo(pt(93, 800));
  await until(S(29));
  await play(
    new M.Create(chkBaseH, { runTime: 0.7 }),
    new M.Create(chkRise, { runTime: 0.9 }),
    new M.FadeIn(chkRiseLab),
    ...fbox(['10 × 80 = 800', ['(+$800 above $400)', C.amber]], C.amber),
    ...say('10 × 80 = $800', C.amber)
  );

  // 30: Plus four hundred makes one thousand two hundred: the same as the star.
  const chkBase = new M.Arrow({ start: pt(80, 0), end: pt(80, 400), color: C.green, strokeWidth: 3 });
  const chkBaseLab = T('+$400', P ? 16 : 15, C.green, true); chkBaseLab.moveTo(pt(93, 210));
  const chkTopH = new M.DashedLine({ start: pt(80, 1200), end: pt(0, 1200), color: C.green });
  await until(S(30));
  await play(
    new M.FadeOut(chk80Tag),
    new M.Create(chkBase, { runTime: 0.8 }), new M.FadeIn(chkBaseLab),
    new M.Create(chkTopH, { runTime: 0.9 }),
    new M.Flash(stars[2].submobjects[1], { color: C.green, runTime: 1.0 }),
    ...fbox(['400 + 10 × 80', '= 400 + 800', ['= $1,200  (matches ★)', C.green]], C.green),
    ...say('400 + 800 = $1,200 = STAR ★', C.green)
  );

  // ==================== ACT 5 (31–33): What each number is for ====================

  // 31: What is each number for?
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(chkGuide, chkBaseH, chkRise, chkRiseLab, chkBase, chkBaseLab, chkTopH), { runTime: 0.6 }),
    ...fbox(['What is each number for?', ['1. slope ($10 / m²)', C.amber], ['2. intercept ($400)', C.green]], C.violet),
    ...say('WHAT IS EACH NUMBER FOR?', C.violet)
  );

  // 32: The slope answers: how much more rent, on average, for each extra square metre?
  const useSlope = makeStep(60, 1000, 80, 1200);
  const useSlopeLab = T('+$10 per m²', P ? 17 : 16, C.amber, true); useSlopeLab.moveTo(pt(78, 875));
  await until(S(32));
  await play(
    new M.Create(useSlope.run, { runTime: 0.8 }),
    new M.Create(useSlope.rise, { runTime: 0.8 }),
    new M.FadeIn(useSlopeLab),
    ...fbox([['SLOPE ($10 / m²)', C.amber], 'how much more mean rent', 'for each extra m²'], C.amber),
    ...say('SLOPE = EXTRA RENT PER m²', C.amber)
  );

  // 33: The intercept only fixes the height of the line, so the line lands on the stars.
  const ghostLine = new M.Line({ start: pt(0, 150), end: pt(100, 1150), color: C.green, strokeWidth: 3 });
  ghostLine.setStrokeOpacity(0.65);
  const landedLine = new M.Line({ start: pt(0, 400), end: pt(100, 1400), color: C.green, strokeWidth: 3 });
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(useSlope.run, useSlope.rise, useSlopeLab)),
    new M.Create(ghostLine, { runTime: 0.8 }),
    ...fbox([['INTERCEPT ($400)', C.green], 'fixes the height so', 'the line lands on the stars'], C.green),
    ...say('INTERCEPT FIXES LINE HEIGHT', C.green)
  );
  await play(
    new M.Transform(ghostLine, landedLine, { runTime: 1.4 }),
    new M.Flash(intDot, { color: C.green, runTime: 0.9 })
  );

  // ==================== ACT 6 (34–40): The trap, real dots, recap ====================

  // 34: Here is the trap. The intercept is not the rent of a tiny apartment.
  setAptsOpacity(0.85);
  const warnRing = new M.Circle({ radius: P ? 0.28 : 0.26, color: C.pink, strokeWidth: 3 });
  warnRing.moveTo(pt(0, 400));
  const warnArr = new M.Arrow({ start: pt(16, 1020), end: pt(2.5, 480), color: C.pink, strokeWidth: 2.5 });
  const warnLab = T('not a real apartment', P ? 16 : 15, C.pink, true); warnLab.moveTo(pt(23, 1150));
  await until(S(34));
  await play(
    new M.FadeOut(ghostLine),
    new M.Create(warnRing, { runTime: 0.8 }),
    new M.Create(warnArr, { runTime: 0.8 }),
    new M.FadeIn(warnLab),
    ...fbox([['TRAP', C.pink], 'Intercept ($400) is NOT', 'a tiny apartment’s rent'], C.pink),
    ...say('TRAP: NOT A TINY APARTMENT', C.pink)
  );

  // 35: No apartment has zero floor area, and our data only run from forty to one hundred square metres.
  const noDataW = a2x(40) - a2x(0), dataW = a2x(100) - a2x(40), plotH = Y1 - Y0;
  const noDataBand = new M.Rectangle({ width: noDataW, height: plotH, color: C.pink, strokeWidth: 1 });
  noDataBand.setFill(C.pink, 0.09); noDataBand.setStrokeOpacity(0.35);
  noDataBand.moveTo([(a2x(0) + a2x(40)) / 2, (Y0 + Y1) / 2, 0]);
  const dataBand = new M.Rectangle({ width: dataW, height: plotH, color: C.cyan, strokeWidth: 1 });
  dataBand.setFill(C.cyan, 0.07); dataBand.setStrokeOpacity(0.35);
  dataBand.moveTo([(a2x(40) + a2x(100)) / 2, (Y0 + Y1) / 2, 0]);
  const noDataLab = T('no data', P ? 16 : 15, C.pink, true); noDataLab.moveTo(pt(20, 115));
  const dataLab = T('our data: 40–100 m²', P ? 16 : 15, C.cyan, true); dataLab.moveTo(pt(70, 115));
  await until(S(35));
  await play(
    new M.FadeIn(noDataBand), new M.FadeIn(dataBand),
    new M.FadeIn(noDataLab), new M.FadeIn(dataLab),
    ...fbox(['No apartment has 0 m²', ['data range: 40 to 100 m²', C.cyan]], C.pink),
    ...say('DATA ONLY RUN 40 TO 100 m²', C.pink)
  );

  // 36: So four hundred dollars is a point on the drawing, not a real price.
  await until(S(36));
  await play(
    new M.Indicate(warnRing, { color: C.pink }),
    ...fbox(['$400 at 0 m²:', ['a point on the drawing,', C.pink], ['not a real price', C.pink]], C.pink),
    ...say('$400 = DRAWING POINT, NOT PRICE', C.pink)
  );

  // 37: Reading a line far outside the data is risky. The straight pattern may not hold there.
  const bendPts = [[40, 800], [26, 610], [13, 360], [0, 140]];
  const bendSegs = [0, 1, 2].map(k => new M.DashedLine({
    start: pt(bendPts[k][0], bendPts[k][1]),
    end: pt(bendPts[k + 1][0], bendPts[k + 1][1]),
    color: C.pink
  }));
  const qMark = T('?', P ? 24 : 26, C.pink, true); qMark.moveTo(pt(14, 520));
  await until(S(37));
  await play(
    new M.LaggedStart(bendSegs.map(seg => new M.Create(seg)), { lagRatio: 0.25, runTime: 1.2 }),
    new M.FadeIn(qMark),
    ...fbox([['Outside the data:', C.pink], 'straight pattern may', 'not hold there'], C.pink),
    ...say('OUTSIDE THE DATA IS RISKY', C.pink)
  );

  // 38: Real dots rarely line up so neatly.
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(warnRing, warnArr, warnLab, noDataBand, dataBand, noDataLab, dataLab, ...bendSegs, qMark)),
    new M.LaggedStart(aptDots.map(a => new M.Indicate(a.dot, { color: a.c })), { lagRatio: 0.06, runTime: 1.3 }),
    ...fbox(['Real data:', ['dots scatter around a line', C.cyan]], C.cyan),
    ...say('REAL DOTS RARELY LINE UP NEATLY', C.cyan)
  );

  // 39: In lesson four, you will see how the two numbers are found then.
  await until(S(39));
  await play(
    new M.Indicate(lineData, { color: C.ink }),
    ...fbox(['Coming in Lesson 4:', ['finding slope & intercept', C.amber], ['from noisy data', C.green]], C.violet),
    ...say('LESSON 4: FITTING NOISY DATA', C.violet)
  );

  // 40: In one sentence: the slope is the rent added per square metre; the intercept is where the line starts.
  const endStep = makeStep(60, 1000, 80, 1200);
  const endSlopeLab = T('+$10 / m²', P ? 17 : 16, C.amber, true); endSlopeLab.moveTo(pt(78, 875));
  const endIntLab = T('$400', P ? 17 : 16, C.green, true); endIntLab.moveTo(pt(12, 310));
  await until(S(40));
  await play(
    new M.Create(endStep.run, { runTime: 0.9 }),
    new M.Create(endStep.rise, { runTime: 0.9 }),
    new M.FadeIn(endSlopeLab), new M.FadeIn(endIntLab),
    new M.Flash(intDot, { color: C.green, runTime: 1.0 }),
    ...fbox([['rent = 400 + 10 × area', C.ink], ['slope     = +$10 per m²', C.amber], ['intercept = $400 at 0 m²', C.green]], C.green),
    ...say('SLOPE = +$10/m² · INTERCEPT = $400', C.green)
  );
}

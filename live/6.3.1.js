// 6.3.1 Priors: belief before data (live manim-web lesson).
// Beat i = sentence i (0-based, 0..41). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const RATES = [10, 20, 30, 40, 50];
  const PRIOR = [10, 30, 30, 20, 10];
  const POST  = [3, 30, 40, 21, 6];

  // Layout constants: portrait phone (8 x 14.22, y in [-5.5, 4.3]) & laptop (14.22 x 8, y in [-3.0, 2.3])
  const CX = P ? 0 : -2.35;
  const SP = P ? 1.38 : 1.45;
  const BW = P ? 0.88 : 0.90;
  const BASE = P ? -3.85 : -2.05;
  const UNIT = P ? 0.105 : 0.072;
  const PILL = P ? [0, 1.65, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.35, -0.35, 0];

  const colx = k => CX + (k - 2) * SP;
  const rateX = pct => colx(0) + ((pct - 10) / 10) * SP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box on screen at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.4;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Helpers: charger icon ("part"), crisp line-based arrow, padlock icon, bar builder
  function charger(x, y, color = C.cyan, sc = 1) {
    const body = new M.RoundedRectangle({ width: 0.44 * sc, height: 0.52 * sc, cornerRadius: 0.08 * sc, color, strokeWidth: 2 });
    body.setFill(color, 0.28); body.moveTo([x, y, 0]);
    const p1 = new M.Rectangle({ width: 0.06 * sc, height: 0.17 * sc, color, strokeWidth: 1.5 });
    p1.setFill(color, 0.9); p1.moveTo([x - 0.11 * sc, y + 0.345 * sc, 0]);
    const p2 = new M.Rectangle({ width: 0.06 * sc, height: 0.17 * sc, color, strokeWidth: 1.5 });
    p2.setFill(color, 0.9); p2.moveTo([x + 0.11 * sc, y + 0.345 * sc, 0]);
    const cord = new M.Line({ start: [x, y - 0.26 * sc, 0], end: [x, y - 0.46 * sc, 0], color, strokeWidth: 2.5 });
    return new M.VGroup(body, p1, p2, cord);
  }

  function makeArrow(p1, p2, color = C.muted, sw = 2.5) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, hs = 0.16;
    const shaft = new M.Line({ start: p1, end: p2, color, strokeWidth: sw });
    const a1 = new M.Line({ start: p2, end: [p2[0] - hs * (ux * 0.85 - uy * 0.52), p2[1] - hs * (uy * 0.85 + ux * 0.52), 0], color, strokeWidth: sw });
    const a2 = new M.Line({ start: p2, end: [p2[0] - hs * (ux * 0.85 + uy * 0.52), p2[1] - hs * (uy * 0.85 - ux * 0.52), 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, a1, a2);
  }

  function makePadlock(x, y, color = C.pink) {
    const body = new M.RoundedRectangle({ width: 0.46, height: 0.38, cornerRadius: 0.07, color, strokeWidth: 2.5 });
    body.setFill(C.card, 0.95); body.moveTo([x, y - 0.10, 0]);
    const shackle = new M.Arc({ radius: 0.15, startAngle: 0, angle: Math.PI, color, strokeWidth: 2.5 });
    shackle.moveTo([x, y + 0.16, 0]);
    const hole = new M.Dot({ point: [x, y - 0.10, 0], radius: 0.05, color });
    return new M.VGroup(shackle, body, hole);
  }

  function makeBar(k, val, color = C.cyan) {
    const h = val <= 0 ? 0.04 : val * UNIT;
    const b = new M.Rectangle({ width: BW, height: h, color, strokeWidth: 2 });
    b.setFill(color, val <= 0 ? 0.95 : 0.82);
    b.moveTo([colx(k), BASE + h / 2, 0]);
    return b;
  }

  function topLabel(k, val, text, color = C.cyan) {
    const h = val <= 0 ? 0.04 : val * UNIT;
    const t = T(text, P ? 17 : 18, color, true, true);
    t.moveTo([colx(k), BASE + h + (P ? 0.32 : 0.27), 0]);
    return t;
  }

  // --- ACT 1: REPAIR SHOP & THE QUESTION (Beats 0-7) ---

  // 0: small repair shop fixing used phone chargers
  const shopRow = Array.from({ length: 5 }, (_, k) =>
    charger((k - 2) * (P ? 1.25 : 1.55), P ? -1.1 : -0.4, C.cyan, P ? 1.0 : 1.15));
  await until(S(0));
  await play(new M.LaggedStart(shopRow.map(c => new M.FadeIn(c)), { lagRatio: 0.14, runTime: 1.5 }),
    ...say('REPAIR SHOP · PHONE CHARGERS'));

  // 1: each fixed charger ("a part") goes through an inspection
  const IX = P ? 0 : -2.2, IY = P ? -1.4 : -0.4;
  const partPos = P ? [0, 0.25, 0] : [IX - 3.0, IY, 0];
  const boxPos = P ? [0, -1.45, 0] : [IX - 0.25, IY, 0];
  const onePart = charger(partPos[0], partPos[1], C.cyan, P ? 1.0 : 1.05);
  const partTag = T('part', 18, C.cyan, true, true);
  partTag.moveTo(P ? [0.85, 0.25, 0] : [partPos[0], partPos[1] - 0.72, 0]);
  const arrIn = makeArrow(
    P ? [0, -0.32, 0] : [partPos[0] + 0.55, IY, 0],
    P ? [0, -0.92, 0] : [boxPos[0] - 1.22, IY, 0], C.cyan);
  const inspRect = new M.RoundedRectangle({ width: P ? 2.8 : 2.3, height: 0.95, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  inspRect.setFill(C.card, 0.95); inspRect.moveTo(boxPos);
  const inspTxt = T('INSPECTION', P ? 19 : 18, C.ink, true, true); inspTxt.moveTo(boxPos);
  const inspBox = new M.VGroup(inspRect, inspTxt);

  await until(S(1));
  await play(new M.FadeOut(new M.VGroup(...shopRow)),
    new M.FadeIn(onePart), new M.FadeIn(partTag), new M.FadeIn(arrIn), new M.FadeIn(inspBox),
    ...say('EACH CHARGER = 1 PART'));

  // 2: two outcomes: pass or fail
  const passPos = P ? [-1.75, -3.25, 0] : [IX + 2.65, IY + 0.85, 0];
  const failPos = P ? [1.75, -3.25, 0] : [IX + 2.65, IY - 0.85, 0];
  const arrPass = makeArrow(
    P ? [-0.6, -1.96, 0] : [boxPos[0] + 1.20, IY + 0.22, 0],
    P ? [-1.5, -2.55, 0] : [passPos[0] - 0.55, passPos[1], 0], C.green);
  const arrFail = makeArrow(
    P ? [0.6, -1.96, 0] : [boxPos[0] + 1.20, IY - 0.22, 0],
    P ? [1.5, -2.55, 0] : [failPos[0] - 0.55, failPos[1], 0], C.pink);
  const passIcon = charger(passPos[0], passPos[1], C.green, 0.95);
  const passLab = T('PASS ✓', 18, C.green, true, true);
  passLab.moveTo(P ? [passPos[0], passPos[1] - 0.78, 0] : [passPos[0] + 0.95, passPos[1], 0]);
  const passG = new M.VGroup(passIcon, passLab);
  const failIcon = charger(failPos[0], failPos[1], C.pink, 0.95);
  const failLab = T('FAIL ✕', 18, C.pink, true, true);
  failLab.moveTo(P ? [failPos[0], failPos[1] - 0.78, 0] : [failPos[0] + 0.95, failPos[1], 0]);
  const failG = new M.VGroup(failIcon, failLab);

  await until(S(2));
  await play(new M.FadeIn(arrPass), new M.FadeIn(passG), new M.FadeIn(arrFail), new M.FadeIn(failG),
    ...say('TWO OUTCOMES: PASS OR FAIL', C.amber));

  // 3: what share of our parts fail?
  await until(S(3));
  await play(new M.Indicate(failG, { color: C.pink, runTime: 1.4 }),
    ...say('WHAT SHARE OF PARTS FAIL?', C.pink));

  // 4: failure rate
  await until(S(4));
  await play(...fbox(['failure rate =', ['long-run share', C.amber], ['that fail', C.pink]], C.cyan),
    ...say('FAILURE RATE = LONG-RUN SHARE', C.cyan));

  // 5: unknown number
  const qPos = [0, P ? -1.4 : -0.45, 0];
  const qBox = new M.RoundedRectangle({ width: 3.1, height: 1.45, cornerRadius: 0.22, color: C.amber, strokeWidth: 2.5 });
  qBox.setFill(C.card, 0.95); qBox.moveTo(qPos);
  const qSym = T('? %', 46, C.amber, true, true); qSym.moveTo([qPos[0], qPos[1] + 0.05, 0]);
  const qCap = T('unknown failure rate', 18, C.muted); qCap.moveTo([qPos[0], qPos[1] - 1.10, 0]);
  const qGroup = new M.VGroup(qBox, qSym, qCap);

  await until(S(5));
  await play(new M.FadeOut(new M.VGroup(onePart, partTag, arrIn, inspBox, arrPass, passG, arrFail, failG)),
    ...clearBox(), new M.FadeIn(qGroup),
    ...say('FAILURE RATE = ?  (UNKNOWN)', C.amber));

  // 6: tomorrow, a new batch of ten parts
  const batchY = P ? -1.4 : -0.45;
  const batchParts = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      const bx = (c - 2) * (P ? 1.22 : 1.45);
      const by = batchY + (0.5 - r) * 1.40;
      batchParts.push(charger(bx, by, C.cyan, P ? 0.92 : 1.0));
    }
  }
  const batchCap = T('10 parts · inspected tomorrow', 18, C.muted);
  batchCap.moveTo([0, batchY - 1.82, 0]);

  await until(S(6));
  await play(new M.FadeOut(qGroup),
    new M.LaggedStart(batchParts.map(p => new M.FadeIn(p)), { lagRatio: 0.08, runTime: 1.5 }),
    new M.FadeIn(batchCap),
    ...say('NEW BATCH: 10 PARTS TOMORROW', C.cyan));

  // 7: before that, the owner already has some experience
  const frameW = P ? 6.4 : 7.6, frameH = 2.95;
  const beforeFrame = new M.RoundedRectangle({ width: frameW, height: frameH, cornerRadius: 0.18, color: C.violet, strokeWidth: 2 });
  beforeFrame.moveTo([0, batchY, 0]);
  const beforeTag = pill('NOT INSPECTED YET', C.violet, 16);
  beforeTag.moveTo([0, batchY + frameH / 2 + 0.32, 0]);

  await until(S(7));
  await play(new M.Create(beforeFrame), new M.FadeIn(beforeTag),
    ...say('BEFORE DATA: PAST EXPERIENCE', C.violet));

  // --- ACT 2: 0%-100% LINE & 5 CANDIDATE RATES (Beats 8-11) ---

  // 8: line from 0 to 100 percent
  const L0 = P ? 6.7 : 11.4, x0 = -L0 / 2, ly = P ? -1.6 : -0.65;
  const p2x = pct => x0 + (pct / 100) * L0;
  const pctLine = new M.Line({ start: [x0, ly, 0], end: [x0 + L0, ly, 0], color: C.muted, strokeWidth: 3 });
  const tickVals = P ? [0, 50, 100] : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const pctTicks = Array.from({ length: 11 }, (_, k) => k * 10).map(v => {
    const tk = new M.Line({ start: [p2x(v), ly - 0.09, 0], end: [p2x(v), ly + 0.09, 0], color: C.muted, strokeWidth: 2 });
    if (!tickVals.includes(v)) return tk;
    const lb = T(`${v}%`, P ? 15 : 16, C.muted, true);
    lb.moveTo([p2x(v), ly - 0.38, 0]);
    return new M.VGroup(tk, lb);
  });
  const pctUnit = T('possible failure rate', 17, C.muted);
  pctUnit.moveTo([0, ly - 0.90, 0]);

  await until(S(8));
  await play(new M.FadeOut(new M.VGroup(...batchParts, batchCap, beforeFrame, beforeTag)),
    new M.Create(pctLine), new M.FadeIn(new M.VGroup(...pctTicks, pctUnit)),
    ...say('EVERY POSSIBLE RATE: 0% TO 100%', C.cyan));

  // 9: five candidate rates: 10, 20, 30, 40, 50%
  const candDots = RATES.map((r, k) => {
    const pt = [p2x(r), ly + 0.34, 0];
    const halo = new M.Dot({ point: pt, radius: 0.28, color: C.cyan }); halo.setFill(C.cyan, 0.20);
    const dot = new M.Dot({ point: pt, radius: 0.12, color: C.cyan });
    const lyOff = 0.84;
    const lab = T(`${r}%`, P ? 16 : 18, C.cyan, true, true);
    lab.moveTo([pt[0], ly + lyOff, 0]);
    return new M.VGroup(halo, dot, lab);
  });

  await until(S(9));
  await play(new M.LaggedStart(candDots.map(g => new M.FadeIn(g)), { lagRatio: 0.22, runTime: 3.2 }),
    ...say('5 CANDIDATE RATES: 10% TO 50%', C.cyan));

  // 10: a candidate is a value that might be the true one
  await until(S(10));
  await play(new M.LaggedStart(candDots.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.15, runTime: 2.0 }),
    ...say('CANDIDATE = MIGHT BE THE TRUE RATE', C.amber));

  // 11: real rates could sit between these, like 22%
  // 22% sits ON the line, its label below the tick labels (away from the candidate labels above)
  const pt22 = [p2x(22), ly, 0];
  const dot22 = new M.Dot({ point: pt22, radius: 0.11, color: C.violet });
  const lab22 = T('22%', P ? 18 : 19, C.violet, true, true);
  lab22.moveTo([pt22[0] + (P ? 0.10 : 0.30), ly - (P ? 0.86 : 0.84), 0]);
  const stem22 = new M.Line({ start: [pt22[0], ly - 0.12, 0], end: [lab22.getCenter()[0], ly - 0.68, 0], color: C.violet, strokeWidth: 2 });
  const group22 = new M.VGroup(stem22, dot22, lab22);

  await until(S(11));
  await play(new M.FadeIn(group22), new M.Flash(dot22, { color: C.violet }),
    ...say('REAL RATES SIT IN BETWEEN (22%)', C.violet));

  // --- ACT 3: SHARING 100 POINTS OF BELIEF -> BLUE BARS (Beats 12-20) ---

  // 12: zoomed 5-candidate stage + 100 points of belief budget
  const axisL = colx(0) - SP * 0.56, axisR = colx(4) + SP * 0.56;
  const chartFloor = new M.Line({ start: [axisL, BASE, 0], end: [axisR, BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const rateLabs = RATES.map((r, k) => {
    const t = T(`${r}%`, P ? 17 : 18, C.ink, true, true);
    t.moveTo([colx(k), BASE - 0.48, 0]);
    return t;
  });
  const chartNote = T('candidate failure rates', 16, C.muted);
  chartNote.moveTo([CX, BASE - (P ? 0.94 : 0.80), 0]);

  await until(S(12));
  await play(new M.FadeOut(new M.VGroup(pctLine, ...pctTicks, pctUnit, ...candDots, group22)),
    new M.Create(chartFloor), new M.FadeIn(new M.VGroup(...rateLabs, chartNote)),
    ...fbox(['belief budget', ['100 points to share', C.amber]], C.amber),
    ...say('100 POINTS OF BELIEF TO SHARE', C.amber));

  // 13: more points mean more believable
  const yArrowX = axisL - (P ? 0.16 : 0.30);
  const beliefArr = makeArrow([yArrowX, BASE + 0.25, 0], [yArrowX, BASE + (P ? 3.2 : 2.3), 0], C.muted, 2);
  const beliefCap = T('belief', 15, C.muted);
  beliefCap.moveTo([yArrowX + (P ? 0.36 : 0.0), BASE + (P ? 3.48 : 2.56), 0]);
  const yGuide = new M.VGroup(beliefArr, beliefCap);

  await until(S(13));
  await play(new M.FadeIn(yGuide), ...say('MORE POINTS = MORE BELIEVABLE', C.cyan));

  // 14-18: assign points one candidate at a time (before drawing bars in Beat 19)
  const ptBadges = [];
  let leftPts = 100;
  for (let k = 0; k < 5; k++) {
    await until(S(14 + k));
    leftPts -= PRIOR[k];
    const badge = pill(`${PRIOR[k]}`, C.cyan, P ? 17 : 18);
    badge.moveTo([colx(k), BASE + (P ? 0.72 : 0.56), 0]);
    ptBadges.push(badge);
    const leftLine = leftPts > 0 ? [`left: ${leftPts} pts`, C.amber] : ['left: 0 pts (all 100)', C.green];
    await play(new M.FadeIn(badge, { runTime: 0.65 }),
      ...fbox([`${RATES[k]}%  →  ${PRIOR[k]} pts`, leftLine], leftPts > 0 ? C.amber : C.green),
      ...say(`${RATES[k]}% GETS ${PRIOR[k]} POINTS`, C.cyan));
  }

  // 19: draw each share as a blue bar above its rate. 10, 30, 30, 20, 10. Together 100.
  const bars = RATES.map((_, k) => makeBar(k, 0, C.cyan));
  let topLabs = PRIOR.map((v, k) => topLabel(k, v, String(v), C.cyan));

  await until(S(19));
  await play(new M.FadeOut(new M.VGroup(...ptBadges)),
    ...fbox(['shares of belief', '10 + 30 + 30 + 20 + 10', ['= 100 points', C.cyan]], C.cyan),
    ...say('BLUE BARS = SHARE OF BELIEF', C.cyan));
  await play(new M.LaggedStart(bars.map((b, k) => new M.Transform(b, makeBar(k, PRIOR[k], C.cyan))), { lagRatio: 0.24, runTime: 3.2 }));
  await play(new M.LaggedStart(topLabs.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 0.9 }));

  // 20: probably 20 or 30%, maybe 40, less likely 10 or 50
  await until(S(20));
  await play(new M.Indicate(bars[1], { color: C.amber, runTime: 1.4 }),
    new M.Indicate(bars[2], { color: C.amber, runTime: 1.4 }),
    ...say('PROBABLY 20% OR 30%', C.amber));
  await play(new M.Indicate(bars[3], { color: C.cyan, runTime: 1.1 }));
  await play(new M.Indicate(bars[0], { color: C.muted, runTime: 1.2 }),
    new M.Indicate(bars[4], { color: C.muted, runTime: 1.2 }));

  // --- ACT 4: PRIOR, DISTRIBUTION & WHY NOT ONE NUMBER (Beats 21-26) ---

  // 21: this picture is called a prior. Prior means before.
  await until(S(21));
  await play(...fbox([['PRIOR', C.green], '"prior" means before'], C.green),
    ...say('PRIOR = BEFORE', C.green));

  // 22: what you believe about an unknown number, before you see the new data
  await until(S(22));
  await play(...fbox(['PRIOR', 'belief about ?', ['before new data arrive', C.cyan]], C.cyan),
    ...say('BELIEF BEFORE NEW DATA', C.cyan));

  // 23: not one number; a spread of belief over many possible values
  const spanY = BASE + 35 * UNIT;
  const spanLine = new M.Line({ start: [colx(0) - BW / 2, spanY, 0], end: [colx(4) + BW / 2, spanY, 0], color: C.violet, strokeWidth: 2.5 });
  const spanL = new M.Line({ start: [colx(0) - BW / 2, spanY - 0.14, 0], end: [colx(0) - BW / 2, spanY + 0.14, 0], color: C.violet, strokeWidth: 2.5 });
  const spanR = new M.Line({ start: [colx(4) + BW / 2, spanY - 0.14, 0], end: [colx(4) + BW / 2, spanY + 0.14, 0], color: C.violet, strokeWidth: 2.5 });
  const spanTxt = T('spread of belief', 17, C.violet, true); spanTxt.moveTo([CX, spanY + 0.30, 0]);
  const spanG = new M.VGroup(spanLine, spanL, spanR, spanTxt);

  await until(S(23));
  await play(new M.FadeIn(spanG),
    new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.14, runTime: 2.0 }),
    ...say('NOT ONE NUMBER: A SPREAD', C.violet));

  // 24: shares that add up to 100% -> distribution
  const pctLabs = PRIOR.map((v, k) => topLabel(k, v, `${v}%`, C.cyan));
  await until(S(24));
  await play(new M.FadeOut(spanG),
    ...topLabs.map(t => new M.FadeOut(t)), ...pctLabs.map(t => new M.FadeIn(t)),
    ...fbox([['DISTRIBUTION', C.cyan], '10% + 30% + 30%', '  + 20% + 10% = 100%'], C.cyan),
    ...say('DISTRIBUTION: SHARES ADD TO 100%', C.cyan));
  topLabs = pctLabs;

  // 25: why not just pick one number, like 25%?
  const x25 = rateX(25);
  const spike25 = new M.Line({ start: [x25, BASE, 0], end: [x25, BASE + 34 * UNIT, 0], color: C.amber, strokeWidth: 4 });
  const tag25 = pill('25% ONLY?', C.amber, 16); tag25.moveTo([x25, BASE + 34 * UNIT + 0.38, 0]);
  const oneNumG = new M.VGroup(spike25, tag25);

  await until(S(25));
  bars.forEach(b => b.setFill(C.cyan, 0.20));
  await play(new M.Create(spike25), new M.FadeIn(tag25),
    ...say('WHY NOT JUST PICK 25%?', C.amber));

  // 26: one number hides how sure you are; bars show best guess + doubt
  await until(S(26));
  bars.forEach(b => b.setFill(C.cyan, 0.82));
  await play(new M.FadeOut(oneNumG),
    new M.Indicate(bars[1], { color: C.amber, runTime: 1.5 }),
    new M.Indicate(bars[2], { color: C.amber, runTime: 1.5 }),
    ...fbox(['one number hides doubt', ['bars show guess + doubt', C.green]], C.green),
    ...say('BARS SHOW BEST GUESS + DOUBT', C.green));

  // --- ACT 5: PRIOR MEAN = BALANCE POINT & CALCULATION (Beats 27-31) ---

  // 27: single summary from the prior: its mean, the balance point of the bars
  const x29 = rateX(29);
  const balLine = new M.DashedLine({ start: [x29, BASE, 0], end: [x29, BASE + 35 * UNIT, 0], color: C.amber });
  const fH = P ? 0.26 : 0.22, fW = P ? 0.22 : 0.19;
  const fulcrum = new M.VGroup(
    new M.Line({ start: [x29, BASE - 0.01, 0], end: [x29 - fW, BASE - fH, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [x29, BASE - 0.01, 0], end: [x29 + fW, BASE - fH, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [x29 - fW, BASE - fH, 0], end: [x29 + fW, BASE - fH, 0], color: C.amber, strokeWidth: 3 }));

  await until(S(27));
  await play(new M.Create(balLine), new M.FadeIn(fulcrum),
    ...fbox([['prior mean', C.amber], 'balance point of the bars'], C.amber),
    ...say('PRIOR MEAN = BALANCE POINT', C.amber));

  // 28: write each share as a part of one (0.1, 0.3, 0.3, 0.2, 0.1)
  const decLabs = PRIOR.map((v, k) => topLabel(k, v, (v / 100).toFixed(1), C.amber));
  // keep the 30% label clear of the dashed balance line at 29%
  decLabs[2].moveTo([colx(2) + (P ? 0.24 : 0.22), decLabs[2].getCenter()[1], 0]);
  await until(S(28));
  await play(...topLabs.map(t => new M.FadeOut(t)), ...decLabs.map(t => new M.FadeIn(t)),
    ...fbox(['share as part of 1:', '10 / 100 = 0.1', '30 / 100 = 0.3', ['0.1+0.3+0.3+0.2+0.1 = 1', C.cyan]], C.cyan),
    ...say('WRITE EACH SHARE AS PART OF 1', C.cyan));
  topLabs = decLabs;

  // 29: multiply each rate by its share, and add
  await until(S(29));
  await play(...fbox([['prior mean =', C.amber], 'sum of (rate × share)'], C.amber),
    ...say('MULTIPLY RATE × SHARE, THEN ADD', C.amber));

  // 30: 10% x 0.1 + 20% x 0.3 + ... for all five
  await until(S(30));
  bars[0].setFill(C.amber, 0.92);
  await play(...fbox(['10% × 0.1 =  1%', ['+ ...', C.muted]], C.amber));
  bars[0].setFill(C.cyan, 0.82);
  bars[1].setFill(C.amber, 0.92);
  await play(...fbox(['10% × 0.1 =  1%', '20% × 0.3 =  6%', ['+ ...', C.muted]], C.amber));
  bars[1].setFill(C.cyan, 0.82);
  await play(new M.LaggedStart([2, 3, 4].map(k => new M.Indicate(bars[k], { color: C.amber })), { lagRatio: 0.22, runTime: 1.5 }),
    ...fbox(['10%×0.1 + 20%×0.3', '+ 30%×0.3 + 40%×0.2', '+ 50%×0.1', ['= 1 + 6 + 9 + 8 + 5', C.amber]], C.amber));

  // 31: total comes to 29%, the prior's centre
  const tag29 = pill('MEAN 29%', C.amber, 16);
  tag29.moveTo([x29, BASE + 35 * UNIT + 0.38, 0]);

  await until(S(31));
  await play(new M.FadeIn(tag29), new M.Flash(fulcrum, { color: C.amber }),
    ...fbox(['1 + 6 + 9 + 8 + 5', ['prior mean = 29%', C.amber]], C.amber),
    ...say('PRIOR MEAN = 29% (CENTRE)', C.amber));

  // --- ACT 6: RECAP, SOURCES, PURPOSE & PREVIEW (Beats 32-35) ---

  // 32: in short, shares add up to 100%
  const pctLabs2 = PRIOR.map((v, k) => topLabel(k, v, `${v}%`, C.cyan));
  await until(S(32));
  await play(new M.FadeOut(new M.VGroup(balLine, fulcrum, tag29)),
    ...topLabs.map(t => new M.FadeOut(t)), ...pctLabs2.map(t => new M.FadeIn(t)),
    new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.8 }),
    ...fbox(['prior = spread of belief', ['shares add to 100%', C.cyan]], C.cyan),
    ...say('SHARES OF BELIEF ADD TO 100%', C.cyan));
  topLabs = pctLabs2;

  // 33: where does a prior come from?
  await until(S(33));
  await play(...fbox([['WHERE IT COMES FROM', C.violet], '• past batches', '• maker’s records', '• expert experience'], C.violet),
    ...say('WHERE DOES A PRIOR COME FROM?', C.violet));

  // 34: what is a prior for?
  await until(S(34));
  await play(...fbox([['WHAT IT IS FOR', C.green], 'start from what you', 'already know'], C.green),
    ...say('START FROM WHAT YOU ALREADY KNOW', C.green));

  // 35: in the next lesson, the new batch makes some bars grow and others shrink
  const postLabs = POST.map((v, k) => topLabel(k, v, `${v}%`, C.green));
  await until(S(35));
  bars.forEach(b => { b.setFill(C.green, 0.82); b.setColor(C.green); });
  await play(...bars.map((b, k) => new M.Transform(b, makeBar(k, POST[k], C.green), { runTime: 1.6 })),
    ...topLabs.map(t => new M.FadeOut(t)), ...postLabs.map(t => new M.FadeIn(t)),
    ...fbox(['when new batch arrives:', ['some bars grow,', C.green], ['others shrink', C.pink]], C.green),
    ...say('NEXT LESSON: DATA UPDATE THE BARS', C.green));
  topLabs = postLabs;

  // --- ACT 7: COMMON TRAP — ZERO IN THE PRIOR (Beats 36-40) ---

  // 36: common trap: never give a possible value zero points
  const priorLabs3 = PRIOR.map((v, k) => topLabel(k, v, String(v), C.cyan));
  await until(S(36));
  bars.forEach(b => { b.setFill(C.cyan, 0.82); b.setColor(C.cyan); });
  await play(...bars.map((b, k) => new M.Transform(b, makeBar(k, PRIOR[k], C.cyan), { runTime: 1.1 })),
    ...topLabs.map(t => new M.FadeOut(t)), ...priorLabs3.map(t => new M.FadeIn(t)),
    ...fbox([['COMMON TRAP', C.pink], 'never give a possible', 'value 0 points'], C.pink),
    ...say('COMMON TRAP: NEVER USE ZERO', C.pink));
  topLabs = priorLabs3;

  // 37: suppose the owner gave 50% zero points
  const labZero = topLabel(4, 0, '0', C.pink);
  await until(S(37));
  bars[4].setFill(C.pink, 0.95); bars[4].setColor(C.pink);
  await play(new M.Transform(bars[4], makeBar(4, 0, C.pink), { runTime: 1.2 }),
    new M.FadeOut(topLabs[4]), new M.FadeIn(labZero),
    ...fbox(['50% set to 0 points', ['bar height = 0', C.pink]], C.pink),
    ...say('SUPPOSE 50% GETS 0 POINTS', C.pink));
  topLabs[4] = labZero;

  // 38: new data scale each bar in proportion to its size; zero has nothing to grow from
  const multBadge = T('0 × ? = 0', P ? 15 : 16, C.pink, true, true);
  multBadge.moveTo([colx(4), BASE + (P ? 0.95 : 0.82), 0]);

  await until(S(38));
  await play(new M.FadeIn(multBadge),
    new M.LaggedStart([0, 1, 2, 3].map(k => new M.Indicate(bars[k], { color: C.cyan })), { lagRatio: 0.14, runTime: 1.8 }),
    ...fbox(['data scale each bar:', '  new = prior × factor', ['  0 × anything = 0', C.pink]], C.pink),
    ...say('0 × ANYTHING = 0', C.pink));

  // 39: even if every part failed, 50% could never come back. Door locked forever.
  const lockIcon = makePadlock(colx(4), BASE + (P ? 1.10 : 0.92), C.pink);

  await until(S(39));
  await play(new M.FadeOut(multBadge), new M.FadeIn(lockIcon), new M.Flash(lockIcon, { color: C.pink }),
    ...fbox(['even if 10 / 10 fail:', '  50% stays stuck at 0', ['door locked forever', C.pink]], C.pink),
    ...say('ZERO = DOOR LOCKED FOREVER', C.pink));

  // 40: give small shares to unlikely values, but not zero, unless truly impossible
  const labSmall = topLabel(4, 5, '5', C.green);
  await until(S(40));
  bars[4].setFill(C.green, 0.85); bars[4].setColor(C.green);
  await play(new M.FadeOut(lockIcon),
    new M.Transform(bars[4], makeBar(4, 5, C.green), { runTime: 1.1 }),
    new M.FadeOut(topLabs[4]), new M.FadeIn(labSmall),
    ...fbox([['RULE', C.green], 'unlikely → small (> 0)', '0 → only if impossible'], C.green),
    ...say('USE A SMALL SHARE, NOT ZERO', C.green));
  topLabs[4] = labSmall;

  // --- ACT 8: ONE-SENTENCE RECAP (Beat 41) ---

  // 41: prior is your spread of belief over possible values, written down before new data arrive
  const labBack = topLabel(4, 10, '10', C.cyan);
  await until(S(41));
  bars[4].setFill(C.cyan, 0.82); bars[4].setColor(C.cyan);
  await play(new M.Transform(bars[4], makeBar(4, 10, C.cyan), { runTime: 0.9 }),
    new M.FadeOut(topLabs[4]), new M.FadeIn(labBack),
    ...fbox([['PRIOR', C.cyan], 'spread of belief over', 'possible values,', ['before new data arrive', C.amber]], C.cyan),
    ...say('PRIOR = BELIEF BEFORE DATA', C.cyan));
  topLabs[4] = labBack;
  await play(new M.LaggedStart(bars.map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.14, runTime: 1.8 }));
}

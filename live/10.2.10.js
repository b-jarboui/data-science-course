// 10.2.10 Robust standard errors: uncertainty in the slope.
// Beat i = sentence i (0-based, 0..51). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // phone: small labels two sizes bigger; laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, P ? (size <= 17 ? size + 2 : size) : Math.max(size, 14), ...r);
  const pill = (s, c, size = 20) => L.pill(s, c, P ? Math.max(size, 16) : Math.max(size, 14));

  // Data from chapters/10.2.md (cards A-D at 40 m^2, cards I and L at 60 m^2)
  const SMALL = [980, 1000, 1000, 1020];
  const LARGE = [1320, 1480];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]), phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 1.88, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.30, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.38 : 0.39;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.45;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // Helpers
  function mkDot(x, y, col, r = 0.085) {
    const halo = new M.Dot({ point: [x, y, 0], radius: r * 2.3, color: col });
    halo.setFill(col, 0.18);
    const dot = new M.Dot({ point: [x, y, 0], radius: r, color: col });
    dot.setFill(col, 1);
    return new M.VGroup(halo, dot);
  }

  function mkBasket(cx, cy, w, h, col, caption, sub) {
    const fill = new M.Rectangle({ width: w - 0.06, height: h - 0.06, color: col, strokeWidth: 0 });
    fill.setFill(col, 0.10); fill.moveTo([cx, cy, 0]);
    const left = new M.Line({ start: [cx - w / 2, cy + h / 2, 0], end: [cx - w / 2, cy - h / 2, 0], color: col, strokeWidth: 3 });
    const bot = new M.Line({ start: [cx - w / 2, cy - h / 2, 0], end: [cx + w / 2, cy - h / 2, 0], color: col, strokeWidth: 3 });
    const right = new M.Line({ start: [cx + w / 2, cy - h / 2, 0], end: [cx + w / 2, cy + h / 2, 0], color: col, strokeWidth: 3 });
    const parts = [fill, left, bot, right];
    if (caption) {
      const cap = T(caption, P ? 16 : 16, col, true, true);
      cap.moveTo([cx, cy - h / 2 - 0.28, 0]);
      parts.push(cap);
    }
    if (sub) {
      const sb = T(sub, P ? 14 : 14, C.muted, true);
      sb.moveTo([cx, cy - h / 2 - 0.54, 0]);
      parts.push(sb);
    }
    return new M.VGroup(...parts);
  }

  function mkChip(x, y, text, col, w = 0.92, h = 0.36) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const t = T(text, P ? 15 : 15, col, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }

  // Scatter plot geometry
  const axX0 = P ? -2.45 : -5.15, axX1 = P ? 3.15 : 1.15;
  const axY0 = P ? -4.35 : -2.35, axY1 = P ? 0.95 : 1.30;
  const x40 = P ? -1.05 : -3.45, x60 = P ? 1.75 : -0.35;
  const yOf = r => axY0 + (r - 880) / 680 * (axY1 - axY0);
  const dotJitterS = [0, -0.22, 0.22, 0];
  const sPos = SMALL.map((r, k) => [x40 + dotJitterS[k], yOf(r)]);
  const lPos = LARGE.map(r => [x60, yOf(r)]);

  function buildAxes() {
    const xAxis = new M.Line({ start: [axX0, axY0, 0], end: [axX1, axY0, 0], color: C.muted, strokeWidth: 2.5 });
    const yAxis = new M.Line({ start: [axX0, axY0, 0], end: [axX0, axY1, 0], color: C.muted, strokeWidth: 2.5 });
    const parts = [xAxis, yAxis];
    for (const v of [1000, 1200, 1400, 1500]) {
      const y = yOf(v);
      const gl = new M.Line({ start: [axX0, y, -0.01], end: [axX1, y, -0.01], color: C.line, strokeWidth: 1 });
      gl.setStrokeOpacity(0.5);
      const tk = new M.Line({ start: [axX0 - 0.08, y, 0], end: [axX0 + 0.08, y, 0], color: C.muted, strokeWidth: 2 });
      const lb = T('$' + v.toLocaleString(), P ? 14 : 15, C.muted, true);
      lb.moveTo([axX0 - 0.56, y, 0]);
      parts.push(gl, tk, lb);
    }
    for (const [x, txt] of [[x40, '40 m²'], [x60, '60 m²']]) {
      const tk = new M.Line({ start: [x, axY0 - 0.08, 0], end: [x, axY0 + 0.08, 0], color: C.muted, strokeWidth: 2 });
      const lb = T(txt, P ? 16 : 17, C.ink, true);
      lb.moveTo([x, axY0 - 0.34, 0]);
      parts.push(tk, lb);
    }
    const yTitle = T('Rent / month', P ? 14 : 15, C.muted);
    yTitle.moveTo([axX0 + 0.72, axY1 + 0.22, 0]);
    parts.push(yTitle);
    return new M.VGroup(...parts);
  }

  // --- BEAT 0: Six listings (4 small, 2 large) ---
  const cardData = [
    ['A', '40 m²', '$980', C.cyan],
    ['B', '40 m²', '$1,000', C.cyan],
    ['C', '40 m²', '$1,000', C.cyan],
    ['D', '40 m²', '$1,020', C.cyan],
    ['I', '60 m²', '$1,320', C.pink],
    ['L', '60 m²', '$1,480', C.pink],
  ];
  const cards = cardData.map(([id, area, rent, col], i) => {
    const isLarge = i >= 4;
    const x = P
      ? (isLarge ? (i - 4.5) * 2.1 : ((i % 2) - 0.5) * 2.1)
      : (isLarge ? CX + 1.65 + (i - 4.5) * 1.45 : CX - 1.75 + ((i % 2) - 0.5) * 1.45);
    const y = P
      ? (isLarge ? -3.15 : (i < 2 ? 0.15 : -1.25))
      : (isLarge ? -0.55 : (i < 2 ? 0.25 : -1.35));
    const cw = P ? 1.8 : 1.3, ch = P ? 1.1 : 1.25;
    const box = new M.RoundedRectangle({ width: cw, height: ch, cornerRadius: 0.14, color: col, strokeWidth: 2 });
    box.setFill(C.card, 0.95); box.moveTo([x, y, 0]);
    const tId = T('Card ' + id, P ? 14 : 14, C.muted, true); tId.moveTo([x, y + ch * 0.28, 0]);
    const tAr = T(area, P ? 16 : 16, col, true, true); tAr.moveTo([x, y, 0]);
    const tRn = T(rent, P ? 16 : 16, C.ink, true); tRn.moveTo([x, y - ch * 0.28, 0]);
    return new M.VGroup(box, tId, tAr, tRn);
  });
  const grpLblS = T('4 small apartments', P ? 16 : 17, C.cyan, false, true);
  grpLblS.moveTo([P ? 0 : CX - 1.75, P ? 0.98 : 1.22, 0]);
  const grpLblL = T('2 large apartments', P ? 16 : 17, C.pink, false, true);
  grpLblL.moveTo([P ? 0 : CX + 1.65, P ? -2.25 : 0.42, 0]);

  await until(S(0));
  await play(
    new M.LaggedStart(cards.map(c => new M.FadeIn(c, { runTime: 0.5 })), { lagRatio: 0.15, runTime: 1.5 }),
    new M.FadeIn(grpLblS, { runTime: 0.7 }),
    new M.FadeIn(grpLblL, { runTime: 0.7 }),
    ...say('6 LISTINGS: 4 SMALL, 2 LARGE', C.cyan)
  );

  // --- BEAT 1: How uncertain is the rent difference? ---
  const qBadge = pill('RENT DIFFERENCE:  $?  ±  ?', C.amber, P ? 17 : 18);
  qBadge.moveTo([CX, P ? -4.35 : -2.45, 0]);
  await until(S(1));
  await play(new M.FadeIn(qBadge, { runTime: 0.8 }), ...say('HOW UNCERTAIN IS THE DIFFERENCE?', C.amber));

  // --- BEAT 2: Draw 4 dots at 40 m^2 and 2 at 60 m^2 ---
  const axesG = buildAxes();
  const sDots = sPos.map(([x, y]) => mkDot(x, y, C.cyan, P ? 0.095 : 0.085));
  const lDots = lPos.map(([x, y]) => mkDot(x, y, C.pink, P ? 0.095 : 0.085));
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...cards, grpLblS, grpLblL, qBadge), { runTime: 0.5 }),
    new M.FadeIn(axesG, { runTime: 0.7 }),
    new M.LaggedStart([...sDots, ...lDots].map(d => new M.FadeIn(d, { runTime: 0.45 })), { lagRatio: 0.15, runTime: 1.5 }),
    ...say('4 DOTS AT 40 m²  ·  2 AT 60 m²', C.cyan)
  );

  // --- BEAT 3: Small dots center on $1,000 ---
  const cSLine = new M.Line({ start: [x40 - 0.52, yOf(1000), 0], end: [x40 + 0.52, yOf(1000), 0], color: C.cyan, strokeWidth: 3.5 });
  const cSLbl = T('$1,000', P ? 17 : 18, C.cyan, true, true);
  cSLbl.moveTo([x40 - 0.88, yOf(1000) + 0.32, 0]);
  const cSmall = new M.VGroup(cSLine, cSLbl);
  await until(S(3));
  await play(new M.Create(cSLine, { runTime: 0.6 }), new M.FadeIn(cSLbl, { runTime: 0.6 }), ...say('SMALL CENTER = $1,000 / MONTH', C.cyan));

  // --- BEAT 4: Large dots center on $1,400 ---
  const cLLine = new M.Line({ start: [x60 - 0.52, yOf(1400), 0], end: [x60 + 0.52, yOf(1400), 0], color: C.pink, strokeWidth: 3.5 });
  const cLLbl = T('$1,400', P ? 17 : 18, C.pink, true, true);
  cLLbl.moveTo([x60 + 0.82, yOf(1400), 0]);
  const cLarge = new M.VGroup(cLLine, cLLbl);
  await until(S(4));
  await play(new M.Create(cLLine, { runTime: 0.6 }), new M.FadeIn(cLLbl, { runTime: 0.6 }), ...say('LARGE CENTER = $1,400 / MONTH', C.pink));

  // --- BEAT 5: Straight line rises $400 over 20 m^2 ---
  const fitLine = new M.Line({ start: [x40, yOf(1000), 0], end: [x60, yOf(1400), 0], color: C.amber, strokeWidth: 4 });
  const runLine = new M.DashedLine({ start: [x40, yOf(1000), 0], end: [x60, yOf(1000), 0], color: C.amber });
  const riseLine = new M.DashedLine({ start: [x60, yOf(1000), 0], end: [x60, yOf(1400), 0], color: C.amber });
  const runTxt = T('20 m²', P ? 15 : 16, C.amber, true);
  runTxt.moveTo([(x40 + x60) / 2, yOf(1000) - 0.30, 0]);
  const riseTxt = T('+$400', P ? 16 : 17, C.amber, true, true);
  riseTxt.moveTo([x60 + 0.58, (yOf(1000) + yOf(1400)) / 2, 0]);
  const riseRun = new M.VGroup(runLine, riseLine, runTxt, riseTxt);
  await until(S(5));
  await play(new M.Create(fitLine, { runTime: 1.0 }), new M.FadeIn(riseRun, { runTime: 0.9 }), ...say('RISES $400 OVER 20 m²', C.amber));

  // --- BEAT 6: This rise is the slope ---
  const slopeTag = pill('SLOPE = +$400', C.amber, P ? 16 : 17);
  slopeTag.moveTo([(x40 + x60) / 2 - 0.35, (yOf(1000) + yOf(1400)) / 2 + 0.48, 0]);
  await until(S(6));
  await play(new M.FadeIn(slopeTag, { runTime: 0.7 }), new M.Indicate(fitLine, { color: C.amber, runTime: 0.9 }), ...say('RISE FOR ONE STEP = SLOPE', C.amber));

  // --- BEAT 7: Small dots lie close to center ---
  const sGapUp = new M.Line({ start: [x40 + 0.36, yOf(1000), 0], end: [x40 + 0.36, yOf(1020), 0], color: C.cyan, strokeWidth: 3 });
  const sGapDn = new M.Line({ start: [x40 + 0.36, yOf(1000), 0], end: [x40 + 0.36, yOf(980), 0], color: C.cyan, strokeWidth: 3 });
  const sGapLbl = T('±$20', P ? 15 : 16, C.cyan, true, true);
  sGapLbl.moveTo([x40 + 0.80, yOf(1020) + 0.24, 0]);
  const sGaps = new M.VGroup(sGapUp, sGapDn, sGapLbl);
  await until(S(7));
  await play(
    new M.FadeIn(sGaps, { runTime: 0.7 }),
    new M.LaggedStart(sDots.map(d => new M.Indicate(d, { color: C.cyan, runTime: 0.6 })), { lagRatio: 0.1, runTime: 1.0 }),
    ...say('SMALL DOTS: CLOSE TO CENTER', C.cyan)
  );

  // --- BEAT 8: Large dots are $80 below and above ---
  const lGapUp = new M.Line({ start: [x60, yOf(1400), 0], end: [x60, yOf(1480), 0], color: C.pink, strokeWidth: 3.5 });
  const lGapDn = new M.Line({ start: [x60, yOf(1400), 0], end: [x60, yOf(1320), 0], color: C.pink, strokeWidth: 3.5 });
  const lLblUp = T('+$80', P ? 15 : 16, C.pink, true, true); lLblUp.moveTo([x60 + 0.56, yOf(1480), 0]);
  const lLblDn = T('−$80', P ? 15 : 16, C.pink, true, true); lLblDn.moveTo([x60 + 0.56, yOf(1320), 0]);
  const lGaps = new M.VGroup(lGapUp, lGapDn, lLblUp, lLblDn);
  await until(S(8));
  await play(
    new M.Create(lGapUp, { runTime: 0.7 }),
    new M.Create(lGapDn, { runTime: 0.7 }),
    new M.FadeIn(lLblUp, { runTime: 0.7 }),
    new M.FadeIn(lLblDn, { runTime: 0.7 }),
    ...say('LARGE DOTS: ±$80 FROM CENTER', C.pink)
  );

  // --- BEAT 9: Imagine repeating the search with 6 new listings ---
  const ghostPtsS = [988, 1005, 1012, 1025];
  const ghostPtsL = [1370, 1510];
  const ghostDotsArr = [
    ...ghostPtsS.map((r, k) => {
      const d = new M.Circle({ radius: 0.08, color: C.violet, strokeWidth: 2.5 });
      d.setFill(C.violet, 0.35); d.moveTo([x40 + (k - 1.5) * 0.16, yOf(r), 0]); return d;
    }),
    ...ghostPtsL.map((r, k) => {
      const d = new M.Circle({ radius: 0.08, color: C.violet, strokeWidth: 2.5 });
      d.setFill(C.violet, 0.35); d.moveTo([x60 + (k - 0.5) * 0.22, yOf(r), 0]); return d;
    }),
  ];
  const ghostDots = new M.VGroup(...ghostDotsArr);
  await until(S(9));
  await play(
    new M.FadeOut(riseRun, { runTime: 0.5 }),
    new M.FadeOut(slopeTag, { runTime: 0.5 }),
    new M.FadeIn(ghostDots, { runTime: 0.9 }),
    ...say('REPEAT SEARCH: 6 NEW LISTINGS', C.violet)
  );

  // --- BEAT 10: Different averages -> slope could change ---
  const ghostLines = [
    new M.DashedLine({ start: [x40, yOf(1008), 0], end: [x60, yOf(1440), 0], color: C.violet }),
    new M.DashedLine({ start: [x40, yOf(992), 0], end: [x60, yOf(1345), 0], color: C.violet }),
    new M.DashedLine({ start: [x40, yOf(1015), 0], end: [x60, yOf(1475), 0], color: C.violet }),
  ];
  await until(S(10));
  await play(
    new M.LaggedStart(ghostLines.map(ln => new M.Create(ln, { runTime: 0.7 })), { lagRatio: 0.35, runTime: 1.8 }),
    ...say('NEW AVERAGES → SLOPE CHANGES', C.violet)
  );

  // --- BEAT 11: Standard error estimates how much the slope varies ---
  const fanBar = new M.Line({ start: [x60 + 0.98, yOf(1345), 0], end: [x60 + 0.98, yOf(1475), 0], color: C.violet, strokeWidth: 3.5 });
  const fanTop = new M.Line({ start: [x60 + 0.88, yOf(1475), 0], end: [x60 + 1.08, yOf(1475), 0], color: C.violet, strokeWidth: 3 });
  const fanBot = new M.Line({ start: [x60 + 0.88, yOf(1345), 0], end: [x60 + 1.08, yOf(1345), 0], color: C.violet, strokeWidth: 3 });
  const fanLbl = T('SE', P ? 17 : 18, C.violet, true, true);
  fanLbl.moveTo([x60 + 1.28, yOf(1410), 0]);
  const seFan = new M.VGroup(fanBar, fanTop, fanBot, fanLbl);
  await until(S(11));
  await play(
    new M.FadeOut(ghostDots, { runTime: 0.5 }),
    new M.FadeIn(seFan, { runTime: 0.8 }),
    ...say('STANDARD ERROR = SLOPE VARIATION', C.violet)
  );

  // --- BEAT 12: Picture two baskets, one for small and one for large ---
  const colS = P ? -1.80 : CX - 1.95;
  const colL = P ? 1.80 : CX + 1.95;
  const yMid = P ? -0.35 : 0.25;
  const yBask = P ? -3.05 : -1.70;
  const gScale = P ? 0.75 / 80 : 0.56 / 80;
  const bw = P ? 2.75 : 2.55, bh = P ? 1.40 : 1.18;

  const sCenterLn = new M.DashedLine({ start: [colS - 1.25, yMid, 0], end: [colS + 1.25, yMid, 0], color: C.cyan });
  const lCenterLn = new M.DashedLine({ start: [colL - 1.25, yMid, 0], end: [colL + 1.25, yMid, 0], color: C.pink });
  const sStripTtl = T('Small ($1,000)', P ? 15 : 16, C.cyan, true, true);
  sStripTtl.moveTo([colS, yMid + 80 * gScale + 0.68, 0]);
  const lStripTtl = T('Large ($1,400)', P ? 15 : 16, C.pink, true, true);
  lStripTtl.moveTo([colL, yMid + 80 * gScale + 0.68, 0]);

  const sGapVals = [-20, 0, 0, 20];
  const lGapVals = [-80, 80];
  const sStripXs = [-0.96, -0.32, 0.32, 0.96].map(dx => colS + dx);
  const lStripXs = [-0.62, 0.62].map(dx => colL + dx);
  const stripDotsS = sGapVals.map((g, i) => mkDot(sStripXs[i], yMid + g * gScale, C.cyan, 0.08));
  const stripDotsL = lGapVals.map((g, i) => mkDot(lStripXs[i], yMid + g * gScale, C.pink, 0.085));
  const stripS = new M.VGroup(sCenterLn, sStripTtl, ...stripDotsS);
  const stripL = new M.VGroup(lCenterLn, lStripTtl, ...stripDotsL);

  const baskS = mkBasket(colS, yBask, bw, bh, C.cyan, 'SMALL BASKET', '4 listings');
  const baskL = mkBasket(colL, yBask, bw, bh, C.pink, 'LARGE BASKET', '2 listings');

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(axesG, ...sDots, ...lDots, cSmall, cLarge, fitLine, sGaps, lGaps, ...ghostLines, seFan), { runTime: 0.6 }),
    new M.FadeIn(stripS, { runTime: 0.7 }),
    new M.FadeIn(stripL, { runTime: 0.7 }),
    new M.FadeIn(baskS, { runTime: 0.8 }),
    new M.FadeIn(baskL, { runTime: 0.8 }),
    ...say('TWO BASKETS: SMALL & LARGE', C.cyan)
  );

  // --- BEAT 13: Find each dot's gap from its group's center ---
  const gapEls = [];
  sGapVals.forEach((g, i) => {
    const x = sStripXs[i], y = yMid + g * gScale;
    if (g !== 0) gapEls.push(new M.Line({ start: [x, yMid, 0], end: [x, y, 0], color: C.amber, strokeWidth: 3 }));
    const txt = T(g > 0 ? '+20' : String(g), P ? 14 : 14, C.amber, true);
    txt.moveTo([x, y + (g >= 0 ? 0.28 : -0.28), 0]);
    gapEls.push(txt);
  });
  lGapVals.forEach((g, i) => {
    const x = lStripXs[i], y = yMid + g * gScale;
    gapEls.push(new M.Line({ start: [x, yMid, 0], end: [x, y, 0], color: C.amber, strokeWidth: 3.5 }));
    const txt = T(g > 0 ? '+80' : '−80', P ? 15 : 15, C.amber, true, true);
    txt.moveTo([x, y + (g > 0 ? 0.28 : -0.28), 0]);
    gapEls.push(txt);
  });
  const gapLines = new M.VGroup(...gapEls);
  await until(S(13));
  await play(new M.FadeIn(gapLines, { runTime: 0.8 }), ...say('EACH DOT’S GAP FROM ITS CENTER', C.amber));

  // --- BEAT 14: Multiply each gap by itself to get a squared gap ---
  const chipY = g => yMid + g * gScale + (g >= 0 ? 0.30 : -0.30);
  const sqChips = [
    mkChip(sStripXs[0], chipY(-20), '400', C.cyan, 0.72, 0.34),
    mkChip(sStripXs[1], chipY(0), '0', C.muted, 0.42, 0.32),
    mkChip(sStripXs[2], chipY(0), '0', C.muted, 0.42, 0.32),
    mkChip(sStripXs[3], chipY(20), '400', C.cyan, 0.72, 0.34),
    mkChip(lStripXs[0], chipY(-80), '6,400', C.pink, 0.96, 0.36),
    mkChip(lStripXs[1], chipY(80), '6,400', C.pink, 0.96, 0.36),
  ];
  const gapTexts = gapEls.filter(o => typeof o.getText === 'function');
  await until(S(14));
  await play(
    ...gapTexts.map(t => new M.FadeOut(t, { runTime: 0.4 })),
    new M.LaggedStart(sqChips.map(c => new M.FadeIn(c, { runTime: 0.4 })), { lagRatio: 0.12, runTime: 1.2 }),
    ...say('SQUARED GAP = GAP × GAP', C.amber)
  );

  // --- BEAT 15: Each basket holds the squared gaps from one group ---
  const dropAnims = [
    new M.Transform(sqChips[0], mkChip(colS - 0.56, yBask - 0.24, '400', C.cyan, 0.86, 0.36), { runTime: 1.0, pathArc: -0.4 }),
    new M.FadeOut(sqChips[1], { runTime: 0.5 }),
    new M.FadeOut(sqChips[2], { runTime: 0.5 }),
    new M.Transform(sqChips[3], mkChip(colS + 0.56, yBask - 0.24, '400', C.cyan, 0.86, 0.36), { runTime: 1.0, pathArc: 0.4 }),
    new M.Transform(sqChips[4], mkChip(colL - 0.58, yBask - 0.24, '6,400', C.pink, 1.02, 0.38), { runTime: 1.0, pathArc: -0.3 }),
    new M.Transform(sqChips[5], mkChip(colL + 0.58, yBask - 0.24, '6,400', C.pink, 1.02, 0.38), { runTime: 1.0, pathArc: 0.3 }),
  ];
  await until(S(15));
  await play(...dropAnims, ...say('SQUARED GAPS GO INTO BASKETS', C.cyan));

  // --- BEAT 16: Small basket holds a total of 800 ---
  const totS = T('800', P ? 24 : 25, C.cyan, true, true);
  totS.moveTo([colS, yBask + 0.26, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(totS, { runTime: 0.7 }),
    ...fbox(['Small basket (4 dots)', '400 + 0 + 0 + 400', ['= 800', C.cyan]], C.cyan),
    ...say('SMALL BASKET TOTAL = 800', C.cyan)
  );

  // --- BEAT 17: Large basket holds a total of 12,800 ---
  const totL = T('12,800', P ? 24 : 25, C.pink, true, true);
  totL.moveTo([colL, yBask + 0.26, 0]);
  await until(S(17));
  await play(
    new M.FadeIn(totL, { runTime: 0.7 }),
    ...fbox(['Small basket = 800', 'Large basket (2 dots)', '6,400 + 6,400', ['= 12,800', C.pink]], C.pink),
    ...say('LARGE BASKET TOTAL = 12,800', C.pink)
  );

  // --- BEAT 18: Usual method combines the baskets ---
  const yTopU = P ? 0.45 : 0.72;
  const yPool = P ? -1.75 : -1.05;
  const uTopS = mkBasket(colS, yTopU, P ? 2.4 : 2.2, 0.88, C.cyan, '', '');
  const uTopSTxt = T('800', P ? 22 : 22, C.cyan, true, true); uTopSTxt.moveTo([colS, yTopU, 0]);
  const uTopL = mkBasket(colL, yTopU, P ? 2.4 : 2.2, 0.88, C.pink, '', '');
  const uTopLTxt = T('12,800', P ? 22 : 22, C.pink, true, true); uTopLTxt.moveTo([colL, yTopU, 0]);
  const uArrS = new M.Arrow({ start: [colS + 0.35, yTopU - 0.52, 0], end: [CX - 0.65, yPool + 0.68, 0], color: C.cyan });
  const uArrL = new M.Arrow({ start: [colL - 0.35, yTopU - 0.52, 0], end: [CX + 0.65, yPool + 0.68, 0], color: C.pink });
  const poolW = P ? 5.6 : 5.2, poolH = P ? 1.15 : 1.02;
  const uPool = mkBasket(CX, yPool, poolW, poolH, C.amber, 'COMBINED BASKET', '');

  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(stripS, stripL, gapLines, sqChips[0], sqChips[3], sqChips[4], sqChips[5], baskS, baskL, totS, totL), { runTime: 0.5 }),
    new M.FadeIn(uTopS, { runTime: 0.6 }), new M.FadeIn(uTopSTxt, { runTime: 0.6 }),
    new M.FadeIn(uTopL, { runTime: 0.6 }), new M.FadeIn(uTopLTxt, { runTime: 0.6 }),
    new M.FadeIn(uArrS, { runTime: 0.7 }), new M.FadeIn(uArrL, { runTime: 0.7 }),
    new M.FadeIn(uPool, { runTime: 0.8 }),
    ...say('USUAL METHOD: COMBINE BASKETS', C.amber)
  );

  // --- BEAT 19: Together they hold 13,600 ---
  const uPoolVal = T('13,600', P ? 28 : 28, C.amber, true, true);
  uPoolVal.moveTo([CX, yPool, 0]);
  await until(S(19));
  await play(
    new M.FadeIn(uPoolVal, { runTime: 0.7 }),
    ...fbox(['USUAL (POOLED)', '800 + 12,800', ['= 13,600', C.amber]], C.amber),
    ...say('COMBINED TOTAL = 13,600', C.amber)
  );

  // --- BEAT 20: Six rents help set two group centers ---
  const yDots6 = P ? -3.70 : -2.42;
  const sixDots = Array.from({ length: 6 }, (_, k) => {
    const x = CX + (k - 2.5) * (P ? 0.68 : 0.64);
    const col = k < 4 ? C.cyan : C.pink;
    const d = new M.Circle({ radius: 0.14, color: col, strokeWidth: 2.5 });
    d.setFill(col, 0.85); d.moveTo([x, yDots6, 0]);
    return d;
  });
  const sixLbl = T('6 rents', P ? 15 : 15, C.muted, true);
  sixLbl.moveTo([CX - 2.45, yDots6, 0]);
  const ring1 = new M.Circle({ radius: 0.24, color: C.amber, strokeWidth: 2.5 });
  ring1.moveTo([CX + (0 - 2.5) * (P ? 0.68 : 0.64), yDots6, 0]);
  const ring2 = new M.Circle({ radius: 0.24, color: C.amber, strokeWidth: 2.5 });
  ring2.moveTo([CX + (4 - 2.5) * (P ? 0.68 : 0.64), yDots6, 0]);
  const twoRings = new M.VGroup(ring1, ring2, sixLbl);
  await until(S(20));
  await play(
    new M.LaggedStart(sixDots.map(d => new M.FadeIn(d, { runTime: 0.35 })), { lagRatio: 0.1, runTime: 0.9 }),
    new M.FadeIn(twoRings, { runTime: 0.8 }),
    ...say('6 RENTS SET 2 GROUP CENTERS', C.muted)
  );

  // --- BEAT 21: Use 6 - 2 = 4 as the divider ---
  const xMark1 = T('×', 22, C.amber, true, true); xMark1.moveTo(ring1.getCenter());
  const xMark2 = T('×', 22, C.amber, true, true); xMark2.moveTo(ring2.getCenter());
  const divTag = T('6 − 2 = 4', P ? 17 : 18, C.amber, true, true);
  divTag.moveTo([CX + 2.58, yDots6, 0]);
  const divGroup = new M.VGroup(xMark1, xMark2, divTag);
  await until(S(21));
  sixDots[0].setFill(C.muted, 0.25); sixDots[4].setFill(C.muted, 0.25);
  await play(
    new M.FadeIn(divGroup, { runTime: 0.7 }),
    ...fbox(['Combined = 13,600', ['Divider  = 6 − 2 = 4', C.amber]], C.amber),
    ...say('DIVIDER = 6 − 2 = 4', C.amber)
  );

  // --- BEAT 22: Shared squared spread = 3,400 ---
  const splitParts = [];
  for (let k = 1; k <= 3; k++) {
    const x = CX - poolW / 2 + k * poolW / 4;
    splitParts.push(new M.DashedLine({ start: [x, yPool - poolH / 2, 0], end: [x, yPool + poolH / 2, 0], color: C.amber }));
  }
  for (let k = 0; k < 4; k++) {
    const x = CX - poolW / 2 + (k + 0.5) * poolW / 4;
    const t = T('3,400', P ? 16 : 16, C.amber, true, true);
    t.moveTo([x, yPool, 0]);
    splitParts.push(t);
  }
  const poolSplits = new M.VGroup(...splitParts);
  await until(S(22));
  await play(
    new M.FadeOut(uPoolVal, { runTime: 0.4 }),
    new M.FadeIn(poolSplits, { runTime: 0.8 }),
    ...fbox(['Shared squared spread:', '13,600 ÷ 4', ['= 3,400', C.amber]], C.amber),
    ...say('SHARED SPREAD = 3,400', C.amber)
  );

  // --- BEAT 23: Slope is the difference between the two group averages ---
  const yBanner = P ? 0.65 : 0.92;
  const slopeEqBox = new M.RoundedRectangle({ width: P ? 6.6 : 6.4, height: 0.68, cornerRadius: 0.14, color: C.amber, strokeWidth: 2 });
  slopeEqBox.setFill(C.card, 0.95); slopeEqBox.moveTo([CX, yBanner, 0]);
  const slopeEqTxt = T('slope = large avg − small avg', P ? 17 : 18, C.amber, true, true);
  slopeEqTxt.moveTo([CX, yBanner, 0]);
  const slopeEq = new M.VGroup(slopeEqBox, slopeEqTxt);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(uTopS, uTopSTxt, uTopL, uTopLTxt, uArrS, uArrL, uPool, poolSplits, ...sixDots, twoRings, divGroup), { runTime: 0.6 }),
    new M.FadeIn(slopeEq, { runTime: 0.7 }),
    ...say('SLOPE = LARGE AVG − SMALL AVG', C.amber)
  );

  // --- BEAT 24: Each average varies less when its group has more listings ---
  const yGrp = P ? -0.45 : -0.05;
  const gBoxS = new M.RoundedRectangle({ width: P ? 3.1 : 3.0, height: 0.88, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  gBoxS.setFill(C.card, 0.95); gBoxS.moveTo([colS, yGrp, 0]);
  const gTxtS1 = T('Small: 4 listings', P ? 15 : 16, C.cyan, true, true); gTxtS1.moveTo([colS, yGrp + 0.16, 0]);
  const gTxtS2 = T('steadier average', P ? 14 : 14, C.muted); gTxtS2.moveTo([colS, yGrp - 0.18, 0]);

  const gBoxL = new M.RoundedRectangle({ width: P ? 3.1 : 3.0, height: 0.88, cornerRadius: 0.14, color: C.pink, strokeWidth: 2 });
  gBoxL.setFill(C.card, 0.95); gBoxL.moveTo([colL, yGrp, 0]);
  const gTxtL1 = T('Large: 2 listings', P ? 15 : 16, C.pink, true, true); gTxtL1.moveTo([colL, yGrp + 0.16, 0]);
  const gTxtL2 = T('more shaky average', P ? 14 : 14, C.muted); gTxtL2.moveTo([colL, yGrp - 0.18, 0]);

  const grpInfo = new M.VGroup(gBoxS, gTxtS1, gTxtS2, gBoxL, gTxtL1, gTxtL2);
  await until(S(24));
  await play(new M.FadeIn(grpInfo, { runTime: 0.8 }), ...say('MORE LISTINGS → LESS VARIATION', C.cyan));

  // --- BEAT 25: Usual method: divide shared spread by 4 for small ---
  const yDiv = P ? -1.42 : -0.88;
  const yBarU = P ? -2.25 : -1.52;
  const uDivS = T('3,400 ÷ 4', P ? 18 : 18, C.cyan, true, true);
  uDivS.moveTo([colS, yDiv, 0]);
  await until(S(25));
  await play(
    new M.FadeIn(uDivS, { runTime: 0.7 }),
    ...fbox(['USUAL: shared = 3,400', ['Small: 3,400 ÷ 4', C.cyan]], C.cyan),
    ...say('SMALL PART: 3,400 ÷ 4', C.cyan)
  );

  // --- BEAT 26: That gives 850 (short beat: 2.01s) ---
  const uBarSR = new M.Rectangle({ width: 1.45, height: 0.44, color: C.cyan, strokeWidth: 2 });
  uBarSR.setFill(C.cyan, 0.35); uBarSR.moveTo([colS, yBarU, 0]);
  const uBarST = T('850', P ? 19 : 19, C.cyan, true, true); uBarST.moveTo([colS, yBarU, 0]);
  const uBarS = new M.VGroup(uBarSR, uBarST);
  await until(S(26));
  await play(
    new M.FadeIn(uBarS, { runTime: 0.6 }),
    ...fbox(['USUAL: shared = 3,400', ['Small: 3,400 ÷ 4 = 850', C.cyan]], C.cyan),
    ...say('SMALL PART = 850', C.cyan)
  );

  // --- BEAT 27: Divide shared spread by 2 for large ---
  const uDivL = T('3,400 ÷ 2', P ? 18 : 18, C.pink, true, true);
  uDivL.moveTo([colL, yDiv, 0]);
  await until(S(27));
  await play(
    new M.FadeIn(uDivL, { runTime: 0.7 }),
    ...fbox(['Small: 3,400 ÷ 4 = 850', ['Large: 3,400 ÷ 2', C.pink]], C.pink),
    ...say('LARGE PART: 3,400 ÷ 2', C.pink)
  );

  // --- BEAT 28: That gives 1,700 (2.58s) ---
  const uBarLR = new M.Rectangle({ width: 2.55, height: 0.44, color: C.pink, strokeWidth: 2 });
  uBarLR.setFill(C.pink, 0.35); uBarLR.moveTo([colL, yBarU, 0]);
  const uBarLT = T('1,700', P ? 19 : 19, C.pink, true, true); uBarLT.moveTo([colL, yBarU, 0]);
  const uBarL = new M.VGroup(uBarLR, uBarLT);
  await until(S(28));
  await play(
    new M.FadeIn(uBarL, { runTime: 0.6 }),
    ...fbox(['Small: 3,400 ÷ 4 = 850', ['Large: 3,400 ÷ 2 = 1,700', C.pink]], C.pink),
    ...say('LARGE PART = 1,700', C.pink)
  );

  // --- BEAT 29: Both spreads contribute ---
  const plusSign = T('+', P ? 28 : 28, C.amber, true, true);
  plusSign.moveTo([CX, yBarU, 0]);
  await until(S(29));
  await play(
    new M.FadeIn(plusSign, { runTime: 0.6 }),
    new M.Indicate(uBarS, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(uBarL, { color: C.amber, runTime: 0.8 }),
    ...say('BOTH GROUPS ADD UNCERTAINTY', C.amber)
  );

  // --- BEAT 30: Add the two parts -> 2,550 ---
  const yTotU = P ? -3.35 : -2.38;
  const wU1 = P ? 1.55 : 1.55, wU2 = P ? 3.10 : 3.10;
  const bxU = CX - (wU1 + wU2) / 2;
  const uSeg1 = new M.Rectangle({ width: wU1, height: 0.48, color: C.cyan, strokeWidth: 2 });
  uSeg1.setFill(C.cyan, 0.45); uSeg1.moveTo([bxU + wU1 / 2, yTotU, 0]);
  const uSeg2 = new M.Rectangle({ width: wU2, height: 0.48, color: C.pink, strokeWidth: 2 });
  uSeg2.setFill(C.pink, 0.45); uSeg2.moveTo([bxU + wU1 + wU2 / 2, yTotU, 0]);
  const uTotTxt = T('850 + 1,700 = 2,550', P ? 17 : 18, C.ink, true, true);
  uTotTxt.moveTo([CX, yTotU, 0]);
  const uTotBar = new M.VGroup(uSeg1, uSeg2, uTotTxt);

  await until(S(30));
  await play(
    new M.FadeIn(uTotBar, { runTime: 0.8 }),
    ...fbox(['Usual slope variance:', '850 + 1,700', ['= 2,550', C.amber]], C.amber),
    ...say('850 + 1,700 = 2,550', C.amber)
  );

  // --- BEAT 31: Estimated slope variance in squared dollars ---
  const uUnitTag = pill('VARIANCE = 2,550 ($²)', C.amber, P ? 15 : 16);
  uUnitTag.moveTo([CX, yTotU - (P ? 0.65 : 0.48), 0]);
  await until(S(31));
  await play(
    new M.FadeIn(uUnitTag, { runTime: 0.7 }),
    ...fbox(['Usual slope variance:', ['= 2,550 squared dollars', C.amber]], C.amber),
    ...say('SLOPE VARIANCE IN SQUARED DOLLARS', C.amber)
  );

  // --- BEAT 32: Square root definition ---
  const ySqrt = P ? -4.75 : -2.38;
  const sqrtEq = pill('? × ? = 2,550   →   √2,550', C.violet, P ? 16 : 16);
  sqrtEq.moveTo([P ? CX : CX, P ? ySqrt : yTotU - 0.48, 0]);
  await until(S(32));
  await play(
    ...(P ? [] : [new M.FadeOut(uUnitTag, { runTime: 0.4 })]),
    new M.FadeIn(sqrtEq, { runTime: 0.8 }),
    ...say('SQUARE ROOT: ? × ? = 2,550', C.violet)
  );

  // --- BEAT 33: Square root returns squared spread to dollars ---
  const sqrtUnit = pill('√($²)  =  DOLLARS ($)', C.violet, P ? 16 : 16);
  sqrtUnit.moveTo(sqrtEq.getCenter());
  await until(S(33));
  await play(
    new M.FadeOut(sqrtEq, { runTime: 0.4 }),
    new M.FadeIn(sqrtUnit, { runTime: 0.7 }),
    ...say('SQUARE ROOT RETURNS TO DOLLARS', C.violet)
  );

  // --- BEAT 34: Usual standard error ≈ $50 ---
  const uSeBadge = pill('USUAL SE = √2,550 ≈ $50', C.amber, P ? 18 : 18);
  uSeBadge.moveTo(sqrtUnit.getCenter());
  await until(S(34));
  await play(
    new M.FadeOut(sqrtUnit, { runTime: 0.4 }),
    new M.FadeIn(uSeBadge, { runTime: 0.8 }),
    ...fbox(['Usual variance = 2,550', ['Usual SE = √2,550', C.amber], ['         ≈ $50', C.amber]], C.amber),
    ...say('USUAL STANDARD ERROR ≈ $50', C.amber)
  );

  // --- BEAT 35: Now let each group supply its own spread ---
  const yRobTop = P ? 0.48 : 0.78;
  const rBaskS = mkBasket(colS, yRobTop, P ? 2.65 : 2.45, P ? 0.96 : 0.84, C.cyan, '', '');
  const rBaskST = T('Small: 800  (n=4)', P ? 15 : 15, C.cyan, true, true); rBaskST.moveTo([colS, yRobTop, 0]);
  const rBaskL = mkBasket(colL, yRobTop, P ? 2.65 : 2.45, P ? 0.96 : 0.84, C.pink, '', '');
  const rBaskLT = T('Large: 12,800 (n=2)', P ? 14 : 15, C.pink, true, true); rBaskLT.moveTo([colL, yRobTop, 0]);
  const rWall = new M.DashedLine({ start: [CX, yRobTop + 0.52, 0], end: [CX, P ? -1.75 : -0.95, 0], color: C.green });

  const oldUsual = P
    ? [slopeEq, grpInfo, uDivS, uBarS, uDivL, uBarL, plusSign, uTotBar, uUnitTag, uSeBadge]
    : [slopeEq, grpInfo, uDivS, uBarS, uDivL, uBarL, plusSign, uTotBar, uSeBadge];
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...oldUsual), { runTime: 0.6 }),
    new M.FadeIn(rBaskS, { runTime: 0.7 }), new M.FadeIn(rBaskST, { runTime: 0.7 }),
    new M.FadeIn(rBaskL, { runTime: 0.7 }), new M.FadeIn(rBaskLT, { runTime: 0.7 }),
    new M.Create(rWall, { runTime: 0.7 }),
    ...fbox(['NEW WAY: SEPARATE', 'Each group keeps', ['its own spread', C.green]], C.green),
    ...say('KEEP EACH GROUP SEPARATE', C.green)
  );

  // --- BEAT 36: First divide each group's total by its count ---
  const yR1 = P ? -0.42 : 0.00;
  const rStep1S = T('800 ÷ 4 = 200', P ? 16 : 16, C.cyan, true);
  rStep1S.moveTo([colS, yR1, 0]);
  const rStep1L = T('12,800 ÷ 2 = 6,400', P ? 15 : 16, C.pink, true);
  rStep1L.moveTo([colL, yR1, 0]);
  await until(S(36));
  await play(
    new M.FadeIn(rStep1S, { runTime: 0.7 }),
    new M.FadeIn(rStep1L, { runTime: 0.7 }),
    ...fbox(['Own squared spread:', 'Small: 800 ÷ 4 = 200', 'Large: 12,800 ÷ 2 = 6,400'], C.green),
    ...say('STEP 1: DIVIDE BY COUNT', C.green)
  );

  // --- BEAT 37: Divide by the count again for the spread of an average ---
  const yR2 = P ? -1.18 : -0.62;
  const rStep2Note = pill('DIVIDE BY COUNT AGAIN (AVERAGE)', C.green, P ? 15 : 15);
  rStep2Note.moveTo([CX, P ? -2.20 : -1.55, 0]);
  await until(S(37));
  await play(
    new M.FadeIn(rStep2Note, { runTime: 0.7 }),
    ...fbox(['Spread of an average:', 'divide by count AGAIN', ['(total ÷ count²)', C.green]], C.green),
    ...say('STEP 2: DIVIDE BY COUNT AGAIN', C.green)
  );

  // --- BEAT 38: Small group: divide 800 by 4 twice ---
  const rDivS = T('200 ÷ 4', P ? 17 : 17, C.cyan, true, true);
  rDivS.moveTo([colS - 0.35, yR2, 0]);
  await until(S(38));
  await play(
    new M.FadeIn(rDivS, { runTime: 0.6 }),
    ...fbox(['ROBUST (SEPARATE)', ['Small: 800 ÷ 4 ÷ 4', C.cyan]], C.cyan),
    ...say('SMALL: 800 ÷ 4 ÷ 4', C.cyan)
  );

  // --- BEAT 39: That gives 50 (VERY SHORT BEAT: 1.34s!) ---
  const rValS = T('= 50', P ? 19 : 20, C.cyan, true, true);
  rValS.moveTo([colS + 0.62, yR2, 0]);
  await until(S(39));
  await play(
    new M.FadeIn(rValS, { runTime: 0.5 }),
    ...fbox(['ROBUST (SEPARATE)', ['Small: 800 ÷ 4² = 50', C.cyan]], C.cyan),
    ...say('SMALL PART = 50', C.cyan)
  );

  // --- BEAT 40: Large group: divide 12,800 by 2, then by 2 again ---
  const rDivL = T('6,400 ÷ 2', P ? 17 : 17, C.pink, true, true);
  rDivL.moveTo([colL - 0.55, yR2, 0]);
  await until(S(40));
  await play(
    new M.FadeIn(rDivL, { runTime: 0.6 }),
    ...fbox(['Small: 800 ÷ 4² = 50', ['Large: 12,800 ÷ 2 ÷ 2', C.pink]], C.pink),
    ...say('LARGE: 12,800 ÷ 2 ÷ 2', C.pink)
  );

  // --- BEAT 41: That gives 3,200 (2.52s) ---
  const rValL = T('= 3,200', P ? 19 : 20, C.pink, true, true);
  rValL.moveTo([colL + 0.72, yR2, 0]);
  await until(S(41));
  await play(
    new M.FadeIn(rValL, { runTime: 0.6 }),
    ...fbox(['Small: 800 ÷ 4² = 50', ['Large: 12,800 ÷ 2² = 3,200', C.pink]], C.pink),
    ...say('LARGE PART = 3,200', C.pink)
  );

  // --- BEAT 42: Add the two parts -> 3,250 (compare bars side-by-side) ---
  const barX0 = P ? -3.35 : -4.65;
  const barScale = (P ? 4.75 : 4.25) / 3400;
  const yCmpU = P ? -2.85 : -1.58;
  const yCmpR = P ? -4.15 : -2.38;

  const uLab = T('Usual', P ? 16 : 16, C.amber, true, true);
  uLab.moveTo([P ? barX0 + 0.45 : barX0 - 0.62, P ? yCmpU + 0.42 : yCmpU, 0]);
  const wCU1 = 850 * barScale, wCU2 = 1700 * barScale;
  const cUS1 = new M.Rectangle({ width: wCU1, height: 0.42, color: C.cyan, strokeWidth: 1.5 });
  cUS1.setFill(C.cyan, 0.55); cUS1.moveTo([barX0 + wCU1 / 2, yCmpU, 0]);
  const cUS2 = new M.Rectangle({ width: wCU2, height: 0.42, color: C.pink, strokeWidth: 1.5 });
  cUS2.setFill(C.pink, 0.55); cUS2.moveTo([barX0 + wCU1 + wCU2 / 2, yCmpU, 0]);
  const cUTxt = T('2,550', P ? 15 : 16, C.ink, true, true);
  cUTxt.moveTo([barX0 + (wCU1 + wCU2) / 2, yCmpU, 0]);
  const cmpUsualVar = new M.VGroup(uLab, cUS1, cUS2, cUTxt);

  const rLab = T('Robust', P ? 16 : 16, C.green, true, true);
  rLab.moveTo([P ? barX0 + 0.52 : barX0 - 0.62, P ? yCmpR + 0.42 : yCmpR, 0]);
  const wCR1 = Math.max(0.12, 50 * barScale), wCR2 = 3200 * barScale;
  const cRS1 = new M.Rectangle({ width: wCR1, height: 0.42, color: C.cyan, strokeWidth: 1.5 });
  cRS1.setFill(C.cyan, 0.75); cRS1.moveTo([barX0 + wCR1 / 2, yCmpR, 0]);
  const cRS2 = new M.Rectangle({ width: wCR2, height: 0.42, color: C.pink, strokeWidth: 1.5 });
  cRS2.setFill(C.pink, 0.55); cRS2.moveTo([barX0 + wCR1 + wCR2 / 2, yCmpR, 0]);
  const cRTxt = T('50 + 3,200 = 3,250', P ? 15 : 16, C.ink, true, true);
  cRTxt.moveTo([barX0 + (wCR1 + wCR2) / 2, yCmpR, 0]);
  const cmpRobVar = new M.VGroup(rLab, cRS1, cRS2, cRTxt);

  await until(S(42));
  await play(
    new M.FadeOut(rStep2Note, { runTime: 0.4 }),
    new M.FadeIn(cmpUsualVar, { runTime: 0.7 }),
    new M.FadeIn(cmpRobVar, { runTime: 0.8 }),
    ...fbox(['Robust slope variance:', '50 + 3,200', ['= 3,250', C.green]], C.green),
    ...say('50 + 3,200 = 3,250', C.green)
  );

  // --- BEAT 43: Square root gives about $57 ---
  const seX = P ? 2.50 : 0.65;
  const cmpUsualSE = pill('≈ $50', C.amber, P ? 16 : 16); cmpUsualSE.moveTo([seX, yCmpU, 0]);
  const cmpRobSE = pill('≈ $57', C.green, P ? 16 : 16); cmpRobSE.moveTo([seX, yCmpR, 0]);
  await until(S(43));
  await play(
    new M.FadeIn(cmpUsualSE, { runTime: 0.6 }),
    new M.FadeIn(cmpRobSE, { runTime: 0.7 }),
    ...fbox(['Usual  SE = √2,550 ≈ $50', ['Robust SE = √3,250 ≈ $57', C.green]], C.green),
    ...say('ROBUST SE = √3,250 ≈ $57', C.green)
  );

  // --- BEAT 44: Called a robust standard error ---
  const robFrame = new M.RoundedRectangle({
    width: P ? 7.1 : 7.0, height: P ? 1.10 : 0.68, cornerRadius: 0.14, color: C.green, strokeWidth: 2.5
  });
  robFrame.moveTo([P ? 0 : CX + 0.15, P ? yCmpR + 0.14 : yCmpR, 0]);
  await until(S(44));
  await play(
    new M.Create(robFrame, { runTime: 0.8 }),
    new M.Indicate(cmpRobSE, { color: C.green, runTime: 0.8 }),
    ...say('ROBUST STANDARD ERROR', C.green)
  );

  // --- BEAT 45: HC0 is the name of this version ---
  const hc0Tag = pill('HC0', C.green, P ? 15 : 15);
  hc0Tag.moveTo([P ? barX0 + 1.55 : barX0 - 0.62, P ? yCmpR + 0.42 : yCmpR - 0.56, 0]);
  await until(S(45));
  await play(
    new M.FadeIn(hc0Tag, { runTime: 0.7 }),
    ...fbox([['HC0 (robust SE)', C.green], 'Usual  SE ≈ $50', ['HC0    SE ≈ $57', C.green]], C.green),
    ...say('THIS VERSION IS CALLED HC0', C.green)
  );

  // --- BEAT 46: Formula: robust slope variance = two group contributions added ---
  await until(S(46));
  await play(
    new M.Indicate(rValS, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(rValL, { color: C.pink, runTime: 0.8 }),
    ...fbox([['HC0 slope variance =', C.green], '  small part + large part'], C.green),
    ...say('FORMULA: ADD BOTH GROUP PARTS', C.green)
  );

  // --- BEAT 47: Each contribution = total squared gaps / count^2 ---
  await until(S(47));
  await play(
    new M.Indicate(rBaskS, { color: C.cyan, runTime: 0.7 }),
    new M.Indicate(rBaskL, { color: C.pink, runTime: 0.7 }),
    ...fbox([
      ['each part = gaps² ÷ count²', C.green],
      ['  = 800÷4² + 12,800÷2²', C.muted],
      ['  = 50 + 3,200 = 3,250', C.ink],
      ['HC0 SE = √3,250 ≈ $57', C.green],
    ], C.green),
    ...say('EACH PART = SQUARED GAPS ÷ COUNT²', C.green)
  );

  // --- BEAT 48: Use robust SE when error spread may differ ---
  const fAxes = buildAxes();
  const fDotsS = sPos.map(([x, y]) => mkDot(x, y, C.cyan, P ? 0.095 : 0.085));
  const fDotsL = lPos.map(([x, y]) => mkDot(x, y, C.pink, P ? 0.095 : 0.085));
  const fLine = new M.Line({ start: [x40, yOf(1000), 0], end: [x60, yOf(1400), 0], color: C.amber, strokeWidth: 4 });
  const fCS = new M.Line({ start: [x40 - 0.42, yOf(1000), 0], end: [x40 + 0.42, yOf(1000), 0], color: C.cyan, strokeWidth: 3 });
  const fCL = new M.Line({ start: [x60 - 0.42, yOf(1400), 0], end: [x60 + 0.42, yOf(1400), 0], color: C.pink, strokeWidth: 3 });
  const finalPlot = new M.VGroup(fAxes, ...fDotsS, ...fDotsL, fCS, fCL, fLine);

  const bxU2 = x60 + 0.78, bxR2 = x60 + 1.38;
  const bandUsual = new M.VGroup(
    new M.Line({ start: [bxU2, yOf(1350), 0], end: [bxU2, yOf(1450), 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [bxU2 - 0.09, yOf(1450), 0], end: [bxU2 + 0.09, yOf(1450), 0], color: C.amber, strokeWidth: 2.5 }),
    new M.Line({ start: [bxU2 - 0.09, yOf(1350), 0], end: [bxU2 + 0.09, yOf(1350), 0], color: C.amber, strokeWidth: 2.5 }),
    T('±$50', 16, C.amber, true, true).moveTo([bxU2, yOf(1350) - 0.24, 0])
  );
  const bandRobust = new M.VGroup(
    new M.Line({ start: [bxR2, yOf(1343), 0], end: [bxR2, yOf(1457), 0], color: C.green, strokeWidth: 3.5 }),
    new M.Line({ start: [bxR2 - 0.09, yOf(1457), 0], end: [bxR2 + 0.09, yOf(1457), 0], color: C.green, strokeWidth: 3 }),
    new M.Line({ start: [bxR2 - 0.09, yOf(1343), 0], end: [bxR2 + 0.09, yOf(1343), 0], color: C.green, strokeWidth: 3 }),
    T('±$57', 16, C.green, true, true).moveTo([bxR2, yOf(1457) + 0.24, 0])
  );

  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(
      rBaskS, rBaskST, rBaskL, rBaskLT, rWall, rStep1S, rStep1L, rDivS, rValS, rDivL, rValL,
      cmpUsualVar, cmpRobVar, cmpUsualSE, cmpRobSE, robFrame, hc0Tag
    ), { runTime: 0.6 }),
    new M.FadeIn(finalPlot, { runTime: 0.8 }),
    new M.FadeIn(bandUsual, { runTime: 0.8 }),
    new M.FadeIn(bandRobust, { runTime: 0.8 }),
    ...say('USE WHEN SPREADS DIFFER', C.green)
  );

  // --- BEAT 49: With so few listings, even this estimate can be shaky ---
  const shakyBox = new M.RoundedRectangle({ width: 0.92, height: yOf(1480) - yOf(1320) + 0.52, cornerRadius: 0.16, color: C.pink, strokeWidth: 2.5 });
  shakyBox.moveTo([x60, yOf(1400), 0]);
  const shakyLbl = T('only 2 listings!', P ? 14 : 15, C.pink, true, true);
  shakyLbl.moveTo([x60 - 0.15, yOf(1480) + 0.44, 0]);
  const shakyRing = new M.VGroup(shakyBox, shakyLbl);
  await until(S(49));
  await play(
    new M.Create(shakyBox, { runTime: 0.7 }),
    new M.FadeIn(shakyLbl, { runTime: 0.7 }),
    ...fbox(['Small-sample caveat:', 'only 2 large listings', ['estimate can be shaky', C.pink]], C.pink),
    ...say('FEW LISTINGS → STILL SHAKY', C.pink)
  );

  // --- BEAT 50: Slope stays $400 either way ---
  const slopeLock = pill('SLOPE = +$400 (SAME)', C.amber, P ? 15 : 16);
  slopeLock.moveTo([x40 + (P ? 0.5 : 0.6), yOf(1400), 0]);
  await until(S(50));
  await play(
    new M.FadeOut(shakyRing, { runTime: 0.5 }),
    new M.FadeIn(slopeLock, { runTime: 0.7 }),
    new M.Indicate(fLine, { color: C.amber, runTime: 1.0 }),
    ...fbox(['Line stays unchanged:', '40 m² → $1,000', '60 m² → $1,400', ['Slope = +$400 either way', C.amber]], C.amber),
    ...say('SLOPE STAYS $400 — ONLY SE CHANGES', C.amber)
  );

  // --- BEAT 51: Recap ---
  await until(S(51));
  await play(
    new M.Indicate(bandRobust, { color: C.green, runTime: 1.0 }),
    ...fbox(['Slope = +$400 (unchanged)', 'Usual  SE ≈ $50', ['Robust SE ≈ $57 (HC0)', C.green]], C.green),
    ...say('ROBUST SE: HONEST UNCERTAINTY', C.green)
  );
}

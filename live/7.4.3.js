// 7.4.3 Normality checks and sample size.
// Beat i = sentence i (0-based, 58 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Layout constants: laptop 14.22 x 8 (y in [-3.0, 2.3]), phone 8 x 14.22 (y in [-5.5, 4.3])
  const CX = P ? 0 : -1.75;
  const PW = P ? 6.5 : 8.2;
  const X0 = CX - PW / 2, X1 = CX + PW / 2;
  const BASE = P ? -3.3 : -2.1;
  const BH = P ? 3.1 : 2.75;
  const PILL = P ? [0, 1.72, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.75, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box: one box at a time; lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 3.9;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.7 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.5 })];
  }

  // Coordinate & geometry helpers
  const g2x = (v, lo = 22, hi = 38) => X0 + ((v - lo) / (hi - lo)) * PW;
  const gauss = (x, mu, sd) => Math.exp(-0.5 * ((x - mu) / sd) ** 2);

  function makeAxis(y = BASE, lo = 22, hi = 38, ticks = [22, 26, 30, 34, 38], unit = 'grams', x0 = X0, x1 = X1) {
    const mapX = v => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const items = [new M.Line({ start: [x0, y, 0], end: [x1, y, 0], color: C.muted, strokeWidth: 3 })];
    ticks.forEach(v => {
      const tx = mapX(v);
      items.push(new M.Line({ start: [tx, y - 0.08, 0], end: [tx, y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const lb = T(String(v), P ? 15 : 17, C.muted, true);
      lb.moveTo([tx, y - 0.34, 0]);
      items.push(lb);
    });
    if (unit) {
      const u = T(unit, P ? 16 : 16, C.muted);
      u.moveTo([x1 - 0.35, y - 0.66, 0]);
      items.push(u);
    }
    return new M.VGroup(...items);
  }

  function makeDot(x, y, col, label = '', r = 0.12) {
    const halo = new M.Dot({ point: [x, y, 0], radius: r * 2.2, color: col });
    halo.setFill(col, 0.18);
    const core = new M.Dot({ point: [x, y, 0], radius: r, color: col });
    const parts = [halo, core];
    if (label !== '') {
      const lb = T(String(label), P ? 15 : 17, col, true);
      lb.moveTo([x, y + 0.36, 0]);
      parts.push(lb);
    }
    return new M.VGroup(...parts);
  }

  function bellLines(mu, sd, y0 = BASE, h = BH, col = C.cyan, sw = 3, segs = 40, lo = 22, hi = 38, x0 = X0, x1 = X1) {
    const mapX = v => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const out = [];
    for (let i = 0; i < segs; i++) {
      const v1 = lo + (hi - lo) * (i / segs), v2 = lo + (hi - lo) * ((i + 1) / segs);
      out.push(new M.Line({
        start: [mapX(v1), y0 + h * gauss(v1, mu, sd), 0],
        end: [mapX(v2), y0 + h * gauss(v2, mu, sd), 0],
        color: col, strokeWidth: sw
      }));
    }
    return out;
  }

  function makeBar(cx, y0, w, h, col, op = 0.78) {
    const bh = Math.max(0.03, h);
    const r = new M.Rectangle({ width: w, height: bh, color: col, strokeWidth: 1 });
    r.setFill(col, op);
    r.moveTo([cx, y0 + bh / 2, 0]);
    return r;
  }

  // ==================== ACT 1 (0-5): THREE SHIFTS & ASSUMED SHAPE ====================
  const ax1 = makeAxis(BASE, 22, 38, [24, 26, 28, 30, 32, 34, 36], 'grams');
  const RY = P ? [3.4, 2.1, 0.8] : [2.55, 1.5, 0.45];
  // target line in pieces, with gaps where the "30" labels sit
  const tSegs = [[0, RY[2] - 0.26], [RY[2] + 0.54, RY[1] - 0.26], [RY[1] + 0.54, RY[0] - 0.26], [RY[0] + 0.54, RY[0] + 0.85]];
  const target30 = new M.VGroup(...tSegs.map(([a, b]) => new M.DashedLine({ start: [g2x(30), BASE + a, 0], end: [g2x(30), BASE + b, 0], color: C.muted })));
  const targetLbl = T('target 30 g', P ? 16 : 15, C.muted, true);
  targetLbl.moveTo([g2x(30) + 0.15 + targetLbl.getWidth() / 2, BASE + RY[0] + 0.8, 0]);

  const shifts = [
    { name: 'Morning', vals: [29, 30, 31], col: C.amber, y: BASE + RY[0] },
    { name: 'Afternoon', vals: [28, 30, 32], col: C.green, y: BASE + RY[1] },
    { name: 'Night', vals: [26, 30, 34], col: C.violet, y: BASE + RY[2] }
  ];
  const valLabs = [];
  const shiftRows = shifts.map((sh, si) => {
    const rowLine = new M.Line({ start: [X0, sh.y, 0], end: [X1, sh.y, 0], color: C.line, strokeWidth: 1.5 });
    const nameT = T(sh.name, P ? 16 : 16, sh.col, false, true);
    nameT.moveTo([X0 + nameT.getWidth() / 2 + 0.08, sh.y + 0.3, 0]);
    const ds = sh.vals.map(v => makeDot(g2x(v), sh.y, sh.col, '', 0.11));
    // morning dots are close together: outer labels go below the line, the middle one above
    const ls = sh.vals.map((v, j) => {
      const t = T(String(v), P ? 16 : 17, sh.col, true);
      t.moveTo([g2x(v), sh.y + (si === 0 && j !== 1 ? -0.36 : 0.36), 0]);
      return t;
    });
    valLabs.push(...ls);
    return new M.VGroup(rowLine, nameT, ...ds, ...ls);
  });

  await until(S(0));
  await play(
    new M.Create(ax1, { runTime: 0.8 }),
    new M.Create(target30, { runTime: 0.7 }),
    new M.FadeIn(targetLbl, { runTime: 0.7 }),
    new M.LaggedStart(shiftRows.map(r => new M.FadeIn(r)), { lagRatio: 0.25, runTime: 1.5 }),
    ...say('3 SHIFTS · TARGET 30 g', C.cyan)
  );

  // Beat 1: test compares shift averages
  const avgMarks = shifts.map(sh => {
    const ring = new M.Circle({ radius: 0.19, color: C.ink, strokeWidth: 2.5 });
    ring.moveTo([g2x(30), sh.y, 0]);
    return ring;
  });
  await until(S(1));
  await play(
    new M.LaggedStart(avgMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.18, runTime: 0.9 }),
    ...fbox([['Morning   avg = 30 g', C.amber], ['Afternoon avg = 30 g', C.green], ['Night     avg = 30 g', C.violet]], C.amber),
    ...say('COMPARE SHIFT AVERAGES', C.amber)
  );

  // Beat 2: average = fair share
  const shareL = new M.Line({ start: [g2x(26) + 0.18, shifts[2].y, 0], end: [g2x(30) - 0.24, shifts[2].y, 0], color: C.amber, strokeWidth: 3 });
  const shareR = new M.Line({ start: [g2x(34) - 0.18, shifts[2].y, 0], end: [g2x(30) + 0.24, shifts[2].y, 0], color: C.amber, strokeWidth: 3 });
  await until(S(2));
  await play(
    new M.Create(shareL, { runTime: 0.7 }),
    new M.Create(shareR, { runTime: 0.7 }),
    ...fbox([['average = fair share', C.ink], ['(26+30+34) ÷ 3 = 30 g', C.amber]], C.amber),
    ...say('AVERAGE = FAIR SHARE', C.amber)
  );

  // Beat 3: quietly assumes a shape
  const shiftBells = shifts.map((sh, idx) => {
    const sd = [1.1, 1.8, 3.0][idx];
    const segs = bellLines(30, sd, sh.y, 0.56, sh.col, 2, 24);
    segs.forEach(l => l.setStrokeOpacity(0.75));
    return new M.VGroup(...segs);
  });
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(shareL, shareR), { runTime: 0.4 }),
    ...valLabs.map(t => new M.FadeOut(t, { runTime: 0.4 })),
    new M.LaggedStart(shiftBells.map(b => new M.FadeIn(b)), { lagRatio: 0.2, runTime: 1.2 }),
    ...say('HIDDEN ASSUMPTION: A SHAPE', C.cyan)
  );

  // Beat 4: check one shift at a time
  const nightBox = new M.RoundedRectangle({ width: PW + 0.24, height: 0.85, cornerRadius: 0.14, color: C.violet, strokeWidth: 2.5 });
  nightBox.moveTo([CX, shifts[2].y + 0.17, 0]);
  await until(S(4));
  await play(
    new M.Create(nightBox, { runTime: 0.8 }),
    ...say('CHECK ONE SHIFT AT A TIME', C.violet)
  );

  // Beat 5 (short 1.85s): how much can such a check really tell you?
  await until(S(5));
  await play(new M.Indicate(nightBox, { color: C.amber, runTime: 0.7 }), ...say('HOW MUCH CAN IT TELL YOU?', C.amber));

  // ==================== ACT 2 (6-13): NIGHT SAMPLE & BELL (NORMAL) SHAPE ====================
  const ax2 = makeAxis(BASE, 22, 38, [22, 26, 30, 34, 38], 'grams');
  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(ax1, target30, targetLbl, ...shiftRows, ...avgMarks, ...shiftBells, nightBox), { runTime: 0.6 }),
    ...clearBox(),
    new M.Create(ax2, { runTime: 0.8 }),
    ...say('NIGHT SHIFT · GRAMS LINE', C.violet)
  );

  // Beat 7: 26, 30, 34
  const n3Vals = [26, 30, 34];
  const n3Dots = n3Vals.map(v => makeDot(g2x(v), BASE + 0.35, C.violet, String(v), 0.14));
  await until(S(7));
  await play(
    new M.LaggedStart(n3Dots.map(d => new M.FadeIn(d)), { lagRatio: 0.45, runTime: 2.2 }),
    ...say('26 g   ·   30 g   ·   34 g', C.violet)
  );

  // Beat 8: sample out of all cookies baked
  const cloudPts = [
    [24.2, 1.3], [25.1, 1.7], [25.8, 1.15], [26.5, 2.0], [27.2, 1.4], [27.8, 2.2],
    [28.5, 1.6], [29.0, 2.35], [29.4, 1.25], [29.9, 1.9], [30.3, 2.45], [30.8, 1.5],
    [31.3, 2.15], [31.9, 1.3], [32.4, 1.85], [33.1, 1.2], [33.7, 1.95], [34.5, 1.45],
    [35.2, 1.15], [35.9, 1.65], [27.0, 2.3], [32.8, 2.2]
  ];
  const cloudDots = cloudPts.map(([v, dy]) => {
    const d = new M.Dot({ point: [g2x(v), BASE + dy, 0], radius: 0.06, color: C.muted });
    d.setFill(C.muted, 0.55);
    return d;
  });
  const cloudLbl = T('all cookies baked by night shift', P ? 14 : 15, C.muted);
  cloudLbl.moveTo([CX, BASE + 2.75, 0]);
  const sampBox = new M.RoundedRectangle({ width: g2x(34) - g2x(26) + 0.9, height: 0.95, cornerRadius: 0.14, color: C.violet, strokeWidth: 2 });
  sampBox.moveTo([g2x(30), BASE + 0.46, 0]);
  await until(S(8));
  await play(
    new M.LaggedStart(cloudDots.map(d => new M.FadeIn(d)), { lagRatio: 0.03, runTime: 0.9 }),
    new M.FadeIn(cloudLbl, { runTime: 0.7 }),
    new M.Create(sampBox, { runTime: 0.8 }),
    ...fbox([['sample = few we weighed', C.violet], ['out of all baked', C.muted]], C.violet),
    ...say('A SAMPLE OF THE SHIFT', C.violet)
  );

  // Beat 9: sample size = 3
  const cntTags = n3Vals.map((v, i) => {
    const t = T(String(i + 1), P ? 15 : 16, C.amber, true);
    t.moveTo([g2x(v), BASE + 1.08, 0]);
    return t;
  });
  await until(S(9));
  await play(
    new M.LaggedStart(cntTags.map(t => new M.FadeIn(t)), { lagRatio: 0.25, runTime: 1.0 }),
    ...fbox([['sample = 26, 30, 34 g', C.violet], ['sample size (n) = 3', C.amber]], C.amber),
    ...say('SAMPLE SIZE = 3', C.amber)
  );

  // Beat 10: stacking thousands of cookies
  const nBins = 21, binW = (PW / nBins) * 0.82;
  const stackBars = Array.from({ length: nBins }, (_, i) => {
    const v = 22 + (i + 0.5) * (16 / nBins);
    const h = BH * gauss(v, 30, 2.5);
    return makeBar(g2x(v), BASE, binW, h, C.cyan, 0.52);
  });
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...n3Dots, ...cloudDots, cloudLbl, sampBox, ...cntTags), { runTime: 0.5 }),
    ...clearBox(),
    new M.LaggedStart(stackBars.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('STACK THOUSANDS OF COOKIES', C.cyan)
  );

  // Beat 11: tallest in middle, shrink evenly like a bell
  const bellSegs = bellLines(30, 2.5, BASE, BH, C.cyan, 3.5, 40);
  const midLine = new M.DashedLine({ start: [g2x(30), BASE, 0], end: [g2x(30), BASE + BH + 0.25, 0], color: C.amber });
  await until(S(11));
  await play(
    new M.LaggedStart(bellSegs.map(l => new M.Create(l)), { lagRatio: 0.02, runTime: 1.4 }),
    new M.Create(midLine, { runTime: 0.8 }),
    ...say('TALL MIDDLE · EVEN SIDES = BELL', C.cyan)
  );

  // Beat 12: called normal (just a name)
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...stackBars), { runTime: 0.6 }),
    ...fbox([['"normal" = bell shape', C.cyan], ['just a name,', C.muted], ['not "ordinary"', C.muted]], C.cyan),
    ...say('NORMAL = BELL SHAPE', C.cyan)
  );

  // Beat 13: normality check
  await until(S(13));
  await play(
    new M.Indicate(midLine, { color: C.green, runTime: 0.8 }),
    ...say('NORMALITY CHECK', C.green)
  );

  // ==================== ACT 3 (14-27): SLICES, SPOTS, W & P-VALUE ====================
  // Beat 14: take a perfect bell and centre it on your average
  const offSegs = bellLines(27.2, 1.5, BASE, BH, C.cyan, 3.5, 40);
  const cenSegs = bellLines(30.0, 1.5, BASE, BH, C.cyan, 3.5, 40);
  const avgLbl2 = T('avg = 30', P ? 15 : 16, C.amber, true);
  avgLbl2.moveTo([g2x(30), BASE + BH + 0.45, 0]);
  await until(S(14));
  await play(
    ...bellSegs.map((ln, i) => new M.Transform(ln, offSegs[i], { runTime: 0.6 })),
    new M.FadeIn(avgLbl2, { runTime: 0.6 }),
    ...fbox([['1. centre bell on avg', C.cyan]], C.cyan),
    ...say('CENTRE BELL ON YOUR AVERAGE', C.cyan)
  );
  await play(...bellSegs.map((ln, i) => new M.Transform(ln, cenSegs[i], { runTime: 1.0 })));

  // Beat 15: widen or narrow to match spread
  const wideSegs = bellLines(30.0, 2.5, BASE, BH, C.cyan, 3.5, 40);
  const spY = BASE + BH * 0.45;
  const spLine = new M.Line({ start: [g2x(27.5), spY, 0], end: [g2x(32.5), spY, 0], color: C.amber, strokeWidth: 2.5 });
  const spLbl = T('match spread', P ? 14 : 15, C.amber);
  spLbl.moveTo([g2x(30), spY + 0.25, 0]);
  await until(S(15));
  await play(
    ...bellSegs.map((ln, i) => new M.Transform(ln, wideSegs[i], { runTime: 1.1 })),
    new M.Create(spLine, { runTime: 0.8 }),
    new M.FadeIn(spLbl, { runTime: 0.8 }),
    ...fbox([['1. centre bell on avg', C.muted], ['2. match your spread', C.cyan]], C.cyan),
    ...say('MATCH YOUR SPREAD', C.cyan)
  );

  // Beat 16: cut bell into 5 equal-area slices (quantiles 0.2, 0.4, 0.6, 0.8)
  const cutZ5 = [-0.8416, -0.2533, 0.2533, 0.8416];
  const cutV5 = cutZ5.map(z => 30 + z * 2.5);
  const sliceCols = [C.violet, C.cyan, C.amber, C.cyan, C.violet];
  const sliceStrips = [];
  const nStrips = 50;
  for (let i = 0; i < nStrips; i++) {
    const v = 22.5 + (i + 0.5) * (15 / nStrips);
    const sIdx = cutV5.filter(c => v > c).length;
    const h = BH * gauss(v, 30, 2.5);
    if (h > 0.04) sliceStrips.push(makeBar(g2x(v), BASE, (PW * 15 / 16) / nStrips, h, sliceCols[sIdx], 0.26));
  }
  const sliceCuts = cutV5.map(v => new M.Line({
    start: [g2x(v), BASE, 0], end: [g2x(v), BASE + BH * gauss(v, 30, 2.5), 0], color: C.ink, strokeWidth: 2
  }));
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(spLine, spLbl, midLine, avgLbl2), { runTime: 0.4 }),
    new M.LaggedStart(sliceStrips.map(b => new M.FadeIn(b)), { lagRatio: 0.01, runTime: 0.9 }),
    new M.LaggedStart(sliceCuts.map(l => new M.Create(l)), { lagRatio: 0.12, runTime: 0.9 }),
    ...fbox([['1. centre bell on avg', C.muted], ['2. match your spread', C.muted], ['3. equal-count slices', C.amber]], C.amber),
    ...say('EQUAL-COUNT SLICES', C.amber)
  );

  // Beat 17: middle slices narrow, edge slices wide
  const narrowTag = T('narrow', P ? 14 : 15, C.amber, true);
  narrowTag.moveTo([g2x(30), BASE + BH + 0.34, 0]);
  const wideL = T('wide', P ? 14 : 15, C.violet, true);
  wideL.moveTo([g2x(25.8), BASE + 1.05, 0]);
  const wideR = T('wide', P ? 14 : 15, C.violet, true);
  wideR.moveTo([g2x(34.2), BASE + 1.05, 0]);
  await until(S(17));
  await play(
    new M.FadeIn(narrowTag, { runTime: 0.7 }),
    new M.FadeIn(wideL, { runTime: 0.7 }),
    new M.FadeIn(wideR, { runTime: 0.7 }),
    ...say('NARROW MIDDLE · WIDE EDGES', C.amber)
  );

  // Beat 18: mark centre of each slice -> expected spots
  const spotZ5 = [-1.2816, -0.5244, 0, 0.5244, 1.2816];
  const spotV5 = spotZ5.map(z => 30 + z * 2.5);
  const spotDrops = spotV5.map(v => new M.DashedLine({
    start: [g2x(v), BASE + BH * gauss(v, 30, 2.5) * 0.65, 0], end: [g2x(v), BASE + 0.25, 0], color: C.amber
  }));
  const spotRings = spotV5.map(v => {
    const c = new M.Circle({ radius: 0.14, color: C.amber, strokeWidth: 3 });
    c.setFill(C.bg, 0.9);
    c.moveTo([g2x(v), BASE + 0.25, 0]);
    return c;
  });
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(narrowTag, wideL, wideR), { runTime: 0.4 }),
    new M.LaggedStart(spotDrops.map(d => new M.Create(d)), { lagRatio: 0.1, runTime: 0.9 }),
    new M.LaggedStart(spotRings.map(r => new M.FadeIn(r)), { lagRatio: 0.12, runTime: 1.0 }),
    ...say('EXPECTED BELL SPOTS', C.amber)
  );

  // Beat 19: sort values and lay them over those spots
  const exVals = [26.2, 28.9, 30.3, 31.1, 33.6];
  const exDots = exVals.map(v => makeDot(g2x(v), BASE + 0.25, C.cyan, '', 0.09));
  const gapBars = exVals.map((v, i) => new M.Line({
    start: [g2x(spotV5[i]), BASE + 0.62, 0], end: [g2x(v), BASE + 0.62, 0], color: C.pink, strokeWidth: 4
  }));
  await until(S(19));
  await play(
    new M.LaggedStart(exDots.map(d => new M.FadeIn(d)), { lagRatio: 0.12, runTime: 1.0 }),
    new M.LaggedStart(gapBars.map(g => new M.Create(g)), { lagRatio: 0.1, runTime: 0.8 }),
    ...fbox([['lay sorted values', C.cyan], ['on expected spots', C.amber], ['closer = better match', C.green]], C.green),
    ...say('CLOSER TO SPOTS = BETTER MATCH', C.green)
  );

  // Beat 20: Shapiro-Wilk test
  await until(S(20));
  await play(
    ...fbox([['Shapiro–Wilk test', C.cyan], ['named for its', C.muted], ['two inventors', C.muted]], C.cyan),
    ...say('SHAPIRO–WILK TEST', C.cyan)
  );

  // Beat 21: match score W from 0 to 1
  const mY = BASE + 0.7;
  const wTrack = new M.Line({ start: [X0 + 0.4, mY, 0], end: [X1 - 0.4, mY, 0], color: C.muted, strokeWidth: 6 });
  const w2x = w => (X0 + 0.4) + w * (PW - 0.8);
  const wTicks = [0, 0.5, 1].map(v => new M.VGroup(
    new M.Line({ start: [w2x(v), mY - 0.14, 0], end: [w2x(v), mY + 0.14, 0], color: C.ink, strokeWidth: 2 }),
    T(String(v), P ? 17 : 18, C.ink, true).moveTo([w2x(v), mY - 0.42, 0])
  ));
  const wHead = T('W  (match score)', P ? 17 : 19, C.cyan, true);
  wHead.moveTo([CX, mY - 0.92, 0]);
  const wMarker = new M.Dot({ point: [w2x(0.95), mY, 0], radius: 0.16, color: C.cyan });
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(ax2, ...bellSegs, ...sliceStrips, ...sliceCuts, ...spotDrops, ...spotRings, ...exDots, ...gapBars), { runTime: 0.6 }),
    new M.Create(wTrack, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(...wTicks, wHead, wMarker), { runTime: 0.7 }),
    ...fbox([['W = match score', C.cyan], ['runs from 0 to 1', C.ink]], C.cyan),
    ...say('MATCH SCORE W : 0 TO 1', C.cyan)
  );

  // Beat 22: W = 1 exact match, below 1 = some mismatch
  const demoY = mY + 1.35;
  const demoXs = [-2.2, -0.9, 0, 0.9, 2.2].map(dx => CX + dx * (P ? 0.95 : 1.05));
  const demoRings = demoXs.map(x => {
    const c = new M.Circle({ radius: 0.15, color: C.amber, strokeWidth: 3 });
    c.setFill(C.bg, 0.9); c.moveTo([x, demoY, 0]); return c;
  });
  const demoDots = demoXs.map(x => new M.Dot({ point: [x, demoY, 0], radius: 0.09, color: C.green }));
  const wOneDot = new M.Dot({ point: [w2x(1), mY, 0], radius: 0.16, color: C.green });
  const wLowDot = new M.Dot({ point: [w2x(0.82), mY, 0], radius: 0.16, color: C.pink });
  const offShift = [-0.45, 0.35, -0.25, 0.45, -0.35];
  await until(S(22));
  await play(
    new M.FadeIn(new M.VGroup(...demoRings), { runTime: 0.5 }),
    ...demoDots.map(d => new M.FadeIn(d, { runTime: 0.5 })),
    new M.Transform(wMarker, wOneDot, { runTime: 0.7 }),
    ...fbox([['W = 1 → exact fit', C.green], ['W < 1 → mismatch', C.pink]], C.green),
    ...say('W = 1: EXACT  ·  W < 1: MISMATCH', C.green)
  );
  await play(
    new M.Transform(wMarker, wLowDot, { runTime: 1.0 }),
    ...demoDots.map((d, i) => new M.Transform(d, new M.Dot({ point: [demoXs[i] + offShift[i], demoY, 0], radius: 0.09, color: C.pink }), { runTime: 1.0 }))
  );

  // Beat 23: p-value -> sample a true bell again and again
  const simBase = BASE + 0.15;
  const simAx = new M.Line({ start: [X0 + 0.2, simBase, 0], end: [X1 - 0.2, simBase, 0], color: C.muted, strokeWidth: 2.5 });
  const simLblL = T('small mismatch', P ? 13 : 14, C.muted);
  simLblL.moveTo([X0 + 1.05, simBase - 0.34, 0]);
  const simLblR = T('big mismatch →', P ? 13 : 14, C.muted);
  simLblR.moveTo([X1 - 1.0, simBase - 0.34, 0]);
  const miniBell = new M.VGroup(...bellLines(30, 2.3, simBase + 2.05, 0.85, C.cyan, 2.5, 28, 22, 38, CX - 1.6, CX + 1.6));
  const miniBellLbl = T(P ? 'true bell, sampled often' : 'true bell (sampled many times)', P ? 16 : 15, C.cyan);
  miniBellLbl.moveTo([CX, simBase + 3.1, 0]);

  const simHeights = [0.28, 0.62, 1.05, 1.38, 1.52, 1.44, 1.24, 0.98, 0.74, 0.54, 0.38, 0.26, 0.18, 0.12, 0.08, 0.05];
  const sW = (PW - 0.6) / simHeights.length;
  const simBars = simHeights.map((h, i) => makeBar(X0 + 0.3 + (i + 0.5) * sW, simBase, sW * 0.8, h * (P ? 1.05 : 0.95), C.cyan, 0.65));
  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(wTrack, ...wTicks, wHead, wMarker, ...demoRings, ...demoDots), { runTime: 0.5 }),
    new M.FadeIn(miniBell, { runTime: 0.6 }),
    new M.FadeIn(miniBellLbl, { runTime: 0.6 }),
    new M.Create(simAx, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(simLblL, simLblR), { runTime: 0.6 }),
    new M.LaggedStart(simBars.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.2 }),
    ...fbox([['p-value:', C.amber], ['sample a true bell', C.muted], ['again and again', C.muted]], C.amber),
    ...say('P-VALUE: SAMPLE A TRUE BELL', C.amber)
  );

  // Beat 24: how often those samples show a mismatch this big or bigger
  const cutIdx = 11;
  const cutX = X0 + 0.3 + cutIdx * sW;
  const obsCut = new M.DashedLine({ start: [cutX, simBase, 0], end: [cutX, simBase + 1.65, 0], color: C.amber });
  const obsLbl = T('our mismatch', P ? 14 : 15, C.amber, true);
  obsLbl.moveTo([cutX, simBase + 1.82, 0]);
  await until(S(24));
  simBars.forEach((b, i) => { if (i >= cutIdx) { b.setFill(C.amber, 0.85); b.setColor(C.amber); } });
  await play(
    new M.Create(obsCut, { runTime: 0.7 }),
    new M.FadeIn(obsLbl, { runTime: 0.7 }),
    ...fbox([['p = how often a true', C.ink], ['bell shows mismatch', C.ink], ['this big or bigger', C.amber]], C.amber),
    ...say('TAIL = THIS BIG OR BIGGER', C.amber)
  );

  // Beat 25 (2.57s): usual cut-off is 5 in 100 (0.05)
  const cut05Idx = 13;
  const cut05X = X0 + 0.3 + cut05Idx * sW;
  const cut05 = new M.Line({ start: [cut05X, simBase, 0], end: [cut05X, simBase + 1.45, 0], color: C.pink, strokeWidth: 3 });
  const cut05Lbl = T('0.05 cut-off', P ? 16 : 15, C.pink, true);
  cut05Lbl.moveTo([Math.min(X1 - 0.75, cut05X + 0.15), simBase + 1.62, 0]);
  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(obsCut, obsLbl), { runTime: 0.4 }),
    new M.Create(cut05, { runTime: 0.7 }),
    new M.FadeIn(cut05Lbl, { runTime: 0.7 }),
    ...fbox([['usual cut-off:', C.muted], ['p = 0.05 (5 in 100)', C.pink]], C.pink),
    ...say('CUT-OFF: 0.05 (5 IN 100)', C.pink)
  );

  // Beat 26: below 0.05 -> check fails
  const failTag = T('FAIL', P ? 15 : 16, C.pink, true);
  failTag.moveTo([(cut05X + X1 - 0.3) / 2, simBase + 0.65, 0]);
  const passTag = T('PASS', P ? 15 : 16, C.green, true);
  passTag.moveTo([X0 + 1.8, simBase + 1.65, 0]);
  await until(S(26));
  simBars.forEach((b, i) => {
    const col = i >= cut05Idx ? C.pink : C.cyan;
    b.setFill(col, i >= cut05Idx ? 0.9 : 0.55);
    b.setColor(col);
  });
  await play(
    new M.FadeIn(failTag, { runTime: 0.7 }),
    new M.FadeIn(passTag, { runTime: 0.7 }),
    ...fbox([['p < 0.05 → FAIL', C.pink], ['p ≥ 0.05 → PASS', C.green]], C.pink),
    ...say('P < 0.05  →  CHECK FAILS', C.pink)
  );

  // Beat 27: evidence, not proof
  await until(S(27));
  await play(
    ...fbox([['p < 0.05 = evidence', C.amber], ['NOT proof of non-bell', C.pink]], C.amber),
    ...say('EVIDENCE, NOT PROOF', C.amber)
  );

  // ==================== ACT 4 (28-37): NIGHT SHIFT WORKED EXAMPLE (n=3) ====================
  const ax4 = makeAxis(BASE, 22, 38, [22, 26, 30, 34, 38], 'grams');
  const d1 = makeDot(g2x(26), BASE + 0.32, C.violet, '26', 0.13);
  const d2 = makeDot(g2x(30), BASE + 0.32, C.violet, '30', 0.13);
  const d3Halo = new M.Dot({ point: [g2x(34), BASE + 0.32, 0], radius: 0.28, color: C.violet });
  d3Halo.setFill(C.violet, 0.18);
  const d3Core = new M.Dot({ point: [g2x(34), BASE + 0.32, 0], radius: 0.13, color: C.violet });
  const d3Lbl = T('34', P ? 15 : 17, C.violet, true);
  d3Lbl.moveTo([g2x(34), BASE + 0.68, 0]);

  const stepL = new M.Line({ start: [g2x(26) + 0.16, BASE + 1.05, 0], end: [g2x(30) - 0.16, BASE + 1.05, 0], color: C.muted, strokeWidth: 2 });
  const stepR = new M.Line({ start: [g2x(30) + 0.16, BASE + 1.05, 0], end: [g2x(34) - 0.16, BASE + 1.05, 0], color: C.muted, strokeWidth: 2 });
  const stepTL = T('4 g', P ? 17 : 15, C.ink, true); stepTL.moveTo([g2x(28), BASE + 1.3, 0]);
  const stepTR = T('4 g', P ? 17 : 15, C.ink, true); stepTR.moveTo([g2x(32), BASE + 1.3, 0]);
  const stepBg = [stepTL, stepTR].map(t => { const b = new M.RoundedRectangle({ width: t.getWidth() + 0.2, height: t.getHeight() + 0.14, cornerRadius: 0.06, color: C.muted, strokeWidth: 1.2 }); b.setFill(C.bg, 0.92); b.moveTo(t.getCenter()); return b; });
  const stepTags = new M.VGroup(stepL, stepR, ...stepBg, stepTL, stepTR);

  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(miniBell, miniBellLbl, simAx, simLblL, simLblR, ...simBars, cut05, cut05Lbl, failTag, passTag), { runTime: 0.6 }),
    new M.Create(ax4, { runTime: 0.6 }),
    new M.FadeIn(d1, { runTime: 0.6 }),
    new M.FadeIn(d2, { runTime: 0.6 }),
    new M.FadeIn(d3Halo, { runTime: 0.6 }),
    new M.FadeIn(d3Core, { runTime: 0.6 }),
    new M.FadeIn(d3Lbl, { runTime: 0.6 }),
    new M.FadeIn(stepTags, { runTime: 0.7 }),
    ...fbox([['night shift (n = 3)', C.violet], ['26, 30, 34 g', C.ink], ['4 g apart', C.muted]], C.violet),
    ...say('NIGHT SHIFT: 26, 30, 34 g', C.violet)
  );

  // Beat 29: 3 spots = middle + equal step to each side
  const bell3 = bellLines(30, 4.0, BASE, BH * 0.88, C.cyan, 2.5, 36);
  const cuts3 = [-0.431, 0.431].map(z => {
    const v = 30 + z * 4.0;
    return new M.Line({ start: [g2x(v), BASE, 0], end: [g2x(v), BASE + BH * 0.88 * gauss(v, 30, 4.0), 0], color: C.muted, strokeWidth: 1.5 });
  });
  const spots3 = [26, 30, 34].map(v => {
    const c = new M.Circle({ radius: 0.21, color: C.amber, strokeWidth: 3 });
    c.moveTo([g2x(v), BASE + 0.32, 0]);
    return c;
  });
  await until(S(29));
  await play(
    new M.LaggedStart(bell3.map(l => new M.Create(l)), { lagRatio: 0.02, runTime: 1.0 }),
    ...cuts3.map(l => new M.Create(l, { runTime: 0.7 })),
    new M.LaggedStart(spots3.map(s => new M.FadeIn(s)), { lagRatio: 0.15, runTime: 0.9 }),
    ...say('3 SPOTS: MIDDLE + EQUAL SIDES', C.amber)
  );

  // Beat 30: exact fit -> W = 1
  await until(S(30));
  await play(
    new M.Flash(spots3[0], { color: C.green, runTime: 0.8 }),
    new M.Flash(spots3[1], { color: C.green, runTime: 0.8 }),
    new M.Flash(spots3[2], { color: C.green, runTime: 0.8 }),
    ...fbox([['n = 3  (26, 30, 34)', C.violet], ['mismatch = 0', C.green], ['W = 1.00', C.green]], C.green),
    ...say('EXACT FIT · W = 1', C.green)
  );

  // Beat 31: p = 1 too
  await until(S(31));
  await play(
    ...fbox([['n = 3  (26, 30, 34)', C.violet], ['W = 1.00', C.green], ['p = 1.00  → PASS', C.green]], C.green),
    ...say('NO MISMATCH · P = 1', C.green)
  );

  // Beat 32: nudge last cookie to 32 -> W ≈ 0.96
  const d3HaloNew = new M.Dot({ point: [g2x(32), BASE + 0.32, 0], radius: 0.28, color: C.violet });
  d3HaloNew.setFill(C.violet, 0.18);
  const d3CoreNew = new M.Dot({ point: [g2x(32), BASE + 0.32, 0], radius: 0.13, color: C.violet });
  const d3LblNew = T('32', P ? 15 : 17, C.violet, true);
  d3LblNew.moveTo([g2x(32), BASE + 0.68, 0]);
  const newSpotVs = [26.75, 29.33, 31.92];
  const newSpots3 = newSpotVs.map(v => {
    const c = new M.Circle({ radius: 0.21, color: C.amber, strokeWidth: 3 });
    c.moveTo([g2x(v), BASE + 0.32, 0]);
    return c;
  });
  const bell3New = bellLines(29.33, 3.06, BASE, BH * 0.88, C.cyan, 2.5, 36);
  const gapL = new M.Line({ start: [g2x(26), BASE + 0.92, 0], end: [g2x(26.75), BASE + 0.92, 0], color: C.pink, strokeWidth: 4 });
  const gapM = new M.Line({ start: [g2x(29.33), BASE + 0.92, 0], end: [g2x(30), BASE + 0.92, 0], color: C.pink, strokeWidth: 4 });
  await until(S(32));
  await play(
    new M.FadeOut(stepTags, { runTime: 0.4 }),
    new M.FadeOut(new M.VGroup(...cuts3), { runTime: 0.4 }),
    new M.FadeOut(d3Lbl, { runTime: 0.4 }),
    new M.Transform(d3Halo, d3HaloNew, { runTime: 1.0 }),
    new M.Transform(d3Core, d3CoreNew, { runTime: 1.0 }),
    new M.FadeIn(d3LblNew, { runTime: 0.8 }),
    ...spots3.map((s, i) => new M.Transform(s, newSpots3[i], { runTime: 1.0 })),
    ...bell3.map((ln, i) => new M.Transform(ln, bell3New[i], { runTime: 1.0 })),
    new M.Create(gapL, { runTime: 0.9 }),
    new M.Create(gapM, { runTime: 0.9 }),
    ...fbox([['n = 3  (26, 30, 32)', C.violet], ['small mismatch', C.pink], ['W ≈ 0.96', C.cyan]], C.cyan),
    ...say('NUDGE 34 → 32 g  ·  W ≈ 0.96', C.cyan)
  );

  // Beat 33: p ≈ 0.64, far above 0.05 -> PASS
  const pBarY = BASE + BH * 0.96;
  const pX = p => X0 + 0.5 + p * (PW - 1.0);
  const pTrack = new M.Line({ start: [pX(0), pBarY, 0], end: [pX(1), pBarY, 0], color: C.muted, strokeWidth: 4 });
  const pCutM = new M.Line({ start: [pX(0.05), pBarY - 0.16, 0], end: [pX(0.05), pBarY + 0.16, 0], color: C.pink, strokeWidth: 3 });
  const pCutT = T('0.05', P ? 13 : 14, C.pink, true); pCutT.moveTo([pX(0.05) + 0.15, pBarY + 0.34, 0]);
  const pDot64 = new M.Dot({ point: [pX(0.64), pBarY, 0], radius: 0.13, color: C.green });
  const p64T = T('p ≈ 0.64', P ? 14 : 15, C.green, true); p64T.moveTo([pX(0.64), pBarY + 0.34, 0]);
  const pComp = new M.VGroup(pTrack, pCutM, pCutT, pDot64, p64T);
  await until(S(33));
  await play(
    new M.FadeIn(pComp, { runTime: 0.8 }),
    ...fbox([['n = 3  (26, 30, 32)', C.violet], ['W ≈ 0.96', C.cyan], ['p ≈ 0.64  (> 0.05)', C.green], ['result: PASS', C.green]], C.green),
    ...say('P ≈ 0.64  →  STILL PASSES', C.green)
  );

  // Beat 34: short version: W from 0 to 1
  const svY1 = BASE + 2.05, svY2 = BASE + 0.85;
  const wRule = new M.VGroup(
    new M.Line({ start: [X0 + 0.6, svY1, 0], end: [X1 - 0.6, svY1, 0], color: C.cyan, strokeWidth: 5 }),
    T('0', P ? 16 : 17, C.muted, true).moveTo([X0 + 0.6, svY1 - 0.34, 0]),
    T('1 = perfect match', P ? 16 : 17, C.green, true).moveTo([X1 - 1.5, svY1 - 0.34, 0]),
    T('W', P ? 20 : 22, C.cyan, true, true).moveTo([X0 + 0.2, svY1, 0])
  );
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(ax4, d1, d2, d3Halo, d3Core, d3LblNew, ...spots3, ...bell3, gapL, gapM, pComp), { runTime: 0.6 }),
    new M.FadeIn(wRule, { runTime: 0.8 }),
    ...fbox([['W : 0 to 1', C.cyan], ['    1 = perfect fit', C.green]], C.cyan),
    ...say('SHORT VERSION: W (0 TO 1)', C.cyan)
  );

  // Beat 35: p < 0.05 fails
  const pRule = new M.VGroup(
    new M.Line({ start: [X0 + 0.6, svY2, 0], end: [X1 - 0.6, svY2, 0], color: C.muted, strokeWidth: 5 }),
    new M.Line({ start: [X0 + 0.6, svY2, 0], end: [X0 + 0.6 + (PW - 1.2) * 0.14, svY2, 0], color: C.pink, strokeWidth: 7 }),
    T('p < 0.05 → FAIL', P ? 17 : 17, C.pink, true).moveTo([X0 + 1.9, svY2 - 0.38, 0]),
    T('PASS', P ? 16 : 17, C.green, true).moveTo([X1 - 1.1, svY2 - 0.38, 0]),
    T('p', P ? 20 : 22, C.amber, true, true).moveTo([X0 + 0.2, svY2, 0])
  );
  await until(S(35));
  await play(
    new M.FadeIn(pRule, { runTime: 0.8 }),
    ...fbox([['W : 0 to 1 (1 = exact)', C.cyan], ['p < 0.05 → FAIL', C.pink]], C.pink),
    ...say('P < 0.05  →  CHECK FAILS', C.pink)
  );

  // Beat 36: how close to 1 depends on sample size
  const szLeft = pill('n = 3  (TINY)', C.violet, P ? 15 : 16);
  szLeft.moveTo([CX - (P ? 1.55 : 1.95), BASE - 0.25, 0]);
  const szRight = pill('n = 2,000  (HUGE)', C.amber, P ? 15 : 16);
  szRight.moveTo([CX + (P ? 1.55 : 1.95), BASE - 0.25, 0]);
  await until(S(36));
  await play(
    new M.FadeIn(szLeft, { runTime: 0.7 }),
    new M.FadeIn(szRight, { runTime: 0.7 }),
    ...fbox([['how close to 1?', C.amber], ['depends on size n', C.amber]], C.amber),
    ...say('DEPENDS ON SAMPLE SIZE', C.amber)
  );

  // Beat 37: p-value uses size, W alone can mislead
  await until(S(37));
  await play(
    new M.Indicate(pRule, { color: C.cyan, runTime: 0.8 }),
    ...fbox([['p-value uses size n', C.cyan], ['W alone can mislead', C.pink]], C.pink),
    ...say('W ALONE CAN MISLEAD', C.pink)
  );

  // ==================== ACT 5 (38-41): TINY SAMPLE TRAP (BELL vs FLAT) ====================
  const ax5 = makeAxis(BASE, 22, 38, [22, 26, 30, 34, 38], 'grams');
  const n5Dots = [26, 30, 34].map(v => makeDot(g2x(v), BASE + 0.34, C.violet, String(v), 0.14));
  const bell5 = new M.VGroup(...bellLines(30, 3.3, BASE, BH * 0.82, C.cyan, 3, 36));
  const bell5Tag = T('bell shape', P ? 15 : 16, C.cyan, true);
  bell5Tag.moveTo([g2x(30), BASE + BH * 0.82 + 0.32, 0]);

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(wRule, pRule, szLeft, szRight), { runTime: 0.5 }),
    new M.Create(ax5, { runTime: 0.6 }),
    new M.FadeIn(bell5, { runTime: 0.7 }),
    new M.FadeIn(bell5Tag, { runTime: 0.6 }),
    ...n5Dots.map(d => new M.FadeIn(d, { runTime: 0.6 })),
    ...fbox([['n = 3 (26, 30, 34)', C.violet], ['W = 1, p = 1 (PASS)', C.green], ['what did it prove?', C.amber]], C.amber),
    ...say('WHAT DID 3 COOKIES SHOW?', C.amber)
  );

  // Beat 39: flat shape where every weight is equally likely
  const flatH = BH * 0.52;
  const flatRect = new M.Rectangle({ width: g2x(36) - g2x(24), height: flatH, color: C.pink, strokeWidth: 3 });
  flatRect.setFill(C.pink, 0.14);
  flatRect.moveTo([g2x(30), BASE + flatH / 2, 0]);
  const flatTag = T(P ? 'flat: all weights equally likely' : 'flat shape (all weights equally likely)', P ? 16 : 16, C.pink, true);
  flatTag.moveTo([g2x(30), BASE + flatH + 0.34, 0]);
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(bell5, bell5Tag), { runTime: 0.5 }),
    new M.FadeIn(flatRect, { runTime: 0.9 }),
    new M.FadeIn(flatTag, { runTime: 0.8 }),
    ...fbox([['bell shape?  fits', C.cyan], ['flat shape?  fits', C.pink]], C.pink),
    ...say('FITS A FLAT SHAPE JUST AS WELL', C.pink)
  );

  // Beat 40: 3 values ≈ 3 notes of a song
  const bell5Ghost = new M.VGroup(...bellLines(30, 3.3, BASE, BH * 0.82, C.cyan, 2, 32));
  bell5Ghost.submobjects.forEach(l => l.setStrokeOpacity(0.55));
  const qMark = T('bell  or  flat ?', P ? 18 : 20, C.amber, true, true);
  qMark.moveTo([g2x(30), BASE + BH * 0.82 + 0.34, 0]);
  await until(S(40));
  await play(
    new M.FadeIn(bell5Ghost, { runTime: 0.7 }),
    new M.FadeIn(qMark, { runTime: 0.7 }),
    ...say('3 VALUES ≈ 3 NOTES OF A SONG', C.muted)
  );

  // Beat 41: tiny samples rarely fail
  await until(S(41));
  await play(
    ...fbox([['tiny samples (n = 3):', C.violet], ['rarely fail', C.amber], ['even if NOT a bell', C.pink]], C.amber),
    ...say('TINY SAMPLES RARELY FAIL', C.amber)
  );

  // ==================== ACT 6 (42-51): HUGE SAMPLE (n = 2,000, SLIGHT SKEW) ====================
  const ax6 = makeAxis(BASE, 22, 38, [22, 26, 30, 34, 38], 'grams');
  const n2kBadge = pill('n = 2,000 COOKIES', C.violet, P ? 15 : 16);
  n2kBadge.moveTo([CX, BASE + BH + 0.25, 0]);
  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(ax5, ...n5Dots, flatRect, flatTag, bell5Ghost, qMark), { runTime: 0.6 }),
    new M.Create(ax6, { runTime: 0.7 }),
    new M.FadeIn(n2kBadge, { runTime: 0.7 }),
    ...fbox([['full week (night)', C.violet], ['n = 2,000 cookies', C.amber]], C.violet),
    ...say('OTHER EXTREME: 2,000 COOKIES', C.violet)
  );

  // Beat 43: histogram bars (22 bins, slightly right-skewed)
  const hCount = 22, hbw = (PW / hCount) * 0.84;
  // Slightly right-skewed density centered near 30
  const skewY = v => {
    const z = (v - 29.7) / 2.25;
    const base = Math.exp(-0.5 * z * z);
    const tail = v > 29.7 ? 0.24 * Math.exp(-0.5 * ((v - 33.2) / 1.95) ** 2) : 0;
    return Math.min(1, base + tail);
  };
  const histBars = Array.from({ length: hCount }, (_, i) => {
    const v = 22 + (i + 0.5) * (16 / hCount);
    return makeBar(g2x(v), BASE, hbw, BH * 0.92 * skewY(v), C.violet, 0.72);
  });
  const yLab = T('count', P ? 14 : 15, C.muted);
  yLab.moveTo([X0 + 0.35, BASE + BH * 0.82, 0]);
  await until(S(43));
  await play(
    new M.LaggedStart(histBars.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 1.5 }),
    new M.FadeIn(yLab, { runTime: 0.6 }),
    ...say('HISTOGRAM: COUNTS IN RANGES', C.cyan)
  );

  // Beat 44: almost like a bell, one side stretches a tiny bit further
  const idealBell6 = new M.VGroup(...bellLines(29.8, 2.35, BASE, BH * 0.94, C.amber, 2.8, 40));
  const tailIdxs = [15, 16, 17, 18, 19];
  await until(S(44));
  tailIdxs.forEach(i => { histBars[i].setFill(C.pink, 0.88); histBars[i].setColor(C.pink); });
  await play(
    new M.FadeIn(idealBell6, { runTime: 0.9 }),
    ...say('ALMOST A BELL · ONE SIDE LONGER', C.amber)
  );

  // Beat 45 (short 1.60s): small lean is called a skew
  const skewLbl = T('skew →', P ? 15 : 17, C.pink, true);
  skewLbl.moveTo([g2x(35.0), BASE + 1.05, 0]);
  await until(S(45));
  await play(new M.FadeIn(skewLbl, { runTime: 0.65 }), ...say('SMALL LEAN = SKEW', C.pink));

  // Beat 46: W ≈ 0.99, p ≈ 0.001
  await until(S(46));
  await play(
    ...fbox([['n = 2,000 cookies', C.violet], ['W ≈ 0.99  (near 1!)', C.green], ['p ≈ 0.001 (1 in 1000)', C.pink]], C.pink),
    ...say('W ≈ 0.99  ·  P ≈ 0.001', C.pink)
  );

  // Beat 47: check fails; sharp eyes, tiny gap counts
  await until(S(47));
  await play(
    new M.Indicate(skewLbl, { color: C.pink, runTime: 0.8 }),
    ...fbox([['n = 2,000 → sharp eyes', C.amber], ['W ≈ 0.99, p ≈ 0.001', C.pink], ['result: FAIL (< 0.05)', C.pink]], C.pink),
    ...say('CHECK FAILS OVER A TINY GAP', C.pink)
  );

  // Beat 48: many big handfuls of cookies, each with its own average
  const topY = BASE + (P ? 2.15 : 1.72);
  const botY = BASE - (P ? 0.35 : 0.05);
  const miniH = P ? 1.15 : 1.02;
  const topBars = Array.from({ length: 18 }, (_, i) => {
    const v = 22 + (i + 0.5) * (16 / 18);
    const col = i >= 12 ? C.pink : C.violet;
    return makeBar(g2x(v), topY, (PW / 18) * 0.82, miniH * skewY(v), col, 0.72);
  });
  const topAx = new M.Line({ start: [X0, topY, 0], end: [X1, topY, 0], color: C.muted, strokeWidth: 2 });
  const topTitle = T('single cookies (small skew)', P ? 14 : 15, C.violet, true);
  topTitle.moveTo([CX, topY + miniH + 0.25, 0]);
  const topPanel = new M.VGroup(topAx, ...topBars, topTitle);

  const botAx = makeAxis(botY, 22, 38, [26, 30, 34], '', X0, X1);
  const botTitle = T('averages of big handfuls', P ? 14 : 15, C.green, true);
  botTitle.moveTo([CX, botY + miniH + 0.22, 0]);
  const handDots = [29.4, 30.0, 30.5].map(v => makeDot(g2x(v), botY + 0.22, C.amber, '', 0.09));

  await until(S(48));
  await play(
    new M.FadeOut(new M.VGroup(ax6, n2kBadge, ...histBars, yLab, idealBell6, skewLbl), { runTime: 0.6 }),
    new M.FadeIn(topPanel, { runTime: 0.7 }),
    new M.Create(botAx, { runTime: 0.7 }),
    new M.FadeIn(botTitle, { runTime: 0.6 }),
    new M.LaggedStart(handDots.map(d => new M.FadeIn(d)), { lagRatio: 0.2, runTime: 0.8 }),
    ...fbox([['test compares AVERAGES', C.amber], ['many big handfuls', C.cyan]], C.amber),
    ...say('AVERAGES OF BIG HANDFULS', C.amber)
  );

  // Beat 49: heavier and lighter cancel out
  const cY = topY + 0.35;
  const cancelL = new M.Line({ start: [g2x(26.5), cY, 0], end: [g2x(29.5), cY, 0], color: C.cyan, strokeWidth: 3.5 });
  const cancelR = new M.Line({ start: [g2x(34.0), cY, 0], end: [g2x(30.5), cY, 0], color: C.pink, strokeWidth: 3.5 });
  const cancelTxt = T('light + heavy → balance at 30', P ? 13 : 14, C.ink, true);
  cancelTxt.moveTo([g2x(30), topY - 0.24, 0]);
  const cancelG = new M.VGroup(cancelL, cancelR, cancelTxt);
  await until(S(49));
  await play(
    new M.FadeIn(cancelG, { runTime: 0.8 }),
    ...say('HEAVY & LIGHT CANCEL OUT', C.cyan)
  );

  // Beat 50: averages pile up in a bell
  const avgBars = Array.from({ length: 18 }, (_, i) => {
    const v = 22 + (i + 0.5) * (16 / 18);
    return makeBar(g2x(v), botY, (PW / 18) * 0.82, miniH * gauss(v, 30, 1.35), C.green, 0.72);
  });
  const avgBell = new M.VGroup(...bellLines(30, 1.35, botY, miniH * 1.02, C.green, 2.8, 36));
  await until(S(50));
  await play(
    new M.FadeOut(new M.VGroup(...handDots, cancelG), { runTime: 0.4 }),
    new M.LaggedStart(avgBars.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 1.2 }),
    new M.FadeIn(avgBell, { runTime: 0.8 }),
    ...say('AVERAGES PILE UP IN A BELL', C.green)
  );

  // Beat 51: small lean does no harm
  await until(S(51));
  await play(
    new M.Indicate(avgBell, { color: C.green, runTime: 0.8 }),
    ...fbox([['n = 2,000 + small skew:', C.muted], ['averages form a bell', C.green], ['small lean = NO HARM', C.green]], C.green),
    ...say('SMALL LEAN DOES NO HARM', C.green)
  );

  // ==================== ACT 7 (52-57): WARNING LIGHT, CHECKLIST, TRAP & RECAP ====================
  // Beat 52: warning light to look closer
  const wY = BASE + 1.65;
  const wHalo = new M.Circle({ radius: 0.95, color: C.amber, strokeWidth: 2 });
  wHalo.setFill(C.amber, 0.14); wHalo.moveTo([CX, wY, 0]);
  const wCore = new M.Circle({ radius: 0.58, color: C.amber, strokeWidth: 3.5 });
  wCore.setFill(C.card, 0.95); wCore.moveTo([CX, wY, 0]);
  const wBang = T('!', 44, C.amber, true, true); wBang.moveTo([CX, wY, 0]);
  const wSub = T('WARNING LIGHT — LOOK CLOSER', P ? 16 : 18, C.amber, true);
  wSub.moveTo([CX, wY - 1.32, 0]);
  const warnLight = new M.VGroup(wHalo, wCore, wBang, wSub);
  await until(S(52));
  await play(
    new M.FadeOut(new M.VGroup(topPanel, botAx, botTitle, ...avgBars, avgBell), { runTime: 0.6 }),
    new M.FadeIn(warnLight, { runTime: 0.8 }),
    new M.Flash(wCore, { color: C.amber, runTime: 0.8 }),
    ...fbox([['normality check =', C.ink], ['a warning light', C.amber], ['not a final verdict', C.muted]], C.amber),
    ...say('A WARNING LIGHT TO LOOK CLOSER', C.amber)
  );

  // Beat 53 (2.83s): read with sample size and a picture
  const cardData = [
    ['W & p', 'test score', C.cyan],
    ['size (n)', 'how many', C.amber],
    ['a plot', 'the shape', C.green]
  ];
  const cw3 = P ? 1.95 : 2.35, gap3c = P ? 0.22 : 0.35;
  const threeCards = cardData.map(([head, sub, col], i) => {
    const cx = CX + (i - 1) * (cw3 + gap3c), cy = BASE + 1.5;
    const box = new M.RoundedRectangle({ width: cw3, height: 1.5, cornerRadius: 0.16, color: col, strokeWidth: 2.5 });
    box.setFill(C.card, 0.95); box.moveTo([cx, cy, 0]);
    const hT = T(head, P ? 18 : 20, col, true, true); hT.moveTo([cx, cy + 0.25, 0]);
    const sT = T(sub, P ? 14 : 15, C.muted); sT.moveTo([cx, cy - 0.28, 0]);
    return new M.VGroup(box, hT, sT);
  });
  await until(S(53));
  await play(
    new M.FadeOut(warnLight, { runTime: 0.4 }),
    new M.LaggedStart(threeCards.map(c => new M.FadeIn(c)), { lagRatio: 0.15, runTime: 0.9 }),
    ...say('READ: TEST + SIZE + PLOT', C.green)
  );

  // Beat 54: look for strong skew or cookies far from the rest
  const mpW = P ? 2.85 : 3.5, mpGap = P ? 0.45 : 0.7;
  const mpY = BASE + 0.45;
  const lx0 = CX - mpGap / 2 - mpW, rx0 = CX + mpGap / 2;
  // Left mini-plot: strong skew
  const skH = [0.2, 1.35, 1.15, 0.8, 0.55, 0.38, 0.26, 0.18, 0.12, 0.08];
  const skItems = [new M.Line({ start: [lx0, mpY, 0], end: [lx0 + mpW, mpY, 0], color: C.muted, strokeWidth: 2 })];
  skH.forEach((h, i) => {
    const bw = mpW / skH.length;
    skItems.push(makeBar(lx0 + (i + 0.5) * bw, mpY, bw * 0.8, h * 1.15, i >= 5 ? C.pink : C.cyan, 0.78));
  });
  skItems.push(T('strong skew', P ? 15 : 17, C.pink, true).moveTo([lx0 + mpW / 2, mpY - 0.42, 0]));
  // Right mini-plot: far outlier
  const outH = [0.22, 0.65, 1.25, 1.35, 0.75, 0.24];
  const outItems = [new M.Line({ start: [rx0, mpY, 0], end: [rx0 + mpW, mpY, 0], color: C.muted, strokeWidth: 2 })];
  outH.forEach((h, i) => {
    const bw = (mpW * 0.55) / outH.length;
    outItems.push(makeBar(rx0 + 0.1 + (i + 0.5) * bw, mpY, bw * 0.8, h * 1.1, C.cyan, 0.75));
  });
  outItems.push(makeDot(rx0 + mpW - 0.25, mpY + 0.22, C.pink, '', 0.13));
  outItems.push(T('far outlier', P ? 15 : 17, C.pink, true).moveTo([rx0 + mpW / 2, mpY - 0.42, 0]));
  const lookPlots = new M.VGroup(...skItems, ...outItems);

  await until(S(54));
  await play(
    new M.FadeOut(new M.VGroup(...threeCards), { runTime: 0.4 }),
    new M.FadeIn(lookPlots, { runTime: 0.9 }),
    ...fbox([['in the plot, look for:', C.ink], ['• strong skew', C.pink], ['• far-out cookies', C.pink]], C.pink),
    ...say('LOOK FOR: SKEW OR OUTLIERS', C.pink)
  );

  // Beat 55: common trap: pass ≠ proof, fail ≠ always problem
  const tcW = P ? 6.1 : 3.85, tcH = P ? 1.45 : 2.0;
  const tcPos = P ? [[CX, -0.35, 0], [CX, -2.15, 0]] : [[CX - 2.08, -0.45, 0], [CX + 2.08, -0.45, 0]];
  const makeCard = (pos, title, l1, l2, col) => {
    const r = new M.RoundedRectangle({ width: tcW, height: tcH, cornerRadius: 0.18, color: col, strokeWidth: 2.5 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const t0 = T(title, P ? 17 : 18, col, true, true); t0.moveTo([pos[0], pos[1] + (P ? 0.38 : 0.52), 0]);
    const t1 = T(l1, P ? 15 : 16, C.ink); t1.moveTo([pos[0], pos[1] - (P ? 0.02 : 0.02), 0]);
    const t2 = T(l2, P ? 15 : 16, C.muted); t2.moveTo([pos[0], pos[1] - (P ? 0.38 : 0.48), 0]);
    return new M.VGroup(r, t0, t1, t2);
  };
  const trapCards = [
    makeCard(tcPos[0], 'SMALL n → PASS', 'passes too easily', 'pass ≠ proof of a bell', C.amber),
    makeCard(tcPos[1], 'HUGE n → FAIL', 'fails over tiny gaps', 'fail ≠ always a problem', C.pink)
  ];
  await until(S(55));
  await play(
    new M.FadeOut(lookPlots, { runTime: 0.5 }),
    new M.LaggedStart(trapCards.map(c => new M.FadeIn(c)), { lagRatio: 0.25, runTime: 1.0 }),
    ...fbox([['TRAP: p-value alone', C.pink], ['pass ≠ proof', C.amber], ['fail ≠ always problem', C.green]], C.pink),
    ...say('TRAP: LETTING P DECIDE ALONE', C.pink)
  );

  // Beat 56: one-sentence recap
  await until(S(56));
  await play(
    new M.Indicate(trapCards[0], { color: C.amber, runTime: 0.8 }),
    new M.Indicate(trapCards[1], { color: C.pink, runTime: 0.8 }),
    ...fbox([['small n → passes easily', C.amber], ['huge n  → fails easily', C.pink], ['always check n + plot', C.green]], C.green),
    ...say('CHECK SIZE + PLOT, EVERY TIME', C.green)
  );

  // Beat 57: bridge to 7.4.4 (running many tests at once)
  const tDots = Array.from({ length: 12 }, (_, i) => {
    const col = i === 7 ? C.pink : C.cyan;
    const tx = CX + ((i % 6) - 2.5) * (P ? 0.95 : 1.15);
    const ty = BASE + (i < 6 ? 1.85 : 0.95);
    return makeDot(tx, ty, col, '', 0.16);
  });
  const teaserTxt = T('20 features tested at once → false alarms?', P ? 15 : 17, C.amber, true);
  teaserTxt.moveTo([CX, BASE + 0.15, 0]);
  const nextTeaser = new M.VGroup(...tDots, teaserTxt);
  await until(S(57));
  await play(
    new M.FadeOut(new M.VGroup(...trapCards), { runTime: 0.5 }),
    new M.FadeIn(nextTeaser, { runTime: 0.9 }),
    ...fbox([['next (7.4.4):', C.muted], ['running many tests', C.amber], ['at once', C.amber]], C.amber),
    ...say('NEXT: MANY TESTS AT ONCE', C.amber)
  );
}

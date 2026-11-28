// lesson 6.1.1
// 6.1.1 Parameters and statistics.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, LINE_Y } = L;

  const PILL = P ? [0, 3.65, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 2.35, 0] : [4.45, 0.2, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper (same pattern as reference)
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 4.2;
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

  // Helper: draw a glowing water bottle column
  function makeBottle(x, baseY, fillMl, w = 0.65, h = 1.65, color = C.cyan, showVal = false) {
    const frac = Math.max(0.25, Math.min(0.92, 0.58 + (fillMl - 500) * 0.08));
    const fh = h * frac;
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color: C.muted, strokeWidth: 2 });
    body.setFill(C.card, 0.55); body.moveTo([x, baseY + h / 2, 0]);
    const liq = new M.Rectangle({ width: w - 0.08, height: fh, color, strokeWidth: 0 });
    liq.setFill(color, 0.65); liq.moveTo([x, baseY + 0.04 + fh / 2, 0]);
    const topLine = new M.Line({ start: [x - w / 2 + 0.04, baseY + 0.04 + fh, 0], end: [x + w / 2 - 0.04, baseY + 0.04 + fh, 0], color, strokeWidth: 3 });
    const cap = new M.Rectangle({ width: w * 0.44, height: 0.14, color: C.muted, strokeWidth: 1.5 });
    cap.setFill(C.muted, 0.7); cap.moveTo([x, baseY + h + 0.07, 0]);
    const parts = [body, liq, topLine, cap];
    if (showVal) {
      const vt = T(String(fillMl), P ? 15 : 17, color, true);
      vt.moveTo([x, baseY - 0.28, 0]);
      parts.push(vt);
    }
    return new M.VGroup(...parts);
  }

  // 0: bottling plant with 5 bottles
  const BY = P ? -2.2 : -1.55;
  const bXs = [-2, -1, 0, 1, 2].map(k => (P ? 0 : -1.7) + k * (P ? 1.25 : 1.45));
  const conv = new M.Line({ start: [bXs[0] - 0.9, BY - 0.05, 0], end: [bXs[4] + 0.9, BY - 0.05, 0], color: C.muted, strokeWidth: 3 });
  const bottles0 = bXs.map(x => makeBottle(x, BY, 500, P ? 0.68 : 0.78, P ? 1.8 : 1.75, C.cyan));
  await until(S(0));
  await play(new M.Create(conv), new M.LaggedStart(bottles0.map(b => new M.FadeIn(b)), { lagRatio: 0.12, runTime: 1.3 }), ...say('BOTTLING PLANT'));

  // 1: label says 500 ml
  const labels500 = bXs.map(x => {
    const t = T('500 ml', P ? 15 : 16, C.ink, true);
    t.moveTo([x, BY + (P ? 1.8 : 1.75) + 0.4, 0]);
    return t;
  });
  await until(S(1));
  await play(new M.LaggedStart(labels500.map(t => new M.FadeIn(t)), { lagRatio: 0.1, runTime: 1.0 }), ...say('LABEL: 500 ml', C.muted));

  // 2: 1 ml ≈ 20 drops
  await until(S(2));
  await play(...fbox(['1 millilitre (ml)', ['≈ 20 drops', C.cyan]], C.cyan), ...say('1 ml ≈ 20 DROPS'));

  // 3: slightly different fills
  const varyFills = [502, 499, 503, 500, 501];
  const bottlesVary = bXs.map((x, i) => makeBottle(x, BY, varyFills[i], P ? 0.68 : 0.78, P ? 1.8 : 1.75, C.cyan, true));
  const ref500Y = BY + 0.04 + (P ? 1.8 : 1.75) * 0.58;
  const ref500 = new M.DashedLine({ start: [bXs[0] - 0.8, ref500Y, 0], end: [bXs[4] + 0.8, ref500Y, 0], color: C.muted });
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...bottles0, ...labels500)),
    new M.Create(ref500),
    new M.LaggedStart(bottlesVary.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.2 }),
    ...clearBox(),
    ...say('SOME MORE, SOME LESS', C.amber)
  );

  // 4: simple question
  await until(S(4));
  await play(...fbox(['true average fill', ['= ?', C.amber]], C.amber), ...say('ON AVERAGE, HOW MUCH REALLY?', C.amber));

  // 5: population grid of many bottles
  const popCols = P ? 7 : 10, popRows = P ? 5 : 4;
  const popCX = P ? 0 : -1.9, popCY = P ? -1.4 : -0.8;
  const popDX = P ? 0.85 : 0.78, popDY = P ? 0.82 : 0.72;
  const popBottles = [];
  for (let r = 0; r < popRows; r++) {
    for (let c = 0; c < popCols; c++) {
      const px = popCX + (c - (popCols - 1) / 2) * popDX;
      const py = popCY + (r - (popRows - 1) / 2) * popDY;
      const fill = 499 + ((r * 7 + c * 3) % 5);
      popBottles.push(makeBottle(px, py - 0.28, fill, 0.34, 0.56, C.cyan));
    }
  }
  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(...bottlesVary, conv, ref500)),
    new M.LaggedStart(popBottles.map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.8 }),
    ...say('TODAY, TOMORROW, NEXT MONTH')
  );

  // 6: population box
  const popW = popCols * popDX + 0.5, popH = popRows * popDY + 0.55;
  const popBox = new M.RoundedRectangle({ width: popW, height: popH, cornerRadius: 0.2, color: C.amber, strokeWidth: 2.5 });
  popBox.moveTo([popCX, popCY, 0]);
  const popTag = pill('POPULATION', C.amber, 16);
  popTag.moveTo([popCX, popCY + popH / 2 + 0.32, 0]);
  await until(S(6));
  await play(new M.Create(popBox), new M.FadeIn(popTag), ...say('POPULATION = ALL BOTTLES', C.amber));

  // 7: population mean
  await until(S(7));
  await play(...fbox(['population mean', ['average of ALL bottles', C.amber]], C.amber), ...say('POPULATION MEAN = ONE NUMBER', C.amber));

  // 8: unknown
  const qPill = pill('?', C.amber, 24);
  qPill.moveTo([popCX, popCY, 0]);
  await until(S(8));
  await play(new M.FadeIn(qPill), ...say('NOBODY CAN MEASURE EVERY BOTTLE', C.muted));

  // 9: number line 495 to 507, peek at 501
  // zoomed ml line 497..505 so half-millilitre steps are far apart
  const LY = P ? -3.8 : -2.3;
  const L0 = P ? FW - 1.3 : 8.5;
  const x0 = P ? -L0 / 2 - 0.15 : -6.6;
  const n2x = v => x0 + (v - 497) / 8 * L0;
  const axis = new M.Line({ start: [x0, LY, 0], end: [x0 + L0, LY, 0], color: C.muted, strokeWidth: 3 });
  const tickVals = [497, 498, 499, 500, 501, 502, 503, 504, 505];
  const ticks = tickVals.map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted }),
    T(String(v), P ? 16 : 17, C.muted, true).moveTo([n2x(v), LY - 0.36, 0])
  ));
  const unitLab = T('ml', P ? 16 : 17, C.muted);
  unitLab.moveTo([x0 + L0 + 0.32, LY - 0.02, 0]);

  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...popBottles, popBox, popTag, qPill)),
    new M.Create(axis),
    new M.FadeIn(new M.VGroup(...ticks, unitLab)),
    ...fbox(['population mean (peek)', ['501 ml', C.amber]], C.amber),
    ...say('PEEK: TRUE MEAN = 501 ml', C.amber)
  );

  // 10: gold dashed line at 501
  const ROW = P ? 0.95 : 0.6, ROW0 = P ? 0.75 : 0.6;
  const goldTop = LY + ROW0 + 3 * ROW + 0.6;
  const goldLine = new M.DashedLine({ start: [n2x(501), LY, 0], end: [n2x(501), goldTop, 0], color: C.amber, strokeWidth: 3 });
  const goldTag = pill('501 (PEEK)', C.amber, P ? 16 : 16);
  goldTag.moveTo([n2x(501), goldTop + 0.32, 0]);
  await until(S(10));
  await play(new M.Create(goldLine), new M.FadeIn(goldTag), ...say('GOLD DASHED LINE (HIDDEN)', C.amber));

  // 11: inspector picks 4 bottles
  const s1Vals = [503, 501, 504, 500];
  const sbY = P ? -6.0 : LY + 0.75;
  const sbCX = P ? 0 : -5.05;
  const sbXs = [-1.5, -0.5, 0.5, 1.5].map(k => sbCX + k * (P ? 1.25 : 0.78));
  const s1Bottles = s1Vals.map((v, i) => makeBottle(sbXs[i], sbY, v, P ? 0.55 : 0.5, P ? 1.15 : 1.0, C.cyan, true));
  await until(S(11));
  await play(new M.LaggedStart(s1Bottles.map(b => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.2 }), ...say('INSPECTOR: 4 BOTTLES / DAY'));

  // 12: sample box
  const sBox = new M.RoundedRectangle({ width: (P ? 5.2 : 3.3), height: P ? 1.95 : 1.7, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  sBox.moveTo([sbCX, sbY + (P ? 0.45 : 0.4), 0]);
  await until(S(12));
  await play(new M.Create(sBox), ...say('SAMPLE = 4 BOTTLES', C.cyan));

  // 13: Sample 1 fills
  await until(S(13));
  await play(...fbox(['Sample 1', '503, 501, 504, 500'], C.cyan), ...say('SAMPLE 1: 503, 501, 504, 500'));

  // 14: sum 2008
  await until(S(14));
  await play(...fbox(['Sample 1', '503 + 501 + 504 + 500', ['sum = 2,008', C.cyan]], C.cyan), ...say('SUM = 2,008'));

  // 15: mean 502
  await until(S(15));
  await play(...fbox(['Sample 1', 'sum = 2,008', ['mean = 2,008 ÷ 4 = 502', C.cyan]], C.cyan), ...say('SAMPLE MEAN = 502 ml'));

  // Helper to place a sample mean dot on the ml line
  // one row per sample (sample 1 on top); the value sits in a label column at the left, far from the dots
  const labRight = n2x(499.3);
  function makeMeanDot(val, k) {
    const p = [n2x(val), LY + ROW0 + (3 - k) * ROW, 0];
    const guide = new M.DashedLine({ start: [labRight + 0.1, p[1], 0], end: [p[0] - 0.3, p[1], 0], color: C.grid, strokeWidth: 1.5 });
    const halo = new M.Dot({ point: p, radius: 0.22, color: C.cyan });
    halo.setFill(C.cyan, 0.22);
    const d = new M.Dot({ point: p, radius: 0.11, color: C.cyan });
    const lab = T(`S${k + 1}: ${val}`, P ? 18 : 19, C.cyan, true);
    lab.moveTo([labRight - lab.getWidth() / 2, p[1], 0]);
    return { g: new M.VGroup(guide, halo, d, lab), d, p };
  }

  // 16: cyan dot 1 at 502
  const d1 = makeMeanDot(502, 0);
  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(...s1Bottles, sBox)),
    new M.FadeIn(d1.g),
    new M.Flash(d1.d, { color: C.cyan }),
    ...say('SAMPLE 1 MEAN: 502')
  );

  // 17: Sample 2 fills
  await until(S(17));
  await play(...fbox(['Sample 2', '499, 501, 498, 502'], C.cyan), ...say('SAMPLE 2: 499, 501, 498, 502'));

  // 18: Sample 2 mean 500
  const d2 = makeMeanDot(500, 1);
  await until(S(18));
  await play(
    new M.FadeIn(d2.g),
    new M.Flash(d2.d, { color: C.cyan }),
    ...fbox(['Sample 2', 'sum = 2,000', ['mean = 500', C.cyan]], C.cyan),
    ...say('SAMPLE 2 MEAN: 500')
  );

  // 19: Sample 3 mean 501.5
  const d3 = makeMeanDot(501.5, 2);
  await until(S(19));
  await play(
    new M.FadeIn(d3.g),
    new M.Flash(d3.d, { color: C.cyan }),
    ...fbox(['Sample 3', '502, 500, 503, 501', ['mean = 501.5', C.cyan]], C.cyan),
    ...say('SAMPLE 3 MEAN: 501.5')
  );

  // 20: Sample 4 mean 500.5
  const d4 = makeMeanDot(500.5, 3);
  await until(S(20));
  await play(
    new M.FadeIn(d4.g),
    new M.Flash(d4.d, { color: C.cyan }),
    ...fbox(['Sample 4', '500, 502, 499, 501', ['mean = 500.5', C.cyan]], C.cyan),
    ...say('SAMPLE 4 MEAN: 500.5')
  );

  const allDots = [d1, d2, d3, d4];

  // 21: look at the four cyan dots
  await until(S(21));
  await play(
    new M.LaggedStart(allDots.map(o => new M.Indicate(o.g, { color: C.cyan })), { lagRatio: 0.2, runTime: 2.0 }),
    ...say('502, 500, 501.5, 500.5')
  );

  // 22: they jump around, gold line does not move
  await until(S(22));
  await play(new M.Indicate(goldLine, { color: C.amber }), ...say('DOTS JUMP · GOLD LINE FIXED', C.amber));

  // 23: two kinds of numbers
  await until(S(23));
  await play(...say('TWO KINDS OF NUMBERS', C.ink));

  // 24: gold line = whole population, fixed but unknown
  await until(S(24));
  await play(
    new M.Indicate(goldLine, { color: C.amber }),
    ...fbox(['POPULATION', ['fixed, unknown', C.amber]], C.amber),
    ...say('FIXED, BUT UNKNOWN', C.amber)
  );

  // 25: parameter
  await until(S(25));
  await play(
    ...fbox([['PARAMETER', C.amber], 'about the population', 'fixed, unknown'], C.amber),
    ...say('PARAMETER', C.amber)
  );

  // 26: cyan dots = computed from sample, changes
  await until(S(26));
  await play(
    new M.LaggedStart(allDots.map(o => new M.Indicate(o.g, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.5 }),
    ...fbox(['SAMPLE', ['changes, computable', C.cyan]], C.cyan),
    ...say('CHANGES, BUT COMPUTABLE')
  );

  // 27: statistic (without an s)
  await until(S(27));
  await play(
    ...fbox([['STATISTIC (no s)', C.cyan], 'from a sample', 'one computed number'], C.cyan),
    ...say('A STATISTIC (WITHOUT AN S)')
  );

  // 28: sample mean = statistic, population mean = parameter
  await until(S(28));
  await play(
    ...fbox([['sample mean → statistic', C.cyan], ['population mean → parameter', C.amber]], C.green),
    ...say('STATISTIC vs PARAMETER', C.green)
  );

  // 29: formula box
  await until(S(29));
  await play(
    ...fbox([['sample mean', C.cyan], '= (sum of 4 fills) ÷ 4'], C.cyan),
    ...say('RECIPE FOR OUR STATISTIC')
  );

  // 30: in words
  await until(S(30));
  await play(
    ...fbox([['population mean: ALL', C.amber], ['sample mean: 4 measured', C.cyan]], C.ink),
    ...say('ALL BOTTLES vs 4 MEASURED', C.ink)
  );

  // 31: how far did each sample miss?
  await until(S(31));
  await play(...say('HOW FAR DID EACH MISS?', C.violet));

  // 32: S1 +1, S2 -1
  // miss = arrow from the gold line to the dot; the miss value sits in a column on the right
  const missX = n2x(503.4);
  const missLine = (o, v) => new M.Line({ start: [n2x(501), o.p[1], 0], end: [n2x(v), o.p[1], 0], color: C.violet, strokeWidth: 5 });
  const missLab = (o, s) => { const t = T(s, P ? 18 : 19, C.violet, true); t.moveTo([missX + t.getWidth() / 2, o.p[1], 0]); return t; };
  const m1 = missLine(d1, 502), m1Lab = missLab(d1, '+1 ml');
  const m2 = missLine(d2, 500), m2Lab = missLab(d2, '−1 ml');
  await until(S(32));
  await play(
    new M.Create(m1), new M.FadeIn(m1Lab),
    new M.Create(m2), new M.FadeIn(m2Lab),
    ...say('S1: +1 ml   ·   S2: −1 ml', C.violet)
  );

  // 33: S3 +0.5, S4 -0.5
  const m3 = missLine(d3, 501.5), m3Lab = missLab(d3, '+0.5 ml');
  const m4 = missLine(d4, 500.5), m4Lab = missLab(d4, '−0.5 ml');
  await until(S(33));
  await play(
    new M.Create(m3), new M.FadeIn(m3Lab),
    new M.Create(m4), new M.FadeIn(m4Lab),
    ...say('S3: +0.5 ml  ·  S4: −0.5 ml', C.violet)
  );

  // 34: misses are expected
  await until(S(34));
  await play(...say('DIFFERENT 4 BOTTLES → DIFFERENT MEAN', C.muted));

  // 35: what is it for?
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(m1, m1Lab, m2, m2Lab, m3, m3Lab, m4, m4Lab)),
    ...fbox([['statistic', C.cyan], 'guesses the hidden', ['parameter', C.amber]], C.green),
    ...say('USE A STATISTIC TO GUESS IT', C.green)
  );

  // 36: surveys, polls, quality checks
  await until(S(36));
  await play(...say('SURVEYS · POLLS · QUALITY CHECKS', C.green));

  // 37: Trap 1 - label 500
  const dialLine = new M.DashedLine({ start: [n2x(500), LY, 0], end: [n2x(500), goldTop + 0.12, 0], color: C.muted, strokeWidth: 2.5 });
  const dialTag = pill('LABEL: 500', C.muted, P ? 15 : 16);
  dialTag.moveTo([n2x(500) + 0.05 - dialTag.getWidth() / 2, goldTop + 0.32, 0]);
  await until(S(37));
  await play(new M.Create(dialLine), new M.FadeIn(dialTag), ...say('TRAP 1: NOT THE LABEL!', C.violet));

  // 38: label 500 vs parameter 501
  await until(S(38));
  await play(
    new M.Indicate(dialLine, { color: C.muted }),
    new M.Indicate(goldLine, { color: C.amber }),
    ...fbox([['label = 500 ml', C.muted], ['parameter = 501 ml', C.amber]], C.violet),
    ...say('LABEL 500 ≠ PARAMETER 501', C.violet)
  );

  // 39: promise vs reality
  await until(S(39));
  await play(...say('PROMISE vs REALITY', C.amber));

  // 40: Trap 2 - one sample mean is not the parameter
  await until(S(40));
  await play(new M.Indicate(d1.g, { color: C.violet }), ...say('TRAP 2: ONE GUESS ≠ PARAMETER', C.violet));

  // 41: next lesson
  await until(S(41));
  await play(...say('NEXT: COMPARING RECIPES', C.cyan));

  // 42: one-sentence summary
  await until(S(42));
  await play(
    ...fbox([['PARAMETER: fixed, hidden', C.amber], ['STATISTIC: from a sample', C.cyan]], C.green),
    ...say('PARAMETER vs STATISTIC', C.green)
  );
}

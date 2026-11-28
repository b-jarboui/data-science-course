// lesson 6.1.2
// 6.1.2 Estimator bias.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Layout: ml line 499..503, one row per sample (A cyan dot, B pink dot), a small table of the values
// (left on laptop, under the line on phone), later two histograms (A upper, B lower).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const PINK = C.pink;

  const PILL = P ? [0, 4.3, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, 3.1, 0] : [4.75, 0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Formula box helper
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    const BC = P ? [0, 3.95 - ht / 2, 0] : BOXP;   // phone: the box hangs from a fixed top
    r.setFill(C.card, 0.95); r.moveTo(BC);
    const left = BC[0] - wd / 2 + 0.32, top = BC[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 3.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)]; boxNow = null; return a;
  }

  // ---- geometry
  const LY = P ? -2.2 : -2.6;
  const x0 = P ? -3.5 : -4.0, L0 = P ? 6.7 : 5.9;
  const n2x = v => x0 + (v - 499) / 4 * L0;
  const ROW = P ? 0.75 : 0.65, ROW0 = 0.65;
  const rowY = k => LY + ROW0 + (3 - k) * ROW;           // sample 1 on top
  const goldTop = rowY(0) + 0.55;
  const NUM = P ? 18 : 19;

  // table positions
  const tab = P
    ? { xS: -2.3, xA: -0.2, xB: 1.9, y: k => -4.0 - k * 0.6, head: -3.35, avg: -4.0 - 4 * 0.6 - 0.1 }
    : { xS: -6.55, xA: -5.65, xB: -4.6, y: k => rowY(k), head: goldTop + 0.05, avg: rowY(3) - ROW };

  // the same pieces are built twice (start and the trap at the end), so they come from factories
  function buildBase() {
    const axis = new M.Line({ start: [x0, LY, 0], end: [x0 + L0, LY, 0], color: C.muted, strokeWidth: 3 });
    const ticks = [499, 500, 501, 502, 503].map(v => new M.VGroup(
      new M.Line({ start: [n2x(v), LY - 0.08, 0], end: [n2x(v), LY + 0.08, 0], color: C.muted }),
      T(String(v), P ? 16 : 17, C.muted, true).moveTo([n2x(v), LY - 0.36, 0])
    ));
    const unit = T('ml', P ? 16 : 17, C.muted); unit.moveTo([x0 + L0 + 0.3, LY, 0]);
    const gold = new M.DashedLine({ start: [n2x(501), LY, 0], end: [n2x(501), goldTop, 0], color: C.amber, strokeWidth: 3 });
    const goldTag = pill('TRUE 501', C.amber, 16); goldTag.moveTo([n2x(501), goldTop + 0.3, 0]);
    const dial = new M.Line({ start: [n2x(500), LY, 0], end: [n2x(500), goldTop, 0], color: C.muted, strokeWidth: 2.5 });
    const dialTag = pill('DIAL 500', C.muted, 16); dialTag.moveTo([n2x(500), goldTop + 0.3, 0]);
    return { axis, ticks, unit, gold, goldTag, dial, dialTag };
  }
  const A = [502, 500, 501.5, 500.5], B = [501, 500, 500.75, 500.25];
  const fmt = v => String(v);
  function dot(val, y, color, big) {
    const p = [n2x(val), y, 0];
    const halo = new M.Dot({ point: p, radius: big ? 0.24 : 0.19, color }); halo.setFill(color, 0.25);
    const d = new M.Dot({ point: p, radius: 0.1, color });
    return { g: new M.VGroup(halo, d), d, p };
  }
  function buildRows() {
    const head = [T('sample', P ? 17 : 16, C.muted), T('A', NUM, C.cyan, true, true), T('B', NUM, PINK, true, true)];
    head[0].moveTo([tab.xS, tab.head, 0]); head[1].moveTo([tab.xA, tab.head, 0]); head[2].moveTo([tab.xB, tab.head, 0]);
    const rows = A.map((a, k) => {
      const y = rowY(k);
      const guide = new M.DashedLine({ start: [x0, y, 0], end: [x0 + L0, y, 0], color: C.grid, strokeWidth: 1.2 });
      const sTag = T(`S${k + 1}`, P ? 16 : 17, C.muted, true);
      sTag.moveTo(P ? [n2x(499.25), y, 0] : [tab.xS, tab.y(k), 0]);
      const da = dot(a, y, C.cyan, true), db = dot(B[k], y, PINK, false);
      const ta = T(fmt(a), NUM, C.cyan, true); ta.moveTo([tab.xA, tab.y(k), 0]);
      const tb = T(fmt(B[k]), NUM, PINK, true); tb.moveTo([tab.xB, tab.y(k), 0]);
      const rowTag = P ? T(`S${k + 1}`, NUM, C.muted, true).moveTo([tab.xS, tab.y(k), 0]) : null;
      const arrow = a !== B[k]
        ? new M.Arrow({ start: [n2x(a) - 0.12, y, 0], end: [n2x(B[k]) + 0.1, y, 0], color: PINK, strokeWidth: 3, buff: 0, tipLength: 0.14 })
        : null;
      return { y, guide, sTag, rowTag, da, db, ta, tb, arrow };
    });
    return { head, rows };
  }

  const base = buildBase();
  const R = buildRows();
  const row = R.rows;
  const rowLeft = k => [row[k].guide, row[k].sTag, ...(row[k].rowTag ? [row[k].rowTag] : [])];

  // 0: back at bottling plant
  await until(S(0));
  await play(new M.Create(base.axis), new M.FadeIn(new M.VGroup(...base.ticks, base.unit)), ...say('4 BOTTLES EACH DAY'));

  // 1: true average fill 501
  await until(S(1));
  await play(new M.Create(base.gold), new M.FadeIn(base.goldTag), ...say('TRUE MEAN = 501 ml (HIDDEN)', C.amber));

  // 2: two people, two ways
  await until(S(2));
  await play(...fbox(['Two recipes', ['A: inspector', C.cyan], ['B: manager', PINK]], C.ink), ...say('TWO RECIPES, SAME 4 BOTTLES', C.ink));

  // 3: Recipe A = plain average
  await until(S(3));
  await play(...fbox([['Recipe A', C.cyan], 'plain average of 4 fills'], C.cyan), ...say('RECIPE A: PLAIN AVERAGE', C.cyan));

  // 4: manager & dial 500
  await until(S(4));
  await play(new M.Create(base.dial), new M.FadeIn(base.dialTag), ...say('DIAL SETTING = 500 ml', C.muted));

  // 5: Recipe B = halfway to 500
  await until(S(5));
  await play(...fbox([['Recipe B', PINK], '(sample mean + 500) ÷ 2'], PINK), ...say('RECIPE B: HALFWAY TO 500', PINK));

  // 6: dial vs true average
  await until(S(6));
  await play(new M.Indicate(base.dial, { color: C.muted }), new M.Indicate(base.gold, { color: C.amber }), ...say('DIAL 500 ≠ TRUE MEAN 501', C.amber));

  // 7: estimator = recipe
  await until(S(7));
  await play(...fbox([['ESTIMATOR', C.green], '= the recipe (rule)'], C.green), ...say('ESTIMATOR = THE RECIPE', C.green));

  // 8: estimate = number for one sample
  await until(S(8));
  await play(...fbox([['ESTIMATOR = recipe', C.green], ['ESTIMATE  = one guess', C.cyan]], C.green), ...say('ESTIMATE = ONE GUESS', C.cyan));

  // 9: try both on 4 samples (table header appears)
  await until(S(9));
  await play(new M.FadeIn(new M.VGroup(...R.head)), ...say('TRY BOTH ON 4 SAMPLES', C.ink));

  // 10: Sample 1: A = 502
  await until(S(10));
  await play(new M.FadeIn(new M.VGroup(...rowLeft(0))), new M.FadeIn(row[0].da.g), new M.FadeIn(row[0].ta),
    ...fbox(['Sample 1: mean 502', ['A = 502', C.cyan]], C.cyan), ...say('S1: RECIPE A = 502'));

  // 11: Sample 1: B = 501 (halfway to the dial)
  await until(S(11));
  await play(new M.GrowArrow(row[0].arrow), new M.FadeIn(row[0].db.g), new M.FadeIn(row[0].tb),
    ...fbox(['Sample 1: mean 502', ['A = 502', C.cyan], ['B = (502 + 500) ÷ 2 = 501', PINK]], PINK), ...say('S1: RECIPE B = 501', PINK));

  // 12: Sample 2: both = 500
  await until(S(12));
  await play(new M.FadeIn(new M.VGroup(...rowLeft(1))), new M.FadeIn(row[1].da.g), new M.FadeIn(row[1].db.g),
    new M.FadeIn(row[1].ta), new M.FadeIn(row[1].tb),
    ...fbox(['Sample 2: mean 500', ['A = 500', C.cyan], ['B = 500', PINK]], C.ink), ...say('S2: BOTH = 500', C.ink));

  // 13: Sample 3: A = 501.5
  await until(S(13));
  await play(new M.FadeIn(new M.VGroup(...rowLeft(2))), new M.FadeIn(row[2].da.g), new M.FadeIn(row[2].ta),
    ...fbox(['Sample 3: mean 501.5', ['A = 501.5', C.cyan], 'gap to dial 500 = 1.5'], C.cyan), ...say('S3: A = 501.5 (1.5 ABOVE DIAL)'));

  // 14: Sample 3: B = 500.75
  await until(S(14));
  await play(new M.GrowArrow(row[2].arrow), new M.FadeIn(row[2].db.g), new M.FadeIn(row[2].tb),
    ...fbox(['Sample 3: mean 501.5', 'half of 1.5 = 0.75', ['B = 500 + 0.75 = 500.75', PINK]], PINK), ...say('S3: B = 500.75', PINK));

  // 15: Sample 4: A = 500.5, B = 500.25
  await until(S(15));
  await play(new M.FadeIn(new M.VGroup(...rowLeft(3))), new M.FadeIn(row[3].da.g), new M.FadeIn(row[3].ta),
    new M.GrowArrow(row[3].arrow), new M.FadeIn(row[3].db.g), new M.FadeIn(row[3].tb),
    ...fbox(['Sample 4: mean 500.5', ['A = 500.5', C.cyan], ['B = 500.25', PINK]], PINK), ...say('S4: A = 500.5  ·  B = 500.25', PINK));

  const arrows = row.filter(r => r.arrow).map(r => r.arrow);

  // 16: cyan dots A and pink dots B
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...arrows)),
    new M.LaggedStart(row.flatMap(r => [r.da.d, r.db.d]).map(d => new M.Indicate(d)), { lagRatio: 0.08, runTime: 1.5 }),
    ...say('CYAN = A   ·   PINK = B', C.ink));

  // 17: where is the middle?
  await until(S(17));
  await play(...clearBox(), ...say('WHERE IS THE MIDDLE OF EACH?', C.amber));

  // 18: A adds to 2004, avg 501 (marker just above the axis + table footer)
  const tri = (v, color) => {
    const t = new M.Polygon({ vertices: [[n2x(v), LY + 0.08, 0], [n2x(v) - 0.15, LY + 0.36, 0], [n2x(v) + 0.15, LY + 0.36, 0]], color });
    t.setFill(color, 0.95); return t;
  };
  const triA = tri(501, C.cyan), triB = tri(500.5, PINK);
  const avgS = T('avg', P ? 17 : 17, C.amber, true); avgS.moveTo([tab.xS, tab.avg, 0]);
  const avgA = T('501', NUM, C.cyan, true, true); avgA.moveTo([tab.xA, tab.avg, 0]);
  const avgB = T('500.5', NUM, PINK, true, true); avgB.moveTo([tab.xB, tab.avg, 0]);
  await until(S(18));
  await play(new M.FadeIn(triA), new M.FadeIn(avgS), new M.FadeIn(avgA),
    ...fbox([['Recipe A, 4 samples', C.cyan], 'sum = 2,004', ['2,004 ÷ 4 = 501', C.cyan]], C.cyan), ...say('A AVERAGE = 501'));

  // 19: A middle sits on gold line
  await until(S(19));
  await play(new M.Indicate(triA, { color: C.amber }), new M.Indicate(base.gold, { color: C.amber }), ...say('RIGHT ON THE GOLD LINE', C.amber));

  // 20: B adds to 2002, avg 500.5
  await until(S(20));
  await play(new M.FadeIn(triB), new M.FadeIn(avgB),
    ...fbox([['Recipe B, 4 samples', PINK], 'sum = 2,002', ['2,002 ÷ 4 = 500.5', PINK]], PINK), ...say('B AVERAGE = 500.5', PINK));

  // 21: B middle is 0.5 below gold line
  const gapLine = new M.Line({ start: [n2x(500.5) + 0.16, LY + 0.22, 0], end: [n2x(501) - 0.16, LY + 0.22, 0], color: C.amber, strokeWidth: 5 });
  await until(S(21));
  await play(new M.Create(gapLine), new M.Indicate(triB, { color: PINK }), ...say('0.5 ml BELOW THE GOLD LINE', PINK));

  // histogram bars for many estimates (only inside 499..503)
  function makeHist(mu, sd, baseY, maxH, color) {
    const bars = [], nBins = 20, bw = 4 / nBins, pxW = L0 / nBins * 0.86;
    for (let i = 0; i < nBins; i++) {
      const vc = 499 + (i + 0.5) * bw, z = (vc - mu) / sd, h = maxH * Math.exp(-0.5 * z * z);
      if (h < 0.04) continue;
      const rect = new M.Rectangle({ width: pxW, height: h, color, strokeWidth: 1 });
      rect.setFill(color, 0.45); rect.moveTo([n2x(vc), baseY + h / 2, 0]); bars.push(rect);
    }
    return bars;
  }

  // 22: repeat every day for years
  const tableAll = [...R.head, ...row.flatMap(r => [r.ta, r.tb, ...(r.rowTag ? [r.rowTag] : [])]), avgS, avgA, avgB];
  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(...row.flatMap(r => [r.da.g, r.db.g, r.guide, r.sTag]), triA, triB, gapLine, ...tableAll)),
    ...say('REPEAT EVERY DAY FOR YEARS', C.ink));

  // 23: thousands of cyan estimates pile up around 501 (upper band)
  const baseA = LY + (P ? 1.8 : 1.7), baseB = LY + 0.04;
  const hA = goldTop - baseA - 0.15, hB = baseA - baseB - 0.35;
  const histA = makeHist(501, 1.0, baseA, hA, C.cyan);
  const baseLineA = new M.Line({ start: [x0, baseA, 0], end: [x0 + L0, baseA, 0], color: C.muted, strokeWidth: 1.5 });
  const meanLineA = new M.Line({ start: [n2x(501), baseA, 0], end: [n2x(501), baseA + hA + 0.05, 0], color: C.cyan, strokeWidth: 4 });
  const labA = T('many A', NUM, C.cyan, true); labA.moveTo([x0 + 0.1 + labA.getWidth() / 2, baseA + hA - 0.05, 0]);
  await until(S(23));
  await play(new M.Create(baseLineA), new M.LaggedStart(histA.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.Create(meanLineA), new M.FadeIn(labA), ...say('THOUSANDS OF A: MIDDLE = 501', C.cyan));

  // 24: thousands of pink estimates pile up around 500.5 (lower band)
  const histB = makeHist(500.5, 0.5, baseB, hB, PINK);
  const meanLineB = new M.Line({ start: [n2x(500.5), baseB, 0], end: [n2x(500.5), baseB + hB + 0.05, 0], color: PINK, strokeWidth: 4 });
  const labB = T('many B', NUM, PINK, true); labB.moveTo([x0 + 0.1 + labB.getWidth() / 2, baseB + hB - 0.05, 0]);
  await until(S(24));
  await play(new M.LaggedStart(histB.map(b => new M.FadeIn(b)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.Create(meanLineB), new M.FadeIn(labB), ...say('THOUSANDS OF B: MIDDLE = 500.5', PINK));

  // 25: long-run mean = expected value
  await until(S(25));
  await play(...fbox(['LONG-RUN MEAN', '(= expected value)', ['A: 501   B: 500.5', C.amber]], C.amber), ...say('LONG-RUN MEAN = EXPECTED VALUE', C.amber));

  // 26: why 500.5? sample means centre on 501
  await until(S(26));
  await play(new M.Indicate(meanLineA, { color: C.cyan }), ...say('SAMPLE MEANS CENTRE ON 501', C.cyan));

  // 27: halfway between 501 and 500 is 500.5
  await until(S(27));
  await play(...fbox([['Recipe B long-run mean', PINK], '(501 + 500) ÷ 2', ['= 500.5 ml', PINK]], PINK), ...say('HALFWAY: 501 → 500 = 500.5', PINK));

  // 28: B always leans toward dial, 0.5 too low
  const biasY = baseA - 0.18;
  const biasArrow = new M.Arrow({ start: [n2x(501), biasY, 0], end: [n2x(500.5), biasY, 0], color: C.amber, strokeWidth: 4, buff: 0, tipLength: 0.16 });
  await until(S(28));
  await play(new M.GrowArrow(biasArrow), ...say('LEANS 0.5 ml TOO LOW', PINK));

  // 29: this long-run lean is called bias
  await until(S(29));
  await play(...fbox([['BIAS', C.amber], '= long-run lean'], C.amber), ...say('BIAS = LONG-RUN LEAN', C.amber));

  // 30: bias formula
  await until(S(30));
  await play(...fbox([['bias =', C.amber], 'long-run mean', '  − true value'], C.amber), ...say('BIAS = LONG-RUN MEAN − TRUTH', C.amber));

  // 31: Recipe A bias = 0
  await until(S(31));
  await play(new M.Indicate(meanLineA, { color: C.cyan }), ...fbox([['Recipe A', C.cyan], '501 − 501 = 0', ['no lean', C.green]], C.cyan), ...say('RECIPE A: BIAS = 0', C.cyan));

  // 32: unbiased
  await until(S(32));
  await play(...fbox([['UNBIASED', C.green], 'bias = 0'], C.green), ...say('ZERO BIAS = UNBIASED', C.green));

  // 33: Recipe B bias = -0.5
  await until(S(33));
  await play(new M.Indicate(meanLineB, { color: PINK }), ...fbox([['Recipe B', PINK], '500.5 − 501', ['= −0.5 ml', PINK]], PINK), ...say('RECIPE B: BIAS = −0.5 ml', PINK));

  // 34: minus sign = leans low
  await until(S(34));
  await play(new M.Indicate(biasArrow, { color: PINK }), ...say('MINUS SIGN = LEANS LOW', PINK));

  // 35-36: two archers analogy (big targets; stacked on phone)
  const TR = P ? 1.45 : 1.45;
  const tp1 = P ? [0, 0.55] : [-4.2, -0.9], tp2 = P ? [0, -3.85] : [-0.4, -0.9];
  function makeTarget([cx, cy], color, shots) {
    const r3 = new M.Circle({ radius: TR, color: C.muted, strokeWidth: 2 }); r3.moveTo([cx, cy, 0]);
    const r2 = new M.Circle({ radius: TR * 0.62, color: C.muted, strokeWidth: 2 }); r2.moveTo([cx, cy, 0]);
    const r1 = new M.Circle({ radius: TR * 0.24, color: C.amber, strokeWidth: 2.5 }); r1.setFill(C.amber, 0.3); r1.moveTo([cx, cy, 0]);
    const k = TR / 1.1;
    const pts = shots.map(([dx, dy]) => new M.Dot({ point: [cx + dx * k, cy + dy * k, 0], radius: 0.11, color }));
    return new M.VGroup(r3, r2, r1, ...pts);
  }
  const t1 = makeTarget(tp1, C.cyan, [[-0.5, 0.4], [0.45, 0.35], [-0.35, -0.5], [0.55, -0.25], [0.05, 0.55], [-0.15, -0.1]]);
  const t2 = makeTarget(tp2, PINK, [[-0.55, 0.15], [-0.42, -0.18], [-0.62, -0.05], [-0.38, 0.22], [-0.50, 0.02], [-0.46, -0.24]]);
  const t1Lab = T('no bias: all around', P ? 20 : 20, C.cyan, true); t1Lab.moveTo([tp1[0], tp1[1] - TR - 0.4, 0]);
  const t2Lab = T('biased: leans left', P ? 20 : 20, PINK, true); t2Lab.moveTo([tp2[0], tp2[1] - TR - 0.4, 0]);

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(base.axis, ...base.ticks, base.unit, base.gold, base.goldTag, base.dial, base.dialTag, baseLineA, ...histA, ...histB, meanLineA, meanLineB, labA, labB, biasArrow)),
    ...clearBox(),
    new M.FadeIn(t1), new M.FadeIn(t2), ...say('TWO ARCHERS', C.amber));

  // 36: first has no bias, second has
  await until(S(36));
  await play(new M.FadeIn(t1Lab), new M.FadeIn(t2Lab), ...say('NO BIAS vs BIASED', C.ink));

  // 37: what is it for?
  await until(S(37));
  await play(...fbox(['What is bias for?', ['spots a lean to', C.amber], ['one side', C.amber]], C.amber), ...say('SPOTS A LEAN TO ONE SIDE', C.amber));

  // 38: know its lean before trusting
  await until(S(38));
  await play(...say('KNOW THE LEAN BEFORE YOU TRUST IT', C.green));

  // 39: Trap - about the recipe, not one guess: the line and the 4 samples come back (fresh objects)
  const base2 = buildBase();
  const R2 = buildRows();
  const row2 = R2.rows;
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(t1, t2, t1Lab, t2Lab)), ...clearBox(),
    new M.FadeIn(new M.VGroup(base2.axis, ...base2.ticks, base2.unit, base2.gold, base2.goldTag, base2.dial, base2.dialTag)),
    new M.FadeIn(new M.VGroup(...R2.head, ...row2.flatMap(r => [r.guide, r.sTag, ...(r.rowTag ? [r.rowTag] : []), r.da.g, r.db.g, r.ta, r.tb]))),
    ...say('TRAP: BIAS IS ABOUT THE RECIPE', C.violet));

  // 40: Sample 1, B = 501 (perfect hit)
  await until(S(40));
  await play(new M.Flash(row2[0].db.d, { color: C.amber }), new M.Indicate(row2[0].tb, { color: C.amber }),
    ...fbox(['Sample 1', ['B = 501: exact hit!', PINK]], C.violet), ...say('S1: B HIT 501 EXACTLY!', PINK));

  // 41: yet B is still biased
  await until(S(41));
  await play(...fbox(['One lucky hit ≠ unbiased', ['B still leans −0.5 ml', PINK]], C.violet), ...say('ONE LUCKY HIT ≠ UNBIASED', C.violet));

  // 42: A can miss by 1 ml
  const missA = new M.Line({ start: [n2x(501), row2[0].y + 0.3, 0], end: [n2x(502), row2[0].y + 0.3, 0], color: C.violet, strokeWidth: 5 });
  await until(S(42));
  await play(new M.Create(missA), new M.Indicate(row2[0].ta, { color: C.cyan }),
    ...fbox(['Sample 1', ['A = 502: missed by 1 ml', C.cyan], 'still unbiased!'], C.cyan), ...say('UNBIASED ≠ ALWAYS RIGHT', C.cyan));

  // 43: look at pink dots — closer together (brackets show the width of each group)
  const brA = new M.Line({ start: [n2x(500), LY + 0.34, 0], end: [n2x(502), LY + 0.34, 0], color: C.cyan, strokeWidth: 5 });
  const brB = new M.Line({ start: [n2x(500), LY + 0.16, 0], end: [n2x(501), LY + 0.16, 0], color: PINK, strokeWidth: 5 });
  await until(S(43));
  await play(new M.FadeOut(missA), new M.Create(brA), ...clearBox(),
    new M.LaggedStart(row2.map(r => new M.Indicate(r.db.d, { color: PINK })), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('PINK DOTS SIT CLOSER TOGETHER', PINK));
  await play(new M.Create(brB), ...fbox([['A spread: 500 to 502', C.cyan], ['B spread: 500 to 501', PINK]], C.ink));

  // 44: next lesson — spread
  await until(S(44));
  await play(...say('NEXT: HOW WIDELY GUESSES SPREAD', C.cyan));

  // 45: one-sentence summary
  await until(S(45));
  await play(new M.FadeOut(new M.VGroup(brA, brB)),
    ...fbox([['BIAS =', C.amber], 'long-run average guess', '  − true value'], C.green), ...say('BIAS = LONG-RUN MEAN − TRUTH', C.green));
}

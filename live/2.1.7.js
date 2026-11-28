// 2.1.7 Density curves: smooth shape (live manim-web lesson).
// Beat i = sentence i (0-based, 60 sentences: 0..59). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Exact Saturday library visits from chapters/2.1.md (sorted, with purpose colour)
  // borrow: cyan (7), computer: violet (5), study: amber (9), event: pink (3)
  const VISITS = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan], [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber], [60, C.amber], [60, C.amber], [75, C.amber],
    [85, C.pink], [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];
  const VALS = VISITS.map(v => v[0]);
  const N = VALS.length;

  // Contrasting Monday visits for two-curve comparison (Beats 45-46)
  const MON_VALS = [
    12, 18, 24, 28, 32, 36, 40, 42, 45, 46, 48, 50,
    52, 54, 56, 58, 60, 64, 68, 74, 80, 88, 96, 112,
  ];

  // Responsive layout constants
  // Laptop (14.22 x 8): content y in [-3.0, 2.3]
  // Phone  (8 x 14.22): content y in [-5.5, 4.3]
  const X_MIN = -25, X_MAX = 185, X_SPAN = X_MAX - X_MIN; // 210 min -> 84 steps of 2.5 min
  const X0 = P ? -3.55 : -6.35;
  const X1 = P ? 3.65 : 1.95;
  const CX = (X0 + X1) / 2;
  const BASE = P ? -3.55 : -1.95;
  const CHART_H = P ? 4.20 : 3.05;
  const TOP_Y = BASE + CHART_H;
  const PILL = P ? [0, 2.02, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.58, -0.35, 0];

  const n2x = v => X0 + ((v - X_MIN) / X_SPAN) * (X1 - X0);
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time, never over the data
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const dense = lines.length > 3;
    const size = P ? (dense ? 17 : 19) : (dense ? 18 : 20);
    const lh = P ? (dense ? 0.31 : 0.38) : (dense ? 0.36 : 0.39);
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62;
    const ht = rows.length * lh + (dense ? 0.28 : 0.32);
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31;
    const top = BOXP[1] + ht / 2 - (dense ? 0.14 : 0.16) - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 4.35;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Gaussian KDE math on exact 2.5-minute grid (hits 0, 60, 100 and all 5-min multiples)
  const STEPS = 84;
  const XS = Array.from({ length: STEPS + 1 }, (_, i) => X_MIN + i * 2.5);
  const IDX_0 = 10, IDX_60 = 34, IDX_100 = 50;
  const H_MAIN = 10;
  const SQRT2PI = Math.sqrt(2 * Math.PI);

  const gauss = (x, v, h) => Math.exp(-0.5 * ((x - v) / h) ** 2) / (N * h * SQRT2PI);
  const kdeVals = (vals, x, h) => {
    let sum = 0;
    for (let i = 0; i < vals.length; i++) sum += Math.exp(-0.5 * ((x - vals[i]) / h) ** 2);
    return sum / (vals.length * h * SQRT2PI);
  };

  const MAIN_DENS = XS.map(x => kdeVals(VALS, x, H_MAIN));
  const MAIN_MAX = Math.max(...MAIN_DENS);
  const D_UNIT = (CHART_H * 0.74) / MAIN_MAX; // maps main peak to 74% of CHART_H
  const d2y = d => BASE + d * D_UNIT;

  const mainPts = XS.map((x, i) => [n2x(x), d2y(MAIN_DENS[i]), 0]);

  // Wide (flat lump) and narrow (spiky) curves for Beats 49-50
  const WIDE_DENS = XS.map(x => kdeVals(VALS, x, 34));
  const widePts = XS.map((x, i) => [n2x(x), d2y(WIDE_DENS[i]), 0]);

  const NARROW_RAW = XS.map(x => kdeVals(VALS, x, 2.1));
  const NARROW_MAX = Math.max(...NARROW_RAW);
  const narrowScale = (CHART_H * 0.96) / NARROW_MAX;
  const narrowPts = XS.map((x, i) => [n2x(x), BASE + NARROW_RAW[i] * narrowScale, 0]);

  // Monday comparison curve for Beats 45-46
  const monPts = XS.map(x => [n2x(x), d2y(kdeVals(MON_VALS, x, H_MAIN)), 0]);

  // Geometry helpers
  function glowDot(p, color, r = P ? 0.058 : 0.064) {
    const halo = new M.Dot({ point: p, radius: r * 2.1, color });
    halo.setFill(color, 0.20);
    const d = new M.Dot({ point: p, radius: r, color });
    d.setFill(color, 1);
    return new M.VGroup(halo, d);
  }

  function tag(text, pos, color = C.amber, size = 15) {
    const t = T(text, size, color, true);
    const r = new M.RoundedRectangle({ width: t.getWidth() + 0.28, height: 0.36, cornerRadius: 0.13, color, strokeWidth: 1.8 });
    r.setFill(C.bg, 0.94);
    r.moveTo(pos);
    t.moveTo(pos);
    return new M.VGroup(r, t);
  }

  function makeCurveSegs(pts, color = C.cyan, sw = 4.2, iStart = 0, iEnd = STEPS) {
    const segs = [];
    for (let i = iStart; i < iEnd; i++) {
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: sw }));
    }
    return segs;
  }

  function makeCurveFill(pts, iStart, iEnd, color, op = 0.26) {
    const strips = [];
    for (let i = iStart; i < iEnd; i++) {
      const xL = pts[i][0], xR = pts[i + 1][0];
      const yAvg = (pts[i][1] + pts[i + 1][1]) / 2;
      const bh = yAvg - BASE;
      if (bh < 0.012) continue;
      const r = new M.Rectangle({ width: (xR - xL) * 1.07, height: bh, color, strokeWidth: 0 });
      r.setFill(color, op);
      r.setStrokeOpacity(0);
      r.moveTo([(xL + xR) / 2, BASE + bh / 2, 0]);
      strips.push(r);
    }
    return new M.VGroup(...strips);
  }

  function makeSingleHill(v, color, fillOp = 0.45, sw = 2.4, withFill = true) {
    const a = Math.max(X_MIN, v - 28), b = Math.min(X_MAX, v + 28);
    const M_SEG = 16;
    const pts = [];
    for (let j = 0; j <= M_SEG; j++) {
      const x = a + (j / M_SEG) * (b - a);
      pts.push([n2x(x), d2y(gauss(x, v, H_MAIN)), 0]);
    }
    const parts = [];
    if (withFill) {
      for (let j = 0; j < M_SEG; j++) {
        const xL = pts[j][0], xR = pts[j + 1][0];
        const bh = (pts[j][1] + pts[j + 1][1]) / 2 - BASE;
        if (bh < 0.008) continue;
        const r = new M.Rectangle({ width: (xR - xL) * 1.08, height: bh, color, strokeWidth: 0 });
        r.setFill(color, fillOp);
        r.setStrokeOpacity(0);
        r.moveTo([(xL + xR) / 2, BASE + bh / 2, 0]);
        parts.push(r);
      }
    }
    for (let j = 0; j < M_SEG; j++) {
      parts.push(new M.Line({ start: pts[j], end: pts[j + 1], color, strokeWidth: sw }));
    }
    return new M.VGroup(...parts);
  }

  function makeBracket(v1, v2, label, color, y, above = true) {
    const x1 = n2x(v1), x2 = n2x(v2);
    const l0 = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 2.2 });
    const t1 = new M.Line({ start: [x1, y - 0.07, 0], end: [x1, y + 0.07, 0], color, strokeWidth: 2.2 });
    const t2 = new M.Line({ start: [x2, y - 0.07, 0], end: [x2, y + 0.07, 0], color, strokeWidth: 2.2 });
    const lb = T(label, 15, color, true);
    lb.moveTo([(x1 + x2) / 2, y + (above ? 0.24 : -0.24), 0]);
    return new M.VGroup(l0, t1, t2, lb);
  }

  // ===========================================================================
  // BEATS 0–1: Librarian's comfy chairs & 60–100 minute question
  // ===========================================================================
  const MID_Y = P ? -1.25 : -0.35;
  const cardW = P ? 6.2 : 6.6, cardH = P ? 3.2 : 2.9;
  const cardBg = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.22, color: C.line, strokeWidth: 2 });
  cardBg.setFill(C.card, 0.94);
  cardBg.moveTo([CX, MID_Y, 0]);

  // Cozy armchair icon on the left side of the card
  const chX = CX - (P ? 1.55 : 1.75), chY = MID_Y + 0.25;
  const chBack = new M.RoundedRectangle({ width: 1.05, height: 0.85, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.5 });
  chBack.setFill(C.amber, 0.24); chBack.moveTo([chX, chY + 0.34, 0]);
  const chSeat = new M.RoundedRectangle({ width: 1.20, height: 0.40, cornerRadius: 0.12, color: C.amber, strokeWidth: 2.5 });
  chSeat.setFill(C.amber, 0.42); chSeat.moveTo([chX, chY - 0.12, 0]);
  const chArmL = new M.RoundedRectangle({ width: 0.26, height: 0.54, cornerRadius: 0.10, color: C.amber, strokeWidth: 2.2 });
  chArmL.setFill(C.amber, 0.32); chArmL.moveTo([chX - 0.56, chY + 0.04, 0]);
  const chArmR = new M.RoundedRectangle({ width: 0.26, height: 0.54, cornerRadius: 0.10, color: C.amber, strokeWidth: 2.2 });
  chArmR.setFill(C.amber, 0.32); chArmR.moveTo([chX + 0.56, chY + 0.04, 0]);
  const chLegL = new M.Line({ start: [chX - 0.44, chY - 0.32, 0], end: [chX - 0.44, chY - 0.54, 0], color: C.muted, strokeWidth: 3 });
  const chLegR = new M.Line({ start: [chX + 0.44, chY - 0.32, 0], end: [chX + 0.44, chY - 0.54, 0], color: C.muted, strokeWidth: 3 });

  const cTitle = T('Town Library', P ? 23 : 25, C.ink, false, true);
  cTitle.moveTo([CX + (P ? 1.0 : 1.1), MID_Y + 0.62, 0]);
  const cSub = T('Comfy chairs for', P ? 18 : 20, C.muted);
  cSub.moveTo([CX + (P ? 1.0 : 1.1), MID_Y + 0.18, 0]);
  const cSub2 = T('longer visits?', P ? 19 : 21, C.amber, true);
  cSub2.moveTo([CX + (P ? 1.0 : 1.1), MID_Y - 0.22, 0]);
  const introCard = new M.VGroup(cardBg, chBack, chSeat, chArmL, chArmR, chLegL, chLegR, cTitle, cSub, cSub2);

  // Beat 0: The librarian is thinking about adding comfy chairs for longer visits.
  await until(S(0));
  await play(new M.FadeIn(introCard), ...say('COMFY CHAIRS FOR LONGER VISITS?', C.amber));

  // Beat 1: She asks: what share of visits last between sixty and one hundred minutes?
  const barY = MID_Y - 0.98;
  const barL = CX - cardW * 0.38, barR = CX + cardW * 0.38;
  const m2bx = v => barL + (v / 160) * (barR - barL);
  const miniLine = new M.Line({ start: [barL, barY, 0], end: [barR, barY, 0], color: C.muted, strokeWidth: 2.5 });
  const hiBar = new M.RoundedRectangle({ width: m2bx(100) - m2bx(60), height: 0.34, cornerRadius: 0.08, color: C.green, strokeWidth: 2.2 });
  hiBar.setFill(C.green, 0.34); hiBar.moveTo([(m2bx(60) + m2bx(100)) / 2, barY, 0]);
  const hiTxt = T('60–100 min?', P ? 15 : 16, C.green, true);
  hiTxt.moveTo([(m2bx(60) + m2bx(100)) / 2, barY - 0.34, 0]);
  const introRange = new M.VGroup(miniLine, hiBar, hiTxt);

  await until(S(1));
  await play(
    new M.FadeIn(introRange),
    new M.Indicate(hiBar, { color: C.green }),
    ...fbox([['Librarian asks:', C.muted], ['what share last', C.ink], ['60 to 100 minutes?', C.green]], C.amber),
    ...say('WHAT SHARE LAST 60 TO 100 MIN?', C.amber)
  );

  // ===========================================================================
  // BEATS 2–5: 24 Saturday dots on minute line, boxy bars & edge sensitivity
  // ===========================================================================
  const axisLine = new M.Line({ start: [X0, BASE, 0], end: [X1, BASE, 0], color: C.muted, strokeWidth: 2.6 });
  const tickParts = [];
  for (let v = 0; v <= 180; v += 20) {
    const x = n2x(v);
    tickParts.push(new M.Line({ start: [x, BASE - 0.07, 0], end: [x, BASE + 0.07, 0], color: v === 0 ? C.ink : C.muted, strokeWidth: v === 0 ? 2.4 : 1.8 }));
    const lb = T(String(v), 15, v === 0 ? C.ink : C.muted, true);
    lb.moveTo([x, BASE - (P ? 0.32 : 0.28), 0]);
    tickParts.push(lb);
  }
  const unitLab = T('minutes', 15, C.muted);
  unitLab.moveTo([X1 - 0.35, BASE - (P ? 0.68 : 0.56), 0]);
  const mainAxis = new M.VGroup(axisLine, ...tickParts, unitLab);

  // Purpose colour legend below axis (never overlaps ticks or unit label)
  const legDefs = [['borrow', C.cyan], ['computer', C.violet], ['study', C.amber], ['event', C.pink]];
  const legY = P ? -4.78 : -2.80;
  const legSp = P ? 1.78 : 1.88;
  const legend = new M.VGroup(...legDefs.flatMap(([name, col], i) => {
    const lx = (P ? 0 : CX - 0.25) + (i - 1.5) * legSp;
    const dt = new M.Dot({ point: [lx - 0.46, legY, 0], radius: 0.06, color: col });
    dt.setFill(col, 1);
    const tx = T(name, 15, col);
    tx.moveTo([lx + 0.08, legY, 0]);
    return [dt, tx];
  }));

  // 24 visitor dots along the minute line (duplicate times stack gently)
  const dots = VISITS.map(([v, col], k) => {
    const dup = VALS.slice(0, k).filter(x => x === v).length;
    return glowDot([n2x(v), BASE + 0.14 + dup * 0.18, 0], col);
  });

  // Beat 2: Here are our twenty-four Saturday visits again, shown as dots on the minute line.
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(introCard, introRange), { runTime: 0.5 }),
    new M.Create(axisLine, { runTime: 0.8 }),
    new M.FadeIn(new M.VGroup(...tickParts, unitLab, legend), { runTime: 0.7 }),
    new M.LaggedStart(dots.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.5 }),
    ...fbox(['24 Saturday visits', ['borrow · computer', C.cyan], ['study  · event', C.amber]]),
    ...say('24 SATURDAY VISITS ON THE LINE')
  );

  // Beat 3: We could group these dots into boxy bars, like we did earlier in this chapter.
  // Exact 20-min bins from chapters/2.1.md: 0-20:7, 20-40:5, 40-60:4, 60-80:3, 80-100:4, 160-180:1
  function makeHistBars(specs, color) {
    const unitH = (CHART_H * 0.72) / 7;
    const rects = specs.map(([a, b, cnt]) => {
      const xL = n2x(a), xR = n2x(b), bh = cnt * unitH;
      const r = new M.Rectangle({ width: xR - xL, height: bh, color, strokeWidth: 2 });
      r.setFill(color, 0.28);
      r.moveTo([(xL + xR) / 2, BASE + bh / 2, 0]);
      return r;
    });
    return new M.VGroup(...rects);
  }
  const bars0 = makeHistBars([[0, 20, 7], [20, 40, 5], [40, 60, 4], [60, 80, 3], [80, 100, 4], [160, 180, 1]], C.cyan);

  await until(S(3));
  await play(
    new M.FadeIn(bars0, { runTime: 0.9 }),
    ...fbox(['20-minute bars:', ['edges: 0, 20, 40, ...', C.cyan]]),
    ...say('BOXY BARS (20-MINUTE BINS)')
  );

  // Beat 4: But boxy bars change shape depending on where you draw their edges.
  // Shifted 20-min bins (-10..10:2, 10..30:7, 30..50:5, 50..70:4, 70..90:2, 90..110:3, 150..170:1)
  const bars10 = makeHistBars([[-10, 10, 2], [10, 30, 7], [30, 50, 5], [50, 70, 4], [70, 90, 2], [90, 110, 3], [150, 170, 1]], C.pink);

  await until(S(4));
  await play(
    new M.FadeOut(bars0, { runTime: 0.5 }),
    new M.FadeIn(bars10, { runTime: 0.8 }),
    ...fbox(['Shift edges by 10 min:', 'edges: 10, 30, 50, ...', ['shape changes!', C.pink]], C.pink),
    ...say('MOVE EDGES → SHAPE CHANGES', C.pink)
  );

  // Beat 5: Let's try a smoother way, with no bar edges at all.
  await until(S(5));
  await play(
    new M.FadeOut(bars10, { runTime: 0.6 }),
    ...clearBox(),
    ...say('A SMOOTHER WAY: NO BAR EDGES', C.green)
  );

  // ===========================================================================
  // BEATS 6–15: Sand scoops → soft hills → stacking → one smooth outline
  // ===========================================================================
  // Beat 6: Imagine each visitor holds the exact same small scoop of sand.
  const scX = n2x(75), scY = BASE + CHART_H * 0.56;
  const scoopBowl = new M.Arc({ radius: 0.34, startAngle: Math.PI, angle: Math.PI, color: C.amber, strokeWidth: 3 });
  scoopBowl.setFill(C.amber, 0.55); scoopBowl.moveTo([scX, scY, 0]);
  const scoopRim = new M.Line({ start: [scX - 0.34, scY + 0.14, 0], end: [scX + 0.34, scY + 0.14, 0], color: C.amber, strokeWidth: 2.5 });
  const scoopHandle = new M.Line({ start: [scX + 0.32, scY + 0.14, 0], end: [scX + 0.76, scY + 0.32, 0], color: C.muted, strokeWidth: 3.5 });
  const scoopLab = T('1 scoop of sand', P ? 15 : 16, C.amber, true);
  scoopLab.moveTo([scX + 0.12, scY + 0.54, 0]);
  const scoopGroup = new M.VGroup(scoopBowl, scoopRim, scoopHandle, scoopLab);

  await until(S(6));
  await play(
    new M.FadeIn(scoopGroup, { runTime: 0.9 }),
    new M.Indicate(dots[18], { color: C.amber }),
    ...fbox(['Every visitor holds:', ['1 equal scoop of sand', C.amber]], C.amber),
    ...say('EACH VISITOR: 1 EQUAL SCOOP', C.amber)
  );

  // Beat 7: Each visitor pours their scoop onto their own dot.
  const pourDrops = Array.from({ length: 6 }, (_, j) => {
    const py = scY - 0.24 - j * ((scY - 0.36 - BASE) / 5.5);
    const d = new M.Dot({ point: [scX + (j % 2 === 0 ? -0.04 : 0.04), py, 0], radius: 0.045, color: C.amber });
    d.setFill(C.amber, 0.95);
    return d;
  });

  await until(S(7));
  await play(
    new M.LaggedStart(pourDrops.map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 1.1 }),
    new M.Flash(dots[18].submobjects[1], { color: C.amber }),
    ...say('POUR SAND ONTO YOUR OWN DOT', C.amber)
  );

  // Beat 8: It settles into a small, soft hill right around that minute.
  const demoHill = makeSingleHill(75, C.amber, 0.55, 3.0, true);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(scoopGroup, ...pourDrops), { runTime: 0.5 }),
    new M.FadeIn(demoHill, { runTime: 0.9 }),
    ...fbox(['1 scoop poured at 75:', ['→ 1 small, soft hill', C.amber]], C.amber),
    ...say('SETTLES INTO A SMALL SOFT HILL', C.amber)
  );

  // Beat 9: Let's watch the hills appear, one visitor at a time.
  const indivHills = VISITS.map(([v, col]) => makeSingleHill(v, col, 0, 2.0, false));

  await until(S(9));
  await play(
    new M.FadeOut(demoHill, { runTime: 0.4 }),
    new M.LaggedStart(indivHills.map(h => new M.FadeIn(h)), { lagRatio: 0.06, runTime: 2.0 }),
    ...fbox(['24 visitors', ['→ 24 small soft hills', C.cyan]]),
    ...say('ONE HILL PER VISITOR (24 TOTAL)')
  );

  // Beat 10: Where dots sit close together, the hills overlap, and their heights stack up.
  const leftPartialSegs = makeCurveSegs(mainPts, C.amber, 4.0, 0, 36);
  const leftPartialFill = makeCurveFill(mainPts, 0, 36, C.amber, 0.22);
  const stackArr = new M.Arrow({
    start: [n2x(12.5), BASE + 0.34, 0],
    end: [n2x(12.5), d2y(MAIN_DENS[15]) - 0.06, 0],
    color: C.amber, strokeWidth: 3,
  });
  const stackTag = tag('heights stack up!', [n2x(36), d2y(MAIN_DENS[15]) + 0.20, 0], C.amber);

  await until(S(10));
  await play(
    new M.FadeIn(leftPartialFill, { runTime: 0.8 }),
    new M.LaggedStart(leftPartialSegs.map(s => new M.Create(s)), { lagRatio: 0.02, runTime: 1.3 }),
    new M.Create(stackArr, { runTime: 0.8 }),
    new M.FadeIn(stackTag, { runTime: 0.7 }),
    ...fbox(['Close dots:', 'hills overlap &', ['heights stack up', C.amber]], C.amber),
    ...say('CLOSE DOTS → HILLS STACK UP', C.amber)
  );

  // Beat 11: Where dots sit far apart, each little hill stays low on its own.
  const lowHill160 = makeSingleHill(160, C.amber, 0.55, 3.0, true);
  const lowTag = tag('stays low', [n2x(158), d2y(MAIN_DENS[74]) + 0.46, 0], C.amber);
  const farBr = makeBracket(104, 135, 'far apart', C.ink, BASE + 0.92, true);

  await until(S(11));
  await play(
    new M.FadeIn(lowHill160, { runTime: 0.7 }),
    new M.FadeIn(lowTag, { runTime: 0.7 }),
    new M.FadeIn(farBr, { runTime: 0.7 }),
    new M.Flash(dots[23].submobjects[1], { color: C.amber }),
    ...fbox(['Far apart:', ['each little hill', C.ink], ['stays low on its own', C.muted]], C.muted),
    ...say('FAR APART → HILLS STAY LOW', C.muted)
  );

  // Beat 12: Together, all twenty-four hills blend into one smooth outline across the minute line.
  const curveSegs = makeCurveSegs(mainPts, C.cyan, 4.4);

  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...indivHills, ...leftPartialSegs, leftPartialFill, stackArr, stackTag, lowHill160, lowTag, farBr), { runTime: 0.55 }),
    new M.LaggedStart(curveSegs.map(s => new M.Create(s)), { lagRatio: 0.015, runTime: 1.9 }),
    ...fbox(['All 24 hills blend into', ['1 smooth outline', C.cyan]]),
    ...say('ALL 24 BLEND INTO ONE OUTLINE')
  );

  // Beat 13: The outline rises high on the left, where many short visits crowd together.
  const pkLx = n2x(12.5), pkLy = d2y(MAIN_DENS[15]);
  const pkLDot = new M.Dot({ point: [pkLx, pkLy, 0], radius: 0.09, color: C.cyan });
  const pkLTag = tag('high: short visits', [n2x(36), pkLy + 0.36, 0], C.cyan);
  const peakLCall = new M.VGroup(pkLDot, pkLTag);

  await until(S(13));
  await play(
    new M.FadeIn(peakLCall, { runTime: 0.7 }),
    new M.LaggedStart(dots.slice(0, 7).map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['Left peak:', 'many short visits', ['crowd together', C.cyan]]),
    ...say('HIGH ON LEFT: SHORT VISITS')
  );

  // Beat 14: It rises again near ninety minutes, where the event visits and longer study visits sit.
  const pk90x = n2x(90), pk90y = d2y(MAIN_DENS[46]);
  const pk90Dot = new M.Dot({ point: [pk90x, pk90y, 0], radius: 0.09, color: C.pink });
  const pk90Tag = tag('rises near 90', [pk90x + (P ? 0.1 : 0.2), pk90y + 0.44, 0], C.pink);
  const peak90Call = new M.VGroup(pk90Dot, pk90Tag);

  await until(S(14));
  await play(
    new M.FadeOut(peakLCall, { runTime: 0.45 }),
    new M.FadeIn(peak90Call, { runTime: 0.7 }),
    new M.LaggedStart(dots.slice(18, 23).map(d => new M.Indicate(d, { color: C.pink })), { lagRatio: 0.12, runTime: 1.5 }),
    ...fbox(['Second rise near 90:', ['event & longer study', C.pink]], C.pink),
    ...say('RISES NEAR 90: STUDY & EVENT', C.pink)
  );

  // Beat 15: And one lonely little hill sits at one hundred and sixty: our all-afternoon student.
  const pk160x = n2x(160), pk160y = d2y(MAIN_DENS[74]);
  const pk160Dot = new M.Dot({ point: [pk160x, pk160y, 0], radius: 0.09, color: C.amber });
  const pk160Tag = tag('160 min (1 student)', [n2x(146), pk160y + 0.56, 0], C.amber);
  const hill160Call = new M.VGroup(pk160Dot, pk160Tag);

  await until(S(15));
  await play(
    new M.FadeOut(peak90Call, { runTime: 0.45 }),
    new M.FadeIn(hill160Call, { runTime: 0.7 }),
    new M.Flash(dots[23].submobjects[1], { color: C.amber }),
    ...fbox(['At 160 minutes:', ['1 lonely little hill', C.amber], ['all-afternoon student', C.muted]], C.amber),
    ...say('LONELY HILL AT 160 MINUTES', C.amber)
  );

  // ===========================================================================
  // BEATS 16–25: Naming "density curve" and explaining "area = 1"
  // ===========================================================================
  // Beat 16: This smooth outline is called a density curve.
  await until(S(16));
  await play(
    new M.FadeOut(hill160Call, { runTime: 0.4 }),
    new M.LaggedStart(curveSegs.map(s => new M.Indicate(s, { color: C.green })), { lagRatio: 0.012, runTime: 1.4 }),
    ...fbox([['Density curve', C.green], ['smooth outline of data', C.ink]], C.green),
    ...say('DENSITY CURVE', C.green)
  );

  // Beat 17: Here, density just means how tightly the visits are packed along the line.
  const packTight = makeBracket(4, 22, 'tightly packed', C.cyan, BASE + CHART_H * 0.84, true);
  const packSpread = makeBracket(106, 152, 'spread apart', C.muted, BASE + 0.56, true);

  await until(S(17));
  await play(
    new M.FadeIn(packTight, { runTime: 0.7 }),
    new M.FadeIn(packSpread, { runTime: 0.7 }),
    ...fbox([['Density =', C.cyan], ['how tightly visits', C.ink], ['are packed on the line', C.muted]]),
    ...say('DENSITY = HOW TIGHTLY PACKED')
  );

  // Beat 18: The curve is higher where visits crowd together, and lower where they spread apart.
  const hiArr = new M.Arrow({ start: [n2x(12.5), BASE + 0.35, 0], end: [n2x(12.5), pkLy - 0.05, 0], color: C.amber, strokeWidth: 3 });
  const loArr = new M.Arrow({ start: [n2x(130), BASE + 0.48, 0], end: [n2x(130), BASE + 0.08, 0], color: C.muted, strokeWidth: 2.5 });

  await until(S(18));
  await play(
    new M.Create(hiArr, { runTime: 0.7 }),
    new M.Create(loArr, { runTime: 0.7 }),
    ...fbox([['crowded  → higher', C.amber], ['spread   → lower', C.muted]], C.amber),
    ...say('CROWDED = HIGHER · SPREAD = LOWER', C.amber)
  );

  // Beat 19: Remember, every visitor poured the exact same scoop of sand.
  const scoopNote = tag('each dot = 1 equal scoop', [n2x(118), BASE + CHART_H * 0.76, 0], C.amber);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(packTight, packSpread, hiArr, loArr), { runTime: 0.45 }),
    new M.FadeIn(scoopNote, { runTime: 0.6 }),
    new M.LaggedStart([dots[0], dots[7], dots[14], dots[20], dots[23]].map(d => new M.Flash(d.submobjects[1], { color: C.amber })), { lagRatio: 0.14, runTime: 1.3 }),
    ...fbox(['Remember:', ['every visitor poured', C.ink], ['the exact same scoop', C.amber]], C.amber),
    ...say('EVERY VISITOR: SAME SCOOP', C.amber)
  );

  // Beat 20: Put all twenty-four scoops together, and you have the whole pile: one hundred percent of the visits.
  const sandFill = makeCurveFill(mainPts, 0, STEPS, C.amber, 0.42);

  await until(S(20));
  await play(
    new M.FadeOut(scoopNote, { runTime: 0.4 }),
    new M.FadeIn(sandFill, { runTime: 1.2 }),
    ...fbox(['All 24 scoops together', '= the whole pile', ['= 100% of the visits', C.amber]], C.amber),
    ...say('ALL 24 SCOOPS = 100% OF VISITS', C.amber)
  );

  // Beat 21: The space under the curve, filled with all that sand, is called its area.
  const areaPos = [n2x(118), BASE + CHART_H * 0.76, 0];
  const areaBadge = pill('AREA', C.amber, P ? 18 : 19);
  areaBadge.moveTo(areaPos);
  const areaPtr = new M.Arrow({ start: [n2x(96), BASE + CHART_H * 0.72, 0], end: [n2x(46), BASE + CHART_H * 0.34, 0], color: C.amber, strokeWidth: 2.8 });

  await until(S(21));
  await play(
    new M.FadeIn(areaBadge, { runTime: 0.7 }),
    new M.Create(areaPtr, { runTime: 0.7 }),
    ...fbox([['Area =', C.amber], ['all the space', C.ink], ['under the curve', C.ink]], C.amber),
    ...say('SPACE UNDER CURVE = AREA', C.amber)
  );

  // Beat 22: Because the curve holds one whole group, we say the whole area under the curve equals one.
  const areaOneBadge = pill('WHOLE AREA = 1', C.green, P ? 17 : 18);
  areaOneBadge.moveTo(areaPos);

  await until(S(22));
  await play(
    new M.FadeOut(areaBadge, { runTime: 0.4 }),
    new M.FadeIn(areaOneBadge, { runTime: 0.7 }),
    ...fbox(['Whole area under curve', ['= 1', C.green]], C.green),
    ...say('WHOLE AREA UNDER CURVE = 1', C.green)
  );

  // Beat 23: Think of that number one as meaning one whole, or one hundred percent.
  await until(S(23));
  await play(
    new M.Indicate(areaOneBadge, { color: C.green }),
    ...fbox([['area = 1', C.green], ['     = 1 whole', C.ink], ['     = 100%', C.amber]], C.green),
    ...say('1 = ONE WHOLE = 100%', C.green)
  );

  // Beat 24: So each visitor's scoop is one equal piece of that whole: one part out of twenty-four.
  const oneScoopHill = makeSingleHill(160, C.amber, 0.72, 3.2, true);
  const oneScoopTag = tag('1 / 24 of whole', [n2x(146), d2y(MAIN_DENS[74]) + 0.56, 0], C.amber);

  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(sandFill, areaOneBadge, areaPtr), { runTime: 0.5 }),
    new M.FadeIn(oneScoopHill, { runTime: 0.7 }),
    new M.FadeIn(oneScoopTag, { runTime: 0.7 }),
    new M.Flash(dots[23].submobjects[1], { color: C.amber }),
    ...fbox(['Whole pile = 1', '1 visitor’s scoop =', ['1 part out of 24 (1/24)', C.amber]], C.amber),
    ...say('EACH SCOOP = 1 PART OUT OF 24', C.amber)
  );

  // Beat 25: Now you can read a share of visits by looking at a slice of that area.
  const previewCuts = new M.VGroup(
    new M.DashedLine({ start: [n2x(25), BASE, 0], end: [n2x(25), TOP_Y * 0.9 + BASE * 0.1, 0], color: C.cyan }),
    new M.DashedLine({ start: [n2x(75), BASE, 0], end: [n2x(75), TOP_Y * 0.9 + BASE * 0.1, 0], color: C.cyan })
  );

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(oneScoopHill, oneScoopTag), { runTime: 0.45 }),
    new M.Create(previewCuts, { runTime: 0.8 }),
    ...fbox(['Slice of area', ['→ share of visits', C.cyan]]),
    ...say('SLICE OF AREA = SHARE OF VISITS')
  );

  // ===========================================================================
  // BEATS 26–31: Worked example 1 — shade 0 to 60 minutes (18/24 = 3/4 = 75%)
  // ===========================================================================
  // Beat 26: First, let's shade the area from zero to sixty minutes.
  const cutTop = BASE + CHART_H * 0.84;
  const cut0 = new M.DashedLine({ start: [n2x(0), BASE, 0], end: [n2x(0), cutTop, 0], color: C.cyan });
  const cut60 = new M.DashedLine({ start: [n2x(60), BASE, 0], end: [n2x(60), cutTop, 0], color: C.cyan });
  const shade0_60 = makeCurveFill(mainPts, IDX_0, IDX_60, C.cyan, 0.52);

  await until(S(26));
  await play(
    new M.FadeOut(previewCuts, { runTime: 0.4 }),
    new M.Create(cut0, { runTime: 0.6 }),
    new M.Create(cut60, { runTime: 0.6 }),
    new M.FadeIn(shade0_60, { runTime: 0.9 }),
    ...fbox(['Range: 0 to 60 min', ['shade under curve', C.cyan]]),
    ...say('SHADE 0 TO 60 MINUTES')
  );

  // Beat 27: The shaded slice holds about 64 percent of the sand.
  const eyeTag = tag('≈ 64% of sand', [n2x(31), cutTop + 0.28, 0], C.cyan, 18);

  await until(S(27));
  await play(
    new M.FadeIn(eyeTag, { runTime: 0.7 }),
    ...fbox(['0 to 60 min:', ['Shaded area ≈ 64%', C.cyan]]),
    ...say('AREA ESTIMATE')
  );

  // Beat 28: Let's check with the dots: eighteen of the twenty-four visits lasted sixty minutes or less.
  const dots18Tag = tag('18 of 24 dots ≤ 60', [n2x(122), BASE + CHART_H * 0.78, 0], C.green);

  await until(S(28));
  await play(
    new M.FadeIn(dots18Tag, { runTime: 0.6 }),
    new M.LaggedStart(dots.slice(0, 18).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.04, runTime: 1.6 }),
    ...fbox(['Check with dots:', ['≤ 60 min: 18 of 24', C.green]], C.green),
    ...say('CHECK DOTS: 18 OF 24 ARE ≤ 60', C.green)
  );

  // Beat 29: Out of twenty-four, every six visits is one quarter.
  const qCenterX = n2x(130), qY = BASE + CHART_H * 0.52;
  const qW = P ? 0.60 : 0.66, qGap = 0.08;
  const qRects = [], qNums = [];
  for (let q = 0; q < 4; q++) {
    const qx = qCenterX + (q - 1.5) * (qW + qGap);
    const r = new M.RoundedRectangle({ width: qW, height: 0.48, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
    r.setFill(C.amber, 0.16); r.moveTo([qx, qY, 0]);
    const tx = T('6', P ? 16 : 18, C.amber, true); tx.moveTo([qx, qY, 0]);
    qRects.push(r); qNums.push(tx);
  }
  const qCap = T('4 quarters = 24', 15, C.muted, true);
  qCap.moveTo([qCenterX, qY - 0.44, 0]);

  await until(S(29));
  await play(
    new M.LaggedStart(qRects.map(r => new M.FadeIn(r)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.LaggedStart(qNums.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.FadeIn(qCap, { runTime: 0.6 }),
    ...fbox(['Out of 24 visits:', ['every 6 = 1 quarter', C.amber], ['6 + 6 + 6 + 6 = 24', C.muted]], C.amber),
    ...say('EVERY 6 VISITS = 1 QUARTER', C.amber)
  );

  // Beat 30: So eighteen visits is three quarters, or seventy-five percent.
  await until(S(30));
  for (let q = 0; q < 3; q++) {
    qRects[q].setColor(C.green); qRects[q].setFill(C.green, 0.42);
    qNums[q].setColor(C.green);
  }
  await play(
    new M.LaggedStart([0, 1, 2].map(q => new M.Indicate(qRects[q], { color: C.green })), { lagRatio: 0.16, runTime: 1.1 }),
    ...fbox(['18 visits = 6 + 6 + 6', ['= 3 quarters (3/4)', C.green], ['= 75%', C.green]], C.green),
    ...say('18 VISITS = 3/4 = 75%', C.green)
  );

  // Beat 31: Compare the exact count with the shaded area.
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(...qRects, ...qNums, qCap), { runTime: 0.45 }),
    new M.Indicate(eyeTag, { color: C.green }),
    ...fbox([['Shaded area ≈ 64%', C.cyan], ['Exact count = 75%', C.green], 'Sand spreads past the cuts.'], C.green),
    ...say('AREA ESTIMATE AND EXACT COUNT', C.green)
  );

  // ===========================================================================
  // BEATS 32–39: Librarian's question — shade 60 to 100 minutes (5/24 ≈ 1/5)
  // ===========================================================================
  // Beat 32: Now back to the librarian's question: let's shade from sixty to one hundred minutes.
  const cut100 = new M.DashedLine({ start: [n2x(100), BASE, 0], end: [n2x(100), cutTop, 0], color: C.green });
  const shade60_100 = makeCurveFill(mainPts, IDX_60, IDX_100, C.green, 0.56);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(cut0, shade0_60, eyeTag, dots18Tag), { runTime: 0.45 }),
    new M.Create(cut100, { runTime: 0.6 }),
    new M.FadeIn(shade60_100, { runTime: 0.9 }),
    ...fbox(['Librarian’s question:', ['shade 60 to 100 min', C.green]], C.green),
    ...say('SHADE 60 TO 100 MINUTES', C.green)
  );

  // Beat 33: Count the dots past sixty and up to one hundred minutes: there are five.
  const dots5Tag = tag('5 dots', [n2x(80), cutTop + 0.24, 0], C.amber, 18);

  await until(S(33));
  await play(
    new M.FadeIn(dots5Tag, { runTime: 0.6 }),
    new M.LaggedStart(dots.slice(18, 23).map(d => new M.Flash(d.submobjects[1], { color: C.amber })), { lagRatio: 0.16, runTime: 1.5 }),
    ...fbox(['Past 60 up to 100:', '75, 85, 90, 90, 95', ['count = 5 of 24', C.amber]], C.amber),
    ...say('OVER 60 AND UP TO 100 MIN', C.amber)
  );

  // Beat 34: Five out of twenty-four is very close to five out of twenty-five.
  await until(S(34));
  await play(
    new M.Indicate(dots5Tag, { color: C.amber }),
    ...fbox(['5 out of 24', ['≈ 5 out of 25', C.amber]], C.amber),
    ...say('5 OF 24  ≈  5 OF 25', C.amber)
  );

  // Beat 35: That is roughly one visit in five, or just over twenty percent.
  await until(S(35));
  await play(
    ...fbox(['5 / 25 = 1 in 5 = 20%', ['5 / 24 ≈ 20.8%', C.green], ['just over 20%', C.green]], C.green),
    ...say('≈ 1 IN 5 (JUST OVER 20%)', C.green)
  );

  // Beat 36: Look at the shaded sand under the curve: its area is close to that same share.
  await until(S(36));
  await play(
    new M.Indicate(shade60_100, { color: C.green }),
    ...fbox([['Exact count: 5 of 24 ≈ 21%', C.amber], ['Shaded area ≈ 24%', C.green]], C.green),
    ...say('COMPARE AREA AND COUNT', C.green)
  );

  // Beat 37: Why only close, and not exact to the dot?
  const q60 = tag('?', [n2x(60), cutTop + 0.24, 0], C.amber, 18);
  const q100 = tag('?', [n2x(100), cutTop + 0.24, 0], C.amber, 18);

  await until(S(37));
  await play(
    new M.FadeOut(dots5Tag, { runTime: 0.4 }),
    new M.FadeIn(q60, { runTime: 0.6 }),
    new M.FadeIn(q100, { runTime: 0.6 }),
    ...fbox([['Why only close,', C.amber], ['not exact to the dot?', C.ink]], C.amber),
    ...say('WHY CLOSE, NOT EXACT?', C.amber)
  );

  // Beat 38: Each sand hill spreads out a little, so tiny bits of sand spill across the cut lines.
  const spillHill60 = makeSingleHill(60, C.amber, 0.58, 2.8, true);
  const spillHill95 = makeSingleHill(95, C.amber, 0.58, 2.8, true);
  const spillY = BASE + 0.36;
  const spillArr60 = new M.Arrow({ start: [n2x(52), spillY, 0], end: [n2x(72), spillY, 0], color: C.amber, strokeWidth: 2.8 });
  const spillArr100 = new M.Arrow({ start: [n2x(92), spillY, 0], end: [n2x(112), spillY, 0], color: C.amber, strokeWidth: 2.8 });

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(q60, q100), { runTime: 0.4 }),
    new M.FadeIn(spillHill60, { runTime: 0.7 }),
    new M.FadeIn(spillHill95, { runTime: 0.7 }),
    new M.Create(spillArr60, { runTime: 0.7 }),
    new M.Create(spillArr100, { runTime: 0.7 }),
    ...fbox(['Sand moves across the cuts', ['into or out of the shade.', C.amber]], C.amber),
    ...say('SAND SPILLS ACROSS CUT LINES', C.amber)
  );

  // Beat 39: So the librarian has her answer: roughly one visit in five lasts between sixty and one hundred minutes.
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(spillHill60, spillHill95, spillArr60, spillArr100), { runTime: 0.45 }),
    new M.Indicate(shade60_100, { color: C.green }),
    ...fbox(['Over 60 and up to 100 min:', ['5 of 24 visits ≈ 1 in 5', C.green]], C.green),
    ...say('ANSWER: ROUGHLY 1 VISIT IN 5', C.green)
  );

  // ===========================================================================
  // BEATS 40–46: Two-line rule & what density curves are for
  // ===========================================================================
  // Beat 40: Here is the rule in two short lines.
  await until(S(40));
  await play(
    ...fbox([['THE RULE', C.cyan], ['in two short lines', C.muted]]),
    ...say('THE RULE IN TWO SHORT LINES')
  );

  // Beat 41: The area under the curve between two times estimates the share of visits in that range.
  const ruleSliceTag = tag('slice area ≈ share', [n2x(102), BASE + CHART_H * 0.72, 0], C.green);

  await until(S(41));
  await play(
    new M.FadeIn(ruleSliceTag, { runTime: 0.7 }),
    new M.Indicate(shade60_100, { color: C.green }),
    ...fbox([['1. Area between 2 times', C.green], ['   ≈ share in that range', C.ink]], C.green),
    ...say('1. SLICE AREA ≈ SHARE IN RANGE', C.green)
  );

  // Beat 42: And the whole area under the curve equals one, meaning one hundred percent.
  const wholeSand = makeCurveFill(mainPts, 0, STEPS, C.amber, 0.36);
  const wholeTag = pill('WHOLE AREA = 1 (100%)', C.amber, P ? 16 : 17);
  wholeTag.moveTo([n2x(118), BASE + CHART_H * 0.76, 0]);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(cut60, cut100, shade60_100, ruleSliceTag), { runTime: 0.45 }),
    new M.FadeIn(wholeSand, { runTime: 0.8 }),
    new M.FadeIn(wholeTag, { runTime: 0.7 }),
    ...fbox([['1. Slice area ≈ share', C.green], ['2. Whole area = 1 (100%)', C.amber]], C.amber),
    ...say('2. WHOLE AREA = 1 (100%)', C.amber)
  );

  // Beat 43: A density curve works for any measurement on a number line, like times, heights, or prices.
  const mbY = BASE + CHART_H * 0.78;
  const mb1 = pill('TIMES', C.cyan, 15); mb1.moveTo([n2x(86), mbY, 0]);
  const mb2 = pill('HEIGHTS', C.violet, 15); mb2.moveTo([n2x(125), mbY, 0]);
  const mb3 = pill('PRICES', C.amber, 15); mb3.moveTo([n2x(164), mbY, 0]);
  const measBadges = [mb1, mb2, mb3];

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(wholeSand, wholeTag), { runTime: 0.45 }),
    new M.LaggedStart(measBadges.map(b => new M.FadeIn(b)), { lagRatio: 0.22, runTime: 1.2 }),
    ...fbox(['Any number line:', ['• times', C.cyan], ['• heights  • prices', C.amber]]),
    ...say('TIMES · HEIGHTS · PRICES')
  );

  // Beat 44: It shows the smooth shape of your measurements without you having to pick bar edges.
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(...measBadges), { runTime: 0.45 }),
    new M.LaggedStart(curveSegs.map(s => new M.Indicate(s, { color: C.green })), { lagRatio: 0.012, runTime: 1.4 }),
    ...fbox([['Smooth shape', C.green], ['no bar edges to pick', C.ink]], C.green),
    ...say('SMOOTH SHAPE · NO BAR EDGES', C.green)
  );

  // Beat 45: You can also draw two curves on the same line, like Saturday and Monday visits.
  const monSegs = makeCurveSegs(monPts, C.pink, 4.0);
  const satLab = tag('Saturday', [n2x(16), pkLy + 0.36, 0], C.cyan);
  const monPeakY = Math.max(...monPts.map(p => p[1]));
  const monLab = tag('Monday', [n2x(64), monPeakY + 0.36, 0], C.pink);

  await until(S(45));
  await play(
    new M.LaggedStart(monSegs.map(s => new M.Create(s)), { lagRatio: 0.015, runTime: 1.4 }),
    new M.FadeIn(satLab, { runTime: 0.6 }),
    new M.FadeIn(monLab, { runTime: 0.6 }),
    ...fbox(['Two curves, one line:', ['— Saturday', C.cyan], ['— Monday', C.pink]], C.pink),
    ...say('TWO CURVES: SATURDAY vs MONDAY', C.pink)
  );

  // Beat 46: That lets you compare their shapes at a glance, without messy overlapping bars.
  await until(S(46));
  await play(
    new M.Indicate(satLab, { color: C.cyan }),
    new M.Indicate(monLab, { color: C.pink }),
    ...fbox(['Compare at a glance:', ['clean smooth shapes', C.green], ['no messy bars', C.muted]], C.green),
    ...say('COMPARE SHAPES AT A GLANCE', C.green)
  );

  // ===========================================================================
  // BEATS 47–57: Two common traps (hill width & left-of-zero spill)
  // ===========================================================================
  // Beat 47: Now watch out for two common traps.
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(...monSegs, satLab, monLab), { runTime: 0.5 }),
    ...fbox([['WATCH OUT:', C.pink], ['two common traps', C.ink]], C.pink),
    ...say('WATCH OUT: TWO COMMON TRAPS', C.pink)
  );

  // Beat 48: First, how wide each sand hill spreads is a choice we make.
  const wY = d2y(MAIN_DENS[74]) + 0.32;
  const wL = new M.Arrow({ start: [n2x(160), wY, 0], end: [n2x(138), wY, 0], color: C.amber, strokeWidth: 2.6 });
  const wR = new M.Arrow({ start: [n2x(160), wY, 0], end: [n2x(182), wY, 0], color: C.amber, strokeWidth: 2.6 });
  const wLab = tag('hill width?', [n2x(156), wY + 0.42, 0], C.amber);
  const widthGuide = new M.VGroup(wL, wR, wLab);

  await until(S(48));
  await play(
    new M.Create(wL, { runTime: 0.6 }),
    new M.Create(wR, { runTime: 0.6 }),
    new M.FadeIn(wLab, { runTime: 0.6 }),
    ...fbox([['Trap 1: hill width', C.amber], ['how wide each hill spreads', C.ink], ['is a choice we make', C.muted]], C.amber),
    ...say('TRAP 1: HILL WIDTH IS A CHOICE', C.amber)
  );

  // Beat 49: Very wide hills melt our two crowds into one flat lump.
  await until(S(49));
  await play(
    new M.FadeOut(widthGuide, { runTime: 0.45 }),
    ...curveSegs.map((s, i) => new M.Transform(s, new M.Line({ start: widePts[i], end: widePts[i + 1], color: C.amber, strokeWidth: 4.4 }), { runTime: 1.2 })),
    ...fbox(['Very wide hills:', ['two crowds melt into', C.amber], ['one flat lump', C.pink]], C.amber),
    ...say('TOO WIDE → ONE FLAT LUMP', C.amber)
  );

  // Beat 50: Very narrow hills make a spiky curve, with a bump at every dot.
  await until(S(50));
  await play(
    ...curveSegs.map((s, i) => new M.Transform(s, new M.Line({ start: narrowPts[i], end: narrowPts[i + 1], color: C.violet, strokeWidth: 3.6 }), { runTime: 1.2 })),
    ...fbox(['Very narrow hills:', ['spiky curve with bumps', C.violet], ['near the dots', C.pink]], C.violet),
    ...say('TOO NARROW → SPIKY BUMPS', C.violet)
  );

  // Beat 51: So try a few widths, and trust the shape that stays.
  await until(S(51));
  await play(
    ...curveSegs.map((s, i) => new M.Transform(s, new M.Line({ start: mainPts[i], end: mainPts[i + 1], color: C.cyan, strokeWidth: 4.4 }), { runTime: 1.2 })),
    ...fbox(['Try a few widths:', ['trust the shape that stays', C.green]], C.green),
    ...say('TRY WIDTHS · TRUST WHAT STAYS', C.green)
  );

  // Beat 52: Second, look at the far left, right near zero minutes.
  const zeroWall = new M.DashedLine({ start: [n2x(0), BASE - 0.08, 0], end: [n2x(0), cutTop, 0], color: C.pink, strokeWidth: 2.8 });
  const zeroLab = tag('0 min', [n2x(0) + 0.05, cutTop + 0.18, 0], C.pink);
  const zeroPtr = new M.Arrow({ start: [n2x(36), BASE + CHART_H * 0.84, 0], end: [n2x(4), BASE + CHART_H * 0.68, 0], color: C.pink, strokeWidth: 2.8 });

  await until(S(52));
  await play(
    new M.Create(zeroWall, { runTime: 0.7 }),
    new M.FadeIn(zeroLab, { runTime: 0.6 }),
    new M.Create(zeroPtr, { runTime: 0.7 }),
    ...fbox([['Trap 2: near the edge', C.pink], ['look near 0 minutes', C.ink]], C.pink),
    ...say('TRAP 2: LOOK NEAR ZERO MINUTES', C.pink)
  );

  // Beat 53: The sand hill for our five-minute visit spills slightly to the left of zero.
  const hill5 = makeSingleHill(5, C.amber, 0.65, 3.2, true);

  await until(S(53));
  await play(
    new M.FadeOut(zeroPtr, { runTime: 0.4 }),
    new M.Flash(dots[0].submobjects[1], { color: C.amber }),
    new M.FadeIn(hill5, { runTime: 0.8 }),
    ...fbox(['5-minute visit’s hill', ['spills left of 0 min', C.amber]], C.amber),
    ...say('5-MIN HILL SPILLS PAST ZERO', C.amber)
  );

  // Beat 54: So the curve puts a tiny bit of area below zero minutes.
  const negShade = makeCurveFill(mainPts, 0, IDX_0, C.pink, 0.66);

  await until(S(54));
  await play(
    new M.FadeIn(negShade, { runTime: 0.8 }),
    ...fbox(['About 5% of the area', ['lies below 0 minutes.', C.pink]], C.pink),
    ...say('AREA BELOW ZERO MINUTES', C.pink)
  );

  // Beat 55: Of course, no library visit can last less than zero minutes.
  const xC = n2x(-10), yC = BASE + 0.34;
  const negX = new M.VGroup(
    new M.Line({ start: [xC - 0.18, yC - 0.18, 0], end: [xC + 0.18, yC + 0.18, 0], color: C.pink, strokeWidth: 4 }),
    new M.Line({ start: [xC - 0.18, yC + 0.18, 0], end: [xC + 0.18, yC - 0.18, 0], color: C.pink, strokeWidth: 4 })
  );

  await until(S(55));
  await play(
    new M.Create(negX, { runTime: 0.7 }),
    new M.Indicate(zeroWall, { color: C.pink }),
    ...fbox(['No library visit can', ['last less than 0 min!', C.pink]], C.pink),
    ...say('NO VISIT LASTS < 0 MINUTES', C.pink)
  );

  // Beat 56: A density curve is a smoothed picture of the data, not the actual visits themselves.
  await until(S(56));
  await play(
    new M.FadeOut(new M.VGroup(hill5, negX), { runTime: 0.45 }),
    new M.LaggedStart(curveSegs.map(s => new M.Indicate(s, { color: C.cyan })), { lagRatio: 0.012, runTime: 1.3 }),
    ...fbox([['Density curve =', C.cyan], ['smoothed picture,', C.ink], ['not the raw visits', C.muted]]),
    ...say('SMOOTHED PICTURE, NOT RAW VISITS')
  );

  // Beat 57: Always read it with care near the edges, and check the dots when in doubt.
  await until(S(57));
  await play(
    new M.FadeOut(new M.VGroup(zeroWall, zeroLab, negShade), { runTime: 0.45 }),
    new M.LaggedStart(dots.slice(0, 7).map(d => new M.Flash(d.submobjects[1], { color: C.green })), { lagRatio: 0.10, runTime: 1.3 }),
    ...fbox(['Near the edges:', 'read with care &', ['check the dots!', C.green]], C.green),
    ...say('CHECK THE DOTS NEAR EDGES', C.green)
  );

  // ===========================================================================
  // BEATS 58–59: Recap & bridge to next lesson (everyday words for shapes)
  // ===========================================================================
  // Beat 58: Recap: a density curve smooths dots into one outline, where the area between two numbers shows the share.
  const recapCut60 = new M.DashedLine({ start: [n2x(60), BASE, 0], end: [n2x(60), cutTop, 0], color: C.green });
  const recapCut100 = new M.DashedLine({ start: [n2x(100), BASE, 0], end: [n2x(100), cutTop, 0], color: C.green });
  const recapShade = makeCurveFill(mainPts, IDX_60, IDX_100, C.green, 0.50);

  await until(S(58));
  await play(
    new M.Create(recapCut60, { runTime: 0.6 }),
    new M.Create(recapCut100, { runTime: 0.6 }),
    new M.FadeIn(recapShade, { runTime: 0.8 }),
    new M.LaggedStart(curveSegs.map(s => new M.Indicate(s, { color: C.cyan })), { lagRatio: 0.012, runTime: 1.5 }),
    ...fbox([['DENSITY CURVE', C.green], ['• smooths dots → outline', C.cyan], ['• slice area ≈ share', C.green], ['• whole area = 1 (100%)', C.amber]], C.green),
    ...say('RECAP: SMOOTH AREA ESTIMATES SHARE', C.green)
  );

  // Beat 59: Next, we will learn the everyday words for the shapes these curves make.
  const shTag1 = tag('2 peaks?', [n2x(48), pkLy + 0.34, 0], C.violet);
  const shTag2 = tag('long tail?', [n2x(146), BASE + CHART_H * 0.42, 0], C.violet);
  const tailArr = new M.Arrow({ start: [n2x(118), BASE + CHART_H * 0.32, 0], end: [n2x(166), BASE + CHART_H * 0.20, 0], color: C.violet, strokeWidth: 2.6 });

  await until(S(59));
  await play(
    new M.FadeOut(new M.VGroup(recapCut60, recapCut100, recapShade), { runTime: 0.45 }),
    new M.FadeIn(shTag1, { runTime: 0.7 }),
    new M.FadeIn(shTag2, { runTime: 0.7 }),
    new M.Create(tailArr, { runTime: 0.7 }),
    ...fbox([['Next lesson:', C.violet], ['everyday words for', C.ink], ['curve shapes', C.violet]], C.violet),
    ...say('NEXT: WORDS FOR CURVE SHAPES', C.violet)
  );
}

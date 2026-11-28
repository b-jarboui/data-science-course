// lesson 13.1.1
// Decision boundaries: where one label becomes another.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// The Try it beats preview the separate interactive activity.
// Uses the supplied engine interface; browser rendering has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ============================================================
  // COURSE COLOURS AND RESPONSIVE LAYOUT
  // ============================================================

  const PLUM = C.violet || '#A78BFA';
  const APPLE = C.orange || '#FB923C';
  const WHITE = '#FFFFFF';
  const GOLD = C.amber;
  const GRID = C.muted;

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.45, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.75, 0]
    : [4.3, -0.3, 0];

  // Phone: content between y = -6.3 and 4.4.
  // Laptop: content between y = -3.5 and 2.3.

  const XL = P ? -2.75 : -5.55;
  const XR = P ? 3.55 : 0.85;
  const YB = P ? -5.45 : -2.70;
  const YT = P ? 1.70 : 1.12;

  const XMAX = 8.5;
  const YMAX = 8.5;

  const DX = (XR - XL) / XMAX;
  const DY = (YT - YB) / YMAX;

  const X = x => XL + x * DX;
  const Y = y => YB + y * DY;

  const xy = (x, y) => [X(x), Y(y), 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fs = P ? 16 : 17;
  const FR = P ? 0.145 : 0.125;

  const HUE = [
    '#EF4444',
    '#F97316',
    '#FB923C',
    '#FBBF24',
    '#FACC15',
    '#A3E635',
    '#65A30D',
    '#22C55E'
  ];

  // ============================================================
  // EXACT SHARED CHAPTER DATA
  // ============================================================

  // Weight is stored in grams.
  // Plotting converts weight to grid units by dividing by 50.
  // Firmness is retained for chapter consistency, but is not
  // used by the classifier in this lesson.

  const DATA = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 150, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 100, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 100, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 200, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 400, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 1, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 300, hue: 5, firmness: 2 }
  ];

  const NEW_FRUIT = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  const BOUNDARY = 3.5;
  const BOUNDARY_GRAMS = BOUNDARY * 50;

  const weightUnits = grams => grams / 50;

  const score = (x, b = BOUNDARY) => x - b;

  function prediction(x, b = BOUNDARY) {
    const s = score(x, b);

    if (s < 0) return 'PLUM';
    if (s > 0) return 'APPLE';

    return 'TIE';
  }

  function number(v) {
    const n = Number(v.toFixed(6));

    return n < 0
      ? '−' + String(Math.abs(n))
      : String(n);
  }

  function signed(v) {
    const n = Number(v.toFixed(6));

    if (n > 0) return '+' + String(n);
    if (n < 0) return '−' + String(Math.abs(n));

    return '0';
  }

  const predColor = label =>
    label === 'PLUM' ? PLUM :
    label === 'APPLE' ? APPLE :
    GOLD;

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function line(start, end, color = GRID, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function dashed(start, end, color = GRID) {
    return new M.DashedLine({
      start,
      end,
      color
    });
  }

  function rect(w, h, p, color, opacity = 0, stroke = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: stroke
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(w, h, p, color, opacity = 0) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 17) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  function reveal(objects, runTime = 1.0, lagRatio = 0.12) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function remove(objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));
  }

  function diamond(p, r, color, opacity = 1, stroke = 2) {
    const side = r * Math.sqrt(2);

    const d = new M.Rectangle({
      width: side,
      height: side,
      color,
      strokeWidth: stroke
    });

    d.setFill(color, opacity);
    d.rotate(Math.PI / 4);
    d.moveTo(p);

    return d;
  }

  // ============================================================
  // ONE FORMULA / INFORMATION BOX
  // ============================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21;
    const lh = P ? 0.33 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.62;
    const ht = rows.length * lh + 0.28;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.15,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.31;

    const top =
      BOXP[1] + ht / 2 - 0.14 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 0.9 : 4.0;

    if (wd > maxw) {
      g.scale(maxw / wd);
    }

    const animations = [];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    animations.push(new M.FadeIn(g));

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // FRUIT SYMBOLS
  // ============================================================

  function fruit(label, p, r = FR) {
    const color = label === 'plum' ? PLUM : APPLE;

    const halo = new M.Dot({
      point: p,
      radius: r * 1.75,
      color
    });

    halo.setFill(color, 0.14);

    let body;

    if (label === 'plum') {
      body = new M.Circle({
        radius: r,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);
    } else {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);
    }

    return new M.VGroup(halo, body);
  }

  function unknown(p, r = FR * 1.2) {
    const outer = new M.Dot({
      point: p,
      radius: r * 1.9,
      color: WHITE
    });

    outer.setFill(WHITE, 0.09);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.4,
      color: WHITE
    });

    inner.setFill(WHITE, 0.16);

    const body = diamond(p, r, WHITE, 1, 2);

    return new M.VGroup(outer, inner, body);
  }

  function plottedFruit(d) {
    return fruit(
      d.label,
      xy(weightUnits(d.weight), d.hue)
    );
  }

  function originalPoints() {
    return DATA.map(plottedFruit);
  }

  function ring(p, color = GOLD, r = FR * 2) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: 2.5
    });

    c.setFill(color, 0);
    c.moveTo(p);

    return c;
  }

  // ============================================================
  // PACKING STATION HELPERS
  // ============================================================

  const SY = P ? -3.70 : -1.12;
  const MY = P ? -0.40 : 0.36;

  const BX = [
    CX - 1.47,
    CX + 1.47
  ];

  function basket(label, color, x) {
    const w = 2.52;
    const h = 1.02;

    const body = rounded(
      w,
      h,
      [x, SY, 0],
      color,
      0.78
    );

    const rim = line(
      [x - w / 2 - 0.08, SY + h / 2, 0],
      [x + w / 2 + 0.08, SY + h / 2, 0],
      color,
      3
    );

    const slats = [-0.82, -0.41, 0, 0.41, 0.82].map(v =>
      line(
        [x + v, SY - 0.42, 0],
        [x + v, SY - 0.25, 0],
        color,
        1.5
      )
    );

    const labelText = tag(
      label,
      color,
      [x, SY - 0.85, 0],
      17
    );

    return new M.VGroup(
      body,
      rim,
      ...slats,
      labelText
    );
  }

  function station() {
    const y = MY + 0.58;

    const base = rounded(
      5.70,
      0.42,
      [CX, y, 0],
      C.muted,
      0.9
    );

    const rollers = Array.from({ length: 11 }, (_, i) => {
      const x = CX + (i - 5) * 0.48;

      const c = new M.Circle({
        radius: 0.105,
        color: C.muted,
        strokeWidth: 1.5
      });

      c.setFill(C.card, 1);
      c.moveTo([x, y, 0]);

      return c;
    });

    const title = text(
      'FRUIT PACKING STATION',
      18,
      C.ink,
      [CX, y + 0.40, 0],
      true
    );

    return new M.VGroup(base, ...rollers, title);
  }

  function machine() {
    const p = [CX, MY - 0.28, 0];

    const body = rounded(
      2.16,
      0.76,
      p,
      C.cyan,
      0.94
    );

    const label = text(
      'SORTER',
      20,
      C.cyan,
      p,
      true
    );

    const left = line(
      [CX - 0.53, MY - 0.68, 0],
      [BX[0], SY + 0.54, 0],
      PLUM,
      2
    );

    const right = line(
      [CX + 0.53, MY - 0.68, 0],
      [BX[1], SY + 0.54, 0],
      APPLE,
      2
    );

    return new M.VGroup(left, right, body, label);
  }

  function basketPosition(group, i) {
    return [
      BX[group] + (i - 1.5) * 0.48,
      SY + 0.08,
      0
    ];
  }

  // ============================================================
  // AXES, GRID AND FIXED HUE STRIP
  // ============================================================

  function horizontalStrip() {
    const w = P ? 0.34 : 0.35;
    const h = 0.30;

    const parts = [];

    HUE.forEach((c, i) => {
      const x = BOXP[0] + (i - 3.5) * w;

      parts.push(
        rect(w * 0.98, h, [x, BOXP[1], 0], c, 1, 1)
      );

      parts.push(
        text(
          String(i + 1),
          15,
          C.ink,
          [x, BOXP[1] - 0.34, 0],
          true
        )
      );
    });

    parts.push(
      text('red', 16, HUE[0], [BOXP[0] - 4 * w - 0.42, BOXP[1], 0]),
      text('green', 16, HUE[7], [BOXP[0] + 4 * w + 0.55, BOXP[1], 0])
    );

    parts.push(
      text(
        'FIXED COLOUR STRIP',
        17,
        C.ink,
        [BOXP[0], BOXP[1] + 0.36, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalStrip() {
    const sx = XL - (P ? 0.72 : 0.83);
    const sw = P ? 0.24 : 0.27;

    const parts = [];

    HUE.forEach((c, i) => {
      parts.push(
        rect(
          sw,
          DY * 0.98,
          [sx, Y(i + 1), 0],
          c,
          1,
          1
        )
      );
    });

    const heading = text(
      'Hue',
      fs,
      C.ink,
      [XL - 0.47, YT + 0.3, 0]
    );

    return new M.VGroup(
      ...parts,
      heading
    );
  }

  function horizontalAxis() {
    const parts = [
      line([XL, YB, 0], [XR, YB, 0], C.muted, 2.5)
    ];

    for (let x = 0; x <= 8; x++) {
      parts.push(
        line(
          [X(x), YB - 0.055, 0],
          [X(x), YB + 0.055, 0],
          C.muted,
          1.5
        )
      );

      parts.push(
        text(
          String(x * 50),
          P ? 15 : 16,
          C.muted,
          [X(x), YB - 0.23, 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Weight (grams) →',
        18,
        C.ink,
        [(XL + XR) / 2, YB - 0.78, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalAxis() {
    const parts = [
      line([XL, YB, 0], [XL, YT, 0], C.muted, 2.5)
    ];

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          [XL - 0.055, Y(y), 0],
          [XL + 0.055, Y(y), 0],
          C.muted,
          1.5
        )
      );

      parts.push(
        text(
          String(y),
          fs,
          C.muted,
          [XL - 0.24, Y(y), 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function graphGrid() {
    const parts = [];

    for (let x = 1; x <= 8; x++) {
      parts.push(
        line(
          [X(x), YB, 0],
          [X(x), YT, 0],
          GRID,
          0.65
        )
      );
    }

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          [XL, Y(y), 0],
          [XR, Y(y), 0],
          GRID,
          0.65
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // DECISION BOUNDARY AND REGIONS
  // ============================================================

  function boundaryAt(b) {
    return line(
      [X(b), YB, 0],
      [X(b), YT, 0],
      GOLD,
      3.5
    );
  }

  function boundaryTag(b) {
    return tag(
      `${number(b * 50)} g`,
      GOLD,
      [X(b), YT + 0.25, 0],
      P ? 16 : 17
    );
  }

  function regionsAt(b) {
    const bx = X(b);
    const h = YT - YB;
    const cy = (YT + YB) / 2;

    const left = rect(
      bx - XL,
      h,
      [(XL + bx) / 2, cy, 0],
      PLUM,
      0.15,
      0
    );

    const right = rect(
      XR - bx,
      h,
      [(XR + bx) / 2, cy, 0],
      APPLE,
      0.13,
      0
    );

    return new M.VGroup(left, right);
  }

  function regionLabel(label, b) {
    const isPlum = label === 'PLUM';

    const x = isPlum
      ? (XL + X(b)) / 2
      : (X(b) + XR) / 2;

    return tag(
      label,
      isPlum ? PLUM : APPLE,
      [x, Y(7.65), 0],
      P ? 16 : 17
    );
  }

  function gapOutline() {
    return rect(
      DX,
      YT - YB,
      [X(3.5), (YT + YB) / 2, 0],
      GOLD,
      0.09,
      2
    );
  }

  function measureBar(x1, x2, hue, color, label) {
    const y = Y(hue);

    const a = X(x1);
    const b = X(x2);

    const parts = [
      line([a, y, 0], [b, y, 0], color, 2.5),

      line(
        [a, y - 0.075, 0],
        [a, y + 0.075, 0],
        color,
        2
      ),

      line(
        [b, y - 0.075, 0],
        [b, y + 0.075, 0],
        color,
        2
      )
    ];

    if (label) {
      parts.push(
        text(
          label,
          P ? 15 : 16,
          color,
          [(a + b) / 2, y + 0.20, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function scoreDistance(x, hue, b = BOUNDARY) {
    const s = score(x, b);
    const color = predColor(prediction(x, b));

    return measureBar(
      Math.min(x, b),
      Math.max(x, b),
      hue + 0.48,
      color,
      signed(s)
    );
  }

  function scoreBox(x, b = BOUNDARY) {
    const p = prediction(x, b);
    const s = score(x, b);

    return fbox([
      ['classification score', C.ink],
      [`${number(x)} − ${number(b)} = ${signed(s)}`, predColor(p)],
      [
        p === 'TIE'
          ? 'extra rule needed'
          : `prediction: ${p.toLowerCase()}`,
        predColor(p)
      ]
    ], predColor(p));
  }

  // ============================================================
  // BEATS 0–8: FRUIT PACKING AND MEASUREMENTS
  // ============================================================

  const packingStation = station();

  const baskets = [
    basket('PLUMS', PLUM, BX[0]),
    basket('APPLES', APPLE, BX[1])
  ];

  const sorter = machine();

  const stagedPlums = DATA.slice(0, 4).map((d, i) =>
    fruit(d.label, basketPosition(0, i), FR * 1.25)
  );

  const stagedApples = DATA.slice(4).map((d, i) =>
    fruit(d.label, basketPosition(1, i), FR * 1.25)
  );

  // 0. Imagine you work in a fruit packing station.

  await until(S(0));

  await play(
    new M.FadeIn(packingStation),
    ...say('FRUIT PACKING STATION')
  );

  // 1. Plums go into one basket, and apples into another.

  await until(S(1));

  await play(
    reveal(baskets, 1.15),
    ...say('TWO DIFFERENT BASKETS', GOLD)
  );

  // 2. You want a machine to decide which basket.

  const incoming = unknown(
    [CX, MY + 0.58, 0],
    FR * 1.3
  );

  await until(S(2));

  await play(
    new M.FadeIn(sorter),
    new M.FadeIn(incoming),
    ...say('WHICH BASKET?', GOLD)
  );

  // 3. A worker has already identified eight fruits.

  const placeholders = DATA.map((d, i) => {
    const x = CX + (i - 3.5) * 0.47;

    const o = new M.Circle({
      radius: 0.11,
      color: C.muted,
      strokeWidth: 2
    });

    o.setFill(C.muted, 0.4);
    o.moveTo([x, MY - 0.15, 0]);

    return o;
  });

  await until(S(3));

  await play(
    new M.FadeOut(sorter),
    new M.FadeOut(incoming),
    reveal(placeholders, 1.3, 0.1),
    ...say('8 KNOWN FRUITS', C.green)
  );

  // 4. Four plums, shown as purple circles.

  await until(S(4));

  await play(
    ...remove(placeholders.slice(0, 4)),
    reveal(stagedPlums, 1.25),
    ...say('4 PLUMS', PLUM)
  );

  // 5. Four apples, shown as orange squares.

  await until(S(5));

  await play(
    ...remove(placeholders.slice(4)),
    reveal(stagedApples, 1.25),
    ...say('4 APPLES', APPLE)
  );

  // 6. We measure the weight of each fruit in grams.

  await until(S(6));

  await play(
    new M.Indicate(stagedPlums[0], { color: PLUM }),
    ...fbox([
      ['MEASUREMENT 1', C.cyan],
      ['weight = 50 grams', GOLD]
    ]),
    ...say('WEIGHT IN GRAMS')
  );

  // 7. Compare its colour with a numbered strip.

  const stripHorizontal = horizontalStrip();

  await until(S(7));

  await play(
    ...clearBox(),
    new M.FadeIn(stripHorizontal),
    ...say('RED → GREEN', C.green)
  );

  // 8. The position on this strip is called hue.

  await until(S(8));

  await play(
    new M.Indicate(stripHorizontal, { color: GOLD }),
    ...say('HUE = POSITION ON THE STRIP', GOLD)
  );

  // ============================================================
  // BEATS 9–13: BUILD THE WEIGHT–HUE DRAWING
  // ============================================================

  const xAxis = horizontalAxis();
  const yAxis = verticalAxis();
  const grid = graphGrid();
  const stripVertical = verticalStrip();

  let points = originalPoints();

  // 9. Weight increases from left to right.

  await until(S(9));

  await play(
    new M.FadeOut(packingStation),
    ...remove(baskets),
    ...remove(stagedPlums),
    ...remove(stagedApples),
    new M.FadeIn(xAxis),
    ...say('WEIGHT INCREASES →')
  );

  // 10. Hue increases from bottom to top.

  await until(S(10));

  await play(
    new M.FadeOut(stripHorizontal),
    new M.FadeIn(grid),
    new M.FadeIn(yAxis),
    new M.FadeIn(stripVertical),
    ...say('HUE INCREASES ↑', C.green)
  );

  // 11. Each shape shows one fruit.

  await until(S(11));

  await play(
    reveal(points, 1.8, 0.10),
    ...say('ONE SHAPE = ONE FRUIT')
  );

  // 12. Plums weigh 50, 100, 100 and 150 grams.

  const plumWeightGuides = [1, 2, 3].map(x => {
    const hue = x === 2 ? 4 : 3;

    return dashed(
      xy(x, 0),
      xy(x, hue),
      PLUM
    );
  });

  await until(S(12));

  await play(
    reveal(plumWeightGuides, 0.8),
    new M.LaggedStart(
      [0, 2, 3, 1].map(i =>
        new M.Indicate(points[i], { color: PLUM })
      ),
      { lagRatio: 0.30, runTime: 2.6 }
    ),
    ...fbox([
      ['4 PLUMS', PLUM],
      ['50 g, 100 g', C.ink],
      ['100 g, 150 g', C.ink]
    ], PLUM),
    ...say('PLUM WEIGHTS', PLUM)
  );

  // 13. Apples weigh 200, 300, 300 and 400 grams.

  const appleWeightGuides = [4, 6, 8].map(x => {
    const hue = x === 6 ? 5 : 3;

    return dashed(
      xy(x, 0),
      xy(x, hue),
      APPLE
    );
  });

  await until(S(13));

  await play(
    ...remove(plumWeightGuides),
    reveal(appleWeightGuides, 0.8),
    new M.LaggedStart(
      [4, 6, 7, 5].map(i =>
        new M.Indicate(points[i], { color: APPLE })
      ),
      { lagRatio: 0.30, runTime: 2.6 }
    ),
    ...fbox([
      ['4 APPLES', APPLE],
      ['200 g, 300 g', C.ink],
      ['300 g, 400 g', C.ink]
    ], APPLE),
    ...say('APPLE WEIGHTS', APPLE)
  );

  // ============================================================
  // BEATS 14–18: DISCOVER THE DIVIDING LINE
  // ============================================================

  const gap = gapOutline();

  const plumEdge = ring(xy(3, 3), PLUM);
  const appleEdge = ring(xy(4, 3), APPLE);

  // 14. The empty space between the two groups.

  await until(S(14));

  await play(
    ...remove(appleWeightGuides),
    new M.FadeIn(gap),
    new M.Create(plumEdge),
    new M.Create(appleEdge),
    ...fbox([
      ['heaviest plum: 150 g', PLUM],
      ['lightest apple: 200 g', APPLE]
    ], GOLD),
    ...say('NOTICE THE EMPTY SPACE', GOLD)
  );

  // 15. Could we use this space to decide?

  const gapMeasure = measureBar(
    3,
    4,
    5.9,
    GOLD,
    '50 g'
  );

  await until(S(15));

  await play(
    new M.FadeIn(gapMeasure),
    ...say('COULD THE GAP BECOME A RULE?', GOLD)
  );

  let boundary = boundaryAt(BOUNDARY);
  let boundaryLabel = boundaryTag(BOUNDARY);

  // 16. Draw a vertical line halfway at 175 grams.

  await until(S(16));

  await play(
    new M.FadeOut(gap),
    new M.FadeOut(gapMeasure),
    new M.Create(boundary, { runTime: 1.8 }),
    new M.FadeIn(boundaryLabel),
    ...fbox([
      ['halfway between', C.ink],
      ['150 g and 200 g', C.muted],
      [`${BOUNDARY_GRAMS} grams`, GOLD]
    ], GOLD),
    ...say('DRAW THE LINE AT 175 g', GOLD)
  );

  // 17. Every plum is left, every apple is right.

  await until(S(17));

  await play(
    new M.FadeOut(plumEdge),
    new M.FadeOut(appleEdge),
    new M.LaggedStart(
      points.map((p, i) =>
        new M.Indicate(p, {
          color: i < 4 ? PLUM : APPLE
        })
      ),
      { lagRatio: 0.15, runTime: 2.4 }
    ),
    ...fbox([
      ['4 plums on the left', PLUM],
      ['4 apples on the right', APPLE]
    ], C.green),
    ...say('ALL 8 FRUITS SEPARATED', C.green)
  );

  let shading = regionsAt(BOUNDARY);

  // 18. Colour the entire regions purple and orange.
  // The shading covers the full plotting area, not just the
  // portion occupied by the training examples.

  await until(S(18));

  await play(
    new M.FadeIn(shading, { runTime: 1.6 }),
    ...clearBox(),
    ...say('COLOUR THE TWO REGIONS')
  );

  // ============================================================
  // BEATS 19–24: NAME THE CLASSIFIER
  // ============================================================

  let leftLabel = regionLabel('PLUM', BOUNDARY);
  let rightLabel = regionLabel('APPLE', BOUNDARY);

  // 19. Fruits on the left receive the label plum.

  await until(S(19));

  await play(
    new M.FadeIn(leftLabel),
    ...fbox([
      ['IF fruit is on the left', C.ink],
      ['THEN label = plum', PLUM]
    ], PLUM),
    ...say('LEFT REGION → PLUM', PLUM)
  );

  // 20. Fruits on the right receive the label apple.

  await until(S(20));

  await play(
    new M.FadeIn(rightLabel),
    ...fbox([
      ['IF fruit is on the right', C.ink],
      ['THEN label = apple', APPLE]
    ], APPLE),
    ...say('RIGHT REGION → APPLE', APPLE)
  );

  // 21. This dividing line is called a decision boundary.

  await until(S(21));

  await play(
    new M.Indicate(boundary, { color: GOLD }),
    ...fbox([
      ['DECISION BOUNDARY', GOLD],
      ['where the label changes', C.ink]
    ], GOLD),
    ...say('DECISION BOUNDARY', GOLD)
  );

  // 22. A tool that assigns labels is a classifier.

  await until(S(22));

  await play(
    new M.Indicate(leftLabel, { color: PLUM }),
    new M.Indicate(rightLabel, { color: APPLE }),
    ...fbox([
      ['CLASSIFIER', C.cyan],
      ['measurements → label', C.ink]
    ]),
    ...say('CLASSIFIER = LABEL ASSIGNER')
  );

  // 23. A binary linear classifier.

  await until(S(23));

  await play(
    ...fbox([
      ['BINARY LINEAR', C.cyan],
      ['CLASSIFIER', C.cyan],
      ['2 labels, 1 straight line', C.ink]
    ]),
    ...say('BINARY LINEAR CLASSIFIER')
  );

  // 24. Binary means two choices. Linear means straight.

  await until(S(24));

  await play(
    new M.Indicate(leftLabel, { color: PLUM }),
    new M.Indicate(rightLabel, { color: APPLE }),
    ...fbox([
      ['binary = two choices', C.green],
      ['linear = straight line', GOLD]
    ]),
    ...say('TWO CHOICES. STRAIGHT LINE.')
  );

  await play(
    new M.Indicate(boundary, { color: GOLD })
  );

  // ============================================================
  // BEATS 25–28: CLASSIFY THE NEW FRUIT
  // ============================================================

  const sampleX = weightUnits(NEW_FRUIT.weight);
  const sampleY = NEW_FRUIT.hue;

  const waitingPosition = P
    ? [-3.2, -6.55, 0]
    : [4.3, -1.68, 0];

  let query = unknown(waitingPosition, FR * 1.4);

  // 25. A new fruit arrives as a white diamond.

  await until(S(25));

  await play(
    new M.FadeIn(query),
    ...fbox([
      ['NEW FRUIT', WHITE],
      ['label = unknown', C.muted]
    ], C.cyan),
    ...say('A NEW FRUIT ARRIVES', WHITE)
  );

  // 26. Its weight is 150 grams and its hue is 4.

  await until(S(26));

  await play(
    ...fbox([
      ['NEW FRUIT', WHITE],
      [`weight = ${NEW_FRUIT.weight} g`, C.cyan],
      [`hue    = ${NEW_FRUIT.hue}`, C.green]
    ]),
    ...say('MEASURE THE NEW FRUIT')
  );

  // 27. Place it at (3, 4), inside the purple region.

  const weightProjection = dashed(
    xy(sampleX, 0),
    xy(sampleX, sampleY),
    WHITE
  );

  const hueProjection = dashed(
    xy(0, sampleY),
    xy(sampleX, sampleY),
    WHITE
  );

  await until(S(27));

  await play(
    new M.Transform(
      query,
      unknown(xy(sampleX, sampleY)),
      { runTime: 1.1 }
    ),
    new M.Create(weightProjection),
    new M.Create(hueProjection),
    ...say('150 g, HUE 4', WHITE)
  );

  // 28. The machine predicts plum.

  await until(S(28));

  await play(
    new M.Indicate(query, { color: PLUM }),
    ...fbox([
      ['new fruit is on the left', C.ink],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),
    ...say('PREDICTION: PLUM', PLUM)
  );

  // ============================================================
  // BEATS 29–36: FROM THE PICTURE TO A SCORE
  // ============================================================

  // 29. The machine need not draw this every time.

  await until(S(29));

  await play(
    new M.FadeOut(weightProjection),
    new M.FadeOut(hueProjection),
    ...fbox([
      ['Can we replace the', C.ink],
      ['picture with a number?', GOLD]
    ], GOLD),
    ...say('A CALCULATION INSTEAD?', GOLD)
  );

  // 30. A calculation tells us which side of the line.

  await until(S(30));

  await play(
    new M.Indicate(boundary, { color: GOLD }),
    ...fbox([
      ['fruit position', WHITE],
      ['minus boundary position', GOLD]
    ], GOLD),
    ...say('WHICH SIDE OF THE LINE?')
  );

  // 31. Each horizontal grid space represents 50 grams.

  const unitGuide = measureBar(
    0,
    1,
    5.5,
    C.cyan,
    '50 g'
  );

  const unitNumbers = new M.VGroup(
    ...Array.from({ length: 9 }, (_, i) =>
      text(
        String(i),
        P ? 15 : 15,
        C.cyan,
        [X(i), YB - 0.49, 0],
        true
      )
    )
  );

  await until(S(31));

  await play(
    new M.FadeIn(unitGuide),
    new M.FadeIn(unitNumbers),
    ...fbox([
      ['50 grams', C.cyan],
      ['= 1 horizontal grid unit', C.ink]
    ]),
    ...say('1 GRID SPACE = 50 g')
  );

  // 32. The new fruit is three grid spaces from zero.

  const threeSteps = measureBar(
    0,
    3,
    5.5,
    WHITE,
    '3 units'
  );

  await until(S(32));

  await play(
    new M.FadeOut(unitGuide),
    new M.FadeIn(threeSteps),
    ...fbox([
      ['new fruit: 150 g', WHITE],
      ['150 ÷ 50 = 3 units', C.cyan]
    ]),
    ...say('FRUIT POSITION = 3', WHITE)
  );

  // 33. The boundary is three and a half spaces from zero.

  const threeHalfSteps = measureBar(
    0,
    3.5,
    6.4,
    GOLD,
    '3.5 units'
  );

  await until(S(33));

  await play(
    new M.FadeIn(threeHalfSteps),
    ...fbox([
      ['boundary: 175 g', GOLD],
      ['175 ÷ 50 = 3.5 units', C.ink]
    ], GOLD),
    ...say('BOUNDARY POSITION = 3.5', GOLD)
  );

  // 34. Subtract three and a half from three.

  await until(S(34));

  await play(
    ...fbox([
      ['fruit − boundary', C.ink],
      ['3 − 3.5', GOLD]
    ], GOLD),
    ...say('SUBTRACT THE TWO POSITIONS', GOLD)
  );

  // 35. The result is −0.5, half a space to the left.

  let distanceMark = scoreDistance(
    sampleX,
    sampleY,
    BOUNDARY
  );

  await until(S(35));

  await play(
    new M.FadeOut(threeSteps),
    new M.FadeOut(threeHalfSteps),
    new M.FadeIn(distanceMark),
    ...fbox([
      ['3 − 3.5 = −0.5', PLUM],
      ['half a grid space', C.ink],
      ['to the left', PLUM]
    ], PLUM),
    ...say('−0.5 MEANS LEFT', PLUM)
  );

  // 36. This is called the classification score.

  await until(S(36));

  await play(
    ...fbox([
      ['CLASSIFICATION SCORE', C.cyan],
      ['3 − 3.5 = −0.5', PLUM]
    ]),
    ...say('CLASSIFICATION SCORE')
  );

  // ============================================================
  // BEATS 37–41: POSITIVE SCORE AND ZERO SCORE
  // ============================================================

  // The narration gives the weight of the second fruit only.
  // Retain hue 4 for illustration so that weight is the only
  // changing measurement in this demonstration.

  // 37. Another fruit weighs 200 grams, or four grid spaces.

  await until(S(37));

  await play(
    new M.FadeOut(distanceMark),
    new M.Transform(
      query,
      unknown(xy(4, sampleY)),
      { runTime: 1.25 }
    ),
    ...fbox([
      ['another fruit: 200 g', WHITE],
      ['200 ÷ 50 = 4 units', C.cyan]
    ]),
    ...say('NEW POSITION = 4', WHITE)
  );

  // 38. Four minus three and a half gives positive 0.5.

  distanceMark = scoreDistance(
    4,
    sampleY,
    BOUNDARY
  );

  await until(S(38));

  await play(
    new M.FadeIn(distanceMark),
    ...fbox([
      ['fruit − boundary', C.ink],
      ['4 − 3.5 = +0.5', APPLE]
    ], APPLE),
    ...say('+0.5 MEANS RIGHT', APPLE)
  );

  // 39. Half a space to the right, so predict apple.

  await until(S(39));

  await play(
    new M.Indicate(query, { color: APPLE }),
    ...fbox([
      ['score = +0.5', APPLE],
      ['half a space to the right', C.ink],
      ['PREDICTION: APPLE', APPLE]
    ], APPLE),
    ...say('PREDICTION: APPLE', APPLE)
  );

  // 40. Exactly 175 grams gives a score of zero.

  let zeroRing = ring(
    xy(3.5, sampleY),
    GOLD,
    FR * 2.5
  );

  await until(S(40));

  await play(
    new M.FadeOut(distanceMark),
    new M.Transform(
      query,
      unknown(xy(3.5, sampleY)),
      { runTime: 1.1 }
    ),
    new M.FadeIn(zeroRing),
    ...fbox([
      ['fruit: 175 g', WHITE],
      ['175 ÷ 50 = 3.5', C.ink],
      ['3.5 − 3.5 = 0', GOLD]
    ], GOLD),
    ...say('EXACTLY ZERO', GOLD)
  );

  // 41. Directly on the boundary: an extra rule is needed.

  await until(S(41));

  await play(
    new M.Indicate(boundary, { color: GOLD }),
    new M.Indicate(zeroRing, { color: GOLD }),
    ...fbox([
      ['score = 0', GOLD],
      ['neither left nor right', C.ink],
      ['extra rule needed', GOLD]
    ], GOLD),
    ...say('ON THE BOUNDARY: A TIE', GOLD)
  );

  // ============================================================
  // BEATS 42–45: GENERALISE THE RULE
  // ============================================================

  // 42. Write the calculation as a short formula.

  await until(S(42));

  await play(
    new M.FadeOut(zeroRing),
    ...fbox([
      ['FORMULA', C.cyan],
      ['fruit position', WHITE],
      ['− boundary position', GOLD]
    ]),
    ...say('ONE SHORT CALCULATION')
  );

  // 43. Score equals weight in grid units minus 3.5.

  await until(S(43));

  await play(
    ...fbox([
      ['score = x − 3.5', GOLD],
      ['x = weight in grid units', C.ink],
      ['1 unit = 50 grams', C.muted]
    ], GOLD),
    ...say('SCORE = x − 3.5', GOLD)
  );

  // 44. Negative means plum, positive means apple.

  await until(S(44));

  await play(
    ...fbox([
      ['score < 0 → plum', PLUM],
      ['score > 0 → apple', APPLE],
      ['score = 0 → extra rule', GOLD]
    ]),
    new M.Indicate(leftLabel, { color: PLUM }),
    new M.Indicate(rightLabel, { color: APPLE }),
    ...say('THE SIGN CHOOSES THE REGION')
  );

  // 45. One rule predicts the labels of many new fruits.
  // The same diamond now represents successive hypothetical
  // incoming fruits; the eight training fruits remain fixed.

  await until(S(45));

  await play(
    new M.Transform(
      query,
      unknown(xy(1.5, 5.1)),
      { runTime: 0.85 }
    ),
    ...scoreBox(1.5),
    ...say('ONE RULE, MANY FRUITS', C.green)
  );

  await play(
    new M.Transform(
      query,
      unknown(xy(5, 5.1)),
      { runTime: 0.85 }
    ),
    ...scoreBox(5)
  );

  await play(
    new M.Transform(
      query,
      unknown(xy(2.5, 5.1)),
      { runTime: 0.85 }
    ),
    ...scoreBox(2.5)
  );

  // ============================================================
  // BEATS 46–47: A LIMITATION OF STRAIGHT BOUNDARIES
  // ============================================================

  // These are explicitly hypothetical overlapping examples.
  // They are separate from the fixed shared chapter data.
  //
  // The two plum corners and the two apple corners form
  // alternating labels around a rectangle.
  // Their connecting diagonals intersect, so no straight line
  // can place both plums on one side and both apples on the other.

  const MIXED = [
    { label: 'plum',  weight: 100, hue: 2 },
    { label: 'plum',  weight: 300, hue: 6 },
    { label: 'apple', weight: 100, hue: 6 },
    { label: 'apple', weight: 300, hue: 2 }
  ];

  function mixedPoints() {
    return MIXED.map(plottedFruit);
  }

  let hypothetical = mixedPoints();

  // 46. Real apples and plums may overlap in weight and hue.

  await until(S(46));

  await play(
    new M.FadeOut(query),
    ...remove(points),
    new M.FadeOut(unitNumbers),
    reveal(hypothetical, 1.4),
    ...fbox([
      ['HYPOTHETICAL DATA', GOLD],
      ['same weight ranges', C.ink],
      ['same hue ranges', C.ink]
    ], GOLD),
    ...say('REAL GROUPS CAN OVERLAP', GOLD)
  );

  // 47. A straight line may not separate mixed groups.

  const wrongPlum = ring(
    xy(6, 6),
    GOLD,
    FR * 2.2
  );

  const wrongApple = ring(
    xy(2, 6),
    GOLD,
    FR * 2.2
  );

  const plumDiagonal = dashed(
    xy(2, 2),
    xy(6, 6),
    PLUM
  );

  const appleDiagonal = dashed(
    xy(2, 6),
    xy(6, 2),
    APPLE
  );

  await until(S(47));

  await play(
    new M.Create(wrongPlum),
    new M.Create(wrongApple),
    new M.Create(plumDiagonal),
    new M.Create(appleDiagonal),
    ...fbox([
      ['the groups are mixed', C.ink],
      ['no straight line can', GOLD],
      ['separate this arrangement', GOLD]
    ], GOLD),
    ...say('A STRAIGHT LINE CAN FAIL', GOLD)
  );

  // ============================================================
  // BEATS 48–51: TRY IT PREVIEW
  // ============================================================

  // These beats demonstrate the exercise visually.
  // Dragging, Reset and New data belong to the separate
  // interactive Try it implementation, not the narration scene.

  // 48. Drag the white diamond and watch label and score change.

  points = originalPoints();

  query = unknown(xy(3, sampleY));

  await until(S(48));

  await play(
    ...remove(hypothetical),
    new M.FadeOut(wrongPlum),
    new M.FadeOut(wrongApple),
    new M.FadeOut(plumDiagonal),
    new M.FadeOut(appleDiagonal),
    reveal(points, 1.1, 0.06),
    new M.FadeIn(query),
    ...scoreBox(3),
    ...say('TRY IT: DRAG THE DIAMOND', C.green)
  );

  await play(
    new M.Transform(
      query,
      unknown(xy(3.25, sampleY)),
      { runTime: 0.85 }
    ),
    ...scoreBox(3.25)
  );

  await play(
    new M.Transform(
      query,
      unknown(xy(3.5, sampleY)),
      { runTime: 0.85 }
    ),
    ...scoreBox(3.5)
  );

  await play(
    new M.Transform(
      query,
      unknown(xy(4, sampleY)),
      { runTime: 0.85 }
    ),
    ...scoreBox(4)
  );

  // 49. Make the score exactly zero.

  zeroRing = ring(
    xy(3.5, sampleY),
    GOLD,
    FR * 2.5
  );

  await until(S(49));

  await play(
    new M.Transform(
      query,
      unknown(xy(3.5, sampleY)),
      { runTime: 1.1 }
    ),
    new M.Create(zeroRing),
    ...scoreBox(3.5),
    ...say('TRY IT: MAKE THE SCORE ZERO', C.green)
  );

  // 50. Move the boundary until all eight known fruits
  // receive their correct labels.

  const correctCount = (b, data = DATA) =>
    data.filter(d =>
      prediction(weightUnits(d.weight), b) ===
      d.label.toUpperCase()
    ).length;

  function boundaryMove(b) {
    return [
      new M.Transform(
        boundary,
        boundaryAt(b),
        { runTime: 1.15 }
      ),

      new M.Transform(
        boundaryLabel,
        boundaryTag(b),
        { runTime: 1.15 }
      ),

      new M.Transform(
        shading,
        regionsAt(b),
        { runTime: 1.15 }
      ),

      new M.Transform(
        leftLabel,
        regionLabel('PLUM', b),
        { runTime: 1.15 }
      ),

      new M.Transform(
        rightLabel,
        regionLabel('APPLE', b),
        { runTime: 1.15 }
      )
    ];
  }

  const misplaced = ring(
    xy(3, 3),
    GOLD,
    FR * 2.3
  );

  await until(S(50));

  await play(
    new M.FadeOut(query),
    new M.FadeOut(zeroRing),
    ...boundaryMove(2.5),
    new M.FadeIn(misplaced),
    ...fbox([
      ['boundary = 125 g', GOLD],
      [`correct: ${correctCount(2.5)} / 8`, GOLD],
      ['one fruit misclassified', C.ink]
    ], GOLD),
    ...say('TRY IT: MOVE THE LINE', C.green)
  );

  await play(
    new M.FadeOut(misplaced),
    ...boundaryMove(3.5),
    ...fbox([
      ['boundary = 175 g', GOLD],
      [`correct: ${correctCount(3.5)} / 8`, C.green],
      ['all fruits correct', C.green]
    ], C.green)
  );

  // 51. Press New data to explore different arrangements.

  // A fresh hypothetical arrangement containing eight fruits.
  // The original DATA array is not mutated.

  const FRESH = [
    { label: 'plum',  weight: 50,  hue: 2 },
    { label: 'plum',  weight: 100, hue: 6 },
    { label: 'plum',  weight: 150, hue: 4 },
    { label: 'plum',  weight: 200, hue: 2 },

    { label: 'apple', weight: 250, hue: 3 },
    { label: 'apple', weight: 300, hue: 6 },
    { label: 'apple', weight: 350, hue: 2 },
    { label: 'apple', weight: 400, hue: 4 }
  ];

  const freshPoints = FRESH.map(plottedFruit);

  await until(S(51));

  await play(
    ...remove(points),
    reveal(freshPoints, 1.0, 0.08),
    ...boundaryMove(4.5),
    ...fbox([
      ['NEW DATA', C.cyan],
      ['boundary = 225 g', GOLD],
      [`correct: ${correctCount(4.5, FRESH)} / 8`, C.green]
    ], C.green),
    ...say('TRY IT: NEW DATA', C.green)
  );

  hypothetical = mixedPoints();

  await play(
    ...remove(freshPoints),
    reveal(hypothetical, 1.0, 0.08),
    ...boundaryMove(3.5),
    ...fbox([
      ['ANOTHER ARRANGEMENT', GOLD],
      ['groups overlap', C.ink],
      ['straight separation fails', GOLD]
    ], GOLD)
  );

  const crossP = dashed(
    xy(2, 2),
    xy(6, 6),
    PLUM
  );

  const crossA = dashed(
    xy(2, 6),
    xy(6, 2),
    APPLE
  );

  await play(
    new M.Create(crossP),
    new M.Create(crossA)
  );

  // ============================================================
  // BEAT 52: RECAP — RESTORE EXACT ORIGINAL LESSON DATA
  // ============================================================

  points = originalPoints();

  const recapDiamond = unknown(
    xy(sampleX, sampleY)
  );

  // 52. A decision boundary divides the drawing into regions,
  // each region giving a predicted label.

  await until(S(52));

  await play(
    ...remove(hypothetical),
    new M.FadeOut(crossP),
    new M.FadeOut(crossA),
    reveal(points, 1.2, 0.08),
    new M.FadeIn(recapDiamond),
    ...fbox([
      ['DECISION BOUNDARY', GOLD],
      ['left region → plum', PLUM],
      ['right region → apple', APPLE]
    ], GOLD),
    ...say('ONE REGION, ONE PREDICTED LABEL')
  );

  await play(
    new M.Indicate(boundary, {
      color: GOLD,
      runTime: 1.2
    })
  );

  await play(
    new M.Indicate(leftLabel, {
      color: PLUM,
      runTime: 0.9
    }),
    new M.Indicate(rightLabel, {
      color: APPLE,
      runTime: 0.9
    }),
    new M.Indicate(recapDiamond, {
      color: PLUM,
      runTime: 0.9
    })
  );
}

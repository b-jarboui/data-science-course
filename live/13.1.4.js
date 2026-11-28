// lesson 13.1.4
// Distance concentration: when near and far start to look alike.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact shared chapter data and unrounded calculations.
// Distance bars share one fixed scale throughout the lesson.
// Try it beats preview the separate interactive activity.
// Written against the supplied engine interface; browser runtime not tested.

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
  const PEAR = C.green || '#4ADE80';

  const WHITE = '#FFFFFF';
  const GOLD = C.amber;

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // Phone frame: 8 x 14.22.
  // Keep content between y = -5.5 and 4.3.
  //
  // Laptop frame: 14.22 x 8.
  // Keep content between y = -3.0 and 2.3.

  // Equal horizontal and vertical grid spacing ensures
  // geometrically accurate distance comparisons.

  const U = P ? 0.60 : 0.43;

  const XL = P ? -2.55 : CX - 4.25 * U;
  const YB = P ? -3.95 : -2.43;

  const XMAX = 8.5;
  const YMAX = 8.5;

  const XR = XL + XMAX * U;
  const YT = YB + YMAX * U;

  const X = x => XL + x * U;
  const Y = y => YB + y * U;

  const xy = (x, y) => [X(x), Y(y), 0];

  const FR = P ? 0.135 : 0.105;

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

  const DATA = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 150, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 100, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 100, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 200, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 400, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 1, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 300, hue: 5, firmness: 2 },

    { id: 'R1', label: 'pear',  weight: 150, hue: 7, firmness: 3 },
    { id: 'R2', label: 'pear',  weight: 250, hue: 7, firmness: 2 },
    { id: 'R3', label: 'pear',  weight: 200, hue: 6, firmness: 2 },
    { id: 'R4', label: 'pear',  weight: 200, hue: 8, firmness: 1 }
  ];

  const NEW_FRUIT = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  const QX = NEW_FRUIT.weight / 50;
  const QY = NEW_FRUIT.hue;

  const PLUM_FRUIT = DATA.find(d => d.id === 'P2');
  const PEAR_FRUIT = DATA.find(d => d.id === 'R1');

  const weightUnits = grams => grams / 50;

  const colorOf = label =>
    label === 'plum' ? PLUM :
    label === 'apple' ? APPLE :
    PEAR;

  function positionOf(d) {
    return xy(
      weightUnits(d.weight),
      d.hue
    );
  }

  function originalDistanceSquared(d) {
    const dx = weightUnits(d.weight) - QX;
    const dy = d.hue - QY;

    return dx * dx + dy * dy;
  }

  const PLUM_D2 = originalDistanceSquared(PLUM_FRUIT);
  const PEAR_D2 = originalDistanceSquared(PEAR_FRUIT);

  const PLUM_D0 = Math.sqrt(PLUM_D2);
  const PEAR_D0 = Math.sqrt(PEAR_D2);

  // Original distances:
  // P2: sqrt(1) = 1
  // R1: sqrt(9) = 3
  //
  // Controlled additional measurements:
  // Each contributes exactly 1 to BOTH squared distances.
  //
  // n = 0:
  // plum = 1
  // pear = 3
  // ratio = 3
  //
  // n = 8:
  // plum = 3
  // pear = sqrt(17) ≈ 4.12
  // ratio ≈ 1.37
  //
  // n = 99:
  // plum = 10
  // pear = sqrt(108) ≈ 10.39
  // ratio ≈ 1.04
  //
  // These are controlled teaching examples, not a claim
  // that all high-dimensional data behave identically.

  function newDistance(d0, n) {
    return Math.sqrt(d0 * d0 + n);
  }

  function comparison(
    n,
    plumStart = PLUM_D0,
    pearStart = PEAR_D0
  ) {
    const plum = newDistance(plumStart, n);
    const pear = newDistance(pearStart, n);

    return {
      n,
      plum,
      pear,
      ratio: pear / plum,
      gap: pear - plum,
      relativeGap: (pear - plum) / plum
    };
  }

  const START = comparison(0);
  const EIGHT = comparison(8);
  const NINETY_NINE = comparison(99);

  function fmt(n, places = 2) {
    return Number(n.toFixed(places)).toString();
  }

  function distanceText(n) {
    return Number.isInteger(n)
      ? String(n)
      : n.toFixed(2);
  }

  function ratioText(n) {
    return Number.isInteger(n)
      ? `${n}×`
      : `${n.toFixed(2)}×`;
  }

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);

    t.moveTo(p);

    return t;
  }

  function fittedText(
    s,
    size,
    color,
    p,
    maxw,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function leftText(s, size, color, x, y, mono = false) {
    const t = T(s, size, color, mono);

    t.moveTo([
      x + t.getWidth() / 2,
      y,
      0
    ]);

    return t;
  }

  function rightText(s, size, color, x, y, mono = false) {
    const t = T(s, size, color, mono);

    t.moveTo([
      x - t.getWidth() / 2,
      y,
      0
    ]);

    return t;
  }

  function line(start, end, color = C.muted, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function dashed(start, end, color = C.muted) {
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

  function rounded(w, h, p, color, opacity = 0.92) {
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

  function ring(p, color = GOLD, r = FR * 2.1) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: 2
    });

    c.setFill(color, 0);
    c.moveTo(p);

    return c;
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

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.15 - lh / 2;

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
    const maxh = P ? 1.36 : 3.8;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

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
  // CONSISTENT CHAPTER FRUIT SYMBOLS
  // ============================================================

  function triangle(p, r, color) {
    const [x, y] = p;

    const top = [x, y + r, 0];

    const left = [
      x - r * 0.95,
      y - r * 0.70,
      0
    ];

    const right = [
      x + r * 0.95,
      y - r * 0.70,
      0
    ];

    const fill = [];

    for (let i = 1; i <= 12; i++) {
      const a = i / 12;

      const yy =
        top[1] + a * (left[1] - top[1]);

      const ww = r * 0.95 * a;

      fill.push(
        line(
          [x - ww, yy, 0],
          [x + ww, yy, 0],
          color,
          2.5
        )
      );
    }

    return new M.VGroup(
      ...fill,
      line(top, left, color, 2),
      line(left, right, color, 2),
      line(right, top, color, 2)
    );
  }

  function fruit(label, p, r = FR) {
    const color = colorOf(label);

    const halo = new M.Dot({
      point: p,
      radius: r * 1.65,
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

    } else if (label === 'apple') {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);

    } else {
      body = triangle(p, r * 1.10, color);
    }

    return new M.VGroup(halo, body);
  }

  function unknown(p, r = FR * 1.20) {
    const outer = new M.Dot({
      point: p,
      radius: r * 1.85,
      color: WHITE
    });

    outer.setFill(WHITE, 0.08);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.40,
      color: WHITE
    });

    inner.setFill(WHITE, 0.15);

    const side = r * Math.sqrt(2);

    const body = new M.Rectangle({
      width: side,
      height: side,
      color: WHITE,
      strokeWidth: 2
    });

    body.setFill(WHITE, 1);
    body.rotate(Math.PI / 4);
    body.moveTo(p);

    return new M.VGroup(
      outer,
      inner,
      body
    );
  }

  function plottedFruit(d) {
    return fruit(
      d.label,
      positionOf(d)
    );
  }

  function plotPoints(data = DATA) {
    return data.map(plottedFruit);
  }

  // ============================================================
  // PACKING STATION INTRODUCTION
  // ============================================================

  function station() {
    const y = P ? -1.50 : -0.70;

    const base = rounded(
      P ? 5.85 : 5.70,
      0.48,
      [CX, y, 0],
      C.muted,
      0.90
    );

    const rollers = Array.from(
      { length: 11 },
      (_, i) => {
        const x = CX + (i - 5) * 0.47;

        const c = new M.Circle({
          radius: 0.115,
          color: C.muted,
          strokeWidth: 1.5
        });

        c.setFill(C.card, 1);
        c.moveTo([x, y, 0]);

        return c;
      }
    );

    const title = text(
      'FRUIT PACKING STATION',
      18,
      C.ink,
      [CX, y + 1.25, 0],
      true
    );

    return new M.VGroup(
      base,
      ...rollers,
      title
    );
  }

  function measurementCard(label, color, p, value = null) {
    const w = P ? 2.55 : 2.35;
    const h = 0.90;

    const body = rounded(
      w,
      h,
      p,
      color,
      0.94
    );

    const title = fittedText(
      label,
      18,
      color,
      [p[0], p[1] + 0.15, 0],
      w - 0.25,
      true
    );

    const detail = text(
      value === null ? 'measurement' : value,
      15,
      C.muted,
      [p[0], p[1] - 0.20, 0]
    );

    return new M.VGroup(
      body,
      title,
      detail
    );
  }

  const stationY = P ? -1.50 : -0.70;

  const packingStation = station();

  const incoming = unknown(
    [CX, stationY + 0.43, 0],
    FR * 2
  );

  const weightCard = measurementCard(
    'WEIGHT',
    C.cyan,
    [CX - 1.40, stationY - 1.05, 0],
    'grams'
  );

  const hueCard = measurementCard(
    'HUE',
    C.green,
    [CX + 1.40, stationY - 1.05, 0],
    'colour strip'
  );

  const moreCard = measurementCard(
    'MORE MEASUREMENTS?',
    GOLD,
    [CX, P ? 0.72 : 1.02, 0],
    'would they help?'
  );

  // ============================================================
  // WEIGHT–HUE DRAWING
  // ============================================================

  function graphGrid() {
    const parts = [];

    for (let x = 1; x <= 8; x++) {
      parts.push(
        line(
          xy(x, 0),
          xy(x, YMAX),
          C.muted,
          0.65
        )
      );
    }

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          xy(0, y),
          xy(XMAX, y),
          C.muted,
          0.65
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function horizontalAxis() {
    const parts = [
      line(
        [XL, YB, 0],
        [XR, YB, 0],
        C.muted,
        2.5
      )
    ];

    for (let x = 0; x <= 8; x++) {
      parts.push(
        line(
          [X(x), YB - 0.045, 0],
          [X(x), YB + 0.045, 0],
          C.muted,
          1.2
        )
      );

      parts.push(
        text(
          String(x * 50),
          P ? 14 : 12,
          C.muted,
          [X(x), YB - 0.18, 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Weight (grams) →',
        P ? 18 : 16,
        C.ink,
        [(XL + XR) / 2, YB - 0.43, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalAxis() {
    const parts = [
      line(
        [XL, YB, 0],
        [XL, YT, 0],
        C.muted,
        2.5
      )
    ];

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          [XL - 0.045, Y(y), 0],
          [XL + 0.045, Y(y), 0],
          C.muted,
          1.2
        )
      );

      parts.push(
        text(
          String(y),
          P ? 15 : 13,
          C.muted,
          [XL - 0.20, Y(y), 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Hue ↑',
        P ? 17 : 15,
        C.ink,
        [XL - 0.37, YT + 0.19, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalStrip() {
    const sx = XL - 0.65;
    const sw = P ? 0.23 : 0.20;

    const parts = [];

    HUE.forEach((c, i) => {
      parts.push(
        rect(
          sw,
          U * 0.98,
          [sx, Y(i + 1), 0],
          c,
          1,
          0
        )
      );
    });

    parts.push(
      text(
        'green',
        P ? 12 : 11,
        HUE[7],
        [sx, Y(8) + U * 0.72, 0]
      )
    );

    parts.push(
      text(
        'red',
        P ? 12 : 11,
        HUE[0],
        [sx, Y(1) - U * 0.72, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function graphParts() {
    return [
      graphGrid(),
      horizontalAxis(),
      verticalAxis(),
      verticalStrip()
    ];
  }

  const graph = graphParts();

  const points = plotPoints();

  const plumIndex = DATA.indexOf(PLUM_FRUIT);
  const pearIndex = DATA.indexOf(PEAR_FRUIT);

  const plumPoint = points[plumIndex];
  const pearPoint = points[pearIndex];

  const otherPoints = points.filter(
    (_, i) => i !== plumIndex && i !== pearIndex
  );

  const query = unknown(
    xy(QX, QY)
  );

  const plumRing = ring(
    positionOf(PLUM_FRUIT),
    PLUM
  );

  const pearRing = ring(
    positionOf(PEAR_FRUIT),
    PEAR
  );

  const plumName = text(
    'P2',
    P ? 17 : 14,
    PLUM,
    [X(3) + 0.32, Y(3) - 0.13, 0],
    true
  );

  const pearName = text(
    'R1',
    P ? 17 : 14,
    PEAR,
    [X(3) + 0.32, Y(7) + 0.08, 0],
    true
  );

  const plumLine = line(
    xy(QX, QY),
    positionOf(PLUM_FRUIT),
    PLUM,
    3
  );

  const pearLine = line(
    xy(QX, QY),
    positionOf(PEAR_FRUIT),
    PEAR,
    3
  );

  function distanceMark(y1, y2, color, value, side = 1) {
    const x = X(3) + side * (P ? 0.32 : 0.27);

    const a = Y(y1);
    const b = Y(y2);

    const ticks = [];

    for (let y = y1; y <= y2; y++) {
      ticks.push(
        line(
          [x - 0.06, Y(y), 0],
          [x + 0.06, Y(y), 0],
          color,
          1.6
        )
      );
    }

    return new M.VGroup(
      line(
        [x, a, 0],
        [x, b, 0],
        color,
        1.8
      ),

      ...ticks,

      text(
        String(value),
        P ? 20 : 17,
        color,
        [
          x + side * 0.22,
          (a + b) / 2,
          0
        ],
        true
      )
    );
  }

  const plumMark = distanceMark(
    3,
    4,
    PLUM,
    1,
    -1
  );

  const pearMark = distanceMark(
    4,
    7,
    PEAR,
    3,
    1
  );

  // ============================================================
  // IRRELEVANT MEASUREMENT: PACKING TRAY POSITION
  // ============================================================

  // The tray positions are hypothetical.
  // They do not alter any original weight or hue measurements.

  const TRAY_Y = P ? [-0.10, -2.10, -4.10]
                   : [0.65, -0.50, -1.65];

  const TRAY_LEFT = CX - 1.35;
  const TRAY_PITCH = P ? 0.95 : 0.76;

  function trayRow(label, position, i) {
    const y = TRAY_Y[i];

    const color = label === 'unknown'
      ? WHITE
      : colorOf(label);

    const trayWidth = TRAY_PITCH * 4 + 0.22;

    const tray = rounded(
      trayWidth,
      0.56,
      [
        TRAY_LEFT + 1.5 * TRAY_PITCH,
        y,
        0
      ],
      C.muted,
      0.78
    );

    const slots = Array.from(
      { length: 4 },
      (_, j) => {
        const x = TRAY_LEFT + j * TRAY_PITCH;

        return rect(
          TRAY_PITCH * 0.76,
          0.42,
          [x, y, 0],
          C.muted,
          0,
          1
        );
      }
    );

    const fruitPosition = [
      TRAY_LEFT + (position - 1) * TRAY_PITCH,
      y,
      0
    ];

    const icon = label === 'unknown'
      ? unknown(fruitPosition, FR * 1.10)
      : fruit(label, fruitPosition, FR * 1.10);

    const name = rightText(
      label.toUpperCase(),
      P ? 16 : 14,
      color,
      TRAY_LEFT - 0.72,
      y,
      true
    );

    const value = leftText(
      String(position),
      P ? 18 : 16,
      color,
      TRAY_LEFT + 3.65 * TRAY_PITCH,
      y,
      true
    );

    return new M.VGroup(
      tray,
      ...slots,
      icon,
      name,
      value
    );
  }

  function trayHeading() {
    const y = P ? 0.88 : 1.23;

    const heading = fittedText(
      'POSITION ON A PACKING TRAY',
      18,
      C.ink,
      [CX, y, 0],
      5.80,
      true
    );

    const labels = Array.from(
      { length: 4 },
      (_, j) => text(
        String(j + 1),
        15,
        C.muted,
        [
          TRAY_LEFT + j * TRAY_PITCH,
          TRAY_Y[0] + 0.43,
          0
        ],
        true
      )
    );

    return new M.VGroup(
      heading,
      ...labels
    );
  }

  const trayTitle = trayHeading();

  let trayRows = [
    trayRow('unknown', 2, 0),
    trayRow('plum', 3, 1),
    trayRow('pear', 3, 2)
  ];

  // ============================================================
  // DIMENSION VISUAL
  // ============================================================

  const DIM_Y = P ? [0.10, -1.70, -3.50]
                  : [0.62, -0.50, -1.62];

  function dimensionRow(label, description, color, i) {
    const y = DIM_Y[i];

    const w = P ? 5.65 : 5.45;

    const body = rounded(
      w,
      0.90,
      [CX, y, 0],
      color,
      0.94
    );

    const number = text(
      String(i + 1),
      23,
      color,
      [CX - w / 2 + 0.40, y, 0],
      true
    );

    const name = leftText(
      label,
      18,
      color,
      CX - w / 2 + 0.82,
      y + 0.15,
      true
    );

    const detail = leftText(
      description,
      15,
      C.muted,
      CX - w / 2 + 0.82,
      y - 0.19
    );

    return new M.VGroup(
      body,
      number,
      name,
      detail
    );
  }

  const dimensions = [
    dimensionRow(
      'WEIGHT',
      'one measurement direction',
      C.cyan,
      0
    ),

    dimensionRow(
      'HUE',
      'another measurement direction',
      C.green,
      1
    ),

    dimensionRow(
      'TRAY POSITION',
      'an extra, irrelevant direction',
      GOLD,
      2
    )
  ];

  const dimensionTitle = tag(
    '3 MEASUREMENT DIRECTIONS',
    C.cyan,
    [CX, P ? -4.85 : -2.52, 0],
    16
  );

  // ============================================================
  // COMMON DISTANCE BAR SCALE
  // ============================================================

  // All distance bars use the same scale.
  // No rescaling between 0, 8 and 99 extra measurements.
  //
  // This lets learners see both:
  // - the absolute growth in the distances;
  // - the shrinking relative difference.

  const BAR_X0 = CX - 2.62;
  const BAR_X1 = CX + 2.62;

  const BAR_MAX = 11;

  const BAR_WIDTH = BAR_X1 - BAR_X0;

  const BAR_SCALE = BAR_WIDTH / BAR_MAX;

  const BAR_HEIGHT = P ? 0.56 : 0.34;

  const BAR_Y = P
    ? [0.05, -2.05]
    : [0.48, -0.80];

  const AXIS_Y = P ? -3.55 : -1.80;

  const RATIO_Y = P ? -4.75 : -2.65;

  const TITLE_Y = P ? 1.17 : 1.26;

  const d2x = d =>
    BAR_X0 + d * BAR_SCALE;

  function barTitle(s) {
    return fittedText(
      s,
      P ? 19 : 17,
      C.ink,
      [CX, TITLE_Y, 0],
      5.85,
      true
    );
  }

  function distanceAxis() {
    const parts = [
      line(
        [BAR_X0, AXIS_Y, 0],
        [BAR_X1, AXIS_Y, 0],
        C.muted,
        2
      )
    ];

    for (let d = 0; d <= BAR_MAX; d++) {
      const x = d2x(d);

      parts.push(
        line(
          [x, AXIS_Y - 0.06, 0],
          [x, AXIS_Y + 0.06, 0],
          C.muted,
          1
        )
      );

      if (d % 2 === 0 || d === BAR_MAX) {
        parts.push(
          text(
            String(d),
            P ? 17 : 14,
            C.muted,
            [x, AXIS_Y - 0.20, 0],
            true
          )
        );
      }
    }

    parts.push(
      text(
        'Distance in measurement units',
        P ? 18 : 15,
        C.muted,
        [CX, AXIS_Y - 0.48, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function barRow(
    i,
    d0,
    n,
    customLabel = null
  ) {
    const isPlum = i === 0;

    const label = isPlum ? 'plum' : 'pear';
    const color = isPlum ? PLUM : PEAR;

    const value = newDistance(d0, n);

    const y = BAR_Y[i];

    const headerY = y + BAR_HEIGHT / 2 + 0.25;

    const icon = fruit(
      label,
      [BAR_X0 + 0.12, headerY, 0],
      P ? 0.10 : 0.09
    );

    const name = leftText(
      customLabel || label.toUpperCase(),
      P ? 18 : 16,
      color,
      BAR_X0 + 0.35,
      headerY,
      true
    );

    const valueText = rightText(
      distanceText(value),
      P ? 25 : 23,
      color,
      BAR_X1,
      headerY,
      true
    );

    const track = rect(
      BAR_WIDTH,
      BAR_HEIGHT,
      [CX, y, 0],
      C.muted,
      0.10,
      1
    );

    const width = value * BAR_SCALE;

    const glow = rect(
      width,
      BAR_HEIGHT + 0.09,
      [BAR_X0 + width / 2, y, 0],
      color,
      0.12,
      0
    );

    const bar = rect(
      width,
      BAR_HEIGHT,
      [BAR_X0 + width / 2, y, 0],
      color,
      0.88,
      1
    );

    const cap = line(
      [d2x(value), y - BAR_HEIGHT / 2 - 0.04, 0],
      [d2x(value), y + BAR_HEIGHT / 2 + 0.04, 0],
      color,
      2
    );

    const detail = leftText(
      `${n} extra measurements included`,
      P ? 17 : 14,
      C.muted,
      BAR_X0,
      y - BAR_HEIGHT / 2 - 0.20,
      true
    );

    return new M.VGroup(
      icon,
      name,
      valueText,
      track,
      glow,
      bar,
      cap,
      detail
    );
  }

  function ratioBadge(ratio, prefix = 'PEAR / PLUM') {
    return tag(
      `${prefix} = ${ratioText(ratio)}`,
      GOLD,
      [CX, RATIO_Y, 0],
      P ? 18 : 16
    );
  }

  function comparisonBox(
    n,
    plumStart = PLUM_D0,
    pearStart = PEAR_D0,
    title = null
  ) {
    const c = comparison(
      n,
      plumStart,
      pearStart
    );

    return fbox([
      [
        title || `${n} extra measurements`,
        C.cyan
      ],

      [
        `plum = ${distanceText(c.plum)}`,
        PLUM
      ],

      [
        `pear = ${distanceText(c.pear)}`,
        PEAR
      ],

      [
        `pear / plum = ${ratioText(c.ratio)}`,
        GOLD
      ]
    ], GOLD);
  }

  let chartTitle = null;
  let chartAxis = null;

  let bars = [];

  let ratioNow = null;

  let currentPlumStart = PLUM_D0;
  let currentPearStart = PEAR_D0;

  function changeChartTitle(s) {
    return new M.Transform(
      chartTitle,
      barTitle(s),
      { runTime: 0.70 }
    );
  }

  function updateBar(i, n, runTime = 1.15) {
    const start = i === 0
      ? currentPlumStart
      : currentPearStart;

    return new M.Transform(
      bars[i],
      barRow(i, start, n),
      { runTime }
    );
  }

  function clearRatio() {
    if (!ratioNow) return [];

    const old = ratioNow;

    ratioNow = null;

    return [new M.FadeOut(old)];
  }

  function setRatio(value, prefix = 'PEAR / PLUM') {
    const next = ratioBadge(value, prefix);

    const animations = [];

    if (ratioNow) {
      animations.push(new M.FadeOut(ratioNow));
    }

    animations.push(new M.FadeIn(next));

    ratioNow = next;

    return animations;
  }

  function updateBoth(
    n,
    title = null,
    runTime = 1.15
  ) {
    const c = comparison(
      n,
      currentPlumStart,
      currentPearStart
    );

    return [
      changeChartTitle(
        title || `${n} EXTRA MEASUREMENTS`
      ),

      updateBar(0, n, runTime),
      updateBar(1, n, runTime),

      ...setRatio(c.ratio),

      ...comparisonBox(
        n,
        currentPlumStart,
        currentPearStart
      )
    ];
  }

  // ============================================================
  // ADDED CONTRIBUTIONS VISUAL
  // ============================================================

  // Eight small amber blocks represent eight added
  // squared-distance contributions of exactly one each.
  // They are contributions to squared distance, not
  // eight units added directly to distance.

  const CONTRIB_Y = P ? -4.75 : -2.66;

  function contributionTiles(n = 8) {
    const pitch = P ? 0.47 : 0.41;
    const side = pitch * 0.85;

    const parts = [];

    for (let i = 0; i < n; i++) {
      const x = CX + (i - (n - 1) / 2) * pitch;

      const b = rect(
        side,
        side * 0.82,
        [x, CONTRIB_Y, 0],
        GOLD,
        0.18,
        1.4
      );

      const t = text(
        '+1',
        P ? 15 : 12,
        GOLD,
        [x, CONTRIB_Y, 0],
        true
      );

      parts.push(new M.VGroup(b, t));
    }

    return parts;
  }

  // ============================================================
  // TRY IT PREVIEW HELPERS
  // ============================================================

  // The live engine exposes narration scheduling and animation
  // playback. The following is a deterministic visual preview.
  // Actual slider, Reset and New data handlers belong to
  // the separate interactive activity.

  const SLIDER_Y = P ? -5.70 : -2.68;

  const SLIDER_X0 = CX - 1.70;
  const SLIDER_X1 = CX + 1.70;

  function extraSlider(n) {
    const value = Math.max(0, Math.min(99, n));

    const x =
      SLIDER_X0 +
      value / 99 * (SLIDER_X1 - SLIDER_X0);

    const title = text(
      'EXTRA MEASUREMENTS',
      P ? 16 : 14,
      C.ink,
      [CX, SLIDER_Y + 0.43, 0],
      true
    );

    const track = line(
      [SLIDER_X0, SLIDER_Y, 0],
      [SLIDER_X1, SLIDER_Y, 0],
      C.muted,
      3
    );

    const progress = line(
      [SLIDER_X0, SLIDER_Y, 0],
      [
        Math.max(SLIDER_X0 + 0.001, x),
        SLIDER_Y,
        0
      ],
      C.cyan,
      4
    );

    const knob = new M.Circle({
      radius: P ? 0.13 : 0.10,
      color: C.cyan,
      strokeWidth: 2
    });

    knob.setFill(C.cyan, 1);
    knob.moveTo([x, SLIDER_Y, 0]);

    const zero = text(
      '0',
      15,
      C.muted,
      [SLIDER_X0 - 0.22, SLIDER_Y, 0],
      true
    );

    const max = text(
      '99',
      15,
      C.muted,
      [SLIDER_X1 + 0.28, SLIDER_Y, 0],
      true
    );

    const current = tag(
      `n = ${value}`,
      C.cyan,
      [CX, SLIDER_Y - 0.40, 0],
      17
    );

    return new M.VGroup(
      title,
      track,
      progress,
      knob,
      zero,
      max,
      current
    );
  }

  let slider = null;

  function tryUpdate(n, heading = null) {
    const animations = updateBoth(
      n,
      heading || `${n} EXTRA MEASUREMENTS`,
      1.10
    );

    // The full slider fits on the phone layout.
    // Laptop retains the bars and numeric measurement count
    // to avoid overlapping the shared distance scale.

    if (P && slider) {
      animations.push(
        new M.Transform(
          slider,
          extraSlider(n),
          { runTime: 1.10 }
        )
      );
    }

    return animations;
  }

  // ============================================================
  // BEATS 0–5: RETURN TO THE FRUIT SORTER
  // ============================================================

  // 0. Imagine we want to improve our fruit sorting machine.

  await until(S(0));

  await play(
    new M.FadeIn(packingStation),
    new M.FadeIn(incoming),

    ...fbox([
      ['FRUIT SORTER', C.cyan],
      ['can we make it better?', GOLD]
    ], GOLD),

    ...say('CAN WE IMPROVE OUR FRUIT SORTER?', GOLD)
  );

  // 1. So far, we have compared weight and hue.

  await until(S(1));

  await play(
    reveal([weightCard, hueCard], 1.10, 0.18),

    ...fbox([
      ['measurement 1: weight', C.cyan],
      ['measurement 2: hue', C.green]
    ]),

    ...say('SO FAR: WEIGHT AND HUE')
  );

  // 2. Would recording more measurements improve predictions?

  await until(S(2));

  await play(
    new M.FadeIn(moreCard),

    ...fbox([
      ['more measurements', C.ink],
      ['better predictions?', GOLD]
    ], GOLD),

    ...say('DO MORE MEASUREMENTS ALWAYS HELP?', GOLD)
  );

  // 3. Return to the twelve known fruits.

  await until(S(3));

  await play(
    new M.FadeOut(packingStation),
    new M.FadeOut(incoming),

    new M.FadeOut(weightCard),
    new M.FadeOut(hueCard),
    new M.FadeOut(moreCard),

    ...clearBox(),

    reveal(graph, 0.90, 0.06),
    reveal(points, 1.45, 0.06),

    ...say('OUR 12 KNOWN FRUITS')
  );

  // 4. Unknown fruit: weight 150 grams and hue 4.

  await until(S(4));

  await play(
    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['weight = 150 g', C.cyan],
      ['hue = 4', C.green],
      ['grid position = (3, 4)', GOLD]
    ]),

    ...say('150 g AND HUE 4', WHITE)
  );

  // 5. Place it on the drawing as a white diamond.

  const weightGuide = dashed(
    xy(QX, 0),
    xy(QX, QY),
    WHITE
  );

  const hueGuide = dashed(
    xy(0, QY),
    xy(QX, QY),
    WHITE
  );

  await until(S(5));

  await play(
    new M.Create(weightGuide),
    new M.Create(hueGuide),
    new M.FadeIn(query),

    ...say('THE WHITE DIAMOND', WHITE)
  );

  // ============================================================
  // BEATS 6–13: ORIGINAL DISTANCES
  // ============================================================

  // 6. Focus on just two known fruits.

  await until(S(6));

  await play(
    new M.FadeOut(weightGuide),
    new M.FadeOut(hueGuide),

    ...remove(otherPoints),

    ...fbox([
      ['focus on two fruits', C.ink],
      ['one plum', PLUM],
      ['one pear', PEAR]
    ]),

    ...say('FOCUS ON TWO KNOWN FRUITS')
  );

  // 7. Plum P2: weight 150 grams, hue 3.

  await until(S(7));

  await play(
    new M.Create(plumRing),
    new M.FadeIn(plumName),

    ...fbox([
      ['PLUM P2', PLUM],
      ['weight = 150 g', C.ink],
      ['hue = 3', C.ink],
      ['grid position = (3, 3)', GOLD]
    ], PLUM),

    ...say('PLUM: 150 g, HUE 3', PLUM)
  );

  // 8. Pear R1: weight 150 grams, hue 7.

  await until(S(8));

  await play(
    new M.Create(pearRing),
    new M.FadeIn(pearName),

    ...fbox([
      ['PEAR R1', PEAR],
      ['weight = 150 g', C.ink],
      ['hue = 7', C.ink],
      ['grid position = (3, 7)', GOLD]
    ], PEAR),

    ...say('PEAR: 150 g, HUE 7', PEAR)
  );

  // 9. Draw a line from the diamond to each fruit.

  await until(S(9));

  await play(
    new M.Create(plumLine),
    new M.Create(pearLine),

    ...fbox([
      ['same weight', C.cyan],
      ['different hues', C.green],
      ['measure both distances', GOLD]
    ]),

    ...say('MEASURE BOTH DISTANCES')
  );

  // 10. Plum is one grid space away.

  await until(S(10));

  await play(
    new M.FadeIn(plumMark),

    ...fbox([
      ['PLUM', PLUM],
      ['distance = 1', PLUM]
    ], PLUM),

    ...say('PLUM DISTANCE = 1', PLUM)
  );

  // 11. Pear is three grid spaces away.

  await until(S(11));

  await play(
    new M.FadeIn(pearMark),

    ...fbox([
      ['PEAR', PEAR],
      ['distance = 3', PEAR]
    ], PEAR),

    ...say('PEAR DISTANCE = 3', PEAR)
  );

  // 12. Pear is three times as far away.

  await until(S(12));

  await play(
    ...fbox([
      ['pear distance ÷ plum distance', C.ink],
      ['3 ÷ 1 = 3', GOLD],
      ['pear is 3 times as far', GOLD]
    ], GOLD),

    ...say('PEAR IS 3 TIMES AS FAR AWAY', GOLD)
  );

  // 13. The machine clearly knows which fruit is closer.

  await until(S(13));

  await play(
    new M.Indicate(plumPoint, {
      color: PLUM
    }),

    ...fbox([
      ['plum distance = 1', PLUM],
      ['pear distance = 3', PEAR],
      ['plum is clearly nearer', PLUM]
    ], PLUM),

    ...say('THE PLUM IS CLEARLY CLOSER', PLUM)
  );

  // ============================================================
  // BEATS 14–18: IRRELEVANT MEASUREMENTS AND DIMENSIONS
  // ============================================================

  // 14. Imagine extra measurements that reveal nothing
  // about the type of fruit.

  await until(S(14));

  await play(
    ...fbox([
      ['extra measurements', GOLD],
      ['but no information', C.ink],
      ['about the fruit label', C.ink]
    ], GOLD),

    ...say('WHAT IF EXTRA MEASUREMENTS ARE IRRELEVANT?', GOLD)
  );

  // 15. For example, position on a packing tray.

  await until(S(15));

  await play(
    ...remove(graph),

    new M.FadeOut(plumPoint),
    new M.FadeOut(pearPoint),
    new M.FadeOut(query),

    new M.FadeOut(plumRing),
    new M.FadeOut(pearRing),

    new M.FadeOut(plumName),
    new M.FadeOut(pearName),

    new M.FadeOut(plumLine),
    new M.FadeOut(pearLine),

    new M.FadeOut(plumMark),
    new M.FadeOut(pearMark),

    new M.FadeIn(trayTitle),
    reveal(trayRows, 1.30, 0.15),

    ...fbox([
      ['EXAMPLE MEASUREMENT', C.cyan],
      ['position on the tray', GOLD],
      ['unrelated to fruit type', C.muted]
    ], GOLD),

    ...say('EXAMPLE: PACKING TRAY POSITION')
  );

  // 16. A worker's placement need not reveal fruit type.
  // Swap the hypothetical tray positions to illustrate
  // that the fruit labels remain unchanged.

  await until(S(16));

  await play(
    new M.Transform(
      trayRows[1],
      trayRow('plum', 1, 1),
      { runTime: 1.05 }
    ),

    new M.Transform(
      trayRows[2],
      trayRow('pear', 4, 2),
      { runTime: 1.05 }
    ),

    ...fbox([
      ['move the fruit on its tray', C.ink],
      ['its fruit type stays the same', GOLD]
    ], GOLD),

    ...say('TRAY POSITION NEED NOT REVEAL THE LABEL', GOLD)
  );

  // 17. Every new measurement adds another direction
  // in which to compare fruits.

  await until(S(17));

  await play(
    new M.FadeOut(trayTitle),
    ...remove(trayRows),

    reveal(dimensions, 1.45, 0.18),

    ...fbox([
      ['weight: one direction', C.cyan],
      ['hue: another direction', C.green],
      ['extra measurement: another', GOLD]
    ]),

    ...say('EACH MEASUREMENT ADDS A DIRECTION')
  );

  // 18. Each measurement direction is called a dimension.

  await until(S(18));

  await play(
    new M.FadeIn(dimensionTitle),

    ...fbox([
      ['DIMENSION', C.cyan],
      ['one measurement direction', C.ink]
    ]),

    ...say('DIMENSION = MEASUREMENT DIRECTION')
  );

  // ============================================================
  // BEATS 19–22: SWITCH TO DISTANCE BARS
  // ============================================================

  chartTitle = barTitle(
    '0 EXTRA MEASUREMENTS'
  );

  chartAxis = distanceAxis();

  bars = [
    barRow(0, PLUM_D0, 0),
    barRow(1, PEAR_D0, 0)
  ];

  // 19. Many dimensions are difficult to draw together.
  // Instead, use two distance bars.

  await until(S(19));

  await play(
    ...remove(dimensions),
    new M.FadeOut(dimensionTitle),

    new M.FadeIn(chartTitle),
    new M.FadeIn(chartAxis),

    reveal(bars, 1.30, 0.20),

    ...setRatio(START.ratio),

    ...comparisonBox(0),

    ...say('USE TWO DISTANCE BARS INSTEAD')
  );

  // 20. Every extra measurement differs by exactly one
  // unit for BOTH known fruits.

  await until(S(20));

  await play(
    ...fbox([
      ['CONTROLLED EXAMPLE', GOLD],
      ['each extra difference = 1', C.ink],
      ['for the plum AND the pear', C.ink],
      ['each contributes 1² = 1', GOLD]
    ], GOLD),

    ...say('EACH EXTRA DIFFERENCE = 1', GOLD)
  );

  // 21. Include eight extra measurements.
  // Keep both original bar values visible until their
  // individual calculations have been completed.

  const eightTiles = contributionTiles(8);

  await until(S(21));

  await play(
    ...clearRatio(),

    changeChartTitle(
      'ADDING 8 EXTRA MEASUREMENTS'
    ),

    reveal(eightTiles, 1.6, 0.12),

    ...fbox([
      ['8 extra measurements', C.cyan],
      ['each adds 1² = 1', GOLD],
      ['total added contribution = 8', GOLD]
    ], GOLD),

    ...say('ADD 8 EXTRA MEASUREMENTS', GOLD)
  );

  // 22. Square the differences, add them,
  // and take the square root.

  await until(S(22));

  await play(
    ...fbox([
      ['DISTANCE CALCULATION', C.cyan],
      ['1. square each difference', C.ink],
      ['2. add the squared differences', GOLD],
      ['3. take the square root', C.green]
    ]),

    ...say('SQUARE → ADD → SQUARE ROOT')
  );

  // ============================================================
  // BEATS 23–27: PLUM DISTANCE WITH EIGHT EXTRA MEASUREMENTS
  // ============================================================

  // 23. Original plum distance is one.
  // Squaring gives one.

  await until(S(23));

  await play(
    new M.Indicate(bars[0], {
      color: PLUM
    }),

    ...fbox([
      ['PLUM: ORIGINAL DISTANCE', PLUM],
      ['distance = 1', C.ink],
      ['1² = 1', GOLD]
    ], PLUM),

    ...say('PLUM: START WITH 1² = 1', PLUM)
  );

  // 24. Each extra measurement adds one
  // to the squared distance.

  await until(S(24));

  await play(
    new M.LaggedStart(
      eightTiles.map(b =>
        new M.Indicate(b, {
          color: GOLD,
          runTime: 0.60
        })
      ),
      {
        lagRatio: 0.10,
        runTime: 2.0
      }
    ),

    ...fbox([
      ['original squared distance: 1', PLUM],
      ['+ 1 + 1 + 1 + 1', GOLD],
      ['+ 1 + 1 + 1 + 1', GOLD],
      ['8 added contributions', C.ink]
    ], PLUM),

    ...say('ADD ONE FOR EACH EXTRA MEASUREMENT', GOLD)
  );

  // 25. One plus eight gives nine.

  await until(S(25));

  await play(
    ...fbox([
      ['1 + 8', C.ink],
      ['= 9', GOLD]
    ], PLUM),

    ...say('1 + 8 = 9', GOLD)
  );

  // 26. The square root of nine is three.

  await until(S(26));

  await play(
    updateBar(0, 8, 1.10),

    ...fbox([
      ['distance = √9', C.ink],
      ['= 3', PLUM]
    ], PLUM),

    ...say('√9 = 3', PLUM)
  );

  // 27. Plum is now three units away.

  await until(S(27));

  await play(
    new M.Indicate(bars[0], {
      color: PLUM
    }),

    ...fbox([
      ['PLUM DISTANCE', PLUM],
      ['before: 1', C.muted],
      ['after 8 extra measurements: 3', PLUM]
    ], PLUM),

    ...say('PLUM DISTANCE: 1 → 3', PLUM)
  );

  // ============================================================
  // BEATS 28–32: PEAR DISTANCE WITH EIGHT EXTRA MEASUREMENTS
  // ============================================================

  // 28. Original pear distance is three.
  // Squaring gives nine.

  await until(S(28));

  await play(
    new M.Indicate(bars[1], {
      color: PEAR
    }),

    ...fbox([
      ['PEAR: ORIGINAL DISTANCE', PEAR],
      ['distance = 3', C.ink],
      ['3² = 9', GOLD]
    ], PEAR),

    ...say('PEAR: START WITH 3² = 9', PEAR)
  );

  // 29. Nine plus eight gives seventeen.

  await until(S(29));

  await play(
    ...fbox([
      ['9 + 8', C.ink],
      ['= 17', GOLD]
    ], PEAR),

    ...say('9 + 8 = 17', GOLD)
  );

  // 30. Square root of seventeen is about 4.12.

  await until(S(30));

  await play(
    updateBar(1, 8, 1.15),

    changeChartTitle(
      '8 EXTRA MEASUREMENTS'
    ),

    ...remove(eightTiles),

    ...fbox([
      ['distance = √17', C.ink],
      [`≈ ${distanceText(EIGHT.pear)}`, PEAR]
    ], PEAR),

    ...say('√17 ≈ 4.12', PEAR)
  );

  // 31. Look at the two distance bars again.

  await until(S(31));

  await play(
    ...fbox([
      [`plum distance = ${distanceText(EIGHT.plum)}`, PLUM],
      [`pear distance ≈ ${distanceText(EIGHT.pear)}`, PEAR]
    ]),

    ...say('COMPARE THE TWO BARS')
  );

  // 32. Pear is now only 1.37 times as far away.

  await until(S(32));

  await play(
    ...setRatio(EIGHT.ratio),

    ...fbox([
      ['pear distance ÷ plum distance', C.ink],
      ['√17 ÷ 3', GOLD],
      [`≈ ${EIGHT.ratio.toFixed(2)}`, GOLD],
      ['before: 3 times as far', C.muted]
    ], GOLD),

    ...say('NOW ONLY 1.37 TIMES AS FAR', GOLD)
  );

  // ============================================================
  // BEATS 33–39: NINETY-NINE EXTRA MEASUREMENTS
  // ============================================================

  // 33. Increase the number of extra measurements to 99.
  // This is 99 in total, not another 99 on top of eight.

  await until(S(33));

  await play(
    ...clearRatio(),

    changeChartTitle(
      'ADDING 99 EXTRA MEASUREMENTS'
    ),

    ...fbox([
      ['extra measurements: 8 → 99', C.cyan],
      ['99 contributions in total', GOLD],
      ['each contribution = 1', C.ink]
    ], GOLD),

    ...say('99 EXTRA MEASUREMENTS IN TOTAL', GOLD)
  );

  // 34. For plum, one plus ninety-nine gives one hundred.

  await until(S(34));

  await play(
    ...fbox([
      ['PLUM', PLUM],
      ['original distance² = 1', C.ink],
      ['1 + 99 = 100', GOLD]
    ], PLUM),

    ...say('PLUM: 1 + 99 = 100', PLUM)
  );

  // 35. Square root of one hundred is ten.

  await until(S(35));

  await play(
    updateBar(0, 99, 1.10),

    ...fbox([
      ['distance = √100', C.ink],
      ['= 10', PLUM]
    ], PLUM),

    ...say('√100 = 10', PLUM)
  );

  // 36. For pear, nine plus ninety-nine gives 108.

  await until(S(36));

  await play(
    ...fbox([
      ['PEAR', PEAR],
      ['original distance² = 9', C.ink],
      ['9 + 99 = 108', GOLD]
    ], PEAR),

    ...say('PEAR: 9 + 99 = 108', PEAR)
  );

  // 37. Square root of 108 is approximately 10.39.

  await until(S(37));

  await play(
    updateBar(1, 99, 1.15),

    changeChartTitle(
      '99 EXTRA MEASUREMENTS'
    ),

    ...fbox([
      ['distance = √108', C.ink],
      [`≈ ${distanceText(NINETY_NINE.pear)}`, PEAR]
    ], PEAR),

    ...say('√108 ≈ 10.39', PEAR)
  );

  // 38. The two bars are now almost the same length.

  const endW = (NINETY_NINE.pear - NINETY_NINE.plum) * BAR_SCALE + 0.30;
  const endX = (d2x(NINETY_NINE.plum) + d2x(NINETY_NINE.pear)) / 2;
  const almostEqualOutline = new M.VGroup(
    rounded(endW, BAR_HEIGHT + 0.12, [endX, BAR_Y[0], 0], GOLD, 0),
    rounded(endW, BAR_HEIGHT + 0.12, [endX, BAR_Y[1], 0], GOLD, 0)
  );

  await until(S(38));

  await play(
    new M.Create(almostEqualOutline),

    ...fbox([
      [`plum = ${distanceText(NINETY_NINE.plum)}`, PLUM],
      [`pear ≈ ${distanceText(NINETY_NINE.pear)}`, PEAR],
      ['almost the same length', GOLD]
    ], GOLD),

    ...say('THE BARS ARE ALMOST THE SAME LENGTH', GOLD)
  );

  // 39. Pear is now only about 1.04 times as far away.

  await until(S(39));

  await play(
    ...setRatio(NINETY_NINE.ratio),

    ...fbox([
      ['pear distance ÷ plum distance', C.ink],
      ['√108 ÷ 10', GOLD],
      [`≈ ${NINETY_NINE.ratio.toFixed(2)}`, GOLD]
    ], GOLD),

    ...say('ONLY 1.04 TIMES AS FAR AWAY', GOLD)
  );

  // ============================================================
  // BEATS 40–42: DISTANCE CONCENTRATION
  // ============================================================

  // 40. The original weight and hue measurements
  // have not changed.

  await until(S(40));

  await play(
    new M.FadeOut(almostEqualOutline),

    ...fbox([
      ['ORIGINAL MEASUREMENTS', C.cyan],
      ['plum: 150 g, hue 3', PLUM],
      ['pear: 150 g, hue 7', PEAR],
      ['unchanged throughout', GOLD]
    ]),

    ...say('THE ORIGINAL MEASUREMENTS NEVER CHANGED')
  );

  // 41. Relative differences have become much smaller.
  // Compare all three exact calculated distance ratios.

  await until(S(41));

  await play(
    ...fbox([
      ['PEAR / PLUM DISTANCE', C.cyan],
      [`0 extra:  ${ratioText(START.ratio)}`, GOLD],
      [`8 extra:  ${ratioText(EIGHT.ratio)}`, GOLD],
      [`99 extra: ${ratioText(NINETY_NINE.ratio)}`, GOLD]
    ], GOLD),

    ...say('3× → 1.37× → 1.04×', GOLD)
  );

  // Show how the relative excess shrinks:
  // 200% farther → 37.4% farther → 3.9% farther.
  // These are derived from unrounded distance ratios.

  await play(
    ...fbox([
      ['HOW MUCH FARTHER IS PEAR?', C.cyan],
      [
        `0 extra:  ${fmt(100 * START.relativeGap, 1)}%`,
        GOLD
      ],
      [
        `8 extra:  ${fmt(100 * EIGHT.relativeGap, 1)}%`,
        GOLD
      ],
      [
        `99 extra: ${fmt(100 * NINETY_NINE.relativeGap, 1)}%`,
        GOLD
      ]
    ], GOLD)
  );

  // 42. Distances becoming less distinct as dimensions
  // increase is called distance concentration.

  await until(S(42));

  await play(
    new M.Indicate(bars[0], {
      color: PLUM
    }),

    new M.Indicate(bars[1], {
      color: PEAR
    }),

    ...fbox([
      ['DISTANCE CONCENTRATION', GOLD],
      ['near and far can become', C.ink],
      ['less distinct as dimensions', C.ink],
      ['increase', C.ink]
    ], GOLD),

    ...say('DISTANCE CONCENTRATION', GOLD)
  );

  // ============================================================
  // BEATS 43–45: GENERALISE THE CONTROLLED CALCULATION
  // ============================================================

  // 43. Write the calculation in one short formula.

  await until(S(43));

  await play(
    ...fbox([
      ['ONE SHORT FORMULA', C.cyan],
      ['original squared distance', C.ink],
      ['+ added contributions', GOLD],
      ['then take the square root', C.green]
    ]),

    ...say('A FORMULA FOR OUR EXAMPLE')
  );

  // 44. New distance equals the square root of the original
  // distance squared plus the number of extra measurements.

  await until(S(44));

  await play(
    ...fbox([
      ['new distance = √(d₀² + n)', GOLD],
      ['d₀ = original distance', C.ink],
      ['n = extra measurements', C.cyan],
      ['each adds exactly 1', C.muted]
    ], GOLD),

    ...say('NEW DISTANCE = √(d₀² + n)', GOLD)
  );

  // Apply the formula to both original fruits.

  await play(
    ...fbox([
      ['PLUM: √(1² + 99) = 10', PLUM],
      ['PEAR: √(3² + 99)', PEAR],
      ['    = √108 ≈ 10.39', PEAR]
    ], GOLD)
  );

  // 45. This formula applies because every extra
  // measurement contributes exactly one.

  await until(S(45));

  await play(
    ...fbox([
      ['IMPORTANT CONDITION', GOLD],
      ['each extra difference = 1', C.ink],
      ['each squared difference = 1', C.ink],
      ['so n contributions add n', GOLD]
    ], GOLD),

    ...say('THIS FORMULA USES OUR CONTROLLED EXAMPLE', GOLD)
  );

  // ============================================================
  // BEATS 46–49: WHY DISTANCE CONCENTRATION MATTERS
  // ============================================================

  // 46. Useful for choosing measurements in tools
  // such as nearest neighbors.

  await until(S(46));

  await play(
    ...fbox([
      ['NEAREST NEIGHBORS', C.cyan],
      ['depends on knowing which', C.ink],
      ['examples are genuinely close', C.green]
    ]),

    ...say('DISTANCE MATTERS FOR NEAREST NEIGHBORS')
  );

  // 47. The trap is thinking that more measurements
  // must always improve predictions.

  await until(S(47));

  await play(
    ...fbox([
      ['MORE MEASUREMENTS', GOLD],
      ['do not automatically mean', C.ink],
      ['better predictions', GOLD]
    ], GOLD),

    ...say('MORE DATA IS NOT ALWAYS MORE INFORMATION', GOLD)
  );

  // 48. Irrelevant measurements can make it harder to
  // recognise genuinely similar fruits.

  await until(S(48));

  await play(
    new M.Indicate(bars[0], {
      color: PLUM
    }),

    new M.Indicate(bars[1], {
      color: PEAR
    }),

    ...fbox([
      ['original distance ratio: 3×', C.muted],
      ['current distance ratio: 1.04×', GOLD],
      ['irrelevant measurements can', C.ink],
      ['hide useful differences', GOLD]
    ], GOLD),

    ...say('IRRELEVANT MEASUREMENTS CAN HIDE SIMILARITY', GOLD)
  );

  // 49. Not every dataset behaves this way.
  // Useful additional measurements can still help.

  await until(S(49));

  await play(
    ...fbox([
      ['NOT EVERY DATASET', GOLD],
      ['behaves in this way', C.ink],
      ['useful extra measurements', C.green],
      ['can improve predictions', C.green]
    ], C.green),

    ...say('USEFUL EXTRA MEASUREMENTS CAN STILL HELP', C.green)
  );

  // ============================================================
  // BEATS 50–53: TRY IT PREVIEW
  // ============================================================

  // 50. Change the number of extra measurements and
  // watch both distance bars and calculations update.

  slider = extraSlider(0);

  await until(S(50));

  await play(
    ...updateBoth(
      0,
      '0 EXTRA MEASUREMENTS',
      1.0
    ),

    ...(P ? [new M.FadeIn(slider)] : []),

    ...say('TRY IT: CHANGE THE EXTRA MEASUREMENTS', C.green)
  );

  // Preview moving the measurement-count control.
  // Demonstration value: four extra measurements.

  await play(
    ...tryUpdate(4)
  );

  await play(
    ...tryUpdate(16)
  );

  // 51. Find how many extra measurements make
  // the plum's distance exactly three.
  //
  // sqrt(1 + n) = 3
  // 1 + n = 9
  // n = 8

  await until(S(51));

  await play(
    ...fbox([
      ['TARGET: PLUM DISTANCE = 3', PLUM],
      ['√(1 + n) = 3', C.ink],
      ['1 + n = 9', C.ink],
      ['n = 8', GOLD]
    ], PLUM),

    ...say('TRY IT: MAKE THE PLUM DISTANCE 3', C.green)
  );

  await play(
    ...tryUpdate(8)
  );

  // 52. Predict whether ninety-nine extra measurements
  // make the bars more or less alike, then check.

  await until(S(52));

  await play(
    ...fbox([
      ['PREDICT FIRST', GOLD],
      ['what will 99 extra', C.ink],
      ['measurements do?', C.ink],
      ['more alike or less alike?', GOLD]
    ], GOLD),

    ...say('TRY IT: PREDICT THE RESULT FOR 99', C.green)
  );

  await until(S(52) + 2.1);

  await play(
    ...tryUpdate(99)
  );

  await play(
    ...fbox([
      ['CHECK YOUR PREDICTION', C.green],
      ['8 extra: ratio ≈ 1.37×', C.muted],
      ['99 extra: ratio ≈ 1.04×', GOLD],
      ['the bars are more alike', C.green]
    ], C.green)
  );

  // 53. New data: explore different starting distances.
  //
  // Hypothetical teaching example:
  // plum starts at distance 2;
  // pear starts at distance 4.
  //
  // Original ratio = 2.
  // With 99 extra measurements:
  // plum = sqrt(103)
  // pear = sqrt(115)
  // ratio ≈ 1.06.
  //
  // Original chapter data remain untouched.

  const FRESH_PLUM = 2;
  const FRESH_PEAR = 4;

  const FRESH_START = comparison(
    0,
    FRESH_PLUM,
    FRESH_PEAR
  );

  const FRESH_END = comparison(
    99,
    FRESH_PLUM,
    FRESH_PEAR
  );

  await until(S(53));

  currentPlumStart = FRESH_PLUM;
  currentPearStart = FRESH_PEAR;

  await play(
    ...tryUpdate(
      0,
      'NEW DATA: DIFFERENT STARTING DISTANCES'
    ),

    ...say('TRY IT: PRESS NEW DATA', C.green)
  );

  await play(
    ...tryUpdate(
      99,
      'NEW DATA: 99 EXTRA MEASUREMENTS'
    )
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE ORIGINAL LESSON EXAMPLE
  // ============================================================

  // Restore exact original distances:
  // plum = 1, pear = 3.
  //
  // Then compare them after adding the original controlled
  // set of ninety-nine extra measurements.

  await until(S(54));

  currentPlumStart = PLUM_D0;
  currentPearStart = PEAR_D0;

  await play(
    ...(P && slider
      ? [new M.FadeOut(slider)]
      : []),

    ...updateBoth(
      0,
      'ORIGINAL TWO MEASUREMENTS',
      1.0
    ),

    ...say('REMEMBER: IRRELEVANT MEASUREMENTS CAN HIDE DISTANCE', GOLD)
  );

  await play(
    ...updateBoth(
      99,
      '99 IRRELEVANT EXTRA MEASUREMENTS',
      1.65
    )
  );

  await play(
    ...fbox([
      ['DISTANCE CONCENTRATION', GOLD],
      ['near and far can look alike', C.ink],
      ['distance-based tools may suffer', C.ink],
      ['choose useful measurements', C.green]
    ], GOLD),

    new M.Indicate(bars[0], {
      color: PLUM,
      runTime: 0.90
    }),

    new M.Indicate(bars[1], {
      color: PEAR,
      runTime: 0.90
    }),

    ...say('CHOOSE MEASUREMENTS THAT CONTAIN USEFUL INFORMATION', C.green)
  );
}

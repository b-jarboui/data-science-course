// lesson 13.1.9
// Soft-margin support vector machines: balancing width and violations.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact six-fruit teaching example and specified candidate weights.
// All calculations use unrounded values internally.
// The search illustrates the objective, rather than a full SVM solver.
// Overlapping fruit symbols are vertically offset for visibility only;
// their measured weight coordinates remain identical.
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

  const WHITE = '#FFFFFF';
  const GOLD = C.amber;
  const CYAN = C.cyan;
  const GREEN = C.green;
  const RED = '#F87171';

  const CX = P ? 0 : -2.6;

  // Phone: pill, picture, loss cards, explanation box, chart (top to bottom).
  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 2.15, 0];

  const BOXP = P
    ? [0, -3.92, 0]
    : [4.3, 0.35, 0];

  // vertical scale of the fruit stack (phone picture is taller)
  const K = P ? 1.35 : 1;

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

  // Phone content bounds: y = -5.5 to 4.3.
  // Laptop content bounds: y = -3.0 to 2.3.
  //
  // The drawing is one-dimensional.
  // Vertical offsets are only for displaying labels,
  // overlapping symbols and hinge-loss annotations.

  const U = P ? 1.00 : 0.76;

  const XMIN = 0;
  const XMAX = 7;

  const CENTRE = 3.5;
  const CENTRE_GRAMS = 175;

  const XL = CX - CENTRE * U;
  const XR = XL + XMAX * U;

  const AXIS_Y = P ? 0.75 : -0.40;

  const STRIP_TOP = P ? 2.95 : 1.20;
  const STRIP_BOTTOM = AXIS_Y - 0.28;

  const FR = P ? 0.19 : 0.14;

  const X = x => XL + x * U;

  const pos = (x, y = AXIS_Y) => [
    X(x),
    y,
    0
  ];

  const weightUnits = grams => grams / 50;

  const colorOf = label =>
    label === 'plum' ? PLUM : APPLE;

  const labelSign = label =>
    label === 'plum' ? -1 : 1;

  // ============================================================
  // EXACT SHARED LESSON DATA
  // ============================================================

  // The four original fruits are taken directly from
  // the shared chapter dataset.
  //
  // Only the weight measurement is used for classification.

  const ORIGINAL_FOUR = [
    {
      id: 'P1',
      label: 'plum',
      weight: 50,
      hue: 3,
      firmness: 3
    },

    {
      id: 'P2',
      label: 'plum',
      weight: 150,
      hue: 3,
      firmness: 4
    },

    {
      id: 'A1',
      label: 'apple',
      weight: 200,
      hue: 3,
      firmness: 3
    },

    {
      id: 'A3',
      label: 'apple',
      weight: 300,
      hue: 1,
      firmness: 2
    }
  ];

  // Two explicitly introduced, correctly labelled fruits.
  // They have identical measurements, but different labels.

  const EXTRA = [
    {
      id: 'P5',
      label: 'plum',
      weight: 175,
      hue: 3,
      firmness: 3
    },

    {
      id: 'A5',
      label: 'apple',
      weight: 175,
      hue: 3,
      firmness: 3
    }
  ];

  const DATA = [
    ...ORIGINAL_FOUR,
    ...EXTRA
  ];

  const PAIRS = [
    {
      name: 'OUTER FRUITS',
      ids: ['P1', 'A3']
    },

    {
      name: 'INNER FRUITS',
      ids: ['P2', 'A1']
    },

    {
      name: 'OVERLAPPING',
      ids: ['P5', 'A5']
    }
  ];

  // ============================================================
  // SOFT-MARGIN CALCULATIONS
  // ============================================================

  // Classification score:
  //
  // f(x) = w × (x − 3.5)
  //
  // Plum label sign  = -1.
  // Apple label sign = +1.
  //
  // Signed margin:
  //
  // m_i = labelSign_i × f(x_i)
  //
  // Hinge loss:
  //
  // h_i = max(0, 1 − m_i)
  //
  // Width penalty:
  //
  // R = w² / 2
  //
  // Total objective:
  //
  // J = R + C × sum(h_i)
  //
  // For w > 0, the margin extends 1/w grid units
  // on each side of the fixed decision boundary.
  //
  // For w = 0, all classification scores are zero.
  // There is no finite margin edge and no separating
  // prediction, even though we retain the reference line.

  const sum = values =>
    values.reduce((a, b) => a + b, 0);

  function fmt(n, places = 4) {
    if (!Number.isFinite(n)) {
      return '∞';
    }

    const v = Number(n.toFixed(places));

    return v < 0
      ? '−' + String(Math.abs(v))
      : String(v);
  }

  function fixed(n, places = 2) {
    return Number.isFinite(n)
      ? n.toFixed(places)
      : '∞';
  }

  function evaluate(
    w,
    costC = 0.1,
    data = DATA,
    centre = CENTRE
  ) {
    const rows = data.map(d => {
      const x = weightUnits(d.weight);

      const displacement = x - centre;
      const distance = Math.abs(displacement);

      const score = w * displacement;

      const signedMargin =
        labelSign(d.label) * score;

      const hingeLoss = Math.max(
        0,
        1 - signedMargin
      );

      const predicted =
        Math.abs(score) < 1e-12
          ? 'tie'
          : score < 0
            ? 'plum'
            : 'apple';

      const correct =
        predicted === d.label;

      return {
        ...d,

        x,
        distance,
        displacement,

        score,
        signedMargin,
        hingeLoss,

        predicted,
        correct
      };
    });

    const totalHinge = sum(
      rows.map(d => d.hingeLoss)
    );

    const widthPenalty =
      w * w / 2;

    const violationPenalty =
      costC * totalHinge;

    const objective =
      widthPenalty +
      violationPenalty;

    const halfWidth =
      w > 0 ? 1 / w : Infinity;

    return {
      w,
      costC,
      centre,
      data,
      rows,

      totalHinge,
      widthPenalty,
      violationPenalty,
      objective,

      halfWidth,

      width: 2 * halfWidth,

      widthGrams: 100 * halfWidth,

      low: centre - halfWidth,
      high: centre + halfWidth,

      correctCount: rows.filter(
        d => d.correct
      ).length
    };
  }

  const WEIGHTS = [0, 0.4, 1];

  const LOW_C = 0.1;
  const HIGH_C = 1;

  const LOW_RESULTS = WEIGHTS.map(
    w => evaluate(w, LOW_C)
  );

  const HIGH_RESULTS = WEIGHTS.map(
    w => evaluate(w, HIGH_C)
  );

  const I1 = LOW_RESULTS[0];
  const I2 = LOW_RESULTS[1];
  const I3 = LOW_RESULTS[2];

  function bestCandidate(results) {
    return results.reduce(
      (best, current) =>
        current.objective < best.objective
          ? current
          : best
    );
  }

  const LOW_BEST = bestCandidate(
    LOW_RESULTS
  );

  const HIGH_BEST = bestCandidate(
    HIGH_RESULTS
  );

  // Checked facts:
  //
  // Iteration 1:
  // w = 0
  // signed margins = 0 for all six fruits
  // hinge losses   = 1 for all six fruits
  // total hinge    = 6
  // width penalty  = 0
  //
  // Iteration 2:
  // w = 0.4
  // outer signed margins = 1
  // inner signed margins = 0.2
  // overlapping signed margins = 0
  // outer hinge = 0 each
  // inner hinge = 0.8 each
  // overlapping hinge = 1 each
  // total hinge = 3.6
  // width penalty = 0.08
  // half-width = 2.5
  //
  // Iteration 3:
  // w = 1
  // outer signed margins = 2.5
  // inner signed margins = 0.5
  // overlapping signed margins = 0
  // outer hinge = 0 each
  // inner hinge = 0.5 each
  // overlapping hinge = 1 each
  // total hinge = 3
  // width penalty = 0.5
  // half-width = 1
  //
  // C = 0.1:
  // J = 0.60, 0.44, 0.80
  // best w = 0.4
  //
  // C = 1:
  // J = 6, 3.68, 3.50
  // best w = 1

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo(p);

    return t;
  }

  function line(
    start,
    end,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth
    });
  }

  function dashed(
    start,
    end,
    color = C.muted
  ) {
    return new M.DashedLine({
      start,
      end,
      color
    });
  }

  function rect(
    width,
    height,
    p,
    color,
    opacity = 0,
    strokeWidth = 2
  ) {
    const r = new M.Rectangle({
      width: Math.max(width, 0.001),
      height: Math.max(height, 0.001),
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(
    width,
    height,
    p,
    color,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function tag(
    s,
    color,
    p,
    size = 17
  ) {
    const t = pill(s, color, size);

    t.moveTo(p);

    return t;
  }

  function dot(
    p,
    color,
    radius = 0.055
  ) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return d;
  }

  function ring(
    p,
    color = GOLD,
    radius = FR * 1.7
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2.2
    });

    c.setFill(color, 0);
    c.moveTo(p);

    return c;
  }

  function reveal(
    objects,
    runTime = 1,
    lagRatio = 0.12
  ) {
    return new M.LaggedStart(
      objects.map(o =>
        new M.FadeIn(o)
      ),
      {
        lagRatio,
        runTime
      }
    );
  }

  function remove(objects) {
    return objects
      .filter(Boolean)
      .map(o =>
        new M.FadeOut(o)
      );
  }

  // Each named slot owns one current visual.
  // Replacements never reparent existing on-screen objects.

  const slots = new Map();

  function swap(
    key,
    object
  ) {
    const previous =
      slots.get(key);

    const animations = [];

    if (previous) {
      animations.push(
        new M.FadeOut(previous)
      );
    }

    if (object) {
      slots.set(key, object);

      animations.push(
        new M.FadeIn(object)
      );

    } else {
      slots.delete(key);
    }

    return animations;
  }

  function drop(...keys) {
    return keys.flatMap(
      key => swap(key, null)
    );
  }

  // ============================================================
  // ONE FORMULA / INFORMATION BOX
  // ============================================================

  let boxNow = null;

  function fbox(
    lines,
    color = CYAN
  ) {
    const size = P ? 21 : 21;
    const lh = P ? 0.34 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(
        s.trimStart(),
        size,
        c,
        true
      )
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd =
      Math.max(...widths) + 0.65;

    const ht =
      rows.length * lh + 0.32;

    const body = rounded(
      wd,
      ht,
      BOXP,
      color,
      0.97
    );

    const left =
      BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 -
      0.16 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left +
        indent +
        t.getWidth() / 2,

        top - i * lh,

        0
      ]);
    });

    const g = new M.VGroup(
      body,
      ...texts
    );

    const maxw = P
      ? FW - 0.9
      : 4.05;

    const maxh = P
      ? 1.50
      : 1.85;

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
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    animations.push(
      new M.FadeIn(g)
    );

    boxNow = g;

    return animations;
  }

  // ============================================================
  // CONSISTENT CHAPTER FRUIT SYMBOLS
  // ============================================================

  function fruit(
    label,
    p,
    r = FR
  ) {
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

    } else {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });
    }

    body.setFill(color, 0.96);
    body.moveTo(p);

    return new M.VGroup(
      halo,
      body
    );
  }

  // ============================================================
  // INTRODUCTION: IDENTICAL MEASUREMENTS
  // ============================================================

  function measurementCard(
    p,
    label,
    visibleLabel = false
  ) {
    const [x, y] = p;

    const color = visibleLabel
      ? colorOf(label)
      : WHITE;

    const w = P ? 2.65 : 2.55;
    const h = 2.25;

    const parts = [
      rounded(
        w,
        h,
        p,
        color
      )
    ];

    if (visibleLabel) {
      parts.push(
        fruit(
          label,
          [x, y + 0.70, 0],
          FR * 1.35
        )
      );

    } else {
      const diamond = rect(
        0.34,
        0.34,
        [x, y + 0.70, 0],
        WHITE,
        1
      );

      diamond.rotate(Math.PI / 4);
      diamond.moveTo([
        x,
        y + 0.70,
        0
      ]);

      parts.push(diamond);
    }

    parts.push(
      text(
        '175 grams',
        20,
        CYAN,
        [x, y + 0.23, 0],
        true
      ),

      text(
        'Hue 3',
        17,
        GOLD,
        [x, y - 0.10, 0],
        true
      ),

      text(
        'Firmness 3',
        17,
        GREEN,
        [x, y - 0.40, 0],
        true
      )
    );

    const firmness = [];

    for (let i = 0; i < 4; i++) {
      firmness.push(
        rect(
          0.22,
          0.13,
          [
            x + (i - 1.5) * 0.28,
            y - 0.63,
            0
          ],
          i < 3 ? GREEN : C.muted,
          i < 3 ? 0.9 : 0.1,
          1
        )
      );
    }

    parts.push(...firmness);

    parts.push(
      text(
        visibleLabel
          ? label.toUpperCase()
          : 'LABEL ?',

        18,

        color,

        [x, y - 0.90, 0],

        true
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  const INTRO_Y = P ? 0.50 : -0.35;

  const leftIntro = [
    CX - 1.45,
    INTRO_Y,
    0
  ];

  const rightIntro = [
    CX + 1.45,
    INTRO_Y,
    0
  ];

  function introCards(visible) {
    return new M.VGroup(
      measurementCard(
        leftIntro,
        'plum',
        visible
      ),

      measurementCard(
        rightIntro,
        'apple',
        visible
      )
    );
  }

  // ============================================================
  // ONE-DIMENSIONAL WEIGHT DRAWING
  // ============================================================

  function weightAxis() {
    const parts = [
      line(
        pos(XMIN),
        pos(XMAX),
        C.ink,
        2.5
      )
    ];

    for (let i = 0; i <= 7; i++) {
      const x = X(i);

      parts.push(
        line(
          [x, AXIS_Y - 0.065, 0],
          [x, AXIS_Y + 0.065, 0],
          C.muted,
          1.6
        ),

        text(
          String(i * 50),
          P ? 15 : 13,
          C.muted,
          [x, AXIS_Y - 0.24, 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Weight (grams) →',
        17,
        C.ink,
        [
          CX,
          AXIS_Y - 0.59,
          0
        ]
      )
    );

    parts.push(
      text(
        '1 grid unit = 50 g',
        15,
        C.muted,
        [
          CX,
          AXIS_Y - 0.88,
          0
        ],
        true
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function fruitPosition(d) {
    const x =
      weightUnits(d.weight);

    // Overlapping fruits are stacked vertically.
    // Both are anchored to the exact same axis position.

    let dy = 0.24;

    if (d.id === 'P5') {
      dy = 0.62;

    } else if (d.id === 'A5') {
      dy = 1.0;
    }

    return pos(
      x,
      AXIS_Y + dy * K
    );
  }

  function measuredFruit(d) {
    const color =
      colorOf(d.label);

    const p =
      fruitPosition(d);

    const x =
      weightUnits(d.weight);

    const anchor =
      pos(x);

    const parts = [
      line(
        anchor,
        p,
        color,
        1.4
      ),

      dot(
        anchor,
        color,
        0.035
      ),

      fruit(
        d.label,
        p
      )
    ];

    // Stagger the added-fruit labels horizontally so
    // their shared weight coordinate remains visible.

    // P2 / P5 labels sit to the left, A1 / A5 to the right,
    // so nothing lands on the crowded 150-200 g stack.
    let dx = 0;
    let dy = 0.29 * K;

    const side = FR * 1.65 + (P ? 0.24 : 0.17);

    if (d.id === 'P2' || d.id === 'P5') {
      dx = -side;
      dy = 0;

    } else if (d.id === 'A1' || d.id === 'A5') {
      dx = side;
      dy = 0;
    }

    parts.push(
      text(
        d.id,
        P ? 15 : 13,
        color,
        [
          p[0] + dx,
          p[1] + dy,
          0
        ],
        true
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  const fruitObjects = new Map();

  function addFruit(d) {
    const g =
      measuredFruit(d);

    fruitObjects.set(
      d.id,
      g
    );

    return new M.FadeIn(g);
  }

  function fruitById(id) {
    return fruitObjects.get(id);
  }

  function highlightIds(
    ids,
    color = GOLD,
    runTime = 1.0
  ) {
    return new M.LaggedStart(
      ids.map(id =>
        new M.Indicate(
          fruitById(id),
          { color }
        )
      ),

      {
        lagRatio: 0.15,
        runTime
      }
    );
  }

  function replaceFruits(data) {
    return data.flatMap(d => {
      const previous =
        fruitObjects.get(d.id);

      const next =
        measuredFruit(d);

      fruitObjects.set(
        d.id,
        next
      );

      return [
        ...(previous
          ? [new M.FadeOut(previous)]
          : []),

        new M.FadeIn(next)
      ];
    });
  }

  // ============================================================
  // FIXED DIVIDING LINE AND SOFT-MARGIN STRIP
  // ============================================================

  function boundary(
    centre = CENTRE,
    active = true
  ) {
    const p = [
      X(centre),
      STRIP_TOP + 0.13,
      0
    ];

    const edge = active
      ? line(
          pos(
            centre,
            STRIP_BOTTOM
          ),

          pos(
            centre,
            STRIP_TOP
          ),

          GOLD,
          2.8
        )
      : dashed(
          pos(
            centre,
            STRIP_BOTTOM
          ),

          pos(
            centre,
            STRIP_TOP
          ),

          C.muted
        );

    return new M.VGroup(
      edge,

      tag(
        active
          ? `${fmt(centre * 50)} g`
          : '175 g reference',

        active ? GOLD : C.muted,

        p,

        P ? 15 : 13
      )
    );
  }

  function decisionRegions(
    centre = CENTRE
  ) {
    const h =
      STRIP_TOP - STRIP_BOTTOM;

    const cy =
      (STRIP_TOP + STRIP_BOTTOM) / 2;

    const xx = X(centre);

    return new M.VGroup(
      rect(
        xx - XL,
        h,
        [
          (XL + xx) / 2,
          cy,
          0
        ],
        PLUM,
        0.075,
        0
      ),

      rect(
        XR - xx,
        h,
        [
          (xx + XR) / 2,
          cy,
          0
        ],
        APPLE,
        0.075,
        0
      )
    );
  }

  function marginStrip(result) {
    const h =
      STRIP_TOP - STRIP_BOTTOM;

    const cy =
      (STRIP_TOP + STRIP_BOTTOM) / 2;

    if (result.w === 0) {
      return new M.VGroup(
        rect(
          XR - XL,
          h,
          [CX, cy, 0],
          C.muted,
          0.12,
          0
        ),

        text(
          'No finite margin edges',
          P ? 16 : 14,
          C.muted,
          [
            X(1.6),
            STRIP_TOP - 0.26 * K,
            0
          ]
        )
      );
    }

    const low = Math.max(
      XMIN,
      result.low
    );

    const high = Math.min(
      XMAX,
      result.high
    );

    const parts = [
      rect(
        (high - low) * U,

        h,

        [
          X((low + high) / 2),
          cy,
          0
        ],

        CYAN,

        0.21,

        0
      )
    ];

    if (
      result.low >= XMIN &&
      result.low <= XMAX
    ) {
      parts.push(
        dashed(
          pos(
            result.low,
            STRIP_BOTTOM
          ),

          pos(
            result.low,
            STRIP_TOP
          ),

          CYAN
        )
      );
    }

    if (
      result.high >= XMIN &&
      result.high <= XMAX
    ) {
      parts.push(
        dashed(
          pos(
            result.high,
            STRIP_BOTTOM
          ),

          pos(
            result.high,
            STRIP_TOP
          ),

          CYAN
        )
      );
    }

    return new M.VGroup(
      ...parts
    );
  }

  let stripNow = null;

  function updateStrip(
    result,
    animate = true
  ) {
    const next =
      marginStrip(result);

    const previous =
      stripNow;

    stripNow = next;

    // Only transform groups with the same geometry structure.
    // The w = 0 case has different components and is faded.

    const compatible =
      previous &&
      previous.submobjects &&
      next.submobjects &&
      previous.submobjects.length ===
        next.submobjects.length;

    if (animate && compatible) {
      stripNow = previous;

      return [
        new M.Transform(
          previous,
          next,
          { runTime: 0.9 }
        )
      ];
    }

    return [
      ...remove([previous]),
      new M.FadeIn(next)
    ];
  }

  function clearStrip() {
    const previous =
      stripNow;

    stripNow = null;

    return remove([previous]);
  }

  function widthLabel(result) {
    const s = result.w === 0
      ? 'w = 0: no finite width'
      : `w = ${fmt(result.w)}   |   width = ${fmt(result.widthGrams)} g`;

    return tag(
      s,
      CYAN,
      [
        CX,
        AXIS_Y - 1.32,
        0
      ],
      P ? 16 : 14
    );
  }

  function stripAnimations(result) {
    return [
      ...updateStrip(result),

      ...swap(
        'boundary',
        boundary(
          result.centre,
          result.w > 0
        )
      ),

      ...swap(
        'regions',
        result.w > 0
          ? decisionRegions(
              result.centre
            )
          : null
      ),

      ...swap(
        'width',
        widthLabel(result)
      )
    ];
  }

  function widthBracket(
    result
  ) {
    if (result.w === 0) {
      return text(
        'All scores are zero',
        17,
        C.muted,
        [
          CX,
          STRIP_TOP - 0.50,
          0
        ]
      );
    }

    const low = Math.max(
      XMIN,
      result.low
    );

    const high = Math.min(
      XMAX,
      result.high
    );

    const y =
      STRIP_TOP - 0.25 * K;

    const a = X(low);
    const b = X(high);

    return new M.VGroup(
      line(
        [a, y, 0],
        [b, y, 0],
        CYAN,
        2.2
      ),

      line(
        [a, y - 0.065, 0],
        [a, y + 0.065, 0],
        CYAN,
        1.7
      ),

      line(
        [b, y - 0.065, 0],
        [b, y + 0.065, 0],
        CYAN,
        1.7
      )
    );
  }

  // ============================================================
  // DISTANCE AND SIGNED-MARGIN VISUALS
  // ============================================================

  function distanceMeasure(
    x,
    centre,
    y,
    color,
    label
  ) {
    const a = X(x);
    const b = X(centre);

    return new M.VGroup(
      line(
        [a, y, 0],
        [b, y, 0],
        color,
        2.4
      ),

      line(
        [a, y - 0.06, 0],
        [a, y + 0.06, 0],
        color,
        1.7
      ),

      line(
        [b, y - 0.06, 0],
        [b, y + 0.06, 0],
        color,
        1.7
      ),

      text(
        label,
        P ? 16 : 14,
        color,
        // short guides: label beyond the fruit end,
        // so it never sits on the gold dividing line
        Math.abs(a - b) < 0.8
          ? [
              a + Math.sign(a - b) * (P ? 0.30 : 0.24),
              y,
              0
            ]
          : [
              (a + b) / 2,
              y + 0.17 * K,
              0
            ],
        true
      )
    );
  }

  function pairDistanceGuides(
    ids,
    data = DATA
  ) {
    return new M.VGroup(
      ...ids.map(id => {
        const d = data.find(
          f => f.id === id
        );

        const x =
          weightUnits(d.weight);

        const distance =
          Math.abs(x - CENTRE);

        return distanceMeasure(
          x,
          CENTRE,
          STRIP_TOP - 0.32 * K,
          colorOf(d.label),
          fmt(distance)
        );
      })
    );
  }

  function overlapHighlight(
    data = DATA
  ) {
    const parts = [];

    for (const id of ['P5', 'A5']) {
      const d = data.find(
        f => f.id === id
      );

      parts.push(
        ring(
          fruitPosition(d),
          GOLD,
          FR * 1.55
        )
      );
    }

    const x = X(CENTRE);

    const a5y =
      AXIS_Y + 1.0 * K;

    const ty =
      STRIP_TOP - 0.22 * K;

    parts.push(
      line(
        [x + 0.15 * K, a5y + 0.18 * K, 0],

        [
          x + 0.95 * K,
          ty,
          0
        ],

        GOLD,

        1.4
      ),

      tag(
        'SAME x',
        GOLD,
        [
          x + 1.35 * K,
          ty,
          0
        ],
        P ? 15 : 12
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  // ============================================================
  // SIX-FRUIT HINGE-LOSS PANEL
  // ============================================================

  // The pair cards are not additional fruit measurements.
  // They are a calculation ledger for the six existing fruits.
  //
  // A filled bar represents a fruit's hinge loss.
  // All individual bars share a fixed scale of 0–2 loss units.

  const PAIR_SP = P ? 2.60 : 1.92;

  const PAIR_W = P ? 2.45 : 1.80;

  const PAIR_H = P ? 1.50 : 1.14;

  const PAIR_Y = P ? -1.72 : -2.95;

  const pairX = i =>
    CX + (i - 1) * PAIR_SP;

  function lossColor(row) {
    if (row.hingeLoss < 1e-12) {
      return GREEN;
    }

    if (row.signedMargin < 0) {
      return RED;
    }

    return GOLD;
  }

  function lossCard(
    result,
    pair,
    i,
    visible = true,
    emphasis = false
  ) {
    const x = pairX(i);
    const y = PAIR_Y;

    const rows = pair.ids.map(
      id => result.rows.find(
        r => r.id === id
      )
    );

    const body = rounded(
      PAIR_W,
      PAIR_H,
      [x, y, 0],
      emphasis ? GOLD : C.muted,
      0.97
    );

    const parts = [
      body,

      text(
        pair.name,
        P ? 16 : 12,
        emphasis ? GOLD : C.ink,
        [
          x,
          y + PAIR_H / 2 - (P ? 0.22 : 0.19),
          0
        ],
        true,
        PAIR_W - 0.12
      )
    ];

    rows.forEach((row, j) => {
      const yy = P
        ? y + 0.10 - j * 0.48
        : y + PAIR_H * 0.11 - j * 0.38;

      const color =
        colorOf(row.label);

      const lc =
        lossColor(row);

      parts.push(
        fruit(
          row.label,
          [
            x - PAIR_W / 2 + (P ? 0.22 : 0.17),
            yy,
            0
          ],
          P ? 0.09 : 0.065
        ),

        text(
          row.id,
          P ? 15 : 12,
          color,
          [
            x - PAIR_W / 2 + (P ? 0.56 : 0.39),
            yy,
            0
          ],
          true
        ),

        text(
          visible
            ? `m=${fmt(row.signedMargin)}`
            : 'm=?',

          P ? 17 : 12,

          C.ink,

          [
            x + (P ? 0.05 : 0.03),
            yy,
            0
          ],

          true,

          P ? 0.80 : 0.60
        ),

        text(
          visible
            ? `h=${fmt(row.hingeLoss)}`
            : 'h=?',

          P ? 17 : 12,

          visible ? lc : C.muted,

          [
            x + PAIR_W / 2 - (P ? 0.42 : 0.34),
            yy,
            0
          ],

          true,

          P ? 0.70 : 0.64
        )
      );

      const barWidth =
        PAIR_W - 0.28;

      const barLeft =
        x - barWidth / 2;

      const barY =
        yy - (P ? 0.21 : 0.17);

      parts.push(
        rect(
          barWidth,
          0.075,
          [x, barY, 0],
          C.muted,
          0.14,
          0
        )
      );

      if (
        visible &&
        row.hingeLoss > 0
      ) {
        const width =
          barWidth *
          Math.min(
            row.hingeLoss / 2,
            1
          );

        parts.push(
          rect(
            width,
            0.075,
            [
              barLeft + width / 2,
              barY,
              0
            ],
            lc,
            0.90,
            0
          )
        );
      }
    });

    return new M.VGroup(
      ...parts
    );
  }

  function lossPanel(
    result,
    visiblePairs = [0, 1, 2],
    emphasis = -1
  ) {
    return new M.VGroup(
      ...PAIRS.map((pair, i) =>
        lossCard(
          result,
          pair,
          i,
          visiblePairs.includes(i),
          emphasis === i
        )
      )
    );
  }

  function totalLossTag(result) {
    return tag(
      `TOTAL HINGE LOSS = ${fmt(result.totalHinge)}`,

      GOLD,

      [
        CX,

        P
          ? -2.87
          : -2.10,

        0
      ],

      P ? 16 : 13
    );
  }

  function showLosses(
    result,
    visible = [0, 1, 2],
    emphasis = -1,
    total = true
  ) {
    return [
      ...swap(
        'losses',
        lossPanel(
          result,
          visible,
          emphasis
        )
      ),

      ...swap(
        'totalLoss',
        total
          ? totalLossTag(result)
          : null
      )
    ];
  }

  // ============================================================
  // ITERATION AND WEIGHT INDICATORS
  // ============================================================

  function iterationBadge(
    i,
    w
  ) {
    return tag(
      `ITERATION ${i}   |   w = ${fmt(w)}`,

      CYAN,

      [
        P ? -0.45 : CX,
        P ? 3.45 : 1.72,
        0
      ],

      P ? 17 : 15
    );
  }

  function setIteration(
    i,
    w
  ) {
    return swap(
      'iteration',
      iterationBadge(i, w)
    );
  }

  function attemptBox(
    result,
    i,
    includeObjective = false
  ) {
    return fbox([
      [
        `ITERATION ${i}: w = ${fmt(result.w)}`,
        CYAN
      ],

      [
        `total hinge loss = ${fmt(result.totalHinge)}`,
        GOLD
      ],

      [
        `width penalty = ${fmt(result.widthPenalty)}`,
        C.ink
      ],

      [
        includeObjective
          ? `objective = ${fixed(result.objective)}`
          : `half-width = ${fmt(result.halfWidth)}`,

        includeObjective ? GREEN : CYAN
      ]
    ]);
  }

  function attemptAnimations(
    result,
    i,
    visible = [0, 1, 2],
    emphasis = -1,
    showTotal = true
  ) {
    return [
      ...stripAnimations(result),

      ...setIteration(
        i,
        result.w
      ),

      ...showLosses(
        result,
        visible,
        emphasis,
        showTotal
      )
    ];
  }

  // ============================================================
  // WIDTH-PENALTY COMPARISON
  // ============================================================

  function penaltyCards() {
    const y = PAIR_Y;

    const parts = [];

    WEIGHTS.forEach((w, i) => {
      const result =
        LOW_RESULTS[i];

      const x =
        pairX(i);

      const h = PAIR_H;

      parts.push(
        rounded(
          PAIR_W,
          h,
          [x, y, 0],
          CYAN
        ),

        text(
          `ITERATION ${i + 1}`,
          P ? 15 : 12,
          CYAN,
          [x, y + h * 0.31, 0],
          true
        ),

        text(
          `w = ${fmt(w)}`,
          17,
          C.ink,
          [x, y + 0.11, 0],
          true
        ),

        text(
          `w²/2 = ${fmt(result.widthPenalty)}`,
          P ? 16 : 14,
          GOLD,
          [x, y - 0.23, 0],
          true,
          PAIR_W - 0.12
        )
      );
    });

    return new M.VGroup(
      ...parts
    );
  }

  // ============================================================
  // OBJECTIVE CURVE
  // ============================================================

  // Both objective curves use the same horizontal positions.
  // Their vertical axes have explicitly labelled scales:
  //
  // C = 0.1: 0 to 1
  // C = 1:   0 to 6.5
  //
  // This makes the smaller low-C values legible.
  // No objective from one setting is compared using the
  // other setting's axis.
  //
  // The curve records evaluated candidates only.
  // Returning to the best previous candidate does not
  // introduce a fictitious additional optimisation step.

  const CHART = P
    ? {
        x0: -3.00,
        x1: 3.20,
        y0: -6.58,
        y1: -5.88
      }
    : {
        x0: 2.66,
        x1: 6.07,
        y0: -3.20,
        y1: -1.95
      };

  const chartX = i =>
    CHART.x0 +
    0.43 +
    i / 2 * (
      CHART.x1 -
      CHART.x0 -
      0.82
    );

  let chartMax = 1;
  let chartC = LOW_C;

  const chartY = value =>
    CHART.y0 +
    value / chartMax * (
      CHART.y1 -
      CHART.y0
    );

  function objectiveAxes(
    costC,
    maximum
  ) {
    const parts = [];

    const titleX =
      (CHART.x0 + CHART.x1) / 2;

    parts.push(
      text(
        `OBJECTIVE   C = ${fmt(costC)}`,
        P ? 16 : 14,
        CYAN,
        [
          titleX,
          CHART.y1 + 0.26,
          0
        ],
        true
      ),

      line(
        [
          CHART.x0,
          CHART.y0,
          0
        ],

        [
          CHART.x1,
          CHART.y0,
          0
        ],

        C.muted,

        1.5
      ),

      line(
        [
          CHART.x0,
          CHART.y0,
          0
        ],

        [
          CHART.x0,
          CHART.y1,
          0
        ],

        C.muted,

        1.5
      )
    );

    // phone chart is short: only the end ticks, so labels never touch
    const ticks = P
      ? (maximum === 1 ? [0, 1] : [0, 6])
      : (maximum === 1 ? [0, 0.5, 1] : [0, 2, 4, 6]);

    ticks.forEach(v => {
      const y =
        CHART.y0 +
        v / maximum * (
          CHART.y1 -
          CHART.y0
        );

      parts.push(
        line(
          [CHART.x0, y, 0],
          [CHART.x1, y, 0],
          C.muted,
          0.65
        ),

        text(
          fmt(v),
          P ? 15 : 12,
          C.muted,
          [
            CHART.x0 - 0.24,
            y,
            0
          ],
          true
        )
      );
    });

    for (let i = 0; i < 3; i++) {
      parts.push(
        text(
          String(i + 1),
          P ? 15 : 12,
          C.muted,
          [
            chartX(i),
            CHART.y0 - 0.17,
            0
          ],
          true
        )
      );
    }

    parts.push(
      text(
        'Candidate iteration →',
        P ? 15 : 12,
        C.muted,
        [
          titleX,
          CHART.y0 - 0.34,
          0
        ]
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  let chartAxes = null;
  let chartHistory = [];
  let chartMarks = [];
  let chartSegments = [];

  function clearHistory() {
    const animations = [
      ...remove(chartMarks),
      ...remove(chartSegments)
    ];

    chartHistory = [];
    chartMarks = [];
    chartSegments = [];

    return animations;
  }

  function startChart(costC) {
    const animations = [
      ...clearHistory(),
      ...remove([chartAxes]),

      ...drop(
        'bestMarker',
        'bestNote'
      )
    ];

    chartC = costC;

    chartMax =
      costC === LOW_C
        ? 1
        : 6.5;

    chartAxes = objectiveAxes(
      chartC,
      chartMax
    );

    animations.push(
      new M.FadeIn(chartAxes)
    );

    return animations;
  }

  function clearChart() {
    const animations = [
      ...clearHistory(),
      ...remove([chartAxes]),

      ...drop(
        'bestMarker',
        'bestNote'
      )
    ];

    chartAxes = null;

    return animations;
  }

  function appendObjective(result) {
    const i =
      chartHistory.length;

    if (i >= 3) {
      return [];
    }

    const p = [
      chartX(i),
      chartY(result.objective),
      0
    ];

    const marker =
      new M.VGroup(
        dot(
          p,
          GOLD,
          P ? 0.072 : 0.06
        ),

        text(
          fixed(result.objective),
          P ? 16 : 14,
          GOLD,
          [
            p[0],
            p[1] + 0.19,
            0
          ],
          true
        )
      );

    const animations = [];

    if (i > 0) {
      const previous =
        chartHistory[i - 1];

      const segment = line(
        [
          chartX(i - 1),
          chartY(previous.objective),
          0
        ],

        p,

        CYAN,

        2.4
      );

      chartSegments.push(
        segment
      );

      animations.push(
        new M.Create(segment)
      );
    }

    chartHistory.push(
      result
    );

    chartMarks.push(
      marker
    );

    animations.push(
      new M.FadeIn(marker)
    );

    return animations;
  }

  function markBest(index) {
    const result =
      chartHistory[index];

    const p = [
      chartX(index),
      chartY(result.objective),
      0
    ];

    return [
      ...swap(
        'bestMarker',
        ring(
          p,
          GREEN,
          0.15
        )
      ),

      ...swap(
        'bestNote',
        P ? null : tag(
          `BEST = ${fixed(result.objective)}`,

          GREEN,

          [
            CHART.x1 - 0.60,
            CHART.y1 + 0.25,
            0
          ],

          P ? 15 : 12
        )
      )
    ];
  }

  function objectiveBox(
    result,
    iteration
  ) {
    return fbox([
      [
        `ITERATION ${iteration}: w = ${fmt(result.w)}`,
        CYAN
      ],

      [
        `width penalty = ${fmt(result.widthPenalty)}`,
        C.ink
      ],

      [
        `C × hinge = ${fmt(result.costC)} × ${fmt(result.totalHinge)}`,
        GOLD
      ],

      [
        `J = ${fmt(result.widthPenalty)} + ${fmt(result.violationPenalty)} = ${fixed(result.objective)}`,
        GREEN
      ]
    ]);
  }

  function objectiveStep(
    result,
    iteration
  ) {
    return [
      ...attemptAnimations(
        result,
        iteration
      ),

      ...appendObjective(result),

      ...objectiveBox(
        result,
        iteration
      )
    ];
  }

  // ============================================================
  // TRY IT CONTROL PREVIEWS
  // ============================================================

  // These are narrated visual representations of the
  // separate activity's controls, not clickable browser UI.

  function controlPanel(
    active = 'STEP',
    speed = 1
  ) {
    const y = P ? -4.87 : -0.95;
    const CTRL_X = P ? 0 : 4.3;

    const labels = [
      'STEP',
      'PLAY',
      'PAUSE',
      'RESET'
    ];

    const pitch = P
      ? 1.00
      : 0.93;

    const parts = labels.map(
      (s, i) => {
        const x =
          CTRL_X + (i - 1.5) * pitch;

        const color =
          s === active
            ? CYAN
            : C.muted;

        return new M.VGroup(
          rounded(
            pitch * 0.91,
            0.32,
            [x, y, 0],
            color,
            0.99
          ),

          text(
            s,
            P ? 15 : 12,
            color,
            [x, y, 0],
            true
          )
        );
      }
    );

    const sy = y - 0.38;

    const sx0 = CTRL_X - 0.82;
    const sx1 = CTRL_X + 0.82;

    const fraction =
      (speed - 0.5) / 1.5;

    const knobX =
      sx0 +
      fraction * (sx1 - sx0);

    parts.push(
      text(
        'Speed',
        P ? 15 : 13,
        C.muted,
        [sx0 - 0.47, sy, 0]
      ),

      line(
        [sx0, sy, 0],
        [sx1, sy, 0],
        C.muted,
        2.5
      ),

      dot(
        [knobX, sy, 0],
        CYAN,
        0.075
      ),

      text(
        `${fmt(speed)}×`,
        14,
        CYAN,
        [sx1 + 0.30, sy, 0],
        true
      )
    );

    return new M.VGroup(
      ...parts
    );
  }

  function setControls(
    active,
    speed = 1
  ) {
    return swap(
      'controls',
      controlPanel(
        active,
        speed
      )
    );
  }

  function cBadge(costC) {
    return tag(
      `C = ${fmt(costC)}`,

      GOLD,

      [
        P ? 2.75 : CX + 2.18,
        P ? 3.45 : 1.72,
        0
      ],

      P ? 17 : 15
    );
  }

  function setC(costC) {
    return swap(
      'C',
      cBadge(costC)
    );
  }

  // ============================================================
  // BEATS 0–2: TWO IDENTICAL MEASUREMENTS
  // ============================================================

  // 0. Two fruits look identical to the measuring tools.

  await until(S(0));

  await play(
    ...swap(
      'intro',
      introCards(false)
    ),

    ...fbox([
      ['TWO FRUITS', WHITE],
      ['same weight', CYAN],
      ['same hue and firmness', GREEN],
      ['can the sorter tell them apart?', GOLD]
    ], GOLD),

    ...say(
      'TWO FRUITS WITH IDENTICAL MEASUREMENTS',
      WHITE
    )
  );

  // 1. One is a plum and one is an apple.

  await until(S(1));

  await play(
    ...swap(
      'intro',
      introCards(true)
    ),

    ...fbox([
      ['SAME MEASUREMENTS', WHITE],
      ['one plum', PLUM],
      ['one apple', APPLE]
    ], GOLD),

    ...say(
      'SAME MEASUREMENTS, DIFFERENT LABELS',
      GOLD
    )
  );

  // 2. Could a dividing line still be useful?

  await until(S(2));

  await play(
    ...fbox([
      ['CAN WE STILL FIND', CYAN],
      ['a useful dividing line?', GOLD]
    ], GOLD),

    ...say(
      'CAN WE STILL FIND A USEFUL BOUNDARY?',
      GOLD
    )
  );

  // ============================================================
  // BEATS 3–7: ORIGINAL FOUR FRUITS
  // ============================================================

  // 3. Two original plums: 50 g and 150 g.

  await until(S(3));

  await play(
    ...drop('intro'),

    ...swap(
      'axis',
      weightAxis()
    ),

    addFruit(
      ORIGINAL_FOUR[0]
    ),

    addFruit(
      ORIGINAL_FOUR[1]
    ),

    ...fbox([
      ['TWO KNOWN PLUMS', PLUM],
      ['P1 = 50 g', PLUM],
      ['P2 = 150 g', PLUM]
    ], PLUM),

    ...say(
      'PLUMS: 50 g AND 150 g',
      PLUM
    )
  );

  // 4. Two original apples: 200 g and 300 g.

  await until(S(4));

  await play(
    addFruit(
      ORIGINAL_FOUR[2]
    ),

    addFruit(
      ORIGINAL_FOUR[3]
    ),

    ...fbox([
      ['TWO KNOWN APPLES', APPLE],
      ['A1 = 200 g', APPLE],
      ['A3 = 300 g', APPLE]
    ], APPLE),

    ...say(
      'APPLES: 200 g AND 300 g',
      APPLE
    )
  );

  // 5. Use only weight.

  await until(S(5));

  await play(
    new M.Indicate(
      slots.get('axis'),
      { color: CYAN }
    ),

    ...fbox([
      ['ONE-DIMENSIONAL DRAWING', CYAN],
      ['use only weight', C.ink],
      ['1 grid unit = 50 grams', GOLD]
    ]),

    ...say(
      'THIS TIME: WEIGHT ONLY'
    )
  );

  // 6. Draw the line at 175 g.

  await until(S(6));

  await play(
    ...swap(
      'boundary',
      boundary()
    ),

    ...fbox([
      ['DIVIDING LINE', GOLD],
      ['weight = 175 grams', C.ink],
      ['x = 3.5 grid units', CYAN]
    ], GOLD),

    ...say(
      'DIVIDING LINE = 175 g',
      GOLD
    )
  );

  // 7. The original four examples are separated.

  await until(S(7));

  await play(
    ...swap(
      'regions',
      decisionRegions()
    ),

    ...fbox([
      ['LEFT OF THE LINE', PLUM],
      ['both original plums', PLUM],
      ['RIGHT OF THE LINE', APPLE],
      ['both original apples', APPLE]
    ]),

    ...say(
      'SO FAR: ALL FOUR FRUITS ARE SEPARATED',
      GREEN
    )
  );

  // ============================================================
  // BEATS 8–10: ADD THE TWO OVERLAPPING FRUITS
  // ============================================================

  // 8. Add one plum and one apple weighing 175 g.

  await until(S(8));

  await play(
    addFruit(EXTRA[0]),
    addFruit(EXTRA[1]),

    ...fbox([
      ['TWO ADDITIONAL FRUITS', CYAN],
      ['P5 = 175 g', PLUM],
      ['A5 = 175 g', APPLE],
      ['both hue 3, firmness 3', C.muted]
    ]),

    ...say(
      'ADD TWO FRUITS AT 175 g'
    )
  );

  // 9. Both fruits occupy the same measurement position.

  await until(S(9));

  await play(
    ...swap(
      'overlap',
      overlapHighlight()
    ),

    ...fbox([
      ['IDENTICAL WEIGHT COORDINATE', GOLD],
      ['plum x = 3.5', PLUM],
      ['apple x = 3.5', APPLE],
      ['stacked only for visibility', C.muted]
    ], GOLD),

    ...say(
      'BOTH FRUITS HAVE EXACTLY THE SAME x',
      GOLD
    )
  );

  // 10. Moving the line cannot separate the identical points.

  await until(S(10));

  await play(
    ...drop('overlap'),

    ...swap(
      'boundary',
      boundary(3.2)
    ),

    ...swap(
      'regions',
      decisionRegions(3.2)
    ),

    ...fbox([
      ['MOVE THE LINE LEFT', GOLD],
      ['both overlapping fruits', C.ink],
      ['are now on the apple side', APPLE]
    ], GOLD),

    ...say(
      'MOVING THE LINE CANNOT SEPARATE THEM',
      GOLD
    )
  );

  await play(
    ...swap(
      'boundary',
      boundary(3.8)
    ),

    ...swap(
      'regions',
      decisionRegions(3.8)
    ),

    ...fbox([
      ['MOVE THE LINE RIGHT', GOLD],
      ['both overlapping fruits', C.ink],
      ['are now on the plum side', PLUM]
    ], GOLD)
  );

  await play(
    ...swap(
      'boundary',
      boundary()
    ),

    ...swap(
      'regions',
      decisionRegions()
    )
  );

  // ============================================================
  // BEATS 11–14: SOFT MARGINS
  // ============================================================

  // 11. Imagine a path allowed to contain fruits.

  await until(S(11));

  await play(
    ...stripAnimations(I2),

    ...fbox([
      ['A DIFFERENT KIND OF PATH', CYAN],
      ['the strip may contain', C.ink],
      ['some known fruits', GOLD]
    ]),

    ...say(
      'ALLOW SOME FRUITS INSIDE THE STRIP'
    )
  );

  // 12. Give fruits inside the required margin a cost.

  await until(S(12));

  await play(
    highlightIds([
      'P2',
      'A1',
      'P5',
      'A5'
    ]),

    ...fbox([
      ['MARGIN VIOLATIONS', GOLD],
      ['fruits inside the strip', C.ink],
      ['receive a positive cost', GOLD]
    ], GOLD),

    ...say(
      'FRUITS INSIDE THE MARGIN RECEIVE A COST',
      GOLD
    )
  );

  // 13. Wrong-side examples receive a greater cost.
  //
  // Show a temporary shifted reference line.
  // This is a conceptual illustration only.
  // All numerical candidate searches retain x = 3.5.

  const WRONG_SIDE_EXAMPLE = evaluate(
    0.4,
    LOW_C,
    DATA,
    3.8
  );

  const wrongApple =
    WRONG_SIDE_EXAMPLE.rows.find(
      d => d.id === 'A5'
    );

  await until(S(13));

  await play(
    ...clearStrip(),

    ...drop(
      'width',
      'regions'
    ),

    ...swap(
      'boundary',
      boundary(3.8)
    ),

    highlightIds(
      ['A5'],
      RED
    ),

    ...fbox([
      ['WRONG SIDE OF THE LINE', RED],
      ['this apple is on the plum side', APPLE],
      ['its hinge loss exceeds 1', RED]
    ], RED),

    ...say(
      'WRONG-SIDE FRUITS COST EVEN MORE',
      RED
    )
  );

  await play(
    ...stripAnimations(I2)
  );

  // 14. Name the soft-margin support vector machine.

  await until(S(14));

  await play(
    ...fbox([
      ['SOFT-MARGIN SVM', CYAN],
      ['allow margin violations', GOLD],
      ['but attach a cost to them', C.ink]
    ], GOLD),

    ...say(
      'SOFT-MARGIN SUPPORT VECTOR MACHINE'
    )
  );

  // ============================================================
  // BEATS 15–17: WEIGHT CONTROLS THE STRIP WIDTH
  // ============================================================

  // 15. Keep the line fixed at 175 g.

  await until(S(15));

  await play(
    new M.Indicate(
      slots.get('boundary'),
      { color: GOLD }
    ),

    ...fbox([
      ['KEEP THE LINE FIXED', GOLD],
      ['centre = 175 grams', C.ink],
      ['change the strip width', CYAN]
    ]),

    ...say(
      'FIX THE CENTRE, CHANGE THE WIDTH'
    )
  );

  // 16. The classifier weight controls strip width.

  await until(S(16));

  await play(
    ...swap(
      'bracket',
      widthBracket(I2)
    ),

    ...fbox([
      ['THE NUMBER w', CYAN],
      ['not a fruit weight in grams', C.muted],
      ['half-width = 1/w', GOLD],
      ['(for w above 0)', C.ink]
    ]),

    ...say(
      'w CONTROLS THE STRIP WIDTH'
    )
  );

  // 17. Larger weight means narrower strip.
  // Smaller positive weight means wider strip.

  await until(S(17));

  await play(
    ...stripAnimations(I3),

    ...swap(
      'bracket',
      widthBracket(I3)
    ),

    ...fbox([
      ['LARGER w', GOLD],
      ['w = 1', C.ink],
      ['half-width = 1 unit', CYAN],
      ['narrower strip', GOLD]
    ]),

    ...say(
      'LARGER w → NARROWER STRIP',
      GOLD
    )
  );

  await play(
    ...stripAnimations(I2),

    ...swap(
      'bracket',
      widthBracket(I2)
    ),

    ...fbox([
      ['SMALLER POSITIVE w', CYAN],
      ['w = 0.4', C.ink],
      ['half-width = 2.5 units', CYAN],
      ['wider strip', GREEN]
    ], GREEN),

    ...say(
      'SMALLER POSITIVE w → WIDER STRIP',
      GREEN
    )
  );

  // ============================================================
  // BEATS 18–22: SIGNED MARGIN AND HINGE LOSS
  // ============================================================

  // 18. Multiply distance from the line by weight.

  await until(S(18));

  await play(
    ...drop('bracket'),

    ...swap(
      'distance',
      pairDistanceGuides(
        ['P2', 'A1']
      )
    ),

    ...fbox([
      ['MEASURE THE INNER FRUITS', CYAN],
      ['distance = 0.5 grid units', C.ink],
      ['w = 0.4', C.ink],
      ['0.5 × 0.4 = 0.2', GOLD]
    ], GOLD),

    ...say(
      'DISTANCE FROM LINE × w'
    )
  );

  // 19. Positive on the correct side.
  // Negative on the wrong side.
  //
  // Use a temporary shifted line to illustrate
  // a negative signed margin.

  await until(S(19));

  await play(
    ...drop('distance'),

    ...clearStrip(),

    ...drop(
      'regions',
      'width'
    ),

    ...swap(
      'boundary',
      boundary(3.8)
    ),

    highlightIds(
      ['A5'],
      RED
    ),

    ...fbox([
      ['SIGNED RESULT', CYAN],
      ['correct side → positive', GREEN],
      ['wrong side → negative', RED],
      ['on the line → zero', GOLD]
    ]),

    ...say(
      'CORRECT SIDE: +    WRONG SIDE: −'
    )
  );

  await play(
    ...stripAnimations(I2)
  );

  // 20. Signed margin must reach at least one.

  await until(S(20));

  await play(
    ...showLosses(
      I2,
      [1],
      1,
      false
    ),

    ...fbox([
      ['SIGNED MARGIN m', CYAN],
      ['distance × w, with a sign', C.ink],
      ['required margin: m ≥ 1', GREEN],
      ['inner fruits: m = 0.2', GOLD]
    ]),

    ...say(
      'SIGNED MARGIN: AIM FOR AT LEAST 1'
    )
  );

  // 21. Subtract the signed margin from one,
  // but do not allow negative hinge loss.

  await until(S(21));

  await play(
    ...fbox([
      ['COST OF FALLING SHORT', GOLD],
      ['1 − signed margin', C.ink],
      ['if negative, use zero', C.ink],
      ['inner fruit: 1 − 0.2 = 0.8', GOLD]
    ], GOLD),

    ...say(
      'SUBTRACT THE SIGNED MARGIN FROM 1'
    )
  );

  // 22. Name hinge loss.

  await until(S(22));

  await play(
    ...fbox([
      ['HINGE LOSS', CYAN],
      ['h = max(0, 1 − m)', GOLD],
      ['m ≥ 1 → no loss', GREEN],
      ['m < 1 → positive loss', GOLD]
    ]),

    ...say(
      'HINGE LOSS = HOW MUCH THE MARGIN FALLS SHORT',
      GOLD
    )
  );

  // ============================================================
  // BEATS 23–25: ITERATION 1, w = 0
  // ============================================================

  // 23. First attempt: weight zero.

  await until(S(23));

  await play(
    ...attemptAnimations(
      I1,
      1,
      [],
      -1,
      false
    ),

    ...fbox([
      ['ITERATION 1', CYAN],
      ['w = 0', GOLD],
      ['all classification scores = 0', C.ink],
      ['no distinction between sides', C.muted]
    ], GOLD),

    ...say(
      'ITERATION 1: SET w = 0'
    )
  );

  // 24. Every signed margin = 0.
  // Every hinge loss = 1.

  await until(S(24));

  await play(
    ...showLosses(
      I1,
      [0, 1, 2],
      -1,
      false
    ),

    ...fbox([
      ['EVERY FRUIT', CYAN],
      ['signed margin = 0', C.ink],
      ['hinge loss = max(0, 1 − 0)', C.ink],
      ['hinge loss = 1', GOLD]
    ], GOLD),

    ...say(
      'ALL SIX FRUITS HAVE HINGE LOSS 1',
      GOLD
    )
  );

  // 25. Total hinge loss = six.

  await until(S(25));

  await play(
    ...swap(
      'totalLoss',
      totalLossTag(I1)
    ),

    ...fbox([
      ['TOTAL HINGE LOSS', GOLD],
      ['1 + 1 + 1 + 1 + 1 + 1', C.ink],
      ['= 6', GOLD]
    ], GOLD),

    ...say(
      'ITERATION 1: TOTAL HINGE LOSS = 6',
      GOLD
    )
  );

  // ============================================================
  // BEATS 26–32: ITERATION 2, w = 0.4
  // ============================================================

  // 26. Increase weight by 0.4.

  await until(S(26));

  await play(
    ...attemptAnimations(
      I2,
      2,
      [],
      -1,
      false
    ),

    ...fbox([
      ['ITERATION 2', CYAN],
      ['old w = 0', C.muted],
      ['change = +0.4', GOLD],
      ['new w = 0.4', CYAN]
    ]),

    ...say(
      'ITERATION 2: INCREASE w TO 0.4'
    )
  );

  // 27. Outer fruits are 2.5 grid units away.

  await until(S(27));

  await play(
    ...swap(
      'distance',
      pairDistanceGuides(
        ['P1', 'A3']
      )
    ),

    highlightIds(
      ['P1', 'A3'],
      CYAN
    ),

    ...fbox([
      ['OUTER FRUITS', CYAN],
      ['P1: |1 − 3.5| = 2.5', PLUM],
      ['A3: |6 − 3.5| = 2.5', APPLE],
      ['distance = 2.5 each', GOLD]
    ]),

    ...say(
      'OUTER FRUITS: DISTANCE = 2.5'
    )
  );

  // 28. 2.5 × 0.4 = 1.
  // Hinge loss is zero for both.

  await until(S(28));

  await play(
    ...showLosses(
      I2,
      [0],
      0,
      false
    ),

    ...fbox([
      ['OUTER FRUITS', CYAN],
      ['signed margin = 2.5 × 0.4', C.ink],
      ['= 1', GREEN],
      ['hinge loss = 1 − 1 = 0', GREEN]
    ], GREEN),

    ...say(
      'OUTER FRUITS: NO HINGE LOSS',
      GREEN
    )
  );

  // 29. Inner fruits are half a grid space away.

  await until(S(29));

  await play(
    ...swap(
      'distance',
      pairDistanceGuides(
        ['P2', 'A1']
      )
    ),

    highlightIds([
      'P2',
      'A1'
    ]),

    ...fbox([
      ['INNER FRUITS', CYAN],
      ['P2: |3 − 3.5| = 0.5', PLUM],
      ['A1: |4 − 3.5| = 0.5', APPLE],
      ['distance = 0.5 each', GOLD]
    ]),

    ...say(
      'INNER FRUITS: DISTANCE = 0.5'
    )
  );

  // 30. 0.5 × 0.4 = 0.2.
  // Hinge loss = 0.8 each.

  await until(S(30));

  await play(
    ...showLosses(
      I2,
      [0, 1],
      1,
      false
    ),

    ...fbox([
      ['INNER FRUITS', CYAN],
      ['signed margin = 0.5 × 0.4', C.ink],
      ['= 0.2', C.ink],
      ['hinge loss = 1 − 0.2 = 0.8', GOLD]
    ], GOLD),

    ...say(
      'INNER FRUITS: HINGE LOSS = 0.8 EACH',
      GOLD
    )
  );

  // 31. Both overlapping fruits remain on the line.

  await until(S(31));

  await play(
    ...drop('distance'),

    ...swap(
      'overlap',
      overlapHighlight()
    ),

    ...showLosses(
      I2,
      [0, 1, 2],
      2,
      false
    ),

    ...fbox([
      ['OVERLAPPING FRUITS', GOLD],
      ['distance = 0', C.ink],
      ['signed margin = 0 × 0.4 = 0', C.ink],
      ['hinge loss = 1 each', GOLD]
    ], GOLD),

    ...say(
      'OVERLAPPING FRUITS STILL COST 1 EACH',
      GOLD
    )
  );

  // 32. Total hinge loss = 3.6.

  await until(S(32));

  await play(
    ...drop('overlap'),

    ...showLosses(I2),

    ...fbox([
      ['TOTAL HINGE LOSS', GOLD],
      ['outer: 0 + 0', GREEN],
      ['inner: 0.8 + 0.8', GOLD],
      ['overlap: 1 + 1 → total 3.6', GOLD]
    ], GOLD),

    ...say(
      'ITERATION 2: TOTAL HINGE LOSS = 3.6',
      GOLD
    )
  );

  // ============================================================
  // BEATS 33–36: ITERATION 3, w = 1
  // ============================================================

  // 33. Increase w by 0.6, bringing it to one.

  await until(S(33));

  await play(
    ...attemptAnimations(
      I3,
      3,
      [],
      -1,
      false
    ),

    ...fbox([
      ['ITERATION 3', CYAN],
      ['old w = 0.4', C.muted],
      ['change = +0.6', GOLD],
      ['new w = 1', CYAN]
    ]),

    ...say(
      'ITERATION 3: INCREASE w TO 1'
    )
  );

  // 34. Outer fruits still have zero loss.

  await until(S(34));

  await play(
    ...showLosses(
      I3,
      [0],
      0,
      false
    ),

    highlightIds(
      ['P1', 'A3'],
      GREEN
    ),

    ...fbox([
      ['OUTER FRUITS', CYAN],
      ['signed margin = 2.5 × 1 = 2.5', C.ink],
      ['max(0, 1 − 2.5)', C.ink],
      ['hinge loss = 0', GREEN]
    ], GREEN),

    ...say(
      'OUTER FRUITS STILL HAVE ZERO LOSS',
      GREEN
    )
  );

  // 35. Inner fruits now have loss 0.5 each.

  await until(S(35));

  await play(
    ...showLosses(
      I3,
      [0, 1],
      1,
      false
    ),

    highlightIds([
      'P2',
      'A1'
    ]),

    ...fbox([
      ['INNER FRUITS', CYAN],
      ['signed margin = 0.5 × 1 = 0.5', C.ink],
      ['hinge loss = 1 − 0.5', C.ink],
      ['= 0.5 each', GOLD]
    ], GOLD),

    ...say(
      'INNER FRUITS: HINGE LOSS FALLS TO 0.5',
      GOLD
    )
  );

  // 36. Overlapping losses remain one each.
  // Total hinge loss is three.

  await until(S(36));

  await play(
    ...showLosses(
      I3,
      [0, 1, 2],
      2,
      true
    ),

    highlightIds([
      'P5',
      'A5'
    ]),

    ...fbox([
      ['OVERLAPPING FRUITS: 1 EACH', GOLD],
      ['outer: 0 + 0', GREEN],
      ['inner: 0.5 + 0.5', GOLD],
      ['overlap: 1 + 1 → total 3', GOLD]
    ], GOLD),

    ...say(
      'ITERATION 3: TOTAL HINGE LOSS = 3',
      GOLD
    )
  );

  // ============================================================
  // BEATS 37–39: WIDTH PENALTY
  // ============================================================

  // 37. Narrowing the strip also has a cost.

  await until(S(37));

  await play(
    ...swap(
      'bracket',
      widthBracket(I3)
    ),

    ...fbox([
      ['ANOTHER COST', CYAN],
      ['larger w narrows the strip', C.ink],
      ['the width penalty increases', GOLD]
    ], GOLD),

    ...say(
      'NARROWER STRIPS ALSO HAVE A COST',
      GOLD
    )
  );

  // 38. Width penalty = weight squared divided by two.

  await until(S(38));

  await play(
    ...fbox([
      ['WIDTH PENALTY', CYAN],
      ['R = w² / 2', GOLD],
      ['larger w → larger penalty', C.ink],
      ['w = 1 gives R = 0.5', GOLD]
    ], GOLD),

    ...say(
      'WIDTH PENALTY = w² ÷ 2'
    )
  );

  // 39. Compare width penalties 0, 0.08 and 0.5.

  await until(S(39));

  await play(
    ...drop(
      'bracket',
      'losses',
      'totalLoss'
    ),

    ...swap(
      'penalties',
      penaltyCards()
    ),

    ...fbox([
      ['THREE WIDTH PENALTIES', CYAN],
      ['0²/2 = 0', C.ink],
      ['0.4²/2 = 0.08', GOLD],
      ['1²/2 = 0.5', GOLD]
    ]),

    ...say(
      'WIDTH PENALTIES: 0, 0.08, 0.5'
    )
  );

  // ============================================================
  // BEATS 40–41: INTRODUCE C AND THE OBJECTIVE
  // ============================================================

  // 40. C controls how expensive margin violations are.

  await until(S(40));

  await play(
    ...setC(LOW_C),

    ...fbox([
      ['SETTING C', GOLD],
      ['cost per unit of hinge loss', C.ink],
      ['smaller C: cheaper violations', CYAN],
      ['larger C: dearer violations', RED]
    ], GOLD),

    ...say(
      'C CONTROLS THE COST OF VIOLATIONS',
      GOLD
    )
  );

  // 41. Objective = width penalty + C × total hinge loss.

  await until(S(41));

  await play(
    ...fbox([
      ['SOFT-MARGIN OBJECTIVE', CYAN],
      ['J = width penalty', C.ink],
      ['  + C × total hinge loss', GOLD],
      ['minimise J', GREEN]
    ]),

    ...say(
      'OBJECTIVE = WIDTH COST + VIOLATION COST'
    )
  );

  await play(
    ...fbox([
      ['J = w²/2 + C × Σ hinge loss', GOLD],
      ['first term: prefer a wide strip', CYAN],
      ['second term: discourage violations', C.ink]
    ], GOLD)
  );

  // ============================================================
  // BEATS 42–43: LOW C SEARCH
  // ============================================================

  // 42. With C = 0.1, the objectives are:
  //
  // 0 + 0.1 × 6 = 0.60
  // 0.08 + 0.1 × 3.6 = 0.44
  // 0.5 + 0.1 × 3 = 0.80
  //
  // Grow the objective curve one candidate at a time.

  await until(S(42));

  await play(
    ...drop('penalties'),

    ...startChart(LOW_C),

    ...objectiveStep(
      LOW_RESULTS[0],
      1
    ),

    ...say(
      'C = 0.1: COMPARE THREE OBJECTIVES',
      GOLD
    )
  );

  await until(S(42) + 2.2);

  await play(
    ...objectiveStep(
      LOW_RESULTS[1],
      2
    )
  );

  await until(S(42) + 4.7);

  await play(
    ...objectiveStep(
      LOW_RESULTS[2],
      3
    )
  );

  // 43. The best low-C result is 0.44 at w = 0.4.
  //
  // Restore the winning candidate, not the last candidate.
  // Keep all three evaluated objectives on the curve.

  await until(S(43));

  await play(
    ...attemptAnimations(
      LOW_BEST,
      2
    ),

    ...markBest(1),

    ...fbox([
      ['C = 0.1: BEST CANDIDATE', GREEN],
      ['objectives: 0.60, 0.44, 0.80', C.ink],
      ['keep w = 0.4', GOLD],
      ['wider strip wins: J = 0.44', GREEN]
    ], GREEN),

    ...say(
      'LOW C: KEEP THE WIDER STRIP',
      GREEN
    )
  );

  // ============================================================
  // BEATS 44–45: HIGH C SEARCH
  // ============================================================

  // 44. With C = 1:
  //
  // 0 + 1 × 6 = 6
  // 0.08 + 1 × 3.6 = 3.68
  // 0.5 + 1 × 3 = 3.50
  //
  // Explicitly reset the objective axis for the new scale.

  await until(S(44));

  await play(
    ...setC(HIGH_C),

    ...startChart(HIGH_C),

    ...objectiveStep(
      HIGH_RESULTS[0],
      1
    ),

    ...say(
      'C = 1: VIOLATIONS BECOME MORE EXPENSIVE',
      GOLD
    )
  );

  await until(S(44) + 2.0);

  await play(
    ...objectiveStep(
      HIGH_RESULTS[1],
      2
    )
  );

  await until(S(44) + 4.0);

  await play(
    ...objectiveStep(
      HIGH_RESULTS[2],
      3
    )
  );

  // 45. The best high-C result is 3.50 at w = 1.

  await until(S(45));

  await play(
    ...markBest(2),

    ...fbox([
      ['C = 1: BEST CANDIDATE', GREEN],
      ['objectives: 6, 3.68, 3.50', C.ink],
      ['keep w = 1', GOLD],
      ['narrower strip wins: J = 3.50', GREEN]
    ], GREEN),

    ...say(
      'HIGHER C: KEEP THE NARROWER STRIP',
      GREEN
    )
  );

  // ============================================================
  // BEATS 46–48: MEANING AND LIMITATIONS
  // ============================================================

  // 46. These attempts illustrate the objective.
  // They are not a reproduction of the full training method.

  await until(S(46));

  await play(
    ...fbox([
      ['OUR THREE CANDIDATES', CYAN],
      ['illustrate how the cost is compared', C.ink],
      ['real SVMs optimise the parameters', C.ink],
      ['using mathematical search methods', GOLD]
    ]),

    ...say(
      'ILLUSTRATIVE SEARCH, NOT A FULL SVM SOLVER'
    )
  );

  // 47. Soft margins are useful for overlapping groups.

  await until(S(47));

  await play(
    ...swap(
      'overlap',
      overlapHighlight()
    ),

    ...fbox([
      ['REAL GROUPS CAN OVERLAP', GOLD],
      ['perfect separation may be impossible', C.ink],
      ['still learn a useful boundary', CYAN],
      ['balance width against violations', GREEN]
    ], GREEN),

    ...say(
      'SOFT MARGINS ALLOW OVERLAPPING GROUPS',
      GREEN
    )
  );

  // 48. Even a very large C cannot distinguish
  // the two identical measurement vectors.

  const VERY_HIGH_C_RESULT =
    evaluate(
      1,
      100
    );

  await until(S(48));

  await play(
    ...clearChart(),

    ...setC(100),

    highlightIds(
      ['P5', 'A5'],
      RED
    ),

    ...fbox([
      ['EVEN WITH C = 100', GOLD],
      ['both fruits still have x = 3.5', C.ink],
      ['both scores remain zero', C.ink],
      ['both hinge losses remain 1', RED]
    ], RED),

    ...say(
      'A LARGE C CANNOT RESOLVE IDENTICAL MEASUREMENTS',
      GOLD
    )
  );

  // The contribution from the overlapping pair alone is
  // C × (1 + 1), regardless of w at this fixed centre.

  await play(
    ...fbox([
      ['IDENTICAL INPUTS', GOLD],
      ['same score for different labels', C.ink],
      ['changing w cannot separate them', C.ink],
      ['more cost does not add information', RED]
    ], RED)
  );

  // ============================================================
  // BEAT 49: TRY IT — STEP, PLAY, PAUSE AND SPEED
  // ============================================================

  // 49. Preview Step, Play, Pause and the growing curve.

  await until(S(49));

  await play(
    ...drop('overlap'),

    ...setC(LOW_C),

    ...startChart(LOW_C),

    ...objectiveStep(
      LOW_RESULTS[0],
      1
    ),

    ...setControls(
      'STEP',
      1
    ),

    ...say(
      'TRY IT: STEP, PLAY, PAUSE AND SPEED',
      GREEN
    )
  );

  await play(
    ...objectiveStep(
      LOW_RESULTS[1],
      2
    ),

    ...setControls(
      'PLAY',
      1
    )
  );

  await play(
    ...setControls(
      'PAUSE',
      1
    ),

    ...fbox([
      ['PAUSED AT ITERATION 2', CYAN],
      ['w = 0.4', C.ink],
      ['objective = 0.44', GREEN]
    ], GREEN)
  );

  await play(
    ...setControls(
      'PLAY',
      2
    ),

    ...objectiveStep(
      LOW_RESULTS[2],
      3
    )
  );

  // ============================================================
  // BEATS 50–51: RESET AND REACH THE LOW-C TARGET
  // ============================================================

  // 50. Reset, choose C = 0.1, and predict the winning strip.
  //
  // Reset restores all six exact original teaching fruits.

  await until(S(50));

  await play(
    ...replaceFruits(DATA),

    ...setControls(
      'RESET',
      1
    ),

    ...setC(LOW_C),

    ...startChart(LOW_C),

    ...attemptAnimations(
      I1,
      1
    ),

    ...appendObjective(I1),

    ...fbox([
      ['RESET: ORIGINAL SIX FRUITS', CYAN],
      ['starting w = 0', C.ink],
      ['C = 0.1', GOLD],
      ['predict which strip will win', GREEN]
    ], GREEN),

    ...say(
      'TRY IT: RESET, SET C = 0.1, PREDICT',
      GREEN
    )
  );

  // 51. Adjust w to reach an objective of 0.44.
  //
  // Moving directly from w = 0 to w = 0.4 reaches
  // the optimum in one move in this controlled example.

  await until(S(51));

  await play(
    ...fbox([
      ['TARGET OBJECTIVE = 0.44', GREEN],
      ['current w = 0', C.ink],
      ['try increasing w by 0.4', GOLD]
    ], GREEN),

    ...setControls(
      'STEP',
      1
    ),

    ...say(
      'TRY IT: REACH OBJECTIVE 0.44',
      GREEN
    )
  );

  await until(S(51) + 2.3);

  await play(
    ...objectiveStep(
      LOW_BEST,
      2
    ),

    ...markBest(1)
  );

  await play(
    ...fbox([
      ['TARGET REACHED', GREEN],
      ['w = 0.4', CYAN],
      ['0.08 + 0.1 × 3.6 = 0.44', GOLD],
      ['one move from the start', GREEN]
    ], GREEN)
  );

  // ============================================================
  // BEAT 52: INCREASE C AND CHECK THE WINNER
  // ============================================================

  // 52. With C = 1, the narrower strip is preferred.
  //
  // Compare the two relevant candidate objectives:
  // w = 0.4 gives 3.68
  // w = 1 gives 3.50

  await until(S(52));

  await play(
    ...setC(HIGH_C),

    ...startChart(HIGH_C),

    ...objectiveStep(
      HIGH_RESULTS[1],
      1
    ),

    ...say(
      'TRY IT: INCREASE C TO 1',
      GREEN
    )
  );

  await play(
    ...objectiveStep(
      HIGH_RESULTS[2],
      2
    ),

    ...markBest(1)
  );

  await play(
    ...fbox([
      ['C = 1', GOLD],
      ['w = 0.4 → objective 3.68', C.ink],
      ['w = 1 → objective 3.50', GREEN],
      ['the narrower strip wins', GREEN]
    ], GREEN)
  );

  // ============================================================
  // BEAT 53: NEW DATA — DIFFERENT OVERLAPPING GROUPS
  // ============================================================

  // Fresh hypothetical exercise example:
  //
  // Plums:  75 g, 200 g, 175 g
  // Apples: 150 g, 275 g, 175 g
  //
  // The two identical measurements remain at 175 g.
  //
  // This also introduces crossed examples:
  // the 200 g plum lies on the apple side,
  // and the 150 g apple lies on the plum side.
  //
  // These are new exercise examples only.
  // DATA is never mutated.

  const FRESH_DATA = [
    {
      ...DATA[0],
      weight: 75
    },

    {
      ...DATA[1],
      weight: 200
    },

    {
      ...DATA[2],
      weight: 150
    },

    {
      ...DATA[3],
      weight: 275
    },

    {
      ...DATA[4]
    },

    {
      ...DATA[5]
    }
  ];

  const FRESH_RESULT = evaluate(
    1,
    HIGH_C,
    FRESH_DATA
  );

  function freshErrorMarkers() {
    const parts = [];

    for (const row of FRESH_RESULT.rows) {
      if (
        row.predicted !== 'tie' &&
        !row.correct
      ) {
        parts.push(
          ring(
            fruitPosition(row),
            RED,
            FR * 1.7
          )
        );
      }
    }

    return new M.VGroup(
      ...parts
    );
  }

  await until(S(53));

  await play(
    ...clearChart(),

    ...drop(
      'controls',
      'iteration'
    ),

    ...replaceFruits(
      FRESH_DATA
    ),

    ...stripAnimations(
      FRESH_RESULT
    ),

    ...showLosses(
      FRESH_RESULT
    ),

    ...swap(
      'errors',
      freshErrorMarkers()
    ),

    ...fbox([
      ['NEW DATA: OVERLAPPING GROUPS', CYAN],
      ['some fruits are on the wrong side', RED],
      ['two still share the same weight', GOLD],
      ['can every label be correct?', C.ink]
    ], GOLD),

    ...say(
      'TRY IT: EXPLORE FRESH OVERLAPPING GROUPS',
      GREEN
    )
  );

  await play(
    ...fbox([
      ['WRONG-SIDE EXAMPLES', RED],
      ['P2: signed margin = −0.5', PLUM],
      ['A1: signed margin = −0.5', APPLE],
      ['hinge loss = 1.5 each', RED]
    ], RED)
  );

  await play(
    highlightIds(
      ['P5', 'A5'],
      GOLD
    ),

    ...fbox([
      ['IDENTICAL MEASUREMENTS REMAIN', GOLD],
      ['one plum and one apple at 175 g', C.ink],
      ['no weight-only boundary', C.ink],
      ['can classify both correctly', RED]
    ], RED)
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE EXACT ORIGINAL EXAMPLE
  // ============================================================

  // Restore the original six fruits.
  //
  // Compare the preferred strip for each cost setting:
  //
  // C = 0.1:
  // w = 0.4
  // full strip width = 5 grid units = 250 g
  // hinge loss = 3.6
  // objective = 0.44
  //
  // C = 1:
  // w = 1
  // full strip width = 2 grid units = 100 g
  // hinge loss = 3
  // objective = 3.50

  await until(S(54));

  await play(
    ...drop('errors'),

    ...replaceFruits(DATA),

    ...setC(LOW_C),

    ...stripAnimations(
      LOW_BEST
    ),

    ...showLosses(
      LOW_BEST
    ),

    ...fbox([
      ['SMALLER C = 0.1', CYAN],
      ['w = 0.4: wider strip', CYAN],
      ['accept more margin violations', GOLD],
      ['best objective = 0.44', GREEN]
    ], GREEN),

    ...say(
      'SOFT MARGIN: BALANCE TWO COSTS'
    )
  );

  await play(
    ...setC(HIGH_C),

    ...stripAnimations(
      HIGH_BEST
    ),

    ...showLosses(
      HIGH_BEST
    ),

    ...fbox([
      ['LARGER C = 1', GOLD],
      ['w = 1: narrower strip', CYAN],
      ['make violations more expensive', GOLD],
      ['best objective = 3.50', GREEN]
    ], GREEN),

    ...say(
      'C CHANGES THE PREFERRED TRADE-OFF',
      GOLD
    )
  );

  await play(
    ...fbox([
      ['SOFT-MARGIN SVM', CYAN],
      ['J = w²/2 + C × hinge loss', GOLD],
      ['wide strip', CYAN],
      ['few margin violations', GREEN]
    ], GREEN),

    ...say(
      'BALANCE A WIDE STRIP AGAINST MARGIN VIOLATIONS',
      GREEN
    )
  );
}

// lesson 9.2.5
// Chain rule — live manim-web lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter example: apartment rent, prediction, miss and squared miss.
// Uses the drawing and animation API from the approved reference.
// Browser rendering and playback have not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // ------------------------------------------------------------

  const STEPS = [-1, 0, 1];
  const RENTS = [9, 11, 13];
  const AREAS = [40, 50, 60];
  const NAMES = ['SMALL', 'MIDDLE', 'LARGE'];

  const GOLD = C.amber;
  const PINK = C.pink || '#F472B6';

  const COLORS = [
    C.cyan,
    C.ink,
    PINK
  ];

  const START_S = 0;
  const START_M = 10;

  const predict = (s, m, x) =>
    m + s * x;

  const miss = (s, m, k) =>
    predict(s, m, STEPS[k]) - RENTS[k];

  const squaredMiss = (s, m, k) =>
    miss(s, m, k) ** 2;

  const loss = (s, m) =>
    3 * (m - 11) ** 2 +
    2 * (s - 2) ** 2;

  // Chain rates:
  //
  // step price → guess       = size step
  // guess → miss             = 1
  // miss → squared miss      = 2 × miss
  //
  // The rate through one apartment is the product.

  function chainRates(k, s = 0, m = 10) {
    return [
      STEPS[k],
      1,
      2 * miss(s, m, k)
    ];
  }

  function chainProduct(k, s = 0, m = 10) {
    return chainRates(k, s, m)
      .reduce((a, b) => a * b, 1);
  }

  // Small apartment:  −1 × 1 × 2  = −2.
  // Middle apartment:  0 × 1 × −2 =  0.
  // Large apartment:  +1 × 1 × −6 = −6.
  //
  // Total step-price partial derivative = −8.
  //
  // For middle rent, the first link is 1 for every apartment.
  // Total middle-rent partial derivative = 2 − 2 − 6 = −6.

  const fmt = (n, places = 4) =>
    String(Number(n.toFixed(places)))
      .replace('-', '−');

  const signed = (n, places = 4) =>
    n > 0
      ? `+${fmt(n, places)}`
      : fmt(n, places);

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  // Phone: 8 × 14.22.
  // Keep content between y = −5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Keep content between y = −3.0 and 2.3.

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.15, 0]
    : [CX, 1.93, 0];

  const BOXP = P
    ? [0, 3.35, 0]
    : [4.25, -0.25, 0];

  const BOX_MAX = P
    ? FW - 1.2
    : 4.15;

  const GX0 = CX - 2.65;
  const GX1 = CX + 2.65;

  const GY0 = P ? -4.0 : -2.20;
  const GY1 = P ? 1.15 : 1.10;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // DRAWING HELPERS
  // ------------------------------------------------------------

  function txt(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function line(
    a,
    b,
    color = C.muted,
    width = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dash(
    a,
    b,
    color = C.muted,
    width = 2
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(
    w,
    h,
    p,
    color,
    opacity = 0,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(
    w,
    h,
    p,
    color,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function circle(
    p,
    radius,
    color,
    opacity = 0,
    width = 2
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: width
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function dot(
    p,
    color = C.cyan,
    radius = 0.10
  ) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function glowDot(
    p,
    color = C.cyan,
    radius = 0.105
  ) {
    const outer = new M.Dot({
      point: p,
      radius: radius * 2.65,
      color
    });

    outer.setFill(color, 0.10);

    const inner = new M.Dot({
      point: p,
      radius: radius * 1.70,
      color
    });

    inner.setFill(color, 0.22);

    const core = dot(p, color, radius);

    return new M.VGroup(
      outer,
      inner,
      core
    );
  }

  function ring(
    p,
    color = GOLD,
    radius = 0.19
  ) {
    return circle(
      p,
      radius,
      color,
      0,
      2.5
    );
  }

  // Arrow constructed from ordinary Line objects.
  // Every part is created before the group appears.

  function arrow(
    a,
    b,
    color = GOLD,
    width = 3,
    head = 0.12
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.hypot(dx, dy);

    if (len < 0.00001) {
      return ring(a, color, 0.10);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(
      head,
      len * 0.40
    );

    const q1 = [
      b[0] - ux * h - uy * h * 0.60,
      b[1] - uy * h + ux * h * 0.60,
      0
    ];

    const q2 = [
      b[0] - ux * h + uy * h * 0.60,
      b[1] - uy * h - ux * h * 0.60,
      0
    ];

    return new M.VGroup(
      line(a, b, color, width),
      line(b, q1, color, width),
      line(b, q2, color, width)
    );
  }

  // ------------------------------------------------------------
  // FORMULA BOX
  // ------------------------------------------------------------

  let boxNow = null;

  function swapBox(g) {
    const a = [];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    boxNow = g;

    return a;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 21;
    const lh = P ? 0.35 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T(
      '0000000000',
      size,
      C.ink,
      true
    ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd =
      Math.max(...widths) + 0.65;

    const ht =
      rows.length * lh + 0.30;

    const r = rounded(
      wd,
      ht,
      BOXP,
      color
    );

    const left =
      BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.15 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxh = P ? 1.65 : 3.65;

    const scale = Math.min(
      1,
      BOX_MAX / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    return swapBox(g);
  }

  function clearBox() {
    return swapBox(null);
  }

  // ------------------------------------------------------------
  // PICTURE MANAGEMENT
  // ------------------------------------------------------------

  // Main picture and temporary marks remain separate.
  // Never wrap existing on-screen objects in a new VGroup.

  let pictureNow = null;
  let marksNow = null;

  function putPicture(g) {
    const a = [];

    if (pictureNow) {
      a.push(new M.FadeOut(pictureNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    pictureNow = g;

    return a;
  }

  function putMarks(g) {
    const a = [];

    if (marksNow) {
      a.push(new M.FadeOut(marksNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    marksNow = g;

    return a;
  }

  function clearMarks() {
    return putMarks(null);
  }

  // ------------------------------------------------------------
  // GEAR ANALOGY
  // ------------------------------------------------------------

  // A stylized gear built from a toothed outline, inner ring,
  // hub and a radial marker showing its rotation.

  function gear(
    p,
    radius,
    teeth,
    angle,
    color
  ) {
    const items = [];

    const points = [];

    const pitch = 2 * Math.PI / teeth;

    for (let k = 0; k < teeth; k++) {
      const base = angle + k * pitch;

      for (const [f, r] of [
        [0.00, radius * 0.85],
        [0.20, radius],
        [0.70, radius],
        [0.90, radius * 0.85]
      ]) {
        const a = base + f * pitch;

        points.push([
          p[0] + Math.cos(a) * r,
          p[1] + Math.sin(a) * r,
          0
        ]);
      }
    }

    items.push(circle(
      p,
      radius * 0.84,
      color,
      0.13,
      1
    ));

    for (let i = 0; i < points.length; i++) {
      items.push(line(
        points[i],
        points[(i + 1) % points.length],
        color,
        2.5
      ));
    }

    items.push(circle(
      p,
      radius * 0.50,
      color,
      0,
      1.9
    ));

    for (let k = 0; k < 3; k++) {
      const a =
        angle + k * 2 * Math.PI / 3;

      items.push(line(
        [
          p[0] + radius * 0.17 * Math.cos(a),
          p[1] + radius * 0.17 * Math.sin(a),
          0
        ],
        [
          p[0] + radius * 0.48 * Math.cos(a),
          p[1] + radius * 0.48 * Math.sin(a),
          0
        ],
        color,
        2.3
      ));
    }

    items.push(circle(
      p,
      radius * 0.15,
      color,
      0.85,
      1
    ));

    items.push(line(
      p,
      [
        p[0] + radius * 0.72 * Math.cos(angle),
        p[1] + radius * 0.72 * Math.sin(angle),
        0
      ],
      GOLD,
      3.4
    ));

    return new M.VGroup(...items);
  }

  function gearsPicture(angle = 0, active = 2) {
    const cy = P ? -0.55 : -0.23;

    const r = P ? 0.91 : 0.87;

    const spacing = r * 1.90;

    const colors = [
      C.cyan,
      C.violet,
      GOLD
    ];

    const items = [];

    for (let k = 0; k < 3; k++) {
      const c =
        k <= active ? colors[k] : C.muted;

      const p = [
        CX + (k - 1) * spacing,
        cy,
        0
      ];

      const a =
        (k % 2 === 0 ? angle : -angle) +
        k * Math.PI / 12;

      items.push(gear(
        p,
        r,
        12,
        a,
        c
      ));

      items.push(txt(
        k === 0
          ? 'FIRST'
          : k === 2
            ? 'LAST'
            : 'NEXT',
        16,
        c,
        [
          p[0],
          cy - r - 0.38,
          0
        ],
        true
      ));
    }

    items.push(arrow(
      [
        CX - spacing,
        cy + r + 0.35,
        0
      ],
      [
        CX + spacing,
        cy + r + 0.35,
        0
      ],
      GOLD,
      2.8
    ));

    items.push(txt(
      'the change travels through the chain',
      18,
      C.muted,
      [
        CX,
        cy - r - 0.90,
        0
      ],
      false,
      5.45
    ));

    return new M.VGroup(...items);
  }

  // Gear-rate analogy:
  // the second turns twice as fast as the first;
  // the third turns three times as fast as the second.
  //
  // Radii are proportional to 6 : 3 : 1.
  // Angular speeds are proportional to 1 : 2 : 6.
  // Rotation directions alternate.

  function ratioGearsPicture(
    angle = 0,
    stage = 0
  ) {
    const cy = P ? -0.75 : -0.32;

    const radii = [1.08, 0.54, 0.18];
    const teeth = [24, 12, 4];

    const xs = [
      CX - 1.24,
      CX + 0.30,
      CX + 0.985
    ];

    const colors = [
      C.cyan,
      C.violet,
      GOLD
    ];

    const turns = [
      angle,
      -2 * angle,
      6 * angle
    ];

    const items = [];

    for (let k = 0; k < 3; k++) {
      items.push(gear(
        [xs[k], cy, 0],
        radii[k],
        teeth[k],
        turns[k] + k * 0.10,
        colors[k]
      ));
    }

    const labelXs = [
      CX - 1.72,
      CX,
      CX + 1.72
    ];

    const labels = [
      '1× speed',
      '2× speed',
      '6× speed'
    ];

    labelXs.forEach((x, k) => {
      items.push(txt(
        labels[k],
        21,
        colors[k],
        [x, cy - 1.45, 0],
        true,
        1.55
      ));
    });

    items.push(
      dash(
        [xs[0], cy - radii[0], 0],
        [labelXs[0], cy - 1.23, 0],
        colors[0],
        1.4
      ),

      dash(
        [xs[1], cy - radii[1], 0],
        [labelXs[1], cy - 1.23, 0],
        colors[1],
        1.4
      ),

      dash(
        [xs[2], cy - radii[2], 0],
        [labelXs[2], cy - 1.23, 0],
        colors[2],
        1.4
      )
    );

    if (stage >= 1) {
      items.push(txt(
        '×2',
        23,
        C.violet,
        [CX - 0.52, cy + 1.34, 0],
        true
      ));
    }

    if (stage >= 2) {
      items.push(txt(
        '×3',
        23,
        GOLD,
        [CX + 1.08, cy + 0.74, 0],
        true
      ));

      items.push(txt(
        '2 × 3 = 6',
        26,
        GOLD,
        [CX, cy + 1.34, 0],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // APARTMENT ICONS AND LISTINGS
  // ------------------------------------------------------------

  function apartment(p, w, h, color) {
    const items = [];

    items.push(rect(
      w,
      h,
      p,
      color,
      0.12,
      2.3
    ));

    for (const i of [-1, 1]) {
      for (const j of [-1, 1]) {
        items.push(rect(
          w * 0.18,
          h * 0.19,
          [
            p[0] + i * w * 0.23,
            p[1] + j * h * 0.22,
            0
          ],
          color,
          0.72,
          1
        ));
      }
    }

    items.push(rect(
      w * 0.18,
      h * 0.27,
      [
        p[0],
        p[1] - h * 0.365,
        0
      ],
      color,
      0.75,
      1
    ));

    return new M.VGroup(...items);
  }

  function apartmentPicture(k) {
    const cy = P ? -0.80 : -0.35;

    const color = COLORS[k];

    const items = [
      rounded(
        4.85,
        P ? 3.85 : 3.15,
        [CX, cy, 0],
        color
      ),

      apartment(
        [
          CX - 1.10,
          cy + 0.12,
          0
        ],
        [0.90, 1.10, 1.25][k],
        [1.25, 1.55, 1.80][k],
        color
      ),

      txt(
        `${NAMES[k]} APARTMENT`,
        20,
        color,
        [
          CX,
          cy + (P ? 1.53 : 1.18),
          0
        ],
        true,
        4.45
      ),

      txt(
        `${AREAS[k]} m²`,
        23,
        C.ink,
        [
          CX + 0.92,
          cy + 0.68,
          0
        ],
        true
      ),

      txt(
        `size step ${signed(STEPS[k])}`,
        20,
        color,
        [
          CX + 0.92,
          cy + 0.07,
          0
        ],
        true,
        2.50
      ),

      txt(
        `rent = ${RENTS[k]}`,
        25,
        GOLD,
        [
          CX + 0.92,
          cy - 0.62,
          0
        ],
        true,
        2.50
      ),

      txt(
        'rent measured in hundreds of dollars',
        16,
        C.muted,
        [
          CX,
          cy - (P ? 1.55 : 1.24),
          0
        ],
        false,
        4.50
      )
    ];

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // RENT-VERSUS-SIZE GRAPH
  // ------------------------------------------------------------

  const rX = x =>
    GX0 +
    ((x + 1.5) / 3) *
    (GX1 - GX0);

  const rY = y =>
    GY0 +
    ((y - 7) / 7) *
    (GY1 - GY0);

  const rp = (x, y) => [
    rX(x),
    rY(y),
    0
  ];

  function rentGraph(
    s,
    m,
    selected = null,
    showMiss = false
  ) {
    const items = [];

    for (const v of [8, 9, 10, 11, 12, 13]) {
      items.push(line(
        [GX0, rY(v), 0],
        [GX1, rY(v), 0],
        C.muted,
        0.65
      ));

      items.push(txt(
        String(v),
        16,
        C.muted,
        [GX0 - 0.28, rY(v), 0],
        true
      ));
    }

    STEPS.forEach(x => {
      items.push(line(
        [rX(x), GY0, 0],
        [rX(x), GY1, 0],
        C.muted,
        0.65
      ));

      items.push(txt(
        signed(x),
        17,
        C.ink,
        [
          rX(x),
          GY0 - 0.25,
          0
        ],
        true
      ));
    });

    items.push(
      line(
        [GX0, GY0, 0],
        [GX1, GY0, 0],
        C.muted,
        2.4
      ),

      line(
        [GX0, GY0, 0],
        [GX0, GY1, 0],
        C.muted,
        2.4
      ),

      txt(
        'size step',
        18,
        C.muted,
        [
          CX,
          GY0 - 0.59,
          0
        ]
      ),

      txt(
        'rent (hundreds of dollars)',
        18,
        C.muted,
        [
          CX,
          GY1 + 0.30,
          0
        ],
        false,
        5.30
      )
    );

    items.push(line(
      rp(-1.18, m - 1.18 * s),
      rp(1.18, m + 1.18 * s),
      GOLD,
      4.2
    ));

    STEPS.forEach((x, k) => {
      const actual = RENTS[k];
      const guess = predict(s, m, x);

      const color = COLORS[k];

      items.push(glowDot(
        rp(x, actual),
        color,
        0.105
      ));

      items.push(txt(
        String(actual),
        18,
        color,
        [
          rX(x) - 0.36,
          rY(actual) + 0.24,
          0
        ],
        true
      ));

      if (
        selected === null ||
        selected === k
      ) {
        items.push(dot(
          rp(x, guess),
          GOLD,
          0.075
        ));

        items.push(txt(
          fmt(guess),
          18,
          GOLD,
          [
            rX(x) - 0.34,
            rY(guess) - 0.23,
            0
          ],
          true
        ));
      }

      if (selected === k) {
        items.push(ring(
          rp(x, actual),
          color,
          0.20
        ));

        if (showMiss) {
          const err = guess - actual;

          if (Math.abs(err) < 0.000001) {
            items.push(ring(
              rp(x, actual),
              C.green,
              0.16
            ));
          } else {
            items.push(arrow(
              rp(x, actual),
              rp(x, guess),
              C.violet,
              3.3
            ));
          }

          items.push(txt(
            signed(err),
            20,
            C.violet,
            [
              rX(x) + 0.39,
              (rY(actual) + rY(guess)) / 2,
              0
            ],
            true
          ));
        }
      }
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // FOUR-STAGE CHAIN
  // ------------------------------------------------------------

  // Laptop: four nodes arranged horizontally.
  // Phone: four nodes stacked vertically.
  //
  // Each node shows a value.
  // Each link shows a rate, distinct from the node value.

  const NODE_NAMES = [
    'STEP PRICE',
    'GUESS',
    'MISS',
    'SQUARED MISS'
  ];

  const NODE_COLORS = [
    C.cyan,
    GOLD,
    C.violet,
    C.green
  ];

  const LINK_COLORS = [
    C.cyan,
    GOLD,
    C.violet
  ];

  const NW = P ? 2.85 : 1.37;
  const NH = P ? 0.88 : 1.22;

  const nodeP = k => P
    ? [
        CX - 0.70,
        0.63 - k * 1.34,
        0
      ]
    : [
        CX + (k - 1.5) * 1.48,
        -0.30,
        0
      ];

  function nodeCard(
    k,
    value,
    active = false,
    visible = true
  ) {
    const p = nodeP(k);

    const color = visible
      ? NODE_COLORS[k]
      : C.muted;

    const border = active
      ? GOLD
      : color;

    const items = [
      rounded(
        NW,
        NH,
        p,
        border,
        0.96
      )
    ];

    if (P) {
      items.push(txt(
        NODE_NAMES[k],
        15,
        color,
        [
          p[0] - 0.57,
          p[1],
          0
        ],
        true,
        1.48
      ));

      items.push(txt(
        visible && value !== null
          ? fmt(value)
          : '—',
        24,
        color,
        [
          p[0] + 0.82,
          p[1],
          0
        ],
        true,
        1.02
      ));
    } else {
      items.push(txt(
        NODE_NAMES[k],
        16,
        color,
        [
          p[0],
          p[1] + 0.36,
          0
        ],
        true,
        NW - 0.16
      ));

      items.push(txt(
        visible && value !== null
          ? fmt(value)
          : '—',
        27,
        color,
        [
          p[0],
          p[1] - 0.16,
          0
        ],
        true,
        NW - 0.19
      ));
    }

    return new M.VGroup(...items);
  }

  function chainLink(
    k,
    rate,
    active = false,
    backward = false,
    showRate = true
  ) {
    const a = nodeP(k);
    const b = nodeP(k + 1);

    const color = active
      ? GOLD
      : rate === null
        ? C.muted
        : LINK_COLORS[k];

    const items = [];

    if (P) {
      const start = [
        a[0],
        a[1] - NH / 2 - 0.025,
        0
      ];

      const end = [
        b[0],
        b[1] + NH / 2 + 0.025,
        0
      ];

      items.push(
        backward
          ? arrow(end, start, color, 3)
          : arrow(start, end, color, 3)
      );

      if (showRate && rate !== null) {
        items.push(txt(
          `× ${fmt(rate)}`,
          21,
          color,
          [
            a[0] + 1.68,
            (a[1] + b[1]) / 2,
            0
          ],
          true,
          1.70
        ));
      }
    } else {
      // Use a raised path so link arrows and rate labels
      // remain readable between adjacent node cards.

      const y = a[1] + NH / 2 + 0.40;

      const start = [
        a[0],
        a[1] + NH / 2 + 0.035,
        0
      ];

      const cornerA = [
        a[0],
        y,
        0
      ];

      const cornerB = [
        b[0],
        y,
        0
      ];

      const end = [
        b[0],
        b[1] + NH / 2 + 0.035,
        0
      ];

      if (backward) {
        items.push(
          line(end, cornerB, color, 2.0),
          line(cornerB, cornerA, color, 2.0),
          arrow(cornerA, start, color, 2.2)
        );
      } else {
        items.push(
          line(start, cornerA, color, 2.0),
          line(cornerA, cornerB, color, 2.0),
          arrow(cornerB, end, color, 2.2)
        );
      }

      if (showRate && rate !== null) {
        items.push(txt(
          `× ${fmt(rate)}`,
          20,
          color,
          [
            (a[0] + b[0]) / 2,
            y + 0.24,
            0
          ],
          true,
          1.35
        ));
      }
    }

    return new M.VGroup(...items);
  }

  function chainPicture({
    apartmentIndex = 2,
    s = 0,
    m = 10,
    reveal = 3,
    rates = [null, null, null],
    activeLink = -1,
    activeNode = -1,
    result = null,
    note = null,
    backward = false,
    symbolic = false
  } = {}) {
    const k = apartmentIndex;

    const guess = predict(
      s,
      m,
      STEPS[k]
    );

    const err = guess - RENTS[k];

    const values = symbolic
      ? [null, null, null, null]
      : [s, guess, err, err * err];

    const items = [];

    const titleY = P ? 1.36 : -1.30;

    if (!symbolic) {
      items.push(txt(
        `${NAMES[k]}: step ${signed(STEPS[k])}, rent ${RENTS[k]}`,
        18,
        COLORS[k],
        [
          CX,
          titleY,
          0
        ],
        true,
        5.45
      ));
    }

    for (let i = 0; i < 4; i++) {
      items.push(nodeCard(
        i,
        values[i],
        i === activeNode ||
          i === activeLink ||
          i === activeLink + 1 &&
          activeLink >= 0,
        i <= reveal
      ));
    }

    for (let i = 0; i < 3; i++) {
      items.push(chainLink(
        i,
        rates[i],
        i === activeLink,
        backward,
        i < reveal
      ));
    }

    if (result !== null) {
      const y = P ? -4.54 : -2.02;

      items.push(rounded(
        4.95,
        0.62,
        [
          CX,
          y,
          0
        ],
        GOLD
      ));

      items.push(txt(
        result,
        22,
        GOLD,
        [
          CX,
          y,
          0
        ],
        true,
        4.65
      ));
    }

    if (note !== null) {
      const y = result !== null
        ? P ? -5.04 : -2.58
        : P ? -4.54 : -2.05;

      items.push(txt(
        note,
        17,
        C.muted,
        [
          CX,
          y,
          0
        ],
        false,
        5.35
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // TWO-VALUE LINK PICTURE
  // ------------------------------------------------------------

  // Used to isolate a single link before returning to the
  // full four-stage chain.

  function linkPicture({
    leftName,
    rightName,
    leftBefore,
    leftAfter,
    rightBefore,
    rightAfter,
    rate = null,
    color = C.cyan,
    moved = false,
    note = null
  }) {
    const cy = P ? -0.65 : -0.36;

    const xs = [
      CX - 1.50,
      CX + 1.50
    ];

    const w = 2.40;
    const h = P ? 2.05 : 1.90;

    const items = [];

    const names = [
      leftName,
      rightName
    ];

    const before = [
      leftBefore,
      rightBefore
    ];

    const after = [
      leftAfter,
      rightAfter
    ];

    for (let k = 0; k < 2; k++) {
      items.push(rounded(
        w,
        h,
        [xs[k], cy, 0],
        color
      ));

      items.push(txt(
        names[k],
        17,
        color,
        [
          xs[k],
          cy + h / 2 - 0.32,
          0
        ],
        true,
        w - 0.22
      ));

      items.push(txt(
        fmt(before[k]),
        29,
        moved ? C.muted : GOLD,
        [
          xs[k],
          cy + 0.13,
          0
        ],
        true
      ));

      if (moved) {
        items.push(arrow(
          [
            xs[k],
            cy - 0.08,
            0
          ],
          [
            xs[k],
            cy - 0.38,
            0
          ],
          color,
          2.2
        ));

        items.push(txt(
          fmt(after[k]),
          28,
          GOLD,
          [
            xs[k],
            cy - 0.65,
            0
          ],
          true
        ));
      }
    }

    items.push(arrow(
      [
        xs[0] + w / 2 + 0.02,
        cy,
        0
      ],
      [
        xs[1] - w / 2 - 0.02,
        cy,
        0
      ],
      GOLD,
      3.2
    ));

    if (moved) {
      items.push(txt(
        `change ${signed(leftAfter - leftBefore)}`,
        19,
        color,
        [
          xs[0],
          cy - h / 2 - 0.31,
          0
        ],
        true,
        w
      ));

      items.push(txt(
        `change ${signed(rightAfter - rightBefore)}`,
        19,
        color,
        [
          xs[1],
          cy - h / 2 - 0.31,
          0
        ],
        true,
        w
      ));
    }

    if (rate !== null) {
      items.push(txt(
        `rate = ${fmt(rate)}`,
        25,
        GOLD,
        [
          CX,
          cy + h / 2 + 0.32,
          0
        ],
        true
      ));
    }

    if (note !== null) {
      items.push(txt(
        note,
        17,
        C.muted,
        [
          CX,
          cy - h / 2 - 0.83,
          0
        ],
        false,
        5.45
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // SQUARED MISS PICTURE
  // ------------------------------------------------------------

  // A miss of −3 has magnitude 3.
  // Squaring produces a 3 × 3 square with area 9.
  //
  // A positive change in a negative miss makes its magnitude
  // smaller, so the area decreases.

  const SQ_UNIT = P ? 0.90 : 0.72;

  const SQ_LEFT = CX - 1.5 * SQ_UNIT;
  const SQ_BOTTOM = P ? -3.36 : -2.04;

  const SQ_TOP =
    SQ_BOTTOM + 3 * SQ_UNIT;

  const SQ_RIGHT =
    SQ_LEFT + 3 * SQ_UNIT;

  function squarePoint(x, y) {
    return [
      SQ_LEFT + x * SQ_UNIT,
      SQ_BOTTOM + y * SQ_UNIT,
      0
    ];
  }

  function squareGridParts(n = 3, color = C.violet) {
    const items = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        items.push(rect(
          SQ_UNIT * 0.95,
          SQ_UNIT * 0.95,
          squarePoint(
            i + 0.5,
            j + 0.5
          ),
          color,
          0.49,
          1
        ));
      }
    }

    items.push(rect(
      n * SQ_UNIT,
      n * SQ_UNIT,
      squarePoint(
        n / 2,
        n / 2
      ),
      color,
      0,
      2.5
    ));

    return items;
  }

  function squareMissPicture(
    showSignedMiss = false
  ) {
    const items = [
      ...squareGridParts()
    ];

    items.push(txt(
      '3',
      22,
      C.violet,
      [
        SQ_LEFT - 0.30,
        SQ_BOTTOM + 1.5 * SQ_UNIT,
        0
      ],
      true
    ));

    items.push(txt(
      '3',
      22,
      C.violet,
      [
        CX,
        SQ_BOTTOM - 0.27,
        0
      ],
      true
    ));

    items.push(txt(
      '9',
      34,
      C.ink,
      squarePoint(1.5, 1.5),
      true
    ));

    items.push(txt(
      'square area = 9',
      19,
      C.green,
      [
        CX,
        SQ_TOP + 0.32,
        0
      ],
      true
    ));

    if (showSignedMiss) {
      const y = P ? 0.70 : 1.02;

      const a = [
        CX + 1.50,
        y,
        0
      ];

      const b = [
        CX - 1.50,
        y,
        0
      ];

      items.push(line(
        [
          CX - 2.05,
          y,
          0
        ],
        [
          CX + 1.85,
          y,
          0
        ],
        C.muted,
        2.0
      ));

      items.push(
        arrow(a, b, C.violet, 3.5),
        glowDot(a, C.ink, 0.075),
        glowDot(b, C.violet, 0.095)
      );

      items.push(txt(
        '0',
        17,
        C.ink,
        [
          a[0],
          a[1] + 0.25,
          0
        ],
        true
      ));

      items.push(txt(
        '−3',
        19,
        C.violet,
        [
          b[0],
          b[1] + 0.25,
          0
        ],
        true
      ));

      items.push(txt(
        'length 3, negative miss',
        16,
        C.muted,
        [
          CX,
          y - 0.22,
          0
        ],
        false,
        3.90
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // THIN-STRIP AREA CHANGE
  // ------------------------------------------------------------

  // For a visible illustrative nudge h:
  //
  // original side length = 3
  // new side length      = 3 − h
  //
  // removed area = 3h + (3 − h)h
  //              = 6h − h²
  //
  // For very small h, the h² corner correction is tiny.
  // The area therefore changes about 6 times as fast as
  // the magnitude of the side.
  //
  // Because increasing the signed miss shrinks its magnitude,
  // the rate with respect to the signed miss is −6.
  //
  // The displayed strip width is enlarged for visibility.

  function stripPicture(
    h = 0.30,
    showLabels = true,
    showSign = false
  ) {
    const n = 3 - h;

    const items = [];

    items.push(rect(
      3 * SQ_UNIT,
      3 * SQ_UNIT,
      squarePoint(1.5, 1.5),
      C.violet,
      0.12,
      1.9
    ));

    items.push(rect(
      n * SQ_UNIT,
      n * SQ_UNIT,
      squarePoint(
        n / 2,
        n / 2
      ),
      C.violet,
      0.49,
      2.4
    ));

    // Grid lines within the remaining square.

    for (const k of [1, 2]) {
      if (k < n) {
        items.push(line(
          squarePoint(k, 0),
          squarePoint(k, n),
          C.violet,
          1.0
        ));

        items.push(line(
          squarePoint(0, k),
          squarePoint(n, k),
          C.violet,
          1.0
        ));
      }
    }

    // Top strip: 3 × h.

    items.push(rect(
      3 * SQ_UNIT,
      h * SQ_UNIT,
      squarePoint(
        1.5,
        3 - h / 2
      ),
      GOLD,
      0.87,
      1.4
    ));

    // Right strip: (3 − h) × h.
    // The tiny shared corner is not counted twice.

    items.push(rect(
      h * SQ_UNIT,
      n * SQ_UNIT,
      squarePoint(
        3 - h / 2,
        n / 2
      ),
      C.cyan,
      0.87,
      1.4
    ));

    items.push(rect(
      3 * SQ_UNIT,
      3 * SQ_UNIT,
      squarePoint(1.5, 1.5),
      C.ink,
      0,
      1.6
    ));

    if (showLabels) {
      items.push(txt(
        'thin strip',
        17,
        GOLD,
        [
          CX,
          SQ_TOP + 0.30,
          0
        ]
      ));

      items.push(arrow(
        [
          CX,
          SQ_TOP + 0.19,
          0
        ],
        squarePoint(
          1.5,
          3 - h / 2
        ),
        GOLD,
        2.1
      ));

      items.push(txt(
        'thin strip',
        17,
        C.cyan,
        [
          SQ_RIGHT + 0.65,
          SQ_BOTTOM + 1.5 * SQ_UNIT,
          0
        ],
        false,
        1.30
      ));

      items.push(arrow(
        [
          SQ_RIGHT + 0.30,
          SQ_BOTTOM + 0.90 * SQ_UNIT,
          0
        ],
        squarePoint(
          3 - h / 2,
          0.90
        ),
        C.cyan,
        2.1
      ));

      items.push(txt(
        '3',
        21,
        C.violet,
        [
          SQ_LEFT - 0.28,
          SQ_BOTTOM + 1.5 * SQ_UNIT,
          0
        ],
        true
      ));

      items.push(txt(
        '3',
        21,
        C.violet,
        [
          CX,
          SQ_BOTTOM - 0.25,
          0
        ],
        true
      ));

      items.push(txt(
        'sliver enlarged',
        15,
        C.muted,
        [
          CX,
          SQ_BOTTOM - 0.59,
          0
        ]
      ));
    }

    if (showSign) {
      items.push(txt(
        'AREA SHRINKS',
        20,
        C.green,
        squarePoint(
          n / 2,
          n / 2
        ),
        true,
        n * SQ_UNIT - 0.22
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // NEGATIVE MISS MOVING TOWARD ZERO
  // ------------------------------------------------------------

  function signedMissPicture(
    before = -3,
    after = -2.9
  ) {
    const cy = P ? 0.45 : 0.96;

    const x0 = CX - 2.40;
    const x1 = CX + 2.40;

    const X = n =>
      x0 + (n + 4) / 5 * (x1 - x0);

    const items = [];

    items.push(line(
      [x0, cy, 0],
      [x1, cy, 0],
      C.muted,
      2.1
    ));

    for (let n = -4; n <= 1; n++) {
      items.push(line(
        [X(n), cy - 0.08, 0],
        [X(n), cy + 0.08, 0],
        C.muted,
        1.6
      ));

      items.push(txt(
        fmt(n),
        16,
        C.muted,
        [
          X(n),
          cy + 0.24,
          0
        ],
        true
      ));
    }

    items.push(glowDot(
      [X(before), cy, 0],
      C.violet,
      0.09
    ));

    items.push(dot(
      [X(after), cy, 0],
      GOLD,
      0.065
    ));

    items.push(arrow(
      [
        X(before),
        cy - 0.23,
        0
      ],
      [
        X(after),
        cy - 0.23,
        0
      ],
      GOLD,
      3.1
    ));

    items.push(txt(
      'miss increases toward zero',
      17,
      GOLD,
      [
        CX,
        cy - 0.46,
        0
      ],
      false,
      5.30
    ));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // TWO EXACT SQUARE AREAS
  // ------------------------------------------------------------

  function nudgeSquares(
    before = -3,
    after = -2.9
  ) {
    const u = P ? 0.72 : 0.59;

    const base = P ? -2.80 : -1.70;

    const xs = [
      CX - 1.50,
      CX + 1.50
    ];

    const sides = [
      Math.abs(before),
      Math.abs(after)
    ];

    const colors = [
      C.violet,
      C.green
    ];

    const items = [];

    for (let k = 0; k < 2; k++) {
      const side = sides[k];
      const w = side * u;

      const center = [
        xs[k],
        base + w / 2,
        0
      ];

      items.push(rect(
        w,
        w,
        center,
        colors[k],
        0.35,
        2.5
      ));

      items.push(txt(
        `miss ${fmt(k === 0 ? before : after)}`,
        19,
        colors[k],
        [
          xs[k],
          base + 3 * u + 0.34,
          0
        ],
        true,
        2.50
      ));

      items.push(txt(
        fmt(side * side),
        30,
        colors[k],
        center,
        true
      ));

      items.push(txt(
        `${fmt(side)} × ${fmt(side)}`,
        18,
        colors[k],
        [
          xs[k],
          base - 0.30,
          0
        ],
        true,
        2.50
      ));
    }

    items.push(arrow(
      [
        CX - 0.30,
        base + 1.45 * u,
        0
      ],
      [
        CX + 0.30,
        base + 1.45 * u,
        0
      ],
      GOLD,
      3.2
    ));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // MULTIPLY THE THREE LINK RATES
  // ------------------------------------------------------------

  function rateProductPicture(
    rates,
    result = null,
    operator = '×',
    wrong = false
  ) {
    const cy = P ? -0.75 : -0.28;

    const xs = [
      CX - 1.80,
      CX,
      CX + 1.80
    ];

    const labels = [
      'LINK 1',
      'LINK 2',
      'LINK 3'
    ];

    const items = [];

    rates.forEach((v, k) => {
      items.push(rounded(
        1.25,
        1.42,
        [xs[k], cy, 0],
        LINK_COLORS[k]
      ));

      items.push(txt(
        labels[k],
        15,
        LINK_COLORS[k],
        [
          xs[k],
          cy + 0.43,
          0
        ],
        true
      ));

      items.push(txt(
        fmt(v),
        31,
        LINK_COLORS[k],
        [
          xs[k],
          cy - 0.13,
          0
        ],
        true
      ));
    });

    for (let k = 0; k < 2; k++) {
      items.push(txt(
        operator,
        27,
        wrong ? PINK : GOLD,
        [
          (xs[k] + xs[k + 1]) / 2,
          cy,
          0
        ]
      ));
    }

    if (result !== null) {
      const y = cy - 1.50;

      items.push(txt(
        '=',
        23,
        C.muted,
        [
          CX,
          y + 0.49,
          0
        ]
      ));

      items.push(rounded(
        3.80,
        0.75,
        [
          CX,
          y - 0.13,
          0
        ],
        wrong ? PINK : GOLD
      ));

      items.push(txt(
        `${fmt(result)}${wrong ? '  ✕' : ''}`,
        30,
        wrong ? PINK : GOLD,
        [
          CX,
          y - 0.13,
          0
        ],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // THREE APARTMENTS: ADD THEIR SEPARATE EFFECTS
  // ------------------------------------------------------------

  function totalRatePicture(
    revealTotal = false,
    middleRentMode = false,
    hideRates = false
  ) {
    const cy = P ? 0.46 : 0.56;

    const rowH = P ? 1.14 : 0.82;

    // Narration order: large, small, middle.

    const order = [2, 0, 1];

    const items = [];

    order.forEach((k, row) => {
      const y =
        cy - row * rowH;

      const c = COLORS[k];

      const err = miss(
        START_S,
        START_M,
        k
      );

      const rates = middleRentMode
        ? [1, 1, 2 * err]
        : chainRates(k);

      const product =
        rates.reduce(
          (a, b) => a * b,
          1
        );

      items.push(rounded(
        5.45,
        rowH * 0.84,
        [
          CX,
          y,
          0
        ],
        c
      ));

      items.push(txt(
        NAMES[k],
        17,
        c,
        [
          CX - 1.96,
          y,
          0
        ],
        true,
        1.20
      ));

      items.push(txt(
        `${fmt(rates[0])} × ${fmt(rates[1])} × ${fmt(rates[2])}`,
        20,
        C.ink,
        [
          CX - 0.07,
          y,
          0
        ],
        true,
        2.45
      ));

      items.push(txt(
        '=',
        20,
        C.muted,
        [
          CX + 1.44,
          y,
          0
        ]
      ));

      items.push(txt(
        hideRates ? '?' : fmt(product),
        23,
        c,
        [
          CX + 2.04,
          y,
          0
        ],
        true
      ));
    });

    if (revealTotal) {
      const y =
        cy - 3 * rowH - 0.13;

      items.push(rounded(
        5.45,
        0.75,
        [
          CX,
          y,
          0
        ],
        GOLD
      ));

      const result = middleRentMode
        ? '−6 + 2 − 2 = −6'
        : '−6 − 2 + 0 = −8';

      items.push(txt(
        hideRates
          ? 'TOTAL RATE = ?'
          : result,
        24,
        GOLD,
        [
          CX,
          y,
          0
        ],
        true,
        5.10
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // LONG MODEL CHAIN
  // ------------------------------------------------------------

  function longChainPicture(
    active = 0,
    backward = false
  ) {
    const items = [];

    const labels = [
      'INPUT',
      'STEP 1',
      'STEP 2',
      'STEP 3',
      'STEP 4',
      'LOSS'
    ];

    const p = k => P
      ? [
          CX,
          0.75 - k * 0.96,
          0
        ]
      : [
          CX + (k - 2.5) * 0.96,
          -0.18,
          0
        ];

    const w = P ? 2.75 : 0.79;
    const h = P ? 0.58 : 0.80;

    for (let k = 0; k < 6; k++) {
      const point = p(k);

      const lit = backward
        ? k >= active
        : k <= active;

      const c = lit
        ? GOLD
        : C.muted;

      items.push(rounded(
        w,
        h,
        point,
        c
      ));

      items.push(txt(
        labels[k],
        P ? 19 : 14,
        c,
        point,
        true,
        w - 0.16
      ));
    }

    for (let k = 0; k < 5; k++) {
      const a = p(k);
      const b = p(k + 1);

      const lit = backward
        ? k >= active
        : k < active;

      const c = lit
        ? GOLD
        : C.muted;

      const start = P
        ? [
            a[0],
            a[1] - h / 2 - 0.02,
            0
          ]
        : [
            a[0] + w / 2 + 0.02,
            a[1],
            0
          ];

      const end = P
        ? [
            b[0],
            b[1] + h / 2 + 0.02,
            0
          ]
        : [
            b[0] - w / 2 - 0.02,
            b[1],
            0
          ];

      items.push(
        backward
          ? arrow(end, start, c, 2.3)
          : arrow(start, end, c, 2.3)
      );

      if (lit) {
        items.push(txt(
          '× rate',
          P ? 16 : 15,
          c,
          P
            ? [
                CX + 1.75,
                (a[1] + b[1]) / 2,
                0
              ]
            : [
                (a[0] + b[0]) / 2,
                a[1] + 0.68,
                0
              ],
          true,
          1.18
        ));
      }
    }

    items.push(txt(
      backward
        ? 'work backward from loss'
        : 'changes travel through many links',
      18,
      backward ? GOLD : C.muted,
      [
        CX,
        P ? -4.85 : -1.55,
        0
      ],
      false,
      5.40
    ));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // 0 — A row of gears.
  // Turn the first, and the turn travels to the last.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...putPicture(
      gearsPicture(0, 0)
    ),
    ...say('TURN THE FIRST GEAR', GOLD)
  );

  await until(S(0) + 1.75);

  await play(
    ...putPicture(
      gearsPicture(
        Math.PI / 9,
        2
      )
    ),
    ...say('THE TURN TRAVELS THROUGH THE CHAIN')
  );

  for (let k = 2; k <= 7; k++) {
    await play(
      new M.Transform(
        pictureNow,
        gearsPicture(
          k * Math.PI / 9,
          2
        ),
        { runTime: 0.30 }
      )
    );
  }

  // ------------------------------------------------------------
  // 1 — Our rent line works in the same way.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...putPicture(
      rentGraph(
        START_S,
        START_M
      )
    ),
    ...say('OUR RENT LINE WORKS THE SAME WAY')
  );

  // ------------------------------------------------------------
  // 2 — The chain:
  // step price → guess → miss → squared miss.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...putPicture(
      chainPicture({
        symbolic: true,
        reveal: 3,
        activeNode: 0
      })
    ),
    ...say('ONE NUMBER CHANGES THE NEXT')
  );

  await until(S(2) + 1.45);

  await play(
    ...putPicture(
      chainPicture({
        symbolic: true,
        activeLink: 0
      })
    )
  );

  await until(S(2) + 2.85);

  await play(
    ...putPicture(
      chainPicture({
        symbolic: true,
        activeLink: 1
      })
    )
  );

  await until(S(2) + 4.15);

  await play(
    ...putPicture(
      chainPicture({
        symbolic: true,
        activeLink: 2
      })
    ),
    ...say('STEP PRICE → GUESS → MISS → SQUARE', GOLD)
  );

  // ------------------------------------------------------------
  // 3 — Follow the large apartment.
  // Size step +1, area 60 m², rent 13.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...putPicture(
      apartmentPicture(2)
    ),
    ...fbox([
      ['large apartment', PINK],
      'area = 60 m²',
      'size step = +1',
      ['real rent = 13', PINK]
    ], PINK),
    ...say('FOLLOW ONE APARTMENT: THE LARGE ONE', PINK)
  );

  // ------------------------------------------------------------
  // 4 — Starting line:
  // step price zero, middle rent ten.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...putPicture(
      rentGraph(
        START_S,
        START_M,
        2
      )
    ),
    ...fbox([
      'step price = 0',
      'middle rent = 10',
      ['starting flat line', GOLD]
    ], GOLD),
    ...say('START FROM THE FLAT LINE', GOLD)
  );

  // ------------------------------------------------------------
  // 5 — Guess = 10 + 0 × 1 = 10.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        reveal: 1,
        activeNode: 1
      })
    ),
    ...fbox([
      'guess = middle rent',
      ' + step price × size step',
      ' = 10 + 0 × 1',
      [' = 10', GOLD]
    ], GOLD),
    ...say('FIRST: THE GUESS IS 10', GOLD)
  );

  // ------------------------------------------------------------
  // 6 — Miss = guess − actual rent.
  // 10 − 13 = −3.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        reveal: 2,
        activeNode: 2
      })
    ),
    ...fbox([
      'miss = guess − real rent',
      '     = 10 − 13',
      ['     = −3', C.violet]
    ], C.violet),
    ...say('NEXT: THE MISS IS −3', C.violet)
  );

  // ------------------------------------------------------------
  // 7 — Squared miss = (−3) × (−3) = 9.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        reveal: 3,
        activeNode: 3
      })
    ),
    ...fbox([
      'squared miss = miss²',
      ' = (−3) × (−3)',
      [' = 9', C.green]
    ], C.green),
    ...say('SQUARE THE MISS: 9', C.green)
  );

  // ------------------------------------------------------------
  // 8 — How fast does the squared miss change when
  // the step price changes?
  // Read each link separately.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        reveal: 3,
        note: 'How fast does a change travel from start to end?'
      })
    ),
    ...fbox([
      ['change the step price', C.cyan],
      ['watch the squared miss', C.green],
      'read the rate of each link'
    ], GOLD),
    ...say('HOW FAST DOES THE CHANGE TRAVEL?', GOLD)
  );

  // ------------------------------------------------------------
  // 9 — Link one: step price to guess.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        reveal: 3,
        activeLink: 0
      })
    ),
    ...fbox([
      ['LINK 1', C.cyan],
      'step price → guess'
    ], C.cyan),
    ...say('LINK 1: STEP PRICE TO GUESS', C.cyan)
  );

  // ------------------------------------------------------------
  // 10 — The step price is added once for every size step.
  // Large apartment: size step +1.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...putPicture(
      rentGraph(
        0,
        10,
        2
      )
    ),
    ...fbox([
      'guess = 10 + step price × 1',
      ['size step = +1', PINK]
    ], C.cyan),
    ...say('THE LARGE APARTMENT IS ONE STEP ABOVE')
  );

  await until(S(10) + 3.25);

  await play(
    ...putPicture(
      rentGraph(
        1,
        10,
        2
      )
    ),
    ...fbox([
      'step price: 0 → 1',
      'guess: 10 → 11',
      ['one extra unit of rent', GOLD]
    ], GOLD),
    ...say('ADD ONE TO STEP PRICE, ADD ONE TO GUESS')
  );

  // ------------------------------------------------------------
  // 11 — Link one rate = 1.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...putPicture(
      linkPicture({
        leftName: 'STEP PRICE',
        rightName: 'GUESS',
        leftBefore: 0,
        leftAfter: 1,
        rightBefore: 10,
        rightAfter: 11,
        rate: 1,
        color: C.cyan,
        moved: true
      })
    ),
    ...fbox([
      'change in guess = +1',
      'change in step price = +1',
      ['rate = 1 ÷ 1 = 1', GOLD]
    ], GOLD),
    ...say('LINK 1 RATE = 1', GOLD)
  );

  // ------------------------------------------------------------
  // 12 — Link two: guess to miss.
  // Raise guess by one, and the miss rises by one.
  // Rate = 1.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...putPicture(
      linkPicture({
        leftName: 'GUESS',
        rightName: 'MISS',
        leftBefore: 10,
        leftAfter: 11,
        rightBefore: -3,
        rightAfter: -2,
        rate: null,
        color: C.violet,
        moved: false,
        note: 'The actual rent stays at 13.'
      })
    ),
    ...fbox([
      'miss = guess − 13',
      '10 − 13 = −3',
      ['actual rent stays fixed', C.muted]
    ], C.violet),
    ...say('LINK 2: GUESS TO MISS', C.violet)
  );

  await until(S(12) + 2.65);

  await play(
    ...putPicture(
      linkPicture({
        leftName: 'GUESS',
        rightName: 'MISS',
        leftBefore: 10,
        leftAfter: 11,
        rightBefore: -3,
        rightAfter: -2,
        rate: 1,
        color: C.violet,
        moved: true
      })
    ),
    ...fbox([
      'guess: 10 → 11',
      'miss: −3 → −2',
      ['rate = 1', GOLD]
    ], GOLD),
    ...say('LINK 2 RATE = 1', GOLD)
  );

  // ------------------------------------------------------------
  // 13 — Link three: miss to squared miss.
  // Picture the squared miss as the area of a square.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, null],
        activeLink: 2
      })
    ),
    ...fbox([
      ['LINK 3', C.violet],
      'miss → squared miss'
    ], C.violet),
    ...say('LINK 3: MISS TO SQUARED MISS', C.violet)
  );

  await until(S(13) + 2.55);

  await play(
    ...putPicture(
      squareMissPicture(false)
    ),
    ...fbox([
      'miss = −3',
      'side length = 3',
      ['square area = 9', C.green]
    ], C.green),
    ...say('PICTURE THE SQUARED MISS AS AN AREA', C.green)
  );

  // ------------------------------------------------------------
  // 14 — The miss has magnitude three and is negative.
  // Show it pointing from zero toward minus three.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...putPicture(
      squareMissPicture(true)
    ),
    ...fbox([
      ['signed miss = −3', C.violet],
      'length = 3',
      'square area = 9'
    ], C.violet),
    ...say('THREE UNITS, ON THE NEGATIVE SIDE', C.violet)
  );

  // ------------------------------------------------------------
  // 15 — A tiny side change alters two thin strips.
  // Each strip is approximately three units long.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...putPicture(
      stripPicture(
        0.30,
        true,
        false
      )
    ),
    ...fbox([
      'tiny side change',
      ['one thin strip', GOLD],
      ['another thin strip', C.cyan],
      'each almost 3 units long'
    ], GOLD),
    ...say('A TINY SIDE CHANGE ALTERS TWO STRIPS', GOLD)
  );

  await until(S(15) + 2.75);

  await play(
    ...putPicture(
      stripPicture(
        0.13,
        true,
        false
      )
    ),
    ...say('THINNER STRIPS: EACH LENGTH APPROACHES 3')
  );

  // ------------------------------------------------------------
  // 16 — The area changes about six times as fast
  // as the magnitude of the side.
  // 2 × 3 = 6.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...fbox([
      ['first strip: about 3 × h', GOLD],
      ['second strip: about 3 × h', C.cyan],
      'total: about 6 × h',
      ['2 × 3 = 6', GOLD]
    ], GOLD),
    ...say('AREA CHANGES ABOUT SIX TIMES AS FAST', GOLD)
  );

  // ------------------------------------------------------------
  // 17 — Raising a negative miss moves it toward zero.
  // The magnitude decreases and the square shrinks.
  // Rate with respect to the signed miss = −6.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...putPicture(
      stripPicture(
        0.30,
        false,
        true
      )
    ),
    ...putMarks(
      signedMissPicture(
        -3,
        -2.9
      )
    ),
    ...fbox([
      'miss increases',
      'magnitude decreases',
      ['square area decreases', C.green],
      ['rate = −6', GOLD]
    ], GOLD),
    ...say('RAISE THE MISS: THE SQUARE SHRINKS', C.green)
  );

  // ------------------------------------------------------------
  // 18 — General rule:
  // rate of squared miss with respect to miss
  // = 2 × miss.
  //
  // At miss −3, the rate is −6.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...clearMarks(),
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        activeLink: 2
      })
    ),
    ...fbox([
      'rate of squared miss',
      ' = 2 × miss',
      ' = 2 × (−3)',
      [' = −6', GOLD]
    ], GOLD),
    ...say('LINK 3 RATE = TWO TIMES THE MISS', GOLD)
  );

  // ------------------------------------------------------------
  // 19 — Chain the links by multiplying their rates.
  // 1 × 1 × (−6) = −6.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...putPicture(
      rateProductPicture(
        [1, 1, -6]
      )
    ),
    ...fbox([
      'link 1 rate = 1',
      'link 2 rate = 1',
      'link 3 rate = −6'
    ], GOLD),
    ...say('NOW MULTIPLY THE THREE LINK RATES', GOLD)
  );

  await until(S(19) + 3.0);

  await play(
    ...putPicture(
      rateProductPicture(
        [1, 1, -6],
        -6
      )
    ),
    ...fbox([
      'total rate for large apartment',
      '1 × 1 × (−6)',
      ['= −6', GOLD]
    ], GOLD),
    ...say('THE CHANGE THROUGH THE WHOLE CHAIN = −6', GOLD)
  );

  // ------------------------------------------------------------
  // 20 — Check the chain rule using a small nudge.
  // Raise the step price from 0 to 0.1.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        s: 0,
        rates: [1, 1, -6],
        activeNode: 0
      })
    ),
    ...fbox([
      'step price: 0 → 0.1',
      ['input change = +0.1', C.cyan],
      'middle rent stays at 10'
    ], GOLD),
    ...say('CHECK WITH A TINY NUDGE', GOLD)
  );

  await until(S(20) + 1.65);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        s: 0.1,
        reveal: 0,
        activeNode: 0
      })
    )
  );

  // ------------------------------------------------------------
  // 21 — The guess goes from 10 to 10.1.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        s: 0.1,
        reveal: 1,
        rates: [1, null, null],
        activeLink: 0
      })
    ),
    ...fbox([
      'guess = 10 + 0.1 × 1',
      ['10 → 10.1', GOLD]
    ], GOLD),
    ...say('GUESS INCREASES BY 0.1', GOLD)
  );

  // ------------------------------------------------------------
  // 22 — Miss goes from −3 to −2.9.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        s: 0.1,
        reveal: 2,
        rates: [1, 1, null],
        activeLink: 1
      })
    ),
    ...fbox([
      'miss = 10.1 − 13',
      ['−3 → −2.9', C.violet],
      'change = +0.1'
    ], C.violet),
    ...say('MISS MOVES TOWARD ZERO', C.violet)
  );

  // ------------------------------------------------------------
  // 23 — Squared miss goes from 9 to 8.41.
  // Exact drop = 0.59, approximately 0.6.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...putPicture(
      nudgeSquares(
        -3,
        -2.9
      )
    ),
    ...fbox([
      '(−2.9)² = 8.41',
      '8.41 − 9 = −0.59',
      ['about −0.6', C.green]
    ], C.green),
    ...say('SQUARED MISS: 9 → 8.41', C.green)
  );

  // ------------------------------------------------------------
  // 24 — A drop of about six tenths for one tenth.
  // Exact finite-nudge average change = −5.9.
  // Local derivative = −6.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        s: 0.1,
        reveal: 3,
        rates: [1, 1, null],
        activeNode: 3,
        result: '9 → 8.41',
        note: 'The nudge agrees with the local rate.'
      })
    ),
    ...fbox([
      'actual change = −0.59',
      'input change = 0.1',
      '−0.59 ÷ 0.1 = −5.9',
      ['approximately −6', C.green]
    ], C.green),
    ...say('THE NUDGE CONFIRMS THE CHAIN RULE', C.green)
  );

  // ------------------------------------------------------------
  // 25 — Name the method: chain rule.
  // Rates multiply when changes pass through linked steps.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        result: '1 × 1 × (−6) = −6'
      })
    ),
    ...fbox([
      ['CHAIN RULE', GOLD],
      'changes pass through links',
      ['multiply the link rates', GOLD]
    ], GOLD),
    ...say('CHAIN RULE: MULTIPLY THE RATES', GOLD)
  );

  // ------------------------------------------------------------
  // 26 — Why multiply?
  // Gear two turns twice as fast as gear one.
  // Gear three turns three times as fast as gear two.
  // Overall: 2 × 3 = 6.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...putPicture(
      ratioGearsPicture(
        0,
        0
      )
    ),
    ...fbox([
      'first gear',
      'starting speed = 1'
    ]),
    ...say('WHY DO THE RATES MULTIPLY?')
  );

  await until(S(26) + 2.15);

  await play(
    ...putPicture(
      ratioGearsPicture(
        Math.PI / 12,
        1
      )
    ),
    ...fbox([
      'second gear',
      ['turns 2 times as fast', C.violet]
    ], C.violet),
    ...say('SECOND GEAR: TWICE AS FAST', C.violet)
  );

  await until(S(26) + 4.5);

  await play(
    ...putPicture(
      ratioGearsPicture(
        Math.PI / 6,
        2
      )
    ),
    ...fbox([
      'third gear',
      '3 times the second',
      ['2 × 3 = 6', GOLD]
    ], GOLD),
    ...say('THIRD GEAR: SIX TIMES THE FIRST', GOLD)
  );

  for (let k = 3; k <= 10; k++) {
    await play(
      new M.Transform(
        pictureNow,
        ratioGearsPicture(
          k * Math.PI / 12,
          2
        ),
        { runTime: 0.24 }
      )
    );
  }

  // ------------------------------------------------------------
  // 27 — Now follow the small apartment.
  // Size step −1, area 40 m², rent 9.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...putPicture(
      apartmentPicture(0)
    ),
    ...fbox([
      ['small apartment', C.cyan],
      'area = 40 m²',
      'size step = −1',
      ['real rent = 9', C.cyan]
    ]),
    ...say('NOW FOLLOW THE SMALL APARTMENT')
  );

  // ------------------------------------------------------------
  // 28 — Small apartment:
  // guess = 10, miss = +1, squared miss = 1.
  // Its prediction is too high.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...putPicture(
      rentGraph(
        0,
        10,
        0,
        true
      )
    ),
    ...fbox([
      'guess = 10',
      'real rent = 9',
      ['miss = +1', C.violet]
    ], C.violet),
    ...say('THE SMALL APARTMENT IS GUESSED TOO HIGH', C.violet)
  );

  await until(S(28) + 2.80);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 0,
        reveal: 3
      })
    ),
    ...fbox([
      'guess = 10',
      'miss = 10 − 9 = +1',
      ['squared miss = 1', C.green]
    ], C.green),
    ...say('SMALL APARTMENT: SQUARED MISS = 1', C.green)
  );

  // ------------------------------------------------------------
  // 29 — Link one is always the apartment's size step.
  // Small apartment: rate −1.
  // Increasing step price lowers its prediction.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...putPicture(
      linkPicture({
        leftName: 'STEP PRICE',
        rightName: 'GUESS',
        leftBefore: 0,
        leftAfter: 1,
        rightBefore: 10,
        rightAfter: 9,
        color: C.cyan,
        moved: false
      })
    ),
    ...fbox([
      'guess = 10 + step price × (−1)',
      ['size step = −1', C.cyan]
    ]),
    ...say('LINK 1 RATE IS THE SIZE STEP')
  );

  await until(S(29) + 3.55);

  await play(
    ...putPicture(
      linkPicture({
        leftName: 'STEP PRICE',
        rightName: 'GUESS',
        leftBefore: 0,
        leftAfter: 1,
        rightBefore: 10,
        rightAfter: 9,
        rate: -1,
        color: C.cyan,
        moved: true
      })
    ),
    ...fbox([
      'step price increases by 1',
      'guess decreases by 1',
      ['rate = −1', GOLD]
    ], GOLD),
    ...say('BIGGER STEP PRICE, LOWER SMALL-APARTMENT GUESS')
  );

  // ------------------------------------------------------------
  // 30 — Link two = 1.
  // Link three = 2 × (+1) = 2.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 0,
        rates: [-1, 1, 2],
        activeLink: 2
      })
    ),
    ...fbox([
      'link 2 = 1',
      'link 3 = 2 × miss',
      '       = 2 × (+1)',
      ['       = 2', GOLD]
    ], GOLD),
    ...say('SMALL APARTMENT: LINK 3 RATE = +2', GOLD)
  );

  // ------------------------------------------------------------
  // 31 — Multiply the three rates.
  // −1 × 1 × 2 = −2.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...putPicture(
      rateProductPicture(
        [-1, 1, 2],
        -2
      )
    ),
    ...fbox([
      'small apartment',
      '(−1) × 1 × 2',
      ['total rate = −2', GOLD]
    ], GOLD),
    ...say('SMALL APARTMENT: TOTAL RATE = −2', GOLD)
  );

  // ------------------------------------------------------------
  // 32 — The middle apartment sits at size step zero.
  // Changing step price does not change its prediction.
  // Link one = 0; the whole chain rate is zero.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...putPicture(
      rentGraph(
        0,
        10,
        1
      )
    ),
    ...fbox([
      'middle apartment',
      'size step = 0',
      'guess = 10 + step price × 0'
    ]),
    ...say('THE MIDDLE APARTMENT SITS AT ZERO STEPS')
  );

  await until(S(32) + 2.30);

  await play(
    ...putPicture(
      rentGraph(
        2,
        10,
        1
      )
    ),
    ...fbox([
      'step price: 0 → 2',
      ['middle guess stays at 10', GOLD]
    ], GOLD),
    ...say('TILT THE LINE: MIDDLE GUESS DOES NOT MOVE', GOLD)
  );

  await until(S(32) + 4.65);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 1,
        rates: [0, 1, -2],
        activeLink: 0,
        result: '0 × 1 × (−2) = 0'
      })
    ),
    ...fbox([
      'first link = 0',
      '0 × 1 × (−2)',
      ['total rate = 0', GOLD]
    ], GOLD),
    ...say('MIDDLE APARTMENT: TOTAL RATE = 0', GOLD)
  );

  // ------------------------------------------------------------
  // 33 — Loss is the sum of the three squared misses.
  // Therefore add the separate apartment rates.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...putPicture(
      totalRatePicture(false)
    ),
    ...fbox([
      'loss = sum of squared misses',
      'each apartment contributes',
      ['its own rate', GOLD]
    ], GOLD),
    ...say('ADD THE THREE SEPARATE EFFECTS', GOLD)
  );

  // ------------------------------------------------------------
  // 34 — Add the rates:
  // −6 + (−2) + 0 = −8.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...putPicture(
      totalRatePicture(true)
    ),
    ...fbox([
      ['large:  −6', PINK],
      ['small:  −2', C.cyan],
      ['middle:  0', C.ink],
      ['total = −8', GOLD]
    ], GOLD),
    ...say('−6 − 2 + 0 = −8', GOLD)
  );

  // ------------------------------------------------------------
  // 35 — This matches the step-price partial derivative
  // from lesson 9.2.3.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...fbox([
      'chain rule total = −8',
      'earlier partial   = −8',
      ['exactly the same reading', C.green]
    ], C.green),
    ...say('MATCHES OUR STEP-PRICE PARTIAL DERIVATIVE', C.green)
  );

  // ------------------------------------------------------------
  // 36 — General formula:
  // the rate of the end with respect to the start
  // equals the product of the link rates.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        symbolic: true,
        rates: [1, 1, -6],
        result: '1 × 1 × (−6) = −6'
      })
    ),
    ...fbox([
      ['CHAIN RULE', GOLD],
      'end-to-start rate',
      ' = rate of link 1',
      ' × rate of link 2 × ...'
    ], GOLD),
    ...say('WHOLE-CHAIN RATE = PRODUCT OF LINK RATES', GOLD)
  );

  // ------------------------------------------------------------
  // 37 — In words:
  // follow the chain, read each rate, multiply.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        activeLink: 0
      })
    ),
    ...fbox([
      '1. follow the chain',
      '2. read each link rate',
      ['3. multiply', GOLD]
    ], GOLD),
    ...say('FOLLOW, READ, MULTIPLY', GOLD)
  );

  await until(S(37) + 1.50);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        activeLink: 1
      })
    )
  );

  await until(S(37) + 2.85);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        activeLink: 2,
        result: '1 × 1 × (−6) = −6'
      })
    )
  );

  // ------------------------------------------------------------
  // 38 — Large models contain long chains of linked steps.
  // Computers use the chain rule to find gradients
  // for every adjustable number.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...putPicture(
      longChainPicture(
        0,
        false
      )
    ),
    ...fbox([
      'large models',
      'many connected steps',
      ['many link rates', GOLD]
    ], GOLD),
    ...say('LARGE MODELS ARE LONG CHAINS')
  );

  for (let k = 1; k <= 5; k++) {
    await play(
      ...putPicture(
        longChainPicture(
          k,
          false
        )
      )
    );
  }

  await play(
    ...fbox([
      'chain rule',
      'find the rate for each knob',
      ['build the gradient', GOLD]
    ], GOLD),
    ...say('CHAIN RULE HELPS COMPUTE THE GRADIENT', GOLD)
  );

  // ------------------------------------------------------------
  // 39 — Backpropagation.
  // Work backward from the loss through the chain
  // toward each adjustable number.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...putPicture(
      longChainPicture(
        5,
        true
      )
    ),
    ...fbox([
      ['BACKPROPAGATION', GOLD],
      'start at the loss',
      'work backward'
    ], GOLD),
    ...say('BACKPROPAGATION: WORK BACKWARD', GOLD)
  );

  await until(S(39) + 1.50);

  await play(
    ...putPicture(
      longChainPicture(
        3,
        true
      )
    )
  );

  await until(S(39) + 2.90);

  await play(
    ...putPicture(
      longChainPicture(
        0,
        true
      )
    ),
    ...fbox([
      'loss → earlier steps',
      '     → model numbers',
      ['calculate each partial', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 40 — Trap:
  // adding link rates instead of multiplying them.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...putPicture(
      rateProductPicture(
        [1, 1, -6],
        null,
        '+',
        true
      )
    ),
    ...fbox([
      ['TRAP', PINK],
      'do not add rates',
      'inside a single chain'
    ], PINK),
    ...say('TRAP: ADDING INSTEAD OF MULTIPLYING', PINK)
  );

  // ------------------------------------------------------------
  // 41 — Wrong calculation:
  // 1 + 1 + (−6) = −4.
  //
  // Correct calculation:
  // 1 × 1 × (−6) = −6.
  //
  // Actual nudge gave −5.9, close to −6.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...putPicture(
      rateProductPicture(
        [1, 1, -6],
        -4,
        '+',
        true
      )
    ),
    ...fbox([
      'wrong: 1 + 1 + (−6)',
      ['= −4', PINK],
      'does not match the nudge'
    ], PINK),
    ...say('ADDING GIVES THE WRONG ANSWER: −4', PINK)
  );

  await until(S(41) + 3.25);

  await play(
    ...putPicture(
      rateProductPicture(
        [1, 1, -6],
        -6
      )
    ),
    ...fbox([
      'correct: 1 × 1 × (−6)',
      ['= −6', GOLD],
      'nudge gave −5.9',
      ['matches the local rate', C.green]
    ], C.green),
    ...say('MULTIPLYING GIVES THE CORRECT RATE: −6', C.green)
  );

  // ------------------------------------------------------------
  // 42 — Two distinct operations:
  //
  // Inside one chain: multiply.
  // Across separate apartments: add.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        result: '1 × 1 × (−6) = −6'
      })
    ),
    ...fbox([
      ['INSIDE ONE CHAIN', GOLD],
      'multiply link rates',
      '1 × 1 × (−6) = −6'
    ], GOLD),
    ...say('INSIDE A CHAIN: MULTIPLY', GOLD)
  );

  await until(S(42) + 2.60);

  await play(
    ...putPicture(
      totalRatePicture(true)
    ),
    ...fbox([
      ['ACROSS APARTMENTS', C.cyan],
      'add separate effects',
      ['−6 − 2 + 0 = −8', GOLD]
    ]),
    ...say('ACROSS SEPARATE APARTMENTS: ADD')
  );

  // ------------------------------------------------------------
  // 43 — Try it preview.
  // Pick an apartment, nudge the step price,
  // and watch each link light up with its rate.
  //
  // The actual interactive controls belong to the Try it
  // interface. This narrated scene previews their behaviour.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 0,
        s: 0,
        rates: [-1, 1, 2],
        activeNode: 0
      })
    ),
    ...fbox([
      ['TRY IT', GOLD],
      'choose an apartment',
      'nudge the step price'
    ], GOLD),
    ...say('PICK AN APARTMENT AND NUDGE ITS INPUT', GOLD)
  );

  await until(S(43) + 1.35);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 0,
        s: 0.1,
        reveal: 1,
        rates: [-1, null, null],
        activeLink: 0
      })
    ),
    ...fbox([
      'step price: 0 → 0.1',
      'guess: 10 → 9.9',
      ['link 1 rate = −1', C.cyan]
    ])
  );

  await until(S(43) + 2.60);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 0,
        s: 0.1,
        reveal: 2,
        rates: [-1, 1, null],
        activeLink: 1
      })
    ),
    ...fbox([
      'guess: 10 → 9.9',
      'miss: 1 → 0.9',
      ['link 2 rate = 1', GOLD]
    ], GOLD)
  );

  await until(S(43) + 3.90);

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 0,
        s: 0.1,
        rates: [-1, 1, null],
        activeLink: 2,
        result: '1 → 0.81'
      })
    ),
    ...fbox([
      'squared miss: 1 → 0.81',
      ['starting link 3 rate = 2', C.violet],
      'actual change = −0.19'
    ], C.violet),
    ...say('WATCH EACH LINK LIGHT UP', GOLD)
  );

  // ------------------------------------------------------------
  // 44 — Challenge:
  // Predict the total rate for middle rent.
  //
  // First link is now 1 for every apartment.
  // Link two remains 1.
  // Link three remains twice the miss.
  //
  // Leave the arithmetic to the learner.
  // Do not reveal the final answer before the Try it check.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...putPicture(
      totalRatePicture(
        true,
        true,
        true
      )
    ),
    ...fbox([
      ['YOUR CHALLENGE', GOLD],
      'change middle rent instead',
      'first link = 1 for all',
      ['predict the total rate', C.green]
    ], GOLD),
    ...say('WHAT IS THE MIDDLE-RENT PARTIAL DERIVATIVE?', GOLD)
  );

  // ------------------------------------------------------------
  // 45 — Recap.
  //
  // The chain rule finds how a change travels through
  // linked steps by multiplying the rate of each link.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...putPicture(
      chainPicture({
        apartmentIndex: 2,
        rates: [1, 1, -6],
        result: '1 × 1 × (−6) = −6'
      })
    ),
    ...fbox([
      ['CHAIN RULE', GOLD],
      'follow linked changes',
      'read each link rate',
      ['multiply the rates', GOLD]
    ], GOLD),
    ...say('CHAIN RULE: MULTIPLY ALONG THE CHAIN', GOLD)
  );

  await until(S(45) + 3.05);

  await play(
    ...putPicture(
      totalRatePicture(true)
    ),
    ...fbox([
      ['INSIDE A CHAIN: MULTIPLY', GOLD],
      ['ACROSS EFFECTS: ADD', C.cyan],
      'total step-price rate',
      ['= −8', GOLD]
    ], GOLD),
    ...say('MULTIPLY LINKS, ADD SEPARATE EFFECTS')
  );

  await until(E(45));
}

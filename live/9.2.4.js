// lesson 9.2.4
// Gradients — live manim-web lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter example: apartment rent, two adjustable numbers.
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

  const GOLD = C.amber;
  const PINK = C.pink || '#F472B6';

  const loss = (s, m) =>
    2 * (s - 2) ** 2 + 3 * (m - 11) ** 2;

  const partialS = (s, m) =>
    4 * (s - 2);

  const partialM = (s, m) =>
    6 * (m - 11);

  const gradient = (s, m) => [
    partialS(s, m),
    partialM(s, m)
  ];

  const gradientLength = (s, m) => {
    const [a, b] = gradient(s, m);
    return Math.hypot(a, b);
  };

  const START = [0, 10];
  const MINIMUM = [2, 11];

  const G0 = gradient(...START);
  const LENGTH0 = gradientLength(...START);

  // Starting gradient: (−8, −6).
  // Gradient length: 10.
  // Opposite direction: (8, 6).
  // Unit downhill direction: (0.8, 0.6).

  const UPHILL_END = [-8, 4];
  const DOWNHILL_END = [8, 16];

  const fmt = (n, places = 4) =>
    String(Number(n.toFixed(places)))
      .replace('-', '−');

  const signed = (n, places = 4) =>
    n > 0
      ? `+${fmt(n, places)}`
      : fmt(n, places);

  const pair = (a, b) =>
    `(${fmt(a)}, ${fmt(b)})`;

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
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  // Arrow constructed from ordinary Line objects.
  // All parts are created before the group appears.

  function arrow(
    a,
    b,
    color = GOLD,
    width = 3,
    head = 0.13
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

  const fade = (...objects) =>
    objects.filter(Boolean).map(
      o => new M.FadeOut(o)
    );

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

  // Main picture and temporary marks are separate objects.
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
  // FOGGY HILLSIDE INTRODUCTION
  // ------------------------------------------------------------

  function fogPicture() {
    const cy = P ? -1.05 : -0.35;

    const items = [];

    const terrain = [
      [-2.65, 1.02],
      [-2.20, 0.82],
      [-1.75, 0.57],
      [-1.30, 0.32],
      [-0.85, 0.08],
      [-0.40, -0.12],
      [0, -0.26],
      [0.45, -0.40],
      [0.90, -0.49],
      [1.35, -0.52],
      [1.80, -0.45],
      [2.25, -0.31],
      [2.65, -0.12]
    ];

    for (let k = 0; k < terrain.length - 1; k++) {
      const a = terrain[k];
      const b = terrain[k + 1];

      const c =
        k >= 4 && k <= 7
          ? C.cyan
          : '#34465C';

      items.push(line(
        [CX + a[0], cy + a[1], 0],
        [CX + b[0], cy + b[1], 0],
        c,
        k >= 4 && k <= 7
          ? 3.7
          : 2.0
      ));
    }

    // Faint fog bands hide the distant terrain.

    for (let k = 0; k < 5; k++) {
      const y = cy + 0.95 - k * 0.27;

      items.push(line(
        [CX - 2.60, y, 0],
        [CX - 0.80, y, 0],
        '#36485E',
        5
      ));

      items.push(line(
        [CX + 0.80, y + 0.10, 0],
        [CX + 2.60, y + 0.10, 0],
        '#36485E',
        5
      ));
    }

    const foot = [
      CX,
      cy - 0.26,
      0
    ];

    const head = new M.Circle({
      radius: 0.13,
      color: C.ink,
      strokeWidth: 2
    });

    head.setFill(C.ink, 1);
    head.moveTo([
      CX,
      cy + 0.75,
      0
    ]);

    items.push(head);

    items.push(
      line(
        [CX, cy + 0.59, 0],
        [CX, cy + 0.18, 0],
        C.ink,
        3.2
      ),

      line(
        [CX - 0.22, cy + 0.36, 0],
        [CX + 0.22, cy + 0.36, 0],
        C.ink,
        3
      ),

      line(
        [CX, cy + 0.18, 0],
        [CX - 0.18, cy - 0.19, 0],
        C.ink,
        3
      ),

      line(
        [CX, cy + 0.18, 0],
        [CX + 0.18, cy - 0.31, 0],
        C.ink,
        3
      ),

      glowDot(
        foot,
        GOLD,
        0.10
      ),

      txt(
        'you are here',
        18,
        GOLD,
        [CX, cy - 0.80, 0]
      ),

      txt(
        'only the ground nearby is visible',
        17,
        C.muted,
        [CX, cy - 1.22, 0],
        false,
        5.40
      )
    );

    return new M.VGroup(...items);
  }

  function fogQuestions() {
    const cy = P ? -1.05 : -0.35;

    const a = [
      CX - 0.38,
      cy + 0.18,
      0
    ];

    const b = [
      CX - 1.27,
      cy + 0.72,
      0
    ];

    const c = [
      CX + 0.38,
      cy + 0.02,
      0
    ];

    const d = [
      CX + 1.30,
      cy - 0.30,
      0
    ];

    return new M.VGroup(
      arrow(a, b, GOLD, 3.2),

      arrow(c, d, C.cyan, 3.2),

      txt(
        '?',
        27,
        GOLD,
        [b[0] - 0.18, b[1] + 0.28, 0],
        true
      ),

      txt(
        '?',
        27,
        C.cyan,
        [d[0] + 0.18, d[1] - 0.30, 0],
        true
      )
    );
  }

  // ------------------------------------------------------------
  // LOSS MAP COORDINATES
  // ------------------------------------------------------------

  // Near map uses the same bounds and colours as lesson 9.2.3.
  //
  // Wide map is used when the complete gradient vector
  // must fit inside the frame.
  //
  // Within each map, both data axes have equal scale.
  // This preserves vector lengths, angles and perpendicularity.

  const NEAR = {
    smin: -1.4,
    smax: 5.4,
    mmin: 8.4,
    mmax: 13.6,
    scenter: 2,
    mcenter: 11,
    unit: P ? 0.80 : 0.62,
    cy: P ? -1.35 : -0.52,
    xticks: [-1, 0, 1, 2, 3, 4, 5],
    yticks: [9, 10, 11, 12, 13],
    levels: [1, 3, 6, 8, 11, 16, 24],
    heatStep: 4,
    nx: 23,
    ny: 18
  };

  const WIDE = {
    smin: -9,
    smax: 9,
    mmin: 3,
    mmax: 17,
    scenter: 0,
    mcenter: 10,
    unit: P ? 0.30 : 0.22,
    cy: P ? -1.35 : -0.52,
    xticks: [-8, -4, 0, 4, 8],
    yticks: [4, 7, 10, 13, 16],
    levels: [
      3, 11, 24, 50,
      80, 120, 147, 200
    ],
    heatStep: 36,
    nx: 25,
    ny: 19
  };

  function mapPoint(G, s, m) {
    return [
      CX + (s - G.scenter) * G.unit,
      G.cy + (m - G.mcenter) * G.unit,
      0
    ];
  }

  function mapBounds(G) {
    return {
      x0: mapPoint(G, G.smin, G.mcenter)[0],
      x1: mapPoint(G, G.smax, G.mcenter)[0],
      y0: mapPoint(G, G.scenter, G.mmin)[1],
      y1: mapPoint(G, G.scenter, G.mmax)[1]
    };
  }

  function inMap(G, s, m) {
    return (
      s >= G.smin &&
      s <= G.smax &&
      m >= G.mmin &&
      m <= G.mmax
    );
  }

  // ------------------------------------------------------------
  // MAP COLOUR SCALE
  // ------------------------------------------------------------

  const HEAT = [
    '#101B2D',
    '#142943',
    '#193D5A',
    '#205473',
    '#286F89',
    '#3696A8',
    '#58C4C8',
    '#91E9DE'
  ];

  function heatColor(G, v) {
    const k = Math.max(
      0,
      Math.min(
        HEAT.length - 1,
        Math.floor(v / G.heatStep)
      )
    );

    return HEAT[k];
  }

  function heatParts(G) {
    const items = [];

    const ds =
      (G.smax - G.smin) / G.nx;

    const dm =
      (G.mmax - G.mmin) / G.ny;

    for (let j = 0; j < G.ny; j++) {
      for (let i = 0; i < G.nx; i++) {
        const s =
          G.smin + (i + 0.5) * ds;

        const m =
          G.mmin + (j + 0.5) * dm;

        const c = heatColor(
          G,
          loss(s, m)
        );

        items.push(rect(
          ds * G.unit * 1.012,
          dm * G.unit * 1.012,
          mapPoint(G, s, m),
          c,
          0.90,
          0
        ));
      }
    }

    return items;
  }

  function mapAxes(G) {
    const B = mapBounds(G);
    const items = [];

    const gridColor = '#426078';

    G.xticks.forEach(s => {
      const a = mapPoint(G, s, G.mmin);
      const b = mapPoint(G, s, G.mmax);

      items.push(line(
        a,
        b,
        gridColor,
        0.65
      ));

      items.push(txt(
        fmt(s),
        16,
        C.ink,
        [a[0], B.y0 - 0.25, 0],
        true
      ));
    });

    G.yticks.forEach(m => {
      const a = mapPoint(G, G.smin, m);
      const b = mapPoint(G, G.smax, m);

      items.push(line(
        a,
        b,
        gridColor,
        0.65
      ));

      items.push(txt(
        fmt(m),
        16,
        C.ink,
        [B.x0 - 0.29, a[1], 0],
        true
      ));
    });

    items.push(
      line(
        [B.x0, B.y0, 0],
        [B.x1, B.y0, 0],
        C.muted,
        2.4
      ),

      line(
        [B.x0, B.y0, 0],
        [B.x0, B.y1, 0],
        C.muted,
        2.4
      ),

      line(
        [B.x0, B.y1, 0],
        [B.x1, B.y1, 0],
        C.muted,
        1.2
      ),

      line(
        [B.x1, B.y0, 0],
        [B.x1, B.y1, 0],
        C.muted,
        1.2
      )
    );

    items.push(txt(
      'step price',
      18,
      C.muted,
      [CX, B.y0 - 0.59, 0]
    ));

    items.push(txt(
      G === WIDE
        ? 'middle rent (zoomed out)'
        : 'middle rent',
      18,
      C.muted,
      [CX, B.y1 + 0.31, 0],
      false,
      5.45
    ));

    return items;
  }

  // ------------------------------------------------------------
  // EXACT LOSS CONTOURS
  // ------------------------------------------------------------

  // A contour of loss k satisfies:
  //
  //   2(s − 2)² + 3(m − 11)² = k
  //
  // Its parametrization is:
  //
  //   s = 2  + sqrt(k / 2) cos(theta)
  //   m = 11 + sqrt(k / 3) sin(theta)

  function contourParts(
    G,
    level,
    color = C.cyan,
    width = 1.8,
    n = 72
  ) {
    const rs = Math.sqrt(level / 2);
    const rm = Math.sqrt(level / 3);

    const items = [];

    for (let i = 0; i < n; i++) {
      const a = 2 * Math.PI * i / n;
      const b = 2 * Math.PI * (i + 1) / n;

      const s0 = 2 + rs * Math.cos(a);
      const m0 = 11 + rm * Math.sin(a);

      const s1 = 2 + rs * Math.cos(b);
      const m1 = 11 + rm * Math.sin(b);

      if (
        inMap(G, s0, m0) &&
        inMap(G, s1, m1)
      ) {
        items.push(line(
          mapPoint(G, s0, m0),
          mapPoint(G, s1, m1),
          color,
          width
        ));
      }
    }

    return items;
  }

  function contourLabel(
    G,
    level,
    theta,
    color = C.ink
  ) {
    const s =
      2 +
      Math.sqrt(level / 2) *
      Math.cos(theta);

    const m =
      11 +
      Math.sqrt(level / 3) *
      Math.sin(theta);

    if (!inMap(G, s, m)) {
      return [];
    }

    const p = mapPoint(G, s, m);

    const lab = txt(
      fmt(level),
      15,
      color,
      p,
      true
    );

    const backing = rounded(
      Math.max(
        0.32,
        lab.getWidth() + 0.14
      ),
      0.25,
      p,
      C.muted,
      0.95
    );

    return [
      new M.VGroup(backing, lab)
    ];
  }

  function mapPicture(G = NEAR) {
    const items = [
      ...heatParts(G),
      ...mapAxes(G)
    ];

    G.levels.forEach(level => {
      items.push(...contourParts(
        G,
        level,
        level === 11
          ? '#9CDDDC'
          : '#70B8C5',
        level === 11 ? 2.1 : 1.45
      ));
    });

    if (G === NEAR) {
      items.push(
        ...contourLabel(G, 3, 0.24),
        ...contourLabel(G, 8, Math.PI / 2),
        ...contourLabel(G, 11, -0.55),
        ...contourLabel(G, 16, 2.40)
      );
    } else {
      items.push(
        ...contourLabel(G, 24, 2.35),
        ...contourLabel(G, 80, 2.60),
        ...contourLabel(G, 147, 4.0)
      );
    }

    return new M.VGroup(...items);
  }

  function pointLabel(
    G,
    s,
    m,
    label,
    color = GOLD,
    dx = 0.55,
    dy = 0.30
  ) {
    const p = mapPoint(G, s, m);

    return new M.VGroup(
      glowDot(
        p,
        color,
        0.115
      ),

      txt(
        label,
        17,
        color,
        [p[0] + dx, p[1] + dy, 0],
        true,
        2.20
      )
    );
  }

  function minimumMarks(G = NEAR) {
    const p = mapPoint(
      G,
      ...MINIMUM
    );

    return new M.VGroup(
      glowDot(
        p,
        C.green,
        0.115
      ),

      ring(
        p,
        C.green,
        0.19
      ),

      txt(
        'loss 0',
        17,
        C.green,
        [
          p[0] + 0.55,
          p[1] - 0.26,
          0
        ],
        true
      )
    );
  }

  function startMarks(G = NEAR) {
    const p = mapPoint(G, ...START);

    return new M.VGroup(
      dash(
        mapPoint(G, 0, G.mmin),
        p,
        GOLD,
        1.7
      ),

      dash(
        mapPoint(G, G.smin, 10),
        p,
        GOLD,
        1.7
      ),

      glowDot(
        p,
        GOLD,
        0.13
      ),

      pill('loss 11', GOLD, 18).moveTo([p[0] + 0.82, p[1] - 0.31, 0])
    );
  }

  // ------------------------------------------------------------
  // INDIVIDUAL PARTIAL DERIVATIVES
  // ------------------------------------------------------------

  function partialMarks(
    G,
    showS = true,
    showM = true,
    showValues = true
  ) {
    const p = mapPoint(G, ...START);

    const items = [
      glowDot(
        p,
        GOLD,
        0.13
      )
    ];

    if (showS) {
      const b = mapPoint(
        G,
        1.40,
        10
      );

      items.push(arrow(
        p,
        b,
        C.cyan,
        3.5
      ));

      items.push(txt(
        showValues ? '−8' : '?',
        23,
        C.cyan,
        [
          (p[0] + b[0]) / 2,
          p[1] - 0.28,
          0
        ],
        true
      ));
    }

    if (showM) {
      const b = mapPoint(
        G,
        0,
        11.40
      );

      items.push(arrow(
        p,
        b,
        C.violet,
        3.5
      ));

      items.push(txt(
        showValues ? '−6' : '?',
        23,
        C.violet,
        [
          b[0] - 0.44,
          (p[1] + b[1]) / 2,
          0
        ],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // GRADIENT VECTOR HELPERS
  // ------------------------------------------------------------

  // The full gradient can be drawn at data scale on WIDE.
  //
  // On NEAR, short arrows use a common multiplier so that
  // the direction and relative vector lengths are preserved.
  // Whenever shortened, the arrow is identified as scaled.

  const LOCAL_SCALE = 0.12;

  function vectorEnd(
    s,
    m,
    direction = 1,
    factor = 1
  ) {
    const [a, b] = gradient(s, m);

    return [
      s + direction * factor * a,
      m + direction * factor * b
    ];
  }

  function gradientArrow(
    G,
    s,
    m,
    direction = 1,
    factor = 1,
    color = GOLD,
    width = 4
  ) {
    const end = vectorEnd(
      s,
      m,
      direction,
      factor
    );

    return arrow(
      mapPoint(G, s, m),
      mapPoint(G, ...end),
      color,
      width,
      0.17
    );
  }

  function gradientMarks(
    G,
    s = 0,
    m = 10,
    direction = 1,
    factor = 1,
    label = true
  ) {
    const [a, b] = gradient(s, m);

    const start = mapPoint(
      G,
      s,
      m
    );

    const end = mapPoint(
      G,
      ...vectorEnd(
        s,
        m,
        direction,
        factor
      )
    );

    const items = [
      gradientArrow(
        G,
        s,
        m,
        direction,
        factor,
        GOLD,
        4.0
      ),

      glowDot(
        start,
        GOLD,
        0.13
      )
    ];

    if (label) {
      const value = pair(
        direction * a,
        direction * b
      );

      const midX = (start[0] + end[0]) / 2;
      const midY = (start[1] + end[1]) / 2;
      items.push(pill(value, GOLD, 20)
        .moveTo([midX + 0.42, midY - 0.55, 0]));
    }

    return new M.VGroup(...items);
  }

  function gradientComponents(
    G,
    showDiagonal = true,
    direction = 1,
    factor = 1
  ) {
    const a = direction * G0[0];
    const b = direction * G0[1];

    const p0 = mapPoint(G, ...START);

    const p1 = mapPoint(
      G,
      START[0] + factor * a,
      START[1]
    );

    const p2 = mapPoint(
      G,
      START[0] + factor * a,
      START[1] + factor * b
    );

    const items = [
      arrow(
        p0,
        p1,
        C.cyan,
        3.5
      ),

      arrow(
        p1,
        p2,
        C.violet,
        3.5
      ),

      txt(
        signed(a),
        21,
        C.cyan,
        [
          (p0[0] + p1[0]) / 2,
          p0[1] + 0.24,
          0
        ],
        true
      ),

      pill(signed(b), C.violet, 21)
        .moveTo([p1[0] + (direction > 0 ? 0.49 : -0.49), (p1[1] + p2[1]) / 2, 0]),

      glowDot(
        p0,
        GOLD,
        0.13
      )
    ];

    if (showDiagonal) {
      items.push(arrow(
        p0,
        p2,
        GOLD,
        4.1,
        0.18
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // TWO PARTIALS BECOME ONE ORDERED PAIR
  // ------------------------------------------------------------

  function orderedPairPicture(
    showNumbers = true,
    showPair = true
  ) {
    const cy = P ? -0.65 : -0.27;

    const w = P ? 2.65 : 2.60;
    const h = 1.65;

    const xs = [
      CX - 1.48,
      CX + 1.48
    ];

    const names = [
      'STEP PRICE',
      'MIDDLE RENT'
    ];

    const colors = [
      C.cyan,
      C.violet
    ];

    const vals = ['−8', '−6'];

    const items = [];

    xs.forEach((x, k) => {
      items.push(rounded(
        w,
        h,
        [x, cy, 0],
        colors[k]
      ));

      items.push(txt(
        `${k + 1}. ${names[k]}`,
        17,
        colors[k],
        [x, cy + 0.48, 0],
        true,
        w - 0.22
      ));

      items.push(txt(
        showNumbers ? vals[k] : '?',
        34,
        colors[k],
        [x, cy - 0.13, 0],
        true
      ));
    });

    if (showPair) {
      const outY = cy - 1.52;

      items.push(arrow(
        [xs[0], cy - h / 2 - 0.04, 0],
        [CX - 0.64, outY + 0.36, 0],
        C.cyan,
        2.3
      ));

      items.push(arrow(
        [xs[1], cy - h / 2 - 0.04, 0],
        [CX + 0.64, outY + 0.36, 0],
        C.violet,
        2.3
      ));

      items.push(rounded(
        3.25,
        0.75,
        [CX, outY, 0],
        GOLD
      ));

      items.push(txt(
        showNumbers
          ? '(−8, −6)'
          : '( ?, ? )',
        29,
        GOLD,
        [CX, outY, 0],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // VECTOR LENGTH TRIANGLE
  // ------------------------------------------------------------

  // A separate, enlarged geometric picture.
  // Its horizontal and vertical units have identical scale.

  const TRI_UNIT = P ? 0.45 : 0.34;

  const TRI_A = [
    CX + 4 * TRI_UNIT,
    P ? 0.60 : 0.73,
    0
  ];

  const TRI_B = [
    TRI_A[0] - 8 * TRI_UNIT,
    TRI_A[1],
    0
  ];

  const TRI_D = [
    TRI_B[0],
    TRI_B[1] - 6 * TRI_UNIT,
    0
  ];

  function rightAngle(
    p,
    u,
    v,
    size = 0.16,
    color = C.ink
  ) {
    const a = [
      p[0] + u[0] * size,
      p[1] + u[1] * size,
      0
    ];

    const b = [
      p[0] + (u[0] + v[0]) * size,
      p[1] + (u[1] + v[1]) * size,
      0
    ];

    const c = [
      p[0] + v[0] * size,
      p[1] + v[1] * size,
      0
    ];

    return new M.VGroup(
      line(a, b, color, 2),
      line(b, c, color, 2)
    );
  }

  function lengthTriangle(
    showLength = false,
    showQuestion = false
  ) {
    const midX =
      (TRI_A[0] + TRI_D[0]) / 2;

    const midY =
      (TRI_A[1] + TRI_D[1]) / 2;

    const items = [
      arrow(
        TRI_A,
        TRI_B,
        C.cyan,
        3.8,
        0.15
      ),

      arrow(
        TRI_B,
        TRI_D,
        C.violet,
        3.8,
        0.15
      ),

      arrow(
        TRI_A,
        TRI_D,
        GOLD,
        4.5,
        0.19
      ),

      glowDot(
        TRI_A,
        GOLD,
        0.10
      ),

      rightAngle(
        TRI_B,
        [1, 0],
        [0, -1],
        0.20
      ),

      txt(
        '8',
        27,
        C.cyan,
        [
          (TRI_A[0] + TRI_B[0]) / 2,
          TRI_A[1] + 0.30,
          0
        ],
        true
      ),

      txt(
        '6',
        27,
        C.violet,
        [
          TRI_B[0] - 0.35,
          (TRI_B[1] + TRI_D[1]) / 2,
          0
        ],
        true
      )
    ];

    if (showLength || showQuestion) {
      items.push(txt(
        showLength ? '10' : '?',
        30,
        GOLD,
        [
          midX + 0.42,
          midY - 0.38,
          0
        ],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // SQUARES USED TO FIND THE ARROW LENGTH
  // ------------------------------------------------------------

  // Each small square represents one square unit.
  // The two groups contain exactly 64 and 36 units.

  function squareUnitsPicture(
    showTotal = false
  ) {
    const u = P ? 0.25 : 0.20;
    const cy = P ? -0.80 : -0.36;

    const centers = [
      CX - 1.53,
      CX + 1.53
    ];

    const ns = [8, 6];

    const colors = [
      C.cyan,
      C.violet
    ];

    const items = [];

    ns.forEach((n, k) => {
      const x = centers[k];

      const y =
        cy + (P ? 0.16 : 0.12);

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          items.push(rect(
            u * 0.91,
            u * 0.91,
            [
              x + (i - (n - 1) / 2) * u,
              y + (j - (n - 1) / 2) * u,
              0
            ],
            colors[k],
            0.82,
            0.8
          ));
        }
      }

      items.push(txt(
        `${n} × ${n}`,
        21,
        colors[k],
        [
          x,
          cy + 8 * u / 2 + 0.44,
          0
        ],
        true
      ));

      items.push(txt(
        String(n * n),
        28,
        colors[k],
        [
          x,
          cy - 8 * u / 2 - 0.31,
          0
        ],
        true
      ));
    });

    items.push(txt(
      '+',
      28,
      C.ink,
      [CX, cy, 0]
    ));

    if (showTotal) {
      const y =
        cy - 8 * u / 2 - 0.87;

      items.push(txt(
        '64 + 36 = 100',
        25,
        GOLD,
        [CX, y, 0],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  function hundredSquare() {
    const u = P ? 0.29 : 0.22;

    const cy = P ? -1.05 : -0.43;

    const items = [];

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        items.push(rect(
          u * 0.91,
          u * 0.91,
          [
            CX + (i - 4.5) * u,
            cy + (j - 4.5) * u,
            0
          ],
          GOLD,
          0.82,
          0.8
        ));
      }
    }

    items.push(rect(
      u * 10 + 0.07,
      u * 10 + 0.07,
      [CX, cy, 0],
      GOLD,
      0,
      2.1
    ));

    items.push(txt(
      '10',
      24,
      GOLD,
      [
        CX,
        cy + 5 * u + 0.31,
        0
      ],
      true
    ));

    items.push(txt(
      '10',
      24,
      GOLD,
      [
        CX - 5 * u - 0.36,
        cy,
        0
      ],
      true
    ));

    items.push(txt(
      '100 square units',
      19,
      C.ink,
      [
        CX,
        cy - 5 * u - 0.32,
        0
      ],
      true
    ));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // COMPARE UPHILL RATES
  // ------------------------------------------------------------

  // Equal-length directions are compared.
  //
  // Unit left:      (−1, 0), rate +8.
  // Unit down:      (0, −1), rate +6.
  // Unit gradient:  (−0.8, −0.6), rate +10.

  function uphillRatePicture() {
    const cy = P ? -0.35 : -0.09;

    const rowH = P ? 1.02 : 0.72;

    const left = CX - 0.95;
    const maxW = 3.15;

    const rows = [
      {
        label: 'LEFT',
        value: 8,
        color: C.cyan,
        direction: [-1, 0]
      },
      {
        label: 'DOWN',
        value: 6,
        color: C.violet,
        direction: [0, -1]
      },
      {
        label: 'GRADIENT',
        value: 10,
        color: GOLD,
        direction: [-0.8, -0.6]
      }
    ];

    const items = [];

    items.push(txt(
      'LOSS RISE PER TINY UNIT',
      18,
      C.muted,
      [
        CX,
        cy + rowH * 0.90,
        0
      ],
      true,
      5.30
    ));

    rows.forEach((q, k) => {
      const y = cy - k * rowH;

      const arrowCenter = [
        CX - 2.35,
        y,
        0
      ];

      const length = 0.52;

      const dx =
        q.direction[0] * length / 2;

      const dy =
        q.direction[1] * length / 2;

      items.push(arrow(
        [
          arrowCenter[0] - dx,
          arrowCenter[1] - dy,
          0
        ],
        [
          arrowCenter[0] + dx,
          arrowCenter[1] + dy,
          0
        ],
        q.color,
        3.2
      ));

      items.push(txt(
        q.label,
        15,
        q.color,
        [CX - 1.62, y, 0],
        true,
        1.22
      ));

      items.push(rect(
        maxW,
        0.34,
        [
          left + maxW / 2,
          y,
          0
        ],
        C.muted,
        0.10,
        1
      ));

      const w =
        maxW * q.value / 10;

      items.push(rect(
        w,
        0.34,
        [
          left + w / 2,
          y,
          0
        ],
        q.color,
        0.85,
        1.1
      ));

      items.push(txt(
        `+${q.value}`,
        21,
        q.color,
        [
          left + maxW + 0.40,
          y,
          0
        ],
        true
      ));
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // GRADIENT PERPENDICULAR TO A CONTOUR
  // ------------------------------------------------------------

  // At (0, 10), gradient = (−8, −6).
  //
  // A unit vector in the gradient direction:
  //   u = (−0.8, −0.6)
  //
  // A unit tangent to the contour:
  //   v = (0.6, −0.8)
  //
  // Their dot product is zero.

  function perpendicularMarks(G = NEAR) {
    const p = mapPoint(
      G,
      ...START
    );

    const u = [-0.8, -0.6];
    const v = [0.6, -0.8];

    const tangentLength = 0.54;

    const a = [
      p[0] - v[0] * tangentLength,
      p[1] - v[1] * tangentLength,
      0
    ];

    const b = [
      p[0] + v[0] * tangentLength,
      p[1] + v[1] * tangentLength,
      0
    ];

    const gradEnd = [
      p[0] + u[0] * 0.75,
      p[1] + u[1] * 0.75,
      0
    ];

    return new M.VGroup(
      ...contourParts(
        G,
        11,
        C.cyan,
        3.5,
        96
      ),

      line(
        a,
        b,
        C.ink,
        3.1
      ),

      arrow(
        p,
        gradEnd,
        GOLD,
        4.2,
        0.16
      ),

      rightAngle(
        p,
        u,
        v,
        0.16,
        C.ink
      ),

      glowDot(
        p,
        GOLD,
        0.10
      ),

      txt(
        '90°',
        18,
        C.ink,
        [
          p[0] - 0.03,
          p[1] - 0.49,
          0
        ],
        true
      ),

      txt(
        'same loss',
        17,
        C.cyan,
        mapPoint(G, 3.05, 9.45),
        false,
        1.70
      )
    );
  }

  // ------------------------------------------------------------
  // UPHILL AND DOWNHILL DIRECTIONS
  // ------------------------------------------------------------

  function oppositeDirections(G = NEAR) {
    const p = mapPoint(
      G,
      ...START
    );

    const uphill = mapPoint(
      G,
      ...vectorEnd(
        ...START,
        1,
        LOCAL_SCALE
      )
    );

    const downhill = mapPoint(
      G,
      ...vectorEnd(
        ...START,
        -1,
        LOCAL_SCALE
      )
    );

    return new M.VGroup(
      arrow(
        p,
        uphill,
        C.ink,
        3.0
      ),

      arrow(
        p,
        downhill,
        GOLD,
        4.4,
        0.17
      ),

      glowDot(
        p,
        GOLD,
        0.13
      ),

      pill('uphill', C.ink, 16)
        .moveTo([uphill[0] + 0.62, uphill[1] - 0.12, 0]),

      pill('downhill', GOLD, 17)
        .moveTo([downhill[0] - 0.12, downhill[1] + 0.36, 0])
    );
  }

  function ratioPicture(
    reduced = false
  ) {
    const cy = P ? -0.95 : -0.45;

    const unit = P ? 0.43 : 0.34;

    const a = [
      CX - 4 * unit,
      cy - 3 * unit,
      0
    ];

    const b = [
      CX + 4 * unit,
      cy - 3 * unit,
      0
    ];

    const d = [
      CX + 4 * unit,
      cy + 3 * unit,
      0
    ];

    const items = [
      arrow(
        a,
        b,
        C.cyan,
        3.5,
        0.15
      ),

      arrow(
        b,
        d,
        C.violet,
        3.5,
        0.15
      ),

      arrow(
        a,
        d,
        GOLD,
        4.3,
        0.18
      ),

      rightAngle(
        b,
        [-1, 0],
        [0, 1],
        0.18
      ),

      txt(
        reduced ? '4 parts' : '8 parts',
        21,
        C.cyan,
        [
          (a[0] + b[0]) / 2,
          a[1] - 0.28,
          0
        ],
        true
      ),

      txt(
        reduced ? '3 parts' : '6 parts',
        20,
        C.violet,
        [
          b[0] + 0.64,
          (b[1] + d[1]) / 2,
          0
        ],
        true,
        1.22
      ),

      txt(
        'raise both knobs',
        18,
        GOLD,
        [
          CX - 0.45,
          cy + 0.53,
          0
        ],
        false,
        2.45
      )
    ];

    return new M.VGroup(...items);
  }

  function valleyDirectionMarks(G = NEAR) {
    const p = mapPoint(
      G,
      ...START
    );

    // A short move along (8, 6).

    const endS = 1.20;
    const endM = 10.90;

    const q = mapPoint(
      G,
      endS,
      endM
    );

    const best = mapPoint(
      G,
      ...MINIMUM
    );

    return new M.VGroup(
      glowDot(
        p,
        GOLD,
        0.13
      ),

      arrow(
        p,
        q,
        GOLD,
        4.4,
        0.17
      ),

      dash(
        p,
        best,
        C.green,
        2.2
      ),

      glowDot(
        best,
        C.green,
        0.12
      ),

      ring(
        best,
        C.green,
        0.19
      ),

      pill('lowest spot', C.green, 16)
        .moveTo([best[0] + 0.90, best[1] - 0.39, 0]),

      pill('downhill', GOLD, 16)
        .moveTo([q[0] - 0.05, q[1] + 0.40, 0])
    );
  }

  // ------------------------------------------------------------
  // MANY-KNOB MODEL
  // ------------------------------------------------------------

  function manyKnobsPicture(
    highlight = false
  ) {
    const cy = P ? -0.72 : -0.42;

    const w = 5.55;
    const h = P ? 3.70 : 2.95;

    const items = [
      rounded(
        w,
        h,
        [CX, cy, 0],
        C.muted
      ),

      txt(
        'MANY MODEL NUMBERS',
        20,
        C.ink,
        [
          CX,
          cy + h / 2 - 0.32,
          0
        ],
        true,
        w - 0.30
      )
    ];

    for (let k = 0; k < 8; k++) {
      const col = k % 4;
      const row = Math.floor(k / 4);

      const x =
        CX + (col - 1.5) * 1.25;

      const y =
        cy + 0.35 -
        row * (P ? 1.08 : 0.90);

      const c =
        highlight ? GOLD : C.muted;

      const r = new M.Circle({
        radius: 0.25,
        color: c,
        strokeWidth: 2
      });

      r.setFill(C.card, 1);
      r.moveTo([x, y, 0]);

      items.push(r);

      const a =
        Math.PI * (0.22 + k * 0.14);

      items.push(line(
        [x, y, 0],
        [
          x + Math.cos(a) * 0.20,
          y + Math.sin(a) * 0.20,
          0
        ],
        c,
        3
      ));

      items.push(txt(
        highlight
          ? `rate ${k + 1}`
          : `knob ${k + 1}`,
        14,
        c,
        [x, y - 0.42, 0],
        true,
        1.15
      ));
    }

    items.push(txt(
      highlight
        ? 'one gradient: a list of all the rates'
        : 'too many directions to draw',
      16,
      highlight ? GOLD : C.muted,
      [
        CX,
        cy - h / 2 + 0.25,
        0
      ],
      false,
      w - 0.35
    ));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // OVERSHOOT PICTURE
  // ------------------------------------------------------------

  function overshootMarks(
    G = WIDE,
    showEnd = false,
    showLoss = false
  ) {
    const p = mapPoint(
      G,
      ...START
    );

    const q = mapPoint(
      G,
      ...DOWNHILL_END
    );

    const best = mapPoint(
      G,
      ...MINIMUM
    );

    const items = [
      arrow(
        p,
        q,
        GOLD,
        4.5,
        0.17
      ),

      glowDot(
        p,
        GOLD,
        0.12
      ),

      glowDot(
        best,
        C.green,
        0.085
      ),

      txt(
        'start: 11',
        17,
        GOLD,
        [
          p[0] - 0.62,
          p[1] - 0.31,
          0
        ],
        true,
        1.40
      )
    ];

    if (showEnd) {
      const endColor =
        showLoss ? PINK : GOLD;

      items.push(glowDot(
        q,
        endColor,
        0.13
      ));

      items.push(ring(
        q,
        endColor,
        0.20
      ));

      items.push(txt(
        '(8, 16)',
        18,
        endColor,
        [
          q[0] - 0.63,
          q[1] + 0.19,
          0
        ],
        true,
        1.65
      ));
    }

    if (showLoss) {
      items.push(...contourParts(
        G,
        147,
        PINK,
        2.7,
        96
      ));

      items.push(txt(
        'loss 147',
        19,
        PINK,
        [
          q[0] - 0.75,
          q[1] - 0.30,
          0
        ],
        true,
        1.85
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // LOSS COMPARISON BARS
  // ------------------------------------------------------------

  function lossComparison() {
    const base = P ? -3.45 : -2.10;

    const maxH = P ? 3.95 : 2.72;

    const xs = [
      CX - 1.75,
      CX,
      CX + 1.75
    ];

    const values = [
      11,
      0,
      147
    ];

    const names = [
      'START',
      'LOWEST',
      'AFTER JUMP'
    ];

    const colors = [
      GOLD,
      C.green,
      PINK
    ];

    const items = [];

    items.push(line(
      [CX - 2.70, base, 0],
      [CX + 2.70, base, 0],
      C.muted,
      2.4
    ));

    values.forEach((v, k) => {
      const x = xs[k];

      const h = maxH * v / 147;

      if (v > 0) {
        items.push(rect(
          0.85,
          h,
          [
            x,
            base + h / 2,
            0
          ],
          colors[k],
          0.83,
          1.5
        ));
      } else {
        items.push(ring(
          [x, base, 0],
          colors[k],
          0.09
        ));
      }

      items.push(txt(
        fmt(v),
        25,
        colors[k],
        [
          x,
          base + h + 0.29,
          0
        ],
        true
      ));

      items.push(txt(
        names[k],
        15,
        colors[k],
        [
          x,
          base - 0.30,
          0
        ],
        true,
        1.68
      ));
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // 0 — Standing on a foggy hillside.
  // You can only feel the ground immediately under your feet.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...putPicture(
      fogPicture()
    ),
    ...say('YOU CAN ONLY FEEL THE GROUND HERE', C.muted)
  );

  // ------------------------------------------------------------
  // 1 — Which way is steepest?
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...putMarks(
      fogQuestions()
    ),
    ...say('WHICH WAY IS STEEPEST?', GOLD)
  );

  // ------------------------------------------------------------
  // 2 — The loss map is the hillside.
  // Bright high loss is high ground.
  // The dark minimum is the valley floor.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...clearMarks(),
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...fbox([
      ['bright = high loss', C.cyan],
      ['dark = low loss', C.muted],
      ['valley floor = lowest loss', C.green]
    ]),
    ...say('OUR LOSS MAP IS THE HILLSIDE')
  );

  await until(S(2) + 3.0);

  await play(
    ...putMarks(
      minimumMarks(NEAR)
    )
  );

  // ------------------------------------------------------------
  // 3 — Starting position: (0, 10), loss 11.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...putMarks(
      startMarks(NEAR)
    ),
    ...fbox([
      'step price  = 0',
      'middle rent = 10',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('START AT THE FLAT RENT LINE', GOLD)
  );

  // ------------------------------------------------------------
  // 4 — Previously, we measured two directions separately.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...putMarks(
      partialMarks(
        NEAR,
        true,
        true,
        false
      )
    ),
    ...fbox([
      ['across: step price', C.cyan],
      ['up: middle rent', C.violet]
    ]),
    ...say('FEEL THE GROUND IN TWO DIRECTIONS')
  );

  // ------------------------------------------------------------
  // 5 — Step-price partial derivative: −8.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...putMarks(
      partialMarks(
        NEAR,
        true,
        false,
        true
      )
    ),
    ...fbox([
      'middle rent fixed at 10',
      ['step price partial', C.cyan],
      ['= −8', GOLD]
    ], C.cyan),
    ...say('ACROSS: PARTIAL DERIVATIVE = −8', C.cyan)
  );

  // ------------------------------------------------------------
  // 6 — Middle-rent partial derivative: −6.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...putMarks(
      partialMarks(
        NEAR,
        false,
        true,
        true
      )
    ),
    ...fbox([
      'step price fixed at 0',
      ['middle rent partial', C.violet],
      ['= −6', GOLD]
    ], C.violet),
    ...say('UP: PARTIAL DERIVATIVE = −6', C.violet)
  );

  // ------------------------------------------------------------
  // 7 — Put the readings side by side in a fixed order.
  // Step price first, middle rent second.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...clearMarks(),
    ...putPicture(
      orderedPairPicture(
        true,
        false
      )
    ),
    ...fbox([
      ['1. step price', C.cyan],
      ['2. middle rent', C.violet],
      'always in this order'
    ]),
    ...say('PUT THE TWO READINGS SIDE BY SIDE')
  );

  // ------------------------------------------------------------
  // 8 — The ordered pair is (−8, −6).
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...putPicture(
      orderedPairPicture(
        true,
        true
      )
    ),
    ...fbox([
      ['(−8, −6)', GOLD],
      'two numbers together'
    ], GOLD),
    ...say('THE ORDERED PAIR: (−8, −6)', GOLD)
  );

  // ------------------------------------------------------------
  // 9 — Draw the ordered pair as one arrow.
  // Zoom out so the complete vector fits at data scale.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...putPicture(
      mapPicture(WIDE)
    ),
    ...putMarks(
      gradientMarks(
        WIDE,
        0,
        10,
        1,
        1,
        false
      )
    ),
    ...fbox([
      ['(−8, −6)', GOLD],
      'draw one arrow',
      ['from our starting spot', C.muted]
    ], GOLD),
    ...say('TWO NUMBERS BECOME ONE ARROW', GOLD)
  );

  // ------------------------------------------------------------
  // 10 — Eight units left, then six units down.
  // Negative horizontal means left.
  // Negative vertical means down.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...putMarks(
      gradientComponents(
        WIDE,
        false,
        1,
        1
      )
    ),
    ...fbox([
      ['−8: eight units left', C.cyan],
      ['−6: six units down', C.violet]
    ]),
    ...say('MINUS MEANS LEFT OR DOWN')
  );

  await until(S(10) + 3.1);

  await play(
    ...putMarks(
      gradientComponents(
        WIDE,
        true,
        1,
        1
      )
    ),
    ...fbox([
      ['horizontal part = −8', C.cyan],
      ['vertical part   = −6', C.violet],
      ['one arrow: (−8, −6)', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 11 — Name the list of partial derivatives: gradient.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    new M.Indicate(
      marksNow,
      { color: GOLD }
    ),
    ...fbox([
      ['GRADIENT', GOLD],
      'list of partial derivatives',
      ['(−8, −6)', GOLD]
    ], GOLD),
    ...say('THIS ARROW IS THE GRADIENT', GOLD)
  );

  // ------------------------------------------------------------
  // 12 — Each component describes one input direction.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...clearMarks(),
    ...putPicture(
      lengthTriangle(
        false,
        false
      )
    ),
    ...fbox([
      ['first part: step price', C.cyan],
      ['second part: middle rent', C.violet],
      ['together: one arrow', GOLD]
    ], GOLD),
    ...say('ONE COMPONENT FOR EACH KNOB')
  );

  // ------------------------------------------------------------
  // 13 — Key fact: the gradient points in the direction
  // of fastest local increase in loss.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(
      gradientMarks(
        NEAR,
        0,
        10,
        1,
        LOCAL_SCALE,
        true
      )
    ),
    ...fbox([
      ['GRADIENT DIRECTION', GOLD],
      'fastest increase in loss',
      ['right where we stand', C.muted],
      'arrow shown scaled'
    ], GOLD),
    ...say('GRADIENT POINTS STEEPEST UPHILL', GOLD)
  );

  // ------------------------------------------------------------
  // 14 — Its length tells how fast loss increases.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...clearMarks(),
    ...putPicture(
      lengthTriangle(
        false,
        true
      )
    ),
    ...fbox([
      ['direction: which way', GOLD],
      ['length: how fast', C.cyan]
    ], GOLD),
    ...say('ARROW LENGTH = RATE OF INCREASE', GOLD)
  );

  // ------------------------------------------------------------
  // 15 — Measure the length of the arrow.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...fbox([
      'horizontal length = 8',
      'vertical length   = 6',
      ['diagonal length = ?', GOLD]
    ], GOLD),
    ...say('HOW LONG IS THE GRADIENT?', GOLD)
  );

  // ------------------------------------------------------------
  // 16 — Square each component.
  // 8 × 8 = 64.
  // 6 × 6 = 36.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...putPicture(
      squareUnitsPicture(false)
    ),
    ...fbox([
      ['(−8)² = 64', C.cyan],
      ['(−6)² = 36', C.violet]
    ], GOLD),
    ...say('STEP 1: SQUARE EACH COMPONENT', GOLD)
  );

  // ------------------------------------------------------------
  // 17 — Add them: 100.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...putPicture(
      squareUnitsPicture(true)
    ),
    ...fbox([
      '64 + 36',
      ['= 100', GOLD]
    ], GOLD),
    ...say('STEP 2: ADD = 100', GOLD)
  );

  // ------------------------------------------------------------
  // 18 — Square root: ten.
  // Ten times ten equals one hundred.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...putPicture(
      hundredSquare()
    ),
    ...fbox([
      '10 × 10 = 100',
      ['√100 = 10', GOLD]
    ], GOLD),
    ...say('STEP 3: TAKE THE SQUARE ROOT', GOLD)
  );

  await until(S(18) + 2.65);

  await play(
    ...putPicture(
      lengthTriangle(
        true,
        false
      )
    ),
    ...fbox([
      'length = √(8² + 6²)',
      '       = √100',
      ['       = 10', GOLD]
    ], GOLD),
    ...say('GRADIENT LENGTH = 10', GOLD)
  );

  // ------------------------------------------------------------
  // 19 — Every tiny unit along the gradient direction
  // increases loss by about ten.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(
      gradientMarks(
        NEAR,
        0,
        10,
        1,
        LOCAL_SCALE,
        false
      )
    ),
    ...fbox([
      'steepest uphill direction',
      ['rate = +10', GOLD],
      'loss per tiny unit',
      ['arrow shown scaled', C.muted]
    ], GOLD),
    ...say('UPHILL: ABOUT +10 PER TINY UNIT', GOLD)
  );

  // ------------------------------------------------------------
  // 20 — Compare equal-distance moves.
  // Left: +8.
  // Down: +6.
  // Gradient direction: +10.
  // No direction has a larger local rate.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...clearMarks(),
    ...putPicture(
      uphillRatePicture()
    ),
    ...fbox([
      ['left:      +8', C.cyan],
      ['down:      +6', C.violet],
      ['gradient: +10', GOLD],
      '10 is the steepest'
    ], GOLD),
    ...say('NO OTHER DIRECTION BEATS +10', GOLD)
  );

  // ------------------------------------------------------------
  // 21 — The gradient crosses a contour at a right angle.
  // Along the contour, loss stays exactly the same.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(
      perpendicularMarks(NEAR)
    ),
    ...fbox([
      ['gradient crosses ring', GOLD],
      ['at 90°', C.ink],
      ['along ring: same loss', C.cyan]
    ]),
    ...say('GRADIENT IS PERPENDICULAR TO THE RING')
  );

  // Demonstrate two different points on the exact loss-11 ring.
  // Parametric angles are chosen from the starting position.

  const theta0 = Math.atan2(
    (10 - 11) / Math.sqrt(11 / 3),
    (0 - 2) / Math.sqrt(11 / 2)
  );

  function onRing11(theta) {
    return [
      2 + Math.sqrt(11 / 2) * Math.cos(theta),
      11 + Math.sqrt(11 / 3) * Math.sin(theta)
    ];
  }

  const contourWalker = glowDot(
    mapPoint(
      NEAR,
      ...onRing11(theta0)
    ),
    C.ink,
    0.075
  );

  await until(S(21) + 2.65);

  await play(
    new M.FadeIn(contourWalker),
    ...fbox([
      'walk along the ring',
      ['loss stays at 11', C.cyan]
    ], C.cyan)
  );

  for (let k = 1; k <= 5; k++) {
    const theta =
      theta0 + k * 0.085;

    await play(
      new M.Transform(
        contourWalker,
        glowDot(
          mapPoint(
            NEAR,
            ...onRing11(theta)
          ),
          C.ink,
          0.075
        ),
        { runTime: 0.20 }
      )
    );
  }

  // ------------------------------------------------------------
  // 22 — But we want lower loss, not higher loss.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    new M.FadeOut(contourWalker),
    ...putMarks(
      gradientMarks(
        NEAR,
        0,
        10,
        1,
        LOCAL_SCALE,
        false
      )
    ),
    ...fbox([
      ['uphill: more loss', PINK],
      ['we want less loss', C.green]
    ], C.green),
    ...say('WE WANT TO GO DOWNHILL', C.green)
  );

  // ------------------------------------------------------------
  // 23 — Reverse the gradient.
  // Eight right, six up.
  // Opposite vector = (8, 6).
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...putMarks(
      oppositeDirections(NEAR)
    ),
    ...fbox([
      ['gradient: (−8, −6)', C.muted],
      ['opposite: (+8, +6)', GOLD],
      'arrow shown scaled'
    ], GOLD),
    ...say('GO THE OPPOSITE WAY', GOLD)
  );

  // ------------------------------------------------------------
  // 24 — Raise both knobs in the ratio 8:6 = 4:3.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...clearMarks(),
    ...putPicture(
      ratioPicture(false)
    ),
    ...fbox([
      ['raise step price: 8 parts', C.cyan],
      ['raise middle rent: 6 parts', C.violet],
      ['ratio = 8 : 6', GOLD]
    ], GOLD),
    ...say('RAISE BOTH NUMBERS TOGETHER', GOLD)
  );

  await until(S(24) + 3.2);

  await play(
    ...putPicture(
      ratioPicture(true)
    ),
    ...fbox([
      '8 : 6',
      'divide both by 2',
      ['= 4 : 3', GOLD]
    ], GOLD),
    ...say('SAME DIRECTION: RATIO 4 TO 3', GOLD)
  );

  // ------------------------------------------------------------
  // 25 — The downhill direction heads into the valley,
  // but is not aimed exactly at the minimum.
  //
  // Downhill vector direction: (8, 6).
  // Direct displacement to minimum: (2, 1).
  // These are different directions.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(
      valleyDirectionMarks(NEAR)
    ),
    ...fbox([
      ['gold: steepest downhill', GOLD],
      ['green: toward minimum', C.green],
      'not quite the same way'
    ], GOLD),
    ...say('DOWNHILL IS NOT ALWAYS STRAIGHT TO THE BOTTOM')
  );

  // ------------------------------------------------------------
  // 26 — Formula: gradient is the list of all
  // partial derivatives.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...clearMarks(),
    ...putPicture(
      orderedPairPicture(
        true,
        true
      )
    ),
    ...fbox([
      ['GRADIENT =', GOLD],
      '(step price partial,',
      ' middle rent partial)',
      ['= (−8, −6)', GOLD]
    ], GOLD),
    ...say('GRADIENT = LIST OF PARTIAL DERIVATIVES', GOLD)
  );

  // ------------------------------------------------------------
  // 27 — In words: one steepness per knob,
  // read together as one arrow.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...putPicture(
      mapPicture(WIDE)
    ),
    ...putMarks(
      gradientComponents(
        WIDE,
        true,
        1,
        1
      )
    ),
    ...fbox([
      ['one steepness per knob', C.cyan],
      ['read them together', GOLD],
      'one arrow'
    ], GOLD),
    ...say('MANY READINGS, ONE DIRECTION', GOLD)
  );

  // ------------------------------------------------------------
  // 28 — Real models may have thousands of knobs.
  // The gradient generalizes without needing a visible map.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...clearMarks(),
    ...putPicture(
      manyKnobsPicture(false)
    ),
    ...fbox([
      'thousands of knobs',
      'too many dimensions',
      ['for a picture', C.muted]
    ]),
    ...say('BIG MODELS HAVE MANY KNOBS')
  );

  await until(S(28) + 3.0);

  await play(
    ...putPicture(
      manyKnobsPicture(true)
    ),
    ...fbox([
      ['one partial per knob', C.cyan],
      ['one gradient for all', GOLD],
      'reverse it for downhill'
    ], GOLD),
    ...say('THE GRADIENT STILL TELLS US WHICH WAY', GOLD)
  );

  // ------------------------------------------------------------
  // 29 — Trap: the gradient is a local reading.
  // It describes the ground right under your feet.
  // ------------------------------------------------------------

  const localWarning = new M.VGroup(
    gradientArrow(
      NEAR,
      0,
      10,
      1,
      LOCAL_SCALE,
      GOLD,
      3.8
    ),

    glowDot(
      mapPoint(NEAR, ...START),
      GOLD,
      0.13
    ),

    ring(
      mapPoint(NEAR, ...START),
      GOLD,
      0.32
    ),

    pill('right here', GOLD, 17)
      .moveTo([mapPoint(NEAR, ...START)[0] + 1.04, mapPoint(NEAR, ...START)[1] - 0.36, 0])
  );

  await until(S(29));

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(localWarning),
    ...fbox([
      ['TRAP', GOLD],
      'gradient describes',
      ['the ground right here', GOLD],
      'arrow shown scaled'
    ], GOLD),
    ...say('THE GRADIENT IS LOCAL', GOLD)
  );

  // ------------------------------------------------------------
  // 30 — Suppose we take the entire opposite-gradient
  // vector as one large step.
  //
  // Starting position: (0, 10).
  // Full downhill displacement: (+8, +6).
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...clearMarks(),
    ...putPicture(
      mapPicture(WIDE)
    ),
    ...putMarks(
      gradientComponents(
        WIDE,
        true,
        -1,
        1
      )
    ),
    ...fbox([
      'take the WHOLE arrow',
      ['step price +8', C.cyan],
      ['middle rent +6', C.violet]
    ], GOLD),
    ...say('WHAT IF WE TAKE THE WHOLE ARROW?', GOLD)
  );

  let jumpingDot = glowDot(
    mapPoint(WIDE, ...START),
    GOLD,
    0.13
  );

  await until(S(30) + 2.65);

  await play(
    ...putMarks(
      overshootMarks(
        WIDE,
        false,
        false
      )
    ),
    new M.FadeIn(jumpingDot)
  );

  await play(
    new M.Transform(
      jumpingDot,
      glowDot(
        mapPoint(
          WIDE,
          ...DOWNHILL_END
        ),
        GOLD,
        0.13
      ),
      { runTime: 1.55 }
    )
  );

  // ------------------------------------------------------------
  // 31 — Landing position: (8, 16).
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    new M.FadeOut(jumpingDot),
    ...putMarks(
      overshootMarks(
        WIDE,
        true,
        false
      )
    ),
    ...fbox([
      'step price: 0 + 8 = 8',
      'middle rent: 10 + 6 = 16',
      ['new spot: (8, 16)', GOLD]
    ], GOLD),
    ...say('LANDED AT (8, 16)', GOLD)
  );

  // ------------------------------------------------------------
  // 32 — Calculate the new loss.
  //
  // loss(8, 16)
  // = 3 × (16 − 11)² + 2 × (8 − 2)²
  // = 75 + 72
  // = 147.
  //
  // Much worse than the starting loss of 11.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...putMarks(
      overshootMarks(
        WIDE,
        true,
        true
      )
    ),
    ...fbox([
      '3 × 5² + 2 × 6²',
      '= 75 + 72',
      ['loss = 147', PINK]
    ], PINK),
    ...say('LOSS ROSE FROM 11 TO 147', PINK)
  );

  await until(S(32) + 1.95);

  await play(
    ...clearMarks(),
    ...putPicture(
      lossComparison()
    ),
    ...fbox([
      ['before: 11', GOLD],
      ['after: 147', PINK],
      'much worse'
    ], PINK),
    ...say('A HUGE STEP MADE THE LOSS WORSE', PINK)
  );

  // ------------------------------------------------------------
  // 33 — Gradient gives direction and local steepness,
  // not a recommended travelling distance.
  // The next lessons choose the actual step size.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(
      valleyDirectionMarks(NEAR)
    ),
    ...fbox([
      ['which way? gradient', GOLD],
      ['how far? choose a step', C.green],
      'next lessons'
    ], GOLD),
    ...say('DIRECTION IS NOT STEP SIZE', GOLD)
  );

  // ------------------------------------------------------------
  // 34 — Try it preview.
  // Drag your position and watch the gradient turn and stretch.
  //
  // The actual draggable control belongs to the Try it interface.
  // This live scene demonstrates its behaviour.
  // ------------------------------------------------------------

  function movingGradient(
    s,
    m
  ) {
    const p = mapPoint(
      NEAR,
      s,
      m
    );

    const end = mapPoint(
      NEAR,
      ...vectorEnd(
        s,
        m,
        1,
        LOCAL_SCALE
      )
    );

    return new M.VGroup(
      arrow(
        p,
        end,
        GOLD,
        4.1,
        0.15
      ),

      glowDot(
        p,
        GOLD,
        0.12
      )
    );
  }

  await until(S(34));

  await play(
    ...putMarks(
      movingGradient(
        0,
        10
      )
    ),
    ...fbox([
      ['TRY IT', GOLD],
      'position: (0, 10)',
      ['gradient: (−8, −6)', GOLD],
      'arrows shown scaled'
    ], GOLD),
    ...say('DRAG THE DOT: WATCH THE GRADIENT', GOLD)
  );

  await until(S(34) + 1.65);

  await play(
    new M.Transform(
      marksNow,
      movingGradient(
        1,
        10.5
      ),
      { runTime: 0.85 }
    ),
    ...fbox([
      'position: (1, 10.5)',
      ['gradient: (−4, −3)', GOLD],
      ['length = 5', C.cyan]
    ], GOLD)
  );

  await until(S(34) + 3.25);

  await play(
    new M.Transform(
      marksNow,
      movingGradient(
        3,
        12
      ),
      { runTime: 0.85 }
    ),
    ...fbox([
      'position: (3, 12)',
      ['gradient: (+4, +6)', GOLD],
      'the arrow turns'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 35 — Challenge: find the one spot where the
  // gradient shrinks to nothing.
  //
  // Do not highlight the answer during the challenge.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...clearMarks(),
    ...fbox([
      ['YOUR CHALLENGE', GOLD],
      'find the spot where',
      ['both partials are zero', C.green],
      'gradient length = 0'
    ], GOLD),
    ...say('WHERE DOES THE ARROW DISAPPEAR?', C.green)
  );

  // ------------------------------------------------------------
  // 36 — Recap.
  //
  // Gradient = ordered list of partial derivatives.
  // As an arrow, it points in the direction of the
  // fastest local increase in loss.
  // Its length is the rate of that increase.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...putPicture(
      orderedPairPicture(
        true,
        true
      )
    ),
    ...fbox([
      ['GRADIENT', GOLD],
      'list of partial derivatives',
      ['(−8, −6)', GOLD]
    ], GOLD),
    ...say('GRADIENT: ONE READING PER KNOB', GOLD)
  );

  await until(S(36) + 3.0);

  await play(
    ...putPicture(
      mapPicture(NEAR)
    ),
    ...putMarks(
      gradientMarks(
        NEAR,
        0,
        10,
        1,
        LOCAL_SCALE,
        true
      )
    ),
    ...fbox([
      ['direction: fastest uphill', GOLD],
      ['length: rate of increase', C.cyan],
      'here: length = 10',
      ['arrow shown scaled', C.muted]
    ], GOLD),
    ...say('GRADIENT POINTS STEEPEST UPHILL', GOLD)
  );

  await until(E(36));
}

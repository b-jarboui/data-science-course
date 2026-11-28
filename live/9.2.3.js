// lesson 9.2.3
// Partial derivatives — live manim-web lesson.
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

  const STEPS = [-1, 0, 1];
  const RENTS = [9, 11, 13];
  const AREAS = [40, 50, 60];

  const GOLD = C.amber;
  const PINK = C.pink || '#F472B6';
  const COLORS = [C.cyan, C.ink, PINK];

  const prediction = (s, m) =>
    STEPS.map(x => m + s * x);

  const misses = (s, m) =>
    prediction(s, m).map((v, k) => v - RENTS[k]);

  const squares = (s, m) =>
    misses(s, m).map(v => v * v);

  const loss = (s, m) =>
    3 * (m - 11) ** 2 + 2 * (s - 2) ** 2;

  const partialS = (s, m) =>
    4 * (s - 2);

  const partialM = (s, m) =>
    6 * (m - 11);

  const rowLoss = s =>
    loss(s, 10);

  const colLoss = m =>
    loss(0, m);

  const fmt = (n, places = 4) =>
    String(Number(n.toFixed(places))).replace('-', '−');

  const signed = (n, places = 4) =>
    n > 0 ? `+${fmt(n, places)}` : fmt(n, places);

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

  const GX0 = CX - 2.65;
  const GX1 = CX + 2.65;

  const GY0 = P ? -4.0 : -2.20;
  const GY1 = P ? 1.15 : 1.10;

  const BOX_MAX = P ? FW - 1.2 : 4.15;

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

  // Arrow built from ordinary Line objects.
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

    if (len < 0.0001) {
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
      Array.isArray(l) ? l : [l, C.ink]
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

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

    const r = rounded(
      wd,
      ht,
      BOXP,
      color
    );

    const left = BOXP[0] - wd / 2 + 0.325;

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

    const g = new M.VGroup(r, ...texts);

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

  // Keep the main picture and its temporary marks separate.
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
  // GENERAL GRAPH HELPERS
  // ------------------------------------------------------------

  function graph({
    xmin,
    xmax,
    ymin,
    ymax,
    xticks,
    yticks,
    xlabel,
    ylabel
  }) {
    const X = x =>
      GX0 +
      (x - xmin) / (xmax - xmin) *
      (GX1 - GX0);

    const Y = y =>
      GY0 +
      (y - ymin) / (ymax - ymin) *
      (GY1 - GY0);

    const p = (x, y) => [
      X(x),
      Y(y),
      0
    ];

    const items = [];

    xticks.forEach(v => {
      items.push(line(
        [X(v), GY0, 0],
        [X(v), GY1, 0],
        C.muted,
        0.65
      ));

      items.push(txt(
        fmt(v),
        16,
        C.ink,
        [X(v), GY0 - 0.25, 0],
        true,
        0.85
      ));
    });

    yticks.forEach(v => {
      items.push(line(
        [GX0, Y(v), 0],
        [GX1, Y(v), 0],
        C.muted,
        0.65
      ));

      items.push(txt(
        fmt(v),
        16,
        C.muted,
        [GX0 - 0.38, Y(v), 0],
        true,
        0.70
      ));
    });

    items.push(line(
      [GX0, GY0, 0],
      [GX1 + 0.10, GY0, 0],
      C.muted,
      2.4
    ));

    items.push(line(
      [GX0, GY0, 0],
      [GX0, GY1 + 0.08, 0],
      C.muted,
      2.4
    ));

    items.push(txt(
      ylabel,
      19,
      C.muted,
      [CX, GY1 + 0.30, 0],
      false,
      GX1 - GX0
    ));

    items.push(txt(
      xlabel,
      18,
      C.muted,
      [CX, GY0 - 0.60, 0],
      false,
      GX1 - GX0
    ));

    return {
      X,
      Y,
      p,
      items,
      xmin,
      xmax,
      ymin,
      ymax
    };
  }

  function curveParts(
    G,
    fn,
    a,
    b,
    color = C.cyan,
    n = 56
  ) {
    const halo = [];
    const core = [];

    for (let i = 0; i < n; i++) {
      const x0 = a + (b - a) * i / n;
      const x1 = a + (b - a) * (i + 1) / n;

      halo.push(line(
        G.p(x0, fn(x0)),
        G.p(x1, fn(x1)),
        C.card,
        7
      ));

      core.push(line(
        G.p(x0, fn(x0)),
        G.p(x1, fn(x1)),
        color,
        2.8
      ));
    }

    return [...halo, ...core];
  }

  function tangent(
    G,
    x,
    fn,
    rate,
    a,
    b,
    color = GOLD
  ) {
    const y = fn(x);

    if (Math.abs(rate) > 0.000001) {
      const xa = x + (G.ymin - y) / rate;
      const xb = x + (G.ymax - y) / rate;

      a = Math.max(a, Math.min(xa, xb));
      b = Math.min(b, Math.max(xa, xb));
    }

    return line(
      G.p(a, y + rate * (a - x)),
      G.p(b, y + rate * (b - x)),
      color,
      4
    );
  }

  // ------------------------------------------------------------
  // RENT-VERSUS-SIZE PICTURE
  // ------------------------------------------------------------

  function rentGraph(s, m, showGuesses = true) {
    const G = graph({
      xmin: -1.5,
      xmax: 1.5,
      ymin: 5.5,
      ymax: 14.5,
      xticks: [-1, 0, 1],
      yticks: [6, 8, 10, 12, 14],
      xlabel: 'size step',
      ylabel: 'rent (hundreds of dollars)'
    });

    const guesses = prediction(s, m);
    const items = [...G.items];

    items.push(line(
      G.p(-1.10, m - 1.10 * s),
      G.p(1.10, m + 1.10 * s),
      GOLD,
      4.4
    ));

    STEPS.forEach((x, k) => {
      items.push(glowDot(
        G.p(x, RENTS[k]),
        COLORS[k],
        0.105
      ));

      items.push(txt(
        String(RENTS[k]),
        19,
        COLORS[k],
        [
          G.X(x) - (showGuesses && guesses[k] > RENTS[k] && guesses[k] - RENTS[k] <= 1.5 ? 0 : 0.30),
          G.Y(RENTS[k]) + (showGuesses && guesses[k] > RENTS[k] && guesses[k] - RENTS[k] <= 1.5 ? -0.31 : 0.16),
          0
        ],
        true
      ));

      if (showGuesses) {
        items.push(dot(
          G.p(x, guesses[k]),
          GOLD,
          0.075
        ));

        if (Math.abs(guesses[k] - RENTS[k]) > 0.01) {
          items.push(txt(
            fmt(guesses[k], 2),
            17,
            GOLD,
            [
              G.X(x) + 0.32,
              G.Y(guesses[k]) + (guesses[k] > RENTS[k] ? 0.31 : -0.31),
              0
            ],
            true
          ));
        }
      }
    });

    G.g = new M.VGroup(...items);

    return G;
  }

  function rentMissMarks(G, s, m) {
    const vals = prediction(s, m);
    const errs = misses(s, m);

    const items = [];

    STEPS.forEach((x, k) => {
      const a = G.p(x, RENTS[k]);
      const b = G.p(x, vals[k]);

      if (Math.abs(errs[k]) < 0.00001) {
        items.push(ring(
          a,
          C.green,
          0.17
        ));
      } else {
        items.push(arrow(
          a,
          b,
          C.violet,
          3
        ));
      }

      const y = Math.abs(errs[k]) < 0.00001
        ? a[1] + 0.27
        : (a[1] + b[1]) / 2;

      items.push(txt(
        signed(errs[k], 2),
        19,
        Math.abs(errs[k]) < 0.00001
          ? C.green
          : C.violet,
        [
          G.X(x) + 0.40,
          y,
          0
        ],
        true
      ));
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // TWO-KNOB MACHINE
  // ------------------------------------------------------------

  const KNOB_SP = P ? 1.55 : 1.45;
  const KNOB_Y = P ? 0.10 : 0.25;
  const KNOB_R = P ? 0.65 : 0.59;

  function knob(
    x,
    y,
    name,
    value,
    min,
    max,
    color,
    frozen = false
  ) {
    const r = KNOB_R;

    const body = new M.Circle({
      radius: r,
      color,
      strokeWidth: frozen ? 1.6 : 2.8
    });

    body.setFill(C.card, 0.95);
    body.moveTo([x, y, 0]);

    const items = [body];

    for (let k = 0; k <= 8; k++) {
      const a =
        Math.PI * 1.25 -
        Math.PI * 1.50 * k / 8;

      items.push(line(
        [
          x + Math.cos(a) * (r + 0.06),
          y + Math.sin(a) * (r + 0.06),
          0
        ],
        [
          x + Math.cos(a) * (r + 0.14),
          y + Math.sin(a) * (r + 0.14),
          0
        ],
        color,
        1.7
      ));
    }

    const f = Math.max(
      0,
      Math.min(
        1,
        (value - min) / (max - min)
      )
    );

    const a =
      Math.PI * 1.25 -
      Math.PI * 1.50 * f;

    items.push(line(
      [
        x + Math.cos(a) * r * 0.36,
        y + Math.sin(a) * r * 0.36,
        0
      ],
      [
        x + Math.cos(a) * r * 0.86,
        y + Math.sin(a) * r * 0.86,
        0
      ],
      color,
      4.3
    ));

    items.push(txt(
      fmt(value, 2),
      24,
      color,
      [x, y, 0],
      true
    ));

    items.push(txt(
      name,
      18,
      color,
      [x, y + r + 0.37, 0],
      false,
      2.55
    ));

    items.push(txt(
      frozen ? 'HELD FIXED' : 'CAN TURN',
      15,
      frozen ? C.muted : color,
      [x, y - r - 0.28, 0],
      true,
      2.35
    ));

    if (frozen) {
      const lockY = y - r - 0.65;

      const lockBody = rect(
        0.22,
        0.18,
        [x, lockY, 0],
        C.muted,
        0.80,
        1.5
      );

      const shackle = new M.Arc({
        radius: 0.075,
        startAngle: 0,
        angle: Math.PI,
        color: C.muted,
        strokeWidth: 2.5
      });

      shackle.moveTo([
        x,
        lockY + 0.115,
        0
      ]);

      items.push(lockBody, shackle);
    }

    return new M.VGroup(...items);
  }

  function machine(
    s,
    m,
    frozen = null,
    showLoss = true
  ) {
    const y = KNOB_Y;

    const sColor =
      frozen === 's' ? C.muted : C.cyan;

    const mColor =
      frozen === 'm' ? C.muted : C.violet;

    const items = [
      knob(
        CX - KNOB_SP,
        y,
        'step price',
        s,
        -1,
        4,
        sColor,
        frozen === 's'
      ),

      knob(
        CX + KNOB_SP,
        y,
        'middle rent',
        m,
        9,
        13,
        mColor,
        frozen === 'm'
      )
    ];

    if (showLoss) {
      const outY = P ? -2.65 : -1.91;
      const wd = P ? 3.10 : 2.95;
      const ht = P ? 0.83 : 0.76;

      items.push(arrow(
        [CX - KNOB_SP, y - KNOB_R - 0.89, 0],
        [CX - 0.79, outY + ht / 2, 0],
        sColor,
        2.3
      ));

      items.push(arrow(
        [CX + KNOB_SP, y - KNOB_R - 0.89, 0],
        [CX + 0.79, outY + ht / 2, 0],
        mColor,
        2.3
      ));

      items.push(rounded(
        wd,
        ht,
        [CX, outY, 0],
        GOLD
      ));

      items.push(txt(
        `LOSS = ${fmt(loss(s, m), 2)}`,
        24,
        GOLD,
        [CX, outY, 0],
        true,
        wd - 0.25
      ));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // LOSS MAP COORDINATES
  // ------------------------------------------------------------

  // Both axes use the same number of world units per data unit.
  // The elliptic contours therefore preserve the true shape
  // of the chapter's two-input loss function.

  const MAP_SMIN = -1.4;
  const MAP_SMAX = 5.4;

  const MAP_MMIN = 8.4;
  const MAP_MMAX = 13.6;

  const MAP_UNIT = P ? 0.80 : 0.62;

  const MAP_CY = P ? -1.35 : -0.52;

  const mp = (s, m) => [
    CX + (s - 2) * MAP_UNIT,
    MAP_CY + (m - 11) * MAP_UNIT,
    0
  ];

  const MX0 = mp(MAP_SMIN, 11)[0];
  const MX1 = mp(MAP_SMAX, 11)[0];

  const MY0 = mp(2, MAP_MMIN)[1];
  const MY1 = mp(2, MAP_MMAX)[1];

  const inMap = (s, m) =>
    s >= MAP_SMIN &&
    s <= MAP_SMAX &&
    m >= MAP_MMIN &&
    m <= MAP_MMAX;

  // ------------------------------------------------------------
  // MAP COLOUR SCALE
  // ------------------------------------------------------------

  // Low loss is dark.
  // Higher loss uses progressively brighter blue/cyan colours.

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

  function heatColor(v) {
    const k = Math.min(
      HEAT.length - 1,
      Math.max(
        0,
        Math.floor(v / 4)
      )
    );

    return HEAT[k];
  }

  function heatParts() {
    const items = [];

    const nx = 25;
    const ny = 19;

    const ds =
      (MAP_SMAX - MAP_SMIN) / nx;

    const dm =
      (MAP_MMAX - MAP_MMIN) / ny;

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const s = MAP_SMIN + (i + 0.5) * ds;
        const m = MAP_MMIN + (j + 0.5) * dm;

        const v = loss(s, m);
        const c = heatColor(v);

        items.push(rect(
          ds * MAP_UNIT * 1.012,
          dm * MAP_UNIT * 1.012,
          mp(s, m),
          c,
          0.90,
          0
        ));
      }
    }

    return items;
  }

  function mapAxes() {
    const items = [];

    const gridColor = '#426078';

    for (let s = -1; s <= 5; s++) {
      items.push(line(
        mp(s, MAP_MMIN),
        mp(s, MAP_MMAX),
        gridColor,
        0.65
      ));

      items.push(txt(
        fmt(s),
        16,
        C.ink,
        [
          mp(s, 11)[0],
          MY0 - 0.25,
          0
        ],
        true
      ));
    }

    for (let m = 9; m <= 13; m++) {
      items.push(line(
        mp(MAP_SMIN, m),
        mp(MAP_SMAX, m),
        gridColor,
        0.65
      ));

      items.push(txt(
        String(m),
        16,
        C.ink,
        [
          MX0 - 0.30,
          mp(2, m)[1],
          0
        ],
        true
      ));
    }

    items.push(line(
      [MX0, MY0, 0],
      [MX1, MY0, 0],
      C.muted,
      2.4
    ));

    items.push(line(
      [MX0, MY0, 0],
      [MX0, MY1, 0],
      C.muted,
      2.4
    ));

    items.push(line(
      [MX0, MY1, 0],
      [MX1, MY1, 0],
      C.muted,
      1.3
    ));

    items.push(line(
      [MX1, MY0, 0],
      [MX1, MY1, 0],
      C.muted,
      1.3
    ));

    items.push(txt(
      'step price',
      18,
      C.muted,
      [CX, MY0 - 0.59, 0]
    ));

    items.push(txt(
      'middle rent',
      19,
      C.muted,
      [CX, MY1 + 0.31, 0]
    ));

    return items;
  }

  // ------------------------------------------------------------
  // EXACT LOSS CONTOURS
  // ------------------------------------------------------------

  // For a fixed loss k:
  //
  //   2(s − 2)² + 3(m − 11)² = k
  //
  // Parametrize the oval:
  //
  //   s = 2  + sqrt(k / 2) cos(theta)
  //   m = 11 + sqrt(k / 3) sin(theta)
  //
  // Every point on the ring has exactly the same loss.

  function contourParts(
    level,
    color = C.cyan,
    width = 1.8,
    n = 64
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
        inMap(s0, m0) &&
        inMap(s1, m1)
      ) {
        items.push(line(
          mp(s0, m0),
          mp(s1, m1),
          color,
          width
        ));
      }
    }

    return items;
  }

  function contourLabel(
    level,
    theta,
    color = C.ink
  ) {
    const s =
      2 + Math.sqrt(level / 2) *
      Math.cos(theta);

    const m =
      11 + Math.sqrt(level / 3) *
      Math.sin(theta);

    const p = mp(s, m);

    const lab = txt(
      String(level),
      15,
      color,
      p,
      true
    );

    const backing = rounded(
      Math.max(0.32, lab.getWidth() + 0.14),
      0.25,
      p,
      C.muted,
      0.95
    );

    return new M.VGroup(
      backing,
      lab
    );
  }

  function allContours() {
    const levels = [1, 3, 6, 8, 11, 16, 24];

    const items = [];

    levels.forEach(k => {
      items.push(...contourParts(
        k,
        k === 11 ? '#9CDDDC' : '#70B8C5',
        k === 11 ? 2.1 : 1.5,
        64
      ));
    });

    items.push(
      contourLabel(3, 0.24),
      contourLabel(8, Math.PI / 2),
      contourLabel(11, -0.55),
      contourLabel(16, 2.40)
    );

    return items;
  }

  function mapPicture(
    withHeat = true,
    withContours = true
  ) {
    const items = [];

    if (withHeat) {
      items.push(...heatParts());
    } else {
      items.push(rect(
        MX1 - MX0,
        MY1 - MY0,
        [CX, MAP_CY, 0],
        C.card,
        0.60,
        0
      ));
    }

    items.push(...mapAxes());

    if (withContours) {
      items.push(...allContours());
    }

    return new M.VGroup(...items);
  }

  function mapPoint(
    s,
    m,
    color = GOLD,
    label = null,
    dx = 0.55,
    dy = 0.35
  ) {
    const p = mp(s, m);

    const items = [
      glowDot(p, color, 0.105)
    ];

    if (label !== null) {
      items.push(txt(
        label,
        17,
        color,
        [
          p[0] + dx,
          p[1] + dy,
          0
        ],
        true,
        2.2
      ));
    }

    return new M.VGroup(...items);
  }

  function mapStart() {
    return new M.VGroup(
      dash(
        mp(0, MAP_MMIN),
        mp(0, 10),
        GOLD,
        1.7
      ),

      dash(
        mp(MAP_SMIN, 10),
        mp(0, 10),
        GOLD,
        1.7
      ),

      glowDot(
        mp(0, 10),
        GOLD,
        0.13
      ),

      txt(
        'loss 11',
        18,
        GOLD,
        [
          mp(0, 10)[0] + 0.53,
          mp(0, 10)[1] - 0.29,
          0
        ],
        true
      )
    );
  }

  function mapMinimum() {
    return new M.VGroup(
      glowDot(
        mp(2, 11),
        C.green,
        0.12
      ),

      ring(
        mp(2, 11),
        C.green,
        0.20
      ),

      pill('loss 0', C.green, 18)
        .moveTo([mp(2, 11)[0] + 0.77, mp(2, 11)[1] - 0.30, 0])
    );
  }

  // ------------------------------------------------------------
  // ROW AND COLUMN SLICES
  // ------------------------------------------------------------

  function rowMarks(
    endS = null,
    showMinimum = false
  ) {
    const items = [
      rect(
        MX1 - MX0,
        0.18,
        [CX, mp(2, 10)[1], 0],
        C.cyan,
        0.23,
        0
      ),

      line(
        mp(MAP_SMIN, 10),
        mp(MAP_SMAX, 10),
        C.cyan,
        2.8
      ),

      glowDot(
        mp(0, 10),
        GOLD,
        0.105
      )
    ];

    if (endS !== null) {
      items.push(arrow(
        mp(0, 10),
        mp(endS, 10),
        GOLD,
        3.5
      ));

      items.push(glowDot(
        mp(endS, 10),
        C.cyan,
        0.115
      ));
    }

    if (showMinimum) {
      items.push(
        glowDot(
          mp(2, 10),
          C.green,
          0.13
        ),

        txt(
          'loss 3',
          17,
          C.green,
          [
            mp(2, 10)[0] + 0.55,
            mp(2, 10)[1] - 0.28,
            0
          ],
          true
        )
      );
    }

    items.push(txt(
      'middle rent = 10',
      16,
      C.cyan,
      [
        CX + 0.74,
        mp(2, 10)[1] + 0.25,
        0
      ],
      true,
      2.65
    ));

    return new M.VGroup(...items);
  }

  function colMarks(
    endM = null,
    showMinimum = false
  ) {
    const x = mp(0, 11)[0];

    const items = [
      rect(
        0.18,
        MY1 - MY0,
        [x, MAP_CY, 0],
        C.violet,
        0.25,
        0
      ),

      line(
        mp(0, MAP_MMIN),
        mp(0, MAP_MMAX),
        C.violet,
        2.8
      ),

      glowDot(
        mp(0, 10),
        GOLD,
        0.105
      )
    ];

    if (endM !== null) {
      items.push(arrow(
        mp(0, 10),
        mp(0, endM),
        GOLD,
        3.5
      ));

      items.push(glowDot(
        mp(0, endM),
        C.violet,
        0.115
      ));
    }

    if (showMinimum) {
      items.push(
        glowDot(
          mp(0, 11),
          C.green,
          0.13
        ),

        txt(
          'loss 8',
          17,
          C.green,
          [
            x + 0.60,
            mp(0, 11)[1] + 0.18,
            0
          ],
          true
        )
      );
    }

    items.push(pill('step price = 0', C.violet, 16)
      .moveTo([x + 1.20, MY1 - 0.27, 0]));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // ONE-INPUT LOSS GRAPHS
  // ------------------------------------------------------------

  function sliceGraph(axis) {
    const isRow = axis === 's';

    const G = graph({
      xmin: isRow ? -0.18 : 9.55,
      xmax: isRow ? 4.18 : 12.45,
      ymin: isRow ? 0 : 6.8,
      ymax: isRow ? 12.5 : 14.2,
      xticks: isRow
        ? [0, 1, 2, 3, 4]
        : [10, 11, 12],
      yticks: isRow
        ? [0, 3, 5, 8, 11]
        : [8, 10, 11, 13],
      xlabel: isRow
        ? 'step price'
        : 'middle rent',
      ylabel: 'loss'
    });

    const fn = isRow
      ? rowLoss
      : colLoss;

    const color = isRow
      ? C.cyan
      : C.violet;

    const from = isRow ? 0 : 9.60;
    const to = isRow ? 4 : 12.40;

    const items = [
      ...G.items,
      ...curveParts(
        G,
        fn,
        from,
        to,
        color
      )
    ];

    const ticks = isRow
      ? [0, 1, 2, 3, 4]
      : [10, 11, 12];

    ticks.forEach(x => {
      const y = fn(x);

      items.push(glowDot(
        G.p(x, y),
        color,
        0.09
      ));

      items.push(txt(
        fmt(y),
        18,
        color,
        [
          G.X(x),
          G.Y(y) + 0.24,
          0
        ],
        true
      ));
    });

    G.fn = fn;
    G.color = color;
    G.g = new M.VGroup(...items);

    return G;
  }

  function sliceTangent(G, x, rate) {
    const a = Math.max(
      G.xmin + 0.01,
      x - 0.20
    );

    const b = Math.min(
      G.xmax - 0.01,
      x + 0.65
    );

    return new M.VGroup(
      tangent(
        G,
        x,
        G.fn,
        rate,
        a,
        b,
        GOLD
      ),

      glowDot(
        G.p(x, G.fn(x)),
        GOLD,
        0.12
      )
    );
  }

  // ------------------------------------------------------------
  // MAGNIFIED COLUMN GRAPH
  // ------------------------------------------------------------

  function zoomColumn(h) {
    const start = 10;
    const end = start + h;

    const drop =
      colLoss(start) - colLoss(end);

    const G = graph({
      xmin: start - 0.15 * h,
      xmax: start + 1.25 * h,
      ymin: 11 - 1.40 * drop,
      ymax: 11 + 0.25 * drop,
      xticks: [
        10,
        10 + h / 2,
        10 + h
      ],
      yticks: [
        Number(colLoss(end).toFixed(4)),
        Number(
          ((11 + colLoss(end)) / 2).toFixed(4)
        ),
        11
      ],
      xlabel: 'middle rent (zoomed)',
      ylabel: 'loss (zoomed)'
    });

    G.fn = colLoss;

    G.g = new M.VGroup(
      ...G.items,
      ...curveParts(
        G,
        colLoss,
        G.xmin,
        G.xmax,
        C.violet,
        48
      )
    );

    return G;
  }

  function columnSecant(G, h, showRise = true) {
    const a = G.p(10, 11);
    const b = G.p(10 + h, colLoss(10 + h));
    const corner = G.p(10 + h, 11);

    const items = [
      line(a, b, GOLD, 3.8),

      arrow(
        a,
        corner,
        GOLD,
        2.7
      ),

      glowDot(
        a,
        GOLD,
        0.105
      ),

      glowDot(
        b,
        C.green,
        0.105
      ),

      txt(
        `+${fmt(h)}`,
        19,
        GOLD,
        [
          (a[0] + corner[0]) / 2,
          a[1] - 0.24,
          0
        ],
        true
      )
    ];

    if (showRise) {
      items.push(
        arrow(
          corner,
          b,
          C.violet,
          3.2
        ),

        txt(
          fmt(colLoss(10 + h) - 11),
          18,
          C.violet,
          [
            b[0] - 0.60,
            (corner[1] + b[1]) / 2,
            0
          ],
          true,
          1.0
        )
      );
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // TWO PARTIAL DERIVATIVES SIDE BY SIDE
  // ------------------------------------------------------------

  function partialComparison(
    showValues = true,
    showDirection = false
  ) {
    const cy = P ? -0.85 : -0.39;
    const w = P ? 2.68 : 2.64;
    const h = P ? 2.95 : 2.60;

    const items = [];

    const data = [
      {
        x: CX - 1.48,
        color: C.cyan,
        title: 'STEP PRICE',
        fixed: 'middle rent = 10',
        rate: '−8',
        change: 'loss ↓'
      },
      {
        x: CX + 1.48,
        color: C.violet,
        title: 'MIDDLE RENT',
        fixed: 'step price = 0',
        rate: '−6',
        change: 'loss ↓'
      }
    ];

    data.forEach((q, k) => {
      items.push(rounded(
        w,
        h,
        [q.x, cy, 0],
        q.color
      ));

      items.push(txt(
        q.title,
        17,
        q.color,
        [
          q.x,
          cy + h / 2 - 0.34,
          0
        ],
        true,
        w - 0.22
      ));

      const y = cy + 0.28;

      const a = [
        q.x - 0.62,
        y + 0.28,
        0
      ];

      const b = [
        q.x + 0.62,
        y - (k === 0 ? 0.50 : 0.30),
        0
      ];

      items.push(line(
        [
          q.x - 0.72,
          y - 0.55,
          0
        ],
        [
          q.x + 0.72,
          y - 0.55,
          0
        ],
        C.muted,
        1.5
      ));

      items.push(arrow(
        a,
        b,
        q.color,
        3.4
      ));

      if (showValues) {
        items.push(txt(
          q.rate,
          30,
          GOLD,
          [
            q.x,
            cy - 0.63,
            0
          ],
          true
        ));
      } else {
        items.push(txt(
          '?',
          30,
          GOLD,
          [
            q.x,
            cy - 0.63,
            0
          ],
          true
        ));
      }

      items.push(txt(
        q.fixed,
        15,
        C.muted,
        [
          q.x,
          cy - h / 2 + 0.23,
          0
        ],
        true,
        w - 0.25
      ));

      if (showDirection) {
        items.push(txt(
          q.change,
          17,
          C.green,
          [
            q.x,
            cy - h / 2 - 0.30,
            0
          ],
          true
        ));
      }
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // COMPARE THE SAME TINY INPUT MOVE
  // ------------------------------------------------------------

  function tinyTurnComparison() {
    const cy = P ? -0.75 : -0.22;

    const rows = [
      {
        label: 'Step price +0.1',
        value: 0.78,
        final: '10.22',
        color: C.cyan
      },
      {
        label: 'Middle rent +0.1',
        value: 0.57,
        final: '10.43',
        color: C.violet
      }
    ];

    const items = [];

    rows.forEach((q, k) => {
      const y = cy - k * 1.30;
      const left = CX - 2.28;
      const maxW = 3.60;

      items.push(txt(
        q.label,
        19,
        q.color,
        [CX, y + 0.52, 0],
        false
      ));

      items.push(rect(
        maxW,
        0.36,
        [left + maxW / 2, y, 0],
        C.muted,
        0.12,
        1
      ));

      const w = maxW * q.value / 0.8;

      items.push(rect(
        w,
        0.36,
        [left + w / 2, y, 0],
        q.color,
        0.82,
        1.3
      ));

      items.push(txt(
        `−${q.value.toFixed(2)}`,
        19,
        q.color,
        [
          Math.min(
            left + w + 0.42,
            CX + 2.38
          ),
          y,
          0
        ],
        true
      ));

      items.push(txt(
        `new loss: ${q.final}`,
        16,
        C.muted,
        [CX, y - 0.35, 0],
        true
      ));
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // MANY-KNOB MODEL
  // ------------------------------------------------------------

  function manyKnobs(active = 2) {
    const items = [];

    const cx = CX;
    const cy = P ? -0.48 : -0.35;

    const w = 5.55;
    const h = P ? 3.30 : 2.75;

    items.push(rounded(
      w,
      h,
      [cx, cy, 0],
      C.muted
    ));

    items.push(txt(
      'MODEL',
      20,
      C.ink,
      [
        cx,
        cy + h / 2 - 0.32,
        0
      ],
      true
    ));

    for (let k = 0; k < 8; k++) {
      const col = k % 4;
      const row = Math.floor(k / 4);

      const x = cx + (col - 1.5) * 1.23;

      const y =
        cy + 0.39 -
        row * (P ? 1.05 : 0.85);

      const color =
        k === active ? GOLD : C.muted;

      const r = new M.Circle({
        radius: 0.29,
        color,
        strokeWidth: k === active ? 3 : 1.6
      });

      r.setFill(C.card, 1);
      r.moveTo([x, y, 0]);

      items.push(r);

      const a =
        Math.PI * (0.32 + 0.13 * k);

      items.push(line(
        [x, y, 0],
        [
          x + 0.23 * Math.cos(a),
          y + 0.23 * Math.sin(a),
          0
        ],
        color,
        3
      ));

      items.push(txt(
        String(k + 1),
        14,
        color,
        [x, y - 0.42, 0],
        true
      ));
    }

    items.push(txt(
      'each knob has its own partial derivative',
      16,
      GOLD,
      [
        cx,
        cy - h / 2 + 0.23,
        0
      ],
      false,
      w - 0.35
    ));

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // 0 — We previously moved only the step price.
  // Middle rent remained fixed at ten.
  // ------------------------------------------------------------

  let R = rentGraph(0, 10);

  const fixedMiddle = new M.VGroup(
    ring(
      R.p(0, 10),
      GOLD,
      0.20
    ),

    dash(
      [GX0, R.Y(10), 0],
      R.p(0, 10),
      GOLD,
      1.8
    )
  );

  await until(S(0));

  await play(
    ...putPicture(R.g),
    ...putMarks(fixedMiddle),
    ...fbox([
      ['step price can move', C.cyan],
      ['middle rent = 10', GOLD],
      'held fixed'
    ], GOLD),
    ...say('SO FAR: ONE NUMBER COULD MOVE', C.cyan)
  );

  await until(S(0) + 2.35);

  R = rentGraph(2, 10);

  await play(
    ...putPicture(R.g),
    ...putMarks(
      ring(R.p(0, 10), GOLD, 0.20)
    )
  );

  // ------------------------------------------------------------
  // 1 — Both numbers can move.
  // Show the line moving upward as well as tilting.
  // ------------------------------------------------------------

  R = rentGraph(2, 11);

  const raisedMiddle = new M.VGroup(
    arrow(
      R.p(0, 10),
      R.p(0, 11),
      C.violet,
      3.2
    ),

    ring(
      R.p(0, 11),
      GOLD,
      0.20
    )
  );

  await until(S(1));

  await play(
    ...putPicture(R.g),
    ...putMarks(raisedMiddle),
    ...fbox([
      ['step price: tilt', C.cyan],
      ['middle rent: height', C.violet],
      'both can change'
    ], C.cyan),
    ...say('TWO ADJUSTABLE NUMBERS')
  );

  // ------------------------------------------------------------
  // 2 — Imagine a machine with two knobs.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...clearMarks(),
    ...putPicture(
      machine(0, 10, null, false)
    ),
    ...fbox([
      ['knob 1: step price', C.cyan],
      ['knob 2: middle rent', C.violet]
    ]),
    ...say('A MACHINE WITH TWO KNOBS')
  );

  // ------------------------------------------------------------
  // 3 — Each setting gives exactly one loss.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...putPicture(
      machine(0, 10, null, true)
    ),
    ...fbox([
      'two inputs',
      'one output',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('EVERY SETTING GIVES ONE LOSS', GOLD)
  );

  // ------------------------------------------------------------
  // 4 — Draw the loss map.
  // Step price across; middle rent up.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...putPicture(
      mapPicture(false, false)
    ),
    ...fbox([
      ['across: step price', C.cyan],
      ['up: middle rent', C.violet]
    ]),
    ...say('TWO INPUTS: DRAW A MAP')
  );

  // ------------------------------------------------------------
  // 5 — Each map position represents a rent line.
  // Brighter colour means bigger loss.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...putPicture(
      mapPicture(true, false)
    ),
    ...fbox([
      'each spot = one rent line',
      ['dark = small loss', C.muted],
      ['bright = big loss', C.cyan]
    ]),
    ...say('COLOUR SHOWS THE LOSS')
  );

  const mapExamples = new M.VGroup(
    mapPoint(
      2,
      11,
      C.green,
      '0',
      0.30,
      0.26
    ),

    mapPoint(
      0,
      10,
      GOLD,
      '11',
      -0.25,
      -0.28
    ),

    mapPoint(
      4,
      13,
      C.ink,
      '20',
      -0.35,
      -0.28
    )
  );

  await until(S(5) + 3.0);

  await play(
    ...putMarks(mapExamples)
  );

  // ------------------------------------------------------------
  // 6 — Draw contour rings.
  // Each ring joins spots with exactly the same loss.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...clearMarks(),
    ...putPicture(
      mapPicture(true, true)
    ),
    ...fbox([
      ['CONTOUR RINGS', C.cyan],
      'same ring',
      ['same loss', GOLD]
    ]),
    ...say('JOIN SPOTS WITH THE SAME LOSS')
  );

  const highlightedRing = new M.VGroup(
    ...contourParts(
      11,
      GOLD,
      3.2,
      64
    )
  );

  await until(S(6) + 1.6);

  await play(
    ...putMarks(highlightedRing)
  );

  // ------------------------------------------------------------
  // 7 — The rings surround one lowest spot.
  // Step price 2, middle rent 11.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...putMarks(mapMinimum()),
    ...fbox([
      ['LOWEST SPOT', C.green],
      'step price  = 2',
      'middle rent = 11'
    ], C.green),
    ...say('ONE LOWEST SPOT AT THE CENTRE', C.green)
  );

  // ------------------------------------------------------------
  // 8 — The loss is zero at the perfect rent line.
  // ------------------------------------------------------------

  R = rentGraph(2, 11, false);

  const perfectMarks = new M.VGroup(
    ...STEPS.map((x, k) =>
      ring(
        R.p(x, RENTS[k]),
        C.green,
        0.19
      )
    )
  );

  await until(S(8));

  await play(
    ...clearMarks(),
    ...putPicture(R.g),
    ...putMarks(perfectMarks),
    ...fbox([
      'guesses: 9, 11, 13',
      'misses:  0, 0, 0',
      ['loss = 0', C.green]
    ], C.green),
    ...say('THE PERFECT LINE: ALL THREE DOTS', C.green)
  );

  // ------------------------------------------------------------
  // 9 — Return to the starting line.
  // Step price 0, middle rent 10, loss 11.
  // ------------------------------------------------------------

  R = rentGraph(0, 10);

  await until(S(9));

  await play(
    ...clearMarks(),
    ...putPicture(R.g),
    ...putMarks(
      rentMissMarks(R, 0, 10)
    ),
    ...fbox([
      'step price  = 0',
      'middle rent = 10',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('START AGAIN AT THE FLAT LINE', GOLD)
  );

  await until(S(9) + 2.45);

  await play(
    ...clearMarks(),
    ...putPicture(mapPicture()),
    ...putMarks(mapStart())
  );

  // ------------------------------------------------------------
  // 10 — How fast does the loss change if just one knob moves?
  // ------------------------------------------------------------

  const questionMarks = new M.VGroup(
    glowDot(
      mp(0, 10),
      GOLD,
      0.13
    ),

    arrow(
      mp(0, 10),
      mp(0.85, 10),
      C.cyan,
      3.2
    ),

    arrow(
      mp(0, 10),
      mp(0, 10.85),
      C.violet,
      3.2
    ),

    txt(
      '?',
      23,
      C.cyan,
      [
        mp(0.85, 10)[0] + 0.20,
        mp(0.85, 10)[1],
        0
      ],
      true
    ),

    txt(
      '?',
      23,
      C.violet,
      [
        mp(0, 10.85)[0],
        mp(0, 10.85)[1] + 0.23,
        0
      ],
      true
    )
  );

  await until(S(10));

  await play(
    ...putMarks(questionMarks),
    ...fbox([
      'move just one knob',
      'by a tiny amount',
      ['how fast does loss change?', GOLD]
    ], GOLD),
    ...say('HOW STEEP IN EACH DIRECTION?', GOLD)
  );

  // ------------------------------------------------------------
  // 11 — Freeze middle rent at ten.
  // Move only the step price.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...clearMarks(),
    ...putPicture(
      machine(0, 10, 'm')
    ),
    ...fbox([
      ['step price: moving', C.cyan],
      ['middle rent: fixed at 10', C.muted]
    ], C.cyan),
    ...say('TURN ONLY THE STEP PRICE', C.cyan)
  );

  // ------------------------------------------------------------
  // 12 — On the loss map, move across one row.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...putPicture(mapPicture()),
    ...putMarks(rowMarks()),
    ...fbox([
      ['middle rent = 10', C.muted],
      'move left or right',
      ['one row of the map', C.cyan]
    ], C.cyan),
    ...say('WALK ACROSS ONE ROW', C.cyan)
  );

  await play(
    ...putMarks(rowMarks(1))
  );

  // ------------------------------------------------------------
  // 13 — That row is the familiar U.
  // Derivative at step price zero = −8.
  // ------------------------------------------------------------

  let G = sliceGraph('s');

  await until(S(13));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...fbox([
      ['middle rent = 10', C.muted],
      'step prices: 0, 1, 2, 3, 4',
      'losses: 11, 5, 3, 5, 11'
    ], C.cyan),
    ...say('THIS ROW IS THE U WE ALREADY KNOW', C.cyan)
  );

  await until(S(13) + 2.6);

  await play(
    ...putMarks(
      sliceTangent(G, 0, -8)
    ),
    ...fbox([
      'at step price 0',
      ['derivative = −8', GOLD],
      'middle rent stays at 10'
    ], GOLD),
    ...say('STEP PRICE DERIVATIVE = −8', GOLD)
  );

  // ------------------------------------------------------------
  // 14 — Freeze the step price at zero.
  // Move only the middle rent.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...clearMarks(),
    ...putPicture(
      machine(0, 10, 's')
    ),
    ...fbox([
      ['step price: fixed at 0', C.muted],
      ['middle rent: moving', C.violet]
    ], C.violet),
    ...say('NOW TURN ONLY THE MIDDLE RENT', C.violet)
  );

  // ------------------------------------------------------------
  // 15 — On the loss map, move up one column.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...putPicture(mapPicture()),
    ...putMarks(colMarks(11)),
    ...fbox([
      ['step price = 0', C.muted],
      'move up or down',
      ['one column of the map', C.violet]
    ], C.violet),
    ...say('WALK UP ONE COLUMN', C.violet)
  );

  // ------------------------------------------------------------
  // 16 — Middle rent ten gives loss eleven.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...putMarks(colMarks()),
    ...fbox([
      'step price = 0',
      'middle rent = 10',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('AT MIDDLE RENT 10: LOSS = 11', GOLD)
  );

  // ------------------------------------------------------------
  // 17 — Raise middle rent to eleven.
  // Flat guesses: 11, 11, 11.
  // Misses: +2, 0, −2.
  // ------------------------------------------------------------

  R = rentGraph(0, 10);

  await until(S(17));

  await play(
    ...clearMarks(),
    ...putPicture(R.g),
    ...fbox([
      ['step price = 0', C.muted],
      'the line stays flat',
      ['raise middle rent', C.violet]
    ], C.violet),
    ...say('KEEP THE LINE FLAT', C.violet)
  );

  await until(S(17) + 2.1);

  R = rentGraph(0, 11);

  await play(
    ...putPicture(R.g),
    ...fbox([
      'middle rent = 11',
      ['guesses: 11, 11, 11', GOLD]
    ], GOLD),
    ...say('MOVE THE FLAT LINE UP TO 11', GOLD)
  );

  await until(S(17) + 5.2);

  await play(
    ...putMarks(
      rentMissMarks(R, 0, 11)
    ),
    ...fbox([
      ['11 − 9  = +2', COLORS[0]],
      ['11 − 11 = 0', COLORS[1]],
      ['11 − 13 = −2', COLORS[2]]
    ], C.violet),
    ...say('MISSES: +2, 0, −2', C.violet)
  );

  // ------------------------------------------------------------
  // 18 — Squares: 4, 0, 4.
  // Loss = 8.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...fbox([
      '(+2)² = 4',
      '  0²  = 0',
      '(−2)² = 4',
      ['loss = 4 + 0 + 4 = 8', GOLD]
    ], GOLD),
    ...say('AT MIDDLE RENT 11: LOSS = 8', GOLD)
  );

  // ------------------------------------------------------------
  // 19 — Middle rent twelve.
  // Misses: +3, +1, −1.
  // Loss: 9 + 1 + 1 = 11.
  // ------------------------------------------------------------

  R = rentGraph(0, 12);

  await until(S(19));

  await play(
    ...clearMarks(),
    ...putPicture(R.g),
    ...putMarks(
      rentMissMarks(R, 0, 12)
    ),
    ...fbox([
      'middle rent = 12',
      'guesses: 12, 12, 12',
      ['misses: +3, +1, −1', C.violet]
    ], C.violet),
    ...say('RAISE THE MIDDLE RENT TO 12', C.violet)
  );

  await until(S(19) + 4.1);

  await play(
    ...fbox([
      'squares: 9, 1, 1',
      '9 + 1 + 1',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('AT MIDDLE RENT 12: LOSS = 11', GOLD)
  );

  // ------------------------------------------------------------
  // 20 — The column makes another U.
  // Middle rents 10, 11, 12.
  // Losses 11, 8, 11.
  // ------------------------------------------------------------

  G = sliceGraph('m');

  await until(S(20));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...fbox([
      ['step price = 0', C.muted],
      'middle rent: 10, 11, 12',
      ['loss:        11, 8, 11', C.violet]
    ], C.violet),
    ...say('THE COLUMN MAKES ANOTHER U', C.violet)
  );

  // ------------------------------------------------------------
  // 21 — Zoom in at middle rent ten.
  // ------------------------------------------------------------

  const colFocus = new M.VGroup(
    glowDot(
      G.p(10, 11),
      GOLD,
      0.13
    ),

    ring(
      G.p(10, 11),
      GOLD,
      0.27
    )
  );

  await until(S(21));

  await play(
    ...putMarks(colFocus),
    ...fbox([
      'middle rent = 10',
      'step price = 0',
      ['how steep right here?', GOLD]
    ], GOLD),
    ...say('ZOOM IN AT MIDDLE RENT 10', GOLD)
  );

  // ------------------------------------------------------------
  // 22 — Nudge middle rent by one tenth.
  // Loss 11 → 10.43.
  // ------------------------------------------------------------

  G = zoomColumn(0.1);

  await until(S(22));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(
      columnSecant(G, 0.1)
    ),
    ...fbox([
      'middle rent: 10 → 10.1',
      ['input change = +0.1', GOLD],
      'loss: 11 → 10.43',
      ['loss change = −0.57', C.violet]
    ], C.violet),
    ...say('A TINY MIDDLE-RENT NUDGE', C.violet)
  );

  // ------------------------------------------------------------
  // 23 — Divide the loss change by the input change.
  // −0.57 ÷ 0.1 = −5.7, approximately −6.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    new M.Indicate(
      marksNow,
      { color: GOLD }
    ),
    ...fbox([
      ['loss change = −0.57', C.violet],
      ['input change = 0.1', GOLD],
      '−0.57 ÷ 0.1 = −5.7',
      ['approximately −6', C.green]
    ], C.green),
    ...say('STEEPNESS IS ABOUT −6', GOLD)
  );

  // ------------------------------------------------------------
  // 24 — Shrink the gap again.
  // The average change approaches exactly −6.
  //
  // h = 0.01:
  // loss(0, 10.01) = 10.9403
  // change = −0.0597
  // average change = −5.97
  // ------------------------------------------------------------

  G = zoomColumn(0.01);

  await until(S(24));

  await play(
    ...clearMarks(),
    ...putPicture(G.g),
    ...putMarks(
      columnSecant(G, 0.01)
    ),
    ...fbox([
      'gap 0.1  → −5.7',
      'gap 0.01 → −5.97',
      ['approaches −6', GOLD]
    ], GOLD),
    ...say('ZOOM CLOSER: SETTLES ON −6', GOLD)
  );

  await until(S(24) + 1.55);

  const exactColumnTangent = new M.VGroup(
    tangent(
      G,
      10,
      colLoss,
      -6,
      G.xmin,
      G.xmax,
      GOLD
    ),

    glowDot(
      G.p(10, 11),
      GOLD,
      0.12
    )
  );

  await play(
    ...putMarks(exactColumnTangent),
    ...fbox([
      'at middle rent 10',
      ['derivative = −6', GOLD],
      'step price held at 0'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 25 — Name each reading: partial derivative.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...clearMarks(),
    ...putPicture(
      partialComparison(true)
    ),
    ...fbox([
      ['PARTIAL DERIVATIVE', GOLD],
      'steepness for one input'
    ], GOLD),
    ...say('EACH READING IS A PARTIAL DERIVATIVE', GOLD)
  );

  // ------------------------------------------------------------
  // 26 — Partial means moving just one knob.
  // Keep the other one fixed.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...putPicture(
      machine(0, 10, 'm')
    ),
    ...fbox([
      ['move one input', C.cyan],
      ['freeze the other', C.muted]
    ]),
    ...say('PARTIAL = ONE KNOB AT A TIME')
  );

  await until(S(26) + 2.0);

  await play(
    ...putPicture(
      machine(0, 10, 's')
    ),
    ...fbox([
      ['move the other input', C.violet],
      ['freeze the first', C.muted]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 27 — At the starting line there are two partial derivatives.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...putPicture(mapPicture()),
    ...putMarks(questionMarksForPartials()),
    ...fbox([
      'starting line: (0, 10)',
      ['two inputs', C.cyan],
      ['two partial derivatives', GOLD]
    ], GOLD),
    ...say('TWO INPUTS, TWO PARTIAL DERIVATIVES', GOLD)
  );

  function questionMarksForPartials() {
    const p = mp(0, 10);

    return new M.VGroup(
      glowDot(
        p,
        GOLD,
        0.125
      ),

      arrow(
        p,
        mp(0.85, 10),
        C.cyan,
        3.4
      ),

      arrow(
        p,
        mp(0, 10.85),
        C.violet,
        3.4
      ),

      txt(
        '?',
        21,
        C.cyan,
        [
          mp(0.85, 10)[0] + 0.19,
          mp(0.85, 10)[1] - 0.12,
          0
        ],
        true
      ),

      txt(
        '?',
        21,
        C.violet,
        [
          mp(0, 10.85)[0] - 0.19,
          mp(0, 10.85)[1] + 0.20,
          0
        ],
        true
      )
    );
  }

  // ------------------------------------------------------------
  // 28 — Step price: −8.
  // Middle rent: −6.
  // ------------------------------------------------------------

  const rateS = txt(
    '−8',
    23,
    C.cyan,
    [
      mp(0.80, 10)[0] + 0.19,
      mp(0.80, 10)[1] - 0.25,
      0
    ],
    true
  );

  const rateM = txt(
    '−6',
    23,
    C.violet,
    [
      mp(0, 10.80)[0] - 0.30,
      mp(0, 10.80)[1] + 0.16,
      0
    ],
    true
  );

  const ratesOnMap = new M.VGroup(
    glowDot(
      mp(0, 10),
      GOLD,
      0.13
    ),

    arrow(
      mp(0, 10),
      mp(1, 10),
      C.cyan,
      3.3
    ),

    arrow(
      mp(0, 10),
      mp(0, 11),
      C.violet,
      3.3
    ),

    rateS,
    rateM
  );

  await until(S(28));

  await play(
    ...putMarks(ratesOnMap),
    ...fbox([
      'with respect to:',
      ['step price  → −8', C.cyan],
      ['middle rent → −6', C.violet]
    ], GOLD),
    ...say('TWO SEPARATE READINGS: −8 AND −6', GOLD)
  );

  // ------------------------------------------------------------
  // 29 — With respect to means which knob we turned.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...clearMarks(),
    ...putPicture(
      partialComparison(true)
    ),
    ...fbox([
      '“with respect to”',
      ['which knob did we turn?', GOLD]
    ], GOLD),
    ...say('WHICH INPUT ARE WE MEASURING?', GOLD)
  );

  // ------------------------------------------------------------
  // 30 — Both are negative.
  // Raising either knob a little lowers loss.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...putPicture(
      partialComparison(true, true)
    ),
    ...fbox([
      ['step price ↑  loss ↓', C.cyan],
      ['middle rent ↑ loss ↓', C.violet],
      ['both readings are negative', C.green]
    ], C.green),
    ...say('EITHER TINY INCREASE LOWERS LOSS', C.green)
  );

  // ------------------------------------------------------------
  // 31 — Compare magnitudes.
  // 8 is bigger than 6.
  // Equal tiny nudges:
  //
  // step price +0.1: loss 10.22, drop 0.78
  // middle rent +0.1: loss 10.43, drop 0.57
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...fbox([
      'ignore the minus signs',
      ['8 > 6', GOLD],
      'step price is steeper here'
    ], GOLD),
    ...say('8 IS STEEPER THAN 6', GOLD)
  );

  await until(S(31) + 3.1);

  await play(
    ...putPicture(
      tinyTurnComparison()
    ),
    ...fbox([
      'same tiny turn: +0.1',
      ['step price: −0.78', C.cyan],
      ['middle rent: −0.57', C.violet],
      ['step price helps more here', C.green]
    ], C.green),
    ...say('SAME TURN, DIFFERENT LOSS CHANGE', C.green)
  );

  // ------------------------------------------------------------
  // 32 — Formula.
  // A partial derivative is a derivative with one input moving
  // and all other inputs held fixed.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...putPicture(
      machine(0, 10, 'm')
    ),
    ...fbox([
      ['PARTIAL DERIVATIVE', GOLD],
      'derivative with respect',
      'to one moving input',
      ['all other inputs fixed', C.muted]
    ], GOLD),
    ...say('DERIVATIVE WITH OTHER INPUTS FROZEN', GOLD)
  );

  // ------------------------------------------------------------
  // 33 — In everyday language:
  // wiggle one knob, keep the others still, read the steepness.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...putPicture(
      machine(0.1, 10, 'm')
    ),
    ...fbox([
      ['wiggle one knob', C.cyan],
      ['keep the other still', C.muted],
      ['read the steepness', GOLD]
    ], GOLD),
    ...say('WIGGLE ONE, FREEZE THE REST', GOLD)
  );

  await until(S(33) + 2.0);

  await play(
    ...putPicture(
      machine(0, 10.1, 's')
    )
  );

  // ------------------------------------------------------------
  // 34 — Real models may have many adjustable numbers.
  // Each has its own partial derivative.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...putPicture(
      manyKnobs(2)
    ),
    ...fbox([
      'many model numbers',
      ['one reading per number', GOLD],
      'how does each affect loss?'
    ], GOLD),
    ...say('ONE PARTIAL DERIVATIVE PER KNOB')
  );

  await until(S(34) + 2.1);

  await play(
    ...putPicture(
      manyKnobs(5)
    )
  );

  await until(S(34) + 4.2);

  await play(
    ...putPicture(
      manyKnobs(7)
    )
  );

  // ------------------------------------------------------------
  // 35 — Trap: each partial derivative assumes the other
  // input stays fixed.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...putPicture(mapPicture()),
    ...putMarks(rowMarks(1)),
    ...fbox([
      ['TRAP', GOLD],
      'step price reading assumes',
      ['middle rent stays fixed', C.muted]
    ], GOLD),
    ...say('EACH READING HAS AN ASSUMPTION', GOLD)
  );

  // ------------------------------------------------------------
  // 36 — A partial derivative alone does not describe moving
  // both inputs at once.
  // ------------------------------------------------------------

  const diagonalQuestion = new M.VGroup(
    glowDot(
      mp(0, 10),
      GOLD,
      0.13
    ),

    dash(
      mp(0, 10),
      mp(1, 10),
      C.cyan,
      2.2
    ),

    dash(
      mp(0, 10),
      mp(0, 11),
      C.violet,
      2.2
    ),

    arrow(
      mp(0, 10),
      mp(1, 11),
      C.muted,
      3.3
    ),

    ring(
      mp(1, 11),
      C.muted,
      0.15
    ),

    txt(
      '?',
      24,
      GOLD,
      [
        mp(1, 11)[0] + 0.30,
        mp(1, 11)[1] + 0.23,
        0
      ],
      true
    )
  );

  await until(S(36));

  await play(
    ...putMarks(diagonalQuestion),
    ...fbox([
      'both knobs moving',
      ['a different question', GOLD]
    ], GOLD),
    ...say('WHAT IF BOTH KNOBS MOVE?', GOLD)
  );

  // ------------------------------------------------------------
  // 37 — Moving only one knob cannot reach the perfect line.
  //
  // Along middle rent 10:
  // best step price = 2, minimum loss = 3.
  //
  // Along step price 0:
  // best middle rent = 11, minimum loss = 8.
  // ------------------------------------------------------------

  const rowLimit = new M.VGroup(
    line(
      mp(MAP_SMIN, 10),
      mp(MAP_SMAX, 10),
      C.cyan,
      2.6
    ),

    arrow(
      mp(0, 10),
      mp(2, 10),
      GOLD,
      3.5
    ),

    glowDot(
      mp(0, 10),
      GOLD,
      0.10
    ),

    glowDot(
      mp(2, 10),
      C.cyan,
      0.12
    ),

    glowDot(
      mp(2, 11),
      C.green,
      0.12
    ),

    dash(
      mp(2, 10),
      mp(2, 11),
      C.muted,
      1.8
    ),

    pill('3', C.cyan, 20)
      .moveTo([mp(2, 10)[0] + 0.40, mp(2, 10)[1] - 0.36, 0]),

    pill('0', C.green, 20)
      .moveTo([mp(2, 11)[0] + 0.39, mp(2, 11)[1] + 0.28, 0])
  );

  await until(S(37));

  await play(
    ...putMarks(rowLimit),
    ...fbox([
      'only step price moves',
      'middle rent stays at 10',
      ['best loss = 3', C.cyan],
      ['not the true minimum', C.green]
    ], GOLD),
    ...say('ONE KNOB ALONE CANNOT REACH ZERO', GOLD)
  );

  await until(S(37) + 3.2);

  const bothLimits = new M.VGroup(
    line(
      mp(MAP_SMIN, 10),
      mp(MAP_SMAX, 10),
      C.cyan,
      2.5
    ),

    line(
      mp(0, MAP_MMIN),
      mp(0, MAP_MMAX),
      C.violet,
      2.5
    ),

    glowDot(
      mp(0, 10),
      GOLD,
      0.105
    ),

    glowDot(
      mp(2, 10),
      C.cyan,
      0.11
    ),

    glowDot(
      mp(0, 11),
      C.violet,
      0.11
    ),

    glowDot(
      mp(2, 11),
      C.green,
      0.13
    ),

    pill('3', C.cyan, 19)
      .moveTo([mp(2, 10)[0] + 0.40, mp(2, 10)[1] - 0.36, 0]),

    pill('8', C.violet, 19)
      .moveTo([mp(0, 11)[0] - 0.39, mp(0, 11)[1] + 0.28, 0]),

    pill('0', C.green, 19)
      .moveTo([mp(2, 11)[0] + 0.39, mp(2, 11)[1] + 0.28, 0])
  );

  await play(
    ...putMarks(bothLimits),
    ...fbox([
      ['row minimum = 3', C.cyan],
      ['column minimum = 8', C.violet],
      ['true minimum = 0', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 38 — The next lesson combines the two readings into
  // one direction.
  // Do not introduce the gradient calculation yet.
  // ------------------------------------------------------------

  const nextLessonMarks = new M.VGroup(
    glowDot(
      mp(0, 10),
      GOLD,
      0.13
    ),

    arrow(
      mp(0, 10),
      mp(1, 10),
      C.cyan,
      3.5
    ),

    arrow(
      mp(0, 10),
      mp(0, 11),
      C.violet,
      3.5
    ),

    txt(
      '−8',
      20,
      C.cyan,
      [
        mp(1, 10)[0] + 0.20,
        mp(1, 10)[1] - 0.24,
        0
      ],
      true
    ),

    txt(
      '−6',
      20,
      C.violet,
      [
        mp(0, 11)[0] - 0.30,
        mp(0, 11)[1] + 0.20,
        0
      ],
      true
    ),

    glowDot(
      mp(2, 11),
      C.green,
      0.11
    ),

    txt(
      '?',
      26,
      GOLD,
      [
        mp(1, 10.75)[0] + 0.12,
        mp(1, 10.75)[1] + 0.15,
        0
      ],
      true
    )
  );

  await until(S(38));

  await play(
    ...putMarks(nextLessonMarks),
    ...fbox([
      ['two partial derivatives', GOLD],
      'one combined direction?',
      ['next lesson', C.muted]
    ], GOLD),
    ...say('HOW DO WE COMBINE THE TWO READINGS?', GOLD)
  );

  // ------------------------------------------------------------
  // 39 — Try it preview.
  //
  // Freeze one knob and slide the other.
  // First demonstrate a row, then a column.
  // The actual draggable controls belong to the Try it interface.
  // ------------------------------------------------------------

  let movingDot = glowDot(
    mp(0, 10),
    GOLD,
    0.13
  );

  function rowGuideOnly() {
    return new M.VGroup(
      rect(
        MX1 - MX0,
        0.18,
        [CX, mp(2, 10)[1], 0],
        C.cyan,
        0.23,
        0
      ),

      line(
        mp(MAP_SMIN, 10),
        mp(MAP_SMAX, 10),
        C.cyan,
        2.5
      )
    );
  }

  function colGuideOnly() {
    return new M.VGroup(
      rect(
        0.18,
        MY1 - MY0,
        [
          mp(0, 11)[0],
          MAP_CY,
          0
        ],
        C.violet,
        0.23,
        0
      ),

      line(
        mp(0, MAP_MMIN),
        mp(0, MAP_MMAX),
        C.violet,
        2.5
      )
    );
  }

  await until(S(39));

  await play(
    ...putMarks(rowGuideOnly()),
    new M.FadeIn(movingDot),
    ...fbox([
      ['TRY IT', GOLD],
      'freeze middle rent',
      ['slide the step price', C.cyan]
    ], C.cyan),
    ...say('FREEZE ONE KNOB, SLIDE THE OTHER')
  );

  await play(
    new M.Transform(
      movingDot,
      glowDot(
        mp(2, 10),
        GOLD,
        0.13
      ),
      { runTime: 1.10 }
    )
  );

  await until(S(39) + 2.55);

  await play(
    new M.Transform(
      movingDot,
      glowDot(
        mp(0, 10),
        GOLD,
        0.13
      ),
      { runTime: 0.60 }
    )
  );

  await until(S(39) + 3.35);

  await play(
    ...putMarks(colGuideOnly()),
    ...fbox([
      ['TRY IT', GOLD],
      'freeze step price',
      ['slide the middle rent', C.violet]
    ], C.violet),
    ...say('ROW OR COLUMN: ONE INPUT MOVES', C.violet)
  );

  await play(
    new M.Transform(
      movingDot,
      glowDot(
        mp(0, 12),
        GOLD,
        0.13
      ),
      { runTime: 1.15 }
    )
  );

  // ------------------------------------------------------------
  // 40 — Challenge:
  // Find a starting spot where the partial derivative with
  // respect to middle rent is zero.
  //
  // Hint: look for a flat tangent on the column's loss curve.
  // Do not select the solution for the learner.
  // ------------------------------------------------------------

  G = sliceGraph('m');

  await until(S(40));

  await play(
    new M.FadeOut(movingDot),
    ...clearMarks(),
    ...putPicture(G.g),
    ...fbox([
      ['YOUR CHALLENGE', GOLD],
      'middle-rent partial',
      ['derivative = 0?', C.green],
      'hint: look for flatness'
    ], GOLD),
    ...say('FIND A ZERO MIDDLE-RENT PARTIAL', C.green)
  );

  // ------------------------------------------------------------
  // 41 — Recap.
  //
  // Partial derivative:
  // how loss changes when one input moves,
  // while all other inputs are held fixed.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...putPicture(
      partialComparison(true)
    ),
    ...fbox([
      ['PARTIAL DERIVATIVE', GOLD],
      'one input moves',
      'all other inputs stay fixed',
      ['read the local steepness', C.cyan]
    ], GOLD),
    ...say('ONE INPUT MOVES, THE REST STAY FIXED', GOLD)
  );

  await until(S(41) + 3.2);

  await play(
    ...putPicture(mapPicture()),
    ...putMarks(
      new M.VGroup(
        glowDot(
          mp(0, 10),
          GOLD,
          0.13
        ),

        arrow(
          mp(0, 10),
          mp(1, 10),
          C.cyan,
          3.3
        ),

        arrow(
          mp(0, 10),
          mp(0, 11),
          C.violet,
          3.3
        ),

        txt(
          '−8',
          22,
          C.cyan,
          [
            mp(1, 10)[0] + 0.22,
            mp(1, 10)[1] - 0.25,
            0
          ],
          true
        ),

        txt(
          '−6',
          22,
          C.violet,
          [
            mp(0, 11)[0] - 0.31,
            mp(0, 11)[1] + 0.18,
            0
          ],
          true
        )
      )
    ),
    ...fbox([
      'at our starting line',
      ['step price partial = −8', C.cyan],
      ['middle rent partial = −6', C.violet],
      ['two knobs, two readings', GOLD]
    ], GOLD),
    ...say('PARTIAL DERIVATIVES: ONE READING PER INPUT')
  );

  await until(E(41));
}

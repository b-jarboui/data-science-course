// lesson 10.1.5
// Least squares as projection: the closest point in list space.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// The 12-dimensional geometry is illustrated schematically in 3D.
// Uses the supplied engine API; browser playback has not been runtime-tested.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Shared chapter data: rows ordered by area, then building X, Y, Z.

  const AREAS = [
    40, 40, 40,
    60, 60, 60,
    80, 80, 80,
    100, 100, 100
  ];

  const RENTS = [
    860, 770, 770,
    1040, 1020, 940,
    1250, 1210, 1140,
    1470, 1380, 1350
  ];

  const BUILDINGS = [
    'X', 'Y', 'Z',
    'X', 'Y', 'Z',
    'X', 'Y', 'Z',
    'X', 'Y', 'Z'
  ];

  const ONES = AREAS.map(() => 1);

  const INTERCEPT = 400;
  const SLOPE = 10;
  const MEAN_RENT = 1100;

  const FITTED = AREAS.map(a => INTERCEPT + SLOPE * a);
  const RESIDUALS = RENTS.map((r, k) => r - FITTED[k]);

  const ACTUAL_CENTRED = RENTS.map(r => r - MEAN_RENT);
  const FITTED_CENTRED = FITTED.map(r => r - MEAN_RENT);

  const sum = xs => xs.reduce((a, b) => a + b, 0);
  const norm2 = xs => sum(xs.map(v => v * v));
  const dotProduct = (a, b) => sum(a.map((v, k) => v * b[k]));

  const SSE = norm2(RESIDUALS);
  const SST = norm2(ACTUAL_CENTRED);
  const SSR = norm2(FITTED_CENTRED);

  const PINK = C.pink || '#F472B6';

  const ACTUAL = C.cyan;
  const FIT = C.green;
  const RESID = PINK;
  const ONE = C.amber;
  const AREA = C.violet;

  const BC = {
    X: C.cyan,
    Y: C.amber,
    Z: PINK
  };

  // Laptop: main picture left, formula box right.
  // Phone: main picture above, formula box below.

  const CX = P ? 0 : -2.6;
  const CY = P ? 0.45 : -0.35;

  const W = P ? FW - 1.3 : 7.2;

  const PILL = P ? [0, 3.75, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -3.95, 0] : [4.3, -0.3, 0];

  const pt = (x, y) => [x, y, 0];
  const local = (x, y) => pt(CX + x, CY + y);

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fmt = v => v.toLocaleString('en-US');

  const signed = v =>
    v > 0 ? `+${fmt(v)}` :
    v < 0 ? `−${fmt(Math.abs(v))}` :
    '0';

  const add = (a, b) =>
    pt(a[0] + b[0], a[1] + b[1]);

  const sub = (a, b) =>
    pt(a[0] - b[0], a[1] - b[1]);

  const mul = (a, k) =>
    pt(a[0] * k, a[1] * k);

  function txt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  // Label on a small dark card, so lines behind it do not cross the words.
  function ctxt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    const r = new M.RoundedRectangle({
      width: t.getWidth() + 0.20,
      height: t.getHeight() + 0.14,
      cornerRadius: 0.08,
      color: C.card,
      strokeWidth: 1
    });
    r.setFill(C.card, 0.9);
    r.moveTo(p);
    t.moveTo(p);
    return new M.VGroup(r, t);
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function dot(p, radius = 0.085, color = C.cyan) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function glowDot(p, color = C.cyan, radius = 0.095) {
    const halo = dot(p, radius * 1.9, color);
    halo.setFill(color, 0.16);

    const d = dot(p, radius, color);

    return new M.VGroup(halo, d);
  }

  function rect(w, h, p, color, opacity = 0.15) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function outline(w, h, p, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 17) {
    const g = pill(s, color, size);
    g.moveTo(p);
    return g;
  }

  // Arrow constructed from supported line primitives.
  // No additional Arrow or 3D engine classes are required.

  function arrow(a, b, color = C.cyan, strokeWidth = 4, head = 0.18) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.hypot(dx, dy);

    if (len < 0.00001) {
      return glowDot(a, color, 0.055);
    }

    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(head, len * 0.35);
    const w = h * 0.50;

    const back = pt(
      b[0] - ux * h,
      b[1] - uy * h
    );

    const left = pt(
      back[0] - uy * w,
      back[1] + ux * w
    );

    const right = pt(
      back[0] + uy * w,
      back[1] - ux * w
    );

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(left, b, color, strokeWidth),
      line(right, b, color, strokeWidth)
    );
  }

  function rightAngle(p, u, v, size = 0.22, color = C.amber) {
    const a = add(p, mul(u, size));
    const b = add(a, mul(v, size));
    const c = add(p, mul(v, size));

    return new M.VGroup(
      line(a, b, color, 2.5),
      line(b, c, color, 2.5)
    );
  }

  function bracket(x, yTop, yBottom, side, color = C.muted) {
    const d = side * 0.12;

    return new M.VGroup(
      line(pt(x, yTop), pt(x, yBottom), color, 2),
      line(pt(x, yTop), pt(x + d, yTop), color, 2),
      line(pt(x, yBottom), pt(x + d, yBottom), color, 2)
    );
  }

  // Formula box: same structure as the approved reference.
  // Leading spaces indent monospaced formula rows.

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const s = rows[i][0];
      const ind = s.length - s.trimStart().length;
      return t.getWidth() + cw * ind;
    });

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];
      const ind = cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.2;
    const maxh = P ? 2.65 : 4.0;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  // Picture management.
  // Existing visible objects are never wrapped in new groups.
  // Groups are constructed before their first FadeIn.

  let visible = [];

  function clearPicture() {
    const a = visible.map(g => new M.FadeOut(g));
    visible = [];
    return a;
  }

  function picture(...groups) {
    const a = clearPicture();

    groups.forEach(g => {
      visible.push(g);
      a.push(new M.FadeIn(g));
    });

    return a;
  }

  function addPicture(...groups) {
    groups.forEach(g => visible.push(g));
    return groups.map(g => new M.FadeIn(g));
  }

  function removePicture(...groups) {
    const a = [];

    groups.forEach(g => {
      if (visible.includes(g)) {
        visible = visible.filter(x => x !== g);
        a.push(new M.FadeOut(g));
      }
    });

    return a;
  }

  // ============================================================
  // 0-2: recap projection onto a line from chapter nine.
  // ============================================================

  const O0 = local(-2.65, -0.80);
  const F0 = local(0.65, -0.80);
  const A0 = local(0.65, 1.18);

  const recapLine = line(
    local(-3.15, -0.80),
    local(3.15, -0.80),
    C.muted,
    3
  );

  const recapOrigin = dot(O0, 0.06, C.muted);

  const recapActual = arrow(
    O0,
    A0,
    ACTUAL,
    4
  );

  const recapFit = arrow(
    O0,
    F0,
    FIT,
    4
  );

  const recapFoot = glowDot(F0, FIT);

  const recapBase = new M.VGroup(
    recapLine,
    recapOrigin,

    txt(
      'a line of possible points',
      17,
      C.muted,
      local(0, -1.34)
    )
  );

  const recapActualLabel = txt(
    'given arrow',
    19,
    ACTUAL,
    local(-1.15, 0.75)
  );

  const recapFitLabel = tag(
    'CLOSEST POINT',
    FIT,
    local(0.65, -1.73),
    P ? 17 : 16
  );

  // 0: closest point on a line.

  await until(S(0));
  await play(
    ...picture(
      recapBase,
      recapActual,
      recapActualLabel,
      recapFit,
      recapFoot,
      recapFitLabel
    ),

    ...say('RECAP: THE CLOSEST POINT', C.green)
  );

  // 1: leftover arrow meets the line at 90 degrees.

  const recapResidual = arrow(
    F0,
    A0,
    RESID,
    4
  );

  const recapAngle = rightAngle(
    F0,
    pt(1, 0),
    pt(0, 1),
    0.26,
    C.amber
  );

  const recapResidualLabel = txt(
    'leftover',
    18,
    RESID,
    local(1.55, 0.25)
  );

  const recap90 = txt(
    '90°',
    19,
    C.amber,
    local(1.16, -0.42),
    true
  );

  await until(S(1));
  await play(
    ...addPicture(
      recapResidual,
      recapAngle,
      recapResidualLabel,
      recap90
    ),

    ...say('LEFTOVER AT A RIGHT ANGLE', C.amber)
  );

  // 2: least squares will use the same idea.

  await until(S(2));
  await play(
    new M.Indicate(recapFoot, { color: FIT }),

    ...fbox([
      ['SAME IDEA TODAY', C.green],
      'actual rent list',
      'closest fitted list',
      ['leftover = residuals', RESID]
    ], C.green),

    ...say('LEAST SQUARES AS PROJECTION', C.green)
  );

  // ============================================================
  // 3-6: a list of twelve rents is one vector.
  // ============================================================

  // Compact 12-row list table.
  // Rows preserve the chapter's area / building order.

  function listTable(
    values,
    heading,
    color = ACTUAL,
    signedValues = false,
    showContext = true
  ) {
    const rowH = P ? 0.29 : 0.255;

    const top = CY + (P ? 1.83 : 1.67);
    const rowTop = top - 0.65;

    const parts = [
      txt(
        heading,
        P ? 22 : 21,
        color,
        pt(CX, top)
      )
    ];

    const xArea = CX - 1.95;
    const xBuilding = CX - 0.90;
    const xValue = CX + 0.90;

    if (showContext) {
      parts.push(
        txt('area', 15, C.muted, pt(xArea, rowTop + 0.29)),
        txt('building', 15, C.muted, pt(xBuilding, rowTop + 0.29)),
        txt('rent ($)', 15, color, pt(xValue, rowTop + 0.29))
      );
    }

    const valueX = showContext ? xValue : CX;

    values.forEach((v, k) => {
      const y = rowTop - k * rowH;

      if (showContext) {
        parts.push(
          txt(
            String(AREAS[k]),
            P ? 15 : 14,
            C.muted,
            pt(xArea, y),
            true
          ),

          txt(
            BUILDINGS[k],
            P ? 15 : 14,
            BC[BUILDINGS[k]],
            pt(xBuilding, y),
            true
          )
        );
      }

      parts.push(
        txt(
          signedValues ? signed(v) : fmt(v),
          P ? 17 : 16,
          color,
          pt(valueX, y),
          true
        )
      );

      if (showContext && k % 3 === 2 && k < 11) {
        parts.push(
          line(
            pt(CX - 2.55, y - rowH / 2),
            pt(CX + 1.85, y - rowH / 2),
            C.muted,
            0.8
          )
        );
      }
    });

    const bTop = rowTop + rowH * 0.45;
    const bBottom = rowTop - 11 * rowH - rowH * 0.45;

    parts.push(
      bracket(valueX - 0.72, bTop, bBottom, 1, color),
      bracket(valueX + 0.72, bTop, bBottom, -1, color)
    );

    return new M.VGroup(...parts);
  }

  const actualList = listTable(
    RENTS,
    'Actual rent list',
    ACTUAL
  );

  // 3: write all twelve rents in one ordered list.

  await until(S(3));
  await play(
    ...picture(actualList),

    ...fbox([
      ['12 APARTMENTS', ACTUAL],
      '4 different sizes',
      '3 buildings',
      ['12 rents in one list', ACTUAL]
    ], ACTUAL),

    ...say('WRITE THE 12 RENTS IN ORDER')
  );

  // One list is represented by one vector arrow.

  function vectorPicture() {
    const values = [
      '860',
      '770',
      '770',
      '1,040',
      '⋮',
      '1,350'
    ];

    const xList = CX - 1.95;
    const top = CY + 0.93;
    const rowH = 0.39;

    const parts = [
      txt(
        '12 entries',
        19,
        ACTUAL,
        pt(xList, top + 0.48)
      )
    ];

    values.forEach((v, k) => {
      parts.push(
        txt(
          v,
          19,
          ACTUAL,
          pt(xList, top - k * rowH),
          true
        )
      );
    });

    parts.push(
      bracket(
        xList - 0.65,
        top + 0.22,
        top - 5 * rowH - 0.22,
        1,
        ACTUAL
      ),

      bracket(
        xList + 0.65,
        top + 0.22,
        top - 5 * rowH - 0.22,
        -1,
        ACTUAL
      ),

      txt(
        '→',
        30,
        C.muted,
        local(-0.55, -0.04)
      ),

      arrow(
        local(0.35, -1.17),
        local(2.55, 1.05),
        ACTUAL,
        5
      ),

      tag(
        'ONE VECTOR',
        ACTUAL,
        local(1.40, -1.55),
        17
      ),

      txt(
        'one arrow',
        17,
        ACTUAL,
        local(2.60, 0.02)
      )
    );

    return new M.VGroup(...parts);
  }

  // 4: a vector is an ordered list, pictured as an arrow.

  await until(S(4));
  await play(
    ...picture(vectorPicture()),

    ...fbox([
      ['VECTOR', ACTUAL],
      'a list of numbers',
      'in a fixed order',
      ['picture it as an arrow', ACTUAL]
    ], ACTUAL),

    ...say('VECTOR = AN ORDERED LIST')
  );

  // 5: each entry is one coordinate.
  // No literal drawing of 12 spatial directions is attempted.

  function dimensionsPicture() {
    const parts = [];

    const cols = 4;
    const rows = 3;

    const dx = P ? 1.38 : 1.45;
    const dy = 0.77;

    for (let k = 0; k < 12; k++) {
      const c = k % cols;
      const r = Math.floor(k / cols);

      const x = CX + (c - 1.5) * dx;
      const y = CY + 0.79 - r * dy;

      const box = outline(
        dx * 0.79,
        0.51,
        pt(x, y),
        ACTUAL
      );

      parts.push(
        box,

        txt(
          `x${k + 1}`,
          18,
          ACTUAL,
          pt(x, y),
          true
        )
      );
    }

    parts.push(
      txt(
        'One coordinate for every apartment',
        P ? 18 : 19,
        C.muted,
        local(0, 1.52)
      ),

      tag(
        '12 DIMENSIONS',
        ACTUAL,
        local(0, -1.78),
        19
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(5));
  await play(
    ...picture(dimensionsPicture()),

    ...fbox([
      ['12 NUMBERS', ACTUAL],
      '= 12 coordinates',
      '= 12 dimensions',
      ['too many to draw', C.amber]
    ], C.violet),

    ...say('12 NUMBERS · 12 DIMENSIONS', C.violet)
  );

  // Schematic 3D coordinate axes, projected onto the screen.

  function threeDirections() {
    const o = local(-0.65, -0.88);

    const x = local(2.55, -0.88);
    const y = local(-2.50, 0.24);
    const z = local(-0.65, 1.58);

    const a = local(1.70, 1.02);
    const f = local(1.70, -0.31);

    return new M.VGroup(
      arrow(o, x, C.muted, 2),
      arrow(o, y, C.muted, 2),
      arrow(o, z, C.muted, 2),

      txt('x', 18, C.muted, local(2.76, -0.88)),
      txt('y', 18, C.muted, local(-2.71, 0.39)),
      txt('z', 18, C.muted, local(-0.65, 1.78)),

      arrow(o, a, ACTUAL, 4),

      dashed(f, a, C.muted),

      txt(
        'vector',
        19,
        ACTUAL,
        local(1.40, 1.34)
      ),

      txt(
        'A three-dimensional illustration',
        P ? 17 : 18,
        C.muted,
        local(0, -1.70)
      )
    );
  }

  // 6: illustrate the idea in three dimensions.

  await until(S(6));
  await play(
    ...picture(threeDirections()),

    ...fbox([
      ['DRAW JUST 3', C.violet],
      'the real rent list',
      'has 12 dimensions',
      ['same geometric idea', C.green]
    ], C.violet),

    ...say('3D PICTURE · SAME IDEA', C.violet)
  );

  // ============================================================
  // 7-13: the two design columns.
  // ============================================================

  // Shared apartment scatter plot.
  // The duplicate rent at area 40 is represented with concentric
  // amber and pink dots at exactly the same coordinates.

  function scatterPicture(options = {}) {
    const {
      fitted = true,
      residuals = false,
      highlight = false,
      title = 'Actual rents'
    } = options;

    const left = CX - W / 2 + 0.53;
    const right = CX + W / 2 - 0.25;

    const bottom = CY - 1.63;
    const top = CY + 1.53;

    const gx = a =>
      left + (a - 35) / 70 * (right - left);

    const gy = r =>
      bottom + (r - 700) / 850 * (top - bottom);

    const parts = [];

    [800, 1000, 1200, 1400].forEach(v => {
      parts.push(
        line(
          pt(left, gy(v)),
          pt(right, gy(v)),
          C.muted,
          0.65
        ),

        txt(
          fmt(v),
          P ? 13 : 14,
          C.muted,
          pt(left - 0.33, gy(v)),
          true
        )
      );
    });

    [40, 60, 80, 100].forEach(a => {
      parts.push(
        line(
          pt(gx(a), bottom),
          pt(gx(a), top),
          C.muted,
          0.65
        ),

        txt(
          String(a),
          P ? 14 : 15,
          C.muted,
          pt(gx(a), bottom - 0.24),
          true
        )
      );
    });

    parts.push(
      line(
        pt(left, bottom),
        pt(right, bottom),
        C.muted,
        2
      ),

      line(
        pt(left, bottom),
        pt(left, top),
        C.muted,
        2
      ),

      txt(
        'rent ($)',
        15,
        C.muted,
        pt(left + 0.42, top + 0.19)
      ),

      txt(
        'area (m²)',
        15,
        C.muted,
        pt(right - 0.50, bottom - 0.52)
      ),

      txt(
        title,
        P ? 19 : 18,
        C.ink,
        pt(CX + 0.55, top + 0.19)
      )
    );

    if (fitted) {
      parts.push(
        line(
          pt(gx(35), gy(400 + 10 * 35)),
          pt(gx(105), gy(400 + 10 * 105)),
          C.ink,
          4
        )
      );
    }

    if (residuals) {
      RENTS.forEach((r, k) => {
        // The Y and Z residuals at 40 m² coincide exactly.
        if (k === 2) return;

        const a = AREAS[k];

        parts.push(
          line(
            pt(gx(a), gy(FITTED[k])),
            pt(gx(a), gy(r)),
            highlight && k === 6
              ? C.amber
              : BC[BUILDINGS[k]],
            highlight && k === 6 ? 4 : 2
          )
        );
      });
    }

    RENTS.forEach((r, k) => {
      const p = pt(
        gx(AREAS[k]),
        gy(r)
      );

      const color = BC[BUILDINGS[k]];

      if (k === 1) {
        const ring = new M.Circle({
          radius: 0.105,
          color: C.amber,
          strokeWidth: 2.5
        });

        ring.moveTo(p);
        parts.push(ring);
      } else if (k === 2) {
        parts.push(dot(p, 0.055, PINK));
      } else {
        parts.push(glowDot(p, color, 0.065));
      }
    });

    if (highlight) {
      const a = AREAS[6];

      const y1 = gy(FITTED[6]);
      const y2 = gy(RENTS[6]);

      parts.push(
        txt(
          '+50',
          16,
          C.amber,
          pt(gx(a) + 0.36, (y1 + y2) / 2),
          true
        )
      );
    }

    const legendY = bottom - 0.52;

    ['X', 'Y', 'Z'].forEach((b, k) => {
      const x = left + 0.18 + k * 0.60;

      parts.push(
        dot(pt(x, legendY), 0.055, BC[b]),

        txt(
          b,
          14,
          BC[b],
          pt(x + 0.19, legendY),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // 7: which rent lists can a straight line produce?

  await until(S(7));
  await play(
    ...picture(scatterPicture({
      fitted: true,
      title: 'A line makes fitted rents'
    })),

    ...fbox([
      ['QUESTION', C.amber],
      'which rent lists',
      'can a straight line',
      'produce?'
    ], C.amber),

    ...say('WHICH LISTS CAN A LINE MAKE?', C.amber)
  );

  // 8: fitted rent = intercept + slope × area.

  await until(S(8));
  await play(
    ...fbox([
      ['FITTED RENT', FIT],
      '= intercept',
      '  + slope × area',
      ['400 + 10 × area', FIT],
      'at 80 m²:',
      ['400 + 800 = 1,200', FIT]
    ], FIT),

    ...say('INTERCEPT + SLOPE × AREA', FIT)
  );

  // Column display. Each column has twelve entries.

  function designTable(stage = 2, extra = false) {
    const rowH = P ? 0.285 : 0.25;
    const top = CY + (P ? 1.90 : 1.70);
    const rowTop = top - 0.68;

    const xIndex = CX - 2.40;
    const xOne = CX - 1.28;
    const xArea = CX + 0.12;
    const xFit = CX + 1.65;

    const parts = [
      txt(
        stage === 1
          ? 'The starting amount'
          : 'One row per apartment',
        P ? 20 : 19,
        C.ink,
        pt(CX, top)
      ),

      txt(
        'row',
        14,
        C.muted,
        pt(xIndex, rowTop + 0.33)
      ),

      txt(
        'ones',
        17,
        ONE,
        pt(xOne, rowTop + 0.33)
      )
    ];

    if (stage >= 2) {
      parts.push(
        txt(
          'areas',
          17,
          AREA,
          pt(xArea, rowTop + 0.33)
        )
      );
    }

    if (stage >= 3) {
      parts.push(
        txt(
          'fitted',
          17,
          FIT,
          pt(xFit, rowTop + 0.33)
        )
      );
    }

    for (let k = 0; k < 12; k++) {
      const y = rowTop - k * rowH;

      parts.push(
        txt(
          String(k + 1),
          14,
          C.muted,
          pt(xIndex, y),
          true
        ),

        txt(
          '1',
          P ? 17 : 16,
          ONE,
          pt(xOne, y),
          true
        )
      );

      if (stage >= 2) {
        parts.push(
          txt(
            String(AREAS[k]),
            P ? 17 : 16,
            AREA,
            pt(xArea, y),
            true
          )
        );
      }

      if (stage >= 3) {
        parts.push(
          txt(
            fmt(FITTED[k]),
            P ? 17 : 16,
            FIT,
            pt(xFit, y),
            true
          )
        );
      }

      if (k % 3 === 2 && k < 11) {
        parts.push(
          line(
            pt(xIndex - 0.30, y - rowH / 2),
            pt(xFit + 0.72, y - rowH / 2),
            C.muted,
            0.7
          )
        );
      }
    }

    const bTop = rowTop + rowH * 0.44;
    const bBottom = rowTop - 11 * rowH - rowH * 0.44;

    parts.push(
      bracket(xOne - 0.36, bTop, bBottom, 1, ONE),
      bracket(xOne + 0.36, bTop, bBottom, -1, ONE)
    );

    if (stage >= 2) {
      parts.push(
        bracket(xArea - 0.55, bTop, bBottom, 1, AREA),
        bracket(xArea + 0.55, bTop, bBottom, -1, AREA)
      );
    }

    if (stage >= 3) {
      parts.push(
        bracket(xFit - 0.70, bTop, bBottom, 1, FIT),
        bracket(xFit + 0.70, bTop, bBottom, -1, FIT)
      );
    }

    return new M.VGroup(...parts);
  }

  // 9: intercept times a vector of twelve ones.

  await until(S(9));
  await play(
    ...picture(designTable(1)),

    ...fbox([
      ['FIRST LIST', ONE],
      'intercept × ones',
      '400 × [1, 1, ...]',
      ['same 400 in each row', ONE]
    ], ONE),

    ...say('INTERCEPT × TWELVE ONES', ONE)
  );

  // 10: slope times the area vector.

  await until(S(10));
  await play(
    ...picture(designTable(2)),

    ...fbox([
      ['SECOND LIST', AREA],
      'slope × areas',
      '10 × [40, 40, ...]',
      ['changes with area', AREA]
    ], AREA),

    ...say('PLUS SLOPE × THE AREAS', AREA)
  );

  // 11: the column of ones supplies the same starting amount.

  function startingAmountPicture() {
    const xs = [
      CX - 2.05,
      CX - 0.20,
      CX + 1.65
    ];

    const parts = [
      txt(
        'ones',
        19,
        ONE,
        pt(xs[0], CY + 1.50)
      ),

      txt(
        'intercept',
        18,
        C.muted,
        pt(xs[1], CY + 1.50)
      ),

      txt(
        'starting rent',
        19,
        ONE,
        pt(xs[2], CY + 1.50)
      )
    ];

    for (let k = 0; k < 5; k++) {
      const y = CY + 0.86 - k * 0.53;

      parts.push(
        txt('1', 21, ONE, pt(xs[0], y), true),
        txt('× 400', 20, ONE, pt(xs[1], y), true),

        rect(
          1.20,
          0.37,
          pt(xs[2], y),
          ONE,
          0.19
        ),

        txt(
          '400',
          19,
          ONE,
          pt(xs[2], y),
          true
        )
      );
    }

    parts.push(
      txt(
        '⋮',
        24,
        ONE,
        pt(xs[0], CY - 1.72)
      ),

      txt(
        '⋮',
        24,
        ONE,
        pt(xs[2], CY - 1.72)
      ),

      txt(
        'Same starting amount in all 12 rows',
        P ? 16 : 17,
        C.muted,
        local(0, -2.02)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(11));
  await play(
    ...picture(startingAmountPicture()),

    ...fbox([
      ['WHY THE ONES?', ONE],
      'each apartment gets',
      'the same intercept',
      ['1 × 400 = 400', ONE]
    ], ONE),

    ...say('ONES GIVE EVERY ROW THE SAME START', ONE)
  );

  // 12: one apartment per row, two design columns.

  const design = designTable(2);

  await until(S(12));
  await play(
    ...picture(design),

    ...fbox([
      ['12 ROWS', C.muted],
      ['column 1: ones', ONE],
      ['column 2: areas', AREA],
      'one apartment',
      'in every row'
    ], C.cyan),

    ...say('TWO COLUMNS · TWELVE ROWS')
  );

  const rowH = P ? 0.285 : 0.25;

  const tableTop = CY + (P ? 1.90 : 1.70) - 0.68;

  const designHeight = 12 * rowH + 0.56;
  const designY = tableTop - 5.5 * rowH + 0.12;

  const designBox1 = outline(
    1.10,
    designHeight,
    pt(CX - 1.28, designY),
    ONE
  );

  const designBox2 = outline(
    1.28,
    designHeight,
    pt(CX + 0.12, designY),
    AREA
  );

  // 13: give the two columns their name.

  await until(S(13));
  await play(
    ...addPicture(designBox1, designBox2),

    ...fbox([
      ['DESIGN COLUMNS', C.green],
      ['ones', ONE],
      ['areas', AREA],
      'the two basic lists',
      'used by our model'
    ], C.green),

    ...say('THE DESIGN COLUMNS', C.green)
  );

  // ============================================================
  // 14-19: the column space and the closest point.
  // ============================================================

  // Schematic projection of a plane in list space.
  //
  // U and V represent the two independent design directions.
  // Their drawn angles and lengths are illustrative, not a
  // metric reconstruction of the actual 12-dimensional vectors.
  //
  // The residual direction is perpendicular to the entire plane.

  const PO = local(-2.47, -1.17);

  const U = pt(3.87, 0);
  const V = pt(1.47, 1.03);

  const planePoint = (u, v) =>
    add(PO, add(mul(U, u), mul(V, v)));

  const PF = planePoint(0.54, 0.65);

  const PA = add(
    PF,
    pt(0, 1.82)
  );

  const PQ = planePoint(0.18, 0.20);

  function planeSurface() {
    const parts = [];

    const corners = [
      planePoint(-0.10, -0.12),
      planePoint(1.04, -0.12),
      planePoint(1.04, 1.08),
      planePoint(-0.10, 1.08)
    ];

    // Parallel grid lines establish the flat sheet.

    for (let i = 0; i <= 10; i++) {
      const u = -0.10 + 1.14 * i / 10;

      parts.push(
        line(
          planePoint(u, -0.12),
          planePoint(u, 1.08),
          AREA,
          0.8
        )
      );
    }

    for (let j = 0; j <= 6; j++) {
      const v = -0.12 + 1.20 * j / 6;

      parts.push(
        line(
          planePoint(-0.10, v),
          planePoint(1.04, v),
          AREA,
          0.8
        )
      );
    }

    for (let k = 0; k < 4; k++) {
      parts.push(
        line(
          corners[k],
          corners[(k + 1) % 4],
          AREA,
          2
        )
      );
    }

    parts.push(
      dot(PO, 0.055, C.muted),

      txt(
        'origin',
        14,
        C.muted,
        add(PO, pt(-0.13, -0.25))
      )
    );

    return new M.VGroup(...parts);
  }

  function basisArrows() {
    const uEnd = planePoint(0.80, 0);
    const vEnd = planePoint(0, 0.94);

    return new M.VGroup(
      arrow(PO, uEnd, ONE, 3.5),
      arrow(PO, vEnd, AREA, 3.5),

      txt(
        'ones direction',
        16,
        ONE,
        add(uEnd, pt(-0.56, -0.32))
      ),

      ctxt(
        'areas direction',
        16,
        AREA,
        add(vEnd, pt(-1.22, 0.10))
      )
    );
  }

  function planeMixing() {
    const spots = [
      [0.15, 0.30],
      [0.36, 0.75],
      [0.62, 0.25],
      [0.82, 0.72]
    ];

    const colors = [
      C.muted,
      FIT,
      FIT,
      C.muted
    ];

    const parts = spots.map(([u, v], k) =>
      glowDot(
        planePoint(u, v),
        colors[k],
        0.065
      )
    );

    parts.push(
      arrow(
        PO,
        planePoint(0.72, 0.55),
        FIT,
        4
      ),

      txt(
        'one possible fitted list',
        17,
        FIT,
        local(0.15, 0.55)
      )
    );

    return new M.VGroup(...parts);
  }

  let plane = planeSurface();
  let basis = basisArrows();
  let mixtures = planeMixing();

  // 14: combinations of the two design columns form a sheet.

  await until(S(14));
  await play(
    ...picture(plane, basis),

    ...fbox([
      ['MIX TWO DIRECTIONS', C.violet],
      ['a × ones', ONE],
      ['+ b × areas', AREA],
      'any intercept a',
      'any slope b'
    ], C.violet),

    ...say('TWO COLUMNS MAKE A FLAT SHEET', C.violet)
  );

  await until(S(14) + 2.3);
  await play(
    ...addPicture(mixtures),

    ...fbox([
      ['ALL POSSIBLE MIXES', C.violet],
      'different intercepts',
      'different slopes',
      ['different points', FIT],
      'on the same sheet'
    ], C.violet)
  );

  // 15: name the column space.

  let planeName = tag(
    'COLUMN SPACE',
    AREA,
    local(1.40, -1.87),
    17
  );

  await until(S(15));
  await play(
    ...addPicture(planeName),

    ...say('COLUMN SPACE = POSSIBLE FITTED LISTS', AREA)
  );

  // Actual rent arrow: endpoint above the model's plane.

  function actualArrowLayer() {
    return new M.VGroup(
      arrow(PO, PA, ACTUAL, 4.5),
      glowDot(PA, ACTUAL, 0.085),

      txt(
        'actual rent vector',
        P ? 18 : 17,
        ACTUAL,
        add(PA, pt(0, 0.32))
      )
    );
  }

  let actualArrow = actualArrowLayer();

  // 16: the actual rent vector does not lie on the sheet.

  await until(S(16));
  await play(
    ...removePicture(mixtures),

    ...addPicture(actualArrow),

    ...fbox([
      ['ACTUAL RENT LIST', ACTUAL],
      'not every apartment',
      'lies on one line',
      ['actual vector is', ACTUAL],
      ['outside the sheet', ACTUAL]
    ], ACTUAL),

    ...say('ACTUAL RENTS ARE OFF THE SHEET')
  );

  // Nearest point on the plane.

  function footLayer() {
    return new M.VGroup(
      glowDot(PF, FIT, 0.10),

      ctxt(
        'closest point',
        17,
        FIT,
        add(PF, pt(1.00, -0.30))
      )
    );
  }

  let closestFoot = footLayer();

  // 17: least squares chooses the closest possible fitted list.

  await until(S(17));
  await play(
    ...addPicture(closestFoot),

    ...fbox([
      ['LEAST SQUARES', FIT],
      'among all lists',
      'the model can make',
      ['choose the closest', FIT],
      'to the actual list'
    ], FIT),

    ...say('FIND THE CLOSEST POINT ON THE SHEET', FIT)
  );

  // 18: ask how to find the closest point.

  await until(S(18));
  await play(
    new M.Indicate(closestFoot, { color: C.amber }),

    ...say('HOW DO WE FIND IT?', C.amber)
  );

  // 19: drop perpendicular to the plane.

  const hangingLine = dashed(
    PA,
    PF,
    C.amber
  );

  const weight = new M.Circle({
    radius: 0.12,
    color: C.amber,
    strokeWidth: 2
  });

  weight.setFill(C.amber, 0.9);
  weight.moveTo(PA);

  await until(S(19));
  await play(
    ...addPicture(hangingLine, weight),

    ...fbox([
      ['DROP STRAIGHT DOWN', C.amber],
      'like a hanging weight',
      'onto a flat floor',
      ['landing point = fit', FIT]
    ], C.amber),

    ...say('DROP STRAIGHT ONTO THE SHEET', C.amber)
  );

  await until(S(19) + 1.45);
  await play(
    new M.Transform(
      weight,

      new M.Circle({
        radius: 0.12,
        color: C.amber,
        strokeWidth: 2
      }).setFill(C.amber, 0.9).moveTo(PF),

      {
        runTime: 1.35
      }
    )
  );

  // ============================================================
  // 20-26: fitted vector, residual vector, squared length.
  // ============================================================

  function fittedArrowLayer() {
    return new M.VGroup(
      arrow(
        PO,
        PF,
        FIT,
        4.5
      ),

      ctxt(
        'fitted list',
        17,
        FIT,
        add(PF, pt(-0.40, -0.42))
      )
    );
  }

  function residualArrowLayer() {
    return new M.VGroup(
      arrow(
        PF,
        PA,
        RESID,
        4.5
      ),

      txt(
        'residual list',
        17,
        RESID,
        add(
          mul(add(PF, PA), 0.5),
          pt(0.92, 0.04)
        )
      )
    );
  }

  function planeAngleLayer() {
    const horizontal = line(
      add(PF, pt(-0.39, 0)),
      add(PF, pt(0.50, 0)),
      FIT,
      2
    );

    const depth = dashed(
      add(PF, mul(V, -0.24)),
      add(PF, mul(V, 0.24)),
      FIT
    );

    const angle = rightAngle(
      PF,
      pt(1, 0),
      pt(0, 1),
      0.22,
      C.amber
    );

    return new M.VGroup(
      horizontal,
      depth,
      angle,

      ctxt(
        '90°',
        16,
        C.amber,
        add(PF, pt(0.52, 0.38)),
        true
      )
    );
  }

  let fittedArrow = fittedArrowLayer();

  // 20: landing point is 400 × ones + 10 × areas.

  await until(S(20));
  await play(
    ...removePicture(hangingLine, weight),

    ...addPicture(fittedArrow),

    ...fbox([
      ['FITTED LIST', FIT],
      ['400 × ones', ONE],
      ['+ 10 × areas', AREA],
      '800, 800, 800,',
      '1,000, 1,000, ...'
    ], FIT),

    ...say('LANDING POINT = FITTED RENT LIST', FIT)
  );

  // 21: leftover vector is the residual list.

  let residualArrow = residualArrowLayer();

  await until(S(21));
  await play(
    ...addPicture(residualArrow),

    ...fbox([
      ['RESIDUAL LIST', RESID],
      'actual list',
      'minus fitted list',
      ['+60, −30, −30,', RESID],
      ['+40, +20, −60, ...', RESID]
    ], RESID),

    ...say('LEFTOVER ARROW = RESIDUAL LIST', RESID)
  );

  // Squaring a vector's entries, then adding them.
  // Four groups of three rows match the four apartment sizes.

  function residualSquaresPicture(showTotal = true) {
    const rowH = P ? 0.285 : 0.25;

    const top = CY + 1.72;
    const rowTop = top - 0.66;

    const xArea = CX - 2.35;
    const xR = CX - 0.87;
    const xSq = CX + 0.76;

    const parts = [
      txt(
        'Squared residuals',
        P ? 21 : 20,
        RESID,
        pt(CX, top)
      ),

      txt(
        'area',
        15,
        C.muted,
        pt(xArea, rowTop + 0.31)
      ),

      txt(
        'residual',
        16,
        RESID,
        pt(xR, rowTop + 0.31)
      ),

      txt(
        'square',
        16,
        C.amber,
        pt(xSq, rowTop + 0.31)
      )
    ];

    RESIDUALS.forEach((r, k) => {
      const y = rowTop - k * rowH;

      parts.push(
        txt(
          k % 3 === 0 ? String(AREAS[k]) : '',
          14,
          C.muted,
          pt(xArea, y),
          true
        ),

        txt(
          signed(r),
          P ? 16 : 15,
          RESID,
          pt(xR, y),
          true
        ),

        txt(
          '→',
          15,
          C.muted,
          pt((xR + xSq) / 2, y)
        ),

        txt(
          fmt(r * r),
          P ? 16 : 15,
          C.amber,
          pt(xSq, y),
          true
        )
      );

      if (k % 3 === 2) {
        const groupStart = k - 2;

        const subtotal = norm2(
          RESIDUALS.slice(groupStart, k + 1)
        );

        parts.push(
          txt(
            fmt(subtotal),
            P ? 14 : 13,
            C.muted,
            pt(CX + 2.25, y - 0.01),
            true
          )
        );

        if (k < 11) {
          parts.push(
            line(
              pt(CX - 2.63, y - rowH / 2),
              pt(CX + 2.75, y - rowH / 2),
              C.muted,
              0.75
            )
          );
        }
      }
    });

    parts.push(
      txt(
        'subtotal',
        14,
        C.muted,
        pt(CX + 2.25, rowTop + 0.31)
      )
    );

    if (showTotal) {
      parts.push(
        tag(
          `TOTAL = ${fmt(SSE)}`,
          C.amber,
          pt(CX, rowTop - 12 * rowH - 0.28),
          18
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // 22: squared length of a vector is sum of squared entries.

  function squareLengthExample() {
    const o = local(-2.28, -0.97);
    const f = local(0.38, -0.97);
    const a = local(0.38, 1.02);

    const parts = [
      line(o, f, C.muted, 3),
      line(f, a, C.muted, 3),

      arrow(o, a, RESID, 4),

      rightAngle(
        f,
        pt(-1, 0),
        pt(0, 1),
        0.22,
        C.amber
      ),

      txt(
        '4',
        22,
        C.muted,
        local(-0.95, -1.24),
        true
      ),

      txt(
        '3',
        22,
        C.muted,
        local(0.72, 0.02),
        true
      ),

      txt(
        'length',
        17,
        RESID,
        local(-1.40, 0.36)
      ),

      txt(
        '5',
        24,
        RESID,
        local(-1.08, 0.71),
        true
      ),

      tag(
        '4² + 3² = 25',
        C.amber,
        local(1.37, -1.67),
        18
      ),

      txt(
        'Illustration with just two entries',
        P ? 16 : 17,
        C.muted,
        local(0, 1.53)
      )
    ];

    return new M.VGroup(...parts);
  }

  await until(S(22));
  await play(
    ...picture(squareLengthExample()),

    ...fbox([
      ['SQUARED LENGTH', C.amber],
      'square every entry',
      'then add the squares',
      ['4² + 3² = 25', C.amber],
      'same idea for 12'
    ], C.amber),

    ...say('SQUARE EVERY ENTRY · ADD THEM', C.amber)
  );

  // 23: residual vector's squared length is 25,000.

  await until(S(23));
  await play(
    ...picture(residualSquaresPicture(true)),

    ...fbox([
      ['RESIDUAL LENGTH²', RESID],
      '5,400 + 5,600',
      '+ 6,200 + 7,800',
      ['= 25,000', C.amber],
      'sum of squared',
      'residuals'
    ], C.amber),

    ...say('SUM OF SQUARED RESIDUALS = 25,000', C.amber)
  );

  // Reconstruct the complete plane diagram using new objects.
  // This avoids reusing removed objects as children of new groups.

  function completeProjection() {
    plane = planeSurface();
    basis = basisArrows();

    planeName = tag(
      'COLUMN SPACE',
      AREA,
      local(1.40, -1.87),
      17
    );

    actualArrow = actualArrowLayer();
    closestFoot = footLayer();
    fittedArrow = fittedArrowLayer();
    residualArrow = residualArrowLayer();

    return [
      plane,
      basis,
      planeName,
      actualArrow,
      closestFoot,
      fittedArrow,
      residualArrow
    ];
  }

  // Alternative landing point: not directly below the actual vector.
  // Its gap to the actual endpoint is longer than the perpendicular.

  const alternative = new M.VGroup(
    glowDot(PQ, C.muted, 0.065),

    dashed(
      PQ,
      PA,
      C.muted
    ),

    txt(
      'another fitted list',
      15,
      C.muted,
      add(PQ, pt(-0.10, -0.33))
    ),

    txt(
      'longer gap',
      16,
      C.muted,
      add(
        mul(add(PQ, PA), 0.5),
        pt(-0.72, 0.13)
      )
    )
  );

  // 24: closest point means smallest squared residual length.

  await until(S(24));
  await play(
    ...picture(
      ...completeProjection(),
      alternative
    ),

    ...fbox([
      ['CLOSEST POINT', FIT],
      'shortest leftover',
      'arrow',
      ['smallest length²', C.amber],
      'that is least squares'
    ], FIT),

    ...say('CLOSEST = SMALLEST SQUARED LENGTH', FIT)
  );

  // 25: name the projection.

  await until(S(25));
  await play(
    ...removePicture(alternative),

    new M.Indicate(
      closestFoot,
      { color: FIT }
    ),

    ...fbox([
      ['PROJECTION', FIT],
      'drop perpendicular',
      'onto the sheet',
      ['closest fitted list', FIT]
    ], FIT),

    ...say('THIS DROP IS A PROJECTION', FIT)
  );

  // 26: residual is perpendicular to the sheet.

  let planeAngle = planeAngleLayer();

  await until(S(26));
  await play(
    ...addPicture(planeAngle),

    ...fbox([
      ['RIGHT ANGLE', C.amber],
      ['residual vector', RESID],
      'is perpendicular',
      ['to the column space', AREA]
    ], C.amber),

    ...say('RESIDUAL MEETS THE SHEET AT 90°', C.amber)
  );

  // ============================================================
  // 27-32: verify perpendicularity using dot products.
  // ============================================================

  function dotProductExample() {
    const x1 = CX - 1.85;
    const x2 = CX - 0.18;
    const x3 = CX + 1.57;

    const top = CY + 0.94;
    const dy = 0.72;

    const a = [2, 3, 1];
    const b = [4, 1, 2];

    const parts = [
      txt('list A', 18, ACTUAL, pt(x1, top + 0.57)),
      txt('list B', 18, AREA, pt(x2, top + 0.57)),
      txt('multiply', 18, C.amber, pt(x3, top + 0.57))
    ];

    for (let k = 0; k < 3; k++) {
      const y = top - k * dy;

      parts.push(
        txt(String(a[k]), 23, ACTUAL, pt(x1, y), true),

        txt(
          '×',
          22,
          C.muted,
          pt((x1 + x2) / 2, y)
        ),

        txt(String(b[k]), 23, AREA, pt(x2, y), true),

        txt(
          '=',
          22,
          C.muted,
          pt((x2 + x3) / 2, y)
        ),

        txt(
          String(a[k] * b[k]),
          23,
          C.amber,
          pt(x3, y),
          true
        )
      );
    }

    parts.push(
      line(
        pt(x3 - 0.47, top - 2 * dy - 0.35),
        pt(x3 + 0.47, top - 2 * dy - 0.35),
        C.muted,
        2
      ),

      txt(
        '8 + 3 + 2 = 13',
        22,
        C.amber,
        local(0.50, -1.28),
        true
      ),

      txt(
        'Multiply matching entries, then add',
        P ? 17 : 18,
        C.muted,
        local(0, -1.77)
      )
    );

    return new M.VGroup(...parts);
  }

  // 27: recall the dot product rule.

  await until(S(27));
  await play(
    ...picture(dotProductExample()),

    ...fbox([
      ['DOT PRODUCT', C.violet],
      'multiply matching',
      'entries',
      'then add them',
      ['2×4 + 3×1 + 1×2', C.amber],
      ['= 13', C.amber]
    ], C.violet),

    ...say('DOT PRODUCT = MULTIPLY, THEN ADD', C.violet)
  );

  // Table for dot products with the two design columns.
  // Each residual is paired with the matching design entry.

  function dotTable(which = 'ones') {
    const col = which === 'ones' ? ONES : AREAS;

    const colColor = which === 'ones'
      ? ONE
      : AREA;

    const result = dotProduct(RESIDUALS, col);

    const rowH = P ? 0.36 : 0.29;

    const top = P ? CY + 2.75 : CY + 1.82;
    const rowTop = top - (P ? 0.62 : 0.60);

    const x1 = CX - 2.10;
    const x2 = CX - 0.45;
    const x3 = CX + 1.32;

    const parts = [
      txt(
        `Residuals · ${which}`,
        P ? 21 : 20,
        colColor,
        pt(CX, top)
      ),

      txt(
        'residual',
        P ? 17 : 16,
        RESID,
        pt(x1, rowTop + 0.32)
      ),

      txt(
        which,
        P ? 17 : 16,
        colColor,
        pt(x2, rowTop + 0.32)
      ),

      txt(
        'product',
        P ? 17 : 16,
        C.amber,
        pt(x3, rowTop + 0.32)
      )
    ];

    RESIDUALS.forEach((r, k) => {
      const y = rowTop - k * rowH;

      parts.push(
        txt(
          signed(r),
          P ? 19 : 18,
          RESID,
          pt(x1, y),
          true
        ),

        txt(
          '×',
          16,
          C.muted,
          pt((x1 + x2) / 2, y)
        ),

        txt(
          String(col[k]),
          P ? 19 : 18,
          colColor,
          pt(x2, y),
          true
        ),

        txt(
          '=',
          16,
          C.muted,
          pt((x2 + x3) / 2, y)
        ),

        txt(
          signed(r * col[k]),
          P ? 19 : 18,
          C.amber,
          pt(x3, y),
          true
        )
      );

      if (k % 3 === 2 && k < 11) {
        parts.push(
          line(
            pt(CX - 2.55, y - rowH / 2),
            pt(CX + 2.20, y - rowH / 2),
            C.muted,
            0.75
          )
        );
      }
    });

    parts.push(
      tag(
        `SUM = ${fmt(result)}`,
        C.green,
        pt(CX, rowTop - 12 * rowH - 0.27),
        18
      )
    );

    return new M.VGroup(...parts);
  }

  // 28: residual dot ones = sum of residuals = 0.

  await until(S(28));
  await play(
    ...picture(dotTable('ones')),

    ...fbox([
      ['RESIDUALS · ONES', ONE],
      '60×1 − 30×1',
      '− 30×1 + ...',
      '= sum of residuals',
      ['= 0', C.green]
    ], ONE),

    ...say('DOT PRODUCT WITH ONES = 0', C.green)
  );

  // 29: residual dot areas = 0.

  await until(S(29));
  await play(
    ...picture(dotTable('areas')),

    ...fbox([
      ['RESIDUALS · AREAS', AREA],
      '60×40 − 30×40',
      '− 30×40 + ...',
      'add all 12 products',
      ['= 0', C.green]
    ], AREA),

    ...say('DOT PRODUCT WITH AREAS = 0', C.green)
  );

  // 30: within each apartment size, residuals cancel exactly.

  function groupedResidualsPicture(weighted = false) {
    const parts = [];

    const vals = [40, 60, 80, 100];

    const top = CY + 1.13;
    const dy = 0.72;

    const xArea = CX - 2.60;
    const x1 = CX - 1.25;
    const x2 = CX - 0.25;
    const x3 = CX + 0.75;
    const xResult = CX + 2.13;

    parts.push(
      txt(
        'Residuals cancel within each size',
        P ? 19 : 18,
        C.ink,
        pt(CX, top + 0.55)
      )
    );

    vals.forEach((a, j) => {
      const y = top - j * dy;

      const rs = RESIDUALS.slice(
        3 * j,
        3 * j + 3
      );

      parts.push(
        outline(
          5.95,
          0.56,
          pt(CX, y),
          C.muted
        ),

        txt(
          `${a} m²`,
          P ? 15 : 16,
          AREA,
          pt(xArea, y)
        ),

        txt(
          signed(rs[0]),
          17,
          RESID,
          pt(x1, y),
          true
        ),

        txt(
          signed(rs[1]),
          17,
          RESID,
          pt(x2, y),
          true
        ),

        txt(
          signed(rs[2]),
          17,
          RESID,
          pt(x3, y),
          true
        ),

        txt(
          weighted
            ? `×${a} → 0`
            : '= 0',
          P ? 15 : 16,
          C.green,
          pt(xResult, y),
          true
        )
      );
    });

    parts.push(
      tag(
        weighted
          ? 'AREA × ZERO IS STILL ZERO'
          : 'EVERY GROUP SUMS TO ZERO',
        C.green,
        local(0, -1.78),
        P ? 15 : 16
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(30));
  await play(
    ...picture(groupedResidualsPicture(false)),

    ...fbox([
      ['GROUP CANCELLATION', C.green],
      '40 m²: 60−30−30',
      '          = 0',
      'same for 60, 80, 100',
      ['each group sums to 0', C.green]
    ], C.green),

    ...say('THE THREE RESIDUALS CANCEL IN EACH GROUP', C.green)
  );

  await until(S(30) + 2.35);
  await play(
    ...picture(groupedResidualsPicture(true)),

    ...fbox([
      ['WEIGHT BY AREA', AREA],
      '40 × (60−30−30)',
      '= 40 × 0 = 0',
      'all four groups',
      ['still give zero', C.green]
    ], AREA)
  );

  // 31: dot product zero means perpendicular vectors.

  const projection31 = completeProjection();

  planeAngle = planeAngleLayer();

  await until(S(31));
  await play(
    ...picture(...projection31, planeAngle),

    ...fbox([
      ['DOT PRODUCT = 0', C.green],
      ['residuals · ones = 0', ONE],
      ['residuals · areas = 0', AREA],
      'perpendicular to',
      ['both design directions', C.green]
    ], C.green),

    ...say('ZERO DOT PRODUCT → RIGHT ANGLE', C.amber)
  );

  // 32: least squares is projection onto the column space.

  await until(S(32));
  await play(
    new M.Indicate(
      fittedArrow,
      { color: FIT }
    ),

    ...fbox([
      ['LEAST SQUARES', FIT],
      'project the actual',
      'rent vector onto',
      ['the column space', AREA],
      ['closest possible fit', FIT]
    ], FIT),

    ...say('LEAST SQUARES = PROJECTION', FIT)
  );

  // ============================================================
  // 33-41: the right-angle triangle and Pythagoras.
  // ============================================================

  // Centred vector triangle.
  //
  // actual centred vector = fitted centred vector + residual
  //
  // The fitted-centred vector is perpendicular to the residual.
  // Side lengths below are proportional to their actual vector
  // norms, including the comparatively short residual side.

  const TRI_SCALE = (P ? 4.65 : 4.75) / Math.sqrt(SSR);

  const TRI_W = Math.sqrt(SSR) * TRI_SCALE;
  const TRI_H = Math.sqrt(SSE) * TRI_SCALE;

  const TA = local(-TRI_W / 2, -0.60);
  const TB = local(TRI_W / 2, -0.60);
  const TC = add(TB, pt(0, TRI_H));

  function trianglePicture(stage = 0) {
    const parts = [];

    const title = stage === 0
      ? 'A right-angle triangle'
      : 'The centred rent vectors';

    parts.push(
      txt(
        title,
        P ? 22 : 21,
        C.ink,
        local(0, 1.60)
      ),

      arrow(
        TA,
        TB,
        FIT,
        4.5
      ),

      arrow(
        TB,
        TC,
        RESID,
        4.5
      ),

      arrow(
        TA,
        TC,
        ACTUAL,
        4.5
      ),

      rightAngle(
        TB,
        pt(-1, 0),
        pt(0, 1),
        0.22,
        C.amber
      ),

      txt(
        'fitted',
        18,
        FIT,
        add(
          mul(add(TA, TB), 0.5),
          pt(0, -0.30)
        )
      ),

      txt(
        'residual',
        16,
        RESID,
        add(
          mul(add(TB, TC), 0.5),
          pt(0.55, 0)
        )
      ),

      txt(
        'actual',
        18,
        ACTUAL,
        add(
          mul(add(TA, TC), 0.5),
          pt(-0.40, 0.40)
        )
      )
    );

    if (stage >= 1) {
      parts.push(
        txt(
          `length² = ${fmt(SST)}`,
          17,
          ACTUAL,
          local(-0.50, 0.91),
          true
        )
      );
    }

    if (stage >= 2) {
      parts.push(
        txt(
          `length² = ${fmt(SSR)}`,
          17,
          FIT,
          local(0, -1.22),
          true
        )
      );
    }

    if (stage >= 3) {
      parts.push(
        txt(
          fmt(SSE),
          16,
          RESID,
          add(TC, pt(0.32, 0.34)),
          true
        ),

        txt(
          'length²',
          13,
          RESID,
          add(TC, pt(0.32, 0.57))
        )
      );
    }

    if (stage >= 4) {
      const y = CY - 1.94;

      parts.push(
        txt(
          fmt(SSR),
          P ? 19 : 20,
          FIT,
          pt(CX - 1.85, y),
          true
        ),

        txt(
          '+',
          22,
          C.muted,
          pt(CX - 0.72, y)
        ),

        txt(
          fmt(SSE),
          P ? 19 : 20,
          RESID,
          pt(CX + 0.15, y),
          true
        ),

        txt(
          '=',
          22,
          C.muted,
          pt(CX + 1.02, y)
        ),

        txt(
          fmt(SST),
          P ? 19 : 20,
          ACTUAL,
          pt(CX + 2.03, y),
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // 33: introduce the right-angle triangle.

  await until(S(33));
  await play(
    ...picture(trianglePicture(0)),

    ...fbox([
      ['A BONUS', C.amber],
      'the two shorter',
      'arrows meet',
      ['at a right angle', C.amber]
    ], C.amber),

    ...say('A RIGHT-ANGLE TRIANGLE', C.amber)
  );

  // Centring table: subtract the same mean from each entry.

  function centredTable(
    input,
    output,
    heading,
    color,
    showTotal = false,
    residualMode = false
  ) {
    const rowH = P ? 0.285 : 0.25;

    const top = CY + 1.75;
    const rowTop = top - 0.66;

    const x1 = CX - 1.90;
    const x2 = CX - 0.15;
    const x3 = CX + 1.65;

    const parts = [
      txt(
        heading,
        P ? 21 : 20,
        color,
        pt(CX, top)
      ),

      txt(
        residualMode ? 'before' : 'rent',
        15,
        color,
        pt(x1, rowTop + 0.30)
      ),

      txt(
        residualMode ? 'change' : 'subtract',
        15,
        C.muted,
        pt(x2, rowTop + 0.30)
      ),

      txt(
        residualMode ? 'after' : 'centred',
        15,
        color,
        pt(x3, rowTop + 0.30)
      )
    ];

    input.forEach((v, k) => {
      const y = rowTop - k * rowH;

      parts.push(
        txt(
          residualMode ? signed(v) : fmt(v),
          P ? 16 : 15,
          color,
          pt(x1, y),
          true
        ),

        txt(
          residualMode ? '0' : '− 1,100',
          P ? 15 : 14,
          C.muted,
          pt(x2, y),
          true
        ),

        txt(
          signed(output[k]),
          P ? 16 : 15,
          color,
          pt(x3, y),
          true
        )
      );

      if (k % 3 === 2 && k < 11) {
        parts.push(
          line(
            pt(CX - 2.55, y - rowH / 2),
            pt(CX + 2.40, y - rowH / 2),
            C.muted,
            0.75
          )
        );
      }
    });

    if (showTotal) {
      parts.push(
        tag(
          `LENGTH² = ${fmt(norm2(output))}`,
          color,
          pt(CX, rowTop - 12 * rowH - 0.27),
          17
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // 34: subtract mean rent 1,100 from every actual rent.

  await until(S(34));
  await play(
    ...picture(
      centredTable(
        RENTS,
        ACTUAL_CENTRED,
        'Centre the actual rent list',
        ACTUAL
      )
    ),

    ...fbox([
      ['CENTRE THE DATA', ACTUAL],
      'mean rent = 1,100',
      '860 − 1,100 = −240',
      '770 − 1,100 = −330',
      ['repeat for all 12', ACTUAL]
    ], ACTUAL),

    ...say('SUBTRACT THE MEAN RENT FROM EACH ENTRY')
  );

  // 35: total squared variation around the mean = 625,000.

  await until(S(35));
  await play(
    ...picture(
      centredTable(
        RENTS,
        ACTUAL_CENTRED,
        'Centre the actual rent list',
        ACTUAL,
        true
      )
    ),

    ...fbox([
      ['ACTUAL LENGTH²', ACTUAL],
      '(−240)² + (−330)²',
      '+ ... + 250²',
      ['= 625,000', ACTUAL],
      'total variation'
    ], ACTUAL),

    ...say('ACTUAL SQUARED LENGTH = 625,000')
  );

  // 36: subtract the same mean from the fitted list.
  // Fitted centred values:
  // -300,-300,-300,-100,-100,-100,
  // +100,+100,+100,+300,+300,+300.

  await until(S(36));
  await play(
    ...picture(
      centredTable(
        FITTED,
        FITTED_CENTRED,
        'Centre the fitted rent list',
        FIT,
        true
      )
    ),

    ...fbox([
      ['FITTED LENGTH²', FIT],
      '3 × 300²',
      '+ 3 × 100²',
      '+ 3 × 100²',
      '+ 3 × 300²',
      ['= 600,000', FIT]
    ], FIT),

    ...say('FITTED SQUARED LENGTH = 600,000', FIT)
  );

  // 37: centring both actual and fitted lists does not change residuals.

  await until(S(37));
  await play(
    ...picture(
      centredTable(
        RESIDUALS,
        RESIDUALS,
        'Residuals stay the same',
        RESID,
        true,
        true
      )
    ),

    ...fbox([
      ['RESIDUAL LENGTH²', RESID],
      'both lists lost',
      'the same 1,100',
      'their gap is unchanged',
      ['= 25,000', RESID]
    ], RESID),

    ...say('RESIDUAL SQUARED LENGTH = 25,000', RESID)
  );

  // 38: fitted variation plus residual variation equals total.

  const pythagTriangle = trianglePicture(4);

  await until(S(38));
  await play(
    ...picture(pythagTriangle),

    ...fbox([
      ['THE THREE LENGTHS²', C.amber],
      ['  600,000', FIT],
      ['+  25,000', RESID],
      ['= 625,000', ACTUAL]
    ], C.amber),

    ...say('600,000 + 25,000 = 625,000', C.amber)
  );

  // 39: this equality is Pythagoras' rule.

  await until(S(39));
  await play(
    ...fbox([
      ['PYTHAGORAS', C.amber],
      'short side²',
      '+ short side²',
      '= long side²',
      ['a² + b² = c²', C.amber]
    ], C.amber),

    ...say('PYTHAGORAS’ RULE', C.amber)
  );

  // 40: two shorter squared lengths add to the longer squared length.
  // Show the areas as one total bar split in exact proportions.

  function variationSplit() {
    const width = P ? W - 0.42 : W - 0.55;

    const left = CX - width / 2;

    const fittedW = width * SSR / SST;
    const residualW = width * SSE / SST;

    const y = CY - 0.97;
    const ht = 0.44;

    const total = outline(
      width,
      ht,
      pt(CX, y),
      ACTUAL
    );

    const fitBar = rect(
      fittedW,
      ht * 0.88,
      pt(left + fittedW / 2, y),
      FIT,
      0.85
    );

    const resBar = rect(
      residualW,
      ht * 0.88,
      pt(left + fittedW + residualW / 2, y),
      RESID,
      0.90
    );

    const resX = left + fittedW + residualW / 2;

    return new M.VGroup(
      fitBar,
      resBar,
      total,

      txt(
        '600,000',
        20,
        FIT,
        pt(left + fittedW / 2, y - 0.45),
        true
      ),

      line(
        pt(resX, y + ht / 2),
        pt(resX, y + 0.67),
        RESID,
        2
      ),

      line(
        pt(resX, y + 0.67),
        pt(resX - 0.82, y + 0.67),
        RESID,
        2
      ),

      txt(
        '25,000',
        18,
        RESID,
        pt(resX - 1.29, y + 0.67),
        true
      ),

      txt(
        'Total = 625,000',
        21,
        ACTUAL,
        local(0, -1.91),
        true
      ),

      txt(
        'Fitted part + leftover part',
        19,
        C.ink,
        local(0, 1.30)
      ),

      txt(
        'Two squared lengths make the total',
        P ? 17 : 18,
        C.muted,
        local(0, 0.83)
      )
    );
  }

  await until(S(40));
  await play(
    ...picture(variationSplit()),

    ...fbox([
      ['SQUARED LENGTH SPLIT', C.amber],
      ['fitted:    600,000', FIT],
      ['leftover:   25,000', RESID],
      ['total:     625,000', ACTUAL]
    ], C.amber),

    ...say('TWO SHORT SIDES² = LONG SIDE²', C.amber)
  );

  // 41: preview the next lesson without introducing its result.

  await until(S(41));
  await play(
    ...fbox([
      ['NEXT LESSON', C.green],
      'use this split',
      'to measure how much',
      'variation the line',
      ['explains', FIT]
    ], C.green),

    ...say('NEXT: HOW MUCH DOES THE LINE EXPLAIN?', FIT)
  );

  // ============================================================
  // 42-43: why the projection viewpoint is useful.
  // ============================================================

  // 42: the residuals sum to zero because the ones direction
  // belongs to the column space and is perpendicular to residuals.

  function cancellationPicture() {
    const vals = [40, 60, 80, 100];

    const parts = [];

    const left = CX - 2.55;
    const baseY = CY - 0.28;

    const spacing = 1.48;
    const hScale = 0.014;

    vals.forEach((a, j) => {
      const x = left + j * spacing + 0.30;

      const rs = RESIDUALS.slice(
        3 * j,
        3 * j + 3
      );

      rs.forEach((r, k) => {
        const bx = x + (k - 1) * 0.28;
        const h = Math.abs(r) * hScale;

        const color = RESID;

        parts.push(
          rect(
            0.22,
            h,
            pt(bx, baseY + Math.sign(r) * h / 2),
            color,
            0.75
          )
        );
      });

      parts.push(
        txt(
          String(a),
          18,
          AREA,
          pt(x, baseY - 1.27),
          true
        ),

        txt(
          'sum 0',
          18,
          C.green,
          pt(x, baseY - 1.57),
          true
        )
      );
    });

    parts.push(
      line(
        local(-3.10, -0.28),
        local(3.10, -0.28),
        C.muted,
        2
      ),

      txt(
        'Positive and negative residuals cancel',
        P ? 18 : 18,
        C.ink,
        local(0, 1.50)
      ),

      txt(
        '+',
        21,
        C.muted,
        local(-3.0, 0.43)
      ),

      txt(
        '−',
        21,
        C.muted,
        local(-3.0, -0.86)
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(42));
  await play(
    ...picture(cancellationPicture()),

    ...fbox([
      ['WHY SUM = 0?', C.green],
      ['residuals · ones', ONE],
      '= sum of residuals',
      'projection gives',
      ['right angle → zero', C.green]
    ], C.green),

    ...say('PROJECTION EXPLAINS WHY RESIDUALS SUM TO ZERO', FIT)
  );

  // 43: the same idea extends to more design columns.
  // Extra columns are schematic possible model inputs, not invented
  // measurements for the chapter's twelve apartments.

  function manyColumnsPicture() {
    const xs = [
      CX - 2.15,
      CX - 0.72,
      CX + 0.72,
      CX + 2.15
    ];

    const names = [
      'ones',
      'area',
      'column 3',
      'column 4'
    ];

    const colors = [
      ONE,
      AREA,
      C.cyan,
      PINK
    ];

    const parts = [
      txt(
        'More design columns',
        P ? 22 : 21,
        C.ink,
        local(0, 1.50)
      )
    ];

    xs.forEach((x, j) => {
      const c = colors[j];

      const r = outline(
        1.18,
        1.86,
        pt(x, CY + 0.03),
        c
      );

      parts.push(
        r,

        txt(
          names[j],
          P ? 15 : 15,
          c,
          pt(x, CY + 1.12)
        )
      );

      const content = j === 0
        ? ['1', '1', '⋮', '1']
        : j === 1
          ? ['40', '40', '⋮', '100']
          : ['·', '·', '⋮', '·'];

      content.forEach((v, k) => {
        parts.push(
          txt(
            v,
            18,
            c,
            pt(x, CY + 0.61 - k * 0.39),
            true
          )
        );
      });

      parts.push(
        arrow(
          pt(x, CY - 1.04),
          pt(CX + (j - 1.5) * 0.26, CY - 1.56),
          c,
          2,
          0.12
        )
      );
    });

    parts.push(
      tag(
        'LARGER MODEL SPACE',
        FIT,
        local(0, -1.90),
        17
      )
    );

    return new M.VGroup(...parts);
  }

  await until(S(43));
  await play(
    ...picture(manyColumnsPicture()),

    ...fbox([
      ['MORE COLUMNS', C.violet],
      'more design directions',
      'a larger model space',
      ['same projection idea', FIT],
      'next chapter'
    ], C.violet),

    ...say('THE IDEA WORKS WITH MANY COLUMNS', C.violet)
  );

  // ============================================================
  // 44-46: the trap — list space is not the scatter plot.
  // ============================================================

  // 44: right angle is between vectors in list space.

  const projection44 = completeProjection();

  planeAngle = planeAngleLayer();

  const listSpaceLabel = tag(
    'LIST SPACE',
    C.amber,
    local(-1.80, 1.60),
    17
  );

  await until(S(44));
  await play(
    ...picture(
      ...projection44,
      planeAngle,
      listSpaceLabel
    ),

    ...fbox([
      ['COMMON TRAP', C.amber],
      'the right angle is',
      'between LISTS',
      ['in list space', C.amber],
      'not on the scatter plot'
    ], C.amber),

    ...say('RIGHT ANGLE IS IN LIST SPACE', C.amber)
  );

  // 45: original scatter plot has vertical residual sticks.
  // Their direction is vertical because each residual compares
  // actual and fitted rent at exactly the same floor area.

  const finalScatter = scatterPicture({
    fitted: true,
    residuals: true,
    highlight: true,
    title: 'Original scatter plot'
  });

  await until(S(45));
  await play(
    ...picture(finalScatter),

    ...fbox([
      ['SCATTER PLOT', C.amber],
      'residuals are vertical',
      'actual minus fitted',
      'at the SAME area',
      ['not perpendicular', C.amber],
      'to the fitted line'
    ], C.amber),

    ...say('SCATTER PLOT: RESIDUALS STAY VERTICAL', C.amber)
  );

  // 46: final takeaway.
  // Return to the list-space picture, where the projection lives.

  const projection46 = completeProjection();

  planeAngle = planeAngleLayer();

  const finalLabel = tag(
    'ORTHOGONAL PROJECTION',
    FIT,
    local(0.14, 1.62),
    P ? 16 : 17
  );

  await until(S(46));
  await play(
    ...picture(
      ...projection46,
      planeAngle,
      finalLabel
    ),

    ...fbox([
      ['LEAST SQUARES', FIT],
      ['actual rent list', ACTUAL],
      'drops straight onto',
      ['the column space', AREA],
      ['closest fitted list', FIT],
      ['smallest residual² sum', RESID]
    ], FIT),

    ...say('LEAST SQUARES DROPS ONTO THE MODEL SPACE', FIT)
  );

  await until(S(46) + 3.2);
  await play(
    new M.Indicate(
      actualArrow,
      { color: ACTUAL }
    ),

    new M.Indicate(
      residualArrow,
      { color: RESID }
    ),

    new M.Flash(
      closestFoot.submobjects[0].submobjects[1],
      { color: FIT }
    ),

    ...say('THE CLOSEST LIST A LINE CAN MAKE', FIT)
  );
}

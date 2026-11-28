// lesson 9.1.7
// Orthogonal projection: find the closest point on a line in feature space.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved engine contract; browser runtime verification is pending.
// Try it beats provide visual prompts for the separate interactive exercise.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  //
  // Original apartment measurements:
  // A = (3, 14), rent = $900
  // B = (6,  2), rent = $1100
  // C = (9, 14), rent = $1300
  //
  // Mean area = 6
  // Mean age  = 10
  //
  // Centered apartment vectors:
  // A = (-3, 4)
  // B = (0, -8)
  // C = (3, 4)
  //
  // Line direction d = (1, 1)
  //
  // B · d = -8
  // d · d = 2
  //
  // Projection multiplier = -8 / 2 = -4
  // Projection of B = (-4, -4)
  //
  // Remaining vector = B - projection = (4, -4)
  // Remaining vector · d = 4 - 4 = 0
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const MEAN_AREA = 6;
  const MEAN_AGE = 10;

  const CENTERED = DATA.map(d => ({
    id: d.id,
    x: d.area - MEAN_AREA,
    y: d.age - MEAN_AGE
  }));

  const B = CENTERED[1];

  const D = [1, 1];

  const BD = B.x * D[0] + B.y * D[1];
  const DD = D[0] * D[0] + D[1] * D[1];

  const MULTIPLIER = BD / DD;

  const PROJECTED = [
    MULTIPLIER * D[0],
    MULTIPLIER * D[1]
  ];

  const REMAINING = [
    B.x - PROJECTED[0],
    B.y - PROJECTED[1]
  ];

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const DIRECTION = C.violet;
  const STRING = C.amber;
  const PROJECTION = C.green;
  const GRID = '#293548';

  const signed = n => n < 0
    ? `−${Math.abs(n)}`
    : String(n);

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22
  // Safe content: -5.5 <= y <= 4.3
  //
  // Laptop: 14.22 x 8
  // Safe content: -3.0 <= y <= 2.3
  //
  // Laptop: centered grid left, formula box right.
  // Phone: centered grid above, formula box below.
  //
  // IMPORTANT:
  // Horizontal and vertical grid units have identical screen
  // lengths. This preserves the true right-angle geometry.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.45;
  const CY = P ? 0.48 : -0.10;

  const STEP = P ? 0.36 : 0.32;

  const XMIN = -8;
  const XMAX = 8;

  const YMIN = -10;
  const YMAX = 6;

  const PILL = P
    ? [0, 4.03, 0]
    : [0, 2.03, 0];

  const BOXP = P
    ? [0, -4.80, 0]
    : [3.30, -0.40, 0];

  const BOX_MAX = P
    ? FW - 1.10
    : 6.15;

  const xy = (x, y) => [
    CX + x * STEP,
    CY + y * STEP,
    0
  ];

  const ZERO = xy(0, 0);

  const BP = xy(B.x, B.y);

  const QP = xy(
    PROJECTED[0],
    PROJECTED[1]
  );

  const say = (s, c = C.cyan) => showA(
    s,
    c,
    PILL
  );

  // ------------------------------------------------------------
  // Common visual helpers
  // ------------------------------------------------------------

  function textAt(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rectAt(
    p,
    w,
    h,
    color,
    fill = C.card,
    opacity = 0.95,
    strokeWidth = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth
    });

    r.setFill(fill, opacity);
    r.moveTo(p);

    return r;
  }

  function lineBetween(
    start,
    end,
    color,
    strokeWidth = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth
    });
  }

  function dotAt(
    p,
    color,
    radius = 0.075
  ) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return d;
  }

  function tagAt(
    s,
    color,
    p,
    size = 17,
    maxw = null
  ) {
    const g = pill(s, color, size);

    if (maxw !== null && g.getWidth() > maxw) {
      g.scale(maxw / g.getWidth());
    }

    g.moveTo(p);

    return g;
  }

  function fadeAll(objects) {
    return objects.map(
      o => new M.FadeOut(o)
    );
  }

  function reveal(
    objects,
    duration = 1.2,
    lag = 0.15
  ) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      {
        lagRatio: lag,
        runTime: duration
      }
    );
  }

  // ------------------------------------------------------------
  // Coordinate-based arrow
  //
  // A shaft and two arrowhead lines, grouped before display.
  // Avoids dependence on a specialized Arrow constructor.
  // ------------------------------------------------------------

  function arrowBetween(
    start,
    end,
    color,
    strokeWidth = 3.5,
    headLength = 0.15
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const length = Math.hypot(dx, dy);

    if (length < 0.00001) {
      return new M.VGroup(
        dotAt(start, color, 0.06)
      );
    }

    const ux = dx / length;
    const uy = dy / length;

    const hl = Math.min(
      headLength,
      length * 0.35
    );

    const hx = end[0] - ux * hl;
    const hy = end[1] - uy * hl;

    const hw = hl * 0.48;

    const left = [
      hx - uy * hw,
      hy + ux * hw,
      0
    ];

    const right = [
      hx + uy * hw,
      hy - ux * hw,
      0
    ];

    return new M.VGroup(
      lineBetween(
        start,
        end,
        color,
        strokeWidth
      ),
      lineBetween(
        end,
        left,
        color,
        strokeWidth
      ),
      lineBetween(
        end,
        right,
        color,
        strokeWidth
      )
    );
  }

  function gridArrow(
    x0,
    y0,
    x1,
    y1,
    color,
    strokeWidth = 3.5,
    headLength = 0.15
  ) {
    return arrowBetween(
      xy(x0, y0),
      xy(x1, y1),
      color,
      strokeWidth,
      headLength
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Formula boxes follow the geometric explanation.
  // Each row is a string or [text, color].
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 19 : 21;
    const lh = P ? 0.35 : 0.43;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(s, size, c, true);

      if (t.getWidth() > BOX_MAX - 0.60) {
        t.scale(
          (BOX_MAX - 0.60) / t.getWidth()
        );
      }

      return t;
    });

    const wd = Math.min(
      BOX_MAX,
      Math.max(
        ...texts.map(t => t.getWidth())
      ) + 0.60
    );

    const ht = rows.length * lh + 0.28;

    const r = rectAt(
      BOXP,
      wd,
      ht,
      color,
      C.card,
      0.97
    );

    const left = BOXP[0] - wd / 2 + 0.30;

    const top = BOXP[1]
      + ht / 2
      - 0.14
      - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const animations = [
      new M.FadeIn(g)
    ];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Centered feature-space grid
  //
  // One horizontal step = one area chunk of 10 m².
  // One vertical step = one year of building age.
  //
  // Zero represents the mean area and mean age.
  // ------------------------------------------------------------

  const gridLines = [];

  for (let x = XMIN; x <= XMAX; x++) {
    if (x === 0) continue;

    gridLines.push(
      lineBetween(
        xy(x, YMIN),
        xy(x, YMAX),
        GRID,
        0.9
      )
    );
  }

  for (let y = YMIN; y <= YMAX; y++) {
    if (y === 0) continue;

    gridLines.push(
      lineBetween(
        xy(XMIN, y),
        xy(XMAX, y),
        GRID,
        0.9
      )
    );
  }

  const grid = new M.VGroup(
    ...gridLines
  );

  const xAxis = lineBetween(
    xy(XMIN, 0),
    xy(XMAX, 0),
    AREA,
    2.5
  );

  const yAxis = lineBetween(
    xy(0, YMIN),
    xy(0, YMAX),
    AGE,
    2.5
  );

  const ticks = [];

  for (let x = XMIN; x <= XMAX; x++) {
    const p = xy(x, 0);

    ticks.push(
      lineBetween(
        [p[0], p[1] - 0.045, 0],
        [p[0], p[1] + 0.045, 0],
        AREA,
        1.2
      )
    );

    if (x !== 0 && x % 2 === 0) {
      ticks.push(
        textAt(
          signed(x),
          P ? 13 : 12,
          AREA,
          [
            p[0],
            p[1] - 0.18,
            0
          ],
          true
        )
      );
    }
  }

  for (let y = YMIN; y <= YMAX; y++) {
    const p = xy(0, y);

    ticks.push(
      lineBetween(
        [p[0] - 0.045, p[1], 0],
        [p[0] + 0.045, p[1], 0],
        AGE,
        1.2
      )
    );

    if (y !== 0 && y % 2 === 0) {
      ticks.push(
        textAt(
          signed(y),
          P ? 13 : 12,
          AGE,
          [
            p[0] - 0.21,
            p[1],
            0
          ],
          true
        )
      );
    }
  }

  const gridTicks = new M.VGroup(
    ...ticks
  );

  const areaTitle = textAt(
    'Area difference (chunks)',
    P ? 17 : 16,
    AREA,
    [
      CX,
      xy(0, YMIN)[1] - 0.38,
      0
    ],
    false,
    P ? 6.25 : 4.70
  );

  const ageTitle = textAt(
    'Age difference (years)',
    P ? 17 : 16,
    AGE,
    [
      CX - (P ? 1.45 : 1.15),
      xy(0, YMAX)[1] + 0.18,
      0
    ],
    false,
    P ? 3.05 : 2.65
  );

  function originMarker() {
    const halo = new M.Dot({
      point: ZERO,
      radius: 0.14,
      color: PROJECTION
    });

    halo.setFill(PROJECTION, 0.16);

    const d = dotAt(
      ZERO,
      PROJECTION,
      0.065
    );

    const label = textAt(
      '0',
      P ? 15 : 14,
      PROJECTION,
      [
        ZERO[0] - 0.14,
        ZERO[1] - 0.20,
        0
      ],
      true
    );

    return new M.VGroup(
      halo,
      d,
      label
    );
  }

  const origin = originMarker();

  // ------------------------------------------------------------
  // Apartment dots
  //
  // A, B and C always retain their apartment labels.
  // B receives a stronger emphasis because it is the point
  // being projected onto the line.
  // ------------------------------------------------------------

  function apartmentPoint(
    d,
    focus = false
  ) {
    const p = xy(d.x, d.y);

    const color = focus
      ? STRING
      : AREA;

    const halo = new M.Dot({
      point: p,
      radius: focus
        ? 0.18
        : 0.13,
      color
    });

    halo.setFill(
      color,
      focus ? 0.23 : 0.12
    );

    const dot = dotAt(
      p,
      focus ? STRING : C.ink,
      focus ? 0.085 : 0.065
    );

    const labelPosition = d.id === 'B'
      ? [
          p[0] + 0.28,
          p[1] - 0.16,
          0
        ]
      : [
          p[0] + (
            d.id === 'A'
              ? -0.20
              : 0.20
          ),
          p[1] + 0.29,
          0
        ];

    const label = tagAt(
      d.id,
      color,
      labelPosition,
      P ? 16 : 15
    );

    return new M.VGroup(
      halo,
      dot,
      label
    );
  }

  const pointA = apartmentPoint(
    CENTERED[0]
  );

  const pointB = apartmentPoint(
    CENTERED[1],
    true
  );

  const pointC = apartmentPoint(
    CENTERED[2]
  );

  const points = [
    pointA,
    pointB,
    pointC
  ];

  const gridParts = [
    grid,
    xAxis,
    yAxis,
    gridTicks,
    areaTitle,
    ageTitle,
    origin
  ];

  // ------------------------------------------------------------
  // Line direction
  //
  // The diagonal has equation y = x.
  // All points on it are multiples of (1, 1).
  // ------------------------------------------------------------

  const diagonal = lineBetween(
    xy(-8, -8),
    xy(6, 6),
    DIRECTION,
    3
  );

  const diagonalLabel = tagAt(
    'OUR LINE',
    DIRECTION,
    [
      xy(5.2, 5.2)[0] + 0.32,
      xy(5.2, 5.2)[1] - 0.35,
      0
    ],
    P ? 15 : 13,
    1.65
  );

  const directionArrow = gridArrow(
    0, 0,
    1, 1,
    DIRECTION,
    4.5,
    0.14
  );

  const directionAcross = gridArrow(
    0, 0,
    1, 0,
    AREA,
    3.5,
    0.09
  );

  const directionUp = gridArrow(
    1, 0,
    1, 1,
    AGE,
    3.5,
    0.09
  );

  const directionLabel = tagAt(
    'd = (1, 1)',
    DIRECTION,
    [
      xy(1, 1)[0] + 0.72,
      xy(1, 1)[1] + 0.24,
      0
    ],
    P ? 15 : 13,
    1.85
  );

  const directionStepLabel = textAt(
    '1 right, 1 up',
    P ? 15 : 13,
    DIRECTION,
    [
      xy(2.2, 1.4)[0],
      xy(2.2, 1.4)[1] - 0.37,
      0
    ],
    false,
    1.85
  );

  // ------------------------------------------------------------
  // Opening question
  //
  // Begin with the apartment map, not a projection formula.
  // ------------------------------------------------------------

  const introLine = new M.DashedLine({
    start: xy(-6, -6),
    end: xy(5, 5),
    color: DIRECTION,
    strokeWidth: 2
  });

  const questionTag = tagAt(
    'B → WHERE?',
    STRING,
    P
      ? [0, -4.42, 0]
      : [3.30, -0.35, 0],
    24,
    P ? 6.20 : 5.65
  );

  // ============================================================
  // 0-4: Establish the centered apartment map
  // ============================================================

  // 0. Suppose you want to describe an apartment using
  //    only one line on the area and age grid.
  await until(S(0));

  await play(
    new M.FadeIn(grid),
    new M.Create(introLine),
    reveal(points, 1.45, 0.20),
    ...say('DESCRIBE AN APARTMENT ON ONE LINE')
  );

  // 1. Where on that line should you put B's new dot?
  await until(S(1));

  await play(
    new M.FadeIn(questionTag),
    new M.Indicate(
      pointB,
      { color: STRING }
    ),
    ...say('WHERE SHOULD B GO?', STRING)
  );

  // 2. Bring back the grid where zero marks the
  //    average area and age.
  await until(S(2));

  await play(
    new M.FadeOut(introLine),
    new M.FadeOut(questionTag),
    new M.Create(xAxis),
    new M.Create(yAxis),
    new M.FadeIn(gridTicks),
    new M.FadeIn(areaTitle),
    new M.FadeIn(ageTitle),
    new M.FadeIn(origin),
    ...say('ZERO = AVERAGE AREA AND AGE', PROJECTION)
  );

  // ------------------------------------------------------------
  // B's centered position
  //
  // B is zero across and eight down from the origin.
  // ------------------------------------------------------------

  const bVector = gridArrow(
    0, 0,
    0, -8,
    STRING,
    3.4,
    0.16
  );

  const bAcrossLabel = tagAt(
    '0 ACROSS',
    AREA,
    [
      ZERO[0] + 0.70,
      ZERO[1] - 0.30,
      0
    ],
    P ? 15 : 14,
    1.50
  );

  const bDownLabel = tagAt(
    '8 DOWN',
    AGE,
    [
      xy(0, -4)[0] + 0.58,
      xy(0, -4)[1],
      0
    ],
    P ? 15 : 14,
    1.45
  );

  const bCoordinateLabel = tagAt(
    'B = (0, −8)',
    STRING,
    [
      BP[0] + 0.83,
      BP[1] + 0.35,
      0
    ],
    P ? 15 : 14,
    2.00
  );

  // 3. B is zero steps sideways from that starting point.
  await until(S(3));

  await play(
    new M.FadeIn(bAcrossLabel),
    new M.Indicate(
      pointB,
      { color: AREA }
    ),
    ...say('B: ZERO STEPS SIDEWAYS', AREA)
  );

  // 4. B is eight steps down.
  await until(S(4));

  await play(
    new M.Create(bVector),
    new M.FadeIn(bDownLabel),
    new M.FadeIn(bCoordinateLabel),
    ...say('B: EIGHT STEPS DOWN', AGE)
  );

  // ============================================================
  // 5-7: Introduce the equal-step diagonal direction
  // ============================================================

  // 5. Draw a diagonal line through the starting point.
  await until(S(5));

  await play(
    new M.FadeOut(bAcrossLabel),
    new M.FadeOut(bDownLabel),
    new M.Create(diagonal),
    new M.FadeIn(diagonalLabel),
    ...say('A LINE THROUGH ZERO', DIRECTION)
  );

  // ------------------------------------------------------------
  // Equal-step staircase
  //
  // Shows the defining property of y = x:
  // every step right has a matching step up.
  // ------------------------------------------------------------

  const stairParts = [];

  for (let k = 1; k <= 3; k++) {
    stairParts.push(
      lineBetween(
        xy(k, k),
        xy(k + 1, k),
        AREA,
        3
      )
    );

    stairParts.push(
      lineBetween(
        xy(k + 1, k),
        xy(k + 1, k + 1),
        AGE,
        3
      )
    );
  }

  const staircase = new M.VGroup(
    ...stairParts
  );

  // 6. On this line, each sideways step has
  //    a matching step in height.
  await until(S(6));

  await play(
    new M.Create(staircase),
    ...say('EACH STEP RIGHT MATCHES A STEP UP')
  );

  // 7. One step right and one step up
  //    gives us a direction arrow.
  await until(S(7));

  await play(
    new M.FadeOut(staircase),
    new M.Create(directionAcross),
    new M.Create(directionUp),
    new M.Create(directionArrow),
    new M.FadeIn(directionLabel),
    new M.FadeIn(directionStepLabel),
    ...say('DIRECTION = (1, 1)', DIRECTION)
  );

  // ------------------------------------------------------------
  // Sliding string
  //
  // One end stays fixed at B.
  // The other end moves along the diagonal line.
  //
  // Candidate points have coordinates (t, t).
  // The visual demonstration finds the minimum distance
  // before the dot-product calculation is introduced.
  // ------------------------------------------------------------

  function linePoint(t) {
    return xy(t, t);
  }

  function stringLength(t) {
    return Math.hypot(
      t - B.x,
      t - B.y
    );
  }

  function stringTo(
    t,
    color = STRING,
    width = 3.4
  ) {
    return lineBetween(
      BP,
      linePoint(t),
      color,
      width
    );
  }

  function candidateMarker(
    t,
    color = STRING
  ) {
    const p = linePoint(t);

    const halo = new M.Dot({
      point: p,
      radius: 0.14,
      color
    });

    halo.setFill(color, 0.15);

    const dot = dotAt(
      p,
      color,
      0.075
    );

    return new M.VGroup(
      halo,
      dot
    );
  }

  const LENGTH_P = P
    ? [0, -4.80, 0]
    : [3.30, -0.35, 0];

  function lengthCard(t) {
    const distance = stringLength(t);

    const title = textAt(
      'STRING LENGTH',
      18,
      STRING,
      [
        LENGTH_P[0],
        LENGTH_P[1] + 0.36,
        0
      ],
      true,
      4.80
    );

    const value = textAt(
      `${distance.toFixed(2)} grid steps`,
      P ? 23 : 26,
      C.ink,
      [
        LENGTH_P[0],
        LENGTH_P[1] - 0.17,
        0
      ],
      true,
      4.80
    );

    const frame = rectAt(
      LENGTH_P,
      P ? 5.40 : 5.30,
      1.25,
      STRING,
      C.card,
      0.97
    );

    return new M.VGroup(
      frame,
      title,
      value
    );
  }

  let candidateT = 1;

  let movingString = stringTo(
    candidateT
  );

  let movingCandidate = candidateMarker(
    candidateT
  );

  let movingLength = lengthCard(
    candidateT
  );

  function slideString(
    t,
    duration = 0.8
  ) {
    candidateT = t;

    return [
      new M.Transform(
        movingString,
        stringTo(t),
        { runTime: duration }
      ),

      new M.Transform(
        movingCandidate,
        candidateMarker(t),
        { runTime: duration }
      ),

      new M.Transform(
        movingLength,
        lengthCard(t),
        { runTime: duration }
      )
    ];
  }

  // ============================================================
  // 8-12: Search for the shortest string
  // ============================================================

  // 8. Look from B to the diagonal line.
  await until(S(8));

  await play(
    new M.FadeOut(bVector),
    new M.FadeOut(directionAcross),
    new M.FadeOut(directionUp),
    new M.FadeOut(directionStepLabel),
    new M.Indicate(
      pointB,
      { color: STRING }
    ),
    new M.Indicate(
      diagonal,
      { color: DIRECTION }
    ),
    ...say('FROM B TO THE LINE', STRING)
  );

  // 9. You could draw a string from B
  //    to any dot on that line.
  await until(S(9));

  await play(
    new M.Create(movingString),
    new M.FadeIn(movingCandidate),
    new M.FadeIn(movingLength),
    ...say('ONE END AT B, ONE END ON THE LINE', STRING)
  );

  // 10. Which string would be shortest?
  await until(S(10));

  await play(
    new M.Indicate(
      movingString,
      {
        color: STRING,
        runTime: 0.65
      }
    ),
    ...say('WHICH STRING IS SHORTEST?', STRING)
  );

  // 11. Slide the end of the string along the line.
  await until(S(11));

  await play(
    ...slideString(-1, 0.65),
    ...say('SLIDE THE END ALONG THE LINE', STRING)
  );

  await play(
    ...slideString(-3, 0.65)
  );

  // ------------------------------------------------------------
  // Right-angle marker
  //
  // At Q = (-4, -4):
  //
  // Direction along the line: (1, 1)
  // Direction from Q to B:    (1, -1)
  //
  // Their dot product is zero, so these directions are
  // perpendicular.
  //
  // Construct the square corner geometrically.
  // ------------------------------------------------------------

  function rightAngleAt(
    p,
    color = PROJECTION
  ) {
    const side = STEP * 0.68;
    const a = side / Math.sqrt(2);

    const along = [
      p[0] + a,
      p[1] + a,
      0
    ];

    const across = [
      p[0] + a,
      p[1] - a,
      0
    ];

    const outer = [
      p[0] + 2 * a,
      p[1],
      0
    ];

    return new M.VGroup(
      lineBetween(
        along,
        outer,
        color,
        2.7
      ),
      lineBetween(
        outer,
        across,
        color,
        2.7
      )
    );
  }

  const rightAngle = rightAngleAt(
    QP
  );

  const squareCornerLabel = tagAt(
    '90°',
    PROJECTION,
    [
      QP[0] + 0.58,
      QP[1] + 0.05,
      0
    ],
    P ? 15 : 13,
    0.88
  );

  // 12. The shortest string meets the line
  //     at a square corner.
  await until(S(12));

  await play(
    ...slideString(-4, 0.85),
    ...say('THE SHORTEST STRING', PROJECTION)
  );

  await play(
    new M.Create(rightAngle),
    new M.FadeIn(squareCornerLabel),
    new M.Indicate(
      movingCandidate,
      { color: PROJECTION }
    )
  );

  // ------------------------------------------------------------
  // Compare nearby candidate strings
  //
  // At t = -4 the string is shortest.
  //
  // Moving the line endpoint in either direction creates
  // a right triangle whose hypotenuse is the new string.
  // ------------------------------------------------------------

  const ALT_LEFT_T = -6;
  const ALT_RIGHT_T = -2;

  const alternativeLeft = new M.DashedLine({
    start: BP,
    end: linePoint(ALT_LEFT_T),
    color: C.muted,
    strokeWidth: 2.2
  });

  const alternativeRight = new M.DashedLine({
    start: BP,
    end: linePoint(ALT_RIGHT_T),
    color: C.muted,
    strokeWidth: 2.2
  });

  const alternateLeftDot = candidateMarker(
    ALT_LEFT_T,
    C.muted
  );

  const alternateRightDot = candidateMarker(
    ALT_RIGHT_T,
    C.muted
  );

  const alongTriangleSide = lineBetween(
    QP,
    linePoint(ALT_RIGHT_T),
    DIRECTION,
    4.1
  );

  const longerTriangleSide = lineBetween(
    BP,
    linePoint(ALT_RIGHT_T),
    STRING,
    3.4
  );

  const longerLabel = tagAt(
    'LONGER',
    STRING,
    [
      (
        BP[0]
        + linePoint(ALT_RIGHT_T)[0]
      ) / 2 + 0.46,
      (
        BP[1]
        + linePoint(ALT_RIGHT_T)[1]
      ) / 2 + 0.14,
      0
    ],
    P ? 13 : 12,
    1.32
  );

  const shortestLabel = tagAt(
    'SHORTEST',
    PROJECTION,
    [
      (QP[0] + BP[0]) / 2 - 0.54,
      (QP[1] + BP[1]) / 2 - 0.15,
      0
    ],
    P ? 13 : 12,
    1.45
  );

  // ============================================================
  // 13-17: Why the square corner gives the closest point
  // ============================================================

  // 13. From that corner, try moving the line end
  //     of the string in either direction.
  await until(S(13));

  await play(
    new M.FadeOut(movingLength),
    new M.Create(alternativeLeft),
    new M.Create(alternativeRight),
    new M.FadeIn(alternateLeftDot),
    new M.FadeIn(alternateRightDot),
    ...say('MOVE EITHER WAY: THE STRING GROWS', STRING)
  );

  // 14. You make a triangle with the old string
  //     as one of its shorter sides.
  await until(S(14));

  await play(
    new M.FadeOut(alternativeLeft),
    new M.FadeOut(alternateLeftDot),
    new M.Create(alongTriangleSide),
    new M.FadeIn(shortestLabel),
    new M.Indicate(
      movingString,
      { color: PROJECTION }
    ),
    ...say('THE OLD STRING IS A TRIANGLE SIDE')
  );

  // 15. The new string is the long side
  //     across from the square corner.
  await until(S(15));

  await play(
    new M.FadeOut(alternativeRight),
    new M.Create(longerTriangleSide),
    new M.FadeIn(longerLabel),
    new M.Indicate(
      rightAngle,
      { color: PROJECTION }
    ),
    ...say('THE NEW STRING IS THE LONG SIDE', STRING)
  );

  // 16. An arrow that meets the line
  //     at a square corner is orthogonal to the line.
  await until(S(16));

  await play(
    new M.FadeOut(alongTriangleSide),
    new M.FadeOut(longerTriangleSide),
    new M.FadeOut(alternateRightDot),
    new M.FadeOut(longerLabel),
    new M.FadeOut(shortestLabel),
    new M.Transform(
      movingString,
      stringTo(-4, PROJECTION, 3.7)
    ),
    new M.Indicate(
      rightAngle,
      { color: PROJECTION }
    ),
    ...say('ORTHOGONAL = MEETS AT 90°', PROJECTION)
  );

  // ------------------------------------------------------------
  // Closest-point marker
  //
  // Q is a new point on the line, not a change to the
  // original apartment B measurement.
  // ------------------------------------------------------------

  const qHalo = new M.Dot({
    point: QP,
    radius: 0.19,
    color: PROJECTION
  });

  qHalo.setFill(PROJECTION, 0.21);

  const qDot = dotAt(
    QP,
    PROJECTION,
    0.085
  );

  const qLabel = tagAt(
    'Q',
    PROJECTION,
    [
      QP[0] - 0.29,
      QP[1] + 0.24,
      0
    ],
    P ? 17 : 16
  );

  const qMarker = new M.VGroup(
    qHalo,
    qDot,
    qLabel
  );

  const closestTmp = pill('CLOSEST POINT', PROJECTION, P ? 15 : 13);
  const closestLabel = tagAt(
    'CLOSEST POINT',
    PROJECTION,
    [
      QP[0] - 0.40 - Math.min(closestTmp.getWidth(), P ? 2.2 : 1.9) / 2,
      QP[1] - 0.12,
      0
    ],
    P ? 15 : 13,
    P ? 2.2 : 1.9
  );

  // 17. The closest point you land on is called
  //     the orthogonal projection of B onto the line.
  await until(S(17));

  await play(
    new M.FadeOut(movingCandidate),
    new M.FadeIn(qMarker),
    new M.FadeIn(closestLabel),
    ...fbox(
      [
        ['ORTHOGONAL PROJECTION', PROJECTION],
        ['Q is the closest point', C.ink],
        ['on the line to B.', C.ink],
        ['The string meets it at 90°.', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('PROJECTION = THE CLOSEST POINT', PROJECTION)
  );

  // ============================================================
  // 18-21: Prepare to calculate the projection
  // ============================================================

  // 18. Let's work out where that point is
  //     without sliding a string.
  await until(S(18));

  await play(
    new M.FadeOut(closestLabel),
    new M.FadeOut(squareCornerLabel),
    ...fbox(
      [
        ['FIND Q WITHOUT GUESSING', PROJECTION],
        ['Use the steps of B', STRING],
        ['and the line direction.', DIRECTION]
      ],
      PROJECTION
    ),
    ...say('FIND THE CLOSEST POINT BY CALCULATION')
  );

  // ------------------------------------------------------------
  // Restore B's vector from zero.
  //
  // A separate new object is used because the earlier
  // B vector has already been removed.
  // ------------------------------------------------------------

  const calcBVector = gridArrow(
    0, 0,
    0, -8,
    STRING,
    3.4,
    0.16
  );

  // 19. Write B's steps as zero and negative eight.
  await until(S(19));

  await play(
    new M.Create(calcBVector),
    new M.Indicate(
      bCoordinateLabel,
      { color: STRING }
    ),
    ...fbox(
      [
        ['B = (0, −8)', STRING],
        ['Sideways:  0', AREA],
        ['Vertical: −8', AGE]
      ],
      STRING
    ),
    ...say('B = (0, −8)', STRING)
  );

  // 20. Write the direction steps as one and one.
  await until(S(20));

  await play(
    new M.Indicate(
      directionArrow,
      { color: DIRECTION }
    ),
    new M.Indicate(
      directionLabel,
      { color: DIRECTION }
    ),
    ...fbox(
      [
        ['B = (0, −8)', STRING],
        ['d = (1, 1)', DIRECTION],
        ['d: one right, one up', C.muted]
      ],
      DIRECTION
    ),
    ...say('DIRECTION d = (1, 1)', DIRECTION)
  );

  // 21. To take a dot product,
  //     multiply matching steps and add.
  await until(S(21));

  await play(
    ...fbox(
      [
        ['DOT PRODUCT', DIRECTION],
        ['Match sideways steps.', AREA],
        ['Match vertical steps.', AGE],
        ['Multiply each pair, then add.', C.ink]
      ],
      DIRECTION
    ),
    ...say('MATCH, MULTIPLY, ADD', DIRECTION)
  );

  // ============================================================
  // 22-25: Calculate the two dot products
  // ============================================================

  // 22. B dotted with the direction gives zero times one
  //     plus negative eight times one.
  await until(S(22));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          calcBVector,
          { color: STRING }
        ),

        new M.Indicate(
          directionArrow,
          { color: DIRECTION }
        )
      ],
      {
        lagRatio: 0.40,
        runTime: 1.7
      }
    ),
    ...fbox(
      [
        ['B · d = (0, −8) · (1, 1)', C.ink],
        ['Sideways: 0 × 1', AREA],
        ['Vertical: (−8) × 1', AGE],
        ['Add the two products.', DIRECTION]
      ],
      DIRECTION
    ),
    ...say('B DOTTED WITH THE DIRECTION')
  );

  // 23. That total is negative eight.
  await until(S(23));

  await play(
    ...fbox(
      [
        ['B · d', DIRECTION],
        ['= 0 × 1 + (−8) × 1', C.ink],
        ['= 0 + (−8)', C.muted],
        ['= −8', STRING]
      ],
      STRING
    ),
    ...say('B · d = −8', STRING)
  );

  // 24. The direction dotted with itself gives
  //     one times one plus one times one.
  await until(S(24));

  await play(
    new M.Indicate(
      directionArrow,
      { color: DIRECTION }
    ),
    ...fbox(
      [
        ['d · d = (1, 1) · (1, 1)', DIRECTION],
        ['Sideways: 1 × 1', AREA],
        ['Vertical: 1 × 1', AGE],
        ['Add: 1 + 1', C.ink]
      ],
      DIRECTION
    ),
    ...say('DIRECTION DOTTED WITH ITSELF', DIRECTION)
  );

  // 25. That total is two.
  await until(S(25));

  await play(
    ...fbox(
      [
        ['B · d = −8', STRING],
        ['d · d = 1 + 1', DIRECTION],
        ['      = 2', PROJECTION]
      ],
      DIRECTION
    ),
    ...say('d · d = 2', DIRECTION)
  );

  // ------------------------------------------------------------
  // Direction copies
  //
  // Each copy of d contributes another d · d = 2
  // to the dot product with d.
  //
  // Draw an extra forward copy before demonstrating
  // the four backward copies that locate Q.
  // ------------------------------------------------------------

  const oneCopyTag = tagAt(
    '+2',
    DIRECTION,
    [
      xy(0.5, 0.5)[0] + 0.35,
      xy(0.5, 0.5)[1] + 0.28,
      0
    ],
    P ? 15 : 13,
    0.82
  );

  const extraDirectionCopy = gridArrow(
    1, 1,
    2, 2,
    DIRECTION,
    4.6,
    0.14
  );

  const extraCopyTag = tagAt(
    '+2',
    DIRECTION,
    [
      xy(1.5, 1.5)[0] - 0.28,
      xy(1.5, 1.5)[1] + 0.24,
      0
    ],
    P ? 15 : 13,
    0.82
  );

  // ============================================================
  // 26-30: Find the multiplier
  // ============================================================

  // 26. One direction arrow gives two
  //     when dotted with itself.
  await until(S(26));

  await play(
    new M.FadeIn(oneCopyTag),
    new M.Indicate(
      directionArrow,
      { color: DIRECTION }
    ),
    ...fbox(
      [
        ['One copy of d', DIRECTION],
        ['1 × (d · d)', C.ink],
        ['= 1 × 2 = 2', DIRECTION]
      ],
      DIRECTION
    ),
    ...say('ONE DIRECTION COPY GIVES TWO', DIRECTION)
  );

  // 27. Each extra copy gives another two.
  await until(S(27));

  await play(
    new M.Create(extraDirectionCopy),
    new M.FadeIn(extraCopyTag),
    ...fbox(
      [
        ['Two copies of d', DIRECTION],
        ['2 + 2 = 4', C.ink],
        ['Each copy contributes 2.', DIRECTION]
      ],
      DIRECTION
    ),
    ...say('EACH EXTRA COPY ADDS TWO', DIRECTION)
  );

  // 28. The leftover arrow at our square corner adds zero.
  await until(S(28));

  await play(
    new M.FadeOut(extraDirectionCopy),
    new M.FadeOut(extraCopyTag),
    new M.FadeOut(oneCopyTag),
    new M.Indicate(
      movingString,
      { color: PROJECTION }
    ),
    new M.Indicate(
      rightAngle,
      { color: PROJECTION }
    ),
    ...fbox(
      [
        ['LEFTOVER ARROW', PROJECTION],
        ['Orthogonal to d', C.ink],
        ['Its dot product with d is 0.', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('THE ORTHOGONAL LEFTOVER ADDS ZERO', PROJECTION)
  );

  // 29. To get B's dot product of negative eight,
  //     divide negative eight by two.
  await until(S(29));

  await play(
    ...fbox(
      [
        ['B · d = −8', STRING],
        ['d · d = 2', DIRECTION],
        ['Number of direction copies:', C.ink],
        ['−8 ÷ 2', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('DIVIDE THE TWO DOT PRODUCTS', PROJECTION)
  );

  // 30. The result is negative four.
  await until(S(30));

  await play(
    ...fbox(
      [
        ['Projection multiplier', PROJECTION],
        ['= (B · d) ÷ (d · d)', C.ink],
        ['= −8 ÷ 2', DIRECTION],
        ['= −4', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('MULTIPLIER = −4', PROJECTION)
  );

  // ------------------------------------------------------------
  // Four backward direction copies
  //
  // A negative multiplier reverses the direction.
  //
  // Each backward copy moves:
  // -1 area step, -1 age step.
  //
  // Four copies land at (-4, -4).
  // ------------------------------------------------------------

  const backwardPreview = gridArrow(
    0, 0,
    -1, -1,
    PROJECTION,
    4.8,
    0.14
  );

  const backwardLabel = tagAt(
    'BACKWARD',
    PROJECTION,
    [
      xy(-1, -1)[0] - 0.48,
      xy(-1, -1)[1] - 0.37,
      0
    ],
    P ? 15 : 13,
    1.52
  );

  const backwardCopies = [];

  for (let i = 0; i < 4; i++) {
    backwardCopies.push(
      gridArrow(
        -i,
        -i,
        -(i + 1),
        -(i + 1),
        PROJECTION,
        4.6,
        0.12
      )
    );
  }

  const backwardNumbers = [];

  for (let i = 0; i < 4; i++) {
    const p = xy(
      -i - 0.5,
      -i - 0.5
    );

    backwardNumbers.push(
      textAt(
        String(i + 1),
        P ? 15 : 13,
        PROJECTION,
        [
          p[0] - 0.20,
          p[1] + 0.19,
          0
        ],
        true
      )
    );
  }

  const projectedArrow = gridArrow(
    0, 0,
    -4, -4,
    PROJECTION,
    4.7,
    0.18
  );

  const qTmp = pill('Q = (−4, −4)', PROJECTION, P ? 15 : 14);
  const projectedCoordinates = tagAt(
    'Q = (−4, −4)',
    PROJECTION,
    [
      QP[0] - 0.40 - Math.min(qTmp.getWidth(), 2.12) / 2,
      QP[1] - 0.12,
      0
    ],
    P ? 15 : 14,
    2.12
  );

  // ============================================================
  // 31-33: Walk four copies backward along the line
  // ============================================================

  // 31. The direction arrow points up and right,
  //     so a negative multiplier sends us down and left.
  await until(S(31));

  await play(
    new M.Create(backwardPreview),
    new M.FadeIn(backwardLabel),
    new M.Indicate(
      directionArrow,
      { color: DIRECTION }
    ),
    ...fbox(
      [
        ['Forward: d = (1, 1)', DIRECTION],
        ['Backward: −d = (−1, −1)', PROJECTION],
        ['Negative means reverse direction.', C.ink]
      ],
      PROJECTION
    ),
    ...say('NEGATIVE MULTIPLIER: GO BACKWARD', PROJECTION)
  );

  // 32. Start at zero and lay four backward copies
  //     of the direction arrow end to end.
  await until(S(32));

  await play(
    new M.FadeOut(backwardPreview),
    new M.FadeOut(backwardLabel),
    new M.LaggedStart(
      backwardCopies.map((arrow, i) =>
        new M.LaggedStart(
          [
            new M.Create(arrow),
            new M.FadeIn(backwardNumbers[i])
          ],
          {
            lagRatio: 0.10
          }
        )
      ),
      {
        lagRatio: 0.45,
        runTime: 2.8
      }
    ),
    ...fbox(
      [
        ['Start at (0, 0)', C.ink],
        ['Four backward copies', PROJECTION],
        ['−4 × (1, 1)', DIRECTION]
      ],
      PROJECTION
    ),
    ...say('FOUR BACKWARD COPIES', PROJECTION)
  );

  // 33. The closest point is four steps left
  //     and four steps down from the starting point.
  await until(S(33));

  await play(
    ...fadeAll(backwardCopies),
    ...fadeAll(backwardNumbers),
    new M.Create(projectedArrow),
    new M.FadeIn(projectedCoordinates),
    new M.Indicate(
      qMarker,
      { color: PROJECTION }
    ),
    ...fbox(
      [
        ['Q = −4 × (1, 1)', DIRECTION],
        ['Sideways: −4 × 1 = −4', AREA],
        ['Vertical: −4 × 1 = −4', AGE],
        ['Q = (−4, −4)', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('CLOSEST POINT = (−4, −4)', PROJECTION)
  );

  // ------------------------------------------------------------
  // Remaining vector
  //
  // B - Q = (0, -8) - (-4, -4)
  //       = (4, -4)
  //
  // It starts at Q and ends at the original apartment B.
  // ------------------------------------------------------------

  const residualArrow = gridArrow(
    -4, -4,
    0, -8,
    STRING,
    4.2,
    0.17
  );

  const residualCorner = xy(0, -4);

  const residualAcross = gridArrow(
    -4, -4,
    0, -4,
    AREA,
    3.2,
    0.13
  );

  const residualDown = gridArrow(
    0, -4,
    0, -8,
    AGE,
    3.2,
    0.13
  );

  const residualAcrossLabel = tagAt(
    '+4',
    AREA,
    [
      xy(-1.4, -4)[0],
      xy(-1.4, -4)[1] + 0.22,
      0
    ],
    P ? 15 : 14
  );

  const residualDownLabel = tagAt(
    '−4',
    AGE,
    [
      xy(0, -5.6)[0] - 0.34,
      xy(0, -5.6)[1],
      0
    ],
    P ? 15 : 14
  );

  const residualLabel = tagAt(
    'r = (4, −4)',
    STRING,
    [
      xy(-3.3, -7.6)[0],
      xy(-3.3, -7.6)[1],
      0
    ],
    P ? 15 : 13,
    1.90
  );

  // ============================================================
  // 34-37: Verify the square corner
  // ============================================================

  // 34. From there to B, the remaining arrow
  //     goes four right and four down.
  await until(S(34));

  await play(
    new M.FadeOut(movingString),
    new M.FadeOut(calcBVector),
    new M.Create(residualArrow),
    new M.Create(residualAcross),
    new M.Create(residualDown),
    new M.FadeIn(residualAcrossLabel),
    new M.FadeIn(residualDownLabel),
    new M.FadeIn(residualLabel),
    ...fbox(
      [
        ['REMAINING VECTOR', STRING],
        ['B − Q = (0, −8) − (−4, −4)', C.ink],
        ['4 right', AREA],
        ['4 down', AGE],
        ['r = (4, −4)', STRING]
      ],
      STRING
    ),
    ...say('REMAINING ARROW = (4, −4)', STRING)
  );

  // 35. Those remaining steps balance
  //     when dotted with the direction.
  await until(S(35));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          residualAcrossLabel,
          { color: AREA }
        ),

        new M.Indicate(
          residualDownLabel,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.40,
        runTime: 1.5
      }
    ),
    ...fbox(
      [
        ['r · d = (4, −4) · (1, 1)', C.ink],
        ['Sideways: 4 × 1 = 4', AREA],
        ['Vertical: (−4) × 1 = −4', AGE]
      ],
      DIRECTION
    ),
    ...say('THE TWO CONTRIBUTIONS BALANCE')
  );

  // 36. Four plus negative four is zero.
  await until(S(36));

  await play(
    ...fbox(
      [
        ['r · d', DIRECTION],
        ['= 4 + (−4)', C.ink],
        ['= 0', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('4 + (−4) = 0', PROJECTION)
  );

  // 37. Here that zero confirms that the remaining arrow
  //     meets the line at a square corner.
  await until(S(37));

  await play(
    new M.FadeOut(residualAcross),
    new M.FadeOut(residualDown),
    new M.FadeOut(residualAcrossLabel),
    new M.FadeOut(residualDownLabel),
    new M.Indicate(
      residualArrow,
      { color: STRING }
    ),
    new M.Indicate(
      rightAngle,
      { color: PROJECTION }
    ),
    ...fbox(
      [
        ['r · d = 0', PROJECTION],
        ['The leftover is orthogonal.', C.ink],
        ['Q really is the closest point.', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('ZERO DOT PRODUCT CONFIRMS 90°', PROJECTION)
  );

  // ============================================================
  // 38-40: Write the complete projection formula
  // ============================================================

  // 38. For a line through zero, the formula starts
  //     with B dotted with the direction.
  await until(S(38));

  const formulaBVector = gridArrow(
    0, 0,
    0, -8,
    STRING,
    2.7,
    0.14
  );

  await play(
    new M.Create(formulaBVector),
    new M.Indicate(
      directionArrow,
      { color: DIRECTION }
    ),
    ...fbox(
      [
        ['PROJECTION ONTO A LINE', PROJECTION],
        ['Step 1: B · d', STRING],
        ['(0, −8) · (1, 1) = −8', C.ink]
      ],
      PROJECTION
    ),
    ...say('STEP 1: B · d', STRING)
  );

  // 39. Divide by the direction dotted with itself
  //     to get the multiplier.
  await until(S(39));

  await play(
    new M.Indicate(
      directionLabel,
      { color: DIRECTION }
    ),
    ...fbox(
      [
        ['Step 1: B · d = −8', STRING],
        ['Step 2: d · d = 2', DIRECTION],
        ['Multiplier = (B · d) ÷ (d · d)', C.ink],
        ['           = −8 ÷ 2 = −4', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('STEP 2: DIVIDE BY d · d', DIRECTION)
  );

  // 40. Then it multiplies the direction arrow
  //     by that result.
  await until(S(40));

  await play(
    new M.Indicate(
      projectedArrow,
      { color: PROJECTION }
    ),
    new M.Indicate(
      qMarker,
      { color: PROJECTION }
    ),
    ...fbox(
      [
        ['Q = ((B · d) ÷ (d · d)) × d', C.ink],
        ['  = (−8 ÷ 2) × (1, 1)', DIRECTION],
        ['  = −4 × (1, 1)', C.muted],
        ['  = (−4, −4)', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('STEP 3: MULTIPLY THE DIRECTION', PROJECTION)
  );

  // ============================================================
  // 41: Explain the usefulness of projection
  // ============================================================

  // 41. Use projection to keep the place on the line
  //     that is closest to the original point.
  await until(S(41));

  await play(
    new M.FadeOut(formulaBVector),
    new M.Indicate(
      qMarker,
      { color: PROJECTION }
    ),
    new M.Indicate(
      pointB,
      { color: STRING }
    ),
    ...fbox(
      [
        ['KEEP ONE POSITION ON THE LINE', PROJECTION],
        ['Original B: (0, −8)', STRING],
        ['Closest Q: (−4, −4)', PROJECTION],
        ['The multiplier −4 locates Q.', DIRECTION]
      ],
      PROJECTION
    ),
    ...say('KEEP THE CLOSEST POSITION ON THE LINE', PROJECTION)
  );

  // ------------------------------------------------------------
  // Common trap: vertical-only projection
  //
  // Keeping B's horizontal coordinate gives the line point
  // (0, 0), which is eight grid steps from B.
  //
  // The actual orthogonal projection is (-4, -4), whose
  // distance from B is sqrt(32), approximately 5.66.
  //
  // The vertical-only line is not perpendicular to the
  // diagonal. For this B position, reaching the diagonal
  // vertically requires moving upward, not downward.
  // ------------------------------------------------------------

  const wrongPoint = ZERO;

  const wrongVertical = new M.DashedLine({
    start: BP,
    end: wrongPoint,
    color: C.amber,
    strokeWidth: 3
  });

  const wrongRing = new M.Circle({
    radius: 0.16,
    color: C.amber,
    strokeWidth: 2.5
  });

  wrongRing.setFill(C.amber, 0.15);
  wrongRing.moveTo(wrongPoint);

  const wrongCross = new M.VGroup(
    lineBetween(
      [
        wrongPoint[0] - 0.09,
        wrongPoint[1] - 0.09,
        0
      ],
      [
        wrongPoint[0] + 0.09,
        wrongPoint[1] + 0.09,
        0
      ],
      C.amber,
      2.5
    ),

    lineBetween(
      [
        wrongPoint[0] - 0.09,
        wrongPoint[1] + 0.09,
        0
      ],
      [
        wrongPoint[0] + 0.09,
        wrongPoint[1] - 0.09,
        0
      ],
      C.amber,
      2.5
    )
  );

  const wrongTag = tagAt(
    'WRONG POINT',
    C.amber,
    [
      ZERO[0] - 0.68,
      ZERO[1] + 0.35,
      0
    ],
    P ? 15 : 13,
    1.75
  );

  const wrongMarker = new M.VGroup(
    wrongRing,
    wrongCross,
    wrongTag
  );

  const wrongLengthTag = tagAt(
    '8 STEPS',
    C.amber,
    [
      xy(0, -4)[0] + 0.64,
      xy(0, -4)[1],
      0
    ],
    P ? 15 : 13,
    1.42
  );

  const correctLengthTag = tagAt(
    '5.66 STEPS',
    PROJECTION,
    [
      xy(-3.3, -7.6)[0],
      xy(-3.3, -7.6)[1],
      0
    ],
    P ? 15 : 13,
    1.60
  );

  // ============================================================
  // 42-43: Compare the wrong approach with the true projection
  // ============================================================

  // 42. A common trap is to drop B straight down
  //     as if the line lay flat.
  await until(S(42));

  await play(
    new M.FadeOut(residualLabel),
    new M.Create(wrongVertical),
    new M.FadeIn(wrongMarker),
    new M.FadeIn(wrongLengthTag),
    ...fbox(
      [
        ['WATCH OUT', C.amber],
        ['Vertical-only point: (0, 0)', C.ink],
        ['Distance from B: 8 steps', C.amber],
        ['Not a square corner with this line.', C.muted]
      ],
      C.amber
    ),
    ...say('VERTICAL IS NOT ALWAYS PERPENDICULAR', C.amber)
  );

  // 43. Use the square corner where the string
  //     meets the actual line.
  await until(S(43));

  await play(
    new M.FadeIn(correctLengthTag),
    new M.Indicate(
      residualArrow,
      { color: PROJECTION }
    ),
    new M.Indicate(
      rightAngle,
      { color: PROJECTION }
    ),
    ...fbox(
      [
        ['Vertical-only: 8 steps', C.amber],
        ['Orthogonal: √32 ≈ 5.66 steps', PROJECTION],
        ['5.66 < 8', C.ink],
        ['Use the actual square corner.', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('USE THE ACTUAL 90° CORNER', PROJECTION)
  );

  // ------------------------------------------------------------
  // Try it preview
  //
  // Demonstrate the exercise with a temporary candidate point.
  // The shared chapter data stay unchanged.
  // No pointer event handling is added to the narration scene.
  // ------------------------------------------------------------

  const tryCandidateStart = -1;

  let tryString = stringTo(
    tryCandidateStart,
    STRING,
    3.2
  );

  let tryCandidate = candidateMarker(
    tryCandidateStart,
    STRING
  );

  const slideLeftArrow = gridArrow(
    -1.25, -1.25,
    -2.15, -2.15,
    DIRECTION,
    2.6,
    0.12
  );

  const slideRightArrow = gridArrow(
    -0.75, -0.75,
    0.15, 0.15,
    DIRECTION,
    2.6,
    0.12
  );

  const slideHint = new M.VGroup(
    slideLeftArrow,
    slideRightArrow
  );

  // ============================================================
  // 44-46: Visual prompts for Try it
  // ============================================================

  // 44. In Try it, slide the line dot
  //     until its string to B is shortest.
  await until(S(44));

  await play(
    new M.FadeOut(wrongVertical),
    new M.FadeOut(wrongMarker),
    new M.FadeOut(wrongLengthTag),
    new M.FadeOut(correctLengthTag),
    new M.FadeOut(projectedArrow),
    new M.FadeOut(projectedCoordinates),
    new M.FadeOut(residualArrow),
    new M.FadeOut(rightAngle),
    new M.FadeOut(qMarker),
    new M.Create(tryString),
    new M.FadeIn(tryCandidate),
    new M.FadeIn(slideHint),
    ...fbox(
      [
        ['TRY IT', PROJECTION],
        ['Slide the dot along the line.', DIRECTION],
        ['Watch the string length.', STRING],
        ['Find the shortest string.', C.ink]
      ],
      PROJECTION
    ),
    ...say('TRY IT: SLIDE THE LINE DOT', PROJECTION)
  );

  // ------------------------------------------------------------
  // Temporary demonstration point already on the line.
  //
  // This is a visual preview of moving B in the exercise.
  // It is explicitly separate from the fixed chapter data.
  //
  // A point on the line is its own closest point.
  // ------------------------------------------------------------

  const previewStart = xy(
    B.x,
    B.y
  );

  const previewTarget = xy(
    -2,
    -2
  );

  function previewBMarker(p) {
    const ring = new M.Circle({
      radius: 0.14,
      color: C.amber,
      strokeWidth: 2.2
    });

    ring.setFill(C.amber, 0.13);
    ring.moveTo(p);

    const label = tagAt(
      'DRAG B',
      C.amber,
      [
        p[0] + 0.55,
        p[1] - 0.25,
        0
      ],
      P ? 13 : 12,
      1.32
    );

    return new M.VGroup(
      ring,
      label
    );
  }

  let previewB = previewBMarker(
    previewStart
  );

  const previewOnLineTag = tagAt(
    'ON THE LINE',
    PROJECTION,
    [
      previewTarget[0] - 0.50,
      previewTarget[1] + 0.28,
      0
    ],
    P ? 15 : 13,
    1.70
  );

  // 45. Then drag B onto the line
  //     and predict where its closest point will be.
  await until(S(45));

  await play(
    new M.FadeOut(tryString),
    new M.FadeOut(tryCandidate),
    new M.FadeOut(slideHint),
    new M.FadeIn(previewB),
    ...fbox(
      [
        ['TRY IT', PROJECTION],
        ['Move B onto the line.', STRING],
        ['Where is its closest point now?', C.ink]
      ],
      PROJECTION
    ),
    ...say('TRY IT: MOVE B ONTO THE LINE', PROJECTION)
  );

  await play(
    new M.Transform(
      previewB,
      previewBMarker(previewTarget),
      { runTime: 0.95 }
    ),
    new M.FadeIn(previewOnLineTag)
  );

  // ------------------------------------------------------------
  // Restore the exact chapter geometry for the final takeaway.
  //
  // All previously removed elements are recreated as fresh
  // objects rather than regrouping already-visible objects.
  // ------------------------------------------------------------

  const finalProjection = gridArrow(
    0, 0,
    -4, -4,
    PROJECTION,
    4.4,
    0.17
  );

  const finalResidual = gridArrow(
    -4, -4,
    0, -8,
    STRING,
    3.8,
    0.16
  );

  const finalRightAngle = rightAngleAt(
    QP,
    PROJECTION
  );

  const finalQHalo = new M.Dot({
    point: QP,
    radius: 0.19,
    color: PROJECTION
  });

  finalQHalo.setFill(
    PROJECTION,
    0.20
  );

  const finalQDot = dotAt(
    QP,
    PROJECTION,
    0.085
  );

  const finalQLabel = tagAt(
    'Q',
    PROJECTION,
    [
      QP[0] - 0.29,
      QP[1] + 0.24,
      0
    ],
    P ? 17 : 16
  );

  const finalQMarker = new M.VGroup(
    finalQHalo,
    finalQDot,
    finalQLabel
  );

  const finalQCoordinates = tagAt(
    '(−4, −4)',
    PROJECTION,
    [
      QP[0] - 0.40 - pill('(−4, −4)', PROJECTION, P ? 15 : 14).getWidth() / 2,
      QP[1] - 0.12,
      0
    ],
    P ? 15 : 14,
    1.80
  );

  const finalCornerLabel = tagAt(
    '90°',
    PROJECTION,
    [
      QP[0] + 0.55,
      QP[1] + 0.05,
      0
    ],
    P ? 15 : 13,
    0.85
  );

  // 46. Tap New data to try again with a new set of points.
  await until(S(46));

  await play(
    new M.FadeOut(previewB),
    new M.FadeOut(previewOnLineTag),
    new M.LaggedStart(
      points.map(point =>
        new M.Indicate(
          point,
          { color: AREA }
        )
      ),
      {
        lagRatio: 0.22,
        runTime: 1.4
      }
    ),
    ...fbox(
      [
        ['TRY IT', PROJECTION],
        ['Tap New data.', C.ink],
        ['Find a new closest point.', DIRECTION],
        ['Check the square corner.', PROJECTION]
      ],
      PROJECTION
    ),
    ...say('NEW DATA: FIND ANOTHER PROJECTION', PROJECTION)
  );

  // ============================================================
  // 47: Final takeaway
  // ============================================================

  // 47. Orthogonal projection finds the closest point
  //     on a line by meeting the line at a square corner.
  await until(S(47));

  await play(
    new M.Create(finalProjection),
    new M.FadeIn(finalQMarker),
    new M.FadeIn(finalQCoordinates),
    new M.Create(finalResidual),
    new M.Create(finalRightAngle),
    new M.FadeIn(finalCornerLabel),

    ...fbox(
      [
        ['ORTHOGONAL PROJECTION', PROJECTION],
        ['Q = ((B · d) ÷ (d · d)) × d', C.ink],
        ['  = (−8 ÷ 2) × (1, 1)', DIRECTION],
        ['  = (−4, −4)', PROJECTION],
        ['Closest point. Square corner.', STRING]
      ],
      PROJECTION
    ),

    ...say('CLOSEST POINT ON THE LINE, AT 90°', PROJECTION)
  );
}

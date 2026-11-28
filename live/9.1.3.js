// lesson 9.1.3
// Vector norms: measure an apartment's straight-line distance from the average.
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
  // Area: units of 10 square metres.
  // Age: years since the building was built.
  // Rent: monthly asking rent in dollars.
  //
  // Mean area = 6
  // Mean age  = 10
  //
  // Centered vectors:
  // A = (-3, 4)
  // B = (0, -8)
  // C = (3, 4)
  //
  // Euclidean norms:
  // A = 5
  // B = 8
  // C = 5
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

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const NORM = C.amber;
  const MEAN = C.green;
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
  // IMPORTANT:
  // The same screen distance represents one grid step in both
  // directions. This is necessary for the geometric norm picture.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.35;

  const PILL = P
    ? [0, 4.02, 0]
    : [2.65, 2.01, 0];

  const BOXP = P
    ? [0, -4.28, 0]
    : [2.85, -0.30, 0];

  const BOX_MAX = P ? FW - 1.05 : 6.15;

  const STEP = P ? 0.34 : 0.255;

  const OX = P ? -2.04 : -5.80;
  const OY = P ? -2.65 : -2.35;

  const XMAX = 12;
  const YMAX = 16;

  const xy = (area, age) => [
    OX + area * STEP,
    OY + age * STEP,
    0
  ];

  const cp = (x, y) => xy(
    MEAN_AREA + x,
    MEAN_AGE + y
  );

  const ZERO = cp(0, 0);

  const say = (s, c = C.cyan) => showA(s, c, PILL);

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

  function dotAt(p, color, radius = 0.085) {
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
    return objects.map(o => new M.FadeOut(o));
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

  function drawAll(
    objects,
    duration = 1.2,
    lag = 0.10
  ) {
    return new M.LaggedStart(
      objects.map(o => new M.Create(o)),
      {
        lagRatio: lag,
        runTime: duration
      }
    );
  }

  // ------------------------------------------------------------
  // Coordinate-based arrow
  //
  // Uses a shaft and two arrowhead lines.
  // All components are grouped before appearing on screen.
  // ------------------------------------------------------------

  function arrowBetween(
    start,
    end,
    color,
    strokeWidth = 3.5,
    headLength = 0.16
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const length = Math.sqrt(
      dx * dx + dy * dy
    );

    const ux = dx / length;
    const uy = dy / length;

    const hx = end[0] - ux * headLength;
    const hy = end[1] - uy * headLength;

    const halfWidth = headLength * 0.47;

    const left = [
      hx - uy * halfWidth,
      hy + ux * halfWidth,
      0
    ];

    const right = [
      hx + uy * halfWidth,
      hy - ux * halfWidth,
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

  // ------------------------------------------------------------
  // Formula box
  //
  // Each row is either:
  //   'text'
  //   ['text', color]
  //
  // Formula boxes follow the visual demonstrations.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 22;
    const lh = P ? 0.34 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
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

    const ht = rows.length * lh + 0.26;

    const r = rectAt(
      BOXP,
      wd,
      ht,
      color,
      C.card,
      0.97
    );

    const left = BOXP[0] - wd / 2 + 0.30;
    const top = BOXP[1] + ht / 2 - 0.13 - lh / 2;

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
  // Feature-space grid
  //
  // All grid intervals are square.
  // Original and centered coordinate systems use the same
  // physical positions for the three apartment dots.
  // ------------------------------------------------------------

  function makeGrid() {
    const parts = [];

    for (let x = 0; x <= XMAX; x++) {
      parts.push(
        lineBetween(
          xy(x, 0),
          xy(x, YMAX),
          GRID,
          1
        )
      );
    }

    for (let y = 0; y <= YMAX; y++) {
      parts.push(
        lineBetween(
          xy(0, y),
          xy(XMAX, y),
          GRID,
          1
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function makeAxes(centered = false) {
    const axisArea = centered
      ? MEAN_AREA
      : 0;

    const axisAge = centered
      ? MEAN_AGE
      : 0;

    const xAxis = lineBetween(
      xy(0, axisAge),
      xy(XMAX, axisAge),
      AREA,
      2.8
    );

    const yAxis = lineBetween(
      xy(axisArea, 0),
      xy(axisArea, YMAX),
      AGE,
      2.8
    );

    return {
      xAxis,
      yAxis,
      parts: [xAxis, yAxis]
    };
  }

  function makeTicks(centered = false) {
    const parts = [];

    for (let x = 0; x <= XMAX; x++) {
      const p = xy(x, 0);

      parts.push(
        lineBetween(
          [p[0], p[1] - 0.045, 0],
          [p[0], p[1] + 0.045, 0],
          AREA,
          1.3
        )
      );

      if (x % 2 === 0) {
        const value = centered
          ? x - MEAN_AREA
          : x;

        parts.push(
          textAt(
            signed(value),
            P ? 15 : 13,
            AREA,
            [
              p[0],
              p[1] - 0.20,
              0
            ],
            true
          )
        );
      }
    }

    for (let y = 0; y <= YMAX; y++) {
      const p = xy(0, y);

      parts.push(
        lineBetween(
          [p[0] - 0.045, p[1], 0],
          [p[0] + 0.045, p[1], 0],
          AGE,
          1.3
        )
      );

      if (y % 2 === 0) {
        const value = centered
          ? y - MEAN_AGE
          : y;

        parts.push(
          textAt(
            signed(value),
            P ? 15 : 13,
            AGE,
            [
              p[0] - 0.27,
              p[1],
              0
            ],
            true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function makeAxisTitles(centered = false) {
    const areaTitle = textAt(
      centered
        ? 'Area difference (chunks)'
        : 'Area chunks (10 m² each)',
      P ? 16 : 15,
      AREA,
      [
        OX + XMAX * STEP / 2,
        OY - 0.47,
        0
      ],
      false,
      P ? 5.7 : 4.3
    );

    const ageTitle = textAt(
      centered
        ? 'Age difference (years)'
        : 'Building age (years)',
      P ? 16 : 15,
      AGE,
      [
        OX + XMAX * STEP / 2,
        OY + YMAX * STEP + 0.26,
        0
      ],
      false,
      P ? 5.7 : 4.3
    );

    return [
      areaTitle,
      ageTitle
    ];
  }

  function apartmentPoint(d) {
    const p = xy(d.area, d.age);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.16 : 0.135,
      color: AREA
    });

    halo.setFill(AREA, 0.18);

    const dot = dotAt(
      p,
      C.ink,
      P ? 0.075 : 0.065
    );

    const labelPosition = d.id === 'B'
      ? [
          p[0] + 0.31,
          p[1] + 0.10,
          0
        ]
      : [
          p[0],
          p[1] + 0.27,
          0
        ];

    const label = tagAt(
      d.id,
      AREA,
      labelPosition,
      P ? 15 : 14
    );

    return new M.VGroup(
      halo,
      dot,
      label
    );
  }

  function makeMeanMarker(centered = false) {
    const halo = new M.Dot({
      point: ZERO,
      radius: 0.18,
      color: MEAN
    });

    halo.setFill(MEAN, 0.17);

    const dot = dotAt(
      ZERO,
      MEAN,
      0.085
    );

    const label = tagAt(
      centered ? 'NEW ZERO' : 'MEAN',
      MEAN,
      [
        ZERO[0] + 0.60,
        ZERO[1] - 0.27,
        0
      ],
      P ? 15 : 13,
      1.25
    );

    return {
      marker: new M.VGroup(halo, dot),
      label
    };
  }

  function makeMap(centered = false) {
    const grid = makeGrid();
    const axes = makeAxes(centered);
    const ticks = makeTicks(centered);
    const titles = makeAxisTitles(centered);
    const points = DATA.map(apartmentPoint);

    return {
      grid,
      axes,
      ticks,
      titles,
      points
    };
  }

  const map = makeMap(false);

  const pointA = map.points[0];
  const pointB = map.points[1];
  const pointC = map.points[2];

  const mean = makeMeanMarker(false);

  // ============================================================
  // 0-3: Which apartment is far from the middle?
  // ============================================================

  // 0. Which apartment is far from the middle of our listings
  //    on the area and age map?
  await until(S(0));

  await play(
    new M.FadeIn(map.grid),
    reveal(map.points, 0.95, 0.20),
    ...say('FAR FROM THE MIDDLE?', C.amber)
  );

  // 1. Put all three dots back on the grid.
  await until(S(1));

  await play(
    ...map.points.map(p => new M.Flash(p, { color: C.cyan })),
    ...say('APARTMENTS A, B AND C')
  );

  // 2. The bottom counts area chunks and the side counts
  //    years of building age.
  await until(S(2));

  await play(
    new M.Create(map.axes.xAxis),
    new M.Create(map.axes.yAxis),
    new M.FadeIn(map.ticks),
    ...map.titles.map(
      t => new M.FadeIn(t)
    ),
    ...say('ACROSS: AREA • UP: AGE')
  );

  // 3. We need a starting point that reflects all three
  //    apartments.
  await until(S(3));

  await play(
    new M.LaggedStart(
      map.points.map(p =>
        new M.Indicate(p, {
          color: MEAN
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.6
      }
    ),
    ...say('FIND A SHARED STARTING POINT', MEAN)
  );

  // ------------------------------------------------------------
  // Fair-share trays
  //
  // Individual tiles are actual feature units.
  // The total number of tiles never changes when the
  // rows are made equal.
  // ------------------------------------------------------------

  const TRAY_X = P ? 0 : 2.85;
  const TRAY_Y = P ? -4.28 : -0.30;

  const TRAY_W = P ? 6.40 : 6.10;
  const TRAY_H = P ? 1.90 : 2.55;

  const TILE_PITCH = P ? 0.245 : 0.27;
  const TILE_SIZE = TILE_PITCH * 0.79;

  const trayRowY = i => (
    TRAY_Y + (P ? 0.42 : 0.60)
    - i * (P ? 0.36 : 0.45)
  );

  const traySlot = (i, j) => [
    TRAY_X - 1.72 + j * TILE_PITCH,
    trayRowY(i),
    0
  ];

  function trayTile(p, color) {
    const r = new M.Rectangle({
      width: TILE_SIZE,
      height: TILE_SIZE,
      color,
      strokeWidth: 1
    });

    r.setFill(color, 0.80);
    r.moveTo(p);

    return r;
  }

  function makeTray(values, color, title, footer) {
    const frame = rectAt(
      [TRAY_X, TRAY_Y, 0],
      TRAY_W,
      TRAY_H,
      color,
      C.card,
      0.96
    );

    const heading = textAt(
      title,
      P ? 16 : 20,
      color,
      [
        TRAY_X,
        TRAY_Y + TRAY_H / 2 - 0.22,
        0
      ],
      true,
      TRAY_W - 0.40
    );

    const rowLabels = DATA.map((d, i) =>
      textAt(
        d.id,
        P ? 16 : 19,
        C.ink,
        [
          TRAY_X - 2.36,
          trayRowY(i),
          0
        ],
        true
      )
    );

    const valuesText = values.map((v, i) =>
      textAt(
        String(v),
        P ? 16 : 19,
        color,
        [
          TRAY_X + 2.46,
          trayRowY(i),
          0
        ],
        true
      )
    );

    const rows = values.map((v, i) =>
      Array.from(
        { length: v },
        (_, j) => trayTile(
          traySlot(i, j),
          color
        )
      )
    );

    const footerText = textAt(
      footer,
      P ? 16 : 20,
      C.ink,
      [
        TRAY_X,
        TRAY_Y - TRAY_H / 2 + 0.24,
        0
      ],
      true,
      TRAY_W - 0.45
    );

    const parts = [
      frame,
      heading,
      ...rowLabels,
      ...valuesText,
      ...rows.flat(),
      footerText
    ];

    return {
      color,
      rows,
      valuesText,
      footerText,
      parts
    };
  }

  function updateTrayFooter(
    tray,
    text,
    color = C.ink
  ) {
    return new M.Transform(
      tray.footerText,
      textAt(
        text,
        P ? 16 : 20,
        color,
        [
          TRAY_X,
          TRAY_Y - TRAY_H / 2 + 0.24,
          0
        ],
        true,
        TRAY_W - 0.45
      )
    );
  }

  function equalizeTray(tray, target) {
    const moves = [];

    for (
      let receiver = 0;
      receiver < tray.rows.length;
      receiver++
    ) {
      while (
        tray.rows[receiver].length < target
      ) {
        const donor = tray.rows.findIndex(
          row => row.length > target
        );

        if (donor < 0) break;

        const tile = tray.rows[donor].pop();

        const destination = traySlot(
          receiver,
          tray.rows[receiver].length
        );

        tray.rows[receiver].push(tile);

        moves.push(
          new M.Transform(
            tile,
            trayTile(
              destination,
              tray.color
            ),
            {
              pathArc: 0.65
            }
          )
        );
      }
    }

    const animations = [];

    if (moves.length) {
      animations.push(
        new M.LaggedStart(
          moves,
          {
            lagRatio: 0.18,
            runTime: 1.7
          }
        )
      );
    }

    tray.valuesText.forEach((t, i) => {
      animations.push(
        new M.Transform(
          t,
          textAt(
            String(target),
            P ? 16 : 19,
            MEAN,
            [
              TRAY_X + 2.46,
              trayRowY(i),
              0
            ],
            true
          )
        )
      );
    });

    return animations;
  }

  const areaTray = makeTray(
    DATA.map(d => d.area),
    AREA,
    'SHARE THE AREA CHUNKS',
    'A, B and C'
  );

  const ageTray = makeTray(
    DATA.map(d => d.age),
    AGE,
    'SHARE THE YEARS OF AGE',
    '14 + 2 + 14 = 30'
  );

  // ============================================================
  // 4-9: Find the two feature means by sharing
  // ============================================================

  // 4. For area, share the total equally across
  //    the three listings.
  await until(S(4));

  await play(
    reveal(
      areaTray.parts,
      1.65,
      0.045
    ),
    ...say('SHARE THE AREA EQUALLY', AREA)
  );

  // 5. Three plus six plus nine makes eighteen area chunks.
  await until(S(5));

  await play(
    updateTrayFooter(
      areaTray,
      '3 + 6 + 9 = 18',
      AREA
    ),
    ...say('TOTAL AREA = 18 CHUNKS', AREA)
  );

  // 6. Eighteen shared among three gives six area chunks
  //    per listing.
  await until(S(6));

  await play(
    ...equalizeTray(areaTray, 6),
    updateTrayFooter(
      areaTray,
      '18 ÷ 3 = 6 each',
      MEAN
    ),
    ...say('FAIR SHARE = 6 AREA CHUNKS', AREA)
  );

  // 7. For age, fourteen plus two plus fourteen
  //    makes thirty years.
  await until(S(7));

  await play(
    ...fadeAll(areaTray.parts),
    reveal(
      ageTray.parts,
      1.8,
      0.04
    ),
    ...say('TOTAL AGE = 30 YEARS', AGE)
  );

  // 8. Thirty shared among three gives ten years per listing.
  await until(S(8));

  await play(
    ...equalizeTray(ageTray, 10),
    updateTrayFooter(
      ageTray,
      '30 ÷ 3 = 10 each',
      MEAN
    ),
    ...say('FAIR SHARE = 10 YEARS', AGE)
  );

  // 9. Each fair share is a mean, also called an average.
  await until(S(9));

  await play(
    ...fadeAll(ageTray.parts),
    ...fbox(
      [
        ['MEAN = AVERAGE', MEAN],
        ['Area: 18 ÷ 3 = 6', AREA],
        ['Age:  30 ÷ 3 = 10', AGE]
      ],
      MEAN
    ),
    ...say('MEAN = ONE FAIR SHARE', MEAN)
  );

  // ------------------------------------------------------------
  // Mean position and centering
  //
  // The apartment dots do not move.
  // Only the coordinate origin and measuring labels change.
  // ------------------------------------------------------------

  const meanAreaGuide = new M.DashedLine({
    start: xy(MEAN_AREA, 0),
    end: ZERO,
    color: AREA,
    strokeWidth: 2.5
  });

  const meanAgeGuide = new M.DashedLine({
    start: xy(0, MEAN_AGE),
    end: ZERO,
    color: AGE,
    strokeWidth: 2.5
  });

  const centeredAxes = makeAxes(true);
  const centeredTicks = makeTicks(true);
  const centeredTitles = makeAxisTitles(true);

  const newZeroLabel = tagAt(
    'NEW ZERO',
    MEAN,
    [
      ZERO[0] + 0.60,
      ZERO[1] - 0.27,
      0
    ],
    P ? 15 : 13,
    1.25
  );

  // ============================================================
  // 10-14: Move the coordinate origin to the mean
  // ============================================================

  // 10. Place a new dot at six across and ten up.
  await until(S(10));

  await play(
    new M.Create(meanAreaGuide),
    new M.Create(meanAgeGuide),
    new M.FadeIn(mean.marker),
    new M.FadeIn(mean.label),
    ...fbox(
      [
        ['Average apartment', MEAN],
        ['6 across', AREA],
        ['10 up', AGE],
        ['Mean = (6, 10)', C.ink]
      ],
      MEAN
    ),
    ...say('THE AVERAGE IS AT (6, 10)', MEAN)
  );

  // 11. Imagine putting the zero corner of a clear grid
  //     on that dot.
  await until(S(11));

  await play(
    new M.FadeOut(meanAreaGuide),
    new M.FadeOut(meanAgeGuide),
    new M.Transform(
      map.axes.xAxis,
      centeredAxes.xAxis
    ),
    new M.Transform(
      map.axes.yAxis,
      centeredAxes.yAxis
    ),
    new M.FadeOut(map.ticks),
    new M.FadeIn(centeredTicks),
    ...map.titles.map(
      (t, i) => new M.Transform(
        t,
        centeredTitles[i]
      )
    ),
    new M.FadeOut(mean.label),
    new M.FadeIn(newZeroLabel),
    ...fbox(
      [
        ['Old coordinates: (6, 10)', C.muted],
        ['New coordinates: (0, 0)', MEAN]
      ],
      MEAN
    ),
    ...say('PUT ZERO AT THE MEAN', MEAN)
  );

  // 12. Leave all the apartment dots where they are.
  await until(S(12));

  await play(
    ...map.points.map(
      p => new M.Indicate(
        p,
        { color: AREA }
      )
    ),
    ...say('THE APARTMENTS DO NOT MOVE', C.muted)
  );

  // 13. Now count each apartment's steps from the new zero.
  await until(S(13));

  await play(
    new M.Indicate(
      mean.marker,
      { color: MEAN }
    ),
    new M.Indicate(
      map.axes.xAxis,
      { color: AREA }
    ),
    new M.Indicate(
      map.axes.yAxis,
      { color: AGE }
    ),
    ...fbox(
      [
        ['Start at the new zero', MEAN],
        ['Count sideways', AREA],
        ['Then count vertically', AGE]
      ],
      C.violet
    ),
    ...say('COUNT FROM THE NEW START')
  );

  // 14. Moving the starting point this way is called centering.
  await until(S(14));

  await play(
    ...fbox(
      [
        ['CENTERING', MEAN],
        ['Area: subtract 6', AREA],
        ['Age: subtract 10', AGE],
        ['The mean becomes zero', C.ink]
      ],
      MEAN
    ),
    ...say('CENTERING = MEAN AT ZERO', MEAN)
  );

  // ------------------------------------------------------------
  // Apartment A's centered vector
  //
  // New origin O = (0, 0)
  // Right-angle corner R = (-3, 0)
  // Apartment A = (-3, 4)
  // ------------------------------------------------------------

  const A_POS = cp(-3, 4);
  const A_CORNER = cp(-3, 0);

  const aArrow = arrowBetween(
    ZERO,
    A_POS,
    NORM,
    3.8,
    P ? 0.19 : 0.15
  );

  const aAcross = arrowBetween(
    ZERO,
    A_CORNER,
    AREA,
    3.1,
    0.12
  );

  const aUp = arrowBetween(
    A_CORNER,
    A_POS,
    AGE,
    3.1,
    0.12
  );

  const aAcrossLabel = tagAt(
    '−3',
    AREA,
    [
      (ZERO[0] + A_CORNER[0]) / 2,
      ZERO[1] - 0.24,
      0
    ],
    P ? 16 : 14
  );

  const aUpLabel = tagAt(
    '+4',
    AGE,
    [
      A_CORNER[0] - 0.30,
      (A_CORNER[1] + A_POS[1]) / 2,
      0
    ],
    P ? 16 : 14
  );

  const ra = P ? 0.16 : 0.12;

  const aRightCorner = new M.VGroup(
    lineBetween(
      [
        A_CORNER[0] + ra,
        A_CORNER[1],
        0
      ],
      [
        A_CORNER[0] + ra,
        A_CORNER[1] + ra,
        0
      ],
      C.ink,
      2
    ),
    lineBetween(
      [
        A_CORNER[0] + ra,
        A_CORNER[1] + ra,
        0
      ],
      [
        A_CORNER[0],
        A_CORNER[1] + ra,
        0
      ],
      C.ink,
      2
    )
  );

  // ============================================================
  // 15-20: Read A's centered vector
  // ============================================================

  // 15. Look at the arrow from that new starting point to A.
  await until(S(15));

  await play(
    ...clearBox(),
    new M.Create(aArrow),
    new M.Indicate(
      pointA,
      { color: NORM }
    ),
    ...say('FROM ZERO TO APARTMENT A', NORM)
  );

  // 16. A is three steps left of the new zero.
  await until(S(16));

  await play(
    new M.Create(aAcross),
    ...say('3 STEPS LEFT', AREA)
  );

  // 17. On this grid, leftward steps carry a minus sign.
  await until(S(17));

  await play(
    new M.FadeIn(aAcrossLabel),
    new M.Indicate(
      aAcross,
      { color: AREA }
    ),
    ...say('LEFT MEANS NEGATIVE', AREA)
  );

  // 18. Write negative three for A's sideways step.
  await until(S(18));

  await play(
    ...fbox(
      [
        ['A: sideways step', C.ink],
        ['−3', AREA]
      ],
      AREA
    ),
    new M.Indicate(
      aAcrossLabel,
      { color: AREA }
    ),
    ...say('A: FIRST NUMBER = −3', AREA)
  );

  // 19. A is four steps up, so the second number is four.
  await until(S(19));

  await play(
    new M.Create(aUp),
    new M.FadeIn(aUpLabel),
    ...fbox(
      [
        ['Sideways: −3', AREA],
        ['Upward:   +4', AGE]
      ],
      C.violet
    ),
    ...say('A: SECOND NUMBER = 4', AGE)
  );

  // 20. The two numbers describe the centered vector,
  //     the arrow from the new starting point.
  await until(S(20));

  await play(
    ...fbox(
      [
        ['Centered vector for A', C.ink],
        ['A = (−3, 4)', NORM],
        ['3 left, 4 up', C.muted]
      ],
      NORM
    ),
    new M.Indicate(
      aArrow,
      { color: NORM }
    ),
    ...say('A = (−3, 4)', NORM)
  );

  // ============================================================
  // 21-24: A right triangle and its straight-line length
  // ============================================================

  // 21. Draw its sideways step and its upward step
  //     as two sides of a triangle.
  await until(S(21));

  await play(
    new M.Create(aRightCorner),
    new M.Indicate(
      aAcross,
      { color: AREA }
    ),
    new M.Indicate(
      aUp,
      { color: AGE }
    ),
    ...say('TWO SIDES MEET AT A SQUARE CORNER')
  );

  // 22. The arrow itself is the straight side
  //     across the triangle.
  await until(S(22));

  await play(
    new M.Indicate(
      aArrow,
      { color: NORM }
    ),
    ...say('THE STRAIGHT SIDE IS THE ARROW', NORM)
  );

  // 23. We want the length of that straight arrow.
  await until(S(23));

  await play(
    ...fbox(
      [
        ['Sideways length = 3', AREA],
        ['Upward length   = 4', AGE],
        ['Straight length = ?', NORM]
      ],
      NORM
    ),
    ...say('HOW LONG IS THE STRAIGHT ARROW?', NORM)
  );

  // 24. We call this straight-line length the Euclidean norm.
  await until(S(24));

  await play(
    ...fbox(
      [
        ['EUCLIDEAN NORM', NORM],
        ['Straight-line length', C.ink]
      ],
      NORM
    ),
    new M.Indicate(
      aArrow,
      { color: NORM }
    ),
    ...say('NORM = STRAIGHT-LINE LENGTH', NORM)
  );

  // ------------------------------------------------------------
  // Enlarged triangle with a square on each side
  //
  // Local coordinates, in equal grid units:
  //
  // R = (0, 0)
  // O = (3, 0)
  // A = (0, 4)
  //
  // Horizontal square:
  // (0,0), (3,0), (3,-3), (0,-3)
  //
  // Vertical square:
  // (0,0), (0,4), (-4,4), (-4,0)
  //
  // Arrow-side square:
  // O=(3,0), A=(0,4), (4,7), (7,3)
  //
  // The arrow-side square is geometrically constructed
  // from a 90-degree rotation of the arrow-side vector.
  // ------------------------------------------------------------

  const U = P ? 0.55 : 0.40;

  const TRI_X = P ? -0.83 : -3.95;
  const TRI_Y = P ? -0.75 : -1.02;

  const tp = (x, y) => [
    TRI_X + x * U,
    TRI_Y + y * U,
    0
  ];

  const TR = tp(0, 0);
  const TO = tp(3, 0);
  const TA = tp(0, 4);

  const triAcross = lineBetween(
    TR,
    TO,
    AREA,
    3.5
  );

  const triUp = lineBetween(
    TR,
    TA,
    AGE,
    3.5
  );

  const triArrow = arrowBetween(
    TO,
    TA,
    NORM,
    4,
    0.20
  );

  const triCornerSize = U * 0.45;

  const triRightCorner = new M.VGroup(
    lineBetween(
      [
        TR[0] + triCornerSize,
        TR[1],
        0
      ],
      [
        TR[0] + triCornerSize,
        TR[1] + triCornerSize,
        0
      ],
      C.ink,
      2
    ),
    lineBetween(
      [
        TR[0] + triCornerSize,
        TR[1] + triCornerSize,
        0
      ],
      [
        TR[0],
        TR[1] + triCornerSize,
        0
      ],
      C.ink,
      2
    )
  );

  const triA = dotAt(
    TA,
    C.ink,
    0.075
  );

  const triO = dotAt(
    TO,
    MEAN,
    0.075
  );

  const triALabel = tagAt(
    'A',
    AREA,
    [
      TA[0] - 0.23,
      TA[1] + 0.23,
      0
    ],
    16
  );

  const triOLabel = tagAt(
    '0',
    MEAN,
    [
      TO[0] + 0.25,
      TO[1] - 0.20,
      0
    ],
    15
  );

  const triAcrossLabel = textAt(
    '3',
    19,
    AREA,
    [
      tp(1.5, 0)[0],
      tp(1.5, 0)[1] + 0.18,
      0
    ],
    true
  );

  const triUpLabel = textAt(
    '4',
    19,
    AGE,
    [
      tp(0, 2)[0] + 0.18,
      tp(0, 2)[1],
      0
    ],
    true
  );

  const triangleParts = [
    triAcross,
    triUp,
    triArrow,
    triRightCorner,
    triA,
    triO,
    triALabel,
    triOLabel,
    triAcrossLabel,
    triUpLabel
  ];

  // ------------------------------------------------------------
  // Square outlines constructed from exact coordinates
  // ------------------------------------------------------------

  function outlinePolygon(vertices, color) {
    const sides = vertices.map(
      (p, i) => lineBetween(
        p,
        vertices[(i + 1) % vertices.length],
        color,
        2.2
      )
    );

    return new M.VGroup(...sides);
  }

  const areaSquare = outlinePolygon(
    [
      tp(0, 0),
      tp(3, 0),
      tp(3, -3),
      tp(0, -3)
    ],
    AREA
  );

  const ageSquare = outlinePolygon(
    [
      tp(0, 0),
      tp(0, 4),
      tp(-4, 4),
      tp(-4, 0)
    ],
    AGE
  );

  const arrowSquare = outlinePolygon(
    [
      tp(3, 0),
      tp(0, 4),
      tp(4, 7),
      tp(7, 3)
    ],
    NORM
  );

  // ------------------------------------------------------------
  // Unit tiles for the 3-by-3 and 4-by-4 squares
  // ------------------------------------------------------------

  function unitTile(p, color) {
    const tile = new M.Rectangle({
      width: U * 0.90,
      height: U * 0.90,
      color,
      strokeWidth: 1
    });

    tile.setFill(color, 0.40);
    tile.moveTo(p);

    return tile;
  }

  const areaTiles = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      areaTiles.push(
        unitTile(
          tp(
            col + 0.5,
            -row - 0.5
          ),
          AREA
        )
      );
    }
  }

  const ageTiles = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ageTiles.push(
        unitTile(
          tp(
            -col - 0.5,
            row + 0.5
          ),
          AGE
        )
      );
    }
  }

  // ------------------------------------------------------------
  // Exact five-by-five lattice on the arrow-side square
  //
  // A unit step along the arrow is (-3/5, 4/5).
  // A perpendicular unit step is (4/5, 3/5).
  //
  // This creates 25 genuine square tiles without relying
  // on a 3D camera or a rotated-group operation.
  // ------------------------------------------------------------

  function hp(i, j) {
    return tp(
      3 - (3 / 5) * i + (4 / 5) * j,
      (4 / 5) * i + (3 / 5) * j
    );
  }

  const arrowLattice = [];

  for (let i = 1; i < 5; i++) {
    arrowLattice.push(
      lineBetween(
        hp(i, 0),
        hp(i, 5),
        NORM,
        1.5
      )
    );
  }

  for (let j = 1; j < 5; j++) {
    arrowLattice.push(
      lineBetween(
        hp(0, j),
        hp(5, j),
        NORM,
        1.5
      )
    );
  }

  const arrowTiles = [];

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const tileCenter = hp(
        i + 0.5,
        j + 0.5
      );

      const d = new M.Dot({
        point: tileCenter,
        radius: U * 0.105,
        color: NORM
      });

      d.setFill(NORM, 0.55);

      arrowTiles.push(d);
    }
  }

  const areaCount = tagAt(
    '9 TILES',
    AREA,
    [
      tp(1.5, -3)[0],
      tp(1.5, -3)[1] - 0.26,
      0
    ],
    P ? 16 : 15
  );

  const ageCount = tagAt(
    '16 TILES',
    AGE,
    [
      tp(-2, 0)[0],
      tp(-2, 0)[1] - 0.26,
      0
    ],
    P ? 16 : 15
  );

  const arrowCount = tagAt(
    '25 TILES',
    NORM,
    hp(2.5, 2.5),
    P ? 18 : 17
  );

  // ------------------------------------------------------------
  // Five equally long edge sections
  //
  // Highlight an outside edge of the tilted square, so the
  // five unit lengths can be counted directly.
  // ------------------------------------------------------------

  const edgeSegments = [];

  for (let i = 0; i < 5; i++) {
    edgeSegments.push(
      lineBetween(
        hp(i + 0.07, 5),
        hp(i + 0.93, 5),
        NORM,
        5
      )
    );
  }

  const edgeLabelPos = hp(2.5, 5.48);

  const edgeLabel = tagAt(
    '5 UNITS',
    NORM,
    edgeLabelPos,
    P ? 15 : 14,
    1.35
  );

  const diagramParts = [
    ...triangleParts,
    areaSquare,
    ageSquare,
    arrowSquare,
    ...areaTiles,
    ...ageTiles,
    ...arrowLattice,
    ...arrowTiles,
    areaCount,
    ageCount,
    arrowCount,
    ...edgeSegments,
    edgeLabel
  ];

  // ============================================================
  // 25-33: Count the square tiles to find the arrow length
  // ============================================================

  // 25. Picture a square built on each side of the triangle.
  await until(S(25));

  await play(
    ...fadeAll([
      map.grid,
      ...map.axes.parts,
      centeredTicks,
      ...map.titles,
      ...map.points,
      mean.marker,
      newZeroLabel,
      aArrow,
      aAcross,
      aUp,
      aAcrossLabel,
      aUpLabel,
      aRightCorner
    ]),
    ...triangleParts.map(
      o => new M.FadeIn(o)
    ),
    new M.LaggedStart(
      [
        new M.Create(areaSquare),
        new M.Create(ageSquare),
        new M.Create(arrowSquare)
      ],
      {
        lagRatio: 0.28,
        runTime: 1.6
      }
    ),
    ...fbox(
      [
        ['A square on every side', C.ink],
        ['3 units across', AREA],
        ['4 units up', AGE],
        ['Arrow length: ?', NORM]
      ],
      NORM
    ),
    ...say('BUILD A SQUARE ON EACH SIDE', NORM)
  );

  // 26. The little square on the sideways side
  //     has three rows of three tiles.
  await until(S(26));

  await play(
    new M.LaggedStart(
      areaTiles.map(
        tile => new M.FadeIn(tile)
      ),
      {
        lagRatio: 0.14,
        runTime: 1.8
      }
    ),
    ...fbox(
      [
        ['Sideways square', AREA],
        ['3 rows of 3 tiles', AREA]
      ],
      AREA
    ),
    ...say('3 ROWS OF 3', AREA)
  );

  // 27. That gives nine tiles.
  await until(S(27));

  await play(
    new M.FadeIn(areaCount),
    ...fbox(
      [
        ['Sideways square', AREA],
        ['3 × 3 = 9 tiles', AREA]
      ],
      AREA
    ),
    ...say('9 TILES', AREA)
  );

  // 28. The one on the upright side
  //     has four rows of four tiles.
  await until(S(28));

  await play(
    new M.LaggedStart(
      ageTiles.map(
        tile => new M.FadeIn(tile)
      ),
      {
        lagRatio: 0.09,
        runTime: 1.8
      }
    ),
    ...fbox(
      [
        ['Sideways: 3 × 3 = 9', AREA],
        ['Upright: 4 rows of 4', AGE]
      ],
      AGE
    ),
    ...say('4 ROWS OF 4', AGE)
  );

  // 29. That gives sixteen tiles.
  await until(S(29));

  await play(
    new M.FadeIn(ageCount),
    ...fbox(
      [
        ['Sideways: 3 × 3 = 9', AREA],
        ['Upright:  4 × 4 = 16', AGE]
      ],
      C.violet
    ),
    ...say('16 TILES', AGE)
  );

  // 30. Because those sides meet at a square corner,
  //     their tile totals add to the arrow-side square's total.
  await until(S(30));

  await play(
    new M.Indicate(
      triRightCorner,
      { color: C.ink }
    ),
    new M.LaggedStart(
      [
        new M.Indicate(
          areaSquare,
          { color: AREA }
        ),
        new M.Indicate(
          ageSquare,
          { color: AGE }
        ),
        drawAll(
          arrowLattice,
          1.2,
          0.10
        ),
        reveal(
          arrowTiles,
          1.25,
          0.035
        )
      ],
      {
        lagRatio: 0.45,
        runTime: 3.7
      }
    ),
    ...fbox(
      [
        ['At a square corner:', C.ink],
        ['Two smaller square totals', C.muted],
        ['add to the arrow square.', NORM]
      ],
      NORM
    ),
    ...say('THE TWO SQUARE TOTALS ADD', NORM)
  );

  // 31. Nine plus sixteen gives twenty-five tiles.
  await until(S(31));

  await play(
    new M.FadeIn(arrowCount),
    new M.Indicate(
      areaCount,
      { color: AREA }
    ),
    new M.Indicate(
      ageCount,
      { color: AGE }
    ),
    ...fbox(
      [
        ['Sideways square:  9', AREA],
        ['Upright square:  16', AGE],
        ['9 + 16 = 25 tiles', NORM]
      ],
      NORM
    ),
    ...say('9 + 16 = 25', NORM)
  );

  // 32. A square of twenty-five tiles
  //     has five tiles along each edge.
  await until(S(32));

  await play(
    drawAll(
      edgeSegments,
      1.45,
      0.22
    ),
    new M.FadeIn(edgeLabel),
    ...fbox(
      [
        ['25 tiles altogether', NORM],
        ['5 rows of 5', C.ink],
        ['5 × 5 = 25', NORM]
      ],
      NORM
    ),
    ...say('5 TILES ALONG EACH EDGE', NORM)
  );

  // 33. So the arrow is five grid steps long.
  await until(S(33));

  await play(
    new M.Indicate(
      triArrow,
      { color: NORM }
    ),
    new M.Indicate(
      edgeLabel,
      { color: NORM }
    ),
    ...fbox(
      [
        ['A = (−3, 4)', C.ink],
        ['Straight length = 5', NORM]
      ],
      NORM
    ),
    ...say('A HAS NORM 5', NORM)
  );

  // ============================================================
  // 34-38: Translate the square picture into a formula
  // ============================================================

  // 34. To square a number means to multiply it by itself.
  await until(S(34));

  await play(
    new M.Indicate(
      areaSquare,
      { color: AREA }
    ),
    new M.Indicate(
      ageSquare,
      { color: AGE }
    ),
    ...fbox(
      [
        ['To square a number:', C.ink],
        ['3² = 3 × 3 = 9', AREA],
        ['4² = 4 × 4 = 16', AGE]
      ],
      C.violet
    ),
    ...say('SQUARE = MULTIPLY BY ITSELF', C.violet)
  );

  // 35. Negative three times negative three
  //     gives positive nine.
  await until(S(35));

  await play(
    new M.Indicate(
      areaCount,
      { color: AREA }
    ),
    ...fbox(
      [
        ['A goes 3 steps left', AREA],
        ['(−3)² = (−3) × (−3)', AREA],
        ['= 9', NORM]
      ],
      AREA
    ),
    ...say('(−3)² = POSITIVE 9', AREA)
  );

  // 36. To find the square root, ask which number
  //     of edge tiles makes that full square.
  await until(S(36));

  await play(
    new M.Indicate(
      arrowCount,
      { color: NORM }
    ),
    new M.Indicate(
      edgeLabel,
      { color: NORM }
    ),
    ...fbox(
      [
        ['Square: 5 × 5 = 25', NORM],
        ['Square root: √25 = 5', MEAN],
        ['From tile total to edge length', C.muted]
      ],
      MEAN
    ),
    ...say('SQUARE ROOT = FIND THE EDGE', MEAN)
  );

  // 37. Add the square of negative three
  //     to the square of four.
  await until(S(37));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          areaSquare,
          { color: AREA }
        ),
        new M.Indicate(
          ageSquare,
          { color: AGE }
        )
      ],
      {
        lagRatio: 0.35,
        runTime: 1.6
      }
    ),
    ...fbox(
      [
        ['(−3)² = 9', AREA],
        ['4² = 16', AGE],
        ['(−3)² + 4² = 25', NORM]
      ],
      NORM
    ),
    ...say('ADD THE TWO SQUARES', NORM)
  );

  // 38. Take the square root of that total to get the norm.
  await until(S(38));

  await play(
    new M.Indicate(
      triArrow,
      { color: NORM }
    ),
    ...fbox(
      [
        ['norm = √(x² + y²)', C.ink],
        ['     = √((−3)² + 4²)', C.violet],
        ['     = √25', NORM],
        ['     = 5', MEAN]
      ],
      MEAN
    ),
    ...say('NORM = SQUARE ROOT OF THE SUM', MEAN)
  );

  // ------------------------------------------------------------
  // Return to the centered feature-space map
  //
  // Fresh objects avoid regrouping or reparenting previously
  // displayed objects.
  // ------------------------------------------------------------

  const comparison = makeMap(true);

  const comparisonMean = makeMeanMarker(true);

  const comparisonArrows = CENTERED.map(d =>
    arrowBetween(
      ZERO,
      cp(d.x, d.y),
      d.id === 'B' ? C.violet : NORM,
      d.id === 'B' ? 3.7 : 3.3,
      0.15
    )
  );

  const compA = comparisonArrows[0];
  const compB = comparisonArrows[1];
  const compC = comparisonArrows[2];

  const comparisonParts = [
    comparison.grid,
    ...comparison.axes.parts,
    comparison.ticks,
    ...comparison.titles,
    ...comparison.points,
    comparisonMean.marker,
    comparisonMean.label,
    ...comparisonArrows
  ];

  const normA = tagAt(
    '5',
    NORM,
    [
      (ZERO[0] + cp(-3, 4)[0]) / 2 - 0.25,
      (ZERO[1] + cp(-3, 4)[1]) / 2 + 0.04,
      0
    ],
    P ? 16 : 14
  );

  const normB = tagAt(
    '8',
    C.violet,
    [
      ZERO[0] - 0.26,
      (ZERO[1] + cp(0, -8)[1]) / 2,
      0
    ],
    P ? 16 : 14
  );

  const normC = tagAt(
    '5',
    NORM,
    [
      (ZERO[0] + cp(3, 4)[0]) / 2 + 0.25,
      (ZERO[1] + cp(3, 4)[1]) / 2 + 0.04,
      0
    ],
    P ? 16 : 14
  );

  const normLabels = [
    normA,
    normB,
    normC
  ];

  // ------------------------------------------------------------
  // Equal-sized grid step demonstration
  //
  // Both highlighted edges have exactly the same screen length.
  // ------------------------------------------------------------

  const unitCorner = cp(-5, -5);

  const areaUnitLine = lineBetween(
    unitCorner,
    cp(-4, -5),
    AREA,
    5
  );

  const ageUnitLine = lineBetween(
    unitCorner,
    cp(-5, -4),
    AGE,
    5
  );

  const unitStepLabel = tagAt(
    '1 × 1',
    C.ink,
    [
      unitCorner[0] + STEP * 0.5,
      unitCorner[1] - 0.24,
      0
    ],
    P ? 15 : 13
  );

  // ------------------------------------------------------------
  // Area unit comparison
  //
  // Three ten-square-metre chunks become thirty single-square-
  // metre units. The original apartment does not change.
  //
  // This is a unit-conversion illustration, not a change to the
  // shared chapter grid.
  // ------------------------------------------------------------

  const UNIT_X = P ? 0 : 2.85;
  const UNIT_Y = P ? -4.28 : -0.30;

  const unitFrame = rectAt(
    [UNIT_X, UNIT_Y, 0],
    P ? 6.25 : 5.75,
    P ? 1.75 : 2.15,
    AREA,
    C.card,
    0.97
  );

  const oldUnitHeading = textAt(
    '3 AREA CHUNKS',
    P ? 15 : 17,
    AREA,
    [
      UNIT_X,
      UNIT_Y + (P ? 0.63 : 0.79),
      0
    ],
    true
  );

  const newUnitHeading = textAt(
    '30 SINGLE m² UNITS',
    P ? 15 : 17,
    AREA,
    [
      UNIT_X,
      UNIT_Y - (P ? 0.58 : 0.78),
      0
    ],
    true
  );

  const MINI = P ? 0.115 : 0.125;
  const CLUSTER_GAP = 0.16;

  const CLUSTER_W = MINI * 10;

  const firstClusterX = UNIT_X
    - (
      3 * CLUSTER_W
      + 2 * CLUSTER_GAP
    ) / 2
    + CLUSTER_W / 2;

  const largeUnits = [];
  const smallUnits = [];

  for (let k = 0; k < 3; k++) {
    const x = firstClusterX
      + k * (CLUSTER_W + CLUSTER_GAP);

    const old = new M.Rectangle({
      width: CLUSTER_W,
      height: 0.30,
      color: AREA,
      strokeWidth: 1.5
    });

    old.setFill(AREA, 0.55);
    old.moveTo([
      x,
      UNIT_Y + 0.24,
      0
    ]);

    largeUnits.push(old);

    for (let j = 0; j < 10; j++) {
      const small = new M.Rectangle({
        width: MINI * 0.84,
        height: 0.26,
        color: AREA,
        strokeWidth: 0.8
      });

      small.setFill(AREA, 0.72);

      small.moveTo([
        x + (j - 4.5) * MINI,
        UNIT_Y - 0.18,
        0
      ]);

      smallUnits.push(small);
    }
  }

  const conversionParts = [
    unitFrame,
    oldUnitHeading,
    newUnitHeading,
    ...largeUnits,
    ...smallUnits
  ];

  // ============================================================
  // 39-41: Compare lengths and explain the effect of units
  // ============================================================

  // 39. Use this straight-line norm to see how far an apartment
  //     is from your chosen starting point.
  await until(S(39));

  await play(
    ...fadeAll(diagramParts),
    new M.FadeIn(comparison.grid),
    ...comparison.axes.parts.map(
      a => new M.Create(a)
    ),
    new M.FadeIn(comparison.ticks),
    ...comparison.titles.map(
      t => new M.FadeIn(t)
    ),
    reveal(
      comparison.points,
      0.9,
      0.15
    ),
    new M.FadeIn(comparisonMean.marker),
    new M.FadeIn(comparisonMean.label),
    new M.LaggedStart(
      comparisonArrows.map(
        a => new M.Create(a)
      ),
      {
        lagRatio: 0.20,
        runTime: 1.7
      }
    ),
    reveal(
      normLabels,
      1.1,
      0.17
    ),
    ...fbox(
      [
        ['A: (−3, 4) → 5', NORM],
        ['B: (0, −8) → 8', C.violet],
        ['C: (3, 4)  → 5', NORM],
        ['B is farthest from the mean', MEAN]
      ],
      MEAN
    ),
    ...say('COMPARE DISTANCES FROM THE MEAN', MEAN)
  );

  // 40. The grid treats a step of area and a step of age
  //     as equally long.
  await until(S(40));

  await play(
    new M.Create(areaUnitLine),
    new M.Create(ageUnitLine),
    new M.FadeIn(unitStepLabel),
    ...fbox(
      [
        ['One area step', AREA],
        ['One age step', AGE],
        ['Same drawn length', C.ink],
        ['Units affect the norm', C.amber]
      ],
      C.amber
    ),
    ...say('EQUAL GRID STEPS', C.amber)
  );

  // 41. Using single square metres would make each area
  //     difference take up more steps.
  await until(S(41));

  await play(
    ...clearBox(),
    ...fadeAll([
      areaUnitLine,
      ageUnitLine,
      unitStepLabel
    ]),
    new M.FadeIn(unitFrame),
    new M.FadeIn(oldUnitHeading),
    reveal(
      largeUnits,
      0.8,
      0.18
    ),
    new M.LaggedStart(
      smallUnits.map(
        t => new M.FadeIn(t)
      ),
      {
        lagRatio: 0.035,
        runTime: 1.5
      }
    ),
    new M.FadeIn(newUnitHeading),
    ...say('DIFFERENT UNITS, DIFFERENT LENGTHS', C.amber)
  );

  // ============================================================
  // 42-44: Visual prompts for Try it
  // ============================================================

  // 42. In Try it, trace A's straight arrow
  //     and check its length.
  await until(S(42));

  await play(
    ...fadeAll(conversionParts),
    new M.Indicate(
      compA,
      { color: NORM }
    ),
    new M.Indicate(
      normA,
      { color: NORM }
    ),
    ...fbox(
      [
        ['TRY IT', MEAN],
        ['Trace the arrow to A', C.ink],
        ['Check its length', NORM]
      ],
      MEAN
    ),
    ...say('TRY IT: TRACE A', MEAN)
  );

  // 43. Then predict whether C's arrow is shorter,
  //     longer, or the same length.
  await until(S(43));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          compA,
          { color: NORM }
        ),
        new M.Indicate(
          compC,
          { color: NORM }
        )
      ],
      {
        lagRatio: 0.32,
        runTime: 1.65
      }
    ),
    ...fbox(
      [
        ['TRY IT', MEAN],
        ['Compare A and C', C.ink],
        ['Shorter?', AREA],
        ['Longer or the same?', NORM]
      ],
      MEAN
    ),
    ...say('TRY IT: COMPARE A AND C', MEAN)
  );

  // 44. Tap New data to compare lengths from a new average.
  await until(S(44));

  await play(
    new M.Indicate(
      comparisonMean.marker,
      { color: MEAN }
    ),
    ...fbox(
      [
        ['TRY IT', MEAN],
        ['Tap New data', C.ink],
        ['Find the new average', MEAN],
        ['Compare the new lengths', NORM]
      ],
      MEAN
    ),
    ...say('NEW DATA: FIND A NEW MEAN', MEAN)
  );

  // ============================================================
  // 45: Final takeaway
  // ============================================================

  // 45. A straight-line norm measures how far a vector
  //     reaches from its starting point.
  await until(S(45));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          compA,
          { color: NORM }
        ),
        new M.Indicate(
          compB,
          { color: C.violet }
        ),
        new M.Indicate(
          compC,
          { color: NORM }
        )
      ],
      {
        lagRatio: 0.22,
        runTime: 1.9
      }
    ),
    ...fbox(
      [
        ['EUCLIDEAN NORM', NORM],
        ['norm = √(x² + y²)', C.ink],
        ['A: √(9 + 16) = 5', MEAN],
        ['Straight distance from zero', C.muted]
      ],
      MEAN
    ),
    ...say('NORM = HOW FAR THE ARROW REACHES', NORM)
  );
}

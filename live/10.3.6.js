// lesson 10.3.6
// Overdispersion: when counts spread out more than Poisson expects.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter data: Log 2, ten patients with one chronic condition.
// Mean = 2; sum of squared distances = 36; sample variance = 4.
// Negative binomial with mean 2 and k = 2 has variance 4.
// Probability calculations use exact values; displayed values are rounded.
// Standard-error illustrations are schematic, not additional clinic data.
// Uses the supplied engine interface; browser rendering has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play } = L;

  // ------------------------------------------------------------
  // Fixed shared chapter data.
  // ------------------------------------------------------------

  const DATA = [0, 0, 0, 1, 1, 2, 3, 3, 4, 6];

  const N = DATA.length;
  const TOTAL = DATA.reduce((a, b) => a + b, 0);
  const MEAN = TOTAL / N;

  const DISTANCES = DATA.map(v =>
    Math.abs(v - MEAN)
  );

  const SQUARES = DISTANCES.map(v =>
    v * v
  );

  const SUM_SQUARES = SQUARES.reduce(
    (a, b) => a + b,
    0,
  );

  const SAMPLE_VARIANCE = SUM_SQUARES / (N - 1);

  const POISSON_VARIANCE = MEAN;

  const K = 2;

  const nbVariance = k =>
    MEAN + MEAN * MEAN / k;

  const POISSON_ZERO = Math.exp(-MEAN);

  const NB_ZERO = Math.pow(
    K / (K + MEAN),
    K,
  );

  const OBSERVED_ZEROS = DATA.filter(v => v === 0).length;

  const TEAL = C.teal || '#40D9C2';
  const RED = C.red || '#F87181';
  const PINK = C.pink || '#F472B6';

  const CX = P ? 0 : -2.55;

  const PILL = P
    ? [0, 2.05, 0]
    : [CX, 1.95, 0];

  const BOXP = P
    ? [0, 3.35, 0]
    : [4.25, -0.15, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Basic visual helpers.
  // ------------------------------------------------------------

  function textAt(
    s,
    size,
    color,
    pos,
    mono = false,
    maxWidth = null,
  ) {
    const t = T(s, P ? Math.max(15, size) : size, color, mono);

    if (maxWidth && t.getWidth() > maxWidth) {
      t.scale(maxWidth / t.getWidth());
    }

    t.moveTo(pos);

    return t;
  }

  function line(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width,
    });
  }

  function dash(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
    });
  }

  function rect(
    w,
    h,
    pos,
    color,
    fill = C.card,
    opacity = 0.95,
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2,
    });

    r.setFill(fill, opacity);
    r.moveTo(pos);

    return r;
  }

  function block(
    w,
    h,
    pos,
    color,
    opacity = 0.78,
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1,
    });

    r.setFill(color, opacity);
    r.moveTo(pos);

    return r;
  }

  function dot(p, color = TEAL, radius = 0.105) {
    const d = new M.Dot({
      point: p,
      radius,
      color,
    });

    d.setFill(color, 1);

    return d;
  }

  function glow(p, color = TEAL, radius = 0.105) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.1,
      color,
    });

    halo.setFill(color, 0.16);

    return new M.VGroup(
      halo,
      dot(p, color, radius),
    );
  }

  function ring(p, radius, color, width = 3) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: width,
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function tagAt(s, color, p, size = 17) {
    const t = pill(s, color, P ? Math.max(15, size) : size);
    t.moveTo(p);
    return t;
  }

  function arrow(a, b, color = C.amber, width = 3) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.hypot(dx, dy) || 1;

    const ux = dx / length;
    const uy = dy / length;

    const h = Math.min(0.14, length * 0.35);
    const w = h * 0.55;

    const left = [
      b[0] - h * ux - w * uy,
      b[1] - h * uy + w * ux,
      0,
    ];

    const right = [
      b[0] - h * ux + w * uy,
      b[1] - h * uy - w * ux,
      0,
    ];

    return new M.VGroup(
      line(a, b, color, width),
      line(b, left, color, width),
      line(b, right, color, width),
    );
  }

  function fadeInAll(...objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeIn(o));
  }

  function fadeOutAll(...objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));
  }

  // ------------------------------------------------------------
  // Formula / explanation panel.
  //
  // Phone: above the main picture.
  // Laptop: to the right of the main picture.
  //
  // Each replacement is newly constructed before being displayed.
  // ------------------------------------------------------------

  let boxNow = null;

  function replaceBox(next) {
    const animations = [];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow, { runTime: 0.30 })
      );
    }

    if (next) {
      animations.push(
        new M.FadeIn(next, { runTime: 0.40 })
      );
    }

    boxNow = next;

    return animations;
  }

  function fbox(lines, color = C.cyan) {
    if (!lines) return replaceBox(null);

    const size = P ? 21 : 20;
    const lh = P ? 0.39 : 0.43;

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

      const indent =
        cw * (s.length - s.trimStart().length);

      return t.getWidth() + indent;
    });

    const wd = Math.max(...widths) + 0.64;
    const ht = rows.length * lh + 0.36;

    const r = rect(
      wd,
      ht,
      BOXP,
      color,
    );

    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];

      const indent =
        cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0,
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.10 : 4.35;
    const maxh = P ? 1.72 : 3.50;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht,
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    return replaceBox(g);
  }

  // ------------------------------------------------------------
  // Track the main picture and temporary annotations.
  //
  // Objects are never regrouped after being placed on screen.
  // All transitions return animations for a single play() call.
  // ------------------------------------------------------------

  let pictureNow = [];
  let marksNow = [];

  function picture(...objects) {
    const next = objects.filter(Boolean);

    const animations = [
      ...fadeOutAll(...pictureNow, ...marksNow),
      ...fadeInAll(...next),
    ];

    pictureNow = next;
    marksNow = [];

    return animations;
  }

  function addPicture(...objects) {
    const next = objects.filter(Boolean);

    pictureNow.push(...next);

    return fadeInAll(...next);
  }

  function marks(...objects) {
    const next = objects.filter(Boolean);

    const animations = [
      ...fadeOutAll(...marksNow),
      ...fadeInAll(...next),
    ];

    marksNow = next;

    return animations;
  }

  // ------------------------------------------------------------
  // Patient icon.
  // ------------------------------------------------------------

  function patient(p, color = TEAL, scale = 1) {
    const head = new M.Circle({
      radius: 0.13 * scale,
      color,
    });

    head.setFill(color, 1);

    head.moveTo([
      p[0],
      p[1] + 0.20 * scale,
      0,
    ]);

    const body = new M.Arc({
      radius: 0.23 * scale,
      startAngle: 0,
      angle: Math.PI,
      color,
    });

    body.setFill(color, 0.85);

    body.moveTo([
      p[0],
      p[1] - 0.05 * scale,
      0,
    ]);

    return new M.VGroup(head, body);
  }

  // ------------------------------------------------------------
  // 0: return to the ten patients with one chronic condition.
  // ------------------------------------------------------------

  const INTRO_SP = P ? 1.02 : 1.08;

  const INTRO_ROWS = P
    ? [-0.35, -2.25]
    : [0.55, -0.65];

  const patients = DATA.map((_, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;

    return patient(
      [
        CX + (col - 2) * INTRO_SP,
        INTRO_ROWS[row],
        0,
      ],
      TEAL,
      1.15,
    );
  });

  const introLabel = textAt(
    '10 patients',
    25,
    TEAL,
    [
      CX,
      P ? -3.45 : -1.65,
      0,
    ],
    true,
  );

  const conditionTag = tagAt(
    'ONE CHRONIC CONDITION EACH',
    C.violet,
    [
      CX,
      P ? 0.85 : 1.40,
      0,
    ],
    15,
  );

  await until(S(0));
  await play(
    ...picture(
      ...patients,
      introLabel,
      conditionTag,
    ),
    ...say('BACK TO OUR TEN PATIENTS', TEAL),
  );

  // ------------------------------------------------------------
  // Number-line picture.
  //
  // Horizontal position = observed visit count.
  // Every glowing dot represents one patient.
  // Equal values stack vertically.
  // ------------------------------------------------------------

  const NX0 = CX - (P ? 2.65 : 2.90);
  const NX1 = CX + (P ? 2.65 : 2.90);

  const NY = P ? -3.70 : -1.40;

  const DOT_PITCH = P ? 0.62 : 0.42;

  const visitX = v =>
    NX0 + v / 6 * (NX1 - NX0);

  function numberLine() {
    const parts = [
      line(
        [NX0 - 0.13, NY, 0],
        [NX1 + 0.13, NY, 0],
        C.muted,
        2.4,
      ),
    ];

    for (let v = 0; v <= 6; v++) {
      parts.push(
        line(
          [visitX(v), NY - 0.065, 0],
          [visitX(v), NY + 0.065, 0],
          C.muted,
          1.5,
        ),
      );

      parts.push(
        textAt(
          String(v),
          19,
          C.muted,
          [
            visitX(v),
            NY - 0.30,
            0,
          ],
          true,
        ),
      );
    }

    parts.push(
      textAt(
        'Visits in one year',
        18,
        C.ink,
        [
          CX,
          NY - 0.75,
          0,
        ],
      ),
    );

    return new M.VGroup(...parts);
  }

  function dotPositions() {
    const used = {};

    return DATA.map(v => {
      const j = used[v] || 0;
      used[v] = j + 1;

      return [
        visitX(v),
        NY + 0.23 + j * DOT_PITCH,
        0,
      ];
    });
  }

  function meanMarker() {
    const x = visitX(MEAN);

    const top = NY + (P ? 2.75 : 1.90);

    return new M.VGroup(
      dash(
        [x, NY - 0.09, 0],
        [x, top, 0],
        C.amber,
      ),
      ring(
        [x, NY, 0],
        0.12,
        C.amber,
        3,
      ),
      tagAt(
        'MEAN = 2',
        C.amber,
        [x, top + 0.27, 0],
        17,
      ),
    );
  }

  function distributionPicture(withMean = true) {
    const positions = dotPositions();

    const axis = numberLine();

    const dots = positions.map(p =>
      glow(p, TEAL, 0.115)
    );

    const heading = textAt(
      '10 patients · 1 condition each',
      18,
      TEAL,
      [
        CX,
        P ? 0.95 : 1.30,
        0,
      ],
      false,
      P ? FW - 0.9 : 5.8,
    );

    return {
      axis,
      dots,
      heading,
      positions,
      mean: withMean ? meanMarker() : null,
    };
  }

  function distributionObjects(d) {
    return [
      d.axis,
      ...d.dots,
      d.heading,
      d.mean,
    ].filter(Boolean);
  }

  let dist = distributionPicture(false);

  // ------------------------------------------------------------
  // 2: place ten patients as stacked dots on the line.
  // ------------------------------------------------------------

  // 1: a line marked in visits, 0 to 6.
  await until(S(1));
  await play(
    ...picture(
      dist.axis,
      dist.heading,
    ),
    ...fbox([
      ['Visits in one year', TEAL],
      '0, 0, 0, 1, 1,',
      '2, 3, 3, 4, 6',
    ], TEAL),
    ...say('A LINE MARKED IN VISITS', TEAL),
  );

  await until(S(2));
  await play(
    new M.LaggedStart(
      dist.dots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.10, runTime: 1.30 },
    ),
    ...say('ONE DOT = ONE PATIENT', TEAL),
  );

  pictureNow.push(...dist.dots);

  // ------------------------------------------------------------
  // 3: their mean is two visits.
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // 4: three zero-visit patients and one six-visit patient.
  // ------------------------------------------------------------

  function stackOutline(value, color) {
    const n = DATA.filter(v => v === value).length;

    const h = 0.45 + (n - 1) * DOT_PITCH;

    const r = new M.RoundedRectangle({
      width: 0.55,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2,
    });

    r.setFill(color, 0.035);

    r.moveTo([
      visitX(value),
      NY + 0.23 + (n - 1) * DOT_PITCH / 2,
      0,
    ]);

    return r;
  }

  const zeroOutline = stackOutline(0, RED);
  const sixOutline = stackOutline(6, C.violet);

  const zeroLabel = textAt(
    '3 patients',
    17,
    RED,
    [
      visitX(0) + 0.36,
      NY + 0.69 + 2 * DOT_PITCH,
      0,
    ],
  );

  const sixLabel = textAt(
    '1 patient',
    17,
    C.violet,
    [
      visitX(6) - 0.32,
      NY + 0.76,
      0,
    ],
  );

  await until(S(3));
  await play(
    ...marks(
      zeroOutline,
      sixOutline,
      zeroLabel,
      sixLabel,
    ),
    ...fbox([
      ['3 patients: 0 visits', RED],
      ['1 patient: 6 visits', C.violet],
      'Same group',
      'Different counts',
    ]),
    ...say('THREE NEVER CAME · ONE CAME SIX TIMES', C.amber),
  );

  dist.mean = meanMarker();

  await until(S(4));
  await play(
    ...addPicture(dist.mean),
    ...fbox([
      'Total visits = 20',
      'Patients = 10',
      ['20 ÷ 10 = 2', C.amber],
    ], C.amber),
    ...say('THE AVERAGE IS 2 VISITS', C.amber),
  );

  // ------------------------------------------------------------
  // 5: the average hides very different patterns of use.
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // 9: draw each patient's horizontal distance to the mean.
  //
  // The zero-distance patient gets a ring rather than an
  // artificial nonzero line.
  // ------------------------------------------------------------

  const distanceLines = DATA.map((v, i) => {
    const p = dist.positions[i];

    if (v === MEAN) {
      return ring(
        p,
        0.17,
        C.green,
        2.5,
      );
    }

    return line(
      p,
      [
        visitX(MEAN),
        p[1],
        0,
      ],
      C.violet,
      2.0,
    );
  });

  await until(S(5));

  const oldMarks = marksNow;
  marksNow = distanceLines.slice();

  await play(
    ...fadeOutAll(...oldMarks),
    new M.LaggedStart(
      distanceLines.map(m => new M.FadeIn(m)),
      { lagRatio: 0.12, runTime: 1.30 },
    ),
    ...fbox([
      ['Distance to 2', C.violet],
      'How many steps',
      'from each count',
      'to the average?',
    ], C.violet),
    ...say('MEASURE FROM EACH DOT TO 2', C.violet),
  );

  // ------------------------------------------------------------
  // Squared-distance worksheet.
  //
  // Ten cells, one per patient.
  // Each cell first shows the observed count and distance.
  // The result is revealed as literal square tiles.
  //
  // Rows:
  //   0, 0, 0, 1, 1
  //   2, 3, 3, 4, 6
  //
  // A distance of 4 becomes a 4 × 4 square of 16 tiles.
  // ------------------------------------------------------------

  const CELL_W = P ? 1.12 : 1.10;
  const CELL_H = P ? 2.30 : 1.57;

  const CELL_SP = P ? 1.24 : 1.22;

  const CELL_YS = P
    ? [-0.35, -2.95]
    : [0.30, -1.48];

  const TILE = P ? 0.17 : 0.15;

  function cellPosition(i) {
    return [
      CX + (i % 5 - 2) * CELL_SP,
      CELL_YS[Math.floor(i / 5)],
      0,
    ];
  }

  function squareCell(i) {
    const p = cellPosition(i);
    const v = DATA[i];
    const d = DISTANCES[i];

    const parts = [
      rect(
        CELL_W,
        CELL_H,
        p,
        C.muted,
        C.card,
        0.82,
      ),
      textAt(
        `${v} ${v === 1 ? 'visit' : 'visits'}`,
        15,
        TEAL,
        [
          p[0],
          p[1] + CELL_H / 2 - 0.22,
          0,
        ],
        true,
        CELL_W - 0.10,
      ),
      textAt(
        `dist ${d}`,
        14,
        C.violet,
        [
          p[0],
          p[1] + CELL_H / 2 - 0.46,
          0,
        ],
        true,
        CELL_W - 0.10,
      ),
    ];

    return new M.VGroup(...parts);
  }

  function squareResult(i) {
    const p = cellPosition(i);

    const d = DISTANCES[i];
    const result = SQUARES[i];

    const color = d === 0 ? C.green : C.violet;

    const tileY = p[1] - (P ? 0.10 : 0.13);

    const parts = [];

    if (d === 0) {
      parts.push(
        ring(
          [p[0], tileY, 0],
          0.095,
          C.green,
          2,
        ),
      );
    } else {
      for (let row = 0; row < d; row++) {
        for (let col = 0; col < d; col++) {
          parts.push(
            block(
              TILE * 0.88,
              TILE * 0.88,
              [
                p[0] + (col - (d - 1) / 2) * TILE,
                tileY + (row - (d - 1) / 2) * TILE,
                0,
              ],
              color,
              0.76,
            ),
          );
        }
      }
    }

    parts.push(
      textAt(
        String(result),
        21,
        color,
        [
          p[0],
          p[1] - CELL_H / 2 + 0.18,
          0,
        ],
        true,
      ),
    );

    return new M.VGroup(...parts);
  }

  const cells = DATA.map((_, i) =>
    squareCell(i)
  );

  const squareResults = DATA.map((_, i) =>
    squareResult(i)
  );

  const worksheetTitle = textAt(
    'Square the distance for every patient',
    18,
    C.ink,
    [
      CX,
      P ? 1.30 : 1.40,
      0,
    ],
    false,
    P ? FW - 0.9 : 6.2,
  );

  function revealSquares(indices) {
    const results = indices.map(i =>
      squareResults[i]
    );

    pictureNow.push(...results);

    return [
      new M.LaggedStart(
        results.map(r => new M.FadeIn(r)),
        { lagRatio: 0.14, runTime: 0.80 },
      ),
    ];
  }

  function cellHighlight(indices, color = C.amber) {
    return indices.map(i => {
      const r = new M.RoundedRectangle({
        width: CELL_W + 0.035,
        height: CELL_H + 0.035,
        cornerRadius: 0.14,
        color,
        strokeWidth: 2,
      });

      r.setFill(color, 0);
      r.moveTo(cellPosition(i));

      return r;
    });
  }

  // ------------------------------------------------------------
  // 10: square each distance.
  // ------------------------------------------------------------

  await until(S(6));
  await play(
    ...picture(
      ...cells,
      worksheetTitle,
    ),
    ...fbox([
      ['One square per patient', C.violet],
      'Side of the square',
      '= distance to 2',
    ], C.violet),
    ...say('EACH DISTANCE BECOMES A SQUARE', C.violet),
  );

  // 7: area = distance × distance.
  await until(S(7));
  await play(
    ...fbox([
      ['Area of a square', C.violet],
      'side × side',
      ['= distance × distance', C.violet],
    ], C.violet),
    ...say('AREA = DISTANCE × DISTANCE', C.violet),
  );

  // ------------------------------------------------------------
  // 11: three zero-visit patients.
  // Distance = 2; squared distance = 4 each.
  // ------------------------------------------------------------

  await until(S(8));
  await play(
    ...marks(...cellHighlight([0, 1, 2])),
    ...revealSquares([0, 1, 2]),
    ...fbox([
      '0 visits → distance 2',
      ['2 × 2 = 4', C.violet],
      ['4, 4, 4', C.amber],
    ], C.violet),
    ...say('ZERO-VISIT DOTS: 4, 4, 4', C.violet),
  );

  // ------------------------------------------------------------
  // 12: two one-visit patients.
  // Distance = 1; squared distance = 1 each.
  // ------------------------------------------------------------

  await until(S(9));
  await play(
    ...marks(...cellHighlight([3, 4])),
    ...revealSquares([3, 4]),
    ...fbox([
      '1 visit → distance 1',
      ['1 × 1 = 1', C.violet],
      ['1, 1', C.amber],
    ], C.violet),
    ...say('ONE-VISIT DOTS: 1, 1', C.violet),
  );

  // ------------------------------------------------------------
  // 13: the patient with two visits is already at the mean.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...marks(...cellHighlight([5], C.green)),
    ...revealSquares([5]),
    ...fbox([
      '2 visits → distance 0',
      ['0 × 0 = 0', C.green],
      'Exactly at the mean',
    ], C.green),
    ...say('AT THE MEAN: ZERO DISTANCE', C.green),
  );

  // ------------------------------------------------------------
  // 14: two three-visit patients.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...marks(...cellHighlight([6, 7])),
    ...revealSquares([6, 7]),
    ...fbox([
      '3 visits → distance 1',
      ['1 × 1 = 1', C.violet],
      ['1, 1', C.amber],
    ], C.violet),
    ...say('THREE-VISIT DOTS: 1, 1', C.violet),
  );

  // ------------------------------------------------------------
  // 15: four visits gives a squared distance of four.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    ...marks(...cellHighlight([8])),
    ...revealSquares([8]),
    ...fbox([
      '4 visits → distance 2',
      ['2 × 2 = 4', C.violet],
    ], C.violet),
    ...say('FOUR VISITS: 2 SQUARED = 4', C.violet),
  );

  // ------------------------------------------------------------
  // 16: six visits gives a squared distance of sixteen.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...marks(...cellHighlight([9], PINK)),
    ...revealSquares([9]),
    ...fbox([
      '6 visits → distance 4',
      ['4 × 4 = 16', C.violet],
      'A much larger square',
    ], PINK),
    ...say('SIX VISITS: 4 SQUARED = 16', PINK),
  );

  // 14: bigger gaps make much bigger squares.
  await until(S(14));
  await play(
    ...marks(
      ...cellHighlight([3], C.cyan),
      ...cellHighlight([0], C.amber),
      ...cellHighlight([9], PINK),
    ),
    ...fbox([
      ['Distance 1 → area 1', C.cyan],
      ['Distance 2 → area 4', C.amber],
      ['Distance 4 → area 16', PINK],
    ], PINK),
    ...say('BIGGER GAP → MUCH BIGGER SQUARE', PINK),
  );

  // ------------------------------------------------------------
  // 17: sum all ten squared distances.
  //
  // 4 + 4 + 4 + 1 + 1 + 0 + 1 + 1 + 4 + 16 = 36.
  // ------------------------------------------------------------

  const SUM_Y = P ? -4.85 : -2.72;

  const sumTag = tagAt(
    'TOTAL = 36',
    C.amber,
    [
      CX,
      SUM_Y,
      0,
    ],
    19,
  );

  await until(S(15));
  await play(
    ...marks(sumTag),
    ...fbox([
      '4 + 4 + 4 + 1 + 1',
      '+ 0 + 1 + 1 + 4 + 16',
      ['= 36', C.amber],
    ], C.amber),
    ...say('ADD ALL THE AREAS: 36', C.amber),
  );

  // ------------------------------------------------------------
  // 18: sample variance divides by count minus one.
  //
  // Ten patient observations, denominator = 9.
  // ------------------------------------------------------------

  const nineTag = tagAt(
    '10 − 1 = 9',
    C.green,
    [
      CX,
      SUM_Y,
      0,
    ],
    19,
  );

  await until(S(16));
  await play(
    ...marks(nineTag),
    ...fbox([
      'Patient count = 10',
      'Sample variance uses',
      ['count − 1 = 9', C.green],
    ], C.green),
    ...say('TEN PATIENTS, SO DIVIDE BY NINE', C.green),
  );

  // ------------------------------------------------------------
  // 19: divide 36 by 9.
  // ------------------------------------------------------------

  const varianceTag = tagAt(
    'VARIANCE = 4',
    C.green,
    [
      CX,
      SUM_Y,
      0,
    ],
    19,
  );

  await until(S(17));
  await play(
    ...marks(varianceTag),
    ...fbox([
      '36 ÷ 9',
      ['= 4', C.green],
    ], C.green),
    ...say('36 DIVIDED BY 9 IS 4', C.green),
  );

  // ------------------------------------------------------------
  // Visual comparison of mean and variance.
  //
  // These are numerical measures, not literal counts of people.
  // Bar lengths share a common scale.
  // ------------------------------------------------------------

  const VX0 = CX - (P ? 1.50 : 1.55);
  const VX1 = CX + (P ? 2.65 : 2.75);

  const VMAX = 5;

  const VROWS = P
    ? [-0.05, -1.80, -3.55]
    : [0.65, -0.62, -1.89];

  const valueX = v =>
    VX0 + v / VMAX * (VX1 - VX0);

  function varianceBar(
    row,
    label,
    value,
    color,
  ) {
    const y = VROWS[row];

    const width = valueX(value) - VX0;

    const parts = [
      textAt(
        label,
        16,
        color,
        [
          VX0 - 0.76,
          y,
          0,
        ],
        false,
        1.40,
      ),
      line(
        [VX0, y, 0],
        [VX1, y, 0],
        C.muted,
        1.0,
      ),
      block(
        width,
        P ? 0.42 : 0.36,
        [
          VX0 + width / 2,
          y,
          0,
        ],
        color,
        0.77,
      ),
      textAt(
        String(value),
        23,
        color,
        [
          valueX(value) + 0.23,
          y,
          0,
        ],
        true,
      ),
    ];

    return new M.VGroup(...parts);
  }

  function varianceScale() {
    const y = P ? -4.75 : -2.60;

    const parts = [
      line(
        [VX0, y, 0],
        [VX1, y, 0],
        C.muted,
        1.7,
      ),
    ];

    for (let v = 0; v <= VMAX; v++) {
      parts.push(
        line(
          [valueX(v), y - 0.06, 0],
          [valueX(v), y + 0.06, 0],
          C.muted,
          1.2,
        ),
      );

      parts.push(
        textAt(
          String(v),
          15,
          C.muted,
          [
            valueX(v),
            y - 0.23,
            0,
          ],
          true,
        ),
      );
    }

    return new M.VGroup(...parts);
  }

  const varianceHeading = textAt(
    'Mean and variance',
    21,
    C.ink,
    [
      CX,
      P ? 1.20 : 1.38,
      0,
    ],
  );

  const observedMeanBar = varianceBar(
    0,
    'Mean',
    MEAN,
    C.amber,
  );

  const poissonVarianceBar = varianceBar(
    1,
    'Poisson var.',
    POISSON_VARIANCE,
    C.cyan,
  );

  const actualVarianceBar = varianceBar(
    2,
    'Sample var.',
    SAMPLE_VARIANCE,
    PINK,
  );

  // ------------------------------------------------------------
  // 20: name the result sample variance.
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    ...picture(
      varianceHeading,
      varianceScale(),
      observedMeanBar,
      actualVarianceBar,
    ),
    ...fbox([
      ['SAMPLE VARIANCE', C.green],
      'Squared distances',
      '÷ (count − 1)',
      ['= 36 ÷ 9 = 4', C.green],
    ], C.green),
    ...say('OUR SAMPLE VARIANCE IS 4', C.green),
  );

  // ------------------------------------------------------------
  // 21: Poisson expects variance equal to the mean.
  // ------------------------------------------------------------

  const equalGuide = dash(
    [
      valueX(2),
      VROWS[0] + 0.31,
      0,
    ],
    [
      valueX(2),
      VROWS[1] - 0.31,
      0,
    ],
    C.cyan,
  );

  // 19: the Poisson rule: variance must equal the mean.
  await until(S(19));
  await play(
    ...addPicture(poissonVarianceBar),
    ...fbox([
      ['POISSON RULE', C.cyan],
      'variance = mean',
      'Two numbers that',
      'must match',
    ], C.cyan),
    ...say('POISSON: VARIANCE MUST EQUAL THE MEAN', C.cyan),
  );

  // 20: mean 2, so Poisson expects variance 2.
  await until(S(20));
  await play(
    ...marks(equalGuide),
    ...fbox([
      ['Mean = 2', C.amber],
      ['So Poisson variance = 2', C.cyan],
    ], C.cyan),
    ...say('POISSON WOULD EXPECT VARIANCE 2', C.cyan),
  );

  // ------------------------------------------------------------
  // 22: actual sample variance is twice the model variance.
  //
  // The variance is twice as large; the standard deviation
  // is not twice as large.
  // ------------------------------------------------------------

  const excessOutline = new M.RoundedRectangle({
    width: valueX(4) - valueX(2),
    height: P ? 0.52 : 0.46,
    cornerRadius: 0.08,
    color: PINK,
    strokeWidth: 2.5,
  });

  excessOutline.setFill(PINK, 0);

  excessOutline.moveTo([
    (valueX(2) + valueX(4)) / 2,
    VROWS[2],
    0,
  ]);

  const twiceTag = tagAt(
    '×2 VARIANCE',
    PINK,
    [
      (valueX(2) + valueX(4)) / 2,
      VROWS[2] + (P ? 0.55 : 0.42),
      0,
    ],
    15,
  );

  await until(S(21));
  await play(
    ...marks(
      equalGuide,
      excessOutline,
      twiceTag,
    ),
    ...fbox([
      ['Expected variance: 2', C.cyan],
      ['Sample variance:   4', PINK],
      '4 ÷ 2 = 2',
      ['Twice the variance', PINK],
    ], PINK),
    ...say('OUR VARIANCE IS TWICE AS LARGE', PINK),
  );

  // ------------------------------------------------------------
  // 23: introduce the name overdispersion.
  // ------------------------------------------------------------

  await until(S(22));
  await play(
    new M.Indicate(
      actualVarianceBar,
      { color: PINK },
    ),
    ...fbox([
      ['OVERDISPERSION', PINK],
      'Counts spread more',
      'than the Poisson model',
      'expects.',
    ], PINK),
    ...say('THIS IS CALLED OVERDISPERSION', PINK),
  );

  // ------------------------------------------------------------
  // 24: unpack the word.
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // 25: return to the dots and inspect the zero counts.
  // ------------------------------------------------------------

  dist = distributionPicture(true);

  const zeroFocus = stackOutline(0, RED);

  const zeroCountTag = tagAt(
    '3 ZERO COUNTS',
    RED,
    [
      visitX(0) + 0.60,
      NY + (P ? 2.30 : 1.43),
      0,
    ],
    15,
  );

  await until(S(23));
  await play(
    ...picture(...distributionObjects(dist)),
    ...marks(
      zeroFocus,
      zeroCountTag,
    ),
    ...fbox([
      ['A SECOND CLUE', C.amber],
      'How many patients',
      'never visited?',
    ], C.amber),
    ...say('LOOK AT THE ZERO-VISIT PATIENTS', C.amber),
  );

  // ------------------------------------------------------------
  // Expected-zero comparison.
  //
  // Bars are numbers of patients out of ten.
  // Expected numbers may be fractional.
  //
  // Poisson:
  //   P(Y = 0) = exp(-2) ≈ 0.135335
  //   Expected zeros among 10 = 1.35335
  //
  // Negative binomial:
  //   P(Y = 0) = (2 / (2 + 2))² = 0.25
  //   Expected zeros among 10 = 2.5
  // ------------------------------------------------------------

  const ZX0 = CX - (P ? 1.75 : 1.80);
  const ZX1 = CX + (P ? 2.70 : 2.80);

  const ZROWS = P
    ? [-0.30, -2.10, -3.90]
    : [0.62, -0.63, -1.88];

  const zX = v =>
    ZX0 + v / 4 * (ZX1 - ZX0);

  function zeroBar(
    row,
    label,
    value,
    color,
    displayValue,
  ) {
    const y = ZROWS[row];

    const parts = [
      textAt(
        label,
        16,
        color,
        [
          ZX0 - 0.66,
          y,
          0,
        ],
        false,
        1.28,
      ),
    ];

    for (let i = 0; i < 4; i++) {
      const left = zX(i) + 0.025;
      const right = zX(i + 1) - 0.025;

      parts.push(
        rect(
          right - left,
          0.43,
          [(left + right) / 2, y, 0],
          C.muted,
          C.card,
          0.25,
        ),
      );

      const fraction = Math.max(
        0,
        Math.min(1, value - i),
      );

      if (fraction > 0) {
        const width = (right - left) * fraction;

        parts.push(
          block(
            width,
            0.37,
            [
              left + width / 2,
              y,
              0,
            ],
            color,
            0.78,
          ),
        );
      }
    }

    parts.push(
      textAt(
        displayValue,
        20,
        color,
        [
          Math.min(zX(value) + 0.40, ZX1 - 0.10),
          y + 0.39,
          0,
        ],
        true,
      ),
    );

    return new M.VGroup(...parts);
  }

  function zeroScale() {
    const y = P ? -4.75 : -2.57;

    const parts = [];

    for (let i = 0; i <= 4; i++) {
      parts.push(
        textAt(
          String(i),
          15,
          C.muted,
          [zX(i), y, 0],
          true,
        ),
      );
    }

    parts.push(
      textAt(
        'Zero-visit patients out of 10',
        17,
        C.ink,
        [
          CX + 0.20,
          P ? -5.25 : -2.88,
          0,
        ],
      ),
    );

    return new M.VGroup(...parts);
  }

  function zeroHeading() {
    return textAt(
      'How many patients never visit?',
      20,
      C.ink,
      [
        CX,
        P ? 1.15 : 1.40,
        0,
      ],
      false,
      P ? FW - 0.9 : 5.9,
    );
  }

  let poissonZeros = zeroBar(
    0,
    'Poisson',
    N * POISSON_ZERO,
    C.cyan,
    '≈1.4',
  );

  let observedZeros = zeroBar(
    1,
    'Observed',
    OBSERVED_ZEROS,
    TEAL,
    '3',
  );

  // ------------------------------------------------------------
  // 26: Poisson expects approximately 1.4 zero counts out of 10.
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...picture(
      zeroHeading(),
      zeroScale(),
      poissonZeros,
    ),
    ...fbox([
      'Poisson mean = 2',
      ['Chance of 0 ≈ 13.5%', C.cyan],
      '10 × 0.135 ≈ 1.4',
      ['About 1 or 2 people', C.cyan],
    ], C.cyan),
    ...say('POISSON EXPECTS ABOUT 1 OR 2 ZEROS', C.cyan),
  );

  // ------------------------------------------------------------
  // 27: we observed three zero-visit patients.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...addPicture(observedZeros),
    ...fbox([
      ['Expected: about 1.4', C.cyan],
      ['Observed: 3', TEAL],
    ], PINK),
    ...say('WE ACTUALLY SAW THREE', PINK),
  );

  // 26: a small group can differ by chance: a clue, not proof.
  await until(S(26));
  await play(
    ...fbox([
      ['Only 10 patients', C.amber],
      'Chance alone can',
      'move a small group',
      ['Extra spread = a clue', C.amber],
    ], C.amber),
    ...say('A CLUE, NOT A PROOF', C.amber),
  );

  // ------------------------------------------------------------
  // 28: introduce the need for extra dispersion.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...fbox([
      'Keep the mean at 2',
      ['Allow extra spread', C.violet],
      'More flexible counts',
    ], C.violet),
    ...say('WE NEED A MODEL WITH EXTRA SPREAD', C.violet),
  );

  // ------------------------------------------------------------
  // Model probability distributions.
  //
  // These are theoretical probabilities, not additional
  // observed patient counts.
  //
  // Poisson with mean mu:
  //   p(0) = exp(-mu)
  //   p(n) = p(n-1) × mu/n
  //
  // Negative binomial with mean mu and size k:
  //   p(0) = (k/(k+mu))^k
  //   p(n) = p(n-1) × (n-1+k)/n × mu/(k+mu)
  //
  // The final category is 9+, collecting the remaining tail.
  // ------------------------------------------------------------

  function poissonProbabilities(mu) {
    const probs = [Math.exp(-mu)];

    for (let n = 1; n <= 8; n++) {
      probs.push(
        probs[n - 1] * mu / n
      );
    }

    probs.push(
      Math.max(
        0,
        1 - probs.reduce((a, b) => a + b, 0),
      )
    );

    return probs;
  }

  function nbProbabilities(mu, k) {
    const probs = [
      Math.pow(k / (k + mu), k),
    ];

    for (let n = 1; n <= 8; n++) {
      probs.push(
        probs[n - 1] *
        (n - 1 + k) / n *
        mu / (k + mu)
      );
    }

    probs.push(
      Math.max(
        0,
        1 - probs.reduce((a, b) => a + b, 0),
      )
    );

    return probs;
  }

  const PX0 = CX - (P ? 2.80 : 3.02);
  const PX1 = CX + (P ? 2.80 : 3.02);

  const PY0 = P ? -3.80 : -2.05;
  const PY1 = P ? 0.68 : 1.07;

  const PROB_MAX = 0.32;

  const PROB_STEP = (PX1 - PX0) / 10;

  const probX = n =>
    PX0 + (n + 0.5) * PROB_STEP;

  const probY = p =>
    PY0 + p / PROB_MAX * (PY1 - PY0);

  function probabilityAxes() {
    const parts = [];

    [0, 0.10, 0.20, 0.30].forEach(v => {
      const y = probY(v);

      parts.push(
        line(
          [PX0, y, 0],
          [PX1, y, 0],
          C.muted,
          0.65,
        ),
      );

      const label = T(
        `${Math.round(v * 100)}%`,
        14,
        C.muted,
        true,
      );

      label.moveTo([
        PX0 - 0.12 - label.getWidth() / 2,
        y,
        0,
      ]);

      parts.push(label);
    });

    for (let n = 0; n <= 9; n++) {
      parts.push(
        textAt(
          n === 9 ? '9+' : String(n),
          15,
          C.muted,
          [
            probX(n),
            PY0 - 0.24,
            0,
          ],
          true,
        ),
      );
    }

    parts.push(
      line(
        [PX0, PY0, 0],
        [PX1 + 0.08, PY0, 0],
        C.muted,
        2.1,
      ),
      line(
        [PX0, PY0, 0],
        [PX0, PY1, 0],
        C.muted,
        2.1,
      ),
      textAt(
        'Visit count',
        17,
        C.ink,
        [
          CX,
          PY0 - 0.64,
          0,
        ],
      ),
      textAt(
        'Model probability',
        17,
        C.ink,
        [
          CX,
          PY1 + 0.30,
          0,
        ],
      ),
    );

    return new M.VGroup(...parts);
  }

  function probabilityBars(
    probabilities,
    color,
    side,
  ) {
    const width = PROB_STEP * 0.34;

    return new M.VGroup(
      ...probabilities.map((v, n) => {
        const h = Math.max(
          0.001,
          probY(v) - PY0,
        );

        const x = probX(n) +
          side * PROB_STEP * 0.19;

        return block(
          width,
          h,
          [
            x,
            PY0 + h / 2,
            0,
          ],
          color,
          0.78,
        );
      }),
    );
  }

  function probabilityLegend() {
    const y = P ? -4.91 : -2.91;

    return new M.VGroup(
      block(
        0.19,
        0.19,
        [CX - 2.22, y, 0],
        C.cyan,
      ),
      textAt(
        'Poisson',
        15,
        C.cyan,
        [CX - 1.48, y, 0],
      ),
      block(
        0.19,
        0.19,
        [CX - 0.18, y, 0],
        C.violet,
      ),
      textAt(
        'Negative binomial',
        15,
        C.violet,
        [CX + 1.24, y, 0],
      ),
    );
  }

  function distributionModels(k = 2) {
    return {
      axes: probabilityAxes(),

      poisson: probabilityBars(
        poissonProbabilities(MEAN),
        C.cyan,
        -1,
      ),

      negativeBinomial: probabilityBars(
        nbProbabilities(MEAN, k),
        C.violet,
        1,
      ),

      legend: probabilityLegend(),
    };
  }

  let models = distributionModels(2);

  // ------------------------------------------------------------
  // 29: introduce the negative binomial model.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...picture(
      models.axes,
      models.poisson,
      models.negativeBinomial,
      models.legend,
    ),
    ...fbox([
      ['NEGATIVE BINOMIAL', C.violet],
      'Another count model',
      ['With an extra-spread', C.violet],
      ['setting', C.violet],
    ], C.violet),
    ...say('NEGATIVE BINOMIAL: MORE FLEXIBLE COUNTS', C.violet),
  );

  // ------------------------------------------------------------
  // 30: the extra setting lets variance exceed the mean.
  // ------------------------------------------------------------

  function variancePartsPicture(k, reveal = 3) {
    const mu = MEAN;
    const extra = mu * mu / k;
    const variance = mu + extra;

    const maxValue = 6.2;

    const x0 = CX - 2.45;
    const x1 = CX + 2.45;

    const unit = (x1 - x0) / maxValue;

    const y = P ? -1.40 : -0.35;

    const h = P ? 0.60 : 0.50;

    const parts = [
      textAt(
        'Build the variance',
        22,
        C.ink,
        [
          CX,
          P ? 0.90 : 1.14,
          0,
        ],
      ),
    ];

    if (reveal >= 1) {
      parts.push(
        block(
          mu * unit,
          h,
          [
            x0 + mu * unit / 2,
            y,
            0,
          ],
          C.cyan,
        ),
        textAt(
          `Mean ${mu}`,
          17,
          C.cyan,
          [
            x0 + mu * unit / 2,
            y - 0.50,
            0,
          ],
          true,
        ),
      );
    }

    if (reveal >= 2) {
      parts.push(
        block(
          extra * unit,
          h,
          [
            x0 + mu * unit + extra * unit / 2,
            y,
            0,
          ],
          C.violet,
        ),
        textAt(
          `Extra ${Number(extra.toFixed(2))}`,
          17,
          C.violet,
          [
            x0 + mu * unit + extra * unit / 2,
            y - 0.50,
            0,
          ],
          true,
        ),
      );
    }

    if (reveal >= 3) {
      const endX = x0 + variance * unit;

      parts.push(
        line(
          [x0, y + 0.52, 0],
          [endX, y + 0.52, 0],
          C.green,
          2,
        ),
        line(
          [x0, y + 0.43, 0],
          [x0, y + 0.60, 0],
          C.green,
          2,
        ),
        line(
          [endX, y + 0.43, 0],
          [endX, y + 0.60, 0],
          C.green,
          2,
        ),
        textAt(
          `Variance = ${Number(variance.toFixed(2))}`,
          21,
          C.green,
          [
            (x0 + endX) / 2,
            y + 0.88,
            0,
          ],
          true,
        ),
      );
    }

    parts.push(
      tagAt(
        `k = ${k}`,
        C.amber,
        [
          CX,
          P ? -3.10 : -2.00,
          0,
        ],
        18,
      ),
    );

    return new M.VGroup(...parts);
  }

  // 29: variance = mean + extra, the setting is called k.
  await until(S(29));
  await play(
    ...fbox([
      ['Poisson', C.cyan],
      'variance = mean',
      ['Negative binomial', C.violet],
      'variance = mean + extra',
      ['Setting: k', C.amber],
    ], C.violet),
    ...say('MEAN + EXTRA · SETTING k', C.violet),
  );

  // ------------------------------------------------------------
  // 33: smaller k means larger extra variance.
  //
  // With mean fixed at 2:
  //   k = 4 → extra = 1
  //   k = 2 → extra = 2
  //   k = 1 → extra = 4
  //
  // All three are theoretical model settings.
  // ------------------------------------------------------------

  function kComparison() {
    const settings = [4, 2, 1];

    const ys = P
      ? [0.15, -1.28, -2.71]
      : [0.62, -0.70, -2.02];

    const x0 = CX - 1.70;
    const width = P ? 4.30 : 4.45;

    const parts = [];

    parts.push(
      textAt(
        'Same mean, different k',
        20,
        C.ink,
        [
          CX,
          P ? 1.25 : 1.40,
          0,
        ],
      ),
    );

    settings.forEach((k, i) => {
      const extra = MEAN * MEAN / k;

      const y = ys[i];
      const barWidth = width * extra / 4;

      parts.push(
        textAt(
          `k = ${k}`,
          18,
          C.amber,
          [
            x0 - 0.75,
            y,
            0,
          ],
          true,
        ),
        block(
          barWidth,
          0.34,
          [
            x0 + barWidth / 2,
            y,
            0,
          ],
          C.violet,
        ),
        textAt(
          `Extra ${extra}`,
          16,
          C.violet,
          [
            x0 + barWidth / 2,
            y + 0.35,
            0,
          ],
          true,
        ),
      );
    });

    return new M.VGroup(...parts);
  }

  const kPicture = kComparison();

  await until(S(30));
  await play(
    ...picture(kPicture),
    ...fbox([
      'Mean² stays at 4',
      '4 ÷ 4 = 1',
      '4 ÷ 2 = 2',
      ['4 ÷ 1 = 4', C.violet],
    ], C.violet),
    ...say('SMALLER k → MORE EXTRA VARIANCE', C.violet),
  );

  // ------------------------------------------------------------
  // 31-37: tune k until the model variance reaches the measured 4.
  //
  // Top: a variance bar (mean part cyan + extra part violet)
  // against a dashed target at the measured variance 4.
  // Bottom: a graph of the gap (measured 4 minus model variance):
  //   no extra -> variance 2, gap 2
  //   k = 4    -> 2 + 4 ÷ 4 = 3, gap 1
  //   k = 2    -> 2 + 4 ÷ 2 = 4, gap 0
  // ------------------------------------------------------------

  const TB_X0 = CX - (P ? 2.90 : 2.70);
  const TB_U = P ? 1.05 : 1.00;
  const TB_Y = P ? 0.55 : 0.78;
  const TB_H = P ? 0.50 : 0.40;

  const tbX = v => TB_X0 + v * TB_U;

  function tuneBar(extra, title) {
    const variance = MEAN + extra;
    const ew = Math.max(0.03, extra * TB_U);

    const parts = [
      block(MEAN * TB_U, TB_H, [tbX(MEAN / 2), TB_Y, 0], C.cyan),
      block(ew, TB_H, [tbX(MEAN) + ew / 2, TB_Y, 0], C.violet),
    ];

    const head = T(title, 19, C.ink, true);
    head.moveTo([TB_X0 + head.getWidth() / 2, TB_Y + 0.55, 0]);
    parts.push(head);

    parts.push(
      textAt('mean 2', 17, C.cyan, [tbX(1), TB_Y - 0.48, 0], true),
    );

    parts.push(
      textAt(
        `extra ${extra}`,
        17,
        C.violet,
        [Math.max(tbX(MEAN + extra / 2), tbX(MEAN) + 0.62), TB_Y - 0.48, 0],
        true,
      ),
    );

    const gap = SAMPLE_VARIANCE - variance;

    if (gap > 0) {
      parts.push(
        line([tbX(variance), TB_Y, 0], [tbX(SAMPLE_VARIANCE), TB_Y, 0], PINK, 3),
        textAt(
          `gap ${gap}`,
          17,
          PINK,
          [tbX((variance + SAMPLE_VARIANCE) / 2), TB_Y + 0.20, 0],
          true,
        ),
      );
    }

    return new M.VGroup(...parts);
  }

  function tuneTarget() {
    const x = tbX(SAMPLE_VARIANCE);

    return new M.VGroup(
      dash([x, TB_Y - 0.36, 0], [x, TB_Y + 0.36, 0], PINK),
      textAt('measured 4', 17, PINK, [x + (P ? 0.15 : 0.35), TB_Y + 0.55, 0], true),
    );
  }

  // gap graph
  const GG_Y0 = P ? -5.10 : -3.10;
  const GG_U = P ? 1.50 : 1.02;
  const GG_XL = CX - (P ? 2.75 : 2.70);
  const GG_XR = CX + (P ? 3.10 : 2.95);
  const GG_TRY = P
    ? [CX - 1.55, CX + 0.30, CX + 2.15]
    : [CX - 1.45, CX + 0.30, CX + 2.05];
  const GAPS = [2, 1, 0];
  const TRY_NAMES = ['no extra', 'k = 4', 'k = 2'];

  const ggY = g => GG_Y0 + g * GG_U;
  const ggP = i => [GG_TRY[i], ggY(GAPS[i]), 0];

  function gapAxes() {
    const parts = [
      line([GG_XL, GG_Y0, 0], [GG_XR, GG_Y0, 0], C.muted, 2.1),
      line([GG_XL, GG_Y0, 0], [GG_XL, ggY(2.35), 0], C.muted, 2.1),
    ];

    [0, 1, 2].forEach(g => {
      if (g > 0) {
        parts.push(line([GG_XL, ggY(g), 0], [GG_XR, ggY(g), 0], C.grid, 0.8));
      }
      parts.push(textAt(String(g), 17, C.muted, [GG_XL - 0.24, ggY(g), 0], true));
    });

    TRY_NAMES.forEach((s, i) => {
      parts.push(textAt(s, 17, C.amber, [GG_TRY[i], GG_Y0 - 0.30, 0], true));
    });

    parts.push(
      textAt('Gap to measured variance', 18, C.ink, [CX, ggY(2.35) + 0.30, 0]),
      textAt('Try', 17, C.ink, [CX, GG_Y0 - 0.70, 0]),
    );

    return new M.VGroup(...parts);
  }

  function gapPoint(i, color = PINK) {
    const p = ggP(i);

    return new M.VGroup(
      glow(p, color, 0.11),
      textAt(String(GAPS[i]), 20, color, [p[0] + 0.30, p[1] + 0.28, 0], true),
    );
  }

  function gapLink(i) {
    return line(ggP(i - 1), ggP(i), PINK, 3);
  }

  const tuneHead = textAt(
    'Tune k to fit the measured variance',
    19,
    C.ink,
    [CX, P ? 1.55 : 1.42, 0],
    false,
    P ? FW - 0.9 : 6.2,
  );

  let tuneNow = tuneBar(0, 'no extra: variance 2');

  function swapTune(next) {
    const old = tuneNow;
    pictureNow = pictureNow.filter(o => o !== old);
    pictureNow.push(next);
    tuneNow = next;
    return [new M.FadeOut(old, { runTime: 0.35 }), new M.FadeIn(next, { runTime: 0.45 })];
  }

  // 31: start with no extra variance: 2, gap 2.
  await until(S(31));
  await play(
    ...picture(
      P ? tuneHead : null,
      tuneTarget(),
      tuneNow,
      gapAxes(),
      gapPoint(0),
    ),
    ...fbox([
      ['No extra variance', C.cyan],
      'variance = 2',
      ['4 − 2 = gap 2', PINK],
    ], PINK),
    ...say('START AT 2 · GAP OF 2', PINK),
  );

  // 32: k = 4 -> extra 1 -> variance 3.
  await until(S(32));
  {
    const next = tuneBar(1, 'k = 4: variance 3');
    await play(
      ...swapTune(next),
      ...addPicture(gapLink(1), gapPoint(1)),
      ...fbox([
        ['k = 4', C.amber],
        'extra = 4 ÷ 4 = 1',
        ['2 + 1 = 3', C.green],
      ], C.amber),
      ...say('k = 4 → VARIANCE 3', C.amber),
    );
  }

  // 33: gap is now 1; halve k to 2.
  const gapOneRing = ring(ggP(1), 0.26, C.amber, 3);

  await until(S(33));
  await play(
    ...marks(gapOneRing),
    ...fbox([
      ['Gap is now 1', PINK],
      'Cut k in half',
      ['k: 4 → 2', C.amber],
    ], C.amber),
    ...say('GAP 1 · TRY k = 2', C.amber),
  );

  // 34: square the mean: 2 × 2 = 4 (four tiles).
  function meanSquaredTiles() {
    const p = [
      P ? CX + 2.55 : CX + 2.75,
      TB_Y,
      0,
    ];

    const size = P ? 0.30 : 0.24;
    const parts = [];

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        parts.push(
          block(
            size * 0.88,
            size * 0.88,
            [
              p[0] + (col - 0.5) * size,
              p[1] + (row - 0.5) * size,
              0,
            ],
            C.violet,
          ),
        );
      }
    }

    parts.push(
      textAt('2 × 2 = 4', 17, C.violet, [p[0], p[1] - size - 0.25, 0], true),
    );

    return new M.VGroup(...parts);
  }

  await until(S(34));
  await play(
    ...marks(meanSquaredTiles()),
    ...fbox([
      ['STEP 1', C.violet],
      'Square the mean',
      ['2 × 2 = 4', C.violet],
    ], C.violet),
    ...say('SQUARE THE MEAN: 2 × 2 = 4', C.violet),
  );

  // 35: divide by k = 2 -> extra 2.
  await until(S(35));
  {
    const next = tuneBar(2, 'k = 2: extra 2');
    await play(
      ...marks(),
      ...swapTune(next),
      ...fbox([
        ['STEP 2', C.amber],
        'mean² ÷ k',
        '4 ÷ 2',
        ['= 2 extra', C.violet],
      ], C.violet),
      ...say('4 ÷ 2 = 2 EXTRA', C.violet),
    );
  }

  // 36: 2 + 2 = 4, the model variance.
  const fitRing = ring([tbX(SAMPLE_VARIANCE), TB_Y, 0], 0.30, C.green, 3);

  await until(S(36));
  {
    const next = tuneBar(2, 'k = 2: variance 4');
    await play(
      ...swapTune(next),
      ...marks(fitRing),
      ...fbox([
        ['STEP 3', C.green],
        ['mean:  2', C.cyan],
        ['extra: 2', C.violet],
        ['2 + 2 = 4', C.green],
      ], C.green),
      ...say('VARIANCE 4 · SAME AS MEASURED', C.green),
    );
  }

  // 37: the gap reaches zero; the gap graph stops falling.
  const flatEnd = dash(
    ggP(2),
    [GG_XR - 0.05, ggY(0), 0],
    C.green,
  );

  const stopTag = tagAt(
    'GAP = 0',
    C.green,
    [GG_TRY[2] - (P ? 0.35 : 0.10), ggY(0.75), 0],
    17,
  );

  await until(S(37));
  await play(
    ...addPicture(gapLink(2), gapPoint(2, C.green), flatEnd),
    ...marks(fitRing, stopTag),
    ...fbox([
      ['Gap: 2 → 1 → 0', PINK],
      'No more gap',
      ['k = 2 fits', C.green],
    ], C.green),
    ...say('GAP 0 · THE GRAPH STOPS FALLING', C.green),
  );

  // ------------------------------------------------------------
  // 38: negative binomial also predicts more zero counts.
  //
  // Poisson expected zeros: 1.353...
  // Negative binomial expected zeros: 2.5
  // Observed zeros: 3
  // ------------------------------------------------------------

  poissonZeros = zeroBar(
    0,
    'Poisson',
    N * POISSON_ZERO,
    C.cyan,
    '≈1.4',
  );

  observedZeros = zeroBar(
    1,
    'Observed',
    OBSERVED_ZEROS,
    TEAL,
    '3',
  );

  const nbZeros = zeroBar(
    2,
    'Neg. bin.',
    N * NB_ZERO,
    C.violet,
    '2.5',
  );

  await until(S(38));
  await play(
    ...picture(
      zeroHeading(),
      zeroScale(),
      poissonZeros,
      observedZeros,
      nbZeros,
    ),
    ...fbox([
      ['Poisson: about 1.4', C.cyan],
      ['Observed: 3', TEAL],
      ['Neg. binomial: 2.5', C.violet],
      'Closer to our data',
    ], C.violet),
    ...say('NEGATIVE BINOMIAL EXPECTS 2 OR 3 ZEROS', C.violet),
  );

  // ------------------------------------------------------------
  // 39: same mean, wider spread.
  //
  // The models have the same theoretical mean of two.
  // Negative binomial shifts probability toward zero and the
  // right tail compared with Poisson.
  // ------------------------------------------------------------

  models = distributionModels(2);

  const sharedMeanGuide = dash(
    [
      probX(2),
      PY0 - 0.05,
      0,
    ],
    [
      probX(2),
      PY1 - 0.03,
      0,
    ],
    C.amber,
  );

  const sharedMeanTag = tagAt(
    'BOTH MEAN = 2',
    C.amber,
    [
      probX(2) + 0.45,
      PY1 - 0.16,
      0,
    ],
    14,
  );

  await until(S(39));
  await play(
    ...picture(
      models.axes,
      models.poisson,
      models.negativeBinomial,
      models.legend,
      sharedMeanGuide,
      sharedMeanTag,
    ),
    ...fbox([
      ['Same mean: 2', C.amber],
      ['Poisson variance: 2', C.cyan],
      ['Neg. bin. variance: 4', C.violet],
      'Wider distribution',
    ], C.violet),
    ...say('SAME AVERAGE, MORE SPREAD', C.violet),
  );

  // ------------------------------------------------------------
  // 40-41: the short rule, next to the k = 2 variance bar.
  //   variance = mean + mean² ÷ k ;  2 + 4 ÷ 2 = 4
  // ------------------------------------------------------------

  function ruleRow(pieces, size, y, maxW) {
    const texts = pieces.map(([s, c]) => T(s, size, c, true));
    const gap = 0.16;
    const total = texts.reduce((a, t) => a + t.getWidth(), 0) + gap * (texts.length - 1);
    const k = Math.min(1, maxW / total);
    let x = CX - total * k / 2;

    texts.forEach(t => {
      if (k < 1) t.scale(k);
      const w = t.getWidth() * k;
      t.moveTo([x + w / 2, y, 0]);
      x += w + gap * k;
    });

    return texts;
  }

  const RULE_Y = P ? -3.30 : -1.20;
  const RULE_W = P ? FW - 1.0 : 5.9;
  const RULE_H = P ? 3.70 : 1.85;

  const ruleCard = rect(RULE_W + 0.3, RULE_H, [CX, RULE_Y, 0], C.violet);

  const ruleTitle = textAt('THE SHORT RULE', 18, C.violet, [CX, RULE_Y + RULE_H / 2 - 0.32, 0], true);

  const ruleLine = P
    ? [
      ...ruleRow([
        ['variance', C.green],
        ['=', C.ink],
        ['mean', C.cyan],
      ], 28, RULE_Y + 0.75, RULE_W - 0.3),
      ...ruleRow([
        ['+', C.ink],
        ['mean² ÷ k', C.violet],
      ], 28, RULE_Y - 0.05, RULE_W - 0.3),
    ]
    : ruleRow([
      ['variance', C.green],
      ['=', C.ink],
      ['mean', C.cyan],
      ['+', C.ink],
      ['mean² ÷ k', C.violet],
    ], 24, RULE_Y + 0.02, RULE_W - 0.3);

  const ruleNumbers = ruleRow([
    ['4', C.green],
    ['=', C.ink],
    ['2', C.cyan],
    ['+', C.ink],
    ['4 ÷ 2', C.violet],
  ], P ? 28 : 24, RULE_Y - RULE_H / 2 + (P ? 0.60 : 0.40), RULE_W - 0.3);

  const ruleHead = textAt(
    'Negative binomial, mean 2, k = 2',
    19,
    C.ink,
    [CX, P ? 1.55 : 1.42, 0],
    false,
    P ? FW - 0.9 : 6.2,
  );

  await until(S(40));
  await play(
    ...picture(
      P ? ruleHead : null,
      tuneTarget(),
      tuneBar(2, 'k = 2: variance 4'),
      ruleCard,
      ruleTitle,
      ...ruleLine,
    ),
    ...fbox([
      ['THE SHORT RULE', C.violet],
      'for the',
      'negative binomial',
    ], C.violet),
    ...say('HERE IS THE SHORT RULE', C.violet),
  );

  await until(S(41));
  await play(
    ...addPicture(...ruleNumbers),
    ...fbox([
      ['variance =', C.green],
      ['  mean', C.cyan],
      ['  + mean² ÷ k', C.violet],
      ['2 + 4 ÷ 2 = 4', C.green],
    ], C.violet),
    ...say('VARIANCE = MEAN + MEAN SQUARED ÷ k', C.violet),
  );

  // ------------------------------------------------------------
  // 42: when to use it: measured spread above the Poisson value.
  // ------------------------------------------------------------

  const checkMeanBar = varianceBar(0, 'Mean', MEAN, C.amber);
  const checkPoissonBar = varianceBar(1, 'Poisson var.', POISSON_VARIANCE, C.cyan);
  const checkObservedBar = varianceBar(2, 'Sample var.', SAMPLE_VARIANCE, PINK);

  const checkHeading = textAt(
    'When to use it',
    21,
    C.ink,
    [CX, P ? 1.20 : 1.38, 0],
  );

  const moreTag = tagAt(
    'MORE THAN POISSON',
    PINK,
    [(valueX(2) + valueX(4)) / 2, VROWS[2] + (P ? 0.55 : 0.45), 0],
    15,
  );

  await until(S(42));
  await play(
    ...picture(
      checkHeading,
      varianceScale(),
      checkMeanBar,
      checkPoissonBar,
      checkObservedBar,
    ),
    ...marks(moreTag),
    ...fbox([
      ['WHEN TO USE IT', C.amber],
      'Counts spread more',
      'than Poisson allows',
      ['→ negative binomial', C.violet],
    ], C.amber),
    ...say('USE IT WHEN COUNTS SPREAD MORE', C.amber),
  );

  // ------------------------------------------------------------
  // 43-45: uncertainty of a fitted effect (schematic picture).
  // Narrow interval = extra spread ignored; wider interval =
  // extra spread allowed, about √2 ≈ 1.41 times wider (chapter sheet).
  // ------------------------------------------------------------

  const UX0 = CX - (P ? 2.65 : 2.90);
  const UX1 = CX + (P ? 2.65 : 2.90);

  const UZERO = UX0 + (UX1 - UX0) * 0.22;
  const UEST = UX0 + (UX1 - UX0) * 0.56;

  const UROWS = P
    ? [-0.30, -2.55]
    : [0.48, -1.05];

  const UAXIS_Y = P ? -4.55 : -2.20;

  const NARROW = P ? 0.80 : 0.85;
  const WIDE = NARROW * Math.SQRT2;

  function uncertaintyAxes() {
    return new M.VGroup(
      line([UX0, UAXIS_Y, 0], [UX1, UAXIS_Y, 0], C.muted, 2.2),
      dash([UZERO, UAXIS_Y, 0], [UZERO, P ? 1.00 : 1.15, 0], C.muted),
      dash([UEST, UAXIS_Y, 0], [UEST, P ? 1.00 : 1.15, 0], C.amber),
      textAt('0', 19, C.muted, [UZERO, UAXIS_Y - 0.27, 0], true),
      textAt('Fitted effect', 17, C.amber, [UEST, UAXIS_Y - 0.27, 0]),
      textAt(
        'How sure are we about a fitted effect?',
        19,
        C.ink,
        [CX, P ? 1.40 : 1.50, 0],
        false,
        P ? FW - 0.9 : 6.2,
      ),
      textAt('Schematic picture', 15, C.muted, [CX, UAXIS_Y - 0.70, 0]),
    );
  }

  function uncertaintyInterval(row, halfWidth, color, label) {
    const y = UROWS[row];
    const a = UEST - halfWidth;
    const b = UEST + halfWidth;

    return new M.VGroup(
      line([a, y, 0], [b, y, 0], color, 5),
      line([a, y - 0.14, 0], [a, y + 0.14, 0], color, 2.5),
      line([b, y - 0.14, 0], [b, y + 0.14, 0], color, 2.5),
      glow([UEST, y, 0], C.amber, 0.11),
      tagAt(label, color, [CX, y + 0.48, 0], 15),
    );
  }

  const narrowInterval = uncertaintyInterval(0, NARROW, C.cyan, 'IGNORING EXTRA SPREAD');
  const widerInterval = uncertaintyInterval(1, WIDE, C.violet, 'ALLOWING EXTRA SPREAD');

  // 43: the trap: reporting certainty while ignoring extra spread.
  await until(S(43));
  await play(
    ...picture(
      uncertaintyAxes(),
      narrowInterval,
    ),
    ...fbox([
      ['THE TRAP', PINK],
      'Ignore the extra spread',
      'when you report',
      'how sure you are',
    ], PINK),
    ...say('TRAP: IGNORING THE EXTRA SPREAD', PINK),
  );

  // 44: standard error = how much an estimate moves with new records.
  const wobbleValues = [-1.08, -0.72, -0.38, 0.06, 0.34, 0.70, 1.05].map(v => v * WIDE / 1.12);
  const wobbleY = UROWS[1];

  const wobbleSet = () => wobbleValues.map(v =>
    dot([UEST + v, wobbleY, 0], C.ink, P ? 0.085 : 0.075)
  );

  const wobbleDots = wobbleSet();

  const wobbleLabel = tagAt(
    'ESTIMATES FROM NEW RECORDS',
    C.ink,
    [CX, wobbleY + 0.48, 0],
    15,
  );

  await until(S(44));

  marksNow = [...wobbleDots, wobbleLabel];

  await play(
    new M.LaggedStart(
      wobbleDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.16, runTime: 1.40 },
    ),
    new M.FadeIn(wobbleLabel),
    ...fbox([
      ['STANDARD ERROR', C.violet],
      'How much an estimate',
      'may change if we',
      'collect new records',
    ], C.violet),
    ...say('NEW RECORDS → THE ESTIMATE MOVES', C.violet),
  );

  // 45: missing the extra spread -> standard errors too small.
  const tooSmallTag = tagAt(
    'TOO SMALL',
    PINK,
    [UEST + NARROW + (P ? 0.20 : 0.95), UROWS[0] + (P ? -0.42 : 0), 0],
    15,
  );

  const widerTag = tagAt(
    '≈ 1.41 × WIDER',
    C.violet,
    [CX, UROWS[1] - 0.50, 0],
    15,
  );

  await until(S(45));
  await play(
    ...addPicture(widerInterval, ...wobbleSet()),
    ...marks(tooSmallTag, widerTag),
    ...fbox([
      ['Extra spread missed', PINK],
      ['→ standard errors', PINK],
      ['   too small', PINK],
      'Here about √2 ≈ 1.41',
      'times too small',
    ], PINK),
    ...say('STANDARD ERRORS CAN BE TOO SMALL', PINK),
  );

  // ------------------------------------------------------------
  // 46: final recap: same mean 2, Poisson variance 2,
  // negative binomial (k = 2) variance 4.
  // ------------------------------------------------------------

  models = distributionModels(K);

  const finalMeanLine = dash(
    [probX(2), PY0 - 0.04, 0],
    [probX(2), PY1 - 0.04, 0],
    C.amber,
  );

  const finalMeanTag = tagAt(
    'SAME MEAN = 2',
    C.amber,
    [probX(2) + 0.48, PY1 - 0.16, 0],
    15,
  );

  await until(S(46));
  await play(
    ...picture(
      models.axes,
      models.poisson,
      models.negativeBinomial,
      models.legend,
      finalMeanLine,
      finalMeanTag,
    ),
    ...fbox([
      ['NEGATIVE BINOMIAL', C.violet],
      'Predicts the mean',
      ['and allows extra', C.green],
      ['spread around it', C.green],
    ], C.violet),
    ...say('MEAN + EXTRA SPREAD: NEGATIVE BINOMIAL', C.violet),
  );
}

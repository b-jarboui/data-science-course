// lesson 9.1.2
// Dot products: turn apartment measurements into one preference score.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved engine contract; browser runtime verification is pending.
// Try it beats introduce the separate interactive exercise.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const B = DATA[1];

  const WA = 2;
  const WG = -1;

  const score = d => d.area * WA + d.age * WG;

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const RENT = C.amber;
  const POS = C.green;
  const NEG = AGE;
  const GRID = '#293548';

  const signed = n => n < 0 ? `−${Math.abs(n)}` : String(n);

  const dollars = n => '$' + String(n).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  );

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22
  // Safe content: -5.5 <= y <= 4.3
  //
  // Laptop: 14.22 x 8
  // Safe content: -3.0 <= y <= 2.3
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.35;

  const PILL = P
    ? [0, 4.02, 0]
    : [0, 2.03, 0];

  const CARD_Y = P ? 2.72 : 0.96;
  const CARD_W = P ? 6.0 : 5.75;
  const CARD_H = P ? 1.58 : 1.50;

  const AX = CX - 1.38;
  const GX = CX + 1.38;

  const WEIGHT_Y = P ? 1.38 : -0.15;

  const WORK_X = P ? 1.02 : CX;

  const AREA_Y = P ? -0.10 : -1.25;
  const AGE_Y = P ? -2.00 : -2.30;

  const LEDGER_X = P ? -2.65 : 1.25;
  const LEDGER_ZERO = P ? -5.00 : -1.73;
  const LEDGER_STEP = P ? 0.36 : 0.235;

  let BOXP = P
    ? [1.0, -3.95, 0]
    : [4.48, -0.68, 0];

  let BOX_MAX = P ? 4.15 : 4.25;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Common helpers
  // ------------------------------------------------------------

  function textAt(s, size, color, p, mono = false, maxw = null) {
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

  function outline(p, w, h, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function lineBetween(start, end, color, strokeWidth = 2) {
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

  function tagAt(s, color, p, size = 17, maxw = null) {
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

  function reveal(objects, duration = 1.2, lag = 0.15) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      {
        lagRatio: lag,
        runTime: duration
      }
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // All components are grouped before being shown.
  // The formula box appears after the visual calculation.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 21;
    const lh = P ? 0.35 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(s, size, c, true);

      if (t.getWidth() > BOX_MAX - 0.55) {
        t.scale((BOX_MAX - 0.55) / t.getWidth());
      }

      return t;
    });

    const wd = Math.min(
      BOX_MAX,
      Math.max(...texts.map(t => t.getWidth())) + 0.55
    );

    const ht = rows.length * lh + 0.24;

    const r = rectAt(
      BOXP,
      wd,
      ht,
      color,
      C.card,
      0.97
    );

    const left = BOXP[0] - wd / 2 + 0.275;
    const top = BOXP[1] + ht / 2 - 0.12 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Opening picture: roominess and building age
  // ------------------------------------------------------------

  const INTRO_Y = P ? 0.75 : -0.10;
  const INTRO_X = P ? 1.85 : 3.05;

  function floorPlan(x, y) {
    const parts = [];

    const frame = rectAt(
      [x, y, 0],
      2.75,
      1.85,
      AREA,
      C.card,
      0.95
    );

    parts.push(frame);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const r = new M.Rectangle({
          width: 0.66,
          height: 0.60,
          color: AREA,
          strokeWidth: 1.5
        });

        r.setFill(AREA, 0.38);

        r.moveTo([
          x + (col - 1) * 0.73,
          y + (0.5 - row) * 0.67,
          0
        ]);

        parts.push(r);
      }
    }

    parts.push(
      textAt(
        'MORE SPACE',
        21,
        AREA,
        [x, y - 1.22, 0],
        true,
        2.75
      )
    );

    return new M.VGroup(...parts);
  }

  function newerBuilding(x, y) {
    const parts = [];

    const frame = rectAt(
      [x, y, 0],
      2.75,
      1.85,
      AGE,
      C.card,
      0.95
    );

    parts.push(frame);

    const clock = new M.Circle({
      radius: 0.64,
      color: AGE,
      strokeWidth: 3
    });

    clock.setFill(AGE, 0.08);
    clock.moveTo([x, y, 0]);

    parts.push(clock);

    parts.push(
      lineBetween(
        [x, y, 0],
        [x, y + 0.43, 0],
        AGE,
        3
      ),
      lineBetween(
        [x, y, 0],
        [x + 0.30, y - 0.12, 0],
        AGE,
        3
      ),
      dotAt([x, y, 0], AGE, 0.06)
    );

    parts.push(
      textAt(
        'FEWER YEARS',
        21,
        AGE,
        [x, y - 1.22, 0],
        true,
        2.75
      )
    );

    return new M.VGroup(...parts);
  }

  const introArea = floorPlan(-INTRO_X, INTRO_Y);
  const introAge = newerBuilding(INTRO_X, INTRO_Y);

  const introQuestion = tagAt(
    'ONE SCORE?',
    C.amber,
    [0, P ? -1.45 : -2.10, 0],
    23
  );

  // ------------------------------------------------------------
  // Apartment B's listing card
  //
  // Rent stays on the card, but it is not part of this score.
  // ------------------------------------------------------------

  const cardFrame = rectAt(
    [CX, CARD_Y, 0],
    CARD_W,
    CARD_H,
    C.muted,
    C.card,
    0.97
  );

  const cardTitle = textAt(
    'APARTMENT B',
    P ? 22 : 23,
    C.ink,
    [CX - 1.45, CARD_Y + 0.47, 0],
    true,
    2.65
  );

  const cardRent = textAt(
    `${dollars(B.rent)} / month`,
    P ? 17 : 18,
    RENT,
    [CX + 1.36, CARD_Y + 0.47, 0],
    true,
    2.65
  );

  const cardDivider = lineBetween(
    [CX - CARD_W / 2 + 0.20, CARD_Y + 0.20, 0],
    [CX + CARD_W / 2 - 0.20, CARD_Y + 0.20, 0],
    C.muted,
    1
  );

  const featureDivider = lineBetween(
    [CX, CARD_Y + 0.11, 0],
    [CX, CARD_Y - 0.62, 0],
    GRID,
    1.5
  );

  const cardAreaLabel = textAt(
    'AREA CHUNKS',
    16,
    AREA,
    [AX, CARD_Y - 0.02, 0],
    true
  );

  const cardAgeLabel = textAt(
    'AGE (YEARS)',
    16,
    AGE,
    [GX, CARD_Y - 0.02, 0],
    true
  );

  const cardArea = textAt(
    String(B.area),
    31,
    AREA,
    [AX, CARD_Y - 0.43, 0],
    true
  );

  const cardAge = textAt(
    String(B.age),
    31,
    AGE,
    [GX, CARD_Y - 0.43, 0],
    true
  );

  const cardShell = [
    cardFrame,
    cardTitle,
    cardRent,
    cardDivider,
    featureDivider
  ];

  const cardMeasurements = [
    cardAreaLabel,
    cardAgeLabel,
    cardArea,
    cardAge
  ];

  const cardParts = [
    ...cardShell,
    ...cardMeasurements
  ];

  // ------------------------------------------------------------
  // Area unit illustration
  // ------------------------------------------------------------

  const unitY = P ? 0.84 : -0.60;

  const unitBlock = new M.Rectangle({
    width: 0.62,
    height: 0.62,
    color: AREA,
    strokeWidth: 2
  });

  unitBlock.setFill(AREA, 0.62);
  unitBlock.moveTo([CX - 1.20, unitY, 0]);

  const unitLabel = textAt(
    '= 10 m²',
    23,
    AREA,
    [CX + 0.35, unitY, 0],
    true
  );

  const unitPicture = new M.VGroup(
    unitBlock,
    unitLabel
  );

  // ------------------------------------------------------------
  // Weight instructions
  // ------------------------------------------------------------

  const weightArea = tagAt(
    '+2 per chunk',
    AREA,
    [AX, WEIGHT_Y, 0],
    19,
    2.55
  );

  const weightAge = tagAt(
    '−1 per year',
    AGE,
    [GX, WEIGHT_Y, 0],
    19,
    2.55
  );

  const areaConnector = lineBetween(
    [AX, CARD_Y - CARD_H / 2, 0],
    [AX, WEIGHT_Y + 0.22, 0],
    AREA,
    2
  );

  const ageConnector = lineBetween(
    [GX, CARD_Y - CARD_H / 2, 0],
    [GX, WEIGHT_Y + 0.22, 0],
    AGE,
    2
  );

  const weightLabel = textAt(
    'WEIGHTS',
    15,
    C.muted,
    [CX, WEIGHT_Y - 0.38, 0],
    true
  );

  const areaWeightOutline = outline(
    [AX, WEIGHT_Y, 0],
    weightArea.getWidth() + 0.34,
    weightArea.getHeight() + 0.26,
    AREA
  );

  const ageWeightOutline = outline(
    [GX, WEIGHT_Y, 0],
    weightAge.getWidth() + 0.34,
    weightAge.getHeight() + 0.26,
    AGE
  );

  const weightParts = [
    weightArea,
    weightAge,
    areaConnector,
    ageConnector,
    weightLabel
  ];

  // ------------------------------------------------------------
  // Vertical points ledger
  //
  // Negative scores lie below zero.
  // A positive contribution moves up.
  // A negative contribution moves down.
  // ------------------------------------------------------------

  const lp = v => [
    LEDGER_X,
    LEDGER_ZERO + v * LEDGER_STEP,
    0
  ];

  const ledgerTitle = textAt(
    'POINTS',
    18,
    C.ink,
    [
      LEDGER_X + 0.18,
      lp(12)[1] + 0.35,
      0
    ],
    true
  );

  const ledgerLine = lineBetween(
    lp(-2),
    lp(12),
    C.muted,
    2.5
  );

  const ledgerTicks = [];

  for (let v = -2; v <= 12; v++) {
    const p = lp(v);

    const tick = lineBetween(
      [p[0] - 0.09, p[1], 0],
      [p[0] + 0.09, p[1], 0],
      v === 0 ? C.ink : C.muted,
      v === 0 ? 2.5 : 1.2
    );

    ledgerTicks.push(tick);

    if (v % 2 === 0) {
      ledgerTicks.push(
        textAt(
          signed(v),
          P ? 15 : 14,
          v === 0 ? C.ink : C.muted,
          [p[0] - 0.30, p[1], 0],
          true
        )
      );
    }
  }

  const ledger = new M.VGroup(
    ledgerTitle,
    ledgerLine,
    ...ledgerTicks
  );

  function ledgerMarker(v, color = C.amber) {
    const p = lp(v);

    const halo = new M.Dot({
      point: p,
      radius: 0.15,
      color
    });

    halo.setFill(color, 0.18);

    const d = dotAt(p, color, 0.075);

    const lab = tagAt(
      signed(v),
      color,
      [p[0] + 0.43, p[1], 0],
      15,
      0.70
    );

    return new M.VGroup(halo, d, lab);
  }

  let marker = ledgerMarker(0);

  function moveMarker(v, color) {
    const m = ledgerMarker(v, color);
    const a = [new M.FadeOut(marker), new M.FadeIn(m)];
    marker = m;
    return a;
  }

  function ledgerSteps(from, to, color) {
    const direction = Math.sign(to - from);
    const count = Math.abs(to - from);
    const segments = [];

    for (let i = 0; i < count; i++) {
      const start = lp(from + direction * (i + 0.08));
      const end = lp(from + direction * (i + 0.92));

      segments.push(
        lineBetween(
          [start[0] + 0.15, start[1], 0],
          [end[0] + 0.15, end[1], 0],
          color,
          5
        )
      );
    }

    return segments;
  }

  function drawSteps(steps, duration = 1.1) {
    return new M.LaggedStart(
      steps.map(s => new M.Create(s)),
      {
        lagRatio: 0.20,
        runTime: duration
      }
    );
  }

  const previewSteps = ledgerSteps(0, -2, AGE);
  const earningSteps = ledgerSteps(0, 12, AREA);
  const deductionSteps = ledgerSteps(12, 10, AGE);

  // ------------------------------------------------------------
  // Six area chunks and twelve positive point tokens
  // ------------------------------------------------------------

  const CHUNK_PITCH = P ? 0.55 : 0.73;
  const CHUNK_SIZE = P ? 0.40 : 0.47;

  function chunkX(i) {
    return WORK_X + (i - 2.5) * CHUNK_PITCH;
  }

  const areaWorkLabel = textAt(
    'B: 6 AREA CHUNKS',
    16,
    AREA,
    [WORK_X, AREA_Y + 0.40, 0],
    true,
    P ? 4.05 : 5.2
  );

  const areaChunks = [];

  for (let i = 0; i < B.area; i++) {
    const r = new M.Rectangle({
      width: CHUNK_SIZE,
      height: CHUNK_SIZE,
      color: AREA,
      strokeWidth: 1.5
    });

    r.setFill(AREA, 0.72);
    r.moveTo([chunkX(i), AREA_Y, 0]);

    areaChunks.push(r);
  }

  function positiveToken(x, y) {
    const d = new M.Circle({
      radius: P ? 0.105 : 0.12,
      color: POS,
      strokeWidth: 1
    });

    d.setFill(POS, 0.85);
    d.moveTo([x, y, 0]);

    const plus = textAt(
      '+',
      12,
      C.card,
      [x, y, 0],
      true
    );

    return new M.VGroup(d, plus);
  }

  const pointPairs = [];

  for (let i = 0; i < B.area; i++) {
    const x = chunkX(i);
    const y = AREA_Y - 0.38;

    pointPairs.push(
      new M.VGroup(
        positiveToken(x - 0.125, y),
        positiveToken(x + 0.125, y)
      )
    );
  }

  const areaTotal = tagAt(
    P ? '+12 AREA POINTS' : '+12 POINTS',
    AREA,
    [
      P ? WORK_X : -0.30,
      P ? AREA_Y - 0.92 : AREA_Y - 0.19,
      0
    ],
    17,
    P ? 4.0 : 1.75
  );

  // ------------------------------------------------------------
  // Two age units and two negative point tokens
  // ------------------------------------------------------------

  const AGE_TOKEN_X = P
    ? [WORK_X - 0.80, WORK_X + 0.80]
    : [WORK_X - 1.05, WORK_X + 1.05];

  const ageWorkLabel = textAt(
    'B: 2 YEARS',
    16,
    AGE,
    [
      WORK_X,
      P ? AGE_Y + 0.40 : AGE_Y + 0.14,
      0
    ],
    true
  );

  const yearUnits = AGE_TOKEN_X.map((x, i) => {
    const center = [
      x,
      P ? AGE_Y - 0.05 : AGE_Y - 0.20,
      0
    ];

    const r = rectAt(
      center,
      P ? 0.92 : 0.90,
      0.38,
      AGE,
      AGE,
      0.20,
      1.5
    );

    const label = textAt(
      '1 year',
      15,
      AGE,
      center,
      true
    );

    return new M.VGroup(r, label);
  });

  function negativeToken(x, y) {
    const d = new M.Circle({
      radius: 0.14,
      color: NEG,
      strokeWidth: 1.5
    });

    d.setFill(NEG, 0.80);
    d.moveTo([x, y, 0]);

    const minus = textAt(
      '−',
      15,
      C.card,
      [x, y, 0],
      true
    );

    return new M.VGroup(d, minus);
  }

  const ageTokens = AGE_TOKEN_X.map(x =>
    negativeToken(
      x,
      P ? AGE_Y - 0.47 : AGE_Y - 0.57
    )
  );

  // ============================================================
  // 0-1: Establish the renter's preferences
  // ============================================================

  // 0. You like roomy apartments and prefer newer buildings.
  await until(S(0));

  await play(
    reveal([introArea, introAge], 1.5, 0.25),
    ...say('MORE SPACE • FEWER YEARS')
  );

  // 1. How could you turn those preferences into one score
  //    for a listing?
  await until(S(1));

  await play(
    new M.FadeIn(introQuestion),
    new M.Indicate(introArea, { color: AREA }),
    new M.Indicate(introAge, { color: AGE }),
    ...say('TURN PREFERENCES INTO POINTS', C.amber)
  );

  // ============================================================
  // 2-5: Apartment B and the points ledger
  // ============================================================

  // 2. Put apartment B's card on the table.
  await until(S(2));

  await play(
    ...fadeAll([introArea, introAge, introQuestion]),
    ...cardShell.map(o => new M.FadeIn(o)),
    ...say('APARTMENT B')
  );

  // 3. It shows six area chunks and two years of building age.
  await until(S(3));

  await play(
    reveal(cardMeasurements, 1.5, 0.20),
    ...say('B: 6 AREA CHUNKS, 2 YEARS')
  );

  // 4. Each area chunk stands for ten square metres.
  await until(S(4));

  await play(
    new M.FadeIn(unitPicture),
    new M.Indicate(cardArea, { color: AREA }),
    ...say('1 AREA CHUNK = 10 m²', AREA)
  );

  // 5. Imagine keeping a little points ledger beside the card.
  await until(S(5));

  await play(
    new M.FadeOut(unitPicture),
    new M.FadeIn(ledger),
    new M.FadeIn(marker),
    ...say('START WITH ZERO POINTS', C.amber)
  );

  // ============================================================
  // 6-12: The feature weights
  // ============================================================

  // 6. Give the apartment two points for every area chunk.
  await until(S(6));

  await play(
    new M.FadeIn(weightArea),
    new M.Indicate(cardArea, { color: AREA }),
    ...say('+2 POINTS PER AREA CHUNK', AREA)
  );

  // 7. Take away one point for every year of age.
  await until(S(7));

  await play(
    new M.FadeIn(weightAge),
    new M.Indicate(cardAge, { color: AGE }),
    ...say('−1 POINT PER YEAR OF AGE', AGE)
  );

  // 8. Put both instructions directly below the numbers
  //    they belong to.
  await until(S(8));

  await play(
    new M.Create(areaConnector),
    new M.Create(ageConnector),
    new M.Indicate(weightArea, { color: AREA }),
    new M.Indicate(weightAge, { color: AGE }),
    ...say('MATCH EACH FEATURE TO ITS RULE')
  );

  // 9. The number of points per step is called a weight.
  await until(S(9));

  await play(
    new M.FadeIn(weightLabel),
    ...say('WEIGHT = POINTS PER FEATURE STEP', C.violet)
  );

  // 10. Our area weight is two.
  await until(S(10));

  await play(
    new M.Create(areaWeightOutline),
    new M.Indicate(weightArea, { color: AREA }),
    ...say('AREA WEIGHT = 2', AREA)
  );

  // 11. Our age weight is negative one.
  await until(S(11));

  await play(
    new M.FadeOut(areaWeightOutline),
    new M.Create(ageWeightOutline),
    new M.Indicate(weightAge, { color: AGE }),
    ...say('AGE WEIGHT = −1', AGE)
  );

  // 12. On the points ledger, that means one step down
  //     for each year.
  await until(S(12));

  await play(
    drawSteps(previewSteps, 1.2),
    ...moveMarker(-2, AGE),
    ...say('NEGATIVE WEIGHT: STEP DOWN', AGE)
  );

  // ============================================================
  // 13-16: Six chunks earn twelve points
  // ============================================================

  // 13. Look at the area first.
  await until(S(13));

  await play(
    new M.FadeOut(ageWeightOutline),
    ...fadeAll(previewSteps),
    ...moveMarker(0, C.amber),
    new M.FadeIn(areaWorkLabel),
    reveal(areaChunks, 0.8, 0.12),
    ...say('STEP 1: AREA', AREA)
  );

  // 14. B has six chunks, so put two points next to each chunk.
  await until(S(14));

  await play(
    new M.LaggedStart(
      pointPairs.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.25,
        runTime: 2.1
      }
    ),
    ...say('2 POINTS FOR EACH OF 6 CHUNKS', AREA)
  );

  // 15. Six times two gives twelve area points.
  await until(S(15));

  await play(
    drawSteps(earningSteps, 1.25),
    ...moveMarker(12, AREA),
    new M.FadeIn(areaTotal),
    ...fbox(
      [
        ['Area contribution', AREA],
        ['6 × 2 = 12', AREA]
      ],
      AREA
    ),
    ...say('6 × 2 = 12 AREA POINTS', AREA)
  );

  // 16. Keep the twelve area points visible as we move
  //     to the age line.
  await until(S(16));

  await play(
    new M.Indicate(areaTotal, { color: AREA }),
    new M.FadeIn(ageWorkLabel),
    reveal(yearUnits, 1.0, 0.25),
    ...say('STEP 2: BUILDING AGE', AGE)
  );

  // ============================================================
  // 17-18: Two years cost two points
  // ============================================================

  // 17. B has two years, so take away a point for each year.
  await until(S(17));

  await play(
    reveal(ageTokens, 1.3, 0.40),
    new M.Indicate(weightAge, { color: AGE }),
    ...say('TAKE AWAY 1 POINT FOR EACH YEAR', AGE)
  );

  // 18. Two times negative one gives negative two age points.
  await until(S(18));

  await play(
    ...fbox(
      [
        ['Area: 6 × 2 = 12', AREA],
        ['Age: 2 × (−1) = −2', AGE]
      ],
      C.violet
    ),
    new M.Indicate(ageTokens[0], { color: AGE }),
    new M.Indicate(ageTokens[1], { color: AGE }),
    ...say('2 × (−1) = −2 AGE POINTS', AGE)
  );

  // ============================================================
  // 19-22: Combine both contributions
  // ============================================================

  // 19. Add the area and age contributions.
  await until(S(19));

  await play(
    ...fbox(
      [
        ['Area points:  12', AREA],
        ['Age points:   −2', AGE],
        ['12 + (−2) = ?', C.amber]
      ],
      C.amber
    ),
    ...say('STEP 3: ADD THE CONTRIBUTIONS', C.amber)
  );

  // 20. Start at twelve on the ledger and step down twice.
  await until(S(20));

  await play(
    drawSteps(deductionSteps, 1.4),
    ...moveMarker(10, C.amber),
    ...fbox(
      [
        ['Start at 12', AREA],
        ['12 − 1 = 11', AGE],
        ['11 − 1 = 10', AGE]
      ],
      C.amber
    ),
    ...say('12 → 11 → 10', C.amber)
  );

  const scoreTag = tagAt(
    'B: 10 POINTS',
    POS,
    P
      ? [1.0, -5.35, 0]
      : [4.48, 0.75, 0],
    21,
    P ? 4.0 : 4.2
  );

  // 21. B lands at ten points.
  await until(S(21));

  await play(
    new M.FadeIn(scoreTag),
    new M.Indicate(marker, { color: POS }),
    ...fbox(
      [
        ['12 + (−2)', C.ink],
        ['= 10 points', POS]
      ],
      POS
    ),
    ...say('B SCORES 10 POINTS', POS)
  );

  // 22. The whole match, multiply, and add rule is called
  //     a dot product.
  await until(S(22));

  await play(
    ...fbox(
      [
        ['MATCH', C.cyan],
        ['MULTIPLY', C.violet],
        ['ADD', C.amber],
        ['= dot product', POS]
      ],
      POS
    ),
    new M.Indicate(scoreTag, { color: POS }),
    ...say('DOT PRODUCT = MATCH, MULTIPLY, ADD', POS)
  );

  // ============================================================
  // Vector layout
  //
  // Same feature order on both rows.
  // Feature values and weights are aligned by column.
  // ============================================================

  const VX = P ? 0 : 3.42;
  const VY = P ? -0.65 : 0.65;

  const VECTOR_W = P ? 6.65 : 5.60;

  const V_AREA_X = VX + 0.65;
  const V_AGE_X = VX + 2.10;
  const V_LABEL_X = VX - 1.55;

  const HEADER_Y = VY + 0.76;
  const FEATURE_Y = VY + 0.18;
  const WROW_Y = VY - 0.52;

  const vectorFrame = rectAt(
    [VX, VY, 0],
    VECTOR_W,
    2.15,
    C.muted,
    C.card,
    0.97
  );

  const vAreaHeader = textAt(
    'AREA',
    17,
    AREA,
    [V_AREA_X, HEADER_Y, 0],
    true
  );

  const vAgeHeader = textAt(
    'AGE',
    17,
    AGE,
    [V_AGE_X, HEADER_Y, 0],
    true
  );

  const vFeatureLabel = textAt(
    'Features (B)',
    18,
    C.ink,
    [V_LABEL_X, FEATURE_Y, 0],
    false,
    2.10
  );

  const vFeatureArea = textAt(
    '6',
    30,
    AREA,
    [V_AREA_X, FEATURE_Y, 0],
    true
  );

  const vFeatureAge = textAt(
    '2',
    30,
    AGE,
    [V_AGE_X, FEATURE_Y, 0],
    true
  );

  const vWeightLabel = textAt(
    'Weights',
    18,
    C.ink,
    [V_LABEL_X, WROW_Y, 0],
    false,
    2.10
  );

  const vWeightArea = textAt(
    '2',
    30,
    AREA,
    [V_AREA_X, WROW_Y, 0],
    true
  );

  const vWeightAge = textAt(
    '−1',
    30,
    AGE,
    [V_AGE_X, WROW_Y, 0],
    true
  );

  const vectorDivider = lineBetween(
    [VX - VECTOR_W / 2 + 0.20, VY - 0.15, 0],
    [VX + VECTOR_W / 2 - 0.20, VY - 0.15, 0],
    GRID,
    1.5
  );

  const vectorShell = [
    vectorFrame,
    vAreaHeader,
    vAgeHeader
  ];

  const featureRow = [
    vFeatureLabel,
    vFeatureArea,
    vFeatureAge
  ];

  const weightRow = [
    vWeightLabel,
    vWeightArea,
    vWeightAge,
    vectorDivider
  ];

  const pairArea = outline(
    [V_AREA_X, VY - 0.17, 0],
    1.12,
    1.30,
    AREA
  );

  const pairAge = outline(
    [V_AGE_X, VY - 0.17, 0],
    1.12,
    1.30,
    AGE
  );

  // ============================================================
  // 23-26: Feature vector and weight vector
  // ============================================================

  // 23. A feature vector is our ordered list of apartment
  //     measurements.
  await until(S(23));

  BOXP = P
    ? [0, -3.65, 0]
    : [3.42, -1.82, 0];

  BOX_MAX = P ? 6.65 : 5.65;

  await play(
    ...fadeAll([
      ledger,
      marker,
      ...earningSteps,
      ...deductionSteps,
      areaWorkLabel,
      ...areaChunks,
      ...pointPairs,
      areaTotal,
      ageWorkLabel,
      ...yearUnits,
      ...ageTokens,
      scoreTag
    ]),
    ...vectorShell.map(o => new M.FadeIn(o)),
    reveal(featureRow, 1.3, 0.18),
    ...fbox(
      [
        ['Feature vector for B', C.ink],
        ['(6, 2)', C.cyan]
      ],
      C.cyan
    ),
    ...say('FEATURE VECTOR = ORDERED MEASUREMENTS')
  );

  // 24. A weight vector is our ordered list of points
  //     per feature step.
  await until(S(24));

  await play(
    reveal(weightRow, 1.3, 0.18),
    ...fbox(
      [
        ['Feature vector = (6, 2)', C.cyan],
        ['Weight vector  = (2, −1)', C.violet]
      ],
      C.violet
    ),
    ...say('WEIGHT VECTOR = ORDERED WEIGHTS', C.violet)
  );

  // 25. The lists line up with area first and age second.
  await until(S(25));

  await play(
    new M.Create(pairArea),
    new M.Create(pairAge),
    new M.Indicate(vAreaHeader, { color: AREA }),
    new M.Indicate(vAgeHeader, { color: AGE }),
    ...say('AREA FIRST • AGE SECOND')
  );

  // 26. Rent stays on the card because our points rule
  //     gives weights only to area and age.
  await until(S(26));

  await play(
    new M.Indicate(cardRent, { color: RENT }),
    ...fbox(
      [
        ['Scored: area, age', C.green],
        ['Rent stays on the card', RENT],
        ['No rent weight in this rule', C.muted]
      ],
      RENT
    ),
    ...say('RENT IS NOT PART OF THIS SCORE', RENT)
  );

  // ============================================================
  // 27-29: Write the dot-product formula
  // ============================================================

  // 27. We can put the rule in a formula, which is a short
  //     way to write the calculation.
  await until(S(27));

  await play(
    ...fbox(
      [
        ['score = area × area weight', AREA],
        ['      + age × age weight', AGE]
      ],
      C.cyan
    ),
    ...say('FORMULA = THE RULE IN ONE LINE')
  );

  // 28. A dot product equals the sum of the products
  //     of the matching pairs.
  await until(S(28));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(pairArea, { color: AREA }),
        new M.Indicate(pairAge, { color: AGE })
      ],
      {
        lagRatio: 0.30,
        runTime: 1.6
      }
    ),
    ...fbox(
      [
        ['Dot product', C.ink],
        ['= sum of matching products', C.violet],
        ['Multiply pairs, then add', C.amber]
      ],
      C.violet
    ),
    ...say('SUM OF THE MATCHING PRODUCTS', C.violet)
  );

  // 29. For our score, that means area times its weight
  //     plus age times its weight.
  await until(S(29));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(vFeatureArea, { color: AREA }),
        new M.Indicate(vWeightArea, { color: AREA }),
        new M.Indicate(vFeatureAge, { color: AGE }),
        new M.Indicate(vWeightAge, { color: AGE })
      ],
      {
        lagRatio: 0.20,
        runTime: 2.0
      }
    ),
    ...fbox(
      [
        ['B: (6, 2) · (2, −1)', C.ink],
        ['= 6 × 2 + 2 × (−1)', C.violet],
        ['= 12 + (−2)', C.amber],
        ['= 10 points', POS]
      ],
      POS
    ),
    ...say('AREA × 2 + AGE × (−1)', POS)
  );

  // ============================================================
  // Score comparison
  //
  // A = −8
  // B = 10
  // C = 4
  //
  // Signed horizontal bars share the same zero line.
  // ------------------------------------------------------------

  const RANK_CX = P ? 0.35 : -2.20;
  const RANK_STEP = P ? 0.28 : 0.36;

  const RANK_TOP = P ? 2.65 : 0.98;
  const RANK_GAP = P ? 1.50 : 1.00;
  const RANK_BOTTOM = RANK_TOP - 2 * RANK_GAP - 0.62;

  const sx = v => RANK_CX + v * RANK_STEP;

  const rowY = i => RANK_TOP - i * RANK_GAP;

  const rankTitle = textAt(
    'POINTS UNDER THIS RULE',
    P ? 20 : 21,
    C.ink,
    [
      P ? 0 : -1.85,
      RANK_TOP + 0.62,
      0
    ],
    true,
    P ? 6.7 : 7.2
  );

  const rankAxis = lineBetween(
    [sx(-10), RANK_BOTTOM, 0],
    [sx(11), RANK_BOTTOM, 0],
    C.muted,
    2
  );

  const rankZero = new M.DashedLine({
    start: [sx(0), RANK_BOTTOM, 0],
    end: [sx(0), RANK_TOP + 0.32, 0],
    color: C.muted,
    strokeWidth: 2
  });

  const rankTicks = [];

  for (let v = -10; v <= 10; v += 2) {
    const x = sx(v);

    rankTicks.push(
      lineBetween(
        [x, RANK_BOTTOM - 0.07, 0],
        [x, RANK_BOTTOM + 0.07, 0],
        C.muted,
        1.4
      )
    );

    if (!P || v % 4 === 0 || v === -10 || v === 10) {
      rankTicks.push(
        textAt(
          signed(v),
          15,
          C.muted,
          [x, RANK_BOTTOM - 0.25, 0],
          true
        )
      );
    }
  }

  const rankLabels = DATA.map((d, i) =>
    tagAt(
      d.id,
      C.cyan,
      [
        sx(-10) - (P ? 0.62 : 0.55),
        rowY(i),
        0
      ],
      18
    )
  );

  const rankGrid = new M.VGroup(
    rankTitle,
    rankAxis,
    rankZero,
    ...rankTicks,
    ...rankLabels
  );

  function scoreBar(d, i) {
    const n = score(d);
    const y = rowY(i);
    const color = n < 0 ? NEG : POS;
    const w = Math.abs(n) * RANK_STEP;

    const bar = new M.Rectangle({
      width: w,
      height: P ? 0.36 : 0.40,
      color,
      strokeWidth: 1.5
    });

    bar.setFill(color, 0.78);

    bar.moveTo([
      (sx(0) + sx(n)) / 2,
      y,
      0
    ]);

    const end = dotAt(
      [sx(n), y, 0],
      color,
      0.075
    );

    const value = textAt(
      signed(n),
      22,
      color,
      [
        sx(n) + (n < 0 ? -0.30 : 0.30),
        y + 0.32,
        0
      ],
      true
    );

    return {
      bar,
      end,
      value,
      parts: [bar, end, value]
    };
  }

  const bars = DATA.map(scoreBar);

  function showBar(i) {
    const b = bars[i];

    return [
      new M.Create(b.bar),
      new M.FadeIn(b.end),
      new M.FadeIn(b.value)
    ];
  }

  const rankParts = [
    rankGrid,
    ...bars.flatMap(b => b.parts)
  ];

  const winnerOutline = outline(
    [
      (sx(0) + sx(10)) / 2,
      rowY(1),
      0
    ],
    10 * RANK_STEP + 0.25,
    0.66,
    POS
  );

  const bestTag = tagAt(
    'HIGHEST SCORE',
    POS,
    [
      sx(-5),
      rowY(1),
      0
    ],
    15,
    P ? 2.7 : 3.5
  );

  // ============================================================
  // 30-33: Apply the same weights to C and A
  // ============================================================

  // 30. The same calculation gives C four points.
  await until(S(30));

  BOXP = P
    ? [0, -2.48, 0]
    : [4.28, -0.05, 0];

  BOX_MAX = P ? 6.65 : 4.55;

  await play(
    ...fadeAll([
      ...cardParts,
      ...weightParts,
      ...vectorShell,
      ...featureRow,
      ...weightRow,
      pairArea,
      pairAge
    ]),
    new M.FadeIn(rankGrid),
    ...showBar(1),
    ...showBar(2),
    ...fbox(
      [
        ['Apartment C', C.ink],
        ['9 × 2 = 18', AREA],
        ['14 × (−1) = −14', AGE],
        ['18 − 14 = 4', POS]
      ],
      POS
    ),
    ...say('C SCORES 4 POINTS', POS)
  );

  // 31. A ends up at negative eight, or eight points below zero.
  await until(S(31));

  await play(
    ...showBar(0),
    ...fbox(
      [
        ['Apartment A', C.ink],
        ['3 × 2 = 6', AREA],
        ['14 × (−1) = −14', AGE],
        ['6 − 14 = −8', NEG]
      ],
      NEG
    ),
    ...say('A SCORES −8 POINTS', NEG)
  );

  // 32. B has the highest score under this points rule.
  await until(S(32));

  await play(
    new M.Create(winnerOutline),
    new M.FadeIn(bestTag),
    new M.Indicate(bars[1].value, { color: POS }),
    ...fbox(
      [
        ['B:  10 points', POS],
        ['C:   4 points', C.ink],
        ['A:  −8 points', NEG]
      ],
      POS
    ),
    ...say('B WINS UNDER THESE WEIGHTS', POS)
  );

  // 33. Use a dot product when each feature should contribute
  //     points at a rate you set.
  await until(S(33));

  await play(
    ...fbox(
      [
        ['Your preferences', C.ink],
        ['Area rate: +2', AREA],
        ['Age rate:  −1', AGE],
        ['One score per listing', POS]
      ],
      C.green
    ),
    new M.LaggedStart(
      [
        new M.Indicate(bars[0].bar, { color: NEG }),
        new M.Indicate(bars[1].bar, { color: POS }),
        new M.Indicate(bars[2].bar, { color: POS })
      ],
      {
        lagRatio: 0.20,
        runTime: 1.6
      }
    ),
    ...say('YOU CHOOSE THE FEATURE WEIGHTS', C.green)
  );

  // ============================================================
  // Warning picture: mismatched vector order
  //
  // Keep the feature labels attached to their numbers.
  // Do not regroup objects that are already visible.
  // ============================================================

  const WARN_X = 0;
  const WARN_Y = P ? 1.0 : 0.15;
  const WARN_W = P ? 6.55 : 7.35;

  const WARN_LEFT = WARN_X - 1.55;
  const WARN_RIGHT = WARN_X + 1.55;

  const warningFrame = rectAt(
    [WARN_X, WARN_Y, 0],
    WARN_W,
    P ? 3.25 : 2.50,
    C.amber,
    C.card,
    0.97
  );

  const warningHeading = textAt(
    'B: KEEP THE FEATURES MATCHED',
    21,
    C.ink,
    [
      WARN_X,
      WARN_Y + (P ? 1.27 : 0.96),
      0
    ],
    true,
    WARN_W - 0.55
  );

  const WFEATURE_Y = WARN_Y + 0.39;
  const WWEIGHT_Y = WARN_Y - 0.67;

  function warningCell(
    label,
    value,
    x,
    y,
    color
  ) {
    const r = rectAt(
      [x, y, 0],
      P ? 2.60 : 2.75,
      0.76,
      color,
      C.card,
      0.95,
      1.8
    );

    const name = textAt(
      label,
      15,
      color,
      [x, y + 0.20, 0],
      true
    );

    const number = textAt(
      value,
      24,
      color,
      [x, y - 0.13, 0],
      true
    );

    return new M.VGroup(r, name, number);
  }

  // Incorrectly reordered feature row: age, then area.
  const warnFeatureLeft = warningCell(
    'AGE',
    '2',
    WARN_LEFT,
    WFEATURE_Y,
    AGE
  );

  const warnFeatureRight = warningCell(
    'AREA',
    '6',
    WARN_RIGHT,
    WFEATURE_Y,
    AREA
  );

  // Weight row is still in the original area, age order.
  const warnWeightLeft = warningCell(
    'AREA WEIGHT',
    '2',
    WARN_LEFT,
    WWEIGHT_Y,
    AREA
  );

  const warnWeightRight = warningCell(
    'AGE WEIGHT',
    '−1',
    WARN_RIGHT,
    WWEIGHT_Y,
    AGE
  );

  const wrongMatchLeft = lineBetween(
    [WARN_LEFT, WFEATURE_Y - 0.39, 0],
    [WARN_LEFT, WWEIGHT_Y + 0.39, 0],
    C.amber,
    3
  );

  const wrongMatchRight = lineBetween(
    [WARN_RIGHT, WFEATURE_Y - 0.39, 0],
    [WARN_RIGHT, WWEIGHT_Y + 0.39, 0],
    C.amber,
    3
  );

  const MATCH_TAG_P = P
    ? [WARN_X, WARN_Y - 1.36, 0]
    : [WARN_X + WARN_W / 2 + 1.35, WARN_Y - 0.14, 0];

  const wrongMatchTag = tagAt(
    'WRONG MATCH',
    C.amber,
    MATCH_TAG_P,
    17
  );

  const correctMatchLeft = lineBetween(
    [WARN_LEFT, WFEATURE_Y - 0.39, 0],
    [WARN_LEFT, WWEIGHT_Y + 0.39, 0],
    AREA,
    3
  );

  const correctMatchRight = lineBetween(
    [WARN_RIGHT, WFEATURE_Y - 0.39, 0],
    [WARN_RIGHT, WWEIGHT_Y + 0.39, 0],
    AGE,
    3
  );

  const correctMatchTag = tagAt(
    'CORRECT MATCH',
    POS,
    MATCH_TAG_P,
    17
  );

  // ============================================================
  // 34-35: Common mistake and correction
  // ============================================================

  // 34. A common slip is to match weights by position after
  //     putting the measurements in a different order.
  await until(S(34));

  BOXP = P
    ? [0, -2.70, 0]
    : [0, -2.05, 0];

  BOX_MAX = P ? 6.55 : 7.0;

  await play(
    ...fadeAll([
      ...rankParts,
      winnerOutline,
      bestTag
    ]),
    new M.FadeIn(warningFrame),
    new M.FadeIn(warningHeading),
    reveal(
      [
        warnFeatureLeft,
        warnFeatureRight,
        warnWeightLeft,
        warnWeightRight
      ],
      1.5,
      0.12
    ),
    new M.Create(wrongMatchLeft),
    new M.Create(wrongMatchRight),
    new M.FadeIn(wrongMatchTag),
    ...fbox(
      [
        ['Wrong feature order', C.amber],
        ['2 × 2 + 6 × (−1) = −2', C.ink],
        ['Wrong score for our rule!', C.amber]
      ],
      C.amber
    ),
    ...say('WATCH OUT: DO NOT SWAP THE ORDER', C.amber)
  );

  // 35. Keep the area weight under area and the age weight
  //     under age.
  await until(S(35));

  const fixedAge = warningCell('AGE', '2', WARN_RIGHT, WFEATURE_Y, AGE);
  const fixedArea = warningCell('AREA', '6', WARN_LEFT, WFEATURE_Y, AREA);

  await play(
    new M.FadeOut(warnFeatureLeft),
    new M.FadeOut(warnFeatureRight),
    new M.FadeIn(fixedAge),
    new M.FadeIn(fixedArea),
    new M.FadeOut(wrongMatchLeft),
    new M.FadeOut(wrongMatchRight),
    new M.FadeOut(wrongMatchTag),
    new M.Create(correctMatchLeft),
    new M.Create(correctMatchRight),
    new M.FadeIn(correctMatchTag),
    ...fbox(
      [
        ['Area with area weight', AREA],
        ['Age with age weight', AGE],
        ['6 × 2 + 2 × (−1) = 10', POS]
      ],
      POS
    ),
    ...say('MATCH FEATURES, NOT JUST POSITIONS', POS)
  );

  // ============================================================
  // Try it preview
  //
  // Recreate a fresh score chart rather than wrapping or
  // regrouping previously displayed objects.
  // ============================================================

  const tryRankParts = [];

  const tryTitle = textAt(
    'TRY THE SCORING RULE',
    21,
    C.ink,
    [
      P ? 0 : -1.85,
      RANK_TOP + 0.62,
      0
    ],
    true
  );

  tryRankParts.push(tryTitle);

  const tryAxis = lineBetween(
    [sx(-10), RANK_BOTTOM, 0],
    [sx(11), RANK_BOTTOM, 0],
    C.muted,
    2
  );

  const tryZero = new M.DashedLine({
    start: [sx(0), RANK_BOTTOM, 0],
    end: [sx(0), RANK_TOP + 0.32, 0],
    color: C.muted,
    strokeWidth: 2
  });

  tryRankParts.push(tryAxis, tryZero);

  for (let v = -10; v <= 10; v += 2) {
    const x = sx(v);

    tryRankParts.push(
      lineBetween(
        [x, RANK_BOTTOM - 0.07, 0],
        [x, RANK_BOTTOM + 0.07, 0],
        C.muted,
        1.3
      )
    );

    if (!P || v % 4 === 0 || v === -10 || v === 10) {
      tryRankParts.push(
        textAt(
          signed(v),
          15,
          C.muted,
          [x, RANK_BOTTOM - 0.25, 0],
          true
        )
      );
    }
  }

  DATA.forEach((d, i) => {
    tryRankParts.push(
      tagAt(
        d.id,
        C.cyan,
        [
          sx(-10) - (P ? 0.62 : 0.55),
          rowY(i),
          0
        ],
        18
      )
    );
  });

  const tryGrid = new M.VGroup(...tryRankParts);
  const tryBars = DATA.map(scoreBar);

  // ------------------------------------------------------------
  // Weight-change preview
  //
  // Keep the narration's original weights and scores intact.
  // Use an illustrative slider cue rather than silently changing
  // the shared chapter scoring rule.
  // ------------------------------------------------------------

  const sliderX = P ? 0 : 4.28;
  const sliderY = P ? -1.15 : 0.95;
  const sliderW = P ? 4.80 : 3.70;

  const sliderTitle = textAt(
    'CHANGE A WEIGHT',
    17,
    C.violet,
    [sliderX, sliderY + 0.37, 0],
    true
  );

  const sliderTrack = lineBetween(
    [sliderX - sliderW / 2, sliderY, 0],
    [sliderX + sliderW / 2, sliderY, 0],
    C.muted,
    3
  );

  const sliderKnob = new M.Circle({
    radius: 0.15,
    color: C.violet,
    strokeWidth: 2
  });

  sliderKnob.setFill(C.violet, 0.90);
  sliderKnob.moveTo([
    sliderX - sliderW * 0.14,
    sliderY,
    0
  ]);

  const sliderLeft = textAt(
    'smaller',
    15,
    C.muted,
    [sliderX - sliderW / 2 + 0.30, sliderY - 0.28, 0]
  );

  const sliderRight = textAt(
    'larger',
    15,
    C.muted,
    [sliderX + sliderW / 2 - 0.30, sliderY - 0.28, 0]
  );

  const sliderHint = new M.VGroup(
    sliderTitle,
    sliderTrack,
    sliderKnob,
    sliderLeft,
    sliderRight
  );

  // ============================================================
  // 36-38: Prompts for the interactive exercise
  // ============================================================

  // 36. In Try it, check that B lands at ten points.
  await until(S(36));

  BOXP = P
    ? [0, -3.0, 0]
    : [4.28, -0.70, 0];

  BOX_MAX = P ? 6.65 : 4.55;

  await play(
    ...fadeAll([
      warningFrame,
      warningHeading,
      fixedAge,
      fixedArea,
      warnWeightLeft,
      warnWeightRight,
      correctMatchLeft,
      correctMatchRight,
      correctMatchTag
    ]),
    new M.FadeIn(tryGrid),
    reveal(
      tryBars.flatMap(b => b.parts),
      1.35,
      0.07
    ),
    ...fbox(
      [
        ['TRY IT', POS],
        ['Area weight = 2', AREA],
        ['Age weight = −1', AGE],
        ['Check B: 10 points', POS]
      ],
      POS
    ),
    ...say('TRY IT: CHECK B = 10', POS)
  );

  // 37. Then move a weight until C has the highest score.
  await until(S(37));

  await play(
    new M.FadeIn(sliderHint),
    new M.Indicate(
      tryBars[2].value,
      { color: C.amber }
    ),
    ...fbox(
      [
        ['TRY IT', POS],
        ['Change one weight', C.violet],
        ['Can you make C win?', C.amber]
      ],
      C.violet
    ),
    ...say('CHANGE A WEIGHT: MAKE C WIN', C.violet)
  );

  // 38. Tap New data to try the same rule on different listings.
  await until(S(38));

  await play(
    new M.FadeOut(sliderHint),
    ...fbox(
      [
        ['TRY IT', POS],
        ['Tap New data', C.ink],
        ['Score different listings', C.muted]
      ],
      POS
    ),
    ...say('NEW DATA: SAME SCORING RULE', POS)
  );

  // ============================================================
  // 39: Final takeaway
  // ============================================================

  // 39. A dot product multiplies matching entries and adds
  //     their contributions into one score.
  await until(S(39));

  await play(
    ...fbox(
      [
        ['B: (6, 2) · (2, −1)', C.ink],
        ['= 6 × 2 + 2 × (−1)', C.violet],
        ['= 12 + (−2)', C.amber],
        ['= 10 points', POS]
      ],
      POS
    ),
    new M.LaggedStart(
      [
        new M.Indicate(
          tryBars[0].bar,
          { color: NEG }
        ),
        new M.Indicate(
          tryBars[2].bar,
          { color: POS }
        ),
        new M.Indicate(
          tryBars[1].bar,
          { color: POS }
        )
      ],
      {
        lagRatio: 0.25,
        runTime: 2.0
      }
    ),
    ...say('DOT PRODUCT: MATCH, MULTIPLY, ADD', POS)
  );
}

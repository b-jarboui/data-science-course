// lesson 9.1.1
// Feature vectors: apartment listings become points in a feature space.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine contract; browser runtime verification is pending.
// The Try it beats provide visual cues for the separate interactive exercise.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // Area: units of 10 square metres.
  // Age: years since the building was built.
  // Rent: monthly asking rent in dollars.
  // ------------------------------------------------------------

  const DATA = [
    { id: 'A', area: 3, age: 14, rent: 900 },
    { id: 'B', area: 6, age: 2, rent: 1100 },
    { id: 'C', area: 9, age: 14, rent: 1300 }
  ];

  const AREA = C.cyan;
  const AGE = C.pink || '#F472B6';
  const RENT = C.amber;
  const GRID = '#293548';

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22
  // Safe content: -5.5 <= y <= 4.3
  //
  // Laptop: 14.22 x 8
  // Safe content: -3.0 <= y <= 2.3
  // ------------------------------------------------------------

  const PILL = P ? [0, 4.04, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, -5.45, 0] : [3.3, -1.18, 0];

  const INITIAL_X = P
    ? [-2.38, 0, 2.38]
    : [-3.35, 0, 3.35];

  const INITIAL_Y = P ? 0.65 : -0.05;
  const INITIAL_W = P ? 2.15 : 2.85;
  const INITIAL_H = P ? 2.10 : 2.15;

  const CARD_X = P
    ? [-2.38, 0, 2.38]
    : [1.2, 3.3, 5.4];

  const CARD_Y = P ? 2.80 : 0.87;
  const CARD_W = P ? 2.15 : 1.85;
  const CARD_H = P ? 1.76 : 1.76;

  // Independent screen scales for the two measuring directions.
  // Every grid interval represents exactly one feature unit.
  const OX = P ? -2.55 : -5.65;
  const OY = P ? -3.75 : -2.03;

  const DX = P ? 0.50 : 0.53;
  const DY = P ? 0.34 : 0.235;

  const XMAX = 10;
  const YMAX = 15;

  const xy = (area, age) => [
    OX + area * DX,
    OY + age * DY,
    0
  ];

  const ORIGIN = xy(0, 0);

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const dollars = n => '$' + String(n).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  );

  // ------------------------------------------------------------
  // Common visual helpers
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

  function lineBetween(start, end, color, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function dotAt(p, color = C.cyan, radius = 0.095) {
    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);
    return d;
  }

  function fadeAll(objects) {
    return objects.map(o => new M.FadeOut(o));
  }

  function indicateAll(objects, color) {
    return objects.map(o => new M.Indicate(o, { color }));
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Each row is either:
  //   'text'
  //   ['text', color]
  //
  // All objects are grouped before appearing on screen.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 21;
    const lh = P ? 0.31 : 0.38;
    const maxw = P ? FW - 1.1 : 5.65;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) => {
      const t = T(s, size, c, true);

      if (t.getWidth() > maxw - 0.55) {
        t.scale((maxw - 0.55) / t.getWidth());
      }

      return t;
    });

    const wd = Math.min(
      maxw,
      Math.max(...texts.map(t => t.getWidth())) + 0.55
    );

    const ht = rows.length * lh + 0.23;

    const r = rectAt(
      BOXP,
      wd,
      ht,
      color,
      C.card,
      0.97
    );

    const left = BOXP[0] - wd / 2 + 0.275;
    const top = BOXP[1] + ht / 2 - 0.115 - lh / 2;

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
  // Apartment illustration
  //
  // Simple building pictures establish the real-world example
  // before any feature vectors or coordinate axes appear.
  // ------------------------------------------------------------

  function apartmentIcon(id, x, y) {
    const parts = [];

    const building = new M.Rectangle({
      width: 1.05,
      height: 1.42,
      color: C.ink,
      strokeWidth: 2
    });

    building.setFill(C.card, 0.95);
    building.moveTo([x, y, 0]);
    parts.push(building);

    const roof = lineBetween(
      [x - 0.63, y + 0.72, 0],
      [x + 0.63, y + 0.72, 0],
      C.ink,
      3
    );

    parts.push(roof);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const window = new M.Rectangle({
          width: 0.23,
          height: 0.23,
          color: AREA,
          strokeWidth: 1
        });

        window.setFill(AREA, 0.55);

        window.moveTo([
          x + (col === 0 ? -0.25 : 0.25),
          y + 0.38 - row * 0.36,
          0
        ]);

        parts.push(window);
      }
    }

    const door = new M.Rectangle({
      width: 0.25,
      height: 0.33,
      color: C.muted,
      strokeWidth: 1
    });

    door.setFill(C.muted, 0.45);
    door.moveTo([x, y - 0.52, 0]);

    parts.push(door);

    const label = textAt(
      id,
      P ? 25 : 27,
      C.ink,
      [x, y - 1.03, 0],
      true
    );

    parts.push(label);

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Listing cards
  //
  // Keep the components separate so each measurement can be
  // highlighted and moved without regrouping live objects.
  // ------------------------------------------------------------

  function makeCard(d, x, y, w, h, compact = false) {
    const frame = rectAt(
      [x, y, 0],
      w,
      h,
      C.muted,
      C.card,
      0.96,
      1.7
    );

    const heading = textAt(
      compact ? `APT ${d.id}` : `APARTMENT ${d.id}`,
      compact ? 19 : (P ? 20 : 24),
      C.ink,
      [x, y + h * 0.32, 0],
      true,
      w - 0.24
    );

    const area = textAt(
      `Area  ${d.area}`,
      compact ? 18 : 22,
      AREA,
      [x, y + h * 0.08, 0],
      true,
      w - 0.25
    );

    const age = textAt(
      `Age   ${d.age}`,
      compact ? 18 : 22,
      AGE,
      [x, y - h * 0.14, 0],
      true,
      w - 0.25
    );

    const rent = textAt(
      `Rent ${dollars(d.rent)}`,
      compact ? 16 : 19,
      RENT,
      [x, y - h * 0.36, 0],
      true,
      w - 0.24
    );

    return {
      frame,
      heading,
      area,
      age,
      rent,
      parts: [frame, heading, area, age, rent]
    };
  }

  const cards = DATA.map((d, i) =>
    makeCard(
      d,
      INITIAL_X[i],
      INITIAL_Y,
      INITIAL_W,
      INITIAL_H
    )
  );

  const icons = DATA.map((d, i) =>
    apartmentIcon(d.id, INITIAL_X[i], INITIAL_Y)
  );

  function moveCardsToGridLayout() {
    const animations = [];

    DATA.forEach((d, i) => {
      const target = makeCard(
        d,
        CARD_X[i],
        CARD_Y,
        CARD_W,
        CARD_H,
        true
      );

      cards[i].parts.forEach(part => {
        animations.push(new M.FadeOut(part));
      });
      target.parts.forEach(part => {
        animations.push(new M.FadeIn(part));
      });
      cards[i] = target;
    });

    return animations;
  }

  // ------------------------------------------------------------
  // One area block represents ten square metres.
  // ------------------------------------------------------------

  function areaBlocks(d, x, y) {
    const blocks = [];
    const pitch = P ? 0.20 : 0.24;
    const size = pitch * 0.82;

    for (let i = 0; i < d.area; i++) {
      const b = new M.Rectangle({
        width: size,
        height: size,
        color: AREA,
        strokeWidth: 1
      });

      b.setFill(AREA, 0.82);

      b.moveTo([
        x + (i - (d.area - 1) / 2) * pitch,
        y,
        0
      ]);

      blocks.push(b);
    }

    return new M.VGroup(...blocks);
  }

  const blockY = P ? -0.77 : -1.43;

  const chunks = DATA.map((d, i) =>
    areaBlocks(d, INITIAL_X[i], blockY)
  );

  // ------------------------------------------------------------
  // Feature grid
  //
  // Horizontal direction: area chunks.
  // Vertical direction: building age in years.
  // Rent remains on the cards.
  // ------------------------------------------------------------

  const gridParts = [];

  for (let a = 1; a <= XMAX; a++) {
    gridParts.push(
      lineBetween(
        xy(a, 0),
        xy(a, YMAX),
        GRID,
        0.9
      )
    );
  }

  for (let b = 1; b <= YMAX; b++) {
    gridParts.push(
      lineBetween(
        xy(0, b),
        xy(XMAX, b),
        GRID,
        0.9
      )
    );
  }

  const grid = new M.VGroup(...gridParts);

  const xAxis = lineBetween(
    ORIGIN,
    xy(XMAX + 0.20, 0),
    AREA,
    2.8
  );

  const yAxis = lineBetween(
    ORIGIN,
    xy(0, YMAX + 0.20),
    AGE,
    2.8
  );

  const areaTitle = textAt(
    'Area chunks (10 m² each)',
    P ? 16 : 17,
    AREA,
    [OX + XMAX * DX / 2, OY - 0.56, 0],
    false,
    P ? 5.5 : 5.3
  );

  const ageTitle = textAt(
    'Building age (years)',
    P ? 16 : 17,
    AGE,
    [0, 0, 0],
    false,
    3.4
  );
  ageTitle.rotate(Math.PI / 2);
  ageTitle.moveTo([OX - 0.72, OY + YMAX * DY / 2, 0]);

  const xTicks = [];
  const yTicks = [];

  for (let a = 0; a <= XMAX; a++) {
    const p = xy(a, 0);

    xTicks.push(
      lineBetween(
        [p[0], p[1] - 0.07, 0],
        [p[0], p[1] + 0.07, 0],
        AREA,
        1.5
      )
    );

    xTicks.push(
      textAt(
        String(a),
        P ? 15 : 14,
        AREA,
        [p[0], p[1] - 0.25, 0],
        true
      )
    );
  }

  for (let b = 0; b <= YMAX; b++) {
    const p = xy(0, b);

    yTicks.push(
      lineBetween(
        [p[0] - 0.07, p[1], 0],
        [p[0] + 0.07, p[1], 0],
        AGE,
        1.5
      )
    );

    if (b % 2 === 0) {
      yTicks.push(
        textAt(
          String(b),
          P ? 15 : 14,
          AGE,
          [p[0] - 0.26, p[1], 0],
          true
        )
      );
    }
  }

  const ticks = new M.VGroup(...xTicks, ...yTicks);

  // ------------------------------------------------------------
  // Coordinate-walking helpers
  //
  // Individual step segments make the count visible.
  // Each segment spans one grid interval, with a small gap.
  // ------------------------------------------------------------

  function walkSteps(a0, b0, a1, b1, color) {
    const count = Math.abs(a1 - a0) + Math.abs(b1 - b0);

    if (count === 0) return [];

    const da = (a1 - a0) / count;
    const db = (b1 - b0) / count;
    const segments = [];

    for (let i = 0; i < count; i++) {
      const start = xy(
        a0 + (i + 0.06) * da,
        b0 + (i + 0.06) * db
      );

      const end = xy(
        a0 + (i + 0.94) * da,
        b0 + (i + 0.94) * db
      );

      segments.push(
        lineBetween(start, end, color, 4.5)
      );
    }

    return segments;
  }

  function drawWalk(segments, duration = 0.9) {
    return new M.LaggedStart(
      segments.map(segment => new M.Create(segment)),
      {
        lagRatio: 0.20,
        runTime: duration
      }
    );
  }

  function apartmentPoint(d) {
    const p = xy(d.area, d.age);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.20 : 0.18,
      color: C.ink
    });

    halo.setFill(C.cyan, 0.19);

    const dot = dotAt(
      p,
      C.ink,
      P ? 0.090 : 0.085
    );

    const label = pill(
      d.id,
      C.cyan,
      P ? 15 : 16
    );

    label.moveTo([
      p[0],
      p[1] + 0.31,
      0
    ]);

    return new M.VGroup(halo, dot, label);
  }

  const pointA = apartmentPoint(DATA[0]);
  const pointB = apartmentPoint(DATA[1]);
  const pointC = apartmentPoint(DATA[2]);

  const bHorizontal = walkSteps(0, 0, 6, 0, AREA);
  const bVertical = walkSteps(6, 0, 6, 2, AGE);

  const aHorizontal = walkSteps(0, 0, 3, 0, AREA);
  const aVertical = walkSteps(3, 0, 3, 14, AGE);

  const cHorizontal = walkSteps(0, 0, 9, 0, AREA);
  const cVertical = walkSteps(9, 0, 9, 14, AGE);

  let cursor = dotAt(ORIGIN, C.amber, 0.09);

  // ============================================================
  // 0-6: Three apartments and their measurements
  // ============================================================

  // 0. Imagine you are comparing three apartments.
  await until(S(0));

  await play(
    new M.LaggedStart(
      icons.map(icon => new M.FadeIn(icon)),
      {
        lagRatio: 0.17,
        runTime: 1.3
      }
    ),
    ...say('3 APARTMENTS')
  );

  // 1. Can you see which listings are alike without rereading
  //    every card?
  await until(S(1));

  await play(
    ...say('WHICH LISTINGS ARE ALIKE?', C.amber),
    new M.LaggedStart(
      icons.map(icon =>
        new M.Indicate(icon, { color: C.amber })
      ),
      {
        lagRatio: 0.18,
        runTime: 1.7
      }
    )
  );

  // 2. Lay the cards for apartment A, apartment B, and
  //    apartment C side by side.
  await until(S(2));

  await play(
    ...fadeAll(icons),
    new M.LaggedStart(
      cards.map(card =>
        new M.LaggedStart(
          [
            new M.FadeIn(card.frame),
            new M.FadeIn(card.heading)
          ],
          {
            lagRatio: 0.15
          }
        )
      ),
      {
        lagRatio: 0.18,
        runTime: 1.5
      }
    ),
    ...say('A, B AND C')
  );

  // 3. Each card has a floor area, a building age,
  //    and a monthly rent.
  await until(S(3));

  await play(
    new M.LaggedStart(
      [
        ...cards.map(c => new M.FadeIn(c.area)),
        ...cards.map(c => new M.FadeIn(c.age)),
        ...cards.map(c => new M.FadeIn(c.rent))
      ],
      {
        lagRatio: 0.10,
        runTime: 1.8
      }
    ),
    ...say('3 MEASUREMENTS PER APARTMENT')
  );

  // 4. We count floor area in chunks of ten square metres.
  await until(S(4));

  await play(
    ...indicateAll(cards.map(c => c.area), AREA),
    new M.LaggedStart(
      chunks.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.16,
        runTime: 1.2
      }
    ),
    ...say('1 AREA CHUNK = 10 m²', AREA)
  );

  // 5. Building age counts years since the building was built.
  await until(S(5));

  await play(
    ...fadeAll(chunks),
    ...indicateAll(cards.map(c => c.age), AGE),
    ...say('AGE = YEARS SINCE BUILT', AGE)
  );

  // 6. Monthly rent is what the listing asks you to pay
  //    each month.
  await until(S(6));

  await play(
    ...indicateAll(cards.map(c => c.rent), RENT),
    ...say('RENT = DOLLARS PER MONTH', RENT)
  );

  // ============================================================
  // 7-12: Build the two-feature map
  // ============================================================

  // 7. Let's put floor area and building age on a map.
  await until(S(7));

  await play(
    ...moveCardsToGridLayout(),
    new M.FadeIn(grid),
    ...say('AREA AND AGE ON A MAP')
  );

  // 8. Leave the monthly rent visible on each card.
  await until(S(8));

  await play(
    ...indicateAll(cards.map(c => c.rent), RENT),
    ...say('KEEP RENT ON THE CARDS', RENT)
  );

  // 9. The line across the bottom counts area chunks.
  await until(S(9));

  await play(
    new M.Create(xAxis),
    new M.FadeIn(areaTitle),
    ...say('ACROSS = AREA', AREA)
  );

  // 10. The line up the side counts years of age.
  await until(S(10));

  await play(
    new M.Create(yAxis),
    new M.FadeIn(ageTitle),
    ...say('UP = BUILDING AGE', AGE)
  );

  // 11. The little marks on each line are one step apart.
  await until(S(11));

  await play(
    new M.FadeIn(ticks),
    ...say('EACH MARK = 1 STEP')
  );

  // 12. Start at the corner where both lines read zero.
  const originRing = new M.Circle({
    radius: 0.17,
    color: C.amber,
    strokeWidth: 2.5
  });

  originRing.setFill(C.amber, 0.10);
  originRing.moveTo(ORIGIN);

  await until(S(12));

  await play(
    new M.Create(originRing),
    new M.FadeIn(cursor),
    new M.Flash(cursor, { color: C.amber }),
    ...say('START AT ZERO', C.amber)
  );

  // ============================================================
  // 13-18: Walk from the origin to apartment B
  // ============================================================

  const bCardOutline = outline(
    [CARD_X[1], CARD_Y, 0],
    CARD_W + 0.12,
    CARD_H + 0.12,
    C.amber
  );

  // 13. Find apartment B's card.
  await until(S(13));

  await play(
    new M.Create(bCardOutline),
    ...say('FIND APARTMENT B', C.amber)
  );

  // 14. It has six area chunks.
  await until(S(14));

  await play(
    new M.Indicate(cards[1].area, {
      color: AREA
    }),
    ...say('B: 6 AREA CHUNKS', AREA)
  );

  // 15. Move six steps to the right.
  await until(S(15));

  await play(
    drawWalk(bHorizontal, 0.90),
    new M.Transform(
      cursor,
      dotAt(xy(6, 0), AREA, 0.09)
    ),
    ...say('6 STEPS RIGHT', AREA)
  );

  // 16. The building is two years old.
  await until(S(16));

  await play(
    new M.Indicate(cards[1].age, {
      color: AGE
    }),
    ...say('B: 2 YEARS OLD', AGE)
  );

  // 17. Move two steps up from there.
  await until(S(17));

  await play(
    drawWalk(bVertical, 0.70),
    new M.Transform(
      cursor,
      dotAt(xy(6, 2), AGE, 0.09)
    ),
    ...say('2 STEPS UP', AGE)
  );

  // 18. Put a dot where you land and label it B.
  await until(S(18));

  await play(
    new M.FadeOut(cursor),
    new M.FadeIn(pointB),
    new M.Flash(pointB.submobjects[1], {
      color: C.cyan
    }),
    ...say('THIS DOT IS APARTMENT B')
  );

  // ============================================================
  // 19-23: Introduce features, coordinates and vectors
  // ============================================================

  // 19. Each measurement we record for an apartment
  //     is called a feature.
  await until(S(19));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(cards[1].area, {
          color: AREA
        }),
        new M.Indicate(cards[1].age, {
          color: AGE
        }),
        new M.Indicate(cards[1].rent, {
          color: RENT
        })
      ],
      {
        lagRatio: 0.20,
        runTime: 1.8
      }
    ),
    ...say('FEATURE = A MEASUREMENT', C.green)
  );

  // 20. The numbers that tell us where to place a point
  //     are its coordinates.
  await until(S(20));

  await play(
    ...fbox(
      [
        ['Coordinates of B', C.ink],
        ['6 across', AREA],
        ['2 up', AGE]
      ],
      C.cyan
    ),
    new M.Indicate(pointB, {
      color: C.cyan
    }),
    ...say('COORDINATES = WHERE TO PUT THE DOT')
  );

  // 21. An ordered list of those numbers is called a vector.
  await until(S(21));

  await play(
    ...fbox(
      [
        ['An ordered list', C.ink],
        ['(6, 2)', C.cyan]
      ],
      C.violet
    ),
    ...say('VECTOR = ORDERED LIST', C.violet)
  );

  // 22. Our two-number feature vector for B reads
  //     six, then two.
  await until(S(22));

  await play(
    ...fbox(
      [
        ['Feature vector for B', C.ink],
        ['B = (6, 2)', C.cyan]
      ],
      C.cyan
    ),
    new M.Indicate(pointB, {
      color: C.cyan
    }),
    ...say('B = (6, 2)')
  );

  // 23. The position in the list tells you which feature
  //     a number belongs to.
  await until(S(23));

  await play(
    ...fbox(
      [
        ['B = (6, 2)', C.ink],
        ['1st: area = 6', AREA],
        ['2nd: age  = 2', AGE]
      ],
      C.violet
    ),
    new M.Indicate(cards[1].area, {
      color: AREA
    }),
    new M.Indicate(cards[1].age, {
      color: AGE
    }),
    ...say('AREA FIRST, AGE SECOND', C.violet)
  );

  // ============================================================
  // 24-28: Plot apartments A and C using the same rule
  // ============================================================

  // 24. Now follow the same directions for the other cards.
  await until(S(24));

  await play(
    new M.FadeOut(bCardOutline),
    ...clearBox(),
    ...fadeAll(bHorizontal),
    ...fadeAll(bVertical),
    new M.Indicate(cards[0].heading, {
      color: C.amber
    }),
    new M.Indicate(cards[2].heading, {
      color: C.amber
    }),
    ...say('SAME DIRECTIONS FOR A AND C', C.green)
  );

  const aCardOutline = outline(
    [CARD_X[0], CARD_Y, 0],
    CARD_W + 0.12,
    CARD_H + 0.12,
    C.amber
  );

  // 25. For A, go three steps right from the corner.
  await until(S(25));

  await play(
    new M.Create(aCardOutline),
    new M.Indicate(cards[0].area, {
      color: AREA
    }),
    drawWalk(aHorizontal, 0.85),
    ...say('A: 3 STEPS RIGHT', AREA)
  );

  // 26. Then go fourteen steps up and place its dot.
  await until(S(26));

  await play(
    new M.Indicate(cards[0].age, {
      color: AGE
    }),
    new M.LaggedStart(
      [
        drawWalk(aVertical, 1.05),
        new M.FadeIn(pointA)
      ],
      {
        lagRatio: 0.85,
        runTime: 1.65
      }
    ),
    ...say('A: 14 UP → (3, 14)', AGE)
  );

  const cCardOutline = outline(
    [CARD_X[2], CARD_Y, 0],
    CARD_W + 0.12,
    CARD_H + 0.12,
    C.amber
  );

  // 27. For C, go nine steps right from the corner.
  await until(S(27));

  await play(
    new M.FadeOut(aCardOutline),
    ...fadeAll(aHorizontal),
    ...fadeAll(aVertical),
    new M.Create(cCardOutline),
    new M.Indicate(cards[2].area, {
      color: AREA
    }),
    drawWalk(cHorizontal, 1.15),
    ...say('C: 9 STEPS RIGHT', AREA)
  );

  // 28. Then go fourteen steps up and place its dot.
  await until(S(28));

  await play(
    new M.Indicate(cards[2].age, {
      color: AGE
    }),
    new M.LaggedStart(
      [
        drawWalk(cVertical, 1.05),
        new M.FadeIn(pointC)
      ],
      {
        lagRatio: 0.85,
        runTime: 1.65
      }
    ),
    ...say('C: 14 UP → (9, 14)', AGE)
  );

  // ============================================================
  // 29-32: Compare listings directly on the grid
  // ============================================================

  const ageGuideLeft = new M.DashedLine({
    start: xy(0, 14),
    end: xy(2.75, 14),
    color: AGE,
    strokeWidth: 2.5
  });

  const ageGuideBetween = new M.DashedLine({
    start: xy(3.25, 14),
    end: xy(8.75, 14),
    color: AGE,
    strokeWidth: 2.5
  });

  const ageGuideLabel = pill(
    '14 YEARS',
    AGE,
    P ? 15 : 16
  );

  ageGuideLabel.moveTo([
    xy(6, 14)[0],
    xy(6, 14)[1] - 0.35,
    0
  ]);

  // 29. The A and C dots sit at the same height.
  await until(S(29));

  await play(
    new M.FadeOut(cCardOutline),
    ...fadeAll(cHorizontal),
    ...fadeAll(cVertical),
    new M.Create(ageGuideLeft),
    new M.Create(ageGuideBetween),
    new M.FadeIn(ageGuideLabel),
    new M.Indicate(pointA, {
      color: AGE
    }),
    new M.Indicate(pointC, {
      color: AGE
    }),
    ...say('A AND C: SAME HEIGHT', AGE)
  );

  // 30. Their buildings are the same age.
  await until(S(30));

  await play(
    new M.Indicate(cards[0].age, {
      color: AGE
    }),
    new M.Indicate(cards[2].age, {
      color: AGE
    }),
    ...fbox(
      [
        ['A age = 14 years', AGE],
        ['C age = 14 years', AGE]
      ],
      AGE
    ),
    ...say('SAME HEIGHT = SAME AGE', AGE)
  );

  const diffAge = 10.5;

  const diffLine = lineBetween(
    xy(3, diffAge),
    xy(9, diffAge),
    AREA,
    3
  );

  const diffTicks = [];

  for (let a = 3; a <= 9; a++) {
    const p = xy(a, diffAge);

    diffTicks.push(
      lineBetween(
        [p[0], p[1] - 0.07, 0],
        [p[0], p[1] + 0.07, 0],
        AREA,
        1.8
      )
    );
  }

  const diffGuideA = new M.DashedLine({
    start: xy(3, 13.5),
    end: xy(3, diffAge + 0.25),
    color: AREA
  });

  const diffGuideC = new M.DashedLine({
    start: xy(9, 13.5),
    end: xy(9, diffAge + 0.25),
    color: AREA
  });

  const diffLabel = pill(
    '6 AREA STEPS',
    AREA,
    P ? 15 : 16
  );

  diffLabel.moveTo([
    xy(6, diffAge)[0],
    xy(6, diffAge)[1] - 0.32,
    0
  ]);

  // 31. C sits six area steps farther right than A.
  await until(S(31));

  await play(
    new M.FadeOut(ageGuideLabel),
    new M.Create(diffGuideA),
    new M.Create(diffGuideC),
    new M.Create(diffLine),
    ...diffTicks.map(t => new M.Create(t)),
    new M.FadeIn(diffLabel),
    ...fbox(
      [
        ['C area = 9', AREA],
        ['A area = 3', AREA],
        ['9 - 3 = 6 chunks', C.amber]
      ],
      AREA
    ),
    ...say('C IS 6 AREA STEPS FARTHER RIGHT', AREA)
  );

  // 32. That tells you C has more floor space.
  await until(S(32));

  await play(
    new M.Indicate(cards[2].area, {
      color: AREA
    }),
    new M.Indicate(diffLabel, {
      color: AREA
    }),
    ...fbox(
      [
        ['6 extra area chunks', AREA],
        ['6 × 10 = 60 m² more', C.amber]
      ],
      AREA
    ),
    ...say('FARTHER RIGHT = MORE FLOOR SPACE', AREA)
  );

  // ============================================================
  // 33-38: Feature space and the third feature
  // ============================================================

  // 33. Together the grid lines give us a feature space,
  //     a map with one direction per feature.
  await until(S(33));

  await play(
    new M.FadeOut(ageGuideLeft),
    new M.FadeOut(ageGuideBetween),
    new M.FadeOut(diffGuideA),
    new M.FadeOut(diffGuideC),
    new M.FadeOut(diffLine),
    ...fadeAll(diffTicks),
    new M.FadeOut(diffLabel),
    new M.Indicate(xAxis, {
      color: AREA
    }),
    new M.Indicate(yAxis, {
      color: AGE
    }),
    ...fbox(
      [
        ['FEATURE SPACE', C.ink],
        ['Across: area', AREA],
        ['Up:     age', AGE]
      ],
      C.green
    ),
    ...say('ONE DIRECTION PER FEATURE', C.green)
  );

  // The circled-dot symbol represents a direction pointing
  // out of the page. This is a schematic, not a third plotted
  // axis or a scaled projection of the rent values.

  const rentRing = new M.Circle({
    radius: 0.19,
    color: RENT,
    strokeWidth: 2.6
  });

  rentRing.setFill(C.card, 0.85);
  rentRing.moveTo(ORIGIN);

  const rentCenter = dotAt(
    ORIGIN,
    RENT,
    0.055
  );

  const rentDirection = new M.VGroup(
    rentRing,
    rentCenter
  );

  const depthLabel = pill(
    'RENT: OUT OF PAGE',
    RENT,
    15
  );

  depthLabel.moveTo([
    xy(4.9, 5.4)[0],
    xy(4.9, 5.4)[1],
    0
  ]);

  const depthPointer = new M.DashedLine({
    start: [
      ORIGIN[0] + 0.17,
      ORIGIN[1] + 0.17,
      0
    ],
    end: [
      xy(4.9, 5.4)[0] - depthLabel.getWidth() / 2,
      xy(4.9, 5.4)[1],
      0
    ],
    color: RENT,
    strokeWidth: 1.5
  });

  // 34. Imagine adding a third measuring line for rent
  //     that comes out of the page.
  await until(S(34));

  await play(
    new M.FadeOut(originRing),
    new M.FadeIn(rentDirection),
    new M.Create(depthPointer),
    new M.FadeIn(depthLabel),
    ...fbox(
      [
        ['A third direction', C.ink],
        ['Rent: out of the page', RENT]
      ],
      RENT
    ),
    ...say('IMAGINE A THIRD DIRECTION', RENT)
  );

  // 35. Use one step per dollar in that direction.
  await until(S(35));

  await play(
    new M.Indicate(rentDirection, {
      color: RENT
    }),
    ...fbox(
      [
        ['Rent direction', RENT],
        ['1 step = 1 dollar', RENT],
        ['Depth not drawn', C.muted]
      ],
      RENT
    ),
    ...say('1 RENT STEP = $1', RENT)
  );

  // 36. B's full list reads six for area, two for age,
  //     and eleven hundred for rent.
  await until(S(36));

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(cards[1].area, {
          color: AREA
        }),
        new M.Indicate(cards[1].age, {
          color: AGE
        }),
        new M.Indicate(cards[1].rent, {
          color: RENT
        })
      ],
      {
        lagRatio: 0.25,
        runTime: 2.1
      }
    ),
    ...fbox(
      [
        ['B = (6, 2, 1100)', C.ink],
        ['area, age, rent ($)', C.muted],
        ['3 features', C.green]
      ],
      C.green
    ),
    ...say('B: 6, THEN 2, THEN 1100', C.green)
  );

  // 37. On the flat screen, the dots compare area and age
  //     while the cards show the rents.
  await until(S(37));

  await play(
    new M.FadeOut(rentDirection),
    new M.FadeOut(depthPointer),
    new M.FadeOut(depthLabel),
    new M.LaggedStart(
      [
        new M.Indicate(pointA, {
          color: C.cyan
        }),
        new M.Indicate(pointB, {
          color: C.cyan
        }),
        new M.Indicate(pointC, {
          color: C.cyan
        }),
        ...cards.map(c =>
          new M.Indicate(c.rent, {
            color: RENT
          })
        )
      ],
      {
        lagRatio: 0.12,
        runTime: 2.1
      }
    ),
    ...fbox(
      [
        ['Dots: area and age', C.cyan],
        ['Cards: monthly rent', RENT]
      ],
      C.green
    ),
    ...say('DOTS: 2 FEATURES • CARDS: RENT', C.green)
  );

  // 38. A feature vector lets you compare the same
  //     measurements across listings.
  await until(S(38));

  await play(
    ...fbox(
      [
        ['A = (3, 14, 900)', C.ink],
        ['B = (6, 2, 1100)', C.ink],
        ['C = (9, 14, 1300)', C.ink]
      ],
      C.green
    ),
    ...say('SAME FEATURES, SAME ORDER', C.green)
  );

  // ============================================================
  // 39-40: Common mistake — swapping feature order
  // ============================================================

  // 39. Watch out for changing the order partway through.
  await until(S(39));

  await play(
    ...fbox(
      [
        ['Correct order:', C.green],
        ['1st: area', AREA],
        ['2nd: age', AGE]
      ],
      C.amber
    ),
    ...say('WATCH OUT: KEEP THE ORDER', C.amber)
  );

  const wrongPosition = xy(2, 6);

  const wrongRing = new M.Circle({
    radius: 0.14,
    color: C.amber,
    strokeWidth: 2.5
  });

  wrongRing.setFill(C.amber, 0.18);
  wrongRing.moveTo(wrongPosition);

  const wrongCross1 = lineBetween(
    [
      wrongPosition[0] - 0.08,
      wrongPosition[1] - 0.08,
      0
    ],
    [
      wrongPosition[0] + 0.08,
      wrongPosition[1] + 0.08,
      0
    ],
    C.amber,
    2.5
  );

  const wrongCross2 = lineBetween(
    [
      wrongPosition[0] - 0.08,
      wrongPosition[1] + 0.08,
      0
    ],
    [
      wrongPosition[0] + 0.08,
      wrongPosition[1] - 0.08,
      0
    ],
    C.amber,
    2.5
  );

  const wrongLabel = pill(
    'WRONG',
    C.amber,
    15
  );

  wrongLabel.moveTo([
    wrongPosition[0] + 0.58,
    wrongPosition[1] + 0.28,
    0
  ]);

  const wrongDot = new M.VGroup(
    wrongRing,
    wrongCross1,
    wrongCross2,
    wrongLabel
  );

  const wrongHorizontal = walkSteps(
    0,
    0,
    2,
    0,
    AREA
  );

  const wrongVertical = walkSteps(
    2,
    0,
    2,
    6,
    AGE
  );

  // 40. If you read B's list as age first, you put it
  //     in the wrong place.
  await until(S(40));

  await play(
    new M.LaggedStart(
      [
        drawWalk(wrongHorizontal, 0.45),
        drawWalk(wrongVertical, 0.70),
        new M.FadeIn(wrongDot)
      ],
      {
        lagRatio: 0.70,
        runTime: 1.85
      }
    ),
    ...fbox(
      [
        ['Correct: B = (6, 2)', C.green],
        ['Swapped:   (2, 6)', C.amber],
        ['Different position!', C.amber]
      ],
      C.amber
    ),
    ...say('SWAP THE ORDER → WRONG DOT', C.amber)
  );

  // ============================================================
  // 41-43: Visual prompts for Try it
  // ============================================================

  // 41. In Try it, drag B to match its card.
  await until(S(41));

  await play(
    new M.FadeOut(wrongDot),
    ...fadeAll(wrongHorizontal),
    ...fadeAll(wrongVertical),
    new M.Indicate(cards[1].area, {
      color: AREA
    }),
    new M.Indicate(cards[1].age, {
      color: AGE
    }),
    new M.Indicate(pointB, {
      color: C.green
    }),
    ...fbox(
      [
        ['TRY IT', C.green],
        ['Drag B to match its card', C.ink],
        ['Area first, age second', C.muted]
      ],
      C.green
    ),
    ...say('TRY IT: PLACE B', C.green)
  );

  const tryAgeGuide = new M.DashedLine({
    start: xy(3.25, 14),
    end: xy(8.75, 14),
    color: AGE,
    strokeWidth: 2.5
  });

  // 42. Then find the pair of dots on the same age line.
  await until(S(42));

  await play(
    new M.Create(tryAgeGuide),
    new M.Indicate(pointA, {
      color: AGE
    }),
    new M.Indicate(pointC, {
      color: AGE
    }),
    ...fbox(
      [
        ['TRY IT', C.green],
        ['Find the matching ages', C.ink],
        ['Look for equal height', AGE]
      ],
      C.green
    ),
    ...say('TRY IT: FIND THE SAME AGE', C.green)
  );

  // 43. Tap New data to try placing a fresh set of listings.
  await until(S(43));

  await play(
    new M.FadeOut(tryAgeGuide),
    new M.LaggedStart(
      cards.map(c =>
        new M.Indicate(c.frame, {
          color: C.green
        })
      ),
      {
        lagRatio: 0.15,
        runTime: 1.35
      }
    ),
    ...fbox(
      [
        ['TRY IT', C.green],
        ['Tap New data', C.ink],
        ['Place a fresh set of dots', C.muted]
      ],
      C.green
    ),
    ...say('NEW DATA: TRY OTHER LISTINGS', C.green)
  );

  // ============================================================
  // 44: Final takeaway
  // ============================================================

  // 44. A feature vector puts one apartment's measurements
  //     in a fixed order so you can compare it with others.
  await until(S(44));

  await play(
    ...fbox(
      [
        ['B = (6, 2, 1100)', C.ink],
        ['area, age, rent ($)', C.muted],
        ['Same order for A, B, C', C.green]
      ],
      C.green
    ),
    new M.LaggedStart(
      [
        new M.Indicate(pointA, {
          color: C.cyan
        }),
        new M.Indicate(pointB, {
          color: C.cyan
        }),
        new M.Indicate(pointC, {
          color: C.cyan
        })
      ],
      {
        lagRatio: 0.20,
        runTime: 1.8
      }
    ),
    ...say('FEATURE VECTOR = FIXED ORDER', C.green)
  );
}

// lesson 8.2.7
// Overlap: finding comparable people on both sides.
//
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Fixed chapter snapshot, extended with Depot:
//
// Workplace   Pass count   No-pass count   Pass avg   No-pass avg
// Central          6             2            25           30
// Hill             2             6            45           50
// Depot            2             0            55           --
//
// Central and Hill have observed overlap.
// Depot has no observed no-pass comparison group.
// Depot pass share = 2/2 = 100%.
// Whole-city pass share = 10/18.
//
// An empty group has no observed average, not an average of zero.
// These records alone cannot establish a Depot causal effect.
//
// Try it beats demonstrate hypothetical changes to the same picture.
// Mouse/touch controls belong to the separate interactive exercise;
// the supplied scene API does not specify an interaction interface.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed chapter data
  // ------------------------------------------------------------

  const DEPOT_COLOR = '#55D6BE';

  const DATA = [
    {
      name: 'Central',
      n: 8,
      pass: 6,
      noPass: 2,
      yes: 25,
      no: 30,
      color: C.cyan
    },
    {
      name: 'Hill',
      n: 8,
      pass: 2,
      noPass: 6,
      yes: 45,
      no: 50,
      color: C.violet
    },
    {
      name: 'Depot',
      n: 2,
      pass: 2,
      noPass: 0,
      yes: 55,
      no: null,
      color: DEPOT_COLOR
    }
  ];

  const CITY_N = DATA.reduce(
    (sum, d) => sum + d.n, 0
  );

  const CITY_PASS = DATA.reduce(
    (sum, d) => sum + d.pass, 0
  );

  const CITY_NO = CITY_N - CITY_PASS;

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: board above the formula box.
  // Laptop: board on the left, formula box on the right.
  //
  // All content stays inside the course's safe drawing region.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;

  const PIC_W = P ? 7.10 : 7.10;

  const PILL = P
    ? [0, 3.65, 0]
    : [0, 1.92, 0];

  const BOXP = P
    ? [0, -4.15, 0]
    : [4.25, -0.30, 0];

  const TITLE_Y = P ? 2.95 : 1.49;
  const HEADER_Y = P ? 2.48 : 1.10;

  const ROW_Y = P
    ? [1.52, -0.13, -1.78]
    : [0.43, -0.84, -2.11];

  const ROW_H = P ? 1.42 : 1.12;

  const NAME_X = CX - 2.83;
  const PASS_X = CX - 0.94;
  const NO_X = CX + 1.91;

  const SIDE_W = P ? 2.66 : 2.66;

  const DOT_SP = P ? 0.36 : 0.36;

  const DOT_R = 0.082;
  const HALO_R = 0.165;
  const RING_R = 0.151;

  const DOT_DY = P ? 0.15 : 0.13;
  const COUNT_DY = P ? -0.35 : -0.27;

  const at = (x, y) => [x, y, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Basic visual helpers
  // ------------------------------------------------------------

  function txt(
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

  function rect(
    p,
    w,
    h,
    color = C.muted,
    opacity = 0,
    stroke = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: stroke
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function line(a, b, color = C.muted, stroke = 2.5) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: stroke
    });
  }

  function arrow(start, end, color, stroke = 2.7) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headL = Math.min(0.19, len * 0.35);
    const headW = 0.095;

    const bx = end[0] - ux * headL;
    const by = end[1] - uy * headL;

    const left = at(
      bx - uy * headW,
      by + ux * headW
    );

    const right = at(
      bx + uy * headW,
      by - ux * headW
    );

    return new M.VGroup(
      line(start, end, color, stroke),
      line(left, end, color, stroke),
      line(right, end, color, stroke)
    );
  }

  function fadeAll(items) {
    return items
      .filter(Boolean)
      .map(m => new M.FadeOut(m));
  }

  function lagIn(
    items,
    runTime = 0.85,
    lagRatio = 0.10
  ) {
    return new M.LaggedStart(
      items.map(m => new M.FadeIn(m)),
      { lagRatio, runTime }
    );
  }

  function lagIndicate(
    items,
    color,
    runTime = 0.90
  ) {
    return new M.LaggedStart(
      items.map(m =>
        new M.Indicate(m, { color })
      ),
      { lagRatio: 0.10, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Assemble every new box before adding it to the scene.
  // Never wrap already-visible objects in a new VGroup.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.40 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const maxw = P ? FW - 1.0 : 4.55;

    const rawWidth = Math.max(
      ...texts.map(t => t.getWidth())
    );

    const scale = Math.min(
      1,
      (maxw - 0.64) / Math.max(rawWidth, 0.01)
    );

    texts.forEach(t => {
      if (scale < 1) {
        t.scale(scale);
      }
    });

    // getWidth() ignores a later .scale(): apply it by hand.
    const k = Math.min(1, scale);
    const tw = t => t.getWidth() * k;

    const wd = Math.max(
      2.25,
      Math.max(...texts.map(tw)) + 0.64
    );

    const ht = rows.length * lh + 0.38;

    const r = rect(
      BOXP,
      wd,
      ht,
      color,
      0.96,
      2
    );

    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - 0.19 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo(at(
        left + tw(t) / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    const a = [];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    a.push(new M.FadeIn(g));

    boxNow = g;

    return a;
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
  // Commuter dots
  //
  // Dot color identifies workplace.
  // Amber ring identifies actual pass receipt.
  //
  // Depot has a distinct mint color.
  // Workplace names remain visible alongside color.
  // ------------------------------------------------------------

  function commuter(
    p,
    color,
    hasPass = false,
    scale = 1
  ) {
    const halo = new M.Dot({
      point: p,
      radius: HALO_R * scale,
      color
    });

    halo.setFill(color, 0.17);

    const dot = new M.Dot({
      point: p,
      radius: DOT_R * scale,
      color
    });

    dot.setFill(color, 1);

    const parts = [halo, dot];

    if (hasPass) {
      const ring = new M.Circle({
        radius: RING_R * scale,
        color: C.amber,
        strokeWidth: 2.4
      });

      ring.setFill(C.amber, 0);
      ring.moveTo(p);

      parts.push(ring);
    }

    return new M.VGroup(...parts);
  }

  function sideX(hasPass) {
    return hasPass ? PASS_X : NO_X;
  }

  function dotPosition(
    workplace,
    hasPass,
    index,
    count
  ) {
    return at(
      sideX(hasPass) +
        (index - (count - 1) / 2) * DOT_SP,

      ROW_Y[workplace] + DOT_DY
    );
  }

  // ------------------------------------------------------------
  // Workplace row helpers
  //
  // Each row has two distinct spaces:
  //   WITH PASS | WITHOUT PASS
  //
  // Empty spaces stay visible rather than disappearing.
  // ------------------------------------------------------------

  function makeRowFrame(workplace) {
    return rect(
      at(CX, ROW_Y[workplace]),
      PIC_W,
      ROW_H,
      DATA[workplace].color,
      0.075,
      1.4
    );
  }

  function makeSideFrame(
    workplace,
    hasPass,
    color = null
  ) {
    return rect(
      at(
        sideX(hasPass),
        ROW_Y[workplace]
      ),
      SIDE_W,
      ROW_H - 0.16,
      color || (
        hasPass ? C.amber : C.muted
      ),
      0,
      1.2
    );
  }

  function rowName(workplace) {
    return txt(
      DATA[workplace].name,
      P ? 20 : 18,
      DATA[workplace].color,
      at(
        NAME_X,
        ROW_Y[workplace] + (P ? 0.32 : 0.24)
      ),
      false,
      1.15
    );
  }

  function rowTotal(workplace) {
    return txt(
      `${DATA[workplace].n} people`,
      P ? 17 : 15,
      C.muted,
      at(
        NAME_X,
        ROW_Y[workplace] - (P ? 0.04 : 0.06)
      ),
      true,
      1.25
    );
  }

  function countLabel(
    workplace,
    hasPass,
    count,
    average = null,
    hypothetical = false
  ) {
    let s;

    if (count === 0) {
      s = '0 people';
    } else if (
      average !== null &&
      !hypothetical
    ) {
      s = `${count} • Avg ${average} min`;
    } else {
      s = `${count} ${count === 1 ? 'person' : 'people'}`;
    }

    const color = count === 0
      ? C.amber
      : DATA[workplace].color;

    return txt(
      s,
      P ? 16 : 15,
      color,
      at(
        sideX(hasPass),
        ROW_Y[workplace] + COUNT_DY
      ),
      true,
      SIDE_W - 0.20
    );
  }

  function emptyLabel(workplace, hasPass) {
    return txt(
      'EMPTY',
      P ? 18 : 17,
      C.amber,
      at(
        sideX(hasPass),
        ROW_Y[workplace] + DOT_DY
      ),
      true,
      SIDE_W - 0.25
    );
  }

  function makeSide(
    workplace,
    hasPass,
    count,
    average = null
  ) {
    const people = Array.from(
      { length: count },
      (_, j) => {
        const p = dotPosition(
          workplace,
          hasPass,
          j,
          count
        );

        return {
          workplace,
          pass: hasPass,
          position: p,

          mob: commuter(
            p,
            DATA[workplace].color,
            hasPass
          )
        };
      }
    );

    return {
      workplace,
      hasPass,
      count,
      average,
      people,

      frame: makeSideFrame(
        workplace,
        hasPass
      ),

      label: countLabel(
        workplace,
        hasPass,
        count
      ),

      empty: count === 0
        ? emptyLabel(workplace, hasPass)
        : null,

      revealed: false
    };
  }

  function makeBoard() {
    const rows = DATA.map((d, workplace) => ({
      workplace,
      frame: makeRowFrame(workplace),
      name: rowName(workplace),
      total: rowTotal(workplace),

      pass: makeSide(
        workplace,
        true,
        d.pass,
        d.yes
      ),

      no: makeSide(
        workplace,
        false,
        d.noPass,
        d.no
      )
    }));

    const title = txt(
      'THREE WORKPLACES',
      P ? 21 : 19,
      C.green,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    const passHeader = txt(
      'WITH PASS',
      P ? 19 : 17,
      C.amber,
      at(PASS_X, HEADER_Y),
      true,
      SIDE_W
    );

    const noHeader = txt(
      'WITHOUT PASS',
      P ? 19 : 17,
      C.ink,
      at(NO_X, HEADER_Y),
      true,
      SIDE_W
    );

    const workplaceHeader = txt(
      'WORKPLACE',
      P ? 17 : 15,
      C.muted,
      at(NAME_X, HEADER_Y),
      true,
      1.30
    );

    return {
      rows,
      title,
      passHeader,
      noHeader,
      workplaceHeader,
      splitVisible: false,
      statusTags: []
    };
  }

  function baseBoardObjects(board) {
    return [
      board.title,

      ...board.rows.flatMap(r => [
        r.frame,
        r.name,
        r.total
      ])
    ];
  }

  function splitObjects(board) {
    return [
      board.passHeader,
      board.noHeader,
      board.workplaceHeader,

      ...board.rows.flatMap(r => [
        r.pass.frame,
        r.no.frame
      ])
    ];
  }

  function sideObjects(side) {
    if (!side.revealed) return [];

    return [
      ...side.people.map(p => p.mob),
      side.label,
      side.empty
    ].filter(Boolean);
  }

  function boardObjects(board) {
    return [
      ...baseBoardObjects(board),

      ...(board.splitVisible
        ? splitObjects(board)
        : []),

      ...board.rows.flatMap(r => [
        ...sideObjects(r.pass),
        ...sideObjects(r.no)
      ]),

      ...board.statusTags
    ];
  }

  function revealBase(board) {
    return [
      new M.FadeIn(board.title),

      ...board.rows.map(r =>
        new M.Create(r.frame)
      ),

      ...board.rows.flatMap(r => [
        new M.FadeIn(r.name),
        new M.FadeIn(r.total)
      ])
    ];
  }

  function revealSplit(board) {
    board.splitVisible = true;

    return [
      new M.FadeIn(board.passHeader),
      new M.FadeIn(board.noHeader),
      new M.FadeIn(board.workplaceHeader),

      ...board.rows.flatMap(r => [
        new M.Create(r.pass.frame),
        new M.Create(r.no.frame)
      ])
    ];
  }

  function revealSide(side) {
    side.revealed = true;

    const a = [
      new M.FadeIn(side.label)
    ];

    if (side.people.length > 0) {
      a.push(
        lagIn(
          side.people.map(p => p.mob),
          0.75,
          0.10
        )
      );
    }

    if (side.empty) {
      a.push(new M.FadeIn(side.empty));
    }

    return a;
  }

  function revealWholeBoard(board) {
    return [
      ...revealBase(board),
      ...revealSplit(board),

      ...board.rows.flatMap(r => [
        ...revealSide(r.pass),
        ...revealSide(r.no)
      ])
    ];
  }

  function replaceCountLabel(
    side,
    showAverage = false,
    hypothetical = false
  ) {
    const old = side.label;

    side.label = countLabel(
      side.workplace,
      side.hasPass,
      side.people.length,
      showAverage ? side.average : null,
      hypothetical
    );

    side.count = side.people.length;

    return [
      new M.FadeOut(old),
      new M.FadeIn(side.label)
    ];
  }

  // ------------------------------------------------------------
  // Highlight helpers
  //
  // Coordinate-based outlines prevent accidental detachment
  // of existing commuter markers.
  // ------------------------------------------------------------

  function sideOutline(
    workplace,
    hasPass,
    color = C.green
  ) {
    return rect(
      at(
        sideX(hasPass),
        ROW_Y[workplace]
      ),
      SIDE_W + 0.07,
      ROW_H - 0.07,
      color,
      0,
      2.5
    );
  }

  function rowOutline(
    workplace,
    color = C.green
  ) {
    return rect(
      at(CX, ROW_Y[workplace]),
      PIC_W + 0.06,
      ROW_H + 0.05,
      color,
      0,
      2.5
    );
  }

  function columnOutline(
    hasPass,
    color = C.green
  ) {
    const top =
      ROW_Y[0] + ROW_H / 2;

    const bottom =
      ROW_Y[2] - ROW_H / 2;

    return rect(
      at(
        sideX(hasPass),
        (top + bottom) / 2
      ),
      SIDE_W + 0.09,
      top - bottom + 0.06,
      color,
      0,
      2.5
    );
  }

  function checkMark(p, color = C.green) {
    const [x, y] = p;

    return new M.VGroup(
      line(
        at(x - 0.11, y),
        at(x - 0.025, y - 0.10),
        color,
        3.0
      ),

      line(
        at(x - 0.025, y - 0.10),
        at(x + 0.15, y + 0.14),
        color,
        3.0
      )
    );
  }

  function crossMark(p, color = C.amber) {
    const [x, y] = p;
    const r = 0.115;

    return new M.VGroup(
      line(
        at(x - r, y - r),
        at(x + r, y + r),
        color,
        3.4
      ),

      line(
        at(x - r, y + r),
        at(x + r, y - r),
        color,
        3.4
      )
    );
  }

  function overlapStatus(workplace, hasOverlap) {
    const y =
      ROW_Y[workplace] -
      (P ? 0.42 : 0.36);

    const p = at(
      NAME_X,
      y
    );

    return hasOverlap
      ? checkMark(p, C.green)
      : crossMark(p, C.amber);
  }

  function addStatus(
    board,
    workplace,
    hasOverlap
  ) {
    const marker = overlapStatus(
      workplace,
      hasOverlap
    );

    board.statusTags.push(marker);

    return [
      new M.FadeIn(marker)
    ];
  }

  // ------------------------------------------------------------
  // 0-1: introduce the additional Depot commuters
  // ------------------------------------------------------------

  const depotIntroP = at(
    CX,
    P ? 1.00 : -0.13
  );

  const depotIntroFrame = rect(
    depotIntroP,
    4.50,
    P ? 2.70 : 2.42,
    DEPOT_COLOR,
    0.95,
    2
  );

  const depotIntroTitle = txt(
    'DEPOT',
    P ? 27 : 25,
    DEPOT_COLOR,
    at(
      CX,
      depotIntroP[1] + 0.86
    ),
    true
  );

  const depotIntroDots = [
    commuter(
      at(CX - 0.62, depotIntroP[1] + 0.06),
      DEPOT_COLOR,
      true,
      1.65
    ),

    commuter(
      at(CX + 0.62, depotIntroP[1] + 0.06),
      DEPOT_COLOR,
      true,
      1.65
    )
  ];

  const depotIntroCount = txt(
    '2 commuters • Both with passes',
    P ? 19 : 18,
    C.ink,
    at(
      CX,
      depotIntroP[1] - 0.66
    ),
    false,
    4.05
  );

  const introQuestion = txt(
    'Where are the comparable nonholders?',
    P ? 21 : 19,
    C.amber,
    at(
      CX,
      P ? -1.00 : -1.83
    ),
    false,
    PIC_W
  );

  const introObjects = [
    depotIntroFrame,
    depotIntroTitle,
    ...depotIntroDots,
    depotIntroCount,
    introQuestion
  ];

  // 0: the city adds commuters from Depot.
  await until(S(0));
  await play(
    new M.FadeIn(depotIntroFrame),
    new M.FadeIn(depotIntroTitle),
    lagIn(depotIntroDots, 0.75, 0.18),
    new M.FadeIn(depotIntroCount),
    ...say(
      'A THIRD WORKPLACE: DEPOT',
      DEPOT_COLOR
    )
  );

  // 1: ask whether comparable no-pass commuters exist.
  await until(S(1));
  await play(
    new M.FadeIn(introQuestion),

    ...fbox([
      ['THE QUESTION', C.green],
      'Can we compare Depot',
      'pass holders with similar',
      'people without passes?'
    ], C.green),

    ...say(
      'CAN WE FIND PEOPLE LIKE THEM?',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 2-9: build the three-workplace comparison picture
  // ------------------------------------------------------------

  let board = makeBoard();

  const central = board.rows[0];
  const hill = board.rows[1];
  const depot = board.rows[2];

  // 2: draw a row for Central, Hill and Depot.
  await until(S(2));
  await play(
    ...fadeAll(introObjects),
    ...clearBox(),
    ...revealBase(board),

    ...say(
      'ONE ROW FOR EACH WORKPLACE'
    )
  );

  // 3: split each row into pass and no-pass spaces.
  await until(S(3));
  await play(
    ...revealSplit(board),

    ...fbox([
      ['TWO SPACES IN EACH ROW', C.green],
      ['Received a pass', C.amber],
      'Did not receive a pass'
    ], C.green),

    ...say(
      'WITH PASS | WITHOUT PASS',
      C.amber
    )
  );

  // 4: Central has six pass holders.
  await until(S(4));
  await play(
    ...revealSide(central.pass),

    ...fbox([
      ['CENTRAL', C.cyan],
      ['With pass: 6', C.amber]
    ], C.cyan),

    ...say(
      'CENTRAL: 6 WITH PASSES',
      C.cyan
    )
  );

  // 5: Central has two nonholders.
  await until(S(5));
  await play(
    ...revealSide(central.no),

    ...fbox([
      ['CENTRAL', C.cyan],
      'With pass:    6',
      'Without pass: 2'
    ], C.cyan),

    ...say(
      'CENTRAL: 2 WITHOUT PASSES',
      C.cyan
    )
  );

  // 6: Hill has two pass holders.
  await until(S(6));
  await play(
    ...revealSide(hill.pass),

    ...fbox([
      ['HILL', C.violet],
      ['With pass: 2', C.amber]
    ], C.violet),

    ...say(
      'HILL: 2 WITH PASSES',
      C.violet
    )
  );

  // 7: Hill has six nonholders.
  await until(S(7));
  await play(
    ...revealSide(hill.no),

    ...fbox([
      ['HILL', C.violet],
      'With pass:    2',
      'Without pass: 6'
    ], C.violet),

    ...say(
      'HILL: 6 WITHOUT PASSES',
      C.violet
    )
  );

  // 8: both Depot commuters have passes.
  await until(S(8));
  await play(
    ...revealSide(depot.pass),

    ...fbox([
      ['DEPOT', DEPOT_COLOR],
      '2 commuters',
      ['Both received a pass.', C.amber]
    ], DEPOT_COLOR),

    ...say(
      'DEPOT: BOTH DOTS GO ON THE PASS SIDE',
      DEPOT_COLOR
    )
  );

  // 9: leave Depot's no-pass space empty.
  const missingDepot = sideOutline(
    2,
    false,
    C.amber
  );

  await until(S(9));
  await play(
    ...revealSide(depot.no),
    new M.Create(missingDepot),

    ...fbox([
      ['DEPOT', DEPOT_COLOR],
      'With pass:    2',
      ['Without pass: 0', C.amber],
      'The second space is empty.'
    ], C.amber),

    ...say(
      'DEPOT HAS NO NO-PASS COMMUTERS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 10-12: a missing comparison average
  // ------------------------------------------------------------

  const depotPassOutline = sideOutline(
    2,
    true,
    DEPOT_COLOR
  );

  // 10: the observed Depot pass average is 55 minutes.
  await until(S(10));
  await play(
    new M.FadeOut(missingDepot),
    new M.Create(depotPassOutline),
    ...replaceCountLabel(depot.pass, true),

    ...fbox([
      ['DEPOT • WITH PASS', DEPOT_COLOR],
      '2 commuters',
      ['Average commute = 55 min', C.amber]
    ], DEPOT_COLOR),

    ...say(
      'DEPOT PASS AVERAGE: 55 MINUTES',
      DEPOT_COLOR
    )
  );

  const unknownOutline = sideOutline(
    2,
    false,
    C.amber
  );

  // 11: search for the corresponding no-pass average.
  await until(S(11));
  await play(
    new M.FadeOut(depotPassOutline),
    new M.Create(unknownOutline),

    new M.Indicate(
      depot.no.empty,
      { color: C.amber }
    ),

    ...fbox([
      ['DEPOT COMPARISON', DEPOT_COLOR],
      'With pass:    55 min',
      ['Without pass: ?', C.amber],
      'Where is the other average?'
    ], C.amber),

    ...say(
      'FIND DEPOT’S NO-PASS AVERAGE',
      C.amber
    )
  );

  const missingAverageLabel = txt(
    'No observed average',
    P ? 17 : 15,
    C.amber,
    at(
      NO_X,
      ROW_Y[2] + COUNT_DY
    ),
    false,
    SIDE_W - 0.18
  );

  // 12: no observations means no observed average.
  //
  // Do not write 0 minutes.
  // Do not divide by zero.
  // Do not invent a comparison value.
  await until(S(12));
  await play(
    new M.FadeOut(depot.no.label),
    new M.FadeIn(missingAverageLabel),

    ...fbox([
      ['MISSING AVERAGE', C.amber],
      'No-pass count = 0',
      'No no-pass average exists',
      'in these records.',
      ['Missing does not mean zero.', C.amber]
    ], C.amber),

    ...say(
      'EMPTY GROUP = NO OBSERVED AVERAGE',
      C.amber
    )
  );

  depot.no.label = missingAverageLabel;

  // ------------------------------------------------------------
  // 13-17: identify overlap at Central and Hill
  // ------------------------------------------------------------

  const centralBoth = rowOutline(
    0,
    C.green
  );

  const hillBoth = rowOutline(
    1,
    C.green
  );

  // 13: Central has dots in both spaces.
  await until(S(13));
  await play(
    new M.FadeOut(unknownOutline),
    new M.Create(centralBoth),

    lagIndicate(
      [
        ...central.pass.people.map(p => p.mob),
        ...central.no.people.map(p => p.mob)
      ],
      C.green,
      1.05
    ),

    ...fbox([
      ['CENTRAL', C.cyan],
      'With pass:    6 people',
      'Without pass: 2 people',
      ['Both sides exist.', C.green]
    ], C.green),

    ...say(
      'CENTRAL HAS DOTS ON BOTH SIDES',
      C.green
    )
  );

  // 14: both observed averages are available at Central.
  await until(S(14));
  await play(
    ...replaceCountLabel(central.pass, true),
    ...replaceCountLabel(central.no, true),
    ...addStatus(board, 0, true),

    ...fbox([
      ['CENTRAL COMPARISON', C.cyan],
      'With pass:    25 min',
      'Without pass: 30 min',
      ['25 − 30 = −5 minutes', C.green],
      'An observed comparison.'
    ], C.green),

    ...say(
      'CENTRAL GIVES US BOTH SIDES',
      C.green
    )
  );

  // 15: Hill also supplies both observed averages.
  await until(S(15));
  await play(
    new M.FadeOut(centralBoth),
    new M.Create(hillBoth),

    ...replaceCountLabel(hill.pass, true),
    ...replaceCountLabel(hill.no, true),

    ...addStatus(board, 1, true),

    ...fbox([
      ['HILL COMPARISON', C.violet],
      'With pass:    45 min',
      'Without pass: 50 min',
      ['45 − 50 = −5 minutes', C.green],
      'An observed comparison.'
    ], C.green),

    ...say(
      'HILL ALSO HAS BOTH SIDES',
      C.green
    )
  );

  // 16: define overlap.
  const overlapTitle = txt(
    'OVERLAP',
    P ? 23 : 21,
    C.green,
    at(CX, TITLE_Y),
    true
  );

  const centralOverlapFrame = rowOutline(
    0,
    C.green
  );

  const hillOverlapFrame = rowOutline(
    1,
    C.green
  );

  await until(S(16));
  await play(
    new M.FadeOut(board.title),
    new M.FadeIn(overlapTitle),

    new M.FadeOut(hillBoth),

    new M.Create(centralOverlapFrame),
    new M.Create(hillOverlapFrame),

    ...fbox([
      ['OVERLAP', C.green],
      'People like the ones',
      'we want to compare',
      ['appear on both sides.', C.green]
    ], C.green),

    ...say(
      'OVERLAP = COMPARABLE PEOPLE ON BOTH SIDES',
      C.green
    )
  );

  board.title = overlapTitle;

  // 17: Central and Hill have overlap; Depot has none.
  const depotNoOverlapFrame = rowOutline(
    2,
    C.amber
  );

  await until(S(17));
  await play(
    new M.Create(depotNoOverlapFrame),
    ...addStatus(board, 2, false),

    ...fbox([
      ['CHECK EACH WORKPLACE', C.green],
      ['Central: overlap', C.green],
      ['Hill: overlap', C.green],
      ['Depot: no observed overlap', C.amber]
    ], C.green),

    ...say(
      'CENTRAL AND HILL: YES • DEPOT: NO',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 18-19: Depot's observed pass share
  //
  // Both of the two recorded Depot commuters received passes.
  // The observed share is 100%, not necessarily the true
  // long-run probability of receiving a pass.
  // ------------------------------------------------------------

  // 18: divide the pass count by the workplace count.
  await until(S(18));
  await play(
    new M.FadeOut(centralOverlapFrame),
    new M.FadeOut(hillOverlapFrame),

    lagIndicate(
      depot.pass.people.map(p => p.mob),
      C.amber,
      0.75
    ),

    ...fbox([
      ['DEPOT PASS SHARE', DEPOT_COLOR],
      'Number with passes',
      '÷ Number at Depot',
      ['= 2 ÷ 2', C.amber]
    ], DEPOT_COLOR),

    ...say(
      'DEPOT PASS SHARE = 2 OUT OF 2',
      DEPOT_COLOR
    )
  );

  // 19: the recorded pass share is 100 percent.
  await until(S(19));
  await play(
    ...fbox([
      ['DEPOT PASS SHARE', DEPOT_COLOR],
      '2/2 = 1',
      ['= 100%', C.amber],
      'Every Depot commuter',
      'in these records.'
    ], C.amber),

    ...say(
      '100% OF RECORDED DEPOT COMMUTERS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 20-22: both groups exist across the whole city
  //
  // Central: 6 pass + 2 no pass.
  // Hill:    2 pass + 6 no pass.
  // Depot:   2 pass + 0 no pass.
  //
  // Pass count = 6 + 2 + 2 = 10.
  // No-pass count = 2 + 6 + 0 = 8.
  // Total = 18.
  // ------------------------------------------------------------

  const cityPassOutline = columnOutline(
    true,
    C.amber
  );

  const cityNoOutline = columnOutline(
    false,
    C.green
  );

  // 20: broaden attention to the entire city.
  await until(S(20));
  await play(
    new M.FadeOut(depotNoOverlapFrame),
    new M.Create(cityPassOutline),
    new M.Create(cityNoOutline),

    ...fbox([
      ['WHOLE CITY', C.green],
      'Central + Hill + Depot',
      '8 + 8 + 2',
      ['= 18 commuters', C.green]
    ], C.green),

    ...say(
      'NOW LOOK AT ALL 18 COMMUTERS'
    )
  );

  // 21: ten have passes and eight do not.
  await until(S(21));
  await play(
    new M.Indicate(
      board.passHeader,
      { color: C.amber }
    ),

    new M.Indicate(
      board.noHeader,
      { color: C.green }
    ),

    ...fbox([
      ['WHOLE-CITY COUNTS', C.green],
      ['Pass: 6 + 2 + 2 = 10', C.amber],
      'No pass: 2 + 6 + 0 = 8',
      `Total: ${CITY_N}`,
      ['Pass share = 10/18', C.green]
    ], C.green),

    ...say(
      '10 WITH PASSES • 8 WITHOUT',
      C.amber
    )
  );

  // 22: both city-wide groups exist despite the empty Depot cell.
  const cityEmptyWarning = sideOutline(
    2,
    false,
    C.amber
  );

  await until(S(22));
  await play(
    new M.Create(cityEmptyWarning),

    ...fbox([
      ['BOTH CITY GROUPS EXIST', C.green],
      '10 with passes',
      '8 without passes',
      ['BUT Depot has no', C.amber],
      ['no-pass comparison group.', C.amber]
    ], C.amber),

    ...say(
      'CITY-WIDE GROUPS DO NOT GUARANTEE ROW OVERLAP',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 23-24: why borrowing Hill commuters is not a fair solution
  //
  // A temporary dashed outline and arrow visualize the idea
  // of borrowing a comparison.
  //
  // The Hill commuter remains a Hill commuter.
  // No actual data are moved or reassigned in this section.
  // ------------------------------------------------------------

  const borrowedPerson = hill.no.people[
    hill.no.people.length - 1
  ];

  const borrowSource = at(
    borrowedPerson.position[0],
    borrowedPerson.position[1]
  );

  const borrowTarget = at(
    NO_X + 0.88,
    ROW_Y[2] + DOT_DY
  );

  const borrowedOutline = rect(
    borrowSource,
    0.40,
    0.40,
    C.violet,
    0,
    2.3
  );

  const borrowedPath = new M.DashedLine({
    start: at(
      borrowSource[0],
      borrowSource[1] - 0.20
    ),

    end: at(
      borrowTarget[0],
      borrowTarget[1] + 0.17
    ),

    color: C.violet,
    strokeWidth: 2.8
  });

  const ghostHalo = new M.Dot({
    point: borrowTarget,
    radius: 0.17,
    color: C.violet
  });

  ghostHalo.setFill(C.violet, 0.08);

  const ghostDot = new M.Circle({
    radius: 0.095,
    color: C.violet,
    strokeWidth: 2
  });

  ghostDot.setFill(C.violet, 0.07);
  ghostDot.moveTo(borrowTarget);

  const ghost = new M.VGroup(
    ghostHalo,
    ghostDot
  );

  const borrowQuestion = txt(
    'Borrow a Hill commuter?',
    P ? 19 : 17,
    C.violet,
    at(CX, TITLE_Y),
    false,
    PIC_W
  );

  // 23: suggest borrowing a Hill nonholder as a stand-in.
  await until(S(23));
  await play(
    new M.FadeOut(cityPassOutline),
    new M.FadeOut(cityNoOutline),

    new M.FadeOut(board.title),
    new M.FadeIn(borrowQuestion),

    new M.Create(borrowedOutline),
    new M.Create(borrowedPath),
    new M.FadeIn(ghost),

    ...fbox([
      ['COULD WE BORROW FROM HILL?', C.violet],
      'Hill no-pass average = 50',
      'Depot pass average = 55',
      ['Is Hill a fair stand-in?', C.amber]
    ], C.violet),

    ...say(
      'COULD HILL STAND IN FOR DEPOT?',
      C.violet
    )
  );

  board.title = borrowQuestion;

  const borrowCross = crossMark(
    at(
      (borrowSource[0] + borrowTarget[0]) / 2,
      (borrowSource[1] + borrowTarget[1]) / 2
    ),
    C.amber
  );

  const roadsNote = txt(
    'Different roads?',
    P ? 18 : 16,
    C.amber,
    P
      ? at(CX - 1.65, -2.85)
      : at(4.25, 1.12),
    false,
    2.80
  );

  const jobsNote = txt(
    'Different jobs?',
    P ? 18 : 16,
    C.amber,
    P
      ? at(CX + 1.65, -2.85)
      : at(4.25, 0.72),
    false,
    2.80
  );

  // 24: the workplaces may differ in relevant ways.
  await until(S(24));
  await play(
    new M.FadeIn(borrowCross),
    new M.FadeIn(roadsNote),
    new M.FadeIn(jobsNote),

    ...fbox([
      ['NOT A FAIR SUBSTITUTE', C.amber],
      'Hill and Depot may differ',
      'in roads, jobs or other ways.',
      ['Borrowing would be a guess.', C.amber]
    ], C.amber),

    ...say(
      'DIFFERENT WORKPLACES MAY NOT BE COMPARABLE',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 25-26: where can we make an observed comparison?
  // ------------------------------------------------------------

  const supportedTitle = txt(
    'WHERE IS A COMPARISON AVAILABLE?',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const supportedCentral = rowOutline(
    0,
    C.green
  );

  const supportedHill = rowOutline(
    1,
    C.green
  );

  // 25: Central and Hill provide within-workplace comparisons.
  await until(S(25));
  await play(
    ...fadeAll([
      borrowedOutline,
      borrowedPath,
      ghost,
      borrowCross,
      roadsNote,
      jobsNote,
      cityEmptyWarning,
      board.title
    ]),

    new M.FadeIn(supportedTitle),
    new M.Create(supportedCentral),
    new M.Create(supportedHill),

    ...fbox([
      ['COMPARISONS WE CAN DESCRIBE', C.green],
      ['Central: 25 − 30 = −5', C.cyan],
      ['Hill: 45 − 50 = −5', C.violet],
      'Both sides are observed.',
      'Fairness still needs assumptions.'
    ], C.green),

    ...say(
      'CENTRAL AND HILL GIVE BOTH SIDES',
      C.green
    )
  );

  board.title = supportedTitle;

  const unsupportedDepot = rowOutline(
    2,
    C.amber
  );

  // 26: more suitable records are needed for a Depot effect.
  await until(S(26));
  await play(
    new M.FadeOut(supportedCentral),
    new M.FadeOut(supportedHill),
    new M.Create(unsupportedDepot),

    ...fbox([
      ['DEPOT', DEPOT_COLOR],
      'Observed pass average: 55',
      ['No-pass average: missing', C.amber],
      'Need suitable comparison data.',
      ['No Depot effect from these alone.', C.amber]
    ], C.amber),

    ...say(
      'DEPOT NEEDS MORE COMPARABLE RECORDS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 27: observed lack of overlap can happen by chance
  //
  // The current Depot sample contains only two people.
  // We do not know the true pass-receipt probability.
  //
  // Show possible small samples symbolically:
  // both pass, one of each, both no pass.
  // These are hypothetical possibilities, not new records.
  // ------------------------------------------------------------

  const smallSampleTitle = txt(
    'ONLY TWO RECORDED DEPOT COMMUTERS',
    P ? 19 : 18,
    DEPOT_COLOR,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const SAMPLE_X = [
    CX - 2.22,
    CX,
    CX + 2.22
  ];

  const SAMPLE_Y = P ? 0.80 : -0.40;

  function sampleCard(
    x,
    statuses,
    label,
    observed = false
  ) {
    const w = 2.02;
    const h = P ? 2.05 : 1.90;

    const color = observed
      ? C.amber
      : C.muted;

    const r = rect(
      at(x, SAMPLE_Y),
      w,
      h,
      color,
      0.94,
      observed ? 2.4 : 1.4
    );

    const dots = statuses.map((hasPass, j) =>
      commuter(
        at(
          x + (j - 0.5) * 0.63,
          SAMPLE_Y + 0.26
        ),
        DEPOT_COLOR,
        hasPass,
        1.3
      )
    );

    const labelText = txt(
      label,
      P ? 17 : 16,
      C.ink,
      at(
        x,
        SAMPLE_Y - 0.30
      ),
      false,
      w - 0.20
    );

    const type = txt(
      observed ? 'OBSERVED' : 'POSSIBLE',
      P ? 14 : 13,
      color,
      at(
        x,
        SAMPLE_Y - 0.67
      ),
      true,
      w - 0.20
    );

    return new M.VGroup(
      r,
      ...dots,
      labelText,
      type
    );
  }

  const smallSamples = [
    sampleCard(
      SAMPLE_X[0],
      [true, true],
      'Both pass',
      true
    ),

    sampleCard(
      SAMPLE_X[1],
      [true, false],
      'One of each'
    ),

    sampleCard(
      SAMPLE_X[2],
      [false, false],
      'Neither pass'
    )
  ];

  const chanceNote = txt(
    'A small sample may miss one group by chance.',
    P ? 19 : 18,
    C.amber,
    at(
      CX,
      P ? -0.82 : -1.83
    ),
    false,
    PIC_W
  );

  await until(S(27));
  await play(
    ...fadeAll([
      ...boardObjects(board),
      unsupportedDepot
    ]),

    new M.FadeIn(smallSampleTitle),
    lagIn(smallSamples, 1.10, 0.17),
    new M.FadeIn(chanceNote),

    ...fbox([
      ['SMALL SAMPLES', C.amber],
      'Only 2 Depot commuters.',
      'An empty side may happen',
      'simply by chance.',
      'The true chance is unknown.'
    ], C.amber),

    ...say(
      'AN EMPTY SPACE CAN OCCUR BY CHANCE',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 28: overlap defines the reach of our comparison
  // ------------------------------------------------------------

  board = makeBoard();

  const reachTitle = txt(
    'WHO CAN OUR COMPARISON DESCRIBE?',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  board.title = reachTitle;

  const reachCentral = rowOutline(
    0,
    C.green
  );

  const reachHill = rowOutline(
    1,
    C.green
  );

  const reachDepot = rowOutline(
    2,
    C.amber
  );

  await until(S(28));
  await play(
    ...fadeAll([
      smallSampleTitle,
      ...smallSamples,
      chanceNote
    ]),

    ...revealWholeBoard(board),

    new M.Create(reachCentral),
    new M.Create(reachHill),
    new M.Create(reachDepot),

    ...addStatus(board, 0, true),
    ...addStatus(board, 1, true),
    ...addStatus(board, 2, false),

    ...fbox([
      ['CHECK THE REACH OF OUR ANSWER', C.green],
      ['Central + Hill: both groups', C.green],
      ['Depot: one group missing', C.amber],
      'Say which people your',
      'comparison describes.'
    ], C.green),

    ...say(
      'OVERLAP TELLS US WHO OUR ANSWER CAN DESCRIBE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 29: common trap
  //
  // Whole-city overlap does not establish overlap within
  // every workplace or every relevant combination of features.
  // ------------------------------------------------------------

  const trapPass = columnOutline(
    true,
    C.green
  );

  const trapNo = columnOutline(
    false,
    C.green
  );

  const trapEmpty = sideOutline(
    2,
    false,
    C.amber
  );

  await until(S(29));
  await play(
    new M.FadeOut(reachCentral),
    new M.FadeOut(reachHill),
    new M.FadeOut(reachDepot),

    new M.Create(trapPass),
    new M.Create(trapNo),
    new M.Create(trapEmpty),

    ...fbox([
      ['COMMON TRAP', C.amber],
      'Both city groups exist.',
      'That does NOT mean',
      'both groups exist',
      ['at every workplace.', C.amber]
    ], C.amber),

    ...say(
      'CHECK EVERY ROW, NOT JUST THE CITY TOTAL',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // Try it helpers
  //
  // Simulate moving one commuter between receipt groups.
  //
  // The animated exercise changes hypothetical receipt counts.
  // It does not create new observed commute times.
  //
  // Commuter identity and workplace are preserved.
  // Group averages are suppressed in hypothetical boards.
  // ------------------------------------------------------------

  function moveBetweenSides(
    board,
    workplace,
    fromPass,
    index = 0
  ) {
    const row = board.rows[workplace];

    const from = fromPass
      ? row.pass
      : row.no;

    const to = fromPass
      ? row.no
      : row.pass;

    if (
      from.people.length === 0 ||
      index >= from.people.length
    ) {
      return [];
    }

    const person = from.people.splice(
      index,
      1
    )[0];

    person.pass = !fromPass;

    to.people.push(person);

    const animations = [];

    // Remove a destination EMPTY label when its first
    // commuter arrives.

    if (to.empty) {
      animations.push(
        new M.FadeOut(to.empty)
      );

      to.empty = null;
    }

    // Recenter all dots in the source side.

    from.people.forEach((p, j) => {
      const target = dotPosition(
        workplace,
        fromPass,
        j,
        from.people.length
      );

      p.position = target;

      animations.push(
        new M.Transform(
          p.mob,
          commuter(
            target,
            DATA[workplace].color,
            fromPass
          ),
          { runTime: 0.95 }
        )
      );
    });

    // Recenter all dots in the destination side.
    // The moved dot follows a curved path.

    to.people.forEach((p, j) => {
      const target = dotPosition(
        workplace,
        !fromPass,
        j,
        to.people.length
      );

      p.position = target;

      animations.push(
        new M.Transform(
          p.mob,
          commuter(
            target,
            DATA[workplace].color,
            !fromPass
          ),
          {
            pathArc: p === person
              ? -0.38
              : 0,

            runTime: 1.20
          }
        )
      );
    });

    // If the source side became empty, reveal its EMPTY label.

    if (from.people.length === 0) {
      from.empty = emptyLabel(
        workplace,
        fromPass
      );

      animations.push(
        new M.FadeIn(from.empty)
      );
    }

    // Hypothetical receipt changes do not imply new averages.

    from.average = null;
    to.average = null;

    animations.push(
      ...replaceCountLabel(
        from,
        false,
        true
      ),

      ...replaceCountLabel(
        to,
        false,
        true
      )
    );

    return animations;
  }

  function replaceStatus(
    board,
    workplace,
    hasOverlap
  ) {
    const old = board.statusTags[workplace];

    const next = overlapStatus(
      workplace,
      hasOverlap
    );

    board.statusTags[workplace] = next;

    return [
      ...(old
        ? [new M.FadeOut(old)]
        : []),

      new M.FadeIn(next)
    ];
  }

  function boardCounts(board) {
    return board.rows.map(r => ({
      pass: r.pass.people.length,
      no: r.no.people.length
    }));
  }

  // ------------------------------------------------------------
  // 30-31: preview Try it with the fixed chapter picture
  // ------------------------------------------------------------

  let tryBoard = makeBoard();

  tryBoard.title = txt(
    'TRY IT: MOVE COMMUTER DOTS',
    P ? 19 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const tryInstruction = txt(
    'Move a dot between its workplace’s two spaces.',
    P ? 17 : 16,
    C.muted,
    P
      ? at(CX, -2.86)
      : at(4.25, -1.85),
    false,
    P ? PIC_W : 4.60
  );

  // 30: preview the interactive task.
  await until(S(30));
  await play(
    ...fadeAll([
      ...boardObjects(board),
      trapPass,
      trapNo,
      trapEmpty
    ]),

    ...revealWholeBoard(tryBoard),

    ...addStatus(tryBoard, 0, true),
    ...addStatus(tryBoard, 1, true),
    ...addStatus(tryBoard, 2, false),

    new M.FadeIn(tryInstruction),

    ...fbox([
      ['TRY IT', C.green],
      'Move commuter dots.',
      'Watch the counts update.',
      'Which rows have both sides?',
      'Which rows have an empty side?'
    ], C.green),

    ...say(
      'TRY IT: CHANGE THE RECEIPT COUNTS',
      C.green
    )
  );

  const tryEmpty = sideOutline(
    2,
    false,
    C.amber
  );

  // 31: identify the workplace with an empty side.
  await until(S(31));
  await play(
    new M.Create(tryEmpty),

    new M.Indicate(
      tryBoard.rows[2].no.empty,
      { color: C.amber }
    ),

    ...fbox([
      ['CHALLENGE 1', C.green],
      'Which workplace',
      'has an empty side?',
      ['Answer: Depot.', DEPOT_COLOR],
      '2 with pass, 0 without.'
    ], C.green),

    ...say(
      'FIND THE WORKPLACE WITH AN EMPTY SIDE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 32: move one Depot dot across
  //
  // Clearly hypothetical change:
  //
  // Depot before: 2 pass, 0 no pass.
  // Depot after:  1 pass, 1 no pass.
  //
  // Both sides now contain a commuter in the picture.
  // No hypothetical commute average is calculated.
  // ------------------------------------------------------------

  const imaginedTag = pill(
    'HYPOTHETICAL COUNTS',
    C.violet,
    P ? 17 : 16
  );

  imaginedTag.moveTo(
    P
      ? at(CX, -2.86)
      : at(4.25, -1.85)
  );

  const tryDepotOverlap = rowOutline(
    2,
    C.green
  );

  await until(S(32));
  await play(
    new M.FadeOut(tryEmpty),
    new M.FadeOut(tryInstruction),
    new M.FadeIn(imaginedTag),

    ...moveBetweenSides(
      tryBoard,
      2,
      true,
      1
    ),

    ...replaceStatus(
      tryBoard,
      2,
      true
    ),

    new M.Create(tryDepotOverlap),

    ...fbox([
      ['CHALLENGE 2', C.green],
      ['Imagined Depot counts:', DEPOT_COLOR],
      'Before: 2 pass, 0 no pass',
      'After:  1 pass, 1 no pass',
      ['Now both sides exist.', C.green]
    ], C.green),

    ...say(
      'MOVE ONE DEPOT DOT: BOTH SIDES NOW EXIST',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 33: New data preview
  //
  // Introduce a separate hypothetical count picture.
  // It is NOT a replacement for the observed chapter records.
  //
  // Central: 6 pass, 2 no pass.
  // Hill:    0 pass, 8 no pass.
  // Depot:   1 pass, 1 no pass.
  //
  // The newly empty space is Hill's pass side.
  // No commute times are invented.
  // ------------------------------------------------------------

  function makeHypotheticalBoard(counts) {
    const b = makeBoard();

    b.title = txt(
      'NEW DATA • IMAGINED COUNTS',
      P ? 19 : 18,
      C.violet,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    counts.forEach((n, workplace) => {
      b.rows[workplace].pass = makeSide(
        workplace,
        true,
        n,
        null
      );

      b.rows[workplace].no = makeSide(
        workplace,
        false,
        DATA[workplace].n - n,
        null
      );
    });

    return b;
  }

  const freshBoard = makeHypotheticalBoard([
    6,
    0,
    1
  ]);

  const newDataTag = pill(
    'NEW DATA',
    C.green,
    P ? 18 : 17
  );

  newDataTag.moveTo(
    P
      ? at(CX, -2.86)
      : at(4.25, -1.85)
  );

  const freshEmpty = sideOutline(
    1,
    true,
    C.amber
  );

  await until(S(33));
  await play(
    ...fadeAll([
      ...boardObjects(tryBoard),
      tryDepotOverlap,
      imaginedTag
    ]),

    ...revealWholeBoard(freshBoard),

    ...addStatus(freshBoard, 0, true),
    ...addStatus(freshBoard, 1, false),
    ...addStatus(freshBoard, 2, true),

    new M.FadeIn(newDataTag),
    new M.Create(freshEmpty),

    ...fbox([
      ['FRESH IMAGINED COUNTS', C.violet],
      'Find the newly empty space.',
      ['Answer: Hill, with pass.', C.amber],
      '0 with pass, 8 without.',
      'Check overlap again.'
    ], C.green),

    ...say(
      'NEW DATA: LOOK FOR FRESHLY EMPTY SPACES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 34: final takeaway
  //
  // Restore the exact observed chapter snapshot.
  //
  // Central: 6 pass, 2 no pass.
  // Hill:    2 pass, 6 no pass.
  // Depot:   2 pass, 0 no pass.
  //
  // Finish on the original comparison picture.
  // ------------------------------------------------------------

  const finalBoard = makeBoard();

  finalBoard.title = txt(
    'OVERLAP',
    P ? 24 : 22,
    C.green,
    at(CX, TITLE_Y),
    true
  );

  // Prepare the actual group averages before adding the
  // final board to the scene.

  finalBoard.rows.forEach(row => {
    row.pass.label = countLabel(
      row.workplace,
      true,
      row.pass.count,
      row.pass.average
    );

    row.no.label = countLabel(
      row.workplace,
      false,
      row.no.count,
      row.no.average
    );
  });

  // Depot's missing average is explicitly labeled as missing.

  finalBoard.rows[2].no.label = txt(
    'No observed average',
    P ? 17 : 15,
    C.amber,
    at(
      NO_X,
      ROW_Y[2] + COUNT_DY
    ),
    false,
    SIDE_W - 0.18
  );

  const finalCentral = rowOutline(
    0,
    C.green
  );

  const finalHill = rowOutline(
    1,
    C.green
  );

  const finalDepot = rowOutline(
    2,
    C.amber
  );

  await until(S(34));
  await play(
    ...fadeAll([
      ...boardObjects(freshBoard),
      freshEmpty,
      newDataTag
    ]),

    ...revealWholeBoard(finalBoard),

    ...addStatus(finalBoard, 0, true),
    ...addStatus(finalBoard, 1, true),
    ...addStatus(finalBoard, 2, false),

    new M.Create(finalCentral),
    new M.Create(finalHill),
    new M.Create(finalDepot),

    ...fbox([
      ['OVERLAP', C.green],
      'Comparable people appear',
      'on both sides.',
      ['Central and Hill: yes', C.green],
      ['Depot: none observed', C.amber],
      'Check before comparing.'
    ], C.green),

    ...say(
      'OVERLAP: FIND COMPARABLE PEOPLE ON BOTH SIDES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Final fixed facts
  // ------------------------------------------------------------
  //
  // Central:
  //   6 pass holders, average 25 minutes.
  //   2 nonholders, average 30 minutes.
  //   Observed overlap: yes.
  //
  // Hill:
  //   2 pass holders, average 45 minutes.
  //   6 nonholders, average 50 minutes.
  //   Observed overlap: yes.
  //
  // Depot:
  //   2 pass holders, average 55 minutes.
  //   0 nonholders, no observed average.
  //   Observed overlap: no.
  //   Recorded pass share = 2/2 = 100%.
  //
  // Whole city:
  //   18 commuters.
  //   10 with passes.
  //   8 without passes.
  //   Recorded pass share = 10/18.
  //
  // Both treatment groups exist city-wide, but this does
  // not guarantee overlap within every workplace.
  //
  // Missing overlap in a small sample may occur by chance.
  //
  // Overlap is necessary for this type of observed comparison,
  // but it does not guarantee that the comparison is causal.
  //
  // These records alone cannot provide a Depot causal effect.
}

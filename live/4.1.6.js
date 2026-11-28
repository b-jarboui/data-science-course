// lesson 4.1.6
// Counting combinations: when order does not matter, each pair
// appears twice in the ordered list, so divide by two.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D = [1, 2, 3, 4, 5, 6, 7, 8];
  const WARM = [1, 2, 3];
  const BLUES = [1, 2, 3, 4, 5];
  const ORANGES = [6, 7, 8];

  const BLUE = C.cyan;
  const ORANGE = '#fb923c';
  const CLOTH = '#a58d72';
  const CORD = '#d6bea0';

  const CX = P ? 0 : -2.6;

  const SP = Math.min(
    P ? 0.88 : 0.9,
    (FW - (P ? 0.9 : 6.8)) / 8
  );

  const TW = SP * 0.78;
  const ROW_Y = P ? 0.65 : 0.35;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.5, 0]
    : [4.3, -0.3, 0];

  const colx = k => CX + (k - 3.5) * SP;
  const pos = k => [colx(k), ROW_Y, 0];

  const colour = n => n <= 5 ? BLUE : ORANGE;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const fade = objs =>
    objs.map(o => new M.FadeOut(o));

  const appear = objs =>
    objs.map(o => new M.FadeIn(o));

  const lag = (anims, runTime = 1.4, lagRatio = 0.12) =>
    new M.LaggedStart(anims, { lagRatio, runTime });

  function txt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function outline(x, y, w, h, color = C.cyan, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(0.14, h * 0.19),
      color,
      strokeWidth: sw
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function dot(p, radius = 0.08, color = C.cyan) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  // Formula box: same structure and placement as the reference.
  // Lines may be strings or [text, color].
  // Leading spaces indent.

  let boxNow = null;

  function replaceBox(g) {
    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];

    boxNow = null;

    return a;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;

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

    const widths = texts.map((t, i) => {
      const s = rows[i][0];

      return t.getWidth() +
        cw * (s.length - s.trimStart().length);
    });

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + (P ? 0.3 : 0.4);

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
    const top = BOXP[1] + (rows.length - 1) * lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];

      const ind = cw * (
        s.length - s.trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.4 : 3.4;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    return replaceBox(g);
  }

  // Original chapter tiles.
  // Blue: 1-5. Orange: 6-8.
  // Smaller versions are diagram labels, not different physical tiles.

  function tile(n, p, w = TW, mode = 'normal') {
    const c = n === null ? C.muted : colour(n);

    const dim = mode === 'dim';
    const bright = mode === 'bright';
    const ghost = mode === 'ghost';

    const halo = new M.RoundedRectangle({
      width: w + Math.min(0.1, w * 0.13),
      height: w + Math.min(0.1, w * 0.13),
      cornerRadius: Math.min(0.12, w * 0.18),
      color: c,
      strokeWidth: bright ? 2 : 1
    });

    halo.setFill(
      c,
      dim ? 0.015
        : ghost ? 0.02
          : bright ? 0.28 : 0.13
    );

    halo.moveTo(p);

    const face = new M.RoundedRectangle({
      width: w,
      height: w,
      cornerRadius: Math.min(0.09, w * 0.15),
      color: c,
      strokeWidth: dim || ghost ? 1 : 2
    });

    face.setFill(
      c,
      dim ? 0.09
        : ghost ? 0.04
          : bright ? 0.96 : 0.82
    );

    face.moveTo(p);

    const edge = line(
      [p[0] - w * 0.31, p[1] - w * 0.36, 0],
      [p[0] + w * 0.31, p[1] - w * 0.36, 0],
      dim || ghost ? C.muted : C.ink,
      1
    );

    const size = Math.max(
      10,
      Math.round(27 * w / 0.7)
    );

    const lab = txt(
      n === null ? '?' : String(n),
      size,
      dim || ghost ? C.muted : C.ink,
      [p[0], p[1] + w * 0.035, 0],
      true
    );

    return new M.VGroup(
      halo, face, edge, lab
    );
  }

  // The border colour indicates the category of a pair.

  function pairColour(a, b) {
    if (a <= 5 && b <= 5) return BLUE;
    if (a >= 6 && b >= 6) return ORANGE;
    return C.violet;
  }

  // Ordered and unordered pair cards.
  // An arrow means first, then second.
  // An ampersand means the two tiles belong together.
  // Every component is newly constructed before grouping.

  function pair(
    a,
    b,
    p,
    w = 0.54,
    ordered = true,
    mode = 'normal'
  ) {
    const dx = w * 0.9;
    const c = pairColour(a, b);

    const border = outline(
      p[0],
      p[1],
      w * 3.12,
      w + 0.29,
      mode === 'dim' ? C.muted : c,
      mode === 'bright' ? 3 : 1.5
    );

    border.setFill(
      mode === 'dim' ? C.muted : c,
      mode === 'dim' ? 0.025 : 0.065
    );

    const left = tile(
      a,
      [p[0] - dx, p[1], 0],
      w,
      mode
    );

    const right = tile(
      b,
      [p[0] + dx, p[1], 0],
      w,
      mode
    );

    const connector = txt(
      ordered ? '→' : '&',
      Math.max(11, Math.round(20 * w / 0.54)),
      mode === 'dim' ? C.muted : C.ink,
      p,
      true
    );

    return new M.VGroup(
      border,
      left,
      connector,
      right
    );
  }

  // Picture state.
  // All visible main-picture objects are tracked individually.
  // No already-visible object is wrapped in a new VGroup.

  let picture = [];
  let marks = [];

  function clearMarks() {
    const a = fade(marks);
    marks = [];
    return a;
  }

  function addMarks(objs) {
    marks.push(...objs);
    return appear(objs);
  }

  function setMarks(objs) {
    return [
      ...clearMarks(),
      ...addMarks(objs)
    ];
  }

  function clearPicture() {
    const a = [
      ...clearMarks(),
      ...fade(picture)
    ];

    picture = [];

    return a;
  }

  function setPicture(objs, runTime = 1.2) {
    const a = clearPicture();

    picture = objs.slice();

    if (objs.length > 5) {
      a.push(
        lag(
          objs.map(o => new M.FadeIn(o)),
          runTime,
          0.06
        )
      );
    } else {
      a.push(...appear(objs));
    }

    return a;
  }

  function addPicture(objs) {
    picture.push(...objs);
    return appear(objs);
  }

  function dropPicture(objs) {
    picture = picture.filter(
      o => !objs.includes(o)
    );

    return fade(objs);
  }

  // Fixed lists of ordered and unordered outcomes.
  // Generate the mathematical data rather than entering counts by hand.

  const arrangements = nums =>
    nums.flatMap(a =>
      nums
        .filter(b => a !== b)
        .map(b => [a, b])
    );

  const combinations = nums =>
    nums.flatMap((a, i) =>
      nums.slice(i + 1).map(b => [a, b])
    );

  const orderedAll = arrangements(D);
  const unorderedAll = combinations(D);

  const orderedWarm = arrangements(WARM);
  const unorderedWarm = combinations(WARM);

  const orangeArrangements = arrangements(ORANGES);
  const orangePairs = combinations(ORANGES);

  const blueArrangements = arrangements(BLUES);
  const bluePairs = combinations(BLUES);

  const mixedPairs = BLUES.flatMap(a =>
    ORANGES.map(b => [a, b])
  );

  // Counts:
  // orderedAll.length          = 56
  // unorderedAll.length        = 28
  // orangeArrangements.length  = 6
  // orangePairs.length         = 3
  // blueArrangements.length    = 20
  // bluePairs.length           = 10
  // mixedPairs.length          = 15

  // Cloth bag with transparent cutaway.

  function makeBag() {
    const x = CX;
    const y = -0.08;

    const neck = new M.RoundedRectangle({
      width: 1.45,
      height: 0.7,
      cornerRadius: 0.18,
      color: CLOTH,
      strokeWidth: 2
    });

    neck.setFill(CLOTH, 0.23);
    neck.moveTo([x, y + 1.06, 0]);

    const body = new M.RoundedRectangle({
      width: 3.55,
      height: 2.26,
      cornerRadius: 0.54,
      color: CLOTH,
      strokeWidth: 3
    });

    body.setFill(CLOTH, 0.17);
    body.moveTo([x, y - 0.05, 0]);

    const seamL = line(
      [x - 1.54, y - 0.7, 0],
      [x - 1.25, y + 0.78, 0],
      CLOTH,
      1
    );

    const seamR = line(
      [x + 1.54, y - 0.7, 0],
      [x + 1.25, y + 0.78, 0],
      CLOTH,
      1
    );

    const cord = line(
      [x - 0.79, y + 0.97, 0],
      [x + 0.79, y + 0.97, 0],
      CORD,
      4
    );

    const tail1 = line(
      [x + 0.72, y + 0.97, 0],
      [x + 1.04, y + 0.63, 0],
      CORD,
      2
    );

    const tail2 = line(
      [x + 0.72, y + 0.97, 0],
      [x + 1.16, y + 0.84, 0],
      CORD,
      2
    );

    const knot = dot(
      [x + 0.73, y + 0.97, 0],
      0.065,
      CORD
    );

    return new M.VGroup(
      neck,
      body,
      seamL,
      seamR,
      cord,
      tail1,
      tail2,
      knot
    );
  }

  const bag = makeBag();

  const table = line(
    [CX - 3.3, -1.34, 0],
    [CX + 3.3, -1.34, 0],
    C.muted,
    3
  );

  const miniPos = k => [
    CX + (k % 4 - 1.5) * 0.68,
    0.24 - Math.floor(k / 4) * 0.67,
    0
  ];

  const mini = D.map((n, k) =>
    tile(n, miniPos(k), 0.51)
  );

  function originalRow(y = ROW_Y) {
    return D.map((n, k) =>
      tile(n, [colx(k), y, 0])
    );
  }

  // A stylised open hand.
  // The palm and fingers form a single fresh illustration.

  function handAt(p) {
    const [x, y] = p;

    const skin = '#bda28d';

    const palm = new M.RoundedRectangle({
      width: 2.9,
      height: 1.72,
      cornerRadius: 0.45,
      color: skin,
      strokeWidth: 2
    });

    palm.setFill(skin, 0.14);
    palm.moveTo([x, y, 0]);

    const fingers = [-0.87, -0.29, 0.29, 0.87].map(
      (dx, k) => {
        const h = [0.72, 0.92, 0.88, 0.63][k];

        const r = new M.RoundedRectangle({
          width: 0.46,
          height: h,
          cornerRadius: 0.21,
          color: skin,
          strokeWidth: 2
        });

        r.setFill(skin, 0.13);

        r.moveTo([
          x + dx,
          y + 0.84 + h / 2,
          0
        ]);

        return r;
      }
    );

    const thumb = new M.RoundedRectangle({
      width: 0.78,
      height: 0.53,
      cornerRadius: 0.23,
      color: skin,
      strokeWidth: 2
    });

    thumb.setFill(skin, 0.13);
    thumb.moveTo([x - 1.63, y - 0.18, 0]);

    const wrist = new M.RoundedRectangle({
      width: 1.35,
      height: 0.49,
      cornerRadius: 0.13,
      color: skin,
      strokeWidth: 2
    });

    wrist.setFill(skin, 0.13);
    wrist.moveTo([x, y - 1.02, 0]);

    return new M.VGroup(
      wrist,
      ...fingers,
      thumb,
      palm
    );
  }

  // 0: return to the bag of eight tiles.

  await until(S(0));
  await play(
    new M.Create(table),
    new M.FadeIn(bag),
    ...say('OUR BAG OF 8 TILES')
  );

  picture = [table, bag];

  // 1: five blue tiles and three orange tiles.

  await until(S(1));
  await play(
    lag(
      mini.map(t => new M.FadeIn(t)),
      3.5,
      0.2
    ),
    ...say('5 BLUE  /  3 ORANGE')
  );

  picture.push(...mini);

  // 2: recall the ordered two-draw game.
  // Use two illustrative tiles: one first, then two.

  const recallRow = originalRow();

  const orderedExample = pair(
    1,
    2,
    [CX, -1.25, 0],
    0.72,
    true,
    'bright'
  );

  const firstLab = txt(
    'First',
    18,
    C.cyan,
    [CX - 0.66, -2.06, 0]
  );

  const secondLab = txt(
    'Second',
    18,
    C.green,
    [CX + 0.66, -2.06, 0]
  );

  await until(S(2));
  await play(
    ...setPicture([
      ...recallRow,
      orderedExample,
      firstLab,
      secondLab
    ]),
    ...fbox([
      ['last lesson', C.muted],
      ['one tile, then another', C.ink],
      ['order matters', C.amber]
    ], C.amber),
    ...say('LAST TIME: ORDERED DRAWS', C.amber)
  );

  // 3: recall the 56 arrangements.

  await until(S(3));
  await play(
    new M.Indicate(
      orderedExample,
      { color: C.green }
    ),
    ...fbox([
      ['8 first choices', C.cyan],
      ['7 second choices', C.green],
      ['8 × 7 = 56', C.amber]
    ], C.green),
    ...say('56 ORDERED ARRANGEMENTS', C.green)
  );

  // 4: the game changes.
  // Grab two tiles at once from the bag.

  const grabBag = makeBag();

  const grabTiles = D.map((n, k) =>
    tile(n, miniPos(k), 0.51)
  );

  const grabHand = handAt([
    CX + 0.12,
    P ? -2.55 : -1.67,
    0
  ]);

  // Use a more compact hand during the draw animation.

  grabHand.scale(P ? 0.65 : 0.48);
  grabHand.moveTo([
    CX + 2.42,
    P ? -1.76 : -1.53,
    0
  ]);

  await until(S(4));
  await play(
    ...setPicture([
      grabBag,
      ...grabTiles,
      grabHand
    ]),
    ...fbox([
      ['new game', C.violet],
      ['grab two together', C.ink]
    ], C.violet),
    ...say('NOW GRAB TWO TILES AT ONCE', C.violet)
  );

  await play(
    new M.Transform(
      grabTiles[0],
      tile(
        1,
        [CX + 2.13, P ? -1.76 : -1.53, 0],
        0.49,
        'bright'
      ),
      { pathArc: -0.35 }
    ),
    new M.Transform(
      grabTiles[1],
      tile(
        2,
        [CX + 2.72, P ? -1.76 : -1.53, 0],
        0.49,
        'bright'
      ),
      { pathArc: -0.35 }
    )
  );

  // 5: open the hand.
  // Two tiles lie side by side. Neither came first.

  const openHand = handAt([
    CX,
    P ? -0.35 : -0.62,
    0
  ]);

  const handTile1 = tile(
    1,
    [CX - 0.52, P ? -0.35 : -0.62, 0],
    0.83,
    'bright'
  );

  const handTile2 = tile(
    2,
    [CX + 0.52, P ? -0.35 : -0.62, 0],
    0.83,
    'bright'
  );

  const handLabel = txt(
    'Neither came first',
    20,
    C.violet,
    [CX, P ? -2.05 : -2.24, 0]
  );

  await until(S(5));
  await play(
    ...setPicture([
      openHand,
      handTile1,
      handTile2,
      handLabel
    ]),
    ...fbox([
      ['two tiles together', C.ink],
      ['no first or second', C.violet],
      ['order does not matter', C.green]
    ], C.violet),
    ...say('NEITHER TILE CAME FIRST', C.violet)
  );

  // 6: how many different pairs could be in the hand?

  await until(S(6));
  await play(
    new M.Indicate(
      handTile1,
      { color: C.amber }
    ),
    new M.Indicate(
      handTile2,
      { color: C.amber }
    ),
    ...fbox([
      ['how many different', C.ink],
      ['pairs could we hold?', C.amber],
      ['?', C.amber]
    ], C.amber),
    ...say('HOW MANY DIFFERENT PAIRS?', C.amber)
  );

  // 7: warm up with three tiles.

  const warmTiles = WARM.map((n, k) =>
    tile(
      n,
      [
        CX + (k - 1) * 1.35,
        ROW_Y,
        0
      ],
      0.9
    )
  );

  await until(S(7));
  await play(
    ...setPicture(warmTiles),
    ...fbox([
      ['warm-up', C.green],
      ['tiles 1, 2 and 3', C.ink]
    ], C.green),
    ...say('WARM-UP: ONLY THREE TILES', C.green)
  );

  // Warm-up arrangement grid.
  // Six arrangements are first displayed in their original order:
  //
  //    1 → 2       1 → 3
  //    2 → 1       2 → 3
  //    3 → 1       3 → 2

  const WARM_W = P ? 0.55 : 0.52;
  const WARM_X = P ? 1.55 : 1.55;

  const WARM_TOP = P ? 0.85 : 0.75;
  const WARM_SP = P ? 1.12 : 1.02;

  function warmPos(k) {
    return [
      CX + (k % 2 === 0 ? -WARM_X : WARM_X),
      WARM_TOP - Math.floor(k / 2) * WARM_SP,
      0
    ];
  }

  const warmCards = orderedWarm.map(
    ([a, b], k) => ({
      a,
      b,
      obj: pair(
        a,
        b,
        warmPos(k),
        WARM_W,
        true
      )
    })
  );

  const warmHeading = txt(
    '6 ordered arrangements',
    20,
    C.cyan,
    [CX, WARM_TOP + 0.63, 0]
  );

  // 8: recall all six ordered arrangements.

  await until(S(8));
  await play(
    ...clearPicture(),
    lag(
      warmCards.map(e =>
        new M.FadeIn(e.obj)
      ),
      5.6,
      0.7
    ),
    new M.FadeIn(warmHeading),
    ...fbox([
      ['1–2   1–3', C.ink],
      ['2–1   2–3', C.ink],
      ['3–1   3–2', C.ink],
      ['6 arrangements', C.cyan]
    ], C.cyan),
    ...say('THE SIX ORDERED ARRANGEMENTS')
  );

  picture = [
    ...warmCards.map(e => e.obj),
    warmHeading
  ];

  function warmEntry(a, b) {
    return warmCards.find(
      e => e.a === a && e.b === b
    );
  }

  const mirrorRows = [
    [[1, 2], [2, 1]],
    [[1, 3], [3, 1]],
    [[2, 3], [3, 2]]
  ];

  const mirrorColors = [
    C.green,
    C.violet,
    C.amber
  ];

  function mirrorRing(k, color = mirrorColors[k]) {
    return outline(
      CX,
      WARM_TOP - k * WARM_SP,
      2 * WARM_X + WARM_W * 3.12 + 0.24,
      WARM_W + 0.45,
      color,
      2.5
    );
  }

  function mirrorEquals(k, color = C.green) {
    return txt(
      '=',
      23,
      color,
      [
        CX,
        WARM_TOP - k * WARM_SP,
        0
      ],
      true
    );
  }

  // 9: rearrange the grid.
  // Put each arrangement beside its reversed version.

  const mirrorAnimations = mirrorRows.flatMap(
    (row, r) =>
      row.map(([a, b], c) =>
        new M.Transform(
          warmEntry(a, b).obj,
          pair(
            a,
            b,
            warmPos(2 * r + c),
            WARM_W,
            true
          ),
          { pathArc: c === 0 ? -0.18 : 0.18 }
        )
      )
  );

  await until(S(9));
  await play(
    ...mirrorAnimations,
    new M.Transform(
      warmHeading,
      txt(
        'Match the same two tiles',
        20,
        C.green,
        [CX, WARM_TOP + 0.63, 0]
      )
    ),
    ...fbox([
      ['same two numbers', C.ink],
      ['different order', C.amber],
      ['match the pairs', C.green]
    ], C.green),
    ...say('MATCH ARRANGEMENTS WITH THE SAME TILES', C.green)
  );

  // 10: 1-2 and 2-1 are the same pair in the hand.

  const matchRing0 = mirrorRing(0);
  const matchEquals0 = mirrorEquals(0, mirrorColors[0]);

  await until(S(10));
  await play(
    ...addMarks([
      matchRing0,
      matchEquals0
    ]),
    new M.Indicate(
      warmEntry(1, 2).obj,
      { color: mirrorColors[0] }
    ),
    new M.Indicate(
      warmEntry(2, 1).obj,
      { color: mirrorColors[0] }
    ),
    ...fbox([
      ['1 then 2', C.ink],
      ['2 then 1', C.ink],
      ['same pair: {1,2}', C.green]
    ], C.green),
    ...say('1–2 AND 2–1: SAME PAIR', C.green)
  );

  // 11: 1-3 and 3-1 are another matching pair.

  const matchRing1 = mirrorRing(1);
  const matchEquals1 = mirrorEquals(1, mirrorColors[1]);

  await until(S(11));
  await play(
    ...addMarks([
      matchRing1,
      matchEquals1
    ]),
    new M.Indicate(
      warmEntry(1, 3).obj,
      { color: mirrorColors[1] }
    ),
    new M.Indicate(
      warmEntry(3, 1).obj,
      { color: mirrorColors[1] }
    ),
    ...fbox([
      ['1 then 3', C.ink],
      ['3 then 1', C.ink],
      ['same pair: {1,3}', C.violet]
    ], C.violet),
    ...say('1–3 AND 3–1: SAME PAIR', C.violet)
  );

  // 12: 2-3 and 3-2 are the third matching pair.

  const matchRing2 = mirrorRing(2);
  const matchEquals2 = mirrorEquals(2, mirrorColors[2]);

  await until(S(12));
  await play(
    ...addMarks([
      matchRing2,
      matchEquals2
    ]),
    new M.Indicate(
      warmEntry(2, 3).obj,
      { color: mirrorColors[2] }
    ),
    new M.Indicate(
      warmEntry(3, 2).obj,
      { color: mirrorColors[2] }
    ),
    ...fbox([
      ['2 then 3', C.ink],
      ['3 then 2', C.ink],
      ['same pair: {2,3}', C.amber]
    ], C.amber),
    ...say('2–3 AND 3–2: SAME PAIR', C.amber)
  );

  // 13: fold each matching row into one pair.
  // One representative survives from each pair of arrangements.

  const warmKeep = unorderedWarm.map(
    ([a, b]) => warmEntry(a, b)
  );

  const warmDuplicates = unorderedWarm.map(
    ([a, b]) => warmEntry(b, a)
  );

  const foldWarmPos = r => [
    CX,
    WARM_TOP - r * WARM_SP,
    0
  ];

  await until(S(13));
  await play(
    ...clearMarks(),
    ...warmKeep.map((e, k) =>
      new M.Transform(
        e.obj,
        pair(
          e.a,
          e.b,
          foldWarmPos(k),
          WARM_W + 0.09,
          false,
          'bright'
        ),
        { pathArc: -0.18 }
      )
    ),
    ...warmDuplicates.map((e, k) =>
      new M.Transform(
        e.obj,
        pair(
          e.b,
          e.a,
          foldWarmPos(k),
          WARM_W + 0.09,
          false,
          'dim'
        ),
        { pathArc: 0.18 }
      )
    ),
    ...fbox([
      ['6 arrangements', C.ink],
      ['fold matching orders', C.amber],
      ['3 different pairs', C.green]
    ], C.green),
    ...say('FOLD SIX ARRANGEMENTS INTO THREE', C.green)
  );

  await play(
    ...dropPicture(
      warmDuplicates.map(e => e.obj)
    ),
    new M.Transform(
      warmHeading,
      txt(
        '3 different pairs',
        20,
        C.green,
        [CX, WARM_TOP + 0.66, 0]
      )
    )
  );

  // 14: each pair appeared exactly twice.
  // Show the two-to-one relationship explicitly.

  const foldLabels = warmKeep.map((e, k) =>
    txt(
      '2 orders → 1 pair',
      16,
      C.muted,
      [
        CX + 2.02,
        foldWarmPos(k)[1],
        0
      ]
    )
  );

  await until(S(14));
  await play(
    ...addPicture(foldLabels),
    lag(
      warmKeep.map(e =>
        new M.Indicate(
          e.obj,
          { color: C.green }
        )
      ),
      2.0,
      0.35
    ),
    ...fbox([
      ['each pair appeared', C.ink],
      ['exactly twice', C.amber],
      ['once in each order', C.muted]
    ], C.amber),
    ...say('EVERY PAIR WAS LISTED TWICE', C.amber)
  );

  // 15: name the new concept.
  // A combination is a group where order does not matter.

  await until(S(15));
  await play(
    ...dropPicture(foldLabels),
    ...fbox([
      ['combination', C.green],
      ['a group where', C.ink],
      ['order does not matter', C.ink]
    ], C.green),
    ...say('NO ORDER = COMBINATION', C.green)
  );

  // 16: with three tiles there are three combinations of two.

  const finalWarmCards = unorderedWarm.map(
    ([a, b], k) =>
      pair(
        a,
        b,
        [
          CX + (k - 1) * 2.12,
          0.15,
          0
        ],
        0.57,
        false,
        'bright'
      )
  );

  const warmCount = txt(
    '6 ÷ 2 = 3',
    27,
    C.green,
    [CX, -1.2, 0],
    true
  );

  await until(S(16));
  await play(
    ...setPicture([
      ...finalWarmCards,
      warmCount
    ]),
    ...fbox([
      ['{1,2}  {1,3}  {2,3}', C.ink],
      ['6 ÷ 2 = 3', C.green]
    ], C.green),
    ...say('THREE COMBINATIONS OF TWO', C.green)
  );

  // Matrix helpers.
  //
  // An ordered matrix has one row for each first choice and
  // one column for each second choice. The diagonal is empty
  // because a physical tile cannot be chosen twice.
  //
  // The upper triangle contains one representative of each
  // unordered pair. The lower triangle contains its reversed order.
  //
  // Each cell displays its two actual tile numbers and colours.

  function gridCell(
    a,
    b,
    p,
    wd,
    ht,
    mode = 'normal'
  ) {
    const dim = mode === 'dim';
    const bright = mode === 'bright';
    const duplicate = mode === 'duplicate';

    const cat = pairColour(a, b);

    const borderColor = duplicate
      ? C.amber
      : dim ? C.muted : cat;

    const frame = outline(
      p[0],
      p[1],
      wd,
      ht,
      borderColor,
      bright || duplicate ? 2.5 : 1
    );

    frame.setFill(
      borderColor,
      dim ? 0.025 : 0.07
    );

    const halfW = (wd - 0.055) / 2;
    const halfH = ht - 0.055;

    const xa = p[0] - (halfW + 0.015) / 2;
    const xb = p[0] + (halfW + 0.015) / 2;

    const aRect = new M.Rectangle({
      width: halfW,
      height: halfH,
      color: colour(a),
      strokeWidth: 1
    });

    aRect.setFill(
      colour(a),
      dim ? 0.08 : bright ? 0.94 : 0.65
    );

    aRect.moveTo([xa, p[1], 0]);

    const bRect = new M.Rectangle({
      width: halfW,
      height: halfH,
      color: colour(b),
      strokeWidth: 1
    });

    bRect.setFill(
      colour(b),
      dim ? 0.08 : bright ? 0.94 : 0.65
    );

    bRect.moveTo([xb, p[1], 0]);

    const size = P ? 18 : 16;

    const aLab = txt(
      String(a),
      size,
      dim ? C.muted : C.bg,
      [xa, p[1], 0],
      true
    );

    const bLab = txt(
      String(b),
      size,
      dim ? C.muted : C.bg,
      [xb, p[1], 0],
      true
    );

    return new M.VGroup(
      frame,
      aRect,
      bRect,
      aLab,
      bLab
    );
  }

  let grid = null;

  function buildGrid(
    rows,
    cols,
    rule = 'ordered',
    title = 'Ordered arrangements',
    selector = null
  ) {
    const large = Math.max(
      rows.length,
      cols.length
    ) > 5;

    const dx = large
      ? (P ? 0.72 : 0.68)
      : 0.96;

    const dy = large
      ? (P ? 0.80 : 0.46)
      : (P ? 0.90 : 0.55);

    const wd = dx * 0.89;
    const ht = dy * 0.84;

    const top = P ? 0.85 : 0.63;

    const gx = j =>
      CX + (j - (cols.length - 1) / 2) * dx;

    const gy = i =>
      top - i * dy;

    const cellPos = (i, j) => [
      gx(j),
      gy(i),
      0
    ];

    const heading = txt(
      title,
      P ? 20 : 18,
      C.ink,
      [CX, P ? 1.72 : 1.38, 0]
    );

    const rowHeads = rows.map((a, i) =>
      txt(
        String(a),
        16,
        colour(a),
        [gx(0) - dx * 0.88, gy(i), 0],
        true
      )
    );

    const colHeads = cols.map((b, j) =>
      txt(
        String(b),
        16,
        colour(b),
        [gx(j), gy(0) + dy * 0.83, 0],
        true
      )
    );

    const entries = [];

    rows.forEach((a, i) => {
      cols.forEach((b, j) => {
        if (a === b) return;

        if (rule === 'upper' && a > b) {
          return;
        }

        const p = cellPos(i, j);

        const mode = selector
          ? (selector(a, b) ? 'bright' : 'dim')
          : 'normal';

        entries.push({
          a,
          b,
          i,
          j,
          p,
          obj: gridCell(
            a,
            b,
            p,
            wd,
            ht,
            mode
          )
        });
      });
    });

    const footer = txt(
      `${entries.length} ${rule === 'ordered' ? 'arrangements' : 'pairs'}`,
      18,
      C.green,
      [
        CX,
        gy(rows.length - 1) - 0.48,
        0
      ],
      true
    );

    const objects = [
      heading,
      ...rowHeads,
      ...colHeads,
      ...entries.map(e => e.obj),
      footer
    ];

    return {
      rows,
      cols,
      rule,
      dx,
      dy,
      wd,
      ht,
      top,
      gx,
      gy,
      cellPos,
      heading,
      footer,
      rowHeads,
      colHeads,
      entries,
      objects
    };
  }

  function showGrid(
    rows,
    cols,
    rule,
    title,
    selector = null
  ) {
    grid = buildGrid(
      rows,
      cols,
      rule,
      title,
      selector
    );

    return setPicture(
      grid.objects,
      1.5
    );
  }

  function gridEntry(a, b) {
    return grid.entries.find(
      e => e.a === a && e.b === b
    );
  }

  function gridHighlight(selector) {
    return grid.entries.map(e =>
      new M.Transform(
        e.obj,
        gridCell(
          e.a,
          e.b,
          e.p,
          grid.wd,
          grid.ht,
          selector(e.a, e.b)
            ? 'bright'
            : 'dim'
        )
      )
    );
  }

  function gridRing(e, color = C.amber) {
    return outline(
      e.p[0],
      e.p[1],
      grid.wd + 0.085,
      grid.ht + 0.075,
      color,
      2.5
    );
  }

  function gridHeading(s, color = C.ink) {
    return new M.Transform(
      grid.heading,
      txt(
        s,
        P ? 20 : 18,
        color,
        [CX, P ? 1.72 : 1.38, 0]
      )
    );
  }

  function gridFooter(s, color = C.green) {
    return new M.Transform(
      grid.footer,
      txt(
        s,
        18,
        color,
        [
          CX,
          grid.gy(grid.rows.length - 1) - 0.48,
          0
        ],
        true
      )
    );
  }

  // Fold all entries below the diagonal onto their matching
  // entries above the diagonal.
  //
  // The target pair is written with the smaller number first
  // only as a consistent way of listing the pair.
  // It does not impose an order on the actual draw.

  function foldGridAnimations() {
    const lower = grid.entries.filter(
      e => e.a > e.b
    );

    return lower.map(e => {
      const twin = gridEntry(e.b, e.a);

      return new M.Transform(
        e.obj,
        gridCell(
          e.b,
          e.a,
          [
            twin.p[0] + 0.035,
            twin.p[1] + 0.035,
            0
          ],
          grid.wd,
          grid.ht,
          'duplicate'
        ),
        { pathArc: 0.18 }
      );
    });
  }

  function finishGridFold() {
    const duplicates = grid.entries.filter(
      e => e.a > e.b
    );

    grid.entries = grid.entries.filter(
      e => e.a < e.b
    );

    grid.rule = 'upper';

    return [
      ...dropPicture(
        duplicates.map(e => e.obj)
      ),
      gridHeading(
        'One entry for each pair',
        C.green
      ),
      gridFooter(
        `${grid.entries.length} different pairs`,
        C.green
      )
    ];
  }

  // 17: return to eight tiles.
  // Show all 56 ordered arrangements in a matrix.

  await until(S(17));
  await play(
    ...showGrid(
      D,
      D,
      'ordered',
      'First tile ↓   Second tile →'
    ),
    ...fbox([
      ['8 first choices', C.cyan],
      ['7 second choices', C.green],
      ['8 × 7 = 56', C.amber]
    ], C.cyan),
    ...say('BACK TO 56 ORDERED ARRANGEMENTS')
  );

  // 18: each pair appears twice again.
  // Highlight the symmetric cells 1-2 and 2-1.

  const entry12 = gridEntry(1, 2);
  const entry21 = gridEntry(2, 1);

  const match12 = gridRing(
    entry12,
    C.amber
  );

  const match21 = gridRing(
    entry21,
    C.amber
  );

  const mirrorLink = new M.DashedLine({
    start: [
      entry12.p[0] - 0.25,
      entry12.p[1] - 0.13,
      0
    ],
    end: [
      entry21.p[0] + 0.25,
      entry21.p[1] + 0.13,
      0
    ],
    color: C.amber
  });

  await until(S(18));
  await play(
    ...gridHighlight(
      (a, b) =>
        (a === 1 && b === 2) ||
        (a === 2 && b === 1)
    ),
    ...addMarks([
      match12,
      match21,
      mirrorLink
    ]),
    ...fbox([
      ['1–2 and 2–1', C.amber],
      ['same two tiles', C.ink],
      ['same unordered pair', C.green]
    ], C.green),
    ...say('EACH PAIR APPEARS IN TWO ORDERS', C.amber)
  );

  await until(S(18) + 3.4);
  await play(
    ...clearMarks(),
    ...gridHighlight(
      (a, b) => a < b
    ),
    gridHeading(
      'Two mirrored halves',
      C.green
    ),
    ...fbox([
      ['upper half: 28', C.green],
      ['lower half: 28', C.muted],
      ['matching pairs', C.amber]
    ], C.green)
  );

  // 19: fold the 56 arrangements in half.
  // Animate all 28 reversed arrangements onto their twins.

  await until(S(19));
  await play(
    lag(
      foldGridAnimations(),
      1.55,
      0.035
    ),
    ...fbox([
      ['56 arrangements', C.ink],
      ['fold in half', C.amber]
    ], C.amber),
    ...say('FOLD THE 56 IN HALF', C.amber)
  );

  // 20: remove the duplicate layer.
  // 56 divided by two gives 28.

  await until(S(20));
  await play(
    ...finishGridFold(),
    ...fbox([
      ['56 ÷ 2', C.ink],
      ['= 28', C.green]
    ], C.green),
    ...say('56 ÷ 2 = 28', C.green)
  );

  // 21: exactly 28 distinct pairs can be held.

  await until(S(21));
  await play(
    new M.Indicate(
      grid.footer,
      { color: C.green }
    ),
    ...fbox([
      ['28 different pairs', C.green],
      ['no repeated pairs', C.ink]
    ], C.green),
    ...say('28 POSSIBLE PAIRS', C.green)
  );

  // 22: introduce the short version.

  await until(S(22));
  await play(
    ...fbox([
      ['count combinations', C.green],
      ['remove reversed copies', C.ink]
    ], C.green),
    ...say('THE SHORT VERSION', C.green)
  );

  // 23: number of pairs = arrangements divided by two.

  await until(S(23));
  await play(
    ...fbox([
      ['number of pairs =', C.ink],
      ['arrangements ÷ 2', C.amber],
      ['56 ÷ 2 = 28', C.green]
    ], C.green),
    ...say('PAIRS = ARRANGEMENTS DIVIDED BY 2', C.green)
  );

  // 24: why divide by two?
  // Two distinct tiles can be ordered in exactly two ways.

  const WHY_Y = P ? 0.65 : 0.55;

  const whyFirst = pair(
    1,
    2,
    [CX - 1.53, WHY_Y, 0],
    0.67,
    true
  );

  const whySecond = pair(
    2,
    1,
    [CX + 1.53, WHY_Y, 0],
    0.67,
    true
  );

  const whyPair = pair(
    1,
    2,
    [CX, -1.35, 0],
    0.76,
    false,
    'bright'
  );

  const whyConnectors = [
    line(
      [CX - 1.53, WHY_Y - 0.55, 0],
      [CX - 0.55, -0.83, 0],
      C.green,
      2
    ),
    line(
      [CX + 1.53, WHY_Y - 0.55, 0],
      [CX + 0.55, -0.83, 0],
      C.green,
      2
    )
  ];

  const whyTop = txt(
    'Exactly two orders',
    20,
    C.amber,
    [CX, WHY_Y + 0.67, 0]
  );

  const whyBottom = txt(
    'One pair',
    20,
    C.green,
    [CX, -2.1, 0]
  );

  await until(S(24));
  await play(
    ...setPicture([
      whyFirst,
      whySecond,
      ...whyConnectors,
      whyPair,
      whyTop,
      whyBottom
    ]),
    ...fbox([
      ['1 then 2', C.ink],
      ['2 then 1', C.ink],
      ['2 orders, 1 pair', C.green]
    ], C.green),
    ...say('WHY TWO? EXACTLY TWO POSSIBLE ORDERS', C.amber)
  );

  // 25: chance question.
  // What if both tiles in the hand must be orange?

  const questionRow = originalRow();

  const orangeExample = pair(
    6,
    7,
    [CX, -1.35, 0],
    0.75,
    false,
    'bright'
  );

  const orangeQuestion = txt(
    'Both orange?',
    20,
    ORANGE,
    [CX, -2.13, 0]
  );

  await until(S(25));
  await play(
    ...setPicture([
      ...questionRow,
      orangeExample,
      orangeQuestion
    ]),
    ...fbox([
      ['chance question', C.amber],
      ['both tiles orange?', ORANGE],
      ['?', C.ink]
    ], ORANGE),
    ...say('WHAT IF BOTH TILES ARE ORANGE?', ORANGE)
  );

  // 26: list every orange pair exactly once.
  // {6,7}, {6,8}, {7,8}.

  const largeOrangePairs = orangePairs.map(
    ([a, b], k) =>
      pair(
        a,
        b,
        [
          CX + (k - 1) * 2.08,
          0.15,
          0
        ],
        0.57,
        false,
        'bright'
      )
  );

  const orangeGroupFrame = outline(
    CX,
    0.15,
    6.1,
    1.05,
    ORANGE,
    2
  );

  const orangePairTitle = txt(
    'All different orange pairs',
    20,
    ORANGE,
    [CX, 1.0, 0]
  );

  await until(S(26));
  await play(
    ...clearPicture(),
    lag(
      largeOrangePairs.map(p =>
        new M.FadeIn(p)
      ),
      3.6,
      0.8
    ),
    new M.Create(orangeGroupFrame),
    new M.FadeIn(orangePairTitle),
    ...fbox([
      ['{6,7}', ORANGE],
      ['{6,8}', ORANGE],
      ['{7,8}', ORANGE],
      ['3 different pairs', C.ink]
    ], ORANGE),
    ...say('LIST THE THREE ORANGE PAIRS', ORANGE)
  );

  picture = [
    ...largeOrangePairs,
    orangeGroupFrame,
    orangePairTitle
  ];

  // 27: three orange pairs out of 28 total pairs.
  // The upper-triangle matrix is the full unordered sample space.

  await until(S(27));
  await play(
    ...showGrid(
      D,
      D,
      'upper',
      'All 28 different pairs',
      (a, b) => a >= 6 && b >= 6
    ),
    ...fbox([
      ['orange pairs = 3', ORANGE],
      ['all pairs    = 28', C.ink]
    ], ORANGE),
    ...say('3 ORANGE PAIRS OUT OF 28', ORANGE)
  );

  // 28: the probability is three twenty-eighths.

  const orangeGridMarks = grid.entries
    .filter(e => e.a >= 6 && e.b >= 6)
    .map(e => gridRing(e, ORANGE));

  await until(S(28));
  await play(
    ...addMarks(orangeGridMarks),
    ...fbox([
      ['both orange', ORANGE],
      ['3 ÷ 28', C.ink],
      ['chance = 3/28', ORANGE]
    ], ORANGE),
    ...say('PROBABILITY = 3/28', ORANGE)
  );

  // 29: check with last lesson.
  // Ordered draws had six orange arrangements out of 56.
  //
  // The top row contains the three increasing orders.
  // The bottom row contains their reversed partners.

  const CHECK_TOP = P ? 0.78 : 0.65;
  const CHECK_BOTTOM = P ? -0.85 : -0.82;

  const CHECK_SP = 2.08;
  const CHECK_W = 0.53;

  const checkX = k =>
    CX + (k - 1) * CHECK_SP;

  const orangeCheckKeep = orangePairs.map(
    ([a, b], k) => ({
      a,
      b,
      obj: pair(
        a,
        b,
        [checkX(k), CHECK_TOP, 0],
        CHECK_W,
        true
      )
    })
  );

  const orangeCheckReverse = orangePairs.map(
    ([a, b], k) => ({
      a: b,
      b: a,
      obj: pair(
        b,
        a,
        [checkX(k), CHECK_BOTTOM, 0],
        CHECK_W,
        true
      )
    })
  );

  const orangeCheckTitle = txt(
    '6 ordered orange arrangements',
    19,
    ORANGE,
    [CX, CHECK_TOP + 0.66, 0]
  );

  const checkMatches = orangePairs.map(
    (_, k) =>
      line(
        [checkX(k), CHECK_TOP - 0.46, 0],
        [checkX(k), CHECK_BOTTOM + 0.46, 0],
        C.amber,
        2
      )
  );

  const checkFraction = txt(
    '6 / 56',
    24,
    C.amber,
    [CX, -2.03, 0],
    true
  );

  await until(S(29));
  await play(
    ...setPicture([
      orangeCheckTitle,
      ...orangeCheckKeep.map(e => e.obj),
      ...orangeCheckReverse.map(e => e.obj),
      ...checkMatches,
      checkFraction
    ]),
    ...fbox([
      ['ordered orange = 6', ORANGE],
      ['all ordered    = 56', C.ink],
      ['chance = 6/56', C.amber]
    ], ORANGE),
    ...say('ORDERED VERSION: SIX OUT OF 56', ORANGE)
  );

  // 30: halve BOTH counts.
  // Fold the reversed orange arrangements into their matching pairs.

  const CHECK_FOLD_Y = -0.1;

  await until(S(30));
  await play(
    ...dropPicture(checkMatches),
    ...orangeCheckKeep.map((e, k) =>
      new M.Transform(
        e.obj,
        pair(
          e.a,
          e.b,
          [checkX(k), CHECK_FOLD_Y, 0],
          0.62,
          false,
          'bright'
        )
      )
    ),
    ...orangeCheckReverse.map((e, k) =>
      new M.Transform(
        e.obj,
        pair(
          e.b,
          e.a,
          [checkX(k), CHECK_FOLD_Y, 0],
          0.62,
          false,
          'dim'
        )
      )
    ),
    ...fbox([
      ['6  ÷ 2 = 3', ORANGE],
      ['56 ÷ 2 = 28', C.ink],
      ['halve BOTH counts', C.amber]
    ], C.amber),
    ...say('HALVE THE TOP AND THE BOTTOM', C.amber)
  );

  await play(
    ...dropPicture(
      orangeCheckReverse.map(e => e.obj)
    ),
    new M.Transform(
      orangeCheckTitle,
      txt(
        '3 different orange pairs',
        20,
        ORANGE,
        [CX, CHECK_TOP + 0.66, 0]
      )
    ),
    new M.Transform(
      checkFraction,
      txt(
        '3 / 28',
        24,
        ORANGE,
        [CX, -2.03, 0],
        true
      )
    ),
    ...fbox([
      ['6/56', C.ink],
      ['= 3/28', ORANGE]
    ], ORANGE)
  );

  // Probability bars.
  //
  // Both bars have identical total widths.
  // Each is divided according to its own denominator.
  // Their filled lengths represent the actual fractions.
  // Thus 6/56 and 3/28 have exactly equal filled widths.

  const PROB_W = P ? 5.95 : 5.7;
  const PROB_H = 0.47;

  const PROB_Y1 = P ? 0.45 : 0.35;
  const PROB_Y2 = P ? -1.32 : -1.35;

  function probabilityBar(
    n,
    d,
    y,
    fillColor = ORANGE
  ) {
    const left = CX - PROB_W / 2;
    const sw = PROB_W / d;

    const bg = new M.Rectangle({
      width: PROB_W,
      height: PROB_H,
      color: C.muted,
      strokeWidth: 1
    });

    bg.setFill(C.muted, 0.1);
    bg.moveTo([CX, y, 0]);

    const usedW = PROB_W * n / d;

    const used = new M.Rectangle({
      width: usedW,
      height: PROB_H,
      color: fillColor,
      strokeWidth: 1
    });

    used.setFill(fillColor, 0.88);

    used.moveTo([
      left + usedW / 2,
      y,
      0
    ]);

    const dividers = Array.from(
      { length: d - 1 },
      (_, k) => {
        const x = left + (k + 1) * sw;

        return line(
          [x, y - PROB_H / 2, 0],
          [x, y + PROB_H / 2, 0],
          C.card,
          1
        );
      }
    );

    const frame = outline(
      CX,
      y,
      PROB_W + 0.08,
      PROB_H + 0.08,
      C.ink,
      1.5
    );

    return new M.VGroup(
      bg,
      used,
      ...dividers,
      frame
    );
  }

  function probabilityRow(
    n,
    d,
    y,
    title,
    color = ORANGE
  ) {
    const bar = probabilityBar(
      n,
      d,
      y,
      color
    );

    const titleObj = txt(
      title,
      19,
      C.ink,
      [CX, y + 0.49, 0]
    );

    const fractionObj = txt(
      `${n}/${d}`,
      21,
      color,
      [CX, y - 0.47, 0],
      true
    );

    return [
      titleObj,
      bar,
      fractionObj
    ];
  }

  function shareBoundary(n, d) {
    const x = CX -
      PROB_W / 2 +
      PROB_W * n / d;

    return new M.DashedLine({
      start: [
        x,
        PROB_Y1 + PROB_H / 2 + 0.09,
        0
      ],
      end: [
        x,
        PROB_Y2 - PROB_H / 2 - 0.09,
        0
      ],
      color: C.green
    });
  }

  // 31: both fractions represent exactly the same share.

  const orderedProbability = probabilityRow(
    6,
    56,
    PROB_Y1,
    'Ordered: arrangements',
    ORANGE
  );

  const unorderedProbability = probabilityRow(
    3,
    28,
    PROB_Y2,
    'Unordered: pairs',
    ORANGE
  );

  const equalBoundary = shareBoundary(
    3,
    28
  );

  await until(S(31));
  await play(
    ...setPicture(
      [
        ...orderedProbability,
        ...unorderedProbability,
        equalBoundary
      ],
      0.75
    ),
    ...fbox([
      ['6/56 = 3/28', C.green]
    ], C.green),
    ...say('EXACTLY THE SAME SHARE', C.green)
  );

  // 32: the chance is unchanged provided both counts
  // follow the same rule.

  await until(S(32));
  await play(
    new M.Indicate(
      orderedProbability[1],
      { color: ORANGE }
    ),
    new M.Indicate(
      unorderedProbability[1],
      { color: ORANGE }
    ),
    ...fbox([
      ['ordered:   6/56', C.ink],
      ['unordered: 3/28', C.ink],
      ['same probability', C.green],
      ['≈ 10.7%', ORANGE]
    ], C.green),
    ...say('SAME CHANCE, CONSISTENT COUNTING', C.green)
  );

  // 33: count the remaining types of pairs.

  const categoryRow = originalRow();

  await until(S(33));
  await play(
    ...setPicture(categoryRow, 0.8),
    ...fbox([
      ['other pair types:', C.ink],
      ['both blue', BLUE],
      ['one of each colour', C.violet]
    ]),
    ...say('COUNT THE OTHER PAIRS')
  );

  // 34: both blue.
  // Five first choices and four possible second choices.
  // Tile one is used as an illustrative first choice.

  const BLUE_Y1 = P ? 0.72 : 0.48;
  const BLUE_Y2 = P ? -1.3 : -1.4;

  const blueChoiceX = k =>
    CX + (k - 2) * 1.04;

  const firstBlueChoices = BLUES.map(
    (n, k) =>
      tile(
        n,
        [blueChoiceX(k), BLUE_Y1, 0],
        0.76
      )
  );

  const secondBlueChoices = BLUES.map(
    (n, k) =>
      tile(
        n,
        [blueChoiceX(k), BLUE_Y2, 0],
        0.76,
        n === 1 ? 'ghost' : 'normal'
      )
  );

  const firstBlueHeading = txt(
    'First draw: 5 blue choices',
    19,
    BLUE,
    [CX, BLUE_Y1 + 0.68, 0]
  );

  const secondBlueHeading = txt(
    'If 1 was drawn: 4 blue choices left',
    P ? 18 : 17,
    BLUE,
    [CX, BLUE_Y2 + 0.68, 0]
  );

  const unavailableOne = new M.VGroup(
    line(
      [
        blueChoiceX(0) - 0.29,
        BLUE_Y2 - 0.29,
        0
      ],
      [
        blueChoiceX(0) + 0.29,
        BLUE_Y2 + 0.29,
        0
      ],
      C.amber,
      3
    ),
    line(
      [
        blueChoiceX(0) - 0.29,
        BLUE_Y2 + 0.29,
        0
      ],
      [
        blueChoiceX(0) + 0.29,
        BLUE_Y2 - 0.29,
        0
      ],
      C.amber,
      3
    )
  );

  await until(S(34));
  await play(
    ...setPicture([
      ...firstBlueChoices,
      ...secondBlueChoices,
      firstBlueHeading,
      secondBlueHeading,
      unavailableOne
    ]),
    ...fbox([
      ['both blue', BLUE],
      ['first:  5 choices', C.ink],
      ['second: 4 choices', C.ink]
    ], BLUE),
    ...say('5 BLUE FIRST, THEN 4 BLUE LEFT', BLUE)
  );

  // 35: 5 × 4 = 20 ordered arrangements.
  // Fold the two mirrored halves to get 10 blue pairs.

  await until(S(35));
  await play(
    ...showGrid(
      BLUES,
      BLUES,
      'ordered',
      'Both blue: ordered arrangements'
    ),
    ...fbox([
      ['5 × 4', C.ink],
      ['= 20 arrangements', BLUE]
    ], BLUE),
    ...say('5 × 4 = 20 ARRANGEMENTS', BLUE)
  );

  await play(
    lag(
      foldGridAnimations(),
      1.15,
      0.045
    )
  );

  await play(
    ...finishGridFold(),
    ...fbox([
      ['20 ÷ 2', C.ink],
      ['= 10 blue pairs', BLUE]
    ], BLUE),
    ...say('HALVE 20 TO GET 10 BLUE PAIRS', BLUE)
  );

  // 36: one blue and one orange.
  // Each of the five blue tiles can pair with
  // each of the three orange tiles.
  //
  // The matrix has five rows and three columns.
  // Every cell represents one mixed-colour pair.

  await until(S(36));
  await play(
    ...showGrid(
      BLUES,
      ORANGES,
      'mixed',
      'Blue tile ↓   Orange tile →'
    ),
    ...fbox([
      ['one of each colour', C.violet],
      ['5 blue choices', BLUE],
      ['3 orange choices', ORANGE]
    ], C.violet),
    ...say('EACH BLUE CAN PAIR WITH EACH ORANGE', C.violet)
  );

  // 37: 5 × 3 = 15 mixed pairs.
  // No halving is needed because every pair is listed only once:
  // the blue number is always written first.

  const mixedRowRings = BLUES.map(
    (_, i) =>
      outline(
        CX,
        grid.gy(i),
        2 * grid.dx + grid.wd + 0.16,
        grid.ht + 0.12,
        C.violet,
        2
      )
  );

  await until(S(37));
  await play(
    ...addMarks(mixedRowRings),
    lag(
      grid.entries.map(e =>
        new M.Indicate(
          e.obj,
          { color: C.violet }
        )
      ),
      3.4,
      0.12
    ),
    ...fbox([
      ['5 × 3 = 15', C.violet],
      ['15 mixed pairs', C.ink],
      ['no halving', C.green]
    ], C.violet),
    ...say('5 × 3 = 15 MIXED PAIRS', C.violet)
  );

  await until(S(37) + 4.5);
  await play(
    ...clearMarks(),
    new M.Indicate(
      grid.footer,
      { color: C.green }
    ),
    ...fbox([
      ['blue always named first', BLUE],
      ['orange named second', ORANGE],
      ['no pair listed twice', C.green]
    ], C.green),
    ...say('NO DUPLICATES, SO NO HALVING', C.green)
  );

  // Category inventory.
  //
  // Arrange all 28 unordered pairs into three groups:
  // 10 blue-blue, 3 orange-orange, 15 blue-orange.
  //
  // Each pair appears exactly once.
  // The layout has six rows:
  //   rows 0-1: 10 blue pairs
  //   row  2:    3 orange pairs
  //   rows 3-5: 15 mixed pairs

  const INV_X0 = CX - 1.87;
  const INV_DX = 1.02;

  const INV_TOP = P ? 0.98 : 0.87;
  const INV_DY = P ? 0.65 : 0.52;

  const INV_W = 0.9;
  const INV_H = P ? 0.48 : 0.42;

  const INV_LABEL_X = CX - 2.88;

  function inventoryPos(r, c) {
    return [
      INV_X0 + c * INV_DX,
      INV_TOP - r * INV_DY,
      0
    ];
  }

  function makeInventory() {
    const blueCells = bluePairs.map(
      ([a, b], k) =>
        gridCell(
          a,
          b,
          inventoryPos(
            Math.floor(k / 5),
            k % 5
          ),
          INV_W,
          INV_H,
          'bright'
        )
    );

    const orangeCells = orangePairs.map(
      ([a, b], k) =>
        gridCell(
          a,
          b,
          inventoryPos(2, k),
          INV_W,
          INV_H,
          'bright'
        )
    );

    const mixedCells = mixedPairs.map(
      ([a, b], k) =>
        gridCell(
          a,
          b,
          inventoryPos(
            3 + Math.floor(k / 5),
            k % 5
          ),
          INV_W,
          INV_H,
          'bright'
        )
    );

    const blueLabel = txt(
      '10',
      23,
      BLUE,
      [
        INV_LABEL_X,
        INV_TOP - INV_DY / 2,
        0
      ],
      true
    );

    const orangeLabel = txt(
      '3',
      23,
      ORANGE,
      [
        INV_LABEL_X,
        INV_TOP - 2 * INV_DY,
        0
      ],
      true
    );

    const mixedLabel = txt(
      '15',
      23,
      C.violet,
      [
        INV_LABEL_X,
        INV_TOP - 4 * INV_DY,
        0
      ],
      true
    );

    const heading = txt(
      'Every different pair',
      20,
      C.green,
      [CX, P ? 1.75 : 1.42, 0]
    );

    const total = txt(
      '10 + 3 + 15 = 28',
      23,
      C.green,
      [
        CX,
        INV_TOP - 5 * INV_DY - 0.56,
        0
      ],
      true
    );

    const blueFrame = outline(
      INV_X0 + 2 * INV_DX,
      INV_TOP - INV_DY / 2,
      4 * INV_DX + INV_W + 0.14,
      INV_DY + INV_H + 0.12,
      BLUE,
      2
    );

    const orangeFrame = outline(
      INV_X0 + INV_DX,
      INV_TOP - 2 * INV_DY,
      2 * INV_DX + INV_W + 0.14,
      INV_H + 0.12,
      ORANGE,
      2
    );

    const mixedFrame = outline(
      INV_X0 + 2 * INV_DX,
      INV_TOP - 4 * INV_DY,
      4 * INV_DX + INV_W + 0.14,
      2 * INV_DY + INV_H + 0.12,
      C.violet,
      2
    );

    return {
      blueCells,
      orangeCells,
      mixedCells,
      blueLabel,
      orangeLabel,
      mixedLabel,
      blueFrame,
      orangeFrame,
      mixedFrame,
      heading,
      total,
      objects: [
        heading,
        ...blueCells,
        ...orangeCells,
        ...mixedCells,
        blueLabel,
        orangeLabel,
        mixedLabel,
        blueFrame,
        orangeFrame,
        mixedFrame,
        total
      ]
    };
  }

  // 38: check the total.
  // 10 blue pairs + 3 orange pairs + 15 mixed pairs = 28.

  let inventory = makeInventory();

  await until(S(38));
  await play(
    ...clearPicture(),
    new M.FadeIn(inventory.heading),
    lag([
      new M.LaggedStart(
        inventory.blueCells.map(o => new M.FadeIn(o)),
        { lagRatio: 0.06 }
      ),
      new M.LaggedStart(
        inventory.orangeCells.map(o => new M.FadeIn(o)),
        { lagRatio: 0.12 }
      ),
      new M.LaggedStart(
        inventory.mixedCells.map(o => new M.FadeIn(o)),
        { lagRatio: 0.04 }
      )
    ], 2.5, 0.55),
    ...appear([
      inventory.blueLabel,
      inventory.orangeLabel,
      inventory.mixedLabel
    ]),
    ...[
      inventory.blueFrame,
      inventory.orangeFrame,
      inventory.mixedFrame
    ].map(r => new M.Create(r)),
    new M.FadeIn(inventory.total),
    ...fbox([
      ['both blue: 10', BLUE],
      ['both orange: 3', ORANGE],
      ['mixed: 15', C.violet],
      ['total = 28', C.green]
    ], C.green),
    ...say('10 + 3 + 15 = 28', C.green)
  );

  picture = inventory.objects.slice();

  // 39: combinations count groups when only membership matters.
  // The order used to list the members is irrelevant.

  await until(S(39));
  await play(
    new M.Indicate(
      inventory.total,
      { color: C.green }
    ),
    ...fbox([
      ['use combinations when:', C.green],
      ['you choose a group', C.ink],
      ['only membership matters', C.ink],
      ['order does not matter', C.muted]
    ], C.green),
    ...say('ONLY WHO IS IN THE GROUP MATTERS', C.green)
  );

  // Person icon for the team-selection example.
  // Same native primitives as the earlier course lessons.

  function person(n, p, mode = 'normal') {
    const [x, y] = p;

    const c = mode === 'bright'
      ? C.green
      : mode === 'dim'
        ? C.muted
        : C.ink;

    const head = new M.Circle({
      radius: 0.14,
      color: c,
      strokeWidth: 2
    });

    head.setFill(
      c,
      mode === 'dim' ? 0.25 : 0.95
    );

    head.moveTo([x, y + 0.33, 0]);

    const body = new M.Arc({
      radius: 0.26,
      startAngle: 0,
      angle: Math.PI,
      color: c
    });

    body.setFill(
      c,
      mode === 'dim' ? 0.2 : 0.85
    );

    body.moveTo([x, y - 0.02, 0]);

    const lab = txt(
      String(n),
      18,
      c,
      [x, y - 0.47, 0],
      true
    );

    return new M.VGroup(
      head,
      body,
      lab
    );
  }

  // 40: choose two people from eight to form a team.
  // Illustrate one possible team by physically moving two people
  // out of the row. Neither receives a first-place label.

  const people = D.map(
    (n, k) =>
      person(
        n,
        [colx(k), ROW_Y, 0]
      )
  );

  const TEAM_Y = P ? -1.45 : -1.42;

  const teamFrame = outline(
    CX,
    TEAM_Y,
    2.72,
    1.2,
    C.green,
    3
  );

  teamFrame.setFill(C.green, 0.055);

  const teamLabel = txt(
    'One team',
    20,
    C.green,
    [CX, TEAM_Y - 0.86, 0]
  );

  await until(S(40));
  await play(
    ...setPicture([
      ...people,
      teamFrame,
      teamLabel
    ]),
    ...fbox([
      ['choose 2 from 8', C.ink],
      ['order does not matter', C.green],
      ['56 ÷ 2 = 28 teams', C.green]
    ], C.green),
    ...say('8 PEOPLE: CHOOSE A TEAM OF TWO', C.green)
  );

  await play(
    new M.Transform(
      people[1],
      person(
        2,
        [CX - 0.62, TEAM_Y, 0],
        'bright'
      ),
      { pathArc: -0.35 }
    ),
    new M.Transform(
      people[5],
      person(
        6,
        [CX + 0.62, TEAM_Y, 0],
        'bright'
      ),
      { pathArc: 0.35 }
    ),
    ...say('28 POSSIBLE TEAMS', C.green)
  );

  // 41: common trap.
  // Mixing unordered pairs in the numerator
  // with ordered arrangements in the denominator.

  const trapTitle = txt(
    'Do the two counts use the same rule?',
    P ? 19 : 18,
    C.amber,
    [CX, 0.98, 0]
  );

  const trapNumerator = txt(
    '3 orange pairs',
    24,
    ORANGE,
    [CX, 0.2, 0],
    true
  );

  const trapRule = line(
    [CX - 2.22, -0.39, 0],
    [CX + 2.22, -0.39, 0],
    C.ink,
    3
  );

  const trapDenominator = txt(
    '56 arrangements',
    24,
    C.cyan,
    [CX, -0.98, 0],
    true
  );

  const mismatchLabel = txt(
    'Different counting rules!',
    19,
    C.amber,
    [CX, -2.03, 0]
  );

  await until(S(41));
  await play(
    ...setPicture([
      trapTitle,
      trapNumerator,
      trapRule,
      trapDenominator,
      mismatchLabel
    ]),
    ...fbox([
      ['common trap', C.amber],
      ['pairs on top', ORANGE],
      ['arrangements below', C.cyan],
      ['rules do not match', C.amber]
    ], C.amber),
    ...say('COMMON TRAP: MIXING THE TWO COUNTS', C.amber)
  );

  // 42: suppose we use three orange pairs
  // but divide by 56 arrangements.
  // Display the wrong fraction explicitly as a wrong method.

  const wrongProbability = probabilityRow(
    3,
    56,
    PROB_Y1,
    'Wrong: pairs ÷ arrangements',
    C.amber
  );

  const wrongTag = pill(
    'WRONG',
    C.amber,
    17
  );

  wrongTag.moveTo([
    CX,
    PROB_Y2,
    0
  ]);

  const wrongExplanation = txt(
    'The numerator and denominator do not match',
    P ? 17 : 16,
    C.muted,
    [CX, PROB_Y2 - 0.63, 0]
  );

  await until(S(42));
  await play(
    ...setPicture([
      ...wrongProbability,
      wrongTag,
      wrongExplanation
    ]),
    ...fbox([
      ['incorrect fraction:', C.amber],
      ['3 orange pairs', ORANGE],
      ['÷ 56 arrangements', C.cyan],
      ['= 3/56', C.amber]
    ], C.amber),
    ...say('WRONG: THREE PAIRS OUT OF 56 ARRANGEMENTS', C.amber)
  );

  // 43: 3/56 is half the correct probability.
  // Compare the two filled lengths directly.

  const trueProbability = probabilityRow(
    3,
    28,
    PROB_Y2,
    'Correct: pairs ÷ pairs',
    ORANGE
  );

  const wrongEndX = CX -
    PROB_W / 2 +
    PROB_W * 3 / 56;

  const trueEndX = CX -
    PROB_W / 2 +
    PROB_W * 3 / 28;

  const wrongBoundary = new M.DashedLine({
    start: [
      wrongEndX,
      PROB_Y1 + PROB_H / 2 + 0.08,
      0
    ],
    end: [
      wrongEndX,
      PROB_Y2 - PROB_H / 2 - 0.08,
      0
    ],
    color: C.amber
  });

  const trueBoundary = new M.DashedLine({
    start: [
      trueEndX,
      PROB_Y1 + PROB_H / 2 + 0.08,
      0
    ],
    end: [
      trueEndX,
      PROB_Y2 - PROB_H / 2 - 0.08,
      0
    ],
    color: C.green
  });

  await until(S(43));
  await play(
    ...dropPicture([
      wrongTag,
      wrongExplanation
    ]),
    ...addPicture([
      ...trueProbability,
      wrongBoundary,
      trueBoundary
    ]),
    ...fbox([
      ['wrong:   3/56', C.amber],
      ['correct: 3/28', ORANGE],
      ['wrong is only half', C.amber]
    ], C.amber),
    ...say('ONLY HALF THE TRUE CHANCE', C.amber)
  );

  // 44: explain the exact mismatch.
  // Three was counted without order.
  // Fifty-six was counted with order.

  await until(S(44));
  await play(
    ...fbox([
      ['3: order ignored', ORANGE],
      ['56: order matters', C.cyan],
      ['different rules!', C.amber]
    ], C.amber),
    ...say('TOP AND BOTTOM USE DIFFERENT RULES', C.amber)
  );

  // 45: both parts of the probability fraction
  // must be counted in the same way.
  //
  // Show both valid approaches:
  //   6 ordered orange arrangements / 56 ordered arrangements
  //   3 unordered orange pairs / 28 unordered pairs

  const correctOrdered = probabilityRow(
    6,
    56,
    PROB_Y1,
    'Arrangements ÷ arrangements',
    ORANGE
  );

  const correctUnordered = probabilityRow(
    3,
    28,
    PROB_Y2,
    'Pairs ÷ pairs',
    ORANGE
  );

  const consistentBoundary = shareBoundary(
    3,
    28
  );

  await until(S(45));
  await play(
    ...setPicture([
      ...correctOrdered,
      ...correctUnordered,
      consistentBoundary
    ]),
    ...fbox([
      ['ordered:   6/56', C.green],
      ['unordered: 3/28', C.green],
      ['same rule top and bottom', C.ink]
    ], C.green),
    ...say('COUNT TOP AND BOTTOM BY THE SAME RULE', C.green)
  );

  // 46: always decide whether order matters before counting.

  const decisionY = P ? 0.45 : 0.3;

  const orderedDecision = pair(
    1,
    2,
    [CX - 1.65, decisionY, 0],
    0.66,
    true
  );

  const unorderedDecision = pair(
    1,
    2,
    [CX + 1.65, decisionY, 0],
    0.66,
    false
  );

  const orderYes = txt(
    'Order matters',
    18,
    C.cyan,
    [CX - 1.65, decisionY - 0.85, 0]
  );

  const orderNo = txt(
    'Order does not matter',
    17,
    C.violet,
    [CX + 1.65, decisionY - 0.85, 0]
  );

  const orderYesCount = txt(
    '56 arrangements',
    19,
    C.cyan,
    [CX - 1.65, decisionY - 1.4, 0],
    true
  );

  const orderNoCount = txt(
    '28 combinations',
    19,
    C.violet,
    [CX + 1.65, decisionY - 1.4, 0],
    true
  );

  const decisionDivider = line(
    [CX, decisionY + 0.64, 0],
    [CX, decisionY - 1.74, 0],
    C.muted,
    2
  );

  await until(S(46));
  await play(
    ...setPicture([
      orderedDecision,
      unorderedDecision,
      orderYes,
      orderNo,
      orderYesCount,
      orderNoCount,
      decisionDivider
    ]),
    ...fbox([
      ['before counting, ask:', C.amber],
      ['does order matter?', C.ink],
      ['yes: arrangements', C.cyan],
      ['no: combinations', C.violet]
    ], C.amber),
    ...say('FIRST ASK: DOES THE ORDER MATTER?', C.amber)
  );

  // 47: preview the next chapter.
  // Learning a fact can change a probability.
  // Do not teach conditional probability or introduce its formula.

  const previewRow = originalRow();

  const previewQuestion = txt(
    'What if we learn something new?',
    P ? 20 : 19,
    C.violet,
    [CX, -0.72, 0]
  );

  const previewCard = outline(
    CX,
    -1.72,
    4.3,
    0.87,
    C.violet,
    2
  );

  previewCard.setFill(
    C.violet,
    0.08
  );

  const previewFact = txt(
    'A new fact...',
    22,
    C.violet,
    [CX, -1.72, 0]
  );

  await until(S(47));
  await play(
    ...setPicture([
      ...previewRow,
      previewQuestion,
      previewCard,
      previewFact
    ]),
    ...fbox([
      ['next chapter', C.violet],
      ['new information', C.ink],
      ['can change a chance', C.muted]
    ], C.violet),
    ...say('NEXT: WHEN WE LEARN SOMETHING NEW', C.violet)
  );

  // 48: final takeaway.
  //
  // Restore the full ordered matrix, then fold it once more.
  // The 56 ordered outcomes become 28 unordered pairs.
  // Every surviving pair contains two different physical tiles.

  await until(S(48));
  await play(
    ...showGrid(
      D,
      D,
      'ordered',
      '56 ordered arrangements'
    ),
    ...fbox([
      ['count the arrangements', C.ink],
      ['8 × 7 = 56', C.cyan],
      ['each pair appears twice', C.amber]
    ], C.green),
    ...say('FIRST COUNT THE ARRANGEMENTS', C.green)
  );

  await until(S(48) + 2.1);
  await play(
    lag(
      foldGridAnimations(),
      1.45,
      0.035
    ),
    ...say('THEN DIVIDE BY TWO', C.amber),
    ...fbox([
      ['pairs = arrangements ÷ 2', C.ink],
      ['56 ÷ 2', C.amber],
      ['= 28', C.green]
    ], C.green)
  );

  await play(
    ...finishGridFold(),
    ...say('ORDER DOES NOT MATTER: 28 PAIRS', C.green)
  );

  await until(E(48));
}

// lesson 4.1.5
// Counting arrangements: multiply the choices at each ordered draw.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D = [1, 2, 3, 4, 5, 6, 7, 8];
  const WARM = [1, 2, 3];
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
      cornerRadius: 0.13,
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

  function arrow(a, b, color = C.muted, sw = 2) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / len;
    const uy = dy / len;

    const h = 0.13;
    const w = 0.065;

    const left = [
      b[0] - h * ux - w * uy,
      b[1] - h * uy + w * ux,
      0
    ];

    const right = [
      b[0] - h * ux + w * uy,
      b[1] - h * uy - w * ux,
      0
    ];

    return new M.VGroup(
      line(a, b, color, sw),
      line(b, left, color, sw),
      line(b, right, color, sw)
    );
  }

  // Formula box: same structure as the approved reference.
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
  // Smaller versions are used as labels in the choice trees.
  // The smaller drawings do not represent differently sized physical tiles.

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
      dim ? 0.08
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

  // Ordered pair: the arrow makes first and second explicit.
  // Both tiles are freshly constructed before grouping.

  function pair(a, b, p, w = 0.47, mode = 'normal') {
    const dx = w * 0.91;

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

    const arr = arrow(
      [p[0] - dx + w * 0.59, p[1], 0],
      [p[0] + dx - w * 0.59, p[1], 0],
      mode === 'dim' ? C.muted : C.ink,
      1.5
    );

    return new M.VGroup(
      left, arr, right
    );
  }

  // Cloth bag with transparent cutaway.
  // All parts are positioned individually before grouping.

  // A soft sack (same as lesson 4.1.1): round body, tied neck, frilled top.
  const BAG_Y = P ? -0.35 : 0;
  const BS = P ? 1.3 : 1;

  const SACK_R = [
    [0, -1.15], [0.9, -1.12], [1.45, -0.95], [1.72, -0.6], [1.78, -0.2],
    [1.62, 0.2], [1.25, 0.52], [0.75, 0.74], [0.4, 0.86],
    [0.62, 1.05], [0.82, 1.32], [0.5, 1.22], [0.25, 1.38], [0, 1.26]
  ];

  function makeBag() {
    const x = CX;
    const y = BAG_Y - 0.08;
    const q = (px, py) => [x + px * BS, y + py * BS, 0];

    const right = SACK_R.map(([px, py]) => q(px, py));
    const left = SACK_R.slice(1, -1).reverse().map(([px, py]) => q(-px, py));

    const body = new M.Polygon({
      vertices: [...right, ...left],
      color: CLOTH,
      strokeWidth: 3
    });

    body.setFill(CLOTH, 0.2);

    const cord = line(q(-0.5, 0.86), q(0.5, 0.86), CORD, 4);
    const tail1 = line(q(0.42, 0.86), q(0.7, 0.45), CORD, 2);
    const tail2 = line(q(0.42, 0.86), q(0.9, 0.62), CORD, 2);
    const knot = dot(q(0.42, 0.86), 0.07, CORD);

    return new M.VGroup(body, cord, tail1, tail2, knot);
  }

  const bag = makeBag();

  const table = line(
    [CX - 3.3 * (P ? 1.1 : 1), BAG_Y - 1.28 * BS, 0],
    [CX + 3.3 * (P ? 1.1 : 1), BAG_Y - 1.28 * BS, 0],
    C.muted,
    3
  );

  const miniPos = k => [
    CX + (k % 4 - 1.5) * 0.68 * BS,
    BAG_Y + (0.0 - Math.floor(k / 4) * 0.67) * BS,
    0
  ];

  const mini = D.map((n, k) =>
    tile(n, miniPos(k), 0.51 * BS)
  );

  // Current row of physical tiles.
  // Whenever a tile is drawn, its original object moves out of the row.
  // No replacement copy is added to the bag.

  let tiles = [];

  function makeRow(nums = D, y = ROW_Y) {
    tiles = nums.map((n, k) =>
      tile(
        n,
        [
          CX + (k - (nums.length - 1) / 2) * SP,
          y,
          0
        ]
      )
    );

    return [
      lag(
        tiles.map(t => new M.FadeIn(t)),
        1.4,
        0.12
      )
    ];
  }

  function clearRow() {
    const a = fade(tiles);
    tiles = [];
    return a;
  }

  function normalRow() {
    return tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(D[k], pos(k))
      )
    );
  }

  // Temporary visual objects, such as draw slots and labels.

  let extras = [];

  function clearExtras() {
    const a = fade(extras);
    extras = [];
    return a;
  }

  function slot(x, y, label, color = C.muted) {
    const r = outline(
      x,
      y,
      1.02,
      1.02,
      color,
      2
    );

    const lab = txt(
      label,
      17,
      color,
      [x, y - 0.77, 0]
    );

    return [r, lab];
  }

  const DRAW_Y = P ? -2.3 : -1.35;
  const FIRST_X = CX - 0.95;
  const SECOND_X = CX + 0.95;

  // 0: back to our bag of eight tiles.

  await until(S(0));
  await play(
    new M.Create(table),
    new M.FadeIn(bag),
    ...say('OUR BAG OF 8 TILES')
  );

  // 1: five blue and three orange.

  await until(S(1));
  await play(
    lag(
      mini.map(t => new M.FadeIn(t)),
      3.5,
      0.2
    ),
    ...say('5 BLUE  /  3 ORANGE')
  );

  // 2: until now, we drew just one tile.
  // Introduce the new two-draw game.

  const newSlots = [
    ...slot(FIRST_X, DRAW_Y, 'First draw', C.cyan),
    ...slot(SECOND_X, DRAW_Y, 'Second draw', C.muted)
  ];

  await until(S(2));
  await play(
    new M.FadeOut(bag),
    new M.FadeOut(table),
    ...fade(mini),
    ...makeRow(),
    ...appear(newSlots),
    ...fbox([
      ['old game: 1 draw', C.muted],
      ['new game: 2 draws', C.green]
    ], C.green),
    ...say('NOW THE GAME HAS TWO DRAWS', C.green)
  );

  extras = newSlots;

  // 3: draw a first tile and leave it on the table.
  // Tile three is an illustrative first draw.

  await until(S(3));
  await play(
    new M.Transform(
      tiles[2],
      tile(
        3,
        [FIRST_X, DRAW_Y, 0],
        0.78,
        'bright'
      ),
      { pathArc: -0.45 }
    ),
    ...fbox([
      ['first draw: tile 3', BLUE],
      ['7 tiles remain', C.ink]
    ], BLUE),
    ...say('FIRST TILE STAYS ON THE TABLE', C.cyan)
  );

  // 4: draw a second tile.
  // Tile six is an illustrative second draw.

  await until(S(4));
  await play(
    new M.Transform(
      tiles[5],
      tile(
        6,
        [SECOND_X, DRAW_Y, 0],
        0.78,
        'bright'
      ),
      { pathArc: 0.4 }
    ),
    ...fbox([
      ['first:  3', BLUE],
      ['second: 6', ORANGE]
    ]),
    ...say('THEN DRAW A SECOND TILE', C.amber)
  );

  // 5: the first tile does not go back.
  // The empty original positions show that the two tiles
  // have actually been removed from the available choices.

  const drawArrow = arrow(
    [FIRST_X + 0.57, DRAW_Y, 0],
    [SECOND_X - 0.57, DRAW_Y, 0],
    C.amber,
    3
  );

  const noReturn = txt(
    'Without putting back',
    19,
    C.amber,
    [CX, P ? -3.75 : -2.55, 0]
  );

  await until(S(5));
  await play(
    new M.FadeIn(drawArrow),
    new M.FadeIn(noReturn),
    new M.Indicate(
      tiles[2],
      { color: C.amber }
    ),
    ...fbox([
      ['without putting back', C.amber],
      ['first tile is gone', C.ink],
      ['from the bag', C.muted]
    ], C.amber),
    ...say('NO PUTTING THE FIRST TILE BACK', C.amber)
  );

  extras.push(drawArrow, noReturn);

  // 6: how many different outcomes can two draws have?

  await until(S(6));
  await play(
    ...fbox([
      ['two ordered draws', C.ink],
      ['how many outcomes?', C.amber],
      ['?', C.amber]
    ], C.amber),
    ...say('HOW MANY DIFFERENT WAYS?', C.amber)
  );

  // 7: first list the possible outcomes.
  // Recall the sample-space idea.

  await until(S(7));
  await play(
    ...clearExtras(),
    ...normalRow(),
    ...fbox([
      ['step 1', C.green],
      ['list what can happen', C.ink],
      ['then find chances', C.muted]
    ], C.green),
    ...say('START BY LISTING THE OUTCOMES', C.green)
  );

  // 8: warm up with only three tiles.
  // Keep tiles 1, 2 and 3 and remove the other five
  // from this temporary example.

  const warmRowPos = k => [
    CX + (k - 1) * 1.2,
    ROW_Y,
    0
  ];

  await until(S(8));
  await play(
    ...fade(tiles.slice(3)),
    ...tiles.slice(0, 3).map((t, k) =>
      new M.Transform(
        t,
        tile(WARM[k], warmRowPos(k), 0.84)
      )
    ),
    ...fbox([
      ['warm-up', C.green],
      ['only tiles 1, 2, 3', C.ink]
    ], C.green),
    ...say('WARM-UP: JUST THREE TILES', C.green)
  );

  tiles = tiles.slice(0, 3);

  // Small choice tree.
  //
  //                   first         second
  //                     1 -------- 2
  //                       -------- 3
  //       start ------ 2 -------- 1
  //                       -------- 3
  //                     3 -------- 1
  //                       -------- 2
  //
  // Each leaf is one ordered arrangement.
  // A tile cannot follow itself.

  const ROOT_X = CX - 2.8;
  const FIRST_TREE_X = CX - 1.25;
  const SECOND_TREE_X = CX + 1.52;

  const LEAF_TOP = P ? 1.02 : 0.93;
  const LEAF_SP = P ? 0.98 : 0.65;

  const leafY = k =>
    LEAF_TOP - k * LEAF_SP;

  const firstY = k =>
    (leafY(2 * k) + leafY(2 * k + 1)) / 2;

  const ROOT_Y = firstY(1);

  const ROOT_P = [
    ROOT_X,
    ROOT_Y,
    0
  ];

  const FIRST_W = 0.58;
  const LEAF_W = 0.43;

  const warmOutcomes = [
    [1, 2],
    [1, 3],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 2]
  ];

  let treeObjects = [];
  let warmFirst = [];
  let warmFirstBranches = [];
  let warmLeaves = [];
  let warmSecondBranches = [];
  let warmLeafLabels = [];

  function clearTree() {
    const a = fade(treeObjects);

    treeObjects = [];
    warmFirst = [];
    warmFirstBranches = [];
    warmLeaves = [];
    warmSecondBranches = [];
    warmLeafLabels = [];

    return a;
  }

  function warmBranch(k) {
    return line(
      [ROOT_X + 0.12, ROOT_Y, 0],
      [FIRST_TREE_X - FIRST_W / 2 - 0.05, firstY(k), 0],
      C.cyan,
      2
    );
  }

  function warmSecondBranch(k) {
    const parent = Math.floor(k / 2);

    return line(
      [
        FIRST_TREE_X + FIRST_W / 2 + 0.06,
        firstY(parent),
        0
      ],
      [
        SECOND_TREE_X - 0.76,
        leafY(k),
        0
      ],
      C.muted,
      2
    );
  }

  function warmLeaf(k, fullPair = true) {
    const [a, b] = warmOutcomes[k];
    const p = [SECOND_TREE_X, leafY(k), 0];

    return fullPair
      ? pair(a, b, p, LEAF_W)
      : tile(b, p, LEAF_W + 0.08);
  }

  function warmLeafRing(k, color = C.amber) {
    return outline(
      SECOND_TREE_X,
      leafY(k),
      LEAF_W * 2.82 + 0.17,
      LEAF_W + 0.18,
      color,
      2.5
    );
  }

  // 9: begin drawing a tree.

  const root = dot(ROOT_P, 0.11, C.cyan);

  const rootLab = txt(
    'Start',
    16,
    C.muted,
    [ROOT_X, ROOT_Y - 0.33, 0]
  );

  const firstHeading = txt(
    'First draw',
    18,
    C.cyan,
    [FIRST_TREE_X, LEAF_TOP + 0.48, 0]
  );

  const secondHeading = txt(
    'Second draw',
    18,
    C.green,
    [SECOND_TREE_X, LEAF_TOP + 0.48, 0]
  );

  await until(S(9));
  await play(
    ...clearRow(),
    new M.FadeIn(root),
    new M.FadeIn(rootLab),
    new M.FadeIn(firstHeading),
    new M.FadeIn(secondHeading),
    ...clearBox(),
    ...say('DRAW A TREE OF POSSIBILITIES')
  );

  treeObjects = [
    root,
    rootLab,
    firstHeading,
    secondHeading
  ];

  // 10: a branch is a line representing one choice.
  // Demonstrate the shape before attaching actual tile numbers.

  const demoP = [
    FIRST_TREE_X,
    ROOT_Y,
    0
  ];

  const demoBranch = line(
    [ROOT_X + 0.12, ROOT_Y, 0],
    demoP,
    C.amber,
    3
  );

  const demoNode = dot(
    demoP,
    0.1,
    C.amber
  );

  const branchLab = txt(
    'One choice',
    17,
    C.amber,
    [
      (ROOT_X + FIRST_TREE_X) / 2,
      ROOT_Y + 0.3,
      0
    ]
  );

  await until(S(10));
  await play(
    new M.Create(demoBranch),
    new M.FadeIn(demoNode),
    new M.FadeIn(branchLab),
    ...fbox([
      ['tree = picture of choices', C.ink],
      ['one line = one branch', C.amber]
    ], C.amber),
    ...say('ONE CHOICE = ONE BRANCH', C.amber)
  );

  treeObjects.push(
    demoBranch,
    demoNode,
    branchLab
  );

  // 11: a branch can split for the next choice.

  const splitDemo = [-0.55, 0.55].map(dy =>
    line(
      demoP,
      [
        SECOND_TREE_X - 0.4,
        ROOT_Y + dy,
        0
      ],
      C.green,
      2.5
    )
  );

  const splitDots = [-0.55, 0.55].map(dy =>
    dot(
      [
        SECOND_TREE_X - 0.4,
        ROOT_Y + dy,
        0
      ],
      0.085,
      C.green
    )
  );

  await until(S(11));
  await play(
    lag(
      splitDemo.map(b => new M.Create(b)),
      1.5,
      0.3
    ),
    ...appear(splitDots),
    ...fbox([
      ['first choice', C.amber],
      ['branches split', C.green],
      ['into next choices', C.ink]
    ], C.green),
    ...say('EACH CHOICE CAN LEAD TO MORE CHOICES', C.green)
  );

  treeObjects.push(
    ...splitDemo,
    ...splitDots
  );

  // 12: the first draw has three possible choices.

  warmFirstBranches = WARM.map((_, k) =>
    warmBranch(k)
  );

  warmFirst = WARM.map((n, k) =>
    tile(
      n,
      [FIRST_TREE_X, firstY(k), 0],
      FIRST_W
    )
  );

  await until(S(12));
  await play(
    ...fade([
      demoBranch,
      demoNode,
      branchLab,
      ...splitDemo,
      ...splitDots
    ]),
    lag(
      warmFirstBranches.map(b => new M.Create(b)),
      1.7,
      0.24
    ),
    lag(
      warmFirst.map(t => new M.FadeIn(t)),
      1.7,
      0.24
    ),
    ...fbox([
      ['first draw', C.cyan],
      ['choices: 1, 2, 3', C.ink],
      ['3 branches', C.amber]
    ], C.cyan),
    ...say('FIRST DRAW: THREE CHOICES')
  );

  treeObjects = [
    root,
    rootLab,
    firstHeading,
    secondHeading,
    ...warmFirstBranches,
    ...warmFirst
  ];

  // 13: if the first tile is one, only two and three remain.
  // Grow exactly two second-draw branches.

  warmSecondBranches[0] = warmSecondBranch(0);
  warmSecondBranches[1] = warmSecondBranch(1);

  warmLeaves[0] = warmLeaf(0, false);
  warmLeaves[1] = warmLeaf(1, false);

  await until(S(13));
  await play(
    new M.Indicate(
      warmFirst[0],
      { color: C.amber }
    ),
    lag([
      new M.Create(warmSecondBranches[0]),
      new M.Create(warmSecondBranches[1])
    ], 2.0, 0.45),
    lag([
      new M.FadeIn(warmLeaves[0]),
      new M.FadeIn(warmLeaves[1])
    ], 2.0, 0.45),
    ...fbox([
      ['first = 1', BLUE],
      ['left: 2 and 3', C.ink],
      ['2 next choices', C.green]
    ], C.green),
    ...say('IF FIRST IS 1, ONLY 2 AND 3 REMAIN', C.green)
  );

  treeObjects.push(
    warmSecondBranches[0],
    warmSecondBranches[1],
    warmLeaves[0],
    warmLeaves[1]
  );

  // 14: reveal the two complete ordered outcomes.
  // One then two, and one then three.

  await until(S(14));
  await play(
    new M.FadeOut(warmLeaves[0]),
    new M.FadeOut(warmLeaves[1]),
    ...fbox([
      ['1 then 2', C.ink],
      ['1 then 3', C.ink],
      ['2 outcomes', C.green]
    ], C.green),
    ...say('1 THEN 2  /  1 THEN 3', C.green)
  );

  treeObjects = treeObjects.filter(
    o => o !== warmLeaves[0] && o !== warmLeaves[1]
  );

  warmLeaves[0] = warmLeaf(0);
  warmLeaves[1] = warmLeaf(1);

  await play(
    ...appear([
      warmLeaves[0],
      warmLeaves[1]
    ])
  );

  treeObjects.push(
    warmLeaves[0],
    warmLeaves[1]
  );

  // 15: first tile two gives two then one, or two then three.

  warmSecondBranches[2] = warmSecondBranch(2);
  warmSecondBranches[3] = warmSecondBranch(3);

  warmLeaves[2] = warmLeaf(2);
  warmLeaves[3] = warmLeaf(3);

  await until(S(15));
  await play(
    new M.Indicate(
      warmFirst[1],
      { color: C.amber }
    ),
    lag([
      new M.Create(warmSecondBranches[2]),
      new M.Create(warmSecondBranches[3])
    ], 1.8, 0.4),
    lag([
      new M.FadeIn(warmLeaves[2]),
      new M.FadeIn(warmLeaves[3])
    ], 1.8, 0.4),
    ...fbox([
      ['first = 2', BLUE],
      ['2 then 1', C.ink],
      ['2 then 3', C.ink]
    ]),
    ...say('2 THEN 1  /  2 THEN 3')
  );

  treeObjects.push(
    warmSecondBranches[2],
    warmSecondBranches[3],
    warmLeaves[2],
    warmLeaves[3]
  );

  // 16: first tile three gives three then one, or three then two.

  warmSecondBranches[4] = warmSecondBranch(4);
  warmSecondBranches[5] = warmSecondBranch(5);

  warmLeaves[4] = warmLeaf(4);
  warmLeaves[5] = warmLeaf(5);

  await until(S(16));
  await play(
    new M.Indicate(
      warmFirst[2],
      { color: C.amber }
    ),
    lag([
      new M.Create(warmSecondBranches[4]),
      new M.Create(warmSecondBranches[5])
    ], 1.8, 0.4),
    lag([
      new M.FadeIn(warmLeaves[4]),
      new M.FadeIn(warmLeaves[5])
    ], 1.8, 0.4),
    ...fbox([
      ['first = 3', BLUE],
      ['3 then 1', C.ink],
      ['3 then 2', C.ink]
    ]),
    ...say('3 THEN 1  /  3 THEN 2')
  );

  treeObjects.push(
    warmSecondBranches[4],
    warmSecondBranches[5],
    warmLeaves[4],
    warmLeaves[5]
  );

  // 17: count the six ends of the branches.

  warmLeafLabels = warmOutcomes.map((_, k) =>
    txt(
      String(k + 1),
      16,
      C.green,
      [
        SECOND_TREE_X + 1.12,
        leafY(k),
        0
      ],
      true
    )
  );

  await until(S(17));
  await play(
    lag(
      warmLeafLabels.map(t => new M.FadeIn(t)),
      1.7,
      0.18
    ),
    ...fbox([
      ['count the branch ends', C.ink],
      ['6 outcomes', C.green]
    ], C.green),
    ...say('SIX POSSIBLE OUTCOMES', C.green)
  );

  treeObjects.push(...warmLeafLabels);

  // 18: one then two and two then one are different.

  const reversedMarks = [
    warmLeafRing(0, C.amber),
    warmLeafRing(2, C.amber)
  ];

  await until(S(18));
  await play(
    ...appear(reversedMarks),
    lag([
      new M.Indicate(
        warmLeaves[0],
        { color: C.amber }
      ),
      new M.Indicate(
        warmLeaves[2],
        { color: C.amber }
      )
    ], 2.8, 0.8),
    ...fbox([
      ['1 then 2', C.ink],
      ['is different from', C.amber],
      ['2 then 1', C.ink]
    ], C.amber),
    ...say('1 THEN 2 IS NOT 2 THEN 1', C.amber)
  );

  extras = reversedMarks;

  // 19: order matters.
  // Which tile came first is part of the outcome.

  await until(S(19));
  await play(
    new M.Indicate(
      firstHeading,
      { color: C.amber }
    ),
    new M.Indicate(
      secondHeading,
      { color: C.green }
    ),
    ...fbox([
      ['order matters', C.amber],
      ['first tile matters', C.ink],
      ['second tile matters', C.ink]
    ], C.amber),
    ...say('THE ORDER IS PART OF THE OUTCOME', C.amber)
  );

  // 20: name the ordered outcome.
  // It is called an arrangement.

  await until(S(20));
  await play(
    ...clearExtras(),
    ...fbox([
      ['arrangement', C.green],
      ['an ordered list', C.ink],
      ['of draws', C.muted]
    ], C.green),
    ...say('ORDERED DRAWS = ARRANGEMENT', C.green)
  );

  // 21: find the pattern.
  // Three first branches, each splitting into two.

  const warmGroupRings = WARM.map((_, k) =>
    outline(
      SECOND_TREE_X,
      firstY(k),
      LEAF_W * 2.82 + 0.2,
      LEAF_SP + LEAF_W + 0.14,
      C.green,
      2
    )
  );

  await until(S(21));
  await play(
    lag(
      warmFirst.map(t =>
        new M.Indicate(
          t,
          { color: C.cyan }
        )
      ),
      2.0,
      0.3
    ),
    lag(
      warmGroupRings.map(r => new M.Create(r)),
      2.0,
      0.3
    ),
    ...fbox([
      ['3 first branches', C.cyan],
      ['2 ends from each', C.green]
    ], C.green),
    ...say('THREE BRANCHES, TWO FROM EACH', C.green)
  );

  extras = warmGroupRings;

  // 22: multiply instead of drawing the whole tree.

  await until(S(22));
  await play(
    lag(
      warmGroupRings.map(r =>
        new M.Indicate(
          r,
          { color: C.amber }
        )
      ),
      2.6,
      0.4
    ),
    ...fbox([
      ['choices: 3 × 2', C.ink],
      ['= 6 arrangements', C.green]
    ], C.green),
    ...say('3 × 2 = 6 ARRANGEMENTS', C.green)
  );

  // 23: back to all eight tiles.

  await until(S(23));
  await play(
    ...clearTree(),
    ...clearExtras(),
    ...makeRow(),
    ...clearBox(),
    ...say('BACK TO ALL EIGHT TILES')
  );

  // 24: eight choices for the first tile.

  const firstChoiceFrame = outline(
    CX,
    ROW_Y,
    7 * SP + TW + 0.33,
    TW + 0.38,
    C.cyan,
    2
  );

  const firstChoiceLab = txt(
    '8 possible first draws',
    19,
    C.cyan,
    [CX, ROW_Y - 0.84, 0]
  );

  await until(S(24));
  await play(
    new M.Create(firstChoiceFrame),
    new M.FadeIn(firstChoiceLab),
    ...fbox([
      ['first draw = 8 choices', C.cyan]
    ]),
    ...say('FIRST DRAW: 8 CHOICES')
  );

  extras = [
    firstChoiceFrame,
    firstChoiceLab
  ];

  // 25: whatever comes out, seven remain.
  // Demonstrate with tile three, without changing the general rule.

  const chosenP = [
    CX,
    DRAW_Y,
    0
  ];

  const chosenSlot = slot(
    CX,
    DRAW_Y,
    'Already drawn',
    C.amber
  );

  const remainingFrame = outline(
    CX,
    ROW_Y,
    7 * SP + TW + 0.33,
    TW + 0.38,
    C.muted,
    2
  );

  const emptyPlace = outline(
    colx(2),
    ROW_Y,
    TW,
    TW,
    C.muted,
    1
  );

  emptyPlace.setFill(
    C.muted,
    0.035
  );

  await until(S(25));
  await play(
    ...clearExtras(),
    new M.Transform(
      tiles[2],
      tile(
        3,
        chosenP,
        0.78,
        'bright'
      ),
      { pathArc: -0.4 }
    ),
    ...appear(chosenSlot),
    new M.Create(remainingFrame),
    new M.FadeIn(emptyPlace),
    ...fbox([
      ['one tile removed', C.amber],
      ['8 − 1 = 7 left', C.green]
    ], C.green),
    ...say('ONE DRAWN, SEVEN LEFT', C.green)
  );

  extras = [
    ...chosenSlot,
    remainingFrame,
    emptyPlace
  ];

  // 26: seven choices for the second draw.

  const sevenChoices = D.filter(
    n => n !== 3
  );

  const remainingNote = txt(
    '7 possible second draws',
    19,
    C.green,
    [CX, ROW_Y - 0.78, 0]
  );

  await until(S(26));
  await play(
    new M.FadeIn(remainingNote),
    lag(
      sevenChoices.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.green }
        )
      ),
      1.5,
      0.12
    ),
    ...fbox([
      ['first draw  = 8', C.cyan],
      ['second draw = 7', C.green]
    ], C.green),
    ...say('SECOND DRAW: 7 CHOICES', C.green)
  );

  extras.push(remainingNote);

  // Full eight-tile choice tree.
  //
  // Eight first-draw branches.
  // Each first-draw branch has exactly seven second-draw leaves.
  // The forbidden repeated tile is omitted from its branch.
  //
  // Compact downward tree:
  // - one root
  // - eight numbered first-choice tiles
  // - seven second-choice tiles below each first choice
  //
  // There are exactly 56 terminal leaves.
  // Their small size is a diagram layout choice.

  const BIG_SP = P ? 0.86 : 0.85;
  const BIG_PARENT_Y = P ? 0.91 : 0.78;
  const BIG_ROOT_Y = P ? 1.67 : 1.31;

  const BIG_CHILD_TOP = P ? 0.13 : 0.04;
  const BIG_CHILD_SP = P ? 0.72 : 0.405;

  const BIG_PARENT_W = P ? 0.56 : 0.49;
  const BIG_CHILD_W = P ? 0.52 : 0.35;

  const bigX = k =>
    CX + (k - 3.5) * BIG_SP;

  const childY = j =>
    BIG_CHILD_TOP - j * BIG_CHILD_SP;

  const fullOutcomes = D.flatMap(a =>
    D.filter(b => b !== a).map(b => [a, b])
  );

  let bigObjects = [];
  let bigParents = [];
  let bigBranches = [];
  let bigTrunks = [];
  let bigLeaves = [];

  function bigChildPos(k, j) {
    return [
      bigX(k) + 0.10,
      childY(j),
      0
    ];
  }

  function bigChild(a, b, k, j, mode = 'normal') {
    return tile(
      b,
      bigChildPos(k, j),
      BIG_CHILD_W,
      mode
    );
  }

  function bigLeafFrame(entry, color = C.amber) {
    const p = bigChildPos(
      entry.column,
      entry.row
    );

    return outline(
      p[0],
      p[1],
      BIG_CHILD_W + 0.12,
      BIG_CHILD_W + 0.1,
      color,
      2
    );
  }

  function clearBigTree() {
    const a = fade(bigObjects);

    bigObjects = [];
    bigParents = [];
    bigBranches = [];
    bigTrunks = [];
    bigLeaves = [];

    return a;
  }

  function buildBigTree() {
    const root = dot(
      [CX, BIG_ROOT_Y, 0],
      0.075,
      C.cyan
    );

    bigBranches = D.map((n, k) =>
      line(
        [CX, BIG_ROOT_Y - 0.04, 0],
        [
          bigX(k),
          BIG_PARENT_Y + BIG_PARENT_W / 2 + 0.04,
          0
        ],
        C.cyan,
        1.5
      )
    );

    bigParents = D.map((n, k) =>
      tile(
        n,
        [bigX(k), BIG_PARENT_Y, 0],
        BIG_PARENT_W
      )
    );

    bigTrunks = [];
    bigLeaves = [];

    D.forEach((a, k) => {
      const remaining = D.filter(b => b !== a);
      const trunkX = bigX(k) - 0.26;

      const top = BIG_PARENT_Y -
        BIG_PARENT_W / 2 - 0.04;

      const connector = line(
        [bigX(k), top, 0],
        [trunkX, top, 0],
        C.muted,
        1
      );

      const trunk = line(
        [trunkX, top, 0],
        [trunkX, childY(6), 0],
        C.muted,
        1
      );

      const twigs = remaining.map((b, j) =>
        line(
          [trunkX, childY(j), 0],
          [
            bigChildPos(k, j)[0] - BIG_CHILD_W / 2 - 0.025,
            childY(j),
            0
          ],
          C.muted,
          1
        )
      );

      const branchGroup = new M.VGroup(
        connector,
        trunk,
        ...twigs
      );

      bigTrunks.push(branchGroup);

      remaining.forEach((b, j) => {
        bigLeaves.push({
          a,
          b,
          column: k,
          row: j,
          obj: bigChild(a, b, k, j)
        });
      });
    });

    const footer = txt(
      '8 first choices • 7 branches from each',
      P ? 17 : 16,
      C.green,
      [CX, childY(6) - 0.42, 0]
    );

    bigObjects = [
      root,
      ...bigBranches,
      ...bigParents,
      ...bigTrunks,
      ...bigLeaves.map(e => e.obj),
      footer
    ];

    return [
      new M.FadeIn(root),
      lag(
        bigBranches.map(b => new M.Create(b)),
        0.8,
        0.09
      ),
      lag(
        bigParents.map(t => new M.FadeIn(t)),
        0.8,
        0.09
      ),
      lag(
        bigTrunks.map(g => new M.FadeIn(g)),
        1.5,
        0.08
      ),
      lag(
        bigLeaves.map(e => new M.FadeIn(e.obj)),
        2.0,
        0.025
      ),
      new M.FadeIn(footer)
    ];
  }

  function highlightBig(
    firstAllowed = D,
    leafRule = () => true,
    dimOthers = true
  ) {
    const parentAnimations = bigParents.map((t, k) =>
      new M.Transform(
        t,
        tile(
          D[k],
          [bigX(k), BIG_PARENT_Y, 0],
          BIG_PARENT_W,
          firstAllowed.includes(D[k])
            ? 'bright'
            : dimOthers ? 'dim' : 'normal'
        )
      )
    );

    const leafAnimations = bigLeaves.map(e =>
      new M.Transform(
        e.obj,
        bigChild(
          e.a,
          e.b,
          e.column,
          e.row,
          leafRule(e.a, e.b)
            ? 'bright'
            : dimOthers ? 'dim' : 'normal'
        )
      )
    );

    return [
      ...parentAnimations,
      ...leafAnimations
    ];
  }

  function columnRing(k, color = C.green) {
    const top = childY(0) + BIG_CHILD_W / 2;
    const bottom = childY(6) - BIG_CHILD_W / 2;

    return outline(
      bigX(k) + 0.10,
      (top + bottom) / 2,
      BIG_CHILD_W + 0.19,
      top - bottom + 0.13,
      color,
      2
    );
  }

  // 27: picture eight branches, each splitting into seven.
  // Build the full choice tree without ever showing a repeated tile.

  await until(S(27));
  await play(
    ...clearRow(),
    ...clearExtras(),
    ...buildBigTree(),
    ...fbox([
      ['8 first branches', C.cyan],
      ['7 ends from each', C.green]
    ], C.green),
    ...say('8 BRANCHES, 7 FROM EACH', C.green)
  );

  // 28: eight times seven equals fifty-six.

  const columnMarks = D.map((_, k) =>
    columnRing(k, C.green)
  );

  await until(S(28));
  await play(
    lag(
      columnMarks.map(r => new M.Create(r)),
      1.5,
      0.1
    ),
    ...fbox([
      ['8 × 7', C.ink],
      ['= 56', C.green]
    ], C.green),
    ...say('8 × 7 = 56', C.green)
  );

  extras = columnMarks;

  // 29: fifty-six different ordered arrangements.

  await until(S(29));
  await play(
    ...clearExtras(),
    ...fbox([
      ['first choices  = 8', C.cyan],
      ['second choices = 7', C.green],
      ['56 arrangements', C.amber]
    ], C.green),
    ...say('56 DIFFERENT ARRANGEMENTS', C.green)
  );

  // 30: introduce the short version.

  await until(S(30));
  await play(
    ...fbox([
      ['count arrangements', C.green],
      ['multiply the choices', C.ink]
    ], C.green),
    ...say('THE SHORT VERSION', C.green)
  );

  // 31: general multiplication rule for the two ordered draws.

  await until(S(31));
  await play(
    ...fbox([
      ['arrangements =', C.ink],
      ['  first-draw choices', C.cyan],
      ['× second-draw choices', C.green]
    ], C.cyan),
    ...say('FIRST CHOICES × SECOND CHOICES')
  );

  // 32: with no replacement, there is one fewer choice
  // at every successive draw.

  const exampleColumn = columnRing(
    2,
    C.amber
  );

  await until(S(32));
  await play(
    new M.Create(exampleColumn),
    new M.Indicate(
      bigParents[2],
      { color: C.amber }
    ),
    ...fbox([
      ['without putting back', C.amber],
      ['first draw:  8', C.cyan],
      ['second draw: 7', C.green],
      ['one choice fewer', C.ink]
    ], C.amber),
    ...say('ONE CHOICE FEWER EACH DRAW', C.amber)
  );

  extras = [exampleColumn];

  // 33: now use the sample space to answer chance questions.

  await until(S(33));
  await play(
    ...clearExtras(),
    ...fbox([
      ['56 possible outcomes', C.ink],
      ['now find probabilities', C.green]
    ], C.green),
    ...say('NOW WE CAN FIND CHANCES', C.green)
  );

  // 34: every remaining tile is equally likely at each draw.
  // Highlight a first-choice branch, then its seven legal next choices.

  const fairColumn = bigLeaves.filter(
    e => e.a === 1
  );

  await until(S(34));
  await play(
    lag(
      bigParents.map(t =>
        new M.Indicate(
          t,
          { color: C.cyan }
        )
      ),
      1.7,
      0.12
    ),
    ...fbox([
      ['fair first draw', C.cyan],
      ['fair second draw', C.green],
      ['equal remaining choices', C.ink]
    ], C.green),
    ...say('EACH REMAINING TILE IS EQUALLY LIKELY', C.green)
  );

  await play(
    lag(
      fairColumn.map(e =>
        new M.Indicate(
          e.obj,
          { color: C.green }
        )
      ),
      1.5,
      0.12
    )
  );

  // 35: consequently all fifty-six arrangements
  // have the same probability.

  await until(S(35));
  await play(
    ...highlightBig(D, () => true, false),
    ...fbox([
      ['56 arrangements', C.ink],
      ['all equally likely', C.green],
      ['each chance = 1/56', C.amber]
    ], C.green),
    ...say('ALL 56 ARRANGEMENTS ARE EQUALLY LIKELY', C.green)
  );

  // 36: chance of exactly tile one, then tile two.
  // Highlight one terminal leaf out of all 56.

  const oneThenTwo = bigLeaves.find(
    e => e.a === 1 && e.b === 2
  );

  const oneTwoMark = bigLeafFrame(
    oneThenTwo,
    C.amber
  );

  const oneParentMark = outline(
    bigX(0),
    BIG_PARENT_Y,
    BIG_PARENT_W + 0.13,
    BIG_PARENT_W + 0.13,
    C.amber,
    2
  );

  const oneTwoPair = pair(
    1,
    2,
    [CX, P ? -4.1 : -2.85, 0],
    P ? 0.47 : 0.30
  );

  await until(S(36));
  await play(
    ...highlightBig(
      [1],
      (a, b) => a === 1 && b === 2,
      true
    ),
    new M.Create(oneParentMark),
    new M.Create(oneTwoMark),
    ...(P ? [new M.FadeIn(oneTwoPair)] : []),
    ...fbox([
      ['first = 1', BLUE],
      ['second = 2', BLUE],
      ['1 arrangement out of 56', C.ink],
      ['chance = 1/56', C.amber]
    ], C.amber),
    ...say('EXACTLY 1 THEN 2: ONE IN 56', C.amber)
  );

  extras = [
    oneParentMark,
    oneTwoMark,
    ...(P ? [oneTwoPair] : [])
  ];

  // 37: ask the chance that both drawn tiles are orange.

  await until(S(37));
  await play(
    ...clearExtras(),
    ...highlightBig(
      ORANGES,
      (a, b) => a >= 6,
      true
    ),
    ...fbox([
      ['new question', C.amber],
      ['both tiles orange?', ORANGE],
      ['chance = ?', C.ink]
    ], ORANGE),
    ...say('WHAT IF BOTH TILES ARE ORANGE?', ORANGE)
  );

  // 38: three orange first choices, followed by two orange choices.
  // Highlight exactly the six orange ordered leaves.

  const orangeLeaves = bigLeaves.filter(
    e => e.a >= 6 && e.b >= 6
  );

  const orangeParentMarks = [5, 6, 7].map(k =>
    outline(
      bigX(k),
      BIG_PARENT_Y,
      BIG_PARENT_W + 0.12,
      BIG_PARENT_W + 0.12,
      ORANGE,
      2
    )
  );

  const orangeLeafMarks = orangeLeaves.map(e =>
    bigLeafFrame(e, ORANGE)
  );

  await until(S(38));
  await play(
    ...highlightBig(
      ORANGES,
      (a, b) => a >= 6 && b >= 6,
      true
    ),
    ...appear(orangeParentMarks),
    lag(
      orangeLeafMarks.map(r => new M.Create(r)),
      2.0,
      0.2
    ),
    ...fbox([
      ['first orange:  3 choices', ORANGE],
      ['second orange: 2 choices', ORANGE]
    ], ORANGE),
    ...say('3 ORANGE FIRST, 2 ORANGE SECOND', ORANGE)
  );

  extras = [
    ...orangeParentMarks,
    ...orangeLeafMarks
  ];

  // 39: three times two gives six orange arrangements.

  await until(S(39));
  await play(
    lag(
      orangeLeaves.map(e =>
        new M.Indicate(
          e.obj,
          { color: ORANGE }
        )
      ),
      1.6,
      0.12
    ),
    ...fbox([
      ['3 × 2', C.ink],
      ['= 6 orange arrangements', ORANGE]
    ], ORANGE),
    ...say('3 × 2 = 6 ORANGE ARRANGEMENTS', ORANGE)
  );

  // 40: six out of fifty-six.
  // Show the six ordered outcomes explicitly.

  const orangeOutcomes = fullOutcomes.filter(
    ([a, b]) => a >= 6 && b >= 6
  );

  const orangePairs = orangeOutcomes.map(
    ([a, b], k) => {
      const column = k % 3;
      const row = Math.floor(k / 3);

      return pair(
        a,
        b,
        [
          CX + (column - 1) * 2.05,
          (P ? 0.75 : 0.55) - row * 1.0,
          0
        ],
        0.51,
        'bright'
      );
    }
  );

  const orangePairsFrame = outline(
    CX,
    P ? 0.25 : 0.05,
    6.0,
    1.95,
    ORANGE,
    2
  );

  const orangeChance = txt(
    '6 / 56 ≈ 10.7%',
    P ? 23 : 22,
    ORANGE,
    [CX, P ? -1.55 : -1.55, 0],
    true
  );

  const tenNote = txt(
    'A little more than one in ten',
    17,
    C.muted,
    [CX, P ? -2.05 : -2.05, 0]
  );

  await until(S(40));
  await play(
    ...clearBigTree(),
    ...clearExtras(),
    lag(
      orangePairs.map(g => new M.FadeIn(g)),
      1.7,
      0.15
    ),
    new M.Create(orangePairsFrame),
    new M.FadeIn(orangeChance),
    new M.FadeIn(tenNote),
    ...fbox([
      ['both orange', ORANGE],
      ['6 out of 56', C.ink],
      ['≈ 10.7%', ORANGE]
    ], ORANGE),
    ...say('BOTH ORANGE: SIX OUT OF 56', ORANGE)
  );

  extras = [
    ...orangePairs,
    orangePairsFrame,
    orangeChance,
    tenNote
  ];

  // 41: arrangements are useful when order matters
  // and the same item cannot be selected twice.

  await until(S(41));
  await play(
    ...fbox([
      ['use arrangements when:', C.green],
      ['order matters', C.ink],
      ['no item is picked twice', C.amber]
    ], C.green),
    ...say('ORDER MATTERS, NO REPEATED PICKS', C.green)
  );

  // Runner icon, built from the same native primitives.
  // Identical figures with numbered bibs identify eight runners.

  function runner(n, p, scale = 1, mode = 'normal') {
    const [x, y] = p;

    const color = mode === 'bright'
      ? C.green
      : C.ink;

    const r = 0.12 * scale;

    const head = new M.Circle({
      radius: r,
      color,
      strokeWidth: 2
    });

    head.setFill(color, 0.9);
    head.moveTo([
      x + 0.07 * scale,
      y + 0.4 * scale,
      0
    ]);

    const body = line(
      [
        x + 0.04 * scale,
        y + 0.25 * scale,
        0
      ],
      [
        x - 0.05 * scale,
        y - 0.04 * scale,
        0
      ],
      color,
      3
    );

    const armL = line(
      [
        x,
        y + 0.16 * scale,
        0
      ],
      [
        x - 0.23 * scale,
        y + 0.05 * scale,
        0
      ],
      color,
      2.5
    );

    const armR = line(
      [
        x,
        y + 0.16 * scale,
        0
      ],
      [
        x + 0.22 * scale,
        y + 0.22 * scale,
        0
      ],
      color,
      2.5
    );

    const legL = line(
      [
        x - 0.05 * scale,
        y - 0.04 * scale,
        0
      ],
      [
        x - 0.25 * scale,
        y - 0.3 * scale,
        0
      ],
      color,
      3
    );

    const legR = line(
      [
        x - 0.05 * scale,
        y - 0.04 * scale,
        0
      ],
      [
        x + 0.22 * scale,
        y - 0.2 * scale,
        0
      ],
      color,
      3
    );

    const bib = txt(
      String(n),
      Math.max(13, Math.round(17 * scale)),
      C.cyan,
      [
        x,
        y - 0.52 * scale,
        0
      ],
      true
    );

    return new M.VGroup(
      head,
      body,
      armL,
      armR,
      legL,
      legR,
      bib
    );
  }

  // 42: eight runners, first and second place.
  // Eight possible winners and seven possible runners-up.

  const runners = D.map((n, k) =>
    runner(
      n,
      [colx(k), ROW_Y, 0],
      0.86
    )
  );

  const podiumY = P ? -1.45 : -1.38;

  const podiumFirst = new M.Rectangle({
    width: 1.2,
    height: 0.62,
    color: C.amber,
    strokeWidth: 2
  });

  podiumFirst.setFill(C.amber, 0.18);

  podiumFirst.moveTo([
    FIRST_X,
    podiumY,
    0
  ]);

  const podiumSecond = new M.Rectangle({
    width: 1.2,
    height: 0.44,
    color: C.muted,
    strokeWidth: 2
  });

  podiumSecond.setFill(C.muted, 0.18);

  podiumSecond.moveTo([
    SECOND_X,
    podiumY - 0.09,
    0
  ]);

  const firstPlace = txt(
    '1st',
    21,
    C.amber,
    [FIRST_X, podiumY, 0],
    true
  );

  const secondPlace = txt(
    '2nd',
    21,
    C.ink,
    [SECOND_X, podiumY - 0.09, 0],
    true
  );

  await until(S(42));
  await play(
    ...clearExtras(),
    lag(
      runners.map(r => new M.FadeIn(r)),
      1.5,
      0.1
    ),
    new M.FadeIn(podiumFirst),
    new M.FadeIn(podiumSecond),
    new M.FadeIn(firstPlace),
    new M.FadeIn(secondPlace),
    ...fbox([
      ['8 runners', C.ink],
      ['1st place: 8 choices', C.amber],
      ['2nd place: 7 choices', C.green],
      ['8 × 7 = 56', C.green]
    ], C.green),
    ...say('8 RUNNERS: FIRST AND SECOND PLACE', C.green)
  );

  await play(
    new M.Transform(
      runners[2],
      runner(
        3,
        [
          FIRST_X,
          podiumY + 0.88,
          0
        ],
        0.9,
        'bright'
      ),
      { pathArc: -0.3 }
    ),
    new M.Transform(
      runners[5],
      runner(
        6,
        [
          SECOND_X,
          podiumY + 0.69,
          0
        ],
        0.9,
        'bright'
      ),
      { pathArc: 0.3 }
    ),
    ...say('56 DIFFERENT FIRST–SECOND RESULTS', C.green)
  );

  extras = [
    ...runners,
    podiumFirst,
    podiumSecond,
    firstPlace,
    secondPlace
  ];

  // 43: common trap.
  // Forgetting that the first tile is no longer in the bag.

  const trapSlots = [
    ...slot(FIRST_X, DRAW_Y, 'First draw', C.amber),
    ...slot(SECOND_X, DRAW_Y, 'Second draw', C.muted)
  ];

  await until(S(43));
  await play(
    ...clearExtras(),
    ...makeRow(),
    ...appear(trapSlots),
    ...fbox([
      ['common trap', C.amber],
      ['forgetting the first tile', C.ink],
      ['has been removed', C.amber]
    ], C.amber),
    ...say('COMMON TRAP: FORGETTING THE FIRST DRAW', C.amber)
  );

  extras = trapSlots;

  // 44: the wrong multiplication is eight times eight.
  // It includes impossible repeated outcomes such as 3 then 3.
  //
  // The second tile three is only a ghost of an invalid outcome.
  // It is not an extra physical tile in the bag.

  const wrongRepeat = tile(
    3,
    [SECOND_X, DRAW_Y, 0],
    0.78,
    'ghost'
  );

  const invalidFrame = outline(
    SECOND_X,
    DRAW_Y,
    0.91,
    0.91,
    C.amber,
    3
  );

  const invalidCross = new M.VGroup(
    line(
      [
        SECOND_X - 0.4,
        DRAW_Y - 0.4,
        0
      ],
      [
        SECOND_X + 0.4,
        DRAW_Y + 0.4,
        0
      ],
      C.amber,
      4
    ),
    line(
      [
        SECOND_X - 0.4,
        DRAW_Y + 0.4,
        0
      ],
      [
        SECOND_X + 0.4,
        DRAW_Y - 0.4,
        0
      ],
      C.amber,
      4
    )
  );

  const impossibleRepeatLab = txt(
    'Impossible repeat',
    17,
    C.amber,
    [SECOND_X, DRAW_Y + 0.76, 0]
  );

  await until(S(44));
  await play(
    new M.Transform(
      tiles[2],
      tile(
        3,
        [FIRST_X, DRAW_Y, 0],
        0.78,
        'bright'
      ),
      { pathArc: -0.4 }
    ),
    new M.FadeIn(wrongRepeat),
    new M.Create(invalidFrame),
    new M.FadeIn(invalidCross),
    new M.FadeIn(impossibleRepeatLab),
    ...fbox([
      ['incorrect: 8 × 8', C.amber],
      ['includes 3 then 3', C.ink],
      ['impossible outcome', C.amber]
    ], C.amber),
    ...say('WRONG: DRAWING THE SAME TILE TWICE', C.amber)
  );

  extras.push(
    wrongRepeat,
    invalidFrame,
    invalidCross,
    impossibleRepeatLab
  );

  // 45: tile three is already on the table.
  // It cannot be drawn again.

  const bagGap = outline(
    colx(2),
    ROW_Y,
    TW,
    TW,
    C.amber,
    2
  );

  const goneLab = txt(
    'Already gone',
    17,
    C.amber,
    [
      colx(2),
      ROW_Y + 0.63,
      0
    ]
  );

  await until(S(45));
  await play(
    new M.FadeOut(wrongRepeat),
    new M.FadeOut(invalidFrame),
    new M.FadeOut(invalidCross),
    new M.FadeOut(impossibleRepeatLab),
    new M.Create(bagGap),
    new M.FadeIn(goneLab),
    new M.Indicate(
      tiles[2],
      { color: C.amber }
    ),
    ...fbox([
      ['tile 3 is on the table', C.ink],
      ['not in the bag', C.amber],
      ['only 7 choices remain', C.green]
    ], C.green),
    ...say('TILE 3 CANNOT COME OUT AGAIN', C.amber)
  );

  extras = [
    ...trapSlots,
    bagGap,
    goneLab
  ];

  // 46: eight times eight would count 64 outcomes.
  // Eight impossible repeated arrangements must be excluded.
  // Show the invalid count and the correct count as bars.

  const COUNT_Y1 = P ? -0.05 : -0.25;
  const COUNT_Y2 = P ? -1.45 : -1.65;

  const COUNT_W = P ? 5.85 : 5.75;
  const COUNT_H = 0.48;

  function countBar(total, y, correct = true) {
    const baseX = CX - COUNT_W / 2;
    const used = COUNT_W * total / 64;

    const r = new M.Rectangle({
      width: used,
      height: COUNT_H,
      color: correct ? C.green : C.amber,
      strokeWidth: 2
    });

    r.setFill(
      correct ? C.green : C.amber,
      0.7
    );

    r.moveTo([
      baseX + used / 2,
      y,
      0
    ]);

    const label = txt(
      String(total),
      20,
      C.ink,
      [baseX + used / 2, y, 0],
      true
    );

    return new M.VGroup(r, label);
  }

  const wrongBar = countBar(
    64,
    COUNT_Y1,
    false
  );

  const rightBar = countBar(
    56,
    COUNT_Y2,
    true
  );

  const wrongCountLab = txt(
    '8 × 8: too many',
    18,
    C.amber,
    [CX, COUNT_Y1 + 0.46, 0]
  );

  const rightCountLab = txt(
    '8 × 7: correct',
    18,
    C.green,
    [CX, COUNT_Y2 + 0.46, 0]
  );

  const excessW = COUNT_W * 8 / 64;

  const excessX = CX +
    COUNT_W / 2 -
    excessW / 2;

  const excessFrame = outline(
    excessX,
    COUNT_Y1,
    excessW,
    COUNT_H + 0.13,
    C.ink,
    2
  );

  const excessLab = txt(
    '8 extra',
    15,
    C.amber,
    [excessX, COUNT_Y1 - 0.47, 0]
  );

  await until(S(46));
  await play(
    ...clearRow(),
    ...clearExtras(),
    new M.FadeIn(wrongBar),
    new M.FadeIn(rightBar),
    new M.FadeIn(wrongCountLab),
    new M.FadeIn(rightCountLab),
    new M.Create(excessFrame),
    new M.FadeIn(excessLab),
    ...fbox([
      ['wrong: 8 × 8 = 64', C.amber],
      ['8 impossible repeats', C.muted],
      ['right: 8 × 7 = 56', C.green]
    ], C.green),
    ...say('64 IS TOO MANY: THE ANSWER IS 56', C.green)
  );

  extras = [
    wrongBar,
    rightBar,
    wrongCountLab,
    rightCountLab,
    excessFrame,
    excessLab
  ];

  // 47: preview the next lesson.
  // Instead of drawing one tile after another,
  // grab two at the same time.
  // Do not teach the combinations rule yet.

  const previewOrdered = pair(
    1,
    2,
    [CX - 1.63, 0.12, 0],
    0.64
  );

  const previewTogether = new M.VGroup(
    tile(
      1,
      [CX + 1.28, 0.12, 0],
      0.69
    ),
    tile(
      2,
      [CX + 2.08, 0.12, 0],
      0.69
    )
  );

  const togetherFrame = outline(
    CX + 1.68,
    0.12,
    1.83,
    1.03,
    C.violet,
    2
  );

  const orderedLab = txt(
    'One after another',
    17,
    C.cyan,
    [CX - 1.63, -0.78, 0]
  );

  const togetherLab = txt(
    'Both at once',
    17,
    C.violet,
    [CX + 1.68, -0.78, 0]
  );

  const noOrderLab = txt(
    'Neither came first',
    19,
    C.violet,
    [CX + 1.68, -1.35, 0]
  );

  await until(S(47));
  await play(
    ...clearExtras(),
    new M.FadeIn(previewOrdered),
    new M.FadeIn(previewTogether),
    new M.Create(togetherFrame),
    new M.FadeIn(orderedLab),
    new M.FadeIn(togetherLab),
    new M.FadeIn(noOrderLab),
    ...fbox([
      ['this lesson: ordered draws', C.ink],
      ['next: grab two together', C.violet],
      ['order does not matter', C.violet]
    ], C.violet),
    ...say('NEXT: DRAW TWO AT THE SAME TIME', C.violet)
  );

  extras = [
    previewOrdered,
    previewTogether,
    togetherFrame,
    orderedLab,
    togetherLab,
    noOrderLab
  ];

  // 48: final takeaway.
  // Restore the full tree and the multiplication rule.
  // All 56 ordered arrangements remain visible.

  await until(S(48));
  await play(
    ...clearExtras(),
    ...buildBigTree(),
    ...fbox([
      ['ordered draws:', C.green],
      ['multiply the choices', C.ink],
      ['one fewer each draw', C.amber],
      ['8 × 7 = 56', C.green]
    ], C.green),
    ...say('ORDERED DRAWS: MULTIPLY THE CHOICES', C.green)
  );

  const finalColumnMarks = D.map((_, k) =>
    columnRing(k, C.green)
  );

  await until(S(48) + 3.0);
  await play(
    lag(
      finalColumnMarks.map(r => new M.Create(r)),
      1.6,
      0.12
    ),
    ...say('ONE CHOICE FEWER EACH TIME', C.amber),
    ...fbox([
      ['first draw:  8 choices', C.cyan],
      ['second draw: 7 choices', C.green],
      ['8 × 7 = 56 arrangements', C.green]
    ], C.green)
  );

  extras = finalColumnMarks;

  await until(E(48));
}

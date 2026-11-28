// lesson 4.1.4
// Unions and intersections: add both chances, then remove the overlap once.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D = [1, 2, 3, 4, 5, 6, 7, 8];

  const BLUES = [1, 2, 3, 4, 5];
  const ORANGES = [6, 7, 8];
  const EVEN = [2, 4, 6, 8];
  const BOTH = [2, 4];
  const UNION = [1, 2, 3, 4, 5, 6, 8];

  const BLUE = C.cyan;
  const ORANGE = '#fb923c';
  const WHITE = '#f1f5f9';
  const CLOTH = '#a58d72';
  const CORD = '#d6bea0';

  const CX = P ? 0 : -2.6;

  const SP = Math.min(
    P ? 0.88 : 0.9,
    (FW - (P ? 0.9 : 6.8)) / 8
  );

  const TW = SP * 0.75;
  // Phone: the picture sits lower so the tall frame is used.
  const PDY = P ? -1.1 : 0;
  const ROW_Y = P ? -0.75 : 0.05;

  const PILL = P
    ? [0, 1.6, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.9, 0]
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
      cornerRadius: 0.14,
      color,
      strokeWidth: sw
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
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
  // Numbers and colours never change.
  // Brightness indicates membership in the current event.

  function tile(n, p, mode = 'normal', w = TW) {
    const c = n === null ? C.muted : colour(n);

    const dim = mode === 'dim';
    const bright = mode === 'bright';

    const halo = new M.RoundedRectangle({
      width: w + 0.1,
      height: w + 0.1,
      cornerRadius: 0.12,
      color: c,
      strokeWidth: bright ? 2 : 1
    });

    halo.setFill(
      c,
      dim ? 0.015 : bright ? 0.28 : 0.13
    );

    halo.moveTo(p);

    const face = new M.RoundedRectangle({
      width: w,
      height: w,
      cornerRadius: 0.09,
      color: c,
      strokeWidth: dim ? 1 : 2
    });

    face.setFill(
      c,
      dim ? 0.09 : bright ? 0.96 : 0.82
    );

    face.moveTo(p);

    const edge = line(
      [p[0] - w * 0.31, p[1] - w * 0.36, 0],
      [p[0] + w * 0.31, p[1] - w * 0.36, 0],
      dim ? C.muted : C.ink,
      1
    );

    const size = Math.max(
      15,
      Math.round(27 * w / 0.7)
    );

    const lab = txt(
      n === null ? '?' : String(n),
      size,
      dim ? C.muted : C.ink,
      [p[0], p[1] + 0.025, 0],
      true
    );

    return new M.VGroup(
      halo,
      face,
      edge,
      lab
    );
  }

  const tiles = D.map((n, k) =>
    tile(n, pos(k))
  );

  function rowTiles(selected = D, dimOthers = false) {
    return tiles.map((t, k) => {
      const n = D[k];

      const mode = selected.includes(n)
        ? 'bright'
        : dimOthers ? 'dim' : 'normal';

      return new M.Transform(
        t,
        tile(n, pos(k), mode)
      );
    });
  }

  function normalRow() {
    return tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(D[k], pos(k))
      )
    );
  }

  // Cloth bag and table.
  // The transparent cutaway reveals the eight original tiles.

  function makeBag() {
    const x = CX;
    const y = -0.08 + PDY;

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

    const knot = new M.Dot({
      point: [x + 0.73, y + 0.97, 0],
      radius: 0.065,
      color: CORD
    });

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
    [CX - 3.3, -1.34 + PDY, 0],
    [CX + 3.3, -1.34 + PDY, 0],
    C.muted,
    3
  );

  const miniPos = k => [
    CX + (k % 4 - 1.5) * 0.68,
    0.24 + PDY - Math.floor(k / 4) * 0.67,
    0
  ];

  const mini = D.map((n, k) =>
    tile(n, miniPos(k), 'normal', 0.51)
  );

  // Coffee icon, built entirely from native primitives.

  function coffeeAt(p) {
    const [x, y] = p;

    const handle = new M.Circle({
      radius: 0.18,
      color: C.amber,
      strokeWidth: 3
    });

    handle.setFill(C.amber, 0);
    handle.moveTo([x + 0.47, y + 0.02, 0]);

    const cup = new M.RoundedRectangle({
      width: 0.91,
      height: 0.65,
      cornerRadius: 0.15,
      color: C.amber,
      strokeWidth: 2
    });

    cup.setFill(C.amber, 0.25);
    cup.moveTo([x, y, 0]);

    const rim = line(
      [x - 0.35, y + 0.22, 0],
      [x + 0.35, y + 0.22, 0],
      C.amber,
      2
    );

    const saucer = line(
      [x - 0.65, y - 0.41, 0],
      [x + 0.65, y - 0.41, 0],
      C.amber,
      3
    );

    const steam = [-0.18, 0.18].map(dx =>
      line(
        [x + dx, y + 0.49, 0],
        [x + dx + 0.09, y + 0.72, 0],
        C.muted,
        2
      )
    );

    return new M.VGroup(
      handle,
      cup,
      rim,
      saucer,
      ...steam
    );
  }

  // Glowing event outlines.
  // Construct all rings from coordinates.
  // Never wrap already-visible tiles in a new VGroup.

  function eventRing(x, y, w, h, color = C.green) {
    const halo = outline(
      x, y, w + 0.05, h + 0.05, color, 6
    );

    halo.setFill(color, 0.018);

    const core = outline(
      x, y, w, h, color, 2
    );

    return new M.VGroup(halo, core);
  }

  function rowRing(nums, color = C.green) {
    const left = colx(Math.min(...nums) - 1);
    const right = colx(Math.max(...nums) - 1);

    return eventRing(
      (left + right) / 2,
      ROW_Y,
      right - left + TW + 0.18,
      TW + 0.23,
      color
    );
  }

  // A continuous ring around the alternating even tiles.
  // Its upper corridor connects four downward pockets.
  // Odd tiles remain outside the white boundary.
  // The shape is drawn from fresh line segments.

  function evenRowRing(color = WHITE) {
    const xs = EVEN.map(n => colx(n - 1));

    const half = TW / 2 + 0.075;
    const top = ROW_Y + 0.94;
    const bottom = ROW_Y - TW / 2 - 0.11;
    const gapY = ROW_Y + TW / 2 + 0.15;

    const points = [
      [xs[0] - half, top, 0],
      [xs[3] + half, top, 0]
    ];

    for (let k = xs.length - 1; k >= 0; k--) {
      const x = xs[k];

      points.push(
        [x + half, bottom, 0],
        [x - half, bottom, 0]
      );

      if (k > 0) {
        points.push(
          [x - half, gapY, 0],
          [xs[k - 1] + half, gapY, 0]
        );
      }
    }

    points.push(points[0]);

    const glow = [];
    const core = [];

    for (let k = 0; k < points.length - 1; k++) {
      glow.push(
        line(points[k], points[k + 1], color, 5)
      );

      core.push(
        line(points[k], points[k + 1], color, 2)
      );
    }

    return new M.VGroup(
      ...glow,
      ...core
    );
  }

  // Overlapping event rings.
  // Every tile has one physical position.
  //
  // Blue only: 1, 3, 5.
  // Both:      2, 4.
  // Even only: 6, 8.
  // Neither:   7.

  const VY = P ? -1.25 : -0.43;
  // Phone: a bigger Venn picture (bigger tiles and numbers) to use the width.
  const VS = P ? 1.2 : 1;
  const VR = 1.62 * VS;
  const VO = 0.88 * VS;
  const VW = TW * 0.69 * VS;

  const VP = {
    1: [CX - 1.72 * VS, VY + 0.48 * VS, 0],
    2: [CX,             VY + 0.45 * VS, 0],
    3: [CX - 1.97 * VS, VY - 0.20 * VS, 0],
    4: [CX,             VY - 0.45 * VS, 0],
    5: [CX - 1.24 * VS, VY - 0.85 * VS, 0],
    6: [CX + 1.73 * VS, VY + 0.40 * VS, 0],
    7: [CX + (P ? 2.88 : 3.02) * VS, VY - 0.79 * VS, 0],
    8: [CX + 1.73 * VS, VY - 0.52 * VS, 0]
  };

  function circleRing(x, y, radius, color) {
    const halo = new M.Circle({
      radius,
      color,
      strokeWidth: 6
    });

    halo.setFill(color, 0.025);
    halo.moveTo([x, y, 0]);

    const core = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    core.setFill(color, 0);
    core.moveTo([x, y, 0]);

    return new M.VGroup(
      halo,
      core
    );
  }

  function vennTiles(selected = D, dimOthers = false) {
    return tiles.map((t, k) => {
      const n = D[k];

      return new M.Transform(
        t,
        tile(
          n,
          VP[n],
          selected.includes(n)
            ? 'bright'
            : dimOthers ? 'dim' : 'normal',
          VW
        ),
        { pathArc: 0.12 }
      );
    });
  }

  function vennMembershipRing(n, color = C.amber) {
    const p = VP[n];

    return eventRing(
      p[0],
      p[1],
      VW + 0.18,
      VW + 0.18,
      color
    );
  }

  // Ring state.
  // Each transition removes only currently visible outlines.

  let rings = [];
  let ringLabels = [];
  let vennMarks = [];

  function clearRings() {
    const a = [
      ...fade(rings),
      ...fade(ringLabels),
      ...fade(vennMarks)
    ];

    rings = [];
    ringLabels = [];
    vennMarks = [];

    return a;
  }

  function setVennRings(letterNames = false) {
    rings = [
      circleRing(CX - VO, VY, VR, BLUE),
      circleRing(CX + VO, VY, VR, WHITE)
    ];

    ringLabels = [
      txt(
        letterNames ? 'A: blue' : 'Blue',
        19,
        BLUE,
        [CX - 1.26 * VS, VY + 1.08 * VS, 0]
      ),
      txt(
        letterNames ? 'B: even' : 'Even',
        19,
        WHITE,
        [CX + 1.26 * VS, VY + 1.08 * VS, 0]
      )
    ];

    return [
      ...appear(rings),
      ...appear(ringLabels)
    ];
  }

  function clearVennMarks() {
    const a = fade(vennMarks);
    vennMarks = [];
    return a;
  }

  // Chance pieces.
  // Every piece represents exactly one eighth of the whole chance.
  // The number inside identifies the original tile.
  // Duplicate pieces are explicitly marked as counting duplicates,
  // never as additional physical tiles.

  const QP = P ? 0.70 : 0.71;
  const QW = QP * 0.91;
  const QH = 0.51;

  const LEDGER_Y = P ? -3.55 : -1.88;
  const LEDGER_L = CX - 4 * QP;

  const STRIP_Y1 = P ? -2.55 : -1.18;
  const STRIP_Y2 = P ? -3.45 : -2.13;

  const ledgerX = k =>
    LEDGER_L + k * QP;

  function chancePiece(n, p, border = null, opacity = 0.84) {
    const c = colour(n);
    const stroke = border || c;

    const r = new M.Rectangle({
      width: QW,
      height: QH,
      color: stroke,
      strokeWidth: border ? 3 : 1
    });

    r.setFill(c, opacity);
    r.moveTo(p);

    const lab = txt(
      String(n),
      P ? 20 : 18,
      C.bg,
      p,
      true
    );

    return new M.VGroup(
      r,
      lab
    );
  }

  function stripPos(k, y) {
    return [
      CX - 1.57 + k * QP,
      y,
      0
    ];
  }

  function ledgerPos(k) {
    return [
      ledgerX(k),
      LEDGER_Y,
      0
    ];
  }

  function wholeFrame(color = C.ink) {
    return outline(
      (ledgerX(0) + ledgerX(7)) / 2,
      LEDGER_Y,
      7 * QP + QW + 0.12,
      QH + 0.18,
      color,
      2
    );
  }

  function ledgerCaption(s, color = C.muted) {
    return txt(
      s,
      P ? 18 : 17,
      color,
      [CX, LEDGER_Y + 0.56, 0]
    );
  }

  function ledgerBottom(s, color = C.muted) {
    return txt(
      s,
      P ? 18 : 17,
      color,
      [CX, LEDGER_Y - 0.55, 0],
      true
    );
  }

  let pieces = [];
  let ledgerObjects = [];
  let ledgerTop = null;
  let ledgerFoot = null;

  function clearLedger() {
    const a = [
      ...fade(pieces),
      ...fade(ledgerObjects)
    ];

    if (ledgerTop) {
      a.push(new M.FadeOut(ledgerTop));
    }

    if (ledgerFoot) {
      a.push(new M.FadeOut(ledgerFoot));
    }

    pieces = [];
    ledgerObjects = [];
    ledgerTop = null;
    ledgerFoot = null;

    return a;
  }

  function changeLedgerTop(s, color = C.muted) {
    const next = ledgerCaption(s, color);
    const a = [new M.FadeIn(next)];

    if (ledgerTop) {
      a.push(new M.FadeOut(ledgerTop));
    }

    ledgerTop = next;
    return a;
  }

  function changeLedgerFoot(s, color = C.muted) {
    const next = ledgerBottom(s, color);
    const a = [new M.FadeIn(next)];

    if (ledgerFoot) {
      a.push(new M.FadeOut(ledgerFoot));
    }

    ledgerFoot = next;
    return a;
  }

  function setChanceLedger(nums, duplicateIndices = []) {
    pieces = nums.map((n, k) =>
      chancePiece(
        n,
        ledgerPos(k),
        duplicateIndices.includes(k) ? C.amber : null
      )
    );

    return [
      lag(
        pieces.map(p => new M.FadeIn(p)),
        1.5,
        0.1
      )
    ];
  }

  // 0: back to the original bag of eight tiles.

  await until(S(0));
  await play(
    new M.Create(table),
    new M.FadeIn(bag),
    ...say('OUR BAG OF 8 TILES')
  );

  // 1: tiles one to five are blue;
  // tiles six, seven and eight are orange.

  await until(S(1));
  await play(
    lag(
      mini.map(t => new M.FadeIn(t)),
      3.5,
      0.2
    ),
    ...say('5 BLUE  /  3 ORANGE')
  );

  // 2: the friend offers a generous new deal.

  const coffee = coffeeAt([
    CX + 2.65,
    -0.55 + PDY,
    0
  ]);

  await until(S(2));
  await play(
    new M.FadeIn(coffee),
    ...say('A GENEROUS NEW DEAL', C.amber)
  );

  // 3: blue OR even wins a coffee.
  // Do not introduce the technical names yet.

  await until(S(3));
  await play(
    new M.Indicate(coffee, { color: C.amber }),
    ...fbox([
      ['win a coffee if:', C.amber],
      ['blue', BLUE],
      ['OR even', WHITE]
    ], C.green),
    ...say('BLUE OR EVEN? WIN A COFFEE!', C.green)
  );

  // 4: what is the chance of winning?

  await until(S(4));
  await play(
    ...fbox([
      ['chance of winning', C.amber],
      ['?', C.ink]
    ], C.amber),
    ...say('HOW LIKELY IS A WIN?', C.amber)
  );

  // 5: lay all eight tiles in one row.

  await until(S(5));
  await play(
    new M.FadeOut(bag),
    new M.FadeOut(table),
    new M.FadeOut(coffee),
    ...fade(mini),
    lag(
      tiles.map(t => new M.FadeIn(t)),
      1.6,
      0.12
    ),
    ...clearBox(),
    ...say('START WITH ALL 8 OUTCOMES')
  );

  // 6: the blue ring contains exactly tiles 1-5.

  const blueRow = rowRing(BLUES, BLUE);

  const blueRowLab = txt(
    'Blue',
    19,
    BLUE,
    [
      (colx(0) + colx(4)) / 2,
      ROW_Y - 0.82,
      0
    ]
  );

  await until(S(6));
  await play(
    new M.FadeIn(blueRow),
    new M.FadeIn(blueRowLab),
    lag(
      BLUES.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: BLUE }
        )
      ),
      4.0,
      0.45
    ),
    ...fbox([
      ['blue event', BLUE],
      ['{1,2,3,4,5}', C.ink]
    ], BLUE),
    ...say('BLUE RING: 1, 2, 3, 4, 5', BLUE)
  );

  rings = [blueRow];
  ringLabels = [blueRowLab];

  // 7: the white ring contains exactly 2, 4, 6 and 8.

  const whiteRow = evenRowRing(WHITE);

  const whiteRowLab = txt(
    'Even',
    19,
    WHITE,
    [
      (colx(1) + colx(7)) / 2,
      ROW_Y + 1.17,
      0
    ]
  );

  await until(S(7));
  await play(
    new M.FadeIn(whiteRow),
    new M.FadeIn(whiteRowLab),
    lag(
      EVEN.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: WHITE }
        )
      ),
      4.7,
      0.5
    ),
    ...fbox([
      ['blue: {1,2,3,4,5}', BLUE],
      ['even: {2,4,6,8}', WHITE]
    ], WHITE),
    ...say('WHITE RING: 2, 4, 6, 8', WHITE)
  );

  rings.push(whiteRow);
  ringLabels.push(whiteRowLab);

  // 8: tiles two and four are inside both rings.

  vennMarks = BOTH.map(n =>
    eventRing(
      colx(n - 1),
      ROW_Y,
      TW + 0.13,
      TW + 0.13,
      C.amber
    )
  );

  await until(S(8));
  await play(
    ...appear(vennMarks),
    lag(
      BOTH.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.amber }
        )
      ),
      2.4,
      0.7
    ),
    ...fbox([
      ['inside BOTH rings', C.amber],
      ['{2,4}', C.ink]
    ], C.amber),
    ...say('2 AND 4 BELONG TO BOTH', C.amber)
  );

  // 9: rearrange the tiles into two crossing circular rings.
  // Tile seven stays outside both.
  // There are still exactly eight physical tiles.

  await until(S(9));
  await play(
    ...clearRings(),
    ...vennTiles(),
    ...setVennRings(),
    ...fbox([
      ['blue only: 1,3,5', BLUE],
      ['both:      2,4', C.amber],
      ['even only: 6,8', WHITE],
      ['neither:   7', C.muted]
    ], C.cyan),
    ...say('MOVE THE SHARED TILES TO THE MIDDLE')
  );

  // 10: the shared middle is blue AND even.

  const middleRing = eventRing(
    CX,
    VY,
    VW + 0.16,
    0.9 + VW + 0.16,
    C.amber
  );

  await until(S(10));
  await play(
    ...vennTiles(BOTH, true),
    new M.FadeIn(middleRing),
    ...fbox([
      ['blue AND even', C.amber],
      ['{2,4}', C.ink]
    ], C.amber),
    ...say('THE SHARED MIDDLE: BLUE AND EVEN', C.amber)
  );

  vennMarks = [middleRing];

  // 11: name the shared part of the events.
  // Intersection means AND.

  await until(S(11));
  await play(
    new M.Indicate(
      middleRing,
      { color: C.amber }
    ),
    ...fbox([
      ['intersection', C.amber],
      ['shared by both events', C.ink],
      ['AND', C.green]
    ], C.amber),
    ...say('INTERSECTION = AND', C.green)
  );

  // 12: two equally likely outcomes out of eight.

  await until(S(12));
  await play(
    lag(
      BOTH.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.amber }
        )
      ),
      2.0,
      0.7
    ),
    ...fbox([
      ['blue AND even', C.amber],
      ['2 out of 8 tiles', C.ink],
      ['chance = 2/8', C.amber]
    ], C.amber),
    ...say('INTERSECTION: 2 OUT OF 8', C.amber)
  );

  // 13: each tile is 12.5 percent;
  // two tiles make 25 percent.

  await until(S(13));
  await play(
    ...fbox([
      ['2 × 12.5%', C.ink],
      ['= 25%', C.amber],
      ['2/8 = 25%', C.green]
    ], C.amber),
    ...say('BLUE AND EVEN: 25 PERCENT', C.amber)
  );

  // 14: return to the original winning question.
  // The rule is OR, not AND.

  await until(S(14));
  await play(
    ...clearVennMarks(),
    ...vennTiles(),
    ...fbox([
      ['the game asks:', C.muted],
      ['blue OR even', C.green]
    ], C.green),
    ...say('BUT OUR GAME ASKS: BLUE OR EVEN?', C.green)
  );

  // 15: any tile in either ring qualifies.
  // The two shared tiles qualify as well.

  await until(S(15));
  await play(
    ...vennTiles(UNION, true),
    ...fbox([
      ['inside blue', BLUE],
      ['OR inside even', WHITE],
      ['OR inside both', C.amber]
    ], C.green),
    ...say('INSIDE EITHER RING IS A WIN', C.green)
  );

  // 16: probability uses inclusive OR.
  // Tile two wins, even though it satisfies both rules.

  const twoWins = vennMembershipRing(
    2,
    C.green
  );

  const twoWinTag = pill(
    'WINS!',
    C.green,
    16
  );

  twoWinTag.moveTo([
    VP[2][0],
    VP[2][1] + 0.42,
    0
  ]);

  await until(S(16));
  await play(
    new M.FadeIn(twoWins),
    new M.FadeIn(twoWinTag),
    new M.Indicate(
      tiles[1],
      { color: C.green }
    ),
    ...fbox([
      ['tile 2 is blue', BLUE],
      ['tile 2 is even', WHITE],
      ['it still wins!', C.green]
    ], C.green),
    ...say('OR INCLUDES BOTH', C.green)
  );

  vennMarks = [
    twoWins,
    twoWinTag
  ];

  // 17: name the union.
  // Everything inside either ring belongs to it.

  await until(S(17));
  await play(
    ...clearVennMarks(),
    new M.Indicate(
      rings[0],
      { color: BLUE }
    ),
    new M.Indicate(
      rings[1],
      { color: WHITE }
    ),
    ...fbox([
      ['union', C.green],
      ['inside either ring', C.ink],
      ['OR', C.green]
    ], C.green),
    ...say('UNION = OR', C.green)
  );

  // 18: light and count the union.
  // Each original tile is counted once, including 2 and 4.

  await until(S(18));
  await play(
    lag(
      UNION.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.green }
        )
      ),
      5.4,
      0.6
    ),
    ...fbox([
      ['union: blue OR even', C.green],
      ['{1,2,3,4,5,6,8}', C.ink],
      ['7 winning outcomes', C.green]
    ], C.green),
    ...say('COUNT EACH WINNING TILE ONCE', C.green)
  );

  // 19: only tile seven is outside both rings.

  const sevenRing = vennMembershipRing(
    7,
    C.muted
  );

  const sevenLab = txt(
    'Neither',
    16,
    C.muted,
    [
      VP[7][0] - 0.04,
      VP[7][1] - 0.48,
      0
    ]
  );

  await until(S(19));
  await play(
    new M.FadeIn(sevenRing),
    new M.FadeIn(sevenLab),
    new M.Indicate(
      tiles[6],
      { color: C.muted }
    ),
    ...fbox([
      ['7 winning tiles', C.green],
      ['tile 7 does not win', C.muted],
      ['odd and orange', ORANGE]
    ], C.green),
    ...say('ONLY TILE 7 IS LEFT OUT', C.muted)
  );

  vennMarks = [
    sevenRing,
    sevenLab
  ];

  // 20: probability of winning is seven eighths.

  await until(S(20));
  await play(
    ...fbox([
      ['blue OR even', C.green],
      ['7/8', C.amber],
      ['= 87.5%', C.green]
    ], C.green),
    ...say('CHANCE OF WINNING: 87.5%', C.green)
  );

  // 21: can we find the answer by adding probabilities?
  // Restore the row and prepare two counting strips.

  await until(S(21));
  await play(
    ...clearRings(),
    ...normalRow(),
    ...fbox([
      ['can we just add?', C.amber],
      ['blue + even', C.ink]
    ], C.amber),
    ...say('A FASTER WAY? TRY ADDING', C.amber)
  );

  // 22: blue contributes five shares;
  // even contributes four shares.
  // Tile numbers on the pieces preserve their identities.

  const addedNums = [
    ...BLUES,
    ...EVEN
  ];

  pieces = [
    ...BLUES.map((n, k) =>
      chancePiece(
        n,
        stripPos(k, STRIP_Y1),
        BLUE
      )
    ),
    ...EVEN.map((n, k) =>
      chancePiece(
        n,
        stripPos(k, STRIP_Y2),
        WHITE
      )
    )
  ];

  const stripBlueLab = txt(
    'Blue 5/8',
    18,
    BLUE,
    [CX - 2.62, STRIP_Y1, 0],
    true
  );

  const stripEvenLab = txt(
    'Even 4/8',
    18,
    WHITE,
    [CX - 2.62, STRIP_Y2, 0],
    true
  );

  ledgerObjects = [
    stripBlueLab,
    stripEvenLab
  ];

  await until(S(22));
  await play(
    lag(
      pieces.map(p => new M.FadeIn(p)),
      1.8,
      0.12
    ),
    ...appear(ledgerObjects),
    ...fbox([
      ['blue = 5/8', BLUE],
      ['even = 4/8', WHITE]
    ], C.cyan),
    ...say('BLUE: 5/8  +  EVEN: 4/8')
  );

  // 23: naive addition produces nine eighths.
  // Combine the two strips into a nine-piece bar.

  await until(S(23));
  await play(
    ...fade(ledgerObjects),
    ...pieces.map((p, k) =>
      new M.Transform(
        p,
        chancePiece(
          addedNums[k],
          ledgerPos(k)
        ),
        { pathArc: k < 5 ? -0.15 : 0.15 }
      )
    ),
    ...changeLedgerTop('Naive total: 9 shares', C.amber),
    ...fbox([
      ['5/8 + 4/8', C.ink],
      ['= 9/8', C.amber]
    ], C.amber),
    ...say('ADDING GIVES NINE EIGHTHS', C.amber)
  );

  ledgerObjects = [];

  // 24: nine eighths exceeds the eight-piece whole.
  // The ninth piece sticks out past the whole-chance boundary.

  let whole = wholeFrame(C.ink);

  const overflow = eventRing(
    ledgerX(8),
    LEDGER_Y,
    QW + 0.11,
    QH + 0.16,
    C.amber
  );

  const boundary = new M.DashedLine({
    start: [
      (ledgerX(7) + ledgerX(8)) / 2,
      LEDGER_Y - 0.45,
      0
    ],
    end: [
      (ledgerX(7) + ledgerX(8)) / 2,
      LEDGER_Y + 0.42,
      0
    ],
    color: C.amber
  });

  await until(S(24));
  await play(
    new M.Create(whole),
    new M.FadeIn(overflow),
    new M.Create(boundary),
    ...changeLedgerFoot('9/8 > 1', C.amber),
    ...fbox([
      ['one whole = 8/8', C.ink],
      ['9/8 is too much', C.amber]
    ], C.amber),
    ...say('9/8 IS MORE THAN ONE WHOLE', C.amber)
  );

  ledgerObjects = [
    whole,
    overflow,
    boundary
  ];

  // 25: one means sure.
  // A probability cannot be greater than one.

  await until(S(25));
  await play(
    new M.Indicate(
      overflow,
      { color: C.amber }
    ),
    ...fbox([
      ['1 = sure', C.green],
      ['nothing can exceed', C.ink],
      ['a sure chance', C.amber]
    ], C.amber),
    ...say('NOTHING IS MORE LIKELY THAN SURE', C.amber)
  );

  // 26: return to the rings to find the mistake.

  await until(S(26));
  await play(
    ...clearLedger(),
    ...vennTiles(),
    ...setVennRings(),
    ...fbox([
      ['something went wrong', C.amber],
      ['look at the rings', C.ink]
    ], C.amber),
    ...say('WHERE DID THE EXTRA COUNT COME FROM?', C.amber)
  );

  // 27: when counting blue, tiles two and four were included.

  await until(S(27));
  await play(
    ...vennTiles(BLUES, true),
    ...fbox([
      ['first count: blue', BLUE],
      ['1, 2, 3, 4, 5', C.ink],
      ['includes 2 and 4', C.amber]
    ], BLUE),
    ...say('BLUE COUNT INCLUDES 2 AND 4', BLUE)
  );

  const firstCountMarks = BOTH.map(n =>
    vennMembershipRing(n, C.amber)
  );

  await play(
    ...appear(firstCountMarks),
    lag(
      BOTH.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.amber }
        )
      ),
      1.5,
      0.5
    )
  );

  vennMarks = firstCountMarks;

  // 28: counting even includes the same two tiles again.

  await until(S(28));
  await play(
    ...vennTiles(EVEN, true),
    ...fbox([
      ['second count: even', WHITE],
      ['2, 4, 6, 8', C.ink],
      ['2 and 4 AGAIN', C.amber]
    ], WHITE),
    ...say('EVEN COUNT INCLUDES THEM AGAIN', WHITE)
  );

  await play(
    lag(
      BOTH.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.amber }
        )
      ),
      1.6,
      0.55
    )
  );

  // 29: show the duplicate count explicitly.
  // The ninth-piece ledger contains two duplicate shares:
  // the second appearance of tile 2 and tile 4.

  const duplicatedNums = [
    1, 2, 3, 4, 5, 2, 4, 6, 8
  ];

  const DUPLICATE_INDICES = [5, 6];

  await until(S(29));
  await play(
    ...clearRings(),
    ...normalRow(),
    ...setChanceLedger(
      duplicatedNums,
      DUPLICATE_INDICES
    ),
    ...changeLedgerTop('2 and 4 were counted twice', C.amber),
    ...fbox([
      ['overlap counted twice', C.amber],
      ['extra tile 2: 1/8', C.ink],
      ['extra tile 4: 1/8', C.ink],
      ['extra total = 2/8', C.amber]
    ], C.amber),
    ...say('REMOVE THE OVERLAP ONCE', C.amber)
  );

  const duplicateMarkers = DUPLICATE_INDICES.map(k =>
    txt(
      'extra',
      16,
      C.amber,
      [
        ledgerX(k),
        LEDGER_Y - 0.45,
        0
      ]
    )
  );

  await play(
    ...appear(duplicateMarkers),
    new M.Indicate(
      pieces[5],
      { color: C.amber }
    ),
    new M.Indicate(
      pieces[6],
      { color: C.amber }
    )
  );

  ledgerObjects = duplicateMarkers;

  // 30: remove just the second appearances of 2 and 4.
  // Keep one share for every winning tile.

  const survivors = pieces.filter(
    (_, k) => !DUPLICATE_INDICES.includes(k)
  );

  const duplicates = pieces.filter(
    (_, k) => DUPLICATE_INDICES.includes(k)
  );

  whole = wholeFrame(C.ink);

  const emptyEighth = outline(
    ledgerX(7),
    LEDGER_Y,
    QW,
    QH,
    C.muted,
    1
  );

  emptyEighth.setFill(C.muted, 0.06);

  await until(S(30));
  await play(
    ...fade(duplicates),
    ...fade(ledgerObjects),
    ...survivors.map((p, k) =>
      new M.Transform(
        p,
        chancePiece(
          UNION[k],
          ledgerPos(k)
        ),
        { pathArc: -0.12 }
      )
    ),
    new M.Create(whole),
    new M.FadeIn(emptyEighth),
    ...changeLedgerTop('7 different winning shares', C.green),
    ...changeLedgerFoot('9/8 − 2/8 = 7/8', C.green),
    ...fbox([
      ['naive total = 9/8', C.ink],
      ['remove overlap = 2/8', C.amber],
      ['9/8 − 2/8 = 7/8', C.green]
    ], C.green),
    ...say('9/8 MINUS 2/8 = 7/8', C.green)
  );

  pieces = survivors;

  ledgerObjects = [
    whole,
    emptyEighth
  ];

  // 31: this is the same seven eighths found by direct counting.

  await until(S(31));
  await play(
    new M.Indicate(
      whole,
      { color: C.green }
    ),
    ...fbox([
      ['direct count: 7/8', C.ink],
      ['addition fix: 7/8', C.ink],
      ['same answer', C.green]
    ], C.green),
    ...say('SAME ANSWER: 7/8', C.green)
  );

  // 32: introduce the addition rule.

  await until(S(32));
  await play(
    ...fbox([
      ['addition rule', C.green],
      ['add, then fix overlap', C.ink]
    ], C.green),
    ...say('THIS IS THE ADDITION RULE', C.green)
  );

  // 33: give the events short letter names.
  // A is blue; B is even.

  await until(S(33));
  await play(
    ...clearLedger(),
    ...vennTiles(UNION, true),
    ...setVennRings(true),
    ...fbox([
      ['A = blue', BLUE],
      ['B = even', WHITE]
    ], C.cyan),
    ...say('A = BLUE  /  B = EVEN')
  );

  // 34: the general addition rule.
  // Probability of A OR B = P(A) + P(B) − P(A AND B).

  const overlapHighlight = eventRing(
    CX,
    VY,
    VW + 0.17,
    0.9 + VW + 0.17,
    C.amber
  );

  await until(S(34));
  await play(
    new M.FadeIn(overlapHighlight),
    ...fbox([
      ['P(A or B) =', C.green],
      ['  P(A) + P(B)', C.ink],
      ['  − P(A and B)', C.amber]
    ], C.green),
    ...say('ADD BOTH CHANCES, REMOVE THE OVERLAP', C.green)
  );

  vennMarks = [overlapHighlight];

  await until(S(34) + 3.5);
  await play(
    lag([
      new M.Indicate(
        rings[0],
        { color: BLUE }
      ),
      new M.Indicate(
        rings[1],
        { color: WHITE }
      ),
      new M.Indicate(
        overlapHighlight,
        { color: C.amber }
      )
    ], 3.4, 0.7),
    ...fbox([
      ['P(A or B) =', C.green],
      ['5/8 + 4/8 − 2/8', C.ink],
      ['= 7/8', C.green]
    ], C.green)
  );

  // 35: everyday explanation.
  // Add the two rings, then subtract their shared part once.

  await until(S(35));
  await play(
    ...fbox([
      ['add the blue ring', BLUE],
      ['add the white ring', WHITE],
      ['subtract shared part', C.amber],
      ['count every tile once', C.green]
    ], C.green),
    ...say('ADD BOTH RINGS, REMOVE SHARED PART ONCE', C.green)
  );

  // 36: if two events do not overlap, nothing needs subtracting.
  // Move back to the row and introduce two disjoint rings.

  const disjointOrange = rowRing(
    ORANGES,
    ORANGE
  );

  const disjointOne = rowRing(
    [1],
    WHITE
  );

  const disjointOneLab = txt(
    'Tile 1',
    17,
    WHITE,
    [colx(0), ROW_Y - 0.83, 0]
  );

  const disjointOrangeLab = txt(
    'Orange',
    18,
    ORANGE,
    [
      (colx(5) + colx(7)) / 2,
      ROW_Y - 0.83,
      0
    ]
  );

  await until(S(36));
  await play(
    ...clearRings(),
    ...rowTiles([1, 6, 7, 8], true),
    new M.FadeIn(disjointOne),
    new M.FadeIn(disjointOrange),
    new M.FadeIn(disjointOneLab),
    new M.FadeIn(disjointOrangeLab),
    ...fbox([
      ['no shared outcomes', C.ink],
      ['overlap = 0', C.green],
      ['just add', C.green]
    ], C.green),
    ...say('NO OVERLAP? JUST ADD', C.green)
  );

  rings = [
    disjointOne,
    disjointOrange
  ];

  ringLabels = [
    disjointOneLab,
    disjointOrangeLab
  ];

  // 37: orange and tile one cannot happen together.
  // The two events are disjoint.

  await until(S(37));
  await play(
    lag([
      new M.Indicate(
        disjointOrange,
        { color: ORANGE }
      ),
      new M.Indicate(
        disjointOne,
        { color: WHITE }
      )
    ], 3.3, 0.9),
    ...fbox([
      ['orange: {6,7,8}', ORANGE],
      ['tile 1: {1}', WHITE],
      ['shared outcomes: none', C.green]
    ], C.green),
    ...say('ORANGE AND TILE 1 NEVER OVERLAP', C.green)
  );

  // 38: orange OR tile one.
  // Three eighths plus one eighth equals four eighths.

  const disjointNums = [6, 7, 8, 1];

  await until(S(38));
  await play(
    ...setChanceLedger(disjointNums),
    ...changeLedgerTop('4 different winning shares', C.green),
    ...changeLedgerFoot('3/8 + 1/8 = 4/8', C.green),
    ...fbox([
      ['orange OR tile 1', C.green],
      ['3/8 + 1/8 − 0', C.ink],
      ['= 4/8', C.green]
    ], C.green),
    ...say('3/8 + 1/8 = 4/8', C.green)
  );

  whole = wholeFrame();

  const disjointEmpty = [4, 5, 6, 7].map(k =>
    outline(
      ledgerX(k),
      LEDGER_Y,
      QW,
      QH,
      C.muted,
      1
    )
  );

  await play(
    new M.Create(whole),
    ...appear(disjointEmpty)
  );

  ledgerObjects = [
    whole,
    ...disjointEmpty
  ];

  // 39: what is the addition rule useful for?
  // Either-or questions, without double counting.

  await until(S(39));
  await play(
    ...fbox([
      ['either event can win', C.ink],
      ['count shared outcomes', C.ink],
      ['only once', C.green]
    ], C.green),
    ...say('EITHER-OR QUESTIONS, NO DOUBLE COUNTING', C.green)
  );

  // 40: common trap.
  // Adding probabilities without checking their overlap.

  await until(S(40));
  await play(
    ...clearLedger(),
    ...clearRings(),
    ...vennTiles(UNION, true),
    ...setVennRings(true),
    ...fbox([
      ['common trap', C.amber],
      ['adding two chances', C.ink],
      ['without checking overlap', C.amber]
    ], C.amber),
    ...say('COMMON TRAP: FORGETTING THE OVERLAP', C.amber)
  );

  // 41: a clear warning sign is a total above one.
  // Return to the incorrect nine-eighths example.

  whole = wholeFrame();

  const warningOverflow = eventRing(
    ledgerX(8),
    LEDGER_Y,
    QW + 0.11,
    QH + 0.16,
    C.amber
  );

  await until(S(41));
  await play(
    ...clearRings(),
    ...normalRow(),
    ...setChanceLedger(
      duplicatedNums,
      DUPLICATE_INDICES
    ),
    new M.Create(whole),
    new M.FadeIn(warningOverflow),
    ...changeLedgerTop('More than one whole chance', C.amber),
    ...changeLedgerFoot('9/8 = 112.5%', C.amber),
    ...fbox([
      ['9/8 > 1', C.amber],
      ['112.5% > 100%', C.amber],
      ['impossible probability', C.ink]
    ], C.amber),
    ...say('WARNING: ABOVE 1 OR 100%', C.amber)
  );

  ledgerObjects = [
    whole,
    warningOverflow
  ];

  // 42: even a total below one can be wrong.
  // A valid-looking number does not prove the method is correct.

  await until(S(42));
  await play(
    ...clearLedger(),
    ...fbox([
      ['a total below 1', C.ink],
      ['can still be wrong', C.amber]
    ], C.amber),
    ...say('BELOW ONE DOES NOT GUARANTEE CORRECTNESS', C.amber)
  );

  // 43: tile two OR even.
  // Tile two is already inside the even event.
  // Naive addition looks plausible: 1/8 + 4/8 = 5/8.

  const trapEvenRing = evenRowRing(WHITE);

  const trapTwoRing = eventRing(
    colx(1),
    ROW_Y,
    TW + 0.12,
    TW + 0.12,
    C.violet
  );

  const trapEvenLab = txt(
    'Even',
    18,
    WHITE,
    [
      (colx(1) + colx(7)) / 2,
      ROW_Y + 1.17,
      0
    ]
  );

  const trapTwoLab = txt(
    'Tile 2',
    17,
    C.violet,
    [colx(1), ROW_Y - 0.81, 0]
  );

  const trapNums = [2, 2, 4, 6, 8];

  await until(S(43));
  await play(
    ...rowTiles(EVEN, true),
    new M.FadeIn(trapEvenRing),
    new M.FadeIn(trapTwoRing),
    new M.FadeIn(trapEvenLab),
    new M.FadeIn(trapTwoLab),
    ...setChanceLedger(trapNums, [1]),
    ...changeLedgerTop('Naive count: 5 shares', C.amber),
    ...changeLedgerFoot('1/8 + 4/8 = 5/8', C.amber),
    ...fbox([
      ['tile 2 OR even', C.ink],
      ['1/8 + 4/8 = 5/8', C.amber],
      ['looks fine...', C.muted]
    ], C.amber),
    ...say('TRAP: TILE 2 OR EVEN', C.amber)
  );

  rings = [
    trapEvenRing,
    trapTwoRing
  ];

  ringLabels = [
    trapEvenLab,
    trapTwoLab
  ];

  whole = wholeFrame();

  const trapEmpty = [5, 6, 7].map(k =>
    outline(
      ledgerX(k),
      LEDGER_Y,
      QW,
      QH,
      C.muted,
      1
    )
  );

  await play(
    new M.Create(whole),
    ...appear(trapEmpty)
  );

  ledgerObjects = [
    whole,
    ...trapEmpty
  ];

  // 44: tile two was counted twice.
  // Remove the extra copy.
  // The true union contains only 2, 4, 6 and 8.

  const trapSurvivors = pieces.filter(
    (_, k) => k !== 1
  );

  const extraTwo = pieces[1];

  const correctedEmpty = outline(
    ledgerX(4),
    LEDGER_Y,
    QW,
    QH,
    C.muted,
    1
  );

  await until(S(44));
  await play(
    new M.FadeOut(extraTwo),
    ...trapSurvivors.map((p, k) =>
      new M.Transform(
        p,
        chancePiece(
          EVEN[k],
          ledgerPos(k)
        ),
        { pathArc: -0.12 }
      )
    ),
    new M.FadeIn(correctedEmpty),
    new M.Indicate(
      tiles[1],
      { color: C.amber }
    ),
    ...changeLedgerTop('4 different winning shares', C.green),
    ...changeLedgerFoot('1/8 + 4/8 − 1/8 = 4/8', C.green),
    ...fbox([
      ['2 is already even', C.amber],
      ['subtract its extra 1/8', C.ink],
      ['5/8 − 1/8 = 4/8', C.green]
    ], C.green),
    ...say('TRUE ANSWER: FOUR EIGHTHS', C.green)
  );

  pieces = trapSurvivors;

  ledgerObjects.push(correctedEmpty);

  // 45: the universal question before adding.
  // Can both events happen at once?

  await until(S(45));
  await play(
    new M.Indicate(
      trapTwoRing,
      { color: C.amber }
    ),
    ...fbox([
      ['before adding, ask:', C.amber],
      ['can BOTH happen?', C.ink],
      ['if yes, fix overlap', C.green]
    ], C.green),
    ...say('ALWAYS ASK: CAN BOTH HAPPEN?', C.amber)
  );

  // 46: preview the next lesson.
  // So far we have considered one draw.
  // Next we will consider two draws.
  // Do not introduce the counting-arrangements rule yet.

  const NEXT_Y = P ? -3.0 : -1.6;

  const firstSlot = outline(
    CX - 0.85,
    NEXT_Y,
    1.0,
    1.0,
    C.violet,
    2
  );

  const secondSlot = outline(
    CX + 0.85,
    NEXT_Y,
    1.0,
    1.0,
    C.violet,
    2
  );

  const nextTiles = [
    tile(
      null,
      [CX - 0.85, NEXT_Y, 0],
      'normal',
      0.68
    ),
    tile(
      null,
      [CX + 0.85, NEXT_Y, 0],
      'normal',
      0.68
    )
  ];

  const nextLabels = [
    txt(
      'First draw',
      17,
      C.muted,
      [CX - 0.85, NEXT_Y - 0.78, 0]
    ),
    txt(
      'Second draw',
      17,
      C.muted,
      [CX + 0.85, NEXT_Y - 0.78, 0]
    )
  ];

  const previewObjects = [
    firstSlot,
    secondSlot,
    ...nextTiles,
    ...nextLabels
  ];

  await until(S(46));
  await play(
    ...clearRings(),
    ...clearLedger(),
    ...normalRow(),
    new M.Create(firstSlot),
    new M.Create(secondSlot),
    ...appear(nextLabels),
    ...fbox([
      ['so far: one draw', C.ink],
      ['next: two draws', C.violet],
      ['how many ways?', C.muted]
    ], C.violet),
    ...say('NEXT: DRAW TWO TILES', C.violet)
  );

  await until(S(46) + 3.0);
  await play(
    lag(
      nextTiles.map(t => new M.FadeIn(t)),
      1.8,
      0.65
    ),
    ...say('COUNT THE POSSIBLE WAYS', C.violet)
  );

  // 47: final takeaway.
  // Return to the original blue-or-even example.
  // The overlapping rings show exactly why subtraction is necessary.

  const finalOverlap = eventRing(
    CX,
    VY,
    VW + 0.17,
    0.9 + VW + 0.17,
    C.amber
  );

  await until(S(47));
  await play(
    ...fade(previewObjects),
    ...vennTiles(UNION, true),
    ...setVennRings(true),
    new M.FadeIn(finalOverlap),
    ...fbox([
      ['P(A or B) =', C.green],
      ['  P(A) + P(B)', C.ink],
      ['  − P(A and B)', C.amber]
    ], C.green),
    ...say('FOR OR, ADD BOTH CHANCES', C.green)
  );

  vennMarks = [finalOverlap];

  await until(S(47) + 2.5);
  await play(
    new M.Indicate(
      finalOverlap,
      { color: C.amber }
    ),
    ...fbox([
      ['5/8 + 4/8 − 2/8', C.ink],
      ['= 7/8', C.green],
      ['= 87.5%', C.green]
    ], C.green),
    ...say('TAKE AWAY THE OVERLAP ONCE', C.amber)
  );

  await until(E(47));
}

// lesson 4.1.3
// Complements: the chance of "not" is whatever remains of the whole.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D = [1, 2, 3, 4, 5, 6, 7, 8];
  const ALL = D.slice();
  const BLUES = [1, 2, 3, 4, 5];
  const ORANGES = [6, 7, 8];
  const NOT_SEVEN = [1, 2, 3, 4, 5, 6, 8];
  const ABOVE_FIVE = [6, 7, 8];
  const BELOW_FIVE = [1, 2, 3, 4];
  const FIVE_OR_LESS = [1, 2, 3, 4, 5];

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

  // Phone: the picture sits lower so the tall frame is used.
  const PDY = P ? -1.1 : 0;
  const ROW_Y = P ? -0.55 : 0.25;
  const HIGH_Y = P ? -0.1 : 0.65;
  const LOW_Y = P ? -1.35 : -0.55;

  const BAR_Y = P ? -3.25 : -1.85;

  const PILL = P
    ? [0, 1.6, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.9, 0]
    : [4.3, -0.3, 0];

  const colx = k => CX + (k - 3.5) * SP;
  const pos = (k, y = ROW_Y) => [colx(k), y, 0];

  const colour = n => n <= 5 ? BLUE : ORANGE;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
      cornerRadius: 0.15,
      color,
      strokeWidth: sw
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  // Glowing event rings, constructed from coordinates.
  // No already-visible tile is wrapped in a new VGroup.

  function eventRing(x, y, w, h, color = C.green) {
    const halo = outline(
      x, y, w + 0.08, h + 0.08, color, 6
    );

    halo.setFill(color, 0.025);

    const core = outline(
      x, y, w, h, color, 2
    );

    return new M.VGroup(halo, core);
  }

  function ringFor(nums, y = ROW_Y, color = C.green) {
    const left = colx(Math.min(...nums) - 1);
    const right = colx(Math.max(...nums) - 1);

    return eventRing(
      (left + right) / 2,
      y,
      right - left + TW + 0.18,
      TW + 0.26,
      color
    );
  }

  function sampleFrame(split = false) {
    const top = split ? HIGH_Y : ROW_Y;
    const bottom = split ? LOW_Y : ROW_Y;

    return outline(
      CX,
      (top + bottom) / 2,
      7 * SP + TW + 0.54,
      top - bottom + TW + 0.54,
      C.muted,
      2
    );
  }

  // Formula box: lines = ['text' | ['text', color]].
  // Leading spaces indent, as in the approved reference.

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

  function fitBox(g, wd, ht) {
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

    return g;
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

    return replaceBox(
      fitBox(g, wd, ht)
    );
  }

  // Vertically written fraction.

  function fraction(n, d, p, color = C.amber, size = 24) {
    const a = T(String(n), size, color, true);
    const b = T(String(d), size, color, true);

    const w = Math.max(
      a.getWidth(),
      b.getWidth()
    ) + 0.18;

    const dy = 0.25 * size / 24;

    a.moveTo([p[0], p[1] + dy, 0]);
    b.moveTo([p[0], p[1] - dy, 0]);

    const rule = line(
      [p[0] - w / 2, p[1], 0],
      [p[0] + w / 2, p[1], 0],
      color,
      2
    );

    return new M.VGroup(a, rule, b);
  }

  function fracBox(n, d, label = '', color = C.amber) {
    const f = fraction(
      n, d, [0, 0, 0], color
    );

    const lab = label
      ? T(label, P ? 20 : 19, C.ink)
      : null;

    const contentW = f.getWidth() +
      (lab ? lab.getWidth() + 0.35 : 0);

    const wd = Math.max(
      1.4,
      contentW + 0.7
    );

    const ht = 1.25;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - contentW / 2;

    f.moveTo([
      left + f.getWidth() / 2,
      BOXP[1],
      0
    ]);

    if (lab) {
      lab.moveTo([
        left + f.getWidth() + 0.35 + lab.getWidth() / 2,
        BOXP[1],
        0
      ]);
    }

    const g = lab
      ? new M.VGroup(r, f, lab)
      : new M.VGroup(r, f);

    return replaceBox(
      fitBox(g, wd, ht)
    );
  }

  // The eight original game tiles.
  // Their numbers, colours and dimensions never change.

  function tile(n, p, mode = 'normal', w = TW) {
    const c = colour(n);

    const dim = mode === 'dim';
    const bright = mode === 'bright';

    const halo = new M.RoundedRectangle({
      width: w + 0.1,
      height: w + 0.1,
      cornerRadius: 0.13,
      color: c,
      strokeWidth: bright ? 2 : 1
    });

    halo.setFill(
      c,
      dim ? 0.015 : bright ? 0.26 : 0.13
    );

    halo.moveTo(p);

    const face = new M.RoundedRectangle({
      width: w,
      height: w,
      cornerRadius: 0.1,
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
      13,
      Math.round(27 * w / 0.7)
    );

    const lab = txt(
      String(n),
      size,
      dim ? C.muted : C.ink,
      [p[0], p[1] + 0.025, 0],
      true
    );

    return new M.VGroup(
      halo, face, edge, lab
    );
  }

  const tiles = D.map((n, k) =>
    tile(n, pos(k))
  );

  function highlightTiles(selected, dimOthers = true) {
    return tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(
          D[k],
          pos(k),
          selected.includes(D[k])
            ? 'bright'
            : dimOthers ? 'dim' : 'normal'
        )
      )
    );
  }

  function normalRow() {
    return tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(D[k], pos(k))
      )
    );
  }

  // Separate the seven outcomes of "not tile seven"
  // from the one excluded outcome.

  function splitSeven() {
    return tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(
          D[k],
          pos(k, D[k] === 7 ? LOW_Y : HIGH_Y),
          D[k] === 7 ? 'dim' : 'bright'
        )
      )
    );
  }

  // Cloth bag, with a transparent cutaway.

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

  // Coffee icon.

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
      handle, cup, rim, saucer, ...steam
    );
  }

  // Shared chance bar.
  // Eight equally sized pieces represent the whole probability.
  // Empty or removed pieces retain their original positions.

  const BAR_W = 8 * SP - 0.12;
  const SEG_W = BAR_W / 8;
  const BAR_H = P ? 0.48 : 0.43;

  const barx = k =>
    CX + (k - 3.5) * SEG_W;

  function segment(k, color = C.muted, opacity = 0.1, dy = 0) {
    const r = new M.Rectangle({
      width: SEG_W,
      height: BAR_H,
      color,
      strokeWidth: 1
    });

    r.setFill(color, opacity);
    r.moveTo([barx(k), BAR_Y + dy, 0]);

    return r;
  }

  function barFrame(color = C.ink) {
    return outline(
      CX,
      BAR_Y,
      BAR_W + 0.1,
      BAR_H + 0.13,
      color,
      2
    );
  }

  function barText(s, color = C.muted) {
    return txt(
      s,
      P ? 18 : 17,
      color,
      [CX, BAR_Y + 0.5, 0]
    );
  }

  function barBottom(s, color = C.muted) {
    return txt(
      s,
      P ? 19 : 18,
      color,
      [CX, BAR_Y - 0.47, 0],
      true
    );
  }

  function eighthLabels(selected = ALL) {
    return D.map((n, k) =>
      txt(
        '1/8',
        P ? 15 : 17,
        selected.includes(n) ? C.ink : C.muted,
        [barx(k), BAR_Y - 0.45, 0],
        true
      )
    );
  }

  function groupLabel(s, first, last, color = C.ink) {
    return txt(
      s,
      P ? 19 : 18,
      color,
      [
        (barx(first - 1) + barx(last - 1)) / 2,
        BAR_Y,
        0
      ],
      true
    );
  }

  let slices = [];
  let whole = null;
  let barLab = null;
  let barFoot = null;
  let sliceLabs = [];
  let groupLabs = [];

  function makeBar(colors, opacities = null) {
    slices = D.map((_, k) =>
      segment(
        k,
        colors[k],
        opacities ? opacities[k] : 0.85
      )
    );

    whole = barFrame();

    return [
      ...appear(slices),
      new M.Create(whole)
    ];
  }

  function recolorBar(colors, opacities = null) {
    return slices.map((s, k) =>
      new M.Transform(
        s,
        segment(
          k,
          colors[k],
          opacities ? opacities[k] : 0.85
        )
      )
    );
  }

  function changeBarLab(s, color = C.muted) {
    const next = barText(s, color);
    const a = [new M.FadeIn(next)];

    if (barLab) {
      a.push(new M.FadeOut(barLab));
    }

    barLab = next;

    return a;
  }

  function changeBarFoot(s, color = C.muted) {
    const next = barBottom(s, color);
    const a = [new M.FadeIn(next)];

    if (barFoot) {
      a.push(new M.FadeOut(barFoot));
    }

    barFoot = next;

    return a;
  }

  function clearSliceLabs() {
    const a = fade(sliceLabs);
    sliceLabs = [];
    return a;
  }

  function clearGroupLabs() {
    const a = fade(groupLabs);
    groupLabs = [];
    return a;
  }

  function clearBarFoot() {
    if (!barFoot) return [];

    const a = [new M.FadeOut(barFoot)];
    barFoot = null;

    return a;
  }

  function clearBar() {
    const a = [
      ...fade(slices),
      ...clearSliceLabs(),
      ...clearGroupLabs(),
      ...clearBarFoot()
    ];

    if (whole) {
      a.push(new M.FadeOut(whole));
    }

    if (barLab) {
      a.push(new M.FadeOut(barLab));
    }

    slices = [];
    whole = null;
    barLab = null;

    return a;
  }

  // 0: back to the bag of eight tiles.

  await until(S(0));
  await play(
    new M.Create(table),
    new M.FadeIn(bag),
    ...say('OUR BAG OF 8 TILES')
  );

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

  // 2: recall the blue event and its probability.

  let ring = ringFor(BLUES, ROW_Y, BLUE);
  let otherRing = null;
  let frame = null;

  await until(S(2));
  await play(
    new M.FadeOut(bag),
    new M.FadeOut(table),
    ...fade(mini),
    lag(
      tiles.map(t => new M.FadeIn(t)),
      1.6,
      0.12
    ),
    new M.FadeIn(ring),
    ...fracBox(5, 8, 'blue', BLUE),
    ...say('LAST TIME: BLUE = 5/8', BLUE)
  );

  // 3: your friend changes the game.

  const coffee = coffeeAt([CX, -1.55 + PDY, 0]);

  await until(S(3));
  await play(
    new M.FadeIn(coffee),
    ...clearBox(),
    ...say('A NEW RULE', C.amber)
  );

  // 4: you win only if the tile is not blue.

  await until(S(4));
  await play(
    new M.Indicate(coffee, { color: C.amber }),
    ...fbox([
      ['new winning rule', C.muted],
      ['NOT BLUE', ORANGE]
    ], ORANGE),
    ...say('NOT BLUE? WIN A COFFEE!', ORANGE)
  );

  // 5: what is the chance of winning now?

  await until(S(5));
  await play(
    ...fbox([
      ['chance of winning', C.amber],
      ['?', C.ink]
    ], C.amber),
    ...say('WHAT IS OUR NEW CHANCE?', C.amber)
  );

  // 6: return to the complete row.
  // The blue event ring remains visible.

  await until(S(6));
  await play(
    new M.FadeOut(coffee),
    ...highlightTiles(BLUES, true),
    new M.Indicate(ring, { color: BLUE }),
    ...fbox([
      ['blue event', BLUE],
      ['{1,2,3,4,5}', C.ink]
    ], BLUE),
    ...say('KEEP THE BLUE RING IN VIEW', BLUE)
  );

  // 7: the winning tiles are outside the blue ring.

  const outsideArrow = pill(
    'OUTSIDE',
    ORANGE,
    17
  );

  outsideArrow.moveTo([
    (colx(5) + colx(7)) / 2,
    ROW_Y - 0.95,
    0
  ]);

  await until(S(7));
  await play(
    new M.FadeIn(outsideArrow),
    ...highlightTiles(ORANGES, true),
    ...say('WINNERS ARE OUTSIDE THE RING', ORANGE)
  );

  // 8: light up six, seven and eight.

  otherRing = ringFor(
    ORANGES,
    ROW_Y,
    ORANGE
  );

  await until(S(8));
  await play(
    lag(
      ORANGES.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: ORANGE }
        )
      ),
      3.2,
      0.5
    ),
    new M.FadeIn(otherRing),
    ...fbox([
      ['not blue', ORANGE],
      ['{6,7,8}', C.ink]
    ], ORANGE),
    ...say('6, 7 AND 8 WIN', ORANGE)
  );

  // 9: the two groups cover the entire sample space.
  // No tile is missing; no tile is counted twice.

  frame = sampleFrame();

  const groupBlueLab = txt(
    '5 blue',
    19,
    BLUE,
    [
      (colx(0) + colx(4)) / 2,
      ROW_Y - 0.9,
      0
    ]
  );

  const groupOrangeLab = txt(
    '3 not blue',
    19,
    ORANGE,
    [
      (colx(5) + colx(7)) / 2,
      ROW_Y - 0.9,
      0
    ]
  );

  await until(S(9));
  await play(
    new M.FadeOut(outsideArrow),
    ...highlightTiles(ALL, false),
    new M.Create(frame),
    new M.FadeIn(groupBlueLab),
    new M.FadeIn(groupOrangeLab),
    ...fbox([
      ['5 + 3 = 8', C.green],
      ['nothing missing', C.ink],
      ['nothing counted twice', C.muted]
    ], C.green),
    ...say('TOGETHER THEY COVER EVERYTHING', C.green)
  );

  // 10: name the concept of a complement.

  await until(S(10));
  await play(
    new M.Indicate(otherRing, { color: ORANGE }),
    ...fbox([
      ['complement', ORANGE],
      ['everything outside', C.ink],
      ['the event', C.muted]
    ], ORANGE),
    ...say('OUTSIDE THE EVENT = COMPLEMENT', C.green)
  );

  // 11: the complement completes the whole.

  await until(S(11));
  await play(
    lag([
      new M.Indicate(ring, { color: BLUE }),
      new M.Indicate(otherRing, { color: ORANGE }),
      new M.Indicate(frame, { color: C.green })
    ], 1.9, 0.35),
    ...say('COMPLEMENT COMPLETES THE WHOLE', C.green)
  );

  // 12: the complement of blue is not blue.

  await until(S(12));
  await play(
    ...highlightTiles(ORANGES, true),
    ...fbox([
      ['event: blue', BLUE],
      ['complement: not blue', ORANGE],
      ['{6,7,8}', C.ink]
    ], ORANGE),
    ...say('COMPLEMENT OF BLUE = NOT BLUE', ORANGE)
  );

  // 13: count the complement directly.
  // Three of the eight tiles are outside the blue ring.

  await until(S(13));
  await play(
    lag(
      ORANGES.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: ORANGE }
        )
      ),
      2.2,
      0.35
    ),
    ...fracBox(3, 8, 'not blue', ORANGE),
    ...say('3 TILES OUT OF 8', ORANGE)
  );

  // 14: introduce the faster method.

  await until(S(14));
  await play(
    new M.FadeOut(groupBlueLab),
    new M.FadeOut(groupOrangeLab),
    ...clearBox(),
    ...say('THERE IS A FASTER WAY', C.green)
  );

  // 15: one whole chance, split into eight equal pieces.

  const neutralColors = D.map(() => C.muted);

  await until(S(15));
  await play(
    ...highlightTiles(ALL, false),
    ...makeBar(neutralColors, D.map(() => 0.25)),
    ...changeBarLab('1 whole chance', C.ink),
    ...fbox([
      ['whole chance = 1', C.ink],
      ['8 equal pieces', C.green]
    ], C.green),
    ...say('PICTURE THE WHOLE CHANCE', C.green)
  );

  // 16: the blue event occupies five pieces.

  const blueOnlyColors = D.map(n =>
    BLUES.includes(n) ? BLUE : C.muted
  );

  const blueOnlyOpacity = D.map(n =>
    BLUES.includes(n) ? 0.9 : 0.08
  );

  await until(S(16));
  await play(
    ...recolorBar(blueOnlyColors, blueOnlyOpacity),
    ...changeBarLab('Blue takes five pieces', BLUE),
    ...fbox([
      ['blue = 5/8', BLUE],
      ['whole = 8/8', C.ink]
    ], BLUE),
    ...say('BLUE TAKES 5 OF 8 PIECES', BLUE)
  );

  // 17: the remaining three pieces are the complement.

  const chapterColors = D.map(colour);

  const blueShareLab = groupLabel(
    '5/8',
    1,
    5,
    C.ink
  );

  const orangeShareLab = groupLabel(
    '3/8',
    6,
    8,
    C.ink
  );

  await until(S(17));
  await play(
    ...recolorBar(chapterColors),
    ...changeBarLab('Together: one whole', C.green),
    new M.FadeIn(blueShareLab),
    new M.FadeIn(orangeShareLab),
    ...fbox([
      ['blue + not blue', C.ink],
      ['= the whole chance', C.green]
    ], C.green),
    ...say('THE REST IS THE COMPLEMENT', ORANGE)
  );

  groupLabs = [
    blueShareLab,
    orangeShareLab
  ];

  // 18: take away the five blue pieces.
  // Their empty slots preserve the original whole-bar size.

  const removedBlueSlots = D.map(n =>
    BLUES.includes(n) ? C.muted : ORANGE
  );

  const removedBlueOpacity = D.map(n =>
    BLUES.includes(n) ? 0.025 : 0.92
  );

  const liftedBlue = BLUES.map(n =>
    segment(n - 1, BLUE, 0.85)
  );

  await until(S(18));
  await play(
    ...clearGroupLabs(),
    ...recolorBar(
      removedBlueSlots,
      removedBlueOpacity
    ),
    ...appear(liftedBlue),
    ...changeBarLab('Take away the blue part', C.amber),
    ...fbox([
      ['whole − blue', C.ink],
      ['= what remains', ORANGE]
    ], C.amber),
    ...say('TAKE AWAY 5 PIECES', C.amber)
  );

  await play(
    lag(
      liftedBlue.map((b, k) =>
        new M.Transform(
          b,
          segment(k, BLUE, 0.25, 0.9)
        )
      ),
      1.1,
      0.08
    )
  );

  await play(
    ...fade(liftedBlue),
    ...changeBarLab('3 pieces remain', ORANGE),
    ...changeBarFoot('3/8 remains', ORANGE)
  );

  // 19: taking away is subtraction.

  const minusSign = txt(
    '−',
    40,
    C.amber,
    [
      (barx(0) + barx(4)) / 2,
      BAR_Y,
      0
    ],
    true
  );

  await until(S(19));
  await play(
    new M.FadeIn(minusSign),
    ...fbox([
      ['subtract = take away', C.amber],
      ['− means minus', C.ink]
    ], C.amber),
    ...say('TAKING AWAY = SUBTRACTING', C.amber)
  );

  // 20: eight eighths minus five eighths equals three eighths.

  await until(S(20));
  await play(
    new M.FadeOut(minusSign),
    lag(
      ORANGES.map(n =>
        new M.Indicate(
          slices[n - 1],
          { color: ORANGE }
        )
      ),
      2.2,
      0.3
    ),
    ...fbox([
      ['whole = 8/8', C.ink],
      ['8/8 − 5/8', C.amber],
      ['= 3/8', ORANGE]
    ], ORANGE),
    ...say('8/8 MINUS 5/8 = 3/8', ORANGE)
  );

  // 21: the same result without counting orange tiles.

  await until(S(21));
  await play(
    new M.Indicate(otherRing, { color: ORANGE }),
    ...fbox([
      ['direct count: 3/8', C.ink],
      ['subtraction:  3/8', C.ink],
      ['same answer', C.green]
    ], C.green),
    ...say('SAME ANSWER, LESS COUNTING', C.green)
  );

  // 22: put the two shares back together.
  // The event and complement always add up to one.

  groupLabs = [
    groupLabel('5/8', 1, 5, C.ink),
    groupLabel('3/8', 6, 8, C.ink)
  ];

  await until(S(22));
  await play(
    ...recolorBar(chapterColors),
    ...appear(groupLabs),
    ...clearBarFoot(),
    ...changeBarLab('Event + complement', C.green),
    ...fbox([
      ['blue + not blue', C.ink],
      ['5/8 + 3/8 = 8/8', C.amber],
      ['= 1', C.green]
    ], C.green),
    ...say('EVENT + COMPLEMENT = 1', C.green)
  );

  // 23: express the whole and the blue part as percentages.

  const bluePercentLab = groupLabel(
    '62.5%',
    1,
    5,
    C.ink
  );

  const orangeQuestionLab = groupLabel(
    '?',
    6,
    8,
    C.ink
  );

  await until(S(23));
  await play(
    new M.Transform(groupLabs[0], bluePercentLab),
    new M.Transform(groupLabs[1], orangeQuestionLab),
    ...changeBarLab('Whole chance = 100%', C.ink),
    ...fbox([
      ['whole = 100%', C.ink],
      ['blue = 62.5%', BLUE]
    ], BLUE),
    ...say('BLUE TAKES 62.5 PERCENT', BLUE)
  );

  // 24: the rest is thirty-seven and a half percent.

  const orangePercentLab = groupLabel(
    '37.5%',
    6,
    8,
    C.ink
  );

  await until(S(24));
  await play(
    new M.Transform(
      groupLabs[1],
      orangePercentLab
    ),
    new M.Indicate(otherRing, { color: ORANGE }),
    ...fbox([
      ['100% − 62.5%', C.ink],
      ['= 37.5%', ORANGE]
    ], ORANGE),
    ...say('NOT BLUE: 37.5 PERCENT', ORANGE)
  );

  // 25: introduce the short version.

  await until(S(25));
  await play(
    ...fbox([
      ['the complement rule', C.green],
      ['whole − event', C.ink]
    ], C.green),
    ...say('THE SHORT VERSION', C.green)
  );

  // 26: the complement rule.

  await until(S(26));
  await play(
    ...fbox([
      ['P(not event) =', C.ink],
      ['1 − P(event)', C.amber],
      ['complement rule', C.green]
    ], C.green),
    ...say('CHANCE OF NOT = 1 MINUS CHANCE', C.green)
  );

  // 27: everyday words.
  // Whatever is left of the whole is the chance it does not happen.

  await until(S(27));
  await play(
    ...clearGroupLabs(),
    ...recolorBar(
      removedBlueSlots,
      removedBlueOpacity
    ),
    ...changeBarLab('Whatever is left', ORANGE),
    ...changeBarFoot('1 − 5/8 = 3/8', C.amber),
    ...fbox([
      ['chance it does', C.ink],
      ['not happen =', C.ink],
      ['what is left of 1', ORANGE]
    ], ORANGE),
    ...say('NOT MEANS THE REMAINING CHANCE', ORANGE)
  );

  // 28: a new example.
  // What is the chance of not pulling tile seven?

  await until(S(28));
  await play(
    new M.FadeOut(ring),
    new M.FadeOut(otherRing),
    new M.FadeOut(frame),
    ...clearBar(),
    ...normalRow(),
    ...fbox([
      ['new question', C.amber],
      ['not tile 7', C.ink],
      ['chance = ?', C.amber]
    ], C.amber),
    ...say('WHAT IF WE DO NOT DRAW TILE 7?', C.amber)
  );

  ring = null;
  otherRing = null;
  frame = null;

  // 29: count the seven outcomes of "not tile seven".
  // Move tile seven below the others, making one continuous
  // ring around the seven included outcomes possible.

  otherRing = ringFor(
    NOT_SEVEN,
    HIGH_Y,
    C.green
  );

  ring = ringFor(
    [7],
    LOW_Y,
    C.amber
  );

  frame = sampleFrame(true);

  const sevenExcluded = txt(
    'excluded',
    16,
    C.amber,
    [
      colx(6) - TW / 2 - 0.62,
      LOW_Y,
      0
    ]
  );

  const sevenCount = txt(
    '7 included outcomes',
    19,
    C.green,
    [
      CX - (P ? 1.3 : 0.6),
      LOW_Y - 0.12,
      0
    ]
  );

  await until(S(29));
  await play(
    ...splitSeven(),
    new M.FadeIn(otherRing),
    new M.FadeIn(ring),
    new M.Create(frame),
    new M.FadeIn(sevenExcluded),
    ...fbox([
      ['not tile 7', C.green],
      ['{1,2,3,4,5,6,8}', C.ink]
    ], C.green),
    ...say('COUNT EVERYTHING EXCEPT 7', C.green)
  );

  await play(
    lag(
      NOT_SEVEN.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.green }
        )
      ),
      3.0,
      0.28
    ),
    new M.FadeIn(sevenCount)
  );

  // 30: the shortcut is to count the smaller event.
  // The chance of tile seven is one eighth.

  const sevenOnlyColors = D.map(n =>
    n === 7 ? ORANGE : C.muted
  );

  const sevenOnlyOpacity = D.map(n =>
    n === 7 ? 0.94 : 0.12
  );

  await until(S(30));
  await play(
    new M.FadeOut(sevenCount),
    new M.Indicate(ring, { color: C.amber }),
    ...makeBar(sevenOnlyColors, sevenOnlyOpacity),
    ...changeBarLab('Tile 7 takes one piece', C.amber),
    ...fracBox(1, 8, 'tile 7', C.amber),
    ...say('SHORTCUT: COUNT TILE 7 INSTEAD', C.amber)
  );

  // 31: take one eighth away from eight eighths.

  const notSevenColors = D.map(n =>
    n === 7 ? C.muted : C.green
  );

  const notSevenOpacity = D.map(n =>
    n === 7 ? 0.025 : 0.88
  );

  await until(S(31));
  await play(
    ...recolorBar(
      notSevenColors,
      notSevenOpacity
    ),
    ...changeBarLab('All except one piece', C.green),
    ...fbox([
      ['8/8 − 1/8', C.ink],
      ['= 7/8', C.green]
    ], C.green),
    ...say('8/8 MINUS 1/8 = 7/8', C.green)
  );

  // 32: seven eighths is eighty-seven and a half percent.

  await until(S(32));
  await play(
    new M.Indicate(otherRing, { color: C.green }),
    ...changeBarFoot('87.5%', C.green),
    ...fbox([
      ['not tile 7', C.green],
      ['1 − 1/8 = 7/8', C.ink],
      ['= 87.5%', C.green]
    ], C.green),
    ...say('NOT TILE 7: 87.5 PERCENT', C.green)
  );

  // 33: why complements are useful.
  // Count the easy event and subtract its chance from one.

  await until(S(33));
  await play(
    lag([
      new M.Indicate(ring, { color: C.amber }),
      new M.Indicate(otherRing, { color: C.green })
    ], 3.0, 0.8),
    ...fbox([
      ['count the easy event', C.amber],
      ['subtract it from 1', C.ink],
      ['get the complement', C.green]
    ], C.green),
    ...say('COUNT THE SMALLER GROUP FIRST', C.green)
  );

  // 34: common trap.
  // A complement must contain every outcome outside the event,
  // and no outcome inside it.

  await until(S(34));
  await play(
    new M.FadeOut(ring),
    new M.FadeOut(otherRing),
    new M.FadeOut(frame),
    new M.FadeOut(sevenExcluded),
    ...clearBar(),
    ...normalRow(),
    ...fbox([
      ['a true complement', C.amber],
      ['EVERY outside outcome', C.ink],
      ['NO inside outcomes', C.ink]
    ], C.amber),
    ...say('COMMON TRAP: MISSING AN OUTCOME', C.amber)
  );

  ring = null;
  otherRing = null;
  frame = null;

  // 35: event "a number above five".
  // It includes exactly six, seven and eight.

  ring = ringFor(
    ABOVE_FIVE,
    ROW_Y,
    ORANGE
  );

  const aboveLab = txt(
    'Above 5',
    19,
    ORANGE,
    [
      (colx(5) + colx(7)) / 2,
      ROW_Y - 0.91,
      0
    ]
  );

  await until(S(35));
  await play(
    ...highlightTiles(ABOVE_FIVE, true),
    new M.FadeIn(ring),
    new M.FadeIn(aboveLab),
    ...fbox([
      ['event: above 5', ORANGE],
      ['{6,7,8}', C.ink],
      ['chance = 3/8', ORANGE]
    ], ORANGE),
    ...say('EVENT: A NUMBER ABOVE FIVE', ORANGE)
  );

  // 36: the tempting but incorrect answer is "below five".

  let belowLab = txt(
    'Below 5?',
    19,
    C.amber,
    [
      (colx(0) + colx(3)) / 2,
      ROW_Y - 0.91,
      0
    ]
  );

  await until(S(36));
  await play(
    new M.FadeIn(belowLab),
    ...fbox([
      ['guess:', C.amber],
      ['below 5?', C.ink],
      ['is that everything?', C.muted]
    ], C.amber),
    ...say('IS THE COMPLEMENT BELOW FIVE?', C.amber)
  );

  // 37: below five contains only one, two, three and four.

  otherRing = ringFor(
    BELOW_FIVE,
    ROW_Y,
    C.violet
  );

  const wrongSelected = [
    ...BELOW_FIVE,
    ...ABOVE_FIVE
  ];

  await until(S(37));
  await play(
    ...highlightTiles(wrongSelected, true),
    new M.FadeIn(otherRing),
    lag(
      BELOW_FIVE.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.violet }
        )
      ),
      3.2,
      0.45
    ),
    ...fbox([
      ['below 5', C.violet],
      ['{1,2,3,4}', C.ink],
      ['chance = 4/8', C.violet]
    ], C.violet),
    ...say('BELOW FIVE IS ONLY 1, 2, 3, 4', C.violet)
  );

  // 38: reveal the forgotten outcome, tile five.
  // It belongs to neither of the two proposed groups.

  const missingHalo = outline(
    colx(4),
    ROW_Y,
    TW + 0.19,
    TW + 0.19,
    C.amber,
    3
  );

  const missingTag = pill(
    'MISSING!',
    C.amber,
    16
  );

  missingTag.moveTo([
    colx(4),
    ROW_Y + TW / 2 + 0.43,
    0
  ]);

  await until(S(38));
  await play(
    new M.Create(missingHalo),
    new M.FadeIn(missingTag),
    new M.Transform(
      tiles[4],
      tile(5, pos(4), 'bright')
    ),
    ...fbox([
      ['what about tile 5?', C.amber],
      ['not above 5', C.ink],
      ['not below 5', C.ink]
    ], C.amber),
    ...say('TILE FIVE HAS BEEN FORGOTTEN', C.amber)
  );

  // 39: the incorrect groups fill only seven eighths.
  // The fifth slot remains visibly empty.

  const wrongColors = D.map(n =>
    n === 5
      ? C.muted
      : n < 5
        ? C.violet
        : ORANGE
  );

  const wrongOpacity = D.map(n =>
    n === 5 ? 0.02 : 0.86
  );

  const gapOutline = outline(
    barx(4),
    BAR_Y,
    SEG_W + 0.04,
    BAR_H + 0.08,
    C.amber,
    3
  );

  const gapLab = txt(
    '1/8 missing',
    17,
    C.amber,
    [
      barx(4),
      BAR_Y - 0.47,
      0
    ]
  );

  await until(S(39));
  await play(
    ...makeBar(wrongColors, wrongOpacity),
    new M.Create(gapOutline),
    new M.FadeIn(gapLab),
    ...changeBarLab('The bar is not full', C.amber),
    ...fbox([
      ['3/8 + 4/8', C.ink],
      ['= 7/8', C.amber],
      ['not 1!', C.amber]
    ], C.amber),
    ...say('WRONG: THE CHANCES ADD TO 7/8', C.amber)
  );

  // 40: the correct complement is five or less.
  // Tile five must be included.

  const correctRing = ringFor(
    FIVE_OR_LESS,
    ROW_Y,
    C.green
  );

  const correctBelowLab = txt(
    '5 or less',
    19,
    C.green,
    [
      (colx(0) + colx(4)) / 2,
      ROW_Y - 0.91,
      0
    ]
  );

  await until(S(40));
  await play(
    new M.FadeOut(missingHalo),
    new M.FadeOut(missingTag),
    new M.FadeOut(otherRing),
    new M.FadeIn(correctRing),
    new M.Transform(
      belowLab,
      correctBelowLab
    ),
    ...[0, 1, 2, 3].map(k => new M.Transform(tiles[k], tile(D[k], pos(k), 'bright'))),
    ...recolorBar(D.map(n => n <= 5 ? C.green : ORANGE)),
    ...changeBarLab('5 or less: 5 pieces', C.green),
    new M.FadeOut(gapOutline),
    new M.FadeOut(gapLab),
    ...fbox([
      ['true complement:', C.green],
      ['5 or less', C.ink],
      ['{1,2,3,4,5}', C.ink],
      ['chance = 5/8', C.green]
    ], C.green),
    ...say('CORRECT: FIVE OR LESS', C.green)
  );

  otherRing = correctRing;

  // 41: three eighths plus five eighths fills the whole bar.

  const correctedColors = D.map(n =>
    n <= 5 ? C.green : ORANGE
  );

  frame = sampleFrame();

  groupLabs = [
    groupLabel('5/8', 1, 5, C.ink),
    groupLabel('3/8', 6, 8, C.ink)
  ];

  await until(S(41));
  await play(
    ...recolorBar(correctedColors),
    ...appear(groupLabs),
    new M.Create(frame),
    ...changeBarLab('Every piece is included', C.green),
    ...fbox([
      ['3/8 + 5/8', C.ink],
      ['= 8/8', C.green],
      ['= 1 whole', C.green]
    ], C.green),
    ...say('NOW THE CHANCES ADD TO 1', C.green)
  );

  // 42: always check that the event and complement
  // cover all outcomes without overlap.

  await until(S(42));
  await play(
    lag([
      new M.Indicate(ring, { color: ORANGE }),
      new M.Indicate(otherRing, { color: C.green }),
      new M.Indicate(whole, { color: C.green })
    ], 3.2, 0.6),
    ...fbox([
      ['check your complement', C.green],
      ['nothing missing', C.ink],
      ['nothing counted twice', C.ink],
      ['total chance = 1', C.green]
    ], C.green),
    ...say('CHECK: EVENT + COMPLEMENT = 1', C.green)
  );

  // 43: preview the next lesson.
  // A brief, accurate preview of two overlapping event rings.
  // Blue and even are shown, without introducing the next rule.

  const PRE_Y = P ? -0.95 : -0.15;
  const RR = P ? 1.65 : 1.56;
  const OFFSET = P ? 0.91 : 0.86;

  const leftCenter = CX - OFFSET;
  const rightCenter = CX + OFFSET;

  const previewPositions = {
    1: [CX - 1.92, PRE_Y + 0.65, 0],
    2: [CX, PRE_Y + 0.55, 0],
    3: [CX - 1.93, PRE_Y - 0.15, 0],
    4: [CX, PRE_Y - 0.43, 0],
    5: [CX - 1.26, PRE_Y - 0.82, 0],
    6: [CX + 1.78, PRE_Y + 0.48, 0],
    7: [CX + 3.05, PRE_Y - 1.16, 0],
    8: [CX + 1.78, PRE_Y - 0.48, 0]
  };

  function previewCircle(x, color) {
    const halo = new M.Circle({
      radius: RR,
      color,
      strokeWidth: 6
    });

    halo.setFill(color, 0.025);
    halo.moveTo([x, PRE_Y, 0]);

    const core = new M.Circle({
      radius: RR,
      color,
      strokeWidth: 2
    });

    core.setFill(color, 0);
    core.moveTo([x, PRE_Y, 0]);

    return new M.VGroup(halo, core);
  }

  const previewBlue = previewCircle(
    leftCenter,
    BLUE
  );

  const previewEven = previewCircle(
    rightCenter,
    C.ink
  );

  const previewBlueLab = txt(
    'Blue',
    19,
    BLUE,
    [
      CX - 1.92,
      PRE_Y + RR + 0.22,
      0
    ]
  );

  const previewEvenLab = txt(
    'Even',
    19,
    C.ink,
    [
      CX + 1.92,
      PRE_Y + RR + 0.22,
      0
    ]
  );

  await until(S(43));
  await play(
    new M.FadeOut(ring),
    new M.FadeOut(otherRing),
    new M.FadeOut(frame),
    new M.FadeOut(aboveLab),
    new M.FadeOut(belowLab),
    ...clearBar(),
    ...tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(
          D[k],
          previewPositions[D[k]],
          'normal',
          TW * 0.72
        ),
        { pathArc: 0.15 }
      )
    ),
    new M.FadeIn(previewBlue),
    new M.FadeIn(previewEven),
    new M.FadeIn(previewBlueLab),
    new M.FadeIn(previewEvenLab),
    ...fbox([
      ['next lesson', C.violet],
      ['two event rings', C.ink],
      ['where they overlap', C.muted]
    ], C.violet),
    ...say('NEXT: TWO RINGS AND THEIR OVERLAP', C.violet)
  );

  // 44: final takeaway.
  // Restore the original blue/not-blue example.
  // The full row and whole chance bar make the rule visible.

  ring = ringFor(
    BLUES,
    ROW_Y,
    BLUE
  );

  otherRing = ringFor(
    ORANGES,
    ROW_Y,
    ORANGE
  );

  frame = sampleFrame();

  const finalBlueLab = txt(
    'Blue',
    18,
    BLUE,
    [
      (colx(0) + colx(4)) / 2,
      ROW_Y - 0.88,
      0
    ]
  );

  const finalOrangeLab = txt(
    'Not blue',
    18,
    ORANGE,
    [
      (colx(5) + colx(7)) / 2,
      ROW_Y - 0.88,
      0
    ]
  );

  await until(S(44));
  await play(
    new M.FadeOut(previewBlue),
    new M.FadeOut(previewEven),
    new M.FadeOut(previewBlueLab),
    new M.FadeOut(previewEvenLab),
    ...normalRow(),
    new M.FadeIn(ring),
    new M.FadeIn(otherRing),
    new M.Create(frame),
    new M.FadeIn(finalBlueLab),
    new M.FadeIn(finalOrangeLab),
    ...makeBar(chapterColors),
    ...changeBarFoot('1 − 5/8 = 3/8', C.amber),
    ...fbox([
      ['P(not event) =', C.ink],
      ['1 − P(event)', C.amber],
      ['the complement rule', C.green]
    ], C.green),
    ...say('CHANCE OF NOT = 1 MINUS CHANCE', C.green)
  );

  await until(S(44) + 2.4);
  await play(
    new M.Indicate(otherRing, { color: ORANGE }),
    ...recolorBar(
      removedBlueSlots,
      removedBlueOpacity
    ),
    ...say('THE COMPLEMENT IS WHAT REMAINS', ORANGE)
  );

  await until(E(44));
}

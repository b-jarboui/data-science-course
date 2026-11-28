// lesson 4.1.2
// Events: a group of outcomes picked by a rule.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D = [1, 2, 3, 4, 5, 6, 7, 8];
  const EVEN = [2, 4, 6, 8];
  const ODD = [1, 3, 5, 7];
  const BLUES = [1, 2, 3, 4, 5];
  const ALL = D.slice();

  const BLUE = C.cyan;
  const ORANGE = '#fb923c';
  const CLOTH = '#a58d72';
  const CORD = '#d6bea0';

  const CX = P ? 0 : -2.6;
  const SP = Math.min(P ? 0.88 : 0.9, (FW - (P ? 0.9 : 6.8)) / 8);
  const TW = SP * 0.78;

  // Phone: the whole picture sits lower so the tall frame is used (no empty lower half).
  const PDY = P ? -1.1 : 0;
  const ROW_Y = P ? -0.6 : 0.25;
  const WIN_Y = ROW_Y + 0.48;
  const LOSE_Y = ROW_Y - 0.62;
  const BAR_Y = P ? -3.1 : -1.85;

  const PILL = P ? [0, 1.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 2.9, 0] : [4.3, -0.3, 0];

  const colx = k => CX + (k - 3.5) * SP;
  const pos = (k, y = ROW_Y) => [colx(k), y, 0];
  const colour = n => n <= 5 ? BLUE : ORANGE;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fade = objs => objs.map(o => new M.FadeOut(o));
  const appear = objs => objs.map(o => new M.FadeIn(o));

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
      cornerRadius: 0.16,
      color,
      strokeWidth: sw
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);
    return r;
  }

  // Glowing event ring.
  // All outlines are constructed from coordinates.
  // Never group already-visible tiles to make a ring.

  function eventRing(x, y, w, h, color = C.green) {
    const halo = outline(
      x, y, w + 0.1, h + 0.1, color, 7
    );

    halo.setFill(color, 0.035);

    const core = outline(
      x, y, w, h, color, 2
    );

    return new M.VGroup(halo, core);
  }

  function ringFor(indices, y, color = C.green) {
    const left = colx(Math.min(...indices) - 1);
    const right = colx(Math.max(...indices) - 1);

    return eventRing(
      (left + right) / 2,
      y,
      right - left + TW + 0.29,
      TW + 0.29,
      color
    );
  }

  function sampleFrame(split = false) {
    const bottom = split ? LOSE_Y : ROW_Y;
    const top = split ? WIN_Y : ROW_Y;

    return outline(
      CX,
      (bottom + top) / 2,
      7 * SP + TW + 0.6,
      top - bottom + TW + 0.68,
      C.muted,
      2
    );
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
      const ind = s.length - s.trimStart().length;
      return t.getWidth() + cw * ind;
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

    return replaceBox(fitBox(g, wd, ht));
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
    const f = fraction(n, d, [0, 0, 0], color);

    const lab = label
      ? T(label, P ? 20 : 19, C.ink)
      : null;

    const contentW = f.getWidth() +
      (lab ? lab.getWidth() + 0.35 : 0);

    const wd = Math.max(1.4, contentW + 0.7);
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

    return replaceBox(fitBox(g, wd, ht));
  }

  // Glowing game tiles.
  // Modes alter brightness, never the original number or colour.
  // Tile eight changes size only during the hypothetical trap.

  function tile(n, p, mode = 'normal', w = TW) {
    const c = n === null ? C.muted : colour(n);

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

  const tiles = D.map((n, k) => tile(n, pos(k)));

  // Transform the same eight tile objects between arrangements.
  // No on-screen tile is detached or wrapped in a new group.

  function arrange(
    selected = ALL,
    split = false,
    dimOthers = true
  ) {
    return tiles.map((t, k) => {
      const n = D[k];
      const hit = selected.includes(n);

      const y = split
        ? (hit ? WIN_Y : LOSE_Y)
        : ROW_Y;

      const mode = hit
        ? 'bright'
        : dimOthers ? 'dim' : 'normal';

      return new M.Transform(
        t,
        tile(n, pos(k, y), mode)
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
  // A transparent cutaway briefly lets the learner see its contents.

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

  // 0: return to the bag of eight tiles.

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

  // 2: draw one tile without looking.
  // The identity of the drawn tile is not revealed.

  const drawP = [CX + 2.65, -0.55 + PDY, 0];

  await until(S(2));
  await play(
    ...fade(mini.filter((_, k) => k !== 3)),
    new M.Transform(
      mini[3],
      tile(null, drawP),
      { pathArc: -0.8 }
    ),
    ...say('DRAW ONE WITHOUT LOOKING', C.amber)
  );

  // 3: recall the complete sample space.

  let frame = sampleFrame();

  await until(S(3));
  await play(
    new M.FadeOut(bag),
    new M.FadeOut(table),
    new M.FadeOut(mini[3]),
    lag(
      tiles.map(t => new M.FadeIn(t)),
      1.8,
      0.15
    ),
    new M.Create(frame),
    ...fbox([
      ['sample space', C.green],
      ['{1,2,3,4,5,6,7,8}', C.ink]
    ], C.green),
    ...say('ALL 8 POSSIBLE OUTCOMES', C.green)
  );

  // Small coffee icon, built from native scene primitives.

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

  const coffee = coffeeAt([CX, P ? -2.3 : -1.4, 0]);

  // 4: a friend makes an offer.

  await until(S(4));
  await play(
    new M.FadeOut(frame),
    new M.FadeIn(coffee),
    ...clearBox(),
    ...say('A NEW OFFER', C.amber)
  );

  // 5: even number wins a coffee.

  await until(S(5));
  await play(
    new M.Indicate(coffee, { color: C.amber }),
    ...fbox([
      ['the rule', C.muted],
      ['even number = win', C.green]
    ], C.green),
    ...say('EVEN NUMBER? WIN A COFFEE!', C.green)
  );

  // 6: explain even through equal sharing.
  // Four dots are shared between two people, two each.

  const SHARE_Y = P ? -2.75 : -1.55;

  const sharePos = k => [
    CX + (k < 2 ? -1.08 : 1.08)
      + ((k % 2) - 0.5) * 0.46,
    SHARE_Y + 0.15,
    0
  ];

  const shareDots = D.slice(0, 4).map((_, k) =>
    new M.Dot({
      point: [CX + (k - 1.5) * 0.45, SHARE_Y + 0.5, 0],
      radius: 0.14,
      color: C.green
    })
  );

  const shareTargets = D.slice(0, 4).map((_, k) =>
    new M.Dot({
      point: sharePos(k),
      radius: 0.14,
      color: C.green
    })
  );

  const people = [-1, 1].map(v =>
    txt(
      'Person ' + (v === -1 ? '1' : '2'),
      17,
      C.muted,
      [CX + v * 1.08, SHARE_Y - 0.43, 0]
    )
  );

  const shareRings = [-1, 1].map(v =>
    outline(
      CX + v * 1.08,
      SHARE_Y + 0.15,
      1.35,
      0.67,
      C.green,
      2
    )
  );

  await until(S(6));
  await play(
    new M.FadeOut(coffee),
    new M.Indicate(tiles[3], { color: C.green }),
    ...appear(shareDots),
    ...appear(people),
    ...fbox([
      ['4 shared by 2', C.ink],
      ['2 each, none left', C.green]
    ], C.green),
    ...say('EVEN = SHARES EXACTLY INTO 2', C.green)
  );

  await play(
    lag(
      shareDots.map((d, k) =>
        new M.Transform(
          d,
          shareTargets[k],
          { pathArc: k < 2 ? 0.45 : -0.45 }
        )
      ),
      1.6,
      0.15
    ),
    ...shareRings.map(r => new M.Create(r))
  );

  // 7: the four even numbers.

  await until(S(7));
  await play(
    ...fade(shareDots),
    ...fade(people),
    ...fade(shareRings),
    lag(
      EVEN.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.green }
        )
      ),
      2.3,
      0.35
    ),
    ...fbox([
      ['even numbers', C.green],
      ['2, 4, 6, 8', C.ink]
    ], C.green),
    ...say('2, 4, 6, 8 ARE EVEN', C.green)
  );

  // 8: how likely is it that we win?

  await until(S(8));
  await play(
    ...fbox([
      ['chance of winning', C.amber],
      ['?', C.ink]
    ], C.amber),
    ...say('HOW LIKELY IS A WIN?', C.amber)
  );

  // 9: restore the complete row.

  await until(S(9));
  await play(
    ...normalRow(),
    ...clearBox(),
    ...say('START WITH ALL 8 TILES')
  );

  // 10: light up every winning tile.
  // The even tiles retain their blue/orange chapter colours.

  await until(S(10));
  await play(
    ...arrange(EVEN, false, true),
    ...say('LIGHT UP THE WINNERS', C.green)
  );

  // 11: tile 2 wins, tile 4 wins, tile 6 wins, tile 8 wins.

  await until(S(11));
  await play(
    lag(
      EVEN.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.green }
        )
      ),
      4.5,
      0.65
    ),
    ...say('2 WINS  /  4  /  6  /  8', C.green)
  );

  // 12: odd numbers stay dark.

  const oddTags = ODD.map(n =>
    txt(
      'odd',
      16,
      C.muted,
      [colx(n - 1), ROW_Y - TW / 2 - 0.3, 0]
    )
  );

  await until(S(12));
  await play(
    lag(
      oddTags.map(t => new M.FadeIn(t)),
      2.7,
      0.35
    ),
    ...fbox([
      ['odd numbers', C.muted],
      ['1, 3, 5, 7', C.ink]
    ], C.muted),
    ...say('ODD NUMBERS DO NOT WIN', C.muted)
  );

  // 13: a single glowing ring around the winning tiles.
  // Raise the even tiles and lower the odd tiles slightly.
  // This makes one continuous ring possible without enclosing
  // any of the losing outcomes.

  let ring = ringFor(EVEN, WIN_Y, C.green);

  await until(S(13));
  await play(
    ...fade(oddTags),
    ...arrange(EVEN, true, true),
    new M.FadeIn(ring),
    ...fbox([
      ['winning outcomes', C.green],
      ['{2,4,6,8}', C.ink]
    ], C.green),
    ...say('RING AROUND THE WINNERS', C.green)
  );

  // 14: a group of outcomes picked by one rule.

  await until(S(14));
  await play(
    new M.Indicate(ring, { color: C.green }),
    ...fbox([
      ['rule:', C.muted],
      ['number is even', C.green],
      ['{2,4,6,8}', C.ink]
    ], C.green),
    ...say('ONE RULE PICKS A GROUP', C.green)
  );

  // 15: name the concept.

  await until(S(15));
  await play(
    ...fbox([
      ['event', C.green],
      ['a group of outcomes', C.ink],
      ['picked by a rule', C.muted]
    ], C.green),
    ...say('THIS GROUP IS AN EVENT', C.green)
  );

  // 16: the event "the tile is even".

  await until(S(16));
  await play(
    lag(
      EVEN.map(n =>
        new M.Indicate(
          tiles[n - 1],
          { color: C.green }
        )
      ),
      3.2,
      0.4
    ),
    ...fbox([
      ['event: even', C.green],
      ['{2,4,6,8}', C.ink]
    ], C.green),
    ...say('EVENT: THE TILE IS EVEN', C.green)
  );

  // 17: an event is part of the sample space.
  // The outer frame encloses every tile, including the losers.

  frame = sampleFrame(true);

  await until(S(17));
  await play(
    new M.Create(frame),
    ...fbox([
      ['sample space:', C.muted],
      ['{1,2,3,4,5,6,7,8}', C.ink],
      ['event: {2,4,6,8}', C.green]
    ], C.green),
    ...say('EVENT = PART OF THE SAMPLE SPACE', C.green)
  );

  // 18: the event happens when the drawn tile belongs to it.
  // Tile four is used as an illustrative winning draw.

  const winCoffee = coffeeAt([CX, P ? -3.0 : -1.85, 0]);

  await until(S(18));
  await play(
    new M.Indicate(
      tiles[3],
      { color: C.amber }
    ),
    new M.FadeIn(winCoffee),
    ...fbox([
      ['example: draw tile 4', C.ink],
      ['inside ring = win', C.green]
    ], C.green),
    ...say('DRAW INSIDE THE RING: WIN!', C.green)
  );

  // 19: now find the probability.

  await until(S(19));
  await play(
    new M.FadeOut(winCoffee),
    ...say('HOW LIKELY?', C.amber)
  );

  // Chance bar.
  // Each slice corresponds to one equally likely tile.
  // Muted slices remain part of the total chance.

  const BAR_W = 8 * SP - 0.12;
  const SEG_W = BAR_W / 8;
  const BAR_H = P ? 0.48 : 0.43;

  const joinedX = k => CX + (k - 3.5) * SEG_W;

  function segment(
    k,
    active = false,
    joined = false,
    activeColor = C.green
  ) {
    const c = active ? activeColor : C.muted;

    const r = new M.Rectangle({
      width: joined ? SEG_W : SP - 0.16,
      height: BAR_H,
      color: c,
      strokeWidth: joined ? 1 : 2
    });

    r.setFill(c, active ? 0.88 : 0.12);

    r.moveTo([
      joined ? joinedX(k) : colx(k),
      BAR_Y,
      0
    ]);

    return r;
  }

  function barFrame() {
    return outline(
      CX,
      BAR_Y,
      BAR_W + 0.1,
      BAR_H + 0.13,
      C.ink,
      2
    );
  }

  function barText(s, color = C.muted) {
    return txt(
      s,
      P ? 18 : 17,
      color,
      [CX, BAR_Y + 0.49, 0]
    );
  }

  function shareLabels(selected = ALL) {
    return D.map((n, k) =>
      txt(
        '1/8',
        P ? 15 : 17,
        selected.includes(n) ? C.ink : C.muted,
        [colx(k), BAR_Y - 0.42, 0],
        true
      )
    );
  }

  let slices = D.map((_, k) =>
    segment(k, true, false, C.cyan)
  );

  let eighths = shareLabels();
  let whole = null;
  let barLab = barText('Same chance for every tile');

  // 20: each tile has one eighth of the chance.

  await until(S(20));
  await play(
    lag(
      slices.map(s => new M.FadeIn(s)),
      1.25,
      0.1
    ),
    ...appear(eighths),
    new M.FadeIn(barLab),
    ...fracBox(1, 8, 'each tile'),
    ...say('EACH TILE HAS A CHANCE OF 1/8', C.amber)
  );

  // 21: the event contains four of those eight equal shares.

  const eventBarLab = barText(
    '4 winning slices',
    C.green
  );

  await until(S(21));
  await play(
    ...slices.map((s, k) =>
      new M.Transform(
        s,
        segment(k, EVEN.includes(D[k]))
      )
    ),
    ...eighths.map((t, k) =>
      new M.Transform(
        t,
        txt(
          '1/8',
          P ? 15 : 17,
          EVEN.includes(D[k]) ? C.green : C.muted,
          [colx(k), BAR_Y - 0.42, 0],
          true
        )
      )
    ),
    new M.FadeOut(barLab),
    new M.FadeIn(eventBarLab),
    ...say('4 TILES, 4 EQUAL SHARES', C.green)
  );

  barLab = eventBarLab;

  // 22: add the four one-eighth shares.

  await until(S(22));
  await play(
    lag(
      EVEN.map(n =>
        new M.Indicate(
          slices[n - 1],
          { color: C.green }
        )
      ),
      1.9,
      0.2
    ),
    ...fbox([
      ['1/8 + 1/8', C.ink],
      ['+ 1/8 + 1/8', C.ink],
      ['= 4/8', C.green]
    ], C.green),
    ...say('FOUR LOTS OF ONE EIGHTH', C.green)
  );

  // 23: write four eighths as a vertical fraction.

  await until(S(23));
  await play(
    ...fracBox(4, 8, 'winning chance', C.green),
    ...say('4 ABOVE, 8 BELOW', C.amber)
  );

  // 24: join the eight shares into one bar.
  // The four winning shares move together, showing half visually.

  whole = barFrame();

  const ordered = [
    ...EVEN,
    ...ODD
  ];

  const joinedAnimations = ordered.map((n, k) =>
    new M.Transform(
      slices[n - 1],
      segment(k, k < 4, true, C.green),
      { pathArc: n % 2 === 0 ? 0.2 : -0.2 }
    )
  );

  const joinedLab = barText(
    '4 of 8 equal pieces',
    C.green
  );

  await until(S(24));
  await play(
    ...fade(eighths),
    new M.FadeOut(barLab),
    lag(joinedAnimations, 1.9, 0.08),
    new M.Create(whole),
    new M.FadeIn(joinedLab),
    ...say('4 OF THE 8 PIECES ARE LIT', C.green)
  );

  slices = ordered.map(n => slices[n - 1]);
  eighths = [];
  barLab = joinedLab;

  // 25: four eighths is exactly one half.

  const halfMark = line(
    [CX, BAR_Y - BAR_H / 2 - 0.12, 0],
    [CX, BAR_Y + BAR_H / 2 + 0.12, 0],
    C.amber,
    3
  );

  const halfLab = txt(
    'half',
    19,
    C.amber,
    [CX - BAR_W / 4, BAR_Y - 0.43, 0]
  );

  const otherHalf = txt(
    'other half',
    17,
    C.muted,
    [CX + BAR_W / 4, BAR_Y - 0.43, 0]
  );

  await until(S(25));
  await play(
    new M.Create(halfMark),
    new M.FadeIn(halfLab),
    new M.FadeIn(otherHalf),
    ...fbox([
      ['4/8 = 1/2', C.amber],
      ['exactly half', C.green]
    ], C.green),
    ...say('FOUR EIGHTHS = ONE HALF', C.green)
  );

  // 26: one half is fifty percent.

  await until(S(26));
  await play(
    new M.Transform(
      halfLab,
      txt(
        '50%',
        21,
        C.green,
        [CX - BAR_W / 4, BAR_Y - 0.43, 0],
        true
      )
    ),
    new M.Transform(
      otherHalf,
      txt(
        '50%',
        19,
        C.muted,
        [CX + BAR_W / 4, BAR_Y - 0.43, 0],
        true
      )
    ),
    ...fbox([
      ['4/8 = 1/2', C.ink],
      ['= 50%', C.green]
    ], C.green),
    ...say('50 PERCENT', C.green)
  );

  // 27: winning is as likely as not.

  await until(S(27));
  await play(
    new M.Indicate(halfMark, { color: C.amber }),
    ...fbox([
      ['win:   50%', C.green],
      ['lose:  50%', C.muted]
    ], C.green),
    ...say('AS LIKELY AS NOT', C.green)
  );

  // 28: a second event, the tile is blue.
  // Restore the single row before drawing the new event ring.

  await until(S(28));
  await play(
    new M.FadeOut(ring),
    new M.FadeOut(frame),
    new M.FadeOut(halfMark),
    new M.FadeOut(halfLab),
    new M.FadeOut(otherHalf),
    new M.FadeOut(whole),
    new M.FadeOut(barLab),
    ...fade(slices),
    ...normalRow(),
    ...fbox([
      ['new rule', C.muted],
      ['the tile is blue', BLUE]
    ], BLUE),
    ...say('NEW EVENT: THE TILE IS BLUE', BLUE)
  );

  slices = [];
  whole = null;
  barLab = null;

  // 29: ring around tiles 1, 2, 3, 4 and 5.

  ring = ringFor(BLUES, ROW_Y, BLUE);

  await until(S(29));
  await play(
    ...arrange(BLUES, false, true),
    new M.Create(ring),
    ...fbox([
      ['event: blue', BLUE],
      ['{1,2,3,4,5}', C.ink]
    ], BLUE),
    ...say('RING AROUND THE 5 BLUE TILES', BLUE)
  );

  // 30: five tiles out of eight.

  slices = D.map((_, k) =>
    segment(k, k < 5, true, BLUE)
  );

  whole = barFrame();

  barLab = barText(
    '5 of 8 equal pieces',
    BLUE
  );

  await until(S(30));
  await play(
    ...appear(slices),
    new M.Create(whole),
    new M.FadeIn(barLab),
    ...fbox([
      ['inside ring = 5', BLUE],
      ['all tiles   = 8', C.ink]
    ], BLUE),
    ...say('5 OUT OF 8 TILES', BLUE)
  );

  // 31: probability of blue is five eighths.

  await until(S(31));
  await play(
    ...fracBox(5, 8, 'blue', BLUE),
    ...say('PROBABILITY OF BLUE = 5/8', BLUE)
  );

  // 32: five times twelve and a half percent.

  let percentLabels = D.map((_, k) =>
    txt(
      '12.5%',
      15,
      k < 5 ? BLUE : C.muted,
      [joinedX(k), BAR_Y - 0.43, 0],
      true
    )
  );

  await until(S(32));
  await play(
    lag(
      percentLabels.map(t => new M.FadeIn(t)),
      1.5,
      0.12
    ),
    lag(
      slices.slice(0, 5).map(s =>
        new M.Indicate(s, { color: BLUE })
      ),
      3.2,
      0.35
    ),
    ...fbox([
      ['5 × 12.5%', C.ink],
      ['= 62.5%', BLUE]
    ], BLUE),
    ...say('BLUE: 62.5 PERCENT', BLUE)
  );

  // 33: blue is a little more likely than not.

  const midpoint = new M.DashedLine({
    start: [CX, BAR_Y - BAR_H / 2 - 0.11, 0],
    end: [CX, BAR_Y + BAR_H / 2 + 0.18, 0],
    color: C.amber
  });

  const midpointLab = txt(
    '50%',
    15,
    C.amber,
    [CX, BAR_Y - 0.45, 0],
    true
  );

  await until(S(33));
  await play(
    ...fade(percentLabels),
    new M.Create(midpoint),
    new M.FadeIn(midpointLab),
    ...say('MORE THAN HALF', C.green)
  );

  percentLabels = [];

  // 34: both examples use the same counting process.
  // Count the outcomes inside the ring, then all the outcomes.

  frame = sampleFrame();

  await until(S(34));
  await play(
    new M.FadeOut(midpoint),
    new M.FadeOut(midpointLab),
    new M.Create(frame),
    lag([
      new M.Indicate(ring, { color: BLUE }),
      new M.Indicate(frame, { color: C.ink })
    ], 3.3, 0.9),
    ...fbox([
      ['even: 4 out of 8', C.green],
      ['blue: 5 out of 8', BLUE],
      ['inside ÷ all', C.amber]
    ], C.amber),
    ...say('COUNT INSIDE, COMPARE WITH ALL', C.amber)
  );

  // 35: introduce the one-line shortcut.

  await until(S(35));
  await play(
    ...fbox([
      ['probability of event', C.ink],
      ['= ?', C.amber]
    ]),
    ...say('THE SHORT VERSION')
  );

  // 36: general probability rule for equally likely outcomes.

  await until(S(36));
  await play(
    ...fbox([
      ['probability of event =', C.ink],
      ['outcomes in event', C.green],
      ['÷ all outcomes', C.amber]
    ], C.cyan),
    ...say('COUNT IN EVENT ÷ COUNT OF ALL')
  );

  // 37: everyday words.
  // Highlight the numerator group first, then the denominator.

  await until(S(37));
  await play(
    lag([
      new M.Indicate(ring, { color: BLUE }),
      new M.Indicate(frame, { color: C.ink })
    ], 3.1, 0.85),
    ...fbox([
      ['tiles in the ring', C.green],
      ['÷ all the tiles', C.amber],
      ['example: 5 ÷ 8', BLUE]
    ], C.cyan),
    ...say('TILES IN RING ÷ ALL TILES')
  );

  // 38: two special events at the ends of the probability scale.

  await until(S(38));
  await play(
    new M.FadeOut(ring),
    new M.FadeOut(frame),
    new M.FadeOut(whole),
    new M.FadeOut(barLab),
    ...fade(slices),
    ...normalRow(),
    ...fbox([
      ['two special events', C.ink],
      ['impossible: 0', C.muted],
      ['sure:       1', C.green]
    ]),
    ...say('CHECK THE TWO EXTREMES', C.violet)
  );

  slices = [];
  whole = null;
  barLab = null;

  // 39: the event "number is nine".
  // There is no ninth tile; the empty ring contains no outcomes.

  const EMPTY_Y = P ? -2.65 : -1.4;

  const emptyRing = eventRing(
    CX,
    EMPTY_Y,
    2.45,
    1.05,
    C.violet
  );

  const emptyLab = txt(
    'No tiles',
    20,
    C.muted,
    [CX, EMPTY_Y, 0]
  );

  const impossibleLab = txt(
    'number = 9',
    18,
    C.violet,
    [CX, EMPTY_Y - 0.79, 0],
    true
  );

  await until(S(39));
  await play(
    ...arrange([], false, true),
    new M.Create(emptyRing),
    new M.FadeIn(emptyLab),
    new M.FadeIn(impossibleLab),
    ...fbox([
      ['number is 9', C.violet],
      ['0 ÷ 8 = 0', C.ink],
      ['impossible', C.amber]
    ], C.violet),
    ...say('NO WINNING OUTCOMES: IMPOSSIBLE', C.violet)
  );

  // 40: the sure event contains all eight possible outcomes.

  ring = ringFor(ALL, ROW_Y, C.green);

  slices = D.map((_, k) =>
    segment(k, true, true, C.green)
  );

  whole = barFrame();

  barLab = barText(
    '1 whole chance',
    C.green
  );

  await until(S(40));
  await play(
    new M.FadeOut(emptyRing),
    new M.FadeOut(emptyLab),
    new M.FadeOut(impossibleLab),
    ...arrange(ALL, false, false),
    new M.Create(ring),
    lag(
      slices.map(s => new M.FadeIn(s)),
      1.6,
      0.12
    ),
    new M.Create(whole),
    new M.FadeIn(barLab),
    ...fbox([
      ['number from 1 to 8', C.ink],
      ['8 ÷ 8 = 1', C.green],
      ['sure', C.green]
    ], C.green),
    ...say('ALL OUTCOMES: SURE', C.green)
  );

  // 41: all other events lie between zero and one.

  const AX_W = BAR_W - 0.35;
  const AX_L = CX - AX_W / 2;
  const AX_R = CX + AX_W / 2;
  const AX_Y = BAR_Y;

  const probX = v => AX_L + v * AX_W;

  const axis = line(
    [AX_L, AX_Y, 0],
    [AX_R, AX_Y, 0],
    C.muted,
    3
  );

  const axisTicks = Array.from(
    { length: 9 },
    (_, k) => line(
      [probX(k / 8), AX_Y - 0.08, 0],
      [probX(k / 8), AX_Y + 0.08, 0],
      C.muted,
      k === 0 || k === 8 ? 3 : 1
    )
  );

  const zeroLab = txt(
    '0',
    20,
    C.ink,
    [AX_L, AX_Y - 0.35, 0],
    true
  );

  const oneLab = txt(
    '1',
    20,
    C.ink,
    [AX_R, AX_Y - 0.35, 0],
    true
  );

  const neverLab = txt(
    'impossible',
    16,
    C.muted,
    [AX_L + 0.3, AX_Y - 0.7, 0]
  );

  const sureLab = txt(
    'sure',
    17,
    C.green,
    [AX_R - 0.12, AX_Y - 0.7, 0]
  );

  const rangeLine = line(
    [AX_L, AX_Y, 0],
    [AX_R, AX_Y, 0],
    C.green,
    4
  );

  function axisMark(v, s, color, dy) {
    const dot = new M.Dot({
      point: [probX(v), AX_Y, 0],
      radius: 0.09,
      color
    });

    const halo = new M.Dot({
      point: [probX(v), AX_Y, 0],
      radius: 0.18,
      color
    });

    halo.setFill(color, 0.14);

    const lab = txt(
      s,
      16,
      color,
      [probX(v), AX_Y + dy, 0],
      true
    );

    return new M.VGroup(halo, dot, lab);
  }

  const evenMark = axisMark(
    0.5,
    '4/8',
    C.green,
    0.34
  );

  const blueMark = axisMark(
    0.625,
    '5/8',
    BLUE,
    0.7
  );

  const axisObjects = [
    axis,
    ...axisTicks,
    rangeLine,
    zeroLab,
    oneLab,
    neverLab,
    sureLab,
    evenMark,
    blueMark
  ];

  await until(S(41));
  await play(
    new M.FadeOut(ring),
    new M.FadeOut(whole),
    new M.FadeOut(barLab),
    ...fade(slices),
    new M.Create(axis),
    new M.Create(rangeLine),
    ...axisTicks.map(t => new M.Create(t)),
    new M.FadeIn(zeroLab),
    new M.FadeIn(oneLab),
    new M.FadeIn(neverLab),
    new M.FadeIn(sureLab),
    new M.FadeIn(evenMark),
    new M.FadeIn(blueMark),
    ...fbox([
      ['0 ≤ probability ≤ 1', C.green],
      ['even: 4/8', C.green],
      ['blue: 5/8', BLUE]
    ], C.green),
    ...say('EVERY PROBABILITY IS FROM 0 TO 1', C.green)
  );

  slices = [];
  whole = null;
  barLab = null;

  // 42: turn a real-world question into a group we can count.

  ring = ringFor(EVEN, WIN_Y, C.green);

  const coffeeAgain = coffeeAt([CX, P ? -3.0 : -1.85, 0]);

  await until(S(42));
  await play(
    ...fade(axisObjects),
    ...arrange(EVEN, true, true),
    new M.Create(ring),
    new M.FadeIn(coffeeAgain),
    ...fbox([
      ['question: do I win?', C.amber],
      ['event: {2,4,6,8}', C.green],
      ['chance: 4/8', C.ink]
    ], C.green),
    ...say('QUESTION → RULE → COUNT', C.green)
  );

  // 43: common trap.
  // Simple counting works only if the outcomes are equally likely.

  await until(S(43));
  await play(
    new M.FadeOut(coffeeAgain),
    new M.FadeOut(ring),
    ...normalRow(),
    lag(
      tiles.map(t =>
        new M.Indicate(t, { color: C.amber })
      ),
      3.0,
      0.16
    ),
    ...fbox([
      ['counting rule', C.ink],
      ['ONLY when outcomes', C.amber],
      ['are equally likely', C.amber]
    ], C.amber),
    ...say('CHECK THAT CHANCES ARE EQUAL', C.amber)
  );

  // 44: hypothetical unfair bag.
  // Tile eight is drawn at twice its normal linear size.
  // The other seven shift slightly to leave it enough room.
  // This is explicitly a counterfactual, not a change to chapter data.

  const unfairPos = k => [
    CX + (
      k === 7
        ? 3.1
        : -3.35 + k * 0.85
    ) * SP,
    ROW_Y - 0.08,
    0
  ];

  const unfairLab = txt(
    'Imagine: a much bigger tile 8',
    P ? 19 : 18,
    C.amber,
    [CX, ROW_Y - 1.25, 0]
  );

  const bigHalo = outline(
    unfairPos(7)[0],
    unfairPos(7)[1],
    TW * 2 + 0.21,
    TW * 2 + 0.21,
    C.amber,
    3
  );

  await until(S(44));
  await play(
    ...tiles.map((t, k) =>
      new M.Transform(
        t,
        tile(
          D[k],
          unfairPos(k),
          k === 7 ? 'bright' : 'normal',
          k === 7 ? TW * 2 : TW
        )
      )
    ),
    new M.Create(bigHalo),
    new M.FadeIn(unfairLab),
    ...fbox([
      ['imagine tile 8', C.amber],
      ['is much bigger', C.ink],
      ['easier to find', C.muted]
    ], C.amber),
    ...say('WHAT IF TILE 8 HAS AN ADVANTAGE?', C.amber)
  );

  // 45: unequal outcomes cannot be handled by simple counting.
  // Do not invent numerical probabilities for the unfair bag.

  const unknown = D.map((_, k) =>
    txt(
      '?',
      21,
      C.amber,
      [unfairPos(k)[0], ROW_Y - 1.85, 0],
      true
    )
  );

  await until(S(45));
  await play(
    lag(
      unknown.map(t => new M.FadeIn(t)),
      1.6,
      0.1
    ),
    new M.Indicate(bigHalo, { color: C.amber }),
    ...fbox([
      ['unequal chances', C.amber],
      ['counting alone', C.ink],
      ['is not enough', C.amber]
    ], C.amber),
    ...say('UNEQUAL CHANCES: COUNTING FAILS', C.amber)
  );

  // 46: return to the original fair bag.
  // All eight tiles are once again identical in size and feel.

  const equalSigns = D.slice(1).map((_, k) =>
    txt(
      '=',
      17,
      C.green,
      [
        (colx(k) + colx(k + 1)) / 2,
        ROW_Y + 0.63,
        0
      ],
      true
    )
  );

  await until(S(46));
  await play(
    new M.FadeOut(bigHalo),
    new M.FadeOut(unfairLab),
    ...fade(unknown),
    ...normalRow(),
    ...appear(equalSigns),
    ...fbox([
      ['original fair bag', C.green],
      ['each chance = 1/8', C.ink],
      ['counting works', C.green]
    ], C.green),
    ...say('FIRST CHECK: EQUALLY LIKELY?', C.green)
  );

  // 47: preview the outcomes outside the event ring.
  // No complement formula is taught yet.

  ring = ringFor(EVEN, WIN_Y, C.green);

  const outsideMarks = ODD.map(n =>
    outline(
      colx(n - 1),
      LOSE_Y,
      TW + 0.19,
      TW + 0.19,
      C.violet,
      2
    )
  );

  await until(S(47));
  await play(
    ...fade(equalSigns),
    ...arrange(EVEN, true, false),
    new M.Create(ring),
    lag(
      outsideMarks.map(r => new M.Create(r)),
      1.5,
      0.2
    ),
    ...fbox([
      ['next lesson', C.violet],
      ['outside the ring', C.ink]
    ], C.violet),
    ...say('NEXT: WHAT IS OUTSIDE THE RING?', C.violet)
  );

  // 48: final takeaway.
  // Show the event, the full sample space and its probability.
  // The four winning pieces occupy exactly half of the chance bar.

  frame = sampleFrame(true);

  slices = D.map((_, k) =>
    segment(k, k < 4, true, C.green)
  );

  whole = barFrame();

  barLab = barText(
    '4 winning shares out of 8',
    C.green
  );

  const finalFraction = txt(
    '4/8 = 1/2 = 50%',
    P ? 21 : 20,
    C.green,
    [CX, BAR_Y - 0.48, 0],
    true
  );

  await until(S(48));
  await play(
    ...fade(outsideMarks),
    ...arrange(EVEN, true, true),
    new M.Create(frame),
    lag(
      slices.map(s => new M.FadeIn(s)),
      1.5,
      0.12
    ),
    new M.Create(whole),
    new M.FadeIn(barLab),
    new M.FadeIn(finalFraction),
    ...fbox([
      ['event = group of outcomes', C.green],
      ['probability = its share', C.ink],
      ['of equally likely outcomes', C.amber]
    ], C.green),
    ...say('EVENT = A GROUP OF OUTCOMES', C.green)
  );

  await until(S(48) + 3.0);
  await play(
    new M.Indicate(ring, { color: C.green }),
    new M.Indicate(finalFraction, { color: C.amber }),
    ...say('PROBABILITY = ITS SHARE OF ALL', C.green)
  );

  await until(E(48));
}

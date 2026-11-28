// lesson 4.3.4
// Expected value: the long-run mean and the balance point of chance.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback not runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data.
  const VALUES = [0, 2, 4];
  const PROBS = [0.25, 0.50, 0.25];
  const FRACTIONS = ['1/4', '1/2', '1/4'];
  const COUNTS = [25, 50, 25];
  const PRODUCTS = [0, 1, 1];

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';

  const COL = [GREY, BLUE, BLUE, GOLD];
  const PAYCOL = [GREY, BLUE, GOLD];

  // Laptop + phone layout, consistent with preceding lessons.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const BASE = P ? -4.2 : -2.35;
  const SP = P ? 2.05 : 2.10;
  const MAINY = P ? -0.65 : -0.35;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o));

  // ----------------------------------------------------------
  // Shared drawing helpers.
  // ----------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(String(s), size, color, mono);

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);
    return t;
  }

  function line(a, b, color = C.muted, sw = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: sw
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function rect(w, h, x, y, color, opacity = 0.12, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(r, x, y, color, opacity = 0, sw = 2) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function outline(w, h, x, y, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.moveTo([x, y, 0]);
    return r;
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);

    const maxw = P ? FW - 1.1 : 6.5;

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);
    return p;
  }

  function arrow(a, b, color = C.cyan, sw = 3, tip = 0.16) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);

    const ux = dx / d;
    const uy = dy / d;

    const p1 = [
      b[0] - ux * tip - uy * tip * 0.55,
      b[1] - uy * tip + ux * tip * 0.55,
      0
    ];

    const p2 = [
      b[0] - ux * tip + uy * tip * 0.55,
      b[1] - uy * tip - ux * tip * 0.55,
      0
    ];

    return new M.VGroup(
      line(a, b, color, sw),
      line(b, p1, color, sw),
      line(b, p2, color, sw)
    );
  }

  // ----------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ----------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

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

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

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
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 5.0;
    const maxh = P ? 1.9 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);
    g.moveTo(BOXP);

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

  // ----------------------------------------------------------
  // Gold token coins: same appearance as preceding lessons.
  // ----------------------------------------------------------

  function coin(x, y, r = 0.19) {
    const glow = circle(
      r * 1.45,
      x, y,
      GOLD,
      0.11,
      0
    );

    const face = circle(
      r,
      x, y,
      GOLD,
      0.88,
      2
    );

    const rim = circle(
      r * 0.73,
      x, y,
      '#FFF0B3',
      0,
      1
    );

    const mark = line(
      [x, y - r * 0.35, 0],
      [x, y + r * 0.35, 0],
      '#FFF0B3',
      2
    );

    return new M.VGroup(glow, face, rim, mark);
  }

  function coins(n, x, y, r = 0.17) {
    if (n === 0) {
      return txt(
        '0',
        25,
        C.muted,
        x,
        y,
        true
      );
    }

    const gap = r * 2.65;

    return new M.VGroup(
      ...Array.from({ length: n }, (_, k) =>
        coin(
          x + (k - (n - 1) / 2) * gap,
          y,
          r
        )
      )
    );
  }

  // Lightweight coin for the 200-token animation.
  function smallCoin(x, y, r = 0.075) {
    const face = new M.Dot({
      point: [x, y, 0],
      radius: r,
      color: GOLD
    });

    face.setFill(GOLD, 0.92);

    return face;
  }

  // ----------------------------------------------------------
  // Spinner: four equal quarters.
  //
  // Grey:     upper right
  // Blue one: upper left
  // Blue two: lower left
  // Gold:     lower right
  // ----------------------------------------------------------

  function polar(cx, cy, r, a) {
    return [
      cx + r * Math.cos(a),
      cy + r * Math.sin(a),
      0
    ];
  }

  function sector(k, cx, cy, r) {
    const start = k * Math.PI / 2;
    const end = start + Math.PI / 2;

    const points = [[cx, cy, 0]];

    for (let j = 0; j <= 32; j++) {
      points.push(
        polar(
          cx,
          cy,
          r,
          start + (end - start) * j / 32
        )
      );
    }

    const s = new M.Polygon({
      vertices: points,
      color: C.card,
      strokeWidth: 2
    });

    s.setFill(COL[k], 0.87);
    return s;
  }

  function wheel(cx, cy, r, a = Math.PI / 12) {
    const slices = COL.map((_, k) =>
      sector(k, cx, cy, r)
    );

    const rim = circle(
      r + 0.015,
      cx,
      cy,
      C.ink,
      0,
      2.5
    );

    const needle = arrow(
      polar(cx, cy, r * 0.03, a),
      polar(cx, cy, r * 0.87, a),
      C.ink,
      4,
      r * 0.17
    );

    const hub = circle(
      r * 0.075,
      cx,
      cy,
      C.ink,
      1,
      1
    );

    return new M.VGroup(
      ...slices,
      rim,
      needle,
      hub
    );
  }

  // Simple owner icon.
  function person(x, y, color = C.ink, s = 1) {
    const head = circle(
      0.17 * s,
      x,
      y + 0.37 * s,
      color,
      1,
      1
    );

    const body = new M.Arc({
      radius: 0.31 * s,
      startAngle: 0,
      angle: Math.PI,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 1);
    body.moveTo([x, y - 0.02 * s, 0]);

    return new M.VGroup(head, body);
  }

  // ----------------------------------------------------------
  // 0. The booth owner has a question about money.
  // ----------------------------------------------------------

  const ownerWheel = wheel(
    CX - 1.05,
    P ? -0.45 : -0.38,
    P ? 1.35 : 1.20
  );

  const owner = person(
    CX + 1.65,
    P ? -0.60 : -0.42,
    C.ink,
    1.65
  );

  const ownerLabel = txt(
    'booth owner',
    18,
    C.muted,
    CX + 1.65,
    P ? -1.45 : -1.25
  );

  const moneyQuestion = txt(
    '?',
    39,
    GOLD,
    CX + 1.65,
    P ? 0.70 : 0.75,
    true
  );

  await until(S(0));
  await play(
    ...appear(
      ownerWheel,
      owner,
      ownerLabel,
      moneyQuestion
    ),
    ...say('WILL THE BOOTH MAKE TOKENS?', GOLD)
  );

  // ----------------------------------------------------------
  // 1. One round costs three tokens.
  // Will the booth make tokens or lose them?
  // ----------------------------------------------------------

  const entryY = P ? -2.95 : -2.14;

  const entryCoins = coins(
    3,
    CX,
    entryY,
    0.23
  );

  const entryLabel = txt(
    '3 tokens to play',
    19,
    GOLD,
    CX,
    entryY - 0.53
  );

  await until(S(1));
  await play(
    new M.FadeIn(entryCoins),
    new M.FadeIn(entryLabel),
    new M.Indicate(moneyQuestion, {
      color: C.amber
    }),
    ...say('ENTRY PRICE: 3 TOKENS', GOLD),
    ...fbox([
      ['income = 3 tokens', GOLD],
      'payout = ?',
      'profit or loss?'
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 2. Each spin pays zero, two or four.
  // ----------------------------------------------------------

  const colx = k => CX + (k - 1) * SP;

  function payoutCard(k, v, label, color) {
    const x = colx(k);
    const y = MAINY;
    const w = P ? 1.88 : 1.90;
    const h = P ? 2.05 : 1.72;

    const r = rect(
      w,
      h,
      x,
      y,
      color,
      0.09
    );

    const heading = txt(
      label,
      16,
      color,
      x,
      y + h / 2 - 0.28
    );

    const reward = coins(
      v,
      x,
      y,
      v === 4 ? 0.13 : 0.18
    );

    const bottom = txt(
      `${v} tokens`,
      19,
      C.ink,
      x,
      y - h / 2 + 0.29,
      true
    );

    return new M.VGroup(
      r,
      heading,
      reward,
      bottom
    );
  }

  const payoutCards = [
    payoutCard(0, 0, 'GREY', GREY),
    payoutCard(1, 2, 'EITHER BLUE', BLUE),
    payoutCard(2, 4, 'GOLD', GOLD)
  ];

  await until(S(2));
  await play(
    ...fade(
      ownerWheel,
      owner,
      ownerLabel,
      moneyQuestion,
      entryCoins,
      entryLabel
    ),
    new M.LaggedStart(
      payoutCards.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.22,
        runTime: 1.5
      }
    ),
    ...say('POSSIBLE PAYOUTS: 0, 2, 4'),
    ...fbox([
      'one spin pays',
      ['0, 2 or 4 tokens', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 3. One spin tells us almost nothing.
  // Imagine many spins.
  // ----------------------------------------------------------

  const manyLabel = tag(
    'MANY SPINS',
    C.green,
    CX,
    P ? -2.55 : -1.95,
    20
  );

  await until(S(3));
  await play(
    new M.LaggedStart(
      payoutCards.map(c =>
        new M.Indicate(c, {
          color: C.amber
        })
      ),
      {
        lagRatio: 0.25,
        runTime: 1.8
      }
    ),
    new M.FadeIn(manyLabel),
    ...say('ONE SPIN IS NOT ENOUGH', C.violet),
    ...fbox([
      'one result can vary',
      ['look at many spins', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 100-player picture.
  //
  // One dot = one player.
  // Grey group: 25 dots.
  // Blue group: 50 dots.
  // Gold group: 25 dots.
  //
  // This is an idealised long-run illustration,
  // not a promise of exact counts in 100 real spins.
  // ----------------------------------------------------------

  const PLAYER_Y = P ? -0.65 : -0.38;
  const PLAYER_STEP = P ? 0.255 : 0.242;
  const PLAYER_R = P ? 0.085 : 0.079;

  const PLAYER_CX = [
    CX - 2.28,
    CX,
    CX + 2.28
  ];

  const GROUP_COLS = [5, 10, 5];
  const GROUP_WIDTHS = [1.50, 2.83, 1.50];

  function playerPoint(k, j) {
    const cols = GROUP_COLS[k];
    const rows = COUNTS[k] / cols;

    const col = j % cols;
    const row = Math.floor(j / cols);

    return [
      PLAYER_CX[k] +
        (col - (cols - 1) / 2) * PLAYER_STEP,

      PLAYER_Y +
        ((rows - 1) / 2 - row) * PLAYER_STEP,

      0
    ];
  }

  function playerDot(k, j, color = C.muted, opacity = 0.7) {
    const d = new M.Dot({
      point: playerPoint(k, j),
      radius: PLAYER_R,
      color
    });

    d.setFill(color, opacity);
    return d;
  }

  function playerGroup(k, color = C.muted, opacity = 0.7) {
    return new M.VGroup(
      ...Array.from(
        { length: COUNTS[k] },
        (_, j) => playerDot(k, j, color, opacity)
      )
    );
  }

  const players = COUNTS.map((_, k) =>
    playerGroup(k)
  );

  const playerFrames = COUNTS.map((_, k) =>
    outline(
      GROUP_WIDTHS[k],
      P ? 1.55 : 1.46,
      PLAYER_CX[k],
      PLAYER_Y,
      C.muted
    )
  );

  const totalPlayers = tag(
    '100 PLAYERS',
    C.cyan,
    CX,
    P ? 0.95 : 0.91,
    20
  );

  const playerLegend = new M.VGroup(
    new M.Dot({
      point: [
        CX - 1.05,
        P ? -2.75 : -1.83,
        0
      ],
      radius: PLAYER_R,
      color: C.muted
    }),
    txt(
      '1 dot = 1 player',
      17,
      C.muted,
      CX + 0.12,
      P ? -2.75 : -1.83
    )
  );

  // ----------------------------------------------------------
  // 4. Picture one hundred players, each spinning once.
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    ...fade(payoutCards, manyLabel),
    ...clearBox(),
    new M.FadeIn(totalPlayers),
    new M.FadeIn(playerLegend),
    new M.LaggedStart(
      players.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.15,
        runTime: 1.5
      }
    ),
    ...say('100 PLAYERS · ONE SPIN EACH')
  );

  // ----------------------------------------------------------
  // 5-7. Colour the groups according to their outcomes.
  // ----------------------------------------------------------

  const playerCountLabels = COUNTS.map((n, k) =>
    txt(
      `≈ ${n}`,
      P ? 23 : 22,
      PAYCOL[k],
      PLAYER_CX[k],
      PLAYER_Y + 1.10,
      true
    )
  );

  const playerRewardLabels = VALUES.map((v, k) =>
    txt(
      `${v} each`,
      P ? 18 : 17,
      PAYCOL[k],
      PLAYER_CX[k],
      PLAYER_Y - 1.08,
      true
    )
  );

  function colouredFrame(k) {
    return outline(
      GROUP_WIDTHS[k],
      P ? 1.55 : 1.46,
      PLAYER_CX[k],
      PLAYER_Y,
      PAYCOL[k]
    );
  }

  const groupFrames = COUNTS.map((_, k) =>
    colouredFrame(k)
  );

  // 5. About 25 grey outcomes, paying zero each.

  await until(S(5));
  await play(
    new M.Transform(
      players[0],
      playerGroup(0, GREY, 0.95),
      { runTime: 0.9 }
    ),
    new M.Create(groupFrames[0]),
    ...appear(
      playerCountLabels[0],
      playerRewardLabels[0]
    ),
    ...say('ABOUT 25 GREY · 0 EACH', GREY),
    ...fbox([
      '100 × 1/4 = 25',
      ['about 25 grey results', GREY]
    ], GREY)
  );

  // 6. About 50 blue outcomes, paying two each.

  await until(S(6));
  await play(
    new M.Transform(
      players[1],
      playerGroup(1, BLUE, 0.95),
      { runTime: 0.9 }
    ),
    new M.Create(groupFrames[1]),
    ...appear(
      playerCountLabels[1],
      playerRewardLabels[1]
    ),
    ...say('ABOUT 50 BLUE · 2 EACH', BLUE),
    ...fbox([
      '100 × 1/2 = 50',
      ['about 50 blue results', BLUE]
    ], BLUE)
  );

  // 7. About 25 gold outcomes, paying four each.

  await until(S(7));
  await play(
    new M.Transform(
      players[2],
      playerGroup(2, GOLD, 0.95),
      { runTime: 0.9 }
    ),
    new M.Create(groupFrames[2]),
    ...appear(
      playerCountLabels[2],
      playerRewardLabels[2]
    ),
    ...say('ABOUT 25 GOLD · 4 EACH', GOLD),
    ...fbox([
      '100 × 1/4 = 25',
      ['about 25 gold results', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 8. Add up all the tokens paid.
  // ----------------------------------------------------------

  const idealisedLabel = tag(
    'LONG-RUN MODEL: 25 · 50 · 25',
    C.violet,
    CX,
    P ? -3.55 : -2.32,
    16
  );

  await until(S(8));
  await play(
    ...fade(totalPlayers, playerLegend),
    new M.FadeIn(idealisedLabel),
    ...say('ADD ALL THE TOKENS PAID', C.amber),
    ...fbox([
      'players × payout',
      ['find each group total', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Token heaps.
  //
  // Blue group produces 100 individual gold token dots.
  // Gold group produces another 100.
  // Grey group produces no tokens.
  // ----------------------------------------------------------

  const HEAPY = P ? -1.05 : -0.55;
  const HEAPSTEP = P ? 0.208 : 0.178;
  const HEAPR = P ? 0.070 : 0.061;

  const HEAPX = [
    CX - 2.28,
    CX - 0.65,
    CX + 1.75
  ];

  function heapPoint(cx, cy, j) {
    const col = j % 10;
    const row = Math.floor(j / 10);

    return [
      cx + (col - 4.5) * HEAPSTEP,
      cy + (4.5 - row) * HEAPSTEP,
      0
    ];
  }

  function tokenHeap(cx, cy, n = 100) {
    return new M.VGroup(
      ...Array.from({ length: n }, (_, j) => {
        const p = heapPoint(cx, cy, j);

        return smallCoin(
          p[0],
          p[1],
          HEAPR
        );
      })
    );
  }

  const emptyHeap = txt(
    '0',
    36,
    C.muted,
    HEAPX[0],
    HEAPY,
    true
  );

  let blueHeap = tokenHeap(
    HEAPX[1],
    HEAPY
  );

  let goldHeap = tokenHeap(
    HEAPX[2],
    HEAPY
  );

  const heapHeadingY = P ? 0.70 : 0.80;
  const heapLabelY = P ? -2.46 : -1.76;

  const heapHeadings = [
    txt(
      '25 × 0',
      20,
      GREY,
      HEAPX[0],
      heapHeadingY,
      true
    ),
    txt(
      '50 × 2',
      20,
      BLUE,
      HEAPX[1],
      heapHeadingY,
      true
    ),
    txt(
      '25 × 4',
      20,
      GOLD,
      HEAPX[2],
      heapHeadingY,
      true
    )
  ];

  const heapTotals = [
    txt(
      '0 tokens',
      17,
      C.muted,
      HEAPX[0],
      heapLabelY,
      true
    ),
    txt(
      '100 tokens',
      18,
      GOLD,
      HEAPX[1],
      heapLabelY,
      true
    ),
    txt(
      '100 tokens',
      18,
      GOLD,
      HEAPX[2],
      heapLabelY,
      true
    )
  ];

  // ----------------------------------------------------------
  // 9. Twenty-five times zero is zero.
  // ----------------------------------------------------------

  await until(S(9));
  await play(
    ...fade(
      players,
      groupFrames,
      playerCountLabels,
      playerRewardLabels,
      idealisedLabel
    ),
    ...appear(
      heapHeadings[0],
      emptyHeap,
      heapTotals[0]
    ),
    ...say('25 PLAYERS × 0 TOKENS', GREY),
    ...fbox([
      ['25 × 0 = 0', GREY]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 10. Fifty times two is one hundred.
  // ----------------------------------------------------------

  await until(S(10));
  await play(
    ...appear(
      heapHeadings[1],
      heapTotals[1]
    ),
    new M.FadeIn(blueHeap, {
      runTime: 0.85
    }),
    ...say('50 PLAYERS × 2 TOKENS', BLUE),
    ...fbox([
      '25 × 0 = 0',
      ['50 × 2 = 100', BLUE]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 11. Twenty-five times four is one hundred.
  // ----------------------------------------------------------

  await until(S(11));
  await play(
    ...appear(
      heapHeadings[2],
      heapTotals[2]
    ),
    new M.FadeIn(goldHeap, {
      runTime: 0.85
    }),
    ...say('25 PLAYERS × 4 TOKENS', GOLD),
    ...fbox([
      '25 × 0 = 0',
      '50 × 2 = 100',
      ['25 × 4 = 100', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 12. Zero plus one hundred plus one hundred is two hundred.
  // Gather the two token heaps into one 200-token picture.
  // ----------------------------------------------------------

  const combinedY = P ? -0.88 : -0.48;

  const combinedLeft = tokenHeap(
    CX - 1.07,
    combinedY
  );

  const combinedRight = tokenHeap(
    CX + 1.07,
    combinedY
  );

  const total200 = tag(
    '200 TOKENS IN TOTAL',
    GOLD,
    CX,
    P ? -2.72 : -1.93,
    20
  );

  const heapLegend = txt(
    'Each gold dot is one token',
    16,
    C.muted,
    CX,
    P ? 0.82 : 0.85
  );

  await until(S(12));
  await play(
    ...fade(
      emptyHeap,
      heapHeadings,
      heapTotals
    ),
    new M.Transform(
      blueHeap,
      combinedLeft,
      {
        pathArc: -0.25,
        runTime: 1.1
      }
    ),
    new M.Transform(
      goldHeap,
      combinedRight,
      {
        pathArc: 0.25,
        runTime: 1.1
      }
    ),
    ...appear(total200, heapLegend),
    ...say('TOTAL PAYOUT = 200 TOKENS', GOLD),
    ...fbox([
      '0 + 100 + 100',
      ['= 200 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 13. Share the 200 tokens fairly between 100 players.
  //
  // Make a 10 × 10 grid of player places.
  // The two live 100-token heaps transform into
  // one token on either side of each player's place.
  //
  // No token is added or removed.
  // ----------------------------------------------------------

  const PAIRX = P ? 0.57 : 0.54;
  const PAIRY = P ? 0.30 : 0.235;
  const PAIRCY = P ? -1.05 : -0.48;
  const PAIRR = P ? 0.066 : 0.053;
  const PAIRSEP = P ? 0.125 : 0.105;

  function pairPoint(j) {
    const col = j % 10;
    const row = Math.floor(j / 10);

    return [
      CX + (col - 4.5) * PAIRX,
      PAIRCY + (4.5 - row) * PAIRY,
      0
    ];
  }

  function pairedCoins(side) {
    return new M.VGroup(
      ...Array.from({ length: 100 }, (_, j) => {
        const p = pairPoint(j);

        return smallCoin(
          p[0] + side * PAIRSEP,
          p[1],
          PAIRR
        );
      })
    );
  }

  const pairSlots = new M.VGroup(
    ...Array.from({ length: 100 }, (_, j) => {
      const p = pairPoint(j);

      const r = new M.RoundedRectangle({
        width: PAIRX * 0.84,
        height: PAIRY * 0.82,
        cornerRadius: 0.035,
        color: C.muted,
        strokeWidth: 0.8
      });

      r.setFill(C.card, 0.08);
      r.moveTo(p);

      return r;
    })
  );

  const shareTitle = txt(
    '100 equal player places',
    18,
    C.green,
    CX,
    P ? 0.80 : 0.89
  );

  await until(S(13));
  await play(
    ...fade(total200, heapLegend),
    new M.FadeIn(pairSlots),
    new M.Transform(
      blueHeap,
      pairedCoins(-1),
      {
        pathArc: -0.25,
        runTime: 2.1
      }
    ),
    new M.Transform(
      goldHeap,
      pairedCoins(1),
      {
        pathArc: 0.25,
        runTime: 2.1
      }
    ),
    new M.FadeIn(shareTitle),
    ...say('SHARE EQUALLY AMONG 100 PLAYERS', C.green),
    ...fbox([
      '200 tokens',
      '100 players',
      ['share equally', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 14. Two hundred divided by one hundred is two.
  // ----------------------------------------------------------

  const twoEach = tag(
    '2 TOKENS EACH',
    GOLD,
    CX,
    P ? -3.12 : -2.02,
    21
  );

  await until(S(14));
  await play(
    new M.FadeIn(twoEach, {
      runTime: 0.6
    }),
    ...say('200 ÷ 100 = 2', GOLD),
    ...fbox([
      '200 ÷ 100',
      ['= 2 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 15. On average, each spin pays two tokens.
  // Highlight several of the equal player places.
  // ----------------------------------------------------------

  const equalHighlights = [0, 11, 44, 55, 88, 99].map(j => {
    const p = pairPoint(j);

    return outline(
      PAIRX * 0.92,
      PAIRY * 0.91,
      p[0],
      p[1],
      GOLD
    );
  });

  await until(S(15));
  await play(
    new M.LaggedStart(
      equalHighlights.map(r => new M.Create(r)),
      {
        lagRatio: 0.10,
        runTime: 1.0
      }
    ),
    new M.Indicate(twoEach, {
      color: GOLD
    }),
    ...say('AVERAGE PAYOUT = 2 TOKENS', C.green),
    ...fbox([
      'long-run average',
      ['2 tokens per spin', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 16. Notice that the hundred players cancel out.
  //
  // (25 × 0 + 50 × 2 + 25 × 4) / 100
  //
  // is the same as
  //
  // 0 × 25/100 + 2 × 50/100 + 4 × 25/100.
  // ----------------------------------------------------------

  const cancelY = P ? -0.65 : -0.45;

  const numerator = txt(
    '25 × 0 + 50 × 2 + 25 × 4',
    P ? 25 : 23,
    C.ink,
    CX,
    cancelY + 0.64,
    true,
    6.05
  );

  const fractionRule = line(
    [CX - 2.85, cancelY + 0.26, 0],
    [CX + 2.85, cancelY + 0.26, 0],
    C.muted,
    2
  );

  const denominator = txt(
    '100',
    27,
    C.violet,
    CX,
    cancelY - 0.14,
    true
  );

  const expandedMean = txt(
    '0 × 25/100 + 2 × 50/100 + 4 × 25/100',
    P ? 23 : 21,
    C.cyan,
    CX,
    cancelY - 1.12,
    true,
    6.05
  );

  const equalSign = txt(
    '=',
    24,
    C.muted,
    CX,
    cancelY - 0.66,
    true
  );

  await until(S(16));
  await play(
    ...fade(
      blueHeap,
      goldHeap,
      pairSlots,
      shareTitle,
      twoEach,
      equalHighlights
    ),
    ...appear(
      numerator,
      denominator,
      equalSign,
      expandedMean
    ),
    new M.Create(fractionRule),
    ...say('TURN PLAYER COUNTS INTO SHARES', C.violet),
    ...fbox([
      '25/100 = 1/4',
      '50/100 = 1/2',
      ['25/100 = 1/4', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 17. Use chances directly, with no players at all.
  // ----------------------------------------------------------

  const weightedY = P ? -0.80 : -0.45;
  const weightedW = P ? 1.90 : 1.93;
  const weightedH = P ? 3.25 : 2.65;

  function weightCard(k) {
    const x = colx(k);
    const v = VALUES[k];
    const color = PAYCOL[k];

    const frame = rect(
      weightedW,
      weightedH,
      x,
      weightedY,
      color,
      0.075
    );

    const payoutLabel = txt(
      `${v} tokens`,
      18,
      color,
      x,
      weightedY + weightedH / 2 - 0.30,
      true
    );

    const payout = coins(
      v,
      x,
      weightedY + 0.56,
      v === 4 ? 0.12 : 0.16
    );

    const times = txt(
      '×',
      23,
      C.muted,
      x,
      weightedY + 0.03,
      true
    );

    const chance = txt(
      FRACTIONS[k],
      25,
      C.cyan,
      x,
      weightedY - 0.42,
      true
    );

    const separator = line(
      [
        x - weightedW * 0.36,
        weightedY - 0.77,
        0
      ],
      [
        x + weightedW * 0.36,
        weightedY - 0.77,
        0
      ],
      C.muted,
      1.5
    );

    return new M.VGroup(
      frame,
      payoutLabel,
      payout,
      times,
      chance,
      separator
    );
  }

  const weightCards = VALUES.map((_, k) =>
    weightCard(k)
  );

  const weightedResults = PRODUCTS.map((v, k) =>
    txt(
      String(v),
      30,
      GOLD,
      colx(k),
      weightedY - weightedH / 2 + 0.30,
      true
    )
  );

  await until(S(17));
  await play(
    ...fade(
      numerator,
      fractionRule,
      denominator,
      equalSign,
      expandedMean
    ),
    new M.LaggedStart(
      weightCards.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.12,
        runTime: 1.4
      }
    ),
    ...say('A FASTER WAY: USE THE CHANCES', C.green),
    ...fbox([
      'payout × chance',
      ['no player count needed', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 18. Zero times one quarter gives zero.
  // ----------------------------------------------------------

  await until(S(18));
  await play(
    new M.Indicate(weightCards[0], {
      color: GREY
    }),
    new M.FadeIn(weightedResults[0]),
    ...say('ZERO × ONE QUARTER', GREY),
    ...fbox([
      ['0 × 1/4 = 0', GOLD]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 19. Two times one half gives one.
  // ----------------------------------------------------------

  await until(S(19));
  await play(
    new M.Indicate(weightCards[1], {
      color: BLUE
    }),
    new M.FadeIn(weightedResults[1]),
    ...say('TWO × ONE HALF', BLUE),
    ...fbox([
      '0 × 1/4 = 0',
      ['2 × 1/2 = 1', GOLD]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 20. Four times one quarter gives one.
  // ----------------------------------------------------------

  await until(S(20));
  await play(
    new M.Indicate(weightCards[2], {
      color: GOLD
    }),
    new M.FadeIn(weightedResults[2]),
    ...say('FOUR × ONE QUARTER', GOLD),
    ...fbox([
      '0 × 1/4 = 0',
      '2 × 1/2 = 1',
      ['4 × 1/4 = 1', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 21. Add the weighted contributions.
  // Zero plus one plus one makes two.
  // ----------------------------------------------------------

  const weightedTotal = tag(
    '0 + 1 + 1 = 2',
    GOLD,
    CX,
    P ? -3.35 : -2.29,
    21
  );

  await until(S(21));
  await play(
    new M.LaggedStart(
      weightedResults.map(t =>
        new M.Indicate(t, {
          color: GOLD
        })
      ),
      {
        lagRatio: 0.25,
        runTime: 1.7
      }
    ),
    new M.FadeIn(weightedTotal),
    ...say('ADD THE WEIGHTED PAYOUTS', C.amber),
    ...fbox([
      '0 × 1/4 + 2 × 1/2 + 4 × 1/4',
      '= 0 + 1 + 1',
      ['= 2 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 22. This long-run mean is called the expected value.
  // ----------------------------------------------------------

  await until(S(22));
  await play(
    new M.Indicate(weightedTotal, {
      color: C.green
    }),
    ...say('EXPECTED VALUE', C.green),
    ...fbox([
      ['expected value', C.green],
      'the long-run mean',
      ['2 tokens', GOLD]
    ], C.green)
  );

  // ----------------------------------------------------------
  // Seesaw picture.
  //
  // The payout line is a horizontal plank.
  // The chance bars are weights.
  //
  // 1/4 at zero
  // 1/2 at two
  // 1/4 at four
  //
  // Equal outside weights sit equally far from two.
  // The middle weight sits directly above the fulcrum.
  // ----------------------------------------------------------

  const PLANKY = P ? -3.2 : -1.15;
  const PLANKW = P ? 6.05 : 6.25;
  const PLANKH = P ? 0.19 : 0.16;

  const QH = P ? 1.55 : 0.93;
  const BW = P ? 0.84 : 0.76;

  const plotX = v =>
    CX - PLANKW / 2 + 0.65 +
    v / 4 * (PLANKW - 1.30);

  const barBase = PLANKY + PLANKH / 2;

  function makePlank() {
    const board = new M.Rectangle({
      width: PLANKW,
      height: PLANKH,
      color: C.ink,
      strokeWidth: 2
    });

    board.setFill(C.muted, 0.48);
    board.moveTo([CX, PLANKY, 0]);

    const ticks = [0, 1, 2, 3, 4].map(v => {
      const x = plotX(v);

      return new M.VGroup(
        line(
          [x, PLANKY - 0.08, 0],
          [x, PLANKY - 0.20, 0],
          C.muted,
          1.5
        ),
        txt(
          String(v),
          VALUES.includes(v) ? 20 : 16,
          VALUES.includes(v) ? C.ink : C.muted,
          x,
          PLANKY - 0.41,
          true
        )
      );
    });

    const unit = txt(
      'payout X (tokens)',
      17,
      C.muted,
      CX,
      P ? -5.45 : -2.78
    );

    return {
      board,
      ticks,
      unit
    };
  }

  function weightBar(v, p, label, color = C.cyan) {
    const x = plotX(v);
    const h = p * 4 * QH;

    const glow = new M.Rectangle({
      width: BW + 0.22,
      height: h + 0.04,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.10);
    glow.moveTo([
      x,
      barBase + h / 2,
      0
    ]);

    const b = new M.Rectangle({
      width: BW,
      height: h,
      color,
      strokeWidth: 2
    });

    b.setFill(color, 0.75);
    b.moveTo([
      x,
      barBase + h / 2,
      0
    ]);

    const lab = txt(
      label,
      P ? 23 : 21,
      color,
      x,
      barBase + h + 0.28,
      true
    );

    return {
      body: new M.VGroup(glow, b),
      label: lab,
      h
    };
  }

  function makeWeightBars(
    values = VALUES,
    probabilities = PROBS,
    fractions = FRACTIONS,
    color = C.cyan
  ) {
    return values.map((v, k) =>
      weightBar(
        v,
        probabilities[k],
        fractions[k],
        color
      )
    );
  }

  const barParts = bars => bars.flatMap(b => [
    b.body,
    b.label
  ]);

  const plankParts = p => [
    p.board,
    ...p.ticks,
    p.unit
  ];

  function fulcrum(v, color = C.amber) {
    const x = plotX(v);
    const top = PLANKY - PLANKH / 2;
    const h = P ? 1.10 : 0.75;
    const w = P ? 0.92 : 0.73;

    const triangle = new M.Polygon({
      vertices: [
        [x, top, 0],
        [x - w / 2, top - h, 0],
        [x + w / 2, top - h, 0]
      ],
      color,
      strokeWidth: 2
    });

    triangle.setFill(C.card, 0.95);

    const foot = line(
      [
        x - w / 2 - 0.14,
        top - h,
        0
      ],
      [
        x + w / 2 + 0.14,
        top - h,
        0
      ],
      color,
      3
    );

    const pivot = circle(
      0.08,
      x,
      top,
      color,
      1,
      2
    );

    // the tick number under the plank stays readable on top of the support
    const num = txt(String(v), 20, C.ink, x, PLANKY - 0.41, true);

    return new M.VGroup(
      triangle,
      foot,
      pivot,
      num
    );
  }

  let plank = makePlank();
  let bars = makeWeightBars();
  let support = fulcrum(2);

  // ----------------------------------------------------------
  // 23. Imagine the number line is a long plank.
  // ----------------------------------------------------------

  // a small playground seesaw above the plank, so the picture is clear
  const sawY = PLANKY + (P ? 2.1 : 1.45);
  const sawW = P ? 2.8 : 2.6, tilt = 0.22;
  const sawBoard = line([CX - sawW / 2, sawY - tilt, 0], [CX + sawW / 2, sawY + tilt, 0], C.ink, 5);
  const sawBase = new M.Polygon({
    vertices: [[CX, sawY, 0], [CX - 0.3, sawY - 0.55, 0], [CX + 0.3, sawY - 0.55, 0]],
    color: C.amber, strokeWidth: 2
  });
  sawBase.setFill(C.card, 0.95);
  const kidL = circle(0.2, CX - sawW / 2 + 0.25, sawY - tilt + 0.32, C.cyan, 0.8, 2);
  const kidR = circle(0.2, CX + sawW / 2 - 0.25, sawY + tilt + 0.32, C.violet, 0.8, 2);
  const seesaw = new M.VGroup(sawBase, sawBoard, kidL, kidR);

  await until(S(23));
  await play(
    ...fade(
      weightCards,
      weightedResults,
      weightedTotal
    ),
    ...clearBox(),
    new M.Create(plank.board),
    ...appear(plank.ticks, plank.unit),
    new M.FadeIn(seesaw),
    ...say('PICTURE A SEESAW'),
    ...fbox([
      'number line = plank',
      ['bars = weights', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 24. Each probability bar is a weight on the plank.
  // ----------------------------------------------------------

  await until(S(24));
  await play(
    new M.FadeOut(seesaw),
    new M.LaggedStart(
      bars.map(b => new M.FadeIn(b.body)),
      {
        lagRatio: 0.30,
        runTime: 2.0
      }
    ),
    ...appear(bars.map(b => b.label)),
    ...say('CHANCE BECOMES WEIGHT', C.violet),
    ...fbox([
      '0 carries 1/4',
      '2 carries 1/2',
      ['4 carries 1/4', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 25. Where must we support the plank?
  // Exactly at two.
  // ----------------------------------------------------------

  const pivotLine = dashed(
    [
      plotX(2),
      PLANKY + 0.12,
      0
    ],
    [
      plotX(2),
      barBase + 2 * QH + 0.12,
      0
    ],
    C.amber
  );

  const balanceTag = tag(
    'BALANCE POINT = 2',
    C.amber,
    CX,
    P ? -4.85 : -2.29,
    18
  );

  await until(S(25));
  await play(
    new M.FadeIn(support, {
      runTime: 0.85
    }),
    new M.Create(pivotLine),
    new M.FadeIn(balanceTag),
    ...say('HOLD THE PLANK AT TWO', C.amber),
    ...fbox([
      'equal weights',
      'equal distances',
      ['balance at 2', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 26. Expected value is the balance point of the bars.
  // ----------------------------------------------------------

  const distanceY = P ? -1.15 : -0.12;

  const leftDistance = arrow(
    [
      plotX(0) + 0.48,
      distanceY,
      0
    ],
    [
      plotX(2) - 0.49,
      distanceY,
      0
    ],
    C.amber,
    2.5,
    0.13
  );

  const rightDistance = arrow(
    [
      plotX(4) - 0.48,
      distanceY,
      0
    ],
    [
      plotX(2) + 0.49,
      distanceY,
      0
    ],
    C.amber,
    2.5,
    0.13
  );

  const distanceLabels = [
    txt(
      '2 away',
      15,
      C.amber,
      plotX(1),
      distanceY + 0.23
    ),
    txt(
      '2 away',
      15,
      C.amber,
      plotX(3),
      distanceY + 0.23
    )
  ];

  await until(S(26));
  await play(
    new M.Create(leftDistance),
    new M.Create(rightDistance),
    ...appear(distanceLabels),
    new M.Indicate(support, {
      color: C.amber
    }),
    ...say('EXPECTED VALUE = BALANCE POINT', C.green),
    ...fbox([
      ['expected value = 2', C.green],
      'the balance point'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 27. It is a weighted mean, like the café shifts.
  // ----------------------------------------------------------

  await until(S(27));
  await play(
    ...fade(
      leftDistance,
      rightDistance,
      distanceLabels
    ),
    new M.LaggedStart(
      bars.map(b =>
        new M.Indicate(b.label, {
          color: C.violet
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.6
      }
    ),
    ...say('A WEIGHTED MEAN', C.violet),
    ...fbox([
      'weighted mean',
      ['weights are chances', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 28. Each payout counts as much as its chance.
  // ----------------------------------------------------------

  const weightNotes = [
    txt(
      '× 1/4',
      17,
      C.amber,
      plotX(0),
      barBase + QH * 0.47,
      true
    ),
    txt(
      '× 1/2',
      17,
      C.amber,
      plotX(2),
      barBase + QH * 0.94,
      true
    ),
    txt(
      '× 1/4',
      17,
      C.amber,
      plotX(4),
      barBase + QH * 0.47,
      true
    )
  ];

  await until(S(28));
  await play(
    new M.LaggedStart(
      weightNotes.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.15,
        runTime: 1.2
      }
    ),
    ...say('WEIGHT EACH PAYOUT BY ITS CHANCE'),
    ...fbox([
      'value × probability',
      ['then add', C.amber]
    ])
  );

  // ----------------------------------------------------------
  // 29. The short version, in one line.
  // ----------------------------------------------------------

  await until(S(29));
  await play(
    ...fade(weightNotes),
    ...say('THE SHORT VERSION'),
    ...fbox([
      'expected value notation'
    ])
  );

  // ----------------------------------------------------------
  // 30. E stands for expected. X is the payout.
  // ----------------------------------------------------------

  const expectationTag = tag(
    'E[X] = 2',
    C.green,
    CX,
    P ? -4.85 : -2.29,
    21
  );

  await until(S(30));
  await play(
    ...fade(balanceTag),
    new M.FadeIn(expectationTag),
    ...say('E = EXPECTED · X = PAYOUT', C.green),
    ...fbox([
      ['E[X]', C.green],
      'E = expected',
      'X = round one payout'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 31. E[X] is the sum over all payouts of payout × chance.
  // ----------------------------------------------------------

  await until(S(31));
  await play(
    new M.LaggedStart(
      bars.map(b =>
        new M.Indicate(b.body, {
          color: C.amber
        })
      ),
      {
        lagRatio: 0.25,
        runTime: 2.1
      }
    ),
    ...say('MULTIPLY EACH VALUE BY ITS CHANCE'),
    ...fbox([
      ['E[X] = Σ x × P(X = x)', C.green],
      'Σ means add them all'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 32. Read the formula in plain language.
  // ----------------------------------------------------------

  await until(S(32));
  await play(
    new M.Indicate(expectationTag, {
      color: C.green
    }),
    ...say('MULTIPLY, THEN ADD', C.amber),
    ...fbox([
      'E[X] = 0 × 1/4',
      '     + 2 × 1/2',
      '     + 4 × 1/4',
      ['     = 2 tokens', GOLD]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 33. Back to the owner.
  // Each round brings in three tokens
  // and pays out two tokens on average.
  // ----------------------------------------------------------

  const financeY = P ? -0.65 : -0.35;
  const financeX = P ? 1.65 : 1.70;

  function financeCard(
    x,
    heading,
    n,
    color,
    subheading
  ) {
    const w = P ? 2.90 : 2.95;
    const h = P ? 2.80 : 2.25;

    const frame = rect(
      w,
      h,
      x,
      financeY,
      color,
      0.08
    );

    const label = txt(
      heading,
      20,
      color,
      x,
      financeY + h / 2 - 0.33
    );

    const cash = coins(
      n,
      x,
      financeY + 0.06,
      0.23
    );

    const amount = txt(
      `${n} tokens`,
      20,
      GOLD,
      x,
      financeY - 0.56,
      true
    );

    const note = txt(
      subheading,
      16,
      C.muted,
      x,
      financeY - h / 2 + 0.24
    );

    return new M.VGroup(
      frame,
      label,
      cash,
      amount,
      note
    );
  }

  const incomeCard = financeCard(
    CX - financeX,
    'INCOME',
    3,
    C.green,
    'each round'
  );

  const outgoingCard = financeCard(
    CX + financeX,
    'PAYOUT',
    2,
    C.cyan,
    'on average'
  );

  await until(S(33));
  await play(
    ...fade(
      plankParts(plank),
      barParts(bars),
      support,
      pivotLine,
      expectationTag
    ),
    ...appear(incomeCard, outgoingCard),
    ...say('INCOME 3 · AVERAGE PAYOUT 2', GOLD),
    ...fbox([
      ['income = 3', C.green],
      ['expected payout = 2', C.cyan],
      'expected profit = ?'
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 34. The booth keeps one token per round in the long run.
  //
  // Show three incoming coins, two outgoing coins,
  // and one coin left over.
  // ----------------------------------------------------------

  const profitY = P ? -0.10 : -0.15;

  const incomeCoins = [
    coin(CX - 0.66, profitY, 0.24),
    coin(CX, profitY, 0.24),
    coin(CX + 0.66, profitY, 0.24)
  ];

  const profitHeading = txt(
    '3 tokens received',
    19,
    C.green,
    CX,
    profitY + 0.95
  );

  const paidTargets = [
    coin(
      CX + 1.65,
      profitY - 0.75,
      0.24
    ),
    coin(
      CX + 2.30,
      profitY - 0.75,
      0.24
    )
  ];

  const keepTarget = coin(
    CX - 1.40,
    profitY - 0.75,
    0.24
  );

  const paidLabel = tag(
    'PAY OUT 2',
    C.cyan,
    CX + 1.95,
    profitY - 1.48,
    16
  );

  const keepLabel = tag(
    'KEEP 1',
    C.green,
    CX - 1.40,
    profitY - 1.48,
    17
  );

  await until(S(34));
  await play(
    ...fade(incomeCard, outgoingCard),
    ...appear(incomeCoins, profitHeading),
    ...say('KEEP ABOUT ONE TOKEN PER ROUND', C.green),
    ...fbox([
      '3 - 2',
      ['= 1 token', C.green],
      'on average'
    ], C.green)
  );

  await play(
    new M.Transform(
      incomeCoins[0],
      paidTargets[0],
      {
        pathArc: -0.35,
        runTime: 0.8
      }
    ),
    new M.Transform(
      incomeCoins[1],
      paidTargets[1],
      {
        pathArc: -0.35,
        runTime: 0.8
      }
    ),
    new M.Transform(
      incomeCoins[2],
      keepTarget,
      {
        pathArc: 0.35,
        runTime: 0.8
      }
    ),
    ...appear(paidLabel, keepLabel)
  );

  // ----------------------------------------------------------
  // 35. Expected value describes what happens on average
  // over many tries.
  //
  // Illustrative sequence of eight normal-game spins.
  // These are example results, not promised frequencies.
  // ----------------------------------------------------------

  const exampleSpins = [0, 4, 2, 2, 4, 0, 2, 2];

  const spinCardW = P ? 1.31 : 1.34;
  const spinCardH = P ? 1.36 : 1.04;

  function spinCard(v, k) {
    const col = k % 4;
    const row = Math.floor(k / 4);

    const x = CX + (col - 1.5) * (P ? 1.48 : 1.51);
    const y = MAINY + (0.5 - row) * (P ? 1.62 : 1.25);

    const color =
      v === 0 ? GREY :
      v === 2 ? BLUE :
      GOLD;

    const r = rect(
      spinCardW,
      spinCardH,
      x,
      y,
      color,
      0.09
    );

    const number = txt(
      `Spin ${k + 1}`,
      14,
      C.muted,
      x,
      y + spinCardH / 2 - 0.20
    );

    const tokenRow = coins(
      v,
      x,
      y - 0.04,
      v === 4 ? 0.085 : 0.12
    );

    const value = txt(
      String(v),
      17,
      GOLD,
      x,
      y - spinCardH / 2 + 0.16,
      true
    );

    return new M.VGroup(
      r,
      number,
      tokenRow,
      value
    );
  }

  const spinCards = exampleSpins.map(spinCard);

  const exampleMean = tag(
    'EXAMPLE AVERAGE: 16 ÷ 8 = 2',
    C.green,
    CX,
    P ? -3.12 : -2.17,
    17
  );

  await until(S(35));
  await play(
    ...fade(
      incomeCoins,
      profitHeading,
      paidLabel,
      keepLabel
    ),
    new M.LaggedStart(
      spinCards.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.13,
        runTime: 2.0
      }
    ),
    new M.FadeIn(exampleMean),
    ...say('EXPECTED VALUE IS ABOUT MANY TRIES', C.green),
    ...fbox([
      'individual results vary',
      ['long-run mean = 2', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 36. Prices, insurance and games use expected values.
  // Three small picture cards.
  // ----------------------------------------------------------

  const useY = P ? -0.70 : -0.40;
  const useW = P ? 1.90 : 1.94;
  const useH = P ? 2.60 : 2.15;

  function useCard(k, title, subtitle, color, icon) {
    const x = colx(k);

    const frame = rect(
      useW,
      useH,
      x,
      useY,
      color,
      0.08
    );

    const heading = txt(
      title,
      17,
      color,
      x,
      useY + useH / 2 - 0.31
    );

    const label = txt(
      subtitle,
      15,
      C.ink,
      x,
      useY - useH / 2 + 0.32,
      false,
      useW - 0.22
    );

    return new M.VGroup(
      frame,
      heading,
      icon,
      label
    );
  }

  const priceIcon = new M.VGroup(
    coin(colx(0) - 0.20, useY + 0.04, 0.24),
    coin(colx(0) + 0.24, useY - 0.12, 0.24)
  );

  const shield = new M.Polygon({
    vertices: [
      [colx(1) - 0.38, useY + 0.42, 0],
      [colx(1) + 0.38, useY + 0.42, 0],
      [colx(1) + 0.31, useY - 0.14, 0],
      [colx(1), useY - 0.45, 0],
      [colx(1) - 0.31, useY - 0.14, 0]
    ],
    color: C.violet,
    strokeWidth: 2
  });

  shield.setFill(C.violet, 0.20);

  const shieldCheck = new M.VGroup(
    line(
      [colx(1) - 0.19, useY, 0],
      [colx(1) - 0.04, useY - 0.16, 0],
      C.violet,
      4
    ),
    line(
      [colx(1) - 0.04, useY - 0.16, 0],
      [colx(1) + 0.23, useY + 0.18, 0],
      C.violet,
      4
    )
  );

  const insuranceIcon = new M.VGroup(
    shield,
    shieldCheck
  );

  const gameIcon = wheel(
    colx(2),
    useY,
    0.48
  );

  const useCards = [
    useCard(
      0,
      'PRICES',
      'average cost',
      GOLD,
      priceIcon
    ),
    useCard(
      1,
      'INSURANCE',
      'average claims',
      C.violet,
      insuranceIcon
    ),
    useCard(
      2,
      'GAMES',
      'average payout',
      C.cyan,
      gameIcon
    )
  ];

  await until(S(36));
  await play(
    ...fade(spinCards, exampleMean),
    new M.LaggedStart(
      useCards.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.23,
        runTime: 1.8
      }
    ),
    ...say('DECISIONS USING LONG-RUN AVERAGES', C.green),
    ...fbox([
      'prices',
      'insurance',
      ['games', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 37. Common trap: expected does not mean promised.
  // ----------------------------------------------------------

  const trapFrame = rect(
    P ? 5.75 : 5.95,
    P ? 2.40 : 2.05,
    CX,
    MAINY,
    C.amber,
    0.075
  );

  const trapTop = txt(
    'EXPECTED PAYOUT',
    20,
    C.green,
    CX,
    MAINY + 0.65
  );

  const trapValue = txt(
    '2',
    51,
    GOLD,
    CX,
    MAINY,
    true
  );

  const trapBottom = txt(
    'Not a promise for the next spin',
    18,
    C.amber,
    CX,
    MAINY - 0.71,
    false,
    5.35
  );

  const trapCard = new M.VGroup(
    trapFrame,
    trapTop,
    trapValue,
    trapBottom
  );

  await until(S(37));
  await play(
    ...fade(useCards),
    new M.FadeIn(trapCard),
    ...say('TRAP: EXPECTED ≠ PROMISED', C.amber),
    ...fbox([
      'expected value',
      ['is not a guarantee', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 38. Another booth pays zero or four,
  // with a half chance for each.
  //
  // This is a separate hypothetical booth,
  // not a change to the original shared spinner.
  // ----------------------------------------------------------

  plank = makePlank();

  const otherValues = [0, 4];
  const otherProbs = [0.5, 0.5];
  const otherFractions = ['1/2', '1/2'];

  bars = makeWeightBars(
    otherValues,
    otherProbs,
    otherFractions,
    C.violet
  );

  support = fulcrum(2);

  const otherName = tag(
    'ANOTHER BOOTH',
    C.violet,
    CX,
    P ? 1.36 : 1.30,
    16
  );

  const noMiddle = circle(
    0.13,
    plotX(2),
    barBase + 0.13,
    C.amber,
    0,
    2
  );

  await until(S(38));
  await play(
    ...fade(trapCard),
    ...appear(
      plankParts(plank),
      barParts(bars),
      otherName
    ),
    new M.Create(noMiddle),
    ...say('ANOTHER BOOTH: ONLY 0 OR 4', C.violet),
    ...fbox([
      'P(X = 0) = 1/2',
      'P(X = 4) = 1/2',
      ['P(X = 2) = 0', C.amber]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 39. Its expected value is also two.
  // Yet no single spin ever pays two.
  // ----------------------------------------------------------

  const otherMean = tag(
    'EXPECTED VALUE = 2',
    C.green,
    CX,
    P ? -4.85 : -2.29,
    18
  );

  const impossibleTwo = txt(
    'No payout here!',
    17,
    C.amber,
    plotX(2),
    barBase + 0.64
  );

  const noTwoCross = new M.VGroup(
    line(
      [
        plotX(2) - 0.18,
        barBase + 0.13 - 0.18,
        0
      ],
      [
        plotX(2) + 0.18,
        barBase + 0.13 + 0.18,
        0
      ],
      C.amber,
      3
    ),
    line(
      [
        plotX(2) - 0.18,
        barBase + 0.13 + 0.18,
        0
      ],
      [
        plotX(2) + 0.18,
        barBase + 0.13 - 0.18,
        0
      ],
      C.amber,
      3
    )
  );

  await until(S(39));
  await play(
    new M.FadeIn(support),
    new M.FadeIn(otherMean),
    new M.FadeIn(impossibleTwo),
    new M.Create(noTwoCross),
    ...say('MEAN 2 · NO SPIN EVER PAYS 2', C.amber),
    ...fbox([
      'E[X] = 0 × 1/2 + 4 × 1/2',
      ['= 2 tokens', C.green],
      ['but P(X = 2) = 0', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 40. With a few spins, luck can push your average
  // far from the expected value.
  //
  // Illustrative sequence from the OTHER booth:
  // 4, 4, 4, 0, 0, 4, 0, 0
  //
  // Running averages:
  // 4, 4, 4, 3, 2.4, 2.67, 2.29, 2
  //
  // This is one possible sequence, not guaranteed convergence.
  // ----------------------------------------------------------

  const luckSpins = [
    4, 4, 4, 0,
    0, 4, 0, 0
  ];

  let runningTotal = 0;

  const runningMeans = luckSpins.map((v, k) => {
    runningTotal += v;
    return runningTotal / (k + 1);
  });

  const RUNBASE = P ? -3.55 : -2.05;
  const RUNH = P ? 4.55 : 3.04;
  const RUNW = P ? 5.45 : 5.65;

  const runX = n =>
    CX - RUNW / 2 +
    (n - 1) / 7 * RUNW;

  const runY = v =>
    RUNBASE + v / 4 * RUNH;

  const runLeft = runX(1) - 0.33;
  const runRight = runX(8) + 0.22;

  const runAxisX = line(
    [runLeft, RUNBASE, 0],
    [runRight, RUNBASE, 0],
    C.muted,
    2
  );

  const runAxisY = line(
    [runLeft, RUNBASE, 0],
    [runLeft, runY(4) + 0.10, 0],
    C.muted,
    2
  );

  const runTicksX = luckSpins.map((_, k) =>
    txt(
      String(k + 1),
      16,
      C.muted,
      runX(k + 1),
      RUNBASE - 0.29,
      true
    )
  );

  const runTicksY = [0, 1, 2, 3, 4].map(v =>
    txt(
      String(v),
      16,
      C.muted,
      runLeft - 0.24,
      runY(v),
      true
    )
  );

  const runXLabel = txt(
    'number of spins',
    17,
    C.muted,
    CX,
    RUNBASE - 0.73
  );

  const runTitle = txt(
    'Example running average',
    17,
    C.violet,
    CX,
    runY(4) + 0.37
  );

  const meanGuide = dashed(
    [runLeft, runY(2), 0],
    [runRight, runY(2), 0],
    C.green
  );

  const meanGuideLabel = tag(
    'EXPECTED = 2',
    C.green,
    CX + 1.77,
    runY(2) - 0.34,
    15
  );

  const runSegments = runningMeans.slice(1).map((v, k) =>
    line(
      [
        runX(k + 1),
        runY(runningMeans[k]),
        0
      ],
      [
        runX(k + 2),
        runY(v),
        0
      ],
      C.violet,
      3.5
    )
  );

  const runDots = runningMeans.map((v, k) =>
    new M.Dot({
      point: [
        runX(k + 1),
        runY(v),
        0
      ],
      radius: 0.085,
      color: C.violet
    })
  );

  const earlyLabel = txt(
    '4 after 3 spins',
    16,
    C.amber,
    runX(2.25),
    runY(4) - 0.39
  );

  const finalRunLabel = tag(
    '2 AFTER 8',
    C.violet,
    runX(7.1),
    runY(2) + 0.49,
    15
  );

  const runParts = [
    runAxisX,
    runAxisY,
    ...runTicksX,
    ...runTicksY,
    runXLabel,
    runTitle,
    meanGuide,
    meanGuideLabel,
    ...runSegments,
    ...runDots,
    earlyLabel,
    finalRunLabel
  ];

  const runAnim = [
    new M.FadeIn(runDots[0])
  ];

  for (let k = 0; k < runSegments.length; k++) {
    runAnim.push(
      new M.Create(runSegments[k])
    );

    runAnim.push(
      new M.FadeIn(runDots[k + 1])
    );
  }

  await until(S(40));
  await play(
    ...fade(
      plankParts(plank),
      barParts(bars),
      support,
      otherName,
      noMiddle,
      noTwoCross,
      otherMean,
      impossibleTwo
    ),
    new M.Create(runAxisX),
    new M.Create(runAxisY),
    new M.Create(meanGuide),
    ...appear(
      runTicksX,
      runTicksY,
      runXLabel,
      runTitle,
      meanGuideLabel
    ),
    new M.LaggedStart(
      runAnim,
      {
        lagRatio: 0.18,
        runTime: 3.3
      }
    ),
    ...say('SHORT RUN: LUCK CAN CHANGE THE MEAN', C.violet),
    ...fbox([
      'example: first 3 spins',
      '4, 4, 4',
      ['average = 4, not 2', C.amber]
    ], C.amber)
  );

  await play(
    ...appear(earlyLabel, finalRunLabel),
    ...fbox([
      'one possible sequence',
      'averages can fluctuate',
      ['long-run target = 2', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 41. Preview the next lesson:
  // What happens when we change each payout?
  //
  // Return to the original spinner and its original payouts.
  // ----------------------------------------------------------

  const previewWheel = wheel(
    CX,
    P ? -0.35 : -0.20,
    P ? 1.23 : 1.10
  );

  const previewY = P ? -2.55 : -1.80;

  const previewPayouts = VALUES.map((v, k) => {
    const x = colx(k);

    const r = rect(
      1.78,
      P ? 0.78 : 0.63,
      x,
      previewY,
      PAYCOL[k],
      0.12
    );

    const t = txt(
      `${v} tokens`,
      18,
      PAYCOL[k],
      x,
      previewY,
      true
    );

    return new M.VGroup(r, t);
  });

  const previewArrows = VALUES.map((_, k) =>
    arrow(
      [
        colx(k),
        previewY - 0.48,
        0
      ],
      [
        colx(k),
        previewY - (P ? 1.02 : 0.88),
        0
      ],
      C.violet,
      2,
      0.12
    )
  );

  // Only the phone layout has enough room beneath the
  // payout cards for a second row of question marks.
  const previewQuestions = VALUES.map((_, k) =>
    txt(
      '?',
      25,
      C.violet,
      colx(k),
      previewY - 1.27,
      true
    )
  );

  await until(S(41));
  await play(
    ...fade(runParts),
    new M.FadeIn(previewWheel),
    ...appear(previewPayouts),
    ...(P
      ? [
          ...previewArrows.map(a => new M.Create(a)),
          ...appear(previewQuestions)
        ]
      : []
    ),
    ...say('NEXT: WHAT IF WE CHANGE THE PAYOUT?', C.violet),
    ...fbox([
      'original payouts: 0, 2, 4',
      'change the payout rule',
      ['new expected value = ?', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 42. Final definition.
  //
  // Expected value is the long-run mean:
  // each possible value times its chance, added up.
  //
  // Return to the original spinner's balanced probability bars.
  // ----------------------------------------------------------

  plank = makePlank();
  bars = makeWeightBars();
  support = fulcrum(2);

  const finalMean = tag(
    'EXPECTED VALUE = 2 TOKENS',
    C.green,
    CX,
    P ? -4.85 : -2.29,
    18
  );

  const finalPivot = dashed(
    [
      plotX(2),
      PLANKY + 0.12,
      0
    ],
    [
      plotX(2),
      barBase + 2 * QH + 0.12,
      0
    ],
    C.amber
  );

  await until(S(42));
  await play(
    ...fade(
      previewWheel,
      previewPayouts,
      ...(P
        ? [
            ...previewArrows,
            ...previewQuestions
          ]
        : [])
    ),
    ...appear(plankParts(plank)),
    new M.LaggedStart(
      bars.map(b => new M.FadeIn(b.body)),
      {
        lagRatio: 0.20,
        runTime: 1.7
      }
    ),
    ...appear(bars.map(b => b.label)),
    new M.FadeIn(support),
    new M.Create(finalPivot),
    new M.FadeIn(finalMean),
    ...say('EXPECTED VALUE = LONG-RUN MEAN', C.green),
    ...fbox([
      ['E[X] = Σ x × P(X = x)', C.green],
      '= 0×1/4 + 2×1/2 + 4×1/4',
      '= 0 + 1 + 1',
      ['= 2 tokens', GOLD]
    ], C.green)
  );

  await until(S(42) + 3.8);
  await play(
    new M.Indicate(support, {
      color: C.amber,
      runTime: 0.9
    }),
    ...say('EACH VALUE × ITS CHANCE, THEN ADD', C.green)
  );

  await until(E(42));
}

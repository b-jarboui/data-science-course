// lesson 4.3.6
// Variance of a random variable: measuring the swing around its mean.
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

  const MEAN = 2;
  const DEVIATIONS = [-2, 0, 2];
  const SQUARED = [4, 0, 4];
  const WEIGHTED = [1, 0, 1];

  const VARIANCE = 2;
  const SD = Math.sqrt(VARIANCE);

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';
  const PINK = C.pink || '#F472B6';

  const COL = [GREY, BLUE, BLUE, GOLD];
  const PAYCOL = [GREY, BLUE, GOLD];
  const NAMES = ['GREY', 'EITHER BLUE', 'GOLD'];

  // Laptop + phone layout, following preceding lessons.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const BASE = P ? -4.2 : -2.35;
  const SP = P ? 2.08 : 2.10;
  const MAINY = P ? -0.65 : -0.45;

  const colx = k => CX + (k - 1) * SP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o, { runTime: 0.5 }));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o, { runTime: 0.5 }));

  // Track live objects without regrouping objects already on screen.
  let live = [];

  function replacePicture(...objects) {
    const next = objects.flat(Infinity).filter(Boolean);

    const animations = [
      ...fade(live),
      ...appear(next)
    ];

    live = next;
    return animations;
  }

  function addPicture(...objects) {
    const next = objects.flat(Infinity).filter(Boolean);
    live.push(...next);
    return appear(next);
  }

  function removePicture(...objects) {
    const gone = objects.flat(Infinity).filter(Boolean);
    live = live.filter(o => !gone.includes(o));
    return fade(gone);
  }

  function register(...objects) {
    live.push(
      ...objects.flat(Infinity).filter(Boolean)
    );
  }

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

  function outline(w, h, x, y, color = C.amber) {
    return rect(w, h, x, y, color, 0, 2);
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

  function dot(x, y, color, r = 0.09) {
    const d = new M.Dot({
      point: [x, y, 0],
      radius: r,
      color
    });

    d.setFill(color, 1);
    return d;
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

  function arrow(a, b, color = C.cyan, sw = 3, tip = 0.15) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);

    if (d < 0.0001) {
      return circle(0.08, a[0], a[1], color, 1);
    }

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

  function signed(v) {
    if (v < 0) return `−${Math.abs(v)}`;
    if (v > 0) return `+${v}`;
    return '0';
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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.9 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);
    g.moveTo(BOXP);

    const a = [
      new M.FadeIn(g, { runTime: 0.5 })
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow, { runTime: 0.5 })
      );
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      new M.FadeOut(boxNow, { runTime: 0.5 })
    ];

    boxNow = null;
    return a;
  }

  // ----------------------------------------------------------
  // Gold token coins, consistent with preceding lessons.
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

    return new M.VGroup(
      glow,
      face,
      rim,
      mark
    );
  }

  function coins(n, x, y, r = 0.16) {
    if (n === 0) {
      return txt(
        '0',
        26,
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

  // ----------------------------------------------------------
  // Two booths side by side.
  // Left: the original spinner booth.
  // Right: a hypothetical steady booth that always pays two.
  // ----------------------------------------------------------

  const BOOTH_DX = P ? 1.68 : 1.72;
  const BOOTH_W = P ? 3.08 : 3.12;
  const BOOTH_H = P ? 3.65 : 3.15;
  const BOOTH_Y = P ? -0.64 : -0.40;

  const BX1 = CX - BOOTH_DX;
  const BX2 = CX + BOOTH_DX;

  function boothShell(x, name, color) {
    const r = rect(
      BOOTH_W,
      BOOTH_H,
      x,
      BOOTH_Y,
      color,
      0.08
    );

    const signY =
      BOOTH_Y + BOOTH_H / 2 - 0.34;

    const sign = rect(
      BOOTH_W - 0.14,
      0.54,
      x,
      signY,
      color,
      0.20
    );

    const heading = txt(
      name,
      17,
      color,
      x,
      signY,
      false,
      BOOTH_W - 0.30
    );

    const counter = line(
      [
        x - BOOTH_W / 2 + 0.13,
        BOOTH_Y - BOOTH_H * 0.27,
        0
      ],
      [
        x + BOOTH_W / 2 - 0.13,
        BOOTH_Y - BOOTH_H * 0.27,
        0
      ],
      color,
      3
    );

    return new M.VGroup(
      r,
      sign,
      heading,
      counter
    );
  }

  const spinnerBooth = boothShell(
    BX1,
    'SPINNER BOOTH',
    C.cyan
  );

  const steadyBooth = boothShell(
    BX2,
    'STEADY BOOTH',
    C.green
  );

  const boothWheel = wheel(
    BX1,
    BOOTH_Y + 0.14,
    P ? 0.78 : 0.70
  );

  const steadyCoins = coins(
    2,
    BX2,
    BOOTH_Y + 0.14,
    0.26
  );

  // ----------------------------------------------------------
  // 0. Imagine two booths side by side.
  // ----------------------------------------------------------

  await until(S(0));
  await play(
    ...replacePicture(
      spinnerBooth,
      steadyBooth,
      boothWheel,
      steadyCoins
    ),
    ...say('TWO BOOTHS SIDE BY SIDE')
  );

  // ----------------------------------------------------------
  // 1. Our spinner booth pays 0, 2 or 4.
  // On average, it pays two.
  // ----------------------------------------------------------

  const spinnerPayout = txt(
    '0, 2 or 4',
    22,
    C.cyan,
    BX1,
    BOOTH_Y - BOOTH_H * 0.39,
    true
  );

  const spinnerMean = tag(
    'MEAN = 2',
    C.cyan,
    BX1,
    BOOTH_Y - BOOTH_H / 2 - 0.35,
    16
  );

  await until(S(1));
  await play(
    ...addPicture(
      spinnerPayout,
      spinnerMean
    ),
    ...say('OUR SPINNER: 0, 2 OR 4'),
    ...fbox([
      'spinner booth',
      'payout: 0, 2 or 4',
      ['expected value = 2', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 2. The steady booth always pays exactly two.
  // ----------------------------------------------------------

  const steadyPayout = txt(
    'Always 2',
    22,
    C.green,
    BX2,
    BOOTH_Y - BOOTH_H * 0.39,
    true
  );

  const steadyMean = tag(
    'MEAN = 2',
    C.green,
    BX2,
    BOOTH_Y - BOOTH_H / 2 - 0.35,
    16
  );

  await until(S(2));
  await play(
    ...addPicture(
      steadyPayout,
      steadyMean
    ),
    ...say('STEADY BOOTH: ALWAYS TWO', C.green),
    ...fbox([
      'steady booth',
      ['payout = 2 every time', C.green],
      'expected value = 2'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 3. Both booths have the same expected value.
  // ----------------------------------------------------------

  await until(S(3));
  await play(
    new M.Indicate(spinnerMean, {
      color: C.amber,
      runTime: 1.1
    }),
    new M.Indicate(steadyMean, {
      color: C.amber,
      runTime: 1.1
    }),
    ...say('SAME EXPECTED VALUE: TWO', GOLD),
    ...fbox([
      'spinner mean = 2',
      'steady mean = 2',
      ['same expected value', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 4. But they do not feel the same to play.
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    ...say('SAME MEAN. DIFFERENT EXPERIENCE.', C.amber),
    ...fbox([
      'same average',
      ['different swings?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Comparison strips.
  //
  // An illustrative four-play sequence, not guaranteed counts.
  // Original spinner: 0, 4, 2, 2.
  // Steady booth:     2, 2, 2, 2.
  // ----------------------------------------------------------

  const PLAY_VALUES = [0, 4, 2, 2];

  const PLAY_DX = P ? 1.43 : 1.46;
  const PLAY_W = P ? 1.31 : 1.33;
  const PLAY_H = P ? 1.30 : 0.97;

  const PLAY_Y1 = P ? 0.35 : 0.35;
  const PLAY_Y2 = P ? -2.12 : -1.51;

  function playCard(k, v, y, color) {
    const x = CX + (k - 1.5) * PLAY_DX;

    const r = rect(
      PLAY_W,
      PLAY_H,
      x,
      y,
      color,
      0.10
    );

    const reward = coins(
      v,
      x,
      y + 0.04,
      v === 4 ? 0.085 : 0.13
    );

    const value = txt(
      String(v),
      18,
      color,
      x,
      y - PLAY_H / 2 + 0.17,
      true
    );

    return new M.VGroup(
      r,
      reward,
      value
    );
  }

  const variablePlays = PLAY_VALUES.map((v, k) =>
    playCard(k, v, PLAY_Y1, C.cyan)
  );

  const steadyPlays = PLAY_VALUES.map((_, k) =>
    playCard(k, 2, PLAY_Y2, C.green)
  );

  const variableHeading = txt(
    'SPINNER: EXAMPLE PLAYS',
    18,
    C.cyan,
    CX,
    PLAY_Y1 + PLAY_H / 2 + 0.30
  );

  const steadyHeading = txt(
    'STEADY: EVERY PLAY',
    18,
    C.green,
    CX,
    PLAY_Y2 + PLAY_H / 2 + 0.30
  );

  // ----------------------------------------------------------
  // 5. The steady booth never surprises.
  // Our spinner swings from zero to four.
  // ----------------------------------------------------------

  await until(S(5));

  const oldBooths = live.slice();

  live = [
    variableHeading,
    steadyHeading,
    ...variablePlays,
    ...steadyPlays
  ];

  await play(
    ...fade(oldBooths),
    ...appear(variableHeading, steadyHeading),
    new M.LaggedStart(
      variablePlays.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.25,
        runTime: 1.8
      }
    ),
    new M.LaggedStart(
      steadyPlays.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.25,
        runTime: 1.8
      }
    ),
    ...say('OURS SWINGS. THE STEADY BOOTH DOES NOT.', C.amber),
    ...fbox([
      'spinner: 0 to 4',
      'steady: always 2',
      ['different spread', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 6. We need a number to measure this swinging.
  // ----------------------------------------------------------

  await until(S(6));
  await play(
    ...say('HOW CAN WE MEASURE THE SWING?', C.violet),
    ...fbox([
      'mean measures centre',
      ['what measures spread?', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // Probability plot with the mean marked at two.
  // ----------------------------------------------------------

  const PLOTBASE = P ? -2.65 : -1.30;
  const PLOTW = P ? 5.95 : 6.12;
  const QH = P ? 1.48 : 0.98;
  const BARW = P ? 0.82 : 0.76;

  const plotX = v =>
    CX - PLOTW / 2 + 0.65 +
    v / 4 * (PLOTW - 1.30);

  function probabilityBar(
    v,
    p,
    label,
    color = C.cyan,
    base = PLOTBASE,
    qh = QH,
    xFn = plotX,
    width = BARW
  ) {
    const x = xFn(v);
    const h = p * 4 * qh;

    const glow = new M.Rectangle({
      width: width + 0.20,
      height: h + 0.03,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.10);
    glow.moveTo([x, base + h / 2, 0]);

    const body = new M.Rectangle({
      width,
      height: h,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.75);
    body.moveTo([x, base + h / 2, 0]);

    const lab = txt(
      label,
      P ? 22 : 20,
      color,
      x,
      base + h + 0.27,
      true
    );

    return {
      body: new M.VGroup(glow, body),
      label: lab,
      h
    };
  }

  function makePlot() {
    const axis = line(
      [CX - PLOTW / 2, PLOTBASE, 0],
      [CX + PLOTW / 2, PLOTBASE, 0],
      C.muted,
      2.5
    );

    const ticks = [0, 1, 2, 3, 4].map(v =>
      new M.VGroup(
        line(
          [plotX(v), PLOTBASE - 0.06, 0],
          [plotX(v), PLOTBASE + 0.06, 0],
          C.muted,
          1.5
        ),
        txt(
          String(v),
          VALUES.includes(v) ? 20 : 16,
          VALUES.includes(v) ? C.ink : C.muted,
          plotX(v),
          PLOTBASE - 0.25,
          true
        )
      )
    );

    const bars = VALUES.map((v, k) =>
      probabilityBar(
        v,
        PROBS[k],
        FRACTIONS[k]
      )
    );

    const meanGuide = dashed(
      [plotX(MEAN), PLOTBASE, 0],
      [plotX(MEAN), PLOTBASE + 2 * QH - 0.02, 0],
      C.amber
    );

    // beside the tall bar (not on its 1/2 label)
    const meanTag = tag(
      'MEAN = 2',
      C.amber,
      plotX(MEAN) + BARW / 2 + 0.78,
      PLOTBASE + 2 * QH - 0.2,
      17
    );

    return {
      axis,
      ticks,
      bars,
      meanGuide,
      meanTag
    };
  }

  function plotParts(p) {
    return [
      p.axis,
      ...p.ticks,
      ...p.bars.flatMap(b => [b.body, b.label]),
      p.meanGuide,
      p.meanTag
    ];
  }

  let plot = makePlot();

  // ----------------------------------------------------------
  // 7. Step one: measure each payout's signed distance
  // from the expected value, two.
  // ----------------------------------------------------------

  await until(S(7));
  await play(
    ...replacePicture(plotParts(plot)),
    ...say('STEP 1: DISTANCE FROM THE MEAN', C.amber),
    ...fbox([
      'distance = payout - mean',
      ['mean = 2', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Signed deviation markers.
  //
  // Arrows begin at the mean and point toward each payout.
  // Grey points left:  -2.
  // Blue stays put:     0.
  // Gold points right: +2.
  // ----------------------------------------------------------

  const DEVY = P ? -3.55 : -2.03;

  const leftDeviation = arrow(
    [plotX(2) - 0.10, DEVY, 0],
    [plotX(0), DEVY, 0],
    C.violet,
    3,
    0.17
  );

  const leftDevLabel = txt(
    '−2',
    24,
    C.violet,
    plotX(1),
    DEVY - 0.38,
    true
  );

  const centreDeviation = new M.VGroup(
    circle(
      0.18,
      plotX(2),
      DEVY,
      C.green,
      0.15,
      2
    ),
    dot(
      plotX(2),
      DEVY,
      C.green,
      0.075
    )
  );

  const centreDevLabel = txt(
    '0',
    24,
    C.green,
    plotX(2),
    DEVY - 0.38,
    true
  );

  const rightDeviation = arrow(
    [plotX(2) + 0.10, DEVY, 0],
    [plotX(4), DEVY, 0],
    C.violet,
    3,
    0.17
  );

  const rightDevLabel = txt(
    '+2',
    24,
    C.violet,
    plotX(3),
    DEVY - 0.38,
    true
  );

  // ----------------------------------------------------------
  // 8. Grey pays zero. Two below the mean: minus two.
  // ----------------------------------------------------------

  await until(S(8));

  register(leftDeviation, leftDevLabel);

  await play(
    new M.Create(leftDeviation, {
      runTime: 0.8
    }),
    new M.FadeIn(leftDevLabel),
    new M.Indicate(plot.bars[0].body, {
      color: GREY
    }),
    ...say('GREY: TWO BELOW THE MEAN', GREY),
    ...fbox([
      '0 - 2',
      ['= −2', C.violet]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 9. Blue pays two. Right on target: zero.
  // ----------------------------------------------------------

  await until(S(9));
  await play(
    ...addPicture(
      centreDeviation,
      centreDevLabel
    ),
    new M.Indicate(plot.bars[1].body, {
      color: BLUE
    }),
    ...say('BLUE: RIGHT ON THE MEAN', BLUE),
    ...fbox([
      '2 - 2',
      ['= 0', C.green]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 10. Gold pays four. Two above the mean: plus two.
  // ----------------------------------------------------------

  await until(S(10));

  register(rightDeviation, rightDevLabel);

  await play(
    new M.Create(rightDeviation, {
      runTime: 0.8
    }),
    new M.FadeIn(rightDevLabel),
    new M.Indicate(plot.bars[2].body, {
      color: GOLD
    }),
    ...say('GOLD: TWO ABOVE THE MEAN', GOLD),
    ...fbox([
      '4 - 2',
      ['= +2', C.violet]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 11. Signed distances cancel when averaged.
  //
  // −2 × 1/4 + 0 × 1/2 + 2 × 1/4
  // = −1/2 + 0 + 1/2
  // = 0.
  //
  // Use equal lengths on opposite sides of zero.
  // ----------------------------------------------------------

  const CANCELY = P ? -0.65 : -0.42;
  const CANCELW = P ? 1.85 : 1.90;

  const negativeMass = new M.VGroup(
    rect(
      CANCELW,
      0.77,
      CX - CANCELW / 2,
      CANCELY,
      C.violet,
      0.32
    ),
    txt(
      '−1/2',
      26,
      C.violet,
      CX - CANCELW / 2,
      CANCELY,
      true
    )
  );

  const positiveMass = new M.VGroup(
    rect(
      CANCELW,
      0.77,
      CX + CANCELW / 2,
      CANCELY,
      C.cyan,
      0.32
    ),
    txt(
      '+1/2',
      26,
      C.cyan,
      CX + CANCELW / 2,
      CANCELY,
      true
    )
  );

  const zeroMarker = line(
    [CX, CANCELY - 0.72, 0],
    [CX, CANCELY + 0.72, 0],
    C.ink,
    2
  );

  const cancelLabels = [
    txt(
      '−2 × 1/4',
      20,
      C.violet,
      CX - CANCELW / 2,
      CANCELY + 0.80,
      true
    ),
    txt(
      '+2 × 1/4',
      20,
      C.cyan,
      CX + CANCELW / 2,
      CANCELY + 0.80,
      true
    )
  ];

  const centreZero = txt(
    '0 × 1/2 = 0',
    18,
    C.muted,
    CX,
    CANCELY - 1.03,
    true
  );

  const cancelResult = tag(
    'THEY CANCEL: 0',
    C.amber,
    CX,
    CANCELY - 1.77,
    18
  );

  await until(S(11));
  await play(
    ...replacePicture(
      negativeMass,
      positiveMass,
      zeroMarker,
      cancelLabels,
      centreZero
    ),
    ...say('THE MINUS AND PLUS CANCEL', C.amber),
    ...fbox([
      '−2×1/4 + 0×1/2 + 2×1/4',
      '= −1/2 + 0 + 1/2',
      ['= 0', C.amber]
    ], C.amber)
  );

  await play(
    new M.Transform(
      negativeMass,
      new M.VGroup(
        rect(
          0.08,
          0.77,
          CX - 0.045,
          CANCELY,
          C.violet,
          0.08
        ),
        txt(
          ' ',
          12,
          C.violet,
          CX - 0.045,
          CANCELY
        )
      ),
      { runTime: 0.8 }
    ),
    new M.Transform(
      positiveMass,
      new M.VGroup(
        rect(
          0.08,
          0.77,
          CX + 0.045,
          CANCELY,
          C.cyan,
          0.08
        ),
        txt(
          ' ',
          12,
          C.cyan,
          CX + 0.045,
          CANCELY
        )
      ),
      { runTime: 0.8 }
    ),
    ...addPicture(cancelResult)
  );

  // ----------------------------------------------------------
  // 12. Recall deviations in data from an earlier chapter.
  // ----------------------------------------------------------

  await until(S(12));
  await play(
    ...say('REMEMBER DEVIATIONS IN DATA', C.violet),
    ...fbox([
      'signed deviations',
      'average to zero',
      ['even when values spread out', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // Squared-distance picture.
  //
  // A distance of two becomes a 2 × 2 square.
  // Each little cell represents one squared token.
  // Zero distance produces zero area.
  // ----------------------------------------------------------

  const SQY = P ? -0.72 : -0.48;
  const SQW = P ? 1.92 : 1.95;
  const SQH = P ? 3.90 : 3.30;
  const UNIT = P ? 0.39 : 0.35;

  function areaCell(x, y, size, color = C.violet) {
    const glow = new M.Rectangle({
      width: size + 0.055,
      height: size + 0.055,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.10);
    glow.moveTo([x, y, 0]);

    const r = new M.Rectangle({
      width: size - 0.025,
      height: size - 0.025,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.72);
    r.moveTo([x, y, 0]);

    return new M.VGroup(glow, r);
  }

  function squareArea(n, x, y, size = UNIT, color = C.violet) {
    const side = Math.sqrt(n);

    if (n === 0) {
      return new M.VGroup(
        outline(
          size * 1.75,
          size * 1.75,
          x,
          y,
          C.muted
        ),
        txt(
          '0',
          23,
          C.muted,
          x,
          y,
          true
        )
      );
    }

    const cells = [];

    for (let r = 0; r < side; r++) {
      for (let c = 0; c < side; c++) {
        cells.push(
          areaCell(
            x + (c - (side - 1) / 2) * size,
            y + ((side - 1) / 2 - r) * size,
            size,
            color
          )
        );
      }
    }

    return new M.VGroup(...cells);
  }

  function deviationCard(k) {
    const x = colx(k);
    const d = DEVIATIONS[k];

    const frame = rect(
      SQW,
      SQH,
      x,
      SQY,
      PAYCOL[k],
      0.075
    );

    const heading = txt(
      NAMES[k],
      15,
      PAYCOL[k],
      x,
      SQY + SQH / 2 - 0.25,
      false,
      SQW - 0.20
    );

    const distance = txt(
      signed(d),
      28,
      C.violet,
      x,
      SQY + SQH * 0.25,
      true
    );

    const lengthY = SQY + SQH * 0.09;
    const length = Math.abs(d) * UNIT;

    const distancePicture = d === 0
      ? dot(x, lengthY, C.green, 0.065)
      : arrow(
          [x - Math.sign(d) * length / 2, lengthY, 0],
          [x + Math.sign(d) * length / 2, lengthY, 0],
          C.violet,
          3,
          0.12
        );

    const down = arrow(
      [x, SQY + SQH * 0.01, 0],
      [x, SQY - SQH * 0.11, 0],
      C.violet,
      2,
      0.12
    );

    const area = squareArea(
      SQUARED[k],
      x,
      SQY - SQH * 0.23
    );

    const squareFormula = txt(
      `(${signed(d)})² = ${SQUARED[k]}`,
      20,
      C.violet,
      x,
      SQY - SQH / 2 + 0.25,
      true,
      SQW - 0.18
    );

    return {
      base: new M.VGroup(
        frame,
        heading,
        distance,
        distancePicture
      ),

      squared: new M.VGroup(
        down,
        area,
        squareFormula
      )
    };
  }

  const deviationCards = VALUES.map((_, k) =>
    deviationCard(k)
  );

  // ----------------------------------------------------------
  // 13. Step two: square each distance.
  // All squared distances are nonnegative.
  // ----------------------------------------------------------

  await until(S(13));
  await play(
    ...replacePicture(
      deviationCards.map(c => c.base)
    ),
    ...say('STEP 2: SQUARE EVERY DISTANCE', C.violet),
    ...fbox([
      'signed distance',
      'multiply it by itself',
      ['no negative results', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 14. (−2)² = 4, 0² = 0, (+2)² = 4.
  // Draw the squares in the order of the narration.
  // ----------------------------------------------------------

  await until(S(14));

  register(
    deviationCards.map(c => c.squared)
  );

  await play(
    new M.LaggedStart(
      deviationCards.map(c =>
        new M.FadeIn(c.squared)
      ),
      {
        lagRatio: 0.45,
        runTime: 3.3
      }
    ),
    ...say('SQUARED DISTANCES: 4, 0, 4', C.violet),
    ...fbox([
      '(−2)² = 4',
      '0² = 0',
      ['(+2)² = 4', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // Weighted squared-distance cards.
  //
  // Keep the square picture and show its chance underneath.
  // Each result is revealed only when narrated.
  // ----------------------------------------------------------

  const WEIGHTY = P ? -0.77 : -0.51;
  const WEIGHTW = P ? 1.92 : 1.94;
  const WEIGHTH = P ? 4.10 : 3.45;

  function varianceCard(k) {
    const x = colx(k);

    const frame = rect(
      WEIGHTW,
      WEIGHTH,
      x,
      WEIGHTY,
      PAYCOL[k],
      0.07
    );

    const heading = txt(
      NAMES[k],
      15,
      PAYCOL[k],
      x,
      WEIGHTY + WEIGHTH / 2 - 0.24,
      false,
      WEIGHTW - 0.18
    );

    const area = squareArea(
      SQUARED[k],
      x,
      WEIGHTY + WEIGHTH * 0.24
    );

    const areaValue = txt(
      String(SQUARED[k]),
      24,
      C.violet,
      x,
      WEIGHTY + WEIGHTH * 0.07,
      true
    );

    const times = txt(
      '×',
      22,
      C.muted,
      x,
      WEIGHTY - WEIGHTH * 0.045,
      true
    );

    const probability = txt(
      FRACTIONS[k],
      25,
      C.cyan,
      x,
      WEIGHTY - WEIGHTH * 0.16,
      true
    );

    const rule = line(
      [
        x - WEIGHTW * 0.35,
        WEIGHTY - WEIGHTH * 0.28,
        0
      ],
      [
        x + WEIGHTW * 0.35,
        WEIGHTY - WEIGHTH * 0.28,
        0
      ],
      C.muted,
      1.5
    );

    const result = txt(
      String(WEIGHTED[k]),
      31,
      C.green,
      x,
      WEIGHTY - WEIGHTH * 0.39,
      true
    );

    return {
      base: new M.VGroup(
        frame,
        heading,
        area,
        areaValue,
        times,
        probability,
        rule
      ),
      result
    };
  }

  const varianceCards = VALUES.map((_, k) =>
    varianceCard(k)
  );

  // ----------------------------------------------------------
  // 15. Step three: weight each squared distance
  // by its chance, then add.
  // ----------------------------------------------------------

  await until(S(15));
  await play(
    ...replacePicture(
      varianceCards.map(c => c.base)
    ),
    ...say('STEP 3: WEIGHT BY CHANCE AND ADD', C.green),
    ...fbox([
      'squared distance × chance',
      ['then add all three', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 16. Four times a quarter is one.
  // ----------------------------------------------------------

  await until(S(16));
  await play(
    ...addPicture(varianceCards[0].result),
    new M.Indicate(varianceCards[0].base, {
      color: GREY,
      runTime: 0.6
    }),
    ...say('4 × 1/4 = 1', GREY),
    ...fbox([
      ['4 × 1/4 = 1', C.green]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 17. Zero times a half is zero.
  // ----------------------------------------------------------

  await until(S(17));
  await play(
    ...addPicture(varianceCards[1].result),
    new M.Indicate(varianceCards[1].base, {
      color: BLUE,
      runTime: 0.65
    }),
    ...say('0 × 1/2 = 0', BLUE),
    ...fbox([
      '4 × 1/4 = 1',
      ['0 × 1/2 = 0', C.green]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 18. Four times a quarter is one.
  // ----------------------------------------------------------

  await until(S(18));
  await play(
    ...addPicture(varianceCards[2].result),
    new M.Indicate(varianceCards[2].base, {
      color: GOLD,
      runTime: 0.6
    }),
    ...say('4 × 1/4 = 1', GOLD),
    ...fbox([
      '4 × 1/4 = 1',
      '0 × 1/2 = 0',
      ['4 × 1/4 = 1', C.green]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 19. One plus zero plus one makes two.
  // ----------------------------------------------------------

  const varianceTotal = tag(
    '1 + 0 + 1 = 2',
    C.green,
    CX,
    P ? -3.38 : -2.51,
    21
  );

  await until(S(19));
  await play(
    ...addPicture(varianceTotal),
    ...say('ADD: ONE PLUS ZERO PLUS ONE', C.green),
    ...fbox([
      '1 + 0 + 1',
      ['= 2', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 20. This number is called variance.
  // ----------------------------------------------------------

  await until(S(20));
  await play(
    new M.Indicate(varianceTotal, {
      color: C.green,
      runTime: 0.9
    }),
    ...say('VARIANCE OF A RANDOM VARIABLE', C.green),
    ...fbox([
      ['variance = 2', C.green],
      'a measure of spread'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 21. Variance is the expected squared distance
  // from the expected value.
  // ----------------------------------------------------------

  const workflowY = P ? -0.66 : -0.45;

  function workflowCard(k, heading, values, color, note) {
    const x = colx(k);
    const w = P ? 1.92 : 1.95;
    const h = P ? 3.35 : 2.77;

    const frame = rect(
      w,
      h,
      x,
      workflowY,
      color,
      0.075
    );

    const title = txt(
      heading,
      16,
      color,
      x,
      workflowY + h / 2 - 0.25,
      false,
      w - 0.16
    );

    const rows = values.map((v, j) =>
      txt(
        v,
        24,
        color,
        x,
        workflowY + (1 - j) * (P ? 0.57 : 0.46),
        true
      )
    );

    const footer = txt(
      note,
      14,
      C.muted,
      x,
      workflowY - h / 2 + 0.25,
      false,
      w - 0.18
    );

    return new M.VGroup(
      frame,
      title,
      ...rows,
      footer
    );
  }

  function makeWorkflow() {
    const cards = [
      workflowCard(
        0,
        'DISTANCE',
        ['−2', '0', '+2'],
        C.amber,
        'subtract the mean'
      ),
      workflowCard(
        1,
        'SQUARE',
        ['4', '0', '4'],
        C.violet,
        'remove the signs'
      ),
      workflowCard(
        2,
        'WEIGHT',
        ['1', '0', '1'],
        C.green,
        'multiply by chance'
      )
    ];

    const total = tag(
      'ADD: VARIANCE = 2',
      C.green,
      CX,
      P ? -3.04 : -2.31,
      18
    );

    return {
      cards,
      total
    };
  }

  let workflow = makeWorkflow();

  await until(S(21));
  await play(
    ...replacePicture(
      workflow.cards,
      workflow.total
    ),
    ...say('EXPECTED SQUARED DISTANCE', C.green),
    ...fbox([
      'distance from the mean',
      'square it',
      ['take its expected value', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 22. We met variance before, for data.
  //
  // Show an illustrative data set of four observations:
  // 0, 2, 2, 4.
  //
  // Use population variance for this four-observation example.
  // ----------------------------------------------------------

  const DATA = [0, 2, 2, 4];
  const DATA_BASE = P ? -2.30 : -1.57;
  const DATA_W = P ? 5.75 : 5.92;

  const dataX = v =>
    CX - DATA_W / 2 + 0.45 +
    v / 4 * (DATA_W - 0.90);

  const dataAxis = line(
    [CX - DATA_W / 2, DATA_BASE, 0],
    [CX + DATA_W / 2, DATA_BASE, 0],
    C.muted,
    2.5
  );

  const dataTicks = [0, 1, 2, 3, 4].map(v =>
    txt(
      String(v),
      18,
      C.muted,
      dataX(v),
      DATA_BASE - 0.29,
      true
    )
  );

  const dataDots = DATA.map((v, k) => {
    const earlier = DATA
      .slice(0, k)
      .filter(x => x === v)
      .length;

    const y =
      DATA_BASE + 0.32 + earlier * 0.56;

    return new M.VGroup(
      circle(
        0.21,
        dataX(v),
        y,
        C.violet,
        0.12,
        0
      ),
      dot(
        dataX(v),
        y,
        C.violet,
        0.13
      )
    );
  });

  const dataMean = dashed(
    [dataX(2), DATA_BASE, 0],
    [dataX(2), DATA_BASE + 1.75, 0],
    C.amber
  );

  const dataTitle = tag(
    'EXAMPLE DATA: 0, 2, 2, 4',
    C.violet,
    CX,
    P ? 0.95 : 0.96,
    17
  );

  const dataVariance = txt(
    'Average squared deviation = 2',
    19,
    C.green,
    CX,
    P ? -3.48 : -2.50,
    false,
    6.1
  );

  await until(S(22));
  await play(
    ...replacePicture(
      dataAxis,
      dataTicks,
      dataDots,
      dataMean,
      dataTitle,
      dataVariance
    ),
    ...say('THE SAME IDEA AS VARIANCE IN DATA', C.violet),
    ...fbox([
      'example data: 0, 2, 2, 4',
      '(4 + 0 + 0 + 4) / 4',
      ['= 2', C.green]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 23. Same idea, with probabilities in place of
  // shares of the data.
  // ----------------------------------------------------------

  const DATA_CW = P ? 1.47 : 1.50;
  const DATA_RH = P ? 0.93 : 0.75;
  const DATA_TOP = P ? 0.91 : 0.88;

  const tableX = k =>
    CX + (k - 1.5) * DATA_CW;

  const tableY = k =>
    DATA_TOP - k * DATA_RH;

  function dataCell(s, c, r, color, head = false) {
    const x = tableX(c);
    const y = tableY(r);

    const frame = rect(
      DATA_CW - 0.045,
      DATA_RH - 0.04,
      x,
      y,
      color,
      head ? 0.20 : 0.07,
      1.5
    );

    const value = txt(
      s,
      head ? 15 : 22,
      color,
      x,
      y,
      !head,
      DATA_CW - 0.18
    );

    return new M.VGroup(frame, value);
  }

  const dataCompare = [
    dataCell('PAYOUT', 0, 0, C.muted, true),
    ...VALUES.map((v, k) =>
      dataCell(String(v), k + 1, 0, C.cyan)
    ),

    dataCell('DATA SHARE', 0, 1, C.violet, true),
    ...['1/4', '2/4', '1/4'].map((v, k) =>
      dataCell(v, k + 1, 1, C.violet)
    ),

    dataCell('CHANCE', 0, 2, C.green, true),
    ...FRACTIONS.map((v, k) =>
      dataCell(v, k + 1, 2, C.green)
    )
  ];

  const sameWeight = tag(
    'SAME WEIGHTED-AVERAGE IDEA',
    C.green,
    CX,
    P ? -2.56 : -1.85,
    16
  );

  await until(S(23));
  await play(
    ...replacePicture(
      dataCompare,
      sameWeight
    ),
    ...say('USE CHANCES INSTEAD OF DATA SHARES', C.green),
    ...fbox([
      'data: weight by frequency share',
      ['random variable: weight by chance', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // Two probability plots, sharing the same scales.
  //
  // Spinner:
  // 0, 2, 4 with masses 1/4, 1/2, 1/4.
  //
  // Steady:
  // 2 with mass 1.
  //
  // Both have mean two. Only their spreads differ.
  // ----------------------------------------------------------

  const CMP_DX = P ? 1.69 : 1.72;
  const CMP_W = P ? 2.95 : 3.00;

  const CMP_BASE = P ? -2.60 : -1.83;
  const CMP_H = P ? 3.36 : 2.37;
  const CMP_QH = CMP_H / 4;
  const CMP_BARW = P ? 0.46 : 0.43;

  const CMP_L = CX - CMP_DX;
  const CMP_R = CX + CMP_DX;

  function smallPlot(x, steady = false) {
    const color = steady ? C.green : C.cyan;

    const xFn = v =>
      x - CMP_W / 2 + 0.28 +
      v / 4 * (CMP_W - 0.56);

    const axis = line(
      [x - CMP_W / 2, CMP_BASE, 0],
      [x + CMP_W / 2, CMP_BASE, 0],
      C.muted,
      2
    );

    const ticks = VALUES.map(v =>
      txt(
        String(v),
        18,
        C.ink,
        xFn(v),
        CMP_BASE - 0.25,
        true
      )
    );

    const values = steady ? [2] : VALUES;
    const probs = steady ? [1] : PROBS;
    const labels = steady ? ['1'] : FRACTIONS;

    const bars = values.map((v, k) =>
      probabilityBar(
        v,
        probs[k],
        labels[k],
        color,
        CMP_BASE,
        CMP_QH,
        xFn,
        CMP_BARW
      )
    );

    const meanLine = dashed(
      [xFn(2), CMP_BASE, 0],
      [xFn(2), CMP_BASE + (steady ? CMP_H : CMP_H / 2) - 0.02, 0],
      C.amber
    );

    const topGuide = dashed(
      [
        x - CMP_W / 2,
        CMP_BASE + CMP_H,
        0
      ],
      [
        x + CMP_W / 2,
        CMP_BASE + CMP_H,
        0
      ],
      C.muted
    );

    const title = txt(
      steady ? 'STEADY' : 'SPINNER',
      18,
      color,
      x,
      CMP_BASE + CMP_H + 0.62
    );

    const meanText = tag(
      'MEAN = 2',
      C.amber,
      x,
      CMP_BASE - 0.75,
      15
    );

    return {
      axis,
      ticks,
      bars,
      meanLine,
      topGuide,
      title,
      meanText,
      xFn
    };
  }

  function smallPlotParts(p) {
    return [
      p.axis,
      ...p.ticks,
      ...p.bars.flatMap(b => [b.body, b.label]),
      p.meanLine,
      p.topGuide,
      p.title,
      p.meanText
    ];
  }

  function makeComparison() {
    return {
      spinner: smallPlot(CMP_L, false),
      steady: smallPlot(CMP_R, true)
    };
  }

  function comparisonParts(c) {
    return [
      ...smallPlotParts(c.spinner),
      ...smallPlotParts(c.steady)
    ];
  }

  let comparison = makeComparison();

  const compareVarY = P ? -3.94 : -3.2;

  let spinnerVarianceTag = tag(
    'VARIANCE = 2',
    C.violet,
    CMP_L,
    compareVarY,
    16
  );

  let steadyVarianceTag = tag(
    'VARIANCE = 0',
    C.green,
    CMP_R,
    compareVarY,
    16
  );

  // ----------------------------------------------------------
  // 24. The steady booth has zero variance.
  // Every payout is exactly at the mean.
  // ----------------------------------------------------------

  await until(S(24));
  await play(
    ...replacePicture(
      comparisonParts(comparison),
      spinnerVarianceTag,
      steadyVarianceTag
    ),
    new M.Indicate(steadyVarianceTag, {
      color: C.green,
      runTime: 1.0
    }),
    ...say('STEADY BOOTH: NO DISTANCE FROM THE MEAN', C.green),
    ...fbox([
      'distance = 2 - 2 = 0',
      '0² × 1 = 0',
      ['steady variance = 0', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 25. Now the short version, in one line.
  // ----------------------------------------------------------

  await until(S(25));
  await play(
    ...say('THE SHORT VERSION'),
    ...fbox([
      'variance notation'
    ])
  );

  // ----------------------------------------------------------
  // 26. Var is short for variance.
  // ----------------------------------------------------------

  const NOTY = P ? -0.47 : -0.36;

  const varFrame = rect(
    P ? 5.90 : 6.05,
    P ? 2.60 : 2.25,
    CX,
    NOTY,
    C.green,
    0.07
  );

  const varSymbol = txt(
    'Var',
    45,
    C.green,
    CX,
    NOTY + 0.22,
    true
  );

  const varMeaning = txt(
    'variance',
    23,
    C.ink,
    CX,
    NOTY - 0.63
  );

  await until(S(26));
  await play(
    ...replacePicture(
      varFrame,
      varSymbol,
      varMeaning
    ),
    ...say('VAR = VARIANCE', C.green),
    ...fbox([
      ['Var', C.green],
      'short for variance'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 27. Var(X) = E[(X − E[X])²].
  //
  // Colour-coded nested expression.
  // Amber: distance from the mean.
  // Violet: square.
  // Green: expectation.
  // ----------------------------------------------------------

  const FORM_Y = P ? 0.55 : 0.53;

  function expressionBox(s, y, color, size = 26) {
    const text = txt(
      s,
      size,
      color,
      CX,
      y,
      true,
      P ? 5.65 : 5.85
    );

    const r = rect(
      Math.min(
        P ? 6.1 : 6.25,
        text.getWidth() + 0.55
      ),
      P ? 0.87 : 0.72,
      CX,
      y,
      color,
      0.09
    );

    return new M.VGroup(r, text);
  }

  const fullFormula = expressionBox(
    'Var(X) = E[(X − E[X])²]',
    FORM_Y,
    C.green,
    P ? 28 : 27
  );

  const INSIDE_Y = P ? -0.72 : -0.53;
  const SQUARE_Y = P ? -1.94 : -1.46;
  const EXPECT_Y = P ? -3.16 : -2.39;

  const insideFormula = expressionBox(
    'X − E[X]',
    INSIDE_Y,
    C.amber,
    25
  );

  const squaredFormula = expressionBox(
    '(X − E[X])²',
    SQUARE_Y,
    C.violet,
    25
  );

  const expectedFormula = expressionBox(
    'E[(X − E[X])²]',
    EXPECT_Y,
    C.green,
    25
  );

  const formulaLink1 = arrow(
    [CX, INSIDE_Y - 0.45, 0],
    [CX, SQUARE_Y + 0.45, 0],
    C.violet,
    2,
    0.11
  );

  const formulaLink2 = arrow(
    [CX, SQUARE_Y - 0.45, 0],
    [CX, EXPECT_Y + 0.45, 0],
    C.green,
    2,
    0.11
  );

  await until(S(27));
  await play(
    ...replacePicture(fullFormula),
    ...say('THE VARIANCE FORMULA', C.green),
    ...fbox([
      ['Var = variance', C.green],
      'E = expected value',
      'X = the payout'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 28. Read from the inside out.
  // X − E[X] is the signed distance from the mean.
  // ----------------------------------------------------------

  const insideCaption = txt(
    '1. Distance',
    16,
    C.amber,
    CX - 2.30,
    INSIDE_Y,
    false,
    1.75
  );

  await until(S(28));
  await play(
    ...addPicture(
      insideFormula,
      insideCaption
    ),
    ...say('READ FROM THE INSIDE OUT', C.amber),
    ...fbox([
      ['X − E[X]', C.amber],
      'distance from the mean',
      'here: −2, 0, +2'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 29. Squared gives squared distance.
  // Expectation gives the chance-weighted average.
  // ----------------------------------------------------------

  const squaredCaption = txt(
    '2. Square',
    16,
    C.violet,
    CX - 2.30,
    SQUARE_Y,
    false,
    1.75
  );

  const expectedCaption = txt(
    '3. Average',
    16,
    C.green,
    CX - 2.48,
    EXPECT_Y,
    false,
    1.45
  );

  await until(S(29));
  await play(
    ...addPicture(
      squaredFormula,
      squaredCaption,
      formulaLink1
    ),
    ...say('SQUARE THE DISTANCE', C.violet),
    ...fbox([
      ['(X − E[X])²', C.violet],
      'squared distance',
      'here: 4, 0, 4'
    ], C.violet)
  );

  await until(S(29) + 2.0);
  await play(
    ...addPicture(
      expectedFormula,
      expectedCaption,
      formulaLink2
    ),
    ...say('THEN TAKE ITS EXPECTED VALUE', C.green),
    ...fbox([
      '4 × 1/4 + 0 × 1/2',
      '  + 4 × 1/4',
      '= 1 + 0 + 1',
      ['= 2', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 30. Remember the gap from the previous lesson?
  // E[X²] = 6 and (E[X])² = 4.
  //
  // Use square-unit blocks, not ordinary token coins.
  // These quantities have squared-token units.
  // ----------------------------------------------------------

  const GAPBASE = P ? -3.05 : -2.03;
  const GAPSTEP = P ? 0.51 : 0.40;

  const GAPX1 = CX - 1.58;
  const GAPX2 = CX + 1.58;

  function gapStack(n, x, color) {
    return Array.from({ length: n }, (_, j) =>
      areaCell(
        x,
        GAPBASE + (j + 0.5) * GAPSTEP,
        GAPSTEP * 0.88,
        color
      )
    );
  }

  const gapSix = gapStack(
    6,
    GAPX1,
    C.violet
  );

  const gapFour = gapStack(
    4,
    GAPX2,
    C.amber
  );

  const gapFloor = line(
    [CX - 2.80, GAPBASE, 0],
    [CX + 2.80, GAPBASE, 0],
    C.muted,
    2
  );

  const gapLabel6 = txt(
    'E[X²] = 6',
    21,
    C.violet,
    GAPX1,
    GAPBASE + 6 * GAPSTEP + 0.30,
    true
  );

  const gapLabel4 = txt(
    '(E[X])² = 4',
    20,
    C.amber,
    GAPX2,
    GAPBASE + 4 * GAPSTEP + 0.30,
    true
  );

  const gapGuide = dashed(
    [
      GAPX1 + 0.35,
      GAPBASE + 4 * GAPSTEP,
      0
    ],
    [
      GAPX2 - 0.35,
      GAPBASE + 4 * GAPSTEP,
      0
    ],
    C.muted
  );

  const gapOutline = outline(
    GAPSTEP + 0.13,
    2 * GAPSTEP + 0.05,
    GAPX1,
    GAPBASE + 5 * GAPSTEP,
    C.green
  );

  const gapResult = tag(
    'GAP = 2',
    C.green,
    CX,
    GAPBASE + 5 * GAPSTEP,
    17
  );

  await until(S(30));
  await play(
    ...replacePicture(
      gapSix,
      gapFour,
      gapFloor,
      gapLabel6,
      gapLabel4,
      gapGuide,
      gapOutline,
      gapResult
    ),
    ...say('REMEMBER: SIX MINUS FOUR', C.violet),
    ...fbox([
      'E[X²] = 6',
      '(E[X])² = 4',
      ['gap = 2', C.green]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 31. That gap is exactly the variance.
  //
  // Var(X) = E[X²] − (E[X])²
  //        = 6 − 4
  //        = 2.
  // ----------------------------------------------------------

  const shortcutTag = tag(
    'THE VARIANCE SHORTCUT',
    C.green,
    CX,
    P ? 1.15 : 1.10,
    17
  );

  await until(S(31));
  await play(
    ...addPicture(shortcutTag),
    new M.Indicate(gapOutline, {
      color: C.green,
      runTime: 1.3
    }),
    ...say('THE GAP IS THE VARIANCE', C.green),
    ...fbox([
      ['Var(X) = E[X²] − (E[X])²', C.green],
      '= 6 − 4',
      ['= 2', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 32. Variance is in squared tokens.
  //
  // Visualise two unit-area squares.
  // Keep them distinct from physical token coins.
  // ----------------------------------------------------------

  const UNIT_Y = P ? -0.55 : -0.40;
  const UNIT_S = P ? 0.94 : 0.82;

  const squaredUnitBlocks = [
    areaCell(
      CX - UNIT_S / 2,
      UNIT_Y,
      UNIT_S,
      C.violet
    ),
    areaCell(
      CX + UNIT_S / 2,
      UNIT_Y,
      UNIT_S,
      C.violet
    )
  ];

  const unitHeading = txt(
    'VARIANCE = 2',
    25,
    C.violet,
    CX,
    UNIT_Y + 1.18,
    true
  );

  const unitLabel = txt(
    'squared tokens',
    23,
    C.violet,
    CX,
    UNIT_Y - 0.88
  );

  const dimensionLabel = txt(
    'tokens²',
    30,
    C.violet,
    CX,
    UNIT_Y - 1.48,
    true
  );

  await until(S(32));
  await play(
    ...replacePicture(
      squaredUnitBlocks,
      unitHeading,
      unitLabel,
      dimensionLabel
    ),
    ...say('VARIANCE HAS SQUARED UNITS', C.violet),
    ...fbox([
      ['variance = 2 tokens²', C.violet],
      'harder to picture'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 33. Take the square root to get back to tokens.
  //
  // Rearrange the two unit-area blocks into a square
  // of the same total area, two.
  //
  // The side of this square is √2 token units.
  // ----------------------------------------------------------

  const SQRT_SIDE = UNIT_S * Math.sqrt(2);
  const SQRT_X = CX;
  const SQRT_Y = UNIT_Y;

  const sqrtLeft = rect(
    SQRT_SIDE / 2,
    SQRT_SIDE,
    SQRT_X - SQRT_SIDE / 4,
    SQRT_Y,
    C.violet,
    0.68
  );

  const sqrtRight = rect(
    SQRT_SIDE / 2,
    SQRT_SIDE,
    SQRT_X + SQRT_SIDE / 4,
    SQRT_Y,
    C.violet,
    0.68
  );

  const sqrtSquare = outline(
    SQRT_SIDE,
    SQRT_SIDE,
    SQRT_X,
    SQRT_Y,
    C.violet
  );

  const sqrtAreaText = txt(
    'area 2',
    20,
    C.bg,
    SQRT_X,
    SQRT_Y,
    false,
    SQRT_SIDE - 0.14
  );

  const rulerY =
    SQRT_Y - SQRT_SIDE / 2 - 0.32;

  const sideRuler = new M.VGroup(
    line(
      [SQRT_X - SQRT_SIDE / 2, rulerY, 0],
      [SQRT_X + SQRT_SIDE / 2, rulerY, 0],
      C.green,
      3
    ),
    line(
      [
        SQRT_X - SQRT_SIDE / 2,
        rulerY - 0.08,
        0
      ],
      [
        SQRT_X - SQRT_SIDE / 2,
        rulerY + 0.08,
        0
      ],
      C.green,
      2
    ),
    line(
      [
        SQRT_X + SQRT_SIDE / 2,
        rulerY - 0.08,
        0
      ],
      [
        SQRT_X + SQRT_SIDE / 2,
        rulerY + 0.08,
        0
      ],
      C.green,
      2
    )
  );

  const sqrtSideLabel = txt(
    '√2 tokens',
    24,
    C.green,
    CX,
    rulerY - 0.34,
    true
  );

  const sdHeading = txt(
    'STANDARD DEVIATION',
    20,
    C.green,
    CX,
    UNIT_Y + SQRT_SIDE / 2 + 0.43
  );

  await until(S(33));
  await play(
    ...replacePicture(
      sqrtLeft,
      sqrtRight,
      sqrtSquare,
      sqrtAreaText,
      sideRuler,
      sqrtSideLabel,
      sdHeading
    ),
    ...say('SQUARE ROOT: BACK TO TOKENS', C.green),
    ...fbox([
      'standard deviation',
      ['SD(X) = √Var(X)', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 34. √2 ≈ 1.4 tokens.
  // Display the more precise value 1.41 on screen.
  // ----------------------------------------------------------

  const sdApprox = tag(
    '≈ 1.41 TOKENS',
    C.green,
    CX,
    P ? -3.00 : -2.39,
    21
  );

  await until(S(34));
  await play(
    ...addPicture(sdApprox),
    new M.Indicate(sqrtSideLabel, {
      color: C.green,
      runTime: 0.95
    }),
    ...say('STANDARD DEVIATION ≈ 1.4 TOKENS', C.green),
    ...fbox([
      'SD(X) = √2',
      ['≈ 1.41 tokens', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 35. Half the time the payout is right on two.
  // Half the time it is two tokens away.
  //
  // Picture four equal quarters of probability:
  // two blue quarters at distance zero,
  // one grey and one gold quarter at distance two.
  // ----------------------------------------------------------

  const DISTY = P ? -0.67 : -0.46;
  const DISTDX = P ? 1.68 : 1.70;
  const DISTW = P ? 2.94 : 2.98;
  const DISTH = P ? 3.65 : 3.00;

  function chanceChip(x, y, color, label) {
    const r = rect(
      1.18,
      P ? 0.75 : 0.64,
      x,
      y,
      color,
      0.24
    );

    const name = txt(
      label,
      14,
      color,
      x,
      y + 0.15
    );

    const chance = txt(
      '1/4',
      19,
      C.ink,
      x,
      y - 0.15,
      true
    );

    return new M.VGroup(
      r,
      name,
      chance
    );
  }

  function absoluteDistanceCard(x, onMean) {
    const color = onMean ? C.green : C.violet;

    const frame = rect(
      DISTW,
      DISTH,
      x,
      DISTY,
      color,
      0.07
    );

    const heading = txt(
      onMean ? 'ON THE MEAN' : 'AWAY FROM MEAN',
      17,
      color,
      x,
      DISTY + DISTH / 2 - 0.29,
      false,
      DISTW - 0.19
    );

    const distance = txt(
      onMean ? '0 tokens' : '2 tokens',
      23,
      color,
      x,
      DISTY + DISTH * 0.22,
      true
    );

    const chipY = DISTY - 0.06;

    const chips = onMean
      ? [
          chanceChip(
            x - 0.65,
            chipY,
            BLUE,
            'BLUE 1'
          ),
          chanceChip(
            x + 0.65,
            chipY,
            BLUE,
            'BLUE 2'
          )
        ]
      : [
          chanceChip(
            x - 0.65,
            chipY,
            GREY,
            'GREY'
          ),
          chanceChip(
            x + 0.65,
            chipY,
            GOLD,
            'GOLD'
          )
        ];

    const total = txt(
      '1/2 chance',
      22,
      C.cyan,
      x,
      DISTY - DISTH * 0.34,
      true
    );

    return new M.VGroup(
      frame,
      heading,
      distance,
      ...chips,
      total
    );
  }

  const onMeanCard = absoluteDistanceCard(
    CX - DISTDX,
    true
  );

  const awayCard = absoluteDistanceCard(
    CX + DISTDX,
    false
  );

  await until(S(35));
  await play(
    ...replacePicture(
      onMeanCard,
      awayCard
    ),
    ...say('HALF ON TARGET · HALF TWO AWAY'),
    ...fbox([
      'distance 0: chance 1/2',
      'distance 2: chance 1/2'
    ])
  );

  // ----------------------------------------------------------
  // 36. Standard deviation summarises the swing.
  //
  // Mark mean ± one standard deviation on the number line.
  // This is a scale for spread, not a guaranteed interval.
  // ----------------------------------------------------------

  plot = makePlot();

  const sdLeftValue = MEAN - SD;
  const sdRightValue = MEAN + SD;

  const sdBandY = P ? -3.73 : -2.08;

  const sdBand = rect(
    plotX(sdRightValue) - plotX(sdLeftValue),
    P ? 0.31 : 0.23,
    plotX(MEAN),
    sdBandY,
    C.green,
    0.24
  );

  const sdLeftArrow = arrow(
    [plotX(MEAN), sdBandY, 0],
    [plotX(sdLeftValue), sdBandY, 0],
    C.green,
    3,
    0.14
  );

  const sdRightArrow = arrow(
    [plotX(MEAN), sdBandY, 0],
    [plotX(sdRightValue), sdBandY, 0],
    C.green,
    3,
    0.14
  );

  const sdScaleLabels = [
    txt(
      '1.41',
      19,
      C.green,
      (plotX(MEAN) + plotX(sdLeftValue)) / 2,
      sdBandY - 0.33,
      true
    ),
    txt(
      '1.41',
      19,
      C.green,
      (plotX(MEAN) + plotX(sdRightValue)) / 2,
      sdBandY - 0.33,
      true
    )
  ];

  await until(S(36));
  await play(
    ...replacePicture(
      plotParts(plot),
      sdBand,
      sdLeftArrow,
      sdRightArrow,
      sdScaleLabels
    ),
    ...say('ONE NUMBER SUMMARISES THE SWING', C.green),
    ...fbox([
      'square root of variance',
      ['SD(X) ≈ 1.41 tokens', C.green],
      'a scale for spread'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 37. What is variance for?
  // It measures variability, one aspect of risk.
  //
  // Use a payout sequence and its fixed mean line.
  // The sequence is illustrative, not a prediction.
  // ----------------------------------------------------------

  const RISK_VALUES = [0, 4, 2, 0, 4, 2, 2, 4];

  const RISKBASE = P ? -3.40 : -2.06;
  const RISKH = P ? 4.40 : 2.99;
  const RISKW = P ? 5.50 : 5.65;

  const riskX = k =>
    CX - RISKW / 2 +
    k / (RISK_VALUES.length - 1) * RISKW;

  const riskY = v =>
    RISKBASE + v / 4 * RISKH;

  const riskLeft = riskX(0) - 0.30;
  const riskRight = riskX(7) + 0.19;

  const riskAxisX = line(
    [riskLeft, RISKBASE, 0],
    [riskRight, RISKBASE, 0],
    C.muted,
    2
  );

  const riskAxisY = line(
    [riskLeft, RISKBASE, 0],
    [riskLeft, riskY(4) + 0.10, 0],
    C.muted,
    2
  );

  const riskYTicks = VALUES.map(v =>
    txt(
      String(v),
      17,
      C.muted,
      riskLeft - 0.23,
      riskY(v),
      true
    )
  );

  const riskXTicks = RISK_VALUES.map((_, k) =>
    txt(
      String(k + 1),
      15,
      C.muted,
      riskX(k),
      RISKBASE - 0.25,
      true
    )
  );

  const riskMean = dashed(
    [riskLeft, riskY(2), 0],
    [riskRight, riskY(2), 0],
    C.amber
  );

  const riskMeanLabel = tag(
    'MEAN = 2',
    C.amber,
    CX,
    riskY(2) + 0.32,
    15
  );

  const riskTitle = txt(
    'Example spinner payouts',
    18,
    C.cyan,
    CX,
    riskY(4) + 0.39
  );

  const riskUnit = txt(
    'play number',
    16,
    C.muted,
    CX,
    RISKBASE - 0.65
  );

  const riskSegments = RISK_VALUES
    .slice(1)
    .map((v, k) =>
      line(
        [riskX(k), riskY(RISK_VALUES[k]), 0],
        [riskX(k + 1), riskY(v), 0],
        C.cyan,
        3
      )
    );

  const riskDots = RISK_VALUES.map((v, k) =>
    dot(
      riskX(k),
      riskY(v),
      C.cyan,
      0.085
    )
  );

  const riskDeviations = RISK_VALUES
    .map((v, k) => ({ v, k }))
    .filter(({ v }) => v !== MEAN)
    .map(({ v, k }) =>
      arrow(
        [riskX(k), riskY(MEAN), 0],
        [riskX(k), riskY(v), 0],
        C.violet,
        2,
        0.11
      )
    );

  const riskAxes = [
    riskAxisX,
    riskAxisY,
    riskYTicks,
    riskXTicks,
    riskMean,
    riskMeanLabel,
    riskTitle,
    riskUnit
  ];

  await until(S(37));
  await play(
    ...replacePicture(riskAxes),
    ...say('VARIANCE MEASURES HOW MUCH RESULTS SWING', C.violet),
    ...fbox([
      'larger variance',
      ['more spread around the mean', C.violet],
      'one measure of risk'
    ], C.violet)
  );

  const riskAnimation = [
    new M.FadeIn(riskDots[0])
  ];

  for (let k = 0; k < riskSegments.length; k++) {
    riskAnimation.push(
      new M.Create(riskSegments[k])
    );

    riskAnimation.push(
      new M.FadeIn(riskDots[k + 1])
    );
  }

  register(
    riskSegments,
    riskDots,
    riskDeviations
  );

  await play(
    new M.LaggedStart(
      riskAnimation,
      {
        lagRatio: 0.15,
        runTime: 2.0
      }
    ),
    ...appear(riskDeviations)
  );

  // ----------------------------------------------------------
  // 38. Two choices can have the same expected value
  // but very different risk.
  // Return to the two distributions with identical axes.
  // ----------------------------------------------------------

  comparison = makeComparison();

  spinnerVarianceTag = tag(
    'VARIANCE = 2',
    C.violet,
    CMP_L,
    compareVarY,
    16
  );

  steadyVarianceTag = tag(
    'VARIANCE = 0',
    C.green,
    CMP_R,
    compareVarY,
    16
  );

  await until(S(38));
  await play(
    ...replacePicture(
      comparisonParts(comparison),
      spinnerVarianceTag,
      steadyVarianceTag
    ),
    ...say('SAME EXPECTED VALUE · DIFFERENT RISK', C.violet),
    ...fbox([
      'spinner: mean 2, variance 2',
      'steady: mean 2, variance 0',
      ['same centre, different spread', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 39. Common trap:
  // Bigger variance does not mean a bigger average payout.
  // ----------------------------------------------------------

  await until(S(39));
  await play(
    new M.Indicate(spinnerVarianceTag, {
      color: C.amber,
      runTime: 1.1
    }),
    new M.Indicate(steadyVarianceTag, {
      color: C.amber,
      runTime: 1.1
    }),
    ...say('TRAP: BIGGER VARIANCE ≠ BIGGER MEAN', C.amber),
    ...fbox([
      ['variance measures spread', C.violet],
      ['mean measures centre', C.amber],
      'they are different'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 40. Both booths pay two on average.
  // Only the swings differ.
  // ----------------------------------------------------------

  const sameMeanGuide = dashed(
    [
      comparison.spinner.xFn(2),
      CMP_BASE - 0.75,
      0
    ],
    [
      comparison.steady.xFn(2),
      CMP_BASE - 0.75,
      0
    ],
    C.amber
  );

  await until(S(40));
  await play(
    new M.Indicate(comparison.spinner.meanText, {
      color: C.amber,
      runTime: 1.0
    }),
    new M.Indicate(comparison.steady.meanText, {
      color: C.amber,
      runTime: 1.0
    }),
    ...say('BOTH AVERAGE TWO. ONLY THE SWINGS DIFFER.', C.green),
    ...fbox([
      ['E[X] = 2 for both', C.amber],
      'spinner SD ≈ 1.41',
      ['steady SD = 0', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 41. Preview the next lesson:
  // look at both rounds of the game together.
  //
  // Round one payout X is cyan.
  // Round two payout Y is pink.
  // Both use the original four-slice spinner.
  // ----------------------------------------------------------

  const ROUND_DX = P ? 1.65 : 1.72;
  const ROUND_Y = P ? -0.44 : -0.32;
  const ROUND_R = P ? 1.16 : 1.04;

  function roundPicture(x, name, variable, color) {
    const frame = outline(
      P ? 2.99 : 3.02,
      P ? 3.65 : 3.12,
      x,
      ROUND_Y,
      color
    );

    const spinner = wheel(
      x,
      ROUND_Y + 0.12,
      ROUND_R
    );

    const heading = txt(
      name,
      18,
      color,
      x,
      ROUND_Y + (P ? 1.50 : 1.28)
    );

    const payout = txt(
      variable,
      27,
      color,
      x,
      ROUND_Y - (P ? 1.47 : 1.25),
      true
    );

    return new M.VGroup(
      frame,
      spinner,
      heading,
      payout
    );
  }

  const roundOne = roundPicture(
    CX - ROUND_DX,
    'ROUND ONE',
    'X',
    C.cyan
  );

  const roundTwo = roundPicture(
    CX + ROUND_DX,
    'ROUND TWO',
    'Y',
    PINK
  );

  const twoRoundsTag = tag(
    'LOOK AT BOTH PAYOUTS',
    C.violet,
    CX,
    P ? -3.06 : -2.35,
    17
  );

  await until(S(41));
  await play(
    ...replacePicture(
      roundOne,
      roundTwo,
      twoRoundsTag
    ),
    ...say('NEXT: BOTH ROUNDS AT ONCE', C.violet),
    ...fbox([
      ['X = round one payout', C.cyan],
      ['Y = round two payout', PINK],
      'look at them together'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 42. Final definition.
  //
  // Variance is the chance-weighted average of squared
  // distances from the expected value.
  //
  // Return to the original spinner calculation.
  // ----------------------------------------------------------

  const FINALW = P ? 6.35 : 6.40;
  const FCW = FINALW / 4;
  const FRH = P ? 0.93 : 0.74;
  const FTOP = P ? 1.03 : 0.94;

  const finalX = k =>
    CX + (k - 1.5) * FCW;

  const finalY = k =>
    FTOP - k * FRH;

  function finalCell(s, c, r, color, head = false) {
    const x = finalX(c);
    const y = finalY(r);

    const frame = new M.Rectangle({
      width: FCW - 0.045,
      height: FRH - 0.045,
      color,
      strokeWidth: head ? 2 : 1.5
    });

    frame.setFill(
      head ? color : C.card,
      head ? 0.17 : 0.88
    );

    frame.moveTo([x, y, 0]);

    const label = txt(
      s,
      head ? 15 : 23,
      color,
      x,
      y,
      !head,
      FCW - 0.17
    );

    return new M.VGroup(
      frame,
      label
    );
  }

  const finalHeadings = [
    finalCell('DISTANCE', 0, 0, C.amber, true),
    finalCell('SQUARED', 1, 0, C.violet, true),
    finalCell('CHANCE', 2, 0, C.cyan, true),
    finalCell('WEIGHTED', 3, 0, C.green, true)
  ];

  const finalRows = VALUES.map((_, k) => [
    finalCell(
      signed(DEVIATIONS[k]),
      0,
      k + 1,
      C.amber
    ),
    finalCell(
      String(SQUARED[k]),
      1,
      k + 1,
      C.violet
    ),
    finalCell(
      FRACTIONS[k],
      2,
      k + 1,
      C.cyan
    ),
    finalCell(
      String(WEIGHTED[k]),
      3,
      k + 1,
      C.green
    )
  ]);

  const finalVariance = tag(
    'VARIANCE = 1 + 0 + 1 = 2',
    C.green,
    CX,
    P ? -2.81 : -2.17,
    18
  );

  const finalSD = txt(
    'Standard deviation = √2 ≈ 1.41 tokens',
    17,
    C.green,
    CX,
    P ? -3.51 : -2.72,
    false,
    6.15
  );

  const finalSquareOutline = outline(
    FCW + 0.06,
    3 * FRH + 0.04,
    finalX(1),
    finalY(2),
    C.violet
  );

  const finalWeightOutline = outline(
    FCW + 0.06,
    3 * FRH + 0.04,
    finalX(3),
    finalY(2),
    C.green
  );

  await until(S(42));
  await play(
    ...replacePicture(
      finalHeadings,
      finalRows,
      finalVariance,
      finalSD
    ),
    ...say('VARIANCE: EXPECTED SQUARED DISTANCE', C.green),
    ...fbox([
      ['Var(X) = E[(X − E[X])²]', C.green],
      '= 4×1/4 + 0×1/2 + 4×1/4',
      ['= 2 squared tokens', C.green]
    ], C.green)
  );

  await until(S(42) + 1.8);

  register(finalSquareOutline);

  await play(
    new M.Create(finalSquareOutline, {
      runTime: 0.6
    }),
    ...say('SQUARED DISTANCES FROM THE MEAN', C.violet)
  );

  await until(S(42) + 3.6);

  register(finalWeightOutline);

  await play(
    new M.Create(finalWeightOutline, {
      runTime: 0.6
    }),
    new M.Indicate(finalVariance, {
      color: C.green,
      runTime: 0.8
    }),
    ...say('WEIGHT BY CHANCE, THEN ADD', C.green),
    ...fbox([
      'distance from the mean',
      'square each distance',
      ['weight by chance and add', C.green]
    ], C.green)
  );

  await until(E(42));
}

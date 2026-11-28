// lesson 4.3.9
// Variance of a sum: how the link between two rounds changes total risk.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback not runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ----------------------------------------------------------
  // Shared chapter data.
  // ----------------------------------------------------------

  const VALUES = [0, 2, 4];
  const PROBS = [1 / 4, 1 / 2, 1 / 4];
  const FRACTIONS = ['1/4', '1/2', '1/4'];

  const TOTALS = [0, 2, 4, 6, 8];

  const NORMAL = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];

  const REPEAT = [
    [4, 0, 0],
    [0, 8, 0],
    [0, 0, 4]
  ];

  const MIRROR = [
    [0, 0, 4],
    [0, 8, 0],
    [4, 0, 0]
  ];

  const NORMAL_COUNTS = [1, 4, 6, 4, 1];
  const REPEAT_COUNTS = [4, 0, 8, 0, 4];
  const MIRROR_COUNTS = [0, 0, 16, 0, 0];

  const NORMAL_DEV = [-4, -2, 0, 2, 4];
  const NORMAL_SQ = [16, 4, 0, 4, 16];
  const NORMAL_WEIGHTED = [16, 16, 0, 16, 16];

  const REPEAT_TOTALS = [0, 4, 8];
  const REPEAT_DEV = [-4, 0, 4];
  const REPEAT_SQ = [16, 0, 16];
  const REPEAT_WEIGHTED = [4, 0, 4];

  const DEV = [-2, 0, 2];

  const MEAN_X = 2;
  const MEAN_Y = 2;
  const MEAN_T = 4;

  const VAR_X = 2;
  const VAR_Y = 2;

  const COV_NORMAL = 0;
  const COV_REPEAT = 2;
  const COV_MIRROR = -2;

  const VAR_NORMAL = 4;
  const VAR_REPEAT = 8;
  const VAR_MIRROR = 0;

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';
  const PINK = C.pink || '#F472B6';

  const XC = C.cyan;
  const YC = PINK;
  const TC = GOLD;
  const VC = C.violet;

  const NORMAL_C = XC;
  const REPEAT_C = VC;
  const MIRROR_C = C.green;

  const COL = [GREY, BLUE, BLUE, GOLD];

  // ----------------------------------------------------------
  // Laptop and phone layout.
  // ----------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const MAINY = P ? -0.72 : -0.45;

  const say = (s, c = XC) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o, {
      runTime: 0.45
    }));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o, {
      runTime: 0.45
    }));

  // Track live objects individually.
  // Never regroup objects that are already on screen.

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
  // Drawing helpers.
  // ----------------------------------------------------------

  function txt(
    s,
    size,
    color,
    x,
    y,
    mono = false,
    maxw = null
  ) {
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

  function rect(
    w,
    h,
    x,
    y,
    color,
    opacity = 0.10,
    sw = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function outline(w, h, x, y, color = C.amber) {
    return rect(w, h, x, y, color, 0, 2.5);
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

  function tag(s, color, x, y, size = 17, maxw = null) {
    const p = pill(s, color, size);

    const limit = maxw || (P ? FW - 1.1 : 6.5);

    if (p.getWidth() > limit) {
      p.scale(limit / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function arrow(a, b, color = XC, sw = 3, tip = 0.14) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);

    if (d < 0.0001) {
      return dot(a[0], a[1], color, 0.07);
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
  // Formula box: approved reference style.
  // ----------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = XC) {
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

    const a = [
      new M.FadeIn(g, { runTime: 0.45 })
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow, { runTime: 0.45 })
      );
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [
      new M.FadeOut(boxNow, { runTime: 0.45 })
    ];

    boxNow = null;

    return a;
  }

  // ----------------------------------------------------------
  // Gold token coins.
  // ----------------------------------------------------------

  function coin(x, y, r = 0.18) {
    const glow = circle(
      r * 1.45,
      x,
      y,
      GOLD,
      0.11,
      0
    );

    const face = circle(
      r,
      x,
      y,
      GOLD,
      0.88,
      2
    );

    const rim = circle(
      r * 0.73,
      x,
      y,
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

  function coinGrid(
    n,
    x,
    y,
    cols = Math.max(1, Math.ceil(Math.sqrt(n))),
    r = 0.15,
    pitch = r * 2.65
  ) {
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

    const rows = Math.ceil(n / cols);

    return new M.VGroup(
      ...Array.from({ length: n }, (_, k) => {
        const row = Math.floor(k / cols);
        const col = k % cols;
        const rowCount = Math.min(cols, n - row * cols);

        return coin(
          x + (col - (rowCount - 1) / 2) * pitch,
          y + ((rows - 1) / 2 - row) * pitch,
          r
        );
      })
    );
  }

  function coins(n, x, y, r = 0.16) {
    return coinGrid(
      n,
      x,
      y,
      Math.max(1, n),
      r
    );
  }

  // ----------------------------------------------------------
  // Original spinner: four equal slices.
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
    return new M.VGroup(
      ...COL.map((_, k) =>
        sector(k, cx, cy, r)
      ),

      circle(
        r + 0.015,
        cx,
        cy,
        C.ink,
        0,
        2
      ),

      arrow(
        polar(cx, cy, r * 0.03, a),
        polar(cx, cy, r * 0.87, a),
        C.ink,
        3,
        r * 0.17
      ),

      circle(
        r * 0.075,
        cx,
        cy,
        C.ink,
        1,
        1
      )
    );
  }

  // ----------------------------------------------------------
  // Probability plot helpers.
  //
  // One common vertical scale: probability 1 is full height.
  // All comparisons use identical scales.
  // ----------------------------------------------------------

  function probabilityBar(
    x,
    base,
    probability,
    width,
    height,
    color,
    label,
    labelSize = 20
  ) {
    const h = probability * height;

    const glow = new M.Rectangle({
      width: width + 0.14,
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
      strokeWidth: 1.8
    });

    body.setFill(color, 0.76);
    body.moveTo([x, base + h / 2, 0]);

    const text = txt(
      label,
      labelSize,
      color,
      x,
      base + h + 0.24,
      true
    );

    return {
      body: new M.VGroup(glow, body),
      label: text
    };
  }

  function makePlot({
    center = CX,
    width = 6.10,
    base = P ? -3.20 : -1.93,
    height = P ? 4.10 : 2.75,
    maximum = 8,
    values = TOTALS,
    probabilities,
    labels,
    color = TC,
    mean = 4,
    title = 'TOTAL PAYOUT',
    unit = 'tokens',
    barWidth = 0.67,
    labelSize = 20,
    compact = false
  }) {
    const inset = compact ? 0.23 : 0.42;

    const px = v =>
      center - width / 2 + inset +
      v / maximum * (width - 2 * inset);

    const axis = line(
      [center - width / 2, base, 0],
      [center + width / 2, base, 0],
      C.muted,
      2
    );

    const ticks = [];

    const step = compact ? 2 : 1;

    for (let v = 0; v <= maximum; v += step) {
      ticks.push(
        new M.VGroup(
          line(
            [px(v), base - 0.05, 0],
            [px(v), base + 0.05, 0],
            C.muted,
            1.2
          ),

          txt(
            String(v),
            compact ? 15 : 18,
            values.includes(v) ? C.ink : C.muted,
            px(v),
            base - 0.23,
            true
          )
        )
      );
    }

    const bars = [];

    values.forEach((v, k) => {
      if (probabilities[k] <= 0) return;

      bars.push({
        value: v,

        ...probabilityBar(
          px(v),
          base,
          probabilities[k],
          barWidth,
          height,
          color,
          labels[k],
          labelSize
        )
      });
    });

    const meanGuide = dashed(
      [px(mean), base, 0],
      [px(mean), base + height, 0],
      C.amber
    );

    const heading = txt(
      title,
      compact ? 16 : 19,
      color,
      center,
      base + height + 0.52,
      false,
      width
    );

    const unitLabel = txt(
      unit,
      compact ? 14 : 16,
      C.muted,
      center,
      base - 0.57
    );

    const meanLabel = tag(
      `MEAN = ${mean}`,
      C.amber,
      center,
      base - (compact ? 0.96 : 1.00),
      compact ? 14 : 17,
      width
    );

    return {
      px,
      base,
      height,
      bars,

      parts: [
        axis,
        ticks,
        bars.flatMap(b => [b.body, b.label]),
        meanGuide,
        heading,
        unitLabel,
        meanLabel
      ],

      meanGuide,
      meanLabel
    };
  }

  function totalPlot(counts, title, color = TC) {
    return makePlot({
      values: TOTALS,
      probabilities: counts.map(n => n / 16),
      labels: counts.map(n => `${n}/16`),
      title,
      color
    });
  }

  function makeMarginalPair() {
    const width = 3.02;
    const dx = 1.67;

    const base = P ? -2.65 : -1.64;
    const height = P ? 3.60 : 2.35;

    const common = {
      width,
      base,
      height,
      maximum: 4,
      values: VALUES,
      probabilities: PROBS,
      labels: FRACTIONS,
      mean: 2,
      barWidth: 0.47,
      labelSize: 18,
      compact: true
    };

    return [
      makePlot({
        ...common,
        center: CX - dx,
        color: XC,
        title: 'ROUND ONE: X',
        unit: 'X (tokens)'
      }),

      makePlot({
        ...common,
        center: CX + dx,
        color: YC,
        title: 'ROUND TWO: Y',
        unit: 'Y (tokens)'
      })
    ];
  }

  // ----------------------------------------------------------
  // Three game versions: opening cards.
  // ----------------------------------------------------------

  const GAME_SP = 2.10;
  const GAME_W = 1.94;
  const GAME_H = P ? 3.85 : 3.18;

  const GAME_X = k =>
    CX + (k - 1) * GAME_SP;

  function gameCard(k, name, rule, color) {
    const x = GAME_X(k);
    const y = MAINY;

    const wheelY = y + GAME_H * 0.13;
    const nodeY = y - GAME_H * 0.20;

    const parts = [
      rect(
        GAME_W,
        GAME_H,
        x,
        y,
        color,
        0.07
      ),

      txt(
        name,
        17,
        color,
        x,
        y + GAME_H / 2 - 0.29,
        false,
        GAME_W - 0.18
      )
    ];

    if (k === 0) {
      parts.push(
        wheel(x - 0.43, wheelY, 0.36),
        wheel(x + 0.43, wheelY, 0.36)
      );
    } else {
      parts.push(
        wheel(x, wheelY, 0.48)
      );
    }

    parts.push(
      txt(
        'X',
        26,
        XC,
        x - 0.46,
        nodeY,
        true
      ),

      txt(
        'Y',
        26,
        YC,
        x + 0.46,
        nodeY,
        true
      ),

      txt(
        rule,
        P ? 20 : 18,
        color,
        x,
        y - GAME_H / 2 + 0.28,
        true,
        GAME_W - 0.18
      )
    );

    if (k !== 0) {
      parts.push(
        arrow(
          [x - 0.24, nodeY, 0],
          [x + 0.24, nodeY, 0],
          color,
          2.2,
          0.10
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const gameCards = [
    gameCard(0, 'NORMAL', 'Independent', NORMAL_C),
    gameCard(1, 'REPEAT', 'Y = X', REPEAT_C),
    gameCard(2, 'MIRROR', 'Y = 4 − X', MIRROR_C)
  ];

  // ----------------------------------------------------------
  // 0. The booth owner compares three versions.
  // ----------------------------------------------------------

  await until(S(0));
  await play(
    ...replacePicture(gameCards),
    ...say('THREE VERSIONS OF THE SAME GAME')
  );

  // ----------------------------------------------------------
  // 1. Each round has the same payouts and chances.
  // ----------------------------------------------------------

  let marginalPair = makeMarginalPair();

  await until(S(1));
  await play(
    ...replacePicture(
      marginalPair.map(p => p.parts)
    ),
    ...say('SAME PAYOUTS · SAME CHANCES'),
    ...fbox([
      '0, 2, 4 tokens',
      ['chances: 1/4, 1/2, 1/4', XC]
    ])
  );

  // ----------------------------------------------------------
  // 2. Each round has mean two and variance two.
  // ----------------------------------------------------------

  const marginalVarianceTags = [
    tag(
      'VARIANCE = 2',
      XC,
      CX - 1.67,
      P ? -4.12 : -2.92,
      15
    ),

    tag(
      'VARIANCE = 2',
      YC,
      CX + 1.67,
      P ? -4.12 : -2.92,
      15
    )
  ];

  await until(S(2));
  await play(
    ...addPicture(marginalVarianceTags),
    ...say('EACH ROUND: MEAN 2 · VARIANCE 2'),
    ...fbox([
      ['E[X] = 2, Var(X) = 2', XC],
      ['E[Y] = 2, Var(Y) = 2', YC]
    ])
  );

  // ----------------------------------------------------------
  // 3. Expected total is always four.
  // ----------------------------------------------------------

  function meanPart(x, name, n, color) {
    return new M.VGroup(
      rect(
        1.80,
        P ? 2.60 : 2.22,
        x,
        MAINY,
        color,
        0.09
      ),

      txt(
        name,
        22,
        color,
        x,
        MAINY + 0.78,
        true
      ),

      coinGrid(
        n,
        x,
        MAINY,
        2,
        0.19,
        0.48
      ),

      txt(
        `${n} tokens`,
        18,
        color,
        x,
        MAINY - 0.77,
        true
      )
    );
  }

  function expectedTotalPicture() {
    return [
      meanPart(CX - 2.18, 'E[X]', 2, XC),
      meanPart(CX, 'E[Y]', 2, YC),
      meanPart(CX + 2.18, 'E[T]', 4, TC),

      txt(
        '+',
        25,
        C.ink,
        CX - 1.09,
        MAINY,
        true
      ),

      txt(
        '=',
        25,
        C.ink,
        CX + 1.09,
        MAINY,
        true
      )
    ];
  }

  const allMeansTag = tag(
    'ALL THREE GAMES: EXPECTED TOTAL = 4',
    C.green,
    CX,
    P ? -3.02 : -2.30,
    17
  );

  await until(S(3));
  await play(
    ...replacePicture(
      expectedTotalPicture(),
      allMeansTag
    ),
    ...say('EXPECTED TOTAL IS ALWAYS FOUR', C.green),
    ...fbox([
      'E[T] = E[X] + E[Y]',
      ['= 2 + 2 = 4', TC]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 4. How much does the total swing?
  // ----------------------------------------------------------

  const swingQuestion = txt(
    'How much can the total swing?',
    22,
    VC,
    CX,
    P ? 1.08 : 1.12,
    false,
    6.15
  );

  await until(S(4));
  await play(
    ...addPicture(swingQuestion),
    ...say('SAME AVERAGE. SAME RISK?', C.amber),
    ...fbox([
      'E[T] = 4 in every game',
      ['Var(T) = ?', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Joint table helper.
  //
  // Interior entries are counts in sixteenths.
  // Rows X are cyan. Columns Y are pink.
  // ----------------------------------------------------------

  function jointTable(
    matrix,
    center = CX,
    cellW = 1.38,
    cellH = P ? 0.94 : 0.72,
    centerY = MAINY,
    title = '',
    color = VC,
    mode = 'count'
  ) {
    const xx = j => center + (j - 1) * cellW;
    const yy = i => centerY + (1 - i) * cellH;

    const rowX = xx(0) - cellW * 0.85;
    const colY = yy(0) + cellH * 0.80;

    const parts = [];
    const entries = [];

    parts.push(
      txt(
        'X',
        20,
        XC,
        rowX,
        colY,
        true
      ),

      txt(
        'Y',
        20,
        YC,
        xx(1),
        colY + 0.40,
        true
      )
    );

    for (let k = 0; k < 3; k++) {
      parts.push(
        txt(
          String(VALUES[k]),
          21,
          XC,
          rowX,
          yy(k),
          true
        ),

        txt(
          String(VALUES[k]),
          21,
          YC,
          xx(k),
          colY,
          true
        )
      );
    }

    for (let i = 0; i < 3; i++) {
      entries[i] = [];

      for (let j = 0; j < 3; j++) {
        const n = matrix[i][j];

        const prod =
          (VALUES[i] - MEAN_X) *
          (VALUES[j] - MEAN_Y);

        const entryColor = mode === 'product'
          ? prod > 0
            ? C.green
            : prod < 0
              ? C.amber
              : C.muted
          : n === 0
            ? C.muted
            : color;

        const frame = rect(
          cellW - 0.045,
          cellH - 0.045,
          xx(j),
          yy(i),
          entryColor,
          n === 0 ? 0.025 : 0.12 + n * 0.04,
          1.5
        );

        const value = mode === 'product'
          ? signed(prod)
          : String(n);

        const label = txt(
          value,
          mode === 'product' ? 22 : 25,
          entryColor,
          xx(j),
          yy(i) + (mode === 'product' ? 0.13 : 0),
          true,
          cellW - 0.14
        );

        const pieces = [frame, label];

        if (mode === 'product') {
          pieces.push(
            txt(
              `${n}/16`,
              P ? 16 : 15,
              C.ink,
              xx(j),
              yy(i) - 0.20,
              true
            )
          );
        }

        const g = new M.VGroup(...pieces);

        entries[i][j] = g;
        parts.push(g);
      }
    }

    if (title) {
      parts.push(
        txt(
          title,
          17,
          color,
          center,
          centerY - cellH * 1.87,
          false,
          6.2
        )
      );
    }

    return {
      parts,
      entries,
      xx,
      yy,
      cellW,
      cellH
    };
  }

  // ----------------------------------------------------------
  // 5. Normal game: two independent spins.
  // ----------------------------------------------------------

  const normalWheelX = wheel(
    CX - 1.65,
    MAINY,
    1.08,
    Math.PI / 4
  );

  const normalWheelY = wheel(
    CX + 1.65,
    MAINY,
    1.08,
    7 * Math.PI / 4
  );

  const normalRoundLabels = [
    tag(
      'ROUND ONE: X',
      XC,
      CX - 1.65,
      MAINY + 1.45,
      17
    ),

    tag(
      'ROUND TWO: Y',
      YC,
      CX + 1.65,
      MAINY + 1.45,
      17
    )
  ];

  const independentTag = tag(
    'TWO INDEPENDENT SPINS',
    NORMAL_C,
    CX,
    P ? -3.10 : -2.25,
    19
  );

  await until(S(5));
  await play(
    ...replacePicture(
      normalWheelX,
      normalWheelY,
      normalRoundLabels,
      independentTag
    ),
    ...say('VERSION ONE: NORMAL GAME', NORMAL_C),
    ...fbox([
      'X and Y are independent',
      ['Cov(X,Y) = ?', VC]
    ], NORMAL_C)
  );

  // ----------------------------------------------------------
  // 6. Normal totals range from zero to eight,
  // concentrated near four.
  // ----------------------------------------------------------

  let normalPlot = totalPlot(
    NORMAL_COUNTS,
    'NORMAL GAME: TOTAL T',
    TC
  );

  await until(S(6));
  await play(
    ...replacePicture(normalPlot.parts),
    ...say('NORMAL TOTALS CLUSTER NEAR FOUR', TC),
    ...fbox([
      'T = 0, 2, 4, 6, 8',
      ['E[T] = 4', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // Calculation table helper.
  //
  // The table grows one column at a time.
  // ----------------------------------------------------------

  function calculationTable(
    headers,
    rows,
    colors,
    options = {}
  ) {
    const nCols = headers.length;
    const nRows = rows.length;

    const width = options.width || 6.36;
    const cw = width / nCols;

    const rh = options.rh ||
      (P ? 0.78 : 0.57);

    const top = options.top !== undefined
      ? options.top
      : (P ? 0.90 : 0.93);

    const tx = j =>
      CX + (j - (nCols - 1) / 2) * cw;

    const ty = i =>
      top - i * rh;

    function cell(s, j, i, header = false) {
      const color = colors[j];

      return new M.VGroup(
        rect(
          cw - 0.045,
          rh - 0.045,
          tx(j),
          ty(i),
          color,
          header ? 0.20 : 0.075,
          1.3
        ),

        txt(
          String(s),
          header ? 15 : 22,
          color,
          tx(j),
          ty(i),
          !header,
          cw - 0.14
        )
      );
    }

    const heads = headers.map((s, j) =>
      cell(s, j, 0, true)
    );

    const entries = rows.map((row, i) =>
      row.map((s, j) =>
        cell(s, j, i + 1)
      )
    );

    function columns(indices) {
      return indices.flatMap(j => [
        heads[j],
        ...entries.map(row => row[j])
      ]);
    }

    function columnOutline(j, color = C.amber) {
      return outline(
        cw + 0.035,
        nRows * rh + 0.045,
        tx(j),
        (ty(1) + ty(nRows)) / 2,
        color
      );
    }

    return {
      heads,
      entries,
      columns,
      columnOutline,
      tx,
      ty,
      cw,
      rh,

      parts: [
        heads,
        entries
      ]
    };
  }

  const normalCalc = calculationTable(
    [
      'TOTAL',
      'T−4',
      'SQUARE',
      'COUNT',
      'PRODUCT'
    ],

    TOTALS.map((v, k) => [
      v,
      signed(NORMAL_DEV[k]),
      NORMAL_SQ[k],
      NORMAL_COUNTS[k],
      NORMAL_WEIGHTED[k]
    ]),

    [
      TC,
      C.amber,
      VC,
      XC,
      C.green
    ]
  );

  const normalCalcNote = txt(
    'Counts come from the joint table; divide by 16.',
    16,
    C.muted,
    CX,
    P ? -3.96 : -2.77,
    false,
    6.2
  );

  // ----------------------------------------------------------
  // 7. Square the distances from four, then weight.
  // ----------------------------------------------------------

  await until(S(7));
  await play(
    ...replacePicture(
      normalCalc.columns([0, 1, 2, 3]),
      normalCalcNote
    ),
    ...say('SQUARE DISTANCES FROM THE TOTAL MEAN', VC),
    ...fbox([
      'distance = T − 4',
      ['square, then weight by chance', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 8. Normal variance = 64/16 = 4 = 2 + 2.
  // ----------------------------------------------------------

  const normalProductOutline =
    normalCalc.columnOutline(4, C.green);

  await until(S(8));
  await play(
    ...addPicture(
      normalCalc.columns([4]),
      normalProductOutline
    ),
    ...say('NORMAL VARIANCE = FOUR', NORMAL_C),
    ...fbox([
      '(16+16+0+16+16)/16',
      ['= 64/16 = 4', C.green]
    ], NORMAL_C)
  );

  await until(S(8) + 3.2);
  await play(
    new M.Indicate(normalProductOutline, {
      color: C.green,
      runTime: 0.65
    }),

    ...say('FOUR = TWO PLUS TWO', C.green),

    ...fbox([
      'Var(X) = 2, Var(Y) = 2',
      ['Var(T) = 2 + 2 = 4', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // Pair mapping diagram.
  //
  // Left nodes represent X.
  // Right nodes represent Y.
  // Each row is one possible paired outcome.
  // ----------------------------------------------------------

  function payoutNode(v, x, y, color) {
    return new M.VGroup(
      rect(
        2.00,
        P ? 0.84 : 0.68,
        x,
        y,
        color,
        0.10
      ),

      coins(
        v,
        x - 0.22,
        y,
        v === 4 ? 0.105 : 0.14
      ),

      txt(
        String(v),
        22,
        color,
        x + 0.68,
        y,
        true
      )
    );
  }

  function mappingPicture(yValues, rule, color) {
    const left = CX - 1.67;
    const right = CX + 1.67;

    const top = P ? 0.40 : 0.42;
    const sp = P ? 1.14 : 0.92;

    const rowY = k => top - k * sp;

    const xNodes = VALUES.map((v, k) =>
      payoutNode(v, left, rowY(k), XC)
    );

    const yNodes = yValues.map((v, k) =>
      payoutNode(v, right, rowY(k), YC)
    );

    const arrows = VALUES.map((_, k) =>
      arrow(
        [left + 1.07, rowY(k), 0],
        [right - 1.07, rowY(k), 0],
        color,
        3,
        0.14
      )
    );

    const heads = [
      txt(
        'ROUND ONE: X',
        17,
        XC,
        left,
        top + 0.65
      ),

      txt(
        'ROUND TWO: Y',
        17,
        YC,
        right,
        top + 0.65
      )
    ];

    const ruleTag = tag(
      rule,
      color,
      CX,
      P ? -3.05 : -2.30,
      19
    );

    return {
      xNodes,
      yNodes,
      arrows,
      ruleTag,

      parts: [
        heads,
        xNodes,
        yNodes,
        arrows,
        ruleTag
      ]
    };
  }

  // ----------------------------------------------------------
  // 9. Repeat rule: round two copies round one.
  // ----------------------------------------------------------

  let repeatMapping = mappingPicture(
    [0, 2, 4],
    'Y = X',
    REPEAT_C
  );

  await until(S(9));
  await play(
    ...replacePicture(repeatMapping.parts),
    ...say('VERSION TWO: REPEAT RULE', REPEAT_C),
    ...fbox([
      ['Y = X', REPEAT_C],
      'the second payout copies the first'
    ], REPEAT_C)
  );

  // ----------------------------------------------------------
  // 10. Repeat totals: zero, four or eight.
  // ----------------------------------------------------------

  let repeatPlot = totalPlot(
    REPEAT_COUNTS,
    'REPEAT RULE: TOTAL T',
    TC
  );

  await until(S(10));
  await play(
    ...replacePicture(repeatPlot.parts),
    ...say('REPEAT TOTALS: 0, 4, 8', TC),
    ...fbox([
      '0 + 0 = 0',
      '2 + 2 = 4',
      ['4 + 4 = 8', TC]
    ], TC)
  );

  // ----------------------------------------------------------
  // 11. Distances from four: minus four, zero, plus four.
  // ----------------------------------------------------------

  const devArrowY =
    repeatPlot.base + repeatPlot.height * 0.61;

  const repeatDevArrows = [
    arrow(
      [repeatPlot.px(4) - 0.08, devArrowY, 0],
      [repeatPlot.px(0), devArrowY, 0],
      VC,
      3,
      0.16
    ),

    dot(
      repeatPlot.px(4),
      devArrowY,
      C.green,
      0.09
    ),

    arrow(
      [repeatPlot.px(4) + 0.08, devArrowY, 0],
      [repeatPlot.px(8), devArrowY, 0],
      VC,
      3,
      0.16
    )
  ];

  const repeatDevLabels = [
    txt(
      '−4',
      23,
      VC,
      repeatPlot.px(2),
      devArrowY + 0.27,
      true
    ),

    txt(
      '0',
      22,
      C.green,
      repeatPlot.px(4),
      devArrowY + 0.27,
      true
    ),

    txt(
      '+4',
      23,
      VC,
      repeatPlot.px(6),
      devArrowY + 0.27,
      true
    )
  ];

  await until(S(11));
  await play(
    ...addPicture(
      repeatDevArrows,
      repeatDevLabels
    ),
    ...say('DISTANCES FROM FOUR: −4, 0, +4', VC),
    ...fbox([
      '0−4 = −4',
      '4−4 = 0',
      ['8−4 = +4', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // Squared-distance visual.
  //
  // A distance of four gives a 4 × 4 square.
  // Each square cell is one squared-token unit.
  // ----------------------------------------------------------

  function squareUnit(x, y, size, color = VC) {
    const r = new M.Rectangle({
      width: size - 0.025,
      height: size - 0.025,
      color,
      strokeWidth: 1.2
    });

    r.setFill(color, 0.76);
    r.moveTo([x, y, 0]);

    return r;
  }

  function squareArea(side, x, y, size = 0.26) {
    if (side === 0) {
      return new M.VGroup(
        outline(
          size * 2,
          size * 2,
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

    const parts = [];

    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        parts.push(
          squareUnit(
            x + (j - (side - 1) / 2) * size,
            y + ((side - 1) / 2 - i) * size,
            size
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  const SQ_SP = 2.10;
  const SQ_X = k => CX + (k - 1) * SQ_SP;

  const repeatSquares = REPEAT_DEV.map((v, k) => {
    const x = SQ_X(k);
    const y = MAINY;

    return new M.VGroup(
      rect(
        1.91,
        P ? 3.25 : 2.73,
        x,
        y,
        VC,
        0.075
      ),

      txt(
        signed(v),
        25,
        C.amber,
        x,
        y + 0.92,
        true
      ),

      squareArea(
        Math.abs(v),
        x,
        y - 0.05,
        0.26
      ),

      txt(
        `(${signed(v)})² = ${v * v}`,
        19,
        VC,
        x,
        y - 1.01,
        true,
        1.75
      )
    );
  });

  // ----------------------------------------------------------
  // 12. Square the distances: sixteen, zero, sixteen.
  // ----------------------------------------------------------

  await until(S(12));
  await play(
    ...replacePicture(repeatSquares),
    ...say('SQUARED DISTANCES: 16, 0, 16', VC),
    ...fbox([
      '(−4)² = 16',
      '0² = 0',
      ['(+4)² = 16', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 13. Weight by 1/4, 1/2, 1/4.
  // Four plus zero plus four makes eight.
  // ----------------------------------------------------------

  const repeatCalc = calculationTable(
    ['TOTAL', 'DIST²', 'CHANCE', 'WEIGHTED'],

    REPEAT_TOTALS.map((v, k) => [
      v,
      REPEAT_SQ[k],
      FRACTIONS[k],
      REPEAT_WEIGHTED[k]
    ]),

    [TC, VC, XC, C.green],

    {
      rh: P ? 0.98 : 0.78
    }
  );

  const repeatVarianceSum = tag(
    '4 + 0 + 4 = 8',
    REPEAT_C,
    CX,
    P ? -3.08 : -2.18,
    21
  );

  await until(S(13));
  await play(
    ...replacePicture(
      repeatCalc.columns([0, 1, 2])
    ),
    ...say('WEIGHT EACH SQUARED DISTANCE', VC),
    ...fbox([
      '16 × 1/4 = 4',
      '0 × 1/2 = 0',
      '16 × 1/4 = 4'
    ], VC)
  );

  await until(S(13) + 2.7);
  await play(
    ...addPicture(
      repeatCalc.columns([3]),
      repeatVarianceSum
    ),
    ...say('FOUR PLUS ZERO PLUS FOUR', REPEAT_C),
    ...fbox([
      '4 + 0 + 4',
      ['= 8', REPEAT_C]
    ], REPEAT_C)
  );

  // ----------------------------------------------------------
  // Variance comparison stacks.
  //
  // These are squared-token units, not payout coins.
  // All stack heights use the same scale.
  // ----------------------------------------------------------

  function varianceStack(
    x,
    n,
    title,
    color,
    base = P ? -3.05 : -2.05,
    step = P ? 0.44 : 0.31
  ) {
    const parts = [];

    for (let k = 0; k < n; k++) {
      parts.push(
        squareUnit(
          x,
          base + (k + 0.5) * step,
          step * 0.92,
          color
        )
      );
    }

    if (n === 0) {
      parts.push(
        txt(
          '0',
          27,
          color,
          x,
          base + 0.25,
          true
        )
      );
    } else {
      parts.push(
        txt(
          String(n),
          27,
          color,
          x,
          base + n * step + 0.28,
          true
        )
      );
    }

    parts.push(
      txt(
        title,
        17,
        color,
        x,
        base - 0.30
      )
    );

    return parts;
  }

  // ----------------------------------------------------------
  // 14. Repeat variance is eight, twice the normal variance.
  // ----------------------------------------------------------

  const varianceFloor = line(
    [CX - 2.85, P ? -3.05 : -2.05, 0],
    [CX + 2.85, P ? -3.05 : -2.05, 0],
    C.muted,
    2
  );

  const varianceUnit = txt(
    'Variance (squared tokens)',
    16,
    C.muted,
    CX,
    P ? -3.83 : -2.73
  );

  await until(S(14));
  await play(
    ...replacePicture(
      varianceFloor,

      varianceStack(
        CX - 1.56,
        VAR_NORMAL,
        'NORMAL',
        NORMAL_C
      ),

      varianceStack(
        CX + 1.56,
        VAR_REPEAT,
        'REPEAT',
        REPEAT_C
      ),

      varianceUnit
    ),

    ...say('REPEAT VARIANCE IS TWICE AS LARGE', REPEAT_C),

    ...fbox([
      ['normal variance = 4', NORMAL_C],
      ['repeat variance = 8', REPEAT_C]
    ], REPEAT_C)
  );

  // ----------------------------------------------------------
  // 15. Mirror rule:
  // grey pairs with gold, blue pairs with blue.
  //
  // There is one first spin.
  // The second payout is determined by Y = 4 − X.
  // ----------------------------------------------------------

  function sliceMarker(x, y, color, label) {
    return new M.VGroup(
      circle(
        0.24,
        x,
        y,
        color,
        0.86,
        2
      ),

      txt(
        label,
        17,
        color,
        x,
        y - 0.40
      )
    );
  }

  const MIRROR_ROW_TOP = P ? 0.55 : 0.50;
  const MIRROR_ROW_SP = P ? 1.20 : 0.92;

  const mirrorSlicePairs = [
    [GREY, GOLD, 'GREY', 'GOLD'],
    [BLUE, BLUE, 'BLUE', 'BLUE'],
    [GOLD, GREY, 'GOLD', 'GREY']
  ];

  const mirrorColorRows = mirrorSlicePairs.map(
    ([a, b, nameA, nameB], k) => {
      const y = MIRROR_ROW_TOP - k * MIRROR_ROW_SP;

      return new M.VGroup(
        sliceMarker(
          CX - 1.67,
          y,
          a,
          nameA
        ),

        sliceMarker(
          CX + 1.67,
          y,
          b,
          nameB
        ),

        arrow(
          [CX - 1.20, y, 0],
          [CX + 1.20, y, 0],
          MIRROR_C,
          3,
          0.15
        )
      );
    }
  );

  const mirrorColorHeads = [
    txt(
      'ROUND ONE',
      18,
      XC,
      CX - 1.67,
      MIRROR_ROW_TOP + 0.69
    ),

    txt(
      'ROUND TWO',
      18,
      YC,
      CX + 1.67,
      MIRROR_ROW_TOP + 0.69
    )
  ];

  await until(S(15));
  await play(
    ...replacePicture(
      mirrorColorRows,
      mirrorColorHeads
    ),
    ...say('VERSION THREE: MIRROR RULE', MIRROR_C),
    ...fbox([
      'grey ↔ gold',
      ['blue ↔ blue', BLUE]
    ], MIRROR_C)
  );

  // ----------------------------------------------------------
  // 16. If X is zero, Y is four.
  // If X is four, Y is zero.
  // ----------------------------------------------------------

  let mirrorMapping = mappingPicture(
    [4, 2, 0],
    'Y = 4 − X',
    MIRROR_C
  );

  await until(S(16));
  await play(
    ...replacePicture(mirrorMapping.parts),
    ...say('MIRROR: OPPOSITE PAYOUTS', MIRROR_C),
    ...fbox([
      ['Y = 4 − X', MIRROR_C],
      '0 → 4, 2 → 2, 4 → 0'
    ], MIRROR_C)
  );

  await until(S(16) + 2.1);
  await play(
    new M.Indicate(mirrorMapping.xNodes[0], {
      color: XC,
      runTime: 0.85
    }),

    new M.Indicate(mirrorMapping.yNodes[0], {
      color: YC,
      runTime: 0.85
    }),

    ...say('ZERO IN ROUND ONE → FOUR IN ROUND TWO', MIRROR_C)
  );

  await until(S(16) + 4.5);
  await play(
    new M.Indicate(mirrorMapping.xNodes[2], {
      color: XC,
      runTime: 0.85
    }),

    new M.Indicate(mirrorMapping.yNodes[2], {
      color: YC,
      runTime: 0.85
    }),

    ...say('FOUR IN ROUND ONE → ZERO IN ROUND TWO', MIRROR_C)
  );

  // ----------------------------------------------------------
  // 17. Round two still has the same marginal law.
  // ----------------------------------------------------------

  marginalPair = makeMarginalPair();

  await until(S(17));
  await play(
    ...replacePicture(
      marginalPair.map(p => p.parts)
    ),
    ...say('MIRROR RULE: SAME MARGINAL CHANCES', YC),
    ...fbox([
      ['P(Y=0) = 1/4', YC],
      ['P(Y=2) = 1/2', YC],
      ['P(Y=4) = 1/4', YC]
    ], YC)
  );

  // ----------------------------------------------------------
  // 18. Every mirror total is exactly four.
  // No swing; variance zero.
  // ----------------------------------------------------------

  let mirrorPlot = totalPlot(
    MIRROR_COUNTS,
    'MIRROR RULE: TOTAL T',
    MIRROR_C
  );

  const mirrorAlwaysFour = tag(
    'EVERY TOTAL = 4',
    MIRROR_C,
    CX,
    P ? -0.55 : -0.38,
    17
  );

  await until(S(18));
  await play(
    ...replacePicture(mirrorPlot.parts),
    ...say('EVERY TOTAL IS EXACTLY FOUR', MIRROR_C),
    ...fbox([
      '0+4 = 2+2 = 4+0 = 4',
      ['P(T=4) = 1', MIRROR_C]
    ], MIRROR_C)
  );

  await until(S(18) + 2.6);
  await play(
    new M.Indicate(mirrorPlot.bars[0].body, {
      color: MIRROR_C,
      runTime: 0.8
    }),

    ...say('NO SWING: VARIANCE ZERO', MIRROR_C),

    ...fbox([
      '(4−4)² × 1',
      ['Var(T) = 0', MIRROR_C]
    ], MIRROR_C)
  );

  // ----------------------------------------------------------
  // 19. Same means, different variances.
  //
  // Three side-by-side total distributions.
  // All use the same probability and payout scales.
  // ----------------------------------------------------------

  function threeTotalPlots() {
    const centers = [
      CX - 2.10,
      CX,
      CX + 2.10
    ];

    const data = [
      {
        title: 'NORMAL',
        counts: NORMAL_COUNTS,
        color: NORMAL_C,
        variance: 4
      },

      {
        title: 'REPEAT',
        counts: REPEAT_COUNTS,
        color: REPEAT_C,
        variance: 8
      },

      {
        title: 'MIRROR',
        counts: MIRROR_COUNTS,
        color: MIRROR_C,
        variance: 0
      }
    ];

    const base = P ? -2.75 : -1.64;
    const height = P ? 3.65 : 2.38;

    return data.map((d, k) => {
      const p = makePlot({
        center: centers[k],
        width: 1.94,
        base,
        height,
        maximum: 8,
        values: TOTALS,
        probabilities: d.counts.map(n => n / 16),

        labels: d.counts.map(n =>
          n === 16 ? '1' :
          n === 8 ? '1/2' :
          n === 4 ? '1/4' :
          n === 6 ? '3/8' :
          '1/16'
        ),

        color: d.color,
        title: d.title,
        unit: 'total T',
        mean: 4,
        barWidth: 0.21,
        labelSize: P ? 15 : 13,
        compact: true
      });

      const varianceTag = tag(
        `VAR = ${d.variance}`,
        d.color,
        centers[k],
        P ? -4.18 : -2.92,
        15,
        1.90
      );

      return {
        ...p,
        varianceTag
      };
    });
  }

  let allPlots = threeTotalPlots();

  await until(S(19));
  await play(
    ...replacePicture(
      allPlots.map(p => p.parts),
      allPlots.map(p => p.varianceTag)
    ),
    ...say('SAME MEAN · VARIANCES 4, 8, 0', VC),
    ...fbox([
      ['normal: 4', NORMAL_C],
      ['repeat: 8', REPEAT_C],
      ['mirror: 0', MIRROR_C]
    ], VC)
  );

  // ----------------------------------------------------------
  // 20. What changes is how the rounds move together.
  // ----------------------------------------------------------

  function movementCard(k, heading, color, type) {
    const x = GAME_X(k);
    const y = MAINY;
    const w = 1.93;
    const h = P ? 3.10 : 2.70;

    const leftX = x - 0.46;
    const rightX = x + 0.46;

    const parts = [
      rect(w, h, x, y, color, 0.07),

      txt(
        heading,
        16,
        color,
        x,
        y + h / 2 - 0.28
      ),

      txt(
        'X',
        21,
        XC,
        leftX,
        y + 0.62,
        true
      ),

      txt(
        'Y',
        21,
        YC,
        rightX,
        y + 0.62,
        true
      )
    ];

    if (type === 'independent') {
      parts.push(
        txt(
          '↕',
          34,
          XC,
          leftX,
          y - 0.10
        ),

        txt(
          '↕',
          34,
          YC,
          rightX,
          y - 0.10
        )
      );
    } else {
      parts.push(
        arrow(
          [leftX, y - 0.50, 0],
          [leftX, y + 0.25, 0],
          XC,
          3.5
        )
      );

      parts.push(
        type === 'together'
          ? arrow(
              [rightX, y - 0.50, 0],
              [rightX, y + 0.25, 0],
              YC,
              3.5
            )
          : arrow(
              [rightX, y + 0.25, 0],
              [rightX, y - 0.50, 0],
              YC,
              3.5
            )
      );
    }

    parts.push(
      txt(
        type === 'independent'
          ? 'Independent'
          : type === 'together'
            ? 'Together'
            : 'Opposite',

        17,
        color,
        x,
        y - h / 2 + 0.28,
        false,
        w - 0.15
      )
    );

    return new M.VGroup(...parts);
  }

  const movementCards = [
    movementCard(
      0,
      'NORMAL',
      NORMAL_C,
      'independent'
    ),

    movementCard(
      1,
      'REPEAT',
      REPEAT_C,
      'together'
    ),

    movementCard(
      2,
      'MIRROR',
      MIRROR_C,
      'opposite'
    )
  ];

  await until(S(20));
  await play(
    ...replacePicture(movementCards),
    ...say('THE LINK BETWEEN THE ROUNDS MATTERS', VC),
    ...fbox([
      'same individual spreads',
      ['different movement together', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 21. The number measuring movement together:
  // covariance.
  // ----------------------------------------------------------

  await until(S(21));
  await play(
    ...say('COVARIANCE', VC),
    ...fbox([
      ['covariance', VC],
      'how two variables vary together'
    ], VC)
  );

  // ----------------------------------------------------------
  // Covariance picture: centred scatter points.
  //
  // Horizontal coordinate is X−2.
  // Vertical coordinate is Y−2.
  //
  // Repeat points lie on the rising diagonal.
  // Mirror points lie on the falling diagonal.
  // ----------------------------------------------------------

  function centredScatter(type) {
    const halfW = 2.02;
    const halfH = P ? 1.82 : 1.30;

    const y0 = P ? -1.06 : -0.59;

    const px = v => CX + v / 2 * halfW;
    const py = v => y0 + v / 2 * halfH;

    const axes = [
      line(
        [px(-2) - 0.31, y0, 0],
        [px(2) + 0.31, y0, 0],
        XC,
        2
      ),

      line(
        [CX, py(-2) - 0.20, 0],
        [CX, py(2) + 0.20, 0],
        YC,
        2
      ),

      txt(
        'X−2',
        17,
        XC,
        px(2) + 0.56,
        y0 - 0.25,
        true
      ),

      txt(
        'Y−2',
        17,
        YC,
        CX + 0.43,
        py(2) + 0.28,
        true
      )
    ];

    const ticks = [];

    DEV.forEach(v => {
      ticks.push(
        txt(
          signed(v),
          16,
          XC,
          px(v),
          y0 - 0.26,
          true
        )
      );

      if (v !== 0) {
        ticks.push(
          txt(
            signed(v),
            16,
            YC,
            CX - 0.29,
            py(v),
            true
          )
        );
      }
    });

    const positive = type === 'positive';
    const color = positive ? C.green : C.amber;

    const points = DEV.map((v, k) => {
      const w = positive ? v : -v;

      const r = k === 1 ? 0.16 : 0.115;

      return new M.VGroup(
        circle(
          r * 1.75,
          px(v),
          py(w),
          color,
          0.13,
          0
        ),

        dot(
          px(v),
          py(w),
          color,
          r
        )
      );
    });

    const trend = line(
      [px(-2), py(positive ? -2 : 2), 0],
      [px(2), py(positive ? 2 : -2), 0],
      color,
      3
    );

    const caption = tag(
      positive
        ? 'POSITIVE COVARIANCE'
        : 'NEGATIVE COVARIANCE',

      color,
      CX,
      P ? -4.10 : -2.63,
      18
    );

    return {
      parts: [
        axes,
        ticks,
        trend,
        points,
        caption
      ]
    };
  }

  // ----------------------------------------------------------
  // 22. Positive covariance: things go up together.
  // ----------------------------------------------------------

  let positiveScatter = centredScatter('positive');

  await until(S(22));
  await play(
    ...replacePicture(positiveScatter.parts),
    ...say('UP TOGETHER → POSITIVE COVARIANCE', C.green),
    ...fbox([
      'both above their means',
      'or both below',
      ['positive products', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 23. Negative covariance: one rises as the other falls.
  // ----------------------------------------------------------

  let negativeScatter = centredScatter('negative');

  await until(S(23));
  await play(
    ...replacePicture(negativeScatter.parts),
    ...say('OPPOSITE MOVEMENT → NEGATIVE COVARIANCE', C.amber),
    ...fbox([
      'one above its mean',
      'the other below',
      ['negative products', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 24. How do we calculate covariance for our rounds?
  // ----------------------------------------------------------

  await until(S(24));
  await play(
    ...say('HOW DO WE CALCULATE COVARIANCE?', VC),
    ...fbox([
      'step 1: centre',
      'step 2: multiply',
      ['step 3: weight and add', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 25. Distances of X and Y from their means of two.
  // ----------------------------------------------------------

  const CENTER_LINE_Y1 = P ? 0.35 : 0.38;
  const CENTER_LINE_Y2 = P ? -1.75 : -1.37;

  function centredNumberLine(y, name, color) {
    const px = v => CX + (v - 2) * 1.19;

    const parts = [
      line(
        [px(0) - 0.35, y, 0],
        [px(4) + 0.35, y, 0],
        C.muted,
        2
      ),

      txt(
        name,
        18,
        color,
        CX,
        y + 0.74
      )
    ];

    VALUES.forEach((v, k) => {
      parts.push(
        dot(
          px(v),
          y,
          color,
          0.11
        ),

        txt(
          String(v),
          20,
          color,
          px(v),
          y + 0.27,
          true
        ),

        txt(
          signed(DEV[k]),
          22,
          C.amber,
          px(v),
          y - 0.41,
          true
        )
      );
    });

    parts.push(
      arrow(
        [px(2) - 0.10, y - 0.12, 0],
        [px(0), y - 0.12, 0],
        color,
        2.2,
        0.12
      ),

      arrow(
        [px(2) + 0.10, y - 0.12, 0],
        [px(4), y - 0.12, 0],
        color,
        2.2,
        0.12
      )
    );

    return parts;
  }

  await until(S(25));
  await play(
    ...replacePicture(
      centredNumberLine(
        CENTER_LINE_Y1,
        'ROUND ONE: X',
        XC
      ),

      centredNumberLine(
        CENTER_LINE_Y2,
        'ROUND TWO: Y',
        YC
      )
    ),
    ...say('STEP 1: CENTRE BOTH PAYOUTS', C.amber),
    ...fbox([
      ['X−E[X] = X−2', XC],
      ['Y−E[Y] = Y−2', YC]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 26. Multiply the centred values,
  // then weight and add.
  // ----------------------------------------------------------

  function workflowTile(k, title, formula, color) {
    const x = GAME_X(k);
    const y = MAINY;

    return new M.VGroup(
      rect(
        1.94,
        P ? 2.95 : 2.50,
        x,
        y,
        color,
        0.08
      ),

      txt(
        `STEP ${k + 1}`,
        15,
        color,
        x,
        y + 0.86
      ),

      txt(
        title,
        18,
        color,
        x,
        y + 0.22,
        false,
        1.76
      ),

      txt(
        formula,
        20,
        color,
        x,
        y - 0.57,
        true,
        1.76
      )
    );
  }

  const covarianceWorkflow = [
    workflowTile(
      0,
      'CENTRE',
      'X−2, Y−2',
      C.amber
    ),

    workflowTile(
      1,
      'MULTIPLY',
      'dX × dY',
      VC
    ),

    workflowTile(
      2,
      'AVERAGE',
      'Σ product·p',
      C.green
    )
  ];

  await until(S(26));
  await play(
    ...replacePicture(covarianceWorkflow),
    ...say('CENTRE · MULTIPLY · WEIGHT AND ADD', VC),
    ...fbox([
      'multiply the two distances',
      ['take their expected product', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 27. Repeat rule: matching centred values.
  //
  // −2 with −2, 0 with 0, +2 with +2.
  // ----------------------------------------------------------

  function covarianceTable(yDeviations, mirror = false) {
    const products = DEV.map((v, k) =>
      v * yDeviations[k]
    );

    const weighted = products.map((v, k) =>
      v * PROBS[k]
    );

    return calculationTable(
      [
        'X−2',
        'Y−2',
        'PRODUCT',
        'CHANCE',
        'WEIGHTED'
      ],

      DEV.map((v, k) => [
        signed(v),
        signed(yDeviations[k]),
        signed(products[k]),
        FRACTIONS[k],
        signed(weighted[k])
      ]),

      [
        XC,
        YC,
        VC,
        C.muted,
        mirror ? C.amber : C.green
      ],

      {
        rh: P ? 0.98 : 0.78
      }
    );
  }

  const repeatCov = covarianceTable(
    [-2, 0, 2],
    false
  );

  const repeatCovTitle = tag(
    'REPEAT RULE: MATCHING DISTANCES',
    REPEAT_C,
    CX,
    P ? -3.08 : -2.28,
    16
  );

  await until(S(27));
  await play(
    ...replacePicture(
      repeatCov.columns([0, 1]),
      repeatCovTitle
    ),
    ...say('REPEAT: THE DISTANCES ALWAYS MATCH', REPEAT_C),
    ...fbox([
      '−2 with −2',
      '0 with 0',
      ['+2 with +2', REPEAT_C]
    ], REPEAT_C)
  );

  const repeatMatchFocus = [0, 1, 2].map(k =>
    outline(
      repeatCov.cw * 2 + 0.04,
      repeatCov.rh + 0.04,
      (repeatCov.tx(0) + repeatCov.tx(1)) / 2,
      repeatCov.ty(k + 1),
      REPEAT_C
    )
  );

  await until(S(27) + 2.2);

  register(repeatMatchFocus[0]);

  await play(
    new M.Create(repeatMatchFocus[0], {
      runTime: 0.55
    })
  );

  await until(S(27) + 4.1);

  register(repeatMatchFocus[1]);

  await play(
    new M.Create(repeatMatchFocus[1], {
      runTime: 0.55
    })
  );

  await until(S(27) + 5.9);

  register(repeatMatchFocus[2]);

  await play(
    new M.Create(repeatMatchFocus[2], {
      runTime: 0.55
    })
  );

  // ----------------------------------------------------------
  // 28. Products: four, zero, four.
  // Chances: quarter, half, quarter.
  // ----------------------------------------------------------

  await until(S(28));
  await play(
    ...removePicture(repeatMatchFocus),
    ...addPicture(
      repeatCov.columns([2, 3])
    ),
    ...say('MATCHING SIGNS MAKE POSITIVE PRODUCTS', C.green),
    ...fbox([
      '(−2)(−2) = 4',
      '0 × 0 = 0',
      ['(+2)(+2) = 4', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 29. Weighted products: 1 + 0 + 1 = +2.
  // ----------------------------------------------------------

  const repeatCovResult = tag(
    'COVARIANCE = +2',
    C.green,
    CX,
    P ? -3.88 : -2.83,
    19
  );

  await until(S(29));
  await play(
    ...addPicture(
      repeatCov.columns([4])
    ),
    ...say('WEIGHT THE POSITIVE PRODUCTS', C.green),
    ...fbox([
      '4×1/4 + 0×1/2 + 4×1/4',
      ['= 1 + 0 + 1', C.green]
    ], C.green)
  );

  await until(S(29) + 3.8);
  await play(
    ...addPicture(repeatCovResult),
    ...say('REPEAT COVARIANCE = +2', C.green),
    ...fbox([
      'Cov(X,Y) = 1 + 0 + 1',
      ['= +2', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 30. Mirror rule: opposite centred values.
  //
  // −2 with +2, 0 with 0, +2 with −2.
  // ----------------------------------------------------------

  const mirrorCov = covarianceTable(
    [2, 0, -2],
    true
  );

  const mirrorCovTitle = tag(
    'MIRROR RULE: OPPOSITE DISTANCES',
    MIRROR_C,
    CX,
    P ? -3.08 : -2.28,
    16
  );

  await until(S(30));
  await play(
    ...replacePicture(
      mirrorCov.columns([0, 1]),
      mirrorCovTitle
    ),
    ...say('MIRROR: THE DISTANCES ARE OPPOSITE', MIRROR_C),
    ...fbox([
      '−2 with +2',
      '0 with 0',
      ['+2 with −2', C.amber]
    ], MIRROR_C)
  );

  const mirrorPairFocus = [0, 1, 2].map(k =>
    outline(
      mirrorCov.cw * 2 + 0.04,
      mirrorCov.rh + 0.04,
      (mirrorCov.tx(0) + mirrorCov.tx(1)) / 2,
      mirrorCov.ty(k + 1),
      C.amber
    )
  );

  await until(S(30) + 2.1);

  register(mirrorPairFocus[0]);

  await play(
    new M.Create(mirrorPairFocus[0], {
      runTime: 0.55
    })
  );

  await until(S(30) + 4.1);

  register(mirrorPairFocus[1]);

  await play(
    new M.Create(mirrorPairFocus[1], {
      runTime: 0.55
    })
  );

  await until(S(30) + 5.9);

  register(mirrorPairFocus[2]);

  await play(
    new M.Create(mirrorPairFocus[2], {
      runTime: 0.55
    })
  );

  // ----------------------------------------------------------
  // 31. Products −4, 0, −4.
  // Weighted average −1 + 0 − 1 = −2.
  // ----------------------------------------------------------

  const mirrorCovResult = tag(
    'COVARIANCE = −2',
    C.amber,
    CX,
    P ? -3.88 : -2.83,
    19
  );

  await until(S(31));
  await play(
    ...removePicture(mirrorPairFocus),
    ...addPicture(
      mirrorCov.columns([2, 3])
    ),
    ...say('OPPOSITE SIGNS MAKE NEGATIVE PRODUCTS', C.amber),
    ...fbox([
      '(−2)(+2) = −4',
      '0 × 0 = 0',
      ['(+2)(−2) = −4', C.amber]
    ], C.amber)
  );

  await until(S(31) + 2.5);
  await play(
    ...addPicture(
      mirrorCov.columns([4]),
      mirrorCovResult
    ),
    ...say('MIRROR COVARIANCE = −2', C.amber),
    ...fbox([
      '−4×1/4 + 0 − 4×1/4',
      ['= −1 + 0 − 1 = −2', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 32. Normal game: independent rounds, covariance zero.
  //
  // Centred-product table:
  //
  // +4   0  −4
  //  0   0   0
  // −4   0  +4
  //
  // The four nonzero products all have chance 1/16.
  // Their positive and negative contributions cancel.
  // ----------------------------------------------------------

  const normalCovTable = jointTable(
    NORMAL,
    CX,
    1.35,
    P ? 1.02 : 0.77,
    P ? -0.88 : -0.55,
    '',
    NORMAL_C,
    'product'
  );

  const normalCovCaption = txt(
    'Centred product and its joint chance',
    16,
    C.muted,
    CX,
    P ? -3.04 : -2.27,
    false,
    6.15
  );

  const normalCovResult = tag(
    'COVARIANCE = 0',
    NORMAL_C,
    CX,
    P ? -3.77 : -2.83,
    19
  );

  await until(S(32));
  await play(
    ...replacePicture(
      normalCovTable.parts,
      normalCovCaption,
      normalCovResult
    ),
    ...say('INDEPENDENT ROUNDS: COVARIANCE ZERO', NORMAL_C),
    ...fbox([
      '(4−4−4+4)/16',
      ['Cov(X,Y) = 0', NORMAL_C]
    ], NORMAL_C)
  );

  // ----------------------------------------------------------
  // 33. The short version, in one line.
  // ----------------------------------------------------------

  // recap of the three covariances, as a bridge into the formula
  const covRecap = [
    ['NORMAL: COV = 0', NORMAL_C],
    ['REPEAT: COV = +2', REPEAT_C],
    ['MIRROR: COV = −2', MIRROR_C]
  ].map(([t, c], k) => tag(t, c, CX, MAINY + (1 - k) * (P ? 1.0 : 0.8), P ? 22 : 20));

  await until(S(33));
  await play(
    ...replacePicture(covRecap),
    ...say('THE SHORT VERSION'),
    ...fbox([
      'variance of the total',
      ['include the link', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 34. Var is short for variance.
  // ----------------------------------------------------------

  const varSymbol = new M.VGroup(
    rect(
      5.55,
      P ? 2.35 : 2.05,
      CX,
      MAINY,
      VC,
      0.08
    ),

    txt(
      'Var',
      45,
      VC,
      CX,
      MAINY + 0.27,
      true
    ),

    txt(
      'variance',
      22,
      C.ink,
      CX,
      MAINY - 0.62
    )
  );

  await until(S(34));
  await play(
    ...replacePicture(varSymbol),
    ...say('VAR = VARIANCE', VC),
    ...fbox([
      ['Var', VC],
      'short for variance'
    ], VC)
  );

  // ----------------------------------------------------------
  // 35. The variance-of-a-sum formula.
  //
  // Var(X+Y) = Var(X)+Var(Y)+2Cov(X,Y).
  // ----------------------------------------------------------

  function expressionBox(s, y, color, size = 27) {
    const text = txt(
      s,
      size,
      color,
      CX,
      y,
      true,
      5.95
    );

    return new M.VGroup(
      rect(
        Math.min(
          6.28,
          text.getWidth() + 0.55
        ),
        P ? 0.88 : 0.74,
        CX,
        y,
        color,
        0.10
      ),

      text
    );
  }

  const formulaMain = expressionBox(
    'Var(X + Y)',
    P ? 0.93 : 0.93,
    TC,
    31
  );

  const formulaEquals = txt(
    '=',
    28,
    C.ink,
    CX,
    P ? 0.15 : 0.18,
    true
  );

  const formulaTerms = expressionBox(
    'Var(X) + Var(Y)',
    P ? -0.64 : -0.52,
    XC,
    27
  );

  const formulaCovTerm = expressionBox(
    '+ 2 × Cov(X,Y)',
    P ? -1.91 : -1.55,
    VC,
    27
  );

  const formulaCaption = txt(
    'The link contributes twice the covariance.',
    17,
    VC,
    CX,
    P ? -3.12 : -2.47,
    false,
    6.10
  );

  await until(S(35));
  await play(
    ...replacePicture(
      formulaMain,
      formulaEquals,
      formulaTerms
    ),
    ...say('VARIANCE OF A SUM', VC),
    ...fbox([
      'Var(X + Y)',
      '= Var(X) + Var(Y)'
    ], VC)
  );

  await until(S(35) + 3.1);
  await play(
    ...addPicture(
      formulaCovTerm,
      formulaCaption
    ),
    ...say('PLUS TWICE THE COVARIANCE', VC),
    ...fbox([
      'Var(X+Y) = Var(X)+Var(Y)',
      ['           + 2Cov(X,Y)', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 36. Read it in plain language.
  //
  // Two individual variance contributions,
  // plus a signed contribution from the link.
  // ----------------------------------------------------------

  function formulaContribution(
    x,
    label,
    value,
    description,
    color
  ) {
    const y = MAINY;

    return new M.VGroup(
      rect(
        1.94,
        P ? 3.05 : 2.62,
        x,
        y,
        color,
        0.09
      ),

      txt(
        label,
        20,
        color,
        x,
        y + 0.88,
        true,
        1.76
      ),

      txt(
        value,
        37,
        color,
        x,
        y,
        true
      ),

      txt(
        description,
        16,
        color,
        x,
        y - 0.91,
        false,
        1.76
      )
    );
  }

  function formulaPicture(covariance, color = VC) {
    return [
      formulaContribution(
        GAME_X(0),
        'Var(X)',
        '2',
        'round one',
        XC
      ),

      formulaContribution(
        GAME_X(1),
        'Var(Y)',
        '2',
        'round two',
        YC
      ),

      formulaContribution(
        GAME_X(2),
        '2Cov(X,Y)',
        signed(2 * covariance),
        'link effect',
        color
      )
    ];
  }

  const generalContributions = [
    formulaContribution(
      GAME_X(0),
      'Var(X)',
      '2',
      'first spread',
      XC
    ),

    formulaContribution(
      GAME_X(1),
      'Var(Y)',
      '2',
      'second spread',
      YC
    ),

    formulaContribution(
      GAME_X(2),
      '2Cov(X,Y)',
      '?',
      'link effect',
      VC
    )
  ];

  await until(S(36));
  await play(
    ...replacePicture(generalContributions),
    ...say('TWO VARIANCES PLUS THE LINK EFFECT', VC),
    ...fbox([
      ['round-one variance', XC],
      ['+ round-two variance', YC],
      ['+ twice covariance', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 37–39. Visual signed-variance calculation.
  //
  // Four base squares represent 2+2.
  //
  // Normal: no extra squares.
  // Repeat: add four squares.
  // Mirror: subtract four squares.
  // ----------------------------------------------------------

  function signedVariancePicture(covariance, title, color) {
    const y = MAINY;
    const unit = P ? 0.43 : 0.38;

    const leftX = CX - 1.53;
    const rightX = CX + 1.53;

    const baseBlocks = [];
    const correctionBlocks = [];

    for (let k = 0; k < 4; k++) {
      const row = Math.floor(k / 2);
      const col = k % 2;

      baseBlocks.push(
        squareUnit(
          leftX + (col - 0.5) * unit,
          y + (0.5 - row) * unit,
          unit,
          row === 0 ? XC : YC
        )
      );
    }

    const adjustment = 2 * covariance;

    for (let k = 0; k < Math.abs(adjustment); k++) {
      const row = Math.floor(k / 2);
      const col = k % 2;

      const x = rightX + (col - 0.5) * unit;
      const yy = y + (0.5 - row) * unit;

      if (adjustment > 0) {
        correctionBlocks.push(
          squareUnit(
            x,
            yy,
            unit,
            color
          )
        );
      } else {
        correctionBlocks.push(
          new M.VGroup(
            outline(
              unit - 0.025,
              unit - 0.025,
              x,
              yy,
              C.amber
            ),

            line(
              [
                x - unit * 0.32,
                yy - unit * 0.32,
                0
              ],
              [
                x + unit * 0.32,
                yy + unit * 0.32,
                0
              ],
              C.amber,
              2.5
            ),

            line(
              [
                x - unit * 0.32,
                yy + unit * 0.32,
                0
              ],
              [
                x + unit * 0.32,
                yy - unit * 0.32,
                0
              ],
              C.amber,
              2.5
            )
          )
        );
      }
    }

    if (adjustment === 0) {
      correctionBlocks.push(
        txt(
          '0',
          37,
          color,
          rightX,
          y,
          true
        )
      );
    }

    const result = 4 + adjustment;

    const parts = [
      txt(
        title,
        21,
        color,
        CX,
        y + 1.48
      ),

      rect(
        2.45,
        P ? 2.12 : 1.78,
        leftX,
        y,
        XC,
        0.07
      ),

      rect(
        2.45,
        P ? 2.12 : 1.78,
        rightX,
        y,
        color,
        0.07
      ),

      txt(
        '2 + 2',
        24,
        XC,
        leftX,
        y + 0.70,
        true
      ),

      txt(
        '2Cov(X,Y)',
        19,
        color,
        rightX,
        y + 0.70,
        true
      ),

      baseBlocks,
      correctionBlocks,

      txt(
        '4',
        23,
        XC,
        leftX,
        y - 0.72,
        true
      ),

      txt(
        signed(adjustment),
        23,
        color,
        rightX,
        y - 0.72,
        true
      ),

      tag(
        `TOTAL VARIANCE = ${result}`,
        color,
        CX,
        P ? -3.12 : -2.28,
        20
      )
    ];

    return parts;
  }

  // ----------------------------------------------------------
  // 37. Normal: two plus two plus zero = four.
  // ----------------------------------------------------------

  await until(S(37));
  await play(
    ...replacePicture(
      signedVariancePicture(
        COV_NORMAL,
        'NORMAL GAME',
        NORMAL_C
      )
    ),
    ...say('NORMAL: 2 + 2 + 0 = 4', NORMAL_C),
    ...fbox([
      'Var(T) = 2 + 2 + 2×0',
      ['= 4', NORMAL_C]
    ], NORMAL_C)
  );

  // ----------------------------------------------------------
  // 38. Repeat: two plus two plus twice two = eight.
  // ----------------------------------------------------------

  await until(S(38));
  await play(
    ...replacePicture(
      signedVariancePicture(
        COV_REPEAT,
        'REPEAT RULE',
        REPEAT_C
      )
    ),
    ...say('REPEAT: 2 + 2 + 4 = 8', REPEAT_C),
    ...fbox([
      'Var(T) = 2 + 2 + 2×2',
      ['= 8', REPEAT_C]
    ], REPEAT_C)
  );

  // ----------------------------------------------------------
  // 39. Mirror: two plus two minus twice two = zero.
  // ----------------------------------------------------------

  await until(S(39));
  await play(
    ...replacePicture(
      signedVariancePicture(
        COV_MIRROR,
        'MIRROR RULE',
        MIRROR_C
      )
    ),
    ...say('MIRROR: 2 + 2 − 4 = 0', MIRROR_C),
    ...fbox([
      'Var(T) = 2 + 2 + 2×(−2)',
      ['= 0', MIRROR_C]
    ], MIRROR_C)
  );

  // ----------------------------------------------------------
  // 40. The formula explains risk in totals.
  // ----------------------------------------------------------

  allPlots = threeTotalPlots();

  await until(S(40));
  await play(
    ...replacePicture(
      allPlots.map(p => p.parts),
      allPlots.map(p => p.varianceTag)
    ),
    ...say('THE LINK EXPLAINS RISK IN TOTALS', VC),
    ...fbox([
      'same expected total: 4',
      ['different total variances', VC]
    ], VC)
  );

  // ----------------------------------------------------------
  // 41. Mixing things that move apart makes the total steadier.
  //
  // Illustrative mirror-rule games:
  // X = 0, 2, 4, 2, 0, 4, 2, 2
  // Y = 4, 2, 0, 2, 4, 0, 2, 2
  //
  // The sequence is illustrative; T=4 follows exactly
  // from the mirror rule for every possible game.
  // ----------------------------------------------------------

  const SAMPLE_X = [0, 2, 4, 2, 0, 4, 2, 2];

  const SAMPLE_Y = SAMPLE_X.map(v => 4 - v);

  const SAMPLE_T = SAMPLE_X.map(
    (v, k) => v + SAMPLE_Y[k]
  );

  function linkedSequencePicture(xValues, yValues) {
    const n = xValues.length;

    const base = P ? -3.02 : -1.97;
    const h = P ? 3.58 : 2.72;
    const w = 5.66;

    const px = k =>
      CX - w / 2 + k / (n - 1) * w;

    const py = v =>
      base + v / 4 * h;

    const totalValues = xValues.map(
      (v, k) => v + yValues[k]
    );

    const axes = [
      line(
        [px(0) - 0.28, base, 0],
        [px(n - 1) + 0.20, base, 0],
        C.muted,
        2
      ),

      line(
        [px(0) - 0.28, base, 0],
        [px(0) - 0.28, py(4) + 0.14, 0],
        C.muted,
        2
      )
    ];

    const ticks = VALUES.map(v =>
      txt(
        String(v),
        16,
        C.muted,
        px(0) - 0.51,
        py(v),
        true
      )
    );

    function series(values, color) {
      const segments = [];

      for (let k = 0; k < values.length - 1; k++) {
        segments.push(
          line(
            [px(k), py(values[k]), 0],
            [px(k + 1), py(values[k + 1]), 0],
            color,
            2.8
          )
        );
      }

      const points = values.map((v, k) =>
        dot(px(k), py(v), color, 0.065)
      );

      return [
        segments,
        points
      ];
    }

    const xSeries = series(xValues, XC);
    const ySeries = series(yValues, YC);
    const tSeries = series(totalValues, TC);

    const legend = [
      txt(
        'X',
        20,
        XC,
        CX - 1.70,
        P ? 1.25 : 1.22,
        true
      ),

      txt(
        'Y',
        20,
        YC,
        CX,
        P ? 1.25 : 1.22,
        true
      ),

      txt(
        'T = X+Y',
        18,
        TC,
        CX + 1.70,
        P ? 1.25 : 1.22,
        true
      )
    ];

    const exampleLabel = txt(
      'Example: mirror-rule games, one after another',
      17,
      C.muted,
      CX,
      base - 0.49,
      false,
      6.1
    );

    return {
      axes,
      ticks,
      xSeries,
      ySeries,
      tSeries,
      legend,
      exampleLabel,

      parts: [
        axes,
        ticks,
        xSeries,
        ySeries,
        tSeries,
        legend,
        exampleLabel
      ]
    };
  }

  const mirrorSequence = linkedSequencePicture(
    SAMPLE_X,
    SAMPLE_Y
  );

  await until(S(41));
  await play(
    ...replacePicture(
      mirrorSequence.axes,
      mirrorSequence.ticks,
      mirrorSequence.xSeries,
      mirrorSequence.ySeries,
      mirrorSequence.legend,
      mirrorSequence.exampleLabel
    ),
    ...say('ONE FALLS WHEN THE OTHER RISES', MIRROR_C),
    ...fbox([
      ['X swings', XC],
      ['Y swings in the opposite direction', YC]
    ], MIRROR_C)
  );

  await until(S(41) + 2.5);
  await play(
    ...addPicture(mirrorSequence.tSeries),
    ...say('THE TOTAL BECOMES STEADY', C.green),
    ...fbox([
      'X + Y = 4 every time',
      ['Var(T) = 0', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 42. Application: spreading risk across different savings.
  //
  // Illustrative savings movements, not a forecast.
  // Diversification can reduce risk when holdings are not
  // perfectly positively correlated; it does not guarantee
  // a profit or eliminate all investment risk.
  // ----------------------------------------------------------

  function savingsJar(x, name, color, direction) {
    const y = MAINY;

    const frame = rect(
      2.30,
      P ? 3.10 : 2.65,
      x,
      y,
      color,
      0.07
    );

    const jar = rect(
      1.08,
      1.18,
      x,
      y + 0.05,
      color,
      0.12
    );

    const lid = rect(
      1.16,
      0.17,
      x,
      y + 0.72,
      color,
      0.38
    );

    const money = coinGrid(
      4,
      x,
      y - 0.03,
      2,
      0.15,
      0.38
    );

    const movement = direction > 0
      ? arrow(
          [x + 0.80, y - 0.36, 0],
          [x + 0.80, y + 0.47, 0],
          color,
          3
        )
      : arrow(
          [x + 0.80, y + 0.47, 0],
          [x + 0.80, y - 0.36, 0],
          color,
          3
        );

    return new M.VGroup(
      frame,
      jar,
      lid,
      money,
      movement,

      txt(
        name,
        19,
        color,
        x,
        y + 1.05
      ),

      txt(
        direction > 0
          ? 'moves up'
          : 'moves down',

        17,
        color,
        x,
        y - 1.05
      )
    );
  }

  const savingA = savingsJar(
    CX - 1.57,
    'SAVING A',
    XC,
    1
  );

  const savingB = savingsJar(
    CX + 1.57,
    'SAVING B',
    YC,
    -1
  );

  const diversificationTag = tag(
    'DIFFERENT MOVEMENTS CAN REDUCE RISK',
    C.green,
    CX,
    P ? -3.03 : -2.28,
    16
  );

  await until(S(42));
  await play(
    ...replacePicture(
      savingA,
      savingB,
      diversificationTag
    ),
    ...say('SPREADING RISK: DIVERSIFICATION', C.green),
    ...fbox([
      'combine different movements',
      ['total risk can be smaller', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 43. Common trap:
  // Variances add on their own only when covariance is zero.
  // ----------------------------------------------------------

  function trapRow(y, title, covariance, result, color) {
    return new M.VGroup(
      rect(
        6.12,
        P ? 0.98 : 0.78,
        CX,
        y,
        color,
        0.08
      ),

      txt(
        title,
        17,
        color,
        CX - 2.16,
        y,
        false,
        1.43
      ),

      txt(
        '2+2',
        23,
        XC,
        CX - 0.91,
        y,
        true
      ),

      txt(
        covariance === 0
          ? '+0'
          : signed(2 * covariance),

        23,
        color,
        CX + 0.37,
        y,
        true
      ),

      txt(
        `= ${result}`,
        24,
        color,
        CX + 1.89,
        y,
        true
      )
    );
  }

  const trapTop = P ? 0.46 : 0.44;
  const trapSP = P ? 1.21 : 0.98;

  const trapRows = [
    trapRow(
      trapTop,
      'NORMAL',
      COV_NORMAL,
      VAR_NORMAL,
      NORMAL_C
    ),

    trapRow(
      trapTop - trapSP,
      'REPEAT',
      COV_REPEAT,
      VAR_REPEAT,
      REPEAT_C
    ),

    trapRow(
      trapTop - 2 * trapSP,
      'MIRROR',
      COV_MIRROR,
      VAR_MIRROR,
      MIRROR_C
    )
  ];

  const zeroCondition = tag(
    'ADD VARIANCES DIRECTLY ONLY IF COV = 0',
    C.amber,
    CX,
    P ? -3.20 : -2.52,
    16
  );

  await until(S(43));
  await play(
    ...replacePicture(
      trapRows,
      zeroCondition
    ),
    ...say('TRAP: VARIANCES DO NOT ALWAYS ADD', C.amber),
    ...fbox([
      'Var(X+Y) = Var(X)+Var(Y)',
      ['only when Cov(X,Y)=0', C.amber]
    ], C.amber)
  );

  await until(S(43) + 2.8);
  await play(
    new M.Indicate(trapRows[0], {
      color: C.green,
      runTime: 0.8
    }),

    ...say('ZERO COVARIANCE IS THE CONDITION', C.green),

    ...fbox([
      'independence implies Cov=0',
      'zero covariance is sufficient'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 44. Unlike means, variances require checking the link.
  // ----------------------------------------------------------

  const compareRules = [
    new M.VGroup(
      rect(
        6.05,
        P ? 1.45 : 1.15,
        CX,
        P ? 0.37 : 0.40,
        C.green,
        0.08
      ),

      txt(
        'EXPECTED VALUES',
        17,
        C.green,
        CX,
        P ? 0.78 : 0.72
      ),

      txt(
        'E[X+Y] = E[X]+E[Y]',
        25,
        C.green,
        CX,
        P ? 0.10 : 0.18,
        true,
        5.72
      )
    ),

    new M.VGroup(
      rect(
        6.05,
        P ? 1.80 : 1.48,
        CX,
        P ? -1.83 : -1.40,
        VC,
        0.08
      ),

      txt(
        'VARIANCES',
        17,
        VC,
        CX,
        P ? -1.22 : -0.91
      ),

      txt(
        'Var(X+Y) = Var(X)+Var(Y)',
        22,
        VC,
        CX,
        P ? -1.80 : -1.40,
        true,
        5.72
      ),

      txt(
        '+ 2Cov(X,Y)',
        24,
        C.amber,
        CX,
        P ? -2.36 : -1.91,
        true
      )
    )
  ];

  await until(S(44));
  await play(
    ...replacePicture(compareRules),
    ...say('MEANS ADD. VARIANCES NEED THE LINK.', C.amber),
    ...fbox([
      ['means: no independence needed', C.green],
      ['variances: check covariance', VC]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 45. Final definition and chapter conclusion.
  //
  // The variance of a total is the sum of the variances,
  // plus twice the covariance.
  //
  // Finish with a compact comparison of all three games.
  // ----------------------------------------------------------

  const finalTable = calculationTable(
    [
      'GAME',
      'MEAN',
      'COV',
      'VAR(T)'
    ],

    [
      ['Normal', '4', '0', '4'],
      ['Repeat', '4', '+2', '8'],
      ['Mirror', '4', '−2', '0']
    ],

    [
      C.ink,
      TC,
      VC,
      C.green
    ],

    {
      rh: P ? 0.87 : 0.68,
      top: P ? 0.55 : 0.63
    }
  );

  const finalEquation = txt(
    'Var(X+Y) = Var(X)+Var(Y)+2Cov(X,Y)',
    23,
    VC,
    CX,
    P ? 1.46 : 1.34,
    true,
    6.30
  );

  const finalCovOutline =
    finalTable.columnOutline(2, VC);

  const finalVarOutline =
    finalTable.columnOutline(3, C.green);

  const finalNote = tag(
    'SAME MEANS · DIFFERENT LINKS · DIFFERENT RISK',
    C.green,
    CX,
    P ? -3.56 : -2.55,
    16,
    6.35
  );

  await until(S(45));
  await play(
    ...replacePicture(
      finalEquation,
      finalTable.parts,
      finalNote
    ),
    ...say('VARIANCE OF A TOTAL', VC),
    ...fbox([
      'Var(X+Y) = Var(X)+Var(Y)',
      ['           + 2Cov(X,Y)', VC]
    ], VC)
  );

  await until(S(45) + 2.15);

  register(finalCovOutline);

  await play(
    new M.Create(finalCovOutline, {
      runTime: 0.65
    }),
    ...say('PLUS TWICE THE COVARIANCE', VC)
  );

  await until(S(45) + 4.0);

  register(finalVarOutline);

  await play(
    new M.Create(finalVarOutline, {
      runTime: 0.65
    }),

    ...say(
      'ADD THE VARIANCES · INCLUDE THE LINK',
      C.green
    ),

    ...fbox([
      ['normal: 2+2+0 = 4', NORMAL_C],
      ['repeat: 2+2+4 = 8', REPEAT_C],
      ['mirror: 2+2−4 = 0', MIRROR_C]
    ], C.green)
  );

  await until(E(45));
}

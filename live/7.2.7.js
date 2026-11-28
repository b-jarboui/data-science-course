// lesson 7.2.7
// One-way ANOVA — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact supplied chapter data:
// A: 15, 17, 17, 19; mean = 17; within SS = 8.
// B: 18, 20, 20, 22; mean = 20; within SS = 8.
// C: 20, 22, 24, 26; mean = 23; within SS = 20.
//
// Grand mean = 20.
// Between-group SS = 72; df = 2; MS = 36.
// Within-group SS = 36; df = 9; MS = 4.
// F = 36 / 4 = 9.
// F(2, 9) critical value at alpha = 0.05 is approximately 4.26.
// Right-tail p-value is approximately 0.00713.
//
// The equal-mean comparison is explicitly hypothetical.
// Squared-distance tiles represent arithmetic units, not batteries.
// The F curve uses the exact density for F(2, 9).
// Uses the approved engine API; browser playback has not been tested.

export default async function (L) {
  const {
    sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // PHONE STAGE: on the phone the picture is enlarged and moved down into the
  // middle of the frame; the pill sits under the title and the formula card at
  // the bottom. Each new picture object is mapped once, when it first appears
  // (FadeIn / Create / Transform target). Cards are marked so they are skipped.
  const M0 = L.M;
  const SK = 1.14, SY0 = 1.8, SY1 = 3.3;
  const hasStaged = m => !!m && (m.__st || (m.submobjects || []).some(hasStaged));
  const markStaged = m => { m.__st = true; (m.submobjects || []).forEach(markStaged); };
  function stage(m) {
    if (!P || !m || m.__st) return m;
    if (hasStaged(m)) { (m.submobjects || []).forEach(stage); m.__st = true; return m; }
    m.scale(SK, { aboutPoint: [0, SY0, 0] });
    const c = m.getCenter();
    m.moveTo([c[0], c[1] + SY1 - SY0, c[2]]);
    markStaged(m);
    return m;
  }
  const M = !P ? M0 : {
    ...M0,
    FadeIn: class extends M0.FadeIn { constructor(m, o) { super(stage(m), o); } },
    Create: class extends M0.Create { constructor(m, o) { super(stage(m), o); } },
    Transform: class extends M0.Transform { constructor(a, b, o) { super(a, stage(b), o); } }
  };

  // ------------------------------------------------------------
  // Exact shared chapter data
  // ------------------------------------------------------------

  const PINK = C.pink || '#ff619e';
  const GOLD = '#ffc857';
  const RED = '#ff646e';

  const BETWEEN = C.violet;
  const WITHIN = C.green;

  const GROUPS = [
    {
      name: 'A',
      color: C.cyan,
      values: [15, 17, 17, 19]
    },
    {
      name: 'B',
      color: C.amber,
      values: [18, 20, 20, 22]
    },
    {
      name: 'C',
      color: PINK,
      values: [20, 22, 24, 26]
    }
  ].map(g => {
    const mean =
      g.values.reduce((a, b) => a + b, 0) /
      g.values.length;

    const deviations = g.values.map(v => v - mean);
    const squares = deviations.map(d => d * d);
    const ss = squares.reduce((a, b) => a + b, 0);

    return {
      ...g,
      mean,
      deviations,
      squares,
      ss,
      n: g.values.length
    };
  });

  const ALL = GROUPS.flatMap(g => g.values);

  const N = ALL.length;
  const K = GROUPS.length;

  const GRAND = ALL.reduce((a, b) => a + b, 0) / N;

  const BETWEEN_DEV = GROUPS.map(g =>
    g.mean - GRAND
  );

  const BETWEEN_SQUARES = BETWEEN_DEV.map(d =>
    d * d
  );

  const BETWEEN_CONTRIBUTIONS = GROUPS.map(
    (g, i) => g.n * BETWEEN_SQUARES[i]
  );

  const SS_B = BETWEEN_CONTRIBUTIONS.reduce(
    (a, b) => a + b,
    0
  );

  const SS_W = GROUPS.reduce(
    (sum, g) => sum + g.ss,
    0
  );

  const DF_B = K - 1;
  const DF_W = N - K;

  const MS_B = SS_B / DF_B;
  const MS_W = SS_W / DF_W;

  const F_OBS = MS_B / MS_W;

  const ALPHA = 0.05;

  // For F with numerator df = 2 and denominator df = 9:
  // survival(f) = (1 + 2f/9)^(-9/2).
  // density(f)  = (1 + 2f/9)^(-11/2).

  const fSurvival = f =>
    Math.pow(1 + 2 * f / 9, -4.5);

  const fDensity = f =>
    Math.pow(1 + 2 * f / 9, -5.5);

  const F_CRIT =
    4.5 * (Math.pow(ALPHA, -2 / 9) - 1);

  const P_VALUE = fSurvival(F_OBS);

  const signed = v =>
    v > 0 ? `+${v}` :
    v < 0 ? `−${Math.abs(v)}` :
    '0';

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 1.85, 0];

  // phone: BOXP y = bottom edge of the card
  const BOXP = P
    ? [0, -6.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Shared visual helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function rect(
    x, y, w, h,
    color,
    opacity = 0,
    sw = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function rounded(
    x, y, w, h,
    color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        0.16,
        w * 0.08,
        h * 0.08
      ),
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(
    x, y, radius,
    color,
    opacity = 1
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function glow(
    x, y,
    color = C.cyan,
    radius = 0.11
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.25,
      color
    });

    halo.setFill(color, 0.17);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  function ring(
    x, y,
    color = C.amber,
    radius = 0.18
  ) {
    return circle(
      x, y,
      radius,
      color,
      0
    );
  }

  function tag(
    s, color, x, y,
    size = 17,
    maxw = null
  ) {
    const p = pill(s, color, size);

    if (maxw !== null && p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    tip = 0.13
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),

      line(
        x2,
        y2,
        x2 - tip * Math.cos(a - Math.PI / 5),
        y2 - tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x2,
        y2,
        x2 - tip * Math.cos(a + Math.PI / 5),
        y2 - tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      )
    );
  }

  function doubleArrow(
    x1, y1, x2, y2,
    color = C.amber,
    tip = 0.11
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),

      line(
        x2,
        y2,
        x2 - tip * Math.cos(a - Math.PI / 5),
        y2 - tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x2,
        y2,
        x2 - tip * Math.cos(a + Math.PI / 5),
        y2 - tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      ),

      line(
        x1,
        y1,
        x1 + tip * Math.cos(a - Math.PI / 5),
        y1 + tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x1,
        y1,
        x1 + tip * Math.cos(a + Math.PI / 5),
        y1 + tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      )
    );
  }

  function battery(
    x, y,
    scale = 1,
    color = C.cyan,
    fill = 0.75
  ) {
    const w = 0.57 * scale;
    const h = 1.03 * scale;

    const fillH = (h - 0.10 * scale) * fill;

    return new M.VGroup(
      rounded(
        x,
        y,
        w,
        h,
        color,
        C.card,
        0.75
      ),

      rounded(
        x,
        y - h / 2 + 0.05 * scale + fillH / 2,
        w - 0.10 * scale,
        fillH,
        color,
        color,
        0.74
      ),

      rect(
        x,
        y + h / 2 + 0.075 * scale,
        0.25 * scale,
        0.15 * scale,
        color,
        0.85,
        1
      ),

      line(
        x - 0.12 * scale,
        y + 0.10 * scale,
        x + 0.12 * scale,
        y + 0.10 * scale,
        C.ink,
        2
      ),

      line(
        x,
        y - 0.02 * scale,
        x,
        y + 0.22 * scale,
        C.ink,
        2
      )
    );
  }

  // ------------------------------------------------------------
  // Top-level visibility tracking
  // ------------------------------------------------------------

  // Never regroup objects that are already on screen.

  const visible = new Set();

  function put(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.FadeIn(o);
    });
  }

  function draw(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.Create(o);
    });
  }

  function take(...objects) {
    const a = [];

    for (const o of objects) {
      if (o && visible.has(o)) {
        visible.delete(o);
        a.push(new M.FadeOut(o));
      }
    }

    return a;
  }

  function clearPicture() {
    const a = Array.from(visible).map(o =>
      new M.FadeOut(o)
    );

    visible.clear();

    return a;
  }

  function lagIn(
    objects,
    lagRatio = 0.12,
    runTime = 1.4
  ) {
    objects.forEach(o => visible.add(o));

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function replace(oldObject, newObject) {
    return [
      ...take(oldObject),
      ...put(newObject)
    ];
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indentation =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indentation;
    });

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.40;

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
    const top = BOXP[1] + ht / 2 - 0.20 - lh / 2;

    texts.forEach((t, i) => {
      const indentation =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indentation + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 2.6 : 3.7;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }
    g.moveTo(P ? [BOXP[0], BOXP[1] + ht * scale / 2, 0] : BOXP);

    markStaged(g);
    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // 0–1: three batches, four batteries each
  // ------------------------------------------------------------

  const CARD_SP = P ? 2.18 : 2.28;
  const CARD_W = P ? 2.02 : 2.11;
  const CARD_H = P ? 3.45 : 2.91;
  const CARD_Y = P ? -1.05 : -0.62;

  const cardX = i =>
    CX + (i - 1) * CARD_SP;

  const batchFrames = GROUPS.map((g, i) =>
    new M.VGroup(
      rounded(
        cardX(i),
        CARD_Y,
        CARD_W,
        CARD_H,
        g.color
      ),

      txt(
        `BATCH ${g.name}`,
        P ? 21 : 19,
        g.color,
        cardX(i),
        CARD_Y + CARD_H / 2 - 0.31,
        false,
        CARD_W - 0.18
      )
    )
  );

  const labTitle = tag(
    'PHONE BATTERY TEST LAB',
    C.cyan,
    CX,
    P ? 1.29 : 1.2,
    18,
    6.4
  );

  await until(S(0));
  await play(
    ...put(labTitle),
    lagIn(batchFrames, 0.20, 1.25),
    ...say('THREE FACTORY BATCHES: A, B AND C'),
    ...fbox([
      'Battery life',
      'Measured in hours',
      ['Three factory batches', C.cyan]
    ])
  );

  const batchIcons = GROUPS.map((g, i) =>
    new M.VGroup(
      ...Array.from({ length: 4 }, (_, j) => {
        const col = j % 2;
        const row = Math.floor(j / 2);

        return battery(
          cardX(i) + (col - 0.5) * 0.73,
          CARD_Y + 0.43 - row * 0.91,
          P ? 0.72 : 0.65,
          g.color
        );
      }),

      txt(
        '4 batteries',
        P ? 17 : 16,
        g.color,
        cardX(i),
        CARD_Y - CARD_H / 2 + 0.31,
        false,
        CARD_W - 0.20
      )
    )
  );

  const totalBatteries = tag(
    '4 + 4 + 4 = 12 BATTERIES',
    C.green,
    CX,
    CARD_Y - CARD_H / 2 - 0.44,
    18,
    6.4
  );

  await until(S(1));
  await play(
    lagIn(batchIcons, 0.18, 1.2),
    ...put(totalBatteries),
    ...say('FOUR FROM EACH BATCH, TWELVE IN ALL', C.green),
    ...fbox([
      '3 groups × 4 batteries',
      ['N = 12', C.green],
      'Same standard test'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 2–4: reveal the exact measured battery lives
  // ------------------------------------------------------------

  function measuredBatch(g, i) {
    const x = cardX(i);

    const parts = [
      rounded(
        x,
        CARD_Y,
        CARD_W,
        CARD_H,
        g.color
      ),

      txt(
        `BATCH ${g.name}`,
        P ? 21 : 19,
        g.color,
        x,
        CARD_Y + CARD_H / 2 - 0.31,
        false,
        CARD_W - 0.16
      )
    ];

    const innerBase =
      CARD_Y - CARD_H / 2 + 0.91;

    const maxHeight =
      P ? 1.58 : 1.32;

    const spacing = CARD_W / 4.65;
    const barWidth = spacing * 0.62;

    g.values.forEach((v, j) => {
      const bx = x + (j - 1.5) * spacing;
      const bh = v / 30 * maxHeight;

      parts.push(
        rect(
          bx,
          innerBase + bh / 2,
          barWidth + 0.055,
          bh,
          g.color,
          0.10,
          1
        ),

        rect(
          bx,
          innerBase + bh / 2,
          barWidth,
          bh,
          g.color,
          0.75,
          1.5
        ),

        txt(
          v,
          P ? 15 : 14,
          g.color,
          bx,
          innerBase + bh + 0.20,
          true,
          spacing - 0.035
        )
      );
    });

    parts.push(
      line(
        x - CARD_W / 2 + 0.10,
        innerBase,
        x + CARD_W / 2 - 0.10,
        innerBase,
        C.muted,
        1.5
      ),

      txt(
        `Mean ${g.mean} h`,
        P ? 22 : 20,
        g.color,
        x,
        CARD_Y - CARD_H / 2 + 0.32,
        true,
        CARD_W - 0.18
      )
    );

    return new M.VGroup(...parts);
  }

  const measuredCards = GROUPS.map(measuredBatch);

  const batchA = GROUPS[0];
  const batchB = GROUPS[1];
  const batchC = GROUPS[2];

  await until(S(2));
  await play(
    ...take(batchFrames[0], batchIcons[0]),
    ...put(measuredCards[0]),
    ...say('BATCH A: 15, 17, 17, 19 HOURS', batchA.color),
    ...fbox([
      ['Batch A', batchA.color],
      '15 + 17 + 17 + 19',
      '68 ÷ 4',
      ['Mean = 17 hours', batchA.color]
    ], batchA.color)
  );

  await until(S(3));
  await play(
    ...take(batchFrames[1], batchIcons[1]),
    ...put(measuredCards[1]),
    ...say('BATCH B: 18, 20, 20, 22 HOURS', batchB.color),
    ...fbox([
      ['Batch B', batchB.color],
      '18 + 20 + 20 + 22',
      '80 ÷ 4',
      ['Mean = 20 hours', batchB.color]
    ], batchB.color)
  );

  await until(S(4));
  await play(
    ...take(batchFrames[2], batchIcons[2]),
    ...put(measuredCards[2]),
    ...say('BATCH C: 20, 22, 24, 26 HOURS', batchC.color),
    ...fbox([
      ['Batch C', batchC.color],
      '20 + 22 + 24 + 26',
      '92 ÷ 4',
      ['Mean = 23 hours', batchC.color]
    ], batchC.color)
  );

  // ------------------------------------------------------------
  // Three-column dot plot
  // ------------------------------------------------------------

  const XL = CX - (P ? 2.89 : 3.12);
  const XR = CX + (P ? 3.10 : 3.38);

  const YB = P ? -3.83 : -2.20;
  const YT = P ? 1.10 : 1.0;

  const HMIN = P ? 13 : 12.4;
  const HMAX = 28;

  const yy = hours =>
    YB + (hours - HMIN) / (HMAX - HMIN) *
    (YT - YB);

  const GX = [
    CX - (P ? 1.84 : 2.02),
    CX + 0.08,
    CX + (P ? 2.00 : 2.18)
  ];

  const MEAN_W = P ? 1.34 : 1.42;

  function groupAxes() {
    const parts = [
      line(
        XL, YB,
        XL, YT,
        C.muted, 2.5
      ),

      line(
        XL, YB,
        XR, YB,
        C.muted, 2
      ),

      txt(
        'Hours',
        P ? 18 : 17,
        C.muted,
        XL + 0.28,
        YT + 0.27
      )
    ];

    for (const v of [14, 16, 18, 20, 22, 24, 26, 28]) {
      const y = yy(v);

      parts.push(
        line(
          XL - 0.06,
          y,
          XL,
          y,
          C.muted,
          1.3
        ),

        txt(
          v,
          P ? 17 : 15,
          C.muted,
          XL - 0.29,
          y,
          true
        ),

        dashed(
          XL,
          y,
          XR,
          y,
          C.muted
        )
      );
    }

    GROUPS.forEach((g, i) => {
      parts.push(
        tag(
          `BATCH ${g.name}`,
          g.color,
          GX[i],
          YB - 0.38,
          P ? 18 : 16,
          1.55
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function dotX(values, groupIndex, j) {
    const v = values[j];

    const duplicates = values
      .map((value, index) => ({ value, index }))
      .filter(item => item.value === v);

    const rank = duplicates.findIndex(
      item => item.index === j
    );

    return GX[groupIndex] +
      (rank - (duplicates.length - 1) / 2) * 0.32;
  }

  function groupDots(g, i, values = g.values) {
    return values.map((v, j) =>
      glow(
        dotX(values, i, j),
        yy(v),
        g.color,
        P ? 0.115 : 0.093
      )
    );
  }

  function meanLine(i, mean = GROUPS[i].mean) {
    return line(
      GX[i] - MEAN_W / 2,
      yy(mean),
      GX[i] + MEAN_W / 2,
      yy(mean),
      GROUPS[i].color,
      4
    );
  }

  function meanLabel(i, mean = GROUPS[i].mean, low = Math.min(...GROUPS[i].values)) {
    // below the lowest dot of the column, so no dot or guide line hides the words
    return txt(
      `Mean ${mean}`,
      P ? 17 : 15,
      GROUPS[i].color,
      GX[i],
      yy(low) - (P ? 0.4 : 0.25),
      true,
      1.65
    );
  }

  function groupPlot(values = null) {
    const actualValues = values ||
      GROUPS.map(g => g.values);

    const means = actualValues.map(v =>
      v.reduce((a, b) => a + b, 0) / v.length
    );

    return {
      axes: groupAxes(),

      dots: GROUPS.map((g, i) =>
        groupDots(g, i, actualValues[i])
      ),

      means: means.map((v, i) =>
        meanLine(i, v)
      ),

      labels: means.map((v, i) =>
        meanLabel(i, v, Math.min(...actualValues[i]))
      )
    };
  }

  function plotObjects(plot) {
    return [
      plot.axes,
      ...plot.means,
      ...plot.dots.flat(),
      ...plot.labels
    ];
  }

  function grandMeanGuide() {
    return dashed(
      XL,
      yy(GRAND),
      XR,
      yy(GRAND),
      GOLD
    );
  }

  function grandMeanTag() {
    return tag(
      'GRAND MEAN = 20',
      GOLD,
      CX,
      YT + (P ? 0.34 : 0.26),
      P ? 18 : 16,
      3.65
    );
  }

  // ------------------------------------------------------------
  // 5: dots and their own batch means
  // ------------------------------------------------------------

  let plot = groupPlot();

  const dotMeaning = txt(
    '1 dot = 1 tested battery',
    P ? 17 : 16,
    C.muted,
    CX,
    YB - (P ? 0.98 : 0.72)
  );

  await until(S(5));
  await play(
    ...clearPicture(),
    ...put(plot.axes),
    lagIn(
      plot.dots.flat(),
      0.07,
      1.7
    ),
    ...draw(...plot.means),
    ...put(...plot.labels, dotMeaning),
    ...say('THREE DOT COLUMNS, THREE MEAN LINES'),
    ...fbox([
      ['A: mean 17', batchA.color],
      ['B: mean 20', batchB.color],
      ['C: mean 23', batchC.color],
      'Each dot is one battery'
    ])
  );

  // ------------------------------------------------------------
  // 6–7: are the differences real or just chance?
  // ------------------------------------------------------------

  const questionSpan = doubleArrow(
    GX[0],
    YT - 0.03,
    GX[2],
    YT - 0.03,
    C.amber,
    0.14
  );

  const differenceQuestion = tag(
    'REAL DIFFERENCES?',
    C.amber,
    CX,
    YT + (P ? 0.35 : 0.26),
    18,
    4.2
  );

  await until(S(6));
  await play(
    ...draw(questionSpan),
    ...put(differenceQuestion),
    ...say('REAL BATCH DIFFERENCES OR JUST CHANCE?', C.amber),
    ...fbox([
      'Observed means differ',
      '17, 20 and 23',
      ['Could chance explain this?', C.amber]
    ], C.amber)
  );

  const nullTag = tag(
    'H₀: ALL TRUE MEANS EQUAL',
    GOLD,
    CX,
    YT + (P ? 0.34 : 0.26),
    18,
    5.9
  );

  await until(S(7));
  await play(
    ...take(questionSpan, differenceQuestion),
    ...put(nullTag),
    ...say('THE NULL HYPOTHESIS', GOLD),
    ...fbox([
      ['H₀: μA = μB = μC', GOLD],
      'Alternative:',
      'At least one true mean',
      'differs from another'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 8–10: between-group and within-group spread
  // ------------------------------------------------------------

  const twoSpreads = tag(
    'TWO KINDS OF SPREAD',
    BETWEEN,
    CX,
    YT + 0.34,
    18,
    5.4
  );

  await until(S(8));
  await play(
    ...take(nullTag),
    ...put(twoSpreads),
    new M.LaggedStart(
      plot.means.map(m =>
        new M.Indicate(m, { color: BETWEEN })
      ),
      { lagRatio: 0.18, runTime: 1.1 }
    ),
    ...say('LOOK FOR TWO DIFFERENT KINDS OF SPREAD'),
    ...fbox([
      ['Between batches', BETWEEN],
      'Differences among means',
      ['Within batches', WITHIN],
      'Scatter around each mean'
    ])
  );

  const betweenStair = new M.VGroup(
    dashed(
      GX[0] + MEAN_W / 2,
      yy(17),
      GX[1] - 0.21,
      yy(17),
      BETWEEN
    ),

    doubleArrow(
      GX[1] - 0.21,
      yy(17),
      GX[1] - 0.21,
      yy(20),
      BETWEEN
    ),

    dashed(
      GX[1] + MEAN_W / 2,
      yy(20),
      GX[2] - 0.25,
      yy(20),
      BETWEEN
    ),

    doubleArrow(
      GX[2] - 0.25,
      yy(20),
      GX[2] - 0.25,
      yy(23),
      BETWEEN
    ),

    txt(
      '3 h',
      P ? 18 : 16,
      BETWEEN,
      GX[1] - 0.61,
      (yy(17) + yy(20)) / 2,
      true
    ),

    txt(
      '3 h',
      P ? 18 : 16,
      BETWEEN,
      GX[2] - 0.67,
      (yy(20) + yy(23)) / 2,
      true
    )
  );

  await until(S(9));
  await play(
    ...draw(betweenStair),
    ...say('BETWEEN: HOW FAR APART ARE THE MEAN LINES?', BETWEEN),
    ...fbox([
      ['Between-batch spread', BETWEEN],
      'Means: 17, 20, 23',
      'Compare their positions'
    ], BETWEEN)
  );

  function withinArrows(i) {
    const g = GROUPS[i];
    const parts = [];

    g.values.forEach((v, j) => {
      if (v === g.mean) return;

      const x =
        dotX(g.values, i, j) +
        (v < g.mean ? -0.25 : 0.25);

      parts.push(
        arrow(
          x,
          yy(g.mean),
          x,
          yy(v),
          WITHIN,
          0.09
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const withinGuides = GROUPS.map(
    (_, i) => withinArrows(i)
  );

  const withinOutlines = GROUPS.map((g, i) => {
    const lo = Math.min(...g.values);
    const hi = Math.max(...g.values);

    return rounded(
      GX[i],
      (yy(lo) + yy(hi)) / 2,
      MEAN_W + 0.23,
      yy(hi) - yy(lo) + 0.40,
      WITHIN,
      WITHIN,
      0.035
    );
  });

  await until(S(10));
  await play(
    ...take(betweenStair),
    ...draw(
      ...withinOutlines,
      ...withinGuides
    ),
    ...say('WITHIN: HOW FAR DO DOTS SCATTER FROM THEIR OWN MEAN?', WITHIN),
    ...fbox([
      ['Within-batch spread', WITHIN],
      'Each battery compared',
      'With its own batch mean',
      'Not the grand mean'
    ], WITHIN)
  );

  // ------------------------------------------------------------
  // 11–12: compare normal scatter with separated means
  // ------------------------------------------------------------

  // Hypothetical samples with nearby means.
  // These illustrate what ordinary sampling scatter might
  // look like when all groups share the same true mean.
  // They are not additional recorded battery observations.

  const HYPOTHETICAL = [
    [17, 19, 19, 21],
    [18, 20, 20, 22],
    [18, 20, 22, 24]
  ];

  function miniatureGroupPlot(
    cx, cy, w, h,
    values,
    title,
    color,
    note
  ) {
    const l = cx - w / 2 + 0.35;
    const r = cx + w / 2 - 0.20;

    const b = cy - h / 2 + 0.66;
    const t = cy + h / 2 - 0.52;

    const sy = v =>
      b + (v - HMIN) / (HMAX - HMIN) *
      (t - b);

    const sx = i =>
      l + (i + 0.5) / 3 * (r - l);

    const parts = [
      rounded(cx, cy, w, h, color),

      txt(
        title,
        P ? 18 : 16,
        color,
        cx,
        cy + h / 2 - 0.24,
        false,
        w - 0.20
      ),

      line(l, b, l, t, C.muted, 1.5),

      line(l, b, r, b, C.muted, 1.5),

      dashed(l, sy(20), r, sy(20), GOLD)
    ];

    for (const tick of [14, 20, 26]) {
      parts.push(
        txt(
          tick,
          15,
          C.muted,
          l - 0.22,
          sy(tick),
          true,
          0.42
        )
      );
    }

    values.forEach((vals, i) => {
      const g = GROUPS[i];

      const mean =
        vals.reduce((a, v) => a + v, 0) / vals.length;

      parts.push(
        line(
          sx(i) - (r - l) / 10,
          sy(mean),
          sx(i) + (r - l) / 10,
          sy(mean),
          g.color,
          3
        ),

        txt(
          g.name,
          16,
          g.color,
          sx(i),
          b - 0.19
        )
      );

      vals.forEach((v, j) => {
        const earlier =
          vals.slice(0, j).filter(a => a === v).length;

        const number =
          vals.filter(a => a === v).length;

        parts.push(
          glow(
            sx(i) +
              (earlier - (number - 1) / 2) * 0.16,
            sy(v),
            g.color,
            P ? 0.061 : 0.049
          )
        );
      });
    });

    parts.push(
      txt(
        note,
        P ? 16 : 15,
        C.muted,
        cx,
        cy - h / 2 + 0.15,
        false,
        w - 0.20
      )
    );

    return new M.VGroup(...parts);
  }

  const COMP_W = P ? 6.0 : 3.9;
  const COMP_H = P ? 2.72 : 3.35;

  const hypotheticalPanel = miniatureGroupPlot(
    P ? CX : CX - 2.05,
    P ? -0.04 : -0.62,
    COMP_W,
    COMP_H,
    HYPOTHETICAL,
    'IF TRUE MEANS WERE EQUAL',
    C.muted,
    'Illustrative possible samples'
  );

  const actualPanel = miniatureGroupPlot(
    P ? CX : CX + 2.05,
    P ? -3.04 : -0.62,
    COMP_W,
    COMP_H,
    GROUPS.map(g => g.values),
    'OUR OBSERVED BATCHES',
    C.cyan,
    'Actual measured battery lives'
  );

  const normalScatterNote = tag(
    'SAMPLE MEANS CAN DIFFER BY CHANCE',
    GOLD,
    CX,
    P ? 1.55 : 1.39,
    16,
    6.4
  );

  await until(S(11));
  await play(
    ...clearPicture(),
    ...put(hypotheticalPanel, normalScatterNote),
    ...say('EVEN EQUAL TRUE MEANS CAN GIVE DIFFERENT SAMPLE MEANS', GOLD),
    ...fbox([
      'If the null is true:',
      'Means still vary',
      ['Ordinary sampling scatter', GOLD],
      'Can explain some gaps'
    ], GOLD)
  );

  await until(S(12));
  await play(
    ...put(actualPanel),
    new M.Indicate(actualPanel, { color: BETWEEN }),
    ...say('COMPARE BETWEEN SPREAD WITH WITHIN SPREAD', BETWEEN),
    ...fbox([
      ['Large between spread?', BETWEEN],
      ['Small within spread?', WITHIN],
      'A large ratio suggests',
      'Different true means'
    ], BETWEEN)
  );

  // ------------------------------------------------------------
  // 13: grand mean of all twelve batteries
  // ------------------------------------------------------------

  plot = groupPlot();

  const grandLine = grandMeanGuide();
  const grandTag = grandMeanTag();

  const totalHours = ALL.reduce(
    (a, b) => a + b,
    0
  );

  const grandCalculation = tag(
    `${totalHours} ÷ 12 = 20 HOURS`,
    GOLD,
    CX,
    P ? -4.95 : -2.90,
    P ? 20 : 16,
    6.3
  );

  await until(S(13));
  await play(
    ...clearPicture(),
    ...put(...plotObjects(plot)),
    ...draw(grandLine),
    ...put(grandTag, grandCalculation),
    ...say('STEP ONE: GRAND MEAN = 20 HOURS', GOLD),
    ...fbox([
      ['Grand mean', GOLD],
      '68 + 80 + 92 = 240',
      '240 ÷ 12',
      ['= 20 hours', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 14: deviations of the three means from the grand mean
  // ------------------------------------------------------------

  function betweenDeviation(i) {
    const g = GROUPS[i];
    const delta = g.mean - GRAND;

    const x = GX[i] + 0.65;

    if (delta === 0) {
      return new M.VGroup(
        ring(
          x,
          yy(GRAND),
          BETWEEN,
          0.13
        ),

        txt(
          '0',
          P ? 23 : 20,
          BETWEEN,
          x,
          yy(GRAND) - 0.34,
          true
        )
      );
    }

    return new M.VGroup(
      arrow(
        x,
        yy(GRAND),
        x,
        yy(g.mean),
        BETWEEN,
        0.13
      ),

      txt(
        signed(delta),
        P ? 24 : 21,
        BETWEEN,
        x + 0.32,
        (yy(GRAND) + yy(g.mean)) / 2,
        true
      )
    );
  }

  const betweenDeviations = GROUPS.map(
    (_, i) => betweenDeviation(i)
  );

  await until(S(14));
  await play(
    ...take(grandCalculation),
    ...draw(...betweenDeviations),
    ...say('STEP TWO: EACH MEAN’S DISTANCE FROM TWENTY', BETWEEN),
    ...fbox([
      ['A: 17 − 20 = −3', batchA.color],
      ['B: 20 − 20 = 0', batchB.color],
      ['C: 23 − 20 = +3', batchC.color]
    ], BETWEEN)
  );

  // ------------------------------------------------------------
  // 15: turn signed distances into squared distances
  // ------------------------------------------------------------

  // One tile represents one squared-hour unit.
  // A deviation of magnitude three becomes a 3 × 3 square.

  function squareTiles(
    x, y, magnitude,
    color,
    cell = 0.27
  ) {
    if (magnitude === 0) {
      return new M.VGroup(
        circle(
          x,
          y,
          cell * 0.63,
          color,
          0
        )
      );
    }

    const parts = [];

    for (let r = 0; r < magnitude; r++) {
      for (let c = 0; c < magnitude; c++) {
        parts.push(
          rect(
            x + (c - (magnitude - 1) / 2) * cell,
            y + ((magnitude - 1) / 2 - r) * cell,
            cell * 0.84,
            cell * 0.84,
            color,
            0.78,
            1
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  const SQ_SP = P ? 2.10 : 2.24;
  const SQ_Y = P ? -0.80 : -0.35;

  function squareCard(i) {
    const g = GROUPS[i];
    const d = BETWEEN_DEV[i];

    const x = CX + (i - 1) * SQ_SP;

    return new M.VGroup(
      rounded(
        x,
        SQ_Y,
        SQ_SP - 0.15,
        P ? 3.55 : 2.85,
        g.color
      ),

      txt(
        `BATCH ${g.name}`,
        P ? 20 : 18,
        g.color,
        x,
        SQ_Y + (P ? 1.42 : 1.15)
      ),

      txt(
        signed(d),
        P ? 29 : 25,
        g.color,
        x,
        SQ_Y + (P ? 0.78 : 0.66),
        true
      ),

      squareTiles(
        x,
        SQ_Y - 0.18,
        Math.abs(d),
        BETWEEN,
        P ? 0.36 : 0.29
      ),

      txt(
        `${BETWEEN_SQUARES[i]}`,
        P ? 32 : 28,
        BETWEEN,
        x,
        SQ_Y - (P ? 1.30 : 1.03),
        true
      )
    );
  }

  const squaredCards = GROUPS.map(
    (_, i) => squareCard(i)
  );

  const squareNote = txt(
    '1 tile = 1 squared-hour unit',
    P ? 17 : 16,
    C.muted,
    CX,
    SQ_Y - (P ? 2.23 : 1.79)
  );

  await until(S(15));
  await play(
    ...clearPicture(),
    lagIn(squaredCards, 0.15, 1.2),
    ...put(squareNote),
    ...say('SQUARE THE THREE DISTANCES: 9, 0, 9', BETWEEN),
    ...fbox([
      '(−3)² = 9',
      '  0²  = 0',
      ' (+3)² = 9'
    ], BETWEEN)
  );

  // ------------------------------------------------------------
  // 16: each group mean represents four batteries
  // ------------------------------------------------------------

  const WEIGHT_Y = P ? -0.95 : -0.42;

  function weightedSquareCard(i) {
    const g = GROUPS[i];
    const d = BETWEEN_DEV[i];

    const x = CX + (i - 1) * SQ_SP;

    const w = SQ_SP - 0.14;
    const h = P ? 3.75 : 3.05;

    const parts = [
      rounded(x, WEIGHT_Y, w, h, g.color),

      txt(
        `BATCH ${g.name}`,
        P ? 20 : 18,
        g.color,
        x,
        WEIGHT_Y + h / 2 - 0.29
      )
    ];

    for (let j = 0; j < 4; j++) {
      const col = j % 2;
      const row = Math.floor(j / 2);

      parts.push(
        squareTiles(
          x + (col - 0.5) * 0.77,
          WEIGHT_Y + 0.55 - row * 0.74,
          Math.abs(d),
          BETWEEN,
          P ? 0.19 : 0.17
        )
      );
    }

    parts.push(
      txt(
        `4 × ${BETWEEN_SQUARES[i]}`,
        P ? 21 : 18,
        g.color,
        x,
        WEIGHT_Y - 0.73,
        true
      ),

      txt(
        BETWEEN_CONTRIBUTIONS[i],
        P ? 32 : 27,
        BETWEEN,
        x,
        WEIGHT_Y - h / 2 + 0.32,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const weightedCards = GROUPS.map(
    (_, i) => weightedSquareCard(i)
  );

  const betweenTotalTag = tag(
    '36 + 0 + 36 = 72',
    BETWEEN,
    CX,
    WEIGHT_Y - (P ? 2.36 : 1.97),
    P ? 23 : 20,
    6.4
  );

  await until(S(16));
  await play(
    ...clearPicture(),
    lagIn(weightedCards, 0.17, 1.8),
    ...put(betweenTotalTag),
    ...say('COUNT EACH BATCH MEAN FOUR TIMES', BETWEEN),
    ...fbox([
      ['A: 4 × 9 = 36', batchA.color],
      ['B: 4 × 0 = 0', batchB.color],
      ['C: 4 × 9 = 36', batchC.color],
      ['Between SS = 72', BETWEEN]
    ], BETWEEN)
  );

  // ------------------------------------------------------------
  // 17–18: divide the between sum of squares by its df
  // ------------------------------------------------------------

  function tileHeap(
    x, y, count,
    color,
    cols,
    cell
  ) {
    const rows = Math.ceil(count / cols);

    return new M.VGroup(
      ...Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        return rect(
          x + (col - (cols - 1) / 2) * cell,
          y + ((rows - 1) / 2 - row) * cell,
          cell * 0.83,
          cell * 0.83,
          color,
          0.76,
          0.8
        );
      })
    );
  }

  const SHARE_Y = P ? -1.22 : -0.59;

  const betweenShares = [-1, 1].map(side => {
    const x = CX + side * 1.64;

    return new M.VGroup(
      rounded(
        x,
        SHARE_Y,
        2.91,
        P ? 2.78 : 2.25,
        BETWEEN
      ),

      tileHeap(
        x,
        SHARE_Y + 0.26,
        36,
        BETWEEN,
        6,
        P ? 0.255 : 0.218
      ),

      txt(
        '36',
        P ? 30 : 26,
        BETWEEN,
        x,
        SHARE_Y - (P ? 1.03 : 0.82),
        true
      )
    );
  });

  const betweenDF = tag(
    '3 MEANS − 1 = 2 df',
    GOLD,
    CX,
    P ? 0.98 : 1.17,
    20
  );

  const betweenDivide = tag(
    '72 ÷ 2 = 36',
    BETWEEN,
    CX,
    P ? -3.28 : -2.35,
    23
  );

  await until(S(17));
  await play(
    ...clearPicture(),
    ...put(betweenDF),
    lagIn(betweenShares, 0.22, 1.25),
    ...put(betweenDivide),
    ...say('TWO DEGREES OF FREEDOM: 72 ÷ 2 = 36', BETWEEN),
    ...fbox([
      'Between SS = 72',
      'df = 3 − 1 = 2',
      ['72 ÷ 2 = 36', BETWEEN]
    ], BETWEEN)
  );

  const betweenName = tag(
    'BETWEEN-BATCH MEAN SQUARE',
    BETWEEN,
    CX,
    P ? -4.15 : -3.02,
    P ? 18 : 15,
    6.5
  );

  await until(S(18));
  await play(
    ...put(betweenName),
    new M.Indicate(
      betweenDivide,
      { color: BETWEEN }
    ),
    ...say('BETWEEN-BATCH MEAN SQUARE = 36', BETWEEN),
    ...fbox([
      ['MS between', BETWEEN],
      '= SS between ÷ df',
      '= 72 ÷ 2',
      ['= 36 squared hours', BETWEEN]
    ], BETWEEN)
  );

  // ------------------------------------------------------------
  // 19: within-group deviations
  // ------------------------------------------------------------

  plot = groupPlot();

  const withinTitle = tag(
    'DISTANCE FROM YOUR OWN MEAN',
    WITHIN,
    CX,
    YT + 0.34,
    17,
    6.3
  );

  const ownMeanArrows = GROUPS.map(
    (_, i) => withinArrows(i)
  );

  function withinDeviationLabel(i, j) {
    const g = GROUPS[i];

    const v = g.values[j];
    const d = g.deviations[j];

    const x = dotX(g.values, i, j);
    const y = yy(v);

    const dx = d < 0 ? -0.39 : 0.39;

    return txt(
      signed(d),
      P ? 17 : 15,
      WITHIN,
      x + dx,
      y,
      true,
      0.56
    );
  }

  const ownDeviationLabels = GROUPS.flatMap(
    (g, i) => g.values
      .map((_, j) =>
        g.deviations[j] === 0
          ? null
          : withinDeviationLabel(i, j)
      )
      .filter(Boolean)
  );

  await until(S(19));
  await play(
    ...clearPicture(),
    ...put(...plotObjects(plot), withinTitle),
    ...draw(...ownMeanArrows),
    ...put(...ownDeviationLabels),
    ...say('STEP THREE: SQUARE DISTANCES FROM EACH OWN BATCH MEAN', WITHIN),
    ...fbox([
      ['Within-batch spread', WITHIN],
      'For every battery:',
      'Battery life − own mean',
      'Square the distance'
    ], WITHIN)
  );

  // ------------------------------------------------------------
  // 20: the three within-batch sums of squares
  // ------------------------------------------------------------

  const WITHIN_SP = P ? 2.18 : 2.28;
  const WITHIN_Y = P ? -0.94 : -0.43;

  function withinSquareCard(g, i) {
    const x = CX + (i - 1) * WITHIN_SP;
    const w = WITHIN_SP - 0.15;
    const h = P ? 3.80 : 3.04;

    const parts = [
      rounded(
        x,
        WITHIN_Y,
        w,
        h,
        g.color
      ),

      txt(
        `BATCH ${g.name}`,
        P ? 20 : 18,
        g.color,
        x,
        WITHIN_Y + h / 2 - 0.29
      )
    ];

    g.deviations.forEach((d, j) => {
      const col = j % 2;
      const row = Math.floor(j / 2);

      const px = x + (col - 0.5) * 0.85;
      const py = WITHIN_Y + 0.70 - row * 0.95;

      parts.push(
        squareTiles(
          px,
          py,
          Math.abs(d),
          g.color,
          P ? 0.19 : 0.16
        ),

        txt(
          `${g.squares[j]}`,
          P ? 19 : 17,
          g.color,
          px,
          py - 0.40,
          true
        )
      );
    });

    parts.push(
      txt(
        g.squares.join(' + '),
        P ? 16 : 15,
        C.ink,
        x,
        WITHIN_Y - 0.97,
        true,
        w - 0.15
      ),

      txt(
        `SS = ${g.ss}`,
        P ? 26 : 22,
        WITHIN,
        x,
        WITHIN_Y - h / 2 + 0.31,
        true,
        w - 0.15
      )
    );

    return new M.VGroup(...parts);
  }

  const withinSquareCards = GROUPS.map(
    withinSquareCard
  );

  const withinTotal = tag(
    '8 + 8 + 20 = 36',
    WITHIN,
    CX,
    WITHIN_Y - (P ? 2.34 : 1.93),
    P ? 23 : 20
  );

  await until(S(20));
  await play(
    ...clearPicture(),
    lagIn(withinSquareCards, 0.17, 1.7),
    ...put(withinTotal),
    ...say('WITHIN SUM OF SQUARES: 8 + 8 + 20 = 36', WITHIN),
    ...fbox([
      ['A: 4+0+0+4 = 8', batchA.color],
      ['B: 4+0+0+4 = 8', batchB.color],
      ['C: 9+1+1+9 = 20', batchC.color],
      ['Within SS = 36', WITHIN]
    ], WITHIN)
  );

  // ------------------------------------------------------------
  // 21: pool the within-batch squared distances
  // ------------------------------------------------------------

  // Each visible square is one unit of squared deviation.
  // The pool contains exactly 8 cyan, 8 amber and 20 pink
  // tiles, preserving all three contributions.

  const POOL_Y = P ? -1.75 : -0.86;
  const POOL_CELL = P ? 0.37 : 0.30;

  const pooledColors = GROUPS.flatMap(g =>
    Array.from({ length: g.ss }, () => g.color)
  );

  const poolFrame = rounded(
    CX,
    POOL_Y,
    P ? 3.25 : 3.0,
    P ? 2.95 : 2.36,
    WITHIN,
    WITHIN,
    0.045
  );

  const pooledTiles = pooledColors.map((color, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);

    return rect(
      CX + (col - 2.5) * POOL_CELL,
      POOL_Y + (2.5 - row) * POOL_CELL,
      POOL_CELL * 0.84,
      POOL_CELL * 0.84,
      color,
      0.79,
      1
    );
  });

  const poolInputs = GROUPS.map((g, i) => {
    const x = CX + (i - 1) * 2.0;

    return tag(
      `${g.name}: ${g.ss}`,
      g.color,
      x,
      P ? 0.94 : 1.13,
      20,
      1.75
    );
  });

  const poolArrows = GROUPS.map((_, i) =>
    arrow(
      CX + (i - 1) * 2.0,
      P ? 0.55 : 0.82,
      CX + (i - 1) * 0.85,
      POOL_Y + (P ? 1.52 : 1.23),
      GROUPS[i].color,
      0.11
    )
  );

  const poolTotal = tag(
    'POOLED WITHIN SS = 36',
    WITHIN,
    CX,
    POOL_Y - (P ? 1.95 : 1.62),
    19,
    6.3
  );

  await until(S(21));
  await play(
    ...clearPicture(),
    ...put(...poolInputs, poolFrame),
    ...draw(...poolArrows),
    lagIn(pooledTiles, 0.023, 1.7),
    ...put(poolTotal),
    ...say('POOL THE SCATTER FROM ALL THREE BATCHES', WITHIN),
    ...fbox([
      'Like the pooled t-test',
      'Add within-group SS',
      'Now there are 3 groups',
      ['8 + 8 + 20 = 36', WITHIN]
    ], WITHIN)
  );

  // ------------------------------------------------------------
  // 22: twelve batteries minus three fitted means
  // ------------------------------------------------------------

  // With four observations in each group, the four
  // deviations from their fitted group mean sum to zero.
  // Only three deviations in each group are free.
  // Therefore total within df = 3 + 3 + 3 = 9.

  const DF_TOP = P ? 0.99 : 1.13;

  const dfBatteryRows = GROUPS.map((g, i) => {
    const x = CX + (i - 1) * 2.10;

    const parts = [
      txt(
        `BATCH ${g.name}`,
        17,
        g.color,
        x,
        DF_TOP
      )
    ];

    for (let j = 0; j < 4; j++) {
      const bx = x + (j - 1.5) * 0.43;
      const color = j === 3 ? C.muted : g.color;

      parts.push(
        battery(
          bx,
          DF_TOP - 0.56,
          0.46,
          color
        )
      );

      if (j === 3) {
        parts.push(
          line(
            bx - 0.13,
            DF_TOP - 0.68,
            bx + 0.13,
            DF_TOP - 0.43,
            GOLD,
            2.5
          )
        );
      }
    }

    parts.push(
      txt(
        '4 − 1 = 3 df',
        P ? 17 : 15,
        g.color,
        x,
        DF_TOP - 1.03,
        true,
        1.87
      )
    );

    return new M.VGroup(...parts);
  });

  const DF_SHARE_Y = P ? -2.45 : -1.32;

  function withinShare(i) {
    const col = i % 3;
    const row = Math.floor(i / 3);

    const x = CX + (col - 1) * 1.48;
    const y = DF_SHARE_Y +
      (1 - row) * (P ? 0.91 : 0.61);

    const cell = P ? 0.21 : 0.155;

    const parts = [
      rounded(
        x,
        y,
        1.32,
        P ? 0.80 : 0.55,
        WITHIN
      )
    ];

    for (let j = 0; j < 4; j++) {
      parts.push(
        rect(
          x - 0.17 +
            ((j % 2) - 0.5) * cell,
          y +
            (0.5 - Math.floor(j / 2)) * cell,
          cell * 0.84,
          cell * 0.84,
          WITHIN,
          0.78,
          0.8
        )
      );
    }

    parts.push(
      txt(
        '4',
        P ? 23 : 20,
        WITHIN,
        x + 0.35,
        y,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const withinShares = Array.from(
    { length: 9 },
    (_, i) => withinShare(i)
  );

  const withinDivide = tag(
    '36 ÷ 9 = 4',
    WITHIN,
    CX,
    P ? -4.17 : -2.54,
    23
  );

  await until(S(22));
  await play(
    ...clearPicture(),
    ...put(...dfBatteryRows),
    lagIn(withinShares, 0.085, 1.55),
    ...put(withinDivide),
    ...say('TWELVE MINUS THREE = NINE DEGREES OF FREEDOM', WITHIN),
    ...fbox([
      'Within SS = 36',
      'df = 12 − 3 = 9',
      ['36 ÷ 9 = 4', WITHIN],
      'Nine equal arithmetic shares'
    ], WITHIN)
  );

  // ------------------------------------------------------------
  // 23: name the within-batch mean square
  // ------------------------------------------------------------

  await until(S(23));
  await play(
    new M.Indicate(
      withinDivide,
      { color: WITHIN }
    ),
    ...say('WITHIN-BATCH MEAN SQUARE = 4', WITHIN),
    ...fbox([
      ['MS within', WITHIN],
      '= SS within ÷ df',
      '= 36 ÷ 9',
      ['= 4 squared hours', WITHIN]
    ], WITHIN)
  );

  // ------------------------------------------------------------
  // 24–25: form the F ratio
  // ------------------------------------------------------------

  // Use a 6 × 6 square of 36 units and a 2 × 2 square
  // of four units. Both use the same tile size.
  //
  // Nine small squares of area four exactly cover
  // the large square of area thirty-six.

  const RATIO_Y = P ? -1.02 : -0.54;

  const RATIO_CELL = P ? 0.40 : 0.35;

  const BIG_X = CX - 1.65;
  const SMALL_X = CX + 1.78;

  const betweenSquare = tileHeap(
    BIG_X,
    RATIO_Y,
    MS_B,
    BETWEEN,
    6,
    RATIO_CELL
  );

  const withinSquare = tileHeap(
    SMALL_X,
    RATIO_Y,
    MS_W,
    WITHIN,
    2,
    RATIO_CELL
  );

  const betweenSquareTitle = txt(
    'BETWEEN MS',
    P ? 20 : 18,
    BETWEEN,
    BIG_X,
    RATIO_Y + 1.65,
    false,
    2.7
  );

  const withinSquareTitle = txt(
    'WITHIN MS',
    P ? 20 : 18,
    WITHIN,
    SMALL_X,
    RATIO_Y + 1.65,
    false,
    2.7
  );

  const betweenSquareNumber = txt(
    MS_B,
    P ? 37 : 31,
    BETWEEN,
    BIG_X,
    RATIO_Y - 1.60,
    true
  );

  const withinSquareNumber = txt(
    MS_W,
    P ? 37 : 31,
    WITHIN,
    SMALL_X,
    RATIO_Y - 1.60,
    true
  );

  const ratioSymbol = txt(
    '÷',
    34,
    C.ink,
    CX + 0.35,
    RATIO_Y,
    true
  );

  const ratioAnswer = tag(
    'F = 36 ÷ 4 = 9',
    GOLD,
    CX,
    P ? -3.87 : -2.72,
    P ? 26 : 22,
    6.3
  );

  await until(S(24));
  await play(
    ...clearPicture(),
    ...put(
      betweenSquare,
      withinSquare,
      betweenSquareTitle,
      withinSquareTitle,
      betweenSquareNumber,
      withinSquareNumber,
      ratioSymbol,
      ratioAnswer
    ),
    ...say('STEP FOUR: DIVIDE BETWEEN BY WITHIN', GOLD),
    ...fbox([
      ['Between MS = 36', BETWEEN],
      ['Within MS = 4', WITHIN],
      ['F = 36 ÷ 4 = 9', GOLD]
    ], GOLD)
  );

  const nineOutlines = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      nineOutlines.push(
        rect(
          BIG_X + (c - 1) * 2 * RATIO_CELL,
          RATIO_Y + (1 - r) * 2 * RATIO_CELL,
          2 * RATIO_CELL - 0.025,
          2 * RATIO_CELL - 0.025,
          WITHIN,
          0,
          2.4
        )
      );
    }
  }

  const nineTimesTag = tag(
    '9 TIMES AS LARGE',
    GOLD,
    SMALL_X,
    RATIO_Y - 0.92,
    17,
    2.6
  );

  await until(S(25));
  await play(
    ...draw(...nineOutlines),
    ...put(nineTimesTag),
    ...say('BETWEEN MEAN SQUARE IS NINE TIMES WITHIN', GOLD),
    ...fbox([
      '36 = 9 × 4',
      ['F ratio = 9', GOLD],
      'Ratio of mean squares',
      'Not a ratio of raw SDs'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 26–27: what would happen under the null?
  // ------------------------------------------------------------

  // Under the ordinary ANOVA assumptions, both mean
  // squares estimate the same error variance under H0.
  //
  // This equal-square picture illustrates comparable
  // variance estimates; it does not claim every null
  // sample must produce an F statistic of exactly one.

  const NULL_Y = P ? -0.94 : -0.43;

  function equalVarianceCard(x, color, label) {
    return new M.VGroup(
      rounded(
        x,
        NULL_Y,
        2.80,
        P ? 3.10 : 2.65,
        color
      ),

      txt(
        label,
        P ? 19 : 17,
        color,
        x,
        NULL_Y + 0.96,
        false,
        2.55
      ),

      tileHeap(
        x,
        NULL_Y + 0.02,
        4,
        color,
        2,
        0.37
      ),

      txt(
        'Same scale',
        P ? 18 : 17,
        C.muted,
        x,
        NULL_Y - 0.88
      )
    );
  }

  const nullCards = [
    equalVarianceCard(
      CX - 1.68,
      BETWEEN,
      'BETWEEN MS'
    ),

    equalVarianceCard(
      CX + 1.68,
      WITHIN,
      'WITHIN MS'
    )
  ];

  const nearOne = tag(
    'F OFTEN NEAR 1',
    GOLD,
    CX,
    P ? -3.11 : -2.29,
    22
  );

  const nullIllustrationNote = txt(
    'Illustrative equal-variance comparison',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -3.75 : -2.78,
    false,
    6.3
  );

  await until(S(26));
  await play(
    ...clearPicture(),
    ...put(...nullCards, nearOne, nullIllustrationNote),
    ...say('IF THE NULL IS TRUE, F IS OFTEN NEAR ONE', GOLD),
    ...fbox([
      ['Under the null', GOLD],
      'Comparable mean squares',
      'Ratio often near 1',
      'But still varies by chance'
    ], GOLD)
  );

  const sameScatter = tag(
    'BOTH ESTIMATE THE SAME VARIANCE',
    C.green,
    CX,
    P ? 1.23 : 1.32,
    17,
    6.35
  );

  await until(S(27));
  await play(
    ...put(sameScatter),
    new M.Indicate(nullCards[0], { color: BETWEEN }),
    new M.Indicate(nullCards[1], { color: WITHIN }),
    ...say('BOTH MEAN SQUARES MEASURE NORMAL SCATTER UNDER H₀', C.green),
    ...fbox([
      'If group means are equal:',
      'Between MS estimates σ²',
      'Within MS estimates σ²',
      ['Their scales agree', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // F distribution layout
  // ------------------------------------------------------------

  // The curve starts at zero and extends to positive infinity.
  // Only the interval 0 to 12 is drawn.
  // Probability labels use the full, untruncated distribution.

  const FL = CX - (P ? 2.87 : 3.13);
  const FR = CX + (P ? 3.05 : 3.38);

  const FB = P ? -3.51 : -2.13;
  const FT = P ? 1.05 : 1.08;

  const FMAX = 12;

  const fx = value =>
    FL + value / FMAX * (FR - FL);

  const fy = value =>
    FB + fDensity(value) * (FT - FB);

  function fAxes() {
    const parts = [
      line(FL, FB, FR, FB, C.muted, 2.5),

      line(FL, FB, FL, FT, C.muted, 2),

      txt(
        'Density',
        P ? 17 : 16,
        C.muted,
        FL + 0.25,
        FT + 0.25
      ),

      txt(
        'F ratio',
        P ? 19 : 18,
        GOLD,
        CX,
        FB - 0.67
      ),

      arrow(
        FR - 0.26,
        FB,
        FR,
        FB,
        C.muted,
        0.10
      )
    ];

    for (const value of [0, 2, 4, 6, 8, 10, 12]) {
      parts.push(
        line(
          fx(value),
          FB,
          fx(value),
          FB - 0.065,
          C.muted,
          1.3
        ),

        txt(
          value,
          P ? 17 : 15,
          C.muted,
          fx(value),
          FB - 0.26,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fCurve() {
    const parts = [];

    const steps = 180;

    for (let i = 0; i < steps; i++) {
      const a = FMAX * i / steps;
      const b = FMAX * (i + 1) / steps;

      parts.push(
        line(
          fx(a),
          fy(a),
          fx(b),
          fy(b),
          C.cyan,
          3.3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fArea(
    from,
    to,
    color,
    opacity = 0.64
  ) {
    const a = Math.max(0, from);
    const b = Math.min(FMAX, to);

    const steps = Math.max(
      1,
      Math.ceil((b - a) / 0.055)
    );

    const dx = (b - a) / steps;

    const parts = [];

    for (let i = 0; i < steps; i++) {
      const l = a + i * dx;
      const r = a + (i + 1) * dx;

      const mid = (l + r) / 2;

      const h = fy(mid) - FB;

      if (h < 0.0001) continue;

      parts.push(
        rect(
          (fx(l) + fx(r)) / 2,
          FB + h / 2,
          fx(r) - fx(l) + 0.001,
          h,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fPlot(title = 'F DISTRIBUTION UNDER H₀') {
    return {
      background: fArea(
        0,
        FMAX,
        C.cyan,
        0.10
      ),

      axes: fAxes(),

      curve: fCurve(),

      title: txt(
        title,
        P ? 19 : 18,
        C.cyan,
        CX + 0.48,
        FT + 0.34,
        false,
        5.35
      ),

      dfTag: tag(
        'F(2, 9)',
        C.cyan,
        FR - 0.91,
        FT - 0.26,
        19,
        2.1
      )
    };
  }

  function fPlotObjects(p) {
    return [
      p.background,
      p.axes,
      p.curve,
      p.title,
      p.dfTag
    ];
  }

  // ------------------------------------------------------------
  // 28: F distribution with two and nine degrees of freedom
  // ------------------------------------------------------------

  let distribution = fPlot();

  const aroundOne = new M.VGroup(
    dashed(
      fx(1),
      FB,
      fx(1),
      fy(1),
      GOLD
    ),

    glow(
      fx(1),
      fy(1),
      GOLD,
      0.075
    ),

    txt(
      'F = 1',
      P ? 18 : 16,
      GOLD,
      fx(1) + 0.67,
      fy(1) + 0.20,
      true
    )
  );

  await until(S(28));
  await play(
    ...clearPicture(),
    ...put(distribution.background, distribution.axes),
    ...draw(distribution.curve),
    ...put(
      distribution.title,
      distribution.dfTag,
      aroundOne
    ),
    ...say('USE THE F CURVE WITH 2 AND 9 DEGREES OF FREEDOM'),
    ...fbox([
      ['F distribution', C.cyan],
      ['Numerator df = 2', BETWEEN],
      ['Denominator df = 9', WITHIN],
      'F(2, 9)'
    ])
  );

  // ------------------------------------------------------------
  // 29: critical value and observed F
  // ------------------------------------------------------------

  const rejectionArea = fArea(
    F_CRIT,
    FMAX,
    C.amber,
    0.65
  );

  const criticalMarker = dashed(
    fx(F_CRIT),
    FB,
    fx(F_CRIT),
    FB + (P ? 1.62 : 1.30),
    C.amber
  );

  const criticalBadge = tag(
    '4.26',
    C.amber,
    fx(F_CRIT),
    FB + (P ? 1.91 : 1.56),
    P ? 19 : 17,
    1.35
  );

  const criticalTailLabel = tag(
    '5% TAIL',
    C.amber,
    fx(6.15),
    FB + (P ? 0.75 : 0.59),
    17,
    2.00
  );

  const observedFLine = line(
    fx(F_OBS),
    FB,
    fx(F_OBS),
    FB + (P ? 2.65 : 1.99),
    GOLD,
    2.7
  );

  const observedFBadge = tag(
    'OUR F = 9',
    GOLD,
    fx(F_OBS),
    FB + (P ? 2.97 : 2.24),
    P ? 21 : 19,
    2.5
  );

  const farBeyond = arrow(
    fx(F_CRIT) + 0.10,
    FB + (P ? 1.19 : 0.97),
    fx(F_OBS) - 0.10,
    FB + (P ? 1.19 : 0.97),
    GOLD,
    0.15
  );

  await until(S(29));
  await play(
    ...take(aroundOne),
    ...put(rejectionArea),
    ...draw(
      criticalMarker,
      observedFLine,
      farBeyond
    ),
    ...put(
      criticalBadge,
      criticalTailLabel,
      observedFBadge
    ),
    ...say('THE 5% CUT-OFF IS ABOUT 4.3. OUR F IS 9.', GOLD),
    ...fbox([
      'At α = 0.05:',
      ['Critical F ≈ 4.26', C.amber],
      ['Observed F = 9', GOLD],
      'Far into the right tail'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 30: p-value is under one percent
  // ------------------------------------------------------------

  const pTail = fArea(
    F_OBS,
    FMAX,
    RED,
    0.92
  );

  const pPointer = arrow(
    fx(10.30),
    FB + (P ? 0.85 : 0.61),
    fx(9.65),
    fy(9.65) + 0.012,
    RED,
    0.12
  );

  const pBadge = tag(
    'p ≈ 0.007',
    RED,
    fx(10.1),
    FB + (P ? 1.14 : 0.88),
    19,
    2.1
  );

  const significantTag = tag(
    'EVIDENCE THAT NOT ALL MEANS ARE EQUAL',
    C.green,
    CX,
    P ? -4.85 : -2.90,
    P ? 17 : 15,
    6.5
  );

  await until(S(30));
  await play(
    ...take(farBeyond, criticalTailLabel),
    ...put(pTail, pBadge, significantTag),
    ...draw(pPointer),
    ...say('THE p-VALUE IS LESS THAN ONE PERCENT', C.green),
    ...fbox([
      'P(F ≥ 9 | H₀)',
      `≈ ${P_VALUE.toFixed(5)}`,
      ['p ≈ 0.007', C.green],
      'Reject equal true means'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 31–32: name the method and explain one-way
  // ------------------------------------------------------------

  const NAME_Y = P ? -0.87 : -0.41;

  const anovaTitle = txt(
    'ANOVA',
    P ? 56 : 48,
    C.cyan,
    CX,
    NAME_Y + 1.24
  );

  const anovaFullName = txt(
    'Analysis of Variance',
    P ? 27 : 25,
    C.ink,
    CX,
    NAME_Y + 0.50,
    false,
    6.4
  );

  const anovaCards = [
    new M.VGroup(
      rounded(
        CX - 1.61,
        NAME_Y - 0.87,
        2.89,
        P ? 1.74 : 1.43,
        BETWEEN
      ),

      txt(
        'BETWEEN',
        20,
        BETWEEN,
        CX - 1.61,
        NAME_Y - 0.44
      ),

      txt(
        '36',
        P ? 37 : 32,
        BETWEEN,
        CX - 1.61,
        NAME_Y - 1.12,
        true
      )
    ),

    new M.VGroup(
      rounded(
        CX + 1.61,
        NAME_Y - 0.87,
        2.89,
        P ? 1.74 : 1.43,
        WITHIN
      ),

      txt(
        'WITHIN',
        20,
        WITHIN,
        CX + 1.61,
        NAME_Y - 0.44
      ),

      txt(
        '4',
        P ? 37 : 32,
        WITHIN,
        CX + 1.61,
        NAME_Y - 1.12,
        true
      )
    )
  ];

  const anovaRatio = tag(
    'F = 9',
    GOLD,
    CX,
    P ? -3.31 : -2.50,
    25
  );

  await until(S(31));
  await play(
    ...clearPicture(),
    ...put(
      anovaTitle,
      anovaFullName,
      ...anovaCards,
      anovaRatio
    ),
    ...say('ANALYSIS OF VARIANCE — ANOVA'),
    ...fbox([
      ['ANOVA', C.cyan],
      'Analysis of variance',
      'Compare group means',
      'Using two mean squares'
    ])
  );

  const FACTOR_Y = P ? -0.40 : -0.20;

  const factorRoot = tag(
    'ONE GROUPING FACTOR: BATCH',
    C.cyan,
    CX,
    FACTOR_Y + 1.38,
    18,
    6.3
  );

  const factorGroups = GROUPS.map((g, i) => {
    const x = CX + (i - 1) * 2.13;

    return new M.VGroup(
      rounded(
        x,
        FACTOR_Y - 0.49,
        1.96,
        P ? 1.88 : 1.61,
        g.color
      ),

      txt(
        `BATCH ${g.name}`,
        18,
        g.color,
        x,
        FACTOR_Y + 0.10
      ),

      ...Array.from({ length: 4 }, (_, j) =>
        battery(
          x + (j - 1.5) * 0.38,
          FACTOR_Y - 0.61,
          0.48,
          g.color
        )
      )
    );
  });

  const factorBranches = GROUPS.map((g, i) =>
    arrow(
      CX,
      FACTOR_Y + 1.05,
      CX + (i - 1) * 2.13,
      FACTOR_Y + 0.45,
      g.color,
      0.10
    )
  );

  const oneWayTag = tag(
    'ONE-WAY ANOVA',
    C.green,
    CX,
    P ? -2.64 : -2.17,
    23
  );

  await until(S(32));
  await play(
    ...clearPicture(),
    ...put(factorRoot),
    ...draw(...factorBranches),
    ...put(...factorGroups, oneWayTag),
    ...say('ONE-WAY: GROUPED BY ONE THING ONLY', C.green),
    ...fbox([
      ['One factor: batch', C.green],
      'Three levels: A, B, C',
      'Response: battery life',
      'One-way ANOVA'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 33–34: the formula and the meaning of a mean square
  // ------------------------------------------------------------

  const FORM_Y = P ? -1.02 : -0.45;
  const FORM_W = P ? 6.35 : 6.65;
  const FORM_H = P ? 4.01 : 3.20;

  const formulaFrame = rounded(
    CX,
    FORM_Y,
    FORM_W,
    FORM_H,
    C.cyan
  );

  const formulaHeading = txt(
    'THE F RATIO',
    P ? 24 : 22,
    C.cyan,
    CX,
    FORM_Y + FORM_H / 2 - 0.34
  );

  const formulaF = txt(
    'F =',
    P ? 34 : 30,
    GOLD,
    CX - 2.36,
    FORM_Y + 0.09,
    true
  );

  const formulaNumerator = txt(
    'Between-group mean square',
    P ? 21 : 20,
    BETWEEN,
    CX + 0.48,
    FORM_Y + 0.55,
    false,
    4.66
  );

  const formulaDenominator = txt(
    'Within-group mean square',
    P ? 21 : 20,
    WITHIN,
    CX + 0.48,
    FORM_Y - 0.38,
    false,
    4.66
  );

  const formulaFraction = line(
    CX - 1.60,
    FORM_Y + 0.09,
    CX + 2.57,
    FORM_Y + 0.09,
    C.ink,
    2.5
  );

  const formulaExample = txt(
    '= 36 / 4 = 9',
    P ? 31 : 27,
    GOLD,
    CX,
    FORM_Y - FORM_H / 2 + 0.44,
    true
  );

  await until(S(33));
  await play(
    ...clearPicture(),
    ...put(
      formulaFrame,
      formulaHeading,
      formulaF,
      formulaNumerator,
      formulaDenominator,
      formulaExample
    ),
    ...draw(formulaFraction),
    ...say('F = BETWEEN-GROUP MS DIVIDED BY WITHIN-GROUP MS'),
    ...fbox([
      ['F = MS between', BETWEEN],
      '    ──────────',
      ['    MS within', WITHIN],
      ['  = 36/4 = 9', GOLD]
    ])
  );

  // A compact ANOVA ledger preserves all three quantities:
  // sums of squares, degrees of freedom and mean squares.

  const TABLE_W = P ? 6.40 : 6.80;

  const TABLE_Y = P ? -0.86 : -0.39;
  const TABLE_H = P ? 2.83 : 2.31;

  const TAB_LEFT = CX - TABLE_W / 2;

  const TABLE_X = [
    TAB_LEFT + TABLE_W * 0.19,
    TAB_LEFT + TABLE_W * 0.46,
    TAB_LEFT + TABLE_W * 0.68,
    TAB_LEFT + TABLE_W * 0.87
  ];

  function anovaTable() {
    const headerY =
      TABLE_Y + TABLE_H / 2 - 0.38;

    const rowYs = P
      ? [TABLE_Y + 0.12, TABLE_Y - 0.66]
      : [TABLE_Y + 0.02, TABLE_Y - 0.58];

    const parts = [
      rounded(
        CX,
        TABLE_Y,
        TABLE_W,
        TABLE_H,
        C.cyan
      )
    ];

    const headers = [
      'Source',
      'SS',
      'df',
      'MS'
    ];

    headers.forEach((h, i) => {
      parts.push(
        txt(
          h,
          P ? 19 : 18,
          C.muted,
          TABLE_X[i],
          headerY,
          true,
          TABLE_W * 0.24
        )
      );
    });

    const rows = [
      ['Between', SS_B, DF_B, MS_B, BETWEEN],
      ['Within', SS_W, DF_W, MS_W, WITHIN]
    ];

    rows.forEach((row, i) => {
      const y = rowYs[i];
      const color = row[4];

      parts.push(
        line(
          TAB_LEFT + 0.15,
          y + (P ? 0.35 : 0.28),
          TAB_LEFT + TABLE_W - 0.15,
          y + (P ? 0.35 : 0.28),
          C.muted,
          1
        )
      );

      row.slice(0, 4).forEach((v, j) => {
        parts.push(
          txt(
            v,
            j === 0
              ? (P ? 20 : 18)
              : (P ? 27 : 23),
            color,
            TABLE_X[j],
            y,
            true,
            TABLE_W * 0.26
          )
        );
      });
    });

    return new M.VGroup(...parts);
  }

  const ledger = anovaTable();

  const meanSquareRule = tag(
    'MEAN SQUARE = SUM OF SQUARES ÷ df',
    C.green,
    CX,
    P ? 1.14 : 1.34,
    18,
    6.5
  );

  const betweenCalculation = txt(
    'Between: 72 ÷ 2 = 36',
    P ? 23 : 20,
    BETWEEN,
    CX,
    P ? -2.84 : -1.98,
    true
  );

  const withinCalculation = txt(
    'Within: 36 ÷ 9 = 4',
    P ? 23 : 20,
    WITHIN,
    CX,
    P ? -3.43 : -2.51,
    true
  );

  await until(S(34));
  await play(
    ...clearPicture(),
    ...put(
      meanSquareRule,
      ledger,
      betweenCalculation,
      withinCalculation
    ),
    ...say('MEAN SQUARE = SQUARED-DISTANCE TOTAL DIVIDED BY df', C.green),
    ...fbox([
      ['MS = SS ÷ df', C.green],
      'SS: sum of squares',
      'df: degrees of freedom',
      'MS: mean square'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 35: translate the formula back into the picture
  // ------------------------------------------------------------

  plot = groupPlot();

  const finalBetweenGuides = new M.VGroup(
    doubleArrow(
      GX[0] + 0.77,
      yy(17),
      GX[0] + 0.77,
      yy(20),
      BETWEEN
    ),

    doubleArrow(
      GX[2] - 0.77,
      yy(20),
      GX[2] - 0.77,
      yy(23),
      BETWEEN
    )
  );

  const finalWithinGuides = GROUPS.map(
    (_, i) => withinArrows(i)
  );

  const interpretationGrand = grandMeanGuide();

  const interpretationTitle = grandMeanTag();

  const interpretationLegend = new M.VGroup(
    tag(
      'BETWEEN',
      BETWEEN,
      CX - 1.60,
      P ? -4.91 : -3.25,
      16,
      2.8
    ),

    tag(
      'WITHIN',
      WITHIN,
      CX + 1.60,
      P ? -4.91 : -3.25,
      16,
      2.8
    )
  );

  await until(S(35));
  await play(
    ...clearPicture(),
    ...put(...plotObjects(plot), interpretationTitle),
    ...draw(
      interpretationGrand,
      finalBetweenGuides,
      ...finalWithinGuides
    ),
    ...put(interpretationLegend),
    ...say('HOW FAR APART ARE MEANS COMPARED WITH INTERNAL SCATTER?'),
    ...fbox([
      ['Between: mean separation', BETWEEN],
      ['Within: normal scatter', WITHIN],
      'Compare their mean squares',
      ['F = 9', GOLD]
    ])
  );

  // ------------------------------------------------------------
  // 36: test three or more means in one overall test
  // ------------------------------------------------------------

  const omnibusTag = tag(
    'ONE OVERALL TEST',
    C.green,
    CX,
    YT + 0.34,
    19,
    4.6
  );

  const allGroupBracket = new M.VGroup(
    line(
      GX[0] - 0.63,
      YB + 0.20,
      GX[2] + 0.63,
      YB + 0.20,
      C.green,
      2.5
    ),

    line(
      GX[0] - 0.63,
      YB + 0.20,
      GX[0] - 0.63,
      YB + 0.36,
      C.green,
      2.5
    ),

    line(
      GX[2] + 0.63,
      YB + 0.20,
      GX[2] + 0.63,
      YB + 0.36,
      C.green,
      2.5
    )
  );

  await until(S(36));
  await play(
    ...take(
      interpretationTitle,
      finalBetweenGuides,
      ...finalWithinGuides
    ),
    ...put(omnibusTag),
    ...draw(allGroupBracket),
    new M.LaggedStart(
      plot.means.map(m =>
        new M.Indicate(m, { color: C.green })
      ),
      { lagRatio: 0.16, runTime: 1.25 }
    ),
    ...say('TEST THREE OR MORE GROUP MEANS IN ONE GO', C.green),
    ...fbox([
      ['Overall ANOVA test', C.green],
      'One null hypothesis',
      'One F statistic',
      'One overall p-value'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 37: trap — ANOVA does not identify the differing groups
  // ------------------------------------------------------------

  const trapTitle = tag(
    'AT LEAST ONE DIFFERS',
    C.amber,
    CX,
    YT + 0.34,
    19,
    5.3
  );

  const unknownGroups = GROUPS.map((g, i) =>
    tag(
      '?',
      C.amber,
      GX[i],
      yy(g.mean) - (P ? 0.68 : 0.54),
      22,
      0.65
    )
  );

  const cannotIdentify = tag(
    'WHICH ONE? ANOVA ALONE DOES NOT SAY.',
    C.amber,
    CX,
    P ? -4.91 : -2.89,
    P ? 17 : 15,
    6.5
  );

  await until(S(37));
  await play(
    ...take(
      omnibusTag,
      allGroupBracket,
      interpretationLegend,
      interpretationGrand
    ),
    ...put(
      trapTitle,
      ...unknownGroups,
      cannotIdentify
    ),
    ...say('TRAP: A LARGE F DOES NOT TELL US WHICH GROUP DIFFERS', C.amber),
    ...fbox([
      ['p ≈ 0.007', C.green],
      'Evidence against H₀',
      'At least one mean differs',
      ['Which one? Not yet known', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 38: preview planned contrasts and pairwise comparisons
  // ------------------------------------------------------------

  // These are questions to investigate, not conclusions
  // from the ANOVA itself.

  const PAIR_Y = P ? -0.67 : -0.31;

  function pairQuestion(
    cx, cy,
    i, j,
    label
  ) {
    const a = GROUPS[i];
    const b = GROUPS[j];

    const w = P ? 3.02 : 3.18;
    const h = P ? 1.72 : 1.49;

    return new M.VGroup(
      rounded(
        cx,
        cy,
        w,
        h,
        C.muted
      ),

      tag(
        a.name,
        a.color,
        cx - 0.95,
        cy + 0.35,
        20,
        0.78
      ),

      tag(
        b.name,
        b.color,
        cx + 0.95,
        cy + 0.35,
        20,
        0.78
      ),

      doubleArrow(
        cx - 0.46,
        cy + 0.35,
        cx + 0.46,
        cy + 0.35,
        C.amber
      ),

      txt(
        '?',
        24,
        C.amber,
        cx,
        cy + 0.03,
        true
      ),

      txt(
        label,
        P ? 17 : 16,
        C.ink,
        cx,
        cy - 0.51,
        false,
        w - 0.17
      )
    );
  }

  const pairCards = [
    pairQuestion(
      CX - 1.66,
      PAIR_Y + 0.68,
      0,
      2,
      'A against C?'
    ),

    pairQuestion(
      CX + 1.66,
      PAIR_Y + 0.68,
      1,
      2,
      'B against C?'
    ),

    pairQuestion(
      CX,
      PAIR_Y - 1.15,
      0,
      1,
      'A against B?'
    )
  ];

  const nextLessons = tag(
    'NEXT: FIND WHERE THE DIFFERENCES ARE',
    C.cyan,
    CX,
    P ? -3.52 : -2.62,
    17,
    6.35
  );

  await until(S(38));
  await play(
    ...clearPicture(),
    lagIn(pairCards, 0.17, 1.5),
    ...put(nextLessons),
    ...say('WHICH GROUPS DIFFER? THAT NEEDS FOLLOW-UP TESTS'),
    ...fbox([
      ['Next lessons', C.cyan],
      'Planned contrasts',
      'Tukey comparisons',
      'Find specific differences'
    ])
  );

  // ------------------------------------------------------------
  // 39: final visual summary
  // ------------------------------------------------------------

  // The final picture combines the original dot columns
  // and their two mean-square estimates.
  //
  // On phone the ratio panel is below the dot plot.
  // On laptop the original plot is slightly smaller
  // so the ratio panel fits within the visual frame.

  const FINAL_PLOT_Y = P ? -0.55 : -0.27;

  function finalGroupPicture() {
    const l = CX - (P ? 2.63 : 2.98);
    const r = CX + (P ? 2.97 : 3.21);

    const b = P ? -2.64 : -1.35;
    const t = P ? 1.15 : 1.20;

    const sx = i =>
      l + (i + 0.5) / 3 * (r - l);

    const sy = v =>
      b + (v - 13) / 15 * (t - b);

    const parts = [
      line(l, b, l, t, C.muted, 2),

      line(l, b, r, b, C.muted, 2),

      dashed(
        l,
        sy(GRAND),
        r,
        sy(GRAND),
        GOLD
      ),

      txt(
        'Hours',
        16,
        C.muted,
        l + 0.19,
        t + 0.24
      )
    ];

    for (const v of [14, 17, 20, 23, 26]) {
      parts.push(
        txt(
          v,
          P ? 17 : 15,
          C.muted,
          l - 0.27,
          sy(v),
          true
        )
      );
    }

    GROUPS.forEach((g, i) => {
      const x = sx(i);

      parts.push(
        line(
          x - 0.61,
          sy(g.mean),
          x + 0.61,
          sy(g.mean),
          g.color,
          3.5
        ),

        txt(
          `${g.name}: ${g.mean}`,
          P ? 18 : 16,
          g.color,
          x,
          b - 0.26,
          true
        )
      );

      g.values.forEach((v, j) => {
        const count =
          g.values.filter(q => q === v).length;

        const previous =
          g.values.slice(0, j).filter(q => q === v).length;

        parts.push(
          glow(
            x + (previous - (count - 1) / 2) * 0.28,
            sy(v),
            g.color,
            P ? 0.09 : 0.075
          )
        );

        if (v !== g.mean) {
          const offset =
            v < g.mean ? -0.29 : 0.29;

          parts.push(
            arrow(
              x + offset,
              sy(g.mean),
              x + offset,
              sy(v),
              WITHIN,
              0.08
            )
          );
        }
      });

      if (g.mean !== GRAND) {
        const bx =
          x + (i === 0 ? 0.72 : -0.72);

        parts.push(
          doubleArrow(
            bx,
            sy(GRAND),
            bx,
            sy(g.mean),
            BETWEEN,
            0.09
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  const finalPicture = finalGroupPicture();

  const FINAL_RATIO_Y = P ? -3.71 : -2.10;

  const finalRatioPanel = new M.VGroup(
    rounded(
      CX,
      FINAL_RATIO_Y,
      P ? 6.35 : 6.75,
      P ? 1.06 : 0.75,
      C.cyan
    ),

    txt(
      'Between',
      P ? 17 : 15,
      BETWEEN,
      CX - 2.17,
      FINAL_RATIO_Y + (P ? 0.24 : 0.18)
    ),

    txt(
      '36',
      P ? 27 : 22,
      BETWEEN,
      CX - 2.17,
      FINAL_RATIO_Y - (P ? 0.22 : 0.17),
      true
    ),

    txt(
      '÷',
      24,
      C.ink,
      CX - 1.08,
      FINAL_RATIO_Y,
      true
    ),

    txt(
      'Within',
      P ? 17 : 15,
      WITHIN,
      CX,
      FINAL_RATIO_Y + (P ? 0.24 : 0.18)
    ),

    txt(
      '4',
      P ? 27 : 22,
      WITHIN,
      CX,
      FINAL_RATIO_Y - (P ? 0.22 : 0.17),
      true
    ),

    txt(
      '=',
      24,
      C.ink,
      CX + 1.08,
      FINAL_RATIO_Y,
      true
    ),

    txt(
      'F ratio',
      P ? 17 : 15,
      GOLD,
      CX + 2.16,
      FINAL_RATIO_Y + (P ? 0.24 : 0.18)
    ),

    txt(
      '9',
      P ? 27 : 22,
      GOLD,
      CX + 2.16,
      FINAL_RATIO_Y - (P ? 0.22 : 0.17),
      true
    )
  );

  const finalConclusion = tag(
    'AT LEAST ONE TRUE MEAN DIFFERS',
    C.green,
    CX,
    P ? -4.55 : -2.86,
    P ? 18 : 16,
    6.5
  );

  const finalProbability = txt(
    'F(2, 9) = 9 · p ≈ 0.007',
    P ? 18 : 15,
    C.muted,
    CX,
    P ? -5.08 : -2.98,
    true,
    6.5
  );

  const finalGrandMean = tag(
    'GRAND MEAN = 20',
    GOLD,
    CX + 0.35,
    P ? 1.42 : 1.3,
    17,
    4.5
  );

  await until(S(39));
  await play(
    ...clearPicture(),

    ...put(
      finalPicture,
      finalGrandMean,
      finalRatioPanel,
      finalConclusion
    ),

    ...say('ONE-WAY ANOVA: BETWEEN SPREAD COMPARED WITH WITHIN SPREAD', C.green),

    ...fbox([
      ['F = MS between / MS within', C.ink],
      ['= 36 / 4 = 9', GOLD],
      'df = (2, 9), p ≈ 0.007',
      ['At least one mean differs', C.green]
    ], C.green)
  );
}

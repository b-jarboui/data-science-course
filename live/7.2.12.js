// lesson 7.2.12
// Repeated-measures ANOVA: remove battery-to-battery variation,
// then compare settings against the smaller leftover noise.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

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
  // SHARED CHAPTER DATA
  //
  // Four batteries, each tested under three settings:
  //
  //             Old    New    New + power saver
  // Battery 1    15     15            18
  // Battery 2    16     20            21
  // Battery 3    19     21            23
  // Battery 4    22     24            26
  //
  // Setting means: 18, 20, 22.
  // Battery means: 16, 19, 21, 24.
  // Grand mean: 20.
  //
  // Total SS = 138.
  // Settings SS = 32.
  // Batteries SS = 102.
  // Leftover SS = 4.
  //
  // 138 = 32 + 102 + 4.
  //
  // Settings df = 3 - 1 = 2.
  // Batteries df = 4 - 1 = 3.
  // Leftover df = (3 - 1)(4 - 1) = 6.
  //
  // Settings MS = 32 / 2 = 16.
  // Leftover MS = 4 / 6 = 0.666666...
  //
  // Repeated-measures F = 16 / (4/6) = 24.
  // F(2,6), p ≈ 0.00137.
  //
  // Incorrect ordinary one-way ANOVA:
  // Within SS = 102 + 4 = 106.
  // Within df = 12 - 3 = 9.
  // Within MS = 106 / 9 ≈ 11.78.
  // F = 16 / (106/9) ≈ 1.36.
  // F(2,9), p ≈ 0.305.
  // ------------------------------------------------------------

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const PINK = C.pink || '#f472b6';
  const VIOLET = C.violet;
  const GREEN = C.green;

  const SETTING_COLOR = VIOLET;
  const BATTERY_COLOR = GOLD;
  const ERROR_COLOR = GREEN;

  const BATTERY_COLORS = [
    BLUE,
    GOLD,
    PINK,
    VIOLET
  ];

  const SETTING_COLORS = [
    BLUE,
    GOLD,
    GREEN
  ];

  const settings = [
    {
      name: 'Old',
      full: 'Old firmware',
      color: SETTING_COLORS[0]
    },
    {
      name: 'New',
      full: 'New firmware',
      color: SETTING_COLORS[1]
    },
    {
      name: 'Saver',
      full: 'New + power saver',
      color: SETTING_COLORS[2]
    }
  ];

  const data = [
    [15, 15, 18],
    [16, 20, 21],
    [19, 21, 23],
    [22, 24, 26]
  ];

  const sum = values =>
    values.reduce((a, b) => a + b, 0);

  const mean = values =>
    sum(values) / values.length;

  const B = data.length;
  const K = settings.length;
  const N = B * K;

  const ALL = data.flat();

  const SETTING_MEANS = settings.map((_, j) =>
    mean(data.map(row => row[j]))
  );

  const BATTERY_MEANS = data.map(row =>
    mean(row)
  );

  const GRAND = mean(ALL);

  const SETTING_EFFECTS = SETTING_MEANS.map(
    v => v - GRAND
  );

  const BATTERY_EFFECTS = BATTERY_MEANS.map(
    v => v - GRAND
  );

  const SS_TOTAL = sum(
    ALL.map(v => (v - GRAND) ** 2)
  );

  const SS_SETTINGS = B * sum(
    SETTING_EFFECTS.map(v => v * v)
  );

  const SS_BATTERIES = K * sum(
    BATTERY_EFFECTS.map(v => v * v)
  );

  // Additive predictions:
  //
  // Predicted reading =
  // battery mean + setting mean - grand mean.
  //
  // The remaining differences are the residuals.

  const PREDICTED = data.map((row, i) =>
    row.map((_, j) =>
      BATTERY_MEANS[i] +
      SETTING_MEANS[j] -
      GRAND
    )
  );

  const RESIDUALS = data.map((row, i) =>
    row.map((v, j) =>
      v - PREDICTED[i][j]
    )
  );

  const SS_ERROR = sum(
    RESIDUALS.flat().map(v => v * v)
  );

  const DF_TOTAL = N - 1;
  const DF_SETTINGS = K - 1;
  const DF_BATTERIES = B - 1;

  const DF_ERROR =
    DF_SETTINGS * DF_BATTERIES;

  const MS_SETTINGS =
    SS_SETTINGS / DF_SETTINGS;

  const MS_ERROR =
    SS_ERROR / DF_ERROR;

  const F_REPEATED =
    MS_SETTINGS / MS_ERROR;

  // Incorrect analysis treating readings as independent.

  const SS_ORDINARY_WITHIN =
    SS_BATTERIES + SS_ERROR;

  const DF_ORDINARY_WITHIN =
    N - K;

  const MS_ORDINARY_WITHIN =
    SS_ORDINARY_WITHIN /
    DF_ORDINARY_WITHIN;

  const F_ORDINARY =
    MS_SETTINGS /
    MS_ORDINARY_WITHIN;

  // Exact survival function for F with numerator df = 2.

  function f2Survival(f, df2) {
    return Math.pow(
      1 + 2 * f / df2,
      -df2 / 2
    );
  }

  const P_ORDINARY =
    f2Survival(
      F_ORDINARY,
      DF_ORDINARY_WITHIN
    );

  const P_REPEATED =
    f2Survival(
      F_REPEATED,
      DF_ERROR
    );

  function f2Critical(df2, alpha = 0.05) {
    return df2 / 2 *
      (
        Math.pow(alpha, -2 / df2) - 1
      );
  }

  const CRIT_ORDINARY =
    f2Critical(DF_ORDINARY_WITHIN);

  const CRIT_REPEATED =
    f2Critical(DF_ERROR);

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Content between y = -3.0 and 2.3.
  //
  // Formula box above the diagram on phone,
  // to the right of the diagram on laptop.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 2.02, 0];

  // phone: BOXP y = bottom edge of the card
  const BOXP = P
    ? [0, -6.55, 0]
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.4 : 6.8;

  const Y = y =>
    P ? 1.42 * y - 0.75 : y;

  const say = (s, color = BLUE) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Based on the approved arithmetic-mean lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = BLUE) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd =
      Math.max(...widths) + 0.7;

    const ht =
      rows.length * lh + 0.4;

    const maxw =
      P ? FW - 1.2 : 4.0;

    const factor = Math.min(
      1,
      maxw / wd,
      P ? 2.4 / ht : 1
    );

    const pos = [
      BOXP[0],
      P ? BOXP[1] + ht * factor / 2 : BOXP[1],
      0
    ];

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(pos);

    const left =
      pos[0] - wd / 2 + 0.35;

    const top =
      pos[1] + ht / 2 - 0.2 - lh / 2;

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

    if (factor < 1) {
      g.scale(factor);
      g.moveTo(pos);
    }

    markStaged(g);
    const animations = [
      new M.FadeIn(g)
    ];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    return animations;
  }

  // ------------------------------------------------------------
  // VISUAL HELPERS
  // ------------------------------------------------------------

  const pt = (x, y) => [x, y, 0];

  function txt(
    s, x, y,
    color = C.ink,
    size = 20,
    mono = false,
    maxw = W
  ) {
    const t =
      T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function tag(
    s, x, y,
    color = BLUE,
    size = 17,
    maxw = W
  ) {
    const t =
      pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color
    });
  }

  function rect(
    x, y,
    width, height,
    color = BLUE,
    opacity = 0.8,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function outline(
    x, y,
    width, height,
    color = BLUE,
    opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(
    x, y,
    color = BLUE,
    radius = 0.13
  ) {
    const halo = new M.Dot({
      point: pt(x, y),
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function arrow(
    x1, y1, x2, y2,
    color = GOLD,
    head = 0.15,
    sw = 2.5
  ) {
    const a =
      Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(
        x1, y1,
        x2, y2,
        color, sw
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a - Math.PI / 5),
        y2 - head * Math.sin(a - Math.PI / 5),
        color, sw
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a + Math.PI / 5),
        y2 - head * Math.sin(a + Math.PI / 5),
        color, sw
      )
    );
  }

  function bracket(
    x1, x2, y,
    color = GOLD,
    cap = 0.10
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 3),

      line(
        x1, y - cap,
        x1, y + cap,
        color, 2
      ),

      line(
        x2, y - cap,
        x2, y + cap,
        color, 2
      )
    );
  }

  function vBracket(
    x, y1, y2,
    color = GOLD,
    cap = 0.10
  ) {
    return new M.VGroup(
      line(x, y1, x, y2, color, 2.8),

      line(
        x - cap, y1,
        x + cap, y1,
        color, 2
      ),

      line(
        x - cap, y2,
        x + cap, y2,
        color, 2
      )
    );
  }

  function signed(v) {
    return v < 0
      ? `−${Math.abs(v)}`
      : v > 0
        ? `+${v}`
        : '0';
  }

  function squareUnits(
    x, y,
    n, color,
    pitch = 0.20,
    cols = Math.ceil(Math.sqrt(n))
  ) {
    if (n <= 0) return [];

    const rows =
      Math.ceil(n / cols);

    return Array.from(
      { length: n },
      (_, k) => {
        const r = Math.floor(k / cols);
        const c = k % cols;

        return rect(
          x + (c - (cols - 1) / 2) * pitch,
          y + ((rows - 1) / 2 - r) * pitch,
          pitch * 0.85,
          pitch * 0.85,
          color, 0.84
        );
      }
    );
  }

  function checkMark(x, y, color = GREEN) {
    return new M.VGroup(
      line(
        x - 0.15, y,
        x - 0.04, y - 0.13,
        color, 3
      ),

      line(
        x - 0.04, y - 0.13,
        x + 0.22, y + 0.17,
        color, 3
      )
    );
  }

  // Track only top-level objects currently on screen.
  // Never regroup already-visible objects to highlight them.

  let picture = [];

  function add(...objects) {
    picture.push(...objects);

    return objects.map(
      o => new M.FadeIn(o)
    );
  }

  function remove(...objects) {
    const active = objects.filter(
      o => picture.includes(o)
    );

    picture = picture.filter(
      o => !active.includes(o)
    );

    return active.map(
      o => new M.FadeOut(o)
    );
  }

  function replace(...objects) {
    const animations = picture.map(
      o => new M.FadeOut(o)
    );

    picture = objects.slice();

    return [
      ...animations,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // BATTERY AND SETTING ICONS
  // ------------------------------------------------------------

  function batteryIcon(
    x, y,
    color = BLUE,
    width = 0.48,
    height = 0.83,
    charge = 0.84
  ) {
    const h =
      (height - 0.18) * charge;

    return new M.VGroup(
      outline(
        x, y,
        width, height,
        color, 0.045
      ),

      rect(
        x,
        y + height / 2 + 0.05,
        width * 0.36,
        0.10,
        color, 1
      ),

      rect(
        x,
        y - height / 2 + 0.09 + h / 2,
        width - 0.14,
        h,
        color, 0.83, 0
      )
    );
  }

  function phoneIcon(
    x, y,
    j
  ) {
    const color =
      settings[j].color;

    const parts = [
      outline(
        x, y,
        1.05, 1.67,
        color, 0.045
      ),

      outline(
        x,
        y + 0.04,
        0.84, 1.27,
        color, 0.025
      ),

      line(
        x - 0.15,
        y - 0.73,
        x + 0.15,
        y - 0.73,
        C.muted, 2
      )
    ];

    if (j < 2) {
      parts.push(
        txt(
          j === 0 ? 'v1' : 'v2',
          x,
          y + 0.16,
          color, 27, true
        ),

        txt(
          j === 0 ? 'OLD' : 'NEW',
          x,
          y - 0.31,
          color, 14
        )
      );
    } else {
      parts.push(
        batteryIcon(
          x,
          y + 0.10,
          GREEN,
          0.41, 0.68
        ),

        txt(
          'SAVER',
          x,
          y - 0.37,
          GREEN, 13
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const GX = j =>
    CX + (j - 1) * 2.06;

  // ------------------------------------------------------------
  // 0: THE LAB WANTS TO COMPARE THREE SETTINGS
  // ------------------------------------------------------------

  const introY = Y(-0.24);

  const introPhones = settings.map(
    (_, j) =>
      phoneIcon(
        GX(j),
        introY,
        j
      )
  );

  const introQuestion = tag(
    'WHICH SETTING MAKES BATTERIES LAST LONGER?',
    CX,
    Y(-2.23),
    VIOLET, 16
  );

  const introLabels = settings.map(
    (_, j) =>
      txt(
        `SETTING ${j + 1}`,
        GX(j),
        introY + 1.12,
        C.muted, 15
      )
  );

  await until(S(0));
  await play(
    ...add(
      ...introPhones,
      ...introLabels,
      introQuestion
    ),

    ...(P ? fbox([
      'one last question',
      ['compare three settings', C.cyan]
    ]) : []),

    ...say('ONE LAST QUESTION: COMPARE THREE SETTINGS')
  );

  // ------------------------------------------------------------
  // 1: OLD, NEW, AND NEW WITH POWER SAVER
  // ------------------------------------------------------------

  const settingLabels = settings.map(
    (s, j) =>
      tag(
        s.name.toUpperCase(),
        GX(j),
        introY + 1.13,
        s.color, 18,
        1.83
      )
  );

  const settingDescriptions = [
    txt(
      'old firmware',
      GX(0),
      introY - 1.13,
      BLUE, 15,
      false, 1.90
    ),

    txt(
      'new firmware',
      GX(1),
      introY - 1.13,
      GOLD, 15,
      false, 1.90
    ),

    txt(
      'new + power saver',
      GX(2),
      introY - 1.13,
      GREEN, 15,
      false, 1.92
    )
  ];

  await until(S(1));
  await play(
    ...remove(...introLabels),

    ...add(
      ...settingLabels,
      ...settingDescriptions
    ),

    ...fbox([
      ['1. old firmware', BLUE],
      ['2. new firmware', GOLD],
      ['3. new + power saver', GREEN]
    ]),

    ...say('THREE SETTINGS')
  );

  // ------------------------------------------------------------
  // 2: EACH BATTERY EXPERIENCES ALL THREE SETTINGS
  //
  // Reuse one battery identity across the three conditions.
  // The thin links explicitly represent the same battery.
  //
  // The displayed setting order is the data-column order,
  // not a recommendation for the experimental test order.
  // ------------------------------------------------------------

  const sameBatteryY = Y(-0.31);

  function sameBatteryPicture() {
    const parts = [
      tag(
        'THE SAME BATTERY',
        CX,
        Y(1.20),
        BLUE, 19
      )
    ];

    settings.forEach((s, j) => {
      parts.push(
        outline(
          GX(j),
          sameBatteryY,
          1.73, 1.76,
          s.color, 0.045
        ),

        batteryIcon(
          GX(j),
          sameBatteryY + 0.19,
          BLUE,
          0.49, 0.86
        ),

        txt(
          s.name,
          GX(j),
          sameBatteryY - 0.59,
          s.color, 17
        ),

        txt(
          'B1',
          GX(j),
          sameBatteryY + 0.74,
          BLUE, 15, true
        )
      );

      if (j < K - 1) {
        parts.push(
          arrow(
            GX(j) + 0.89,
            sameBatteryY,
            GX(j + 1) - 0.89,
            sameBatteryY,
            BLUE,
            0.08
          )
        );
      }
    });

    parts.push(
      tag(
        'REPEATED MEASUREMENTS',
        CX,
        Y(-2.23),
        VIOLET, 18
      )
    );

    return parts;
  }

  await until(S(2));
  await play(
    ...replace(
      ...sameBatteryPicture()
    ),

    ...fbox([
      'not three separate batteries',
      ['one battery, three settings', BLUE],
      'keep its identity'
    ], VIOLET),

    ...say('TEST EACH BATTERY UNDER EVERY SETTING', VIOLET)
  );

  // ------------------------------------------------------------
  // REPEATED-MEASURES DATA TABLE
  //
  // Each row is one battery.
  // Each column is one setting.
  //
  // Battery identities retain the same colors throughout.
  // Each battery's three measurements are linked.
  // ------------------------------------------------------------

  const TABLE_COLS = [
    CX - 1.37,
    CX + 0.42,
    CX + 2.20
  ];

  const TABLE_ROWS = [
    Y(0.68),
    Y(-0.14),
    Y(-0.96),
    Y(-1.78)
  ];

  const TABLE_LABEL_X =
    CX - 2.82;

  function tableHeaders() {
    const top =
      TABLE_ROWS[0] + 0.58;

    return settings.map(
      (s, j) =>
        tag(
          s.name.toUpperCase(),
          TABLE_COLS[j],
          top,
          s.color, 15,
          1.62
        )
    );
  }

  function rowOutline(i) {
    return outline(
      CX + 0.02,
      TABLE_ROWS[i],
      6.08,
      P ? 0.91 : 0.72,
      BATTERY_COLORS[i],
      0.025
    );
  }

  function countRow(i) {
    const y =
      TABLE_ROWS[i];

    const color =
      BATTERY_COLORS[i];

    const parts = [
      rowOutline(i),

      txt(
        `B${i + 1}`,
        TABLE_LABEL_X,
        y,
        color, 17, true
      )
    ];

    for (let j = 0; j < K - 1; j++) {
      parts.push(
        line(
          TABLE_COLS[j] + 0.23,
          y,
          TABLE_COLS[j + 1] - 0.23,
          y,
          color, 1.5
        )
      );
    }

    for (let j = 0; j < K; j++) {
      parts.push(
        dot(
          TABLE_COLS[j],
          y,
          color, 0.14
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function readingRow(i) {
    const y =
      TABLE_ROWS[i];

    const color =
      BATTERY_COLORS[i];

    const parts = [
      rowOutline(i),

      txt(
        `B${i + 1}`,
        TABLE_LABEL_X,
        y,
        color, 17, true
      )
    ];

    // Horizontal links preserve the repeated-measure identity.

    for (let j = 0; j < K - 1; j++) {
      parts.push(
        line(
          TABLE_COLS[j] + 0.39,
          y,
          TABLE_COLS[j + 1] - 0.39,
          y,
          color, 1.5
        )
      );
    }

    data[i].forEach((v, j) => {
      parts.push(
        outline(
          TABLE_COLS[j],
          y,
          0.76,
          0.47,
          color, 0.14
        ),

        txt(
          String(v),
          TABLE_COLS[j],
          y,
          color, 23, true,
          0.68
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function fullReadingTable() {
    return [
      ...tableHeaders(),
      ...data.map((_, i) =>
        readingRow(i)
      )
    ];
  }

  // ------------------------------------------------------------
  // 3: FOUR BATTERIES, THREE TESTS EACH, TWELVE READINGS
  // ------------------------------------------------------------

  const liveRows =
    data.map((_, i) => countRow(i));

  const countTotal = tag(
    '4 BATTERIES × 3 SETTINGS = 12 READINGS',
    CX,
    Y(-2.48),
    GREEN, 16
  );

  await until(S(3));
  await play(
    ...replace(
      ...tableHeaders(),
      ...liveRows,
      countTotal
    ),

    ...fbox([
      '4 distinct batteries',
      '3 readings per battery',
      ['4 × 3 = 12 readings', GREEN]
    ], GREEN),

    ...say('FOUR BATTERIES, TWELVE READINGS')
  );

  function revealRow(i) {
    const old = liveRows[i];
    const next = readingRow(i);

    liveRows[i] = next;

    return [
      ...remove(old),
      ...add(next)
    ];
  }

  // ------------------------------------------------------------
  // 4: BATTERY ONE — 15, 15, 18
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...revealRow(0),

    ...fbox([
      ['battery 1', BATTERY_COLORS[0]],
      'old: 15; new: 15',
      'saver: 18 hours'
    ], BATTERY_COLORS[0]),

    ...say(
      'BATTERY 1: FIFTEEN, FIFTEEN, EIGHTEEN',
      BATTERY_COLORS[0]
    )
  );

  // ------------------------------------------------------------
  // 5: BATTERY TWO — 16, 20, 21
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    ...revealRow(1),

    ...fbox([
      ['battery 2', BATTERY_COLORS[1]],
      'old: 16; new: 20',
      'saver: 21 hours'
    ], BATTERY_COLORS[1]),

    ...say(
      'BATTERY 2: SIXTEEN, TWENTY, TWENTY-ONE',
      BATTERY_COLORS[1]
    )
  );

  // ------------------------------------------------------------
  // 6: BATTERY THREE — 19, 21, 23
  // ------------------------------------------------------------

  await until(S(6));
  await play(
    ...revealRow(2),

    ...fbox([
      ['battery 3', BATTERY_COLORS[2]],
      'old: 19; new: 21',
      'saver: 23 hours'
    ], BATTERY_COLORS[2]),

    ...say(
      'BATTERY 3: NINETEEN, TWENTY-ONE, TWENTY-THREE',
      BATTERY_COLORS[2]
    )
  );

  // ------------------------------------------------------------
  // 7: BATTERY FOUR — 22, 24, 26
  // ------------------------------------------------------------

  await until(S(7));
  await play(
    ...revealRow(3),

    ...fbox([
      ['battery 4', BATTERY_COLORS[3]],
      'old: 22; new: 24',
      'saver: 26 hours'
    ], BATTERY_COLORS[3]),

    ...say(
      'BATTERY 4: TWENTY-TWO, TWENTY-FOUR, TWENTY-SIX',
      BATTERY_COLORS[3]
    )
  );

  // ------------------------------------------------------------
  // REPEATED-MEASURES LINE PLOT
  //
  // Horizontal: the three settings.
  // Vertical: measured battery life in hours.
  //
  // Every thin colored line connects measurements of
  // the SAME physical battery.
  // ------------------------------------------------------------

  const HMIN = 12;
  const HMAX = 28;

  const PY0 = Y(-2.08);
  const PY1 = Y(1.20);

  const AXIS_X =
    CX - 2.94;

  const PX = [
    CX - 1.94,
    CX + 0.10,
    CX + 2.14
  ];

  const py = v =>
    PY0 +
    (v - HMIN) /
      (HMAX - HMIN) *
      (PY1 - PY0);

  function plotAxes() {
    const parts = [
      line(
        AXIS_X, PY0,
        AXIS_X, PY1,
        C.muted, 1.8
      ),

      line(
        AXIS_X, PY0,
        CX + 2.94, PY0,
        C.muted, 2.2
      )
    ];

    for (let v = HMIN; v <= HMAX; v += 2) {
      parts.push(
        txt(
          String(v),
          AXIS_X - 0.27,
          py(v),
          C.muted, 14, true,
          0.43
        ),

        line(
          AXIS_X + 0.06,
          py(v),
          CX + 2.94,
          py(v),
          C.muted, 0.65
        )
      );
    }

    parts.push(
      txt(
        'hours',
        AXIS_X + 0.31,
        PY1 + 0.20,
        C.muted, 14
      )
    );

    settings.forEach((s, j) => {
      parts.push(
        tag(
          s.name.toUpperCase(),
          PX[j],
          PY0 - 0.38,
          s.color, 15,
          1.78
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function batterySeries(
    i,
    connected = true,
    label = true
  ) {
    const values = data[i];

    const color =
      BATTERY_COLORS[i];

    const parts = [];

    if (connected) {
      for (let j = 0; j < K - 1; j++) {
        parts.push(
          line(
            PX[j], py(values[j]),
            PX[j + 1], py(values[j + 1]),
            color, 2.5
          )
        );
      }
    }

    values.forEach((v, j) => {
      parts.push(
        dot(
          PX[j],
          py(v),
          color, 0.105
        )
      );
    });

    if (label) {
      parts.push(
        txt(
          `B${i + 1}`,
          PX[2] + 0.66,
          py(values[2]),
          color, 15, true,
          0.49
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function settingMeanSeries() {
    const parts = [];

    for (let j = 0; j < K - 1; j++) {
      parts.push(
        line(
          PX[j],
          py(SETTING_MEANS[j]),
          PX[j + 1],
          py(SETTING_MEANS[j + 1]),
          C.ink, 4
        )
      );
    }

    SETTING_MEANS.forEach((v, j) => {
      parts.push(
        rect(
          PX[j],
          py(v),
          0.20,
          0.20,
          C.ink, 1
        ),

        tag(
          String(v),
          PX[j] - 0.72,
          py(v),
          C.ink, 17
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function repeatedPlot(
    {
      connected = true,
      means = false,
      labels = true
    } = {}
  ) {
    const parts = [
      plotAxes(),

      ...data.map((_, i) =>
        batterySeries(
          i,
          connected,
          labels
        )
      )
    ];

    if (means) {
      parts.push(
        settingMeanSeries()
      );
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 8: DRAW EACH BATTERY AS A LINE ACROSS THE SETTINGS
  // ------------------------------------------------------------

  const mainAxes = plotAxes();

  const mainSeries = data.map(
    (_, i) => batterySeries(i)
  );

  await until(S(8));

  const oldTable = picture.map(
    o => new M.FadeOut(o)
  );

  picture = [
    mainAxes,
    ...mainSeries
  ];

  await play(
    ...oldTable,

    new M.FadeIn(mainAxes),

    new M.LaggedStart(
      mainSeries.map(
        o => new M.FadeIn(o)
      ),
      {
        lagRatio: 0.19,
        runTime: 1.8
      }
    ),

    ...fbox([
      'one line = one battery',
      'three linked measurements',
      'vertical axis: hours'
    ]),

    ...say('KEEP EACH BATTERY’S THREE READINGS LINKED')
  );

  // ------------------------------------------------------------
  // 9: MOST LINES CLIMB; BATTERY ONE IS FLAT AT FIRST
  // ------------------------------------------------------------

  const flatFirst = bracket(
    PX[0],
    PX[1],
    py(15) - 0.29,
    BLUE,
    0.07
  );

  const flatLabel = txt(
    '15 → 15',
    (PX[0] + PX[1]) / 2,
    py(15) - 0.52,
    BLUE, 15, true
  );

  const climbArrow = arrow(
    PX[1] + 0.18,
    py(15) + 0.02,
    PX[2] - 0.12,
    py(18) - 0.02,
    BLUE,
    0.12
  );

  const climbNote = tag(
    'MOST READINGS RISE',
    CX,
    PY0 - 0.92,
    GREEN, 17
  );

  await until(S(9));
  await play(
    ...add(
      flatFirst,
      flatLabel,
      climbArrow,
      climbNote
    ),

    new M.Indicate(
      mainSeries[0],
      { color: BLUE }
    ),

    ...fbox([
      'battery 1: 15 → 15 → 18',
      'flat, then rising',
      ['other batteries also improve', GREEN]
    ], GREEN),

    ...say('MOST LINES CLIMB FROM LEFT TO RIGHT', GREEN)
  );

  // ------------------------------------------------------------
  // 10: THE BATTERIES START AT DIFFERENT HEIGHTS
  //
  // Battery 1 starts at 15.
  // Battery 4 starts at 22.
  //
  // Their baseline difference is seven hours.
  // This is battery-to-battery variation, not a setting effect.
  // ------------------------------------------------------------

  const startGap = vBracket(
    PX[0] - 0.44,
    py(15),
    py(22),
    BATTERY_COLOR,
    0.075
  );

  const startGapLabel = tag(
    '7 h',
    PX[0] + 0.64,
    (py(15) + py(22)) / 2,
    BATTERY_COLOR,
    16,
    1.12
  );

  const weakLabel = txt(
    'weak battery',
    PX[0] + 0.78,
    py(15) - 0.30,
    BATTERY_COLORS[0],
    15,
    false, 1.76
  );

  const strongLabel = txt(
    'strong battery',
    PX[0] + 0.86,
    py(22) + 0.28,
    BATTERY_COLORS[3],
    15,
    false, 1.76
  );

  await until(S(10));
  await play(
    ...remove(
      flatFirst,
      flatLabel,
      climbArrow,
      climbNote
    ),

    ...add(
      startGap,
      startGapLabel,
      weakLabel,
      strongLabel
    ),

    ...fbox([
      ['battery 1 starts at 15', BLUE],
      ['battery 4 starts at 22', VIOLET],
      'different battery baselines'
    ], BATTERY_COLOR),

    ...say('SOME BATTERIES ARE NATURALLY STRONGER', BATTERY_COLOR)
  );

  // ------------------------------------------------------------
  // 11: SETTING MEANS ARE 18, 20, 22
  //
  // Add a white mean line across the three columns.
  // Preserve the four individual battery lines.
  // ------------------------------------------------------------

  const meansLine =
    settingMeanSeries();

  const meanLegend = tag(
    'WHITE LINE = SETTING MEANS',
    CX,
    PY0 - 0.92,
    C.ink, 16
  );

  await until(S(11));
  await play(
    ...remove(
      startGap,
      startGapLabel,
      weakLabel,
      strongLabel
    ),

    ...add(
      meansLine,
      meanLegend
    ),

    ...fbox([
      ['old mean = 18', BLUE],
      ['new mean = 20', GOLD],
      ['saver mean = 22', GREEN]
    ]),

    ...say('SETTING MEANS: EIGHTEEN, TWENTY, TWENTY-TWO')
  );

  // ------------------------------------------------------------
  // 12: IGNORE THE LINKS — THE ORDINARY ONE-WAY APPROACH
  //
  // Deliberately remove the connecting lines.
  // The twelve measured values remain unchanged.
  //
  // This is the incorrect analysis for repeated observations.
  // ------------------------------------------------------------

  const ignoredLinkNote = tag(
    'INCORRECT: TREAT ALL READINGS AS INDEPENDENT',
    CX,
    PY0 - 0.91,
    GOLD, 15
  );

  await until(S(12));
  await play(
    ...replace(
      ...repeatedPlot({
        connected: false,
        means: true
      }),

      ignoredLinkNote
    ),

    ...fbox([
      'ordinary one-way ANOVA',
      'readings treated as unrelated',
      ['partners ignored', GOLD]
    ], GOLD),

    ...say('WHAT IF WE IGNORE THE PARTNERS?', GOLD)
  );

  // ------------------------------------------------------------
  // 13: BATTERY DIFFERENCES GET COUNTED AS NOISE
  //
  // Draw distances from each observation to its setting mean.
  // These include the large differences between batteries.
  //
  // Ordinary within SS = 106.
  // ------------------------------------------------------------

  function ordinaryResidualGuides() {
    const parts = [];

    settings.forEach((_, j) => {
      const m =
        SETTING_MEANS[j];

      data.forEach((row, i) => {
        const v = row[j];

        if (v === m) return;

        const x =
          PX[j] +
          (i - 1.5) * 0.16;

        parts.push(
          line(
            x,
            py(m),
            x,
            py(v),
            BATTERY_COLOR,
            2
          )
        );
      });

      const values =
        data.map(row => row[j]);

      const lo =
        Math.min(...values);

      const hi =
        Math.max(...values);

      parts.push(
        outline(
          PX[j],
          (py(lo) + py(hi)) / 2,
          0.85,
          py(hi) - py(lo) + 0.34,
          GOLD,
          0.025
        )
      );
    });

    return parts;
  }

  const ordinaryGuides =
    ordinaryResidualGuides();

  const ordinaryNoiseTag = tag(
    'LARGE BATTERY DIFFERENCES BECOME NOISE',
    CX,
    PY0 - 0.91,
    GOLD, 15
  );

  await until(S(13));
  await play(
    ...remove(ignoredLinkNote),

    ...add(
      ...ordinaryGuides,
      ordinaryNoiseTag
    ),

    ...fbox([
      'noise inside settings',
      ['within SS = 106', GOLD],
      'battery gaps included'
    ], GOLD),

    ...say('THE LARGE BATTERY GAPS ARE COUNTED AS NOISE', GOLD)
  );

  // ------------------------------------------------------------
  // F(2, df2) REFERENCE DISTRIBUTIONS
  //
  // Exact density:
  //
  // f(x) = (1 + 2x/df2)^(-(df2+2)/2)
  //
  // Exact upper-tail probability:
  //
  // P(F >= x) = (1 + 2x/df2)^(-df2/2).
  //
  // Used for both the ordinary and repeated-measures tests.
  // ------------------------------------------------------------

  function fPDF(x, df2) {
    if (x < 0) return 0;

    return Math.pow(
      1 + 2 * x / df2,
      -(df2 + 2) / 2
    );
  }

  function fReferencePicture(
    df2,
    observed,
    pValue,
    xmax,
    color,
    title
  ) {
    const left =
      CX - 2.94;

    const right =
      CX + 2.96;

    const base =
      Y(-1.94);

    const height =
      P ? 3.18 : 2.65;

    const fx = v =>
      left +
      v / xmax *
      (right - left);

    const fy = v =>
      base +
      fPDF(v, df2) *
      height;

    const critical =
      f2Critical(df2);

    const parts = [
      line(
        fx(0), base,
        fx(xmax), base,
        C.muted, 2.5
      ),

      line(
        fx(0), base,
        fx(0), base + height,
        C.muted, 1.4
      )
    ];

    const tickStep =
      xmax <= 15 ? 2 : 5;

    for (let v = 0; v <= xmax; v += tickStep) {
      parts.push(
        line(
          fx(v),
          base - 0.065,
          fx(v),
          base + 0.065,
          C.muted, 1.3
        ),

        txt(
          String(v),
          fx(v),
          base - 0.27,
          C.muted, 14, true,
          0.47
        )
      );
    }

    const tailParts = [];
    const tailSamples = 90;

    const dx =
      (xmax - observed) /
      tailSamples;

    for (let k = 0; k < tailSamples; k++) {
      const a =
        observed + k * dx;

      const b = a + dx;

      const mid =
        (a + b) / 2;

      const h =
        fPDF(mid, df2) *
        height;

      tailParts.push(
        rect(
          fx(mid),
          base + h / 2,
          fx(b) - fx(a) + 0.001,
          Math.max(0.0001, h),
          color,
          0.72,
          0
        )
      );
    }

    parts.push(
      new M.VGroup(...tailParts)
    );

    const curve = [];

    const samples = 160;

    for (let k = 0; k < samples; k++) {
      const a =
        xmax * k / samples;

      const b =
        xmax * (k + 1) / samples;

      curve.push(
        line(
          fx(a), fy(a),
          fx(b), fy(b),
          BLUE, 2.8
        )
      );
    }

    parts.push(
      new M.VGroup(...curve)
    );

    const critHeight =
      P ? 0.95 : 0.76;

    const obsHeight =
      P ? 1.65 : 1.40;

    parts.push(
      dashed(
        fx(critical),
        base,
        fx(critical),
        base + critHeight,
        C.muted
      ),

      tag(
        critical.toFixed(2),
        fx(critical) + 0.32,
        base + critHeight + 0.23,
        C.muted,
        15,
        1.14
      ),

      dashed(
        fx(observed),
        base,
        fx(observed),
        base + obsHeight,
        color
      ),

      dot(
        fx(observed),
        base,
        color,
        0.115
      ),

      tag(
        `F = ${observed.toFixed(
          Number.isInteger(observed) ? 0 : 2
        )}`,
        Math.max(
          left + 0.85,
          Math.min(
            right - 0.86,
            fx(observed)
          )
        ),
        base + obsHeight + 0.27,
        color,
        18,
        1.82
      ),

      tag(
        `F(2, ${df2})`,
        CX + 1.48,
        Y(1.20),
        VIOLET, 18
      ),

      tag(
        title,
        CX + 0.67,
        Y(0.63),
        color,
        15,
        3.68
      ),

      tag(
        `p ≈ ${(100 * pValue).toFixed(
          pValue < 0.01 ? 2 : 1
        )}%`,
        CX + 1.52,
        Y(-0.34),
        color,
        20,
        2.30
      ),

      txt(
        'F ratio',
        CX,
        base - 0.68,
        C.muted,
        16
      ),

      arrow(
        fx(xmax - tickStep * 0.50),
        base + 0.065,
        fx(xmax),
        base + 0.065,
        color,
        0.10
      )
    );

    return parts;
  }

  // ------------------------------------------------------------
  // 14: ORDINARY ANOVA GIVES F ≈ 1.36 AND p ≈ 0.31
  //
  // Show the large denominator before the reference curve.
  // ------------------------------------------------------------

  function ordinaryRatioPicture() {
    const top =
      Y(0.43);

    const bottom =
      Y(-0.98);

    const left =
      CX - 2.60;

    const scale =
      0.31;

    const parts = [
      txt(
        'SETTINGS MEAN SQUARE',
        CX,
        top + 0.49,
        SETTING_COLOR, 17
      ),

      rect(
        left + MS_SETTINGS * scale / 2,
        top,
        MS_SETTINGS * scale,
        0.44,
        SETTING_COLOR, 0.84
      ),

      txt(
        '16',
        left + MS_SETTINGS * scale / 2,
        top,
        C.ink, 21, true
      ),

      txt(
        'ORDINARY WITHIN MEAN SQUARE',
        CX,
        bottom + 0.51,
        GOLD, 16
      ),

      rect(
        left + MS_ORDINARY_WITHIN * scale / 2,
        bottom,
        MS_ORDINARY_WITHIN * scale,
        0.44,
        GOLD, 0.82
      ),

      txt(
        '11.78',
        left + MS_ORDINARY_WITHIN * scale / 2,
        bottom,
        C.ink, 20, true
      ),

      tag(
        'F ≈ 1.36',
        CX,
        Y(-2.25),
        GOLD, 23
      )
    ];

    return parts;
  }

  await until(S(14));
  await play(
    ...replace(
      ...ordinaryRatioPicture()
    ),

    ...fbox([
      'ordinary within MS = 106/9',
      '≈ 11.78',
      ['F = 16 ÷ 11.78 ≈ 1.36', GOLD]
    ], GOLD),

    ...say('THE ORDINARY F RATIO IS ONLY ABOUT 1.4', GOLD)
  );

  await until(S(14) + 3.2);
  await play(
    ...replace(
      ...fReferencePicture(
        DF_ORDINARY_WITHIN,
        F_ORDINARY,
        P_ORDINARY,
        12,
        GOLD,
        'ORDINARY ANOVA'
      )
    ),

    ...fbox([
      'F ≈ 1.36; df = 2, 9',
      `p ≈ ${P_ORDINARY.toFixed(3)}`,
      ['not significant at 5%', GOLD]
    ], GOLD),

    ...say('p IS ABOUT THIRTY PERCENT: THE EFFECT IS HIDDEN', GOLD)
  );

  // ------------------------------------------------------------
  // 15: THE SAME MISTAKE AS IGNORING PAIRS
  //
  // Restore the same-battery links.
  // Nothing about the measured values changes.
  // ------------------------------------------------------------

  const partnersNote = tag(
    'SAME BATTERY = SAME PARTNER',
    CX,
    PY0 - 0.91,
    GREEN, 17
  );

  await until(S(15));
  await play(
    ...replace(
      ...repeatedPlot({
        connected: true,
        means: false
      }),

      partnersNote
    ),

    ...fbox([
      'same mistake as paired t-test',
      'do not ignore battery identity',
      ['keep repeated readings linked', GREEN]
    ], GREEN),

    ...say('KEEP THE PARTNERS, JUST LIKE THE PAIRED TEST', GREEN)
  );

  // ------------------------------------------------------------
  // 16: SPLIT VARIATION INTO THREE PIECES
  //
  // Ordinary ANOVA:
  // settings + within-setting scatter.
  //
  // Repeated-measures ANOVA:
  // settings + batteries + leftover.
  // ------------------------------------------------------------

  const PIECES = [
    {
      name: 'SETTINGS',
      value: SS_SETTINGS,
      color: SETTING_COLOR
    },
    {
      name: 'BATTERIES',
      value: SS_BATTERIES,
      color: BATTERY_COLOR
    },
    {
      name: 'LEFTOVER',
      value: SS_ERROR,
      color: ERROR_COLOR
    }
  ];

  function conceptualSplit() {
    const top =
      Y(0.95);

    const bottom =
      Y(-1.10);

    const parts = [
      outline(
        CX, top,
        4.76, 0.83,
        C.ink, 0.055
      ),

      txt(
        'TOTAL VARIATION',
        CX, top,
        C.ink, 20
      )
    ];

    PIECES.forEach((item, k) => {
      const x = GX(k);

      parts.push(
        arrow(
          CX + (k - 1) * 0.65,
          top - 0.49,
          x,
          bottom + 0.75,
          item.color,
          0.12
        ),

        outline(
          x, bottom,
          1.82, 1.35,
          item.color, 0.065
        ),

        txt(
          item.name,
          x,
          bottom + 0.36,
          item.color, 16,
          false, 1.66
        ),

        txt(
          '?',
          x,
          bottom - 0.21,
          item.color, 30
        )
      );
    });

    parts.push(
      tag(
        'THREE SOURCES OF VARIATION',
        CX,
        Y(-2.35),
        VIOLET, 18
      )
    );

    return parts;
  }

  await until(S(16));
  await play(
    ...replace(
      ...conceptualSplit()
    ),

    ...fbox([
      ['piece 1: settings', SETTING_COLOR],
      ['piece 2: batteries', BATTERY_COLOR],
      ['piece 3: leftover', ERROR_COLOR]
    ]),

    ...say('THE BETTER IDEA: THREE PIECES, NOT TWO')
  );

  // ------------------------------------------------------------
  // 17: TOTAL SUM OF SQUARES = 138
  //
  // Grand mean = 20.
  //
  // Squared deviations:
  //
  // Battery 1: 25, 25, 4.
  // Battery 2: 16, 0, 1.
  // Battery 3: 1, 1, 9.
  // Battery 4: 4, 16, 36.
  //
  // Total = 138.
  // ------------------------------------------------------------

  function grandMeanPlot() {
    const parts = [
      ...repeatedPlot({
        connected: false,
        means: false,
        labels: false
      }),

      dashed(
        AXIS_X + 0.06,
        py(GRAND),
        CX + 2.94,
        py(GRAND),
        C.ink
      )
    ];

    settings.forEach((_, j) => {
      data.forEach((row, i) => {
        const v = row[j];

        if (v === GRAND) return;

        const x =
          PX[j] +
          (i - 1.5) * 0.19;

        parts.push(
          line(
            x,
            py(GRAND),
            x,
            py(v),
            VIOLET,
            1.8
          )
        );
      });
    });

    parts.push(
      tag(
        'GRAND MEAN = 20',
        CX,
        PY0 - 0.91,
        VIOLET, 18
      )
    );

    return parts;
  }

  await until(S(17));
  await play(
    ...replace(
      ...grandMeanPlot()
    ),

    ...fbox([
      'grand mean = 240 ÷ 12 = 20',
      'square each distance',
      ['total SS = 138', VIOLET]
    ], VIOLET),

    ...say('TOTAL SQUARED DISTANCES FROM TWENTY')
  );

  function totalSquaresTable() {
    const parts = [
      ...tableHeaders()
    ];

    data.forEach((row, i) => {
      const y =
        TABLE_ROWS[i];

      parts.push(
        txt(
          `B${i + 1}`,
          TABLE_LABEL_X,
          y,
          BATTERY_COLORS[i],
          16, true
        )
      );

      row.forEach((v, j) => {
        const d =
          v - GRAND;

        const squared =
          d * d;

        parts.push(
          outline(
            TABLE_COLS[j],
            y,
            1.58,
            P ? 0.87 : 0.70,
            BATTERY_COLORS[i],
            0.045
          ),

          txt(
            `(${signed(d)})²`,
            TABLE_COLS[j],
            y + 0.17,
            C.muted,
            14, true
          ),

          txt(
            String(squared),
            TABLE_COLS[j],
            y - 0.15,
            BATTERY_COLORS[i],
            20, true
          )
        );
      });
    });

    parts.push(
      tag(
        'ALL TWELVE SQUARES ADD TO 138',
        CX,
        Y(-2.49),
        VIOLET, 17
      )
    );

    return parts;
  }

  await until(S(17) + 2.4);
  await play(
    ...replace(
      ...totalSquaresTable()
    ),

    ...say('TOTAL SUM OF SQUARES = 138', VIOLET)
  );

  // ------------------------------------------------------------
  // 18: PIECE ONE — SETTINGS
  //
  // Setting means = 18, 20, 22.
  // Distances from grand mean = -2, 0, +2.
  // ------------------------------------------------------------

  function settingDeviationPicture() {
    const parts = [
      plotAxes(),

      dashed(
        AXIS_X + 0.06,
        py(GRAND),
        CX + 2.94,
        py(GRAND),
        C.ink
      ),

      settingMeanSeries()
    ];

    SETTING_MEANS.forEach((v, j) => {
      const d =
        v - GRAND;

      const x =
        PX[j] - 0.36;

      if (d === 0) {
        parts.push(
          dot(
            x,
            py(GRAND),
            SETTING_COLOR,
            0.09
          ),

          txt(
            '0',
            x,
            py(GRAND) + 0.38,
            SETTING_COLOR,
            19, true
          )
        );
      } else {
        parts.push(
          arrow(
            x,
            py(GRAND),
            x,
            py(v),
            SETTING_COLOR,
            0.10
          ),

          txt(
            signed(d),
            x - 0.35,
            (py(v) + py(GRAND)) / 2,
            SETTING_COLOR,
            18, true,
            0.53
          )
        );
      }
    });

    parts.push(
      tag(
        'SETTING MEANS VERSUS GRAND MEAN',
        CX,
        PY0 - 0.91,
        SETTING_COLOR,
        16
      )
    );

    return parts;
  }

  await until(S(18));
  await play(
    ...replace(
      ...settingDeviationPicture()
    ),

    ...fbox([
      'piece 1: settings',
      'means = 18, 20, 22',
      ['distances = −2, 0, +2', SETTING_COLOR]
    ], SETTING_COLOR),

    ...say('PIECE 1: HOW FAR ARE THE SETTING MEANS FROM TWENTY?', SETTING_COLOR)
  );

  // ------------------------------------------------------------
  // 19: SQUARE, THEN COUNT FOUR BATTERIES PER SETTING
  //
  // (-2)^2 = 4.
  // 0^2 = 0.
  // (+2)^2 = 4.
  //
  // Four copies of each square:
  // 4 × (4 + 0 + 4) = 32.
  // ------------------------------------------------------------

  function settingSquaresPicture() {
    const parts = [];

    const top =
      Y(1.03);

    const middle =
      Y(-0.49);

    const tilePitch =
      0.64;

    settings.forEach((s, j) => {
      const x = GX(j);

      const d =
        SETTING_EFFECTS[j];

      const squared =
        d * d;

      parts.push(
        tag(
          s.name.toUpperCase(),
          x, top,
          s.color,
          16,
          1.82
        ),

        txt(
          `(${signed(d)})² = ${squared}`,
          x,
          top - 0.47,
          SETTING_COLOR,
          18, true,
          1.85
        )
      );

      for (let k = 0; k < B; k++) {
        const c = k % 2;
        const r = Math.floor(k / 2);

        const xx =
          x + (c - 0.5) * tilePitch;

        const yy =
          middle +
          (0.5 - r) * tilePitch;

        parts.push(
          outline(
            xx, yy,
            tilePitch * 0.92,
            tilePitch * 0.92,
            s.color, 0.025
          )
        );

        if (squared > 0) {
          parts.push(
            ...squareUnits(
              xx, yy,
              squared,
              SETTING_COLOR,
              0.22,
              2
            )
          );
        } else {
          parts.push(
            txt(
              '0',
              xx, yy,
              C.muted, 18, true
            )
          );
        }
      }

      parts.push(
        txt(
          `${squared} × 4 = ${squared * B}`,
          x,
          middle - 0.93,
          SETTING_COLOR,
          18, true,
          1.85
        )
      );
    });

    parts.push(
      tag(
        '16 + 0 + 16 = 32',
        CX,
        Y(-2.39),
        SETTING_COLOR,
        21
      )
    );

    return parts;
  }

  await until(S(19));
  await play(
    ...replace(
      ...settingSquaresPicture()
    ),

    ...fbox([
      'squares: 4, 0, 4',
      '4 × (4 + 0 + 4)',
      ['settings SS = 32', SETTING_COLOR]
    ], SETTING_COLOR),

    ...say('COUNT EACH SETTING SQUARE FOUR TIMES', SETTING_COLOR)
  );

  // ------------------------------------------------------------
  // 20: PIECE TWO — THE BATTERIES
  //
  // Battery means = 16, 19, 21, 24.
  //
  // Distances from 20:
  // -4, -1, +1, +4.
  // ------------------------------------------------------------

  const BMEAN_MIN = 14;
  const BMEAN_MAX = 26;

  const BMEAN_LEFT =
    CX - 2.04;

  const BMEAN_RIGHT =
    CX + 2.94;

  const bx = v =>
    BMEAN_LEFT +
    (v - BMEAN_MIN) /
      (BMEAN_MAX - BMEAN_MIN) *
      (BMEAN_RIGHT - BMEAN_LEFT);

  const BM_ROWS = [
    Y(0.80),
    Y(-0.05),
    Y(-0.90),
    Y(-1.75)
  ];

  function batteryMeanPicture() {
    const axisY =
      Y(-2.16);

    const parts = [
      line(
        bx(BMEAN_MIN),
        axisY,
        bx(BMEAN_MAX),
        axisY,
        C.muted, 2.2
      ),

      dashed(
        bx(GRAND),
        axisY,
        bx(GRAND),
        BM_ROWS[0] + 0.50,
        C.ink
      ),

      tag(
        'GRAND 20',
        bx(GRAND),
        BM_ROWS[0] + 0.67,
        C.ink,
        15,
        1.45
      )
    ];

    for (
      let v = BMEAN_MIN;
      v <= BMEAN_MAX;
      v += 2
    ) {
      parts.push(
        txt(
          String(v),
          bx(v),
          axisY - 0.26,
          C.muted, 14, true
        ),

        line(
          bx(v), axisY - 0.06,
          bx(v), axisY + 0.06,
          C.muted, 1.2
        )
      );
    }

    BATTERY_MEANS.forEach((m, i) => {
      const y =
        BM_ROWS[i];

      const color =
        BATTERY_COLORS[i];

      const d =
        m - GRAND;

      parts.push(
        txt(
          `B${i + 1}`,
          CX - 2.76,
          y,
          color,
          17, true
        ),

        line(
          bx(BMEAN_MIN),
          y,
          bx(BMEAN_MAX),
          y,
          C.muted,
          0.75
        ),

        arrow(
          bx(GRAND),
          y,
          bx(m),
          y,
          BATTERY_COLOR,
          0.09
        ),

        dot(
          bx(m),
          y,
          color,
          0.12
        ),

        txt(
          String(m),
          bx(m),
          y + 0.28,
          color,
          17, true
        ),

        txt(
          signed(d),
          (bx(m) + bx(GRAND)) / 2,
          y - 0.23,
          BATTERY_COLOR,
          15, true
        )
      );
    });

    return parts;
  }

  await until(S(20));
  await play(
    ...replace(
      ...batteryMeanPicture()
    ),

    ...fbox([
      'piece 2: batteries',
      'means = 16, 19, 21, 24',
      ['distances = −4, −1, +1, +4', BATTERY_COLOR]
    ], BATTERY_COLOR),

    ...say('PIECE 2: THE BATTERIES HAVE DIFFERENT AVERAGES', BATTERY_COLOR)
  );

  // ------------------------------------------------------------
  // 21: BATTERY SUM OF SQUARES = 102
  //
  // 16 + 1 + 1 + 16 = 34.
  // Each battery mean represents three observations.
  //
  // 34 × 3 = 102.
  //
  // Square areas use the same scale across all four batteries.
  // ------------------------------------------------------------

  function batterySquaresPicture() {
    const parts = [];

    const centers = [
      CX - 2.24,
      CX - 0.75,
      CX + 0.75,
      CX + 2.24
    ];

    const y =
      Y(-0.39);

    BATTERY_EFFECTS.forEach((d, i) => {
      const color =
        BATTERY_COLORS[i];

      const n =
        d * d;

      const x =
        centers[i];

      parts.push(
        tag(
          `B${i + 1}`,
          x,
          Y(1.16),
          color,
          16
        ),

        txt(
          `(${signed(d)})²`,
          x,
          Y(0.65),
          BATTERY_COLOR,
          18, true,
          1.35
        ),

        ...squareUnits(
          x, y,
          n,
          color,
          0.23,
          Math.abs(d)
        ),

        txt(
          String(n),
          x,
          y - 0.69,
          BATTERY_COLOR,
          23, true
        )
      );
    });

    parts.push(
      tag(
        '16 + 1 + 1 + 16 = 34',
        CX,
        Y(-1.70),
        BATTERY_COLOR, 18
      ),

      tag(
        '34 × 3 = 102',
        CX,
        Y(-2.41),
        BATTERY_COLOR, 21
      )
    );

    return parts;
  }

  await until(S(21));
  await play(
    ...replace(
      ...batterySquaresPicture()
    ),

    ...fbox([
      '16 + 1 + 1 + 16 = 34',
      '3 readings per battery',
      ['battery SS = 34 × 3 = 102', BATTERY_COLOR]
    ], BATTERY_COLOR),

    ...say('COUNT EACH BATTERY’S SQUARE THREE TIMES', BATTERY_COLOR)
  );

  // ------------------------------------------------------------
  // 22: PIECE THREE — THE LEFTOVER
  //
  // Expected reading =
  // battery mean + setting mean - grand mean.
  //
  // Predicted values:
  // B1: 14, 16, 18.
  // B2: 17, 19, 21.
  // B3: 19, 21, 23.
  // B4: 22, 24, 26.
  //
  // Residuals:
  // B1: +1, -1, 0.
  // B2: -1, +1, 0.
  // B3:  0,  0, 0.
  // B4:  0,  0, 0.
  //
  // Only four nonzero squared residuals.
  // Leftover SS = 4.
  // ------------------------------------------------------------

  function residualPicture() {
    const parts = [
      plotAxes()
    ];

    // Draw predicted parallel lines first.

    PREDICTED.forEach((row, i) => {
      const color =
        BATTERY_COLORS[i];

      for (let j = 0; j < K - 1; j++) {
        parts.push(
          dashed(
            PX[j], py(row[j]),
            PX[j + 1], py(row[j + 1]),
            color
          )
        );
      }

      row.forEach((v, j) => {
        parts.push(
          outline(
            PX[j],
            py(v),
            0.18,
            0.18,
            color,
            0
          )
        );
      });
    });

    // Overlay the actual measurements.

    data.forEach((row, i) => {
      row.forEach((v, j) => {
        const predicted =
          PREDICTED[i][j];

        const residual =
          RESIDUALS[i][j];

        const color =
          BATTERY_COLORS[i];

        parts.push(
          dot(
            PX[j],
            py(v),
            color,
            0.095
          )
        );

        if (residual !== 0) {
          const x =
            PX[j] +
            (i === 0 ? -0.25 : 0.25);

          parts.push(
            arrow(
              x,
              py(predicted),
              x,
              py(v),
              ERROR_COLOR,
              0.07,
              2
            )
          );
        }
      });
    });

    parts.push(
      txt(
        'dashed = battery + setting prediction',
        CX,
        PY0 - 0.87,
        C.muted,
        15
      ),

      txt(
        'small green distances = leftover',
        CX,
        PY0 - 1.17,
        ERROR_COLOR,
        15
      )
    );

    return parts;
  }

  await until(S(22));
  await play(
    ...replace(
      ...residualPicture()
    ),

    ...fbox([
      'piece 3: leftover',
      'reading − battery − setting effects',
      ['only small residuals remain', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('WHAT NEITHER BATTERY NOR SETTING EXPLAINS', ERROR_COLOR)
  );

  function residualSquaresTable() {
    const parts = [
      ...tableHeaders()
    ];

    RESIDUALS.forEach((row, i) => {
      const y =
        TABLE_ROWS[i];

      parts.push(
        txt(
          `B${i + 1}`,
          TABLE_LABEL_X,
          y,
          BATTERY_COLORS[i],
          16, true
        )
      );

      row.forEach((d, j) => {
        const sq =
          d * d;

        const color =
          sq > 0
            ? ERROR_COLOR
            : C.muted;

        parts.push(
          outline(
            TABLE_COLS[j],
            y,
            1.48,
            P ? 0.85 : 0.69,
            color,
            sq > 0 ? 0.14 : 0.025
          ),

          txt(
            `(${signed(d)})²`,
            TABLE_COLS[j],
            y + 0.17,
            color,
            14, true
          ),

          txt(
            String(sq),
            TABLE_COLS[j],
            y - 0.14,
            color,
            20, true
          )
        );
      });
    });

    parts.push(
      tag(
        '1 + 1 + 1 + 1 = 4',
        CX,
        Y(-2.48),
        ERROR_COLOR,
        21
      )
    );

    return parts;
  }

  await until(S(22) + 3.0);
  await play(
    ...replace(
      ...residualSquaresTable()
    ),

    ...fbox([
      'four residuals of ±1',
      'eight residuals of 0',
      ['leftover SS = 4', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('THE LEFTOVER SUM OF SQUARES IS ONLY FOUR', ERROR_COLOR)
  );

  // ------------------------------------------------------------
  // 23: ALL THREE PIECES ADD BACK TO 138
  //
  // Show a proportional split of a single total.
  //
  // Settings = 32.
  // Batteries = 102.
  // Leftover = 4.
  //
  // All widths use the same scale.
  // ------------------------------------------------------------

  const SS_W = 5.90;

  const SS_LEFT =
    CX - SS_W / 2;

  const SS_SCALE =
    SS_W / SS_TOTAL;

  const SS_TOP =
    Y(0.73);

  const SS_SPLIT =
    Y(-0.52);

  function decompositionPicture(
    withBatteryRemoved = false
  ) {
    const parts = [
      txt(
        'TOTAL SS = 138',
        CX,
        SS_TOP + 0.51,
        C.ink,
        20, true
      ),

      rect(
        CX,
        SS_TOP,
        SS_W,
        0.52,
        C.ink,
        0.22
      ),

      txt(
        '138',
        CX,
        SS_TOP,
        C.ink,
        22, true
      )
    ];

    let cursor =
      SS_LEFT;

    PIECES.forEach((piece, k) => {
      const width =
        piece.value * SS_SCALE;

      const removed =
        withBatteryRemoved && k === 1;

      const color =
        removed
          ? C.muted
          : piece.color;

      parts.push(
        rect(
          cursor + width / 2,
          SS_SPLIT,
          Math.max(0.025, width - 0.012),
          0.58,
          color,
          removed ? 0.07 : 0.86
        )
      );

      if (piece.value > 15) {
        parts.push(
          txt(
            String(piece.value),
            cursor + width / 2,
            SS_SPLIT,
            removed ? C.muted : C.ink,
            21, true,
            width - 0.10
          )
        );
      }

      cursor += width;
    });

    const legendY =
      Y(-1.48);

    PIECES.forEach((piece, k) => {
      const x = GX(k);

      const color =
        withBatteryRemoved && k === 1
          ? C.muted
          : piece.color;

      parts.push(
        rect(
          x - 0.68,
          legendY,
          0.22, 0.22,
          color,
          0.84
        ),

        txt(
          piece.name,
          x + 0.08,
          legendY,
          color,
          14,
          false, 1.38
        ),

        txt(
          String(piece.value),
          x,
          legendY - 0.37,
          color,
          22, true
        )
      );
    });

    parts.push(
      tag(
        '32 + 102 + 4 = 138',
        CX,
        Y(-2.39),
        VIOLET,
        20
      )
    );

    return parts;
  }

  await until(S(23));
  await play(
    ...replace(
      ...decompositionPicture(false)
    ),

    ...fbox([
      ['settings SS = 32', SETTING_COLOR],
      ['battery SS = 102', BATTERY_COLOR],
      ['leftover SS = 4', ERROR_COLOR],
      'total = 138'
    ]),

    ...say('ALL THREE PIECES ADD BACK TO THE TOTAL')
  );

  // ------------------------------------------------------------
  // 24: SET THE BATTERY PIECE ASIDE
  //
  // Battery variation is real, but the research question
  // concerns differences between settings.
  //
  // Move the 102-unit battery segment out of the noise.
  // Keep the other two pieces on their original scale.
  // ------------------------------------------------------------

  const settingsWidth =
    SS_SETTINGS * SS_SCALE;

  const batteriesWidth =
    SS_BATTERIES * SS_SCALE;

  const leftoverWidth =
    SS_ERROR * SS_SCALE;

  const selectedTop =
    Y(0.56);

  const selectedBottom =
    Y(-0.92);

  const selectedSettings = rect(
    SS_LEFT + settingsWidth / 2,
    selectedTop,
    settingsWidth,
    0.53,
    SETTING_COLOR,
    0.85
  );

  const selectedBatteries = rect(
    SS_LEFT +
      settingsWidth +
      batteriesWidth / 2,
    selectedTop,
    batteriesWidth,
    0.53,
    BATTERY_COLOR,
    0.85
  );

  const selectedError = rect(
    SS_LEFT +
      settingsWidth +
      batteriesWidth +
      leftoverWidth / 2,
    selectedTop,
    leftoverWidth,
    0.53,
    ERROR_COLOR,
    0.85
  );

  const selectedLabels = [
    txt(
      '32',
      SS_LEFT + settingsWidth / 2,
      selectedTop,
      C.ink, 18, true
    ),

    txt(
      '102',
      SS_LEFT +
        settingsWidth +
        batteriesWidth / 2,
      selectedTop,
      C.ink, 22, true
    ),

    txt(
      '4',
      SS_LEFT +
        settingsWidth +
        batteriesWidth +
        leftoverWidth / 2,
      selectedTop + 0.47,
      ERROR_COLOR,
      18, true
    )
  ];

  const setAsideNote = tag(
    'BATTERY DIFFERENCES ARE NOT OUR QUESTION',
    CX,
    Y(-2.30),
    BATTERY_COLOR,
    15
  );

  await until(S(24));
  await play(
    ...replace(
      selectedSettings,
      selectedBatteries,
      selectedError,
      ...selectedLabels,
      setAsideNote
    ),

    ...fbox([
      'battery SS = 102',
      'real, but not our question',
      ['set it aside', GREEN]
    ], GREEN),

    ...say('SET THE BATTERY PIECE ASIDE', BATTERY_COLOR)
  );

  const movedBatteryTarget = rect(
    CX,
    selectedBottom,
    batteriesWidth,
    0.53,
    BATTERY_COLOR,
    0.24
  );

  const movedBatteryLabel = txt(
    '102: battery variation',
    CX,
    selectedBottom,
    BATTERY_COLOR,
    17, true
  );

  const separatedErrorTarget = rect(
    SS_LEFT +
      settingsWidth +
      0.30 +
      leftoverWidth / 2,
    selectedTop,
    leftoverWidth,
    0.53,
    ERROR_COLOR,
    0.85
  );

  const keptPiecesLabel = txt(
    'settings and leftover remain',
    CX,
    selectedTop + 0.61,
    GREEN,
    17
  );

  await until(S(24) + 2.0);
  await play(
    ...remove(
      selectedLabels[1],
      selectedLabels[2]
    ),

    new M.Transform(
      selectedBatteries,
      movedBatteryTarget,
      { pathArc: -0.30 }
    ),

    new M.Transform(
      selectedError,
      separatedErrorTarget
    ),

    ...add(
      movedBatteryLabel,
      keptPiecesLabel,

      txt(
        '4',
        SS_LEFT +
          settingsWidth +
          0.30 +
          leftoverWidth / 2,
        selectedTop - 0.43,
        ERROR_COLOR,
        18, true
      )
    )
  );

  // ------------------------------------------------------------
  // 25: SETTINGS MEAN SQUARE = 32 / 2 = 16
  //
  // Three setting means, one grand-mean constraint.
  // Two setting degrees of freedom.
  //
  // Share 32 squared-hour units into two groups of 16.
  // ------------------------------------------------------------

  function settingSharingPicture() {
    const parts = [];

    const top =
      Y(0.95);

    const middle =
      Y(-0.65);

    for (let j = 0; j < 3; j++) {
      const x =
        CX + (j - 1) * 0.86;

      parts.push(
        outline(
          x,
          top,
          0.69, 0.49,
          j < 2
            ? SETTING_COLOR
            : C.muted,
          j < 2 ? 0.13 : 0.025
        ),

        txt(
          j < 2 ? '1' : '×',
          x,
          top,
          j < 2
            ? SETTING_COLOR
            : C.muted,
          21, true
        )
      );
    }

    parts.push(
      txt(
        '3 − 1 = 2 df',
        CX,
        top - 0.48,
        SETTING_COLOR,
        18, true
      )
    );

    for (let k = 0; k < 2; k++) {
      const x =
        CX + (k - 0.5) * 2.40;

      parts.push(
        outline(
          x,
          middle,
          1.70, 1.47,
          SETTING_COLOR,
          0.04
        ),

        ...squareUnits(
          x,
          middle,
          16,
          SETTING_COLOR,
          0.27,
          4
        ),

        txt(
          '16',
          x,
          middle - 0.98,
          SETTING_COLOR,
          24, true
        )
      );
    }

    parts.push(
      tag(
        '32 ÷ 2 = 16',
        CX,
        Y(-2.39),
        SETTING_COLOR,
        22
      )
    );

    return parts;
  }

  await until(S(25));
  await play(
    ...replace(
      ...settingSharingPicture()
    ),

    ...fbox([
      'settings SS = 32',
      'settings df = 3 − 1 = 2',
      ['settings MS = 16', SETTING_COLOR]
    ], SETTING_COLOR),

    ...say('SETTINGS: SHARE THIRTY-TWO OVER TWO df', SETTING_COLOR)
  );

  // ------------------------------------------------------------
  // 26: LEFTOVER df = (3-1)(4-1) = 6
  //
  // Two setting degrees of freedom.
  // Three battery degrees of freedom.
  //
  // A two-by-three grid illustrates the six independent
  // residual degrees of freedom.
  //
  // Leftover MS = 4 / 6 ≈ 0.67.
  // ------------------------------------------------------------

  function leftoverDFPicture() {
    const parts = [];

    const y =
      Y(-0.43);

    const gridX =
      CX + 0.47;

    const pitchX =
      0.87;

    const pitchY =
      0.70;

    parts.push(
      txt(
        '2 SETTING df',
        gridX,
        Y(1.10),
        SETTING_COLOR,
        17
      ),

      txt(
        '3 BATTERY df',
        CX - 2.04,
        y,
        BATTERY_COLOR,
        15,
        false, 1.57
      )
    );

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const x =
          gridX +
          (c - 0.5) * pitchX;

        const yy =
          y +
          (1 - r) * pitchY;

        parts.push(
          outline(
            x, yy,
            0.74, 0.58,
            ERROR_COLOR,
            0.12
          ),

          txt(
            '1 df',
            x, yy,
            ERROR_COLOR,
            16, true
          )
        );
      }
    }

    parts.push(
      bracket(
        gridX - 0.84,
        gridX + 0.84,
        y + 1.18,
        SETTING_COLOR,
        0.08
      ),

      vBracket(
        gridX - 1.12,
        y - 0.99,
        y + 0.99,
        BATTERY_COLOR,
        0.08
      ),

      tag(
        '2 × 3 = 6 LEFTOVER df',
        CX,
        Y(-2.24),
        ERROR_COLOR,
        19
      )
    );

    return parts;
  }

  await until(S(26));
  await play(
    ...replace(
      ...leftoverDFPicture()
    ),

    ...fbox([
      'leftover df = (3−1)(4−1)',
      '= 2 × 3',
      ['= 6', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('LEFTOVER DEGREES OF FREEDOM: TWO TIMES THREE', ERROR_COLOR)
  );

  // Illustrate sharing four squared-hour units over six df.
  //
  // Each of the six cups receives 2/3 of a unit.
  // The diagram contains exactly twelve one-third blocks.

  function leftoverSharingPicture() {
    const parts = [];

    const top =
      Y(0.74);

    const middle =
      Y(-0.64);

    for (let k = 0; k < 4; k++) {
      const x =
        CX + (k - 1.5) * 0.93;

      parts.push(
        rect(
          x,
          top,
          0.74, 0.61,
          ERROR_COLOR,
          0.73
        ),

        txt(
          '1',
          x,
          top,
          C.ink, 20, true
        )
      );

      for (let q = 1; q <= 2; q++) {
        parts.push(
          line(
            x - 0.37,
            top - 0.305 + q * 0.61 / 3,
            x + 0.37,
            top - 0.305 + q * 0.61 / 3,
            C.card,
            1.5
          )
        );
      }
    }

    parts.push(
      txt(
        '4 squared-hour units',
        CX,
        top + 0.49,
        ERROR_COLOR,
        17
      )
    );

    for (let k = 0; k < 6; k++) {
      const x =
        CX + (k - 2.5) * 0.91;

      parts.push(
        outline(
          x,
          middle,
          0.72, 0.80,
          ERROR_COLOR,
          0.04
        ),

        rect(
          x,
          middle - 0.12,
          0.58,
          0.22,
          ERROR_COLOR,
          0.85
        ),

        rect(
          x,
          middle + 0.12,
          0.58,
          0.22,
          ERROR_COLOR,
          0.85
        ),

        txt(
          '2/3',
          x,
          middle - 0.63,
          ERROR_COLOR,
          16, true
        )
      );
    }

    parts.push(
      tag(
        '4 ÷ 6 ≈ 0.67',
        CX,
        Y(-2.33),
        ERROR_COLOR,
        22
      )
    );

    return parts;
  }

  await until(S(26) + 3.4);
  await play(
    ...replace(
      ...leftoverSharingPicture()
    ),

    ...fbox([
      'leftover SS = 4',
      'leftover df = 6',
      ['leftover MS = 4/6 ≈ 0.67', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('THE LEFTOVER MEAN SQUARE IS ABOUT 0.67', ERROR_COLOR)
  );

  // ------------------------------------------------------------
  // 27: F = 16 / (4/6) = 24
  //
  // The ratio is calculated using the exact denominator,
  // not the rounded display value of 0.67.
  //
  // Twenty-four residual mean-square units fill the
  // setting mean square exactly.
  // ------------------------------------------------------------

  function repeatedRatioPicture() {
    const parts = [];

    const top =
      Y(0.24);

    const bottom =
      Y(-1.14);

    const cellW =
      0.41;

    const left =
      CX - 12 * cellW / 2;

    parts.push(
      txt(
        'SETTINGS MEAN SQUARE = 16',
        CX,
        top + 0.87,
        SETTING_COLOR,
        17
      )
    );

    for (let k = 0; k < 24; k++) {
      const c = k % 12;
      const r = Math.floor(k / 12);

      parts.push(
        rect(
          left + (c + 0.5) * cellW,
          top + (0.5 - r) * 0.41,
          cellW * 0.89,
          0.36,
          SETTING_COLOR,
          0.86
        )
      );
    }

    parts.push(
      txt(
        '24 equal noise units',
        CX,
        top - 0.71,
        SETTING_COLOR,
        17
      ),

      rect(
        left + cellW / 2,
        bottom,
        cellW * 0.89,
        0.36,
        ERROR_COLOR,
        0.86
      ),

      txt(
        'one leftover unit = 2/3',
        CX + 0.28,
        bottom,
        ERROR_COLOR,
        17
      ),

      tag(
        'F = 16 ÷ (4/6) = 24',
        CX,
        Y(-2.27),
        VIOLET,
        22
      )
    );

    return parts;
  }

  await until(S(27));
  await play(
    ...replace(
      ...repeatedRatioPicture()
    ),

    ...fbox([
      'F = settings ÷ leftover',
      '= 16 ÷ (4/6)',
      ['= 24', VIOLET]
    ], VIOLET),

    ...say('THE SETTINGS MEAN SQUARE IS TWENTY-FOUR TIMES THE NOISE', VIOLET)
  );

  // ------------------------------------------------------------
  // 28: F(2,6), p ≈ 0.001
  //
  // Reference cutoff at the 5% level ≈ 5.14.
  // Observed F = 24.
  //
  // The numerical p-value includes the entire infinite
  // right tail, even though the plotted curve is finite.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...replace(
      ...fReferencePicture(
        DF_ERROR,
        F_REPEATED,
        P_REPEATED,
        30,
        GREEN,
        'REPEATED-MEASURES ANOVA'
      )
    ),

    ...fbox([
      'F = 24; df = 2 and 6',
      `p ≈ ${P_REPEATED.toFixed(4)}`,
      ['about one in a thousand', GREEN]
    ], GREEN),

    ...say('THE p-VALUE IS NOW ABOUT ONE IN A THOUSAND', GREEN)
  );

  // ------------------------------------------------------------
  // 29: SAME DATA, BUT NOW THE SETTINGS CLEARLY MATTER
  //
  // Side-by-side comparison:
  //
  // Incorrect ordinary ANOVA:
  // denominator ≈ 11.78, F ≈ 1.36, p ≈ 0.31.
  //
  // Repeated-measures ANOVA:
  // denominator ≈ 0.67, F = 24, p ≈ 0.001.
  //
  // The numerator stays at 16.
  // ------------------------------------------------------------

  function resultCard(
    x,
    repeated
  ) {
    const y =
      Y(-0.30);

    const color =
      repeated
        ? GREEN
        : GOLD;

    const mse =
      repeated
        ? MS_ERROR
        : MS_ORDINARY_WITHIN;

    const f =
      repeated
        ? F_REPEATED
        : F_ORDINARY;

    const p =
      repeated
        ? P_REPEATED
        : P_ORDINARY;

    return new M.VGroup(
      outline(
        x, y,
        2.86, 2.96,
        color, 0.055
      ),

      txt(
        repeated
          ? 'KEEP PARTNERS'
          : 'IGNORE PARTNERS',
        x,
        y + 1.15,
        color, 16,
        false, 2.65
      ),

      txt(
        'settings MS = 16',
        x,
        y + 0.58,
        SETTING_COLOR,
        15, true,
        2.64
      ),

      line(
        x - 1.13,
        y + 0.31,
        x + 1.13,
        y + 0.31,
        C.ink,
        2
      ),

      txt(
        `noise = ${mse.toFixed(2)}`,
        x,
        y + 0.03,
        color,
        17, true,
        2.58
      ),

      txt(
        `F = ${repeated ? f : f.toFixed(2)}`,
        x,
        y - 0.43,
        color,
        26, true
      ),

      txt(
        `p ≈ ${p.toFixed(repeated ? 3 : 2)}`,
        x,
        y - 0.91,
        color,
        20, true
      ),

      txt(
        repeated
          ? 'significant'
          : 'not significant',
        x,
        y - 1.24,
        color,
        14,
        false, 2.58
      )
    );
  }

  const ordinaryCard =
    resultCard(CX - 1.62, false);

  const repeatedCard =
    resultCard(CX + 1.62, true);

  await until(S(29));
  await play(
    ...replace(
      ordinaryCard,
      repeatedCard,

      tag(
        'SAME TWELVE READINGS',
        CX,
        Y(-2.40),
        GREEN,
        18
      )
    ),

    ...fbox([
      'ordinary: F ≈ 1.36, p ≈ 0.31',
      'repeated: F = 24, p ≈ 0.001',
      ['same data, smaller noise', GREEN]
    ], GREEN),

    ...say('SAME DATA. NOW THE SETTING EFFECT IS CLEAR.', GREEN)
  );

  // ------------------------------------------------------------
  // 30: NAME THE METHOD — REPEATED-MEASURES ANOVA
  // ------------------------------------------------------------

  function methodNamePicture() {
    const parts = [
      outline(
        CX,
        Y(0.56),
        5.90, 1.03,
        VIOLET,
        0.065
      ),

      txt(
        'REPEATED-MEASURES ANOVA',
        CX,
        Y(0.56),
        VIOLET,
        24,
        false, 5.60
      )
    ];

    const y =
      Y(-0.92);

    for (let j = 0; j < K - 1; j++) {
      parts.push(
        line(
          GX(j) + 0.32,
          y,
          GX(j + 1) - 0.32,
          y,
          BLUE,
          2
        )
      );
    }

    settings.forEach((s, j) => {
      parts.push(
        batteryIcon(
          GX(j),
          y,
          BLUE,
          0.45, 0.77
        ),

        tag(
          s.name.toUpperCase(),
          GX(j),
          y - 0.79,
          s.color,
          15,
          1.72
        ),

        txt(
          'B1',
          GX(j),
          y + 0.65,
          BLUE,
          15, true
        )
      );
    });

    parts.push(
      txt(
        'one battery measured repeatedly',
        CX,
        Y(-2.43),
        C.ink,
        16
      )
    );

    return parts;
  }

  await until(S(30));
  await play(
    ...replace(
      ...methodNamePicture()
    ),

    ...fbox([
      ['repeated-measures ANOVA', VIOLET],
      'same subjects',
      'several conditions'
    ], VIOLET),

    ...say('THIS IS REPEATED-MEASURES ANOVA', VIOLET)
  );

  // ------------------------------------------------------------
  // 31: THE FORMULA
  //
  // F =
  // (settings SS / settings df)
  // divided by
  // (leftover SS / leftover df).
  //
  // Leftover SS =
  // total SS - settings SS - battery SS.
  //
  // A compact ANOVA table makes the partition explicit.
  // ------------------------------------------------------------

  function anovaTable() {
    const top =
      Y(1.15);

    const step =
      P ? 0.83 : 0.60;

    const xs = [
      CX - 2.16,
      CX - 0.38,
      CX + 0.62,
      CX + 1.53,
      CX + 2.49
    ];

    const parts = [];

    const headers = [
      'SOURCE', 'SS', 'df', 'MS', 'F'
    ];

    headers.forEach((s, k) => {
      parts.push(
        txt(
          s,
          xs[k],
          top,
          C.muted,
          15, true,
          k === 0 ? 1.66 : 0.78
        )
      );
    });

    parts.push(
      line(
        CX - 3.02,
        top - 0.28,
        CX + 3.02,
        top - 0.28,
        C.muted,
        1.5
      )
    );

    const rows = [
      [
        'Settings',
        SS_SETTINGS,
        DF_SETTINGS,
        MS_SETTINGS,
        F_REPEATED,
        SETTING_COLOR
      ],
      [
        'Batteries',
        SS_BATTERIES,
        DF_BATTERIES,
        SS_BATTERIES / DF_BATTERIES,
        '—',
        BATTERY_COLOR
      ],
      [
        'Leftover',
        SS_ERROR,
        DF_ERROR,
        MS_ERROR.toFixed(2),
        '—',
        ERROR_COLOR
      ],
      [
        'Total',
        SS_TOTAL,
        DF_TOTAL,
        '—',
        '—',
        C.ink
      ]
    ];

    rows.forEach((row, i) => {
      const y =
        top - (i + 1) * step;

      for (let k = 0; k < 5; k++) {
        parts.push(
          txt(
            row[k],
            xs[k],
            y,
            row[5],
            k === 0 ? 16 : 19,
            k !== 0,
            k === 0 ? 1.72 : 0.83
          )
        );
      }

      if (i < rows.length - 1) {
        parts.push(
          line(
            CX - 3.02,
            y - step / 2,
            CX + 3.02,
            y - step / 2,
            C.muted,
            0.75
          )
        );
      }
    });

    parts.push(
      outline(
        xs[3],
        top - step,
        0.79,
        0.43,
        SETTING_COLOR,
        0
      ),

      outline(
        xs[3],
        top - 3 * step,
        0.79,
        0.43,
        ERROR_COLOR,
        0
      ),

      tag(
        'F = 16 ÷ (4/6) = 24',
        CX,
        Y(-2.38),
        GREEN,
        20
      )
    );

    return parts;
  }

  await until(S(31));
  await play(
    ...replace(
      ...anovaTable()
    ),

    ...fbox([
      'SS error = total − settings − batteries',
      'F = MS settings / MS error',
      '  = (32/2) / (4/6)',
      ['  = 24', GREEN]
    ], VIOLET),

    ...say('SETTINGS MEAN SQUARE DIVIDED BY LEFTOVER MEAN SQUARE')
  );

  // ------------------------------------------------------------
  // 32: COMPARE SETTINGS WITHIN EACH BATTERY
  //
  // Visually remove each battery's individual average.
  //
  // Centered readings:
  // B1: -1, -1, +2.
  // B2: -3, +1, +2.
  // B3: -2, 0, +2.
  // B4: -2, 0, +2.
  //
  // The setting pattern is easier to see after the battery
  // baselines have been removed.
  //
  // Small horizontal offsets separate coincident dots.
  // All vertical coordinates remain numerically exact.
  // ------------------------------------------------------------

  const CENTERED = data.map((row, i) =>
    row.map(v => v - BATTERY_MEANS[i])
  );

  function centeredPlot() {
    const y0 =
      Y(-2.01);

    const y1 =
      Y(1.05);

    const cy = v =>
      y0 +
      (v + 4) / 8 *
      (y1 - y0);

    const parts = [
      line(
        AXIS_X, y0,
        AXIS_X, y1,
        C.muted,
        1.8
      ),

      line(
        AXIS_X, y0,
        CX + 2.94, y0,
        C.muted,
        2
      )
    ];

    for (let v = -4; v <= 4; v++) {
      parts.push(
        txt(
          signed(v),
          AXIS_X - 0.26,
          cy(v),
          C.muted,
          14, true,
          0.47
        ),

        line(
          AXIS_X + 0.07,
          cy(v),
          CX + 2.94,
          cy(v),
          C.muted,
          0.65
        )
      );
    }

    parts.push(
      dashed(
        AXIS_X + 0.06,
        cy(0),
        CX + 2.94,
        cy(0),
        C.ink
      ),

      txt(
        'hours relative to own average',
        CX,
        y1 + 0.26,
        C.muted,
        15
      )
    );

    CENTERED.forEach((row, i) => {
      const offset =
        (i - 1.5) * 0.105;

      const color =
        BATTERY_COLORS[i];

      for (let j = 0; j < K - 1; j++) {
        parts.push(
          line(
            PX[j] + offset,
            cy(row[j]),
            PX[j + 1] + offset,
            cy(row[j + 1]),
            color,
            2.1
          )
        );
      }

      row.forEach((v, j) => {
        parts.push(
          dot(
            PX[j] + offset,
            cy(v),
            color,
            0.075
          )
        );
      });
    });

    for (let j = 0; j < K - 1; j++) {
      parts.push(
        line(
          PX[j],
          cy(SETTING_EFFECTS[j]),
          PX[j + 1],
          cy(SETTING_EFFECTS[j + 1]),
          C.ink,
          3.7
        )
      );
    }

    SETTING_EFFECTS.forEach((v, j) => {
      parts.push(
        rect(
          PX[j],
          cy(v),
          0.16, 0.16,
          C.ink,
          1
        ),

        txt(
          signed(v),
          PX[j] + 0.37,
          cy(v) + 0.29,
          C.ink,
          17, true
        ),

        tag(
          settings[j].name.toUpperCase(),
          PX[j],
          y0 - 0.38,
          settings[j].color,
          15,
          1.75
        )
      );
    });

    return parts;
  }

  await until(S(32));
  await play(
    ...replace(
      ...centeredPlot()
    ),

    ...fbox([
      'subtract each battery’s own mean',
      'compare its changes across settings',
      ['not its overall strength', GREEN]
    ], GREEN),

    ...say('COMPARE SETTINGS WITHIN THE SAME BATTERY', GREEN)
  );

  // ------------------------------------------------------------
  // 33: WHAT IS REPEATED-MEASURES ANOVA FOR?
  //
  // The same people, machines or places are measured
  // under several conditions.
  //
  // Schematic examples only; no numerical data invented.
  // ------------------------------------------------------------

  function personIcon(x, y, color) {
    const head = new M.Circle({
      radius: 0.13,
      color
    });

    head.setFill(color, 0.83);
    head.moveTo(pt(x, y + 0.25));

    return new M.VGroup(
      head,

      outline(
        x,
        y - 0.12,
        0.32, 0.47,
        color, 0.68
      )
    );
  }

  function machineIcon(x, y, color) {
    return new M.VGroup(
      outline(
        x, y,
        0.57, 0.60,
        color, 0.15
      ),

      outline(
        x,
        y + 0.13,
        0.37, 0.18,
        color, 0.27
      ),

      dot(
        x - 0.11,
        y - 0.15,
        color,
        0.045
      ),

      dot(
        x + 0.11,
        y - 0.15,
        color,
        0.045
      )
    );
  }

  function placeIcon(x, y, color) {
    return new M.VGroup(
      outline(
        x,
        y - 0.07,
        0.52, 0.43,
        color, 0.17
      ),

      line(
        x - 0.32,
        y + 0.16,
        x,
        y + 0.43,
        color, 2.5
      ),

      line(
        x,
        y + 0.43,
        x + 0.32,
        y + 0.16,
        color, 2.5
      ),

      rect(
        x,
        y - 0.17,
        0.13, 0.22,
        color, 0.65
      )
    );
  }

  function generalUsePicture() {
    const parts = [];

    const examples = [
      {
        name: 'PEOPLE',
        color: BLUE,
        icon: personIcon
      },
      {
        name: 'MACHINES',
        color: GOLD,
        icon: machineIcon
      },
      {
        name: 'PLACES',
        color: PINK,
        icon: placeIcon
      }
    ];

    const ys = [
      Y(0.69),
      Y(-0.40),
      Y(-1.49)
    ];

    const xs = [
      CX - 0.78,
      CX + 0.86,
      CX + 2.48
    ];

    examples.forEach((ex, i) => {
      const y = ys[i];

      parts.push(
        txt(
          ex.name,
          CX - 2.35,
          y,
          ex.color,
          16,
          false, 1.57
        )
      );

      for (let j = 0; j < K - 1; j++) {
        parts.push(
          line(
            xs[j] + 0.36,
            y,
            xs[j + 1] - 0.36,
            y,
            ex.color,
            1.7
          )
        );
      }

      for (let j = 0; j < K; j++) {
        parts.push(
          ex.icon(
            xs[j],
            y,
            ex.color
          )
        );
      }
    });

    xs.forEach((x, j) => {
      parts.push(
        txt(
          `COND ${j + 1}`,
          x,
          Y(1.30),
          C.muted,
          14,
          false, 1.40
        )
      );
    });

    parts.push(
      tag(
        'SAME SUBJECTS, SEVERAL CONDITIONS',
        CX,
        Y(-2.43),
        VIOLET,
        17
      )
    );

    return parts;
  }

  await until(S(33));
  await play(
    ...replace(
      ...generalUsePicture()
    ),

    ...fbox([
      'same people, machines or places',
      'measured under several conditions',
      ['keep the subject identities', VIOLET]
    ], VIOLET),

    ...say('USE IT WHEN THE SAME THINGS ARE MEASURED REPEATEDLY')
  );

  // ------------------------------------------------------------
  // 34: THE PAIRED t-TEST, GROWN UP
  //
  // Paired t-test: two conditions per subject.
  // Repeated-measures ANOVA: three or more conditions.
  //
  // With two conditions, the ordinary uncorrected
  // repeated-measures ANOVA satisfies F = t² and yields
  // the same p-value as the two-sided paired t-test.
  // ------------------------------------------------------------

  function pairedEvolutionPicture() {
    const parts = [];

    const y =
      Y(-0.27);

    const left =
      CX - 1.62;

    const right =
      CX + 1.62;

    parts.push(
      outline(
        left, y,
        2.81, 2.78,
        BLUE,
        0.045
      ),

      outline(
        right, y,
        2.81, 2.78,
        VIOLET,
        0.045
      ),

      txt(
        'PAIRED t-TEST',
        left,
        y + 1.04,
        BLUE,
        17,
        false, 2.60
      ),

      txt(
        'REPEATED ANOVA',
        right,
        y + 1.04,
        VIOLET,
        16,
        false, 2.60
      )
    );

    for (let i = 0; i < 3; i++) {
      const yy =
        y + 0.45 - i * 0.47;

      const color =
        BATTERY_COLORS[i];

      parts.push(
        line(
          left - 0.59,
          yy,
          left + 0.59,
          yy,
          color,
          1.9
        ),

        dot(
          left - 0.59,
          yy,
          color,
          0.09
        ),

        dot(
          left + 0.59,
          yy,
          color,
          0.09
        ),

        line(
          right - 0.81,
          yy,
          right + 0.81,
          yy,
          color,
          1.9
        )
      );

      for (let j = 0; j < 3; j++) {
        parts.push(
          dot(
            right + (j - 1) * 0.81,
            yy,
            color,
            0.09
          )
        );
      }
    }

    parts.push(
      txt(
        '2 conditions',
        left,
        y - 1.05,
        BLUE,
        17
      ),

      txt(
        '3+ conditions',
        right,
        y - 1.05,
        VIOLET,
        17
      ),

      tag(
        'WITH TWO CONDITIONS: F = t²',
        CX,
        Y(-2.36),
        GREEN,
        18
      )
    );

    return parts;
  }

  await until(S(34));
  await play(
    ...replace(
      ...pairedEvolutionPicture()
    ),

    ...fbox([
      'paired t-test: 2 conditions',
      'repeated ANOVA: 3 or more',
      ['with 2: same answer', GREEN]
    ], GREEN),

    ...say('THE PAIRED t-TEST, GROWN UP TO MORE CONDITIONS', VIOLET)
  );

  // ------------------------------------------------------------
  // 35: THE TRAP — ORDER CAN MATTER
  //
  // If every battery receives the settings in the same
  // chronological order, aging, learning, fatigue or carryover
  // may become confounded with the condition.
  //
  // Battery wear is illustrated here schematically.
  // ------------------------------------------------------------

  function orderTrapPicture() {
    const parts = [];

    const y =
      Y(-0.32);

    const charges = [
      0.94,
      0.66,
      0.39
    ];

    settings.forEach((s, j) => {
      const x = GX(j);

      parts.push(
        tag(
          `TEST ${j + 1}`,
          x,
          y + 1.10,
          C.muted,
          16
        ),

        batteryIcon(
          x,
          y,
          BLUE,
          0.65,
          1.32,
          charges[j]
        ),

        tag(
          s.name.toUpperCase(),
          x,
          y - 1.03,
          s.color,
          15,
          1.80
        )
      );

      if (j < K - 1) {
        parts.push(
          arrow(
            x + 0.46,
            y,
            GX(j + 1) - 0.46,
            y,
            C.muted,
            0.12
          )
        );
      }
    });

    parts.push(
      arrow(
        GX(0),
        Y(-1.91),
        GX(2),
        Y(-1.91),
        GOLD,
        0.13
      ),

      txt(
        'time passes; battery may wear',
        CX,
        Y(-2.35),
        GOLD,
        17
      )
    );

    return parts;
  }

  await until(S(35));
  await play(
    ...replace(
      ...orderTrapPicture()
    ),

    ...fbox([
      'trap: the sequence of tests',
      'battery condition may change',
      ['order can mimic a setting effect', GOLD]
    ], GOLD),

    ...say('TRAP: THE ORDER OF THE TESTS CAN MATTER', GOLD)
  );

  // ------------------------------------------------------------
  // 36: CHANGE THE ORDER FROM BATTERY TO BATTERY
  //
  // Illustrate varied test orders.
  //
  // With four batteries and three conditions, perfect
  // counterbalancing of all six possible orders is impossible.
  // The example therefore varies the sequence rather than
  // claiming perfect balance.
  //
  // Displayed schedules:
  //
  // B1: Old, New, Saver.
  // B2: New, Saver, Old.
  // B3: Saver, Old, New.
  // B4: Saver, New, Old.
  //
  // These are illustrative design choices, not the actual
  // chronological order of the supplied measurements.
  //
  // The data remain indexed by setting, not test position.
  // ------------------------------------------------------------

  const SAME_ORDER = [
    [0, 1, 2],
    [0, 1, 2],
    [0, 1, 2],
    [0, 1, 2]
  ];

  const VARIED_ORDER = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0]
  ];

  function orderTable(orders, varied) {
    const parts = [];

    const top =
      TABLE_ROWS[0] + 0.61;

    for (let j = 0; j < K; j++) {
      parts.push(
        txt(
          `TEST ${j + 1}`,
          TABLE_COLS[j],
          top,
          C.muted,
          15
        )
      );
    }

    orders.forEach((row, i) => {
      const y =
        TABLE_ROWS[i];

      parts.push(
        txt(
          `B${i + 1}`,
          TABLE_LABEL_X,
          y,
          BATTERY_COLORS[i],
          17, true
        )
      );

      for (let j = 0; j < K - 1; j++) {
        parts.push(
          arrow(
            TABLE_COLS[j] + 0.65,
            y,
            TABLE_COLS[j + 1] - 0.65,
            y,
            C.muted,
            0.075,
            1.5
          )
        );
      }

      row.forEach((settingIndex, j) => {
        const s =
          settings[settingIndex];

        parts.push(
          outline(
            TABLE_COLS[j],
            y,
            1.28, 0.54,
            s.color,
            0.14
          ),

          txt(
            s.name.toUpperCase(),
            TABLE_COLS[j],
            y,
            s.color,
            16,
            false, 1.14
          )
        );
      });
    });

    parts.push(
      tag(
        varied
          ? 'VARY THE ORDER BETWEEN BATTERIES'
          : 'SAME ORDER EVERY TIME',
        CX,
        Y(-2.46),
        varied ? GREEN : GOLD,
        17
      )
    );

    return parts;
  }

  await until(S(36));
  await play(
    ...replace(
      ...orderTable(
        SAME_ORDER,
        false
      )
    ),

    ...fbox([
      'every battery tested in same order',
      'setting and test position overlap',
      ['wear can become confounded', GOLD]
    ], GOLD),

    ...say('DO NOT ALWAYS TEST THE SETTINGS IN THE SAME ORDER', GOLD)
  );

  await until(S(36) + 3.8);
  await play(
    ...replace(
      ...orderTable(
        VARIED_ORDER,
        true
      )
    ),

    ...fbox([
      'randomize or counterbalance order',
      'use suitable recovery between tests',
      ['separate wear from setting effects', GREEN]
    ], GREEN),

    ...say('CHANGE THE ORDER FROM BATTERY TO BATTERY', GREEN)
  );

  // ------------------------------------------------------------
  // 37: ONE-SENTENCE SUMMARY
  //
  // Show the original repeated measurements.
  //
  // Preserve the same four battery identities and the
  // observed setting mean pattern of 18, 20, 22.
  //
  // Show the three variation pieces:
  // Settings = 32.
  // Batteries = 102, set aside.
  // Leftover = 4.
  //
  // Settings MS = 16.
  // Leftover MS = 4/6.
  // F = 24; df = 2,6; p ≈ 0.001.
  // ------------------------------------------------------------

  function finalPlot() {
    const bottom =
      P ? -2.20 : -0.82;

    const top =
      1.24;

    const xx = [
      CX - 1.86,
      CX + 0.06,
      CX + 1.98
    ];

    const yy = v =>
      bottom +
      (v - HMIN) /
        (HMAX - HMIN) *
        (top - bottom);

    const parts = [
      line(
        CX - 2.86,
        bottom,
        CX - 2.86,
        top,
        C.muted,
        1.7
      ),

      line(
        CX - 2.86,
        bottom,
        CX + 2.88,
        bottom,
        C.muted,
        2
      )
    ];

    [12, 16, 20, 24, 28].forEach(v => {
      parts.push(
        txt(
          String(v),
          CX - 3.10,
          yy(v),
          C.muted,
          13, true
        ),

        line(
          CX - 2.79,
          yy(v),
          CX + 2.88,
          yy(v),
          C.muted,
          0.65
        )
      );
    });

    data.forEach((row, i) => {
      const color =
        BATTERY_COLORS[i];

      for (let j = 0; j < K - 1; j++) {
        parts.push(
          line(
            xx[j],
            yy(row[j]),
            xx[j + 1],
            yy(row[j + 1]),
            color,
            2.3
          )
        );
      }

      row.forEach((v, j) => {
        parts.push(
          dot(
            xx[j],
            yy(v),
            color,
            0.085
          )
        );
      });
    });

    for (let j = 0; j < K - 1; j++) {
      parts.push(
        line(
          xx[j],
          yy(SETTING_MEANS[j]),
          xx[j + 1],
          yy(SETTING_MEANS[j + 1]),
          C.ink,
          3.5
        )
      );
    }

    SETTING_MEANS.forEach((v, j) => {
      parts.push(
        rect(
          xx[j],
          yy(v),
          0.16, 0.16,
          C.ink,
          1
        ),

        tag(
          String(v),
          xx[j] - 0.5,
          yy(v),
          C.ink,
          15
        ),

        txt(
          settings[j].name,
          xx[j],
          bottom - 0.28,
          settings[j].color,
          15
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const FINAL_PIECES_Y =
    P ? -3.38 : -2.02;

  function finalPieceCard(
    k,
    item
  ) {
    const x =
      CX + (k - 1) * 2.04;

    const color =
      k === 1
        ? C.muted
        : item.color;

    return new M.VGroup(
      outline(
        x,
        FINAL_PIECES_Y - 0.04,
        1.83,
        1.16,
        color,
        k === 1 ? 0.025 : 0.085
      ),

      txt(
        item.name,
        x,
        FINAL_PIECES_Y + 0.3,
        color,
        15,
        false, 1.70
      ),

      txt(
        String(item.value),
        x,
        FINAL_PIECES_Y - 0.12,
        color,
        24, true
      ),

      k === 1
        ? txt(
            'set aside',
            x,
            FINAL_PIECES_Y - 0.42,
            BATTERY_COLOR,
            15
          )
        : txt(
            'SS',
            x,
            FINAL_PIECES_Y - 0.42,
            color,
            15
          )
    );
  }

  const finalPieces = PIECES.map(
    (item, k) =>
      finalPieceCard(k, item)
  );

  const finalF = tag(
    'F = 24   •   df = 2, 6   •   p ≈ 0.001',
    CX,
    P ? -4.43 : -3.02,
    GREEN,
    17
  );

  await until(S(37));
  await play(
    ...replace(
      finalPlot(),
      ...finalPieces,
      finalF
    ),

    ...fbox([
      ['repeated-measures ANOVA', VIOLET],
      '138 = 32 + 102 + 4',
      'F = (32/2) / (4/6) = 24',
      ['p ≈ 0.001', GREEN]
    ], GREEN),

    ...say('REMOVE BATTERY DIFFERENCES, THEN TEST THE SETTINGS', GREEN)
  );

  // Final visual emphasis on the residual piece.
  //
  // Do not change the data or calculated results.
  // Keep the concluding diagram visible until narration ends.

  await until(S(37) + 5.0);
  await play(
    new M.Indicate(
      finalPieces[2],
      { color: ERROR_COLOR }
    ),

    ...fbox([
      'compare within each battery',
      'set battery gaps aside',
      ['test vs leftover noise', GREEN]
    ], GREEN),

    ...say('SAME SUBJECTS. SMALLER NOISE. CLEARER COMPARISON.', GREEN)
  );

  await until(E(37));

  // ------------------------------------------------------------
  // END OF LESSON 7.2.12
  //
  // All sentence beats 0–37 are included.
  //
  // Shared chapter data are unchanged:
  //
  // Battery 1: [15, 15, 18].
  // Battery 2: [16, 20, 21].
  // Battery 3: [19, 21, 23].
  // Battery 4: [22, 24, 26].
  //
  // Each battery retains its identity and color across all
  // three settings. Thin connecting lines explicitly identify
  // repeated measurements of the same battery.
  //
  // Setting means, battery means, grand mean, all sums of
  // squares, degrees of freedom and F ratios are calculated
  // directly from the prescribed data.
  //
  // Total SS = 138.
  // Settings SS = 32.
  // Batteries SS = 102.
  // Leftover SS = 4.
  //
  // Residuals are calculated using:
  // reading - battery mean - setting mean + grand mean.
  //
  // Ordinary ANOVA is deliberately presented as inappropriate
  // for these dependent measurements.
  //
  // Incorrect ordinary result:
  // F ≈ 1.36, p ≈ 0.31.
  //
  // Repeated-measures result:
  // F = 24, df = 2 and 6, p ≈ 0.00137.
  //
  // All statistical calculations retain full precision.
  // Rounded values are used only for display.
  //
  // The classical repeated-measures F test assumes independent
  // subjects, appropriate normality of within-subject contrasts
  // and sphericity. Violations of sphericity may require an
  // adjustment to the degrees of freedom or another model.
  //
  // The significant omnibus result establishes evidence that
  // the setting means are not all equal. It does not establish
  // significance for every individual pair of settings.
  //
  // With two conditions, F = t² corresponds to the two-sided
  // paired t-test under the same model assumptions.
  //
  // The test-order schedules and wear illustrations are
  // hypothetical teaching choices. They are not additional
  // experimental data or a claim of perfect counterbalancing.
  //
  // Uses the supplied engine interface and reference style,
  // with separate phone and laptop layout constants.
  //
  // Browser rendering and narration synchronization have
  // not been runtime-tested against the actual engine.
  // ------------------------------------------------------------
}

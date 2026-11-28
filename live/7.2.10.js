// lesson 7.2.10
// Two-way ANOVA: split variation into pieces for two factors,
// interaction and noise, then test each factor using an F ratio.
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
  // Eight fresh batteries.
  // Two batches × two operating modes.
  // Two independent batteries per cell.
  //
  //              Light       Heavy       Batch mean
  // Batch A      19, 21      11, 13      16
  // Batch B      22, 24      14, 16      19
  //
  // Cell means:
  // A light = 20.
  // A heavy = 12.
  // B light = 23.
  // B heavy = 15.
  //
  // Mode means:
  // Light = 21.5.
  // Heavy = 13.5.
  //
  // Grand mean = 17.5.
  //
  // Batch effect = 3 hours.
  // Mode effect = 8 hours.
  //
  // Batch SS = 18, df = 1, MS = 18.
  // Mode SS = 128, df = 1, MS = 128.
  // Interaction SS = 0, df = 1.
  // Within SS = 8, df = 4, MS = 2.
  //
  // Total SS = 154, df = 7.
  //
  // F batch = 18 / 2 = 9.
  // F mode = 128 / 2 = 64.
  //
  // Both use F(1,4).
  // Batch p ≈ 0.03994.
  // Mode p ≈ 0.00132.
  // ------------------------------------------------------------

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const PINK = C.pink || '#f472b6';
  const VIOLET = C.violet;
  const GREEN = C.green;

  const BATCH_COLOR = VIOLET;
  const MODE_COLOR = PINK;
  const ERROR_COLOR = GREEN;
  const INTERACTION_COLOR = GOLD;

  const batches = [
    { name: 'A', color: BLUE },
    { name: 'B', color: GOLD }
  ];

  const modes = [
    { name: 'Light', description: 'Calls and messages' },
    { name: 'Heavy', description: 'Watching video' }
  ];

  const data = [
    [
      [19, 21],
      [11, 13]
    ],
    [
      [22, 24],
      [14, 16]
    ]
  ];

  const sum = values =>
    values.reduce((s, v) => s + v, 0);

  const mean = values =>
    sum(values) / values.length;

  const NB = batches.length;
  const NM = modes.length;
  const R = data[0][0].length;

  const ALL = data.flat(2);
  const N = ALL.length;

  const CELL_MEANS = data.map(row =>
    row.map(values => mean(values))
  );

  const BATCH_MEANS = data.map(row =>
    mean(row.flat())
  );

  const MODE_MEANS = modes.map((_, j) =>
    mean(data.flatMap(row => row[j]))
  );

  const GRAND = mean(ALL);

  const SS_TOTAL = sum(
    ALL.map(v => (v - GRAND) ** 2)
  );

  const SS_BATCH = NM * R * sum(
    BATCH_MEANS.map(v => (v - GRAND) ** 2)
  );

  const SS_MODE = NB * R * sum(
    MODE_MEANS.map(v => (v - GRAND) ** 2)
  );

  const SS_INTERACTION = R * sum(
    CELL_MEANS.flatMap((row, i) =>
      row.map((v, j) =>
        (
          v -
          BATCH_MEANS[i] -
          MODE_MEANS[j] +
          GRAND
        ) ** 2
      )
    )
  );

  const SS_ERROR = sum(
    data.flatMap((row, i) =>
      row.flatMap((values, j) =>
        values.map(v =>
          (v - CELL_MEANS[i][j]) ** 2
        )
      )
    )
  );

  const DF_BATCH = NB - 1;
  const DF_MODE = NM - 1;

  const DF_INTERACTION =
    (NB - 1) * (NM - 1);

  const DF_ERROR =
    N - NB * NM;

  const DF_TOTAL = N - 1;

  const MS_BATCH =
    SS_BATCH / DF_BATCH;

  const MS_MODE =
    SS_MODE / DF_MODE;

  const MS_INTERACTION =
    SS_INTERACTION / DF_INTERACTION;

  const MSE =
    SS_ERROR / DF_ERROR;

  const F_BATCH =
    MS_BATCH / MSE;

  const F_MODE =
    MS_MODE / MSE;

  // For F(1,4), use the equivalent two-sided t(4) tail.
  // With z = sqrt(F / (F + 4)):
  // survival probability = (1-z)^2 × (z+2) / 2.

  function f14Survival(f) {
    const z = Math.sqrt(f / (f + 4));

    return 0.5 * (1 - z) ** 2 * (z + 2);
  }

  const P_BATCH = f14Survival(F_BATCH);
  const P_MODE = f14Survival(F_MODE);

  const F_CRIT = 7.708647;

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Content between y = -3.0 and 2.3.
  //
  // Formula box above the picture on phone,
  // to the right of the picture on laptop.
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
  // Based on the approved arithmetic-mean reference lesson.
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

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const maxw = P ? FW - 1.2 : 4.0;

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

    const left = pos[0] - wd / 2 + 0.35;
    const top = pos[1] + ht / 2 - 0.2 - lh / 2;

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
    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const animations = [
      new M.FadeOut(boxNow)
    ];

    boxNow = null;

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
    const t = T(String(s), size, color, mono);

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
    const t = pill(s, color, size);

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
    const a = Math.atan2(y2 - y1, x2 - x1);

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
      line(x, y1, x, y2, color, 3),

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

  function checkMark(x, y, color = GREEN) {
    return new M.VGroup(
      line(
        x - 0.14, y,
        x - 0.03, y - 0.12,
        color, 3
      ),

      line(
        x - 0.03, y - 0.12,
        x + 0.22, y + 0.17,
        color, 3
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

  // Track top-level objects only.
  // Never regroup objects already visible on screen.

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

  function staggerAdd(
    objects,
    runTime = 1.5,
    lagRatio = 0.16
  ) {
    picture.push(...objects);

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      {
        lagRatio,
        runTime
      }
    );
  }

  // ------------------------------------------------------------
  // BATTERY AND PHONE ICONS
  // ------------------------------------------------------------

  function batteryIcon(
    x, y,
    color = BLUE,
    width = 0.54,
    height = 0.90,
    amount = 0.86
  ) {
    const shell = outline(
      x, y,
      width, height,
      color, 0.055
    );

    const cap = rect(
      x,
      y + height / 2 + 0.055,
      width * 0.36,
      0.11,
      color, 1
    );

    const innerHeight =
      (height - 0.17) * amount;

    const fill = rect(
      x,
      y - height / 2 + 0.085 + innerHeight / 2,
      width - 0.14,
      innerHeight,
      color, 0.82, 0
    );

    return new M.VGroup(
      shell,
      cap,
      fill
    );
  }

  function phoneShell(x, y, color = C.ink) {
    return new M.VGroup(
      outline(
        x, y,
        1.10, 1.78,
        color, 0.055
      ),

      outline(
        x,
        y + 0.04,
        0.88, 1.38,
        color, 0.025
      ),

      line(
        x - 0.17,
        y - 0.78,
        x + 0.17,
        y - 0.78,
        C.muted, 2
      )
    );
  }

  function messageBubble(
    x, y,
    color,
    width = 0.55
  ) {
    return new M.VGroup(
      outline(
        x, y,
        width, 0.27,
        color, 0.24
      ),

      line(
        x - width * 0.30,
        y,
        x + width * 0.25,
        y,
        color, 1.5
      )
    );
  }

  function lightPhone(x, y) {
    return new M.VGroup(
      phoneShell(x, y, BLUE),

      messageBubble(
        x - 0.10,
        y + 0.31,
        BLUE,
        0.54
      ),

      messageBubble(
        x + 0.10,
        y - 0.05,
        GREEN,
        0.54
      ),

      messageBubble(
        x - 0.09,
        y - 0.39,
        BLUE,
        0.48
      )
    );
  }

  function heavyPhone(x, y) {
    const screenY =
      y + 0.12;

    return new M.VGroup(
      phoneShell(x, y, PINK),

      rect(
        x, screenY,
        0.76, 0.66,
        PINK, 0.22
      ),

      line(
        x - 0.12, screenY - 0.17,
        x - 0.12, screenY + 0.17,
        PINK, 3
      ),

      line(
        x - 0.12, screenY + 0.17,
        x + 0.19, screenY,
        PINK, 3
      ),

      line(
        x + 0.19, screenY,
        x - 0.12, screenY - 0.17,
        PINK, 3
      ),

      line(
        x - 0.32,
        y - 0.38,
        x + 0.32,
        y - 0.38,
        C.muted, 2
      ),

      line(
        x - 0.32,
        y - 0.38,
        x + 0.01,
        y - 0.38,
        PINK, 3
      ),

      dot(
        x + 0.01,
        y - 0.38,
        PINK, 0.045
      )
    );
  }

  // ------------------------------------------------------------
  // 0: BATTERY LIFE DEPENDS ON MORE THAN BATCH
  //
  // Start with two sources of variation, not formulas.
  // ------------------------------------------------------------

  const INTRO_Y = Y(-0.30);

  const introBatch = new M.VGroup(
    outline(
      CX - 1.65,
      INTRO_Y + 0.22,
      2.75, 2.78,
      BATCH_COLOR, 0.055
    ),

    txt(
      'FACTORY BATCH',
      CX - 1.65,
      INTRO_Y + 1.3,
      BATCH_COLOR, 17
    ),

    batteryIcon(
      CX - 2.16,
      INTRO_Y - 0.06,
      BLUE
    ),

    batteryIcon(
      CX - 1.14,
      INTRO_Y - 0.06,
      GOLD
    ),

    txt(
      'A',
      CX - 2.16,
      INTRO_Y - 0.85,
      BLUE, 17, true
    ),

    txt(
      'B',
      CX - 1.14,
      INTRO_Y - 0.85,
      GOLD, 17, true
    )
  );

  const introUse = new M.VGroup(
    outline(
      CX + 1.65,
      INTRO_Y + 0.22,
      2.75, 2.78,
      MODE_COLOR, 0.055
    ),

    txt(
      'PHONE USE',
      CX + 1.65,
      INTRO_Y + 1.3,
      MODE_COLOR, 17
    ),

    lightPhone(
      CX + 1.03,
      INTRO_Y - 0.13
    ),

    heavyPhone(
      CX + 2.27,
      INTRO_Y - 0.13
    )
  );

  const introLife = tag(
    'BOTH CAN AFFECT BATTERY LIFE',
    CX,
    Y(-2.25),
    GREEN, 17
  );

  await until(S(0));
  await play(
    ...add(
      introBatch,
      introUse,
      introLife
    ),

    ...(P ? fbox([
      'battery life depends on',
      ['the batch', BATCH_COLOR],
      ['how the phone is used', MODE_COLOR]
    ]) : []),

    ...say('BATTERY LIFE HAS MORE THAN ONE CAUSE')
  );

  // ------------------------------------------------------------
  // 1: LIGHT USE VERSUS HEAVY USE
  //
  // Light: calls and messages.
  // Heavy: watching video.
  // ------------------------------------------------------------

  const PHONE_Y = Y(-0.12);

  const lightUsePicture = new M.VGroup(
    lightPhone(
      CX - 1.60,
      PHONE_Y
    ),

    tag(
      'LIGHT USE',
      CX - 1.60,
      PHONE_Y + 1.26,
      BLUE, 18
    ),

    txt(
      'calls and messages',
      CX - 1.60,
      PHONE_Y - 1.23,
      C.ink, 16,
      false, 2.80
    )
  );

  const heavyUsePicture = new M.VGroup(
    heavyPhone(
      CX + 1.60,
      PHONE_Y
    ),

    tag(
      'HEAVY USE',
      CX + 1.60,
      PHONE_Y + 1.26,
      PINK, 18
    ),

    txt(
      'watching video',
      CX + 1.60,
      PHONE_Y - 1.23,
      C.ink, 16,
      false, 2.80
    )
  );

  await until(S(1));
  await play(
    ...replace(
      lightUsePicture,
      heavyUsePicture
    ),

    ...fbox([
      ['light use: calls, messages', BLUE],
      ['heavy use: video', PINK]
    ]),

    ...say('TWO OPERATING MODES')
  );

  // ------------------------------------------------------------
  // 2: EIGHT FRESH BATTERIES
  //
  // Four from A and four from B.
  // These are new batteries, not repeated measurements
  // of the earlier chapter's batteries.
  // ------------------------------------------------------------

  const FRESH_Y = Y(-0.35);

  function freshBatch(i) {
    const b = batches[i];

    const x =
      CX + (i === 0 ? -1.63 : 1.63);

    const parts = [
      outline(
        x,
        FRESH_Y,
        2.85, 2.13,
        b.color, 0.055
      ),

      tag(
        `BATCH ${b.name}`,
        x,
        FRESH_Y + 0.77,
        b.color, 17
      )
    ];

    for (let k = 0; k < 4; k++) {
      parts.push(
        batteryIcon(
          x + (k - 1.5) * 0.57,
          FRESH_Y - 0.11,
          b.color,
          0.43, 0.86
        )
      );
    }

    parts.push(
      txt(
        '4 fresh batteries',
        x,
        FRESH_Y - 0.79,
        b.color, 15
      )
    );

    return new M.VGroup(...parts);
  }

  const freshA = freshBatch(0);
  const freshB = freshBatch(1);

  const freshTotal = tag(
    '4 + 4 = 8 FRESH BATTERIES',
    CX,
    Y(-2.16),
    GREEN, 19
  );

  await until(S(2));
  await play(
    ...replace(
      freshA,
      freshB,
      freshTotal
    ),

    ...fbox([
      ['batch A: 4 fresh batteries', BLUE],
      ['batch B: 4 fresh batteries', GOLD],
      '8 independent observations'
    ]),

    ...say('A NEW TEST WITH EIGHT FRESH BATTERIES')
  );

  // ------------------------------------------------------------
  // TWO-BY-TWO DESIGN TABLE
  //
  // Rows: batches A and B.
  // Columns: light and heavy use.
  // Each cell contains two separate batteries.
  // ------------------------------------------------------------

  const CELL_W = P ? 2.33 : 2.27;
  const CELL_H = P ? 1.57 : 1.30;

  const CELL_X = [
    CX - 0.93,
    CX + 1.58
  ];

  const CELL_Y = [
    Y(0.38),
    Y(-1.25)
  ];

  function designHeaders() {
    return [
      txt(
        'LIGHT USE',
        CELL_X[0],
        CELL_Y[0] + CELL_H / 2 + 0.39,
        MODE_COLOR, 17
      ),

      txt(
        'HEAVY USE',
        CELL_X[1],
        CELL_Y[0] + CELL_H / 2 + 0.39,
        MODE_COLOR, 17
      ),

      tag(
        'A',
        CX - 2.75,
        CELL_Y[0],
        BLUE, 19
      ),

      tag(
        'B',
        CX - 2.75,
        CELL_Y[1],
        GOLD, 19
      )
    ];
  }

  function emptyCell(i, j, icons = true) {
    const x = CELL_X[j];
    const y = CELL_Y[i];

    const color =
      batches[i].color;

    const parts = [
      outline(
        x, y,
        CELL_W,
        CELL_H,
        color, 0.045
      )
    ];

    if (icons) {
      parts.push(
        batteryIcon(
          x - 0.44,
          y + 0.04,
          color,
          0.43, 0.69
        ),

        batteryIcon(
          x + 0.44,
          y + 0.04,
          color,
          0.43, 0.69
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function measuredCell(
    i, j,
    showMean = true
  ) {
    const x = CELL_X[j];
    const y = CELL_Y[i];

    const values = data[i][j];
    const m = CELL_MEANS[i][j];

    const color =
      batches[i].color;

    const parts = [
      outline(
        x, y,
        CELL_W,
        CELL_H,
        color, 0.055
      )
    ];

    // Common height scale in all four cells.
    // Battery bars are proportional to measured hours.

    const base =
      y - 0.37;

    const scale =
      P ? 0.036 : 0.030;

    values.forEach((v, k) => {
      const xx =
        x + (k - 0.5) * 0.67;

      const h = v * scale;

      parts.push(
        rect(
          xx,
          base + h / 2,
          0.37,
          h,
          color, 0.85
        ),

        txt(
          String(v),
          xx,
          base + h + 0.14,
          color, 15, true,
          0.60
        )
      );
    });

    parts.push(
      line(
        x - 0.83,
        base,
        x + 0.83,
        base,
        C.muted, 1.5
      )
    );

    if (showMean) {
      parts.push(
        txt(
          `mean ${m}`,
          x,
          y - CELL_H / 2 + 0.16,
          color, 15, true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fullDesign() {
    return [
      ...designHeaders(),

      measuredCell(0, 0),
      measuredCell(0, 1),
      measuredCell(1, 0),
      measuredCell(1, 1)
    ];
  }

  // ------------------------------------------------------------
  // 3: SPLIT EACH BATCH BETWEEN LIGHT AND HEAVY USE
  // ------------------------------------------------------------

  const designHead =
    designHeaders();

  const liveCells = [
    [
      emptyCell(0, 0),
      emptyCell(0, 1)
    ],
    [
      emptyCell(1, 0),
      emptyCell(1, 1)
    ]
  ];

  const splitNote = tag(
    'TWO BATTERIES IN EVERY CELL',
    CX,
    Y(-2.48),
    GREEN, 17
  );

  await until(S(3));
  await play(
    ...replace(
      ...designHead,
      ...liveCells.flat(),
      splitNote
    ),

    ...fbox([
      'split each batch',
      '2 batteries in light use',
      '2 batteries in heavy use'
    ]),

    ...say('SPLIT EACH BATCH BETWEEN THE TWO MODES')
  );

  // ------------------------------------------------------------
  // 4: TWO BATCHES × TWO MODES = FOUR CELLS
  // ------------------------------------------------------------

  const designFocus = outline(
    (CELL_X[0] + CELL_X[1]) / 2,
    (CELL_Y[0] + CELL_Y[1]) / 2,
    CELL_X[1] - CELL_X[0] + CELL_W + 0.17,
    CELL_Y[0] - CELL_Y[1] + CELL_H + 0.15,
    VIOLET,
    0
  );

  await until(S(4));
  await play(
    ...add(designFocus),

    ...fbox([
      '2 batches × 2 modes',
      '= 4 cells',
      ['4 cells × 2 = 8 batteries', GREEN]
    ], VIOLET),

    ...say('A TWO-BY-TWO DESIGN', VIOLET)
  );

  function revealCell(i, j) {
    const old = liveCells[i][j];
    const next = measuredCell(i, j);

    liveCells[i][j] = next;

    return [
      ...remove(old),
      ...add(next)
    ];
  }

  // ------------------------------------------------------------
  // 5: A LIGHT — 19, 21; MEAN 20
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    ...remove(designFocus),

    ...revealCell(0, 0),

    ...fbox([
      ['batch A, light use', BLUE],
      '19 and 21 hours',
      ['mean = 20', BLUE]
    ], BLUE),

    ...say('A LIGHT: MEAN 20 HOURS', BLUE)
  );

  // ------------------------------------------------------------
  // 6: A HEAVY — 11, 13; MEAN 12
  // ------------------------------------------------------------

  await until(S(6));
  await play(
    ...revealCell(0, 1),

    ...fbox([
      ['batch A, heavy use', BLUE],
      '11 and 13 hours',
      ['mean = 12', BLUE]
    ], BLUE),

    ...say('A HEAVY: MEAN 12 HOURS', BLUE)
  );

  // ------------------------------------------------------------
  // 7: B LIGHT — 22, 24; MEAN 23
  // ------------------------------------------------------------

  await until(S(7));
  await play(
    ...revealCell(1, 0),

    ...fbox([
      ['batch B, light use', GOLD],
      '22 and 24 hours',
      ['mean = 23', GOLD]
    ], GOLD),

    ...say('B LIGHT: MEAN 23 HOURS', GOLD)
  );

  // ------------------------------------------------------------
  // 8: B HEAVY — 14, 16; MEAN 15
  // ------------------------------------------------------------

  await until(S(8));
  await play(
    ...revealCell(1, 1),

    ...fbox([
      ['batch B, heavy use', GOLD],
      '14 and 16 hours',
      ['mean = 15', GOLD]
    ], GOLD),

    ...say('B HEAVY: MEAN 15 HOURS', GOLD)
  );

  // ------------------------------------------------------------
  // INTERACTION PLOT
  //
  // Horizontal axis: operating mode.
  // Vertical axis: battery life in hours.
  //
  // Blue line = batch A cell means.
  // Amber line = batch B cell means.
  //
  // The lines connect means of independent cells.
  // They do not link repeated measurements of individual batteries.
  // ------------------------------------------------------------

  const HMIN = 8;
  const HMAX = 26;

  const PY0 = Y(-2.08);
  const PY1 = Y(1.23);

  const AXIS_X =
    CX - 2.81;

  const MODE_X = [
    CX - 1.40,
    CX + 1.46
  ];

  const py = v =>
    PY0 +
    (v - HMIN) / (HMAX - HMIN) *
    (PY1 - PY0);

  function interactionAxes() {
    const parts = [
      line(
        AXIS_X, PY0,
        AXIS_X, PY1,
        C.muted, 2
      ),

      line(
        AXIS_X, PY0,
        CX + 2.96, PY0,
        C.muted, 2.3
      )
    ];

    for (let v = HMIN; v <= HMAX; v += 2) {
      parts.push(
        txt(
          String(v),
          AXIS_X - 0.28,
          py(v),
          C.muted, 14, true,
          0.45
        ),

        line(
          AXIS_X + 0.07,
          py(v),
          CX + 2.96,
          py(v),
          C.muted, 0.65
        )
      );
    }

    parts.push(
      txt(
        'hours',
        AXIS_X + 0.28,
        PY1 + 0.22,
        C.muted, 14
      ),

      tag(
        'LIGHT',
        MODE_X[0],
        PY0 - 0.38,
        BLUE, 16
      ),

      tag(
        'HEAVY',
        MODE_X[1],
        PY0 - 0.38,
        PINK, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function meanSeries(
    i,
    values = CELL_MEANS[i],
    showValues = true
  ) {
    const color = batches[i].color;

    const parts = [
      line(
        MODE_X[0],
        py(values[0]),
        MODE_X[1],
        py(values[1]),
        color, 4
      )
    ];

    values.forEach((v, j) => {
      parts.push(
        dot(
          MODE_X[j],
          py(v),
          color, 0.14
        )
      );

      if (showValues) {
        parts.push(
          txt(
            String(v),
            MODE_X[j] +
              (j === 0 ? -0.38 : 0.39),
            py(v),
            color, 17, true,
            0.63
          )
        );
      }
    });

    parts.push(
      tag(
        `BATCH ${batches[i].name}`,
        CX + 0.10,
        (
          py(values[0]) +
          py(values[1])
        ) / 2 +
          (i === 0 ? -0.29 : 0.31),
        color,
        15,
        1.75
      )
    );

    return new M.VGroup(...parts);
  }

  function interactionPlot(
    values = CELL_MEANS
  ) {
    return [
      interactionAxes(),
      meanSeries(0, values[0]),
      meanSeries(1, values[1])
    ];
  }

  // ------------------------------------------------------------
  // 9: DRAW THE TWO MEAN LINES
  // ------------------------------------------------------------

  const mainAxes =
    interactionAxes();

  const mainSeriesA =
    meanSeries(0);

  const mainSeriesB =
    meanSeries(1);

  await until(S(9));
  await play(
    ...replace(
      mainAxes,
      mainSeriesA,
      mainSeriesB
    ),

    ...fbox([
      'horizontal: operating mode',
      'vertical: battery life',
      'one mean line per batch'
    ]),

    ...say('DRAW ONE LINE PER BATCH')
  );

  // ------------------------------------------------------------
  // 10: BATCH B IS THREE HOURS ABOVE A IN BOTH MODES
  // ------------------------------------------------------------

  function batchGapGuide(j) {
    const x =
      MODE_X[j] + (j === 0 ? -0.85 : 0.85);

    const a = CELL_MEANS[0][j];
    const b = CELL_MEANS[1][j];

    return new M.VGroup(
      vBracket(
        x,
        py(a),
        py(b),
        BATCH_COLOR,
        0.10
      ),

      txt(
        '3 h',
        x + (j === 0 ? -0.35 : 0.35),
        (py(a) + py(b)) / 2,
        BATCH_COLOR,
        17, true,
        0.66
      )
    );
  }

  const batchGapLight =
    batchGapGuide(0);

  const batchGapHeavy =
    batchGapGuide(1);

  await until(S(10));
  await play(
    ...add(
      batchGapLight,
      batchGapHeavy
    ),

    ...fbox([
      'batch B − batch A',
      'light: 23 − 20 = 3',
      ['heavy: 15 − 12 = 3', BATCH_COLOR]
    ], BATCH_COLOR),

    ...say('B IS THREE HOURS ABOVE A IN BOTH MODES', BATCH_COLOR)
  );

  // ------------------------------------------------------------
  // 11: BOTH BATCHES LOSE EIGHT HOURS UNDER HEAVY USE
  // ------------------------------------------------------------

  function modeDropGuide(i) {
    const start = CELL_MEANS[i][0];
    const end = CELL_MEANS[i][1];

    const offset =
      i === 0 ? -0.42 : 0.42;

    return new M.VGroup(
      arrow(
        MODE_X[0] + 0.20,
        py(start) + offset,
        MODE_X[1] - 0.20,
        py(end) + offset,
        MODE_COLOR,
        0.13,
        2.7
      ),

      txt(
        '−8 h',
        CX + 0.10,
        (
          py(start) +
          py(end)
        ) / 2 + offset +
          (i === 0 ? -0.30 : 0.30),
        MODE_COLOR,
        19, true
      )
    );
  }

  const modeDropA =
    modeDropGuide(0);

  const modeDropB =
    modeDropGuide(1);

  await until(S(11));
  await play(
    ...remove(
      batchGapLight,
      batchGapHeavy
    ),

    ...add(
      modeDropA,
      modeDropB
    ),

    ...fbox([
      'heavy minus light',
      'A: 12 − 20 = −8',
      ['B: 15 − 23 = −8', MODE_COLOR]
    ], MODE_COLOR),

    ...say('BOTH LINES DROP BY EIGHT HOURS', MODE_COLOR)
  );

  // ------------------------------------------------------------
  // 12: EACH GROUPING IS CALLED A FACTOR
  //
  // Factor 1 = factory batch, levels A and B.
  // Factor 2 = operating mode, levels light and heavy.
  // ------------------------------------------------------------

  const FACTOR_Y = Y(-0.35);

  function factorCard(
    x,
    color,
    title,
    levels,
    colors
  ) {
    const parts = [
      outline(
        x,
        FACTOR_Y,
        2.83, 2.18,
        color, 0.055
      ),

      txt(
        title,
        x,
        FACTOR_Y + 0.77,
        color, 18,
        false, 2.63
      ),

      line(
        x - 1.12,
        FACTOR_Y + 0.46,
        x + 1.12,
        FACTOR_Y + 0.46,
        color, 1.5
      )
    ];

    levels.forEach((s, k) => {
      const yy =
        FACTOR_Y + 0.08 - k * 0.57;

      parts.push(
        outline(
          x, yy,
          2.06, 0.43,
          colors[k], 0.07
        ),

        txt(
          s,
          x, yy,
          colors[k], 18
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const batchFactor = factorCard(
    CX - 1.61,
    BATCH_COLOR,
    'FACTOR 1: BATCH',
    ['A', 'B'],
    [BLUE, GOLD]
  );

  const modeFactor = factorCard(
    CX + 1.61,
    MODE_COLOR,
    'FACTOR 2: MODE',
    ['Light', 'Heavy'],
    [BLUE, PINK]
  );

  const factorNote = tag(
    'TWO FACTORS, TWO LEVELS EACH',
    CX,
    Y(-2.18),
    GREEN, 17
  );

  await until(S(12));
  await play(
    ...replace(
      batchFactor,
      modeFactor,
      factorNote
    ),

    ...fbox([
      ['factor 1: factory batch', BATCH_COLOR],
      ['factor 2: operating mode', MODE_COLOR],
      'factor = a grouping variable'
    ]),

    ...say('TWO GROUPING VARIABLES: TWO FACTORS')
  );

  // ------------------------------------------------------------
  // 13: TWO QUESTIONS IN ONE TEST
  // ------------------------------------------------------------

  const QUESTION_Y = Y(-0.35);

  function factorQuestion(
    x,
    color,
    title,
    question
  ) {
    return new M.VGroup(
      outline(
        x,
        QUESTION_Y,
        2.79, 1.98,
        color, 0.075
      ),

      txt(
        title,
        x,
        QUESTION_Y + 0.62,
        color, 17
      ),

      txt(
        '?',
        x,
        QUESTION_Y + 0.03,
        color, 40
      ),

      txt(
        question,
        x,
        QUESTION_Y - 0.63,
        C.ink, 17,
        false, 2.57
      )
    );
  }

  const batchQuestion = factorQuestion(
    CX - 1.62,
    BATCH_COLOR,
    'BATCH EFFECT',
    'Does batch matter?'
  );

  const modeQuestion = factorQuestion(
    CX + 1.62,
    MODE_COLOR,
    'MODE EFFECT',
    'Does mode matter?'
  );

  const oneDesign = tag(
    'TWO QUESTIONS, ONE DESIGN',
    CX,
    Y(-2.15),
    GREEN, 19
  );

  await until(S(13));
  await play(
    ...replace(
      batchQuestion,
      modeQuestion,
      oneDesign
    ),

    ...fbox([
      'batch effect?',
      'mode effect?',
      ['same 8 batteries', GREEN]
    ], GREEN),

    ...say('DOES BATCH MATTER? DOES MODE MATTER?')
  );

  // ------------------------------------------------------------
  // 14: SPLIT THE TOTAL VARIATION INTO PIECES
  //
  // Begin with a conceptual decomposition.
  // Exact sizes are introduced only after the calculations.
  // ------------------------------------------------------------

  const SPLIT_TOP = Y(0.96);
  const SPLIT_BOTTOM = Y(-1.47);

  const totalVariationCard = new M.VGroup(
    outline(
      CX,
      SPLIT_TOP,
      4.80, 0.91,
      C.ink, 0.055
    ),

    txt(
      'ALL BATTERY-LIFE VARIATION',
      CX,
      SPLIT_TOP,
      C.ink, 18,
      false, 4.54
    )
  );

  const splitCategories = [
    {
      name: 'BATCH',
      color: BATCH_COLOR
    },
    {
      name: 'MODE',
      color: MODE_COLOR
    },
    {
      name: 'LEFTOVER',
      color: ERROR_COLOR
    }
  ];

  function splitCard(k) {
    const item = splitCategories[k];

    const x =
      CX + (k - 1) * 2.03;

    return new M.VGroup(
      outline(
        x,
        SPLIT_BOTTOM,
        1.79, 1.18,
        item.color, 0.08
      ),

      txt(
        item.name,
        x,
        SPLIT_BOTTOM + 0.30,
        item.color, 16,
        false, 1.62
      ),

      txt(
        '?',
        x,
        SPLIT_BOTTOM - 0.22,
        item.color, 25
      )
    );
  }

  const splitCards =
    splitCategories.map((_, k) =>
      splitCard(k)
    );

  const splitArrows =
    splitCategories.map((item, k) =>
      arrow(
        CX + (k - 1) * 0.70,
        SPLIT_TOP - 0.52,
        CX + (k - 1) * 2.03,
        SPLIT_BOTTOM + 0.67,
        item.color,
        0.12
      )
    );

  await until(S(14));
  await play(
    ...replace(
      totalVariationCard,
      ...splitArrows,
      ...splitCards
    ),

    ...fbox([
      'split total variation',
      ['batch piece', BATCH_COLOR],
      ['mode piece', MODE_COLOR],
      ['leftover noise', ERROR_COLOR]
    ], VIOLET),

    ...say('SEPARATE THE VARIATION INTO PIECES', VIOLET)
  );

  // ------------------------------------------------------------
  // ALL EIGHT OBSERVATIONS ON ONE HOURS LINE
  //
  // This plot is reused for the grand mean and the
  // marginal-mean calculations.
  // ------------------------------------------------------------

  const ALL_MIN = 9;
  const ALL_MAX = 25;

  const ALL_W = P ? 6.0 : 6.1;

  const ALL_Y = Y(-1.04);

  const ax = v =>
    CX - ALL_W / 2 +
    (v - ALL_MIN) / (ALL_MAX - ALL_MIN) *
    ALL_W;

  function allHoursAxis(y = ALL_Y) {
    const parts = [
      line(
        ax(ALL_MIN), y,
        ax(ALL_MAX), y,
        C.muted, 2.6
      )
    ];

    for (let v = ALL_MIN; v <= ALL_MAX; v++) {
      parts.push(
        line(
          ax(v), y - 0.065,
          ax(v), y + 0.065,
          C.muted,
          v % 2 === 0 ? 1.4 : 0.7
        )
      );

      if (v % 2 === 0) {
        parts.push(
          txt(
            String(v),
            ax(v),
            y - 0.28,
            C.muted, 14, true,
            0.47
          )
        );
      }
    }

    parts.push(
      txt(
        'battery life in hours',
        CX,
        y - 0.70,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function allBatteryDots(y = ALL_Y) {
    return data.flatMap((row, i) =>
      row.flatMap(values =>
        values.map(v =>
          dot(
            ax(v),
            y + 0.27,
            batches[i].color,
            0.11
          )
        )
      )
    );
  }

  function grandMarker(y = ALL_Y) {
    return new M.VGroup(
      dashed(
        ax(GRAND),
        y - 0.06,
        ax(GRAND),
        y + 1.22,
        VIOLET
      ),

      dot(
        ax(GRAND),
        y,
        VIOLET,
        0.13
      ),

      tag(
        'GRAND MEAN 17.5',
        ax(GRAND),
        y + 1.50,
        VIOLET,
        17
      )
    );
  }

  // ------------------------------------------------------------
  // 15: STEP ONE — GRAND MEAN = 17.5
  //
  // All eight observations total 140 hours.
  // 140 / 8 = 17.5.
  // ------------------------------------------------------------

  await until(S(15));
  await play(
    ...replace(
      allHoursAxis(),
      ...allBatteryDots(),
      grandMarker()
    ),

    ...fbox([
      'step 1: grand mean',
      'all 8 readings total 140',
      ['140 ÷ 8 = 17.5 hours', VIOLET]
    ], VIOLET),

    ...say('STEP 1: GRAND MEAN = 17.5 HOURS', VIOLET)
  );

  // ------------------------------------------------------------
  // MARGINAL MEAN PICTURES
  //
  // Batch means combine both modes.
  // Mode means combine both batches.
  //
  // Each marginal mean represents four observations.
  // ------------------------------------------------------------

  const MARGINAL_Y = Y(-0.70);

  function marginalPicture(kind) {
    const isBatch =
      kind === 'batch';

    const values = isBatch
      ? BATCH_MEANS
      : MODE_MEANS;

    const colors = isBatch
      ? [BLUE, GOLD]
      : [MODE_COLOR, MODE_COLOR];

    const labels = isBatch
      ? ['A', 'B']
      : ['LIGHT', 'HEAVY'];

    const effectColor = isBatch
      ? BATCH_COLOR
      : MODE_COLOR;

    const parts = [
      allHoursAxis(MARGINAL_Y),

      dashed(
        ax(GRAND),
        MARGINAL_Y - 0.08,
        ax(GRAND),
        MARGINAL_Y + 1.30,
        VIOLET
      ),

      tag(
        '17.5',
        ax(GRAND),
        MARGINAL_Y + 1.59,
        VIOLET, 16
      )
    ];

    values.forEach((v, k) => {
      const xx = ax(v);

      parts.push(
        dot(
          xx,
          MARGINAL_Y,
          colors[k],
          0.16
        ),

        tag(
          `${labels[k]}: ${v}`,
          xx,
          MARGINAL_Y + 0.56,
          colors[k],
          16,
          1.75
        ),

        arrow(
          ax(GRAND),
          MARGINAL_Y + 0.99,
          xx,
          MARGINAL_Y + 0.99,
          effectColor,
          0.10
        ),

        txt(
          signed(v - GRAND),
          (ax(GRAND) + xx) / 2,
          MARGINAL_Y + 1.26,
          effectColor,
          17, true,
          0.92
        )
      );
    });

    parts.push(
      tag(
        'EACH MEAN REPRESENTS FOUR BATTERIES',
        CX,
        MARGINAL_Y - 1.15,
        effectColor,
        15
      )
    );

    return parts;
  }

  // ------------------------------------------------------------
  // 16: STEP TWO — THE BATCH PIECE
  //
  // A = (19 + 21 + 11 + 13) / 4 = 16.
  // B = (22 + 24 + 14 + 16) / 4 = 19.
  //
  // A is -1.5 from the grand mean.
  // B is +1.5 from the grand mean.
  // ------------------------------------------------------------

  await until(S(16));
  await play(
    ...replace(
      ...marginalPicture('batch')
    ),

    ...fbox([
      ['A average = 16', BLUE],
      ['B average = 19', GOLD],
      'grand mean = 17.5',
      ['distances: −1.5, +1.5', BATCH_COLOR]
    ], BATCH_COLOR),

    ...say('STEP 2: MEASURE THE BATCH EFFECT', BATCH_COLOR)
  );

  // ------------------------------------------------------------
  // SQUARED-DISTANCE CONTRIBUTIONS
  //
  // Each batch marginal deviation is ±1.5.
  // Each mode marginal deviation is ±4.
  //
  // Represent squared deviations with equal-scale squares.
  // A factor's mean stands for four batteries.
  // ------------------------------------------------------------

  function contributionTiles(kind) {
    const isBatch =
      kind === 'batch';

    const magnitude =
      isBatch ? 1.5 : 4;

    const squared =
      magnitude ** 2;

    const color =
      isBatch
        ? BATCH_COLOR
        : MODE_COLOR;

    const topY =
      Y(0.66);

    const bottomY =
      Y(-1.00);

    const unitScale =
      0.30;

    const side =
      magnitude * unitScale;

    const parts = [];

    const rows = [
      {
        title: isBatch ? 'BATCH A' : 'LIGHT USE',
        deviation: isBatch ? -1.5 : 4,
        y: topY,
        color: isBatch ? BLUE : MODE_COLOR
      },
      {
        title: isBatch ? 'BATCH B' : 'HEAVY USE',
        deviation: isBatch ? 1.5 : -4,
        y: bottomY,
        color: isBatch ? GOLD : MODE_COLOR
      }
    ];

    rows.forEach(row => {
      parts.push(
        txt(
          row.title,
          CX - 2.30,
          row.y + 0.36,
          row.color, 15,
          false, 1.57
        ),

        txt(
          `(${signed(row.deviation)})²`,
          CX - 2.30,
          row.y - 0.12,
          row.color, 18, true,
          1.58
        )
      );

      for (let k = 0; k < 4; k++) {
        const x =
          CX - 0.88 + k * 1.11;

        // A smaller square for the batch contribution,
        // a larger square for the mode contribution.
        // Areas retain the same underlying scale.

        parts.push(
          outline(
            x,
            row.y,
            1.03, 1.03,
            row.color, 0.025
          ),

          rect(
            x,
            row.y,
            Math.min(0.94, side * 0.78),
            Math.min(0.94, side * 0.78),
            row.color, 0.76
          ),

          txt(
            String(squared),
            x,
            row.y - 0.71,
            row.color,
            16, true,
            0.95
          )
        );
      }
    });

    parts.push(
      tag(
        `8 × ${squared} = ${8 * squared}`,
        CX,
        Y(-2.38),
        color,
        20
      )
    );

    return parts;
  }

  // ------------------------------------------------------------
  // 17: SQUARE 1.5 AND COUNT IT EIGHT TIMES
  //
  // 1.5² = 2.25.
  // Each of the eight batteries contributes 2.25
  // to the batch sum of squares.
  //
  // 8 × 2.25 = 18.
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...replace(
      ...contributionTiles('batch')
    ),

    ...fbox([
      '1.5² = 2.25',
      'counted for 8 batteries',
      ['8 × 2.25 = 18', BATCH_COLOR]
    ], BATCH_COLOR),

    ...say('COUNT THE SQUARED BATCH DISTANCE EIGHT TIMES', BATCH_COLOR)
  );

  // ------------------------------------------------------------
  // 18: NAME THE BATCH SUM OF SQUARES
  // ------------------------------------------------------------

  function sumSquareCard(
    title,
    value,
    color,
    detail
  ) {
    const yy =
      Y(-0.35);

    return new M.VGroup(
      outline(
        CX,
        yy,
        5.76, 2.11,
        color, 0.07
      ),

      txt(
        title,
        CX,
        yy + 0.68,
        color,
        18,
        false, 5.48
      ),

      txt(
        String(value),
        CX,
        yy - 0.02,
        color,
        40, true
      ),

      txt(
        detail,
        CX,
        yy - 0.73,
        C.muted,
        16,
        false, 5.43
      )
    );
  }

  await until(S(18));
  await play(
    ...replace(
      sumSquareCard(
        'BATCH SUM OF SQUARES',
        SS_BATCH,
        BATCH_COLOR,
        'variation explained by batch'
      )
    ),

    ...fbox([
      'batch SS',
      '= 4 × (2.25 + 2.25)',
      ['= 18 hours²', BATCH_COLOR]
    ], BATCH_COLOR),

    ...say('BATCH SUM OF SQUARES = 18', BATCH_COLOR)
  );

  // ------------------------------------------------------------
  // 19: STEP THREE — THE MODE PIECE
  //
  // Light:
  // (19 + 21 + 22 + 24) / 4 = 21.5.
  //
  // Heavy:
  // (11 + 13 + 14 + 16) / 4 = 13.5.
  //
  // Distances from grand mean:
  // Light: +4.
  // Heavy: -4.
  // ------------------------------------------------------------

  await until(S(19));
  await play(
    ...replace(
      ...marginalPicture('mode')
    ),

    ...fbox([
      ['light average = 21.5', MODE_COLOR],
      ['heavy average = 13.5', MODE_COLOR],
      'grand mean = 17.5',
      ['distances: +4, −4', MODE_COLOR]
    ], MODE_COLOR),

    ...say('STEP 3: MEASURE THE MODE EFFECT', MODE_COLOR)
  );

  // ------------------------------------------------------------
  // 20: SQUARE FOUR AND COUNT IT EIGHT TIMES
  //
  // 4² = 16.
  // 8 × 16 = 128.
  //
  // Show all eight contributions before naming their sum.
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    ...replace(
      ...contributionTiles('mode')
    ),

    ...fbox([
      '4² = 16',
      '8 batteries × 16',
      ['mode SS = 128', MODE_COLOR]
    ], MODE_COLOR),

    ...say('SQUARE FOUR, COUNT IT EIGHT TIMES', MODE_COLOR)
  );

  await until(S(20) + 4.0);
  await play(
    ...replace(
      sumSquareCard(
        'MODE SUM OF SQUARES',
        SS_MODE,
        MODE_COLOR,
        'variation explained by operating mode'
      )
    ),

    ...fbox([
      'mode SS',
      '= 4 × (16 + 16)',
      ['= 128 hours²', MODE_COLOR]
    ], MODE_COLOR),

    ...say('MODE SUM OF SQUARES = 128', MODE_COLOR)
  );

  // ------------------------------------------------------------
  // WITHIN-CELL RESIDUAL PICTURE
  //
  // Each cell has its own mean.
  // Every battery is exactly one hour from that mean.
  //
  // Use a common local residual scale.
  // The central vertical line in each card is the cell mean.
  // ------------------------------------------------------------

  function residualCell(
    i, j,
    withSquares = false
  ) {
    const x = CELL_X[j];
    const y = CELL_Y[i];

    const color =
      batches[i].color;

    const m =
      CELL_MEANS[i][j];

    const values =
      data[i][j];

    const scale = 0.62;

    const parts = [
      outline(
        x, y,
        CELL_W,
        CELL_H,
        color, 0.035
      ),

      txt(
        `cell mean ${m}`,
        x,
        y + CELL_H / 2 - 0.21,
        color,
        16, true,
        CELL_W - 0.20
      ),

      line(
        x - 0.85,
        y,
        x + 0.85,
        y,
        C.muted, 1.7
      ),

      dashed(
        x,
        y - 0.27,
        x,
        y + 0.29,
        ERROR_COLOR
      )
    ];

    values.forEach((v, k) => {
      const d = v - m;

      const xx =
        x + d * scale;

      parts.push(
        dot(
          xx,
          y,
          color,
          0.11
        ),

        txt(
          String(v),
          xx,
          y + 0.25,
          color,
          15, true
        )
      );

      if (!withSquares) {
        parts.push(
          arrow(
            x + Math.sign(d) * 0.04,
            y - 0.21,
            xx,
            y - 0.21,
            ERROR_COLOR,
            0.085
          ),

          txt(
            signed(d),
            (x + xx) / 2,
            y - 0.42,
            ERROR_COLOR,
            15, true
          )
        );
      } else {
        parts.push(
          txt(
            `${signed(d)}² = 1`,
            xx,
            y - 0.43,
            ERROR_COLOR,
            14, true,
            0.96
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  function residualDesign(
    withSquares = false
  ) {
    return [
      ...designHeaders(),

      residualCell(0, 0, withSquares),
      residualCell(0, 1, withSquares),
      residualCell(1, 0, withSquares),
      residualCell(1, 1, withSquares)
    ];
  }

  // ------------------------------------------------------------
  // 21: STEP FOUR — DISTANCES FROM OWN CELL MEANS
  //
  // Remove both systematic effects.
  // What remains is each battery's distance from the
  // mean of its own batch-and-mode cell.
  // ------------------------------------------------------------

  const residualNote = tag(
    'USE EACH BATTERY’S OWN CELL MEAN',
    CX,
    Y(-2.44),
    ERROR_COLOR,
    16
  );

  await until(S(21));
  await play(
    ...replace(
      ...residualDesign(false),
      residualNote
    ),

    ...fbox([
      'step 4: leftover variation',
      'battery − its own cell mean',
      ['not the grand mean', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('STEP 4: MEASURE THE LEFTOVER SCATTER', ERROR_COLOR)
  );

  // ------------------------------------------------------------
  // 22: EIGHT RESIDUAL SQUARES ADD TO EIGHT
  //
  // A light: (-1)² + (+1)² = 2.
  // A heavy: (-1)² + (+1)² = 2.
  // B light: (-1)² + (+1)² = 2.
  // B heavy: (-1)² + (+1)² = 2.
  //
  // Error SS = 2 + 2 + 2 + 2 = 8.
  // ------------------------------------------------------------

  function eightResidualUnits() {
    const yy =
      Y(-0.32);

    const parts = [
      txt(
        'ONE SQUARED HOUR PER BATTERY',
        CX,
        Y(1.10),
        ERROR_COLOR,
        17
      )
    ];

    for (let k = 0; k < 8; k++) {
      const x =
        CX + (k - 3.5) * 0.72;

      parts.push(
        rect(
          x,
          yy,
          0.60, 0.60,
          ERROR_COLOR, 0.83
        ),

        txt(
          '1',
          x,
          yy,
          C.ink,
          20, true
        )
      );
    }

    for (let k = 0; k < 4; k++) {
      const left =
        CX + (2 * k - 3.5) * 0.72;

      const right =
        CX + (2 * k + 1 - 3.5) * 0.72;

      const i =
        Math.floor(k / 2);

      const j =
        k % 2;

      parts.push(
        bracket(
          left - 0.28,
          right + 0.28,
          yy - 0.53,
          batches[i].color,
          0.07
        ),

        txt(
          `${batches[i].name} ${modes[j].name}`,
          (left + right) / 2,
          yy - 0.80,
          batches[i].color,
          14,
          false, 1.30
        )
      );
    }

    parts.push(
      tag(
        'LEFTOVER SS = 8',
        CX,
        Y(-2.08),
        ERROR_COLOR,
        21
      )
    );

    return parts;
  }

  await until(S(22));
  await play(
    ...replace(
      ...residualDesign(true)
    ),

    ...fbox([
      'each residual = −1 or +1',
      'each squared residual = 1',
      ['8 × 1 = 8', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('EVERY BATTERY IS ONE HOUR FROM ITS CELL MEAN', ERROR_COLOR)
  );

  await until(S(22) + 3.0);
  await play(
    ...replace(
      ...eightResidualUnits()
    ),

    ...say('EIGHT SQUARED DISTANCES ADD TO EIGHT', ERROR_COLOR)
  );

  // ------------------------------------------------------------
  // 23: FOUR LEFTOVER DEGREES OF FREEDOM
  //
  // 8 batteries - 4 fitted cell means = 4 df.
  //
  // Error mean square = 8 / 4 = 2.
  //
  // Each cell contributes one residual degree of freedom.
  // Share the eight squared-hour units into four equal shares.
  // ------------------------------------------------------------

  function residualDFPicture() {
    const parts = [];

    const top =
      Y(0.79);

    const base =
      Y(-1.43);

    for (let k = 0; k < 4; k++) {
      const i =
        Math.floor(k / 2);

      const j =
        k % 2;

      const x =
        CX + (k - 1.5) * 1.44;

      parts.push(
        txt(
          `${batches[i].name} ${modes[j].name}`,
          x,
          top + 0.45,
          batches[i].color,
          14,
          false, 1.35
        ),

        outline(
          x - 0.21,
          top,
          0.35, 0.40,
          ERROR_COLOR, 0.15
        ),

        txt(
          '1',
          x - 0.21,
          top,
          ERROR_COLOR,
          17, true
        ),

        outline(
          x + 0.21,
          top,
          0.35, 0.40,
          C.muted, 0.025
        ),

        txt(
          '×',
          x + 0.21,
          top,
          C.muted,
          17
        ),

        txt(
          '2 − 1 = 1',
          x,
          top - 0.41,
          ERROR_COLOR,
          14, true
        )
      );

      for (let r = 0; r < 2; r++) {
        parts.push(
          rect(
            x,
            base + (r + 0.5) * 0.42,
            0.63,
            0.36,
            ERROR_COLOR,
            0.85
          )
        );
      }

      parts.push(
        txt(
          '2',
          x,
          base + 1.03,
          ERROR_COLOR,
          20, true
        )
      );
    }

    parts.push(
      line(
        CX - 2.85,
        base,
        CX + 2.85,
        base,
        C.muted,
        2
      ),

      tag(
        '8 ÷ 4 = 2',
        CX,
        Y(-2.30),
        ERROR_COLOR,
        22
      )
    );

    return parts;
  }

  await until(S(23));
  await play(
    ...replace(
      ...residualDFPicture()
    ),

    ...fbox([
      'leftover df = 8 − 4 = 4',
      'leftover SS = 8',
      ['leftover MS = 8 ÷ 4 = 2', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('FOUR LEFTOVER df: SHARE EIGHT INTO FOUR', ERROR_COLOR)
  );

  // ------------------------------------------------------------
  // 24: STEP FIVE — TWO F RATIOS WITH THE SAME NOISE
  //
  // Batch df = 2 - 1 = 1.
  // Mode df = 2 - 1 = 1.
  //
  // Their mean squares equal their sums of squares.
  // Both F ratios use leftover mean square = 2.
  // ------------------------------------------------------------

  const F_NUM_Y = Y(0.55);
  const F_DEN_Y = Y(-1.18);

  function ratioCard(
    x,
    title,
    value,
    color
  ) {
    return new M.VGroup(
      outline(
        x,
        F_NUM_Y,
        2.72, 1.20,
        color, 0.07
      ),

      txt(
        title,
        x,
        F_NUM_Y + 0.34,
        color,
        16,
        false, 2.54
      ),

      txt(
        value,
        x,
        F_NUM_Y - 0.19,
        color,
        25, true
      ),

      line(
        x - 1.35,
        (F_NUM_Y + F_DEN_Y) / 2,
        x + 1.35,
        (F_NUM_Y + F_DEN_Y) / 2,
        C.ink,
        2.7
      ),

      outline(
        x,
        F_DEN_Y,
        2.72, 0.90,
        ERROR_COLOR,
        0.055
      ),

      txt(
        'LEFTOVER MS = 2',
        x,
        F_DEN_Y,
        ERROR_COLOR,
        18, true,
        2.54
      )
    );
  }

  const batchRatioCard = ratioCard(
    CX - 1.61,
    'BATCH MS',
    '18 ÷ 1 = 18',
    BATCH_COLOR
  );

  const modeRatioCard = ratioCard(
    CX + 1.61,
    'MODE MS',
    '128 ÷ 1 = 128',
    MODE_COLOR
  );

  const commonDenominatorNote = tag(
    'SAME LEFTOVER NOISE FOR BOTH',
    CX,
    Y(-2.32),
    ERROR_COLOR,
    17
  );

  await until(S(24));
  await play(
    ...replace(
      batchRatioCard,
      modeRatioCard,
      commonDenominatorNote
    ),

    ...fbox([
      'df = 1 for each factor',
      'MS = SS ÷ 1',
      ['F = MS ÷ leftover 2', ERROR_COLOR]
    ], VIOLET),

    ...say('STEP 5: EACH FACTOR GETS ITS OWN F RATIO', VIOLET)
  );

  // ------------------------------------------------------------
  // F(1,4) REFERENCE DISTRIBUTION
  //
  // Density:
  // f(x) = 3/(8 sqrt(x)) × (1 + x/4)^(-5/2).
  //
  // The density tends to infinity as x approaches zero.
  // The plotted curve begins at x = 0.04 and marks the
  // clipped upper edge rather than drawing a false zero.
  //
  // Both tests use the same F(1,4) null distribution.
  // ------------------------------------------------------------

  function fPDF(x) {
    if (x <= 0) return Infinity;

    return (
      3 / (8 * Math.sqrt(x))
    ) *
      Math.pow(
        1 + x / 4,
        -2.5
      );
  }

  const FMAX = 72;

  const FX_LEFT =
    CX - 2.94;

  const FX_RIGHT =
    CX + 2.96;

  const FY =
    Y(-1.95);

  const F_HEIGHT =
    P ? 3.15 : 2.32;

  const F_SCALE =
    P ? 2.50 : 1.75;

  const fx = v =>
    FX_LEFT +
    v / FMAX *
    (FX_RIGHT - FX_LEFT);

  const fy = v =>
    FY + Math.min(
      F_HEIGHT,
      fPDF(v) * F_SCALE
    );

  function fAxis() {
    const parts = [
      line(
        fx(0), FY,
        fx(FMAX), FY,
        C.muted, 2.5
      ),

      line(
        fx(0), FY,
        fx(0), FY + F_HEIGHT,
        C.muted, 1.5
      )
    ];

    [0, 10, 20, 30, 40, 50, 60, 70].forEach(v => {
      parts.push(
        line(
          fx(v), FY - 0.07,
          fx(v), FY + 0.07,
          C.muted, 1.3
        ),

        txt(
          String(v),
          fx(v),
          FY - 0.28,
          C.muted,
          14, true,
          0.48
        )
      );
    });

    parts.push(
      txt(
        'F ratio',
        CX,
        FY - 0.69,
        C.muted,
        16
      )
    );

    return new M.VGroup(...parts);
  }

  function fCurve() {
    const parts = [];

    // Denser sampling near zero, where the density
    // changes most rapidly.

    const samples = 180;

    const points = Array.from(
      { length: samples + 1 },
      (_, k) =>
        0.04 +
        (FMAX - 0.04) *
        (k / samples) ** 2
    );

    for (let k = 0; k < samples; k++) {
      const a = points[k];
      const b = points[k + 1];

      parts.push(
        line(
          fx(a), fy(a),
          fx(b), fy(b),
          BLUE, 2.8
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fTail(
    cutoff,
    color,
    samples = 100
  ) {
    const parts = [];

    const dx =
      (FMAX - cutoff) / samples;

    for (let k = 0; k < samples; k++) {
      const a = cutoff + k * dx;
      const b = a + dx;
      const mid = (a + b) / 2;

      const h =
        Math.max(
          0.0002,
          fPDF(mid) * F_SCALE
        );

      parts.push(
        rect(
          fx(mid),
          FY + h / 2,
          fx(b) - fx(a) + 0.001,
          h,
          color,
          0.82,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fMarker(
    value,
    label,
    color,
    height
  ) {
    return new M.VGroup(
      dashed(
        fx(value),
        FY,
        fx(value),
        FY + height,
        color
      ),

      dot(
        fx(value),
        FY,
        color,
        0.11
      ),

      tag(
        label,
        fx(value),
        FY + height + 0.27,
        color,
        17,
        1.62
      )
    );
  }

  // ------------------------------------------------------------
  // 25: BATCH F = 18 / 2 = 9, p ≈ 4%
  //
  // Show the observed ratio against the same null F curve.
  // The numerator has one degree of freedom.
  // The denominator has four.
  // ------------------------------------------------------------

  const batchResultTag = tag(
    'BATCH F = 9',
    CX - 1.61,
    Y(-2.31),
    BATCH_COLOR,
    20,
    2.75
  );

  const batchFocus = outline(
    CX - 1.61,
    (F_NUM_Y + F_DEN_Y) / 2,
    2.91,
    F_NUM_Y - F_DEN_Y + 1.30,
    BATCH_COLOR,
    0
  );

  await until(S(25));
  await play(
    ...remove(commonDenominatorNote),

    ...add(
      batchResultTag,
      batchFocus
    ),

    ...fbox([
      'batch F = 18 ÷ 2 = 9',
      'df = 1 and 4',
      [`p ≈ ${(100 * P_BATCH).toFixed(1)}%`, GREEN]
    ], BATCH_COLOR),

    ...say('BATCH: F = 9, p ABOUT FOUR PERCENT', BATCH_COLOR)
  );

  // ------------------------------------------------------------
  // 26: MODE F = 128 / 2 = 64, p ≈ 0.001
  // ------------------------------------------------------------

  const modeResultTag = tag(
    'MODE F = 64',
    CX + 1.61,
    Y(-2.31),
    MODE_COLOR,
    20,
    2.75
  );

  const modeFocus = outline(
    CX + 1.61,
    (F_NUM_Y + F_DEN_Y) / 2,
    2.91,
    F_NUM_Y - F_DEN_Y + 1.30,
    MODE_COLOR,
    0
  );

  await until(S(26));
  await play(
    ...remove(batchFocus),

    ...add(
      modeResultTag,
      modeFocus
    ),

    ...fbox([
      'mode F = 128 ÷ 2 = 64',
      'df = 1 and 4',
      [`p ≈ ${P_MODE.toFixed(4)}`, GREEN]
    ], MODE_COLOR),

    ...say('MODE: F = 64, p ABOUT ONE IN A THOUSAND', MODE_COLOR)
  );

  // ------------------------------------------------------------
  // 27: BOTH FACTORS SHOW AN EFFECT; MODE IS MUCH BIGGER
  //
  // Both tests reject their null at the individual 5% level.
  //
  // Compare actual effect magnitudes:
  // Batch difference = 3 hours.
  // Mode difference = 8 hours.
  //
  // Compare F ratios on a separate common scale.
  // ------------------------------------------------------------

  function factorEvidencePicture() {
    const left =
      CX - 2.73;

    const scale =
      0.080;

    const top =
      Y(0.50);

    const bottom =
      Y(-1.03);

    const parts = [];

    [
      {
        name: 'BATCH',
        f: F_BATCH,
        p: P_BATCH,
        effect: 3,
        color: BATCH_COLOR,
        y: top
      },
      {
        name: 'MODE',
        f: F_MODE,
        p: P_MODE,
        effect: 8,
        color: MODE_COLOR,
        y: bottom
      }
    ].forEach(row => {
      const width =
        row.f * scale;

      parts.push(
        txt(
          `${row.name}: ${row.effect} h EFFECT`,
          CX,
          row.y + 0.58,
          row.color,
          17
        ),

        rect(
          left + width / 2,
          row.y,
          width,
          0.42,
          row.color,
          0.83
        ),

        txt(
          `F = ${row.f}`,
          left + width + 0.50,
          row.y,
          row.color,
          16, true,
          1.05
        ),

        txt(
          `p ≈ ${row.p.toFixed(3)}`,
          CX + 0.65,
          row.y - 0.45,
          GREEN,
          16, true
        ),

        checkMark(
          CX + 2.52,
          row.y - 0.45,
          GREEN
        )
      );
    });

    const cutoffX =
      left + F_CRIT * scale;

    parts.push(
      dashed(
        cutoffX,
        bottom - 0.25,
        cutoffX,
        top + 0.25,
        GOLD
      ),

      txt(
        '5% cutoff ≈ 7.71',
        CX,
        Y(-2.26),
        C.ink,
        17, true
      )
    );

    return parts;
  }

  await until(S(27));
  await play(
    ...replace(
      ...factorEvidencePicture()
    ),

    ...fbox([
      ['batch: 3 h, p ≈ 0.040', BATCH_COLOR],
      ['mode: 8 h, p ≈ 0.001', MODE_COLOR],
      ['both below 5%', GREEN]
    ], GREEN),

    ...say('BOTH FACTORS MATTER. MODE HAS THE BIGGER EFFECT.', GREEN)
  );

  // ------------------------------------------------------------
  // 28: NAME THE METHOD — TWO-WAY ANOVA
  // ------------------------------------------------------------

  const methodY = Y(-0.37);

  const methodCard = new M.VGroup(
    outline(
      CX,
      methodY,
      5.91, 2.26,
      VIOLET, 0.075
    ),

    txt(
      'TWO-WAY ANOVA',
      CX,
      methodY + 0.69,
      VIOLET,
      28
    ),

    txt(
      'Two-way analysis of variance',
      CX,
      methodY + 0.12,
      C.ink,
      17
    ),

    tag(
      'BATCH',
      CX - 1.44,
      methodY - 0.58,
      BATCH_COLOR,
      17
    ),

    tag(
      'MODE',
      CX + 1.44,
      methodY - 0.58,
      MODE_COLOR,
      17
    ),

    txt(
      '+',
      CX,
      methodY - 0.58,
      C.muted,
      23
    )
  );

  await until(S(28));
  await play(
    ...replace(methodCard),

    ...fbox([
      ['two-way ANOVA', VIOLET],
      'two factors',
      'studied in one design'
    ], VIOLET),

    ...say('THIS IS TWO-WAY ANALYSIS OF VARIANCE', VIOLET)
  );

  // ------------------------------------------------------------
  // 29: THE SUM-OF-SQUARES DECOMPOSITION
  //
  // Total SS = 154.
  //
  // 154 = 18 + 128 + 0 + 8.
  //
  // Batch = 18.
  // Mode = 128.
  // Interaction = 0.
  // Leftover = 8.
  //
  // Show proportional pieces of one common total.
  // The interaction piece has zero length.
  // ------------------------------------------------------------

  const SS_PARTS = [
    {
      title: 'Batch',
      value: SS_BATCH,
      color: BATCH_COLOR
    },
    {
      title: 'Mode',
      value: SS_MODE,
      color: MODE_COLOR
    },
    {
      title: 'Leftover',
      value: SS_ERROR,
      color: ERROR_COLOR
    }
  ];

  const SS_BAR_W = 5.90;
  const SS_BAR_LEFT =
    CX - SS_BAR_W / 2;

  const SS_TOP_Y =
    Y(0.85);

  const SS_SPLIT_Y =
    Y(-0.38);

  function decompositionPicture(
    showInteraction = false
  ) {
    const parts = [
      txt(
        'TOTAL VARIATION: 154 SQUARED HOURS',
        CX,
        SS_TOP_Y + 0.51,
        C.ink,
        17,
        false, 6.12
      ),

      rect(
        CX,
        SS_TOP_Y,
        SS_BAR_W,
        0.55,
        C.ink,
        0.27
      ),

      txt(
        '154',
        CX,
        SS_TOP_Y,
        C.ink,
        22, true
      )
    ];

    let cursor =
      SS_BAR_LEFT;

    SS_PARTS.forEach(item => {
      const width =
        SS_BAR_W *
        item.value / SS_TOTAL;

      parts.push(
        rect(
          cursor + width / 2,
          SS_SPLIT_Y,
          width - 0.018,
          0.61,
          item.color,
          0.86
        )
      );

      if (item.value > 20) {
        parts.push(
          txt(
            String(item.value),
            cursor + width / 2,
            SS_SPLIT_Y,
            C.ink,
            22, true
          )
        );
      }

      cursor += width;
    });

    const legendY =
      Y(-1.40);

    SS_PARTS.forEach((item, k) => {
      const x =
        CX + (k - 1) * 2.02;

      parts.push(
        rect(
          x - 0.61,
          legendY,
          0.23, 0.23,
          item.color,
          0.85
        ),

        txt(
          item.title,
          x + 0.10,
          legendY,
          item.color,
          16,
          false, 1.42
        ),

        txt(
          String(item.value),
          x,
          legendY - 0.36,
          item.color,
          21, true
        )
      );
    });

    if (showInteraction) {
      parts.push(
        tag(
          'INTERACTION SS = 0',
          CX,
          Y(-2.40),
          INTERACTION_COLOR,
          18
        )
      );
    }

    return parts;
  }

  await until(S(29));
  await play(
    ...replace(
      ...decompositionPicture(false)
    ),

    ...fbox([
      'total SS = 154',
      ['batch SS = 18', BATCH_COLOR],
      ['mode SS = 128', MODE_COLOR],
      ['leftover SS = 8', ERROR_COLOR]
    ]),

    ...say('TOTAL VARIATION = THE SUM OF ITS PIECES')
  );

  await until(S(29) + 5.4);
  await play(
    ...replace(
      ...decompositionPicture(true)
    ),

    ...fbox([
      'SS total = SS batch + SS mode',
      '+ SS interaction + SS error',
      '154 = 18 + 128 + 0 + 8',
      ['interaction = 0 here', INTERACTION_COLOR]
    ], VIOLET),

    ...say('THE FOURTH PIECE, INTERACTION, IS ZERO HERE', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 30: EACH F IS ITS FACTOR MEAN SQUARE DIVIDED BY MSE
  //
  // Build the compact ANOVA table.
  //
  // Source        SS     df     MS      F
  // Batch         18      1     18      9
  // Mode         128      1    128     64
  // Interaction    0      1      0      0
  // Leftover       8      4      2      -
  // Total        154      7      -      -
  // ------------------------------------------------------------

  const TABLE_X = [
    CX - 2.22,
    CX - 0.47,
    CX + 0.52,
    CX + 1.50,
    CX + 2.48
  ];

  function anovaTable() {
    const top =
      Y(1.15);

    const step =
      P ? 0.76 : 0.55;

    const parts = [];

    [
      'SOURCE',
      'SS',
      'df',
      'MS',
      'F'
    ].forEach((label, k) => {
      parts.push(
        txt(
          label,
          TABLE_X[k],
          top,
          C.muted,
          15, true,
          k === 0 ? 1.72 : 0.72
        )
      );
    });

    parts.push(
      line(
        CX - 3.06,
        top - 0.27,
        CX + 3.06,
        top - 0.27,
        C.muted, 1.5
      )
    );

    const rows = [
      [
        'Batch',
        SS_BATCH,
        DF_BATCH,
        MS_BATCH,
        F_BATCH,
        BATCH_COLOR
      ],
      [
        'Mode',
        SS_MODE,
        DF_MODE,
        MS_MODE,
        F_MODE,
        MODE_COLOR
      ],
      [
        'Interaction',
        SS_INTERACTION,
        DF_INTERACTION,
        MS_INTERACTION,
        0,
        INTERACTION_COLOR
      ],
      [
        'Leftover',
        SS_ERROR,
        DF_ERROR,
        MSE,
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
      const yy =
        top - (i + 1) * step;

      for (let k = 0; k < 5; k++) {
        parts.push(
          txt(
            String(row[k]),
            TABLE_X[k],
            yy,
            row[5],
            k === 0 ? 15 : 19,
            k !== 0,
            k === 0 ? 1.75 : 0.84
          )
        );
      }

      if (i < rows.length - 1) {
        parts.push(
          line(
            CX - 3.05,
            yy - step / 2,
            CX + 3.05,
            yy - step / 2,
            C.muted,
            0.7
          )
        );
      }
    });

    parts.push(
      outline(
        TABLE_X[3],
        top - 4 * step,
        0.81,
        0.44,
        ERROR_COLOR,
        0.02
      )
    );

    return parts;
  }

  const tablePicture =
    anovaTable();

  await until(S(30));
  await play(
    ...replace(
      ...tablePicture
    ),

    ...fbox([
      'MS = SS ÷ df',
      'F factor = MS factor ÷ MSE',
      ['F batch = 18 ÷ 2 = 9', BATCH_COLOR],
      ['F mode = 128 ÷ 2 = 64', MODE_COLOR]
    ], VIOLET),

    ...say('EACH F COMPARES ITS FACTOR WITH THE SAME NOISE')
  );

  // ------------------------------------------------------------
  // 31: SHARE OUT THE VARIATION, THEN TEST EACH SHARE
  //
  // Represent both systematic mean squares as bars
  // compared against one common residual mean square.
  // ------------------------------------------------------------

  function compareWithNoisePicture() {
    const parts = [];

    const scale = 0.041;
    const left = CX - 2.75;

    const rows = [
      {
        name: 'BATCH MS',
        value: MS_BATCH,
        color: BATCH_COLOR,
        y: Y(0.78)
      },
      {
        name: 'MODE MS',
        value: MS_MODE,
        color: MODE_COLOR,
        y: Y(-0.36)
      },
      {
        name: 'NOISE MS',
        value: MSE,
        color: ERROR_COLOR,
        y: Y(-1.50)
      }
    ];

    rows.forEach(row => {
      const width =
        row.value * scale;

      parts.push(
        txt(
          row.name,
          CX,
          row.y + 0.43,
          row.color,
          16
        ),

        rect(
          left + width / 2,
          row.y,
          width,
          0.39,
          row.color,
          0.87
        ),

        txt(
          String(row.value),
          Math.min(
            CX + 2.85,
            left + width + 0.40
          ),
          row.y,
          row.color,
          18, true
        )
      );
    });

    parts.push(
      tag(
        'FACTOR MEAN SQUARE ÷ NOISE',
        CX,
        Y(-2.42),
        GREEN,
        17
      )
    );

    return parts;
  }

  await until(S(31));
  await play(
    ...replace(
      ...compareWithNoisePicture()
    ),

    ...fbox([
      'separate systematic variation',
      'adjust each piece for df',
      ['compare each with noise', GREEN]
    ], GREEN),

    ...say('SHARE OUT THE VARIATION, THEN COMPARE WITH NOISE')
  );

  // ------------------------------------------------------------
  // 32: STUDY TWO FACTORS AT ONCE
  //
  // The same factorial design supplies information about
  // both batch and operating mode.
  //
  // Compare one shared set of eight observations with
  // the conceptual alternative of two separate experiments.
  //
  // Do not claim that every possible pair of separate
  // experiments must use exactly sixteen batteries.
  // ------------------------------------------------------------

  const EFF_Y =
    Y(-0.31);

  function experimentCard(
    x,
    title,
    both
  ) {
    const color =
      both ? GREEN : C.muted;

    const parts = [
      outline(
        x,
        EFF_Y,
        2.84, 2.73,
        color, 0.045
      ),

      txt(
        title,
        x,
        EFF_Y + 1.03,
        color, 17,
        false, 2.62
      )
    ];

    if (both) {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const xx =
            x + (j - 0.5) * 0.98;

          const yy =
            EFF_Y + 0.19 - i * 0.57;

          parts.push(
            outline(
              xx, yy,
              0.84, 0.48,
              batches[i].color,
              0.04
            ),

            dot(
              xx - 0.18,
              yy,
              batches[i].color,
              0.075
            ),

            dot(
              xx + 0.18,
              yy,
              batches[i].color,
              0.075
            )
          );
        }
      }

      parts.push(
        txt(
          '8 observations',
          x,
          EFF_Y - 0.89,
          GREEN, 16
        )
      );
    } else {
      parts.push(
        outline(
          x,
          EFF_Y + 0.24,
          2.20, 0.59,
          BATCH_COLOR, 0.05
        ),

        txt(
          'batch experiment',
          x,
          EFF_Y + 0.24,
          BATCH_COLOR, 15
        ),

        outline(
          x,
          EFF_Y - 0.52,
          2.20, 0.59,
          MODE_COLOR, 0.05
        ),

        txt(
          'mode experiment',
          x,
          EFF_Y - 0.52,
          MODE_COLOR, 15
        ),

        txt(
          'separate resources',
          x,
          EFF_Y - 1.03,
          C.muted, 14
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const separateStudy = experimentCard(
    CX - 1.62,
    'TWO STUDIES',
    false
  );

  const factorialStudy = experimentCard(
    CX + 1.62,
    'ONE SHARED DESIGN',
    true
  );

  const efficiencyTag = tag(
    'THE SAME DATA ANSWER TWO QUESTIONS',
    CX,
    Y(-2.28),
    GREEN,
    16
  );

  await until(S(32));
  await play(
    ...replace(
      separateStudy,
      factorialStudy,
      efficiencyTag
    ),

    ...fbox([
      'one factorial experiment',
      'learn about both factors',
      ['can use resources more efficiently', GREEN]
    ], GREEN),

    ...say('STUDY TWO EFFECTS WITH ONE EXPERIMENT', GREEN)
  );

  // ------------------------------------------------------------
  // 33: REMOVE MODE EFFECT FROM THE NOISE
  //
  // Compare the same eight observations analyzed as:
  //
  // Batch-only one-way ANOVA:
  // Residual SS = 128 + 8 = 136.
  // Residual df = 8 - 2 = 6.
  // Residual MS = 136 / 6 ≈ 22.67.
  //
  // Two-way ANOVA:
  // Residual SS = 8.
  // Residual df = 4.
  // Residual MS = 2.
  //
  // The mode effect is systematic variation, not noise.
  // Accounting for it makes the batch comparison sharper.
  // ------------------------------------------------------------

  const BATCH_ONLY_ERROR_SS =
    SS_MODE + SS_INTERACTION + SS_ERROR;

  const BATCH_ONLY_ERROR_DF =
    N - NB;

  const BATCH_ONLY_MSE =
    BATCH_ONLY_ERROR_SS /
    BATCH_ONLY_ERROR_DF;

  function noiseComparison() {
    const parts = [];

    const left =
      CX - 2.67;

    const width =
      5.34;

    const scale =
      width / BATCH_ONLY_ERROR_SS;

    const top =
      Y(0.43);

    const bottom =
      Y(-1.14);

    const modeWidth =
      SS_MODE * scale;

    const noiseWidth =
      SS_ERROR * scale;

    parts.push(
      txt(
        'IF WE IGNORE OPERATING MODE',
        CX,
        top + 0.60,
        GOLD, 17
      ),

      rect(
        left + modeWidth / 2,
        top,
        modeWidth,
        0.54,
        MODE_COLOR, 0.82
      ),

      rect(
        left + modeWidth + noiseWidth / 2,
        top,
        noiseWidth,
        0.54,
        ERROR_COLOR, 0.86
      ),

      txt(
        'mode effect mixed into noise',
        left + modeWidth / 2,
        top,
        C.ink,
        16,
        false, modeWidth - 0.15
      ),

      txt(
        `MSE ≈ ${BATCH_ONLY_MSE.toFixed(2)}`,
        CX,
        top - 0.47,
        GOLD,
        18, true
      ),

      txt(
        'AFTER ACCOUNTING FOR MODE',
        CX,
        bottom + 0.58,
        GREEN, 17
      ),

      rect(
        left + noiseWidth / 2,
        bottom,
        noiseWidth,
        0.54,
        ERROR_COLOR, 0.86
      ),

      txt(
        'only residual scatter remains',
        CX + 0.36,
        bottom,
        ERROR_COLOR,
        16,
        false, 4.70
      ),

      txt(
        'MSE = 2',
        CX,
        bottom - 0.48,
        ERROR_COLOR,
        21, true
      )
    );

    return parts;
  }

  await until(S(33));
  await play(
    ...replace(
      ...noiseComparison()
    ),

    ...fbox([
      'ignoring mode: MSE ≈ 22.67',
      'accounting for mode: MSE = 2',
      ['less noise for the batch test', GREEN]
    ], GREEN),

    ...say('REMOVE THE MODE EFFECT FROM THE NOISE', GREEN)
  );

  // ------------------------------------------------------------
  // 34: THE TRAP — OUR MEAN LINES ARE PARALLEL
  //
  // Both batch gaps equal three.
  // Both mode drops equal eight.
  //
  // Consequently the additive model exactly reproduces
  // these four observed cell means.
  //
  // The sample interaction sum of squares is zero.
  // This does not prove the population interaction is zero.
  // ------------------------------------------------------------

  const parallelPlot =
    interactionPlot();

  const parallelLight =
    batchGapGuide(0);

  const parallelHeavy =
    batchGapGuide(1);

  const parallelCaption = tag(
    'SAME BATCH GAP IN BOTH MODES',
    CX,
    PY0 - 0.89,
    GREEN,
    16
  );

  await until(S(34));
  await play(
    ...replace(
      ...parallelPlot,
      parallelLight,
      parallelHeavy,
      parallelCaption
    ),

    ...fbox([
      'light batch gap = 3',
      'heavy batch gap = 3',
      ['observed lines are parallel', GREEN]
    ], GREEN),

    ...say('TRAP: THIS CLEAN SPLIT NEEDS PARALLEL LINES', GOLD)
  );

  // ------------------------------------------------------------
  // 35: WHAT IF THE BATCH GAP CHANGED WITH MODE?
  //
  // Use a clearly labelled hypothetical picture.
  //
  // Preserve the original batch A mean line.
  // Change the hypothetical batch B heavy-use mean
  // from 15 to 19.
  //
  // Light gap = 23 - 20 = 3.
  // Heavy gap = 19 - 12 = 7.
  //
  // This is NOT a replacement for the fixed chapter data.
  // It only illustrates a possible nonparallel pattern.
  // ------------------------------------------------------------

  const HYPOTHETICAL_MEANS = [
    [20, 12],
    [23, 19]
  ];

  function hypotheticalGap(j) {
    const a =
      HYPOTHETICAL_MEANS[0][j];

    const b =
      HYPOTHETICAL_MEANS[1][j];

    const x =
      MODE_X[j] + (j === 0 ? -0.85 : 0.85);

    return new M.VGroup(
      vBracket(
        x,
        py(a),
        py(b),
        INTERACTION_COLOR,
        0.09
      ),

      txt(
        `${b - a} h`,
        x + (j === 0 ? -0.34 : 0.34),
        (py(a) + py(b)) / 2,
        INTERACTION_COLOR,
        17, true,
        0.65
      )
    );
  }

  const hypotheticalPlot =
    interactionPlot(HYPOTHETICAL_MEANS);

  const hypotheticalCaption = tag(
    'HYPOTHETICAL NONPARALLEL LINES',
    CX,
    PY0 - 0.88,
    INTERACTION_COLOR,
    16
  );

  await until(S(35));
  await play(
    ...replace(
      ...hypotheticalPlot,
      hypotheticalGap(0),
      hypotheticalGap(1),
      hypotheticalCaption
    ),

    ...fbox([
      'hypothetical example',
      'light batch gap = 3',
      'heavy batch gap = 7',
      ['the effect changes with mode', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('WHAT IF THE BATCH GAP DEPENDED ON THE MODE?', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 36: NAME THE FOURTH PIECE — INTERACTION
  //
  // The interaction describes a change in the effect of
  // one factor across levels of the other factor.
  //
  // Preview the next lesson without solving its data.
  // ------------------------------------------------------------

  const interactionName = tag(
    'INTERACTION',
    CX,
    Y(1.20),
    INTERACTION_COLOR,
    20
  );

  await until(S(36));
  await play(
    ...add(interactionName),

    ...fbox([
      ['interaction', INTERACTION_COLOR],
      'one factor’s effect depends',
      'on the other factor',
      'next lesson'
    ], INTERACTION_COLOR),

    ...say('THE FOURTH PIECE IS CALLED AN INTERACTION', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 37: ONE-SENTENCE SUMMARY
  //
  // Return to the actual observed parallel lines.
  //
  // Show:
  // Batch SS = 18.
  // Mode SS = 128.
  // Interaction SS = 0.
  // Leftover SS = 8.
  //
  // Shared error MS = 2.
  // F batch = 9.
  // F mode = 64.
  // ------------------------------------------------------------

  const FINAL_Y0 =
    P ? -2.18 : -0.77;

  const FINAL_Y1 =
    P ? 1.24 : 1.24;

  const FINAL_X = [
    CX - 1.34,
    CX + 1.34
  ];

  const fpy = v =>
    FINAL_Y0 +
    (v - HMIN) / (HMAX - HMIN) *
    (FINAL_Y1 - FINAL_Y0);

  function finalPlot() {
    const parts = [
      line(
        CX - 2.80,
        FINAL_Y0,
        CX - 2.80,
        FINAL_Y1,
        C.muted,
        1.7
      ),

      line(
        CX - 2.80,
        FINAL_Y0,
        CX + 2.80,
        FINAL_Y0,
        C.muted,
        2
      )
    ];

    [8, 12, 16, 20, 24].forEach(v => {
      parts.push(
        txt(
          String(v),
          CX - 3.03,
          fpy(v),
          C.muted,
          13, true
        ),

        line(
          CX - 2.72,
          fpy(v),
          CX + 2.80,
          fpy(v),
          C.muted,
          0.65
        )
      );
    });

    batches.forEach((b, i) => {
      const values =
        CELL_MEANS[i];

      parts.push(
        line(
          FINAL_X[0],
          fpy(values[0]),
          FINAL_X[1],
          fpy(values[1]),
          b.color,
          3.5
        )
      );

      values.forEach((v, j) => {
        parts.push(
          dot(
            FINAL_X[j],
            fpy(v),
            b.color,
            0.105
          ),

          txt(
            String(v),
            FINAL_X[j] +
              (j === 0 ? -0.35 : 0.35),
            fpy(v),
            b.color,
            15, true
          )
        );
      });
    });

    parts.push(
      txt(
        'Light',
        FINAL_X[0],
        FINAL_Y0 - 0.25,
        BLUE,
        15
      ),

      txt(
        'Heavy',
        FINAL_X[1],
        FINAL_Y0 - 0.25,
        PINK,
        15
      )
    );

    return new M.VGroup(...parts);
  }

  const FINAL_CARD_Y =
    P ? -3.36 : -1.92;

  function finalFactorCard(
    x,
    title,
    f,
    p,
    color
  ) {
    return new M.VGroup(
      outline(
        x,
        FINAL_CARD_Y,
        2.72, 1.06,
        color, 0.07
      ),

      txt(
        title,
        x,
        FINAL_CARD_Y + 0.31,
        color, 15
      ),

      txt(
        `F = ${f}`,
        x,
        FINAL_CARD_Y - 0.02,
        color, 23, true
      ),

      txt(
        `p ≈ ${p.toFixed(3)}`,
        x,
        FINAL_CARD_Y - 0.36,
        GREEN, 14, true
      )
    );
  }

  const finalBatchCard = finalFactorCard(
    CX - 1.54,
    'BATCH EFFECT',
    F_BATCH,
    P_BATCH,
    BATCH_COLOR
  );

  const finalModeCard = finalFactorCard(
    CX + 1.54,
    'MODE EFFECT',
    F_MODE,
    P_MODE,
    MODE_COLOR
  );

  const finalErrorTag = tag(
    'SHARED NOISE MS = 2',
    CX,
    P ? -4.35 : -2.95,
    ERROR_COLOR,
    17
  );

  const finalSummaryPlot =
    finalPlot();

  await until(S(37));
  await play(
    ...replace(
      finalSummaryPlot,
      finalBatchCard,
      finalModeCard,
      finalErrorTag
    ),

    ...fbox([
      ['two-way ANOVA', VIOLET],
      '154 = 18 + 128 + 0 + 8',
      ['F batch = 9; F mode = 64', GREEN],
      'each F: factor ÷ noise'
    ], VIOLET),

    ...say('SPLIT THE VARIATION, THEN TEST EACH FACTOR WITH F', GREEN)
  );

  await until(E(37));

  // ------------------------------------------------------------
  // END OF LESSON
  //
  // All sentence beats 0–37 are included.
  //
  // Shared chapter data are unchanged:
  // A light = [19, 21].
  // A heavy = [11, 13].
  // B light = [22, 24].
  // B heavy = [14, 16].
  //
  // These are eight fresh, independent batteries.
  // The lines connect cell means, not repeated measurements.
  //
  // All means, sums of squares, degrees of freedom,
  // mean squares and F ratios are derived from the data.
  //
  // The p-values use the exact survival function of F(1,4).
  //
  // The residual degrees of freedom account for all four
  // fitted cell means, including the interaction term.
  //
  // The interaction contribution is zero for the observed
  // parallel cell means, not necessarily for the population.
  //
  // The nonparallel example in beat 35 is explicitly
  // hypothetical and is removed for the final summary.
  //
  // The batch-only residual comparison in beat 33 is
  // calculated from the same eight observations.
  //
  // Statistical significance is assessed at the individual
  // five-percent level for each factor.
  //
  // Classical two-way ANOVA assumes independent observations,
  // normally distributed errors and common error variance.
  // Randomization or appropriate experimental controls are
  // needed for causal interpretations.
  //
  // Uses the supplied engine interface and reference style,
  // with separate phone and laptop layout constants.
  //
  // Browser rendering and narration synchronization have
  // not been runtime-tested against the actual engine.
  // ------------------------------------------------------------
}

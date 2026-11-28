// lesson 7.2.11
// Interactions: when one factor's effect depends on another factor.
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
  // Eight fresh, independent batteries.
  // Two firmware versions × two operating modes.
  // Two batteries per cell.
  //
  //                  Light       Heavy
  // Old firmware     19, 21      11, 13
  // New firmware     20, 22      18, 20
  //
  // Cell means:
  // Old light = 20.
  // Old heavy = 12.
  // New light = 21.
  // New heavy = 19.
  //
  // Firmware effect in light use = 21 - 20 = 1.
  // Firmware effect in heavy use = 19 - 12 = 7.
  //
  // Difference of differences = 7 - 1 = 6 hours.
  //
  // Grand mean = 18.
  // Firmware means = 16, 20.
  // Mode means = 20.5, 15.5.
  //
  // Firmware SS = 32.
  // Mode SS = 50.
  // Interaction SS = 18.
  // Within SS = 8.
  // Total SS = 108.
  //
  // Interaction df = 1.
  // Interaction MS = 18.
  //
  // Within df = 4.
  // Within MS = 2.
  //
  // Interaction F = 18 / 2 = 9.
  // Reference distribution F(1,4).
  // p ≈ 0.03994.
  //
  // Average firmware effect = 4 hours.
  // This average describes neither mode particularly well.
  // ------------------------------------------------------------

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const PINK = C.pink || '#f472b6';
  const VIOLET = C.violet;
  const GREEN = C.green;

  const OLD = BLUE;
  const NEW = GOLD;

  const FIRMWARE_COLOR = VIOLET;
  const MODE_COLOR = PINK;
  const INTERACTION_COLOR = GOLD;
  const ERROR_COLOR = GREEN;

  const firmware = [
    { name: 'Old', color: OLD },
    { name: 'New', color: NEW }
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
      [20, 22],
      [18, 20]
    ]
  ];

  const sum = values =>
    values.reduce((s, v) => s + v, 0);

  const mean = values =>
    sum(values) / values.length;

  const NF = firmware.length;
  const NM = modes.length;
  const R = data[0][0].length;

  const ALL = data.flat(2);
  const N = ALL.length;

  const CELL_MEANS = data.map(row =>
    row.map(values => mean(values))
  );

  const FIRMWARE_MEANS = data.map(row =>
    mean(row.flat())
  );

  const MODE_MEANS = modes.map((_, j) =>
    mean(data.flatMap(row => row[j]))
  );

  const GRAND = mean(ALL);

  const EFFECT_LIGHT =
    CELL_MEANS[1][0] - CELL_MEANS[0][0];

  const EFFECT_HEAVY =
    CELL_MEANS[1][1] - CELL_MEANS[0][1];

  const INTERACTION =
    EFFECT_HEAVY - EFFECT_LIGHT;

  const AVERAGE_EFFECT =
    (EFFECT_LIGHT + EFFECT_HEAVY) / 2;

  // Cell means predicted by an additive model,
  // containing firmware and mode effects but no interaction.

  const ADDITIVE_MEANS = CELL_MEANS.map(
    (row, i) =>
      row.map((_, j) =>
        FIRMWARE_MEANS[i] +
        MODE_MEANS[j] -
        GRAND
      )
  );

  const INTERACTION_DEVIATIONS =
    CELL_MEANS.map((row, i) =>
      row.map((v, j) =>
        v - ADDITIVE_MEANS[i][j]
      )
    );

  const SS_FIRMWARE =
    NM * R * sum(
      FIRMWARE_MEANS.map(
        v => (v - GRAND) ** 2
      )
    );

  const SS_MODE =
    NF * R * sum(
      MODE_MEANS.map(
        v => (v - GRAND) ** 2
      )
    );

  const SS_INTERACTION =
    R * sum(
      INTERACTION_DEVIATIONS
        .flat()
        .map(v => v * v)
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

  const SS_TOTAL = sum(
    ALL.map(v => (v - GRAND) ** 2)
  );

  const DF_FIRMWARE = NF - 1;
  const DF_MODE = NM - 1;

  const DF_INTERACTION =
    (NF - 1) * (NM - 1);

  const DF_ERROR =
    N - NF * NM;

  const MS_INTERACTION =
    SS_INTERACTION / DF_INTERACTION;

  const MSE =
    SS_ERROR / DF_ERROR;

  const FSTAT =
    MS_INTERACTION / MSE;

  // Exact upper-tail probability for F(1,4).

  function f14Survival(f) {
    const z = Math.sqrt(f / (f + 4));

    return 0.5 * (1 - z) ** 2 * (z + 2);
  }

  const PVALUE = f14Survival(FSTAT);

  const F_CRIT = 7.708647;

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Keep content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Keep content between y = -3.0 and 2.3.
  //
  // Formula box above the diagram on phone,
  // to the right on laptop.
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

  function signed(v) {
    return v < 0
      ? `−${Math.abs(v)}`
      : v > 0
        ? `+${v}`
        : '0';
  }

  // Track top-level objects only.
  // Never regroup already-visible objects for highlighting.

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
  // BATTERY AND PHONE ICONS
  // ------------------------------------------------------------

  function batteryIcon(
    x, y,
    color = BLUE,
    width = 0.49,
    height = 0.82
  ) {
    return new M.VGroup(
      outline(
        x, y,
        width, height,
        color, 0.055
      ),

      rect(
        x,
        y + height / 2 + 0.055,
        width * 0.36,
        0.11,
        color, 1
      ),

      rect(
        x,
        y - 0.05,
        width - 0.13,
        height - 0.22,
        color, 0.82, 0
      )
    );
  }

  function phoneIcon(x, y, heavy = false) {
    const color =
      heavy ? MODE_COLOR : BLUE;

    const parts = [
      outline(
        x, y,
        1.05, 1.65,
        color, 0.055
      ),

      outline(
        x,
        y + 0.04,
        0.84, 1.23,
        color, 0.025
      ),

      line(
        x - 0.16,
        y - 0.72,
        x + 0.16,
        y - 0.72,
        C.muted, 2
      )
    ];

    if (heavy) {
      parts.push(
        rect(
          x,
          y + 0.09,
          0.72, 0.66,
          color, 0.25
        ),

        line(
          x - 0.13, y - 0.10,
          x - 0.13, y + 0.27,
          color, 3
        ),

        line(
          x - 0.13, y + 0.27,
          x + 0.20, y + 0.085,
          color, 3
        ),

        line(
          x + 0.20, y + 0.085,
          x - 0.13, y - 0.10,
          color, 3
        )
      );
    } else {
      for (let k = 0; k < 3; k++) {
        const xx =
          x + (k % 2 === 0 ? -0.09 : 0.09);

        const yy =
          y + 0.34 - k * 0.35;

        parts.push(
          outline(
            xx, yy,
            0.48, 0.25,
            color, 0.26
          ),

          line(
            xx - 0.15, yy,
            xx + 0.15, yy,
            color, 1.5
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0: REMEMBER THE FIRMWARE UPDATE?
  //
  // Does the new firmware help equally in both modes?
  // Begin with the two situations, without revealing results.
  // ------------------------------------------------------------

  const introY = Y(-0.23);

  const introLight = new M.VGroup(
    phoneIcon(
      CX - 1.60,
      introY,
      false
    ),

    tag(
      'LIGHT USE',
      CX - 1.60,
      introY + 1.17,
      BLUE, 17
    ),

    txt(
      'update helps?',
      CX - 1.60,
      introY - 1.13,
      C.ink, 18
    )
  );

  const introHeavy = new M.VGroup(
    phoneIcon(
      CX + 1.60,
      introY,
      true
    ),

    tag(
      'HEAVY USE',
      CX + 1.60,
      introY + 1.17,
      MODE_COLOR, 17
    ),

    txt(
      'update helps?',
      CX + 1.60,
      introY - 1.13,
      C.ink, 18
    )
  );

  const introQuestion = tag(
    'DOES THE UPDATE HELP EQUALLY?',
    CX,
    Y(-2.27),
    VIOLET, 18
  );

  await until(S(0));
  await play(
    ...add(
      introLight,
      introHeavy,
      introQuestion
    ),

    ...fbox([
      'firmware = built-in software',
      'old versus new firmware',
      ['same benefit in both modes?', VIOLET]
    ], VIOLET),

    ...say('DOES THE UPDATE HELP EQUALLY IN BOTH MODES?', VIOLET)
  );

  // ------------------------------------------------------------
  // 1: EIGHT FRESH BATTERIES
  //
  // Four old-firmware batteries.
  // Four new-firmware batteries.
  //
  // Unlike the earlier paired t-test, these are separate
  // batteries, not before-and-after measurements.
  // ------------------------------------------------------------

  function firmwareBatchCard(i) {
    const f = firmware[i];

    const x =
      CX + (i === 0 ? -1.62 : 1.62);

    const y = Y(-0.34);

    const parts = [
      outline(
        x, y,
        2.83, 2.19,
        f.color, 0.045
      ),

      txt(
        `${f.name.toUpperCase()} FIRMWARE`,
        x,
        y + 0.78,
        f.color, 17,
        false, 2.66
      )
    ];

    for (let k = 0; k < 4; k++) {
      parts.push(
        batteryIcon(
          x + (k - 1.5) * 0.59,
          y - 0.05,
          f.color,
          0.44, 0.83
        )
      );
    }

    parts.push(
      txt(
        '4 fresh batteries',
        x,
        y - 0.79,
        f.color, 16
      )
    );

    return new M.VGroup(...parts);
  }

  const freshOld = firmwareBatchCard(0);
  const freshNew = firmwareBatchCard(1);

  const freshCount = tag(
    '4 + 4 = 8 FRESH BATTERIES',
    CX,
    Y(-2.22),
    GREEN, 19
  );

  await until(S(1));
  await play(
    ...replace(
      freshOld,
      freshNew,
      freshCount
    ),

    ...fbox([
      ['old firmware: 4 batteries', OLD],
      ['new firmware: 4 batteries', NEW],
      '8 independent observations'
    ]),

    ...say('EIGHT FRESH BATTERIES')
  );

  // ------------------------------------------------------------
  // TWO-BY-TWO DESIGN TABLE
  //
  // Rows: old and new firmware.
  // Columns: light and heavy use.
  // Each cell contains two different batteries.
  // ------------------------------------------------------------

  const CELL_X = [
    CX - 0.80,
    CX + 1.69
  ];

  const CELL_Y = [
    Y(0.30),
    Y(-1.34)
  ];

  const CELL_W = 2.22;
  const CELL_H = P ? 1.65 : 1.40;

  function designHeaders() {
    return [
      txt(
        'LIGHT USE',
        CELL_X[0],
        CELL_Y[0] + CELL_H / 2 + 0.35,
        MODE_COLOR, 17
      ),

      txt(
        'HEAVY USE',
        CELL_X[1],
        CELL_Y[0] + CELL_H / 2 + 0.35,
        MODE_COLOR, 17
      ),

      tag(
        'OLD',
        CX - 2.62,
        CELL_Y[0],
        OLD, 16,
        1.08
      ),

      tag(
        'NEW',
        CX - 2.62,
        CELL_Y[1],
        NEW, 16,
        1.08
      )
    ];
  }

  function emptyCell(i, j) {
    const x = CELL_X[j];
    const y = CELL_Y[i];

    const color = firmware[i].color;

    return new M.VGroup(
      outline(
        x, y,
        CELL_W, CELL_H,
        color, 0.045
      ),

      batteryIcon(
        x - 0.43,
        y,
        color,
        0.42, 0.71
      ),

      batteryIcon(
        x + 0.43,
        y,
        color,
        0.42, 0.71
      )
    );
  }

  function measuredCell(i, j) {
    const x = CELL_X[j];
    const y = CELL_Y[i];

    const values = data[i][j];
    const m = CELL_MEANS[i][j];

    const color = firmware[i].color;

    // Bars use the same hours-to-height scale in all cells.

    const base = y - 0.36;
    const scale = P ? 0.036 : 0.029;

    const parts = [
      outline(
        x, y,
        CELL_W, CELL_H,
        color, 0.045
      ),

      line(
        x - 0.81,
        base,
        x + 0.81,
        base,
        C.muted, 1.4
      )
    ];

    values.forEach((v, k) => {
      const xx =
        x + (k - 0.5) * 0.71;

      const h = v * scale;

      parts.push(
        rect(
          xx,
          base + h / 2,
          0.45,
          h,
          color, 0.13, 0
        ),

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
          0.61
        )
      );
    });

    parts.push(
      txt(
        `mean ${m}`,
        x,
        y - CELL_H / 2 + 0.15,
        color, 16, true
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 2: TWO BATTERIES PER FIRMWARE-AND-MODE CELL
  // ------------------------------------------------------------

  const designHead = designHeaders();

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
    'TWO BATTERIES PER CELL',
    CX,
    Y(-2.49),
    GREEN, 17
  );

  await until(S(2));
  await play(
    ...replace(
      ...designHead,
      ...liveCells.flat(),
      splitNote
    ),

    ...fbox([
      '2 firmware versions',
      '2 operating modes',
      ['4 cells × 2 = 8 batteries', GREEN]
    ], GREEN),

    ...say('SPLIT BOTH FIRMWARE GROUPS BETWEEN THE MODES')
  );

  function revealCell(i, j) {
    const previous = liveCells[i][j];
    const next = measuredCell(i, j);

    liveCells[i][j] = next;

    return [
      ...remove(previous),
      ...add(next)
    ];
  }

  // ------------------------------------------------------------
  // 3: OLD FIRMWARE, LIGHT USE
  // 19 and 21 hours, mean 20.
  // ------------------------------------------------------------

  await until(S(3));
  await play(
    ...revealCell(0, 0),

    ...fbox([
      ['old firmware, light use', OLD],
      '19 and 21 hours',
      ['mean = 20', OLD]
    ], OLD),

    ...say('OLD LIGHT: MEAN 20 HOURS', OLD)
  );

  // ------------------------------------------------------------
  // 4: OLD FIRMWARE, HEAVY USE
  // 11 and 13 hours, mean 12.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...revealCell(0, 1),

    ...fbox([
      ['old firmware, heavy use', OLD],
      '11 and 13 hours',
      ['mean = 12', OLD]
    ], OLD),

    ...say('OLD HEAVY: MEAN 12 HOURS', OLD)
  );

  // ------------------------------------------------------------
  // 5: NEW FIRMWARE, LIGHT USE
  // 20 and 22 hours, mean 21.
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    ...revealCell(1, 0),

    ...fbox([
      ['new firmware, light use', NEW],
      '20 and 22 hours',
      ['mean = 21', NEW]
    ], NEW),

    ...say('NEW LIGHT: MEAN 21 HOURS', NEW)
  );

  // ------------------------------------------------------------
  // 6: NEW FIRMWARE, HEAVY USE
  // 18 and 20 hours, mean 19.
  // ------------------------------------------------------------

  await until(S(6));
  await play(
    ...revealCell(1, 1),

    ...fbox([
      ['new firmware, heavy use', NEW],
      '18 and 20 hours',
      ['mean = 19', NEW]
    ], NEW),

    ...say('NEW HEAVY: MEAN 19 HOURS', NEW)
  );

  // ------------------------------------------------------------
  // INTERACTION PLOT
  //
  // Horizontal axis = operating mode.
  // Vertical axis = battery life in hours.
  //
  // Cyan = old firmware.
  // Amber = new firmware.
  //
  // Lines connect cell means, not individual batteries.
  // The two modes contain independent observations.
  // ------------------------------------------------------------

  const HMIN = 8;
  const HMAX = 26;

  const PY0 = Y(-2.06);
  const PY1 = Y(1.18);

  const AXIS_X = CX - 2.84;

  const MODE_X = [
    CX - 1.35,
    CX + 1.41
  ];

  const py = v =>
    PY0 +
    (v - HMIN) / (HMAX - HMIN) *
    (PY1 - PY0);

  function plotAxes() {
    const parts = [
      line(
        AXIS_X, PY0,
        AXIS_X, PY1,
        C.muted, 2
      ),

      line(
        AXIS_X, PY0,
        CX + 2.91, PY0,
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
          0.45
        ),

        line(
          AXIS_X + 0.06,
          py(v),
          CX + 2.91,
          py(v),
          C.muted, 0.65
        )
      );
    }

    parts.push(
      txt(
        'hours',
        AXIS_X + 0.25,
        PY1 + 0.22,
        C.muted, 14
      ),

      tag(
        'LIGHT',
        MODE_X[0],
        PY0 - 0.38,
        MODE_COLOR, 16
      ),

      tag(
        'HEAVY',
        MODE_X[1],
        PY0 - 0.38,
        MODE_COLOR, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function meanSeries(
    i,
    values = CELL_MEANS[i],
    labels = true
  ) {
    const color = firmware[i].color;

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
          color,
          0.105
        )
      );

      if (labels) {
        parts.push(
          txt(
            String(v),
            MODE_X[j] +
              (j === 0 ? -0.32 : 0.32),
            py(v) +
              (i === 0 ? -0.12 : 0.12),
            color,
            16, true,
            0.67
          )
        );
      }
    });

    parts.push(
      tag(
        `${firmware[i].name.toUpperCase()} FIRMWARE`,
        CX - 0.2,
        (
          py(values[0]) +
          py(values[1])
        ) / 2 +
          (i === 0 ? -0.33 : 0.32),
        color,
        15,
        2.10
      )
    );

    return new M.VGroup(...parts);
  }

  function interactionPlot(
    values = CELL_MEANS,
    labels = true
  ) {
    return [
      plotAxes(),
      meanSeries(0, values[0], labels),
      meanSeries(1, values[1], labels)
    ];
  }

  // ------------------------------------------------------------
  // 7: DRAW THE TWO FIRMWARE MEAN LINES
  // ------------------------------------------------------------

  const mainAxes = plotAxes();
  const oldSeries = meanSeries(0);
  const newSeries = meanSeries(1);

  await until(S(7));
  await play(
    ...replace(
      mainAxes,
      oldSeries,
      newSeries
    ),

    ...fbox([
      'horizontal: operating mode',
      'vertical: battery life',
      'one mean line per firmware'
    ]),

    ...say('ONE LINE PER FIRMWARE VERSION')
  );

  // ------------------------------------------------------------
  // EFFECT GAP GUIDES
  //
  // Mark the vertical gap between old and new firmware
  // at each operating mode.
  // ------------------------------------------------------------

  function effectGuide(
    j,
    values = CELL_MEANS,
    color = INTERACTION_COLOR,
    label = null
  ) {
    const a = values[0][j];
    const b = values[1][j];

    const direction =
      j === 0 ? -1 : 1;

    const x =
      MODE_X[j] + direction * 0.81;

    const middle =
      (py(a) + py(b)) / 2;

    const parts = [];

    if (a === b) {
      parts.push(
        dot(
          x,
          py(a),
          color, 0.10
        )
      );
    } else {
      parts.push(
        vBracket(
          x,
          py(a),
          py(b),
          color,
          0.09
        )
      );
    }

    parts.push(
      txt(
        label || `${signed(b - a)} h`,
        j === 0 ? x : x + direction * 0.38,
        j === 0 ? Math.max(py(a), py(b)) + 0.3 : middle,
        color, 17, true,
        0.72
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 8: THE LIGHT-USE LINES ALMOST TOUCH
  //
  // Old = 20.
  // New = 21.
  // Difference = 1 hour.
  // ------------------------------------------------------------

  const lightHighlight = outline(
    MODE_X[0],
    (py(20) + py(21)) / 2,
    1.18,
    py(21) - py(20) + 0.54,
    VIOLET,
    0.035
  );

  const lightGuide = effectGuide(0);

  await until(S(8));
  await play(
    ...add(
      lightHighlight,
      lightGuide
    ),

    ...fbox([
      ['old light = 20', OLD],
      ['new light = 21', NEW],
      'the means are close'
    ]),

    ...say('IN LIGHT USE, THE LINES ALMOST TOUCH', VIOLET)
  );

  // ------------------------------------------------------------
  // 9: THE HEAVY-USE LINES ARE FAR APART
  //
  // Old = 12.
  // New = 19.
  // Difference = 7 hours.
  // ------------------------------------------------------------

  const heavyHighlight = outline(
    MODE_X[1],
    (py(12) + py(19)) / 2,
    1.18,
    py(19) - py(12) + 0.49,
    VIOLET,
    0.035
  );

  const heavyGuide = effectGuide(1);

  await until(S(9));
  await play(
    ...remove(lightHighlight),

    ...add(
      heavyHighlight,
      heavyGuide
    ),

    ...fbox([
      ['old heavy = 12', OLD],
      ['new heavy = 19', NEW],
      'the means are far apart'
    ]),

    ...say('IN HEAVY USE, THE LINES SPREAD APART', VIOLET)
  );

  // ------------------------------------------------------------
  // 10: THE LINES ARE NOT PARALLEL
  //
  // Highlight the widening vertical gap using a schematic
  // shaded band between the two mean lines.
  //
  // Thin rectangular slices approximate the space
  // between the lines. Their vertical heights follow
  // the actual interpolated mean differences.
  // ------------------------------------------------------------

  function wideningBand() {
    const parts = [];

    const slices = 32;

    const dx =
      (MODE_X[1] - MODE_X[0]) /
      slices;

    for (let k = 0; k < slices; k++) {
      const t =
        (k + 0.5) / slices;

      const oldMean =
        CELL_MEANS[0][0] +
        t * (
          CELL_MEANS[0][1] -
          CELL_MEANS[0][0]
        );

      const newMean =
        CELL_MEANS[1][0] +
        t * (
          CELL_MEANS[1][1] -
          CELL_MEANS[1][0]
        );

      const lower = py(oldMean);
      const upper = py(newMean);

      parts.push(
        rect(
          MODE_X[0] + (k + 0.5) * dx,
          (lower + upper) / 2,
          dx + 0.002,
          upper - lower,
          VIOLET,
          0.15,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const mainBand = wideningBand();

  const nonparallelNote = tag(
    'NOT PARALLEL',
    CX,
    PY0 - 0.91,
    INTERACTION_COLOR,
    19
  );

  await until(S(10));
  await play(
    ...remove(heavyHighlight),

    ...add(
      mainBand,
      nonparallelNote
    ),

    ...fbox([
      'light gap = 1',
      'heavy gap = 7',
      ['the gap changes with mode', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('THE TWO LINES ARE NOT PARALLEL', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 11: WHAT IS THE FIRMWARE EFFECT?
  //
  // The answer depends on the operating mode.
  // Present the two situations side by side.
  // ------------------------------------------------------------

  const EFFECT_Y = Y(-0.32);

  function situationCard(
    j,
    reveal = false
  ) {
    const x =
      CX + (j === 0 ? -1.61 : 1.61);

    const heavy =
      j === 1;

    const effect =
      heavy ? EFFECT_HEAVY : EFFECT_LIGHT;

    const parts = [
      outline(
        x,
        EFFECT_Y,
        2.80, 2.64,
        MODE_COLOR, 0.045
      ),

      txt(
        `${modes[j].name.toUpperCase()} USE`,
        x,
        EFFECT_Y + 0.99,
        MODE_COLOR, 17
      )
    ];

    if (!reveal) {
      parts.push(
        phoneIcon(
          x,
          EFFECT_Y + 0.02,
          heavy
        ),

        txt(
          'benefit = ?',
          x,
          EFFECT_Y - 1.03,
          C.ink, 18
        )
      );
    } else {
      parts.push(
        txt(
          `${CELL_MEANS[0][j]} → ${CELL_MEANS[1][j]}`,
          x,
          EFFECT_Y + 0.37,
          C.ink, 23, true,
          2.50
        ),

        txt(
          signed(effect),
          x,
          EFFECT_Y - 0.27,
          GREEN, 39, true
        ),

        txt(
          'hours',
          x,
          EFFECT_Y - 0.98,
          GREEN, 17
        )
      );
    }

    return new M.VGroup(...parts);
  }

  let situationLight =
    situationCard(0, false);

  let situationHeavy =
    situationCard(1, false);

  const dependsTag = tag(
    'THE ANSWER DEPENDS ON THE MODE',
    CX,
    Y(-2.28),
    VIOLET, 17
  );

  await until(S(11));
  await play(
    ...replace(
      situationLight,
      situationHeavy,
      dependsTag
    ),

    ...fbox([
      'effect of new firmware?',
      ['it depends on the mode', VIOLET]
    ], VIOLET),

    ...say('THE FIRMWARE EFFECT DEPENDS ON THE SITUATION', VIOLET)
  );

  // ------------------------------------------------------------
  // 12: IN LIGHT USE, THE UPDATE ADDS ONE HOUR
  //
  // 21 - 20 = 1.
  // ------------------------------------------------------------

  const revealedLight =
    situationCard(0, true);

  await until(S(12));
  await play(
    ...remove(situationLight),
    ...add(revealedLight),

    ...fbox([
      'firmware effect in light use',
      '21 − 20',
      ['= +1 hour', GREEN]
    ], GREEN),

    ...say('LIGHT USE: THE UPDATE ADDS ONE HOUR', GREEN)
  );

  situationLight = revealedLight;

  // ------------------------------------------------------------
  // 13: IN HEAVY USE, THE UPDATE ADDS SEVEN HOURS
  //
  // 19 - 12 = 7.
  // ------------------------------------------------------------

  const revealedHeavy =
    situationCard(1, true);

  await until(S(13));
  await play(
    ...remove(situationHeavy),
    ...add(revealedHeavy),

    ...fbox([
      'firmware effect in heavy use',
      '19 − 12',
      ['= +7 hours', GREEN]
    ], GREEN),

    ...say('HEAVY USE: THE UPDATE ADDS SEVEN HOURS', GREEN)
  );

  situationHeavy = revealedHeavy;

  // ------------------------------------------------------------
  // 14: NAME THE PATTERN — INTERACTION
  //
  // Return to the actual nonparallel mean lines.
  // ------------------------------------------------------------

  const interactionDefinition = tag(
    'INTERACTION',
    CX,
    PY0 - 0.92,
    INTERACTION_COLOR,
    20
  );

  await until(S(14));
  await play(
    ...replace(
      ...interactionPlot(),
      wideningBand(),
      effectGuide(0),
      effectGuide(1),
      interactionDefinition
    ),

    ...fbox([
      'one factor’s effect changes',
      'with the other factor',
      ['this is an interaction', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('A CHANGING EFFECT IS CALLED AN INTERACTION', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // EFFECT BARS
  //
  // Length represents the firmware benefit in hours.
  // Both effects use exactly the same scale.
  // ------------------------------------------------------------

  const EFFECT_SCALE = 0.72;

  const EFFECT_LEFT =
    CX - 2.65;

  const EFFECT_LIGHT_Y =
    Y(0.59);

  const EFFECT_HEAVY_Y =
    Y(-1.00);

  function effectBar(
    amount,
    y,
    title,
    color = VIOLET,
    left = EFFECT_LEFT
  ) {
    const width =
      amount * EFFECT_SCALE;

    return new M.VGroup(
      txt(
        title,
        CX,
        y + 0.56,
        color, 18
      ),

      rect(
        left + width / 2,
        y,
        width + 0.055,
        0.53,
        color, 0.12, 0
      ),

      rect(
        left + width / 2,
        y,
        width,
        0.43,
        color, 0.85
      ),

      txt(
        `${signed(amount)} h`,
        Math.min(
          left + width + 0.39,
          CX + 2.96
        ),
        y,
        color, 18, true,
        0.80
      )
    );
  }

  function twoEffectBars() {
    return [
      effectBar(
        EFFECT_LIGHT,
        EFFECT_LIGHT_Y,
        'LIGHT-USE BENEFIT',
        BLUE
      ),

      effectBar(
        EFFECT_HEAVY,
        EFFECT_HEAVY_Y,
        'HEAVY-USE BENEFIT',
        NEW
      )
    ];
  }

  // ------------------------------------------------------------
  // 15: TAKE THE DIFFERENCE OF THE TWO DIFFERENCES
  //
  // Compare a one-hour effect with a seven-hour effect.
  // The shared left edge makes their difference visible.
  // ------------------------------------------------------------

  const effectBars = twoEffectBars();

  const effectAlignment = dashed(
    EFFECT_LEFT,
    EFFECT_HEAVY_Y - 0.26,
    EFFECT_LEFT,
    EFFECT_LIGHT_Y + 0.26,
    C.muted
  );

  const differenceQuestion = tag(
    'COMPARE THE TWO BENEFITS',
    CX,
    Y(-2.26),
    INTERACTION_COLOR,
    19
  );

  await until(S(15));
  await play(
    ...replace(
      effectAlignment,
      ...effectBars,
      differenceQuestion
    ),

    ...fbox([
      'difference of differences',
      ['heavy-use effect', NEW],
      ['minus light-use effect', BLUE]
    ], INTERACTION_COLOR),

    ...say('TAKE THE DIFFERENCE OF THE TWO DIFFERENCES', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 16: SEVEN MINUS ONE IS SIX
  //
  // Divide the seven-hour effect into:
  // one common hour;
  // six extra hours in heavy use.
  //
  // The interaction would be zero if the effects matched.
  // ------------------------------------------------------------

  const DIFFERENCE_Y =
    EFFECT_HEAVY_Y;

  const commonWidth =
    EFFECT_LIGHT * EFFECT_SCALE;

  const extraWidth =
    INTERACTION * EFFECT_SCALE;

  const differenceParts = [
    effectBar(
      EFFECT_LIGHT,
      EFFECT_LIGHT_Y,
      'LIGHT-USE BENEFIT',
      BLUE
    ),

    txt(
      'HEAVY-USE BENEFIT',
      CX,
      DIFFERENCE_Y + 0.56,
      NEW, 18
    ),

    rect(
      EFFECT_LEFT + commonWidth / 2,
      DIFFERENCE_Y,
      commonWidth,
      0.43,
      BLUE, 0.86
    ),

    rect(
      EFFECT_LEFT +
        commonWidth +
        extraWidth / 2,
      DIFFERENCE_Y,
      extraWidth,
      0.43,
      INTERACTION_COLOR,
      0.86
    ),

    txt(
      '1',
      EFFECT_LEFT + commonWidth / 2,
      DIFFERENCE_Y,
      C.ink,
      17, true
    ),

    txt(
      '6 EXTRA HOURS',
      EFFECT_LEFT +
        commonWidth +
        extraWidth / 2,
      DIFFERENCE_Y,
      C.ink,
      19, true
    ),

    bracket(
      EFFECT_LEFT + commonWidth,
      EFFECT_LEFT + commonWidth + extraWidth,
      DIFFERENCE_Y - 0.47,
      INTERACTION_COLOR,
      0.08
    ),

    tag(
      '7 − 1 = 6 HOURS',
      CX,
      Y(-2.32),
      INTERACTION_COLOR,
      21
    )
  ];

  await until(S(16));
  await play(
    ...replace(
      ...differenceParts
    ),

    ...fbox([
      'interaction estimate',
      '7 − 1',
      ['= 6 hours', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('SEVEN MINUS ONE IS SIX HOURS', INTERACTION_COLOR)
  );

  // Illustrate parallel lines before returning to the
  // statistical test. This is a hypothetical null pattern.

  const PARALLEL_EXAMPLE = [
    [20, 12],
    [24, 16]
  ];

  await until(S(16) + 2.8);
  await play(
    ...replace(
      ...interactionPlot(PARALLEL_EXAMPLE),
      effectGuide(
        0,
        PARALLEL_EXAMPLE,
        GREEN,
        '+4 h'
      ),
      effectGuide(
        1,
        PARALLEL_EXAMPLE,
        GREEN,
        '+4 h'
      ),

      tag(
        'PARALLEL EXAMPLE: 4 − 4 = 0',
        CX,
        PY0 - 0.91,
        GREEN, 16
      )
    ),

    ...fbox([
      'if effects were equal',
      '4 − 4 = 0',
      ['parallel mean lines', GREEN]
    ], GREEN),

    ...say('PARALLEL LINES WOULD GIVE ZERO INTERACTION', GREEN)
  );

  // ------------------------------------------------------------
  // 17: IS THE SIX-HOUR INTERACTION MORE THAN CHANCE?
  //
  // Two-way ANOVA contains a fourth piece:
  // firmware, mode, interaction and leftover noise.
  //
  // Show the interaction as a separate source of variation.
  // ------------------------------------------------------------

  const pieces = [
    {
      label: 'FIRMWARE',
      value: SS_FIRMWARE,
      color: FIRMWARE_COLOR
    },
    {
      label: 'MODE',
      value: SS_MODE,
      color: MODE_COLOR
    },
    {
      label: 'INTERACTION',
      value: SS_INTERACTION,
      color: INTERACTION_COLOR
    },
    {
      label: 'NOISE',
      value: SS_ERROR,
      color: ERROR_COLOR
    }
  ];

  function variationPieces(
    revealInteraction = false
  ) {
    const top = Y(0.96);

    const center = Y(-0.75);

    const parts = [
      outline(
        CX,
        top,
        4.77, 0.77,
        C.ink, 0.055
      ),

      txt(
        'TOTAL VARIATION',
        CX,
        top,
        C.ink, 18
      )
    ];

    pieces.forEach((piece, k) => {
      const x =
        CX + (k - 1.5) * 1.53;

      parts.push(
        arrow(
          CX + (k - 1.5) * 0.63,
          top - 0.45,
          x,
          center + 0.66,
          piece.color,
          0.11
        ),

        outline(
          x,
          center,
          1.42, 1.18,
          piece.color,
          k === 2 ? 0.15 : 0.045
        ),

        txt(
          piece.label,
          x,
          center + 0.28,
          piece.color, 14,
          false, 1.29
        ),

        txt(
          k === 2
            ? revealInteraction
              ? String(piece.value)
              : '?'
            : String(piece.value),
          x,
          center - 0.19,
          piece.color, 23, true
        )
      );
    });

    parts.push(
      tag(
        'TEST THE EXTRA INTERACTION PIECE',
        CX,
        Y(-2.21),
        INTERACTION_COLOR,
        17
      )
    );

    return parts;
  }

  await until(S(17));
  await play(
    ...replace(
      ...variationPieces(false)
    ),

    ...fbox([
      'two-way ANOVA',
      'firmware + mode + noise',
      ['plus an interaction piece', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('IS SIX HOURS MORE THAN CHANCE?', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 18: INTERACTION SUM OF SQUARES = 18
  //
  // The additive prediction removes the marginal effects:
  //
  // predicted cell mean =
  // firmware mean + mode mean - grand mean.
  //
  // Additive predictions:
  // Old light:  18.5.
  // Old heavy:  13.5.
  // New light:  22.5.
  // New heavy:  17.5.
  //
  // Actual minus predicted:
  // Old light:  +1.5.
  // Old heavy:  -1.5.
  // New light:  -1.5.
  // New heavy:  +1.5.
  //
  // Each cell represents two batteries.
  //
  // Interaction SS =
  // 2 × (2.25 + 2.25 + 2.25 + 2.25)
  // = 18.
  //
  // The visual compares actual means with the parallel
  // means predicted by the additive model.
  // ------------------------------------------------------------

  function additivePlot() {
    const parts = [
      plotAxes()
    ];

    ADDITIVE_MEANS.forEach((row, i) => {
      const color = firmware[i].color;

      parts.push(
        dashed(
          MODE_X[0],
          py(row[0]),
          MODE_X[1],
          py(row[1]),
          color
        )
      );

      row.forEach((v, j) => {
        parts.push(
          outline(
            MODE_X[j],
            py(v),
            0.20, 0.20,
            color, 0.025
          )
        );
      });
    });

    parts.push(
      meanSeries(0, CELL_MEANS[0], false),
      meanSeries(1, CELL_MEANS[1], false)
    );

    CELL_MEANS.forEach((row, i) => {
      row.forEach((actual, j) => {
        const predicted =
          ADDITIVE_MEANS[i][j];

        const x =
          MODE_X[j] +
          (i === 0 ? -0.37 : 0.37);

        parts.push(
          arrow(
            x,
            py(predicted),
            x,
            py(actual),
            INTERACTION_COLOR,
            0.075
          ),

          txt(
            signed(actual - predicted),
            x + (i === 0 ? -0.31 : 0.31),
            (py(actual) + py(predicted)) / 2,
            INTERACTION_COLOR,
            14, true,
            0.62
          )
        );
      });
    });

    parts.push(
      txt(
        'dashed = predicted parallel means',
        CX,
        PY0 - 0.90,
        C.muted, 15
      ),

      txt(
        'solid = actual cell means',
        CX,
        PY0 - 1.20,
        C.ink, 15
      )
    );

    return parts;
  }

  await until(S(18));
  await play(
    ...replace(
      ...additivePlot()
    ),

    ...fbox([
      'actual minus additive means',
      'each deviation = ±1.5',
      ['2 × 4 × 1.5² = 18', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('MEASURE THE DEPARTURE FROM PARALLEL LINES', INTERACTION_COLOR)
  );

  function interactionSquares() {
    const parts = [];

    const centers = [
      [CX - 1.61, Y(0.45)],
      [CX + 1.61, Y(0.45)],
      [CX - 1.61, Y(-1.20)],
      [CX + 1.61, Y(-1.20)]
    ];

    INTERACTION_DEVIATIONS.flat().forEach(
      (d, k) => {
        const [x, y] = centers[k];

        const i =
          Math.floor(k / 2);

        const j =
          k % 2;

        parts.push(
          txt(
            `${firmware[i].name} ${modes[j].name}`,
            x,
            y + 0.56,
            firmware[i].color,
            16
          ),

          rect(
            x - 0.43,
            y,
            0.64, 0.64,
            INTERACTION_COLOR,
            0.77
          ),

          rect(
            x + 0.43,
            y,
            0.64, 0.64,
            INTERACTION_COLOR,
            0.77
          ),

          txt(
            '2.25',
            x - 0.43,
            y,
            C.ink, 15, true
          ),

          txt(
            '2.25',
            x + 0.43,
            y,
            C.ink, 15, true
          ),

          txt(
            `2 × (${signed(d)})² = 4.5`,
            x,
            y - 0.55,
            INTERACTION_COLOR,
            15, true,
            2.65
          )
        );
      }
    );

    parts.push(
      tag(
        'INTERACTION SS = 18',
        CX,
        Y(-2.40),
        INTERACTION_COLOR,
        21
      )
    );

    return parts;
  }

  await until(S(18) + 2.6);
  await play(
    ...replace(
      ...interactionSquares()
    ),

    ...fbox([
      'four cell deviations',
      'two batteries per cell',
      ['interaction SS = 18', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('THE INTERACTION SUM OF SQUARES IS EIGHTEEN', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 19: ONE INTERACTION DEGREE OF FREEDOM
  //
  // (2 - 1) × (2 - 1) = 1.
  //
  // Interaction MS = 18 / 1 = 18.
  //
  // One independent difference of differences is needed
  // for this balanced two-by-two design.
  // ------------------------------------------------------------

  const dfY = Y(0.73);

  const dfParts = [
    outline(
      CX - 1.63,
      dfY,
      2.45, 1.07,
      FIRMWARE_COLOR, 0.075
    ),

    txt(
      'FIRMWARE df',
      CX - 1.63,
      dfY + 0.28,
      FIRMWARE_COLOR, 16
    ),

    txt(
      '2 − 1 = 1',
      CX - 1.63,
      dfY - 0.19,
      FIRMWARE_COLOR, 22, true
    ),

    txt(
      '×',
      CX,
      dfY,
      C.ink, 27
    ),

    outline(
      CX + 1.63,
      dfY,
      2.45, 1.07,
      MODE_COLOR, 0.075
    ),

    txt(
      'MODE df',
      CX + 1.63,
      dfY + 0.28,
      MODE_COLOR, 16
    ),

    txt(
      '2 − 1 = 1',
      CX + 1.63,
      dfY - 0.19,
      MODE_COLOR, 22, true
    ),

    arrow(
      CX,
      dfY - 0.65,
      CX,
      Y(-0.48),
      INTERACTION_COLOR,
      0.13
    ),

    tag(
      '1 × 1 = 1 INTERACTION df',
      CX,
      Y(-0.81),
      INTERACTION_COLOR,
      19
    ),

    tag(
      'MS = 18 ÷ 1 = 18',
      CX,
      Y(-2.13),
      INTERACTION_COLOR,
      22
    )
  ];

  await until(S(19));
  await play(
    ...replace(
      ...dfParts
    ),

    ...fbox([
      'interaction df = (2−1)(2−1)',
      '= 1',
      ['MS interaction = 18 ÷ 1 = 18', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('ONE DEGREE OF FREEDOM: MEAN SQUARE EIGHTEEN', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 20: LEFTOVER NOISE IS THE SAME AS LAST LESSON
  //
  // Every battery is exactly one hour from its own cell mean.
  //
  // Eight squared residuals of 1.
  // Residual SS = 8.
  // Residual df = 8 - 4 = 4.
  // Residual MS = 8 / 4 = 2.
  // ------------------------------------------------------------

  function residualCell(i, j) {
    const x = CELL_X[j];
    const y = CELL_Y[i];

    const color = firmware[i].color;

    const values = data[i][j];
    const m = CELL_MEANS[i][j];

    const parts = [
      outline(
        x, y,
        CELL_W, CELL_H,
        color, 0.045
      ),

      txt(
        `cell mean ${m}`,
        x,
        y + CELL_H / 2 - 0.19,
        color,
        16, true,
        CELL_W - 0.19
      ),

      line(
        x - 0.82, y,
        x + 0.82, y,
        C.muted, 1.7
      ),

      dashed(
        x,
        y - 0.29,
        x,
        y + 0.29,
        ERROR_COLOR
      )
    ];

    values.forEach(v => {
      const d = v - m;
      const xx = x + d * 0.64;

      parts.push(
        dot(
          xx, y,
          color, 0.11
        ),

        txt(
          String(v),
          xx,
          y + 0.25,
          color, 15, true
        ),

        arrow(
          x + Math.sign(d) * 0.06,
          y - 0.20,
          xx,
          y - 0.20,
          ERROR_COLOR, 0.08
        ),

        txt(
          signed(d),
          (xx + x) / 2,
          y - 0.43,
          ERROR_COLOR,
          15, true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  await until(S(20));
  await play(
    ...replace(
      ...designHeaders(),
      residualCell(0, 0),
      residualCell(0, 1),
      residualCell(1, 0),
      residualCell(1, 1),

      tag(
        'EVERY DISTANCE IS ONE HOUR',
        CX,
        Y(-2.49),
        ERROR_COLOR, 16
      )
    ),

    ...fbox([
      'each battery is ±1 from its mean',
      'within SS = 8 × 1² = 8',
      ['within df = 8 − 4 = 4', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('THE SAME LEFTOVER SCATTER AS LAST LESSON', ERROR_COLOR)
  );

  function errorSharing() {
    const parts = [];

    const base = Y(-1.20);

    for (let k = 0; k < 4; k++) {
      const x =
        CX + (k - 1.5) * 1.32;

      const i =
        Math.floor(k / 2);

      const j =
        k % 2;

      parts.push(
        txt(
          `${firmware[i].name} ${modes[j].name}`,
          x,
          Y(1.00),
          firmware[i].color,
          14,
          false, 1.26
        )
      );

      for (let r = 0; r < 2; r++) {
        parts.push(
          rect(
            x,
            base + (r + 0.5) * 0.57,
            0.59, 0.49,
            ERROR_COLOR, 0.84
          ),

          txt(
            '1',
            x,
            base + (r + 0.5) * 0.57,
            C.ink, 18, true
          )
        );
      }

      parts.push(
        txt(
          '2',
          x,
          base + 1.38,
          ERROR_COLOR, 22, true
        ),

        txt(
          '1 df',
          x,
          base - 0.28,
          C.muted, 15, true
        )
      );
    }

    parts.push(
      line(
        CX - 2.77,
        base,
        CX + 2.77,
        base,
        C.muted, 2
      ),

      tag(
        'LEFTOVER MS = 8 ÷ 4 = 2',
        CX,
        Y(-2.36),
        ERROR_COLOR,
        20
      )
    );

    return parts;
  }

  await until(S(20) + 3.5);
  await play(
    ...replace(
      ...errorSharing()
    ),

    ...fbox([
      'leftover SS = 8',
      'leftover df = 4',
      ['leftover MS = 2', ERROR_COLOR]
    ], ERROR_COLOR),

    ...say('SHARE EIGHT OVER FOUR: LEFTOVER MEAN SQUARE TWO', ERROR_COLOR)
  );

  // ------------------------------------------------------------
  // 21: F = 18 / 2 = 9; p ≈ 4%
  //
  // Show nine copies of the residual mean-square unit
  // filling the interaction mean square.
  // ------------------------------------------------------------

  const UNIT_WIDTH = 0.59;

  const UNIT_LEFT =
    CX - 9 * UNIT_WIDTH / 2;

  const RATIO_TOP = Y(0.53);
  const RATIO_BOTTOM = Y(-1.11);

  function ratioPicture() {
    const parts = [
      txt(
        'INTERACTION MEAN SQUARE = 18',
        CX,
        RATIO_TOP + 0.57,
        INTERACTION_COLOR, 17
      )
    ];

    for (let k = 0; k < FSTAT; k++) {
      const x =
        UNIT_LEFT +
        (k + 0.5) * UNIT_WIDTH;

      parts.push(
        rect(
          x,
          RATIO_TOP,
          UNIT_WIDTH - 0.035,
          0.51,
          INTERACTION_COLOR,
          0.86
        ),

        txt(
          '2',
          x,
          RATIO_TOP,
          C.ink, 18, true
        )
      );
    }

    parts.push(
      txt(
        'LEFTOVER MEAN SQUARE = 2',
        CX,
        RATIO_BOTTOM + 0.57,
        ERROR_COLOR,
        17
      ),

      rect(
        UNIT_LEFT + UNIT_WIDTH / 2,
        RATIO_BOTTOM,
        UNIT_WIDTH,
        0.51,
        ERROR_COLOR, 0.86
      ),

      txt(
        '2',
        UNIT_LEFT + UNIT_WIDTH / 2,
        RATIO_BOTTOM,
        C.ink, 18, true
      ),

      tag(
        'F = 18 ÷ 2 = 9',
        CX,
        Y(-2.28),
        VIOLET, 22
      )
    );

    return parts;
  }

  await until(S(21));
  await play(
    ...replace(
      ...ratioPicture()
    ),

    ...fbox([
      'F = interaction MS ÷ error MS',
      '18 ÷ 2',
      ['F = 9; df = 1, 4', VIOLET]
    ], VIOLET),

    ...say('INTERACTION F EQUALS NINE', VIOLET)
  );

  // ------------------------------------------------------------
  // F(1,4) REFERENCE CURVE
  //
  // Density:
  // 3 / (8 sqrt(x)) × (1 + x/4)^(-5/2).
  //
  // The density diverges near zero, so the top of the
  // left-hand peak is clipped and explicitly labelled.
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

  const FMAX = 18;

  const FX_LEFT =
    CX - 2.92;

  const FX_RIGHT =
    CX + 2.94;

  const FY = Y(-1.94);

  const F_HEIGHT =
    P ? 3.17 : 2.48;

  const F_SCALE =
    P ? 6.0 : 4.5;

  const fx = v =>
    FX_LEFT +
    v / FMAX *
    (FX_RIGHT - FX_LEFT);

  const fy = v =>
    FY + Math.min(
      F_HEIGHT,
      fPDF(v) * F_SCALE
    );

  function fAxes() {
    const parts = [
      line(
        fx(0), FY,
        fx(FMAX), FY,
        C.muted, 2.5
      ),

      line(
        fx(0), FY,
        fx(0), FY + F_HEIGHT,
        C.muted, 1.6
      )
    ];

    for (let v = 0; v <= FMAX; v += 3) {
      parts.push(
        line(
          fx(v),
          FY - 0.06,
          fx(v),
          FY + 0.06,
          C.muted, 1.4
        ),

        txt(
          String(v),
          fx(v),
          FY - 0.28,
          C.muted,
          15, true,
          0.53
        )
      );
    }

    parts.push(
      txt(
        'F ratio',
        CX,
        FY - 0.70,
        C.muted, 16
      ),

      txt(
        'peak clipped',
        fx(2.3),
        FY + F_HEIGHT + 0.19,
        C.muted, 13
      )
    );

    return new M.VGroup(...parts);
  }

  function fCurve() {
    const parts = [];

    const samples = 140;

    const points = Array.from(
      { length: samples + 1 },
      (_, k) =>
        0.03 +
        (FMAX - 0.03) *
        (k / samples) ** 2
    );

    for (let k = 0; k < samples; k++) {
      const a = points[k];
      const b = points[k + 1];

      parts.push(
        line(
          fx(a), fy(a),
          fx(b), fy(b),
          BLUE, 3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fTail(
    cutoff,
    color = VIOLET
  ) {
    const parts = [];

    const samples = 90;
    const dx = (FMAX - cutoff) / samples;

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
          color, 0.83, 0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fTestPicture() {
    const critHeight =
      P ? 0.94 : 0.70;

    const observedHeight =
      P ? 1.66 : 1.29;

    return [
      fAxes(),

      fTail(
        FSTAT,
        INTERACTION_COLOR
      ),

      fCurve(),

      dashed(
        fx(F_CRIT),
        FY,
        fx(F_CRIT),
        FY + critHeight,
        C.muted
      ),

      tag(
        '7.71',
        fx(F_CRIT) - 0.43,
        FY + critHeight + 0.24,
        C.muted,
        15,
        1.10
      ),

      dashed(
        fx(FSTAT),
        FY,
        fx(FSTAT),
        FY + observedHeight,
        INTERACTION_COLOR
      ),

      dot(
        fx(FSTAT),
        FY,
        INTERACTION_COLOR,
        0.115
      ),

      tag(
        'OUR F = 9',
        fx(FSTAT) + 0.43,
        FY + observedHeight + 0.28,
        INTERACTION_COLOR,
        18,
        2.05
      ),

      tag(
        'F(1, 4)',
        CX + 1.04,
        Y(1.12),
        VIOLET,
        19
      ),

      tag(
        `p ≈ ${(100 * PVALUE).toFixed(1)}%`,
        fx(14.2),
        FY + 0.76,
        GREEN,
        19,
        2.06
      ),

      arrow(
        fx(13.8),
        FY + 0.48,
        fx(12),
        fy(12) + 0.04,
        INTERACTION_COLOR,
        0.11
      ),

      arrow(
        fx(17.3),
        FY + 0.07,
        fx(FMAX),
        FY + 0.07,
        INTERACTION_COLOR,
        0.10
      )
    ];
  }

  await until(S(21) + 2.8);
  await play(
    ...replace(
      ...fTestPicture()
    ),

    ...fbox([
      'F = 9 with 1 and 4 df',
      `upper-tail p ≈ ${PVALUE.toFixed(4)}`,
      ['about four percent', GREEN]
    ], GREEN),

    ...say('THE p-VALUE IS ABOUT FOUR PERCENT', GREEN)
  );

  // ------------------------------------------------------------
  // 22: REJECT THE NULL OF PARALLEL LINES
  //
  // Null hypothesis:
  // the firmware effect is the same in light and heavy use.
  //
  // p ≈ 0.04 < 0.05.
  //
  // Evidence that the firmware benefit differs by mode.
  // The observed direction favors a larger benefit
  // during heavy use.
  // ------------------------------------------------------------

  const evidenceCaption = tag(
    'EVIDENCE OF INTERACTION',
    CX,
    PY0 - 0.92,
    GREEN, 19
  );

  await until(S(22));
  await play(
    ...replace(
      ...interactionPlot(),
      wideningBand(),
      effectGuide(0),
      effectGuide(1),
      evidenceCaption
    ),

    ...fbox([
      'p ≈ 0.040 < 0.05',
      ['reject equal firmware effects', GREEN],
      'larger benefit in heavy use'
    ], GREEN),

    ...say('THE UPDATE HELPS MUCH MORE DURING VIDEO', GREEN)
  );

  // ------------------------------------------------------------
  // 23: THE INTERACTION FORMULA
  //
  // Interaction =
  // (new heavy - old heavy)
  // - (new light - old light).
  //
  // = (19 - 12) - (21 - 20).
  // = 7 - 1.
  // = 6 hours.
  // ------------------------------------------------------------

  const FORM_Y = Y(0.29);

  function effectFormulaCard(
    j,
    x
  ) {
    const heavy = j === 1;

    const effect =
      heavy ? EFFECT_HEAVY : EFFECT_LIGHT;

    return new M.VGroup(
      outline(
        x,
        FORM_Y,
        2.68, 1.80,
        MODE_COLOR, 0.055
      ),

      txt(
        `${modes[j].name.toUpperCase()} EFFECT`,
        x,
        FORM_Y + 0.61,
        MODE_COLOR,
        16
      ),

      txt(
        `${CELL_MEANS[1][j]} − ${CELL_MEANS[0][j]}`,
        x,
        FORM_Y + 0.04,
        C.ink, 25, true
      ),

      txt(
        String(effect),
        x,
        FORM_Y - 0.53,
        GREEN, 30, true
      )
    );
  }

  const heavyFormula = effectFormulaCard(
    1,
    CX - 1.65
  );

  const lightFormula = effectFormulaCard(
    0,
    CX + 1.65
  );

  const interactionMinus = txt(
    '−',
    CX,
    FORM_Y,
    INTERACTION_COLOR,
    32
  );

  const interactionEquals = arrow(
    CX,
    FORM_Y - 1.03,
    CX,
    Y(-1.30),
    INTERACTION_COLOR,
    0.12
  );

  const interactionResult = tag(
    '7 − 1 = 6 HOURS',
    CX,
    Y(-1.80),
    INTERACTION_COLOR,
    24
  );

  await until(S(23));
  await play(
    ...replace(
      heavyFormula,
      lightFormula,
      interactionMinus,
      interactionEquals,
      interactionResult
    ),

    ...fbox([
      'interaction = heavy effect',
      '              − light effect',
      '(19 − 12) − (21 − 20)',
      ['= 7 − 1 = 6 hours', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('INTERACTION = HEAVY EFFECT MINUS LIGHT EFFECT', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 24: IN WORDS — HOW MUCH DOES ONE EFFECT CHANGE?
  //
  // Return to the two aligned effect bars.
  // Show that six measures the change in the benefit,
  // rather than a battery-life mean.
  // ------------------------------------------------------------

  const changeBracketY =
    EFFECT_HEAVY_Y - 0.45;

  const changeBracket = bracket(
    EFFECT_LEFT + EFFECT_LIGHT * EFFECT_SCALE,
    EFFECT_LEFT + EFFECT_HEAVY * EFFECT_SCALE,
    changeBracketY,
    INTERACTION_COLOR,
    0.08
  );

  const changeLabel = txt(
    'THE BENEFIT CHANGES BY 6 h',
    EFFECT_LEFT + 4 * EFFECT_SCALE,
    changeBracketY - 0.28,
    INTERACTION_COLOR,
    16, true,
    4.36
  );

  await until(S(24));
  await play(
    ...replace(
      ...twoEffectBars(),
      changeBracket,
      changeLabel
    ),

    ...fbox([
      'not a single average benefit',
      'the change in the benefit',
      ['from one situation to another', INTERACTION_COLOR]
    ], INTERACTION_COLOR),

    ...say('HOW MUCH DOES THE EFFECT CHANGE?', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 25: INTERACTIONS APPEAR AS NONPARALLEL LINES
  //
  // Compare two small charts using the same axes:
  //
  // Left: illustrative parallel means, equal effects.
  // Right: actual means, unequal effects.
  // ------------------------------------------------------------

  function miniInteractionCard(
    x,
    y,
    values,
    title,
    color
  ) {
    const w = 2.81;
    const h = 2.84;

    const left = x - 0.91;
    const right = x + 0.91;

    const bottom = y - 1.00;
    const top = y + 0.69;

    const yy = v =>
      bottom +
      (v - 10) / 16 *
      (top - bottom);

    const parts = [
      outline(
        x, y,
        w, h,
        color, 0.04
      ),

      txt(
        title,
        x,
        y + 1.10,
        color, 16,
        false, 2.59
      ),

      line(
        left - 0.20, bottom,
        left - 0.20, top,
        C.muted, 1.2
      ),

      line(
        left - 0.20, bottom,
        right + 0.16, bottom,
        C.muted, 1.2
      )
    ];

    values.forEach((row, i) => {
      parts.push(
        line(
          left,
          yy(row[0]),
          right,
          yy(row[1]),
          firmware[i].color,
          3
        ),

        dot(
          left,
          yy(row[0]),
          firmware[i].color,
          0.075
        ),

        dot(
          right,
          yy(row[1]),
          firmware[i].color,
          0.075
        )
      );
    });

    parts.push(
      txt(
        'Light',
        left,
        bottom - 0.24,
        C.muted, 13
      ),

      txt(
        'Heavy',
        right,
        bottom - 0.24,
        C.muted, 13
      )
    );

    return new M.VGroup(...parts);
  }

  const compareY = Y(-0.32);

  const parallelCard =
    miniInteractionCard(
      CX - 1.60,
      compareY,
      PARALLEL_EXAMPLE,
      'PARALLEL',
      GREEN
    );

  const nonparallelCard =
    miniInteractionCard(
      CX + 1.60,
      compareY,
      CELL_MEANS,
      'NONPARALLEL',
      INTERACTION_COLOR
    );

  const compareNotes = [
    txt(
      'equal effects',
      CX - 1.60,
      Y(-2.22),
      GREEN, 16
    ),

    txt(
      'different effects',
      CX + 1.60,
      Y(-2.22),
      INTERACTION_COLOR, 16
    )
  ];

  await until(S(25));
  await play(
    ...replace(
      parallelCard,
      nonparallelCard,
      ...compareNotes
    ),

    ...fbox([
      ['parallel: equal observed effects', GREEN],
      ['nonparallel: changing effects', INTERACTION_COLOR],
      'test whether change exceeds noise'
    ], INTERACTION_COLOR),

    ...say('ON THE CHART, LOOK FOR NONPARALLEL LINES', INTERACTION_COLOR)
  );

  // ------------------------------------------------------------
  // 26: WHAT ARE INTERACTIONS FOR?
  //
  // Identify situations in which a treatment or change
  // has a different effect.
  // ------------------------------------------------------------

  const useTop = Y(0.96);
  const useBottom = Y(-1.14);

  const useSource = new M.VGroup(
    outline(
      CX,
      useTop,
      3.25, 0.86,
      VIOLET, 0.08
    ),

    txt(
      'ONE UPDATE',
      CX,
      useTop,
      VIOLET, 21
    )
  );

  function useSituation(
    j,
    x
  ) {
    const amount =
      j === 0 ? EFFECT_LIGHT : EFFECT_HEAVY;

    return new M.VGroup(
      outline(
        x,
        useBottom,
        2.66, 1.43,
        MODE_COLOR, 0.055
      ),

      txt(
        `${modes[j].name.toUpperCase()} USE`,
        x,
        useBottom + 0.39,
        MODE_COLOR, 17
      ),

      txt(
        `${signed(amount)} ${Math.abs(amount) === 1 ? 'hour' : 'hours'}`,
        x,
        useBottom - 0.21,
        GREEN, 23, true
      )
    );
  }

  const useLight = useSituation(
    0,
    CX - 1.57
  );

  const useHeavy = useSituation(
    1,
    CX + 1.57
  );

  await until(S(26));
  await play(
    ...replace(
      useSource,

      arrow(
        CX - 0.61,
        useTop - 0.49,
        CX - 1.57,
        useBottom + 0.80,
        VIOLET, 0.12
      ),

      arrow(
        CX + 0.61,
        useTop - 0.49,
        CX + 1.57,
        useBottom + 0.80,
        VIOLET, 0.12
      ),

      useLight,
      useHeavy,

      tag(
        'SAME CHANGE, DIFFERENT BENEFITS',
        CX,
        Y(-2.36),
        INTERACTION_COLOR,
        17
      )
    ),

    ...fbox([
      'find out when an effect',
      'depends on the situation',
      ['not just whether it exists', VIOLET]
    ], VIOLET),

    ...say('FIND OUT WHEN AN EFFECT DEPENDS ON THE SITUATION', VIOLET)
  );

  // ------------------------------------------------------------
  // 27: TWO OTHER EXAMPLES
  //
  // Medicine that works for adults but not children.
  // Fertiliser that helps only when there is enough rain.
  //
  // Both are hypothetical examples of effect modification.
  // No numerical medical or agricultural claims are made.
  // ------------------------------------------------------------

  function personIcon(
    x, y,
    color,
    small = false
  ) {
    const scale =
      small ? 0.72 : 1;

    const head = new M.Circle({
      radius: 0.13 * scale,
      color
    });

    head.setFill(color, 0.83);

    head.moveTo(
      pt(
        x,
        y + 0.32 * scale
      )
    );

    const body = outline(
      x,
      y - 0.05 * scale,
      0.32 * scale,
      0.50 * scale,
      color,
      0.64
    );

    return new M.VGroup(
      head,
      body
    );
  }

  function plantIcon(
    x, y,
    color,
    large = false
  ) {
    const height =
      large ? 0.68 : 0.35;

    const parts = [
      line(
        x - 0.29, y - 0.21,
        x + 0.29, y - 0.21,
        C.muted, 2
      ),

      line(
        x,
        y - 0.21,
        x,
        y - 0.21 + height,
        color, 3
      ),

      line(
        x,
        y - 0.21 + height * 0.52,
        x - 0.23,
        y - 0.21 + height * 0.80,
        color, 3
      ),

      line(
        x,
        y - 0.21 + height * 0.68,
        x + 0.22,
        y - 0.21 + height,
        color, 3
      )
    ];

    return new M.VGroup(...parts);
  }

  function medicineExample() {
    const y = Y(-0.29);

    return [
      outline(
        CX, y,
        5.81, 2.73,
        VIOLET, 0.045
      ),

      tag(
        'HYPOTHETICAL MEDICINE',
        CX,
        y + 1.03,
        VIOLET,
        18
      ),

      personIcon(
        CX - 1.57,
        y + 0.16,
        GREEN,
        false
      ),

      personIcon(
        CX + 1.57,
        y + 0.16,
        C.muted,
        true
      ),

      txt(
        'Adults',
        CX - 1.57,
        y - 0.43,
        C.ink, 18
      ),

      txt(
        'Children',
        CX + 1.57,
        y - 0.43,
        C.ink, 18
      ),

      tag(
        'BENEFIT',
        CX - 1.57,
        y - 0.95,
        GREEN, 16
      ),

      tag(
        'NO BENEFIT',
        CX + 1.57,
        y - 0.95,
        C.muted, 16
      )
    ];
  }

  function fertiliserExample() {
    const y = Y(-0.29);

    return [
      outline(
        CX, y,
        5.81, 2.73,
        VIOLET, 0.045
      ),

      tag(
        'HYPOTHETICAL FERTILISER',
        CX,
        y + 1.03,
        VIOLET, 18
      ),

      plantIcon(
        CX - 1.57,
        y + 0.13,
        C.muted,
        false
      ),

      plantIcon(
        CX + 1.57,
        y + 0.13,
        GREEN,
        true
      ),

      txt(
        'Little rain',
        CX - 1.57,
        y - 0.43,
        C.ink, 18
      ),

      txt(
        'Enough rain',
        CX + 1.57,
        y - 0.43,
        BLUE, 18
      ),

      tag(
        'NO BENEFIT',
        CX - 1.57,
        y - 0.95,
        C.muted, 16
      ),

      tag(
        'BENEFIT',
        CX + 1.57,
        y - 0.95,
        GREEN, 16
      )
    ];
  }

  await until(S(27));
  await play(
    ...replace(
      ...medicineExample()
    ),

    ...fbox([
      'example: medicine',
      'effect depends on age group',
      ['medicine × age', VIOLET]
    ], VIOLET),

    ...say('AN EFFECT CAN DEPEND ON WHO RECEIVES IT', VIOLET)
  );

  await until(S(27) + 3.2);
  await play(
    ...replace(
      ...fertiliserExample()
    ),

    ...fbox([
      'example: fertiliser',
      'effect depends on rainfall',
      ['fertiliser × rain', VIOLET]
    ], VIOLET),

    ...say('AN EFFECT CAN DEPEND ON THE CONDITIONS', VIOLET)
  );

  // ------------------------------------------------------------
  // 28: THE TRAP — AN AVERAGE EFFECT CAN MISLEAD
  //
  // Display the actual effect bars again.
  // Introduce a single average as a possible summary,
  // but show that the two situations differ substantially.
  // ------------------------------------------------------------

  const averageX =
    EFFECT_LEFT +
    AVERAGE_EFFECT * EFFECT_SCALE;

  const averageGuide = dashed(
    averageX,
    EFFECT_HEAVY_Y - 0.29,
    averageX,
    EFFECT_LIGHT_Y + 0.29,
    VIOLET
  );

  const averageGuideLabel = tag(
    'ONE AVERAGE?',
    averageX,
    Y(-2.25),
    VIOLET, 18
  );

  await until(S(28));
  await play(
    ...replace(
      ...twoEffectBars(),
      averageGuide,
      averageGuideLabel
    ),

    ...fbox([
      'trap: one overall average',
      'can hide different benefits',
      ['look at each situation', GOLD]
    ], GOLD),

    ...say('TRAP: AN AVERAGE CAN HIDE THE INTERACTION', GOLD)
  );

  // ------------------------------------------------------------
  // 29: THE AVERAGE FIRMWARE EFFECT IS FOUR HOURS
  //
  // (1 + 7) / 2 = 4.
  //
  // Use equal sharing of eight hour-blocks:
  // one initially belongs to light use;
  // seven initially belong to heavy use.
  //
  // Move three blocks from the larger stack to the smaller
  // stack to illustrate the arithmetic mean.
  //
  // This is a mathematical picture only. The observed
  // effects themselves do not change.
  // ------------------------------------------------------------

  const STACK_X = [
    CX - 1.42,
    CX + 1.42
  ];

  const STACK_BASE =
    Y(-1.81);

  const BLOCK_PITCH =
    P ? 0.43 : 0.30;

  const BLOCK_W = 0.92;

  function hourBlock(i, j, color) {
    return rect(
      STACK_X[i],
      STACK_BASE +
        (j + 0.5) * BLOCK_PITCH,
      BLOCK_W,
      BLOCK_PITCH * 0.82,
      color,
      0.85
    );
  }

  const lightBlocks = [
    hourBlock(0, 0, BLUE)
  ];

  const heavyBlocks = Array.from(
    { length: 7 },
    (_, k) =>
      hourBlock(1, k, NEW)
  );

  const averageFloor = line(
    CX - 2.72,
    STACK_BASE,
    CX + 2.72,
    STACK_BASE,
    C.muted, 2
  );

  const averageStackLabels = [
    tag(
      'LIGHT',
      STACK_X[0],
      STACK_BASE - 0.38,
      BLUE, 16
    ),

    tag(
      'HEAVY',
      STACK_X[1],
      STACK_BASE - 0.38,
      NEW, 16
    )
  ];

  const averageCountOld = [
    txt(
      '1',
      STACK_X[0],
      STACK_BASE + BLOCK_PITCH + 0.26,
      BLUE, 22, true
    ),

    txt(
      '7',
      STACK_X[1],
      STACK_BASE + 7 * BLOCK_PITCH + 0.26,
      NEW, 22, true
    )
  ];

  const shareInstruction = txt(
    'share the total equally',
    CX,
    Y(1.19),
    VIOLET, 17
  );

  await until(S(29));
  await play(
    ...replace(
      averageFloor,
      ...lightBlocks,
      ...heavyBlocks,
      ...averageStackLabels,
      ...averageCountOld,
      shareInstruction
    ),

    ...fbox([
      'average firmware effect',
      '(1 + 7) ÷ 2',
      ['= 4 hours', VIOLET]
    ], VIOLET),

    ...say('AVERAGE THE TWO BENEFITS')
  );

  const moveAverageBlocks = [
    new M.Transform(
      heavyBlocks[6],
      hourBlock(0, 1, VIOLET),
      { pathArc: 0.4 }
    ),

    new M.Transform(
      heavyBlocks[5],
      hourBlock(0, 2, VIOLET),
      { pathArc: 0.4 }
    ),

    new M.Transform(
      heavyBlocks[4],
      hourBlock(0, 3, VIOLET),
      { pathArc: 0.4 }
    )
  ];

  const equalLevel =
    STACK_BASE + 4 * BLOCK_PITCH;

  const averageLevel = dashed(
    STACK_X[0] - 0.62,
    equalLevel,
    STACK_X[1] + 0.62,
    equalLevel,
    VIOLET
  );

  const averageFour = tag(
    'AVERAGE = 4 HOURS',
    CX,
    equalLevel + 0.57,
    VIOLET,
    20
  );

  await until(S(29) + 2.2);
  await play(
    ...remove(...averageCountOld),

    new M.LaggedStart(
      moveAverageBlocks,
      {
        lagRatio: 0.18,
        runTime: 1.8
      }
    ),

    ...add(
      averageLevel,
      averageFour
    ),

    ...say('ONE PLUS SEVEN, HALVED, IS FOUR', VIOLET)
  );

  // ------------------------------------------------------------
  // 30: THE AVERAGE DESCRIBES NEITHER MODE WELL
  //
  // Restore the actual observed benefits.
  //
  // Light = +1 hour.
  // Heavy = +7 hours.
  // Average = +4 hours.
  //
  // These are estimates of group effects, not guarantees
  // for every individual battery or user.
  // ------------------------------------------------------------

  function actualAveragePicture() {
    const parts = [
      ...twoEffectBars(),

      dashed(
        averageX,
        EFFECT_HEAVY_Y - 0.29,
        averageX,
        EFFECT_LIGHT_Y + 0.29,
        VIOLET
      ),

      tag(
        'AVERAGE = 4',
        averageX,
        Y(1.30),
        VIOLET,
        17
      )
    ];

    parts.push(
      bracket(
        EFFECT_LEFT + EFFECT_LIGHT * EFFECT_SCALE,
        averageX,
        EFFECT_LIGHT_Y - 0.44,
        GOLD,
        0.07
      ),

      txt(
        '3 h too high',
        (
          EFFECT_LEFT +
          EFFECT_LIGHT * EFFECT_SCALE +
          averageX
        ) / 2,
        EFFECT_LIGHT_Y - 0.71,
        GOLD,
        14,
        false, 2.04
      ),

      bracket(
        averageX,
        EFFECT_LEFT + EFFECT_HEAVY * EFFECT_SCALE,
        EFFECT_HEAVY_Y - 0.44,
        GOLD,
        0.07
      ),

      txt(
        '3 h too low',
        (
          averageX +
          EFFECT_LEFT +
          EFFECT_HEAVY * EFFECT_SCALE
        ) / 2,
        EFFECT_HEAVY_Y - 0.71,
        GOLD,
        14,
        false, 2.04
      )
    );

    return parts;
  }

  await until(S(30));
  await play(
    ...replace(
      ...actualAveragePicture()
    ),

    ...fbox([
      ['light users: about +1 hour', BLUE],
      ['video users: about +7 hours', NEW],
      'average +4 describes neither well'
    ], GOLD),

    ...say('LIGHT USERS GET ONE HOUR. VIDEO WATCHERS GET SEVEN.', GOLD)
  );

  // ------------------------------------------------------------
  // 31: REPORT THE EFFECT FOR EACH SITUATION SEPARATELY
  //
  // Nonparallel lines can diverge, converge or cross.
  // Each pattern may indicate a changing effect.
  //
  // Show a crossing example briefly, then return to
  // the actual firmware experiment and its two estimates.
  // ------------------------------------------------------------

  const CROSSING_EXAMPLE = [
    [18, 14],
    [14, 22]
  ];

  const crossingPreview = miniInteractionCard(
    CX - 1.60,
    compareY,
    CROSSING_EXAMPLE,
    'CROSSING',
    INTERACTION_COLOR
  );

  const divergingPreview = miniInteractionCard(
    CX + 1.60,
    compareY,
    CELL_MEANS,
    'SPREADING APART',
    INTERACTION_COLOR
  );

  await until(S(31));
  await play(
    ...replace(
      crossingPreview,
      divergingPreview,

      tag(
        'REPORT EFFECTS BY SITUATION',
        CX,
        Y(-2.30),
        GREEN, 18
      )
    ),

    ...fbox([
      'crossing or diverging lines',
      'may indicate an interaction',
      ['report each conditional effect', GREEN]
    ], GREEN),

    ...say('WHEN LINES CROSS OR SPREAD APART, LOOK AT EACH SITUATION', GREEN)
  );

  await until(S(31) + 2.5);
  await play(
    ...replace(
      situationCard(0, true),
      situationCard(1, true),

      tag(
        'REPORT BOTH BENEFITS',
        CX,
        Y(-2.29),
        GREEN, 20
      )
    ),

    ...fbox([
      ['light effect = +1 hour', BLUE],
      ['heavy effect = +7 hours', NEW],
      ['interaction = +6 hours', INTERACTION_COLOR]
    ], GREEN),

    ...say('REPORT THE LIGHT AND HEAVY EFFECTS SEPARATELY', GREEN)
  );

  // ------------------------------------------------------------
  // 32: ONE-SENTENCE SUMMARY
  //
  // An interaction means that one factor's effect
  // depends on another factor.
  //
  // Test the difference of differences using an ANOVA
  // interaction mean square and the residual mean square.
  //
  // Final picture:
  // Nonparallel firmware mean lines.
  // Light effect = +1 hour.
  // Heavy effect = +7 hours.
  // Interaction = 6 hours.
  // Interaction SS = 18.
  // F = 9, df = 1 and 4, p ≈ 0.04.
  // ------------------------------------------------------------

  const FINAL_Y0 =
    P ? -2.39 : -0.86;

  const FINAL_Y1 =
    1.23;

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
        C.muted, 1.7
      ),

      line(
        CX - 2.80,
        FINAL_Y0,
        CX + 2.80,
        FINAL_Y0,
        C.muted, 2
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
          C.muted, 0.65
        )
      );
    });

    CELL_MEANS.forEach((values, i) => {
      const color = firmware[i].color;

      parts.push(
        line(
          FINAL_X[0],
          fpy(values[0]),
          FINAL_X[1],
          fpy(values[1]),
          color, 3.5
        )
      );

      values.forEach((v, j) => {
        parts.push(
          dot(
            FINAL_X[j],
            fpy(v),
            color,
            0.09
          ),

          txt(
            String(v),
            FINAL_X[j] +
              (j === 0 ? -0.31 : 0.31),
            fpy(v) +
              (i === 0 ? -0.09 : 0.09),
            color,
            14, true
          )
        );
      });
    });

    parts.push(
      txt(
        'Light',
        FINAL_X[0],
        FINAL_Y0 - 0.27,
        MODE_COLOR, 15
      ),

      txt(
        'Heavy',
        FINAL_X[1],
        FINAL_Y0 - 0.27,
        MODE_COLOR, 15
      ),

      vBracket(
        FINAL_X[0] - 0.69,
        fpy(20),
        fpy(21),
        GREEN,
        0.065
      ),

      vBracket(
        FINAL_X[1] + 0.69,
        fpy(12),
        fpy(19),
        GREEN,
        0.065
      ),

      txt(
        '+1 h',
        FINAL_X[0] - 0.69,
        fpy(21) + 0.3,
        GREEN,
        15, true,
        0.67
      ),

      txt(
        '+7 h',
        FINAL_X[1] + 1.00,
        (fpy(12) + fpy(19)) / 2,
        GREEN,
        14, true,
        0.67
      ),

      txt(
        'OLD',
        CX + 0.05,
        (fpy(20) + fpy(12)) / 2 - 0.24,
        OLD,
        14
      ),

      txt(
        'NEW',
        CX + 0.05,
        (fpy(21) + fpy(19)) / 2 + 0.25,
        NEW,
        14
      )
    );

    return new M.VGroup(...parts);
  }

  const FINAL_RESULT_Y =
    P ? -3.59 : -2.0;

  const finalInteractionCard = new M.VGroup(
    outline(
      CX,
      FINAL_RESULT_Y,
      5.82, 1.09,
      INTERACTION_COLOR,
      0.075
    ),

    txt(
      'DIFFERENCE OF DIFFERENCES',
      CX,
      FINAL_RESULT_Y + 0.30,
      INTERACTION_COLOR,
      15
    ),

    txt(
      '7 − 1 = 6 HOURS',
      CX,
      FINAL_RESULT_Y - 0.18,
      INTERACTION_COLOR,
      25, true
    )
  );

  const finalTestTag = tag(
    'F = 9   •   df = 1, 4   •   p ≈ 0.04',
    CX,
    P ? -4.57 : -2.95,
    GREEN,
    17
  );

  await until(S(32));
  await play(
    ...replace(
      finalPlot(),
      finalInteractionCard,
      finalTestTag
    ),

    ...fbox([
      ['interaction: a changing effect', INTERACTION_COLOR],
      'difference of differences = 6',
      'F = 18 ÷ 2 = 9',
      ['p ≈ 0.040', GREEN]
    ], INTERACTION_COLOR),

    ...say('AN INTERACTION IS A DIFFERENCE OF DIFFERENCES', INTERACTION_COLOR)
  );

  // Keep the final diagram visible until narration finishes.

  await until(E(32));

  // ------------------------------------------------------------
  // END OF LESSON
  //
  // All sentence beats 0–32 are included.
  //
  // Shared chapter data are unchanged:
  // Old light = [19, 21].
  // Old heavy = [11, 13].
  // New light = [20, 22].
  // New heavy = [18, 20].
  //
  // The observed firmware effects are +1 and +7 hours.
  // Their difference is exactly 6 hours.
  //
  // Interaction SS is calculated from deviations between
  // actual cell means and additive-model predictions,
  // weighted by two observations per cell.
  //
  // The interaction sum of squares is 18.
  // Interaction df = 1.
  // Interaction MS = 18.
  //
  // Residual SS = 8.
  // Residual df = 4.
  // Residual MS = 2.
  //
  // F = 9.
  // The p-value uses the exact F(1,4) survival function.
  //
  // The parallel and crossing comparison diagrams are
  // explicitly illustrative and do not replace actual data.
  //
  // The medicine and fertiliser examples are hypothetical.
  //
  // Mean lines connect independent cell means, not
  // repeated measurements of individual batteries.
  //
  // The interaction test concerns unequal effects across
  // modes; it does not independently establish the
  // significance of each individual simple effect.
  //
  // The average effect of four hours is mathematically
  // correct, but it conceals important effect differences.
  //
  // Classical two-way ANOVA assumes independent observations,
  // normally distributed errors and common error variance.
  //
  // Uses the supplied engine interface and reference style,
  // with separate phone and laptop layout constants.
  //
  // Browser rendering and narration synchronization have
  // not been runtime-tested against the actual engine.
  // ------------------------------------------------------------
}

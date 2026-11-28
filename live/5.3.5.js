// lesson 5.3.5
// Sampling distributions — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact shared chapter model:
// Delay:        0,   10,  20,  30 minutes
// Probability:  0.4, 0.3, 0.2, 0.1
// True mean = 10 minutes.
// Standard deviation of individual delays = 10 minutes.
//
// Simulation: 1,000 batches of four independent parcels.
// The cumulative histogram counts below were reproduced using
// NumPy default_rng(10), matching the supplied narration.
// Simulated mean = 9.9925, displayed as 9.99.
// Simulated standard deviation = 4.9906, displayed as 4.99.
// Exactly 197 batches have mean 10.
// Observed minimum = 0; observed maximum = 25.
//
// Theoretical standard deviation of batch means = 5 minutes.
// Exact probability of a batch mean between 5 and 15 = 0.785.
//
// Precomputed simulation counts ensure that the browser animation
// reproduces the narrated results rather than generating new ones.
// Uses the approved engine API; browser playback has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Exact shared chapter data
  // ------------------------------------------------------------

  const DELAYS = [0, 10, 20, 30];
  const PROBS = [0.4, 0.3, 0.2, 0.1];

  const TEAL = '#2dd4bf';
  const BLUE = '#4895ef';
  const RED = '#ff646e';
  const PINK = C.pink || '#ff619e';

  const DELAY_COLORS = [
    TEAL,
    BLUE,
    C.amber,
    RED
  ];

  const TRUE_MEAN = 10;
  const TRUE_SD = 10;
  const BATCH_SIZE = 4;
  const TRUE_BATCH_SD = 5;

  const BATCHES = [
    [30, 0, 20, 0],
    [10, 0, 10, 20],
    [10, 30, 20, 0]
  ];

  const TOTALS = BATCHES.map(batch =>
    batch.reduce((a, b) => a + b, 0)
  );

  const MEANS = TOTALS.map(total =>
    total / BATCH_SIZE
  );

  const BIN_VALUES = Array.from(
    { length: 13 },
    (_, i) => i * 2.5
  );

  // Exact cumulative counts from NumPy default_rng(10).
  // Each row describes the first n batches of the same run.
  // All 13 possible batch means are represented, including
  // the unobserved values 27.5 and 30.

  const STAGES = [
    {
      n: 3,
      counts: [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
    },
    {
      n: 25,
      counts: [0, 3, 4, 6, 4, 5, 1, 0, 1, 1, 0, 0, 0]
    },
    {
      n: 100,
      counts: [0, 9, 14, 23, 20, 12, 11, 7, 2, 2, 0, 0, 0]
    },
    {
      n: 250,
      counts: [5, 22, 30, 52, 44, 39, 33, 15, 6, 3, 1, 0, 0]
    },
    {
      n: 500,
      counts: [10, 37, 66, 98, 95, 74, 67, 27, 15, 8, 3, 0, 0]
    },
    {
      n: 1000,
      counts: [22, 81, 140, 180, 197, 154, 117, 57, 35, 13, 4, 0, 0]
    }
  ];

  const COUNTS = STAGES[STAGES.length - 1].counts;

  const SIM_N = COUNTS.reduce((a, b) => a + b, 0);

  const SIM_MEAN = COUNTS.reduce(
    (sum, count, i) => sum + count * BIN_VALUES[i],
    0
  ) / SIM_N;

  const SIM_SD = Math.sqrt(
    COUNTS.reduce(
      (sum, count, i) =>
        sum + count * (BIN_VALUES[i] - SIM_MEAN) ** 2,
      0
    ) / SIM_N
  );

  const WITHIN_FIVE = COUNTS.reduce(
    (sum, count, i) =>
      sum + (
        BIN_VALUES[i] >= 5 && BIN_VALUES[i] <= 15
          ? count
          : 0
      ),
    0
  );

  // WITHIN_FIVE = 788 of the 1,000 simulated batches.
  // The corresponding exact model probability is 0.785.

  const EXACT_WITHIN_FIVE = 0.785;

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const fmt = v =>
    Number(v).toLocaleString('en-US');

  const delayColor = v =>
    DELAY_COLORS[DELAYS.indexOf(v)];

  // ------------------------------------------------------------
  // Shared visual helpers
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function rect(x, y, w, h, color, opacity = 0, sw = 2) {
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
    x, y, w, h, color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(0.16, w * 0.08, h * 0.08),
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(x, y, radius, color, opacity = 1) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function glow(x, y, color = C.cyan, radius = 0.10) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.25,
      color
    });

    halo.setFill(color, 0.16);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  function ring(x, y, color = C.amber, radius = 0.18) {
    return circle(x, y, radius, color, 0);
  }

  function tag(s, color, x, y, size = 17, maxw = null) {
    const p = pill(s, color, size);

    if (maxw !== null && p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function arrow(x1, y1, x2, y2, color = C.amber, tip = 0.14) {
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

  function doubleArrow(x1, y1, x2, y2, color = C.amber) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const tip = 0.13;

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

  // Parcel icon: cardboard box with a central tape strip.
  // Its colour represents the parcel's delay.

  function parcel(x, y, scale = 1, color = C.amber) {
    const w = 0.84 * scale;
    const h = 0.65 * scale;

    return new M.VGroup(
      rounded(
        x, y, w, h,
        color, color, 0.16
      ),

      rect(
        x,
        y,
        0.14 * scale,
        h - 0.02,
        color,
        0.53,
        0.7
      ),

      line(
        x - w / 2,
        y + h * 0.12,
        x + w / 2,
        y + h * 0.12,
        color,
        1.5
      ),

      rect(
        x + w * 0.25,
        y - h * 0.25,
        0.17 * scale,
        0.11 * scale,
        C.ink,
        0.78,
        0.6
      )
    );
  }

  function clockIcon(x, y, radius = 0.37, color = C.cyan) {
    return new M.VGroup(
      circle(x, y, radius, color, 0.04),

      line(
        x, y,
        x, y + radius * 0.62,
        color, 2.5
      ),

      line(
        x, y,
        x + radius * 0.46,
        y - radius * 0.18,
        color, 2.5
      ),

      circle(x, y, 0.035, color)
    );
  }

  // ------------------------------------------------------------
  // Top-level visibility tracking
  // ------------------------------------------------------------

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
    const animations = [];

    for (const o of objects) {
      if (o && visible.has(o)) {
        visible.delete(o);
        animations.push(new M.FadeOut(o));
      }
    }

    return animations;
  }

  function clearPicture() {
    const animations = Array.from(visible).map(o =>
      new M.FadeOut(o)
    );

    visible.clear();

    return animations;
  }

  function lagIn(objects, lagRatio = 0.12, runTime = 1.4) {
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
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
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
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.38 : 3.7;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  // ------------------------------------------------------------
  // 0: the parcel depot cannot inspect ten thousand parcels
  // ------------------------------------------------------------

  const DEPOT_Y = P ? -1.10 : -0.40;

  const DEPOT_W = P ? 6.05 : 6.45;
  const DEPOT_H = P ? 3.40 : 2.92;

  const depot = new M.VGroup(
    rounded(
      CX,
      DEPOT_Y,
      DEPOT_W,
      DEPOT_H,
      C.cyan,
      C.card,
      0.55
    ),

    line(
      CX - DEPOT_W / 2,
      DEPOT_Y + DEPOT_H / 2,
      CX,
      DEPOT_Y + DEPOT_H / 2 + 0.42,
      C.cyan,
      2.5
    ),

    line(
      CX,
      DEPOT_Y + DEPOT_H / 2 + 0.42,
      CX + DEPOT_W / 2,
      DEPOT_Y + DEPOT_H / 2,
      C.cyan,
      2.5
    ),

    txt(
      'PARCEL DEPOT',
      P ? 23 : 21,
      C.cyan,
      CX,
      DEPOT_Y + DEPOT_H / 2 - 0.35
    )
  );

  // Symbolic warehouse stock.
  // The 24 icons represent a large stock of parcels;
  // they do not claim to depict all 10,000 individually.

  const depotParcels = Array.from({ length: 24 }, (_, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);

    return parcel(
      CX + (col - 3.5) * 0.68,
      DEPOT_Y + 0.45 - row * 0.65,
      0.69,
      C.amber
    );
  });

  const hugeNumber = tag(
    '10,000 PARCELS',
    C.amber,
    CX,
    DEPOT_Y - DEPOT_H / 2 - 0.37,
    20
  );

  const depotNote = txt(
    'Too many to check before deciding',
    P ? 19 : 17,
    C.muted,
    CX,
    DEPOT_Y - DEPOT_H / 2 - 0.90,
    false,
    6.4
  );

  await until(S(0));
  await play(
    ...put(depot),
    lagIn(depotParcels, 0.045, 1.75),
    ...put(hugeNumber, depotNote),
    ...say('THE DEPOT CANNOT CHECK 10,000 PARCELS', C.amber),
    ...fbox([
      'Real-life decisions',
      'Cannot wait for',
      ['10,000 observations', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 1–3: one batch of four, one batch mean
  // ------------------------------------------------------------

  const BATCH_Y = P ? -0.88 : -0.43;
  const PARCEL_SP = P ? 1.35 : 1.49;

  const parcelX = i =>
    CX + (i - 1.5) * PARCEL_SP;

  const smallBatchFrame = rounded(
    CX,
    BATCH_Y,
    P ? 5.90 : 6.40,
    P ? 2.55 : 2.10,
    C.violet,
    C.card,
    0.55
  );

  const smallBatch = Array.from(
    { length: 4 },
    (_, i) =>
      parcel(
        parcelX(i),
        BATCH_Y + 0.17,
        1.10,
        C.violet
      )
  );

  const smallBatchLabels = Array.from(
    { length: 4 },
    (_, i) =>
      txt(
        `Parcel ${i + 1}`,
        P ? 17 : 16,
        C.muted,
        parcelX(i),
        BATCH_Y - 0.53,
        false,
        PARCEL_SP - 0.12
      )
  );

  const morningClock = clockIcon(
    CX - 2.20,
    P ? 0.98 : 1.16,
    0.30,
    C.amber
  );

  const morningLabel = tag(
    'EACH MORNING',
    C.amber,
    CX + 0.55,
    P ? 0.98 : 1.16,
    17
  );

  await until(S(1));
  await play(
    ...clearPicture(),
    ...put(
      smallBatchFrame,
      morningClock,
      morningLabel
    ),
    lagIn(smallBatch, 0.18, 1.5),
    ...put(...smallBatchLabels),
    ...say('ONE SMALL BATCH = FOUR PARCELS', C.violet),
    ...fbox([
      ['Batch', C.violet],
      'A small group',
      'Taken together',
      ['Batch size = 4', C.green]
    ], C.violet)
  );

  const meanArrow = arrow(
    CX,
    BATCH_Y - 1.08,
    CX,
    BATCH_Y - (P ? 1.75 : 1.52),
    C.cyan
  );

  const meanQuestion = new M.VGroup(
    rounded(
      CX,
      BATCH_Y - (P ? 2.19 : 1.90),
      P ? 3.55 : 3.65,
      0.65,
      C.cyan
    ),

    txt(
      'BATCH MEAN',
      21,
      C.cyan,
      CX,
      BATCH_Y - (P ? 2.19 : 1.90)
    )
  );

  await until(S(2));
  await play(
    ...draw(meanArrow),
    ...put(meanQuestion),
    ...say('FOUR DELAYS BECOME ONE MEAN'),
    ...fbox([
      ['Batch mean', C.cyan],
      'Add four delays',
      'Divide by four'
    ])
  );

  await until(S(3));
  await play(
    new M.Indicate(
      meanQuestion,
      { color: C.amber }
    ),
    ...say('HOW MUCH CAN ONE BATCH MEAN BE TRUSTED?', C.amber),
    ...fbox([
      ['Our question', C.amber],
      'How much can',
      'one batch mean vary?'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Batch calculation visual
  // ------------------------------------------------------------

  // Delay stacks use one block per five minutes.
  // Every parcel retains the chapter's delay colour.

  const STACK_BASE = P ? -2.65 : -1.84;

  const STACK_PITCH = P ? 0.38 : 0.29;
  const STACK_W = P ? 0.81 : 0.88;

  function batchPicture(batchIndex) {
    const values = BATCHES[batchIndex];
    const total = TOTALS[batchIndex];
    const mean = MEANS[batchIndex];

    const floor = line(
      parcelX(0) - PARCEL_SP / 2,
      STACK_BASE,
      parcelX(3) + PARCEL_SP / 2,
      STACK_BASE,
      C.muted,
      2.5
    );

    const title = tag(
      `BATCH ${batchIndex + 1}`,
      C.violet,
      CX,
      P ? 1.29 : 1.38,
      20
    );

    const parcels = values.map((v, i) => {
      const x = parcelX(i);

      return parcel(
        x,
        P ? 0.60 : 0.84,
        0.84,
        delayColor(v)
      );
    });

    const stacks = values.map((v, i) => {
      const x = parcelX(i);
      const count = v / 5;
      const color = delayColor(v);

      if (count === 0) {
        return new M.VGroup(
          ring(
            x,
            STACK_BASE + 0.20,
            color,
            0.13
          )
        );
      }

      return new M.VGroup(
        ...Array.from({ length: count }, (_, j) =>
          rect(
            x,
            STACK_BASE + (j + 0.5) * STACK_PITCH,
            STACK_W,
            STACK_PITCH * 0.81,
            color,
            0.77,
            1
          )
        )
      );
    });

    const labels = values.map((v, i) =>
      txt(
        `${v}`,
        P ? 25 : 23,
        delayColor(v),
        parcelX(i),
        STACK_BASE - 0.31,
        true
      )
    );

    const blockNote = txt(
      '1 block = 5 minutes of delay',
      P ? 16 : 15,
      C.muted,
      CX,
      STACK_BASE - 0.75
    );

    const totalLabel = txt(
      `${values.join(' + ')} = ${total}`,
      P ? 25 : 22,
      C.amber,
      CX,
      P ? -3.88 : -2.47,
      true,
      6.3
    );

    const result = tag(
      `${total} ÷ 4 = ${mean} MIN`,
      C.green,
      CX,
      P ? -4.75 : -2.88,
      P ? 22 : 18,
      6.4
    );

    return {
      floor,
      title,
      parcels,
      stacks,
      labels,
      blockNote,
      totalLabel,
      result,
      values,
      total,
      mean
    };
  }

  function batchObjects(b) {
    return [
      b.floor,
      b.title,
      ...b.parcels,
      ...b.stacks,
      ...b.labels
    ];
  }

  // ------------------------------------------------------------
  // 4–5: first batch
  // ------------------------------------------------------------

  let batch = batchPicture(0);

  await until(S(4));
  await play(
    ...clearPicture(),
    ...put(batch.title, batch.floor),
    lagIn(
      batch.parcels,
      0.18,
      1.25
    ),
    lagIn(
      batch.stacks,
      0.20,
      1.45
    ),
    ...put(...batch.labels, batch.blockNote),
    ...say('FIRST BATCH: 30, 0, 20, 0'),
    ...fbox([
      ['Parcel 1: 30', RED],
      ['Parcel 2:  0', TEAL],
      ['Parcel 3: 20', C.amber],
      ['Parcel 4:  0', TEAL]
    ])
  );

  function equalMeanStack(x, mean, color = C.green) {
    const units = mean / 5;

    const full = Math.floor(units);
    const rest = units - full;

    const parts = [];

    for (let j = 0; j < full; j++) {
      parts.push(
        rect(
          x,
          STACK_BASE + (j + 0.5) * STACK_PITCH,
          STACK_W,
          STACK_PITCH * 0.81,
          color,
          0.75,
          1
        )
      );
    }

    if (rest > 0) {
      const h = STACK_PITCH * rest;

      parts.push(
        rect(
          x,
          STACK_BASE + full * STACK_PITCH + h / 2,
          STACK_W,
          h * 0.81,
          color,
          0.75,
          1
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const equalStacks = Array.from(
    { length: 4 },
    (_, i) =>
      equalMeanStack(parcelX(i), 12.5)
  );

  const equalLabels = Array.from(
    { length: 4 },
    (_, i) =>
      txt(
        '12.5',
        P ? 23 : 21,
        C.green,
        parcelX(i),
        STACK_BASE - 0.31,
        true
      )
  );

  const levelY = STACK_BASE + 2.5 * STACK_PITCH;

  const equalLevel = dashed(
    parcelX(0) - 0.48,
    levelY,
    parcelX(3) + 0.48,
    levelY,
    C.green
  );

  await until(S(5));
  await play(
    ...take(batch.blockNote),

    ...take(
      ...batch.stacks,
      ...batch.labels
    ),

    ...put(
      ...equalStacks,
      ...equalLabels
    ),

    ...draw(equalLevel),

    ...put(batch.totalLabel, batch.result),

    ...say('50 ÷ 4 = 12.5 MINUTES', C.green),

    ...fbox([
      '30 + 0 + 20 + 0',
      ['Total = 50', C.amber],
      '50 ÷ 4',
      ['Batch mean = 12.5', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 6: second batch
  // ------------------------------------------------------------

  batch = batchPicture(1);

  await until(S(6));
  await play(
    ...clearPicture(),
    ...put(batch.floor, batch.title),
    lagIn(
      [...batch.parcels, ...batch.stacks],
      0.12,
      1.75
    ),
    ...put(
      ...batch.labels,
      batch.totalLabel,
      batch.result
    ),
    ...say('SECOND BATCH: MEAN = 10', C.green),
    ...fbox([
      '10 + 0 + 10 + 20',
      ['Total = 40', C.amber],
      '40 ÷ 4',
      ['Batch mean = 10', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 7: third batch
  // ------------------------------------------------------------

  batch = batchPicture(2);

  await until(S(7));
  await play(
    ...clearPicture(),
    ...put(batch.floor, batch.title),
    lagIn(
      [...batch.parcels, ...batch.stacks],
      0.12,
      1.75
    ),
    ...put(
      ...batch.labels,
      batch.totalLabel,
      batch.result
    ),
    ...say('THIRD BATCH: MEAN = 15', C.green),
    ...fbox([
      '10 + 30 + 20 + 0',
      ['Total = 60', C.amber],
      '60 ÷ 4',
      ['Batch mean = 15', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 8: three batches produce three different means
  // ------------------------------------------------------------

  const RESULT_SP = P ? 2.16 : 2.27;
  const RESULT_W = P ? 2.02 : 2.12;
  const RESULT_H = P ? 3.15 : 2.70;

  const RESULT_Y = P ? -0.90 : -0.40;

  function batchResultCard(i) {
    const x = CX + (i - 1) * RESULT_SP;
    const y = RESULT_Y;

    const parts = [
      rounded(
        x,
        y,
        RESULT_W,
        RESULT_H,
        C.cyan
      ),

      txt(
        `BATCH ${i + 1}`,
        17,
        C.violet,
        x,
        y + RESULT_H / 2 - 0.30
      )
    ];

    BATCHES[i].forEach((v, j) => {
      const col = j % 2;
      const row = Math.floor(j / 2);

      const px = x + (col - 0.5) * 0.73;
      const py = y + 0.48 - row * 0.55;

      parts.push(
        parcel(
          px,
          py,
          0.58,
          delayColor(v)
        ),

        txt(
          v,
          13,
          delayColor(v),
          px,
          py - 0.28,
          true
        )
      );
    });

    parts.push(
      txt(
        'MEAN',
        15,
        C.muted,
        x,
        y - 0.70
      ),

      txt(
        MEANS[i],
        P ? 32 : 28,
        C.green,
        x,
        y - RESULT_H / 2 + 0.32,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const batchCards = BATCHES.map((_, i) =>
    batchResultCard(i)
  );

  await until(S(8));
  await play(
    ...clearPicture(),
    lagIn(batchCards, 0.20, 1.5),
    ...say('THREE BATCHES. THREE DIFFERENT MEANS.'),
    ...fbox([
      ['Batch 1 = 12.5', C.green],
      ['Batch 2 = 10', C.green],
      ['Batch 3 = 15', C.green]
    ])
  );

  // ------------------------------------------------------------
  // Histogram layout
  // ------------------------------------------------------------

  // One dot represents one complete batch of four parcels.
  //
  // Each discrete mean has a narrow five-dot-wide stack.
  // Dots fill rows from bottom to top.
  // Every one of the 1,000 batches is represented by a dot.
  //
  // Five dots across keep the largest stack of 197 dots
  // within the laptop frame.

  const XL = CX - (P ? 2.86 : 3.18);
  const XR = CX + (P ? 3.04 : 3.30);

  const HIST_BASE = P ? -3.92 : -2.13;
  const HIST_TOP = P ? 1.14 : 1.12;

  const xx = v =>
    XL + v / 30 * (XR - XL);

  const BIN_SP = xx(2.5) - xx(0);

  const DOT_COLS = 5;

  const DOT_PITCH_X = BIN_SP * 0.145;

  const DOT_PITCH_Y = P ? 0.104 : 0.067;

  const DOT_RADIUS = P ? 0.030 : 0.026;

  const ROW_ORDER = [0, -1, 1, -2, 2];

  function dotPosition(bin, index) {
    const row = Math.floor(index / DOT_COLS);
    const col = index % DOT_COLS;

    return [
      xx(BIN_VALUES[bin]) + ROW_ORDER[col] * DOT_PITCH_X,
      HIST_BASE + (row + 0.5) * DOT_PITCH_Y,
      0
    ];
  }

  function stackTop(count) {
    if (count === 0) return HIST_BASE;

    return HIST_BASE +
      Math.ceil(count / DOT_COLS) * DOT_PITCH_Y;
  }

  function batchMeanDot(
    bin,
    index,
    color = C.cyan,
    radius = DOT_RADIUS
  ) {
    const p = dotPosition(bin, index);

    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 0.94);

    return d;
  }

  function largeMeanDot(value, y, color = C.cyan) {
    return glow(
      xx(value),
      y,
      color,
      P ? 0.12 : 0.10
    );
  }

  function histAxes() {
    const parts = [
      line(
        XL - BIN_SP * 0.40,
        HIST_BASE,
        XR + BIN_SP * 0.40,
        HIST_BASE,
        C.muted,
        2.5
      )
    ];

    for (const v of BIN_VALUES) {
      const x = xx(v);

      parts.push(
        line(
          x,
          HIST_BASE,
          x,
          HIST_BASE - 0.065,
          C.muted,
          1.3
        ),

        ...(v % 5 === 0 ? [txt(
          v,
          P ? 16 : 15,
          C.muted,
          x,
          HIST_BASE - 0.27,
          true
        )] : [])
      );
    }

    parts.push(
      txt(
        'Batch mean delay (minutes)',
        P ? 18 : 17,
        C.cyan,
        CX,
        HIST_BASE - 0.68,
        false,
        6.5
      )
    );

    return new M.VGroup(...parts);
  }

  function histCountScale() {
    const left = XL - BIN_SP * 0.40;

    const parts = [
      line(
        left,
        HIST_BASE,
        left,
        HIST_TOP,
        C.muted,
        1.8
      )
    ];

    for (const count of [50, 100, 150, 200]) {
      const y =
        HIST_BASE +
        count / DOT_COLS * DOT_PITCH_Y;

      parts.push(
        line(
          left - 0.065,
          y,
          left,
          y,
          C.muted,
          1
        ),

        txt(
          count,
          P ? 15 : 15,
          C.muted,
          left - 0.27,
          y,
          true,
          0.50
        ),

        dashed(
          left,
          y,
          XR + BIN_SP * 0.40,
          y,
          C.muted
        )
      );
    }

    parts.push(
      txt(
        'Batches',
        P ? 16 : 15,
        C.muted,
        XL + 0.20,
        HIST_TOP + 0.23
      )
    );

    return new M.VGroup(...parts);
  }

  function nBadge(n) {
    return tag(
      `${fmt(n)} BATCHES`,
      C.violet,
      XR - 0.94,
      HIST_TOP + 0.23,
      P ? 16 : 15,
      2.35
    );
  }

  // ------------------------------------------------------------
  // 9–10: each batch mean becomes one dot
  // ------------------------------------------------------------

  let histogramAxes = histAxes();

  const firstMeanY = P
    ? HIST_BASE + 0.37
    : HIST_BASE + 0.30;

  const firstMeanDots = MEANS.map(v =>
    largeMeanDot(v, firstMeanY)
  );

  const firstMeanLabels = MEANS.map((v, i) =>
    new M.VGroup(
      txt(
        `B${i + 1}`,
        P ? 16 : 15,
        C.violet,
        xx(v),
        firstMeanY + 0.37,
        true
      ),

      txt(
        v,
        P ? 21 : 18,
        C.cyan,
        xx(v),
        firstMeanY + 0.69 + (v === 12.5 ? 0.36 : 0),
        true
      )
    )
  );

  const oneDotNote = tag(
    '1 DOT = 1 BATCH MEAN',
    C.cyan,
    CX,
    P ? -0.65 : 0.80,
    19
  );

  await until(S(9));
  await play(
    ...clearPicture(),
    ...draw(histogramAxes),
    lagIn(firstMeanDots, 0.20, 1.2),
    ...put(...firstMeanLabels, oneDotNote),
    ...say('PUT EACH BATCH MEAN ON THE 0–30 LINE'),
    ...fbox([
      'One batch',
      'Four parcel delays',
      ['One mean = one dot', C.cyan]
    ])
  );

  const variationSpan = doubleArrow(
    xx(10),
    firstMeanY + 1.50,
    xx(15),
    firstMeanY + 1.50,
    C.amber
  );

  const variationText = txt(
    'Different by chance',
    P ? 18 : 17,
    C.amber,
    (xx(10) + xx(15)) / 2,
    firstMeanY + 1.80
  );

  await until(S(10));
  await play(
    ...draw(variationSpan),
    ...put(variationText),
    ...say('THE MEAN CHANGES FROM BATCH TO BATCH', C.amber),
    ...fbox([
      'Same delay model',
      'Same batch size',
      ['Different random draws', C.amber],
      'Different batch means'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 11–14: repeat the experiment 1,000 times
  // ------------------------------------------------------------

  // stageLayers hold only fresh, previously unseen dots.
  // They are built from differences between cumulative
  // counts, so no batch is duplicated or lost.

  function makeStageLayers() {
    const layers = [];

    let previous = Array(13).fill(0);

    for (const stage of STAGES) {
      const newDots = [];

      stage.counts.forEach((count, bin) => {
        for (let j = previous[bin]; j < count; j++) {
          newDots.push(
            batchMeanDot(bin, j)
          );
        }
      });

      layers.push(
        new M.VGroup(...newDots)
      );

      previous = stage.counts.slice();
    }

    return layers;
  }

  const stageLayers = makeStageLayers();

  let currentBadge = nBadge(3);

  const repeatLabel = tag(
    'DRAW → MEAN → REPEAT',
    C.amber,
    CX,
    P ? 0.64 : 0.88,
    19
  );

  await until(S(11));
  await play(
    ...take(
      ...firstMeanDots,
      ...firstMeanLabels,
      variationSpan,
      variationText,
      oneDotNote
    ),
    ...put(stageLayers[0], repeatLabel),
    ...put(currentBadge),
    ...say('SIMULATION: REPEAT THE SAME EXPERIMENT', C.amber),
    ...fbox([
      'Take four parcels',
      'Calculate one mean',
      ['Repeat', C.amber]
    ], C.amber)
  );

  const thousandTarget = tag(
    '1,000 BATCHES × 4 PARCELS',
    C.violet,
    CX,
    P ? 0.11 : 0.42,
    18,
    6.3
  );

  const countScale = histCountScale();

  await until(S(12));
  await play(
    ...take(repeatLabel),
    ...put(thousandTarget),
    ...draw(countScale),
    ...say('SIMULATE 1,000 BATCHES OF FOUR', C.violet),
    ...fbox([
      '1,000 batches',
      '4 parcels per batch',
      ['4,000 simulated delays', C.violet],
      '1,000 batch means'
    ], C.violet)
  );

  // Animate a few new dots falling into their proper bins.
  // These dots are exactly part of the first 25 batches.
  //
  // The within-stage ordering is illustrative; the cumulative
  // counts at each checkpoint are exact.

  const fallingSpecs = [];

  for (let bin = 0; bin < 13; bin++) {
    for (
      let k = STAGES[0].counts[bin];
      k < STAGES[1].counts[bin];
      k++
    ) {
      fallingSpecs.push({ bin, index: k });
    }
  }

  // Interleave bins to avoid drawing a left-to-right
  // accumulation that looks like ordered sampling.

  fallingSpecs.sort((a, b) => {
    const ka = (a.bin * 17 + a.index * 31) % 47;
    const kb = (b.bin * 17 + b.index * 31) % 47;
    return ka - kb;
  });

  const fallingDots = fallingSpecs.map(spec => {
    const p = dotPosition(spec.bin, spec.index);

    return new M.Dot({
      point: [
        p[0],
        P ? 0.86 : 0.97,
        0
      ],
      radius: DOT_RADIUS,
      color: C.cyan
    });
  });

  fallingDots.forEach(d => visible.add(d));

  const nextBadge25 = nBadge(25);

  await until(S(13));
  await play(
    ...take(thousandTarget),

    ...replace(currentBadge, nextBadge25),

    new M.LaggedStart(
      fallingDots.map((d, i) => {
        const spec = fallingSpecs[i];

        return new M.Transform(
          d,
          batchMeanDot(spec.bin, spec.index),
          { runTime: 0.65 }
        );
      }),
      { lagRatio: 0.065, runTime: 3.0 }
    ),

    ...say('DROP EACH NEW MEAN INTO ITS OWN STACK'),

    ...fbox([
      'Same mean?',
      'Stack the dots',
      ['One dot per batch', C.cyan]
    ])
  );

  currentBadge = nextBadge25;

  // The 25-batch checkpoint is already represented by
  // stageLayers[0] and fallingDots.
  //
  // Therefore begin the remaining growth at stage index 2.
  // Never display stageLayers[1] as well.

  const nextBadge1000 = nBadge(1000);

  const growthLayers = stageLayers.slice(2);

  growthLayers.forEach(o => visible.add(o));

  const sandNote = txt(
    'Each grain is one batch mean',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -5.12 : -3.30,
    false,
    6.4
  );

  await until(S(14));
  await play(
    ...replace(currentBadge, nextBadge1000),

    new M.LaggedStart(
      growthLayers.map(layer =>
        new M.FadeIn(layer)
      ),
      { lagRatio: 0.70, runTime: 3.35 }
    ),

    ...put(sandNote),

    ...say('THE PILE GROWS, GRAIN BY GRAIN'),

    ...fbox([
      '25 → 100 → 250',
      '→ 500 → 1,000',
      ['1,000 batch means', C.cyan]
    ])
  );

  currentBadge = nextBadge1000;

  // ------------------------------------------------------------
  // Histogram annotations
  // ------------------------------------------------------------

  function binOutline(
    bin,
    color = C.amber,
    counts = COUNTS
  ) {
    const count = counts[bin];

    const bottom = HIST_BASE;
    const top = stackTop(count);

    return rounded(
      xx(BIN_VALUES[bin]),
      (bottom + top) / 2,
      BIN_SP * 0.88,
      Math.max(0.08, top - bottom + 0.06),
      color,
      color,
      0.035
    );
  }

  function binCountLabel(
    bin,
    color = C.amber,
    counts = COUNTS
  ) {
    const count = counts[bin];

    return txt(
      count,
      P ? 20 : 17,
      color,
      xx(BIN_VALUES[bin]),
      stackTop(count) + (P ? 0.24 : 0.17),
      true,
      BIN_SP * 1.20
    );
  }

  function makeCompleteHistogram() {
    const axes = histAxes();
    const scale = histCountScale();

    const dots = COUNTS.map((count, bin) =>
      new M.VGroup(
        ...Array.from({ length: count }, (_, j) =>
          batchMeanDot(bin, j)
        )
      )
    ).filter((_, bin) => COUNTS[bin] > 0);

    const badge = nBadge(1000);

    return {
      axes,
      scale,
      dots,
      badge
    };
  }

  function histogramObjects(h) {
    return [
      h.axes,
      h.scale,
      ...h.dots,
      h.badge
    ];
  }

  // ------------------------------------------------------------
  // 15: the most frequent batch mean is ten
  // ------------------------------------------------------------

  const modalBin = 4;

  const modeOutline = binOutline(
    modalBin,
    C.amber
  );

  const modeCount = binCountLabel(
    modalBin,
    C.amber
  );

  const modePointer = arrow(
    xx(10) + 0.83,
    stackTop(197) + 0.31,
    xx(10) + BIN_SP * 0.43,
    stackTop(197) - 0.16,
    C.amber,
    0.11
  );

  await until(S(15));
  await play(
    ...draw(modeOutline, modePointer),
    ...put(modeCount),
    ...say('HIGHEST STACK: 197 BATCHES AT TEN', C.amber),
    ...fbox([
      ['Batch mean = 10', C.amber],
      '197 of 1,000 batches',
      'Observed share = 0.197',
      'Most frequent mean'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 16: observed extremes are zero and twenty-five
  // ------------------------------------------------------------

  const lowOutline = binOutline(
    0,
    TEAL
  );

  const highOutline = binOutline(
    10,
    RED
  );

  const lowCount = binCountLabel(0, TEAL);
  const highCount = binCountLabel(10, RED);

  const lowEndpoint = tag(
    'MIN = 0',
    TEAL,
    xx(0) + (P ? 0.42 : 0.70),
    P ? 0.69 : 0.85,
    16,
    1.60
  );

  const highEndpoint = tag(
    'MAX = 25',
    RED,
    xx(25),
    P ? -2.36 : -1.12,
    16,
    1.75
  );

  const zeroBatch = new M.VGroup(
    ...Array.from({ length: 4 }, (_, i) =>
      parcel(
        xx(0) + (P ? 0.42 : 0.70) + (i - 1.5) * (P ? 0.30 : 0.32),
        P ? -0.30 : 0.22,
        P ? 0.27 : 0.30,
        TEAL
      )
    ),

    arrow(
      xx(0) + (P ? 0.30 : 0.50),
      P ? -0.52 : 0.02,
      xx(0),
      stackTop(COUNTS[0]) + (P ? 0.50 : 0.36),
      TEAL,
      0.09
    )
  );

  await until(S(16));
  await play(
    ...take(modeOutline, modeCount, modePointer),
    ...draw(lowOutline, highOutline),
    ...put(
      lowCount,
      highCount,
      lowEndpoint,
      highEndpoint,
      zeroBatch
    ),
    ...say('FEW BATCHES LAND FAR FROM THE MIDDLE', C.amber),
    ...fbox([
      ['Smallest observed: 0', TEAL],
      ['Largest observed: 25', RED],
      '30 is possible',
      'But did not occur here'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 17: centre of the sampling distribution
  // ------------------------------------------------------------

  const trueMeanLine = dashed(
    xx(TRUE_MEAN),
    HIST_BASE,
    xx(TRUE_MEAN),
    HIST_TOP,
    C.amber
  );

  // The two means are almost identical.
  // The true mean line and simulated mean line occupy
  // nearly the same coordinate; do not exaggerate the gap.

  const simulatedMeanLine = line(
    xx(SIM_MEAN),
    HIST_BASE,
    xx(SIM_MEAN),
    HIST_TOP,
    C.green,
    2.5
  );

  const meanMarker = tag(
    `MEAN = ${SIM_MEAN.toFixed(2)}`,
    C.green,
    xx(10) + 1.48,
    P ? 0.91 : 0.90,
    18,
    2.8
  );

  const meanComparison = txt(
    'True mean = 10',
    P ? 17 : 16,
    C.amber,
    xx(10) + 1.48,
    P ? 0.47 : 0.53,
    true,
    2.8
  );

  await until(S(17));
  await play(
    ...take(
      lowOutline,
      highOutline,
      lowCount,
      highCount,
      lowEndpoint,
      highEndpoint,
      zeroBatch
    ),
    ...draw(trueMeanLine, simulatedMeanLine),
    ...put(meanMarker, meanComparison),
    ...say('THE PILE IS CENTRED ALMOST EXACTLY AT TEN', C.green),
    ...fbox([
      'Mean of 1,000 means',
      [`= ${SIM_MEAN.toFixed(2)} minutes`, C.green],
      ['True mean = 10', C.amber],
      'Almost identical'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 18–19: standard deviation of the batch means
  // ------------------------------------------------------------

  const spreadY = P ? 0.62 : 0.80;

  const spreadArrow = doubleArrow(
    xx(SIM_MEAN),
    spreadY,
    xx(SIM_MEAN + SIM_SD),
    spreadY,
    C.violet
  );

  const spreadLabel = tag(
    'SD ≈ 5 MIN',
    C.violet,
    xx(SIM_MEAN + SIM_SD) + (P ? 0.95 : 1.0),
    spreadY,
    P ? 17 : 15,
    2.15
  );

  const spreadLower = dashed(
    xx(SIM_MEAN - SIM_SD),
    HIST_BASE,
    xx(SIM_MEAN - SIM_SD),
    HIST_TOP,
    C.violet
  );

  const spreadUpper = dashed(
    xx(SIM_MEAN + SIM_SD),
    HIST_BASE,
    xx(SIM_MEAN + SIM_SD),
    HIST_TOP,
    C.violet
  );

  await until(S(18));
  await play(
    ...take(meanMarker, meanComparison),
    ...draw(spreadArrow, spreadLower, spreadUpper),
    ...put(spreadLabel),
    ...say('THE WIDTH: ABOUT FIVE MINUTES', C.violet),
    ...fbox([
      ['Standard deviation', C.violet],
      `Simulated = ${SIM_SD.toFixed(2)}`,
      'About 5 minutes',
      'Spread of batch means'
    ], C.violet)
  );

  const middleGuide = tag(
    'MIDDLE',
    C.green,
    xx(10),
    HIST_TOP + 0.24,
    16,
    1.4
  );

  await until(S(19));
  await play(
    ...put(middleGuide),
    new M.Indicate(
      spreadArrow,
      { color: C.violet }
    ),
    ...say('STANDARD DEVIATION = TYPICAL DISTANCE FROM THE MIDDLE', C.violet),
    ...fbox([
      'Middle ≈ 10',
      ['Typical spread ≈ 5', C.violet],
      'Not every mean is',
      'exactly five away'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 20–22: name and explain the sampling distribution
  // ------------------------------------------------------------

  const distributionName = tag(
    'SAMPLING DISTRIBUTION',
    C.cyan,
    CX,
    P ? -4.97 : -2.89,
    P ? 19 : 16,
    6.4
  );

  await until(S(20));
  await play(
    ...take(
      spreadArrow,
      spreadLabel,
      spreadLower,
      spreadUpper,
      middleGuide,
      sandNote
    ),
    ...put(distributionName),
    ...say('SAMPLING DISTRIBUTION OF THE BATCH MEAN'),
    ...fbox([
      ['Sampling distribution', C.cyan],
      'The distribution of',
      'a statistic across',
      'repeated samples'
    ])
  );

  const frequencyFocus = [
    binOutline(2, C.amber),
    binOutline(4, C.amber),
    binOutline(8, C.amber)
  ];

  const frequencyCounts = [
    binCountLabel(2, C.amber),
    binCountLabel(4, C.amber),
    binCountLabel(8, C.amber)
  ];

  await until(S(21));
  await play(
    ...draw(...frequencyFocus),
    ...put(...frequencyCounts),
    ...say('DISTRIBUTION: WHICH VALUES, HOW OFTEN?', C.amber),
    ...fbox([
      ['Which value?', C.cyan],
      'Position on the line',
      ['How often?', C.amber],
      'Height of its stack'
    ], C.amber)
  );

  const samplingIcon = new M.VGroup(
    rounded(
      CX + 2.08,
      P ? -1.46 : -0.14,
      P ? 1.82 : 1.84,
      P ? 1.65 : 1.40,
      C.violet
    ),

    ...Array.from({ length: 4 }, (_, i) =>
      parcel(
        CX + 2.08 + ((i % 2) - 0.5) * 0.58,
        (P ? -1.46 : -0.14) +
          0.26 -
          Math.floor(i / 2) * 0.50,
        0.58,
        C.violet
      )
    ),

    txt(
      'One batch',
      14,
      C.violet,
      CX + 2.08,
      P ? -2.10 : -0.65
    )
  );

  await until(S(22));
  await play(
    ...take(...frequencyFocus, ...frequencyCounts),
    ...put(samplingIcon),
    ...say('SAMPLING MEANS TAKING A BATCH', C.violet),
    ...fbox([
      'One possible batch',
      'Gives one possible mean',
      ['Repeat to see the shape', C.cyan],
      'Of possible batch means'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 23–24: compare individual delays with batch means
  // ------------------------------------------------------------

  // Both comparison panels use identical horizontal
  // delay limits and identical relative-frequency limits.
  // This makes the widths and peak positions comparable.
  //
  // Single-parcel bars use exact model probabilities.
  // Batch-mean bars use the 1,000 simulated frequencies.

  const COMP_L = CX - (P ? 2.72 : 3.05);
  const COMP_R = CX + (P ? 2.96 : 3.25);

  const compX = v =>
    COMP_L + v / 30 * (COMP_R - COMP_L);

  const COMP_PANELS = [
    {
      bottom: P ? -0.61 : -0.27,
      top: P ? 1.03 : 1.02
    },
    {
      bottom: P ? -3.89 : -2.40,
      top: P ? -2.25 : -1.11
    }
  ];

  function comparisonPanel(slot, mode) {
    const p = COMP_PANELS[slot];

    const isBatch = mode === 'batch';

    const py = probability =>
      p.bottom +
      probability / 0.40 * (p.top - p.bottom);

    const title = txt(
      isBatch
        ? 'MEANS OF FOUR PARCELS'
        : 'INDIVIDUAL PARCEL DELAYS',
      P ? 18 : 17,
      isBatch ? C.cyan : C.amber,
      CX,
      p.top + 0.36,
      false,
      6.4
    );

    const parts = [
      title,

      line(
        COMP_L - 0.18,
        p.bottom,
        COMP_R + 0.18,
        p.bottom,
        C.muted,
        2
      ),

      line(
        COMP_L - 0.18,
        p.bottom,
        COMP_L - 0.18,
        p.top,
        C.muted,
        1.8
      )
    ];

    for (const value of [0, 5, 10, 15, 20, 25, 30]) {
      parts.push(
        txt(
          value,
          P ? 15 : 14,
          C.muted,
          compX(value),
          p.bottom - 0.22,
          true
        )
      );
    }

    for (const prob of [0.20, 0.40]) {
      parts.push(
        dashed(
          COMP_L - 0.18,
          py(prob),
          COMP_R + 0.18,
          py(prob),
          C.muted
        ),

        txt(
          `${Math.round(prob * 100)}%`,
          P ? 15 : 15,
          C.muted,
          COMP_L - 0.52,
          py(prob),
          true,
          0.62
        )
      );
    }

    const bars = [];

    if (isBatch) {
      COUNTS.forEach((count, i) => {
        if (count === 0) return;

        const probability = count / SIM_N;
        const h = py(probability) - p.bottom;

        bars.push(
          rect(
            compX(BIN_VALUES[i]),
            p.bottom + h / 2,
            (COMP_R - COMP_L) / 12 * 0.79,
            h,
            C.cyan,
            0.72,
            1
          )
        );
      });
    } else {
      DELAYS.forEach((delay, i) => {
        const h = py(PROBS[i]) - p.bottom;

        bars.push(
          rect(
            compX(delay),
            p.bottom + h / 2,
            P ? 0.39 : 0.43,
            h,
            DELAY_COLORS[i],
            0.76,
            1.5
          )
        );
      });
    }

    const meanLine = dashed(
      compX(10),
      p.bottom,
      compX(10),
      p.top,
      C.green
    );

    return {
      axes: new M.VGroup(...parts),
      bars,
      meanLine,
      py,
      bottom: p.bottom,
      top: p.top
    };
  }

  const singlePanel = comparisonPanel(
    0,
    'single'
  );

  const batchPanel = comparisonPanel(
    1,
    'batch'
  );

  const singleModeRing = ring(
    compX(0),
    singlePanel.py(0.40),
    TEAL,
    0.16
  );

  const comparisonUnits = txt(
    'Both charts use the same scales',
    P ? 17 : 16,
    C.muted,
    CX,
    P ? -4.55 : -3.05,
    false,
    6.6
  );

  await until(S(23));
  await play(
    ...clearPicture(),
    ...put(singlePanel.axes),
    lagIn(singlePanel.bars, 0.18, 1.4),
    ...draw(singleModeRing),
    ...say('SINGLE PARCELS: 0 TO 30, PEAK AT 0', C.amber),
    ...fbox([
      'Individual delays',
      '0, 10, 20, 30',
      ['Most likely: 0', TEAL],
      'Standard deviation = 10'
    ], C.amber)
  );

  const sampleModeRing = ring(
    compX(10),
    batchPanel.py(0.197),
    C.cyan,
    0.14
  );

  const singleSpread = doubleArrow(
    compX(0),
    singlePanel.bottom + 0.20,
    compX(20),
    singlePanel.bottom + 0.20,
    C.amber
  );

  const batchSpread = doubleArrow(
    compX(5),
    batchPanel.bottom + 0.20,
    compX(15),
    batchPanel.bottom + 0.20,
    C.violet
  );

  await until(S(24));
  await play(
    ...put(batchPanel.axes, comparisonUnits),
    lagIn(batchPanel.bars, 0.065, 1.5),
    ...draw(
      singlePanel.meanLine,
      batchPanel.meanLine,
      sampleModeRing,
      singleSpread,
      batchSpread
    ),
    ...say('BATCH MEANS ARE NARROWER, WITH A PEAK NEAR TEN', C.green),
    ...fbox([
      ['Single delays: SD = 10', C.amber],
      ['Batch means: SD ≈ 5', C.violet],
      'Both centred at 10',
      ['Averaging reduces spread', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 25: late and on-time parcels partly balance
  // ------------------------------------------------------------

  const balanceBatch = [30, 0, 10, 0];

  // This is an illustrative possible batch.
  // Its mean is exactly 10.
  // It is not identified as an additional seeded observation.

  const BAL_Y = P ? -1.03 : -0.51;

  const balanceParcels = balanceBatch.map((v, i) =>
    new M.VGroup(
      parcel(
        parcelX(i),
        BAL_Y + 0.84,
        0.90,
        delayColor(v)
      ),

      txt(
        v,
        P ? 25 : 22,
        delayColor(v),
        parcelX(i),
        BAL_Y + 0.28,
        true
      )
    )
  );

  const balanceDeviations = balanceBatch.map((v, i) => {
    const d = v - TRUE_MEAN;

    const color = d > 0
      ? RED
      : d < 0
        ? TEAL
        : C.muted;

    const text =
      d > 0 ? `+${d}` :
      d < 0 ? `−${Math.abs(d)}` :
      '0';

    return new M.VGroup(
      rounded(
        parcelX(i),
        BAL_Y - 0.47,
        0.91,
        0.59,
        color,
        color,
        0.08
      ),

      txt(
        text,
        23,
        color,
        parcelX(i),
        BAL_Y - 0.47,
        true
      )
    );
  });

  const balancingAnswer = tag(
    '30 + 0 + 10 + 0 = 40',
    C.amber,
    CX,
    BAL_Y - 1.28,
    18,
    6.3
  );

  const balancedMean = tag(
    '40 ÷ 4 = 10',
    C.green,
    CX,
    BAL_Y - 1.88,
    21
  );

  const balanceNote = txt(
    'Illustrative possible batch',
    15,
    C.muted,
    CX,
    P ? 1.28 : 1.31
  );

  await until(S(25));
  await play(
    ...clearPicture(),
    ...put(balanceNote),
    lagIn(balanceParcels, 0.14, 1.2),
    lagIn(balanceDeviations, 0.14, 1.2),
    ...put(balancingAnswer, balancedMean),
    ...say('LATE AND ON-TIME PARCELS CAN BALANCE', C.green),
    ...fbox([
      'Relative to mean 10:',
      '+20 − 10 + 0 − 10',
      ['Deviations sum to 0', C.green],
      'Example batch mean = 10'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 26–29: the three-step recipe
  // ------------------------------------------------------------

  const RECIPE_Y = P ? -0.95 : -0.43;

  const RECIPE_SP = P ? 2.22 : 2.30;
  const RECIPE_W = P ? 2.03 : 2.13;
  const RECIPE_H = P ? 3.18 : 2.70;

  function recipeX(i) {
    return CX + (i - 1) * RECIPE_SP;
  }

  const recipeFrames = Array.from(
    { length: 3 },
    (_, i) =>
      rounded(
        recipeX(i),
        RECIPE_Y,
        RECIPE_W,
        RECIPE_H,
        C.muted
      )
  );

  const recipeNumbers = Array.from(
    { length: 3 },
    (_, i) =>
      txt(
        ['1 · TAKE A BATCH', '2 · REPEAT', '3 · PILE UP'][i],
        P ? 16 : 16,
        C.cyan,
        recipeX(i),
        RECIPE_Y + RECIPE_H / 2 - 0.29
      )
  );

  const recipeArrows = [
    arrow(
      recipeX(0) + RECIPE_W / 2,
      RECIPE_Y,
      recipeX(1) - RECIPE_W / 2,
      RECIPE_Y,
      C.amber,
      0.09
    ),

    arrow(
      recipeX(1) + RECIPE_W / 2,
      RECIPE_Y,
      recipeX(2) - RECIPE_W / 2,
      RECIPE_Y,
      C.amber,
      0.09
    )
  ];

  await until(S(26));
  await play(
    ...clearPicture(),
    ...put(...recipeFrames, ...recipeNumbers),
    ...draw(...recipeArrows),
    ...say('THE SAMPLING DISTRIBUTION RECIPE'),
    ...fbox([
      'Three steps',
      'Take a batch',
      'Repeat',
      'Pile up the means'
    ])
  );

  const recipeOne = new M.VGroup(
    ...BATCHES[0].map((v, i) =>
      parcel(
        recipeX(0) + ((i % 2) - 0.5) * 0.63,
        RECIPE_Y + 0.48 - Math.floor(i / 2) * 0.58,
        0.59,
        delayColor(v)
      )
    ),

    txt(
      '÷ 4',
      19,
      C.amber,
      recipeX(0),
      RECIPE_Y - 0.46,
      true
    ),

    txt(
      '12.5',
      25,
      C.green,
      recipeX(0),
      RECIPE_Y - 0.90,
      true
    )
  );

  await until(S(27));
  await play(
    ...put(recipeOne),
    new M.Indicate(
      recipeFrames[0],
      { color: C.green }
    ),
    ...say('STEP ONE: TAKE A BATCH AND COMPUTE ITS MEAN', C.green),
    ...fbox([
      ['Step 1', C.green],
      'Draw 4 parcels',
      'Add their delays',
      'Divide by 4'
    ], C.green)
  );

  const recipeTwo = new M.VGroup(
    ...MEANS.map((v, i) =>
      new M.VGroup(
        rounded(
          recipeX(1),
          RECIPE_Y + 0.58 - i * 0.52,
          1.23,
          0.39,
          C.violet,
          C.violet,
          0.08
        ),

        txt(
          v,
          18,
          C.cyan,
          recipeX(1),
          RECIPE_Y + 0.58 - i * 0.52,
          true
        )
      )
    ),

    txt(
      '… × 1,000',
      18,
      C.violet,
      recipeX(1),
      RECIPE_Y - 1.00,
      true,
      1.65
    )
  );

  await until(S(28));
  await play(
    ...put(recipeTwo),
    new M.Indicate(
      recipeFrames[1],
      { color: C.violet }
    ),
    ...say('STEP TWO: REPEAT MANY TIMES', C.violet),
    ...fbox([
      ['Step 2', C.violet],
      'Repeat the sampling',
      'Compute a fresh mean',
      'For every batch'
    ], C.violet)
  );

  function miniaturePile(x, y, scale = 1) {
    const parts = [];

    const heights = COUNTS.map(c =>
      c / 197
    );

    const spacing = 0.116 * scale;

    const baseline = y - 0.45 * scale;

    parts.push(
      line(
        x - 0.82 * scale,
        baseline,
        x + 0.82 * scale,
        baseline,
        C.muted,
        1.5
      )
    );

    heights.forEach((h, i) => {
      if (h === 0) return;

      const height = h * 1.23 * scale;

      parts.push(
        rect(
          x + (i - 6) * spacing,
          baseline + height / 2,
          spacing * 0.76,
          height,
          C.cyan,
          0.78,
          0.8
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const recipeThree = new M.VGroup(
    miniaturePile(
      recipeX(2),
      RECIPE_Y + 0.05,
      1
    ),

    txt(
      'Look at the shape',
      P ? 16 : 15,
      C.green,
      recipeX(2),
      RECIPE_Y - 0.97,
      false,
      1.80
    )
  );

  await until(S(29));
  await play(
    ...put(recipeThree),
    new M.Indicate(
      recipeFrames[2],
      { color: C.cyan }
    ),
    ...say('STEP THREE: PILE UP ALL THE MEANS'),
    ...fbox([
      ['Step 3', C.cyan],
      'One dot per mean',
      'Stack equal values',
      'Study the distribution'
    ])
  );

  // ------------------------------------------------------------
  // 30–32: what the distribution is for
  // ------------------------------------------------------------

  let fullHistogram = makeCompleteHistogram();

  const trueCentre = dashed(
    xx(TRUE_MEAN),
    HIST_BASE,
    xx(TRUE_MEAN),
    HIST_TOP,
    C.green
  );

  const centreTag = tag(
    'TRUE MEAN = 10',
    C.green,
    xx(10) + 0.67,
    HIST_TOP + 0.25,
    16,
    2.45
  );

  await until(S(30));
  await play(
    ...clearPicture(),
    ...put(...histogramObjects(fullHistogram)),
    ...draw(trueCentre),
    ...put(centreTag),
    ...say('HOW FAR CAN ONE BATCH MEAN LAND FROM TEN?', C.amber),
    ...fbox([
      'The sampling distribution',
      'Shows how much',
      'one batch mean',
      ['can vary by chance', C.amber]
    ], C.amber)
  );

  // Highlight the five-minute interval.
  // Include all five possible mean values:
  // 5, 7.5, 10, 12.5, 15.
  //
  // Observed count = 788.
  // Exact model probability = 0.785.
  //
  // These are different quantities and are labelled separately.

  const rangeLeft = xx(5) - BIN_SP * 0.44;
  const rangeRight = xx(15) + BIN_SP * 0.44;

  const intervalShade = rect(
    (rangeLeft + rangeRight) / 2,
    (HIST_BASE + HIST_TOP) / 2,
    rangeRight - rangeLeft,
    HIST_TOP - HIST_BASE,
    C.green,
    0.075,
    1.7
  );

  const intervalLower = dashed(
    xx(5),
    HIST_BASE,
    xx(5),
    HIST_TOP,
    C.green
  );

  const intervalUpper = dashed(
    xx(15),
    HIST_BASE,
    xx(15),
    HIST_TOP,
    C.green
  );

  const intervalLabel = tag(
    'WITHIN 5 MINUTES OF TEN',
    C.green,
    CX,
    P ? -5.03 : -2.92,
    17,
    6.3
  );

  const empiricalLabel = tag(
    `${WITHIN_FIVE} / 1,000`,
    C.green,
    xx(22.5),
    P ? -0.21 : 0.33,
    18,
    2.55
  );

  const exactProbabilityLabel = txt(
    'Exact chance: 78.5%',
    P ? 16 : 15,
    C.muted,
    xx(22.5),
    P ? -0.69 : -0.04,
    false,
    2.75
  );

  await until(S(31));
  await play(
    ...put(
      intervalShade,
      intervalLabel,
      empiricalLabel,
      exactProbabilityLabel
    ),
    ...draw(intervalLower, intervalUpper),
    ...say('ABOUT EIGHT IN TEN MEANS LAND BETWEEN FIVE AND FIFTEEN', C.green),
    ...fbox([
      '5 ≤ batch mean ≤ 15',
      [`Simulation: ${WITHIN_FIVE}/1,000`, C.green],
      'Exact chance = 0.785',
      ['About 8 in 10', C.green]
    ], C.green)
  );

  const ordinaryOutline = binOutline(
    5,
    C.amber
  );

  const ordinaryValue = tag(
    '12.5 IS ORDINARY',
    C.amber,
    xx(12.5) + 1.28,
    stackTop(COUNTS[5]) + 0.38,
    17,
    2.80
  );

  const ordinaryPointer = arrow(
    xx(12.5) + 0.56,
    stackTop(COUNTS[5]) + 0.27,
    xx(12.5) + 0.08,
    stackTop(COUNTS[5]) - 0.05,
    C.amber,
    0.11
  );

  await until(S(32));
  await play(
    ...take(empiricalLabel, exactProbabilityLabel),
    ...draw(ordinaryOutline, ordinaryPointer),
    ...put(ordinaryValue),
    ...say('A MEAN OF 12.5 IS NOT SURPRISING', C.green),
    ...fbox([
      'Morning batch = 12.5',
      'True mean = 10',
      ['Only 2.5 minutes away', C.green],
      'Quite ordinary here'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 33–34: trap — four delays are not four batch means
  // ------------------------------------------------------------

  const TRAP_W = P ? 6.15 : 6.40;

  const TRAP_TOP_Y = P ? 0.30 : 0.49;
  const TRAP_BOTTOM_Y = P ? -2.88 : -1.61;

  const oneBatchPanel = rounded(
    CX,
    TRAP_TOP_Y,
    TRAP_W,
    P ? 2.25 : 1.58,
    C.amber
  );

  const oneBatchTitle = txt(
    'INSIDE ONE BATCH',
    P ? 20 : 18,
    C.amber,
    CX,
    TRAP_TOP_Y + (P ? 0.79 : 0.51)
  );

  const trapParcels = BATCHES[0].map((v, i) => {
    const x = parcelX(i);

    return new M.VGroup(
      parcel(
        x,
        TRAP_TOP_Y,
        P ? 0.76 : 0.65,
        delayColor(v)
      ),

      txt(
        v,
        P ? 20 : 18,
        delayColor(v),
        x,
        TRAP_TOP_Y - (P ? 0.52 : 0.43),
        true
      )
    );
  });

  const batchMeansPanel = rounded(
    CX,
    TRAP_BOTTOM_Y,
    TRAP_W,
    P ? 2.65 : 1.87,
    C.cyan
  );

  const batchMeansTitle = txt(
    'ACROSS MANY BATCHES',
    P ? 20 : 18,
    C.cyan,
    CX,
    TRAP_BOTTOM_Y + (P ? 0.97 : 0.66)
  );

  const trapPile = miniaturePile(
    CX,
    TRAP_BOTTOM_Y - (P ? 0.30 : 0.30),
    P ? 1.20 : 0.85
  );

  const trapQuestion = tag(
    'DO NOT CONFUSE THESE',
    PINK,
    CX,
    P ? -1.15 : -0.56,
    18,
    5.9
  );

  await until(S(33));
  await play(
    ...clearPicture(),
    ...put(
      oneBatchPanel,
      oneBatchTitle,
      batchMeansPanel,
      batchMeansTitle,
      trapPile,
      trapQuestion
    ),
    lagIn(trapParcels, 0.14, 1.1),
    ...say('TRAP: DELAYS INSIDE A BATCH ARE NOT BATCH MEANS', PINK),
    ...fbox([
      ['Inside one batch', C.amber],
      'Individual parcel delays',
      ['Across many batches', C.cyan],
      'One mean per batch'
    ], PINK)
  );

  const fourDelaysTag = tag(
    '4 DELAYS',
    C.amber,
    CX - 2.12,
    TRAP_TOP_Y - (P ? 0.82 : 0.54),
    15,
    1.8
  );

  const thousandMeansTag = tag(
    '1,000 MEANS',
    C.cyan,
    CX + 1.98,
    TRAP_BOTTOM_Y - (P ? 0.88 : 0.62),
    15,
    2.05
  );

  await until(S(34));
  await play(
    ...put(fourDelaysTag, thousandMeansTag),
    new M.Indicate(
      oneBatchPanel,
      { color: C.amber }
    ),
    new M.Indicate(
      batchMeansPanel,
      { color: C.cyan }
    ),
    ...say('ONE BATCH HAS FOUR DELAYS. ONE DOT IS ITS MEAN.'),
    ...fbox([
      ['One batch: 4 delays', C.amber],
      'One batch mean',
      ['1,000 batches: 1,000 means', C.cyan],
      'Not 1,000 parcel delays'
    ])
  );

  // ------------------------------------------------------------
  // 35: one observed sample versus all possible samples
  // ------------------------------------------------------------

  // The cards on the right represent alternative possible
  // batches under the same parcel-delay model.
  //
  // These alternatives are illustrative, not additional
  // identified draws from the seeded simulation.

  const alternativeBatches = [
    [0, 0, 10, 10],
    [10, 0, 10, 20],
    [30, 0, 20, 0],
    [10, 30, 20, 0],
    [20, 10, 20, 10],
    [0, 0, 0, 0]
  ];

  const ACTUAL_X = P ? CX : CX - 1.98;
  const ACTUAL_Y = P ? 0.26 : -0.38;

  const ACTUAL_W = P ? 5.75 : 2.72;
  const ACTUAL_H = P ? 1.92 : 2.84;

  const actualParts = [
    rounded(
      ACTUAL_X,
      ACTUAL_Y,
      ACTUAL_W,
      ACTUAL_H,
      C.green
    ),

    txt(
      'TODAY: ONE BATCH',
      P ? 19 : 17,
      C.green,
      ACTUAL_X,
      ACTUAL_Y + ACTUAL_H / 2 - 0.28,
      false,
      ACTUAL_W - 0.25
    )
  ];

  BATCHES[0].forEach((v, i) => {
    const x = P
      ? ACTUAL_X + (i - 1.5) * 0.85
      : ACTUAL_X + ((i % 2) - 0.5) * 0.78;

    const y = P
      ? ACTUAL_Y + 0.04
      : ACTUAL_Y + 0.42 - Math.floor(i / 2) * 0.68;

    actualParts.push(
      parcel(x, y, 0.69, delayColor(v)),

      txt(
        v,
        15,
        delayColor(v),
        x,
        y - 0.29,
        true
      )
    );
  });

  actualParts.push(
    txt(
      'Mean = 12.5',
      P ? 22 : 20,
      C.green,
      ACTUAL_X,
      ACTUAL_Y - ACTUAL_H / 2 + 0.27,
      true
    )
  );

  const actualBatchCard = new M.VGroup(...actualParts);

  const POSSIBLE_X = P ? CX : CX + 1.60;
  const POSSIBLE_Y = P ? -2.39 : -0.38;

  const possiblePanel = rounded(
    POSSIBLE_X,
    POSSIBLE_Y,
    P ? 5.75 : 3.83,
    P ? 2.85 : 2.84,
    C.violet
  );

  const possibleTitle = txt(
    'OTHER POSSIBLE BATCHES',
    P ? 19 : 17,
    C.violet,
    POSSIBLE_X,
    POSSIBLE_Y + 1.10,
    false,
    P ? 5.4 : 3.55
  );

  const alternativeCards = alternativeBatches.map((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = POSSIBLE_X +
      (col - 0.5) * (P ? 2.52 : 1.72);

    const y =
      POSSIBLE_Y + 0.53 - row * 0.63;

    const mean =
      b.reduce((a, v) => a + v, 0) / 4;

    const w = P ? 2.36 : 1.59;

    return new M.VGroup(
      rounded(
        x,
        y,
        w,
        0.53,
        C.muted,
        C.card,
        0.75
      ),

      txt(
        b.join(' · '),
        13,
        C.muted,
        x,
        y + 0.11,
        true,
        w - 0.14
      ),

      txt(
        `Mean ${mean}`,
        15,
        C.cyan,
        x,
        y - 0.12,
        true,
        w - 0.14
      )
    );
  });

  const possibleNote = txt(
    'Illustrative alternative batches',
    14,
    C.muted,
    POSSIBLE_X,
    POSSIBLE_Y - 1.09,
    false,
    P ? 5.4 : 3.55
  );

  const realLifeNote = txt(
    'Usually we observe only one of these possibilities',
    P ? 17 : 16,
    C.muted,
    CX,
    P ? -4.60 : -2.35,
    false,
    6.5
  );

  await until(S(35));
  await play(
    ...clearPicture(),
    ...put(
      actualBatchCard,
      possiblePanel,
      possibleTitle
    ),
    lagIn(alternativeCards, 0.15, 1.8),
    ...put(possibleNote, realLifeNote),
    ...say('WE SEE ONE BATCH, BUT MANY OTHERS COULD HAVE OCCURRED', C.violet),
    ...fbox([
      ['Reality: one observed batch', C.green],
      'Sampling distribution:',
      'All possible batch means',
      'And their chances'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 36: final visual summary
  // ------------------------------------------------------------

  const finalHistogram = makeCompleteHistogram();

  const finalCentre = dashed(
    xx(TRUE_MEAN),
    HIST_BASE,
    xx(TRUE_MEAN),
    HIST_TOP,
    C.green
  );

  const finalRange = rect(
    (rangeLeft + rangeRight) / 2,
    (HIST_BASE + HIST_TOP) / 2,
    rangeRight - rangeLeft,
    HIST_TOP - HIST_BASE,
    C.green,
    0.065,
    1.5
  );

  const finalLower = dashed(
    xx(5),
    HIST_BASE,
    xx(5),
    HIST_TOP,
    C.violet
  );

  const finalUpper = dashed(
    xx(15),
    HIST_BASE,
    xx(15),
    HIST_TOP,
    C.violet
  );

  const finalSpreadY = P ? 0.62 : 0.80;

  const finalSpread = doubleArrow(
    xx(10),
    finalSpreadY,
    xx(15),
    finalSpreadY,
    C.violet
  );

  const finalSpreadLabel = tag(
    'SD ≈ 5',
    C.violet,
    xx(15) + 0.80,
    finalSpreadY,
    16,
    1.65
  );

  const finalMeanLabel = tag(
    'CENTRE ≈ 10',
    C.green,
    xx(10) + 1.0,
    HIST_TOP + 0.23,
    16,
    2.25
  );

  const finalRecipe = tag(
    'SAMPLE → MEAN → REPEAT → PILE',
    C.cyan,
    CX,
    P ? -5.03 : -2.91,
    P ? 17 : 15,
    6.4
  );

  await until(S(36));
  await play(
    ...clearPicture(),

    ...put(finalRange),

    ...put(
      ...histogramObjects(finalHistogram)
    ),

    ...draw(
      finalCentre,
      finalLower,
      finalUpper,
      finalSpread
    ),

    ...put(
      finalSpreadLabel,
      finalMeanLabel,
      finalRecipe
    ),

    ...say('SAMPLING DISTRIBUTION: HOW MUCH ONE BATCH MEAN CAN VARY', C.green),

    ...fbox([
      ['Sampling distribution', C.cyan],
      'Repeat batches of four',
      'Pile up their means',
      ['Centre ≈ 10, SD ≈ 5', C.green]
    ], C.green)
  );
}

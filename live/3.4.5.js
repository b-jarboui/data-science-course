// lesson 3.4.5
// Functions: one reusable recipe for summarising greenhouse readings.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved live-engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const MONDAY = [16, 20, 24, 20];
  const TUESDAY = [18, 22, 26, 22];

  const MON_SUMMARY = [16, 24, 20];
  const TUE_SUMMARY = [18, 26, 22];

  const TIMES = ['6 am', 'Noon', '6 pm', 'Midnight'];
  const SUMMARY_NAMES = ['Lowest', 'Highest', 'Mean'];
  const SUMMARY_COLORS = [C.cyan, C.amber, C.green];

  const FUNCTION_CODE = [
    ['def daily_summary(values):', C.violet],
    ['    lowest = min(values)', C.cyan],
    ['    highest = max(values)', C.amber],
    ['    mean = sum(values) / len(values)', C.green],
    ['    return lowest, highest, mean', C.ink]
  ];

  // ------------------------------------------------------------
  // Responsive layout.
  // Phone: 8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const PILL = P ? [0, 3.65, 0] : [0, 1.85, 0];

  const ROW_Y = P ? 0.65 : 0.15;
  const ROW_SP = P ? 1.45 : 1.90;
  const ROW_BW = P ? 1.24 : 1.62;
  const ROW_BH = P ? 1.30 : 1.02;

  const INTRO_WORK_Y = P ? -3.30 : -2.25;
  const INTRO_WORK_W = P ? 6.60 : 9.40;
  const INTRO_WORK_H = P ? 1.45 : 0.90;

  // Function layout: recipe on the left, input and output on the
  // right on laptop. On phone, everything is stacked vertically.

  const RX = P ? 0 : -3.10;
  const RY = P ? 0.10 : -0.65;
  const RW = P ? 7.40 : 6.45;
  const RH = P ? 3.55 : 3.50;

  const IX = P ? 0 : 3.42;
  const IY = P ? 2.57 : 0.70;
  const IW = P ? 7.40 : 5.65;
  const IH = P ? 1.04 : 1.32;

  const WX = IX;
  const WY = P ? -2.30 : -0.61;
  const WW = IW;
  const WH = P ? 0.94 : 0.88;

  const OX = IX;
  const OY = P ? -3.88 : -1.96;
  const OW = IW;
  const OH = P ? 1.55 : 1.20;

  const RTOP = RY + RH / 2;
  const RBOTTOM = RY - RH / 2;

  const CODE_TOP = RTOP - 0.83;
  const CODE_LH = P ? 0.43 : 0.42;

  const BIND_Y = RBOTTOM + 0.31;
  const BIND_P = [RX + 0.68, BIND_Y, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Visible-object management.
  // Never regroup objects that are already on screen.
  // Every VGroup below is constructed from fresh objects.
  // ------------------------------------------------------------

  const visible = new Map();

  function put(key, obj, runTime = 0.45) {
    const a = [];

    if (visible.has(key)) {
      a.push(
        new M.FadeOut(
          visible.get(key),
          { runTime }
        )
      );
    }

    visible.set(key, obj);

    a.push(
      new M.FadeIn(obj, { runTime })
    );

    return a;
  }

  function drop(...keys) {
    const a = [];

    for (const key of keys) {
      if (!visible.has(key)) continue;

      a.push(
        new M.FadeOut(
          visible.get(key),
          { runTime: 0.40 }
        )
      );

      visible.delete(key);
    }

    return a;
  }

  function clear() {
    return drop(...Array.from(visible.keys()));
  }

  function mark(key, color = C.amber, runTime = 0.75) {
    const obj = visible.get(key);

    return obj
      ? [
          new M.Indicate(
            obj,
            { color, runTime }
          )
        ]
      : [];
  }

  function transform(key, target, options = {}) {
    if (!visible.has(key)) {
      return put(key, target);
    }

    return [
      new M.Transform(
        visible.get(key),
        target,
        options
      )
    ];
  }

  function fit(t, maxw) {
    const w = t.getWidth();

    if (w > maxw) {
      t.scale(maxw / w);
    }

    return t;
  }

  function text(s, size, color, p, mono = false, maxw = FW - 1) {
    const t = fit(
      T(s, size, color, mono),
      maxw
    );

    t.moveTo(p);

    return t;
  }

  function rect(
    w,
    h,
    p,
    color = C.cyan,
    fill = C.card,
    opacity = 0.95,
    sw = 2
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: sw
    });

    r.setFill(fill, opacity);
    r.moveTo(p);

    return r;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function arrow(a, b, color = C.amber, head = 0.16) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const ux = dx / d;
    const uy = dy / d;
    const w = head * 0.60;

    return new M.VGroup(
      line(a, b, color, 2),

      line(
        b,
        [
          b[0] - head * ux - w * uy,
          b[1] - head * uy + w * ux,
          0
        ],
        color,
        2
      ),

      line(
        b,
        [
          b[0] - head * ux + w * uy,
          b[1] - head * uy - w * ux,
          0
        ],
        color,
        2
      )
    );
  }

  function tag(s, color, p, size = 17, maxw = FW - 1) {
    const t = pill(s, color, size);

    fit(t, maxw);
    t.moveTo(p);

    return t;
  }

  function arrayString(values) {
    return `[${values.join(', ')}]`;
  }

  // ------------------------------------------------------------
  // Formula and explanation boxes.
  // ------------------------------------------------------------

  function formulaBox(lines, p, w, h, color = C.cyan, size = 22) {
    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98
    );

    const lh = Math.min(
      P ? 0.43 : 0.31,
      (h - 0.18) / Math.max(lines.length, 1)
    );

    const rows = lines.map((item, i) => {
      const row = Array.isArray(item)
        ? item
        : [item, C.ink];

      return text(
        row[0],
        size,
        row[1],
        [
          p[0],
          p[1] + ((lines.length - 1) / 2 - i) * lh,
          0
        ],
        true,
        w - 0.40
      );
    });

    return new M.VGroup(frame, ...rows);
  }

  function introWork(lines, color = C.cyan) {
    return formulaBox(
      lines,
      [0, INTRO_WORK_Y, 0],
      INTRO_WORK_W,
      INTRO_WORK_H,
      color,
      lines.length > 1
        ? (P ? 23 : 20)
        : (P ? 28 : 25)
    );
  }

  function functionWork(lines, color = C.violet) {
    return formulaBox(
      lines,
      [WX, WY, 0],
      WW,
      WH,
      color,
      lines.length > 1
        ? (P ? 22 : 20)
        : (P ? 25 : 23)
    );
  }

  // ------------------------------------------------------------
  // Clock picture: four readings over one day.
  // ------------------------------------------------------------

  function clock(p, hour, color = C.cyan, radius = 0.49) {
    const face = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    face.setFill(C.card, 0.98);
    face.moveTo(p);

    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = Math.PI / 2 - i * Math.PI / 6;

      return line(
        [
          p[0] + radius * 0.82 * Math.cos(a),
          p[1] + radius * 0.82 * Math.sin(a),
          0
        ],
        [
          p[0] + radius * 0.96 * Math.cos(a),
          p[1] + radius * 0.96 * Math.sin(a),
          0
        ],
        C.muted,
        1
      );
    });

    const hourAngle =
      Math.PI / 2 - (hour % 12) * Math.PI / 6;

    const hourHand = line(
      p,
      [
        p[0] + radius * 0.52 * Math.cos(hourAngle),
        p[1] + radius * 0.52 * Math.sin(hourAngle),
        0
      ],
      color,
      3
    );

    const minuteHand = line(
      p,
      [p[0], p[1] + radius * 0.74, 0],
      C.ink,
      2
    );

    const center = new M.Dot({
      point: p,
      radius: 0.045,
      color
    });

    return new M.VGroup(
      face,
      ...ticks,
      hourHand,
      minuteHand,
      center
    );
  }

  function timePicture(i, single = false) {
    const x = single
      ? 0
      : (i - 1.5) * ROW_SP;

    const y = ROW_Y + 0.15;

    const color = i === 1
      ? C.amber
      : C.cyan;

    const face = clock(
      [x, y, 0],
      [6, 12, 18, 0][i],
      color,
      single ? 0.70 : (P ? 0.43 : 0.50)
    );

    const label = text(
      TIMES[i],
      P ? 18 : 20,
      color,
      [x, y - (single ? 1.03 : 0.76), 0],
      false,
      single ? 3.5 : ROW_SP - 0.10
    );

    const dayPart = text(
      ['Morning', 'Midday', 'Evening', 'Night'][i],
      P ? 15 : 16,
      C.muted,
      [x, y + (single ? 1.04 : 0.83), 0],
      false,
      single ? 3.5 : ROW_SP - 0.12
    );

    return new M.VGroup(
      face,
      label,
      dayPart
    );
  }

  // ------------------------------------------------------------
  // Reading boxes: four values in their original time order.
  // ------------------------------------------------------------

  const rowX = i => (i - 1.5) * ROW_SP;

  function readingFrame(i, color = C.cyan) {
    const p = [rowX(i), ROW_Y, 0];

    const halo = rect(
      ROW_BW + 0.10,
      ROW_BH + 0.10,
      p,
      color,
      color,
      0.055,
      1
    );

    const frame = rect(
      ROW_BW,
      ROW_BH,
      p,
      color,
      C.card,
      0.97,
      2
    );

    return new M.VGroup(halo, frame);
  }

  function readingValue(i, v, color = C.cyan) {
    return text(
      String(v),
      P ? 39 : 40,
      color,
      [rowX(i), ROW_Y, 0],
      true,
      ROW_BW - 0.16
    );
  }

  function readingTime(i, color = C.muted) {
    return text(
      TIMES[i],
      P ? 17 : 19,
      color,
      [
        rowX(i),
        ROW_Y + ROW_BH / 2 + 0.29,
        0
      ],
      false,
      ROW_SP - 0.08
    );
  }

  function readingIndex(i) {
    return text(
      String(i),
      16,
      C.muted,
      [
        rowX(i),
        ROW_Y - ROW_BH / 2 - 0.27,
        0
      ],
      true
    );
  }

  function readingFocus(i, color = C.amber) {
    return rect(
      ROW_BW + 0.14,
      ROW_BH + 0.15,
      [rowX(i), ROW_Y, 0],
      color,
      C.card,
      0,
      3
    );
  }

  function dailyArray(name, values) {
    const a = [];

    for (let i = 0; i < 4; i++) {
      a.push(
        ...put(`readingFrame${i}`, readingFrame(i)),
        ...put(`readingValue${i}`, readingValue(i, values[i])),
        ...put(`readingTime${i}`, readingTime(i)),
        ...put(`readingIndex${i}`, readingIndex(i))
      );
    }

    const nameP = P
      ? [0, 2.35, 0]
      : [-1.5 * ROW_SP - ROW_BW / 2 - 0.95, ROW_Y, 0];

    a.push(
      ...put(
        'arrayName',
        tag(
          name,
          C.violet,
          nameP,
          21
        )
      )
    );

    return a;
  }

  // ------------------------------------------------------------
  // Three summary boxes: lowest, highest and mean.
  // ------------------------------------------------------------

  function summaryCard(
    i,
    value,
    p,
    w,
    h,
    active = true
  ) {
    const color = active
      ? SUMMARY_COLORS[i]
      : C.muted;

    const frame = rect(
      w,
      h,
      p,
      color,
      active ? color : C.card,
      active ? 0.09 : 0.96,
      active ? 2 : 1
    );

    const label = text(
      SUMMARY_NAMES[i],
      P ? 19 : 18,
      color,
      [
        p[0],
        p[1] + h * 0.26,
        0
      ],
      false,
      w - 0.14
    );

    const n = text(
      value === null ? '—' : String(value),
      P ? 32 : 28,
      color,
      [
        p[0],
        p[1] - h * 0.15,
        0
      ],
      true,
      w - 0.18
    );

    return new M.VGroup(
      frame,
      label,
      n
    );
  }

  function introSummary(values) {
    const y = P ? -1.70 : -1.30;
    const sp = P ? 1.90 : 2.40;
    const w = P ? 1.72 : 2.13;
    const h = P ? 1.25 : 0.80;

    const cards = values.map((v, i) =>
      summaryCard(
        i,
        v,
        [(i - 1) * sp, y, 0],
        w,
        h,
        v !== null
      )
    );

    return new M.VGroup(...cards);
  }

  // ------------------------------------------------------------
  // Notebook code card.
  // Match the approved reference's left-aligned monospaced text.
  // Leading spaces are preserved as indentation.
  // ------------------------------------------------------------

  function codeRows(rows, p, maxw, size, lh) {
    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const items = rows.map(item => {
      const row = Array.isArray(item)
        ? item
        : [item, C.ink];

      const indent =
        row[0].length - row[0].trimStart().length;

      const obj = T(
        row[0].trimStart(),
        size,
        row[1],
        true
      );

      return {
        obj,
        indent,
        width: obj.getWidth() + indent * cw
      };
    });

    const widest = Math.max(
      0.001,
      ...items.map(item => item.width)
    );

    const scale = Math.min(
      1,
      maxw / widest
    );

    return items.map((item, i) => {
      if (scale < 1) {
        item.obj.scale(scale);
      }

      item.obj.moveTo([
        p[0] +
          item.indent * cw * scale +
          item.obj.getWidth() / 2,

        p[1] - i * lh,

        0
      ]);

      return item.obj;
    });
  }

  function notebookCell(
    rows,
    p,
    w,
    h,
    title = 'In [ ]',
    color = C.cyan,
    size = P ? 23 : 22
  ) {
    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98
    );

    const top = p[1] + h / 2;

    const label = text(
      title,
      15,
      C.muted,
      [
        p[0] - w / 2 + 0.78,
        top - 0.25,
        0
      ],
      true,
      1.35
    );

    const run = text(
      '▶ RUN',
      14,
      C.muted,
      [
        p[0] + w / 2 - 0.62,
        top - 0.25,
        0
      ],
      true
    );

    const separator = line(
      [
        p[0] - w / 2 + 0.20,
        top - 0.48,
        0
      ],
      [
        p[0] + w / 2 - 0.20,
        top - 0.48,
        0
      ],
      C.muted,
      1
    );

    const lh = Math.min(
      P ? 0.49 : 0.45,
      (h - 0.60) / Math.max(rows.length, 1)
    );

    const code = codeRows(
      rows,
      [
        p[0] - w / 2 + 0.30,
        top - 0.73,
        0
      ],
      w - 0.60,
      size,
      lh
    );

    return new M.VGroup(
      frame,
      label,
      run,
      separator,
      ...code
    );
  }

  function repeatedCode(day) {
    return [
      [`lowest = min(${day})`, C.cyan],
      [`highest = max(${day})`, C.amber],
      [`mean = sum(${day}) / len(${day})`, C.green]
    ];
  }

  function manualNotebook(day, values) {
    const p = P
      ? [0, -0.45, 0]
      : [0, -0.38, 0];

    const w = P ? 6.55 : 9.60;
    const h = P ? 3.45 : 3.25;

    const rows = [
      [`${day} = ${arrayString(values)}`, C.violet],
      ...repeatedCode(day)
    ];

    return notebookCell(
      rows,
      p,
      w,
      h,
      'In [1]',
      C.cyan,
      P ? 24 : 25
    );
  }

  function duplicatePosition(i) {
    return P
      ? [0, i === 0 ? 1.25 : -1.45, 0]
      : [i === 0 ? -3.18 : 3.18, -0.45, 0];
  }

  function duplicateCell(i) {
    const day = i === 0
      ? 'monday'
      : 'tuesday';

    return notebookCell(
      repeatedCode(day),
      duplicatePosition(i),
      P ? 6.55 : 6.00,
      P ? 2.25 : 2.65,
      i === 0 ? 'Monday' : 'Tuesday',
      C.cyan,
      P ? 22 : 20
    );
  }

  function duplicateError(i) {
    const p = duplicatePosition(i);
    const w = P ? 6.55 : 6.00;
    const h = P ? 2.25 : 2.65;

    return rect(
      w - 0.33,
      P ? 0.45 : 0.42,
      [
        p[0],
        p[1] + h / 2 - 0.73,
        0
      ],
      C.amber,
      C.card,
      0,
      3
    );
  }

  // ------------------------------------------------------------
  // Picture of many duplicated notebook cells.
  // ------------------------------------------------------------

  function manyCopies() {
    const cols = P ? 5 : 9;
    const rows = P ? 4 : 3;

    const dx = P ? 1.17 : 1.10;
    const dy = P ? 0.95 : 0.78;

    const y = P ? 0.20 : -0.35;

    const copies = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x =
          (c - (cols - 1) / 2) * dx;

        const cy =
          y + ((rows - 1) / 2 - r) * dy;

        const frame = rect(
          dx * 0.84,
          dy * 0.77,
          [x, cy, 0],
          C.cyan,
          C.card,
          0.94,
          1
        );

        const strokes = [0.17, 0, -0.17].map(
          (offset, j) =>
            line(
              [
                x - dx * 0.30,
                cy + offset,
                0
              ],
              [
                x + dx * (j === 2 ? 0.17 : 0.30),
                cy + offset,
                0
              ],
              SUMMARY_COLORS[j],
              1
            )
        );

        copies.push(
          new M.VGroup(
            frame,
            ...strokes
          )
        );
      }
    }

    const more = text(
      '…',
      30,
      C.violet,
      [
        0,
        y - rows * dy / 2 - 0.26,
        0
      ],
      true
    );

    return new M.VGroup(
      ...copies,
      more
    );
  }

  // ------------------------------------------------------------
  // Kitchen recipe metaphor.
  // One physical card; fresh ingredients for every use.
  // ------------------------------------------------------------

  const KX = P ? 0 : -2.45;
  const KY = P ? 0.95 : -0.35;
  const KW = P ? 4.60 : 4.50;
  const KH = P ? 3.00 : 3.50;

  const ING_X = P ? 0 : 2.85;
  const ING_Y = P ? -2.15 : 0.35;

  function kitchenRecipe() {
    const p = [KX, KY, 0];

    const frame = rect(
      KW,
      KH,
      p,
      C.violet,
      C.card,
      0.98
    );

    const top = KY + KH / 2;

    const title = text(
      'RECIPE',
      P ? 28 : 29,
      C.violet,
      [KX, top - 0.40, 0]
    );

    const separator = line(
      [KX - KW / 2 + 0.28, top - 0.78, 0],
      [KX + KW / 2 - 0.28, top - 0.78, 0],
      C.violet,
      1
    );

    const steps = [
      '1. Prepare ingredients',
      '2. Follow the steps',
      '3. Serve the result'
    ];

    const rows = steps.map((s, i) =>
      text(
        s,
        P ? 21 : 23,
        C.ink,
        [
          KX,
          top - 1.16 - i * 0.54,
          0
        ],
        false,
        KW - 0.55
      )
    );

    const footer = text(
      'Written once',
      17,
      C.muted,
      [KX, KY - KH / 2 + 0.25, 0]
    );

    return new M.VGroup(
      frame,
      title,
      separator,
      ...rows,
      footer
    );
  }

  function ingredientPicture(day = 'Monday') {
    const p = [ING_X, ING_Y, 0];

    const colors = day === 'Monday'
      ? [C.green, C.amber, C.green, C.cyan]
      : [C.amber, C.green, C.cyan, C.amber];

    const ingredients = colors.map((color, i) => {
      const dx = (i - 1.5) * 0.49;

      const ball = new M.Circle({
        radius: 0.19,
        color,
        strokeWidth: 2
      });

      ball.setFill(color, 0.55);

      ball.moveTo([
        p[0] + dx,
        p[1] + 0.20 + (i % 2) * 0.15,
        0
      ]);

      return ball;
    });

    const bowl = new M.Arc({
      radius: 1.05,
      startAngle: Math.PI,
      angle: Math.PI,
      color: C.ink,
      strokeWidth: 3
    });

    bowl.moveTo([
      p[0],
      p[1] - 0.40,
      0
    ]);

    const rim = line(
      [p[0] - 1.05, p[1] + 0.13, 0],
      [p[0] + 1.05, p[1] + 0.13, 0],
      C.ink,
      3
    );

    const label = text(
      `${day}'s ingredients`,
      P ? 19 : 21,
      C.cyan,
      [
        p[0],
        p[1] - 1.10,
        0
      ],
      false,
      4.0
    );

    return new M.VGroup(
      ...ingredients,
      bowl,
      rim,
      label
    );
  }

  function recipeMetaphorArrow() {
    if (P) {
      return arrow(
        [0, ING_Y + 0.65, 0],
        [0, KY - KH / 2 - 0.10, 0],
        C.amber
      );
    }

    return arrow(
      [ING_X - 1.22, ING_Y, 0],
      [KX + KW / 2 + 0.15, ING_Y, 0],
      C.amber
    );
  }

  // ------------------------------------------------------------
  // The named recipe becomes the Python function.
  // ------------------------------------------------------------

  function recipeFrame(rowCount = 0, mode = 'code') {
    const frame = rect(
      RW,
      RH,
      [RX, RY, 0],
      C.violet,
      C.card,
      0.98,
      2
    );

    const title = text(
      mode === 'recipe'
        ? 'daily_summary'
        : 'FUNCTION · daily_summary',
      P ? 23 : 22,
      C.violet,
      [
        RX,
        RTOP - 0.29,
        0
      ],
      true,
      RW - 0.52
    );

    const divider = line(
      [
        RX - RW / 2 + 0.24,
        RTOP - 0.57,
        0
      ],
      [
        RX + RW / 2 - 0.24,
        RTOP - 0.57,
        0
      ],
      C.violet,
      1
    );

    const content = [];

    if (mode === 'recipe') {
      const steps = [
        ['1. Find the lowest reading', C.cyan],
        ['2. Find the highest reading', C.amber],
        ['3. Calculate the mean', C.green]
      ];

      content.push(
        ...steps.map(([s, color], i) =>
          text(
            s,
            P ? 22 : 23,
            color,
            [
              RX,
              RTOP - 1.05 - i * 0.63,
              0
            ],
            false,
            RW - 0.52
          )
        )
      );
    } else if (rowCount > 0) {
      content.push(
        ...codeRows(
          FUNCTION_CODE.slice(0, rowCount),
          [
            RX - RW / 2 + 0.31,
            CODE_TOP,
            0
          ],
          RW - 0.62,
          P ? 25 : 22,
          CODE_LH
        )
      );
    }

    const bindingFrame = rect(
      RW - 0.40,
      0.43,
      [
        RX,
        BIND_Y,
        0
      ],
      C.muted,
      C.card,
      0.98,
      1
    );

    const bindingName = text(
      'values →',
      P ? 20 : 19,
      C.violet,
      [
        RX - RW / 2 + 1.02,
        BIND_Y,
        0
      ],
      true,
      1.55
    );

    return new M.VGroup(
      frame,
      title,
      divider,
      ...content,
      bindingFrame,
      bindingName
    );
  }

  function bindingValue(values = null, color = C.cyan) {
    return text(
      values
        ? arrayString(values)
        : 'waiting for input',
      P ? 21 : 20,
      values ? color : C.muted,
      BIND_P,
      true,
      RW - 2.30
    );
  }

  function recipeHighlight(i, color = C.amber) {
    return rect(
      RW - 0.38,
      P ? 0.39 : 0.37,
      [
        RX,
        CODE_TOP - i * CODE_LH,
        0
      ],
      color,
      C.card,
      0,
      2
    );
  }

  function focusRecipe(i, color = C.amber) {
    return put(
      'recipeHighlight',
      recipeHighlight(i, color),
      0.30
    );
  }

  function bindingOutline(color = C.violet) {
    return rect(
      RW - 0.30,
      0.51,
      [
        RX,
        BIND_Y,
        0
      ],
      color,
      C.card,
      0,
      2
    );
  }

  // ------------------------------------------------------------
  // Input panel.
  // The displayed input changes independently of the recipe.
  // ------------------------------------------------------------

  function inputPanel(
    day = null,
    values = null,
    options = {}
  ) {
    const color = options.color || C.cyan;

    const frame = rect(
      IW,
      IH,
      [IX, IY, 0],
      color,
      C.card,
      0.98
    );

    let heading = 'INPUT';

    if (options.call && day) {
      heading = `daily_summary(${day})`;
    } else if (day) {
      heading = `${day.toUpperCase()} · INPUT`;
    }

    const title = text(
      heading,
      P ? 20 : 21,
      options.call ? C.violet : color,
      [
        IX,
        IY + IH * 0.24,
        0
      ],
      !!options.call,
      IW - 0.40
    );

    const objects = [frame, title];

    if (values) {
      const n = text(
        arrayString(values),
        P ? 23 : 24,
        C.cyan,
        [
          IX,
          IY - IH * 0.17,
          0
        ],
        true,
        IW - 0.44
      );

      objects.push(n);
    } else {
      objects.push(
        text(
          options.placeholder || 'Bring a day of readings',
          P ? 17 : 18,
          C.muted,
          [
            IX,
            IY - IH * 0.20,
            0
          ],
          false,
          IW - 0.44
        )
      );
    }

    return new M.VGroup(...objects);
  }

  function inputOutline(color = C.amber) {
    return rect(
      IW + 0.10,
      IH + 0.10,
      [IX, IY, 0],
      color,
      C.card,
      0,
      2
    );
  }

  // ------------------------------------------------------------
  // Output panel.
  // No answer is displayed until the function is called.
  // ------------------------------------------------------------

  function outputPanel(values = null, day = null, options = {}) {
    const color = options.color ||
      (values ? C.green : C.muted);

    const frame = rect(
      OW,
      OH,
      [OX, OY, 0],
      color,
      C.card,
      0.98
    );

    const heading = text(
      day
        ? `${day.toUpperCase()} · OUTPUT`
        : 'OUTPUT',
      P ? 19 : 18,
      color,
      [
        OX,
        OY + OH / 2 - 0.20,
        0
      ],
      false,
      OW - 0.35
    );

    const sp = (OW - 0.48) / 3;
    const w = sp - 0.12;

    const h = P ? 0.96 : 0.70;
    const cy = OY - 0.14;

    const cards = SUMMARY_NAMES.map((_, i) =>
      summaryCard(
        i,
        values ? values[i] : null,
        [
          OX + (i - 1) * sp,
          cy,
          0
        ],
        w,
        h,
        !!values
      )
    );

    return new M.VGroup(
      frame,
      heading,
      ...cards
    );
  }

  function outputOutline(color = C.amber) {
    return rect(
      OW + 0.10,
      OH + 0.10,
      [OX, OY, 0],
      color,
      C.card,
      0,
      2
    );
  }

  function functionFlow() {
    const arrows = [];

    if (P) {
      arrows.push(
        arrow(
          [0, IY - IH / 2 - 0.03, 0],
          [0, RTOP + 0.03, 0],
          C.cyan,
          0.10
        )
      );

      arrows.push(
        arrow(
          [0, WY - WH / 2 - 0.04, 0],
          [0, OY + OH / 2 + 0.04, 0],
          C.green,
          0.11
        )
      );
    } else {
      const rightEdge = RX + RW / 2;
      const leftEdge = IX - IW / 2;

      arrows.push(
        arrow(
          [leftEdge - 0.02, IY, 0],
          [rightEdge + 0.02, IY, 0],
          C.cyan,
          0.08
        )
      );

      arrows.push(
        arrow(
          [rightEdge + 0.02, OY, 0],
          [leftEdge - 0.02, OY, 0],
          C.green,
          0.08
        )
      );
    }

    return new M.VGroup(...arrows);
  }

  // ------------------------------------------------------------
  // Preview: notebook cells running from top to bottom.
  // ------------------------------------------------------------

  function notebookPreview() {
    const w = P ? 5.90 : 7.40;
    const h = P ? 5.20 : 3.85;

    const p = P
      ? [0, -0.25, 0]
      : [0, -0.40, 0];

    const frame = rect(
      w,
      h,
      p,
      C.muted,
      C.card,
      0.96
    );

    const title = text(
      'greenhouse.ipynb',
      P ? 23 : 23,
      C.ink,
      [
        p[0],
        p[1] + h / 2 - 0.35,
        0
      ],
      true
    );

    const labels = [
      ['1', 'readings', C.cyan],
      ['2', 'offset', C.amber],
      ['3', 'calibrated', C.green],
      ['4', 'mean', C.violet]
    ];

    const cellH = P ? 0.77 : 0.56;
    const spacing = P ? 0.99 : 0.70;

    const cells = [];

    labels.forEach(([n, s, color], i) => {
      const y =
        p[1] + h / 2 - 1.03 - i * spacing;

      cells.push(
        rect(
          w - 0.55,
          cellH,
          [p[0], y, 0],
          color,
          C.card,
          0.98,
          1
        ),

        text(
          `[${n}]`,
          16,
          C.muted,
          [
            p[0] - w / 2 + 0.72,
            y,
            0
          ],
          true
        ),

        text(
          s,
          P ? 23 : 22,
          color,
          [p[0], y, 0],
          true
        ),

        text(
          '✓',
          P ? 24 : 21,
          C.green,
          [
            p[0] + w / 2 - 0.66,
            y,
            0
          ]
        )
      );
    });

    return new M.VGroup(
      frame,
      title,
      ...cells
    );
  }

  // ============================================================
  // 0-4: From one noon reading to four readings per day.
  // ============================================================

  // 0. Until now, we used one reading per day, at noon.
  await until(S(0));

  await play(
    ...put(
      'noon',
      timePicture(1, true)
    ),

    ...put(
      'work',
      introWork([
        ['ONE READING PER DAY', C.cyan],
        ['At 12:00 noon', C.muted]
      ])
    ),

    ...say('ONE NOON READING EACH DAY')
  );

  // 1. In fact, the sensor records four times a day.
  await until(S(1));

  const fourClocks = TIMES.map(
    (_, i) => timePicture(i)
  );

  fourClocks.forEach((obj, i) => {
    visible.set(`clock${i}`, obj);
  });

  await play(
    ...drop('noon'),

    new M.LaggedStart(
      fourClocks.map(obj => new M.FadeIn(obj)),
      {
        lagRatio: 0.12,
        runTime: 1.35
      }
    ),

    ...put(
      'work',
      introWork([
        ['4 READINGS PER DAY', C.cyan],
        ['One every six hours', C.ink]
      ])
    ),

    ...say('FOUR READINGS IN ONE DAY')
  );

  // 2. Six in the morning, noon, six in the evening, midnight.
  await until(S(2));

  await play(
    new M.LaggedStart(
      fourClocks.map(obj =>
        new M.Indicate(
          obj,
          {
            color: C.amber,
            runTime: 0.75
          }
        )
      ),
      {
        lagRatio: 0.45,
        runTime: 3.30
      }
    ),

    ...put(
      'work',
      introWork([
        ['6 am · Noon · 6 pm · Midnight', C.cyan],
        ['Four times, in order', C.muted]
      ])
    ),

    ...say('MORNING → NOON → EVENING → NIGHT', C.amber)
  );

  // 3. Monday: sixteen, twenty, twenty-four, twenty.
  await until(S(3));

  const oldClocks = clear();

  await play(
    ...oldClocks,

    ...dailyArray('monday', MONDAY),

    ...put(
      'work',
      introWork([
        ['monday = [16, 20, 24, 20]', C.cyan],
        ['Four temperatures in °C', C.muted]
      ])
    ),

    ...say('MONDAY’S FOUR READINGS')
  );

  await until(S(3) + 1.30);

  await play(
    new M.LaggedStart(
      MONDAY.map((_, i) =>
        new M.Indicate(
          visible.get(`readingValue${i}`),
          {
            color: C.cyan,
            runTime: 0.55
          }
        )
      ),
      {
        lagRatio: 0.28,
        runTime: 2.55
      }
    )
  );

  // 4. The second value, twenty, is the familiar noon reading.
  await until(S(4));

  await play(
    ...put(
      'readingFocus',
      readingFocus(1, C.amber)
    ),

    ...put(
      'readingTime1',
      readingTime(1, C.amber)
    ),

    ...mark('readingValue1', C.amber),

    ...put(
      'work',
      introWork([
        ['MONDAY AT NOON = 20°C', C.amber],
        ['The same reading from our weekly array', C.ink]
      ], C.amber)
    ),

    ...say('THE NOON READING WE ALREADY KNOW', C.amber)
  );

  // ============================================================
  // 5-12: Calculate Monday's summary by hand.
  // ============================================================

  // 5. The boss wants the lowest, highest and mean.
  await until(S(5));

  await play(
    ...drop('readingFocus'),

    ...put(
      'readingTime1',
      readingTime(1)
    ),

    ...put(
      'summary',
      introSummary([null, null, null])
    ),

    ...put(
      'work',
      introWork([
        ['THREE NUMBERS FOR EACH DAY', C.violet],
        ['Lowest · Highest · Mean', C.ink]
      ], C.violet)
    ),

    ...say('A SHORT DAILY SUMMARY', C.violet)
  );

  // 6. Work it out for Monday, step by step.
  await until(S(6));

  await play(
    ...put(
      'work',
      introWork([
        ['MONDAY', C.cyan],
        ['Find each of the three results', C.ink]
      ])
    ),

    ...say('LET’S DO MONDAY BY HAND', C.amber)
  );

  // 7. The lowest of the four is sixteen.
  await until(S(7));

  await play(
    ...put(
      'readingFocus',
      readingFocus(0, C.cyan)
    ),

    ...put(
      'summary',
      introSummary([16, null, null])
    ),

    ...put(
      'work',
      introWork([
        ['LOWEST READING', C.cyan],
        ['16°C', C.cyan]
      ])
    ),

    ...say('LOWEST = 16°C')
  );

  // 8. The highest is twenty-four.
  await until(S(8));

  await play(
    ...put(
      'readingFocus',
      readingFocus(2, C.amber)
    ),

    ...put(
      'summary',
      introSummary([16, 24, null])
    ),

    ...put(
      'work',
      introWork([
        ['HIGHEST READING', C.amber],
        ['24°C', C.amber]
      ], C.amber)
    ),

    ...say('HIGHEST = 24°C', C.amber)
  );

  // 9. For the mean, add everything and divide by how many.
  await until(S(9));

  await play(
    ...drop('readingFocus'),

    ...put(
      'allReadings',
      rect(
        ROW_SP * 3 + ROW_BW + 0.16,
        ROW_BH + 0.15,
        [0, ROW_Y, 0],
        C.green,
        C.card,
        0,
        2
      )
    ),

    ...put(
      'work',
      introWork([
        ['mean = sum ÷ count', C.ink],
        ['Add all four values, then divide by 4', C.green]
      ], C.green)
    ),

    ...say('MEAN = ADD, THEN DIVIDE', C.green)
  );

  // 10. Sixteen plus twenty plus twenty-four plus twenty is eighty.
  await until(S(10));

  await play(
    new M.LaggedStart(
      MONDAY.map((_, i) =>
        new M.Indicate(
          visible.get(`readingValue${i}`),
          {
            color: C.amber,
            runTime: 0.60
          }
        )
      ),
      {
        lagRatio: 0.30,
        runTime: 2.65
      }
    ),

    ...put(
      'work',
      introWork([
        ['16 + 20 + 24 + 20', C.ink],
        ['SUM = 80', C.amber]
      ], C.amber)
    ),

    ...say('MONDAY’S TOTAL = 80', C.amber)
  );

  // 11. Eighty divided by four readings is twenty.
  await until(S(11));

  await play(
    ...put(
      'summary',
      introSummary(MON_SUMMARY)
    ),

    ...put(
      'work',
      introWork([
        ['80 ÷ 4', C.ink],
        ['MEAN = 20°C', C.green]
      ], C.green)
    ),

    ...say('MEAN = 20°C', C.green)
  );

  // 12. Monday's summary: lowest 16, highest 24, mean 20.
  await until(S(12));

  await play(
    ...drop('allReadings'),

    ...mark('summary', C.green),

    ...put(
      'work',
      introWork([
        ['MONDAY’S SUMMARY', C.violet],
        ['16, 24, 20', C.green]
      ], C.green)
    ),

    ...say('MONDAY: LOW 16 · HIGH 24 · MEAN 20', C.green)
  );

  // ============================================================
  // 13-17: Repeated notebook calculations become a problem.
  // ============================================================

  // 13. Three lines of code: lowest, highest and mean.
  await until(S(13));

  await play(
    ...clear(),

    ...put(
      'manualCode',
      manualNotebook('monday', MONDAY)
    ),

    ...say('THREE CALCULATIONS IN CODE')
  );

  await until(S(13) + 2.50);

  await play(
    ...mark('manualCode', C.cyan),

    ...put(
      'manualResult',
      formulaBox(
        [
          ['Lowest 16 · Highest 24 · Mean 20', C.green]
        ],
        [
          0,
          P ? -2.78 : -2.55,
          0
        ],
        P ? 6.45 : 9.40,
        P ? 0.90 : 0.55,
        C.green,
        P ? 21 : 19
      )
    )
  );

  // 14. Tuesday: eighteen, twenty-two, twenty-six, twenty-two.
  await until(S(14));

  await play(
    ...clear(),

    ...dailyArray('tuesday', TUESDAY),

    ...put(
      'work',
      introWork([
        ['tuesday = [18, 22, 26, 22]', C.cyan],
        ['A different day, the same three questions', C.ink]
      ])
    ),

    ...say('TUESDAY’S FOUR READINGS')
  );

  // 15. Copy the three lines and swap in Tuesday's array.
  await until(S(15));

  await play(
    ...clear(),

    ...put(
      'mondayCode',
      duplicateCell(0)
    ),

    ...put(
      'tuesdayCode',
      duplicateCell(1)
    ),

    ...say('COPY THE SAME THREE LINES?', C.amber)
  );

  // 16. A whole year would need 365 copies.
  await until(S(16));

  await play(
    ...clear(),

    ...put(
      'copies',
      manyCopies()
    ),

    ...put(
      'work',
      introWork([
        ['365 DAYS', C.amber],
        ['365 copies of the same calculation?', C.ink]
      ], C.amber)
    ),

    ...say('TOO MUCH DUPLICATED CODE', C.amber)
  );

  // 17. One mistake must be fixed in every single copy.
  await until(S(17));

  await play(
    ...clear(),

    ...put(
      'mondayCode',
      duplicateCell(0)
    ),

    ...put(
      'tuesdayCode',
      duplicateCell(1)
    ),

    ...put(
      'error0',
      duplicateError(0)
    ),

    ...put(
      'error1',
      duplicateError(1)
    ),

    ...say('ONE MISTAKE · MANY PLACES TO FIX', C.amber)
  );

  // ============================================================
  // 18-22: Introduce the recipe metaphor and the named function.
  // ============================================================

  // 18. A better way: think of a kitchen recipe card.
  await until(S(18));

  await play(
    ...clear(),

    ...put(
      'kitchenRecipe',
      kitchenRecipe()
    ),

    ...say('A BETTER WAY: ONE RECIPE CARD', C.violet)
  );

  // 19. Write the card once; bring fresh ingredients each time.
  await until(S(19));

  await play(
    ...put(
      'ingredients',
      ingredientPicture('Monday')
    ),

    ...put(
      'ingredientArrow',
      recipeMetaphorArrow()
    ),

    ...say('SAME RECIPE · FRESH INGREDIENTS', C.violet)
  );

  await until(S(19) + 2.60);

  await play(
    ...put(
      'ingredients',
      ingredientPicture('Tuesday')
    ),

    ...mark('kitchenRecipe', C.violet),

    ...say('THE CARD DOES NOT CHANGE', C.green)
  );

  // 20. Write the three steps once and name the card daily_summary.
  await until(S(20));

  await play(
    ...clear(),

    ...put(
      'recipe',
      recipeFrame(0, 'recipe')
    ),

    ...put(
      'binding',
      bindingValue()
    ),

    ...put(
      'input',
      inputPanel()
    ),

    ...put(
      'work',
      functionWork([
        ['WRITE THE STEPS ONCE', C.violet],
        ['Give the recipe a name', C.ink]
      ])
    ),

    ...say('THE RECIPE IS CALLED daily_summary', C.violet)
  );

  // 21. A named recipe is called a function.
  await until(S(21));

  await play(
    ...mark('recipe', C.violet),

    ...put(
      'work',
      functionWork([
        ['FUNCTION', C.violet],
        ['A named, reusable recipe', C.ink]
      ])
    ),

    ...say('FUNCTION = A NAMED RECIPE', C.violet)
  );

  // 22. The placeholder name values stands for whichever day arrives.
  await until(S(22));

  await play(
    ...put(
      'bindingHighlight',
      bindingOutline(C.amber)
    ),

    ...put(
      'work',
      functionWork([
        ['values = PLACEHOLDER NAME', C.amber],
        ['Whichever day we hand in', C.ink]
      ], C.amber)
    ),

    ...say('values STANDS FOR THE INPUT', C.amber)
  );

  // ============================================================
  // 23-27: Build the Python function without executing it.
  // ============================================================

  // 23. Define daily_summary, taking values.
  await until(S(23));

  await play(
    ...drop('bindingHighlight'),

    ...put(
      'recipe',
      recipeFrame(1)
    ),

    ...focusRecipe(0, C.violet),

    ...put(
      'work',
      functionWork([
        ['def = DEFINE A FUNCTION', C.violet],
        ['values is its input name', C.ink]
      ])
    ),

    ...say('DEFINE THE RECIPE', C.violet)
  );

  // 24. The three steps: lowest, highest and mean of values.
  await until(S(24));

  await play(
    ...put(
      'recipe',
      recipeFrame(2)
    ),

    ...focusRecipe(1, C.cyan),

    ...put(
      'work',
      functionWork([
        ['min(values)', C.cyan],
        ['Find the lowest reading', C.ink]
      ], C.cyan)
    ),

    ...say('THE SAME THREE CALCULATIONS')
  );

  await until(S(24) + 1.80);

  await play(
    ...put(
      'recipe',
      recipeFrame(3)
    ),

    ...focusRecipe(2, C.amber),

    ...put(
      'work',
      functionWork([
        ['max(values)', C.amber],
        ['Find the highest reading', C.ink]
      ], C.amber)
    )
  );

  await until(S(24) + 3.70);

  await play(
    ...put(
      'recipe',
      recipeFrame(4)
    ),

    ...focusRecipe(3, C.green),

    ...put(
      'work',
      functionWork([
        ['sum(values) / len(values)', C.green],
        ['Add everything, divide by the count', C.ink]
      ], C.green)
    )
  );

  // 25. Return the three results: hand them back.
  await until(S(25));

  await play(
    ...put(
      'recipe',
      recipeFrame(5)
    ),

    ...focusRecipe(4, C.green),

    ...put(
      'output',
      outputPanel()
    ),

    ...put(
      'work',
      functionWork([
        ['return = HAND BACK THE RESULTS', C.green],
        ['lowest, highest, mean', C.ink]
      ], C.green)
    ),

    ...say('RETURN = HAND THE ANSWERS BACK', C.green)
  );

  // 26. What goes in is input; what comes back is output.
  await until(S(26));

  await play(
    ...drop('recipeHighlight'),

    ...put(
      'flow',
      functionFlow()
    ),

    ...put(
      'work',
      functionWork([
        ['INPUT → FUNCTION → OUTPUT', C.violet],
        ['Data in, results out', C.ink]
      ])
    ),

    ...say('INPUT IN · OUTPUT OUT', C.violet)
  );

  // 27. Writing the card does not compute anything yet.
  await until(S(27));

  await play(
    ...mark('recipe', C.violet),

    ...put(
      'work',
      functionWork([
        ['RECIPE STORED', C.violet],
        ['No input yet. No calculation yet.', C.muted]
      ])
    ),

    ...say('DEFINING IS NOT RUNNING', C.amber)
  );

  // ============================================================
  // 28-35: Call the function with Tuesday and follow the steps.
  // ============================================================

  // 28. Write daily_summary with Tuesday in brackets.
  await until(S(28));

  await play(
    ...put(
      'input',
      inputPanel(
        'tuesday',
        TUESDAY,
        { call: true }
      )
    ),

    ...put(
      'work',
      functionWork([
        ['daily_summary(tuesday)', C.violet],
        ['Use the recipe on Tuesday', C.ink]
      ])
    ),

    ...say('USE THE FUNCTION WITH tuesday', C.violet)
  );

  // 29. Using a function like this is calling it.
  await until(S(29));

  await play(
    ...put(
      'inputHighlight',
      inputOutline(C.violet)
    ),

    ...put(
      'work',
      functionWork([
        ['FUNCTION CALL', C.violet],
        ['Name the recipe and supply an input', C.ink]
      ])
    ),

    ...say('CALLING = USING THE FUNCTION', C.violet)
  );

  // 30. Tuesday's readings slide in, in place of values.
  await until(S(30));

  const tuesdayInputCopy = text(
    arrayString(TUESDAY),
    P ? 23 : 24,
    C.cyan,
    [
      IX,
      IY - IH * 0.17,
      0
    ],
    true,
    IW - 0.44
  );

  visible.set(
    'flyingInput',
    tuesdayInputCopy
  );

  await play(
    ...drop('inputHighlight'),

    new M.FadeIn(
      tuesdayInputCopy,
      { runTime: 0.25 }
    ),

    ...put(
      'work',
      functionWork([
        ['values receives Tuesday’s readings', C.cyan]
      ], C.cyan)
    ),

    ...say('TUESDAY BECOMES values')
  );

  await play(
    ...drop('binding'),

    new M.Transform(
      tuesdayInputCopy,
      bindingValue(TUESDAY),
      {
        pathArc: P ? 0.30 : -0.30,
        runTime: 1.0
      }
    ),

    ...put(
      'bindingHighlight',
      bindingOutline(C.cyan)
    )
  );

  visible.delete('flyingInput');
  visible.set('binding', tuesdayInputCopy);

  // 31. Step one: the lowest is eighteen.
  await until(S(31));

  await play(
    ...drop('bindingHighlight'),

    ...focusRecipe(1, C.cyan),

    ...put(
      'work',
      functionWork([
        ['min([18, 22, 26, 22])', C.ink],
        ['lowest = 18', C.cyan]
      ], C.cyan)
    ),

    ...say('STEP 1: LOWEST = 18°C')
  );

  // 32. Step two: the highest is twenty-six.
  await until(S(32));

  await play(
    ...focusRecipe(2, C.amber),

    ...put(
      'work',
      functionWork([
        ['max([18, 22, 26, 22])', C.ink],
        ['highest = 26', C.amber]
      ], C.amber)
    ),

    ...say('STEP 2: HIGHEST = 26°C', C.amber)
  );

  // 33. Step three: eighteen plus twenty-two plus twenty-six
  // plus twenty-two gives eighty-eight.
  await until(S(33));

  await play(
    ...focusRecipe(3, C.green),

    ...put(
      'work',
      functionWork([
        ['18 + 22 + 26 + 22', C.ink],
        ['sum = 88', C.amber]
      ], C.amber)
    ),

    ...say('STEP 3: FIND THE TOTAL', C.amber)
  );

  // 34. Eighty-eight divided by four is twenty-two.
  await until(S(34));

  await play(
    ...put(
      'work',
      functionWork([
        ['88 ÷ 4', C.ink],
        ['mean = 22', C.green]
      ], C.green)
    ),

    ...say('MEAN = 22°C', C.green)
  );

  // 35. Return Tuesday's summary: 18, 26, 22.
  await until(S(35));

  await play(
    ...focusRecipe(4, C.green),

    ...put(
      'output',
      outputPanel(
        TUE_SUMMARY,
        'Tuesday'
      )
    ),

    ...put(
      'work',
      functionWork([
        ['return 18, 26, 22', C.green],
        ['Three results handed back', C.ink]
      ], C.green)
    ),

    ...say('TUESDAY: LOW 18 · HIGH 26 · MEAN 22', C.green)
  );

  // ============================================================
  // 36-39: Reuse exactly the same function.
  // ============================================================

  // 36. Calling it with Monday gives 16, 24, 20.
  await until(S(36));

  await play(
    ...drop('recipeHighlight'),

    ...put(
      'input',
      inputPanel(
        'monday',
        MONDAY,
        { call: true }
      )
    ),

    ...put(
      'binding',
      bindingValue(MONDAY)
    ),

    ...put(
      'output',
      outputPanel()
    ),

    ...put(
      'work',
      functionWork([
        ['NEW INPUT: monday', C.cyan],
        ['The same recipe runs again', C.ink]
      ], C.cyan)
    ),

    ...say('NOW CALL IT WITH MONDAY')
  );

  await until(S(36) + 1.90);

  await play(
    ...focusRecipe(4, C.green),

    ...put(
      'output',
      outputPanel(
        MON_SUMMARY,
        'Monday'
      )
    ),

    ...put(
      'work',
      functionWork([
        ['return 16, 24, 20', C.green],
        ['Exactly our original hand calculation', C.ink]
      ], C.green)
    ),

    ...say('MONDAY: LOW 16 · HIGH 24 · MEAN 20', C.green)
  );

  // 37. Same card, different day, nothing copied.
  await until(S(37));

  await play(
    ...drop('recipeHighlight'),

    ...mark('recipe', C.violet),

    ...put(
      'work',
      functionWork([
        ['SAME RECIPE', C.violet],
        ['Different input, different output', C.ink]
      ])
    ),

    ...say('NOT ONE LINE OF THE RECIPE COPIED', C.green)
  );

  // 38. Reuse one calculation on any number of inputs.
  await until(S(38));

  await play(
    ...put(
      'work',
      functionWork([
        ['ONE FUNCTION', C.violet],
        ['2 days, 7 days, or 365 days', C.ink]
      ])
    ),

    ...say('ONE RECIPE · MANY INPUTS', C.violet)
  );

  await until(S(38) + 2.50);

  await play(
    ...put(
      'input',
      inputPanel(
        'tuesday',
        TUESDAY,
        { call: true }
      )
    ),

    ...put(
      'binding',
      bindingValue(TUESDAY)
    ),

    ...put(
      'output',
      outputPanel(
        TUE_SUMMARY,
        'Tuesday'
      )
    )
  );

  // 39. Fix or improve the function in one place.
  await until(S(39));

  await play(
    ...focusRecipe(3, C.amber),

    ...put(
      'work',
      functionWork([
        ['IMPROVE THE RECIPE IN ONE PLACE', C.amber],
        ['Every future call uses that version', C.ink]
      ], C.amber)
    ),

    ...say('ONE PLACE TO FIX OR IMPROVE', C.green)
  );

  // ============================================================
  // 40-44: Common trap — giving the function the wrong input.
  // ============================================================

  // 40. A function only works on what you hand it.
  await until(S(40));

  await play(
    ...drop('recipeHighlight'),

    ...put(
      'inputHighlight',
      inputOutline(C.amber)
    ),

    ...put(
      'work',
      functionWork([
        ['COMMON TRAP', C.amber],
        ['The recipe uses the input it receives', C.ink]
      ], C.amber)
    ),

    ...say('COMMON TRAP: THE WRONG INPUT', C.amber)
  );

  // 41. You meant Tuesday but typed Monday.
  await until(S(41));

  await play(
    ...put(
      'input',
      inputPanel(
        'monday',
        MONDAY,
        {
          call: true,
          color: C.amber
        }
      )
    ),

    ...put(
      'binding',
      bindingValue(MONDAY, C.amber)
    ),

    ...put(
      'output',
      outputPanel()
    ),

    ...put(
      'work',
      functionWork([
        ['WANTED: tuesday', C.green],
        ['TYPED:  monday', C.amber]
      ], C.amber)
    ),

    ...say('THE WRONG DAY WAS HANDED IN', C.amber)
  );

  // 42. The output is 16, 24, 20. It looks normal.
  await until(S(42));

  await play(
    ...focusRecipe(4, C.green),

    ...put(
      'output',
      outputPanel(
        MON_SUMMARY,
        'Monday'
      )
    ),

    ...put(
      'work',
      functionWork([
        ['OUTPUT: 16, 24, 20', C.green],
        ['Valid numbers, but not Tuesday’s', C.amber]
      ], C.amber)
    ),

    ...say('A BELIEVABLE BUT WRONG-DAY RESULT', C.amber)
  );

  // 43. No warning: the card did its job on the wrong day.
  await until(S(43));

  await play(
    ...drop('recipeHighlight'),

    ...put(
      'outputHighlight',
      outputOutline(C.amber)
    ),

    ...put(
      'work',
      functionWork([
        ['THE FUNCTION WORKED CORRECTLY', C.green],
        ['The input was the mistake', C.amber]
      ], C.amber)
    ),

    ...say('NO ERROR DOES NOT MEAN CORRECT', C.amber)
  );

  // 44. Check what goes in, not only what comes out.
  await until(S(44));

  await play(
    ...drop(
      'inputHighlight',
      'outputHighlight'
    ),

    ...put(
      'input',
      inputPanel(
        'tuesday',
        TUESDAY,
        {
          call: true,
          color: C.green
        }
      )
    ),

    ...put(
      'binding',
      bindingValue(TUESDAY)
    ),

    ...put(
      'output',
      outputPanel(
        TUE_SUMMARY,
        'Tuesday'
      )
    ),

    ...put(
      'work',
      functionWork([
        ['✓ INPUT: tuesday', C.green],
        ['✓ OUTPUT: 18, 26, 22', C.green]
      ], C.green)
    ),

    ...say('CHECK THE INPUT AND THE OUTPUT', C.green)
  );

  // ============================================================
  // 45-46: Preview reproducibility and close with the definition.
  // ============================================================

  // 45. Next lesson: check that the notebook works top to bottom.
  await until(S(45));

  await play(
    ...clear(),

    ...put(
      'notebookPreview',
      notebookPreview()
    ),

    ...say('NEXT: A NOTEBOOK YOU CAN TRUST', C.violet)
  );

  await until(S(45) + 1.70);

  await play(
    ...mark('notebookPreview', C.green),

    ...say('RUN THE NOTEBOOK FROM TOP TO BOTTOM', C.green)
  );

  // 46. A function is a named recipe that turns input into output,
  // so one calculation can be reused.
  await until(S(46));

  await play(
    ...clear(),

    ...put(
      'recipe',
      recipeFrame(5)
    ),

    ...put(
      'binding',
      bindingValue(MONDAY)
    ),

    ...put(
      'input',
      inputPanel(
        'monday',
        MONDAY,
        { call: true }
      )
    ),

    ...put(
      'output',
      outputPanel(
        MON_SUMMARY,
        'Monday'
      )
    ),

    ...put(
      'flow',
      functionFlow()
    ),

    ...put(
      'work',
      functionWork([
        ['FUNCTION = A NAMED RECIPE', C.violet],
        ['INPUT → CALCULATION → OUTPUT', C.ink]
      ])
    ),

    ...say('A FUNCTION TURNS INPUT INTO OUTPUT', C.violet)
  );

  await until(S(46) + 2.80);

  await play(
    ...put(
      'input',
      inputPanel(
        'tuesday',
        TUESDAY,
        { call: true }
      )
    ),

    ...put(
      'binding',
      bindingValue(TUESDAY)
    ),

    ...put(
      'output',
      outputPanel(
        TUE_SUMMARY,
        'Tuesday'
      )
    ),

    ...mark('recipe', C.violet),

    ...put(
      'work',
      functionWork([
        ['SAME FUNCTION', C.violet],
        ['NEW INPUT · NEW OUTPUT', C.green]
      ], C.green)
    ),

    ...say('WRITE ONCE. CALL AGAIN AND AGAIN.', C.green)
  );
}

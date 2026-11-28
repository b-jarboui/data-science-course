// lesson 3.4.4
// Vectorized operations: calibrating a whole week of greenhouse readings.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved live-engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D1 = [20, 22, 25, 30, 24, 21, 26];
  const D2 = [19, 21, 24, 29, 23, 20, 25];
  const CORRECTIONS = [1, 1, 1, 1, 1, 1, 1];

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const FULL_DAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
  ];

  const SUM_BEFORE = 168;
  const SUM_AFTER = 161;

  // The arithmetic examples assume data-tool arrays, as established
  // in lesson 3.4.3, rather than ordinary Python lists.

  // ------------------------------------------------------------
  // Responsive layout.
  // Phone: 8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const PILL = P ? [0, 3.65, 0] : [0, 1.85, 0];

  const CODE_Y = P ? 2.25 : 1.08;
  const CODE_W = P ? FW - 0.85 : 10.30;
  const CODE_H = P ? 1.04 : 0.74;

  const ROW_Y = P ? 0.20 : -0.12;
  const CORR_Y = P ? -1.60 : -1.08;
  const RESULT_Y = P ? -3.00 : -1.82;

  const SP = P ? 0.93 : 1.24;
  const BW = P ? 0.83 : 1.10;
  const BH = P ? 1.05 : 0.64;

  const CH = P ? 0.66 : 0.45;
  const RH = P ? 0.88 : 0.56;

  const DAY_Y = ROW_Y + BH / 2 + (P ? 0.30 : 0.22);
  const INDEX_Y = ROW_Y - BH / 2 - (P ? 0.28 : 0.17);

  const WORK_Y = P ? -4.55 : -2.70;
  const WORK_W = P ? 6.70 : 9.30;
  const WORK_H = P ? 1.42 : 0.86;

  const colx = i => (i - 3) * SP;

  const readingP = i => [colx(i), ROW_Y, 0];
  const correctionP = i => [colx(i), CORR_Y, 0];
  const resultP = i => [colx(i), RESULT_Y, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Visible-object management.
  // Never regroup objects that are already on screen.
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
      cornerRadius: 0.12,
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

  function arrow(a, b, color = C.amber, head = 0.13) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const ux = dx / d;
    const uy = dy / d;

    const w = head * 0.58;

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

  // ------------------------------------------------------------
  // Notebook cells with coloured Python code.
  // Preserve spaces between independently coloured tokens.
  // ------------------------------------------------------------

  function codeTokens(parts, p, maxw, size = P ? 25 : 24) {
    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const rows = parts.map(part =>
      Array.isArray(part)
        ? part
        : [part, C.ink]
    );

    const items = rows.map(([s, color]) => {
      const leading =
        s.length - s.trimStart().length;

      const trailing =
        s.trimStart().length - s.trim().length;

      const content = s.trim();

      const obj = content
        ? T(content, size, color, true)
        : null;

      const contentWidth = obj
        ? obj.getWidth()
        : 0;

      return {
        obj,
        leading,
        trailing,
        contentWidth,
        width:
          contentWidth +
          (leading + trailing) * cw
      };
    });

    const total = items.reduce(
      (sum, item) => sum + item.width,
      0
    );

    const scale = Math.min(
      1,
      maxw / Math.max(total, 0.001)
    );

    let left = p[0] - total * scale / 2;

    const objects = [];
    const bounds = [];

    for (const item of items) {
      const w = item.width * scale;
      const c0 = left + item.leading * cw * scale;

      bounds.push([c0, c0 + item.contentWidth * scale]);

      if (item.obj) {
        if (scale < 1) {
          item.obj.scale(scale);
        }

        const x =
          left +
          item.leading * cw * scale +
          item.contentWidth * scale / 2;

        item.obj.moveTo([x, p[1], 0]);

        objects.push(item.obj);
      }

      left += w;
    }

    return { objects, bounds };
  }

  function cell(parts, options = {}) {
    const y = options.y === undefined
      ? CODE_Y
      : options.y;

    const w = options.w || CODE_W;
    const h = options.h || CODE_H;

    const color = options.color || C.cyan;

    const frame = rect(
      w,
      h,
      [0, y, 0],
      color,
      C.card,
      0.98
    );

    const headerY = y + h / 2 - 0.14;
    const codeY = y - 0.12;

    const prompt = text(
      options.running ? 'In [*]' : 'In [ ]',
      12,
      C.muted,
      [-w / 2 + 0.55, headerY, 0],
      true
    );

    const runButton = text(
      '▶ RUN',
      12,
      options.running ? C.green : C.muted,
      [w / 2 - 0.55, headerY, 0],
      true
    );

    const row = codeTokens(
      parts,
      [0, codeY, 0],
      w - 0.65,
      options.size || (P ? 25 : 24)
    );

    const outlines = [];

    if (options.highlight) {
      const [first, last, hc] = options.highlight;

      const left = row.bounds[first][0] - 0.07;
      const right = row.bounds[last][1] + 0.07;

      outlines.push(
        rect(
          right - left,
          P ? 0.46 : 0.33,
          [(left + right) / 2, codeY, 0],
          hc || C.amber,
          C.card,
          0,
          2
        )
      );
    }

    return new M.VGroup(
      frame,
      prompt,
      runButton,
      ...outlines,
      ...row.objects
    );
  }

  function calibrationCode(options = {}) {
    return cell(
      [
        ['calibrated', C.green],
        [' = ', C.ink],
        ['readings', C.cyan],
        [' - 1', C.amber]
      ],
      options
    );
  }

  function pairCode(options = {}) {
    return cell(
      [
        ['calibrated', C.green],
        [' = ', C.ink],
        ['readings', C.cyan],
        [' - ', C.ink],
        ['corrections', C.amber]
      ],
      options
    );
  }

  function correctionCode(count = 7, options = {}) {
    return cell(
      [
        ['corrections', C.amber],
        [' = ', C.ink],
        ['np.array(', C.muted],
        [
          `[${Array(count).fill(1).join(', ')}]`,
          C.amber
        ],
        [')', C.muted]
      ],
      {
        ...options,
        size: P ? 22 : 22
      }
    );
  }

  // ------------------------------------------------------------
  // Formula and explanation box.
  // ------------------------------------------------------------

  function work(lines, color = C.cyan) {
    const r = rect(
      WORK_W,
      WORK_H,
      [0, WORK_Y, 0],
      color,
      C.card,
      0.98
    );

    const lh = P ? 0.43 : 0.34;

    const rows = lines.map((item, i) => {
      const row = Array.isArray(item)
        ? item
        : [item, C.ink];

      return text(
        row[0],
        lines.length > 1
          ? (P ? 22 : 21)
          : (P ? 27 : 25),
        row[1],
        [
          0,
          WORK_Y + ((lines.length - 1) / 2 - i) * lh,
          0
        ],
        true,
        WORK_W - 0.45
      );
    });

    return new M.VGroup(r, ...rows);
  }

  function dayWork(i) {
    return work([
      [FULL_DAYS[i], C.muted],
      [`${D1[i]} − 1 = ${D2[i]}`, C.green]
    ], C.green);
  }

  // ------------------------------------------------------------
  // Original readings: seven glowing boxes in day order.
  // Their values remain unchanged throughout the lesson.
  // ------------------------------------------------------------

  function readingFrame(i, color = C.cyan) {
    const p = readingP(i);

    const halo = rect(
      BW + 0.07,
      BH + 0.07,
      p,
      color,
      color,
      0.055,
      1
    );

    const r = rect(
      BW,
      BH,
      p,
      color,
      C.card,
      0.97,
      2
    );

    return new M.VGroup(halo, r);
  }

  function readingValue(i, color = C.cyan) {
    return text(
      String(D1[i]),
      P ? 31 : 29,
      color,
      readingP(i),
      true,
      BW - 0.10
    );
  }

  function dayLabel(i, color = C.muted) {
    return text(
      DAYS[i],
      P ? 15 : 16,
      color,
      [colx(i), DAY_Y, 0],
      false,
      SP - 0.06
    );
  }

  function indexLabel(i) {
    return text(
      String(i),
      P ? 16 : 14,
      C.muted,
      [colx(i), INDEX_Y, 0],
      true
    );
  }

  function sourceOutline(color = C.cyan) {
    return rect(
      SP * 6 + BW + 0.14,
      BH + 0.13,
      [0, ROW_Y, 0],
      color,
      C.card,
      0,
      2
    );
  }

  function sourceFocus(i, color = C.amber) {
    return rect(
      BW + 0.12,
      BH + 0.12,
      readingP(i),
      color,
      C.card,
      0,
      3
    );
  }

  function rowName(name, color, y, kind = 'source') {
    if (!P) {
      return text(
        name,
        18,
        color,
        [-5.55, y, 0],
        true,
        1.85
      );
    }

    const labelY =
      kind === 'source'
        ? DAY_Y + 0.34
        : kind === 'correction'
          ? CORR_Y + CH / 2 + 0.17
          : RESULT_Y + RH / 2 + 0.19;

    return text(
      name,
      18,
      color,
      [0, labelY, 0],
      true,
      6.5
    );
  }

  function addOriginalRow(includeValues = true) {
    const a = [];

    for (let i = 0; i < 7; i++) {
      a.push(
        ...put(`frame${i}`, readingFrame(i)),
        ...put(`day${i}`, dayLabel(i)),
        ...put(`index${i}`, indexLabel(i))
      );

      if (includeValues) {
        a.push(
          ...put(`value${i}`, readingValue(i))
        );
      }
    }

    a.push(
      ...put('sourceOutline', sourceOutline()),
      ...put(
        'sourceName',
        rowName(
          'readings',
          C.cyan,
          ROW_Y,
          'source'
        )
      )
    );

    return a;
  }

  // ------------------------------------------------------------
  // Calibration result row.
  // A new green array, independent of the original cyan array.
  // ------------------------------------------------------------

  function resultFrame(i, pending = false) {
    const p = resultP(i);

    const color = pending
      ? C.muted
      : C.green;

    const halo = rect(
      BW + 0.06,
      RH + 0.06,
      p,
      color,
      color,
      pending ? 0 : 0.06,
      1
    );

    const frame = rect(
      BW,
      RH,
      p,
      color,
      pending ? C.card : C.green,
      pending ? 0.94 : 0.10,
      pending ? 1 : 2
    );

    return new M.VGroup(halo, frame);
  }

  function resultValue(i, color = C.green) {
    return text(
      String(D2[i]),
      P ? 30 : 27,
      color,
      resultP(i),
      true,
      BW - 0.10
    );
  }

  function resultPlaceholder(i) {
    return text(
      '·',
      23,
      C.muted,
      resultP(i),
      true
    );
  }

  function resultOutline() {
    return rect(
      SP * 6 + BW + 0.14,
      RH + 0.11,
      [0, RESULT_Y, 0],
      C.green,
      C.card,
      0,
      2
    );
  }

  function addPendingResults() {
    const a = [];

    for (let i = 0; i < 7; i++) {
      a.push(
        ...put(
          `resultFrame${i}`,
          resultFrame(i, true)
        ),

        ...put(
          `resultEmpty${i}`,
          resultPlaceholder(i)
        )
      );
    }

    return a;
  }

  function addCompletedResults() {
    const a = [];

    for (let i = 0; i < 7; i++) {
      a.push(
        ...drop(`resultEmpty${i}`),

        ...put(
          `resultFrame${i}`,
          resultFrame(i)
        ),

        ...put(
          `resultValue${i}`,
          resultValue(i)
        )
      );
    }

    a.push(
      ...put('resultOutline', resultOutline()),

      ...put(
        'resultName',
        rowName(
          'calibrated',
          C.green,
          RESULT_Y,
          'result'
        )
      )
    );

    return a;
  }

  function removeResults() {
    return drop(
      'resultOutline',
      'resultName',

      ...D1.flatMap((_, i) => [
        `resultFrame${i}`,
        `resultEmpty${i}`,
        `resultValue${i}`,
        `moving${i}`
      ])
    );
  }

  // ------------------------------------------------------------
  // The subtraction operation.
  // ------------------------------------------------------------

  function minusOne(i, color = C.amber) {
    return text(
      '−1',
      P ? 24 : 20,
      color,
      correctionP(i),
      true,
      BW - 0.10
    );
  }

  function minusChip(i) {
    const p = correctionP(i);

    const r = rect(
      BW * 0.86,
      CH,
      p,
      C.amber,
      C.amber,
      0.10,
      1
    );

    return new M.VGroup(
      r,
      minusOne(i)
    );
  }

  function correctionArrow(i, color = C.amber) {
    const x = colx(i);

    return arrow(
      [
        x,
        CORR_Y - CH / 2 - 0.04,
        0
      ],
      [
        x,
        RESULT_Y + RH / 2 + 0.04,
        0
      ],
      color,
      P ? 0.13 : 0.075
    );
  }

  function removeMinusChips() {
    return drop(
      'operationOutline',

      ...D1.flatMap((_, i) => [
        `minus${i}`,
        `down${i}`
      ])
    );
  }

  function singleDay(i) {
    const a = [];

    if (i > 0) {
      a.push(
        ...drop(
          `minus${i - 1}`,
          `down${i - 1}`
        )
      );
    }

    a.push(
      ...put('focus', sourceFocus(i)),

      ...put(
        `minus${i}`,
        minusChip(i)
      ),

      ...put(
        `down${i}`,
        correctionArrow(i)
      ),

      ...drop(`resultEmpty${i}`),

      ...put(
        `resultFrame${i}`,
        resultFrame(i)
      ),

      ...put(
        `resultValue${i}`,
        resultValue(i)
      ),

      ...put(
        'work',
        dayWork(i)
      )
    );

    return a;
  }

  // ------------------------------------------------------------
  // Second array: one correction per original reading.
  // These are positive correction values, not negative numbers.
  // The subtraction belongs to the operation between the arrays.
  // ------------------------------------------------------------

  function correctionBox(i, value = CORRECTIONS[i]) {
    const p = correctionP(i);

    const frame = rect(
      BW,
      CH,
      p,
      C.amber,
      C.amber,
      0.10,
      2
    );

    const n = text(
      String(value),
      P ? 27 : 22,
      C.amber,
      p,
      true,
      BW - 0.10
    );

    return new M.VGroup(frame, n);
  }

  function correctionOutline(count = 7) {
    const left = colx(0) - BW / 2 - 0.07;
    const right = colx(count - 1) + BW / 2 + 0.07;

    return rect(
      right - left,
      CH + 0.12,
      [(left + right) / 2, CORR_Y, 0],
      C.amber,
      C.card,
      0,
      2
    );
  }

  function addCorrectionRow(count = 7) {
    const a = [];

    for (let i = 0; i < count; i++) {
      a.push(
        ...put(
          `correction${i}`,
          correctionBox(i)
        )
      );
    }

    a.push(
      ...put(
        'correctionOutline',
        correctionOutline(count)
      ),

      ...put(
        'correctionName',
        rowName(
          'corrections',
          C.amber,
          CORR_Y,
          'correction'
        )
      )
    );

    return a;
  }

  function removeCorrectionRow() {
    return drop(
      'correctionOutline',
      'correctionName',
      'missingCorrection',
      'unpaired',

      ...D1.flatMap((_, i) => [
        `correction${i}`,
        `pair${i}`,
        `pairResult${i}`
      ])
    );
  }

  function pairConnector(i, color = C.violet) {
    const x = colx(i);

    return line(
      [
        x,
        INDEX_Y - (P ? 0.15 : 0.08),
        0
      ],
      [
        x,
        CORR_Y + CH / 2 + 0.02,
        0
      ],
      color,
      2
    );
  }

  function pairFocus(i, color = C.violet) {
    const top = ROW_Y + BH / 2 + 0.06;
    const bottom = CORR_Y - CH / 2 - 0.06;

    return rect(
      BW + 0.13,
      top - bottom,
      [
        colx(i),
        (top + bottom) / 2,
        0
      ],
      color,
      C.card,
      0,
      3
    );
  }

  function pairResultArrow(i, color = C.green) {
    return arrow(
      [
        colx(i),
        CORR_Y - CH / 2 - 0.02,
        0
      ],
      [
        colx(i),
        RESULT_Y + RH / 2 + 0.02,
        0
      ],
      color,
      P ? 0.12 : 0.065
    );
  }

  // ------------------------------------------------------------
  // Missing correction: an empty seventh position.
  // ------------------------------------------------------------

  function missingCorrection() {
    const p = correctionP(6);

    const frame = rect(
      BW,
      CH,
      p,
      C.amber,
      C.card,
      0.20,
      2
    );

    const cross1 = line(
      [p[0] - 0.13, p[1] - 0.13, 0],
      [p[0] + 0.13, p[1] + 0.13, 0],
      C.amber,
      3
    );

    const cross2 = line(
      [p[0] - 0.13, p[1] + 0.13, 0],
      [p[0] + 0.13, p[1] - 0.13, 0],
      C.amber,
      3
    );

    return new M.VGroup(
      frame,
      cross1,
      cross2
    );
  }

  // ------------------------------------------------------------
  // Picture helpers: trusted thermometer beside our sensor.
  // The example uses Thursday's reading, 30°C, and its
  // corrected value, 29°C.
  // ------------------------------------------------------------

  const SENSOR_P = P
    ? [-1.75, -0.15, 0]
    : [-3.05, -0.35, 0];

  const TRUSTED_P = P
    ? [1.75, -0.15, 0]
    : [3.05, -0.35, 0];

  function instrument(p, trusted = false) {
    const color = trusted
      ? C.green
      : C.cyan;

    const w = P ? 2.80 : 3.85;
    const h = P ? 3.45 : 2.90;

    const x = p[0];
    const y = p[1];

    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98
    );

    const heading = text(
      trusted ? 'TRUSTED' : 'OUR SENSOR',
      P ? 20 : 22,
      color,
      [x, y + h / 2 - 0.36, 0],
      false,
      w - 0.35
    );

    const tubeX = x - w * 0.29;

    const tube = rect(
      0.35,
      1.42,
      [tubeX, y + 0.10, 0],
      C.ink,
      C.card,
      1
    );

    const mercury = new M.Rectangle({
      width: 0.12,
      height: trusted ? 0.85 : 0.97,
      color,
      strokeWidth: 1
    });

    mercury.setFill(color, 0.95);

    mercury.moveTo([
      tubeX,
      y - 0.16,
      0
    ]);

    const bulb = new M.Circle({
      radius: 0.23,
      color,
      strokeWidth: 2
    });

    bulb.setFill(color, 0.95);

    bulb.moveTo([
      tubeX,
      y - 0.64,
      0
    ]);

    const ticks = Array.from(
      { length: 5 },
      (_, i) => {
        const ty = y - 0.37 + i * 0.23;

        return line(
          [tubeX + 0.19, ty, 0],
          [tubeX + 0.32, ty, 0],
          C.muted,
          1
        );
      }
    );

    const description = text(
      trusted ? 'Thermometer' : 'Greenhouse',
      P ? 16 : 18,
      C.muted,
      [x, y - h / 2 + 0.34, 0],
      false,
      w - 0.35
    );

    return new M.VGroup(
      frame,
      heading,
      tube,
      mercury,
      bulb,
      ...ticks,
      description
    );
  }

  function instrumentReading(p, value, color) {
    return text(
      `${value}°C`,
      P ? 32 : 40,
      color,
      [
        p[0] + (P ? 0.43 : 0.65),
        p[1] + 0.04,
        0
      ],
      true,
      P ? 1.52 : 2.25
    );
  }

  function instrumentDifference() {
    const y = P ? -2.55 : -2.15;

    return new M.VGroup(
      text(
        '30 − 29 = 1°C',
        P ? 32 : 30,
        C.amber,
        [0, y, 0],
        true
      ),

      text(
        'The sensor reads one degree too high',
        P ? 18 : 17,
        C.muted,
        [0, y - 0.39, 0],
        false,
        FW - 1.0
      )
    );
  }

  // ------------------------------------------------------------
  // Scale picture: many readings, many manual operations.
  // ------------------------------------------------------------

  function manyReadings() {
    const cols = P ? 15 : 20;
    const rows = 3;

    const dx = P ? 0.32 : 0.36;
    const dy = P ? 0.24 : 0.16;

    const boxes = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x =
          (c - (cols - 1) / 2) * dx;

        const y =
          CODE_Y +
          ((rows - 1) / 2 - r) * dy;

        boxes.push(
          rect(
            dx * 0.73,
            dy * 0.72,
            [x, y, 0],
            C.cyan,
            C.cyan,
            0.14,
            1
          )
        );
      }
    }

    const more = text(
      '…',
      25,
      C.cyan,
      [
        (cols - 1) / 2 * dx + 0.39,
        CODE_Y,
        0
      ],
      true
    );

    return new M.VGroup(...boxes, more);
  }

  // ------------------------------------------------------------
  // Mean comparison helpers.
  // One lost degree from every day means seven lost in the total.
  // ------------------------------------------------------------

  function lostBlock(i) {
    const p = correctionP(i);

    const block = new M.Rectangle({
      width: BW * 0.66,
      height: CH * 0.82,
      color: C.amber,
      strokeWidth: 1
    });

    block.setFill(C.amber, 0.70);
    block.moveTo(p);

    const n = text(
      '1',
      P ? 21 : 18,
      C.card,
      p,
      true
    );

    return new M.VGroup(block, n);
  }

  function meanComparison() {
    return work([
      ['BEFORE: 168 ÷ 7 = 24°C', C.cyan],
      ['AFTER:  161 ÷ 7 = 23°C', C.green]
    ], C.green);
  }

  // ------------------------------------------------------------
  // Preview of the next lesson: a reusable calculation.
  // ------------------------------------------------------------

  function recipePreview() {
    const w = P ? 5.65 : 6.20;
    const h = P ? 3.50 : 3.15;

    const y = P ? -0.30 : -0.45;

    const frame = rect(
      w,
      h,
      [0, y, 0],
      C.violet,
      C.card,
      0.98
    );

    const title = text(
      'daily_summary(values)',
      P ? 24 : 26,
      C.violet,
      [0, y + h / 2 - 0.44, 0],
      true,
      w - 0.45
    );

    const separator = line(
      [-w / 2 + 0.30, y + h / 2 - 0.80, 0],
      [w / 2 - 0.30, y + h / 2 - 0.80, 0],
      C.violet,
      1
    );

    const steps = [
      ['1. Lowest reading', C.cyan],
      ['2. Highest reading', C.amber],
      ['3. Mean reading', C.green]
    ];

    const rows = steps.map(([s, color], i) =>
      text(
        s,
        P ? 23 : 24,
        color,
        [0, y + 0.40 - i * 0.57, 0],
        true,
        w - 0.65
      )
    );

    const footer = text(
      'One named calculation',
      18,
      C.muted,
      [0, y - h / 2 + 0.34, 0],
      false,
      w - 0.60
    );

    return new M.VGroup(
      frame,
      title,
      separator,
      ...rows,
      footer
    );
  }

  // ============================================================
  // 0-1: Return to the shared week of greenhouse readings.
  // ============================================================

  // 0. Here is our week of noon readings again, called readings.
  await until(S(0));

  const frames = [];
  const days = [];
  const indices = [];

  for (let i = 0; i < 7; i++) {
    const frame = readingFrame(i);
    const day = dayLabel(i);
    const index = indexLabel(i);

    visible.set(`frame${i}`, frame);
    visible.set(`day${i}`, day);
    visible.set(`index${i}`, index);

    frames.push(frame);
    days.push(day);
    indices.push(index);
  }

  await play(
    new M.LaggedStart(
      frames.map((frame, i) =>
        new M.LaggedStart(
          [
            new M.FadeIn(frame),
            new M.FadeIn(days[i]),
            new M.FadeIn(indices[i])
          ],
          { lagRatio: 0.04 }
        )
      ),
      {
        lagRatio: 0.10,
        runTime: 1.40
      }
    ),

    ...put(
      'sourceOutline',
      sourceOutline()
    ),

    ...put(
      'heading',
      tag(
        'readings',
        C.cyan,
        [0, CODE_Y, 0],
        23
      )
    ),

    ...say('ONE WEEK OF NOON READINGS')
  );

  // 1. Twenty, twenty-two, twenty-five, thirty,
  // twenty-four, twenty-one, twenty-six.
  await until(S(1));

  const values = D1.map(
    (_, i) => readingValue(i)
  );

  values.forEach((v, i) => {
    visible.set(`value${i}`, v);
  });

  await play(
    new M.LaggedStart(
      values.map(v => new M.FadeIn(v)),
      {
        lagRatio: 0.30,
        runTime: 4.0
      }
    ),

    ...put(
      'work',
      work([
        ['MONDAY TO SUNDAY', C.cyan],
        ['Temperatures in degrees Celsius', C.muted]
      ])
    ),

    ...say('SEVEN DAYS · SEVEN READINGS')
  );

  // ============================================================
  // 2-6: Discover that the sensor reads one degree too high.
  // ============================================================

  // 2. A technician holds a trusted thermometer next to our sensor.
  await until(S(2));

  await play(
    ...clear(),

    ...put(
      'sensor',
      instrument(SENSOR_P)
    ),

    ...put(
      'trusted',
      instrument(TRUSTED_P, true)
    ),

    ...say('COMPARE TWO INSTRUMENTS', C.violet)
  );

  // 3. The sensor shows one degree more than the trusted thermometer.
  await until(S(3));

  await play(
    ...put(
      'sensorReading',
      instrumentReading(
        SENSOR_P,
        30,
        C.cyan
      )
    ),

    ...put(
      'trustedReading',
      instrumentReading(
        TRUSTED_P,
        29,
        C.green
      )
    ),

    ...put(
      'difference',
      instrumentDifference()
    ),

    ...say('OUR SENSOR READS 1°C TOO HIGH', C.amber)
  );

  // 4. All our readings are one degree too high.
  await until(S(4));

  const originalWeek = clear();

  await play(
    ...originalWeek,

    ...addOriginalRow(),

    ...put(
      'heading',
      tag(
        '+1°C ERROR IN EVERY READING',
        C.amber,
        [0, CODE_Y, 0],
        19
      )
    ),

    ...put(
      'work',
      work([
        ['ALL SEVEN VALUES', C.cyan],
        ['Each is one degree too high', C.amber]
      ], C.amber)
    ),

    ...say('EVERY READING IS TOO HIGH', C.amber)
  );

  // 5. Take one degree away from every reading.
  await until(S(5));

  const subtractAll = D1.map(
    (_, i) => minusChip(i)
  );

  subtractAll.forEach((m, i) => {
    visible.set(`minus${i}`, m);
  });

  await play(
    ...drop('heading'),

    new M.LaggedStart(
      subtractAll.map(m => new M.FadeIn(m)),
      {
        lagRatio: 0.09,
        runTime: 1.25
      }
    ),

    ...put(
      'heading',
      tag(
        'THE CORRECTION: −1°C',
        C.amber,
        [0, CODE_Y, 0],
        20
      )
    ),

    ...put(
      'work',
      work([
        ['EVERY VALUE − 1', C.amber],
        ['Correct the whole week', C.ink]
      ], C.amber)
    ),

    ...say('TAKE ONE AWAY FROM EVERY VALUE', C.amber)
  );

  // 6. Fixing a measuring tool against a trusted one
  // is called calibration.
  await until(S(6));

  await play(
    ...put(
      'heading',
      tag(
        'CALIBRATION',
        C.green,
        [0, CODE_Y, 0],
        23
      )
    ),

    ...put(
      'work',
      work([
        ['CALIBRATION', C.green],
        ['Correct readings using a trusted reference', C.ink]
      ], C.green)
    ),

    ...say('CALIBRATION = CORRECT THE MEASUREMENT', C.green)
  );

  // ============================================================
  // 7-12: The slow way, one day at a time.
  // ============================================================

  // 7. First, do it the slow way, one day at a time.
  await until(S(7));

  await play(
    ...removeMinusChips(),

    ...addPendingResults(),

    ...put(
      'resultName',
      rowName(
        'calibrated',
        C.muted,
        RESULT_Y,
        'result'
      )
    ),

    ...put(
      'heading',
      tag(
        'ONE DAY AT A TIME',
        C.amber,
        [0, CODE_Y, 0],
        21
      )
    ),

    ...put(
      'work',
      work([
        ['7 VALUES TO CORRECT', C.ink],
        ['Work through them individually', C.amber]
      ], C.amber)
    ),

    ...say('THE SLOW WAY', C.amber)
  );

  // 8. Monday: 20 minus 1 is 19.
  await until(S(8));

  await play(
    ...singleDay(0),

    ...say('MONDAY: 20 − 1 = 19', C.amber)
  );

  // 9. Tuesday: 22 minus 1 is 21.
  await until(S(9));

  await play(
    ...singleDay(1),

    ...say('TUESDAY: 22 − 1 = 21', C.amber)
  );

  // 10. Wednesday: 25 minus 1 is 24.
  await until(S(10));

  await play(
    ...singleDay(2),

    ...say('WEDNESDAY: 25 − 1 = 24', C.amber)
  );

  // 11. Three days done, four still to go.
  await until(S(11));

  await play(
    ...drop('focus', 'minus2', 'down2'),

    ...put(
      'work',
      work([
        ['3 DAYS DONE', C.green],
        ['4 DAYS STILL TO GO', C.amber]
      ], C.amber)
    ),

    new M.LaggedStart(
      [3, 4, 5, 6].map(i =>
        new M.Indicate(
          visible.get(`resultFrame${i}`),
          { color: C.amber }
        )
      ),
      {
        lagRatio: 0.14,
        runTime: 1.20
      }
    ),

    ...say('3 DONE · 4 REMAINING', C.amber)
  );

  // 12. A whole year would need 365 separate steps.
  await until(S(12));

  await play(
    ...drop('heading'),

    ...put(
      'many',
      manyReadings()
    ),

    ...put(
      'work',
      work([
        ['365 DAYS', C.amber],
        ['365 separate subtraction steps?', C.ink]
      ], C.amber)
    ),

    ...say('TOO MUCH REPETITIVE WORK', C.amber)
  );

  // ============================================================
  // 13-20: The fast way — one vectorized operation.
  // ============================================================

  // 13. The fast way: write a single line of code.
  await until(S(13));

  await play(
    ...drop('many'),

    ...removeResults(),

    ...addPendingResults(),

    ...put(
      'heading',
      tag(
        'ONE LINE OF CODE',
        C.cyan,
        [0, CODE_Y, 0],
        22
      )
    ),

    ...put(
      'work',
      work([
        ['ONE OPERATION', C.amber],
        ['Every reading corrected together', C.ink]
      ], C.cyan)
    ),

    ...say('THE FAST WAY')
  );

  // 14. Calibrated equals readings minus one.
  await until(S(14));

  await play(
    ...drop('heading'),

    ...put(
      'code',
      calibrationCode({
        highlight: [3, 3, C.amber]
      })
    ),

    ...put(
      'work',
      work([
        ['readings − 1', C.amber],
        ['Save the result as calibrated', C.green]
      ], C.green)
    ),

    ...say('calibrated = readings − 1')
  );

  // 15. The minus one sweeps across all seven boxes at once.
  await until(S(15));

  const sweep = D1.map(
    (_, i) => minusChip(i)
  );

  sweep.forEach((m, i) => {
    visible.set(`minus${i}`, m);
  });

  await play(
    ...put(
      'code',
      calibrationCode({
        running: true,
        highlight: [3, 3, C.amber]
      })
    ),

    new M.LaggedStart(
      sweep.map(m => new M.FadeIn(m)),
      {
        lagRatio: 0.035,
        runTime: 0.80
      }
    ),

    ...put(
      'operationOutline',
      rect(
        SP * 6 + BW,
        CH + 0.12,
        [0, CORR_Y, 0],
        C.amber,
        C.card,
        0,
        2
      )
    ),

    ...say('APPLY −1 TO THE WHOLE ARRAY', C.amber)
  );

  // Independent copies move from the source to the result row.
  // The original cyan readings remain visible and unchanged.

  const moving = D1.map((v, i) =>
    text(
      String(v),
      P ? 31 : 29,
      C.amber,
      readingP(i),
      true,
      BW - 0.10
    )
  );

  moving.forEach((obj, i) => {
    visible.set(`moving${i}`, obj);
  });

  await play(
    ...moving.map(obj =>
      new M.FadeIn(
        obj,
        { runTime: 0.25 }
      )
    ),

    ...D1.flatMap((_, i) =>
      put(
        `down${i}`,
        correctionArrow(i),
        0.30
      )
    )
  );

  // All seven transformations run together in ONE play().
  await play(
    ...D1.flatMap((_, i) =>
      drop(`resultEmpty${i}`)
    ),

    ...D1.flatMap((_, i) =>
      put(
        `resultFrame${i}`,
        resultFrame(i)
      )
    ),

    ...moving.map((obj, i) =>
      new M.Transform(
        obj,
        resultValue(i),
        {
          runTime: 1.20
        }
      )
    )
  );

  for (let i = 0; i < 7; i++) {
    visible.delete(`moving${i}`);
    visible.set(`resultValue${i}`, moving[i]);
  }

  // 16. Nineteen, twenty-one, twenty-four, twenty-nine,
  // twenty-three, twenty, twenty-five.
  await until(S(16));

  await play(
    ...put(
      'code',
      calibrationCode()
    ),

    new M.LaggedStart(
      D2.map((_, i) =>
        new M.Indicate(
          visible.get(`resultValue${i}`),
          {
            color: C.green,
            runTime: 0.65
          }
        )
      ),
      {
        lagRatio: 0.30,
        runTime: 4.30
      }
    ),

    ...put(
      'work',
      work([
        ['19, 21, 24, 29, 23, 20, 25', C.green],
        ['Seven corrected temperatures', C.ink]
      ], C.green)
    ),

    ...say('ALL SEVEN VALUES CORRECTED', C.green)
  );

  // 17. Every value went down by one in one step,
  // saved in a new array called calibrated.
  await until(S(17));

  await play(
    ...removeMinusChips(),

    ...put(
      'resultOutline',
      resultOutline()
    ),

    ...put(
      'resultName',
      rowName(
        'calibrated',
        C.green,
        RESULT_Y,
        'result'
      )
    ),

    ...put(
      'work',
      work([
        ['EVERY VALUE DECREASED BY 1', C.amber],
        ['New array: calibrated', C.green]
      ], C.green)
    ),

    ...say('ONE STEP · ONE NEW ARRAY', C.green)
  );

  // 18. One operation applied to every value at once
  // is called a vectorized operation.
  await until(S(18));

  await play(
    ...put(
      'code',
      calibrationCode({
        highlight: [2, 3, C.violet]
      })
    ),

    ...put(
      'work',
      work([
        ['VECTORIZED OPERATION', C.violet],
        ['One operation applied to every array value', C.ink]
      ], C.violet)
    ),

    ...mark('resultOutline', C.green),

    ...say('VECTORIZED = APPLY TO THE WHOLE ARRAY', C.violet)
  );

  // 19. Vector is another word for a row of values.
  await until(S(19));

  await play(
    ...mark('sourceOutline', C.cyan),

    ...put(
      'work',
      work([
        ['VECTOR', C.violet],
        ['A row of values', C.ink]
      ], C.violet)
    ),

    ...say('VECTOR = A ROW OF VALUES', C.violet)
  );

  // 20. The original readings remain unchanged.
  await until(S(20));

  await play(
    ...put(
      'code',
      calibrationCode()
    ),

    ...put(
      'work',
      work([
        ['readings: original values', C.cyan],
        ['calibrated: corrected values', C.green]
      ], C.cyan)
    ),

    ...mark('sourceOutline', C.cyan),

    ...say('KEEP THE ORIGINAL DATA')
  );

  // ============================================================
  // 21-25: What happens to the mean?
  // ============================================================

  // 21. Before, the seven readings added up to 168.
  await until(S(21));

  await play(
    ...put(
      'code',
      cell([
        ['sum(', C.ink],
        ['readings', C.cyan],
        [')', C.ink]
      ])
    ),

    ...put(
      'work',
      work([
        ['20 + 22 + 25 + 30 + 24 + 21 + 26', C.ink],
        [`SUM BEFORE = ${SUM_BEFORE}`, C.cyan]
      ], C.cyan)
    ),

    new M.LaggedStart(
      D1.map((_, i) =>
        new M.Indicate(
          visible.get(`value${i}`),
          { color: C.cyan }
        )
      ),
      {
        lagRatio: 0.12,
        runTime: 2.20
      }
    ),

    ...say('ORIGINAL TOTAL = 168')
  );

  // 22. Shared over seven days, the mean was 24.
  await until(S(22));

  await play(
    ...put(
      'work',
      work([
        ['mean = sum ÷ count', C.ink],
        ['168 ÷ 7 = 24°C', C.cyan]
      ], C.cyan)
    ),

    ...say('ORIGINAL MEAN = 24°C')
  );

  // 23. Every day lost one degree, so the total lost seven.
  await until(S(23));

  const lost = D1.map(
    (_, i) => lostBlock(i)
  );

  lost.forEach((b, i) => {
    visible.set(`lost${i}`, b);
  });

  await play(
    new M.LaggedStart(
      lost.map(b => new M.FadeIn(b)),
      {
        lagRatio: 0.12,
        runTime: 1.45
      }
    ),

    ...put(
      'work',
      work([
        ['7 DAYS × 1 DEGREE = 7', C.amber],
        ['168 − 7 = 161', C.green]
      ], C.amber)
    ),

    ...say('SEVEN DAYS LOSE SEVEN DEGREES IN TOTAL', C.amber)
  );

  // 24. 161 divided by seven is 23.
  await until(S(24));

  await play(
    ...drop(
      ...D1.map((_, i) => `lost${i}`)
    ),

    ...put(
      'code',
      cell([
        ['sum(', C.ink],
        ['calibrated', C.green],
        [') / 7', C.ink]
      ])
    ),

    ...put(
      'work',
      work([
        [`NEW TOTAL = ${SUM_AFTER}`, C.green],
        ['161 ÷ 7 = 23°C', C.green]
      ], C.green)
    ),

    ...mark('resultOutline', C.green),

    ...say('CALIBRATED MEAN = 23°C', C.green)
  );

  // 25. The mean also went down by exactly one degree.
  await until(S(25));

  await play(
    ...put(
      'work',
      meanComparison()
    ),

    ...put(
      'code',
      calibrationCode()
    ),

    ...say('MEAN: 24°C → 23°C', C.green)
  );

  // ============================================================
  // 26-31: Operations between two arrays.
  // Pair each reading with its own correction.
  // ============================================================

  // 26. Vectorized operations also work between two arrays.
  await until(S(26));

  await play(
    ...removeResults(),

    ...put(
      'code',
      cell([
        ['readings', C.cyan],
        [' - ', C.ink],
        ['corrections', C.amber]
      ])
    ),

    ...put(
      'work',
      work([
        ['ONE ARRAY MINUS ANOTHER', C.violet],
        ['Match values in the same positions', C.ink]
      ], C.violet)
    ),

    ...say('ARRAY-TO-ARRAY OPERATIONS', C.violet)
  );

  // 27. Picture a second row of seven corrections.
  await until(S(27));

  const correctionBoxes = CORRECTIONS.map(
    (v, i) => correctionBox(i, v)
  );

  correctionBoxes.forEach((obj, i) => {
    visible.set(`correction${i}`, obj);
  });

  await play(
    new M.LaggedStart(
      correctionBoxes.map(
        obj => new M.FadeIn(obj)
      ),
      {
        lagRatio: 0.10,
        runTime: 1.40
      }
    ),

    ...put(
      'correctionOutline',
      correctionOutline()
    ),

    ...put(
      'correctionName',
      rowName(
        'corrections',
        C.amber,
        CORR_Y,
        'correction'
      )
    ),

    ...put(
      'code',
      correctionCode()
    ),

    ...put(
      'work',
      work([
        ['7 READINGS', C.cyan],
        ['7 CORRECTIONS', C.amber]
      ], C.violet)
    ),

    ...say('ONE CORRECTION FOR EACH READING', C.violet)
  );

  // 28. Every correction is one, but each could be different.
  await until(S(28));

  await play(
    ...mark('correctionOutline', C.amber),

    ...put(
      'work',
      work([
        ['HERE: ALL CORRECTIONS ARE 1', C.amber],
        ['Each position can have its own correction', C.ink]
      ], C.amber)
    ),

    ...say('EACH VALUE CAN HAVE ITS OWN CORRECTION', C.amber)
  );

  // 29. Readings minus corrections pairs the boxes
  // like dance partners.
  await until(S(29));

  const partners = D1.map(
    (_, i) => pairFocus(i)
  );

  partners.forEach((obj, i) => {
    visible.set(`pair${i}`, obj);
  });

  await play(
    ...put(
      'code',
      pairCode({
        highlight: [2, 4, C.violet]
      })
    ),

    new M.LaggedStart(
      partners.map(obj => new M.Create(obj)),
      {
        lagRatio: 0.11,
        runTime: 1.55
      }
    ),

    ...put(
      'work',
      work([
        ['PAIR BY POSITION', C.violet],
        ['Subtract one partner from the other', C.ink]
      ], C.violet)
    ),

    ...say('PAIR THE BOXES BY POSITION', C.violet)
  );

  // 30. Monday meets Monday, Tuesday meets Tuesday, and so on.
  await until(S(30));

  await play(
    ...put(
      'pairHighlight',
      pairFocus(0, C.amber)
    ),

    ...put(
      'work',
      work([
        ['MONDAY MEETS MONDAY', C.violet],
        ['20 − 1', C.amber]
      ], C.violet)
    ),

    ...say('MATCH THE SAME DAY', C.violet)
  );

  await until(S(30) + 1.40);

  await play(
    ...transform(
      'pairHighlight',
      pairFocus(1, C.amber),
      { runTime: 0.60 }
    ),

    ...put(
      'work',
      work([
        ['TUESDAY MEETS TUESDAY', C.violet],
        ['22 − 1', C.amber]
      ], C.violet)
    )
  );

  await until(S(30) + 2.80);

  await play(
    ...drop('pairHighlight'),

    new M.LaggedStart(
      [2, 3, 4, 5, 6].map(i =>
        new M.Indicate(
          visible.get(`pair${i}`),
          {
            color: C.violet,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.10,
        runTime: 1.30
      }
    ),

    ...put(
      'work',
      work([
        ['AND SO ON FOR EVERY POSITION', C.violet],
        ['Seven matching pairs', C.ink]
      ], C.violet)
    )
  );

  // 31. Each pair gives one answer.
  // Seven pairs, seven answers: the same calibrated week.
  await until(S(31));

  const pairArrows = D1.map(
    (_, i) => pairResultArrow(i)
  );

  pairArrows.forEach((a, i) => {
    visible.set(`pairResult${i}`, a);
  });

  await play(
    ...put(
      'code',
      pairCode({
        running: true
      })
    ),

    ...pairArrows.map(a =>
      new M.FadeIn(
        a,
        { runTime: 0.40 }
      )
    ),

    ...addPendingResults(),

    ...say('SEVEN PAIRS → SEVEN ANSWERS', C.green)
  );

  await play(
    ...addCompletedResults(),

    ...put(
      'code',
      pairCode()
    ),

    ...put(
      'work',
      work([
        ['19, 21, 24, 29, 23, 20, 25', C.green],
        ['Exactly the same calibrated week', C.ink]
      ], C.green)
    )
  );

  // ============================================================
  // 32-34: Why whole-array operations are useful.
  // ============================================================

  // 32. Correcting, converting or scaling a whole column
  // of data with one line.
  await until(S(32));

  await play(
    ...removeCorrectionRow(),

    ...put(
      'code',
      calibrationCode()
    ),

    ...put(
      'work',
      work([
        ['CORRECT · CONVERT · SCALE', C.violet],
        ['One line for a whole array', C.ink]
      ], C.violet)
    ),

    ...say('APPLY ONE RULE TO ALL THE DATA', C.violet)
  );

  // 33. The line stays the same length for seven
  // readings or seven million.
  await until(S(33));

  await play(
    ...mark('code', C.cyan),

    ...put(
      'work',
      work([
        ['7 OR 7,000,000 READINGS', C.cyan],
        ['Same short line of code', C.ink]
      ], C.cyan)
    ),

    ...say('MORE DATA. SAME CODE.')
  );

  // 34. Faster for the computer, with no day forgotten.
  await until(S(34));

  await play(
    new M.LaggedStart(
      D2.map((_, i) =>
        new M.Indicate(
          visible.get(`resultValue${i}`),
          {
            color: C.green,
            runTime: 0.55
          }
        )
      ),
      {
        lagRatio: 0.06,
        runTime: 1.40
      }
    ),

    ...put(
      'work',
      work([
        ['ONE WHOLE-ARRAY OPERATION', C.green],
        ['Every position is included', C.ink]
      ], C.green)
    ),

    ...say('FASTER · NO DAY FORGOTTEN', C.green)
  );

  // ============================================================
  // 35-39: Common trap — arrays of different lengths.
  // ============================================================

  // 35. Here is a common trap: rows of different lengths.
  await until(S(35));

  await play(
    ...removeResults(),

    ...addCorrectionRow(),

    ...put(
      'code',
      pairCode()
    ),

    ...put(
      'work',
      work([
        ['COMMON TRAP', C.amber],
        ['What if the two rows have different lengths?', C.ink]
      ], C.amber)
    ),

    ...say('COMMON TRAP: DIFFERENT LENGTHS', C.amber)
  );

  // 36. Suppose the corrections row has only six values.
  await until(S(36));

  await play(
    ...drop('correction6'),

    ...put(
      'correctionOutline',
      correctionOutline(6)
    ),

    ...put(
      'code',
      correctionCode(
        6,
        { color: C.amber }
      )
    ),

    ...put(
      'work',
      work([
        ['readings:    7 values', C.cyan],
        ['corrections: 6 values', C.amber]
      ], C.amber)
    ),

    ...say('7 READINGS · ONLY 6 CORRECTIONS', C.amber)
  );

  // 37. Six pairs form. Sunday's reading has no partner.
  await until(S(37));

  const sixPairs = D1.slice(0, 6).map(
    (_, i) => pairFocus(i, C.violet)
  );

  sixPairs.forEach((obj, i) => {
    visible.set(`pair${i}`, obj);
  });

  await play(
    new M.LaggedStart(
      sixPairs.map(
        obj => new M.Create(obj)
      ),
      {
        lagRatio: 0.08,
        runTime: 1.15
      }
    ),

    ...put(
      'missingCorrection',
      missingCorrection()
    ),

    ...put(
      'unpaired',
      sourceFocus(6, C.amber)
    ),

    ...put(
      'day6',
      dayLabel(6, C.amber)
    ),

    ...put(
      'work',
      work([
        ['6 MATCHING PAIRS', C.violet],
        ['Sunday has no correction', C.amber]
      ], C.amber)
    ),

    ...say('SUNDAY HAS NO PARTNER', C.amber)
  );

  // 38. The computer cannot guess, so it stops with an error.
  await until(S(38));

  await play(
    ...put(
      'code',
      pairCode({
        color: C.amber,
        running: true
      })
    ),

    ...put(
      'work',
      work([
        ['ValueError: incompatible array shapes', C.amber],
        ['7 values cannot pair with 6 values', C.ink]
      ], C.amber)
    ),

    ...mark('unpaired', C.amber),

    ...say('ERROR: THE ROWS DO NOT MATCH', C.amber)
  );

  // 39. Before combining two arrays, check the lengths.
  await until(S(39));

  await play(
    ...drop('missingCorrection', 'unpaired'),

    ...put(
      'day6',
      dayLabel(6)
    ),

    ...put(
      'correction6',
      correctionBox(6)
    ),

    ...put(
      'correctionOutline',
      correctionOutline(7)
    ),

    ...put(
      'pair6',
      pairFocus(6)
    ),

    ...put(
      'code',
      pairCode()
    ),

    ...put(
      'work',
      work([
        ['7 READINGS = 7 CORRECTIONS', C.green],
        ['Every value now has a partner', C.ink]
      ], C.green)
    ),

    ...say('CHECK LENGTHS BEFORE PAIRING', C.green)
  );

  // ============================================================
  // 40-41: Preview functions and finish with the definition.
  // ============================================================

  // 40. Next lesson: package a whole calculation
  // under one name and reuse it.
  await until(S(40));

  await play(
    ...clear(),

    ...put(
      'recipe',
      recipePreview()
    ),

    ...say('NEXT: ONE NAMED CALCULATION', C.violet)
  );

  // 41. A vectorized operation changes every value
  // in an array with one short line.
  await until(S(41));

  const oldRecipe = clear();

  await play(
    ...oldRecipe,

    ...addOriginalRow(),

    ...put(
      'code',
      calibrationCode({
        highlight: [2, 3, C.amber]
      })
    ),

    ...D1.flatMap((_, i) =>
      put(
        `minus${i}`,
        minusChip(i)
      )
    ),

    ...addCompletedResults(),

    ...put(
      'work',
      work([
        ['VECTORIZED = ONE OPERATION FOR EVERY VALUE', C.violet],
        ['One short line creates the corrected array', C.ink]
      ], C.violet)
    ),

    ...say('ONE LINE · EVERY VALUE', C.green)
  );

  await until(S(41) + 2.30);

  await play(
    ...removeMinusChips(),

    ...mark('sourceOutline', C.cyan),
    ...mark('resultOutline', C.green),

    ...put(
      'work',
      meanComparison()
    ),

    ...say('ORIGINAL KEPT · WHOLE ARRAY CORRECTED', C.green)
  );
}

// lesson 3.4.2
// Arrays and indexing: seven greenhouse readings under one name.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved live-engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D1 = [20, 22, 25, 30, 24, 21, 26];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const FULL_DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  const NAMES = [
    'temp_mon',
    'temp_tue',
    'temp_wed',
    'temp_thu',
    'temp_fri',
    'temp_sat',
    'temp_sun'
  ];

  const ARRAY_CODE = 'readings = [20, 22, 25, 30, 24, 21, 26]';

  // ------------------------------------------------------------
  // Responsive layout.
  // Phone: 8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const PILL = P ? [0, 3.65, 0] : [0, 1.85, 0];

  const CODE_Y = P ? 2.20 : 0.85;
  const CODE_W = P ? FW - 0.85 : 10.5;
  const CODE_H = P ? 1.10 : 0.86;

  const ROW_Y = P ? -0.90 : -0.75;

  const SP_LOOSE = P ? 1.04 : 1.48;
  const SP_JOINED = P ? 0.90 : 1.16;

  const BW_LOOSE = P ? 0.78 : 1.02;
  const BW_JOINED = P ? 0.80 : 1.06;

  const BH = P ? 1.35 : 0.98;

  const DAY_Y = ROW_Y + BH / 2 + (P ? 0.34 : 0.24);
  const INDEX_Y = ROW_Y - BH / 2 - 0.30;
  const CURSOR_Y = INDEX_Y - (P ? 0.52 : 0.31);

  const WORK_Y = P ? -4.00 : -2.48;
  const WORK_W = P ? 6.70 : 9.10;
  const WORK_H = P ? 1.60 : 0.82;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const colx = (i, joined = true) =>
    (i - 3) * (joined ? SP_JOINED : SP_LOOSE);

  const boxP = (i, joined = true) =>
    [colx(i, joined), ROW_Y, 0];

  // ------------------------------------------------------------
  // Visible-object management.
  // Each object is tracked independently.
  // Never regroup already-visible objects for highlighting.
  // ------------------------------------------------------------

  const visible = new Map();

  function put(key, obj) {
    const a = [];

    if (visible.has(key)) {
      a.push(new M.FadeOut(visible.get(key)));
    }

    visible.set(key, obj);
    a.push(new M.FadeIn(obj));

    return a;
  }

  function drop(...keys) {
    const a = [];

    for (const key of keys) {
      if (!visible.has(key)) continue;

      a.push(new M.FadeOut(visible.get(key)));
      visible.delete(key);
    }

    return a;
  }

  function clear() {
    return drop(...Array.from(visible.keys()));
  }

  function mark(key, color = C.amber) {
    const obj = visible.get(key);

    return obj
      ? [new M.Indicate(obj, { color })]
      : [];
  }

  function transform(key, target, options = {}) {
    if (!visible.has(key)) {
      return put(key, target);
    }

    return [
      new M.Transform(visible.get(key), target, options)
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
    const t = fit(T(s, size, color, mono), maxw);
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

  function arrow(a, b, color = C.amber) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    const ux = dx / d;
    const uy = dy / d;

    const h = 0.15;
    const w = 0.09;

    return new M.VGroup(
      line(a, b, color, 2),
      line(
        b,
        [
          b[0] - h * ux - w * uy,
          b[1] - h * uy + w * ux,
          0
        ],
        color,
        2
      ),
      line(
        b,
        [
          b[0] - h * ux + w * uy,
          b[1] - h * uy - w * ux,
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
  // Notebook code cell.
  // All code shown on screen is valid Python unless explicitly
  // presented as an incorrect indexing example.
  // ------------------------------------------------------------

  function codeTokens(parts, p, maxw, size = P ? 25 : 24) {
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const rows = parts.map(part =>
      Array.isArray(part) ? part : [part, C.ink]
    );

    const items = rows.map(([s, color]) => {
      const leading = s.length - s.trimStart().length;
      const trailing = s.trimStart().length - s.trim().length;
      const content = s.trim();

      const obj = content
        ? T(content, size, color, true)
        : null;

      const contentWidth = obj ? obj.getWidth() : 0;

      return {
        obj,
        leading,
        trailing,
        contentWidth,
        width: contentWidth + (leading + trailing) * cw
      };
    });

    const total = items.reduce((sum, item) => sum + item.width, 0);
    const scale = Math.min(1, maxw / Math.max(total, 0.001));

    let left = p[0] - total * scale / 2;

    const objects = [];
    const bounds = [];

    for (const item of items) {
      const w = item.width * scale;

      bounds.push([left, left + w]);

      if (item.obj) {
        if (scale < 1) item.obj.scale(scale);

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
    const y = options.y === undefined ? CODE_Y : options.y;
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

    const headerY = y + h / 2 - 0.16;
    const codeY = y - 0.12;

    const prompt = text(
      options.running ? 'In [*]' : 'In [ ]',
      13,
      C.muted,
      [-w / 2 + 0.55, headerY, 0],
      true
    );

    const run = text(
      '▶ RUN',
      13,
      options.running ? C.green : C.muted,
      [w / 2 - 0.56, headerY, 0],
      true
    );

    const code = codeTokens(
      parts,
      [0, codeY, 0],
      w - 0.65,
      options.size || (P ? 25 : 24)
    );

    const outlines = [];

    if (options.highlight) {
      const [first, last, hc] = options.highlight;

      const left = code.bounds[first][0] - 0.08;
      const right = code.bounds[last][1] + 0.08;

      outlines.push(
        rect(
          right - left,
          P ? 0.50 : 0.38,
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
      run,
      ...outlines,
      ...code.objects
    );
  }

  function arrayCode(options = {}) {
    return cell(
      [
        ['readings', C.cyan],
        [' = ', C.ink],
        ['[', C.violet],
        ['20, 22, 25, 30, 24, 21, 26', C.ink],
        [']', C.violet]
      ],
      options
    );
  }

  function indexCode(i, options = {}) {
    return cell(
      [
        ['readings', C.cyan],
        ['[', C.ink],
        [String(i), options.indexColor || C.amber],
        [']', C.ink]
      ],
      {
        ...options,
        highlight: options.highlight || [2, 2, options.indexColor || C.amber]
      }
    );
  }

  // ------------------------------------------------------------
  // Formula and explanation box.
  // One or two short lines, fitted for both orientations.
  // ------------------------------------------------------------

  function work(lines, color = C.cyan) {
    const p = [0, WORK_Y, 0];

    const r = rect(
      WORK_W,
      WORK_H,
      p,
      color,
      C.card,
      0.98
    );

    const lh = P ? 0.43 : 0.31;

    const rows = lines.map((item, i) => {
      const row = Array.isArray(item)
        ? item
        : [item, C.ink];

      return text(
        row[0],
        lines.length > 1
          ? (P ? 22 : 19)
          : (P ? 27 : 24),
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

  function output(i, color = C.green) {
    return work([
      [`Out: ${D1[i]}`, color],
      [`${FULL_DAYS[i]} · ${D1[i]}°C`, C.ink]
    ], color);
  }

  function stepMessage(n) {
    return work([
      [
        `${n} ${n === 1 ? 'STEP' : 'STEPS'} FROM THE START`,
        C.amber
      ],
      [`Position ${n}`, C.muted]
    ], C.amber);
  }

  // ------------------------------------------------------------
  // Opening picture: one labelled variable and one sensor.
  // ------------------------------------------------------------

  const SINGLE_P = P ? [0, 0.40, 0] : [-2.3, -0.35, 0];

  function singleVariable() {
    const p = SINGLE_P;

    const w = P ? 3.0 : 3.25;
    const h = P ? 2.1 : 1.8;

    const halo = rect(
      w + 0.14,
      h + 0.14,
      p,
      C.cyan,
      C.cyan,
      0.045,
      1
    );

    const box = rect(
      w,
      h,
      p,
      C.cyan,
      C.card,
      0.98
    );

    const separator = line(
      [p[0] - w / 2 + 0.15, p[1] + h * 0.12, 0],
      [p[0] + w / 2 - 0.15, p[1] + h * 0.12, 0],
      C.cyan,
      1
    );

    const name = text(
      'temp_c',
      P ? 25 : 27,
      C.cyan,
      [p[0], p[1] + h * 0.30, 0],
      true
    );

    const value = text(
      '25',
      P ? 49 : 46,
      C.green,
      [p[0], p[1] - h * 0.16, 0],
      true
    );

    const unit = text(
      '°C',
      20,
      C.muted,
      [p[0], p[1] - h / 2 - 0.30, 0]
    );

    return new M.VGroup(
      halo,
      box,
      separator,
      name,
      value,
      unit
    );
  }

  function sensorPicture() {
    const p = P ? [0, -2.60, 0] : [2.8, -0.45, 0];

    const w = P ? 2.9 : 3.4;
    const h = 1.4;

    const left = p[0] - w / 2;
    const right = p[0] + w / 2;

    const base = p[1] - 0.64;
    const top = base + h;
    const peak = top + 0.50;

    const house = new M.Rectangle({
      width: w,
      height: h,
      color: C.green,
      strokeWidth: 2
    });

    house.setFill(C.green, 0.055);
    house.moveTo([p[0], base + h / 2, 0]);

    const roof = [
      line([left, top, 0], [p[0], peak, 0], C.green, 2),
      line([p[0], peak, 0], [right, top, 0], C.green, 2)
    ];

    const plants = [-0.92, -0.24, 0.44].map(dx => {
      const x = p[0] + dx;
      const y = base + 0.15;

      const stem = line(
        [x, y, 0],
        [x, y + 0.65, 0],
        C.green,
        3
      );

      const leaf1 = new M.Circle({
        radius: 0.12,
        color: C.green,
        strokeWidth: 1
      });

      leaf1.setFill(C.green, 0.80);
      leaf1.moveTo([x - 0.12, y + 0.38, 0]);

      const leaf2 = new M.Circle({
        radius: 0.12,
        color: C.green,
        strokeWidth: 1
      });

      leaf2.setFill(C.green, 0.80);
      leaf2.moveTo([x + 0.12, y + 0.55, 0]);

      return new M.VGroup(stem, leaf1, leaf2);
    });

    const sensorP = [p[0] + w * 0.34, p[1] + 0.24, 0];

    const sensor = rect(
      0.53,
      0.32,
      sensorP,
      C.cyan,
      C.card,
      1
    );

    const led = new M.Dot({
      point: [sensorP[0] - 0.13, sensorP[1], 0],
      radius: 0.047,
      color: C.cyan
    });

    const sensorLabel = text(
      'sensor',
      14,
      C.cyan,
      [sensorP[0], sensorP[1] + 0.34, 0]
    );

    const noon = tag(
      '12:00 NOON · °C',
      C.cyan,
      [p[0], base - 0.43, 0],
      16
    );

    return new M.VGroup(
      house,
      ...roof,
      ...plants,
      sensor,
      led,
      sensorLabel,
      noon
    );
  }

  // ------------------------------------------------------------
  // Seven reading boxes.
  // Frames, days, values and indices remain separate objects.
  // This lets us rearrange the row without detaching its contents.
  // ------------------------------------------------------------

  function readingFrame(i, joined = true, color = C.cyan) {
    const p = boxP(i, joined);
    const w = joined ? BW_JOINED : BW_LOOSE;

    const halo = rect(
      w + 0.07,
      BH + 0.07,
      p,
      color,
      color,
      0.055,
      1
    );

    const r = rect(
      w,
      BH,
      p,
      color,
      C.card,
      0.97,
      2
    );

    return new M.VGroup(halo, r);
  }

  function dayLabel(i, joined = true, color = C.muted) {
    return text(
      DAYS[i],
      P ? 17 : 18,
      color,
      [colx(i, joined), DAY_Y, 0],
      false,
      joined ? SP_JOINED - 0.05 : SP_LOOSE - 0.05
    );
  }

  function readingValue(i, joined = true, color = C.cyan) {
    const w = joined ? BW_JOINED : BW_LOOSE;

    return text(
      String(D1[i]),
      P ? 30 : 32,
      color,
      boxP(i, joined),
      true,
      w - 0.11
    );
  }

  function placeholder(i) {
    return text(
      '·',
      26,
      C.muted,
      boxP(i, false),
      true
    );
  }

  function separateName(i) {
    return text(
      NAMES[i],
      P ? 16 : 18,
      C.violet,
      [colx(i, false), INDEX_Y, 0],
      true,
      SP_LOOSE - 0.07
    );
  }

  function indexLabel(i, color = C.violet) {
    return text(
      String(i),
      P ? 21 : 21,
      color,
      [colx(i), INDEX_Y, 0],
      true
    );
  }

  function rowOutline(color = C.violet) {
    const w = SP_JOINED * 6 + BW_JOINED + 0.14;

    return rect(
      w,
      BH + 0.17,
      [0, ROW_Y, 0],
      color,
      C.card,
      0,
      2
    );
  }

  function rowName() {
    const r = rect(
      P ? 4.35 : 5.10,
      P ? 1.05 : 0.75,
      [0, CODE_Y, 0],
      C.violet,
      C.card,
      0.98
    );

    const lab = text(
      'readings',
      P ? 30 : 29,
      C.violet,
      [0, CODE_Y, 0],
      true
    );

    return new M.VGroup(r, lab);
  }

  function selection(i, color = C.amber, joined = true) {
    const w = joined ? BW_JOINED : BW_LOOSE;

    return rect(
      w + 0.12,
      BH + 0.13,
      boxP(i, joined),
      color,
      C.card,
      0,
      3
    );
  }

  function setSelection(i, color = C.amber, joined = true) {
    return put(
      'selection',
      selection(i, color, joined)
    );
  }

  function cursor(i, color = C.amber) {
    const p = [colx(i), CURSOR_Y, 0];

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.20 : 0.15,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: p,
      radius: P ? 0.095 : 0.080,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function addReading(i) {
    return [
      ...drop(`empty${i}`),
      ...put(`value${i}`, readingValue(i, false)),
      ...setSelection(i, C.amber, false),
      ...put('work', work([
        [`${FULL_DAYS[i]} at noon`, C.ink],
        [`${D1[i]}°C`, C.cyan]
      ], C.cyan))
    ];
  }

  function addIndex(i) {
    return [
      ...put(`index${i}`, indexLabel(i)),
      ...setSelection(i, C.amber),
      ...transform(
        'cursor',
        cursor(i),
        { runTime: 0.55 }
      )
    ];
  }

  function selectIndex(i, color = C.amber) {
    return [
      ...setSelection(i, color),
      ...put(`index${i}`, indexLabel(i, color)),
      ...mark(`value${i}`, color)
    ];
  }

  function resetIndices() {
    const a = [];

    for (let i = 0; i < 7; i++) {
      a.push(...put(`index${i}`, indexLabel(i)));
    }

    return a;
  }

  // ------------------------------------------------------------
  // Pictures for scale, errors and the next lesson.
  // ------------------------------------------------------------

  function manyNames() {
    const cols = P ? 12 : 15;
    const rows = 2;

    const dx = P ? 0.36 : 0.39;
    const dy = P ? 0.32 : 0.25;

    const boxes = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * dx;
        const y = CODE_Y + ((rows - 1) / 2 - r) * dy;

        boxes.push(
          rect(
            dx * 0.78,
            dy * 0.72,
            [x, y, 0],
            C.violet,
            C.violet,
            0.12,
            1
          )
        );
      }
    }

    const dots = text(
      '…',
      27,
      C.violet,
      [(cols - 1) / 2 * dx + 0.40, CODE_Y, 0],
      true
    );

    return new M.VGroup(...boxes, dots);
  }

  function missingPosition() {
    const x = colx(7);

    const w = P ? 0.70 : BW_JOINED;

    const r = new M.RoundedRectangle({
      width: w,
      height: BH,
      cornerRadius: 0.12,
      color: C.amber,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.25);
    r.moveTo([x, ROW_Y, 0]);

    const cross1 = line(
      [x - 0.16, ROW_Y - 0.16, 0],
      [x + 0.16, ROW_Y + 0.16, 0],
      C.amber,
      3
    );

    const cross2 = line(
      [x - 0.16, ROW_Y + 0.16, 0],
      [x + 0.16, ROW_Y - 0.16, 0],
      C.amber,
      3
    );

    const n = text(
      '7',
      21,
      C.amber,
      [x, INDEX_Y, 0],
      true
    );

    return new M.VGroup(r, cross1, cross2, n);
  }

  function maskQuestion(i) {
    const x = colx(i);

    const w = BW_JOINED - 0.06;
    const h = P ? 0.53 : 0.40;

    const r = rect(
      w,
      h,
      [x, INDEX_Y, 0],
      C.violet,
      C.card,
      0.98,
      1
    );

    const q = text(
      '?',
      P ? 23 : 21,
      C.violet,
      [x, INDEX_Y, 0],
      true
    );

    return new M.VGroup(r, q);
  }

  // ============================================================
  // 0-2: From one variable to a whole week of readings.
  // ============================================================

  // 0. In the last lesson, one variable held one temperature.
  await until(S(0));
  await play(
    ...put('single', singleVariable()),
    ...put('work', work([
      ['temp_c = 25', C.cyan],
      ['one name holds one value', C.ink]
    ], C.cyan)),
    ...say('ONE VARIABLE, ONE VALUE')
  );

  // 1. The greenhouse sensor records a temperature every noon.
  await until(S(1));
  await play(
    ...drop('work'),
    ...put('sensor', sensorPicture()),
    ...say('ONE READING EVERY DAY', C.green)
  );

  // 2. Collect one week, Monday to Sunday.
  await until(S(2));

  const oldIntro = clear();
  const weekFrames = [];
  const weekDays = [];
  const weekEmpty = [];

  for (let i = 0; i < 7; i++) {
    const r = readingFrame(i, false);
    const d = dayLabel(i, false);
    const e = placeholder(i);

    visible.set(`frame${i}`, r);
    visible.set(`day${i}`, d);
    visible.set(`empty${i}`, e);

    weekFrames.push(r);
    weekDays.push(d);
    weekEmpty.push(e);
  }

  await play(
    ...oldIntro,
    new M.LaggedStart(
      weekFrames.map((r, i) =>
        new M.LaggedStart(
          [
            new M.FadeIn(r),
            new M.FadeIn(weekDays[i]),
            new M.FadeIn(weekEmpty[i])
          ],
          { lagRatio: 0.04 }
        )
      ),
      { lagRatio: 0.10, runTime: 1.40 }
    ),
    ...put(
      'weekHeading',
      tag(
        'NOON TEMPERATURES · °C',
        C.cyan,
        [0, CODE_Y, 0],
        19
      )
    ),
    ...say('MONDAY TO SUNDAY')
  );

  // ============================================================
  // 3-9: The seven fixed daily readings.
  // ============================================================

  // 3. Monday: 20.
  await until(S(3));
  await play(
    ...addReading(0),
    ...say('MONDAY: 20°C')
  );

  // 4. Tuesday: 22.
  await until(S(4));
  await play(
    ...addReading(1),
    ...say('TUESDAY: 22°C')
  );

  // 5. Wednesday: 25.
  await until(S(5));
  await play(
    ...addReading(2),
    ...say('WEDNESDAY: 25°C')
  );

  // 6. Thursday: 30, a hot day.
  await until(S(6));
  await play(
    ...addReading(3),
    ...say('THURSDAY: 30°C · HOT', C.amber)
  );

  // 7. Friday: 24.
  await until(S(7));
  await play(
    ...addReading(4),
    ...say('FRIDAY: 24°C')
  );

  // 8. Saturday: 21.
  await until(S(8));
  await play(
    ...addReading(5),
    ...say('SATURDAY: 21°C')
  );

  // 9. Sunday: 26.
  await until(S(9));
  await play(
    ...addReading(6),
    ...say('SUNDAY: 26°C')
  );

  // ============================================================
  // 10-16: Many separate boxes become one named array.
  // ============================================================

  // 10. Seven boxes with seven names gets messy.
  await until(S(10));

  const names = D1.map((_, i) => separateName(i));

  names.forEach((n, i) => {
    visible.set(`name${i}`, n);
  });

  await play(
    ...drop('selection'),
    new M.LaggedStart(
      names.map(n => new M.FadeIn(n)),
      { lagRatio: 0.10, runTime: 1.30 }
    ),
    ...put(
      'work',
      work([
        ['7 DAYS', C.ink],
        ['7 SEPARATE VARIABLE NAMES', C.violet]
      ], C.violet)
    ),
    ...say('ONE NAME FOR EVERY DAY?', C.amber)
  );

  // 11. Imagine hundreds of names for a month or year.
  await until(S(11));
  await play(
    ...drop('weekHeading'),
    ...put('manyNames', manyNames()),
    ...put(
      'work',
      work([
        ['A WHOLE YEAR', C.ink],
        ['365 SEPARATE NAMES?', C.amber]
      ], C.amber)
    ),
    ...say('TOO MANY NAMES TO REMEMBER', C.amber)
  );

  // 12. Glue seven boxes side by side, in day order.
  await until(S(12));

  const joinAnimations = [];

  for (let i = 0; i < 7; i++) {
    joinAnimations.push(
      ...transform(
        `frame${i}`,
        readingFrame(i, true),
        { runTime: 1.20 }
      ),
      ...transform(
        `day${i}`,
        dayLabel(i, true),
        { runTime: 1.20 }
      ),
      ...transform(
        `value${i}`,
        readingValue(i, true),
        { runTime: 1.20 }
      )
    );
  }

  await play(
    ...drop(
      'manyNames',
      ...D1.map((_, i) => `name${i}`)
    ),
    ...joinAnimations,
    ...put('rowOutline', rowOutline()),
    ...put(
      'work',
      work([
        ['SAME SEVEN VALUES', C.cyan],
        ['ONE CONNECTED ROW', C.violet]
      ], C.violet)
    ),
    ...say('JOIN THE BOXES IN DAY ORDER', C.violet)
  );

  // 13. Give the whole row one name: readings.
  await until(S(13));
  await play(
    ...put('rowName', rowName()),
    ...put(
      'work',
      work(['ONE NAME FOR ALL SEVEN VALUES'], C.violet)
    ),
    ...say('THE WHOLE ROW IS CALLED readings', C.violet)
  );

  // 14. An array keeps many values in order under one name.
  await until(S(14));
  await play(
    ...mark('rowOutline', C.violet),
    ...put(
      'work',
      work([
        ['ARRAY', C.violet],
        ['Many values, in order, under one name', C.ink]
      ], C.violet)
    ),
    ...say('ARRAY = AN ORDERED COLLECTION', C.violet)
  );

  // 15. Plain Python calls this a list.
  await until(S(15));
  await play(
    ...put(
      'work',
      work([
        ['Plain Python: list', C.cyan],
        ['Data tools: array', C.violet]
      ], C.cyan)
    ),
    ...say('SAME BASIC IDEA: AN ORDERED ROW')
  );

  // 16. The values are in square brackets, separated by commas.
  await until(S(16));
  await play(
    ...drop('rowName'),
    ...put(
      'code',
      arrayCode({
        highlight: [2, 4, C.violet]
      })
    ),
    ...put(
      'work',
      work([
        ['[ ]  SQUARE BRACKETS', C.violet],
        [',    COMMAS SEPARATE VALUES', C.ink]
      ], C.violet)
    ),
    ...say('THE ROW WRITTEN AS CODE')
  );

  // ============================================================
  // 17-21: A question about one day introduces position.
  // ============================================================

  // 17. What was the temperature on Thursday?
  await until(S(17));
  await play(
    ...put('code', arrayCode()),
    ...put(
      'day3',
      dayLabel(3, true, C.amber)
    ),
    ...put(
      'work',
      work([
        ['QUESTION', C.amber],
        ['What was Thursday’s temperature?', C.ink]
      ], C.amber)
    ),
    ...say('FIND THURSDAY', C.amber)
  );

  // 18. How do we take out just one value?
  await until(S(18));
  await play(
    ...mark('rowOutline', C.cyan),
    ...put(
      'work',
      work([
        ['7 VALUES IN THE ARRAY', C.cyan],
        ['How do we select just one?', C.ink]
      ], C.amber)
    ),
    ...say('HOW DO WE GET ONE VALUE?', C.amber)
  );

  // 19. The place of a value is its position or index.
  await until(S(19));
  await play(
    ...setSelection(3),
    ...put(
      'work',
      work([
        ['POSITION = INDEX', C.violet],
        ['The place of a value in the row', C.ink]
      ], C.violet)
    ),
    ...say('INDEX = POSITION IN THE ROW', C.violet)
  );

  // 20. The computer starts counting at zero, not one.
  await until(S(20));
  await play(
    ...setSelection(0),
    ...put('index0', indexLabel(0, C.amber)),
    ...put(
      'day3',
      dayLabel(3)
    ),
    ...put(
      'work',
      work([
        ['START COUNTING AT 0', C.amber],
        ['Not at 1', C.muted]
      ], C.amber)
    ),
    ...say('THE FIRST POSITION IS ZERO', C.amber)
  );

  // 21. Think of how many steps from the start.
  await until(S(21));

  const startArrow = arrow(
    [
      colx(0),
      CURSOR_Y - (P ? 0.65 : 0.25),
      0
    ],
    [
      colx(0),
      CURSOR_Y - (P ? 0.23 : 0.14),
      0
    ],
    C.amber
  );

  await play(
    ...put('cursor', cursor(0)),
    ...put('startArrow', startArrow),
    ...put(
      'work',
      stepMessage(0)
    ),
    ...say('COUNT STEPS FROM THE START', C.amber)
  );

  // ============================================================
  // 22-27: Reveal zero-based indices in order.
  // ============================================================

  // 22. Monday is zero steps from the start: index 0.
  await until(S(22));
  await play(
    ...drop('startArrow'),
    ...put('index0', indexLabel(0, C.amber)),
    ...setSelection(0),
    ...put('work', stepMessage(0)),
    ...say('MONDAY: INDEX 0', C.amber)
  );

  // 23. Tuesday is one step along: index 1.
  await until(S(23));
  await play(
    ...put('index0', indexLabel(0)),
    ...addIndex(1),
    ...put('work', stepMessage(1)),
    ...say('TUESDAY: INDEX 1', C.amber)
  );

  // 24. Wednesday: index 2.
  await until(S(24));
  await play(
    ...addIndex(2),
    ...put('work', stepMessage(2)),
    ...say('WEDNESDAY: INDEX 2', C.amber)
  );

  // 25. Thursday: index 3.
  await until(S(25));
  await play(
    ...addIndex(3),
    ...put('work', stepMessage(3)),
    ...say('THURSDAY: INDEX 3', C.amber)
  );

  // 26. Friday 4, Saturday 5, Sunday 6.
  await until(S(26));

  await play(
    ...addIndex(4),
    ...put('work', stepMessage(4)),
    ...say('FRIDAY 4 · SATURDAY 5 · SUNDAY 6', C.amber)
  );

  await play(
    ...addIndex(5),
    ...put('work', stepMessage(5))
  );

  await play(
    ...addIndex(6),
    ...put('work', stepMessage(6))
  );

  // 27. Seven boxes, numbered zero to six.
  await until(S(27));
  await play(
    ...drop('selection', 'cursor'),
    ...put(
      'work',
      work([
        ['7 BOXES', C.cyan],
        ['INDICES: 0, 1, 2, 3, 4, 5, 6', C.violet]
      ], C.violet)
    ),
    ...mark('rowOutline', C.violet),
    ...say('SEVEN VALUES · INDICES 0 TO 6', C.violet)
  );

  // ============================================================
  // 28-31: Use readings[3] and visibly travel three positions.
  // ============================================================

  // 28. Write readings followed by 3 in square brackets.
  await until(S(28));
  await play(
    ...put('code', indexCode(3)),
    ...put(
      'work',
      work([
        ['readings → the array name', C.cyan],
        ['[3] → the position we want', C.amber]
      ], C.amber)
    ),
    ...say('ASK FOR POSITION 3', C.amber)
  );

  // 29. Start at zero, take three steps and read the landing box.
  await until(S(29));

  await play(
    ...put('cursor', cursor(0)),
    ...setSelection(0),
    ...put('work', stepMessage(0)),
    ...say('START AT ZERO, THEN TAKE THREE STEPS', C.amber)
  );

  for (let i = 1; i <= 3; i++) {
    await play(
      ...transform(
        'cursor',
        cursor(i),
        { runTime: 0.65 }
      ),
      ...transform(
        'selection',
        selection(i),
        { runTime: 0.65 }
      ),
      ...put('work', stepMessage(i))
    );
  }

  // 30. Thirty. Thursday was thirty degrees.
  await until(S(30));
  await play(
    ...drop('cursor'),
    ...put('index3', indexLabel(3, C.green)),
    ...setSelection(3, C.green),
    ...mark('value3', C.green),
    ...put('work', output(3)),
    ...say('readings[3] GIVES 30', C.green)
  );

  // 31. Getting one value by position is indexing.
  await until(S(31));
  await play(
    ...put(
      'work',
      work([
        ['INDEXING', C.violet],
        ['Get one value using its position', C.ink]
      ], C.violet)
    ),
    ...mark('code', C.violet),
    ...say('INDEXING = PICK ONE VALUE BY POSITION', C.violet)
  );

  // ============================================================
  // 32-35: More indexing examples and the purpose of arrays.
  // ============================================================

  // 32. readings[0] gives Monday's 20.
  await until(S(32));
  await play(
    ...put('code', indexCode(0)),
    ...put('index3', indexLabel(3)),
    ...selectIndex(0, C.green),
    ...put('work', output(0)),
    ...say('readings[0] = 20', C.green)
  );

  // 33. readings[6] gives Sunday's 26.
  await until(S(33));
  await play(
    ...put('code', indexCode(6)),
    ...put('index0', indexLabel(0)),
    ...selectIndex(6, C.green),
    ...put('work', output(6)),
    ...say('readings[6] = 26', C.green)
  );

  // 34. The whole week travels under one name.
  await until(S(34));
  await play(
    ...drop('selection'),
    ...put('index6', indexLabel(6)),
    ...put('code', arrayCode()),
    ...mark('rowOutline', C.violet),
    ...put(
      'work',
      work([
        ['readings', C.violet],
        ['All seven days stay together', C.ink]
      ], C.violet)
    ),
    ...say('THE WHOLE WEEK UNDER ONE NAME', C.violet)
  );

  // 35. Yet we can reach any single day in one short step.
  await until(S(35));
  await play(
    ...put('code', indexCode(3)),
    ...selectIndex(3, C.green),
    ...put('work', output(3)),
    ...say('ONE SHORT LINE GETS ONE VALUE', C.green)
  );

  // ============================================================
  // 36-39: Common trap — counting from one.
  // ============================================================

  // 36. Counting from one out of habit.
  await until(S(36));
  await play(
    ...drop('selection'),
    ...put('index3', indexLabel(3)),
    ...put(
      'work',
      work([
        ['COMMON TRAP', C.amber],
        ['Counting from 1 instead of 0', C.ink]
      ], C.amber)
    ),
    ...say('COMMON TRAP: COUNTING FROM ONE', C.amber)
  );

  // 37. Thursday is the fourth day, but its index is 3.
  await until(S(37));
  await play(
    ...put('day3', dayLabel(3, true, C.amber)),
    ...setSelection(3),
    ...put('index3', indexLabel(3, C.amber)),
    ...put(
      'work',
      work([
        ['THURSDAY IS THE 4th DAY', C.ink],
        ['BUT ITS INDEX IS 3', C.amber]
      ], C.amber)
    ),
    ...say('FOURTH DAY ≠ INDEX FOUR', C.amber)
  );

  // 38. Asking for index 4 returns Friday's 24 instead.
  await until(S(38));
  await play(
    ...put(
      'code',
      indexCode(4, {
        indexColor: C.amber,
        running: true
      })
    ),
    ...put('day3', dayLabel(3)),
    ...put('day4', dayLabel(4, true, C.amber)),
    ...put('index3', indexLabel(3)),
    ...selectIndex(4, C.amber),
    ...put(
      'work',
      work([
        ['Out: 24', C.green],
        ['Friday, not Thursday', C.amber]
      ], C.amber)
    ),
    ...say('INDEX 4 GIVES FRIDAY', C.amber)
  );

  // 39. No warning: the returned number looks normal.
  await until(S(39));
  await play(
    ...put('code', indexCode(4)),
    ...put(
      'work',
      work([
        ['Out: 24', C.green],
        ['Valid result · Wrong day', C.amber]
      ], C.amber)
    ),
    ...mark('value4', C.green),
    ...say('NO ERROR DOES NOT MEAN CORRECT', C.amber)
  );

  // ============================================================
  // 40-41: An index outside the array produces an actual error.
  // ============================================================

  // 40. Asking for index 7: there is no box there.
  await until(S(40));
  await play(
    ...drop('selection'),
    ...put('index4', indexLabel(4)),
    ...put('day4', dayLabel(4)),
    ...put(
      'code',
      indexCode(7, {
        color: C.amber,
        indexColor: C.amber,
        running: true
      })
    ),
    ...put('missingPosition', missingPosition()),
    ...put(
      'work',
      work([
        ['LAST VALID INDEX = 6', C.violet],
        ['There is no position 7', C.amber]
      ], C.amber)
    ),
    ...say('INDEX 7 DOES NOT EXIST', C.amber)
  );

  // 41. The computer stops: index out of range.
  await until(S(41));
  await play(
    ...put(
      'code',
      indexCode(7, {
        color: C.amber,
        indexColor: C.amber
      })
    ),
    ...put(
      'work',
      work([
        ['IndexError: list index out of range', C.amber],
        ['This position does not exist', C.ink]
      ], C.amber)
    ),
    ...mark('missingPosition', C.amber),
    ...say('INDEX OUT OF RANGE', C.amber)
  );

  // ============================================================
  // 42-43: Preview Boolean masks and finish with the definition.
  // ============================================================

  // 42. Next lesson: pick many days using a yes-or-no question.
  await until(S(42));

  const questions = D1.map((_, i) => maskQuestion(i));

  const removeIndices = drop(
    'missingPosition',
    ...D1.map((_, i) => `index${i}`)
  );

  questions.forEach((q, i) => {
    visible.set(`question${i}`, q);
  });

  await play(
    ...removeIndices,
    ...put('code', arrayCode()),
    new M.LaggedStart(
      questions.map(q => new M.FadeIn(q)),
      {
        lagRatio: 0.09,
        runTime: 1.30
      }
    ),
    ...put(
      'work',
      work([
        ['ONE QUESTION FOR EVERY VALUE', C.violet],
        ['Yes or no?', C.ink]
      ], C.violet)
    ),
    ...say('NEXT: PICK MANY VALUES AT ONCE', C.violet)
  );

  // 43. An array keeps values in order under one name,
  // and an index counted from zero picks one value out.
  await until(S(43));

  await play(
    ...drop(
      ...D1.map((_, i) => `question${i}`)
    ),
    ...resetIndices(),
    ...put('code', indexCode(3)),
    ...setSelection(3, C.green),
    ...put(
      'work',
      work([
        ['ARRAY: ordered values under one name', C.cyan],
        ['INDEX: a position counted from zero', C.violet]
      ], C.violet)
    ),
    ...say('ONE ARRAY. MANY VALUES. ZERO-BASED INDICES.', C.green)
  );

  await play(
    ...put('index3', indexLabel(3, C.green)),
    ...mark('value3', C.green),
    ...put(
      'work',
      work([
        ['readings[3] = 30', C.green],
        ['One position picks one value', C.ink]
      ], C.green)
    )
  );
}

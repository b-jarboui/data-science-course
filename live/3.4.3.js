// lesson 3.4.3
// Boolean masks: asking one yes-or-no question of every greenhouse reading.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved live-engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D1 = [20, 22, 25, 30, 24, 21, 26];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const STRICT_MASK = D1.map(v => v > 25);
  const INCLUSIVE_MASK = D1.map(v => v >= 25);

  const HOT = [3, 6];
  const WARM = [2, 3, 6];

  // ------------------------------------------------------------
  // Responsive layout.
  // Phone: 8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const PILL = P ? [0, 3.65, 0] : [0, 1.85, 0];

  const CODE_Y = P ? 2.15 : 1.02;
  const CODE_W = P ? FW - 0.85 : 10.3;
  const CODE_H = P ? 1.15 : 0.80;

  const ROW_Y = P ? 0.00 : -0.40;
  const MASK_Y = P ? -1.80 : -1.58;
  const WORK_Y = P ? -4.00 : -2.50;

  const SP = P ? 1.03 : 1.25;
  const BW = P ? 0.95 : 1.13;
  const BH = P ? 1.12 : 0.87;

  const MH = P ? 0.80 : 0.48;

  const DAY_Y = ROW_Y + BH / 2 + (P ? 0.32 : 0.24);
  const INDEX_Y = ROW_Y - BH / 2 - (P ? 0.31 : 0.23);

  const WORK_W = P ? 7.1 : 9.4;
  const WORK_H = P ? 1.65 : 0.82;

  const colx = i => (i - 3) * SP;
  const readingP = i => [colx(i), ROW_Y, 0];
  const maskP = i => [colx(i), MASK_Y, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Visible-object management.
  // Track objects independently. Never regroup visible objects
  // inside a new VGroup for highlighting or repositioning.
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
  // Notebook code cells.
  // Preserve whitespace between coloured code tokens.
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
    const y =
      options.y === undefined
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

    const headerY = y + h / 2 - 0.15;
    const codeY = y - 0.12;

    const prompt = text(
      options.running ? 'In [*]' : 'In [ ]',
      13,
      C.muted,
      [-w / 2 + 0.55, headerY, 0],
      true
    );

    const runButton = text(
      '▶ RUN',
      13,
      options.running ? C.green : C.muted,
      [w / 2 - 0.56, headerY, 0],
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

      const left = row.bounds[first][0] - 0.08;
      const right = row.bounds[last][1] + 0.08;

      outlines.push(
        rect(
          right - left,
          P ? 0.51 : 0.37,
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

  function arrayCode() {
    return cell([
      ['readings', C.cyan],
      [' = ', C.ink],
      ['[', C.violet],
      ['20, 22, 25, 30, 24, 21, 26', C.ink],
      [']', C.violet]
    ]);
  }

  function questionCode(op = '>', options = {}) {
    return cell(
      [
        ['readings', C.cyan],
        [` ${op} `, C.amber],
        ['25', C.amber]
      ],
      options
    );
  }

  function maskCode(op = '>', options = {}) {
    return cell(
      [
        ['mask', C.violet],
        [' = ', C.ink],
        ['readings', C.cyan],
        [` ${op} `, C.amber],
        ['25', C.amber]
      ],
      options
    );
  }

  function filterCode(options = {}) {
    return cell(
      [
        ['readings', C.cyan],
        ['[', C.ink],
        ['mask', C.violet],
        [']', C.ink]
      ],
      options
    );
  }

  function incompleteFilterCode() {
    return cell([
      ['readings', C.cyan],
      ['[', C.violet],
      ['   ', C.muted],
      [']', C.violet]
    ]);
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

    const lh = P ? 0.45 : 0.30;

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

  function comparisonWork(i, op = '>') {
    const v = D1[i];

    const answer =
      op === '>='
        ? v >= 25
        : v > 25;

    const color = answer
      ? C.green
      : C.muted;

    return work([
      [
        `${v} ${op === '>=' ? '≥' : '>'} 25 ?`,
        C.amber
      ],
      [
        answer ? 'YES' : 'NO',
        color
      ]
    ], answer ? C.green : C.muted);
  }

  // ------------------------------------------------------------
  // The shared week: seven glowing data boxes.
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
      P ? 31 : 33,
      color,
      readingP(i),
      true,
      BW - 0.10
    );
  }

  function dayLabel(i, color = C.muted) {
    return text(
      DAYS[i],
      P ? 17 : 18,
      color,
      [colx(i), DAY_Y, 0],
      false,
      SP - 0.06
    );
  }

  function indexLabel(i) {
    return text(
      String(i),
      P ? 19 : 15,
      C.muted,
      [colx(i), INDEX_Y, 0],
      true
    );
  }

  function rowOutline(color = C.violet) {
    return rect(
      SP * 6 + BW + 0.15,
      BH + 0.16,
      [0, ROW_Y, 0],
      color,
      C.card,
      0,
      2
    );
  }

  function readingFocus(i, color = C.amber) {
    return rect(
      BW + 0.10,
      BH + 0.12,
      readingP(i),
      color,
      C.card,
      0,
      3
    );
  }

  function focus(i, color = C.amber, runTime = 0.32) {
    return put(
      'focus',
      readingFocus(i, color),
      runTime
    );
  }

  // ------------------------------------------------------------
  // Boolean answers.
  // True is always green; False is always muted grey.
  // Each answer sits directly underneath its original reading.
  // ------------------------------------------------------------

  function answerBox(i, value, mode = 'boolean') {
    const p = maskP(i);

    const pending = value === null;

    const color = pending
      ? C.violet
      : value
        ? C.green
        : C.muted;

    const label = pending
      ? '?'
      : mode === 'words'
        ? (value ? 'Yes' : 'No')
        : (value ? 'True' : 'False');

    const r = rect(
      BW,
      MH,
      p,
      color,
      value === true ? C.green : C.card,
      value === true ? 0.12 : 0.98,
      pending ? 1 : 2
    );

    const t = text(
      label,
      mode === 'words'
        ? (P ? 23 : 21)
        : (P ? 22 : 20),
      color,
      p,
      true,
      BW - 0.12
    );

    return new M.VGroup(r, t);
  }

  function maskOutline(color = C.violet) {
    return rect(
      SP * 6 + BW + 0.15,
      MH + 0.13,
      [0, MASK_Y, 0],
      color,
      C.card,
      0,
      2
    );
  }

  function showMask(values, mode = 'boolean') {
    const a = [];

    for (let i = 0; i < 7; i++) {
      a.push(
        ...put(
          `answer${i}`,
          answerBox(i, values[i], mode),
          0.35
        )
      );
    }

    return a;
  }

  function answerDay(i) {
    const yes = STRICT_MASK[i];

    return [
      ...focus(i),
      ...put(
        `answer${i}`,
        answerBox(i, yes, 'words'),
        0.30
      ),
      ...put(
        'work',
        comparisonWork(i),
        0.30
      )
    ];
  }

  function removeMask() {
    return drop(
      'maskOutline',
      ...D1.map((_, i) => `answer${i}`)
    );
  }

  function alignmentLines() {
    return new M.VGroup(
      ...D1.map((_, i) =>
        line(
          [
            colx(i),
            INDEX_Y - 0.12,
            0
          ],
          [
            colx(i),
            MASK_Y + MH / 2 + 0.04,
            0
          ],
          STRICT_MASK[i] ? C.green : C.muted,
          1.5
        )
      )
    );
  }

  // ------------------------------------------------------------
  // Stencil metaphor.
  //
  // True pieces have transparent interiors: the data shows through.
  // False pieces have opaque interiors: the data is covered.
  //
  // The original readings are never deleted or altered.
  // All stencil pieces are newly created independent objects.
  // ------------------------------------------------------------

  function stencilPiece(i, state = 'neutral', y = ROW_Y) {
    const p = [colx(i), y, 0];

    const color =
      state === 'hole'
        ? C.green
        : state === 'covered'
          ? C.muted
          : C.violet;

    const outer = rect(
      BW + 0.07,
      BH + 0.08,
      p,
      color,
      C.card,
      state === 'covered' ? 1 : 0,
      state === 'hole' ? 3 : 2
    );

    const inner = rect(
      BW - 0.13,
      BH - 0.15,
      p,
      color,
      C.card,
      0,
      1
    );

    if (state === 'covered') {
      const lab = text(
        'False',
        P ? 21 : 19,
        C.muted,
        p,
        true,
        BW - 0.13
      );

      const hatch = [
        line(
          [
            p[0] - BW * 0.29,
            p[1] - BH * 0.31,
            0
          ],
          [
            p[0] + BW * 0.29,
            p[1] - BH * 0.31,
            0
          ],
          C.muted,
          1
        ),

        line(
          [
            p[0] - BW * 0.29,
            p[1] + BH * 0.31,
            0
          ],
          [
            p[0] + BW * 0.29,
            p[1] + BH * 0.31,
            0
          ],
          C.muted,
          1
        )
      ];

      return new M.VGroup(
        outer,
        inner,
        ...hatch,
        lab
      );
    }

    return new M.VGroup(outer, inner);
  }

  function stencilRow(values) {
    const a = [];

    for (let i = 0; i < 7; i++) {
      a.push(
        ...put(
          `stencil${i}`,
          stencilPiece(
            i,
            values[i] ? 'hole' : 'covered'
          ),
          0.45
        )
      );
    }

    return a;
  }

  function removeStencil() {
    return drop(
      ...D1.map((_, i) => `stencil${i}`)
    );
  }

  function holeOutline(i) {
    return rect(
      BW + 0.13,
      BH + 0.14,
      readingP(i),
      C.green,
      C.card,
      0,
      3
    );
  }

  // ------------------------------------------------------------
  // Filtered result row.
  // Copies of selected values move away from the original array.
  // The source values stay exactly where they were.
  // ------------------------------------------------------------

  function resultP(k, count, y = WORK_Y) {
    const spacing = P ? 1.85 : 2.10;

    return [
      (k - (count - 1) / 2) * spacing,
      y,
      0
    ];
  }

  function resultCard(i, k, count, y = WORK_Y) {
    const p = resultP(k, count, y);

    const w = P ? 1.60 : 1.85;
    const h = P ? 1.12 : 0.71;

    const frame = rect(
      w,
      h,
      p,
      C.green,
      C.green,
      0.10,
      2
    );

    const value = text(
      String(D1[i]),
      P ? 34 : 29,
      C.green,
      [
        p[0],
        p[1] + (P ? 0.12 : 0.09),
        0
      ],
      true
    );

    const day = text(
      DAYS[i],
      P ? 17 : 15,
      C.ink,
      [
        p[0],
        p[1] - (P ? 0.30 : 0.20),
        0
      ]
    );

    return new M.VGroup(
      frame,
      value,
      day
    );
  }

  function resultValueAtSource(i) {
    return text(
      String(D1[i]),
      P ? 31 : 33,
      C.green,
      readingP(i),
      true,
      BW - 0.10
    );
  }

  function resultHeading(count, y = WORK_Y) {
    return text(
      `${count} SELECTED`,
      P ? 17 : 15,
      C.green,
      [
        P ? -2.85 : -3.70,
        y,
        0
      ],
      false,
      P ? 1.40 : 1.80
    );
  }

  function resultRow(indices, y = WORK_Y) {
    const a = [];

    indices.forEach((i, k) => {
      a.push(
        ...put(
          `result${k}`,
          resultCard(i, k, indices.length, y)
        )
      );
    });

    if (indices.length === 2) {
      a.push(
        ...put(
          'resultHeading',
          resultHeading(indices.length, y)
        )
      );
    }

    return a;
  }

  function removeResults() {
    return drop(
      'result0',
      'result1',
      'result2',
      'resultHeading',
      'flying0',
      'flying1',
      'flying2'
    );
  }

  // ------------------------------------------------------------
  // Extra pictures for scale and threshold comparisons.
  // ------------------------------------------------------------

  function manyReadings() {
    const cols = P ? 14 : 20;
    const rows = 3;

    const dx = P ? 0.32 : 0.35;
    const dy = P ? 0.25 : 0.18;

    const cells = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x =
          (c - (cols - 1) / 2) * dx;

        const y =
          CODE_Y +
          ((rows - 1) / 2 - r) * dy;

        cells.push(
          rect(
            dx * 0.75,
            dy * 0.75,
            [x, y, 0],
            C.cyan,
            C.cyan,
            0.15,
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
        (cols - 1) / 2 * dx + 0.40,
        CODE_Y,
        0
      ],
      true
    );

    return new M.VGroup(...cells, more);
  }

  function thresholdPicture() {
    const p = [0, CODE_Y, 0];

    const left = P ? -2.65 : -3.80;
    const right = -left;

    const y = CODE_Y - 0.14;

    const axis = line(
      [left, y, 0],
      [right, y, 0],
      C.muted,
      2
    );

    const n2x = v =>
      left + (v - 20) / 10 * (right - left);

    const hotZone = new M.Rectangle({
      width: right - n2x(25),
      height: P ? 0.23 : 0.15,
      color: C.amber,
      strokeWidth: 1
    });

    hotZone.setFill(C.amber, 0.22);

    hotZone.moveTo([
      (n2x(25) + right) / 2,
      y,
      0
    ]);

    const ticks = [20, 25, 30].map(v => {
      const x = n2x(v);

      return new M.VGroup(
        line(
          [x, y - 0.10, 0],
          [x, y + 0.10, 0],
          v === 25 ? C.amber : C.muted,
          2
        ),

        text(
          `${v}°`,
          P ? 17 : 15,
          v === 25 ? C.amber : C.muted,
          [x, y - 0.28, 0],
          true
        )
      );
    });

    const label = text(
      'HOTTER THAN 25°C',
      P ? 19 : 17,
      C.amber,
      [
        (n2x(25) + right) / 2,
        y + (P ? 0.43 : 0.32),
        0
      ],
      false,
      P ? 2.75 : 3.7
    );

    const boundary = new M.Circle({
      radius: 0.09,
      color: C.amber,
      strokeWidth: 2
    });

    boundary.setFill(C.card, 1);
    boundary.moveTo([n2x(25), y, 0]);

    return new M.VGroup(
      axis,
      hotZone,
      ...ticks,
      boundary,
      label
    );
  }

  // ============================================================
  // 0-3: Introduce the week and the threshold question.
  // ============================================================

  // 0. Here again is our week of noon readings, called readings.
  await until(S(0));

  const frames = [];
  const dayLabels = [];
  const indices = [];

  for (let i = 0; i < 7; i++) {
    const r = readingFrame(i);
    const d = dayLabel(i);
    const n = indexLabel(i);

    visible.set(`frame${i}`, r);
    visible.set(`day${i}`, d);
    visible.set(`index${i}`, n);

    frames.push(r);
    dayLabels.push(d);
    indices.push(n);
  }

  await play(
    new M.LaggedStart(
      frames.map((r, i) =>
        new M.LaggedStart(
          [
            new M.FadeIn(r),
            new M.FadeIn(dayLabels[i]),
            new M.FadeIn(indices[i])
          ],
          { lagRatio: 0.04 }
        )
      ),
      { lagRatio: 0.10, runTime: 1.4 }
    ),

    ...put(
      'heading',
      tag(
        'readings',
        C.violet,
        [0, CODE_Y, 0],
        23
      )
    ),

    ...put('rowOutline', rowOutline()),

    ...say('ONE WEEK OF NOON READINGS')
  );

  // 1. Twenty, twenty-two, twenty-five, thirty,
  // twenty-four, twenty-one, twenty-six.
  await until(S(1));

  const values = D1.map((_, i) => readingValue(i));

  values.forEach((v, i) => {
    visible.set(`value${i}`, v);
  });

  await play(
    new M.LaggedStart(
      values.map(v => new M.FadeIn(v)),
      {
        lagRatio: 0.28,
        runTime: 3.7
      }
    ),

    ...put(
      'work',
      work([
        ['MONDAY TO SUNDAY', C.cyan],
        ['Temperatures in degrees Celsius', C.muted]
      ])
    ),

    ...say('SEVEN DAYS · SEVEN VALUES')
  );

  // 2. Many greenhouse plants suffer above 25 degrees.
  await until(S(2));

  await play(
    ...drop('heading'),

    ...put(
      'threshold',
      thresholdPicture()
    ),

    ...put(
      'work',
      work([
        ['25°C', C.amber],
        ['Our temperature threshold', C.ink]
      ], C.amber)
    ),

    ...say('HOTTER THAN 25°C', C.amber)
  );

  // 3. On which days was it hotter than 25?
  await until(S(3));

  await play(
    ...put(
      'work',
      work([
        ['QUESTION', C.amber],
        ['Which days were hotter than 25°C?', C.ink]
      ], C.amber)
    ),

    ...say('WHICH DAYS WERE TOO HOT?', C.amber)
  );

  // ============================================================
  // 4-7: Replace repeated indexing with one shared question.
  // ============================================================

  // 4. We could fetch each day and check it by eye.
  await until(S(4));

  const sequential = D1.map((_, i) =>
    new M.Indicate(
      visible.get(`value${i}`),
      {
        color: C.amber,
        runTime: 0.55
      }
    )
  );

  await play(
    ...drop('threshold'),

    ...put(
      'code',
      cell([
        ['readings', C.cyan],
        ['[0]', C.amber]
      ])
    ),

    new M.LaggedStart(
      sequential,
      {
        lagRatio: 0.40,
        runTime: 2.7
      }
    ),

    ...put(
      'work',
      work([
        ['ONE DAY AT A TIME', C.amber],
        ['Read it, check it, repeat', C.ink]
      ], C.amber)
    ),

    ...say('CHECK EACH VALUE BY HAND', C.amber)
  );

  // 5. Seven days is fine; a whole year is too slow.
  await until(S(5));

  await play(
    ...drop('code'),

    ...put(
      'many',
      manyReadings()
    ),

    ...put(
      'work',
      work([
        ['365 DAYS', C.amber],
        ['365 separate checks?', C.ink]
      ], C.amber)
    ),

    ...say('TOO SLOW FOR A WHOLE YEAR', C.amber)
  );

  // 6. Ask one yes-or-no question for every day at once.
  await until(S(6));

  const pending = D1.map(
    (_, i) => answerBox(i, null)
  );

  pending.forEach((m, i) => {
    visible.set(`answer${i}`, m);
  });

  await play(
    ...drop('many'),

    new M.LaggedStart(
      pending.map(m => new M.FadeIn(m)),
      {
        lagRatio: 0.10,
        runTime: 1.4
      }
    ),

    ...put(
      'heading',
      tag(
        'ONE QUESTION',
        C.violet,
        [0, CODE_Y, 0],
        21
      )
    ),

    ...put(
      'work',
      work([
        ['EVERY DAY GETS AN ANSWER', C.violet],
        ['Yes or no?', C.ink]
      ], C.violet)
    ),

    ...say('ASK EVERY VALUE AT ONCE', C.violet)
  );

  // 7. Is this reading greater than 25?
  await until(S(7));

  await play(
    ...put(
      'heading',
      tag(
        'IS THE READING > 25?',
        C.amber,
        [0, CODE_Y, 0],
        22
      )
    ),

    ...put(
      'work',
      work([
        ['Greater than 25?', C.amber],
        ['Check each reading against 25', C.ink]
      ], C.amber)
    ),

    ...say('ONE YES-OR-NO QUESTION', C.amber)
  );

  // ============================================================
  // 8-14: Answer the question for each day.
  // Short narration beats use short animations and keep the
  // existing pill, so the sequence stays in sync.
  // ============================================================

  // 8. Monday, 20: no.
  await until(S(8));

  await play(
    ...answerDay(0)
  );

  // 9. Tuesday, 22: no.
  await until(S(9));

  await play(
    ...answerDay(1)
  );

  // 10. Wednesday, 25: no. Equal is not greater.
  await until(S(10));

  await play(
    ...answerDay(2),

    ...say('EQUAL IS NOT GREATER', C.amber)
  );

  await until(S(10) + 2.1);

  await play(
    ...put(
      'work',
      work([
        ['25 = 25', C.cyan],
        ['25 > 25 is False', C.muted]
      ], C.amber)
    ),

    ...mark('value2', C.amber)
  );

  // 11. Thursday, 30: yes.
  await until(S(11));

  await play(
    ...answerDay(3)
  );

  // 12. Friday, 24: no.
  await until(S(12));

  await play(
    ...answerDay(4)
  );

  // 13. Saturday, 21: no.
  await until(S(13));

  await play(
    ...answerDay(5)
  );

  // 14. Sunday, 26: yes.
  await until(S(14));

  await play(
    ...answerDay(6)
  );

  // ============================================================
  // 15-21: Yes and no become Boolean values.
  // ============================================================

  // 15. The computer writes yes as True and no as False.
  await until(S(15));

  await play(
    ...drop('focus'),

    ...showMask(STRICT_MASK),

    ...put(
      'work',
      work([
        ['YES → True', C.green],
        ['NO  → False', C.muted]
      ], C.violet)
    ),

    ...say('YES = TRUE · NO = FALSE', C.violet)
  );

  // 16. A value that can only be True or False is a Boolean.
  await until(S(16));

  await play(
    ...put(
      'maskOutline',
      maskOutline()
    ),

    ...put(
      'work',
      work([
        ['BOOLEAN', C.violet],
        ['A value that is True or False', C.ink]
      ], C.violet)
    ),

    ...say('BOOLEAN = TRUE OR FALSE', C.violet)
  );

  // 17. In code: readings, greater-than sign, 25.
  await until(S(17));

  await play(
    ...drop('heading'),

    ...put(
      'code',
      questionCode(
        '>',
        {
          highlight: [1, 1, C.amber]
        }
      )
    ),

    ...put(
      'work',
      work([
        ['readings > 25', C.amber],
        ['Ask the same question of every value', C.ink]
      ], C.amber)
    ),

    ...say('THE QUESTION WRITTEN AS CODE')
  );

  // 18. The wide side of the greater-than sign faces
  // the bigger number.
  await until(S(18));

  await play(
    ...focus(3, C.green),

    ...put(
      'work',
      work([
        ['30   >   25', C.green],
        ['Wide side faces the bigger number', C.ink]
      ], C.amber)
    ),

    ...say('> MEANS GREATER THAN', C.amber)
  );

  // 19. This works with a data-tool array,
  // not a plain Python list.
  await until(S(19));

  await play(
    ...drop('focus'),

    ...put(
      'code',
      questionCode('>')
    ),

    ...put(
      'work',
      work([
        ['DATA-TOOL ARRAY: checks every value', C.green],
        ['Plain Python list: not this way', C.muted]
      ], C.cyan)
    ),

    ...say('ARRAYS CAN ANSWER VALUE BY VALUE')
  );

  // 20. The answer is a new row of seven Booleans.
  await until(S(20));

  const revealBooleans = STRICT_MASK.map((yes, i) =>
    new M.Indicate(
      visible.get(`answer${i}`),
      {
        color: yes ? C.green : C.muted,
        runTime: 0.65
      }
    )
  );

  await play(
    new M.LaggedStart(
      revealBooleans,
      {
        lagRatio: 0.24,
        runTime: 3.8
      }
    ),

    ...put(
      'work',
      work([
        ['False, False, False, True,', C.ink],
        ['False, False, True', C.ink]
      ], C.violet)
    ),

    ...say('A NEW ROW OF SEVEN ANSWERS', C.violet)
  );

  // 21. One answer for each day, in the same order.
  await until(S(21));

  await play(
    ...put(
      'alignment',
      alignmentLines()
    ),

    ...put(
      'work',
      work([
        ['7 READINGS → 7 ANSWERS', C.violet],
        ['Same positions, same day order', C.ink]
      ], C.violet)
    ),

    ...say('ONE ANSWER FOR EACH READING', C.violet)
  );

  // ============================================================
  // 22-26: Turn the Boolean row into a physical stencil.
  // ============================================================

  // 22. Picture the answers as a stencil laid over the readings.
  await until(S(22));

  const stencilLift = [];

  for (let i = 0; i < 7; i++) {
    const part = stencilPiece(i, 'neutral', MASK_Y);

    visible.set(`stencil${i}`, part);

    stencilLift.push(
      new M.FadeIn(
        part,
        { runTime: 0.35 }
      )
    );
  }

  await play(
    ...drop('alignment'),

    ...stencilLift,

    ...put(
      'work',
      work([
        ['PICTURE A STENCIL', C.violet],
        ['Lay the answers over the readings', C.ink]
      ], C.violet)
    ),

    ...say('LAY THE MASK OVER THE DATA', C.violet)
  );

  await play(
    new M.LaggedStart(
      D1.map((_, i) =>
        new M.Transform(
          visible.get(`stencil${i}`),
          stencilPiece(i, 'neutral', ROW_Y),
          {
            runTime: 0.85
          }
        )
      ),
      {
        lagRatio: 0.06,
        runTime: 1.55
      }
    )
  );

  // 23. True makes a hole, letting the reading show through.
  await until(S(23));

  await play(
    ...HOT.flatMap(i =>
      put(
        `stencil${i}`,
        stencilPiece(i, 'hole')
      )
    ),

    ...put(
      'work',
      work([
        ['True = A HOLE', C.green],
        ['The reading stays visible', C.ink]
      ], C.green)
    ),

    ...say('TRUE: LET THE VALUE SHOW', C.green)
  );

  // 24. False covers the reading.
  await until(S(24));

  const covered = D1
    .map((_, i) => i)
    .filter(i => !STRICT_MASK[i]);

  await play(
    ...covered.flatMap(i =>
      put(
        `stencil${i}`,
        stencilPiece(i, 'covered')
      )
    ),

    ...put(
      'work',
      work([
        ['False = COVERED', C.muted],
        ['The reading is hidden, not deleted', C.ink]
      ], C.violet)
    ),

    ...say('FALSE: COVER THE VALUE', C.muted)
  );

  // 25. This row of True and False is a Boolean mask.
  await until(S(25));

  await play(
    ...put(
      'code',
      maskCode('>')
    ),

    ...put(
      'maskOutline',
      maskOutline(C.violet)
    ),

    ...put(
      'work',
      work([
        ['BOOLEAN MASK', C.violet],
        ['True keeps a value. False hides it.', C.ink]
      ], C.violet)
    ),

    ...say('A ROW OF BOOLEANS IS OUR MASK', C.violet)
  );

  // 26. Using a mask to keep only some values is filtering.
  await until(S(26));

  await play(
    ...mark('stencil3', C.green),
    ...mark('stencil6', C.green),

    ...put(
      'work',
      work([
        ['FILTERING', C.green],
        ['Keep only the selected values', C.ink]
      ], C.green)
    ),

    ...say('FILTERING = KEEP SELECTED VALUES', C.green)
  );

  // ============================================================
  // 27-31: Use the mask inside square brackets.
  // ============================================================

  // 27. In code, filtering looks like indexing.
  await until(S(27));

  await play(
    ...put(
      'code',
      incompleteFilterCode()
    ),

    ...put(
      'work',
      work([
        ['readings[ ]', C.violet],
        ['The square brackets look familiar', C.ink]
      ], C.violet)
    ),

    ...say('FILTERING LOOKS LIKE INDEXING')
  );

  // 28. Inside the brackets, put the whole mask.
  await until(S(28));

  await play(
    ...put(
      'code',
      filterCode({
        highlight: [2, 2, C.violet]
      })
    ),

    ...mark('maskOutline', C.violet),

    ...put(
      'work',
      work([
        ['readings[mask]', C.violet],
        ['Use the whole row of True and False', C.ink]
      ], C.violet)
    ),

    ...say('USE A MASK, NOT ONE POSITION', C.violet)
  );

  // 29. Two readings show through: 30 and 26.
  await until(S(29));

  const fly = HOT.map(i => resultValueAtSource(i));

  fly.forEach((v, k) => {
    visible.set(`flying${k}`, v);
  });

  await play(
    ...drop('work'),

    ...fly.map(v =>
      new M.FadeIn(v, { runTime: 0.25 })
    ),

    ...say('TWO VALUES SHOW THROUGH', C.green)
  );

  await play(
    new M.LaggedStart(
      fly.map((v, k) =>
        new M.Transform(
          v,
          text(
            String(D1[HOT[k]]),
            P ? 34 : 29,
            C.green,
            resultP(k, HOT.length, WORK_Y),
            true
          ),
          {
            pathArc: k === 0 ? 0.35 : -0.35,
            runTime: 0.80
          }
        )
      ),
      {
        lagRatio: 0.12,
        runTime: 1.05
      }
    )
  );

  // 30. Thursday and Sunday were hotter than 25.
  await until(S(30));

  await play(
    ...drop('flying0', 'flying1'),

    ...resultRow(HOT),

    ...put(
      'day3',
      dayLabel(3, C.green)
    ),

    ...put(
      'day6',
      dayLabel(6, C.green)
    ),

    ...say('THURSDAY AND SUNDAY', C.green)
  );

  // 31. The original readings are unchanged.
  await until(S(31));

  await play(
    ...removeStencil(),

    ...put(
      'code',
      filterCode()
    ),

    ...mark('rowOutline', C.cyan),

    ...say('THE ORIGINAL DATA IS UNCHANGED', C.cyan)
  );

  // ============================================================
  // 32-35: Count the hot days and calculate their mean.
  // ============================================================

  // 32. Now work with just the hot days.
  await until(S(32));

  await play(
    ...removeMask(),

    ...drop('resultHeading'),

    ...HOT.flatMap((i, k) =>
      transform(
        `result${k}`,
        resultCard(i, k, HOT.length, MASK_Y),
        { runTime: 0.65 }
      )
    )
  );

  // 33. How many? Count the True answers: two.
  await until(S(33));

  await play(
    ...put(
      'work',
      work([
        ['COUNT THE TRUE ANSWERS', C.violet],
        ['2 hot days', C.green]
      ], C.green)
    ),

    ...mark('result0', C.green),
    ...mark('result1', C.green),

    ...say('COUNT = 2', C.green)
  );

  // 34. How hot on average? Add, then divide by how many.
  await until(S(34));

  await play(
    ...put(
      'work',
      work([
        ['mean = sum ÷ count', C.ink],
        ['     = (30 + 26) ÷ 2', C.amber]
      ], C.amber)
    ),

    ...say('MEAN = ADD, THEN DIVIDE', C.amber)
  );

  // 35. 30 + 26 = 56. Divide by 2 to get 28.
  await until(S(35));

  await play(
    ...put(
      'work',
      work([
        ['30 + 26 = 56', C.amber],
        ['56 ÷ 2 = 28°C', C.green]
      ], C.green)
    ),

    ...say('MEAN OF THE HOT DAYS = 28°C', C.green)
  );

  await until(S(35) + 3.1);

  await play(
    ...put(
      'work',
      work([
        ['2 HOT DAYS', C.cyan],
        ['AVERAGE: 28°C', C.green]
      ], C.green)
    )
  );

  // ============================================================
  // 36-37: Why Boolean masks are useful.
  // ============================================================

  // 36. A mask picks values that answer a question,
  // from data of any size.
  await until(S(36));

  await play(
    ...put(
      'code',
      cell([
        ['readings', C.cyan],
        ['[', C.ink],
        ['readings > 25', C.violet],
        [']', C.ink]
      ])
    ),

    ...put(
      'work',
      work([
        ['ASK A QUESTION', C.violet],
        ['Keep only the data that answers it', C.ink]
      ], C.violet)
    ),

    ...say('ONE QUESTION SELECTS THE DATA', C.violet)
  );

  // 37. Seven days or seven million, the same line works.
  await until(S(37));

  await play(
    ...put(
      'work',
      work([
        ['7 READINGS OR 7,000,000', C.cyan],
        ['The same short line of code', C.ink]
      ], C.cyan)
    ),

    ...mark('code', C.cyan),

    ...say('MORE DATA. SAME QUESTION.')
  );

  // ============================================================
  // 38-43: Common trap — the threshold edge value.
  // ============================================================

  // 38. Here is a common trap: the edge value.
  await until(S(38));

  await play(
    ...removeResults(),

    ...showMask(STRICT_MASK),

    ...put(
      'maskOutline',
      maskOutline()
    ),

    ...put(
      'day3',
      dayLabel(3)
    ),

    ...put(
      'day6',
      dayLabel(6)
    ),

    ...put(
      'code',
      questionCode(
        '>',
        {
          highlight: [1, 1, C.amber]
        }
      )
    ),

    ...focus(2),

    ...put(
      'work',
      work([
        ['COMMON TRAP', C.amber],
        ['What happens at exactly 25?', C.ink]
      ], C.amber)
    ),

    ...say('COMMON TRAP: THE EDGE VALUE', C.amber)
  );

  // 39. Greater than 25 leaves out Wednesday's 25.
  await until(S(39));

  await play(
    ...stencilRow(STRICT_MASK),

    ...put(
      'day2',
      dayLabel(2, C.amber)
    ),

    ...mark('answer2', C.amber),

    ...put(
      'work',
      work([
        ['25 > 25 → False', C.muted],
        ['Wednesday is not included', C.amber]
      ], C.amber)
    ),

    ...say('GREATER THAN EXCLUDES EXACTLY 25', C.amber)
  );

  // 40. To mean 25 or more, use greater than or equal to.
  await until(S(40));

  await play(
    ...removeStencil(),

    ...put(
      'code',
      questionCode(
        '>=',
        {
          highlight: [1, 1, C.green]
        }
      )
    ),

    ...put(
      'work',
      work([
        ['>   Greater than', C.amber],
        ['>=  Greater than or equal to', C.green]
      ], C.green)
    ),

    ...say('>= MEANS 25 OR MORE', C.green)
  );

  // 41. Now three values show through: 25, 30 and 26.
  await until(S(41));

  await play(
    ...drop('focus'),

    ...put(
      'answer2',
      answerBox(2, INCLUSIVE_MASK[2])
    ),

    ...stencilRow(INCLUSIVE_MASK),

    ...put(
      'day2',
      dayLabel(2, C.green)
    ),

    ...put(
      'day3',
      dayLabel(3, C.green)
    ),

    ...put(
      'day6',
      dayLabel(6, C.green)
    ),

    ...put(
      'work',
      work([
        ['25, 30, 26', C.green],
        ['Wednesday, Thursday, Sunday', C.ink]
      ], C.green)
    ),

    ...say('NOW THREE VALUES SHOW THROUGH', C.green)
  );

  // 42. One small sign changes the answer from two to three.
  await until(S(42));

  await play(
    ...put(
      'work',
      work([
        ['>  25 → 2 days', C.amber],
        ['>= 25 → 3 days', C.green]
      ], C.violet)
    ),

    ...mark('answer2', C.green),

    ...say('ONE SMALL SIGN CHANGES THE ANSWER', C.violet)
  );

  // 43. Say the question in words, then choose the matching sign.
  await until(S(43));

  await play(
    ...removeStencil(),

    ...put(
      'day2',
      dayLabel(2)
    ),

    ...put(
      'day3',
      dayLabel(3)
    ),

    ...put(
      'day6',
      dayLabel(6)
    ),

    ...put(
      'work',
      work([
        ['Hotter than 25  →  >  25', C.amber],
        ['25 or more      →  >= 25', C.green]
      ], C.violet)
    ),

    ...say('WORDS FIRST. THEN CHOOSE THE SIGN.', C.violet)
  );

  // ============================================================
  // 44: Final definition and visual recap.
  // Return to the original strict question: readings > 25.
  // ============================================================

  // 44. A Boolean mask is a row of True and False
  // that keeps only the values answering your question.
  await until(S(44));

  await play(
    ...showMask(STRICT_MASK),

    ...put(
      'code',
      filterCode({
        highlight: [2, 2, C.violet]
      })
    ),

    ...put(
      'work',
      work([
        ['BOOLEAN MASK = a row of True and False', C.violet],
        ['Keep only the values answering a question', C.ink]
      ], C.violet)
    ),

    ...say('BOOLEAN MASKS SELECT VALUES', C.green)
  );

  await until(S(44) + 2.2);

  await play(
    ...stencilRow(STRICT_MASK),

    ...put(
      'day3',
      dayLabel(3, C.green)
    ),

    ...put(
      'day6',
      dayLabel(6, C.green)
    ),

    ...put(
      'code',
      cell([
        ['readings', C.cyan],
        ['[', C.ink],
        ['readings > 25', C.violet],
        [']', C.ink]
      ])
    ),

    ...put(
      'work',
      work([
        ['QUESTION → MASK → SELECTED VALUES', C.violet],
        ['[30, 26]', C.green]
      ], C.green)
    )
  );

  await until(S(44) + 4.5);

  await play(
    ...mark('stencil3', C.green),
    ...mark('stencil6', C.green),

    ...say('TRUE KEEPS. FALSE LEAVES OUT.', C.green)
  );
}

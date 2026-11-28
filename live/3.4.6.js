// lesson 3.4.6
// A reproducible notebook: restart and run everything from top to bottom.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved live-engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D1 = [20, 22, 25, 30, 24, 21, 26];
  const OFFSET = 1;
  const D2 = [19, 21, 24, 29, 23, 20, 25];

  const SUM_BEFORE = 168;
  const SUM_AFTER = 161;
  const MEAN_BEFORE = 24;
  const MEAN_AFTER = 23;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Include the NumPy import in cell one so that a clean run really
  // is self-contained. The shared readings and calculations are
  // unchanged. Ordinary Python lists do not support subtraction.

  const CELL_CODE = {
    1: [
      ['import numpy as np', C.muted],
      ['readings = np.array([20, 22, 25, 30, 24, 21, 26])', C.cyan]
    ],
    2: [
      ['offset = 1', C.amber]
    ],
    3: [
      ['calibrated = readings - offset', C.green]
    ],
    4: [
      ['calibrated.mean()', C.violet]
    ]
  };

  const NORMAL_ORDER = [1, 2, 3, 4];
  const DELETED_ORDER = [1, 3, 4];

  // A temporary rearrangement used only to illustrate the final trap.
  const WRONG_ORDER = [1, 3, 2, 4];

  // ------------------------------------------------------------
  // Responsive layout.
  // Phone: 8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  //
  // Laptop: notebook page on the left, memory shelf on the right.
  // Phone: notebook page above, memory shelf below.
  // ------------------------------------------------------------

  const PILL = P ? [0, 3.75, 0] : [0, 1.85, 0];

  const NX = P ? 0 : -3.15;
  const NY = P ? 1.05 : -0.31;
  const NW = P ? 7.00 : 7.40;
  const NH = P ? 4.00 : 3.56;

  const NTOP = NY + NH / 2;
  const NBOTTOM = NY - NH / 2;

  const SX = P ? 0 : 4.03;
  const SY = P ? -2.49 : -0.31;
  const SW = P ? 7.00 : 5.30;
  const SH = P ? 2.78 : 3.56;

  const STOP = SY + SH / 2;
  const SBOTTOM = SY - SH / 2;

  const CELL_W = NW - 0.38;

  const SLOT_Y = P
    ? [2.18, 1.32, 0.54, -0.24]
    : [0.65, -0.12, -0.76, -1.40];

  const CELL_H = P ? 0.66 : 0.56;
  const FIRST_H = P ? 0.90 : 0.82;

  const MEMORY_Y = P
    ? [-1.85, -2.57, -3.29]
    : [0.57, -0.44, -1.45];

  const MEMORY_W = SW - 0.45;
  const MEMORY_H = P ? 0.60 : 0.78;

  const WORK_Y = P ? -4.72 : -2.61;
  const WORK_W = P ? 6.90 : 12.10;
  const WORK_H = P ? 1.22 : 0.80;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Visible-object management.
  // Keep every live object independently tracked.
  // Never regroup already-visible objects for highlighting.
  // ------------------------------------------------------------

  const visible = new Map();

  function put(key, obj, runTime = 0.40) {
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
          { runTime: 0.35 }
        )
      );

      visible.delete(key);
    }

    return a;
  }

  function clear() {
    return drop(...Array.from(visible.keys()));
  }

  function mark(key, color = C.amber, runTime = 0.70) {
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

  function arrow(a, b, color = C.amber, head = 0.14) {
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
  // Formula and explanation box.
  // ------------------------------------------------------------

  function formulaBox(
    lines,
    p,
    w,
    h,
    color = C.cyan,
    size = P ? 22 : 19,
    lhMax = P ? 0.40 : 0.30
  ) {
    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98
    );

    const lh = Math.min(
      lhMax,
      (h - 0.12) / Math.max(lines.length, 1)
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

  function work(lines, color = C.cyan) {
    return formulaBox(
      lines,
      [0, WORK_Y, 0],
      WORK_W,
      WORK_H,
      color,
      lines.length > 1
        ? (P ? 22 : 21)
        : (P ? 26 : 24)
    );
  }

  // ------------------------------------------------------------
  // Opening picture: two people, two screens, the same notebook.
  // ------------------------------------------------------------

  function person(p, color = C.ink) {
    const head = new M.Circle({
      radius: 0.15,
      color,
      strokeWidth: 1
    });

    head.setFill(color, 0.95);

    head.moveTo([
      p[0],
      p[1] + 0.24,
      0
    ]);

    const body = new M.Arc({
      radius: 0.27,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.95);

    body.moveTo([
      p[0],
      p[1] - 0.10,
      0
    ]);

    return new M.VGroup(head, body);
  }

  const INTRO_W = P ? 5.85 : 5.45;
  const INTRO_H = P ? 2.55 : 3.30;

  const YOUR_P = P
    ? [0, 1.32, 0]
    : [-3.15, -0.30, 0];

  const COLLEAGUE_P = P
    ? [0, -1.75, 0]
    : [3.15, -0.30, 0];

  function introScreen(p, name, state = 'pending') {
    const w = INTRO_W;
    const h = INTRO_H;

    const color =
      state === 'success'
        ? C.green
        : state === 'error'
          ? C.amber
          : C.cyan;

    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98
    );

    const top = p[1] + h / 2;

    const user = person(
      [
        p[0] - w / 2 + 0.57,
        top - 0.46,
        0
      ],
      color
    );

    const label = text(
      name,
      P ? 20 : 22,
      color,
      [
        p[0] + 0.18,
        top - 0.43,
        0
      ],
      false,
      w - 1.55
    );

    const divider = line(
      [
        p[0] - w / 2 + 0.20,
        top - 0.82,
        0
      ],
      [
        p[0] + w / 2 - 0.20,
        top - 0.82,
        0
      ],
      C.muted,
      1
    );

    const notebookName = text(
      'greenhouse.ipynb',
      P ? 21 : 22,
      C.ink,
      [
        p[0],
        top - 1.08,
        0
      ],
      true,
      w - 0.45
    );

    let result;
    let status;

    if (state === 'success') {
      result = '23°C';
      status = 'Notebook ran successfully';
    } else if (state === 'error') {
      result = 'ERROR';
      status = 'offset is not defined';
    } else {
      result = '…';
      status = 'Ready to run';
    }

    const resultText = text(
      result,
      state === 'error'
        ? (P ? 34 : 40)
        : (P ? 42 : 48),
      color,
      [
        p[0],
        p[1] - (P ? 0.22 : 0.25),
        0
      ],
      true,
      w - 0.55
    );

    const statusText = text(
      status,
      P ? 18 : 20,
      color,
      [
        p[0],
        p[1] - h / 2 + 0.30,
        0
      ],
      false,
      w - 0.45
    );

    return new M.VGroup(
      frame,
      user,
      label,
      divider,
      notebookName,
      resultText,
      statusText
    );
  }

  function sharingArrow() {
    if (P) {
      return arrow(
        [
          0,
          YOUR_P[1] - INTRO_H / 2 - 0.05,
          0
        ],
        [
          0,
          COLLEAGUE_P[1] + INTRO_H / 2 + 0.05,
          0
        ],
        C.violet,
        0.12
      );
    }

    return arrow(
      [
        YOUR_P[0] + INTRO_W / 2 + 0.08,
        YOUR_P[1],
        0
      ],
      [
        COLLEAGUE_P[0] - INTRO_W / 2 - 0.08,
        COLLEAGUE_P[1],
        0
      ],
      C.violet,
      0.15
    );
  }

  // ------------------------------------------------------------
  // Notebook page.
  // Cell numbers identify the lesson's original four cells,
  // rather than Python execution counters.
  // ------------------------------------------------------------

  let pageOrder = NORMAL_ORDER.slice();
  let cellStatus = {};

  function notebookPage() {
    const frame = rect(
      NW,
      NH,
      [NX, NY, 0],
      C.muted,
      C.card,
      0.80
    );

    const title = text(
      'greenhouse.ipynb',
      P ? 21 : 22,
      C.ink,
      [NX, NTOP - 0.23, 0],
      true,
      NW - 0.55
    );

    const divider = line(
      [
        NX - NW / 2 + 0.20,
        NTOP - 0.40,
        0
      ],
      [
        NX + NW / 2 - 0.20,
        NTOP - 0.40,
        0
      ],
      C.muted,
      1
    );

    return new M.VGroup(
      frame,
      title,
      divider
    );
  }

  function statusStyle(state) {
    switch (state) {
      case 'done':
        return {
          color: C.green,
          label: '✓ DONE'
        };

      case 'running':
        return {
          color: C.amber,
          label: '▶ RUNNING'
        };

      case 'error':
        return {
          color: C.amber,
          label: '× ERROR'
        };

      case 'blocked':
        return {
          color: C.muted,
          label: 'NOT RUN'
        };

      case 'blank':
        return {
          color: C.muted,
          label: 'EMPTY'
        };

      default:
        return {
          color: C.cyan,
          label: '▶ RUN'
        };
    }
  }

  function codeCell(id, slot, state = 'ready') {
    const y = SLOT_Y[slot];
    const h = id === 1 ? FIRST_H : CELL_H;

    const status = statusStyle(state);

    const frame = rect(
      CELL_W,
      h,
      [NX, y, 0],
      status.color,
      C.card,
      0.98,
      state === 'running' || state === 'error' ? 2 : 1
    );

    const headerY = y + h / 2 - 0.13;

    const left = NX - CELL_W / 2;
    const right = NX + CELL_W / 2;

    // Header tags: no fit() here, so they keep a readable size.
    const number = T(`CELL ${id}`, P ? 17 : 16, C.muted, true);
    number.moveTo([left + 0.21 + number.getWidth() / 2, headerY - 0.02, 0]);

    const runStatus = T(status.label, P ? 17 : 16, status.color, true);
    runStatus.moveTo([right - 0.21 - runStatus.getWidth() / 2, headerY - 0.02, 0]);

    const rows = [];

    if (state === 'blank') {
      rows.push(
        text(
          '…',
          19,
          C.muted,
          [NX, y - 0.12, 0],
          true
        )
      );
    } else {
      const code = CELL_CODE[id];

      code.forEach(([s, color], i) => {
        const cy =
          id === 1
            ? y + 0.035 - i * 0.25
            : y - 0.12;

        const size =
          id === 1
            ? (P ? 18 : 18)
            : (P ? 23 : 22);

        const t = fit(
          T(s, size, color, true),
          CELL_W - (P ? 0.75 : 0.42)
        );

        t.moveTo([
          left + 0.21 + t.getWidth() / 2,
          cy,
          0
        ]);

        rows.push(t);
      });
    }

    return new M.VGroup(
      frame,
      number,
      runStatus,
      ...rows
    );
  }

  function cellOutline(id, color = C.amber) {
    const slot = pageOrder.indexOf(id);

    if (slot < 0) return null;

    const h = id === 1 ? FIRST_H : CELL_H;

    return rect(
      CELL_W + 0.10,
      h + 0.08,
      [NX, SLOT_Y[slot], 0],
      color,
      C.card,
      0,
      3
    );
  }

  function focusCell(id, color = C.amber) {
    const outline = cellOutline(id, color);

    if (!outline) {
      return drop('cellFocus');
    }

    return put(
      'cellFocus',
      outline,
      0.30
    );
  }

  function setCell(id, state = 'ready') {
    const slot = pageOrder.indexOf(id);

    if (slot < 0) return [];

    cellStatus[id] = state;

    return put(
      `cell${id}`,
      codeCell(id, slot, state),
      0.35
    );
  }

  function setPage(order, states = {}) {
    const a = [];

    a.push(
      ...drop('cellFocus')
    );

    for (const id of NORMAL_ORDER) {
      if (!order.includes(id)) {
        a.push(
          ...drop(`cell${id}`)
        );
      }
    }

    pageOrder = order.slice();
    cellStatus = {};

    pageOrder.forEach((id, slot) => {
      const state = states[id] || 'ready';

      cellStatus[id] = state;

      a.push(
        ...put(
          `cell${id}`,
          codeCell(id, slot, state),
          0.35
        )
      );
    });

    return a;
  }

  function pageOutput(state = 'empty') {
    const y = NBOTTOM + 0.18;

    let label;
    let color;

    if (state === 'success') {
      label = 'Out: 23.0  →  23°C';
      color = C.green;
    } else if (state === 'error') {
      label = 'No new result · Cell 3 failed';
      color = C.amber;
    } else if (state === 'stale') {
      label = 'Out: 23.0  ·  Previous result';
      color = C.amber;
    } else {
      label = 'Out: —';
      color = C.muted;
    }

    return text(
      label,
      P ? 18 : 17,
      color,
      [NX, y, 0],
      true,
      CELL_W - 0.25
    );
  }

  function pageResult(state = 'empty') {
    return put(
      'pageOutput',
      pageOutput(state),
      0.35
    );
  }

  function pageOrderNote() {
    return text(
      'READINGS → OFFSET → CALIBRATED → MEAN',
      P ? 17 : 18,
      C.violet,
      [
        SX,
        STOP - 0.35,
        0
      ],
      true,
      SW - 0.45
    );
  }

  // ------------------------------------------------------------
  // Initial calculation board.
  // This occupies the space that will later become memory.
  // ------------------------------------------------------------

  function calculationBoard(
    stage = 'empty',
    options = {}
  ) {
    const frame = rect(
      SW,
      SH,
      [SX, SY, 0],
      stage === 'result' ? C.green : C.cyan,
      C.card,
      0.98
    );

    const title = text(
      stage === 'empty'
        ? 'RUN FROM TOP TO BOTTOM'
        : 'CALIBRATED WEEK',
      P ? 20 : 21,
      stage === 'result' ? C.green : C.cyan,
      [SX, STOP - 0.30, 0],
      false,
      SW - 0.40
    );

    const objects = [frame, title];

    if (stage === 'empty') {
      const steps = [
        ['1', 'Store the readings', C.cyan],
        ['2', 'Store the offset', C.amber],
        ['3', 'Correct the readings', C.green],
        ['4', 'Find the mean', C.violet]
      ];

      const dy = P ? 0.48 : 0.64;
      const top = STOP - (P ? 0.78 : 0.85);

      steps.forEach(([n, s, color], i) => {
        const y = top - i * dy;

        const badge = rect(
          0.42,
          0.36,
          [SX - SW / 2 + 0.55, y, 0],
          color,
          color,
          0.12,
          1
        );

        const num = text(
          n,
          17,
          color,
          [SX - SW / 2 + 0.55, y, 0],
          true
        );

        const label = text(
          s,
          P ? 21 : 20,
          color,
          [SX + 0.22, y, 0],
          false,
          SW - 1.35
        );

        objects.push(
          badge,
          num,
          label
        );
      });

      return new M.VGroup(...objects);
    }

    const rowY = STOP - (P ? 0.95 : 1.0);
    const sp = (SW - 0.55) / 7;
    const bw = sp - 0.07;
    const bh = P ? 0.56 : 0.63;

    D2.forEach((v, i) => {
      const x = SX + (i - 3) * sp;

      const box = rect(
        bw,
        bh,
        [x, rowY, 0],
        C.green,
        C.green,
        0.08,
        1
      );

      const value = text(
        String(v),
        P ? 25 : 21,
        C.green,
        [x, rowY, 0],
        true,
        bw - 0.07
      );

      const day = text(
        DAYS[i],
        P ? 15 : 14,
        C.muted,
        [x, rowY + bh / 2 + 0.19, 0],
        false,
        sp - 0.04
      );

      objects.push(
        box,
        value,
        day
      );
    });

    const totalY = rowY - (P ? 0.57 : 0.68);

    const sum = text(
      'SUM = 161',
      P ? 24 : 25,
      C.amber,
      [SX, totalY, 0],
      true,
      SW - 0.50
    );

    objects.push(sum);

    if (stage === 'result') {
      const meanY = totalY - (P ? 0.64 : 0.82);

      objects.push(
        text(
          '161 ÷ 7 = 23°C',
          P ? 28 : 30,
          C.green,
          [SX, meanY, 0],
          true,
          SW - 0.45
        )
      );
    }

    if (options.compare && !P) {
      objects.push(
        text(
          'Original mean: 24°C',
          17,
          C.muted,
          [SX, SBOTTOM + 0.20, 0],
          false,
          SW - 0.40
        )
      );
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // The memory shelf.
  // The shelf contains values, not the written instructions.
  // Each variable is represented by its own labelled box.
  // ------------------------------------------------------------

  let memoryState = {
    readings: false,
    offset: false,
    calibrated: false
  };

  const MEMORY_KEYS = [
    'readings',
    'offset',
    'calibrated'
  ];

  const MEMORY_COLORS = {
    readings: C.cyan,
    offset: C.amber,
    calibrated: C.green
  };

  function memoryIndex(name) {
    return MEMORY_KEYS.indexOf(name);
  }

  function shelfFrame(title = 'MEMORY · VALUES') {
    const frame = rect(
      SW,
      SH,
      [SX, SY, 0],
      C.violet,
      C.card,
      0.74
    );

    const label = text(
      title,
      P ? 21 : 22,
      C.violet,
      [SX, STOP - 0.25, 0],
      false,
      SW - 0.45
    );

    const divider = line(
      [
        SX - SW / 2 + 0.20,
        STOP - 0.43,
        0
      ],
      [
        SX + SW / 2 - 0.20,
        STOP - 0.43,
        0
      ],
      C.violet,
      1
    );

    const shelves = MEMORY_Y.map(y =>
      line(
        [
          SX - SW / 2 + 0.15,
          y - MEMORY_H / 2 - 0.065,
          0
        ],
        [
          SX + SW / 2 - 0.15,
          y - MEMORY_H / 2 - 0.065,
          0
        ],
        C.muted,
        2
      )
    );

    return new M.VGroup(
      frame,
      label,
      divider,
      ...shelves
    );
  }

  function memoryBox(name) {
    const i = memoryIndex(name);
    const y = MEMORY_Y[i];

    const color = MEMORY_COLORS[name];

    const frame = rect(
      MEMORY_W,
      MEMORY_H,
      [SX, y, 0],
      color,
      color,
      0.075,
      2
    );

    const value =
      name === 'readings'
        ? arrayString(D1)
        : name === 'offset'
          ? String(OFFSET)
          : arrayString(D2);

    const title = text(
      name,
      P ? 17 : 18,
      color,
      [
        SX,
        y + MEMORY_H * 0.25,
        0
      ],
      true,
      MEMORY_W - 0.30
    );

    const n = text(
      value,
      name === 'offset'
        ? (P ? 25 : 28)
        : (P ? 21 : 19),
      color,
      [
        SX,
        y - MEMORY_H * 0.17,
        0
      ],
      true,
      MEMORY_W - 0.32
    );

    return new M.VGroup(
      frame,
      title,
      n
    );
  }

  function emptyMemorySlot(name) {
    const i = memoryIndex(name);
    const y = MEMORY_Y[i];

    const frame = rect(
      MEMORY_W,
      MEMORY_H,
      [SX, y, 0],
      C.muted,
      C.card,
      0.32,
      1
    );

    const lab = text(
      'empty',
      P ? 17 : 18,
      C.muted,
      [SX, y, 0],
      false
    );

    return new M.VGroup(frame, lab);
  }

  function missingMemorySlot(name) {
    const i = memoryIndex(name);
    const y = MEMORY_Y[i];

    const frame = rect(
      MEMORY_W,
      MEMORY_H,
      [SX, y, 0],
      C.amber,
      C.card,
      0.70,
      2
    );

    const label = text(
      `${name} ?`,
      P ? 22 : 22,
      C.amber,
      [SX, y, 0],
      true,
      MEMORY_W - 0.45
    );

    return new M.VGroup(
      frame,
      label
    );
  }

  function memoryOutline(name, color = C.amber) {
    const i = memoryIndex(name);

    return rect(
      MEMORY_W + 0.09,
      MEMORY_H + 0.09,
      [SX, MEMORY_Y[i], 0],
      color,
      C.card,
      0,
      3
    );
  }

  function focusMemory(name, color = C.amber) {
    return put(
      'memoryFocus',
      memoryOutline(name, color),
      0.30
    );
  }

  function setMemory(name, exists = true) {
    memoryState[name] = exists;

    return put(
      `memory_${name}`,
      exists
        ? memoryBox(name)
        : emptyMemorySlot(name),
      0.35
    );
  }

  function emptyShelf() {
    const a = [];

    a.push(
      ...drop(
        'memoryFocus',
        'connection',
        'hiddenTag'
      )
    );

    for (const name of MEMORY_KEYS) {
      a.push(
        ...setMemory(name, false)
      );
    }

    return a;
  }

  function fullShelf() {
    const a = [];

    for (const name of MEMORY_KEYS) {
      a.push(
        ...setMemory(name, true)
      );
    }

    return a;
  }

  function missingOffset() {
    memoryState.offset = false;

    return put(
      'memory_offset',
      missingMemorySlot('offset')
    );
  }

  // ------------------------------------------------------------
  // Connections between a notebook cell and a memory box.
  // Draw directly from coordinates, never from regrouped objects.
  // ------------------------------------------------------------

  function memoryConnection(
    cellId,
    name,
    direction = 'store',
    color = C.cyan
  ) {
    const slot = pageOrder.indexOf(cellId);
    const i = memoryIndex(name);

    if (slot < 0) {
      return new M.VGroup();
    }

    if (P) {
      const x = NW / 2 + 0.14;

      const cellY = SLOT_Y[slot];
      const memY = MEMORY_Y[i];

      const cellEdge = [
        NX + CELL_W / 2 + 0.03,
        cellY,
        0
      ];

      const cellCorner = [
        x,
        cellY,
        0
      ];

      const memCorner = [
        x,
        memY,
        0
      ];

      const memEdge = [
        SX + MEMORY_W / 2 + 0.03,
        memY,
        0
      ];

      if (direction === 'store') {
        return new M.VGroup(
          line(cellEdge, cellCorner, color, 2),
          line(cellCorner, memCorner, color, 2),
          arrow(memCorner, memEdge, color, 0.10)
        );
      }

      return new M.VGroup(
        line(memEdge, memCorner, color, 2),
        line(memCorner, cellCorner, color, 2),
        arrow(cellCorner, cellEdge, color, 0.10)
      );
    }

    const cellEdge = [
      NX + CELL_W / 2 + 0.02,
      SLOT_Y[slot],
      0
    ];

    const memEdge = [
      SX - MEMORY_W / 2 - 0.02,
      MEMORY_Y[i],
      0
    ];

    return direction === 'store'
      ? arrow(cellEdge, memEdge, color, 0.11)
      : arrow(memEdge, cellEdge, color, 0.11);
  }

  function connect(
    cellId,
    name,
    direction = 'store',
    color = C.cyan
  ) {
    return put(
      'connection',
      memoryConnection(
        cellId,
        name,
        direction,
        color
      ),
      0.30
    );
  }

  function hiddenDependencyTag() {
    const y = MEMORY_Y[1];

    const w = P ? 1.55 : 1.48;
    const h = P ? 0.33 : 0.38;

    const p = [
      SX + SW / 2 - w / 2 - 0.30,
      y,
      0
    ];

    const r = rect(
      w,
      h,
      p,
      C.amber,
      C.card,
      1,
      1
    );

    const t = text(
      'STILL HERE',
      P ? 15 : 14,
      C.amber,
      p,
      false,
      w - 0.08
    );

    return new M.VGroup(r, t);
  }

  // ------------------------------------------------------------
  // Restart and run helpers.
  //
  // Restart clears memory and displayed demonstration outputs.
  // The written notebook cells remain.
  //
  // No actual Python interpreter is required: these are the
  // checked states of the fixed educational example.
  // ------------------------------------------------------------

  function restart(order = pageOrder) {
    return [
      ...drop(
        'restartLabel',
        'hiddenTag'
      ),

      ...emptyShelf(),

      ...setPage(order),

      ...pageResult('empty')
    ];
  }

  function runCellOne() {
    return [
      ...setCell(1, 'done'),

      ...setMemory('readings', true),

      ...focusCell(1, C.cyan),

      ...focusMemory('readings', C.cyan),

      ...connect(
        1,
        'readings',
        'store',
        C.cyan
      )
    ];
  }

  function runCellTwo() {
    return [
      ...setCell(2, 'done'),

      ...setMemory('offset', true),

      ...focusCell(2, C.amber),

      ...focusMemory('offset', C.amber),

      ...connect(
        2,
        'offset',
        'store',
        C.amber
      )
    ];
  }

  function runCellThree() {
    return [
      ...setCell(3, 'done'),

      ...setMemory('calibrated', true),

      ...focusCell(3, C.green),

      ...focusMemory('calibrated', C.green),

      ...connect(
        3,
        'calibrated',
        'store',
        C.green
      )
    ];
  }

  function runCellFour() {
    return [
      ...drop('connection'),

      ...setCell(4, 'done'),

      ...focusCell(4, C.green),

      ...focusMemory('calibrated', C.green),

      ...pageResult('success')
    ];
  }

  function stopAtCellThree() {
    return [
      ...drop('connection'),

      ...setCell(3, 'error'),

      ...setCell(4, 'blocked'),

      ...missingOffset(),

      ...focusCell(3, C.amber),

      ...focusMemory('offset', C.amber),

      ...pageResult('error')
    ];
  }

  function errorWork() {
    return work([
      [
        "NameError: name 'offset' is not defined",
        C.amber
      ],
      [
        'Cell 3 needs a value that is missing',
        C.ink
      ]
    ], C.amber);
  }

  function restartWork() {
    return work([
      ['RESTART = EMPTY THE MEMORY SHELF', C.violet],
      ['The written notebook stays unchanged', C.ink]
    ], C.violet);
  }

  function runAllWork() {
    return work([
      ['RUN ALL = TOP TO BOTTOM', C.green],
      ['Every cell must work in the written order', C.ink]
    ], C.green);
  }

  // ------------------------------------------------------------
  // Visual for a missing cell.
  // ------------------------------------------------------------

  function deletedCellGhost() {
    const y = SLOT_Y[1];

    const frame = rect(
      CELL_W,
      CELL_H,
      [NX, y, 0],
      C.amber,
      C.card,
      0.35,
      2
    );

    const label = text(
      'CELL 2 DELETED',
      P ? 19 : 18,
      C.amber,
      [NX, y, 0],
      true,
      CELL_W - 0.35
    );

    return new M.VGroup(
      frame,
      label
    );
  }

  // ------------------------------------------------------------
  // Chapter recap illustrations.
  // Six compact visual cards, not six new calculations.
  // ------------------------------------------------------------

  function recapPosition(i) {
    if (P) {
      const col = i % 2;
      const row = Math.floor(i / 2);

      return [
        (col - 0.5) * 3.45,
        2.05 - row * 2.05,
        0
      ];
    }

    const col = i % 3;
    const row = Math.floor(i / 3);

    return [
      (col - 1) * 4.20,
      0.55 - row * 1.95,
      0
    ];
  }

  const RECAP_TITLES = [
    'VARIABLES',
    'ARRAYS',
    'BOOLEAN MASKS',
    'VECTORIZED STEPS',
    'FUNCTIONS',
    'REPRODUCIBILITY'
  ];

  const RECAP_COLORS = [
    C.cyan,
    C.cyan,
    C.green,
    C.amber,
    C.violet,
    C.green
  ];

  function recapCard(i) {
    const p = recapPosition(i);

    const w = P ? 3.20 : 3.95;
    const h = P ? 1.83 : 1.74;

    const color = RECAP_COLORS[i];

    const frame = rect(
      w,
      h,
      p,
      color,
      C.card,
      0.98,
      2
    );

    const title = text(
      RECAP_TITLES[i],
      P ? 17 : 18,
      color,
      [
        p[0],
        p[1] + h / 2 - 0.25,
        0
      ],
      false,
      w - 0.25
    );

    const objects = [frame, title];

    const iy = p[1] - 0.03;

    if (i === 0) {
      const b = rect(
        1.52,
        0.83,
        [p[0], iy, 0],
        C.cyan,
        C.cyan,
        0.06
      );

      objects.push(
        b,

        text(
          'temp_f',
          17,
          C.cyan,
          [p[0], iy + 0.21, 0],
          true
        ),

        text(
          '77',
          30,
          C.amber,
          [p[0], iy - 0.15, 0],
          true
        )
      );
    }

    if (i === 1) {
      const sp = (w - 0.35) / 7;
      const bw = sp - 0.035;

      D1.forEach((v, k) => {
        const x = p[0] + (k - 3) * sp;

        objects.push(
          rect(
            bw,
            0.48,
            [x, iy, 0],
            C.cyan,
            C.cyan,
            0.08,
            1
          ),

          text(
            String(v),
            19,
            C.cyan,
            [x, iy, 0],
            true,
            bw - 0.045
          ),

          text(
            String(k),
            12,
            C.muted,
            [x, iy - 0.40, 0],
            true
          )
        );
      });
    }

    if (i === 2) {
      const mask = D1.map(v => v > 25);
      const sp = (w - 0.35) / 7;
      const bw = sp - 0.04;

      mask.forEach((yes, k) => {
        const x = p[0] + (k - 3) * sp;
        const c = yes ? C.green : C.muted;

        objects.push(
          rect(
            bw,
            0.45,
            [x, iy + 0.12, 0],
            c,
            yes ? C.green : C.card,
            yes ? 0.15 : 0.95,
            1
          ),

          text(
            yes ? 'T' : 'F',
            18,
            c,
            [x, iy + 0.12, 0],
            true,
            bw - 0.05
          )
        );
      });

      objects.push(
        text(
          '[30, 26]',
          22,
          C.green,
          [p[0], iy - 0.38, 0],
          true
        )
      );
    }

    if (i === 3) {
      objects.push(
        text(
          'readings - 1',
          21,
          C.amber,
          [p[0], iy + 0.21, 0],
          true,
          w - 0.35
        ),

        text(
          '[19, 21, 24, 29, 23, 20, 25]',
          16,
          C.green,
          [p[0], iy - 0.25, 0],
          true,
          w - 0.30
        )
      );
    }

    if (i === 4) {
      objects.push(
        text(
          'daily_summary(values)',
          19,
          C.violet,
          [p[0], iy + 0.20, 0],
          true,
          w - 0.30
        ),

        text(
          'Input → Recipe → Output',
          17,
          C.ink,
          [p[0], iy - 0.27, 0],
          false,
          w - 0.30
        )
      );
    }

    if (i === 5) {
      const labels = [
        'Restart',
        'Run all',
        '23°C'
      ];

      const colors = [
        C.violet,
        C.cyan,
        C.green
      ];

      labels.forEach((s, k) => {
        objects.push(
          text(
            s,
            20,
            colors[k],
            [
              p[0],
              iy + 0.35 - k * 0.32,
              0
            ],
            false,
            w - 0.40
          )
        );
      });
    }

    return new M.VGroup(...objects);
  }

  // ============================================================
  // 0-3: The same notebook works for you but fails for a colleague.
  // ============================================================

  // 0. Imagine sending your greenhouse notebook to a colleague.
  await until(S(0));

  await play(
    ...put(
      'yourScreen',
      introScreen(
        YOUR_P,
        'YOUR SCREEN'
      )
    ),

    ...put(
      'colleagueScreen',
      introScreen(
        COLLEAGUE_P,
        "COLLEAGUE'S SCREEN"
      )
    ),

    ...put(
      'sharingArrow',
      sharingArrow()
    ),

    ...say('SHARE THE GREENHOUSE NOTEBOOK', C.violet)
  );

  // 1. On your screen, the calibrated mean is 23 degrees.
  await until(S(1));

  await play(
    ...put(
      'yourScreen',
      introScreen(
        YOUR_P,
        'YOUR SCREEN',
        'success'
      )
    ),

    ...say('YOUR NOTEBOOK WORKS: 23°C', C.green)
  );

  // 2. On your colleague's screen, it stops with an error.
  await until(S(2));

  await play(
    ...put(
      'colleagueScreen',
      introScreen(
        COLLEAGUE_P,
        "COLLEAGUE'S SCREEN",
        'error'
      )
    ),

    ...say('SAME FILE · AN ERROR', C.amber)
  );

  // 3. Same notebook, same cells. How can that be?
  await until(S(3));

  await play(
    ...drop('sharingArrow'),

    ...put(
      'question',
      text(
        '?',
        P ? 39 : 48,
        C.violet,
        P ? [0, -0.21, 0] : [0, -0.25, 0]
      )
    ),

    ...put(
      'work',
      work([
        ['SAME NOTEBOOK · SAME CODE', C.violet],
        ['Why are the results different?', C.ink]
      ], C.violet)
    ),

    ...say('WHAT IS DIFFERENT?', C.violet)
  );

  // ============================================================
  // 4-11: Reconstruct the original four-cell notebook.
  // ============================================================

  // 4. Four cells, from top to bottom.
  await until(S(4));

  await play(
    ...clear(),

    ...put(
      'notebook',
      notebookPage()
    ),

    ...setPage(
      NORMAL_ORDER,
      {
        1: 'blank',
        2: 'blank',
        3: 'blank',
        4: 'blank'
      }
    ),

    ...put(
      'board',
      calculationBoard('empty')
    ),

    ...pageResult('empty'),

    ...say('FOUR CELLS, IN ORDER')
  );

  // 5. Cell one: the seven original noon readings.
  await until(S(5));

  await play(
    ...setCell(1),

    ...focusCell(1, C.cyan),

    ...put(
      'work',
      work([
        ['readings = np.array([20, 22, 25, 30, 24, 21, 26])', C.cyan],
        ['Monday to Sunday · degrees Celsius', C.muted]
      ])
    ),

    ...say('CELL 1: STORE THE ORIGINAL READINGS')
  );

  // 6. Cell two: offset = 1.
  await until(S(6));

  await play(
    ...setCell(2),

    ...focusCell(2, C.amber),

    ...put(
      'work',
      work([
        ['offset = 1', C.amber],
        ['The sensor reads one degree too high', C.ink]
      ], C.amber)
    ),

    ...say('CELL 2: STORE THE OFFSET', C.amber)
  );

  // 7. Cell three: calibrated = readings - offset.
  await until(S(7));

  await play(
    ...setCell(3),

    ...focusCell(3, C.green),

    ...put(
      'work',
      work([
        ['calibrated = readings - offset', C.green],
        ['Subtract one from every reading', C.ink]
      ], C.green)
    ),

    ...say('CELL 3: CALIBRATE THE ARRAY', C.green)
  );

  // 8. Cell four: find the mean of calibrated.
  await until(S(8));

  await play(
    ...setCell(4),

    ...focusCell(4, C.violet),

    ...put(
      'work',
      work([
        ['calibrated.mean()', C.violet],
        ['Find the mean of the corrected readings', C.ink]
      ], C.violet)
    ),

    ...say('CELL 4: FIND THE MEAN', C.violet)
  );

  // 9. Run the cells in order. The corrected sum is 161.
  await until(S(9));

  await play(
    ...drop('cellFocus'),

    ...setCell(1, 'done'),

    ...setCell(2, 'done'),

    ...setCell(3, 'done'),

    ...put(
      'board',
      calculationBoard('sum')
    ),

    ...put(
      'work',
      work([
        ['19 + 21 + 24 + 29 + 23 + 20 + 25', C.ink],
        [`SUM = ${SUM_AFTER}`, C.amber]
      ], C.amber)
    ),

    ...say('RUN IN ORDER · CORRECTED TOTAL = 161')
  );

  // 10. Divide by seven days: mean = 23.
  await until(S(10));

  await play(
    ...setCell(4, 'done'),

    ...focusCell(4, C.green),

    ...pageResult('success'),

    ...put(
      'board',
      calculationBoard('result')
    ),

    ...put(
      'work',
      work([
        ['mean = sum ÷ count', C.ink],
        ['161 ÷ 7 = 23°C', C.green]
      ], C.green)
    ),

    ...say('CALIBRATED MEAN = 23°C', C.green)
  );

  // 11. One degree below the original mean of 24.
  await until(S(11));

  await play(
    ...drop('cellFocus'),

    ...put(
      'work',
      work([
        ['BEFORE: 168 ÷ 7 = 24°C', C.cyan],
        ['AFTER:  161 ÷ 7 = 23°C', C.green]
      ], C.green)
    ),

    ...say('24°C → 23°C · AS EXPECTED', C.green)
  );

  // ============================================================
  // 12-16: Reveal the computer's invisible memory.
  // ============================================================

  // 12. Now here is the part most people do not see.
  await until(S(12));

  await play(
    ...drop('board'),

    ...put(
      'memoryQuestion',
      formulaBox(
        [
          ['?', C.violet],
          ['Where are the values kept?', C.ink]
        ],
        [SX, SY, 0],
        SW,
        P ? 1.65 : 1.80,
        C.violet,
        P ? 24 : 25,
        P ? 0.62 : 0.66
      )
    ),

    ...say('THERE IS SOMETHING WE CANNOT SEE', C.violet)
  );

  // 13. Each time a cell runs, its variables go onto a shelf.
  await until(S(13));

  await play(
    ...drop('memoryQuestion'),

    ...put(
      'shelf',
      shelfFrame('THE COMPUTER’S SHELF')
    ),

    ...emptyShelf(),

    ...put(
      'work',
      work([
        ['RUN A CELL', C.cyan],
        ['Store the resulting variables on a shelf', C.ink]
      ], C.violet)
    ),

    ...say('PICTURE A SHELF FOR VARIABLES', C.violet)
  );

  // 14. The shelf is the computer's memory.
  await until(S(14));

  await play(
    ...put(
      'shelf',
      shelfFrame('MEMORY · VALUES')
    ),

    ...put(
      'work',
      work([
        ['MEMORY', C.violet],
        ['Where the computer keeps values while working', C.ink]
      ], C.violet)
    ),

    ...say('THE SHELF IS THE COMPUTER’S MEMORY', C.violet)
  );

  // 15. The shelf holds readings, offset and calibrated.
  await until(S(15));

  await play(
    ...setMemory('readings', true),

    ...focusCell(1, C.cyan),

    ...focusMemory('readings', C.cyan),

    ...connect(
      1,
      'readings',
      'store',
      C.cyan
    ),

    ...put(
      'work',
      work([
        ['readings', C.cyan],
        ['The seven original values', C.ink]
      ])
    ),

    ...say('EACH VARIABLE HAS ITS OWN BOX')
  );

  await until(S(15) + 2.10);

  await play(
    ...setMemory('offset', true),

    ...focusCell(2, C.amber),

    ...focusMemory('offset', C.amber),

    ...connect(
      2,
      'offset',
      'store',
      C.amber
    ),

    ...put(
      'work',
      work([
        ['offset', C.amber],
        ['The correction value: 1', C.ink]
      ], C.amber)
    )
  );

  await until(S(15) + 4.25);

  await play(
    ...setMemory('calibrated', true),

    ...focusCell(3, C.green),

    ...focusMemory('calibrated', C.green),

    ...connect(
      3,
      'calibrated',
      'store',
      C.green
    ),

    ...put(
      'work',
      work([
        ['calibrated', C.green],
        ['The seven corrected values', C.ink]
      ], C.green)
    )
  );

  // 16. The page holds code. The shelf holds values.
  await until(S(16));

  await play(
    ...drop(
      'connection',
      'cellFocus',
      'memoryFocus'
    ),

    ...put(
      'work',
      work([
        ['NOTEBOOK PAGE = WRITTEN CODE', C.cyan],
        ['MEMORY SHELF = STORED VALUES', C.violet]
      ], C.violet)
    ),

    ...say('CODE AND MEMORY ARE DIFFERENT THINGS', C.violet)
  );

  // ============================================================
  // 17-21: Delete the cell, but its variable stays in memory.
  // ============================================================

  // 17. You tidy up and decide to delete cell two.
  await until(S(17));

  await play(
    ...focusCell(2, C.amber),

    ...put(
      'work',
      work([
        ['CELL 2: offset = 1', C.amber],
        ['You decide to remove this small cell', C.ink]
      ], C.amber)
    ),

    ...say('DELETE THE OFFSET CELL?', C.amber)
  );

  await until(S(17) + 2.20);

  await play(
    ...drop(
      'cell2',
      'cellFocus'
    ),

    ...put(
      'deletedGhost',
      deletedCellGhost()
    )
  );

  // 18. The cell is gone from the page.
  await until(S(18));

  await play(
    ...drop('deletedGhost'),

    ...setPage(
      DELETED_ORDER,
      {
        1: 'done',
        3: 'done',
        4: 'done'
      }
    ),

    ...put(
      'work',
      work([
        ['CELL 2 IS GONE', C.amber]
      ], C.amber)
    ),

    ...say('THE CODE HAS BEEN DELETED', C.amber)
  );

  // 19. But offset remains on the memory shelf.
  await until(S(19));

  await play(
    ...focusMemory('offset', C.amber),

    ...put(
      'hiddenTag',
      hiddenDependencyTag()
    ),

    ...put(
      'work',
      work([
        ['offset = 1 IS STILL IN MEMORY', C.amber],
        ['Deleting code does not delete stored values', C.ink]
      ], C.amber)
    ),

    ...say('THE VARIABLE IS STILL THERE!', C.amber)
  );

  // 20. Run cell three again. It finds offset in memory.
  await until(S(20));

  await play(
    ...setCell(3, 'running'),

    ...focusCell(3, C.amber),

    ...connect(
      3,
      'offset',
      'read',
      C.amber
    ),

    ...put(
      'work',
      work([
        ['CELL 3 ASKS MEMORY FOR offset', C.amber],
        ['Memory replies: 1', C.green]
      ], C.amber)
    ),

    ...say('THE OLD VALUE IS STILL AVAILABLE', C.amber)
  );

  await until(S(20) + 2.60);

  await play(
    ...drop('hiddenTag'),

    ...runCellThree(),

    ...put(
      'work',
      work([
        ['calibrated = readings - offset', C.green],
        ['The calculation still works', C.ink]
      ], C.green)
    )
  );

  // 21. You still see 23 and feel safe.
  await until(S(21));

  await play(
    ...drop(
      'connection',
      'cellFocus',
      'memoryFocus'
    ),

    ...setCell(4, 'done'),

    ...pageResult('success'),

    ...put(
      'work',
      work([
        ['STILL SHOWING 23°C', C.green],
        ['But the page no longer explains the result', C.amber]
      ], C.amber)
    ),

    ...say('IT LOOKS AS THOUGH EVERYTHING WORKS', C.amber)
  );

  // ============================================================
  // 22-27: Your colleague starts with an empty memory shelf.
  // ============================================================

  // 22. Your colleague's computer starts with empty memory.
  await until(S(22));

  await play(
    ...restart(DELETED_ORDER),

    ...put(
      'shelf',
      shelfFrame('COLLEAGUE’S MEMORY')
    ),

    ...put(
      'work',
      work([
        ['SAME NOTEBOOK PAGE', C.cyan],
        ['A completely empty memory shelf', C.violet]
      ], C.violet)
    ),

    ...say('A DIFFERENT COMPUTER · EMPTY MEMORY', C.violet)
  );

  // 23. Cell one runs and puts readings onto the shelf.
  await until(S(23));

  await play(
    ...runCellOne(),

    ...put(
      'work',
      work([
        ['CELL 1 RUNS SUCCESSFULLY', C.green],
        ['readings is now in memory', C.cyan]
      ], C.cyan)
    ),

    ...say('CELL 1: READINGS STORED')
  );

  // 24. Cell three asks for offset, but there is no such box.
  await until(S(24));

  await play(
    ...setCell(3, 'running'),

    ...focusCell(3, C.amber),

    ...missingOffset(),

    ...focusMemory('offset', C.amber),

    ...connect(
      3,
      'offset',
      'read',
      C.amber
    ),

    ...put(
      'work',
      work([
        ['CELL 3 ASKS FOR offset', C.amber],
        ['The shelf has no such value', C.ink]
      ], C.amber)
    ),

    ...say('WHERE IS offset?', C.amber)
  );

  // 25. The computer stops: offset is not defined.
  await until(S(25));

  await play(
    ...stopAtCellThree(),

    ...put(
      'work',
      errorWork()
    ),

    ...say('ERROR: offset IS NOT DEFINED', C.amber)
  );

  // 26. Cell three needed something no longer on the page.
  await until(S(26));

  await play(
    ...put(
      'work',
      work([
        ['CELL 3 NEEDS offset', C.amber],
        ['No earlier cell creates it anymore', C.ink]
      ], C.amber)
    ),

    ...mark(
      'memory_offset',
      C.amber
    ),

    ...say('A REQUIRED VARIABLE IS MISSING', C.amber)
  );

  // 27. A hidden dependency: something unseen supports a result.
  await until(S(27));

  await play(
    ...put(
      'work',
      work([
        ['HIDDEN DEPENDENCY', C.violet],
        ['A result relies on something not written on the page', C.ink]
      ], C.violet)
    ),

    ...say('HIDDEN DEPENDENCY', C.violet)
  );

  // ============================================================
  // 28-31: Discover the problem yourself with a clean run.
  // ============================================================

  // 28. How do you catch it? With a clean run.
  await until(S(28));

  await play(
    ...drop(
      'cellFocus',
      'memoryFocus'
    ),

    ...setPage(
      DELETED_ORDER,
      {
        1: 'done',
        3: 'done',
        4: 'done'
      }
    ),

    ...fullShelf(),

    ...put(
      'shelf',
      shelfFrame('YOUR MEMORY')
    ),

    ...pageResult('success'),

    ...put(
      'work',
      work([
        ['BACK ON YOUR COMPUTER', C.cyan],
        ['Test the notebook without its old memory', C.ink]
      ], C.violet)
    ),

    ...say('THE TEST: A CLEAN RUN', C.violet)
  );

  // 29. Step one: restart. Empty the entire shelf.
  await until(S(29));

  await play(
    ...restart(DELETED_ORDER),

    ...put(
      'work',
      restartWork()
    ),

    ...say('STEP 1: RESTART THE NOTEBOOK', C.violet)
  );

  // 30. Step two: run every cell from top to bottom.
  await until(S(30));

  await play(
    ...runCellOne(),

    ...put(
      'work',
      runAllWork()
    ),

    ...say('STEP 2: RUN ALL, IN ORDER', C.green)
  );

  await until(S(30) + 2.20);

  await play(
    ...setCell(3, 'running'),

    ...focusCell(3, C.amber),

    ...missingOffset(),

    ...focusMemory('offset', C.amber),

    ...connect(
      3,
      'offset',
      'read',
      C.amber
    )
  );

  // 31. Now you get exactly the same error as your colleague.
  await until(S(31));

  await play(
    ...stopAtCellThree(),

    ...put(
      'work',
      errorWork()
    ),

    ...say('THE HIDDEN PROBLEM IS NOW VISIBLE', C.amber)
  );

  // ============================================================
  // 32-35: Restore the missing cell and verify a clean run.
  // ============================================================

  // 32. Put offset = 1 back above cell three.
  await until(S(32));

  await play(
    ...drop(
      'memoryFocus',
      'connection'
    ),

    ...setPage(NORMAL_ORDER),

    ...setMemory('offset', false),

    ...pageResult('empty'),

    ...put(
      'work',
      work([
        ['RESTORE: offset = 1', C.amber],
        ['Place it before the cell that needs it', C.ink]
      ], C.green)
    ),

    ...say('FIX THE PAGE, NOT JUST THE MEMORY', C.green)
  );

  await until(S(32) + 2.50);

  await play(
    ...focusCell(2, C.green),

    ...put(
      'work',
      work([
        ['CELL 2 CREATES offset', C.amber],
        ['CELL 3 CAN THEN USE offset', C.green]
      ], C.green)
    )
  );

  // 33. Restart and run all: readings, offset, calibrated, mean 23.
  await until(S(33));

  await play(
    ...restart(NORMAL_ORDER),

    ...put(
      'work',
      restartWork()
    ),

    ...say('RESTART AND RUN ALL AGAIN', C.green)
  );

  await until(S(33) + 1.00);

  await play(
    ...runCellOne(),

    ...put(
      'work',
      work([
        ['1. readings', C.cyan],
        ['Original data stored', C.ink]
      ])
    )
  );

  await until(S(33) + 2.05);

  await play(
    ...runCellTwo(),

    ...put(
      'work',
      work([
        ['2. offset = 1', C.amber],
        ['The required value is now stored', C.ink]
      ], C.amber)
    )
  );

  await until(S(33) + 3.10);

  await play(
    ...runCellThree(),

    ...put(
      'work',
      work([
        ['3. calibrated', C.green],
        ['All seven readings corrected', C.ink]
      ], C.green)
    )
  );

  await until(S(33) + 4.20);

  await play(
    ...runCellFour(),

    ...put(
      'work',
      work([
        ['4. calibrated.mean()', C.violet],
        ['161 ÷ 7 = 23°C', C.green]
      ], C.green)
    )
  );

  // 34. The page alone is enough to produce the result.
  await until(S(34));

  await play(
    ...drop(
      'cellFocus',
      'memoryFocus',
      'connection'
    ),

    ...put(
      'work',
      work([
        ['EVERY REQUIRED VALUE COMES FROM THE PAGE', C.green],
        ['No leftover memory is needed', C.ink]
      ], C.green)
    ),

    ...say('THE PAGE ALONE IS ENOUGH', C.green)
  );

  // 35. This notebook is reproducible.
  await until(S(35));

  await play(
    ...put(
      'work',
      work([
        ['REPRODUCIBLE NOTEBOOK', C.green],
        ['A clean run gives the same results', C.ink]
      ], C.green)
    ),

    ...say('REPRODUCIBLE = SAME RESULTS ON A CLEAN RUN', C.green)
  );

  // ============================================================
  // 36-37: Reproducibility is about trust.
  // ============================================================

  // 36. Anyone can rerun the work and get the same numbers.
  await until(S(36));

  await play(
    ...clear(),

    ...put(
      'yourScreen',
      introScreen(
        YOUR_P,
        'YOUR CLEAN RUN',
        'success'
      )
    ),

    ...put(
      'colleagueScreen',
      introScreen(
        COLLEAGUE_P,
        "COLLEAGUE'S CLEAN RUN",
        'success'
      )
    ),

    ...put(
      'work',
      work([
        ['SAME PAGE · FRESH MEMORY', C.violet],
        ['Both clean runs give 23°C', C.green]
      ], C.green)
    ),

    ...say('REPRODUCIBILITY BUILDS TRUST', C.green)
  );

  // 37. That includes you next month, when memory is forgotten.
  await until(S(37));

  await play(
    ...put(
      'colleagueScreen',
      introScreen(
        COLLEAGUE_P,
        'YOU · NEXT MONTH',
        'success'
      )
    ),

    ...put(
      'work',
      work([
        ['YOUR FUTURE SELF CAN RERUN IT', C.green],
        ['No need to remember the old shelf', C.ink]
      ], C.green)
    ),

    ...say('TRUST YOUR WORK NEXT MONTH, TOO', C.green)
  );

  // ============================================================
  // 38-42: Common trap — running cells out of order.
  // ============================================================

  // 38. Here is a common trap: running cells out of order.
  await until(S(38));

  await play(
    ...clear(),

    ...put(
      'notebook',
      notebookPage()
    ),

    ...setPage(
      NORMAL_ORDER,
      {
        1: 'done',
        2: 'done',
        3: 'done',
        4: 'done'
      }
    ),

    ...put(
      'shelf',
      shelfFrame('MEMORY · VALUES')
    ),

    ...fullShelf(),

    ...pageResult('success'),

    ...put(
      'work',
      work([
        ['COMMON TRAP', C.amber],
        ['Running cells in the wrong order', C.ink]
      ], C.amber)
    ),

    ...say('COMMON TRAP: OUT-OF-ORDER EXECUTION', C.amber)
  );

  // 39. A notebook lets you run any cell at any time.
  // Demonstrate by temporarily moving the offset cell below the
  // calculation that needs it, while retaining the old memory.
  await until(S(39));

  await play(
    ...setPage(
      WRONG_ORDER,
      {
        1: 'done',
        2: 'done',
        3: 'ready',
        4: 'done'
      }
    ),

    ...pageResult('stale'),

    ...put(
      'work',
      work([
        ['CELL ORDER CHANGED', C.amber],
        ['The old memory remains unchanged', C.ink]
      ], C.amber)
    ),

    ...say('A NOTEBOOK ALLOWS ANY EXECUTION ORDER', C.amber)
  );

  await until(S(39) + 2.05);

  await play(
    ...setCell(3, 'running'),

    ...focusCell(3, C.amber),

    ...focusMemory('offset', C.amber),

    ...connect(
      3,
      'offset',
      'read',
      C.amber
    ),

    ...put(
      'work',
      work([
        ['RUN CELL 3 BEFORE CELL 2', C.amber],
        ['It finds offset from an earlier run', C.ink]
      ], C.amber)
    )
  );

  // 40. The shelf can hold values the page would never produce
  // from top to bottom.
  await until(S(40));

  await play(
    ...setCell(3, 'done'),

    ...setMemory('calibrated', true),

    ...drop('connection'),

    ...put(
      'work',
      work([
        ['MEMORY STILL CONTAINS offset = 1', C.amber],
        ['A clean top-to-bottom run would fail at cell 3', C.ink]
      ], C.amber)
    ),

    ...say('MEMORY CAN HIDE A BAD CELL ORDER', C.amber)
  );

  // 41. The numbers can be right only by luck.
  await until(S(41));

  await play(
    ...drop(
      'cellFocus',
      'memoryFocus'
    ),

    ...pageResult('stale'),

    ...put(
      'work',
      work([
        ['23°C LOOKS RIGHT', C.green],
        ['But the current page cannot reproduce it', C.amber]
      ], C.amber)
    ),

    ...say('A RIGHT-LOOKING NUMBER IS NOT PROOF', C.amber)
  );

  // 42. Before sharing or trusting a result, restart and run all.
  await until(S(42));

  // Restore the correct written order before the final clean run.

  await play(
    ...restart(NORMAL_ORDER),

    ...put(
      'work',
      work([
        ['RESTORE THE CORRECT CELL ORDER', C.green],
        ['Restart with an empty shelf', C.violet]
      ], C.green)
    ),

    ...say('BEFORE YOU SHARE: RESTART AND RUN ALL', C.green)
  );

  await until(S(42) + 1.25);

  await play(
    ...runCellOne()
  );

  await until(S(42) + 2.20);

  await play(
    ...runCellTwo()
  );

  await until(S(42) + 3.15);

  await play(
    ...runCellThree()
  );

  await until(S(42) + 4.15);

  await play(
    ...runCellFour(),

    ...put(
      'work',
      work([
        ['CLEAN RUN COMPLETE', C.green],
        ['Every cell worked in order: 23°C', C.ink]
      ], C.green)
    )
  );

  // ============================================================
  // 43: Recap the entire chapter.
  // ============================================================

  // 43. Variables, arrays, masks, whole-array operations,
  // functions and a notebook we can trust.
  await until(S(43));

  const previousNotebook = clear();

  const recap = Array.from(
    { length: 6 },
    (_, i) => recapCard(i)
  );

  recap.forEach((obj, i) => {
    visible.set(`recap${i}`, obj);
  });

  await play(
    ...previousNotebook,

    new M.LaggedStart(
      recap.map(obj =>
        new M.FadeIn(obj)
      ),
      {
        lagRatio: 0.65,
        runTime: 5.60
      }
    ),

    ...say('CHAPTER 3.4 · COMPUTING WITH DATA', C.violet)
  );

  await until(S(43) + 6.10);

  await play(
    ...mark('recap5', C.green),

    ...put(
      'work',
      work([
        ['FROM ONE VALUE TO A COMPLETE NOTEBOOK', C.violet],
        ['Calculations you can reuse, check and trust', C.green]
      ], C.green)
    ),

    ...say('A NOTEBOOK YOU CAN TRUST', C.green)
  );

  // ============================================================
  // 44: Final definition and lasting takeaway.
  // ============================================================

  // 44. Restart and run every cell from top to bottom,
  // so the page alone explains every result.
  await until(S(44));

  await play(
    ...clear(),

    ...put(
      'notebook',
      notebookPage()
    ),

    ...setPage(NORMAL_ORDER),

    ...put(
      'shelf',
      shelfFrame('MEMORY · VALUES')
    ),

    ...emptyShelf(),

    ...pageResult('empty'),

    ...put(
      'work',
      work([
        ['1. RESTART', C.violet],
        ['Begin with empty memory', C.ink]
      ], C.violet)
    ),

    ...say('RESTART WITH AN EMPTY MEMORY', C.violet)
  );

  await until(S(44) + 1.35);

  await play(
    ...runCellOne(),

    ...put(
      'work',
      work([
        ['2. RUN ALL', C.green],
        ['Start at the first cell', C.ink]
      ], C.green)
    ),

    ...say('RUN EVERY CELL FROM THE TOP', C.green)
  );

  await until(S(44) + 2.35);

  await play(
    ...runCellTwo()
  );

  await until(S(44) + 3.35);

  await play(
    ...runCellThree()
  );

  await until(S(44) + 4.35);

  await play(
    ...runCellFour()
  );

  await until(S(44) + 5.45);

  await play(
    ...drop(
      'cellFocus',
      'memoryFocus',
      'connection'
    ),

    ...put(
      'work',
      work([
        ['RESTART → RUN ALL → VERIFY', C.green],
        ['The page alone explains every result', C.ink]
      ], C.green)
    ),

    ...say('RESTART. RUN ALL. TRUST THE RESULT.', C.green)
  );
}

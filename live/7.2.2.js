// lesson 7.2.2
// Paired t-test: measure the change within each battery.
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
  const SK = 1.14, SY0 = 1.6, SY1 = 3.3;
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
  // The SAME four batch-A batteries are measured twice.
  // ------------------------------------------------------------

  const BEFORE = [15, 17, 17, 19];
  const AFTER = [16, 19, 19, 22];

  const D = AFTER.map((v, k) => v - BEFORE[k]);

  const N = D.length;
  const DF = N - 1;

  const MEAN = D.reduce((a, b) => a + b, 0) / N;

  const SS = D.reduce(
    (s, v) => s + (v - MEAN) ** 2,
    0
  );

  const SD = Math.sqrt(SS / DF);
  const SE = SD / Math.sqrt(N);
  const TSTAT = MEAN / SE;

  const CRIT = 3.182446;
  const PVALUE = 0.016;

  // Incorrect analysis: treat the paired readings as unrelated.
  const WRONG_T = 1.36;
  const WRONG_P = 0.23;

  // Keep full precision internally; round displayed numbers only.

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, -6.55, 0]  // phone: bottom edge of the card
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.4 : 6.8;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Same structure as the approved arithmetic-mean lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
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

    const pos = [
      BOXP[0],
      P ? BOXP[1] + ht / 2 : BOXP[1],
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

    const maxw = P ? FW - 1.2 : 4.0;

    if (wd > maxw) {
      g.scale(maxw / wd);
    }

    markStaged(g);
    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];

    boxNow = null;

    return a;
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
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function tag(
    s, x, y,
    color = C.cyan,
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
    x, y, width, height,
    color = C.cyan,
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
    x, y, width, height,
    color = C.cyan,
    fillOpacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(color, fillOpacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(
    x, y,
    color = C.cyan,
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
    color = C.amber,
    head = 0.15,
    strokeWidth = 2.5
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(
        x1, y1, x2, y2,
        color, strokeWidth
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a - Math.PI / 5),
        y2 - head * Math.sin(a - Math.PI / 5),
        color, strokeWidth
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a + Math.PI / 5),
        y2 - head * Math.sin(a + Math.PI / 5),
        color, strokeWidth
      )
    );
  }

  function bracket(
    x1, x2, y,
    color = C.amber,
    cap = 0.12
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
    color = C.amber,
    cap = 0.12
  ) {
    return new M.VGroup(
      line(x, y1, x, y2, color, 2.5),

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

  // Track top-level objects currently on screen.
  // Never regroup live objects to highlight them.

  let picture = [];

  function add(...objects) {
    picture.push(...objects);

    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    const active = objects.filter(
      o => picture.includes(o)
    );

    picture = picture.filter(
      o => !active.includes(o)
    );

    return active.map(o => new M.FadeOut(o));
  }

  function replace(...objects) {
    const a = picture.map(o => new M.FadeOut(o));

    picture = objects.slice();

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // BATTERY AND PHONE ICONS
  // Batch A remains cyan throughout the lesson.
  // Green is reserved for changes and conclusions.
  // ------------------------------------------------------------

  function battery(
    x, y,
    charge = 1,
    color = C.cyan,
    width = 0.76,
    height = 1.25
  ) {
    const shell = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    shell.setFill(C.card, 0.85);
    shell.moveTo(pt(x, y));

    const cap = rect(
      x,
      y + height / 2 + 0.065,
      width * 0.36,
      0.13,
      color, 1
    );

    const parts = [shell, cap];

    const innerH = height - 0.19;
    const innerW = width - 0.17;

    if (charge > 0) {
      const h = innerH * charge;

      parts.push(
        rect(
          x,
          y - innerH / 2 + h / 2,
          innerW + 0.045,
          h,
          color, 0.14, 0
        ),

        rect(
          x,
          y - innerH / 2 + h / 2,
          innerW,
          h,
          color, 0.83, 0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function phone(
    x, y,
    color = C.cyan,
    updated = false
  ) {
    const shell = new M.RoundedRectangle({
      width: 1.55,
      height: 2.65,
      cornerRadius: 0.21,
      color: C.muted,
      strokeWidth: 2.5
    });

    shell.setFill(C.card, 0.97);
    shell.moveTo(pt(x, y));

    const screen = new M.RoundedRectangle({
      width: 1.30,
      height: 2.24,
      cornerRadius: 0.11,
      color,
      strokeWidth: 1.5
    });

    screen.setFill(color, 0.065);
    screen.moveTo(pt(x, y + 0.025));

    const speaker = line(
      x - 0.19, y + 1.22,
      x + 0.19, y + 1.22,
      C.muted, 2.5
    );

    const status = txt(
      updated ? 'NEW' : 'UPDATE',
      x, y + 0.72,
      updated ? C.green : C.violet,
      16, true,
      1.15
    );

    const chip = rect(
      x, y - 0.03,
      0.66, 0.66,
      updated ? C.green : C.violet,
      0.18,
      2
    );

    const chipParts = [chip];

    for (let k = 0; k < 3; k++) {
      const d = (k - 1) * 0.20;

      chipParts.push(
        line(
          x - 0.45, y - 0.03 + d,
          x - 0.33, y - 0.03 + d,
          C.muted
        ),

        line(
          x + 0.33, y - 0.03 + d,
          x + 0.45, y - 0.03 + d,
          C.muted
        ),

        line(
          x + d, y + 0.30,
          x + d, y + 0.42,
          C.muted
        ),

        line(
          x + d, y - 0.36,
          x + d, y - 0.48,
          C.muted
        )
      );
    }

    const chipIcon = updated
      ? new M.VGroup(
          line(
            x - 0.19, y - 0.03,
            x - 0.05, y - 0.17,
            C.green, 3
          ),

          line(
            x - 0.05, y - 0.17,
            x + 0.20, y + 0.12,
            C.green, 3
          )
        )
      : arrow(
          x, y + 0.20,
          x, y - 0.23,
          C.violet,
          0.14
        );

    const statusBottom = txt(
      updated ? 'READY' : 'SOFTWARE',
      x, y - 0.79,
      C.muted, 13, true,
      1.16
    );

    return new M.VGroup(
      shell,
      screen,
      speaker,
      status,
      ...chipParts,
      chipIcon,
      statusBottom
    );
  }

  // ------------------------------------------------------------
  // 0-1: THE FIRMWARE UPDATE
  // ------------------------------------------------------------

  const phoneY = P ? -1.6 : -0.25;

  const phoneOld = phone(
    CX, phoneY,
    C.violet, false
  );

  const phoneCaption = txt(
    'PHONE MAKER',
    CX, phoneY - 1.76,
    C.muted, 18
  );

  await until(S(0));
  await play(
    ...add(phoneOld, phoneCaption),
    ...(P ? fbox([
      'the phone maker',
      ['sends an update', C.violet]
    ], C.violet) : []),
    ...say('A FIRMWARE UPDATE ARRIVES', C.violet)
  );

  const firmwarePhone = phone(
    CX - 1.65,
    phoneY,
    C.green,
    true
  );

  const firmwareBattery = battery(
    CX + 1.65,
    phoneY,
    1,
    C.cyan,
    1.02,
    1.75
  );

  const firmwareArrow = arrow(
    CX - 0.65,
    phoneY,
    CX + 0.82,
    phoneY,
    C.green
  );

  const softwareLabel = txt(
    'built-in software',
    CX - 1.65,
    phoneY - 1.72,
    C.violet, 17,
    false, 2.7
  );

  const longerLabel = txt(
    'longer battery life?',
    CX + 1.65,
    phoneY - 1.72,
    C.green, 17,
    false, 2.7
  );

  await until(S(1));
  await play(
    ...replace(
      firmwarePhone,
      firmwareBattery,
      firmwareArrow,
      softwareLabel,
      longerLabel
    ),
    ...(P ? fbox([
      ['firmware', C.violet],
      'built-in control software',
      ['promise: longer life', C.green]
    ], C.green) : []),
    ...say('THE UPDATE PROMISES LONGER LIFE', C.green)
  );

  // ------------------------------------------------------------
  // 2: RETEST THE SAME FOUR BATTERIES
  // ------------------------------------------------------------

  const bx = k =>
    CX + (k - 1.5) * (P ? 1.36 : 1.46);

  const batteriesY = P ? -1.5 : -0.25;

  const batteryIcons = BEFORE.map((_, k) =>
    battery(
      bx(k),
      batteriesY,
      1, C.cyan
    )
  );

  const batteryLabels = BEFORE.map((_, k) =>
    txt(
      `B${k + 1}`,
      bx(k),
      batteriesY - 1.04,
      C.cyan, 18, true
    )
  );

  const batchTag = tag(
    'SAME BATCH A',
    CX, batteriesY + 1.18,
    C.cyan, 18
  );

  const retestLabel = txt(
    'MEASURE EACH BATTERY AGAIN',
    CX,
    batteriesY - 1.72,
    C.green, 17
  );

  await until(S(2));
  await play(
    ...replace(
      batchTag,
      ...batteryIcons,
      ...batteryLabels,
      retestLabel
    ),
    ...(P ? fbox([
      'same 4 batteries',
      ['tested again', C.green],
      'after the update'
    ]) : []),
    ...say('THE SAME FOUR BATTERIES')
  );

  // ------------------------------------------------------------
  // 3-4: BEFORE AND AFTER READINGS
  // Show eight readings as four matched rows.
  // ------------------------------------------------------------

  const tableXID = CX - (P ? 2.55 : 2.65);
  const tableXB = CX - 0.85;
  const tableXA = CX + 1.55;

  const tableTop = P ? 0.95 : 1.05;
  const tableStep = P ? 1.15 : 0.76;

  const tableY = k =>
    tableTop - 0.69 - k * tableStep;

  const tableHeader = new M.VGroup(
    txt(
      'BATTERY',
      tableXID, tableTop,
      C.muted, 15,
      false, 1.35
    ),

    txt(
      'BEFORE',
      tableXB, tableTop,
      C.cyan, 18,
      false, 1.8
    ),

    txt(
      'AFTER',
      tableXA, tableTop,
      C.green, 18,
      false, 1.8
    ),

    line(
      CX - 3.1, tableTop - 0.3,
      CX + 3.1, tableTop - 0.3,
      C.muted, 1.5
    )
  );

  const tableRows = BEFORE.map((v, k) =>
    new M.VGroup(
      txt(
        `B${k + 1}`,
        tableXID, tableY(k),
        C.muted, 18, true
      ),

      txt(
        `${v} h`,
        tableXB, tableY(k),
        C.cyan, 23, true
      ),

      line(
        CX - 3.05,
        tableY(k) - tableStep / 2,
        CX + 3.05,
        tableY(k) - tableStep / 2,
        C.muted, 0.7
      )
    )
  );

  await until(S(3));
  await play(
    ...replace(
      tableHeader,
      ...tableRows
    ),
    ...(P ? fbox([
      'before the update',
      ['15, 17, 17, 19 hours', C.cyan]
    ]) : []),
    ...say('BEFORE: 15, 17, 17, 19 HOURS')
  );

  const afterCells = AFTER.map((v, k) =>
    new M.VGroup(
      arrow(
        tableXB + 0.66,
        tableY(k),
        tableXA - 0.66,
        tableY(k),
        C.muted,
        0.12,
        1.5
      ),

      txt(
        `${v} h`,
        tableXA, tableY(k),
        C.cyan, 23, true
      )
    )
  );

  await until(S(4));

  picture.push(...afterCells);

  await play(
    new M.LaggedStart(
      afterCells.map(o => new M.FadeIn(o)),
      {
        lagRatio: 0.20,
        runTime: 2.0
      }
    ),
    ...(P ? fbox([
      'after the update',
      ['16, 19, 19, 22 hours', C.green]
    ], C.green) : []),
    ...say('AFTER: 16, 19, 19, 22 HOURS', C.green)
  );

  // ------------------------------------------------------------
  // PAIRED PLOT
  //
  // Horizontal axis: before / after.
  // Vertical axis: battery life in hours.
  //
  // Duplicate readings are slightly offset horizontally
  // so all four batteries remain visible.
  // ------------------------------------------------------------

  const XL = CX - (P ? 1.57 : 1.48);
  const XR = CX + (P ? 1.57 : 1.48);

  const YMIN = 14;
  const YMAX = 23;

  const GY0 = P ? -4.2 : -2.15;
  const GY1 = P ? 0.95 : 1.08;

  const gy = v =>
    GY0 +
    (v - YMIN) / (YMAX - YMIN) *
    (GY1 - GY0);

  const axisX = CX - (P ? 2.93 : 3.0);

  const jitter = [0, -0.17, 0.17, 0];

  const px = (side, k) =>
    (side === 0 ? XL : XR) + jitter[k];

  function pairedAxes() {
    const parts = [
      line(
        axisX, GY0,
        axisX, GY1,
        C.muted, 2
      ),

      line(
        axisX, GY0,
        CX + 2.95, GY0,
        C.muted, 2
      )
    ];

    for (let v = 14; v <= 23; v++) {
      const major = v % 2 === 0;

      parts.push(
        line(
          axisX - 0.06, gy(v),
          axisX + 0.06, gy(v),
          C.muted,
          major ? 1.5 : 0.8
        )
      );

      if (major) {
        parts.push(
          txt(
            String(v),
            axisX - 0.28, gy(v),
            C.muted, 16, true
          )
        );

        parts.push(
          line(
            axisX + 0.08, gy(v),
            CX + 2.95, gy(v),
            C.muted, 0.6
          )
        );
      }
    }

    parts.push(
      txt(
        'hours',
        axisX + 0.18,
        GY1 + 0.25,
        C.muted, 15
      ),

      txt(
        'BEFORE',
        XL, GY0 - 0.42,
        C.cyan, 18
      ),

      txt(
        'AFTER',
        XR, GY0 - 0.42,
        C.cyan, 18
      )
    );

    return new M.VGroup(...parts);
  }

  function pairedDot(side, k) {
    const value = side === 0
      ? BEFORE[k]
      : AFTER[k];

    return dot(
      px(side, k),
      gy(value),
      C.cyan,
      P ? 0.12 : 0.11
    );
  }

  function pairLink(k, color = C.muted, sw = 2) {
    return line(
      px(0, k), gy(BEFORE[k]),
      px(1, k), gy(AFTER[k]),
      color, sw
    );
  }

  function makePairedPlot(
    linked = true,
    color = C.green,
    withChanges = false
  ) {
    const parts = [pairedAxes()];

    if (linked) {
      BEFORE.forEach((_, k) => {
        parts.push(pairLink(k, color, 2.5));
      });
    }

    BEFORE.forEach((_, k) => {
      parts.push(
        pairedDot(0, k),
        pairedDot(1, k)
      );
    });

    if (withChanges) {
      D.forEach((v, k) => {
        const offset = k === 1
          ? -0.13
          : k === 2
            ? 0.13
            : 0;

        const yy =
          (gy(BEFORE[k]) + gy(AFTER[k])) / 2;

        if (k !== 2) {
          parts.push(
            txt(
              k === 1 ? '+2, +2' : `+${v}`,
              CX + offset,
              yy + 0.26,
              C.green, 17, true
            )
          );
        }
      });
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 5: DRAW THE TWO COLUMNS OF DOTS
  // ------------------------------------------------------------

  const pairAxes = pairedAxes();

  const beforeDots = BEFORE.map((_, k) =>
    pairedDot(0, k)
  );

  const afterDots = AFTER.map((_, k) =>
    pairedDot(1, k)
  );

  await until(S(5));
  await play(
    ...replace(
      pairAxes,
      ...beforeDots,
      ...afterDots
    ),
    ...say('BEFORE ON THE LEFT, AFTER ON THE RIGHT')
  );

  // ------------------------------------------------------------
  // 6: CONNECT THE SAME BATTERY'S TWO READINGS
  // ------------------------------------------------------------

  const links = BEFORE.map((_, k) =>
    pairLink(k, C.muted, 2)
  );

  await until(S(6));

  picture.push(...links);

  await play(
    new M.LaggedStart(
      links.map(l => new M.Create(l)),
      {
        lagRatio: 0.22,
        runTime: 1.8
      }
    ),
    ...say('EACH LINE JOINS THE SAME BATTERY', C.violet)
  );

  // ------------------------------------------------------------
  // 7: EVERY LINE GOES UP
  // ------------------------------------------------------------

  const risingLinks = BEFORE.map((_, k) =>
    pairLink(k, C.green, 3)
  );

  const risesTag = tag(
    '4 OUT OF 4 IMPROVED',
    CX,
    P ? 1.46 : 1.28,
    C.green, 17
  );

  await until(S(7));
  await play(
    ...remove(...links),
    ...add(...risingLinks, risesTag),
    ...fbox([
      ['every battery improved', C.green],
      'all four lines rise'
    ], C.green),
    ...say('EVERY SINGLE BATTERY LASTS LONGER', C.green)
  );

  // ------------------------------------------------------------
  // 8: BEFORE READINGS SPREAD FROM 15 TO 19
  // ------------------------------------------------------------

  const beforeRange = vBracket(
    XL - 0.49,
    gy(15), gy(19),
    C.cyan
  );

  const beforeRangeLabel = txt(
    '15–19',
    XL - 0.89,
    (gy(15) + gy(19)) / 2,
    C.cyan, 16, true,
    1.02
  );

  await until(S(8));
  await play(
    ...remove(risesTag),
    ...add(beforeRange, beforeRangeLabel),
    ...fbox([
      'before readings',
      '15 to 19 hours',
      ['range = 4 hours', C.cyan]
    ]),
    ...say('THE BEFORE DOTS SPREAD OUT')
  );

  // ------------------------------------------------------------
  // 9: AFTER READINGS SPREAD FROM 16 TO 22
  // The vertical ranges overlap between 16 and 19.
  // ------------------------------------------------------------

  const afterRange = vBracket(
    XR + 0.49,
    gy(16), gy(22),
    C.cyan
  );

  const afterRangeLabel = txt(
    '16–22',
    XR + 0.89,
    (gy(16) + gy(22)) / 2,
    C.cyan, 16, true,
    1.02
  );

  const overlapBox = outline(
    CX,
    (gy(16) + gy(19)) / 2,
    XR - XL + 0.58,
    gy(19) - gy(16),
    C.violet,
    0.07
  );

  await until(S(9));
  await play(
    ...add(
      afterRange,
      afterRangeLabel,
      overlapBox
    ),
    ...fbox([
      'before: 15 to 19',
      'after:  16 to 22',
      ['the ranges overlap', C.violet]
    ], C.violet),
    ...say('THE TWO CLOUDS OVERLAP', C.violet)
  );

  // ------------------------------------------------------------
  // 10: LINES OR OVERLAPPING CLOUDS?
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    new M.Indicate(overlapBox, {
      color: C.amber
    }),
    ...fbox([
      ['lines: all improve', C.green],
      ['clouds: overlap', C.violet],
      'which picture matters?'
    ], C.amber),
    ...say('WHICH PICTURE SHOULD WE TRUST?', C.amber)
  );

  // ------------------------------------------------------------
  // 11: THE KEY IS THE MATCHED BATTERY
  // ------------------------------------------------------------

  const pairOneLink = pairLink(
    0, C.amber, 4
  );

  const pairOneTag = tag(
    'BATTERY 1',
    CX,
    (gy(15) + gy(16)) / 2 + 0.34,
    C.amber, 16
  );

  await until(S(11));
  await play(
    ...remove(
      overlapBox,
      beforeRange,
      afterRange,
      beforeRangeLabel,
      afterRangeLabel
    ),
    ...add(pairOneLink, pairOneTag),
    ...fbox([
      '15 h and 16 h',
      'same physical battery',
      ['one matched pair', C.green]
    ], C.green),
    ...say('SAME BATTERY = A PAIR', C.green)
  );

  // ------------------------------------------------------------
  // 12: STRONG BATTERIES STAY STRONG;
  // WEAK BATTERIES STAY WEAK
  // ------------------------------------------------------------

  const pairFourLink = pairLink(
    3, C.amber, 4
  );

  const weakTag = tag(
    'WEAKER',
    CX,
    (gy(15) + gy(16)) / 2 + 0.34,
    C.violet, 16
  );

  const strongTag = tag(
    'STRONGER',
    CX,
    (gy(19) + gy(22)) / 2 + 0.34,
    C.amber, 16
  );

  await until(S(12));
  await play(
    ...remove(pairOneTag),
    ...add(
      pairFourLink,
      weakTag,
      strongTag
    ),
    ...fbox([
      'battery 1: 15 → 16',
      'battery 4: 19 → 22',
      ['different starting levels', C.violet]
    ], C.violet),
    ...say('BATTERIES START AT DIFFERENT LEVELS', C.violet)
  );

  // ------------------------------------------------------------
  // 13: BASELINE DIFFERENCES ARE NOT THE UPDATE
  // ------------------------------------------------------------

  const baselineBracket = vBracket(
    XL - 0.50,
    gy(15), gy(19),
    C.violet
  );

  await until(S(13));
  await play(
    ...add(baselineBracket),
    ...fbox([
      ['battery-to-battery spread', C.violet],
      'already existed before',
      'the software update'
    ], C.violet),
    ...say('STARTING DIFFERENCES ARE NOT THE UPDATE', C.violet)
  );

  // ------------------------------------------------------------
  // 14: REMOVE THE STARTING LEVEL
  // AFTER MINUS BEFORE FOR EACH BATTERY
  // ------------------------------------------------------------

  const DXID = CX - 2.74;
  const DXB = CX - 1.65;
  const DXA = CX - 0.13;
  const DXD = CX + 2.05;

  const rowTop = P ? 0.8 : 0.96;
  const rowStep = P ? 1.22 : 0.79;

  const ry = k =>
    rowTop - 0.7 - k * rowStep;

  const differenceHeader = new M.VGroup(
    txt(
      'ID',
      DXID, rowTop,
      C.muted, 15
    ),

    txt(
      'BEFORE',
      DXB, rowTop,
      C.cyan, 15,
      false, 1.4
    ),

    txt(
      'AFTER',
      DXA, rowTop,
      C.cyan, 15,
      false, 1.4
    ),

    txt(
      'CHANGE',
      DXD, rowTop,
      C.green, 16,
      false, 1.8
    ),

    line(
      CX - 3.1, rowTop - 0.3,
      CX + 3.1, rowTop - 0.3,
      C.muted, 1.5
    )
  );

  function baseDifferenceRow(k) {
    const y = ry(k);

    return new M.VGroup(
      txt(
        `B${k + 1}`,
        DXID, y,
        C.muted, 17, true
      ),

      txt(
        String(BEFORE[k]),
        DXB, y,
        C.cyan, 23, true
      ),

      txt(
        '→',
        (DXB + DXA) / 2,
        y,
        C.muted, 17
      ),

      txt(
        String(AFTER[k]),
        DXA, y,
        C.cyan, 23, true
      ),

      txt(
        '=',
        DXA + 0.77,
        y,
        C.muted, 17
      ),

      line(
        CX - 3.05,
        y - rowStep / 2,
        CX + 3.05,
        y - rowStep / 2,
        C.muted, 0.7
      )
    );
  }

  const differenceRows = D.map((_, k) =>
    baseDifferenceRow(k)
  );

  await until(S(14));
  await play(
    ...replace(
      differenceHeader,
      ...differenceRows
    ),
    ...fbox([
      'for each battery',
      ['change = after − before', C.green]
    ], C.green),
    ...say('REMOVE THE STARTING LEVEL', C.green)
  );

  // ------------------------------------------------------------
  // 15-18: CALCULATE EACH MATCHED DIFFERENCE
  // ------------------------------------------------------------

  const differenceResults = D.map((v, k) =>
    tag(
      `+${v} h`,
      DXD, ry(k),
      C.green, 19,
      1.9
    )
  );

  function rowOutline(k) {
    return outline(
      CX,
      ry(k),
      6.18,
      rowStep * 0.80,
      C.amber,
      0.025
    );
  }

  let activeRow = rowOutline(0);

  await until(S(15));
  await play(
    ...add(
      activeRow,
      differenceResults[0]
    ),
    ...fbox([
      'battery 1',
      ['16 − 15 = +1 hour', C.green]
    ], C.green),
    ...say('BATTERY 1: ONE EXTRA HOUR', C.green)
  );

  const rowTwo = rowOutline(1);

  await until(S(16));
  await play(
    ...remove(activeRow),
    ...add(
      rowTwo,
      differenceResults[1]
    ),
    ...fbox([
      'battery 2',
      ['19 − 17 = +2 hours', C.green]
    ], C.green),
    ...say('BATTERY 2: TWO EXTRA HOURS', C.green)
  );

  activeRow = rowTwo;

  const rowThree = rowOutline(2);

  await until(S(17));
  await play(
    ...remove(activeRow),
    ...add(
      rowThree,
      differenceResults[2]
    ),
    ...fbox([
      'battery 3',
      ['19 − 17 = +2 hours', C.green]
    ], C.green),
    ...say('BATTERY 3: ALSO TWO HOURS', C.green)
  );

  activeRow = rowThree;

  const rowFour = rowOutline(3);

  await until(S(18));
  await play(
    ...remove(activeRow),
    ...add(
      rowFour,
      differenceResults[3]
    ),
    ...fbox([
      'battery 4',
      ['22 − 19 = +3 hours', C.green]
    ], C.green),
    ...say('BATTERY 4: THREE EXTRA HOURS', C.green)
  );

  activeRow = rowFour;

  // ------------------------------------------------------------
  // DIFFERENCE NUMBER LINE
  //
  // Negative values mean the battery became worse.
  // Zero means no change.
  // Positive values mean improvement.
  // ------------------------------------------------------------

  const DMIN = -1;
  const DMAX = 4;

  const DY = P ? -3.0 : -1.18;

  const dw = P ? 5.9 : 6.4;

  const dx = v =>
    CX - dw / 2 +
    (v - DMIN) / (DMAX - DMIN) * dw;

  function differenceAxis() {
    const parts = [
      line(
        dx(DMIN), DY,
        dx(DMAX), DY,
        C.muted, 3
      )
    ];

    for (let v = DMIN; v <= DMAX; v++) {
      const color = v === 0
        ? C.amber
        : C.muted;

      const label = v < 0
        ? `−${Math.abs(v)}`
        : v > 0
          ? `+${v}`
          : '0';

      parts.push(
        line(
          dx(v), DY - 0.08,
          dx(v), DY + 0.08,
          color, 2
        ),

        txt(
          label,
          dx(v), DY - 0.32,
          color, 18, true
        )
      );
    }

    parts.push(
      txt(
        'change in hours',
        dx(0.4),
        DY - 0.78,
        C.muted, 17
      )
    );

    return new M.VGroup(...parts);
  }

  function differenceDot(v, repeats = 0) {
    return dot(
      dx(v),
      DY + 0.37 + repeats * 0.44,
      C.cyan,
      0.14
    );
  }

  function allDifferenceDots() {
    return D.map((v, k) =>
      differenceDot(
        v,
        D.slice(0, k).filter(n => n === v).length
      )
    );
  }

  function zeroMarker(withLabel = true) {
    const parts = [
      dashed(
        dx(0), DY + 0.09,
        dx(0), DY + 1.35,
        C.amber
      )
    ];

    if (withLabel) {
      parts.push(
        tag(
          'NO CHANGE',
          dx(0),
          DY + 1.68,
          C.amber, 15,
          1.95
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function meanMarker(withLabel = true) {
    const parts = [
      line(
        dx(MEAN), DY - 0.49,
        dx(MEAN), DY - 0.92,
        C.green, 3
      )
    ];

    if (withLabel) {
      parts.push(
        tag(
          'MEAN: +2',
          dx(MEAN),
          DY - 1.21,
          C.green, 16
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 19: FOUR DIFFERENCES REPLACE THE EIGHT READINGS
  // ------------------------------------------------------------

  const listY = P ? 0.35 : 0.25;
  const listX = k => CX + (k - 1.5) * 1.42;

  function differenceTile(
    k,
    value = D[k],
    color = C.green
  ) {
    const x = listX(k);

    const r = outline(
      x, listY,
      1.16, 1.25,
      color,
      0.11
    );

    return new M.VGroup(
      r,

      txt(
        `B${k + 1}`,
        x, listY + 0.33,
        C.muted, 15, true
      ),

      txt(
        value > 0 ? `+${value}` : String(value),
        x, listY - 0.11,
        color, 27, true
      )
    );
  }

  const differenceTiles = D.map((_, k) =>
    differenceTile(k)
  );

  const differencesLabel = txt(
    'ONE CHANGE PER BATTERY',
    CX,
    listY - 1.04,
    C.green, 18
  );

  await until(S(19));
  await play(
    ...replace(
      ...differenceTiles,
      differencesLabel
    ),
    ...fbox([
      ['differences', C.green],
      '+1, +2, +2, +3',
      'four numbers, not eight'
    ], C.green),
    ...say('KEEP ONLY THE FOUR DIFFERENCES', C.green)
  );

  // ------------------------------------------------------------
  // 20: ALL FOUR DIFFERENCES ARE ABOVE ZERO
  // ------------------------------------------------------------

  const diffAxis = differenceAxis();
  const diffDots = allDifferenceDots();

  const zero = zeroMarker();

  const positiveBox = outline(
    (dx(1) + dx(3)) / 2,
    DY + 0.59,
    dx(3) - dx(1) + 0.59,
    1.12,
    C.green,
    0.025
  );

  await until(S(20));
  await play(
    ...replace(
      diffAxis,
      ...diffDots,
      zero,
      positiveBox
    ),
    ...fbox([
      ['all differences > 0', C.green],
      'every battery improved'
    ], C.green),
    ...say('ALL FOUR CHANGES ARE POSITIVE', C.green)
  );

  // ------------------------------------------------------------
  // 21: IS THE MEAN CHANGE REAL OR CHANCE?
  // ------------------------------------------------------------

  const questionTag = tag(
    'REAL IMPROVEMENT?',
    (dx(1) + dx(3)) / 2,
    DY + 1.53,
    C.violet, 16
  );

  await until(S(21));
  await play(
    ...add(questionTag),
    ...fbox([
      'true mean change > 0?',
      ['or just chance?', C.violet]
    ], C.violet),
    ...say('IS THE IMPROVEMENT REAL?', C.violet)
  );

  // ------------------------------------------------------------
  // 22: A ONE-SAMPLE TEST ON THE DIFFERENCES
  // Null hypothesis: true mean change = 0.
  // ------------------------------------------------------------

  await until(S(22));
  await play(
    ...remove(positiveBox, questionTag),
    new M.Indicate(zero, {
      color: C.amber
    }),
    ...fbox([
      ['null hypothesis', C.violet],
      'true mean change = 0',
      ['one-sample test on changes', C.cyan]
    ], C.violet),
    ...say('ZERO MEANS THE UPDATE CHANGES NOTHING', C.amber)
  );

  // ------------------------------------------------------------
  // 23: MEAN DIFFERENCE = TWO HOURS
  // ------------------------------------------------------------

  const diffMeanMarker = meanMarker();

  const gap = arrow(
    dx(0) + 0.06,
    DY + 1.16,
    dx(MEAN) - 0.06,
    DY + 1.16,
    C.green
  );

  const gapLabel = txt(
    '+2 hours',
    dx(2.85),
    DY + 1.48,
    C.green, 20, true
  );

  await until(S(23));
  await play(
    ...add(
      diffMeanMarker,
      gap,
      gapLabel
    ),
    ...fbox([
      'mean difference',
      '(1 + 2 + 2 + 3) ÷ 4',
      ['= 2 hours', C.green]
    ], C.green),
    ...say('AVERAGE IMPROVEMENT = TWO HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 24: STANDARD DEVIATION OF THE DIFFERENCES
  // Differences: 1, 2, 2, 3
  // Deviations: -1, 0, 0, +1
  // Sample variance = 2 / 3.
  // ------------------------------------------------------------

  const deviationY = DY + 1.18;

  const devLeft = bracket(
    dx(1),
    dx(MEAN),
    deviationY,
    C.amber
  );

  const devRight = bracket(
    dx(MEAN),
    dx(3),
    deviationY,
    C.amber
  );

  const devLeftLabel = txt(
    '−1',
    (dx(1) + dx(MEAN)) / 2,
    deviationY + 0.32,
    C.amber, 18, true
  );

  const devRightLabel = txt(
    '+1',
    (dx(MEAN) + dx(3)) / 2,
    deviationY + 0.32,
    C.amber, 18, true
  );

  const zeroDeviation = txt(
    '0, 0',
    dx(MEAN),
    deviationY + 0.65,
    C.green, 16, true
  );

  const smallSpread = tag(
    'SMALL SPREAD',
    CX,
    P ? 0.55 : 1.13,
    C.cyan, 17
  );

  await until(S(24));
  await play(
    ...remove(gap, gapLabel),
    ...add(
      devLeft,
      devRight,
      devLeftLabel,
      devRightLabel,
      zeroDeviation,
      smallSpread
    ),
    ...fbox([
      'deviations: −1, 0, 0, +1',
      'SD = √(2 ÷ 3)',
      ['SD ≈ 0.82 hours', C.cyan]
    ]),
    ...say('THE DIFFERENCES SPREAD VERY LITTLE')
  );

  // ------------------------------------------------------------
  // 25: STANDARD ERROR OF THE MEAN DIFFERENCE
  // Both bars use the same scale.
  // ------------------------------------------------------------

  const spreadScale = P ? 4.8 : 5.15;

  const SDW = SD * spreadScale;
  const SEW = SE * spreadScale;

  const topBarY = P ? 0.05 : 0.35;
  const bottomBarY = P ? -2.45 : -1.98;

  function spreadBar(
    width, y,
    label, value,
    color
  ) {
    const glow = rect(
      CX, y,
      width + 0.10,
      0.50,
      color, 0.12, 0
    );

    const bar = rect(
      CX, y,
      width,
      0.36,
      color, 0.84
    );

    return new M.VGroup(
      glow,
      bar,

      txt(
        label,
        CX, y + 0.57,
        color, 17
      ),

      txt(
        value,
        CX, y - 0.47,
        color, 21, true
      )
    );
  }

  const differenceSpreadBar = spreadBar(
    SDW,
    topBarY,
    'INDIVIDUAL CHANGES',
    '0.82 hours',
    C.cyan
  );

  const meanSpreadBar = spreadBar(
    SEW,
    bottomBarY,
    'MEAN OF FOUR CHANGES',
    '0.41 hours',
    C.green
  );

  const divideByTwo = tag(
    '÷ √4 = ÷ 2',
    CX,
    topBarY - (P ? 1.08 : 1.12),
    C.amber, 17
  );

  await until(S(25));
  await play(
    ...replace(
      differenceSpreadBar,
      divideByTwo,
      meanSpreadBar
    ),
    ...fbox([
      'standard error',
      'SE = 0.82 ÷ √4',
      ['SE ≈ 0.41 hours', C.green]
    ], C.green),
    ...say('THE MEAN WOBBLES ABOUT 0.4 HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 26: t = MEAN DIFFERENCE / STANDARD ERROR
  //
  // The two-hour gap contains about 4.9 SE units.
  // Draw four full units and one partial unit.
  // ------------------------------------------------------------

  const rulerW = P ? 5.85 : 6.15;

  const rulerLeft = CX - rulerW / 2;
  const rulerRight = CX + rulerW / 2;

  const rulerY = P ? -0.65 : -0.45;

  const unitWidth = rulerW * SE / MEAN;

  const fullUnits = Math.floor(TSTAT);
  const fraction = TSTAT - fullUnits;

  function makeSEBlocks() {
    const parts = [];

    let cursor = rulerLeft;

    for (let j = 0; j <= fullUnits; j++) {
      const amount = j < fullUnits
        ? 1
        : fraction;

      const width = unitWidth * amount;
      const x = cursor + width / 2;

      const block = rect(
        x,
        rulerY - 0.43,
        Math.max(0.035, width - 0.045),
        0.52,
        C.green,
        j < fullUnits ? 0.82 : 0.47
      );

      const label = txt(
        j < fullUnits ? '1' : '0.9',
        x,
        rulerY - 0.43,
        C.ink, 17, true,
        width - 0.08
      );

      parts.push(
        new M.VGroup(block, label)
      );

      cursor += width;
    }

    return parts;
  }

  function rulerPicture() {
    return [
      bracket(
        rulerLeft,
        rulerRight,
        rulerY + 0.91,
        C.green
      ),

      txt(
        '+2 HOURS',
        CX,
        rulerY + 1.24,
        C.green, 20, true
      ),

      arrow(
        rulerLeft,
        rulerY + 0.11,
        rulerRight,
        rulerY + 0.11,
        C.amber
      ),

      ...makeSEBlocks(),

      tag(
        'ABOUT 4.9 STANDARD ERRORS',
        CX,
        rulerY - 1.22,
        C.violet, 17
      )
    ];
  }

  const tRuler = rulerPicture();

  await until(S(26));
  await play(
    ...replace(...tRuler),
    ...fbox([
      't = mean change ÷ SE',
      '  = 2 ÷ 0.41',
      ['  ≈ 4.90', C.violet]
    ], C.violet),
    ...say('t ≈ 4.9 STANDARD ERRORS', C.violet)
  );

  // ------------------------------------------------------------
  // t REFERENCE CURVE, THREE DEGREES OF FREEDOM
  //
  // f(t) = 2 / (pi * sqrt(3)) * (1 + t*t/3)^(-2)
  //
  // Use ordinary Line and Rectangle objects, avoiding
  // version-specific graph and plotting APIs.
  // ------------------------------------------------------------

  const TXMIN = -8;
  const TXMAX = 8;

  const TW = P ? 6.45 : 6.8;

  const TY = P ? -3.15 : -1.62;
  const TH = P ? 7.35 : 6.15;

  const tx = v =>
    CX - TW / 2 +
    (v - TXMIN) / (TXMAX - TXMIN) * TW;

  const tPDF = v =>
    2 / (Math.PI * Math.sqrt(3)) *
    Math.pow(1 + v * v / 3, -2);

  const ty = v => TY + tPDF(v) * TH;

  function tAxis() {
    const parts = [
      line(
        tx(TXMIN), TY,
        tx(TXMAX), TY,
        C.muted, 2.5
      )
    ];

    for (let v = -8; v <= 8; v += 2) {
      parts.push(
        line(
          tx(v), TY - 0.07,
          tx(v), TY + 0.07,
          C.muted, 1.5
        ),

        txt(
          v < 0 ? `−${Math.abs(v)}` : String(v),
          tx(v), TY - 0.30,
          C.muted, 16, true
        )
      );
    }

    parts.push(
      txt(
        't',
        tx(TXMAX) - 0.05,
        TY - 0.64,
        C.muted, 18, true
      )
    );

    return new M.VGroup(...parts);
  }

  function tCurve(
    color = C.cyan,
    samples = 144
  ) {
    const parts = [];

    for (let k = 0; k < samples; k++) {
      const a =
        TXMIN + (TXMAX - TXMIN) * k / samples;

      const b =
        TXMIN + (TXMAX - TXMIN) * (k + 1) / samples;

      parts.push(
        line(
          tx(a), ty(a),
          tx(b), ty(b),
          color, 3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function tailArea(
    a, b,
    color = C.violet,
    opacity = 0.65,
    samples = 48
  ) {
    const parts = [];
    const step = (b - a) / samples;

    for (let k = 0; k < samples; k++) {
      const v1 = a + step * k;
      const v2 = v1 + step;

      const mid = (v1 + v2) / 2;

      const height = Math.max(
        0.001,
        tPDF(mid) * TH
      );

      parts.push(
        rect(
          tx(mid),
          TY + height / 2,
          tx(v2) - tx(v1) + 0.001,
          height,
          color, opacity, 0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bothTails(
    cutoff,
    color = C.violet,
    opacity = 0.65
  ) {
    return new M.VGroup(
      tailArea(
        TXMIN,
        -cutoff,
        color,
        opacity
      ),

      tailArea(
        cutoff,
        TXMAX,
        color,
        opacity
      )
    );
  }

  function tBoundary(
    value,
    color,
    height = 1.22
  ) {
    return dashed(
      tx(value), TY,
      tx(value), TY + height,
      color
    );
  }

  // ------------------------------------------------------------
  // 27: THREE DEGREES OF FREEDOM AND THE p-VALUE
  // ------------------------------------------------------------

  const bellAxis = tAxis();
  const bellCurve = tCurve();

  const pShade = bothTails(
    TSTAT,
    C.violet,
    0.78
  );

  const leftBoundary = tBoundary(
    -TSTAT,
    C.violet
  );

  const rightBoundary = tBoundary(
    TSTAT,
    C.amber
  );

  const leftT = txt(
    '−4.90',
    tx(-TSTAT),
    TY + 1.44,
    C.violet, 18, true
  );

  const rightT = txt(
    '+4.90',
    tx(TSTAT),
    TY + 1.44,
    C.amber, 18, true
  );

  const actualT = dot(
    tx(TSTAT), TY,
    C.amber, 0.11
  );

  const dfTag = tag(
    'df = 3',
    CX,
    TY + TH * tPDF(0) + 0.38,
    C.violet, 16
  );

  const pTag = tag(
    'p ≈ 1.6%',
    CX,
    TY - 1.0,
    C.violet, 20
  );

  await until(S(27));
  await play(
    ...replace(
      bellAxis,
      pShade,
      bellCurve,
      leftBoundary,
      rightBoundary,
      leftT,
      rightT,
      actualT,
      dfTag,
      pTag
    ),
    ...fbox([
      'df = 4 − 1 = 3',
      'two-sided t-test',
      ['p ≈ 0.016 = 1.6%', C.violet]
    ], C.violet),
    ...say('ONLY ABOUT 1.6% THIS EXTREME BY CHANCE', C.violet)
  );

  // ------------------------------------------------------------
  // 28: REJECT THE NULL
  // The data are hard to explain if the update changed nothing.
  // ------------------------------------------------------------

  const rejectTag = tag(
    'REJECT THE NULL',
    CX,
    TY - 1.62,
    C.green, 19
  );

  await until(S(28));
  await play(
    ...add(rejectTag),
    new M.Indicate(pTag, {
      color: C.green
    }),
    ...fbox([
      'p ≈ 1.6%',
      'usual cutoff = 5%',
      ['1.6% < 5%: reject null', C.green]
    ], C.green),
    ...say('THE DATA SUPPORT A REAL CHANGE', C.green)
  );

  // ------------------------------------------------------------
  // 29: NAME THE METHOD
  // ------------------------------------------------------------

  await until(S(29));
  await play(
    ...say('THE PAIRED t-TEST', C.green)
  );

  // ------------------------------------------------------------
  // 30: THE FORMULA
  // Return to the four measured differences.
  // ------------------------------------------------------------

  const formulaAxis = differenceAxis();
  const formulaDots = allDifferenceDots();
  const formulaZero = zeroMarker();
  const formulaMean = meanMarker();

  const formulaArrow = arrow(
    dx(0) + 0.07,
    DY + 1.18,
    dx(MEAN) - 0.07,
    DY + 1.18,
    C.green
  );

  const formulaGapLabel = txt(
    '+2 hours',
    dx(2.85),
    DY + 1.49,
    C.green, 19, true
  );

  await until(S(30));
  await play(
    ...replace(
      formulaAxis,
      ...formulaDots,
      formulaZero,
      formulaMean,
      formulaArrow,
      formulaGapLabel
    ),
    ...fbox([
      't = mean difference ÷ SE',
      'SE = SD of changes ÷ √n',
      ['t ≈ 4.90', C.violet]
    ]),
    ...say('t = AVERAGE CHANGE ÷ ITS STANDARD ERROR')
  );

  // ------------------------------------------------------------
  // 31: THE FORMULA IN WORDS
  // ------------------------------------------------------------

  const recallRuler = rulerPicture();

  await until(S(31));
  await play(
    ...replace(...recallRuler),
    ...fbox([
      ['average change', C.green],
      'measured in standard',
      ['errors of the change', C.violet]
    ]),
    ...say('MEASURE THE CHANGE IN ITS OWN WOBBLE', C.green)
  );

  // ------------------------------------------------------------
  // 32: WHAT IS IT FOR?
  // Before/after, twins, matched left and right hands.
  // Draw three examples of matched readings.
  // ------------------------------------------------------------

  function examplePair(
    y,
    leftLabel,
    rightLabel,
    caption
  ) {
    const x1 = CX - 1.55;
    const x2 = CX + 1.55;

    const left = outline(
      x1, y,
      1.68, 0.61,
      C.cyan, 0.08
    );

    const right = outline(
      x2, y,
      1.68, 0.61,
      C.cyan, 0.08
    );

    return new M.VGroup(
      left,
      right,

      txt(
        leftLabel,
        x1, y,
        C.cyan, 16,
        false, 1.50
      ),

      txt(
        rightLabel,
        x2, y,
        C.cyan, 16,
        false, 1.50
      ),

      line(
        x1 + 0.85, y,
        x2 - 0.85, y,
        C.green, 2.5
      ),

      txt(
        caption,
        CX,
        y - 0.48,
        C.muted, 15
      )
    );
  }

  const exampleY = P ? 0.7 : 0.96;
  const exampleStep = P ? 1.75 : 1.20;

  const example1 = examplePair(
    exampleY,
    'BEFORE',
    'AFTER',
    'same battery'
  );

  const example2 = examplePair(
    exampleY - exampleStep,
    'TWIN 1',
    'TWIN 2',
    'matched twins'
  );

  const example3 = examplePair(
    exampleY - exampleStep * 2,
    'LEFT',
    'RIGHT',
    'same person'
  );

  await until(S(32));
  await play(
    ...replace(
      example1,
      example2,
      example3
    ),
    ...fbox([
      'before and after',
      'twins, left and right',
      ['every reading: a partner', C.green]
    ], C.green),
    ...say('USE IT WHEN EACH READING HAS A PARTNER', C.green)
  );

  // ------------------------------------------------------------
  // 33: THE TRAP — FORGETTING THE PAIRS
  // Show the same plot, then remove only the connecting lines.
  // ------------------------------------------------------------

  const trapAxes = pairedAxes();

  const trapBeforeDots = BEFORE.map((_, k) =>
    pairedDot(0, k)
  );

  const trapAfterDots = AFTER.map((_, k) =>
    pairedDot(1, k)
  );

  const trapLinks = BEFORE.map((_, k) =>
    pairLink(k, C.green, 2.5)
  );

  const forgetTag = tag(
    'FORGET THE PAIRS?',
    CX,
    P ? 1.45 : 1.2,
    C.amber, 17
  );

  await until(S(33));
  await play(
    ...replace(
      trapAxes,
      ...trapLinks,
      ...trapBeforeDots,
      ...trapAfterDots,
      forgetTag
    ),
    ...fbox([
      ['wrong approach', C.amber],
      'treat before and after',
      'as unrelated groups'
    ], C.amber),
    ...say('TRAP: WHAT IF WE FORGET THE PAIRS?', C.amber)
  );

  await until(S(33) + 2.1);
  await play(
    ...remove(...trapLinks)
  );

  // ------------------------------------------------------------
  // 34: BATTERY-TO-BATTERY SPREAD STAYS IN THE PICTURE
  // ------------------------------------------------------------

  const trapBeforeRange = vBracket(
    XL - 0.49,
    gy(15), gy(19),
    C.violet
  );

  const trapAfterRange = vBracket(
    XR + 0.49,
    gy(16), gy(22),
    C.violet
  );

  const trapOverlap = outline(
    CX,
    (gy(16) + gy(19)) / 2,
    XR - XL + 0.64,
    gy(19) - gy(16),
    C.violet,
    0.08
  );

  const noiseTag = tag(
    'BASELINE SPREAD REMAINS',
    CX,
    P ? 1.46 : 1.39,
    C.violet, 16
  );

  await until(S(34));
  await play(
    ...remove(forgetTag),
    ...add(
      trapBeforeRange,
      trapAfterRange,
      trapOverlap,
      noiseTag
    ),
    ...fbox([
      'unrelated-group test',
      'starting differences',
      ['remain inside the noise', C.violet]
    ], C.violet),
    ...say('BIG BATTERY-TO-BATTERY SPREAD REMAINS', C.violet)
  );

  // ------------------------------------------------------------
  // 35: COMPARE THE WRONG AND CORRECT TEST RESULTS
  //
  // Same data:
  // Incorrect Welch analysis: t ≈ 1.36, p ≈ 23%.
  // Paired analysis: t ≈ 4.90, p ≈ 1.6%.
  //
  // Both horizontal t bars use the same scale.
  // ------------------------------------------------------------

  const compareLeft = CX - 2.70;
  const compareW = P ? 5.4 : 5.4;

  const tMax = 5;

  const wrongY = P ? 0.05 : 0.55;
  const correctY = P ? -2.50 : -1.48;

  function resultBar(
    value,
    y,
    color,
    title,
    pText
  ) {
    const wd = value / tMax * compareW;

    const base = outline(
      compareLeft + compareW / 2,
      y,
      compareW,
      0.39,
      C.muted,
      0.04
    );

    const fill = rect(
      compareLeft + wd / 2,
      y,
      wd,
      0.35,
      color,
      0.84
    );

    return new M.VGroup(
      base,
      fill,

      txt(
        title,
        CX,
        y + 0.62,
        color, 18
      ),

      txt(
        `t ≈ ${value.toFixed(2)}`,
        CX,
        y - 0.44,
        color, 19, true
      ),

      txt(
        pText,
        CX,
        y - 0.84,
        color, 18, true
      )
    );
  }

  const wrongResult = resultBar(
    WRONG_T,
    wrongY,
    C.amber,
    'IGNORE THE PAIRS',
    'p ≈ 23%'
  );

  const correctResult = resultBar(
    TSTAT,
    correctY,
    C.green,
    'KEEP THE PAIRS',
    'p ≈ 1.6%'
  );

  await until(S(35));
  await play(
    ...replace(
      wrongResult,
      correctResult
    ),
    ...fbox([
      ['pairs ignored:', C.amber],
      't ≈ 1.36; p ≈ 23%',
      ['paired: p ≈ 1.6%', C.green]
    ], C.amber),
    ...say('SAME DATA, VERY DIFFERENT RESULTS', C.amber)
  );

  // ------------------------------------------------------------
  // 36: THE REAL IMPROVEMENT HIDES IN THE NOISE
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    new M.Indicate(wrongResult, {
      color: C.amber
    }),
    ...fbox([
      '23% > 5%',
      ['fails to reject the null', C.amber],
      'the improvement is hidden'
    ], C.amber),
    ...say('THE IMPROVEMENT HIDES IN THE NOISE', C.amber)
  );

  // ------------------------------------------------------------
  // 37: ALWAYS ASK WHETHER READINGS HAVE PARTNERS
  // Restore the paired picture and show the four changes.
  // ------------------------------------------------------------

  const restoredPlot = makePairedPlot(
    true,
    C.green,
    true
  );

  await until(S(37));
  await play(
    ...replace(...restoredPlot),
    ...fbox([
      'does each reading',
      'have a partner?',
      ['yes → test differences', C.green]
    ], C.green),
    ...say('IF THEY ARE PAIRED, TEST THE DIFFERENCES', C.green)
  );

  // ------------------------------------------------------------
  // 38: CHECK THE ASSUMPTION ON THE DIFFERENCES
  //
  // The distribution of differences should be roughly normal.
  // The before and after columns do not each need to be normal.
  // Four readings cannot establish normality on their own.
  // ------------------------------------------------------------

  const checkAxis = differenceAxis();
  const checkDots = allDifferenceDots();

  const checkMean = meanMarker();

  const checkOutline = outline(
    (dx(1) + dx(3)) / 2,
    DY + 0.59,
    dx(3) - dx(1) + 0.60,
    1.12,
    C.green,
    0.025
  );

  const checkLabel = tag(
    'INSPECT THE CHANGES',
    CX,
    DY + 1.62,
    C.green, 17
  );

  await until(S(38));
  await play(
    ...replace(
      checkAxis,
      ...checkDots,
      checkMean,
      checkOutline,
      checkLabel
    ),
    ...fbox([
      'check the differences',
      'roughly bell-shaped',
      ['only four: inspect first', C.amber]
    ], C.green),
    ...say('CHECK THE DIFFERENCES, NOT THE TWO COLUMNS', C.green)
  );

  // ------------------------------------------------------------
  // 39: ONE-SENTENCE SUMMARY
  //
  // Matched readings → differences → mean difference vs zero.
  // ------------------------------------------------------------

  const finalAxis = differenceAxis();
  const finalDots = allDifferenceDots();

  const finalZero = zeroMarker(false);
  const finalMean = meanMarker(false);

  const finalGap = arrow(
    dx(0) + 0.07,
    DY + 1.15,
    dx(MEAN) - 0.07,
    DY + 1.15,
    C.green
  );

  const finalGapLabel = txt(
    '+2 hours',
    dx(2.85),
    DY + 1.46,
    C.green, 20, true
  );

  const finalTilesY = P ? 0.75 : 0.99;

  const finalTiles = D.map((v, k) => {
    const x = CX + (k - 1.5) * 1.37;

    return new M.VGroup(
      outline(
        x,
        finalTilesY,
        1.15,
        0.65,
        C.green,
        0.11
      ),

      txt(
        `+${v}`,
        x,
        finalTilesY,
        C.green, 22, true
      )
    );
  });

  const finalTitle = tag(
    'PAIRED t-TEST',
    CX,
    P ? 1.43 : 1.45,
    C.green, 18
  );

  await until(S(39));
  await play(
    ...replace(
      ...finalTiles,
      finalAxis,
      ...finalDots,
      finalZero,
      finalGap,
      finalGapLabel
    ),
    ...fbox([
      'pairs → changes',
      'mean change vs 0',
      ['t ≈ 4.90; p ≈ 1.6%', C.green]
    ], C.green),
    ...say('TURN PAIRS INTO CHANGES. TEST AGAINST ZERO.', C.green)
  );

  await until(E(39));

  // All sentence beats 0–39 are included.
  // Uses the supplied engine interface and reference conventions.
  // Browser rendering and narration synchronization have not
  // been runtime-tested against the actual engine installation.
}

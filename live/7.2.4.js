// lesson 7.2.4
// Pooled t-test: build one shared spread from two separate groups.
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
  // Same batteries and means as lesson 7.2.3.
  // Batch A = cyan. Batch C = pink.
  // ------------------------------------------------------------

  const A = [15, 17, 17, 19];
  const BATCH_C = [20, 22, 24, 26];

  const BLUE = C.cyan;
  const PINK = C.pink || '#f472b6';
  const POOL = C.violet;

  const mean = values =>
    values.reduce((s, v) => s + v, 0) / values.length;

  const squaredDistances = values => {
    const m = mean(values);
    return values.map(v => (v - m) ** 2);
  };

  const sum = values =>
    values.reduce((s, v) => s + v, 0);

  const NA = A.length;
  const NC = BATCH_C.length;

  const MA = mean(A);
  const MC = mean(BATCH_C);

  const DEVA = A.map(v => v - MA);
  const DEVC = BATCH_C.map(v => v - MC);

  const SQA = squaredDistances(A);
  const SQC = squaredDistances(BATCH_C);

  const SSA = sum(SQA);
  const SSC = sum(SQC);

  const DFA = NA - 1;
  const DFC = NC - 1;

  const VA = SSA / DFA;
  const VC = SSC / DFC;

  const GAP = MC - MA;

  const POOLED_SS = SSA + SSC;
  const DF = DFA + DFC;

  const VP = POOLED_SS / DF;

  const WA = VP / NA;
  const WC = VP / NC;

  const SE2 = WA + WC;
  const SE = Math.sqrt(SE2);

  const TSTAT = GAP / SE;

  // Previous lesson: Welch's test.
  const WELCH_WA = VA / NA;
  const WELCH_WC = VC / NC;

  const WELCH_SE2 = WELCH_WA + WELCH_WC;
  const WELCH_SE = Math.sqrt(WELCH_SE2);
  const WELCH_T = GAP / WELCH_SE;

  const WELCH_DF =
    WELCH_SE2 ** 2 /
    (
      WELCH_WA ** 2 / DFA +
      WELCH_WC ** 2 / DFC
    );

  const POOLED_P = 0.0077;
  const WELCH_P = 0.011;

  // Exact calculations:
  //
  // A: mean = 17, SS = 8, variance = 8/3.
  // C: mean = 23, SS = 20, variance = 20/3.
  //
  // Pooled SS = 8 + 20 = 28.
  // Pooled df = 3 + 3 = 6.
  // Pooled variance = 28/6 = 14/3 ≈ 4.67.
  //
  // SE² = 14/3 × (1/4 + 1/4)
  //     = 7/3.
  //
  // SE ≈ 1.53 hours.
  // t ≈ 3.93.
  // df = 6.
  // Two-sided p ≈ 0.0077.
  //
  // Keep full precision internally.
  // Round only the numbers displayed to the learner.

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, -6.55, 0]  // phone: bottom edge of the card
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.4 : 6.8;

  const say = (s, color = BLUE) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Same construction as the approved arithmetic-mean lesson.
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
    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const animations = [new M.FadeOut(boxNow)];
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
    const t = T(s, size, color, mono);

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

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
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

  // Track only top-level objects currently on screen.
  // Never regroup live objects merely to highlight them.

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
  // BATTERY ICON
  // ------------------------------------------------------------

  function battery(
    x, y,
    color = BLUE,
    width = 0.64,
    height = 1.02
  ) {
    const shell = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2
    });

    shell.setFill(C.card, 0.85);
    shell.moveTo(pt(x, y));

    const cap = rect(
      x,
      y + height / 2 + 0.06,
      width * 0.36,
      0.12,
      color, 1
    );

    const fill = rect(
      x, y,
      width - 0.15,
      height - 0.18,
      color, 0.82, 0
    );

    const glow = rect(
      x, y,
      width - 0.08,
      height - 0.10,
      color, 0.12, 0
    );

    return new M.VGroup(
      shell,
      cap,
      glow,
      fill
    );
  }

  function batteryRow(
    x, y,
    color,
    label,
    count = 4
  ) {
    const parts = [];

    const pitch = count <= 4
      ? 0.70
      : 0.44;

    for (let k = 0; k < count; k++) {
      parts.push(
        battery(
          x + (k - (count - 1) / 2) * pitch,
          y,
          color,
          pitch * 0.75,
          count <= 4 ? 0.95 : 0.72
        )
      );
    }

    parts.push(
      txt(
        label,
        x,
        y + 0.84,
        color, 18
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0-1: INTRODUCE THE OLDER TWO-GROUP TEST
  // ------------------------------------------------------------

  const introY = P ? -1.4 : -0.35;

  const introA = batteryRow(
    CX - 1.65,
    introY,
    BLUE,
    'GROUP A'
  );

  const introC = batteryRow(
    CX + 1.65,
    introY,
    PINK,
    'GROUP C'
  );

  const introCompare = txt(
    '↔',
    CX,
    introY,
    C.amber, 23
  );

  const introCaption = txt(
    'COMPARE TWO SEPARATE GROUPS',
    CX,
    introY - 1.25,
    C.muted, 18
  );

  await until(S(0));
  await play(
    ...add(
      introA,
      introC,
      introCompare,
      introCaption
    ),
    ...(P ? fbox([
      'an older test',
      ['for two separate groups', C.cyan],
      'still in many reports'
    ]) : []),
    ...say('AN OLDER TWO-GROUP TEST')
  );

  const pooledTitle = tag(
    'POOLED t-TEST',
    CX,
    introY - 1.30,
    POOL, 23
  );

  await until(S(1));
  await play(
    ...remove(introCaption),
    ...add(pooledTitle),
    ...fbox([
      ["Welch's t-test", BLUE],
      'versus',
      ['pooled t-test', POOL]
    ], POOL),
    ...say('HOW DOES POOLING DIFFER FROM WELCH?', POOL)
  );

  // ------------------------------------------------------------
  // SHARED HOURS NUMBER LINE
  // Same scale as the preceding Welch lesson.
  // ------------------------------------------------------------

  const HMIN = 14;
  const HMAX = 27;

  const HW = P ? 6.0 : 6.9;

  const HY = P ? -2.65 : -1.43;

  const hx = v =>
    CX - HW / 2 +
    (v - HMIN) / (HMAX - HMIN) * HW;

  function hoursAxis() {
    const parts = [
      line(
        hx(HMIN), HY,
        hx(HMAX), HY,
        C.muted, 3
      )
    ];

    for (let v = HMIN; v <= HMAX; v++) {
      const major = v % 2 === 0;

      parts.push(
        line(
          hx(v), HY - 0.07,
          hx(v), HY + 0.07,
          C.muted,
          major ? 1.7 : 0.8
        )
      );

      if (major) {
        parts.push(
          txt(
            String(v),
            hx(v),
            HY - 0.30,
            C.muted, 16, true,
            0.48
          )
        );
      }
    }

    parts.push(
      txt(
        'hours',
        hx(HMAX) - 0.15,
        HY - 0.70,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function hourDots(values, color) {
    return values.map((v, k) => {
      const repeats = values
        .slice(0, k)
        .filter(n => n === v)
        .length;

      return dot(
        hx(v),
        HY + 0.36 + repeats * 0.42,
        color,
        P ? 0.125 : 0.115
      );
    });
  }

  function hoursMean(v, color, label) {
    return new M.VGroup(
      dashed(
        hx(v), HY + 0.08,
        hx(v), HY + 1.02,
        color
      ),

      line(
        hx(v), HY - 0.51,
        hx(v), HY - 0.69,
        color, 3
      ),

      tag(
        label,
        hx(v),
        HY - 0.96,
        color, 16,
        2.65
      )
    );
  }

  function hoursGap() {
    return new M.VGroup(
      arrow(
        hx(MA),
        HY + 1.46,
        hx(MC),
        HY + 1.46,
        C.amber
      ),

      txt(
        '6 HOURS',
        (hx(MA) + hx(MC)) / 2,
        HY + 1.80,
        C.amber, 22, true
      )
    );
  }

  function fullHoursPicture(
    withMeans = true,
    withGap = true
  ) {
    const parts = [
      hoursAxis(),
      ...hourDots(A, BLUE),
      ...hourDots(BATCH_C, PINK)
    ];

    if (withMeans) {
      parts.push(
        hoursMean(MA, BLUE, 'A MEAN: 17'),
        hoursMean(MC, PINK, 'C MEAN: 23')
      );
    }

    if (withGap) {
      parts.push(hoursGap());
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 2: RETURN TO THE SAME TWO BATCHES
  // ------------------------------------------------------------

  const axis = hoursAxis();

  const legendA = tag(
    'BATCH A',
    hx(MA),
    HY + 1.34,
    BLUE, 17
  );

  const legendC = tag(
    'BATCH C',
    hx(MC),
    HY + 1.34,
    PINK, 17
  );

  await until(S(2));
  await play(
    ...replace(axis, legendA, legendC),
    ...(P ? fbox([
      'same two batches',
      ['A: 15, 17, 17, 19', BLUE],
      ['C: 20, 22, 24, 26', PINK]
    ]) : clearBox()),
    ...say('SAME TWO BATCHES AS LAST LESSON')
  );

  // ------------------------------------------------------------
  // 3: BATCH A
  // ------------------------------------------------------------

  const dotsA = hourDots(A, BLUE);

  const meanA = hoursMean(
    MA,
    BLUE,
    'A MEAN: 17'
  );

  await until(S(3));

  picture.push(...dotsA, meanA);

  await play(
    new M.LaggedStart(
      dotsA.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.20,
        runTime: 1.6
      }
    ),
    new M.FadeIn(meanA),
    ...fbox([
      ['batch A', BLUE],
      '15, 17, 17, 19',
      ['mean = 17 hours', BLUE]
    ], BLUE),
    ...say('BATCH A: MEAN 17 HOURS', BLUE)
  );

  // ------------------------------------------------------------
  // 4: BATCH C
  // ------------------------------------------------------------

  const dotsC = hourDots(BATCH_C, PINK);

  const meanC = hoursMean(
    MC,
    PINK,
    'C MEAN: 23'
  );

  await until(S(4));

  picture.push(...dotsC, meanC);

  await play(
    new M.LaggedStart(
      dotsC.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.20,
        runTime: 1.6
      }
    ),
    new M.FadeIn(meanC),
    ...fbox([
      ['batch C', PINK],
      '20, 22, 24, 26',
      ['mean = 23 hours', PINK]
    ], PINK),
    ...say('BATCH C: MEAN 23 HOURS', PINK)
  );

  // ------------------------------------------------------------
  // 5: THE GAP IS STILL SIX HOURS
  // ------------------------------------------------------------

  const observedGap = hoursGap();

  await until(S(5));
  await play(
    ...remove(legendA, legendC),
    ...add(observedGap),
    ...fbox([
      'mean C − mean A',
      ['23 − 17 = 6 hours', C.amber]
    ], C.amber),
    ...say('SAME GAP: SIX HOURS', C.amber)
  );

  // ------------------------------------------------------------
  // VARIANCE BAR HELPERS
  // All variance bars use the same horizontal scale.
  // ------------------------------------------------------------

  const VSCALE = P ? 0.82 : 0.85;

  const VLEFT = CX - 2.85;

  const VTOP = P ? 0.20 : 0.56;
  const VBOTTOM = P ? -2.50 : -1.48;

  function varianceBar(
    value,
    y,
    color,
    title,
    valueText,
    start = VLEFT
  ) {
    const width = value * VSCALE;

    return new M.VGroup(
      rect(
        start + width / 2,
        y,
        width + 0.07,
        0.48,
        color, 0.13, 0
      ),

      rect(
        start + width / 2,
        y,
        width,
        0.36,
        color, 0.84
      ),

      txt(
        title,
        CX,
        y + 0.56,
        color, 18
      ),

      txt(
        valueText,
        CX,
        y - 0.45,
        color, 20, true
      )
    );
  }

  function separateVariances() {
    return [
      varianceBar(
        VA, VTOP,
        BLUE,
        'BATCH A VARIANCE',
        '2.67 hours²'
      ),

      varianceBar(
        VC, VBOTTOM,
        PINK,
        'BATCH C VARIANCE',
        '6.67 hours²'
      )
    ];
  }

  // ------------------------------------------------------------
  // 6: WELCH KEPT TWO SEPARATE SPREADS
  // ------------------------------------------------------------

  const welchVariances = separateVariances();

  await until(S(6));
  await play(
    ...replace(...welchVariances),
    ...fbox([
      ['variance A ≈ 2.67', BLUE],
      ['variance C ≈ 6.67', PINK],
      'two separate estimates'
    ]),
    ...say('WELCH KEEPS TWO SEPARATE SPREADS')
  );

  // ------------------------------------------------------------
  // 7: THE POOLED TEST'S EXTRA ASSUMPTION
  //
  // The observed variances need not be exactly equal.
  // We assume the underlying true population variances are equal.
  // ------------------------------------------------------------

  function assumedSpreadRow(
    y, color, label
  ) {
    const assumedWidth = 3.65;

    return new M.VGroup(
      outline(
        CX,
        y,
        assumedWidth,
        0.43,
        POOL,
        0.10
      ),

      dashed(
        CX - assumedWidth / 2,
        y,
        CX + assumedWidth / 2,
        y,
        POOL
      ),

      txt(
        label,
        CX,
        y + 0.58,
        color, 18
      ),

      txt(
        'same unknown true spread',
        CX,
        y - 0.43,
        POOL, 17
      )
    );
  }

  const assumedA = assumedSpreadRow(
    VTOP,
    BLUE,
    'TRUE SPREAD OF A'
  );

  const assumedC = assumedSpreadRow(
    VBOTTOM,
    PINK,
    'TRUE SPREAD OF C'
  );

  const sameSpread = tag(
    'ASSUMPTION',
    CX,
    (VTOP + VBOTTOM) / 2 + 0.08,
    C.amber, 16
  );

  await until(S(7));
  await play(
    ...replace(
      assumedA,
      assumedC,
      sameSpread
    ),
    ...fbox([
      ['extra assumption', C.amber],
      'true variance A',
      ['= true variance C', POOL]
    ], POOL),
    ...say('ASSUME ONE COMMON TRUE SPREAD', POOL)
  );

  // ------------------------------------------------------------
  // 8: USE INFORMATION FROM ALL EIGHT BATTERIES
  // ------------------------------------------------------------

  const gatherY = P ? 0.12 : 0.53;
  const gatherBottom = P ? -3.05 : -1.65;

  const gatherA = batteryRow(
    CX - 1.63,
    gatherY,
    BLUE,
    'BATCH A'
  );

  const gatherC = batteryRow(
    CX + 1.63,
    gatherY,
    PINK,
    'BATCH C'
  );

  const gatherArrowA = arrow(
    CX - 1.65,
    gatherY - 0.65,
    CX - 0.61,
    gatherBottom + 0.52,
    BLUE
  );

  const gatherArrowC = arrow(
    CX + 1.65,
    gatherY - 0.65,
    CX + 0.61,
    gatherBottom + 0.52,
    PINK
  );

  const sharedEstimate = new M.VGroup(
    outline(
      CX,
      gatherBottom,
      4.85, 0.95,
      POOL, 0.10
    ),

    txt(
      'ONE SHARED ESTIMATE',
      CX,
      gatherBottom + 0.12,
      POOL, 19
    ),

    txt(
      'information from all 8 batteries',
      CX,
      gatherBottom - 0.23,
      C.muted, 15
    )
  );

  await until(S(8));
  await play(
    ...replace(
      gatherA,
      gatherC,
      gatherArrowA,
      gatherArrowC,
      sharedEstimate
    ),
    ...fbox([
      'if the assumption is true',
      'combine spread information',
      ['from all 8 batteries', POOL]
    ], POOL),
    ...say('USE ALL EIGHT TO ESTIMATE ONE SPREAD', POOL)
  );

  // ------------------------------------------------------------
  // 9: POOLING MEANS PUTTING INFORMATION INTO ONE POT
  // Illustrative money-pot metaphor before the calculation.
  // ------------------------------------------------------------

  const potY = P ? -2.02 : -1.10;

  function pot(
    x, y,
    width = 4.65,
    height = 1.60
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.20,
      color: POOL,
      strokeWidth: 2.5
    });

    r.setFill(POOL, 0.055);
    r.moveTo(pt(x, y));

    return r;
  }

  function coin(x, y, color) {
    const d = new M.Circle({
      radius: 0.20,
      color,
      strokeWidth: 2
    });

    d.setFill(color, 0.70);
    d.moveTo(pt(x, y));

    const mark = txt(
      '+',
      x, y,
      C.ink, 15, true
    );

    return new M.VGroup(d, mark);
  }

  const metaphorPot = pot(
    CX,
    potY
  );

  const metaphorCoins = [];

  for (let k = 0; k < 8; k++) {
    const row = Math.floor(k / 4);
    const col = k % 4;

    metaphorCoins.push(
      coin(
        CX + (col - 1.5) * 0.63,
        potY + (0.5 - row) * 0.49,
        k < 4 ? BLUE : PINK
      )
    );
  }

  const sourceA = tag(
    'A CONTRIBUTES',
    CX - 1.65,
    P ? 0.45 : 1.12,
    BLUE, 16,
    2.75
  );

  const sourceC = tag(
    'C CONTRIBUTES',
    CX + 1.65,
    P ? 0.45 : 1.12,
    PINK, 16,
    2.75
  );

  const poolArrowA = arrow(
    CX - 1.65,
    P ? 0.05 : 0.74,
    CX - 1.02,
    potY + 0.90,
    BLUE
  );

  const poolArrowC = arrow(
    CX + 1.65,
    P ? 0.05 : 0.74,
    CX + 1.02,
    potY + 0.90,
    PINK
  );

  const potLabel = tag(
    'ONE POT',
    CX,
    potY - 1.12,
    POOL, 18
  );

  await until(S(9));
  await play(
    ...replace(
      metaphorPot,
      ...metaphorCoins,
      sourceA,
      sourceC,
      poolArrowA,
      poolArrowC,
      potLabel
    ),
    ...fbox([
      ['pooling', POOL],
      'put both contributions',
      'into one shared pot'
    ], POOL),
    ...say('POOLING = PUTTING IT TOGETHER', POOL)
  );

  // ------------------------------------------------------------
  // 10: STEP ONE — DISTANCES FROM EACH GROUP'S OWN MEAN
  //
  // Center each batch on its own mean.
  // Do not measure distances from the grand mean.
  // ------------------------------------------------------------

  const RELW = P ? 5.75 : 5.9;

  const rx = d =>
    CX + d / 4 * RELW / 2;

  const RELAY = P ? -0.30 : 0.16;
  const RELCY = P ? -2.85 : -1.88;

  function deviationRow(
    values,
    m,
    y,
    color,
    label
  ) {
    const parts = [
      line(
        rx(-4), y,
        rx(4), y,
        C.muted, 2
      ),

      dashed(
        rx(0), y - 0.08,
        rx(0), y + 0.84,
        color
      ),

      txt(
        label,
        CX,
        y + 1.2,
        color, 18
      )
    ];

    for (let d = -3; d <= 3; d++) {
      parts.push(
        line(
          rx(d), y - 0.06,
          rx(d), y + 0.06,
          C.muted, 1
        ),

        txt(
          d < 0
            ? `−${Math.abs(d)}`
            : d > 0
              ? `+${d}`
              : '0',
          rx(d),
          y - 0.29,
          d === 0 ? color : C.muted,
          16, true,
          0.65
        )
      );
    }

    values.forEach((v, k) => {
      const repeats = values
        .slice(0, k)
        .filter(n => n === v)
        .length;

      parts.push(
        dot(
          rx(v - m),
          y + 0.22 + repeats * 0.34,
          color,
          0.12
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const deviationsA = deviationRow(
    A, MA,
    RELAY,
    BLUE,
    'A: DISTANCE FROM 17'
  );

  const deviationsC = deviationRow(
    BATCH_C, MC,
    RELCY,
    PINK,
    'C: DISTANCE FROM 23'
  );

  await until(S(10));
  await play(
    ...replace(
      deviationsA,
      deviationsC
    ),
    ...fbox([
      'distance from own mean',
      ['A: −2, 0, 0, +2', BLUE],
      ['C: −3, −1, +1, +3', PINK]
    ]),
    ...say('STEP 1: MEASURE AND SQUARE THE DISTANCES', C.amber)
  );

  // ------------------------------------------------------------
  // SQUARED-DISTANCE TILES
  //
  // A value of 4 is represented by four small unit blocks.
  // A value of 9 is represented by nine small unit blocks.
  // A zero has no blocks.
  // All unit blocks represent one squared hour.
  // ------------------------------------------------------------

  const SQAY = P ? 0.08 : 0.51;
  const SQCY = P ? -2.72 : -1.43;

  const tileX = k =>
    CX + (k - 1.5) * 1.28;

  const unitSize = P ? 0.155 : 0.145;
  const unitPitch = P ? 0.187 : 0.176;

  function squareTile(
    deviation,
    k,
    y,
    color
  ) {
    const x = tileX(k);

    const value = deviation ** 2;

    const r = outline(
      x,
      y,
      1.10, 1.20,
      color,
      0.055
    );

    const label = deviation < 0
      ? `(−${Math.abs(deviation)})²`
      : `(${deviation})²`;

    const parts = [
      r,

      txt(
        label,
        x,
        y + 0.40,
        C.muted, 15, true,
        0.98
      ),

      txt(
        String(value),
        x,
        y - 0.39,
        color, 21, true
      )
    ];

    if (value > 0) {
      const cols = Math.ceil(Math.sqrt(value));
      const rows = Math.ceil(value / cols);

      for (let j = 0; j < value; j++) {
        const rr = Math.floor(j / cols);
        const cc = j % cols;

        parts.push(
          rect(
            x + (cc - (cols - 1) / 2) * unitPitch,
            y + 0.02 +
              ((rows - 1) / 2 - rr) * unitPitch,
            unitSize,
            unitSize,
            color, 0.86
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function squaredRow(
    devs,
    y,
    color,
    label,
    totalText
  ) {
    return [
      txt(
        label,
        CX,
        y + 0.84,
        color, 17
      ),

      ...devs.map((v, k) =>
        squareTile(v, k, y, color)
      ),

      txt(
        totalText,
        CX,
        y - 0.86,
        color, 19, true
      )
    ];
  }

  // ------------------------------------------------------------
  // 11: BATCH A'S SQUARED DISTANCES
  //
  // 4 + 0 + 0 + 4 = 8.
  // ------------------------------------------------------------

  const squareRowA = squaredRow(
    DEVA,
    SQAY,
    BLUE,
    'BATCH A',
    '4 + 0 + 0 + 4 = 8'
  );

  await until(S(11));
  await play(
    ...replace(...squareRowA),
    ...fbox([
      ['batch A', BLUE],
      'squared distances',
      ['4 + 0 + 0 + 4 = 8', BLUE]
    ], BLUE),
    ...say('BATCH A CONTRIBUTES EIGHT', BLUE)
  );

  // ------------------------------------------------------------
  // 12: BATCH C'S SQUARED DISTANCES
  //
  // 9 + 1 + 1 + 9 = 20.
  // ------------------------------------------------------------

  const squareRowC = squaredRow(
    DEVC,
    SQCY,
    PINK,
    'BATCH C',
    '9 + 1 + 1 + 9 = 20'
  );

  await until(S(12));
  await play(
    ...add(...squareRowC),
    ...fbox([
      ['batch C', PINK],
      'squared distances',
      ['9 + 1 + 1 + 9 = 20', PINK]
    ], PINK),
    ...say('BATCH C CONTRIBUTES TWENTY', PINK)
  );

  // ------------------------------------------------------------
  // 13: STEP TWO — POUR BOTH TOTALS INTO ONE POT
  //
  // Eight cyan blocks and twenty pink blocks.
  // Every block has the same value: one squared hour.
  // ------------------------------------------------------------

  const POOLY = P ? -1.10 : -0.59;

  const poolCols = 7;
  const poolRows = 4;

  const poolPitch = P ? 0.42 : 0.36;
  const poolUnit = poolPitch * 0.84;

  const poolSlot = k => {
    const row = Math.floor(k / poolCols);
    const col = k % poolCols;

    return [
      CX + (col - (poolCols - 1) / 2) * poolPitch,
      POOLY + ((poolRows - 1) / 2 - row) * poolPitch,
      0
    ];
  };

  const numericPot = outline(
    CX,
    POOLY,
    P ? 4.42 : 4.10,
    P ? 2.06 : 1.72,
    POOL, 0.055
  );

  const poolBlocks = Array.from(
    { length: POOLED_SS },
    (_, k) => {
      const p = poolSlot(k);

      return rect(
        p[0],
        p[1],
        poolUnit,
        poolUnit,
        k < SSA ? BLUE : PINK,
        0.86
      );
    }
  );

  const pooledALabel = tag(
    'A: 8',
    CX - 1.62,
    POOLY + (P ? 1.48 : 1.33),
    BLUE, 19
  );

  const pooledCLabel = tag(
    'C: 20',
    CX + 1.62,
    POOLY + (P ? 1.48 : 1.33),
    PINK, 19
  );

  const poolPlus = txt(
    '+',
    CX,
    POOLY + (P ? 1.48 : 1.33),
    C.amber, 25, true
  );

  const poolTotal = txt(
    '8 + 20 = 28',
    CX,
    POOLY - (P ? 1.37 : 1.13),
    POOL, 25, true
  );

  await until(S(13));

  const poolingAnimations = picture.map(
    o => new M.FadeOut(o)
  );

  picture = [
    numericPot,
    pooledALabel,
    pooledCLabel,
    poolPlus,
    poolTotal,
    ...poolBlocks
  ];

  await play(
    ...poolingAnimations,

    new M.FadeIn(numericPot),
    new M.FadeIn(pooledALabel),
    new M.FadeIn(pooledCLabel),
    new M.FadeIn(poolPlus),
    new M.FadeIn(poolTotal),

    new M.LaggedStart(
      poolBlocks.map(b => new M.FadeIn(b)),
      {
        lagRatio: 0.06,
        runTime: 2.1
      }
    ),

    ...fbox([
      'combine squared distances',
      ['8 + 20 = 28', POOL],
      'one pooled total'
    ], POOL),

    ...say('STEP 2: COMBINE BOTH TOTALS', POOL)
  );

  // ------------------------------------------------------------
  // 14: STEP THREE — COUNT DEGREES OF FREEDOM
  //
  // Each group estimates its own mean.
  // Each therefore loses one degree of freedom.
  // Four observations give three df per group.
  // ------------------------------------------------------------

  const DFAY = P ? 0.20 : 0.65;
  const DFCY = P ? -2.22 : -1.25;

  function dfRow(
    y,
    color,
    label
  ) {
    const parts = [
      txt(
        label,
        CX,
        y + 0.75,
        color, 18
      )
    ];

    for (let k = 0; k < 4; k++) {
      const x = CX + (k - 1.5) * 0.95;

      parts.push(
        outline(
          x, y,
          0.72, 0.72,
          k < 3 ? color : C.muted,
          k < 3 ? 0.20 : 0.025
        )
      );

      if (k < 3) {
        parts.push(
          txt(
            '1',
            x, y,
            color, 23, true
          )
        );
      } else {
        parts.push(
          txt(
            '−1',
            x, y,
            C.muted, 19, true
          )
        );
      }
    }

    parts.push(
      txt(
        '4 − 1 = 3 df',
        CX,
        y - 0.64,
        color, 19, true
      )
    );

    return new M.VGroup(...parts);
  }

  const dfRowA = dfRow(
    DFAY,
    BLUE,
    'BATCH A'
  );

  const dfRowC = dfRow(
    DFCY,
    PINK,
    'BATCH C'
  );

  await until(S(14));
  await play(
    ...replace(
      dfRowA,
      dfRowC
    ),
    ...fbox([
      ['df A = 4 − 1 = 3', BLUE],
      ['df C = 4 − 1 = 3', PINK],
      'divide by the total df'
    ], POOL),
    ...say('STEP 3: COUNT DEGREES OF FREEDOM', POOL)
  );

  // ------------------------------------------------------------
  // 15: DIVIDE THE POOLED TOTAL BY SIX
  //
  // 28 / 6 = 4.666...
  // Visual: 28 unit blocks distributed equally across six slots.
  // Each slot receives four full units and two thirds of a unit.
  // ------------------------------------------------------------

  const shareBase = P ? -3.25 : -2.17;
  const sharePitch = P ? 0.87 : 0.91;

  const shareBlockH = P ? 0.36 : 0.31;
  const shareBlockW = sharePitch * 0.75;

  const shareX = k =>
    CX + (k - 2.5) * sharePitch;

  const shareBlocks = [];

  for (let k = 0; k < DF; k++) {
    const full = Math.floor(VP);
    const frac = VP - full;

    for (let j = 0; j < full; j++) {
      shareBlocks.push(
        rect(
          shareX(k),
          shareBase +
            (j + 0.5) * shareBlockH,
          shareBlockW,
          shareBlockH * 0.86,
          POOL,
          0.83
        )
      );
    }

    if (frac > 0) {
      const h =
        shareBlockH * frac * 0.86;

      shareBlocks.push(
        rect(
          shareX(k),
          shareBase +
            full * shareBlockH +
            h / 2 +
            shareBlockH * 0.07,
          shareBlockW,
          h,
          POOL,
          0.65
        )
      );
    }
  }

  const shareFloor = line(
    shareX(0) - sharePitch / 2,
    shareBase,
    shareX(5) + sharePitch / 2,
    shareBase,
    C.muted, 2
  );

  const shareLabels = Array.from(
    { length: DF },
    (_, k) =>
      txt(
        String(k + 1),
        shareX(k),
        shareBase - 0.29,
        C.muted, 15, true
      )
  );

  const shareLevel = dashed(
    shareX(0) - sharePitch / 2,
    shareBase + VP * shareBlockH,
    shareX(5) + sharePitch / 2,
    shareBase + VP * shareBlockH,
    C.amber
  );

  const shareValue = tag(
    '≈ 4.67 EACH',
    CX,
    shareBase + VP * shareBlockH + 0.43,
    POOL, 18
  );

  const shareTitle = txt(
    '28 SQUARED HOURS ÷ 6 df',
    CX,
    P ? 0.65 : 0.98,
    C.amber, 19, true
  );

  await until(S(15));
  await play(
    ...replace(
      shareFloor,
      ...shareBlocks,
      ...shareLabels,
      shareLevel,
      shareValue,
      shareTitle
    ),
    ...fbox([
      'total df = 3 + 3 = 6',
      '28 ÷ 6',
      ['≈ 4.67 hours²', POOL]
    ], POOL),
    ...say('28 DIVIDED BY 6 IS ABOUT 4.7', POOL)
  );

  // ------------------------------------------------------------
  // 16: NAME THE SHARED ESTIMATE
  // ------------------------------------------------------------

  const pooledVarianceY = P ? -0.95 : -0.45;

  const pooledVarianceBar = varianceBar(
    VP,
    pooledVarianceY,
    POOL,
    'POOLED VARIANCE',
    '4.67 hours²'
  );

  const pooledVarianceTag = tag(
    'ONE SHARED SPREAD',
    CX,
    pooledVarianceY - 1.18,
    POOL, 20
  );

  await until(S(16));
  await play(
    ...replace(
      pooledVarianceBar,
      pooledVarianceTag
    ),
    ...fbox([
      'pooled variance',
      '= pooled total ÷ total df',
      ['= 28/6 ≈ 4.67', POOL]
    ], POOL),
    ...say('POOLED VARIANCE = ONE SHARED SPREAD', POOL)
  );

  // ------------------------------------------------------------
  // 17: THE GAP HAS NOT CHANGED
  //
  // The only change in the standard-error construction:
  // one shared variance replaces the two separate variances.
  // ------------------------------------------------------------

  const sameGapPicture = fullHoursPicture(
    true,
    true
  );

  const sharedSpreadTag = tag(
    'SHARED VARIANCE ≈ 4.67',
    CX,
    P ? 0.70 : 1.03,
    POOL, 17
  );

  await until(S(17));
  await play(
    ...replace(
      ...sameGapPicture,
      sharedSpreadTag
    ),
    ...fbox([
      ['gap is still 6 hours', C.amber],
      'change only the spread',
      ['used beneath the gap', POOL]
    ], POOL),
    ...say('SAME GAP, DIFFERENT SPREAD ESTIMATE', POOL)
  );

  // ------------------------------------------------------------
  // 18: THE POOLED VARIANCE SITS BETWEEN A AND C
  //
  // All three bars have the same scale and starting point.
  // ------------------------------------------------------------

  const compareA_Y = P ? 0.18 : 0.83;
  const compareP_Y = P ? -1.71 : -0.53;
  const compareC_Y = P ? -3.60 : -1.89;

  function compactVarianceBar(
    value,
    y,
    color,
    name
  ) {
    const wd = value * VSCALE;

    return new M.VGroup(
      txt(
        name,
        VLEFT + 0.02,
        y + 0.39,
        color, 16,
        false, 1.0
      ),

      rect(
        VLEFT + wd / 2,
        y,
        wd,
        0.34,
        color, 0.86
      ),

      txt(
        value.toFixed(2),
        VLEFT + wd / 2,
        y,
        C.ink, 17, true,
        wd - 0.10
      )
    );
  }

  const compareVarA = compactVarianceBar(
    VA,
    compareA_Y,
    BLUE,
    'A'
  );

  const compareVarP = compactVarianceBar(
    VP,
    compareP_Y,
    POOL,
    'POOLED'
  );

  const compareVarC = compactVarianceBar(
    VC,
    compareC_Y,
    PINK,
    'C'
  );

  const pooledHighlight = outline(
    VLEFT + VP * VSCALE / 2,
    compareP_Y,
    VP * VSCALE + 0.22,
    0.58,
    POOL
  );

  const betweenCaption = txt(
    '2.67 < 4.67 < 6.67',
    CX,
    P ? -4.37 : -2.53,
    POOL, 20, true
  );

  await until(S(18));
  await play(
    ...replace(
      compareVarA,
      compareVarP,
      compareVarC,
      pooledHighlight,
      betweenCaption
    ),
    ...fbox([
      ['A ≈ 2.67', BLUE],
      ['pooled ≈ 4.67', POOL],
      ['C ≈ 6.67', PINK]
    ], POOL),
    ...say('THE SHARED ESTIMATE SITS BETWEEN THEM', POOL)
  );

  // ------------------------------------------------------------
  // 19: STEP FOUR — USE THE SHARED SPREAD IN BOTH GROUPS
  // ------------------------------------------------------------

  const entryY = P ? 0.65 : 1.02;
  const branchY = P ? -2.05 : -1.18;

  const entryA_X = CX - 1.61;
  const entryC_X = CX + 1.61;

  function varianceCard(
    x,
    y,
    color,
    label,
    valueText
  ) {
    return new M.VGroup(
      outline(
        x, y,
        2.75, 1.18,
        color, 0.055
      ),

      txt(
        label,
        x,
        y + 0.32,
        color, 17
      ),

      txt(
        valueText,
        x,
        y - 0.13,
        POOL, 23, true,
        2.50
      )
    );
  }

  const sharedSource = tag(
    'POOLED VARIANCE: 4.67',
    CX,
    entryY,
    POOL, 19
  );

  const sharedBranchA = arrow(
    CX - 0.38,
    entryY - 0.32,
    entryA_X,
    branchY + 0.72,
    POOL
  );

  const sharedBranchC = arrow(
    CX + 0.38,
    entryY - 0.32,
    entryC_X,
    branchY + 0.72,
    POOL
  );

  const varianceForA = varianceCard(
    entryA_X,
    branchY,
    BLUE,
    'A MEAN USES',
    '4.67'
  );

  const varianceForC = varianceCard(
    entryC_X,
    branchY,
    PINK,
    'C MEAN USES',
    '4.67'
  );

  const oneSpreadCaption = txt(
    'SAME VARIANCE FOR BOTH MEANS',
    CX,
    branchY - 0.99,
    POOL, 17
  );

  await until(S(19));
  await play(
    ...replace(
      sharedSource,
      sharedBranchA,
      sharedBranchC,
      varianceForA,
      varianceForC,
      oneSpreadCaption
    ),
    ...fbox([
      'use pooled variance',
      ['for A: 4.67', BLUE],
      ['for C: 4.67', PINK]
    ], POOL),
    ...say('STEP 4: USE THE ONE SHARED SPREAD', POOL)
  );

  // ------------------------------------------------------------
  // DIVIDED-VARIANCE ROWS
  //
  // Divide the same pooled variance into four equal pieces.
  // One highlighted quarter represents each mean's squared SE.
  //
  // Exact contribution:
  // (14/3) / 4 = 7/6 ≈ 1.1667.
  // ------------------------------------------------------------

  const PARTAY = P ? -0.15 : 0.44;
  const PARTCY = P ? -2.70 : -1.50;

  const partScale = P ? 1.14 : 1.18;

  const fullPartWidth = VP * partScale;
  const partWidth = fullPartWidth / 4;

  const partLeft = CX - fullPartWidth / 2;

  function dividedRow(
    y,
    groupColor,
    label
  ) {
    const parts = [
      txt(
        label,
        CX,
        y + 0.78,
        groupColor, 18
      ),

      txt(
        '4.67 ÷ 4',
        CX,
        y + 0.38,
        POOL, 18, true
      )
    ];

    for (let k = 0; k < 4; k++) {
      parts.push(
        rect(
          partLeft + (k + 0.5) * partWidth,
          y,
          partWidth - 0.035,
          0.40,
          POOL,
          k === 0 ? 0.91 : 0.16
        )
      );
    }

    parts.push(
      bracket(
        partLeft,
        partLeft + partWidth,
        y - 0.37,
        groupColor,
        0.085
      ),

      txt(
        '≈ 1.17',
        partLeft + partWidth / 2,
        y - 0.65,
        groupColor, 18, true,
        partWidth + 0.20
      ),

      txt(
        'squared wobble of the mean',
        CX + 0.61,
        y - 0.65,
        P ? C.ink : C.muted, P ? 17 : 15,
        false, 3.65
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 20: BATCH A'S SQUARED STANDARD ERROR
  // ------------------------------------------------------------

  const dividedA = dividedRow(
    PARTAY,
    BLUE,
    'BATCH A: FOUR BATTERIES'
  );

  await until(S(20));
  await play(
    ...replace(dividedA),
    ...fbox([
      'squared SE of A mean',
      '4.67 ÷ 4',
      ['≈ 1.17 hours²', BLUE]
    ], BLUE),
    ...say('A MEAN: SHARED VARIANCE ÷ 4', BLUE)
  );

  // ------------------------------------------------------------
  // 21: BATCH C GETS THE SAME CONTRIBUTION
  //
  // Same pooled variance, same sample size.
  // ------------------------------------------------------------

  const dividedC = dividedRow(
    PARTCY,
    PINK,
    'BATCH C: FOUR BATTERIES'
  );

  await until(S(21));
  await play(
    ...add(dividedC),
    ...fbox([
      ['A contribution ≈ 1.17', BLUE],
      ['C contribution ≈ 1.17', PINK],
      'same spread, same count'
    ], POOL),
    ...say('C MEAN: THE SAME VARIANCE ÷ 4', PINK)
  );

  // ------------------------------------------------------------
  // 22: ADD THE TWO CONTRIBUTIONS AND TAKE THE SQUARE ROOT
  //
  // Exact: 7/6 + 7/6 = 7/3.
  // Square root = 1.5275... hours.
  // ------------------------------------------------------------

  const combinedY = P ? 0.36 : 0.88;

  const combinedW = P ? 5.15 : 5.25;

  const contributionAW =
    combinedW * WA / SE2;

  const contributionCW =
    combinedW * WC / SE2;

  const combinedLeft = CX - combinedW / 2;

  const combinedVariance = new M.VGroup(
    rect(
      combinedLeft + contributionAW / 2,
      combinedY,
      contributionAW - 0.025,
      0.40,
      BLUE, 0.83
    ),

    rect(
      combinedLeft +
        contributionAW +
        contributionCW / 2,
      combinedY,
      contributionCW - 0.025,
      0.40,
      PINK, 0.83
    ),

    txt(
      '1.17',
      combinedLeft + contributionAW / 2,
      combinedY,
      C.ink, 18, true
    ),

    txt(
      '1.17',
      combinedLeft +
        contributionAW +
        contributionCW / 2,
      combinedY,
      C.ink, 18, true
    ),

    txt(
      'TOTAL ≈ 2.33 HOURS²',
      CX,
      combinedY + 0.53,
      POOL, 18, true
    )
  );

  const rootY = P ? -2.20 : -1.12;
  const rootScale = P ? 1.42 : 0.95;

  const rootSide = SE * rootScale;

  const rootLeft = CX - rootSide / 2;

  const rootA = rect(
    rootLeft + rootSide / 4,
    rootY,
    rootSide / 2,
    rootSide,
    BLUE, 0.68
  );

  const rootC = rect(
    rootLeft + 3 * rootSide / 4,
    rootY,
    rootSide / 2,
    rootSide,
    PINK, 0.68
  );

  const rootOutline = outline(
    CX,
    rootY,
    rootSide,
    rootSide,
    POOL
  );

  const rootAreaLabel = txt(
    '2.33',
    CX,
    rootY,
    C.ink, 21, true,
    rootSide - 0.10
  );

  const rootBracketY =
    rootY - rootSide / 2 - 0.25;

  const rootBracket = bracket(
    rootLeft,
    rootLeft + rootSide,
    rootBracketY,
    C.green,
    0.09
  );

  const rootLabel = txt(
    'SE ≈ 1.53 h',
    CX,
    rootBracketY - 0.31,
    C.green, 20, true
  );

  const rootConnector = arrow(
    CX,
    combinedY - 0.30,
    CX,
    rootY + rootSide / 2 + 0.09,
    C.amber
  );

  const rootSign = txt(
    '√',
    CX + 1.76,
    rootY,
    C.amber, 31
  );

  await until(S(22));
  await play(
    ...replace(
      combinedVariance,
      rootA,
      rootC,
      rootOutline,
      rootAreaLabel,
      rootBracket,
      rootLabel,
      rootConnector,
      rootSign
    ),
    ...fbox([
      '7/6 + 7/6 = 7/3',
      'SE = √(7/3)',
      ['≈ 1.53 hours', C.green]
    ], C.green),
    ...say('ADD THE WOBBLES, THEN RETURN TO HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 23: STEP FIVE — SIX HOURS DIVIDED BY 1.53
  //
  // Count three full standard-error blocks and a partial block.
  // ------------------------------------------------------------

  const rulerW = P ? 5.85 : 6.15;

  const rulerLeft = CX - rulerW / 2;
  const rulerRight = CX + rulerW / 2;

  const rulerY = P ? -0.80 : -0.43;

  const unitWidth = rulerW * SE / GAP;

  const fullUnits = Math.floor(TSTAT);
  const fraction = TSTAT - fullUnits;

  function seBlocks() {
    const parts = [];

    let cursor = rulerLeft;

    for (let k = 0; k <= fullUnits; k++) {
      const amount = k < fullUnits
        ? 1
        : fraction;

      const width = unitWidth * amount;
      const x = cursor + width / 2;

      const block = rect(
        x,
        rulerY - 0.43,
        Math.max(0.025, width - 0.045),
        0.53,
        POOL,
        k < fullUnits ? 0.85 : 0.45
      );

      const label = txt(
        k < fullUnits ? '1 SE' : '0.93',
        x,
        rulerY - 0.43,
        C.ink, 17, true,
        width - 0.10
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
        rulerY + 0.94,
        C.amber
      ),

      txt(
        '6 HOURS',
        CX,
        rulerY + 1.27,
        C.amber, 21, true
      ),

      tag(
        '17',
        rulerLeft,
        rulerY + 0.47,
        BLUE, 16
      ),

      tag(
        '23',
        rulerRight,
        rulerY + 0.47,
        PINK, 16
      ),

      arrow(
        rulerLeft,
        rulerY + 0.07,
        rulerRight,
        rulerY + 0.07,
        C.amber
      ),

      ...seBlocks(),

      tag(
        't ≈ 3.93',
        CX,
        rulerY - 1.21,
        POOL, 22
      )
    ];
  }

  const pooledRuler = rulerPicture();

  await until(S(23));
  await play(
    ...replace(...pooledRuler),
    ...fbox([
      't = gap ÷ SE',
      '  = 6 ÷ 1.53',
      ['  ≈ 3.93', POOL]
    ], POOL),
    ...say('STEP 5: t IS ABOUT 3.9', POOL)
  );

  // ------------------------------------------------------------
  // 24: THE SAME t AS WELCH
  // ------------------------------------------------------------

  const resultTopY = P ? 0.25 : 0.64;
  const resultBottomY = P ? -2.50 : -1.43;

  function comparisonCard(
    y,
    color,
    title,
    lines
  ) {
    const parts = [
      outline(
        CX,
        y,
        5.85, 1.60,
        color, 0.06
      ),

      txt(
        title,
        CX,
        y + 0.48,
        color, 19
      )
    ];

    lines.forEach((s, k) => {
      parts.push(
        txt(
          s,
          CX,
          y + 0.02 - k * 0.37,
          k === lines.length - 1
            ? color
            : C.ink,
          18, true,
          5.55
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const equalWelch = comparisonCard(
    resultTopY,
    BLUE,
    "WELCH'S t-TEST",
    [
      'SE ≈ 1.53 hours',
      't ≈ 3.93'
    ]
  );

  const equalPooled = comparisonCard(
    resultBottomY,
    POOL,
    'POOLED t-TEST',
    [
      'SE ≈ 1.53 hours',
      't ≈ 3.93'
    ]
  );

  const equalSign = txt(
    '=',
    CX,
    (resultTopY + resultBottomY) / 2,
    C.green, 25, true
  );

  await until(S(24));
  await play(
    ...replace(
      equalWelch,
      equalPooled,
      equalSign
    ),
    ...fbox([
      ['Welch t ≈ 3.93', BLUE],
      ['pooled t ≈ 3.93', POOL],
      'why are they equal?'
    ], C.green),
    ...say('EXACTLY THE SAME t AS WELCH', C.green)
  );

  // ------------------------------------------------------------
  // 25: EQUAL GROUP SIZES GIVE EQUAL STANDARD ERRORS
  //
  // With equal group sizes n:
  //
  // pooled variance = (vA + vC) / 2.
  //
  // pooled SE² = [(vA + vC)/2] × (2/n)
  //            = (vA + vC)/n
  //            = Welch SE².
  //
  // Visual proof using exact fractions:
  // Welch pieces: 2/3 and 5/3.
  // Pooled pieces: 7/6 and 7/6.
  // Both bars have exactly the same total length.
  // ------------------------------------------------------------

  const equalityScale = P ? 2.20 : 2.30;
  const equalityWidth = SE2 * equalityScale;

  const eqLeft = CX - equalityWidth / 2;

  const EQWY = P ? 0.04 : 0.55;
  const EQPY = P ? -2.25 : -1.42;

  function equalityBar(
    v1,
    v2,
    y,
    title,
    text1,
    text2
  ) {
    const w1 = v1 * equalityScale;
    const w2 = v2 * equalityScale;

    return new M.VGroup(
      txt(
        title,
        CX,
        y + 0.62,
        C.ink, 17
      ),

      rect(
        eqLeft + w1 / 2,
        y,
        w1 - 0.025,
        0.48,
        BLUE, 0.85
      ),

      rect(
        eqLeft + w1 + w2 / 2,
        y,
        w2 - 0.025,
        0.48,
        PINK, 0.85
      ),

      txt(
        text1,
        eqLeft + w1 / 2,
        y,
        C.ink, 17, true,
        w1 - 0.10
      ),

      txt(
        text2,
        eqLeft + w1 + w2 / 2,
        y,
        C.ink, 17, true,
        w2 - 0.10
      ),

      txt(
        'TOTAL = 7/3',
        CX,
        y - 0.48,
        C.green, 18, true
      )
    );
  }

  const welchEquality = equalityBar(
    WELCH_WA,
    WELCH_WC,
    EQWY,
    'WELCH: SEPARATE VARIANCES',
    '2/3',
    '5/3'
  );

  const pooledEquality = equalityBar(
    WA,
    WC,
    EQPY,
    'POOLED: ONE SHARED VARIANCE',
    '7/6',
    '7/6'
  );

  const equalityLeft = dashed(
    eqLeft,
    EQPY - 0.32,
    eqLeft,
    EQWY + 0.32,
    C.green
  );

  const equalityRight = dashed(
    eqLeft + equalityWidth,
    EQPY - 0.32,
    eqLeft + equalityWidth,
    EQWY + 0.32,
    C.green
  );

  const equalSizesTag = tag(
    '4 BATTERIES EACH',
    CX,
    (EQWY + EQPY) / 2,
    C.green, 16
  );

  await until(S(25));
  await play(
    ...replace(
      welchEquality,
      pooledEquality,
      equalityLeft,
      equalityRight,
      equalSizesTag
    ),
    ...fbox([
      'equal group sizes: 4 and 4',
      'both squared SEs = 7/3',
      ['therefore the same t', C.green]
    ], C.green),
    ...say('EQUAL GROUP SIZES GIVE THE SAME t', C.green)
  );

  // ------------------------------------------------------------
  // STUDENT t REFERENCE CURVES
  //
  // Pooled df = 6.
  // Welch df ≈ 5.07.
  //
  // Both tests have the same observed t statistic.
  // Different df give different reference distributions.
  //
  // Gamma uses the Lanczos approximation.
  // Curves use ordinary Line objects.
  // ------------------------------------------------------------

  function gamma(z) {
    const coefficients = [
      676.5203681218851,
      -1259.1392167224028,
      771.3234287776531,
      -176.6150291621406,
      12.507343278686905,
      -0.13857109526572012,
      9.984369578019572e-6,
      1.5056327351493116e-7
    ];

    if (z < 0.5) {
      return Math.PI /
        (
          Math.sin(Math.PI * z) *
          gamma(1 - z)
        );
    }

    z -= 1;

    let x = 0.9999999999998099;

    for (
      let k = 0;
      k < coefficients.length;
      k++
    ) {
      x += coefficients[k] / (z + k + 1);
    }

    const t =
      z + coefficients.length - 0.5;

    return Math.sqrt(2 * Math.PI) *
      Math.pow(t, z + 0.5) *
      Math.exp(-t) *
      x;
  }

  function studentPDF(v, df) {
    const coefficient =
      gamma((df + 1) / 2) /
      (
        Math.sqrt(df * Math.PI) *
        gamma(df / 2)
      );

    return coefficient *
      Math.pow(
        1 + v * v / df,
        -(df + 1) / 2
      );
  }

  const TXMIN = -7;
  const TXMAX = 7;

  const TW = P ? 6.45 : 6.8;

  const TY = P ? -3.10 : -1.64;
  const TH = P ? 7.20 : 6.0;

  const tx = v =>
    CX - TW / 2 +
    (v - TXMIN) / (TXMAX - TXMIN) * TW;

  const ty = (v, df) =>
    TY + studentPDF(v, df) * TH;

  function tAxis() {
    const parts = [
      line(
        tx(TXMIN), TY,
        tx(TXMAX), TY,
        C.muted, 2.5
      )
    ];

    for (let v = -6; v <= 6; v += 2) {
      parts.push(
        line(
          tx(v), TY - 0.07,
          tx(v), TY + 0.07,
          C.muted, 1.5
        ),

        txt(
          v < 0
            ? `−${Math.abs(v)}`
            : String(v),
          tx(v),
          TY - 0.30,
          C.muted, 16, true
        )
      );
    }

    parts.push(
      txt(
        't',
        tx(TXMAX) - 0.06,
        TY - 0.64,
        C.muted, 17, true
      )
    );

    return new M.VGroup(...parts);
  }

  function tCurve(
    df,
    color,
    strokeWidth = 3,
    samples = 132
  ) {
    const parts = [];

    for (let k = 0; k < samples; k++) {
      const a =
        TXMIN +
        (TXMAX - TXMIN) * k / samples;

      const b =
        TXMIN +
        (TXMAX - TXMIN) * (k + 1) / samples;

      parts.push(
        line(
          tx(a), ty(a, df),
          tx(b), ty(b, df),
          color,
          strokeWidth
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function tailArea(
    a, b,
    df,
    color,
    opacity = 0.72,
    samples = 50
  ) {
    const parts = [];

    const dx = (b - a) / samples;

    for (let k = 0; k < samples; k++) {
      const lo = a + k * dx;
      const hi = lo + dx;
      const mid = (lo + hi) / 2;

      const h = Math.max(
        0.001,
        studentPDF(mid, df) * TH
      );

      parts.push(
        rect(
          tx(mid),
          TY + h / 2,
          tx(hi) - tx(lo) + 0.001,
          h,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bothTails(
    cutoff,
    df,
    color
  ) {
    return new M.VGroup(
      tailArea(
        TXMIN,
        -cutoff,
        df,
        color
      ),

      tailArea(
        cutoff,
        TXMAX,
        df,
        color
      )
    );
  }

  // ------------------------------------------------------------
  // 26: DIFFERENT DEGREES OF FREEDOM
  // ------------------------------------------------------------

  const referenceAxis = tAxis();

  const welchCurve = tCurve(
    WELCH_DF,
    BLUE,
    2.1
  );

  const pooledCurve = tCurve(
    DF,
    POOL,
    3.2
  );

  const welchCurveLabel = tag(
    'WELCH df ≈ 5.07',
    CX - 1.75,
    TY + 1.73,
    BLUE, 15,
    2.85
  );

  const pooledCurveLabel = tag(
    'POOLED df = 6',
    CX + 1.75,
    TY + 1.73,
    POOL, 15,
    2.85
  );

  const observedTLine = dashed(
    tx(TSTAT), TY,
    tx(TSTAT), TY + 0.83,
    C.amber
  );

  const observedTLabel = txt(
    '3.93',
    tx(TSTAT),
    TY + 1.04,
    C.amber, 18, true
  );

  await until(S(26));
  await play(
    ...replace(
      referenceAxis,
      welchCurve,
      pooledCurve,
      welchCurveLabel,
      pooledCurveLabel,
      observedTLine,
      observedTLabel
    ),
    ...fbox([
      ['Welch df ≈ 5.07', BLUE],
      ['pooled df = 6', POOL],
      'different reference curves'
    ], POOL),
    ...say('WHAT CHANGES IS THE DEGREES OF FREEDOM', POOL)
  );

  // ------------------------------------------------------------
  // 27: THE POOLED p-VALUE IS A LITTLE SMALLER
  //
  // Both tails count in the two-sided test.
  // The visible graph truncates the infinite tails at ±7.
  // Numerical p-values refer to the full distributions.
  // ------------------------------------------------------------

  const pooledShade = bothTails(
    TSTAT,
    DF,
    POOL
  );

  const leftBoundary = dashed(
    tx(-TSTAT), TY,
    tx(-TSTAT), TY + 0.83,
    POOL
  );

  const leftTLabel = txt(
    '−3.93',
    tx(-TSTAT),
    TY + 1.04,
    POOL, 18, true
  );

  const observedTDot = dot(
    tx(TSTAT),
    TY,
    C.amber,
    0.11
  );

  const tailLabelLeft = txt(
    '≈ 0.39%',
    tx(-5.17),
    TY + 0.42,
    POOL, 15, true
  );

  const tailLabelRight = txt(
    '≈ 0.39%',
    tx(5.17),
    TY + 0.42,
    POOL, 15, true
  );

  const pTag = tag(
    'p ≈ 0.77%',
    CX,
    TY + 0.58,
    POOL, 21
  );

  const pComparison = txt(
    'Welch: 1.1%    Pooled: 0.77%',
    CX,
    TY - 0.99,
    C.green, 16, true
  );

  await until(S(27));
  await play(
    ...remove(
      welchCurve,
      welchCurveLabel
    ),
    ...add(
      pooledShade,
      leftBoundary,
      leftTLabel,
      observedTDot,
      tailLabelLeft,
      tailLabelRight,
      pTag,
      pComparison
    ),
    ...fbox([
      ['Welch p ≈ 1.1%', BLUE],
      ['pooled p ≈ 0.77%', POOL],
      'both below 5%'
    ], POOL),
    ...say('POOLED p-VALUE: UNDER ONE PERCENT', POOL)
  );

  // ------------------------------------------------------------
  // 28: THE t FORMULA
  // ------------------------------------------------------------

  const formulaHours = fullHoursPicture(
    true,
    true
  );

  await until(S(28));
  await play(
    ...replace(...formulaHours),
    ...fbox([
      't = (mean C − mean A)',
      '    ÷ standard error',
      ['  = 6 ÷ 1.53 ≈ 3.93', C.amber]
    ]),
    ...say('t = GAP ÷ STANDARD ERROR')
  );

  // ------------------------------------------------------------
  // 29: THE POOLED STANDARD ERROR FORMULA
  //
  // SE = sqrt(vP/nA + vP/nC)
  //    = sqrt(vP × (1/nA + 1/nC)).
  // ------------------------------------------------------------

  const FORM_TOP = P ? 0.54 : 1.08;
  const FORM_MID = P ? -1.12 : -0.15;
  const FORM_BOTTOM = P ? -3.30 : -1.91;

  const formulaSource = tag(
    'SHARED VARIANCE: 4.67',
    CX,
    FORM_TOP,
    POOL, 18
  );

  const formulaA_X = CX - 1.54;
  const formulaC_X = CX + 1.54;

  function formulaBranch(
    x,
    y,
    color,
    group
  ) {
    return new M.VGroup(
      outline(
        x,
        y,
        2.76, 1.18,
        color, 0.055
      ),

      txt(
        group,
        x,
        y + 0.34,
        color, 16
      ),

      txt(
        '4.67 ÷ 4',
        x,
        y - 0.04,
        POOL, 18, true,
        2.48
      ),

      txt(
        '≈ 1.17',
        x,
        y - 0.39,
        color, 17, true
      )
    );
  }

  const formulaBranchA = formulaBranch(
    formulaA_X,
    FORM_MID,
    BLUE,
    'BATCH A'
  );

  const formulaBranchC = formulaBranch(
    formulaC_X,
    FORM_MID,
    PINK,
    'BATCH C'
  );

  const formulaDownA = arrow(
    CX - 0.39,
    FORM_TOP - 0.29,
    formulaA_X,
    FORM_MID + 0.67,
    POOL,
    0.12
  );

  const formulaDownC = arrow(
    CX + 0.39,
    FORM_TOP - 0.29,
    formulaC_X,
    FORM_MID + 0.67,
    POOL,
    0.12
  );

  const formulaPlus = txt(
    '+',
    CX,
    FORM_MID,
    C.amber, 23, true
  );

  const formulaRoot = new M.VGroup(
    outline(
      CX,
      FORM_BOTTOM,
      5.66, 0.88,
      C.green, 0.075
    ),

    txt(
      '√(7/6 + 7/6) ≈ 1.53',
      CX,
      FORM_BOTTOM,
      C.green, 21, true,
      5.40
    )
  );

  const formulaMergeA = arrow(
    formulaA_X,
    FORM_MID - 0.68,
    CX - 0.92,
    FORM_BOTTOM + 0.52,
    C.amber,
    0.12
  );

  const formulaMergeC = arrow(
    formulaC_X,
    FORM_MID - 0.68,
    CX + 0.92,
    FORM_BOTTOM + 0.52,
    C.amber,
    0.12
  );

  await until(S(29));
  await play(
    ...replace(
      formulaSource,
      formulaBranchA,
      formulaBranchC,
      formulaDownA,
      formulaDownC,
      formulaPlus,
      formulaRoot,
      formulaMergeA,
      formulaMergeC
    ),
    ...fbox([
      'SE = √(vP/nA + vP/nC)',
      'vP = pooled variance',
      ['SE ≈ 1.53 hours', C.green]
    ], POOL),
    ...say('USE THE SHARED VARIANCE ONCE PER GROUP', POOL)
  );

  // ------------------------------------------------------------
  // 30: THE FORMULA IN WORDS
  // ------------------------------------------------------------

  const recallRuler = rulerPicture();

  await until(S(30));
  await play(
    ...replace(...recallRuler),
    ...fbox([
      ['observed gap', C.amber],
      'measured using',
      ['one shared spread', POOL]
    ], POOL),
    ...say('THE GAP, MEASURED WITH ONE SHARED SPREAD', POOL)
  );

  // ------------------------------------------------------------
  // 31: WHAT IS IT FOR?
  //
  // Two independent groups.
  // A justified equal-population-variance assumption.
  // ------------------------------------------------------------

  const useY = P ? -0.85 : -0.45;

  function groupCard(
    x,
    y,
    color,
    label
  ) {
    const parts = [
      outline(
        x, y,
        2.73, 2.05,
        color, 0.055
      ),

      txt(
        label,
        x,
        y + 0.65,
        color, 18
      ),

      bracket(
        x - 1.02,
        x + 1.02,
        y - 0.49,
        POOL,
        0.08
      )
    ];

    const deviations = [
      -0.83, -0.30, 0.30, 0.83
    ];

    deviations.forEach(v => {
      parts.push(
        dot(
          x + v,
          y + 0.04,
          color,
          0.12
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const useGroupA = groupCard(
    CX - 1.67,
    useY,
    BLUE,
    'GROUP A'
  );

  const useGroupC = groupCard(
    CX + 1.67,
    useY,
    PINK,
    'GROUP C'
  );

  const useEqual = txt(
    '=',
    CX,
    useY - 0.49,
    POOL, 24, true
  );

  const useAssumptionTag = tag(
    'JUSTIFIED EQUAL-SPREAD ASSUMPTION',
    CX,
    useY - 1.45,
    POOL, 16
  );

  await until(S(31));
  await play(
    ...replace(
      useGroupA,
      useGroupC,
      useEqual,
      useAssumptionTag
    ),
    ...fbox([
      'two independent groups',
      'good reason to assume',
      ['equal true variances', POOL]
    ], POOL),
    ...say('USE ONLY WITH A JUSTIFIED SHARED SPREAD', POOL)
  );

  // ------------------------------------------------------------
  // 32: THE SAME POOLING IDEA LEADS TO ANOVA
  //
  // Introduce batch B from the shared chapter data.
  // A contributes 8, B contributes 8, C contributes 20.
  // Do not calculate the ANOVA test yet.
  // ------------------------------------------------------------

  const B = [18, 20, 20, 22];

  const AMBER = C.amber;

  const anovaTop = P ? 0.65 : 1.02;
  const anovaPotY = P ? -2.32 : -1.30;

  const anovaAX = CX - 2.02;
  const anovaBX = CX;
  const anovaCX = CX + 2.02;

  function batchChip(
    x,
    y,
    color,
    name
  ) {
    return new M.VGroup(
      outline(
        x, y,
        1.70, 0.78,
        color, 0.07
      ),

      txt(
        name,
        x, y,
        color, 18
      )
    );
  }

  const anovaChipA = batchChip(
    anovaAX,
    anovaTop,
    BLUE,
    'BATCH A'
  );

  const anovaChipB = batchChip(
    anovaBX,
    anovaTop,
    AMBER,
    'BATCH B'
  );

  const anovaChipC = batchChip(
    anovaCX,
    anovaTop,
    PINK,
    'BATCH C'
  );

  const anovaPot = outline(
    CX,
    anovaPotY,
    4.95, 1.50,
    POOL, 0.07
  );

  const anovaBlocks = [];

  const anovaValues = [
    [SSA, BLUE],
    [sum(squaredDistances(B)), AMBER],
    [SSC, PINK]
  ];

  let anovaIndex = 0;

  for (const [count, color] of anovaValues) {
    for (let k = 0; k < count; k++) {
      const row = Math.floor(anovaIndex / 12);
      const col = anovaIndex % 12;

      anovaBlocks.push(
        rect(
          CX + (col - 5.5) * 0.31,
          anovaPotY + (1 - row) * 0.31,
          0.25, 0.25,
          color, 0.85
        )
      );

      anovaIndex++;
    }
  }

  const anovaArrowA = arrow(
    anovaAX,
    anovaTop - 0.48,
    CX - 1.42,
    anovaPotY + 0.83,
    BLUE
  );

  const anovaArrowB = arrow(
    anovaBX,
    anovaTop - 0.48,
    CX,
    anovaPotY + 0.83,
    AMBER
  );

  const anovaArrowC = arrow(
    anovaCX,
    anovaTop - 0.48,
    CX + 1.42,
    anovaPotY + 0.83,
    PINK
  );

  const anovaTitle = tag(
    'ANALYSIS OF VARIANCE',
    CX,
    anovaPotY - 1.08,
    POOL, 18
  );

  await until(S(32));
  await play(
    ...replace(
      anovaChipA,
      anovaChipB,
      anovaChipC,
      anovaArrowA,
      anovaArrowB,
      anovaArrowC,
      anovaPot,
      ...anovaBlocks,
      anovaTitle
    ),
    ...fbox([
      'pool spread information',
      'from more than two groups',
      ['coming soon: ANOVA', POOL]
    ], POOL),
    ...say('POOLING IS A KEY IDEA BEHIND ANOVA', POOL)
  );

  // ------------------------------------------------------------
  // 33: COMMON TRAP
  //
  // Illustrative unequal-size, unequal-spread groups.
  // These are schematic groups, not additional chapter data.
  //
  // A small group with a wide spread.
  // A large group with a narrow spread.
  // ------------------------------------------------------------

  const trapTop = P ? 0.25 : 0.60;
  const trapBottom = P ? -2.30 : -1.34;

  function schematicCloud(
    y,
    values,
    color,
    label,
    subtitle
  ) {
    const parts = [
      txt(
        label,
        CX,
        y + 0.70,
        color, 18
      ),

      line(
        CX - 2.75,
        y - 0.17,
        CX + 2.75,
        y - 0.17,
        C.muted, 1.6
      )
    ];

    values.forEach((v, k) => {
      const repeats = values
        .slice(0, k)
        .filter(n => n === v)
        .length;

      parts.push(
        dot(
          CX + v,
          y + 0.08 + repeats * 0.25,
          color,
          0.105
        )
      );
    });

    parts.push(
      txt(
        subtitle,
        CX,
        y - 0.54,
        color, 16
      )
    );

    return new M.VGroup(...parts);
  }

  const smallWideValues = [
    -2.20, -0.80, 0.80, 2.20
  ];

  const largeNarrowValues = [
    -0.90, -0.75, -0.60,
    -0.45, -0.30, -0.15,
    0.15, 0.30, 0.45,
    0.60, 0.75, 0.90
  ];

  const smallWide = schematicCloud(
    trapTop,
    smallWideValues,
    BLUE,
    'SMALL GROUP',
    '4 readings, wide spread'
  );

  const largeNarrow = schematicCloud(
    trapBottom,
    largeNarrowValues,
    PINK,
    'LARGE GROUP',
    '12 readings, narrow spread'
  );

  const schematicNote = txt(
    'illustrative example',
    CX,
    P ? -3.70 : -2.53,
    C.muted, 15
  );

  await until(S(33));
  await play(
    ...replace(
      smallWide,
      largeNarrow,
      schematicNote
    ),
    ...fbox([
      ['dangerous combination', C.amber],
      'different group sizes',
      'and different spreads'
    ], C.amber),
    ...say('TRAP: UNEQUAL SIZES AND UNEQUAL SPREADS', C.amber)
  );

  // ------------------------------------------------------------
  // 34: THE LARGE GROUP CAN DOMINATE THE POOLED ESTIMATE
  //
  // The pooled variance weights each group's variance by its df.
  // For illustrative n = 4 and n = 12:
  // weights are 3 and 11.
  //
  // No new p-value is invented for this illustration.
  // ------------------------------------------------------------

  const weightY = P ? -0.22 : 0.40;

  const weightW = P ? 5.55 : 5.65;
  const weightLeft = CX - weightW / 2;

  const smallWeightW = weightW * 3 / 14;
  const largeWeightW = weightW * 11 / 14;

  const smallWeight = rect(
    weightLeft + smallWeightW / 2,
    weightY,
    smallWeightW,
    0.61,
    BLUE, 0.85
  );

  const largeWeight = rect(
    weightLeft +
      smallWeightW +
      largeWeightW / 2,
    weightY,
    largeWeightW,
    0.61,
    PINK, 0.85
  );

  const smallWeightLabel = txt(
    '3 df',
    weightLeft + smallWeightW / 2,
    weightY,
    C.ink, 17, true,
    smallWeightW - 0.09
  );

  const largeWeightLabel = txt(
    '11 df',
    weightLeft +
      smallWeightW +
      largeWeightW / 2,
    weightY,
    C.ink, 18, true
  );

  const weightTitle = txt(
    'HOW MUCH EACH GROUP COUNTS',
    CX,
    weightY + 0.65,
    C.amber, 18
  );

  const weightCaption = txt(
    'the larger group gets more weight',
    CX,
    weightY - 0.63,
    C.muted, 17
  );

  const riskY = P ? -2.75 : -1.48;

  const riskTag = new M.VGroup(
    outline(
      CX,
      riskY,
      5.70, 1.18,
      C.amber, 0.055
    ),

    txt(
      'MISLEADING STANDARD ERROR',
      CX,
      riskY + 0.31,
      C.amber, 18
    ),

    txt(
      'p-value too small or too large',
      CX,
      riskY - 0.19,
      C.ink, 17
    )
  );

  const riskArrow = arrow(
    CX,
    weightY - 0.94,
    CX,
    riskY + 0.69,
    C.amber
  );

  await until(S(34));
  await play(
    ...replace(
      smallWeight,
      largeWeight,
      smallWeightLabel,
      largeWeightLabel,
      weightTitle,
      weightCaption,
      riskArrow,
      riskTag
    ),
    ...fbox([
      'larger group dominates',
      'shared spread may mislead',
      ['p too small or too large', C.amber]
    ], C.amber),
    ...say('THE LARGE GROUP CAN SWAMP THE SMALL ONE', C.amber)
  );

  // ------------------------------------------------------------
  // 35: WELCH IS THE SAFER EVERYDAY DEFAULT
  //
  // Return to the real A and C example.
  // Keep the separate estimated variances.
  // ------------------------------------------------------------

  const saferVariances = separateVariances();

  const saferTag = tag(
    'NO EQUAL-SPREAD ASSUMPTION',
    CX,
    (VTOP + VBOTTOM) / 2 + 0.08,
    C.green, 16
  );

  await until(S(35));
  await play(
    ...replace(
      ...saferVariances,
      saferTag
    ),
    ...fbox([
      ["Welch's t-test", C.green],
      'keeps separate spreads',
      ['safer everyday default', C.green]
    ], C.green),
    ...say('WELCH DOES NOT REQUIRE EQUAL SPREADS', C.green)
  );

  // ------------------------------------------------------------
  // 36: ONE-SENTENCE SUMMARY
  //
  // Two separate groups contribute to one pooled variance.
  // That shared variance supplies both standard-error terms.
  // The equal-spread assumption is essential.
  // ------------------------------------------------------------

  const finalTopY = P ? 0.48 : 0.93;
  const finalMiddleY = P ? -1.15 : -0.45;
  const finalBottomY = P ? -3.35 : -2.05;

  function finalContribution(
    x,
    color,
    label,
    value
  ) {
    return new M.VGroup(
      outline(
        x,
        finalTopY,
        2.77, 1.04,
        color, 0.07
      ),

      txt(
        label,
        x,
        finalTopY + 0.25,
        color, 17
      ),

      txt(
        value,
        x,
        finalTopY - 0.15,
        color, 20, true
      )
    );
  }

  const finalA = finalContribution(
    CX - 1.62,
    BLUE,
    'BATCH A',
    '8 squared hours'
  );

  const finalC = finalContribution(
    CX + 1.62,
    PINK,
    'BATCH C',
    '20 squared hours'
  );

  const finalArrowA = arrow(
    CX - 1.62,
    finalTopY - 0.59,
    CX - 1.04,
    finalMiddleY + 0.60,
    BLUE,
    0.12
  );

  const finalArrowC = arrow(
    CX + 1.62,
    finalTopY - 0.59,
    CX + 1.04,
    finalMiddleY + 0.60,
    PINK,
    0.12
  );

  const finalPool = new M.VGroup(
    outline(
      CX,
      finalMiddleY,
      5.66, 1.02,
      POOL, 0.10
    ),

    txt(
      'ONE POOLED VARIANCE',
      CX,
      finalMiddleY + 0.26,
      POOL, 18
    ),

    txt(
      '(8 + 20) ÷ 6 ≈ 4.67',
      CX,
      finalMiddleY - 0.19,
      POOL, 20, true,
      5.30
    )
  );

  const finalDown = arrow(
    CX,
    finalMiddleY - 0.58,
    CX,
    finalBottomY + 0.66,
    POOL,
    0.12
  );

  const finalResult = new M.VGroup(
    outline(
      CX,
      finalBottomY,
      5.66, P ? 1.42 : 1.25,
      C.green, 0.075
    ),

    txt(
      'SE ≈ 1.53 HOURS',
      CX,
      finalBottomY + (P ? 0.42 : 0.34),
      C.green, 18, true
    ),

    txt(
      't ≈ 3.93    p ≈ 0.77%',
      CX,
      finalBottomY - (P ? 0.02 : 0.06),
      C.green, 19, true
    ),

    txt(
      'df = 6',
      CX,
      finalBottomY - (P ? 0.44 : 0.38),
      P ? C.ink : C.muted, P ? 18 : 16, true
    )
  );

  await until(S(36));
  await play(
    ...replace(
      finalA,
      finalC,
      finalArrowA,
      finalArrowC,
      finalPool,
      finalDown,
      finalResult
    ),
    ...fbox([
      'assume equal true spreads',
      ['build one pooled variance', POOL],
      ['test the gap using it', C.green]
    ], POOL),
    ...say('TWO GROUPS. ONE SHARED SPREAD.', POOL)
  );

  await until(E(36));

  // All sentence beats 0–36 are included.
  // All shared chapter calculations retain full precision internally.
  // The unequal-size trap uses explicitly illustrative groups.
  // Uses the supplied engine interface and reference conventions.
  // Browser rendering and narration synchronization have not
  // been runtime-tested against the actual engine installation.
}

// lesson 7.2.3
// Welch's t-test: compare two separate groups with different spreads.
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
  // Batch A and batch C contain different physical batteries.
  // ------------------------------------------------------------

  const A = [15, 17, 17, 19];
  const BATCH_C = [20, 22, 24, 26];

  const BLUE = C.cyan;
  const PINK = C.pink || '#f472b6';

  const mean = a =>
    a.reduce((s, v) => s + v, 0) / a.length;

  const variance = a => {
    const m = mean(a);

    return a.reduce(
      (s, v) => s + (v - m) ** 2,
      0
    ) / (a.length - 1);
  };

  const NA = A.length;
  const NC = BATCH_C.length;

  const MA = mean(A);
  const MC = mean(BATCH_C);

  const VA = variance(A);
  const VC = variance(BATCH_C);

  const WA = VA / NA;
  const WC = VC / NC;

  const GAP = MC - MA;
  const SE2 = WA + WC;
  const SE = Math.sqrt(SE2);

  const TSTAT = GAP / SE;

  const DF =
    SE2 ** 2 /
    (
      WA ** 2 / (NA - 1) +
      WC ** 2 / (NC - 1)
    );

  const PVALUE = 0.011;

  // A: mean = 17, variance = 8/3.
  // C: mean = 23, variance = 20/3.
  // Gap = 6.
  // Squared SE contributions = 2/3 and 5/3.
  // Combined squared SE = 7/3.
  // SE ≈ 1.53.
  // t ≈ 3.93, df ≈ 5.07, two-sided p ≈ 0.011.
  //
  // All calculations use full precision internally.

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, -6.55, 0]  // phone: bottom edge of the card
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.4 : 6.8;

  const say = (s, c = BLUE) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Same construction as the approved arithmetic-mean lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = BLUE) {
    const big4 = P && lines.length >= 4;
    const size = P ? (big4 ? 20 : 22) : 21;
    const lh = P ? (big4 ? 0.39 : 0.44) : 0.42;

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
    x, y, width, height,
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
    x, y, width, height,
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
        x1, y1, x2, y2,
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

  // Track top-level objects currently on screen.
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
    const a = picture.map(o => new M.FadeOut(o));

    picture = objects.slice();

    return [
      ...a,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  // ------------------------------------------------------------
  // BATTERY ICONS
  // Batch A = cyan. Batch C = pink.
  // ------------------------------------------------------------

  function battery(
    x, y,
    color = BLUE,
    width = 0.64,
    height = 1.02,
    charge = 1
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

    const parts = [shell, cap];

    const ih = height - 0.18;
    const iw = width - 0.16;

    if (charge > 0) {
      const h = ih * charge;

      parts.push(
        rect(
          x,
          y - ih / 2 + h / 2,
          iw + 0.04,
          h,
          color, 0.14, 0
        ),

        rect(
          x,
          y - ih / 2 + h / 2,
          iw,
          h,
          color, 0.83, 0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function factory(x, y, color = BLUE) {
    const parts = [
      rect(
        x, y - 0.14,
        1.62, 1.05,
        color, 0.11, 2
      ),

      rect(
        x - 0.54,
        y + 0.64,
        0.25, 0.63,
        color, 0.20, 2
      ),

      line(
        x - 0.81, y + 0.39,
        x - 0.31, y + 0.76,
        color, 2.5
      ),

      line(
        x - 0.31, y + 0.76,
        x - 0.31, y + 0.39,
        color, 2.5
      ),

      line(
        x - 0.31, y + 0.39,
        x + 0.22, y + 0.76,
        color, 2.5
      ),

      line(
        x + 0.22, y + 0.76,
        x + 0.22, y + 0.39,
        color, 2.5
      ),

      line(
        x + 0.22, y + 0.39,
        x + 0.81, y + 0.39,
        color, 2.5
      )
    ];

    for (let k = 0; k < 3; k++) {
      parts.push(
        rect(
          x + (k - 1) * 0.45,
          y + 0.03,
          0.23, 0.25,
          color, 0.65
        )
      );
    }

    parts.push(
      rect(
        x,
        y - 0.43,
        0.32, 0.44,
        color, 0.22
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0-1: TWO DIFFERENT FACTORY BATCHES
  // ------------------------------------------------------------

  const factoryY = P ? -1.2 : -0.30;
  const FK = P ? 1.45 : 1;

  const factoryAX = CX - 1.73;
  const factoryCX = CX + 1.73;

  const factoryA = factory(
    factoryAX, factoryY, BLUE
  );

  const factoryC = factory(
    factoryCX, factoryY, PINK
  );

  if (P) { factoryA.scale(FK); factoryC.scale(FK); }

  const factoryALabel = tag(
    'BATCH A',
    factoryAX,
    factoryY - 1.12 * FK,
    BLUE, 18
  );

  const factoryCLabel = tag(
    'BATCH C',
    factoryCX,
    factoryY - 1.12 * FK,
    PINK, 18
  );

  await until(S(0));
  await play(
    ...add(factoryA, factoryC),
    ...(P ? fbox([
      'the lab compares',
      ['two different batches', C.cyan]
    ]) : []),
    ...say('NOW COMPARE TWO DIFFERENT BATCHES')
  );

  await until(S(1));
  await play(
    ...add(factoryALabel, factoryCLabel),
    ...fbox([
      ['batch A: familiar batch', BLUE],
      ['batch C: new batch', PINK],
      'different production lines'
    ]),
    ...say('BATCH A AND BATCH C')
  );

  // ------------------------------------------------------------
  // 2: TWO SEPARATE GROUPS, NO MATCHED PAIRS
  // ------------------------------------------------------------

  const groupAY = P ? 0.05 : 0.48;
  const groupCY = P ? -2.48 : -1.47;

  const bx = k =>
    CX + (k - 1.5) * (P ? 1.28 : 1.32);

  function batteryGroup(
    values, y, color, name
  ) {
    const parts = [
      outline(
        CX, y,
        5.75, 1.58,
        color, 0.025
      ),

      tag(
        name,
        CX,
        y + 0.98,
        color, 17
      )
    ];

    values.forEach((_, k) => {
      parts.push(
        battery(
          bx(k), y,
          color,
          0.58, 0.92
        )
      );
    });

    return parts;
  }

  const groupA = batteryGroup(
    A, groupAY, BLUE, 'BATCH A'
  );

  const groupC = batteryGroup(
    BATCH_C, groupCY, PINK, 'BATCH C'
  );

  const separateLabel = txt(
    'DIFFERENT BATTERIES — NO PAIRS',
    CX,
    P ? -4.02 : -2.65,
    C.violet, 16
  );

  await until(S(2));
  await play(
    ...replace(
      ...groupA,
      ...groupC,
      separateLabel
    ),
    ...fbox([
      'four batteries in A',
      'four other batteries in C',
      ['independent groups', C.violet]
    ], C.violet),
    ...say('NO BATTERY BELONGS TO BOTH GROUPS', C.violet)
  );

  // ------------------------------------------------------------
  // 3-4: REVEAL THE MEASURED BATTERY HOURS
  // Vertical bar height represents battery life.
  // Both batches use the same height scale.
  // ------------------------------------------------------------

  const BAR_BASE = P ? -3.85 : -2.30;
  const BAR_SCALE = P ? 0.145 : 0.108;

  const BAR_WIDTH = P ? 0.53 : 0.55;
  const BAR_PITCH = P ? 0.66 : 0.69;

  const barAX = CX - 1.72;
  const barCX = CX + 1.72;

  const barX = (center, k) =>
    center + (k - 1.5) * BAR_PITCH;

  function batteryBar(
    x, v,
    color = BLUE
  ) {
    const h = v * BAR_SCALE;

    return new M.VGroup(
      rect(
        x,
        BAR_BASE + h / 2,
        BAR_WIDTH + 0.09,
        h + 0.05,
        color, 0.13, 0
      ),

      rect(
        x,
        BAR_BASE + h / 2,
        BAR_WIDTH,
        h,
        color, 0.80
      ),

      txt(
        String(v),
        x,
        BAR_BASE + h + 0.28,
        color,
        P ? 17 : 17,
        true,
        BAR_PITCH
      )
    );
  }

  const barFloor = line(
    CX - 3.15, BAR_BASE,
    CX + 3.15, BAR_BASE,
    C.muted, 2.5
  );

  const barUnits = txt(
    'hours',
    CX,
    BAR_BASE - 0.58,
    C.muted, 16
  );

  const barLabelA = txt(
    'BATCH A',
    barAX,
    BAR_BASE - 0.27,
    BLUE, 17
  );

  const barLabelC = txt(
    'BATCH C',
    barCX,
    BAR_BASE - 0.27,
    PINK, 17
  );

  const barsA = A.map((v, k) =>
    batteryBar(
      barX(barAX, k),
      v,
      BLUE
    )
  );

  const barsC = BATCH_C.map((v, k) =>
    batteryBar(
      barX(barCX, k),
      v,
      PINK
    )
  );

  await until(S(3));
  await play(
    ...replace(
      barFloor,
      barUnits,
      barLabelA,
      barLabelC,
      ...barsA
    ),
    ...fbox([
      ['batch A', BLUE],
      '15, 17, 17, 19 hours'
    ], BLUE),
    ...say('BATCH A: 15, 17, 17, 19', BLUE)
  );

  await until(S(4));

  picture.push(...barsC);

  await play(
    new M.LaggedStart(
      barsC.map(b => new M.FadeIn(b)),
      {
        lagRatio: 0.18,
        runTime: 1.5
      }
    ),
    ...fbox([
      ['batch A: 15, 17, 17, 19', BLUE],
      ['batch C: 20, 22, 24, 26', PINK]
    ]),
    ...say('BATCH C: 20, 22, 24, 26', PINK)
  );

  // ------------------------------------------------------------
  // SHARED HOURS NUMBER LINE
  // Both groups use exactly the same horizontal scale.
  // ------------------------------------------------------------

  const HMIN = 14;
  const HMAX = 27;

  const HW = P ? 6.0 : 6.9;
  const HY = P ? -2.65 : -1.67;

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
            hx(v), HY - 0.30,
            C.muted, 16, true,
            0.47
          )
        );
      }
    }

    parts.push(
      txt(
        'hours',
        hx(HMAX) - 0.15,
        HY - 0.70,
        C.muted, 15
      )
    );

    return new M.VGroup(...parts);
  }

  function hourDots(values, color) {
    return values.map((v, k) => {
      const repeats = values
        .slice(0, k)
        .filter(x => x === v)
        .length;

      return dot(
        hx(v),
        HY + 0.38 + repeats * 0.43,
        color,
        P ? 0.12 : 0.115
      );
    });
  }

  function hoursMean(
    v, color, label
  ) {
    return new M.VGroup(
      dashed(
        hx(v), HY + 0.08,
        hx(v), HY + 1.05,
        color
      ),

      line(
        hx(v), HY - 0.49,
        hx(v), HY - 0.68,
        color, 3
      ),

      tag(
        label,
        hx(v),
        HY - 0.95,
        color, 16,
        2.6
      )
    );
  }

  function hoursGap() {
    return new M.VGroup(
      arrow(
        hx(MA), HY + 1.42,
        hx(MC), HY + 1.42,
        C.amber
      ),

      txt(
        '6 HOURS',
        (hx(MA) + hx(MC)) / 2,
        HY + 1.76,
        C.amber, 21, true
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
  // 5: BOTH BATCHES ON THE SAME HOURS LINE
  // ------------------------------------------------------------

  const axis = hoursAxis();

  const dotsA = hourDots(A, BLUE);
  const dotsC = hourDots(BATCH_C, PINK);

  const legendA = tag(
    'BATCH A',
    hx(MA),
    HY + 1.40,
    BLUE, 16
  );

  const legendC = tag(
    'BATCH C',
    hx(MC),
    HY + 1.40,
    PINK, 16
  );

  await until(S(5));
  await play(
    ...replace(
      axis,
      ...dotsA,
      ...dotsC,
      legendA,
      legendC
    ),
    ...clearBox(),
    ...say('SAME HOURS LINE, TWO SEPARATE GROUPS')
  );

  // ------------------------------------------------------------
  // 6: THE TWO MEANS
  // Batch C sits farther right.
  // ------------------------------------------------------------

  const meanA = hoursMean(
    MA, BLUE, 'A MEAN: 17'
  );

  const meanC = hoursMean(
    MC, PINK, 'C MEAN: 23'
  );

  await until(S(6));
  await play(
    ...add(meanA, meanC),
    ...fbox([
      ['A mean = 17 hours', BLUE],
      ['C mean = 23 hours', PINK]
    ]),
    ...say('THE PINK GROUP LASTS LONGER', PINK)
  );

  // ------------------------------------------------------------
  // 7: GAP BETWEEN THE TWO MEANS = SIX HOURS
  // ------------------------------------------------------------

  const observedGap = hoursGap();

  await until(S(7));
  await play(
    ...remove(legendA, legendC),
    ...add(observedGap),
    ...fbox([
      'gap = C mean − A mean',
      ['23 − 17 = 6 hours', C.amber]
    ], C.amber),
    ...say('THE MEANS ARE SIX HOURS APART', C.amber)
  );

  // ------------------------------------------------------------
  // 8: BATCH C ALSO SPREADS MORE
  // ------------------------------------------------------------

  const spreadAY = HY + 1.21;
  const spreadCY = HY + 1.21;

  const spreadA = bracket(
    hx(15), hx(19),
    spreadAY,
    BLUE
  );

  const spreadC = bracket(
    hx(20), hx(26),
    spreadCY,
    PINK
  );

  const spreadALabel = txt(
    '4 h range',
    (hx(15) + hx(19)) / 2,
    spreadAY + 0.30,
    BLUE, 16, true
  );

  const spreadCLabel = txt(
    '6 h range',
    (hx(20) + hx(26)) / 2,
    spreadCY + 0.30,
    PINK, 16, true
  );

  await until(S(8));
  await play(
    ...remove(observedGap),
    ...add(
      spreadA,
      spreadC,
      spreadALabel,
      spreadCLabel
    ),
    ...fbox([
      ['A: 15 to 19', BLUE],
      ['C: 20 to 26', PINK],
      'C spreads more'
    ]),
    ...say('DIFFERENT MEANS, DIFFERENT SPREADS', PINK)
  );

  // ------------------------------------------------------------
  // 9: REAL GAP OR JUST CHANCE?
  // ------------------------------------------------------------

  const gapAgain = hoursGap();

  await until(S(9));
  await play(
    ...remove(
      spreadA,
      spreadC,
      spreadALabel,
      spreadCLabel
    ),
    ...add(gapAgain),
    ...fbox([
      ['observed gap = 6 hours', C.amber],
      'real difference',
      ['or just chance?', C.violet]
    ], C.violet),
    ...say('COULD EQUAL BATCHES GIVE THIS GAP?', C.violet)
  );

  // ------------------------------------------------------------
  // 10: THE NULL HYPOTHESIS
  // Both true population means are equal.
  // This is an illustrative null picture, not new data.
  // ------------------------------------------------------------

  const nullAxisY = P ? -2.45 : -1.70;

  const nullAX = CX - 2.80;
  const nullBX = CX + 2.80;

  const commonX = CX;

  const nullGroupAY = P ? -0.55 : 0.34;
  const nullGroupCY = P ? -1.45 : -0.56;

  function nullGroup(
    values, m, y, color
  ) {
    const scale = 0.55;

    return values.map((v, k) => {
      const repeats = values
        .slice(0, k)
        .filter(x => x === v)
        .length;

      return dot(
        commonX + (v - m) * scale,
        y + repeats * 0.27,
        color, 0.12
      );
    });
  }

  const nullPicture = [
    line(
      nullAX, nullAxisY,
      nullBX, nullAxisY,
      C.muted, 2
    ),

    dashed(
      commonX, nullAxisY,
      commonX, nullGroupAY + 0.56,
      C.violet
    ),

    ...nullGroup(
      A, MA, nullGroupAY, BLUE
    ),

    ...nullGroup(
      BATCH_C, MC, nullGroupCY, PINK
    ),

    txt(
      'A',
      CX - 2.25,
      nullGroupAY,
      BLUE, 19, true
    ),

    txt(
      'C',
      CX - 2.25,
      nullGroupCY,
      PINK, 19, true
    ),

    tag(
      'SAME TRUE MEAN',
      CX,
      nullAxisY - 0.43,
      C.violet, 17
    ),

    txt(
      'illustration under the null',
      CX,
      P ? 0.76 : 1.13,
      C.muted, 15
    )
  ];

  await until(S(10));
  await play(
    ...replace(...nullPicture),
    ...fbox([
      ['null hypothesis', C.violet],
      'true mean A = true mean C',
      'true gap = 0'
    ], C.violet),
    ...say('ASSUME BOTH TRUE MEANS ARE EQUAL', C.violet)
  );

  // ------------------------------------------------------------
  // 11: TWO SAMPLE MEANS CAN WOBBLE
  //
  // The mean markers move independently.
  // Motion is illustrative, not a simulation of new readings.
  // ------------------------------------------------------------

  const wobbleAY = P ? -0.30 : 0.32;
  const wobbleCY = P ? -2.25 : -1.45;

  const wobbleScale = P ? 1.45 : 1.30;

  function wobbleLane(
    y, amount, color, label
  ) {
    const wd = amount * wobbleScale;

    return new M.VGroup(
      line(
        CX - 2.7, y,
        CX + 2.7, y,
        C.muted, 1.5
      ),

      rect(
        CX, y,
        wd * 2,
        0.43,
        color, 0.16, 0
      ),

      bracket(
        CX - wd,
        CX + wd,
        y,
        color, 0.15
      ),

      txt(
        label,
        CX,
        y + 0.61,
        color, 18
      )
    );
  }

  const wobbleLaneA = wobbleLane(
    wobbleAY,
    Math.sqrt(WA),
    BLUE,
    'BATCH A MEAN'
  );

  const wobbleLaneC = wobbleLane(
    wobbleCY,
    Math.sqrt(WC),
    PINK,
    'BATCH C MEAN'
  );

  const wobbleDotA = dot(
    CX,
    wobbleAY,
    BLUE, 0.17
  );

  const wobbleDotC = dot(
    CX,
    wobbleCY,
    PINK, 0.17
  );

  await until(S(11));
  await play(
    ...replace(
      wobbleLaneA,
      wobbleLaneC,
      wobbleDotA,
      wobbleDotC
    ),
    ...fbox([
      'one mean can wobble',
      ['A mean wobbles', BLUE],
      ['C mean wobbles too', PINK]
    ]),
    ...say('NOW TWO MEANS CAN WOBBLE')
  );

  await play(
    new M.Transform(
      wobbleDotA,
      dot(
        CX - 0.52,
        wobbleAY,
        BLUE, 0.17
      ),
      { runTime: 0.65 }
    ),

    new M.Transform(
      wobbleDotC,
      dot(
        CX + 0.94,
        wobbleCY,
        PINK, 0.17
      ),
      { runTime: 0.65 }
    )
  );

  await play(
    new M.Transform(
      wobbleDotA,
      dot(
        CX + 0.35,
        wobbleAY,
        BLUE, 0.17
      ),
      { runTime: 0.65 }
    ),

    new M.Transform(
      wobbleDotC,
      dot(
        CX - 0.71,
        wobbleCY,
        PINK, 0.17
      ),
      { runTime: 0.65 }
    )
  );

  // ------------------------------------------------------------
  // CENTERED SPREAD PICTURE
  // Show each group's readings relative to its own mean.
  // Both groups use the same scale.
  // ------------------------------------------------------------

  const REL_Y = P ? -0.60 : 0.10;
  const REL_W = P ? 5.8 : 6.0;

  const relx = d =>
    CX + d / 4 * REL_W / 2;

  function relativeAxis(color) {
    const parts = [
      line(
        relx(-4), REL_Y,
        relx(4), REL_Y,
        C.muted, 2.5
      ),

      dashed(
        CX, REL_Y - 0.10,
        CX, REL_Y + 1.0,
        color
      )
    ];

    for (let v = -4; v <= 4; v++) {
      parts.push(
        line(
          relx(v), REL_Y - 0.07,
          relx(v), REL_Y + 0.07,
          C.muted
        ),

        txt(
          v < 0
            ? `−${Math.abs(v)}`
            : v > 0
              ? `+${v}`
              : '0',
          relx(v),
          REL_Y - 0.31,
          v === 0 ? color : C.muted,
          16, true,
          0.65
        )
      );
    }

    parts.push(
      txt(
        'distance from own mean',
        CX,
        REL_Y - 0.69,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function relativeDots(
    values, m, color
  ) {
    return values.map((v, k) => {
      const repeats = values
        .slice(0, k)
        .filter(x => x === v)
        .length;

      return dot(
        relx(v - m),
        REL_Y + 0.33 + repeats * 0.34,
        color, 0.12
      );
    });
  }

  const squareY = P ? -2.75 : -1.49;
  const squarePitch = P ? 1.22 : 1.26;

  function squaredTile(
    deviation, k, color
  ) {
    const x =
      CX + (k - 1.5) * squarePitch;

    const value = deviation ** 2;

    const label = deviation < 0
      ? `(−${Math.abs(deviation)})²`
      : `(${deviation})²`;

    return new M.VGroup(
      outline(
        x,
        squareY,
        1.05, 0.98,
        color, 0.10
      ),

      txt(
        label,
        x,
        squareY + 0.24,
        C.muted, 15, true,
        0.97
      ),

      txt(
        String(value),
        x,
        squareY - 0.15,
        color, 24, true
      )
    );
  }

  // ------------------------------------------------------------
  // 12: STEP ONE — BATCH A'S MEAN WOBBLE
  // ------------------------------------------------------------

  const relativeAxisA = relativeAxis(BLUE);

  const relativeDotsA = relativeDots(
    A, MA, BLUE
  );

  const relativeTitleA = tag(
    'BATCH A: MEAN 17',
    CX,
    P ? 0.72 : 1.18,
    BLUE, 18
  );

  await until(S(12));
  await play(
    ...replace(
      relativeAxisA,
      ...relativeDotsA,
      relativeTitleA
    ),
    ...fbox([
      ['step 1: batch A', BLUE],
      'how much does its',
      'mean wobble?'
    ], BLUE),
    ...say('STEP 1: BATCH A', BLUE)
  );

  // ------------------------------------------------------------
  // 13: BATCH A'S VARIANCE
  // Deviations: -2, 0, 0, +2.
  // Squared deviations: 4, 0, 0, 4.
  // Variance: 8 / 3.
  // ------------------------------------------------------------

  const deviationsA = A.map(v => v - MA);

  const squaresA = deviationsA.map((d, k) =>
    squaredTile(d, k, BLUE)
  );

  const sumA = txt(
    '4 + 0 + 0 + 4 = 8',
    CX,
    squareY - 0.77,
    BLUE, 19, true
  );

  const divA = txt(
    '8 ÷ (4 − 1) ≈ 2.67',
    CX,
    squareY - 1.20,
    BLUE, 18, true
  );

  await until(S(13));

  picture.push(...squaresA, sumA, divA);

  await play(
    new M.LaggedStart(
      squaresA.map(o => new M.FadeIn(o)),
      {
        lagRatio: 0.18,
        runTime: 1.5
      }
    ),
    new M.FadeIn(sumA),
    new M.FadeIn(divA),
    ...fbox([
      'squared distances = 8',
      'divide by 4 − 1 = 3',
      ['variance A = 8/3 ≈ 2.67', BLUE]
    ], BLUE),
    ...say('VARIANCE: SQUARED DISTANCES ÷ 3', BLUE)
  );

  // ------------------------------------------------------------
  // VARIANCE CONTRIBUTIONS
  //
  // Use the same scale for A and C throughout:
  // bar length represents variance in hours squared.
  // Dividing by four makes the bar one quarter as long.
  // ------------------------------------------------------------

  const VAR_SCALE = P ? 0.82 : 0.86;

  const VAR_LEFT = CX - 2.85;

  const VAR_TOP = P ? 0.0 : 0.40;
  const VAR_BOTTOM = P ? -2.35 : -1.45;

  function varianceBar(
    value,
    y,
    color,
    title,
    valueText,
    start = VAR_LEFT
  ) {
    const width = value * VAR_SCALE;

    return new M.VGroup(
      rect(
        start + width / 2,
        y,
        width + 0.055,
        0.52,
        color, 0.12, 0
      ),

      rect(
        start + width / 2,
        y,
        width,
        0.38,
        color, 0.84
      ),

      txt(
        title,
        CX,
        y + 0.59,
        color, 18
      ),

      txt(
        valueText,
        CX,
        y - 0.46,
        color, 20, true
      )
    );
  }

  function dividedVariance(
    value, y, color
  ) {
    const totalWidth = value * VAR_SCALE;
    const pieceWidth = totalWidth / 4;

    const parts = [];

    for (let k = 0; k < 4; k++) {
      const x =
        VAR_LEFT + (k + 0.5) * pieceWidth;

      parts.push(
        rect(
          x, y,
          Math.max(0.025, pieceWidth - 0.025),
          0.38,
          color,
          k === 0 ? 0.90 : 0.17
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 14: VARIANCE A DIVIDED BY FOUR
  // This is the squared standard error, not the SE itself.
  // ------------------------------------------------------------

  const varianceAFull = varianceBar(
    VA,
    VAR_TOP,
    BLUE,
    'BATTERY VARIANCE A',
    '2.67 hours²'
  );

  const varianceADivided = dividedVariance(
    VA,
    VAR_BOTTOM,
    BLUE
  );

  const divisionLabelA = tag(
    '÷ 4 BATTERIES',
    CX,
    (VAR_TOP + VAR_BOTTOM) / 2,
    C.amber, 17
  );

  const contributionLabelA = txt(
    'SE² OF A MEAN ≈ 0.67',
    CX,
    VAR_BOTTOM + 0.56,
    BLUE, 17
  );

  const contributionValueA = txt(
    '0.67 hours²',
    CX,
    VAR_BOTTOM - 0.48,
    BLUE, 20, true
  );

  await until(S(14));
  await play(
    ...replace(
      varianceAFull,
      varianceADivided,
      divisionLabelA,
      contributionLabelA,
      contributionValueA
    ),
    ...fbox([
      'variance A ÷ count A',
      '2.67 ÷ 4',
      ['SE² A ≈ 0.67 hours²', BLUE]
    ], BLUE),
    ...say('A MEAN: SQUARED WOBBLE ≈ 0.67', BLUE)
  );

  // ------------------------------------------------------------
  // 15: STEP TWO — BATCH C'S MEAN WOBBLE
  // ------------------------------------------------------------

  const relativeAxisC = relativeAxis(PINK);

  const relativeDotsC = relativeDots(
    BATCH_C, MC, PINK
  );

  const relativeTitleC = tag(
    'BATCH C: MEAN 23',
    CX,
    P ? 0.72 : 1.18,
    PINK, 18
  );

  await until(S(15));
  await play(
    ...replace(
      relativeAxisC,
      ...relativeDotsC,
      relativeTitleC
    ),
    ...fbox([
      ['step 2: batch C', PINK],
      'repeat the same steps',
      'using C’s own spread'
    ], PINK),
    ...say('STEP 2: BATCH C', PINK)
  );

  // ------------------------------------------------------------
  // 16: BATCH C'S VARIANCE
  // Deviations: -3, -1, +1, +3.
  // Squares: 9, 1, 1, 9.
  // Variance: 20 / 3.
  // ------------------------------------------------------------

  const deviationsC = BATCH_C.map(
    v => v - MC
  );

  const squaresC = deviationsC.map((d, k) =>
    squaredTile(d, k, PINK)
  );

  const sumC = txt(
    '9 + 1 + 1 + 9 = 20',
    CX,
    squareY - 0.77,
    PINK, 19, true
  );

  const divC = txt(
    '20 ÷ 3 ≈ 6.67',
    CX,
    squareY - 1.20,
    PINK, 18, true
  );

  await until(S(16));
  await play(
    ...add(
      ...squaresC,
      sumC,
      divC
    ),
    ...fbox([
      'squared distances = 20',
      'variance C = 20 ÷ 3',
      ['≈ 6.67 hours²', PINK]
    ], PINK),
    ...say('BATCH C HAS THE LARGER VARIANCE', PINK)
  );

  // ------------------------------------------------------------
  // 17: VARIANCE C DIVIDED BY FOUR
  // ------------------------------------------------------------

  const varianceCFull = varianceBar(
    VC,
    VAR_TOP,
    PINK,
    'BATTERY VARIANCE C',
    '6.67 hours²'
  );

  const varianceCDivided = dividedVariance(
    VC,
    VAR_BOTTOM,
    PINK
  );

  const divisionLabelC = tag(
    '÷ 4 BATTERIES',
    CX,
    (VAR_TOP + VAR_BOTTOM) / 2,
    C.amber, 17
  );

  const contributionLabelC = txt(
    'SE² OF C MEAN ≈ 1.67',
    CX,
    VAR_BOTTOM + 0.56,
    PINK, 17
  );

  const contributionValueC = txt(
    '1.67 hours²',
    CX,
    VAR_BOTTOM - 0.48,
    PINK, 20, true
  );

  await until(S(17));
  await play(
    ...replace(
      varianceCFull,
      varianceCDivided,
      divisionLabelC,
      contributionLabelC,
      contributionValueC
    ),
    ...fbox([
      'variance C ÷ count C',
      '6.67 ÷ 4',
      ['SE² C ≈ 1.67 hours²', PINK]
    ], PINK),
    ...say('C MEAN: SQUARED WOBBLE ≈ 1.67', PINK)
  );

  // ------------------------------------------------------------
  // 18: THE GAP WOBBLES BECAUSE BOTH MEANS WOBBLE
  //
  // Keep each contribution visibly separate.
  // Lengths are proportional to squared standard errors.
  // ------------------------------------------------------------

  const CONTRIB_SCALE = P ? 2.0 : 2.12;

  const contribAW = WA * CONTRIB_SCALE;
  const contribCW = WC * CONTRIB_SCALE;

  const combinedWidth = SE2 * CONTRIB_SCALE;

  const contribLeft =
    CX - combinedWidth / 2;

  const contribAY = P ? 0.30 : 0.69;
  const contribCY = P ? -1.43 : -0.62;

  const combinedY = P ? -3.29 : -2.12;

  function contributionBlock(
    x, y, width,
    color, name, value
  ) {
    const block = rect(
      x, y,
      width, 0.43,
      color, 0.84
    );

    const label = txt(
      name,
      x,
      y + 0.54,
      color, 17,
      false, Math.max(1.65, width)
    );

    const number = txt(
      value,
      x,
      y - 0.46,
      color, 19, true,
      Math.max(1.1, width)
    );

    return new M.VGroup(
      block,
      label,
      number
    );
  }

  const contributionA = contributionBlock(
    CX,
    contribAY,
    contribAW,
    BLUE,
    'A CONTRIBUTION',
    '0.67'
  );

  const contributionC = contributionBlock(
    CX,
    contribCY,
    contribCW,
    PINK,
    'C CONTRIBUTION',
    '1.67'
  );

  const plusSign = txt(
    '+',
    CX + 2.60,
    (contribAY + contribCY) / 2,
    C.amber, 31, true
  );

  await until(S(18));
  await play(
    ...replace(
      contributionA,
      contributionC,
      plusSign
    ),
    ...fbox([
      ['A contributes 0.67', BLUE],
      ['C contributes 1.67', PINK],
      'both means add uncertainty'
    ]),
    ...say('THE GAP HAS TWO SOURCES OF WOBBLE')
  );

  // ------------------------------------------------------------
  // 19: ADD THE TWO SQUARED WOBBLES
  //
  // Exact arithmetic:
  // 2/3 + 5/3 = 7/3 ≈ 2.33.
  // The displayed rounded pieces are approximate.
  // ------------------------------------------------------------

  const combinedA = rect(
    contribLeft + contribAW / 2,
    combinedY,
    contribAW,
    0.48,
    BLUE, 0.86
  );

  const combinedC = rect(
    contribLeft + contribAW + contribCW / 2,
    combinedY,
    contribCW,
    0.48,
    PINK, 0.86
  );

  const combinedLabelA = txt(
    '0.67',
    contribLeft + contribAW / 2,
    combinedY,
    C.ink, 17, true,
    contribAW - 0.12
  );

  const combinedLabelC = txt(
    '1.67',
    contribLeft + contribAW + contribCW / 2,
    combinedY,
    C.ink, 17, true,
    contribCW - 0.12
  );

  const combinedBar = new M.VGroup(
    combinedA,
    combinedC,
    combinedLabelA,
    combinedLabelC
  );

  const combinedBracket = bracket(
    contribLeft,
    contribLeft + combinedWidth,
    combinedY - 0.41,
    C.amber,
    0.09
  );

  const combinedTotal = txt(
    'TOTAL ≈ 2.33 HOURS²',
    CX,
    combinedY - 0.68,
    C.amber, 18, true
  );

  const combineArrow = arrow(
    CX + 2.60,
    (contribAY + contribCY) / 2 - 0.26,
    CX + 2.60,
    combinedY + 0.35,
    C.amber
  );

  await until(S(19));
  await play(
    ...add(
      combinedBar,
      combinedBracket,
      combinedTotal,
      combineArrow
    ),
    ...fbox([
      'add squared SEs',
      '2/3 + 5/3 = 7/3',
      ['≈ 2.33 hours²', C.amber]
    ], C.amber),
    ...say('ADD THE TWO SQUARED WOBBLES', C.amber)
  );

  // ------------------------------------------------------------
  // 20: TAKE THE SQUARE ROOT
  //
  // Represent the combined variance as the area of a square.
  // Its side length is the standard error in hours.
  // ------------------------------------------------------------

  const areaScale = P ? 1.60 : 1.40;

  const squareSide = SE * areaScale;

  const rootX = CX - (P ? 0.24 : 0.35);
  const rootY = P ? -1.15 : -0.55;

  const areaLeft =
    rootX - squareSide / 2;

  const areaBottom =
    rootY - squareSide / 2;

  const blueAreaW =
    squareSide * WA / SE2;

  const pinkAreaW =
    squareSide * WC / SE2;

  const rootAreaA = rect(
    areaLeft + blueAreaW / 2,
    rootY,
    blueAreaW,
    squareSide,
    BLUE, 0.72
  );

  const rootAreaC = rect(
    areaLeft + blueAreaW + pinkAreaW / 2,
    rootY,
    pinkAreaW,
    squareSide,
    PINK, 0.72
  );

  const rootOutline = outline(
    rootX,
    rootY,
    squareSide,
    squareSide,
    C.amber,
    0
  );

  const areaText = txt(
    'AREA ≈ 2.33',
    rootX,
    rootY,
    C.ink, 19, true,
    squareSide - 0.14
  );

  const rootBottomBracket = bracket(
    areaLeft,
    areaLeft + squareSide,
    areaBottom - 0.35,
    C.green
  );

  const rootBottomLabel = txt(
    'SIDE ≈ 1.53 h',
    rootX,
    areaBottom - 0.66,
    C.green, 20, true
  );

  const rootTitle = txt(
    'SQUARE ROOT',
    rootX,
    rootY + squareSide / 2 + 0.38,
    C.amber, 18
  );

  await until(S(20));
  await play(
    ...replace(
      rootAreaA,
      rootAreaC,
      rootOutline,
      areaText,
      rootTitle,
      rootBottomBracket,
      rootBottomLabel
    ),
    ...fbox([
      'undo the squaring',
      'SE = √(7/3)',
      ['≈ 1.53 hours', C.green]
    ], C.green),
    ...say('SQUARE ROOT: BACK TO HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 21: STANDARD ERROR OF THE GAP
  // ------------------------------------------------------------

  const seBarWidth = P ? 3.30 : 3.45;
  const seY = P ? -0.65 : -0.46;

  const seBar = new M.VGroup(
    rect(
      CX, seY,
      seBarWidth + 0.09,
      0.61,
      C.green, 0.13, 0
    ),

    rect(
      CX, seY,
      seBarWidth,
      0.45,
      C.green, 0.86
    ),

    bracket(
      CX - seBarWidth / 2,
      CX + seBarWidth / 2,
      seY + 0.59,
      C.green
    ),

    txt(
      '1.53 HOURS',
      CX,
      seY + 0.94,
      C.green, 24, true
    ),

    txt(
      'ONE STANDARD ERROR OF THE GAP',
      CX,
      seY - 0.68,
      C.green, 16
    )
  );

  const combinedSources = txt(
    'A wobble + C wobble, combined fairly',
    CX,
    seY - 1.20,
    C.muted, 16
  );

  await until(S(21));
  await play(
    ...replace(
      seBar,
      combinedSources
    ),
    ...fbox([
      'standard error of gap',
      '√(variance A/4 + variance C/4)',
      ['SE ≈ 1.53 hours', C.green]
    ], C.green),
    ...say('THE GAP WOBBLES ABOUT 1.5 HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 22: SIX HOURS CONTAINS ABOUT 3.93 STANDARD ERRORS
  //
  // Draw three full SE units and one fractional unit.
  // ------------------------------------------------------------

  const rulerW = P ? 5.9 : 6.2;

  const rulerLeft = CX - rulerW / 2;
  const rulerRight = CX + rulerW / 2;

  const rulerY = P ? -0.75 : -0.49;

  const unitWidth = rulerW * SE / GAP;

  const fullUnits = Math.floor(TSTAT);
  const partialUnit = TSTAT - fullUnits;

  function seBlocks() {
    const parts = [];

    let cursor = rulerLeft;

    for (let k = 0; k <= fullUnits; k++) {
      const amount = k < fullUnits
        ? 1
        : partialUnit;

      const width = unitWidth * amount;
      const x = cursor + width / 2;

      const block = rect(
        x,
        rulerY - 0.43,
        Math.max(0.025, width - 0.045),
        0.55,
        C.green,
        k < fullUnits ? 0.84 : 0.45
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
        rulerY + 0.96,
        C.amber
      ),

      txt(
        '6 HOURS',
        CX,
        rulerY + 1.29,
        C.amber, 22, true
      ),

      tag(
        '17',
        rulerLeft,
        rulerY + 0.48,
        BLUE, 16
      ),

      tag(
        '23',
        rulerRight,
        rulerY + 0.48,
        PINK, 16
      ),

      arrow(
        rulerLeft,
        rulerY + 0.05,
        rulerRight,
        rulerY + 0.05,
        C.amber
      ),

      ...seBlocks(),

      tag(
        't ≈ 3.93',
        CX,
        rulerY - 1.22,
        C.violet, 22
      )
    ];
  }

  const initialRuler = rulerPicture();

  await until(S(22));
  await play(
    ...replace(...initialRuler),
    ...fbox([
      't = gap ÷ SE',
      '  = 6 ÷ 1.53',
      ['  ≈ 3.93', C.violet]
    ], C.violet),
    ...say('STEP 5: COUNT STANDARD ERRORS', C.violet)
  );

  // ------------------------------------------------------------
  // 23: EACH BATCH KEPT ITS OWN SPREAD
  // ------------------------------------------------------------

  const compareY1 = P ? 0.18 : 0.55;
  const compareY2 = P ? -2.30 : -1.8;

  const independentVarianceA = varianceBar(
    VA,
    compareY1,
    BLUE,
    'A KEEPS ITS OWN VARIANCE',
    '2.67 hours²'
  );

  const independentVarianceC = varianceBar(
    VC,
    compareY2,
    PINK,
    'C KEEPS ITS OWN VARIANCE',
    '6.67 hours²'
  );

  const ownSpreadTag = tag(
    'NO SHARED VARIANCE',
    CX,
    (compareY1 + compareY2) / 2 + (P ? 0.1 : 0),
    C.violet, 16
  );

  await until(S(23));
  await play(
    ...replace(
      independentVarianceA,
      independentVarianceC,
      ownSpreadTag
    ),
    ...fbox([
      ['variance A ≈ 2.67', BLUE],
      ['variance C ≈ 6.67', PINK],
      'never force them equal'
    ]),
    ...say('LET EACH GROUP KEEP ITS OWN SPREAD')
  );

  // ------------------------------------------------------------
  // 24: NAME THE METHOD
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...say("WELCH'S t-TEST", C.green),
    ...fbox([
      ["Welch's t-test", C.green],
      'two separate groups',
      'different spreads allowed'
    ], C.green)
  );

  // ------------------------------------------------------------
  // STUDENT t REFERENCE CURVE
  //
  // Welch degrees of freedom ≈ 5.07.
  // The graph evaluates the Student t density at this df.
  //
  // Gamma uses the Lanczos approximation.
  // Curves are constructed from ordinary Line objects.
  // ------------------------------------------------------------

  function gamma(z) {
    const p = [
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

    for (let i = 0; i < p.length; i++) {
      x += p[i] / (z + i + 1);
    }

    const t = z + p.length - 0.5;

    return Math.sqrt(2 * Math.PI) *
      Math.pow(t, z + 0.5) *
      Math.exp(-t) *
      x;
  }

  function studentPDF(v, df) {
    const c =
      gamma((df + 1) / 2) /
      (
        Math.sqrt(df * Math.PI) *
        gamma(df / 2)
      );

    return c *
      Math.pow(
        1 + v * v / df,
        -(df + 1) / 2
      );
  }

  const TXMIN = -7;
  const TXMAX = 7;

  const TW = P ? 6.5 : 6.8;

  const TY = P ? -3.0 : -1.65;
  const TH = P ? 7.0 : 6.0;

  const tx = v =>
    CX - TW / 2 +
    (v - TXMIN) / (TXMAX - TXMIN) * TW;

  const ty = (v, df = DF) =>
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
          TY - 0.31,
          C.muted, 16, true
        )
      );
    }

    parts.push(
      txt(
        't',
        tx(TXMAX) - 0.07,
        TY - 0.65,
        C.muted, 18, true
      )
    );

    return new M.VGroup(...parts);
  }

  function tCurve(
    df = DF,
    color = BLUE,
    strokeWidth = 3,
    samples = 128
  ) {
    const parts = [];

    for (let k = 0; k < samples; k++) {
      const a =
        TXMIN + (TXMAX - TXMIN) * k / samples;

      const b =
        TXMIN + (TXMAX - TXMIN) * (k + 1) / samples;

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
    df = DF,
    color = C.violet,
    opacity = 0.72,
    samples = 55
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
    df = DF,
    color = C.violet
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
  // 25: WELCH ADJUSTS THE DEGREES OF FREEDOM
  //
  // Do not introduce the complicated df formula in the narration.
  // Show how df changes the reference curve's shape.
  // ------------------------------------------------------------

  const bellAxis = tAxis();

  const dfThreeCurve = tCurve(
    3, C.muted, 2
  );

  const welchCurve = tCurve(
    DF, BLUE, 3.2
  );

  const dfThreeLabel = txt(
    'df = 3',
    CX - TW * 0.30,
    TY + 1.55,
    C.muted, 17, true
  );

  const welchDFLabel = tag(
    'df ≈ 5.07',
    CX + TW * 0.29,
    TY + 2.13,
    C.violet, 16
  );

  await until(S(25));
  await play(
    ...replace(
      bellAxis,
      dfThreeCurve,
      welchCurve,
      dfThreeLabel,
      welchDFLabel
    ),
    ...fbox([
      'Welch adjusts the df',
      'using both group spreads',
      ['df ≈ 5.07', C.violet]
    ], C.violet),
    ...say('ADJUST THE REFERENCE CURVE', C.violet)
  );

  // ------------------------------------------------------------
  // 26: t ≈ 3.93, df ≈ 5.07, p ≈ 0.011
  // Show both tails of the null reference distribution.
  // ------------------------------------------------------------

  const pShade = bothTails(
    TSTAT,
    DF,
    C.violet
  );

  const leftBoundary = tBoundary(
    -TSTAT,
    C.violet
  );

  const rightBoundary = tBoundary(
    TSTAT,
    C.amber
  );

  const negativeT = txt(
    '−3.93',
    tx(-TSTAT),
    TY + 1.47,
    C.violet, 18, true
  );

  const positiveT = txt(
    '+3.93',
    tx(TSTAT),
    TY + 1.47,
    C.amber, 18, true
  );

  const actualT = dot(
    tx(TSTAT),
    TY,
    C.amber, 0.12
  );

  const leftTailLabel = txt(
    '≈ 0.55%',
    tx(-5.05),
    TY + 0.51,
    C.violet, 15, true
  );

  const rightTailLabel = txt(
    '≈ 0.55%',
    tx(5.05),
    TY + 0.51,
    C.violet, 15, true
  );

  const pTag = tag(
    'p ≈ 1.1%',
    CX,
    TY - 1.0,
    C.violet, 21
  );

  await until(S(26));
  await play(
    ...remove(
      dfThreeCurve,
      dfThreeLabel
    ),
    ...add(
      pShade,
      leftBoundary,
      rightBoundary,
      negativeT,
      positiveT,
      actualT,
      leftTailLabel,
      rightTailLabel,
      pTag
    ),
    ...fbox([
      't ≈ 3.93; df ≈ 5.07',
      'two-sided probability',
      ['p ≈ 0.011 = 1.1%', C.violet]
    ], C.violet),
    ...say('ABOUT ONE PERCENT THIS EXTREME', C.violet)
  );

  // ------------------------------------------------------------
  // 27: REJECT THE NULL HYPOTHESIS
  // ------------------------------------------------------------

  const rejectTag = tag(
    'REJECT THE NULL',
    CX,
    TY - 1.62,
    C.green, 20
  );

  await until(S(27));
  await play(
    ...add(rejectTag),
    new M.Indicate(pTag, {
      color: C.green
    }),
    ...fbox([
      'p ≈ 1.1%',
      'usual cutoff = 5%',
      ['1.1% < 5%', C.green],
      ['evidence C is higher', C.green]
    ], C.green),
    ...say('EVIDENCE THAT THE TRUE MEANS DIFFER', C.green)
  );

  // ------------------------------------------------------------
  // 28: THE FORMULA
  // t = difference between means / SE of the gap.
  // ------------------------------------------------------------

  const formulaPicture = fullHoursPicture(
    true,
    true
  );

  await until(S(28));
  await play(
    ...replace(...formulaPicture),
    ...fbox([
      't = (mean C − mean A)',
      '    ÷ SE of gap',
      ['  = 6 ÷ 1.53 ≈ 3.93', C.amber]
    ]),
    ...say('t = GAP BETWEEN MEANS ÷ STANDARD ERROR')
  );

  // ------------------------------------------------------------
  // 29: THE COMBINED STANDARD ERROR FORMULA
  // Keep the A and C contributions in their own colors.
  // ------------------------------------------------------------

  const formulaAY = P ? 0.55 : 0.90;
  const formulaCY = P ? -1.05 : -0.22;
  const formulaCombinedY = P ? -3.00 : -1.68;

  function formulaContribution(
    y,
    color,
    name,
    varianceText,
    contributionText
  ) {
    return new M.VGroup(
      outline(
        CX,
        y,
        5.75, 0.82,
        color, 0.06
      ),

      txt(
        name,
        CX - 2.17,
        y,
        color, 20, true,
        0.85
      ),

      txt(
        varianceText,
        CX - 0.15,
        y,
        color, 19, true,
        2.85
      ),

      txt(
        contributionText,
        CX + 2.05,
        y,
        color, 19, true,
        1.2
      )
    );
  }

  const formulaContributionA =
    formulaContribution(
      formulaAY,
      BLUE,
      'A',
      '2.67 ÷ 4',
      '0.67'
    );

  const formulaContributionC =
    formulaContribution(
      formulaCY,
      PINK,
      'C',
      '6.67 ÷ 4',
      '1.67'
    );

  const formulaPlus = txt(
    '+',
    CX,
    (formulaAY + formulaCY) / 2,
    C.amber, 24, true
  );

  const formulaRoot = new M.VGroup(
    outline(
      CX,
      formulaCombinedY,
      5.75, 0.91,
      C.green, 0.10
    ),

    txt(
      '√(2/3 + 5/3) ≈ 1.53',
      CX,
      formulaCombinedY,
      C.green, 22, true,
      5.45
    )
  );

  const formulaConnector = arrow(
    CX,
    formulaCY - 0.51,
    CX,
    formulaCombinedY + 0.55,
    C.amber
  );

  await until(S(29));
  await play(
    ...replace(
      formulaContributionA,
      formulaPlus,
      formulaContributionC,
      formulaConnector,
      formulaRoot
    ),
    ...fbox([
      'SE = √(vA/nA + vC/nC)',
      'vA, vC: variances',
      'nA, nC: group sizes',
      ['SE ≈ 1.53 hours', C.green]
    ], C.green),
    ...say('ADD VARIANCES PER COUNT, THEN TAKE √', C.green)
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
      'measured in the',
      ['combined mean wobble', C.green]
    ]),
    ...say('THE GAP IN COMBINED STANDARD ERRORS')
  );

  // ------------------------------------------------------------
  // 31: WHAT IS IT FOR?
  //
  // Two independent groups.
  // Different true spreads are allowed.
  // ------------------------------------------------------------

  const useY = P ? -0.65 : -0.49;

  const useAX = CX - 1.72;
  const useCX = CX + 1.72;

  function separateGroupCard(
    x, y,
    color,
    label,
    wide = false
  ) {
    const values = wide
      ? [-1.0, -0.36, 0.36, 1.0]
      : [-0.57, -0.18, 0.18, 0.57];

    const parts = [
      outline(
        x, y,
        2.75, 2.00,
        color, 0.055
      ),

      txt(
        label,
        x,
        y + 0.68,
        color, 18
      ),

      line(
        x - 1.12,
        y - 0.34,
        x + 1.12,
        y - 0.34,
        C.muted, 1.5
      ),

      dashed(
        x, y - 0.33,
        x, y + 0.22,
        color
      )
    ];

    values.forEach(v => {
      parts.push(
        dot(
          x + v,
          y,
          color, 0.11
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const useA = separateGroupCard(
    useAX, useY,
    BLUE,
    'GROUP A',
    false
  );

  const useC = separateGroupCard(
    useCX, useY,
    PINK,
    'GROUP C',
    true
  );

  const useCompare = txt(
    '↔',
    CX,
    useY,
    C.amber, 26
  );

  const useCaption = txt(
    'COMPARE THEIR MEANS, NOT THEIR SPREADS',
    CX,
    useY - 1.42,
    C.green, 17
  );

  await until(S(31));
  await play(
    ...replace(
      useA,
      useC,
      useCompare,
      useCaption
    ),
    ...fbox([
      'two independent groups',
      'compare their means',
      ['unequal spreads allowed', C.green]
    ], C.green),
    ...say('TWO GROUPS CAN HAVE DIFFERENT SPREADS')
  );

  // ------------------------------------------------------------
  // 32: A COMMON DEFAULT FOR TWO INDEPENDENT GROUPS
  // Do not imply that every software package uses Welch by default.
  // ------------------------------------------------------------

  const defaultTag = tag(
    'COMMON FIRST CHOICE',
    CX,
    useY + 1.43,
    C.green, 18
  );

  await until(S(32));
  await play(
    ...add(defaultTag),
    ...fbox([
      "Welch's t-test",
      'a common software default',
      ['for independent groups', C.green]
    ], C.green),
    ...say('A COMMON DEFAULT FOR TWO SEPARATE GROUPS', C.green)
  );

  // ------------------------------------------------------------
  // 33: TRAP — WELCH IS FOR SEPARATE GROUPS
  // ------------------------------------------------------------

  const trapAX = CX - 1.62;
  const trapCX = CX + 1.62;

  const trapY = P ? -0.80 : -0.49;

  function independentBatteryCard(
    x, y, color, label
  ) {
    const parts = [
      outline(
        x, y,
        2.75, 2.28,
        color, 0.045
      ),

      tag(
        label,
        x,
        y + 0.78,
        color, 16
      )
    ];

    for (let k = 0; k < 4; k++) {
      parts.push(
        battery(
          x + (k - 1.5) * 0.57,
          y - 0.17,
          color,
          0.41, 0.76
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const trapA = independentBatteryCard(
    trapAX,
    trapY,
    BLUE,
    'BATCH A'
  );

  const trapC = independentBatteryCard(
    trapCX,
    trapY,
    PINK,
    'BATCH C'
  );

  const independentCaption = tag(
    'NO SHARED BATTERIES',
    CX,
    trapY - 1.52,
    C.green, 17
  );

  await until(S(33));
  await play(
    ...replace(
      trapA,
      trapC,
      independentCaption
    ),
    ...fbox([
      ['check the design first', C.amber],
      "Welch's test requires",
      'independent groups'
    ], C.amber),
    ...say('TRAP: WELCH IS FOR SEPARATE GROUPS', C.amber)
  );

  // ------------------------------------------------------------
  // 34: SAME BATTERIES MEASURED TWICE?
  // Return to the exact paired data from lesson 7.2.2.
  // ------------------------------------------------------------

  const BEFORE = [15, 17, 17, 19];
  const AFTER = [16, 19, 19, 22];

  const PAIR_XL = CX - 1.54;
  const PAIR_XR = CX + 1.54;

  const PAIR_Y0 = P ? -3.85 : -2.22;
  const PAIR_Y1 = P ? 0.90 : 1.15;

  const pairY = v =>
    PAIR_Y0 +
    (v - 14) / 9 *
    (PAIR_Y1 - PAIR_Y0);

  const jitter = [0, -0.14, 0.14, 0];

  function pairedAxes() {
    const ax = CX - 2.90;

    const parts = [
      line(
        ax, PAIR_Y0,
        ax, PAIR_Y1,
        C.muted, 2
      ),

      line(
        ax, PAIR_Y0,
        CX + 2.9, PAIR_Y0,
        C.muted, 2
      )
    ];

    for (let v = 14; v <= 22; v += 2) {
      parts.push(
        line(
          ax - 0.06, pairY(v),
          ax + 0.06, pairY(v),
          C.muted, 1.5
        ),

        txt(
          String(v),
          ax - 0.25,
          pairY(v),
          C.muted, 15, true
        ),

        line(
          ax + 0.07,
          pairY(v),
          CX + 2.9,
          pairY(v),
          C.muted, 0.6
        )
      );
    }

    parts.push(
      txt(
        'BEFORE',
        PAIR_XL,
        PAIR_Y0 - 0.41,
        BLUE, 18
      ),

      txt(
        'AFTER',
        PAIR_XR,
        PAIR_Y0 - 0.41,
        BLUE, 18
      )
    );

    return new M.VGroup(...parts);
  }

  function pairLink(k, color = C.green) {
    return line(
      PAIR_XL + jitter[k],
      pairY(BEFORE[k]),
      PAIR_XR + jitter[k],
      pairY(AFTER[k]),
      color, 2.5
    );
  }

  const pairedAxis = pairedAxes();

  const pairedBeforeDots = BEFORE.map((v, k) =>
    dot(
      PAIR_XL + jitter[k],
      pairY(v),
      BLUE, 0.11
    )
  );

  const pairedAfterDots = AFTER.map((v, k) =>
    dot(
      PAIR_XR + jitter[k],
      pairY(v),
      BLUE, 0.11
    )
  );

  const pairedLinks = BEFORE.map((_, k) =>
    pairLink(k)
  );

  await until(S(34));
  await play(
    ...replace(
      pairedAxis,
      ...pairedLinks,
      ...pairedBeforeDots,
      ...pairedAfterDots
    ),
    ...fbox([
      'same batteries twice?',
      ['keep their matched pairs', C.green],
      'use the paired t-test'
    ], C.green),
    ...say('SAME BATTERIES TWICE? USE THE PAIRED TEST', C.green)
  );

  // ------------------------------------------------------------
  // 35: USING WELCH ON PAIRED DATA THROWS AWAY INFORMATION
  //
  // First remove the connecting lines, then reveal the different
  // conclusions from the exact paired example in lesson 7.2.2.
  // ------------------------------------------------------------

  const pairedTrapY = P ? 1.40 : 1.43;

  const lostPairsTag = tag(
    'MATCHES THROWN AWAY',
    CX,
    pairedTrapY,
    C.amber, 16
  );

  await until(S(35));
  await play(
    ...remove(...pairedLinks),
    ...add(lostPairsTag),
    ...fbox([
      ['wrong: ignore the pairs', C.amber],
      'battery-to-battery spread',
      'hides the improvement'
    ], C.amber),
    ...say('DO NOT THROW AWAY MATCHED PAIRS', C.amber)
  );

  const wrongComparisonY = P ? 0.1 : 0.46;
  const rightComparisonY = P ? -2.4 : -1.50;

  const wrongComparison = new M.VGroup(
    outline(
      CX,
      wrongComparisonY,
      5.9, 1.44,
      C.amber, 0.055
    ),

    txt(
      'WRONG: WELCH ON PAIRED DATA',
      CX,
      wrongComparisonY + 0.38,
      C.amber, 16
    ),

    txt(
      't ≈ 1.36    p ≈ 23%',
      CX,
      wrongComparisonY - 0.12,
      C.amber, 20, true
    ),

    txt(
      'improvement hidden',
      CX,
      wrongComparisonY - 0.46,
      C.muted, 15
    )
  );

  const rightComparison = new M.VGroup(
    outline(
      CX,
      rightComparisonY,
      5.9, 1.44,
      C.green, 0.055
    ),

    txt(
      'CORRECT: PAIRED t-TEST',
      CX,
      rightComparisonY + 0.38,
      C.green, 16
    ),

    txt(
      't ≈ 4.90    p ≈ 1.6%',
      CX,
      rightComparisonY - 0.12,
      C.green, 20, true
    ),

    txt(
      'evidence of improvement',
      CX,
      rightComparisonY - 0.46,
      C.green, 15
    )
  );

  await until(S(35) + 1.8);
  await play(
    ...replace(
      wrongComparison,
      rightComparison
    ),
    ...fbox([
      ['wrong test: p ≈ 23%', C.amber],
      ['paired test: p ≈ 1.6%', C.green],
      'same data, different design'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 36: ONE-SENTENCE SUMMARY
  //
  // Two separate groups.
  // Compare their means.
  // Keep their individual spreads.
  // ------------------------------------------------------------

  const finalPicture = fullHoursPicture(
    true,
    true
  );

  const finalSpreadAY = P ? 0.10 : 0.97;

  const finalVarianceA = tag(
    'VAR A ≈ 2.67',
    CX - 1.68,
    finalSpreadAY,
    BLUE, 16,
    2.9
  );

  const finalVarianceC = tag(
    'VAR C ≈ 6.67',
    CX + 1.68,
    finalSpreadAY,
    PINK, 16,
    2.9
  );

  const finalT = tag(
    't ≈ 3.93',
    CX - 1.40,
    P ? -4.55 : -0.27,
    C.violet, 17
  );

  const finalP = tag(
    'p ≈ 1.1%',
    CX + 1.40,
    P ? -4.55 : -0.27,
    C.green, 17
  );

  // On laptop, the gap arrow occupies the central upper area.
  // Keep the final variance pills above it and put the test
  // result in the formula box rather than covering the dots.

  const finalExtras = P
    ? [
        finalVarianceA,
        finalVarianceC,
        finalT,
        finalP
      ]
    : [
        finalVarianceA,
        finalVarianceC
      ];

  await until(S(36));
  await play(
    ...replace(
      ...finalPicture,
      ...finalExtras
    ),
    ...fbox([
      ["Welch's t-test", C.green],
      'gap ÷ combined SE',
      ['t ≈ 3.93; p ≈ 1.1%', C.green],
      'own spread for each'
    ], C.green),
    ...say('TWO SEPARATE MEANS. TWO SEPARATE SPREADS.', C.green)
  );

  await until(E(36));

  // All sentence beats 0–36 are included.
  // Uses the supplied engine interface and reference conventions.
  // Browser rendering and narration synchronization have not
  // been runtime-tested against the actual engine installation.
}

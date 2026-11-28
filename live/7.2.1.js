// lesson 7.2.1
// One-sample t-test: is the battery's missing time just chance?
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
  const SK = 1.14, SY0 = 1.7, SY1 = 3.3;
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
  // ------------------------------------------------------------

  const A = [15, 17, 17, 19];
  const N = A.length;
  const CLAIM = 20;
  const MEAN = A.reduce((a, b) => a + b, 0) / N;
  const GAP = MEAN - CLAIM;
  const SS = A.reduce((s, v) => s + (v - MEAN) ** 2, 0);
  const DF = N - 1;
  const SD = Math.sqrt(SS / DF);
  const SE = SD / Math.sqrt(N);
  const TSTAT = GAP / SE;
  const CRIT = 3.182446;
  const PVALUE = 0.035;

  // Keep full precision internally.
  // Round only the numbers displayed to the learner.

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -6.55, 0] : [4.3, -0.3, 0];  // phone: bottom edge of the card

  const AX = P ? -2.65 : -1.25;
  const W = P ? FW - 2.1 : 6.8;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Same construction as the approved arithmetic-mean lesson.
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
    mono = false
  ) {
    const t = T(s, size, color, mono);
    t.moveTo(pt(x, y));
    return t;
  }

  function tag(s, x, y, color = C.cyan, size = 17) {
    const t = pill(s, color, size);
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

  function dashed(x1, y1, x2, y2, color = C.muted) {
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
    color = C.cyan
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(x, y, color = C.cyan, radius = 0.13) {
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
    cap = 0.13
  ) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 3),
      line(x1, y - cap, x1, y + cap, color, 2),
      line(x2, y - cap, x2, y + cap, color, 2)
    );
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    head = 0.15
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 3),

      line(
        x2, y2,
        x2 - head * Math.cos(a - Math.PI / 5),
        y2 - head * Math.sin(a - Math.PI / 5),
        color, 3
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a + Math.PI / 5),
        y2 - head * Math.sin(a + Math.PI / 5),
        color, 3
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
    const active = objects.filter(o => picture.includes(o));

    picture = picture.filter(o => !active.includes(o));

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
  // ------------------------------------------------------------

  function battery(
    x, y,
    charge = 1,
    color = C.cyan,
    width = 0.86,
    height = 1.42
  ) {
    const shell = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2.5
    });

    shell.setFill(C.card, 0.8);
    shell.moveTo(pt(x, y));

    const cap = rect(
      x,
      y + height / 2 + 0.075,
      width * 0.36,
      0.15,
      color,
      1
    );

    const objects = [shell, cap];

    const innerH = height - 0.22;
    const innerW = width - 0.2;

    if (charge > 0) {
      const h = innerH * charge;

      const glow = rect(
        x,
        y - innerH / 2 + h / 2,
        innerW + 0.07,
        h,
        color,
        0.14,
        0
      );

      const fill = rect(
        x,
        y - innerH / 2 + h / 2,
        innerW,
        h,
        color,
        0.86,
        0
      );

      objects.push(glow, fill);
    }

    return new M.VGroup(...objects);
  }

  // ------------------------------------------------------------
  // 0-2: THE LAB AND THE ADVERTISED PROMISE
  // ------------------------------------------------------------

  const labY = P ? -1.9 : -0.25;

  const hero = battery(
    CX, labY,
    1, C.cyan,
    P ? 1.35 : 1.15, P ? 2.2 : 1.85
  );

  const bench = line(
    CX - 2.25, labY - 1.05,
    CX + 2.25, labY - 1.05,
    C.muted, 3
  );

  const labLabel = txt(
    'BATTERY TEST LAB',
    CX, labY - (P ? 1.6 : 1.45),
    C.muted, 18
  );

  await until(S(0));
  await play(
    ...add(hero, bench, labLabel),
    ...(P ? fbox([
      'a lab tests',
      ['phone batteries', C.cyan]
    ]) : []),
    ...say('HOW LONG DOES A BATTERY LAST?')
  );

  const promise = tag(
    '20 HOURS',
    CX, labY + (P ? 1.72 : 1.5),
    C.amber, 23
  );

  await until(S(1));
  await play(
    ...add(promise),
    ...(P ? fbox([
      'promise on the box',
      ['lasts 20 hours', C.amber]
    ], C.amber) : []),
    ...say('THE PROMISE ON THE BOX', C.amber)
  );

  await until(S(2));
  await play(
    new M.Indicate(promise, { color: C.amber }),
    ...say('DOES THE PROMISE HOLD UP?', C.violet)
  );

  // ------------------------------------------------------------
  // 3-4: FOUR BATTERIES, SAME STANDARD TEST
  // ------------------------------------------------------------

  const BX = k =>
    CX + (k - 1.5) * (P ? 1.35 : 1.48);

  const BY = P ? -1.5 : -0.25;

  const batteries = A.map((_, k) =>
    battery(BX(k), BY, 1, C.cyan)
  );

  const batteryLabels = A.map((_, k) =>
    txt(
      String(k + 1),
      BX(k), BY - 1.05,
      C.muted, 18, true
    )
  );

  const batchTag = tag(
    'BATCH A',
    CX, BY + 1.25,
    C.cyan, 19
  );

  await until(S(3));
  await play(
    ...replace(
      batchTag,
      ...batteries,
      ...batteryLabels
    ),
    ...(P ? fbox([
      'batch A',
      ['4 batteries', C.cyan],
      'from one factory batch'
    ]) : []),
    ...say('4 BATTERIES FROM ONE BATCH')
  );

  const testFloor = txt(
    'FULL CHARGE → RUN → EMPTY',
    CX, BY - 1.72,
    C.green, P ? 17 : 18
  );

  await until(S(4));
  await play(
    ...add(testFloor),
    ...(P ? fbox([
      'same test for all',
      'charge fully, then run',
      ['until it dies', C.green]
    ], C.green) : []),
    ...say('SAME TEST FOR EVERY BATTERY', C.green)
  );

  await play(
    new M.LaggedStart(
      batteries.map((b, k) =>
        new M.Transform(
          b,
          battery(BX(k), BY, 0, C.cyan)
        )
      ),
      {
        lagRatio: 0.14,
        runTime: 2.3
      }
    )
  );

  // ------------------------------------------------------------
  // 5: AN HOURS NUMBER LINE
  // ------------------------------------------------------------

  const xmin = 14;
  const xmax = 21;

  const hx = v =>
    CX - W / 2 + (v - xmin) / (xmax - xmin) * W;

  function hoursAxis() {
    const parts = [
      line(hx(xmin), AX, hx(xmax), AX, C.muted, 3)
    ];

    for (let v = xmin; v <= xmax; v++) {
      const color = v === CLAIM ? C.amber : C.muted;

      parts.push(
        line(
          hx(v), AX - 0.08,
          hx(v), AX + 0.08,
          color, 2
        )
      );

      parts.push(
        txt(
          String(v),
          hx(v), AX - 0.32,
          color,
          P ? 17 : 18,
          true
        )
      );
    }

    parts.push(
      txt(
        'hours',
        hx(xmax) - 0.1,
        AX - 0.73,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function readingDot(v, duplicate = 0) {
    return dot(
      hx(v),
      AX + 0.34 + duplicate * 0.43,
      C.cyan,
      0.13
    );
  }

  const axis = hoursAxis();

  await until(S(5));
  await play(
    ...replace(axis),
    ...(P ? fbox([
      'battery life',
      ['results: ?', C.cyan]
    ]) : []),
    ...say('BATTERY LIFE IN HOURS')
  );

  // ------------------------------------------------------------
  // 6-9: FOUR ACTUAL READINGS
  // Short beats: one dot appears for each spoken number.
  // ------------------------------------------------------------

  const dots = [];

  for (let k = 0; k < A.length; k++) {
    await until(S(6 + k));

    const v = A[k];

    const duplicates = A
      .slice(0, k)
      .filter(n => n === v)
      .length;

    const d = readingDot(v, duplicates);

    dots.push(d);
    picture.push(d);

    await play(
      new M.FadeIn(d, { runTime: 0.28 }),
      ...(P ? fbox([
        'battery life',
        [A.slice(0, k + 1).join(', ') + ' hours', C.cyan]
      ]) : []),
      new M.Flash(
        d.submobjects[1],
        {
          color: C.cyan,
          runTime: 0.35
        }
      )
    );
  }

  // ------------------------------------------------------------
  // 10: ALL FOUR FALL SHORT OF THE CLAIM
  // ------------------------------------------------------------

  const claimLine = dashed(
    hx(CLAIM), AX + 0.08,
    hx(CLAIM), AX + 1.35,
    C.amber
  );

  const claimTag = tag(
    'CLAIM: 20',
    hx(CLAIM), AX + 1.63,
    C.amber, 15
  );

  const sampleOutline = outline(
    (hx(15) + hx(19)) / 2,
    AX + 0.55,
    hx(19) - hx(15) + 0.55,
    1.05,
    C.cyan
  );

  await until(S(10));
  await play(
    ...add(claimLine, claimTag, sampleOutline),
    ...(P ? fbox([
      '15, 17, 17, 19 hours',
      ['all below 20', C.amber]
    ], C.amber) : []),
    ...say('ALL FOUR ARE BELOW 20', C.amber)
  );

  // ------------------------------------------------------------
  // 11: SAMPLE MEAN = 17
  // ------------------------------------------------------------

  const meanTick = line(
    hx(MEAN), AX - 0.55,
    hx(MEAN), AX - 0.85,
    C.green, 3
  );

  const meanTag = tag(
    'MEAN: 17',
    hx(MEAN), AX - 1.14,
    C.green, 16
  );

  await until(S(11));
  await play(
    ...remove(sampleOutline),
    ...add(meanTick, meanTag),
    ...fbox([
      'sample mean',
      '(15 + 17 + 17 + 19) ÷ 4',
      ['= 17 hours', C.green]
    ], C.green),
    ...say('THE FAIR SHARE IS 17 HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 12: THE MISSING THREE HOURS
  // ------------------------------------------------------------

  const gapY = AX + 1.25;

  const gapArrow = arrow(
    hx(CLAIM) - 0.07, gapY,
    hx(MEAN) + 0.07, gapY,
    C.amber
  );

  const gapLabel = txt(
    '−3 hours',
    (hx(CLAIM) + hx(MEAN)) / 2,
    gapY + 0.35,
    C.amber, 22, true
  );

  await until(S(12));
  await play(
    ...remove(claimTag),
    ...add(gapArrow, gapLabel),
    ...fbox([
      'observed − claimed',
      ['17 − 20 = −3 hours', C.amber],
      ['real gap or chance?', C.violet]
    ], C.amber),
    ...say('REAL DIFFERENCE OR BAD LUCK?', C.violet)
  );

  // ------------------------------------------------------------
  // 13-15: THE HYPOTHESIS-TESTING PLAN
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...say('START WITH A CAUTIOUS CLAIM', C.violet)
  );

  const nullTag = tag(
    'ASSUME 20 IS TRUE',
    hx(CLAIM) - 0.35,
    AX + 1.88,
    C.violet, 15
  );

  await until(S(14));
  await play(
    ...remove(gapLabel),
    ...add(nullTag),
    ...fbox([
      ['null hypothesis', C.violet],
      'true batch mean = 20',
      'observed gap is chance'
    ], C.violet),
    ...say('NULL HYPOTHESIS', C.violet)
  );

  await until(S(15));
  await play(
    new M.Indicate(gapArrow, { color: C.amber }),
    ...fbox([
      ['size of the gap', C.amber],
      'compared with',
      ['normal wobble of a mean', C.cyan]
    ]),
    ...say('COMPARE GAP WITH WOBBLE')
  );

  // ------------------------------------------------------------
  // 16-17: STEP ONE — BATTERY-TO-BATTERY SPREAD
  // ------------------------------------------------------------

  const devY = AX + 1.1;

  const leftDev = bracket(
    hx(15), hx(MEAN),
    devY, C.amber
  );

  const rightDev = bracket(
    hx(MEAN), hx(19),
    devY, C.amber
  );

  const leftDevLabel = txt(
    '−2',
    (hx(15) + hx(MEAN)) / 2,
    devY + 0.31,
    C.amber, 19, true
  );

  const rightDevLabel = txt(
    '+2',
    (hx(MEAN) + hx(19)) / 2,
    devY + 0.31,
    C.amber, 19, true
  );

  const zeroDevLabel = txt(
    '0, 0',
    hx(MEAN),
    devY + 0.64,
    C.green, 18, true
  );

  await until(S(16));
  await play(
    ...remove(gapArrow, nullTag, claimLine),
    ...add(
      leftDev,
      rightDev,
      leftDevLabel,
      rightDevLabel,
      zeroDevLabel
    ),
    ...fbox([
      'distances from 17',
      ['−2, 0, 0, +2', C.amber]
    ], C.amber),
    ...say('STEP 1: HOW SPREAD OUT?', C.amber)
  );

  const spreadY = AX + 1.85;

  const sdBracket = bracket(
    hx(MEAN - SD),
    hx(MEAN + SD),
    spreadY,
    C.cyan
  );

  const sdText = txt(
    'typical spread',
    hx(MEAN),
    spreadY + 0.29,
    C.cyan, 17
  );

  await until(S(17));
  await play(
    ...remove(
      leftDev,
      rightDev,
      leftDevLabel,
      rightDevLabel,
      zeroDevLabel
    ),
    ...add(sdBracket, sdText),
    ...fbox([
      'squared distances = 8',
      'spread = √(8 ÷ 3)',
      ['SD ≈ 1.63 hours', C.cyan]
    ]),
    ...say('STANDARD DEVIATION ≈ 1.6 HOURS')
  );

  // ------------------------------------------------------------
  // 18: STEP TWO — THE WOBBLE OF A MEAN
  // Picture: a long spread bar and, later, a shorter mean bar.
  // Both use the same horizontal scale.
  // ------------------------------------------------------------

  const scale = P ? 1.85 : 2.0;
  const barH = P ? 0.36 : 0.32;

  const sdWidth = SD * scale;
  const seWidth = SE * scale;

  const upperY = P ? 0.05 : 0.2;
  const lowerY = P ? -2.7 : -1.5;

  const sdBar = new M.VGroup(
    rect(
      CX, upperY,
      sdWidth + 0.08,
      barH + 0.11,
      C.cyan, 0.13, 0
    ),
    rect(
      CX, upperY,
      sdWidth,
      barH,
      C.cyan, 0.82
    )
  );

  const individualLabel = txt(
    'SINGLE BATTERIES',
    CX, upperY + 0.55,
    C.cyan, 18
  );

  const individualValue = txt(
    '1.63 hours',
    CX, upperY - 0.48,
    C.cyan, 21, true
  );

  await until(S(18));
  await play(
    ...replace(
      sdBar,
      individualLabel,
      individualValue
    ),
    ...fbox([
      'spread of individuals',
      ['1.63 hours', C.cyan],
      'spread of the mean = ?'
    ]),
    ...say('STEP 2: HOW MUCH DOES A MEAN WOBBLE?')
  );

  // ------------------------------------------------------------
  // 19-20: WHY DIVIDE BY THE SQUARE ROOT OF FOUR?
  // Four squares arranged two across and two down.
  // ------------------------------------------------------------

  const squareSize = P ? 0.56 : 0.37;
  const squarePitch = P ? 0.68 : 0.46;
  const squareCY = P ? -1.75 : -1.3;
  const sqK = squarePitch / 0.46;

  const squares = [];

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      squares.push(
        rect(
          CX + (c - 0.5) * squarePitch,
          squareCY + (0.5 - r) * squarePitch,
          squareSize,
          squareSize,
          C.violet,
          0.75
        )
      );
    }
  }

  const squareGrid = new M.VGroup(...squares);

  const rootTop = bracket(
    CX - squarePitch,
    CX + squarePitch,
    squareCY + 0.64 * sqK,
    C.amber,
    0.09
  );

  const rootSide = new M.VGroup(
    line(
      CX + 0.69 * sqK, squareCY - squarePitch,
      CX + 0.69 * sqK, squareCY + squarePitch,
      C.amber, 2
    ),
    line(
      CX + 0.6 * sqK, squareCY - squarePitch,
      CX + 0.6 * sqK + 0.18, squareCY - squarePitch,
      C.amber, 2
    ),
    line(
      CX + 0.6 * sqK, squareCY + squarePitch,
      CX + 0.6 * sqK + 0.18, squareCY + squarePitch,
      C.amber, 2
    )
  );

  const rootQuestion = txt(
    '? × ? = 4',
    CX, squareCY - 0.75 * sqK,
    C.amber, 22, true
  );

  await until(S(19));
  await play(
    ...add(
      squareGrid,
      rootTop,
      rootSide,
      rootQuestion
    ),
    ...fbox([
      'mean wobble',
      '= 1.63 ÷ √4',
      ['√4 × √4 = 4', C.amber]
    ], C.amber),
    ...say('A MEAN WOBBLES LESS', C.green)
  );

  const rootAnswer = txt(
    '2 × 2 = 4',
    CX, squareCY - 0.75 * sqK,
    C.green, 22, true
  );

  await until(S(20));
  await play(
    ...remove(rootQuestion),
    ...add(rootAnswer),
    new M.Indicate(squareGrid, {
      color: C.green,
      runTime: 0.5
    })
  );

  // ------------------------------------------------------------
  // 21: STANDARD ERROR = 0.82 HOURS
  // ------------------------------------------------------------

  const seBar = new M.VGroup(
    rect(
      CX, lowerY,
      seWidth + 0.08,
      barH + 0.11,
      C.green, 0.13, 0
    ),
    rect(
      CX, lowerY,
      seWidth,
      barH,
      C.green, 0.88
    )
  );

  const meanWobbleLabel = txt(
    'MEAN OF FOUR BATTERIES',
    CX, lowerY + 0.56,
    C.green, 18
  );

  const meanWobbleValue = txt(
    '0.82 hours',
    CX, lowerY - 0.5,
    C.green, 21, true
  );

  await until(S(21));
  await play(
    ...remove(
      squareGrid,
      rootTop,
      rootSide,
      rootAnswer
    ),
    ...add(
      seBar,
      meanWobbleLabel,
      meanWobbleValue
    ),
    ...fbox([
      'standard error',
      'SE = SD ÷ √4',
      ['SE ≈ 0.82 hours', C.green]
    ], C.green),
    ...say('STANDARD ERROR ≈ 0.8 HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 22-24: STEP THREE — COUNT STANDARD ERRORS IN THE GAP
  // Three complete SE blocks and a final partial block.
  // ------------------------------------------------------------

  const rulerW = P ? 5.5 : 6.1;
  const rulerLeft = CX - rulerW / 2;
  const rulerRight = CX + rulerW / 2;

  const rulerY = P ? -0.75 : -0.55;
  const rulerScale = rulerW / Math.abs(GAP);

  const oneSE = SE * rulerScale;

  const gapBase = bracket(
    rulerLeft,
    rulerRight,
    rulerY + 0.95,
    C.amber
  );

  const gapCaption = txt(
    '3 HOURS',
    CX,
    rulerY + 1.3,
    C.amber, 21, true
  );

  const startTag = tag(
    '20',
    rulerRight - 0.02,
    rulerY + 0.43,
    C.amber, 17
  );

  const endTag = tag(
    '17',
    rulerLeft + 0.02,
    rulerY + 0.43,
    C.green, 17
  );

  const gapDirection = arrow(
    rulerRight,
    rulerY + 0.07,
    rulerLeft,
    rulerY + 0.07,
    C.amber
  );

  const unitKey = new M.VGroup(
    rect(
      CX,
      rulerY - 1.2,
      oneSE,
      0.34,
      C.green, 0.8
    ),
    txt(
      '1 standard error',
      CX,
      rulerY - 1.64,
      C.green, 17
    )
  );

  await until(S(22));
  await play(
    ...replace(
      gapBase,
      gapCaption,
      startTag,
      endTag,
      gapDirection,
      unitKey
    ),
    ...fbox([
      'gap = −3 hours',
      'one SE ≈ 0.82 hours',
      ['how many SEs fit?', C.amber]
    ], C.amber),
    ...say('STEP 3: COUNT THE STANDARD ERRORS', C.amber)
  );

  const totalUnits = Math.abs(TSTAT);
  const fullUnits = Math.floor(totalUnits);
  const fraction = totalUnits - fullUnits;

  const seBlocks = [];
  const seLabels = [];

  let cursor = rulerRight;

  for (let j = 0; j <= fullUnits; j++) {
    const amount = j < fullUnits ? 1 : fraction;
    const width = oneSE * amount;
    const x = cursor - width / 2;

    const block = rect(
      x,
      rulerY - 0.46,
      Math.max(0.04, width - 0.045),
      0.52,
      C.green,
      j < fullUnits ? 0.82 : 0.42
    );

    const label = txt(
      j < fullUnits ? '1' : '0.67',
      x,
      rulerY - 0.46,
      C.ink, 17, true
    );

    seBlocks.push(block);
    seLabels.push(label);

    cursor -= width;
  }

  const unitGroups = seBlocks.map((b, j) =>
    new M.VGroup(b, seLabels[j])
  );

  await until(S(23));

  picture.push(...unitGroups);

  await play(
    ...remove(unitKey),
    new M.LaggedStart(
      unitGroups.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.35,
        runTime: 2.2
      }
    ),
    ...fbox([
      'gap ÷ standard error',
      '−3 ÷ 0.82',
      ['≈ −3.67', C.amber]
    ], C.amber),
    ...say('ABOUT 3.7 STEPS TO THE LEFT', C.amber)
  );

  const tResult = tag(
    't ≈ −3.67',
    CX,
    rulerY - 1.45,
    C.violet, 22
  );

  await until(S(24));
  await play(
    ...add(tResult),
    ...fbox([
      ['t statistic', C.violet],
      'gap ÷ standard error',
      ['t ≈ −3.67', C.amber]
    ], C.violet),
    ...say('THIS NUMBER IS THE t STATISTIC', C.violet)
  );

  // ------------------------------------------------------------
  // REFERENCE DISTRIBUTIONS
  //
  // Student t density, df = 3:
  // f(x) = 2 / (pi * sqrt(3)) * (1 + x*x/3)^(-2)
  //
  // Normal and t densities are drawn on the same vertical scale.
  // Curves use only Line objects, avoiding a dependency on
  // version-specific graph or plotting APIs.
  // ------------------------------------------------------------

  const TXMIN = -7;
  const TXMAX = 7;

  const TW = P ? 5.9 : 6.9;
  const TY = P ? -2.85 : -1.55;
  const TH = P ? 6.4 : 5.7;

  const tx = v =>
    CX - TW / 2 +
    (v - TXMIN) / (TXMAX - TXMIN) * TW;

  const normalPDF = v =>
    Math.exp(-v * v / 2) / Math.sqrt(2 * Math.PI);

  const tPDF = v =>
    2 / (Math.PI * Math.sqrt(3)) *
    Math.pow(1 + v * v / 3, -2);

  const ny = v => TY + normalPDF(v) * TH;
  const ty = v => TY + tPDF(v) * TH;

  function tAxis() {
    const parts = [
      line(tx(TXMIN), TY, tx(TXMAX), TY, C.muted, 3)
    ];

    [-6, -4, -2, 0, 2, 4, 6].forEach(v => {
      parts.push(
        line(
          tx(v), TY - 0.08,
          tx(v), TY + 0.08,
          C.muted, 2
        )
      );

      parts.push(
        txt(
          v < 0 ? `−${Math.abs(v)}` : String(v),
          tx(v), TY - 0.32,
          C.muted, 17, true
        )
      );
    });

    parts.push(
      txt(
        't',
        tx(TXMAX) - 0.05,
        TY - 0.72,
        C.muted, 18, true
      )
    );

    return new M.VGroup(...parts);
  }

  function curve(
    fn,
    color,
    xmin = TXMIN,
    xmax = TXMAX,
    width = 3,
    samples = 140
  ) {
    const parts = [];

    for (let k = 0; k < samples; k++) {
      const v1 = xmin + (xmax - xmin) * k / samples;
      const v2 = xmin + (xmax - xmin) * (k + 1) / samples;

      parts.push(
        line(
          tx(v1), fn(v1),
          tx(v2), fn(v2),
          color, width
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Narrow filled rectangles approximate the area under a
  // density curve. Rectangle heights follow the true density.

  function area(
    xmin,
    xmax,
    color,
    opacity = 0.38,
    samples = 75
  ) {
    const parts = [];
    const dx = (xmax - xmin) / samples;

    for (let k = 0; k < samples; k++) {
      const a = xmin + k * dx;
      const b = a + dx;
      const mid = (a + b) / 2;

      const h = Math.max(
        0.001,
        tPDF(mid) * TH
      );

      parts.push(
        rect(
          tx(mid),
          TY + h / 2,
          tx(b) - tx(a) + 0.002,
          h,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bothTails(cut, color, opacity = 0.38) {
    return new M.VGroup(
      area(TXMIN, -cut, color, opacity),
      area(cut, TXMAX, color, opacity)
    );
  }

  function boundary(value, color, height = 0.95) {
    return dashed(
      tx(value), TY,
      tx(value), TY + height,
      color
    );
  }

  const bellAxis = tAxis();

  const normalCurve = curve(
    ny, C.muted,
    TXMIN, TXMAX,
    2.4
  );

  const studentCurve = curve(
    ty, C.cyan,
    TXMIN, TXMAX,
    3.5
  );

  const normalLegend = txt(
    'normal',
    CX - TW * 0.29,
    P ? 1.1 : 1.1,
    C.muted, 17
  );

  const studentLegend = txt(
    't curve',
    CX + TW * 0.29,
    P ? 1.1 : 1.1,
    C.cyan, 17
  );

  // ------------------------------------------------------------
  // 25-26: WHY WE NEED A REFERENCE CURVE
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...replace(bellAxis, normalCurve),
    ...fbox([
      ['observed t ≈ −3.67', C.amber],
      'is that unusual?'
    ], C.amber),
    ...say('IS −3.7 FAR FROM ZERO?', C.violet)
  );

  const uncertaintyTag = tag(
    'SPREAD ESTIMATED FROM 4',
    CX,
    TY + 3.0,
    C.violet, 16
  );

  await until(S(26));
  await play(
    ...add(uncertaintyTag),
    ...fbox([
      'only 4 batteries',
      'true spread unknown',
      ['extra uncertainty', C.violet]
    ], C.violet),
    ...say('SMALL SAMPLE = LESS CERTAINTY', C.violet)
  );

  // ------------------------------------------------------------
  // 27-28: THE t CURVE HAS FATTER TAILS
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...remove(uncertaintyTag),
    ...add(
      studentCurve,
      normalLegend,
      studentLegend
    ),
    ...say('USE THE t CURVE INSTEAD OF NORMAL')
  );

  const tailHighlights = new M.VGroup(
    curve(
      ty, C.amber,
      TXMIN, -2,
      5, 65
    ),
    curve(
      ty, C.amber,
      2, TXMAX,
      5, 65
    )
  );

  const leftTailArrow = arrow(
    tx(-4.9), TY + 0.95,
    tx(-3.7), ty(-3.7) + 0.07,
    C.amber
  );

  const rightTailArrow = arrow(
    tx(4.9), TY + 0.95,
    tx(3.7), ty(3.7) + 0.07,
    C.amber
  );

  await until(S(28));
  await play(
    ...add(
      tailHighlights,
      leftTailArrow,
      rightTailArrow
    ),
    ...fbox([
      ['fatter tails', C.amber],
      'extreme values are',
      'more common by chance'
    ], C.amber),
    ...say('THE t CURVE HAS FATTER TAILS', C.amber)
  );

  // ------------------------------------------------------------
  // 29: DEGREES OF FREEDOM
  // ------------------------------------------------------------

  const dfLabel = tag(
    'df = 3',
    CX + TW * 0.29,
    P ? 0.45 : 0.47,
    C.violet, 17
  );

  await until(S(29));
  await play(
    ...remove(
      tailHighlights,
      leftTailArrow,
      rightTailArrow,
      normalCurve,
      normalLegend
    ),
    ...add(dfLabel),
    ...fbox([
      'degrees of freedom',
      'count − 1',
      ['4 − 1 = 3', C.violet]
    ], C.violet),
    ...say('DEGREES OF FREEDOM SET THE SHAPE', C.violet)
  );

  // ------------------------------------------------------------
  // 30: THE TWO-SIDED FIVE-PERCENT CUTOFF
  // ------------------------------------------------------------

  const criticalShade = bothTails(
    CRIT,
    C.amber,
    0.58
  );

  const criticalLeft = boundary(
    -CRIT, C.amber, 1.18
  );

  const criticalRight = boundary(
    CRIT, C.amber, 1.18
  );

  const criticalLeftLabel = txt(
    '−3.18',
    tx(-CRIT),
    TY + 1.4,
    C.amber, 18, true
  );

  const criticalRightLabel = txt(
    '+3.18',
    tx(CRIT),
    TY + 1.4,
    C.amber, 18, true
  );

  const leftCriticalPercent = txt(
    '2.5%',
    tx(-5.3),
    TY + 0.48,
    C.amber, 16, true
  );

  const rightCriticalPercent = txt(
    '2.5%',
    tx(5.3),
    TY + 0.48,
    C.amber, 16, true
  );

  await until(S(30));
  await play(
    ...add(
      criticalShade,
      criticalLeft,
      criticalRight,
      criticalLeftLabel,
      criticalRightLabel,
      leftCriticalPercent,
      rightCriticalPercent
    ),
    ...fbox([
      'df = 3',
      'cutoffs = ±3.18',
      ['2.5% + 2.5% = 5%', C.amber]
    ], C.amber),
    ...say('ONLY 5% FALL IN THESE TWO TAILS', C.amber)
  );

  // ------------------------------------------------------------
  // 31: HOW EXTREME IS OUR OBSERVED t?
  // The negative observation is marked separately from its
  // positive mirror, which is used for the two-sided test.
  // ------------------------------------------------------------

  const absT = Math.abs(TSTAT);

  const observedLeft = boundary(
    TSTAT, C.amber, 1.45
  );

  const observedRight = boundary(
    absT, C.violet, 1.45
  );

  const observedLeftLabel = txt(
    '−3.67',
    tx(TSTAT),
    TY + 1.69,
    C.amber, 19, true
  );

  const observedRightLabel = txt(
    '+3.67',
    tx(absT),
    TY + 1.69,
    C.violet, 19, true
  );

  const observedDot = dot(
    tx(TSTAT),
    TY,
    C.amber,
    0.11
  );

  const observedTag = txt(
    'observed',
    tx(TSTAT),
    TY + 2.02,
    C.amber, 15
  );

  const mirrorTag = txt(
    'equally far',
    tx(absT),
    TY + 2.02,
    C.violet, 15
  );

  const observedShade = bothTails(
    absT,
    C.violet,
    0.76
  );

  await until(S(31));
  await play(
    ...remove(
      dfLabel,
      criticalShade,
      criticalLeft,
      criticalRight,
      criticalLeftLabel,
      criticalRightLabel,
      leftCriticalPercent,
      rightCriticalPercent
    ),
    ...add(
      observedShade,
      observedLeft,
      observedRight,
      observedLeftLabel,
      observedRightLabel,
      observedDot,
      observedTag,
      mirrorTag
    ),
    ...fbox([
      ['under the null', C.violet],
      't ≤ −3.67 or t ≥ +3.67',
      'how often?'
    ], C.violet),
    ...say('COUNT BOTH EQUALLY EXTREME TAILS', C.violet)
  );

  // ------------------------------------------------------------
  // 32: THE P-VALUE
  // ------------------------------------------------------------

  const pLeft = txt(
    '≈ 1.75%',
    tx(-5.2),
    TY + 0.46,
    C.violet, 16, true
  );

  const pRight = txt(
    '≈ 1.75%',
    tx(5.2),
    TY + 0.46,
    C.violet, 16, true
  );

  const pTag = tag(
    'p ≈ 3.5%',
    CX,
    TY - 1.04,
    C.violet, 20
  );

  await until(S(32));
  await play(
    ...add(pLeft, pRight, pTag),
    ...fbox([
      'chance under the null',
      'of a result this extreme',
      ['p ≈ 0.035 = 3.5%', C.violet]
    ], C.violet),
    ...say('THIS CHANCE IS THE p-VALUE', C.violet)
  );

  // ------------------------------------------------------------
  // 33: COMPARE p WITH 5%
  // ------------------------------------------------------------

  await until(S(33));
  await play(
    new M.Indicate(pTag, { color: C.green }),
    ...fbox([
      'p-value = 3.5%',
      'cutoff  = 5%',
      ['3.5% < 5%', C.green]
    ], C.green),
    ...say('3.5% IS BELOW 5%', C.green)
  );

  // ------------------------------------------------------------
  // 34: REJECT THE NULL HYPOTHESIS
  // ------------------------------------------------------------

  const rejectTag = tag(
    'REJECT THE NULL',
    CX,
    TY - (P ? 1.68 : 1.58),
    C.green, 21
  );

  await until(S(34));
  await play(
    ...add(rejectTag),
    ...fbox([
      ['reject the null', C.green],
      'data are hard to explain',
      'with a true mean of 20'
    ], C.green),
    ...say('THE DATA ARE HARD TO EXPLAIN BY CHANCE', C.green)
  );

  // ------------------------------------------------------------
  // 35: THE NAME OF THE TEST
  // ------------------------------------------------------------

  await until(S(35));
  await play(
    new M.Indicate(rejectTag, { color: C.green }),
    ...say('THE ONE-SAMPLE t-TEST', C.green)
  );

  // ------------------------------------------------------------
  // RETURN TO THE ORIGINAL DATA
  // Build fresh objects rather than reusing or regrouping
  // objects that have already been removed from the scene.
  // ------------------------------------------------------------

  function samplePicture(withGap = true) {
    const parts = [hoursAxis()];

    A.forEach((v, k) => {
      const repeats = A
        .slice(0, k)
        .filter(n => n === v)
        .length;

      parts.push(readingDot(v, repeats));
    });

    const meanMarker = new M.VGroup(
      line(
        hx(MEAN), AX - 0.54,
        hx(MEAN), AX - 0.85,
        C.green, 3
      ),
      tag(
        'MEAN: 17',
        hx(MEAN),
        AX - 1.12,
        C.green, 16
      )
    );

    const claimMarker = new M.VGroup(
      dashed(
        hx(CLAIM), AX + 0.08,
        hx(CLAIM), AX + 1.34,
        C.amber
      ),
      tag(
        'CLAIM: 20',
        hx(CLAIM),
        AX + 1.69,
        C.amber, 15
      )
    );

    parts.push(meanMarker, claimMarker);

    if (withGap) {
      parts.push(
        arrow(
          hx(CLAIM) - 0.07,
          AX + 1.12,
          hx(MEAN) + 0.07,
          AX + 1.12,
          C.amber
        )
      );

      parts.push(
        txt(
          '−3 hours',
          (hx(MEAN) + hx(CLAIM)) / 2,
          AX + 1.49,
          C.amber, 20, true
        )
      );
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 36: ONE MEASURED GROUP AGAINST ONE FIXED CLAIM
  // ------------------------------------------------------------

  const sampleObjects = samplePicture(false);

  const sampleBox = outline(
    (hx(15) + hx(19)) / 2,
    AX + 0.54,
    hx(19) - hx(15) + 0.55,
    1.03,
    C.cyan
  );

  const sampleLabel = tag(
    'ONE SAMPLE',
    hx(MEAN),
    AX + 1.42,
    C.cyan, 17
  );

  await until(S(36));
  await play(
    ...replace(
      ...sampleObjects,
      sampleBox,
      sampleLabel
    ),
    ...fbox([
      ['one measured group', C.cyan],
      'compared against',
      ['one fixed claim', C.amber]
    ]),
    ...say('SAMPLE = THE GROUP WE ACTUALLY MEASURED')
  );

  // ------------------------------------------------------------
  // 37: THE SHORT VERSION
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...remove(sampleBox, sampleLabel),
    ...fbox([
      ['the short version', C.cyan],
      'gap',
      '÷ standard error'
    ]),
    ...say('THE FORMULA IN ONE LINE')
  );

  // ------------------------------------------------------------
  // 38: THE FORMULA
  // ------------------------------------------------------------

  const formulaGap = arrow(
    hx(CLAIM) - 0.07,
    AX + 1.05,
    hx(MEAN) + 0.07,
    AX + 1.05,
    C.amber
  );

  const formulaGapLabel = txt(
    '17 − 20 = −3',
    (hx(MEAN) + hx(CLAIM)) / 2,
    AX + 1.4,
    C.amber, 19, true
  );

  await until(S(38));
  await play(
    ...add(formulaGap, formulaGapLabel),
    ...fbox([
      't = (mean − claim) ÷ SE',
      '  = (17 − 20) ÷ 0.82',
      ['  ≈ −3.67', C.amber]
    ]),
    ...say('t = GAP ÷ STANDARD ERROR', C.cyan)
  );

  // ------------------------------------------------------------
  // 39: THE FORMULA IN WORDS
  // Show the same four ruler pieces again.
  // ------------------------------------------------------------

  const recallBlocks = [];

  let recallCursor = rulerRight;

  for (let j = 0; j <= fullUnits; j++) {
    const amount = j < fullUnits ? 1 : fraction;
    const width = oneSE * amount;
    const x = recallCursor - width / 2;

    recallBlocks.push(
      new M.VGroup(
        rect(
          x,
          rulerY - 0.45,
          Math.max(0.04, width - 0.045),
          0.52,
          C.green,
          j < fullUnits ? 0.82 : 0.42
        ),
        txt(
          j < fullUnits ? '1 SE' : '0.67',
          x,
          rulerY - 0.45,
          C.ink, P ? 15 : 16, true
        )
      )
    );

    recallCursor -= width;
  }

  const recallArrow = arrow(
    rulerRight,
    rulerY + 0.23,
    rulerLeft,
    rulerY + 0.23,
    C.amber
  );

  const recallLabel = tag(
    '3.67 STANDARD ERRORS LEFT',
    CX,
    rulerY + 0.88,
    C.amber, 17
  );

  const recallResult = tag(
    't ≈ −3.67',
    CX,
    rulerY - 1.35,
    C.violet, 21
  );

  await until(S(39));
  await play(
    ...replace(
      recallArrow,
      recallLabel,
      ...recallBlocks,
      recallResult
    ),
    ...say('THE GAP, MEASURED IN STANDARD ERRORS', C.amber)
  );

  // ------------------------------------------------------------
  // 40: WHAT IS THE TEST FOR?
  // ------------------------------------------------------------

  const useY = P ? -0.4 : -0.35;

  const useBattery = battery(
    CX - 1.9,
    useY,
    0.85,
    C.cyan,
    0.95,
    1.45
  );

  const useBatteryLabel = txt(
    'measured group',
    CX - 1.9,
    useY - 1.05,
    C.cyan, 16
  );

  const targetX = CX + 1.9;

  const targetOuter = new M.Circle({
    radius: 0.72,
    color: C.amber,
    strokeWidth: 3
  });

  targetOuter.moveTo(pt(targetX, useY));

  const targetMiddle = new M.Circle({
    radius: 0.47,
    color: C.amber,
    strokeWidth: 2
  });

  targetMiddle.moveTo(pt(targetX, useY));

  const targetCenter = new M.Dot({
    point: pt(targetX, useY),
    radius: 0.16,
    color: C.amber
  });

  const target = new M.VGroup(
    targetOuter,
    targetMiddle,
    targetCenter
  );

  const targetLabel = txt(
    'fixed target',
    targetX,
    useY - 1.05,
    C.amber, 16
  );

  const compareArrow = new M.VGroup(
    arrow(
      CX - 0.75, useY + 0.13,
      CX + 0.75, useY + 0.13,
      C.muted
    ),
    arrow(
      CX + 0.75, useY - 0.13,
      CX - 0.75, useY - 0.13,
      C.muted
    )
  );

  await until(S(40));
  await play(
    ...replace(
      useBattery,
      useBatteryLabel,
      target,
      targetLabel,
      compareArrow
    ),
    ...fbox([
      'one group against a',
      ['target', C.amber],
      ['promise or standard', C.amber]
    ]),
    ...say('CHECK A MEAN AGAINST A FIXED TARGET')
  );

  // ------------------------------------------------------------
  // 41-42: COMMON TRAP
  // Statistical significance is not practical importance.
  // The two bars below use the same physical time scale.
  // Three hours = 180 minutes, versus three minutes.
  // ------------------------------------------------------------

  const trapTop = P ? 0.35 : 0.55;
  const trapBottom = P ? -1.85 : -1.45;

  const trapW = P ? 5.25 : 5.5;
  const trapLeft = CX - trapW / 2;

  const longBar = new M.VGroup(
    rect(
      CX, trapTop,
      trapW, 0.44,
      C.amber, 0.84
    ),
    txt(
      '3 hours',
      CX, trapTop + 0.62,
      C.amber, 22, true
    )
  );

  const shortWidth = trapW / 60;

  const shortBar = new M.VGroup(
    line(
      trapLeft, trapBottom - 0.31,
      trapLeft + trapW, trapBottom - 0.31,
      C.muted, 1
    ),
    rect(
      trapLeft + shortWidth / 2,
      trapBottom,
      shortWidth,
      0.44,
      C.cyan, 0.94
    ),
    txt(
      '3 minutes',
      CX, trapBottom + 0.62,
      C.cyan, 22, true
    ),
    arrow(
      trapLeft + 0.65,
      trapBottom + 0.65,
      trapLeft + shortWidth / 2,
      trapBottom + 0.3,
      C.cyan
    )
  );

  const significanceTag = tag(
    'SMALL p-VALUE',
    CX,
    P ? -0.75 : -0.45,
    C.violet, 19
  );

  await until(S(41));
  await play(
    ...replace(significanceTag),
    ...fbox([
      ['small p-value', C.violet],
      'does not mean',
      ['large or important gap', C.amber]
    ], C.amber),
    ...say('TRAP: SIGNIFICANT ≠ IMPORTANT', C.amber)
  );

  const matters = tag(
    'MATTERS HERE',
    CX,
    trapTop - 0.61,
    C.amber, 16
  );

  const smallEffect = tag(
    'MUCH SMALLER GAP',
    CX,
    trapBottom - 0.79,
    C.muted, 16
  );

  await until(S(42));
  await play(
    ...replace(
      longBar,
      shortBar,
      matters,
      smallEffect
    ),
    ...fbox([
      'p-value: evidence',
      'gap size: importance',
      ['different questions', C.amber]
    ], C.amber),
    ...say('ASK HOW MUCH THE GAP MATTERS', C.amber)
  );

  // ------------------------------------------------------------
  // 43: CHECK THE ASSUMPTIONS
  // Four independent batteries, roughly bell-shaped population.
  // The sample is too small to establish normality by itself.
  // ------------------------------------------------------------

  const checkY = P ? -0.15 : 0.28;

  const independenceIcons = A.map((_, k) =>
    battery(
      CX + (k - 1.5) * (P ? 1.02 : 1.08),
      checkY,
      0.82,
      C.cyan,
      0.57,
      0.86
    )
  );

  const independenceLabel = txt(
    'ONE DOES NOT AFFECT ANOTHER',
    CX,
    checkY + 0.85,
    C.green, P ? 16 : 17
  );

  const checkAxis = hoursAxis();

  const checkDots = A.map((v, k) =>
    readingDot(
      v,
      A.slice(0, k).filter(n => n === v).length
    )
  );

  const checkBox = outline(
    (hx(15) + hx(19)) / 2,
    AX + 0.52,
    hx(19) - hx(15) + 0.55,
    1.04,
    C.green
  );

  const lookLabel = txt(
    'LOOK AT THE FOUR DOTS FIRST',
    CX,
    P ? -4.05 : -2.47,
    C.green, P ? 17 : 16
  );

  await until(S(43));
  await play(
    ...replace(
      ...independenceIcons,
      independenceLabel
    ),
    ...fbox([
      'check assumptions',
      ['independent readings', C.green],
      ['roughly bell-shaped', C.green]
    ], C.green),
    ...say('BEFORE TESTING: CHECK THE ASSUMPTIONS', C.green)
  );

  // During the same narration sentence, return to the four
  // measured readings when the learner is told to inspect them.

  await until(S(43) + 6.2);
  await play(
    ...replace(
      checkAxis,
      ...checkDots,
      checkBox,
      lookLabel
    ),
    ...fbox([
      'only four readings',
      'inspect the dots first',
      ['normality is uncertain', C.amber]
    ], C.amber),
    ...say('WITH FOUR BATTERIES, LOOK AT THE DOTS', C.green)
  );

  // ------------------------------------------------------------
  // 44: ONE-SENTENCE SUMMARY
  // Reconnect the observed data, gap, t statistic and p-value.
  // ------------------------------------------------------------

  const finalObjects = samplePicture(true);

  const finalTitle = tag(
    'ONE-SAMPLE t-TEST',
    CX,
    P ? 1.25 : 1.15,
    C.green, 21
  );

  const finalT = tag(
    't ≈ −3.67',
    CX - (P ? 1.38 : 1.48),
    P ? -4.3 : -3.12,
    C.violet, 17
  );

  const finalP = tag(
    'p ≈ 3.5%',
    CX + (P ? 1.38 : 1.48),
    P ? -4.3 : -3.12,
    C.green, 17
  );

  await until(S(44));
  await play(
    ...replace(
      ...finalObjects,
      finalTitle,
      finalT,
      finalP
    ),
    ...fbox([
      'gap ÷ standard error',
      ['t ≈ −3.67', C.violet],
      ['p ≈ 3.5% < 5%', C.green]
    ], C.green),
    ...say('MEASURE THE GAP. THEN ASK CHANCE.', C.green)
  );

  await until(E(44));

  // Uses the supplied engine interface and reference conventions.
  // Browser rendering and playback have not been runtime-tested
  // against the actual site/live/engine.js installation.
}

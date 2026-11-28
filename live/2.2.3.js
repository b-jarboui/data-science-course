// lesson 2.2.3
// Grouped distributions: comparing dry and rainy hours on a common ruler.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser playback has not been verified.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data: midday bike rentals.
  const DRY = [30, 35, 40, 42, 45, 50];
  const RAIN = [10, 12, 15, 18, 20];

  const DRY_MEDIAN = 41;
  const RAIN_MEDIAN = 15;

  // Shared chapter colours.
  const DC = C.cyan;
  const RC = C.violet;
  const MC = C.amber;

  // Laptop and phone layouts.
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 2.35, 0] : [CX, 1.90, 0];
  const BOXP = P ? [0, 3.50, 0] : [4.45, -0.15, 0];

  const XL = P ? -3.20 : -5.90;
  const XR = P ? 3.20 : 1.65;

  const DRY_Y = P ? 0.15 : 0.48;
  const RAIN_Y = P ? -2.55 : -0.90;
  const AXIS_Y = P ? -4.90 : -2.12;

  const MAX = 55;
  const X = n => XL + n / MAX * (XR - XL);

  const dryPos = n => [X(n), DRY_Y, 0];
  const rainPos = n => [X(n), RAIN_Y, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function textAt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function line(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: 2
    });
  }

  function outline(p, w, h, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.moveTo(p);
    return r;
  }

  function fadeAll(objects) {
    return objects.map(o => new M.FadeOut(o));
  }

  // Information and formula box.
  // Follows the approved reference lesson's structure.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.39 : 0.42;

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

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.35;

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
    const top = BOXP[1] + ht / 2 - 0.175 - lh / 2;

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
    const maxw = P ? FW - 1.20 : 3.85;

    if (wd > maxw) {
      g.scale(maxw / wd);
      g.moveTo(BOXP);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  // Weather icons.
  function sun(cx, cy, scale = 1) {
    const center = new M.Circle({
      radius: 0.34 * scale,
      color: C.amber,
      strokeWidth: 2
    });

    center.setFill(C.amber, 0.65);
    center.moveTo([cx, cy, 0]);

    const rays = [];

    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;

      rays.push(line(
        [
          cx + Math.cos(a) * 0.45 * scale,
          cy + Math.sin(a) * 0.45 * scale,
          0
        ],
        [
          cx + Math.cos(a) * 0.65 * scale,
          cy + Math.sin(a) * 0.65 * scale,
          0
        ],
        C.amber,
        3
      ));
    }

    return new M.VGroup(center, ...rays);
  }

  function rainCloud(cx, cy, scale = 1) {
    const circles = [
      [-0.43, 0.10, 0.33],
      [0, 0.28, 0.43],
      [0.43, 0.10, 0.33]
    ].map(([x, y, r]) => {
      const c = new M.Circle({
        radius: r * scale,
        color: RC,
        strokeWidth: 2
      });

      c.setFill(RC, 0.70);

      c.moveTo([
        cx + x * scale,
        cy + y * scale,
        0
      ]);

      return c;
    });

    const base = new M.RoundedRectangle({
      width: 1.35 * scale,
      height: 0.43 * scale,
      cornerRadius: 0.18 * scale,
      color: RC,
      strokeWidth: 1
    });

    base.setFill(RC, 0.85);
    base.moveTo([cx, cy - 0.07 * scale, 0]);

    const drops = [-0.40, 0, 0.40].map(x =>
      line(
        [
          cx + x * scale,
          cy - 0.40 * scale,
          0
        ],
        [
          cx + (x - 0.12) * scale,
          cy - 0.73 * scale,
          0
        ],
        RC,
        4
      )
    );

    return new M.VGroup(...circles, base, ...drops);
  }

  function bike(cx, cy, scale = 1, color = C.ink) {
    const p = (x, y) => [
      cx + x * scale,
      cy + y * scale,
      0
    ];

    const wheels = [-0.85, 0.85].map(x => {
      const w = new M.Circle({
        radius: 0.47 * scale,
        color,
        strokeWidth: 3
      });

      w.moveTo(p(x, -0.20));
      return w;
    });

    const frame = [
      [-0.85, -0.20, -0.35, 0.54],
      [-0.35, 0.54, 0.05, -0.20],
      [0.05, -0.20, -0.85, -0.20],
      [-0.35, 0.54, 0.57, 0.54],
      [0.57, 0.54, 0.05, -0.20],
      [0.57, 0.54, 0.85, -0.20],
      [0.57, 0.54, 0.45, 0.90],
      [0.45, 0.90, 0.78, 0.90],
      [-0.35, 0.54, -0.47, 0.77],
      [-0.68, 0.77, -0.26, 0.77]
    ].map(([x1, y1, x2, y2]) =>
      line(p(x1, y1), p(x2, y2), color, 3)
    );

    return new M.VGroup(...wheels, ...frame);
  }

  // 0-1: introduce the comparison.
  function weatherCard(cx, cy, rainy = false) {
    const color = rainy ? RC : DC;
    const w = P ? 2.85 : 2.70;
    const h = 2.70;

    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.20,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo([cx, cy, 0]);

    const icon = rainy
      ? rainCloud(cx, cy + 0.65, 0.70)
      : sun(cx, cy + 0.65, 0.80);

    const bicycle = bike(
      cx,
      cy - 0.35,
      0.57,
      color
    );

    const lab = textAt(
      rainy ? 'RAINY' : 'DRY',
      21,
      color,
      [cx, cy - 1.02, 0],
      true
    );

    const g = new M.VGroup(r, icon, bicycle, lab);
    if (P) { g.scale(1.25); g.moveTo([cx, cy, 0]); }
    return g;
  }

  const introY = P ? -0.55 : -0.40;
  const introSP = P ? 3.30 : 3.15;

  // Phone: stack the two cards and use the whole height.
  const dryCard = weatherCard(
    P ? 0 : CX - introSP / 2,
    P ? -0.05 : introY,
    false
  );

  const rainyCard = weatherCard(
    P ? 0 : CX + introSP / 2,
    P ? -3.85 : introY,
    true
  );

  await until(S(0));
  await play(
    new M.FadeIn(dryCard),
    new M.FadeIn(rainyCard),
    ...say('DRY DAYS AND RAINY DAYS')
  );

  await until(S(1));
  await play(
    new M.Indicate(rainyCard, { color: RC }),
    ...say('DO WE NEED AS MANY BIKES IN THE RAIN?', MC),
    ...fbox([
      ['dry midday hours', DC],
      ['rainy midday hours', RC],
      ['how do they compare?', MC]
    ], MC)
  );

  // 2: one recorded number for each midday hour.
  function recordTile(cx, cy, k, color, rainy) {
    const r = new M.RoundedRectangle({
      width: P ? 1.00 : 0.85,
      height: P ? 1.05 : 0.78,
      cornerRadius: 0.10,
      color,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.90);
    r.moveTo([cx, cy, 0]);

    const t = textAt(
      String(k + 1),
      P ? 20 : 17,
      color,
      [cx, cy + (P ? 0.20 : 0.14), 0],
      true
    );

    const d = new M.Dot({
      point: [cx, cy - (P ? 0.24 : 0.18), 0],
      radius: P ? 0.09 : 0.07,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(r, t, d);
  }

  const recDryY = P ? 0.00 : 0.40;
  const recRainY = P ? -3.40 : -1.05;
  const recSP = P ? 1.15 : 0.99;

  const dryRecords = DRY.map((_, k) =>
    recordTile(
      CX + (k - 2.5) * recSP,
      recDryY,
      k,
      DC,
      false
    )
  );

  const rainRecords = RAIN.map((_, k) =>
    recordTile(
      CX + (k - 2) * recSP,
      recRainY,
      k,
      RC,
      true
    )
  );

  const dryRecLabel = textAt(
    '6 dry hours',
    19,
    DC,
    [CX, recDryY + (P ? 0.85 : 0.68), 0]
  );

  const rainRecLabel = textAt(
    '5 rainy hours',
    19,
    RC,
    [CX, recRainY + (P ? 0.85 : 0.68), 0]
  );

  await until(S(2));
  await play(
    new M.FadeOut(dryCard),
    new M.FadeOut(rainyCard),
    new M.FadeIn(dryRecLabel),
    new M.FadeIn(rainRecLabel),

    new M.LaggedStart(
      [...dryRecords, ...rainRecords].map(
        r => new M.FadeIn(r)
      ),
      { lagRatio: 0.08, runTime: 1.70 }
    ),

    ...say('ONE RENTAL COUNT PER MIDDAY HOUR'),
    ...fbox([
      ['11 recorded hours', C.ink],
      ['6 dry', DC],
      ['5 rainy', RC]
    ])
  );

  // 3-5: construct two rows and one shared ruler.
  const dryRow = line(
    [XL, DRY_Y, 0],
    [XR, DRY_Y, 0],
    DC,
    1.7
  );

  const rainRow = line(
    [XL, RAIN_Y, 0],
    [XR, RAIN_Y, 0],
    RC,
    1.7
  );

  const dryRowTag = pill(
    'DRY HOURS',
    DC,
    P ? 17 : 16
  );

  dryRowTag.moveTo([
    XL + 0.90,
    DRY_Y + 0.67,
    0
  ]);

  const rainRowTag = pill(
    'RAINY HOURS',
    RC,
    P ? 17 : 16
  );

  rainRowTag.moveTo([
    XL + 1.05,
    RAIN_Y + 0.67,
    0
  ]);

  const axis = line(
    [XL, AXIS_Y, 0],
    [XR, AXIS_Y, 0],
    C.muted,
    3
  );

  const ticks = [0, 10, 20, 30, 40, 50].map(v => {
    const mark = line(
      [X(v), AXIS_Y - 0.08, 0],
      [X(v), AXIS_Y + 0.08, 0],
      C.muted,
      2
    );

    const lab = textAt(
      String(v),
      P ? 18 : 17,
      C.muted,
      [X(v), AXIS_Y - 0.29, 0],
      true
    );

    return new M.VGroup(mark, lab);
  });

  const axisTitle = textAt(
    'Bikes rented',
    P ? 21 : 19,
    C.ink,
    [
      (XL + XR) / 2,
      AXIS_Y - 0.68,
      0
    ]
  );

  const ruler = new M.VGroup(
    axis,
    ...ticks,
    axisTitle
  );

  const gridLines = [0, 10, 20, 30, 40, 50].map(v =>
    line(
      [X(v), AXIS_Y, 0],
      [X(v), DRY_Y + 0.20, 0],
      C.card,
      1.5
    )
  );

  const grid = new M.VGroup(...gridLines);

  await until(S(3));
  await play(
    ...fadeAll([
      ...dryRecords,
      ...rainRecords,
      dryRecLabel,
      rainRecLabel
    ]),

    new M.Create(dryRow),
    new M.Create(rainRow),
    new M.FadeIn(dryRowTag),
    new M.FadeIn(rainRowTag),

    ...say('TWO ROWS: ONE FOR EACH GROUP'),
    ...fbox([
      ['dry hours', DC],
      ['rainy hours', RC]
    ])
  );

  await until(S(4));
  await play(
    new M.FadeIn(grid),
    new M.FadeIn(ruler),
    ...say('ONE COMMON RULER', C.green),
    ...fbox([
      ['same starting point', C.ink],
      ['same number scale', C.ink],
      ['bikes rented', C.green]
    ], C.green)
  );

  const commonGuide = dashed(
    [X(30), AXIS_Y, 0],
    [X(30), DRY_Y + 0.18, 0],
    C.green
  );

  const commonDryMark = new M.Circle({
    radius: 0.13,
    color: C.green,
    strokeWidth: 2
  });

  commonDryMark.moveTo(dryPos(30));

  const commonRainMark = new M.Circle({
    radius: 0.13,
    color: C.green,
    strokeWidth: 2
  });

  commonRainMark.moveTo(rainPos(30));

  await until(S(5));
  await play(
    new M.Create(commonGuide),
    new M.FadeIn(commonDryMark),
    new M.FadeIn(commonRainMark),
    ...say('THE SAME POSITION MEANS THE SAME COUNT', C.green),
    ...fbox([
      ['30 in the dry row', DC],
      ['30 in the rainy row', RC],
      ['same horizontal position', C.green]
    ], C.green)
  );

  // Glowing data marks.
  // Dot diameters are kept small enough to distinguish counts 2 apart.
  function glowingDot(p, color) {
    const halo = new M.Dot({
      point: p,
      radius: P ? 0.105 : 0.115,
      color
    });

    halo.setFill(color, 0.18);

    const middle = new M.Dot({
      point: p,
      radius: P ? 0.080 : 0.085,
      color
    });

    middle.setFill(color, 0.45);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.060 : 0.065,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(halo, middle, core);
  }

  const dryDots = DRY.map(n =>
    glowingDot(dryPos(n), DC)
  );

  const rainDots = RAIN.map(n =>
    glowingDot(rainPos(n), RC)
  );

  function valueLabel(n, y, color, offset = 0.34) {
    return textAt(
      String(n),
      P ? 18 : 18,
      color,
      [X(n), y + offset, 0],
      true
    );
  }

  let activeLabels = [];
  let activeGuides = [];

  function clearActive() {
    const a = fadeAll([
      ...activeLabels,
      ...activeGuides
    ]);

    activeLabels = [];
    activeGuides = [];

    return a;
  }

  function placeDots(
    data,
    dots,
    indices,
    y,
    color
  ) {
    const a = clearActive();

    const labels = indices.map((k, j) => {
      const close =
        j > 0 &&
        Math.abs(data[k] - data[indices[j - 1]]) <= 3;

      return valueLabel(
        data[k],
        y,
        color,
        close ? 0.61 : 0.33
      );
    });

    const guides = indices.map(k =>
      dashed(
        [X(data[k]), AXIS_Y, 0],
        [X(data[k]), y, 0],
        color
      )
    );

    const sequence = [];

    indices.forEach((k, j) => {
      sequence.push(new M.Create(guides[j]));
      sequence.push(new M.FadeIn(dots[k]));
      sequence.push(new M.FadeIn(labels[j]));
    });

    activeLabels = labels;
    activeGuides = guides;

    a.push(new M.LaggedStart(
      sequence,
      {
        lagRatio: 0.18,
        runTime: indices.length === 1 ? 0.75 : 1.25
      }
    ));

    return a;
  }

  // 6-9: build the dry distribution.
  await until(S(6));
  await play(
    ...fadeAll([
      commonGuide,
      commonDryMark,
      commonRainMark
    ]),
    new M.Indicate(dryRowTag, { color: DC }),
    ...say('START WITH THE DRY ROW', DC),
    ...fbox([
      ['dry midday hours', DC],
      ['6 recorded counts', C.ink]
    ], DC)
  );

  await until(S(7));
  await play(
    ...placeDots(DRY, dryDots, [0, 1], DRY_Y, DC),
    ...say('30 AND 35 RENTALS', DC),
    ...fbox([
      ['dry hours', DC],
      ['30, 35', DC]
    ], DC)
  );

  await until(S(8));
  await play(
    ...placeDots(DRY, dryDots, [2, 3], DRY_Y, DC),
    ...say('40 AND 42 RENTALS', DC),
    ...fbox([
      ['dry hours', DC],
      ['30, 35, 40, 42', DC]
    ], DC)
  );

  await until(S(9));
  await play(
    ...placeDots(DRY, dryDots, [4, 5], DRY_Y, DC),
    ...say('45 AND 50 RENTALS', DC),
    ...fbox([
      ['6 dry hours', DC],
      ['30, 35, 40', DC],
      ['42, 45, 50', DC]
    ], DC)
  );

  // 10-13: build the rainy distribution on the same ruler.
  await until(S(10));
  await play(
    ...clearActive(),
    new M.Indicate(rainRowTag, { color: RC }),
    ...say('NOW USE THE RAINY ROW', RC),
    ...fbox([
      ['rainy midday hours', RC],
      ['5 recorded counts', C.ink],
      ['same ruler', C.green]
    ], RC)
  );

  await until(S(11));
  await play(
    ...placeDots(RAIN, rainDots, [0, 1], RAIN_Y, RC),
    ...say('10 AND 12 RENTALS', RC),
    ...fbox([
      ['rainy hours', RC],
      ['10, 12', RC]
    ], RC)
  );

  await until(S(12));
  await play(
    ...placeDots(RAIN, rainDots, [2], RAIN_Y, RC),
    ...say('15 RENTALS', RC),
    ...fbox([
      ['rainy hours', RC],
      ['10, 12, 15', RC]
    ], RC)
  );

  await until(S(13));
  await play(
    ...placeDots(RAIN, rainDots, [3, 4], RAIN_Y, RC),
    ...say('18 AND 20 RENTALS', RC),
    ...fbox([
      ['5 rainy hours', RC],
      ['10, 12, 15', RC],
      ['18, 20', RC]
    ], RC)
  );

  // 14-15: compare the locations of the two groups.
  const rainyExtent = outline(
    [
      (X(10) + X(20)) / 2,
      RAIN_Y,
      0
    ],
    X(20) - X(10) + 0.42,
    0.48,
    RC
  );

  const dryExtent = outline(
    [
      (X(30) + X(50)) / 2,
      DRY_Y,
      0
    ],
    X(50) - X(30) + 0.42,
    0.48,
    DC
  );

  await until(S(14));
  await play(
    ...clearActive(),
    new M.Create(rainyExtent),
    new M.LaggedStart(
      rainDots.map(d =>
        new M.Indicate(d, { color: RC })
      ),
      { lagRatio: 0.10, runTime: 1.25 }
    ),
    ...say('RAINY DOTS STAY TOWARD THE LEFT', RC),
    ...fbox([
      ['rainy hours', RC],
      ['10 to 20 rentals', RC],
      ['lower counts', C.ink]
    ], RC)
  );

  const rainRightGuide = dashed(
    [X(20), AXIS_Y, 0],
    [X(20), RAIN_Y, 0],
    RC
  );

  const dryLeftGuide = dashed(
    [X(30), AXIS_Y, 0],
    [X(30), DRY_Y, 0],
    DC
  );

  const gapY = P ? -3.85 : -1.57;

  const gapLine = line(
    [X(20), gapY, 0],
    [X(30), gapY, 0],
    MC,
    3
  );

  const gapCaps = [
    line(
      [X(20), gapY - 0.10, 0],
      [X(20), gapY + 0.10, 0],
      MC,
      2
    ),
    line(
      [X(30), gapY - 0.10, 0],
      [X(30), gapY + 0.10, 0],
      MC,
      2
    )
  ];

  const gapLabel = textAt(
    '10',
    18,
    MC,
    [(X(20) + X(30)) / 2, gapY + 0.23, 0],
    true
  );

  await until(S(15));
  await play(
    new M.Create(dryExtent),
    new M.Create(rainRightGuide),
    new M.Create(dryLeftGuide),
    new M.Create(gapLine),
    new M.FadeIn(new M.VGroup(...gapCaps, gapLabel)),
    ...say('EVEN 20 IS BELOW 30', MC),
    ...fbox([
      ['rainy maximum = 20', RC],
      ['dry minimum   = 30', DC],
      ['no overlap here', MC]
    ], MC)
  );

  // 16-18: name the distributions and show their spread.
  await until(S(16));
  await play(
    ...fadeAll([
      rainRightGuide,
      dryLeftGuide,
      gapLine,
      ...gapCaps,
      gapLabel
    ]),
    new M.Indicate(dryExtent, { color: DC }),
    new M.Indicate(rainyExtent, { color: RC }),
    ...say('THE WAY DOTS ARE ARRANGED: DISTRIBUTION', C.green),
    ...fbox([
      ['DISTRIBUTION', C.green],
      ['where the values sit', C.ink],
      ['along a number ruler', C.ink]
    ], C.green)
  );

  function spanBracket(a, b, y, color) {
    const bar = line(
      [X(a), y, 0],
      [X(b), y, 0],
      color,
      3
    );

    const capA = line(
      [X(a), y - 0.09, 0],
      [X(a), y + 0.09, 0],
      color,
      2
    );

    const capB = line(
      [X(b), y - 0.09, 0],
      [X(b), y + 0.09, 0],
      color,
      2
    );

    const lab = textAt(
      `${a}–${b}`,
      P ? 17 : 16,
      color,
      [
        (X(a) + X(b)) / 2,
        y - 0.23,
        0
      ],
      true
    );

    return new M.VGroup(bar, capA, capB, lab);
  }

  const drySpan = spanBracket(
    30,
    50,
    DRY_Y - 0.39,
    DC
  );

  const rainSpan = spanBracket(
    10,
    20,
    RAIN_Y - 0.39,
    RC
  );

  await until(S(17));
  await play(
    new M.FadeIn(drySpan),
    new M.FadeIn(rainSpan),
    ...say('WHERE THEY GATHER AND HOW FAR THEY SPREAD'),
    ...fbox([
      ['dry spread: 30 to 50', DC],
      ['rain spread: 10 to 20', RC],
      ['location + spread', C.green]
    ], C.green)
  );

  await until(S(18));
  await play(
    new M.Indicate(dryRowTag, { color: DC }),
    new M.Indicate(rainRowTag, { color: RC }),
    ...say('GROUPED DISTRIBUTIONS', C.green),
    ...fbox([
      ['GROUPED DISTRIBUTIONS', C.green],
      ['one row per group', C.ink],
      ['one common ruler', C.ink]
    ], C.green)
  );

  // 19-21: find the middle of the five rainy observations.
  function rankLabels(data, y, color) {
    return data.map((n, k) => {
      const previousClose =
        k > 0 && n - data[k - 1] <= 3;

      return textAt(
        String(k + 1),
        P ? 17 : 16,
        color,
        [
          X(n),
          y + (previousClose ? 0.52 : 0.28),
          0
        ],
        true
      );
    });
  }

  function highlightRing(n, y, color = MC, radius = 0.16) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    r.moveTo([X(n), y, 0]);
    return r;
  }

  function medianMarker(n, y, color = MC) {
    const stem = line(
      [X(n), y - 0.21, 0],
      [X(n), y + 0.21, 0],
      color,
      3
    );

    const diamondSize = 0.105;
    const p = [X(n), y, 0];

    const diamond = new M.VGroup(
      line(
        [p[0], p[1] + diamondSize, 0],
        [p[0] + diamondSize, p[1], 0],
        color,
        3
      ),
      line(
        [p[0] + diamondSize, p[1], 0],
        [p[0], p[1] - diamondSize, 0],
        color,
        3
      ),
      line(
        [p[0], p[1] - diamondSize, 0],
        [p[0] - diamondSize, p[1], 0],
        color,
        3
      ),
      line(
        [p[0] - diamondSize, p[1], 0],
        [p[0], p[1] + diamondSize, 0],
        color,
        3
      )
    );

    return new M.VGroup(stem, diamond);
  }

  await until(S(19));
  await play(
    ...fadeAll([
      dryExtent,
      rainyExtent,
      drySpan,
      rainSpan
    ]),
    ...say('FIND THE MIDDLE OF EACH ROW', MC),
    ...fbox([
      ['put values in order', C.ink],
      ['find the middle', MC]
    ], MC)
  );

  const rainRanks = rankLabels(RAIN, RAIN_Y, RC);

  await until(S(20));
  await play(
    new M.LaggedStart(
      rainRanks.map(t => new M.FadeIn(t)),
      { lagRatio: 0.13, runTime: 1.10 }
    ),
    ...say('RAINY ROW: FIVE DOTS', RC),
    ...fbox([
      ['10  12  15  18  20', RC],
      [' 1   2   3   4   5', C.muted]
    ], RC)
  );

  const rainyMiddleRing = highlightRing(
    RAIN_MEDIAN,
    RAIN_Y,
    MC,
    0.17
  );

  const rainyMiddle = medianMarker(
    RAIN_MEDIAN,
    RAIN_Y
  );

  const rainyMiddleGuide = dashed(
    [X(RAIN_MEDIAN), AXIS_Y, 0],
    [X(RAIN_MEDIAN), RAIN_Y - 0.20, 0],
    MC
  );

  const rainyMiddleTag = pill(
    '15',
    MC,
    P ? 19 : 17
  );

  rainyMiddleTag.moveTo([
    X(RAIN_MEDIAN),
    RAIN_Y - 0.52,
    0
  ]);

  await until(S(21));
  await play(
    ...fadeAll(rainRanks),
    new M.Create(rainyMiddleRing),
    new M.FadeIn(rainyMiddle),
    new M.Create(rainyMiddleGuide),
    new M.FadeIn(rainyMiddleTag),
    ...say('THE MIDDLE DOT IS 15', MC),
    ...fbox([
      ['10  12  | 15 |  18  20', RC],
      ['2 before · 2 after', C.muted],
      ['middle = 15', MC]
    ], MC)
  );

  // 22-25: find the middle of the six dry observations.
  const dryRanks = rankLabels(DRY, DRY_Y, DC);

  await until(S(22));
  await play(
    new M.LaggedStart(
      dryRanks.map(t => new M.FadeIn(t)),
      { lagRatio: 0.10, runTime: 1.10 }
    ),
    ...say('DRY ROW: SIX DOTS', DC),
    ...fbox([
      ['30  35  40  42  45  50', DC],
      [' 1   2   3   4   5   6', C.muted]
    ], DC)
  );

  const dryMiddleRing40 = highlightRing(
    40,
    DRY_Y,
    MC,
    0.10
  );

  const dryMiddleRing42 = highlightRing(
    42,
    DRY_Y,
    MC,
    0.10
  );

  const dry40Tag = valueLabel(
    40,
    DRY_Y,
    MC,
    0.34
  );

  const dry42Tag = valueLabel(
    42,
    DRY_Y,
    MC,
    0.61
  );

  await until(S(23));
  await play(
    ...fadeAll(dryRanks),
    new M.Create(dryMiddleRing40),
    new M.Create(dryMiddleRing42),
    new M.FadeIn(dry40Tag),
    new M.FadeIn(dry42Tag),
    ...say('TWO MIDDLE DOTS: 40 AND 42', MC),
    ...fbox([
      ['30  35', C.muted],
      ['40  42', MC],
      ['45  50', C.muted]
    ], MC)
  );

  // A magnified number ruler makes the halfway point clear.
  // It is explicitly labelled as a zoom, not a separate data scale.
  function midpointInset() {
    const cx = P ? 0 : CX;
    const cy = P ? 1.40 : 1.15;
    const width = P ? 3.40 : 2.75;
    const height = P ? 1.15 : 0.95;

    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.12,
      color: MC,
      strokeWidth: 1.5
    });

    r.setFill(C.card, 0.98);
    r.moveTo([cx, cy, 0]);

    const left = cx - width * 0.32;
    const right = cx + width * 0.32;
    const iy = cy + 0.02;

    const miniX = n =>
      left + (n - 40) / 2 * (right - left);

    const miniLine = line(
      [left, iy, 0],
      [right, iy, 0],
      C.muted,
      2
    );

    const marks = [40, 41, 42].map(n =>
      line(
        [miniX(n), iy - 0.08, 0],
        [miniX(n), iy + 0.08, 0],
        n === 41 ? MC : DC,
        2
      )
    );

    const labels = [40, 41, 42].map(n =>
      textAt(
        String(n),
        P ? 17 : 15,
        n === 41 ? MC : DC,
        [miniX(n), iy - 0.22, 0],
        true
      )
    );

    const zoomTitle = textAt(
      'ZOOM: 40 TO 42',
      P ? 15 : 15,
      C.muted,
      [cx, cy + (P ? 0.40 : 0.33), 0],
      true
    );

    const leftDot = glowingDot(
      [miniX(40), iy, 0],
      DC
    );

    const rightDot = glowingDot(
      [miniX(42), iy, 0],
      DC
    );

    const middleDot = new M.Dot({
      point: [miniX(41), iy, 0],
      radius: 0.085,
      color: MC
    });

    middleDot.setFill(MC, 1);

    const g = new M.VGroup(
      r,
      miniLine,
      ...marks,
      ...labels,
      zoomTitle,
      leftDot,
      rightDot
    );

    return {
      group: g,
      middle: middleDot
    };
  }

  const inset = midpointInset();

  await until(S(24));
  await play(
    ...fadeAll([dry40Tag, dry42Tag]),
    new M.FadeIn(inset.group),
    ...say('HALFWAY BETWEEN 40 AND 42', MC),
    ...fbox([
      ['40 → 41 → 42', MC],
      ['one step from 40', C.ink],
      ['one step from 42', C.ink]
    ], MC)
  );

  const dryMiddle = medianMarker(
    DRY_MEDIAN,
    DRY_Y
  );

  const dryMiddleGuide = dashed(
    [X(DRY_MEDIAN), AXIS_Y, 0],
    [X(DRY_MEDIAN), DRY_Y - 0.20, 0],
    MC
  );

  const dryMiddleTag = pill(
    '41',
    MC,
    P ? 19 : 17
  );

  dryMiddleTag.moveTo([
    X(DRY_MEDIAN),
    DRY_Y - 0.52,
    0
  ]);

  await until(S(25));
  await play(
    new M.FadeIn(inset.middle),
    new M.FadeIn(dryMiddle),
    new M.Create(dryMiddleGuide),
    new M.FadeIn(dryMiddleTag),
    ...say('THE MIDDLE IS 41', MC),
    ...fbox([
      ['dry middle = 41', MC],
      ['between 40 and 42', C.ink]
    ], MC)
  );

  // 26-28: name and calculate the median.
  await until(S(26));
  await play(
    ...fadeAll([
      inset.group,
      inset.middle,
      dryMiddleRing40,
      dryMiddleRing42,
      rainyMiddleRing
    ]),
    new M.Indicate(dryMiddle, { color: MC }),
    new M.Indicate(rainyMiddle, { color: MC }),
    ...say('MEDIAN = THE MIDDLE NUMBER', MC),
    ...fbox([
      ['MEDIAN', MC],
      ['dry   = 41', DC],
      ['rainy = 15', RC]
    ], MC)
  );

  await until(S(27));
  await play(
    new M.Indicate(dryMiddleTag, { color: MC }),
    ...say('EVEN COUNT: USE THE TWO MIDDLE VALUES', MC),
    ...fbox([
      ['two middle values', C.muted],
      ['40 and 42', DC],
      ['median = their mean', MC]
    ], MC)
  );

  await until(S(28));
  await play(
    ...say('ADD THEM, THEN DIVIDE BY TWO', MC),
    ...fbox([
      ['40 + 42 = 82', DC],
      ['82 ÷ 2 = 41', MC],
      ['median = 41', MC]
    ], MC)
  );

  // 29: compare the two medians using the common scale.
  const compareY = P ? -3.95 : -1.72;

  const medianGap = line(
    [X(RAIN_MEDIAN), compareY, 0],
    [X(DRY_MEDIAN), compareY, 0],
    MC,
    3
  );

  const medianGapCaps = [
    line(
      [X(RAIN_MEDIAN), compareY - 0.09, 0],
      [X(RAIN_MEDIAN), compareY + 0.09, 0],
      MC,
      2
    ),
    line(
      [X(DRY_MEDIAN), compareY - 0.09, 0],
      [X(DRY_MEDIAN), compareY + 0.09, 0],
      MC,
      2
    )
  ];

  const medianGapLabel = textAt(
    '26 fewer rentals',
    P ? 17 : 16,
    MC,
    [
      (X(RAIN_MEDIAN) + X(DRY_MEDIAN)) / 2,
      compareY + 0.21,
      0
    ]
  );

  await until(S(29));
  await play(
    new M.Create(medianGap),
    new M.FadeIn(
      new M.VGroup(...medianGapCaps, medianGapLabel)
    ),
    ...say('THE RAINY MEDIAN IS MUCH LOWER', MC),
    ...fbox([
      ['dry median   = 41', DC],
      ['rainy median = 15', RC],
      ['41 − 15 = 26', MC]
    ], MC)
  );

  // 30: remind the learner what these observations represent.
  await until(S(30));
  await play(
    ...fadeAll([
      medianGap,
      ...medianGapCaps,
      medianGapLabel
    ]),

    new M.LaggedStart(
      [...dryDots, ...rainDots].map(d =>
        new M.Indicate(d, { color: C.ink })
      ),
      { lagRatio: 0.06, runTime: 1.60 }
    ),

    ...say('THESE ARE THE RECORDED MIDDAY HOURS'),
    ...fbox([
      ['6 dry hours', DC],
      ['5 rainy hours', RC],
      ['one dot per hour', C.ink]
    ])
  );

  // 31: a typical value and the surrounding spread.
  const drySpan2 = spanBracket(
    30,
    50,
    DRY_Y + 0.42,
    DC
  );

  const rainSpan2 = spanBracket(
    10,
    20,
    RAIN_Y + 0.42,
    RC
  );

  // Move span labels above the brackets, away from the data marks.
  drySpan2.submobjects[3].moveTo([
    (X(30) + X(50)) / 2,
    DRY_Y + 0.70,
    0
  ]);

  rainSpan2.submobjects[3].moveTo([
    (X(10) + X(20)) / 2,
    RAIN_Y + 0.70,
    0
  ]);

  // Remove the rainy span label from the occupied row-label area
  // by placing the bracket below the row instead.
  const rainSpanSafe = spanBracket(
    10,
    20,
    RAIN_Y - 0.30,
    RC
  );

  // The median pill already labels 15, so use only the span
  // bracket's geometry here to keep the picture uncluttered.
  const rainSpanGeometry = new M.VGroup(
    ...rainSpanSafe.submobjects.slice(0, 3)
  );

  await until(S(31));
  await play(
    new M.FadeIn(drySpan2),
    new M.FadeIn(rainSpanGeometry),
    ...say('COMPARE THE MIDDLE AND THE SPREAD', C.green),
    ...fbox([
      ['typical value: median', MC],
      ['dry: 30 to 50', DC],
      ['rainy: 10 to 20', RC]
    ], C.green)
  );

  // 32-33: demonstrate the misleading use of separate rulers.
  // Both rows keep the same observed values, but each receives
  // its own locally fitted scale. This is intentionally misleading
  // and is prominently labelled as the common trap.

  const correctObjects = [
    grid,
    ruler,
    dryRow,
    rainRow,
    dryRowTag,
    rainRowTag,
    ...dryDots,
    ...rainDots,
    dryMiddle,
    rainyMiddle,
    dryMiddleGuide,
    rainyMiddleGuide,
    dryMiddleTag,
    rainyMiddleTag
  ];

  const BAD_L = XL + 0.25;
  const BAD_R = XR - 0.25;

  const badDryX = n =>
    BAD_L + (n - 30) / 20 * (BAD_R - BAD_L);

  const badRainX = n =>
    BAD_L + (n - 10) / 10 * (BAD_R - BAD_L);

  function separateRuler(
    data,
    y,
    mapper,
    tickValues,
    color,
    title
  ) {
    const baseline = line(
      [BAD_L, y, 0],
      [BAD_R, y, 0],
      color,
      2
    );

    const marks = tickValues.map(n => {
      const m = line(
        [mapper(n), y - 0.08, 0],
        [mapper(n), y + 0.08, 0],
        C.muted,
        2
      );

      const t = textAt(
        String(n),
        P ? 17 : 16,
        color,
        [mapper(n), y - 0.30, 0],
        true
      );

      return new M.VGroup(m, t);
    });

    const points = data.map(n =>
      glowingDot([mapper(n), y, 0], color)
    );

    const label = pill(title, color, 16);

    label.moveTo([
      (BAD_L + BAD_R) / 2,
      y + 0.58,
      0
    ]);

    return new M.VGroup(
      baseline,
      ...marks,
      ...points,
      label
    );
  }

  const badDry = separateRuler(
    DRY,
    DRY_Y,
    badDryX,
    [30, 35, 40, 45, 50],
    DC,
    'DRY: OWN RULER'
  );

  const badRain = separateRuler(
    RAIN,
    RAIN_Y,
    badRainX,
    [10, 12, 15, 18, 20],
    RC,
    'RAINY: OWN RULER'
  );

  const warningTag = pill(
    'MISLEADING COMPARISON',
    MC,
    P ? 17 : 16
  );

  warningTag.moveTo([
    CX,
    P ? -4.90 : -2.35,
    0
  ]);

  await until(S(32));
  await play(
    ...fadeAll([
      ...correctObjects,
      drySpan2,
      rainSpanGeometry
    ]),
    new M.FadeIn(badDry),
    new M.FadeIn(badRain),
    new M.FadeIn(warningTag),
    ...say('COMMON TRAP: DIFFERENT RULERS', MC),
    ...fbox([
      ['dry scale: 30 to 50', DC],
      ['rain scale: 10 to 20', RC],
      ['not a fair comparison', MC]
    ], MC)
  );

  const badMidX = (BAD_L + BAD_R) / 2;

  const badMidGuide = dashed(
    [badMidX, RAIN_Y - 0.08, 0],
    [badMidX, DRY_Y + 0.08, 0],
    MC
  );

  const badDryRing = new M.Circle({
    radius: 0.16,
    color: MC,
    strokeWidth: 2
  });

  badDryRing.moveTo([
    badDryX(40),
    DRY_Y,
    0
  ]);

  const badRainRing = new M.Circle({
    radius: 0.16,
    color: MC,
    strokeWidth: 2
  });

  badRainRing.moveTo([
    badRainX(15),
    RAIN_Y,
    0
  ]);

  const badDryValue = pill(
    '40',
    DC,
    16
  );

  badDryValue.moveTo([
    badMidX,
    DRY_Y + 0.28,
    0
  ]);

  const badRainValue = pill(
    '15',
    RC,
    16
  );

  badRainValue.moveTo([
    badMidX,
    RAIN_Y + 0.28,
    0
  ]);

  await until(S(33));
  await play(
    new M.Create(badMidGuide),
    new M.Create(badDryRing),
    new M.Create(badRainRing),
    new M.FadeIn(badDryValue),
    new M.FadeIn(badRainValue),
    ...say('SAME POSITION, DIFFERENT NUMBERS', MC),
    ...fbox([
      ['halfway across dry = 40', DC],
      ['halfway across rain = 15', RC],
      ['40 is not 15', MC]
    ], MC)
  );

  // 34: restore the correct common ruler and finish.
  // Reintroduce the original chart objects without altering
  // their coordinates or grouping visible objects.

  const finalTag = pill(
    'ONE COMMON SCALE',
    C.green,
    P ? 17 : 16
  );

  finalTag.moveTo([
    (XL + XR) / 2,
    P ? -6.25 : -2.86,
    0
  ]);

  await until(S(34));
  await play(
    ...fadeAll([
      badDry,
      badRain,
      warningTag,
      badMidGuide,
      badDryRing,
      badRainRing,
      badDryValue,
      badRainValue
    ]),

    ...correctObjects.map(o => new M.FadeIn(o)),

    new M.FadeIn(finalTag),

    ...say('GROUPED DISTRIBUTIONS: USE A COMMON RULER', C.green),

    ...fbox([
      ['GROUPED DISTRIBUTIONS', C.green],
      ['one row per group', C.ink],
      ['one common ruler', C.green],
      ['compare middle + spread', MC]
    ], C.green)
  );
}

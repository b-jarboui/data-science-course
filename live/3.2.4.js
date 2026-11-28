// lesson 3.2.4
// Missing versus zero — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter data: greenhouse, winter night, Sensor A.
// Uses the approved engine API; browser playback has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  const DATA = [2, 0, 4, null, 6];
  const HOURS = ['1:00', '2:00', '3:00', '4:00', '5:00'];

  const PINK = C.pink || '#ff619e';

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Shared visual helpers
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, mono = false) {
    const t = T(String(s), size, color, mono);
    t.moveTo([x, y, 0]);
    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function rect(x, y, w, h, color, opacity = 0, sw = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function rounded(
    x, y, w, h, color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.15,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function circle(x, y, r, color, opacity = 1) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);
    return c;
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);
    p.moveTo([x, y, 0]);
    return p;
  }

  function glow(x, y, color = C.cyan, radius = 0.11) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.3,
      color
    });

    halo.setFill(color, 0.16);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  // Hollow dashed circle: absence of a measurement.
  // Built from short line segments, so the marker does not
  // depend on an additional dashed-mobject API.

  function gapCircle(x, y, radius = 0.18, color = C.muted) {
    const parts = [];
    const n = 12;

    for (let k = 0; k < n; k++) {
      const a = 2 * Math.PI * k / n;
      const b = a + 2 * Math.PI / n * 0.55;

      parts.push(
        line(
          x + radius * Math.cos(a),
          y + radius * Math.sin(a),
          x + radius * Math.cos(b),
          y + radius * Math.sin(b),
          color,
          2.5
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function checkMark(x, y, color = C.green) {
    return new M.VGroup(
      line(x - 0.12, y, x - 0.035, y - 0.09, color, 3),
      line(x - 0.035, y - 0.09, x + 0.15, y + 0.12, color, 3)
    );
  }

  function crossMark(x, y, color = PINK) {
    return new M.VGroup(
      line(x - 0.10, y - 0.10, x + 0.10, y + 0.10, color, 3),
      line(x - 0.10, y + 0.10, x + 0.10, y - 0.10, color, 3)
    );
  }

  function snowflake(x, y, radius = 0.16) {
    const parts = [];

    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;

      const ex = x + radius * Math.cos(a);
      const ey = y + radius * Math.sin(a);

      parts.push(
        line(x, y, ex, ey, C.cyan, 1.7)
      );

      for (const side of [-1, 1]) {
        const branch = a + Math.PI + side * Math.PI / 4;

        parts.push(
          line(
            ex,
            ey,
            ex + radius * 0.37 * Math.cos(branch),
            ey + radius * 0.37 * Math.sin(branch),
            C.cyan,
            1.4
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  // Formula box: same structure and placement as the
  // approved arithmetic-mean lesson.

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.36 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length - rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.65;
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

    const left = BOXP[0] - wd / 2 + 0.325;
    const top = BOXP[1] + ht / 2 - 0.175 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.55 : 3.7;
    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // 0–1: cold winter night in the greenhouse
  // ------------------------------------------------------------

  const GX = CX;
  const GBASE = P ? -4.75 : -2.10;
  const GW = P ? 5.7 : 6.4;
  const GH = P ? 3.7 : 2.35;

  const GL = GX - GW / 2;
  const GR = GX + GW / 2;
  const GEAVE = GBASE + GH;
  const GROOF = GEAVE + (P ? 1.15 : 0.85);

  const greenhouse = new M.VGroup(
    rect(
      GX,
      GBASE + GH / 2,
      GW,
      GH,
      C.cyan,
      0.035
    ),
    line(GL, GBASE, GR, GBASE, C.muted, 3),
    line(GL, GBASE, GL, GEAVE, C.cyan, 2.5),
    line(GR, GBASE, GR, GEAVE, C.cyan, 2.5),
    line(GL, GEAVE, GX, GROOF, C.cyan, 2.5),
    line(GX, GROOF, GR, GEAVE, C.cyan, 2.5),
    line(GL, GEAVE, GR, GEAVE, C.cyan, 2),
    line(GX, GEAVE, GX, GROOF, C.muted, 1.5),
    line(
      GL + GW * 0.25,
      GBASE,
      GL + GW * 0.25,
      GEAVE,
      C.muted,
      1
    ),
    line(GX, GBASE, GX, GEAVE, C.muted, 1),
    line(
      GL + GW * 0.75,
      GBASE,
      GL + GW * 0.75,
      GEAVE,
      C.muted,
      1
    )
  );

  const doorX = GR - 0.68;

  const door = new M.VGroup(
    rect(
      doorX,
      GBASE + 0.87,
      0.85,
      1.74,
      C.cyan,
      0.025
    ),
    circle(
      doorX + 0.24,
      GBASE + 0.87,
      0.045,
      C.ink
    )
  );

  function tomatoPlant(x, height) {
    const y = GBASE + 0.25;

    const parts = [
      rect(
        x,
        GBASE + 0.13,
        0.48,
        0.26,
        C.amber,
        0.22
      ),
      line(x, y, x, y + height, C.green, 3)
    ];

    for (let k = 0; k < 3; k++) {
      const yy = y + 0.23 + k * height / 4;
      const side = k % 2 === 0 ? -1 : 1;

      parts.push(
        line(
          x,
          yy,
          x + side * 0.30,
          yy + 0.19,
          C.green,
          2.5
        ),
        circle(
          x + side * 0.26,
          yy + 0.18,
          0.12,
          C.green,
          0.65
        ),
        circle(
          x - side * 0.17,
          yy + 0.04,
          0.10,
          '#ff655f',
          0.9
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const plantXs = Array.from(
    { length: 5 },
    (_, i) => GL + 0.59 + i * (GW - 1.95) / 4
  );

  const plants = plantXs.map((x, i) =>
    tomatoPlant(x, 0.98 + (i % 3) * 0.16)
  );

  // Moon and stars establish that the readings are overnight.

  const moonX = GL + 0.60;
  const moonY = P ? 0.92 : 0.88;

  const moon = circle(
    moonX,
    moonY,
    0.27,
    '#dce8ff',
    0.95
  );

  const stars = [
    [GL + 0.20, moonY - 0.48],
    [GL + 1.18, moonY + 0.27],
    [GR - 0.32, moonY + 0.13],
    [GR - 0.86, moonY - 0.33]
  ].map(([x, y]) =>
    circle(x, y, 0.035, C.ink, 0.8)
  );

  const nightLabel = txt(
    'WINTER NIGHT',
    17,
    C.muted,
    GX,
    GBASE - 0.40
  );

  await until(S(0));
  await play(
    new M.FadeIn(moon),
    new M.FadeIn(new M.VGroup(...stars)),
    new M.Create(greenhouse),
    new M.FadeIn(door),
    new M.FadeIn(nightLabel),
    new M.LaggedStart(
      plants.map(p => new M.FadeIn(p)),
      { lagRatio: 0.12, runTime: 1.5 }
    ),
    ...say('A COLD WINTER NIGHT', C.cyan)
  );

  const frost = plantXs.map((x, i) =>
    snowflake(
      x + 0.18,
      GBASE + 0.95 + (i % 3) * 0.13,
      0.16
    )
  );

  const frostLabel = tag(
    'FROST RISK AT 0°C',
    C.cyan,
    CX,
    P ? -5.55 : -2.82,
    17
  );

  await until(S(1));
  await play(
    new M.LaggedStart(
      frost.map(f => new M.FadeIn(f)),
      { lagRatio: 0.13, runTime: 1.3 }
    ),
    new M.FadeIn(frostLabel),
    ...say('FROST = ICE ON THE PLANTS', C.cyan),
    ...fbox([
      ['0°C', C.cyan],
      'Water freezes',
      'Risk of frost'
    ])
  );

  // ------------------------------------------------------------
  // 2–7: Sensor A's overnight log
  // ------------------------------------------------------------

  const TX = CX;
  const TW = P ? 5.75 : 6.20;
  const RH = P ? 1.0 : 0.57;
  const TY = P ? 0.6 : 1.02;

  const TL = TX - TW / 2;
  const TR = TX + TW / 2;

  const COL = [
    TL + TW * 0.18,
    TL + TW * 0.50,
    TL + TW * 0.81
  ];

  const rowY = i => TY - (i + 1) * RH;

  function logTable() {
    const parts = [
      rounded(
        TX,
        TY - 2.5 * RH,
        TW,
        6 * RH + 0.15,
        C.cyan,
        C.card,
        0.40
      ),
      txt(
        'Sensor',
        P ? 19 : 18,
        C.muted,
        COL[0],
        TY,
        true
      ),
      txt(
        'Time',
        P ? 19 : 18,
        C.muted,
        COL[1],
        TY,
        true
      ),
      txt(
        '°C',
        P ? 19 : 18,
        C.muted,
        COL[2],
        TY,
        true
      )
    ];

    for (let i = 0; i < 5; i++) {
      const y = TY - (i + 0.5) * RH;

      parts.push(
        line(TL + 0.13, y, TR - 0.13, y, C.muted, 1)
      );
    }

    return new M.VGroup(...parts);
  }

  function logRow(i, value) {
    const y = rowY(i);

    const parts = [
      txt(
        'A',
        P ? 21 : 20,
        C.cyan,
        COL[0],
        y,
        true
      ),
      txt(
        HOURS[i],
        P ? 22 : 20,
        C.ink,
        COL[1],
        y,
        true
      )
    ];

    // A missing reading leaves the actual table cell empty.
    // It is deliberately not drawn as a zero.

    if (value !== null) {
      parts.push(
        txt(
          value,
          P ? 26 : 23,
          C.cyan,
          COL[2],
          y,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const table = logTable();

  const logTitle = txt(
    'SENSOR A  ·  WINTER NIGHT',
    P ? 17 : 16,
    C.cyan,
    TX,
    TY - 5.5 * RH - 0.42
  );

  const rows = [];
  let rowFocus = null;
  let emptyCell = null;

  function revealRow(i) {
    const row = logRow(i, DATA[i]);

    rows[i] = row;

    const focus = rounded(
      TX,
      rowY(i),
      TW - 0.16,
      RH - 0.07,
      DATA[i] === null ? C.muted : C.cyan,
      C.cyan,
      0.055
    );

    const a = [
      new M.FadeIn(row),
      new M.Create(focus)
    ];

    if (rowFocus) {
      a.push(new M.FadeOut(rowFocus));
    }

    rowFocus = focus;

    return a;
  }

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(
      greenhouse,
      door,
      moon,
      ...stars,
      ...plants,
      ...frost,
      nightLabel,
      frostLabel
    )),
    new M.FadeIn(table),
    new M.FadeIn(logTitle),
    ...say('ONE READING EVERY HOUR'),
    ...fbox([
      ['Sensor A', C.cyan],
      '1:00 to 5:00',
      'Five expected readings'
    ])
  );

  await until(S(3));
  await play(
    ...revealRow(0),
    ...say('1:00  ·  2°C')
  );

  await until(S(4));
  await play(
    ...revealRow(1),
    ...say('2:00  ·  0°C'),
    ...fbox([
      ['0°C', C.cyan],
      'A recorded temperature'
    ])
  );

  await until(S(5));
  await play(
    ...revealRow(2),
    ...say('3:00  ·  4°C')
  );

  emptyCell = rounded(
    COL[2],
    rowY(3),
    P ? 0.97 : 1.04,
    RH - 0.15,
    C.muted,
    C.card,
    0.12
  );

  await until(S(6));
  await play(
    ...revealRow(3),
    new M.Create(emptyCell),
    ...say('4:00  ·  EMPTY CELL', C.muted),
    ...fbox([
      ['4:00', C.muted],
      'No reading arrived',
      'The cell is empty'
    ], C.muted)
  );

  await until(S(7));
  await play(
    ...revealRow(4),
    ...say('5:00  ·  6°C'),
    ...fbox([
      'Five expected hours',
      ['Four recorded values', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 8–10: the log becomes a time chart
  // ------------------------------------------------------------

  const XL = CX - (P ? 2.85 : 3.45);
  const XR = CX + (P ? 3.10 : 3.70);

  const YB = P ? -4.3 : -1.78;
  const YT = P ? 1.03 : 1.02;

  const GAPY = P ? -5.6 : -2.66;

  const PX0 = XL + 0.36;
  const PX1 = XR - 0.30;

  const xAt = i =>
    PX0 + i * (PX1 - PX0) / 4;

  const yAt = v =>
    YB + v / 7 * (YT - YB);

  function makeDot(i, v, color = C.cyan) {
    const x = xAt(i);
    const y = yAt(v);

    const d = glow(
      x,
      y,
      color,
      P ? 0.12 : 0.105
    );

    const label = txt(
      `${v}°`,
      P ? 20 : 18,
      color,
      v === 0 ? x + (P ? 0.55 : 0.48) : x,
      v === 0 ? y + (P ? 0.24 : 0.2) : y + (P ? 0.36 : 0.28),
      true
    );

    return new M.VGroup(d, label);
  }

  const chartParts = [
    line(XL, YB, XR, YB, C.muted, 2.5),
    line(XL, YB, XL, YT, C.muted, 2.5),
    txt(
      '°C',
      17,
      C.muted,
      XL - 0.28,
      YT + 0.25
    )
  ];

  for (const v of [0, 2, 4, 6]) {
    const y = yAt(v);

    chartParts.push(
      line(
        XL - 0.075,
        y,
        XL,
        y,
        C.muted,
        2
      ),
      txt(
        String(v),
        P ? 17 : 16,
        C.muted,
        XL - 0.28,
        y,
        true
      )
    );

    if (v > 0) {
      chartParts.push(
        dashed(XL, y, XR, y, C.muted)
      );
    }
  }

  for (let i = 0; i < HOURS.length; i++) {
    chartParts.push(
      line(
        xAt(i),
        YB,
        xAt(i),
        YB - 0.08,
        C.muted
      ),
      txt(
        HOURS[i],
        P ? 17 : 16,
        C.muted,
        xAt(i),
        YB - (P ? 0.46 : 0.42),
        true
      )
    );
  }

  // The gap marker belongs to a separate missing-data lane.
  // Placing it on the temperature axis at zero would falsely
  // suggest that a temperature of 0°C had been measured.

  chartParts.push(
    dashed(XL, GAPY, XR, GAPY, C.muted),
    txt(
      'no reading',
      P ? 17 : 16,
      C.ink,
      XL + (P ? 0.75 : 0.7),
      GAPY - 0.27
    )
  );

  const axes = new M.VGroup(...chartParts);

  const dots = DATA.map((v, i) =>
    v === null ? null : makeDot(i, v)
  );

  const gapMarker = gapCircle(
    xAt(3),
    GAPY,
    P ? 0.21 : 0.17,
    C.muted
  );

  const gapStem = dashed(
    xAt(3),
    YB - 0.62,
    xAt(3),
    GAPY + 0.23,
    C.muted
  );

  const chartGap = new M.VGroup(gapMarker, gapStem);

  const realDots = dots.filter(Boolean);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(
      table,
      logTitle,
      ...rows,
      rowFocus,
      emptyCell
    )),
    new M.FadeIn(axes),
    new M.LaggedStart(
      [
        new M.FadeIn(dots[0]),
        new M.FadeIn(dots[1]),
        new M.FadeIn(dots[2]),
        new M.FadeIn(chartGap),
        new M.FadeIn(dots[4])
      ],
      { lagRatio: 0.15, runTime: 2.2 }
    ),
    ...say('A DOT FOR EACH REAL READING'),
    ...fbox([
      ['Solid dot', C.cyan],
      'Measured temperature',
      ['Dashed circle', C.muted],
      'No measurement'
    ])
  );

  rowFocus = null;

  const zeroRing = circle(
    xAt(1),
    yAt(0),
    P ? 0.30 : 0.26,
    C.amber,
    0
  );

  const missingRing = circle(
    xAt(3),
    GAPY,
    P ? 0.30 : 0.26,
    C.amber,
    0
  );

  await until(S(9));
  await play(
    new M.Create(zeroRing),
    new M.Create(missingRing),
    ...say('ZERO AND MISSING CAN LOOK ALIKE', C.amber),
    ...fbox([
      ['0', C.cyan],
      'Looks like nothing',
      ['Empty', C.muted],
      'Also looks like nothing'
    ], C.amber)
  );

  await until(S(10));
  await play(
    new M.Indicate(dots[1], { color: C.cyan }),
    new M.Indicate(gapMarker, { color: C.muted }),
    ...say('BUT THEY MEAN DIFFERENT THINGS', C.amber)
  );

  // ------------------------------------------------------------
  // 11–13: a measurement versus no measurement
  // ------------------------------------------------------------

  const frostLine = line(
    XL,
    yAt(0),
    XR,
    yAt(0),
    C.cyan,
    2.5
  );

  const frostRisk = tag(
    'REAL 0°C  ·  FROST RISK',
    C.cyan,
    CX,
    YB + (P ? 0.86 : 0.88),
    16
  );

  await until(S(11));
  await play(
    new M.FadeOut(missingRing),
    new M.Create(frostLine),
    new M.FadeIn(frostRisk),
    new M.Flash(
      dots[1].submobjects[0],
      { color: C.cyan }
    ),
    ...say('ZERO IS A REAL MEASUREMENT', C.cyan),
    ...fbox([
      ['2:00', C.cyan],
      'Sensor measured the air',
      ['Result = 0°C', C.cyan],
      'Important for frost'
    ])
  );

  const unknownLabel = tag(
    'TEMPERATURE UNKNOWN',
    C.muted,
    xAt(3) - (P ? 0.48 : 0.62),
    YB + (P ? 0.95 : 1.0),
    15
  );

  const questionMark = txt(
    '?',
    P ? 33 : 28,
    C.muted,
    xAt(3),
    yAt(3),
    true
  );

  const unknownGuide = dashed(
    xAt(3),
    yAt(0.45),
    xAt(3),
    yAt(6.5),
    C.muted
  );

  await until(S(12));
  await play(
    new M.FadeOut(zeroRing),
    new M.FadeOut(frostRisk),
    new M.FadeOut(frostLine),
    new M.FadeIn(unknownLabel),
    new M.Create(unknownGuide),
    new M.FadeIn(questionMark),
    new M.Indicate(gapMarker, { color: C.amber }),
    ...say('MISSING = WE DO NOT KNOW', C.muted),
    ...fbox([
      ['4:00', C.muted],
      'No reading arrived',
      'Temperature unknown',
      ['Not necessarily 0°C', C.amber]
    ], C.muted)
  );

  // Two large comparison cards: one contains a real
  // measured zero, the other a missing-value marker.

  const CARDW = P ? 2.85 : 3.10;
  const CARDH = P ? 4.4 : 2.75;
  const CARDY = P ? -2.0 : -0.48;
  const CARDSP = P ? 1.55 : 1.69;

  function meaningCard(x, missing) {
    const color = missing ? C.muted : C.cyan;

    const titleY = CARDY + CARDH / 2 - 0.39;
    const iconY = CARDY + (P ? 0.60 : 0.37);
    const valueY = CARDY - (P ? 0.18 : 0.24);
    const descY = CARDY - CARDH / 2 + 0.43;

    return new M.VGroup(
      rounded(
        x,
        CARDY,
        CARDW,
        CARDH,
        color
      ),
      txt(
        missing ? '4:00' : '2:00',
        19,
        color,
        x,
        titleY,
        true
      ),
      missing
        ? gapCircle(x, iconY, 0.27, C.muted)
        : glow(x, iconY, C.cyan, 0.16),
      txt(
        missing ? 'NA' : '0°C',
        P ? 37 : 32,
        color,
        x,
        valueY,
        true
      ),
      txt(
        missing ? 'Not available' : 'Measured',
        P ? 19 : 18,
        color,
        x,
        descY
      )
    );
  }

  const zeroCard = meaningCard(CX - CARDSP, false);
  const missingCard = meaningCard(CX + CARDSP, true);

  const meaning = new M.VGroup(zeroCard, missingCard);

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(
      axes,
      ...realDots,
      chartGap,
      unknownLabel,
      unknownGuide,
      questionMark
    )),
    new M.FadeIn(zeroCard),
    new M.FadeIn(missingCard),
    ...say('NA = NOT AVAILABLE', C.muted),
    ...fbox([
      ['0 = a measured value', C.cyan],
      ['NA = missing value', C.muted],
      'They are not the same'
    ])
  );

  // ------------------------------------------------------------
  // 14–17: the correct mean
  // ------------------------------------------------------------

  // Every hour has its own tile. Real measurements have
  // solid glowing dots; missing cells have dashed circles.
  // An invented measurement is pink, never sensor-A cyan.

  const SP = P ? 1.22 : 1.34;
  const TILEW = P ? 1.10 : 1.21;
  const TILEH = P ? 1.6 : 1.03;
  const TILEY = P ? -0.6 : 0.28;

  const tileX = i => CX + (i - 2) * SP;

  function readingTile(i, value, state = 'real') {
    const x = tileX(i);

    let color = C.cyan;

    if (state === 'missing') color = C.muted;
    if (state === 'invented') color = PINK;
    if (state === 'dropped') color = PINK;

    const border = rounded(
      x,
      TILEY,
      TILEW,
      TILEH,
      color,
      state === 'real' ? C.cyan : C.card,
      state === 'real' ? 0.075 : 0.95
    );

    const hour = txt(
      HOURS[i],
      P ? 17 : 16,
      C.muted,
      x,
      TILEY + TILEH / 2 + 0.28,
      true
    );

    let valueText;
    let marker;

    if (state === 'missing') {
      marker = gapCircle(
        x,
        TILEY + 0.19,
        P ? 0.18 : 0.14,
        C.muted
      );

      valueText = txt(
        'NA',
        P ? 20 : 18,
        C.muted,
        x,
        TILEY - 0.27,
        true
      );
    } else if (state === 'dropped') {
      marker = gapCircle(
        x,
        TILEY + 0.19,
        P ? 0.18 : 0.14,
        PINK
      );

      valueText = txt(
        'NA',
        P ? 20 : 18,
        PINK,
        x,
        TILEY - 0.27,
        true
      );
    } else {
      marker = glow(
        x,
        TILEY + 0.20,
        color,
        0.085
      );

      valueText = txt(
        `${value}`,
        P ? 27 : 24,
        color,
        x,
        TILEY - 0.24,
        true
      );
    }

    return new M.VGroup(
      border,
      hour,
      marker,
      valueText
    );
  }

  let tiles = DATA.map((v, i) =>
    readingTile(
      i,
      v,
      v === null ? 'missing' : 'real'
    )
  );

  const averageTitle = txt(
    'OVERNIGHT TEMPERATURES (°C)',
    P ? 17 : 16,
    C.muted,
    CX,
    P ? TILEY - TILEH / 2 - 0.34 : TILEY + TILEH / 2 + 0.6
  );

  const COUNTY = P ? -3.1 : -1.13;
  const RESULTY = P ? -5.1 : -2.22;

  let countNow = null;
  let totalNow = null;
  let answerNow = null;

  function countPicture(indices, color = C.green, label = '') {
    const n = indices.length;

    const dotY = COUNTY + (P ? 0.37 : 0.21);
    const spacing = P ? 0.53 : 0.48;

    const parts = indices.map((index, k) =>
      glow(
        CX + (k - (n - 1) / 2) * spacing,
        dotY,
        color,
        0.085
      )
    );

    parts.push(
      txt(
        label || `${n} readings counted`,
        P ? 20 : 18,
        color,
        CX,
        COUNTY - (P ? 0.25 : 0.27)
      )
    );

    return new M.VGroup(...parts);
  }

  function setCount(indices, color = C.green, label = '') {
    const next = countPicture(indices, color, label);

    const a = [new M.FadeIn(next)];

    if (countNow) a.push(new M.FadeOut(countNow));

    countNow = next;
    return a;
  }

  function setTotal(s, color = C.amber) {
    const t = txt(
      s,
      P ? 27 : 23,
      color,
      CX,
      P ? -4.1 : -1.75,
      true
    );

    const a = [new M.FadeIn(t)];

    if (totalNow) a.push(new M.FadeOut(totalNow));

    totalNow = t;
    return a;
  }

  function resultCard(value, color, label) {
    const w = P ? 4.55 : 4.70;
    const h = P ? 1.08 : 0.82;

    const r = rounded(
      CX,
      RESULTY,
      w,
      h,
      color,
      color,
      0.09
    );

    const valueText = txt(
      value,
      P ? 34 : 28,
      color,
      CX - (P ? 0.87 : 0.90),
      RESULTY,
      true
    );

    const labelText = txt(
      label,
      P ? 18 : 16,
      color,
      CX + (P ? 1.05 : 1.07),
      RESULTY
    );

    return new M.VGroup(r, valueText, labelText);
  }

  function setAnswer(value, color, label) {
    const next = resultCard(value, color, label);

    const a = [new M.FadeIn(next)];

    if (answerNow) a.push(new M.FadeOut(answerNow));

    answerNow = next;
    return a;
  }

  function clearAnswer() {
    if (!answerNow) return [];

    const old = answerNow;
    answerNow = null;

    return [new M.FadeOut(old)];
  }

  function clearTotal() {
    if (!totalNow) return [];

    const old = totalNow;
    totalNow = null;

    return [new M.FadeOut(old)];
  }

  let tileMarks = [];

  function marksFor(included, color = C.green, wrong = []) {
    const y = TILEY - TILEH / 2 - (P ? 0.72 : 0.3);

    const marks = included.map(i =>
      checkMark(
        tileX(i),
        y,
        wrong.includes(i) ? PINK : color
      )
    );

    const a = marks.map(m => new M.FadeIn(m));

    if (tileMarks.length) {
      a.push(
        new M.FadeOut(new M.VGroup(...tileMarks))
      );
    }

    tileMarks = marks;
    return a;
  }

  await until(S(14));
  await play(
    new M.FadeOut(meaning),
    new M.LaggedStart(
      tiles.map(t => new M.FadeIn(t)),
      { lagRatio: 0.11, runTime: 1.4 }
    ),
    new M.FadeIn(averageTitle),
    ...say('MEAN = TOTAL ÷ COUNT', C.amber),
    ...fbox([
      ['mean = total ÷ count', C.amber],
      'Total: add the values',
      'Count: how many values'
    ], C.amber)
  );

  const correctIncluded = [0, 1, 2, 4];

  await until(S(15));
  await play(
    ...marksFor(correctIncluded),
    ...setCount(
      correctIncluded,
      C.green,
      '4 real readings'
    ),
    ...say('USE THE FOUR REAL READINGS', C.green),
    ...fbox([
      ['Use: 2, 0, 4, 6', C.cyan],
      'Leave NA out',
      ['count = 4', C.green]
    ], C.green)
  );

  await until(S(16));
  await play(
    new M.LaggedStart(
      correctIncluded.map(i =>
        new M.Indicate(tiles[i], { color: C.amber })
      ),
      { lagRatio: 0.17, runTime: 1.5 }
    ),
    ...setTotal('2 + 0 + 4 + 6 = 12'),
    ...say('ADD THE FOUR MEASUREMENTS', C.amber),
    ...fbox([
      '2 + 0 + 4 + 6',
      ['total = 12', C.amber],
      ['count = 4', C.green]
    ], C.amber)
  );

  await until(S(17));
  await play(
    ...clearTotal(),
    ...setAnswer('3°C', C.green, 'CORRECT MEAN'),
    ...say('12 ÷ 4 = 3°C', C.green),
    ...fbox([
      'total = 12',
      'count = 4',
      ['mean = 12 ÷ 4', C.ink],
      ['     = 3°C', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 18–21: mistake one — replace the missing value with 0
  // ------------------------------------------------------------

  const allIncluded = [0, 1, 2, 3, 4];

  const inventedTile = readingTile(3, 0, 'invented');

  const inventedOutline = rounded(
    tileX(3),
    TILEY,
    TILEW + 0.10,
    TILEH + 0.10,
    PINK,
    PINK,
    0.04
  );

  const inventedLabel = tag(
    'INVENTED ZERO',
    PINK,
    CX,
    P ? -4.1 : -1.78,
    16
  );

  await until(S(18));
  await play(
    new M.FadeOut(tiles[3]),
    new M.FadeIn(inventedTile),
    new M.Create(inventedOutline),
    new M.FadeIn(inventedLabel),
    ...clearAnswer(),
    ...marksFor(allIncluded, C.green, [3]),
    ...setCount(
      allIncluded,
      PINK,
      '5 values counted'
    ),
    ...say('MISTAKE: FILL THE GAP WITH ZERO', PINK),
    ...fbox([
      ['NA → 0', PINK],
      'No measurement arrived',
      'But a zero was inserted'
    ], PINK)
  );

  tiles[3] = inventedTile;

  await until(S(19));
  await play(
    new M.FadeOut(inventedLabel),
    ...setTotal('2 + 0 + 4 + 0 + 6 = 12'),
    new M.Indicate(inventedTile, { color: PINK }),
    ...say('SAME TOTAL, WRONG COUNT', PINK),
    ...fbox([
      ['total = 12', C.amber],
      ['count = 5', PINK],
      'One invented reading'
    ], PINK)
  );

  await until(S(20));
  await play(
    ...clearTotal(),
    ...setAnswer('2.4°C', PINK, 'TOO LOW'),
    ...say('12 ÷ 5 = 2.4°C', PINK),
    ...fbox([
      'total = 12',
      ['count = 5', PINK],
      '12 ÷ 5',
      ['= 2.4°C', PINK]
    ], PINK)
  );

  const coldArrow = new M.VGroup(
    line(
      CX - 2.50,
      RESULTY + 0.40,
      CX - 2.50,
      RESULTY - 0.35,
      PINK,
      3
    ),
    line(
      CX - 2.50,
      RESULTY - 0.35,
      CX - 2.68,
      RESULTY - 0.12,
      PINK,
      3
    ),
    line(
      CX - 2.50,
      RESULTY - 0.35,
      CX - 2.32,
      RESULTY - 0.12,
      PINK,
      3
    )
  );

  await until(S(21));
  await play(
    new M.FadeIn(coldArrow),
    new M.Indicate(answerNow, { color: PINK }),
    ...say('WE INVENTED A FROZEN HOUR', PINK),
    ...fbox([
      ['Correct mean: 3°C', C.green],
      ['Wrong mean: 2.4°C', PINK],
      'The night looks colder'
    ], PINK)
  );

  // ------------------------------------------------------------
  // 22–25: mistake two — drop the real zero
  // ------------------------------------------------------------

  const restoredGap = readingTile(3, null, 'missing');
  const droppedZero = readingTile(1, null, 'dropped');

  const droppedOutline = rounded(
    tileX(1),
    TILEY,
    TILEW + 0.10,
    TILEH + 0.10,
    PINK,
    PINK,
    0.04
  );

  const droppedLabel = tag(
    'REAL ZERO REMOVED',
    PINK,
    CX,
    P ? -4.1 : -1.78,
    16
  );

  const remainingIncluded = [0, 2, 4];

  await until(S(22));
  await play(
    new M.FadeOut(coldArrow),
    new M.FadeOut(inventedOutline),
    new M.FadeOut(tiles[3]),
    new M.FadeIn(restoredGap),
    new M.FadeOut(tiles[1]),
    new M.FadeIn(droppedZero),
    new M.Create(droppedOutline),
    new M.FadeIn(droppedLabel),
    ...clearAnswer(),
    ...marksFor(remainingIncluded),
    ...setCount(
      remainingIncluded,
      PINK,
      '3 values counted'
    ),
    ...say('MISTAKE: TREAT REAL ZERO AS MISSING', PINK),
    ...fbox([
      ['0 → NA', PINK],
      'A real reading',
      'Was wrongly removed'
    ], PINK)
  );

  tiles[1] = droppedZero;
  tiles[3] = restoredGap;

  await until(S(23));
  await play(
    new M.FadeOut(droppedLabel),
    ...setTotal('2 + 4 + 6 = 12'),
    new M.LaggedStart(
      remainingIncluded.map(i =>
        new M.Indicate(tiles[i], { color: C.amber })
      ),
      { lagRatio: 0.16, runTime: 1.4 }
    ),
    ...say('SAME TOTAL, ONLY THREE COUNTED', PINK),
    ...fbox([
      ['total = 12', C.amber],
      ['count = 3', PINK],
      'Real zero left out'
    ], PINK)
  );

  await until(S(24));
  await play(
    ...clearTotal(),
    ...setAnswer('4°C', PINK, 'TOO HIGH'),
    ...say('12 ÷ 3 = 4°C', PINK),
    ...fbox([
      'total = 12',
      ['count = 3', PINK],
      '12 ÷ 3',
      ['= 4°C', PINK]
    ], PINK)
  );

  const warmArrow = new M.VGroup(
    line(
      CX - 2.50,
      RESULTY - 0.35,
      CX - 2.50,
      RESULTY + 0.40,
      PINK,
      3
    ),
    line(
      CX - 2.50,
      RESULTY + 0.40,
      CX - 2.68,
      RESULTY + 0.17,
      PINK,
      3
    ),
    line(
      CX - 2.50,
      RESULTY + 0.40,
      CX - 2.32,
      RESULTY + 0.17,
      PINK,
      3
    )
  );

  const lostFrost = snowflake(
    tileX(1),
    TILEY + 0.20,
    0.24
  );

  await until(S(25));
  await play(
    new M.FadeIn(warmArrow),
    new M.FadeIn(lostFrost),
    new M.Indicate(answerNow, { color: PINK }),
    ...say('WE LOST THE COLDEST REAL READING', PINK),
    ...fbox([
      ['Correct mean: 3°C', C.green],
      ['Wrong mean: 4°C', PINK],
      'The night looks warmer',
      'Frost risk is hidden'
    ], PINK)
  );

  // ------------------------------------------------------------
  // 26: compare all three answers on the same scale
  // ------------------------------------------------------------

  const MX0 = CX - (P ? 2.55 : 2.90);
  const MX1 = CX + (P ? 2.55 : 2.90);

  const MY = P ? -4.0 : -1.75;
  const MH = P ? 4.3 : 2.80;

  const m2y = v => MY + v / 5 * MH;

  const meansAxisParts = [
    line(MX0, MY, MX1, MY, C.muted, 2.5),
    line(MX0, MY, MX0, MY + MH, C.muted, 2.5),
    txt(
      '°C',
      16,
      C.muted,
      MX0 - 0.25,
      MY + MH + 0.23
    )
  ];

  for (let v = 0; v <= 5; v++) {
    meansAxisParts.push(
      line(
        MX0 - 0.07,
        m2y(v),
        MX0,
        m2y(v),
        C.muted,
        1.5
      ),
      txt(
        v,
        P ? 15 : 14,
        C.muted,
        MX0 - 0.23,
        m2y(v),
        true
      )
    );
  }

  const meansAxes = new M.VGroup(...meansAxisParts);

  const meansData = [
    {
      value: 2.4,
      color: PINK,
      label: 'Fill gap',
      count: '12 ÷ 5',
      status: 'TOO LOW'
    },
    {
      value: 3,
      color: C.green,
      label: 'Real values',
      count: '12 ÷ 4',
      status: 'CORRECT'
    },
    {
      value: 4,
      color: PINK,
      label: 'Drop zero',
      count: '12 ÷ 3',
      status: 'TOO HIGH'
    }
  ];

  const meanBars = meansData.map((d, i) => {
    const x = CX + (i - 1) * (P ? 1.62 : 1.85);
    const h = m2y(d.value) - MY;

    const bar = rect(
      x,
      MY + h / 2,
      P ? 1.04 : 1.20,
      h,
      d.color,
      0.65,
      2
    );

    const topValue = txt(
      `${d.value}°`,
      P ? 26 : 23,
      d.color,
      x,
      MY + h + 0.28,
      true
    );

    const label = txt(
      d.label,
      P ? 17 : 16,
      C.ink,
      x,
      MY - 0.29
    );

    const formula = txt(
      d.count,
      P ? 18 : 16,
      C.muted,
      x,
      MY - 0.64,
      true
    );

    const status = tag(
      d.status,
      d.color,
      x,
      MY - 1.08,
      P ? 15 : 13
    );

    return new M.VGroup(
      bar,
      topValue,
      label,
      formula,
      status
    );
  });

  const correctLevel = dashed(
    MX0,
    m2y(3),
    MX1,
    m2y(3),
    C.green
  );

  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(
      ...tiles,
      ...tileMarks,
      averageTitle,
      countNow,
      answerNow,
      droppedOutline,
      warmArrow,
      lostFrost
    )),
    new M.FadeIn(meansAxes),
    new M.LaggedStart(
      meanBars.map(b => new M.FadeIn(b)),
      { lagRatio: 0.18, runTime: 1.8 }
    ),
    new M.Create(correctLevel),
    ...say('THREE ANSWERS. ONLY ONE IS RIGHT.', C.green),
    ...fbox([
      ['12 ÷ 5 = 2.4°C', PINK],
      ['12 ÷ 4 = 3°C', C.green],
      ['12 ÷ 3 = 4°C', PINK]
    ], C.green)
  );

  countNow = null;
  answerNow = null;
  totalNow = null;
  tileMarks = [];

  // ------------------------------------------------------------
  // 27: zero counts in both sum and count;
  // missing counts in neither.
  // ------------------------------------------------------------

  const RULEY = P ? -2.0 : -0.48;
  const RULEW = P ? 2.84 : 3.12;
  const RULEH = P ? 5.0 : 3.05;
  const RULESP = P ? 1.56 : 1.70;

  function inclusionCard(x, missing) {
    const color = missing ? C.muted : C.cyan;

    const top = RULEY + RULEH / 2;
    const vY = top - (P ? 1.11 : 0.85);
    const sumY = RULEY - (P ? 0.12 : 0.14);
    const countY = RULEY - (P ? 1.23 : 0.95);

    return new M.VGroup(
      rounded(
        x,
        RULEY,
        RULEW,
        RULEH,
        color
      ),
      txt(
        missing ? 'MISSING' : 'REAL ZERO',
        P ? 19 : 17,
        color,
        x,
        top - 0.34
      ),
      txt(
        missing ? 'NA' : '0',
        P ? 38 : 34,
        color,
        x,
        vY,
        true
      ),
      line(
        x - RULEW / 2 + 0.16,
        sumY + 0.48,
        x + RULEW / 2 - 0.16,
        sumY + 0.48,
        C.muted,
        1
      ),
      txt(
        'TOTAL',
        16,
        C.muted,
        x,
        sumY + 0.13
      ),
      txt(
        missing ? 'Skip' : 'Add 0',
        P ? 23 : 21,
        missing ? C.muted : C.green,
        x,
        sumY - 0.25,
        true
      ),
      line(
        x - RULEW / 2 + 0.16,
        countY + 0.48,
        x + RULEW / 2 - 0.16,
        countY + 0.48,
        C.muted,
        1
      ),
      txt(
        'COUNT',
        16,
        C.muted,
        x,
        countY + 0.12
      ),
      txt(
        missing ? 'Skip' : 'Add 1',
        P ? 23 : 21,
        missing ? C.muted : C.green,
        x,
        countY - 0.25,
        true
      )
    );
  }

  const inclusion = new M.VGroup(
    inclusionCard(CX - RULESP, false),
    inclusionCard(CX + RULESP, true)
  );

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(
      meansAxes,
      ...meanBars,
      correctLevel
    )),
    new M.FadeIn(inclusion),
    ...say('ZERO COUNTS. MISSING DOES NOT.', C.green),
    ...fbox([
      ['Zero:', C.cyan],
      'Total + 0, count + 1',
      ['Missing:', C.muted],
      'Exclude from both'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 28–31: the general mean formula and the real count
  // ------------------------------------------------------------

  const formulaY = P ? -2.0 : -0.45;
  const formulaW = P ? 6.10 : 6.55;
  const formulaH = P ? 4.0 : 2.60;

  const bigFormulaPanel = rounded(
    CX,
    formulaY,
    formulaW,
    formulaH,
    C.green
  );

  const bigMeanLabel = txt(
    'MEAN',
    P ? 24 : 22,
    C.green,
    CX,
    formulaY + formulaH / 2 - 0.38
  );

  const numerator = txt(
    'Sum of real readings',
    P ? 24 : 23,
    C.amber,
    CX,
    formulaY + 0.34
  );

  const fractionBar = line(
    CX - (P ? 2.42 : 2.55),
    formulaY,
    CX + (P ? 2.42 : 2.55),
    formulaY,
    C.ink,
    2.5
  );

  const denominator = txt(
    'Count of real readings',
    P ? 24 : 23,
    C.green,
    CX,
    formulaY - 0.35
  );

  const formulaNote = txt(
    'Only measurements enter the mean',
    P ? 17 : 16,
    C.muted,
    CX,
    formulaY - formulaH / 2 + 0.28
  );

  const bigFormula = new M.VGroup(
    bigFormulaPanel,
    bigMeanLabel,
    numerator,
    fractionBar,
    denominator,
    formulaNote
  );

  await until(S(28));
  await play(
    new M.FadeOut(inclusion),
    new M.FadeIn(bigFormulaPanel),
    new M.FadeIn(bigMeanLabel),
    new M.FadeIn(numerator),
    new M.Create(fractionBar),
    new M.FadeIn(denominator),
    new M.FadeIn(formulaNote),
    ...say('USE THE REAL READINGS ONLY', C.green),
    ...fbox([
      ['mean = real sum', C.ink],
      ['       ÷ real count', C.ink]
    ], C.green)
  );

  const twelve = txt(
    '12',
    P ? 37 : 32,
    C.amber,
    CX,
    formulaY + 0.34,
    true
  );

  const four = txt(
    '4',
    P ? 37 : 32,
    C.green,
    CX,
    formulaY - 0.35,
    true
  );

  const threeLabel = tag(
    '= 3°C',
    C.green,
    CX,
    formulaY - formulaH / 2 - 0.40,
    24
  );

  await until(S(29));
  await play(
    new M.Transform(numerator, twelve),
    new M.Transform(denominator, four),
    new M.FadeIn(threeLabel),
    ...say('12 ÷ 4 = 3°C', C.green),
    ...fbox([
      ['real sum = 12', C.amber],
      ['real count = 4', C.green],
      ['mean = 3°C', C.green]
    ], C.green)
  );

  const correctTiles = DATA.map((v, i) =>
    readingTile(
      i,
      v,
      v === null ? 'missing' : 'real'
    )
  );

  const correctAnswer = resultCard(
    '3°C',
    C.green,
    'CORRECT MEAN'
  );

  const finalCountPicture = countPicture(
    [0, 1, 2, 4],
    C.green,
    '4 real readings'
  );

  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(
      bigFormulaPanel,
      bigMeanLabel,
      numerator,
      fractionBar,
      denominator,
      formulaNote,
      threeLabel
    )),
    new M.FadeIn(new M.VGroup(...correctTiles)),
    new M.FadeIn(correctAnswer),
    ...say('KEEP ZERO AND MISSING APART', C.green),
    ...fbox([
      ['0 stays in the data', C.cyan],
      ['NA remains missing', C.muted],
      ['Mean stays honest', C.green]
    ], C.green)
  );

  const expectedLabel = txt(
    '5 expected hours',
    P ? 20 : 18,
    C.muted,
    CX,
    P ? TILEY - TILEH / 2 - 0.55 : -0.56
  );

  const countDetail = tag(
    '1 READING MISSING',
    C.muted,
    CX,
    P ? -4.1 : -1.77,
    16
  );

  await until(S(31));
  await play(
    new M.FadeIn(expectedLabel),
    new M.FadeIn(finalCountPicture),
    new M.FadeIn(countDetail),
    ...say('KNOW HOW MANY READINGS YOU REALLY HAVE', C.green),
    ...fbox([
      'Expected: 5',
      ['Available: 4', C.green],
      ['Missing: 1', C.muted]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 32–33: missing-value codes
  // ------------------------------------------------------------

  // These are examples of storage conventions, not new
  // measurements from the greenhouse.

  const CODEY = P ? -1.3 : -0.42;
  const CODESP = P ? 1.94 : 2.14;
  const CODEW = P ? 1.77 : 1.95;
  const CODEH = P ? 2.63 : 2.17;

  const codeValues = [
    ['NA', C.muted, 'Explicit'],
    ['0', PINK, 'Ambiguous'],
    ['−999', PINK, 'Special code']
  ];

  const codeCards = codeValues.map(([v, color, label], i) => {
    const x = CX + (i - 1) * CODESP;

    return new M.VGroup(
      rounded(
        x,
        CODEY,
        CODEW,
        CODEH,
        color
      ),
      txt(
        v,
        P ? 29 : 27,
        color,
        x,
        CODEY + 0.38,
        true
      ),
      txt(
        label,
        P ? 15 : 14,
        color,
        x,
        CODEY - 0.37
      )
    );
  });

  const codesLabel = tag(
    'EXAMPLE STORAGE CODES',
    C.amber,
    CX,
    CODEY - CODEH / 2 - 0.39,
    16
  );

  const codesPicture = new M.VGroup(
    ...codeCards,
    codesLabel
  );

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(
      ...correctTiles,
      correctAnswer,
      expectedLabel,
      finalCountPicture,
      countDetail
    )),
    new M.LaggedStart(
      codeCards.map(c => new M.FadeIn(c)),
      { lagRatio: 0.18, runTime: 1.7 }
    ),
    new M.FadeIn(codesLabel),
    ...say('TRAP: MISSING MAY HAVE A SPECIAL CODE', C.amber),
    ...fbox([
      'Possible missing codes:',
      ['NA', C.muted],
      ['0 or −999', PINK],
      'Check the documentation'
    ], C.amber)
  );

  const documentationY = P ? -4.6 : -2.26;

  const documentation = new M.VGroup(
    rounded(
      CX,
      documentationY,
      P ? 5.50 : 6.10,
      P ? 1.30 : 0.95,
      C.violet
    ),
    txt(
      'WHAT DOES THIS CODE MEAN?',
      P ? 19 : 18,
      C.violet,
      CX,
      documentationY + 0.19
    ),
    txt(
      'Check the system documentation',
      P ? 17 : 16,
      C.ink,
      CX,
      documentationY - 0.21
    )
  );

  await until(S(33));
  await play(
    new M.FadeIn(documentation),
    new M.Indicate(codeCards[1], { color: C.amber }),
    new M.Indicate(codeCards[2], { color: C.amber }),
    ...say('CHECK THE MISSING-VALUE CONVENTION', C.violet),
    ...fbox([
      ['Before calculating:', C.violet],
      'Find the missing codes',
      'Keep genuine zeros',
      'Mark actual gaps as NA'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 34: software excludes correctly stored missing values
  // ------------------------------------------------------------

  const SWY = P ? -2.0 : -0.45;
  const SWW = P ? 5.95 : 6.50;
  const SWH = P ? 5.0 : 3.30;

  const softwarePanel = rounded(
    CX,
    SWY,
    SWW,
    SWH,
    C.green
  );

  const softwareTitle = txt(
    'MISSING-AWARE AVERAGE',
    P ? 21 : 19,
    C.green,
    CX,
    SWY + SWH / 2 - 0.38
  );

  const softwareY = SWY + (P ? 0.75 : 0.51);

  const softwareTiles = DATA.map((v, i) => {
    const x = CX + (i - 2) * (P ? 1.00 : 1.10);
    const color = v === null ? C.muted : C.cyan;

    return new M.VGroup(
      rounded(
        x,
        softwareY,
        P ? 0.87 : 0.96,
        P ? 0.73 : 0.60,
        color,
        color,
        0.075
      ),
      txt(
        v === null ? 'NA' : v,
        P ? 23 : 21,
        color,
        x,
        softwareY,
        true
      )
    );
  });

  const includedLabels = DATA.map((v, i) => {
    const x = CX + (i - 2) * (P ? 1.00 : 1.10);
    const y = softwareY - (P ? 0.66 : 0.50);

    if (v === null) {
      return txt(
        'Skip',
        15,
        C.muted,
        x,
        y
      );
    }

    return checkMark(x, y, C.green);
  });

  const softwareResult = txt(
    '12 ÷ 4 = 3°C',
    P ? 32 : 28,
    C.green,
    CX,
    SWY - (P ? 0.82 : 0.69),
    true
  );

  const softwareNote = txt(
    'NA must actually be stored as missing',
    P ? 17 : 16,
    C.muted,
    CX,
    SWY - SWH / 2 + 0.38
  );

  const softwarePicture = new M.VGroup(
    softwarePanel,
    softwareTitle,
    ...softwareTiles,
    ...includedLabels,
    softwareResult,
    softwareNote
  );

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(
      ...codeCards,
      codesLabel,
      documentation
    )),
    new M.FadeIn(softwarePanel),
    new M.FadeIn(softwareTitle),
    new M.LaggedStart(
      softwareTiles.map(t => new M.FadeIn(t)),
      { lagRatio: 0.09, runTime: 1.1 }
    ),
    new M.FadeIn(new M.VGroup(...includedLabels)),
    new M.FadeIn(softwareResult),
    new M.FadeIn(softwareNote),
    ...say('SOFTWARE CAN SKIP REAL MISSING VALUES', C.green),
    ...fbox([
      ['Stored as missing?', C.violet],
      'Then it can be skipped',
      ['Stored as a number?', C.amber],
      'It may be counted'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 35–36: why a measurement went missing matters
  // ------------------------------------------------------------

  // No temperature is invented for the missing 4:00 reading.
  // Instead, two possible reasons for a gap are introduced
  // visually, without asserting either occurred this night.

  const WHY_Y = P ? -2.0 : -0.42;
  const WHY_W = P ? 5.85 : 6.45;
  const WHY_H = P ? 5.2 : 3.25;

  const whyPanel = rounded(
    CX,
    WHY_Y,
    WHY_W,
    WHY_H,
    C.amber
  );

  const whyTitle = txt(
    'WHY IS THE READING MISSING?',
    P ? 20 : 19,
    C.amber,
    CX,
    WHY_Y + WHY_H / 2 - 0.40
  );

  const whyGapY = WHY_Y + (P ? 0.68 : 0.47);

  const whyGap = gapCircle(
    CX,
    whyGapY,
    P ? 0.30 : 0.25,
    C.muted
  );

  const branchY = WHY_Y - (P ? 0.12 : 0.10);
  const branchX = P ? 1.43 : 1.58;

  const branches = new M.VGroup(
    line(
      CX,
      whyGapY - 0.30,
      CX,
      branchY,
      C.muted
    ),
    line(
      CX - branchX,
      branchY,
      CX + branchX,
      branchY,
      C.muted
    ),
    line(
      CX - branchX,
      branchY,
      CX - branchX,
      branchY - 0.30,
      C.muted
    ),
    line(
      CX + branchX,
      branchY,
      CX + branchX,
      branchY - 0.30,
      C.muted
    )
  );

  const whyCardY = WHY_Y - (P ? 1.15 : 0.88);
  const whyCardW = P ? 2.63 : 2.90;
  const whyCardH = P ? 1.43 : 1.13;

  const unrelatedCause = new M.VGroup(
    rounded(
      CX - branchX,
      whyCardY,
      whyCardW,
      whyCardH,
      C.green,
      C.card,
      1
    ),
    txt(
      'Unrelated',
      P ? 20 : 18,
      C.green,
      CX - branchX,
      whyCardY + 0.23
    ),
    txt(
      'to temperature',
      P ? 17 : 16,
      C.ink,
      CX - branchX,
      whyCardY - 0.22
    )
  );

  const temperatureCause = new M.VGroup(
    rounded(
      CX + branchX,
      whyCardY,
      whyCardW,
      whyCardH,
      PINK,
      C.card,
      1
    ),
    txt(
      'Depends on',
      P ? 20 : 18,
      PINK,
      CX + branchX,
      whyCardY + 0.23
    ),
    txt(
      'temperature',
      P ? 17 : 16,
      C.ink,
      CX + branchX,
      whyCardY - 0.22
    )
  );

  const whyPicture = new M.VGroup(
    whyPanel,
    whyTitle,
    whyGap,
    branches,
    unrelatedCause,
    temperatureCause
  );

  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(
      softwarePanel,
      softwareTitle,
      ...softwareTiles,
      ...includedLabels,
      softwareResult,
      softwareNote
    )),
    new M.FadeIn(whyPanel),
    new M.FadeIn(whyTitle),
    new M.FadeIn(whyGap),
    new M.Create(branches),
    new M.FadeIn(unrelatedCause),
    new M.FadeIn(temperatureCause),
    ...say('THE REASON FOR A GAP MATTERS', C.amber),
    ...fbox([
      ['If gaps depend on', C.amber],
      ['temperature,', C.amber],
      'the available readings',
      'can give a biased mean'
    ], C.amber)
  );

  await until(S(36));
  await play(
    new M.Indicate(whyGap, { color: C.violet }),
    ...say('NEXT: WHY DO VALUES GO MISSING?', C.violet),
    ...fbox([
      ['Next lesson', C.violet],
      'Missingness mechanisms',
      'Why readings disappear'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 37: final visual summary
  // ------------------------------------------------------------

  const FY = P ? -2.0 : -0.48;
  const FSP = P ? 1.55 : 1.72;
  const FWIDTH = P ? 2.86 : 3.18;
  const FHEIGHT = P ? 4.6 : 2.95;

  function finalCard(x, missing) {
    const color = missing ? C.muted : C.cyan;

    const top = FY + FHEIGHT / 2;

    const iconY = FY + (P ? 0.85 : 0.58);
    const valueY = FY + (P ? 0.07 : -0.03);
    const descY = FY - (P ? 0.73 : 0.64);

    return new M.VGroup(
      rounded(
        x,
        FY,
        FWIDTH,
        FHEIGHT,
        color
      ),
      txt(
        missing ? 'MISSING' : 'ZERO',
        P ? 22 : 21,
        color,
        x,
        top - 0.38
      ),
      missing
        ? gapCircle(x, iconY, 0.27, C.muted)
        : glow(x, iconY, C.cyan, 0.16),
      txt(
        missing ? 'NA' : '0°C',
        P ? 36 : 32,
        color,
        x,
        valueY,
        true
      ),
      txt(
        missing ? 'No measurement' : 'A measurement',
        P ? 18 : 17,
        color,
        x,
        descY
      ),
      txt(
        missing ? 'Exclude' : 'Include',
        P ? 21 : 19,
        missing ? C.muted : C.green,
        x,
        FY - FHEIGHT / 2 + 0.37
      )
    );
  }

  const finalZero = finalCard(CX - FSP, false);
  const finalMissing = finalCard(CX + FSP, true);

  const finalRule = tag(
    'NEVER MIX THEM UP',
    C.green,
    CX,
    FY - FHEIGHT / 2 - 0.44,
    18
  );

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(
      whyPanel,
      whyTitle,
      whyGap,
      branches,
      unrelatedCause,
      temperatureCause
    )),
    new M.FadeIn(finalZero),
    new M.FadeIn(finalMissing),
    new M.FadeIn(finalRule),
    ...say('ZERO IS A MEASUREMENT. MISSING IS NOT.', C.green),
    ...fbox([
      ['Zero = measured value', C.cyan],
      ['NA = no measurement', C.muted],
      ['Real sum ÷ real count', C.green],
      ['12 ÷ 4 = 3°C', C.green]
    ], C.green)
  );
}

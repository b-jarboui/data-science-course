// lesson 3.2.9
// Outlier investigation — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter data: greenhouse, Sensor A, fault day and heat day.
// Uses the approved engine API; browser playback has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  const D1 = [24, 25, 55, 26, 27];
  const D2 = [30, 34, 39, 41, 38];

  const HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00'];

  const PINK = C.pink || '#ff619e';
  const WHITE = '#ffffff';

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // Shared visual helpers
  // ------------------------------------------------------------

  function txt(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

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

  function circle(x, y, radius, color, opacity = 1) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function tag(s, color, x, y, size = 17, maxw = null) {
    const p = pill(s, color, size);

    if (maxw !== null && p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function glow(x, y, color = C.cyan, radius = 0.105) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.3,
      color
    });

    halo.setFill(color, 0.15);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  function ring(x, y, color, radius = 0.23) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0.035);
    r.moveTo([x, y, 0]);

    return r;
  }

  function checkMark(x, y, color = C.green, scale = 1) {
    return new M.VGroup(
      line(
        x - 0.12 * scale,
        y,
        x - 0.035 * scale,
        y - 0.09 * scale,
        color,
        3
      ),
      line(
        x - 0.035 * scale,
        y - 0.09 * scale,
        x + 0.15 * scale,
        y + 0.12 * scale,
        color,
        3
      )
    );
  }

  function crossMark(x, y, color = PINK, scale = 1) {
    const r = 0.12 * scale;

    return new M.VGroup(
      line(x - r, y - r, x + r, y + r, color, 3),
      line(x - r, y + r, x + r, y - r, color, 3)
    );
  }

  function gapCircle(x, y, radius = 0.18, color = C.muted) {
    const parts = [];
    const n = 14;

    for (let k = 0; k < n; k++) {
      const a = 2 * Math.PI * k / n;
      const b = a + 2 * Math.PI / n * 0.56;

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

  function flag(x, y, scale = 1) {
    const h = 0.46 * scale;
    const w = 0.29 * scale;

    return new M.VGroup(
      line(x, y, x, y + h, PINK, 2.5),
      rect(
        x + w / 2,
        y + h * 0.79,
        w,
        h * 0.42,
        PINK,
        0.75
      )
    );
  }

  function arrow(x1, y1, x2, y2, color = C.amber) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = 0.15;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),
      line(
        x2,
        y2,
        x2 - len * Math.cos(angle - Math.PI / 5),
        y2 - len * Math.sin(angle - Math.PI / 5),
        color,
        2.5
      ),
      line(
        x2,
        y2,
        x2 - len * Math.cos(angle + Math.PI / 5),
        y2 - len * Math.sin(angle + Math.PI / 5),
        color,
        2.5
      )
    );
  }

  // Track only top-level on-screen objects.
  // This avoids wrapping existing objects in new VGroups.

  const visible = new Set();

  function put(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.FadeIn(o);
    });
  }

  function draw(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.Create(o);
    });
  }

  function take(...objects) {
    const a = [];

    for (const o of objects) {
      if (o && visible.has(o)) {
        visible.delete(o);
        a.push(new M.FadeOut(o));
      }
    }

    return a;
  }

  function clearPicture() {
    const a = Array.from(visible).map(o =>
      new M.FadeOut(o)
    );

    visible.clear();

    return a;
  }

  function lagIn(objects, lagRatio = 0.12, runTime = 1.4) {
    for (const o of objects) visible.add(o);

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // Formula box follows the approved reference lesson.

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

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

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
  // 0: greenhouse and Sensor A
  // ------------------------------------------------------------

  const GX = CX;
  const GBASE = P ? -3.30 : -2.02;
  const GW = P ? 5.85 : 6.4;
  const GH = P ? 2.95 : 2.4;

  const GL = GX - GW / 2;
  const GR = GX + GW / 2;
  const GEAVE = GBASE + GH;
  const GROOF = GEAVE + (P ? 1.05 : 0.78);

  function tomatoPlant(x, height) {
    const y = GBASE + 0.25;

    const parts = [
      rect(
        x,
        GBASE + 0.13,
        0.48,
        0.26,
        C.amber,
        0.25
      ),
      line(x, y, x, y + height, C.green, 3)
    ];

    for (let k = 0; k < 3; k++) {
      const yy = y + 0.22 + k * height / 4;
      const side = k % 2 === 0 ? -1 : 1;

      parts.push(
        line(
          x,
          yy,
          x + side * 0.30,
          yy + 0.18,
          C.green,
          2.5
        ),
        circle(
          x + side * 0.25,
          yy + 0.17,
          0.12,
          C.green,
          0.7
        ),
        circle(
          x - side * 0.17,
          yy + 0.04,
          0.105,
          '#ff655f',
          0.95
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function sensorIcon(x, y, color, value = null) {
    const parts = [
      rounded(x, y, 0.66, 0.86, color),
      rect(
        x,
        y + 0.11,
        0.47,
        0.28,
        color,
        0.16
      ),
      circle(
        x,
        y - 0.22,
        0.055,
        C.green,
        1
      )
    ];

    if (value !== null) {
      parts.push(
        txt(
          value,
          15,
          color,
          x,
          y + 0.11,
          true,
          0.43
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function greenhouseShell() {
    const doorX = GR - 0.67;

    return new M.VGroup(
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
      ),
      rect(
        doorX,
        GBASE + 0.87,
        0.85,
        1.74,
        C.cyan,
        0.025
      ),
      circle(
        doorX + 0.25,
        GBASE + 0.87,
        0.045,
        C.ink
      )
    );
  }

  function greenhousePlants() {
    return Array.from({ length: 5 }, (_, i) =>
      tomatoPlant(
        GL + 0.58 + i * (GW - 1.95) / 4,
        1.0 + (i % 3) * 0.15
      )
    );
  }

  const greenhouse = greenhouseShell();
  const plants = greenhousePlants();

  const sensorAX = GR - 0.76;
  const sensorAY = GEAVE - 0.54;

  const sensorA = new M.VGroup(
    line(
      sensorAX,
      GEAVE,
      sensorAX,
      sensorAY + 0.43,
      C.muted
    ),
    sensorIcon(sensorAX, sensorAY, C.cyan)
  );

  const sensorALabel = tag(
    'SENSOR A',
    C.cyan,
    sensorAX - 0.93,
    sensorAY + 0.43,
    16
  );

  const greenhouseLabel = txt(
    'TOMATO GREENHOUSE',
    17,
    C.green,
    GX,
    GBASE - 0.38
  );

  await until(S(0));
  await play(
    ...draw(greenhouse),
    lagIn(plants, 0.10, 1.35),
    ...put(
      sensorA,
      sensorALabel,
      greenhouseLabel
    ),
    new M.Flash(sensorA, { color: C.cyan }),
    ...say('TWO DAYS. TWO STRANGE READINGS.'),
    ...fbox([
      ['Sensor A', C.cyan],
      'By the door',
      'Two different days'
    ])
  );

  // ------------------------------------------------------------
  // 1–3: two days in the glowing log
  // ------------------------------------------------------------

  const TW = P ? 6.15 : 6.85;
  const TH = P ? 0.78 : 0.53;

  const TY = P ? 0.96 : 1.05;
  const TL = CX - TW / 2;
  const TR = CX + TW / 2;

  const COL = [
    TL + TW * 0.16,
    TL + TW * 0.40,
    TL + TW * 0.66,
    TL + TW * 0.87
  ];

  const rowY = i => TY - (i + 1) * TH;

  const tableParts = [
    rounded(
      CX,
      TY - 2.5 * TH,
      TW,
      TH * 6 + 0.15,
      C.cyan,
      C.card,
      0.4
    )
  ];

  const headers = [
    ['Sensor', COL[0]],
    ['Time', COL[1]],
    ['Day 1', COL[2]],
    ['Day 2', COL[3]]
  ];

  for (const [s, x] of headers) {
    tableParts.push(
      txt(
        s,
        P ? 18 : 17,
        C.muted,
        x,
        TY,
        true,
        1.4
      )
    );
  }

  for (let i = 0; i < 5; i++) {
    const y = TY - (i + 0.5) * TH;

    tableParts.push(
      line(TL + 0.12, y, TR - 0.12, y, C.muted, 1)
    );

    tableParts.push(
      txt(
        'A',
        P ? 21 : 19,
        C.cyan,
        COL[0],
        rowY(i),
        true
      ),
      txt(
        HOURS[i],
        P ? 21 : 19,
        C.ink,
        COL[1],
        rowY(i),
        true
      )
    );
  }

  const log = new M.VGroup(...tableParts);

  const logNote = txt(
    'TEMPERATURES IN °C',
    16,
    C.muted,
    CX,
    rowY(4) - 0.52
  );

  const day1Values = D1.map((v, i) =>
    txt(
      v,
      P ? 25 : 23,
      C.cyan,
      COL[2],
      rowY(i),
      true
    )
  );

  const day2Values = D2.map((v, i) =>
    txt(
      v,
      P ? 25 : 23,
      C.cyan,
      COL[3],
      rowY(i),
      true
    )
  );

  await until(S(1));
  await play(
    ...clearPicture(),
    ...put(log, logNote),
    ...say('10:00 TO 14:00 ON BOTH DAYS'),
    ...fbox([
      'Five hourly readings',
      'on each day',
      ['Same sensor', C.cyan]
    ])
  );

  await until(S(2));
  await play(
    lagIn(day1Values, 0.18, 1.8),
    ...say('DAY 1'),
    ...fbox([
      ['DAY 1', C.cyan],
      '24, 25, 55, 26, 27',
      'degrees Celsius'
    ])
  );

  await until(S(3));
  await play(
    lagIn(day2Values, 0.18, 1.8),
    ...say('DAY 2'),
    ...fbox([
      ['DAY 2', C.cyan],
      '30, 34, 39, 41, 38',
      'degrees Celsius'
    ])
  );

  // ------------------------------------------------------------
  // Chart helpers: both days use identical axes
  // ------------------------------------------------------------

  // The charts display 15–60°C to make the two shapes
  // readable. This is a viewing window, not the validation
  // range, which remains −10°C to 60°C.

  const XL = CX - (P ? 3.05 : 3.55);
  const XR = CX + (P ? 3.15 : 3.75);

  const X0 = XL + 0.40;
  const X1 = XR - 0.38;

  const MIN = 15;
  const MAX = 60;

  const PANELS = [
    {
      bottom: P ? -0.60 : -0.22,
      top: P ? 1.20 : 1.08,
      title: P ? 1.65 : 1.43
    },
    {
      bottom: P ? -4.33 : -2.50,
      top: P ? -1.97 : -1.20,
      title: P ? -1.47 : -0.87
    }
  ];

  const xAt = i =>
    X0 + i * (X1 - X0) / 4;

  function yAt(day, v) {
    const p = PANELS[day];

    return p.bottom +
      (v - MIN) / (MAX - MIN) *
      (p.top - p.bottom);
  }

  function point(day, i, v) {
    return [
      xAt(i),
      yAt(day, v),
      0
    ];
  }

  function chartAxes(day) {
    const p = PANELS[day];

    const parts = [
      line(XL, p.bottom, XR, p.bottom, C.muted, 2),
      line(XL, p.bottom, XL, p.top, C.muted, 2),
      txt(
        `DAY ${day + 1}`,
        P ? 18 : 17,
        C.cyan,
        XL + 0.56,
        p.title
      ),
      txt(
        '°C',
        P ? 16 : 14,
        C.muted,
        XL - 0.25,
        p.top + 0.18
      )
    ];

    for (const v of [20, 40, 60]) {
      const y = yAt(day, v);

      parts.push(
        line(
          XL - 0.07,
          y,
          XL,
          y,
          C.muted,
          1.5
        ),
        txt(
          v,
          P ? 16 : 14,
          C.muted,
          XL - 0.27,
          y,
          true
        )
      );   // no full-width grid lines: they struck through the value labels
    }

    for (let i = 0; i < HOURS.length; i++) {
      parts.push(
        line(
          xAt(i),
          p.bottom,
          xAt(i),
          p.bottom - 0.06,
          C.muted,
          1.5
        ),
        txt(
          HOURS[i],
          P ? 16 : 14,
          C.muted,
          xAt(i),
          p.bottom - (P ? 0.27 : 0.22),
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function chartDot(day, i, v, color = C.cyan) {
    const [x, y] = point(day, i, v);

    const d = glow(
      x,
      y,
      color,
      P ? 0.095 : 0.080
    );

    const lab = txt(
      v,
      P ? 18 : 16,
      color,
      x,
      y + (P ? 0.26 : 0.19),
      true
    );

    return new M.VGroup(d, lab);
  }

  function chartSegment(
    day, i, j, data,
    color = C.cyan,
    sw = 2
  ) {
    return new M.Line({
      start: point(day, i, data[i]),
      end: point(day, j, data[j]),
      color,
      strokeWidth: sw
    });
  }

  function allSegments(day, data, color = C.cyan) {
    return Array.from({ length: 4 }, (_, i) =>
      chartSegment(day, i, i + 1, data, color)
    );
  }

  function makeCharts() {
    return {
      axes: [
        chartAxes(0),
        chartAxes(1)
      ],
      dots: [
        D1.map((v, i) => chartDot(0, i, v)),
        D2.map((v, i) => chartDot(1, i, v))
      ],
      segments: [
        allSegments(0, D1),
        allSegments(1, D2)
      ]
    };
  }

  function highlightDot(day, i, value, color = PINK) {
    const [x, y] = point(day, i, value);

    return ring(
      x,
      y,
      color,
      P ? 0.22 : 0.17
    );
  }

  function missingMarker(day, i, color = C.muted) {
    // Missing values are shown outside the measured
    // temperature area, never at an invented temperature.

    const x = xAt(i);
    const y = PANELS[day].title;

    return new M.VGroup(
      gapCircle(x, y, P ? 0.15 : 0.12, color),
      txt(
        'NA',
        P ? 17 : 15,
        color,
        x + 0.35,
        y,
        true
      )
    );
  }

  let charts = makeCharts();

  // ------------------------------------------------------------
  // 4–9: two apparent outliers, both within the valid range
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...clearPicture(),
    ...put(...charts.axes),
    lagIn(
      charts.dots.flat(),
      0.075,
      1.6
    ),
    ...say('SAME HOURS. SAME TEMPERATURE SCALE.'),
    ...fbox([
      ['Across', C.muted],
      'Time of day',
      ['Up', C.muted],
      'Temperature (°C)'
    ])
  );

  let suspect1 = highlightDot(0, 2, 55, PINK);
  let suspect2 = highlightDot(1, 3, 41, PINK);

  await until(S(5));
  await play(
    ...draw(suspect1, suspect2),
    new M.Flash(
      charts.dots[0][2].submobjects[0],
      { color: PINK }
    ),
    new M.Flash(
      charts.dots[1][3].submobjects[0],
      { color: PINK }
    ),
    ...say('TWO HIGH READINGS', PINK),
    ...fbox([
      ['Day 1: 55°C', PINK],
      ['Day 2: 41°C', PINK],
      'Both stand out'
    ], PINK)
  );

  await until(S(6));
  await play(
    new M.Indicate(suspect1, { color: PINK }),
    new M.Indicate(suspect2, { color: PINK }),
    ...say('OUTLIER = A VALUE FAR FROM THE OTHERS', PINK),
    ...fbox([
      ['OUTLIER', PINK],
      'An unusually distant',
      'value',
      'A reason to investigate'
    ], PINK)
  );

  const limitLines = PANELS.map(p =>
    line(XL, p.top, XR, p.top, C.green, 2.5)
  );

  const pass1 = tag(
    '55: PASS',
    C.green,
    XR - 0.70,
    PANELS[0].title,
    P ? 15 : 14
  );

  const pass2 = tag(
    '41: PASS',
    C.green,
    XR - 0.70,
    PANELS[1].title,
    P ? 15 : 14
  );

  await until(S(7));
  await play(
    ...draw(...limitLines),
    ...put(pass1, pass2),
    ...say('BOTH PASS THE VALIDATION RULE', C.green),
    ...fbox([
      ['Sensor A rule', C.green],
      '−10 ≤ reading ≤ 60',
      ['55°C: PASS', C.green],
      ['41°C: PASS', C.green]
    ], C.green)
  );

  await until(S(8));
  await play(
    ...take(pass1, pass2, ...limitLines),
    new M.Indicate(
      charts.dots[0][2],
      { color: C.amber }
    ),
    new M.Indicate(
      charts.dots[1][3],
      { color: C.amber }
    ),
    ...say('FAULT OR REAL HEAT?', C.amber),
    ...fbox([
      ['55°C: fault or real?', C.amber],
      ['41°C: fault or real?', C.amber],
      'A rule cannot decide'
    ], C.amber)
  );

  const question1 = tag(
    'DELETE?',
    PINK,
    XR - 0.72,
    PANELS[0].title,
    15
  );

  const question2 = tag(
    'DELETE?',
    PINK,
    XR - 0.72,
    PANELS[1].title,
    15
  );

  await until(S(9));
  await play(
    ...put(question1, question2),
    ...say('DO NOT DELETE JUST BECAUSE IT IS HIGH', PINK),
    ...fbox([
      'Deleting is easy',
      ['But is it correct?', C.amber],
      'One value may matter',
      'more than all the rest'
    ], PINK)
  );

  // ------------------------------------------------------------
  // 10–16: investigation step one — neighbours in time
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...take(question1, question2),
    ...say('INVESTIGATE BEFORE DECIDING', C.amber),
    ...fbox([
      ['CHECK 1', C.amber],
      'Neighbours in time',
      'Before and after'
    ], C.amber)
  );

  const timeFocus1 = rounded(
    (xAt(1) + xAt(3)) / 2,
    (PANELS[0].top + PANELS[0].bottom) / 2,
    xAt(3) - xAt(1) + 0.57,
    PANELS[0].top - PANELS[0].bottom + 0.10,
    C.amber,
    C.amber,
    0.025
  );

  await until(S(11));
  await play(
    ...draw(timeFocus1),
    ...say('1. NEIGHBOURS IN TIME', C.amber),
    ...fbox([
      'Look immediately',
      ['before', C.amber],
      'and immediately',
      ['after', C.amber]
    ], C.amber)
  );

  const d1Before = highlightDot(0, 1, 25, C.amber);
  const d1After = highlightDot(0, 3, 26, C.amber);

  await until(S(12));
  await play(
    ...take(timeFocus1),
    ...draw(d1Before, d1After),
    new M.LaggedStart(
      [1, 2, 3].map(i =>
        new M.Indicate(
          charts.dots[0][i],
          { color: C.amber }
        )
      ),
      { lagRatio: 0.20, runTime: 1.7 }
    ),
    ...say('DAY 1: 25 → 55 → 26', C.amber),
    ...fbox([
      '11:00   25°C',
      ['12:00   55°C', PINK],
      '13:00   26°C'
    ], C.amber)
  );

  const faultRise = chartSegment(
    0, 1, 2, D1, PINK, 3
  );

  const faultFall = chartSegment(
    0, 2, 3, D1, PINK, 3
  );

  const riseLabel = txt(
    '+30°',
    P ? 18 : 16,
    PINK,
    (xAt(1) + xAt(2)) / 2 - 0.24,
    (yAt(0, 25) + yAt(0, 55)) / 2 + 0.14,
    true
  );

  const fallLabel = txt(
    '−29°',
    P ? 18 : 16,
    PINK,
    (xAt(2) + xAt(3)) / 2 + 0.26,
    (yAt(0, 55) + yAt(0, 26)) / 2 + 0.14,
    true
  );

  await until(S(13));
  await play(
    ...draw(faultRise, faultFall),
    ...put(riseLabel, fallLabel),
    ...say('UP 30 DEGREES, THEN STRAIGHT BACK', PINK),
    ...fbox([
      ['55 − 25 = +30°C', PINK],
      ['26 − 55 = −29°C', PINK],
      'A sudden isolated jump'
    ], PINK)
  );

  const expectedBridge = dashed(
    xAt(1),
    yAt(0, 25),
    xAt(3),
    yAt(0, 26),
    C.amber
  );

  await until(S(14));
  await play(
    ...draw(expectedBridge),
    new M.Indicate(d1Before, { color: C.amber }),
    new M.Indicate(d1After, { color: C.amber }),
    ...say('DAY 1: THE NEIGHBOURS DISAGREE', PINK),
    ...fbox([
      ['Time evidence', C.amber],
      '25°C before',
      '26°C after',
      ['55°C looks suspicious', PINK]
    ], PINK)
  );

  const day2Focus = rounded(
    (xAt(1) + xAt(4)) / 2,
    (PANELS[1].top + PANELS[1].bottom) / 2,
    xAt(4) - xAt(1) + 0.57,
    PANELS[1].top - PANELS[1].bottom + 0.10,
    C.amber,
    C.amber,
    0.025
  );

  await until(S(15));
  await play(
    ...take(d1Before, d1After, riseLabel, fallLabel),
    ...draw(day2Focus),
    new M.LaggedStart(
      [1, 2, 3, 4].map(i =>
        new M.Indicate(
          charts.dots[1][i],
          { color: C.amber }
        )
      ),
      { lagRatio: 0.17, runTime: 1.8 }
    ),
    ...say('DAY 2: 34 → 39 → 41 → 38', C.amber),
    ...fbox([
      ['11:00   34°C', C.cyan],
      ['12:00   39°C', C.cyan],
      ['13:00   41°C', PINK],
      ['14:00   38°C', C.cyan]
    ], C.amber)
  );

  const heatSegments = charts.segments[1];

  const heatNeighbour1 = highlightDot(
    1, 2, 39, C.green
  );

  const heatNeighbour2 = highlightDot(
    1, 4, 38, C.green
  );

  const day2Agreement = tag(
    'AGREES',
    C.green,
    XR - 0.68,
    PANELS[1].title,
    P ? 15 : 14
  );

  await until(S(16));
  await play(
    ...take(day2Focus),
    ...draw(...heatSegments),
    ...draw(heatNeighbour1, heatNeighbour2),
    ...put(day2Agreement),
    ...say('DAY 2: THE NEIGHBOURS AGREE', C.green),
    ...fbox([
      ['Time evidence', C.green],
      'Gradual rise',
      'A peak, then a fall',
      ['A believable pattern', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 17–20: investigation step two — neighbours in place
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...take(
      heatNeighbour1,
      heatNeighbour2,
      day2Agreement,
      expectedBridge
    ),
    ...say('2. NEIGHBOURS IN PLACE', C.violet),
    ...fbox([
      ['CHECK 2', C.violet],
      'Other instruments',
      'Same greenhouse',
      'Same time'
    ], C.violet)
  );

  function thermometerIcon(x, y, color = WHITE) {
    const body = rounded(
      x,
      y + 0.06,
      0.18,
      0.80,
      color,
      C.card,
      1
    );

    return new M.VGroup(
      body,
      rect(
        x,
        y - 0.04,
        0.08,
        0.49,
        color,
        0.85,
        1
      ),
      circle(
        x,
        y - 0.35,
        0.145,
        color,
        1
      )
    );
  }

  const instrumentLegend = new M.VGroup(
    sensorIcon(
      CX - (P ? 1.72 : 1.80),
      P ? -2.67 : -1.63,
      C.violet
    ),
    txt(
      'Sensor B',
      P ? 17 : 16,
      C.violet,
      CX - (P ? 1.72 : 1.80),
      P ? -3.32 : -2.23
    ),
    thermometerIcon(
      CX + (P ? 1.72 : 1.80),
      P ? -2.67 : -1.63,
      WHITE
    ),
    txt(
      'Thermometer',
      P ? 17 : 16,
      WHITE,
      CX + (P ? 1.72 : 1.80),
      P ? -3.32 : -2.23
    )
  );

  const instrumentPanel = rounded(
    CX,
    P ? -2.77 : -1.73,
    P ? 5.55 : 6.05,
    P ? 1.92 : 1.67,
    C.violet,
    C.card,
    1
  );

  await until(S(18));
  await play(
    ...put(instrumentPanel, instrumentLegend),
    ...say('AN INSTRUMENT IS A MEASURING TOOL', C.violet),
    ...fbox([
      ['Sensor A', C.cyan],
      ['Sensor B', C.violet],
      ['Thermometer', WHITE],
      'All measure temperature'
    ], C.violet)
  );

  function otherReading(day, i, value, color, label) {
    const x = xAt(i);
    const y = yAt(day, value);

    // The actual reading is placed at its correct time
    // and temperature. Its label is offset for legibility.

    const marker = glow(
      x,
      y,
      color,
      P ? 0.095 : 0.08
    );

    const labelX = day === 0
      ? x + (P ? 0.57 : 0.55)
      : x + (P ? 0.55 : 0.47);

    const labelY = day === 0
      ? y - (P ? 0.25 : 0.18)
      : y - (P ? 0.39 : 0.28);

    const lab = txt(
      label,
      P ? 17 : 15,
      color,
      labelX,
      labelY,
      true,
      P ? 1.28 : 1.15
    );

    const labW = Math.min(T(label, P ? 17 : 15, color, true).getWidth(), P ? 1.28 : 1.15);
    const leader = line(
      x + 0.07,
      y - 0.05,
      labelX - labW / 2 - 0.06,
      labelY + 0.04,
      color,
      1.5
    );

    return new M.VGroup(
      marker,
      leader,
      lab
    );
  }

  let sensorBReading = otherReading(
    0,
    2,
    26,
    C.violet,
    'B: 26°'
  );

  const disagreement = dashed(
    xAt(2),
    yAt(0, 26),
    xAt(2),
    yAt(0, 55),
    C.violet
  );

  await until(S(19));
  await play(
    ...take(instrumentPanel, instrumentLegend),
    ...put(sensorBReading),
    ...draw(disagreement),
    new M.Indicate(
      sensorBReading,
      { color: C.violet }
    ),
    ...say('NOON: SENSOR B READS 26°C', C.violet),
    ...fbox([
      ['DAY 1  ·  12:00', C.muted],
      ['Sensor A: 55°C', C.cyan],
      ['Sensor B: 26°C', C.violet],
      ['They disagree', PINK]
    ], PINK)
  );

  let thermometerReading = otherReading(
    1,
    3,
    40,
    WHITE,
    'Ref: 40°'
  );

  const referenceOutline = rounded(
    xAt(3),
    (yAt(1, 40) + yAt(1, 41)) / 2,
    P ? 0.45 : 0.38,
    P ? 0.47 : 0.35,
    C.green,
    C.green,
    0.04
  );

  await until(S(20));
  await play(
    ...put(thermometerReading),
    ...draw(referenceOutline),
    new M.Indicate(
      thermometerReading,
      { color: WHITE }
    ),
    ...say('13:00: THE THERMOMETER READS 40°C', WHITE),
    ...fbox([
      ['DAY 2  ·  13:00', C.muted],
      ['Sensor A: 41°C', C.cyan],
      ['Reference: 40°C', WHITE],
      ['The peak is confirmed', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 21–23: investigation step three — other records
  // ------------------------------------------------------------

  const closedGreenhouse = greenhouseShell();
  const closedPlants = greenhousePlants();

  // A roof vent lies along the right roof slope.

  const ventX1 = GX + GW * 0.12;
  const ventX2 = GX + GW * 0.34;

  const roofY = x =>
    GROOF -
    (x - GX) / (GR - GX) *
    (GROOF - GEAVE);

  const ventY1 = roofY(ventX1);
  const ventY2 = roofY(ventX2);

  const ventClosed = new M.VGroup(
    line(
      ventX1,
      ventY1,
      ventX2,
      ventY2,
      PINK,
      7
    ),
    circle(
      ventX1,
      ventY1,
      0.065,
      C.ink
    ),
    crossMark(
      (ventX1 + ventX2) / 2,
      (ventY1 + ventY2) / 2 + 0.23,
      PINK,
      0.65
    )
  );

  // under the vent, inside the greenhouse: clear of the vent bar and the air arrow
  const closedLabel = tag(
    'VENT STUCK CLOSED',
    PINK,
    (ventX1 + ventX2) / 2,
    GEAVE - 0.33,
    P ? 16 : 15
  );

  const ventLog = new M.VGroup(
    rounded(
      CX,
      GBASE - 0.50,
      P ? 5.75 : 6.20,
      P ? 0.73 : 0.58,
      PINK
    ),
    txt(
      'DAY 2  ·  ROOF VENT LOG: STUCK CLOSED',
      P ? 16 : 15,
      PINK,
      CX,
      GBASE - 0.50,
      true,
      P ? 5.40 : 5.85
    )
  );

  await until(S(21));
  await play(
    ...clearPicture(),
    ...draw(closedGreenhouse),
    ...put(...closedPlants),
    ...put(ventClosed, closedLabel, ventLog),
    ...say('3. CHECK OTHER RECORDS', C.amber),
    ...fbox([
      ['CHECK 3', C.amber],
      'Roof vent log',
      'Day 2',
      ['Vent stuck closed', PINK]
    ], C.amber)
  );

  // Dashed outline illustrates how a working vent would open.
  // It is explicitly hypothetical, not a second recorded state.

  const openAngleX = ventX1 + 0.19;
  const openAngleY = ventY1 + (P ? 0.75 : 0.53);

  const possibleOpenVent = new M.DashedLine({
    start: [ventX2, ventY2, 0],
    end: [openAngleX, openAngleY, 0],
    color: C.green
  });

  const openVentLabel = txt(
    'Would open here',
    P ? 17 : 15,
    C.green,
    0,
    openAngleY - 0.05,
    false,
    2.1
  );
  openVentLabel.moveTo([   // left of the dashed open-vent line, not crossed by it
    openAngleX - 0.15 - Math.min(T('Would open here', P ? 17 : 15, C.green).getWidth(), 2.1) / 2,
    openAngleY - 0.05,
    0
  ]);

  const escapingAir = arrow(
    (ventX1 + ventX2) / 2,
    (ventY1 + ventY2) / 2 - 0.55,
    (ventX1 + ventX2) / 2,
    (ventY1 + ventY2) / 2 + 0.42,
    C.green
  );

  await until(S(22));
  await play(
    ...draw(possibleOpenVent, escapingAir),
    ...put(openVentLabel),
    ...say('A ROOF VENT LETS HOT AIR ESCAPE', C.green),
    ...fbox([
      ['Working vent', C.green],
      'Opens in the roof',
      'Lets warm air out',
      ['This one was stuck', PINK]
    ], C.amber)
  );

  const sunX = GL + 0.65;
  const sunY = P ? 0.85 : 0.79;

  const sunParts = [
    circle(sunX, sunY, 0.26, C.amber, 0.9)
  ];

  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;

    sunParts.push(
      line(
        sunX + 0.34 * Math.cos(a),
        sunY + 0.34 * Math.sin(a),
        sunX + 0.46 * Math.cos(a),
        sunY + 0.46 * Math.sin(a),
        C.amber,
        2
      )
    );
  }

  const sun = new M.VGroup(...sunParts);

  const sunlight = [
    arrow(
      sunX + 0.28,
      sunY - 0.34,
      GX - 0.90,
      GBASE + GH * 0.52,
      C.amber
    ),
    arrow(
      sunX + 0.53,
      sunY - 0.16,
      GX + 0.45,
      GBASE + GH * 0.66,
      C.amber
    )
  ];

  const trappedHeat = Array.from(
    { length: 4 },
    (_, i) => {
      const x = GL + 1.1 + i * (GW - 2.2) / 3;

      return arrow(
        x,
        GBASE + GH * 0.45,
        x,
        GBASE + GH * 0.70,
        PINK
      );
    }
  );

  const hotAirLabel = tag(
    'HEAT TRAPPED INSIDE',
    C.amber,
    CX,
    GBASE + GH * 0.58,
    17
  );

  await until(S(23));
  await play(
    ...take(
      possibleOpenVent,
      escapingAir,
      openVentLabel
    ),
    ...put(sun),
    ...draw(...sunlight, ...trappedHeat),
    ...put(hotAirLabel),
    ...say('TRAPPED SUNLIGHT WARMS THE AIR', C.amber),
    ...fbox([
      'Sun warms greenhouse',
      'Vent stays closed',
      ['Heat builds up', C.amber],
      ['A real heat spike', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 24–28: make the two decisions
  // ------------------------------------------------------------

  // Rebuild a fresh chart after the greenhouse illustration.
  // Original observations and comparison readings are kept
  // unchanged until the investigation decision is shown.

  charts = makeCharts();

  suspect1 = highlightDot(0, 2, 55, PINK);
  suspect2 = highlightDot(1, 3, 41, PINK);

  sensorBReading = otherReading(
    0, 2, 26, C.violet, 'B: 26°'
  );

  thermometerReading = otherReading(
    1, 3, 40, WHITE, 'Ref: 40°'
  );

  await until(S(24));
  await play(
    ...clearPicture(),
    ...put(
      ...charts.axes,
      ...charts.dots.flat(),
      ...charts.segments.flat(),
      suspect1,
      suspect2,
      sensorBReading,
      thermometerReading
    ),
    ...say('NOW WE CAN DECIDE', C.amber),
    ...fbox([
      'Time neighbours',
      'Other instruments',
      'Other records',
      ['Evidence → decision', C.green]
    ], C.amber)
  );

  const faultVerdict = tag(
    'FAULT',
    PINK,
    XR - 0.58,
    PANELS[0].title,
    16
  );

  const faultFlag = flag(
    xAt(2) + 0.23,
    yAt(0, 55) - 0.07,
    P ? 0.85 : 0.65
  );

  await until(S(25));
  await play(
    ...put(faultVerdict, faultFlag),
    new M.Indicate(suspect1, { color: PINK }),
    ...say('DAY 1: THE 55°C IS A FAULT', PINK),
    ...fbox([
      ['FAULT', PINK],
      'A broken or confused',
      'instrument',
      'Not a reliable reading'
    ], PINK)
  );

  const faultGap = missingMarker(
    0,
    2,
    C.muted
  );

  // Remove only Sensor A's invalid measurement and the
  // two line segments touching it. Do not join across
  // the missing hour or substitute Sensor B's value.

  await until(S(26));
  await play(
    ...take(
      charts.dots[0][2],
      charts.segments[0][1],
      charts.segments[0][2],
      suspect1,
      faultFlag
    ),
    ...put(faultGap),
    ...say('MARK THE FAULT AS MISSING', C.muted),
    ...fbox([
      ['AUDIT NOTE', C.violet],
      'Day 1, 12:00',
      '55°C → NA',
      'Reason: sensor fault'
    ], C.violet)
  );

  const realVerdict = tag(
    'REAL — KEEP',
    C.green,
    XR - 0.83,
    PANELS[1].title,
    P ? 16 : 14
  );

  const confirmedPeak = highlightDot(
    1,
    3,
    41,
    C.green
  );

  await until(S(27));
  await play(
    ...take(suspect2),
    ...draw(confirmedPeak),
    ...put(realVerdict),
    new M.Flash(
      charts.dots[1][3].submobjects[0],
      { color: C.green }
    ),
    ...say('DAY 2: THE 41°C IS REAL', C.green),
    ...fbox([
      ['KEEP 41°C', C.green],
      'Time neighbours agree',
      'Thermometer confirms',
      'Vent explains the heat'
    ], C.green)
  );

  const usefulPeakLabel = tag(
    'IMPORTANT HEAT WARNING',
    C.amber,
    CX,
    P ? -5.13 : -2.91,
    P ? 17 : 14
  );

  await until(S(28));
  await play(
    ...put(usefulPeakLabel),
    new M.Indicate(
      charts.dots[1][3],
      { color: C.amber }
    ),
    ...say('THE MOST USEFUL READING', C.amber),
    ...fbox([
      ['41°C is real', C.green],
      'Plants were in danger',
      'The gardener needs',
      'to see this reading'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 29: an outlier is a question, not an answer
  // ------------------------------------------------------------

  function decisionCard(
    x, y, w, h,
    day, value, decision, detail, color
  ) {
    const top = y + h / 2;

    return new M.VGroup(
      rounded(x, y, w, h, color),
      txt(
        day,
        P ? 19 : 18,
        C.muted,
        x,
        top - 0.36
      ),
      txt(
        value,
        P ? 36 : 32,
        C.cyan,
        x,
        y + (P ? 0.62 : 0.42),
        true
      ),
      txt(
        decision,
        P ? 22 : 20,
        color,
        x,
        y - 0.14,
        false,
        w - 0.30
      ),
      txt(
        detail,
        P ? 17 : 16,
        C.ink,
        x,
        y - h / 2 + 0.40,
        false,
        w - 0.28
      )
    );
  }

  const DY = P ? -1.0 : -0.45;
  const DW = P ? 2.84 : 3.12;
  const DH = P ? 3.35 : 2.75;
  const DSP = P ? 1.55 : 1.70;

  const faultCard = decisionCard(
    CX - DSP,
    DY,
    DW,
    DH,
    'DAY 1',
    '55°C',
    'FAULT',
    'Mark as missing',
    PINK
  );

  const heatCard = decisionCard(
    CX + DSP,
    DY,
    DW,
    DH,
    'DAY 2',
    '41°C',
    'REAL',
    'Keep the reading',
    C.green
  );

  const investigationHeading = tag(
    'SAME QUESTION. DIFFERENT ANSWERS.',
    C.amber,
    CX,
    DY - DH / 2 - 0.48,
    P ? 17 : 16,
    P ? 6.4 : 6.8
  );

  await until(S(29));
  await play(
    ...clearPicture(),
    ...put(
      faultCard,
      heatCard,
      investigationHeading
    ),
    ...say('AN OUTLIER IS A QUESTION', C.amber),
    ...fbox([
      ['OUTLIER', C.amber],
      'A reason to ask',
      'what happened',
      'Not an automatic fault'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 30: three investigation questions
  // ------------------------------------------------------------

  const CHECKX = CX;
  const CHECKY = P ? -1.02 : -0.48;
  const CHECKW = P ? 6.05 : 6.65;
  const CHECKH = P ? 5.15 : 3.70;

  const checkPanel = rounded(
    CHECKX,
    CHECKY,
    CHECKW,
    CHECKH,
    C.amber
  );

  const checkTitle = txt(
    'THREE QUESTIONS',
    P ? 23 : 21,
    C.amber,
    CHECKX,
    CHECKY + CHECKH / 2 - 0.40
  );

  const questions = [
    ['1', 'Neighbours in time', 'Before and after'],
    ['2', 'Other instruments', 'Same place and time'],
    ['3', 'Other records', 'Is there an explanation?']
  ];

  const questionRows = questions.map(
    ([n, heading, detail], i) => {
      const y = CHECKY +
        (1 - i) * (P ? 1.18 : 0.83) -
        0.24;

      const numberX = CHECKX - CHECKW / 2 + 0.49;
      const textLeft = CHECKX - CHECKW / 2 + 0.99;

      const headingText = T(
        heading,
        P ? 22 : 21,
        C.ink
      );

      const detailText = T(
        detail,
        P ? 18 : 16,
        C.muted
      );

      const maxTextW = CHECKW - 1.55;

      if (headingText.getWidth() > maxTextW) {
        headingText.scale(
          maxTextW / headingText.getWidth()
        );
      }

      if (detailText.getWidth() > maxTextW) {
        detailText.scale(
          maxTextW / detailText.getWidth()
        );
      }

      headingText.moveTo([
        textLeft + headingText.getWidth() / 2,
        y + 0.17,
        0
      ]);

      detailText.moveTo([
        textLeft + detailText.getWidth() / 2,
        y - 0.24,
        0
      ]);

      return new M.VGroup(
        circle(numberX, y, 0.23, C.amber, 0.16),
        txt(n, 19, C.amber, numberX, y, true),
        headingText,
        detailText
      );
    }
  );

  await until(S(30));
  await play(
    ...clearPicture(),
    ...put(checkPanel, checkTitle),
    lagIn(questionRows, 0.38, 2.8),
    ...say('ASK THREE THINGS', C.amber),
    ...fbox([
      ['1. Time neighbours', C.amber],
      ['2. Other instruments', C.violet],
      ['3. Other records', C.green]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // 31: investigation prevents two different mistakes
  // ------------------------------------------------------------

  function protectionCard(x, y, type) {
    const w = P ? 2.82 : 3.12;
    const h = P ? 3.45 : 2.85;

    const fault = type === 'fault';
    const color = fault ? PINK : C.green;

    const parts = [
      rounded(x, y, w, h, color),
      txt(
        fault ? 'DAY 1' : 'DAY 2',
        17,
        C.muted,
        x,
        y + h / 2 - 0.34
      ),
      txt(
        fault ? '55°C' : '41°C',
        P ? 34 : 30,
        C.cyan,
        x,
        y + (P ? 0.54 : 0.37),
        true
      ),
      fault
        ? crossMark(x, y - 0.13, PINK, 1.5)
        : checkMark(x, y - 0.13, C.green, 1.5),
      txt(
        fault ? 'Do not trust' : 'Do not delete',
        P ? 21 : 19,
        color,
        x,
        y - 0.75,
        false,
        w - 0.30
      ),
      txt(
        fault ? 'A broken reading' : 'A true reading',
        P ? 17 : 16,
        C.ink,
        x,
        y - h / 2 + 0.33,
        false,
        w - 0.26
      )
    ];

    return new M.VGroup(...parts);
  }

  const preventFault = protectionCard(
    CX - DSP,
    DY,
    'fault'
  );

  const preventLoss = protectionCard(
    CX + DSP,
    DY,
    'real'
  );

  await until(S(31));
  await play(
    ...clearPicture(),
    ...put(preventFault, preventLoss),
    ...say('PROTECT AGAINST TWO MISTAKES', C.green),
    ...fbox([
      ['Mistake 1', PINK],
      'Trusting a fault',
      ['Mistake 2', PINK],
      'Deleting a true reading'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 32–33: trap — automatic deletion of extreme values
  // ------------------------------------------------------------

  // Start again with the original observations so the
  // automatic-deletion example is explicitly hypothetical.

  charts = makeCharts();

  const autoRing1 = highlightDot(0, 2, 55, PINK);
  const autoRing2 = highlightDot(1, 3, 41, PINK);

  const delete1 = crossMark(
    xAt(2) + 0.32,
    yAt(0, 55) + 0.02,
    PINK,
    1.1
  );

  const delete2 = crossMark(
    xAt(3) + 0.32,
    yAt(1, 41) + 0.02,
    PINK,
    1.1
  );

  const autoLabel1 = tag(
    'AUTO-DELETE',
    PINK,
    XR - 0.77,
    PANELS[0].title,
    14
  );

  const autoLabel2 = tag(
    'AUTO-DELETE',
    PINK,
    XR - 0.77,
    PANELS[1].title,
    14
  );

  await until(S(32));
  await play(
    ...clearPicture(),
    ...put(
      ...charts.axes,
      ...charts.dots.flat(),
      ...charts.segments.flat(),
      autoRing1,
      autoRing2,
      delete1,
      delete2,
      autoLabel1,
      autoLabel2
    ),
    ...say('TRAP: DELETE EVERY EXTREME VALUE', PINK),
    ...fbox([
      ['Bad automatic rule', PINK],
      'Find extreme values',
      'Delete every one',
      'No investigation'
    ], PINK)
  );

  const autoGap1 = missingMarker(
    0,
    2,
    C.muted
  );

  const autoGap2 = missingMarker(
    1,
    3,
    PINK
  );

  const lostHeatOutline = rounded(
    xAt(3),
    (
      yAt(1, 41) +
      PANELS[1].bottom
    ) / 2,
    P ? 0.68 : 0.58,
    yAt(1, 41) -
      PANELS[1].bottom + 0.10,
    PINK,
    PINK,
    0.08
  );

  const lostHeatLabel = tag(
    'REAL PEAK LOST',
    PINK,
    XR - 0.85,
    PANELS[1].title,
    14
  );

  const faultRemovedLabel = tag(
    'FAULT REMOVED',
    C.muted,
    XR - 0.85,
    PANELS[0].title,
    14
  );

  await until(S(33));
  await play(
    ...take(
      charts.dots[0][2],
      charts.dots[1][3],
      charts.segments[0][1],
      charts.segments[0][2],
      charts.segments[1][2],
      charts.segments[1][3],
      autoRing1,
      autoRing2,
      delete1,
      delete2,
      autoLabel1,
      autoLabel2
    ),
    ...put(
      autoGap1,
      autoGap2,
      faultRemovedLabel,
      lostHeatLabel
    ),
    ...draw(lostHeatOutline),
    ...say('THE REAL HEAT SPIKE WOULD DISAPPEAR', PINK),
    ...fbox([
      '55°C fault removed',
      ['41°C real peak removed', PINK],
      'The most important',
      'event is now hidden'
    ], PINK)
  );

  // ------------------------------------------------------------
  // 34: chapter tools work together
  // ------------------------------------------------------------

  const workflow = [
    {
      title: 'VALIDATION',
      detail: 'Rules flag',
      example: '−10 to 60°C',
      color: C.green
    },
    {
      title: 'DUPLICATES',
      detail: 'The key finds',
      example: 'Sensor + time',
      color: C.violet
    },
    {
      title: 'INVESTIGATION',
      detail: 'Evidence decides',
      example: 'Fault or real?',
      color: C.amber
    }
  ];

  const workflowParts = [];

  for (let i = 0; i < workflow.length; i++) {
    const d = workflow[i];

    const x = P
      ? CX
      : CX + (i - 1) * 2.25;

    const y = P
      ? -0.92 + (1 - i) * 1.56
      : -0.52;

    const w = P ? 5.70 : 2.03;
    const h = P ? 1.27 : 2.55;

    const parts = [
      rounded(x, y, w, h, d.color),
      txt(
        d.title,
        P ? 19 : 16,
        d.color,
        x,
        y + (P ? 0.36 : 0.78),
        false,
        w - 0.23
      ),
      txt(
        d.detail,
        P ? 21 : 19,
        C.ink,
        x,
        y + (P ? -0.02 : 0.05),
        false,
        w - 0.24
      ),
      txt(
        d.example,
        P ? 17 : 15,
        C.muted,
        x,
        y - (P ? 0.39 : 0.70),
        true,
        w - 0.23
      )
    ];

    workflowParts.push(new M.VGroup(...parts));

    if (i < workflow.length - 1) {
      const a = P
        ? arrow(
            x,
            y - h / 2 - 0.035,
            x,
            y - 1.56 + h / 2 + 0.035,
            C.muted
          )
        : arrow(
            x + w / 2 + 0.015,
            y,
            x + 2.25 - w / 2 - 0.015,
            y,
            C.muted
          );

      workflowParts.push(a);
    }
  }

  await until(S(34));
  await play(
    ...clearPicture(),
    lagIn(workflowParts, 0.15, 2.0),
    ...say('THE CHAPTER’S TOOLS WORK TOGETHER', C.green),
    ...fbox([
      ['Rules flag', C.green],
      ['The key finds duplicates', C.violet],
      ['Investigation decides', C.amber]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 35: final summary — investigate before removing
  // ------------------------------------------------------------

  const finalCharts = makeCharts();

  // Day 1 retains every real observation except the
  // investigated fault. No estimate is inserted.

  const finalDay1Dots = finalCharts.dots[0].filter(
    (_, i) => i !== 2
  );

  const finalDay1Segments = [
    finalCharts.segments[0][0],
    finalCharts.segments[0][3]
  ];

  const finalGap = missingMarker(
    0,
    2,
    C.muted
  );

  const finalFaultLabel = tag(
    'FAULT → NA',
    PINK,
    XR - 0.74,
    PANELS[0].title,
    P ? 16 : 14
  );

  const finalKeepLabel = tag(
    'REAL → KEEP',
    C.green,
    XR - 0.83,
    PANELS[1].title,
    P ? 16 : 14
  );

  const finalPeakRing = highlightDot(
    1,
    3,
    41,
    C.green
  );

  const finalReference = otherReading(
    1,
    3,
    40,
    WHITE,
    'Ref: 40°'
  );

  await until(S(35));
  await play(
    ...clearPicture(),
    ...put(
      ...finalCharts.axes,
      ...finalDay1Segments,
      ...finalCharts.segments[1],
      ...finalDay1Dots,
      ...finalCharts.dots[1],
      finalGap,
      finalFaultLabel,
      finalKeepLabel,
      finalPeakRing,
      finalReference
    ),
    new M.Flash(
      finalCharts.dots[1][3].submobjects[0],
      { color: C.green }
    ),
    ...say('CHECK ITS NEIGHBOURS. KEEP IT IF IT IS REAL.', C.green),
    ...fbox([
      ['OUTLIER INVESTIGATION', C.green],
      'Check time and place',
      'Look for an explanation',
      ['Keep genuine extremes', C.green]
    ], C.green)
  );
}

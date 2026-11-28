// lesson 2.2.1
// Scatterplots: one dot for each pair of measured numbers.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser playback has not been verified.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Shared chapter data: six dry afternoon hours.
  const DATA = [
    [10, 20],
    [14, 30],
    [18, 35],
    [22, 45],
    [26, 50],
    [30, 60]
  ];

  // Laptop and phone layouts.
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 2.45, 0] : [CX, 1.90, 0];
  const BOXP = P ? [0, 3.50, 0] : [4.45, -0.15, 0];

  const XL = P ? -2.95 : -5.85;
  const XR = P ? 3.30 : 1.65;
  const YB = P ? -4.85 : -2.05;
  const YT = P ? 1.35 : 1.15;

  const XMAX = 32;
  const YMAX = 70;

  const X = v => XL + v / XMAX * (XR - XL);
  const Y = v => YB + v / YMAX * (YT - YB);
  const xy = (x, y) => [X(x), Y(y), 0];

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

  function dashed(a, b, color = C.amber) {
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

  // Information box, matching the approved lesson's visual style.
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

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
      const ind = cw *
        (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.20 : 3.85;

    if (wd > maxw) g.scale(maxw / wd);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;
    return a;
  }

  function pairBox(k, color = C.cyan) {
    const [temp, rentals] = DATA[k];

    return fbox([
      [`HOUR ${k + 1} OF 6`, C.muted],
      [`${temp} °C`, color],
      [`${rentals} bikes rented`, color]
    ], color);
  }

  // Bicycle icon, assembled from ordinary circles and lines.
  // Every component is positioned individually.
  function bike(cx, cy, scale = 1, color = C.cyan) {
    const p = (x, y) => [
      cx + x * scale,
      cy + y * scale,
      0
    ];

    const wheel = x => {
      const w = new M.Circle({
        radius: 0.47 * scale,
        color,
        strokeWidth: 3
      });

      w.moveTo(p(x, -0.20));
      return w;
    };

    const pieces = [
      wheel(-0.85),
      wheel(0.85),

      line(p(-0.85, -0.20), p(-0.35, 0.54), color, 4),
      line(p(-0.35, 0.54), p(0.05, -0.20), color, 4),
      line(p(0.05, -0.20), p(-0.85, -0.20), color, 4),

      line(p(-0.35, 0.54), p(0.57, 0.54), color, 4),
      line(p(0.57, 0.54), p(0.05, -0.20), color, 4),
      line(p(0.57, 0.54), p(0.85, -0.20), color, 4),

      line(p(0.57, 0.54), p(0.45, 0.90), color, 4),
      line(p(0.45, 0.90), p(0.78, 0.90), color, 4),

      line(p(-0.35, 0.54), p(-0.47, 0.77), color, 4),
      line(p(-0.68, 0.77), p(-0.26, 0.77), color, 4)
    ];

    const crank = new M.Circle({
      radius: 0.11 * scale,
      color,
      strokeWidth: 2
    });

    crank.moveTo(p(0.05, -0.20));
    pieces.push(crank);

    return new M.VGroup(...pieces);
  }

  function sun(cx, cy, scale = 1) {
    const center = new M.Circle({
      radius: 0.29 * scale,
      color: C.amber,
      strokeWidth: 2
    });

    center.setFill(C.amber, 0.75);
    center.moveTo([cx, cy, 0]);

    const rays = [];

    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;

      rays.push(line(
        [
          cx + Math.cos(a) * 0.40 * scale,
          cy + Math.sin(a) * 0.40 * scale,
          0
        ],
        [
          cx + Math.cos(a) * 0.57 * scale,
          cy + Math.sin(a) * 0.57 * scale,
          0
        ],
        C.amber,
        2
      ));
    }

    return new M.VGroup(center, ...rays);
  }

  // 0-1: introduce the bike station and the practical question.
  const introY = P ? -1.60 : -0.30;

  const bicycle = bike(
    P ? 0 : CX,
    introY,
    P ? 2.05 : 1.40
  );

  const sunshine = sun(
    P ? 2.55 : CX + 2.05,
    introY + (P ? 2.15 : 1.60),
    P ? 1.10 : 0.85
  );

  const stationLabel = textAt(
    'BIKE STATION',
    P ? 26 : 23,
    C.ink,
    [CX, introY - (P ? 1.95 : 1.65), 0]
  );

  await until(S(0));
  await play(
    new M.FadeIn(bicycle),
    new M.FadeIn(sunshine),
    new M.FadeIn(stationLabel),
    ...say('READY FOR WARM AFTERNOONS?')
  );

  await until(S(1));
  await play(
    new M.Indicate(sunshine, { color: C.amber }),
    ...say('WARMER WEATHER = MORE RENTALS?', C.amber),
    ...fbox([
      ['temperature', C.amber],
      ['and', C.muted],
      ['bike rentals', C.cyan]
    ], C.amber)
  );

  // 2: two measurements belong to the same hour.
  const recY = P ? -1.60 : -0.40;
  const recW = P ? 2.85 : 2.70;
  const recH = 1.60;
  const recSP = P ? 3.15 : 3.05;

  function measurementCard(title, unit, color, x) {
    const r = new M.RoundedRectangle({
      width: recW,
      height: recH,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo([x, recY, 0]);

    const titleText = textAt(
      title,
      P ? 20 : 21,
      color,
      [x, recY + 0.28, 0]
    );

    const unitText = textAt(
      unit,
      23,
      C.ink,
      [x, recY - 0.30, 0],
      true
    );

    return new M.VGroup(r, titleText, unitText);
  }

  const tempRecord = measurementCard(
    'Temperature',
    '°C',
    C.amber,
    CX - recSP / 2
  );

  const rentalRecord = measurementCard(
    'Rentals',
    'bikes',
    C.cyan,
    CX + recSP / 2
  );

  const hourLabel = pill('SAME HOUR', C.green, 18);
  hourLabel.moveTo([CX, recY + 1.30, 0]);

  const pairedOutline = outline(
    [CX, recY, 0],
    recSP + recW + 0.25,
    recH + 0.25,
    C.green
  );

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(
      bicycle,
      sunshine,
      stationLabel
    )),
    new M.FadeIn(tempRecord),
    new M.FadeIn(rentalRecord),
    new M.FadeIn(hourLabel),
    new M.Create(pairedOutline),
    ...say('TWO NUMBERS FOR EACH HOUR'),
    ...fbox([
      ['one hour', C.green],
      ['temperature + rentals', C.ink]
    ], C.green)
  );

  // 3-5: six dry hours, revealing the coolest and warmest records.
  const TILE_W = P ? 3.20 : 1.64;
  const TILE_H = P ? 1.95 : 1.80;
  const TILE_SP = P ? 3.45 : 1.87;

  const tilePos = k => {
    if (P) {
      return [
        (k % 2 - 0.5) * TILE_SP,
        0.70 - Math.floor(k / 2) * 2.20,
        0
      ];
    }

    return [(k - 2.5) * TILE_SP, -0.65, 0];
  };

  function hourTile(k, revealed = false, accent = C.cyan) {
    const p = tilePos(k);

    const r = new M.RoundedRectangle({
      width: TILE_W,
      height: TILE_H,
      cornerRadius: 0.14,
      color: revealed ? accent : C.muted,
      strokeWidth: revealed ? 3 : 2
    });

    r.setFill(C.card, 0.90);
    r.moveTo(p);

    const label = textAt(
      `HOUR ${k + 1}`,
      P ? 17 : 15,
      C.muted,
      [p[0], p[1] + 0.55, 0],
      true
    );

    const temp = textAt(
      `${DATA[k][0]} °C`,
      P ? 27 : 22,
      C.amber,
      [p[0], p[1] + 0.03, 0],
      true
    );

    const rentals = textAt(
      `${DATA[k][1]} bikes`,
      P ? 23 : 18,
      C.cyan,
      [p[0], p[1] - 0.50, 0],
      true
    );

    return new M.VGroup(r, label, temp, rentals);
  }

  const tiles = DATA.map((_, k) => hourTile(k));

  const dryTag = pill('DRY AFTERNOON HOURS', C.cyan, 17);
  dryTag.moveTo([0, P ? -5.30 : -2.05, 0]);

  const dataPill = P ? PILL : [0, 1.90, 0];

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(
      tempRecord,
      rentalRecord,
      hourLabel,
      pairedOutline,
      boxNow
    )),
    new M.LaggedStart(
      tiles.map(t => new M.FadeIn(t)),
      { lagRatio: 0.10, runTime: 1.40 }
    ),
    new M.FadeIn(dryTag),
    ...showA('6 DRY AFTERNOON HOURS', C.cyan, dataPill)
  );

  boxNow = null;

  await until(S(4));

  const coldTile = hourTile(0, true, C.cyan);

  await play(
    new M.FadeOut(tiles[0]),
    new M.FadeIn(coldTile),
    ...showA('COOLEST HOUR: 10 °C', C.cyan, dataPill)
  );

  tiles[0] = coldTile;

  await until(S(5));

  const warmTile = hourTile(5, true, C.amber);

  await play(
    new M.FadeOut(tiles[5]),
    new M.FadeIn(warmTile),
    ...showA('WARMEST HOUR: 30 °C', C.amber, dataPill)
  );

  tiles[5] = warmTile;

  // 6-8: build the blank chart before placing any data.
  const XTICKS = [0, 10, 14, 18, 22, 26, 30];
  const YTICKS = [10, 20, 30, 40, 50, 60, 70];

  const gridLines = [];

  XTICKS.slice(1).forEach(v => {
    gridLines.push(line(
      xy(v, 0),
      xy(v, YMAX),
      C.card,
      1.5
    ));
  });

  YTICKS.forEach(v => {
    gridLines.push(line(
      xy(0, v),
      xy(XMAX, v),
      C.card,
      1.5
    ));
  });

  const grid = new M.VGroup(...gridLines);

  const xAxis = line(
    xy(0, 0),
    xy(XMAX, 0),
    C.muted,
    3
  );

  const yAxis = line(
    xy(0, 0),
    xy(0, YMAX),
    C.muted,
    3
  );

  const xTicks = XTICKS.map(v => {
    const mark = line(
      [X(v), YB - 0.08, 0],
      [X(v), YB + 0.08, 0],
      C.muted,
      2
    );

    const lab = textAt(
      String(v),
      P ? 16 : 17,
      C.muted,
      [X(v), YB - 0.29, 0],
      true
    );

    return new M.VGroup(mark, lab);
  });

  const yTicks = YTICKS.map(v => {
    const mark = line(
      [XL - 0.08, Y(v), 0],
      [XL + 0.08, Y(v), 0],
      C.muted,
      2
    );

    const lab = textAt(
      String(v),
      P ? 17 : 18,
      C.muted,
      [XL - 0.37, Y(v), 0],
      true
    );

    return new M.VGroup(mark, lab);
  });

  const xTitle = textAt(
    'Temperature (°C)',
    P ? 20 : 19,
    C.amber,
    [(XL + XR) / 2, YB - 0.69, 0]
  );

  const yTitle = textAt(
    'Bikes rented',
    P ? 20 : 19,
    C.cyan,
    [XL + 1.00, YT + 0.31, 0]
  );

  const xRuler = new M.VGroup(...xTicks, xTitle);
  const yRuler = new M.VGroup(...yTicks, yTitle);

  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(...tiles, dryTag)),
    new M.FadeIn(grid),
    new M.Create(xAxis),
    new M.Create(yAxis),
    ...say('A GRID FOR OUR TWO NUMBERS')
  );

  await until(S(7));
  await play(
    new M.FadeIn(xRuler),
    new M.Indicate(xAxis, { color: C.amber }),
    ...say('ACROSS: TEMPERATURE', C.amber),
    ...fbox([
      ['bottom ruler', C.amber],
      ['temperature in °C', C.ink]
    ], C.amber)
  );

  await until(S(8));
  await play(
    new M.FadeIn(yRuler),
    new M.Indicate(yAxis, { color: C.cyan }),
    ...say('UP: BIKES RENTED'),
    ...fbox([
      ['side ruler', C.cyan],
      ['number of bikes', C.ink]
    ])
  );

  // Chart helpers: glowing dots, reading guides and coordinate labels.
  const dots = [];

  function dataDot(temp, rentals, color = C.cyan) {
    const p = xy(temp, rentals);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.25 : 0.23,
      color
    });

    halo.setFill(color, 0.15);

    const mid = new M.Dot({
      point: p,
      radius: P ? 0.16 : 0.15,
      color
    });

    mid.setFill(color, 0.32);

    const core = new M.Dot({
      point: p,
      radius: P ? 0.095 : 0.095,
      color
    });

    core.setFill(color, 1);

    return new M.VGroup(halo, mid, core);
  }

  function axisMarker(temp, color = C.amber) {
    const m = new M.Dot({
      point: xy(temp, 0),
      radius: 0.10,
      color
    });

    m.setFill(color, 1);
    return m;
  }

  function xGuide(temp) {
    return line(
      xy(0, 0),
      xy(temp, 0),
      C.amber,
      5
    );
  }

  function yGuide(temp, rentals) {
    return dashed(
      xy(temp, 0),
      xy(temp, rentals),
      C.amber
    );
  }

  function acrossGuide(temp, rentals) {
    return dashed(
      xy(0, rentals),
      xy(temp, rentals),
      C.cyan
    );
  }

  function dotRing(k, color = C.amber) {
    const r = new M.Circle({
      radius: P ? 0.29 : 0.27,
      color,
      strokeWidth: 2
    });

    r.moveTo(xy(...DATA[k]));
    return r;
  }

  function dotLabel(k, color = C.cyan) {
    const [temp, rentals] = DATA[k];

    const t = T(
      `(${temp}, ${rentals})`,
      P ? 17 : 18,
      color,
      true
    );

    t.moveTo([
      X(temp) - (temp >= 26 ? 0.48 : -0.10),
      Y(rentals) + 0.37,
      0
    ]);

    return t;
  }

  function numberTag(s, p, color = C.amber) {
    const t = pill(s, color, P ? 15 : 16);
    t.moveTo(p);
    return t;
  }

  // 9-13: carefully place the first dot.
  await until(S(9));
  await play(
    ...say('START WITH THE COOLEST HOUR', C.amber),
    ...pairBox(0, C.amber)
  );

  const firstX = xGuide(10);
  const firstMark = axisMarker(10);

  const firstTempTag = numberTag(
    '10 °C',
    [X(10) + 0.62, YB + 0.36, 0],
    C.amber
  );

  await until(S(10));
  await play(
    new M.Create(firstX),
    new M.FadeIn(firstMark),
    new M.FadeIn(firstTempTag),
    ...say('FIRST: MOVE RIGHT TO 10 °C', C.amber)
  );

  const firstUp = yGuide(10, 20);
  const firstAcross = acrossGuide(10, 20);

  const firstYMark = new M.Dot({
    point: xy(0, 20),
    radius: 0.09,
    color: C.cyan
  });

  firstYMark.setFill(C.cyan, 1);

  await until(S(11));
  await play(
    new M.Create(firstUp),
    new M.Create(firstAcross),
    new M.FadeIn(firstYMark),
    ...say('THEN: MOVE UP TO 20 RENTALS', C.cyan),
    ...pairBox(0)
  );

  dots[0] = dataDot(...DATA[0]);
  const firstLabel = dotLabel(0);

  await until(S(12));
  await play(
    new M.FadeIn(dots[0]),
    new M.FadeIn(firstLabel),
    new M.Flash(dots[0].submobjects[2], {
      color: C.cyan
    }),
    ...say('PLACE ONE DOT')
  );

  const firstRing = dotRing(0, C.green);

  await until(S(13));
  await play(
    new M.Create(firstRing),
    ...say('ONE DOT KEEPS THE PAIR TOGETHER', C.green),
    ...fbox([
      ['10 °C', C.amber],
      ['20 bikes', C.cyan],
      ['same hour = one dot', C.green]
    ], C.green)
  );

  // 14-16: repeat the process for the second hour.
  const resetMark = new M.Dot({
    point: xy(0, 0),
    radius: 0.10,
    color: C.amber
  });

  resetMark.setFill(C.amber, 1);

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(
      firstX,
      firstMark,
      firstTempTag,
      firstUp,
      firstAcross,
      firstYMark,
      firstLabel,
      firstRing
    )),
    new M.FadeIn(resetMark),
    ...say('NEXT HOUR: START AT THE BOTTOM', C.amber),
    ...fbox([
      ['HOUR 2 OF 6', C.muted],
      ['start at the bottom', C.amber]
    ], C.amber)
  );

  const secondX = xGuide(14);
  const secondMark = axisMarker(14);

  const secondTempTag = numberTag(
    '14 °C',
    [X(14) + 0.62, YB + 0.36, 0],
    C.amber
  );

  await until(S(15));
  await play(
    new M.FadeOut(resetMark),
    new M.Create(secondX),
    new M.FadeIn(secondMark),
    new M.FadeIn(secondTempTag),
    ...say('MOVE RIGHT TO 14 °C', C.amber),
    ...fbox([
      ['HOUR 2 OF 6', C.muted],
      ['14 °C', C.amber]
    ], C.amber)
  );

  let guideUp = yGuide(14, 30);
  let guideAcross = acrossGuide(14, 30);
  let activeLabel = dotLabel(1);

  dots[1] = dataDot(...DATA[1]);

  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(
      secondX,
      secondMark,
      secondTempTag
    )),
    new M.Create(guideUp),
    new M.Create(guideAcross),
    new M.FadeIn(dots[1]),
    new M.FadeIn(activeLabel),
    ...say('UP TO 30: PLACE THE NEXT DOT'),
    ...pairBox(1)
  );

  // 17-20: add the remaining four hours.
  // Guides are replaced each time; the recorded dots stay in place.
  function addHour(k) {
    const [temp, rentals] = DATA[k];

    const nextUp = yGuide(temp, rentals);
    const nextAcross = acrossGuide(temp, rentals);
    const nextLabel = dotLabel(k);

    dots[k] = dataDot(temp, rentals);

    const a = [
      new M.FadeOut(new M.VGroup(
        guideUp,
        guideAcross,
        activeLabel
      )),
      new M.Create(nextUp),
      new M.Create(nextAcross),
      new M.FadeIn(dots[k]),
      new M.FadeIn(nextLabel),
      ...pairBox(k),
      ...say(`${temp} °C → ${rentals} RENTALS`)
    ];

    guideUp = nextUp;
    guideAcross = nextAcross;
    activeLabel = nextLabel;

    return a;
  }

  await until(S(17));
  await play(...addHour(2));

  await until(S(18));
  await play(...addHour(3));

  await until(S(19));
  await play(...addHour(4));

  await until(S(20));
  await play(...addHour(5));

  // 21-22: discover the rising pattern.
  // Do not join the observations: this is a scatterplot, not a line chart.
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(
      guideUp,
      guideAcross,
      activeLabel
    )),
    new M.LaggedStart(
      dots.map(d => new M.Indicate(d, {
        color: C.amber
      })),
      { lagRatio: 0.22, runTime: 1.90 }
    ),
    ...say('BOTTOM LEFT → TOP RIGHT', C.amber),
    ...fbox([
      ['cooler + quieter', C.muted],
      ['warmer + busier', C.amber]
    ], C.amber)
  );

  const trendTag = pill('MORE RENTALS', C.green, 16);
  trendTag.moveTo([
    X(24),
    Y(70) - 0.12,
    0
  ]);

  await until(S(22));
  await play(
    new M.FadeIn(trendTag),
    ...say('WARMER HOURS TEND TO BE BUSIER', C.green),
    ...fbox([
      ['temperature rises', C.amber],
      ['rentals tend to rise', C.cyan]
    ], C.green)
  );

  // 23-25: introduce the names axis and scatterplot.
  await until(S(23));
  await play(
    new M.FadeOut(trendTag),
    new M.Indicate(xRuler, { color: C.amber }),
    new M.Indicate(yRuler, { color: C.cyan }),
    ...say('TWO RULERS WITH A NAME'),
    ...fbox([
      ['bottom ruler', C.amber],
      ['side ruler', C.cyan]
    ])
  );

  await until(S(24));
  await play(
    new M.Indicate(xAxis, { color: C.amber }),
    new M.Indicate(yAxis, { color: C.cyan }),
    ...say('EACH RULER IS AN AXIS', C.green),
    ...fbox([
      ['horizontal axis', C.amber],
      ['vertical axis', C.cyan]
    ], C.green)
  );

  await until(S(25));
  await play(
    new M.LaggedStart(
      dots.map(d => new M.Indicate(d, {
        color: C.cyan
      })),
      { lagRatio: 0.10, runTime: 1.60 }
    ),
    ...say('THIS IS A SCATTERPLOT', C.green),
    ...fbox([
      ['scatterplot', C.green],
      ['two axes', C.ink],
      ['one dot per pair', C.cyan]
    ], C.green)
  );

  // 26-28: read an existing dot in the opposite direction.
  const readK = 3;
  const readTemp = DATA[readK][0];
  const readRentals = DATA[readK][1];

  await until(S(26));
  await play(
    ...say('READ A DOT IN THE OTHER DIRECTION', C.amber),
    ...fbox([
      ['start with rentals', C.cyan],
      ['find temperature', C.amber]
    ], C.amber)
  );

  const readAcross = acrossGuide(
    readTemp,
    readRentals
  );

  const readRing = dotRing(readK, C.amber);

  const readYMark = new M.Dot({
    point: xy(0, readRentals),
    radius: 0.095,
    color: C.cyan
  });

  readYMark.setFill(C.cyan, 1);

  const readYTag = numberTag(
    '45',
    [XL + 0.43, Y(readRentals) + 0.30, 0],
    C.cyan
  );

  await until(S(27));
  await play(
    new M.Create(readAcross),
    new M.Create(readRing),
    new M.FadeIn(readYMark),
    new M.FadeIn(readYTag),
    ...say('FIND 45 RENTALS', C.cyan),
    ...fbox([
      ['45 bikes rented', C.cyan],
      ['temperature = ?', C.amber]
    ], C.cyan)
  );

  const readDown = dashed(
    xy(readTemp, readRentals),
    xy(readTemp, 0),
    C.amber
  );

  const readXMark = axisMarker(readTemp);

  const readXTag = numberTag(
    '22 °C',
    [X(readTemp) + 0.62, YB + 0.36, 0],
    C.amber
  );

  await until(S(28));
  await play(
    new M.Create(readDown),
    new M.FadeIn(readXMark),
    new M.FadeIn(readXTag),
    ...say('STRAIGHT DOWN TO 22 °C', C.amber),
    ...fbox([
      ['45 bikes rented', C.cyan],
      ['22 °C', C.amber],
      ['same recorded hour', C.green]
    ], C.green)
  );

  // 29: the purpose of a scatterplot.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(
      readAcross,
      readRing,
      readYMark,
      readYTag,
      readDown,
      readXMark,
      readXTag
    )),
    ...say('DO TWO NUMBERS CHANGE TOGETHER?', C.green),
    ...fbox([
      ['two measurements', C.ink],
      ['one visible pattern', C.green]
    ], C.green)
  );

  // 30: highlight warmer hours worth investigating.
  const warmOutline = outline(
    [
      (X(26) + X(30)) / 2,
      (Y(50) + Y(60)) / 2,
      0
    ],
    X(30) - X(26) + 0.60,
    Y(60) - Y(50) + 0.60,
    C.amber
  );

  await until(S(30));
  await play(
    new M.Create(warmOutline),
    new M.Indicate(dots[4], { color: C.amber }),
    new M.Indicate(dots[5], { color: C.amber }),
    ...say('WARM HOURS WORTH CHECKING', C.amber),
    ...fbox([
      ['26 °C → 50 bikes', C.cyan],
      ['30 °C → 60 bikes', C.cyan],
      ['check before planning', C.amber]
    ], C.amber)
  );

  // 31: association does not establish cause.
  await until(S(31));
  await play(
    new M.FadeOut(warmOutline),
    ...say('A PATTERN DOES NOT PROVE A CAUSE', C.violet),
    ...fbox([
      ['we see a pattern', C.green],
      ['but what causes it?', C.amber],
      ['the dots cannot tell', C.violet]
    ], C.violet)
  );

  // 32: the observations cover only six dry afternoon hours.
  const sampleLeft = X(10) - 0.39;
  const sampleRight = X(30) + 0.39;
  const sampleBottom = Y(20) - 0.38;
  const sampleTop = Y(60) + 0.38;

  const sampleOutline = outline(
    [
      (sampleLeft + sampleRight) / 2,
      (sampleBottom + sampleTop) / 2,
      0
    ],
    sampleRight - sampleLeft,
    sampleTop - sampleBottom,
    C.violet
  );

  await until(S(32));
  await play(
    new M.Create(sampleOutline),
    ...say('ONLY SIX DRY HOURS', C.violet),
    ...fbox([
      ['6 recorded hours', C.cyan],
      ['all dry afternoons', C.ink],
      ['other hours may differ', C.violet]
    ], C.violet)
  );

  // 33: final definition, retaining the complete scatterplot.
  await until(S(33));
  await play(
    new M.FadeOut(sampleOutline),
    new M.LaggedStart(
      dots.map(d => new M.Indicate(d, {
        color: C.cyan
      })),
      { lagRatio: 0.12, runTime: 1.80 }
    ),
    ...say('SCATTERPLOT = ONE DOT PER PAIR', C.green),
    ...fbox([
      ['SCATTERPLOT', C.green],
      ['two axes', C.ink],
      ['one dot per pair', C.cyan]
    ], C.green)
  );
}

// lesson 14.1.5
// Choosing k: the elbow method.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Runs in site/live/engine.js using the supplied engine interface.
// Uses the engine's dark-grid background.
// Browser rendering has not been verified against the actual engine runtime.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T,
    pill, show, showA, until, play, LINE_Y
  } = L;

  // ================================================================
  // FIXED CHAPTER DATA
  //
  // x = departures per hour
  // y = returns per hour
  //
  // Station positions NEVER change during this lesson.
  // Only group assignments and centres change.
  // ================================================================

  const DATA = [
    { id: 'A', x: 1, y: 1 },
    { id: 'B', x: 2, y: 2 },
    { id: 'C', x: 3, y: 3 },
    { id: 'D', x: 7, y: 1 },
    { id: 'E', x: 8, y: 2 },
    { id: 'F', x: 9, y: 6 }
  ];

  const IDS = DATA.map(d => d.id);
  const byId = id => DATA.find(d => d.id === id);

  const BLUE   = '#60A5FA';
  const ORANGE = '#FB923C';
  const PURPLE = '#A78BFA';
  const GREEN  = '#34D399';
  const PINK   = '#F472B6';
  const GOLD   = '#FACC15';

  // Checked optimal groupings from the shared chapter example.
  // Colours are preserved where possible as k increases.

  const GROUPINGS = {
    1: [
      { ids: 'ABCDEF', color: BLUE }
    ],

    2: [
      { ids: 'ABC', color: BLUE },
      { ids: 'DEF', color: ORANGE }
    ],

    3: [
      { ids: 'ABC', color: BLUE },
      { ids: 'DE', color: ORANGE },
      { ids: 'F', color: PURPLE }
    ],

    4: [
      { ids: 'AB', color: BLUE },
      { ids: 'C', color: GREEN },
      { ids: 'DE', color: ORANGE },
      { ids: 'F', color: PURPLE }
    ],

    5: [
      { ids: 'A', color: BLUE },
      { ids: 'B', color: PINK },
      { ids: 'C', color: GREEN },
      { ids: 'DE', color: ORANGE },
      { ids: 'F', color: PURPLE }
    ],

    6: [
      { ids: 'A', color: BLUE },
      { ids: 'B', color: PINK },
      { ids: 'C', color: GREEN },
      { ids: 'D', color: ORANGE },
      { ids: 'E', color: GOLD },
      { ids: 'F', color: PURPLE }
    ]
  };

  // ================================================================
  // EXACT CALCULATIONS
  //
  // Preserve full numerical precision internally.
  // Round only when displaying numbers.
  // ================================================================

  function centreOf(ids) {
    const members = Array.from(ids).map(byId);

    return {
      x: members.reduce((s, d) => s + d.x, 0) / members.length,
      y: members.reduce((s, d) => s + d.y, 0) / members.length
    };
  }

  function squaredDistance(a, b) {
    return (
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2
    );
  }

  function groupInertia(ids) {
    const centre = centreOf(ids);

    return Array.from(ids).reduce(
      (sum, id) => sum + squaredDistance(byId(id), centre),
      0
    );
  }

  function totalInertia(groups) {
    return groups.reduce(
      (sum, g) => sum + groupInertia(g.ids),
      0
    );
  }

  function fmt(value) {
    return String(Number(value.toFixed(2)));
  }

  const KS = [1, 2, 3, 4, 5, 6];

  const INERTIA = KS.map(k =>
    totalInertia(GROUPINGS[k])
  );

  const GAINS = INERTIA.slice(1).map(
    (value, i) => INERTIA[i] - value
  );

  const TOTAL_X = DATA.reduce((s, d) => s + d.x, 0);
  const TOTAL_Y = DATA.reduce((s, d) => s + d.y, 0);

  const distance = (a, b) =>
    Math.sqrt(squaredDistance(a, b));

  // Expected values:
  //
  // INERTIA = [75.5, 20, 5, 2, 1, 0]
  // GAINS   = [55.5, 15, 3, 1, 1]
  //
  // The fixed optimal groupings are supplied by the chapter data.
  // This scene compares them; it does not run a new k-means search.

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone:  8 x 14.22
  //         content y = -5.5 to 4.3
  //
  // Laptop: 14.22 x 8
  //         content y = -3.0 to 2.3
  //
  // Phone: formula box above the main picture.
  // Laptop: formula box to the right of the main picture.
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 0.45, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.65, 0]
    : [4.3, -0.3, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  const point = (x, y) => [x, y, 0];

  // Equal physical scale on the horizontal and vertical axes.

  const UNIT = P ? 0.66 : 0.52;
  const X0 = P ? -3.3 : -5.65;
  const Y0 = P ? -5.2 : -2.6;

  const xy = (x, y) => [
    X0 + x * UNIT,
    Y0 + y * UNIT,
    0
  ];

  const stationPoint = id => {
    const d = byId(id);
    return xy(d.x, d.y);
  };

  const DOT_R = P ? 0.105 : 0.105;

  // ================================================================
  // BASIC VISUAL HELPERS
  // ================================================================

  function textAt(s, p, size, color = C.ink, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function lineAt(start, end, color = C.muted, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function rectAt(p, w, h, color, opacity = 0.08) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.13,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function outlineAt(p, w, h, color, width = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.15,
      color,
      strokeWidth: width
    });

    r.setFill(color, 0.02);
    r.moveTo(p);

    return r;
  }

  function circleAt(p, radius, color, opacity = 0) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo(p);

    return c;
  }

  function fittedPill(s, color, size, p, maxw) {
    const g = pill(s, color, size);

    if (g.getWidth() > maxw) {
      g.scale(maxw / g.getWidth());
    }

    g.moveTo(p);

    return g;
  }

  // ================================================================
  // FORMULA / EXPLANATION BOX
  //
  // lines = ['text' | ['text', color]]
  // Leading spaces provide monospace indentation.
  //
  // Only one formula box is visible at any time.
  // ================================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.42 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? (l[1] === C.muted ? [l[0], C.ink] : l) : [l, C.ink]
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

    const wd = Math.max(...widths) + 0.66;
    const ht = rows.length * lh + 0.35;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.33;
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

    const maxw = P ? FW - 0.8 : 5.2;
    const maxh = P ? 3.2 : 3.55;

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

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  // ================================================================
  // INTRODUCTION: SIX STATIONS AND THEIR SERVICE PLANS
  // ================================================================

  const INTRO_SP = P ? 2.35 : 1.76;

  function introPosition(i) {
    return point(
      CX + (i % 3 - 1) * INTRO_SP,
      i < 3
        ? (P ? -1.5 : 0.50)
        : (P ? -4.3 : -1.06)
    );
  }

  function stationTile(d, i) {
    const p = introPosition(i);

    const bg = rectAt(
      p,
      1.35,
      1.17,
      C.muted,
      0.08
    );

    const wheel1 = circleAt(
      point(p[0] - 0.33, p[1] + 0.02),
      0.15,
      C.ink
    );

    const wheel2 = circleAt(
      point(p[0] + 0.33, p[1] + 0.02),
      0.15,
      C.ink
    );

    const hub1 = point(p[0] - 0.33, p[1] + 0.02);
    const hub2 = point(p[0] + 0.33, p[1] + 0.02);
    const crank = point(p[0] - 0.02, p[1] + 0.04);
    const seat = point(p[0] - 0.16, p[1] + 0.33);
    const handle = point(p[0] + 0.23, p[1] + 0.35);

    const frame = [
      lineAt(hub1, crank, C.cyan, 2),
      lineAt(crank, seat, C.cyan, 2),
      lineAt(seat, hub1, C.cyan, 2),
      lineAt(seat, handle, C.cyan, 2),
      lineAt(handle, hub2, C.cyan, 2),
      lineAt(crank, handle, C.cyan, 2)
    ];

    const saddle = lineAt(
      point(seat[0] - 0.11, seat[1]),
      point(seat[0] + 0.11, seat[1]),
      C.ink,
      2
    );

    const label = textAt(
      `Station ${d.id}`,
      point(p[0], p[1] - 0.35),
      P ? 17 : 16,
      C.ink
    );

    return new M.VGroup(
      bg,
      wheel1,
      wheel2,
      ...frame,
      saddle,
      label
    ).scale(P ? 1.4 : 1);
  }

  const introTiles = DATA.map(stationTile);

  const onePlanOutline = outlineAt(
    point(CX, P ? -2.9 : -0.28),
    2 * INTRO_SP + 2.2,
    P ? 5.0 : 2.95,
    C.amber,
    2.5
  );

  const separatePlanOutlines = DATA.map((d, i) =>
    outlineAt(
      introPosition(i),
      P ? 2.06 : 1.47,
      P ? 1.8 : 1.29,
      [BLUE, PINK, GREEN, ORANGE, GOLD, PURPLE][i],
      2
    )
  );

  // ================================================================
  // STATION SCATTER PLOT
  //
  // Departures horizontally.
  // Returns vertically.
  // Equal spacing in both directions.
  // Both axes start at zero.
  // ================================================================

  function makeAxes() {
    const grid = [];
    const ticks = [];
    const numbers = [];

    const gridColor = '#253447';

    for (let x = 1; x <= 10; x++) {
      grid.push(
        lineAt(
          xy(x, 0),
          xy(x, 7),
          gridColor,
          0.8
        )
      );
    }

    for (let y = 1; y <= 7; y++) {
      grid.push(
        lineAt(
          xy(0, y),
          xy(10, y),
          gridColor,
          0.8
        )
      );
    }

    const xAxis = lineAt(
      xy(0, 0),
      xy(10, 0),
      C.muted,
      2.3
    );

    const yAxis = lineAt(
      xy(0, 0),
      xy(0, 7),
      C.muted,
      2.3
    );

    for (let x = 0; x <= 10; x++) {
      const p = xy(x, 0);

      ticks.push(
        lineAt(
          point(p[0], p[1] - 0.045),
          point(p[0], p[1] + 0.045),
          C.muted,
          1.3
        )
      );

      numbers.push(
        textAt(
          String(x),
          point(p[0], p[1] - 0.22),
          P ? 20 : 15,
          C.muted,
          true
        )
      );
    }

    for (let y = 1; y <= 7; y++) {
      const p = xy(0, y);

      ticks.push(
        lineAt(
          point(p[0] - 0.045, p[1]),
          point(p[0] + 0.045, p[1]),
          C.muted,
          1.3
        )
      );

      numbers.push(
        textAt(
          String(y),
          point(p[0] - 0.24, p[1]),
          P ? 20 : 15,
          C.muted,
          true
        )
      );
    }

    const xLabel = textAt(
      'Departures per hour',
      point(X0 + 5 * UNIT, Y0 - 0.54),
      P ? 19 : 17,
      C.ink
    );

    const yLabel = textAt(
      'Returns per hour',
      point(
        X0 + 1.65 * UNIT,
        Y0 + 7 * UNIT + 0.25
      ),
      P ? 18 : 16,
      C.ink
    );

    return new M.VGroup(
      ...grid,
      xAxis,
      yAxis,
      ...ticks,
      ...numbers,
      xLabel,
      yLabel
    );
  }

  const axes = makeAxes();

  // ================================================================
  // GLOWING STATION DOTS
  //
  // Every station is always located at its fixed data coordinate.
  // Letters remain visible when colours change.
  // ================================================================

  const stations = {};
  const stationColors = {};

  function makeStation(id, color = C.ink) {
    const p = stationPoint(id);

    const halo = new M.Dot({
      point: p,
      radius: DOT_R * 2.05,
      color
    });

    halo.setFill(color, 0.13);

    const middle = new M.Dot({
      point: p,
      radius: DOT_R * 1.45,
      color
    });

    middle.setFill(color, 0.22);

    const dot = new M.Dot({
      point: p,
      radius: DOT_R,
      color
    });

    const labelOffset = {
      A: [-0.23, 0.22],
      B: [-0.23, 0.23],
      C: [-0.24, 0.23],
      D: [0.22, -0.20],
      E: [0.23, 0.22],
      F: [0.24, 0.22]
    }[id];

    const label = textAt(
      id,
      point(
        p[0] + labelOffset[0],
        p[1] + labelOffset[1]
      ),
      P ? 19 : 18,
      color,
      true
    );

    return new M.VGroup(
      halo,
      middle,
      dot,
      label
    );
  }

  IDS.forEach(id => {
    stations[id] = makeStation(id);
    stationColors[id] = C.ink;
  });

  function recolorStation(id, color) {
    if (stationColors[id] === color) {
      return [];
    }

    stationColors[id] = color;

    return [
      new M.Transform(
        stations[id],
        makeStation(id, color),
        { runTime: 0.65 }
      )
    ];
  }

  function indicateStations(ids, color = C.amber) {
    return new M.LaggedStart(
      Array.from(ids).map(id =>
        new M.Indicate(
          stations[id],
          { color }
        )
      ),
      {
        lagRatio: 0.10,
        runTime: 1.2
      }
    );
  }

  // ================================================================
  // GLOWING DIAMOND CENTRES
  //
  // A diamond identifies a centre.
  // A circular dot identifies a station.
  //
  // The diamond remains readable when its centre lies directly
  // on a station, such as B for the group ABC.
  // ================================================================

  function makeCentre(c, color) {
    const p = xy(c.x, c.y);

    const r = P ? 0.205 : 0.195;

    const corners = [
      point(p[0], p[1] + r),
      point(p[0] + r, p[1]),
      point(p[0], p[1] - r),
      point(p[0] - r, p[1])
    ];

    const glow = new M.Dot({
      point: p,
      radius: r * 1.40,
      color
    });

    glow.setFill(color, 0.09);

    const sides = corners.map((a, i) =>
      lineAt(
        a,
        corners[(i + 1) % 4],
        color,
        3.1
      )
    );

    const innerR = r * 0.77;

    const innerCorners = [
      point(p[0], p[1] + innerR),
      point(p[0] + innerR, p[1]),
      point(p[0], p[1] - innerR),
      point(p[0] - innerR, p[1])
    ];

    const innerSides = innerCorners.map((a, i) =>
      lineAt(
        a,
        innerCorners[(i + 1) % 4],
        C.ink,
        1
      )
    );

    return new M.VGroup(
      glow,
      ...sides,
      ...innerSides
    );
  }

  function makeDistanceLine(id, c, color) {
    return lineAt(
      stationPoint(id),
      xy(c.x, c.y),
      color,
      2.3
    );
  }

  // ================================================================
  // GROUP TRANSITIONS
  //
  // Existing stations are transformed in place.
  // Their coordinates never change.
  //
  // Existing centre diamonds may move to new mean positions.
  // Connecting lines follow the assigned centres.
  //
  // No zero-length line is created when a station lies directly
  // on its assigned centre.
  // ================================================================

  const centreObjects = {};
  const distanceObjects = {};

  function sameCentre(a, b) {
    return (
      Math.abs(a.x - b.x) < 1e-10 &&
      Math.abs(a.y - b.y) < 1e-10
    );
  }

  function updateGroups(groups, options = {}) {
    const {
      centres = true,
      links = true,
      paint = true
    } = options;

    const a = [];
    const desiredCentres = {};
    const desiredLines = {};
    const assignments = {};

    groups.forEach(g => {
      const c = centreOf(g.ids);

      Array.from(g.ids).forEach(id => {
        assignments[id] = g.color;

        if (
          centres &&
          links &&
          squaredDistance(byId(id), c) > 1e-12
        ) {
          desiredLines[id] = {
            c,
            color: g.color
          };
        }
      });

      if (centres) {
        desiredCentres[g.color] = {
          c,
          color: g.color
        };
      }
    });

    // Remove or update previously visible connecting lines.

    Object.keys(distanceObjects).forEach(id => {
      const old = distanceObjects[id];
      const next = desiredLines[id];

      if (!next) {
        a.push(new M.FadeOut(old.obj));
        delete distanceObjects[id];
        return;
      }

      if (
        old.color !== next.color ||
        !sameCentre(old.c, next.c)
      ) {
        const target = makeDistanceLine(
          id,
          next.c,
          next.color
        );

        a.push(
          new M.Transform(
            old.obj,
            target,
            { runTime: 0.9 }
          )
        );

        old.c = next.c;
        old.color = next.color;
      }
    });

    // Add connecting lines that do not yet exist.

    Object.keys(desiredLines).forEach(id => {
      if (distanceObjects[id]) {
        return;
      }

      const next = desiredLines[id];

      const obj = makeDistanceLine(
        id,
        next.c,
        next.color
      );

      distanceObjects[id] = {
        obj,
        c: next.c,
        color: next.color
      };

      a.push(new M.Create(obj));
    });

    // Remove or move previously visible centres.

    Object.keys(centreObjects).forEach(key => {
      const old = centreObjects[key];
      const next = desiredCentres[key];

      if (!next) {
        a.push(new M.FadeOut(old.obj));
        delete centreObjects[key];
        return;
      }

      if (!sameCentre(old.c, next.c)) {
        a.push(
          new M.Transform(
            old.obj,
            makeCentre(next.c, next.color),
            { runTime: 1.0 }
          )
        );

        old.c = next.c;
      }
    });

    // Add new centre diamonds.

    Object.keys(desiredCentres).forEach(key => {
      if (centreObjects[key]) {
        return;
      }

      const next = desiredCentres[key];

      const obj = makeCentre(
        next.c,
        next.color
      );

      centreObjects[key] = {
        obj,
        c: next.c,
        color: next.color
      };

      a.push(new M.FadeIn(obj));
    });

    // Change station colours without changing their coordinates.

    if (paint) {
      IDS.forEach(id => {
        a.push(
          ...recolorStation(
            id,
            assignments[id] || C.ink
          )
        );
      });
    }

    return a;
  }

  function stage(k, options = {}) {
    return updateGroups(
      GROUPINGS[k],
      options
    );
  }

  function clearGroupVisuals() {
    const a = [];

    Object.values(distanceObjects).forEach(d => {
      a.push(new M.FadeOut(d.obj));
    });

    Object.values(centreObjects).forEach(c => {
      a.push(new M.FadeOut(c.obj));
    });

    Object.keys(distanceObjects).forEach(key => {
      delete distanceObjects[key];
    });

    Object.keys(centreObjects).forEach(key => {
      delete centreObjects[key];
    });

    return a;
  }

  function focusDistances(ids, color = C.amber) {
    const a = Array.from(ids)
      .filter(id => distanceObjects[id])
      .map(id =>
        new M.Indicate(
          distanceObjects[id].obj,
          { color }
        )
      );

    return a.length
      ? [
          new M.LaggedStart(
            a,
            { lagRatio: 0.10, runTime: 1.25 }
          )
        ]
      : [];
  }

  function focusCentre(color) {
    const c = centreObjects[color];

    return c
      ? [new M.Indicate(c.obj, { color })]
      : [];
  }

  // ================================================================
  // CURRENT k TAG
  //
  // The tag is kept separate from the station objects.
  // ================================================================

  const KPOS = P
    ? point(0, -6.45)
    : point(4.3, -2.65);

  let kTag = null;

  function setK(k, color = C.cyan) {
    const g = fittedPill(
      `k = ${k}  ·  ${k} ${k === 1 ? 'group' : 'groups'}`,
      color,
      P ? 19 : 18,
      KPOS,
      P ? 5.8 : 5.1
    );

    const a = [];

    if (kTag) {
      a.push(new M.FadeOut(kTag));
    }

    kTag = g;
    a.push(new M.FadeIn(g));

    return a;
  }

  function clearK() {
    if (!kTag) {
      return [];
    }

    const old = kTag;
    kTag = null;

    return [new M.FadeOut(old)];
  }

  // ================================================================
  // 0 — SIX BICYCLE STATIONS NEED SERVICE PLANS
  // ================================================================

  await until(S(0));
  await play(
    new M.LaggedStart(
      introTiles.map(tile => new M.FadeIn(tile)),
      {
        lagRatio: 0.12,
        runTime: 1.8
      }
    ),

    ...say('6 BICYCLE STATIONS'),

    ...fbox([
      'Similar stations',
      ['Same service plan', C.cyan]
    ])
  );

  // ================================================================
  // 1 — TOO FEW GROUPS
  // ================================================================

  await until(S(1));
  await play(
    new M.Create(onePlanOutline),

    ...say('TOO FEW GROUPS?', C.amber),

    ...fbox([
      ['One service plan', C.amber],
      'Different needs mixed together'
    ], C.amber)
  );

  // ================================================================
  // 2 — TOO MANY GROUPS
  // ================================================================

  await until(S(2));
  await play(
    new M.FadeOut(onePlanOutline),

    new M.LaggedStart(
      separatePlanOutlines.map(r => new M.Create(r)),
      {
        lagRatio: 0.10,
        runTime: 1.4
      }
    ),

    ...say('TOO MANY GROUPS?', C.amber),

    ...fbox([
      ['6 separate service plans', C.amber],
      'Every station managed alone'
    ], C.amber)
  );

  // ================================================================
  // 3 — HOW MANY GROUPS SHOULD K-MEANS FIND?
  // ================================================================

  await until(S(3));
  await play(
    new M.LaggedStart(
      separatePlanOutlines.map(r =>
        new M.Indicate(r, { color: C.violet })
      ),
      {
        lagRatio: 0.08,
        runTime: 1.1
      }
    ),

    ...say('HOW MANY GROUPS?', C.violet),

    ...fbox([
      ['k = ?', C.violet],
      'Choose a useful number of groups'
    ], C.violet)
  );

  // ================================================================
  // 4 — BRING BACK THE SIX STATION DOTS
  // ================================================================

  await until(S(4));
  await play(
    ...introTiles.map(tile => new M.FadeOut(tile)),

    ...separatePlanOutlines.map(r => new M.FadeOut(r)),

    new M.FadeIn(axes),

    new M.LaggedStart(
      IDS.map(id => new M.FadeIn(stations[id])),
      {
        lagRatio: 0.12,
        runTime: 1.6
      }
    ),

    ...say('THE SAME SIX STATIONS'),

    ...fbox([
      'Across: departures',
      'Up: returns',
      ['6 fixed data points', C.cyan]
    ])
  );

  // ================================================================
  // 5 — TRY DIFFERENT NUMBERS OF GROUPS
  // The station positions remain fixed throughout.
  // ================================================================

  await until(S(5));
  await play(
    indicateStations(IDS, C.cyan),

    ...say('CHANGE THE GROUPS, NOT THE DATA'),

    ...fbox([
      ['Station positions: fixed', C.ink],
      ['Number of groups: changeable', C.cyan]
    ])
  );

  // ================================================================
  // 6 — DEFINE k
  // ================================================================

  await until(S(6));
  await play(
    ...say('k = NUMBER OF GROUPS', C.violet),

    ...fbox([
      ['k = number of groups', C.violet],
      'Try k = 1, 2, 3, 4, 5, 6'
    ], C.violet)
  );

  // ================================================================
  // 7 — IMAGINE ONE GROUP WITH ONE CENTRE
  // ================================================================

  await until(S(7));
  await play(
    ...stage(1, {
      centres: true,
      links: false
    }),

    ...setK(1, BLUE),

    ...say('ONE GROUP · ONE CENTRE', BLUE),

    ...fbox([
      ['k = 1', BLUE],
      'A, B, C, D, E, F',
      'All share one centre'
    ], BLUE)
  );

  // ================================================================
  // 8 — SOME STATIONS ARE CLOSE, OTHERS FAR AWAY
  // ================================================================

  await until(S(8));
  await play(
    ...stage(1, {
      centres: true,
      links: true
    }),

    ...say('SOME CLOSE · SOME FAR', C.amber),

    ...fbox([
      ['Short connecting lines', C.green],
      ['Long connecting lines', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 9 — ADDING ANOTHER CENTRE CAN HELP
  // Preview two groups before calculating their inertia.
  // ================================================================

  await until(S(9));
  await play(
    ...stage(2),

    ...setK(2, C.cyan),

    ...say('ANOTHER CENTRE CAN HELP'),

    ...fbox([
      ['ABC', BLUE],
      ['DEF', ORANGE],
      'Stations can use closer centres'
    ])
  );

  // ================================================================
  // 10 — HOW MUCH DOES EACH ADDITIONAL CENTRE HELP?
  // ================================================================

  await until(S(10));
  await play(
    ...focusDistances(IDS, C.amber),

    ...say('HOW MUCH BETTER?', C.amber),

    ...fbox([
      'More centres can reduce distance',
      ['How large is the improvement?', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 11 — DEFINE INERTIA
  // Total squared distance to assigned centres.
  // ================================================================

  await until(S(11));
  await play(
    ...say('INERTIA = TOTAL SQUARED DISTANCE'),

    ...fbox([
      ['inertia', C.cyan],
      '= sum of squared distances',
      'to assigned centres'
    ])
  );

  // ================================================================
  // 12 — SMALLER INERTIA MEANS CLOSER GROUPS
  // ================================================================

  await until(S(12));
  await play(
    ...focusDistances('ABC', BLUE),

    ...focusDistances('DEF', ORANGE),

    ...say('SMALLER INERTIA = CLOSER GROUPS', C.green),

    ...fbox([
      ['Smaller inertia', C.green],
      'Stations lie closer',
      'to their assigned centres'
    ], C.green)
  );

  // ================================================================
  // 13 — START THE ACTUAL COMPARISON WITH k = 1
  // Remove the preview centres and their connecting lines.
  // ================================================================

  await until(S(13));
  await play(
    ...stage(1, {
      centres: false,
      links: false
    }),

    ...setK(1, BLUE),

    ...say('TRY k = 1', BLUE),

    ...fbox([
      ['One group', BLUE],
      'A, B, C, D, E, F'
    ], BLUE)
  );

  // ================================================================
  // 14 — TOTAL DEPARTURES = 30, TOTAL RETURNS = 15
  // ================================================================

  await until(S(14));
  await play(
    indicateStations(IDS, BLUE),

    ...say('ADD THE SIX STATION COORDINATES'),

    ...fbox([
      ['Total departures', C.muted],
      [`1 + 2 + 3 + 7 + 8 + 9 = ${TOTAL_X}`, BLUE],
      ['Total returns', C.muted],
      [`1 + 2 + 3 + 1 + 2 + 6 = ${TOTAL_Y}`, BLUE]
    ], BLUE)
  );

  // ================================================================
  // 15 — DIVIDE BOTH TOTALS BY SIX
  // ================================================================

  await until(S(15));
  await play(
    ...say('DIVIDE EACH TOTAL BY 6', C.amber),

    ...fbox([
      'Mean departures = 30 ÷ 6',
      'Mean returns    = 15 ÷ 6',
      ['6 stations', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 16 — CENTRE AT (5, 2.5)
  // ================================================================

  const c1 = centreOf('ABCDEF');

  const guideX = new M.DashedLine({
    start: xy(c1.x, 0),
    end: xy(c1.x, c1.y),
    color: C.amber
  });

  const guideY = new M.DashedLine({
    start: xy(0, c1.y),
    end: xy(c1.x, c1.y),
    color: C.amber
  });

  const centreLabel1 = fittedPill(
    `(${fmt(c1.x)}, ${fmt(c1.y)})`,
    BLUE,
    P ? 18 : 14,
    point(
      xy(c1.x, c1.y)[0],
      xy(c1.x, c1.y)[1] + 0.45
    ),
    1.65
  );

  await until(S(16));
  await play(
    ...stage(1, {
      centres: true,
      links: false
    }),

    new M.Create(guideX),
    new M.Create(guideY),
    new M.FadeIn(centreLabel1),

    ...say('CENTRE = (5, 2.5)', BLUE),

    ...fbox([
      '30 ÷ 6 = 5',
      '15 ÷ 6 = 2.5',
      ['Centre = (5, 2.5)', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 17 — DRAW ALL SIX CONNECTING LINES
  // ================================================================

  await until(S(17));
  await play(
    new M.FadeOut(guideX),
    new M.FadeOut(guideY),
    new M.FadeOut(centreLabel1),

    ...stage(1, {
      centres: true,
      links: true
    }),

    ...say('CONNECT EACH STATION TO ITS CENTRE'),

    ...fbox([
      '6 stations',
      '6 connecting distances',
      ['1 shared centre', BLUE]
    ], BLUE)
  );

  // ================================================================
  // 18 — k = 1 INERTIA = 75.5
  //
  // Squared distances:
  // A = 18.25
  // B =  9.25
  // C =  4.25
  // D =  6.25
  // E =  9.25
  // F = 28.25
  //
  // Total = 75.5
  // ================================================================

  const squared1 = DATA.map(d =>
    squaredDistance(d, c1)
  );

  await until(S(18));
  await play(
    ...focusDistances(IDS, BLUE),

    ...say('k = 1: INERTIA = 75.5', C.amber),

    ...fbox([
      '18.25 + 9.25 + 4.25',
      '+ 6.25 + 9.25 + 28.25',
      [`Inertia = ${fmt(INERTIA[0])}`, C.amber]
    ], C.amber)
  );

  // ================================================================
  // 19 — NOW TRY TWO GROUPS
  // ================================================================

  await until(S(19));
  await play(
    ...updateGroups([], {
      centres: false,
      links: false
    }),

    ...setK(2),

    ...say('NOW TRY k = 2'),

    ...fbox([
      ['k = 2', C.cyan],
      'Use the best grouping',
      'for these six stations'
    ])
  );

  // ================================================================
  // 20 — ABC AND DEF FORM TWO GROUPS
  // ================================================================

  await until(S(20));
  await play(
    ...stage(2, {
      centres: false,
      links: false
    }),

    ...say('ABC TOGETHER · DEF TOGETHER'),

    ...fbox([
      ['Blue group:   A, B, C', BLUE],
      ['Orange group: D, E, F', ORANGE]
    ])
  );

  // ================================================================
  // 21 — CENTRES AT (2, 2) AND (8, 3)
  // ================================================================

  const blue2 = centreOf('ABC');
  const orange2 = centreOf('DEF');

  const blueCentreLabel = fittedPill(
    `(${fmt(blue2.x)}, ${fmt(blue2.y)})`,
    BLUE,
    P ? 18 : 14,
    point(
      xy(blue2.x, blue2.y)[0] + 0.40,
      xy(blue2.x, blue2.y)[1] - 0.40
    ),
    1.25
  );

  const orangeCentreLabel = fittedPill(
    `(${fmt(orange2.x)}, ${fmt(orange2.y)})`,
    ORANGE,
    P ? 18 : 14,
    point(
      xy(orange2.x, orange2.y)[0] + 0.35,
      xy(orange2.x, orange2.y)[1] + 0.41
    ),
    1.25
  );

  await until(S(21));
  await play(
    ...stage(2),

    new M.FadeIn(blueCentreLabel),
    new M.FadeIn(orangeCentreLabel),

    ...say('TWO GROUPS · TWO CENTRES'),

    ...fbox([
      ['ABC centre = (2, 2)', BLUE],
      ['DEF centre = (8, 3)', ORANGE]
    ])
  );

  // ================================================================
  // 22 — MOST CONNECTING LINES ARE NOW SHORTER
  // ================================================================

  await until(S(22));
  await play(
    new M.FadeOut(blueCentreLabel),
    new M.FadeOut(orangeCentreLabel),

    ...focusDistances(IDS, C.green),

    ...say('MOST LINES ARE MUCH SHORTER', C.green),

    ...fbox([
      'Two centres instead of one',
      ['Less total squared distance', C.green]
    ], C.green)
  );

  // ================================================================
  // 23 — BLUE GROUP INERTIA = 4
  // A: 2, B: 0, C: 2
  // ================================================================

  await until(S(23));
  await play(
    indicateStations('ABC', BLUE),

    ...focusDistances('ABC', BLUE),

    ...focusCentre(BLUE),

    ...say('BLUE GROUP: INERTIA = 4', BLUE),

    ...fbox([
      ['ABC squared distances', BLUE],
      '2 + 0 + 2',
      [`= ${fmt(groupInertia('ABC'))}`, BLUE]
    ], BLUE)
  );

  // ================================================================
  // 24 — ORANGE GROUP INERTIA = 16
  // D: 5, E: 1, F: 10
  // ================================================================

  await until(S(24));
  await play(
    indicateStations('DEF', ORANGE),

    ...focusDistances('DEF', ORANGE),

    ...focusCentre(ORANGE),

    ...say('ORANGE GROUP: INERTIA = 16', ORANGE),

    ...fbox([
      ['DEF squared distances', ORANGE],
      '5 + 1 + 10',
      [`= ${fmt(groupInertia('DEF'))}`, ORANGE]
    ], ORANGE)
  );

  // ================================================================
  // 25 — TOTAL INERTIA = 20
  // ================================================================

  await until(S(25));
  await play(
    ...focusCentre(BLUE),
    ...focusCentre(ORANGE),

    ...say('k = 2: INERTIA = 20', C.amber),

    ...fbox([
      ['Blue   = 4', BLUE],
      ['Orange = 16', ORANGE],
      [`4 + 16 = ${fmt(INERTIA[1])}`, C.amber]
    ], C.amber)
  );

  // ================================================================
  // 26 — IMPROVEMENT = 55.5
  // ================================================================

  await until(S(26));
  await play(
    ...say('A LARGE IMPROVEMENT: 55.5', C.green),

    ...fbox([
      'Old inertia = 75.5',
      'New inertia = 20',
      [`75.5 − 20 = ${fmt(GAINS[0])}`, C.green]
    ], C.green)
  );

  // ================================================================
  // 27 — TRY THREE GROUPS
  // ================================================================

  await until(S(27));
  await play(
    ...setK(3),

    ...say('NOW TRY k = 3'),

    ...fbox([
      ['k = 3', C.cyan],
      'Add one more group'
    ])
  );

  // ================================================================
  // 28 — ABC STAY TOGETHER; DE FORM A GROUP
  //
  // The blue centre remains at (2, 2).
  // The orange centre moves from (8, 3) to (7.5, 1.5).
  // F is temporarily neutral until its own group is introduced.
  // ================================================================

  await until(S(28));
  await play(
    ...updateGroups([
      { ids: 'ABC', color: BLUE },
      { ids: 'DE', color: ORANGE }
    ]),

    ...say('ABC STAY TOGETHER · DE TOGETHER'),

    ...fbox([
      ['ABC: centre (2, 2)', BLUE],
      ['DE: centre (7.5, 1.5)', ORANGE]
    ])
  );

  // ================================================================
  // 29 — F GETS ITS OWN GROUP AND CENTRE
  // ================================================================

  await until(S(29));
  await play(
    ...stage(3),

    ...say('F GETS ITS OWN CENTRE', PURPLE),

    ...fbox([
      ['Third group: F', PURPLE],
      ['Centre = (9, 6)', PURPLE],
      'Station and centre coincide'
    ], PURPLE)
  );

  // ================================================================
  // 30 — ABC INERTIA = 4; DE INERTIA = 1
  // ================================================================

  await until(S(30));
  await play(
    ...focusDistances('ABC', BLUE),

    ...focusDistances('DE', ORANGE),

    ...say('FIRST TWO GROUPS: 4 AND 1'),

    ...fbox([
      ['ABC: 2 + 0 + 2 = 4', BLUE],
      ['DE:  0.5 + 0.5 = 1', ORANGE]
    ])
  );

  // ================================================================
  // 31 — F HAS ZERO DISTANCE TO ITS CENTRE
  // ================================================================

  const zeroRing = circleAt(
    stationPoint('F'),
    0.30,
    PURPLE,
    0.025
  );

  const zeroTag = fittedPill(
    'distance = 0',
    PURPLE,
    P ? 18 : 14,
    point(
      stationPoint('F')[0] - 0.70,
      stationPoint('F')[1] - 0.43
    ),
    1.65
  );

  await until(S(31));
  await play(
    new M.Create(zeroRing),

    new M.FadeIn(zeroTag),

    ...focusCentre(PURPLE),

    ...say('F SITS DIRECTLY ON ITS CENTRE', PURPLE),

    ...fbox([
      'F distance = 0',
      ['0² = 0', PURPLE],
      'F inertia = 0'
    ], PURPLE)
  );

  // ================================================================
  // 32 — k = 3 TOTAL INERTIA = 5
  // ================================================================

  await until(S(32));
  await play(
    new M.FadeOut(zeroRing),
    new M.FadeOut(zeroTag),

    ...say('k = 3: INERTIA = 5', C.amber),

    ...fbox([
      ['ABC = 4', BLUE],
      ['DE  = 1', ORANGE],
      ['F   = 0', PURPLE],
      [`4 + 1 + 0 = ${fmt(INERTIA[2])}`, C.amber]
    ], C.amber)
  );

  // ================================================================
  // 33 — IMPROVEMENT FROM 20 TO 5 = 15
  // ================================================================

  await until(S(33));
  await play(
    ...say('ANOTHER IMPROVEMENT: 15', C.green),

    ...fbox([
      'Old inertia = 20',
      'New inertia = 5',
      [`20 − 5 = ${fmt(GAINS[1])}`, C.green]
    ], C.green)
  );

  // ================================================================
  // 34 — TRY FOUR GROUPS
  //
  // AB together
  // C alone
  // DE together
  // F alone
  // ================================================================

  await until(S(34));
  await play(
    ...stage(4),

    ...setK(4),

    ...say('NOW TRY k = 4'),

    ...fbox([
      ['AB together', BLUE],
      ['C alone', GREEN],
      ['DE together', ORANGE],
      ['F alone', PURPLE]
    ])
  );

  // ================================================================
  // 35 — INERTIA FALLS FROM 5 TO 2
  // Improvement is only 3.
  // ================================================================

  await until(S(35));
  await play(
    ...focusDistances('AB', BLUE),

    ...focusDistances('DE', ORANGE),

    ...say('ONLY 3 LESS INERTIA', C.amber),

    ...fbox([
      'AB = 1, C = 0',
      'DE = 1, F = 0',
      [`Inertia = ${fmt(INERTIA[3])}`, C.cyan],
      [`5 − 2 = ${fmt(GAINS[2])}`, C.amber]
    ], C.amber)
  );

  // ================================================================
  // 36 — TRY FIVE GROUPS
  //
  // A, B, C, DE, F
  // Only D and E share a centre.
  // Inertia = 1.
  // ================================================================

  await until(S(36));
  await play(
    ...stage(5),

    ...setK(5),

    ...say('k = 5: ONLY 1 MORE IMPROVEMENT'),

    ...fbox([
      'Groups: A, B, C, DE, F',
      [`Inertia = ${fmt(INERTIA[4])}`, C.cyan],
      [`2 − 1 = ${fmt(GAINS[3])}`, C.amber]
    ], C.amber)
  );

  // ================================================================
  // 37 — TRY SIX GROUPS
  //
  // Every station has its own centre.
  // Every distance is zero.
  // There are no useful multi-station groups.
  // ================================================================

  await until(S(37));
  await play(
    ...stage(6),

    ...setK(6),

    ...say('k = 6: INERTIA = 0', C.green),

    ...fbox([
      'A, B, C, D, E, F',
      'Each station has its own centre',
      ['All distances = 0', C.green],
      ['Inertia = 0', C.green]
    ], C.green)
  );

  // ================================================================
  // ELBOW GRAPH
  //
  // Horizontal axis: number of groups k.
  // Vertical axis: smallest inertia for that k.
  //
  // Data:
  // (1, 75.5), (2, 20), (3, 5),
  // (4, 2), (5, 1), (6, 0)
  // ================================================================

  const GX0 = P ? -3.00 : -5.70;
  const GX1 = P ? 3.00 : 0.48;

  const GY0 = P ? -5.6 : -2.15;
  const GY1 = P ? -0.45 : 1.05;

  const GXLEFT = GX0 + 0.36;
  const GXRIGHT = GX1 - 0.23;

  const gx = k =>
    GXLEFT +
    (k - 1) / 5 * (GXRIGHT - GXLEFT);

  const gy = value =>
    GY0 + value / 80 * (GY1 - GY0);

  const graphPoint = (k, value) =>
    point(gx(k), gy(value));

  const graphGrid = [];

  [20, 40, 60, 80].forEach(value => {
    graphGrid.push(
      lineAt(
        point(GX0, gy(value)),
        point(GX1, gy(value)),
        '#344052',
        0.9
      )
    );
  });

  const graphXAxis = lineAt(
    point(GX0, GY0),
    point(GX1, GY0),
    C.muted,
    2.5
  );

  const graphYAxis = lineAt(
    point(GX0, GY0),
    point(GX0, GY1),
    C.muted,
    2.5
  );

  const graphAxes = new M.VGroup(
    ...graphGrid,
    graphXAxis,
    graphYAxis
  );

  const graphXTicks = KS.map(k =>
    new M.VGroup(
      lineAt(
        point(gx(k), GY0 - 0.05),
        point(gx(k), GY0 + 0.05),
        C.muted,
        1.5
      ),

      textAt(
        String(k),
        point(gx(k), GY0 - (P ? 0.3 : 0.25)),
        P ? 20 : 16,
        C.ink,
        true
      )
    )
  );

  const graphXLabel = textAt(
    'Number of groups (k)',
    point(
      (GX0 + GX1) / 2,
      GY0 - 0.60
    ),
    P ? 20 : 18,
    C.ink
  );

  const graphYTicks = [0, 20, 40, 60, 80].map(value =>
    new M.VGroup(
      lineAt(
        point(GX0 - 0.05, gy(value)),
        point(GX0 + 0.05, gy(value)),
        C.muted,
        1.5
      ),

      textAt(
        String(value),
        point(GX0 - (P ? 0.36 : 0.28), gy(value)),
        P ? 19 : 15,
        C.muted,
        true
      )
    )
  );

  const graphYLabel = textAt(
    'Smallest inertia',
    point(
      (GX0 + GX1) / 2,
      GY1 + 0.36
    ),
    P ? 21 : 19,
    C.ink
  );

  function makeGraphDot(k, value, color = C.cyan) {
    const p = graphPoint(k, value);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.21 : 0.19,
      color
    });

    halo.setFill(color, 0.15);

    const d = new M.Dot({
      point: p,
      radius: P ? 0.10 : 0.095,
      color
    });

    const label = textAt(
      fmt(value),
      // small values sit just above a nearly flat line: lift them clear of it
      point(
        p[0] + (P ? 0.36 : 0.32),
        p[1] + (value <= 5 ? (P ? 0.46 : 0.42) : (P ? 0.3 : 0.27))
      ),
      P ? 21 : 18,
      color,
      true
    );

    return new M.VGroup(
      halo,
      d,
      label
    );
  }

  const graphDots = KS.map((k, i) =>
    makeGraphDot(k, INERTIA[i])
  );

  const graphSegments = [];

  for (let i = 0; i < INERTIA.length - 1; i++) {
    graphSegments.push(
      lineAt(
        graphPoint(i + 1, INERTIA[i]),
        graphPoint(i + 2, INERTIA[i + 1]),
        C.cyan,
        3.5
      )
    );
  }

  // ================================================================
  // 38 — SWITCH FROM THE STATION PICTURE TO THE ELBOW GRAPH
  // ================================================================

  await until(S(38));
  await play(
    ...clearGroupVisuals(),

    ...clearK(),

    new M.FadeOut(axes),

    ...IDS.map(id => new M.FadeOut(stations[id])),

    new M.FadeIn(graphAxes),

    ...say('GRAPH THE SIX RESULTS'),

    ...fbox([
      ['Six results to graph', C.cyan],
      'k = 1: 75.5   k = 2: 20',
      'k = 3: 5      k = 4: 2',
      'k = 5: 1      k = 6: 0'
    ])
  );

  // ================================================================
  // 39 — HORIZONTAL AXIS: k = 1 TO 6
  // ================================================================

  await until(S(39));
  await play(
    new M.LaggedStart(
      graphXTicks.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.10,
        runTime: 1.2
      }
    ),

    new M.FadeIn(graphXLabel),

    ...say('ACROSS: NUMBER OF GROUPS'),

    ...fbox([
      ['Horizontal axis', C.muted],
      ['k = 1 to 6', C.cyan]
    ])
  );

  // ================================================================
  // 40 — VERTICAL AXIS: SMALLEST INERTIA
  // Place all six calculated points.
  // ================================================================

  await until(S(40));
  await play(
    new M.LaggedStart(
      graphYTicks.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.08,
        runTime: 0.8
      }
    ),

    new M.FadeIn(graphYLabel),

    new M.LaggedStart(
      graphDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.14,
        runTime: 1.8
      }
    ),

    ...say('UP: SMALLEST INERTIA'),

    ...fbox([
      ['k       inertia', C.muted],
      '1: 75.5   2: 20',
      '3: 5      4: 2',
      '5: 1      6: 0'
    ])
  );

  // ================================================================
  // 41 — CONNECT THE SIX POINTS
  // ================================================================

  await until(S(41));
  await play(
    new M.LaggedStart(
      graphSegments.map(s => new M.Create(s)),
      {
        lagRatio: 0.22,
        runTime: 1.8
      }
    ),

    ...say('CONNECT THE RESULTS'),

    ...fbox([
      'More groups',
      ['↓', C.cyan],
      'Lower inertia'
    ])
  );

  // ================================================================
  // 42 — THE CURVE FALLS SHARPLY, THEN FLATTENS
  // ================================================================

  const steepLines = [
    lineAt(
      graphPoint(1, INERTIA[0]),
      graphPoint(2, INERTIA[1]),
      C.green,
      5
    ),

    lineAt(
      graphPoint(2, INERTIA[1]),
      graphPoint(3, INERTIA[2]),
      C.green,
      5
    )
  ];

  const flatLines = [
    lineAt(
      graphPoint(3, INERTIA[2]),
      graphPoint(4, INERTIA[3]),
      C.amber,
      4.5
    ),

    lineAt(
      graphPoint(4, INERTIA[3]),
      graphPoint(5, INERTIA[4]),
      C.amber,
      4.5
    ),

    lineAt(
      graphPoint(5, INERTIA[4]),
      graphPoint(6, INERTIA[5]),
      C.amber,
      4.5
    )
  ];

  const steepLabel = fittedPill(
    'Large gains',
    C.green,
    P ? 18 : 16,
    point(
      gx(2) + 0.45,
      gy(49)
    ),
    1.90
  );

  const flatLabel = fittedPill(
    'Small gains',
    C.amber,
    P ? 18 : 16,
    // well above the value labels 2 and 1 that sit over the flat part
    point(
      (gx(4) + gx(5)) / 2,
      gy(P ? 30 : 32)
    ),
    1.85
  );

  await until(S(42));
  await play(
    new M.LaggedStart(
      [
        ...steepLines.map(s => new M.Create(s)),
        ...flatLines.map(s => new M.Create(s))
      ],
      {
        lagRatio: 0.12,
        runTime: 1.5
      }
    ),

    new M.FadeIn(steepLabel),
    new M.FadeIn(flatLabel),

    ...say('STEEP AT FIRST · FLATTER LATER'),

    ...fbox([
      ['Early groups: large gains', C.green],
      ['Later groups: small gains', C.amber]
    ])
  );

  // ================================================================
  // 43 — FORMULA FOR EACH IMPROVEMENT
  // ================================================================

  await until(S(43));
  await play(
    new M.Indicate(graphDots[0], {
      color: C.green
    }),

    new M.Indicate(graphDots[1], {
      color: C.green
    }),

    ...say('IMPROVEMENT = OLD MINUS NEW', C.amber),

    ...fbox([
      ['Improvement', C.amber],
      '= previous inertia',
      '  − new inertia'
    ], C.amber)
  );

  // ================================================================
  // IMPROVEMENT LABELS
  //
  // Positioned above the corresponding curve segments.
  // The smaller gains use staggered heights to avoid overlap.
  // ================================================================

  const gainLabelPositions = [
    point(
      gx(1) * 0.56 + gx(2) * 0.44 + 0.37,
      gy(50) + 0.34
    ),

    point(
      (gx(2) + gx(3)) / 2,
      gy(24) + 0.30
    ),

    point(
      (gx(3) + gx(4)) / 2,
      gy(5) + 0.65
    ),

    point(
      (gx(4) + gx(5)) / 2,
      gy(2) + 0.90
    ),

    point(
      (gx(5) + gx(6)) / 2,
      gy(1) + 0.65
    )
  ];

  const gainLabels = GAINS.map((gain, i) =>
    fittedPill(
      `−${fmt(gain)}`,
      i < 2 ? C.green : C.amber,
      P ? 18 : 15,
      gainLabelPositions[i],
      P ? 0.97 : 1.04
    )
  );

  // ================================================================
  // 44 — SHOW THE FIVE IMPROVEMENTS
  //
  // 55.5, 15, 3, 1, 1
  // Negative signs on the graph indicate falling inertia.
  // The improvement magnitudes themselves are positive.
  // ================================================================

  await until(S(44));
  await play(
    new M.FadeOut(steepLabel),
    new M.FadeOut(flatLabel),

    new M.LaggedStart(
      gainLabels.map(g => new M.FadeIn(g)),
      {
        lagRatio: 0.22,
        runTime: 2.0
      }
    ),

    ...say('GAINS: 55.5, 15, 3, 1, 1'),

    ...fbox([
      ['1 → 2: 55.5', C.green],
      ['2 → 3: 15', C.green],
      ['3 → 4: 3', C.amber],
      ['4 → 5: 1   5 → 6: 1', C.amber]
    ])
  );

  // ================================================================
  // 45 — LITTLE IS GAINED AFTER THE THIRD GROUP
  // ================================================================

  const flatRegion = outlineAt(
    point(
      (gx(3) + gx(6)) / 2,
      GY0 + 0.46
    ),
    gx(6) - gx(3) + 0.50,
    1.16,
    C.amber,
    2
  );

  await until(S(45));
  await play(
    ...gainLabels.map(g => new M.FadeOut(g)),

    new M.Create(flatRegion),

    new M.LaggedStart(
      flatLines.map(s =>
        new M.Indicate(s, { color: C.amber })
      ),
      {
        lagRatio: 0.10,
        runTime: 1.1
      }
    ),

    ...say('LITTLE GAIN AFTER k = 3', C.amber),

    ...fbox([
      ['After three groups:', C.amber],
      'Improvements = 3, 1, 1',
      'The curve is flattening'
    ], C.amber)
  );

  // ================================================================
  // 46 — THE BEND LOOKS LIKE AN ELBOW
  // ================================================================

  const elbowPoint = graphPoint(3, INERTIA[2]);

  const elbowHalo = new M.Dot({
    point: elbowPoint,
    radius: P ? 0.40 : 0.36,
    color: C.amber
  });

  elbowHalo.setFill(C.amber, 0.12);

  const elbowRing = circleAt(
    elbowPoint,
    P ? 0.29 : 0.27,
    C.amber,
    0.02
  );

  // A bent-arm overlay follows the existing curve shape.
  // It emphasises the turn from a steep slope to a flat slope.

  const armStart = graphPoint(2, INERTIA[1]);
  const armEnd = graphPoint(4, INERTIA[3]);

  const armUpper = lineAt(
    armStart,
    elbowPoint,
    C.amber,
    5
  );

  const armLower = lineAt(
    elbowPoint,
    armEnd,
    C.amber,
    5
  );

  await until(S(46));
  await play(
    new M.FadeOut(flatRegion),

    new M.FadeIn(elbowHalo),
    new M.Create(elbowRing),

    new M.Create(armUpper),
    new M.Create(armLower),

    ...say('THE BEND LOOKS LIKE AN ELBOW', C.amber),

    ...fbox([
      'Steep descent',
      ['↓ bend', C.amber],
      'Much flatter descent'
    ], C.amber)
  );

  // ================================================================
  // 47 — NAME THE ELBOW METHOD
  // ================================================================

  const elbowTag = fittedPill(
    'ELBOW',
    C.amber,
    P ? 20 : 18,
    point(
      gx(3) + 1.25,
      gy(5) + 1.5
    ),
    1.70
  );

  const elbowLeader = lineAt(
    point(
      gx(3) + 0.75,
      gy(5) + 1.3
    ),

    point(
      elbowPoint[0],
      elbowPoint[1] + 0.29
    ),

    C.amber,
    1.6
  );

  await until(S(47));
  await play(
    new M.Create(elbowLeader),

    new M.FadeIn(elbowTag),

    new M.Indicate(elbowRing, {
      color: C.amber
    }),

    ...say('THE ELBOW METHOD', C.amber),

    ...fbox([
      ['Elbow method', C.amber],
      'Look for the bend',
      'where improvements become small'
    ], C.amber)
  );

  // ================================================================
  // 48 — USEFUL REDUCTION WITHOUT UNNECESSARY GROUPS
  // ================================================================

  const chosenKLine = new M.DashedLine({
    start: point(gx(3), GY0 - 0.02),
    end: point(gx(3), GY1),
    color: C.amber
  });

  await until(S(48));
  await play(
    new M.Create(chosenKLine),

    ...say('BALANCE ERROR AND COMPLEXITY', C.green),

    ...fbox([
      ['Useful reduction in error', C.green],
      'Without unnecessary groups',
      ['Look near the elbow', C.amber]
    ], C.green)
  );

  // ================================================================
  // 49 — THREE GROUPS ARE A REASONABLE CHOICE
  //
  // The elbow is a practical guide, not a guarantee.
  // ================================================================

  const chosenTag = fittedPill(
    'k = 3',
    C.green,
    P ? 20 : 18,
    point(
      gx(3) + 1.0,
      gy(43)
    ),
    1.60
  );

  await until(S(49));
  await play(
    new M.FadeIn(chosenTag),

    new M.Indicate(elbowRing, {
      color: C.green
    }),

    ...say('3 GROUPS IS A REASONABLE CHOICE', C.green),

    ...fbox([
      ['k = 3', C.green],
      ['ABC', BLUE],
      ['DE', ORANGE],
      ['F', PURPLE]
    ], C.green)
  );

  // ================================================================
  // 50 — ZERO INERTIA DOES NOT MEAN USEFUL GROUPING
  //
  // Six groups give zero inertia, but each station stands alone.
  // ================================================================

  const sixRing = circleAt(
    graphPoint(6, INERTIA[5]),
    P ? 0.24 : 0.22,
    C.amber,
    0.04
  );

  const sixTag = fittedPill(
    'ZERO ERROR',
    C.amber,
    P ? 18 : 14,
    point(
      gx(6) - 0.45,
      gy(0) + 0.85
    ),
    1.65
  );

  await until(S(50));
  await play(
    new M.FadeOut(chosenTag),

    new M.Create(sixRing),

    new M.FadeIn(sixTag),

    new M.Indicate(graphDots[5], {
      color: C.amber
    }),

    ...say('ZERO ERROR ≠ USEFUL GROUPS', C.amber),

    ...fbox([
      ['k = 6: inertia = 0', C.green],
      'One station per group',
      ['No stations grouped together', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 51 — SOME GRAPHS HAVE NO CLEAR ELBOW
  //
  // Show a separate illustrative curve with gradual improvements.
  // This is explicitly labelled as an illustration, not new results
  // for the six bicycle stations.
  // ================================================================

  const noElbowValues = [75, 60, 45, 30, 15, 0];

  const noElbowDots = KS.map((k, i) => {
    const p = graphPoint(
      k,
      noElbowValues[i]
    );

    const halo = new M.Dot({
      point: p,
      radius: 0.17,
      color: C.violet
    });

    halo.setFill(C.violet, 0.13);

    const dot = new M.Dot({
      point: p,
      radius: 0.075,
      color: C.violet
    });

    return new M.VGroup(halo, dot);
  });

  const noElbowSegments = [];

  for (let i = 0; i < noElbowValues.length - 1; i++) {
    noElbowSegments.push(
      lineAt(
        graphPoint(i + 1, noElbowValues[i]),
        graphPoint(i + 2, noElbowValues[i + 1]),
        C.violet,
        3
      )
    );
  }

  const illustrativeTag = fittedPill(
    'ILLUSTRATIVE CURVE',
    C.violet,
    P ? 18 : 15,
    point(
      (GX0 + GX1) / 2 + 0.45,
      gy(70)
    ),
    P ? 3.10 : 3.0
  );

  await until(S(51));
  await play(
    new M.FadeOut(sixRing),
    new M.FadeOut(sixTag),

    new M.FadeOut(elbowHalo),
    new M.FadeOut(elbowRing),
    new M.FadeOut(elbowTag),
    new M.FadeOut(elbowLeader),
    new M.FadeOut(chosenKLine),
    new M.FadeOut(armUpper),
    new M.FadeOut(armLower),

    ...steepLines.map(s => new M.FadeOut(s)),
    ...flatLines.map(s => new M.FadeOut(s)),
    ...graphSegments.map(s => new M.FadeOut(s)),
    ...graphDots.map(d => new M.FadeOut(d)),

    new M.LaggedStart(
      noElbowDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.08,
        runTime: 1.0
      }
    ),

    new M.LaggedStart(
      noElbowSegments.map(s => new M.Create(s)),
      {
        lagRatio: 0.10,
        runTime: 1.5
      }
    ),

    new M.FadeIn(illustrativeTag),

    ...say('NOT EVERY GRAPH HAS A CLEAR ELBOW', C.amber),

    ...fbox([
      ['No clear bend?', C.amber],
      'Consider the real situation',
      'And whether groups are useful'
    ], C.amber)
  );

  // ================================================================
  // 52 — FINAL TAKEAWAY
  //
  // Return to the actual bicycle-station results.
  // Highlight k = 3 as a reasonable balance between
  // reduced inertia and useful grouping.
  // ================================================================

  const finalDots = KS.map((k, i) =>
    makeGraphDot(
      k,
      INERTIA[i],
      k === 3 ? C.green : C.cyan
    )
  );

  const finalSegments = [];

  for (let i = 0; i < INERTIA.length - 1; i++) {
    finalSegments.push(
      lineAt(
        graphPoint(i + 1, INERTIA[i]),
        graphPoint(i + 2, INERTIA[i + 1]),
        i < 2 ? C.green : C.cyan,
        i < 2 ? 3.8 : 3
      )
    );
  }

  const finalRing = circleAt(
    graphPoint(3, INERTIA[2]),
    P ? 0.30 : 0.28,
    C.green,
    0.05
  );

  const finalLeader = lineAt(
    point(
      gx(3) + 0.75,
      gy(5) + 1.3
    ),

    point(
      gx(3),
      gy(5) + 0.30
    ),

    C.green,
    1.8
  );

  const finalElbowTag = fittedPill(
    'ELBOW: k = 3',
    C.green,
    P ? 20 : 18,
    point(
      gx(3) + 1.45,
      gy(5) + 1.5
    ),
    P ? 2.45 : 2.30
  );

  const finalGroupNote = P
    ? fittedPill(
        'ABC  ·  DE  ·  F',
        C.green,
        20,
        point(0, -6.75),
        FW - 1.3
      )
    : fittedPill(
        'ABC  ·  DE  ·  F',
        C.green,
        18,
        point(4.3, -1.92),
        3.9
      );

  await until(S(52));
  await play(
    ...noElbowDots.map(d => new M.FadeOut(d)),

    ...noElbowSegments.map(s => new M.FadeOut(s)),

    new M.FadeOut(illustrativeTag),

    new M.LaggedStart(
      finalDots.map(d => new M.FadeIn(d)),
      {
        lagRatio: 0.10,
        runTime: 1.2
      }
    ),

    new M.LaggedStart(
      finalSegments.map(s => new M.Create(s)),
      {
        lagRatio: 0.12,
        runTime: 1.5
      }
    ),

    new M.Create(finalRing),
    new M.Create(finalLeader),
    new M.FadeIn(finalElbowTag),
    new M.FadeIn(finalGroupNote),

    ...say('USEFUL GROUPS, NOT UNNECESSARY ONES', C.green),

    ...fbox([
      ['Choose a useful k', C.green],
      'Reduce inertia substantially',
      'Avoid unnecessary groups',
      ['Here: k = 3 is reasonable', C.green]
    ], C.green)
  );
}

// lesson 8.2.9
// Regression discontinuity: looking for a jump where a rule changes.
//
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Separate distance-rule illustration:
//
// Distance from work    Pass received    Average commute
//       4.9 km               No             40 minutes
//       5.1 km               Yes            34 minutes
//
// Eligibility rule: receive a pass at 5 km or more.
//
// Distance between observed dots = 5.1 - 4.9 = 0.2 km.
// Rough nearby-bin contrast = 34 - 40 = -6 minutes.
//
// The nearby-bin contrast is NOT necessarily the exact jump
// at the cutoff. Regression discontinuity targets the difference
// between the two trends as they approach the cutoff.
//
// A causal interpretation requires:
//   1. Smooth untreated average outcomes at the cutoff.
//   2. No precise sorting or manipulation around the cutoff.
//   3. No other benefit or change jumping at the same cutoff.
//
// Additional trend pictures are explicitly schematic.
// Additional practice values are explicitly hypothetical.
//
// Try it beats preview the separate interactive exercise.
// The supplied scene API does not specify mouse/touch handlers.
// Browser playback has not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed lesson data
  // ------------------------------------------------------------

  const DATA = {
    cutoff: 5.0,

    left: {
      distance: 4.9,
      minutes: 40,
      pass: false,
      color: C.violet
    },

    right: {
      distance: 5.1,
      minutes: 34,
      pass: true,
      color: C.cyan
    }
  };

  const DISTANCE_GAP = Number(
    (
      DATA.right.distance -
      DATA.left.distance
    ).toFixed(1)
  );

  const ROUGH_GAP =
    DATA.right.minutes -
    DATA.left.minutes;

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: picture above the formula box.
  // Laptop: picture left, formula box right.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PIC_W = P ? 7.0 : 7.10;

  const PILL = P
    ? [0, 3.65, 0]
    : [0, 1.92, 0];

  const BOXP = P
    ? [0, -4.15, 0]
    : [4.25, -0.30, 0];

  const TITLE_Y = P ? 2.95 : 1.48;
  const REGION_Y = P ? 2.38 : 1.08;

  const X_MIN = CX - 2.80;
  const X_MAX = CX + 3.05;

  const Y_MIN = P ? -2.05 : -2.20;
  const Y_MAX = P ? 1.55 : 0.34;

  const D_MIN = 4.6;
  const D_MAX = 5.4;

  const T_MIN = 28;
  const T_MAX = 46;

  const xDistance = d =>
    X_MIN +
    (d - D_MIN) /
    (D_MAX - D_MIN) *
    (X_MAX - X_MIN);

  const yMinutes = m =>
    Y_MIN +
    (m - T_MIN) /
    (T_MAX - T_MIN) *
    (Y_MAX - Y_MIN);

  const at = (x, y) => [x, y, 0];

  const point = (d, m) =>
    at(
      xDistance(d),
      yMinutes(m)
    );

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  function signed(n) {
    if (n < 0) return `−${Math.abs(n)}`;
    if (n > 0) return `+${n}`;
    return '0';
  }

  // ------------------------------------------------------------
  // Basic visual helpers
  // ------------------------------------------------------------

  function txt(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    p,
    w,
    h,
    color = C.muted,
    opacity = 0,
    stroke = 1.5
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: stroke
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function line(
    a,
    b,
    color = C.muted,
    stroke = 2.5
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: stroke
    });
  }

  function dashed(
    a,
    b,
    color = C.muted,
    stroke = 2.0
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: stroke
    });
  }

  function fadeAll(items) {
    return items
      .filter(Boolean)
      .map(m => new M.FadeOut(m));
  }

  function lagIn(
    items,
    runTime = 0.85,
    lagRatio = 0.10
  ) {
    return new M.LaggedStart(
      items.map(m => new M.FadeIn(m)),
      { lagRatio, runTime }
    );
  }

  function arrow(
    start,
    end,
    color,
    stroke = 2.8
  ) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const headL = Math.min(
      0.18,
      len * 0.35
    );

    const headW = 0.09;

    const bx = end[0] - ux * headL;
    const by = end[1] - uy * headL;

    return new M.VGroup(
      line(
        start,
        end,
        color,
        stroke
      ),

      line(
        at(
          bx - uy * headW,
          by + ux * headW
        ),
        end,
        color,
        stroke
      ),

      line(
        at(
          bx + uy * headW,
          by - ux * headW
        ),
        end,
        color,
        stroke
      )
    );
  }

  function tag(
    s,
    color,
    p,
    size = P ? 18 : 16
  ) {
    const t = pill(s, color, size);
    t.moveTo(p);
    return t;
  }

  function cross(
    p,
    color = C.amber,
    r = 0.15
  ) {
    const [x, y] = p;

    return new M.VGroup(
      line(
        at(x - r, y - r),
        at(x + r, y + r),
        color,
        4
      ),

      line(
        at(x - r, y + r),
        at(x + r, y - r),
        color,
        4
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Each new formula group is assembled before it appears.
  // No already-visible objects are regrouped.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.40 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const maxw = P ? FW - 1.0 : 4.55;

    const rawWidth = Math.max(
      ...texts.map(t => t.getWidth())
    );

    const scale = Math.min(
      1,
      (maxw - 0.64) /
      Math.max(rawWidth, 0.01)
    );

    texts.forEach(t => {
      if (scale < 1) {
        t.scale(scale);
      }
    });

    // getWidth() ignores a later .scale(): apply it by hand.
    const k = Math.min(1, scale);
    const tw = t => t.getWidth() * k;

    const wd = Math.max(
      2.20,
      Math.max(
        ...texts.map(tw)
      ) + 0.64
    );

    const ht =
      rows.length * lh + 0.38;

    // Phone: the box hangs from a fixed top edge so the
    // tags above it (y about -3.1) are never covered.
    const cy = P
      ? Math.min(BOXP[1], -3.62 - ht / 2)
      : BOXP[1];

    const r = rect(
      at(BOXP[0], cy),
      wd,
      ht,
      color,
      0.96,
      2
    );

    const left =
      BOXP[0] - wd / 2 + 0.32;

    const top =
      cy + ht / 2 -
      0.19 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo(at(
        left + tw(t) / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(
      r,
      ...texts
    );

    const a = [];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    a.push(
      new M.FadeIn(g)
    );

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Glowing commuter / average markers
  //
  // Violet = no pass.
  // Cyan = pass group.
  // Amber ring = received a pass.
  //
  // Hollow green markers are schematic trend endpoints,
  // not additional observed averages.
  // ------------------------------------------------------------

  function glowDot(
    p,
    color,
    hasPass = false,
    hollow = false,
    radius = 0.105
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.15,
      color
    });

    halo.setFill(
      color,
      hollow ? 0.08 : 0.17
    );

    const parts = [halo];

    if (hollow) {
      const r = new M.Circle({
        radius: radius * 1.15,
        color,
        strokeWidth: 2.5
      });

      r.setFill(color, 0);
      r.moveTo(p);

      parts.push(r);
    } else {
      const d = new M.Dot({
        point: p,
        radius,
        color
      });

      d.setFill(color, 1);

      parts.push(d);
    }

    if (hasPass) {
      const ring = new M.Circle({
        radius: radius * 1.85,
        color: C.amber,
        strokeWidth: 2.5
      });

      ring.setFill(C.amber, 0);
      ring.moveTo(p);

      parts.push(ring);
    }

    return new M.VGroup(...parts);
  }

  function outlineDot(
    p,
    color = C.green,
    radius = 0.25
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  // ------------------------------------------------------------
  // Small house, workplace and pass icons
  // ------------------------------------------------------------

  function houseIcon(p, color = C.cyan) {
    const [x, y] = p;

    const body = rect(
      at(x, y - 0.13),
      0.90,
      0.72,
      color,
      0.96,
      1.8
    );

    const roof1 = line(
      at(x - 0.56, y + 0.22),
      at(x, y + 0.69),
      color,
      2.8
    );

    const roof2 = line(
      at(x, y + 0.69),
      at(x + 0.56, y + 0.22),
      color,
      2.8
    );

    const door = rect(
      at(x, y - 0.30),
      0.23,
      0.36,
      color,
      0.92,
      1.2
    );

    return new M.VGroup(
      body,
      roof1,
      roof2,
      door
    );
  }

  function workplaceIcon(
    p,
    color = C.violet
  ) {
    const [x, y] = p;

    const body = rect(
      p,
      1.0,
      1.35,
      color,
      0.96,
      2
    );

    const windows = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const w = new M.Rectangle({
          width: 0.20,
          height: 0.19,
          color,
          strokeWidth: 1.1
        });

        w.setFill(color, 0.35);

        w.moveTo(at(
          x + (col - 0.5) * 0.39,
          y + 0.36 - row * 0.34
        ));

        windows.push(w);
      }
    }

    return new M.VGroup(
      body,
      ...windows
    );
  }

  function passIcon(
    p,
    label = 'CITY PASS'
  ) {
    const r = rect(
      p,
      1.85,
      0.67,
      C.amber,
      0.96,
      2
    );

    const t = txt(
      label,
      18,
      C.amber,
      p,
      true,
      1.65
    );

    return new M.VGroup(r, t);
  }

  // ------------------------------------------------------------
  // 0-1: introduce the distance-based pass rule
  // ------------------------------------------------------------

  const INTRO_Y = P ? 0.80 : -0.25;

  const home = houseIcon(
    at(CX - 2.20, INTRO_Y),
    C.cyan
  );

  const work = workplaceIcon(
    at(CX + 2.20, INTRO_Y),
    C.violet
  );

  const homeLabel = txt(
    'Home',
    19,
    C.cyan,
    at(
      CX - 2.20,
      INTRO_Y - 0.92
    )
  );

  const workLabel = txt(
    'Work',
    19,
    C.violet,
    at(
      CX + 2.20,
      INTRO_Y - 0.92
    )
  );

  const distanceLine = new M.VGroup(
    line(
      at(CX - 1.45, INTRO_Y),
      at(CX + 1.45, INTRO_Y),
      C.muted,
      3
    ),

    line(
      at(
        CX - 1.45,
        INTRO_Y - 0.12
      ),
      at(
        CX - 1.45,
        INTRO_Y + 0.12
      ),
      C.muted,
      2.5
    ),

    line(
      at(
        CX + 1.45,
        INTRO_Y - 0.12
      ),
      at(
        CX + 1.45,
        INTRO_Y + 0.12
      ),
      C.muted,
      2.5
    )
  );

  const distanceText = txt(
    'Home-to-work distance',
    P ? 18 : 16,
    C.ink,
    at(
      CX,
      INTRO_Y + 0.39
    ),
    false,
    2.75
  );

  const introPass = passIcon(
    at(
      CX,
      INTRO_Y - 0.80
    )
  );

  const introTitle = txt(
    'A DIFFERENT PART OF THE ROLLOUT',
    P ? 19 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const introQuestion = txt(
    'Could the rule help us find the effect?',
    P ? 20 : 18,
    C.amber,
    at(
      CX,
      P ? -1.42 : -2.05
    ),
    false,
    PIC_W
  );

  const introObjects = [
    introTitle,
    home,
    work,
    homeLabel,
    workLabel,
    distanceLine,
    distanceText,
    introPass,
    introQuestion
  ];

  // 0: distance determines whether a commuter receives a pass.
  await until(S(0));
  await play(
    new M.FadeIn(introTitle),

    lagIn(
      [
        home,
        homeLabel,
        work,
        workLabel
      ],
      1.0,
      0.12
    ),

    new M.Create(distanceLine),
    new M.FadeIn(distanceText),
    new M.FadeIn(introPass),

    ...say(
      'DISTANCE FROM HOME TO WORK DECIDES PASS RECEIPT',
      C.green
    )
  );

  // 1: can the rule help estimate the pass effect?
  await until(S(1));
  await play(
    new M.FadeIn(introQuestion),

    ...fbox([
      ['THE QUESTION', C.green],
      'Can a sharp eligibility rule',
      'help us estimate',
      'what the pass itself does?'
    ], C.green),

    ...say(
      'CAN THE RULE HELP US ESTIMATE THE EFFECT?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // Graph construction
  //
  // Horizontal axis: recorded distance in kilometres.
  // Vertical axis: average commute time in minutes.
  //
  // The horizontal scale is deliberately zoomed near 5 km.
  // The vertical scale is labeled and does not start at zero.
  // ------------------------------------------------------------

  function makeXAxis(
    numeric = true
  ) {
    const parts = [];

    const base = line(
      at(X_MIN, Y_MIN),
      at(X_MAX + 0.10, Y_MIN),
      C.muted,
      2
    );

    parts.push(base);

    const ticks = numeric
      ? [4.6, 4.8, 5.0, 5.2, 5.4]
      : [5.0];

    ticks.forEach(d => {
      const x = xDistance(d);

      parts.push(
        line(
          at(x, Y_MIN - 0.065),
          at(x, Y_MIN + 0.065),
          C.muted,
          1.5
        )
      );

      parts.push(
        txt(
          d.toFixed(1),
          P ? 16 : 15,
          d === 5
            ? C.amber
            : C.muted,
          at(x, Y_MIN - 0.25),
          true,
          0.62
        )
      );
    });

    parts.push(
      txt(
        'Distance from home to work (km)',
        P ? 17 : 16,
        C.ink,
        at(CX, Y_MIN - 0.60),
        false,
        PIC_W
      )
    );

    return new M.VGroup(...parts);
  }

  function makeYAxis(
    numeric = true
  ) {
    const parts = [];

    parts.push(
      arrow(
        at(X_MIN, Y_MIN),
        at(X_MIN, Y_MAX + 0.10),
        C.muted,
        2
      )
    );

    if (numeric) {
      const ticks = [
        30,
        34,
        38,
        42,
        46
      ];

      ticks.forEach(m => {
        const y = yMinutes(m);

        parts.push(
          line(
            at(X_MIN - 0.06, y),
            at(X_MIN + 0.06, y),
            C.muted,
            1.2
          )
        );

        parts.push(
          txt(
            String(m),
            P ? 15 : 14,
            C.muted,
            at(X_MIN - 0.25, y),
            true,
            0.40
          )
        );

        parts.push(
          line(
            at(X_MIN + 0.06, y),
            at(X_MAX, y),
            C.muted,
            0.60
          )
        );
      });
    }

    parts.push(
      txt(
        'Average minutes',
        P ? 16 : 15,
        C.muted,
        at(
          X_MIN + 0.87,
          Y_MAX + 0.23
        ),
        false,
        1.95
      )
    );

    return new M.VGroup(...parts);
  }

  function makeCutoff(
    cutoff = 5.0,
    labelText = null
  ) {
    const x = xDistance(cutoff);

    const marker = dashed(
      at(x, Y_MIN + 0.02),
      at(x, Y_MAX + 0.02),
      C.amber,
      3.2
    );

    const label = tag(
      labelText ||
        `${cutoff.toFixed(1)} km`,
      C.amber,
      at(x, Y_MAX + 0.27),
      P ? 16 : 15
    );

    return {
      x,
      cutoff,
      marker,
      label
    };
  }

  function cutoffObjects(c) {
    return [
      c.marker,
      c.label
    ];
  }

  function makeRegions(
    cutoff = 5.0
  ) {
    const x = xDistance(cutoff);

    const leftMid =
      (X_MIN + x) / 2;

    const rightMid =
      (X_MAX + x) / 2;

    const leftW =
      Math.max(0.10, x - X_MIN);

    const rightW =
      Math.max(0.10, X_MAX - x);

    const leftBand = new M.Rectangle({
      width: leftW,
      height: 0.16,
      color: C.violet,
      strokeWidth: 1
    });

    leftBand.setFill(
      C.violet,
      0.40
    );

    leftBand.moveTo(at(
      leftMid,
      REGION_Y - 0.19
    ));

    const rightBand = new M.Rectangle({
      width: rightW,
      height: 0.16,
      color: C.cyan,
      strokeWidth: 1
    });

    rightBand.setFill(
      C.cyan,
      0.40
    );

    rightBand.moveTo(at(
      rightMid,
      REGION_Y - 0.19
    ));

    const left = txt(
      'NO PASS',
      P ? 18 : 16,
      C.violet,
      at(
        leftMid,
        REGION_Y + 0.035
      ),
      true,
      Math.max(0.70, leftW - 0.12)
    );

    const right = txt(
      'PASS',
      P ? 18 : 16,
      C.cyan,
      at(
        rightMid,
        REGION_Y + 0.035
      ),
      true,
      Math.max(0.70, rightW - 0.12)
    );

    return new M.VGroup(
      leftBand,
      rightBand,
      left,
      right
    );
  }

  function observedAverage(d) {
    const p = point(
      d.distance,
      d.minutes
    );

    const side = d.pass ? 1 : -1;

    const color = d.pass
      ? C.cyan
      : C.violet;

    const mob = glowDot(
      p,
      color,
      d.pass
    );

    const value = txt(
      `${d.minutes} min`,
      P ? 19 : 17,
      color,
      at(
        p[0] + side * 0.74,
        p[1] + 0.22
      ),
      true,
      1.30
    );

    const distance = txt(
      `${d.distance.toFixed(1)} km`,
      P ? 16 : 15,
      color,
      at(
        p[0] + side * 0.76,
        p[1] - 0.19
      ),
      true,
      1.35
    );

    const guide = dashed(
      p,
      at(p[0], Y_MIN + 0.05),
      color,
      1.15
    );

    return {
      ...d,
      p,
      color,
      mob,
      value,
      distance,
      guide
    };
  }

  function averageObjects(d) {
    return [
      d.mob,
      d.value,
      d.distance,
      d.guide
    ];
  }

  function revealAverage(d) {
    return [
      new M.Create(d.guide),
      new M.FadeIn(d.mob),
      new M.FadeIn(d.value),
      new M.FadeIn(d.distance)
    ];
  }

  function makeGraph(
    data = DATA,
    heading = 'DISTANCE AND COMMUTE TIME'
  ) {
    return {
      data,

      title: txt(
        heading,
        P ? 19 : 17,
        C.green,
        at(CX, TITLE_Y),
        true,
        PIC_W
      ),

      xaxis: makeXAxis(true),
      yaxis: makeYAxis(true),

      cutoff: makeCutoff(
        data.cutoff
      ),

      regions: makeRegions(
        data.cutoff
      ),

      left: observedAverage(
        data.left
      ),

      right: observedAverage(
        data.right
      )
    };
  }

  function graphObjects(g) {
    return [
      g.title,
      g.xaxis,
      g.yaxis,
      ...cutoffObjects(g.cutoff),
      g.regions,
      ...averageObjects(g.left),
      ...averageObjects(g.right)
    ];
  }

  function revealWholeGraph(g) {
    return [
      new M.FadeIn(g.title),
      new M.FadeIn(g.xaxis),
      new M.FadeIn(g.yaxis),
      new M.Create(g.cutoff.marker),
      new M.FadeIn(g.cutoff.label),
      new M.FadeIn(g.regions),
      ...revealAverage(g.left),
      ...revealAverage(g.right)
    ];
  }

  // ------------------------------------------------------------
  // 2-6: build the axes and eligibility cutoff
  // ------------------------------------------------------------

  let graph = makeGraph();

  // 2: horizontal distance axis.
  await until(S(2));
  await play(
    ...fadeAll(introObjects),
    ...clearBox(),

    new M.FadeIn(graph.title),
    new M.FadeIn(graph.xaxis),

    ...say(
      'DISTANCE IN KILOMETRES ACROSS THE BOTTOM'
    )
  );

  // 3: greater commute times are higher in the picture.
  await until(S(3));
  await play(
    new M.FadeIn(graph.yaxis),

    ...fbox([
      ['VERTICAL AXIS', C.green],
      'Higher = more minutes.',
      'Lower = fewer minutes.'
    ], C.green),

    ...say(
      'MORE MINUTES HIGHER UP'
    )
  );

  // 4: draw the tall marker at exactly five kilometres.
  await until(S(4));
  await play(
    new M.Create(
      graph.cutoff.marker
    ),

    new M.FadeIn(
      graph.cutoff.label
    ),

    ...fbox([
      ['ELIGIBILITY BOUNDARY', C.amber],
      'Distance = 5.0 km'
    ], C.amber),

    ...say(
      'DRAW THE MARKER AT FIVE KILOMETRES',
      C.amber
    )
  );

  // 5: people at five kilometres or more receive a pass.
  await until(S(5));
  await play(
    new M.FadeIn(graph.regions),

    ...fbox([
      ['THE PASS RULE', C.amber],
      ['Below 5 km: no pass', C.violet],
      ['5 km or more: pass', C.cyan],
      'Exactly 5 km qualifies.'
    ], C.amber),

    ...say(
      'FIVE KILOMETRES OR MORE QUALIFIES',
      C.amber
    )
  );

  // 6: name the cutoff.
  const cutoffTag = tag(
    'CUTOFF',
    C.amber,
    P
      ? at(CX, -3.08)
      : at(4.25, 1.13)
  );

  await until(S(6));
  await play(
    new M.FadeIn(cutoffTag),

    ...fbox([
      ['CUTOFF', C.amber],
      'The boundary where',
      'the rule changes.'
    ], C.amber),

    ...say(
      'THIS BOUNDARY IS THE CUTOFF',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 7-12: reveal the two observed nearby group averages
  //
  // Distance position is introduced before commute time.
  // The final dots are placed at the exact recorded averages.
  // ------------------------------------------------------------

  const leftAxisP = at(
    xDistance(DATA.left.distance),
    Y_MIN + 0.07
  );

  const rightAxisP = at(
    xDistance(DATA.right.distance),
    Y_MIN + 0.07
  );

  const leftAxisDot = glowDot(
    leftAxisP,
    C.violet,
    false,
    false,
    0.09
  );

  const rightAxisDot = glowDot(
    rightAxisP,
    C.cyan,
    true,
    false,
    0.09
  );

  const leftAxisLabel = txt(
    '4.9 km',
    P ? 17 : 16,
    C.violet,
    at(
      leftAxisP[0] - 0.48,
      Y_MIN + 0.30
    ),
    true,
    1.15
  );

  const rightAxisLabel = txt(
    '5.1 km',
    P ? 17 : 16,
    C.cyan,
    at(
      rightAxisP[0] + 0.48,
      Y_MIN + 0.30
    ),
    true,
    1.15
  );

  // 7: position the left dot at 4.9 kilometres.
  await until(S(7));
  await play(
    new M.FadeOut(cutoffTag),
    new M.FadeIn(leftAxisDot),
    new M.FadeIn(leftAxisLabel),

    ...fbox([
      ['JUST BELOW THE CUTOFF', C.violet],
      'Distance = 4.9 km'
    ], C.violet),

    ...say(
      'PLACE A DOT AT 4.9 KILOMETRES',
      C.violet
    )
  );

  // 8: the dot represents the nearby no-pass group.
  await until(S(8));
  await play(
    new M.Indicate(
      leftAxisDot,
      { color: C.violet }
    ),

    ...fbox([
      ['4.9 KM', C.violet],
      'Just under 5 km.',
      ['No pass under this rule.', C.violet],
      'The dot represents a group.'
    ], C.violet),

    ...say(
      'JUST BELOW THE CUTOFF: NO PASS',
      C.violet
    )
  );

  // 9: reveal the observed average of 40 minutes.
  await until(S(9));
  await play(
    new M.FadeOut(leftAxisLabel),

    new M.Transform(
      leftAxisDot,
      glowDot(
        graph.left.p,
        C.violet
      ),
      { runTime: 0.85 }
    ),

    new M.Create(graph.left.guide),
    new M.FadeIn(graph.left.value),
    new M.FadeIn(graph.left.distance),

    ...fbox([
      ['OBSERVED LEFT AVERAGE', C.violet],
      'Distance = 4.9 km',
      'No pass',
      ['Average = 40 minutes', C.violet]
    ], C.violet),

    ...say(
      'THEIR AVERAGE COMMUTE IS 40 MINUTES',
      C.violet
    )
  );

  // Preserve the actual on-screen transformed object.
  graph.left.mob = leftAxisDot;

  // 10: position the right dot at 5.1 kilometres.
  await until(S(10));
  await play(
    new M.FadeIn(rightAxisDot),
    new M.FadeIn(rightAxisLabel),

    ...fbox([
      ['JUST ABOVE THE CUTOFF', C.cyan],
      'Distance = 5.1 km'
    ], C.cyan),

    ...say(
      'PLACE A DOT AT 5.1 KILOMETRES',
      C.cyan
    )
  );

  // 11: the right dot represents the nearby pass group.
  await until(S(11));
  await play(
    new M.Indicate(
      rightAxisDot,
      { color: C.amber }
    ),

    ...fbox([
      ['5.1 KM', C.cyan],
      'Just over 5 km.',
      ['Receives a pass.', C.amber],
      'The dot represents a group.'
    ], C.cyan),

    ...say(
      'JUST ABOVE THE CUTOFF: WITH PASS',
      C.cyan
    )
  );

  // 12: reveal the observed average of 34 minutes.
  await until(S(12));
  await play(
    new M.FadeOut(rightAxisLabel),

    new M.Transform(
      rightAxisDot,
      glowDot(
        graph.right.p,
        C.cyan,
        true
      ),
      { runTime: 0.85 }
    ),

    new M.Create(graph.right.guide),
    new M.FadeIn(graph.right.value),
    new M.FadeIn(graph.right.distance),

    ...fbox([
      ['OBSERVED RIGHT AVERAGE', C.cyan],
      'Distance = 5.1 km',
      'With a pass',
      ['Average = 34 minutes', C.cyan]
    ], C.cyan),

    ...say(
      'THEIR AVERAGE COMMUTE IS 34 MINUTES',
      C.cyan
    )
  );

  graph.right.mob = rightAxisDot;

  // ------------------------------------------------------------
  // 13-15: the nearby groups live almost the same distance away
  // ------------------------------------------------------------

  function horizontalBracket(
    x1,
    x2,
    y,
    label,
    color = C.green
  ) {
    const cap = 0.08;

    const a = line(
      at(x1, y),
      at(x2, y),
      color,
      2.5
    );

    const b = line(
      at(x1, y - cap),
      at(x1, y + cap),
      color,
      2.5
    );

    const c = line(
      at(x2, y - cap),
      at(x2, y + cap),
      color,
      2.5
    );

    const t = txt(
      label,
      P ? 17 : 16,
      color,
      at(
        (x1 + x2) / 2,
        y + 0.23
      ),
      true,
      1.55
    );

    return new M.VGroup(
      a,
      b,
      c,
      t
    );
  }

  const nearDistance = horizontalBracket(
    graph.left.p[0],
    graph.right.p[0],
    Y_MIN + 0.25,
    '0.2 km',
    C.green
  );

  const leftNearRing = outlineDot(
    graph.left.p,
    C.green
  );

  const rightNearRing = outlineDot(
    graph.right.p,
    C.green
  );

  // 13: horizontal separation is only 0.2 km.
  await until(S(13));
  await play(
    new M.FadeIn(nearDistance),

    ...fbox([
      ['DISTANCE BETWEEN THE DOTS', C.green],
      '5.1 − 4.9',
      [`= ${DISTANCE_GAP} km`, C.green],
      '= 200 metres'
    ], C.green),

    ...say(
      'ONLY TWO TENTHS OF A KILOMETRE APART',
      C.green
    )
  );

  // 14: the groups live almost the same distance from work.
  await until(S(14));
  await play(
    new M.Create(leftNearRing),
    new M.Create(rightNearRing),

    ...fbox([
      ['NEARBY COMMUTERS', C.green],
      '4.9 km and 5.1 km.',
      'Almost the same distance.',
      'A promising local comparison.'
    ], C.green),

    ...say(
      'ALMOST THE SAME DISTANCE FROM WORK',
      C.green
    )
  );

  // 15: the rule assigns different pass status on either side.
  await until(S(15));
  await play(
    new M.FadeOut(leftNearRing),
    new M.FadeOut(rightNearRing),

    new M.Indicate(
      graph.cutoff.label,
      { color: C.amber }
    ),

    ...fbox([
      ['DIFFERENT PASS STATUS', C.amber],
      ['4.9 km: no pass', C.violet],
      ['5.1 km: pass', C.cyan],
      'The cutoff decides.'
    ], C.amber),

    ...say(
      'WHICH SIDE OF THE LINE DECIDES RECEIPT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 16-17: road analogy
  //
  // A gently sloping road has a sudden step.
  // The gradual slope and the sudden jump are visually distinct.
  //
  // This is an analogy, not a plot of the recorded commute data.
  // ------------------------------------------------------------

  const ROAD_LEFT_X = CX - 2.65;
  const ROAD_RIGHT_X = CX + 2.65;
  const ROAD_STEP_X = CX + 0.05;

  const ROAD_BASE_Y = P ? -0.55 : -1.30;

  const ROAD_A = at(
    ROAD_LEFT_X,
    ROAD_BASE_Y + 1.28
  );

  const ROAD_B = at(
    ROAD_STEP_X,
    ROAD_BASE_Y + 1.79
  );

  const ROAD_C = at(
    ROAD_STEP_X,
    ROAD_BASE_Y + 0.63
  );

  const ROAD_D = at(
    ROAD_RIGHT_X,
    ROAD_BASE_Y + 1.12
  );

  function roadSegment(a, b, color) {
    return new M.VGroup(
      line(
        at(a[0], a[1] - 0.06),
        at(b[0], b[1] - 0.06),
        C.muted,
        10
      ),

      line(
        a,
        b,
        color,
        4.0
      )
    );
  }

  const roadLeft = roadSegment(
    ROAD_A,
    ROAD_B,
    C.violet
  );

  const roadRight = roadSegment(
    ROAD_C,
    ROAD_D,
    C.cyan
  );

  const roadStep = dashed(
    ROAD_B,
    ROAD_C,
    C.amber,
    3.8
  );

  const roadTitle = txt(
    'IMAGINE A GENTLY SLOPING ROAD',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const slopeLabel1 = txt(
    'Gentle slope',
    P ? 18 : 16,
    C.violet,
    at(
      CX - 1.40,
      ROAD_BASE_Y + 1.97
    ),
    false,
    2.25
  );

  const slopeLabel2 = txt(
    'Gentle slope',
    P ? 18 : 16,
    C.cyan,
    at(
      CX + 1.52,
      ROAD_BASE_Y + 0.35
    ),
    false,
    2.25
  );

  const stepLabel = txt(
    'Sudden step',
    P ? 20 : 18,
    C.amber,
    at(
      ROAD_STEP_X + 1.02,
      (
        ROAD_B[1] +
        ROAD_C[1]
      ) / 2
    ),
    false,
    1.70
  );

  const roadAnalogyTag = tag(
    'ANALOGY',
    C.muted,
    at(
      CX,
      P ? -1.42 : -2.22
    )
  );

  const roadObjects = [
    roadTitle,
    roadLeft,
    roadRight,
    roadStep,
    slopeLabel1,
    slopeLabel2,
    stepLabel,
    roadAnalogyTag
  ];

  // 16: introduce a road with a gentle slope and a step.
  await until(S(16));
  await play(
    ...fadeAll([
      ...graphObjects(graph),
      nearDistance
    ]),

    new M.FadeIn(roadTitle),
    new M.FadeIn(roadAnalogyTag),

    new M.Create(roadLeft),
    new M.Create(roadRight),
    new M.FadeIn(slopeLabel1),
    new M.FadeIn(slopeLabel2),

    ...fbox([
      ['A GENTLE SLOPE', C.green],
      'Height changes gradually',
      'as we move along a road.'
    ], C.green),

    ...say(
      'IMAGINE A ROAD WITH A GENTLE SLOPE'
    )
  );

  // 17: highlight the sudden vertical step.
  await until(S(17));
  await play(
    new M.Create(roadStep),
    new M.FadeIn(stepLabel),

    ...fbox([
      ['A SUDDEN STEP', C.amber],
      'The road changes gradually',
      'until the boundary.',
      ['Then its height jumps.', C.amber]
    ], C.amber),

    ...say(
      'THE SUDDEN HEIGHT CHANGE STANDS OUT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // Schematic regression-discontinuity graph
  //
  // No numerical y-axis is supplied here.
  // No additional observed averages are invented.
  //
  // The two schematic trend endpoints approach the SAME
  // distance, exactly 5 km, from opposite sides.
  // ------------------------------------------------------------

  function schematicGraph({
    jump = true,
    heading = 'SCHEMATIC TRENDS',
    note = 'Illustration, not fitted data'
  } = {}) {
    const x = xDistance(5.0);

    const leftStartY = P
      ? 0.56
      : -0.25;

    const leftEndY = P
      ? 1.20
      : 0.33;

    const jumpHeight = P
      ? 1.40
      : 1.08;

    const rightEndY = jump
      ? leftEndY - jumpHeight
      : leftEndY;

    const rightStart = at(
      x + 0.025,
      rightEndY
    );

    const rightFinish = at(
      X_MAX - 0.10,
      rightEndY + (
        jump ? 0.62 : 0.55
      )
    );

    const leftStart = at(
      X_MIN + 0.12,
      leftStartY
    );

    const leftEnd = at(
      x - 0.025,
      leftEndY
    );

    const title = txt(
      heading,
      P ? 20 : 18,
      C.green,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    const disclaimer = txt(
      note,
      P ? 16 : 15,
      C.muted,
      P
        ? at(CX, -3.08)
        : at(4.25, 1.42),
      false,
      P ? PIC_W : 4.55
    );

    const xaxis = makeXAxis(false);
    const yaxis = makeYAxis(false);
    const cutoff = makeCutoff(5.0);

    const leftLine = line(
      leftStart,
      leftEnd,
      C.violet,
      3.5
    );

    const rightLine = line(
      rightStart,
      rightFinish,
      C.cyan,
      3.5
    );

    const leftEndpoint = glowDot(
      at(x, leftEndY),
      C.violet,
      false,
      true,
      0.095
    );

    const rightEndpoint = glowDot(
      at(x, rightEndY),
      C.cyan,
      false,
      true,
      0.095
    );

    const leftLabel = txt(
      'No-pass trend',
      P ? 18 : 16,
      C.violet,
      at(
        (X_MIN + x) / 2,
        leftStartY - 0.38
      ),
      false,
      2.65
    );

    const rightLabel = txt(
      'Pass trend',
      P ? 18 : 16,
      C.cyan,
      at(
        (X_MAX + x) / 2,
        rightFinish[1] - 0.55
      ),
      false,
      2.65
    );

    const jumpLine = dashed(
      at(x, leftEndY),
      at(x, rightEndY),
      C.amber,
      4
    );

    const jumpLabel = txt(
      'Jump?',
      P ? 19 : 17,
      C.amber,
      at(
        x + 0.57,
        (leftEndY + rightEndY) / 2
      ),
      false,
      1.0
    );

    return {
      x,
      leftEndY,
      rightEndY,
      leftStart,
      leftEnd,
      rightStart,
      rightFinish,

      title,
      disclaimer,
      xaxis,
      yaxis,
      cutoff,

      leftLine,
      rightLine,
      leftEndpoint,
      rightEndpoint,
      leftLabel,
      rightLabel,
      jumpLine,
      jumpLabel
    };
  }

  function schematicBaseObjects(g) {
    return [
      g.title,
      g.disclaimer,
      g.xaxis,
      g.yaxis,
      ...cutoffObjects(g.cutoff)
    ];
  }

  function schematicTrendObjects(g) {
    return [
      g.leftLine,
      g.rightLine,
      g.leftLabel,
      g.rightLabel
    ];
  }

  function schematicJumpObjects(g) {
    return [
      g.leftEndpoint,
      g.rightEndpoint,
      g.jumpLine,
      g.jumpLabel
    ];
  }

  function revealSchematicBase(g) {
    return [
      new M.FadeIn(g.title),
      new M.FadeIn(g.disclaimer),
      new M.FadeIn(g.xaxis),
      new M.FadeIn(g.yaxis),
      new M.Create(g.cutoff.marker),
      new M.FadeIn(g.cutoff.label)
    ];
  }

  function revealSchematicTrends(g) {
    return [
      new M.Create(g.leftLine),
      new M.Create(g.rightLine),
      new M.FadeIn(g.leftLabel),
      new M.FadeIn(g.rightLabel)
    ];
  }

  function revealSchematicJump(g) {
    return [
      new M.FadeIn(g.leftEndpoint),
      new M.FadeIn(g.rightEndpoint),
      new M.Create(g.jumpLine),
      new M.FadeIn(g.jumpLabel)
    ];
  }

  // ------------------------------------------------------------
  // 18-22: translate the road analogy into regression discontinuity
  // ------------------------------------------------------------

  let schematic = schematicGraph({
    heading: 'SLOPE AND POSSIBLE JUMP'
  });

  // 18: the gentle slope represents how average times change
  // gradually as distance changes.
  await until(S(18));
  await play(
    ...fadeAll(roadObjects),

    ...revealSchematicBase(
      schematic
    ),

    ...revealSchematicTrends(
      schematic
    ),

    ...fbox([
      ['GENTLE SLOPE', C.green],
      'Average commute time can',
      'change gradually with',
      'distance from work.'
    ], C.green),

    ...say(
      'AVERAGE MINUTES MAY CHANGE GRADUALLY WITH DISTANCE',
      C.green
    )
  );

  // 19: the possible step is a jump right at the rule boundary.
  await until(S(19));
  await play(
    ...revealSchematicJump(
      schematic
    ),

    ...fbox([
      ['POSSIBLE STEP', C.amber],
      'A sudden change in',
      'average commute time',
      ['at exactly 5 km.', C.amber]
    ], C.amber),

    ...say(
      'LOOK FOR A JUMP RIGHT AT THE CUTOFF',
      C.amber
    )
  );

  // 20: name regression discontinuity.
  const rdTitle = txt(
    'REGRESSION DISCONTINUITY',
    P ? 21 : 19,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  await until(S(20));
  await play(
    new M.FadeOut(schematic.title),
    new M.FadeIn(rdTitle),

    ...fbox([
      ['REGRESSION DISCONTINUITY', C.green],
      'Look for a sudden jump',
      'where a rule changes.'
    ], C.green),

    ...say(
      'THIS IS REGRESSION DISCONTINUITY',
      C.green
    )
  );

  schematic.title = rdTitle;

  // 21: regression describes the average pattern.
  await until(S(21));
  await play(
    new M.Indicate(
      schematic.leftLine,
      { color: C.violet }
    ),

    new M.Indicate(
      schematic.rightLine,
      { color: C.cyan }
    ),

    ...fbox([
      ['REGRESSION', C.green],
      'Trace the average time',
      'as distance changes.',
      'Follow the pattern.'
    ], C.green),

    ...say(
      'REGRESSION = TRACE THE AVERAGE PATTERN',
      C.green
    )
  );

  // 22: discontinuity means a sudden jump.
  await until(S(22));
  await play(
    new M.Indicate(
      schematic.jumpLine,
      { color: C.amber }
    ),

    ...fbox([
      ['DISCONTINUITY', C.amber],
      'A break or sudden jump',
      'in that average pattern.',
      ['Here: at the cutoff.', C.amber]
    ], C.amber),

    ...say(
      'DISCONTINUITY = A SUDDEN JUMP',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 23-26: calculate the rough nearby-bin contrast
  //
  // Actual recorded averages:
  // 4.9 km = 40 minutes.
  // 5.1 km = 34 minutes.
  //
  // The rough gap compares two different distances.
  // It is not automatically the exact discontinuity.
  // ------------------------------------------------------------

  graph = makeGraph();

  function verticalBracket(
    y1,
    y2,
    x,
    label,
    color = C.amber,
    labelSide = 'right'
  ) {
    const top = Math.max(
      y1,
      y2
    );

    const bottom = Math.min(
      y1,
      y2
    );

    const cap = 0.09;

    const a = line(
      at(x, bottom),
      at(x, top),
      color,
      2.7
    );

    const b = line(
      at(x - cap, top),
      at(x + cap, top),
      color,
      2.5
    );

    const c = line(
      at(x - cap, bottom),
      at(x + cap, bottom),
      color,
      2.5
    );

    const offset =
      labelSide === 'right'
        ? 0.48
        : -0.48;

    const t = txt(
      label,
      P ? 18 : 16,
      color,
      at(
        x + offset,
        (top + bottom) / 2
      ),
      true,
      0.95
    );

    return new M.VGroup(
      a,
      b,
      c,
      t
    );
  }

  const GAP_X = CX + 2.43;

  function makeNearbyGap(g) {
    const leftY = g.left.p[1];
    const rightY = g.right.p[1];

    const gap =
      g.data.right.minutes -
      g.data.left.minutes;

    return {
      topGuide: dashed(
        g.left.p,
        at(GAP_X, leftY),
        C.violet,
        1.3
      ),

      bottomGuide: dashed(
        g.right.p,
        at(GAP_X, rightY),
        C.cyan,
        1.3
      ),

      bracket: verticalBracket(
        leftY,
        rightY,
        GAP_X,
        signed(gap),
        C.amber
      )
    };
  }

  function gapObjects(gap) {
    return [
      gap.topGuide,
      gap.bottomGuide,
      gap.bracket
    ];
  }

  function revealNearbyGap(gap) {
    return [
      new M.Create(gap.topGuide),
      new M.Create(gap.bottomGuide),
      new M.FadeIn(gap.bracket)
    ];
  }

  let nearbyGap = makeNearbyGap(graph);

  const roughTag = tag(
    'ROUGH NEARBY GAP',
    C.amber,
    P
      ? at(CX, -3.08)
      : at(4.25, 1.14)
  );

  // 23: return to the two actual nearby observations.
  await until(S(23));
  await play(
    ...fadeAll([
      ...schematicBaseObjects(schematic),
      ...schematicTrendObjects(schematic),
      ...schematicJumpObjects(schematic)
    ]),

    ...revealWholeGraph(graph),

    new M.FadeIn(roughTag),

    ...fbox([
      ['FIRST: A ROUGH COMPARISON', C.amber],
      ['Left: 40 minutes', C.violet],
      ['Right: 34 minutes', C.cyan],
      'Two nearby recorded averages.'
    ], C.amber),

    ...say(
      'START WITH THE TWO NEARBY DOTS',
      C.amber
    )
  );

  // 24: subtract the left average from the right average.
  await until(S(24));
  await play(
    ...revealNearbyGap(nearbyGap),

    ...fbox([
      ['ROUGH NEARBY GAP', C.amber],
      'Right − Left',
      '34 − 40',
      [`= ${signed(ROUGH_GAP)} minutes`, C.amber]
    ], C.amber),

    ...say(
      '34 MINUS 40 EQUALS NEGATIVE 6',
      C.amber
    )
  );

  // 25: the negative sign means the right dot is lower.
  await until(S(25));
  await play(
    new M.Indicate(
      nearbyGap.bracket,
      { color: C.amber }
    ),

    new M.Indicate(
      graph.right.mob,
      { color: C.cyan }
    ),

    ...fbox([
      ['INTERPRET THE SIGN', C.green],
      'The right dot is',
      ['6 minutes lower.', C.cyan],
      'That is the observed gap.'
    ], C.green),

    ...say(
      'THE RIGHT DOT IS SIX MINUTES LOWER',
      C.green
    )
  );

  // 26: the two observations are separated by 0.2 km.
  // A smooth underlying slope may contribute to this contrast.
  //
  // No numerical adjustment is made because the underlying
  // slopes are not supplied by the fixed data.

  const roughDistance = horizontalBracket(
    graph.left.p[0],
    graph.right.p[0],
    Y_MIN + 0.25,
    '0.2 km',
    C.green
  );

  await until(S(26));
  await play(
    new M.FadeIn(roughDistance),

    ...fbox([
      ['NOT EXACTLY THE CUTOFF', C.amber],
      'The dots are 0.2 km apart.',
      'The underlying slope may',
      'contribute to their gap.',
      ['−6 is a rough contrast.', C.amber]
    ], C.amber),

    ...say(
      'THE GENTLE SLOPE MAY CONTRIBUTE TO THE GAP',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 27-29: target the jump at exactly the cutoff
  //
  // Return to a schematic picture with no numerical y-axis.
  // The endpoints represent limits approached from each side,
  // not two observed outcomes at the cutoff.
  // ------------------------------------------------------------

  schematic = schematicGraph({
    heading: 'AIM FOR THE JUMP AT 5 KM',
    note: 'Schematic only: more records needed'
  });

  const sameDistanceTag = tag(
    'SAME CUTOFF DISTANCE',
    C.green,
    P
      ? at(CX, -2.95)
      : at(4.25, -1.85),
    P ? 16 : 15
  );

  // 27: the target is the discontinuity at five kilometres.
  await until(S(27));
  await play(
    ...fadeAll([
      ...graphObjects(graph),
      ...gapObjects(nearbyGap),
      roughDistance,
      roughTag
    ]),

    ...revealSchematicBase(schematic),

    ...fbox([
      ['THE DESIGN’S TARGET', C.green],
      'Compare average times',
      'right at the cutoff.',
      ['At the same distance: 5 km.', C.green]
    ], C.green),

    ...say(
      'AIM FOR THE GAP RIGHT AT THE CUTOFF',
      C.green
    )
  );

  // 28: trace the two trends toward the cutoff.
  //
  // The two lines are conceptual, not fitted to the two
  // recorded averages. More observations would be needed.

  const leftApproach = arrow(
    at(
      schematic.x - 1.65,
      schematic.leftEndY + 0.36
    ),

    at(
      schematic.x - 0.17,
      schematic.leftEndY + 0.06
    ),

    C.violet,
    2.3
  );

  const rightApproach = arrow(
    at(
      schematic.x + 1.65,
      schematic.rightEndY - 0.34
    ),

    at(
      schematic.x + 0.17,
      schematic.rightEndY - 0.06
    ),

    C.cyan,
    2.3
  );

  await until(S(28));
  await play(
    ...revealSchematicTrends(
      schematic
    ),

    new M.FadeIn(leftApproach),
    new M.FadeIn(rightApproach),

    ...revealSchematicJump(
      schematic
    ),

    ...fbox([
      ['WITH MORE RECORDS', C.green],
      'Trace the average on',
      'each side toward 5 km.',
      'Compare where they arrive.',
      ['Do not assume a −6 jump.', C.amber]
    ], C.green),

    ...say(
      'TRACE BOTH TRENDS TOWARD THE CUTOFF',
      C.green
    )
  );

  // 29: the design estimates an effect near the threshold.
  await until(S(29));
  await play(
    new M.FadeOut(leftApproach),
    new M.FadeOut(rightApproach),

    new M.FadeIn(sameDistanceTag),

    new M.Indicate(
      schematic.leftEndpoint,
      { color: C.green }
    ),

    new M.Indicate(
      schematic.rightEndpoint,
      { color: C.green }
    ),

    ...fbox([
      ['LOCAL EFFECT', C.green],
      'Estimate the pass effect',
      'for commuters near 5 km.',
      'Not automatically for',
      'every commuter in the city.'
    ], C.green),

    ...say(
      'ESTIMATE THE EFFECT NEAR FIVE KILOMETRES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 30: introduce the conditions for a causal interpretation
  // ------------------------------------------------------------

  function conditionCard(
    index,
    heading,
    subtitle,
    p,
    color
  ) {
    const r = rect(
      p,
      PIC_W - 0.25,
      P ? 0.97 : 0.85,
      color,
      0.96,
      1.8
    );

    const n = txt(
      String(index),
      P ? 22 : 20,
      color,
      at(
        p[0] - 2.80,
        p[1]
      ),
      true
    );

    const a = txt(
      heading,
      P ? 20 : 18,
      color,
      at(
        p[0] + 0.28,
        p[1] + 0.16
      ),
      false,
      5.45
    );

    const b = txt(
      subtitle,
      P ? 16 : 15,
      C.ink,
      at(
        p[0] + 0.28,
        p[1] - 0.20
      ),
      false,
      5.45
    );

    return new M.VGroup(
      r,
      n,
      a,
      b
    );
  }

  const CONDITION_Y = P
    ? [1.62, 0.28, -1.06]
    : [0.52, -0.68, -1.88];

  const conditionsTitle = txt(
    'WHEN CAN WE READ THE JUMP AS AN EFFECT?',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const conditionCards = [
    conditionCard(
      1,
      'Smooth without the pass',
      'No sudden untreated jump at 5 km',
      at(CX, CONDITION_Y[0]),
      C.green
    ),

    conditionCard(
      2,
      'No precise sorting',
      'People cannot manipulate the cutoff',
      at(CX, CONDITION_Y[1]),
      C.cyan
    ),

    conditionCard(
      3,
      'No other sudden change',
      'Only the pass changes at that boundary',
      at(CX, CONDITION_Y[2]),
      C.amber
    )
  ];

  await until(S(30));
  await play(
    ...fadeAll([
      ...schematicBaseObjects(schematic),
      ...schematicTrendObjects(schematic),
      ...schematicJumpObjects(schematic),
      sameDistanceTag
    ]),

    new M.FadeIn(conditionsTitle),

    lagIn(
      conditionCards,
      1.0,
      0.15
    ),

    ...fbox([
      ['THREE CONDITIONS', C.green],
      'Smooth untreated times.',
      'No precise sorting.',
      'No other cutoff change.'
    ], C.green),

    ...say(
      'A CAUSAL READING NEEDS CONDITIONS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 31: untreated average outcomes must be smooth
  //
  // This condition concerns what would happen without the pass.
  // It is an assumption, not an observed counterfactual trend.
  // ------------------------------------------------------------

  const smoothGraph = schematicGraph({
    jump: false,
    heading: 'WITHOUT THE PASS',
    note: 'Assumed untreated pattern'
  });

  const smoothLine = line(
    smoothGraph.leftStart,
    smoothGraph.rightFinish,
    C.green,
    3.5
  );

  const smoothAtCutoff = glowDot(
    at(
      smoothGraph.x,
      smoothGraph.leftEndY
    ),
    C.green,
    false,
    true,
    0.10
  );

  const smoothNote = txt(
    'No sudden change at 5 km',
    P ? 19 : 17,
    C.green,
    at(
      CX,
      P ? -0.60 : -1.22
    ),
    false,
    PIC_W
  );

  await until(S(31));
  await play(
    ...fadeAll([
      conditionsTitle,
      ...conditionCards
    ]),

    ...revealSchematicBase(
      smoothGraph
    ),

    new M.Create(smoothLine),
    new M.FadeIn(smoothAtCutoff),
    new M.FadeIn(smoothNote),

    ...fbox([
      ['CONDITION 1', C.green],
      'Without the pass,',
      'average commute times',
      'must change smoothly',
      ['through 5 km.', C.green]
    ], C.green),

    ...say(
      'WITHOUT THE PASS, TIMES MUST BE SMOOTH AT 5 KM',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 32-33: no precise sorting around the cutoff
  //
  // Illustrate why the rule should not let people deliberately
  // alter their recorded position just enough to qualify.
  //
  // These distance cards are hypothetical, not actual records.
  // ------------------------------------------------------------

  const SORT_Y = P ? 0.42 : -0.62;

  const SORT_X1 = CX - 2.60;
  const SORT_X2 = CX + 2.60;
  const SORT_CUTOFF = CX;

  const sortAxis = line(
    at(SORT_X1, SORT_Y),
    at(SORT_X2, SORT_Y),
    C.muted,
    3
  );

  const sortCutoff = dashed(
    at(
      SORT_CUTOFF,
      SORT_Y - 0.65
    ),

    at(
      SORT_CUTOFF,
      SORT_Y + 1.38
    ),

    C.amber,
    3
  );

  const sortCutoffLabel = txt(
    '5 km',
    20,
    C.amber,
    at(
      SORT_CUTOFF,
      SORT_Y + 1.65
    ),
    true
  );

  const sortNoLabel = txt(
    'No pass',
    19,
    C.violet,
    at(
      CX - 1.68,
      SORT_Y - 0.52
    )
  );

  const sortYesLabel = txt(
    'Pass',
    19,
    C.cyan,
    at(
      CX + 1.68,
      SORT_Y - 0.52
    )
  );

  const sortPeople = [
    -2.0,
    -1.35,
    -0.75,
    0.75,
    1.35,
    2.0
  ].map(dx =>
    glowDot(
      at(CX + dx, SORT_Y),
      dx < 0 ? C.violet : C.cyan,
      dx > 0
    )
  );

  const sortTitle = txt(
    'PEOPLE MUST NOT CHOOSE THEIR SIDE',
    P ? 19 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const sortObjects = [
    sortTitle,
    sortAxis,
    sortCutoff,
    sortCutoffLabel,
    sortNoLabel,
    sortYesLabel,
    ...sortPeople
  ];

  // 32: show people located on both sides of the eligibility rule.
  await until(S(32));
  await play(
    ...fadeAll([
      ...schematicBaseObjects(
        smoothGraph
      ),
      smoothLine,
      smoothAtCutoff,
      smoothNote
    ]),

    new M.FadeIn(sortTitle),
    new M.Create(sortAxis),
    new M.Create(sortCutoff),
    new M.FadeIn(sortCutoffLabel),

    new M.FadeIn(sortNoLabel),
    new M.FadeIn(sortYesLabel),

    lagIn(
      sortPeople,
      0.95,
      0.10
    ),

    ...fbox([
      ['CONDITION 2', C.cyan],
      'People must not precisely',
      'choose which side of',
      'the cutoff they land on.'
    ], C.cyan),

    ...say(
      'NO PRECISE SORTING AROUND THE CUTOFF',
      C.cyan
    )
  );

  // 33: show a hypothetical attempt to round distance upward.
  //
  // Do not change the original 4.9 km or 5.1 km observations.

  const roundFrom = at(
    CX - 0.82,
    SORT_Y + 0.70
  );

  const roundTo = at(
    CX + 0.82,
    SORT_Y + 0.70
  );

  const roundLeft = tag(
    '4.98 km',
    C.violet,
    roundFrom,
    P ? 16 : 15
  );

  const roundRight = tag(
    '5.00 km?',
    C.amber,
    roundTo,
    P ? 16 : 15
  );

  const roundArrow = arrow(
    at(
      roundFrom[0] + 0.58,
      roundFrom[1]
    ),

    at(
      roundTo[0] - 0.58,
      roundTo[1]
    ),

    C.amber,
    2.7
  );

  const noManipulation = cross(
    at(
      CX,
      SORT_Y + 0.70
    ),
    C.amber,
    0.18
  );

  const roundingNote = txt(
    'Hypothetical manipulation',
    P ? 16 : 15,
    C.amber,
    at(
      CX,
      P ? -1.20 : -2.02
    ),
    false,
    PIC_W
  );

  await until(S(33));
  await play(
    new M.FadeIn(roundLeft),
    new M.FadeIn(roundRight),
    new M.FadeIn(roundArrow),
    new M.FadeIn(noManipulation),
    new M.FadeIn(roundingNote),

    ...fbox([
      ['EXAMPLE: ROUNDING UP', C.amber],
      'A person just below 5 km',
      'must not be able to report',
      '5 km just to qualify.',
      ['That could distort comparison.', C.amber]
    ], C.amber),

    ...say(
      'PEOPLE MUST NOT MANIPULATE RECORDED DISTANCE',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 34-35: another benefit at the same cutoff
  //
  // Hypothetical example: free parking also begins at 5 km.
  //
  // Do not assign a numerical effect to the extra benefit.
  // A jump could then reflect the combined policy package,
  // not the pass alone.
  // ------------------------------------------------------------

  const PERK_Y = P ? 1.30 : 0.42;

  const passBenefit = passIcon(
    at(
      CX - 1.65,
      PERK_Y
    )
  );

  function parkingIcon(p) {
    const r = rect(
      p,
      1.85,
      0.67,
      C.violet,
      0.96,
      2
    );

    const t = txt(
      'FREE PARKING',
      P ? 17 : 16,
      C.violet,
      p,
      true,
      1.65
    );

    return new M.VGroup(
      r,
      t
    );
  }

  const parkingBenefit = parkingIcon(
    at(
      CX + 1.65,
      PERK_Y
    )
  );

  const perkCutoff = rect(
    at(
      CX,
      PERK_Y - 1.15
    ),
    3.10,
    0.65,
    C.amber,
    0.96,
    2
  );

  const perkCutoffText = txt(
    'STARTS AT 5 KM',
    19,
    C.amber,
    at(
      CX,
      PERK_Y - 1.15
    ),
    true,
    2.85
  );

  const benefitA1 = arrow(
    at(
      CX - 1.65,
      PERK_Y - 0.40
    ),

    at(
      CX - 0.65,
      PERK_Y - 0.77
    ),

    C.amber,
    2.6
  );

  const benefitA2 = arrow(
    at(
      CX + 1.65,
      PERK_Y - 0.40
    ),

    at(
      CX + 0.65,
      PERK_Y - 0.77
    ),

    C.violet,
    2.6
  );

  const perkTitle = txt(
    'TWO BENEFITS AT THE SAME BOUNDARY?',
    P ? 19 : 18,
    C.amber,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const perkHypothetical = tag(
    'HYPOTHETICAL EXAMPLE',
    C.muted,
    at(
      CX,
      P ? -1.45 : -2.40
    ),
    P ? 17 : 15
  );

  const perkObjects = [
    perkTitle,
    passBenefit,
    parkingBenefit,
    perkCutoff,
    perkCutoffText,
    benefitA1,
    benefitA2,
    perkHypothetical
  ];

  // 34: another perk might begin at exactly the same threshold.
  await until(S(34));
  await play(
    ...fadeAll([
      ...sortObjects,
      roundLeft,
      roundRight,
      roundArrow,
      noManipulation,
      roundingNote
    ]),

    new M.FadeIn(perkTitle),
    new M.FadeIn(perkHypothetical),

    lagIn(
      [
        passBenefit,
        parkingBenefit
      ],
      0.95,
      0.20
    ),

    new M.FadeIn(perkCutoff),
    new M.FadeIn(perkCutoffText),

    new M.FadeIn(benefitA1),
    new M.FadeIn(benefitA2),

    ...fbox([
      ['COMMON TRAP', C.amber],
      'Another benefit starts',
      'at the same cutoff.',
      'For example:',
      ['Free parking at 5 km.', C.violet]
    ], C.amber),

    ...say(
      'WHAT ELSE CHANGES AT FIVE KILOMETRES?',
      C.amber
    )
  );

  // 35: the discontinuity could mix the effects of both benefits.

  const mixedPerkNote = txt(
    'One jump may include both benefits.',
    P ? 20 : 18,
    C.amber,
    at(
      CX,
      P ? -0.72 : -1.80
    ),
    false,
    PIC_W
  );

  await until(S(35));
  await play(
    new M.Indicate(
      passBenefit,
      { color: C.amber }
    ),

    new M.Indicate(
      parkingBenefit,
      { color: C.violet }
    ),

    new M.FadeIn(mixedPerkNote),

    ...fbox([
      ['CONDITION 3', C.amber],
      'No other outcome-changing',
      'benefit should jump there.',
      ['Otherwise the step can mix', C.amber],
      ['the pass and parking effects.', C.amber]
    ], C.amber),

    ...say(
      'THE STEP WOULD MIX BOTH BENEFITS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 36: regression discontinuity is useful for sharp rules
  // ------------------------------------------------------------

  graph = makeGraph();

  const localLeft = outlineDot(
    graph.left.p,
    C.green
  );

  const localRight = outlineDot(
    graph.right.p,
    C.green
  );

  const localTag = tag(
    'LOCAL COMPARISON',
    C.green,
    P
      ? at(CX, -3.08)
      : at(4.25, 1.16)
  );

  await until(S(36));
  await play(
    ...fadeAll([
      ...perkObjects,
      mixedPerkNote
    ]),

    ...revealWholeGraph(graph),

    new M.Create(localLeft),
    new M.Create(localRight),
    new M.FadeIn(localTag),

    ...fbox([
      ['USEFUL FOR SHARP RULES', C.green],
      'A clear eligibility line.',
      'Similar people just either side.',
      'Different receipt status.',
      ['Check the conditions.', C.amber]
    ], C.green),

    ...say(
      'COMPARE PEOPLE JUST EITHER SIDE OF A SHARP LINE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 37: preview Try it
  //
  // The narrated preview demonstrates a moving marker using
  // an explicitly hypothetical practice model.
  //
  // Synthetic underlying times:
  //   4.7 km -> 39 min without a pass
  //   4.9 km -> 40 min without a pass
  //   5.1 km -> 42 min without a pass
  //   5.3 km -> 44 min without a pass
  //
  // The practice model subtracts 8 minutes when eligible.
  //
  // At a hypothetical 4.8 km cutoff:
  //   Nearby contrast = 32 - 39 = -7.
  //
  // At a hypothetical 5.0 km cutoff:
  //   Nearby contrast = 34 - 40 = -6.
  //
  // This model is only for demonstrating the moving marker.
  // Its invented 8-minute effect is not a lesson-data estimate.
  // ------------------------------------------------------------

  const PRACTICE = [
    { distance: 4.7, base: 39 },
    { distance: 4.9, base: 40 },
    { distance: 5.1, base: 42 },
    { distance: 5.3, base: 44 }
  ];

  function practiceValues(cutoff) {
    return PRACTICE.map(d => {
      const pass =
        d.distance >= cutoff;

      return {
        distance: d.distance,
        minutes: d.base - (
          pass ? 8 : 0
        ),
        pass,
        color: pass
          ? C.cyan
          : C.violet
      };
    });
  }

  function practicePair(values, cutoff) {
    const left = values
      .filter(d =>
        d.distance < cutoff
      )
      .sort((a, b) =>
        b.distance - a.distance
      )[0];

    const right = values
      .filter(d =>
        d.distance >= cutoff
      )
      .sort((a, b) =>
        a.distance - b.distance
      )[0];

    return {
      left,
      right,
      gap: left && right
        ? right.minutes - left.minutes
        : null
    };
  }

  function practicePoint(d) {
    const p = point(
      d.distance,
      d.minutes
    );

    const mob = glowDot(
      p,
      d.color,
      d.pass,
      false,
      0.095
    );

    const label = txt(
      `${d.minutes}`,
      P ? 17 : 15,
      d.color,
      at(
        p[0],
        p[1] + 0.28
      ),
      true,
      0.65
    );

    return {
      ...d,
      p,
      mob,
      label
    };
  }

  function makePracticeBoard(cutoff) {
    const values =
      practiceValues(cutoff);

    return {
      cutoff,
      values,

      title: txt(
        'TRY IT • IMAGINED PRACTICE MODEL',
        P ? 18 : 17,
        C.green,
        at(CX, TITLE_Y),
        true,
        PIC_W
      ),

      xaxis: makeXAxis(true),
      yaxis: makeYAxis(true),

      marker: makeCutoff(cutoff),
      regions: makeRegions(cutoff),

      dots: values.map(
        practicePoint
      )
    };
  }

  function practiceObjects(b) {
    return [
      b.title,
      b.xaxis,
      b.yaxis,

      ...cutoffObjects(
        b.marker
      ),

      b.regions,

      ...b.dots.flatMap(d => [
        d.mob,
        d.label
      ])
    ];
  }

  function revealPractice(b) {
    return [
      new M.FadeIn(b.title),
      new M.FadeIn(b.xaxis),
      new M.FadeIn(b.yaxis),

      new M.Create(
        b.marker.marker
      ),

      new M.FadeIn(
        b.marker.label
      ),

      new M.FadeIn(
        b.regions
      ),

      lagIn(
        b.dots.flatMap(d => [
          d.mob,
          d.label
        ]),
        0.95,
        0.06
      )
    ];
  }

  function practiceResultBox(b) {
    const r = practicePair(
      b.values,
      b.cutoff
    );

    return fbox([
      ['IMAGINED PRACTICE MODEL', C.green],
      `Cutoff = ${b.cutoff.toFixed(1)} km`,
      [
        `Left: ${r.left.minutes} min`,
        C.violet
      ],
      [
        `Right: ${r.right.minutes} min`,
        C.cyan
      ],
      [
        `Nearby gap = ${signed(r.gap)} min`,
        C.amber
      ]
    ], C.green);
  }

  const practiceA = makePracticeBoard(4.8);

  const practiceNote = txt(
    'Practice only: the model updates eligibility.',
    P ? 16 : 15,
    C.muted,
    P
      ? at(CX, -3.08)
      : at(4.25, -1.85),
    false,
    P ? PIC_W : 4.55
  );

  await until(S(37));
  await play(
    ...fadeAll([
      ...graphObjects(graph),
      localLeft,
      localRight,
      localTag
    ]),

    ...revealPractice(practiceA),

    new M.FadeIn(practiceNote),

    ...practiceResultBox(practiceA),

    ...say(
      'TRY IT: DRAG THE CUTOFF MARKER',
      C.green
    )
  );

  const practiceB = makePracticeBoard(5.0);

  // Demonstrate the marker moving and nearby values updating.
  // All animations belong to one awaited play call.
  // No concurrent play calls are made.

  await play(
    new M.Transform(
      practiceA.marker.marker,
      practiceB.marker.marker,
      { runTime: 0.90 }
    ),

    new M.FadeOut(
      practiceA.marker.label
    ),

    new M.FadeIn(
      practiceB.marker.label
    ),

    new M.FadeOut(
      practiceA.regions
    ),

    new M.FadeIn(
      practiceB.regions
    ),

    ...practiceA.dots.map((d, i) =>
      new M.Transform(
        d.mob,
        practiceB.dots[i].mob,
        { runTime: 0.90 }
      )
    ),

    ...fadeAll(
      practiceA.dots.map(d =>
        d.label
      )
    ),

    ...practiceB.dots.map(d =>
      new M.FadeIn(d.label)
    ),

    ...practiceResultBox(practiceB)
  );

  // Retain the transformed on-screen object identities.

  practiceB.marker.marker =
    practiceA.marker.marker;

  practiceB.dots.forEach((d, i) => {
    d.mob = practiceA.dots[i].mob;
  });

  practiceB.title = practiceA.title;
  practiceB.xaxis = practiceA.xaxis;
  practiceB.yaxis = practiceA.yaxis;

  // ------------------------------------------------------------
  // 38: challenge — find the rough gap at the original cutoff
  //
  // Restore the exact recorded chapter illustration.
  // The synthetic practice model is discarded.
  // ------------------------------------------------------------

  graph = makeGraph(
    DATA,
    'TRY IT • ORIGINAL LESSON DATA'
  );

  nearbyGap = makeNearbyGap(graph);

  const originalTag = tag(
    'ORIGINAL DATA',
    C.green,
    P
      ? at(CX, -3.08)
      : at(4.25, 1.15)
  );

  await until(S(38));
  await play(
    ...fadeAll([
      ...practiceObjects(practiceB),
      practiceNote
    ]),

    ...revealWholeGraph(graph),

    ...revealNearbyGap(
      nearbyGap
    ),

    new M.FadeIn(originalTag),

    ...fbox([
      ['CHALLENGE 1', C.green],
      'Cutoff = 5 km.',
      'Right − Left',
      '34 − 40',
      ['Answer: −6 minutes', C.amber],
      'A rough nearby-bin gap.'
    ], C.green),

    ...say(
      'AT FIVE KILOMETRES, FIND THE ROUGH GAP',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 39: switch on a second perk at the same marker
  //
  // The second perk is hypothetical.
  // The original data are not reinterpreted as observed
  // outcomes under a two-benefit program.
  //
  // No numerical effect for parking is fabricated.
  // ------------------------------------------------------------

  schematic = schematicGraph({
    heading: 'TRY IT • A SECOND PERK',
    note: 'Hypothetical two-benefit policy'
  });

  const secondPassTag = tag(
    'PASS: ON',
    C.amber,
    P
      ? at(CX - 1.50, -3.00)
      : at(3.12, -1.86),
    P ? 16 : 15
  );

  const secondParkingTag = tag(
    'PARKING: ON',
    C.violet,
    P
      ? at(CX + 1.50, -3.00)
      : at(5.38, -1.86),
    P ? 16 : 15
  );

  const mixedJumpLabel = txt(
    'Combined jump?',
    P ? 16 : 15,
    C.amber,
    at(
      schematic.x + 0.98,
      (
        schematic.leftEndY +
        schematic.rightEndY
      ) / 2
    ),
    false,
    1.95
  );

  schematic.jumpLabel =
    mixedJumpLabel;

  // Move the schematic disclaimer away from the phone perk tags.
  schematic.disclaimer = txt(
    'Hypothetical: both benefits start at 5 km',
    P ? 15 : 14,
    C.muted,
    P
      ? at(CX, -3.43)
      : at(4.25, 1.17),
    false,
    P ? PIC_W : 4.55
  );

  await until(S(39));
  await play(
    ...fadeAll([
      ...graphObjects(graph),
      ...gapObjects(nearbyGap),
      originalTag
    ]),

    ...revealSchematicBase(
      schematic
    ),

    ...revealSchematicTrends(
      schematic
    ),

    ...revealSchematicJump(
      schematic
    ),

    new M.FadeIn(secondPassTag),
    new M.FadeIn(secondParkingTag),

    ...fbox([
      ['CHALLENGE 2', C.green],
      'Pass and free parking',
      'start at the same cutoff.',
      ['What does the step include?', C.amber],
      'Answer: both policy changes.',
      'Not the pass alone.'
    ], C.amber),

    ...say(
      'SECOND PERK ON: WHAT DOES THE JUMP INCLUDE?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 40: New data preview
  //
  // A separate, explicitly imagined nearby comparison.
  //
  // 4.9 km -> 42 minutes without a pass.
  // 5.1 km -> 37 minutes with a pass.
  //
  // Rough nearby gap = 37 - 42 = -5 minutes.
  //
  // This does not replace the fixed original lesson data.
  // ------------------------------------------------------------

  const FRESH_DATA = {
    cutoff: 5.0,

    left: {
      distance: 4.9,
      minutes: 42,
      pass: false,
      color: C.violet
    },

    right: {
      distance: 5.1,
      minutes: 37,
      pass: true,
      color: C.cyan
    }
  };

  const freshGraph = makeGraph(
    FRESH_DATA,
    'NEW DATA • IMAGINED PRACTICE VALUES'
  );

  const freshGap =
    makeNearbyGap(freshGraph);

  const freshTag = tag(
    'NEW DATA',
    C.green,
    P
      ? at(CX, -3.08)
      : at(4.25, 1.17)
  );

  await until(S(40));
  await play(
    ...fadeAll([
      ...schematicBaseObjects(
        schematic
      ),

      ...schematicTrendObjects(
        schematic
      ),

      ...schematicJumpObjects(
        schematic
      ),

      secondPassTag,
      secondParkingTag
    ]),

    ...revealWholeGraph(
      freshGraph
    ),

    ...revealNearbyGap(
      freshGap
    ),

    new M.FadeIn(freshTag),

    ...fbox([
      ['FRESH IMAGINED EXAMPLE', C.green],
      ['Left: 42 minutes', C.violet],
      ['Right: 37 minutes', C.cyan],
      '37 − 42',
      ['Rough gap = −5 minutes', C.amber],
      'Check the cutoff conditions.'
    ], C.green),

    ...say(
      'NEW DATA: LOOK NEAR THE MARKER AGAIN',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 41: final takeaway
  //
  // Finish on the design's conceptual target:
  // the difference between trends at the same cutoff distance.
  //
  // The formula box preserves the exact original two-dot
  // contrast while clearly distinguishing it from the target
  // discontinuity.
  // ------------------------------------------------------------

  const finalGraph = schematicGraph({
    heading: 'REGRESSION DISCONTINUITY',
    note: 'Schematic trends • no fitted jump'
  });

  const finalLocalTag = tag(
    'EFFECT NEAR THE CUTOFF',
    C.green,
    P
      ? at(CX, -3.40)
      : at(4.25, -1.91),
    P ? 16 : 15
  );

  const finalLeftArrow = arrow(
    at(
      finalGraph.x - 1.45,
      finalGraph.leftEndY + 0.37
    ),

    at(
      finalGraph.x - 0.15,
      finalGraph.leftEndY + 0.06
    ),

    C.violet,
    2.5
  );

  const finalRightArrow = arrow(
    at(
      finalGraph.x + 1.45,
      finalGraph.rightEndY - 0.36
    ),

    at(
      finalGraph.x + 0.15,
      finalGraph.rightEndY - 0.06
    ),

    C.cyan,
    2.5
  );

  await until(S(41));
  await play(
    ...fadeAll([
      ...graphObjects(freshGraph),
      ...gapObjects(freshGap),
      freshTag
    ]),

    ...revealSchematicBase(
      finalGraph
    ),

    ...revealSchematicTrends(
      finalGraph
    ),

    ...revealSchematicJump(
      finalGraph
    ),

    new M.FadeIn(finalLeftArrow),
    new M.FadeIn(finalRightArrow),

    new M.FadeIn(finalLocalTag),

    ...fbox([
      ['REGRESSION DISCONTINUITY', C.green],
      'Compare trends at the cutoff.',
      'Original nearby gap:',
      ['34 − 40 = −6 minutes', C.amber],
      'Exact jump needs more records.',
      ['Estimate the effect nearby.', C.green]
    ], C.green),

    ...say(
      'LOOK FOR A JUMP RIGHT WHERE A RULE CHANGES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Final fixed facts
  // ------------------------------------------------------------
  //
  // Eligibility rule:
  //   Below 5 km: no pass.
  //   At least 5 km: pass.
  //
  // Recorded nearby averages:
  //   4.9 km, no pass: 40 minutes.
  //   5.1 km, pass:    34 minutes.
  //
  // Distance gap:
  //   5.1 - 4.9 = 0.2 km.
  //
  // Rough nearby-bin contrast:
  //   34 - 40 = -6 minutes.
  //
  // The contrast may include the gradual effect of distance
  // because the two averages are taken at different distances.
  //
  // Regression discontinuity instead targets the jump
  // between trends approaching exactly 5 km.
  //
  // A causal reading requires:
  //
  //   1. Untreated average outcomes change smoothly
  //      at the cutoff.
  //
  //   2. People cannot precisely sort or manipulate their
  //      recorded distance around the cutoff.
  //
  //   3. No other relevant benefit or change begins
  //      at the same cutoff.
  //
  // The estimate concerns commuters near the threshold.
  // It does not automatically describe the entire city.
  //
  // The exact cutoff jump is not established by the two
  // supplied nearby averages alone.
}

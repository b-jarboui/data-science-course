// lesson 8.2.8
// Difference in differences: subtract the waiting group's change
// to estimate the extra change at the workplace receiving passes.
//
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Separate rollout illustration, independent of Central/Hill/Depot:
//
// Workplace    Before    After    Observed change
// East           40        30          -10
// West           50        45           -5
//
// East receives passes. West is still waiting.
//
// Under the parallel-trends assumption:
// Imagined East without passes = 40 + (-5) = 35.
// Estimated effect at East = 30 - 35 = -5 minutes.
//
// Equivalently:
// Difference in differences = (-10) - (-5) = -5 minutes.
//
// Try it beats preview the separate interactive exercise.
// The supplied scene API does not specify mouse/touch handlers.
// Any fresh values are explicitly labeled as imagined practice data.
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
    east: {
      name: 'East',
      before: 40,
      after: 30,
      received: true,
      color: C.cyan
    },

    west: {
      name: 'West',
      before: 50,
      after: 45,
      received: false,
      color: C.violet
    }
  };

  const EAST_CHANGE =
    DATA.east.after - DATA.east.before;

  const WEST_CHANGE =
    DATA.west.after - DATA.west.before;

  const IMAGINED_EAST =
    DATA.east.before + WEST_CHANGE;

  const DID =
    EAST_CHANGE - WEST_CHANGE;

  const EXTRA_CHANGE =
    DATA.east.after - IMAGINED_EAST;

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: graph above formula box.
  // Laptop: graph left, formula box right.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.65;
  const PIC_W = P ? 7.10 : 7.10;

  const PILL = P
    ? [0, 3.65, 0]
    : [0, 1.92, 0];

  const BOXP = P
    ? [0, -4.8, 0]
    : [4.25, -0.30, 0];

  const TITLE_Y = P ? 2.95 : 1.50;

  const X_BEFORE = CX - 1.90;
  const X_AFTER = CX + 0.90;

  const AXIS_X = CX - 2.90;
  const AXIS_RIGHT = CX + 3.35;

  const MIN_TIME = 25;
  const MAX_TIME = 55;

  const Y_BOTTOM = P ? -2.20 : -2.22;
  const Y_TOP = P ? 1.95 : 0.85;

  const Y_SCALE =
    (Y_TOP - Y_BOTTOM) /
    (MAX_TIME - MIN_TIME);

  const yTime = value =>
    Y_BOTTOM + (value - MIN_TIME) * Y_SCALE;

  const at = (x, y) => [x, y, 0];

  const point = (when, value) =>
    at(
      when === 'before' ? X_BEFORE : X_AFTER,
      yTime(value)
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
      cornerRadius: 0.13,
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
    stroke = 2.5
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

    const headL = Math.min(0.17, len * 0.35);
    const headW = 0.09;

    const bx = end[0] - ux * headL;
    const by = end[1] - uy * headL;

    return new M.VGroup(
      line(start, end, color, stroke),

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

  function makeTag(
    s,
    color,
    p,
    size = P ? 18 : 16
  ) {
    const tag = pill(s, color, size);
    tag.moveTo(p);
    return tag;
  }

  // ------------------------------------------------------------
  // Formula box
  //
  // Each new formula is grouped before it appears.
  // Existing visible objects are never regrouped.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.40 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
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
      (maxw - 0.64) / Math.max(rawWidth, 0.01)
    );

    texts.forEach(t => {
      if (scale < 1) t.scale(scale);
    });

    const wd = Math.max(
      2.25,
      Math.max(...texts.map(t => t.getWidth())) + 0.64
    );

    const ht = rows.length * lh + 0.38;

    const r = rect(
      BOXP,
      wd,
      ht,
      color,
      0.96,
      2
    );

    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - 0.19 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo(at(
        left + t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(r, ...texts);

    const a = [];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    a.push(new M.FadeIn(g));
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
  // Glowing data points
  //
  // Cyan = East.
  // Violet = West.
  // Green hollow point = imagined East without passes.
  //
  // Observed dots are filled.
  // Imagined dots are hollow and use dashed lines.
  // ------------------------------------------------------------

  function glowDot(
    p,
    color,
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

    if (hollow) {
      const ring = new M.Circle({
        radius: radius * 1.20,
        color,
        strokeWidth: 2.7
      });

      ring.setFill(color, 0);
      ring.moveTo(p);

      return new M.VGroup(
        halo,
        ring
      );
    }

    const dot = new M.Dot({
      point: p,
      radius,
      color
    });

    dot.setFill(color, 1);

    return new M.VGroup(
      halo,
      dot
    );
  }

  function valueLabel(
    when,
    value,
    color,
    offsetY = 0,
    label = null
  ) {
    const p = point(when, value);

    const x = when === 'before'
      ? p[0] - 0.49
      : p[0] + 0.47;

    return txt(
      label || `${value}`,
      P ? 19 : 17,
      color,
      at(x, p[1] + offsetY),
      true,
      0.88
    );
  }

  function observedPoint(
    when,
    value,
    color
  ) {
    return {
      when,
      value,
      color,

      mob: glowDot(
        point(when, value),
        color
      ),

      label: valueLabel(
        when,
        value,
        color
      )
    };
  }

  function pointObjects(d) {
    return [
      d.mob,
      d.label
    ];
  }

  function revealPoint(d) {
    return [
      new M.FadeIn(d.mob),
      new M.FadeIn(d.label)
    ];
  }

  // ------------------------------------------------------------
  // Intro workplace cards
  // ------------------------------------------------------------

  function workplaceCard(
    name,
    subtitle,
    p,
    color,
    received
  ) {
    const w = 3.15;
    const h = P ? 2.30 : 2.04;

    const r = rect(
      p,
      w,
      h,
      color,
      0.96,
      2
    );

    const title = txt(
      name,
      P ? 26 : 24,
      color,
      at(p[0], p[1] + 0.70)
    );

    const ticket = rect(
      at(p[0], p[1] + 0.04),
      1.64,
      0.55,
      received ? C.amber : C.muted,
      received ? 0.95 : 0.25,
      1.8
    );

    const ticketText = txt(
      received ? 'PASS' : 'WAITING',
      18,
      received ? C.amber : C.muted,
      at(p[0], p[1] + 0.04),
      true,
      1.43
    );

    const sub = txt(
      subtitle,
      P ? 17 : 16,
      C.ink,
      at(p[0], p[1] - 0.61),
      false,
      w - 0.25
    );

    return new M.VGroup(
      r,
      title,
      ticket,
      ticketText,
      sub
    );
  }

  const INTRO_Y = P ? 1.05 : -0.18;

  const eastIntro = workplaceCard(
    'East',
    'Gets passes this month',
    at(CX - 1.78, INTRO_Y),
    C.cyan,
    true
  );

  const westIntro = workplaceCard(
    'West',
    'Still waiting',
    at(CX + 1.78, INTRO_Y),
    C.violet,
    false
  );

  const rolloutTitle = txt(
    'A NEW PART OF THE ROLLOUT',
    P ? 20 : 18,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const introQuestion = txt(
    'How much did the pass itself help?',
    P ? 21 : 19,
    C.amber,
    at(
      CX,
      P ? -0.76 : -1.75
    ),
    false,
    PIC_W
  );

  // ------------------------------------------------------------
  // 0-1: introduce the staggered rollout
  // ------------------------------------------------------------

  // 0: East gets passes this month; West is waiting.
  await until(S(0));
  await play(
    new M.FadeIn(rolloutTitle),
    lagIn(
      [eastIntro, westIntro],
      1.05,
      0.20
    ),

    ...say(
      'EAST GETS PASSES • WEST IS WAITING',
      C.green
    )
  );

  // 1: East improves, but what caused the improvement?
  await until(S(1));
  await play(
    new M.FadeIn(introQuestion),

    ...fbox([
      ['THE QUESTION', C.amber],
      'East gets faster.',
      'How much of that saving',
      'came from the pass?'
    ], C.amber),

    ...say(
      'HOW MUCH OF EAST’S SAVING CAME FROM THE PASS?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // Graph construction
  //
  // One common minute axis and two time positions:
  // BEFORE and AFTER.
  //
  // The vertical axis begins at 25 minutes, visibly labeled.
  // Equal vertical distances represent equal changes in minutes.
  // ------------------------------------------------------------

  function makeAxes() {
    const parts = [];

    const vertical = line(
      at(AXIS_X, Y_BOTTOM),
      at(AXIS_X, Y_TOP + 0.10),
      C.muted,
      2
    );

    const horizontal = line(
      at(AXIS_X, Y_BOTTOM),
      at(AXIS_RIGHT, Y_BOTTOM),
      C.muted,
      2
    );

    parts.push(
      vertical,
      horizontal
    );

    for (
      let v = MIN_TIME;
      v <= MAX_TIME;
      v += 5
    ) {
      const y = yTime(v);

      const grid = line(
        at(AXIS_X + 0.05, y),
        at(AXIS_RIGHT, y),
        C.muted,
        v === MIN_TIME ? 1.2 : 0.65
      );

      const tick = line(
        at(AXIS_X - 0.06, y),
        at(AXIS_X + 0.06, y),
        C.muted,
        1.3
      );

      const label = txt(
        String(v),
        P ? 15 : 14,
        C.muted,
        at(AXIS_X - 0.27, y),
        true,
        0.45
      );

      parts.push(
        grid,
        tick,
        label
      );
    }

    const unit = txt(
      'Minutes to work',
      P ? 16 : 15,
      C.muted,
      at(
        CX - 2.10,
        Y_TOP + 0.28
      ),
      false,
      2.40
    );

    const before = txt(
      'BEFORE',
      P ? 18 : 16,
      C.ink,
      at(
        X_BEFORE,
        Y_BOTTOM - 0.30
      ),
      true,
      1.50
    );

    const after = txt(
      'AFTER',
      P ? 18 : 16,
      C.ink,
      at(
        X_AFTER,
        Y_BOTTOM - 0.30
      ),
      true,
      1.50
    );

    parts.push(
      unit,
      before,
      after
    );

    return new M.VGroup(...parts);
  }

  function legendItem(
    label,
    color,
    p,
    imagined = false
  ) {
    const [x, y] = p;

    const sample = imagined
      ? dashed(
          at(x - 0.40, y),
          at(x + 0.10, y),
          color,
          2.6
        )
      : line(
          at(x - 0.40, y),
          at(x + 0.10, y),
          color,
          2.6
        );

    const dot = glowDot(
      at(x - 0.15, y),
      color,
      imagined,
      0.075
    );

    const labelText = txt(
      label,
      P ? 15 : 14,
      color,
      at(x + 1.12, y),
      false,
      1.95
    );

    return new M.VGroup(
      sample,
      dot,
      labelText
    );
  }

  function makeGraph(data = DATA) {
    const eastBefore = observedPoint(
      'before',
      data.east.before,
      C.cyan
    );

    const eastAfter = observedPoint(
      'after',
      data.east.after,
      C.cyan
    );

    const westBefore = observedPoint(
      'before',
      data.west.before,
      C.violet
    );

    const westAfter = observedPoint(
      'after',
      data.west.after,
      C.violet
    );

    const eastLine = line(
      point('before', data.east.before),
      point('after', data.east.after),
      C.cyan,
      3.5
    );

    const westLine = line(
      point('before', data.west.before),
      point('after', data.west.after),
      C.violet,
      3.5
    );

    const title = txt(
      'BEFORE AND AFTER THE ROLLOUT',
      P ? 19 : 17,
      C.green,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    const legendY = P ? 2.48 : 1.12;

    const eastLegend = legendItem(
      'East: gets passes',
      C.cyan,
      at(P ? CX - 2.30 : CX - 0.20, legendY)
    );

    const westLegend = legendItem(
      'West: waiting',
      C.violet,
      at(P ? CX + 0.65 : CX + 2.30, legendY)
    );

    return {
      data,
      axes: makeAxes(),
      title,

      eastBefore,
      eastAfter,
      westBefore,
      westAfter,

      eastLine,
      westLine,

      eastLegend,
      westLegend,

      imagined: null
    };
  }

  function graphObjects(g) {
    return [
      g.axes,
      g.title,

      ...pointObjects(g.eastBefore),
      ...pointObjects(g.eastAfter),
      ...pointObjects(g.westBefore),
      ...pointObjects(g.westAfter),

      g.eastLine,
      g.westLine,

      g.eastLegend,
      g.westLegend,

      ...(g.imagined
        ? [
            g.imagined.mob,
            g.imagined.label,
            g.imagined.line,
            g.imagined.note
          ]
        : [])
    ];
  }

  function revealWholeGraph(g) {
    return [
      new M.FadeIn(g.axes),
      new M.FadeIn(g.title),
      new M.FadeIn(g.eastLegend),
      new M.FadeIn(g.westLegend),

      new M.Create(g.eastLine),
      new M.Create(g.westLine),

      ...revealPoint(g.eastBefore),
      ...revealPoint(g.eastAfter),
      ...revealPoint(g.westBefore),
      ...revealPoint(g.westAfter),

      ...(g.imagined
        ? [
            new M.Create(g.imagined.line),
            new M.FadeIn(g.imagined.mob),
            new M.FadeIn(g.imagined.label),
            new M.FadeIn(g.imagined.note)
          ]
        : [])
    ];
  }

  function changeGraphTitle(
    g,
    s,
    color = C.green
  ) {
    const next = txt(
      s,
      P ? 19 : 17,
      color,
      at(CX, TITLE_Y),
      true,
      PIC_W
    );

    const old = g.title;
    g.title = next;

    return [
      new M.FadeOut(old),
      new M.FadeIn(next)
    ];
  }

  // ------------------------------------------------------------
  // 2-6: build the two observed trends
  // ------------------------------------------------------------

  let graph = makeGraph();

  // 2: draw before and after positions for East.
  await until(S(2));
  await play(
    ...fadeAll([
      eastIntro,
      westIntro,
      rolloutTitle,
      introQuestion
    ]),

    ...clearBox(),

    new M.FadeIn(graph.axes),
    new M.FadeIn(graph.title),
    new M.FadeIn(graph.eastLegend),

    ...say(
      'EAST: BEFORE AND AFTER',
      C.cyan
    )
  );

  // 3: East moves from 40 minutes to 30 minutes.
  await until(S(3));
  await play(
    lagIn(
      pointObjects(graph.eastBefore),
      0.55,
      0.10
    ),

    lagIn(
      pointObjects(graph.eastAfter),
      0.85,
      0.10
    ),

    ...fbox([
      ['EAST • GETS PASSES', C.cyan],
      'Before: 40 minutes',
      'After:  30 minutes'
    ], C.cyan),

    ...say(
      'EAST: 40 MINUTES → 30 MINUTES',
      C.cyan
    )
  );

  // 4: add West to the same graph.
  await until(S(4));
  await play(
    new M.FadeIn(graph.westLegend),

    ...fbox([
      ['WEST • STILL WAITING', C.violet],
      'Use the same time positions.',
      'Use the same minute axis.'
    ], C.violet),

    ...say(
      'ADD WEST’S BEFORE AND AFTER SPOTS',
      C.violet
    )
  );

  // 5: West moves from 50 minutes to 45 minutes.
  await until(S(5));
  await play(
    lagIn(
      pointObjects(graph.westBefore),
      0.55,
      0.10
    ),

    lagIn(
      pointObjects(graph.westAfter),
      0.85,
      0.10
    ),

    ...fbox([
      ['WEST • STILL WAITING', C.violet],
      'Before: 50 minutes',
      'After:  45 minutes'
    ], C.violet),

    ...say(
      'WEST: 50 MINUTES → 45 MINUTES',
      C.violet
    )
  );

  // 6: connect the two observed points for each workplace.
  await until(S(6));
  await play(
    new M.Create(
      graph.eastLine,
      { runTime: 1.0 }
    ),

    new M.Create(
      graph.westLine,
      { runTime: 1.0 }
    ),

    ...fbox([
      ['BOTH COMMUTES GOT SHORTER', C.green],
      ['East: 40 → 30', C.cyan],
      ['West: 50 → 45', C.violet]
    ], C.green),

    ...say(
      'BOTH LINES SLOPE DOWN',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 7-10: West provides a clue about other changes
  // ------------------------------------------------------------

  // 7: even the waiting workplace improved.
  await until(S(7));
  await play(
    new M.Indicate(
      graph.westLine,
      { color: C.violet }
    ),

    new M.Indicate(
      graph.westAfter.mob,
      { color: C.violet }
    ),

    ...fbox([
      ['WEST IMPROVED TOO', C.violet],
      'Still waiting for passes.',
      '50 → 45 minutes.',
      ['Something else may help.', C.amber]
    ], C.violet),

    ...say(
      'WEST GOT FASTER WITHOUT THE NEW PASS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // Small icons for possible city-wide changes.
  //
  // These are explicitly possible explanations,
  // not additional facts about this rollout.
  // ------------------------------------------------------------

  function weatherIcon(p) {
    const [x, y] = p;

    const sun = new M.Circle({
      radius: 0.20,
      color: C.amber,
      strokeWidth: 1.8
    });

    sun.setFill(C.amber, 0.18);
    sun.moveTo(p);

    const rays = [];

    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;

      rays.push(
        line(
          at(
            x + Math.cos(a) * 0.27,
            y + Math.sin(a) * 0.27
          ),

          at(
            x + Math.cos(a) * 0.37,
            y + Math.sin(a) * 0.37
          ),

          C.amber,
          2
        )
      );
    }

    return new M.VGroup(
      sun,
      ...rays
    );
  }

  function roadIcon(p) {
    const [x, y] = p;

    const road = rect(
      p,
      0.78,
      0.47,
      C.muted,
      0.92,
      1.5
    );

    const marks = [];

    for (let i = 0; i < 3; i++) {
      const xx = x + (i - 1) * 0.23;

      marks.push(
        line(
          at(xx - 0.07, y),
          at(xx + 0.07, y),
          C.amber,
          2.1
        )
      );
    }

    return new M.VGroup(
      road,
      ...marks
    );
  }

  const REASON_Y = P ? -0.20 : -1.00;

  const reasonsP = at(
    P ? CX + 2.30 : 4.25,
    P ? REASON_Y : 0.92
  );

  const weather = weatherIcon(
    at(
      reasonsP[0] - 0.55,
      reasonsP[1]
    )
  );

  const road = roadIcon(
    at(
      reasonsP[0] + 0.55,
      reasonsP[1]
    )
  );

  const reasonLabel = txt(
    'Possible reasons',
    P ? 14 : 14,
    C.amber,
    at(
      reasonsP[0],
      reasonsP[1] - 0.48
    ),
    false,
    2.10
  );

  // 8: perhaps weather improved or roadworks ended.
  await until(S(8));
  await play(
    new M.FadeIn(weather),
    new M.FadeIn(road),
    new M.FadeIn(reasonLabel),

    ...fbox([
      ['POSSIBLE CITY-WIDE CHANGES', C.amber],
      'Better weather?',
      'Roadworks finished?',
      'Both places might benefit.'
    ], C.amber),

    ...say(
      'OTHER CHANGES COULD HELP BOTH PLACES',
      C.amber
    )
  );

  // 9: West's change is a clue to East's no-pass change.
  await until(S(9));
  await play(
    ...fadeAll([
      weather,
      road,
      reasonLabel
    ]),

    new M.Indicate(
      graph.westLine,
      { color: C.green }
    ),

    ...fbox([
      ['WEST PROVIDES A CLUE', C.green],
      'How much might East',
      'have improved anyway',
      'without the pass?'
    ], C.green),

    ...say(
      'USE THE WAITING GROUP AS A CLUE',
      C.green
    )
  );

  // 10: define a trend.
  await until(S(10));
  await play(
    new M.Indicate(
      graph.eastLine,
      { color: C.cyan }
    ),

    new M.Indicate(
      graph.westLine,
      { color: C.violet }
    ),

    ...fbox([
      ['TREND', C.green],
      'The direction and size',
      'of a change over time.',
      'Here both trends go down.'
    ], C.green),

    ...say(
      'TREND = DIRECTION AND SIZE OF CHANGE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 11-14: parallel-trends assumption
  //
  // Equal changes do not mean equal starting levels.
  //
  // West starts at 50.
  // East starts at 40.
  //
  // The assumption concerns what EAST WOULD HAVE DONE
  // WITHOUT PASSES, not equality of observed changes.
  // ------------------------------------------------------------

  const parallelPreview = dashed(
    point('before', DATA.east.before),
    point('after', IMAGINED_EAST),
    C.green,
    3.1
  );

  const previewNote = txt(
    'Imagined: no pass',
    P ? 15 : 14,
    C.green,
    at(
      CX - 0.25,
      yTime(38) + 0.30
    ),
    false,
    2.35
  );

  // 11: suppose the two workplaces would have equal drops.
  await until(S(11));
  await play(
    ...fbox([
      ['SUPPOSE NO PASSES', C.green],
      'East would improve',
      'by the same number',
      'of minutes as West.'
    ], C.green),

    ...say(
      'SUPPOSE BOTH WOULD HAVE THE SAME DROP',
      C.green
    )
  );

  // 12: reveal the parallel imagined line.
  await until(S(12));
  await play(
    new M.Create(
      parallelPreview,
      { runTime: 1.15 }
    ),

    new M.FadeIn(previewNote),

    new M.Indicate(
      graph.westLine,
      { color: C.violet }
    ),

    ...fbox([
      ['LIKE PARALLEL TRAIN TRACKS', C.green],
      'Different starting levels.',
      'Same direction.',
      ['Same size of drop.', C.green]
    ], C.green),

    ...say(
      'THE IMAGINED LINES RUN SIDE BY SIDE',
      C.green
    )
  );

  const parallelTag = makeTag(
    'PARALLEL TRENDS',
    C.green,
    P
      ? at(CX, -3.02)
      : at(4.25, 1.15)
  );

  // 13: name the assumption.
  await until(S(13));
  await play(
    new M.FadeIn(parallelTag),

    ...fbox([
      ['PARALLEL-TRENDS ASSUMPTION', C.green],
      'Without passes, East and West',
      'would have changed by',
      'the same number of minutes.'
    ], C.green),

    ...say(
      'THE PARALLEL-TRENDS ASSUMPTION',
      C.green
    )
  );

  // 14: an assumption is something we rely on,
  // but cannot fully check from the observed data.
  await until(S(14));
  await play(
    ...fbox([
      ['ASSUMPTION', C.amber],
      'Something we rely on',
      'but cannot fully check.',
      ['East’s no-pass result', C.green],
      ['is not observed.', C.green]
    ], C.amber),

    ...say(
      'AN ASSUMPTION IS NOT AN OBSERVED FACT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // Change brackets
  //
  // Draw directly from the minute-axis coordinates.
  // Their heights are proportional to changes in minutes.
  // ------------------------------------------------------------

  function changeBracket(
    from,
    to,
    x,
    color,
    label,
    labelSide = 'right'
  ) {
    const top = Math.max(
      yTime(from),
      yTime(to)
    );

    const bottom = Math.min(
      yTime(from),
      yTime(to)
    );

    const cap = 0.085;

    const stem = line(
      at(x, bottom),
      at(x, top),
      color,
      2.5
    );

    const topCap = line(
      at(x - cap, top),
      at(x + cap, top),
      color,
      2.5
    );

    const bottomCap = line(
      at(x - cap, bottom),
      at(x + cap, bottom),
      color,
      2.5
    );

    const offset = labelSide === 'right'
      ? 0.45
      : -0.45;

    const t = txt(
      label,
      P ? 17 : 15,
      color,
      at(
        x + offset,
        (top + bottom) / 2
      ),
      true,
      0.78
    );

    return new M.VGroup(
      stem,
      topCap,
      bottomCap,
      t
    );
  }

  const BRACKET_X = X_AFTER + 1.38;

  // ------------------------------------------------------------
  // 15-16: calculate West's observed change
  //
  // Change = after - before.
  // West = 45 - 50 = -5.
  // ------------------------------------------------------------

  const westDrop = changeBracket(
    DATA.west.before,
    DATA.west.after,
    BRACKET_X,
    C.violet,
    '−5'
  );

  const westTopGuide = dashed(
    point('before', DATA.west.before),
    at(
      BRACKET_X,
      yTime(DATA.west.before)
    ),
    C.violet,
    1.2
  );

  const westBottomGuide = dashed(
    point('after', DATA.west.after),
    at(
      BRACKET_X,
      yTime(DATA.west.after)
    ),
    C.violet,
    1.2
  );

  // 15: read the change as 45 minus 50.
  await until(S(15));
  await play(
    ...fadeAll([
      parallelPreview,
      previewNote,
      parallelTag
    ]),

    new M.Create(westTopGuide),
    new M.Create(westBottomGuide),

    ...fbox([
      ['WEST’S CHANGE', C.violet],
      'After − Before',
      '45 − 50'
    ], C.violet),

    ...say(
      'WEST: AFTER MINUS BEFORE',
      C.violet
    )
  );

  // 16: West's change is negative five.
  await until(S(16));
  await play(
    new M.FadeIn(westDrop),

    ...fbox([
      ['WEST’S CHANGE', C.violet],
      '45 − 50',
      ['= −5 minutes', C.violet],
      'A drop of 5 minutes.'
    ], C.violet),

    ...say(
      '45 − 50 = −5 MINUTES',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 17-20: construct the imagined East no-pass outcome
  //
  // Start at East's observed before value.
  // Apply West's observed change.
  //
  // 40 + (-5) = 35.
  // ------------------------------------------------------------

  function makeImagined(g) {
    const westChange =
      g.data.west.after -
      g.data.west.before;

    const imaginedAfter =
      g.data.east.before +
      westChange;

    return {
      value: imaginedAfter,

      mob: glowDot(
        point(
          'after',
          imaginedAfter
        ),
        C.green,
        true
      ),

      label: valueLabel(
        'after',
        imaginedAfter,
        C.green
      ),

      line: dashed(
        point(
          'before',
          g.data.east.before
        ),

        point(
          'after',
          imaginedAfter
        ),

        C.green,
        3.1
      ),

      note: txt(
        'Imagined without pass',
        P ? 15 : 14,
        C.green,
        at(
          CX - 0.25,

          (
            yTime(g.data.east.before) +
            yTime(imaginedAfter)
          ) / 2 + 0.28
        ),
        false,
        2.80
      )
    };
  }

  graph.imagined = makeImagined(graph);

  const imaginedStart = new M.Circle({
    radius: 0.21,
    color: C.green,
    strokeWidth: 2.6
  });

  imaginedStart.setFill(C.green, 0);

  imaginedStart.moveTo(
    point(
      'before',
      DATA.east.before
    )
  );

  // 17: start the imagined line at East's 40 minutes.
  await until(S(17));
  await play(
    new M.Create(imaginedStart),

    new M.Indicate(
      graph.eastBefore.mob,
      { color: C.green }
    ),

    ...fbox([
      ['IMAGINE EAST WITHOUT PASSES', C.green],
      'Start at East’s',
      ['40 minutes.', C.cyan],
      'Keep the same starting point.'
    ], C.green),

    ...say(
      'START THE IMAGINED LINE AT 40',
      C.green
    )
  );

  // 18: give East the same five-minute drop as West.
  await until(S(18));
  await play(
    new M.Create(
      graph.imagined.line,
      { runTime: 1.10 }
    ),

    new M.Indicate(
      westDrop,
      { color: C.violet }
    ),

    ...fbox([
      ['COPY WEST’S CHANGE', C.green],
      'East starts at 40.',
      ['West drops by 5.', C.violet],
      '40 − 5'
    ], C.green),

    ...say(
      'GIVE EAST THE SAME FIVE-MINUTE DROP',
      C.green
    )
  );

  // 19: the imagined line ends at 35.
  await until(S(19));
  await play(
    new M.FadeIn(
      graph.imagined.mob
    ),

    new M.FadeIn(
      graph.imagined.label
    ),

    ...fbox([
      ['IMAGINED EAST AFTER', C.green],
      '40 + (−5)',
      ['= 35 minutes', C.green]
    ], C.green),

    ...say(
      'THE IMAGINED EAST RESULT IS 35',
      C.green
    )
  );

  // 20: label the imagined value as conditional on the assumption.
  await until(S(20));
  await play(
    new M.FadeOut(imaginedStart),

    new M.FadeIn(
      graph.imagined.note
    ),

    ...fbox([
      ['WITHOUT PASSES', C.green],
      'East would reach 35 minutes',
      'under our assumption.',
      ['This is imagined, not observed.', C.amber]
    ], C.green),

    ...say(
      '35 MINUTES UNDER PARALLEL TRENDS',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 21-22: compare actual East with imagined East
  //
  // Actual: 30.
  // Imagined without pass: 35.
  // Extra change: 30 - 35 = -5.
  // ------------------------------------------------------------

  const effectBracket = changeBracket(
    IMAGINED_EAST,
    DATA.east.after,
    BRACKET_X,
    C.amber,
    '−5'
  );

  const effectTopGuide = dashed(
    point(
      'after',
      IMAGINED_EAST
    ),

    at(
      BRACKET_X,
      yTime(IMAGINED_EAST)
    ),

    C.green,
    1.3
  );

  const effectBottomGuide = dashed(
    point(
      'after',
      DATA.east.after
    ),

    at(
      BRACKET_X,
      yTime(DATA.east.after)
    ),

    C.cyan,
    1.3
  );

  // 21: East actually ended at 30.
  await until(S(21));
  await play(
    new M.Indicate(
      graph.eastAfter.mob,
      { color: C.cyan }
    ),

    new M.Indicate(
      graph.eastAfter.label,
      { color: C.cyan }
    ),

    ...fbox([
      ['EAST AFTER THE ROLLOUT', C.green],
      ['Imagined: 35 minutes', C.green],
      ['Actual:   30 minutes', C.cyan]
    ], C.green),

    ...say(
      'EAST ACTUALLY REACHED 30 MINUTES',
      C.cyan
    )
  );

  // 22: the actual result is five minutes below the imagined result.
  await until(S(22));
  await play(
    new M.Create(effectTopGuide),
    new M.Create(effectBottomGuide),
    new M.FadeIn(effectBracket),

    ...fbox([
      ['EXTRA CHANGE AT EAST', C.amber],
      'Actual − Imagined',
      '30 − 35',
      ['= −5 minutes', C.amber]
    ], C.amber),

    ...say(
      'FIVE MINUTES BELOW THE IMAGINED RESULT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 23-28: equivalent calculation using the observed changes
  //
  // East change = 30 - 40 = -10.
  // West change = 45 - 50 = -5.
  //
  // Difference in differences:
  // (-10) - (-5) = -5.
  // ------------------------------------------------------------

  const eastDrop = changeBracket(
    DATA.east.before,
    DATA.east.after,
    BRACKET_X,
    C.cyan,
    '−10'
  );

  const eastTopGuide = dashed(
    point(
      'before',
      DATA.east.before
    ),

    at(
      BRACKET_X,
      yTime(DATA.east.before)
    ),

    C.cyan,
    1.2
  );

  const eastBottomGuide = dashed(
    point(
      'after',
      DATA.east.after
    ),

    at(
      BRACKET_X,
      yTime(DATA.east.after)
    ),

    C.cyan,
    1.2
  );

  // 23: read East's observed change as 30 minus 40.
  await until(S(23));
  await play(
    ...fadeAll([
      effectBracket,
      effectTopGuide,
      effectBottomGuide
    ]),

    new M.Create(eastTopGuide),
    new M.Create(eastBottomGuide),

    ...fbox([
      ['EAST’S OBSERVED CHANGE', C.cyan],
      'After − Before',
      '30 − 40'
    ], C.cyan),

    ...say(
      'EAST: 30 MINUS 40',
      C.cyan
    )
  );

  // 24: East's observed change equals negative ten.
  await until(S(24));
  await play(
    new M.FadeIn(eastDrop),

    ...fbox([
      ['EAST’S OBSERVED CHANGE', C.cyan],
      '30 − 40',
      ['= −10 minutes', C.cyan],
      'A drop of 10 minutes.'
    ], C.cyan),

    ...say(
      '30 − 40 = −10 MINUTES',
      C.cyan
    )
  );

  // 25: subtract West's change from East's change.
  await until(S(25));
  await play(
    new M.Indicate(
      eastDrop,
      { color: C.cyan }
    ),

    new M.Indicate(
      westDrop,
      { color: C.violet }
    ),

    ...fbox([
      ['COMPARE THE TWO CHANGES', C.green],
      ['East’s change: −10', C.cyan],
      ['West’s change:  −5', C.violet],
      'Subtract West’s change',
      'from East’s change.'
    ], C.green),

    ...say(
      'SUBTRACT ONE CHANGE FROM THE OTHER',
      C.green
    )
  );

  // 26: name difference in differences.
  await until(S(26));
  await play(
    ...changeGraphTitle(
      graph,
      'DIFFERENCE IN DIFFERENCES'
    ),

    ...fbox([
      ['DIFFERENCE IN DIFFERENCES', C.green],
      'First: find each change.',
      'Then: find the difference',
      'between those changes.'
    ], C.green),

    ...say(
      'DIFFERENCE IN DIFFERENCES',
      C.green
    )
  );

  // 27: state the rule with the correct subtraction order.
  await until(S(27));
  await play(
    ...fbox([
      ['THE RULE', C.green],
      'East’s change',
      '− West’s change',
      ['(East after − East before)', C.cyan],
      ['− (West after − West before)', C.violet]
    ], C.green),

    ...say(
      'EAST’S CHANGE MINUS WEST’S CHANGE',
      C.green
    )
  );

  // 28: calculate -10 minus -5 = -5.
  await until(S(28));
  await play(
    ...fbox([
      ['DIFFERENCE IN DIFFERENCES', C.green],
      '(30 − 40) − (45 − 50)',
      '(−10) − (−5)',
      '−10 + 5',
      ['= −5 minutes', C.amber]
    ], C.green),

    ...say(
      'NEGATIVE TEN MINUS NEGATIVE FIVE IS NEGATIVE FIVE',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 29-30: split East's ten-minute saving into two parts
  //
  // West's five-minute drop is the estimated common change.
  // The extra five-minute drop is the estimated pass effect.
  //
  // This is a decomposition under the identifying assumption,
  // not direct observation of the causal mechanisms.
  // ------------------------------------------------------------

  const SAVE_X = CX - 2.65;
  const SAVE_SCALE = 0.53;
  const SAVE_Y = P ? 0.92 : -0.30;
  const SAVE_H = P ? 0.68 : 0.57;

  function savingBlock(
    startMinutes,
    count,
    color,
    label
  ) {
    const w = count * SAVE_SCALE;

    const x =
      SAVE_X +
      startMinutes * SAVE_SCALE +
      w / 2;

    const r = new M.Rectangle({
      width: w - 0.04,
      height: SAVE_H,
      color,
      strokeWidth: 1.8
    });

    r.setFill(color, 0.68);
    r.moveTo(at(x, SAVE_Y));

    const t = txt(
      label,
      P ? 19 : 18,
      C.ink,
      at(x, SAVE_Y),
      true,
      w - 0.20
    );

    return new M.VGroup(r, t);
  }

  const totalSavingBar = savingBlock(
    0,
    10,
    C.cyan,
    '10 MINUTES'
  );

  const commonSavingBar = savingBlock(
    0,
    5,
    C.violet,
    '5 MIN'
  );

  const extraSavingBar = savingBlock(
    5,
    5,
    C.amber,
    '5 MIN'
  );

  const savingTitle = txt(
    'EAST’S TOTAL OBSERVED SAVING',
    P ? 20 : 18,
    C.cyan,
    at(
      CX,
      SAVE_Y + 1.02
    ),
    true,
    PIC_W
  );

  const commonLabel = txt(
    'Matches West’s drop',
    P ? 18 : 16,
    C.violet,
    at(
      SAVE_X + 2.5 * SAVE_SCALE,
      SAVE_Y - 0.73
    ),
    false,
    2.70
  );

  const extraLabel = txt(
    'Extra saving at East',
    P ? 18 : 16,
    C.amber,
    at(
      SAVE_X + 7.5 * SAVE_SCALE,
      SAVE_Y - 0.73
    ),
    false,
    2.70
  );

  const extraNote = txt(
    'Estimated pass effect, assuming parallel trends',
    P ? 17 : 16,
    C.green,
    at(
      CX,
      SAVE_Y - 1.50
    ),
    false,
    PIC_W
  );

  const totalBraceY = SAVE_Y + 0.48;

  const savingBrace = new M.VGroup(
    line(
      at(SAVE_X, totalBraceY),
      at(
        SAVE_X + 10 * SAVE_SCALE,
        totalBraceY
      ),
      C.cyan,
      2.2
    ),

    line(
      at(SAVE_X, totalBraceY - 0.09),
      at(SAVE_X, totalBraceY + 0.09),
      C.cyan,
      2.2
    ),

    line(
      at(
        SAVE_X + 10 * SAVE_SCALE,
        totalBraceY - 0.09
      ),

      at(
        SAVE_X + 10 * SAVE_SCALE,
        totalBraceY + 0.09
      ),

      C.cyan,
      2.2
    )
  );

  const rightSavingGhost = new M.Rectangle({
    width: 5 * SAVE_SCALE - 0.04,
    height: SAVE_H,
    color: C.muted,
    strokeWidth: 1.5
  });

  rightSavingGhost.setFill(C.card, 0.15);

  rightSavingGhost.moveTo(at(
    SAVE_X + 7.5 * SAVE_SCALE,
    SAVE_Y
  ));

  const graphGuides = [
    eastDrop,
    eastTopGuide,
    eastBottomGuide,
    westDrop,
    westTopGuide,
    westBottomGuide
  ];

  // 29: five of East's ten saved minutes match West's drop.
  await until(S(29));
  await play(
    ...fadeAll([
      ...graphObjects(graph),
      ...graphGuides
    ]),

    new M.FadeIn(savingTitle),
    new M.Create(savingBrace),

    new M.FadeIn(commonSavingBar),
    new M.FadeIn(rightSavingGhost),
    new M.FadeIn(commonLabel),

    ...fbox([
      ['EAST SAVED 10 MINUTES', C.cyan],
      ['5 match West’s drop.', C.violet],
      'What remains?'
    ], C.green),

    ...say(
      'FIVE OF EAST’S TEN MINUTES MATCH WEST',
      C.violet
    )
  );

  // 30: five extra minutes are the estimated saving from the pass.
  await until(S(30));
  await play(
    new M.FadeOut(rightSavingGhost),
    new M.FadeIn(extraSavingBar),
    new M.FadeIn(extraLabel),
    new M.FadeIn(extraNote),

    ...fbox([
      ['EXTRA SAVING AT EAST', C.amber],
      'Total saving: 10',
      'Common saving: 5',
      ['Extra saving: 5 minutes', C.amber],
      ['Estimated effect = −5 min', C.green]
    ], C.green),

    ...say(
      'FIVE EXTRA MINUTES SAVED AT EAST',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 31: when difference in differences is useful
  //
  // Programs that begin at different times in different places.
  // ------------------------------------------------------------

  const TIME_X1 = CX - 2.65;
  const TIME_X2 = CX + 2.65;

  const START_X = CX + 0.05;

  const ROLLOUT_ROW_Y = P
    ? [1.25, -0.60]
    : [0.40, -1.35];

  function rolloutRow(
    name,
    y,
    color,
    receives
  ) {
    const nameText = txt(
      name,
      P ? 21 : 19,
      color,
      at(
        TIME_X1,
        y + 0.48
      )
    );

    const base = line(
      at(TIME_X1, y),
      at(TIME_X2, y),
      C.muted,
      3
    );

    const before = line(
      at(TIME_X1, y),
      at(START_X, y),
      color,
      5
    );

    const after = line(
      at(START_X, y),
      at(TIME_X2, y),
      receives ? C.amber : color,
      5
    );

    const dot = glowDot(
      at(START_X, y),
      receives ? C.amber : color
    );

    const status = txt(
      receives
        ? 'Passes begin'
        : 'Still waiting',
      P ? 18 : 16,
      receives ? C.amber : color,
      at(
        (START_X + TIME_X2) / 2,
        y + 0.48
      ),
      false,
      2.55
    );

    return new M.VGroup(
      nameText,
      base,
      before,
      after,
      dot,
      status
    );
  }

  const rolloutEast = rolloutRow(
    'East',
    ROLLOUT_ROW_Y[0],
    C.cyan,
    true
  );

  const rolloutWest = rolloutRow(
    'West',
    ROLLOUT_ROW_Y[1],
    C.violet,
    false
  );

  const rolloutMarker = dashed(
    at(
      START_X,
      ROLLOUT_ROW_Y[0] + 0.72
    ),

    at(
      START_X,
      ROLLOUT_ROW_Y[1] - 0.46
    ),

    C.amber,
    1.7
  );

  const rolloutMonth = txt(
    'This month',
    P ? 17 : 16,
    C.amber,
    at(
      START_X,
      ROLLOUT_ROW_Y[1] - 0.73
    ),
    false
  );

  const staggeredTitle = txt(
    'PROGRAMS THAT START AT DIFFERENT TIMES',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  await until(S(31));
  await play(
    ...fadeAll([
      savingTitle,
      savingBrace,
      commonSavingBar,
      extraSavingBar,
      commonLabel,
      extraLabel,
      extraNote
    ]),

    new M.FadeIn(staggeredTitle),
    new M.FadeIn(rolloutEast),
    new M.FadeIn(rolloutWest),
    new M.Create(rolloutMarker),
    new M.FadeIn(rolloutMonth),

    ...fbox([
      ['WHEN IS THIS USEFUL?', C.green],
      'One place starts a program.',
      'Another place is still waiting.',
      'Compare their changes.'
    ], C.green),

    ...say(
      'ONE PLACE STARTS WHILE ANOTHER WAITS',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 32-33: common trap — a separate East-only change
  //
  // A hypothetical new road opening at East could change
  // its commute times even without the pass.
  //
  // Do not assign a numerical saving to that hypothetical road.
  // ------------------------------------------------------------

  graph = makeGraph();
  graph.imagined = makeImagined(graph);

  const newRoadIcon = roadIcon(
    at(
      CX + 2.65,
      P ? -0.32 : -0.64
    )
  );

  const newRoadText = txt(
    'New road at East?',
    P ? 15 : 14,
    C.amber,
    at(
      CX + 2.65,
      P ? -0.78 : -1.06
    ),
    false,
    1.80
  );

  const eastOnlyTag = makeTag(
    'EAST-ONLY CHANGE?',
    C.amber,
    P
      ? at(CX, -3.02)
      : at(4.25, 1.17)
  );

  // 32: another change at East could distort the estimate.
  await until(S(32));
  await play(
    ...fadeAll([
      staggeredTitle,
      rolloutEast,
      rolloutWest,
      rolloutMarker,
      rolloutMonth
    ]),

    ...revealWholeGraph(graph),

    new M.FadeIn(newRoadIcon),
    new M.FadeIn(newRoadText),
    new M.FadeIn(eastOnlyTag),

    ...fbox([
      ['COMMON TRAP', C.amber],
      'Something else changes',
      'only at East.',
      'For example, a new road',
      'opens that month.'
    ], C.amber),

    ...say(
      'CHECK FOR OTHER CHANGES AT EAST',
      C.amber
    )
  );

  // 33: an East-only improvement could break parallel trends.
  //
  // Remove the assumed line, leaving the true no-pass result
  // unknown rather than inventing a new counterfactual value.

  const assumptionWarning = txt(
    'Without-pass result now uncertain',
    P ? 17 : 16,
    C.amber,
    at(
      CX,
      P ? -3.00 : -2.79
    ),
    false,
    PIC_W
  );

  const uncertainPoint = glowDot(
    point(
      'after',
      IMAGINED_EAST
    ),
    C.amber,
    true,
    0.12
  );

  const unknownLabel = valueLabel(
    'after',
    IMAGINED_EAST,
    C.amber,
    0,
    '?'
  );

  await until(S(33));
  await play(
    ...fadeAll([
      graph.imagined.line,
      graph.imagined.mob,
      graph.imagined.label,
      graph.imagined.note,
      eastOnlyTag,
      newRoadIcon,
      newRoadText
    ]),

    new M.FadeIn(uncertainPoint),
    new M.FadeIn(unknownLabel),
    new M.FadeIn(assumptionWarning),

    ...fbox([
      ['PARALLEL TRENDS MAY FAIL', C.amber],
      'East might have changed',
      'differently even without',
      'the passes.',
      ['The −5 estimate may be biased.', C.amber]
    ], C.amber),

    ...say(
      'AN EAST-ONLY CHANGE CAN BREAK THE ASSUMPTION',
      C.amber
    )
  );

  graph.imagined = null;

  // ------------------------------------------------------------
  // 34: check the earlier trends
  //
  // The supplied data contain only one before period.
  //
  // Show schematic earlier trends, with no numerical values.
  // Clearly label them as a check we would like to perform,
  // not actual historical evidence from East and West.
  // ------------------------------------------------------------

  const HISTORY_X = [
    CX - 2.52,
    CX - 0.85,
    CX + 0.82,
    CX + 2.49
  ];

  const HISTORY_BASE = P ? -1.72 : -2.00;

  const HISTORY_POINTS = [
    P
      ? [0.30, 0.05, -0.30, -0.62]
      : [0.48, 0.22, -0.10, -0.42],

    P
      ? [1.75, 1.50, 1.15, 0.83]
      : [1.22, 0.96, 0.64, 0.32]
  ];

  function schematicTrend(
    values,
    color,
    name
  ) {
    const parts = [];

    for (let i = 0; i < values.length; i++) {
      const p = at(
        HISTORY_X[i],
        values[i]
      );

      parts.push(
        glowDot(
          p,
          color,
          true,
          0.085
        )
      );

      if (i > 0) {
        parts.push(
          dashed(
            at(
              HISTORY_X[i - 1],
              values[i - 1]
            ),

            p,
            color,
            2.6
          )
        );
      }
    }

    const label = txt(
      name,
      P ? 18 : 16,
      color,
      at(
        HISTORY_X[0],
        values[0] + 0.33
      )
    );

    parts.push(label);

    return new M.VGroup(...parts);
  }

  const historicalEast = schematicTrend(
    HISTORY_POINTS[0],
    C.cyan,
    'East'
  );

  const historicalWest = schematicTrend(
    HISTORY_POINTS[1],
    C.violet,
    'West'
  );

  const historyAxis = arrow(
    at(
      CX - 3.05,
      HISTORY_BASE
    ),

    at(
      CX + 3.05,
      HISTORY_BASE
    ),

    C.muted,
    2
  );

  const historyLabels = [
    'Earlier',
    'Later',
    'Later',
    'Before passes'
  ].map((s, i) =>
    txt(
      s,
      P ? 14 : 13,
      C.muted,
      at(
        HISTORY_X[i],
        HISTORY_BASE - 0.29
      ),
      false,
      1.55
    )
  );

  const historyTitle = txt(
    'CHECK THE YEARS BEFORE THE PROGRAM',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const schematicTag = makeTag(
    'SCHEMATIC • NOT RECORDED DATA',
    C.amber,
    P
      ? at(CX, 2.42)
      : at(4.25, 1.15),
    P ? 16 : 15
  );

  await until(S(34));
  await play(
    ...fadeAll([
      ...graphObjects(graph),
      uncertainPoint,
      unknownLabel,
      assumptionWarning
    ]),

    new M.FadeIn(historyTitle),
    new M.FadeIn(schematicTag),
    new M.FadeIn(historyAxis),

    ...historyLabels.map(t =>
      new M.FadeIn(t)
    ),

    lagIn(
      [historicalEast, historicalWest],
      0.95,
      0.15
    ),

    ...fbox([
      ['CHECK EARLIER TRENDS', C.green],
      'Did East and West already',
      'change similarly before?',
      'Earlier records can help.',
      ['They cannot prove the assumption.', C.amber]
    ], C.green),

    ...say(
      'LOOK FOR SIMILAR TRENDS BEFORE THE PASSES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 35-38: preview Try it
  //
  // Actual dragging belongs to the separate interactive exercise.
  //
  // The animated preview uses the same graph and computes:
  //
  // westChange = westAfter - westBefore
  // imaginedEast = eastBefore + westChange
  // estimate = eastAfter - imaginedEast
  //
  // These formulas update whenever the practice values change.
  // ------------------------------------------------------------

  function resultFor(data) {
    const eastChange =
      data.east.after -
      data.east.before;

    const westChange =
      data.west.after -
      data.west.before;

    const imaginedEast =
      data.east.before +
      westChange;

    return {
      eastChange,
      westChange,
      imaginedEast,

      estimate:
        eastChange -
        westChange
    };
  }

  function dragHandle(p, color) {
    const r = new M.Circle({
      radius: 0.18,
      color,
      strokeWidth: 1.7
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function makeHandles(data) {
    return [
      dragHandle(
        point(
          'before',
          data.east.before
        ),
        C.cyan
      ),

      dragHandle(
        point(
          'after',
          data.east.after
        ),
        C.cyan
      ),

      dragHandle(
        point(
          'before',
          data.west.before
        ),
        C.violet
      ),

      dragHandle(
        point(
          'after',
          data.west.after
        ),
        C.violet
      )
    ];
  }

  function tryResultBox(
    data,
    heading = 'TRY IT'
  ) {
    const r = resultFor(data);

    return fbox([
      [heading, C.green],
      [
        `East change: ${signed(r.eastChange)}`,
        C.cyan
      ],
      [
        `West change: ${signed(r.westChange)}`,
        C.violet
      ],
      [
        `Imagined East: ${r.imaginedEast}`,
        C.green
      ],
      [
        `Extra change: ${signed(r.estimate)}`,
        C.amber
      ]
    ], C.green);
  }

  let tryData = {
    east: { ...DATA.east },
    west: { ...DATA.west }
  };

  let tryGraph = makeGraph(tryData);
  tryGraph.imagined = makeImagined(tryGraph);

  tryGraph.title = txt(
    'TRY IT: MOVE THE BEFORE AND AFTER DOTS',
    P ? 18 : 17,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  let handles = makeHandles(tryData);

  const tryHint = txt(
    'Move a dot and recalculate the imagined line.',
    P ? 16 : 15,
    C.muted,
    P
      ? at(CX, -3.03)
      : at(4.25, -1.85),
    false,
    P ? PIC_W : 4.55
  );

  // 35: preview dragging one observed point.
  //
  // Start with the exact chapter values.
  // The moving demonstration below is explicitly hypothetical.

  const practiceTag = makeTag(
    'PRACTICE PREVIEW',
    C.green,
    P
      ? at(CX, -3.48)
      : at(4.25, 1.18),
    P ? 15 : 15
  );

  await until(S(35));
  await play(
    ...fadeAll([
      historicalEast,
      historicalWest,
      historyAxis,
      ...historyLabels,
      historyTitle,
      schematicTag
    ]),

    ...revealWholeGraph(tryGraph),

    ...handles.map(h =>
      new M.Create(h)
    ),

    new M.FadeIn(tryHint),
    new M.FadeIn(practiceTag),

    ...tryResultBox(
      tryData,
      'TRY IT'
    ),

    ...say(
      'TRY IT: DRAG THE OBSERVED DOTS',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 36: challenge — place the imagined East dot at 35
  //
  // West: 45 - 50 = -5.
  // East before: 40.
  // Imagined East after: 40 - 5 = 35.
  // ------------------------------------------------------------

  const imaginedAnswerRing = new M.Circle({
    radius: 0.23,
    color: C.green,
    strokeWidth: 2.5
  });

  imaginedAnswerRing.setFill(
    C.green,
    0
  );

  imaginedAnswerRing.moveTo(
    point(
      'after',
      IMAGINED_EAST
    )
  );

  const tryWestBracket = changeBracket(
    DATA.west.before,
    DATA.west.after,
    BRACKET_X,
    C.violet,
    '−5'
  );

  await until(S(36));
  await play(
    new M.Create(imaginedAnswerRing),
    new M.FadeIn(tryWestBracket),

    new M.Indicate(
      tryGraph.westLine,
      { color: C.violet }
    ),

    new M.Indicate(
      tryGraph.imagined.mob,
      { color: C.green }
    ),

    ...fbox([
      ['CHALLENGE 1', C.green],
      'West drops by 5.',
      'East starts at 40.',
      '40 − 5',
      ['Answer: 35 minutes', C.green]
    ], C.green),

    ...say(
      'USE WEST’S DROP TO PLACE THE IMAGINED DOT',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 37: challenge — find the actual-minus-imagined gap
  // ------------------------------------------------------------

  const tryEffectBracket = changeBracket(
    IMAGINED_EAST,
    DATA.east.after,
    BRACKET_X,
    C.amber,
    '−5'
  );

  await until(S(37));
  await play(
    new M.FadeIn(tryEffectBracket),

    new M.Indicate(
      tryGraph.eastAfter.mob,
      { color: C.cyan }
    ),

    new M.Indicate(
      tryGraph.imagined.mob,
      { color: C.green }
    ),

    ...fbox([
      ['CHALLENGE 2', C.green],
      'Actual East: 30',
      'Imagined East: 35',
      '30 − 35',
      ['Answer: −5 minutes', C.amber]
    ], C.green),

    ...say(
      'FIND THE GAP BETWEEN ACTUAL AND IMAGINED',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 38: fresh imagined practice data
  //
  // This is a separate practice example, not additional
  // observed records from the fixed city illustration.
  //
  // East: 45 -> 35, change = -10.
  // West: 50 -> 47, change = -3.
  //
  // Imagined East = 45 - 3 = 42.
  // Estimated extra change = 35 - 42 = -7.
  // ------------------------------------------------------------

  const freshData = {
    east: {
      ...DATA.east,
      before: 45,
      after: 35
    },

    west: {
      ...DATA.west,
      before: 50,
      after: 47
    }
  };

  const freshResult = resultFor(freshData);

  const freshGraph = makeGraph(freshData);
  freshGraph.imagined = makeImagined(freshGraph);

  freshGraph.title = txt(
    'NEW DATA • IMAGINED PRACTICE VALUES',
    P ? 18 : 17,
    C.violet,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const freshHandles = makeHandles(freshData);

  const freshGap = changeBracket(
    freshResult.imaginedEast,
    freshData.east.after,
    BRACKET_X,
    C.amber,
    signed(freshResult.estimate)
  );

  const newDataTag = makeTag(
    'NEW DATA',
    C.green,
    P
      ? at(CX, -3.03)
      : at(4.25, 1.18)
  );

  await until(S(38));
  await play(
    ...fadeAll([
      ...graphObjects(tryGraph),
      ...handles,
      imaginedAnswerRing,
      tryWestBracket,
      tryEffectBracket,
      practiceTag,
      tryHint
    ]),

    ...revealWholeGraph(freshGraph),

    ...freshHandles.map(h =>
      new M.Create(h)
    ),

    new M.FadeIn(freshGap),
    new M.FadeIn(newDataTag),

    ...tryResultBox(
      freshData,
      'FRESH IMAGINED EXAMPLE'
    ),

    ...say(
      'NEW DATA: COMPARE TWO FRESH LINES',
      C.green
    )
  );

  // ------------------------------------------------------------
  // 39: final takeaway
  //
  // Restore the exact lesson data:
  //
  // East: 40 -> 30.
  // West: 50 -> 45.
  // Imagined East: 35.
  //
  // Finish with both equivalent calculations.
  // ------------------------------------------------------------

  const finalGraph = makeGraph();
  finalGraph.imagined = makeImagined(finalGraph);

  finalGraph.title = txt(
    'DIFFERENCE IN DIFFERENCES',
    P ? 21 : 19,
    C.green,
    at(CX, TITLE_Y),
    true,
    PIC_W
  );

  const finalWestBracket = changeBracket(
    DATA.west.before,
    DATA.west.after,
    BRACKET_X,
    C.violet,
    '−5'
  );

  const finalEffectBracket = changeBracket(
    IMAGINED_EAST,
    DATA.east.after,
    BRACKET_X,
    C.amber,
    '−5'
  );

  const finalEffectGuide1 = dashed(
    point(
      'after',
      IMAGINED_EAST
    ),

    at(
      BRACKET_X,
      yTime(IMAGINED_EAST)
    ),

    C.green,
    1.3
  );

  const finalEffectGuide2 = dashed(
    point(
      'after',
      DATA.east.after
    ),

    at(
      BRACKET_X,
      yTime(DATA.east.after)
    ),

    C.cyan,
    1.3
  );

  const finalAssumption = makeTag(
    'ASSUMING PARALLEL TRENDS',
    C.green,
    P
      ? at(CX, -3.02)
      : at(4.25, 1.42),
    P ? 16 : 15
  );

  await until(S(39));
  await play(
    ...fadeAll([
      ...graphObjects(freshGraph),
      ...freshHandles,
      freshGap,
      newDataTag
    ]),

    ...revealWholeGraph(finalGraph),

    new M.FadeIn(finalWestBracket),
    new M.FadeIn(finalEffectBracket),

    new M.Create(finalEffectGuide1),
    new M.Create(finalEffectGuide2),

    new M.FadeIn(finalAssumption),

    ...fbox([
      ['DIFFERENCE IN DIFFERENCES', C.green],
      ['East: 30 − 40 = −10', C.cyan],
      ['West: 45 − 50 = −5', C.violet],
      '(−10) − (−5) = −5',
      'Same as 30 − 35 = −5',
      ['Estimated saving: 5 min', C.amber]
    ], C.green),

    ...say(
      'SUBTRACT THE WAITING GROUP’S CHANGE',
      C.green
    )
  );

  // ------------------------------------------------------------
  // Final fixed facts
  // ------------------------------------------------------------
  //
  // East receives passes:
  //   Before average = 40 minutes.
  //   After average  = 30 minutes.
  //   Observed change = -10 minutes.
  //
  // West is still waiting:
  //   Before average = 50 minutes.
  //   After average  = 45 minutes.
  //   Observed change = -5 minutes.
  //
  // Parallel-trends assumption:
  //   Without passes, East would have experienced
  //   the same change as West.
  //
  // Imagined East without passes:
  //   40 + (-5) = 35 minutes.
  //
  // Estimated effect at East:
  //   Actual - Imagined
  //   = 30 - 35
  //   = -5 minutes.
  //
  // Equivalent difference-in-differences calculation:
  //   East change - West change
  //   = (30 - 40) - (45 - 50)
  //   = (-10) - (-5)
  //   = -5 minutes.
  //
  // Estimated additional saving = 5 minutes.
  //
  // The two workplaces need not start at the same level.
  // Parallel trends concerns their changes without the program.
  //
  // Other changes occurring only at East could invalidate
  // the identifying assumption and bias the estimate.
  //
  // Earlier trends can provide supporting evidence, but they
  // cannot establish the unobserved post-rollout counterfactual.
}

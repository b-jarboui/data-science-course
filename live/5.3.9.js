// lesson 5.3.9
// Markov chains — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter model:
//   Clear today -> Clear tomorrow 0.9, Busy tomorrow 0.1.
//   Busy today  -> Clear tomorrow 0.3, Busy tomorrow 0.7.
//
// Starting Clear on Monday:
//   P(Busy on Wednesday) = 0.9 * 0.1 + 0.1 * 0.7 = 0.16.
//
// Long-run probabilities:
//   Clear = 0.75, Busy = 0.25.
//   Flow into Busy  = 0.75 * 0.1 = 0.075.
//   Flow out of Busy = 0.25 * 0.3 = 0.075.
//
// Seed-5 simulation verified with NumPy default_rng(5):
//   1,000 days, including the initial Clear day.
//   Clear = 774, Busy = 226.
//
// To reproduce that exact simulation:
//   From Clear: draw < 0.1 means Busy; otherwise Clear.
//   From Busy:  draw < 0.3 means Clear; otherwise Busy.
// The two sampling rulers therefore use different segment orders.
//
// The 1,000-day display aggregates consecutive groups of ten days.
// Its counts are taken from the verified seed-5 simulation.
//
// Browser rendering has not been tested against the live engine.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // ------------------------------------------------------------

  const CLEAR = 0;
  const BUSY = 1;

  const TEAL = C.teal || '#2DD4BF';
  const RED = C.red || '#F87171';
  const BLUE = C.blue || '#60A5FA';

  const STATE_COLORS = [TEAL, RED];
  const STATE_NAMES = ['Clear', 'Busy'];

  const TRANSITION = [
    [0.9, 0.1],
    [0.3, 0.7]
  ];

  const STATIONARY = [0.75, 0.25];

  const FLOW_INTO_BUSY =
    STATIONARY[CLEAR] * TRANSITION[CLEAR][BUSY];

  const FLOW_OUT_OF_BUSY =
    STATIONARY[BUSY] * TRANSITION[BUSY][CLEAR];

  const PATH1 =
    TRANSITION[CLEAR][CLEAR] *
    TRANSITION[CLEAR][BUSY];

  const PATH2 =
    TRANSITION[CLEAR][BUSY] *
    TRANSITION[BUSY][BUSY];

  const WED_BUSY = PATH1 + PATH2;

  const SEED = 5;

  // Rounded draws for display only.
  // State decisions were verified using the unrounded NumPy draws.
  const WEEK_DRAWS = [
    0.8050,
    0.8079,
    0.5153,
    0.2858,
    0.0539,
    0.3834
  ];

  const WEEK_STATES = [
    CLEAR,
    CLEAR,
    CLEAR,
    CLEAR,
    CLEAR,
    BUSY,
    BUSY
  ];

  const DAYS = [
    'MON', 'TUE', 'WED', 'THU',
    'FRI', 'SAT', 'SUN'
  ];

  function nextState(today, u) {
    if (today === CLEAR) {
      return u < 0.1 ? BUSY : CLEAR;
    }

    return u < 0.3 ? CLEAR : BUSY;
  }

  // Exact number of Clear days in each consecutive
  // block of ten days from the seed-5 simulation.
  const CLEAR_PER10 = [
    6, 8, 5, 8, 9, 9, 10, 10, 9, 4,
    7, 9, 10, 8, 10, 9, 1, 10, 8, 10,
    6, 10, 10, 6, 9, 8, 10, 2, 10, 6,
    9, 6, 10, 3, 10, 5, 7, 3, 8, 10,
    8, 10, 9, 8, 10, 10, 6, 9, 10, 8,
    10, 8, 3, 7, 5, 3, 7, 9, 6, 10,
    7, 9, 10, 8, 10, 10, 9, 5, 7, 7,
    10, 9, 2, 2, 4, 7, 10, 8, 6, 2,
    10, 8, 10, 6, 7, 10, 10, 7, 9, 10,
    8, 10, 10, 10, 2, 8, 7, 8, 9, 9
  ];

  const TOTAL_DAYS = CLEAR_PER10.length * 10;

  const CLEAR_COUNT = CLEAR_PER10.reduce(
    (sum, n) => sum + n,
    0
  );

  const BUSY_COUNT = TOTAL_DAYS - CLEAR_COUNT;

  const CLEAR_SHARE = CLEAR_COUNT / TOTAL_DAYS;

  const CLEAR_PER100 = Array.from(
    { length: 10 },
    (_, k) =>
      CLEAR_PER10
        .slice(k * 10, k * 10 + 10)
        .reduce((sum, n) => sum + n, 0)
  );

  const fmt = v =>
    Number(v.toFixed(4)).toString();

  const commas = n =>
    n.toLocaleString('en-US');

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.50, 0]
    : [4.3, -0.30, 0];

  const MAX_W = P ? FW - 1.2 : 7.1;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = MAX_W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function rect(
    w, h, x, y,
    color,
    opacity = 0.15,
    sw = 2
  ) {
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
    w, h, x, y,
    color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function outline(
    w, h, x, y,
    color = C.amber
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.11,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2.5
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const r = 0.13;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, sw),
      line(
        x2, y2,
        x2 - r * Math.cos(a - 0.55),
        y2 - r * Math.sin(a - 0.55),
        color, sw
      ),
      line(
        x2, y2,
        x2 - r * Math.cos(a + 0.55),
        y2 - r * Math.sin(a + 0.55),
        color, sw
      )
    );
  }

  function glowDot(
    x, y,
    color = C.cyan,
    radius = 0.09,
    opacity = 0.18
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.15,
      color
    });

    halo.setFill(color, opacity);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function tag(
    s, color, x, y,
    size = 17,
    maxw = MAX_W
  ) {
    const p = pill(s, color, size);

    if (p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function cell(
    value, x, y, color,
    w = 1.05,
    h = 0.64
  ) {
    return new M.VGroup(
      rounded(
        w, h, x, y,
        color, color, 0.10
      ),
      txt(
        value,
        P ? 19 : 21,
        color,
        x, y,
        true,
        w - 0.12
      )
    );
  }

  function parcel(
    x, y, color,
    size = 0.65
  ) {
    return new M.VGroup(
      rect(
        size,
        size * 0.78,
        x, y,
        color, 0.16
      ),
      rect(
        size * 0.16,
        size * 0.78,
        x, y,
        color, 0.48, 1
      ),
      line(
        x - size / 2,
        y + size * 0.13,
        x + size / 2,
        y + size * 0.13,
        color, 1
      ),
      rect(
        size * 0.22,
        size * 0.16,
        x + size * 0.27,
        y - size * 0.20,
        color, 0.65, 1
      )
    );
  }

  function car(
    x, y, color,
    size = 0.48
  ) {
    return new M.VGroup(
      rounded(
        size,
        size * 0.48,
        x, y,
        color,
        color,
        0.42
      ),
      rect(
        size * 0.34,
        size * 0.31,
        x, y,
        color,
        0.85,
        0.8
      ),
      rect(
        size * 0.11,
        size * 0.12,
        x + size * 0.40,
        y + size * 0.12,
        C.ink,
        0.85,
        0
      ),
      rect(
        size * 0.11,
        size * 0.12,
        x + size * 0.40,
        y - size * 0.12,
        C.ink,
        0.85,
        0
      )
    );
  }

  function person(
    x, y, color,
    size = 0.22
  ) {
    const head = new M.Circle({
      radius: size * 0.29,
      color
    });

    head.setFill(color, 1);

    head.moveTo([
      x,
      y + size * 0.44,
      0
    ]);

    const body = new M.Arc({
      radius: size * 0.48,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);
    body.moveTo([x, y, 0]);

    return new M.VGroup(head, body);
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Never group objects already visible on screen.
  // Helpers only return animations.
  // Each narration beat calls one awaited play() at a time.
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);

    return objects.map(
      o => new M.FadeIn(o)
    );
  }

  function remove(...objects) {
    const present = objects.filter(
      o => visible.includes(o)
    );

    visible = visible.filter(
      o => !present.includes(o)
    );

    return present.map(
      o => new M.FadeOut(o)
    );
  }

  function swap(objects) {
    const old = visible.slice();

    visible = objects.slice();

    return [
      ...old.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function stagger(
    objects,
    runTime = 1.4,
    lagRatio = 0.12
  ) {
    visible.push(...objects);

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved course style
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.35 : 0.42;

    const rows = lines.map(
      l => Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(
      ([s, c]) =>
        T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.36;

    const r = rounded(
      wd, ht,
      BOXP[0], BOXP[1],
      color
    );

    const left = BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const ind =
        cw * (
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
    const maxh = P ? 1.40 : 3.50;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

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
  // Road and state drawing helpers
  // ------------------------------------------------------------

  function road(
    state,
    x, y,
    w = 2.50,
    h = 0.94
  ) {
    const color = STATE_COLORS[state];

    const parts = [
      rounded(
        w, h,
        x, y,
        color,
        C.card,
        0.97
      ),
      line(
        x - w / 2 + 0.08,
        y + h / 2 - 0.09,
        x + w / 2 - 0.08,
        y + h / 2 - 0.09,
        color,
        1.4
      ),
      line(
        x - w / 2 + 0.08,
        y - h / 2 + 0.09,
        x + w / 2 - 0.08,
        y - h / 2 + 0.09,
        color,
        1.4
      )
    ];

    for (let k = 0; k < 5; k++) {
      const xx =
        x - w / 2 + (k + 0.5) * w / 5;

      parts.push(
        line(
          xx - w * 0.053,
          y,
          xx + w * 0.053,
          y,
          C.muted,
          1.4
        )
      );
    }

    const carSize = Math.min(
      w * 0.17,
      h * 0.60
    );

    if (state === CLEAR) {
      parts.push(
        car(
          x - w * 0.22,
          y + h * 0.23,
          TEAL,
          carSize
        ),
        car(
          x + w * 0.20,
          y - h * 0.23,
          TEAL,
          carSize
        )
      );
    } else {
      for (let k = 0; k < 4; k++) {
        const xx =
          x + (k - 1.5) * w * 0.21;

        parts.push(
          car(
            xx,
            y + h * 0.23,
            RED,
            carSize
          ),
          car(
            xx,
            y - h * 0.23,
            RED,
            carSize
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function stateTile(
    state,
    x, y,
    w = 1.55,
    h = 0.70,
    label = null
  ) {
    const color = STATE_COLORS[state];

    return new M.VGroup(
      rounded(
        w, h,
        x, y,
        color,
        color,
        0.11
      ),
      glowDot(
        x - w * 0.32,
        y,
        color,
        Math.min(0.065, h * 0.12)
      ),
      txt(
        label || STATE_NAMES[state].toUpperCase(),
        P ? 17 : 18,
        color,
        x + w * 0.08,
        y,
        true,
        w * 0.70
      )
    );
  }

  function roadCard(
    state,
    x, y,
    w = 2.80,
    h = 2.35
  ) {
    const color = STATE_COLORS[state];

    return new M.VGroup(
      rounded(
        w, h,
        x, y,
        color
      ),
      txt(
        STATE_NAMES[state].toUpperCase(),
        P ? 24 : 25,
        color,
        x,
        y + h * 0.32,
        true,
        w - 0.22
      ),
      road(
        state,
        x, y,
        w - 0.32,
        h * 0.40
      ),
      txt(
        state === CLEAR
          ? 'Traffic flows freely'
          : 'Traffic is congested',
        16,
        C.ink,
        x,
        y - h * 0.33,
        false,
        w - 0.18
      )
    );
  }

  // ============================================================
  // 0: Recall independent parcel delays.
  // ============================================================

  const independentDelays = [
    0, 20, 10, 30, 0
  ];

  const IND_SP = P ? 1.12 : 1.18;
  const IND_Y = P ? -0.25 : -0.36;

  const independentParcels =
    independentDelays.map((d, k) => {
      const x =
        CX + (k - 2) * IND_SP;

      const color =
        [TEAL, BLUE, C.amber, RED][d / 10];

      return new M.VGroup(
        parcel(
          x,
          IND_Y,
          color,
          0.69
        ),
        txt(
          `${d} min`,
          17,
          color,
          x,
          IND_Y - 0.67,
          true
        )
      );
    });

  const independentSeparators =
    Array.from(
      { length: 4 },
      (_, k) =>
        dashed(
          CX + (k - 1.5) * IND_SP,
          IND_Y - 0.96,
          CX + (k - 1.5) * IND_SP,
          IND_Y + 0.68,
          C.muted
        )
    );

  const independentTitle = txt(
    'ONE DRAW FOR EACH PARCEL',
    P ? 21 : 22,
    C.cyan,
    CX,
    P ? 1.18 : 1.07,
    true
  );

  const independentTag = tag(
    'NO PARCEL AFFECTS THE NEXT',
    C.green,
    CX,
    P ? -2.45 : -2.22,
    18
  );

  await until(S(0));
  await play(
    ...add(
      independentTitle,
      ...independentSeparators
    ),
    stagger(
      independentParcels,
      1.45,
      0.16
    ),
    ...add(independentTag),
    ...say('SO FAR, PARCELS WERE INDEPENDENT'),
    ...fbox([
      'one parcel',
      'does not change',
      ['the next parcel’s chances', C.green]
    ], C.green)
  );

  // ============================================================
  // 1: Traffic is different.
  // A busy day often leads to another busy day.
  // ============================================================

  const trafficY = P ? -0.38 : -0.46;

  const trafficToday = roadCard(
    BUSY,
    CX - 1.59,
    trafficY
  );

  const trafficTomorrow = roadCard(
    BUSY,
    CX + 1.59,
    trafficY
  );

  const todayLabel = txt(
    'TODAY',
    19,
    C.muted,
    CX - 1.59,
    trafficY + 1.55,
    true
  );

  const tomorrowLabel = txt(
    'TOMORROW',
    19,
    C.muted,
    CX + 1.59,
    trafficY + 1.55,
    true
  );

  const trafficArrow = arrow(
    CX - 0.17,
    trafficY,
    CX + 0.17,
    trafficY,
    RED
  );

  const trafficDependence = tag(
    'TODAY CAN AFFECT TOMORROW',
    C.amber,
    CX,
    P ? -2.72 : -2.32,
    18
  );

  await until(S(1));
  await play(
    ...swap([
      todayLabel,
      tomorrowLabel,
      trafficToday
    ]),
    ...add(
      trafficArrow,
      trafficTomorrow,
      trafficDependence
    ),
    ...say('TRAFFIC IS DIFFERENT', C.amber),
    ...fbox([
      'busy today',
      ['often busy tomorrow', RED],
      'days are dependent'
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Weekly timeline helpers
  // ------------------------------------------------------------

  const WEEK_SP = P ? 0.90 : 0.93;

  const WEEK_W = P ? 0.76 : 0.79;

  function weekX(k) {
    return CX + (k - 3) * WEEK_SP;
  }

  function weekDay(
    k,
    state = null,
    y = P ? -0.40 : -0.45
  ) {
    const x = weekX(k);

    const color = state === null
      ? C.muted
      : STATE_COLORS[state];

    const parts = [
      txt(
        DAYS[k],
        15,
        C.muted,
        x,
        y + 0.66,
        true,
        WEEK_W
      ),
      rounded(
        WEEK_W,
        0.86,
        x, y,
        color,
        state === null
          ? C.card
          : color,
        state === null
          ? 0.95
          : 0.15
      )
    ];

    if (state === null) {
      parts.push(
        txt(
          '?',
          22,
          C.muted,
          x, y,
          true
        )
      );
    } else {
      parts.push(
        road(
          state,
          x,
          y + 0.09,
          WEEK_W - 0.13,
          0.31
        ),
        txt(
          state === CLEAR
            ? 'Clear'
            : 'Busy',
          13,
          color,
          x,
          y - 0.26,
          false,
          WEEK_W - 0.10
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function weekArrows(
    y = P ? -0.40 : -0.45
  ) {
    return Array.from(
      { length: 6 },
      (_, k) =>
        arrow(
          weekX(k) + WEEK_W / 2 + 0.02,
          y,
          weekX(k + 1) - WEEK_W / 2 - 0.02,
          y,
          C.muted,
          1.6
        )
    );
  }

  // ============================================================
  // 2: Simulate a week, day by day.
  // ============================================================

  const emptyWeek = DAYS.map(
    (_, k) => weekDay(k)
  );

  const weekTitle = txt(
    'ONE WEEK OF TRAFFIC',
    P ? 23 : 24,
    C.cyan,
    CX,
    P ? 1.20 : 1.10,
    true
  );

  const weekQuestion = txt(
    'What happens on each day?',
    P ? 21 : 22,
    C.amber,
    CX,
    P ? -2.04 : -1.80
  );

  await until(S(2));
  await play(
    ...swap([
      weekTitle,
      ...weekArrows()
    ]),
    stagger(
      emptyWeek,
      1.30,
      0.17
    ),
    ...add(weekQuestion),
    ...say('SIMULATE A WEEK, ONE DAY AT A TIME'),
    ...fbox([
      'Monday → Tuesday',
      '→ Wednesday → ...',
      ['one day at a time', C.cyan]
    ])
  );

  // ============================================================
  // 3–4: The two states.
  // ============================================================

  const statesY = P ? -0.38 : -0.46;

  const clearRoadCard = roadCard(
    CLEAR,
    CX - 1.59,
    statesY
  );

  const busyRoadCard = roadCard(
    BUSY,
    CX + 1.59,
    statesY
  );

  const twoConditionsTitle = txt(
    'TWO POSSIBLE CONDITIONS',
    P ? 21 : 22,
    C.ink,
    CX,
    P ? 1.20 : 1.10,
    true
  );

  await until(S(3));
  await play(
    ...swap([twoConditionsTitle]),
    stagger(
      [clearRoadCard, busyRoadCard],
      1.35,
      0.27
    ),
    ...say('THE ROAD IS EITHER CLEAR OR BUSY'),
    ...fbox([
      ['Clear', TEAL],
      ['Busy', RED],
      'two possible conditions'
    ])
  );

  // 4: A condition on one day is called a state.

  const stateNameTag = tag(
    'STATE = THE CONDITION ON ONE DAY',
    C.violet,
    CX,
    P ? -2.76 : -2.39,
    18
  );

  await until(S(4));
  await play(
    ...add(stateNameTag),
    ...say('THESE CONDITIONS ARE CALLED STATES', C.violet),
    ...fbox([
      ['state', C.violet],
      'the situation the road',
      'is in on one day'
    ], C.violet)
  );

  // ============================================================
  // 5: The depot has observed traffic over many months.
  //
  // Illustrative historical calendar, not an additional
  // measured dataset from the depot.
  // ============================================================

  const HISTORY = [
    0, 0, 0, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 1,
    1, 1, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 0, 0, 0
  ];

  const HC_DX = P ? 0.70 : 0.74;
  const HC_DY = P ? 0.63 : 0.53;
  const HC_TOP = P ? 0.57 : 0.64;

  const historyTiles = HISTORY.map(
    (state, k) => {
      const x =
        CX + (k % 7 - 3) * HC_DX;

      const y =
        HC_TOP -
        Math.floor(k / 7) * HC_DY;

      const color = STATE_COLORS[state];

      return new M.VGroup(
        rounded(
          HC_DX * 0.83,
          HC_DY * 0.80,
          x, y,
          color,
          color,
          0.17
        ),
        txt(
          state === CLEAR ? 'C' : 'B',
          18,
          color,
          x, y,
          true
        )
      );
    }
  );

  const historyTitle = txt(
    'TRAFFIC RECORDS OVER MANY MONTHS',
    P ? 20 : 21,
    C.cyan,
    CX,
    P ? 1.37 : 1.22,
    true
  );

  const historyLegend = new M.VGroup(
    stateTile(
      CLEAR,
      CX - 1.18,
      P ? -2.29 : -1.86,
      1.82,
      0.56
    ),
    stateTile(
      BUSY,
      CX + 1.18,
      P ? -2.29 : -1.86,
      1.82,
      0.56
    )
  );

  const historyCaption = txt(
    'Illustrative calendar of observed states',
    15,
    C.muted,
    CX,
    P ? -3.12 : -2.60
  );

  await until(S(5));
  await play(
    ...swap([
      historyTitle,
      historyLegend,
      historyCaption
    ]),
    stagger(
      historyTiles,
      1.25,
      0.05
    ),
    ...say('LOOK AT WHAT FOLLOWS EACH DAY'),
    ...fbox([
      'observed traffic states',
      'today and tomorrow',
      ['count the transitions', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // Transition frequency pictures
  //
  // Ten tiles represent ten equally weighted chances.
  // They are probability illustrations, not ten sampled days.
  // ------------------------------------------------------------

  function transitionChancePicture(today) {
    const color = STATE_COLORS[today];

    const TOP_Y = P ? 0.68 : 0.74;

    const todayTile = stateTile(
      today,
      CX,
      TOP_Y,
      2.15,
      0.77
    );

    const todayText = txt(
      'TODAY',
      16,
      C.muted,
      CX,
      TOP_Y + 0.63,
      true
    );

    const OUT_Y = P ? -1.23 : -0.84;

    const CLEAR_N =
      Math.round(
        TRANSITION[today][CLEAR] * 10
      );

    const nextTiles = Array.from(
      { length: 10 },
      (_, k) => {
        const state =
          k < CLEAR_N
            ? CLEAR
            : BUSY;

        const x =
          CX + (k % 5 - 2) * 0.89;

        const y =
          OUT_Y -
          Math.floor(k / 5) * 0.62;

        return new M.VGroup(
          rounded(
            0.76,
            0.51,
            x, y,
            STATE_COLORS[state],
            STATE_COLORS[state],
            0.15
          ),
          txt(
            state === CLEAR ? 'C' : 'B',
            20,
            STATE_COLORS[state],
            x, y,
            true
          )
        );
      }
    );

    const nextHeading = txt(
      'TOMORROW: TEN CHANCE SHARES',
      17,
      C.muted,
      CX,
      OUT_Y + 0.58,
      true
    );

    const nextArrow = arrow(
      CX,
      TOP_Y - 0.45,
      CX,
      OUT_Y + 0.83,
      color
    );

    const clearCountTag = tag(
      `${CLEAR_N} IN 10 CLEAR`,
      TEAL,
      CX - 1.42,
      P ? -2.85 : -2.18,
      16,
      2.76
    );

    const busyCountTag = tag(
      `${10 - CLEAR_N} IN 10 BUSY`,
      RED,
      CX + 1.42,
      P ? -2.85 : -2.18,
      16,
      2.76
    );

    return [
      todayTile,
      todayText,
      nextHeading,
      nextArrow,
      ...nextTiles,
      clearCountTag,
      busyCountTag
    ];
  }

  // ============================================================
  // 6: After Clear, nine in ten remain Clear.
  // ============================================================

  const clearTransitionPicture =
    transitionChancePicture(CLEAR);

  await until(S(6));
  await play(
    ...swap(clearTransitionPicture),
    ...say('AFTER CLEAR: 9 IN 10 CLEAR, 1 IN 10 BUSY', TEAL),
    ...fbox([
      ['today: Clear', TEAL],
      ['tomorrow Clear: 0.9', TEAL],
      ['tomorrow Busy:  0.1', RED]
    ], TEAL)
  );

  // ============================================================
  // 7: After Busy, seven in ten remain Busy.
  // ============================================================

  const busyTransitionPicture =
    transitionChancePicture(BUSY);

  await until(S(7));
  await play(
    ...swap(busyTransitionPicture),
    ...say('AFTER BUSY: 3 IN 10 CLEAR, 7 IN 10 BUSY', RED),
    ...fbox([
      ['today: Busy', RED],
      ['tomorrow Clear: 0.3', TEAL],
      ['tomorrow Busy:  0.7', RED]
    ], RED)
  );

  // ------------------------------------------------------------
  // Transition table helpers
  //
  // Rows always represent today's state.
  // Columns always represent tomorrow's state.
  // ------------------------------------------------------------

  function tableLayout(
    center = CX,
    y = P ? -0.40 : -0.45,
    scale = 1
  ) {
    const W = 1.48 * scale;
    const H = 0.82 * scale;

    return {
      center,
      y,
      scale,
      w: W,
      h: H,

      labelX: center - 2.02 * scale,

      colX: [
        center - 0.24 * scale,
        center + 1.39 * scale
      ],

      rowY: [
        y + 0.29 * scale,
        y - 0.69 * scale
      ],

      headerY:
        y + 1.20 * scale,

      titleY:
        y + 1.80 * scale
    };
  }

  function tableHeaders(layout) {
    const l = layout;

    return new M.VGroup(
      txt(
        'TOMORROW',
        Math.max(16, Math.round(18 * l.scale)),
        C.cyan,
        (
          l.colX[0] +
          l.colX[1]
        ) / 2,
        l.titleY,
        true
      ),
      txt(
        'TODAY',
        Math.max(15, Math.round(16 * l.scale)),
        C.muted,
        l.labelX,
        l.headerY,
        true
      ),
      txt(
        'Clear',
        Math.max(16, Math.round(20 * l.scale)),
        TEAL,
        l.colX[0],
        l.headerY,
        true
      ),
      txt(
        'Busy',
        Math.max(16, Math.round(20 * l.scale)),
        RED,
        l.colX[1],
        l.headerY,
        true
      ),
      stateTile(
        CLEAR,
        l.labelX,
        l.rowY[CLEAR],
        1.50 * l.scale,
        l.h
      ),
      stateTile(
        BUSY,
        l.labelX,
        l.rowY[BUSY],
        1.50 * l.scale,
        l.h
      )
    );
  }

  function tableValue(
    row, col,
    layout,
    filled = true
  ) {
    const l = layout;

    const color = filled
      ? STATE_COLORS[col]
      : C.muted;

    return new M.VGroup(
      rounded(
        l.w,
        l.h,
        l.colX[col],
        l.rowY[row],
        color,
        color,
        filled ? 0.10 : 0.035
      ),
      txt(
        filled
          ? TRANSITION[row][col].toFixed(1)
          : '—',
        Math.max(18, Math.round(26 * l.scale)),
        color,
        l.colX[col],
        l.rowY[row],
        true,
        l.w - 0.14
      )
    );
  }

  function tableRowFrame(
    row,
    layout,
    color = C.amber
  ) {
    const l = layout;

    const left =
      l.labelX - 0.83 * l.scale;

    const right =
      l.colX[1] + l.w / 2 +
      0.08 * l.scale;

    return outline(
      right - left,
      l.h + 0.13 * l.scale,
      (left + right) / 2,
      l.rowY[row],
      color
    );
  }

  function fullTable(
    layout,
    activeRow = null
  ) {
    const parts = [
      tableHeaders(layout)
    ];

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        parts.push(
          tableValue(
            r, c, layout
          )
        );
      }
    }

    if (activeRow !== null) {
      parts.push(
        tableRowFrame(
          activeRow,
          layout,
          STATE_COLORS[activeRow]
        )
      );
    }

    return parts;
  }

  // ============================================================
  // 8–10: Build the transition table row by row.
  // ============================================================

  const TABLE = tableLayout(
    CX,
    P ? -0.54 : -0.52,
    1
  );

  const mainHeaders = tableHeaders(TABLE);

  const blankCells = [
    [
      tableValue(CLEAR, CLEAR, TABLE, false),
      tableValue(CLEAR, BUSY, TABLE, false)
    ],
    [
      tableValue(BUSY, CLEAR, TABLE, false),
      tableValue(BUSY, BUSY, TABLE, false)
    ]
  ];

  const clearTableCells = [
    tableValue(CLEAR, CLEAR, TABLE),
    tableValue(CLEAR, BUSY, TABLE)
  ];

  const busyTableCells = [
    tableValue(BUSY, CLEAR, TABLE),
    tableValue(BUSY, BUSY, TABLE)
  ];

  // 8: Rows are today. Columns are tomorrow.

  const tableDirectionNote = txt(
    'Read across the row for today’s state',
    17,
    C.muted,
    CX,
    P ? -2.68 : -2.20
  );

  await until(S(8));
  await play(
    ...swap([
      mainHeaders,
      ...blankCells[0],
      ...blankCells[1],
      tableDirectionNote
    ]),
    ...say('ROWS = TODAY. COLUMNS = TOMORROW.'),
    ...fbox([
      'row: today’s state',
      'column: tomorrow’s state',
      ['entry: transition chance', C.cyan]
    ])
  );

  // 9: Fill the Clear row.

  const clearRowFrame = tableRowFrame(
    CLEAR,
    TABLE,
    TEAL
  );

  await until(S(9));
  await play(
    ...remove(...blankCells[0]),
    ...add(
      clearRowFrame,
      ...clearTableCells
    ),
    ...say('CLEAR ROW: 0.9 CLEAR, 0.1 BUSY', TEAL),
    ...fbox([
      ['Clear → Clear: 0.9', TEAL],
      ['Clear → Busy:  0.1', RED]
    ], TEAL)
  );

  // 10: Fill the Busy row.

  const busyRowFrame = tableRowFrame(
    BUSY,
    TABLE,
    RED
  );

  await until(S(10));
  await play(
    ...remove(
      clearRowFrame,
      ...blankCells[1]
    ),
    ...add(
      busyRowFrame,
      ...busyTableCells
    ),
    ...say('BUSY ROW: 0.3 CLEAR, 0.7 BUSY', RED),
    ...fbox([
      ['Busy → Clear: 0.3', TEAL],
      ['Busy → Busy:  0.7', RED]
    ], RED)
  );

  // ============================================================
  // 11: Each row adds to one.
  // ============================================================

  const sumRowsY = P ? -2.55 : -2.03;

  const rowSums = new M.VGroup(
    txt(
      '0.9 + 0.1 = 1',
      P ? 20 : 21,
      TEAL,
      CX,
      sumRowsY,
      true
    ),
    txt(
      '0.3 + 0.7 = 1',
      P ? 20 : 21,
      RED,
      CX,
      sumRowsY - 0.45,
      true
    )
  );

  await until(S(11));
  await play(
    ...remove(
      busyRowFrame,
      tableDirectionNote
    ),
    ...add(rowSums),
    ...say('EVERY ROW ADDS UP TO ONE', C.green),
    ...fbox([
      ['0.9 + 0.1 = 1', TEAL],
      ['0.3 + 0.7 = 1', RED],
      'tomorrow must be',
      'one of the two states'
    ], C.green)
  );

  // ============================================================
  // 12: Name the transition table.
  // ============================================================

  const transitionTableName = tag(
    'TRANSITION TABLE',
    C.violet,
    CX,
    P ? -3.76 : -2.83,
    19
  );

  await until(S(12));
  await play(
    ...remove(rowSums),
    ...add(transitionTableName),
    ...say('TRANSITION = A MOVE TO THE NEXT STATE', C.violet),
    ...fbox([
      ['transition table', C.violet],
      'chances of moving',
      'from one state to another'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Simulation ruler helpers
  //
  // Clear row:
  //   [0, 0.1) Busy, [0.1, 1) Clear.
  //
  // Busy row:
  //   [0, 0.3) Clear, [0.3, 1) Busy.
  // ------------------------------------------------------------

  const RW = P ? 5.94 : 6.05;

  const RY = P ? -2.05 : -1.68;

  const RH = P ? 0.51 : 0.46;

  const rx = v =>
    CX - RW / 2 + v * RW;

  function samplingRuler(
    state,
    y = RY
  ) {
    const cut = state === CLEAR
      ? 0.1
      : 0.3;

    const firstState = state === CLEAR
      ? BUSY
      : CLEAR;

    const secondState = state === CLEAR
      ? CLEAR
      : BUSY;

    const segments = [
      {
        a: 0,
        b: cut,
        state: firstState
      },
      {
        a: cut,
        b: 1,
        state: secondState
      }
    ];

    const parts = [];

    segments.forEach(seg => {
      const w =
        RW * (seg.b - seg.a);

      const x =
        rx((seg.a + seg.b) / 2);

      const color =
        STATE_COLORS[seg.state];

      parts.push(
        rect(
          w, RH,
          x, y,
          color, 0.64, 1.5
        ),
        txt(
          STATE_NAMES[seg.state],
          18,
          C.ink,
          x, y,
          true,
          Math.max(0.10, w - 0.09)
        ),
        txt(
          fmt(seg.b - seg.a),
          16,
          color,
          x,
          y + RH / 2 + 0.24,
          true
        )
      );
    });

    [0, cut, 1].forEach(v => {
      parts.push(
        line(
          rx(v),
          y - RH / 2 - 0.07,
          rx(v),
          y + RH / 2 + 0.07,
          C.muted, 1.5
        ),
        txt(
          fmt(v),
          16,
          C.muted,
          rx(v),
          y - RH / 2 - 0.25,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function drawMarker(
    u,
    y = RY,
    color = C.amber
  ) {
    const x = rx(u);

    return new M.VGroup(
      glowDot(
        x,
        y + 0.80,
        color,
        0.075
      ),
      arrow(
        x,
        y + 0.67,
        x,
        y + RH / 2 + 0.05,
        color
      ),
      txt(
        u.toFixed(4),
        18,
        color,
        x,
        y + 1.04,
        true,
        1.45
      )
    );
  }

  // ============================================================
  // 13: Start on Monday, which is Clear.
  // ============================================================

  const SIM_WEEK_Y = P ? 0.45 : 0.30;

  let simWeek = DAYS.map((_, k) =>
    weekDay(
      k,
      k === 0 ? CLEAR : null,
      SIM_WEEK_Y
    )
  );

  const simWeekTitle = txt(
    'SIMULATE ONE WEEK',
    P ? 21 : 22,
    C.cyan,
    CX,
    P ? 1.65 : 1.38,
    true
  );

  const mondayStartTag = tag(
    'START: MONDAY IS CLEAR',
    TEAL,
    CX,
    P ? -1.36 : -1.08,
    20
  );

  await until(S(13));
  await play(
    ...swap([
      simWeekTitle,
      ...simWeek,
      ...weekArrows(SIM_WEEK_Y),
      mondayStartTag
    ]),
    ...say('MONDAY IS CLEAR', TEAL),
    ...fbox([
      ['initial state = Clear', TEAL],
      ['seed = 5', C.amber]
    ], TEAL)
  );

  // ============================================================
  // 14: Use today's row and draw a uniform number.
  // ============================================================

  const DRAW_TABLE = tableLayout(
    CX,
    P ? -1.92 : -1.50,
    P ? 0.77 : 0.70
  );

  const drawTableObjects = fullTable(
    DRAW_TABLE,
    CLEAR
  );

  const firstDrawTag = tag(
    'UNIFORM DRAW = 0.8050',
    C.amber,
    CX,
    P ? -4.05 : -2.72,
    18
  );

  await until(S(14));
  await play(
    ...remove(mondayStartTag),
    ...add(
      ...drawTableObjects,
      firstDrawTag
    ),
    ...say('USE THE CLEAR ROW. DRAW A NUMBER.', C.amber),
    ...fbox([
      ['today: Clear', TEAL],
      'draw uniformly from 0 to 1',
      ['draw ≈ 0.8050', C.amber]
    ], TEAL)
  );

  // ============================================================
  // 15: A draw below 0.1 would mean Busy.
  // The actual draw, 0.8050, means Clear.
  // ============================================================

  const clearRuler = samplingRuler(CLEAR);

  const tuesdayDraw = drawMarker(
    WEEK_DRAWS[0]
  );

  const tuesdayResult = tag(
    '0.8050 ≥ 0.1 → CLEAR',
    TEAL,
    CX,
    P ? -3.45 : -2.66,
    18
  );

  const tuesdayClear = weekDay(
    1,
    CLEAR,
    SIM_WEEK_Y
  );

  await until(S(15));
  await play(
    ...remove(
      ...drawTableObjects,
      firstDrawTag
    ),
    ...add(
      clearRuler,
      tuesdayDraw
    ),
    ...say('BELOW 0.1: BUSY. OTHERWISE: CLEAR.', C.amber),
    ...fbox([
      ['draw < 0.1 → Busy', RED],
      ['draw ≥ 0.1 → Clear', TEAL]
    ])
  );

  await until(S(15) + 2.5);
  await play(
    ...remove(simWeek[1]),
    ...add(
      tuesdayClear,
      tuesdayResult
    ),
    ...say('TUESDAY IS CLEAR', TEAL),
    ...fbox([
      'draw ≈ 0.8050',
      '0.8050 ≥ 0.1',
      ['Tuesday = Clear', TEAL]
    ], TEAL)
  );

  simWeek[1] = tuesdayClear;

  // ============================================================
  // 16: This is the same sampling ruler as before,
  // now divided into two segments.
  // ============================================================

  const rulerCaption = txt(
    'Segment lengths equal transition chances',
    16,
    C.muted,
    CX,
    P ? -4.20 : -2.94
  );

  await until(S(16));
  await play(
    ...add(rulerCaption),
    new M.Indicate(
      clearRuler,
      { color: C.cyan }
    ),
    ...say('THE SAME RULER, NOW WITH TWO PIECES'),
    ...fbox([
      ['Busy segment:  0.1', RED],
      ['Clear segment: 0.9', TEAL],
      'total length = 1'
    ])
  );

  // ============================================================
  // 17: Repeat using the state just obtained.
  //
  // Exact first week from seed 5:
  // Monday–Friday Clear; Saturday–Sunday Busy.
  // ------------------------------------------------------------

  const simWeekObjects = DAYS.map(
    (_, k) =>
      weekDay(
        k,
        k < 2
          ? WEEK_STATES[k]
          : null,
        SIM_WEEK_Y
      )
  );

  const weekDetailsY = P ? -0.66 : -0.43;

  let currentRule = null;
  let currentDraw = null;
  let currentInfo = null;

  function nextDayInfo(dayIndex, today, tomorrow) {
    const draw =
      WEEK_DRAWS[dayIndex - 1];

    const rule =
      today === CLEAR
        ? 'Clear row: Busy below 0.1'
        : 'Busy row: Clear below 0.3';

    return new M.VGroup(
      txt(
        rule,
        17,
        STATE_COLORS[today],
        CX,
        weekDetailsY
      ),
      txt(
        `${DAYS[dayIndex]}: ${draw.toFixed(4)} → ${STATE_NAMES[tomorrow]}`,
        18,
        STATE_COLORS[tomorrow],
        CX,
        P ? -3.36 : -2.72,
        true
      )
    );
  }

  await until(S(17));
  await play(
    ...swap([
      ...simWeekObjects,
      ...weekArrows(SIM_WEEK_Y)
    ]),
    ...say('USE THE NEW STATE TO GET THE NEXT DAY'),
    ...fbox([
      'today’s state',
      '→ choose its row',
      '→ draw tomorrow’s state'
    ])
  );

  for (let day = 2; day < 7; day++) {
    const today =
      WEEK_STATES[day - 1];

    const u =
      WEEK_DRAWS[day - 1];

    const tomorrow =
      nextState(today, u);

    const ruler = samplingRuler(today);

    const marker = drawMarker(u);

    const info = nextDayInfo(
      day,
      today,
      tomorrow
    );

    const newTile = weekDay(
      day,
      tomorrow,
      SIM_WEEK_Y
    );

    const oldObjects = [
      currentRule,
      currentDraw,
      currentInfo
    ].filter(Boolean);

    await until(
      S(17) + 0.75 + (day - 2) * 0.88
    );

    await play(
      ...remove(
        ...oldObjects,
        simWeekObjects[day]
      ),
      ...add(
        ruler,
        marker,
        info,
        newTile
      )
    );

    simWeekObjects[day] = newTile;

    currentRule = ruler;
    currentDraw = marker;
    currentInfo = info;
  }

  // ------------------------------------------------------------
  // Two-step probability tree
  //
  // Only branches that end Busy on Wednesday are drawn.
  // The omitted branches end Clear and are not part of the event.
  // ------------------------------------------------------------

  const TREE_X = [
    CX - 2.17,
    CX,
    CX + 2.17
  ];

  const TREE_Y_TOP = P ? 0.47 : 0.42;
  const TREE_Y_BOTTOM = P ? -1.86 : -1.48;

  const TREE_Y_MIDDLE =
    (TREE_Y_TOP + TREE_Y_BOTTOM) / 2;

  const NODE_W = P ? 1.37 : 1.46;
  const NODE_H = P ? 0.68 : 0.64;

  function treeNode(
    day,
    state,
    x, y
  ) {
    return new M.VGroup(
      stateTile(
        state,
        x, y,
        NODE_W,
        NODE_H
      ),
      txt(
        day,
        14,
        C.muted,
        x,
        y + NODE_H / 2 + 0.24,
        true
      )
    );
  }

  function treeEdge(
    x1, y1,
    x2, y2,
    probability,
    color = C.muted,
    labelOffset = 0.27
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const a = Math.atan2(dy, dx);

    const left = [
      x1 + Math.cos(a) * NODE_W * 0.55,
      y1 + Math.sin(a) * NODE_H * 0.58
    ];

    const right = [
      x2 - Math.cos(a) * NODE_W * 0.55,
      y2 - Math.sin(a) * NODE_H * 0.58
    ];

    return new M.VGroup(
      arrow(
        left[0], left[1],
        right[0], right[1],
        color
      ),
      txt(
        probability,
        18,
        color,
        (left[0] + right[0]) / 2,
        (left[1] + right[1]) / 2 +
          labelOffset,
        true
      )
    );
  }

  function probabilityTree() {
    const monday = treeNode(
      'MON',
      CLEAR,
      TREE_X[0],
      TREE_Y_MIDDLE
    );

    const tueClear = treeNode(
      'TUE',
      CLEAR,
      TREE_X[1],
      TREE_Y_TOP
    );

    const tueBusy = treeNode(
      'TUE',
      BUSY,
      TREE_X[1],
      TREE_Y_BOTTOM
    );

    const wedBusy = treeNode(
      'WED',
      BUSY,
      TREE_X[2],
      TREE_Y_MIDDLE
    );

    const edges = [
      treeEdge(
        TREE_X[0],
        TREE_Y_MIDDLE,
        TREE_X[1],
        TREE_Y_TOP,
        '0.9',
        TEAL,
        0.30
      ),
      treeEdge(
        TREE_X[1],
        TREE_Y_TOP,
        TREE_X[2],
        TREE_Y_MIDDLE,
        '0.1',
        RED,
        0.30
      ),
      treeEdge(
        TREE_X[0],
        TREE_Y_MIDDLE,
        TREE_X[1],
        TREE_Y_BOTTOM,
        '0.1',
        RED,
        -0.31
      ),
      treeEdge(
        TREE_X[1],
        TREE_Y_BOTTOM,
        TREE_X[2],
        TREE_Y_MIDDLE,
        '0.7',
        RED,
        -0.31
      )
    ];

    return {
      monday,
      tueClear,
      tueBusy,
      wedBusy,
      edges
    };
  }

  // ============================================================
  // 18: What is the chance Wednesday is Busy,
  // given that Monday is Clear?
  // ============================================================

  const questionTree = probabilityTree();

  const treeQuestion = txt(
    'WHAT CAN HAPPEN ON TUESDAY?',
    P ? 20 : 21,
    C.amber,
    CX,
    P ? 1.48 : 1.31,
    true
  );

  const unknownWedTag = tag(
    'WEDNESDAY BUSY: CHANCE ?',
    C.amber,
    CX,
    P ? -3.10 : -2.42,
    18
  );

  const tueQuestion = new M.VGroup(
    rounded(
      NODE_W,
      NODE_H,
      TREE_X[1],
      TREE_Y_MIDDLE,
      C.amber
    ),
    txt(
      '?',
      24,
      C.amber,
      TREE_X[1],
      TREE_Y_MIDDLE,
      true
    ),
    txt(
      'TUE',
      14,
      C.muted,
      TREE_X[1],
      TREE_Y_MIDDLE + 0.58,
      true
    )
  );

  await until(S(18));
  await play(
    ...swap([
      treeQuestion,
      questionTree.monday,
      questionTree.wedBusy,
      tueQuestion,
      unknownWedTag
    ]),
    ...say('MONDAY CLEAR. WEDNESDAY BUSY?', C.amber),
    ...fbox([
      ['Monday = Clear', TEAL],
      ['Wednesday = Busy?', RED],
      'chance = ?'
    ], C.amber)
  );

  // ============================================================
  // 19: There are two possible paths to Wednesday Busy.
  // ============================================================

  await until(S(19));
  await play(
    ...remove(tueQuestion),
    ...add(
      questionTree.tueClear,
      questionTree.tueBusy
    ),
    ...say('TWO POSSIBLE PATHS', C.violet),
    ...fbox([
      'via Tuesday Clear',
      'or via Tuesday Busy'
    ], C.violet)
  );

  // ============================================================
  // 20: Path one: Clear → Clear → Busy.
  // Probability 0.9 × 0.1 = 0.09.
  // ============================================================

  const path1Tag = tag(
    'PATH 1: 0.9 × 0.1 = 0.09',
    TEAL,
    CX,
    P ? -3.10 : -2.42,
    17
  );

  const path1Frame = outline(
    NODE_W + 0.14,
    NODE_H + 0.14,
    TREE_X[1],
    TREE_Y_TOP,
    TEAL
  );

  await until(S(20));
  await play(
    ...remove(unknownWedTag),
    stagger(
      [
        questionTree.edges[0],
        questionTree.edges[1]
      ],
      1.7,
      0.38
    ),
    ...add(path1Frame),
    ...say('PATH 1: THROUGH TUESDAY CLEAR', TEAL),
    ...fbox([
      ['Mon Clear → Tue Clear', TEAL],
      ['chance = 0.9', TEAL],
      'Tue Clear → Wed Busy',
      ['chance = 0.1', RED]
    ], TEAL)
  );

  await until(S(20) + 4.7);
  await play(
    ...add(path1Tag),
    ...say('MULTIPLY ALONG THE PATH: 0.09', TEAL),
    ...fbox([
      'path 1',
      '0.9 × 0.1',
      ['= 0.09', TEAL]
    ], TEAL)
  );

  // ============================================================
  // 21: Path two: Clear → Busy → Busy.
  // Probability 0.1 × 0.7 = 0.07.
  // ============================================================

  const path2Tag = tag(
    'PATH 2: 0.1 × 0.7 = 0.07',
    RED,
    CX,
    P ? -3.82 : -2.83,
    17
  );

  const path2Frame = outline(
    NODE_W + 0.14,
    NODE_H + 0.14,
    TREE_X[1],
    TREE_Y_BOTTOM,
    RED
  );

  await until(S(21));
  await play(
    ...remove(path1Frame),
    stagger(
      [
        questionTree.edges[2],
        questionTree.edges[3]
      ],
      1.7,
      0.38
    ),
    ...add(path2Frame),
    ...say('PATH 2: THROUGH TUESDAY BUSY', RED),
    ...fbox([
      'Mon Clear → Tue Busy',
      ['chance = 0.1', RED],
      'Tue Busy → Wed Busy',
      ['chance = 0.7', RED]
    ], RED)
  );

  await until(S(21) + 5.1);
  await play(
    ...add(path2Tag),
    ...say('MULTIPLY ALONG THIS PATH: 0.07', RED),
    ...fbox([
      'path 2',
      '0.1 × 0.7',
      ['= 0.07', RED]
    ], RED)
  );

  // ============================================================
  // 22: Add the probabilities of the two distinct paths.
  // ============================================================

  const ADD_Y = P ? -0.37 : -0.40;

  const pathOneCard = new M.VGroup(
    rounded(
      2.40, 1.38,
      CX - 1.55,
      ADD_Y + 0.39,
      TEAL
    ),
    txt(
      'VIA CLEAR',
      16,
      TEAL,
      CX - 1.55,
      ADD_Y + 0.77,
      true
    ),
    txt(
      '0.09',
      34,
      TEAL,
      CX - 1.55,
      ADD_Y + 0.18,
      true
    )
  );

  const pathTwoCard = new M.VGroup(
    rounded(
      2.40, 1.38,
      CX + 1.55,
      ADD_Y + 0.39,
      RED
    ),
    txt(
      'VIA BUSY',
      16,
      RED,
      CX + 1.55,
      ADD_Y + 0.77,
      true
    ),
    txt(
      '0.07',
      34,
      RED,
      CX + 1.55,
      ADD_Y + 0.18,
      true
    )
  );

  const pathPlus = txt(
    '+',
    35,
    C.ink,
    CX,
    ADD_Y + 0.39,
    true
  );

  const combinedResult = tag(
    '= 0.16',
    C.green,
    CX,
    P ? -2.19 : -1.95,
    28
  );

  await until(S(22));
  await play(
    ...swap([
      pathOneCard,
      pathTwoCard,
      pathPlus
    ]),
    ...say('ADD THE TWO DISTINCT PATHS', C.green),
    ...fbox([
      'P(Wed Busy | Mon Clear)',
      ['= 0.09 + 0.07', C.amber]
    ], C.green)
  );

  await until(S(22) + 3.3);
  await play(
    ...add(combinedResult),
    ...say('0.09 + 0.07 = 0.16', C.green),
    ...fbox([
      '0.9 × 0.1 + 0.1 × 0.7',
      '  = 0.09 + 0.07',
      ['  = 0.16', C.green]
    ], C.green)
  );

  // ============================================================
  // 23: Wednesday is Busy with probability 0.16.
  // ============================================================

  const resultRoad = roadCard(
    BUSY,
    CX,
    P ? 0.10 : 0.00,
    3.66,
    1.94
  );

  const resultWednesday = txt(
    'WEDNESDAY',
    20,
    C.muted,
    CX,
    P ? 1.41 : 1.21,
    true
  );

  const resultChance = txt(
    '0.16',
    43,
    RED,
    CX,
    P ? -1.65 : -1.48,
    true
  );

  const resultNote = tag(
    '16 IN 100 POSSIBLE WEDNESDAYS',
    C.green,
    CX,
    P ? -2.75 : -2.40,
    18
  );

  await until(S(23));
  await play(
    ...swap([
      resultWednesday,
      resultRoad,
      resultChance,
      resultNote
    ]),
    ...say('WEDNESDAY BUSY: CHANCE 0.16', RED),
    ...fbox([
      'given Monday Clear:',
      ['Wednesday Busy = 0.16', RED],
      '16 percent'
    ], RED)
  );

  // ------------------------------------------------------------
  // Long simulation display
  //
  // Every tile contains ten consecutive simulated days.
  // Teal fraction = number of Clear days / 10.
  // Red fraction = number of Busy days / 10.
  //
  // Within each tile, days are grouped by state to show counts.
  // Their individual chronological order is not depicted.
  // ------------------------------------------------------------

  const GRID_DX = P ? 0.52 : 0.50;
  const GRID_DY = P ? 0.37 : 0.27;

  const GRID_TOP = P ? 0.70 : 0.60;

  const GRID_BOTTOM =
    GRID_TOP - 9 * GRID_DY;

  function aggregateDayTile(
    k,
    clearCount
  ) {
    const x =
      CX + (k % 10 - 4.5) * GRID_DX;

    const y =
      GRID_TOP -
      Math.floor(k / 10) * GRID_DY;

    const w = GRID_DX * 0.84;
    const h = GRID_DY * 0.68;

    const clearW =
      w * clearCount / 10;

    const busyW =
      w - clearW;

    const parts = [];

    if (clearW > 0) {
      parts.push(
        rect(
          clearW,
          h,
          x - w / 2 + clearW / 2,
          y,
          TEAL,
          0.78,
          0
        )
      );
    }

    if (busyW > 0) {
      parts.push(
        rect(
          busyW,
          h,
          x + w / 2 - busyW / 2,
          y,
          RED,
          0.88,
          0
        )
      );
    }

    parts.push(
      rect(
        w, h,
        x, y,
        C.muted,
        0,
        0.7
      )
    );

    return new M.VGroup(...parts);
  }

  function thousandDayRows() {
    const tiles = CLEAR_PER10.map(
      (count, k) =>
        aggregateDayTile(k, count)
    );

    return Array.from(
      { length: 10 },
      (_, r) =>
        new M.VGroup(
          ...tiles.slice(
            r * 10,
            r * 10 + 10
          )
        )
    );
  }

  function shareBar(
    clearShare,
    x, y,
    w,
    h = 0.56
  ) {
    const cw = w * clearShare;
    const bw = w - cw;

    const parts = [];

    if (cw > 0) {
      parts.push(
        rect(
          cw, h,
          x - w / 2 + cw / 2,
          y,
          TEAL,
          0.78,
          0
        )
      );
    }

    if (bw > 0) {
      parts.push(
        rect(
          bw, h,
          x + w / 2 - bw / 2,
          y,
          RED,
          0.88,
          0
        )
      );
    }

    parts.push(
      outline(
        w, h,
        x, y,
        C.muted
      )
    );

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 24: Simulate 1,000 days.
  // ============================================================

  const sim1000Rows = thousandDayRows();

  const sim1000Title = txt(
    '1,000 SIMULATED DAYS',
    P ? 22 : 23,
    C.cyan,
    CX,
    GRID_TOP + 0.60,
    true
  );

  const sim1000Legend = txt(
    'Each tile contains ten days',
    16,
    C.muted,
    CX,
    GRID_BOTTOM - 0.44
  );

  const sim1000StateLegend = new M.VGroup(
    stateTile(
      CLEAR,
      CX - 1.25,
      P ? -3.88 : -2.65,
      1.85,
      0.51
    ),
    stateTile(
      BUSY,
      CX + 1.25,
      P ? -3.88 : -2.65,
      1.85,
      0.51
    )
  );

  await until(S(24));
  await play(
    ...swap([
      sim1000Title,
      sim1000Legend,
      sim1000StateLegend
    ]),
    stagger(
      sim1000Rows,
      1.70,
      0.11
    ),
    ...say('LET THE CHAIN RUN FOR 1,000 DAYS'),
    ...fbox([
      ['seed = 5', C.amber],
      'start Clear',
      '1,000 days in total'
    ])
  );

  // ============================================================
  // 25: 774 Clear days, close to three days in four.
  // ============================================================

  const shareY = P ? -0.53 : -0.46;
  const SHARE_W = P ? 5.75 : 5.95;

  const simulatedShareBar = shareBar(
    CLEAR_SHARE,
    CX,
    shareY,
    SHARE_W,
    0.70
  );

  const simCountClear = txt(
    '774',
    40,
    TEAL,
    CX - 1.45,
    shareY + 0.93,
    true
  );

  const simCountBusy = txt(
    '226',
    40,
    RED,
    CX + 1.48,
    shareY + 0.93,
    true
  );

  const simClearLabel = txt(
    'CLEAR DAYS',
    16,
    TEAL,
    CX - 1.45,
    shareY + 1.47,
    true
  );

  const simBusyLabel = txt(
    'BUSY DAYS',
    16,
    RED,
    CX + 1.48,
    shareY + 1.47,
    true
  );

  const simShareLabel = tag(
    'CLEAR SHARE = 0.774',
    TEAL,
    CX,
    P ? -1.97 : -1.65,
    21
  );

  const closeToThreeQuarters = txt(
    'Close to three days in four',
    P ? 21 : 22,
    C.green,
    CX,
    P ? -2.88 : -2.38
  );

  await until(S(25));
  await play(
    ...swap([
      simulatedShareBar,
      simCountClear,
      simCountBusy,
      simClearLabel,
      simBusyLabel,
      simShareLabel,
      closeToThreeQuarters
    ]),
    ...say('774 CLEAR DAYS OUT OF 1,000', TEAL),
    ...fbox([
      ['Clear = 774', TEAL],
      ['Busy  = 226', RED],
      '774 ÷ 1,000 = 0.774',
      ['close to 0.75', C.green]
    ], TEAL)
  );

  // ============================================================
  // 26–27: Room analogy.
  //
  // A stable crowd size requires equal incoming and outgoing
  // numbers over the relevant period.
  // ============================================================

  const ROOM_X = CX;
  const ROOM_Y = P ? -0.40 : -0.44;

  const ROOM_W = P ? 3.20 : 3.42;
  const ROOM_H = P ? 2.10 : 1.92;

  const roomLeft = ROOM_X - ROOM_W / 2;
  const roomRight = ROOM_X + ROOM_W / 2;

  const roomWalls = new M.VGroup(
    line(
      roomLeft,
      ROOM_Y + ROOM_H / 2,
      roomRight,
      ROOM_Y + ROOM_H / 2,
      C.ink, 3
    ),
    line(
      roomLeft,
      ROOM_Y - ROOM_H / 2,
      roomRight,
      ROOM_Y - ROOM_H / 2,
      C.ink, 3
    ),
    line(
      roomLeft,
      ROOM_Y + ROOM_H / 2,
      roomLeft,
      ROOM_Y + 0.31,
      C.ink, 3
    ),
    line(
      roomLeft,
      ROOM_Y - 0.31,
      roomLeft,
      ROOM_Y - ROOM_H / 2,
      C.ink, 3
    ),
    line(
      roomRight,
      ROOM_Y + ROOM_H / 2,
      roomRight,
      ROOM_Y + 0.31,
      C.ink, 3
    ),
    line(
      roomRight,
      ROOM_Y - 0.31,
      roomRight,
      ROOM_Y - ROOM_H / 2,
      C.ink, 3
    )
  );

  const roomPeople = Array.from(
    { length: 6 },
    (_, k) =>
      person(
        ROOM_X + (k % 3 - 1) * 0.72,
        ROOM_Y +
          (k < 3 ? 0.47 : -0.38),
        C.cyan,
        0.36
      )
  );

  const incomingPerson = person(
    roomLeft - 0.83,
    ROOM_Y,
    TEAL,
    0.36
  );

  const outgoingPerson = person(
    roomRight + 0.40,
    ROOM_Y,
    RED,
    0.36
  );

  const inArrow = arrow(
    roomLeft - 0.53,
    ROOM_Y,
    roomLeft + 0.50,
    ROOM_Y,
    TEAL
  );

  const outArrow = arrow(
    roomRight - 0.45,
    ROOM_Y,
    roomRight + 1.00,
    ROOM_Y,
    RED
  );

  const roomHeading = txt(
    'PEOPLE WALK IN AND OUT',
    P ? 21 : 22,
    C.cyan,
    CX,
    P ? 1.38 : 1.20,
    true
  );

  const roomInLabel = txt(
    'IN',
    18,
    TEAL,
    roomLeft - 0.57,
    ROOM_Y + 0.57,
    true
  );

  const roomOutLabel = txt(
    'OUT',
    18,
    RED,
    roomRight + 0.57,
    ROOM_Y + 0.57,
    true
  );

  await until(S(26));
  await play(
    ...swap([
      roomWalls,
      ...roomPeople,
      incomingPerson,
      outgoingPerson,
      inArrow,
      outArrow,
      roomHeading,
      roomInLabel,
      roomOutLabel
    ]),
    ...say('THINK OF A ROOM WITH PEOPLE MOVING', C.violet),
    ...fbox([
      'people enter',
      'people leave',
      ['the crowd may stay stable', C.violet]
    ], C.violet)
  );

  // 27: If the crowd stays the same size, flows balance.

  const crowdBalanceTag = tag(
    'NUMBER ENTERING = NUMBER LEAVING',
    C.green,
    CX,
    P ? -2.80 : -2.40,
    18
  );

  await until(S(27));
  await play(
    new M.Transform(
      incomingPerson,
      person(
        roomLeft + 0.44,
        ROOM_Y,
        TEAL,
        0.36
      )
    ),
    new M.Transform(
      outgoingPerson,
      person(
        roomRight + 1.02,
        ROOM_Y,
        RED,
        0.36
      )
    ),
    ...add(crowdBalanceTag),
    ...say('A STABLE CROWD NEEDS BALANCED FLOWS', C.green),
    ...fbox([
      ['flow in = flow out', C.green],
      'the size stays the same'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Long-run state flow diagram
  //
  // The size of each reservoir represents its long-run share.
  // The arrows represent transitions between the two states.
  // ------------------------------------------------------------

  const FLOW_X_LEFT = CX - 1.91;
  const FLOW_X_RIGHT = CX + 1.91;

  const FLOW_NODE_Y = P ? -0.47 : -0.43;

  function flowReservoir(
    state,
    fraction,
    x,
    y
  ) {
    const color = STATE_COLORS[state];

    const w = 1.83;

    const h = 1.64;

    const parts = [
      rounded(
        w, h,
        x, y,
        color
      ),
      txt(
        STATE_NAMES[state].toUpperCase(),
        20,
        color,
        x,
        y + 0.48,
        true
      ),
      txt(
        `${Math.round(fraction * 100)}%`,
        33,
        color,
        x,
        y - 0.05,
        true
      ),
      txt(
        state === CLEAR
          ? '3 out of 4'
          : '1 out of 4',
        15,
        C.ink,
        x,
        y - 0.51
      )
    ];

    return new M.VGroup(...parts);
  }

  function flowArrow(
    direction,
    label,
    color,
    yOffset
  ) {
    const x1 = direction > 0
      ? FLOW_X_LEFT + 0.97
      : FLOW_X_RIGHT - 0.97;

    const x2 = direction > 0
      ? FLOW_X_RIGHT - 0.97
      : FLOW_X_LEFT + 0.97;

    const y =
      FLOW_NODE_Y + yOffset;

    return new M.VGroup(
      arrow(
        x1, y,
        x2, y,
        color,
        3
      ),
      txt(
        label,
        17,
        color,
        (x1 + x2) / 2,
        y + (
          direction > 0
            ? 0.26
            : -0.27
        ),
        true,
        1.76
      )
    );
  }

  // ============================================================
  // 28: In the long run, moves into Busy equal moves out.
  // ============================================================

  const flowClearNode = new M.VGroup(
    stateTile(
      CLEAR,
      FLOW_X_LEFT,
      FLOW_NODE_Y,
      1.82,
      1.10
    )
  );

  const flowBusyNode = new M.VGroup(
    stateTile(
      BUSY,
      FLOW_X_RIGHT,
      FLOW_NODE_Y,
      1.82,
      1.10
    )
  );

  const flowIntoBusy = flowArrow(
    1,
    'INTO BUSY',
    RED,
    0.39
  );

  const flowOutOfBusy = flowArrow(
    -1,
    'OUT OF BUSY',
    TEAL,
    -0.39
  );

  const balanceHeading = txt(
    'LONG-RUN BALANCE',
    P ? 23 : 24,
    C.violet,
    CX,
    P ? 1.32 : 1.20,
    true
  );

  const balanceTag = tag(
    'FLOW INTO BUSY = FLOW OUT OF BUSY',
    C.green,
    CX,
    P ? -2.67 : -2.25,
    17
  );

  await until(S(28));
  await play(
    ...swap([
      balanceHeading,
      flowClearNode,
      flowBusyNode,
      flowIntoBusy,
      flowOutOfBusy,
      balanceTag
    ]),
    ...say('BUSY DAYS HAVE A LONG-RUN FLOW BALANCE', C.green),
    ...fbox([
      'in the long run:',
      ['Clear → Busy', RED],
      'balances',
      ['Busy → Clear', TEAL]
    ], C.green)
  );

  // ============================================================
  // 29: Flow from Clear to Busy.
  //
  // Three quarters of days are Clear.
  // One tenth of those days transition to Busy.
  // Therefore the flow is 0.75 × 0.1 = 0.075.
  // ============================================================

  const stationaryClear = flowReservoir(
    CLEAR,
    0.75,
    FLOW_X_LEFT,
    FLOW_NODE_Y
  );

  const stationaryBusy = flowReservoir(
    BUSY,
    0.25,
    FLOW_X_RIGHT,
    FLOW_NODE_Y
  );

  const flowInNumber = flowArrow(
    1,
    '0.075',
    RED,
    0.39
  );

  const flowOutQuestion = flowArrow(
    -1,
    '?',
    TEAL,
    -0.39
  );

  const balanceShareY = P ? -2.35 : -1.88;

  const stationShare = shareBar(
    0.75,
    CX,
    balanceShareY,
    P ? 5.50 : 5.70,
    0.48
  );

  const stationLabels = [
    txt(
      '0.75 CLEAR',
      17,
      TEAL,
      CX - 1.36,
      balanceShareY - 0.40,
      true
    ),
    txt(
      '0.25 BUSY',
      17,
      RED,
      CX + 1.70,
      balanceShareY - 0.40,
      true
    )
  ];

  await until(S(29));
  await play(
    ...remove(
      flowClearNode,
      flowBusyNode,
      flowIntoBusy,
      flowOutOfBusy,
      balanceTag
    ),
    ...add(
      stationaryClear,
      stationaryBusy,
      flowInNumber,
      flowOutQuestion,
      stationShare,
      ...stationLabels
    ),
    ...say('THREE QUARTERS ARE CLEAR', TEAL),
    ...fbox([
      ['Clear share = 0.75', TEAL],
      ['Clear → Busy chance = 0.1', RED]
    ], TEAL)
  );

  await until(S(29) + 4.0);
  await play(
    new M.Indicate(
      flowInNumber,
      { color: RED }
    ),
    ...say('FLOW INTO BUSY: 0.75 × 0.1 = 0.075', RED),
    ...fbox([
      'flow into Busy',
      '  = 0.75 × 0.1',
      ['  = 0.075', RED]
    ], RED)
  );

  // ============================================================
  // 30: Flow from Busy to Clear.
  //
  // A quarter of days are Busy.
  // Three tenths transition to Clear.
  // Therefore the flow is 0.25 × 0.3 = 0.075.
  // ============================================================

  const flowOutNumber = flowArrow(
    -1,
    '0.075',
    TEAL,
    -0.39
  );

  await until(S(30));
  await play(
    ...remove(flowOutQuestion),
    ...add(flowOutNumber),
    ...say('FLOW OUT OF BUSY: 0.25 × 0.3', TEAL),
    ...fbox([
      ['Busy share = 0.25', RED],
      ['Busy → Clear chance = 0.3', TEAL],
      '0.25 × 0.3'
    ], TEAL)
  );

  await until(S(30) + 4.0);
  await play(
    new M.Indicate(
      flowOutNumber,
      { color: TEAL }
    ),
    ...say('0.075 EACH WAY. THE FLOWS BALANCE.', C.green),
    ...fbox([
      ['0.75 × 0.1 = 0.075', RED],
      ['0.25 × 0.3 = 0.075', TEAL],
      ['flow in = flow out', C.green]
    ], C.green)
  );

  // ============================================================
  // 31: The long-run shares are 0.75 and 0.25.
  //
  // Compare the theoretical equilibrium with the seed-5 result.
  // ============================================================

  const QUARTER_Y = P ? 0.55 : 0.58;

  const quarterTiles = [
    CLEAR,
    CLEAR,
    CLEAR,
    BUSY
  ].map((state, k) =>
    new M.VGroup(
      road(
        state,
        CX + (k - 1.5) * 1.43,
        QUARTER_Y,
        1.21,
        0.76
      ),
      txt(
        STATE_NAMES[state],
        16,
        STATE_COLORS[state],
        CX + (k - 1.5) * 1.43,
        QUARTER_Y - 0.67
      )
    )
  );

  const quarterTitle = txt(
    'LONG-RUN PROPORTIONS',
    P ? 21 : 22,
    C.violet,
    CX,
    P ? 1.43 : 1.25,
    true
  );

  const equilibriumY = P ? -1.34 : -0.98;
  const observedY = P ? -2.90 : -2.16;

  const equilibriumBar = shareBar(
    0.75,
    CX,
    equilibriumY,
    5.65,
    0.49
  );

  const observedBar = shareBar(
    CLEAR_SHARE,
    CX,
    observedY,
    5.65,
    0.49
  );

  const equilibriumText = txt(
    'MODEL: 0.75 CLEAR · 0.25 BUSY',
    17,
    C.green,
    CX,
    equilibriumY + 0.48,
    true
  );

  const observedText = txt(
    'SIMULATION: 0.774 CLEAR · 0.226 BUSY',
    16,
    C.cyan,
    CX,
    observedY + 0.48,
    true
  );

  await until(S(31));
  await play(
    ...swap([
      quarterTitle,
      ...quarterTiles,
      equilibriumBar,
      equilibriumText,
      observedBar,
      observedText
    ]),
    ...say('LONG RUN: THREE QUARTERS CLEAR, ONE QUARTER BUSY', C.green),
    ...fbox([
      ['Clear = 0.75', TEAL],
      ['Busy  = 0.25', RED],
      'long-run shares',
      'not a fixed weekly pattern'
    ], C.green)
  );

  // ------------------------------------------------------------
  // State diagram helpers
  //
  // Draw the two directions as separate arrows.
  // Self-transitions are represented by loops.
  // ------------------------------------------------------------

  function loopArrow(
    x, y,
    radius,
    color,
    direction = 1
  ) {
    const steps = 32;

    const start = direction > 0
      ? -0.85 * Math.PI
      : -0.15 * Math.PI;

    const sweep = direction > 0
      ? -1.70 * Math.PI
      : 1.70 * Math.PI;

    const parts = [];

    let px = x + radius * Math.cos(start);
    let py = y + radius * Math.sin(start);

    for (let k = 1; k <= steps; k++) {
      const a =
        start + sweep * k / steps;

      const xx =
        x + radius * Math.cos(a);

      const yy =
        y + radius * Math.sin(a);

      if (k === steps) {
        parts.push(
          arrow(
            px, py,
            xx, yy,
            color,
            2.3
          )
        );
      } else {
        parts.push(
          line(
            px, py,
            xx, yy,
            color,
            2.3
          )
        );
      }

      px = xx;
      py = yy;
    }

    return new M.VGroup(...parts);
  }

  function markovDiagram(
    y = P ? -0.70 : -0.70,
    scale = 1
  ) {
    const x1 = CX - 1.79 * scale;
    const x2 = CX + 1.79 * scale;

    const w = 1.78 * scale;
    const h = 0.85 * scale;

    const topY = y + 0.25 * scale;
    const bottomY = y - 0.25 * scale;

    const loopR = 0.43 * scale;
    const loopY = y + 0.85 * scale;

    const parts = [
      stateTile(
        CLEAR,
        x1, y,
        w, h
      ),
      stateTile(
        BUSY,
        x2, y,
        w, h
      ),

      arrow(
        x1 + w / 2 + 0.06,
        topY,
        x2 - w / 2 - 0.06,
        topY,
        RED,
        2.8
      ),

      txt(
        '0.1',
        19,
        RED,
        CX,
        topY + 0.26 * scale,
        true
      ),

      arrow(
        x2 - w / 2 - 0.06,
        bottomY,
        x1 + w / 2 + 0.06,
        bottomY,
        TEAL,
        2.8
      ),

      txt(
        '0.3',
        19,
        TEAL,
        CX,
        bottomY - 0.28 * scale,
        true
      ),

      loopArrow(
        x1,
        loopY,
        loopR,
        TEAL,
        1
      ),

      loopArrow(
        x2,
        loopY,
        loopR,
        RED,
        -1
      ),

      txt(
        '0.9',
        19,
        TEAL,
        x1,
        loopY + loopR + 0.26,
        true
      ),

      txt(
        '0.7',
        19,
        RED,
        x2,
        loopY + loopR + 0.26,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 32: Name the Markov chain.
  // ============================================================

  const markovName = txt(
    'MARKOV CHAIN',
    P ? 31 : 34,
    C.violet,
    CX,
    P ? 1.50 : 1.35,
    true
  );

  const markovNameDiagram = markovDiagram(
    P ? -0.78 : -0.80
  );

  const markovNameNote = txt(
    'Named after the mathematician Markov',
    P ? 19 : 20,
    C.ink,
    CX,
    P ? -2.54 : -2.24
  );

  await until(S(32));
  await play(
    ...swap([
      markovName,
      markovNameDiagram,
      markovNameNote
    ]),
    ...say('A SYSTEM LIKE THIS IS A MARKOV CHAIN', C.violet),
    ...fbox([
      ['Markov chain', C.violet],
      'states',
      'transition probabilities'
    ], C.violet)
  );

  // ============================================================
  // 33: Tomorrow depends only on today's state.
  // ============================================================

  const MEMORY_Y = P ? -0.35 : -0.38;

  const memoryXs = [
    CX - 2.38,
    CX - 0.79,
    CX + 0.79,
    CX + 2.38
  ];

  function memoryDay(
    k, name,
    state = null,
    faded = false
  ) {
    const x = memoryXs[k];

    const color = faded
      ? C.muted
      : state === null
        ? C.amber
        : STATE_COLORS[state];

    return new M.VGroup(
      txt(
        name,
        14,
        color,
        x,
        MEMORY_Y + 0.76,
        true,
        1.53
      ),
      rounded(
        1.38,
        0.91,
        x,
        MEMORY_Y,
        color,
        color,
        faded ? 0.035 : 0.13
      ),
      txt(
        state === null
          ? '?'
          : STATE_NAMES[state],
        19,
        color,
        x,
        MEMORY_Y,
        true,
        1.23
      )
    );
  }

  const oldDay1 = memoryDay(
    0,
    '2 DAYS AGO',
    BUSY,
    true
  );

  const oldDay2 = memoryDay(
    1,
    'YESTERDAY',
    CLEAR,
    true
  );

  const currentDay = memoryDay(
    2,
    'TODAY',
    BUSY
  );

  const futureDay = memoryDay(
    3,
    'TOMORROW',
    null
  );

  const recentArrow = arrow(
    memoryXs[2] + 0.72,
    MEMORY_Y,
    memoryXs[3] - 0.72,
    MEMORY_Y,
    RED
  );

  const todayHighlight = outline(
    1.52,
    1.06,
    memoryXs[2],
    MEMORY_Y,
    RED
  );

  const oldHistoryNote = txt(
    'Earlier days are not needed',
    17,
    C.muted,
    CX - 1.56,
    MEMORY_Y - 1.08,
    false,
    3.05
  );

  const memoryRule = tag(
    'GIVEN TODAY, NO EARLIER HISTORY IS NEEDED',
    C.green,
    CX,
    P ? -2.65 : -2.24,
    16
  );

  await until(S(33));
  await play(
    ...swap([
      oldDay1,
      oldDay2,
      currentDay,
      futureDay,
      recentArrow,
      todayHighlight,
      oldHistoryNote,
      memoryRule
    ]),
    ...say('TOMORROW DEPENDS ONLY ON TODAY', C.green),
    ...fbox([
      'given today’s state:',
      'tomorrow does not depend',
      ['on earlier states', C.green]
    ], C.green)
  );

  // ============================================================
  // 34: The short version.
  // Read tomorrow's chances from today's row.
  // ============================================================

  const ruleTable = tableLayout(
    CX,
    P ? -0.61 : -0.57,
    1
  );

  const ruleTableObjects = fullTable(
    ruleTable,
    BUSY
  );

  const ruleTodayTag = tag(
    'IF TODAY IS BUSY...',
    RED,
    CX,
    P ? -2.61 : -2.18,
    17
  );

  const ruleTomorrowTag = tag(
    '...READ THE BUSY ROW',
    C.green,
    CX,
    P ? -3.34 : -2.75,
    17
  );

  await until(S(34));
  await play(
    ...swap([
      ...ruleTableObjects,
      ruleTodayTag,
      ruleTomorrowTag
    ]),
    ...say('READ TOMORROW’S CHANCES FROM TODAY’S ROW', C.violet),
    ...fbox([
      'P(tomorrow | today)',
      ['= entry in today’s row', C.violet],
      'nothing else is required'
    ], C.violet)
  );

  // ============================================================
  // 35: No memory of last week is needed.
  //
  // Two different histories lead to the same current state.
  // Their tomorrow probabilities are consequently identical
  // under this Markov model.
  // ============================================================

  const HISTORY_A = [
    CLEAR,
    CLEAR,
    BUSY,
    CLEAR,
    BUSY
  ];

  const HISTORY_B = [
    BUSY,
    BUSY,
    CLEAR,
    BUSY,
    BUSY
  ];

  function historyRow(
    states,
    y,
    label
  ) {
    const parts = [
      txt(
        label,
        15,
        C.muted,
        CX - 1.75,
        y + 0.49,
        true
      )
    ];

    states.forEach((state, k) => {
      const x =
        CX - 2.56 + k * 0.66;

      const color =
        k === states.length - 1
          ? STATE_COLORS[state]
          : C.muted;

      parts.push(
        cell(
          state === CLEAR ? 'C' : 'B',
          x, y,
          color,
          0.54,
          0.49
        )
      );
    });

    parts.push(
      arrow(
        CX + 0.35,
        y,
        CX + 0.91,
        y,
        C.green
      ),
      txt(
        '0.3 Clear',
        17,
        TEAL,
        CX + 1.90,
        y + 0.18,
        true,
        1.89
      ),
      txt(
        '0.7 Busy',
        17,
        RED,
        CX + 1.90,
        y - 0.19,
        true,
        1.89
      )
    );

    return new M.VGroup(...parts);
  }

  const historyExampleA = historyRow(
    HISTORY_A,
    P ? 0.45 : 0.39,
    'HISTORY A'
  );

  const historyExampleB = historyRow(
    HISTORY_B,
    P ? -1.20 : -0.95,
    'HISTORY B'
  );

  const sameTodayTag = tag(
    'SAME TODAY → SAME TOMORROW CHANCES',
    C.green,
    CX,
    P ? -2.72 : -2.34,
    17
  );

  await until(S(35));
  await play(
    ...swap([
      historyExampleA,
      historyExampleB,
      sameTodayTag
    ]),
    ...say('NO MEMORY OF LAST WEEK IS NEEDED', C.green),
    ...fbox([
      'different past histories',
      ['same current state: Busy', RED],
      'same tomorrow probabilities'
    ], C.green)
  );

  // ============================================================
  // 36: What is a Markov chain useful for?
  // Any suitable system moving between states step by step.
  // ============================================================

  const abstractStates = [
    [CX - 2.05, P ? 0.02 : -0.05],
    [CX, P ? 0.02 : -0.05],
    [CX + 2.05, P ? 0.02 : -0.05]
  ];

  const abstractColors = [
    C.cyan,
    C.violet,
    C.amber
  ];

  const abstractNodes = abstractStates.map(
    ([x, y], k) =>
      new M.VGroup(
        rounded(
          1.52,
          1.04,
          x, y,
          abstractColors[k]
        ),
        txt(
          ['A', 'B', 'C'][k],
          31,
          abstractColors[k],
          x, y,
          true
        )
      )
  );

  const abstractArrows = [
    arrow(
      abstractStates[0][0] + 0.82,
      abstractStates[0][1],
      abstractStates[1][0] - 0.82,
      abstractStates[1][1],
      C.muted
    ),
    arrow(
      abstractStates[1][0] + 0.82,
      abstractStates[1][1],
      abstractStates[2][0] - 0.82,
      abstractStates[2][1],
      C.muted
    )
  ];

  const abstractNote = txt(
    'A few states and rules for moving between them',
    P ? 19 : 20,
    C.ink,
    CX,
    P ? -1.77 : -1.52
  );

  await until(S(36));
  await play(
    ...swap([
      ...abstractNodes,
      ...abstractArrows,
      abstractNote
    ]),
    ...say('SYSTEMS THAT MOVE BETWEEN STATES', C.violet),
    ...fbox([
      'a few possible states',
      'rules for moving',
      ['one step at a time', C.violet]
    ], C.violet)
  );

  // ============================================================
  // 37: Applications.
  // Traffic, weather, web browsing and machines.
  //
  // These cards illustrate possible state descriptions.
  // They do not specify transition probabilities for new models.
  // ============================================================

  const APP_XS = [
    CX - 1.57,
    CX + 1.57
  ];

  const APP_YS = P
    ? [0.55, -2.02]
    : [0.53, -1.51];

  const APP_W = 2.89;
  const APP_H = P ? 1.98 : 1.74;

  function applicationCard(
    title,
    first,
    second,
    k,
    color
  ) {
    const x = APP_XS[k % 2];
    const y = APP_YS[Math.floor(k / 2)];

    return new M.VGroup(
      rounded(
        APP_W,
        APP_H,
        x, y,
        color
      ),
      txt(
        title,
        19,
        color,
        x,
        y + APP_H * 0.32,
        true,
        APP_W - 0.18
      ),
      cell(
        first,
        x - 0.67,
        y - 0.05,
        C.cyan,
        1.13,
        0.58
      ),
      cell(
        second,
        x + 0.67,
        y - 0.05,
        C.violet,
        1.13,
        0.58
      ),
      txt(
        '↔',
        20,
        C.muted,
        x,
        y - 0.05,
        true
      ),
      txt(
        'possible states',
        14,
        C.muted,
        x,
        y - APP_H * 0.34
      )
    );
  }

  const applicationCards = [
    applicationCard(
      'TRAFFIC',
      'Clear',
      'Busy',
      0,
      TEAL
    ),
    applicationCard(
      'WEATHER',
      'Dry',
      'Rain',
      1,
      BLUE
    ),
    applicationCard(
      'WEB PAGES',
      'Page A',
      'Page B',
      2,
      C.violet
    ),
    applicationCard(
      'MACHINE',
      'Working',
      'Broken',
      3,
      C.amber
    )
  ];

  await until(S(37));
  await play(
    ...swap([]),
    stagger(
      applicationCards,
      2.20,
      0.24
    ),
    ...say('TRAFFIC, WEATHER, WEB PAGES, MACHINES'),
    ...fbox([
      'traffic conditions',
      'weather states',
      'customer journeys',
      'machine reliability'
    ])
  );

  // ============================================================
  // 38: With a table and a seed, simulate many days quickly.
  // ============================================================

  const fastSimTable = tableLayout(
    CX,
    P ? 0.08 : 0.13,
    P ? 0.66 : 0.61
  );

  const fastSimTableParts = fullTable(
    fastSimTable
  );

  const fastSeedTag = tag(
    'SEED = 5',
    C.amber,
    CX,
    P ? -1.02 : -0.82,
    17
  );

  const fastSimArrow = arrow(
    CX,
    P ? -1.37 : -1.14,
    CX,
    P ? -1.85 : -1.50,
    C.green
  );

  const fastTilesY = P ? -2.30 : -1.83;

  const fastSimTiles = Array.from(
    { length: 10 },
    (_, k) => {
      const x =
        CX + (k - 4.5) * 0.54;

      return shareBar(
        CLEAR_PER100[k] / 100,
        x,
        fastTilesY,
        0.47,
        0.45
      );
    }
  );

  const fastSimResult = txt(
    '10 blocks × 100 days = 1,000 days',
    17,
    C.green,
    CX,
    P ? -3.07 : -2.55,
    true
  );

  await until(S(38));
  await play(
    ...swap([
      ...fastSimTableParts,
      fastSeedTag,
      fastSimArrow
    ]),
    stagger(
      fastSimTiles,
      0.85,
      0.07
    ),
    ...add(fastSimResult),
    ...say('A TABLE AND A SEED CAN SIMULATE MONTHS'),
    ...fbox([
      'transition table',
      ['+ seed', C.amber],
      ['→ a simulated history', C.green]
    ], C.green)
  );

  // ============================================================
  // 39: Common trap — the chain only remembers today.
  // ============================================================

  const trapDiagram = markovDiagram(
    P ? -0.71 : -0.78
  );

  const trapName = txt(
    'ONLY THE CURRENT STATE',
    P ? 23 : 24,
    C.amber,
    CX,
    P ? 1.49 : 1.31,
    true
  );

  const trapWarning = tag(
    'THE MARKOV ASSUMPTION MAY BE TOO SIMPLE',
    RED,
    CX,
    P ? -2.75 : -2.35,
    16
  );

  await until(S(39));
  await play(
    ...swap([
      trapName,
      trapDiagram,
      trapWarning
    ]),
    ...say('TRAP: THE CHAIN ONLY REMEMBERS TODAY', RED),
    ...fbox([
      'our model remembers',
      ['only Clear or Busy', C.amber],
      'is that enough information?'
    ], RED)
  );

  // ============================================================
  // 40: Roadworks can make traffic persist for several days.
  //
  // An illustrative week-long roadworks event.
  // The ordinary two-state table cannot distinguish a new
  // congestion episode from one already several days old.
  // ============================================================

  const worksWeekY = P ? 0.48 : 0.55;

  const worksDays = DAYS.map(
    (_, k) =>
      weekDay(
        k,
        BUSY,
        worksWeekY
      )
  );

  const worksWeekTitle = txt(
    'ROADWORKS LAST ALL WEEK',
    P ? 22 : 23,
    C.amber,
    CX,
    P ? 1.65 : 1.43,
    true
  );

  const worksBracketY =
    worksWeekY - 0.72;

  const worksBracket = new M.VGroup(
    line(
      weekX(0) - WEEK_W / 2,
      worksBracketY,
      weekX(6) + WEEK_W / 2,
      worksBracketY,
      C.amber,
      2.8
    ),
    line(
      weekX(0) - WEEK_W / 2,
      worksBracketY,
      weekX(0) - WEEK_W / 2,
      worksBracketY + 0.17,
      C.amber,
      2
    ),
    line(
      weekX(6) + WEEK_W / 2,
      worksBracketY,
      weekX(6) + WEEK_W / 2,
      worksBracketY + 0.17,
      C.amber,
      2
    )
  );

  const WORKS_ROAD_Y = P ? -1.70 : -1.40;

  const worksRoad = road(
    BUSY,
    CX,
    WORKS_ROAD_Y,
    4.65,
    0.90
  );

  const worksBarrier = new M.VGroup(
    rect(
      0.16,
      0.85,
      CX + 1.20,
      WORKS_ROAD_Y,
      C.amber,
      0.90,
      1
    ),
    rect(
      0.16,
      0.85,
      CX + 1.51,
      WORKS_ROAD_Y,
      C.amber,
      0.90,
      1
    ),
    line(
      CX + 1.08,
      WORKS_ROAD_Y - 0.18,
      CX + 1.62,
      WORKS_ROAD_Y + 0.18,
      C.amber,
      5
    )
  );

  const worksProblem = txt(
    'How long has the road already been busy?',
    P ? 20 : 21,
    C.amber,
    CX,
    P ? -3.13 : -2.53
  );

  await until(S(40));
  await play(
    ...swap([
      worksWeekTitle,
      ...worksDays,
      worksBracket,
      worksRoad,
      worksBarrier,
      worksProblem
    ]),
    ...say('ROADWORKS CAN MAKE THE PAST MATTER', C.amber),
    ...fbox([
      'roadworks last a week',
      'the duration of congestion',
      ['may affect tomorrow', C.amber],
      'two states may miss this'
    ], C.amber)
  );

  // ============================================================
  // 41: Use richer states to capture relevant history.
  //
  // No new transition probabilities are invented.
  // The richer model would require additional observations.
  // ============================================================

  const richerTopY = P ? 0.75 : 0.70;

  const richerClear = new M.VGroup(
    rounded(
      P ? 5.55 : 5.75,
      0.90,
      CX,
      richerTopY,
      TEAL
    ),
    road(
      CLEAR,
      CX - 1.66,
      richerTopY,
      1.73,
      0.52
    ),
    txt(
      'CLEAR',
      23,
      TEAL,
      CX + 0.71,
      richerTopY,
      true
    )
  );

  const richerBusyY = P ? -0.87 : -0.65;

  const richerBusyOne = new M.VGroup(
    rounded(
      P ? 5.55 : 5.75,
      0.90,
      CX,
      richerBusyY,
      RED
    ),
    road(
      BUSY,
      CX - 1.66,
      richerBusyY,
      1.73,
      0.52
    ),
    txt(
      'BUSY FOR ONE DAY',
      20,
      RED,
      CX + 0.68,
      richerBusyY,
      true,
      3.06
    )
  );

  const richerSeveralY =
    P ? -2.49 : -2.00;

  const richerBusySeveral = new M.VGroup(
    rounded(
      P ? 5.55 : 5.75,
      0.90,
      CX,
      richerSeveralY,
      C.amber
    ),
    road(
      BUSY,
      CX - 1.66,
      richerSeveralY,
      1.73,
      0.52
    ),
    txt(
      'BUSY FOR SEVERAL DAYS',
      19,
      C.amber,
      CX + 0.68,
      richerSeveralY,
      true,
      3.06
    )
  );

  const richerNote = txt(
    'New states need new transition chances',
    16,
    C.muted,
    CX,
    P ? -3.64 : -2.77
  );

  await until(S(41));
  await play(
    ...swap([richerNote]),
    stagger(
      [
        richerClear,
        richerBusyOne,
        richerBusySeveral
      ],
      1.80,
      0.23
    ),
    ...say('USE RICHER STATES WHEN HISTORY MATTERS', C.green),
    ...fbox([
      ['Clear', TEAL],
      ['Busy for one day', RED],
      ['Busy for several days', C.amber],
      'estimate a new table'
    ], C.green)
  );

  // ============================================================
  // 42: Final one-picture summary.
  //
  // A Markov chain moves between states using a transition table.
  // Given today's state, earlier days do not alter tomorrow's
  // transition probabilities.
  // ============================================================

  const FINAL_DIAGRAM_Y =
    P ? 0.02 : 0.04;

  const finalDiagram = markovDiagram(
    FINAL_DIAGRAM_Y,
    P ? 0.83 : 0.76
  );

  const finalTableLayout = tableLayout(
    CX,
    P ? -2.45 : -2.25,
    P ? 0.80 : 0.70
  );

  const finalTable = fullTable(
    finalTableLayout
  );

  const finalMarkovTitle = txt(
    'MARKOV CHAIN',
    P ? 25 : 25,
    C.violet,
    CX,
    P ? 1.76 : 1.42,
    true
  );

  const finalRuleTag = tag(
    'TOMORROW DEPENDS ONLY ON TODAY',
    C.green,
    CX,
    P ? -4.22 : -3.45,
    17
  );

  const finalLongRun = new M.VGroup(
    txt(
      'LONG RUN',
      16,
      C.muted,
      CX,
      -4.81,
      true
    ),
    shareBar(
      0.75,
      CX,
      -5.10,
      5.08,
      0.26
    ),
    txt(
      '0.75 Clear',
      17,
      TEAL,
      CX - 1.41,
      -5.42,
      true
    ),
    txt(
      '0.25 Busy',
      17,
      RED,
      CX + 1.48,
      -5.42,
      true
    )
  );

  await until(S(42));
  await play(
    ...swap(P ? [
      finalMarkovTitle,
      finalDiagram
    ] : [finalDiagram]),
    ...say('A MARKOV CHAIN MOVES FROM STATE TO STATE', C.violet),
    ...fbox([
      ['Markov chain', C.violet],
      'states and transitions'
    ], C.violet)
  );

  await until(S(42) + 2.3);
  await play(
    ...add(...finalTable),
    ...say('USE A TRANSITION TABLE'),
    ...fbox([
      'each row: today',
      'each column: tomorrow',
      ['each entry: a chance', C.cyan]
    ])
  );

  await until(S(42) + 4.6);
  await play(
    ...add(finalRuleTag),
    ...say('TOMORROW DEPENDS ONLY ON TODAY', C.green),
    ...fbox([
      ['given today’s state', C.green],
      'read tomorrow’s chances',
      'from today’s row'
    ], C.green)
  );

  await until(S(42) + 6.2);
  await play(
    ...(P ? add(finalLongRun) : []),
    new M.Indicate(
      finalDiagram,
      {
        color: C.violet,
        runTime: 0.65
      }
    ),
    ...say('STATES → TRANSITIONS → A SIMULATED HISTORY', C.violet),
    ...fbox([
      ['Wednesday Busy = 0.16', RED],
      'long-run shares:',
      ['Clear = 0.75', TEAL],
      ['Busy  = 0.25', RED]
    ], C.violet)
  );

  await until(E(42));
}

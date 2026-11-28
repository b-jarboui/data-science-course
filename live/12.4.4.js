// lesson 12.4.4
// Precision and recall — live, narration-synchronised lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser playback has not been verified here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Fixed chapter data.
  const DATA = [
    { id: 'P1',  actual: 12, a: 18, b: 14, prob: 90, failed: false },
    { id: 'P2',  actual: 8,  a: 8,  b: 10, prob: 60, failed: true  },
    { id: 'P3',  actual: 14, a: 14, b: 12, prob: 60, failed: false },
    { id: 'P4',  actual: 6,  a: 8,  b: 7,  prob: 30, failed: true  },
    { id: 'P5',  actual: 16, a: 15, b: 14, prob: 30, failed: false },
    { id: 'P6',  actual: 20, a: 22, b: 20, prob: 30, failed: false },
    { id: 'P7',  actual: 18, a: 17, b: 20, prob: 10, failed: false },
    { id: 'P8',  actual: 22, a: 22, b: 21, prob: 10, failed: false },
    { id: 'P9',  actual: 24, a: 25, b: 24, prob: 10, failed: false },
    { id: 'P10', actual: 26, a: 24, b: 25, prob: 10, failed: false },
    { id: 'P11', actual: 28, a: 28, b: 28, prob: 10, failed: false },
    { id: 'P12', actual: 30, a: 31, b: 30, prob: 10, failed: false }
  ];

  const IDS = DATA.map((_, i) => i);

  const FAILURES = IDS.filter(i => DATA[i].failed);
  const SAFE = IDS.filter(i => !DATA[i].failed);

  function evaluate(threshold) {
    const alerts = IDS.filter(i =>
      DATA[i].prob >= threshold
    );

    const tp = FAILURES.filter(i =>
      alerts.includes(i)
    );

    const fp = SAFE.filter(i =>
      alerts.includes(i)
    );

    const fn = FAILURES.filter(i =>
      !alerts.includes(i)
    );

    const tn = SAFE.filter(i =>
      !alerts.includes(i)
    );

    return {
      threshold,
      alerts,
      tp,
      fp,
      fn,
      tn,

      precision: alerts.length
        ? tp.length / alerts.length
        : null,

      recall: tp.length / FAILURES.length
    };
  }

  const R60 = evaluate(60);
  const R30 = evaluate(30);
  const R10 = evaluate(10);

  const NEW_ALERTS = R30.alerts.filter(i =>
    !R60.alerts.includes(i)
  );

  const pct = v =>
    v === null
      ? 'undefined'
      : `${Math.round(v * 100)}%`;

  // Fixed chapter visual meanings.
  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;

  // Responsive laptop / phone layout.
  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.48, 0]
    : [4.3, -0.30, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  function text(
    s, size, color, x, y,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

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

  function rect(x, y, w, h, color, opacity = 0.2, sw = 2) {
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
    x, y, w, h,
    color = C.muted,
    fill = C.card,
    opacity = 0.95,
    sw = 2,
    radius = 0.12
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: sw
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(x, y, radius, color, opacity = 1, sw = 2) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function lag(anims, runTime = 1.2, lagRatio = 0.12) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
    });
  }

  const fadeIn = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  // ------------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20;
    const lh = P ? 0.32 : 0.40;

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

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.35;

    const r = rounded(
      BOXP[0],
      BOXP[1],
      wd,
      ht,
      color,
      C.card,
      0.95,
      2,
      0.18
    );

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

    const maxw = P ? FW - 1.2 : 4.10;
    const maxh = P ? 1.38 : 2.30;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const anims = [];

    if (boxNow) {
      anims.push(new M.FadeOut(boxNow));
    }

    anims.push(new M.FadeIn(g));

    boxNow = g;

    return anims;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Shared chapter icon language.
  // ------------------------------------------------------------

  // Water pump: motor, housing, inlet, outlet and feet.
  function pumpIcon(x, y, s = 1, color = C.cyan) {
    const motor = rounded(
      x - 0.29 * s,
      y,
      0.60 * s,
      0.40 * s,
      color,
      color,
      0.14,
      2,
      0.07 * s
    );

    const fins = [-0.47, -0.35, -0.23].map(dx =>
      line(
        x + dx * s,
        y - 0.13 * s,
        x + dx * s,
        y + 0.13 * s,
        color,
        1.3
      )
    );

    const housing = circle(
      x + 0.19 * s,
      y,
      0.27 * s,
      color,
      0.12
    );

    const inlet = rect(
      x + 0.51 * s,
      y,
      0.20 * s,
      0.15 * s,
      color,
      0.15,
      1.5
    );

    const outlet = rect(
      x + 0.19 * s,
      y + 0.36 * s,
      0.17 * s,
      0.26 * s,
      color,
      0.15,
      1.5
    );

    const hub = circle(
      x + 0.19 * s,
      y,
      0.06 * s,
      color,
      1,
      1
    );

    const foot1 = rect(
      x - 0.29 * s,
      y - 0.26 * s,
      0.22 * s,
      0.10 * s,
      color,
      0.35,
      1
    );

    const foot2 = rect(
      x + 0.19 * s,
      y - 0.26 * s,
      0.22 * s,
      0.10 * s,
      color,
      0.35,
      1
    );

    return new M.VGroup(
      motor,
      ...fins,
      housing,
      inlet,
      outlet,
      hub,
      foot1,
      foot2
    );
  }

  // Amber bell = alert raised.
  function bellIcon(x, y, s = 1) {
    const r = 0.095 * s;

    const dome = new M.Circle({ radius: r, color: AMBER, strokeWidth: 2 });
    dome.setFill(AMBER, 0);

    dome.moveTo([
      x,
      y + 0.035 * s,
      0
    ]);

    const sideL = line(
      x - r,
      y + 0.02 * s,
      x - 0.12 * s,
      y - 0.085 * s,
      AMBER,
      2
    );

    const sideR = line(
      x + r,
      y + 0.02 * s,
      x + 0.12 * s,
      y - 0.085 * s,
      AMBER,
      2
    );

    const rim = line(
      x - 0.135 * s,
      y - 0.085 * s,
      x + 0.135 * s,
      y - 0.085 * s,
      AMBER,
      2.5
    );

    const top = circle(
      x,
      y + 0.14 * s,
      0.024 * s,
      AMBER,
      1,
      1
    );

    const clapper = circle(
      x,
      y - 0.135 * s,
      0.030 * s,
      AMBER,
      1,
      1
    );

    return new M.VGroup(
      dome,
      sideL,
      sideR,
      rim,
      top,
      clapper
    );
  }

  // Red filled diamond = actual failure.
  function failureIcon(x, y, s = 1) {
    const d = new M.Rectangle({
      width: 0.17 * s,
      height: 0.17 * s,
      color: RED,
      strokeWidth: 1.5
    });

    d.setFill(RED, 1);
    d.rotate(Math.PI / 4);
    d.moveTo([x, y, 0]);

    return d;
  }

  // Green outlined circle = no failure within ten hours.
  function safeIcon(x, y, s = 1) {
    return circle(
      x,
      y,
      0.11 * s,
      GREEN,
      0,
      2.4
    );
  }

  function workerIcon(x, y, s = 1) {
    const head = circle(
      x,
      y + 0.34 * s,
      0.14 * s,
      WHITE,
      0.9,
      1.5
    );

    const body = new M.Arc({
      radius: 0.26 * s,
      startAngle: 0,
      angle: Math.PI,
      color: WHITE,
      strokeWidth: 2
    });

    body.setFill(WHITE, 0.9);

    body.moveTo([
      x,
      y + 0.02 * s,
      0
    ]);

    const helmet = new M.Arc({
      radius: 0.17 * s,
      startAngle: 0,
      angle: Math.PI,
      color: AMBER,
      strokeWidth: 3
    });

    helmet.setFill(AMBER, 0.9);

    helmet.moveTo([
      x,
      y + 0.43 * s,
      0
    ]);

    const brim = line(
      x - 0.20 * s,
      y + 0.39 * s,
      x + 0.20 * s,
      y + 0.39 * s,
      AMBER,
      3
    );

    return new M.VGroup(
      body,
      head,
      helmet,
      brim
    );
  }

  function clockIcon(x, y, s = 1, color = C.muted) {
    const face = circle(
      x,
      y,
      0.28 * s,
      color,
      0,
      2.5
    );

    const hand1 = line(
      x,
      y,
      x,
      y + 0.17 * s,
      color,
      2.5
    );

    const hand2 = line(
      x,
      y,
      x + 0.13 * s,
      y - 0.08 * s,
      color,
      2.5
    );

    const hub = circle(
      x,
      y,
      0.025 * s,
      color,
      1,
      1
    );

    return new M.VGroup(
      face,
      hand1,
      hand2,
      hub
    );
  }

  // ------------------------------------------------------------
  // Pump cards.
  //
  // Components remain independent scene objects.
  // No already-visible objects are wrapped in a new VGroup.
  //
  // Separate card instances may represent the same pump when
  // comparing the precision and recall denominator groups.
  // ------------------------------------------------------------

  const CARD_W = 1.24;
  const CARD_H = 1.10;

  function cardBase(i, x, y, s) {
    const frame = rounded(
      x,
      y,
      CARD_W * s,
      CARD_H * s,
      C.muted,
      C.card,
      0.96,
      1.6,
      0.10 * s
    );

    const label = text(
      DATA[i].id,
      Math.max(12, Math.round(19 * s)),
      C.ink,
      x - 0.16 * s,
      y + 0.32 * s,
      true,
      0.65 * s
    );

    const icon = pumpIcon(
      x - 0.18 * s,
      y - 0.015 * s,
      0.46 * s,
      C.cyan
    );

    const divider = line(
      x - 0.48 * s,
      y - 0.22 * s,
      x + 0.48 * s,
      y - 0.22 * s,
      C.muted,
      1
    );

    return new M.VGroup(
      frame,
      label,
      icon,
      divider
    );
  }

  function chanceLabel(i, x, y, s) {
    return text(
      `${DATA[i].prob}%`,
      Math.max(12, Math.round(19 * s)),
      BLUE,
      x,
      y - 0.36 * s,
      true,
      0.80 * s
    );
  }

  function alertMark(x, y, s) {
    const outline = rounded(
      x,
      y,
      CARD_W * s + 0.045,
      CARD_H * s + 0.045,
      AMBER,
      AMBER,
      0,
      2.5,
      0.10 * s
    );

    const bell = bellIcon(
      x + 0.38 * s,
      y + 0.28 * s,
      0.92 * s
    );

    return new M.VGroup(
      outline,
      bell
    );
  }

  function outcomeMark(i, x, y, s) {
    const xx = x + 0.37 * s;
    const yy = y - 0.055 * s;

    return DATA[i].failed
      ? failureIcon(xx, yy, s)
      : safeIcon(xx, yy, s);
  }

  function newCard(i) {
    return {
      i,
      x: 0,
      y: 0,
      s: 1,

      visible: false,

      hasChance: false,
      alerted: false,
      hasOutcome: false,

      base: null,
      chance: null,
      alert: null,
      outcome: null
    };
  }

  const cards = IDS.map(i =>
    newCard(i)
  );

  function cardObjects(c) {
    return [
      c.base,
      c.chance,
      c.alert,
      c.outcome
    ].filter(Boolean);
  }

  function placeCard(c, p, s = 1) {
    const x = p[0];
    const y = p[1];

    const anims = [];

    if (!c.visible) {
      c.base = cardBase(c.i, x, y, s);

      c.chance = c.hasChance
        ? chanceLabel(c.i, x, y, s)
        : null;

      c.alert = c.alerted
        ? alertMark(x, y, s)
        : null;

      c.outcome = c.hasOutcome
        ? outcomeMark(c.i, x, y, s)
        : null;

      anims.push(
        ...fadeIn(cardObjects(c))
      );

      c.visible = true;
    } else {
      anims.push(
        new M.Transform(
          c.base,
          cardBase(c.i, x, y, s)
        )
      );

      if (c.chance) {
        anims.push(
          new M.Transform(
            c.chance,
            chanceLabel(c.i, x, y, s)
          )
        );
      }

      if (c.alert) {
        anims.push(
          new M.Transform(
            c.alert,
            alertMark(x, y, s)
          )
        );
      }

      if (c.outcome) {
        anims.push(
          new M.Transform(
            c.outcome,
            outcomeMark(c.i, x, y, s)
          )
        );
      }
    }

    c.x = x;
    c.y = y;
    c.s = s;

    return anims;
  }

  function hideCard(c) {
    if (!c.visible) return [];

    const anims = fadeOut(cardObjects(c));

    c.visible = false;

    c.base = null;
    c.chance = null;
    c.alert = null;
    c.outcome = null;

    return anims;
  }

  function revealChance(c) {
    if (c.hasChance) return [];

    c.hasChance = true;

    if (!c.visible) return [];

    c.chance = chanceLabel(
      c.i,
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.chance)];
  }

  function setAlert(c, alerted) {
    if (c.alerted === alerted) return [];

    c.alerted = alerted;

    if (!c.visible) return [];

    if (alerted) {
      c.alert = alertMark(
        c.x,
        c.y,
        c.s
      );

      return [new M.FadeIn(c.alert)];
    }

    const old = c.alert;

    c.alert = null;

    return old
      ? [new M.FadeOut(old)]
      : [];
  }

  function revealOutcome(c) {
    if (c.hasOutcome) return [];

    c.hasOutcome = true;

    if (!c.visible) return [];

    c.outcome = outcomeMark(
      c.i,
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.outcome)];
  }

  function focus(
    instances,
    color = AMBER,
    part = 'base',
    runTime = 0.8
  ) {
    return instances
      .map(c => c[part])
      .filter(Boolean)
      .map(o =>
        new M.Indicate(o, {
          color,
          runTime
        })
      );
  }

  function primary(ids) {
    return ids.map(i => cards[i]);
  }

  function setPrimaryThreshold(threshold) {
    return cards.flatMap(c =>
      setAlert(
        c,
        DATA[c.i].prob >= threshold
      )
    );
  }

  // Coordinate-based highlight outline.
  function cardOutline(c, color = AMBER, pad = 0.13) {
    const r = new M.RoundedRectangle({
      width: CARD_W * c.s + pad,
      height: CARD_H * c.s + pad,
      cornerRadius: 0.12,
      color,
      strokeWidth: 3
    });

    r.setFill(color, 0);

    r.moveTo([
      c.x,
      c.y,
      0
    ]);

    return r;
  }

  // ------------------------------------------------------------
  // Initial card grid.
  // ------------------------------------------------------------

  const GRID_SPX = P ? 1.48 : 1.60;
  const GRID_SPY = P ? 1.48 : 1.37;

  const GRID_TOP = P ? 1.20 : 0.92;
  const GRID_SCALE = P ? 1.00 : 1.02;

  function gridPosition(i) {
    return [
      CX + (i % 4 - 1.5) * GRID_SPX,
      GRID_TOP - Math.floor(i / 4) * GRID_SPY,
      0
    ];
  }

  function restoreGrid() {
    return cards.flatMap(c =>
      placeCard(
        c,
        gridPosition(c.i),
        GRID_SCALE
      )
    );
  }

  // ------------------------------------------------------------
  // 0–3: Introduce the practical meaning of trusting an alert.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.20 : -0.25;

  const introPump = pumpIcon(
    CX + 1.75,
    INTRO_Y,
    1.80,
    C.cyan
  );

  const introWorker = workerIcon(
    CX - 1.75,
    INTRO_Y,
    1.75
  );

  const pumpLabel = text(
    'WATER PUMP',
    17,
    C.ink,
    CX + 1.75,
    INTRO_Y - 0.95
  );

  const workerLabel = text(
    'REPAIR WORKER',
    17,
    C.ink,
    CX - 1.75,
    INTRO_Y - 0.95
  );

  const introBell = bellIcon(
    CX + 1.75,
    INTRO_Y + 1.08,
    2.00
  );

  const route = new M.DashedLine({
    start: [CX - 0.95, INTRO_Y, 0],
    end: [CX + 0.60, INTRO_Y, 0],
    color: AMBER,
    strokeWidth: 3
  });

  const routeArrow1 = line(
    CX + 0.40,
    INTRO_Y + 0.15,
    CX + 0.60,
    INTRO_Y,
    AMBER,
    3
  );

  const routeArrow2 = line(
    CX + 0.40,
    INTRO_Y - 0.15,
    CX + 0.60,
    INTRO_Y,
    AMBER,
    3
  );

  const dispatchRoute = new M.VGroup(
    route,
    routeArrow1,
    routeArrow2
  );

  const workClock = clockIcon(
    CX,
    P ? -2.55 : -2.12,
    1.40,
    AMBER
  );

  const workNote = text(
    'Every inspection takes time',
    18,
    AMBER,
    CX,
    P ? -3.15 : -2.72
  );

  await until(S(0));
  await play(
    new M.FadeIn(introWorker),
    new M.FadeIn(introPump),
    new M.FadeIn(workerLabel),
    new M.FadeIn(pumpLabel),
    ...say('LOOKING AFTER 12 WATER PUMPS')
  );

  await until(S(1));
  await play(
    new M.FadeIn(introBell),
    new M.Create(dispatchRoute),
    new M.Indicate(introWorker, {
      color: AMBER
    }),
    ...say('ALERT → SEND A REPAIR WORKER', AMBER)
  );

  await until(S(2));
  await play(
    new M.FadeIn(workClock),
    new M.FadeIn(workNote),
    ...say('EVERY INSPECTION TAKES TIME', AMBER)
  );

  await until(S(3));
  await play(
    new M.Indicate(introBell, {
      color: AMBER
    }),
    ...fbox([
      ['when an alert arrives...', AMBER],
      'is there really a problem?'
    ], AMBER),
    ...say('HOW OFTEN IS AN ALERT CORRECT?', AMBER)
  );

  // ------------------------------------------------------------
  // 4: Bring back the twelve pump cards.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...fadeOut([
      introWorker,
      introPump,
      workerLabel,
      pumpLabel,
      introBell,
      dispatchRoute,
      workClock,
      workNote
    ]),
    ...clearBox(),
    lag(
      restoreGrid(),
      1.10,
      0.06
    ),
    ...say('THE SAME 12 PUMP CARDS')
  );

  // ------------------------------------------------------------
  // Threshold gauge.
  // ------------------------------------------------------------

  const GAUGE_W = P ? 6.40 : 4.00;
  const GAUGE_H = P ? 1.30 : 1.82;

  const GX = BOXP[0];
  const GY = BOXP[1];

  const GAUGE_X0 = GX - GAUGE_W / 2 + 0.42;
  const GAUGE_X1 = GX + GAUGE_W / 2 - 0.42;

  const GAUGE_AXIS_Y = GY - 0.12;

  const p2x = v =>
    GAUGE_X0 +
    (v / 100) * (GAUGE_X1 - GAUGE_X0);

  function gaugeBase() {
    const frame = rounded(
      GX,
      GY,
      GAUGE_W,
      GAUGE_H,
      AMBER,
      C.card,
      0.95,
      2
    );

    const heading = text(
      'ALERT THRESHOLD',
      18,
      AMBER,
      GX,
      GY + GAUGE_H / 2 - 0.20,
      true,
      GAUGE_W - 0.35
    );

    const axis = line(
      GAUGE_X0,
      GAUGE_AXIS_Y,
      GAUGE_X1,
      GAUGE_AXIS_Y,
      C.muted,
      3
    );

    const ticks = [0, 30, 60, 100].flatMap(v => [
      line(
        p2x(v),
        GAUGE_AXIS_Y - 0.06,
        p2x(v),
        GAUGE_AXIS_Y + 0.06,
        C.muted,
        1.5
      ),

      text(
        `${v}%`,
        13,
        C.muted,
        p2x(v),
        GAUGE_AXIS_Y - 0.23,
        true
      )
    ]);

    return new M.VGroup(
      frame,
      heading,
      axis,
      ...ticks
    );
  }

  function gaugeCut(threshold) {
    const x = p2x(threshold);

    const marker = line(
      x,
      GAUGE_AXIS_Y - 0.11,
      x,
      GAUGE_AXIS_Y + 0.24,
      AMBER,
      3
    );

    const region = line(
      x,
      GAUGE_AXIS_Y + 0.085,
      GAUGE_X1,
      GAUGE_AXIS_Y + 0.085,
      AMBER,
      5
    );

    const label = text(
      `≥ ${threshold}%`,
      15,
      AMBER,
      (x + GAUGE_X1) / 2,
      GAUGE_AXIS_Y + 0.27,
      true,
      Math.max(
        0.85,
        GAUGE_X1 - x + 0.25
      )
    );

    return new M.VGroup(
      region,
      marker,
      label
    );
  }

  let gauge = null;
  let cutoff = null;

  function showGauge(threshold) {
    gauge = gaugeBase();
    cutoff = gaugeCut(threshold);

    return [
      ...clearBox(),
      new M.FadeIn(gauge),
      new M.FadeIn(cutoff)
    ];
  }

  function moveGauge(threshold) {
    if (!cutoff) return [];

    return [
      new M.Transform(
        cutoff,
        gaugeCut(threshold)
      )
    ];
  }

  function hideGauge() {
    const anims = fadeOut([
      gauge,
      cutoff
    ]);

    gauge = null;
    cutoff = null;

    return anims;
  }

  // ------------------------------------------------------------
  // 5–7: Apply the inclusive 60% threshold.
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    lag(
      cards.flatMap(c =>
        revealChance(c)
      ),
      1.6,
      0.07
    ),
    ...showGauge(60),
    ...say('ALERT WHEN CHANCE IS 60% OR MORE', AMBER)
  );

  await until(S(6));
  await play(
    ...focus(
      primary(R60.alerts),
      AMBER,
      'chance'
    ),
    ...say('P1, P2 AND P3 RECEIVE ALERTS', AMBER)
  );

  await until(S(7));
  await play(
    lag(
      R60.alerts.flatMap(i =>
        setAlert(cards[i], true)
      ),
      1.3,
      0.20
    ),
    ...say('AMBER BELL = ALERT', AMBER)
  );

  // ------------------------------------------------------------
  // 8–10: Reveal actual outcomes.
  // ------------------------------------------------------------

  await until(S(8));
  await play(
    ...hideGauge(),
    ...fbox([
      ['10 hours later', WHITE],
      'which pumps actually failed?'
    ]),
    ...say('NOW WE OBSERVE WHAT REALLY HAPPENED')
  );

  await until(S(9));
  await play(
    lag(
      FAILURES.flatMap(i =>
        revealOutcome(cards[i])
      ),
      1.25,
      0.25
    ),
    ...focus(
      primary(FAILURES),
      RED
    ),
    ...fbox([
      ['P2 and P4 failed', RED],
      ['diamond = real failure', RED]
    ], RED),
    ...say('RED DIAMOND = REAL FAILURE', RED)
  );

  await until(S(10));
  await play(
    lag(
      SAFE.flatMap(i =>
        revealOutcome(cards[i])
      ),
      1.6,
      0.08
    ),
    ...fbox([
      ['2 real failures', RED],
      ['10 non-failing pumps', GREEN]
    ], GREEN),
    ...say('GREEN CIRCLE = NO FAILURE', GREEN)
  );

  // ------------------------------------------------------------
  // Focus and comparison panels.
  //
  // Precision begins with the alert group.
  // Recall begins with the actual-failure group.
  // ------------------------------------------------------------

  function spec(x, top, bottom, w) {
    return {
      x,
      top,
      bottom,
      w,
      h: top - bottom,
      y: (top + bottom) / 2
    };
  }

  const FOCUS_LAYOUT = spec(
    CX,
    P ? 1.65 : 1.35,
    P ? -4.90 : -2.82,
    P ? 6.95 : 7.10
  );

  const PRECISION_LAYOUT = spec(
    CX - 1.71,
    P ? 1.58 : 1.30,
    P ? -4.70 : -2.80,
    3.65
  );

  const RECALL_LAYOUT = spec(
    CX + 1.88,
    P ? 1.58 : 1.30,
    P ? -4.70 : -2.80,
    3.25
  );

  function panelColor(kind) {
    return kind === 'precision'
      ? AMBER
      : RED;
  }

  function panelHeading(kind) {
    return kind === 'precision'
      ? 'PUMPS WITH ALERTS'
      : 'PUMPS THAT FAILED';
  }

  function panelObjects(kind, sp) {
    const color = panelColor(kind);

    // Transparent frame to avoid covering existing cards.
    const frame = rounded(
      sp.x,
      sp.y,
      sp.w,
      sp.h,
      color,
      C.card,
      0,
      2,
      0.16
    );

    const heading = text(
      panelHeading(kind),
      P ? 17 : 17,
      color,
      sp.x,
      sp.top - 0.23,
      false,
      sp.w - 0.20
    );

    const divider = line(
      sp.x - sp.w / 2 + 0.13,
      sp.top - 0.47,
      sp.x + sp.w / 2 - 0.13,
      sp.top - 0.47,
      color,
      1.3
    );

    return {
      kind,
      spec: sp,
      frame,
      heading,
      divider,
      metric: null
    };
  }

  let panels = {
    precision: null,
    recall: null
  };

  function panelParts(panel) {
    if (!panel) return [];

    return [
      panel.frame,
      panel.heading,
      panel.divider,
      panel.metric
    ].filter(Boolean);
  }

  function setPanels(layout) {
    const old = Object.values(panels)
      .flatMap(p => panelParts(p));

    panels = {
      precision: layout.precision
        ? panelObjects(
            'precision',
            layout.precision
          )
        : null,

      recall: layout.recall
        ? panelObjects(
            'recall',
            layout.recall
          )
        : null
    };

    const next = Object.values(panels)
      .flatMap(p => panelParts(p));

    return [
      ...fadeOut(old),
      ...fadeIn(next)
    ];
  }

  function metric(kind, label, color = null) {
    const panel = panels[kind];

    if (!panel) return [];

    const sp = panel.spec;

    const t = text(
      label,
      P ? 19 : 19,
      color || panelColor(kind),
      sp.x,
      sp.bottom + 0.29,
      true,
      sp.w - 0.20
    );

    const anims = [];

    if (panel.metric) {
      anims.push(
        new M.FadeOut(panel.metric)
      );
    }

    anims.push(new M.FadeIn(t));

    panel.metric = t;

    return anims;
  }

  function clearMetric(kind) {
    const panel = panels[kind];

    if (!panel || !panel.metric) return [];

    const old = panel.metric;
    panel.metric = null;

    return [new M.FadeOut(old)];
  }

  function indicatePanel(kind, color = null) {
    const panel = panels[kind];

    if (!panel) return [];

    const c = color || panelColor(kind);

    return [
      new M.Indicate(panel.frame, {
        color: c
      }),

      new M.Indicate(panel.heading, {
        color: c
      })
    ];
  }

  function focusSlots(ids) {
    const n = ids.length;

    const s = n === 2
      ? (P ? 1.65 : 1.42)
      : (P ? 1.38 : 1.32);

    const spacing = n === 2
      ? 2.75
      : 2.08;

    const y = P ? -0.65 : -0.45;

    return ids.map((i, j) => ({
      i,
      s,
      p: [
        CX + (j - (n - 1) / 2) * spacing,
        y,
        0
      ]
    }));
  }

  function focusPrimaryGroup(ids) {
    const hide = cards
      .filter(c => !ids.includes(c.i))
      .flatMap(c =>
        hideCard(c)
      );

    const move = focusSlots(ids)
      .flatMap(slot =>
        placeCard(
          cards[slot.i],
          slot.p,
          slot.s
        )
      );

    return [
      ...hide,
      ...move
    ];
  }

  // ------------------------------------------------------------
  // 11–13: Gather the three alert cards.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...clearBox(),
    ...setPanels({
      precision: FOCUS_LAYOUT
    }),
    ...focusPrimaryGroup(R60.alerts),
    ...say('START WITH THE CARDS THAT HAVE BELLS', AMBER)
  );

  await until(S(12));
  await play(
    ...metric(
      'precision',
      `${R60.alerts.length} alerts`,
      AMBER
    ),
    ...focus(
      primary(R60.alerts),
      AMBER,
      'alert'
    ),
    ...fbox([
      ['P1, P2, P3', AMBER],
      ['3 alerts altogether', AMBER]
    ], AMBER),
    ...say('OUR GROUP CONTAINS 3 ALERTS', AMBER)
  );

  await until(S(13));
  await play(
    ...focus(
      primary(R60.alerts),
      WHITE,
      'outcome'
    ),
    ...say('WHAT ACTUALLY HAPPENED TO THEM?', WHITE)
  );

  // ------------------------------------------------------------
  // 14–16: Examine the actual outcome of each alert.
  // ------------------------------------------------------------

  const precisionFocus = focusSlots(R60.alerts);

  function decisionLabel(slot, label, color) {
    return text(
      label,
      P ? 16 : 15,
      color,
      slot.p[0],
      slot.p[1] - CARD_H * slot.s / 2 - 0.30,
      true,
      1.95
    );
  }

  const alertDecisionLabels = [
    decisionLabel(
      precisionFocus[0],
      'NO FAILURE',
      GREEN
    ),

    decisionLabel(
      precisionFocus[1],
      'FAILED',
      RED
    ),

    decisionLabel(
      precisionFocus[2],
      'NO FAILURE',
      GREEN
    )
  ];

  await until(S(14));
  await play(
    new M.FadeIn(alertDecisionLabels[0], {
      runTime: 0.50
    }),
    ...focus(
      [cards[0]],
      GREEN,
      'outcome',
      0.60
    ),
    ...say('P1 DID NOT FAIL', GREEN)
  );

  await until(S(15));
  await play(
    new M.FadeIn(alertDecisionLabels[1], {
      runTime: 0.50
    }),
    ...focus(
      [cards[1]],
      RED,
      'outcome',
      0.60
    ),
    ...say('P2 ACTUALLY FAILED', RED)
  );

  await until(S(16));
  await play(
    new M.FadeIn(alertDecisionLabels[2], {
      runTime: 0.50
    }),
    ...focus(
      [cards[2]],
      GREEN,
      'outcome',
      0.65
    ),
    ...say('P3 DID NOT FAIL', GREEN)
  );

  // ------------------------------------------------------------
  // 17–18: One correct alert, two false alarms.
  // ------------------------------------------------------------

  const correctAlertOutline = cardOutline(
    cards[1],
    GREEN,
    0.18
  );

  const correctAlertLabel = pill(
    'CORRECT',
    GREEN,
    16
  );

  correctAlertLabel.moveTo([
    cards[1].x,
    cards[1].y +
      CARD_H * cards[1].s / 2 + 0.33,
    0
  ]);

  const falseAlarmLabels = R60.fp.map(i => {
    const c = cards[i];

    const tag = pill(
      'FALSE ALARM',
      AMBER,
      14
    );

    tag.moveTo([
      c.x,
      c.y + CARD_H * c.s / 2 + 0.33,
      0
    ]);

    return tag;
  });

  await until(S(17));
  await play(
    new M.Create(correctAlertOutline),
    new M.FadeIn(correctAlertLabel),
    ...metric(
      'precision',
      '1 of 3 alerts correct',
      GREEN
    ),
    ...fbox([
      ['correct alerts = 1', GREEN],
      ['total alerts   = 3', AMBER]
    ], GREEN),
    ...say('ONLY 1 OF THE 3 ALERTS WAS CORRECT', GREEN)
  );

  await until(S(18));
  await play(
    ...fadeIn(falseAlarmLabels),
    ...focus(
      primary(R60.fp),
      AMBER,
      'alert'
    ),
    ...fbox([
      ['correct alerts = 1', GREEN],
      ['false alarms   = 2', AMBER]
    ], AMBER),
    ...say('THE OTHER 2 WERE FALSE ALARMS', AMBER)
  );

  // ------------------------------------------------------------
  // 19–20: Three messages requesting a repair worker.
  // ------------------------------------------------------------

  function messageCard(x, y, i) {
    const w = P ? 1.76 : 1.76;
    const h = 0.58;

    const frame = rounded(
      x,
      y,
      w,
      h,
      AMBER,
      C.card,
      0.95,
      1.6,
      0.09
    );

    const bell = bellIcon(
      x - w / 2 + 0.24,
      y,
      0.72
    );

    const label = text(
      `CHECK ${DATA[i].id}`,
      15,
      AMBER,
      x + 0.13,
      y,
      true,
      w - 0.48
    );

    return new M.VGroup(
      frame,
      bell,
      label
    );
  }

  const MESSAGE_Y = P ? -2.65 : -1.68;

  const messages = precisionFocus.map(slot =>
    messageCard(
      slot.p[0],
      MESSAGE_Y,
      slot.i
    )
  );

  const messageNote = text(
    '3 messages asking for an inspection',
    P ? 17 : 15,
    C.ink,
    CX,
    MESSAGE_Y - 0.49,
    false,
    6.55
  );

  await until(S(19));
  await play(
    ...fadeOut(alertDecisionLabels),
    lag(
      fadeIn(messages),
      1.5,
      0.22
    ),
    new M.FadeIn(messageNote),
    ...say('3 MESSAGES ASK FOR A REPAIR WORKER', AMBER)
  );

  await until(S(20));
  await play(
    new M.Indicate(messages[1], {
      color: GREEN
    }),
    new M.Indicate(correctAlertLabel, {
      color: GREEN
    }),
    ...fbox([
      ['3 requests for work', AMBER],
      ['only 1 real failure', GREEN]
    ], GREEN),
    ...say('ONLY ONE MESSAGE WARNS OF A REAL FAILURE', GREEN)
  );

  // ------------------------------------------------------------
  // Fraction strip.
  //
  // One segment per member of the denominator group.
  // Filled segments represent successful decisions.
  // ------------------------------------------------------------

  function fractionStrip(
    x,
    y,
    n,
    k,
    color,
    width = 4.20,
    height = 0.34
  ) {
    const gap = 0.055;
    const cw = (
      width - gap * (n - 1)
    ) / n;

    const blocks = Array.from({ length: n }, (_, i) =>
      rect(
        x - width / 2 +
          cw / 2 +
          i * (cw + gap),

        y,
        cw,
        height,
        i < k ? color : C.muted,
        i < k ? 0.88 : 0.06,
        1.6
      )
    );

    return new M.VGroup(...blocks);
  }

  const precisionStrip = fractionStrip(
    CX,
    P ? -3.10 : -1.98,
    R60.alerts.length,
    R60.tp.length,
    GREEN,
    P ? 4.50 : 4.70,
    0.35
  );

  // ------------------------------------------------------------
  // 21–23: Name precision.
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    ...fadeOut([
      ...messages,
      messageNote
    ]),
    new M.FadeIn(precisionStrip),
    ...metric(
      'precision',
      '1 ÷ 3 ≈ 33%',
      AMBER
    ),
    ...fbox([
      '1 ÷ 3',
      '= 0.333...',
      ['≈ 33%', AMBER]
    ], AMBER),
    ...say('ONE OUT OF THREE ≈ 33%', AMBER)
  );

  await until(S(22));
  await play(
    ...metric(
      'precision',
      `PRECISION ≈ ${pct(R60.precision)}`,
      AMBER
    ),
    ...fbox([
      ['precision', AMBER],
      'share of alerts that',
      'identify real failures'
    ], AMBER),
    ...say('THIS SHARE IS CALLED PRECISION', AMBER)
  );

  await until(S(23));
  await play(
    new M.Indicate(
      panels.precision.metric,
      { color: AMBER }
    ),
    ...fbox([
      ['precision', AMBER],
      '1 correct alert out of 3',
      ['≈ 33%', AMBER]
    ], AMBER),
    ...say('OUR PRECISION IS ABOUT 33%', AMBER)
  );

  // ------------------------------------------------------------
  // 24–25: Precision does not reveal missed failures.
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...fbox([
      ['precision answers:', AMBER],
      'can we trust our alerts?',
      ['but there is another question...', C.muted]
    ], AMBER),
    ...say('TRUSTING ALERTS IS ONLY HALF THE STORY')
  );

  await until(S(25));
  await play(
    ...fbox([
      ['what about real failures', RED],
      'that never received an alert?'
    ], RED),
    ...say('DID ANY REAL FAILURES ESCAPE US?', RED)
  );

  // ------------------------------------------------------------
  // 26: Return all twelve cards to their original positions.
  // ------------------------------------------------------------

  await until(S(26));
  await play(
    ...fadeOut([
      correctAlertOutline,
      correctAlertLabel,
      ...falseAlarmLabels,
      precisionStrip
    ]),
    ...setPanels({}),
    ...clearBox(),
    ...restoreGrid(),
    ...say('RETURN TO ALL 12 PUMP CARDS')
  );

  // ------------------------------------------------------------
  // 27–28: Gather only the actual failures.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...setPanels({
      recall: FOCUS_LAYOUT
    }),
    ...focusPrimaryGroup(FAILURES),
    ...say('NOW START WITH THE RED DIAMONDS', RED)
  );

  await until(S(28));
  await play(
    ...metric(
      'recall',
      '2 actual failures',
      RED
    ),
    ...focus(
      primary(FAILURES),
      RED,
      'outcome'
    ),
    ...fbox([
      ['P2 and P4', RED],
      ['2 real failures altogether', RED]
    ], RED),
    ...say('P2 AND P4 ACTUALLY FAILED', RED)
  );

  // ------------------------------------------------------------
  // 29–30: One failure caught and one failure missed.
  // ------------------------------------------------------------

  const recallFocus = focusSlots(FAILURES);

  const recallCaught = pill(
    'CAUGHT',
    GREEN,
    18
  );

  recallCaught.moveTo([
    recallFocus[0].p[0],
    recallFocus[0].p[1] +
      CARD_H * recallFocus[0].s / 2 + 0.35,
    0
  ]);

  const recallMissed = pill(
    'MISSED',
    RED,
    18
  );

  recallMissed.moveTo([
    recallFocus[1].p[0],
    recallFocus[1].p[1] +
      CARD_H * recallFocus[1].s / 2 + 0.35,
    0
  ]);

  const failureLabels = recallFocus.map(slot =>
    decisionLabel(
      slot,
      'REAL FAILURE',
      RED
    )
  );

  await until(S(29));
  await play(
    new M.FadeIn(recallCaught),
    new M.FadeIn(failureLabels[0]),
    ...focus(
      [cards[1]],
      AMBER,
      'alert'
    ),
    ...fbox([
      ['P2: real failure', RED],
      ['P2: alert raised', AMBER],
      ['failure caught', GREEN]
    ], GREEN),
    ...say('P2 HAS A BELL: FAILURE CAUGHT', GREEN)
  );

  await until(S(30));
  await play(
    new M.FadeIn(recallMissed),
    new M.FadeIn(failureLabels[1]),
    ...focus(
      [cards[3]],
      RED,
      'outcome'
    ),
    ...fbox([
      ['P4: real failure', RED],
      'P4: no alert',
      ['failure missed', RED]
    ], RED),
    ...say('P4 HAS NO BELL: FAILURE MISSED', RED)
  );

  // ------------------------------------------------------------
  // 31–35: Calculate recall and identify it as sensitivity.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    ...metric(
      'recall',
      `${R60.tp.length} of ${FAILURES.length} caught`,
      GREEN
    ),
    ...fbox([
      ['caught failures = 1', GREEN],
      ['real failures   = 2', RED]
    ], RED),
    ...say('1 OF THE 2 REAL FAILURES WAS CAUGHT')
  );

  const recallStrip = fractionStrip(
    CX,
    P ? -3.12 : -1.98,
    FAILURES.length,
    R60.tp.length,
    GREEN,
    P ? 4.50 : 4.70,
    0.35
  );

  await until(S(32));
  await play(
    new M.FadeIn(recallStrip),
    ...metric(
      'recall',
      '1 ÷ 2 = 50%',
      RED
    ),
    ...fbox([
      '1 ÷ 2',
      '= 0.5',
      ['= 50%', RED]
    ], RED),
    ...say('ONE OUT OF TWO = 50%', RED)
  );

  await until(S(33));
  await play(
    ...metric(
      'recall',
      `RECALL = ${pct(R60.recall)}`,
      RED
    ),
    ...fbox([
      ['recall', RED],
      'share of real failures',
      'that we catch'
    ], RED),
    ...say('THIS SHARE IS CALLED RECALL', RED)
  );

  await until(S(34));
  await play(
    ...fbox([
      ['recall = sensitivity', RED],
      'two names for the same measure',
      ['real failures caught', GREEN]
    ], RED),
    ...say('RECALL IS ANOTHER NAME FOR SENSITIVITY', RED)
  );

  await until(S(35));
  await play(
    new M.Indicate(
      panels.recall.metric,
      { color: RED }
    ),
    ...fbox([
      ['recall', RED],
      '1 caught failure out of 2',
      ['= 50%', RED]
    ], RED),
    ...say('OUR RECALL IS 50%', RED)
  );

  // ------------------------------------------------------------
  // Side-by-side comparison.
  //
  // The precision group contains all alerts.
  // The recall group contains all actual failures.
  //
  // P2 appears in both groups at the 60% threshold.
  // P2 and P4 appear in both groups at the 30% threshold.
  //
  // These are independent visual copies of the same pumps,
  // not additional observations.
  // ------------------------------------------------------------

  let precisionCards = [];
  let recallCards = [];

  let sharedNote = null;
  let sharedOutlines = [];

  function comparisonCard(i, threshold) {
    const c = newCard(i);

    c.hasChance = true;
    c.hasOutcome = true;
    c.alerted = DATA[i].prob >= threshold;

    return c;
  }

  function comparisonSlots(kind, ids) {
    const sp = kind === 'precision'
      ? PRECISION_LAYOUT
      : RECALL_LAYOUT;

    const n = ids.length;

    let cols;
    let maxScale;

    if (kind === 'recall') {
      cols = 1;
      maxScale = P ? 1.22 : 1.08;
    } else if (n <= 3) {
      cols = P ? 1 : 2;
      maxScale = P ? 1.04 : 1.00;
    } else {
      cols = 2;
      maxScale = P ? 1.12 : 0.82;
    }

    const rows = Math.ceil(n / cols);

    const top = sp.top - 0.61;
    const bottom = sp.bottom + 0.65;

    const availableH = top - bottom;

    const sx = (sp.w - 0.22) /
      (cols * (CARD_W + 0.16));

    const sy = (availableH - 0.04) /
      (rows * (CARD_H + 0.17));

    const s = Math.min(
      maxScale,
      sx,
      sy
    );

    const pitchX = s * (CARD_W + 0.18);
    const pitchY = s * (CARD_H + 0.21);

    const cy = (top + bottom) / 2;

    return ids.map((i, j) => {
      const row = Math.floor(j / cols);
      const col = j % cols;

      const rowCount = Math.min(
        cols,
        n - row * cols
      );

      return {
        i,
        s,
        p: [
          sp.x +
            (col - (rowCount - 1) / 2) * pitchX,

          cy +
            ((rows - 1) / 2 - row) * pitchY,

          0
        ]
      };
    });
  }

  function clearSharedHighlights() {
    const anims = fadeOut([
      sharedNote,
      ...sharedOutlines
    ]);

    sharedNote = null;
    sharedOutlines = [];

    return anims;
  }

  function clearComparisonCards() {
    const anims = [
      ...precisionCards.flatMap(c =>
        hideCard(c)
      ),

      ...recallCards.flatMap(c =>
        hideCard(c)
      )
    ];

    precisionCards = [];
    recallCards = [];

    return anims;
  }

  function setComparison(threshold) {
    const r = evaluate(threshold);

    const oldAnims = clearComparisonCards();

    precisionCards = r.alerts.map(i =>
      comparisonCard(
        i,
        threshold
      )
    );

    recallCards = FAILURES.map(i =>
      comparisonCard(
        i,
        threshold
      )
    );

    const pSlots = comparisonSlots(
      'precision',
      r.alerts
    );

    const rSlots = comparisonSlots(
      'recall',
      FAILURES
    );

    const next = [
      ...precisionCards.flatMap((c, j) =>
        placeCard(
          c,
          pSlots[j].p,
          pSlots[j].s
        )
      ),

      ...recallCards.flatMap((c, j) =>
        placeCard(
          c,
          rSlots[j].p,
          rSlots[j].s
        )
      )
    ];

    return [
      ...oldAnims,
      ...next
    ];
  }

  function comparisonMatches(kind, ids) {
    const list = kind === 'precision'
      ? precisionCards
      : recallCards;

    return list.filter(c =>
      ids.includes(c.i)
    );
  }

  // ------------------------------------------------------------
  // 36: Put both denominator groups side by side.
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    ...fadeOut([
      recallCaught,
      recallMissed,
      ...failureLabels,
      recallStrip
    ]),
    ...cards.flatMap(c =>
      hideCard(c)
    ),
    ...setPanels({
      precision: PRECISION_LAYOUT,
      recall: RECALL_LAYOUT
    }),
    ...setComparison(60),
    ...clearBox(),
    ...say('TWO DIFFERENT GROUPS OF PUMPS')
  );

  // ------------------------------------------------------------
  // 37: Precision's denominator is the total number of alerts.
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...indicatePanel(
      'precision',
      AMBER
    ),
    ...focus(
      precisionCards,
      AMBER,
      'alert'
    ),
    ...metric(
      'precision',
      '1 correct / 3 alerts',
      AMBER
    ),
    ...fbox([
      ['precision', AMBER],
      'start with the 3 alerts',
      ['how many were correct?', GREEN]
    ], AMBER),
    ...say('PRECISION STARTS WITH ALL ALERTS', AMBER)
  );

  // ------------------------------------------------------------
  // 38: Recall's denominator is the total number of real failures.
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    ...indicatePanel(
      'recall',
      RED
    ),
    ...focus(
      recallCards,
      RED,
      'outcome'
    ),
    ...metric(
      'recall',
      '1 caught / 2 failures',
      RED
    ),
    ...fbox([
      ['recall', RED],
      'start with the 2 real failures',
      ['how many did we catch?', GREEN]
    ], RED),
    ...say('RECALL STARTS WITH ALL REAL FAILURES', RED)
  );

  // ------------------------------------------------------------
  // 39: The numerator is the same caught failure in both groups.
  // ------------------------------------------------------------

  const sharedP2 = [
    ...comparisonMatches(
      'precision',
      [1]
    ),

    ...comparisonMatches(
      'recall',
      [1]
    )
  ];

  sharedOutlines = sharedP2.map(c =>
    cardOutline(
      c,
      GREEN,
      0.16
    )
  );

  sharedNote = text(
    'Same P2 in both groups',
    P ? 17 : 16,
    GREEN,
    CX,
    P ? -5.10 : -2.94,
    true,
    6.80
  );

  await until(S(39));
  await play(
    ...sharedOutlines.map(o =>
      new M.Create(o)
    ),
    new M.FadeIn(sharedNote),
    ...focus(
      sharedP2,
      GREEN,
      'outcome'
    ),
    ...fbox([
      ['same correct alert: P2', GREEN],
      ['precision denominator = 3', AMBER],
      ['recall denominator    = 2', RED]
    ]),
    ...say('SAME CAUGHT FAILURE, DIFFERENT TOTALS')
  );

  // ------------------------------------------------------------
  // 40–44: Introduce short formulas.
  // ------------------------------------------------------------

  await until(S(40));
  await play(
    ...clearSharedHighlights(),
    ...clearBox(),
    ...say('TWO IDEAS, TWO SHORT FORMULAS')
  );

  await until(S(41));
  await play(
    ...indicatePanel(
      'precision',
      AMBER
    ),
    ...focus(
      comparisonMatches(
        'precision',
        R60.tp
      ),
      GREEN
    ),
    ...fbox([
      ['precision =', AMBER],
      '  caught failures',
      '  ÷ total number of alerts'
    ], AMBER),
    ...say('CAUGHT FAILURES ÷ ALL ALERTS', AMBER)
  );

  await until(S(42));
  await play(
    ...metric(
      'precision',
      'PRECISION ≈ 33%',
      AMBER
    ),
    ...fbox([
      ['precision', AMBER],
      '  = 1 ÷ 3',
      ['  ≈ 33%', AMBER]
    ], AMBER),
    ...say('PRECISION = 1 ÷ 3 ≈ 33%', AMBER)
  );

  await until(S(43));
  await play(
    ...indicatePanel(
      'recall',
      RED
    ),
    ...focus(
      comparisonMatches(
        'recall',
        R60.tp
      ),
      GREEN
    ),
    ...fbox([
      ['recall =', RED],
      '  caught failures',
      '  ÷ total real failures'
    ], RED),
    ...say('CAUGHT FAILURES ÷ ALL REAL FAILURES', RED)
  );

  await until(S(44));
  await play(
    ...metric(
      'recall',
      'RECALL = 50%',
      RED
    ),
    ...fbox([
      ['recall', RED],
      '  = 1 ÷ 2',
      ['  = 50%', RED]
    ], RED),
    ...say('RECALL = 1 ÷ 2 = 50%', RED)
  );

  // ------------------------------------------------------------
  // 45–48: Lower the threshold from 60% to 30%.
  //
  // New alerts: P4, P5 and P6.
  //
  // Precision = 2/6 = 1/3 ≈ 33%.
  // Recall = 2/2 = 100%.
  //
  // Existing cards move to make space.
  // The two actual-failure cards remain the same pumps.
  // ------------------------------------------------------------

  await until(S(45));
  await play(
    ...showGauge(60),
    ...say('LOWER THE ALERT THRESHOLD', AMBER)
  );

  await play(
    ...moveGauge(30),
    ...say('60% → 30%', AMBER)
  );

  function expandPrecisionGroup(threshold) {
    const r = evaluate(threshold);

    const byId = new Map(
      precisionCards.map(c =>
        [c.i, c]
      )
    );

    const slots = comparisonSlots(
      'precision',
      r.alerts
    );

    const next = [];
    const anims = [];

    slots.forEach(slot => {
      let c = byId.get(slot.i);

      if (!c) {
        c = comparisonCard(
          slot.i,
          threshold
        );
      }

      next.push(c);

      anims.push(
        ...placeCard(
          c,
          slot.p,
          slot.s
        )
      );
    });

    precisionCards = next;

    return anims;
  }

  await until(S(46));

  const expandAlerts = expandPrecisionGroup(30);

  const newRecallBells = recallCards.flatMap(c =>
    setAlert(
      c,
      DATA[c.i].prob >= 30
    )
  );

  await play(
    ...expandAlerts,
    ...newRecallBells,
    ...clearMetric('precision'),
    ...clearMetric('recall'),
    ...say('P4, P5 AND P6 ALSO RECEIVE ALERTS', AMBER)
  );

  await until(S(47));
  await play(
    ...hideGauge(),
    ...focus(
      comparisonMatches(
        'precision',
        R30.tp
      ),
      GREEN,
      'outcome'
    ),
    ...metric(
      'precision',
      '2 / 6 ≈ 33%',
      AMBER
    ),
    ...fbox([
      ['6 alerts', AMBER],
      ['2 correct alerts', GREEN],
      '2 ÷ 6 = 1 ÷ 3',
      ['precision ≈ 33%', AMBER]
    ], AMBER),
    ...say('PRECISION STAYS AT ABOUT 33%', AMBER)
  );

  await until(S(48));
  await play(
    ...focus(
      recallCards,
      AMBER,
      'alert'
    ),
    ...metric(
      'recall',
      '2 / 2 = 100%',
      RED
    ),
    ...fbox([
      ['2 real failures', RED],
      ['both caught', GREEN],
      '2 ÷ 2 = 1',
      ['recall = 100%', RED]
    ], RED),
    ...say('RECALL RISES TO 100%', RED)
  );

  // ------------------------------------------------------------
  // 49–50: Explain when each measure is useful.
  // ------------------------------------------------------------

  await until(S(49));
  await play(
    ...indicatePanel(
      'precision',
      AMBER
    ),
    ...focus(
      comparisonMatches(
        'precision',
        R30.tp
      ),
      GREEN
    ),
    ...fbox([
      ['USE PRECISION', AMBER],
      'when acting on an alert',
      'takes time or resources',
      ['how often is action justified?', GREEN]
    ], AMBER),
    ...say('PRECISION: CAN WE TRUST AN ALERT?', AMBER)
  );

  await until(S(50));
  await play(
    ...indicatePanel(
      'recall',
      RED
    ),
    ...focus(
      recallCards,
      GREEN,
      'alert'
    ),
    ...fbox([
      ['USE RECALL', RED],
      'when catching real problems',
      'is especially important',
      ['how many failures do we catch?', GREEN]
    ], RED),
    ...say('RECALL: HOW MANY PROBLEMS DO WE CATCH?', RED)
  );

  // ------------------------------------------------------------
  // 51–53: Counterexample — a tool that alerts for every pump.
  //
  // Twelve alerts, two correct alerts.
  // Precision = 2/12 ≈ 17%.
  // Recall = 2/2 = 100%.
  //
  // Return to the twelve-card grid so all twelve alerts can be
  // seen clearly at the same time.
  // ------------------------------------------------------------

  await until(S(51));

  // Primary cards are currently hidden.
  // Update their alert state before showing them.
  const allAlertState = setPrimaryThreshold(10);

  await play(
    ...clearComparisonCards(),
    ...setPanels({}),
    ...allAlertState,
    ...restoreGrid(),
    ...fbox([
      ['alert every pump', AMBER],
      ['2 real failures caught', GREEN],
      ['recall = 100%', RED]
    ], RED),
    ...say('ALERT EVERY PUMP: PERFECT RECALL', RED)
  );

  const allAlertCorrectOutlines = FAILURES.map(i =>
    cardOutline(
      cards[i],
      GREEN,
      0.15
    )
  );

  const allAlertSummary = text(
    '12 alerts · 2 correct',
    19,
    AMBER,
    CX,
    P ? -3.05 : -2.55,
    true
  );

  await until(S(52));
  await play(
    ...allAlertCorrectOutlines.map(o =>
      new M.Create(o)
    ),
    new M.FadeIn(allAlertSummary),
    ...focus(
      primary(FAILURES),
      GREEN,
      'outcome'
    ),
    ...fbox([
      ['12 alerts', AMBER],
      ['2 correct alerts', GREEN],
      '2 ÷ 12 = 1 ÷ 6',
      ['precision ≈ 17%', AMBER]
    ], AMBER),
    ...say('ONLY 2 OF 12 ALERTS ARE CORRECT', AMBER)
  );

  await until(S(53));
  await play(
    ...fbox([
      ['alert every pump', C.ink],
      [`precision ≈ ${pct(R10.precision)}`, AMBER],
      [`recall = ${pct(R10.recall)}`, RED],
      ['examine both together', C.green]
    ]),
    ...say('ONE NUMBER ALONE IS NOT ENOUGH')
  );

  // ------------------------------------------------------------
  // 54: Final recap.
  //
  // Restore the original 60% threshold example.
  //
  // Precision: 1 correct alert among 3 alerts.
  // Recall: 1 caught failure among 2 real failures.
  //
  // Both panels display P2 intentionally because it belongs
  // to both denominator groups.
  // ------------------------------------------------------------

  await until(S(54));
  await play(
    ...fadeOut([
      ...allAlertCorrectOutlines,
      allAlertSummary
    ]),
    ...cards.flatMap(c =>
      hideCard(c)
    ),
    ...setPanels({
      precision: PRECISION_LAYOUT,
      recall: RECALL_LAYOUT
    }),
    ...setComparison(60),
    ...metric(
      'precision',
      '1/3 ≈ 33%',
      AMBER
    ),
    ...metric(
      'recall',
      '1/2 = 50%',
      RED
    ),
    ...fbox([
      ['PRECISION', AMBER],
      '  how many alerts are correct?',
      ['RECALL', RED],
      '  how many failures do we catch?'
    ]),
    ...say('PRECISION: TRUST · RECALL: CATCH')
  );

  // Highlight the same caught failure in both denominator groups.
  // Draw outlines from card coordinates rather than regrouping.
  const finalCorrect = [
    ...comparisonMatches(
      'precision',
      R60.tp
    ),

    ...comparisonMatches(
      'recall',
      R60.tp
    )
  ];

  const finalOutlines = finalCorrect.map(c =>
    cardOutline(
      c,
      GREEN,
      0.16
    )
  );

  const finalNote = text(
    'Same caught failure — different denominators',
    P ? 16 : 15,
    GREEN,
    CX,
    P ? -5.10 : -2.94,
    false,
    6.80
  );

  await until(S(54) + 2.0);
  await play(
    ...finalOutlines.map(o =>
      new M.Create(o)
    ),
    new M.FadeIn(finalNote)
  );

  // Hold the final picture until narration ends.
  await until(E(54));
}

// lesson 12.4.3
// Sensitivity and specificity — live, narration-synchronised lesson.
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
    const alerts = IDS.filter(i => DATA[i].prob >= threshold);

    const tp = FAILURES.filter(i => alerts.includes(i));
    const fn = FAILURES.filter(i => !alerts.includes(i));

    const fp = SAFE.filter(i => alerts.includes(i));
    const tn = SAFE.filter(i => !alerts.includes(i));

    return {
      threshold,
      alerts,
      tp,
      fn,
      fp,
      tn,
      sensitivity: tp.length / FAILURES.length,
      specificity: tn.length / SAFE.length
    };
  }

  const R60 = evaluate(60);
  const R30 = evaluate(30);
  const R10 = evaluate(10);

  const NEW_ALERTS = R30.alerts.filter(i =>
    !R60.alerts.includes(i)
  );

  const pct = v => `${Math.round(v * 100)}%`;

  // Fixed chapter colours and meanings.
  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;

  // Responsive laptop / phone layout.
  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.30, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.52, 0]
    : [4.3, -0.30, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  function text(s, size, color, x, y, mono = false, maxw = null) {
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
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.1;
    const maxh = P ? 1.35 : 2.30;

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

  // Small water pump: motor, housing, inlet, outlet and feet.
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

  // Amber bell and amber outline = alert.
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

  // ------------------------------------------------------------
  // Pump cards.
  //
  // Base, probability, alert and outcome remain independent
  // scene objects. No on-screen objects are regrouped.
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

    return new M.VGroup(outline, bell);
  }

  function outcomeMark(i, x, y, s) {
    const xx = x + 0.37 * s;
    const yy = y - 0.055 * s;

    return DATA[i].failed
      ? failureIcon(xx, yy, s)
      : safeIcon(xx, yy, s);
  }

  const cards = DATA.map((d, i) => ({
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
  }));

  function cardObjects(c) {
    return [
      c.base,
      c.chance,
      c.alert,
      c.outcome
    ].filter(Boolean);
  }

  // Move a visible card, or introduce a fresh representation
  // of a previously hidden card at its destination.
  function placeCard(i, p, s = 1) {
    const c = cards[i];

    const x = p[0];
    const y = p[1];

    const anims = [];

    if (!c.visible) {
      c.base = cardBase(i, x, y, s);

      c.chance = c.hasChance
        ? chanceLabel(i, x, y, s)
        : null;

      c.alert = c.alerted
        ? alertMark(x, y, s)
        : null;

      c.outcome = c.hasOutcome
        ? outcomeMark(i, x, y, s)
        : null;

      anims.push(
        ...fadeIn(cardObjects(c))
      );

      c.visible = true;
    } else {
      anims.push(
        new M.Transform(
          c.base,
          cardBase(i, x, y, s)
        )
      );

      if (c.chance) {
        anims.push(
          new M.Transform(
            c.chance,
            chanceLabel(i, x, y, s)
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
            outcomeMark(i, x, y, s)
          )
        );
      }
    }

    c.x = x;
    c.y = y;
    c.s = s;

    return anims;
  }

  function hideCard(i) {
    const c = cards[i];

    if (!c.visible) return [];

    const anims = fadeOut(cardObjects(c));

    c.visible = false;

    c.base = null;
    c.chance = null;
    c.alert = null;
    c.outcome = null;

    return anims;
  }

  function revealChance(i) {
    const c = cards[i];

    if (c.hasChance) return [];

    c.hasChance = true;

    if (!c.visible) return [];

    c.chance = chanceLabel(
      i,
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.chance)];
  }

  function setAlert(i, alerted) {
    const c = cards[i];

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

  function revealOutcome(i) {
    const c = cards[i];

    if (c.hasOutcome) return [];

    c.hasOutcome = true;

    if (!c.visible) return [];

    c.outcome = outcomeMark(
      i,
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.outcome)];
  }

  function focus(ids, color = AMBER, part = 'base') {
    return ids
      .map(i => cards[i][part])
      .filter(Boolean)
      .map(o =>
        new M.Indicate(o, { color })
      );
  }

  function setThreshold(threshold) {
    return IDS.flatMap(i =>
      setAlert(
        i,
        DATA[i].prob >= threshold
      )
    );
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

  // ------------------------------------------------------------
  // 0–3: Introduce the two jobs of the prediction tool.
  // ------------------------------------------------------------

  const introY = P ? -0.65 : -0.25;

  const introPump = pumpIcon(
    CX,
    introY,
    P ? 3.0 : 2.8,
    C.cyan
  );

  const introLabel = text(
    '12 WATER PUMPS',
    25,
    C.ink,
    CX,
    introY - 1.32,
    true
  );

  const jobY = P ? -3.05 : -2.20;

  const job1 = pill(
    'CATCH REAL FAILURES',
    RED,
    17
  );

  job1.moveTo([
    CX,
    jobY,
    0
  ]);

  const job2 = pill(
    'AVOID UNNECESSARY WORK',
    GREEN,
    17
  );

  job2.moveTo([
    CX,
    jobY - 0.48,
    0
  ]);

  await until(S(0));
  await play(
    new M.FadeIn(introPump),
    new M.FadeIn(introLabel),
    ...say('RESPONSIBLE FOR 12 WATER PUMPS')
  );

  await until(S(1));
  await play(
    new M.FadeIn(job1),
    ...say('CATCH EVERY REAL FAILURE', RED)
  );

  await until(S(2));
  await play(
    new M.FadeIn(job2),
    ...say('AVOID UNNECESSARY REPAIR WORK', GREEN)
  );

  await until(S(3));
  await play(
    new M.Indicate(job1, {
      color: RED
    }),
    new M.Indicate(job2, {
      color: GREEN
    }),
    ...say('HOW WELL DOES THE TOOL DO BOTH JOBS?')
  );

  // ------------------------------------------------------------
  // 4: Bring back the twelve numbered pump cards.
  // ------------------------------------------------------------

  await until(S(4));

  const initialCards = IDS.flatMap(i =>
    placeCard(
      i,
      gridPosition(i),
      GRID_SCALE
    )
  );

  await play(
    ...fadeOut([
      introPump,
      introLabel,
      job1,
      job2
    ]),
    lag(initialCards, 1.15, 0.06),
    ...say('THE SAME 12 PUMPS')
  );

  // ------------------------------------------------------------
  // Threshold gauge.
  // Probabilities run from 0% to 100%.
  // The amber line marks the inclusive alert threshold.
  // ------------------------------------------------------------

  const GAUGE_W = P ? 6.4 : 4.0;
  const GAUGE_H = P ? 1.32 : 1.85;

  const GX = BOXP[0];
  const GY = BOXP[1];

  const GAUGE_X0 = GX - GAUGE_W / 2 + 0.43;
  const GAUGE_X1 = GX + GAUGE_W / 2 - 0.43;

  const GAUGE_AXIS_Y = GY - 0.13;

  const p2x = v =>
    GAUGE_X0 +
    v / 100 * (GAUGE_X1 - GAUGE_X0);

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

    const title = text(
      'ALERT THRESHOLD',
      P ? 17 : 19,
      AMBER,
      GX,
      GY + GAUGE_H / 2 - 0.20,
      true,
      GAUGE_W - 0.4
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
        GAUGE_AXIS_Y - 0.055,
        p2x(v),
        GAUGE_AXIS_Y + 0.055,
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
      title,
      axis,
      ...ticks
    );
  }

  function gaugeCut(threshold) {
    const x = p2x(threshold);

    const marker = line(
      x,
      GAUGE_AXIS_Y - 0.10,
      x,
      GAUGE_AXIS_Y + 0.23,
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
  // 5–6: Apply the 60% alert threshold.
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    lag(
      IDS.flatMap(i => revealChance(i)),
      1.6,
      0.06
    ),
    ...showGauge(60),
    ...say('ALERT WHEN CHANCE IS 60% OR MORE', AMBER)
  );

  await until(S(6));
  await play(
    lag(
      R60.alerts.flatMap(i => setAlert(i, true)),
      1.5,
      0.22
    ),
    ...focus(R60.alerts, AMBER),
    ...say('P1, P2 AND P3 RECEIVE ALERTS', AMBER)
  );

  // ------------------------------------------------------------
  // 7–9: Reveal actual outcomes.
  // ------------------------------------------------------------

  await until(S(7));
  await play(
    ...hideGauge(),
    ...fbox([
      ['10 hours later', WHITE],
      'what actually happened?'
    ]),
    ...say('NOW WE OBSERVE REAL OUTCOMES', WHITE)
  );

  await until(S(8));
  await play(
    lag(
      FAILURES.flatMap(i => revealOutcome(i)),
      1.3,
      0.25
    ),
    ...focus(FAILURES, RED),
    ...fbox([
      ['P2 and P4 failed', RED],
      ['diamond = real failure', RED]
    ], RED),
    ...say('TWO PUMPS ACTUALLY FAILED', RED)
  );

  await until(S(9));
  await play(
    lag(
      SAFE.flatMap(i => revealOutcome(i)),
      1.7,
      0.07
    ),
    ...fbox([
      ['2 pumps failed', RED],
      ['10 did not fail', GREEN]
    ], GREEN),
    ...say('GREEN CIRCLE = NO FAILURE', GREEN)
  );

  // ------------------------------------------------------------
  // Group layouts.
  //
  // Always group by actual outcomes, not by alert decisions.
  //
  // LEFT:  pumps that actually failed.
  // RIGHT: pumps that actually did not fail.
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

  const STAGING_LAYOUT = {
    failed: spec(
      CX - 2.50,
      P ? -0.28 : -0.02,
      P ? -5.02 : -2.78,
      2.06
    ),

    safe: spec(
      CX + 1.12,
      P ? -0.28 : -0.02,
      P ? -5.02 : -2.78,
      4.84
    )
  };

  const BOTH_LAYOUT = {
    failed: spec(
      CX - 2.50,
      P ? 1.62 : 1.12,
      P ? -4.78 : -2.80,
      2.06
    ),

    safe: spec(
      CX + 1.12,
      P ? 1.62 : 1.12,
      P ? -4.78 : -2.80,
      4.84
    )
  };

  const FOCUS_LAYOUT = spec(
    CX,
    P ? 1.62 : 1.12,
    P ? -4.78 : -2.80,
    P ? 6.85 : 7.20
  );

  function stagingPosition(i) {
    const sx = P ? 1.10 : 1.12;

    return [
      CX + (i % 6 - 2.5) * sx,
      (P ? 1.40 : 1.08) -
        Math.floor(i / 6) * (P ? 0.90 : 0.76),
      0
    ];
  }

  function panelObjects(kind, sp) {
    const failed = kind === 'failed';
    const color = failed ? RED : GREEN;

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

    const header = text(
      failed ? 'ACTUALLY FAILED' : 'DID NOT FAIL',
      P ? 16 : 17,
      color,
      sp.x,
      sp.top - 0.22,
      false,
      sp.w - 0.18
    );

    const divider = line(
      sp.x - sp.w / 2 + 0.12,
      sp.top - 0.43,
      sp.x + sp.w / 2 - 0.12,
      sp.top - 0.43,
      color,
      1
    );

    return {
      kind,
      spec: sp,
      frame,
      header,
      divider,
      metric: null
    };
  }

  let panels = {
    failed: null,
    safe: null
  };

  function panelParts(p) {
    if (!p) return [];

    return [
      p.frame,
      p.header,
      p.divider,
      p.metric
    ].filter(Boolean);
  }

  function setPanels(layout) {
    const old = Object.values(panels)
      .flatMap(p => panelParts(p));

    panels = {
      failed: layout.failed
        ? panelObjects('failed', layout.failed)
        : null,

      safe: layout.safe
        ? panelObjects('safe', layout.safe)
        : null
    };

    const next = Object.values(panels)
      .flatMap(p => panelParts(p));

    const frames = Object.values(panels)
      .filter(Boolean)
      .map(p => p.frame);

    return [
      ...fadeOut(old),
      ...frames.map(f => new M.Create(f)),
      ...fadeIn(next.filter(o => !frames.includes(o)))
    ];
  }

  function metric(kind, label, color = null) {
    const panel = panels[kind];

    if (!panel) return [];

    const sp = panel.spec;

    const t = text(
      label,
      P ? 18 : 19,
      color || (kind === 'failed' ? RED : GREEN),
      sp.x,
      sp.bottom + 0.25,
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

  function indicatePanel(kind, color) {
    const p = panels[kind];

    if (!p) return [];

    return [
      new M.Indicate(p.frame, { color }),
      new M.Indicate(p.header, { color })
    ];
  }

  // Card positions inside the two simultaneous groups.
  function groupedSlots(kind, sp) {
    const failed = kind === 'failed';
    const ids = failed ? FAILURES : SAFE;

    const cols = failed
      ? 1
      : (P ? 3 : 5);

    const rows = Math.ceil(ids.length / cols);

    const areaTop = sp.top - 0.55;
    const areaBottom = sp.bottom + 0.52;
    const areaH = areaTop - areaBottom;

    const maxS = failed
      ? (P ? 1.05 : 0.98)
      : (P ? 0.88 : 0.68);

    const sx = (sp.w - 0.16) /
      (cols * (CARD_W + 0.13));

    const sy = (areaH - 0.05) /
      (rows * (CARD_H + 0.18));

    const s = Math.min(
      maxS,
      sx,
      sy
    );

    const pitchX = s * (CARD_W + 0.17);
    const pitchY = s * (CARD_H + 0.22);

    const cy = (areaTop + areaBottom) / 2;

    return ids.map((i, j) => {
      const row = Math.floor(j / cols);
      const col = j % cols;

      const rowCount = Math.min(
        cols,
        ids.length - row * cols
      );

      return {
        i,
        s,
        p: [
          sp.x + (col - (rowCount - 1) / 2) * pitchX,
          cy + ((rows - 1) / 2 - row) * pitchY,
          0
        ]
      };
    });
  }

  function moveGroup(kind, sp) {
    return groupedSlots(kind, sp).flatMap(slot =>
      placeCard(
        slot.i,
        slot.p,
        slot.s
      )
    );
  }

  // Enlarged view for the two failed pumps.
  function failureFocusSlots() {
    const s = P ? 1.65 : 1.40;
    const spacing = P ? 2.70 : 2.75;
    const y = P ? -0.70 : -0.30;

    return FAILURES.map((i, j) => ({
      i,
      s,
      p: [
        CX + (j - 0.5) * spacing,
        y,
        0
      ]
    }));
  }

  // Enlarged view of the ten non-failing pumps.
  function safeFocusSlots() {
    const cols = P ? 4 : 5;
    const rows = Math.ceil(SAFE.length / cols);

    const s = P ? 0.98 : 0.92;

    const pitchX = P ? 1.48 : 1.35;
    const pitchY = P ? 1.48 : 1.20;

    const cy = P ? -1.30 : -0.72;

    return SAFE.map((i, j) => {
      const row = Math.floor(j / cols);
      const col = j % cols;

      const rowCount = Math.min(
        cols,
        SAFE.length - row * cols
      );

      return {
        i,
        s,
        p: [
          CX + (col - (rowCount - 1) / 2) * pitchX,
          cy + ((rows - 1) / 2 - row) * pitchY,
          0
        ]
      };
    });
  }

  function moveFocus(kind) {
    const slots = kind === 'failed'
      ? failureFocusSlots()
      : safeFocusSlots();

    return slots.flatMap(slot =>
      placeCard(
        slot.i,
        slot.p,
        slot.s
      )
    );
  }

  // ------------------------------------------------------------
  // 10: Prepare two empty groups.
  // ------------------------------------------------------------

  await until(S(10));

  const stagingMoves = IDS.flatMap(i =>
    placeCard(
      i,
      stagingPosition(i),
      P ? 0.68 : 0.60
    )
  );

  await play(
    ...clearBox(),
    ...stagingMoves,
    ...setPanels(STAGING_LAYOUT),
    ...say('SORT BY WHAT ACTUALLY HAPPENED')
  );

  // ------------------------------------------------------------
  // 11: Move the two failed pumps into the left group.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...moveGroup(
      'failed',
      STAGING_LAYOUT.failed
    ),
    ...metric(
      'failed',
      '2 pumps',
      RED
    ),
    ...say('LEFT: THE 2 REAL FAILURES', RED)
  );

  // ------------------------------------------------------------
  // 12: Move the ten non-failing pumps into the right group.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    ...moveGroup(
      'safe',
      STAGING_LAYOUT.safe
    ),
    ...metric(
      'safe',
      '10 pumps',
      GREEN
    ),
    ...say('RIGHT: THE 10 WITHOUT FAILURES', GREEN)
  );

  // ------------------------------------------------------------
  // 13–20: Sensitivity.
  //
  // Only the actual failures are in the denominator.
  // Focus on the two red-diamond cards.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...SAFE.flatMap(i => hideCard(i)),
    ...setPanels({
      failed: FOCUS_LAYOUT
    }),
    ...moveFocus('failed'),
    ...say('LOOK ONLY AT THE REAL FAILURES', RED)
  );

  const FAIL_FOCUS = failureFocusSlots();

  const failureQuestionLabels = FAIL_FOCUS.map(slot =>
    text(
      'REAL FAILURE',
      17,
      RED,
      slot.p[0],
      slot.p[1] - CARD_H * slot.s / 2 - 0.34,
      true,
      2.45
    )
  );

  await until(S(14));
  await play(
    ...fadeIn(failureQuestionLabels),
    ...focus(FAILURES, RED, 'outcome'),
    ...say('TWO REAL PROBLEMS TO CATCH', RED)
  );

  const caughtLabel = pill(
    'CAUGHT',
    GREEN,
    18
  );

  caughtLabel.moveTo([
    FAIL_FOCUS[0].p[0],
    FAIL_FOCUS[0].p[1] -
      CARD_H * FAIL_FOCUS[0].s / 2 - 0.34,
    0
  ]);

  const missedLabel = pill(
    'MISSED',
    RED,
    18
  );

  missedLabel.moveTo([
    FAIL_FOCUS[1].p[0],
    FAIL_FOCUS[1].p[1] -
      CARD_H * FAIL_FOCUS[1].s / 2 - 0.34,
    0
  ]);

  await until(S(15));
  await play(
    new M.FadeOut(failureQuestionLabels[0]),
    new M.FadeIn(caughtLabel),
    ...focus([1], AMBER, 'alert'),
    ...fbox([
      ['Pump 2', WHITE],
      ['alert + real failure', GREEN],
      ['failure caught', GREEN]
    ], GREEN),
    ...say('P2 HAS A BELL: FAILURE CAUGHT', GREEN)
  );

  await until(S(16));
  await play(
    new M.FadeOut(failureQuestionLabels[1]),
    new M.FadeIn(missedLabel),
    ...focus([3], RED, 'outcome'),
    ...fbox([
      ['Pump 4', WHITE],
      ['no alert + real failure', RED],
      ['failure missed', RED]
    ], RED),
    ...say('P4 HAS NO BELL: FAILURE MISSED', RED)
  );

  await until(S(17));
  await play(
    ...metric(
      'failed',
      `${R60.tp.length} of ${FAILURES.length} caught`,
      WHITE
    ),
    ...fbox([
      ['caught failures = 1', GREEN],
      ['real failures   = 2', RED]
    ], C.cyan),
    ...say('WE CAUGHT 1 FAILURE OUT OF 2')
  );

  // ------------------------------------------------------------
  // Fraction strip.
  // One segment per pump in the denominator.
  // Filled segments identify successful decisions.
  // ------------------------------------------------------------

  function fractionStrip(
    x,
    y,
    n,
    k,
    color,
    width = 3.60,
    height = 0.32
  ) {
    const gap = 0.045;
    const cw = (width - gap * (n - 1)) / n;

    const blocks = Array.from({ length: n }, (_, i) =>
      rect(
        x - width / 2 + cw / 2 + i * (cw + gap),
        y,
        cw,
        height,
        i < k ? color : C.muted,
        i < k ? 0.88 : 0.06,
        1.4
      )
    );

    return new M.VGroup(...blocks);
  }

  const halfStrip = fractionStrip(
    CX,
    P ? -3.18 : -2.03,
    2,
    1,
    GREEN,
    P ? 4.30 : 4.15,
    0.35
  );

  await until(S(18));
  await play(
    new M.FadeIn(halfStrip),
    ...metric(
      'failed',
      '1 ÷ 2 = 50%',
      GREEN
    ),
    ...fbox([
      '1 ÷ 2',
      ['= 0.5', WHITE],
      ['= 50%', GREEN]
    ], GREEN),
    ...say('ONE HALF = 50%', GREEN)
  );

  await until(S(19));
  await play(
    ...metric(
      'failed',
      `SENSITIVITY = ${pct(R60.sensitivity)}`,
      RED
    ),
    ...fbox([
      ['sensitivity', RED],
      'share of real failures',
      'that we catch'
    ], RED),
    ...say('THIS SHARE IS CALLED SENSITIVITY', RED)
  );

  await until(S(20));
  await play(
    ...focus(FAILURES, RED, 'outcome'),
    new M.Indicate(caughtLabel, {
      color: GREEN
    }),
    ...fbox([
      ['when a pump really fails...', RED],
      'how often do we warn?',
      ['here: 50%', GREEN]
    ], RED),
    ...say('HOW MANY REAL FAILURES DO WE CATCH?', RED)
  );

  // ------------------------------------------------------------
  // 21–30: Specificity.
  //
  // Switch to the ten pumps that did not fail.
  // Only these ten pumps belong in the denominator.
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    ...fadeOut([
      caughtLabel,
      missedLabel,
      halfStrip
    ]),
    ...FAILURES.flatMap(i => hideCard(i)),
    ...setPanels({
      safe: FOCUS_LAYOUT
    }),
    ...moveFocus('safe'),
    ...clearBox(),
    ...say('NOW LOOK AT THE 10 NON-FAILING PUMPS', GREEN)
  );

  await until(S(22));
  await play(
    ...fbox([
      ['desired decision', GREEN],
      'no failure → no alert',
      'avoid unnecessary work'
    ], GREEN),
    ...say('WE WANT TO LEAVE THESE PUMPS ALONE', GREEN)
  );

  await until(S(23));
  await play(
    lag(
      focus(SAFE, GREEN, 'outcome'),
      1.4,
      0.08
    ),
    ...say('WHICH OF THESE CARDS HAVE BELLS?', AMBER)
  );

  // Draw an outline using card coordinates.
  // Never use a new group around already-visible objects.
  function cardOutline(i, color = AMBER) {
    const c = cards[i];

    const outline = new M.RoundedRectangle({
      width: CARD_W * c.s + 0.18,
      height: CARD_H * c.s + 0.18,
      cornerRadius: 0.12,
      color,
      strokeWidth: 3
    });

    outline.setFill(color, 0);

    outline.moveTo([
      c.x,
      c.y,
      0
    ]);

    return outline;
  }

  const falseAlarmOutlines = R60.fp.map(i =>
    cardOutline(i, AMBER)
  );

  await until(S(24));
  await play(
    ...falseAlarmOutlines.map(o =>
      new M.Create(o)
    ),
    ...focus(R60.fp, AMBER, 'alert'),
    ...fbox([
      ['P1 and P3', AMBER],
      'alert raised',
      ['but no real failure', GREEN]
    ], AMBER),
    ...say('P1 AND P3: ALERTS WITHOUT FAILURES', AMBER)
  );

  await until(S(25));
  await play(
    ...metric(
      'safe',
      `${R60.fp.length} false alarms`,
      AMBER
    ),
    ...fbox([
      ['false alarms = 2', AMBER],
      'unnecessary repair work'
    ], AMBER),
    ...say('TWO FALSE ALARMS', AMBER)
  );

  await until(S(26));
  await play(
    ...fadeOut(falseAlarmOutlines),
    lag(
      focus(R60.tn, GREEN),
      1.8,
      0.10
    ),
    ...fbox([
      ['8 pumps without alerts', GREEN],
      '8 correct decisions'
    ], GREEN),
    ...say('THE OTHER 8 WERE CORRECTLY LEFT ALONE', GREEN)
  );

  await until(S(27));
  await play(
    ...metric(
      'safe',
      `${R60.tn.length} of ${SAFE.length} left alone`,
      GREEN
    ),
    ...fbox([
      ['correctly left alone = 8', GREEN],
      'non-failing pumps    = 10'
    ], GREEN),
    ...say('8 CORRECT NO-ALERT DECISIONS OUT OF 10', GREEN)
  );

  const eightStrip = fractionStrip(
    CX,
    P ? -3.68 : -2.13,
    10,
    8,
    GREEN,
    P ? 5.4 : 5.5,
    0.26
  );

  // Keep the strip below the cards and above the panel metric.
  await until(S(28));
  await play(
    new M.FadeIn(eightStrip),
    ...metric(
      'safe',
      '8 ÷ 10 = 80%',
      GREEN
    ),
    ...fbox([
      '8 ÷ 10',
      '= 80 ÷ 100',
      ['= 80%', GREEN]
    ], GREEN),
    ...say('EIGHT OUT OF TEN = 80%', GREEN)
  );

  await until(S(29));
  await play(
    ...metric(
      'safe',
      `SPECIFICITY = ${pct(R60.specificity)}`,
      GREEN
    ),
    ...fbox([
      ['specificity', GREEN],
      'share of non-failing pumps',
      'correctly left without alerts'
    ], GREEN),
    ...say('THIS SHARE IS CALLED SPECIFICITY', GREEN)
  );

  await until(S(30));
  await play(
    lag(
      focus(R60.tn, GREEN, 'outcome'),
      1.8,
      0.10
    ),
    ...fbox([
      ['when a pump does not fail...', GREEN],
      'how often do we stay quiet?',
      ['here: 80%', GREEN]
    ], GREEN),
    ...say('HOW OFTEN DO WE CORRECTLY STAY QUIET?', GREEN)
  );

  // ------------------------------------------------------------
  // 31–35: Compare the two measures together.
  //
  // The denominator groups remain disjoint.
  // Failed: P2 and P4.
  // Did not fail: the remaining ten pumps.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    new M.FadeOut(eightStrip),
    ...setPanels(BOTH_LAYOUT),
    ...moveGroup(
      'failed',
      BOTH_LAYOUT.failed
    ),
    ...moveGroup(
      'safe',
      BOTH_LAYOUT.safe
    ),
    ...clearBox(),
    ...say('TWO GROUPS, SIDE BY SIDE')
  );

  await until(S(32));
  await play(
    ...metric(
      'failed',
      `SENS. ${pct(R60.sensitivity)}`,
      RED
    ),
    ...metric(
      'safe',
      `SPECIFICITY ${pct(R60.specificity)}`,
      GREEN
    ),
    ...fbox([
      ['sensitivity = 50%', RED],
      ['specificity = 80%', GREEN]
    ]),
    ...say('SENSITIVITY 50% · SPECIFICITY 80%')
  );

  await until(S(33));
  await play(
    new M.Indicate(
      panels.failed.frame,
      { color: RED }
    ),
    new M.Indicate(
      panels.safe.frame,
      { color: GREEN }
    ),
    ...fbox([
      ['sensitivity: 2 real failures', RED],
      ['specificity: 10 non-failures', GREEN],
      'different denominator groups'
    ]),
    ...say('EACH NUMBER HAS ITS OWN GROUP')
  );

  await until(S(34));
  await play(
    ...indicatePanel(
      'failed',
      RED
    ),
    ...focus(FAILURES, RED, 'outcome'),
    ...fbox([
      ['sensitivity starts with', RED],
      ['actual failures', RED],
      'P2 and P4'
    ], RED),
    ...say('SENSITIVITY STARTS WITH REAL FAILURES', RED)
  );

  await until(S(35));
  await play(
    ...indicatePanel(
      'safe',
      GREEN
    ),
    lag(
      focus(SAFE, GREEN, 'outcome'),
      1.5,
      0.08
    ),
    ...fbox([
      ['specificity starts with', GREEN],
      ['actual non-failures', GREEN],
      'the other 10 pumps'
    ], GREEN),
    ...say('SPECIFICITY STARTS WITH NON-FAILURES', GREEN)
  );

  // ------------------------------------------------------------
  // 36–40: Introduce the formulas after the visual explanation.
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    ...clearBox(),
    ...say('TWO SHORT FORMULAS')
  );

  await until(S(37));
  await play(
    ...indicatePanel('failed', RED),
    ...focus(R60.tp, AMBER, 'alert'),
    ...fbox([
      ['sensitivity =', RED],
      '  caught failures',
      '  ÷ all real failures'
    ], RED),
    ...say('CAUGHT FAILURES ÷ ALL REAL FAILURES', RED)
  );

  await until(S(38));
  await play(
    ...fbox([
      ['sensitivity', RED],
      '  = 1 ÷ 2',
      ['  = 50%', RED]
    ], RED),
    new M.Indicate(
      panels.failed.metric,
      { color: RED }
    ),
    ...say('SENSITIVITY = 1 ÷ 2 = 50%', RED)
  );

  await until(S(39));
  await play(
    ...indicatePanel('safe', GREEN),
    lag(
      focus(R60.tn, GREEN),
      1.6,
      0.09
    ),
    ...fbox([
      ['specificity =', GREEN],
      '  correctly left without alerts',
      '  ÷ all non-failing pumps'
    ], GREEN),
    ...say('CORRECT NO-ALERTS ÷ ALL NON-FAILURES', GREEN)
  );

  await until(S(40));
  await play(
    ...fbox([
      ['specificity', GREEN],
      '  = 8 ÷ 10',
      ['  = 80%', GREEN]
    ], GREEN),
    new M.Indicate(
      panels.safe.metric,
      { color: GREEN }
    ),
    ...say('SPECIFICITY = 8 ÷ 10 = 80%', GREEN)
  );

  // ------------------------------------------------------------
  // 41–46: Lower the alert threshold from 60% to 30%.
  //
  // Actual outcomes stay fixed.
  // P4, P5 and P6 gain amber bells.
  //
  // At 30%:
  // TP = 2, FN = 0, FP = 4, TN = 6.
  // Sensitivity = 100%.
  // Specificity = 60%.
  // ------------------------------------------------------------

  await until(S(41));
  await play(
    ...showGauge(60),
    ...say('WHAT IF WE LOWER 60% TO 30%?', AMBER)
  );

  await until(S(42));
  await play(
    ...moveGauge(30),
    lag(
      NEW_ALERTS.flatMap(i =>
        setAlert(i, true)
      ),
      1.2,
      0.20
    ),
    ...focus(NEW_ALERTS, AMBER),
    ...clearMetric('failed'),
    ...clearMetric('safe'),
    ...say('P4, P5 AND P6 RECEIVE BELLS TOO', AMBER)
  );

  await until(S(43));
  await play(
    ...hideGauge(),
    ...focus(R30.tp, AMBER, 'alert'),
    ...metric(
      'failed',
      `SENS. ${pct(R30.sensitivity)}`,
      RED
    ),
    ...fbox([
      ['threshold: 30%', AMBER],
      ['sensitivity: 2 ÷ 2', RED],
      ['= 100%', RED]
    ], RED),
    ...say('BOTH FAILURES CAUGHT: 100%', RED)
  );

  await until(S(44));
  await play(
    lag(
      focus(R30.tn, GREEN),
      1.4,
      0.11
    ),
    ...metric(
      'safe',
      `${R30.tn.length} of ${SAFE.length} left alone`,
      GREEN
    ),
    ...fbox([
      ['non-failing pumps = 10', GREEN],
      ['correctly left alone = 6', GREEN],
      ['false alarms = 4', AMBER]
    ], GREEN),
    ...say('ONLY 6 OF 10 ARE NOW LEFT ALONE', GREEN)
  );

  await until(S(45));
  await play(
    ...metric(
      'safe',
      `SPECIFICITY ${pct(R30.specificity)}`,
      GREEN
    ),
    ...fbox([
      ['specificity', GREEN],
      '6 ÷ 10 = 60%',
      ['80% → 60%', AMBER]
    ], GREEN),
    ...say('SPECIFICITY FALLS TO 60%', GREEN)
  );

  await until(S(46));
  await play(
    ...focus([3], AMBER, 'alert'),
    ...focus([4, 5], AMBER, 'alert'),
    ...fbox([
      ['threshold: 60% → 30%', AMBER],
      ['sensitivity: 50% → 100%', RED],
      ['specificity: 80% → 60%', GREEN],
      ['false alarms: 2 → 4', AMBER]
    ]),
    ...say('MORE FAILURES CAUGHT, MORE FALSE ALARMS', AMBER)
  );

  // ------------------------------------------------------------
  // 47–48: Explain when each measure matters.
  // ------------------------------------------------------------

  await until(S(47));
  await play(
    ...indicatePanel('failed', RED),
    ...fbox([
      ['USE SENSITIVITY', RED],
      'when missed failures',
      'are costly or dangerous'
    ], RED),
    ...say('WHEN MISSING A FAILURE REALLY MATTERS', RED)
  );

  await until(S(48));
  await play(
    ...indicatePanel('safe', GREEN),
    ...fbox([
      ['USE SPECIFICITY', GREEN],
      'when unnecessary alerts',
      'consume time and resources'
    ], GREEN),
    ...say('WHEN UNNECESSARY ALERTS ARE COSTLY', GREEN)
  );

  // ------------------------------------------------------------
  // 49–52: Counterexample — a tool that alerts for every pump.
  //
  // All twelve cards receive bells.
  // Both real failures are caught.
  // None of the ten non-failing pumps is left alone.
  //
  // Sensitivity = 100%.
  // Specificity = 0%.
  // ------------------------------------------------------------

  await until(S(49));
  await play(
    ...fbox([
      ['one number is not enough', AMBER],
      'consider both jobs'
    ], AMBER),
    ...say('BE CAREFUL WITH EITHER NUMBER ALONE', AMBER)
  );

  const ALL_NEW_ALERTS = R10.alerts.filter(i =>
    !R30.alerts.includes(i)
  );

  await until(S(50));
  await play(
    lag(
      ALL_NEW_ALERTS.flatMap(i =>
        setAlert(i, true)
      ),
      1.9,
      0.12
    ),
    ...focus(FAILURES, AMBER, 'alert'),
    ...metric(
      'failed',
      `SENS. ${pct(R10.sensitivity)}`,
      RED
    ),
    ...clearMetric('safe'),
    ...fbox([
      ['alert every pump', AMBER],
      'caught failures = 2 of 2',
      ['sensitivity = 100%', RED]
    ], RED),
    ...say('ALERT EVERY PUMP: 100% SENSITIVITY', RED)
  );

  await until(S(51));
  await play(
    lag(
      focus(SAFE, AMBER, 'alert'),
      1.9,
      0.08
    ),
    ...metric(
      'safe',
      `SPECIFICITY ${pct(R10.specificity)}`,
      GREEN
    ),
    ...fbox([
      ['all 10 non-failing pumps alert', AMBER],
      'correctly left alone = 0',
      ['specificity = 0%', GREEN]
    ], GREEN),
    ...say('NO PUMP LEFT ALONE: 0% SPECIFICITY', GREEN)
  );

  await until(S(52));
  await play(
    new M.Indicate(
      panels.failed.metric,
      { color: RED }
    ),
    new M.Indicate(
      panels.safe.metric,
      { color: GREEN }
    ),
    ...fbox([
      ['sensitivity = 100%', RED],
      ['specificity = 0%', GREEN],
      ['always examine both', AMBER]
    ]),
    ...say('LOOK AT BOTH NUMBERS TOGETHER')
  );

  // ------------------------------------------------------------
  // 53: Final recap.
  //
  // Restore the original 60% example.
  // Retain both actual-outcome groups and their denominators.
  // The card symbols explain the two measures without relying
  // on colour alone.
  // ------------------------------------------------------------

  await until(S(53));

  const restoreAlerts = setThreshold(60);

  await play(
    ...restoreAlerts,
    ...metric(
      'failed',
      '1/2 = 50%',
      RED
    ),
    ...metric(
      'safe',
      '8/10 = 80%',
      GREEN
    ),
    ...fbox([
      ['SENSITIVITY', RED],
      '  real failures caught',
      ['SPECIFICITY', GREEN],
      '  non-failures left alone'
    ]),
    ...say('AT 60%: CATCH FAILURES · AVOID FALSE ALARMS')
  );

  // Hold the final picture until the narration finishes.
  await until(E(53));
}

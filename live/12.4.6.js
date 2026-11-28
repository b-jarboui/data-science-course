// lesson 12.4.6
// ROC curves — live, narration-synchronised lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser playback has not been verified here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed chapter data.
  // ------------------------------------------------------------

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

  const THRESHOLDS = [100, 90, 60, 30, 10];

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

      tpr: tp.length / FAILURES.length,
      fpr: fp.length / SAFE.length,

      precision: alerts.length
        ? tp.length / alerts.length
        : null
    };
  }

  const RESULTS = THRESHOLDS.map(evaluate);

  const R100 = RESULTS[0];
  const R90 = RESULTS[1];
  const R60 = RESULTS[2];
  const R30 = RESULTS[3];
  const R10 = RESULTS[4];

  const ROC_POINTS = RESULTS.map(r => [
    r.fpr * 100,
    r.tpr * 100
  ]);

  // Checked points:
  // Threshold 100% -> (  0,   0)
  // Threshold  90% -> ( 10,   0)
  // Threshold  60% -> ( 20,  50)
  // Threshold  30% -> ( 40, 100)
  // Threshold  10% -> (100, 100)
  //
  // The corresponding area under the piecewise-linear curve
  // is 0.775. Area is not displayed in this lesson because
  // the narration has not yet introduced AUC.

  const pct = v =>
    `${Math.round(v * 100)}%`;

  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;
  const VIOLET = C.violet;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Laptop:
  //   graph on the left, threshold cards on the right.
  //
  // Phone:
  //   formula box at the top, threshold cards in the middle,
  //   graph underneath.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.52, 0]
    : [4.3, -0.30, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // Basic drawing helpers.
  // ------------------------------------------------------------

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

  function rect(
    x, y, w, h,
    color,
    opacity = 0.2,
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

  function circle(
    x, y, radius,
    color,
    opacity = 1,
    sw = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function lag(
    anims,
    runTime = 1.2,
    lagRatio = 0.12
  ) {
    return new M.LaggedStart(anims, {
      runTime,
      lagRatio
    });
  }

  const fadeIn = objects =>
    objects.filter(Boolean).map(o =>
      new M.FadeIn(o)
    );

  const fadeOut = objects =>
    objects.filter(Boolean).map(o =>
      new M.FadeOut(o)
    );

  function arrow(x1, y1, x2, y2, color, head = 0.15) {
    const angle = Math.atan2(
      y2 - y1,
      x2 - x1
    );

    const a = angle + Math.PI * 0.82;
    const b = angle - Math.PI * 0.82;

    return new M.VGroup(
      line(
        x1, y1, x2, y2,
        color, 2.5
      ),

      line(
        x2,
        y2,
        x2 + head * Math.cos(a),
        y2 + head * Math.sin(a),
        color,
        2.5
      ),

      line(
        x2,
        y2,
        x2 + head * Math.cos(b),
        y2 + head * Math.sin(b),
        color,
        2.5
      )
    );
  }

  // ------------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan,
    position = BOXP,
    maxWidth = null
  ) {
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
      position[0],
      position[1],
      wd,
      ht,
      color,
      C.card,
      0.95,
      2,
      0.18
    );

    const left =
      position[0] - wd / 2 + 0.325;

    const top =
      position[1] + ht / 2 - 0.175 - lh / 2;

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

    const maxw =
      maxWidth === null
        ? (P ? FW - 1.2 : 4.10)
        : maxWidth;

    const maxh = P ? 1.38 : 2.40;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(position);

    const anims = [];

    if (boxNow) {
      anims.push(
        new M.FadeOut(boxNow)
      );
    }

    anims.push(
      new M.FadeIn(g)
    );

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

  // Water pump: motor, pump housing, inlet, outlet and feet.
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

  // ------------------------------------------------------------
  // Pump card helpers.
  //
  // Base, probability, outcome and alert remain independent
  // scene objects. This allows the cards to move without
  // wrapping already-visible objects in new groups.
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
      0.66 * s
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

  function outcomeMark(i, x, y, s) {
    const xx = x + 0.37 * s;
    const yy = y - 0.055 * s;

    return DATA[i].failed
      ? failureIcon(xx, yy, s)
      : safeIcon(xx, yy, s);
  }

  function alertMark(x, y, s) {
    const outline = rounded(
      x,
      y,
      CARD_W * s + 0.035,
      CARD_H * s + 0.035,
      AMBER,
      AMBER,
      0,
      2.3,
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

  const cards = DATA.map((d, i) => ({
    i,
    x: 0,
    y: 0,
    s: 1,

    visible: false,
    hasChance: false,
    hasOutcome: false,
    alerted: false,

    base: null,
    chance: null,
    outcome: null,
    alert: null
  }));

  function cardObjects(c) {
    return [
      c.base,
      c.chance,
      c.outcome,
      c.alert
    ].filter(Boolean);
  }

  function placeCard(c, p, s = 1) {
    const x = p[0];
    const y = p[1];

    const anims = [];

    if (!c.visible) {
      c.base = cardBase(
        c.i, x, y, s
      );

      c.chance = c.hasChance
        ? chanceLabel(c.i, x, y, s)
        : null;

      c.outcome = c.hasOutcome
        ? outcomeMark(c.i, x, y, s)
        : null;

      c.alert = c.alerted
        ? alertMark(x, y, s)
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

      if (c.outcome) {
        anims.push(
          new M.Transform(
            c.outcome,
            outcomeMark(c.i, x, y, s)
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
    }

    c.x = x;
    c.y = y;
    c.s = s;

    return anims;
  }

  function hideCard(c) {
    if (!c.visible) return [];

    const anims = fadeOut(
      cardObjects(c)
    );

    c.visible = false;

    c.base = null;
    c.chance = null;
    c.outcome = null;
    c.alert = null;

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

    return [
      new M.FadeIn(c.chance)
    ];
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

    return [
      new M.FadeIn(c.outcome)
    ];
  }

  function setAlert(c, alerted) {
    if (c.alerted === alerted) {
      return [];
    }

    c.alerted = alerted;

    if (!c.visible) return [];

    if (alerted) {
      c.alert = alertMark(
        c.x,
        c.y,
        c.s
      );

      return [
        new M.FadeIn(c.alert)
      ];
    }

    const old = c.alert;
    c.alert = null;

    return old
      ? [new M.FadeOut(old)]
      : [];
  }

  function applyThreshold(threshold) {
    return cards.flatMap(c =>
      setAlert(
        c,
        DATA[c.i].prob >= threshold
      )
    );
  }

  function focus(
    ids,
    color = AMBER,
    part = 'base'
  ) {
    return ids
      .map(i => cards[i][part])
      .filter(Boolean)
      .map(o =>
        new M.Indicate(o, {
          color,
          runTime: 0.85
        })
      );
  }

  function cardOutline(i, color, pad = 0.10) {
    const c = cards[i];

    const r = new M.RoundedRectangle({
      width: CARD_W * c.s + pad,
      height: CARD_H * c.s + pad,
      cornerRadius: 0.10,
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

  let cardHighlights = [];

  function clearCardHighlights() {
    const anims = fadeOut(
      cardHighlights
    );

    cardHighlights = [];

    return anims;
  }

  function highlightCards(ids, color) {
    const old = clearCardHighlights();

    cardHighlights = ids.map(i =>
      cardOutline(i, color)
    );

    return [
      ...old,
      ...cardHighlights.map(o =>
        new M.Create(o)
      )
    ];
  }

  // ------------------------------------------------------------
  // Initial twelve-card layout.
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

  function showGrid() {
    return cards.flatMap(c =>
      placeCard(
        c,
        gridPosition(c.i),
        GRID_SCALE
      )
    );
  }

  // ------------------------------------------------------------
  // 0–2: Introduce the practical threshold question.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.40 : -0.25;

  const introPump = pumpIcon(
    CX,
    INTRO_Y + 0.22,
    P ? 2.60 : 2.50,
    C.cyan
  );

  const introBell = bellIcon(
    CX + 1.52,
    INTRO_Y + 0.95,
    1.85
  );

  const introTitle = text(
    'PREDICTION TOOL',
    22,
    WHITE,
    CX,
    INTRO_Y - 1.02,
    true
  );

  const catchTag = pill(
    'CATCH REAL FAILURES',
    RED,
    17
  );

  catchTag.moveTo([
    CX,
    P ? -2.48 : -1.97,
    0
  ]);

  const falseAlarmTag = pill(
    'AVOID FALSE ALARMS',
    AMBER,
    17
  );

  falseAlarmTag.moveTo([
    CX,
    P ? -3.00 : -2.45,
    0
  ]);

  await until(S(0));
  await play(
    new M.FadeIn(introPump),
    new M.FadeIn(introBell),
    new M.FadeIn(introTitle),
    ...say('WHEN SHOULD THE TOOL RAISE AN ALERT?', AMBER)
  );

  await until(S(1));
  await play(
    new M.FadeIn(catchTag),
    new M.FadeIn(falseAlarmTag),
    ...say('CATCH FAILURES WITHOUT TOO MANY FALSE ALARMS')
  );

  await until(S(2));
  await play(
    new M.Indicate(introBell, {
      color: AMBER
    }),
    ...fbox([
      ['alert threshold', AMBER],
      'where should we set',
      'the decision boundary?'
    ], AMBER),
    ...say('WHERE SHOULD THE BOUNDARY BE?', AMBER)
  );

  // ------------------------------------------------------------
  // 3: Bring back the twelve numbered pump cards.
  // ------------------------------------------------------------

  await until(S(3));
  await play(
    ...fadeOut([
      introPump,
      introBell,
      introTitle,
      catchTag,
      falseAlarmTag
    ]),
    ...clearBox(),
    lag(
      showGrid(),
      1.15,
      0.07
    ),
    ...say('THE SAME 12 WATER PUMPS')
  );

  // ------------------------------------------------------------
  // 4–7: Reveal the predicted failure probabilities.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...revealChance(cards[0]),
    ...focus([0], BLUE),
    ...say('P1: 90% CHANCE OF FAILURE', BLUE)
  );

  await until(S(5));
  await play(
    ...revealChance(cards[1]),
    ...revealChance(cards[2]),
    ...focus([1, 2], BLUE),
    ...say('P2 AND P3: 60% EACH', BLUE)
  );

  await until(S(6));
  await play(
    lag(
      [3, 4, 5].flatMap(i =>
        revealChance(cards[i])
      ),
      1.20,
      0.16
    ),
    ...say('P4, P5 AND P6: 30% EACH', BLUE)
  );

  await until(S(7));
  await play(
    lag(
      [6, 7, 8, 9, 10, 11].flatMap(i =>
        revealChance(cards[i])
      ),
      1.45,
      0.10
    ),
    ...say('THE REMAINING SIX: 10% EACH', BLUE)
  );

  // ------------------------------------------------------------
  // 8–9: Reveal actual outcomes.
  //
  // These outcomes remain fixed during every threshold change.
  // ------------------------------------------------------------

  await until(S(8));
  await play(
    ...focus(FAILURES, RED),
    ...fbox([
      ['10 hours later', WHITE],
      ['P2 and P4 actually failed', RED]
    ], RED),
    ...say('ONLY P2 AND P4 ACTUALLY FAIL', RED)
  );

  await until(S(9));
  await play(
    ...FAILURES.flatMap(i =>
      revealOutcome(cards[i])
    ),
    lag(
      SAFE.flatMap(i =>
        revealOutcome(cards[i])
      ),
      1.50,
      0.07
    ),
    ...fbox([
      ['red diamond = real failure', RED],
      ['green circle = no failure', GREEN]
    ]),
    ...say('2 FAILURES · 10 NON-FAILURES')
  );

  // ------------------------------------------------------------
  // Ranked probability bands.
  //
  // All cards with equal probabilities occupy the same row.
  // The gate moves between rows, ensuring that tied scores
  // always receive the same alert decision.
  //
  // This is a ranked-card layout, not a linear probability axis.
  // ------------------------------------------------------------

  const BANDS = [
    { prob: 90, ids: [0] },
    { prob: 60, ids: [1, 2] },
    { prob: 30, ids: [3, 4, 5] },
    { prob: 10, ids: [6, 7, 8, 9, 10, 11] }
  ];

  const BAND_CX = P ? -0.33 : 3.65;

  const BAND_Y = P
    ? [1.44, 0.68, -0.08, -0.84]
    : [1.25, 0.36, -0.53, -1.42];

  const BAND_SCALE = P ? 0.58 : 0.54;
  const BAND_PITCH = P ? 0.84 : 0.77;

  const BAND_LABEL_X = P ? 3.25 : 6.30;

  function bandSlot(k, j) {
    const n = BANDS[k].ids.length;

    return [
      BAND_CX +
        (j - (n - 1) / 2) * BAND_PITCH,

      BAND_Y[k],
      0
    ];
  }

  function rankedMoves() {
    return BANDS.flatMap((band, k) =>
      band.ids.flatMap((i, j) =>
        placeCard(
          cards[i],
          bandSlot(k, j),
          BAND_SCALE
        )
      )
    );
  }

  const bandLabels = BANDS.map((band, k) =>
    text(
      `${band.prob}%`,
      15,
      BLUE,
      BAND_LABEL_X,
      BAND_Y[k],
      true,
      0.72
    )
  );

  // Phone: the pill already says this, and there is no free room above the cards.
  const rankedHeading = text(
    P ? ' ' : 'HIGHEST TO LOWEST CHANCE',
    P ? 16 : 17,
    BLUE,
    BAND_CX,
    P ? 1.96 : 1.95,
    true,
    P ? 6.1 : 5.4
  );

  // ------------------------------------------------------------
  // 10: Arrange the cards by predicted probability.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...clearBox(),
    ...rankedMoves(),
    new M.FadeIn(rankedHeading),
    ...fadeIn(bandLabels),
    ...say('SORT FROM HIGHEST TO LOWEST CHANCE', BLUE)
  );

  // ------------------------------------------------------------
  // Sliding gate.
  //
  // The cards above the gate receive alerts.
  // The gate is placed below the last qualifying probability
  // band, so the rule remains inclusive: probability >= cutoff.
  // ------------------------------------------------------------

  const GATE_X0 = P ? -3.12 : 1.05;
  const GATE_X1 = P ? 2.42 : 5.94;

  const GATE_POSITIONS = {
    100: BAND_Y[0] + 0.36,

    90:
      (BAND_Y[0] + BAND_Y[1]) / 2,

    60:
      (BAND_Y[1] + BAND_Y[2]) / 2,

    30:
      (BAND_Y[2] + BAND_Y[3]) / 2,

    10:
      BAND_Y[3] - (P ? 0.37 : 0.40)
  };

  function gateLine(threshold) {
    const y = GATE_POSITIONS[threshold];

    const rail = line(
      GATE_X0,
      y,
      GATE_X1,
      y,
      AMBER,
      4
    );

    const end1 = circle(
      GATE_X0,
      y,
      0.055,
      AMBER,
      1,
      1
    );

    const end2 = circle(
      GATE_X1,
      y,
      0.055,
      AMBER,
      1,
      1
    );

    const handle = rounded(
      GATE_X0 - 0.04,
      y,
      0.16,
      0.24,
      AMBER,
      AMBER,
      0.85,
      1.5,
      0.05
    );

    return new M.VGroup(
      rail,
      end1,
      end2,
      handle
    );
  }

  function gateLabel(threshold) {
    const g = pill(
      `≥${threshold}%`,
      AMBER,
      P ? 15 : 13
    );

    g.moveTo([
      P ? 3.22 : 6.36,
      GATE_POSITIONS[threshold],
      0
    ]);

    return g;
  }

  let currentThreshold = 100;

  let gate = null;
  let gateTag = null;

  function showGate(threshold) {
    currentThreshold = threshold;

    gate = gateLine(threshold);
    gateTag = gateLabel(threshold);

    return [
      new M.FadeIn(gate),
      new M.FadeIn(gateTag)
    ];
  }

  function moveGate(threshold) {
    currentThreshold = threshold;

    const nextTag = gateLabel(threshold);

    const anims = [
      ...clearCardHighlights(),
      new M.Transform(
        gate,
        gateLine(threshold)
      ),
      new M.FadeOut(gateTag),
      new M.FadeIn(nextTag)
    ];

    gateTag = nextTag;

    return anims;
  }

  function hideGate() {
    const anims = fadeOut([
      gate,
      gateTag
    ]);

    gate = null;
    gateTag = null;

    return anims;
  }

  // ------------------------------------------------------------
  // Rate counters.
  //
  // Before the graph exists, the laptop uses the free left area.
  // Once the graph is drawn, the counters sit below the cards.
  // The phone uses the formula box throughout.
  // ------------------------------------------------------------

  let ratePanel = null;
  let rateState = {
    threshold: 100,
    caught: null,
    falseAlarms: null
  };

  let graphVisible = false;

  function clearRatePanel() {
    if (!ratePanel) return [];

    const old = ratePanel;
    ratePanel = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function makeRatePanel() {
    const r = evaluate(
      rateState.threshold
    );

    const caughtKnown =
      rateState.caught !== null;

    const falseKnown =
      rateState.falseAlarms !== null;

    const caughtText = caughtKnown
      ? `Failures caught: ${r.tp.length}/2 = ${pct(r.tpr)}`
      : 'Failures caught: ? / 2';

    const falseText = falseKnown
      ? `False alarms: ${r.fp.length}/10 = ${pct(r.fpr)}`
      : 'False alarms: ? / 10';

    if (P) {
      const x = 0;
      const y = 3.52;

      const w = 6.45;
      const h = 1.29;

      const frame = rounded(
        x, y, w, h,
        AMBER,
        C.card,
        0.95,
        2,
        0.16
      );

      const heading = text(
        `THRESHOLD ${r.threshold}%`,
        17,
        AMBER,
        x,
        y + 0.38,
        true
      );

      const caught = text(
        caughtText,
        17,
        RED,
        x,
        y + 0.01,
        true,
        w - 0.30
      );

      const falseAlarms = text(
        falseText,
        17,
        AMBER,
        x,
        y - 0.36,
        true,
        w - 0.30
      );

      return new M.VGroup(
        frame,
        heading,
        caught,
        falseAlarms
      );
    }

    if (!graphVisible) {
      const x = CX;
      const y = -0.25;
      const w = 5.55;
      const h = 2.10;

      const frame = rounded(
        x, y, w, h,
        AMBER,
        C.card,
        0.95,
        2,
        0.16
      );

      const heading = text(
        `THRESHOLD ${r.threshold}%`,
        23,
        AMBER,
        x,
        y + 0.65,
        true
      );

      const caught = text(
        caughtText,
        20,
        RED,
        x,
        y + 0.02,
        true,
        w - 0.30
      );

      const falseAlarms = text(
        falseText,
        20,
        AMBER,
        x,
        y - 0.60,
        true,
        w - 0.30
      );

      return new M.VGroup(
        frame,
        heading,
        caught,
        falseAlarms
      );
    }

    const x = BAND_CX;

    const caught = text(
      caughtText,
      17,
      RED,
      x,
      -2.22,
      true,
      5.30
    );

    const falseAlarms = text(
      falseText,
      17,
      AMBER,
      x,
      -2.62,
      true,
      5.30
    );

    return new M.VGroup(
      caught,
      falseAlarms
    );
  }

  function refreshRates() {
    const old = clearRatePanel();

    ratePanel = makeRatePanel();

    return [
      ...old,
      new M.FadeIn(ratePanel)
    ];
  }

  function resetRates(threshold) {
    rateState = {
      threshold,
      caught: null,
      falseAlarms: null
    };

    return refreshRates();
  }

  function showCaughtRate() {
    const r = evaluate(
      rateState.threshold
    );

    rateState.caught = r.tp.length;

    return refreshRates();
  }

  function showFalseAlarmRate() {
    const r = evaluate(
      rateState.threshold
    );

    rateState.falseAlarms = r.fp.length;

    return refreshRates();
  }

  function showBothRates() {
    const r = evaluate(
      rateState.threshold
    );

    rateState.caught = r.tp.length;
    rateState.falseAlarms = r.fp.length;

    return refreshRates();
  }

  // ------------------------------------------------------------
  // 11: Introduce the sliding gate.
  // ------------------------------------------------------------

  const gateExplanation = text(
    'Lower the gate to admit more alerts',
    P ? 17 : 20,
    AMBER,
    CX,
    P ? -2.45 : -0.65,
    false,
    P ? 6.4 : 6.0
  );

  const lowerArrow = arrow(
    P ? -3.45 : 0.53,
    BAND_Y[0] + 0.12,
    P ? -3.45 : 0.53,
    BAND_Y[3] - 0.14,
    AMBER,
    0.16
  );

  await until(S(11));
  await play(
    new M.FadeIn(lowerArrow),
    new M.FadeIn(gateExplanation),
    ...say('A LOWER GATE LETS MORE ALERTS THROUGH', AMBER)
  );

  // ------------------------------------------------------------
  // 12–15: Threshold = 100%.
  //
  // TP = 0, FP = 0, FN = 2, TN = 10.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    new M.FadeOut(gateExplanation),
    ...showGate(100),
    ...resetRates(100),
    ...say('BEGIN AT A 100% THRESHOLD', AMBER)
  );

  await until(S(13));
  await play(
    ...focus(IDS, C.muted, 'chance'),
    ...say('NO PUMP REACHES 100% — NO BELLS')
  );

  await until(S(14));
  await play(
    ...highlightCards(FAILURES, RED),
    ...showCaughtRate(),
    ...say('CAUGHT FAILURES: 0 OUT OF 2', RED)
  );

  await until(S(15));
  await play(
    ...highlightCards(SAFE, GREEN),
    ...showFalseAlarmRate(),
    ...say('FALSE ALARMS: 0 OUT OF 10', AMBER)
  );

  // ------------------------------------------------------------
  // ROC graph.
  //
  // Horizontal axis: false-positive rate.
  // Vertical axis: true-positive rate.
  //
  // Both axes are linear from 0% to 100%.
  // ------------------------------------------------------------

  const GX0 = P ? -2.70 : -5.65;
  const GX1 = P ? 2.70 : -0.20;

  const GY0 = P ? -4.69 : -2.02;
  const GY1 = P ? -1.78 : 1.06;

  const GW = GX1 - GX0;
  const GH = GY1 - GY0;

  const GCX = (GX0 + GX1) / 2;

  const xFor = value =>
    GX0 + value / 100 * GW;

  const yFor = value =>
    GY0 + value / 100 * GH;

  const pointFor = (x, y) => [
    xFor(x),
    yFor(y),
    0
  ];

  let graphFrame = null;
  let horizontalAxis = null;
  let verticalAxis = null;

  let xTicks = [];
  let yTicks = [];
  let gridLines = [];

  let xAxisLabel = null;
  let yAxisLabel = null;

  let graphTitle = null;

  function makeGraphFrame() {
    return rounded(
      GCX,
      (GY0 + GY1) / 2,
      GW + 0.13,
      GH + 0.13,
      C.muted,
      C.card,
      0.28,
      1,
      0.06
    );
  }

  function makeXAxis() {
    return arrow(
      GX0,
      GY0,
      GX1 + 0.10,
      GY0,
      C.ink,
      0.11
    );
  }

  function makeYAxis() {
    return arrow(
      GX0,
      GY0,
      GX0,
      GY1 + 0.09,
      C.ink,
      0.11
    );
  }

  function makeXTicks() {
    return [0, 20, 40, 60, 80, 100].map(v => {
      const x = xFor(v);

      const tick = line(
        x,
        GY0 - 0.055,
        x,
        GY0 + 0.055,
        C.muted,
        1.5
      );

      const label = text(
        `${v}%`,
        P ? 15 : 13,
        C.muted,
        x,
        GY0 - 0.21,
        true
      );

      return new M.VGroup(
        tick,
        label
      );
    });
  }

  function makeYTicks() {
    return [0, 25, 50, 75, 100].map(v => {
      const y = yFor(v);

      const tick = line(
        GX0 - 0.055,
        y,
        GX0 + 0.055,
        y,
        C.muted,
        1.5
      );

      const label = text(
        `${v}%`,
        P ? 15 : 13,
        C.muted,
        GX0 - 0.34,
        y,
        true,
        0.55
      );

      return new M.VGroup(
        tick,
        label
      );
    });
  }

  function makeGraphGrid() {
    const verticals =
      [20, 40, 60, 80, 100].map(v =>
        line(
          xFor(v),
          GY0,
          xFor(v),
          GY1,
          C.muted,
          0.6
        )
      );

    const horizontals =
      [25, 50, 75, 100].map(v =>
        line(
          GX0,
          yFor(v),
          GX1,
          yFor(v),
          C.muted,
          0.6
        )
      );

    return [
      ...verticals,
      ...horizontals
    ];
  }

  function makeXAxisLabel(
    label = 'Non-failing pumps receiving false alarms'
  ) {
    return text(
      label,
      P ? 16 : 16,
      AMBER,
      GCX,
      GY0 - 0.49,
      false,
      GW + 0.15
    );
  }

  function makeYAxisLabel(
    label = 'Real failures caught'
  ) {
    return text(
      label,
      P ? 16 : 16,
      RED,
      GCX,
      GY1 + 0.26,
      false,
      GW + 0.15
    );
  }

  function replaceXAxisLabel(label) {
    const next = makeXAxisLabel(label);

    const anims = [
      new M.FadeOut(xAxisLabel),
      new M.FadeIn(next)
    ];

    xAxisLabel = next;

    return anims;
  }

  function replaceYAxisLabel(label) {
    const next = makeYAxisLabel(label);

    const anims = [
      new M.FadeOut(yAxisLabel),
      new M.FadeIn(next)
    ];

    yAxisLabel = next;

    return anims;
  }

  // ------------------------------------------------------------
  // 16: Create the plotting space.
  // ------------------------------------------------------------

  await until(S(16));

  graphVisible = true;

  graphFrame = makeGraphFrame();
  gridLines = makeGraphGrid();

  await play(
    ...clearCardHighlights(),
    new M.FadeOut(lowerArrow),
    new M.FadeOut(rankedHeading),
    new M.FadeIn(graphFrame),
    ...fadeIn(gridLines),
    ...refreshRates(),
    ...say('RECORD BOTH RESULTS IN ONE PICTURE')
  );

  // ------------------------------------------------------------
  // 17: Introduce the horizontal axis.
  // ------------------------------------------------------------

  await until(S(17));

  horizontalAxis = makeXAxis();
  xTicks = makeXTicks();
  xAxisLabel = makeXAxisLabel();

  await play(
    new M.Create(horizontalAxis),
    ...fadeIn(xTicks),
    new M.FadeIn(xAxisLabel),
    ...say('ACROSS: PERCENTAGE OF FALSE ALARMS', AMBER)
  );

  // ------------------------------------------------------------
  // 18: Introduce the vertical axis.
  // ------------------------------------------------------------

  await until(S(18));

  verticalAxis = makeYAxis();
  yTicks = makeYTicks();
  yAxisLabel = makeYAxisLabel();

  await play(
    new M.Create(verticalAxis),
    ...fadeIn(yTicks),
    new M.FadeIn(yAxisLabel),
    ...say('UP: PERCENTAGE OF REAL FAILURES CAUGHT', RED)
  );

  // ------------------------------------------------------------
  // ROC point helpers.
  //
  // Dots are added individually during narration.
  // They are not connected until sentence 38.
  // ------------------------------------------------------------

  const plotted = [];
  const segments = [];

  let guideObjects = [];
  let activePoint = null;

  function makePoint(r) {
    const p = pointFor(
      r.fpr * 100,
      r.tpr * 100
    );

    const halo = new M.Dot({
      point: p,
      radius: 0.15,
      color: BLUE
    });

    halo.setFill(BLUE, 0.20);

    const dot = new M.Dot({
      point: p,
      radius: 0.067,
      color: BLUE
    });

    return {
      result: r,
      point: p,
      halo,
      dot,
      label: null
    };
  }

  // Threshold labels are deliberately offset so the two points
  // along the bottom edge do not obscure each other.
  const LABEL_OFFSETS = {
    100: [0.25, 0.60],
    90:  [0.45, 0.26],
    60:  [0.65, 0.10],
    30:  [0.18, -0.33],
    10:  [-0.38, -0.33]
  };

  function pointLabel(r) {
    const p = pointFor(
      r.fpr * 100,
      r.tpr * 100
    );

    const [dx, dy] =
      LABEL_OFFSETS[r.threshold];

    return text(
      `${r.threshold}%`,
      P ? 15 : 13,
      BLUE,
      p[0] + dx,
      p[1] + dy,
      true,
      0.85
    );
  }

  function clearGuides() {
    const anims = fadeOut(
      guideObjects
    );

    guideObjects = [];

    return anims;
  }

  function pointGuides(r) {
    const x = xFor(
      r.fpr * 100
    );

    const y = yFor(
      r.tpr * 100
    );

    const objects = [];

    if (r.tpr > 0) {
      objects.push(
        new M.DashedLine({
          start: [x, GY0, 0],
          end: [x, y, 0],
          color: AMBER,
          strokeWidth: 1.8
        })
      );
    }

    if (r.fpr > 0 && r.tpr > 0) {
      objects.push(
        new M.DashedLine({
          start: [GX0, y, 0],
          end: [x, y, 0],
          color: RED,
          strokeWidth: 1.8
        })
      );
    }

    return objects;
  }

  function pointReadout(r) {
    const x = BAND_CX;

    return text(
      `(${pct(r.fpr)}, ${pct(r.tpr)})`,
      P ? 18 : 20,
      BLUE,
      P ? 0 : x,
      P ? -6.05 : 1.95,
      true,
      P ? 5.8 : 5.0
    );
  }

  let coordinateLabel = null;

  function setCoordinateLabel(r) {
    const next = pointReadout(r);

    const anims = [];

    if (coordinateLabel) {
      anims.push(
        new M.FadeOut(coordinateLabel)
      );
    }

    coordinateLabel = next;

    anims.push(
      new M.FadeIn(next)
    );

    return anims;
  }

  function clearCoordinateLabel() {
    if (!coordinateLabel) return [];

    const old = coordinateLabel;
    coordinateLabel = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function plotPoint(r) {
    const p = makePoint(r);

    p.label = pointLabel(r);

    const anims = [
      ...clearGuides(),
      ...clearCardHighlights(),
      ...setCoordinateLabel(r)
    ];

    guideObjects = pointGuides(r);

    anims.push(
      ...guideObjects.map(o =>
        new M.Create(o)
      )
    );

    anims.push(
      new M.FadeIn(p.halo),
      new M.FadeIn(p.dot),
      new M.FadeIn(p.label)
    );

    if (activePoint) {
      anims.push(
        new M.Transform(
          activePoint,
          circle(
            p.point[0],
            p.point[1],
            0.13,
            WHITE,
            0,
            2
          )
        )
      );
    } else {
      activePoint = circle(
        p.point[0],
        p.point[1],
        0.13,
        WHITE,
        0,
        2
      );

      anims.push(
        new M.Create(activePoint)
      );
    }

    plotted.push(p);

    return anims;
  }

  // ------------------------------------------------------------
  // 19: First ROC point.
  //
  // Threshold 100% -> (0%, 0%).
  // ------------------------------------------------------------

  await until(S(19));
  await play(
    ...plotPoint(R100),
    ...say('FIRST DOT: (0%, 0%) — BOTTOM LEFT', BLUE)
  );

  // ------------------------------------------------------------
  // 20–24: Lower the threshold to 90%.
  //
  // P1 receives an alert.
  // TP = 0, FP = 1, FN = 2, TN = 9.
  // ROC point = (10%, 0%).
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    ...clearGuides(),
    ...clearCoordinateLabel(),
    ...moveGate(90),
    ...resetRates(90),
    ...say('LOWER THE THRESHOLD TO 90%', AMBER)
  );

  await until(S(21));
  await play(
    ...applyThreshold(90),
    ...focus([0], GREEN, 'outcome'),
    ...say('P1 GETS A BELL BUT DOES NOT FAIL', AMBER)
  );

  await until(S(22));
  await play(
    ...highlightCards(FAILURES, RED),
    ...showCaughtRate(),
    ...say('STILL 0 OUT OF 2 CAUGHT = 0%', RED)
  );

  await until(S(23));
  await play(
    ...highlightCards(R90.fp, AMBER),
    ...focus(
      R90.fp,
      AMBER,
      'alert'
    ),
    ...showFalseAlarmRate(),
    ...say('1 FALSE ALARM OUT OF 10 = 10%', AMBER)
  );

  await until(S(24));
  await play(
    ...plotPoint(R90),
    ...say('NEXT DOT: (10%, 0%) — MOVE RIGHT', BLUE)
  );

  // ------------------------------------------------------------
  // 25–29: Lower the threshold to 60%.
  //
  // P2 and P3 gain alerts.
  // TP = 1, FP = 2, FN = 1, TN = 8.
  // ROC point = (20%, 50%).
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...clearGuides(),
    ...clearCoordinateLabel(),
    ...moveGate(60),
    ...resetRates(60),
    ...say('LOWER THE THRESHOLD TO 60%', AMBER)
  );

  await until(S(26));
  await play(
    lag(
      applyThreshold(60),
      1.15,
      0.20
    ),
    ...focus([1, 2], BLUE, 'chance'),
    ...say('P2 AND P3 RECEIVE BELLS TOO', AMBER)
  );

  await until(S(27));
  await play(
    ...highlightCards(R60.tp, RED),
    ...focus(
      R60.tp,
      AMBER,
      'alert'
    ),
    ...showCaughtRate(),
    ...say('1 OUT OF 2 REAL FAILURES = 50%', RED)
  );

  await until(S(28));
  await play(
    ...highlightCards(R60.fp, AMBER),
    ...focus(
      R60.fp,
      GREEN,
      'outcome'
    ),
    ...showFalseAlarmRate(),
    ...say('2 FALSE ALARMS OUT OF 10 = 20%', AMBER)
  );

  await until(S(29));
  await play(
    ...plotPoint(R60),
    ...say('NEXT DOT: (20%, 50%)', BLUE)
  );

  // ------------------------------------------------------------
  // 30–34: Lower the threshold to 30%.
  //
  // P4, P5 and P6 gain alerts.
  // TP = 2, FP = 4, FN = 0, TN = 6.
  // ROC point = (40%, 100%).
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    ...clearGuides(),
    ...clearCoordinateLabel(),
    ...moveGate(30),
    ...resetRates(30),
    ...say('LOWER THE THRESHOLD TO 30%', AMBER)
  );

  await until(S(31));
  await play(
    lag(
      applyThreshold(30),
      1.30,
      0.19
    ),
    ...focus([3, 4, 5], BLUE, 'chance'),
    ...say('P4, P5 AND P6 RECEIVE BELLS TOO', AMBER)
  );

  await until(S(32));
  await play(
    ...highlightCards(R30.tp, RED),
    ...focus(
      R30.tp,
      AMBER,
      'alert'
    ),
    ...showCaughtRate(),
    ...say('2 OUT OF 2 REAL FAILURES = 100%', RED)
  );

  await until(S(33));
  await play(
    ...highlightCards(R30.fp, AMBER),
    ...focus(
      R30.fp,
      GREEN,
      'outcome'
    ),
    ...showFalseAlarmRate(),
    ...say('4 FALSE ALARMS OUT OF 10 = 40%', AMBER)
  );

  await until(S(34));
  await play(
    ...plotPoint(R30),
    ...say('NEXT DOT: (40%, 100%)', BLUE)
  );

  // ------------------------------------------------------------
  // 35–37: Lower the threshold to 10%.
  //
  // Every pump receives an alert.
  // TP = 2, FP = 10, FN = 0, TN = 0.
  // ROC point = (100%, 100%).
  // ------------------------------------------------------------

  await until(S(35));

  const allNewBells = applyThreshold(10);

  await play(
    ...clearGuides(),
    ...clearCoordinateLabel(),
    ...moveGate(10),
    lag(
      allNewBells,
      1.50,
      0.11
    ),
    ...resetRates(10),
    ...say('AT 10%, EVERY PUMP RECEIVES A BELL', AMBER)
  );

  await until(S(36));
  await play(
    lag(
      focus(
        FAILURES,
        RED,
        'outcome'
      ),
      1.1,
      0.20
    ),
    lag(
      focus(
        SAFE,
        AMBER,
        'alert'
      ),
      1.8,
      0.08
    ),
    ...showBothRates(),
    ...say('ALL FAILURES CAUGHT · ALL SAFE PUMPS ALERTED')
  );

  await until(S(37));
  await play(
    ...plotPoint(R10),
    ...say('LAST DOT: (100%, 100%) — UPPER RIGHT', BLUE)
  );

  // ------------------------------------------------------------
  // Connect the five dots in decreasing-threshold order.
  //
  // The curve remains piecewise linear.
  // No extra threshold points are introduced.
  // ------------------------------------------------------------

  function connectROC() {
    const anims = [];

    for (let i = 1; i < plotted.length; i++) {
      const p1 = plotted[i - 1].point;
      const p2 = plotted[i].point;

      const segment = new M.Line({
        start: p1,
        end: p2,
        color: BLUE,
        strokeWidth: 4
      });

      segments.push(segment);

      anims.push(
        new M.Create(segment)
      );
    }

    return anims;
  }

  function clearActivePoint() {
    if (!activePoint) return [];

    const old = activePoint;
    activePoint = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // 38: Connect the five points.
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    ...clearGuides(),
    ...clearActivePoint(),
    ...clearCoordinateLabel(),
    lag(
      connectROC(),
      1.65,
      0.26
    ),
    ...say('CONNECT THE FIVE DOTS IN ORDER', BLUE)
  );

  // ------------------------------------------------------------
  // Threshold table.
  //
  // The table is introduced only after the learner has built
  // and understood the graph point by point.
  //
  // In the remaining lesson it replaces the card display.
  // ------------------------------------------------------------

  let tableNow = null;

  const TABLE_X = P ? 0 : 3.55;
  const TABLE_Y = P ? 0.06 : -0.30;

  const TABLE_W = P ? 6.50 : 5.70;
  const TABLE_H = P ? 2.95 : 3.90;

  function makeThresholdTable() {
    const x = TABLE_X;
    const y = TABLE_Y;

    const w = TABLE_W;
    const h = TABLE_H;

    const frame = rounded(
      x,
      y,
      w,
      h,
      BLUE,
      C.card,
      0.94,
      2,
      0.16
    );

    const left = x - w / 2;
    const top = y + h / 2;

    const cols = [
      left + w * 0.19,
      left + w * 0.50,
      left + w * 0.81
    ];

    const rowH = P ? 0.39 : 0.50;

    const headingY =
      top - (P ? 0.27 : 0.34);

    const headings = [
      text(
        'Threshold',
        16,
        AMBER,
        cols[0],
        headingY,
        false,
        w * 0.30
      ),

      text(
        'False alarms',
        16,
        AMBER,
        cols[1],
        headingY,
        false,
        w * 0.30
      ),

      text(
        'Caught',
        16,
        RED,
        cols[2],
        headingY,
        false,
        w * 0.28
      )
    ];

    const headerDivider = line(
      left + 0.17,
      headingY - 0.22,
      left + w - 0.17,
      headingY - 0.22,
      C.muted,
      1.2
    );

    const entries = RESULTS.flatMap((r, i) => {
      const yy =
        headingY - 0.47 - i * rowH;

      return [
        text(
          `${r.threshold}%`,
          17,
          AMBER,
          cols[0],
          yy,
          true
        ),

        text(
          pct(r.fpr),
          17,
          WHITE,
          cols[1],
          yy,
          true
        ),

        text(
          pct(r.tpr),
          17,
          WHITE,
          cols[2],
          yy,
          true
        )
      ];
    });

    return new M.VGroup(
      frame,
      ...headings,
      headerDivider,
      ...entries
    );
  }

  function showThresholdTable() {
    tableNow = makeThresholdTable();

    return [
      new M.FadeIn(tableNow)
    ];
  }

  function hideThresholdTable() {
    if (!tableNow) return [];

    const old = tableNow;
    tableNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function hideRankedCards() {
    return [
      ...clearCardHighlights(),
      ...hideGate(),
      ...clearRatePanel(),
      ...clearCoordinateLabel(),
      ...fadeOut(bandLabels),
      ...cards.flatMap(c =>
        hideCard(c)
      )
    ];
  }

  // ------------------------------------------------------------
  // 39: Name the picture.
  // ------------------------------------------------------------

  await until(S(39));

  graphTitle = text(
    'ROC CURVE',
    P ? 22 : 23,
    BLUE,
    P ? 0 : BAND_CX,
    P ? 3.52 : 1.95,
    true
  );

  await play(
    ...clearRatePanel(),
    new M.FadeIn(graphTitle),
    ...say('THIS IS AN ROC CURVE', BLUE)
  );

  // ------------------------------------------------------------
  // 40: Show how the curve records changing decisions.
  // ------------------------------------------------------------

  await until(S(40));
  await play(
    ...hideRankedCards(),
    new M.FadeOut(graphTitle),
    ...showThresholdTable(),
    lag(
      plotted.map(p =>
        new M.Indicate(
          p.dot,
          {
            color: BLUE,
            runTime: 0.65
          }
        )
      ),
      2.5,
      0.30
    ),
    ...say('EACH DOT RECORDS A DIFFERENT THRESHOLD')
  );

  // ------------------------------------------------------------
  // 41: Introduce the true-positive rate.
  //
  // The true-positive rate is the same quantity as recall
  // and sensitivity from earlier lessons.
  // ------------------------------------------------------------

  await until(S(41));
  await play(
    ...replaceYAxisLabel(
      'True-positive rate (TPR)'
    ),
    new M.Indicate(
      verticalAxis,
      { color: RED }
    ),
    ...fbox([
      ['true-positive rate', RED],
      'percentage of real failures caught',
      'also called recall or sensitivity'
    ], RED, P ? BOXP : [3.55, 1.72, 0], P ? null : 5.70),
    ...say('TRUE-POSITIVE RATE = FAILURES CAUGHT', RED)
  );

  // ------------------------------------------------------------
  // 42: Introduce the false-positive rate.
  // ------------------------------------------------------------

  await until(S(42));
  await play(
    ...replaceXAxisLabel(
      'False-positive rate (FPR)'
    ),
    new M.Indicate(
      horizontalAxis,
      { color: AMBER }
    ),
    ...fbox([
      ['false-positive rate', AMBER],
      'percentage of non-failing pumps',
      'that receive false alarms'
    ], AMBER, P ? BOXP : [3.55, 1.72, 0], P ? null : 5.70),
    ...say('FALSE-POSITIVE RATE = FALSE ALARMS AMONG SAFE PUMPS', AMBER)
  );

  // ------------------------------------------------------------
  // Formula comparison layout.
  //
  // The ROC graph remains visible while its two axis formulas
  // are introduced.
  // ------------------------------------------------------------

  const FCX = P ? 0 : 3.55;
  const FW_FORMULA = P ? 6.45 : 5.65;

  const FORMULA_Y1 = P ? 0.82 : 0.49;
  const FORMULA_Y2 = P ? -0.72 : -1.53;

  let formulaPanels = [];

  function formulaPanel(
    title,
    numerator,
    denominator,
    y,
    color
  ) {
    const h = P ? 1.35 : 1.62;

    const frame = rounded(
      FCX,
      y,
      FW_FORMULA,
      h,
      color,
      C.card,
      0.94,
      2,
      0.14
    );

    const heading = text(
      title,
      17,
      color,
      FCX,
      y + h / 2 - 0.22,
      true,
      FW_FORMULA - 0.25
    );

    const top = text(
      numerator,
      P ? 17 : 20,
      color,
      FCX,
      y + 0.10,
      false,
      FW_FORMULA - 0.40
    );

    const fractionLine = line(
      FCX - FW_FORMULA / 2 + 0.42,
      y - 0.12,
      FCX + FW_FORMULA / 2 - 0.42,
      y - 0.12,
      C.ink,
      2
    );

    const bottom = text(
      denominator,
      P ? 16 : 19,
      WHITE,
      FCX,
      y - 0.37,
      false,
      FW_FORMULA - 0.40
    );

    return new M.VGroup(
      frame,
      heading,
      top,
      fractionLine,
      bottom
    );
  }

  function clearFormulaPanels() {
    const anims = fadeOut(
      formulaPanels
    );

    formulaPanels = [];

    return anims;
  }

  // ------------------------------------------------------------
  // 43: Prepare the formulas.
  // ------------------------------------------------------------

  await until(S(43));
  await play(
    ...hideThresholdTable(),
    ...clearBox(),
    ...say('TWO FORMULAS BEHIND THE PICTURE')
  );

  // ------------------------------------------------------------
  // 44: True-positive rate formula.
  //
  // TPR = TP / (TP + FN)
  //     = caught failures / all actual failures.
  // ------------------------------------------------------------

  const tprFormula = formulaPanel(
    'TRUE-POSITIVE RATE',
    'Caught failures',
    'Total real failures',
    FORMULA_Y1,
    RED
  );

  await until(S(44));

  formulaPanels.push(tprFormula);

  await play(
    new M.FadeIn(tprFormula),
    new M.Indicate(
      verticalAxis,
      { color: RED }
    ),
    ...fbox([
      ['TPR = TP ÷ (TP + FN)', RED],
      ['at 60% cutoff: 1 ÷ 2 = 50%', AMBER]
    ], RED, P ? BOXP : [3.55, -3.12, 0], P ? null : 5.65),
    ...say('CAUGHT FAILURES ÷ ALL REAL FAILURES', RED)
  );

  // ------------------------------------------------------------
  // 45: False-positive rate formula.
  //
  // FPR = FP / (FP + TN)
  //     = false alarms / all actual non-failures.
  // ------------------------------------------------------------

  const fprFormula = formulaPanel(
    'FALSE-POSITIVE RATE',
    'False alarms',
    'Total non-failing pumps',
    FORMULA_Y2,
    AMBER
  );

  await until(S(45));

  formulaPanels.push(fprFormula);

  await play(
    new M.FadeIn(fprFormula),
    new M.Indicate(
      horizontalAxis,
      { color: AMBER }
    ),
    ...fbox([
      ['FPR = FP ÷ (FP + TN)', AMBER],
      ['at 60% cutoff: 2 ÷ 10 = 20%', AMBER]
    ], AMBER, P ? BOXP : [3.55, -3.12, 0], P ? null : 5.65),
    ...say('FALSE ALARMS ÷ ALL NON-FAILING PUMPS', AMBER)
  );

  // ------------------------------------------------------------
  // Ideal ROC corner.
  //
  // FPR = 0%, TPR = 100%.
  //
  // This corner is a reference target, not an observed result
  // from the twelve-pump example.
  // ------------------------------------------------------------

  const IDEAL = pointFor(0, 100);

  const idealOuter = circle(
    IDEAL[0],
    IDEAL[1],
    0.16,
    GREEN,
    0,
    3
  );

  const idealInner = circle(
    IDEAL[0],
    IDEAL[1],
    0.065,
    GREEN,
    0,
    2
  );

  const idealLabel = text(
    'IDEAL',
    15,
    GREEN,
    IDEAL[0] + 0.48,
    IDEAL[1] - 0.28,
    true,
    0.95
  );

  const idealMarker = new M.VGroup(
    idealOuter,
    idealInner,
    idealLabel
  );

  // ------------------------------------------------------------
  // 46: Draw attention to the upper-left corner.
  // ------------------------------------------------------------

  await until(S(46));
  await play(
    ...clearFormulaPanels(),
    ...clearBox(),
    new M.FadeIn(idealMarker),
    ...say('LOOK AT THE UPPER-LEFT CORNER', GREEN)
  );

  // ------------------------------------------------------------
  // 47: Explain the ideal point.
  // ------------------------------------------------------------

  const idealSummary = new M.VGroup(
    rounded(
      FCX,
      P ? 0.10 : -0.30,
      FW_FORMULA,
      P ? 2.50 : 2.75,
      GREEN,
      C.card,
      0.94,
      2,
      0.16
    ),

    text(
      'IDEAL RESULT',
      23,
      GREEN,
      FCX,
      P ? 0.94 : 0.62,
      true
    ),

    text(
      '(0%, 100%)',
      27,
      GREEN,
      FCX,
      P ? 0.32 : -0.04,
      true
    ),

    text(
      'Every real failure caught',
      18,
      RED,
      FCX,
      P ? -0.30 : -0.67,
      false,
      FW_FORMULA - 0.30
    ),

    text(
      'No false alarms',
      18,
      GREEN,
      FCX,
      P ? -0.76 : -1.14,
      false
    )
  );

  await until(S(47));
  await play(
    new M.Indicate(
      idealMarker,
      { color: GREEN }
    ),
    new M.FadeIn(idealSummary),
    ...say('100% OF FAILURES CAUGHT · 0% FALSE ALARMS', GREEN)
  );

  // ------------------------------------------------------------
  // 48: The observed tool does not reach the ideal corner.
  // ------------------------------------------------------------

  const observedBestHeight = pointFor(40, 100);

  const idealGap = new M.DashedLine({
    start: IDEAL,
    end: observedBestHeight,
    color: GREEN,
    strokeWidth: 2.2
  });

  const observedGapLabel = text(
    '40% false alarms',
    P ? 16 : 14,
    AMBER,
    (IDEAL[0] + observedBestHeight[0]) / 2,
    GY1 - 0.57,
    false,
    2.10
  );

  await until(S(48));
  await play(
    new M.Create(idealGap),
    new M.FadeIn(observedGapLabel),
    new M.Indicate(
      plotted[3].dot,
      { color: AMBER }
    ),
    ...fbox([
      ['our tool catches every failure', RED],
      'at the 30% threshold',
      ['but FPR is still 40%', AMBER]
    ], AMBER, P ? BOXP : [3.55, 1.70, 0], P ? null : 5.65),
    ...say('OUR TOOL NEVER REACHES THE IDEAL CORNER', AMBER)
  );

  // ------------------------------------------------------------
  // 49: Better curves tend toward the upper-left corner.
  //
  // Use directional arrows rather than inventing results for
  // Tool B, whose probability scores are not supplied.
  // ------------------------------------------------------------

  const betterStart = pointFor(72, 37);
  const betterEnd = pointFor(36, 78);

  const betterArrow = arrow(
    betterStart[0],
    betterStart[1],
    betterEnd[0],
    betterEnd[1],
    GREEN,
    0.20
  );

  const betterLabel = text(
    'Better separation',
    16,
    GREEN,
    xFor(69),
    yFor(28),
    false,
    2.10
  );

  const betterSummary = new M.VGroup(
    rounded(
      FCX,
      P ? 0.08 : -0.30,
      FW_FORMULA,
      P ? 2.50 : 2.75,
      GREEN,
      C.card,
      0.94,
      2,
      0.16
    ),

    text(
      'BETTER SEPARATION',
      21,
      GREEN,
      FCX,
      P ? 0.85 : 0.61,
      true,
      FW_FORMULA - 0.25
    ),

    text(
      'More failures caught',
      20,
      RED,
      FCX,
      P ? 0.25 : -0.02,
      false
    ),

    text(
      'Fewer false alarms',
      20,
      AMBER,
      FCX,
      P ? -0.25 : -0.57,
      false
    ),

    text(
      'Closer to the ideal corner',
      17,
      GREEN,
      FCX,
      P ? -0.80 : -1.19,
      false,
      FW_FORMULA - 0.25
    )
  );

  await until(S(49));
  await play(
    ...clearBox(),
    new M.FadeOut(idealSummary),
    new M.FadeOut(idealGap),
    new M.FadeOut(observedGapLabel),
    new M.FadeIn(betterSummary),
    new M.Create(betterArrow),
    new M.FadeIn(betterLabel),
    ...say('BETTER CURVES STAY CLOSER TO THE IDEAL CORNER', GREEN)
  );

  // ------------------------------------------------------------
  // 50: ROC curves compare prediction tools across thresholds.
  // ------------------------------------------------------------

  await until(S(50));
  await play(
    lag(
      segments.map(segment =>
        new M.Indicate(
          segment,
          {
            color: BLUE,
            runTime: 0.65
          }
        )
      ),
      2.20,
      0.22
    ),
    ...fbox([
      ['USE ROC CURVES', BLUE],
      'compare prediction tools',
      'across different alert thresholds'
    ], BLUE, P ? BOXP : [3.55, 1.70, 0], P ? null : 5.65),
    ...say('COMPARE TOOLS ACROSS MANY ALERT THRESHOLDS', BLUE)
  );

  // ------------------------------------------------------------
  // Rare-failure caution.
  //
  // The chapter's twelve-pump data remains unchanged.
  // This separate, explicitly hypothetical example illustrates
  // why a small false-positive rate can still produce many
  // false alarms when the non-failing population is large.
  //
  // Suppose 1,000 non-failing pumps and an FPR of 1%.
  // Then 10 false alarms result.
  //
  // A 10 x 10 array represents groups of ten safe pumps.
  // Each tile represents 10 non-failing pumps.
  // One amber tile therefore represents 10 false alarms.
  // ------------------------------------------------------------

  const RARE_X = P ? 0 : 3.55;
  const RARE_Y = P ? 0.02 : -0.30;

  const RARE_SP = P ? 0.19 : 0.23;
  const RARE_SIZE = P ? 0.135 : 0.17;

  const rareTiles = [];

  const rareGridCY =
    RARE_Y + (P ? 0.04 : 0.06);

  for (let i = 0; i < 100; i++) {
    const x =
      RARE_X +
      (i % 10 - 4.5) * RARE_SP;

    const y =
      rareGridCY +
      (4.5 - Math.floor(i / 10)) * RARE_SP;

    rareTiles.push(
      rect(
        x,
        y,
        RARE_SIZE,
        RARE_SIZE,
        GREEN,
        0.10,
        1.2
      )
    );
  }

  const rareHeading = text(
    'HYPOTHETICAL LARGER GROUP',
    18,
    C.ink,
    RARE_X,
    RARE_Y + (P ? 1.32 : 1.61),
    true,
    FW_FORMULA - 0.25
  );

  const rareSubheading = text(
    '1,000 non-failing pumps',
    18,
    GREEN,
    RARE_X,
    RARE_Y + (P ? 1.05 : 1.29),
    false
  );

  const rareKey = text(
    'Each square = 10 non-failing pumps',
    P ? 16 : 14,
    C.muted,
    RARE_X,
    RARE_Y - (P ? 1.04 : 1.19),
    false,
    FW_FORMULA - 0.30
  );

  const rareGrid = new M.VGroup(
    ...rareTiles
  );

  const rarePicture = [
    rareGrid,
    rareHeading,
    rareSubheading,
    rareKey
  ];

  // ------------------------------------------------------------
  // 51: Be careful when failures are rare.
  // ------------------------------------------------------------

  await until(S(51));
  await play(
    ...clearBox(),
    new M.FadeOut(betterSummary),
    new M.FadeOut(betterArrow),
    new M.FadeOut(betterLabel),
    ...fadeIn(rarePicture),
    ...say('BE CAREFUL WHEN REAL FAILURES ARE RARE', AMBER)
  );

  // ------------------------------------------------------------
  // 52: Even a small FPR can create many false alarms.
  // ------------------------------------------------------------

  const firstTileX =
    RARE_X - 4.5 * RARE_SP;

  const firstTileY =
    rareGridCY + 4.5 * RARE_SP;

  const rareFalseAlarmTile = rect(
    firstTileX,
    firstTileY,
    RARE_SIZE,
    RARE_SIZE,
    AMBER,
    0.95,
    2.0
  );

  const rareFalseAlarmOutline = rounded(
    firstTileX,
    firstTileY,
    RARE_SIZE + 0.09,
    RARE_SIZE + 0.09,
    AMBER,
    AMBER,
    0,
    2.5,
    0.035
  );

  const rareBell = bellIcon(
    firstTileX - 0.32,
    firstTileY,
    0.80
  );

  const rareAnswer = text(
    '1% of 1,000 = 10 false alarms',
    18,
    AMBER,
    RARE_X,
    RARE_Y - (P ? 1.37 : 1.59),
    true,
    FW_FORMULA - 0.20
  );

  await until(S(52));
  await play(
    new M.FadeIn(rareFalseAlarmTile),
    new M.Create(rareFalseAlarmOutline),
    new M.FadeIn(rareBell),
    new M.FadeIn(rareAnswer),
    ...fbox([
      ['illustrative larger population', C.ink],
      '1,000 non-failing pumps',
      ['1% false-positive rate', AMBER],
      ['= 10 false alarms', AMBER]
    ], AMBER, P ? BOXP : [3.55, 1.92, 0], P ? null : 5.65),
    ...say('A SMALL PERCENTAGE CAN STILL MEAN MANY FALSE ALARMS', AMBER)
  );

  // ------------------------------------------------------------
  // 53: ROC does not directly give precision.
  //
  // ROC denominators are actual failures and actual non-failures.
  // Precision instead uses all alerts as its denominator.
  //
  // Return to the original twelve-pump example at threshold 60%.
  // ------------------------------------------------------------

  const precisionWarning = new M.VGroup(
    rounded(
      FCX,
      P ? 0.06 : -0.30,
      FW_FORMULA,
      P ? 2.70 : 3.10,
      AMBER,
      C.card,
      0.94,
      2,
      0.16
    ),

    text(
      'ROC IS NOT PRECISION',
      21,
      AMBER,
      FCX,
      P ? 1.02 : 0.83,
      true,
      FW_FORMULA - 0.30
    ),

    text(
      'At our 60% threshold:',
      18,
      WHITE,
      FCX,
      P ? 0.53 : 0.22,
      false
    ),

    text(
      'TPR = 50%',
      19,
      RED,
      FCX,
      P ? 0.08 : -0.27,
      true
    ),

    text(
      'FPR = 20%',
      19,
      AMBER,
      FCX,
      P ? -0.36 : -0.72,
      true
    ),

    text(
      'Precision = 1/3 ≈ 33%',
      20,
      VIOLET,
      FCX,
      P ? -0.94 : -1.34,
      true,
      FW_FORMULA - 0.25
    )
  );

  const precisionPointOutline = circle(
    xFor(20),
    yFor(50),
    0.14,
    WHITE,
    0,
    2.5
  );

  await until(S(53));
  await play(
    ...fadeOut([
      ...rarePicture,
      rareFalseAlarmTile,
      rareFalseAlarmOutline,
      rareBell,
      rareAnswer
    ]),
    new M.FadeIn(precisionWarning),
    new M.Create(precisionPointOutline),
    ...fbox([
      ['precision', VIOLET],
      'correct alerts ÷ all alerts',
      ['not directly shown by ROC', AMBER]
    ], AMBER, P ? BOXP : [3.55, 1.80, 0], P ? null : 5.65),
    ...say('ROC DOES NOT DIRECTLY TELL US PRECISION', AMBER)
  );

  // ------------------------------------------------------------
  // Final recap.
  //
  // Restore the five-threshold table and retain the full ROC
  // curve with the ideal corner clearly distinguished from
  // the five observed points.
  // ------------------------------------------------------------

  const finalDirection = text(
    'Threshold decreases: 100% → 10%',
    P ? 16 : 17,
    AMBER,
    P ? 0 : TABLE_X,
    P ? 1.84 : 1.98,
    true,
    P ? 6.50 : 5.70
  );

  const finalLegend = new M.VGroup(
    circle(
      P ? -2.57 : 1.55,
      P ? 3.95 : -2.45,
      0.065,
      BLUE,
      1,
      1
    ),

    text(
      'Observed thresholds',
      P ? 16 : 15,
      BLUE,
      P ? -1.37 : 2.65,
      P ? 3.95 : -2.45,
      false,
      2.50
    ),

    circle(
      P ? 0.74 : 4.52,
      P ? 3.95 : -2.45,
      0.075,
      GREEN,
      0,
      2
    ),

    text(
      'Ideal point',
      P ? 16 : 15,
      GREEN,
      P ? 1.56 : 5.42,
      P ? 3.95 : -2.45,
      false,
      1.70
    )
  );

  // ------------------------------------------------------------
  // 54: Final narrated summary.
  // ------------------------------------------------------------

  await until(S(54));
  await play(
    new M.FadeOut(precisionWarning),
    new M.FadeOut(precisionPointOutline),
    ...showThresholdTable(),
    new M.FadeIn(finalDirection),
    new M.FadeIn(finalLegend),
    lag(
      plotted.map(p =>
        new M.Indicate(
          p.dot,
          {
            color: BLUE,
            runTime: 0.70
          }
        )
      ),
      3.0,
      0.30
    ),
    ...fbox([
      ['up: real failures caught', RED],
      ['across: false-positive rate', AMBER]
    ], BLUE, P ? [0, 3.18, 0] : [3.55, -3.35, 0], P ? null : 5.65),
    ...say('ROC: BOTH RATES CHANGE WITH THE THRESHOLD', BLUE)
  );

  // Hold the completed ROC curve until narration finishes.
  await until(E(54));
}

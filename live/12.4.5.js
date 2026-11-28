// lesson 12.4.5
// F1 score — live, narration-synchronised lesson.
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

    const precision = alerts.length
      ? tp.length / alerts.length
      : null;

    const recall = FAILURES.length
      ? tp.length / FAILURES.length
      : null;

    const arithmeticMean =
      precision !== null && recall !== null
        ? (precision + recall) / 2
        : null;

    const f1 =
      precision !== null &&
      recall !== null &&
      precision + recall > 0
        ? 2 * precision * recall / (precision + recall)
        : null;

    const countNumerator = 2 * tp.length;
    const countDenominator = alerts.length + FAILURES.length;

    return {
      threshold,
      alerts,
      tp,
      fp,
      fn,
      tn,
      precision,
      recall,
      arithmeticMean,
      f1,
      countNumerator,
      countDenominator
    };
  }

  const R60 = evaluate(60);
  const R30 = evaluate(30);

  const NEW_ALERTS = R30.alerts.filter(i =>
    !R60.alerts.includes(i)
  );

  const pct = v =>
    v === null
      ? 'undefined'
      : `${Math.round(v * 100)}%`;

  // Fixed visual meanings throughout the chapter.
  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;
  const VIOLET = C.violet;

  // Responsive laptop / phone layout.
  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.53, 0]
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
    const maxh = P ? 1.75 : 2.40;

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

  // Water pump: motor, housing, inlet, outlet and mounting feet.
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

  // Amber bell = alert.
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
  // Base, probability, alert and outcome are independent
  // objects. No already-visible objects are regrouped.
  //
  // The alert row and failure row can contain separate visual
  // copies of the same pump, as required by the F1 demonstration.
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

  function newCard(i, source = 'original') {
    return {
      i,
      source,
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

  function successful(c) {
    return c.alerted && DATA[c.i].failed;
  }

  // Highlight outline drawn directly from card coordinates.
  function cardOutline(c, color = GREEN, pad = 0.12) {
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
  // Initial twelve-card grid.
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

  function hideGrid() {
    return cards.flatMap(c =>
      hideCard(c)
    );
  }

  // ------------------------------------------------------------
  // 0–2: Introduce the two jobs and the idea of one score.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.25 : -0.20;

  const introPump = pumpIcon(
    CX,
    INTRO_Y + 0.30,
    P ? 2.70 : 2.60,
    C.cyan
  );

  const introBell = bellIcon(
    CX,
    INTRO_Y + 1.58,
    2.0
  );

  const introTitle = text(
    'PREDICTION TOOL',
    22,
    WHITE,
    CX,
    INTRO_Y - 0.87,
    true
  );

  const JOB_Y = P ? -2.35 : -1.85;

  const trustJob = pill(
    'TRUST OUR ALERTS',
    AMBER,
    17
  );

  trustJob.moveTo([
    CX,
    JOB_Y,
    0
  ]);

  const catchJob = pill(
    'CATCH REAL FAILURES',
    RED,
    17
  );

  catchJob.moveTo([
    CX,
    JOB_Y - 0.52,
    0
  ]);

  await until(S(0));
  await play(
    new M.FadeIn(introPump),
    new M.FadeIn(introBell),
    new M.FadeIn(introTitle),
    ...say('HOW EASILY SHOULD WE RAISE ALERTS?', AMBER)
  );

  await until(S(1));
  await play(
    new M.FadeIn(trustJob),
    new M.FadeIn(catchJob),
    ...say('TRUST ALERTS AND CATCH FAILURES')
  );

  await until(S(2));
  await play(
    new M.Indicate(trustJob, {
      color: AMBER
    }),
    new M.Indicate(catchJob, {
      color: RED
    }),
    ...fbox([
      ['two jobs', C.ink],
      'trust alerts',
      'catch failures',
      ['one combined score?', VIOLET]
    ], VIOLET),
    ...say('CAN ONE NUMBER DESCRIBE BOTH?', VIOLET)
  );

  // ------------------------------------------------------------
  // 3: Bring back the twelve pump cards.
  // ------------------------------------------------------------

  await until(S(3));

  const initialCards = restoreGrid();

  const initialChances = cards.flatMap(c =>
    revealChance(c)
  );

  await play(
    ...fadeOut([
      introPump,
      introBell,
      introTitle,
      trustJob,
      catchJob
    ]),
    ...clearBox(),
    lag(
      initialCards,
      0.95,
      0.05
    ),
    ...initialChances,
    ...say('THE SAME 12 WATER PUMPS')
  );

  // ------------------------------------------------------------
  // 4–6: Original 60% threshold and actual outcomes.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    lag(
      R60.alerts.flatMap(i =>
        setAlert(cards[i], true)
      ),
      1.45,
      0.22
    ),
    ...fbox([
      ['threshold = 60%', AMBER],
      'alert if chance ≥ 60%',
      ['P1, P2, P3 receive alerts', AMBER]
    ], AMBER),
    ...say('AT 60%: P1, P2 AND P3 GET BELLS', AMBER)
  );

  await until(S(5));
  await play(
    ...focus(
      primary(FAILURES),
      RED
    ),
    ...fbox([
      ['10 hours later', WHITE],
      ['P2 and P4 actually fail', RED]
    ], RED),
    ...say('P2 AND P4 ACTUALLY FAILED', RED)
  );

  await until(S(6));
  await play(
    ...FAILURES.flatMap(i =>
      revealOutcome(cards[i])
    ),
    lag(
      SAFE.flatMap(i =>
        revealOutcome(cards[i])
      ),
      1.05,
      0.06
    ),
    ...fbox([
      ['red diamond = failure', RED],
      ['green circle = no failure', GREEN]
    ]),
    ...say('TWO RED DIAMONDS: P2 AND P4', RED)
  );

  // ------------------------------------------------------------
  // Row layout.
  //
  // Row 1: all alert cards — denominator for precision.
  // Row 2: all actual-failure cards — denominator for recall.
  //
  // P2 intentionally appears in both rows at 60%.
  // P2 and P4 intentionally appear in both rows at 30%.
  // ------------------------------------------------------------

  const ROW_W = P ? 6.85 : 7.20;
  const ROW_H = P ? 2.18 : 1.92;

  const ROW_Y = {
    alerts: P ? 0.68 : 0.30,
    failures: P ? -1.89 : -1.80
  };

  let rowPanels = {
    alerts: null,
    failures: null
  };

  let alertRow = [];
  let failureRow = [];

  let highlights = [];
  let sharedLabels = [];
  let combinedDecor = [];

  function rowColor(kind) {
    return kind === 'alerts'
      ? AMBER
      : RED;
  }

  function rowName(kind) {
    return kind === 'alerts'
      ? 'ALERT ROW'
      : 'FAILURE ROW';
  }

  function makeRowPanel(kind) {
    const y = ROW_Y[kind];
    const color = rowColor(kind);

    const frame = rounded(
      CX,
      y,
      ROW_W,
      ROW_H,
      color,
      C.card,
      0,
      2,
      0.15
    );

    const title = text(
      rowName(kind),
      P ? 17 : 16,
      color,
      CX - ROW_W / 4,
      y + ROW_H / 2 - 0.23,
      true,
      ROW_W / 2 - 0.30
    );

    const divider = line(
      CX - ROW_W / 2 + 0.14,
      y + ROW_H / 2 - 0.46,
      CX + ROW_W / 2 - 0.14,
      y + ROW_H / 2 - 0.46,
      color,
      1
    );

    return {
      kind,
      frame,
      title,
      divider,
      metric: null
    };
  }

  function panelObjects(p) {
    if (!p) return [];

    return [
      p.frame,
      p.title,
      p.divider,
      p.metric
    ].filter(Boolean);
  }

  function showRows() {
    const old = Object.values(rowPanels)
      .flatMap(p => panelObjects(p));

    rowPanels = {
      alerts: makeRowPanel('alerts'),
      failures: makeRowPanel('failures')
    };

    return [
      ...fadeOut(old),
      ...fadeIn(
        Object.values(rowPanels)
          .flatMap(p => panelObjects(p))
      )
    ];
  }

  function hideRows() {
    const anims = fadeOut(
      Object.values(rowPanels)
        .flatMap(p => panelObjects(p))
    );

    rowPanels = {
      alerts: null,
      failures: null
    };

    return anims;
  }

  function setRowMetric(kind, label, color = null) {
    const panel = rowPanels[kind];

    if (!panel) return [];

    const t = text(
      label,
      P ? 17 : 16,
      color || rowColor(kind),
      CX + ROW_W / 4,
      ROW_Y[kind] + ROW_H / 2 - 0.23,
      true,
      ROW_W / 2 - 0.30
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

  function indicateRow(kind, color = null) {
    const p = rowPanels[kind];

    if (!p) return [];

    return [
      new M.Indicate(
        p.frame,
        { color: color || rowColor(kind) }
      ),
      new M.Indicate(
        p.title,
        { color: color || rowColor(kind) }
      )
    ];
  }

  function rowSlots(kind, count) {
    const maxScale = count <= 3
      ? (P ? 1.22 : 1.05)
      : (P ? 0.86 : 0.82);

    const s = Math.min(
      maxScale,
      (ROW_W - 0.40) /
        (count * (CARD_W + 0.14))
    );

    const pitch = count <= 3
      ? Math.min(2.05, 1.82 * s)
      : s * (CARD_W + 0.18);

    const y = ROW_Y[kind] - 0.23;

    return Array.from({ length: count }, (_, j) => ({
      s,
      p: [
        CX + (j - (count - 1) / 2) * pitch,
        y,
        0
      ]
    }));
  }

  function makeRowCard(i, source, threshold) {
    const c = newCard(i, source);

    c.hasChance = true;
    c.hasOutcome = true;
    c.alerted = DATA[i].prob >= threshold;

    return c;
  }

  function populateAlertRow(threshold) {
    const r = evaluate(threshold);

    const old = alertRow.flatMap(c =>
      hideCard(c)
    );

    alertRow = r.alerts.map(i =>
      makeRowCard(i, 'alert row', threshold)
    );

    const slots = rowSlots(
      'alerts',
      alertRow.length
    );

    return [
      ...old,
      ...alertRow.flatMap((c, j) =>
        placeCard(
          c,
          slots[j].p,
          slots[j].s
        )
      )
    ];
  }

  function populateFailureRow(threshold) {
    const old = failureRow.flatMap(c =>
      hideCard(c)
    );

    failureRow = FAILURES.map(i =>
      makeRowCard(i, 'failure row', threshold)
    );

    const slots = rowSlots(
      'failures',
      failureRow.length
    );

    return [
      ...old,
      ...failureRow.flatMap((c, j) =>
        placeCard(
          c,
          slots[j].p,
          slots[j].s
        )
      )
    ];
  }

  function clearRowCards() {
    const anims = [
      ...alertRow.flatMap(c => hideCard(c)),
      ...failureRow.flatMap(c => hideCard(c))
    ];

    alertRow = [];
    failureRow = [];

    return anims;
  }

  function clearHighlights() {
    const anims = fadeOut(highlights);
    highlights = [];

    return anims;
  }

  function highlightCards(instances, color = GREEN) {
    const old = clearHighlights();

    highlights = instances.map(c =>
      cardOutline(c, color, 0.12)
    );

    return [
      ...old,
      ...highlights.map(o =>
        new M.Create(o)
      )
    ];
  }

  function clearSharedLabels() {
    const anims = fadeOut(sharedLabels);
    sharedLabels = [];

    return anims;
  }

  function rowSuccesses(kind) {
    const row = kind === 'alerts'
      ? alertRow
      : failureRow;

    return row.filter(c =>
      successful(c)
    );
  }

  // ------------------------------------------------------------
  // 7: Prepare the two rows.
  // ------------------------------------------------------------

  await until(S(7));
  await play(
    ...hideGrid(),
    ...clearBox(),
    ...showRows(),
    ...say('MAKE TWO ROWS OF PUMP CARDS')
  );

  // ------------------------------------------------------------
  // 8–10: Precision at the 60% threshold.
  // ------------------------------------------------------------

  await until(S(8));
  await play(
    ...populateAlertRow(60),
    ...setRowMetric(
      'alerts',
      '3 alerts',
      AMBER
    ),
    ...say('FIRST ROW: THE 3 ALERTS', AMBER)
  );

  await until(S(9));
  await play(
    ...highlightCards(
      rowSuccesses('alerts')
    ),
    ...focus(
      rowSuccesses('alerts'),
      GREEN,
      'outcome'
    ),
    ...setRowMetric(
      'alerts',
      '1 of 3 correct',
      GREEN
    ),
    ...fbox([
      ['3 alerts', AMBER],
      ['1 correct alert: P2', GREEN]
    ], AMBER),
    ...say('ONLY P2 ACTUALLY FAILED', GREEN)
  );

  await until(S(10));
  await play(
    ...setRowMetric(
      'alerts',
      'PRECISION ≈ 33%',
      AMBER
    ),
    ...fbox([
      ['precision', AMBER],
      '1 correct alert ÷ 3 alerts',
      ['= 1/3 ≈ 33%', AMBER]
    ], AMBER),
    ...say('PRECISION ≈ 33%', AMBER)
  );

  // ------------------------------------------------------------
  // 11–13: Recall at the 60% threshold.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...clearHighlights(),
    ...populateFailureRow(60),
    ...setRowMetric(
      'failures',
      '2 real failures',
      RED
    ),
    ...say('SECOND ROW: THE 2 REAL FAILURES', RED)
  );

  await until(S(12));
  await play(
    ...highlightCards(
      rowSuccesses('failures')
    ),
    ...focus(
      rowSuccesses('failures'),
      AMBER,
      'alert'
    ),
    ...setRowMetric(
      'failures',
      '1 of 2 caught',
      GREEN
    ),
    ...fbox([
      ['2 real failures', RED],
      ['1 caught failure: P2', GREEN]
    ], RED),
    ...say('ONLY P2 RECEIVED AN ALERT', GREEN)
  );

  await until(S(13));
  await play(
    ...setRowMetric(
      'failures',
      'RECALL = 50%',
      RED
    ),
    ...fbox([
      ['precision = 1/3 ≈ 33%', AMBER],
      ['recall    = 1/2 = 50%', RED]
    ]),
    ...say('RECALL = 50%', RED)
  );

  // ------------------------------------------------------------
  // 14–17: The ordinary arithmetic mean.
  //
  // Use the exact fractions, not rounded percentages.
  // (1/3 + 1/2) / 2 = 5/12 ≈ 41.7%.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    ...clearHighlights(),
    ...indicateRow(
      'alerts',
      AMBER
    ),
    ...indicateRow(
      'failures',
      RED
    ),
    ...fbox([
      ['precision ≈ 33%', AMBER],
      ['recall = 50%', RED],
      ['one combined score?', VIOLET]
    ], VIOLET),
    ...say('HOW CAN WE COMBINE THESE TWO NUMBERS?', VIOLET)
  );

  await until(S(15));
  await play(
    ...fbox([
      ['ordinary mean', C.cyan],
      '(precision + recall) ÷ 2',
      '(1/3 + 1/2) ÷ 2',
      '= 5/12'
    ]),
    ...say('ADD THE TWO RESULTS, THEN DIVIDE BY 2')
  );

  await until(S(16));
  await play(
    ...fbox([
      ['ordinary mean', C.cyan],
      '= 5/12',
      ['≈ 41.7% ≈ 42%', C.cyan]
    ]),
    ...say('ORDINARY MEAN ≈ 42%')
  );

  await until(S(17));
  await play(
    ...indicateRow(
      'alerts',
      AMBER
    ),
    new M.Indicate(
      rowPanels.alerts.metric,
      { color: AMBER }
    ),
    ...fbox([
      ['precision ≈ 33%', AMBER],
      ['recall = 50%', RED],
      ['precision is the weaker result', VIOLET]
    ], VIOLET),
    ...say('PAY MORE ATTENTION TO THE WEAKER RESULT', VIOLET)
  );

  // ------------------------------------------------------------
  // 18–21: Inspect the two denominator rows.
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    ...clearBox(),
    ...indicateRow('alerts'),
    ...indicateRow('failures'),
    ...say('LOOK AGAIN AT OUR TWO ROWS')
  );

  await until(S(19));
  await play(
    ...setRowMetric(
      'alerts',
      `${alertRow.length} cards`,
      AMBER
    ),
    ...setRowMetric(
      'failures',
      `${failureRow.length} cards`,
      RED
    ),
    ...fbox([
      ['alert row: 3 cards', AMBER],
      ['failure row: 2 cards', RED]
    ]),
    ...say('THREE CARDS ABOVE, TWO BELOW')
  );

  await until(S(20));
  await play(
    ...highlightCards([
      ...rowSuccesses('alerts'),
      ...rowSuccesses('failures')
    ]),
    ...fbox([
      ['bell + diamond', GREEN],
      'represents a caught failure',
      ['one in each row', GREEN]
    ], GREEN),
    ...say('EACH ROW HAS ONE SUCCESS', GREEN)
  );

  function sharedPumpLabels() {
    const old = clearSharedLabels();

    const shared = [
      ...rowSuccesses('alerts'),
      ...rowSuccesses('failures')
    ];

    sharedLabels = shared.map(c => {
      const t = pill(
        `SAME ${DATA[c.i].id}`,
        GREEN,
        P ? 15 : 13
      );

      t.moveTo([
        c.x,
        c.y - CARD_H * c.s / 2 - 0.19,
        0
      ]);

      return t;
    });

    return [
      ...old,
      ...fadeIn(sharedLabels)
    ];
  }

  await until(S(21));
  await play(
    ...sharedPumpLabels(),
    ...focus(
      [
        ...rowSuccesses('alerts'),
        ...rowSuccesses('failures')
      ],
      GREEN
    ),
    ...fbox([
      ['P2 appears twice', GREEN],
      'once as a correct alert',
      'once as a caught failure',
      ['same pump, two measures', C.muted]
    ], GREEN),
    ...say('P2 CONTRIBUTES TO BOTH MEASURES', GREEN)
  );

  // ------------------------------------------------------------
  // Combined-card layout.
  //
  // Preserve every card in both denominator rows.
  // Do not deduplicate the caught failures.
  //
  // Each true positive contributes twice:
  // once in the alert row, once in the failure row.
  //
  // Therefore:
  // combined successes = 2TP
  // combined cards = alerts + actual failures
  // ------------------------------------------------------------

  function combinedCards() {
    return [
      ...alertRow,
      ...failureRow
    ];
  }

  function clearCombinedDecor() {
    const anims = fadeOut(combinedDecor);
    combinedDecor = [];

    return anims;
  }

  let combinedMetric = null;

  function clearCombinedMetric() {
    if (!combinedMetric) return [];

    const old = combinedMetric;
    combinedMetric = null;

    return [new M.FadeOut(old)];
  }

  function setCombinedMetric(label, color = VIOLET) {
    const t = text(
      label,
      P ? 26 : 23,
      color,
      CX,
      P ? -4.36 : -2.52,
      true,
      ROW_W - 0.35
    );

    const anims = clearCombinedMetric();

    anims.push(
      new M.FadeIn(t)
    );

    combinedMetric = t;

    return anims;
  }

  function combinedSlots(count) {
    if (count <= 5 && !P) {
      const s = P ? 0.92 : 0.96;
      const pitch = s * (P ? 1.32 : 1.40);

      return Array.from({ length: count }, (_, j) => ({
        s,
        p: [
          CX + (j - (count - 1) / 2) * pitch,
          P ? -0.75 : -0.48,
          0
        ]
      }));
    }

    const cols = P && count <= 6 ? 3 : 4;
    const rows = Math.ceil(count / cols);
    const s = P ? 1.10 : 0.94;

    const pitchX = s * 1.55;
    const pitchY = P ? 1.82 : 1.48;

    const cy = P ? -1.02 : -0.65;

    return Array.from({ length: count }, (_, j) => {
      const r = Math.floor(j / cols);
      const c = j % cols;

      const countInRow = Math.min(
        cols,
        count - r * cols
      );

      return {
        s,
        p: [
          CX + (c - (countInRow - 1) / 2) * pitchX,
          cy + ((rows - 1) / 2 - r) * pitchY,
          0
        ]
      };
    });
  }

  function combineRows() {
    const list = combinedCards();
    const slots = combinedSlots(list.length);

    const anims = [
      ...clearHighlights(),
      ...clearSharedLabels(),
      ...hideRows(),
      ...clearCombinedDecor(),
      ...clearCombinedMetric()
    ];

    anims.push(
      ...list.flatMap((c, j) =>
        placeCard(
          c,
          slots[j].p,
          slots[j].s
        )
      )
    );

    const top = P ? 1.53 : 1.17;
    const bottom = P ? -4.02 : -2.20;

    const frame = rounded(
      CX,
      (top + bottom) / 2,
      ROW_W,
      top - bottom,
      VIOLET,
      C.card,
      0,
      2.2,
      0.16
    );

    const heading = text(
      'ALERT ROW + FAILURE ROW',
      P ? 20 : 18,
      VIOLET,
      CX,
      top - 0.24,
      true,
      ROW_W - 0.30
    );

    const sourceLabels = list.map(c =>
      text(
        c.source === 'alert row'
          ? 'alert row'
          : 'failure row',

        P ? 16 : 13,

        c.source === 'alert row'
          ? AMBER
          : RED,

        c.x,
        c.y - CARD_H * c.s / 2 - 0.20,
        false,
        CARD_W * c.s + 0.10
      )
    );

    combinedDecor = [
      frame,
      heading,
      ...sourceLabels
    ];

    anims.push(
      ...fadeIn(combinedDecor)
    );

    return anims;
  }

  function combinedSuccesses() {
    return combinedCards().filter(c =>
      successful(c)
    );
  }

  // ------------------------------------------------------------
  // 22–24: Combine the rows into five cards.
  // ------------------------------------------------------------

  await until(S(22));
  await play(
    ...combineRows(),
    ...fbox([
      ['3 alert cards', AMBER],
      ['2 failure cards', RED],
      'keep both copies of P2'
    ], VIOLET),
    ...say('BRING THE ROWS TOGETHER', VIOLET)
  );

  await until(S(23));
  await play(
    ...highlightCards(
      combinedSuccesses()
    ),
    ...setCombinedMetric(
      `${combinedSuccesses().length} successes / ${combinedCards().length} cards`,
      GREEN
    ),
    ...fbox([
      ['5 cards in total', VIOLET],
      ['2 successful entries', GREEN],
      'both represent P2'
    ], VIOLET),
    ...say('FIVE CARDS, TWO SUCCESSES', GREEN)
  );

  await until(S(24));
  await play(
    ...setCombinedMetric(
      '2 ÷ 5 = 40%',
      VIOLET
    ),
    ...fbox([
      ['successful entries = 2', GREEN],
      'combined cards = 5',
      ['2 ÷ 5 = 40%', VIOLET]
    ], VIOLET),
    ...say('TWO OUT OF FIVE = 40%', VIOLET)
  );

  // ------------------------------------------------------------
  // 25–26: Name the F1 score and harmonic mean.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...setCombinedMetric(
      `F1 = ${pct(R60.f1)}`,
      VIOLET
    ),
    ...fbox([
      ['F1 score', VIOLET],
      'combines precision and recall',
      ['here: 40%', VIOLET]
    ], VIOLET),
    ...say('THIS IS THE F1 SCORE', VIOLET)
  );

  await until(S(26));
  await play(
    ...fbox([
      ['harmonic mean', VIOLET],
      'a special kind of average',
      ['of precision and recall', C.ink]
    ], VIOLET),
    ...say('F1 USES THE HARMONIC MEAN', VIOLET)
  );

  // ------------------------------------------------------------
  // Percentage number-line comparison.
  //
  // Precision = 1/3 ≈ 33.3%.
  // Recall = 1/2 = 50%.
  // Arithmetic mean = 5/12 ≈ 41.7%.
  // Harmonic mean = 2/5 = 40%.
  //
  // A zoomed 30–55% scale makes the small difference visible.
  // ------------------------------------------------------------

  const MEAN_X0 = CX - 3.02;
  const MEAN_X1 = CX + 3.02;

  const MEAN_Y = P ? -0.76 : -0.56;

  const mean2x = v =>
    MEAN_X0 +
    (v - 30) / 25 * (MEAN_X1 - MEAN_X0);

  function meanNumberLine() {
    const axis = line(
      MEAN_X0,
      MEAN_Y,
      MEAN_X1,
      MEAN_Y,
      C.muted,
      3
    );

    const ticks = [30, 35, 40, 45, 50, 55].flatMap(v => [
      line(
        mean2x(v),
        MEAN_Y - 0.09,
        mean2x(v),
        MEAN_Y + 0.09,
        C.muted,
        2
      ),
      text(
        `${v}%`,
        P ? 16 : 14,
        C.muted,
        mean2x(v),
        MEAN_Y - 0.32,
        true
      )
    ]);

    const note = text(
      'Zoomed scale: 30% to 55%',
      15,
      C.muted,
      CX,
      MEAN_Y - 0.69
    );

    return new M.VGroup(
      axis,
      ...ticks,
      note
    );
  }

  function scoreMarker(value, label, color, offsetY, size = 17) {
    const x = mean2x(value);
    const y = MEAN_Y;

    const halo = new M.Dot({
      point: [x, y, 0],
      radius: 0.16,
      color
    });

    halo.setFill(color, 0.16);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: 0.072,
      color
    });

    const leader = line(
      x,
      y,
      x,
      y + offsetY * 0.76,
      color,
      1.7
    );

    const lab = text(
      label,
      size,
      color,
      x,
      y + offsetY,
      true,
      2.50
    );

    return new M.VGroup(
      halo,
      dot,
      leader,
      lab
    );
  }

  const meanLine = meanNumberLine();

  const precisionMarker = scoreMarker(
    R60.precision * 100,
    'Precision 33.3%',
    AMBER,
    0.53,
    16
  );

  const recallMarker = scoreMarker(
    R60.recall * 100,
    'Recall 50%',
    RED,
    0.53,
    16
  );

  const arithmeticMarker = scoreMarker(
    R60.arithmeticMean * 100,
    'Mean 41.7%',
    C.cyan,
    1.04,
    16
  );

  const harmonicMarker = scoreMarker(
    R60.f1 * 100,
    'F1 40%',
    VIOLET,
    P ? -1.32 : -1.12,
    18
  );

  const weakerHeading = text(
    'Closer to the smaller result',
    19,
    VIOLET,
    CX,
    P ? 1.26 : 1.14,
    false,
    ROW_W - 0.40
  );

  const shiftY = MEAN_Y + 0.21;
  const shiftStart = mean2x(R60.arithmeticMean * 100);
  const shiftEnd = mean2x(R60.f1 * 100);

  const shiftArrow = new M.VGroup(
    line(
      shiftStart,
      shiftY,
      shiftEnd,
      shiftY,
      VIOLET,
      3
    ),
    line(
      shiftEnd + 0.10,
      shiftY + 0.09,
      shiftEnd,
      shiftY,
      VIOLET,
      3
    ),
    line(
      shiftEnd + 0.10,
      shiftY - 0.09,
      shiftEnd,
      shiftY,
      VIOLET,
      3
    )
  );

  // ------------------------------------------------------------
  // 27–28: Compare the arithmetic and harmonic means visually.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...clearHighlights(),
    ...clearCombinedDecor(),
    ...clearCombinedMetric(),
    ...combinedCards().flatMap(c =>
      hideCard(c)
    ),
    new M.FadeIn(weakerHeading),
    new M.FadeIn(meanLine),
    new M.FadeIn(precisionMarker),
    new M.FadeIn(recallMarker),
    lag(
      [
        new M.FadeIn(arithmeticMarker),
        new M.FadeIn(harmonicMarker),
        new M.FadeIn(shiftArrow)
      ],
      2.5,
      0.30
    ),
    ...fbox([
      ['smaller result: precision', AMBER],
      ['ordinary mean ≈ 41.7%', C.cyan],
      ['harmonic mean = 40%', VIOLET]
    ], VIOLET),
    ...say('HARMONIC MEAN LEANS TOWARD THE SMALLER VALUE', VIOLET)
  );

  await until(S(28));
  await play(
    new M.Indicate(
      arithmeticMarker,
      { color: C.cyan }
    ),
    new M.Indicate(
      harmonicMarker,
      { color: VIOLET }
    ),
    ...fbox([
      ['ordinary mean ≈ 42%', C.cyan],
      ['F1 score = 40%', VIOLET],
      'calculated using exact fractions'
    ], VIOLET),
    ...say('ORDINARY MEAN 42% · F1 40%', VIOLET)
  );

  // ------------------------------------------------------------
  // Threshold gauge.
  //
  // The amber marker moves along a probability scale.
  // The highlighted region represents probabilities greater
  // than or equal to the threshold.
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
        P ? 15 : 13,
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
  // 29–31: Lower the threshold from 60% to 30%.
  //
  // Actual outcomes stay fixed.
  // Pumps 4, 5 and 6 receive new bells.
  // ------------------------------------------------------------

  await until(S(29));
  await play(
    ...fadeOut([
      weakerHeading,
      meanLine,
      precisionMarker,
      recallMarker,
      arithmeticMarker,
      harmonicMarker,
      shiftArrow
    ]),
    ...clearRowCards(),
    ...restoreGrid(),
    ...showGauge(60),
    ...say('CAN A LOWER THRESHOLD IMPROVE F1?', AMBER)
  );

  await until(S(30));
  await play(
    ...moveGauge(30),
    ...say('LOWER THE THRESHOLD: 60% → 30%', AMBER)
  );

  await until(S(31));
  await play(
    lag(
      NEW_ALERTS.flatMap(i =>
        setAlert(cards[i], true)
      ),
      1.35,
      0.22
    ),
    ...say('P4, P5 AND P6 RECEIVE BELLS TOO', AMBER)
  );

  // ------------------------------------------------------------
  // 32–33: Precision at the new threshold.
  //
  // Six alerts, two correct.
  // Precision = 2/6 = 1/3 ≈ 33%.
  // ------------------------------------------------------------

  await until(S(32));
  await play(
    ...hideGauge(),
    ...hideGrid(),
    ...showRows(),
    ...populateAlertRow(30),
    ...setRowMetric(
      'alerts',
      '2 of 6 correct',
      GREEN
    ),
    ...fbox([
      ['6 alerts', AMBER],
      ['2 correct alerts: P2, P4', GREEN]
    ], AMBER),
    ...say('SIX ALERTS, TWO CORRECT', AMBER)
  );

  await until(S(33));
  await play(
    ...highlightCards(
      rowSuccesses('alerts')
    ),
    ...setRowMetric(
      'alerts',
      'PRECISION ≈ 33%',
      AMBER
    ),
    ...fbox([
      ['precision', AMBER],
      '2 ÷ 6 = 1 ÷ 3',
      ['≈ 33%', AMBER],
      ['precision stays the same', C.muted]
    ], AMBER),
    ...say('PRECISION STAYS AT ABOUT 33%', AMBER)
  );

  // ------------------------------------------------------------
  // 34–35: Recall at the new threshold.
  //
  // Still two actual failures.
  // Both are now caught.
  // Recall = 2/2 = 100%.
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    ...clearHighlights(),
    ...populateFailureRow(30),
    ...setRowMetric(
      'failures',
      '2 real failures',
      RED
    ),
    ...fbox([
      ['the same 2 actual failures', RED],
      'P2 and P4'
    ], RED),
    ...say('THE FAILURE ROW STILL HAS TWO PUMPS', RED)
  );

  await until(S(35));
  await play(
    ...highlightCards(
      rowSuccesses('failures')
    ),
    ...focus(
      rowSuccesses('failures'),
      AMBER,
      'alert'
    ),
    ...setRowMetric(
      'failures',
      'RECALL = 100%',
      RED
    ),
    ...fbox([
      ['recall', RED],
      '2 caught ÷ 2 actual failures',
      ['= 100%', RED]
    ], RED),
    ...say('BOTH HAVE BELLS: RECALL = 100%', RED)
  );

  // ------------------------------------------------------------
  // 36–40: Combine the rows again.
  //
  // Six alert entries and two actual-failure entries.
  // P2 and P4 each appear twice.
  // Four successful entries among eight entries.
  // F1 = 4/8 = 50%.
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    ...combineRows(),
    ...clearBox(),
    ...say('BRING THE TWO ROWS TOGETHER AGAIN', VIOLET)
  );

  await until(S(37));
  await play(
    ...setCombinedMetric(
      '6 + 2 = 8 cards',
      VIOLET
    ),
    ...fbox([
      ['6 cards from the alert row', AMBER],
      ['2 cards from the failure row', RED],
      ['8 cards altogether', VIOLET]
    ], VIOLET),
    ...say('SIX ALERT CARDS PLUS TWO FAILURE CARDS')
  );

  await until(S(38));
  await play(
    ...highlightCards(
      combinedSuccesses()
    ),
    ...setCombinedMetric(
      `${combinedSuccesses().length} successes / ${combinedCards().length} cards`,
      GREEN
    ),
    ...fbox([
      ['P2 appears twice', GREEN],
      ['P4 appears twice', GREEN],
      ['4 successful entries', GREEN]
    ], GREEN),
    ...say('FOUR OF THE EIGHT CARDS ARE SUCCESSES', GREEN)
  );

  await until(S(39));
  await play(
    ...setCombinedMetric(
      '4 ÷ 8 = 50%',
      VIOLET
    ),
    ...fbox([
      ['4 successful entries', GREEN],
      '8 combined cards',
      ['4 ÷ 8 = 50%', VIOLET]
    ], VIOLET),
    ...say('FOUR OUT OF EIGHT = 50%', VIOLET)
  );

  await until(S(40));
  await play(
    ...setCombinedMetric(
      'F1: 40% → 50%',
      VIOLET
    ),
    ...fbox([
      ['at 60% threshold: F1 = 40%', C.muted],
      ['at 30% threshold: F1 = 50%', VIOLET],
      ['increase: 10 percentage points', GREEN]
    ], VIOLET),
    ...say('F1 HAS RISEN FROM 40% TO 50%', VIOLET)
  );

  // ------------------------------------------------------------
  // Formula helpers.
  //
  // Introduce the count formula only after learners have seen
  // the physical row-combination demonstration.
  // ------------------------------------------------------------

  const FORMULA_Y = P ? -0.90 : -0.60;

  const FORMULA_W = P ? 6.50 : 6.80;
  const FORMULA_H = P ? 3.90 : 3.30;

  let formulaParts = {
    frame: null,
    heading: null,
    top: null,
    fractionLine: null,
    bottom: null,
    result: null,
    note: null
  };

  function formulaObjects() {
    return Object.values(formulaParts)
      .filter(Boolean);
  }

  function clearFormula() {
    const anims = fadeOut(
      formulaObjects()
    );

    formulaParts = {
      frame: null,
      heading: null,
      top: null,
      fractionLine: null,
      bottom: null,
      result: null,
      note: null
    };

    return anims;
  }

  function startFormula(title) {
    const anims = clearFormula();

    formulaParts.frame = rounded(
      CX,
      FORMULA_Y,
      FORMULA_W,
      FORMULA_H,
      VIOLET,
      C.card,
      0.90,
      2,
      0.18
    );

    formulaParts.heading = text(
      title,
      P ? 21 : 20,
      VIOLET,
      CX,
      FORMULA_Y + FORMULA_H / 2 - 0.31,
      true,
      FORMULA_W - 0.40
    );

    formulaParts.fractionLine = line(
      CX - FORMULA_W / 2 + 0.45,
      FORMULA_Y + 0.22,
      CX + FORMULA_W / 2 - 0.45,
      FORMULA_Y + 0.22,
      C.ink,
      2.5
    );

    anims.push(
      new M.FadeIn(formulaParts.frame),
      new M.FadeIn(formulaParts.heading),
      new M.Create(formulaParts.fractionLine)
    );

    return anims;
  }

  function formulaLabel(which, lines, color = C.ink) {
    const rows = Array.isArray(lines)
      ? lines
      : [lines];

    let y;

    if (which === 'top') {
      y = FORMULA_Y + 0.67;
    } else if (which === 'bottom') {
      y = FORMULA_Y - 0.26;
    } else if (which === 'result') {
      y = FORMULA_Y - 0.98;
    } else {
      y = FORMULA_Y - FORMULA_H / 2 + 0.20;
    }

    const lh = P ? 0.34 : 0.30;

    const size = which === 'result'
      ? 25
      : (P ? 19 : 19);

    const texts = rows.map((s, i) =>
      text(
        s,
        size,
        color,
        CX,
        y + ((rows.length - 1) / 2 - i) * lh,
        true,
        FORMULA_W - 0.60
      )
    );

    const g = new M.VGroup(...texts);

    const anims = [];

    if (formulaParts[which]) {
      anims.push(
        new M.FadeOut(formulaParts[which])
      );
    }

    formulaParts[which] = g;

    anims.push(
      new M.FadeIn(g)
    );

    return anims;
  }

  // ------------------------------------------------------------
  // 41: Introduce the count-based formula.
  // ------------------------------------------------------------

  await until(S(41));
  await play(
    ...clearHighlights(),
    ...clearCombinedDecor(),
    ...clearCombinedMetric(),
    ...clearRowCards(),
    ...startFormula('F1: COUNT FORMULA'),
    ...fbox([
      ['our card method', VIOLET],
      'write it as one fraction'
    ], VIOLET),
    ...say('TURN OUR CARD METHOD INTO A FORMULA', VIOLET)
  );

  // ------------------------------------------------------------
  // 42: Numerator — twice the number of caught failures.
  // ------------------------------------------------------------

  await until(S(42));
  await play(
    ...formulaLabel(
      'top',
      '2 × caught failures',
      GREEN
    ),
    ...fbox([
      ['top of the fraction', GREEN],
      'each caught failure appears twice',
      ['2 × TP', GREEN]
    ], GREEN),
    ...say('TOP = TWICE THE CAUGHT FAILURES', GREEN)
  );

  // ------------------------------------------------------------
  // 43: Denominator — alerts plus real failures.
  // ------------------------------------------------------------

  await until(S(43));
  await play(
    ...formulaLabel(
      'bottom',
      [
        'total alerts +',
        'total real failures'
      ],
      C.ink
    ),
    ...fbox([
      ['bottom of the fraction', C.ink],
      'size of the alert row',
      '+ size of the failure row'
    ]),
    ...say('BOTTOM = ALL ALERTS + ALL REAL FAILURES')
  );

  // ------------------------------------------------------------
  // 44: Divide to obtain F1.
  //
  // F1 = 2TP / (alerts + real failures)
  //    = 2TP / (2TP + FP + FN)
  //
  // At 30%: 2 × 2 / (6 + 2) = 4/8 = 50%.
  // ------------------------------------------------------------

  await until(S(44));
  await play(
    ...formulaLabel(
      'top',
      '2 × 2 = 4',
      GREEN
    ),
    ...formulaLabel(
      'bottom',
      '6 + 2 = 8',
      C.ink
    ),
    ...formulaLabel(
      'result',
      'F1 = 4/8 = 50%',
      VIOLET
    ),
    ...fbox([
      ['equivalent count formula', VIOLET],
      'F1 = 2TP ÷ (2TP + FP + FN)',
      ['here: 4 ÷ 8 = 50%', VIOLET]
    ], VIOLET),
    ...say('DIVIDE THE TOP BY THE BOTTOM', VIOLET)
  );

  // ------------------------------------------------------------
  // 45–48: Precision-and-recall formula.
  //
  // F1 = 2 × precision × recall / (precision + recall)
  //
  // At 30%:
  // precision = 1/3 exactly
  // recall = 1 exactly
  // numerator = 2/3
  // denominator = 4/3
  // F1 = (2/3) / (4/3) = 1/2.
  // ------------------------------------------------------------

  await until(S(45));
  await play(
    ...startFormula(
      'F1: PRECISION AND RECALL'
    ),
    ...fbox([
      ['another way to calculate F1', VIOLET],
      ['precision = 1/3', AMBER],
      ['recall = 1', RED]
    ], VIOLET),
    ...say('CALCULATE F1 FROM PRECISION AND RECALL', VIOLET)
  );

  await until(S(46));
  await play(
    ...formulaLabel(
      'top',
      '2 × precision × recall',
      GREEN
    ),
    ...fbox([
      ['top of the fraction', GREEN],
      'precision × recall × 2',
      ['2 × (1/3) × 1 = 2/3', GREEN]
    ], GREEN),
    ...say('MULTIPLY PRECISION × RECALL × 2', GREEN)
  );

  await until(S(47));
  await play(
    ...formulaLabel(
      'bottom',
      'precision + recall',
      C.ink
    ),
    ...fbox([
      ['bottom of the fraction', C.ink],
      'precision + recall',
      '1/3 + 1 = 4/3'
    ]),
    ...say('DIVIDE BY PRECISION + RECALL')
  );

  await until(S(48));
  await play(
    ...formulaLabel(
      'top',
      '2 × (1/3) × 1 = 2/3',
      GREEN
    ),
    ...formulaLabel(
      'bottom',
      '1/3 + 1 = 4/3',
      C.ink
    ),
    ...formulaLabel(
      'result',
      'F1 = 1/2 = 50%',
      VIOLET
    ),
    ...fbox([
      ['both formulas agree', GREEN],
      'when precision and recall',
      'are defined and their sum > 0',
      ['same F1 = 50%', VIOLET]
    ], GREEN),
    ...say('BOTH FORMULAS GIVE EXACTLY THE SAME SCORE', GREEN)
  );

  // ------------------------------------------------------------
  // Score comparison picture.
  //
  // Keep the same scale for the two F1 scores.
  // One filled strip is 40%, the other is 50%.
  // ------------------------------------------------------------

  const SCORE_X0 = CX - 2.60;
  const SCORE_W = 5.20;

  function scoreBar(
    y,
    threshold,
    precision,
    recall,
    f1,
    color
  ) {
    const heading = text(
      `THRESHOLD ${threshold}%`,
      19,
      AMBER,
      CX,
      y + 0.67,
      true
    );

    const measures = text(
      `Precision ${pct(precision)} · Recall ${pct(recall)}`,
      16,
      C.ink,
      CX,
      y + 0.31,
      false,
      ROW_W - 0.40
    );

    const track = rounded(
      SCORE_X0 + SCORE_W / 2,
      y - 0.13,
      SCORE_W,
      0.32,
      C.muted,
      C.card,
      0.35,
      1.5,
      0.08
    );

    const filled = rect(
      SCORE_X0 + SCORE_W * f1 / 2,
      y - 0.13,
      SCORE_W * f1,
      0.32,
      color,
      0.88,
      1
    );

    const value = text(
      `F1 ${pct(f1)}`,
      18,
      color,
      CX,
      y - 0.50,
      true
    );

    return new M.VGroup(
      heading,
      measures,
      track,
      filled,
      value
    );
  }

  const score60 = scoreBar(
    P ? 0.12 : 0.20,
    60,
    R60.precision,
    R60.recall,
    R60.f1,
    C.muted
  );

  const score30 = scoreBar(
    P ? -2.00 : -1.61,
    30,
    R30.precision,
    R30.recall,
    R30.f1,
    VIOLET
  );

  // ------------------------------------------------------------
  // 49–50: Use F1 as a combined measure.
  // ------------------------------------------------------------

  await until(S(49));
  await play(
    ...clearFormula(),
    new M.FadeIn(score60),
    new M.FadeIn(score30),
    ...fbox([
      ['USE F1', VIOLET],
      'one score combining',
      ['precision', AMBER],
      ['and recall', RED]
    ], VIOLET),
    ...say('USE F1 TO COMBINE PRECISION AND RECALL', VIOLET)
  );

  await until(S(50));
  await play(
    new M.Indicate(
      score30,
      { color: VIOLET }
    ),
    ...fbox([
      ['F1: 40% → 50%', VIOLET],
      'better combined performance',
      'on these two particular jobs'
    ], VIOLET),
    ...say('HIGHER F1: BETTER COMBINED PERFORMANCE', VIOLET)
  );

  // ------------------------------------------------------------
  // 51: F1 does not count true negatives.
  //
  // Return to all twelve actual pumps at the 30% threshold.
  // The six true negatives are P7–P12.
  // ------------------------------------------------------------

  await until(S(51));

  const restoreThresholdState =
    setPrimaryThreshold(30);

  const restoreAllCards =
    restoreGrid();

  await play(
    new M.FadeOut(score60),
    new M.FadeOut(score30),
    ...restoreThresholdState,
    ...restoreAllCards,
    ...fbox([
      ['F1 uses TP, FP and FN', VIOLET],
      ['true negatives are not counted', C.muted],
      '6 correctly quiet pumps here'
    ], AMBER),
    ...say('F1 DOES NOT COUNT CORRECT NO-ALERTS', AMBER)
  );

  // ------------------------------------------------------------
  // 52: F1 does not measure the costs of mistakes.
  //
  // The 30% threshold has four false alarms and no missed
  // failures. The 60% threshold has two false alarms and one
  // missed failure. F1 alone does not assign repair costs.
  // ------------------------------------------------------------

  const LIMIT_NOTE_Y = P ? -3.55 : -2.63;

  const limitNote = text(
    'A missed failure and a false alarm can have different costs',
    P ? 17 : 15,
    AMBER,
    CX,
    LIMIT_NOTE_Y,
    false,
    ROW_W - 0.25
  );

  await until(S(52));
  await play(
    ...highlightCards(
      primary(R30.fp),
      AMBER
    ),
    new M.FadeIn(limitNote),
    ...fbox([
      ['missed failures have costs', RED],
      ['false alarms have costs', AMBER],
      'F1 does not measure these costs'
    ], AMBER),
    ...say('F1 DOES NOT TELL US THE COST OF MISTAKES', AMBER)
  );

  // ------------------------------------------------------------
  // 53: Consider F1 alongside other measures.
  // ------------------------------------------------------------

  const finalCompareY = P ? -0.70 : -0.48;

  function summaryPanel(x, threshold, r, color) {
    const w = P ? 3.12 : 3.20;
    const h = P ? 4.00 : 3.55;

    const y = finalCompareY;

    const frame = rounded(
      x,
      y,
      w,
      h,
      color,
      C.card,
      0.95,
      2,
      0.16
    );

    const heading = text(
      `THRESHOLD ${threshold}%`,
      18,
      AMBER,
      x,
      y + h / 2 - 0.30,
      true,
      w - 0.24
    );

    const divider = line(
      x - w / 2 + 0.15,
      y + h / 2 - 0.56,
      x + w / 2 - 0.15,
      y + h / 2 - 0.56,
      C.muted,
      1.5
    );

    const precisionText = text(
      `Precision ${pct(r.precision)}`,
      17,
      AMBER,
      x,
      y + 0.65,
      true,
      w - 0.25
    );

    const recallText = text(
      `Recall ${pct(r.recall)}`,
      17,
      RED,
      x,
      y + 0.25,
      true,
      w - 0.25
    );

    const f1Text = text(
      `F1 ${pct(r.f1)}`,
      28,
      color,
      x,
      y - 0.32,
      true,
      w - 0.30
    );

    const fpText = text(
      `${r.fp.length} false alarms`,
      15,
      AMBER,
      x,
      y - 0.93,
      false,
      w - 0.20
    );

    const fnText = text(
      `${r.fn.length} missed failures`,
      15,
      r.fn.length ? RED : GREEN,
      x,
      y - 1.25,
      false,
      w - 0.20
    );

    return new M.VGroup(
      frame,
      heading,
      divider,
      precisionText,
      recallText,
      f1Text,
      fpText,
      fnText
    );
  }

  const summary60 = summaryPanel(
    CX - 1.70,
    60,
    R60,
    C.muted
  );

  const summary30 = summaryPanel(
    CX + 1.70,
    30,
    R30,
    VIOLET
  );

  await until(S(53));
  await play(
    ...clearHighlights(),
    new M.FadeOut(limitNote),
    ...hideGrid(),
    new M.FadeIn(summary60),
    new M.FadeIn(summary30),
    ...fbox([
      ['compare thresholds using', C.ink],
      ['precision and recall', C.cyan],
      ['F1', VIOLET],
      'and consequences of mistakes'
    ]),
    ...say('USE F1 ALONGSIDE OTHER MEASURES')
  );

  // ------------------------------------------------------------
  // 54: Final visual recap.
  //
  // Return to the original 60% example to reinforce the
  // difference between the arithmetic and harmonic means.
  //
  // Exact results:
  // precision = 1/3
  // recall = 1/2
  // arithmetic mean = 5/12 ≈ 41.7%
  // F1 = 2/5 = 40%
  // ------------------------------------------------------------

  const RECAP_W = P ? 6.65 : 6.90;

  const RECAP_TOP = P ? 1.38 : 1.28;
  const RECAP_BOTTOM = P ? -4.62 : -2.78;

  const recapFrame = rounded(
    CX,
    (RECAP_TOP + RECAP_BOTTOM) / 2,
    RECAP_W,
    RECAP_TOP - RECAP_BOTTOM,
    VIOLET,
    C.card,
    0,
    2,
    0.18
  );

  const recapTitle = text(
    'F1: ONE COMBINED SCORE',
    21,
    VIOLET,
    CX,
    RECAP_TOP - 0.29,
    true,
    RECAP_W - 0.35
  );

  const finalPrecision = text(
    'PRECISION = 1/3 ≈ 33%',
    19,
    AMBER,
    CX,
    P ? 0.40 : 0.47,
    true,
    RECAP_W - 0.30
  );

  const finalRecall = text(
    'RECALL = 1/2 = 50%',
    19,
    RED,
    CX,
    P ? -0.10 : 0.03,
    true,
    RECAP_W - 0.30
  );

  const FINAL_BLOCK_Y = P ? -1.35 : -0.87;
  const FINAL_BLOCK_SP = P ? 0.97 : 0.94;
  const FINAL_BLOCK_W = 0.75;

  // Five combined entries at 60%:
  // alert P1, alert P2, alert P3, failure P2, failure P4.
  // The two P2 entries are successful.
  const FINAL_ENTRIES = [
    { id: 'P1', source: 'alert',   correct: false },
    { id: 'P2', source: 'alert',   correct: true  },
    { id: 'P3', source: 'alert',   correct: false },
    { id: 'P2', source: 'failure', correct: true  },
    { id: 'P4', source: 'failure', correct: false }
  ];

  const finalBlocks = FINAL_ENTRIES.map((d, j) => {
    const x = CX + (j - 2) * FINAL_BLOCK_SP;

    const frame = rounded(
      x,
      FINAL_BLOCK_Y,
      FINAL_BLOCK_W,
      0.73,
      d.correct ? GREEN : C.muted,
      d.correct ? GREEN : C.card,
      d.correct ? 0.20 : 0.80,
      d.correct ? 2.5 : 1.5,
      0.09
    );

    const id = text(
      d.id,
      17,
      C.ink,
      x,
      FINAL_BLOCK_Y + 0.16,
      true
    );

    const status = text(
      d.correct ? '✓' : '–',
      19,
      d.correct ? GREEN : C.muted,
      x,
      FINAL_BLOCK_Y - 0.15,
      true
    );

    const source = text(
      d.source,
      P ? 15 : 13,
      d.source === 'alert' ? AMBER : RED,
      x,
      FINAL_BLOCK_Y - 0.53,
      false,
      FINAL_BLOCK_SP - 0.08
    );

    return new M.VGroup(
      frame,
      id,
      status,
      source
    );
  });

  const finalF1 = text(
    'F1 = 2/5 = 40%',
    P ? 31 : 29,
    VIOLET,
    CX,
    P ? -2.77 : -1.84,
    true,
    RECAP_W - 0.30
  );

  const finalMeaning = text(
    'Giving particular attention to the weaker result',
    P ? 18 : 16,
    C.ink,
    CX,
    P ? -3.62 : -2.35,
    false,
    RECAP_W - 0.35
  );

  await until(S(54));
  await play(
    new M.FadeOut(summary60),
    new M.FadeOut(summary30),
    new M.FadeIn(recapFrame),
    new M.FadeIn(recapTitle),
    new M.FadeIn(finalPrecision),
    new M.FadeIn(finalRecall),
    lag(
      fadeIn(finalBlocks),
      1.4,
      0.13
    ),
    new M.FadeIn(finalF1),
    new M.FadeIn(finalMeaning),
    ...fbox([
      ['F1 = harmonic mean', VIOLET],
      'combines precision and recall',
      'leans toward the smaller result',
      ['use alongside other measures', GREEN]
    ], VIOLET),
    ...say('F1 COMBINES PRECISION AND RECALL', VIOLET)
  );

  // Hold the final picture until the narration finishes.
  await until(E(54));
}

// lesson 12.4.2
// Confusion matrices — live, narration-synchronised lesson.
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

  const THRESHOLD = 60;

  const IDS = DATA.map((_, i) => i);

  const ALERTS = IDS.filter(i => DATA[i].prob >= THRESHOLD);
  const NO_ALERTS = IDS.filter(i => DATA[i].prob < THRESHOLD);

  const FAILURES = IDS.filter(i => DATA[i].failed);
  const SAFE = IDS.filter(i => !DATA[i].failed);

  const TP = IDS.filter(i =>
    DATA[i].prob >= THRESHOLD && DATA[i].failed
  );

  const FP = IDS.filter(i =>
    DATA[i].prob >= THRESHOLD && !DATA[i].failed
  );

  const FN = IDS.filter(i =>
    DATA[i].prob < THRESHOLD && DATA[i].failed
  );

  const TN = IDS.filter(i =>
    DATA[i].prob < THRESHOLD && !DATA[i].failed
  );

  const GROUPS = [TP, FP, FN, TN];

  const CORRECT = TP.length + TN.length;
  const NEVER_ALERT_CORRECT = SAFE.length;

  // Fixed visual meanings for the entire chapter.
  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;

  // Responsive laptop / phone layout.
  const CX = P ? 0 : -2.1;

  const PILL = P
    ? [0, 2.72, 0]
    : [CX, 2.04, 0];

  const BOXP = P
    ? [0, 3.57, 0]
    : [4.30, -0.30, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function text(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(s, size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  const line = (x1, y1, x2, y2, color = C.muted, sw = 2) =>
    new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });

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

  function lag(anims, runTime = 1.2, lagRatio = 0.10) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
    });
  }

  const fadeIn = objects =>
    objects.map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.map(o => new M.FadeOut(o));

  // ------------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20;
    const lh = P ? 0.30 : 0.40;

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

    const maxw = P ? FW - 1.2 : 4.15;

    if (wd > maxw) {
      g.scale(maxw / wd);
    }

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

  // Amber bell means an alert was raised.
  // Drawn from primitives rather than an emoji.
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

  // Red filled diamond means actual failure.
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

  // Green outlined circle means no failure within ten hours.
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
  // Card helpers.
  //
  // Card components remain independent scene objects.
  // They are never regrouped after entering the scene.
  // This allows cards to move between boxes safely.
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
      Math.max(11, Math.round(19 * s)),
      C.ink,
      x - 0.16 * s,
      y + 0.32 * s,
      true
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
      Math.max(11, Math.round(19 * s)),
      BLUE,
      x,
      y - 0.36 * s,
      true
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

  // Initial grid: 4 columns × 3 rows.
  const GRID_SPX = P ? 1.48 : 1.60;
  const GRID_SPY = P ? 1.34 : 1.43;
  const GRID_TOP = P ? 1.28 : 1.08;
  const GRID_SCALE = P ? 1.00 : 1.07;

  function gridPosition(i) {
    return [
      CX + (i % 4 - 1.5) * GRID_SPX,
      GRID_TOP - Math.floor(i / 4) * GRID_SPY,
      0
    ];
  }

  const cards = DATA.map((d, i) => {
    const p = gridPosition(i);

    return {
      i,
      x: p[0],
      y: p[1],
      s: GRID_SCALE,

      base: cardBase(
        i,
        p[0],
        p[1],
        GRID_SCALE
      ),

      chance: null,
      alert: null,
      outcome: null
    };
  });

  function revealChance(i) {
    const c = cards[i];

    if (c.chance) return [];

    c.chance = chanceLabel(
      i,
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.chance)];
  }

  function addAlert(i) {
    const c = cards[i];

    if (c.alert) return [];

    c.alert = alertMark(
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.alert)];
  }

  function removeAlert(i) {
    const c = cards[i];

    if (!c.alert) return [];

    const old = c.alert;
    c.alert = null;

    return [new M.FadeOut(old)];
  }

  function revealOutcome(i) {
    const c = cards[i];

    if (c.outcome) return [];

    c.outcome = outcomeMark(
      i,
      c.x,
      c.y,
      c.s
    );

    return [new M.FadeIn(c.outcome)];
  }

  function moveCard(i, p, s = cards[i].s) {
    const c = cards[i];

    const x = p[0];
    const y = p[1];

    const anims = [
      new M.Transform(
        c.base,
        cardBase(i, x, y, s)
      )
    ];

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

    c.x = x;
    c.y = y;
    c.s = s;

    return anims;
  }

  function focus(ids, color = AMBER, part = 'base') {
    return ids
      .map(i => cards[i][part])
      .filter(Boolean)
      .map(o =>
        new M.Indicate(o, { color })
      );
  }

  // ------------------------------------------------------------
  // 0–3: Introduce the repair team and twelve pump cards.
  // ------------------------------------------------------------

  const introY = P ? -0.35 : -0.25;

  const introPump = pumpIcon(
    CX,
    introY,
    P ? 2.7 : 2.9,
    C.cyan
  );

  const introLabel = text(
    'WATER PUMPS',
    23,
    C.ink,
    CX,
    introY - 1.30
  );

  const fleet = IDS.map(i => {
    const p = gridPosition(i);

    return pumpIcon(
      p[0],
      p[1],
      P ? 0.75 : 0.80,
      C.cyan
    );
  });

  await until(S(0));
  await play(
    new M.FadeIn(introPump),
    new M.FadeIn(introLabel),
    ...say('BACK WITH THE REPAIR TEAM')
  );

  await until(S(1));
  await play(
    new M.FadeOut(introPump),
    new M.FadeOut(introLabel),
    lag(fadeIn(fleet), 1.5, 0.09),
    ...say('12 PUMPS — WHICH MIGHT FAIL?', AMBER)
  );

  await until(S(2));
  await play(
    ...say('CHANCE OF FAILURE WITHIN 10 HOURS', BLUE)
  );

  await until(S(3));
  await play(
    ...fadeOut(fleet),
    lag(
      cards.map(c => new M.FadeIn(c.base)),
      1.5,
      0.07
    ),
    ...say('ONE CARD FOR EACH PUMP')
  );

  // ------------------------------------------------------------
  // 4–9: Reveal the predicted probabilities.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...say('WRITE THE PREDICTED CHANCE', BLUE)
  );

  await until(S(5));
  await play(
    ...revealChance(0),
    ...focus([0], BLUE),
    ...say('P1: 90% CHANCE OF FAILURE', BLUE)
  );

  // Hypothetical probability illustration.
  // Blue dots represent expected failures, not observed outcomes.
  // Exactly 90 of the 100 dots are filled.
  const PROB_X = P ? 0 : 4.15;
  const PROB_Y = P ? -3.73 : -0.30;
  const DOT_SP = P ? 0.205 : 0.215;

  const probabilityDots = [];

  for (let i = 0; i < 100; i++) {
    const x = PROB_X + (i % 10 - 4.5) * DOT_SP;
    const y = PROB_Y + (4.5 - Math.floor(i / 10)) * DOT_SP;

    const color = i < 90 ? BLUE : C.muted;

    probabilityDots.push(
      circle(
        x,
        y,
        0.066,
        color,
        i < 90 ? 0.92 : 0,
        1.2
      )
    );
  }

  const probabilityTitle = text(
    '100 similar situations',
    17,
    C.ink,
    PROB_X,
    PROB_Y + 1.16
  );

  const probabilityCaption = text(
    'About 90 expected failures',
    17,
    BLUE,
    PROB_X,
    PROB_Y - 1.20,
    false,
    P ? 6.6 : 4.0
  );

  const probabilityPicture = new M.VGroup(
    ...probabilityDots,
    probabilityTitle,
    probabilityCaption
  );

  await until(S(6));
  await play(
    new M.FadeIn(probabilityPicture),
    ...say('90% DOES NOT MEAN CERTAINTY', BLUE)
  );

  await until(S(7));
  await play(
    new M.FadeOut(probabilityPicture),
    ...revealChance(1),
    ...revealChance(2),
    ...focus([1, 2], BLUE),
    ...say('P2 AND P3: 60% EACH', BLUE)
  );

  await until(S(8));
  await play(
    lag(
      [3, 4, 5].flatMap(i => revealChance(i)),
      1.2,
      0.20
    ),
    ...say('P4, P5, P6: 30% EACH', BLUE)
  );

  await until(S(9));
  await play(
    lag(
      [6, 7, 8, 9, 10, 11].flatMap(i =>
        revealChance(i)
      ),
      1.5,
      0.10
    ),
    ...say('REMAINING SIX: 10% EACH', BLUE)
  );

  // ------------------------------------------------------------
  // 10–14: Turn probabilities into a decision rule.
  //
  // Arrange cards in probability bands. The amber boundary
  // separates probabilities >= 60% from probabilities < 60%.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    lag(
      focus(IDS, BLUE, 'chance'),
      1.5,
      0.06
    ),
    ...say('CHANCES ALONE ARE NOT DECISIONS')
  );

  await until(S(11));
  await play(
    ...say('WHICH PUMPS NEED ATTENTION?', AMBER)
  );

  await until(S(12));
  await play(
    ...fbox([
      ['60% or more: alert', AMBER],
      ['below 60%: no alert', C.muted]
    ], AMBER),
    ...say('RAISE AN ALERT AT 60% OR MORE', AMBER)
  );

  const PROB_GROUPS = [
    [0],
    [1, 2],
    [3, 4, 5],
    [6, 7, 8, 9, 10, 11]
  ];

  const BAND_Y = P
    ? [1.45, 0.25, -1.22, -2.62]
    : [1.08, 0.03, -1.14, -2.25];

  const BAND_SCALE = P ? 0.82 : 0.82;
  const BAND_SP = P ? 1.10 : 1.13;

  const CUT_Y = P ? -0.48 : -0.56;

  function probabilityBandPosition(groupIndex, j) {
    const n = PROB_GROUPS[groupIndex].length;

    return [
      CX + (j - (n - 1) / 2) * BAND_SP,
      BAND_Y[groupIndex],
      0
    ];
  }

  const thresholdLine = new M.DashedLine({
    start: [CX - 3.38, CUT_Y, 0],
    end: [CX + 2.48, CUT_Y, 0],
    color: AMBER,
    strokeWidth: 3
  });

  const thresholdTag = pill(
    '60%',
    AMBER,
    16
  );

  thresholdTag.moveTo([
    CX + 2.94,
    CUT_Y,
    0
  ]);

  await until(S(13));

  const bandMoves = [];

  PROB_GROUPS.forEach((ids, g) => {
    ids.forEach((i, j) => {
      bandMoves.push(
        ...moveCard(
          i,
          probabilityBandPosition(g, j),
          BAND_SCALE
        )
      );
    });
  });

  await play(
    ...bandMoves,
    new M.Create(thresholdLine),
    new M.FadeIn(thresholdTag),
    ...say('THE 60% DECISION BOUNDARY', AMBER)
  );

  await until(S(14));
  await play(
    new M.Indicate(thresholdTag, {
      color: AMBER
    }),
    ...fbox([
      ['threshold = decision boundary', AMBER],
      'alert if chance ≥ 60%'
    ], AMBER),
    ...say('THIS BOUNDARY IS THE THRESHOLD', AMBER)
  );

  // ------------------------------------------------------------
  // 15–16: Show alert decisions.
  // Amber bell and outline always mean alert.
  // ------------------------------------------------------------

  await until(S(15));
  await play(
    lag(
      ALERTS.flatMap(i => addAlert(i)),
      1.5,
      0.20
    ),
    ...fbox([
      ['alerts: P1, P2, P3', AMBER],
      ['3 alerts', AMBER]
    ], AMBER),
    ...say('THREE PUMPS RECEIVE BELLS', AMBER)
  );

  await until(S(16));
  await play(
    lag(
      focus(NO_ALERTS, C.muted),
      1.2,
      0.07
    ),
    ...fbox([
      ['alerts     = 3', AMBER],
      ['no alerts  = 9', C.ink]
    ], AMBER),
    ...say('NINE PUMPS RECEIVE NO ALERT', C.muted)
  );

  // ------------------------------------------------------------
  // 17–20: Reveal actual outcomes after ten hours.
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...fbox([
      ['10 hours later', WHITE]
    ], C.cyan),
    ...say('TEN HOURS HAVE PASSED', WHITE)
  );

  await until(S(18));
  await play(
    ...say('WHAT ACTUALLY HAPPENED?', WHITE)
  );

  await until(S(19));
  await play(
    lag(
      FAILURES.flatMap(i => revealOutcome(i)),
      1.3,
      0.25
    ),
    ...focus(FAILURES, RED),
    ...fbox([
      ['P2 and P4 failed', RED],
      ['red diamond = failure', RED]
    ], RED),
    ...say('TWO REAL FAILURES', RED)
  );

  await until(S(20));
  await play(
    lag(
      SAFE.flatMap(i => revealOutcome(i)),
      1.7,
      0.08
    ),
    ...fbox([
      ['2 failed', RED],
      ['10 did not fail', GREEN],
      'within the next 10 hours'
    ], GREEN),
    ...say('GREEN CIRCLE = NO FAILURE', GREEN)
  );

  // ------------------------------------------------------------
  // 21: Compare alert decisions against actual outcomes.
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    ...say('DID OUR ALERTS MATCH REALITY?', AMBER)
  );

  // ------------------------------------------------------------
  // Sorting layout.
  //
  // Laptop: unsorted cards on the left, four boxes on the right.
  // Phone: unsorted cards above four boxes.
  //
  // Box order at this stage follows narration:
  // 0 = correct alerts
  // 1 = false alarms
  // 2 = missed failures
  // 3 = correctly left alone
  // ------------------------------------------------------------

  const SORT_W = P ? 3.25 : 3.30;
  const SORT_H = P ? 2.03 : 2.02;

  // Same arrangement as the confusion matrix later (rows = what happened):
  // correct alerts top-left, missed failures top-right,
  // false alarms bottom-left, correctly left alone bottom-right.
  const SORT_X = P
    ? [-1.78, -1.78, 1.78, 1.78]
    : [-0.05, -0.05, 3.48, 3.48];

  const SORT_Y = P
    ? [-1.49, -3.75, -1.49, -3.75]
    : [0.60, -1.64, 0.60, -1.64];

  const SORT_LAYOUT = GROUPS.map((_, g) => ({
    x: SORT_X[g],
    y: SORT_Y[g],
    w: SORT_W,
    h: SORT_H
  }));

  const GROUP_COLORS = [
    GREEN,
    AMBER,
    RED,
    GREEN
  ];

  function stagingPosition(i) {
    if (P) {
      return [
        (i % 6 - 2.5) * 1.06,
        1.57 - Math.floor(i / 6) * 0.97,
        0
      ];
    }

    return [
      -4.64 + (i % 3 - 1) * 1.08,
      1.16 - Math.floor(i / 3) * 1.08,
      0
    ];
  }

  const STAGING_SCALE = P ? 0.76 : 0.76;

  function binFrame(spec, color = C.muted) {
    const r = rounded(
      spec.x,
      spec.y,
      spec.w,
      spec.h,
      color,
      C.card,
      0,
      2,
      0.15
    );

    return r;
  }

  function binLabel(spec, label, color) {
    return text(
      label,
      P ? 15 : 16,
      color,
      spec.x,
      spec.y + spec.h / 2 - 0.23,
      false,
      spec.w - 0.25
    );
  }

  let bins = SORT_LAYOUT.map((spec, g) => ({
    spec,
    frame: binFrame(spec),
    label: binLabel(
      spec,
      `BOX ${g + 1}`,
      C.muted
    )
  }));

  function setBinLabel(g, label, color) {
    const b = bins[g];

    const newLabel = binLabel(
      b.spec,
      label,
      color
    );

    const newFrame = binFrame(
      b.spec,
      color
    );

    const anims = [
      new M.FadeOut(b.frame),
      new M.Create(newFrame),
      new M.FadeOut(b.label),
      new M.FadeIn(newLabel)
    ];

    b.frame = newFrame;
    b.label = newLabel;

    return anims;
  }

  // Position a card inside a box.
  // Up to 8 cards: at most 4 columns.
  // 10 cards in the never-alert example: 5 columns × 2 rows.
  function binSlot(spec, j, n) {
    const cols = n > 8
      ? 5
      : Math.min(n, 4);

    const rows = Math.ceil(n / cols);

    const s = n > 8
      ? 0.48
      : 0.60;

    const pitchX = n > 8
      ? 0.62
      : 0.79;

    const pitchY = n > 8
      ? 0.68
      : 0.73;

    const row = Math.floor(j / cols);
    const col = j % cols;

    const rowCount = Math.min(
      cols,
      n - row * cols
    );

    const x =
      spec.x + (col - (rowCount - 1) / 2) * pitchX;

    const centerY = spec.y - 0.17;

    const y =
      centerY + ((rows - 1) / 2 - row) * pitchY;

    return {
      p: [x, y, 0],
      s
    };
  }

  function moveIntoBin(g, ids, layout = SORT_LAYOUT) {
    const spec = layout[g];

    return ids.flatMap((i, j) => {
      const slot = binSlot(
        spec,
        j,
        ids.length
      );

      return moveCard(
        i,
        slot.p,
        slot.s
      );
    });
  }

  // ------------------------------------------------------------
  // 22: Draw four empty boxes.
  // ------------------------------------------------------------

  await until(S(22));

  const stagingMoves = IDS.flatMap(i =>
    moveCard(
      i,
      stagingPosition(i),
      STAGING_SCALE
    )
  );

  await play(
    new M.FadeOut(thresholdLine),
    new M.FadeOut(thresholdTag),
    ...clearBox(),
    ...stagingMoves,
    lag(
      bins.flatMap(b => [
        new M.Create(b.frame),
        new M.FadeIn(b.label)
      ]),
      1.3,
      0.10
    ),
    ...say('SORT THE 12 CARDS INTO FOUR BOXES')
  );

  // ------------------------------------------------------------
  // 23–25: Pump 2 — a correct alert.
  // ------------------------------------------------------------

  await until(S(23));
  await play(
    ...focus([1], AMBER),
    ...say('LOOK AT PUMP 2', AMBER)
  );

  await until(S(24));
  await play(
    ...focus([1], AMBER, 'alert'),
    ...focus([1], RED, 'outcome'),
    ...say('BELL + DIAMOND: ALERT AND FAILURE', GREEN)
  );

  await until(S(25));
  await play(
    ...moveIntoBin(0, TP),
    ...setBinLabel(
      0,
      `CORRECT ALERTS · ${TP.length}`,
      GREEN
    ),
    ...say('CORRECT ALERT', GREEN)
  );

  // ------------------------------------------------------------
  // 26–27: Pumps 1 and 3 — false alarms.
  // ------------------------------------------------------------

  await until(S(26));
  await play(
    ...focus(FP, AMBER, 'alert'),
    ...focus(FP, GREEN, 'outcome'),
    ...say('P1 AND P3: ALERT BUT NO FAILURE', AMBER)
  );

  await until(S(27));
  await play(
    ...moveIntoBin(1, FP),
    ...setBinLabel(
      1,
      `FALSE ALARMS · ${FP.length}`,
      AMBER
    ),
    ...say('TWO FALSE ALARMS', AMBER)
  );

  // ------------------------------------------------------------
  // 28–29: Pump 4 — a missed failure.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...focus(FN, RED),
    ...focus(FN, RED, 'outcome'),
    ...say('P4: FAILURE BUT NO BELL', RED)
  );

  await until(S(29));
  await play(
    ...moveIntoBin(2, FN),
    ...setBinLabel(
      2,
      `MISSED FAILURES · ${FN.length}`,
      RED
    ),
    ...say('ONE MISSED FAILURE', RED)
  );

  // ------------------------------------------------------------
  // 30–31: Pumps 5–12 — correctly left alone.
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    lag(
      focus(TN, GREEN, 'outcome'),
      1.5,
      0.09
    ),
    ...say('NO ALERT AND NO FAILURE', GREEN)
  );

  await until(S(31));
  await play(
    ...moveIntoBin(3, TN),
    ...setBinLabel(
      3,
      `CORRECTLY LEFT ALONE · ${TN.length}`,
      GREEN
    ),
    ...say('EIGHT CORRECT NO-ALERT DECISIONS', GREEN)
  );

  // ------------------------------------------------------------
  // 32: Every pump appears exactly once.
  // ------------------------------------------------------------

  await until(S(32));
  await play(
    lag(
      bins.map(b =>
        new M.Indicate(b.label, {
          color: C.cyan
        })
      ),
      1.6,
      0.20
    ),
    ...say('1 + 2 + 1 + 8 = 12 PUMPS')
  );

  // ------------------------------------------------------------
  // 33–39: Statistical names for the four outcomes.
  // ------------------------------------------------------------

  await until(S(33));
  await play(
    ...say('FOUR STATISTICAL NAMES')
  );

  await until(S(34));
  await play(
    lag(
      [
        new M.Indicate(bins[0].label, {
          color: AMBER
        }),
        new M.Indicate(bins[1].label, {
          color: AMBER
        }),
        new M.Indicate(bins[2].label, {
          color: C.muted
        }),
        new M.Indicate(bins[3].label, {
          color: C.muted
        })
      ],
      2.6,
      0.30
    ),
    ...say('POSITIVE = ALERT; NEGATIVE = NO ALERT')
  );

  await until(S(35));
  await play(
    lag(
      [
        new M.Indicate(bins[0].label, {
          color: GREEN
        }),
        new M.Indicate(bins[3].label, {
          color: GREEN
        }),
        new M.Indicate(bins[1].label, {
          color: AMBER
        }),
        new M.Indicate(bins[2].label, {
          color: RED
        })
      ],
      2.2,
      0.25
    ),
    ...say('TRUE = CORRECT; FALSE = WRONG')
  );

  const TECH_NAMES = [
    'TRUE POSITIVE',
    'FALSE POSITIVE',
    'FALSE NEGATIVE',
    'TRUE NEGATIVE'
  ];

  const ABBR = ['TP', 'FP', 'FN', 'TN'];

  function technicalLabel(g, n) {
    return `${TECH_NAMES[g]} (${ABBR[g]}) · ${n}`;
  }

  await until(S(36));
  await play(
    ...setBinLabel(
      0,
      technicalLabel(0, TP.length),
      GREEN
    ),
    ...focus(TP, GREEN),
    ...say('TRUE POSITIVE: 1', GREEN)
  );

  await until(S(37));
  await play(
    ...setBinLabel(
      1,
      technicalLabel(1, FP.length),
      AMBER
    ),
    ...focus(FP, AMBER),
    ...say('FALSE POSITIVES: 2', AMBER)
  );

  await until(S(38));
  await play(
    ...setBinLabel(
      2,
      technicalLabel(2, FN.length),
      RED
    ),
    ...focus(FN, RED),
    ...say('FALSE NEGATIVE: 1', RED)
  );

  await until(S(39));
  await play(
    ...setBinLabel(
      3,
      technicalLabel(3, TN.length),
      GREEN
    ),
    ...focus(TN, GREEN),
    ...say('TRUE NEGATIVES: 8', GREEN)
  );

  // ------------------------------------------------------------
  // Confusion matrix layout.
  //
  // Rows = actual outcomes.
  // Columns = predicted outcomes / alert decisions.
  //
  //                      ALERT       NO ALERT
  // ACTUALLY FAILED        TP            FN
  // DID NOT FAIL           FP            TN
  //
  // Logical group indices remain [TP, FP, FN, TN].
  // The physical positions change to [TP, FN / FP, TN].
  // ------------------------------------------------------------

  const MATRIX_W = P ? 3.00 : 3.24;
  const MATRIX_H = P ? 2.30 : 2.02;

  const MATRIX_LEFT = P ? -1.15 : -3.65;
  const MATRIX_RIGHT = P ? 1.95 : -0.27;

  const MATRIX_TOP = P ? 0.50 : 0.29;
  const MATRIX_BOTTOM = P ? -1.97 : -1.83;

  const MATRIX_LAYOUT = [
    {
      x: MATRIX_LEFT,
      y: MATRIX_TOP,
      w: MATRIX_W,
      h: MATRIX_H
    },
    {
      x: MATRIX_LEFT,
      y: MATRIX_BOTTOM,
      w: MATRIX_W,
      h: MATRIX_H
    },
    {
      x: MATRIX_RIGHT,
      y: MATRIX_TOP,
      w: MATRIX_W,
      h: MATRIX_H
    },
    {
      x: MATRIX_RIGHT,
      y: MATRIX_BOTTOM,
      w: MATRIX_W,
      h: MATRIX_H
    }
  ];

  function replaceBins(layout, groups) {
    const old = bins;

    const next = layout.map((spec, g) => ({
      spec,
      frame: binFrame(
        spec,
        GROUP_COLORS[g]
      ),
      label: binLabel(
        spec,
        technicalLabel(g, groups[g].length),
        GROUP_COLORS[g]
      )
    }));

    bins = next;

    return [
      ...fadeOut(
        old.flatMap(b => [
          b.frame,
          b.label
        ])
      ),
      ...next.map(b => new M.Create(b.frame)),
      ...fadeIn(next.map(b => b.label))
    ];
  }

  function matrixMoves(groups) {
    return groups.flatMap((ids, g) =>
      moveIntoBin(
        g,
        ids,
        MATRIX_LAYOUT
      )
    );
  }

  // ------------------------------------------------------------
  // 40: Arrange the four outcomes into a 2 × 2 matrix.
  // ------------------------------------------------------------

  await until(S(40));
  await play(
    ...replaceBins(MATRIX_LAYOUT, GROUPS),
    ...matrixMoves(GROUPS),
    ...say('TWO ROWS AND TWO COLUMNS')
  );

  // ------------------------------------------------------------
  // Matrix headings.
  // Text and symbols identify the axes without relying on colour.
  // ------------------------------------------------------------

  const COLUMN_Y = MATRIX_TOP + MATRIX_H / 2 + 0.25;
  const ROW_X = P ? -3.25 : -5.83;

  const predictedAlertHeader = text(
    'PREDICTED: ALERT',
    P ? 15 : 16,
    AMBER,
    MATRIX_LEFT,
    COLUMN_Y,
    false,
    MATRIX_W - 0.1
  );

  const predictedQuietHeader = text(
    'PREDICTED: NO ALERT',
    P ? 15 : 16,
    C.ink,
    MATRIX_RIGHT,
    COLUMN_Y,
    false,
    MATRIX_W - 0.1
  );

  const actualHeader = text(
    'ACTUAL',
    P ? 15 : 14,
    WHITE,
    ROW_X,
    COLUMN_Y,
    true,
    P ? 1.3 : 1.1
  );

  const failedRowIcon = failureIcon(
    ROW_X,
    MATRIX_TOP + 0.25,
    0.95
  );

  const failedRowLabel = text(
    'FAILED',
    P ? 15 : 14,
    RED,
    ROW_X,
    MATRIX_TOP - 0.05,
    true,
    P ? 1.3 : 1.1
  );

  const safeRowIcon = safeIcon(
    ROW_X,
    MATRIX_BOTTOM + 0.32,
    0.95
  );

  const safeRowLabel1 = text(
    'DID NOT',
    P ? 15 : 14,
    GREEN,
    ROW_X,
    MATRIX_BOTTOM + 0.02,
    true,
    P ? 1.3 : 1.1
  );

  const safeRowLabel2 = text(
    'FAIL',
    P ? 15 : 14,
    GREEN,
    ROW_X,
    MATRIX_BOTTOM - 0.20,
    true,
    P ? 1.3 : 1.1
  );

  const matrixHeaders = [
    predictedAlertHeader,
    predictedQuietHeader,
    actualHeader,
    failedRowIcon,
    failedRowLabel,
    safeRowIcon,
    safeRowLabel1,
    safeRowLabel2
  ];

  // ------------------------------------------------------------
  // 41–43: Read the matrix.
  // ------------------------------------------------------------

  await until(S(41));
  await play(
    ...fadeIn(matrixHeaders),
    ...say('ROWS: ACTUAL · COLUMNS: PREDICTED')
  );

  await until(S(42));
  await play(
    ...fbox([
      ['confusion matrix', C.cyan],
      'four kinds of decisions'
    ]),
    ...say('THIS IS A CONFUSION MATRIX')
  );

  await until(S(43));
  await play(
    new M.Indicate(bins[1].label, {
      color: AMBER
    }),
    new M.Indicate(bins[2].label, {
      color: RED
    }),
    ...fbox([
      ['false alarms: 2', AMBER],
      ['missed failures: 1', RED]
    ], AMBER),
    ...say('NOT JUST HOW OFTEN — BUT HOW WRONG')
  );

  // ------------------------------------------------------------
  // 44–45: Count correct decisions.
  // ------------------------------------------------------------

  await until(S(44));
  await play(
    new M.Indicate(bins[0].label, {
      color: GREEN
    }),
    new M.Indicate(bins[3].label, {
      color: GREEN
    }),
    ...fbox([
      ['correct decisions', GREEN],
      `TP + TN = ${TP.length} + ${TN.length}`,
      [`= ${CORRECT}`, GREEN]
    ], GREEN),
    ...say('CORRECT DECISIONS: 1 + 8 = 9', GREEN)
  );

  await until(S(45));
  await play(
    ...fbox([
      ['correct decisions', GREEN],
      [`${CORRECT} out of ${DATA.length}`, GREEN]
    ], GREEN),
    ...say('9 OF 12 DECISIONS ARE CORRECT', GREEN)
  );

  // ------------------------------------------------------------
  // 46–50: Counterexample — a tool that never raises an alert.
  //
  // Actual outcomes do not change.
  // Only the predicted decisions change.
  //
  // TP = 0, FP = 0, FN = 2, TN = 10.
  // ------------------------------------------------------------

  const NEVER_GROUPS = [
    [],
    [],
    FAILURES.slice(),
    SAFE.slice()
  ];

  await until(S(46));
  await play(
    ...fbox([
      ['another tool', C.cyan],
      ['never raises an alert', AMBER]
    ], AMBER),
    ...say('WHAT IF THE TOOL NEVER ALERTS?', AMBER)
  );

  await until(S(47));

  const removeBells = ALERTS.flatMap(i =>
    removeAlert(i)
  );

  const neverMoves = matrixMoves(NEVER_GROUPS);

  const neverLabels = NEVER_GROUPS.flatMap((ids, g) =>
    setBinLabel(
      g,
      technicalLabel(g, ids.length),
      GROUP_COLORS[g]
    )
  );

  await play(
    ...removeBells,
    ...neverMoves,
    ...neverLabels,
    ...fbox([
      ['never-alert tool', C.cyan],
      [`correct = 0 + ${NEVER_ALERT_CORRECT}`, GREEN],
      [`${NEVER_ALERT_CORRECT} out of 12 correct`, GREEN]
    ], GREEN),
    ...say('10 OF 12 DECISIONS ARE CORRECT', GREEN)
  );

  await until(S(48));
  await play(
    new M.Indicate(bins[2].label, {
      color: RED
    }),
    ...fbox([
      ['original tool: 9 correct', BLUE],
      ['never-alert tool: 10 correct', C.ink],
      ['but what was missed?', RED]
    ], RED),
    ...say('10 SOUNDS BETTER THAN 9...', AMBER)
  );

  await until(S(49));
  await play(
    ...focus(FAILURES, RED, 'outcome'),
    new M.Indicate(bins[2].label, {
      color: RED
    }),
    ...fbox([
      ['real failures: 2', RED],
      ['caught: 0', C.muted],
      ['missed: 2', RED]
    ], RED),
    ...say('BOTH REAL FAILURES WERE MISSED', RED)
  );

  await until(S(50));
  await play(
    ...fbox([
      ['10 correct decisions', GREEN],
      ['0 failures caught', RED],
      ['a high count can mislead', AMBER]
    ], AMBER),
    ...say('CORRECT DECISIONS ALONE CAN MISLEAD', AMBER)
  );

  // ------------------------------------------------------------
  // 51: Restore the original 60% threshold confusion matrix.
  // ------------------------------------------------------------

  await until(S(51));

  const restoreMoves = matrixMoves(GROUPS);

  // moveCard has already recorded the destination positions.
  // Create the returning bells at those destinations.
  const restoreBells = ALERTS.flatMap(i =>
    addAlert(i)
  );

  const restoreLabels = GROUPS.flatMap((ids, g) =>
    setBinLabel(
      g,
      technicalLabel(g, ids.length),
      GROUP_COLORS[g]
    )
  );

  await play(
    ...restoreMoves,
    ...restoreBells,
    ...restoreLabels,
    ...fbox([
      ['original threshold: 60%', AMBER],
      'understand each kind of mistake'
    ], C.cyan),
    ...say('USE THE WHOLE CONFUSION MATRIX')
  );

  // ------------------------------------------------------------
  // 52: Final recap — four kinds of decisions.
  // ------------------------------------------------------------

  await until(S(52));
  await play(
    lag(
      [
        new M.Indicate(bins[0].label, {
          color: GREEN
        }),
        new M.Indicate(bins[1].label, {
          color: AMBER
        }),
        new M.Indicate(bins[2].label, {
          color: RED
        }),
        new M.Indicate(bins[3].label, {
          color: GREEN
        })
      ],
      4.0,
      0.45
    ),
    ...fbox([
      ['TP: 1 correct alert', GREEN],
      ['FP: 2 false alarms', AMBER],
      ['FN: 1 missed failure', RED],
      ['TN: 8 correctly left alone', GREEN]
    ], C.cyan),
    ...say('FOUR COUNTS TELL FOUR STORIES')
  );

  // ------------------------------------------------------------
  // 53: Prepare for sensitivity and specificity.
  //
  // Highlight actual-outcome rows rather than introducing
  // the next lesson's formulas prematurely.
  // ------------------------------------------------------------

  await until(S(53));
  await play(
    lag(
      [
        new M.Indicate(failedRowIcon, {
          color: RED
        }),
        new M.Indicate(bins[0].label, {
          color: GREEN
        }),
        new M.Indicate(bins[2].label, {
          color: RED
        }),
        new M.Indicate(safeRowIcon, {
          color: GREEN
        }),
        new M.Indicate(bins[1].label, {
          color: AMBER
        }),
        new M.Indicate(bins[3].label, {
          color: GREEN
        })
      ],
      3.3,
      0.22
    ),
    ...fbox([
      ['NEXT', C.cyan],
      ['how well do we catch failures?', RED],
      ['how well do we avoid false alarms?', GREEN]
    ], C.cyan),
    ...say('NEXT: SENSITIVITY AND SPECIFICITY')
  );

  // Hold the completed confusion matrix until narration ends.
  await until(E(53));
}

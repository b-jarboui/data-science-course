// lesson 12.4.8
// Probability calibration — live, narration-synchronised lesson.
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

  const FAILURES = IDS.filter(i =>
    DATA[i].failed
  );

  const SAFE = IDS.filter(i =>
    !DATA[i].failed
  );

  const PROBABILITIES = [10, 30, 60, 90];

  const GROUPS = PROBABILITIES.map(prob => {
    const ids = IDS.filter(i =>
      DATA[i].prob === prob
    );

    const failures = ids.filter(i =>
      DATA[i].failed
    );

    return {
      prob,
      ids,
      failures,
      n: ids.length,
      count: failures.length,
      rate: failures.length / ids.length
    };
  });

  const G10 = GROUPS[0];
  const G30 = GROUPS[1];
  const G60 = GROUPS[2];
  const G90 = GROUPS[3];

  const CALIBRATION_POINTS = GROUPS.map(g => [
    g.prob,
    g.rate * 100
  ]);

  // Checked calibration points:
  //
  // Predicted     Failures     Group size     Observed
  //    10%            0             6            0%
  //    30%            1             3           33.333...%
  //    60%            1             2           50%
  //    90%            0             1            0%
  //
  // Plot coordinates are:
  // (10, 0), (30, 100/3), (60, 50), (90, 0).
  //
  // Exact fractions determine the graph geometry.
  // Rounded percentages are used only in text labels.
  //
  // There is no alert threshold in the calibration calculation.
  // Group by predicted probability, not alert decision.

  const pct = v =>
    `${Math.round(v * 100)}%`;

  function observedLabel(v) {
    const p = v * 100;

    return Number.isInteger(p)
      ? `${p}%`
      : `≈ ${Math.round(p)}%`;
  }

  function observedEquation(g) {
    const exact = Number.isInteger(
      g.rate * 100
    );

    return `${g.count}/${g.n} ${exact ? '=' : '≈'} ${pct(g.rate)}`;
  }

  // ------------------------------------------------------------
  // Fixed chapter visual meanings.
  // ------------------------------------------------------------

  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;
  const VIOLET = C.violet || '#A78BFA';

  // ------------------------------------------------------------
  // Responsive laptop / phone layout.
  //
  // Laptop:
  //   main picture on the left;
  //   formula box and numerical explanations on the right.
  //
  // Phone:
  //   formula box at the top;
  //   pill below it;
  //   main picture in the available lower area.
  //
  // During the calibration plot:
  //   laptop: plot left, group summary right;
  //   phone: group summary above plot.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
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

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
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

  function arrow(
    x1, y1, x2, y2,
    color,
    head = 0.13,
    sw = 2.5
  ) {
    const angle = Math.atan2(
      y2 - y1,
      x2 - x1
    );

    const a = angle + Math.PI * 0.82;
    const b = angle - Math.PI * 0.82;

    return new M.VGroup(
      line(
        x1, y1, x2, y2,
        color, sw
      ),

      line(
        x2,
        y2,
        x2 + head * Math.cos(a),
        y2 + head * Math.sin(a),
        color,
        sw
      ),

      line(
        x2,
        y2,
        x2 + head * Math.cos(b),
        y2 + head * Math.sin(b),
        color,
        sw
      )
    );
  }

  function lag(
    anims,
    runTime = 1.2,
    lagRatio = 0.12
  ) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
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
    const size = P ? 21 : 20;
    const lh = P ? 0.34 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.38;

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
      position[0] - wd / 2 + 0.35;

    const top =
      position[1] + ht / 2 - 0.19 - lh / 2;

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

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = maxWidth === null
      ? (P ? FW - 1.2 : 4.10)
      : maxWidth;

    const maxh = P ? 1.34 : 2.40;

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

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Shared chapter icon language.
  // ------------------------------------------------------------

  // Water pump: motor, pump housing, inlet, outlet and feet.
  function pumpIcon(
    x,
    y,
    s = 1,
    color = C.cyan
  ) {
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

  function clockIcon(
    x,
    y,
    s = 1,
    color = WHITE
  ) {
    const face = circle(
      x,
      y,
      0.32 * s,
      color,
      0,
      2.5
    );

    const hand1 = line(
      x,
      y,
      x,
      y + 0.20 * s,
      color,
      2.5
    );

    const hand2 = line(
      x,
      y,
      x + 0.16 * s,
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
  // The base, probability and outcome remain independent
  // scene objects.
  //
  // No already-visible objects are wrapped in new groups.
  // No amber alert bells are used: calibration does not depend
  // on the alert cutoff.
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

  const cards = DATA.map((d, i) => ({
    i,

    x: 0,
    y: 0,
    s: 1,

    visible: false,
    hasChance: false,
    hasOutcome: false,

    base: null,
    chance: null,
    outcome: null
  }));

  function cardObjects(c) {
    return [
      c.base,
      c.chance,
      c.outcome
    ].filter(Boolean);
  }

  function placeCard(c, p, s = 1) {
    const x = p[0];
    const y = p[1];

    const anims = [];

    if (!c.visible) {
      c.base = cardBase(
        c.i,
        x,
        y,
        s
      );

      c.chance = c.hasChance
        ? chanceLabel(c.i, x, y, s)
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

    const anims = fadeOut(
      cardObjects(c)
    );

    c.visible = false;

    c.base = null;
    c.chance = null;
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

  function focus(
    ids,
    color = BLUE,
    part = 'base',
    runTime = 0.85
  ) {
    return ids
      .map(i => cards[i][part])
      .filter(Boolean)
      .map(o =>
        new M.Indicate(o, {
          color,
          runTime
        })
      );
  }

  function cardOutline(
    i,
    color = BLUE,
    pad = 0.10
  ) {
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

  function clearHighlights() {
    const anims = fadeOut(
      cardHighlights
    );

    cardHighlights = [];

    return anims;
  }

  function highlightCards(
    ids,
    color = BLUE,
    pad = 0.10
  ) {
    const old = clearHighlights();

    cardHighlights = ids.map(i =>
      cardOutline(
        i,
        color,
        pad
      )
    );

    return [
      ...old,
      ...cardHighlights.map(o =>
        new M.Create(o)
      )
    ];
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

  function showGrid() {
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
  // 0–3: Introduce the practical question.
  //
  // A predicted probability helps a repair team prepare for
  // the coming ten hours, but the probability itself must
  // be trustworthy.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.25 : -0.25;

  const introPump = pumpIcon(
    CX,
    INTRO_Y + 0.30,
    P ? 2.70 : 2.50,
    C.cyan
  );

  const introClock = clockIcon(
    CX - 2.40,
    INTRO_Y + 0.55,
    1.30,
    WHITE
  );

  const introTime = text(
    '10 HOURS',
    18,
    WHITE,
    CX - 2.40,
    INTRO_Y - 0.12,
    true
  );

  const introTitle = text(
    'REPAIR TEAM',
    22,
    WHITE,
    CX,
    INTRO_Y - 1.02,
    true
  );

  const introProbability = pill(
    '30% CHANCE OF FAILURE',
    BLUE,
    20
  );

  introProbability.moveTo([
    CX,
    P ? -2.05 : -1.78,
    0
  ]);

  const sparePump = pumpIcon(
    CX + 2.38,
    INTRO_Y + 0.36,
    1.15,
    AMBER
  );

  const spareLabel = text(
    'REPLACEMENT',
    P ? 15 : 14,
    AMBER,
    CX + 2.38,
    INTRO_Y - 0.32,
    true,
    1.75
  );

  const spareFrame = rounded(
    CX + 2.38,
    INTRO_Y + 0.15,
    1.85,
    1.68,
    AMBER,
    C.card,
    0,
    2,
    0.12
  );

  await until(S(0));
  await play(
    new M.FadeIn(introPump),
    new M.FadeIn(introClock),
    new M.FadeIn(introTime),
    new M.FadeIn(introTitle),
    ...say('PLAN THE NEXT 10 HOURS')
  );

  await until(S(1));
  await play(
    new M.FadeIn(introProbability),
    ...fbox([
      ['Tool A predicts', BLUE],
      ['30% chance of failure', BLUE],
      'within the next 10 hours'
    ], BLUE),
    ...say('PREDICTED FAILURE CHANCE: 30%', BLUE)
  );

  await until(S(2));
  await play(
    new M.Create(spareFrame),
    new M.FadeIn(sparePump),
    new M.FadeIn(spareLabel),
    ...say('SHOULD WE PREPARE A REPLACEMENT?', AMBER)
  );

  await until(S(3));
  await play(
    new M.Indicate(
      introProbability,
      { color: BLUE }
    ),
    ...fbox([
      ['can we trust this number?', AMBER],
      'does 30% really mean 30%?'
    ], AMBER),
    ...say('HOW TRUSTWORTHY IS THE PREDICTED CHANCE?', AMBER)
  );

  // ------------------------------------------------------------
  // 4: Bring back the twelve numbered pump cards.
  // ------------------------------------------------------------

  await until(S(4));
  await play(
    ...fadeOut([
      introPump,
      introClock,
      introTime,
      introTitle,
      introProbability,
      spareFrame,
      sparePump,
      spareLabel
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
  // 5–8: Reveal Tool A's predicted probabilities.
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    ...revealChance(cards[0]),
    ...focus([0], BLUE),
    ...say('P1: 90% CHANCE OF FAILURE', BLUE)
  );

  await until(S(6));
  await play(
    ...revealChance(cards[1]),
    ...revealChance(cards[2]),
    ...focus([1, 2], BLUE),
    ...say('P2 AND P3: 60% EACH', BLUE)
  );

  await until(S(7));
  await play(
    lag(
      [3, 4, 5].flatMap(i =>
        revealChance(cards[i])
      ),
      1.20,
      0.18
    ),
    ...say('P4, P5 AND P6: 30% EACH', BLUE)
  );

  await until(S(8));
  await play(
    lag(
      [6, 7, 8, 9, 10, 11].flatMap(i =>
        revealChance(cards[i])
      ),
      1.40,
      0.10
    ),
    ...say('THE REMAINING SIX: 10% EACH', BLUE)
  );

  // ------------------------------------------------------------
  // 9–10: Reveal the actual outcomes.
  // ------------------------------------------------------------

  await until(S(9));
  await play(
    ...focus(FAILURES, RED),
    ...fbox([
      ['10 hours later', WHITE],
      ['P2 and P4 actually failed', RED]
    ], RED),
    ...say('P2 AND P4 ACTUALLY FAIL', RED)
  );

  await until(S(10));
  await play(
    ...FAILURES.flatMap(i =>
      revealOutcome(cards[i])
    ),
    lag(
      SAFE.flatMap(i =>
        revealOutcome(cards[i])
      ),
      1.50,
      0.08
    ),
    ...fbox([
      ['red diamond = real failure', RED],
      ['green circle = no failure', GREEN]
    ]),
    ...say('2 REAL FAILURES · 10 NON-FAILURES')
  );

  // ------------------------------------------------------------
  // Hypothetical larger-population illustration.
  //
  // This is NOT additional observed chapter data.
  //
  // All hypothetical pumps have predicted probability 30%.
  // If the predictions are well calibrated, approximately
  // 30 out of 100 should fail in comparable situations.
  //
  // Display a 10 × 10 array.
  // Each symbol represents one hypothetical pump.
  // ------------------------------------------------------------

  const HYP_X = CX;
  const HYP_Y = P ? -1.10 : -0.53;

  const HYP_SP = P ? 0.38 : 0.30;
  const HYP_TOP = HYP_Y + 4.5 * HYP_SP;

  const hypotheticalPositions = Array.from(
    { length: 100 },
    (_, i) => [
      HYP_X +
        (i % 10 - 4.5) * HYP_SP,

      HYP_TOP -
        Math.floor(i / 10) * HYP_SP,

      0
    ]
  );

  function hypotheticalHeading(label) {
    return text(
      label,
      P ? 19 : 18,
      BLUE,
      HYP_X,
      P ? 1.52 : 1.24,
      true,
      P ? 6.65 : 6.80
    );
  }

  const hundredHeading = hypotheticalHeading(
    '100 HYPOTHETICAL PUMPS'
  );

  const hundredSubheading = text(
    'Predicted chance: 30% each',
    18,
    BLUE,
    HYP_X,
    P ? 1.13 : 0.94,
    false,
    6.50
  );

  const unknownHundred = new M.VGroup(
    ...hypotheticalPositions.map(p =>
      circle(
        p[0],
        p[1],
        P ? 0.082 : 0.062,
        BLUE,
        0.17,
        1.5
      )
    )
  );

  // An illustrative arrangement, not a simulation result.
  // Exactly three red diamonds per row of ten.
  //
  // Their positions are deliberately arbitrary.
  const EXAMPLE_PATTERN = [1, 4, 7];

  const expectedHundred = new M.VGroup(
    ...hypotheticalPositions.map((p, i) => {
      const col = i % 10;

      const failed =
        EXAMPLE_PATTERN.includes(col);

      return failed
        ? failureIcon(
            p[0],
            p[1],
            P ? 0.80 : 0.62
          )
        : safeIcon(
            p[0],
            p[1],
            P ? 0.76 : 0.58
          );
    })
  );

  const hundredExpectedCaption = text(
    'About 30 failures out of 100',
    P ? 21 : 20,
    RED,
    HYP_X,
    P ? -3.39 : -2.29,
    true,
    6.65
  );

  const hundredIllustrativeNote = text(
    'Illustrative outcomes — not observed data',
    P ? 15 : 14,
    C.muted,
    HYP_X,
    P ? -3.83 : -2.64,
    false,
    6.50
  );

  // ------------------------------------------------------------
  // 11: Introduce the larger hypothetical group.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...hideGrid(),
    ...clearBox(),
    new M.FadeIn(hundredHeading),
    new M.FadeIn(hundredSubheading),
    new M.FadeIn(unknownHundred),
    ...say('IMAGINE MANY PUMPS WITH A 30% PREDICTION', BLUE)
  );

  // ------------------------------------------------------------
  // 12: Illustrate about thirty failures out of one hundred.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    new M.FadeOut(unknownHundred),
    new M.FadeIn(expectedHundred),
    new M.FadeIn(hundredExpectedCaption),
    new M.FadeIn(hundredIllustrativeNote),
    ...fbox([
      ['predicted chance = 30%', BLUE],
      ['about 30 failures per 100', RED],
      'if predictions are trustworthy'
    ], BLUE),
    ...say('ABOUT 30 OUT OF EVERY 100 SHOULD FAIL', RED)
  );

  // ------------------------------------------------------------
  // Ten-pump illustration.
  //
  // Use two rows of five large outcome symbols.
  // Three of the ten are red diamonds.
  //
  // A second equally plausible arrangement demonstrates that
  // the probability does not identify particular pumps.
  // ------------------------------------------------------------

  const TEN_Y = P ? -0.70 : -0.35;

  function tenSlot(i) {
    const row = Math.floor(i / 5);
    const col = i % 5;

    return [
      CX + (col - 2) * 1.03,
      TEN_Y + (0.5 - row) * 0.90,
      0
    ];
  }

  function tenPicture(failedIds) {
    const entries = Array.from(
      { length: 10 },
      (_, i) => {
        const p = tenSlot(i);

        const frame = rounded(
          p[0],
          p[1],
          0.83,
          0.70,
          C.muted,
          C.card,
          0.85,
          1.3,
          0.08
        );

        const mark = failedIds.includes(i)
          ? failureIcon(
              p[0],
              p[1],
              1.65
            )
          : safeIcon(
              p[0],
              p[1],
              1.50
            );

        return new M.VGroup(
          frame,
          mark
        );
      }
    );

    return new M.VGroup(...entries);
  }

  const tenExampleA = tenPicture(
    [1, 4, 7]
  );

  const tenExampleB = tenPicture(
    [0, 5, 9]
  );

  const tenHeading = text(
    'ABOUT 3 OUT OF 10',
    24,
    RED,
    CX,
    P ? 0.92 : 0.94,
    true,
    6.50
  );

  const tenCaption = text(
    'One possible pattern of outcomes',
    18,
    C.muted,
    CX,
    P ? -2.00 : -1.52,
    false,
    6.60
  );

  const uncertainCaption = text(
    'Different pumps could be the ones that fail',
    17,
    AMBER,
    CX,
    P ? -2.00 : -1.52,
    false,
    6.60
  );

  // ------------------------------------------------------------
  // 13: Reduce 30/100 to 3/10.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...fadeOut([
      hundredHeading,
      hundredSubheading,
      expectedHundred,
      hundredExpectedCaption,
      hundredIllustrativeNote
    ]),
    new M.FadeIn(tenHeading),
    new M.FadeIn(tenExampleA),
    new M.FadeIn(tenCaption),
    ...fbox([
      '30 ÷ 100',
      '= 3 ÷ 10',
      ['= 30%', BLUE]
    ], BLUE),
    ...say('THAT IS ABOUT THREE OUT OF TEN', RED)
  );

  // ------------------------------------------------------------
  // 14: The probability does not tell us which pumps will fail.
  //
  // The arrangement changes but the illustrative count remains
  // three. Actual groups of ten need not contain exactly three.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    new M.Transform(
      tenExampleA,
      tenExampleB
    ),
    new M.FadeOut(tenCaption),
    new M.FadeIn(uncertainCaption),
    ...fbox([
      ['30% is a chance, not a guarantee', AMBER],
      'we do not know which pumps',
      'will actually fail'
    ], AMBER),
    ...say('WE CANNOT KNOW WHICH PARTICULAR PUMPS WILL FAIL', AMBER)
  );

  // ------------------------------------------------------------
  // Large-group agreement illustration.
  //
  // Two bars use the same 0–100% scale.
  // Their lengths agree at approximately 30%.
  // ------------------------------------------------------------

  const AGREE_W = P ? 5.70 : 5.55;

  function proportionBar(
    y,
    value,
    label,
    color
  ) {
    const x0 = CX - AGREE_W / 2;

    const heading = text(
      label,
      18,
      color,
      CX,
      y + 0.44,
      false,
      AGREE_W
    );

    const track = rounded(
      CX,
      y,
      AGREE_W,
      0.36,
      C.muted,
      C.card,
      0.35,
      1.4,
      0.07
    );

    const fill = rect(
      x0 + AGREE_W * value / 2,
      y,
      AGREE_W * value,
      0.36,
      color,
      0.88,
      1
    );

    const zero = text(
      '0%',
      P ? 15 : 13,
      C.muted,
      x0,
      y - 0.26,
      true
    );

    const hundred = text(
      '100%',
      P ? 15 : 13,
      C.muted,
      x0 + AGREE_W,
      y - 0.26,
      true
    );

    return new M.VGroup(
      heading,
      track,
      fill,
      zero,
      hundred
    );
  }

  const predictedBar = proportionBar(
    P ? 0.65 : 0.51,
    0.30,
    'Predicted chance = 30%',
    BLUE
  );

  const observedBar = proportionBar(
    P ? -0.88 : -0.75,
    0.30,
    'Expected observed share ≈ 30%',
    WHITE
  );

  const alignmentX =
    CX - AGREE_W / 2 + 0.30 * AGREE_W;

  const agreementGuide = new M.DashedLine({
    start: [
      alignmentX,
      P ? 0.45 : 0.31,
      0
    ],

    end: [
      alignmentX,
      P ? -0.70 : -0.57,
      0
    ],

    color: GREEN,
    strokeWidth: 2
  });

  const agreementNote = text(
    'Agreement across many comparable predictions',
    18,
    GREEN,
    CX,
    P ? -2.28 : -1.88,
    false,
    6.50
  );

  // ------------------------------------------------------------
  // 15: The long-run observed share should match the chance.
  // ------------------------------------------------------------

  await until(S(15));
  await play(
    ...fadeOut([
      tenHeading,
      tenExampleA,
      uncertainCaption
    ]),
    new M.FadeIn(predictedBar),
    new M.FadeIn(observedBar),
    new M.Create(agreementGuide),
    new M.FadeIn(agreementNote),
    ...fbox([
      ['many comparable predictions', WHITE],
      ['predicted chance = 30%', BLUE],
      ['observed share should be close', GREEN]
    ], GREEN),
    ...say('COMPARE THE PREDICTED AND OBSERVED SHARES', GREEN)
  );

  // ------------------------------------------------------------
  // 16: Name probability calibration.
  // ------------------------------------------------------------

  await until(S(16));
  await play(
    new M.Indicate(
      agreementNote,
      { color: GREEN }
    ),
    ...fbox([
      ['PROBABILITY CALIBRATION', VIOLET],
      'predicted chances agree with',
      'observed event frequencies'
    ], VIOLET),
    ...say('THIS AGREEMENT IS GOOD PROBABILITY CALIBRATION', VIOLET)
  );

  // ------------------------------------------------------------
  // 17: Return to the original twelve pumps.
  //
  // The hypothetical population is removed completely.
  // The original probabilities and real outcomes are retained.
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...fadeOut([
      predictedBar,
      observedBar,
      agreementGuide,
      agreementNote
    ]),
    ...clearBox(),
    ...showGrid(),
    ...say('CHECK THE PREDICTIONS FOR OUR 12 PUMPS')
  );

  // ------------------------------------------------------------
  // Four probability groups.
  //
  // Sort by predicted chance:
  // 10%, 30%, 60%, 90%.
  //
  // Each group contains the corresponding original pump cards.
  // Equal predicted probabilities remain together.
  //
  // Group frames are transparent to avoid covering cards.
  // ------------------------------------------------------------

  const GROUP_W = P ? 7.00 : 7.25;

  const GROUP_H = P ? 1.19 : 0.96;

  const GROUP_Y = P
    ? [1.08, -0.33, -1.74, -3.15]
    : [0.91, -0.14, -1.19, -2.24];

  const GROUP_SCALE = P ? 0.59 : 0.54;
  const GROUP_SP = P ? 0.76 : 0.72;

  const PROB_X = CX - 2.94;
  const CARDS_CX = CX + 0.08;
  const RATE_X = CX + (P ? 3.0 : 2.97);

  function groupCardSlot(groupIndex, j) {
    const n = GROUPS[groupIndex].n;

    return [
      CARDS_CX +
        (j - (n - 1) / 2) * GROUP_SP,

      GROUP_Y[groupIndex],
      0
    ];
  }

  function createGroupPanel(g, k) {
    const y = GROUP_Y[k];

    const frame = rounded(
      CX,
      y,
      GROUP_W,
      GROUP_H,
      C.muted,
      C.card,
      0,
      1.5,
      0.12
    );

    const prediction = text(
      `${g.prob}%`,
      19,
      BLUE,
      PROB_X,
      y + 0.12,
      true,
      0.88
    );

    const count = text(
      `${g.n} ${g.n === 1 ? 'pump' : 'pumps'}`,
      P ? 15 : 12,
      C.muted,
      PROB_X,
      y - 0.19,
      false,
      0.90
    );

    return {
      frame,
      prediction,
      count,
      rate: null
    };
  }

  let groupPanels = GROUPS.map(
    createGroupPanel
  );

  const groupTitle = text(
    'GROUP BY PREDICTED CHANCE',
    18,
    BLUE,
    CX,
    P ? 1.88 : 1.52,
    true,
    GROUP_W - 0.25
  );

  function showGroups() {
    const moves = GROUPS.flatMap((g, k) =>
      g.ids.flatMap((i, j) =>
        placeCard(
          cards[i],
          groupCardSlot(k, j),
          GROUP_SCALE
        )
      )
    );

    const panels = groupPanels.flatMap(p => [
      p.frame,
      p.prediction,
      p.count
    ]);

    return [
      ...moves,
      ...fadeIn(panels),
      new M.FadeIn(groupTitle)
    ];
  }

  let groupHighlight = null;

  function clearGroupHighlight() {
    if (!groupHighlight) return [];

    const old = groupHighlight;
    groupHighlight = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function selectGroup(k) {
    const next = rounded(
      CX,
      GROUP_Y[k],
      GROUP_W + 0.08,
      GROUP_H + 0.07,
      BLUE,
      BLUE,
      0,
      2.7,
      0.12
    );

    const anims = [];

    if (groupHighlight) {
      anims.push(
        new M.Transform(
          groupHighlight,
          next
        )
      );
    } else {
      groupHighlight = next;

      anims.push(
        new M.Create(groupHighlight)
      );
    }

    return [
      ...clearHighlights(),
      ...anims,
      new M.Indicate(
        groupPanels[k].prediction,
        { color: BLUE }
      )
    ];
  }

  function setGroupRate(k) {
    const g = GROUPS[k];
    const panel = groupPanels[k];

    const label = text(
      observedLabel(g.rate),
      16,
      WHITE,
      RATE_X,
      GROUP_Y[k] + 0.11,
      true,
      0.86
    );

    const small = text(
      `${g.count}/${g.n} failed`,
      P ? 15 : 12,
      RED,
      RATE_X,
      GROUP_Y[k] - 0.20,
      true,
      0.86
    );

    const next = new M.VGroup(
      label,
      small
    );

    const anims = [];

    if (panel.rate) {
      anims.push(
        new M.FadeOut(panel.rate)
      );
    }

    panel.rate = next;

    anims.push(
      new M.FadeIn(next)
    );

    return anims;
  }

  function hideGroups() {
    const panels = groupPanels.flatMap(p => [
      p.frame,
      p.prediction,
      p.count,
      p.rate
    ]);

    return [
      ...clearHighlights(),
      ...clearGroupHighlight(),
      ...fadeOut(panels),
      new M.FadeOut(groupTitle),
      ...hideGrid()
    ];
  }

  // ------------------------------------------------------------
  // 18: Sort all twelve cards into probability groups.
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    ...showGroups(),
    ...say('FOUR GROUPS: 10%, 30%, 60%, 90%', BLUE)
  );

  // ------------------------------------------------------------
  // 19–23: The 10% group.
  //
  // P7–P12.
  // Six pumps, no failures.
  // Observed rate = 0/6 = 0%.
  // ------------------------------------------------------------

  await until(S(19));
  await play(
    ...selectGroup(0),
    ...fbox([
      ['predicted chance: 10%', BLUE],
      '6 pumps in this group',
      'P7 through P12'
    ], BLUE),
    ...say('START WITH THE SIX PUMPS PREDICTED AT 10%', BLUE)
  );

  await until(S(20));
  await play(
    lag(
      focus(
        G10.ids,
        GREEN,
        'outcome',
        0.60
      ),
      0.95,
      0.07
    ),
    ...say('NONE OF THESE SIX PUMPS FAILED', GREEN)
  );

  await until(S(21));
  await play(
    ...setGroupRate(0),
    ...fbox([
      ['actual failures = 0', RED],
      'pumps in group = 6',
      ['0 ÷ 6 = 0%', WHITE]
    ], WHITE),
    ...say('ZERO OUT OF SIX = 0% ACTUAL FAILURE RATE', WHITE)
  );

  await until(S(22));
  await play(
    ...fbox([
      ['actual failure rate', WHITE],
      'share of pumps that failed',
      'within the time studied',
      ['here: the next 10 hours', BLUE]
    ]),
    ...say('FAILURE RATE = THE SHARE THAT ACTUALLY FAILED')
  );

  await until(S(23));
  await play(
    new M.Indicate(
      groupPanels[0].prediction,
      { color: BLUE }
    ),
    new M.Indicate(
      groupPanels[0].rate,
      { color: WHITE }
    ),
    ...fbox([
      ['predicted chance = 10%', BLUE],
      ['actual failure rate = 0%', WHITE],
      'group contains 6 pumps'
    ]),
    ...say('PREDICTED 10% · OBSERVED 0%')
  );

  // ------------------------------------------------------------
  // 24–27: The 30% group.
  //
  // P4, P5 and P6.
  // P4 actually failed.
  // Observed rate = 1/3 ≈ 33%.
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...selectGroup(1),
    ...fbox([
      ['predicted chance: 30%', BLUE],
      '3 pumps in this group',
      'P4, P5 and P6'
    ], BLUE),
    ...say('NEXT: THE THREE PUMPS PREDICTED AT 30%', BLUE)
  );

  await until(S(25));
  await play(
    ...highlightCards(
      G30.failures,
      RED,
      0.10
    ),
    ...focus(
      G30.failures,
      RED,
      'outcome',
      0.65
    ),
    ...say('ONLY PUMP 4 FAILED', RED)
  );

  await until(S(26));
  await play(
    ...setGroupRate(1),
    ...fbox([
      ['actual failures = 1', RED],
      'pumps in group = 3',
      ['1 ÷ 3 ≈ 33%', WHITE]
    ], WHITE),
    ...say('ONE OUT OF THREE ≈ 33% ACTUAL FAILURE RATE', WHITE)
  );

  await until(S(27));
  await play(
    new M.Indicate(
      groupPanels[1].prediction,
      { color: BLUE }
    ),
    new M.Indicate(
      groupPanels[1].rate,
      { color: WHITE }
    ),
    ...fbox([
      ['predicted chance = 30%', BLUE],
      ['actual failure rate ≈ 33%', WHITE],
      'close agreement in this group'
    ], GREEN),
    ...say('33% IS QUITE CLOSE TO 30%', GREEN)
  );

  // ------------------------------------------------------------
  // 28–30: The 60% group.
  //
  // P2 and P3.
  // P2 actually failed.
  // Observed rate = 1/2 = 50%.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...selectGroup(2),
    ...fbox([
      ['predicted chance: 60%', BLUE],
      '2 pumps in this group',
      'P2 and P3'
    ], BLUE),
    ...say('NEXT: THE TWO PUMPS PREDICTED AT 60%', BLUE)
  );

  await until(S(29));
  await play(
    ...highlightCards(
      G60.failures,
      RED,
      0.10
    ),
    ...focus(
      G60.failures,
      RED,
      'outcome',
      0.65
    ),
    ...say('ONLY PUMP 2 FAILED', RED)
  );

  await until(S(30));
  await play(
    ...setGroupRate(2),
    ...fbox([
      ['actual failures = 1', RED],
      'pumps in group = 2',
      ['1 ÷ 2 = 50%', WHITE]
    ], WHITE),
    ...say('ONE OUT OF TWO = 50% ACTUAL FAILURE RATE', WHITE)
  );

  // ------------------------------------------------------------
  // 31–32: The 90% group.
  //
  // P1 alone.
  // P1 did not fail within ten hours.
  // Observed rate = 0/1 = 0%.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    ...selectGroup(3),
    ...fbox([
      ['predicted chance: 90%', BLUE],
      'only 1 pump in this group',
      'P1'
    ], BLUE),
    ...say('FINALLY: PUMP 1, PREDICTED AT 90%', BLUE)
  );

  await until(S(32));
  await play(
    ...focus(
      G90.ids,
      GREEN,
      'outcome'
    ),
    ...setGroupRate(3),
    ...fbox([
      ['actual failures = 0', RED],
      'pumps in group = 1',
      ['0 ÷ 1 = 0%', WHITE]
    ], WHITE),
    ...say('IT SURVIVED: ZERO OUT OF ONE = 0%', WHITE)
  );

  // ------------------------------------------------------------
  // Calibration plot.
  //
  // Horizontal: predicted failure probability.
  // Vertical: observed failure rate.
  //
  // Both axes run linearly from 0% to 100%.
  //
  // Unlike ROC and precision–recall plots, these dots are
  // probability groups, not alert thresholds.
  //
  // Do not connect the measured points into a curve.
  // The only diagonal line is the perfect-calibration reference.
  // ------------------------------------------------------------

  const GX0 = P ? -2.70 : -5.78;
  const GX1 = P ? 2.70 : -0.30;

  const GY0 = P ? -4.67 : -2.12;
  const GY1 = P ? -1.10 : 1.08;

  const GW = GX1 - GX0;
  const GH = GY1 - GY0;

  const GCX = (GX0 + GX1) / 2;

  const xFor = probability =>
    GX0 + probability / 100 * GW;

  const yFor = rate =>
    GY0 + rate / 100 * GH;

  const pointFor = (
    probability,
    rate
  ) => [
    xFor(probability),
    yFor(rate),
    0
  ];

  const graphFrame = rounded(
    GCX,
    (GY0 + GY1) / 2,
    GW + 0.12,
    GH + 0.12,
    C.muted,
    C.card,
    0.25,
    1,
    0.05
  );

  const horizontalAxis = arrow(
    GX0,
    GY0,
    GX1 + 0.09,
    GY0,
    BLUE,
    0.11,
    2.5
  );

  const verticalAxis = arrow(
    GX0,
    GY0,
    GX0,
    GY1 + 0.09,
    WHITE,
    0.11,
    2.5
  );

  const xAxisLabel = text(
    'Predicted chance of failure',
    P ? 17 : 17,
    BLUE,
    GCX,
    GY0 - 0.49,
    false,
    GW + 0.35
  );

  const yAxisLabel = text(
    'Actual failure rate',
    P ? 17 : 17,
    WHITE,
    GCX,
    GY1 + 0.27,
    false,
    GW + 0.35
  );

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
        GY0 - 0.22,
        true
      );

      return new M.VGroup(
        tick,
        label
      );
    });
  }

  function makeYTicks() {
    return [0, 20, 40, 60, 80, 100].map(v => {
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
        GX0 - 0.35,
        y,
        true,
        0.64
      );

      return new M.VGroup(
        tick,
        label
      );
    });
  }

  const xTicks = makeXTicks();
  const yTicks = makeYTicks();

  const graphGrid = [
    ...[20, 40, 60, 80, 100].map(v =>
      line(
        xFor(v),
        GY0,
        xFor(v),
        GY1,
        C.muted,
        0.6
      )
    ),

    ...[20, 40, 60, 80, 100].map(v =>
      line(
        GX0,
        yFor(v),
        GX1,
        yFor(v),
        C.muted,
        0.6
      )
    )
  ];

  // ------------------------------------------------------------
  // Compact group summary.
  //
  // Keep the original group counts available while the graph
  // is constructed.
  //
  // During plotting, each completed group is represented by
  // a row showing its predicted and observed percentages.
  // ------------------------------------------------------------

  const TABLE_X = P ? 0 : 3.56;
  const TABLE_Y = P ? 0.63 : -0.24;

  const TABLE_W = P ? 6.65 : 5.65;
  const TABLE_H = P ? 2.25 : 3.40;

  const TABLE_TOP =
    TABLE_Y + TABLE_H / 2;

  const TABLE_LEFT =
    TABLE_X - TABLE_W / 2;

  const TABLE_COLS = [
    TABLE_LEFT + TABLE_W * 0.18,
    TABLE_LEFT + TABLE_W * 0.50,
    TABLE_LEFT + TABLE_W * 0.82
  ];

  const TABLE_HEADER_Y =
    TABLE_TOP - (P ? 0.23 : 0.36);

  const TABLE_ROW_H = P ? 0.40 : 0.55;

  function tableRowY(k) {
    return TABLE_HEADER_Y -
      (P ? 0.40 : 0.58) -
      k * TABLE_ROW_H;
  }

  let tableFrame = null;
  let tableRows = [];
  let tableHighlight = null;
  let tableVisible = false;

  function createTableFrame() {
    const frame = rounded(
      TABLE_X,
      TABLE_Y,
      TABLE_W,
      TABLE_H,
      BLUE,
      C.card,
      0.94,
      2,
      0.16
    );

    const headings = [
      text(
        'Predicted',
        15,
        BLUE,
        TABLE_COLS[0],
        TABLE_HEADER_Y,
        false,
        TABLE_W * 0.29
      ),

      text(
        'Failed / Total',
        15,
        RED,
        TABLE_COLS[1],
        TABLE_HEADER_Y,
        false,
        TABLE_W * 0.31
      ),

      text(
        'Observed',
        15,
        WHITE,
        TABLE_COLS[2],
        TABLE_HEADER_Y,
        false,
        TABLE_W * 0.29
      )
    ];

    const divider = line(
      TABLE_LEFT + 0.15,
      TABLE_HEADER_Y - 0.18,
      TABLE_LEFT + TABLE_W - 0.15,
      TABLE_HEADER_Y - 0.18,
      C.muted,
      1.2
    );

    return new M.VGroup(
      frame,
      ...headings,
      divider
    );
  }

  function createTableRow(g, k) {
    const y = tableRowY(k);

    return new M.VGroup(
      text(
        `${g.prob}%`,
        17,
        BLUE,
        TABLE_COLS[0],
        y,
        true
      ),

      text(
        `${g.count} / ${g.n}`,
        17,
        RED,
        TABLE_COLS[1],
        y,
        true
      ),

      text(
        observedLabel(g.rate),
        17,
        WHITE,
        TABLE_COLS[2],
        y,
        true,
        TABLE_W * 0.28
      )
    );
  }

  function showTable(allRows = false) {
    tableFrame = createTableFrame();
    tableRows = [];
    tableVisible = true;

    const anims = [
      new M.FadeIn(tableFrame)
    ];

    if (allRows) {
      GROUPS.forEach((g, k) => {
        const row = createTableRow(
          g,
          k
        );

        tableRows[k] = row;

        anims.push(
          new M.FadeIn(row)
        );
      });
    }

    return anims;
  }

  function revealTableRow(k) {
    if (tableRows[k]) return [];

    const row = createTableRow(
      GROUPS[k],
      k
    );

    tableRows[k] = row;

    return [
      new M.FadeIn(row)
    ];
  }

  function clearTableHighlight() {
    if (!tableHighlight) return [];

    const old = tableHighlight;
    tableHighlight = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function highlightTableRow(k) {
    const next = rounded(
      TABLE_X,
      tableRowY(k),
      TABLE_W - 0.20,
      P ? 0.34 : 0.46,
      AMBER,
      AMBER,
      0,
      2.2,
      0.06
    );

    const anims = [];

    if (tableHighlight) {
      anims.push(
        new M.Transform(
          tableHighlight,
          next
        )
      );
    } else {
      tableHighlight = next;

      anims.push(
        new M.Create(tableHighlight)
      );
    }

    return anims;
  }

  function hideTable() {
    if (!tableVisible) return [];

    const anims = [
      ...clearTableHighlight(),
      ...fadeOut([
        tableFrame,
        ...tableRows
      ])
    ];

    tableFrame = null;
    tableRows = [];
    tableVisible = false;

    return anims;
  }

  const PLOT_BOX = P
    ? BOXP
    : [TABLE_X, -2.95, 0];

  function plotBox(
    rows,
    color = C.cyan
  ) {
    return fbox(
      rows,
      color,
      PLOT_BOX,
      P ? FW - 1.2 : TABLE_W
    );
  }

  // ------------------------------------------------------------
  // 33: Prepare the calibration plotting space.
  // ------------------------------------------------------------

  await until(S(33));
  await play(
    ...hideGroups(),
    ...clearBox(),
    new M.FadeIn(graphFrame),
    ...showTable(false),
    ...say('COMPARE PREDICTED CHANCES WITH OBSERVED RATES')
  );

  // ------------------------------------------------------------
  // 34: Introduce the horizontal axis.
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    new M.Create(horizontalAxis),
    ...fadeIn(xTicks),
    new M.FadeIn(xAxisLabel),
    ...say('ACROSS: PREDICTED CHANCE OF FAILURE', BLUE)
  );

  // ------------------------------------------------------------
  // 35: Introduce the vertical axis.
  // ------------------------------------------------------------

  await until(S(35));
  await play(
    new M.Create(verticalAxis),
    ...fadeIn(yTicks),
    ...fadeIn(graphGrid),
    new M.FadeIn(yAxisLabel),
    ...say('UP: THE ACTUAL SHARE THAT FAILED', WHITE)
  );

  // ------------------------------------------------------------
  // Calibration point helpers.
  //
  // Blue denotes the predicted probability associated with
  // each group. White cores distinguish observed group results.
  //
  // Exact sample-size labels are added explicitly at beat 51,
  // matching the narration.
  // ------------------------------------------------------------

  const plotted = [];

  let guides = [];
  let activePoint = null;
  let sampleSizeLabels = [];

  const LABEL_OFFSETS = [
    [0.05, 0.26],
    [-0.05, 0.31],
    [0.46, -0.26],
    [-0.12, 0.26]
  ];

  function makeCalibrationPoint(g, k) {
    const p = pointFor(
      g.prob,
      g.rate * 100
    );

    const halo = new M.Dot({
      point: p,
      radius: 0.16,
      color: BLUE
    });

    halo.setFill(BLUE, 0.19);

    const ring = circle(
      p[0],
      p[1],
      0.090,
      BLUE,
      1,
      1.5
    );

    const core = new M.Dot({
      point: p,
      radius: 0.042,
      color: WHITE
    });

    const [dx, dy] =
      LABEL_OFFSETS[k];

    const label = text(
      `(${g.prob}, ${Number.isInteger(g.rate * 100) ? g.rate * 100 : (g.rate * 100).toFixed(1)})`,
      P ? 15 : 13,
      BLUE,
      p[0] + dx,
      p[1] + dy,
      true,
      1.32
    );

    return {
      group: g,
      point: p,
      halo,
      ring,
      core,
      label
    };
  }

  function clearGuides() {
    const anims = fadeOut(guides);

    guides = [];

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

  function makeGuides(g) {
    const x = xFor(g.prob);
    const y = yFor(g.rate * 100);

    const objects = [];

    if (g.rate > 0) {
      objects.push(
        new M.DashedLine({
          start: [x, GY0, 0],
          end: [x, y, 0],
          color: BLUE,
          strokeWidth: 1.8
        })
      );

      objects.push(
        new M.DashedLine({
          start: [GX0, y, 0],
          end: [x, y, 0],
          color: WHITE,
          strokeWidth: 1.8
        })
      );
    }

    const xTick = line(
      x,
      GY0 - 0.075,
      x,
      GY0 + 0.075,
      BLUE,
      3
    );

    objects.push(xTick);

    return objects;
  }

  function plotPoint(k) {
    const g = GROUPS[k];

    const p = makeCalibrationPoint(
      g,
      k
    );

    const anims = [
      ...clearGuides(),
      ...revealTableRow(k),
      ...highlightTableRow(k)
    ];

    guides = makeGuides(g);

    anims.push(
      ...guides.map(o =>
        new M.Create(o)
      )
    );

    anims.push(
      new M.FadeIn(p.halo),
      new M.FadeIn(p.ring),
      new M.FadeIn(p.core),
      new M.FadeIn(p.label)
    );

    const nextRing = circle(
      p.point[0],
      p.point[1],
      0.17,
      WHITE,
      0,
      2
    );

    if (activePoint) {
      anims.push(
        new M.Transform(
          activePoint,
          nextRing
        )
      );
    } else {
      activePoint = nextRing;

      anims.push(
        new M.Create(activePoint)
      );
    }

    plotted[k] = p;

    return anims;
  }

  // ------------------------------------------------------------
  // 36: Plot the 10% group.
  //
  // (10%, 0%).
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    ...plotPoint(0),
    ...plotBox([
      ['predicted chance: 10%', BLUE],
      ['actual failure rate: 0%', WHITE],
      ['point = (10%, 0%)', BLUE]
    ], BLUE),
    ...say('FIRST DOT: 10% ACROSS · 0% UP', BLUE)
  );

  // ------------------------------------------------------------
  // 37: Plot the 30% group.
  //
  // (30%, 33.333...%).
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...plotPoint(1),
    ...plotBox([
      ['predicted chance: 30%', BLUE],
      ['actual failure rate: 1/3', WHITE],
      ['point ≈ (30%, 33.3%)', BLUE]
    ], BLUE),
    ...say('SECOND DOT: 30% ACROSS · ABOUT 33% UP', BLUE)
  );

  // ------------------------------------------------------------
  // 38: Plot the 60% group.
  //
  // (60%, 50%).
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    ...plotPoint(2),
    ...plotBox([
      ['predicted chance: 60%', BLUE],
      ['actual failure rate: 50%', WHITE],
      ['point = (60%, 50%)', BLUE]
    ], BLUE),
    ...say('THIRD DOT: 60% ACROSS · 50% UP', BLUE)
  );

  // ------------------------------------------------------------
  // 39: Plot the 90% group.
  //
  // (90%, 0%).
  // ------------------------------------------------------------

  await until(S(39));
  await play(
    ...plotPoint(3),
    ...plotBox([
      ['predicted chance: 90%', BLUE],
      ['actual failure rate: 0%', WHITE],
      ['point = (90%, 0%)', BLUE]
    ], BLUE),
    ...say('FINAL DOT: 90% ACROSS · 0% UP', BLUE)
  );

  // ------------------------------------------------------------
  // Perfect-calibration reference.
  //
  // y = x.
  //
  // This line is not fitted to the observed data.
  // It shows where predictions and observed rates agree
  // exactly.
  // ------------------------------------------------------------

  const perfectLine = new M.DashedLine({
    start: pointFor(0, 0),
    end: pointFor(100, 100),
    color: GREEN,
    strokeWidth: 2.8
  });

  const perfectLabel = text(
    'Perfect agreement',
    15,
    GREEN,
    xFor(77),
    yFor(91),
    false,
    2.10
  );

  const perfectEquation = text(
    'Observed = predicted',
    P ? 15 : 13,
    GREEN,
    xFor(78),
    yFor(82),
    false,
    2.15
  );

  // ------------------------------------------------------------
  // 40: Draw the diagonal reference line.
  // ------------------------------------------------------------

  await until(S(40));
  await play(
    ...clearGuides(),
    ...clearActivePoint(),
    ...clearTableHighlight(),
    new M.Create(perfectLine),
    ...say('DRAW THE DIAGONAL FROM (0,0) TO (100,100)', GREEN)
  );

  // ------------------------------------------------------------
  // 41: Explain the diagonal.
  //
  // Illustrate equality at 30%, 60% and 90%.
  // These are open reference markers, NOT observations.
  // ------------------------------------------------------------

  const referenceExamples = [30, 60, 90].map(v => {
    const p = pointFor(v, v);

    return circle(
      p[0],
      p[1],
      0.10,
      GREEN,
      0,
      2
    );
  });

  await until(S(41));
  await play(
    new M.FadeIn(perfectLabel),
    new M.FadeIn(perfectEquation),
    lag(
      fadeIn(referenceExamples),
      1.45,
      0.24
    ),
    ...plotBox([
      ['every point on this line agrees', GREEN],
      '30% predicted → 30% observed',
      '60% predicted → 60% observed'
    ], GREEN),
    ...say('ON THE DIAGONAL, PREDICTED = OBSERVED', GREEN)
  );

  // ------------------------------------------------------------
  // 42: Name the calibration plot.
  // ------------------------------------------------------------

  await until(S(42));
  await play(
    ...fadeOut(referenceExamples),
    ...plotBox([
      ['CALIBRATION PLOT', VIOLET],
      'predicted probabilities across',
      'actual failure rates up'
    ], VIOLET),
    ...say('THIS IS A CALIBRATION PLOT', VIOLET)
  );

  // ------------------------------------------------------------
  // 43: Each dot represents one probability group.
  // ------------------------------------------------------------

  await until(S(43));
  await play(
    lag(
      plotted.map(p =>
        new M.Indicate(
          p.ring,
          {
            color: BLUE,
            runTime: 0.65
          }
        )
      ),
      1.90,
      0.23
    ),
    ...plotBox([
      ['one dot = one probability group', BLUE],
      'its height shows the observed',
      'failure rate for that group'
    ], BLUE),
    ...say('EACH DOT SUMMARISES ONE GROUP OF PUMPS', BLUE)
  );

  // ------------------------------------------------------------
  // Formula panel.
  //
  // The learner has already counted the failures and group
  // sizes. Only now introduce the compact mathematical form.
  // ------------------------------------------------------------

  const FORMULA_X = TABLE_X;

  const FORMULA_Y = P
    ? 0.65
    : -0.24;

  const FORMULA_W = P
    ? 6.60
    : 5.60;

  const FORMULA_H = P
    ? 2.20
    : 3.30;

  let formulaFrame = null;
  let formulaNumerator = null;
  let formulaDenominator = null;
  let formulaExample = null;

  function makeFormulaFrame() {
    const frame = rounded(
      FORMULA_X,
      FORMULA_Y,
      FORMULA_W,
      FORMULA_H,
      VIOLET,
      C.card,
      0.95,
      2,
      0.16
    );

    const title = text(
      'ACTUAL FAILURE RATE',
      19,
      WHITE,
      FORMULA_X,
      FORMULA_Y + FORMULA_H / 2 - 0.26,
      true,
      FORMULA_W - 0.30
    );

    const fractionLine = line(
      FORMULA_X - FORMULA_W / 2 + 0.46,
      FORMULA_Y,
      FORMULA_X + FORMULA_W / 2 - 0.46,
      FORMULA_Y,
      WHITE,
      2
    );

    return new M.VGroup(
      frame,
      title,
      fractionLine
    );
  }

  function showFormula() {
    formulaFrame = makeFormulaFrame();

    return [
      new M.FadeIn(formulaFrame)
    ];
  }

  function showFormulaTerms() {
    formulaNumerator = text(
      'Number of failures in the group',
      P ? 18 : 20,
      RED,
      FORMULA_X,
      FORMULA_Y + 0.28,
      false,
      FORMULA_W - 0.38
    );

    formulaDenominator = text(
      'Number of pumps in that group',
      P ? 18 : 20,
      WHITE,
      FORMULA_X,
      FORMULA_Y - 0.29,
      false,
      FORMULA_W - 0.38
    );

    formulaExample = text(
      'Example: 1 ÷ 3 ≈ 33%',
      18,
      VIOLET,
      FORMULA_X,
      FORMULA_Y - (P ? 0.79 : 1.08),
      true,
      FORMULA_W - 0.35
    );

    return [
      new M.FadeIn(formulaNumerator),
      new M.FadeIn(formulaDenominator),
      new M.FadeIn(formulaExample)
    ];
  }

  function hideFormula() {
    const anims = fadeOut([
      formulaFrame,
      formulaNumerator,
      formulaDenominator,
      formulaExample
    ]);

    formulaFrame = null;
    formulaNumerator = null;
    formulaDenominator = null;
    formulaExample = null;

    return anims;
  }

  // ------------------------------------------------------------
  // 44: Prepare the formula.
  // ------------------------------------------------------------

  await until(S(44));
  await play(
    ...hideTable(),
    ...clearBox(),
    ...showFormula(),
    ...showFormulaTerms(),
    ...say('WRITE THE CALCULATION BEHIND EACH DOT')
  );

  // ------------------------------------------------------------
  // 45: Actual failure rate = failures / group size.
  //
  // To express the result as a percentage, multiply by 100.
  // ------------------------------------------------------------

  await until(S(45));
  await play(
    ...plotBox([
      ['actual failure rate', WHITE],
      'failures ÷ pumps in the group',
      ['× 100 for a percentage', VIOLET]
    ], VIOLET),
    ...say('FAILURES IN THE GROUP ÷ PUMPS IN THE GROUP')
  );

  // ------------------------------------------------------------
  // Agreement illustration.
  //
  // Highlight the 30% group because its observed 1/3 is
  // relatively close to 30%.
  //
  // This is an illustration of distance from the diagonal,
  // not a statistical conclusion from three pumps.
  // ------------------------------------------------------------

  const nearPoint = pointFor(
    30,
    G30.rate * 100
  );

  const nearReference = pointFor(
    30,
    30
  );

  const nearRing = circle(
    nearPoint[0],
    nearPoint[1],
    0.18,
    GREEN,
    0,
    2.4
  );

  const nearGap = line(
    nearReference[0],
    nearReference[1],
    nearPoint[0],
    nearPoint[1],
    GREEN,
    4
  );

  const nearGapLeader = arrow(
    xFor(13),
    yFor(53),
    nearPoint[0] - 0.12,
    nearPoint[1] + 0.10,
    GREEN,
    0.10,
    1.8
  );

  const nearGapLabel = text(
    'Close to line',
    P ? 15 : 14,
    GREEN,
    xFor(16),
    yFor(58),
    false,
    1.55
  );

  const SIDE_X = TABLE_X;
  const SIDE_Y = P ? 0.65 : -0.28;
  const SIDE_W = P ? 6.60 : 5.60;

  function sidePanel(
    title,
    rows,
    color = C.cyan
  ) {
    const h = P ? 2.15 : 3.05;

    const frame = rounded(
      SIDE_X,
      SIDE_Y,
      SIDE_W,
      h,
      color,
      C.card,
      0.95,
      2,
      0.16
    );

    const heading = text(
      title,
      P ? 18 : 20,
      color,
      SIDE_X,
      SIDE_Y + h / 2 - 0.28,
      true,
      SIDE_W - 0.30
    );

    const rowSpace = P ? 0.37 : 0.48;

    const labels = rows.map((row, i) => {
      const [s, c] =
        Array.isArray(row)
          ? row
          : [row, C.ink];

      const y =
        SIDE_Y + h / 2 -
        0.72 - i * rowSpace;

      return text(
        s,
        P ? 16 : 18,
        c,
        SIDE_X,
        y,
        false,
        SIDE_W - 0.32
      );
    });

    return new M.VGroup(
      frame,
      heading,
      ...labels
    );
  }

  const agreementPanel = sidePanel(
    'CLOSE TO THE DIAGONAL',
    [
      ['Predicted: 30%', BLUE],
      ['Observed: about 33%', WHITE],
      ['Close in this small example', GREEN],
      'Reliable judgment needs many pumps'
    ],
    GREEN
  );

  // ------------------------------------------------------------
  // 46: With enough observations, close agreement suggests
  // good calibration.
  // ------------------------------------------------------------

  await until(S(46));
  await play(
    ...hideFormula(),
    new M.Create(nearRing),
    new M.Create(nearGap),
    new M.Create(nearGapLeader),
    new M.FadeIn(nearGapLabel),
    new M.FadeIn(agreementPanel),
    ...plotBox([
      ['with enough comparable pumps', WHITE],
      ['dots close to the diagonal', GREEN],
      'suggest good calibration'
    ], GREEN),
    ...say('WITH ENOUGH DATA, CLOSE DOTS SUGGEST GOOD CALIBRATION', GREEN)
  );

  // ------------------------------------------------------------
  // 47: Practical use of calibration.
  //
  // The probability itself may guide a decision, such as
  // preparing a replacement pump.
  // ------------------------------------------------------------

  const usePanel = sidePanel(
    'USE CALIBRATION',
    [
      'When decisions depend on chances',
      ['Prepare replacement equipment', AMBER],
      ['Plan available repair resources', AMBER],
      'Check whether probabilities are trustworthy'
    ],
    VIOLET
  );

  await until(S(47));
  await play(
    new M.FadeOut(agreementPanel),
    new M.FadeOut(nearRing),
    new M.FadeOut(nearGap),
    new M.FadeOut(nearGapLeader),
    new M.FadeOut(nearGapLabel),
    new M.FadeIn(usePanel),
    ...plotBox([
      ['USE CALIBRATION', VIOLET],
      'when decisions depend on',
      'trustworthy probability estimates'
    ], VIOLET),
    ...say('USE CALIBRATION WHEN THE CHANCE ITSELF MATTERS', VIOLET)
  );

  // ------------------------------------------------------------
  // Small-group warning.
  //
  // The 90% group contains only P1.
  // It did not fail during the ten-hour period.
  //
  // This is compatible with a 90% chance of failure, because
  // the complementary chance of not failing is 10%.
  // ------------------------------------------------------------

  const ninetyPoint = pointFor(
    90,
    0
  );

  const ninetyRing = circle(
    ninetyPoint[0],
    ninetyPoint[1],
    0.19,
    AMBER,
    0,
    2.7
  );

  const ninetyReference = pointFor(
    90,
    90
  );

  const ninetyGap = new M.DashedLine({
    start: ninetyPoint,
    end: ninetyReference,
    color: AMBER,
    strokeWidth: 1.7
  });

  const P1_X = SIDE_X - 1.62;
  const P1_Y = SIDE_Y + (P ? 0.02 : 0.05);

  const P1_SCALE = P ? 1.15 : 1.45;

  const p1Example = new M.VGroup(
    cardBase(
      0,
      P1_X,
      P1_Y,
      P1_SCALE
    ),

    chanceLabel(
      0,
      P1_X,
      P1_Y,
      P1_SCALE
    ),

    outcomeMark(
      0,
      P1_X,
      P1_Y,
      P1_SCALE
    )
  );

  const p1PanelFrame = rounded(
    SIDE_X,
    SIDE_Y,
    SIDE_W,
    P ? 2.15 : 3.05,
    AMBER,
    C.card,
    0.95,
    2,
    0.16
  );

  const p1Heading = text(
    '90% GROUP',
    19,
    BLUE,
    SIDE_X,
    SIDE_Y + (P ? 0.80 : 1.17),
    true
  );

  const p1Count = text(
    'ONLY 1 PUMP',
    21,
    AMBER,
    SIDE_X + 1.00,
    SIDE_Y + 0.29,
    true,
    2.60
  );

  const p1Observed = text(
    '0 of 1 failed',
    17,
    WHITE,
    SIDE_X + 1.00,
    SIDE_Y - 0.13,
    true,
    2.60
  );

  const p1Rate = text(
    'Observed rate = 0%',
    16,
    WHITE,
    SIDE_X + 1.00,
    SIDE_Y - 0.48,
    false,
    2.70
  );

  const p1Picture = [
    p1PanelFrame,
    p1Heading,
    p1Example,
    p1Count,
    p1Observed,
    p1Rate
  ];

  // ------------------------------------------------------------
  // 48: Emphasise that the 90% group contains one pump.
  // ------------------------------------------------------------

  await until(S(48));
  await play(
    new M.FadeOut(usePanel),
    new M.Create(ninetyGap),
    new M.Create(ninetyRing),
    ...fadeIn(p1Picture),
    ...plotBox([
      ['90% predicted, 0% observed', AMBER],
      ['but this group has n = 1', WHITE],
      'only one real observation'
    ], AMBER),
    ...say('BE CAREFUL: THE 90% GROUP HAS ONLY ONE PUMP', AMBER)
  );

  // ------------------------------------------------------------
  // Complementary probability illustration.
  //
  // Ten equal probability blocks:
  // nine represent failure probability;
  // one represents the probability of no failure.
  //
  // These blocks represent probabilities, not ten observed
  // pumps or ten guaranteed future outcomes.
  // ------------------------------------------------------------

  const CHANCE_Y = P
    ? SIDE_Y + 0.05
    : SIDE_Y + 0.10;

  const CHANCE_W = P ? 5.65 : 4.90;
  const CHANCE_GAP = 0.055;

  const CHANCE_BLOCK_W =
    (CHANCE_W - 9 * CHANCE_GAP) / 10;

  const chanceBlocks = Array.from(
    { length: 10 },
    (_, i) => {
      const x =
        SIDE_X - CHANCE_W / 2 +
        CHANCE_BLOCK_W / 2 +
        i * (
          CHANCE_BLOCK_W +
          CHANCE_GAP
        );

      const failureChance = i < 9;

      const frame = rect(
        x,
        CHANCE_Y,
        CHANCE_BLOCK_W,
        0.46,
        failureChance ? RED : GREEN,
        failureChance ? 0.22 : 0.08,
        1.7
      );

      const mark = failureChance
        ? failureIcon(
            x,
            CHANCE_Y,
            0.82
          )
        : safeIcon(
            x,
            CHANCE_Y,
            0.82
          );

      return new M.VGroup(
        frame,
        mark
      );
    }
  );

  const chanceHeading = text(
    'POSSIBLE OUTCOMES OF A 90% PREDICTION',
    18,
    BLUE,
    SIDE_X,
    SIDE_Y + (P ? 0.82 : 1.16),
    true,
    SIDE_W - 0.35
  );

  const failureChanceLabel = text(
    '90% chance of failure',
    16,
    RED,
    SIDE_X,
    CHANCE_Y - 0.47,
    false,
    SIDE_W - 0.30
  );

  const surviveChanceLabel = text(
    '10% chance of no failure',
    17,
    GREEN,
    SIDE_X,
    CHANCE_Y - 0.79,
    false,
    SIDE_W - 0.30
  );

  const chancePicture = [
    chanceHeading,
    ...chanceBlocks,
    failureChanceLabel,
    surviveChanceLabel
  ];

  // ------------------------------------------------------------
  // 49: A 90% failure chance still allows survival.
  // ------------------------------------------------------------

  await until(S(49));
  await play(
    ...fadeOut([
      p1Heading,
      p1Example,
      p1Count,
      p1Observed,
      p1Rate
    ]),
    ...fadeIn(chancePicture),
    new M.Indicate(
      chanceBlocks[9],
      { color: GREEN }
    ),
    ...plotBox([
      ['failure chance = 90%', BLUE],
      '100% − 90% = 10%',
      ['chance of survival = 10%', GREEN]
    ], GREEN),
    ...say('A 90% FAILURE CHANCE STILL ALLOWS A 10% SURVIVAL CHANCE', GREEN)
  );

  // ------------------------------------------------------------
  // 50: One survival cannot establish poor calibration.
  // ------------------------------------------------------------

  const singleOutcomeNote = sidePanel(
    'ONE OUTCOME IS NOT ENOUGH',
    [
      ['P1 did not fail', GREEN],
      'A 90% prediction permits this outcome',
      'One observation cannot establish',
      ['whether the chance was trustworthy', AMBER]
    ],
    AMBER
  );

  await until(S(50));
  await play(
    ...fadeOut([
      p1PanelFrame,
      ...chancePicture
    ]),
    new M.FadeOut(ninetyGap),
    new M.FadeIn(singleOutcomeNote),
    ...plotBox([
      ['one pump survived', GREEN],
      'that does not prove the',
      '90% prediction was wrong'
    ], AMBER),
    ...say('ONE SURVIVAL DOES NOT PROVE THE PREDICTION WRONG', AMBER)
  );

  // ------------------------------------------------------------
  // Sample-size labels.
  //
  // Add n = 6, n = 3, n = 2, n = 1 beside the respective
  // calibration points.
  //
  // Keep the labels close to their own dots and offset from
  // the coordinate labels and diagonal.
  // ------------------------------------------------------------

  const SIZE_LABEL_OFFSETS = [
    [0.10, 0.74],
    [0.62, -0.40],
    [0.72, -0.66],
    [-0.15, 0.76]
  ];

  function addSampleSizeLabels() {
    sampleSizeLabels = plotted.map((p, k) => {
      const [dx, dy] =
        SIZE_LABEL_OFFSETS[k];

      const tag = pill(
        `n = ${p.group.n}`,
        AMBER,
        P ? 15 : 13
      );

      tag.moveTo([
        p.point[0] + dx,
        p.point[1] + dy,
        0
      ]);

      return tag;
    });

    return [
      lag(
        fadeIn(sampleSizeLabels),
        2.10,
        0.26
      )
    ];
  }

  // ------------------------------------------------------------
  // 51: Write the sample sizes beside every dot.
  // ------------------------------------------------------------

  await until(S(51));
  await play(
    new M.FadeOut(singleOutcomeNote),
    new M.FadeOut(ninetyRing),
    ...showTable(true),
    ...addSampleSizeLabels(),
    ...plotBox([
      ['number of pumps in each group', AMBER],
      'n = 6, 3, 2, 1',
      'n means group size'
    ], AMBER),
    ...say('WRITE EACH GROUP SIZE BESIDE ITS DOT', AMBER)
  );

  // ------------------------------------------------------------
  // 52: Small groups produce uncertain observed rates.
  //
  // Do not declare the tool well or poorly calibrated from
  // these twelve observations.
  //
  // Do not manufacture confidence intervals: the narration
  // has not introduced them and the lesson does not require
  // any particular statistical interval procedure.
  // ------------------------------------------------------------

  await until(S(52));
  await play(
    lag(
      sampleSizeLabels.map(o =>
        new M.Indicate(
          o,
          {
            color: AMBER,
            runTime: 0.75
          }
        )
      ),
      2.10,
      0.20
    ),
    ...plotBox([
      ['these groups are very small', AMBER],
      '6, 3, 2 and 1 observations',
      ['too little data for a confident judgment', WHITE]
    ], AMBER),
    ...say('THESE GROUPS ARE TOO SMALL FOR A CONFIDENT JUDGMENT', AMBER)
  );

  // ------------------------------------------------------------
  // 53: Illustrate the need for many comparable predictions
  // and their actual outcomes.
  //
  // These neutral tiles are placeholders for future cases.
  // They have no invented probabilities or recorded outcomes.
  // ------------------------------------------------------------

  const MORE_X = SIDE_X;
  const MORE_Y = SIDE_Y + 0.02;

  const moreHeading = text(
    'MORE COMPARABLE OBSERVATIONS',
    17,
    BLUE,
    MORE_X,
    SIDE_Y + (P ? 0.90 : 1.22),
    true,
    SIDE_W - 0.30
  );

  const moreTileRows = 3;
  const moreTileCols = 10;

  const moreTileSPX = P ? 0.47 : 0.42;
  const moreTileSPY = P ? 0.29 : 0.38;

  const futureTiles = [];

  for (
    let r = 0;
    r < moreTileRows;
    r++
  ) {
    for (
      let c = 0;
      c < moreTileCols;
      c++
    ) {
      const x =
        MORE_X +
        (c - (moreTileCols - 1) / 2) *
        moreTileSPX;

      const y =
        MORE_Y +
        ((moreTileRows - 1) / 2 - r) *
        moreTileSPY;

      futureTiles.push(
        rounded(
          x,
          y,
          moreTileSPX * 0.72,
          moreTileSPY * 0.73,
          C.muted,
          BLUE,
          0.08,
          1.2,
          0.035
        )
      );
    }
  }

  const futureTilePicture = new M.VGroup(
    ...futureTiles
  );

  const moreCaption = text(
    'Record prediction + real outcome',
    17,
    WHITE,
    MORE_X,
    SIDE_Y - (P ? 0.68 : 0.95),
    false,
    SIDE_W - 0.30
  );

  const moreFrame = rounded(
    SIDE_X,
    SIDE_Y,
    SIDE_W,
    P ? 2.15 : 3.05,
    BLUE,
    C.card,
    0.95,
    2,
    0.16
  );

  const morePicture = [
    moreFrame,
    moreHeading,
    futureTilePicture,
    moreCaption
  ];

  await until(S(53));
  await play(
    ...hideTable(),
    new M.FadeIn(moreFrame),
    new M.FadeIn(moreHeading),
    new M.FadeIn(futureTilePicture),
    new M.FadeIn(moreCaption),
    ...plotBox([
      ['collect many comparable cases', BLUE],
      'record each predicted chance',
      'record each actual outcome'
    ], BLUE),
    ...say('WE NEED MANY MORE PREDICTIONS AND REAL OUTCOMES')
  );

  // ------------------------------------------------------------
  // 54: Final recap.
  //
  // Retain:
  //   - all four observed calibration points;
  //   - exact group sizes beside every point;
  //   - the perfect-agreement diagonal;
  //   - the actual failure counts in the table;
  //   - a warning about the small sample.
  //
  // Do not connect the observed dots.
  // Do not assert good or bad overall calibration.
  // ------------------------------------------------------------

  const finalNote = text(
    'Too few pumps for a confident calibration judgment',
    P ? 15 : 15,
    AMBER,
    TABLE_X,
    P ? -5.75 : 1.78,
    false,
    TABLE_W - 0.15
  );

  await until(S(54));
  await play(
    ...fadeOut(morePicture),
    ...showTable(true),
    new M.FadeIn(finalNote),
    new M.Indicate(
      perfectLine,
      { color: GREEN }
    ),
    ...plotBox([
      ['PROBABILITY CALIBRATION', VIOLET],
      ['predicted chances', BLUE],
      ['compared with observed frequencies', WHITE]
    ], VIOLET),
    ...say('DO CHANCES AGREE WITH REAL FREQUENCIES?', VIOLET)
  );

  // Hold the completed calibration plot until narration ends.
  await until(E(54));
}

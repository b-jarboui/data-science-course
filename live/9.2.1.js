// lesson 9.2.1
// Functions and slope — live manim-web lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Shared chapter example: middle rent fixed at 10.
// Layout and animation API follow the supplied reference.
// Browser playback and rendering have not been tested against the actual engine.

export default async function (L) {
  const {
    M, sc, P, FW, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // SHARED DATA
  // ------------------------------------------------------------

  const AREAS = [40, 50, 60];
  const STEPS = [-1, 0, 1];
  const RENTS = [9, 11, 13];
  const NAMES = ['SMALL', 'MIDDLE', 'LARGE'];

  const GOLD = C.amber;
  const PINK = C.pink || '#F472B6';
  const COLORS = [C.cyan, C.ink, PINK];

  const MIDDLE = 10;

  const predict = (s, m = MIDDLE) =>
    STEPS.map(x => m + s * x);

  const misses = (s, m = MIDDLE) =>
    predict(s, m).map((v, k) => v - RENTS[k]);

  const squares = (s, m = MIDDLE) =>
    misses(s, m).map(v => v * v);

  const loss = s => 3 + 2 * (s - 2) ** 2;

  const LOSSES = [0, 1, 2, 3, 4].map(loss);

  const signed = n =>
    n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';

  const stepLabel = n =>
    n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  // Phone: 8 × 14.22, usable y = −5.5 to 4.3.
  // Laptop: 14.22 × 8, usable y = −3.0 to 2.3.

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.15, 0] : [CX, 1.93, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.25, -0.25, 0];

  const GX0 = CX - (P ? 2.65 : 2.65);
  const GX1 = CX + (P ? 2.65 : 2.65);
  const GY0 = P ? -4.0 : -2.20;
  const GY1 = P ? 1.15 : 1.10;

  const BOX_MAX = P ? FW - 1.2 : 4.15;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // ------------------------------------------------------------
  // SMALL DRAWING HELPERS
  // ------------------------------------------------------------

  function txt(s, size, color, p, mono = false, maxw = null) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);
    return t;
  }

  function line(a, b, color = C.muted, width = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function dash(a, b, color = C.muted, width = 2) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(w, h, p, color, opacity = 0, sw = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(p);
    return r;
  }

  function rounded(w, h, p, color, opacity = 0.95) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);
    return r;
  }

  function dot(p, color = C.cyan, radius = 0.10) {
    return new M.Dot({
      point: p,
      radius,
      color
    });
  }

  function glowDot(p, color = C.cyan, radius = 0.105) {
    const outer = new M.Dot({
      point: p,
      radius: radius * 2.65,
      color
    });

    outer.setFill(color, 0.10);

    const inner = new M.Dot({
      point: p,
      radius: radius * 1.70,
      color
    });

    inner.setFill(color, 0.22);

    const core = dot(p, color, radius);

    return new M.VGroup(outer, inner, core);
  }

  function ring(p, color = GOLD, radius = 0.20) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo(p);
    return r;
  }

  // An arrow constructed from ordinary Line objects.
  // All parts are positioned before the group reaches the scene.

  function arrow(a, b, color = GOLD, width = 3, head = 0.12) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.0001) {
      return ring(a, color, 0.12);
    }

    const ux = dx / len;
    const uy = dy / len;
    const h = Math.min(head, len * 0.38);

    const q1 = [
      b[0] - ux * h - uy * h * 0.60,
      b[1] - uy * h + ux * h * 0.60,
      0
    ];

    const q2 = [
      b[0] - ux * h + uy * h * 0.60,
      b[1] - uy * h - ux * h * 0.60,
      0
    ];

    return new M.VGroup(
      line(a, b, color, width),
      line(b, q1, color, width),
      line(b, q2, color, width)
    );
  }

  const fade = (...objects) =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  // ------------------------------------------------------------
  // FORMULA BOX
  // ------------------------------------------------------------

  let boxNow = null;

  function swapBox(g) {
    const a = [];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    if (g) {
      a.push(new M.FadeIn(g));
    }

    boxNow = g;
    return a;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 21;
    const lh = P ? 0.35 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T('0000000000', size, C.ink, true)
      .getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

    const r = rounded(wd, ht, BOXP, color);

    const left = BOXP[0] - wd / 2 + 0.325;
    const top = BOXP[1] + ht / 2 - 0.15 - lh / 2;

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

    if (wd > BOX_MAX) {
      g.scale(BOX_MAX / wd);
    }

    return swapBox(g);
  }

  function clearBox() {
    return swapBox(null);
  }

  // Visual representation of squared misses:
  // 1 × 1, 1 × 1, and 3 × 3 unit squares.

  function squareBox(values) {
    const wd = P ? Math.min(FW - 1.2, 5.45) : 4.05;
    const ht = 1.65;

    const r = rounded(wd, ht, BOXP, GOLD);

    const title = txt(
      'SQUARED MISSES',
      17,
      GOLD,
      [BOXP[0], BOXP[1] + 0.57, 0],
      true,
      wd - 0.45
    );

    const items = [r, title];

    values.forEach((v, k) => {
      const n = Math.abs(v);
      const cx = BOXP[0] + (k - 1) * wd / 3;
      const cy = BOXP[1] - 0.02;
      const cell = 0.205;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          items.push(rect(
            cell * 0.91,
            cell * 0.91,
            [
              cx + (i - (n - 1) / 2) * cell,
              cy + (j - (n - 1) / 2) * cell,
              0
            ],
            COLORS[k],
            0.80,
            1
          ));
        }
      }

      if (n === 0) {
        items.push(ring(
          [cx, cy, 0],
          COLORS[k],
          0.065
        ));
      }

      items.push(txt(
        `${n} × ${n} = ${n * n}`,
        16,
        COLORS[k],
        [cx, BOXP[1] - 0.56, 0],
        true,
        wd / 3 - 0.12
      ));
    });

    return swapBox(new M.VGroup(...items));
  }

  // ------------------------------------------------------------
  // APARTMENT LISTING PICTURE
  // ------------------------------------------------------------

  function apartment(p, w, h, color) {
    const items = [];

    items.push(rect(w, h, p, color, 0.10, 2));

    const winW = w * 0.18;
    const winH = h * 0.20;

    for (const i of [-1, 1]) {
      for (const j of [-1, 1]) {
        items.push(rect(
          winW,
          winH,
          [
            p[0] + i * w * 0.23,
            p[1] + j * h * 0.23,
            0
          ],
          color,
          0.64,
          1
        ));
      }
    }

    items.push(rect(
      w * 0.19,
      h * 0.30,
      [
        p[0],
        p[1] - h * 0.35,
        0
      ],
      color,
      0.70,
      1
    ));

    return new M.VGroup(...items);
  }

  const CARD_SP = P ? 2.05 : 1.95;
  const CARD_W = P ? 1.84 : 1.78;
  const CARD_Y = P ? -0.65 : -0.48;
  const CARD_H = 3.15;

  const cardX = k => CX + (k - 1) * CARD_SP;

  const cards = NAMES.map((name, k) => {
    const x = cardX(k);
    const c = COLORS[k];

    const r = rounded(
      CARD_W,
      CARD_H,
      [x, CARD_Y, 0],
      c
    );

    const nameText = txt(
      name,
      17,
      c,
      [x, CARD_Y + 1.22, 0],
      true,
      CARD_W - 0.20
    );

    const icon = apartment(
      [x, CARD_Y + 0.48, 0],
      [0.69, 0.84, 0.99][k],
      [0.80, 0.99, 1.17][k],
      c
    );

    return new M.VGroup(r, nameText, icon);
  });

  const areas = AREAS.map((v, k) =>
    txt(
      `${v} m²`,
      21,
      COLORS[k],
      [cardX(k), CARD_Y - 0.34, 0],
      true
    )
  );

  const stepTexts = STEPS.map((v, k) =>
    txt(
      `step ${stepLabel(v)}`,
      18,
      COLORS[k],
      [cardX(k), CARD_Y - 0.78, 0],
      true,
      CARD_W - 0.15
    )
  );

  const dollars = RENTS.map((v, k) =>
    txt(
      `$${(v * 100).toLocaleString('en-US')}`,
      21,
      COLORS[k],
      [cardX(k), CARD_Y - 1.20, 0],
      true,
      CARD_W - 0.15
    )
  );

  const hundreds = RENTS.map((v, k) =>
    txt(
      String(v),
      26,
      COLORS[k],
      [cardX(k), CARD_Y - 1.20, 0],
      true
    )
  );

  const stepArrows = [0, 1].map(k => {
    const y = CARD_Y + CARD_H / 2 + 0.22;

    const a = arrow(
      [cardX(k) + 0.47, y, 0],
      [cardX(k + 1) - 0.47, y, 0],
      GOLD,
      2
    );

    const t = txt(
      '+10 m²',
      15,
      GOLD,
      [(cardX(k) + cardX(k + 1)) / 2, y + 0.18, 0],
      true
    );

    return new M.VGroup(a, t);
  });

  // ------------------------------------------------------------
  // 0 — The question: guess the rent from the apartment's size.
  // ------------------------------------------------------------

  const introIcon = apartment(
    [CX, P ? -0.35 : -0.05, 0],
    1.7,
    1.95,
    C.cyan
  );

  const introText = txt(
    'Apartment size  →  Monthly rent?',
    P ? 23 : 24,
    C.ink,
    [CX, P ? -1.85 : -1.55, 0],
    false,
    P ? FW - 1.2 : 6.2
  );

  await until(S(0));

  await play(
    new M.FadeIn(introIcon),
    new M.FadeIn(introText),
    ...say('CAN SIZE PREDICT RENT?')
  );

  // ------------------------------------------------------------
  // 1 — Three apartment listings.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...fade(introIcon, introText),
    new M.LaggedStart(
      cards.map(g => new M.FadeIn(g)),
      { lagRatio: 0.18, runTime: 1.30 }
    ),
    ...say('THREE APARTMENTS')
  );

  // ------------------------------------------------------------
  // 2 — One size step = ten square metres.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    new M.LaggedStart(
      areas.map(t => new M.FadeIn(t)),
      { lagRatio: 0.15, runTime: 1.1 }
    ),
    ...stepArrows.map(a => new M.FadeIn(a)),
    ...say('1 SIZE STEP = 10 m²', GOLD)
  );

  // ------------------------------------------------------------
  // 3 — Count the steps from the middle apartment.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...fade(...stepArrows),
    new M.LaggedStart(
      stepTexts.map(t => new M.FadeIn(t)),
      { lagRatio: 0.16, runTime: 1.2 }
    ),
    new M.Indicate(stepTexts[1], { color: GOLD }),
    ...say('COUNT FROM THE MIDDLE', C.violet)
  );

  // ------------------------------------------------------------
  // 4 — The real monthly rents.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    new M.LaggedStart(
      dollars.map(t => new M.FadeIn(t)),
      { lagRatio: 0.18, runTime: 1.3 }
    ),
    ...say('ACTUAL MONTHLY RENT', C.green)
  );

  // ------------------------------------------------------------
  // 5 — Measure rent in hundreds of dollars.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    ...dollars.map((t, k) =>
      new M.Transform(t, hundreds[k])
    ),
    ...say('RENT IN HUNDREDS OF DOLLARS', C.green),
    ...fbox([
      '$900  → 9',
      '$1100 → 11',
      '$1300 → 13'
    ], C.green)
  );

  // ------------------------------------------------------------
  // RENT-VERSUS-SIZE GRID
  // ------------------------------------------------------------

  const rX = x =>
    GX0 + ((x + 1.55) / 3.10) * (GX1 - GX0);

  const rY = y =>
    GY0 + ((y - 5.5) / 9.0) * (GY1 - GY0);

  const rp = (x, y) => [rX(x), rY(y), 0];

  function rentGrid() {
    const items = [];

    for (const v of [6, 8, 10, 12, 14]) {
      items.push(line(
        [GX0, rY(v), 0],
        [GX1, rY(v), 0],
        C.muted,
        0.8
      ));

      items.push(txt(
        String(v),
        17,
        C.muted,
        [GX0 - 0.28, rY(v), 0],
        true
      ));
    }

    for (const v of STEPS) {
      items.push(line(
        [rX(v), GY0, 0],
        [rX(v), GY1, 0],
        C.muted,
        0.8
      ));

      items.push(txt(
        stepLabel(v),
        18,
        C.ink,
        [rX(v), GY0 - 0.26, 0],
        true
      ));
    }

    items.push(line(
      [GX0, GY0, 0],
      [GX1 + 0.13, GY0, 0],
      C.muted,
      2.5
    ));

    items.push(line(
      [GX0, GY0, 0],
      [GX0, GY1 + 0.09, 0],
      C.muted,
      2.5
    ));

    items.push(txt(
      'rent (hundreds of dollars)',
      18,
      C.muted,
      [CX, GY1 + 0.30, 0],
      false,
      GX1 - GX0
    ));

    items.push(txt(
      'size step',
      18,
      C.muted,
      [CX, GY0 - 0.60, 0]
    ));

    return new M.VGroup(...items);
  }

  const rentAxes = rentGrid();

  const rentDots = STEPS.map((s, k) =>
    glowDot(rp(s, RENTS[k]), COLORS[k], 0.11)
  );

  const realLabels = STEPS.map((s, k) =>
    txt(
      String(RENTS[k]),
      19,
      COLORS[k],
      [rX(s) - 0.30, rY(RENTS[k]) + 0.16, 0],
      true
    )
  );

  function rentRule(s, m = MIDDLE) {
    return line(
      rp(-1.10, m - 1.10 * s),
      rp(1.10, m + 1.10 * s),
      GOLD,
      4.5
    );
  }

  function predictionDots(s, m = MIDDLE) {
    const vals = predict(s, m);

    return new M.VGroup(
      ...STEPS.map((x, k) =>
        dot(rp(x, vals[k]), GOLD, 0.075)
      )
    );
  }

  function residuals(s, m = MIDDLE, labels = true) {
    const vals = predict(s, m);
    const errs = misses(s, m);
    const items = [];

    STEPS.forEach((x, k) => {
      const actual = rp(x, RENTS[k]);
      const guess = rp(x, vals[k]);

      if (errs[k] === 0) {
        items.push(ring(actual, C.green, 0.17));
      } else {
        items.push(arrow(
          actual,
          guess,
          C.violet,
          3,
          0.12
        ));
      }

      if (labels) {
        const yy = errs[k] === 0
          ? actual[1] + 0.25
          : (actual[1] + guess[1]) / 2;

        items.push(txt(
          signed(errs[k]),
          20,
          errs[k] === 0 ? C.green : C.violet,
          [rX(x) + 0.36, yy, 0],
          true
        ));
      }
    });

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // 6 — Convert the listings into three glowing data dots.
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...fade(
      ...cards,
      ...areas,
      ...stepTexts,
      ...dollars
    ),
    ...clearBox(),
    new M.FadeIn(rentAxes),
    new M.LaggedStart(
      rentDots.map((g, k) =>
        new M.FadeIn(
          new M.VGroup(g, realLabels[k])
        )
      ),
      { lagRatio: 0.17, runTime: 1.5 }
    ),
    ...say('EACH DOT = ONE APARTMENT')
  );

  // ------------------------------------------------------------
  // 7 — The prediction rule is a straight line.
  // ------------------------------------------------------------

  let rule = rentRule(2, 11);

  await until(S(7));

  await play(
    new M.Create(rule),
    ...say('OUR RULE IS A STRAIGHT LINE', GOLD)
  );

  // ------------------------------------------------------------
  // 8 — First number: middle rent.
  // ------------------------------------------------------------

  let pivot = ring(rp(0, 11), GOLD, 0.22);

  const middleGuide = dash(
    [GX0, rY(11), 0],
    rp(0, 11),
    GOLD,
    2
  );

  await until(S(8));

  await play(
    new M.Create(middleGuide),
    new M.FadeIn(pivot),
    ...say('NUMBER 1: MIDDLE RENT', GOLD),
    ...fbox([
      'middle rent',
      ['guess at size step 0', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 9 — Second number: step price.
  // Show one step across and two rent units up.
  // ------------------------------------------------------------

  const rentRun = arrow(
    rp(0, 11),
    rp(1, 11),
    C.cyan,
    2.7
  );

  const rentRise = arrow(
    rp(1, 11),
    rp(1, 13),
    GOLD,
    2.7
  );

  const rentRunLabel = txt(
    '+1 size step',
    16,
    C.cyan,
    [
      (rX(0) + rX(1)) / 2,
      rY(11) - 0.24,
      0
    ],
    true
  );

  const rentRiseLabel = txt(
    '+2',
    18,
    GOLD,
    [rX(1) + 0.35, rY(12), 0],
    true
  );

  await until(S(9));

  await play(
    new M.FadeOut(middleGuide),
    new M.FadeIn(rentRun),
    new M.FadeIn(rentRise),
    new M.FadeIn(rentRunLabel),
    new M.FadeIn(rentRiseLabel),
    ...say('NUMBER 2: STEP PRICE', C.cyan),
    ...fbox([
      'step price',
      ['extra rent for', C.cyan],
      ['each size step', C.cyan]
    ], C.cyan)
  );

  // ------------------------------------------------------------
  // 10 — Fix the middle rent at ten.
  // ------------------------------------------------------------

  const fixedGuide = dash(
    [GX0, rY(10), 0],
    rp(0, 10),
    GOLD,
    2
  );

  await until(S(10));

  await play(
    ...fade(
      rentRun,
      rentRise,
      rentRunLabel,
      rentRiseLabel
    ),
    new M.Transform(rule, rentRule(2, 10)),
    new M.Transform(pivot, ring(rp(0, 10), GOLD, 0.22)),
    new M.Create(fixedGuide),
    ...say('HOLD MIDDLE RENT AT 10', GOLD),
    ...fbox([
      ['middle rent = 10', GOLD],
      '             = $1000',
      ['held fixed', C.muted]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 11 — Step price zero: the starting flat line.
  // ------------------------------------------------------------

  let guesses = predictionDots(0);
  let missMarks = null;

  await until(S(11));

  await play(
    new M.FadeOut(fixedGuide),
    new M.Transform(rule, rentRule(0)),
    new M.FadeIn(guesses),
    ...say('STEP PRICE = 0: FLAT LINE', GOLD),
    ...fbox([
      'middle rent = 10',
      'step price  = 0',
      ['guesses: 10, 10, 10', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 12 — The miss is guess minus actual rent.
  // Draw the three vertical errors before displaying the numbers.
  // ------------------------------------------------------------

  missMarks = residuals(0, MIDDLE, false);

  await until(S(12));

  await play(
    new M.FadeOut(pivot),
    new M.FadeIn(missMarks),
    ...say('MISS = THE SIGNED GAP', C.violet),
    ...fbox([
      'miss = guess',
      '       − real rent'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 13 — Misses: +1, −1, −3.
  // ------------------------------------------------------------

  const firstSignedMisses = residuals(0);

  await until(S(13));

  await play(
    new M.FadeOut(missMarks),
    new M.FadeIn(firstSignedMisses),
    ...say('MISSES: +1, −1, −3', C.violet),
    ...fbox([
      ['10 − 9  = +1', COLORS[0]],
      ['10 − 11 = −1', COLORS[1]],
      ['10 − 13 = −3', COLORS[2]]
    ], C.violet)
  );

  missMarks = firstSignedMisses;

  // ------------------------------------------------------------
  // 14 — Square each miss.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...squareBox(misses(0)),
    ...say('SQUARE = MULTIPLY BY ITSELF', GOLD)
  );

  // ------------------------------------------------------------
  // 15 — A three-unit miss creates nine square units.
  // The sign disappears when a miss is squared.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    new M.Indicate(boxNow, { color: GOLD }),
    ...say('BIG MISSES COUNT MORE', GOLD)
  );

  // ------------------------------------------------------------
  // 16 — Sum of squared misses = loss.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...fbox([
      'squared misses',
      '1 + 1 + 9',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('SMALLER LOSS = BETTER LINE', C.green)
  );

  // ------------------------------------------------------------
  // Helper for the subsequent step-price trials.
  // ------------------------------------------------------------

  function trial(s, showMisses = true) {
    const nextGuesses = predictionDots(s);
    const nextMisses = showMisses ? residuals(s) : null;

    const a = [
      new M.Transform(rule, rentRule(s)),
      new M.FadeOut(guesses),
      new M.FadeIn(nextGuesses)
    ];

    if (missMarks) {
      a.push(new M.FadeOut(missMarks));
    }

    if (nextMisses) {
      a.push(new M.FadeIn(nextMisses));
    }

    guesses = nextGuesses;
    missMarks = nextMisses;

    return a;
  }

  // ------------------------------------------------------------
  // 17 — Step price one: guesses 9, 10, 11.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...trial(1, false),
    ...say('TRY STEP PRICE = 1', GOLD),
    ...fbox([
      'middle rent = 10',
      'step price  = 1',
      ['guesses: 9, 10, 11', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 18 — Calculate the new loss: 5.
  // ------------------------------------------------------------

  missMarks = residuals(1);

  await until(S(18));

  await play(
    new M.FadeIn(missMarks),
    ...fbox([
      ['misses: 0, −1, −2', C.violet],
      'squares: 0, 1, 4',
      ['0 + 1 + 4 = 5', GOLD],
      ['loss = 5', C.green]
    ], C.green),
    ...say('LOSS FALLS: 11 → 5', C.green)
  );

  // ------------------------------------------------------------
  // 19 — Step price two: every miss is −1.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...trial(2),
    ...fbox([
      'guesses: 8, 10, 12',
      ['misses: −1, −1, −1', C.violet],
      'squares: 1, 1, 1',
      ['loss = 3', C.green]
    ], C.green),
    ...say('STEP PRICE = 2: LOSS = 3', C.green)
  );

  // ------------------------------------------------------------
  // 20 — Try step prices three and four.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...trial(3),
    ...fbox([
      'step price = 3',
      ['misses: −2, −1, 0', C.violet],
      '4 + 1 + 0',
      ['loss = 5', GOLD]
    ], GOLD),
    ...say('STEP PRICE = 3: LOSS = 5', GOLD)
  );

  await until(S(20) + 2.45);

  await play(
    ...trial(4),
    ...fbox([
      'step price = 4',
      ['misses: −3, −1, +1', C.violet],
      '9 + 1 + 1',
      ['loss = 11', GOLD]
    ], GOLD),
    ...say('STEP PRICE = 4: LOSS = 11', GOLD)
  );

  // ------------------------------------------------------------
  // LOSS-VERSUS-STEP-PRICE GRID
  // ------------------------------------------------------------

  const lX = s =>
    GX0 + ((s + 0.35) / 4.70) * (GX1 - GX0);

  const lY = v =>
    GY0 + (v / 12.5) * (GY1 - GY0);

  const lp = (s, v = loss(s)) => [lX(s), lY(v), 0];

  function lossGrid() {
    const items = [];

    for (const v of [0, 3, 5, 8, 11]) {
      items.push(line(
        [GX0, lY(v), 0],
        [GX1, lY(v), 0],
        C.muted,
        v === 0 ? 2.5 : 0.8
      ));

      items.push(txt(
        String(v),
        17,
        C.muted,
        [GX0 - 0.28, lY(v), 0],
        true
      ));
    }

    for (let s = 0; s <= 4; s++) {
      items.push(line(
        [lX(s), GY0, 0],
        [lX(s), GY1, 0],
        C.muted,
        0.8
      ));

      items.push(txt(
        String(s),
        18,
        C.ink,
        [lX(s), GY0 - 0.25, 0],
        true
      ));
    }

    items.push(line(
      [GX0, GY0, 0],
      [GX0, GY1 + 0.10, 0],
      C.muted,
      2.5
    ));

    items.push(txt(
      'loss',
      20,
      C.muted,
      [CX, GY1 + 0.30, 0]
    ));

    items.push(txt(
      'step price',
      18,
      C.muted,
      [CX, GY0 - 0.60, 0]
    ));

    return new M.VGroup(...items);
  }

  function lossCurve(a = 0, b = 4, color = C.cyan, n = 64) {
    const halo = [];
    const core = [];

    for (let i = 0; i < n; i++) {
      const s0 = a + (b - a) * i / n;
      const s1 = a + (b - a) * (i + 1) / n;

      halo.push(line(
        lp(s0),
        lp(s1),
        color,
        6
      ));

      core.push(line(
        lp(s0),
        lp(s1),
        color,
        2.8
      ));
    }

    // Muted outer stroke plus bright inner stroke.
    // The curve consists only of reference-supported Line objects.

    halo.forEach(m => m.setColor(C.card));

    return new M.VGroup(...halo, ...core);
  }

  const lossAxes = lossGrid();
  const curve = lossCurve();

  const lossDots = LOSSES.map((v, s) =>
    glowDot(lp(s, v), C.cyan, 0.095)
  );

  const lossLabels = LOSSES.map((v, s) =>
    txt(
      String(v),
      19,
      C.cyan,
      [
        lX(s) + [0, -0.34, 0, -0.34, 0][s],
        lY(v) + [0.38, -0.30, 0.38, 0.30, 0.38][s],
        0
      ],
      true
    )
  );

  const lossPairs = LOSSES.map((_, s) =>
    new M.VGroup(lossDots[s], lossLabels[s])
  );

  // ------------------------------------------------------------
  // 21 — A new picture: step price across, loss up.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...fade(
      rentAxes,
      ...rentDots,
      ...realLabels,
      rule,
      guesses,
      missMarks
    ),
    new M.FadeIn(lossAxes),
    ...say('NEW PICTURE: STEP PRICE → LOSS'),
    ...fbox([
      'step price | loss',
      '0, 1, 2, 3, 4',
      ['11, 5, 3, 5, 11', C.cyan]
    ], C.cyan)
  );

  missMarks = null;

  // ------------------------------------------------------------
  // 22 — Five points make a U shape.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    new M.LaggedStart(
      lossPairs.map(g => new M.FadeIn(g)),
      { lagRatio: 0.19, runTime: 1.8 }
    ),
    ...say('THE LOSS MAKES A U SHAPE', C.cyan)
  );

  await play(
    new M.FadeIn(curve),
    ...fbox([
      ['loss: 11, 5, 3, 5, 11', C.cyan],
      ['middle rent = 10', C.muted]
    ])
  );

  // ------------------------------------------------------------
  // 23 — A function: one output for each input.
  // ------------------------------------------------------------

  const inputGuide = dash(
    lp(2, 0),
    lp(2),
    GOLD,
    2
  );

  const outputGuide = dash(
    [GX0, lY(3), 0],
    lp(2),
    C.green,
    2
  );

  let functionRing = ring(lp(2), GOLD, 0.19);

  await until(S(23));

  await play(
    new M.Create(inputGuide),
    new M.Create(outputGuide),
    new M.FadeIn(functionRing),
    ...say('FUNCTION = ONE OUTPUT PER INPUT', C.green),
    ...fbox([
      ['input:  2', GOLD],
      '      ↓',
      ['output: 3', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 24 — Our input is step price; our output is loss.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    new M.Indicate(lossPairs[2], { color: C.green }),
    ...fbox([
      ['input:  step price', GOLD],
      '        ↓',
      ['output: loss', C.green]
    ], C.green),
    ...say('STEP PRICE IN, LOSS OUT', C.green)
  );

  // ------------------------------------------------------------
  // AVERAGE CHANGE HELPERS
  // ------------------------------------------------------------

  let slopeNow = null;

  function clearSlope() {
    if (!slopeNow) return [];

    const a = [new M.FadeOut(slopeNow)];
    slopeNow = null;
    return a;
  }

  function putSlope(g) {
    const a = clearSlope();

    a.push(new M.FadeIn(g));
    slopeNow = g;

    return a;
  }

  function runPart(a, b, withLabel = true) {
    const ya = loss(a);
    const p0 = lp(a, ya);
    const p1 = lp(b, ya);

    const items = [
      arrow(p0, p1, GOLD, 3.0, 0.12)
    ];

    if (withLabel) {
      items.push(txt(
        `+${b - a}`,
        19,
        GOLD,
        [
          (p0[0] + p1[0]) / 2,
          p0[1] + 0.26,
          0
        ],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  function risePart(a, b, withLabel = true) {
    const ya = loss(a);
    const yb = loss(b);
    const dv = yb - ya;

    const corner = lp(b, ya);
    const end = lp(b, yb);
    const c = dv < 0 ? C.violet : C.green;

    const items = [
      arrow(corner, end, c, 3.2, 0.12)
    ];

    if (withLabel) {
      items.push(txt(
        signed(dv),
        20,
        c,
        [
          lX(b) + (b === 4 ? -0.42 : 0.42),
          (corner[1] + end[1]) / 2,
          0
        ],
        true
      ));
    }

    return new M.VGroup(...items);
  }

  function secant(a, b, color = GOLD) {
    return line(lp(a), lp(b), color, 4.0);
  }

  function intervalRings(a, b, color = GOLD) {
    return new M.VGroup(
      ring(lp(a), color, 0.18),
      ring(lp(b), color, 0.18)
    );
  }

  function slopeTriangle(a, b, withChord = true) {
    const items = [
      runPart(a, b),
      risePart(a, b),
      intervalRings(a, b)
    ];

    if (withChord) {
      items.push(secant(a, b));
    }

    return new M.VGroup(...items);
  }

  // ------------------------------------------------------------
  // 25 — How fast does the loss change?
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...fade(
      inputGuide,
      outputGuide,
      functionRing
    ),
    ...clearBox(),
    ...say('HOW FAST DOES THE LOSS CHANGE?', GOLD)
  );

  // ------------------------------------------------------------
  // 26 — Move the input from zero to one.
  // ------------------------------------------------------------

  let firstRun = runPart(0, 1);
  let firstRings = intervalRings(0, 1);
  let firstRise = null;
  let firstChord = null;

  await until(S(26));

  await play(
    new M.FadeIn(firstRun),
    new M.FadeIn(firstRings),
    ...say('STEP PRICE: 0 → 1', GOLD)
  );

  // ------------------------------------------------------------
  // 27 — Loss falls from eleven to five.
  // ------------------------------------------------------------

  firstRise = risePart(0, 1);

  await until(S(27));

  await play(
    new M.FadeIn(firstRise),
    ...say('LOSS: 11 → 5', C.violet),
    ...fbox([
      'change in loss',
      ['5 − 11 = −6', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 28 — Six down for one across.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    new M.Indicate(firstRun, { color: GOLD }),
    new M.Indicate(firstRise, { color: C.violet }),
    ...fbox([
      ['change in loss = −6', C.violet],
      ['change in input = 1', GOLD],
      ['−6 ÷ 1 = −6', C.violet]
    ], C.violet),
    ...say('−6 LOSS FOR EACH +1 INPUT', C.violet)
  );

  // ------------------------------------------------------------
  // 29 — The average change is the steepness of the straight path.
  // ------------------------------------------------------------

  firstChord = secant(0, 1);

  await until(S(29));

  await play(
    new M.Create(firstChord),
    ...say('AVERAGE CHANGE = −6', GOLD),
    ...fbox([
      'average change',
      '(5 − 11) ÷ (1 − 0)',
      ['= −6', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 30 — Name the steepness: slope.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    new M.Indicate(firstChord, { color: GOLD }),
    ...say('SLOPE = STEEPNESS OF THE LOSS', GOLD),
    ...fbox([
      'slope of the loss',
      ['0 → 1: −6', GOLD]
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 31 — Keep the two ideas separate.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...fbox([
      ['RENT LINE', C.cyan],
      'tilt = step price',
      ['LOSS PICTURE', GOLD],
      'steepness = slope'
    ], C.cyan),
    ...say('STEP PRICE ≠ LOSS SLOPE', C.cyan)
  );

  // ------------------------------------------------------------
  // 32 — From one to two: loss drops by two.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...fade(
      firstRun,
      firstRise,
      firstChord,
      firstRings
    ),
    ...putSlope(slopeTriangle(1, 2)),
    ...fbox([
      'input: 1 → 2',
      'loss:  5 → 3',
      '(3 − 5) ÷ 1',
      ['average change = −2', C.violet]
    ], C.violet),
    ...say('1 → 2: AVERAGE CHANGE = −2', C.violet)
  );

  // ------------------------------------------------------------
  // 33 — The second slope is gentler.
  // ------------------------------------------------------------

  const earlierChord = secant(0, 1, C.muted);

  const earlierLabel = txt(
    '−6',
    17,
    C.muted,
    [
      (lX(0) + lX(1)) / 2 - 0.18,
      (lY(11) + lY(5)) / 2 - 0.22,
      0
    ],
    true
  );

  await until(S(33));

  await play(
    new M.Create(earlierChord),
    new M.FadeIn(earlierLabel),
    ...fbox([
      '0 → 1: −6',
      ['1 → 2: −2', C.green],
      ['still downhill, gentler', C.muted]
    ], C.green),
    ...say('STILL DOWNHILL, BUT GENTLER', C.green)
  );

  // ------------------------------------------------------------
  // 34 — From three to four: loss climbs by six.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...fade(earlierChord, earlierLabel),
    ...putSlope(slopeTriangle(3, 4)),
    ...fbox([
      'input: 3 → 4',
      'loss:  5 → 11',
      '(11 − 5) ÷ 1',
      ['average change = +6', C.green]
    ], C.green),
    ...say('3 → 4: AVERAGE CHANGE = +6', C.green)
  );

  // ------------------------------------------------------------
  // 35 — Negative means downhill; positive means uphill.
  // ------------------------------------------------------------

  const downhill = new M.VGroup(
    secant(0, 1, C.violet),
    arrow(lp(0), lp(1), C.violet, 3.2),
    txt(
      '−6',
      21,
      C.violet,
      [
        (lX(0) + lX(1)) / 2 - 0.19,
        (lY(11) + lY(5)) / 2 - 0.27,
        0
      ],
      true
    )
  );

  const uphill = new M.VGroup(
    secant(3, 4, C.green),
    arrow(lp(3), lp(4), C.green, 3.2),
    txt(
      '+6',
      21,
      C.green,
      [
        (lX(3) + lX(4)) / 2 + 0.19,
        (lY(5) + lY(11)) / 2 - 0.27,
        0
      ],
      true
    )
  );

  await until(S(35));

  await play(
    ...clearSlope(),
    new M.FadeIn(downhill),
    new M.FadeIn(uphill),
    ...fbox([
      ['−  loss goes down', C.violet],
      ['+  loss goes up', C.green]
    ], C.cyan),
    ...say('MINUS = DOWN    PLUS = UP')
  );

  // ------------------------------------------------------------
  // 36 — The general formula.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...fade(downhill, uphill),
    ...putSlope(slopeTriangle(0, 1)),
    ...fbox([
      ['average change', GOLD],
      '  change in output',
      '  ────────────────',
      '  change in input'
    ], GOLD),
    ...say('AVERAGE CHANGE = RISE ÷ RUN', GOLD)
  );

  // ------------------------------------------------------------
  // 37 — Read the formula in everyday language.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...fbox([
      ['how much loss moved', C.violet],
      '───────────────────',
      ['how much input moved', GOLD],
      ['−6 ÷ 1 = −6', C.ink]
    ], C.cyan),
    ...say('LOSS CHANGE PER ONE INPUT STEP', C.cyan)
  );

  // ------------------------------------------------------------
  // 38 — Use the average change to choose a promising move.
  // ------------------------------------------------------------

  const usefulMove = arrow(
    lp(0),
    lp(1),
    C.green,
    4
  );

  await until(S(38));

  await play(
    ...clearSlope(),
    new M.FadeIn(usefulMove),
    ...fbox([
      'raise step price by 1',
      ['loss drops by 6', C.green],
      ['11 → 5', C.green]
    ], C.green),
    ...say('WHICH WAY? HOW MUCH DOES IT HELP?', C.green)
  );

  // ------------------------------------------------------------
  // 39 — Trap: compare the endpoints zero and four.
  // ------------------------------------------------------------

  const longRings = intervalRings(0, 4);
  const longChord = secant(0, 4, GOLD);

  const longRun = arrow(
    [lX(0), GY0 + 0.23, 0],
    [lX(4), GY0 + 0.23, 0],
    GOLD,
    2.7
  );

  const longRunLabel = txt(
    '+4 input',
    17,
    GOLD,
    [lX(2), GY0 + 0.46, 0],
    true
  );

  await until(S(39));

  await play(
    new M.FadeOut(usefulMove),
    new M.FadeIn(longRings),
    new M.Create(longChord),
    new M.FadeIn(longRun),
    new M.FadeIn(longRunLabel),
    ...say('TRAP: COMPARE 0 ALL THE WAY TO 4', GOLD),
    ...fbox([
      'start: step price 0',
      'end:   step price 4'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 40 — Same endpoint loss: average change zero.
  // ------------------------------------------------------------

  const zeroTag = txt(
    'same height',
    17,
    GOLD,
    [lX(2), lY(11) + 0.24, 0],
    true
  );

  await until(S(40));

  await play(
    new M.FadeIn(zeroTag),
    new M.Indicate(longChord, { color: GOLD }),
    ...fbox([
      'loss: 11 → 11',
      '11 − 11 = 0',
      '0 ÷ 4 = 0',
      ['average change = 0', GOLD]
    ], GOLD),
    ...say('AVERAGE CHANGE = 0', GOLD)
  );

  // ------------------------------------------------------------
  // 41 — But the actual loss dipped, then rose.
  // ------------------------------------------------------------

  const valleyRing = ring(lp(2), C.green, 0.21);

  const valleyGuide = arrow(
    lp(2, 11),
    lp(2, 3),
    C.green,
    3,
    0.14
  );

  const valleyLabel = txt(
    'dipped to 3',
    18,
    C.green,
    [lX(2) + 0.95, lY(7), 0],
    false,
    1.8
  );

  await until(S(41));

  await play(
    new M.FadeIn(valleyRing),
    new M.FadeIn(valleyGuide),
    new M.FadeIn(valleyLabel),
    new M.Indicate(lossPairs[2], { color: C.green }),
    ...fbox([
      ['11 → 3 → 11', C.green],
      'down, then back up',
      ['not a flat loss', GOLD]
    ], C.green),
    ...say('ZERO AVERAGE DOES NOT MEAN FLAT', C.green)
  );

  // ------------------------------------------------------------
  // 42 — A long average hides the movement in between.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    new M.Indicate(curve, { color: C.cyan }),
    ...fbox([
      'same endpoints',
      ['different losses', C.cyan],
      ['in between', C.cyan]
    ], C.cyan),
    ...say('LONG AVERAGES CAN HIDE THE MIDDLE', C.cyan)
  );

  // ------------------------------------------------------------
  // 43 — The minimum is three, not zero.
  // All three misses are −1 when the middle rent remains at 10.
  // ------------------------------------------------------------

  const minGuide = dash(
    lp(2, 0),
    lp(2, 3),
    C.green,
    2.8
  );

  const minZero = ring(
    lp(2, 0),
    C.muted,
    0.12
  );

  const minGapLabel = txt(
    '3 above zero',
    17,
    C.green,
    [lX(2) + 0.91, lY(1.45), 0],
    false,
    1.75
  );

  await until(S(43));

  await play(
    ...fade(
      longRings,
      longChord,
      longRun,
      longRunLabel,
      zeroTag,
      valleyGuide,
      valleyLabel
    ),
    new M.Create(minGuide),
    new M.FadeIn(minZero),
    new M.FadeIn(minGapLabel),
    ...fbox([
      'middle rent = 10',
      'actual middle = 11',
      '1 + 1 + 1 = 3',
      ['lowest loss here = 3', C.green]
    ], C.green),
    ...say('LOWEST LOSS = 3, NOT ZERO', C.green)
  );

  // ------------------------------------------------------------
  // 44 — Demonstrate the Try it movement.
  // The actual draggable control belongs to the Try it interface;
  // this narrated scene previews its behaviour.
  // ------------------------------------------------------------

  let movingDot = glowDot(lp(0), GOLD, 0.13);

  await until(S(44));

  await play(
    ...fade(
      valleyRing,
      minGuide,
      minZero,
      minGapLabel
    ),
    new M.FadeIn(movingDot),
    ...fbox([
      'TRY IT',
      ['move the step price', GOLD],
      ['watch the loss dot', C.cyan]
    ], GOLD),
    ...say('DRAG THE DOT ALONG THE U', GOLD)
  );

  // Sequential transforms follow the actual continuous U.
  // No overlapping play() calls and no chord shortcuts.

  const sweep = [
    0.25, 0.5, 0.75, 1,
    1.25, 1.5, 1.75, 2,
    2.25, 2.5, 2.75, 3,
    3.25, 3.5, 3.75, 4
  ];

  const moveTime = Math.min(
    0.14,
    Math.max(
      0.07,
      (E(44) - S(44) - 1.30) / sweep.length
    )
  );

  for (const s of sweep) {
    await play(
      new M.Transform(
        movingDot,
        glowDot(lp(s), GOLD, 0.13),
        { runTime: moveTime }
      )
    );
  }

  // ------------------------------------------------------------
  // 45 — Challenge: find two distinct inputs with zero average change.
  // Hint at the required equal output without selecting the answer.
  // ------------------------------------------------------------

  const challengeGuide = dash(
    [lX(0), lY(5), 0],
    [lX(4), lY(5), 0],
    GOLD,
    2
  );

  await until(S(45));

  await play(
    new M.FadeOut(movingDot),
    new M.Create(challengeGuide),
    ...fbox([
      'YOUR CHALLENGE',
      'find two step prices',
      ['average change = 0', GOLD],
      ['hint: equal losses', C.muted]
    ], GOLD),
    ...say('FIND TWO INPUTS WITH EQUAL LOSS', GOLD)
  );

  // ------------------------------------------------------------
  // 46 — Recap: function and average change.
  // ------------------------------------------------------------

  const recapChord = secant(0, 1, GOLD);
  const recapRings = intervalRings(0, 1);

  const recapRun = runPart(0, 1);
  const recapRise = risePart(0, 1);

  await until(S(46));

  await play(
    new M.FadeOut(challengeGuide),
    new M.Create(recapChord),
    new M.FadeIn(recapRings),
    new M.FadeIn(recapRun),
    new M.FadeIn(recapRise),
    ...fbox(P ? [
      ['FUNCTION', C.green],
      'one input → one output',
      ['AVERAGE CHANGE', GOLD],
      'output change ÷ input change'
    ] : [
      ['FUNCTION', C.green],
      'one input,',
      'one output',
      ['AVERAGE CHANGE', GOLD],
      'output change',
      '÷ input change'
    ], C.cyan),
    ...say('FUNCTIONS TELL WHAT; SLOPES TELL HOW FAST')
  );

  await until(E(46));
}

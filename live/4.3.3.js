// lesson 4.3.3
// Cumulative distribution function — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact supplied chapter data:
// P(X = 0) = 1/4
// P(X = 2) = 1/2
// P(X = 4) = 1/4
//
// F(t) = P(X <= t)
// F(0) = 1/4, F(1) = 1/4
// F(2) = 3/4, F(3) = 3/4
// F(4) = 1
//
// The continuous-time curve and cumulative-frequency example
// are illustrative, not additional observations from the booth.
//
// Uses the approved engine API; browser playback has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Exact shared chapter data
  // ------------------------------------------------------------

  const PAYOUTS = [0, 2, 4];
  const MASSES = [0.25, 0.50, 0.25];

  const FRACTIONS = ['1/4', '1/2', '1/4'];

  const OUTCOMES = [
    { name: 'Grey', payout: 0, probability: 0.25 },
    { name: 'Blue 1', payout: 2, probability: 0.25 },
    { name: 'Blue 2', payout: 2, probability: 0.25 },
    { name: 'Gold', payout: 4, probability: 0.25 }
  ];

  const CDF = t =>
    PAYOUTS.reduce(
      (sum, x, i) => sum + (x <= t ? MASSES[i] : 0),
      0
    );

  const fraction = v => {
    if (v === 0) return '0';
    if (v === 0.25) return '1/4';
    if (v === 0.50) return '1/2';
    if (v === 0.75) return '3/4';
    if (v === 1) return '1';
    return String(v);
  };

  const GOLD = '#ffc857';
  const BLUE = '#4895ef';
  const GREY = '#8b96a8';
  const PINK = C.pink || '#ff619e';
  const WHITE = '#ffffff';

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Shared visual helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

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
    x, y, w, h,
    color,
    opacity = 0,
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
    color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        0.16,
        w * 0.09,
        h * 0.09
      ),
      color,
      strokeWidth: 2
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

  function glow(
    x, y,
    color = C.cyan,
    radius = 0.095
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.3,
      color
    });

    halo.setFill(color, 0.17);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  function tag(
    s, color, x, y,
    size = 17,
    maxw = null
  ) {
    const p = pill(s, color, size);

    if (maxw !== null && p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    tip = 0.14
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),

      line(
        x2,
        y2,
        x2 - tip * Math.cos(a - Math.PI / 5),
        y2 - tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x2,
        y2,
        x2 - tip * Math.cos(a + Math.PI / 5),
        y2 - tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      )
    );
  }

  function coin(x, y, radius = 0.22) {
    return new M.VGroup(
      circle(x, y, radius * 1.35, GOLD, 0.08, 1),
      circle(x, y, radius, GOLD, 0.76),
      circle(x, y, radius * 0.73, GOLD, 0, 1),

      txt(
        '1',
        16,
        C.card,
        x,
        y,
        true,
        radius * 1.15
      )
    );
  }

  function person(x, y, scale = 1, color = C.ink) {
    return new M.VGroup(
      circle(
        x,
        y + 0.29 * scale,
        0.13 * scale,
        color
      ),

      line(
        x,
        y + 0.15 * scale,
        x,
        y - 0.18 * scale,
        color,
        3
      ),

      line(
        x,
        y + 0.05 * scale,
        x - 0.20 * scale,
        y - 0.07 * scale,
        color,
        2.5
      ),

      line(
        x,
        y + 0.05 * scale,
        x + 0.22 * scale,
        y - 0.03 * scale,
        color,
        2.5
      ),

      line(
        x,
        y - 0.18 * scale,
        x - 0.18 * scale,
        y - 0.42 * scale,
        color,
        2.5
      ),

      line(
        x,
        y - 0.18 * scale,
        x + 0.18 * scale,
        y - 0.42 * scale,
        color,
        2.5
      )
    );
  }

  // ------------------------------------------------------------
  // Top-level visibility tracking
  // ------------------------------------------------------------

  const visible = new Set();

  function put(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.FadeIn(o);
    });
  }

  function draw(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.Create(o);
    });
  }

  function take(...objects) {
    const animations = [];

    for (const o of objects) {
      if (o && visible.has(o)) {
        visible.delete(o);
        animations.push(new M.FadeOut(o));
      }
    }

    return animations;
  }

  function clearPicture() {
    const animations = Array.from(visible).map(o =>
      new M.FadeOut(o)
    );

    visible.clear();

    return animations;
  }

  function lagIn(
    objects,
    lagRatio = 0.12,
    runTime = 1.4
  ) {
    objects.forEach(o => visible.add(o));

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function replace(oldObject, newObject) {
    return [
      ...take(oldObject),
      ...put(newObject)
    ];
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.40;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.20 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.9 : 3.7;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  // ------------------------------------------------------------
  // 0: back at the fair booth
  // ------------------------------------------------------------

  // Spinner has exactly four equal quarter-circle slices:
  // grey, blue, blue, gold.
  //
  // Sectors are constructed with coloured radial strokes
  // and a circular outline. This avoids relying on any
  // additional polygon or sector-specific API.

  function spinner(cx, cy, radius) {
    const colors = [GREY, BLUE, BLUE, GOLD];
    const parts = [];

    for (let sector = 0; sector < 4; sector++) {
      const start = Math.PI / 2 + sector * Math.PI / 2;

      const rays = 42;

      for (let k = 0; k <= rays; k++) {
        const a =
          start + k / rays * Math.PI / 2;

        parts.push(
          line(
            cx,
            cy,
            cx + radius * 0.98 * Math.cos(a),
            cy + radius * 0.98 * Math.sin(a),
            colors[sector],
            3.4
          )
        );
      }
    }

    parts.push(
      circle(cx, cy, radius, C.ink, 0, 2.5)
    );

    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 2 + i * Math.PI / 2;

      parts.push(
        line(
          cx,
          cy,
          cx + radius * Math.cos(a),
          cy + radius * Math.sin(a),
          C.card,
          2.5
        )
      );
    }

    OUTCOMES.forEach((d, i) => {
      const a =
        Math.PI / 2 +
        (i + 0.5) * Math.PI / 2;

      parts.push(
        txt(
          d.payout,
          P ? 29 : 26,
          i === 3 ? C.card : WHITE,
          cx + radius * 0.58 * Math.cos(a),
          cy + radius * 0.58 * Math.sin(a),
          true
        )
      );
    });

    parts.push(
      circle(cx, cy, 0.085, C.card, 1),

      arrow(
        cx,
        cy + radius + 0.40,
        cx,
        cy + radius + 0.025,
        GOLD,
        0.13
      )
    );

    return new M.VGroup(...parts);
  }

  const boothY = P ? -1.30 : -0.46;
  const spinnerRadius = P ? 1.21 : 1.04;

  const boothSpinner = spinner(
    CX - (P ? 1.27 : 1.38),
    boothY,
    spinnerRadius
  );

  const boothFriend = person(
    CX + 1.68,
    boothY - 0.20,
    1.95,
    C.ink
  );

  const friendCoins = Array.from(
    { length: 3 },
    (_, i) =>
      coin(
        CX + 0.95 + i * 0.40,
        boothY - 1.24,
        0.15
      )
  );

  const boothSign = new M.VGroup(
    rounded(
      CX,
      P ? 0.97 : 1.19,
      P ? 5.65 : 6.00,
      0.70,
      GOLD
    ),

    txt(
      'FAIR SPINNER BOOTH',
      P ? 23 : 21,
      GOLD,
      CX,
      P ? 0.97 : 1.19
    )
  );

  await until(S(0));
  await play(
    ...put(boothSign, boothSpinner, boothFriend),
    lagIn(friendCoins, 0.12, 0.9),
    ...say('BACK AT THE SPINNER BOOTH', GOLD)
  );

  // ------------------------------------------------------------
  // 1–2: at most two means two or less
  // ------------------------------------------------------------

  const questionBubble = tag(
    'AT MOST 2 TOKENS?',
    C.amber,
    CX + 1.49,
    boothY + 1.16,
    18,
    3.2
  );

  await until(S(1));
  await play(
    ...put(questionBubble),
    ...say('WHAT IS THE CHANCE OF AT MOST TWO?', C.amber),
    ...fbox([
      ['Question', C.amber],
      'At most 2 tokens',
      'Which payouts count?'
    ], C.amber)
  );

  const CHOICE_Y = P ? -1.10 : -0.48;
  const CHOICE_SP = P ? 2.08 : 2.24;

  function payoutCard(value, index, included) {
    const x = CX + (index - 1) * CHOICE_SP;
    const color = included ? C.green : C.muted;

    const parts = [
      rounded(
        x,
        CHOICE_Y,
        1.90,
        P ? 3.10 : 2.58,
        color,
        color,
        0.07
      ),

      txt(
        value,
        P ? 41 : 35,
        color,
        x,
        CHOICE_Y + 0.78,
        true
      ),

      txt(
        'tokens',
        17,
        C.muted,
        x,
        CHOICE_Y + 0.30
      )
    ];

    for (let i = 0; i < value; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);

      parts.push(
        coin(
          x + (col - 0.5) * 0.43,
          CHOICE_Y - 0.15 - row * 0.43,
          0.17
        )
      );
    }

    if (value === 0) {
      parts.push(
        txt(
          'No coins',
          16,
          C.muted,
          x,
          CHOICE_Y - 0.30
        )
      );
    }

    parts.push(
      txt(
        included ? 'INCLUDED' : 'NOT INCLUDED',
        P ? 15 : 14,
        color,
        x,
        CHOICE_Y - (P ? 1.20 : 1.01),
        false,
        1.68
      )
    );

    return new M.VGroup(...parts);
  }

  const choices = PAYOUTS.map((v, i) =>
    payoutCard(v, i, v <= 2)
  );

  await until(S(2));
  await play(
    ...clearPicture(),
    lagIn(choices, 0.15, 1.15),
    ...say('AT MOST TWO = TWO OR LESS', C.green),
    ...fbox([
      ['X ≤ 2', C.green],
      '0 tokens: included',
      '2 tokens: included',
      '4 tokens: excluded'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Probability mass function layout
  // ------------------------------------------------------------

  const XL = CX - (P ? 2.85 : 3.25);
  const XR = CX + (P ? 3.13 : 3.45);

  // Include positions before 0 and after 4.
  const XMIN = -1.3;
  const XMAX = 5.3;

  const xx = v =>
    XL +
    (v - XMIN) / (XMAX - XMIN) *
    (XR - XL);

  const PMF_BASE = P ? -2.9 : -1.32;
  const PMF_TOP = P ? 0.9 : 0.92;

  const PMF_SCALE =
    (PMF_TOP - PMF_BASE) / 0.60;

  const pmfY = p =>
    PMF_BASE + p * PMF_SCALE;

  const BAR_W = P ? 0.67 : 0.79;

  function pmfAxes() {
    const parts = [
      line(
        XL,
        PMF_BASE,
        XR,
        PMF_BASE,
        C.muted,
        2.5
      ),

      line(
        XL,
        PMF_BASE,
        XL,
        PMF_TOP,
        C.muted,
        2.5
      ),

      txt(
        'Chance',
        P ? 18 : 17,
        C.muted,
        XL + 0.37,
        PMF_TOP + 0.23
      ),

    ];

    for (const x of [0, 1, 2, 3, 4]) {
      parts.push(
        line(
          xx(x),
          PMF_BASE,
          xx(x),
          PMF_BASE - 0.07,
          C.muted,
          1.5
        ),

        txt(
          x,
          P ? 18 : 17,
          C.muted,
          xx(x),
          PMF_BASE - 0.26,
          true
        )
      );
    }

    for (const p of [0.25, 0.50]) {
      const y = pmfY(p);

      parts.push(
        txt(
          fraction(p),
          P ? 17 : 15,
          C.muted,
          XL - 0.30,
          y,
          true
        ),

        dashed(XL, y, XR, y, C.muted)
      );
    }

    return new M.VGroup(...parts);
  }

  function pmfBar(i, color = C.cyan, opacity = 0.72) {
    const value = PAYOUTS[i];
    const probability = MASSES[i];

    const h = probability * PMF_SCALE;
    const x = xx(value);

    const halo = rect(
      x,
      PMF_BASE + h / 2,
      BAR_W + 0.11,
      h,
      color,
      0.11,
      1
    );

    const main = rect(
      x,
      PMF_BASE + h / 2,
      BAR_W,
      h,
      color,
      opacity,
      2
    );

    const divisions = [];

    // Every quarter of probability is one equal block.
    if (probability === 0.50) {
      divisions.push(
        line(
          x - BAR_W / 2,
          pmfY(0.25),
          x + BAR_W / 2,
          pmfY(0.25),
          C.card,
          2
        )
      );
    }

    const label = txt(
      FRACTIONS[i],
      P ? 24 : 22,
      color,
      x,
      PMF_BASE + h + 0.27,
      true
    );

    return new M.VGroup(
      halo,
      main,
      ...divisions,
      label
    );
  }

  // axis name kept apart so it can leave while the walker uses that space
  function pmfTitle() {
    return txt('Payout X (tokens)', P ? 18 : 17, GOLD, CX, PMF_BASE - 0.67);
  }

  function makePMF(colors = null) {
    return {
      axes: pmfAxes(),
      title: pmfTitle(),

      bars: PAYOUTS.map((_, i) =>
        pmfBar(
          i,
          colors ? colors[i] : C.cyan,
          colors && colors[i] === C.muted
            ? 0.22
            : 0.72
        )
      )
    };
  }

  function pmfObjects(pmf) {
    return [pmf.axes, pmf.title, ...pmf.bars];
  }

  // ------------------------------------------------------------
  // 3–4: the three probability bars
  // ------------------------------------------------------------

  let pmf = makePMF();

  await until(S(3));
  await play(
    ...clearPicture(),
    ...put(pmf.axes, pmf.title),
    ...say('LOOK AT THE PAYOUT BARS AGAIN'),
    ...fbox([
      'Payouts: 0, 2, 4',
      'Bar height = chance',
      ['Round one: X', C.cyan]
    ])
  );

  await until(S(4));
  await play(
    lagIn(pmf.bars, 0.20, 1.65),
    ...say('A QUARTER, A HALF, A QUARTER'),
    ...fbox([
      'P(X = 0) = 1/4',
      'P(X = 2) = 1/2',
      'P(X = 4) = 1/4',
      ['Total = 1', C.green]
    ])
  );

  // ------------------------------------------------------------
  // 5–7: add the bars at zero and two
  // ------------------------------------------------------------

  function pmfSelection(i, color = C.green) {
    const h = MASSES[i] * PMF_SCALE;

    return rounded(
      xx(PAYOUTS[i]),
      PMF_BASE + h / 2 + 0.13,
      BAR_W + 0.24,
      h + 0.65,
      color,
      color,
      0.025
    );
  }

  const includeZero = pmfSelection(0);
  const includeTwo = pmfSelection(1);

  const cutoffTwo = dashed(
    xx(2),
    PMF_BASE - 0.06,
    xx(2),
    PMF_TOP + 0.08,
    C.amber
  );

  const inclusionBracket = new M.VGroup(
    line(
      xx(0) - 0.50,
      PMF_BASE - 0.98,
      xx(2) + 0.50,
      PMF_BASE - 0.98,
      C.green,
      2.5
    ),

    line(
      xx(0) - 0.50,
      PMF_BASE - 0.98,
      xx(0) - 0.50,
      PMF_BASE - 0.84,
      C.green,
      2.5
    ),

    line(
      xx(2) + 0.50,
      PMF_BASE - 0.98,
      xx(2) + 0.50,
      PMF_BASE - 0.84,
      C.green,
      2.5
    )
  );

  await until(S(5));
  await play(
    ...draw(
      includeZero,
      includeTwo,
      cutoffTwo,
      inclusionBracket
    ),
    ...say('INCLUDE THE BARS AT ZERO AND TWO', C.green),
    ...fbox([
      ['At most 2', C.green],
      'Include X = 0',
      'Include X = 2',
      'Exclude X = 4'
    ], C.green)
  );

  // Four equal probability units make one whole.
  // The first three are selected for X <= 2.

  function probabilityUnit(
    x, y,
    included,
    color = C.green,
    size = 0.56
  ) {
    const c = included ? color : C.muted;

    return new M.VGroup(
      rounded(
        x,
        y,
        size,
        size,
        c,
        included ? c : C.card,
        included ? 0.72 : 0.30
      ),

      txt(
        '1/4',
        15,
        included ? C.card : C.muted,
        x,
        y,
        true,
        size - 0.12
      )
    );
  }

  const sumY = P ? -4.6 : -2.31;

  const threeQuarterUnits = Array.from(
    { length: 4 },
    (_, i) =>
      probabilityUnit(
        CX + (i - 1.5) * 0.66,
        sumY,
        i < 3
      )
  );

  const sumExpression = txt(
    '1/4 + 2/4 = 3/4',
    P ? 26 : 23,
    C.green,
    CX,
    sumY - (P ? 0.68 : 0.45),
    true
  );

  await until(S(6));
  await play(
    ...take(inclusionBracket),
    lagIn(threeQuarterUnits, 0.12, 1.0),
    ...put(sumExpression),
    ...say('ONE QUARTER PLUS ONE HALF', C.green),
    ...fbox([
      '1/4 + 1/2',
      '= 1/4 + 2/4',
      ['= 3/4', C.green]
    ], C.green)
  );

  await until(S(7));
  await play(
    new M.Indicate(
      sumExpression,
      { color: C.green }
    ),
    ...say('P(AT MOST TWO) = 3/4', C.green),
    ...fbox([
      ['P(X ≤ 2) = 3/4', C.green],
      'Three of four',
      'equally likely slices'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 8–10: introduce the walker and bucket
  // ------------------------------------------------------------

  // The upper picture is the original probability bars.
  // The walker travels beneath the payout axis.
  //
  // The bucket is represented by a small tray with four
  // equal compartments. Each compartment holds 1/4.
  // It collects probability mass, not the payout tokens.

  const WALK_Y = P ? -4.1 : -2.35;

  const BUCKET_Y = P ? -5.6 : -3.3;

  function walkerAt(t) {
    return person(
      xx(t),
      WALK_Y,
      P ? 0.90 : 0.76,
      GOLD
    );
  }

  function walkerPointer(t) {
    return arrow(
      xx(t),
      WALK_Y + (P ? 0.43 : 0.34),
      xx(t),
      PMF_BASE - 0.45,
      GOLD,
      0.10
    );
  }

  function bucket(total) {
    const units = Math.round(total * 4);

    const w = P ? 3.38 : 3.20;
    const h = P ? 0.81 : 0.61;

    const left = CX - w / 2;
    const bottom = BUCKET_Y - h / 2;

    const parts = [
      line(
        left,
        bottom + h,
        left + 0.12,
        bottom,
        C.green,
        2.5
      ),

      line(
        left + 0.12,
        bottom,
        left + w - 0.12,
        bottom,
        C.green,
        2.5
      ),

      line(
        left + w - 0.12,
        bottom,
        left + w,
        bottom + h,
        C.green,
        2.5
      )
    ];

    const cellW = (w - 0.38) / 4;

    for (let i = 0; i < 4; i++) {
      const x =
        CX + (i - 1.5) * cellW;

      const filled = i < units;

      parts.push(
        rect(
          x,
          BUCKET_Y,
          cellW - 0.075,
          h - 0.14,
          filled ? C.green : C.muted,
          filled ? 0.77 : 0.035,
          1.2
        )
      );

      if (filled) {
        parts.push(
          txt(
            '1/4',
            P ? 16 : 15,
            C.card,
            x,
            BUCKET_Y,
            true
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function runningTotal(total) {
    return tag(
      `TOTAL = ${fraction(total)}`,
      C.green,
      P ? CX : CX + 2.6,
      P ? -6.4 : -3.3,
      P ? 20 : 16,
      P ? 5.5 : 1.75
    );
  }

  const walkTrack = arrow(
    xx(-1.15),
    WALK_Y - 0.40,
    xx(5.10),
    WALK_Y - 0.40,
    C.muted,
    0.12
  );

  const walkTrackTitle = txt(
    'Move from left to right',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.9 : -3.05
  );

  const allPointQuestion = tag(
    'WHAT ABOUT EVERY POINT?',
    C.amber,
    CX,
    PMF_TOP + 0.34,
    17,
    5.6
  );

  await until(S(8));
  await play(
    ...take(
      includeZero,
      includeTwo,
      cutoffTwo,
      ...threeQuarterUnits,
      sumExpression
    ),
    ...put(allPointQuestion),
    ...say('ASK THE SAME QUESTION AT EVERY POINT'),
    ...fbox([
      'At most 0?',
      'At most 1?',
      'At most 2?',
      'At most any number?'
    ])
  );

  let walker = walkerAt(-1.0);
  let pointer = walkerPointer(-1.0);

  await until(S(9));
  await play(
    ...take(allPointQuestion, pmf.title),
    ...put(walker),
    ...draw(walkTrack, pointer),
    ...put(walkTrackTitle),
    ...say('A WALKER MOVES ALONG THE LINE', GOLD),
    ...fbox([
      ['Walker', GOLD],
      'Start at the left',
      'Move toward the right'
    ], GOLD)
  );

  let currentBucket = bucket(0);
  let currentTotal = runningTotal(0);

  const collectedBars = [];

  const bucketExplanation = txt(
    'Bucket holds collected chance',
    P ? 16 : 14,
    C.green,
    CX,
    P ? -4.95 : 1.27,
    false,
    6.2
  );

  await until(S(10));
  await play(
    ...take(walkTrackTitle),
    ...put(
      currentBucket,
      currentTotal,
      bucketExplanation
    ),
    ...say('COLLECT EVERY BAR YOU PASS', C.green),
    ...fbox([
      ['Bucket', C.green],
      'Holds probability mass',
      'Each block = 1/4',
      'Keep everything collected'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Walker movement and accumulation helpers
  // ------------------------------------------------------------

  let walkerPosition = -1.0;
  let collectedTotal = 0;

  function moveWalker(t, runTime = 1.05) {
    walkerPosition = t;

    return [
      new M.Transform(
        walker,
        walkerAt(t),
        { runTime }
      ),

      new M.Transform(
        pointer,
        walkerPointer(t),
        { runTime }
      )
    ];
  }

  function updateBucket(total) {
    const nextBucket = bucket(total);
    const nextTotal = runningTotal(total);

    const animations = [
      ...replace(currentBucket, nextBucket),
      ...replace(currentTotal, nextTotal)
    ];

    currentBucket = nextBucket;
    currentTotal = nextTotal;
    collectedTotal = total;

    return animations;
  }

  function collectBar(i) {
    const highlight = pmfBar(i, C.green, 0.68);

    const animations = [
      ...replace(pmf.bars[i], highlight),

      new M.Flash(
        highlight.submobjects[1],
        { color: C.green }
      )
    ];

    pmf.bars[i] = highlight;
    collectedBars.push(i);

    return animations;
  }

  // ------------------------------------------------------------
  // 11–17: the complete left-to-right running total
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...moveWalker(-0.75),
    ...say('BEFORE ZERO: NOTHING COLLECTED', C.muted),
    ...fbox([
      't < 0',
      'No possible payout yet',
      ['Running total = 0', C.green]
    ])
  );

  await until(S(12));
  await play(
    ...moveWalker(0),
    ...collectBar(0),
    ...updateBucket(CDF(0)),
    ...say('AT ZERO: COLLECT ONE QUARTER', C.green),
    ...fbox([
      'Previous total = 0',
      'Collect 1/4',
      ['New total = 1/4', C.green]
    ], C.green)
  );

  await until(S(13));
  await play(
    ...moveWalker(1),
    ...say('BETWEEN ZERO AND TWO: NO NEW BAR'),
    ...fbox([
      '0 < t < 2',
      'Nothing new to collect',
      ['Total stays at 1/4', C.green]
    ], C.green)
  );

  await until(S(14));
  await play(
    ...moveWalker(2),
    ...collectBar(1),
    ...updateBucket(CDF(2)),
    ...say('AT TWO: THE TOTAL JUMPS TO 3/4', C.green),
    ...fbox([
      'Previous total = 1/4',
      'Collect another 1/2',
      ['1/4 + 1/2 = 3/4', C.green]
    ], C.green)
  );

  await until(S(15));
  await play(
    ...moveWalker(3),
    ...say('BETWEEN TWO AND FOUR: STAY AT 3/4'),
    ...fbox([
      '2 < t < 4',
      'No bar at 3',
      ['Total stays at 3/4', C.green]
    ], C.green)
  );

  await until(S(16));
  await play(
    ...moveWalker(4),
    ...collectBar(2),
    ...updateBucket(CDF(4)),
    ...say('AT FOUR: THE BUCKET IS FULL', C.green),
    ...fbox([
      'Previous total = 3/4',
      'Collect the last 1/4',
      ['3/4 + 1/4 = 1', C.green]
    ], C.green)
  );

  await until(S(17));
  await play(
    ...moveWalker(5.0),
    new M.Indicate(
      currentBucket,
      { color: C.green }
    ),
    ...say('AFTER FOUR: THE TOTAL STAYS AT ONE', C.green),
    ...fbox([
      't > 4',
      'All chances collected',
      ['Running total = 1', C.green],
      'Nothing more to add'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Cumulative distribution graph
  // ------------------------------------------------------------

  // A discrete CDF is right-continuous.
  //
  // Its horizontal portions are solid.
  // Filled circles mark included endpoints.
  // Hollow circles mark excluded endpoints.
  //
  // Dashed vertical jump guides illustrate the jumps.
  // They are not additional function values.

  const CDF_BASE = P ? -4.5 : -2.19;
  const CDF_TOP = P ? 1.05 : 1.13;

  const cy = f =>
    CDF_BASE + f * (CDF_TOP - CDF_BASE);

  function cdfAxes() {
    const parts = [
      line(
        XL,
        CDF_BASE,
        XR,
        CDF_BASE,
        C.muted,
        2.5
      ),

      line(
        XL,
        CDF_BASE,
        XL,
        CDF_TOP + 0.14,
        C.muted,
        2.5
      ),

      txt(
        'Running chance',
        P ? 18 : 17,
        C.green,
        XL + 0.84,
        CDF_TOP + 0.27
      ),

      txt(
        'Payout threshold (tokens)',
        P ? 18 : 17,
        GOLD,
        CX,
        CDF_BASE - 0.69,
        false,
        6.1
      )
    ];

    for (const v of [0, 1, 2, 3, 4]) {
      parts.push(
        line(
          xx(v),
          CDF_BASE,
          xx(v),
          CDF_BASE - 0.075,
          C.muted,
          1.5
        ),

        txt(
          v,
          P ? 18 : 17,
          C.muted,
          xx(v),
          CDF_BASE - 0.27,
          true
        )
      );
    }

    for (const p of [0, 0.25, 0.50, 0.75, 1]) {
      const y = cy(p);

      parts.push(
        line(
          XL - 0.075,
          y,
          XL,
          y,
          C.muted,
          1.5
        ),

        txt(
          fraction(p),
          P ? 17 : 15,
          C.muted,
          XL - 0.30,
          y,
          true
        )
      );

      if (p > 0) {
        parts.push(
          dashed(XL, y, XR, y, C.muted)
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function stepSegment(
    from,
    to,
    level,
    color = C.cyan
  ) {
    return new M.VGroup(
      line(
        xx(from),
        cy(level),
        xx(to),
        cy(level),
        color,
        7
      ),

      line(
        xx(from),
        cy(level),
        xx(to),
        cy(level),
        WHITE,
        1.7
      )
    );
  }

  function closedEndpoint(t, level) {
    return glow(
      xx(t),
      cy(level),
      C.cyan,
      P ? 0.095 : 0.079
    );
  }

  function openEndpoint(t, level) {
    const r = circle(
      xx(t),
      cy(level),
      P ? 0.095 : 0.079,
      C.cyan,
      0,
      2.5
    );

    // Fill with the dark card colour to keep the
    // endpoint hollow and visually distinct.
    r.setFill(C.card, 1);

    return r;
  }

  function staircase() {
    const segments = [
      stepSegment(XMIN, 0, 0),
      stepSegment(0, 2, 0.25),
      stepSegment(2, 4, 0.75),
      stepSegment(4, XMAX, 1)
    ];

    const jumps = [
      dashed(xx(0), cy(0), xx(0), cy(0.25), C.cyan),
      dashed(xx(2), cy(0.25), xx(2), cy(0.75), C.cyan),
      dashed(xx(4), cy(0.75), xx(4), cy(1), C.cyan)
    ];

    const open = [
      openEndpoint(0, 0),
      openEndpoint(2, 0.25),
      openEndpoint(4, 0.75)
    ];

    const closed = [
      closedEndpoint(0, 0.25),
      closedEndpoint(2, 0.75),
      closedEndpoint(4, 1)
    ];

    const tails = [
      arrow(
        xx(-0.85),
        cy(0),
        xx(XMIN),
        cy(0),
        C.cyan,
        0.13
      ),

      arrow(
        xx(4.85),
        cy(1),
        xx(XMAX),
        cy(1),
        C.cyan,
        0.13
      )
    ];

    return {
      segments,
      jumps,
      open,
      closed,
      tails
    };
  }

  function stairObjects(stair) {
    return [
      ...stair.segments,
      ...stair.jumps,
      ...stair.open,
      ...stair.closed,
      ...stair.tails
    ];
  }

  function makeCDF() {
    return {
      axes: cdfAxes(),
      stair: staircase()
    };
  }

  function cdfObjects(plot) {
    return [
      plot.axes,
      ...stairObjects(plot.stair)
    ];
  }

  // ------------------------------------------------------------
  // 18–20: turn the bucket totals into a staircase
  // ------------------------------------------------------------

  let cdfPlot = makeCDF();

  const recordedPoints = [
    [-0.75, 0],
    [0, 0.25],
    [1, 0.25],
    [2, 0.75],
    [3, 0.75],
    [4, 1],
    [5, 1]
  ].map(([t, f]) =>
    glow(
      xx(t),
      cy(f),
      C.green,
      P ? 0.075 : 0.062
    )
  );

  await until(S(18));
  await play(
    ...clearPicture(),
    ...put(cdfPlot.axes),
    lagIn(recordedPoints, 0.09, 1.35),
    ...say('DRAW THE RUNNING TOTAL'),
    ...fbox([
      ['Across', GOLD],
      'Where the walker is',
      ['Up', C.green],
      'How much it collected'
    ])
  );

  const stepsInOrder = [
    cdfPlot.stair.segments[0],
    cdfPlot.stair.jumps[0],
    cdfPlot.stair.segments[1],
    cdfPlot.stair.jumps[1],
    cdfPlot.stair.segments[2],
    cdfPlot.stair.jumps[2],
    cdfPlot.stair.segments[3]
  ];

  await until(S(19));
  await play(
    ...take(...recordedPoints),
    lagIn(stepsInOrder, 0.15, 2.30),
    ...put(
      ...cdfPlot.stair.open,
      ...cdfPlot.stair.closed,
      ...cdfPlot.stair.tails
    ),
    ...say('FLAT, JUMP, FLAT: A STAIRCASE'),
    ...fbox([
      'Between payouts: flat',
      'At a payout: jump',
      ['Never goes down', C.green]
    ])
  );

  const startHighlight = circle(
    xx(-0.60),
    cy(0),
    P ? 0.18 : 0.16,
    C.amber,
    0
  );

  const endHighlight = circle(
    xx(4.62),
    cy(1),
    P ? 0.18 : 0.16,
    C.green,
    0
  );

  // say what the two rings mark, so they do not look like leftovers
  const startText = txt('start: 0', P ? 18 : 16, C.amber, xx(-0.60) + 0.15, cy(0) + 0.32);
  const endText = txt('end: 1', P ? 18 : 16, C.green, xx(4.62), cy(1) - 0.32);

  await until(S(20));
  await play(
    ...draw(startHighlight, endHighlight),
    ...put(startText, endText),
    ...say('STARTS AT ZERO. ENDS AT ONE.', C.green),
    ...fbox([
      'Before any payout: 0',
      'After all payouts: 1',
      ['0 ≤ F(t) ≤ 1', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 21–24: explain the three words in the name
  // ------------------------------------------------------------

  function wordCard(
    word,
    explanation,
    color,
    y
  ) {
    return new M.VGroup(
      rounded(
        CX,
        y,
        P ? 6.15 : 6.55,
        P ? 1.07 : 0.83,
        color
      ),

      txt(
        word,
        P ? 22 : 21,
        color,
        CX,
        y + (P ? 0.23 : 0.18),
        false,
        5.9
      ),

      txt(
        explanation,
        P ? 18 : 17,
        C.ink,
        CX,
        y - (P ? 0.23 : 0.18),
        false,
        5.9
      )
    );
  }

  const nameYs = P
    ? [0.61, -0.78, -2.17]
    : [0.92, -0.23, -1.38];

  const cumulativeCard = wordCard(
    'CUMULATIVE',
    'Adding up as you go',
    C.green,
    nameYs[0]
  );

  const distributionCard = wordCard(
    'DISTRIBUTION',
    'How chance is spread over payouts',
    C.cyan,
    nameYs[1]
  );

  const functionCard = wordCard(
    'FUNCTION',
    'Give it a point, get a number',
    C.violet,
    nameYs[2]
  );

  const cumulativeUnits = Array.from(
    { length: 4 },
    (_, i) =>
      probabilityUnit(
        CX + (i - 1.5) * 0.66,
        P ? -3.76 : -2.42,
        i < 3
      )
  );

  await until(S(21));
  await play(
    ...clearPicture(),
    ...put(cumulativeCard),
    lagIn(cumulativeUnits, 0.10, 0.95),
    ...say('CUMULATIVE = ADDING UP AS YOU GO', C.green),
    ...fbox([
      ['Cumulative', C.green],
      'Keep the earlier total',
      'Add each new amount'
    ], C.green)
  );

  await until(S(22));
  await play(
    ...put(distributionCard),
    ...say('DISTRIBUTION = HOW CHANCE IS SPREAD'),
    ...fbox([
      ['Distribution', C.cyan],
      '0 tokens: 1/4',
      '2 tokens: 1/2',
      '4 tokens: 1/4'
    ])
  );

  await until(S(23));
  await play(
    ...put(functionCard),
    ...say('FUNCTION = A RULE WITH AN INPUT AND OUTPUT', C.violet),
    ...fbox([
      ['Input: t', GOLD],
      'Apply the rule',
      ['Output: F(t)', C.green]
    ], C.violet)
  );

  const fullName = tag(
    'CUMULATIVE DISTRIBUTION FUNCTION',
    C.cyan,
    CX,
    P ? -4.71 : -2.52,
    P ? 18 : 16,
    P ? 6.6 : 6.75
  );

  await until(S(24));
  await play(
    ...take(...cumulativeUnits),
    ...put(fullName),
    ...say('CUMULATIVE DISTRIBUTION FUNCTION'),
    ...fbox([
      ['CDF', C.cyan],
      'The running total',
      'of probability',
      'Up to each point'
    ])
  );

  // ------------------------------------------------------------
  // 25: connection to cumulative frequency
  // ------------------------------------------------------------

  // Illustrative earlier-data analogy:
  // four observed values, 0, 2, 2, 4.
  // Cumulative counts are 1, 3, 4.
  //
  // These are not claimed to be four actual spins.

  const FREQ_Y = P ? 0.50 : 0.86;

  const frequencyDots = [0, 2, 2, 4].map((v, i) =>
    new M.VGroup(
      glow(
        CX + (i - 1.5) * 1.03,
        FREQ_Y,
        C.cyan,
        0.11
      ),

      txt(
        v,
        20,
        C.cyan,
        CX + (i - 1.5) * 1.03,
        FREQ_Y - 0.39,
        true
      )
    )
  );

  const frequencyRows = [
    ['At most 0', '1 of 4', '1/4'],
    ['At most 2', '3 of 4', '3/4'],
    ['At most 4', '4 of 4', '1']
  ].map((row, i) => {
    const y =
      P ? -0.92 - i * 0.80
        : -0.34 - i * 0.65;

    return new M.VGroup(
      rounded(
        CX,
        y,
        P ? 5.95 : 6.25,
        P ? 0.68 : 0.55,
        C.muted
      ),

      txt(
        row[0],
        18,
        C.ink,
        CX - 1.68,
        y,
        false,
        2.00
      ),

      txt(
        row[1],
        18,
        C.amber,
        CX + 0.18,
        y,
        true
      ),

      txt(
        row[2],
        21,
        C.green,
        CX + 2.12,
        y,
        true
      )
    );
  });

  const frequencyNote = txt(
    'Illustrative data example',
    15,
    C.muted,
    CX,
    P ? -3.75 : -2.48
  );

  await until(S(25));
  await play(
    ...clearPicture(),
    ...put(...frequencyDots),
    lagIn(frequencyRows, 0.18, 1.50),
    ...put(frequencyNote),
    ...say('THE SAME IDEA AS CUMULATIVE FREQUENCY', C.violet),
    ...fbox([
      'Cumulative frequency:',
      'Add observed counts',
      ['CDF:', C.cyan],
      'Add probabilities'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 26–29: the mathematical rule
  // ------------------------------------------------------------

  cdfPlot = makeCDF();

  await until(S(26));
  await play(
    ...clearPicture(),
    ...put(...cdfObjects(cdfPlot)),
    ...say('NOW THE SHORT VERSION'),
    ...fbox([
      ['CDF formula', C.cyan],
      'One input point',
      'One cumulative chance'
    ])
  );

  let thresholdLine = null;
  let thresholdTag = null;
  let thresholdDot = null;
  let probabilityGuide = null;
  let thresholdReadout = null;

  function thresholdParts(t, display = String(t)) {
    const f = CDF(t);
    const x = xx(t);
    const y = cy(f);

    const vline = dashed(
      x,
      CDF_BASE,
      x,
      y,
      GOLD
    );

    const hline = dashed(
      XL,
      y,
      x,
      y,
      C.green
    );

    const inputLabel = tag(
      `t = ${display}`,
      GOLD,
      x,
      CDF_BASE - (P ? 1.14 : 1.05),
      17,
      1.75
    );

    const resultDot = glow(
      x,
      y,
      C.green,
      P ? 0.125 : 0.10
    );

    const resultLabel = !P ? null : tag(
      `F(${display}) = ${fraction(f)}`,
      C.green,
      P ? CX : XR - 0.95,
      P ? -6.35 : CDF_TOP - 0.30,
      P ? 22 : 17,
      P ? 5.8 : 2.35
    );

    return {
      vline,
      hline,
      inputLabel,
      resultDot,
      resultLabel
    };
  }

  function selectThreshold(
    t,
    display = String(t),
    revealResult = true
  ) {
    const next = thresholdParts(t, display);

    const animations = [
      ...take(
        thresholdLine,
        thresholdTag,
        thresholdDot,
        probabilityGuide,
        thresholdReadout
      ),

      ...draw(next.vline),
      ...put(next.inputLabel)
    ];

    if (revealResult) {
      animations.push(
        ...draw(next.hline),
        ...put(
          next.resultDot,
          next.resultLabel
        )
      );
    }

    thresholdLine = next.vline;
    thresholdTag = next.inputLabel;
    thresholdDot = next.resultDot;
    probabilityGuide = next.hline;
    thresholdReadout = next.resultLabel;

    return animations;
  }

  function clearThreshold() {
    const animations = take(
      thresholdLine,
      thresholdTag,
      thresholdDot,
      probabilityGuide,
      thresholdReadout
    );

    thresholdLine = null;
    thresholdTag = null;
    thresholdDot = null;
    probabilityGuide = null;
    thresholdReadout = null;

    return animations;
  }

  await until(S(27));
  await play(
    ...selectThreshold(1.3, 't', false),
    ...say('CHOOSE ANY POINT. CALL IT t.', GOLD),
    ...fbox([
      ['t', GOLD],
      'Any threshold',
      'On the payout line'
    ], GOLD)
  );

  await until(S(28));
  await play(
    ...draw(probabilityGuide),
    ...put(thresholdDot),
    ...say('F(t) = P(X ≤ t)', C.green),
    ...fbox([
      ['F(t) = P(X ≤ t)', C.green],
      'F is the CDF',
      'X is the payout',
      't is the threshold'
    ], C.green)
  );

  const formulaReading = tag(
    'CHANCE OF t TOKENS OR LESS',
    C.green,
    CX,
    P ? -6.35 : 1.43,
    P ? 18 : 16,
    6.3
  );

  await until(S(29));
  await play(
    ...put(formulaReading),
    ...say('F AT t MEANS THE CHANCE OF t OR LESS', C.green),
    ...fbox([
      ['F(t)', C.green],
      'Probability that',
      'the payout is',
      't tokens or less'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 30–33: read the CDF at particular values
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    ...take(formulaReading),
    ...selectThreshold(0),
    ...say('F(0) = 1/4', C.green),
    ...fbox([
      'F(0) = P(X ≤ 0)',
      ['= 1/4', C.green]
    ], C.green)
  );

  await until(S(31));
  await play(
    ...selectThreshold(2),
    ...say('F(2) = 3/4', C.green),
    ...fbox([
      'F(2) = P(X ≤ 2)',
      '1/4 + 1/2',
      ['= 3/4', C.green]
    ], C.green)
  );

  await until(S(32));
  await play(
    ...selectThreshold(4),
    ...say('F(4) = 1', C.green),
    ...fbox([
      'F(4) = P(X ≤ 4)',
      ['= 1', C.green]
    ], C.green)
  );

  const flatHighlight = new M.VGroup(
    line(
      xx(2) + 0.06,
      cy(0.75),
      xx(4) - 0.07,
      cy(0.75),
      C.green,
      6
    ),

    arrow(
      xx(2) + 0.18,
      cy(0.75) + 0.24,
      xx(3) - 0.10,
      cy(0.75) + 0.24,
      GOLD,
      0.12
    )
  );

  const noThreePayout = tag(
    'NO BAR AT 3',
    C.amber,
    xx(3),
    cy(0.50) - 0.20,
    16,
    2.2
  );

  await until(S(33));
  await play(
    ...selectThreshold(3),
    ...put(flatHighlight, noThreePayout),
    ...say('F(3) IS STILL 3/4', C.green),
    ...fbox([
      'The walker passed 2',
      'But has not reached 4',
      'No extra chance at 3',
      ['F(3) = 3/4', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 34: the CDF answers at-most questions directly
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    ...take(flatHighlight, noThreePayout),
    ...selectThreshold(2),
    new M.Indicate(
      cdfPlot.stair.closed[1],
      { color: C.green }
    ),
    ...say('AT-MOST QUESTIONS IN ONE LOOK', C.green),
    ...fbox([
      ['Question: X ≤ 2', GOLD],
      'Go to t = 2',
      'Read the height',
      ['Answer = 3/4', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 35–36: more than two is the complement
  // ------------------------------------------------------------

  const COMPLEMENT_Y = P ? -0.76 : -0.43;
  const WHOLE_W = P ? 5.70 : 6.05;
  const WHOLE_H = P ? 0.95 : 0.78;

  function wholeProbabilityBar() {
    const left = CX - WHOLE_W / 2;
    const unitW = WHOLE_W / 4;

    const parts = [];

    for (let i = 0; i < 4; i++) {
      const x = left + (i + 0.5) * unitW;

      const color = i < 3 ? C.green : PINK;

      parts.push(
        rect(
          x,
          COMPLEMENT_Y,
          unitW - 0.025,
          WHOLE_H,
          color,
          0.74,
          1.5
        ),

        txt(
          '1/4',
          P ? 20 : 19,
          C.card,
          x,
          COMPLEMENT_Y,
          true
        )
      );
    }

    const boundary = left + 3 * unitW;

    parts.push(
      line(
        left,
        COMPLEMENT_Y + WHOLE_H / 2 + 0.28,
        left + WHOLE_W,
        COMPLEMENT_Y + WHOLE_H / 2 + 0.28,
        C.ink,
        1.8
      ),

      txt(
        'ALL CHANCES = 1',
        18,
        C.ink,
        CX,
        COMPLEMENT_Y + WHOLE_H / 2 + 0.59
      ),

      txt(
        'X ≤ 2',
        P ? 24 : 22,
        C.green,
        left + 1.5 * unitW,
        COMPLEMENT_Y - WHOLE_H / 2 - 0.37,
        true
      ),

      txt(
        'X > 2',
        P ? 22 : 20,
        PINK,
        boundary + unitW / 2,
        COMPLEMENT_Y - WHOLE_H / 2 - 0.37,
        true,
        unitW - 0.12
      ),

      txt(
        '3/4',
        P ? 30 : 27,
        C.green,
        left + 1.5 * unitW,
        COMPLEMENT_Y - WHOLE_H / 2 - 0.95,
        true
      ),

      txt(
        '1/4',
        P ? 30 : 27,
        PINK,
        boundary + unitW / 2,
        COMPLEMENT_Y - WHOLE_H / 2 - 0.95,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const wholeBar = wholeProbabilityBar();

  await until(S(35));
  await play(
    ...clearPicture(),
    ...put(wholeBar),
    ...say('MORE THAN IS THE OPPOSITE EVENT', PINK),
    ...fbox([
      ['Complement', PINK],
      'X ≤ t and X > t',
      'Together make 1',
      ['P(X > t) = 1 − F(t)', PINK]
    ], PINK)
  );

  const complementAnswer = tag(
    '1 − 3/4 = 1/4',
    PINK,
    CX,
    P ? -3.65 : -2.50,
    P ? 24 : 21
  );

  const complementOutline = rounded(
    CX + WHOLE_W * 0.375,
    COMPLEMENT_Y,
    WHOLE_W / 4 + 0.10,
    WHOLE_H + 0.14,
    PINK,
    PINK,
    0.035
  );

  await until(S(36));
  await play(
    ...draw(complementOutline),
    ...put(complementAnswer),
    ...say('P(MORE THAN TWO) = 1/4', PINK),
    ...fbox([
      'P(X > 2)',
      '= 1 − F(2)',
      '= 1 − 3/4',
      ['= 1/4', PINK]
    ], PINK)
  );

  // ------------------------------------------------------------
  // 37–38: the same idea for continuous measurements
  // ------------------------------------------------------------

  // Illustrative continuous random variable:
  // a waiting time supported between 0 and 10 minutes.
  //
  // Its example CDF is the smoothstep function:
  // G(t) = 3u^2 - 2u^3, u = t / 10, on [0, 10].
  //
  // This is a valid nondecreasing continuous CDF,
  // with constant tails at 0 and 1.
  // It is not fitted to any observed waiting-time data.

  const SM_L = XL;
  const SM_R = XR;

  const SM_B = CDF_BASE;
  const SM_T = CDF_TOP;

  function smoothCDF(t) {
    if (t <= 0) return 0;
    if (t >= 10) return 1;

    const u = t / 10;

    return 3 * u * u - 2 * u * u * u;
  }

  const sx = t =>
    SM_L + (t + 1) / 12 * (SM_R - SM_L);

  const sy = p =>
    SM_B + p * (SM_T - SM_B);

  const smoothAxesParts = [
    line(SM_L, SM_B, SM_R, SM_B, C.muted, 2.5),

    line(
      SM_L,
      SM_B,
      SM_L,
      SM_T + 0.14,
      C.muted,
      2.5
    ),

    txt(
      'Cumulative chance',
      P ? 18 : 17,
      C.green,
      SM_L + 1.03,
      SM_T + 0.27
    ),

    txt(
      'Time (minutes)',
      P ? 18 : 17,
      GOLD,
      CX,
      SM_B - 0.69
    )
  ];

  for (const t of [0, 2, 4, 6, 8, 10]) {
    smoothAxesParts.push(
      line(
        sx(t),
        SM_B,
        sx(t),
        SM_B - 0.07,
        C.muted,
        1.5
      ),

      txt(
        t,
        P ? 17 : 16,
        C.muted,
        sx(t),
        SM_B - 0.27,
        true
      )
    );
  }

  for (const p of [0, 0.25, 0.50, 0.75, 1]) {
    smoothAxesParts.push(
      txt(
        fraction(p),
        P ? 17 : 15,
        C.muted,
        SM_L - 0.30,
        sy(p),
        true
      )
    );

    if (p > 0) {
      smoothAxesParts.push(
        dashed(SM_L, sy(p), SM_R, sy(p), C.muted)
      );
    }
  }

  const smoothAxes = new M.VGroup(
    ...smoothAxesParts
  );

  function clockIcon(x, y, radius = 0.45) {
    return new M.VGroup(
      circle(x, y, radius, GOLD, 0.045),

      line(
        x,
        y,
        x,
        y + radius * 0.58,
        GOLD,
        2.5
      ),

      line(
        x,
        y,
        x + radius * 0.46,
        y - radius * 0.14,
        GOLD,
        2.5
      ),

      circle(x, y, 0.038, GOLD)
    );
  }

  const continuousClock = clockIcon(
    sx(5),
    sy(0.47),
    P ? 0.55 : 0.45
  );

  const continuousNote = txt(
    'Illustrative continuous-time distribution',
    15,
    C.muted,
    CX,
    P ? -5.7 : -3.3,
    false,
    6.4
  );

  await until(S(37));
  await play(
    ...clearPicture(),
    ...put(
      smoothAxes,
      continuousClock,
      continuousNote
    ),
    ...say('LATER: THE SAME IDEA FOR MEASUREMENTS LIKE TIME'),
    ...fbox([
      ['Time', GOLD],
      'Can take values',
      'between whole minutes',
      'Still ask: at most t?'
    ], GOLD)
  );

  const smoothSegments = [];

  const samples = 80;

  for (let i = 0; i < samples; i++) {
    const a = 10 * i / samples;
    const b = 10 * (i + 1) / samples;

    smoothSegments.push(
      line(
        sx(a),
        sy(smoothCDF(a)),
        sx(b),
        sy(smoothCDF(b)),
        C.cyan,
        4
      )
    );
  }

  const smoothCurve = new M.VGroup(
    line(sx(-1), sy(0), sx(0), sy(0), C.cyan, 4),
    ...smoothSegments,
    line(sx(10), sy(1), sx(11), sy(1), C.cyan, 4)
  );

  const smoothThreshold = new M.VGroup(
    dashed(
      sx(5),
      SM_B,
      sx(5),
      sy(smoothCDF(5)),
      GOLD
    ),

    dashed(
      SM_L,
      sy(smoothCDF(5)),
      sx(5),
      sy(smoothCDF(5)),
      C.green
    ),

    glow(
      sx(5),
      sy(smoothCDF(5)),
      C.green,
      0.10
    )
  );

  await until(S(38));
  await play(
    ...take(continuousClock),
    ...draw(smoothCurve),
    ...put(smoothThreshold),
    ...say('A CONTINUOUS CDF CAN BE A SMOOTH CURVE'),
    ...fbox([
      'Same cumulative idea',
      'Chance up to a point',
      ['No discrete jumps', C.green],
      'In this example'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 39–41: trap — at most is not the same as less than
  // ------------------------------------------------------------

  // Return to the original discrete payout distribution.
  // This distinction matters because X = 2 itself has
  // probability 1/2.

  pmf = makePMF();

  const trapTitle = tag(
    'WATCH THE WORDS',
    C.amber,
    CX,
    PMF_TOP + 0.34,
    18
  );

  const trapY = P ? -4.6 : -2.6;

  function inequalityCard(
    symbol,
    label,
    color,
    x
  ) {
    return new M.VGroup(
      rounded(
        x,
        trapY,
        P ? 2.82 : 2.95,
        P ? 1.25 : 0.82,
        color
      ),

      txt(
        symbol,
        P ? 29 : 25,
        color,
        x,
        trapY + (P ? 0.22 : 0.15),
        true
      ),

      txt(
        label,
        P ? 18 : 16,
        C.ink,
        x,
        trapY - (P ? 0.29 : 0.19)
      )
    );
  }

  const atMostCard = inequalityCard(
    'X ≤ 2',
    'At most two',
    C.green,
    CX - 1.58
  );

  const lessThanCard = inequalityCard(
    'X < 2',
    'Less than two',
    PINK,
    CX + 1.58
  );

  await until(S(39));
  await play(
    ...clearPicture(),
    ...put(
      ...pmfObjects(pmf),
      trapTitle,
      atMostCard,
      lessThanCard
    ),
    ...say('TRAP: AT MOST AND LESS THAN ARE DIFFERENT', C.amber),
    ...fbox([
      ['At most: ≤', C.green],
      'Includes equality',
      ['Less than: <', PINK],
      'Excludes equality'
    ], C.amber)
  );

  const equalityFocus = pmfSelection(
    1,
    C.amber
  );

  const includeEquality = tag(
    'INCLUDES TWO',
    C.green,
    CX - 1.58,
    P ? -5.7 : 1.30,
    16,
    2.75
  );

  const excludeEquality = tag(
    'EXCLUDES TWO',
    PINK,
    CX + 1.58,
    P ? -5.7 : 1.30,
    16,
    2.75
  );

  await until(S(40));
  await play(
    ...take(trapTitle),
    ...draw(equalityFocus),
    ...put(includeEquality, excludeEquality),
    new M.Indicate(
      pmf.bars[1],
      { color: C.amber }
    ),
    ...say('AT MOST TWO INCLUDES THE BIG BAR AT TWO', C.amber),
    ...fbox([
      ['X ≤ 2 includes X = 2', C.green],
      ['X < 2 excludes X = 2', PINK],
      'That bar has chance 1/2'
    ], C.amber)
  );

  const onlyZero = pmfBar(
    0,
    C.green,
    0.78
  );

  const excludedTwo = pmfBar(
    1,
    C.muted,
    0.16
  );

  const excludedFour = pmfBar(
    2,
    C.muted,
    0.16
  );

  const lessThanAnswer = tag(
    'P(X < 2) = 1/4',
    PINK,
    CX,
    P ? -4.6 : -2.6,
    22
  );

  const zeroOnlyOutline = pmfSelection(
    0,
    C.green
  );

  await until(S(41));
  await play(
    ...take(
      equalityFocus,
      atMostCard,
      lessThanCard,
      includeEquality,
      excludeEquality
    ),

    ...replace(pmf.bars[0], onlyZero),
    ...replace(pmf.bars[1], excludedTwo),
    ...replace(pmf.bars[2], excludedFour),

    ...draw(zeroOnlyOutline),
    ...put(lessThanAnswer),

    ...say('LESS THAN TWO COUNTS ONLY THE ZERO BAR', PINK),
    ...fbox([
      'P(X ≤ 2) = 3/4',
      'P(X = 2) = 1/2',
      'P(X < 2) = 3/4 − 1/2',
      ['= 1/4', PINK]
    ], PINK)
  );

  // ------------------------------------------------------------
  // 42: preview expected value
  // ------------------------------------------------------------

  // A balance picture foreshadows the next lesson.
  // It uses the same four equally likely outcomes,
  // with payouts 0, 2, 2, 4.
  //
  // No individual spin is promised to pay an average.

  const BAL_Y = P ? -1.15 : -0.70;

  const balanceLeft = CX - 2.35;
  const balanceRight = CX + 2.35;

  const balanceBeam = line(
    balanceLeft,
    BAL_Y,
    balanceRight,
    BAL_Y,
    GOLD,
    4
  );

  const pivot = new M.VGroup(
    line(
      CX,
      BAL_Y,
      CX - 0.39,
      BAL_Y - 0.75,
      C.muted,
      3
    ),

    line(
      CX,
      BAL_Y,
      CX + 0.39,
      BAL_Y - 0.75,
      C.muted,
      3
    ),

    line(
      CX - 0.39,
      BAL_Y - 0.75,
      CX + 0.39,
      BAL_Y - 0.75,
      C.muted,
      3
    )
  );

  const balancePayouts = [
    [0, balanceLeft + 0.25],
    [2, CX],
    [4, balanceRight - 0.25]
  ];

  const balanceMasses = balancePayouts.map(
    ([value, x], i) => {
      const units = i === 1 ? 2 : 1;

      const parts = [];

      for (let j = 0; j < units; j++) {
        parts.push(
          rect(
            x,
            BAL_Y + 0.22 + j * 0.39,
            0.73,
            0.36,
            C.cyan,
            0.77,
            1.4
          )
        );
      }

      parts.push(
        txt(
          value,
          20,
          GOLD,
          x,
          BAL_Y - 0.25,
          true
        ),

        txt(
          fraction(units / 4),
          18,
          C.cyan,
          x,
          BAL_Y + 0.45 + (units - 1) * 0.39,
          true
        )
      );

      return new M.VGroup(...parts);
    }
  );

  const expectedQuestion = tag(
    'LONG-RUN PAYOUT?',
    GOLD,
    CX,
    P ? 0.92 : 1.10,
    21
  );

  const expectedNote = txt(
    'What payout should we expect on average?',
    P ? 20 : 18,
    C.muted,
    CX,
    BAL_Y - 1.25,
    false,
    6.4
  );

  await until(S(42));
  await play(
    ...clearPicture(),
    ...draw(balanceBeam),
    ...put(pivot, expectedQuestion, expectedNote),
    lagIn(balanceMasses, 0.14, 1.35),
    ...say('NEXT: THE PAYOUT TO EXPECT IN THE LONG RUN', GOLD),
    ...fbox([
      ['Next lesson', GOLD],
      'Expected value',
      'The long-run average',
      'Of the payout'
    ], GOLD)
  );

  // ------------------------------------------------------------
  // 43: final visual summary
  // ------------------------------------------------------------

  const finalPlot = makeCDF();

  const finalOpenLabel = txt(
    'Open = excluded',
    16,
    C.muted,
    XL + 1.13,
    CDF_BASE - 1.1,
    false,
    2.30
  );

  const finalClosedLabel = txt(
    'Filled = included',
    16,
    C.cyan,
    XR - 1.23,
    CDF_BASE - 1.1,
    false,
    2.35
  );

  const finalReadings = [
    [0, 0.25],
    [2, 0.75],
    [4, 1]
  ].map(([t, f], i) => {
    const x = xx(t);
    const y = cy(f);

    const dx =
      i === 2 ? -0.64 : 0.54;

    const dy =
      i === 2 ? -0.34 : 0.29;

    return txt(
      fraction(f),
      P ? 22 : 19,
      C.green,
      x + dx,
      y + dy,
      true
    );
  });

  const finalWalkerArrow = arrow(
    xx(-0.85),
    cy(0.50),
    xx(4.95),
    cy(0.50),
    GOLD,
    0.17
  );

  const finalDirectionLabel = tag(
    'ADD FROM LEFT TO RIGHT',
    GOLD,
    CX,
    cy(0.50) + 0.32,
    16,
    5.20
  );
  // left side, above the arrow: clear of the step labels and jump lines
  if (P) finalDirectionLabel.moveTo([CX, cy(0.50) - 0.34, 0]);
  else finalDirectionLabel.moveTo([XL + 0.2 + finalDirectionLabel.getWidth() / 2, cy(0.50) + 0.32, 0]);

  await until(S(43));
  await play(
    ...clearPicture(),

    ...put(
      ...cdfObjects(finalPlot),
      ...finalReadings,
      finalOpenLabel,
      finalClosedLabel,
      finalDirectionLabel
    ),

    ...draw(finalWalkerArrow),

    ...say('CDF: ADD ALL CHANCES UP TO EACH POINT', C.green),

    ...fbox([
      ['F(t) = P(X ≤ t)', C.green],
      'F(0) = 1/4',
      'F(2) = F(3) = 3/4',
      ['F(4) = 1', C.green]
    ], C.green)
  );
}

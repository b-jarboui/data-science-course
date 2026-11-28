// lesson 13.1.5
// Naive Bayes: combining clues to predict a label.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact shared chapter data, add-one smoothing,
// and unrounded probability calculations.
// Try it beats preview the separate interactive activity.
// Written against the supplied engine interface; browser runtime not tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ============================================================
  // COURSE COLOURS AND RESPONSIVE LAYOUT
  // ============================================================

  const PLUM = C.violet || '#A78BFA';
  const APPLE = C.orange || '#FB923C';
  const PEAR = C.green || '#4ADE80';

  const WHITE = '#FFFFFF';
  const GOLD = C.amber;

  const YES = C.green;
  const NO = C.muted;

  const COLORS = [PLUM, APPLE, PEAR];
  const NAMES = ['plum', 'apple', 'pear'];

  const CLUE_COLORS = [
    C.cyan,
    GOLD,
    C.green
  ];

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // Phone frame: 8 x 14.22.
  // Keep content between y = -5.5 and 4.3.
  //
  // Laptop frame: 14.22 x 8.
  // Keep content between y = -3.0 and 2.3.

  const SP = P ? 2.10 : 1.95;

  const colx = i =>
    CX + (i - 1) * SP;

  const FR = P ? 0.17 : 0.145;

  const HUE = [
    '#EF4444',
    '#F97316',
    '#FB923C',
    '#FBBF24',
    '#FACC15',
    '#A3E635',
    '#65A30D',
    '#22C55E'
  ];

  // ============================================================
  // EXACT SHARED CHAPTER DATA
  // ============================================================

  const DATA = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 150, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 100, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 100, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 200, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 400, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 1, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 300, hue: 5, firmness: 2 },

    { id: 'R1', label: 'pear',  weight: 150, hue: 7, firmness: 3 },
    { id: 'R2', label: 'pear',  weight: 250, hue: 7, firmness: 2 },
    { id: 'R3', label: 'pear',  weight: 200, hue: 6, firmness: 2 },
    { id: 'R4', label: 'pear',  weight: 200, hue: 8, firmness: 1 }
  ];

  const NEW_FRUIT = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  // The three exact questions used throughout the lesson.

  const QUESTIONS = [
    {
      name: 'Weight',
      short: 'Weight ≤ 150 g',
      question: 'Weight 150 g or less?',
      test: d => d.weight <= 150
    },

    {
      name: 'Hue',
      short: 'Hue ≥ 4',
      question: 'Hue at least 4?',
      test: d => d.hue >= 4
    },

    {
      name: 'Firmness',
      short: 'Firmness ≥ 3',
      question: 'Firmness at least 3?',
      test: d => d.firmness >= 3
    }
  ];

  const ORIGINAL_ANSWERS = QUESTIONS.map(
    q => q.test(NEW_FRUIT)
  );

  // [true, true, true]

  const GROUPS = NAMES.map(label =>
    DATA.filter(d => d.label === label)
  );

  const YES_COUNTS = GROUPS.map(group =>
    QUESTIONS.map(q =>
      group.filter(d => q.test(d)).length
    )
  );

  // Exact yes counts:
  //
  //             Weight   Hue   Firmness
  // Plum           4      1       3
  // Apple          0      1       2
  // Pear           1      4       1
  //
  // Add-one smoothing adds one imaginary yes
  // and one imaginary no for EACH separate question
  // within EACH separate fruit type.
  //
  // Smoothed yes probabilities:
  //
  // Plum:  5/6, 2/6, 4/6
  // Apple: 1/6, 2/6, 3/6
  // Pear:  2/6, 5/6, 2/6
  //
  // Prior = 4/12 = 1/3 for each fruit type.
  //
  // Raw scores:
  // Plum:  40/648
  // Apple:  6/648
  // Pear:  20/648
  //
  // Normalised probabilities:
  // Plum:  40/66 ≈ 60.6%
  // Apple:  6/66 ≈ 9.1%
  // Pear:  20/66 ≈ 30.3%

  // ============================================================
  // NAIVE BAYES CALCULATION
  // ============================================================

  function colorOf(label) {
    return label === 'plum' ? PLUM :
           label === 'apple' ? APPLE :
           PEAR;
  }

  function calculate(data, answers) {
    const rows = NAMES.map((label, i) => {
      const group = data.filter(
        d => d.label === label
      );

      const count = group.length;

      const prior = count / data.length;

      const yesCounts = QUESTIONS.map(
        q => group.filter(d => q.test(d)).length
      );

      const observedCounts = yesCounts.map(
        (n, j) => answers[j] ? n : count - n
      );

      const numerators = observedCounts.map(
        n => n + 1
      );

      const denominator = count + 2;

      const conditionals = numerators.map(
        n => n / denominator
      );

      const conditionalProduct =
        conditionals.reduce(
          (a, b) => a * b,
          1
        );

      const score =
        prior * conditionalProduct;

      const numeratorProduct =
        numerators.reduce(
          (a, b) => a * b,
          1
        );

      return {
        label,
        index: i,
        count,
        prior,
        yesCounts,
        observedCounts,
        numerators,
        denominator,
        conditionals,
        conditionalProduct,
        numeratorProduct,
        score
      };
    });

    const total = rows.reduce(
      (a, row) => a + row.score,
      0
    );

    const probs = rows.map(
      row => row.score / total
    );

    const best = Math.max(...probs);

    const winners = probs
      .map((p, i) =>
        Math.abs(p - best) < 1e-12 ? i : -1
      )
      .filter(i => i >= 0);

    return {
      rows,
      total,
      probs,
      winner: winners.length === 1
        ? winners[0]
        : -1
    };
  }

  const ORIGINAL = calculate(
    DATA,
    ORIGINAL_ANSWERS
  );

  const SCORE_NUMERATORS = ORIGINAL.rows.map(
    row => row.numeratorProduct
  );

  const COMMON_DENOMINATOR =
    3 * 6 * 6 * 6;

  const NUMERATOR_TOTAL =
    SCORE_NUMERATORS.reduce(
      (a, b) => a + b,
      0
    );

  const PROBS = ORIGINAL.probs;

  const pct = p =>
    `${(p * 100).toFixed(1)}%`;

  const fraction = (a, b) =>
    `${a}/${b}`;

  const resultColor = result =>
    result.winner < 0
      ? GOLD
      : COLORS[result.winner];

  const resultLabel = result =>
    result.winner < 0
      ? 'tie: no unique winner'
      : `prediction: ${NAMES[result.winner]}`;

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);

    t.moveTo(p);

    return t;
  }

  function fittedText(
    s,
    size,
    color,
    p,
    maxw,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function leftText(
    s,
    size,
    color,
    x,
    y,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    t.moveTo([
      x + t.getWidth() / 2,
      y,
      0
    ]);

    return t;
  }

  function rightText(
    s,
    size,
    color,
    x,
    y,
    mono = false
  ) {
    const t = T(s, size, color, mono);

    t.moveTo([
      x - t.getWidth() / 2,
      y,
      0
    ]);

    return t;
  }

  function line(
    start,
    end,
    color = C.muted,
    width = 2
  ) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function rect(
    w,
    h,
    p,
    color,
    opacity = 0,
    stroke = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: stroke
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(
    w,
    h,
    p,
    color,
    opacity = 0.92
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 17) {
    const t = pill(s, color, size);

    t.moveTo(p);

    return t;
  }

  function reveal(
    objects,
    runTime = 1.0,
    lagRatio = 0.12
  ) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function remove(objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));
  }

  function ring(
    p,
    color = GOLD,
    radius = FR * 2
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function heading(s) {
    return fittedText(
      s,
      P ? 19 : 18,
      C.ink,
      [CX, P ? 1.30 : 1.26, 0],
      P ? 6.75 : 6.40,
      true
    );
  }

  // ============================================================
  // ONE FORMULA / INFORMATION BOX
  // ============================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21;
    const lh = P ? 0.33 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.15 - lh / 2;

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

    const maxw = P ? FW - 0.9 : 4.0;
    const maxh = P ? 1.36 : 3.8;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const animations = [];

    if (boxNow) {
      animations.push(
        new M.FadeOut(boxNow)
      );
    }

    animations.push(
      new M.FadeIn(g)
    );

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;

    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // CONSISTENT CHAPTER FRUIT SYMBOLS
  // ============================================================

  function triangle(p, r, color) {
    const [x, y] = p;

    const top = [x, y + r, 0];

    const left = [
      x - r * 0.95,
      y - r * 0.70,
      0
    ];

    const right = [
      x + r * 0.95,
      y - r * 0.70,
      0
    ];

    const fill = [];

    for (let i = 1; i <= 12; i++) {
      const a = i / 12;

      const yy =
        top[1] + a * (left[1] - top[1]);

      const ww = r * 0.95 * a;

      fill.push(
        line(
          [x - ww, yy, 0],
          [x + ww, yy, 0],
          color,
          2.5
        )
      );
    }

    return new M.VGroup(
      ...fill,
      line(top, left, color, 2),
      line(left, right, color, 2),
      line(right, top, color, 2)
    );
  }

  function fruit(label, p, r = FR) {
    const color = colorOf(label);

    const halo = new M.Dot({
      point: p,
      radius: r * 1.65,
      color
    });

    halo.setFill(color, 0.14);

    let body;

    if (label === 'plum') {
      body = new M.Circle({
        radius: r,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);

    } else if (label === 'apple') {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);

    } else {
      body = triangle(
        p,
        r * 1.10,
        color
      );
    }

    return new M.VGroup(
      halo,
      body
    );
  }

  function unknown(p, r = FR * 1.25) {
    const outer = new M.Dot({
      point: p,
      radius: r * 1.85,
      color: WHITE
    });

    outer.setFill(WHITE, 0.08);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.40,
      color: WHITE
    });

    inner.setFill(WHITE, 0.15);

    const side = r * Math.sqrt(2);

    const body = new M.Rectangle({
      width: side,
      height: side,
      color: WHITE,
      strokeWidth: 2
    });

    body.setFill(WHITE, 1);
    body.rotate(Math.PI / 4);
    body.moveTo(p);

    return new M.VGroup(
      outer,
      inner,
      body
    );
  }

  // ============================================================
  // PACKING STATION AND INTRODUCTORY CLUES
  // ============================================================

  const STATION_Y = P ? -1.60 : -0.35;

  function station() {
    const base = rounded(
      P ? 5.85 : 5.70,
      0.48,
      [CX, STATION_Y, 0],
      C.muted,
      0.90
    );

    const rollers = Array.from(
      { length: 11 },
      (_, i) => {
        const x = CX + (i - 5) * 0.47;

        const c = new M.Circle({
          radius: 0.115,
          color: C.muted,
          strokeWidth: 1.5
        });

        c.setFill(C.card, 1);

        c.moveTo([
          x,
          STATION_Y,
          0
        ]);

        return c;
      }
    );

    const title = text(
      'FRUIT PACKING STATION',
      18,
      C.ink,
      [CX, STATION_Y + 1.35, 0],
      true
    );

    return new M.VGroup(
      base,
      ...rollers,
      title
    );
  }

  function clueCard(
    title,
    detail,
    color,
    p
  ) {
    const w = P ? 2.55 : 2.40;
    const h = 0.88;

    const body = rounded(
      w,
      h,
      p,
      color,
      0.94
    );

    const a = fittedText(
      title,
      18,
      color,
      [p[0], p[1] + 0.15, 0],
      w - 0.20,
      true
    );

    const b = fittedText(
      detail,
      15,
      C.ink,
      [p[0], p[1] - 0.20, 0],
      w - 0.20
    );

    return new M.VGroup(
      body,
      a,
      b
    );
  }

  const packingStation = station();

  const incoming = unknown(
    [CX, STATION_Y + 0.47, 0],
    FR * 1.65
  );

  const introWeight = clueCard(
    'WEIGHT CLUE',
    'might suggest plum',
    C.cyan,
    [CX - 1.45, STATION_Y - 0.92, 0]
  );

  const introHue = clueCard(
    'COLOUR CLUE',
    'might suggest another label',
    GOLD,
    [CX + 1.45, STATION_Y - 0.92, 0]
  );

  const combineTag = tag(
    'COMBINE THE CLUES?',
    GOLD,
    [CX, P ? -4.30 : -2.30, 0],
    18
  );

  // ============================================================
  // KNOWN FRUIT GROUPS
  // ============================================================

  const GROUP_Y = P ? -1.05 : -0.15;
  const GROUP_W = P ? 1.82 : 1.72;
  const GROUP_H = P ? 3.00 : 2.05;

  function groupCard(i, showCount = false) {
    const label = NAMES[i];
    const color = COLORS[i];

    const x = colx(i);
    const y = GROUP_Y;

    const body = rounded(
      GROUP_W,
      GROUP_H,
      [x, y, 0],
      color,
      0.92
    );

    const name = text(
      label.toUpperCase(),
      P ? 19 : 18,
      color,
      [x, y + GROUP_H / 2 - 0.32, 0],
      true
    );

    const icons = GROUPS[i].map((d, j) => {
      const xx =
        x + ((j % 2) - 0.5) * (P ? 0.80 : 0.66);

      const yy =
        y + (P ? 0.30 : 0.25) -
        Math.floor(j / 2) * (P ? 0.80 : 0.58);

      const icon = fruit(
        d.label,
        [xx, yy, 0],
        P ? FR * 1.3 : FR
      );

      return new M.VGroup(
        icon
      );
    });

    const count = text(
      showCount ? '4 fruits' : '',
      16,
      color,
      [
        x,
        y - GROUP_H / 2 + 0.24,
        0
      ]
    );

    return new M.VGroup(
      body,
      name,
      ...icons,
      count
    );
  }

  function groupedFruits(showCount = false) {
    return NAMES.map((_, i) =>
      groupCard(i, showCount)
    );
  }

  function priorTag(i) {
    return tag(
      '4/12 = 1/3',
      COLORS[i],
      [
        colx(i),
        GROUP_Y - GROUP_H / 2 - 0.40,
        0
      ],
      P ? 17 : 16
    );
  }

  let groupsNow = groupedFruits(false);

  let groupsTitle = heading(
    '12 KNOWN FRUITS'
  );

  // ============================================================
  // THREE MEASUREMENTS AND FIRMNESS INDICATOR
  // ============================================================

  function measurementStrip() {
    const y = P ? -3.70 : -2.00;

    const labels = [
      'Weight',
      'Hue',
      'Firmness'
    ];

    const values = [
      'grams',
      '1–8',
      '1–4'
    ];

    return labels.map((name, i) => {
      const x = colx(i);
      const color = CLUE_COLORS[i];

      const body = rounded(
        P ? 1.80 : 1.70,
        0.76,
        [x, y, 0],
        color,
        0.94
      );

      const a = text(
        name,
        17,
        color,
        [x, y + 0.15, 0]
      );

      const b = text(
        values[i],
        15,
        C.muted,
        [x, y - 0.16, 0],
        true
      );

      return new M.VGroup(
        body,
        a,
        b
      );
    });
  }

  function firmnessIndicator(
    value = 3,
    p = [CX, P ? -5.00 : -2.48, 0]
  ) {
    const x = p[0];
    const y = p[1];

    const parts = [];

    for (let i = 0; i < 4; i++) {
      const xx = x + (i - 1.5) * 0.55;

      parts.push(
        rect(
          0.43,
          0.32,
          [xx, y, 0],
          i < value ? C.green : C.muted,
          i < value ? 0.82 : 0.12,
          1.5
        )
      );

      parts.push(
        text(
          String(i + 1),
          15,
          i < value ? WHITE : C.muted,
          [xx, y, 0],
          true
        )
      );
    }

    parts.push(
      text(
        'soft',
        15,
        C.muted,
        [x - 1.45, y, 0]
      )
    );

    parts.push(
      text(
        'firm',
        15,
        C.muted,
        [x + 1.45, y, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function hueStrip(
    value,
    p,
    scale = 1
  ) {
    const w = 0.28 * scale;
    const h = 0.22 * scale;

    const parts = [];

    HUE.forEach((color, i) => {
      const x =
        p[0] + (i - 3.5) * w;

      parts.push(
        rect(
          w * 0.94,
          h,
          [x, p[1], 0],
          color,
          1,
          0
        )
      );

      if (i + 1 === value) {
        parts.push(
          rect(
            w + 0.06,
            h + 0.06,
            [x, p[1], 0],
            WHITE,
            0,
            2
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  // ============================================================
  // YES-OR-NO QUESTION CARDS
  // ============================================================

  const QUESTION_Y = P
    ? [0.10, -1.50, -3.10]
    : [0.48, -0.58, -1.64];

  function questionCard(
    i,
    answer = null,
    showValue = false
  ) {
    const y = QUESTION_Y[i];

    const w = P ? 6.10 : 5.75;
    const h = P ? 1.20 : 0.85;

    const color = CLUE_COLORS[i];

    const body = rounded(
      w,
      h,
      [CX, y, 0],
      color,
      0.94
    );

    const number = text(
      String(i + 1),
      22,
      color,
      [CX - w / 2 + 0.34, y, 0],
      true
    );

    const question = leftText(
      QUESTIONS[i].question,
      P ? 18 : 17,
      C.ink,
      CX - w / 2 + 0.68,
      showValue ? y + 0.17 : y
    );

    const valueText = [
      `${NEW_FRUIT.weight} g`,
      `Hue ${NEW_FRUIT.hue}`,
      `Firmness ${NEW_FRUIT.firmness}`
    ];

    const parts = [
      body,
      number,
      question
    ];

    if (showValue) {
      parts.push(
        leftText(
          valueText[i],
          15,
          color,
          CX - w / 2 + 0.68,
          y - 0.20,
          true
        )
      );
    }

    const answerText =
      answer === null
        ? 'YES / NO'
        : answer ? 'YES' : 'NO';

    const answerColor =
      answer === null
        ? C.muted
        : answer ? YES : GOLD;

    parts.push(
      tag(
        answerText,
        answerColor,
        [CX + w / 2 - 0.68, y, 0],
        P ? 15 : 14
      )
    );

    return new M.VGroup(...parts);
  }

  function allQuestionCards(
    answers = null,
    showValue = false
  ) {
    return QUESTIONS.map((_, i) =>
      questionCard(
        i,
        answers ? answers[i] : null,
        showValue
      )
    );
  }

  let questionCards = [];

  let questionTitle = heading(
    'THREE YES-OR-NO QUESTIONS'
  );

  const clueDiamond = unknown(
    [
      CX,
      P ? -4.70 : -2.52,
      0
    ],
    FR * 1.15
  );

  // ============================================================
  // YES / NO COUNTING TABLE
  // ============================================================

  // Each cell represents ONE question for ONE fruit type.
  // The first four tokens correspond to the four real fruits,
  // in their original DATA order.
  //
  // The final two positions are reserved for the imaginary
  // smoothing answers: one yes and one no.
  //
  // Imaginary answers use amber outlines and are not drawn
  // as additional real fruits.

  const TABLE_LEFT = CX - 3.35;

  const ROW_LABEL_X = TABLE_LEFT + 0.53;

  const CELL_W = P ? 1.77 : 1.72;

  const CELL_SP = P ? 1.87 : 1.82;

  const CELL_H = P ? 1.60 : 0.94;

  const CELL_FIRST_X =
    TABLE_LEFT + 2.02;

  const TABLE_Y = P
    ? [0.00, -2.00, -4.00]
    : [0.30, -0.80, -1.90];

  const cellX = j =>
    CELL_FIRST_X + j * CELL_SP;

  const CELL_HEADER_Y = P ? 1.22 : 1.14;

  const TOKEN_SP = P ? 0.285 : 0.245;

  const TOKEN_SIZE = P ? 0.255 : 0.205;

  function answerToken(
    p,
    answer,
    color,
    imaginary = false
  ) {
    const outline = imaginary
      ? GOLD
      : answer ? color : C.muted;

    const b = rounded(
      TOKEN_SIZE,
      TOKEN_SIZE * 1.10,
      p,
      outline,
      imaginary ? 0.80 : 0.95
    );

    b.setFill(
      answer ? color : C.card,
      answer
        ? imaginary ? 0.42 : 0.88
        : 0.95
    );

    const t = text(
      answer ? 'Y' : 'N',
      P ? 15 : 11,
      imaginary
        ? GOLD
        : answer ? WHITE : C.muted,
      p,
      true
    );

    return new M.VGroup(
      b,
      t
    );
  }

  function tokenPosition(i, j, k) {
    const x = cellX(j);
    const y = TABLE_Y[i];

    return [
      x + (k - 2.5) * TOKEN_SP,
      y + (P ? 0.30 : 0.12),
      0
    ];
  }

  function rowLabel(i) {
    const x = ROW_LABEL_X;
    const y = TABLE_Y[i];

    const color = COLORS[i];

    const icon = fruit(
      NAMES[i],
      [x, y + 0.20, 0],
      P ? 0.13 : 0.11
    );

    const name = fittedText(
      NAMES[i].toUpperCase(),
      P ? 16 : 14,
      color,
      [x, y - 0.20, 0],
      0.96,
      true
    );

    return new M.VGroup(
      icon,
      name
    );
  }

  function tableHeaders() {
    const parts = [];

    for (let j = 0; j < 3; j++) {
      const x = cellX(j);

      parts.push(
        fittedText(
          QUESTIONS[j].name.toUpperCase(),
          P ? 17 : 15,
          CLUE_COLORS[j],
          [x, CELL_HEADER_Y + 0.08, 0],
          CELL_W - 0.08,
          true
        )
      );

      parts.push(
        text(
          ['≤ 150 g', '≥ 4', '≥ 3'][j],
          P ? 15 : 14,
          C.muted,
          [x, CELL_HEADER_Y - 0.20, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function cellCount(
    i,
    j,
    smoothed = false,
    probabilityOnly = false
  ) {
    const n = YES_COUNTS[i][j] +
      (smoothed ? 1 : 0);

    const total = smoothed ? 6 : 4;

    const value = probabilityOnly
      ? `${n}/${total}`
      : `${n} yes / ${total}`;

    return text(
      value,
      probabilityOnly
        ? P ? 26 : 22
        : P ? 19 : 15,
      COLORS[i],
      [
        cellX(j),
        TABLE_Y[i] - (P ? 0.36 : 0.23),
        0
      ],
      true
    );
  }

  function createCell(i, j) {
    const x = cellX(j);
    const y = TABLE_Y[i];

    const body = rounded(
      CELL_W,
      CELL_H,
      [x, y, 0],
      COLORS[i],
      0.86
    );

    const tokens = GROUPS[i].map(
      (d, k) => answerToken(
        tokenPosition(i, j, k),
        QUESTIONS[j].test(d),
        COLORS[i],
        false
      )
    );

    const base = new M.VGroup(
      body,
      ...tokens
    );

    const count = cellCount(i, j);

    return {
      i,
      j,
      base,
      count,
      extras: null
    };
  }

  const cells = NAMES.map((_, i) =>
    QUESTIONS.map((_, j) =>
      createCell(i, j)
    )
  );

  const cellList = cells.flat();

  const tableRows = NAMES.map(
    (_, i) => rowLabel(i)
  );

  const tableHead = tableHeaders();

  function showCell(cell) {
    return [
      new M.FadeIn(cell.base),
      new M.FadeIn(cell.count)
    ];
  }

  function showCellRow(i) {
    return cells[i].flatMap(showCell);
  }

  function extraAnswers(cell) {
    return new M.VGroup(
      answerToken(
        tokenPosition(cell.i, cell.j, 4),
        true,
        COLORS[cell.i],
        true
      ),

      answerToken(
        tokenPosition(cell.i, cell.j, 5),
        false,
        COLORS[cell.i],
        true
      )
    );
  }

  function changeCount(
    cell,
    smoothed,
    probabilityOnly = false
  ) {
    const next = cellCount(
      cell.i,
      cell.j,
      smoothed,
      probabilityOnly
    );

    return new M.Transform(
      cell.count,
      next,
      { runTime: 0.65 }
    );
  }

  function cellOutline(i, j) {
    return rounded(
      CELL_W + 0.08,
      CELL_H + 0.08,
      [cellX(j), TABLE_Y[i], 0],
      GOLD,
      0
    );
  }

  function tableRowOutline(i) {
    const left = cellX(0) - CELL_W / 2;
    const right = cellX(2) + CELL_W / 2;

    return rounded(
      right - left + 0.12,
      CELL_H + 0.10,
      [
        (left + right) / 2,
        TABLE_Y[i],
        0
      ],
      GOLD,
      0
    );
  }

  function answerLegend(imaginary = false) {
    const y = P ? -5.40 : -2.73;

    if (!imaginary) {
      const yesToken = answerToken(
        [CX - 1.35, y, 0],
        true,
        C.green
      );

      const yesText = leftText(
        'Yes',
        P ? 18 : 15,
        C.green,
        CX - 1.13,
        y
      );

      const noToken = answerToken(
        [CX + 0.40, y, 0],
        false,
        C.green
      );

      const noText = leftText(
        'No',
        P ? 18 : 15,
        C.muted,
        CX + 0.62,
        y
      );

      return new M.VGroup(
        yesToken,
        yesText,
        noToken,
        noText
      );
    }

    const yesToken = answerToken(
      [CX - 2.38, y, 0],
      true,
      C.green,
      true
    );

    const noToken = answerToken(
      [CX - 2.08, y, 0],
      false,
      C.green,
      true
    );

    const label = fittedText(
      'Amber outlines = imaginary answers',
      P ? 19 : 14,
      GOLD,
      [CX + 0.40, y, 0],
      4.60
    );

    return new M.VGroup(
      yesToken,
      noToken,
      label
    );
  }

  let tableLegend = answerLegend(false);

  let tableHighlight = null;

  function highlightRow(i) {
    const next = tableRowOutline(i);

    const animations = [];

    if (tableHighlight) {
      animations.push(
        new M.FadeOut(tableHighlight)
      );
    }

    animations.push(
      new M.Create(next)
    );

    tableHighlight = next;

    return animations;
  }

  function clearTableHighlight() {
    if (!tableHighlight) return [];

    const old = tableHighlight;

    tableHighlight = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function removeTable() {
    return [
      new M.FadeOut(tableHead),

      ...remove(tableRows),

      ...cellList.flatMap(cell => [
        new M.FadeOut(cell.base),
        new M.FadeOut(cell.count),

        ...(cell.extras
          ? [new M.FadeOut(cell.extras)]
          : [])
      ]),

      new M.FadeOut(tableLegend),

      ...clearTableHighlight()
    ];
  }

  // ============================================================
  // MULTIPLICATION / CLUE COMBINATION VISUAL
  // ============================================================

  const FACTOR_SP = P ? 1.51 : 1.43;

  const FACTOR_Y = P ? -1.40 : -0.50;

  const factorX = i =>
    CX + (i - 1.5) * FACTOR_SP;

  function factorCard(
    i,
    label,
    value,
    color
  ) {
    const x = factorX(i);

    const w = FACTOR_SP * 0.85;

    const h = P ? 1.90 : 1.20;

    const body = rounded(
      w,
      h,
      [x, FACTOR_Y, 0],
      color,
      0.94
    );

    const name = fittedText(
      label,
      16,
      color,
      [
        x,
        FACTOR_Y + h * 0.28,
        0
      ],
      w - 0.12,
      true
    );

    const val = fittedText(
      value,
      P ? 27 : 24,
      color,
      [
        x,
        FACTOR_Y - 0.16,
        0
      ],
      w - 0.18,
      true
    );

    return new M.VGroup(
      body,
      name,
      val
    );
  }

  function multiplySign(i) {
    const x =
      (factorX(i) + factorX(i + 1)) / 2;

    return text(
      '×',
      P ? 23 : 21,
      GOLD,
      [x, FACTOR_Y, 0],
      true
    );
  }

  const combineTitle = heading(
    'COMBINE THE EVIDENCE'
  );

  const factors = [
    factorCard(
      0,
      'PRIOR',
      '1/3',
      C.cyan
    ),

    factorCard(
      1,
      'WEIGHT',
      'P(yes)',
      CLUE_COLORS[0]
    ),

    factorCard(
      2,
      'HUE',
      'P(yes)',
      CLUE_COLORS[1]
    ),

    factorCard(
      3,
      'FIRMNESS',
      'P(yes)',
      CLUE_COLORS[2]
    )
  ];

  const timesSigns = [
    multiplySign(0),
    multiplySign(1),
    multiplySign(2)
  ];

  const combineResult = tag(
    'UNNORMALISED SCORE',
    GOLD,
    [
      CX,
      P ? -3.50 : -1.98,
      0
    ],
    18
  );

  // ============================================================
  // SCORE CALCULATION ROWS
  // ============================================================

  const SCORE_Y = P
    ? [0.00, -1.95, -3.90]
    : [0.42, -0.64, -1.70];

  const SCORE_W = P ? 6.30 : 6.10;

  function calculationRow(i) {
    const row = ORIGINAL.rows[i];

    const y = SCORE_Y[i];
    const color = COLORS[i];

    const h = P ? 1.45 : 0.91;

    const body = rounded(
      SCORE_W,
      h,
      [CX, y, 0],
      color,
      0.94
    );

    const icon = fruit(
      row.label,
      [
        CX - SCORE_W / 2 + 0.34,
        y,
        0
      ],
      P ? 0.12 : 0.10
    );

    const name = leftText(
      row.label.toUpperCase(),
      P ? 16 : 14,
      color,
      CX - SCORE_W / 2 + 0.58,
      y + 0.22,
      true
    );

    const expression =
      '1/3 × ' +
      row.numerators
        .map(n => `${n}/6`)
        .join(' × ');

    const equation = fittedText(
      expression,
      P ? 20 : 18,
      C.ink,
      [CX - 0.50, y - 0.16, 0],
      P ? 3.85 : 3.75,
      true
    );

    return new M.VGroup(
      body,
      icon,
      name,
      equation
    );
  }

  function scoreResult(i) {
    const y = SCORE_Y[i];

    return text(
      `${SCORE_NUMERATORS[i]}/${COMMON_DENOMINATOR}`,
      P ? 22 : 20,
      COLORS[i],
      [
        CX + SCORE_W / 2 - 0.87,
        y - 0.08,
        0
      ],
      true
    );
  }

  let scoreRows = NAMES.map(
    (_, i) => calculationRow(i)
  );

  let scoreResults = NAMES.map(
    (_, i) => scoreResult(i)
  );

  const scoreTitle = heading(
    'ONE SCORE FOR EACH LABEL'
  );

  // ============================================================
  // SCORE COMPARISON AND PROBABILITY BARS
  // ============================================================

  // Before normalisation, compare the numerators because
  // all three scores have the same denominator, 648.
  //
  // After normalisation, all bars use a shared 0–100% scale.

  const BAR_X0 = CX - 2.70;
  const BAR_X1 = CX + 2.70;

  const BAR_W = BAR_X1 - BAR_X0;

  const BAR_H = P ? 0.50 : 0.28;

  const BAR_Y = P
    ? [0.00, -1.60, -3.20]
    : [0.48, -0.56, -1.60];

  function barRow(
    i,
    value,
    maximum,
    valueLabel,
    detail = null
  ) {
    const y = BAR_Y[i];
    const color = COLORS[i];

    const headerY = y + BAR_H / 2 + 0.20;

    const icon = fruit(
      NAMES[i],
      [BAR_X0 + 0.10, headerY, 0],
      P ? 0.11 : 0.09
    );

    const name = leftText(
      NAMES[i].toUpperCase(),
      P ? 18 : 16,
      color,
      BAR_X0 + 0.33,
      headerY,
      true
    );

    const val = rightText(
      valueLabel,
      P ? 25 : 22,
      color,
      BAR_X1,
      headerY,
      true
    );

    const track = rect(
      BAR_W,
      BAR_H,
      [CX, y, 0],
      C.muted,
      0.10,
      1
    );

    const width =
      BAR_W * value / maximum;

    const actualWidth =
      Math.max(0.001, width);

    const glow = rect(
      actualWidth,
      BAR_H + 0.08,
      [
        BAR_X0 + actualWidth / 2,
        y,
        0
      ],
      color,
      0.11,
      0
    );

    const body = rect(
      actualWidth,
      BAR_H,
      [
        BAR_X0 + actualWidth / 2,
        y,
        0
      ],
      color,
      0.90,
      1
    );

    const parts = [
      icon,
      name,
      val,
      track,
      glow,
      body
    ];

    if (detail) {
      parts.push(
        leftText(
          detail,
          P ? 15 : 13,
          C.muted,
          BAR_X0,
          y - BAR_H / 2 - 0.20,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function numeratorBars() {
    return SCORE_NUMERATORS.map((n, i) =>
      barRow(
        i,
        n,
        40,
        String(n),
        `score = ${n}/648`
      )
    );
  }

  function probabilityBars(result = ORIGINAL) {
    return result.probs.map((p, i) =>
      barRow(
        i,
        p,
        1,
        pct(p),
        `${result.rows[i].numeratorProduct}/${result.rows
          .reduce((a, row) =>
            a + row.numeratorProduct, 0)}`
      )
    );
  }

  function probabilityStrip(
    probs,
    y,
    width = BAR_W
  ) {
    const x0 = CX - width / 2;
    const h = P ? 0.30 : 0.23;

    let offset = 0;

    const pieces = probs.map((p, i) => {
      const w = p * width;

      const block = rect(
        Math.max(w, 0.001),
        h,
        [
          x0 + offset + w / 2,
          y,
          0
        ],
        COLORS[i],
        0.95,
        0
      );

      offset += w;

      return block;
    });

    const outline = rect(
      width,
      h,
      [CX, y, 0],
      C.ink,
      0,
      1
    );

    return new M.VGroup(
      ...pieces,
      outline
    );
  }

  function totalTag(
    s = 'TOTAL = 100%',
    color = C.green
  ) {
    return tag(
      s,
      color,
      [
        CX,
        P ? -5.40 : -2.65,
        0
      ],
      P ? 18 : 16
    );
  }

  let chartTitle = heading(
    'COMPARE THE THREE SCORES'
  );

  let bars = numeratorBars();

  let shareStrip = null;
  let chartTotal = null;

  // ============================================================
  // RELATED-CLUES LIMITATION
  // ============================================================

  // This is a hypothetical illustration of double-counting,
  // not an additional measurement introduced into DATA.

  function relatedClueCard(
    s,
    x,
    y,
    color
  ) {
    const w = P ? 2.65 : 2.50;
    const h = 0.88;

    const body = rounded(
      w,
      h,
      [x, y, 0],
      color,
      0.94
    );

    const title = fittedText(
      s,
      18,
      color,
      [x, y, 0],
      w - 0.20,
      true
    );

    return new M.VGroup(
      body,
      title
    );
  }

  const relatedY = P ? -0.15 : -0.15;

  const relatedTitle = heading(
    'WHEN CLUES REPEAT THE SAME INFORMATION'
  );

  const clueA = relatedClueCard(
    'CLUE A',
    CX - 1.48,
    relatedY,
    C.cyan
  );

  const clueB = relatedClueCard(
    'RELATED CLUE B',
    CX + 1.48,
    relatedY,
    GOLD
  );

  const sharedSourceY =
    relatedY + (P ? 0.95 : 0.90);

  const sharedSource = tag(
    'SAME UNDERLYING EVIDENCE',
    GOLD,
    [CX, sharedSourceY, 0],
    P ? 16 : 15
  );

  const sourceLines = [
    line(
      [CX - 0.45, sharedSourceY - 0.20, 0],
      [CX - 1.48, relatedY + 0.46, 0],
      GOLD,
      2
    ),

    line(
      [CX + 0.45, sharedSourceY - 0.20, 0],
      [CX + 1.48, relatedY + 0.46, 0],
      GOLD,
      2
    )
  ];

  const evidenceResult = relatedClueCard(
    'TOO MUCH CONFIDENCE?',
    CX,
    relatedY - 1.65,
    GOLD
  );

  const resultLines = [
    line(
      [CX - 1.48, relatedY - 0.46, 0],
      [CX - 0.50, relatedY - 1.19, 0],
      C.cyan,
      2
    ),

    line(
      [CX + 1.48, relatedY - 0.46, 0],
      [CX + 0.50, relatedY - 1.19, 0],
      GOLD,
      2
    )
  ];

  // ============================================================
  // TRY IT PREVIEW
  // ============================================================

  // The supplied engine interface provides narration scheduling
  // and animation playback. These controls are animated previews,
  // not actual pointer-driven toggles.
  //
  // Reset restores DATA and ORIGINAL_ANSWERS.
  // New data uses a separate hypothetical teaching dataset.

  const TRY_CONTROL_Y = P ? 0.58 : 0.83;

  const TRY_CONTROL_SP = P ? 2.12 : 1.94;

  const TRY_BAR_Y = P
    ? [-1.30, -2.75, -4.20]
    : [-0.32, -1.18, -2.04];

  function answerToggle(i, answer) {
    const x =
      CX + (i - 1) * TRY_CONTROL_SP;

    const y = TRY_CONTROL_Y;

    const w = P ? 1.90 : 1.78;
    const h = P ? 0.96 : 0.74;

    const body = rounded(
      w,
      h,
      [x, y, 0],
      answer ? YES : GOLD,
      0.94
    );

    const question = fittedText(
      QUESTIONS[i].short,
      P ? 15 : 13,
      CLUE_COLORS[i],
      [x, y + h * 0.25, 0],
      w - 0.16,
      true
    );

    const choiceW = w * 0.40;

    const yesX = x - choiceW / 2;
    const noX = x + choiceW / 2;

    const toggleY = y - h * 0.20;

    const yesBody = rect(
      choiceW,
      0.29,
      [yesX, toggleY, 0],
      YES,
      answer ? 0.85 : 0.10,
      1
    );

    const noBody = rect(
      choiceW,
      0.29,
      [noX, toggleY, 0],
      GOLD,
      answer ? 0.10 : 0.85,
      1
    );

    const yesText = text(
      'YES',
      P ? 15 : 12,
      answer ? WHITE : YES,
      [yesX, toggleY, 0],
      true
    );

    const noText = text(
      'NO',
      P ? 15 : 12,
      answer ? GOLD : WHITE,
      [noX, toggleY, 0],
      true
    );

    return new M.VGroup(
      body,
      question,
      yesBody,
      noBody,
      yesText,
      noText
    );
  }

  function tryBar(i, result) {
    const y = TRY_BAR_Y[i];

    const color = COLORS[i];
    const row = result.rows[i];

    const p = result.probs[i];

    const h = P ? 0.29 : 0.22;

    const headerY = y + (P ? 0.36 : 0.29);

    const width = BAR_W * p;

    const icon = fruit(
      row.label,
      [
        BAR_X0 + 0.10,
        headerY,
        0
      ],
      P ? 0.095 : 0.080
    );

    const name = leftText(
      row.label.toUpperCase(),
      P ? 17 : 14,
      color,
      BAR_X0 + 0.30,
      headerY,
      true
    );

    const percent = rightText(
      pct(p),
      P ? 22 : 20,
      color,
      BAR_X1,
      headerY,
      true
    );

    const track = rect(
      BAR_W,
      h,
      [CX, y, 0],
      C.muted,
      0.10,
      1
    );

    const body = rect(
      Math.max(width, 0.001),
      h,
      [BAR_X0 + width / 2, y, 0],
      color,
      0.90,
      1
    );

    const factors =
      '1/3 × ' +
      row.numerators
        .map(n => `${n}/${row.denominator}`)
        .join(' × ');

    const equation = fittedText(
      factors,
      P ? 15 : 12,
      C.muted,
      [
        CX,
        y - h / 2 - 0.20,
        0
      ],
      BAR_W,
      true
    );

    return new M.VGroup(
      icon,
      name,
      percent,
      track,
      body,
      equation
    );
  }

  function tryPanel(data, answers) {
    const result = calculate(
      data,
      answers
    );

    const parts = [];

    answers.forEach((answer, i) => {
      parts.push(
        answerToggle(i, answer)
      );
    });

    NAMES.forEach((_, i) => {
      parts.push(
        tryBar(i, result)
      );
    });

    const prediction = tag(
      resultLabel(result).toUpperCase(),
      resultColor(result),
      [
        CX,
        P ? -5.45 : -2.71,
        0
      ],
      P ? 18 : 16
    );

    parts.push(prediction);

    return new M.VGroup(...parts);
  }

  function tryBox(
    data,
    answers,
    title = 'NAIVE BAYES'
  ) {
    const result = calculate(
      data,
      answers
    );

    const answerText = answers.map(
      a => a ? 'Y' : 'N'
    ).join(', ');

    return fbox([
      [title, C.cyan],

      [`answers: ${answerText}`, C.ink],

      [
        `${pct(result.probs[0])} | ${pct(result.probs[1])} | ${pct(result.probs[2])}`,
        GOLD
      ],

      [
        resultLabel(result),
        resultColor(result)
      ]
    ], resultColor(result));
  }

  let tryNow = null;

  function updateTry(
    data,
    answers,
    title = 'NAIVE BAYES'
  ) {
    return [
      new M.Transform(
        tryNow,
        tryPanel(data, answers),
        { runTime: 1.15 }
      ),

      ...tryBox(
        data,
        answers,
        title
      )
    ];
  }

  // ============================================================
  // BEATS 0–2: CAN WE COMBINE SEVERAL CLUES?
  // ============================================================

  // 0. An unknown fruit arrives at the packing station.

  await until(S(0));

  await play(
    new M.FadeIn(packingStation),
    new M.FadeIn(incoming),

    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['which label belongs to it?', GOLD]
    ], GOLD),

    ...say('ANOTHER UNKNOWN FRUIT', WHITE)
  );

  // 1. Weight suggests plum, but colour may suggest
  // something different.

  await until(S(1));

  await play(
    reveal(
      [introWeight, introHue],
      1.20,
      0.20
    ),

    ...fbox([
      ['weight: one clue', C.cyan],
      ['colour: another clue', GOLD],
      ['clues may disagree', C.ink]
    ], GOLD),

    ...say('DIFFERENT CLUES MAY DISAGREE', GOLD)
  );

  // 2. Could the machine combine several clues?

  await until(S(2));

  await play(
    new M.FadeIn(combineTag),

    ...fbox([
      ['instead of one clue', C.ink],
      ['combine several clues', C.cyan],
      ['then choose a label', C.green]
    ]),

    ...say('CAN WE COMBINE THE EVIDENCE?')
  );

  // ============================================================
  // BEATS 3–6: KNOWN FRUITS AND THREE MEASUREMENTS
  // ============================================================

  // 3. Twelve known fruits arranged in three groups.

  await until(S(3));

  await play(
    new M.FadeOut(packingStation),
    new M.FadeOut(incoming),

    new M.FadeOut(introWeight),
    new M.FadeOut(introHue),
    new M.FadeOut(combineTag),

    new M.FadeIn(groupsTitle),

    reveal(groupsNow, 1.45, 0.20),

    ...fbox([
      ['12 labelled examples', C.ink],
      ['3 known fruit types', C.cyan]
    ]),

    ...say('OUR 12 KNOWN FRUITS')
  );

  // 4. Four plums, four apples, four pears.

  await until(S(4));

  await play(
    ...groupsNow.map((g, i) =>
      new M.Transform(
        g,
        groupCard(i, true),
        { runTime: 0.80 }
      )
    ),

    ...fbox([
      ['4 plums', PLUM],
      ['4 apples', APPLE],
      ['4 pears', PEAR]
    ]),

    ...say('4 PLUMS   4 APPLES   4 PEARS')
  );

  // 5. Use weight, hue and firmness.

  const measurements = measurementStrip();

  await until(S(5));

  await play(
    reveal(measurements, 1.10, 0.16),

    ...fbox([
      ['weight: grams', C.cyan],
      ['hue: colour position', GOLD],
      ['firmness: resistance', C.green]
    ]),

    ...say('THREE MEASUREMENTS')
  );

  // 6. Firmness measures resistance to pressing.

  const firmness = firmnessIndicator(3);

  await until(S(6));

  await play(
    new M.FadeIn(firmness),

    ...fbox([
      ['FIRMNESS', C.green],
      ['how much a fruit resists', C.ink],
      ['being pressed', C.ink],
      ['1 = softest, 4 = firmest', C.muted]
    ], C.green),

    ...say('FIRMNESS = RESISTANCE TO PRESSING', C.green)
  );

  // ============================================================
  // BEATS 7–12: TURN MEASUREMENTS INTO QUESTIONS
  // ============================================================

  // 7. Three questions with yes-or-no answers.

  questionCards = allQuestionCards();

  await until(S(7));

  await play(
    new M.FadeOut(groupsTitle),
    ...remove(groupsNow),

    ...remove(measurements),
    new M.FadeOut(firmness),

    new M.FadeIn(questionTitle),
    new M.FadeIn(clueDiamond),

    ...fbox([
      ['turn measurements into', C.ink],
      ['three simple questions', C.cyan],
      ['YES or NO', GOLD]
    ]),

    ...say('THREE YES-OR-NO QUESTIONS')
  );

  // 8. Does the fruit weigh 150 grams or less?

  await until(S(8));

  await play(
    new M.FadeIn(questionCards[0]),

    ...fbox([
      ['QUESTION 1: WEIGHT', C.cyan],
      ['150 grams or less?', C.ink]
    ]),

    ...say('WEIGHT ≤ 150 g')
  );

  // 9. Is its hue at least four?

  await until(S(9));

  await play(
    new M.FadeIn(
      questionCards[1],
      { runTime: 0.45 }
    ),

    ...say('HUE ≥ 4', GOLD)
  );

  // 10. Is its firmness at least three?

  await until(S(10));

  await play(
    new M.FadeIn(
      questionCards[2],
      { runTime: 0.45 }
    ),

    ...say('FIRMNESS ≥ 3', C.green)
  );

  // 11. The unknown fruit weighs 150 grams,
  // has hue 4 and firmness 3.

  await until(S(11));

  await play(
    ...questionCards.map((card, i) =>
      new M.Transform(
        card,
        questionCard(i, null, true),
        { runTime: 0.90 }
      )
    ),

    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['weight = 150 grams', C.cyan],
      ['hue = 4', GOLD],
      ['firmness = 3', C.green]
    ]),

    ...say('OUR NEW FRUIT: 150 g, HUE 4, FIRMNESS 3')
  );

  // 12. It answers yes to all three questions.

  await until(S(12));

  await play(
    new M.LaggedStart(
      questionCards.map((card, i) =>
        new M.Transform(
          card,
          questionCard(
            i,
            ORIGINAL_ANSWERS[i],
            true
          ),
          { runTime: 0.60 }
        )
      ),
      {
        lagRatio: 0.22,
        runTime: 1.20
      }
    ),

    ...fbox([
      ['weight: YES', YES],
      ['hue: YES', YES],
      ['firmness: YES', YES]
    ], YES),

    ...say('YES   YES   YES', YES)
  );

  // ============================================================
  // BEATS 13–16: STARTING PROBABILITIES — PRIORS
  // ============================================================

  // 13. A detective compares the clues with what is
  // already known about each fruit type.

  await until(S(13));

  await play(
    ...fbox([
      ['LIKE A DETECTIVE', GOLD],
      ['compare the observed clues', C.ink],
      ['with known examples', C.ink]
    ], GOLD),

    ...say('COMPARE THE CLUES WITH KNOWN FRUITS', GOLD)
  );

  // 14. Before seeing the clues, all three types
  // have equal shares among the known fruits.

  groupsNow = groupedFruits(true);

  groupsTitle = heading(
    'BEFORE LOOKING AT THE CLUES'
  );

  await until(S(14));

  await play(
    ...remove(questionCards),

    new M.FadeOut(questionTitle),
    new M.FadeOut(clueDiamond),

    new M.FadeIn(groupsTitle),

    reveal(groupsNow, 1.20, 0.15),

    ...fbox([
      ['before using the clues', C.ink],
      ['each type has 4 examples', C.cyan],
      ['equal starting shares', C.green]
    ]),

    ...say('ALL THREE TYPES START EQUALLY', C.green)
  );

  // 15. Four out of twelve gives a starting
  // probability of one third.

  const priors = NAMES.map(
    (_, i) => priorTag(i)
  );

  await until(S(15));

  await play(
    reveal(priors, 1.10, 0.16),

    ...fbox([
      ['4 fruits of each type', C.ink],
      ['12 known fruits in total', C.ink],
      ['4 ÷ 12 = 1/3', GOLD]
    ], GOLD),

    ...say('STARTING PROBABILITY = 1/3', GOLD)
  );

  // 16. This starting probability is called the prior.

  await until(S(16));

  await play(
    new M.LaggedStart(
      priors.map((p, i) =>
        new M.Indicate(p, {
          color: COLORS[i]
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.50
      }
    ),

    ...fbox([
      ['PRIOR', C.cyan],
      ['probability before looking', C.ink],
      ['at the new evidence', C.ink],
      ['here: 1/3 for each type', GOLD]
    ]),

    ...say('PRIOR = STARTING PROBABILITY')
  );

  // ============================================================
  // BEATS 17–23: COUNT THE YES ANSWERS
  // ============================================================

  // 17. How common is each yes answer among the plums?

  await until(S(17));

  await play(
    ...remove(groupsNow),
    ...remove(priors),

    new M.FadeOut(groupsTitle),

    new M.FadeIn(tableHead),
    new M.FadeIn(tableRows[0]),
    new M.FadeIn(tableLegend),

    ...fbox([
      ['START WITH PLUMS', PLUM],
      ['test each of the 4 plums', C.ink],
      ['against each question', C.ink]
    ], PLUM),

    ...say('COUNT THE YES ANSWERS AMONG PLUMS', PLUM)
  );

  // 18. All four plums answer yes to the weight question.

  await until(S(18));

  await play(
    ...showCell(cells[0][0]),

    ...fbox([
      ['PLUM: WEIGHT ≤ 150 g', PLUM],
      ['50, 150, 100, 100 g', C.ink],
      ['4 yes answers out of 4', GOLD]
    ], PLUM),

    ...say('PLUM WEIGHT: 4 YES OUT OF 4', PLUM)
  );

  // 19. Only one plum answers yes to the hue question.

  await until(S(19));

  await play(
    ...showCell(cells[0][1]),

    ...fbox([
      ['PLUM: HUE ≥ 4', PLUM],
      ['hues: 3, 3, 2, 4', C.ink],
      ['1 yes answer out of 4', GOLD]
    ], PLUM),

    ...say('PLUM HUE: 1 YES OUT OF 4', PLUM)
  );

  // 20. Three plums answer yes to firmness.

  await until(S(20));

  await play(
    ...showCell(cells[0][2]),

    ...fbox([
      ['PLUM: FIRMNESS ≥ 3', PLUM],
      ['firmness: 3, 4, 2, 3', C.ink],
      ['3 yes answers out of 4', GOLD]
    ], PLUM),

    ...say('PLUM FIRMNESS: 3 YES OUT OF 4', PLUM)
  );

  // 21. Apples have corresponding counts 0, 1 and 2.

  await until(S(21));

  await play(
    new M.FadeIn(tableRows[1]),

    ...showCellRow(1),

    ...fbox([
      ['APPLE YES COUNTS', APPLE],
      ['weight: 0 out of 4', C.ink],
      ['hue: 1 out of 4', C.ink],
      ['firmness: 2 out of 4', C.ink]
    ], APPLE),

    ...say('APPLE COUNTS: 0, 1, 2', APPLE)
  );

  // 22. Pear counts are 1, 4 and 1.

  await until(S(22));

  await play(
    new M.FadeIn(tableRows[2]),

    ...showCellRow(2),

    ...fbox([
      ['PEAR YES COUNTS', PEAR],
      ['weight: 1 out of 4', C.ink],
      ['hue: 4 out of 4', C.ink],
      ['firmness: 1 out of 4', C.ink]
    ], PEAR),

    ...say('PEAR COUNTS: 1, 4, 1', PEAR)
  );

  // 23. None of the four apples answers yes
  // to the weight question.

  const zeroOutline = cellOutline(1, 0);

  await until(S(23));

  await play(
    new M.Create(zeroOutline),

    ...fbox([
      ['APPLE WEIGHT QUESTION', APPLE],
      ['0 yes answers', GOLD],
      ['observed fraction = 0/4', C.ink]
    ], GOLD),

    ...say('NO LIGHTWEIGHT APPLES IN OUR SAMPLE', GOLD)
  );

  // ============================================================
  // BEATS 24–27: ADD-ONE SMOOTHING
  // ============================================================

  // 24. No lightweight apples in this small sample
  // does not mean lightweight apples are impossible.

  await until(S(24));

  await play(
    new M.Indicate(
      cells[1][0].count,
      { color: GOLD }
    ),

    ...fbox([
      ['NOT SEEN IN 4 EXAMPLES', GOLD],
      ['does not mean impossible', C.ink],
      ['a small sample is limited', C.muted]
    ], GOLD),

    ...say('NOT SEEN DOES NOT MEAN IMPOSSIBLE', GOLD)
  );

  // 25. Add one imaginary yes and one imaginary no
  // for each question in each group.

  cellList.forEach(cell => {
    cell.extras = extraAnswers(cell);
  });

  const imaginaryLegend = answerLegend(true);

  await until(S(25));

  await play(
    new M.FadeOut(zeroOutline),

    new M.FadeOut(tableLegend),
    new M.FadeIn(imaginaryLegend),

    new M.LaggedStart(
      cellList.map(cell =>
        new M.FadeIn(cell.extras)
      ),
      {
        lagRatio: 0.13,
        runTime: 2.40
      }
    ),

    ...fbox([
      ['FOR EVERY QUESTION', GOLD],
      ['add 1 imaginary YES', YES],
      ['add 1 imaginary NO', C.muted],
      ['not additional real fruits', C.ink]
    ], GOLD),

    ...say('ADD ONE IMAGINARY YES AND ONE NO', GOLD)
  );

  tableLegend = imaginaryLegend;

  // 26. Six answers per question instead of four.
  // No answer now has zero probability.

  await until(S(26));

  await play(
    ...cellList.map(cell =>
      changeCount(cell, true)
    ),

    ...fbox([
      ['4 real + 2 imaginary = 6', C.ink],
      ['yes count increases by 1', YES],
      ['no count increases by 1', C.muted],
      ['neither can have probability 0', GOLD]
    ], GOLD),

    ...say('EVERY QUESTION NOW HAS 6 ANSWERS', GOLD)
  );

  // 27. This adjustment is called add-one smoothing.

  await until(S(27));

  await play(
    ...fbox([
      ['ADD-ONE SMOOTHING', C.cyan],
      ['yes probability:', C.ink],
      ['(yes count + 1) ÷ (count + 2)', GOLD]
    ]),

    ...say('ADD-ONE SMOOTHING')
  );

  // ============================================================
  // BEATS 28–32: CONDITIONAL PROBABILITIES
  // ============================================================

  // 28. Plum probabilities are 5/6, 2/6, 4/6.

  await until(S(28));

  await play(
    ...highlightRow(0),

    ...cells[0].map(cell =>
      changeCount(cell, true, true)
    ),

    ...fbox([
      ['PLUM: YES PROBABILITIES', PLUM],
      ['weight: (4 + 1)/6 = 5/6', C.ink],
      ['hue: (1 + 1)/6 = 2/6', C.ink],
      ['firmness: (3 + 1)/6 = 4/6', C.ink]
    ], PLUM),

    ...say('PLUM: 5/6, 2/6, 4/6', PLUM)
  );

  // 29. Apple probabilities are 1/6, 2/6, 3/6.

  await until(S(29));

  await play(
    ...highlightRow(1),

    ...cells[1].map(cell =>
      changeCount(cell, true, true)
    ),

    ...fbox([
      ['APPLE: YES PROBABILITIES', APPLE],
      ['weight: (0 + 1)/6 = 1/6', C.ink],
      ['hue: (1 + 1)/6 = 2/6', C.ink],
      ['firmness: (2 + 1)/6 = 3/6', C.ink]
    ], APPLE),

    ...say('APPLE: 1/6, 2/6, 3/6', APPLE)
  );

  // 30. Pear probabilities are 2/6, 5/6, 2/6.

  await until(S(30));

  await play(
    ...highlightRow(2),

    ...cells[2].map(cell =>
      changeCount(cell, true, true)
    ),

    ...fbox([
      ['PEAR: YES PROBABILITIES', PEAR],
      ['weight: (1 + 1)/6 = 2/6', C.ink],
      ['hue: (4 + 1)/6 = 5/6', C.ink],
      ['firmness: (1 + 1)/6 = 2/6', C.ink]
    ], PEAR),

    ...say('PEAR: 2/6, 5/6, 2/6', PEAR)
  );

  // 31. Each probability describes the chance of an answer
  // when the fruit type is already known.

  await until(S(31));

  await play(
    ...clearTableHighlight(),

    ...highlightRow(0),

    ...fbox([
      ['SUPPOSE IT IS A PLUM', PLUM],
      ['how likely is a YES answer?', C.ink],
      ['weight: 5/6', C.cyan]
    ], PLUM),

    ...say('CHANCE OF AN ANSWER GIVEN THE FRUIT TYPE')
  );

  // 32. This is called conditional probability.

  await until(S(32));

  await play(
    ...fbox([
      ['CONDITIONAL PROBABILITY', C.cyan],
      ['chance of an answer', C.ink],
      ['given a known fruit type', GOLD]
    ]),

    ...say('CONDITIONAL PROBABILITY')
  );

  // ============================================================
  // BEATS 33–36: THE NAIVE BAYES ASSUMPTION
  // ============================================================

  // 33. Within each fruit type, assume that knowing
  // one answer does not change the chance of another.
  //
  // This is an assumption of the method, not a proven
  // property of the fruit measurements.

  await until(S(33));

  await play(
    ...clearTableHighlight(),

    ...fbox([
      ['SIMPLIFYING ASSUMPTION', GOLD],
      ['within a fruit type:', C.ink],
      ['treat the three answers', C.ink],
      ['as independent', GOLD]
    ], GOLD),

    ...say('ASSUME INDEPENDENCE WITHIN EACH FRUIT TYPE', GOLD)
  );

  // 34. Under that assumption, multiply the
  // three conditional probabilities.

  await until(S(34));

  await play(
    ...removeTable(),

    new M.FadeIn(combineTitle),

    reveal(
      factors.slice(1),
      1.20,
      0.18
    ),

    reveal(
      timesSigns.slice(1),
      0.80
    ),

    ...fbox([
      ['COMBINE THE THREE CLUES', C.cyan],
      ['weight probability', C.ink],
      ['× hue probability', C.ink],
      ['× firmness probability', C.ink]
    ]),

    ...say('MULTIPLY THE THREE CLUE PROBABILITIES')
  );

  // 35. Also multiply by the prior of one third.

  await until(S(35));

  await play(
    new M.FadeIn(factors[0]),

    new M.FadeIn(timesSigns[0]),

    new M.FadeIn(combineResult),

    ...fbox([
      ['START WITH THE PRIOR', C.cyan],
      ['1/3', GOLD],
      ['× all three clue probabilities', C.ink]
    ]),

    ...say('ALSO MULTIPLY BY THE PRIOR', GOLD)
  );

  // 36. This method is called Naive Bayes.
  // Naive refers to the independence assumption.

  await until(S(36));

  await play(
    ...fbox([
      ['NAIVE BAYES', C.cyan],
      ['naive = simplifying assumption', GOLD],
      ['answers treated as independent', C.ink],
      ['within each fruit type', C.ink]
    ], GOLD),

    ...say('NAIVE BAYES')
  );

  // ============================================================
  // BEATS 37–40: CALCULATE THE THREE RAW SCORES
  // ============================================================

  // 37. Plum: 1/3 × 5/6 × 2/6 × 4/6.

  await until(S(37));

  await play(
    new M.FadeOut(combineTitle),
    ...remove(factors),
    ...remove(timesSigns),

    new M.FadeOut(combineResult),

    new M.FadeIn(scoreTitle),
    new M.FadeIn(scoreRows[0]),

    ...fbox([
      ['PLUM SCORE', PLUM],
      ['1/3 × 5/6 × 2/6 × 4/6', C.ink],
      ['prior × three probabilities', C.muted]
    ], PLUM),

    ...say('PLUM: MULTIPLY THE FOUR FRACTIONS', PLUM)
  );

  // 38. Multiply the top numbers and bottom numbers.
  //
  // Numerator = 1 × 5 × 2 × 4 = 40
  // Denominator = 3 × 6 × 6 × 6 = 648

  await until(S(38));

  await play(
    new M.FadeIn(scoreResults[0]),

    ...fbox([
      ['top: 1 × 5 × 2 × 4 = 40', PLUM],
      ['bottom: 3 × 6 × 6 × 6', C.ink],
      ['       = 648', C.ink],
      ['plum score = 40/648', GOLD]
    ], PLUM),

    ...say('PLUM SCORE = 40/648', PLUM)
  );

  // 39. Apple score = 6/648.

  await until(S(39));

  await play(
    new M.FadeIn(scoreRows[1]),

    new M.FadeIn(scoreResults[1]),

    ...fbox([
      ['APPLE SCORE', APPLE],
      ['1/3 × 1/6 × 2/6 × 3/6', C.ink],
      ['= 6/648', APPLE]
    ], APPLE),

    ...say('APPLE SCORE = 6/648', APPLE)
  );

  // 40. Pear score = 20/648.

  await until(S(40));

  await play(
    new M.FadeIn(scoreRows[2]),

    new M.FadeIn(scoreResults[2]),

    ...fbox([
      ['PEAR SCORE', PEAR],
      ['1/3 × 2/6 × 5/6 × 2/6', C.ink],
      ['= 20/648', PEAR]
    ], PEAR),

    ...say('PEAR SCORE = 20/648', PEAR)
  );

  // ============================================================
  // BEATS 41–44: NORMALISE THE SCORES
  // ============================================================

  // 41. All three scores have the same denominator.
  // Compare their numerators directly.

  await until(S(41));

  await play(
    new M.FadeOut(scoreTitle),

    ...remove(scoreRows),
    ...remove(scoreResults),

    new M.FadeIn(chartTitle),

    reveal(bars, 1.25, 0.15),

    ...fbox([
      ['40/648, 6/648, 20/648', C.ink],
      ['same bottom number: 648', C.muted],
      ['compare 40, 6 and 20', GOLD]
    ], GOLD),

    ...say('SAME DENOMINATOR: COMPARE THE TOP NUMBERS')
  );

  // 42. Forty plus six plus twenty gives sixty-six.

  chartTotal = totalTag(
    '40 + 6 + 20 = 66',
    GOLD
  );

  await until(S(42));

  await play(
    new M.FadeIn(chartTotal),

    ...fbox([
      ['40 + 6 + 20', C.ink],
      [`= ${NUMERATOR_TOTAL}`, GOLD],
      ['total score = 66/648', C.muted]
    ], GOLD),

    ...say('40 + 6 + 20 = 66', GOLD)
  );

  // 43. Divide plum's share by the total:
  // (40/648) / (66/648) = 40/66 ≈ 60.6%.
  //
  // Replace the numerator comparison with a common
  // probability scale. Do not mix the two scales.

  const finalBars = probabilityBars();

  const probabilityTitle = heading(
    'SHARE 100% AMONG THE LABELS'
  );

  const oldTotal = chartTotal;

  chartTotal = null;

  await until(S(43));

  await play(
    new M.FadeOut(chartTitle),
    new M.FadeOut(oldTotal),

    ...remove(bars),

    new M.FadeIn(probabilityTitle),

    new M.FadeIn(finalBars[0]),

    ...fbox([
      ['PLUM PROBABILITY', PLUM],
      ['(40/648) ÷ (66/648)', C.ink],
      ['= 40/66', C.ink],
      [`≈ ${pct(PROBS[0])}`, PLUM]
    ], PLUM),

    ...say(`PLUM ≈ ${pct(PROBS[0])}`, PLUM)
  );

  chartTitle = probabilityTitle;
  bars = finalBars;

  // 44. Apple receives about 9.1%, pear 30.3%.

  shareStrip = probabilityStrip(
    PROBS,
    P ? -4.55 : -2.24
  );

  chartTotal = totalTag(
    'TOTAL = 100%',
    C.green
  );

  await until(S(44));

  await play(
    new M.FadeIn(bars[1]),
    new M.FadeIn(bars[2]),

    ...fbox([
      ['APPLE: 6/66', APPLE],
      [`≈ ${pct(PROBS[1])}`, APPLE],
      ['PEAR: 20/66', PEAR],
      [`≈ ${pct(PROBS[2])}`, PEAR]
    ]),

    ...say('APPLE 9.1%   PEAR 30.3%')
  );

  await play(
    new M.FadeIn(shareStrip),

    new M.FadeIn(chartTotal),

    ...fbox([
      [`plum  ≈ ${pct(PROBS[0])}`, PLUM],
      [`apple ≈ ${pct(PROBS[1])}`, APPLE],
      [`pear  ≈ ${pct(PROBS[2])}`, PEAR],
      ['exact total = 100%', C.green]
    ], C.green)
  );

  // ============================================================
  // BEATS 45–49: PREDICTION AND GENERAL FORMULAS
  // ============================================================

  // 45. Plum receives the largest share.

  const winnerOutline = rounded(
    BAR_W + 0.30,
    P ? 1.02 : 0.83,
    [
      CX,
      BAR_Y[0] + 0.10,
      0
    ],
    GOLD,
    0
  );

  await until(S(45));

  await play(
    new M.Create(winnerOutline),

    new M.Indicate(
      bars[0],
      { color: PLUM }
    ),

    ...fbox([
      [`largest share = ${pct(PROBS[0])}`, PLUM],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('PREDICTION: PLUM', PLUM)
  );

  // 46. Write the two steps as short formulas.

  await until(S(46));

  await play(
    new M.FadeOut(winnerOutline),

    ...fbox([
      ['NAIVE BAYES: TWO STEPS', C.cyan],
      ['1. calculate each score', GOLD],
      ['2. divide by their total', C.green]
    ]),

    ...say('TWO SHORT FORMULAS')
  );

  // 47. Score = prior × conditional probability
  // of each observed answer.

  await until(S(47));

  await play(
    ...fbox([
      ['score = prior', GOLD],
      ['      × P(weight answer | type)', C.cyan],
      ['      × P(hue answer | type)', GOLD],
      ['      × P(firmness answer | type)', C.green]
    ], GOLD),

    ...say('SCORE = PRIOR × CLUE PROBABILITIES', GOLD)
  );

  // 48. Predicted probability equals the score
  // divided by the sum of all three scores.

  await until(S(48));

  await play(
    ...fbox([
      ['predicted probability', C.cyan],
      ['= label score ÷ total score', GOLD],
      ['total = plum + apple + pear scores', C.ink]
    ]),

    ...say('PROBABILITY = SCORE ÷ TOTAL SCORE')
  );

  // 49. Naive Bayes combines several pieces of evidence
  // when choosing between possible labels.

  await until(S(49));

  await play(
    ...fbox([
      ['START WITH THE PRIOR', C.cyan],
      ['combine the observed clues', GOLD],
      ['compare the resulting chances', C.green]
    ]),

    ...say('COMBINE EVIDENCE TO CHOOSE A LABEL', C.green)
  );

  // ============================================================
  // BEAT 50: RELATED CLUES CAN DOUBLE-COUNT EVIDENCE
  // ============================================================

  // 50. Related clues may make the machine too confident.
  //
  // The method assumes conditional independence.
  // If clues contain overlapping information, multiplication
  // may effectively count the same evidence more than once.

  await until(S(50));

  await play(
    new M.FadeOut(chartTitle),

    ...remove(bars),

    new M.FadeOut(shareStrip),
    new M.FadeOut(chartTotal),

    new M.FadeIn(relatedTitle),
    new M.FadeIn(sharedSource),

    reveal([clueA, clueB], 1.0, 0.15),

    ...sourceLines.map(l =>
      new M.Create(l)
    ),

    ...fbox([
      ['IMPORTANT LIMITATION', GOLD],
      ['related clues can repeat', C.ink],
      ['the same information', C.ink]
    ], GOLD),

    ...say('RELATED CLUES CAN DOUBLE-COUNT EVIDENCE', GOLD)
  );

  await play(
    ...resultLines.map(l =>
      new M.Create(l)
    ),

    new M.FadeIn(evidenceResult),

    ...fbox([
      ['treating related clues', C.ink],
      ['as independent can make', C.ink],
      ['the machine too confident', GOLD]
    ], GOLD)
  );

  // ============================================================
  // BEATS 51–53: TRY IT PREVIEW
  // ============================================================

  // 51. Change the three answers and watch scores,
  // probabilities and prediction update together.

  tryNow = tryPanel(
    DATA,
    ORIGINAL_ANSWERS
  );

  await until(S(51));

  await play(
    new M.FadeOut(relatedTitle),
    new M.FadeOut(sharedSource),

    new M.FadeOut(clueA),
    new M.FadeOut(clueB),

    ...remove(sourceLines),
    ...remove(resultLines),

    new M.FadeOut(evidenceResult),

    new M.FadeIn(tryNow),

    ...tryBox(
      DATA,
      ORIGINAL_ANSWERS,
      'STARTING ANSWERS'
    ),

    ...say('TRY IT: CHANGE THE THREE ANSWERS', C.green)
  );

  // Demonstrate a hypothetical change to the hue answer.
  // The fixed training measurements remain unchanged.

  const HUE_NO = [
    true,
    false,
    true
  ];

  await play(
    ...updateTry(
      DATA,
      HUE_NO,
      'CHANGE HUE TO NO'
    )
  );

  // 52. Make all three answers yes.
  // Restore the exact lesson query and verify that plum wins.

  await until(S(52));

  await play(
    ...updateTry(
      DATA,
      ORIGINAL_ANSWERS,
      'ALL THREE ANSWERS YES'
    ),

    ...say('TRY IT: YES, YES, YES', C.green)
  );

  await play(
    ...fbox([
      ['answers: YES, YES, YES', C.ink],
      ['plum  ≈ 60.6%', PLUM],
      ['apple ≈ 9.1%', APPLE],
      ['pear  ≈ 30.3%', PEAR]
    ], PLUM)
  );

  // 53. Predict what happens if only the weight answer
  // becomes no, then check and explore New data.
  //
  // For a NO answer, use:
  //
  // P(no | type) = (no count + 1)/(count + 2).
  //
  // Weight NO, hue YES, firmness YES:
  //
  // Plum:  1/3 × 1/6 × 2/6 × 4/6 = 8/648
  // Apple: 1/3 × 5/6 × 2/6 × 3/6 = 30/648
  // Pear:  1/3 × 4/6 × 5/6 × 2/6 = 40/648
  //
  // Normalised:
  //
  // Plum:  8/78 ≈ 10.3%
  // Apple: 30/78 ≈ 38.5%
  // Pear:  40/78 ≈ 51.3%
  //
  // Rounded displayed values may differ slightly from 100%.
  // Internally the probabilities always sum to one.

  const WEIGHT_NO = [
    false,
    true,
    true
  ];

  const WEIGHT_NO_RESULT = calculate(
    DATA,
    WEIGHT_NO
  );

  await until(S(53));

  await play(
    ...fbox([
      ['PREDICT FIRST', GOLD],
      ['weight becomes NO', C.ink],
      ['hue and firmness stay YES', C.ink],
      ['which label will win?', GOLD]
    ], GOLD),

    ...say('TRY IT: CHANGE ONLY WEIGHT TO NO', C.green)
  );

  await play(
    ...updateTry(
      DATA,
      WEIGHT_NO,
      'WEIGHT NO: CHECK'
    )
  );

  // Fresh hypothetical data for the narrated New data preview.
  // Keep four fruits of each type so the starting priors
  // remain exactly one third.
  // DATA is never mutated.

  const FRESH = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 4, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 100, hue: 3, firmness: 2 },
    { id: 'P3', label: 'plum',  weight: 150, hue: 5, firmness: 4 },
    { id: 'P4', label: 'plum',  weight: 200, hue: 3, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 150, hue: 4, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 250, hue: 5, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 2, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 350, hue: 3, firmness: 3 },

    { id: 'R1', label: 'pear',  weight: 100, hue: 6, firmness: 2 },
    { id: 'R2', label: 'pear',  weight: 150, hue: 7, firmness: 3 },
    { id: 'R3', label: 'pear',  weight: 200, hue: 8, firmness: 4 },
    { id: 'R4', label: 'pear',  weight: 250, hue: 5, firmness: 2 }
  ];

  await play(
    ...updateTry(
      FRESH,
      WEIGHT_NO,
      'NEW DATA'
    ),

    ...say('TRY IT: EXPLORE NEW DATA', C.green)
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE EXACT ORIGINAL EXAMPLE
  // ============================================================

  // Restore the original twelve fruits and all three
  // original YES answers.
  //
  // The original prior, smoothed conditional probabilities,
  // scores and normalised probabilities are unchanged.

  const recapTitle = heading(
    'COMBINE CLUES TO PREDICT A LABEL'
  );

  const recapBars = probabilityBars(
    ORIGINAL
  );

  const recapStrip = probabilityStrip(
    PROBS,
    P ? -4.55 : -2.24
  );

  const recapTotal = totalTag(
    'TOTAL = 100%',
    C.green
  );

  // 54. Naive Bayes starts with what we already know
  // and combines clues to estimate the most likely label.

  await until(S(54));

  await play(
    new M.FadeOut(tryNow),

    new M.FadeIn(recapTitle),

    reveal(
      recapBars,
      1.40,
      0.16
    ),

    new M.FadeIn(recapStrip),
    new M.FadeIn(recapTotal),

    ...fbox([
      ['NAIVE BAYES', C.cyan],
      ['1. start with the prior', C.ink],
      ['2. multiply the clue probabilities', GOLD],
      ['3. normalise the scores', C.green]
    ]),

    ...say('NAIVE BAYES: START WITH WHAT WE KNOW')
  );

  await play(
    new M.Indicate(
      recapBars[0],
      {
        color: PLUM,
        runTime: 1.0
      }
    ),

    ...fbox([
      ['prior × observed clues', C.ink],
      ['estimate each label’s chance', C.cyan],
      [`plum ≈ ${pct(PROBS[0])}`, PLUM],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('COMBINE CLUES TO ESTIMATE THE MOST LIKELY LABEL', C.green)
  );
}

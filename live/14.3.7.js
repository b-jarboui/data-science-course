// lesson 14.3.7
// t-SNE: bringing similar items together
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed chapter 14.3 teaching data.
//
// Teaching example:
//   Four teas: A, B, C, D.
//   Original distances use all twelve tasting attributes.
//   Gaussian bandwidth = 4.
//   Symmetric input probabilities over ordered pairs.
//   Ordinary Student-t map similarities.
//   Full-batch gradient descent, learning rate = 1.
//   No momentum and no early exaggeration.
//
// All movements, similarity probabilities and loss values
// are calculated directly rather than hard-coded.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

  const ALL_TEAS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
  ];

  const ATTRS = [
    'Floral', 'Jasmine', 'Rose', 'Blossom', 'Honey', 'Fruit',
    'Roast', 'Toast', 'Nut', 'Cocoa', 'Caramel', 'Smoke'
  ];

  const SHORT = [
    'Flo', 'Jas', 'Ros', 'Blo', 'Hon', 'Fru',
    'Rst', 'Tst', 'Nut', 'Coc', 'Car', 'Smk'
  ];

  const D = [
    [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    [7, 9, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    [9, 7, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7],
    [9, 7, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7]
  ];

  // The animated example uses only the first four teas.

  const TEAS = ALL_TEAS.slice(0, 4);
  const DATA = D.slice(0, 4);

  const N = DATA.length;

  const sum = a =>
    a.reduce((s, v) => s + v, 0);

  const squaredDistance = (a, b) =>
    sum(a.map((v, j) => (v - b[j]) ** 2));

  const DIST2 = DATA.map(a =>
    DATA.map(b => squaredDistance(a, b))
  );

  const PAIRS = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3]
  ];

  const CLOSE_PAIRS = [
    [0, 1],
    [2, 3]
  ];

  const WEAK_PAIRS = [
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3]
  ];

  // ------------------------------------------------------------
  // Original-space similarity probabilities.
  //
  // Gaussian bandwidth sigma = 4.
  //
  // Unnormalized weight:
  //   exp(−distance² / (2 × sigma²))
  //
  // Conditional probabilities are normalized within each row,
  // then symmetrized using:
  //
  //   p_ij = (p_j|i + p_i|j) / (2N)
  //
  // For these particular teaching data, every row has the
  // same normalization constant.
  //
  // Sum over all ordered pairs = 1.
  // Diagonal probabilities = 0.
  // ------------------------------------------------------------

  const SIGMA = 4;

  const INPUT_WEIGHTS = DIST2.map((row, i) =>
    row.map((d2, j) =>
      i === j
        ? 0
        : Math.exp(
            -d2 / (2 * SIGMA * SIGMA)
          )
    )
  );

  const CONDITIONAL = INPUT_WEIGHTS.map(row => {
    const total = sum(row);

    return row.map(v => v / total);
  });

  const INPUT_P = Array.from(
    { length: N },
    (_, i) =>
      Array.from(
        { length: N },
        (_, j) =>
          i === j
            ? 0
            : (
                CONDITIONAL[i][j] +
                CONDITIONAL[j][i]
              ) / (2 * N)
      )
  );

  // Exact teaching-example probabilities, rounded:
  //
  // A–B and C–D: 0.22447 per ordered pair.
  // A–C and B–D: 0.01435 per ordered pair.
  // A–D and B–C: 0.01118 per ordered pair.

  // ------------------------------------------------------------
  // Actual t-SNE calculation.
  //
  // Map similarity weight:
  //
  //   w_ij = 1 / (1 + ||y_i − y_j||²)
  //
  // Normalized map probability:
  //
  //   q_ij = w_ij / sum of all ordered-pair weights
  //
  // Loss:
  //
  //   KL(P || Q) = sum p_ij log(p_ij / q_ij)
  //
  // Gradient:
  //
  //   4 sum_j (p_ij − q_ij) w_ij (y_i − y_j)
  //
  // Every gradient is calculated using the same old map.
  // All positions are updated together.
  // ------------------------------------------------------------

  const START = [
    [-1, -1],
    [-1,  1],
    [ 1, -1],
    [ 1,  1]
  ];

  const LEARNING_RATE = 1;
  const MAX_ITER = 16;

  const copyPositions = Y =>
    Y.map(p => p.slice());

  function mapWeights(Y) {
    return Y.map((a, i) =>
      Y.map((b, j) =>
        i === j
          ? 0
          : 1 / (
              1 + squaredDistance(a, b)
            )
      )
    );
  }

  function mapProbabilities(Y) {
    const w = mapWeights(Y);

    const total = sum(
      w.map(row => sum(row))
    );

    return {
      weights: w,
      total,
      q: w.map(row =>
        row.map(v => v / total)
      )
    };
  }

  function tsneLoss(Y) {
    const { q } = mapProbabilities(Y);

    let loss = 0;

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === j) continue;

        const p = INPUT_P[i][j];

        if (p > 0) {
          loss += p * Math.log(
            p / q[i][j]
          );
        }
      }
    }

    return loss;
  }

  function tsneStep(Y) {
    const {
      weights,
      q
    } = mapProbabilities(Y);

    const gradient = Y.map(
      () => [0, 0]
    );

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === j) continue;

        const coefficient =
          4 *
          (INPUT_P[i][j] - q[i][j]) *
          weights[i][j];

        gradient[i][0] +=
          coefficient *
          (Y[i][0] - Y[j][0]);

        gradient[i][1] +=
          coefficient *
          (Y[i][1] - Y[j][1]);
      }
    }

    const delta = gradient.map(g => [
      -LEARNING_RATE * g[0],
      -LEARNING_RATE * g[1]
    ]);

    const next = Y.map((p, i) => [
      p[0] + delta[i][0],
      p[1] + delta[i][1]
    ]);

    return {
      positions: next,
      delta,
      loss: tsneLoss(next)
    };
  }

  const HISTORY = [{
    positions: copyPositions(START),
    delta: DATA.map(() => [0, 0]),
    loss: tsneLoss(START)
  }];

  for (let i = 1; i <= MAX_ITER; i++) {
    HISTORY.push(
      tsneStep(
        HISTORY[i - 1].positions
      )
    );
  }

  // Checked values for tea D:
  //
  // Step 0:
  //   position = (1.000, 1.000)
  //   loss = 0.565
  //
  // Step 1:
  //   change = (+0.172, −0.164)
  //   position = (1.172, 0.836)
  //   loss = 0.361
  //
  // Step 2:
  //   change = (+0.126, −0.146)
  //   position = (1.297, 0.690)
  //   loss = 0.227
  //
  // Step 3:
  //   change = (+0.092, −0.124)
  //   position = (1.390, 0.566)
  //   loss = 0.142

  // ------------------------------------------------------------
  // Course palette.
  // ------------------------------------------------------------

  const CYAN = C.cyan;
  const AMBER = C.amber;
  const PINK = C.pink || '#F472B6';
  const GREEN = C.green;
  const VIOLET = C.violet;
  const MUTED = C.muted;
  const INK = C.ink;
  const CARD = C.card;

  const STRONG = CYAN;
  const WEAK = MUTED;
  const LOSS = GREEN;

  const ac = j =>
    j < 6 ? CYAN : AMBER;

  const teaColor = i =>
    i < 2 ? CYAN : AMBER;

  const number = v =>
    v < 0
      ? `−${Math.abs(v)}`
      : String(v);

  const fixed = (v, digits = 3) =>
    v.toFixed(digits).replace('-', '−');

  const signed = (v, digits = 3) =>
    v < 0
      ? `−${Math.abs(v).toFixed(digits)}`
      : `+${v.toFixed(digits)}`;

  const pairName = (i, j) =>
    `${TEAS[i]}–${TEAS[j]}`;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 × 14.22, content y = −5.5 ... 4.3
  // Laptop: 14.22 × 8, content y = −3.0 ... 2.3
  //
  // Match the previous chapter 14.3 scenes.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.45, 0]
    : [4.3, -0.3, 0];

  const ROSTER_Y = P ? -5.12 : -2.82;

  const MAIN_W = P ? FW - 0.9 : 7.25;

  const say = (s, c = CYAN) =>
    showA(s, c, PILL);

  const pos = (x, y) =>
    [x, y, 0];

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function at(
    s, size, color, x, y,
    mono = false, maxw = null
  ) {
    const t = T(
      String(s),
      size,
      color,
      mono
    );

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
      t.scale(
        maxw / t.getWidth()
      );
    }

    t.moveTo(pos(x, y));

    return t;
  }

  function line(
    a, b,
    color = MUTED,
    width = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width
    });
  }

  function rect(
    x, y, w, h, color,
    opacity = 0.82,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width: Math.max(w, 0.012),
      height: Math.max(h, 0.012),
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function outline(
    x, y, w, h,
    color = CYAN,
    opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        0.13,
        w / 5,
        h / 5
      ),
      color,
      strokeWidth: 2
    });

    r.setFill(CARD, opacity);
    r.moveTo(pos(x, y));

    return r;
  }

  function glowDot(
    p,
    color = CYAN,
    radius = 0.09
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.2,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(
      halo, d
    );
  }

  function glowingBar(
    x, base, v,
    scale, width, color
  ) {
    const h = Math.max(
      Math.abs(v) * scale,
      0.022
    );

    const y = base +
      (v < 0 ? -h / 2 : h / 2);

    const halo = rect(
      x, y,
      width + 0.045,
      h + 0.025,
      color,
      0.12,
      0
    );

    const bar = rect(
      x, y,
      width, h,
      color,
      v === 0 ? 0.22 : 0.84,
      1
    );

    return new M.VGroup(
      halo, bar
    );
  }

  function arrow(
    a, b,
    color = CYAN,
    width = 3,
    head = 0.17
  ) {
    const theta = Math.atan2(
      b[1] - a[1],
      b[0] - a[0]
    );

    const length = Math.hypot(
      b[0] - a[0],
      b[1] - a[1]
    );

    const h = Math.min(
      head,
      length * 0.42
    );

    const p1 = pos(
      b[0] - h * Math.cos(
        theta - Math.PI / 6
      ),

      b[1] - h * Math.sin(
        theta - Math.PI / 6
      )
    );

    const p2 = pos(
      b[0] - h * Math.cos(
        theta + Math.PI / 6
      ),

      b[1] - h * Math.sin(
        theta + Math.PI / 6
      )
    );

    return new M.VGroup(
      line(a, b, color, width),
      line(b, p1, color, width),
      line(b, p2, color, width)
    );
  }

  function doubleArrow(
    a, b,
    color = CYAN,
    width = 2.5
  ) {
    return new M.VGroup(
      arrow(a, b, color, width),
      arrow(b, a, color, width)
    );
  }

  function tagAt(
    text, color, x, y,
    size = 17,
    maxw = MAIN_W - 0.4
  ) {
    const tag = pill(
      text, color, size
    );

    if (tag.getWidth() > maxw) {
      tag.scale(
        maxw / tag.getWidth()
      );
    }

    tag.moveTo(pos(x, y));

    return tag;
  }

  // ------------------------------------------------------------
  // Formula box.
  //
  // Only one formula box is visible at a time.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = CYAN
  ) {
    const size = P ? 20 : 20;
    const lh = P ? 0.33 : 0.39;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, INK]
    );

    const texts = rows.map(
      ([s, c]) =>
        T(
          String(s).trimStart(),
          size,
          c,
          true
        )
    );

    const cw =
      T(
        '0000000000',
        size,
        INK,
        true
      ).getWidth() / 10;

    const widths = texts.map(
      (t, i) => {
        const raw = String(rows[i][0]);

        const indent =
          raw.length -
          raw.trimStart().length;

        return t.getWidth() +
          cw * indent;
      }
    );

    const wd =
      Math.max(...widths) + 0.64;

    const ht =
      rows.length * lh + 0.32;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(CARD, 0.95);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.32;

    const top =
      BOXP[1] + ht / 2 -
      0.16 - lh / 2;

    texts.forEach((t, i) => {
      const raw = String(rows[i][0]);

      const indent = cw * (
        raw.length -
        raw.trimStart().length
      );

      t.moveTo(pos(
        left + indent +
          t.getWidth() / 2,
        top - i * lh
      ));
    });

    const g = new M.VGroup(
      r, ...texts
    );

    const maxw =
      P ? FW - 1.2 : 4.0;

    const maxh =
      P ? 1.62 : 3.5;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const a = [
      new M.FadeIn(g)
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(boxNow)
      );
    }

    boxNow = g;

    return a;
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
  // Picture management.
  //
  // Never regroup already visible objects.
  // Each object remains independently removable.
  // ------------------------------------------------------------

  let picture = [];
  let focusNow = null;

  function clearFocus() {
    if (!focusNow) return [];

    const old = focusNow;
    focusNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  function focus(g) {
    const a = clearFocus();

    focusNow = g;

    a.push(
      new M.FadeIn(g)
    );

    return a;
  }

  function scene(...objects) {
    const a = [
      ...clearFocus(),

      ...picture.map(o =>
        new M.FadeOut(o)
      ),

      ...objects.map(o =>
        new M.FadeIn(o)
      )
    ];

    picture = objects.slice();

    return a;
  }

  function enter(...objects) {
    picture.push(...objects);

    return objects.map(o =>
      new M.FadeIn(o)
    );
  }

  function leave(...objects) {
    picture = picture.filter(
      o => !objects.includes(o)
    );

    return objects.map(o =>
      new M.FadeOut(o)
    );
  }

  function enterLagged(
    objects,
    lagRatio = 0.10,
    runTime = 1.2
  ) {
    picture.push(...objects);

    return [
      new M.LaggedStart(
        objects.map(o =>
          new M.FadeIn(o)
        ),
        { lagRatio, runTime }
      )
    ];
  }

  // ------------------------------------------------------------
  // Persistent tea roster.
  //
  // A–D are the active teas in this lesson.
  // E–H remain visible but muted.
  // ------------------------------------------------------------

  const roster = new M.VGroup(
    ...ALL_TEAS.map((name, i) => {
      const x = CX +
        (i - 3.5) *
        (P ? 0.78 : 0.76);

      const active = i < 4;

      const color = active
        ? teaColor(i)
        : MUTED;

      const r = outline(
        x, ROSTER_Y,
        0.48, 0.30,
        color,
        active ? 0.45 : 0.12
      );

      const t = at(
        name,
        P ? 15 : 14,
        active ? INK : MUTED,
        x, ROSTER_Y,
        true
      );

      return new M.VGroup(
        r, t
      );
    })
  );

  // ------------------------------------------------------------
  // Intro: customer looking for a tea similar to tea A.
  // ------------------------------------------------------------

  function person(x, y) {
    const head = new M.Circle({
      radius: 0.23,
      color: INK
    });

    head.setFill(INK, 0.86);
    head.moveTo(pos(
      x, y + 0.41
    ));

    const body = new M.Arc({
      radius: 0.42,
      startAngle: 0,
      angle: Math.PI,
      color: INK
    });

    body.setFill(INK, 0.82);
    body.moveTo(pos(
      x, y - 0.02
    ));

    return new M.VGroup(
      head, body
    );
  }

  function teaCup(
    x, y, name,
    color = CYAN
  ) {
    const w = P ? 1.12 : 1.02;
    const h = P ? 0.72 : 0.62;

    const handle = new M.Circle({
      radius: 0.20,
      color,
      strokeWidth: 2
    });

    handle.moveTo(pos(
      x + w / 2 + 0.12,
      y + 0.035
    ));

    const body = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    body.setFill(CARD, 0.96);
    body.moveTo(pos(x, y));

    const tea = rect(
      x,
      y + h / 2 - 0.13,
      w * 0.84,
      0.11,
      AMBER,
      0.76,
      0
    );

    const saucer = line(
      pos(
        x - w * 0.66,
        y - h / 2 - 0.11
      ),

      pos(
        x + w * 0.66,
        y - h / 2 - 0.11
      ),

      color, 2
    );

    const label = at(
      name, 20, color,
      x,
      y - h / 2 - 0.40
    );

    return new M.VGroup(
      handle,
      body,
      tea,
      saucer,
      label
    );
  }

  const customer = person(
    CX - 1.83,
    P ? -0.8 : 0.05
  );

  const cupA = teaCup(
    CX + 0.20,
    P ? -1.05 : -0.15,
    'Tea A',
    CYAN
  );

  const unknownTea = teaCup(
    CX + 2.20,
    P ? -1.05 : -0.15,
    '?',
    VIOLET
  );

  const customerNote = tagAt(
    'LIKES TEA A',
    GREEN,
    CX,
    P ? -3.7 : -1.87,
    18
  );

  // ------------------------------------------------------------
  // 0: a customer likes tea A.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(
      customer,
      cupA,
      unknownTea,
      customerNote
    ),

    new M.FadeIn(roster),

    ...fbox([
      ['A customer likes Tea A', CYAN],
      'Which other tea',
      'has a similar taste?'
    ]),

    ...say('FIND A TEA SIMILAR TO A')
  );

  // ------------------------------------------------------------
  // Twelve-attribute tasting profiles.
  //
  // Four rows of twelve glowing bars.
  // Each bar also shows its exact score.
  // ------------------------------------------------------------

  const PROFILE_SP =
    P ? 0.49 : 0.50;

  const PROFILE_LEFT =
    CX + 0.29 - 5.5 * PROFILE_SP;

  const px = j =>
    PROFILE_LEFT +
    j * PROFILE_SP;

  const PROFILE_BASES = P
    ? [0.38, -0.91, -2.20, -3.49]
    : [0.69, -0.13, -0.95, -1.77];

  const PROFILE_SCALE =
    P ? 0.081 : 0.055;

  const PROFILE_LABEL_X =
    px(0) - 0.59;

  function profileRow(i) {
    const base = PROFILE_BASES[i];

    const parts = [
      at(
        TEAS[i],
        P ? 21 : 18,
        INK,
        PROFILE_LABEL_X,
        base + 0.24,
        true
      ),

      line(
        pos(px(0) - 0.22, base),
        pos(px(11) + 0.22, base),
        MUTED,
        1.4
      )
    ];

    const bars = [];

    DATA[i].forEach((v, j) => {
      const bar = glowingBar(
        px(j),
        base,
        v,
        PROFILE_SCALE,
        P ? 0.27 : 0.26,
        ac(j)
      );

      bars.push(bar);
      parts.push(bar);

      parts.push(
        at(
          v,
          P ? 15 : 13,
          ac(j),
          px(j),
          base +
            v * PROFILE_SCALE +
            (P ? 0.16 : 0.13),
          true,
          0.40
        )
      );
    });

    return {
      group: new M.VGroup(...parts),
      bars
    };
  }

  function profileHeaders() {
    const y = P ? 1.43 : 1.43;

    return new M.VGroup(
      ...SHORT.map((s, j) =>
        at(
          s,
          P ? 15 : 12,
          ac(j),
          px(j), y,
          false,
          PROFILE_SP * 0.94
        )
      )
    );
  }

  function profileOutline(
    i,
    color = CYAN
  ) {
    const left =
      PROFILE_LABEL_X - 0.23;

    const right =
      px(11) + 0.24;

    const base =
      PROFILE_BASES[i];

    const bottom =
      base - 0.11;

    const top =
      base +
      10 * PROFILE_SCALE +
      0.23;

    return outline(
      (left + right) / 2,
      (bottom + top) / 2,
      right - left,
      top - bottom,
      color
    );
  }

  function attributeOutline(
    i, j0, j1,
    color = PINK
  ) {
    const left =
      px(j0) - PROFILE_SP / 2;

    const right =
      px(j1) + PROFILE_SP / 2;

    const base =
      PROFILE_BASES[i];

    const maxv = Math.max(
      ...DATA[i].slice(j0, j1 + 1)
    );

    const bottom =
      base - 0.075;

    const top =
      base +
      maxv * PROFILE_SCALE +
      0.25;

    return outline(
      (left + right) / 2,
      (top + bottom) / 2,
      right - left,
      top - bottom,
      color
    );
  }

  function largeProfile(i) {
    const base = P ? -2.21 : -1.66;
    const scale = P ? 0.33 : 0.235;

    const parts = [
      at(
        `Tea ${TEAS[i]}`,
        21, INK,
        CX,
        P ? 1.18 : 1.19
      )
    ];

    for (const level of [0, 5, 10]) {
      const y = base + level * scale;

      parts.push(
        line(
          pos(px(0) - 0.28, y),
          pos(px(11) + 0.28, y),
          level === 0
            ? MUTED
            : CARD,
          level === 0 ? 2 : 1
        ),

        at(
          level, P ? 15 : 13, MUTED,
          px(0) - 0.47,
          y, true
        )
      );
    }

    DATA[i].forEach((v, j) => {
      parts.push(
        glowingBar(
          px(j),
          base,
          v,
          scale,
          0.31,
          ac(j)
        ),

        at(
          v, 17,
          ac(j),
          px(j),
          base + v * scale + 0.22,
          true
        ),

        at(
          SHORT[j], 12,
          ac(j),
          px(j),
          base - 0.35,
          false, 0.46
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 1: twelve scores are time-consuming to compare.
  // ------------------------------------------------------------

  const originalA = largeProfile(0);

  await until(S(1));

  await play(
    ...scene(originalA),

    ...fbox([
      ['Tea A', CYAN],
      '12 tasting scores',
      'Compare all 12 attributes',
      'for every candidate tea'
    ]),

    ...say('12 SCORES PER TEA')
  );

  // ------------------------------------------------------------
  // 2: could a map show similar teas close together?
  // ------------------------------------------------------------

  function ideaMap() {
    const O = pos(
      CX,
      P ? -0.75 : -0.45
    );

    const points = [
      [-1.85, -0.26],
      [-1.48,  0.23],
      [ 1.48, -0.23],
      [ 1.85,  0.26]
    ];

    const parts = [
      outline(
        O[0], O[1],
        6.05,
        P ? 3.35 : 2.72,
        MUTED, 0.15
      )
    ];

    const centers = points.map(
      ([x, y]) =>
        pos(O[0] + x, O[1] + y)
    );

    for (let i = 0; i < 4; i++) {
      const p = centers[i];

      parts.push(
        glowDot(
          p,
          teaColor(i),
          0.13
        ),

        at(
          TEAS[i],
          20, INK,
          p[0],
          p[1] +
            (i % 2 ? 0.34 : -0.36),
          true
        )
      );
    }

    parts.push(
      at(
        'Similar teas nearby?',
        P ? 19 : 17,
        GREEN,
        CX,
        P ? -3.15 : -2.18
      )
    );

    return new M.VGroup(...parts);
  }

  const mapIdea = ideaMap();

  await until(S(2));

  await play(
    ...scene(mapIdea),

    ...fbox([
      ['A smaller map?', GREEN],
      'One dot per tea',
      'Similar teas close together',
      ['A goal, not yet a result', MUTED]
    ], GREEN),

    ...say('COULD A MAP HELP?', GREEN)
  );

  // ------------------------------------------------------------
  // 3: select teas A, B, C and D.
  // ------------------------------------------------------------

  const fourCups = TEAS.map(
    (name, i) =>
      teaCup(
        CX +
          (i - 1.5) * 1.65,
        P ? -0.50 : -0.32,
        `Tea ${name}`,
        teaColor(i)
      )
  );

  await until(S(3));

  await play(
    ...scene(...fourCups),

    ...fbox([
      ['Our small example', INK],
      'Tea A, B, C and D',
      '4 teas × 12 attributes'
    ]),

    ...say('START WITH FOUR TEAS')
  );

  // ------------------------------------------------------------
  // 4: show their twelve scores as four rows.
  // ------------------------------------------------------------

  const profileRows = DATA.map(
    (_, i) => profileRow(i)
  );

  const headers = profileHeaders();

  await until(S(4));

  await play(
    ...scene(headers),
    ...clearBox(),

    ...enterLagged(
      profileRows.map(r => r.group),
      0.14,
      1.5
    ),

    ...say('FOUR ROWS OF TWELVE SCORES')
  );

  // ------------------------------------------------------------
  // 5: compare A and B.
  // ------------------------------------------------------------

  const abOutlineA =
    profileOutline(0, CYAN);

  const abOutlineB =
    profileOutline(1, CYAN);

  await until(S(5));

  await play(
    ...enter(
      abOutlineA,
      abOutlineB
    ),

    ...fbox([
      ['Compare A and B', CYAN],
      'Look at matching attributes'
    ]),

    ...say('COMPARE TEA A WITH TEA B')
  );

  // ------------------------------------------------------------
  // 6: only Floral and Jasmine differ.
  // ------------------------------------------------------------

  const abDiffA =
    attributeOutline(0, 0, 1, PINK);

  const abDiffB =
    attributeOutline(1, 0, 1, PINK);

  await until(S(6));

  await play(
    ...leave(
      abOutlineA,
      abOutlineB
    ),

    ...enter(
      abDiffA,
      abDiffB
    ),

    ...fbox([
      ['Only two differences', PINK],
      'Floral:  1 versus 3',
      'Jasmine: 3 versus 1',
      'Other 10 scores match'
    ], PINK),

    ...say('ONLY FLORAL AND JASMINE DIFFER', PINK)
  );

  // ------------------------------------------------------------
  // 7: each differs by two.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    new M.Indicate(
      profileRows[0].bars[0],
      { color: PINK }
    ),

    new M.Indicate(
      profileRows[1].bars[0],
      { color: PINK }
    ),

    new M.Indicate(
      profileRows[0].bars[1],
      { color: PINK }
    ),

    new M.Indicate(
      profileRows[1].bars[1],
      { color: PINK }
    ),

    ...fbox([
      ['Floral difference = 2', PINK],
      ['Jasmine difference = 2', PINK],
      'All other differences = 0'
    ], PINK),

    ...say('TWO DIFFERENCES OF 2', PINK)
  );

  // ------------------------------------------------------------
  // 8: compare A and C.
  // ------------------------------------------------------------

  const acOutlineA =
    profileOutline(0, CYAN);

  const acOutlineC =
    profileOutline(2, AMBER);

  await until(S(8));

  await play(
    ...leave(
      abDiffA,
      abDiffB
    ),

    ...enter(
      acOutlineA,
      acOutlineC
    ),

    ...fbox([
      ['Compare A and C', AMBER],
      'First six scores match',
      'Last six scores differ'
    ], AMBER),

    ...say('NOW COMPARE A WITH C', AMBER)
  );

  // ------------------------------------------------------------
  // 9: all last six scores differ by four.
  // ------------------------------------------------------------

  const acDiffA =
    attributeOutline(0, 6, 11, AMBER);

  const acDiffC =
    attributeOutline(2, 6, 11, AMBER);

  await until(S(9));

  await play(
    ...leave(
      acOutlineA,
      acOutlineC
    ),

    ...enter(
      acDiffA,
      acDiffC
    ),

    ...fbox([
      ['Last six attributes', AMBER],
      'Tea A: 3 each',
      'Tea C: 7 each',
      ['7 − 3 = 4 each', AMBER]
    ], AMBER),

    ...say('SIX DIFFERENCES OF 4', AMBER)
  );

  // ------------------------------------------------------------
  // 10: A is much more similar to B.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...leave(
      acDiffA,
      acDiffC
    ),

    ...focus(
      profileOutline(1, GREEN)
    ),

    ...fbox([
      ['A and B: two small differences', CYAN],
      ['A and C: six larger differences', AMBER],
      ['B is more similar to A', GREEN]
    ], GREEN),

    ...say('A IS MUCH MORE SIMILAR TO B', GREEN)
  );

  // ------------------------------------------------------------
  // Difference-vector picture.
  //
  // Signed differences are calculated from matching scores.
  // The squares are always nonnegative.
  // ------------------------------------------------------------

  const DIFF_AB = DATA[0].map(
    (v, j) => v - DATA[1][j]
  );

  const DIFF_AC = DATA[0].map(
    (v, j) => v - DATA[2][j]
  );

  function differencePicture(
    i, j, differences
  ) {
    const parts = [];

    const base = P ? -0.72 : -0.55;
    const scale = P ? 0.32 : 0.24;

    parts.push(
      at(
        `${TEAS[i]} minus ${TEAS[j]}`,
        P ? 22 : 19,
        INK,
        CX,
        P ? 1.20 : 1.12
      ),

      line(
        pos(px(0) - 0.24, base),
        pos(px(11) + 0.24, base),
        MUTED, 2
      )
    );

    differences.forEach((v, k) => {
      const color = v === 0
        ? MUTED
        : k < 2
          ? PINK
          : ac(k);

      parts.push(
        glowingBar(
          px(k),
          base,
          v,
          scale,
          0.29,
          color
        ),

        at(
          number(v),
          P ? 17 : 15,
          color,
          px(k),
          v < 0
            ? base + v * scale - 0.20
            : base + v * scale + 0.22,
          true,
          0.46
        ),

        at(
          SHORT[k],
          P ? 15 : 11,
          ac(k),
          px(k),
          P ? -2.58 : -1.96,
          false, 0.46
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const abDifferences =
    differencePicture(
      0, 1, DIFF_AB
    );

  // ------------------------------------------------------------
  // 11: square the matching score differences.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...scene(abDifferences),

    ...fbox([
      ['Squared distance', VIOLET],
      'Subtract matching scores',
      'Square each difference',
      'Then add the squares'
    ], VIOLET),

    ...say('SQUARE EACH MATCHING DIFFERENCE', VIOLET)
  );

  // ------------------------------------------------------------
  // Square tiles: picture before the calculation.
  // ------------------------------------------------------------

  function squareTile(
    x, y, n,
    color,
    cell = P ? 0.20 : 0.18
  ) {
    const parts = [];

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        parts.push(
          rect(
            x +
              (
                col -
                (n - 1) / 2
              ) * cell,

            y +
              (
                row -
                (n - 1) / 2
              ) * cell,

            cell * 0.86,
            cell * 0.86,
            color,
            0.84,
            1
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function squareExample(
    n,
    color
  ) {
    const tile = squareTile(
      CX,
      P ? -0.62 : -0.38,
      n,
      color,
      P ? 0.45 : 0.40
    );

    const title = at(
      `${n} rows × ${n} columns`,
      P ? 21 : 19,
      color,
      CX,
      P ? 0.83 : 0.87
    );

    const result = tagAt(
      `${n} × ${n} = ${n * n}`,
      color,
      CX,
      P ? -2.16 : -1.61,
      22
    );

    return new M.VGroup(
      tile, title, result
    );
  }

  const twoSquared =
    squareExample(2, PINK);

  // ------------------------------------------------------------
  // 12: squaring means multiplying a number by itself.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(twoSquared),

    ...fbox([
      ['Square a number', VIOLET],
      'Multiply it by itself',
      ['2 × 2 = 4', PINK],
      '(−2) × (−2) = 4'
    ], VIOLET),

    ...say('SQUARING = MULTIPLY BY ITSELF', VIOLET)
  );

  // ------------------------------------------------------------
  // Squared-distance pictures.
  //
  // Every nonzero difference is represented by a square
  // containing its exact number of unit blocks.
  // ------------------------------------------------------------

  function pairSquares(
    i, j,
    color
  ) {
    const diffs = DATA[i].map(
      (v, k) =>
        v - DATA[j][k]
    );

    const active = diffs
      .map((v, k) => ({
        v,
        k
      }))
      .filter(d => d.v !== 0);

    const parts = [];

    const pitch =
      active.length <= 2
        ? 2.20
        : 0.99;

    const y = P ? -0.72 : -0.43;

    parts.push(
      at(
        `${TEAS[i]} versus ${TEAS[j]}`,
        21, INK,
        CX,
        P ? 1.16 : 1.10
      )
    );

    const tiles = [];

    const grid = P && active.length > 3;
    active.forEach((d, k) => {
      const x = grid
        ? CX + ((k % 3) - 1) * 2.2
        : CX +
        (
          k -
          (active.length - 1) / 2
        ) * pitch;
      const ty = grid ? y + 0.35 - Math.floor(k / 3) * 2.55 : y;
      const off = grid ? 0.92 : 0.77;

      const n = Math.abs(d.v);

      const cell =
        active.length <= 2
          ? (P ? 0.38 : 0.33)
          : (P ? (grid ? 0.32 : 0.19) : 0.17);

      const tile = squareTile(
        x, ty, n,
        color, cell
      );

      tiles.push(tile);
      parts.push(tile);

      parts.push(
        at(
          ATTRS[d.k],
          P ? 16 : 14,
          color,
          x,
          ty + off,
          false,
          grid ? 2.0 : pitch * 0.92
        ),

        at(
          `${n}² = ${n * n}`,
          P ? 18 : 16,
          color,
          x,
          ty - off,
          true,
          grid ? 2.0 : pitch * 0.91
        )
      );
    });

    parts.push(
      at(
        `${12 - active.length} matching scores contribute 0`,
        P ? 17 : 15,
        MUTED,
        CX,
        P ? (active.length > 3 ? -4.35 : -2.70) : -2.20,
        false,
        MAIN_W - 0.35
      )
    );

    return {
      group: new M.VGroup(...parts),
      tiles
    };
  }

  const abSquares =
    pairSquares(0, 1, PINK);

  // ------------------------------------------------------------
  // 13: two squared differences of four.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(abSquares.group),

    ...fbox([
      ['A and B', INK],
      ['Floral: 2 × 2 = 4', PINK],
      ['Jasmine: 2 × 2 = 4', PINK],
      'Other squares = 0'
    ], PINK),

    ...say('TWO COPIES OF 4', PINK)
  );

  // ------------------------------------------------------------
  // 14: A–B squared distance = 8.
  // ------------------------------------------------------------

  const abTotal = tagAt(
    '4 + 4 = 8',
    GREEN,
    CX,
    P ? -3.54 : -1.66,
    21
  );

  await until(S(14));

  await play(
    ...enter(abTotal),

    ...fbox([
      ['Squared distance A–B', CYAN],
      '4 + 4 + ten zeros',
      ['= 8', GREEN]
    ], GREEN),

    ...say('A–B SQUARED DISTANCE = 8', GREEN)
  );

  // ------------------------------------------------------------
  // 15: six squared differences of sixteen.
  // ------------------------------------------------------------

  const acSquares =
    pairSquares(0, 2, AMBER);

  await until(S(15));

  await play(
    ...scene(acSquares.group),

    ...fbox([
      ['A and C', INK],
      'Six differences of 4',
      ['4 × 4 = 16', AMBER],
      'Six copies of 16'
    ], AMBER),

    ...say('SIX COPIES OF 16', AMBER)
  );

  // ------------------------------------------------------------
  // 16: A–C squared distance = 96.
  // ------------------------------------------------------------

  const acTotal = tagAt(
    '6 × 16 = 96',
    AMBER,
    CX,
    P ? -3.54 : -1.66,
    21
  );

  await until(S(16));

  await play(
    ...enter(acTotal),

    ...fbox([
      ['Squared distance A–C', AMBER],
      '16 + 16 + 16 + 16 + 16 + 16',
      ['= 96', AMBER]
    ], AMBER),

    ...say('A–C SQUARED DISTANCE = 96', AMBER)
  );

  // ------------------------------------------------------------
  // 17: compare squared distances on a shared scale.
  // ------------------------------------------------------------

  function distanceComparison() {
    const left = CX - 2.75;
    const w = 5.25;

    const ys = P
      ? [0.12, -1.86]
      : [0.38, -1.10];

    const values = [
      DIST2[0][1],
      DIST2[0][2]
    ];

    const colors = [
      CYAN, AMBER
    ];

    const parts = [];

    values.forEach((v, i) => {
      const y = ys[i];

      const bw =
        w * v / 104;

      parts.push(
        at(
          i === 0 ? 'A–B' : 'A–C',
          P ? 22 : 19,
          colors[i],
          CX, y + 0.52,
          true
        ),

        rect(
          left + w / 2,
          y,
          w, 0.36,
          CARD, 0.72, 0
        ),

        rect(
          left + bw / 2,
          y,
          bw + 0.02,
          0.43,
          colors[i],
          0.12, 0
        ),

        rect(
          left + bw / 2,
          y,
          bw, 0.36,
          colors[i],
          0.88, 1
        ),

        at(
          v, 22,
          colors[i],
          left + w + 0.42,
          y, true
        )
      );
    });

    parts.push(
      tagAt(
        'SMALLER DISTANCE = MORE SIMILAR',
        GREEN,
        CX,
        P ? -3.60 : -2.12,
        P ? 17 : 14
      )
    );

    return new M.VGroup(...parts);
  }

  const distanceBars =
    distanceComparison();

  await until(S(17));

  await play(
    ...scene(distanceBars),

    ...fbox([
      ['A–B: squared distance 8', CYAN],
      ['A–C: squared distance 96', AMBER],
      ['B is more similar to A', GREEN]
    ], GREEN),

    ...say('SMALLER DISTANCE MEANS MORE SIMILAR', GREEN)
  );

  // ------------------------------------------------------------
  // All six unordered pairs.
  // ------------------------------------------------------------

  const PAIR_TOP =
    P ? 0.95 : 0.92;

  const PAIR_PITCH =
    P ? 0.73 : 0.49;

  const pairY = k =>
    PAIR_TOP -
    k * PAIR_PITCH;

  function pairDistanceTable() {
    const parts = [
      at(
        'Pair',
        P ? 18 : 16,
        INK,
        CX - 2.48,
        PAIR_TOP + 0.46
      ),

      at(
        'Squared distance',
        P ? 17 : 15,
        INK,
        CX + 0.78,
        PAIR_TOP + 0.46
      )
    ];

    const left = CX - 1.50;
    const w = 4.05;

    const rows = [];

    PAIRS.forEach(([i, j], k) => {
      const y = pairY(k);

      const value =
        DIST2[i][j];

      const color = value === 8
        ? CYAN
        : AMBER;

      const bw =
        value / 104 * w;

      const row = new M.VGroup(
        at(
          pairName(i, j),
          P ? 21 : 18,
          INK,
          CX - 2.48,
          y, true
        ),

        rect(
          left + w / 2,
          y,
          w,
          P ? 0.30 : 0.23,
          CARD, 0.72, 0
        ),

        rect(
          left + bw / 2,
          y,
          bw,
          P ? 0.30 : 0.23,
          color,
          0.82, 1
        ),

        at(
          value,
          P ? 20 : 17,
          color,
          CX + 3.00,
          y, true
        )
      );

      rows.push(row);
    });

    return {
      header: new M.VGroup(...parts),
      rows
    };
  }

  const distances =
    pairDistanceTable();

  // ------------------------------------------------------------
  // 18: compare every pair.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(distances.header),

    ...enterLagged(
      distances.rows,
      0.11, 1.45
    ),

    ...fbox([
      ['Six pairs in total', INK],
      'Use all 12 attributes',
      'for every comparison'
    ]),

    ...say('COMPARE ALL SIX PAIRS')
  );

  // ------------------------------------------------------------
  // 19: A–B and C–D are the closest pairs.
  // ------------------------------------------------------------

  const closeHighlights = [
    outline(
      CX + 0.18,
      pairY(0),
      6.39,
      PAIR_PITCH * 0.84,
      GREEN
    ),

    outline(
      CX + 0.18,
      pairY(5),
      6.39,
      PAIR_PITCH * 0.84,
      GREEN
    )
  ];

  await until(S(19));

  await play(
    ...enter(...closeHighlights),

    ...fbox([
      ['A–B = 8', CYAN],
      ['C–D = 8', CYAN],
      'Other distances: 96 or 104',
      ['Two close pairs', GREEN]
    ], GREEN),

    ...say('A–B AND C–D ARE CLOSE', GREEN)
  );

  // ------------------------------------------------------------
  // Original-space similarity graph.
  //
  // This arrangement is only a visual display of the
  // original similarity relationships.
  //
  // It is not yet the learned t-SNE map.
  // ------------------------------------------------------------

  const GRAPH_O = P
    ? [CX, -0.95, 0]
    : [CX, -0.49, 0];

  const GRAPH_U =
    P ? 1.46 : 1.02;

  const graphPositions = START.map(
    ([x, y]) =>
      pos(
        GRAPH_O[0] + x * GRAPH_U,
        GRAPH_O[1] + y * GRAPH_U
      )
  );

  function graphNode(i) {
    const p = graphPositions[i];
    const color = teaColor(i);

    const halo = new M.Circle({
      radius: 0.33,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.12);
    halo.moveTo(p);

    const d = new M.Circle({
      radius: 0.23,
      color,
      strokeWidth: 2
    });

    d.setFill(CARD, 0.98);
    d.moveTo(p);

    const name = at(
      TEAS[i],
      22, INK,
      p[0], p[1],
      true
    );

    return new M.VGroup(
      halo, d, name
    );
  }

  function shortenedEnds(
    a, b, padding
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const d = Math.max(
      Math.hypot(dx, dy),
      1e-8
    );

    const pad = Math.min(
      padding,
      d * 0.35
    );

    return [
      pos(
        a[0] + dx / d * pad,
        a[1] + dy / d * pad
      ),

      pos(
        b[0] - dx / d * pad,
        b[1] - dy / d * pad
      )
    ];
  }

  function graphEdge(
    i, j,
    strong
  ) {
    const [a, b] =
      shortenedEnds(
        graphPositions[i],
        graphPositions[j],
        0.25
      );

    if (!strong) {
      return new M.DashedLine({
        start: a,
        end: b,
        color: MUTED,
        strokeWidth: 1.2
      });
    }

    return new M.VGroup(
      line(a, b, STRONG, 6),
      line(a, b, INK, 1.2)
    );
  }

  const graphNodes =
    TEAS.map((_, i) =>
      graphNode(i)
    );

  const strongEdges =
    CLOSE_PAIRS.map(
      ([i, j]) =>
        graphEdge(i, j, true)
    );

  const weakEdges =
    WEAK_PAIRS.map(
      ([i, j]) =>
        graphEdge(i, j, false)
    );

  const graphCaption = at(
    'Original-score similarities',
    P ? 18 : 16,
    INK,
    CX,
    P ? -3.24 : -2.10
  );

  // ------------------------------------------------------------
  // 20: strong connections for the close pairs.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(
      ...strongEdges,
      ...graphNodes,
      graphCaption
    ),

    ...fbox([
      ['Strong similarities', CYAN],
      'A–B and C–D',
      ['Squared distance = 8', GREEN]
    ]),

    ...say('STRONG CONNECTIONS FOR CLOSE PAIRS')
  );

  // ------------------------------------------------------------
  // 21: weaker similarities for all other pairs.
  //
  // The probabilities are normalized over ordered pairs.
  // ------------------------------------------------------------

  const graphProbabilityKey =
    new M.VGroup(
      at(
        'Close: 0.22447',
        P ? 16 : 14,
        CYAN,
        CX - 1.70,
        P ? -3.85 : -2.43,
        true
      ),

      at(
        'Other: 0.01435 / 0.01118',
        P ? 16 : 14,
        MUTED,
        CX + 1.56,
        P ? -3.85 : -2.43,
        true,
        3.10
      )
    );

  await until(S(21));

  await play(
    ...enterLagged(
      weakEdges,
      0.11, 1.0
    ),

    ...enter(graphProbabilityKey),

    ...fbox([
      ['Input similarity shares', INK],
      [`Close: ${fixed(INPUT_P[0][1], 5)}`, CYAN],
      [`Distance² 96: ${fixed(INPUT_P[0][2], 5)}`, MUTED],
      [`Distance² 104: ${fixed(INPUT_P[0][3], 5)}`, MUTED]
    ]),

    ...say('OTHER PAIRS HAVE MUCH WEAKER SIMILARITY', MUTED)
  );

  // ------------------------------------------------------------
  // Main two-dimensional map.
  //
  // The coordinate scale is identical on both axes.
  // The map never rescales during the optimization.
  //
  // Laptop: map on the left, small loss curve on the right.
  // Phone: map above the loss curve.
  // ------------------------------------------------------------

  const MAP_O = P
    ? [CX, -0.39, 0]
    : [CX - 1.53, -0.47, 0];

  const MAP_U =
    P ? 1.00 : 0.77;

  const MAP_XMAX = 2.12;
  const MAP_YMAX = 1.72;

  const mp = (x, y) =>
    pos(
      MAP_O[0] + x * MAP_U,
      MAP_O[1] + y * MAP_U
    );

  function mapAxes() {
    const parts = [];

    for (
      const x of [-2, -1, 1, 2]
    ) {
      parts.push(
        line(
          mp(x, -MAP_YMAX),
          mp(x, MAP_YMAX),
          CARD,
          1
        )
      );

      parts.push(
        at(
          number(x),
          P ? 15 : 12,
          MUTED,
          mp(x, 0)[0],
          MAP_O[1] - 0.21,
          true
        )
      );
    }

    for (const y of [-1, 1]) {
      parts.push(
        line(
          mp(-MAP_XMAX, y),
          mp(MAP_XMAX, y),
          CARD,
          1
        )
      );

      parts.push(
        at(
          number(y),
          P ? 15 : 12,
          MUTED,
          MAP_O[0] - 0.22,
          mp(0, y)[1],
          true
        )
      );
    }

    parts.push(
      line(
        mp(-MAP_XMAX, 0),
        mp(MAP_XMAX, 0),
        MUTED, 1.8
      ),

      line(
        mp(0, -MAP_YMAX),
        mp(0, MAP_YMAX),
        MUTED, 1.8
      ),

      at(
        '0',
        P ? 15 : 12, MUTED,
        MAP_O[0] - 0.17,
        MAP_O[1] - 0.21,
        true
      ),

      at(
        'Across',
        P ? 15 : 13,
        MUTED,
        mp(1.43, -MAP_YMAX)[0],
        mp(1.43, -MAP_YMAX)[1] - 0.22
      ),

      at(
        'Up',
        P ? 15 : 13,
        MUTED,
        MAP_O[0] - 0.27,
        mp(0, MAP_YMAX)[1]
      )
    );

    return new M.VGroup(...parts);
  }

  function mapNode(
    i,
    xy,
    highlight = false
  ) {
    const p = mp(
      xy[0], xy[1]
    );

    const color =
      teaColor(i);

    const r = P ? 0.085 : 0.069;

    const halo = new M.Dot({
      point: p,
      radius: r * (
        highlight ? 2.65 : 2.05
      ),
      color: highlight
        ? GREEN
        : color
    });

    halo.setFill(
      highlight ? GREEN : color,
      highlight ? 0.26 : 0.16
    );

    const core = new M.Dot({
      point: p,
      radius: r,
      color
    });

    core.setFill(color, 1);

    const side =
      i < 2 ? -1 : 1;

    const up =
      i % 2 === 1 ? 1 : -1;

    // Labels have fixed outward offsets.
    // The tea dots themselves remain at their exact
    // calculated mathematical coordinates.

    const label = at(
      TEAS[i],
      P ? 19 : 16,
      highlight ? GREEN : INK,
      p[0] + side * 0.19,
      p[1] + up * 0.23,
      true
    );

    return new M.VGroup(
      halo, core, label
    );
  }

  function mapConnection(
    i, j, Y,
    color = STRONG,
    width = 3.2
  ) {
    const p = mp(
      Y[i][0], Y[i][1]
    );

    const q = mp(
      Y[j][0], Y[j][1]
    );

    const [a, b] =
      shortenedEnds(
        p, q,
        P ? 0.09 : 0.07
      );

    return line(
      a, b, color, width
    );
  }

  function mapTitle(text) {
    return at(
      text,
      P ? 18 : 16,
      INK,
      MAP_O[0],
      P ? 1.62 : 1.25,
      false,
      P ? 5.25 : 3.38
    );
  }

  // ------------------------------------------------------------
  // 22: represent every tea using two coordinates.
  // ------------------------------------------------------------

  const previewAxes = mapAxes();

  const previewNodes =
    TEAS.map((_, i) =>
      mapNode(i, START[i])
    );

  const previewTitle =
    mapTitle('A two-number map');

  const previewLinks =
    CLOSE_PAIRS.map(([i, j]) =>
      mapConnection(i, j, START)
    );

  const mapCoordinateCards =
    new M.VGroup(
      ...TEAS.map((name, i) => {
        const x = P
          ? CX + (i - 1.5) * 1.56
          : CX + 2.12;

        const y = P
          ? -3.25
          : 0.70 - i * 0.66;

        const w = P ? 1.43 : 2.08;

        return new M.VGroup(
          outline(
            x, y,
            w,
            P ? 0.73 : 0.53,
            teaColor(i),
            0.48
          ),

          at(
            `${name}: (${number(START[i][0])}, ${number(START[i][1])})`,
            P ? 16 : 15,
            INK,
            x, y,
            true,
            w - 0.12
          )
        );
      })
    );

  await until(S(22));

  await play(
    ...scene(
      previewAxes,
      previewTitle,
      ...previewLinks,
      ...previewNodes,
      mapCoordinateCards
    ),

    ...fbox([
      ['Two coordinates per tea', GREEN],
      'One across, one up',
      'Instead of twelve scores'
    ], GREEN),

    ...say('TWO NUMBERS MARK EACH POSITION', GREEN)
  );

  // ------------------------------------------------------------
  // 23: intuition for attraction.
  //
  // These arrows illustrate the idea of attraction.
  // They are not claimed to be the actual t-SNE gradients.
  // ------------------------------------------------------------

  function attractionArrows(Y) {
    return new M.VGroup(
      ...Y.map((p, i) => {
        const partner =
          i % 2 === 0
            ? i + 1
            : i - 1;

        const q = Y[partner];

        const start = mp(
          p[0], p[1]
        );

        const end = mp(
          p[0] +
            0.33 * (q[0] - p[0]),

          p[1] +
            0.33 * (q[1] - p[1])
        );

        const [a, b] =
          shortenedEnds(
            start,
            end,
            0.10
          );

        return arrow(
          a, b,
          CYAN, 3.3, 0.15
        );
      })
    );
  }

  const pulls =
    attractionArrows(START);

  await until(S(23));

  await play(
    ...enter(pulls),

    ...fbox([
      ['Attraction', CYAN],
      'Similar teas should',
      'pull toward one another',
      'Like stretchy bands'
    ]),

    ...say('CLOSE NEIGHBORS PULL TOGETHER')
  );

  // ------------------------------------------------------------
  // 24: intuition for repulsion.
  //
  // The actual t-SNE update balances attraction and
  // repulsion through normalized similarities.
  // ------------------------------------------------------------

  function repulsionArrows(Y) {
    return new M.VGroup(
      ...Y.map((p, i) => {
        const sign =
          i < 2 ? -1 : 1;

        return arrow(
          mp(
            p[0] + sign * 0.16,
            p[1]
          ),

          mp(
            p[0] + sign * 0.61,
            p[1]
          ),

          VIOLET,
          2.8,
          0.14
        );
      })
    );
  }

  const pushes =
    repulsionArrows(START);

  await until(S(24));

  await play(
    ...enter(pushes),

    ...fbox([
      ['Repulsion', VIOLET],
      'Avoid misleading closeness',
      'Balance pulling together',
      'with pushing apart'
    ], VIOLET),

    ...say('THE COMPUTER ALSO PUSHES DOTS APART', VIOLET)
  );

  // ------------------------------------------------------------
  // 25: name t-SNE.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...fbox([
      ['t-SNE', GREEN],
      'A small map of many',
      'original attributes',
      ['Preserve nearby relationships', GREEN]
    ], GREEN),

    ...say('t-SNE: PRESERVE NEARBY RELATIONSHIPS', GREEN)
  );

  // ------------------------------------------------------------
  // Optimization map and state.
  //
  // The four node objects are retained and transformed
  // throughout the learning process.
  // ------------------------------------------------------------

  const optimizationAxes =
    mapAxes();

  const optimizationTitle =
    mapTitle('Learning the map');

  let currentPositions =
    copyPositions(START);

  let currentStep = 0;

  let followD = false;

  const nodes =
    TEAS.map((_, i) =>
      mapNode(i, START[i])
    );

  const liveLinks =
    CLOSE_PAIRS.map(([i, j]) =>
      mapConnection(i, j, START)
    );

  let linksVisible = false;

  let visibleNodes = new Set();

  function enterNodes(indices) {
    const a = [];

    for (const i of indices) {
      if (visibleNodes.has(i)) {
        continue;
      }

      visibleNodes.add(i);

      a.push(...enter(nodes[i]));
    }

    return a;
  }

  // ------------------------------------------------------------
  // 26: reset to the exact starting square.
  // ------------------------------------------------------------

  const startingSquare =
    new M.VGroup(
      line(
        mp(-1, -1),
        mp(-1, 1),
        MUTED, 1.5
      ),

      line(
        mp(-1, 1),
        mp(1, 1),
        MUTED, 1.5
      ),

      line(
        mp(1, 1),
        mp(1, -1),
        MUTED, 1.5
      ),

      line(
        mp(1, -1),
        mp(-1, -1),
        MUTED, 1.5
      )
    );

  await until(S(26));

  await play(
    ...scene(
      optimizationAxes,
      optimizationTitle,
      startingSquare
    ),

    ...fbox([
      ['Starting map', INK],
      'Four corners of a square',
      'Centered around zero'
    ]),

    ...say('START WITH A SQUARE')
  );

  // ------------------------------------------------------------
  // 27: A bottom left, B top left.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...enterNodes([0, 1]),

    ...fbox([
      ['A: (−1, −1)', CYAN],
      ['B: (−1, +1)', CYAN]
    ]),

    ...say('A BOTTOM LEFT, B TOP LEFT')
  );

  // ------------------------------------------------------------
  // 28: C bottom right, D top right.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...enterNodes([2, 3]),

    ...fbox([
      ['C: (+1, −1)', AMBER],
      ['D: (+1, +1)', AMBER]
    ], AMBER),

    ...say('C BOTTOM RIGHT, D TOP RIGHT', AMBER)
  );

  // ------------------------------------------------------------
  // 29: each coordinate has magnitude one.
  // ------------------------------------------------------------

  const dStartGuides =
    new M.VGroup(
      new M.DashedLine({
        start: mp(0, 0),
        end: mp(1, 0),
        color: CYAN
      }),

      new M.DashedLine({
        start: mp(1, 0),
        end: mp(1, 1),
        color: AMBER
      }),

      at(
        '1',
        16, CYAN,
        mp(0.5, 0)[0],
        mp(0.5, 0)[1] + 0.16,
        true
      ),

      at(
        '1',
        16, AMBER,
        mp(1, 0.5)[0] + 0.15,
        mp(1, 0.5)[1],
        true
      )
    );

  await until(S(29));

  await play(
    ...enter(dStartGuides),

    ...fbox([
      ['Each coordinate is ±1', INK],
      ['D: one step right', CYAN],
      ['D: one step up', AMBER]
    ]),

    ...say('ONE STEP IN EACH DIRECTION')
  );

  // ------------------------------------------------------------
  // 30: the starting square has equal side lengths.
  // ------------------------------------------------------------

  function squareSideLabels() {
    const labels = [
      at(
        '2',
        P ? 17 : 15,
        MUTED,
        mp(0, 1)[0],
        mp(0, 1)[1] + 0.18,
        true
      ),

      at(
        '2',
        P ? 17 : 15,
        MUTED,
        mp(0, -1)[0],
        mp(0, -1)[1] - 0.19,
        true
      ),

      at(
        '2',
        P ? 17 : 15,
        MUTED,
        mp(-1, 0)[0] - 0.22,
        mp(-1, 0)[1] + 0.19,
        true
      ),

      at(
        '2',
        P ? 17 : 15,
        MUTED,
        mp(1, 0)[0] + 0.22,
        mp(1, 0)[1] + 0.19,
        true
      )
    ];

    return new M.VGroup(...labels);
  }

  const equalSides =
    squareSideLabels();

  await until(S(30));

  await play(
    ...leave(dStartGuides),
    ...enter(equalSides),

    ...fbox([
      ['Starting square', INK],
      'Every side has length 2',
      'A–B and A–C look equally close'
    ]),

    ...say('ALL FOUR SIDES ARE EQUALLY LONG')
  );

  // ------------------------------------------------------------
  // 31: the starting map misrepresents original similarities.
  // ------------------------------------------------------------

  const originalMismatch =
    new M.VGroup(
      at(
        'Original squared distances',
        P ? 18 : 16,
        INK,
        P ? CX : CX + 2.10,
        P ? -2.73 : 0.87,
        false, P ? 5.50 : 2.65
      ),

      at(
        'A–B = 8',
        P ? 20 : 18,
        CYAN,
        P ? CX - 1.35 : CX + 2.10,
        P ? -3.36 : 0.18,
        true
      ),

      at(
        'A–C = 96',
        P ? 20 : 18,
        AMBER,
        P ? CX + 1.35 : CX + 2.10,
        P ? -3.36 : -0.50,
        true
      ),

      at(
        'Not equally similar!',
        P ? 18 : 16,
        VIOLET,
        P ? CX : CX + 2.10,
        P ? -3.97 : -1.22,
        false, 2.75
      )
    );

  await until(S(31));

  linksVisible = true;

  await play(
    ...leave(equalSides),
    ...enter(
      ...liveLinks,
      originalMismatch
    ),

    ...fbox([
      ['The original data disagree', AMBER],
      'A–B squared distance: 8',
      'A–C squared distance: 96',
      ['The map needs improvement', GREEN]
    ], AMBER),

    ...say('SOME TEAS ARE MUCH MORE SIMILAR', AMBER)
  );

  // ------------------------------------------------------------
  // Loss chart.
  //
  // The vertical scale starts at zero and remains fixed.
  // The horizontal axis shows actual full-batch iterations.
  // ------------------------------------------------------------

  const CHART_LEFT =
    P ? CX - 2.68 : CX + 0.66;

  const CHART_RIGHT =
    P ? CX + 2.76 : CX + 3.12;

  const CHART_TOP =
    P ? -2.82 : 0.58;

  const CHART_BOTTOM =
    P ? -4.42 : -1.80;

  const LOSS_MAX = 0.60;

  const gx = i =>
    CHART_LEFT +
    i / MAX_ITER *
    (CHART_RIGHT - CHART_LEFT);

  const gy = value =>
    CHART_BOTTOM +
    value / LOSS_MAX *
    (CHART_TOP - CHART_BOTTOM);

  function lossAxes() {
    const parts = [
      at(
        'Loss',
        P ? 17 : 18,
        LOSS,
        CHART_LEFT + 0.3,
        CHART_TOP + 0.31
      ),

      line(
        pos(
          CHART_LEFT,
          CHART_BOTTOM
        ),

        pos(
          CHART_RIGHT,
          CHART_BOTTOM
        ),

        MUTED, 1.5
      ),

      line(
        pos(
          CHART_LEFT,
          CHART_BOTTOM
        ),

        pos(
          CHART_LEFT,
          CHART_TOP
        ),

        MUTED, 1.5
      )
    ];

    for (
      const value of [0, 0.3, 0.6]
    ) {
      const y = gy(value);

      parts.push(
        line(
          pos(CHART_LEFT, y),
          pos(CHART_RIGHT, y),
          CARD, 1
        ),

        at(
          value.toFixed(1),
          P ? 15 : 12,
          MUTED,
          CHART_LEFT - 0.23,
          y, true
        )
      );
    }

    for (
      const i of [0, 4, 8, 12, 16]
    ) {
      parts.push(
        line(
          pos(
            gx(i),
            CHART_BOTTOM - 0.045
          ),

          pos(
            gx(i),
            CHART_BOTTOM + 0.045
          ),

          MUTED, 1.2
        ),

        at(
          i,
          P ? 15 : 11,
          MUTED,
          gx(i),
          CHART_BOTTOM - 0.16,
          true
        )
      );
    }

    parts.push(
      at(
        'Iteration',
        P ? 15 : 13,
        MUTED,
        (CHART_LEFT + CHART_RIGHT) / 2,
        CHART_BOTTOM - 0.36
      )
    );

    return new M.VGroup(...parts);
  }

  function lossPoint(step) {
    return glowDot(
      pos(
        gx(step),
        gy(HISTORY[step].loss)
      ),

      LOSS,

      P ? 0.045 : 0.043
    );
  }

  function lossSegment(step) {
    return line(
      pos(
        gx(step - 1),
        gy(HISTORY[step - 1].loss)
      ),

      pos(
        gx(step),
        gy(HISTORY[step].loss)
      ),

      LOSS, 2.5
    );
  }

  function lossLabel(step) {
    return at(
      `= ${fixed(HISTORY[step].loss)}`,
      P ? 17 : 16,
      LOSS,
      CHART_LEFT + 1.15,
      CHART_TOP + 0.31,
      true,
      P ? 3.00 : 2.65
    );
  }

  function roundLabel(step) {
    return tagAt(
      `STEP ${step}`,
      VIOLET,
      P ? CX + 2.72 : CX + 1.89,
      P ? 1.55 : 1.34,
      P ? 15 : 14,
      1.50
    );
  }

  const chart = lossAxes();

  let lossNow = lossLabel(0);

  let roundNow = roundLabel(0);

  let plottedStep = 0;

  // ------------------------------------------------------------
  // 32: introduce the loss.
  //
  // The loss compares probability distributions of
  // similarities, not original and map distances directly.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...leave(
      originalMismatch,
      startingSquare
    ),

    ...enter(
      chart,
      roundNow
    ),

    ...fbox([
      ['Loss', LOSS],
      'How poorly the map',
      'represents similarities',
      ['Lower is better', GREEN]
    ], LOSS),

    ...say('LOSS MEASURES SIMILARITY MISMATCH', LOSS)
  );

  // ------------------------------------------------------------
  // 33: plot the actual starting loss.
  // ------------------------------------------------------------

  const initialLossPoint =
    lossPoint(0);

  await until(S(33));

  await play(
    ...enter(
      initialLossPoint,
      lossNow
    ),

    ...fbox([
      ['Starting map', INK],
      'Iteration 0',
      [`Loss = ${fixed(HISTORY[0].loss)}`, LOSS]
    ], LOSS),

    ...say('STARTING LOSS ≈ 0.565', LOSS)
  );

  // ------------------------------------------------------------
  // Motion helpers.
  //
  // All four dot objects are transformed together.
  // Every close-pair connection follows its endpoints.
  //
  // The displayed coordinates are never rounded internally.
  // ------------------------------------------------------------

  function moveAll(
    nextPositions,
    runTime = 0.85
  ) {
    const a = [];

    for (let i = 0; i < N; i++) {
      a.push(
        new M.Transform(
          nodes[i],

          mapNode(
            i,
            nextPositions[i],
            followD && i === 3
          ),

          { runTime }
        )
      );
    }

    if (linksVisible) {
      CLOSE_PAIRS.forEach(
        ([i, j], k) => {
          a.push(
            new M.Transform(
              liveLinks[k],

              mapConnection(
                i, j,
                nextPositions
              ),

              { runTime }
            )
          );
        }
      );
    }

    currentPositions =
      copyPositions(nextPositions);

    return a;
  }

  function movementArrows(
    from, to,
    onlyAxis = null
  ) {
    const parts = [];

    for (let i = 0; i < N; i++) {
      const old = from[i];
      const next = to[i];

      let dx = next[0] - old[0];
      let dy = next[1] - old[1];

      if (onlyAxis === 0) {
        dy = 0;
      }

      if (onlyAxis === 1) {
        dx = 0;
      }

      const d = Math.hypot(dx, dy);

      if (d < 1e-8) {
        continue;
      }

      // Arrows are enlarged visual indicators.
      // Dot movement itself is always mathematically exact.

      const visualLength = Math.max(
        0.27,
        Math.min(0.49, d * 2.0)
      );

      const ux = dx / d;
      const uy = dy / d;

      const p = mp(
        old[0],
        old[1]
      );

      const q = pos(
        p[0] +
          ux * visualLength,

        p[1] +
          uy * visualLength
      );

      parts.push(
        arrow(
          pos(
            p[0] + ux * 0.075,
            p[1] + uy * 0.075
          ),

          q,

          i === 3
            ? GREEN
            : VIOLET,

          i === 3 ? 3 : 2,

          0.12
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function plotLoss(
    step,
    runTime = 0.65
  ) {
    const a = [];

    for (
      let i = plottedStep + 1;
      i <= step;
      i++
    ) {
      const segment =
        lossSegment(i);

      const point =
        lossPoint(i);

      picture.push(
        segment, point
      );

      a.push(
        new M.Create(
          segment,
          { runTime }
        ),

        new M.FadeIn(
          point,
          { runTime }
        )
      );
    }

    a.push(
      new M.Transform(
        lossNow,
        lossLabel(step),
        { runTime }
      )
    );

    a.push(
      new M.Transform(
        roundNow,
        roundLabel(step),
        { runTime }
      )
    );

    plottedStep = step;
    currentStep = step;

    return a;
  }

  function fullStepAnimations(
    step,
    runTime = 0.45
  ) {
    return [
      ...moveAll(
        HISTORY[step].positions,
        runTime
      ),

      ...plotLoss(
        step,
        runTime
      )
    ];
  }

  // ------------------------------------------------------------
  // 34: the computer calculates a small movement for each dot.
  // ------------------------------------------------------------

  const firstMoveArrows =
    movementArrows(
      HISTORY[0].positions,
      HISTORY[1].positions
    );

  await until(S(34));

  await play(
    ...enter(firstMoveArrows),

    ...fbox([
      ['One learning step', VIOLET],
      'Calculate every movement',
      'using the current map',
      'Update all four positions'
    ], VIOLET),

    ...say('CALCULATE SMALL MOVEMENTS FOR ALL DOTS', VIOLET)
  );

  // ------------------------------------------------------------
  // 35: follow tea D.
  // ------------------------------------------------------------

  followD = true;

  await until(S(35));

  await play(
    ...leave(firstMoveArrows),

    new M.Transform(
      nodes[3],
      mapNode(3, START[3], true),
      { runTime: 0.55 }
    ),

    ...fbox([
      ['Follow tea D', GREEN],
      'Starting position',
      ['Across = 1.000', CYAN],
      ['Up     = 1.000', AMBER]
    ], GREEN),

    ...say('FOLLOW TEA D WHILE ALL FOUR MOVE', GREEN)
  );

  // ------------------------------------------------------------
  // First iteration.
  //
  // The actual t-SNE step is calculated simultaneously.
  // For narration, its horizontal and vertical components
  // are shown separately.
  //
  // No extra optimization step is performed between them.
  // The loss is updated only after the full movement.
  // ------------------------------------------------------------

  const STEP1 = HISTORY[1];

  const STEP1_X_ONLY =
    HISTORY[0].positions.map(
      (p, i) => [
        STEP1.positions[i][0],
        p[1]
      ]
    );

  const dx1 = STEP1.delta[3][0];
  const dy1 = STEP1.delta[3][1];

  // ------------------------------------------------------------
  // 36: D moves approximately 0.172 right.
  // ------------------------------------------------------------

  const firstHorizontal =
    movementArrows(
      HISTORY[0].positions,
      STEP1_X_ONLY,
      0
    );

  await until(S(36));

  await play(
    ...enter(firstHorizontal),

    ...fbox([
      ['First step: horizontal part', CYAN],
      `D starts at ${fixed(START[3][0])}`,
      [`Change = ${signed(dx1)}`, GREEN],
      'All four x-coordinates update'
    ]),

    ...say('D MOVES ABOUT 0.172 RIGHT', GREEN)
  );

  await play(
    ...leave(firstHorizontal),

    ...moveAll(
      STEP1_X_ONLY,
      1.0
    )
  );

  // ------------------------------------------------------------
  // 37: D moves approximately 0.164 down.
  // ------------------------------------------------------------

  const firstVertical =
    movementArrows(
      STEP1_X_ONLY,
      STEP1.positions,
      1
    );

  await until(S(37));

  await play(
    ...enter(firstVertical),

    ...fbox([
      ['First step: vertical part', AMBER],
      'D moves toward C',
      [`Change = ${signed(dy1)}`, GREEN],
      'All four y-coordinates update'
    ], AMBER),

    ...say('D MOVES ABOUT 0.164 DOWN', GREEN)
  );

  await play(
    ...leave(firstVertical),

    ...moveAll(
      STEP1.positions,
      1.0
    )
  );

  // ------------------------------------------------------------
  // Coordinate guides for tea D.
  // ------------------------------------------------------------

  let coordinateGuidesNow = null;

  function dCoordinateGuides(
    xy
  ) {
    const x = xy[0];
    const y = xy[1];

    const p = mp(x, y);

    const parts = [
      new M.DashedLine({
        start: mp(x, 0),
        end: p,
        color: CYAN
      }),

      new M.DashedLine({
        start: mp(0, y),
        end: p,
        color: AMBER
      }),

      at(
        fixed(x),
        P ? 15 : 13,
        CYAN,
        mp(x, 0)[0] + 0.52,
        MAP_O[1] + 0.2,
        true
      ),

      at(
        fixed(y),
        P ? 15 : 13,
        AMBER,
        MAP_O[0] - 0.29,
        mp(0, y)[1] + 0.13,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  function showCoordinates(
    xy, step = null
  ) {
    const a = [];

    if (step !== null) {
      a.push(new M.Transform(roundNow, roundLabel(step), { runTime: 0.5 }));
    }

    if (
      coordinateGuidesNow &&
      picture.includes(coordinateGuidesNow)
    ) {
      a.push(
        ...leave(coordinateGuidesNow)
      );
    }

    coordinateGuidesNow =
      dCoordinateGuides(xy);

    a.push(
      ...enter(coordinateGuidesNow)
    );

    return a;
  }

  function clearCoordinates() {
    if (
      !coordinateGuidesNow ||
      !picture.includes(coordinateGuidesNow)
    ) {
      coordinateGuidesNow = null;

      return [];
    }

    const old =
      coordinateGuidesNow;

    coordinateGuidesNow = null;

    return leave(old);
  }

  // ------------------------------------------------------------
  // 38: D's first updated position.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...showCoordinates(
      STEP1.positions[3], 1
    ),

    ...fbox([
      ['D after step 1', GREEN],
      `Across: 1 + ${fixed(dx1)}`,
      [`≈ ${fixed(STEP1.positions[3][0])}`, CYAN],
      `Up: 1 − ${fixed(Math.abs(dy1))}`,
      [`≈ ${fixed(STEP1.positions[3][1])}`, AMBER]
    ], GREEN),

    ...say('NEW D POSITION: (1.172, 0.836)', GREEN)
  );

  // ------------------------------------------------------------
  // 39: the loss falls to approximately 0.361.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...clearCoordinates(),

    ...plotLoss(
      1, 0.85
    ),

    ...fbox([
      ['Step 1 complete', GREEN],
      [`Old loss: ${fixed(HISTORY[0].loss)}`, MUTED],
      [`New loss: ${fixed(STEP1.loss)}`, LOSS],
      'The similarities fit better'
    ], GREEN),

    ...say('LOSS FALLS TO 0.361', LOSS)
  );

  // ------------------------------------------------------------
  // Second iteration.
  // ------------------------------------------------------------

  const STEP2 = HISTORY[2];

  const dx2 = STEP2.delta[3][0];
  const dy2 = STEP2.delta[3][1];

  const secondMoves =
    movementArrows(
      HISTORY[1].positions,
      STEP2.positions
    );

  // ------------------------------------------------------------
  // 40: show the second calculated movement.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...enter(secondMoves),

    ...fbox([
      ['Second learning step', VIOLET],
      'Recalculate from the new map',
      [`D across: ${signed(dx2)}`, CYAN],
      [`D up:     ${signed(dy2)}`, AMBER]
    ], VIOLET),

    ...say('STEP 2: RIGHT 0.126, DOWN 0.146', GREEN)
  );

  await play(
    ...leave(secondMoves),

    ...moveAll(
      STEP2.positions,
      1.15
    )
  );

  // ------------------------------------------------------------
  // 41: D's second updated position.
  //
  // Values displayed are rounded from exact positions.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...showCoordinates(
      STEP2.positions[3], 2
    ),

    ...fbox([
      ['D after step 2', GREEN],
      [`Across ≈ ${fixed(STEP2.positions[3][0])}`, CYAN],
      [`Up     ≈ ${fixed(STEP2.positions[3][1])}`, AMBER],
      'Calculated before rounding'
    ], GREEN),

    ...say('NEW D POSITION: (1.297, 0.690)', GREEN)
  );

  // ------------------------------------------------------------
  // 42: plot the second loss.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...clearCoordinates(),

    ...plotLoss(
      2, 0.85
    ),

    ...fbox([
      ['Step 2 complete', GREEN],
      [`Old loss: ${fixed(STEP1.loss)}`, MUTED],
      [`New loss: ${fixed(STEP2.loss)}`, LOSS],
      'Improving again'
    ], GREEN),

    ...say('LOSS FALLS TO 0.227', LOSS)
  );

  // ------------------------------------------------------------
  // Third iteration.
  // ------------------------------------------------------------

  const STEP3 = HISTORY[3];

  const dx3 = STEP3.delta[3][0];
  const dy3 = STEP3.delta[3][1];

  const thirdMoves =
    movementArrows(
      HISTORY[2].positions,
      STEP3.positions
    );

  // ------------------------------------------------------------
  // 43: show the third calculated movement.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...enter(thirdMoves),

    ...fbox([
      ['Third learning step', VIOLET],
      'Recalculate all movements',
      [`D across: ${signed(dx3)}`, CYAN],
      [`D up:     ${signed(dy3)}`, AMBER]
    ], VIOLET),

    ...say('STEP 3: RIGHT 0.092, DOWN 0.124', GREEN)
  );

  await play(
    ...leave(thirdMoves),

    ...moveAll(
      STEP3.positions,
      1.15
    )
  );

  // ------------------------------------------------------------
  // 44: D's third updated position.
  // ------------------------------------------------------------

  await until(S(44));

  await play(
    ...showCoordinates(
      STEP3.positions[3], 3
    ),

    ...fbox([
      ['D after step 3', GREEN],
      [`Across ≈ ${fixed(STEP3.positions[3][0])}`, CYAN],
      [`Up     ≈ ${fixed(STEP3.positions[3][1])}`, AMBER],
      'All four dots have moved'
    ], GREEN),

    ...say('NEW D POSITION: (1.390, 0.566)', GREEN)
  );

  // ------------------------------------------------------------
  // 45: plot the third loss.
  // ------------------------------------------------------------

  await until(S(45));

  await play(
    ...clearCoordinates(),

    ...plotLoss(
      3, 0.85
    ),

    ...fbox([
      ['Step 3 complete', GREEN],
      [`Old loss: ${fixed(STEP2.loss)}`, MUTED],
      [`New loss: ${fixed(STEP3.loss)}`, LOSS],
      'The map is improving'
    ], GREEN),

    ...say('LOSS FALLS TO 0.142', LOSS)
  );

  // ------------------------------------------------------------
  // 46: accelerate the remaining iterations.
  //
  // Every position and loss point is calculated using the
  // actual t-SNE gradient.
  //
  // The map is not artificially moved to a chosen result.
  // ------------------------------------------------------------

  await until(S(46));

  await play(
    ...fbox([
      ['Repeat the same steps', VIOLET],
      'Calculate movements',
      'Update every position',
      ['Watch the loss flatten', GREEN]
    ], VIOLET),

    ...say('REPEAT FASTER AS THE LOSS FALLS', GREEN)
  );

  for (let i = 4; i <= 12; i++) {
    await play(
      ...fullStepAnimations(
        i, 0.24
      )
    );
  }

  // ------------------------------------------------------------
  // 47: two close pairs emerge.
  //
  // Continue actual optimization to iteration 16.
  // ------------------------------------------------------------

  await until(S(47));

  await play(
    ...fbox([
      ['Two close pairs', GREEN],
      ['A and B move together', CYAN],
      ['C and D move together', AMBER],
      'Between-pair space increases'
    ], GREEN),

    ...say('TWO CLOSE PAIRS EMERGE', GREEN)
  );

  for (let i = 13; i <= MAX_ITER; i++) {
    await play(
      ...fullStepAnimations(
        i, 0.30
      )
    );
  }

  const FINAL =
    HISTORY[MAX_ITER].positions;

  function pairBoundary(
    i, j,
    Y,
    color
  ) {
    const a = mp(
      Y[i][0], Y[i][1]
    );

    const b = mp(
      Y[j][0], Y[j][1]
    );

    const x =
      (a[0] + b[0]) / 2;

    const y =
      (a[1] + b[1]) / 2;

    const w = Math.max(
      0.65,
      Math.abs(a[0] - b[0]) + 0.58
    );

    const h = Math.max(
      0.94,
      Math.abs(a[1] - b[1]) + 0.81
    );

    return outline(
      x, y,
      w, h,
      color
    );
  }

  const finalPairAB =
    pairBoundary(
      0, 1,
      FINAL,
      CYAN
    );

  const finalPairCD =
    pairBoundary(
      2, 3,
      FINAL,
      AMBER
    );

  await play(
    ...enter(
      finalPairAB,
      finalPairCD
    )
  );

  // ------------------------------------------------------------
  // Map-similarity weight demonstration.
  //
  // Show a near pair and a distant pair using the actual
  // learned coordinates.
  // ------------------------------------------------------------

  const FINAL_MAP =
    mapProbabilities(FINAL);

  const NEAR_D2 =
    squaredDistance(
      FINAL[0],
      FINAL[1]
    );

  const FAR_D2 =
    squaredDistance(
      FINAL[0],
      FINAL[2]
    );

  const NEAR_W =
    FINAL_MAP.weights[0][1];

  const FAR_W =
    FINAL_MAP.weights[0][2];

  function similarityWeightPicture() {
    const parts = [];

    const left = CX - 2.70;
    const right = CX + 2.70;

    const ys = P
      ? [-0.4, -3.0]
      : [0.40, -1.3];

    const examples = [
      {
        i: 0,
        j: 1,
        d2: NEAR_D2,
        weight: NEAR_W,
        color: CYAN
      },

      {
        i: 0,
        j: 2,
        d2: FAR_D2,
        weight: FAR_W,
        color: AMBER
      }
    ];

    examples.forEach((example, k) => {
      const y = ys[k];

      const scale = 1.02;

      const distance =
        Math.sqrt(example.d2);

      const span =
        distance * scale;

      const a = pos(
        CX - span / 2,
        y
      );

      const b = pos(
        CX + span / 2,
        y
      );

      const width =
        1.0 +
        5.0 * example.weight;

      parts.push(
        at(
          k === 0
            ? 'Nearby dots'
            : 'Distant dots',

          P ? 20 : 18,
          example.color,
          CX,
          y + 0.69
        ),

        line(
          a, b,
          example.color,
          width
        ),

        glowDot(
          a,
          teaColor(example.i),
          0.09
        ),

        glowDot(
          b,
          teaColor(example.j),
          0.09
        ),

        at(
          TEAS[example.i],
          17, INK,
          a[0] -
            (k === 0 ? 0.28 : 0.08),
          a[1] + 0.24,
          true
        ),

        at(
          TEAS[example.j],
          17, INK,
          b[0] +
            (k === 0 ? 0.28 : 0.08),
          b[1] + 0.24,
          true
        ),

        at(
          `Weight ≈ ${fixed(example.weight)}`,
          P ? 18 : 16,
          example.color,
          CX,
          y - 0.51,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const weightPicture =
    similarityWeightPicture();

  // ------------------------------------------------------------
  // 48: nearby dots have stronger similarity weights.
  // ------------------------------------------------------------

  await until(S(48));

  await play(
    ...scene(weightPicture),

    ...fbox([
      ['Map similarity weights', INK],
      ['Nearby dots: stronger', CYAN],
      ['Distant dots: weaker', AMBER],
      'Based on current map distance'
    ]),

    ...say('NEARBY DOTS GET STRONGER WEIGHTS')
  );

  // ------------------------------------------------------------
  // 49: the Student-t map weight formula.
  //
  // w = 1 / (1 + squared map distance)
  // ------------------------------------------------------------

  await until(S(49));

  await play(
    ...fbox([
      ['Map weight', VIOLET],
      '= 1 ÷ (1 + distance²)',
      ['Close pair: larger weight', CYAN],
      ['Far pair: smaller weight', AMBER]
    ], VIOLET),

    ...say('MAP WEIGHT = 1 ÷ (1 + DISTANCE²)', VIOLET)
  );

  // ------------------------------------------------------------
  // Input-versus-map probability shares.
  //
  // Each unordered pair is shown once, but the probabilities
  // are the values for a single ordered pair.
  //
  // Therefore the six displayed values sum to 0.5 in each
  // column. Including their reverse directions gives 1.
  //
  // This avoids incorrectly normalizing six unordered pairs
  // while comparing them with ordered-pair probabilities.
  // ------------------------------------------------------------

  function similarityShareTable() {
    const parts = [];

    const top = P ? 0.88 : 0.92;
    const pitch = P ? 0.70 : 0.48;

    const columns = [
      CX - 2.65,
      CX - 0.89,
      CX + 1.27
    ];

    const headerY =
      top + 0.51;

    const maxProb = 0.25;
    const trackW = 1.68;

    parts.push(
      at(
        'Pair',
        P ? 17 : 15,
        INK,
        columns[0],
        headerY
      ),

      at(
        'Original share',
        P ? 17 : 15,
        CYAN,
        columns[1],
        headerY,
        false, 1.87
      ),

      at(
        'Map share',
        P ? 17 : 15,
        GREEN,
        columns[2],
        headerY,
        false, 1.87
      )
    );

    PAIRS.forEach(([i, j], k) => {
      const y =
        top - k * pitch;

      const p =
        INPUT_P[i][j];

      const q =
        FINAL_MAP.q[i][j];

      parts.push(
        at(
          pairName(i, j),
          P ? 19 : 16,
          INK,
          columns[0],
          y, true
        )
      );

      [p, q].forEach((value, col) => {
        const x =
          columns[col + 1];

        const color =
          col === 0
            ? CYAN
            : GREEN;

        const w =
          trackW *
          value / maxProb;

        const left =
          x - trackW / 2;

        const by =
          y -
          (P ? 0.15 : 0.11);

        parts.push(
          rect(
            x, by,
            trackW,
            P ? 0.12 : 0.085,
            CARD, 0.75, 0
          ),

          rect(
            left + w / 2,
            by,
            w,
            P ? 0.12 : 0.085,
            color, 0.84, 1
          ),

          at(
            fixed(value, 5),
            P ? 16 : 14,
            color,
            x,
            y +
              (P ? 0.12 : 0.10),
            true
          )
        );
      });
    });

    parts.push(
      at(
        'Shares shown per ordered pair',
        P ? 16 : 14,
        MUTED,
        CX,
        P ? -3.85 : -2.21,
        false,
        MAIN_W - 0.35
      ),

      at(
        'Both directions together sum to 1',
        P ? 16 : 14,
        MUTED,
        CX,
        P ? -4.26 : -2.50,
        false,
        MAIN_W - 0.35
      )
    );

    return new M.VGroup(...parts);
  }

  const probabilityTable =
    similarityShareTable();

  // ------------------------------------------------------------
  // 50: normalize weights and compare the similarity shares.
  //
  // The loss is KL divergence from the original similarity
  // distribution P to the map distribution Q.
  // ------------------------------------------------------------

  await until(S(50));

  await play(
    ...scene(probabilityTable),

    ...fbox([
      ['Weight → similarity share', GREEN],
      'Divide by all pair weights',
      'Compare original and map shares',
      ['Loss = KL(P || Q)', VIOLET]
    ], GREEN),

    ...say('COMPARE ORIGINAL AND MAP SIMILARITY SHARES', GREEN)
  );

  // ------------------------------------------------------------
  // Large final map.
  //
  // The optimization dashboard is no longer needed.
  // Display the actual final positions at a larger scale.
  // Both axes still use the same spatial scale.
  // ------------------------------------------------------------

  const FINAL_O = P
    ? [CX, -0.95, 0]
    : [CX, -0.46, 0];

  const FINAL_U =
    P ? 1.48 : 1.40;

  const fm = (x, y) =>
    pos(
      FINAL_O[0] + x * FINAL_U,
      FINAL_O[1] + y * FINAL_U
    );

  function finalMapPicture(
    showBoundaries = true,
    showGap = false
  ) {
    const parts = [];

    const xmax = 2.12;
    const ymax = 1.13;

    for (
      const x of [-2, -1, 1, 2]
    ) {
      parts.push(
        line(
          fm(x, -ymax),
          fm(x, ymax),
          CARD, 1
        )
      );
    }

    for (
      const y of [-1, 1]
    ) {
      parts.push(
        line(
          fm(-xmax, y),
          fm(xmax, y),
          CARD, 1
        )
      );
    }

    parts.push(
      line(
        fm(-xmax, 0),
        fm(xmax, 0),
        MUTED, 1.5
      ),

      line(
        fm(0, -ymax),
        fm(0, ymax),
        MUTED, 1.5
      )
    );

    for (
      const [i, j] of CLOSE_PAIRS
    ) {
      const a = fm(
        FINAL[i][0],
        FINAL[i][1]
      );

      const b = fm(
        FINAL[j][0],
        FINAL[j][1]
      );

      parts.push(
        line(
          a, b,
          teaColor(i),
          3.5
        )
      );

      if (showBoundaries) {
        const x =
          (a[0] + b[0]) / 2;

        const y =
          (a[1] + b[1]) / 2;

        parts.push(
          outline(
            x, y,
            P ? 0.88 : 0.79,

            Math.max(
              1.18,
              Math.abs(a[1] - b[1]) +
                0.91
            ),

            teaColor(i)
          )
        );
      }
    }

    FINAL.forEach((xy, i) => {
      const p = fm(
        xy[0], xy[1]
      );

      const up =
        i % 2 ? 1 : -1;

      parts.push(
        glowDot(
          p, teaColor(i),
          P ? 0.105 : 0.087
        ),

        at(
          TEAS[i],
          P ? 22 : 19,
          INK,
          p[0],
          p[1] + up * 0.28,
          true
        )
      );
    });

    parts.push(
      at(
        'A and B',
        P ? 19 : 17,
        CYAN,
        fm(FINAL[0][0], 0)[0],
        FINAL_O[1] + 0.98
      ),

      at(
        'C and D',
        P ? 19 : 17,
        AMBER,
        fm(FINAL[2][0], 0)[0],
        FINAL_O[1] + 0.98
      )
    );

    if (showGap) {
      const a = fm(
        FINAL[0][0],
        -0.79
      );

      const b = fm(
        FINAL[2][0],
        -0.79
      );

      parts.push(
        doubleArrow(
          a, b,
          VIOLET, 2.6
        ),

        at(
          'Between-group gap',
          P ? 17 : 15,
          VIOLET,
          (a[0] + b[0]) / 2,
          a[1] - 0.28
        )
      );
    } else {
      parts.push(
        at(
          'Similar teas are nearby',
          P ? 18 : 16,
          GREEN,
          CX,
          P ? -3.53 : -2.17
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 51: use t-SNE to explore local groups.
  // ------------------------------------------------------------

  const learnedMap =
    finalMapPicture(true, false);

  await until(S(51));

  await play(
    ...scene(learnedMap),

    ...fbox([
      ['Use t-SNE to explore', GREEN],
      'Many original attributes',
      'A smaller visual map',
      ['Nearby relationships', CYAN]
    ], GREEN),

    ...say('EXPLORE GROUPS OF SIMILAR ITEMS', GREEN)
  );

  // ------------------------------------------------------------
  // 52: caution about distances between separate groups.
  // ------------------------------------------------------------

  const gapMap =
    finalMapPicture(true, true);

  await until(S(52));

  await play(
    ...scene(gapMap),

    ...fbox([
      ['Be careful', AMBER],
      'Nearby relationships matter',
      'The gap between groups',
      'is not an exact distance measure'
    ], AMBER),

    ...say('BE CAREFUL WITH BETWEEN-GROUP GAPS', AMBER)
  );

  // ------------------------------------------------------------
  // 53: an illustrative comparison of group spacing.
  //
  // Show the same neighborhood memberships in two sketches,
  // with one gap twice as wide.
  //
  // These are deliberately illustrative map sketches.
  // Neither is presented as an additional t-SNE result.
  //
  // The original tea distances remain unchanged.
  // ------------------------------------------------------------

  function spacingSketch(
    y,
    gap,
    title
  ) {
    const parts = [];

    const half = gap / 2;

    const points = [
      pos(CX - half, y - 0.17),
      pos(CX - half, y + 0.17),
      pos(CX + half, y - 0.17),
      pos(CX + half, y + 0.17)
    ];

    parts.push(
      at(
        title,
        P ? 17 : 15,
        INK,
        CX,
        y + 0.62
      )
    );

    for (
      const [i, j] of CLOSE_PAIRS
    ) {
      parts.push(
        line(
          points[i],
          points[j],
          teaColor(i),
          3
        )
      );
    }

    points.forEach((p, i) => {
      const side =
        i < 2 ? -1 : 1;

      const up =
        i % 2 ? 1 : -1;

      parts.push(
        glowDot(
          p,
          teaColor(i),
          P ? 0.073 : 0.060
        ),

        at(
          TEAS[i],
          P ? 16 : 14,
          INK,
          p[0] + side * 0.19,
          p[1] + up * 0.10,
          true
        )
      );
    });

    parts.push(
      doubleArrow(
        pos(
          CX - half,
          y - 0.48
        ),

        pos(
          CX + half,
          y - 0.48
        ),

        VIOLET, 2
      )
    );

    return new M.VGroup(...parts);
  }

  function gapComparison() {
    const topY =
      P ? 0.34 : 0.51;

    const lowerY =
      P ? -2.03 : -1.02;

    const first =
      spacingSketch(
        topY,
        2.10,
        'Illustration: gap 1'
      );

    const second =
      spacingSketch(
        lowerY,
        4.20,
        'Illustration: gap 2'
      );

    return new M.VGroup(
      first,
      second,

      at(
        'Same original tasting scores',
        P ? 18 : 16,
        GREEN,
        CX,
        P ? -3.70 : -2.26,
        false,
        MAIN_W - 0.35
      )
    );
  }

  const spacingComparison =
    gapComparison();

  await until(S(53));

  await play(
    ...scene(spacingComparison),

    ...fbox([
      ['Twice the map gap', VIOLET],
      'Does not necessarily mean',
      'twice the original difference',
      ['Check original measurements', GREEN]
    ], VIOLET),

    ...say('TWICE THE GAP DOES NOT MEAN TWICE THE DIFFERENCE', AMBER)
  );

  // ------------------------------------------------------------
  // 54: final visual summary.
  //
  // Return to the actual learned map, not the illustrative
  // sketches used to explain the limitation.
  // ------------------------------------------------------------

  const summaryMap =
    finalMapPicture(true, false);

  const summaryTag = tagAt(
    'NEIGHBORHOODS, NOT EXACT GLOBAL DISTANCES',
    GREEN,
    CX,
    P ? -4.17 : 1.35,
    P ? 16 : 13,
    MAIN_W - 0.35
  );

  await until(S(54));

  await play(
    ...scene(
      summaryMap,
      summaryTag
    ),

    ...fbox([
      ['t-SNE', GREEN],
      'Similar items close together',
      'Many attributes → small map',
      ['Between-group gaps can mislead', AMBER]
    ], GREEN),

    ...say('t-SNE: KEEP SIMILAR ITEMS NEARBY', GREEN)
  );

  // Leave the final picture visible until narration ends.

  await until(E(54));

  // Integration notes:
  //
  // All 55 narration beats are included.
  // Original tasting scores match the shared chapter data.
  // All original squared distances are calculated using
  // all twelve attributes.
  //
  // Gaussian bandwidth is fixed at 4.
  // Input similarities are symmetrized conditional
  // probabilities over ordered pairs.
  //
  // Map weights, normalized probabilities, KL divergence,
  // gradients and every displayed learning step are
  // calculated directly.
  //
  // Full-batch gradient descent uses learning rate 1,
  // without momentum or early exaggeration.
  //
  // The first iteration's horizontal and vertical movements
  // are separated only for narration. They are components
  // of the same calculated update.
  //
  // The first three iterations reproduce the checked
  // positions and losses in the shared chapter data.
  //
  // Later iterations continue the same calculation.
  // Iteration 16 is a chosen teaching stopping point,
  // not a claim that optimization has fully converged.
  //
  // The attraction/repulsion arrows are visual explanations.
  // Actual dot movement uses exact calculated coordinates.
  //
  // The final gap-comparison sketches are explicitly
  // illustrative, not additional outputs of t-SNE.
  //
  // Actual browser playback, seek behavior, animation timing,
  // text metrics and phone/laptop rendering still require
  // verification inside site/live/engine.js.
}
